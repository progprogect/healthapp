// Socket.IO API route для Next.js App Router
import { NextRequest } from 'next/server';

// Этот файл нужен для корректной работы Socket.IO с Next.js App Router
// Сама логика Socket.IO находится в src/server/socket.ts

export async function GET(request: NextRequest) {
  // Socket.IO будет обрабатываться на уровне сервера
  // Этот route нужен только для совместимости с App Router
  return new Response('Socket.IO server', { status: 200 });
}

export async function POST(request: NextRequest) {
  // Socket.IO будет обрабатываться на уровне сервера
  return new Response('Socket.IO server', { status: 200 });
}
