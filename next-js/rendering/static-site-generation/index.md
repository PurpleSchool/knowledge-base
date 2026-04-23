---
metaTitle: Static Site Generation (SSG) в Next.js — getStaticProps и getStaticPaths
metaDescription: Полный разбор SSG в Next.js — функции getStaticProps и getStaticPaths, генерация статических страниц, fallback-режимы и когда использовать SSG.
author: Антон Ларичев
title: Static Site Generation (SSG) в Next.js — getStaticProps и getStaticPaths
preview: Разбираем статическую генерацию сайтов в Next.js — getStaticProps для получения данных при сборке, getStaticPaths для динамических маршрутов и fallback-стратегии.
---

## Введение

Static Site Generation (SSG) — стратегия рендеринга в Next.js, при которой HTML-страницы генерируются **один раз** во время сборки (`next build`) и затем раздаются как статические файлы. Это делает SSG самым быстрым способом доставки контента: статические файлы можно кешировать на CDN и отдавать пользователям из ближайшего к ним сервера.

В Pages Router SSG реализован через функции `getStaticProps` и `getStaticPaths`. В App Router SSG является поведением по умолчанию — если вы не отключаете кеш, Next.js кеширует результат fetch-запросов на время сборки.

В этой статье подробно разберём Pages Router-подход как наиболее явный и показательный.

## Как работает SSG

Когда вы запускаете `next build`, Next.js:

1. Находит все страницы с экспортированной функцией `getStaticProps`.
2. Вызывает `getStaticProps` для каждой такой страницы.
3. Передаёт возвращённые данные в компонент.
4. Рендерит компонент в HTML-строку и сохраняет как `.html`-файл.
5. При запросе пользователя — сервер или CDN отдают готовый HTML без какой-либо серверной обработки.

Ключевое преимущество: время ответа сервера минимально, потому что нет обращений к базам данных или внешним API во время обслуживания запросов.

## Функция getStaticProps

`getStaticProps` — асинхронная функция, выполняемая только в момент сборки (в production). В режиме разработки она вызывается при каждом запросе для удобства работы.

### Базовый пример

```typescript
// pages/blog.tsx
import type { GetStaticProps, NextPage } from 'next';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Props {
  posts: Post[];
  generatedAt: string;
}

const BlogPage: NextPage<Props> = ({ posts, generatedAt }) => {
  return (
    <div>
      <h1>Блог</h1>
      <p>Страница сгенерирована: {generatedAt}</p>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Выполняется только во время сборки
export const getStaticProps: GetStaticProps<Props> = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts: Post[] = await response.json();

  return {
    props: {
      posts: posts.slice(0, 20),
      // Время генерации страницы — зафиксируется в момент сборки
      generatedAt: new Date().toISOString(),
    },
  };
};

export default BlogPage;
```

Если хотите глубоко разобраться в Next.js и всех стратегиях рендеринга — приходите на наш курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=static-site-generation). На курсе 120 уроков и 30 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Чтение файлов из файловой системы

`getStaticProps` работает в Node.js-среде, поэтому имеет доступ к файловой системе. Это особенно полезно для блогов на основе Markdown:

```typescript
// pages/docs.tsx
import fs from 'fs';
import path from 'path';
import type { GetStaticProps, NextPage } from 'next';

interface DocItem {
  filename: string;
  content: string;
  size: number;
}

interface Props {
  docs: DocItem[];
}

const DocsPage: NextPage<Props> = ({ docs }) => {
  return (
    <div>
      <h1>Документация</h1>
      {docs.map((doc) => (
        <div key={doc.filename}>
          <h2>{doc.filename}</h2>
          <pre>{doc.content.substring(0, 200)}...</pre>
        </div>
      ))}
    </div>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Путь к папке с документацией
  const docsDir = path.join(process.cwd(), 'content', 'docs');
  const filenames = fs.readdirSync(docsDir);

  const docs = filenames
    .filter((name) => name.endsWith('.md'))
    .map((filename) => {
      const filePath = path.join(docsDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);

      return {
        filename,
        content,
        size: stats.size,
      };
    });

  return {
    props: { docs },
  };
};

export default DocsPage;
```

## Динамические маршруты: функция getStaticPaths

Для динамических маршрутов (например `/blog/[slug]`) нужно сообщить Next.js, какие конкретные значения параметров генерировать. Это делается через `getStaticPaths`.

### Пример с getStaticPaths

```typescript
// pages/blog/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';

interface Post {
  id: number;
  title: string;
  body: string;
  slug: string;
}

interface Props {
  post: Post;
}

const PostPage: NextPage<Props> = ({ post }) => {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.body}</div>
    </article>
  );
};

// Определяем все возможные значения [slug]
export const getStaticPaths: GetStaticPaths = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts: Post[] = await response.json();

  // Генерируем список путей для всех постов
  const paths = posts.map((post) => ({
    params: { slug: String(post.id) },
  }));

  return {
    paths,
    // false — 404 для путей, не вернутых из getStaticPaths
    fallback: false,
  };
};

// Получаем данные для конкретного поста
export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const { slug } = context.params as { slug: string };

  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${slug}`
  );

  if (!response.ok) {
    return { notFound: true };
  }

  const post: Post = await response.json();

  return {
    props: { post: { ...post, slug } },
  };
};

