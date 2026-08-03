---
metaTitle: "Next.js с OpenAI API — подключение ИИ к приложению"
metaDescription: "Как подключить OpenAI API к Next.js: чат с GPT, стриминг ответов, генерация изображений через DALL-E, безопасное хранение ключей."
author: "Антон Ларичев"
title: "Next.js с OpenAI API — ИИ-функции в приложении"
preview: "Пошаговое руководство по интеграции OpenAI API в Next.js: маршруты API, стриминг ответов, генерация изображений и безопасная работа с ключами."
---

## Что такое OpenAI API и зачем его подключать к Next.js

OpenAI API предоставляет доступ к языковым моделям GPT-4o, GPT-4o mini, а также к генераторам изображений DALL-E. Подключив API к Next.js-приложению, можно добавить в него текстовые ассистенты, автодополнение, резюмирование документов, генерацию кода и другие ИИ-функции.

Next.js идеально подходит для таких задач: серверные маршруты (Route Handlers) позволяют скрыть API-ключ от клиента, App Router поддерживает стриминг из коробки, а Server Actions дают возможность вызывать модель прямо из серверных компонентов.

В этой статье разберём:

- установку и настройку SDK;
- создание маршрута для генерации текста;
- стриминг ответа в браузер;
- генерацию изображений через DALL-E;
- простой чат-интерфейс на клиенте;
- безопасное хранение ключей.

## Установка и первоначальная настройка

Создайте новое Next.js-приложение или используйте существующее:

```bash
npx create-next-app@latest ai-app --typescript --app
cd ai-app
```

Установите официальный SDK:

```bash
npm install openai
```

Добавьте API-ключ в файл `.env.local`. Никогда не коммитьте этот файл в репозиторий:

```bash
OPENAI_API_KEY=sk-...
```

Добавьте `.env.local` в `.gitignore`, если его там нет:

```bash
echo ".env.local" >> .gitignore
```

Переменная `OPENAI_API_KEY` без префикса `NEXT_PUBLIC_` доступна только на сервере — это ключевое правило безопасности. Клиентский код никогда не увидит значение этой переменной.

## Создание клиента OpenAI

Вынесите инициализацию клиента в отдельный модуль, чтобы не дублировать его в каждом маршруте:

```typescript
// lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

SDK автоматически читает `process.env.OPENAI_API_KEY`, если не передать `apiKey` явно, но явная передача делает зависимость очевидной и упрощает тестирование.

## Маршрут для генерации текста

Создайте Route Handler для простой генерации текста без стриминга:

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Поле message обязательно' },
      { status: 400 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Ты полезный ассистент. Отвечай на русском языке.',
      },
      {
        role: 'user',
        content: message,
      },
    ],
    max_tokens: 1000,
  });

  const reply = completion.choices[0].message.content;

  return NextResponse.json({ reply });
}
```

Проверьте маршрут через curl:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Объясни, что такое замыкание в JavaScript"}'
```

## Стриминг ответа

Ожидать завершения полного ответа от GPT неудобно: пользователь видит пустой экран несколько секунд. Стриминг позволяет передавать токены в браузер по мере их генерации.

Next.js поддерживает `ReadableStream` в Route Handlers:

```typescript
// app/api/chat-stream/route.ts
import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Ты полезный ассистент. Отвечай на русском языке.',
      },
      {
        role: 'user',
        content: message,
      },
    ],
    stream: true,
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          controller.enqueue(new TextEncoder().encode(token));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

## Чат-интерфейс на клиенте

Создайте клиентский компонент, который читает стриминг-ответ и отображает токены по мере поступления:

```typescript
// app/chat/page.tsx
'use client';

import { useState, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Добавляем пустое сообщение ассистента, которое будем заполнять
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error('Нет тела ответа');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const token = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          };
          return updated;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>ИИ-ассистент</h1>

      <div style={{ minHeight: 400, marginBottom: 16 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}
          >
            <span
              style={{
                background: msg.role === 'user' ? '#0070f3' : '#f0f0f0',
                color: msg.role === 'user' ? '#fff' : '#000',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'inline-block',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          disabled={loading}
        />
        {loading ? (
          <button onClick={stopGeneration}>Стоп</button>
        ) : (
          <button onClick={sendMessage}>Отправить</button>
        )}
      </div>
    </div>
  );
}
```

## Передача истории сообщений

Для полноценного диалога нужно передавать всю историю сообщений в каждом запросе — модель не хранит контекст между вызовами:

