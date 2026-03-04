---
metaTitle: Динамические маршруты в Next.js — App Router, [slug], generateStaticParams
metaDescription: Полное руководство по динамическим маршрутам в Next.js App Router. Параметры [slug], catch-all [...slug], опциональные [[...slug]], generateStaticParams для статической генерации, вложенные динамические сегменты и примеры кода
author: Олег Марков
title: Динамические маршруты в Next.js
preview: Освойте динамические маршруты в Next.js App Router — изучите синтаксис [slug], catch-all [...slug] и опциональные [[...slug]] сегменты, generateStaticParams для SSG, params в Server Components и Client Components
---

## Введение

Динамические маршруты — ключевой инструмент для построения реальных приложений. Страницы товаров, профили пользователей, статьи блога — все они требуют URL с переменными сегментами вида `/products/42` или `/blog/2024/hello-world`.

Next.js App Router предоставляет мощную файловую систему маршрутизации, в которой динамические сегменты обозначаются квадратными скобками в именах папок. В этой статье вы разберётесь с основными типами динамических маршрутов, научитесь использовать параметры в Server и Client Components, а также освоите `generateStaticParams` для предварительной генерации страниц.

## Файловая система маршрутизации Next.js

В Next.js App Router (директория `app/`) каждая папка соответствует сегменту URL. Файл `page.tsx` внутри папки делает маршрут доступным.

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
└── blog/
    └── page.tsx          → /blog
```

Для динамических сегментов используются квадратные скобки `[paramName]`:

```
app/
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/
│       └── page.tsx      → /blog/:slug (любой slug)
└── users/
    └── [userId]/
        └── page.tsx      → /users/:userId
```

## Базовые динамические сегменты `[param]`

### Структура файлов

Создайте папку с именем в квадратных скобках:

```
app/
└── products/
    └── [id]/
        ├── page.tsx
        └── loading.tsx
```

### Параметры в Server Component

В Next.js App Router параметры передаются через `props.params` в компонент страницы:

```tsx
// app/products/[id]/page.tsx
interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // params.id — значение из URL
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then(res => res.json());

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>Цена: {product.price} ₽</span>
    </div>
  );
}
```

При запросе `/products/42` значение `params.id` будет `"42"`.

### Несколько параметров

Можно вложить несколько динамических сегментов:

```
app/
└── shop/
    └── [category]/
        └── [productId]/
            └── page.tsx
```

```tsx
// app/shop/[category]/[productId]/page.tsx
interface ShopPageProps {
  params: {
    category: string;
    productId: string;
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { category, productId } = params;

  return (
    <div>
      <p>Категория: {category}</p>
      <p>Товар ID: {productId}</p>
    </div>
  );
}
```

URL `/shop/electronics/laptop-123` → `category = "electronics"`, `productId = "laptop-123"`.

### searchParams — параметры запроса

В дополнение к `params` (сегменты пути), компонент страницы получает `searchParams` для query string:

```tsx
// app/products/[id]/page.tsx
interface ProductPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const color = searchParams.color;  // /products/42?color=red → "red"
  const sizes = searchParams.size;   // /products/42?size=S&size=M → ["S", "M"]

  return (
    <div>
      <h1>Товар {params.id}</h1>
      {color && <p>Цвет: {color}</p>}
    </div>
  );
}
```

## Catch-all сегменты `[...slug]`

Catch-all сегменты захватывают **один и более** сегментов пути:

```
app/
└── docs/
    └── [...slug]/
        └── page.tsx
