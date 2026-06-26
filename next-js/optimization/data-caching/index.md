---
metaTitle: "Кэширование данных в Next.js: fetch, unstable_cache, теги"
metaDescription: "Полное руководство по кэшированию в Next.js: fetch cache, unstable_cache, revalidateTag, revalidatePath и React cache() с примерами."
author: "Антон Ларичев"
title: "Кэширование данных в Next.js"
preview: "Разбираем все уровни кэша в Next.js App Router: от встроенного fetch до unstable_cache и on-demand revalidation с тегами."
---

## Что такое кэширование в Next.js

Кэширование — один из ключевых механизмов производительности в Next.js. Фреймворк предоставляет несколько уровней кэша, которые работают как на этапе сборки, так и во время выполнения запросов. Грамотное использование кэширования позволяет значительно снизить нагрузку на сервер и ускорить загрузку страниц.

В App Router (Next.js 13+) кэширование встроено в саму архитектуру и работает через расширенный `fetch`, утилиту `unstable_cache`, функцию `cache` из React и механизмы ревалидации.

## Уровни кэша в Next.js

Next.js использует четыре уровня кэша, которые работают последовательно:

**Request Memoization** — дедупликация в рамках одного рендера. Реализована через `cache()` из React. Живёт только во время обработки одного запроса.

**Data Cache** — персистентный кэш данных на сервере. Хранит результаты `fetch` и `unstable_cache`. Переживает перезапуски сервера. Инвалидируется через `revalidateTag` / `revalidatePath` или по таймеру.

**Full Route Cache** — кэш HTML и RSC Payload для статических маршрутов. Формируется при сборке (`next build`). При вызове `revalidatePath` или `revalidateTag` соответствующий маршрут перегенерируется.

**Router Cache** — клиентский кэш в памяти браузера. Хранит RSC Payload для навигации без полной перезагрузки. Очищается при вызове `router.refresh()`.

Понимание этих уровней помогает выбрать правильный инструмент для каждой задачи.

## Кэширование через fetch

Next.js расширяет стандартный Web API `fetch`, добавляя возможности кэширования. По умолчанию все запросы через `fetch` в серверных компонентах кэшируются автоматически.

### Режимы кэширования

```typescript
// Кэшировать и хранить до следующей сборки (поведение по умолчанию)
const data = await fetch('https://api.example.com/posts', {
  cache: 'force-cache',
});

// Не кэшировать — всегда получать свежие данные
const data = await fetch('https://api.example.com/posts', {
  cache: 'no-store',
});

// Ревалидировать каждые N секунд
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 },
});
```

`force-cache` — запрос выполнится один раз, результат сохранится в Data Cache. При повторных обращениях данные берутся из кэша без обращения к источнику.

`no-store` — кэш не используется. Каждый запрос обращается напрямую к API. Подходит для данных, которые меняются очень часто: курсы валют, состояние инвентаря в реальном времени.

`next: { revalidate }` — временная ревалидация. Данные кэшируются на указанное количество секунд. После истечения срока при следующем запросе кэш обновляется в фоне по принципу stale-while-revalidate.

### Пример: список статей с ревалидацией

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 300 }, // обновлять каждые 5 минут
  });

  if (!res.ok) {
    throw new Error('Ошибка загрузки статей');
  }

  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post: { id: number; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Кэширование с тегами

Теги позволяют группировать запросы и инвалидировать их точечно, не сбрасывая весь кэш целиком.

```typescript
// Сохранить в кэш с тегом 'posts'
const res = await fetch('https://api.example.com/posts', {
  next: {
    revalidate: 3600,
    tags: ['posts'],
  },
});

// Сохранить с несколькими тегами
const res = await fetch(`https://api.example.com/posts/${id}`, {
  next: {
    tags: ['posts', `post-${id}`],
  },
});
```

Позже, в Server Action или Route Handler, можно сбросить кэш для конкретного тега:

```typescript
import { revalidateTag } from 'next/cache';

// Сброс всех запросов с тегом 'posts'
revalidateTag('posts');

// Точечный сброс конкретной записи
revalidateTag(`post-${id}`);
```

## unstable_cache

Не все данные получают через `fetch`. Часто используются ORM, прямые запросы к базе данных или SDK сторонних сервисов. Для таких случаев Next.js предоставляет `unstable_cache`.

```typescript
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// Кэшировать результат запроса к базе данных
const getCachedPosts = unstable_cache(
  async () => {
    return db.post.findMany({ orderBy: { createdAt: 'desc' } });
  },
  ['posts-list'], // ключ кэша
  {
    revalidate: 60,
    tags: ['posts'],
  }
);

export default async function PostsPage() {
  const posts = await getCachedPosts();
  return <PostList posts={posts} />;
}
```

### Параметризованный кэш

Когда результат зависит от аргументов, Next.js автоматически включает их в ключ кэша — `getCachedPost('1')` и `getCachedPost('2')` хранятся отдельно:

```typescript
const getCachedPost = unstable_cache(
  async (id: string) => {
    return db.post.findUnique({ where: { id } });
  },
  ['post-by-id'],
  {
    revalidate: 300,
    tags: ['posts'],
  }
);

