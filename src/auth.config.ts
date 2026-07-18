import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DEFAULT_USER_ROLE, type UserRole } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

const authConfig = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/login",
  },
  // Auth.js requires JWT sessions when the Credentials provider is enabled.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email address", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          });

          if (!user?.isActive || !user.passwordHash) return null;

          const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
          if (!passwordMatches) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role as UserRole,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user.role as UserRole | undefined) ?? DEFAULT_USER_ROLE;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? DEFAULT_USER_ROLE;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
