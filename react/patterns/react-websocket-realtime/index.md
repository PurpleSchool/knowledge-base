---
metaTitle: "React WebSocket: реалтайм в компонентах"
metaDescription: "Как подключить WebSocket в React-компоненты через кастомные хуки, Context API и переподключение с экспоненциальной задержкой."
author: "Антон Ларичев"
title: "React с WebSocket — реалтайм в компонентах"
preview: "Создаём кастомный хук useWebSocket, реализуем автопереподключение, разделяем соединение через Context и тестируем реалтайм-компоненты."
---

## Что такое WebSocket и зачем он нужен в React

WebSocket — протокол двусторонней связи между клиентом и сервером по одному постоянному TCP-соединению. В отличие от HTTP, где клиент всегда инициирует запрос, WebSocket позволяет серверу самостоятельно отправлять данные клиенту в любой момент.

В React-приложениях WebSocket применяется для чатов и мессенджеров, отображения биржевых котировок в реальном времени, системных уведомлений, совместного редактирования документов и онлайн-дашбордов с живыми метриками.

## Нативный WebSocket API

Браузер предоставляет встроенный класс `WebSocket`. Базовый пример работы:

```javascript
const socket = new WebSocket('wss://example.com/ws');

socket.onopen = () => {
  console.log('Соединение установлено');
  socket.send(JSON.stringify({ type: 'hello' }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Получено:', data);
};

socket.onerror = (error) => {
  console.error('Ошибка:', error);
};

socket.onclose = () => {
  console.log('Соединение закрыто');
};
```

Прямое использование этого API внутри компонентов ведёт к утечкам памяти и дублированию логики. Правильный подход — вынести WebSocket в кастомный хук.

## Создание кастомного хука useWebSocket

Хорошо спроектированный хук инкапсулирует создание соединения, подписку на события и очистку при размонтировании компонента.

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed';

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  send: (data: unknown) => void;
  close: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const optionsRef = useRef(options);

  optionsRef.current = options;

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus('connecting');

    socket.onopen = () => {
      setStatus('open');
      optionsRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        optionsRef.current.onMessage?.(data);
      } catch {
        optionsRef.current.onMessage?.(event.data);
      }
    };

    socket.onerror = (error) => {
      optionsRef.current.onError?.(error);
    };

    socket.onclose = () => {
      setStatus('closed');
      optionsRef.current.onClose?.();
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  const close = useCallback(() => {
    socketRef.current?.close();
  }, []);

  return { status, send, close };
}
```

Ключевые решения в этом хуке:

- `optionsRef` хранит актуальные коллбэки без перезапуска `useEffect`. Если передавать `options` напрямую в зависимости, каждый рендер будет пересоздавать соединение.
- Очистка в `return () => socket.close()` гарантирует закрытие соединения при размонтировании.
- `send` проверяет `readyState` перед отправкой — это предотвращает ошибки при попытке отправить сообщение до открытия соединения.

## Использование хука в компоненте

Пример простого чата с использованием `useWebSocket`:

```typescript
import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const { status, send } = useWebSocket(
    `wss://api.example.com/chat/${roomId}`,
    {
      onMessage: (data) => {
        const message = data as ChatMessage;
        setMessages((prev) => [...prev, message]);
      },
    }
  );

  const handleSend = () => {
    if (!inputText.trim()) return;
    send({ type: 'message', text: inputText });
    setInputText('');
  };

  return (
    <div>
      <div>Статус: {status}</div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.author}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        disabled={status !== 'open'}
      />
      <button onClick={handleSend} disabled={status !== 'open'}>
        Отправить
      </button>
    </div>
  );
}
```

## Автоматическое переподключение

В продакшн-приложениях соединение может прерваться из-за проблем с сетью. Добавим логику переподключения с экспоненциальной задержкой:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseReconnectingWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  maxRetries?: number;
  retryInterval?: number;
}

export function useReconnectingWebSocket(
  url: string,
  options: UseReconnectingWebSocketOptions = {}
) {
  const { maxRetries = 5, retryInterval = 1000 } = options;
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'failed'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const optionsRef = useRef(options);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus('connecting');

    socket.onopen = () => {
      if (!isMountedRef.current) return;
      retryCountRef.current = 0;
      setRetryCount(0);
      setStatus('open');
      optionsRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        optionsRef.current.onMessage?.(JSON.parse(event.data));
      } catch {
        optionsRef.current.onMessage?.(event.data);
      }
    };

    socket.onclose = () => {
      if (!isMountedRef.current) return;
      optionsRef.current.onClose?.();

      if (retryCountRef.current < maxRetries) {
        const delay = retryInterval * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        setStatus('connecting');
        setTimeout(connect, delay);
      } else {
        setStatus('failed');
      }
    };
  }, [url, maxRetries, retryInterval]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      socketRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { status, retryCount, send };
}
```

Экспоненциальная задержка (`retryInterval * 2^retryCount`) предотвращает шторм запросов при массовом переподключении клиентов после падения сервера. После исчерпания попыток статус переходит в `failed`, и компонент отображает пользователю соответствующее сообщение.

## Паттерн с контекстом для общего соединения

Когда несколько компонентов должны использовать одно WebSocket-соединение, выносим его в React Context:

