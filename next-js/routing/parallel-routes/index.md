---
metaTitle: "Parallel Routes в Next.js — параллельные маршруты"
metaDescription: "Параллельные маршруты в Next.js App Router: слоты с @-префиксом, default.tsx, независимая загрузка и комбинация с intercepting routes."
author: "Антон Ларичев"
title: "Параллельные маршруты в Next.js"
preview: "Как использовать параллельные маршруты в Next.js App Router для дашбордов, модальных окон и сложных интерфейсов со слотами."
---

## Что такое параллельные маршруты

Параллельные маршруты (Parallel Routes) — возможность Next.js App Router, которая позволяет одновременно рендерить несколько независимых страниц в одном макете. Вместо одного компонента страницы макет получает несколько **слотов**, каждый из которых соответствует отдельному URL-маршруту и управляется независимо.

Это принципиально отличается от простого разбиения UI на компоненты: каждый слот может иметь собственные состояния загрузки и ошибок, загружать данные асинхронно и обновляться при навигации независимо от остальных.

Типичные сценарии применения:

- Дашборды с виджетами, которые загружают данные параллельно
- Модальные окна с сохранением URL (в паре с intercepting routes)
- Разделённые представления: список слева, детали справа
- Условный рендеринг разных интерфейсов в зависимости от роли пользователя

## Определение слотов

Слоты — это директории с префиксом `@` (at-символ). Next.js автоматически превращает их в именованные пропы родительского `layout.tsx`.

Структура файлов для дашборда:

```
app/
  dashboard/
    layout.tsx
    page.tsx
    @revenue/
      page.tsx
    @visitors/
      page.tsx
```

Макет получает слоты как пропы:

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  revenue,
  visitors,
}: {
  children: React.ReactNode;
  revenue: React.ReactNode;
  visitors: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <main>{children}</main>
      <aside>
        {revenue}
        {visitors}
      </aside>
    </div>
  );
}
```

Имена слотов чувствительны к регистру и должны точно совпадать с именами пропов в layout. Директория `@revenue` → проп `revenue`.

Важно: слоты **не влияют на URL**. При переходе на `/dashboard` рендерятся все три слота: `children` из `app/dashboard/page.tsx`, `revenue` из `app/dashboard/@revenue/page.tsx` и `visitors` из `app/dashboard/@visitors/page.tsx`.

## Независимая загрузка данных

Каждый слот — это отдельный Server Component, который загружает данные самостоятельно. Next.js запускает все запросы параллельно.

```typescript
// app/dashboard/@revenue/page.tsx
async function getRevenue() {
  const res = await fetch('https://api.example.com/revenue', {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function RevenuePage() {
  const data = await getRevenue();

  return (
    <div className="widget">
      <h2>Выручка</h2>
      <p className="amount">{data.total.toLocaleString('ru')} ₽</p>
      <p className="period">за текущий месяц</p>
    </div>
  );
}
```

```typescript
// app/dashboard/@visitors/page.tsx
async function getVisitors() {
  const res = await fetch('https://api.example.com/visitors', {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function VisitorsPage() {
  const data = await getVisitors();

  return (
    <div className="widget">
      <h2>Посетители</h2>
      <p className="amount">{data.count.toLocaleString('ru')}</p>
      <p className="period">уникальных за сутки</p>
    </div>
  );
}
```

Если виджет `revenue` отвечает медленно, пользователь уже видит виджет `visitors` — страница не ждёт самого медленного запроса.

## Состояния загрузки и ошибок

Каждый слот поддерживает файлы `loading.tsx` и `error.tsx`. Это позволяет управлять состояниями гранулярно.

```typescript
// app/dashboard/@revenue/loading.tsx
export default function RevenueLoading() {
  return (
    <div className="widget widget-skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-amount" />
      <div className="skeleton-period" />
    </div>
  );
}
```

```typescript
// app/dashboard/@revenue/error.tsx
'use client';

export default function RevenueError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="widget widget-error">
      <p>Не удалось загрузить данные о выручке</p>
      <button onClick={reset}>Повторить</button>
    </div>
  );
}
```

Если один виджет падает с ошибкой, остальные продолжают работать — `error.tsx` изолирует сбой внутри слота.

## Файл default.tsx

При переходе на маршрут Next.js пытается найти страницу для каждого слота. Если у слота нет страницы, соответствующей текущему URL, Next.js ищет `default.tsx`.

Без `default.tsx` слот вернёт 404 при переходе на маршрут, для которого у него нет страницы.

```
app/
  @modal/
    default.tsx        ← отображается когда модал не активен
    (.)photos/
      [id]/
        page.tsx       ← перехватывает /photos/[id]
  photos/
    [id]/
      page.tsx
  layout.tsx
  page.tsx
```

```typescript
// app/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

Пустой `default.tsx` — стандартная практика для слотов, которые должны быть пустыми в обычном состоянии.

## Навигация и состояние слотов

### Мягкая навигация

При клиентской навигации через `<Link>` или `router.push` Next.js выполняет **частичный рендеринг**: обновляется только слот, маршрут которого изменился. Остальные слоты сохраняют текущее состояние.

```typescript
// app/dashboard/page.tsx
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <h1>Дашборд</h1>
      <nav>
        <Link href="/dashboard?period=week">Неделя</Link>
        <Link href="/dashboard?period=month">Месяц</Link>
        <Link href="/dashboard?period=year">Год</Link>
      </nav>
    </div>
  );
}
```

### Жёсткая навигация

При полной перезагрузке страницы (F5, прямой ввод URL) Next.js не может восстановить состояние слотов по URL. В этом случае используется `default.tsx`. Именно поэтому модальные окна на основе параллельных маршрутов при обновлении страницы показывают контент `default.tsx` (обычно `null`) и одновременно рендерят полную страницу через основной маршрут.

## Условный рендеринг слотов

Параллельные маршруты позволяют показывать разный UI в зависимости от условий — например, роли пользователя.

```typescript
// app/dashboard/layout.tsx
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
  adminControls,
  userControls,
}: {
  children: React.ReactNode;
  adminControls: React.ReactNode;
  userControls: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="dashboard">
      <main>{children}</main>
      <aside>
        {session.role === 'admin' ? adminControls : userControls}
      </aside>
    </div>
  );
}
```

Администратор и обычный пользователь видят разные компоненты в одном макете без дополнительной логики в самих страницах.

## Комбинация с перехватывающими маршрутами

Самый мощный паттерн параллельных маршрутов — совместное использование с intercepting routes. Это позволяет реализовать модальные окна, которые:

- открываются поверх текущей страницы при клиентской навигации
- отображаются как отдельные полноценные страницы при прямом переходе по URL или обновлении

Классический пример — галерея изображений.

Структура файлов:

```
app/
  @modal/
    default.tsx
    (.)photos/
      [id]/
        page.tsx
  photos/
    page.tsx
    [id]/
      page.tsx
  layout.tsx
  page.tsx
```

Синтаксис `(.)` означает перехват маршрута на том же уровне. `(..)` — на уровень выше, `(...)` — от корня.

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {modal}
        {children}
      </body>
    </html>
  );
}
```

```typescript
// app/@modal/(.)photos/[id]/page.tsx
import { getPhoto } from '@/lib/photos';
import Modal from '@/components/Modal';

export default async function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
      <h2>{photo.title}</h2>
      <p>{photo.description}</p>
    </Modal>
  );
}
```

```typescript
// app/photos/[id]/page.tsx — полная страница при прямом переходе
import { getPhoto } from '@/lib/photos';

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <div className="photo-page">
      <img src={photo.url} alt={photo.title} />
      <h1>{photo.title}</h1>
      <p>{photo.description}</p>
    </div>
  );
}
```

```typescript
// components/Modal.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function handleBackdropClick() {
    router.back();
  }

  function handleContentClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <button className="modal-close" onClick={() => router.back()}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
