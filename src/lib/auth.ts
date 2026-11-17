import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const owner = await db.clubOwner.findUnique({
          where: { email: parsed.data.email },
          include: { club: true },
        });
        if (!owner) return null;

        const valid = await bcrypt.compare(parsed.data.password, owner.passwordHash);
        if (!valid) return null;

        return { id: owner.id, name: owner.name, email: owner.email, clubId: owner.clubId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.clubId = (user as typeof user & { clubId: string }).clubId;
      return token;
    },
    session({ session, token }) {
      session.user.clubId = token.clubId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

declare module "next-auth" {
  interface Session {
    user: { clubId: string; name?: string | null; email?: string | null; image?: string | null };
  }
}
