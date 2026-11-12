---
metaTitle: "Vercel Analytics в Next.js — подключение и настройка"
metaDescription: "Как подключить Vercel Analytics к проекту на Next.js: установка, отслеживание событий, Web Vitals и анализ поведения пользователей."
author: "Антон Ларичев"
title: "Next.js с Vercel Analytics"
preview: "Подключаем Vercel Analytics к Next.js-приложению: Web Vitals, пользовательские события, конфигурация и работа с данными."
---

## Что такое Vercel Analytics

Vercel Analytics — встроенный инструмент аналитики от Vercel, который позволяет отслеживать посещаемость сайта, показатели Core Web Vitals и пользовательские события. В отличие от Google Analytics, он не использует cookie-файлы и не передаёт персональные данные, что упрощает соблюдение требований GDPR и CCPA.

Пакет состоит из двух частей:

- **`@vercel/analytics`** — основной пакет для отслеживания посещений и событий
- **`@vercel/speed-insights`** — отдельный пакет для мониторинга Web Vitals (CLS, LCP, FID, TTFB, INP)

## Установка пакетов

Установите зависимости через npm или pnpm:

```bash
npm install @vercel/analytics @vercel/speed-insights
```

Или через pnpm:

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

## Подключение в App Router

В Next.js с App Router компоненты аналитики подключаются в корневом layout-файле `app/layout.tsx`. Оба компонента (`Analytics` и `SpeedInsights`) должны рендериться на каждой странице, поэтому размещать их нужно именно в корневом layout.

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Компонент `Analytics` автоматически отслеживает переходы между страницами в Next.js, включая навигацию через `Link` и программные переходы через `router.push`.

## Подключение в Pages Router

Если проект использует Pages Router, компоненты подключаются в `pages/_app.tsx`:

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

## Отслеживание пользовательских событий

Помимо автоматического трекинга страниц, Vercel Analytics позволяет отправлять произвольные события с помощью функции `track`.

### Базовое использование

```typescript
// components/SignupForm.tsx
'use client';

import { track } from '@vercel/analytics';

export function SignupForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Выполняем логику регистрации...
    await registerUser();
    
    // Отправляем событие в Vercel Analytics
    track('signup_completed');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* поля формы */}
    </form>
  );
}
```

### События с дополнительными параметрами

Функция `track` принимает второй аргумент — объект с произвольными свойствами:

```typescript
// components/ProductCard.tsx
'use client';

import { track } from '@vercel/analytics';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export function ProductCard({ product }: { product: Product }) {
  const handleAddToCart = () => {
    track('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category,
    });
  };

  const handlePurchase = () => {
    track('purchase', {
      productId: product.id,
      revenue: product.price,
    });
  };

  return (
    <div>
      <h2>{product.name}</h2>
      <button onClick={handleAddToCart}>В корзину</button>
      <button onClick={handlePurchase}>Купить</button>
    </div>
  );
}
```

### Трекинг в Server Actions

В Server Actions отслеживание событий невозможно напрямую, поскольку `track` работает только на клиенте. Вместо этого передайте обратный вызов в клиентский компонент:

```typescript
// app/checkout/page.tsx
'use client';

import { track } from '@vercel/analytics';

async function placeOrder(formData: FormData) {
  'use server';
  // серверная логика заказа
  await processOrder(formData);
}

export default function CheckoutPage() {
  const handleAction = async (formData: FormData) => {
    await placeOrder(formData);
    // Трекинг происходит на клиенте после завершения server action
    track('order_placed', {
      source: 'checkout_page',
    });
  };

  return (
    <form action={handleAction}>
      {/* поля оформления заказа */}
    </form>
  );
}
```

## Настройка компонента Analytics

Компонент `Analytics` принимает несколько пропсов для тонкой настройки:

```typescript
import { Analytics } from '@vercel/analytics/react';

// Отключение в режиме разработки
<Analytics
  mode={process.env.NODE_ENV === 'production' ? 'production' : 'development'}
/>

// Отключение автоматического трекинга страниц
<Analytics autoTrack={false} />

// Кастомный обработчик перед отправкой события
<Analytics
  beforeSend={(event) => {
    // Возвращаем null, чтобы заблокировать отправку события
    if (event.url.includes('/admin')) {
      return null;
    }
    return event;
  }}
/>
```

### Фильтрация URL через beforeSend

Свойство `beforeSend` особенно полезно для исключения служебных или приватных страниц из аналитики:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

