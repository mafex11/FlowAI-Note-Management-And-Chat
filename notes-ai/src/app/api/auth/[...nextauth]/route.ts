import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          await connectToDatabase();

          const user = await User.findOne({ email: credentials.email }).select("+password");
          
          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordMatched = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordMatched) {
            throw new Error("Incorrect password");
          }

          console.log("User authenticated successfully:", user.email);
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split("@")[0]
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        console.log("JWT callback - user data added to token:", user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        console.log("Session callback - user ID added to session:", token.id);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 