export default PostPage;
```

## Режимы fallback в getStaticPaths

Параметр `fallback` определяет поведение для маршрутов, не включённых в `paths`:

| Значение | Поведение |
|----------|-----------|
| `false` | Все незаданные пути возвращают 404 |
| `true` | Незаданные пути отображают fallback-версию, пока генерируется страница |
| `'blocking'` | Незаданные пути ждут генерации страницы на сервере (как SSR) |

```typescript
// Пример с fallback: 'blocking' — полезен когда постов очень много
export const getStaticPaths: GetStaticPaths = async () => {
  // Предгенерируем только первые 100 самых популярных постов
  const response = await fetch('https://api.example.com/posts/popular?limit=100');
  const popularPosts = await response.json();

  const paths = popularPosts.map((post: Post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    // Остальные страницы сгенерируются по запросу и закешируются
    fallback: 'blocking',
  };
};
```

## Когда использовать SSG

SSG — оптимальный выбор в следующих ситуациях:

* **Контент меняется редко** — документация, блог, лендинги, страницы о компании.
* **SEO критически важен** — статические страницы отлично индексируются поисковиками.
* **Высокие требования к производительности** — статические файлы на CDN обрабатываются быстрее любого SSR.
* **Контент одинаков для всех** — страница не зависит от авторизации или персональных данных пользователя.
* **Масштабирование** — статический хостинг (Vercel, Netlify, S3) дешевле и надёжнее динамического сервера.

## SSG в App Router

В App Router SSG является поведением по умолчанию. Если вы делаете `fetch` без специальных параметров, Next.js автоматически кеширует результат:

```typescript
// app/blog/page.tsx — Server Component, кешируется при сборке

interface Post {
  id: number;
  title: string;
}

async function BlogPage() {
  // По умолчанию Next.js кеширует этот запрос при сборке (SSG-поведение)
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts: Post[] = await response.json();

  return (
    <ul>
      {posts.slice(0, 10).map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default BlogPage;
```

Для динамических страниц в App Router используется `generateStaticParams`:

```typescript
// app/blog/[id]/page.tsx

interface Post {
  id: number;
  title: string;
  body: string;
}

// Аналог getStaticPaths
export async function generateStaticParams() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const posts: Post[] = await response.json();

  return posts.map((post) => ({
    id: String(post.id),
  }));
}

// Аналог getStaticProps — данные для конкретной страницы
async function PostPage({ params }: { params: { id: string } }) {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${params.id}`
  );
  const post: Post = await response.json();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}

export default PostPage;
```

## Частые ошибки

* **Слишком много страниц в getStaticPaths.** Если у вас миллионы записей, генерировать их все при сборке нецелесообразно. Используйте `fallback: 'blocking'` и предгенерируйте только популярные страницы.

* **Обращение к браузерным API в getStaticProps.** Всё в `getStaticProps` выполняется в Node.js. `window`, `localStorage`, `navigator` здесь недоступны.

* **Ожидание свежих данных от SSG.** Данные в SSG замораживаются в момент сборки. Если вам нужны свежие данные — используйте ISR с `revalidate` или переходите на SSR.

* **Передача несериализуемых данных в props.** Next.js сериализует props в JSON. Объекты класса Date, Map, Set, undefined не передаются напрямую — конвертируйте в строки или примитивы.

## Часто задаваемые вопросы

**Можно ли использовать SSG и SSR на одном сайте?**

Да. В Next.js каждая страница независима. Одни страницы могут использовать SSG, другие — SSR, третьи — ISR. Это одно из ключевых преимуществ Next.js.

**Что происходит с данными после сборки?**

Данные «замораживаются» в HTML. Для обновления нужно перезапустить сборку. Если нужно автоматическое обновление без ребилда — используйте ISR с `revalidate`.

**Как тестировать SSG локально?**

В режиме `next dev` функция `getStaticProps` вызывается при каждом запросе. Чтобы проверить реальное SSG-поведение — запустите `next build && next start`.

## Заключение

SSG — лучшая стратегия рендеринга для контента, который не меняется между деплоями. Статические страницы работают быстрее, стоят дешевле в инфраструктуре и легко масштабируются через CDN.

Для закрепления навыков работы со стратегиями рендеринга в Next.js рекомендуем курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=static-site-generation). В первых модулях доступно бесплатное содержание, что позволяет изучить ключевые концепции и понять структуру курса до покупки полного доступа.
