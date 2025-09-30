import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
  displayName: z.string().min(2, "Имя должно содержать минимум 2 символа").max(60, "Имя слишком длинное").optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, displayName } = registerSchema.parse(body)

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 409 }
      )
    }

    // Хешируем пароль
    const passwordHash = await hash(password, 11)

    // Создаем пользователя с профилем клиента
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: "CLIENT",
        status: "ACTIVE",
        clientProfile: {
          create: {
            displayName: displayName || email.split('@')[0],
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        clientProfile: {
          select: {
            displayName: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.clientProfile?.displayName
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
