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
      allowDangerousEmailAccountLinking: true,
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
    strategy: "jwt",
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
      // Para OAuth providers, vincular cuenta si el usuario ya existe
      if (account?.provider !== "credentials" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          });

          if (existingUser) {
            // Usuario existe, verificar si ya tiene esta cuenta vinculada
            const hasAccount = existingUser.accounts.some(
              acc => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            );

            if (!hasAccount) {
              // Vincular nueva cuenta OAuth al usuario existente
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                }
              });
            }
          }
        } catch (error) {
          console.error("Error linking account:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string || token.sub || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
