---
metaTitle: "Что такое Next.js и зачем он нужен — обзор фреймворка"
metaDescription: "Next.js — React-фреймворк для SSR, SSG и CSR. Разбираем что такое Next.js, ключевые возможности, отличия от CRA и когда его стоит использовать."
author: "Дмитрий Нечаев"
---

# Что такое Next.js и зачем он нужен

Next.js — это React-фреймворк с открытым исходным кодом, разработанный компанией Vercel. Он расширяет возможности React, добавляя серверный рендеринг, статическую генерацию, файловую маршрутизацию и множество оптимизаций «из коробки». Сегодня Next.js используют Netflix, TikTok, GitHub, Twitch и тысячи других проектов.

В этой статье разберём, что такое Next.js, чем он отличается от чистого React, и когда его стоит выбирать для своего проекта.

## Проблема чистого React

React — это библиотека для построения UI. Сама по себе она не решает ряд задач, с которыми сталкивается каждый production-проект:

- **Маршрутизация** — нужно подключать react-router вручную.
- **SEO** — браузерный рендеринг (CSR) плохо индексируется поисковиками, потому что HTML-страница изначально пустая.
- **Производительность** — первый рендер происходит на стороне клиента, что замедляет загрузку.
- **Сборка и настройка** — Webpack, Babel, TypeScript нужно конфигурировать самостоятельно.

Next.js закрывает все эти проблемы.

## Что такое Next.js

Next.js — это полноценный фреймворк поверх React. Он добавляет:

1. **Файловую маршрутизацию** — структура папок определяет URL-адреса.
2. **Несколько стратегий рендеринга** — SSR, SSG, ISR и CSR.
3. **API Routes** — бэкенд-обработчики прямо в проекте.
4. **Оптимизации** — автоматическое разделение кода, оптимизация изображений, шрифтов и скриптов.
5. **TypeScript и CSS Modules** — поддержка из коробки без настройки.

## Стратегии рендеринга

Одно из главных преимуществ Next.js — гибкость в выборе того, как и когда генерируется HTML.

### Server-Side Rendering (SSR)

Страница генерируется на сервере при каждом запросе. Пользователь получает готовый HTML, что ускоряет первую загрузку и помогает SEO.

```jsx
// Функция выполняется на сервере при каждом запросе
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return { props: { posts } };
}

export default function Blog({ posts }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Static Site Generation (SSG)

HTML генерируется один раз при сборке (`next build`) и раздаётся как статический файл. Это самый быстрый вариант — страницы можно кешировать на CDN.

```jsx
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return { props: { posts } };
}
```

Для динамических маршрутов дополнительно используется `getStaticPaths`:

```jsx
export async function getStaticPaths() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  const paths = posts.map(post => ({
    params: { id: String(post.id) },
  }));

  return { paths, fallback: false };
}
```

### Incremental Static Regeneration (ISR)

Гибрид SSG и SSR: страница генерируется статически, но обновляется в фоне через заданный интервал.

```jsx
export async function getStaticProps() {
  const data = await fetchData();

  return {
    props: { data },
    revalidate: 60, // перегенерировать через 60 секунд
  };
}
```

### Client-Side Rendering (CSR)

Обычный React-подход — данные загружаются в браузере после гидрации. Подходит для защищённых страниц, где SEO не важен.

## Файловая маршрутизация

В Next.js не нужно настраивать роутер вручную. Структура файлов в папке `pages/` (Pages Router) или `app/` (App Router) автоматически становится маршрутами:

```
pages/
├── index.js        → /
├── about.js        → /about
├── blog/
│   ├── index.js    → /blog
│   └── [slug].js   → /blog/:slug
```

Динамические сегменты обозначаются квадратными скобками: `[id].js` соответствует любому значению в URL.

## API Routes

Next.js позволяет писать бэкенд-обработчики прямо в проекте — в папке `pages/api/`:

```js
// pages/api/users.js
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ users: ['Alice', 'Bob'] });
  } else {
    res.status(405).end();
  }
}
```

Это удобно для небольших проектов, где не хочется разворачивать отдельный сервер.

## Оптимизации из коробки

### Оптимизация изображений

Компонент `<Image>` автоматически:
- Конвертирует изображения в WebP/AVIF.
- Изменяет размер под экран пользователя.
- Реализует ленивую загрузку (lazy loading).

```jsx
import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/avatar.png"
      alt="Аватар"
      width={100}
      height={100}
    />
  );
}
```

### Оптимизация шрифтов

`next/font` загружает Google Fonts и системные шрифты без сторонних запросов, автоматически применяя оптимальные настройки.

```jsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export default function Layout({ children }) {
  return <main className={inter.className}>{children}</main>;
}
```

### Разделение кода

Next.js автоматически разделяет JavaScript-бандл по страницам — пользователь загружает только код, нужный для текущего маршрута.

## Next.js vs Create React App

| Возможность | Next.js | Create React App |
|---|---|---|
| SSR / SSG | Да | Нет |
| SEO | Отличное | Ограниченное |
| Маршрутизация | Файловая | Ручная (react-router) |
| API Routes | Да | Нет |
| Оптимизация изображений | Да | Нет |
| Настройка сборки | Минимальная | Требует eject |

Create React App (CRA) подходит для SPA-приложений без требований к SEO. Next.js — выбор по умолчанию для большинства production-проектов.

## App Router vs Pages Router

Начиная с версии 13, Next.js предлагает два подхода к маршрутизации:

- **Pages Router** (`pages/`) — классический подход, стабильный и хорошо документированный.
- **App Router** (`app/`) — новый подход на основе React Server Components (RSC). Рекомендован с Next.js 14.

App Router позволяет выполнять компоненты прямо на сервере без лишнего JavaScript на клиенте.

```jsx
// app/page.tsx — Server Component по умолчанию
async function HomePage() {
  const data = await fetch('https://api.example.com/data').then(r => r.json());

  return <h1>{data.title}</h1>;
}
```

## Когда выбирать Next.js

Next.js подойдёт, если:

- **Важно SEO** — блог, лендинг, интернет-магазин, новостной сайт.
- **Нужна высокая производительность** — статические страницы на CDN.
- **Проект растёт** — файловый роутинг, API Routes и встроенные оптимизации экономят время.
- **TypeScript** — поддержка без каких-либо настроек.

Чистый React (Vite + react-router) лучше подойдёт для:
- SPA-приложений без публичных страниц (admin-панели, дашборды).
- Проектов, где SEO не нужен.

## Быстрый старт

Создать новый Next.js-проект можно одной командой:

```bash
npx create-next-app@latest my-app --typescript --app
cd my-app
npm run dev
```

После запуска приложение будет доступно по адресу `http://localhost:3000`. Структура проекта с App Router:

```
my-app/
├── app/
│   ├── layout.tsx   — корневой layout
│   ├── page.tsx     — главная страница /
│   └── globals.css
├── public/          — статические файлы
└── next.config.js   — конфигурация Next.js
```

## Итог

Next.js — это React + маршрутизация + рендеринг на сервере + оптимизации + бэкенд в одной коробке. Он решает реальные проблемы production-разработки и при этом не ограничивает свободу: можно использовать любые SSR/SSG-стратегии на уровне отдельных страниц.

Если ты начинаешь новый React-проект и не уверен, нужен ли Next.js — скорее всего, нужен.
