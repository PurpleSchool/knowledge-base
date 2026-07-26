---
metaTitle: "WebSockets в JavaScript — двусторонняя связь в реальном времени"
metaDescription: "Как использовать WebSockets в JavaScript: создание соединения, отправка и получение сообщений, обработка ошибок, реальные примеры чата и уведомлений."
author: "Антон Ларичев"
title: "WebSockets в JavaScript"
preview: "WebSockets позволяют поддерживать постоянное двустороннее соединение между клиентом и сервером — без повторных HTTP-запросов."
---

## Что такое WebSockets

WebSocket — это протокол, который обеспечивает полнодуплексный канал связи поверх единственного TCP-соединения. В отличие от классической модели HTTP, где клиент всегда инициирует запрос, WebSocket позволяет серверу самостоятельно отправлять данные клиенту в любой момент.

Это делает WebSockets незаменимыми для:
- чатов и мессенджеров,
- онлайн-игр,
- систем уведомлений в реальном времени,
- совместного редактирования документов,
- финансовых тикеров и биржевых данных.

До появления WebSockets разработчики использовали обходные пути: polling (периодические запросы к серверу) и long polling (сервер держит соединение открытым до появления новых данных). Оба подхода неэффективны: они создают лишнюю нагрузку и имеют высокую задержку.

## Как работает протокол WebSocket

Соединение начинается с HTTP-запроса — так называемого handshake (рукопожатия). Клиент отправляет заголовок `Upgrade: websocket`, сервер отвечает статусом `101 Switching Protocols`, и после этого оба перехоят на протокол WebSocket.

```
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

После установки соединения данные передаются в виде фреймов — бинарных или текстовых. Соединение остаётся открытым до тех пор, пока одна из сторон не закроет его явно.

## Создание WebSocket-соединения

В браузере WebSocket доступен через встроенный глобальный класс `WebSocket`.

```javascript
const socket = new WebSocket('ws://localhost:3000');
```

Для защищённых соединений используется схема `wss://` (аналог HTTPS):

```javascript
const socket = new WebSocket('wss://api.example.com/ws');
```

Объект `WebSocket` сразу начинает устанавливать соединение. Отслеживать его состояние можно через свойство `readyState`:

| Значение | Константа | Описание |
|----------|-----------|----------|
| 0 | `CONNECTING` | Соединение устанавливается |
| 1 | `OPEN` | Соединение открыто |
| 2 | `CLOSING` | Соединение закрывается |
| 3 | `CLOSED` | Соединение закрыто |

## Основные события

WebSocket работает через события. Для каждого состояния есть свой обработчик.

### open

Срабатывает, когда соединение успешно установлено:

```javascript
const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', (event) => {
  console.log('Соединение установлено');
  socket.send('Привет, сервер!');
});
```

### message

Срабатывает при получении сообщения от сервера:

```javascript
socket.addEventListener('message', (event) => {
  console.log('Получено:', event.data);
});
```

Данные в `event.data` могут быть строкой, `Blob` или `ArrayBuffer` — в зависимости от типа отправленного сообщения.

### error

Срабатывает при ошибке соединения:

```javascript
socket.addEventListener('error', (event) => {
  console.error('Ошибка WebSocket:', event);
});
```

### close

Срабатывает при закрытии соединения — как со стороны клиента, так и со стороны сервера:

```javascript
socket.addEventListener('close', (event) => {
  console.log('Соединение закрыто');
  console.log('Код:', event.code);
  console.log('Причина:', event.reason);
  console.log('Корректное закрытие:', event.wasClean);
});
```

Событие `close` содержит код закрытия по стандарту RFC 6455. Код `1000` означает нормальное завершение, коды `1001`–`1015` описывают различные ошибки.

## Отправка данных

Метод `send()` позволяет отправлять данные на сервер. Он принимает строку, `Blob`, `ArrayBuffer` или `ArrayBufferView`.

```javascript
// Отправка строки
socket.send('Hello, server!');

// Отправка JSON
const message = { type: 'chat', text: 'Привет всем!', user: 'Иван' };
socket.send(JSON.stringify(message));

// Отправка бинарных данных
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);
view.setInt32(0, 42);
socket.send(buffer);
```

Вызывать `send()` можно только когда `readyState === WebSocket.OPEN`. Если вызвать раньше — браузер выбросит исключение.

```javascript
function safeSend(socket, data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(typeof data === 'string' ? data : JSON.stringify(data));
  } else {
    console.warn('Соединение не открыто, readyState:', socket.readyState);
  }
}
```

## Закрытие соединения

Закрыть соединение можно методом `close()`. Первый аргумент — код закрытия (по умолчанию `1000`), второй — строковая причина:

```javascript
// Нормальное закрытие
socket.close();

// Закрытие с кодом и причиной
socket.close(1001, 'Пользователь вышел со страницы');
```

## Практический пример: простой чат

Рассмотрим полноценный пример клиентской части чата:

```javascript
class ChatClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener('open', () => {
      console.log('Подключён к чату');
      this.reconnectDelay = 1000;
      this.onConnect();
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch {
        console.error('Не удалось разобрать сообщение:', event.data);
      }
    });

    this.socket.addEventListener('close', (event) => {
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    });

    this.socket.addEventListener('error', () => {
      // ошибка всегда предшествует close, поэтому переподключение — в close
    });
  }

  send(text, username) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'message',
        text,
        username,
        timestamp: Date.now(),
      }));
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'message':
        this.onMessage(data);
        break;
      case 'users':
        this.onUsersUpdate(data.users);
        break;
      default:
        console.warn('Неизвестный тип сообщения:', data.type);
    }
  }

  scheduleReconnect() {
    console.log(`Переподключение через ${this.reconnectDelay}мс...`);
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  disconnect() {
    this.socket?.close(1000, 'Пользователь вышел');
  }

  // Хуки для переопределения
  onConnect() {}
  onMessage(data) {}
  onUsersUpdate(users) {}
}
```

