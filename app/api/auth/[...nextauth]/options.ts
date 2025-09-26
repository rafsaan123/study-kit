import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from '../../../lib/mongodb';
import { Student } from '../../../models/Student';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userType: { label: "User Type", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          if (credentials?.userType === 'teacher') {
            if (credentials.username === 'teacher' && credentials.password === 'test123') {
              return {
                id: '1',
                name: 'Teacher',
                email: 'teacher@example.com',
                userType: 'teacher'
              };
            }
          }

          await connectDB();
          const student = await Student.findOne({ studentId: credentials.username });

          if (!student) {
            throw new Error('No student found');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, student.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          // Return user data with all necessary fields
          return {
            id: student._id.toString(),
            name: student.name,
            email: student.studentId, // Using studentId as email
            userType: 'student',
            studentId: student.studentId,
            session: student.session,
            department: student.department,
            regulation: student.regulation
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        if (user.userType === 'student') {
          token.studentId = user.studentId;
          token.session = user.session;
          token.department = user.department;
          token.regulation = user.regulation;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.userType = token.userType;
        if (token.userType === 'student') {
          session.user.studentId = token.studentId;
          session.user.session = token.session;
          session.user.department = token.department;
          session.user.regulation = token.regulation;
        }
      }
      console.log("Session data being returned:", session); // Debug log
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
};