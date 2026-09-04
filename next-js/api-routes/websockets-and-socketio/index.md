---
metaTitle: "WebSockets и Socket.io в Next.js — руководство"
metaDescription: "Как подключить WebSockets и Socket.io к Next.js: пользовательский сервер, клиентский хук, аутентификация и масштабирование с Redis."
author: "Антон Ларичев"
title: "Next.js с WebSockets и Socket.io"
preview: "Интеграция Socket.io с Next.js через пользовательский сервер, создание чата в реальном времени, аутентификация соединений и масштабирование с Redis."
---

## Что такое WebSockets и зачем они нужны в Next.js

WebSocket — протокол двусторонней связи между клиентом и сервером через единственное постоянное соединение. В отличие от HTTP, где клиент всегда инициирует запрос, WebSocket позволяет серверу самостоятельно отправлять данные в любой момент.

Это делает WebSockets незаменимыми для:
- Чат-приложений и мессенджеров
- Уведомлений в реальном времени
- Совместного редактирования документов
- Онлайн-игр и торговых терминалов
- Отслеживания геолокации

Socket.io — популярная библиотека, которая надстраивается над WebSocket и добавляет автоматическое переподключение, комнаты, пространства имён и фолбэк на long-polling при отсутствии поддержки WebSocket.

## Ограничения стандартного подхода в Next.js

Стандартные Route Handlers в Next.js возвращают ответ и завершают соединение — они не рассчитаны на долгоживущие соединения WebSocket.

Есть два основных подхода к интеграции Socket.io с Next.js:

1. **Пользовательский сервер** (Custom Server) — запуск отдельного Node.js-сервера рядом с Next.js
2. **Отдельный WebSocket-сервер** — вынесение Socket.io в самостоятельный микросервис

## Подход 1: Пользовательский сервер с Socket.io

### Установка зависимостей

```bash
npm install socket.io socket.io-client
```

### Создание пользовательского сервера

Создайте файл `server.js` в корне проекта:

```javascript
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Клиент подключился: ${socket.id}`);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", { userId: socket.id });
    });

    socket.on("send-message", ({ roomId, message, author }) => {
      io.to(roomId).emit("new-message", {
        id: Date.now(),
        message,
        author,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`Клиент отключился: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Сервер запущен на http://${hostname}:${port}`);
  });
});
```

### Обновление package.json

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

Важно: при использовании пользовательского сервера `next dev` больше не используется — запуск осуществляется через `node server.js`.

## Подход 2: Отдельный WebSocket-сервер

Этот вариант лучше подходит для продакшена и микросервисной архитектуры.

### Структура проекта

```
/
├── apps/
│   ├── web/          # Next.js приложение
│   └── ws-server/    # Отдельный WebSocket-сервер
└── package.json
```

### WebSocket-сервер (apps/ws-server/index.js)

```javascript
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send-message", (data) => {
    io.to(data.roomId).emit("new-message", data);
  });
});

