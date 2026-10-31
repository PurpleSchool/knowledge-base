---
metaTitle: "React cache() — кэширование вычислений в React 19"
metaDescription: "Разбираем React cache() из React 19: как работает мемоизация в Server Components, отличие от useMemo, практические примеры дедупликации запросов."
author: "Антон Ларичев"
title: "React cache() — кэширование вычислений в React 19"
preview: "Как использовать cache() для мемоизации дорогих вычислений и дедупликации fetch-запросов в React Server Components."
---

## Что такое cache() и зачем он нужен

Функция `cache()` появилась в React 19 как инструмент мемоизации, предназначенный прежде всего для **React Server Components**. Её главная задача — дедуплицировать дорогие вычисления или запросы к базе данных, когда несколько компонентов в одном дереве рендера запрашивают одни и те же данные.

До появления `cache()` разработчики решали эту проблему вручную: выносили fetch-вызовы на уровень выше и пробрасывали данные через пропсы, либо использовали глобальные синглтоны. Оба подхода загромождают архитектуру. `cache()` позволяет каждому компоненту объявить собственный запрос данных, при этом React гарантирует, что за один серверный рендер функция с одинаковыми аргументами выполнится ровно один раз.

```typescript
import { cache } from 'react';

const getUser = cache(async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});
```

Первый вызов `getUser('42')` выполнит запрос. Все последующие вызовы с тем же аргументом `'42'` в рамках одного рендера вернут закэшированный результат без повторного обращения к API.

## Синтаксис и базовое использование

`cache()` принимает любую функцию и возвращает её кэшированную версию:

```typescript
import { cache } from 'react';

const cachedFn = cache(fn);
```

Кэшированная функция работает как оригинальная, но при первом вызове с конкретным набором аргументов сохраняет результат. При повторном вызове с идентичными аргументами возвращает сохранённый результат.

Аргументы сравниваются по ссылке (как в `Map`), поэтому примитивы (`string`, `number`, `boolean`) сравниваются по значению, объекты — по ссылке.

```typescript
import { cache } from 'react';

const getProduct = cache(async (id: number) => {
  console.log('Fetching product', id);
  const res = await fetch(`https://api.example.com/products/${id}`);
  return res.json();
});

// В одном дереве рендера:
await getProduct(1); // Выполняет запрос, логирует "Fetching product 1"
await getProduct(2); // Выполняет запрос, логирует "Fetching product 2"
await getProduct(1); // Возвращает кэш, НЕ логирует
```

## Дедупликация запросов в Server Components

Самый распространённый сценарий — несколько серверных компонентов нуждаются в одних данных. Без кэширования каждый компонент сделает отдельный запрос:

```typescript
// lib/data.ts
import { cache } from 'react';

export const getArticle = cache(async (slug: string) => {
  const res = await fetch(`https://api.example.com/articles/${slug}`);
  if (!res.ok) throw new Error('Article not found');
  return res.json();
});
```

```typescript
// components/ArticleHeader.tsx (Server Component)
import { getArticle } from '@/lib/data';

export async function ArticleHeader({ slug }: { slug: string }) {
  const article = await getArticle(slug); // первый вызов — запрос выполняется
  return <h1>{article.title}</h1>;
}
```

```typescript
// components/ArticleMeta.tsx (Server Component)
import { getArticle } from '@/lib/data';

export async function ArticleMeta({ slug }: { slug: string }) {
  const article = await getArticle(slug); // тот же slug — возвращается кэш
  return (
    <div>
      <span>{article.author}</span>
      <time>{article.publishedAt}</time>
    </div>
  );
}
```

```typescript
// app/articles/[slug]/page.tsx
import { ArticleHeader } from '@/components/ArticleHeader';
import { ArticleMeta } from '@/components/ArticleMeta';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <>
      <ArticleHeader slug={params.slug} />
      <ArticleMeta slug={params.slug} />
    </>
  );
}
```

Несмотря на то что `getArticle` вызывается в двух разных компонентах, сетевой запрос уйдёт ровно один раз за рендер страницы.

## Кэширование тяжёлых вычислений

`cache()` полезен не только для сетевых запросов. Любая функция с дорогим вычислением выиграет от мемоизации:

```typescript
import { cache } from 'react';

