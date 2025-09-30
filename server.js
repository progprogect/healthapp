// Кастомный сервер для интеграции Socket.IO с Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

// Создаем Next.js приложение
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Создаем HTTP сервер
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Инициализируем Socket.IO
  const io = new Server(server, {
    cors: {
      origin: dev 
        ? ["http://localhost:3000", "http://localhost:3001"]
        : process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Middleware для авторизации Socket.IO через JWT
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.token;
      
      if (!userId) {
        console.log('Socket connection rejected: no user ID');
        return next(new Error('Authentication required'));
      }

      // Добавляем пользователя в объект сокета
      socket.user = {
        id: userId,
        email: '',
        role: 'CLIENT',
      };

      console.log(`Socket connected: user ${socket.user.id}`);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Обработка подключений Socket.IO
  io.on('connection', (socket) => {
    const user = socket.user;
    
    console.log(`User ${user.email} connected with socket ${socket.id}`);

    // Присоединение к комнате треда
    socket.on('join:thread', (threadId) => {
      const roomName = `thread:${threadId}`;
      socket.join(roomName);
      console.log(`User ${user.email} joined room ${roomName}`);
    });

    // Покидание комнаты треда
    socket.on('leave:thread', (threadId) => {
      const roomName = `thread:${threadId}`;
      socket.leave(roomName);
      console.log(`User ${user.email} left room ${roomName}`);
    });

    // Отключение
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.email} disconnected: ${reason}`);
    });
  });

  // Сохраняем Socket.IO сервер в глобальной переменной для использования в API routes
  global.io = io;

  // Функции для эмита событий
  global.emitMessageNew = (threadId, message) => {
    const roomName = `thread:${threadId}`;
    const event = {
      threadId,
      message,
    };
    io.to(roomName).emit('message:new', event);
    console.log(`Emitted message:new to room ${roomName}`);
  };

  global.emitMessageRead = (threadId, readerId) => {
    const roomName = `thread:${threadId}`;
    const event = {
      threadId,
      readerId,
    };
    io.to(roomName).emit('message:read', event);
    console.log(`Emitted message:read to room ${roomName}`);
  };

  global.emitThreadUpdated = (threadId, lastMessage, unreadCount) => {
    const roomName = `thread:${threadId}`;
    const event = {
      threadId,
      lastMessage,
      unreadCount,
    };
    io.to(roomName).emit('thread:updated', event);
    console.log(`Emitted thread:updated to room ${roomName}`);
  };

  // Запускаем сервер
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on /api/socket`);
  });
});
