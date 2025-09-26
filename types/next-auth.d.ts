import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType: string;
      studentId?: string;
      session?: string;
      department?: string;
      regulation?: number;
    }
  }

  interface User {
    userType: string;
    studentId?: string;
    session?: string;
    department?: string;
    regulation?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: string;
    studentId?: string;
    session?: string;
    department?: string;
    regulation?: number;
  }
}