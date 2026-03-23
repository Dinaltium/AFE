import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType?: string;
      isAdmin?: boolean;
    };
  }

  interface User {
    userType?: string;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    userType?: string;
    isAdmin?: boolean;
  }
}
