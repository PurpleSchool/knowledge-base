---
metaTitle: next/link — навигация в Next.js без перезагрузки страницы
metaDescription: Разбираем компонент Link из next/link в Next.js — клиентская навигация, prefetching, параметры href, replace, scroll, prefetch и работа с динамическими маршрутами.
author: Антон Ларичев
title: next/link — навигация в Next.js
preview: Подробный разбор компонента Link из next/link — как работает клиентская навигация в Next.js, prefetching страниц, параметры компонента и примеры работы с динамическими маршрутами.
---

## Введение

Обычный HTML-тег `<a>` вызывает полную перезагрузку страницы при переходе. В Next.js для навигации используется компонент `<Link>` из `next/link` — он выполняет переходы на стороне клиента без перезагрузки, сохраняет состояние приложения и автоматически предзагружает страницы для мгновенной навигации.

## Базовое использование

```typescript
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Главная</Link>
      <Link href="/about">О нас</Link>
      <Link href="/blog">Блог</Link>
    </nav>
  );
}
```

`<Link>` рендерится как обычный тег `<a>` в HTML — это важно для SEO и доступности. Передавать дочерний `<a>` вручную больше не нужно (это требование убрали в Next.js 13).

## Динамические маршруты

Для динамических маршрутов подставляйте значения в href:

```typescript
import Link from 'next/link';

interface Post {
  id: number;
  slug: string;
  title: string;
}

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

Также можно передать объект с `pathname` и `query`:

```typescript
<Link
  href={{
    pathname: '/blog/[slug]',
    query: { slug: post.slug },
  }}
>
  {post.title}
</Link>
```

## Параметр replace

По умолчанию `<Link>` добавляет новую запись в историю браузера. Параметр `replace` заменяет текущую запись вместо добавления — кнопка «Назад» не вернёт на предыдущую страницу:

```typescript
<Link href="/login" replace>
  Войти
</Link>
```

Удобно для редиректов после действий: например, после оформления заказа не нужно возвращаться обратно в корзину.

## Параметр scroll

По умолчанию при навигации Next.js прокручивает страницу наверх. Чтобы отключить это поведение:

```typescript
<Link href="/blog#comments" scroll={false}>
  Перейти к комментариям
</Link>
```

Полезно при навигации по якорям (`#section`) на той же странице.

## Параметр prefetch

Next.js автоматически предзагружает страницы, ссылки на которые видны в вьюпорте. При наведении или когда ссылка появляется на экране — код следующей страницы загружается в фоне. Это делает навигацию практически мгновенной.

Отключить prefetch можно через `prefetch={false}`:

```typescript
// Не предзагружать — для редко используемых страниц
<Link href="/admin/settings" prefetch={false}>
  Настройки
</Link>
```

В production prefetch работает по умолчанию. В development режиме предзагрузка не происходит.

## Активные ссылки — подсветка текущего маршрута

`<Link>` сам по себе не добавляет активный класс. Для определения активного маршрута используйте хук `usePathname`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Главная' },
  { href: '/courses', label: 'Курсы' },
  { href: '/blog', label: 'Блог' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'active' : ''}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

## Программная навигация без Link

Иногда нужно перейти на страницу программно — после отправки формы, по таймеру, или в обработчике события. Для этого используется хук `useRouter`:

```typescript
'use client';

import { useRouter } from 'next/navigation'; // App Router

export default function LoginForm() {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(/* ... */);
    router.push('/dashboard'); // программный переход
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Внешние ссылки

Для внешних ссылок используйте обычный `<a>` — `<Link>` предназначен для внутренней навигации:

```typescript
// Внешняя ссылка — обычный <a>
<a href="https://github.com/purpleschool" target="_blank" rel="noopener noreferrer">
  GitHub
</a>

// Внутренняя ссылка — <Link>
<Link href="/about">О нас</Link>
```

## Стилизация через className

`<Link>` принимает все стандартные HTML-атрибуты, включая `className` и `style`:

```typescript
<Link
  href="/courses"
  className="btn btn-primary"
  aria-label="Перейти к каталогу курсов"
>
  Смотреть курсы
</Link>
```

## Отличие от Pages Router

В Pages Router до версии 13 нужно было явно указывать дочерний тег `<a>`:

```typescript
// Старый способ (Pages Router, Next.js < 13)
import Link from 'next/link';

<Link href="/about">
  <a>О нас</a>
</Link>

// Новый способ (Next.js 13+, оба роутера)
<Link href="/about">О нас</Link>
```

С Next.js 13 вложенный `<a>` больше не нужен — `<Link>` сам рендерится как `<a>`.

## Итог

`<Link>` — основной инструмент навигации в Next.js:

- **Клиентская навигация** — переходы без перезагрузки страницы
- **Prefetching** — автоматическая предзагрузка видимых ссылок
- **SEO** — рендерится как обычный `<a>` тег
- **replace** — замена записи в истории вместо добавления
- **scroll** — управление прокруткой при переходе

Для углублённого изучения — курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-link).