const computeRecommendations = cache((userId: string, categoryId: string) => {
  // Дорогой алгоритм — обход графа, векторное сравнение и т.д.
  return heavyRecommendationAlgorithm(userId, categoryId);
});

// Оба компонента получат одинаковый результат без повторного вычисления
const recs1 = computeRecommendations('user-1', 'electronics');
const recs2 = computeRecommendations('user-1', 'electronics');
```

## Отличие от useMemo и memo

Важно понимать, что `cache()`, `useMemo` и `React.memo` решают разные задачи:

| Инструмент | Где работает | Область кэша | Цель |
|---|---|---|---|
| `cache()` | Server Components | Один серверный рендер | Дедупликация между компонентами |
| `useMemo` | Client Components | Один экземпляр компонента | Дорогое вычисление между ре-рендерами |
| `React.memo` | Client Components | Один экземпляр компонента | Пропуск ре-рендера при неизменных пропсах |

`useMemo` привязан к жизни конкретного экземпляра компонента и не позволяет делиться результатом между разными компонентами. `cache()` работает на уровне всего серверного рендера — любой компонент в дереве получит кэшированный результат.

```typescript
// Неправильно: useMemo недоступен в Server Components
// и не даёт дедупликации между компонентами
export async function WrongComponent({ id }: { id: string }) {
  // useMemo здесь не работает — Server Component не имеет хуков
  const data = useMemo(() => fetchData(id), [id]); // ошибка!
}

// Правильно: cache() для Server Components
const fetchData = cache(async (id: string) => {
  return await db.query(`SELECT * FROM items WHERE id = $1`, [id]);
});

export async function CorrectComponent({ id }: { id: string }) {
  const data = await fetchData(id);
  return <div>{data.name}</div>;
}
```

## Область действия кэша

Кэш функции, созданной через `cache()`, живёт **в рамках одного серверного рендера**. При следующем запросе кэш сбрасывается. Это принципиально отличает `cache()` от серверного кэша (например, `unstable_cache` в Next.js), который сохраняет данные между запросами.

```typescript
import { cache } from 'react';

const getSession = cache(async (token: string) => {
  return await validateToken(token); // вызов к базе данных
});

// Запрос 1:
// getSession('abc') → обращается к БД
// getSession('abc') → возвращает кэш из памяти

// Запрос 2 (новый HTTP-запрос):
// getSession('abc') → снова обращается к БД (кэш сброшен)
```

Такое поведение гарантирует изоляцию данных между пользователями — данные одного пользователя никогда не попадут в ответ другому.

## Работа с аргументами-объектами

Поскольку аргументы сравниваются по ссылке, передача нового объекта при каждом вызове отключит кэширование:

```typescript
import { cache } from 'react';

const getFilteredProducts = cache(async (filters: object) => {
  return await db.products.findMany({ where: filters });
});

// Эти вызовы НЕ будут дедуплицированы — разные объекты, разные ссылки
getFilteredProducts({ category: 'books' });
getFilteredProducts({ category: 'books' }); // отдельный запрос!
```

Для объектных аргументов используйте примитивные ключи или нормализованные строки:

```typescript
import { cache } from 'react';

const getFilteredProducts = cache(async (category: string, minPrice: number) => {
  return await db.products.findMany({
    where: { category, price: { gte: minPrice } },
  });
});

// Теперь кэширование работает корректно
getFilteredProducts('books', 100);
getFilteredProducts('books', 100); // кэш!
```

## Предварительная загрузка данных (preload-паттерн)

Сочетание `cache()` с функцией предварительной загрузки позволяет начать fetch как можно раньше:

```typescript
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// Функция-«пустышка» для запуска кэширования без await
export function preloadUser(id: string) {
  void getUser(id);
}
```

```typescript
// app/profile/[id]/page.tsx
import { preloadUser, getUser } from '@/lib/data';
import { UserProfile } from '@/components/UserProfile';
import { UserPosts } from '@/components/UserPosts';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  // Запускаем fetch немедленно, не блокируясь на await
  preloadUser(params.id);

  return (
    <>
      {/* Оба компонента получат данные из кэша */}
      <UserProfile userId={params.id} />
      <UserPosts userId={params.id} />
    </>
  );
}
```

## Обработка ошибок

Если кэшированная функция выбросила исключение, `cache()` не кэширует ошибку — повторный вызов снова попытается выполнить функцию:

```typescript
import { cache } from 'react';

