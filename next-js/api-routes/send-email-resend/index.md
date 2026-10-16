---
metaTitle: "Отправка email в Next.js с Resend — полное руководство"
metaDescription: "Как отправлять email в Next.js через Resend: настройка API-роута, React Email шаблоны, обработка ошибок и примеры кода."
author: "Антон Ларичев"
title: "Отправка email в Next.js с помощью Resend"
preview: "Пошаговое руководство по интеграции Resend в Next.js: API-роут, React Email шаблоны и отправка писем из форм."
---

## Отправка email в Next.js с помощью Resend

Resend — современный сервис для отправки транзакционных email-сообщений, ориентированный на разработчиков. Он предоставляет простой REST API и официальный SDK для Node.js, а также нативную интеграцию с библиотекой React Email для создания шаблонов писем.

В этой статье разберём полный цикл: от регистрации и получения API-ключа до отправки письма из формы в Next.js App Router.

## Подготовка: регистрация и API-ключ

Перед началом работы необходимо создать аккаунт на сайте resend.com и получить API-ключ. После регистрации перейдите в раздел **API Keys** и создайте новый ключ с правами `Sending access`.

Для работы в продакшене также потребуется подтвердить домен-отправитель в разделе **Domains**. На этапе разработки можно отправлять письма только на email-адрес, привязанный к аккаунту Resend.

## Установка зависимостей

Установите официальный SDK Resend:

```bash
npm install resend
```

Если планируете использовать React Email для создания HTML-шаблонов, установите дополнительные пакеты:

```bash
npm install @react-email/components react-email
```

## Настройка переменных окружения

Добавьте API-ключ в файл `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Для продакшена добавьте переменную в настройки окружения вашего хостинга (Vercel, Railway и т.д.). Никогда не коммитьте `.env.local` в репозиторий.

## Создание API-роута

В Next.js App Router API-роуты создаются как файлы `route.ts` внутри папки `app/api/`.

Создайте файл `app/api/send-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { to, subject, message } = body;

  if (!to || !subject || !message) {
    return NextResponse.json(
      { error: 'Поля to, subject и message обязательны' },
      { status: 400 }
    );
  }

  const { data, error } = await resend.emails.send({
    from: 'Ваш сервис <no-reply@yourdomain.com>',
    to,
    subject,
    html: `<p>${message}</p>`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id }, { status: 200 });
}
```

Resend SDK возвращает объект с полями `data` и `error` — деструктурируем их и обрабатываем каждый случай отдельно.

## Создание шаблона письма с React Email

Otправлять plain HTML — рабочий вариант, но для сложных писем удобнее использовать React Email. Это библиотека компонентов, которые компилируются в HTML, совместимый с большинством почтовых клиентов.

Создайте папку `emails/` в корне проекта и файл `emails/ContactEmail.tsx`:

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';

interface ContactEmailProps {
  name: string;
  email: string;
  message: string;
}

export function ContactEmail({ name, email, message }: ContactEmailProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>Новое сообщение от {name}</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4' }}>
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
          }}
        >
          <Heading style={{ color: '#333333', fontSize: '24px' }}>
            Новое сообщение с сайта
          </Heading>
          <Hr style={{ borderColor: '#e0e0e0' }} />
          <Section>
            <Text style={{ color: '#555555', margin: '0 0 4px' }}>
              <strong>Имя:</strong> {name}
            </Text>
            <Text style={{ color: '#555555', margin: '0 0 4px' }}>
              <strong>Email:</strong> {email}
            </Text>
          </Section>
          <Hr style={{ borderColor: '#e0e0e0' }} />
          <Section>
            <Text style={{ color: '#333333', fontWeight: 'bold' }}>Сообщение:</Text>
            <Text style={{ color: '#555555', lineHeight: '1.6' }}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

Теперь обновите API-роут, чтобы использовать этот шаблон:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ContactEmail } from '@/emails/ContactEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Заполните все поля' },
      { status: 400 }
    );
  }

  const { data, error } = await resend.emails.send({
    from: 'Ваш сервис <no-reply@yourdomain.com>',
    to: 'admin@yourdomain.com',
    subject: `Новое сообщение от ${name}`,
    react: ContactEmail({ name, email, message }),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id });
}
```

Вместо поля `html` передаём `react` — Resend самостоятельно рендерит React-компонент в HTML.

## Форма отправки на клиентской стороне