Использование:

```javascript
const chat = new ChatClient('wss://chat.example.com/ws');

chat.onConnect = () => {
  document.getElementById('status').textContent = 'Подключён';
};

chat.onMessage = ({ username, text, timestamp }) => {
  const time = new Date(timestamp).toLocaleTimeString();
  appendMessage(`[${time}] ${username}: ${text}`);
};

chat.onUsersUpdate = (users) => {
  updateUserList(users);
};

chat.connect();

document.getElementById('send-btn').addEventListener('click', () => {
  const input = document.getElementById('message-input');
  chat.send(input.value, 'Иван');
  input.value = '';
});
```

## Автоматическое переподключение

Sockets нестабильны — сеть может прерваться, сервер перезапуститься. Хорошая практика — реализовать экспоненциальный backoff при переподключении, как показано выше в методе `scheduleReconnect()`. Задержка удваивается после каждой неудачной попытки, но ограничена максимумом (например, 30 секунд).

Также стоит отслеживать, хочет ли пользователь реально отключиться или соединение разорвалось само:

```javascript
class ReconnectingWebSocket {
  constructor(url) {
    this.url = url;
    this.intentionallyClosed = false;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('close', () => {
      if (!this.intentionallyClosed) {
        setTimeout(() => this.connect(), 3000);
      }
    });
  }

  close() {
    this.intentionallyClosed = true;
    this.ws.close();
  }

  send(data) {
    this.ws.send(data);
  }
}
```

## Работа с бинарными данными

WebSocket умеет передавать не только текст, но и бинарные данные. Это важно для передачи изображений, аудио, игровых состояний.

Настроить тип получаемых бинарных данных можно через свойство `binaryType`:

```javascript
const socket = new WebSocket('ws://localhost:3000');
socket.binaryType = 'arraybuffer'; // по умолчанию 'blob'

socket.addEventListener('message', (event) => {
  if (event.data instanceof ArrayBuffer) {
    const view = new DataView(event.data);
    const value = view.getInt32(0);
    console.log('Получено число:', value);
  } else {
    console.log('Получена строка:', event.data);
  }
});
```

## Простой сервер на Node.js

Для быстрого тестирования клиентского кода удобно поднять сервер на Node.js с библиотекой `ws`:

```bash
npm install ws
```

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Новый клиент подключился. Всего:', clients.size);

  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch {
      return;
    }

    // Рассылаем всем подключённым клиентам
    const payload = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Клиент отключился. Осталось:', clients.size);
  });
});

console.log('WebSocket-сервер запущен на ws://localhost:3000');
```

## Heartbeat: проверка живости соединения

Некоторые прокси-серверы и балансировщики нагрузки разрывают «молчащие» соединения. Чтобы этого избежать, используют механизм ping/pong:

```javascript
function startHeartbeat(socket, interval = 30000) {
  const timer = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(timer);
    }
  }, interval);

  socket.addEventListener('close', () => clearInterval(timer));

  return timer;
}

const socket = new WebSocket('ws://localhost:3000');
socket.addEventListener('open', () => startHeartbeat(socket));

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'pong') return; // игнорируем служебные сообщения
  // обрабатываем остальные сообщения
});
```

## WebSockets vs Server-Sent Events vs Polling

| Метод | Направление | Поддержка | Когда использовать |
|-------|-------------|-----------|--------------------|
| Polling | Клиент → Сервер | Везде | Простые случаи, нет реального времени |
| Server-Sent Events | Сервер → Клиент | Современные браузеры | Только push от сервера (уведомления, новости) |
| WebSocket | Двусторонний | Современные браузеры | Чат, игры, совместная работа |

Server-Sent Events (SSE) проще в реализации, если нужно только получать данные от сервера. WebSocket — правильный выбор, когда клиент тоже активно отправляет данные.

## Типичные ошибки

**Отправка до открытия соединения.** Вызов `send()` до события `open` вызывает ошибку. Всегда дожидайтесь открытия или буферизируйте сообщения.

**Отсутствие обработки переподключения.** Сети ненадёжны. Без автопереподключения пользователи будут видеть разорванное соединение без возможности восстановления.

**Игнорирование типа данных.** Если сервер отправляет JSON, не забудьте `JSON.parse(event.data)`. Если бинарные данные — настройте `binaryType`.

**Утечка обработчиков событий.** Если WebSocket создаётся динамически, убедитесь, что при его уничтожении вы вызываете `close()` и убираете обработчики.

```javascript
// Правильное уничтожение
function destroySocket(socket) {
  socket.close(1000, 'Компонент удалён');
  // removeEventListener не нужен, если использовали addEventListener
  // — они автоматически удалятся вместе с объектом
}
```

## Итог

WebSockets — мощный инструмент для приложений реального времени. Ключевые моменты:

- Используйте `wss://` в продакшне (как HTTPS для HTTP).
- Всегда реализуйте логику переподключения с экспоненциальной задержкой.
- Передавайте структурированные данные через JSON или бинарный протокол.
- Добавьте heartbeat, если соединение может простаивать долгое время.
- Разделяйте типы сообщений через поле `type` в JSON-объекте.

С этими базовыми принципами вы сможете построить надёжную real-time систему на чистом JavaScript.

Чтобы глубже разобраться с асинхронностью и современными API браузера — изучите курс по JavaScript на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=websockets-javascript