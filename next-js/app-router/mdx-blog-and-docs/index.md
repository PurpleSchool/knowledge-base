---
metaTitle: "Next.js MDX: блог и документация — полное руководство"
metaDescription: "Как создать блог и документацию на Next.js с MDX: настройка, кастомные компоненты, frontmatter, подсветка синтаксиса и SEO."
author: "Антон Ларичев"
title: "Блог и документация на Next.js с MDX"
preview: "Пошаговое руководство по созданию блога и документации на Next.js App Router с использованием MDX, gray-matter и кастомных компонентов."
---

## Что такое MDX и зачем он нужен

MDX — это формат файлов, который объединяет Markdown и JSX. Он позволяет писать контент в привычном синтаксисе Markdown и при этом использовать React-компоненты прямо внутри текста.

Обычный Markdown ограничен: вы можете добавить текст, заголовки, списки и ссылки, но не можете встроить интерактивный компонент. MDX снимает это ограничение. Технический блог с примерами кода, документация с живыми демо, образовательные материалы с интерактивными упражнениями — всё это становится возможным без разделения контента и логики по разным системам.

Next.js App Router имеет встроенную поддержку MDX через пакет `@next/mdx`, что делает интеграцию минимальной по конфигурации.

## Установка и настройка

Для начала установите необходимые пакеты:

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react
npm install @types/mdx --save-dev
```

Затем обновите `next.config.ts`:

```typescript
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
```

Добавьте файл `mdx-components.tsx` в корень проекта — он обязателен при использовании MDX с App Router:

```typescript
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
```

Теперь файлы с расширением `.mdx` можно использовать как страницы Next.js.

## Структура блога на MDX

### Организация файлов

Для блога удобна следующая структура:

```
app/
  blog/
    page.tsx              # список статей
    [slug]/
      page.tsx            # страница статьи
content/
  blog/
    getting-started.mdx
    advanced-typescript.mdx
    nextjs-performance.mdx
```

Контент лежит отдельно от маршрутизации — это упрощает работу с файлами и позволяет переиспользовать статьи в разных частях сайта.

### Frontmatter и gray-matter

Frontmatter — это блок метаданных в начале MDX-файла в формате YAML. Установите `gray-matter` для его парсинга:

```bash
npm install gray-matter
```

Пример MDX-файла `content/blog/getting-started.mdx`:

```mdx
---
title: Начало работы с Next.js
date: 2026-08-15
description: Введение в разработку на Next.js App Router
author: Антон Ларичев
tags:
  - next-js
  - react
  - beginners
---

## Первые шаги

Next.js — это фреймворк для создания React-приложений...

Импортируйте и используйте компонент прямо в тексте:

<CodeSandbox url="https://example.com" />
```

Функция для получения всех статей с метаданными:

```typescript
// lib/blog.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  author: string;
  tags: string[];
}

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(BLOG_DIR);

  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace('.mdx', '');
      const fullPath = path.join(BLOG_DIR, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        description: data.description,
        author: data.author,
        tags: data.tags ?? [],
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  const fullPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return matter(fileContents);
}
```

### Страница списка статей

```typescript
// app/blog/page.tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Блог',
  description: 'Статьи о разработке на Next.js и React',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Блог</h1>
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold hover:text-blue-600">
                {post.title}
              </h2>
            </Link>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(post.date).toLocaleDateString('ru-RU')} — {post.author}
            </p>
            <p className="text-gray-700 mt-2">{post.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Динамическая страница статьи

```typescript
// app/blog/[slug]/page.tsx
import { getAllPosts } from '@/lib/blog';
import path from 'path';
import { notFound } from 'next/navigation';
import fs from 'fs';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const posts = getAllPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const { default: Post } = await import(`@/content/blog/${slug}.mdx`);

  return (
    <article className="max-w-3xl mx-auto py-12 px-4 prose prose-lg">
      <Post />
    </article>
  );
}
```

## Кастомные компоненты в MDX

Одно из главных преимуществ MDX — возможность заменить стандартные HTML-элементы собственными компонентами через `useMDXComponents`.

### Переопределение базовых элементов

```typescript
// mdx-components.tsx
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-10 mb-4 text-gray-900">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mt-8 mb-3 text-gray-800">{children}</h3>
    ),
    a: ({ href, children }) => (
      <Link href={href ?? '#'} className="text-blue-600 hover:underline">
        {children}
      </Link>
    ),
    img: ({ src, alt }) => (
      <Image
        src={src ?? ''}
        alt={alt ?? ''}
        width={800}
        height={450}
        className="rounded-lg my-6"
      />
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-6">
        {children}
      </blockquote>
    ),
    ...components,
  };
}
```

### Компонент Callout для документации

Для документации часто нужны блоки-выноски (tip, warning, danger):

```typescript
// components/Callout.tsx
interface CalloutProps {
  type?: 'info' | 'warning' | 'danger' | 'tip';
  children: React.ReactNode;
}

const styles = {
  info: 'bg-blue-50 border-blue-400 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-900',
  danger: 'bg-red-50 border-red-400 text-red-900',
  tip: 'bg-green-50 border-green-400 text-green-900',
};

const labels = {
  info: 'Информация',
  warning: 'Внимание',
  danger: 'Опасно',
  tip: 'Совет',
};

export function Callout({ type = 'info', children }: CalloutProps) {
  return (
    <div className={`border-l-4 p-4 rounded-r-lg my-6 ${styles[type]}`}>
      <p className="font-semibold mb-1">{labels[type]}</p>
      <div>{children}</div>
    </div>
  );
}
```

Использование в MDX-файле:

```mdx
<Callout type="warning">
  Эта функция устарела в Next.js 15. Используйте вместо неё `generateMetadata`.
</Callout>
```

## Подсветка синтаксиса

Для подсветки кода используйте `rehype-pretty-code` с темой на базе `shiki`:

```bash
npm install rehype-pretty-code shiki
```

Обновите конфигурацию:

```typescript
// next.config.ts
import createMDX from '@next/mdx';
import rehypePrettyCode from 'rehype-pretty-code';
import type { Options } from 'rehype-pretty-code';

const prettyCodeOptions: Options = {
  theme: 'github-dark',
  keepBackground: true,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  },
});
```

Теперь блоки кода в MDX автоматически получают подсветку синтаксиса с поддержкой более 100 языков.

## Структура документации

Для документации удобно использовать иерархическую структуру с навигацией:

```
content/
  docs/
    getting-started/
      installation.mdx
      quick-start.mdx
    guides/
      authentication.mdx
      deployment.mdx
    api/
      components.mdx
      hooks.mdx
```

### Навигационная конфигурация

```typescript
// lib/docs-nav.ts
export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: 'Начало работы',
    items: [
      { title: 'Установка', href: '/docs/getting-started/installation' },
      { title: 'Быстрый старт', href: '/docs/getting-started/quick-start' },
    ],
  },
  {
    title: 'Руководства',
    items: [
      { title: 'Аутентификация', href: '/docs/guides/authentication' },
      { title: 'Деплой', href: '/docs/guides/deployment' },
    ],
  },
  {
    title: 'API',
    items: [
      { title: 'Компоненты', href: '/docs/api/components' },
      { title: 'Хуки', href: '/docs/api/hooks' },
    ],
  },
];
```

### Layout для документации

```typescript
// app/docs/layout.tsx
import { docsNav } from '@/lib/docs-nav';
import Link from 'next/link';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r px-6 py-8 shrink-0">
        <nav>
          {docsNav.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-700 hover:text-blue-600 text-sm block py-1"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8 max-w-4xl">{children}</main>
    </div>
  );
}
```

## SEO и метаданные

Next.js позволяет генерировать метаданные на основе frontmatter статически через `generateMetadata`:

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const posts = getAllPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) return {};

  return {
    title: `${post.title} | Блог`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}
