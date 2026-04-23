---
metaTitle: next/font — подключение шрифтов в Next.js и Google Fonts
metaDescription: Разбираем next/font в Next.js — автоматическая оптимизация шрифтов, подключение Google Fonts без утечки данных, локальные шрифты, CSS-переменные и предотвращение FOUT.
author: Антон Ларичев
title: next/font — подключение и оптимизация шрифтов в Next.js
preview: Полный разбор next/font — как подключить Google Fonts и локальные шрифты в Next.js с автоматической оптимизацией, self-hosting и предотвращением FOUT без дополнительной конфигурации.
---

## Введение

Шрифты — частая причина проблем с производительностью: они блокируют рендеринг, вызывают FOUT (Flash Of Unstyled Text) и могут отправлять запросы к сторонним серверам. Традиционное подключение Google Fonts через `<link>` в `<head>` отправляет запрос на `fonts.googleapis.com` при каждой загрузке страницы.

Next.js предлагает встроенный модуль `next/font`, который решает все эти проблемы: скачивает шрифты во время сборки, размещает их вместе с приложением (self-hosting) и добавляет `font-display: swap` автоматически. Никаких запросов к внешним серверам в runtime.

## Подключение Google Fonts

### Базовый пример

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'], // набор символов
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

`inter.className` — это сгенерированный CSS-класс, который применяет шрифт ко всем дочерним элементам. Шрифт будет доступен для всего приложения через наследование.

### Выбор начертаний (weight и style)

```typescript
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400', '500', '700'], // нужные начертания
  style: ['normal', 'italic'],
  subsets: ['cyrillic'],
  display: 'swap', // по умолчанию — swap
});
```

Указывайте только те `weight`, которые реально используются — каждое начертание это отдельный файл. Лишние утяжеляют страницу.

### Переменный шрифт (variable font)

Переменные шрифты поддерживают диапазон начертаний в одном файле — это эффективнее отдельных файлов:

```typescript
import { Inter } from 'next/font/google';

// Inter — переменный шрифт, не нужно указывать отдельные weight
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  // weight не нужен для переменных шрифтов
});
```

Список переменных шрифтов Google: Inter, Roboto Flex, Raleway, Source Sans 3 и другие.

## CSS-переменные — гибкое применение

Вместо `className` можно использовать CSS-переменную для более гибкого управления шрифтами через CSS:

```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter', // имя CSS-переменной
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      // Применяем оба шрифта через переменные
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

```css
/* globals.css */
body {
  font-family: var(--font-inter), sans-serif;
}

h1, h2, h3 {
  font-family: var(--font-playfair), serif;
}
```

Этот подход позволяет использовать разные шрифты для разных элементов без привязки к конкретным именам классов.

## Использование с Tailwind CSS

CSS-переменные отлично интегрируются с Tailwind CSS:

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['cyrillic'],
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
};
```

Теперь класс `font-sans` в Tailwind будет использовать Inter.

## Локальные шрифты

Для собственных или купленных шрифтов используйте `next/font/local`:

```typescript
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    {
      path: '../../public/fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/MyFont-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-my',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={myFont.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Пути к файлам шрифтов относительны к файлу, где объявлен шрифт (не к `public/`).

## Использование в Pages Router

В Pages Router подключение через `_app.tsx`:

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.variable} font-sans`}>
      <Component {...pageProps} />
    </main>
  );
}
```

## Параметр preload

По умолчанию `preload: true` — Next.js добавляет `<link rel="preload">` для шрифта. Можно отключить, если шрифт не критичен:

```typescript
const decorativeFont = Pacifico({
  weight: '400',
  subsets: ['latin'],
  preload: false, // не предзагружать
});
```

## Как это работает под капотом

1. При `next build` Next.js скачивает файлы шрифтов с серверов Google Fonts.
2. Файлы помещаются в папку `.next/static/media/`.
3. В HTML добавляется `<link rel="preload">` и встроенный CSS с `@font-face`.
4. Шрифты обслуживаются вашим сервером — никаких запросов к Google.

Это повышает конфиденциальность (данные пользователей не отправляются Google) и производительность (один DNS-запрос меньше).

## Итог

`next/font` — стандартный способ подключать шрифты в Next.js:

- **Self-hosting** — шрифты скачиваются при сборке, нет запросов к Google в runtime
- **Оптимизация** — автоматический `font-display: swap` и предзагрузка
- **Гибкость** — CSS-переменные для использования с Tailwind и любым CSS
- **Конфиденциальность** — данные пользователей не покидают ваш сервер
- **Локальные шрифты** — поддержка собственных файлов через `next/font/local`

Подробнее про Next.js — на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-font).
