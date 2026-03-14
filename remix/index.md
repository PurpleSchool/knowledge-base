---
metaTitle: Remix — React-фреймворк на веб-стандартах с loader, action и вложенными роутами
metaDescription: Полное руководство по Remix: философия веб-стандартов, loader и action для загрузки и мутации данных, вложенные роуты, обработка ошибок и сравнение с Next.js
author: Олег Марков
title: Remix - React-фреймворк
preview: Разбираем Remix — React-фреймворк, построенный на веб-стандартах: как работают loader и action, зачем нужны вложенные роуты, в чём отличие от Next.js и когда стоит выбрать Remix для вашего проекта
---

## Введение

В мире React-фреймворков существует несколько зрелых решений, каждое со своей философией. Remix — один из самых интересных и самобытных игроков: он появился в 2021 году, быстро получил признание сообщества и в 2022 году стал полностью бесплатным и опенсорсным.

Главная идея Remix — **опираться на то, что браузер умеет делать нативно**, а не изобретать собственные абстракции. Формы, HTTP-запросы, заголовки, кеширование — всё это работает так, как задумано веб-стандартами, и Remix просто помогает использовать их грамотно.

В этой статье вы узнаете:
- В чём заключается философия веб-стандартов Remix
- Как работают `loader` и `action` для загрузки и изменения данных
- Что такое вложенные роуты и зачем они нужны
- Как Remix справляется с ошибками и граничными случаями
- Чем Remix отличается от Next.js и когда стоит выбирать каждый из них

## Философия веб-стандартов

Прежде чем погружаться в код, важно понять, почему Remix устроен именно так. Авторы фреймворка (Майкл Джексон и Райан Флоренс — создатели React Router) сформулировали ключевой принцип: **хорошее знание веб-стандартов ценнее знания специфических API фреймворка**.

### Формы и HTTP-глаголы как первоклассные граждане

Во многих современных приложениях форма — это просто обёртка над `fetch`. Разработчики перехватывают `onSubmit`, вручную сериализуют данные, отправляют их через `fetch` или библиотеки вроде Axios, обрабатывают состояния загрузки и ошибок...

Remix возвращает нас к истокам. Стандартный HTML `<form>` с атрибутом `method="post"` — это всё, что нужно для мутации данных:

```jsx
// В Remix достаточно обычной HTML-формы
export default function NewPost() {
  return (
    <Form method="post">
      <input type="text" name="title" placeholder="Заголовок статьи" />
      <textarea name="body" placeholder="Текст статьи" />
      <button type="submit">Опубликовать</button>
    </Form>
  );
}
```

Remix перехватывает отправку формы, выполняет запрос через `fetch` (без перезагрузки страницы), но при этом **семантика HTTP сохраняется**. Если JavaScript не загрузился, форма всё равно работает как обычный POST-запрос — это называется прогрессивным улучшением (progressive enhancement).

### Нативное кеширование через HTTP-заголовки

Remix не придумывает собственную систему кеширования. Вместо этого он даёт вам полный контроль над HTTP-заголовками `Cache-Control`, `ETag` и другими стандартными механизмами:

```typescript
// app/routes/posts.tsx
export function headers() {
  return {
    "Cache-Control": "max-age=300, stale-while-revalidate=60",
  };
}
```

Это означает, что CDN, прокси-серверы и браузеры понимают, как кешировать ваши страницы — без дополнительных настроек.

### Web Fetch API повсюду

Remix использует стандартный `Request`/`Response` API (Web Fetch API) и в серверном коде:

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  // request — это стандартный объект Request
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  // ...
}

export async function action({ request }: ActionFunctionArgs) {
  // Стандартный способ получить данные формы
  const formData = await request.formData();
  const title = formData.get("title");
  // ...
}
```

Знания, которые вы получаете, работая с Remix, переносятся на другие платформы и окружения — Cloudflare Workers, Deno, Node.js — потому что это стандарт, а не специфика фреймворка.

## Loader: загрузка данных

`loader` — это функция, которая выполняется **на сервере** перед рендерингом компонента. Она отвечает за загрузку данных, необходимых странице.

### Базовый пример loader

```typescript
// app/routes/posts.$postId.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ params }: LoaderFunctionArgs) {
  // params.postId берётся из имени файла posts.$postId.tsx
  const post = await getPostById(params.postId);

  if (!post) {
    throw new Response("Статья не найдена", { status: 404 });
  }

  return json({ post });
}

export default function Post() {
  // Данные типизированы автоматически благодаря TypeScript-инференции
  const { post } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.body }} />
    </article>
  );
}
```

### Параллельная загрузка данных через вложенные роуты

Одно из ключевых преимуществ Remix: при наличии вложенных роутов все `loader`-функции выполняются **параллельно**, а не последовательно. Это принципиально отличается от паттерна «водопад» (waterfall), который часто возникает при использовании `useEffect` для загрузки данных.

```
Маршрут:    /dashboard/analytics