const getConfig = cache(async (key: string) => {
  const value = await redis.get(key);
  if (!value) throw new Error(`Config key "${key}" not found`);
  return value;
});

try {
  await getConfig('theme'); // ошибка: ключ не найден
} catch (e) {
  // обработка ошибки
}

await getConfig('theme'); // повторная попытка — кэш НЕ использовался
```

## Ограничения

Несколько важных ограничений, которые нужно учитывать:

**Только для серверных контекстов.** `cache()` проектировался для Server Components и серверных утилит. В Client Components функция технически вызовется, но кэш будет храниться в памяти клиента и не обеспечит дедупликации между компонентами — для этого используйте `useMemo`.

**Нет контроля над инвалидацией.** Сбросить кэш вручную нельзя — он живёт ровно до конца рендера. Для долгосрочного кэширования с инвалидацией используйте решения уровня фреймворка (например, `unstable_cache` или `revalidatePath` в Next.js).

**Размер кэша не ограничен явно.** При большом количестве уникальных аргументов каждый уникальный вызов добавляет запись в кэш. Избегайте паттернов, где аргументы всегда уникальны (например, передача `Date.now()`).

**Синхронные функции тоже поддерживаются.** `cache()` работает с любыми функциями, не только с `async`:

```typescript
import { cache } from 'react';

const parseMarkdown = cache((source: string) => {
  return heavyMarkdownParser(source); // синхронный, но дорогой вызов
});
```

## Практический пример: многоуровневый запрос данных

Покажем реалистичный сценарий — страница блога, где несколько компонентов независимо читают данные автора, категории и самой статьи:

```typescript
// lib/blog-data.ts
import { cache } from 'react';

export const getPost = cache(async (slug: string) => {
  return await db.posts.findUnique({ where: { slug } });
});

export const getAuthor = cache(async (authorId: string) => {
  return await db.authors.findUnique({ where: { id: authorId } });
});

export const getCategory = cache(async (categoryId: string) => {
  return await db.categories.findUnique({ where: { id: categoryId } });
});
```

```typescript
// components/PostContent.tsx
import { getPost } from '@/lib/blog-data';

export async function PostContent({ slug }: { slug: string }) {
  const post = await getPost(slug);
  return <article dangerouslySetInnerHTML={{ __html: post.html }} />;
}
```

```typescript
// components/PostSidebar.tsx
import { getPost, getAuthor, getCategory } from '@/lib/blog-data';

export async function PostSidebar({ slug }: { slug: string }) {
  const post = await getPost(slug); // кэш — запрос уже был в PostContent
  const [author, category] = await Promise.all([
    getAuthor(post.authorId),
    getCategory(post.categoryId),
  ]);

  return (
    <aside>
      <p>Автор: {author.name}</p>
      <p>Категория: {category.title}</p>
    </aside>
  );
}
```

В итоге за один рендер страницы к базе данных уйдёт три запроса (пост, автор, категория) вместо четырёх — вызов `getPost(slug)` во втором компоненте использует кэш.

## Итог

`cache()` — лаконичный, но мощный примитив React 19, который решает конкретную задачу: устраняет дублирующиеся вычисления в пределах одного серверного рендера. Он не заменяет `useMemo` для клиентских компонентов и не является заменой персистентного кэша — у каждого инструмента своя ниша. Используйте `cache()` всякий раз, когда несколько Server Components дерева нуждаются в одних данных, чтобы не перегружать базу данных или внешние API лишними запросами.

Хотите глубже разобраться в архитектуре React Server Components, потоковом рендеринге и оптимизации производительности в современных React-приложениях? Изучите курс на PurpleSchool:

[React — полный курс](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-cache-memo)