```

| URL | `params.slug` |
|-----|---------------|
| `/docs/intro` | `["intro"]` |
| `/docs/getting-started/installation` | `["getting-started", "installation"]` |
| `/docs/api/v2/endpoints/users` | `["api", "v2", "endpoints", "users"]` |
| `/docs` | 404 (не совпадает) |

```tsx
// app/docs/[...slug]/page.tsx
interface DocsPageProps {
  params: {
    slug: string[];
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = params;
  // slug — массив строк

  // Для /docs/api/v2/users → slug = ["api", "v2", "users"]
  const breadcrumbs = slug.map((segment, index) => ({
    label: segment,
    href: `/docs/${slug.slice(0, index + 1).join('/')}`
  }));

  const content = await fetchDocContent(slug.join('/'));

  return (
    <div>
      <nav>
        {breadcrumbs.map(crumb => (
          <a key={crumb.href} href={crumb.href}>{crumb.label}</a>
        ))}
      </nav>
      <article dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

async function fetchDocContent(path: string): Promise<string> {
  // Загрузка контента по пути
  const res = await fetch(`https://api.example.com/docs/${path}`);
  return res.text();
}
```

### Реальный пример: документация с вложенными разделами

```
app/
└── docs/
    ├── page.tsx          → /docs (главная документации)
    └── [...slug]/
        └── page.tsx      → /docs/... (любой вложенный путь)
```

```tsx
// app/docs/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

interface DocsProps {
  params: { slug: string[] };
}

export default async function DocsArticle({ params }: DocsProps) {
  const filePath = path.join(
    process.cwd(),
    'content',
    'docs',
    ...params.slug,
    'index.md'
  );

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return <article>{content}</article>;
  } catch {
    notFound(); // Вернёт 404, если файл не найден
  }
}
```

## Опциональные catch-all сегменты `[[...slug]]`

Двойные квадратные скобки делают catch-all **опциональным** — маршрут совпадает в том числе с базовым путём без сегментов:

```
app/
└── shop/
    └── [[...filters]]/
        └── page.tsx
```

| URL | `params.filters` |
|-----|-----------------|
| `/shop` | `undefined` |
| `/shop/electronics` | `["electronics"]` |
| `/shop/electronics/phones` | `["electronics", "phones"]` |
| `/shop/electronics/phones/apple` | `["electronics", "phones", "apple"]` |

```tsx
// app/shop/[[...filters]]/page.tsx
interface ShopProps {
  params: {
    filters?: string[];
  };
}

export default async function ShopPage({ params }: ShopProps) {
  const { filters } = params;

  // Когда /shop — filters равен undefined
  // Когда /shop/electronics/phones — filters = ["electronics", "phones"]

  const category = filters?.[0];
  const subcategory = filters?.[1];

  const products = await fetchProducts({ category, subcategory });

  return (
    <div>
      <h1>
        {category ? `Категория: ${category}` : 'Все товары'}
      </h1>
      {subcategory && <p>Подкатегория: {subcategory}</p>}
      <ProductList products={products} />
    </div>
  );
}
```

### Разница между `[...slug]` и `[[...slug]]`

| Синтаксис | `/base` | `/base/a` | `/base/a/b` |
|-----------|---------|-----------|-------------|
| `[...slug]` | 404 | совпадает | совпадает |
| `[[...slug]]` | совпадает | совпадает | совпадает |

## generateStaticParams — статическая генерация

`generateStaticParams` позволяет Next.js предварительно сгенерировать страницы во время сборки (SSG), что критически важно для производительности.

### Базовый пример

```tsx
// app/blog/[slug]/page.tsx

// Эта функция вызывается во время сборки
export async function generateStaticParams() {
  // Возвращаем список всех возможных значений params
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
  // Результат: [{ slug: "intro" }, { slug: "setup" }, { slug: "deploy" }]
  // Next.js создаст: /blog/intro, /blog/setup, /blog/deploy
}

interface BlogPostProps {
  params: { slug: string };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`)
    .then(r => r.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### generateStaticParams с несколькими параметрами

```tsx
// app/[lang]/blog/[slug]/page.tsx

export async function generateStaticParams() {
  const languages = ['ru', 'en', 'de'];
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  // Генерируем все комбинации lang + slug
  return languages.flatMap(lang =>
    posts.map((post: { slug: string }) => ({
      lang,
      slug: post.slug,
    }))
  );
  // [
  //   { lang: "ru", slug: "intro" },
  //   { lang: "en", slug: "intro" },
  //   { lang: "de", slug: "intro" },
  //   ...
  // ]
}

interface LocalizedPostProps {
  params: { lang: string; slug: string };
}

export default async function LocalizedPost({ params }: LocalizedPostProps) {
  const { lang, slug } = params;
  const post = await fetch(`https://api.example.com/${lang}/posts/${slug}`)
    .then(r => r.json());

  return <article>{post.content}</article>;
}
```

### generateStaticParams для catch-all

```tsx
// app/docs/[...slug]/page.tsx

export async function generateStaticParams() {
  // Возвращаем массивы slug для каждого пути
  return [
    { slug: ['intro'] },
    { slug: ['getting-started', 'installation'] },
    { slug: ['getting-started', 'configuration'] },
    { slug: ['api', 'reference', 'endpoints'] },
  ];
}

// Создаёт страницы:
// /docs/intro
// /docs/getting-started/installation
// /docs/getting-started/configuration
// /docs/api/reference/endpoints
```

### dynamicParams — поведение при отсутствии в generateStaticParams

По умолчанию Next.js будет рендерить несгенерированные страницы динамически. Вы можете отключить это:

```tsx
// app/blog/[slug]/page.tsx

// Запрещает доступ к страницам, не перечисленным в generateStaticParams
export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    { slug: 'post-1' },
    { slug: 'post-2' },
  ];
}
```

При `dynamicParams = false` запрос к несуществующему slug вернёт 404. При `dynamicParams = true` (по умолчанию) — страница рендерится динамически.

## Метаданные для динамических страниц

В App Router метаданные можно генерировать динамически с помощью `generateMetadata`:

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then(r => r.json());

  return {
    title: `${product.name} — Магазин`,
    description: product.description,
    openGraph: {
      title: product.name,
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then(r => r.json());

  return (
    <div>
      <h1>{product.name}</h1>
    </div>
  );
}
```

## Параметры в Client Components

В Client Components параметры маршрута получают через хуки из `next/navigation`:

```tsx
// components/ProductActions.tsx
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

export function ProductActions() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // params.id — текущий ID продукта
  const productId = params.id as string;

  // searchParams — параметры запроса
  const color = searchParams.get('color');

  const handleVariantChange = (newColor: string) => {
    // Программная навигация с обновлением searchParams
    router.push(`/products/${productId}?color=${newColor}`);
  };

  return (
    <div>
      <p>Текущий цвет: {color || 'не выбран'}</p>
      <button onClick={() => handleVariantChange('red')}>Красный</button>
      <button onClick={() => handleVariantChange('blue')}>Синий</button>
    </div>
  );
}
```

### useParams для catch-all в Client Components

```tsx
'use client';

import { useParams } from 'next/navigation';

export function BreadcrumbNav() {
  const params = useParams();

  // Для catch-all [...slug] params.slug — массив
  const slug = params.slug as string[];

  return (
    <nav>
      <a href="/">Главная</a>
      {slug?.map((segment, index) => {
        const href = '/' + slug.slice(0, index + 1).join('/');
        return (
          <span key={href}>
            {' / '}
            <a href={href}>{segment}</a>
          </span>
        );
      })}
    </nav>
  );
}
```

## Параллельные и перехватывающие маршруты с динамическими сегментами

### Parallel Routes

Next.js App Router поддерживает параллельные маршруты через именованные слоты `@slotName`:

```
app/
└── dashboard/
    ├── @analytics/
    │   └── [period]/
    │       └── page.tsx
    ├── @overview/
    │   └── page.tsx
    └── layout.tsx
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  overview,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  overview: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <main>{children}</main>
      <aside>{analytics}</aside>
      <section>{overview}</section>
    </div>
  );
}
```

### Intercepting Routes

Перехватывающие маршруты позволяют показывать контент в модальном окне без полного перехода:

```
app/
├── photos/
│   └── [id]/
│       └── page.tsx      → /photos/42 (полная страница)
└── (.)photos/
    └── [id]/
        └── page.tsx      → /photos/42 (модальное окно при переходе из галереи)
```

## Обработка 404 для динамических маршрутов

### Через notFound()

```tsx
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function ProductPage({ params }: Props) {
  const res = await fetch(`https://api.example.com/products/${params.id}`);