const EXCLUDED_PATHS = ['/admin', '/dashboard/internal', '/api'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics
          beforeSend={(event) => {
            const url = new URL(event.url);
            const isExcluded = EXCLUDED_PATHS.some((path) =>
              url.pathname.startsWith(path)
            );
            return isExcluded ? null : event;
          }}
        />
      </body>
    </html>
  );
}
```

## Web Vitals через SpeedInsights

Пакет `@vercel/speed-insights` автоматически собирает следующие метрики:

- **LCP** (Largest Contentful Paint) — время отрисовки самого крупного элемента
- **CLS** (Cumulative Layout Shift) — смещение элементов при загрузке
- **FID** (First Input Delay) — задержка первого взаимодействия
- **TTFB** (Time to First Byte) — время до первого байта
- **INP** (Interaction to Next Paint) — время отклика на взаимодействия

Посмотреть эти метрики можно в дашборде Vercel во вкладке **Speed Insights**. Данные разбиваются по маршрутам, устройствам и географии.

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

// Настройка выборки — собирать данные только с 50% посещений
<SpeedInsights sampleRate={0.5} />

// Отключение в определённых условиях
<SpeedInsights
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Работа без деплоя на Vercel

Vercel Analytics работает и за пределами платформы Vercel, но с ограничениями. По умолчанию пакет проверяет переменную окружения `VERCEL` и активируется только на платформе Vercel. Чтобы использовать аналитику на другом хостинге, установите режим явно:

```typescript
<Analytics mode="production" />
```

В этом случае события будут отправляться на эндпоинт Vercel, но для их просмотра всё равно потребуется Vercel-проект. Данная схема имеет смысл, если у вас уже есть Vercel-проект, но деплой происходит через CI/CD на другой инфраструктуре.

## Переменные окружения

Vercel автоматически добавляет переменную `NEXT_PUBLIC_VERCEL_ENV` при деплое. Её удобно использовать для условного включения аналитики:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        {isProduction && <Analytics />}
      </body>
    </html>
  );
}
```

Другие полезные переменные Vercel:

```bash
NEXT_PUBLIC_VERCEL_ENV       # production | preview | development
NEXT_PUBLIC_VERCEL_URL       # домен текущего деплоя
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA  # хеш коммита
```

## Создание кастомных хуков для трекинга

Для удобного переиспользования трекинга в крупных приложениях удобно создать обёртки:

```typescript
// hooks/useAnalytics.ts
'use client';

import { track } from '@vercel/analytics';

type EventName =
  | 'signup_completed'
  | 'login_success'
  | 'add_to_cart'
  | 'purchase'
  | 'course_started'
  | 'lesson_completed';

interface EventProperties {
  [key: string]: string | number | boolean;
}

export function useAnalytics() {
  const trackEvent = (name: EventName, properties?: EventProperties) => {
    track(name, properties);
  };

  const trackCourseStart = (courseId: string, courseName: string) => {
    trackEvent('course_started', { courseId, courseName });
  };

  const trackLessonComplete = (
    lessonId: string,
    courseId: string,
    durationSeconds: number
  ) => {
    trackEvent('lesson_completed', { lessonId, courseId, durationSeconds });
  };

  return { trackEvent, trackCourseStart, trackLessonComplete };
}
```

Пример использования хука:

```typescript
// components/LessonPlayer.tsx
'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

export function LessonPlayer({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const { trackLessonComplete } = useAnalytics();

  const handleComplete = (durationSeconds: number) => {
    trackLessonComplete(lessonId, courseId, durationSeconds);
  };

  return (
    <video
      onEnded={() => handleComplete(300)}
    />
  );
}
```

## Просмотр данных в дашборде

После деплоя данные появляются в разделах **Analytics** и **Speed Insights** в вашем Vercel-проекте. Дашборд предоставляет:

- Уникальные посетители и просмотры страниц с разбивкой по времени
- Топ страниц, стран, браузеров и операционных систем
- Путь пользователей (рефереры и первые визиты)
- Графики Web Vitals по маршрутам и типам устройств
- Таблицу пользовательских событий с фильтрацией

Обратите внимание, что данные в бесплатном плане хранятся **30 дней**, а в платных планах — до 1 года.

## Типичные ошибки при подключении

**Компонент не рендерится на сервере.** `Analytics` и `SpeedInsights` — клиентские компоненты, но их не нужно оборачивать в `'use client'`. Они внутри уже помечены как клиентские. Просто импортируйте и используйте в layout.

**Дублирование событий.** Не помещайте `Analytics` в несколько layout-файлов одновременно. Один экземпляр в корневом layout достаточен.

**Трекинг не работает локально.** По умолчанию пакет работает в режиме `development` при локальном запуске и выводит события в консоль браузера, но не отправляет их на сервер. Это штатное поведение.

**Ошибка типов при передаче свойств события.** Убедитесь, что все значения в объекте свойств имеют примитивный тип — `string`, `number` или `boolean`. Вложенные объекты и массивы не поддерживаются.

```typescript
// Неверно — вложенный объект
track('purchase', {
  product: { id: '123', name: 'Курс' }, // ошибка!
});

// Верно — плоская структура
track('purchase', {
  productId: '123',
  productName: 'Курс',
});
```

## Итог

Vercel Analytics — простой и приватный способ добавить аналитику в Next.js-проект. Установка занимает несколько минут: добавьте два пакета, вставьте компоненты в корневой layout и получайте данные о посещаемости и производительности без настройки сторонних сервисов. Пользовательские события через `track` позволяют измерять бизнес-метрики, а `beforeSend` даёт гибкий контроль над тем, какие данные отправляются.

Для углублённого изучения Next.js и работы с Vercel подойдёт курс на PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=vercel-analytics)