// Вызов с разными id создаёт отдельные записи в кэше
const post = await getCachedPost(params.id);
```

## React cache()

Функция `cache` из пакета `react` решает другую задачу — она дедуплицирует вызовы в рамках одного серверного рендера. Если несколько серверных компонентов на одной странице вызывают одну и ту же функцию с одинаковыми аргументами, запрос выполнится только один раз.

```typescript
// lib/data.ts
import { cache } from 'react';
import { db } from '@/lib/db';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

Теперь, как бы часто ни вызывался `getUser('123')` на одной странице, к базе данных обратятся лишь однократно:

```typescript
// app/profile/[id]/page.tsx
import { getUser } from '@/lib/data';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id); // первый вызов — запрос к БД
  return <Profile user={user} />;
}

// components/UserAvatar.tsx (используется на той же странице)
import { getUser } from '@/lib/data';

export default async function UserAvatar({ userId }: { userId: string }) {
  const user = await getUser(userId); // повторный вызов — результат из кэша React
  return <img src={user.avatarUrl} alt={user.name} />;
}
```

`cache()` работает только в рамках одного запроса. При следующем запросе кэш сбрасывается. Это принципиальное отличие от Data Cache, который персистентен между запросами.

## On-demand revalidation

Когда данные изменились (пользователь создал пост, администратор обновил товар), нужно немедленно сбросить кэш, не дожидаясь истечения таймера.

### revalidateTag в Server Action

```typescript
// app/actions/posts.ts
'use server';

import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.post.create({ data: { title, content } });

  // Инвалидировать кэш всех запросов с тегом 'posts'
  revalidateTag('posts');
}

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get('title') as string;

  await db.post.update({ where: { id }, data: { title } });

  // Точечная инвалидация — только этот пост и общий список
  revalidateTag(`post-${id}`);
  revalidateTag('posts');
}
```

### revalidatePath

Если нужно сбросить кэш для конкретного URL, используется `revalidatePath`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });

  revalidatePath('/posts');        // страница списка
  revalidatePath(`/posts/${id}`); // страница конкретного поста
}
```

`revalidatePath` удобен, когда логика кэширования не использует теги. Но `revalidateTag` предпочтительнее — он точнее и не привязан к структуре URL.

## Webhook-инвалидация через Route Handler

Внешние системы (headless CMS, платёжные сервисы) могут инициировать обновление кэша через HTTP-запрос:

```typescript
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.REVALIDATION_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tag } = await request.json();

  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, tag });
}
```

CMS отправляет POST-запрос на `/api/revalidate` с нужным тегом при публикации нового контента — страницы обновляются мгновенно без пересборки проекта.

## Комбинирование cache() и unstable_cache

Для максимальной эффективности используйте оба инструмента вместе: `unstable_cache` хранит данные между запросами, `cache()` устраняет дубли внутри одного рендера:

```typescript
// lib/data.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getCachedProduct = unstable_cache(
  async (id: string) => {
    return db.product.findUnique({ where: { id } });
  },
  ['product'],
  { revalidate: 600, tags: ['products'] }
);

// Оборачиваем в cache() для дедупликации в рамках одного рендера
export const getProduct = cache(getCachedProduct);
```

## Практические рекомендации

### Выбор стратегии по типу данных

| Тип данных | Стратегия |
|---|---|
| Статический контент (документация, FAQ) | `force-cache` или без опций |
| Часто обновляемые данные (новости, товары) | `next: { revalidate: 60–300 }` + теги |
| Данные в реальном времени (чат, биржа) | `cache: 'no-store'` |
| Данные пользователя (профиль, корзина) | `cache: 'no-store'` |

### Не кэшируйте пользовательские данные глобально

Любое обращение к `cookies()` или `headers()` автоматически переводит маршрут в динамический режим — Data Cache для него не применяется:

```typescript
import { cookies } from 'next/headers';

export default async function UserPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  // Этот fetch НЕ будет кэшироваться в Data Cache,
  // потому что маршрут динамический из-за вызова cookies()
  const res = await fetch('https://api.example.com/me', {
    headers: { Authorization: `Bearer ${token?.value}` },
  });

  const user = await res.json();
  return <Profile user={user} />;
}
```

### Отладка кэширования

В режиме разработки (`next dev`) Data Cache отключён — все запросы выполняются каждый раз. Для диагностики поведения кэша в продакшене включите расширенные логи:

```bash
NEXT_PRIVATE_DEBUG_CACHE=1 next start
```

Sервер будет выводить `HIT` и `MISS` для каждого обращения к Data Cache. Принудительно очистить весь кэш можно, удалив папку `.next/cache/fetch-cache`.

## Итог

Кэширование в Next.js — это многоуровневая система, где каждый уровень решает свою задачу. `fetch` с опцией `next.revalidate` и тегами покрывает большинство сценариев при работе с HTTP API. `unstable_cache` нужен для работы с ORM и сторонними SDK. `cache()` из React устраняет дублирующиеся запросы внутри одного рендера. `revalidateTag` и `revalidatePath` дают точечный контроль над инвалидацией без пересборки проекта.

Правильно выстроенная стратегия кэширования позволяет обслуживать тысячи пользователей с минимальной нагрузкой на базу данных, сохраняя при этом актуальность данных.

---

Если вы хотите глубже разобраться в Next.js и научиться строить production-ready приложения, приходите на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-caching).