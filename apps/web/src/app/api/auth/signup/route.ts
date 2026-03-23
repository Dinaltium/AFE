import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userProfiles } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, userType } = body as {
      name: string;
      email: string;
      password: string;
      userType: "creator" | "freelancer" | "consultant";
    };

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        userType: userType ?? "creator",
      })
      .returning();

    // Create profile
    await db.insert(userProfiles).values({ userId: newUser.id });

    return NextResponse.json({ id: newUser.id }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