```typescript
// app/api/chat-stream/route.ts (обновлённая версия)
import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';
import OpenAI from 'openai';

type Message = OpenAI.Chat.ChatCompletionMessageParam;

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Массив messages обязателен', { status: 400 });
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Ты полезный ассистент. Отвечай на русском языке.' },
      ...messages,
    ],
    stream: true,
    max_tokens: 2000,
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          controller.enqueue(new TextEncoder().encode(token));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

На клиенте передавайте `messages` вместо одного `message`:

```typescript
const res = await fetch('/api/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: messages
      .filter((m) => m.content !== '') // убираем незаполненный ответ
      .map(({ role, content }) => ({ role, content })),
  }),
  signal: abortRef.current.signal,
});
```

## Генерация изображений через DALL-E

OpenAI API предоставляет модели `dall-e-3` и `dall-e-2` для генерации изображений по текстовому описанию:

```typescript
// app/api/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Поле prompt обязательно' }, { status: 400 });
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url;

  return NextResponse.json({ url: imageUrl });
}
```

Простой клиентский компонент для генерации изображений:

```typescript
// app/image-gen/page.tsx
'use client';

import { useState } from 'react';

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Ошибка генерации');
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1>Генератор изображений</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Опишите изображение на английском..."
        rows={4}
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />
      <button onClick={generate} disabled={loading}>
        {loading ? 'Генерирую...' : 'Сгенерировать'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && (
        <img src={imageUrl} alt="Generated" style={{ marginTop: 16, width: '100%' }} />
      )}
    </div>
  );
}
```

## Обработка ошибок и лимиты

OpenAI возвращает специфические ошибки: превышение лимита запросов (429), истёкший ключ (401), слишком длинный контекст (400). SDK предоставляет типизированные классы для их обработки:

```typescript
import OpenAI from 'openai';

async function safeCompletion(message: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }],
    });
    return completion.choices[0].message.content;
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.');
      }
      if (err.status === 401) {
        throw new Error('Недействительный API-ключ.');
      }
      throw new Error(`Ошибка OpenAI: ${err.message}`);
    }
    throw err;
  }
}
```

Для ограничения частоты запросов от пользователей можно хранить счётчики в Redis или базе данных. Простой вариант на основе заголовков — проверять IP:

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // запросов
const WINDOW_MS = 60_000; // за 1 минуту

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Подождите минуту.' },
      { status: 429 }
    );
  }

  // ... остальная логика
}
```

Важно учитывать, что `Map` в памяти сбрасывается при перезапуске сервера. Для production-систем используйте Redis или Upstash.

## Использование Server Actions

Server Actions позволяют вызывать серверный код прямо из компонентов без явного создания маршрутов:

```typescript
// app/actions/ai.ts
'use server';

import { openai } from '@/lib/openai';

export async function summarizeText(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Сделай краткое резюме текста в 2-3 предложениях на русском языке.',
      },
      { role: 'user', content: text },
    ],
    max_tokens: 300,
  });

  return completion.choices[0].message.content ?? '';
}
```

Использование в компоненте:

```typescript
// app/summarize/page.tsx
'use client';

import { useState } from 'react';
import { summarizeText } from '../actions/ai';

export default function SummarizePage() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const result = await summarizeText(text);
    setSummary(result);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Резюмирование текста</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        style={{ width: '100%', marginBottom: 8 }}
        placeholder="Вставьте текст для резюмирования..."
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Обрабатываю...' : 'Резюмировать'}
      </button>
      {summary && (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          <strong>Резюме:</strong>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
```

Server Actions проще в использовании, но не поддерживают стриминг так же гибко, как Route Handlers.

## Безопасность и переменные окружения

Несколько правил, которые необходимо соблюдать при работе с OpenAI API в Next.js:

- Никогда не используйте префикс `NEXT_PUBLIC_` для `OPENAI_API_KEY`. Такая переменная попадёт в бандл клиента и станет публичной.
- Всегда валидируйте входные данные на сервере перед отправкой в API.
- Ограничивайте длину сообщений от пользователя, чтобы избежать prompt injection и непредвиденных расходов.
- Устанавливайте параметр `max_tokens`, чтобы контролировать стоимость каждого запроса.
- Логируйте запросы и ошибки для мониторинга расходов.

Пример валидации входных данных:

```typescript
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов` },
      { status: 400 }
    );
  }

  // ...
}
```

## Итог

Integration OpenAI API в Next.js позволяет создавать мощные ИИ-функции, сохраняя API-ключ в безопасности на сервере. Route Handlers и Server Actions закрывают большинство сценариев: стриминговые чаты, генерация изображений, резюмирование, классификация и автодополнение. Стриминг через `ReadableStream` делает взаимодействие с моделью отзывчивым — пользователь видит ответ немедленно, а не ждёт его полного завершения.

Если вы хотите глубже разобраться с Next.js и научиться строить production-приложения с нуля, изучите курс на PurpleSchool:
[Next.js — полный курс для разработчиков](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-openai-api)