Загружается параллельно:
  - loader для /dashboard (навигация, данные пользователя)
  - loader для /dashboard/analytics (графики, метрики)
```

### Обработка ошибок в loader

Если `loader` выбрасывает `Response` с кодом ошибки, Remix автоматически показывает `ErrorBoundary` для этого роута:

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const user = await getUserById(params.userId);

  if (!user) {
    // Remix перехватит этот Response и покажет ErrorBoundary
    throw new Response("Пользователь не найден", { status: 404 });
  }

  return json({ user });
}

// Компонент для отображения ошибок этого роута
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <div>Пользователь не найден. <a href="/">На главную</a></div>;
  }

  return <div>Что-то пошло не так</div>;
}
```

### Доступ к заголовкам и cookie в loader

```typescript
import { createCookieSessionStorage } from "@remix-run/node";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "lax",
  },
});

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const userId = session.get("userId");
  if (!userId) {
    throw redirect("/login");
  }

  const user = await getUserById(userId);
  return json({ user });
}
```

## Action: мутация данных

`action` — функция, которая обрабатывает POST, PUT, PATCH, DELETE запросы к роуту. После успешного выполнения `action` Remix **автоматически обновляет все данные на странице**, перезапуская `loader`-функции.

### Базовый пример action

```typescript
// app/routes/posts.new.tsx
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));

  // Валидация
  const errors: Record<string, string> = {};
  if (!title || title.length < 5) {
    errors.title = "Заголовок должен быть не короче 5 символов";
  }
  if (!body || body.length < 10) {
    errors.body = "Текст статьи слишком короткий";
  }

  if (Object.keys(errors).length > 0) {
    // Возвращаем ошибки — action НЕ редиректит
    return json({ errors }, { status: 422 });
  }

  const post = await createPost({ title, body });
  return redirect(`/posts/${post.id}`);
}

export default function NewPost() {
  // useActionData возвращает данные, которые вернул action
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>
          Заголовок
          <input type="text" name="title" />
        </label>
        {actionData?.errors?.title && (
          <p style={{ color: "red" }}>{actionData.errors.title}</p>
        )}
      </div>

      <div>
        <label>
          Текст статьи
          <textarea name="body" />
        </label>
        {actionData?.errors?.body && (
          <p style={{ color: "red" }}>{actionData.errors.body}</p>
        )}
      </div>

      <button type="submit">Опубликовать</button>
    </Form>
  );
}
```

### Оптимистичные обновления с useFetcher

`useFetcher` позволяет делать запросы к любому роуту без навигации и реализовывать оптимистичные обновления UI:

```typescript
import { useFetcher } from "@remix-run/react";

function LikeButton({ post }) {
  const fetcher = useFetcher();

  // Оптимистично показываем новое состояние, пока запрос выполняется
  const isLiked = fetcher.formData
    ? fetcher.formData.get("liked") === "true"
    : post.isLiked;

  return (
    <fetcher.Form method="post" action={`/posts/${post.id}/like`}>
      <input type="hidden" name="liked" value={String(!isLiked)} />
      <button type="submit">
        {isLiked ? "❤️ Нравится" : "🤍 Нравится"} ({post.likesCount})
      </button>
    </fetcher.Form>
  );
}
```

### Множественные action в одном роуте

Если в одном роуте нужно обработать несколько разных форм, используйте скрытое поле `_action`:

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_action");

  switch (intent) {
    case "update":
      return updatePost(formData);
    case "delete":
      return deletePost(formData);
    case "publish":
      return publishPost(formData);
    default:
      throw new Response("Неизвестное действие", { status: 400 });
  }
}

export default function PostEditor() {
  return (
    <div>
      <Form method="post">
        <input type="hidden" name="_action" value="update" />
        {/* поля редактирования */}
        <button type="submit">Сохранить</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="_action" value="publish" />
        <button type="submit">Опубликовать</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="_action" value="delete" />
        <button type="submit">Удалить</button>
      </Form>
    </div>
  );
}
```

## Вложенные роуты

Вложенные роуты (nested routes) — одна из самых мощных и отличительных особенностей Remix. Идея позаимствована из React Router v6 (который тоже создали авторы Remix).

### Файловая структура и роуты

Структура файлов в `app/routes/` напрямую отражает структуру URL:

```
app/
└── routes/
    ├── _index.tsx          → /
    ├── about.tsx           → /about
    ├── posts.tsx           → /posts (layout)
    ├── posts._index.tsx    → /posts
    ├── posts.$postId.tsx   → /posts/:postId
    ├── posts.new.tsx       → /posts/new
    └── dashboard.tsx       → /dashboard (layout)
        ├── dashboard._index.tsx   → /dashboard
        ├── dashboard.analytics.tsx → /dashboard/analytics
        └── dashboard.settings.tsx  → /dashboard/settings