Создайте компонент формы `components/ContactForm.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка отправки');
      }

      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Ваше имя"
        required
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder="Сообщение"
        required
        rows={5}
      />

      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Отправка...' : 'Отправить'}
      </button>

      {status === 'success' && <p style={{ color: 'green' }}>Сообщение успешно отправлено!</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </form>
  );
}
```

## Отправка через Server Actions

В Next.js App Router есть альтернативный подход — Server Actions. Это позволяет обойтись без отдельного API-роута:

```typescript
// app/contact/actions.ts
'use server';

import { Resend } from 'resend';
import { ContactEmail } from '@/emails/ContactEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !message) {
    return { success: false, error: 'Заполните все поля' };
  }

  const { error } = await resend.emails.send({
    from: 'Ваш сервис <no-reply@yourdomain.com>',
    to: 'admin@yourdomain.com',
    subject: `Новое сообщение от ${name}`,
    react: ContactEmail({ name, email, message }),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
```

Использование Server Action в компоненте:

```tsx
// app/contact/page.tsx
import { sendContactEmail } from './actions';

export default function ContactPage() {
  return (
    <form action={sendContactEmail}>
      <input name="name" placeholder="Имя" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Сообщение" required />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

Server Action работает как на сервере (без JS), так и с прогрессивным улучшением, когда JS загружен.

## Предпросмотр шаблонов

React Email включает встроенный сервер для предпросмотра писем в браузере. Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "email": "react-email dev --dir emails --port 3001"
  }
}
```

Запустите:

```bash
npm run email
```

Откройте `http://localhost:3001` — увидите список шаблонов с предпросмотром как в почтовых клиентах. Это значительно ускоряет разработку и отладку вёрстки.

## Работа с несколькими получателями

Resend поддерживает отправку на несколько адресов сразу:

```typescript
await resend.emails.send({
  from: 'no-reply@yourdomain.com',
  to: ['user1@example.com', 'user2@example.com'],
  cc: ['manager@yourdomain.com'],
  bcc: ['archive@yourdomain.com'],
  subject: 'Тема письма',
  react: MyEmailTemplate(),
});
```

Для массовой рассылки (bulk sending) используйте метод `resend.batch.send`, который принимает массив объектов писем и отправляет их как одну операцию.

## Обработка вебхуков

Resend умеет отправлять вебхуки при изменении статуса письма: доставлено, открыто, кликнуто, помечено как спам. Создайте роут для обработки:

```typescript
// app/api/resend-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const event = await request.json();

  switch (event.type) {
    case 'email.delivered':
      console.log('Письмо доставлено:', event.data.email_id);
      break;
    case 'email.bounced':
      console.log('Письмо отклонено:', event.data.email_id);
      break;
    case 'email.complained':
      console.log('Жалоба на спам:', event.data.email_id);
      break;
  }

  return NextResponse.json({ received: true });
}
```

URL вебхука добавляется в настройках Resend в разделе **Webhooks**. Для безопасности проверяйте подпись запроса через заголовок `svix-signature` — Resend использует библиотеку Svix для подписи вебхуков.

## Типичные ошибки и их решение

**Ошибка 403 при отправке**: домен-отправитель не верифицирован. На время разработки используйте `onboarding@resend.dev` как адрес `from` или указывайте email своего аккаунта Resend в поле `to`.

**Письма попадают в спам**: убедитесь, что настроены DNS-записи SPF, DKIM и DMARC для домена. Resend предоставляет точные инструкции после добавления домена.

**Переменная окружения не найдена**: в Next.js переменные из `.env.local` доступны только на сервере. Убедитесь, что SDK Resend инициализируется только в серверных компонентах, API-роутах или Server Actions.

**Лимит бесплатного плана**: бесплатный план Resend позволяет отправлять 3000 писем в месяц и 100 в день. Для продакшена потребуется платный план.

## Заключение

Resend — один из самых удобных сервисов для отправки email в Next.js-приложениях. Его SDK минималистичен, интеграция с React Email позволяет создавать сложные шаблоны в привычной парадигме, а вебхуки дают полный контроль над доставкой.

Основной выбор при построении архитектуры — API-роут или Server Action. API-роут подходит, если клиент должен опрашивать статус или интегрироваться с внешними системами. Server Action — лучший вариант для форм, где нужно минимум кода и встроенная поддержка прогрессивного улучшения.

Для углублённого изучения Next.js и паттернов работы с внешними API смотрите курс на PurpleSchool:
https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=send-email-resend