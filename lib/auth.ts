import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  // Usamos el adapter para persistir usuarios, pero mantenemos session JWT
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Modo Desarrollo",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "dev" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // En desarrollo, cualquier login es valido
        const user = {
          id: "dev-user-123",
          name: "Usuario de Prueba",
          email: "test@birracrucis.com",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        };
        return user;
      }
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  events: {
    async createUser(message) {
      const { user } = message;
      if (user.email) {
        console.log("New user created in DB:", user.email);
        try {
          await sendWelcomeEmail(user.email, user.name || "Amante de la cerveza");
        } catch (error) {
          console.error("Error sending welcome email in event:", error);
        }
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, user }) {
      // Con database sessions, el user viene de la DB
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