```

### Outlet: точка вставки дочернего роута

Файл `posts.tsx` является **layout-компонентом** для всех роутов, начинающихся с `/posts`. Он должен содержать `<Outlet />` — точку, куда будет вставляться содержимое дочернего роута:

```typescript
// app/routes/posts.tsx
import { Outlet, NavLink } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  const categories = await getCategories();
  return json({ categories });
}

export default function PostsLayout() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div className="posts-layout">
      <aside>
        <h2>Категории</h2>
        <nav>
          {categories.map(cat => (
            <NavLink
              key={cat.id}
              to={`/posts?category=${cat.slug}`}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              {cat.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        {/* Здесь будет отображаться содержимое дочернего роута */}
        <Outlet />
      </main>
    </div>
  );
}
```

```typescript
// app/routes/posts.$postId.tsx
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPost(params.postId);
  return json({ post });
}

export default function PostDetail() {
  const { post } = useLoaderData<typeof loader>();

  return (
    // Этот компонент будет вставлен в <Outlet /> родительского layout
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</параграф>
    </article>
  );
}
```

### Независимые области обновления

Когда пользователь переходит от `/posts/1` к `/posts/2`, Remix **не перерисовывает** layout (`posts.tsx`). Обновляется только та часть страницы, которая изменилась — содержимое `<Outlet />`. Это даёт эффект, похожий на Single Page Application, но без сложного управления состоянием.

### Вложенные ErrorBoundary

Каждый роут может иметь свой `ErrorBoundary`. Ошибка в дочернем роуте не ломает весь layout:

```typescript
// app/routes/posts.$postId.tsx
export function ErrorBoundary() {
  const error = useRouteError();

  return (
    // Этот компонент заменит только содержимое <Outlet />,
    // остальной layout (боковая панель с категориями) останется видимым
    <div>
      <h2>Ошибка при загрузке статьи</h2>
      <p>Попробуйте обновить страницу или выбрать другую статью.</p>
    </div>
  );
}
```

### Роуты без layout (pathless routes)

Иногда нужно группировать роуты для общей логики, не добавляя к URL сегмент. Для этого используются файлы с подчёркиванием в начале:

```
app/routes/
├── _auth.tsx           → нет URL-сегмента, только layout/логика
├── _auth.login.tsx     → /login
└── _auth.register.tsx  → /register
```

```typescript
// app/routes/_auth.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // Если пользователь уже авторизован — редирект на дашборд
  const user = await getUser(request);
  if (user) throw redirect("/dashboard");
  return null;
}

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <img src="/logo.svg" alt="Логотип" />
      <Outlet />
    </div>
  );
}
```

## Управление сессиями и cookie

Remix предоставляет встроенные утилиты для работы с сессиями, которые тоже следуют веб-стандартам:

```typescript
import {
  createCookieSessionStorage,
  redirect
} from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET],
      secure: process.env.NODE_ENV === "production",
    },
  });