const WS_PORT = process.env.WS_PORT || 3001;
httpServer.listen(WS_PORT, () => {
  console.log(`WebSocket-сервер запущен на порту ${WS_PORT}`);
});
```

## Клиентская часть в Next.js

### Создание хука для Socket.io

Создайте файл `hooks/use-socket.ts`:

```typescript
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  url?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const url =
    options.url ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:3000";

  useEffect(() => {
    const socket = io(url, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [url]);

  return { socket: socketRef.current, isConnected };
}
```

### Компонент чата

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";

interface Message {
  id: number;
  message: string;
  author: string;
  timestamp: string;
}

interface ChatProps {
  roomId: string;
  username: string;
}

export function Chat({ roomId, username }: ChatProps) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join-room", roomId);

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-joined", ({ userId }: { userId: string }) => {
      console.log(`Пользователь ${userId} присоединился к комнате`);
    });

    return () => {
      socket.off("new-message");
      socket.off("user-joined");
    };
  }, [socket, isConnected, roomId]);

  const sendMessage = useCallback(() => {
    if (!socket || !inputValue.trim()) return;

    socket.emit("send-message", {
      roomId,
      message: inputValue,
      author: username,
    });

    setInputValue("");
  }, [socket, inputValue, roomId, username]);

  return (
    <div className="chat-container">
      <div className="status">
        {isConnected ? "Подключено" : "Отключено"}
      </div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.author}:</strong> {msg.message}
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Введите сообщение..."
        />
        <button onClick={sendMessage}>Отправить</button>
      </div>
    </div>
  );
}
```

## Пространства имён и комнаты

Socket.io поддерживает пространства имён (namespaces) для логического разделения соединений и комнаты (rooms) для группировки клиентов.

### Пространства имён на сервере

```javascript
const chatNamespace = io.of("/chat");
const notificationsNamespace = io.of("/notifications");

chatNamespace.on("connection", (socket) => {
  socket.on("send-message", (data) => {
    chatNamespace.to(data.roomId).emit("new-message", data);
  });
});

notificationsNamespace.on("connection", (socket) => {
  socket.on("subscribe", (userId) => {
    socket.join(`user:${userId}`);
  });
});

function sendNotification(userId, notification) {
  notificationsNamespace
    .to(`user:${userId}`)
    .emit("notification", notification);
}
```

### Подключение к пространству имён на клиенте

```typescript
import { io } from "socket.io-client";

const chatSocket = io("http://localhost:3000/chat");
const notificationsSocket = io("http://localhost:3000/notifications");

notificationsSocket.on("connect", () => {
  notificationsSocket.emit("subscribe", currentUserId);
});

notificationsSocket.on("notification", (notification) => {
  showToast(notification.message);
});
```

## Аутентификация WebSocket-соединений

Для защищённых приложений необходимо проверять подлинность WebSocket-соединений.

### Передача токена при подключении

```typescript
// Клиент
const socket = io("http://localhost:3000", {
  auth: {
    token: localStorage.getItem("access-token"),
  },
});
```

### Middleware для проверки токена на сервере

```javascript
const jwt = require("jsonwebtoken");

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Токен авторизации отсутствует"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error("Недействительный токен"));
  }
});

io.on("connection", (socket) => {
  const { user } = socket.data;
  console.log(`Пользователь ${user.name} подключился`);
  socket.join(`user:${user.id}`);
});
```

## Масштабирование с Redis Adapter

При развёртывании нескольких экземпляров сервера необходим общий брокер сообщений. Socket.io поддерживает Redis через официальный адаптер.

```bash
npm install @socket.io/redis-adapter ioredis
```

```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("ioredis");

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  httpServer.listen(port);
});
```

С Redis-адаптером события, отправленные на одном экземпляре сервера, автоматически доставляются клиентам, подключённым к другим экземплярам.

## Мониторинг активных соединений

```javascript
io.on("connection", async (socket) => {
  const sockets = await io.fetchSockets();
  console.log(`Активных соединений: ${sockets.length}`);

  socket.on("disconnect", async () => {
    const remaining = await io.fetchSockets();
    console.log(`Активных соединений: ${remaining.length}`);
  });
});
```

## Особенности деплоя

### Vercel и serverless-окружения

Vercel не поддерживает WebSockets в serverless-функциях — постоянные соединения несовместимы с моделью запрос/ответ. Для деплоя на Vercel WebSocket-сервер необходимо выносить в отдельный сервис (Railway, Render, Fly.io или собственный VPS).

```bash
# .env.local
NEXT_PUBLIC_SOCKET_URL=https://ws.your-domain.com
```

### Nginx как прокси для WebSocket

```nginx
server {
  listen 80;
  server_name ws.your-domain.com;

  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Заголовки `Upgrade` и `Connection` обязательны — без них Nginx не передаст WebSocket-соединение бэкенду.

## Итог

WebSockets в Next.js требуют выхода за рамки стандартных Route Handlers. Оптимальная стратегия:

- Для прототипов и небольших проектов — пользовательский сервер с Socket.io в том же процессе
- Для продакшена и масштабируемых систем — отдельный WebSocket-сервис с Redis-адаптером
- При хостинге на Vercel — обязательное вынесение WebSocket-сервера на отдельную инфраструктуру

Socket.io значительно упрощает работу с WebSockets благодаря встроенным механизмам переподключения, комнатам и фолбэку на polling при недоступности WebSocket.

Освоить Next.js с нуля до уровня production-разработчика можно на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-websockets-socketio).