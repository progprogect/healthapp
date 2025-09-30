import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      name?: string
      profiles?: {
        hasClient: boolean
        hasSpecialist: boolean
      }
    }
  }

  interface User {
    id: string
    email: string
    role: string
    name?: string
    profiles?: {
      hasClient: boolean
      hasSpecialist: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    profiles?: {
      hasClient: boolean
      hasSpecialist: boolean
    }
  }
}
