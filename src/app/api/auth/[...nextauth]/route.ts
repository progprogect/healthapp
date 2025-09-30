import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  session: { 
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const user = await prisma.user.findUnique({ 
          where: { email },
          include: { clientProfile: true, specialistProfile: true }
        })

        if (!user) {
          return null
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.clientProfile?.displayName || user.specialistProfile?.displayName || user.email,
          profiles: {
            hasClient: !!user.clientProfile,
            hasSpecialist: !!user.specialistProfile
          }
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
        async jwt({ token, user }: { token: any; user: any }) {
          if (user) {
            token.role = user.role
            token.profiles = user.profiles
          }
          return token
        },
        async session({ session, token }: { session: any; token: any }) {
          if (token) {
            session.user.id = token.sub
            session.user.role = token.role
            session.user.profiles = token.profiles
          }
          return session
        },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }
