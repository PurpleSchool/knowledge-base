---
metaTitle: "Next.js Server-Sent Events: стриминг событий с сервера"
metaDescription: "Как реализовать Server-Sent Events в Next.js App Router — Route Handler, EventSource API, примеры стриминга данных в реальном времени."
author: "Антон Ларичев"
title: "Next.js Server-Sent Events — стриминг событий с сервера"
preview: "Реализуем однонаправленный стриминг событий с сервера на клиент через SSE в Next.js App Router с практическими примерами."
---

## Что такое Server-Sent Events

Server-Sent Events (SSE) — стандарт HTML5, позволяющий серверу отправлять события клиенту по уже установленному HTTP-соединению. В отличие от обычного запрос-ответного цикла, соединение остаётся открытым, и сервер может проталкивать данные в любой момент без нового запроса от клиента.

Протокол SSE работает поверх обычного HTTP и использует формат `text/event-stream`. Каждое событие — это одна или несколько строк в специальном формате:

```
data: {"message": "hello"}

data: {"message": "world"}
event: notification
data: {"count": 5}

```

Две переносы строки между блоками (`\n\n`) отмечают границу события. Поля `data`, `event`, `id` и `retry` определены спецификацией.

## SSE против WebSockets и Long Polling

Перед реализацией важно понять, когда SSE является правильным инструментом.

**SSE подходит, когда:**
- данные передаются только в одну сторону — от сервера к клиенту;
- нужна автоматическая переподключение из коробки;
- достаточно обычного HTTP (не нужен отдельный WebSocket-сервер);
- требуется совместимость со стандартными HTTP-прокси и CDN.

**WebSockets подходят, когда:**
- нужна двусторонняя связь (чаты, онлайн-игры);
- критична минимальная задержка при высокой частоте сообщений.

**Long Polling подходит, когда:**
- среда не поддерживает SSE (редкие случаи со старыми прокси);
- события приходят редко и простота важнее эффективности.

Для большинства задач реального времени в веб-приложениях — уведомлений, прогресс-баров, лог-стримингов, обновлений дашбордов — SSE является оптимальным выбором.

## Реализация SSE в Next.js App Router

В App Router SSE реализуется через Route Handler, возвращающий `Response` с `ReadableStream` и заголовком `Content-Type: text/event-stream`.

### Базовый Route Handler

Создайте файл `app/api/events/route.ts`:

```typescript
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown, event?: string) => {
        let message = '';
        if (event) message += `event: ${event}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      send({ status: 'connected' });

      let count = 0;
      const interval = setInterval(() => {
        count++;
        send({ count, time: new Date().toISOString() });

        if (count >= 10) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

Несколько важных деталей:

- `export const dynamic = 'force-dynamic'` отключает кэширование роута — без этого Next.js может закэшировать первый ответ.
- `TextEncoder` нужен потому, что `ReadableStream` работает с бинарными данными (`Uint8Array`), а не строками.
- Двойной перенос строки `\n\n` в конце каждого сообщения обязателен — это разделитель событий в протоколе SSE.
- Заголовок `Cache-Control: no-cache, no-transform` предотвращает буферизацию промежуточными прокси.

### Отправка именованных событий

SSE поддерживает именованные события, что позволяет клиенту слушать только определённые типы:

```typescript
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown, id?: string) => {
        let message = `event: ${event}\n`;
        if (id) message += `id: ${id}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      sendEvent('connected', { timestamp: Date.now() });

      setTimeout(() => {
        sendEvent('notification', { text: 'Задача выполнена', level: 'success' }, '1');
      }, 2000);

      setTimeout(() => {
        sendEvent('notification', { text: 'Новое сообщение', level: 'info' }, '2');
        controller.close();
      }, 4000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

Поле `id` позволяет клиенту при переподключении передать последний полученный идентификатор через заголовок `Last-Event-ID`, и сервер может продолжить поток с нужного места.

## Клиентская часть: EventSource API

Браузер предоставляет встроенный `EventSource` API для подписки на SSE-поток.

### Базовое подключение

```typescript
'use client';

import { useEffect, useState } from 'react';

interface StreamEvent {
  count: number;
  time: string;
}

export function EventStream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource('/api/events');

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamEvent;
      setEvents((prev) => [...prev, data]);
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <div>
      <p>Статус: {connected ? 'подключено' : 'отключено'}</p>
      <ul>
        {events.map((e, i) => (
          <li key={i}>{e.time}: событие #{e.count}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Подписка на именованные события

Для именованных событий используйте `addEventListener` вместо `onmessage` — `onmessage` срабатывает только на события без имени (или с именем `message`):

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Notification {
  text: string;
  level: 'success' | 'info' | 'error';
}

export function NotificationStream() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const source = new EventSource('/api/events');

    source.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data) as Notification;
      setNotifications((prev) => [...prev, data]);
    });

    source.addEventListener('connected', () => {
      console.log('SSE-поток установлен');
    });

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, []);

  return (
    <ul>
      {notifications.map((n, i) => (
        <li key={i} className={`notification--${n.level}`}>
          {n.text}
        </li>
      ))}
    </ul>
  );
}
```

## Практический пример: стриминг прогресса задачи

Рассмотрим реальный сценарий — пользователь запускает длительную операцию (импорт данных, генерацию отчёта) и видит прогресс в реальном времени.

### Серверная часть

```typescript
// app/api/import/route.ts
export const dynamic = 'force-dynamic';

type ProgressEvent =
  | { type: 'progress'; step: string; percent: number }
  | { type: 'complete'; result: { processed: number } }
  | { type: 'error'; message: string };

async function simulateStep(name: string, ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new Response('fileId is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: ProgressEvent) => {
        const message = `data: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        send({ type: 'progress', step: 'Чтение файла', percent: 10 });
        await simulateStep('read', 800);

        send({ type: 'progress', step: 'Валидация данных', percent: 30 });
        await simulateStep('validate', 1200);

        send({ type: 'progress', step: 'Сохранение в базу', percent: 60 });
        await simulateStep('save', 2000);

        send({ type: 'progress', step: 'Индексирование', percent: 90 });
        await simulateStep('index', 600);

        send({ type: 'complete', result: { processed: 1547 } });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Неизвестная ошибка',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

### Клиентская часть

```typescript
'use client';

import { useState, useCallback } from 'react';

type Status = 'idle' | 'running' | 'complete' | 'error';

interface Progress {
  step: string;
  percent: number;
}

export function ImportProgress({ fileId }: { fileId: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<{ processed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startImport = useCallback(() => {
    setStatus('running');
    setProgress(null);
    setResult(null);
    setError(null);

    const source = new EventSource(`/api/import?fileId=${fileId}`);

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        setProgress({ step: data.step, percent: data.percent });
      } else if (data.type === 'complete') {
        setResult(data.result);
        setStatus('complete');
        source.close();
      } else if (data.type === 'error') {
        setError(data.message);
        setStatus('error');
        source.close();
      }
    };

    source.onerror = () => {
      setError('Потеряно соединение с сервером');
      setStatus('error');
      source.close();
    };
  }, [fileId]);

  return (
    <div>
      {status === 'idle' && (
        <button onClick={startImport}>Начать импорт</button>
      )}

      {status === 'running' && progress && (
        <div>
          <p>{progress.step}</p>
          <progress value={progress.percent} max={100} />
          <span>{progress.percent}%</span>
        </div>
      )}

      {status === 'complete' && result && (
        <p>Импорт завершён. Обработано записей: {result.processed}</p>
      )}

      {status === 'error' && (
        <p>Ошибка: {error}</p>
      )}
    </div>
  );
}
```

## Обработка разрыва соединения

Brauzeer автоматически переподключается при обрыве SSE-соединения (по умолчанию через 3 секунды). Чтобы управлять этим поведением на сервере, используйте поле `retry`:

```typescript
const sendRetry = (ms: number) => {
  controller.enqueue(encoder.encode(`retry: ${ms}\n\n`));
};

// Установить интервал переподключения в 5 секунд
sendRetry(5000);
```

Чтобы полностью отключить переподключение (когда поток завершён и клиент не должен повторять запрос), закройте `EventSource` на клиенте при получении финального события, как показано в примере выше.

### Отслеживание Last-Event-ID

Сервер может продолжить поток с нужного места, используя заголовок `Last-Event-ID`:

```typescript
export async function GET(request: Request) {
  const lastId = request.headers.get('Last-Event-ID');
  const startFrom = lastId ? parseInt(lastId, 10) + 1 : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = startFrom; i < 100; i++) {
        const message = `id: ${i}\ndata: ${JSON.stringify({ index: i })}\n\n`;
        controller.enqueue(encoder.encode(message));
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

## SSE с аутентификацией

`EventSource` не поддерживает кастомные заголовки (в отличие от `fetch`). Для передачи токена используйте параметр запроса или куки:

```typescript
// Вариант 1: токен в query-параметре (менее безопасно)
const source = new EventSource(`/api/events?token=${accessToken}`);

// Вариант 2: httpOnly cookie (рекомендуется)
// Cookie отправляется автоматически, проверяйте её на сервере
```

На сервере проверяйте аутентификацию в начале обработчика:

```typescript
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session?.value) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ... остальная логика SSE
}
```

## Ограничения и нюансы

**Лимит соединений в браузере.** HTTP/1.1 допускает только 6 одновременных соединений на домен, и каждый открытый `EventSource` занимает одно из них. При HTTP/2 (который Next.js поддерживает в продакшне) этого ограничения нет — мультиплексирование решает проблему.

**Serverless-среды.** В Vercel и других serverless-платформах функции имеют ограничение по времени выполнения. Для длинных SSE-потоков используйте Edge Runtime или Vercel Streaming — он поддерживает стриминг без timeout-ограничений обычных функций:

```typescript
export const runtime = 'edge';

export async function GET() {
  // Edge Runtime поддерживает длинные стриминг-ответы
}
```

**Буферизация nginx.** Если перед Next.js стоит nginx, он может буферизовать ответы. Добавьте в конфигурацию:

```nginx
location /api/events {
  proxy_buffering off;
  proxy_cache off;
  proxy_set_header Connection '';
  proxy_http_version 1.1;
  chunked_transfer_encoding on;
}
```

## Итог

Server-Sent Events — простой и эффективный способ реализовать однонаправленный стриминг в Next.js App Router. Для большинства задач реального времени (уведомления, прогресс операций, логи, обновления дашборда) SSE предпочтительнее WebSockets благодаря простоте реализации, встроенному переподключению и совместимости с обычным HTTP.

Ключевые шаги: Route Handler возвращает `ReadableStream` с заголовком `text/event-stream`, клиент подписывается через `EventSource`, именованные события разделяют логические потоки данных.

Чтобы глубже разобраться в Next.js App Router, включая Route Handlers, стриминг и работу с реальным временем, смотрите курс на PurpleSchool:

[Курс по Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-sse)