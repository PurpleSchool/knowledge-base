---
metaTitle: useRouter в Next.js — программная навигация и работа с роутером
metaDescription: Разбираем хук useRouter в Next.js — программные переходы через push/replace, чтение параметров маршрута, различия между App Router и Pages Router, usePathname и useSearchParams.
author: Антон Ларичев
title: useRouter в Next.js — программная навигация
preview: Полный разбор хука useRouter в Next.js — как выполнять программные переходы, читать текущий путь и параметры, и чем отличается useRouter в App Router от Pages Router.
---

## Введение

Компонент `<Link>` отлично подходит для навигационных ссылок в JSX. Но иногда нужно выполнить переход программно — после успешной отправки формы, при истечении сессии, после асинхронного действия. Для этого используется хук `useRouter`.

В Next.js 13 с появлением App Router хук `useRouter` претерпел изменения — теперь существуют два разных хука в зависимости от роутера.

## useRouter в App Router

В App Router `useRouter` импортируется из `next/navigation`:

```typescript
'use client'; // useRouter работает только в Client Components

import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(/* ... */);

    if (success) {
      router.push('/dashboard'); // переход на дашборд
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* поля формы */}
      <button type="submit">Войти</button>
    </form>
  );
}
```

### Методы useRouter (App Router)

```typescript
const router = useRouter();

router.push('/path');           // перейти вперёд (добавить в историю)
router.replace('/path');        // заменить текущую запись в истории
router.back();                  // вернуться назад
router.forward();               // перейти вперёд по истории
router.refresh();               // обновить текущую страницу (перезапросить данные)
router.prefetch('/path');       // предзагрузить страницу вручную
```

**Важно**: в App Router `useRouter` из `next/navigation` больше не содержит `pathname`, `query`, `asPath` — для этого есть отдельные хуки.

## usePathname — текущий путь

В App Router текущий путь читается через отдельный хук `usePathname`:

```typescript
'use client';

import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();
  // например: "/blog/my-post"

  const segments = pathname.split('/').filter(Boolean);
  // ["blog", "my-post"]

  return (
    <nav aria-label="Хлебные крошки">
      {segments.map((segment, index) => (
        <span key={index}>{segment}</span>
      ))}
    </nav>
  );
}
```

## useSearchParams — параметры запроса

Параметры URL-строки (`?page=2&sort=date`) читаются через `useSearchParams`:

```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export default function ProductList() {
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';       // "2"
  const sort = searchParams.get('sort') ?? 'default'; // "date"
  const category = searchParams.get('category');       // null если нет

  return (
    <div>
      <p>Страница: {page}</p>
      <p>Сортировка: {sort}</p>
    </div>
  );
}
```

## useParams — динамические сегменты маршрута

Параметры из динамических сегментов (`[slug]`, `[id]`) читаются через `useParams`:

```typescript
'use client';

import { useParams } from 'next/navigation';

export default function ArticleActions() {
  // URL: /blog/my-article
  const params = useParams<{ slug: string }>();
  const slug = params.slug; // "my-article"

  async function handleDelete() {
    await deleteArticle(slug);
    // после удаления вернуться назад
  }

  return <button onClick={handleDelete}>Удалить</button>;
}
```

## Обновление URL без перехода — useRouter + searchParams

Частый паттерн — обновление параметров фильтра или сортировки в URL без перезагрузки страницы:

```typescript
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export default function SortSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  function handleSortChange(value: string) {
    // Обновляем URL: /courses?sort=price
    router.push(pathname + '?' + createQueryString('sort', value));
  }

  return (
    <select onChange={e => handleSortChange(e.target.value)}>
      <option value="popular">По популярности</option>
      <option value="price">По цене</option>
      <option value="new">Новые</option>
    </select>
  );
}
```

## useRouter в Pages Router

В Pages Router `useRouter` импортируется из `next/router` и содержит больше информации:

```typescript
import { useRouter } from 'next/router'; // Pages Router!

export default function ProfilePage() {
  const router = useRouter();

  // Текущий путь
  const { pathname } = router; // "/profile/[id]"
  const { asPath } = router;   // "/profile/123"

  // Параметры маршрута
  const { query } = router;
  const id = query.id as string; // "123"

  function goToDashboard() {
    router.push('/dashboard');
  }

  function goBack() {
    router.back();
  }

  // Ожидание завершения навигации
  function handleSubmit() {
    router.push('/success').then(() => {
      console.log('Переход выполнен');
    });
  }

  return <div>Профиль #{id}</div>;
}
```

### Основные свойства useRouter (Pages Router)

| Свойство | Описание | Пример |
|---|---|---|
| `pathname` | Путь с плейсхолдерами | `/blog/[slug]` |
| `asPath` | Реальный путь в URL | `/blog/my-post` |
| `query` | Параметры маршрута и строки | `{ slug: 'my-post', page: '1' }` |
| `locale` | Текущая локаль (если i18n) | `'ru'` |
| `isReady` | Готовность роутера | `true` |

## Сравнение App Router и Pages Router

| Задача | App Router | Pages Router |
|---|---|---|
| Программный переход | `useRouter` из `next/navigation` | `useRouter` из `next/router` |
| Текущий путь | `usePathname()` | `router.pathname` |
| Параметры URL | `useSearchParams()` | `router.query` |
| Параметры маршрута | `useParams()` | `router.query` |
| Проверка готовности | не нужна | `router.isReady` |

## События роутера (Pages Router)

В Pages Router можно подписаться на события навигации:

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProgressBar() {
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => showProgress();
    const handleComplete = () => hideProgress();

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return null;
}
```

В App Router аналогичный эффект достигается через хук `usePathname` в `useEffect`.

## Итог

- **App Router**: `useRouter` из `next/navigation` — только для навигации (`push`, `replace`, `back`, `refresh`). Путь — `usePathname()`, параметры — `useSearchParams()` и `useParams()`
- **Pages Router**: `useRouter` из `next/router` — содержит всё: путь, параметры, методы навигации и события
- `useRouter` работает **только в Client Components** (директива `'use client'`)
- Для декларативных переходов используйте `<Link>` из `next/link` — он эффективнее и доступнее

Подробнее про Next.js — на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-userouter).
