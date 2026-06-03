import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signInSchema } from "@/lib/validations/auth";

async function getUserRole(userId: number, email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(email.toLowerCase())) return "ADMIN";

  const rows = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role::text AS role FROM "User" WHERE id = ${userId} LIMIT 1
  `;

  return rows[0]?.role || "USER";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = signInSchema.safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            emailVerified: true,
          },
        });

        if (!user?.passwordHash) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: await getUserRole(user.id, user.email),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = String(token.role || "USER");
      }

      return session;
    },
  },
};