```typescript
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WebSocketContextValue {
  status: string;
  send: (data: unknown) => void;
  subscribe: (handler: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<(data: unknown) => void>>(new Set());

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setStatus('open');
    socket.onclose = () => setStatus('closed');
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlersRef.current.forEach((handler) => handler(data));
      } catch {
        handlersRef.current.forEach((handler) => handler(event.data));
      }
    };

    return () => socket.close();
  }, [url]);

  const send = (data: unknown) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  const subscribe = (handler: (data: unknown) => void) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  };

  return (
    <WebSocketContext.Provider value={{ status, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used inside WebSocketProvider');
  }
  return context;
}
```

Подписка через `Set` позволяет нескольким компонентам независимо обрабатывать сообщения. Каждый вызов `subscribe` возвращает функцию отписки для использования в `useEffect`:

```typescript
function NotificationBadge() {
  const [count, setCount] = useState(0);
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe((data: unknown) => {
      const msg = data as { type: string };
      if (msg.type === 'notification') {
        setCount((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return <span>{count}</span>;
}
```

## Отображение данных в реальном времени: пример с котировками

Практический пример — компонент для отображения биржевых котировок:

```typescript
interface StockPrice {
  symbol: string;
  price: number;
  change: number;
}

function StockTicker({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState<StockPrice | null>(null);

  const { status } = useWebSocket(
    `wss://market.example.com/stocks/${symbol}`,
    {
      onMessage: (data) => setPrice(data as StockPrice),
    }
  );

  if (status === 'connecting') {
    return <div>Подключение...</div>;
  }

  if (status === 'closed' || !price) {
    return <div>Нет данных</div>;
  }

  return (
    <div>
      <span>{price.symbol}</span>
      <span>{price.price.toFixed(2)} $</span>
      <span style={{ color: price.change >= 0 ? 'green' : 'red' }}>
        {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
      </span>
    </div>
  );
}
```

## Типизация сообщений с дискриминируемыми объединениями

При работе с несколькими типами сообщений TypeScript помогает сохранить типобезопасность через дискриминируемые объединения:

```typescript
type ServerMessage =
  | { type: 'chat'; payload: { author: string; text: string } }
  | { type: 'notification'; payload: { title: string; body: string } }
  | { type: 'user_joined'; payload: { username: string } }
  | { type: 'error'; payload: { code: number; message: string } };

function handleMessage(data: unknown): void {
  const message = data as ServerMessage;

  switch (message.type) {
    case 'chat':
      addMessageToChat(message.payload.author, message.payload.text);
      break;
    case 'notification':
      showNotification(message.payload.title, message.payload.body);
      break;
    case 'user_joined':
      addUserToList(message.payload.username);
      break;
    case 'error':
      handleError(message.payload.code, message.payload.message);
      break;
  }
}
```

Компилятор TypeScript гарантирует, что в каждой ветке `switch` вы обращаетесь только к полям, существующим у данного типа сообщения.

## Тестирование компонентов с WebSocket

Для тестирования компонентов, использующих WebSocket, подменяем глобальный конструктор моком:

```typescript
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readyState = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send = jest.fn();

  close = jest.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  });

  simulateMessage(data: unknown) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    this.onmessage?.(event);
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

test('отображает входящие сообщения', async () => {
  render(<ChatRoom roomId="test-room" />);

  await waitFor(() => {
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  const socket = MockWebSocket.instances[0];
  socket.simulateMessage({
    id: '1',
    author: 'Alice',
    text: 'Привет!',
    timestamp: Date.now(),
  });

  expect(await screen.findByText('Alice:')).toBeInTheDocument();
  expect(screen.getByText('Привет!')).toBeInTheDocument();
});
```

Метод `simulateMessage` имитирует входящие сообщения от сервера, не поднимая реального соединения.

## Частые ошибки

**Создание соединения вне `useEffect`.** Если написать `const socket = new WebSocket(url)` на уровне тела компонента, новый экземпляр будет создаваться при каждом рендере. Всегда создавайте WebSocket внутри `useEffect`.

**Бесконечный цикл из-за зависимостей.** Передача объекта коллбэков напрямую в массив зависимостей `useEffect` вызовет переподключение при каждом рендере, поскольку объект создаётся заново. Используйте `useRef` для хранения актуальных коллбэков.

**Отсутствие очистки.** Без `return () => socket.close()` соединение остаётся активным после размонтирования компонента. Это приводит к утечкам памяти и ошибкам «Can't perform a React state update on an unmounted component».

**Отправка до открытия соединения.** Вызов `socket.send()` до события `onopen` вызывает исключение `InvalidStateError`. Всегда проверяйте `socket.readyState === WebSocket.OPEN` перед отправкой.

**Отсутствие обработки JSON-ошибок.** `JSON.parse()` выбрасывает исключение при невалидном JSON. Оборачивайте парсинг в `try/catch`, особенно если сервер может присылать текстовые сообщения.

## Заключение

WebSocket в React-приложениях лучше всего организовывать через кастомные хуки. Базовый `useWebSocket` покрывает большинство сценариев. Для продакшн-приложений добавляйте логику переподключения с экспоненциальной задержкой и флагом `isMounted`, чтобы избежать обновления состояния размонтированного компонента. Когда несколько компонентов должны разделять одно соединение — используйте Context API с `Set` подписчиков. TypeScript с дискриминируемыми объединениями сделает обработку разнотипных сообщений надёжной и удобной для поддержки.

Чтобы глубже изучить React и научиться строить полноценные реалтайм-приложения, переходите на курс [React — полный курс на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-websocket).