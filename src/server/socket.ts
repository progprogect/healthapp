import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';

// Типы для Socket.IO событий
export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

export interface MessageNewEvent {
  threadId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  };
}

export interface MessageReadEvent {
  threadId: string;
  readerId: string;
}

export interface ThreadUpdatedEvent {
  threadId: string;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

// Глобальная переменная для хранения Socket.IO сервера
let io: SocketIOServer | null = null;

// Функция для получения пользователя из сессии NextAuth
async function getUserFromSession(cookie: string): Promise<SocketUser | null> {
  try {
    // Создаем фиктивный request для getServerSession
    const request = new Request('http://localhost:3001/api/auth/session', {
      headers: {
        cookie,
      },
    });

    // Получаем сессию из cookie
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: session.user.role || 'CLIENT',
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

// Инициализация Socket.IO сервера
export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Middleware для авторизации
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie;
      
      if (!cookie) {
        console.log('Socket connection rejected: no cookie');
        return next(new Error('Authentication required'));
      }

      const user = await getUserFromSession(cookie);
      
      if (!user) {
        console.log('Socket connection rejected: invalid session');
        return next(new Error('Invalid session'));
      }

      // Добавляем пользователя в объект сокета
      (socket as any).user = user;
      console.log(`Socket connected: ${user.email} (${user.role})`);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Обработка подключений
  io.on('connection', (socket) => {
    const user = (socket as any).user as SocketUser;
    
    console.log(`User ${user.email} connected with socket ${socket.id}`);

    // Присоединение к комнате треда
    socket.on('join:thread', (threadId: string) => {
      const roomName = `thread:${threadId}`;
      socket.join(roomName);
      console.log(`User ${user.email} joined room ${roomName}`);
    });

    // Покидание комнаты треда
    socket.on('leave:thread', (threadId: string) => {
      const roomName = `thread:${threadId}`;
      socket.leave(roomName);
      console.log(`User ${user.email} left room ${roomName}`);
    });

    // Отключение
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.email} disconnected: ${reason}`);
    });
  });

  return io;
}

// Функции для эмита событий (будут использоваться в API routes)
export function emitMessageNew(threadId: string, message: MessageNewEvent['message']) {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  const roomName = `thread:${threadId}`;
  const event: MessageNewEvent = {
    threadId,
    message,
  };

  io.to(roomName).emit('message:new', event);
  console.log(`Emitted message:new to room ${roomName}`);
}

export function emitMessageRead(threadId: string, readerId: string) {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  const roomName = `thread:${threadId}`;
  const event: MessageReadEvent = {
    threadId,
    readerId,
  };

  io.to(roomName).emit('message:read', event);
  console.log(`Emitted message:read to room ${roomName}`);
}

export function emitThreadUpdated(threadId: string, lastMessage: ThreadUpdatedEvent['lastMessage'], unreadCount: number) {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  const roomName = `thread:${threadId}`;
  const event: ThreadUpdatedEvent = {
    threadId,
    lastMessage,
    unreadCount,
  };

  // Эмитим всем пользователям, которые состоят в этом треде
  io.to(roomName).emit('thread:updated', event);
  console.log(`Emitted thread:updated to room ${roomName}`);
}

// API route для Socket.IO (Next.js App Router)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket?.server?.io) {
    res.end();
    return;
  }

  const httpServer = res.socket?.server as HTTPServer;
  const socketServer = initializeSocketIO(httpServer);
  
  res.socket.server.io = socketServer;
  res.end();
}

// Экспорт для использования в других модулях
export { io };
