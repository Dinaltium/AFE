import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userProfiles, accounts, sessions, verificationTokens, connectorAccounts } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt", maxAge: 7200, updateAge: 300 },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Capture Google OAuth tokens for the Gmail connector
      if (account && account.provider === "google") {
        const userId = token.id as string;
        if (userId) {
          try {
            const existing = await db
              .select()
              .from(connectorAccounts)
              .where(
                and(
                  eq(connectorAccounts.userId, userId),
                  eq(connectorAccounts.type, "gmail")
                )
              )
              .limit(1);

            const config = {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              scope: account.scope,
              expiresAt: account.expires_at,
            };

            if (existing.length > 0) {
              await db
                .update(connectorAccounts)
                .set({
                  status: "connected",
                  config,
                  lastSyncedAt: new Date(),
                })
                .where(eq(connectorAccounts.id, existing[0].id));
            } else {
              await db.insert(connectorAccounts).values({
                userId,
                type: "gmail",
                status: "connected",
                config,
              });
            }
          } catch (error) {
            console.error("Failed to save connector tokens:", error);
          }
        }
      }

      // Fetch extra user fields
      if (token.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser) {
          token.userType = dbUser.userType ?? undefined;
          token.isAdmin = dbUser.isAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as string | undefined;
        session.user.isAdmin = token.isAdmin as boolean | undefined;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create user_profiles row after sign in
      if (!user.id) return;
      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(userProfiles).values({ userId: user.id });
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