```

## Генерация RSS-ленты

Для блога полезно добавить RSS-ленту через Route Handler:

```typescript
// app/rss.xml/route.ts
import { getAllPosts } from '@/lib/blog';

export async function GET() {
  const posts = getAllPosts();
  const baseUrl = 'https://example.com';

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}</guid>
    </item>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Блог</title>
    <link>${baseUrl}/blog</link>
    <description>Статьи о разработке</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

## Оглавление статьи

Для длинных статей полезно автоматическое оглавление. Установите `remark-toc`:

```bash
npm install remark-toc
```

Добавьте плагин в конфигурацию:

```typescript
import remarkToc from 'remark-toc';

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      [remarkToc, { heading: 'Содержание', maxDepth: 3 }]
    ],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  },
});
```

Теперь достаточно добавить `## Содержание` в начало MDX-файла, и плагин автоматически сформирует список ссылок на заголовки.

## Типичные проблемы

### Импорты в MDX-файлах

MDX поддерживает импорт компонентов напрямую в файле:

```mdx
import { Chart } from '@/components/Chart';

## Статистика за 2026 год

<Chart data={[10, 20, 30]} />
```

Но злоупотреблять этим не стоит — лучше зарегистрировать часто используемые компоненты глобально через `useMDXComponents`.

### Проблема с динамическим импортом

При использовании `import('@/content/blog/${slug}.mdx')` TypeScript может не находить модуль. Добавьте объявление типа:

```typescript
// types/mdx.d.ts
declare module '*.mdx' {
  import type { MDXComponents } from 'mdx/types';
  export const components: MDXComponents;
  export default function MDXContent(props: unknown): JSX.Element;
}
```

### Сборка при большом количестве статей

Если статей несколько сотен, `generateStaticParams` может замедлить сборку. Используйте `dynamicParams = true` и ISR:

```typescript
export const dynamicParams = true;
export const revalidate = 3600; // пересборка каждый час
```

Это позволит генерировать страницы по запросу и кэшировать их, не перестраивая весь сайт целиком при добавлении новой статьи.

## Итог

MDX в связке с Next.js App Router даёт мощный инструмент для создания контентных сайтов. Ключевые моменты:

- Установка через `@next/mdx` с минимальной конфигурацией
- Метаданные через `gray-matter` frontmatter
- Кастомные компоненты через `useMDXComponents`
- Подсветка синтаксиса через `rehype-pretty-code`
- Статическая генерация через `generateStaticParams`
- SEO через `generateMetadata` на основе frontmatter

Такой подход используется в документации многих популярных библиотек, включая Next.js, Tailwind CSS и Radix UI.

Чтобы освоить Next.js глубоко — от маршрутизации App Router до деплоя — пройдите курс на PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-mdx-blog-docs)