// Логин
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const user = await authenticateUser(email, password);
  if (!user) {
    return json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const session = await getSession();
  session.set("userId", user.id);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

// Логаут
export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
```

## Метаданные и SEO

Remix предоставляет функцию `meta` для управления метатегами страницы, включая `<title>`, `<meta>` и `<link>`:

```typescript
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "Статья не найдена" }];
  }

  return [
    { title: `${data.post.title} | Мой Блог` },
    { name: "description", content: data.post.excerpt },
    { property: "og:title", content: data.post.title },
    { property: "og:description", content: data.post.excerpt },
    { property: "og:image", content: data.post.coverImage },
  ];
};
```

## Remix vs Next.js: ключевые отличия

Remix и Next.js — два самых популярных React-фреймворка. У них разная философия и разные приоритеты. Вот подробное сравнение:

### Подход к данным

| Аспект | Remix | Next.js |
|--------|-------|---------|
| Загрузка данных | `loader` (серверный, на уровне роута) | `getServerSideProps`, `getStaticProps`, React Server Components |
| Мутации | `action` + `<Form>` | Server Actions, `fetch` + API routes |
| Параллельность | Все loader в роуте выполняются параллельно автоматически | Последовательный fetch в RSC, ручной `Promise.all` |
| Клиентские данные | `useFetcher` | `useEffect` + SWR/React Query |

### Рендеринг

| Аспект | Remix | Next.js |
|--------|-------|---------|
| SSR | ✅ По умолчанию | ✅ Поддерживается |
| SSG | ❌ Нет (только через CDN-кеширование) | ✅ Встроен `getStaticProps` |
| ISR | ❌ Нет | ✅ Incremental Static Regeneration |
| Streaming SSR | ✅ Да | ✅ Да (App Router) |
| React Server Components | ⚠️ Экспериментально | ✅ Полная поддержка (App Router) |

### Роутинг

| Аспект | Remix | Next.js |
|--------|-------|---------|
| Система | File-based (плоская структура с точечной нотацией) | File-based (директории) |
| Вложенные роуты | ✅ Встроены, ключевая фича | ✅ Поддерживаются через layout.tsx |
| Параллельные роуты | ❌ Нет | ✅ `@named` папки |
| Перехватывающие роуты | ❌ Нет | ✅ `(.)folder` нотация |

### Деплой и платформы

| Аспект | Remix | Next.js |
|--------|-------|---------|
| Vercel | ✅ | ✅ (официальная платформа Next.js) |
| Cloudflare Workers | ✅ Отличная поддержка | ⚠️ Ограниченная |
| Netlify | ✅ | ✅ |
| AWS Lambda | ✅ | ✅ |
| Собственный сервер | ✅ Express, Fastify | ✅ |
| Edge Runtime | ✅ | ✅ |

### Философия

**Remix:**
- Ставит веб-стандарты выше удобства фреймворка
- Прогрессивное улучшение — приложение работает даже без JavaScript
- «Учи веб-платформу, а не Remix»
- Оптимизирован для SSR и динамических данных

**Next.js:**
- Гибкость: можно использовать любые режимы рендеринга
- Развитая экосистема (Vercel, множество примеров)
- React Server Components как основная парадигма
- Хорошая поддержка SSG и ISR для статических сайтов

### Когда выбрать Remix

Remix хорошо подходит, если:

- Ваше приложение работает с **динамическими данными** (дашборды, CRM, CMS, e-commerce)
- Вам важна **скорость работы с формами** и мутациями данных
- Вы деплоитесь на **edge-платформы** (Cloudflare Workers, Deno Deploy)
- Вы хотите **прогрессивное улучшение** — сайт работает без JS
- Команда знакома с **HTTP и веб-стандартами**

### Когда выбрать Next.js

Next.js предпочтителен, если:

- Нужна **статическая генерация** (блог, документация, маркетинговый сайт)
- Вы используете **Vercel** и хотите глубокую интеграцию
- Проект требует **React Server Components** и сложной архитектуры компонентов
- Нужна **ISR** (обновление статических страниц без полной сборки)
- Команда уже работает с экосистемой Next.js

## Структура Remix-приложения

Типовая структура проекта на Remix:

```
my-remix-app/
├── app/
│   ├── root.tsx              # Корневой компонент (html, head, body)
│   ├── entry.client.tsx      # Точка входа на клиенте
│   ├── entry.server.tsx      # Точка входа на сервере
│   ├── routes/
│   │   ├── _index.tsx        # Главная страница /
│   │   ├── about.tsx         # /about
│   │   ├── posts.tsx         # Layout для /posts/*
│   │   ├── posts._index.tsx  # Список статей /posts
│   │   └── posts.$postId.tsx # Детальная страница /posts/:id
│   └── utils/
│       ├── auth.server.ts    # Серверные утилиты для авторизации
│       └── db.server.ts      # Подключение к БД
├── public/                   # Статические файлы
├── remix.config.js           # Конфигурация Remix
└── package.json
```

### Пример root.tsx

```typescript
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import styles from "./globals.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export default function Root() {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## Быстрый старт

```bash
# Создать новое Remix-приложение
npx create-remix@latest my-app

# Установить зависимости и запустить
cd my-app
npm install
npm run dev
```

При создании проекта Remix предложит выбрать:
- Шаблон (bare bones, Blog tutorial, Indie Stack, Blues Stack и др.)
- Тип деплоя (Remix App Server, Cloudflare Workers, Netlify, Vercel и др.)

## Заключение

Remix — это фреймворк с чёткой философией: **не борись с платформой, используй её**. Вместо того чтобы строить собственные абстракции поверх веб-стандартов, Remix помогает использовать HTML, HTTP и браузерные API так, как они были задуманы.

Ключевые концепции, которые стоит запомнить:

- **loader** — серверная функция для загрузки данных, запускается параллельно для всех роутов
- **action** — серверная функция для мутации данных, работает с HTML-формами
- **Вложенные роуты** — разбивают UI на независимые области с собственными данными и ошибками
- **Прогрессивное улучшение** — приложение работает даже без JavaScript
- **Веб-стандарты** — знания о HTTP, формах и Cookie напрямую применимы в Remix

Remix особенно хорошо раскрывается в приложениях с активной работой с данными — дашбордах, админках, e-commerce платформах. Если ваш проект требует частых мутаций и сложных форм, Remix предлагает элегантное решение без лишних сложностей.