```

При клике по фото в галерее Next.js перехватывает навигацию на `/photos/123`, рендерит слот `@modal` с модалом и обновляет URL. При обновлении страницы перехват не срабатывает — рендерится стандартная страница `app/photos/[id]/page.tsx`.

## Вложенные слоты

Слоты могут содержать собственные вложенные маршруты и макеты.

```
app/
  @sidebar/
    layout.tsx
    default.tsx
    settings/
      page.tsx
    profile/
      page.tsx
```

```typescript
// app/@sidebar/layout.tsx
import Link from 'next/link';

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <aside className="sidebar">
      <nav>
        <Link href="/settings">Настройки</Link>
        <Link href="/profile">Профиль</Link>
      </nav>
      <div className="sidebar-content">{children}</div>
    </aside>
  );
}
```

## Типичные ошибки

### Забытый default.tsx

Наиболее частая проблема. Если слот не имеет `default.tsx`, переход на страницу, для которой у слота нет соответствующего `page.tsx`, завершится ошибкой 404. Добавляйте `default.tsx` ко всем слотам.

### Несовпадение имён пропов

Имя директории (без `@`) должно точно совпадать с именем пропа в layout.

```typescript
// Ошибка: директория @analytics, а проп называется analyticsWidget
export default function Layout({
  analyticsWidget,
}: {
  analyticsWidget: React.ReactNode;
}) { ... }

// Правильно
export default function Layout({
  analytics,
}: {
  analytics: React.ReactNode;
}) { ... }
```

### Избыточное использование слотов

Параллельные маршруты оправданы, когда слот имеет собственный URL-маршрут, независимую загрузку данных или отдельный `error.tsx`. Если вы просто делите UI на части — используйте обычные компоненты. Лишние слоты усложняют структуру файлов без реального преимущества.

## Итог

Параллельные маршруты в Next.js App Router решают задачи, которые сложно реализовать через обычную вложенность маршрутов: независимая загрузка данных в разных частях страницы, изолированная обработка ошибок, модальные окна с сохранением URL. Ключевые концепции — слоты с `@`-префиксом, `default.tsx` для состояния по умолчанию и комбинация с intercepting routes для продвинутых паттернов навигации.

Подробнее про App Router и продвинутые паттерны Next.js — на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=parallel-routes).