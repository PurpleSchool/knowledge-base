---
metaTitle: "loading.js и error.js в Next.js App Router"
metaDescription: "Как использовать loading.js и error.js в Next.js App Router для обработки состояний загрузки и ошибок через Suspense и Error Boundaries."
author: "Антон Ларичев"
title: "loading.js и error.js в Next.js App Router"
preview: "Разбираем специальные файлы loading.js и error.js в App Router: как они работают, чем отличаются и как строить надёжный UX с их помощью."
---

Next.js App Router вводит систему специальных файлов, каждый из которых отвечает за конкретный слой UI. Два из них — `loading.js` и `error.js` — решают задачи, с которыми сталкивается любое приложение: что показать пользователю, пока данные грузятся, и что сделать, если что-то пошло не так.

Понять, как они устроены, важно не только для правильного использования, но и для отладки нестандартного поведения. Под капотом оба файла опираются на механизмы React — `Suspense` и `Error Boundary` — но Next.js автоматически оборачивает в них ваши страницы.

## Как устроен App Router: дерево сегментов

Прежде чем разбирать отдельные файлы, нужно понять общую модель. В App Router каждый сегмент маршрута — это папка с набором зарезервированных файлов:

```
app/
  layout.js       — обёртка сегмента
  page.js         — содержимое страницы
  loading.js      — заглушка на время загрузки
  error.js        — UI для ошибок
  not-found.js    — UI для 404
  template.js     — layout без сохранения состояния
```

Next.js строит из них иерархическое дерево компонентов. `layout.js` оборачивает `page.js`, а `loading.js` и `error.js` вставляются автоматически как обёртки `Suspense` и `ErrorBoundary` вокруг содержимого сегмента.

Пример структуры для раздела `/dashboard`:

```
app/
  dashboard/
    layout.js
    page.js
    loading.js
    error.js
    settings/
      page.js
      loading.js
```

## loading.js: состояние загрузки через Suspense

### Как это работает

Когда Next.js видит `loading.js` рядом с `page.js`, он автоматически оборачивает содержимое страницы в React `Suspense`:

```jsx
// То, что делает Next.js за вас:
<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

Это означает: пока `page.js` выполняет асинхронные операции (запросы к базе данных, внешним API), React рендерит `loading.js` как заглушку. Как только данные готовы — заглушка заменяется реальным контентом.

Важный момент: `loading.js` работает именно с серверными компонентами и `async/await` в них. Если ваш `page.js` синхронный или данные получаются уже на клиенте — `loading.js` не покажется.

### Создание loading.js

Файл должен экспортировать React-компонент по умолчанию:

```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="loading-container">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  );
}
```

Этот компонент — обычный клиентский React-компонент. В нём можно использовать любую CSS-анимацию, библиотеку скелетонов или спиннер.

### Пример с серверным компонентом

```tsx
// app/dashboard/page.tsx
async function getDashboardData() {
  const res = await fetch('https://api.example.com/dashboard', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Ошибка загрузки данных');
  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </main>
  );
}
```

Пока `getDashboardData` выполняется, пользователь видит компонент из `loading.js`. Это работает автоматически — никакого `useState` или `useEffect` не нужно.

### Потоковая передача (Streaming)

`loading.js` включает потоковую передачу HTML. Сервер не ждёт полной готовности страницы перед отправкой — он сначала отдаёт разметку с заглушкой, а затем «вливает» готовый контент по мере его появления.

Это радикально улучшает Time to First Byte (TTFB): браузер получает HTML сразу, показывает пользователю что-то осмысленное и постепенно заполняет контент.

### Гранулярные состояния загрузки

Не обязательно ждать загрузки всей страницы. Можно использовать `Suspense` вручную для отдельных компонентов:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { UserStats } from './components/UserStats';
import { RecentActivity } from './components/RecentActivity';
import { StatsSkeleton } from './components/StatsSkeleton';
import { ActivitySkeleton } from './components/ActivitySkeleton';

export default function DashboardPage() {
  return (
    <main>
      <h1>Дашборд</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </main>
  );
}
```

Теперь `UserStats` и `RecentActivity` загружаются параллельно и независимо. Каждый показывает свою заглушку — это лучше, чем блокировать всю страницу из-за одного медленного запроса.

### Вложенные loading.js

Каждый вложенный сегмент может иметь собственный `loading.js`. Next.js строит иерархию заглушек:

```
app/
  loading.js          — заглушка для всего приложения
  dashboard/
    loading.js        — заглушка только для /dashboard
    settings/
      loading.js      — заглушка только для /dashboard/settings
```

При переходе на `/dashboard/settings` будет показан `loading.js` из папки `settings`, а не из `dashboard`. Если `settings/loading.js` не существует, Next.js поднимется вверх по дереву и возьмёт ближайший родительский.

## error.js: обработка ошибок через Error Boundary

### Как это работает

`error.js` создаёт React Error Boundary вокруг содержимого сегмента. Это классический паттерн React для перехвата ошибок в дереве компонентов — Next.js просто автоматизирует его настройку:

```jsx
// То, что делает Next.js за вас:
<ErrorBoundary fallback={<Error />}>
  <Page />
</ErrorBoundary>
```

Если внутри `page.js` или любого дочернего компонента выбрасывается ошибка, Error Boundary её перехватывает и показывает `error.js` вместо упавшего контента.

### Обязательное требование: 'use client'

`error.js` **обязан** быть клиентским компонентом. Это требование React — Error Boundary должен использовать методы жизненного цикла, доступные только в классовых или клиентских компонентах.

```tsx
// app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Логирование ошибки в сервис мониторинга
    console.error(error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}
```

### Пропсы error и reset

Next.js передаёт в `error.js` два пропса:

**`error`** — объект ошибки с полями:
- `message` — сообщение об ошибке
- `digest` — автоматически сгенерированный хеш для сопоставления с серверными логами (в production ошибки с сервера не передаются в браузер напрямую из соображений безопасности)

**`reset`** — функция для повторной попытки рендера. При вызове Next.js пытается снова отрендерить содержимое сегмента. Это позволяет создать кнопку «Попробовать снова» без перезагрузки всей страницы.

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Ошибка загрузки данных</h2>
      {process.env.NODE_ENV === 'development' && (
        <pre>{error.message}</pre>
      )}
      <button onClick={() => reset()}>Повторить</button>
    </div>
  );
}
```

### Пример: ошибка в серверном компоненте

```tsx
// app/products/[id]/page.tsx
async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`);
  if (!res.ok) {
    // Эта ошибка будет перехвачена error.js
    throw new Error(`Продукт ${id} не найден`);
  }
  return res.json();
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

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
    <div className="error-page">
      <h2>Не удалось загрузить продукт</h2>
      <button onClick={reset}>Попробовать снова</button>
      <a href="/products">Вернуться к каталогу</a>
    </div>
  );
}
```

### Область действия error.js

Ключевое свойство Error Boundary — он перехватывает ошибки только в **дочерних** компонентах, но не в самом себе и не в родителях. Это имеет практическое следствие для `error.js`:

`error.js` перехватывает ошибки `page.js` в том же сегменте, но **не перехватывает** ошибки `layout.js` того же сегмента. Это логично — `layout.js` является родителем, а не дочерним элементом.

```
app/
  dashboard/
    layout.js    — ошибки здесь НЕ перехватываются error.js из этой же папки
    page.js      — ошибки здесь перехватываются error.js
    error.js     — перехватывает ошибки page.js
```

Чтобы перехватить ошибки `layout.js`, нужен `error.js` в **родительском** сегменте:

```
app/
  error.js        — перехватит ошибки app/dashboard/layout.js
  dashboard/
    layout.js
    page.js
    error.js      — перехватит ошибки app/dashboard/page.js
```

## global-error.js: защита корневого layout

Особый случай — ошибки в корневом `app/layout.js`. Обычный `error.js` их не перехватит. Для этого существует `global-error.js`:

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Критическая ошибка приложения</h2>
        <button onClick={reset}>Перезагрузить</button>
      </body>
    </html>
  );
}
```

`global-error.js` заменяет весь корневой layout, поэтому он обязан включать теги `<html>` и `<body>`. Используйте его как последнюю линию защиты — для действительно критических ошибок.

## Совместное использование: полный пример

Рассмотрим структуру раздела с постами блога:

```
app/
  blog/
    page.tsx         — список постов
    loading.tsx      — скелетон списка
    error.tsx        — ошибка загрузки списка
    [slug]/
      page.tsx       — отдельный пост
      loading.tsx    — скелетон поста
      error.tsx      — ошибка загрузки поста
```

```tsx
// app/blog/loading.tsx
export default function BlogLoading() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="post-skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-excerpt" />
        </div>
      ))}
    </div>
  );
}
```

```tsx
// app/blog/error.tsx
'use client';

export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <div>
      <h2>Не удалось загрузить статьи</h2>
      <p>Попробуйте обновить страницу или вернитесь позже.</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}
```

```tsx
// app/blog/[slug]/page.tsx
async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Статья не найдена');
  return res.json();
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

```tsx
// app/blog/[slug]/loading.tsx
export default function PostLoading() {
  return (
    <article>
      <div className="skeleton skeleton-h1" />
      <div className="skeleton skeleton-body" />
    </article>
  );
}
```

```tsx
// app/blog/[slug]/error.tsx
'use client';

export default function PostError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Статья недоступна</h2>
      <button onClick={reset}>Попробовать снова</button>
      <a href="/blog">Вернуться к списку</a>
    </div>
  );
}
```

## Частые вопросы и ловушки

**Почему loading.js не показывается при навигации?**

При переходах между страницами Next.js сначала выполняет запросы, а только потом меняет URL. Это называется синхронной навигацией с prefetch. Если страница загружается быстро или закеширована — `loading.js` вы просто не успеете заметить.

Чтобы гарантированно видеть `loading.js`, добавьте задержку в серверный компонент во время разработки:

```tsx
async function SlowPage() {
  await new Promise(r => setTimeout(r, 2000)); // только для тестирования
  return <div>Контент</div>;
}
```

**Почему error.js не ловит ошибку?**

Проверьте два момента:
1. Ошибка должна выбрасываться через `throw`, а не обрабатываться внутри компонента через try/catch
2. `error.js` не перехватывает ошибки `layout.js` того же уровня — нужен `error.js` выше по дереву

**Как логировать ошибки на сервере?**

Пропс `error.digest` — это хеш, который Next.js печатает в серверные логи при ошибке. Сопоставив его с вашим сервисом мониторинга (Sentry, Datadog), можно получить полный стек ошибки:

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <div>Ошибка: {error.digest}</div>;
}
```

## Итог

`loading.js` и `error.js` — это декларативный способ управлять состояниями загрузки и ошибок без ручного добавления `Suspense` и `ErrorBoundary` в каждую страницу. Они следуют структуре папок, работают на уровне сегментов и позволяют строить гранулярный, устойчивый к ошибкам UI.

Практическая рекомендация: добавляйте `loading.js` к любой странице, которая делает серверные запросы, и `error.js` — к страницам, где данные критически важны для пользователя. Для критических ошибок корневого layout держите `global-error.js` как последнюю защиту.

Чтобы глубже разобраться с App Router, серверными компонентами и всеми возможностями Next.js — приходите на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=loading-and-error-files).