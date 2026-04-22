---
metaTitle: App Router в Next.js — как работает новая маршрутизация
metaDescription: App Router в Next.js 13–15 — файловая маршрутизация, layouts, loading, error страницы, Server и Client Components. Полное руководство с примерами.
author: Антон Ларичев
title: App Router в Next.js — как работает новая маршрутизация
preview: Разбираем App Router в Next.js — файловая система маршрутизации, layouts, loading и error состояния, вложенные маршруты и отличия от Pages Router.
---

## Введение

App Router — новая система маршрутизации в Next.js, представленная в версии 13 и ставшая стандартом с версии 13.4. Она кардинально отличается от старого Pages Router: использует React Server Components по умолчанию, поддерживает вложенные layouts и даёт более гибкий контроль над рендерингом.

Если вы начинаете новый проект на Next.js — App Router это правильный выбор. В этой статье разберём базовые концепции и структуру проекта с App Router.

## Структура проекта

В App Router весь код приложения размещается в папке `app/`:

```
my-app/
├── app/
│   ├── layout.tsx        # Корневой layout (обязательный)
│   ├── page.tsx          # Главная страница /
│   ├── about/
│   │   └── page.tsx      # Страница /about
│   ├── blog/
│   │   ├── page.tsx      # Страница /blog
│   │   └── [slug]/
│   │       └── page.tsx  # Страница /blog/:slug
│   └── globals.css
├── public/
├── next.config.js
└── package.json
```

Каждая папка в `app/` соответствует сегменту URL. Файл `page.tsx` делает маршрут публично доступным.

## Специальные файлы

App Router вводит несколько специальных имён файлов:

| Файл | Назначение |
|------|-----------|
| `page.tsx` | Уникальный UI страницы, делает маршрут доступным |
| `layout.tsx` | Общий UI для страницы и её дочерних страниц |
| `loading.tsx` | UI загрузки (React Suspense) |
| `error.tsx` | UI обработки ошибок (Error Boundary) |
| `not-found.tsx` | UI для 404 |
| `route.ts` | API endpoint (Route Handler) |
| `template.tsx` | Как layout, но пересоздаётся при навигации |

## Корневой layout

`app/layout.tsx` — обязательный файл, оборачивает всё приложение:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Мой сайт',
  description: 'Описание сайта',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <header>Шапка</header>
        <main>{children}</main>
        <footer>Подвал</footer>
      </body>
    </html>
  );
}
```

Layout сохраняет состояние при навигации между страницами — это ключевое отличие от Pages Router.

Если вы хотите глубоко изучить Next.js с нуля — приходите на наш курс [React с нуля](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=article&utm_campaign=app-router), который включает модули по Next.js. На курсе 300+ уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Создание страниц

```tsx
// app/page.tsx — главная страница /
export default function HomePage() {
  return (
    <div>
      <h1>Добро пожаловать!</h1>
      <p>Это главная страница</p>
    </div>
  );
}
```

```tsx
// app/about/page.tsx — страница /about
export default function AboutPage() {
  return <h1>О нас</h1>;
}
```

## Вложенные layouts

Каждая папка может иметь свой `layout.tsx`, который оборачивает только страницы внутри неё:

```tsx
// app/blog/layout.tsx — layout для всех /blog/* страниц
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-container">
      <aside>
        <nav>Навигация по блогу</nav>
      </aside>
      <article>{children}</article>
    </div>
  );
}
```

```tsx
// app/blog/page.tsx — страница /blog
export default function BlogPage() {
  return <h1>Все статьи</h1>;
}
```

```tsx
// app/blog/[slug]/page.tsx — страница /blog/:slug
export default function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  return <h1>Статья: {params.slug}</h1>;
}
```

## Динамические маршруты

Папки в квадратных скобках создают динамические сегменты:

```
app/
├── users/
│   ├── [id]/
│   │   └── page.tsx       # /users/123, /users/456
│   └── page.tsx           # /users
└── blog/
    └── [...slug]/
        └── page.tsx       # /blog/a/b/c (catch-all)
```

```tsx
// app/users/[id]/page.tsx
export default function UserPage({
  params,
}: {
  params: { id: string };
}) {
  return <h1>Пользователь {params.id}</h1>;
}
```

## Loading и Error состояния

```tsx
// app/blog/loading.tsx
// Автоматически показывается пока страница загружается
export default function BlogLoading() {
  return <div>Загрузка статей...</div>;
}
```

```tsx
// app/blog/error.tsx
// Должен быть Client Component
'use client';

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Попробовать снова</button>
    </div>
  );
}
```

## Server Components и Client Components

По умолчанию все компоненты в App Router — **Server Components**. Они рендерятся на сервере и не включают JavaScript на клиенте.

```tsx
// Server Component (по умолчанию) — может быть async
async function UserList() {
  // Можно делать запросы прямо в компоненте
  const users = await fetch('https://api.example.com/users').then(r => r.json());
  
  return (
    <ul>
      {users.map((user: User) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

Для интерактивности (useState, useEffect, обработчики событий) нужен **Client Component** с директивой `'use client'`:

```tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Нажато: {count}
    </button>
  );
}
```

## Навигация

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Декларативная навигация
function NavMenu() {
  return (
    <nav>
      <Link href="/">Главная</Link>
      <Link href="/about">О нас</Link>
      <Link href="/blog">Блог</Link>
    </nav>
  );
}

// Программная навигация (только в Client Components)
'use client';

function LoginButton() {
  const router = useRouter();
  
  function handleLogin() {
    // После логина перенаправляем
    router.push('/dashboard');
  }
  
  return <button onClick={handleLogin}>Войти</button>;
}
```

## Частые ошибки

* **Использование хуков в Server Components.** `useState`, `useEffect` и другие React-хуки работают только в Client Components. Добавьте `'use client'` в начало файла.

* **Импорт серверного кода в Client Component.** Клиентские компоненты не могут импортировать серверный код (работу с БД, секреты). Используйте Server Actions или API routes для передачи данных.

* **Отсутствие корневого layout.** `app/layout.tsx` обязателен. Без него Next.js выдаст ошибку при сборке.

* **Неправильный тип params.** Params приходят как строки, даже если это числовой ID. Всегда преобразуйте: `Number(params.id)`.

## Часто задаваемые вопросы

**Нужно ли мигрировать с Pages Router на App Router?**

Нет, Pages Router продолжает поддерживаться. Оба роутера можно использовать в одном проекте (в папках `pages/` и `app/`). Миграция рекомендуется для новых возможностей, но не обязательна.

**Как получить данные в App Router?**

В Server Components можно использовать `async/await` прямо в компоненте. Для клиентского получения данных — React Query, SWR или fetch в useEffect.

**Что быстрее — Pages Router или App Router?**

App Router в большинстве сценариев быстрее: Server Components отправляют меньше JavaScript на клиент, а streaming позволяет начинать рендер до полного получения данных.

## Заключение

App Router — современный способ строить приложения на Next.js. Файловая маршрутизация, вложенные layouts, Server Components и встроенная обработка загрузки и ошибок делают архитектуру приложения предсказуемой и масштабируемой.

Для углублённого изучения Next.js и React рекомендуем курс [React с нуля](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=article&utm_campaign=app-router). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.