  if (!res.ok) {
    notFound(); // Рендерит not-found.tsx
  }

  const product = await res.json();

  return <div>{product.name}</div>;
}
```

### Кастомная страница 404

```tsx
// app/products/[id]/not-found.tsx
import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div>
      <h1>Товар не найден</h1>
      <p>Запрошенный товар не существует или был удалён.</p>
      <Link href="/products">Вернуться к каталогу</Link>
    </div>
  );
}
```

## Кэширование и ревалидация

### Управление кэшем в динамических маршрутах

```tsx
// app/products/[id]/page.tsx

// Ревалидация каждые 60 секунд (ISR)
export const revalidate = 60;

// Или через fetch options
async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    next: {
      revalidate: 60,           // ISR: обновлять каждые 60 секунд
      tags: [`product-${id}`],  // Тег для ручной ревалидации
    }
  });
  return res.json();
}
```

### On-Demand Revalidation

```tsx
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { productId } = await request.json();

  // Ревалидация по тегу
  revalidateTag(`product-${productId}`);

  // Или по пути
  revalidatePath(`/products/${productId}`);

  return Response.json({ revalidated: true });
}
```

## Полный пример: блог с Next.js App Router

Рассмотрим полный пример блога с динамическими маршрутами:

```
app/
├── blog/
│   ├── page.tsx                → /blog (список статей)
│   ├── [slug]/
│   │   ├── page.tsx            → /blog/:slug (статья)
│   │   └── not-found.tsx       → 404 для статьи
│   └── [...category]/
│       └── page.tsx            → /blog/* (статьи по категории)
└── page.tsx                    → / (главная)
```

```tsx
// app/blog/page.tsx
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
}

async function getPosts(): Promise<Post[]> {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 300 }
  });
  return res.json();
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Блог</h1>
      <ul>
        {posts.map(post => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <time>{post.date}</time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Post {
  slug: string;
  title: string;
  content: string;
  date: string;
  author: string;
  metaDescription: string;
}

interface Props {
  params: { slug: string };
}

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { tags: [`post-${slug}`] }
  });

  if (!res.ok) return null;
  return res.json();
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return { title: 'Статья не найдена' };
  }

  return {
    title: `${post.title} | Блог`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

// Статическая генерация всех статей
export async function generateStaticParams() {
  const posts: Post[] = await fetch('https://api.example.com/posts')
    .then(r => r.json());

  return posts.map(post => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <p>
          <time dateTime={post.date}>{post.date}</time>
          {' · '}
          <span>{post.author}</span>
        </p>
      </header>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

```tsx
// app/blog/[slug]/not-found.tsx
import Link from 'next/link';

export default function PostNotFound() {
  return (
    <div>
      <h1>Статья не найдена</h1>
      <Link href="/blog">← Вернуться к блогу</Link>
    </div>
  );
}
```

## TypeScript: типизация динамических параметров

### Утилита для безопасного доступа к params

В Next.js 15 параметры `params` стали Promise — необходимо использовать `await`:

```tsx
// Next.js 15: params — Promise
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

### Типы для разных сегментов

```tsx
// Обычный сегмент [id]
interface SingleParam {
  params: { id: string };
}

// Несколько сегментов [category]/[id]
interface MultipleParams {
  params: { category: string; id: string };
}

// Catch-all [...slug]
interface CatchAllParams {
  params: { slug: string[] };
}

// Опциональный catch-all [[...slug]]
interface OptionalCatchAllParams {
  params: { slug?: string[] };
}

// С searchParams
interface WithSearchParams {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}
```

## Сравнение типов динамических маршрутов

| Тип | Синтаксис | Совпадает с | params |
|-----|-----------|-------------|--------|
| Обычный | `[id]` | `/123`, `/abc` | `{ id: "123" }` |
| Catch-all | `[...slug]` | `/a`, `/a/b`, `/a/b/c` | `{ slug: ["a", "b"] }` |
| Опциональный | `[[...slug]]` | `/`, `/a`, `/a/b` | `undefined` или `{ slug: ["a"] }` |

## Лучшие практики

### 1. Всегда обрабатывайте случай "не найдено"

```tsx
export default async function Page({ params }: Props) {
  const data = await fetchData(params.id);

  if (!data) {
    notFound(); // Не забывайте про этот вызов!
  }

  return <div>{data.title}</div>;
}
```

### 2. Используйте generateStaticParams для контента, который меняется редко

```tsx
// Хорошо для: статьи блога, страницы продуктов, документация
export async function generateStaticParams() {
  const items = await fetchAllItems();
  return items.map(item => ({ slug: item.slug }));
}

// Плохо для: пользовательские профили (у вас миллионы пользователей)
// — лучше оставить динамический рендеринг
```

### 3. Дедупликация запросов через React cache

```tsx
import { cache } from 'react';

// Этот запрос автоматически дедупликается
// даже при вызове из page.tsx и generateMetadata
const getPost = cache(async (slug: string) => {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
});

// Используется и в generateMetadata, и в компоненте страницы
export async function generateMetadata({ params }: Props) {
  const post = await getPost(params.slug); // Запрос выполнится только один раз
  return { title: post.title };
}

export default async function Page({ params }: Props) {
  const post = await getPost(params.slug); // Возвращает кэшированный результат
  return <article>{post.content}</article>;
}
```

### 4. Правильно используйте loading.tsx для динамических страниц

```tsx
// app/products/[id]/loading.tsx
export default function ProductLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
    </div>
  );
}
```

### 5. Error boundary для динамических маршрутов

```tsx
// app/products/[id]/error.tsx
'use client';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Ошибка загрузки товара</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}
```

## Итог

Next.js App Router предоставляет три типа динамических маршрутов:

- **`[param]`** — обычный параметр для одного сегмента пути
- **`[...slug]`** — catch-all для одного и более сегментов
- **`[[...slug]]`** — опциональный catch-all включая базовый путь

`generateStaticParams` позволяет предварительно генерировать страницы при сборке, что значительно ускоряет их загрузку и улучшает SEO. В Server Components параметры приходят через `props.params`, в Client Components — через хук `useParams()`.

Правильная комбинация типов маршрутов, `generateStaticParams`, кэширования и `notFound()` позволяет строить быстрые и надёжные приложения на Next.js.
