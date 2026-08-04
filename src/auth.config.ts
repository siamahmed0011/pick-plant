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

          const allowUnverified = process.env.ALLOW_UNVERIFIED_LOGIN?.trim().toLowerCase() !== "false";
          if (!allowUnverified && user.emailVerified === null) {
            return null;
          }

          const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
          if (!passwordMatches) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role as UserRole,
            passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0,
          };
        } catch (error) {
          console.error("[AuthAuthorize] User authentication lookup error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user.role as UserRole | undefined) ?? DEFAULT_USER_ROLE;
        token.pwdChangedAt = (user as { passwordChangedAt?: number }).passwordChangedAt ?? 0;
      } else if (token.id || token.sub) {
        const userId = (token.id as string) || token.sub;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordChangedAt: true, isActive: true },
          });

          if (!dbUser || !dbUser.isActive) {
            return {};
          }

          const dbPwdChangedAt = dbUser.passwordChangedAt ? dbUser.passwordChangedAt.getTime() : 0;
          const tokenPwdChangedAt = (token.pwdChangedAt as number | undefined) ?? 0;

          if (dbPwdChangedAt > tokenPwdChangedAt) {
            return {};
          }
        } catch (error) {
          console.error("[AuthJWT] Database error checking password timestamp:", error);
          // If DB is temporarily unavailable, retain current token
        }
      }
      return token;
    },
    session({ session, token }) {
      const userId = (token.id as string) || token.sub;
      if (session.user && userId) {
        session.user.id = userId;
        session.user.role = (token.role as UserRole | undefined) ?? DEFAULT_USER_ROLE;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
