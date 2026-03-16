/**
 * lib/auth/config.ts — NextAuth v4 configuration
 * Credentials provider with bcrypt validation + role in session
 */
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import type { Role } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape (OWASP A03 — injection prevention)
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Fetch user from DB
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        // 3. Compare hashed password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 4. Update lastLogin timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
        };
      },
    }),
  ],

  // JWT strategy — stateless, works with App Router
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8-hour sessions

  callbacks: {
    // Persist role to JWT so it's always available without a DB hit
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    // Expose role + id on the client-side session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // CSRF protection is built into NextAuth
  secret: process.env.NEXTAUTH_SECRET,
};
