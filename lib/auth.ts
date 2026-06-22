import NextAuth, { AuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import UserModel, { IUser } from "@/models/User";

interface TokenWithId extends JWT {
  id?: string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password are required");
        }

        await dbConnect();
        const user = (await UserModel.findOne({ email: credentials.email.toLowerCase().trim() })) as IUser | null;
        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return { id: user._id.toString(), email: user.email } as NextAuthUser;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7
  },
  callbacks: {
    async jwt({ token, user }: { token: TokenWithId; user?: NextAuthUser }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: TokenWithId }) {
      const userSession = session.user as { id?: string; email?: string | null };
      if (token?.id) {
        userSession.id = token.id as string;
      }
      session.user = userSession;
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
};
