---
metaTitle: Emotion — библиотека CSS-in-JS для React
metaDescription: Полное руководство по Emotion — высокопроизводительной библиотеке CSS-in-JS. Установка, css prop, styled API, серверный рендеринг, темизация и TypeScript
author: Олег Марков
title: Emotion — библиотека CSS-in-JS
preview: Узнайте, как работает Emotion — гибкая CSS-in-JS библиотека с двумя API: css prop для инлайн-стилей и styled для создания стилизованных компонентов
---

## Введение

Emotion — одна из самых популярных CSS-in-JS библиотек в экосистеме React. Она выделяется двумя ключевыми особенностями: высокой производительностью и двумя способами написания стилей. Вы можете использовать `css` prop непосредственно на JSX-элементах или создавать стилизованные компоненты через `styled` API — похожий на Styled Components.

В отличие от многих конкурентов, Emotion активно применяется в известных проектах: MUI (Material UI) использует Emotion как основной движок стилей начиная с v5. Это говорит о надёжности и зрелости библиотеки.

В этой статье вы узнаете, как установить Emotion, какие подходы к стилизации она предлагает и как использовать продвинутые возможности: темизацию, анимации и SSR.

## Установка

Emotion поставляется в двух основных пакетах:

```bash
# Базовый пакет — работает в любом окружении
npm install @emotion/react @emotion/styled

# Если используете Create React App или Vite
npm install @emotion/react @emotion/styled @emotion/babel-plugin
```

Для поддержки `css` prop без импорта pragma нужен Babel-плагин или настройка jsxImportSource:

```json
// .babelrc
{
  "plugins": ["@emotion/babel-plugin"]
}
```

Или в `tsconfig.json` / `jsconfig.json`:

```json
{
  "compilerOptions": {
    "jsxImportSource": "@emotion/react"
  }
}
```

Для Vite:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
});
```

## CSS Prop — первый способ стилизации

`css` prop — уникальная особенность Emotion, которой нет в большинстве других CSS-in-JS библиотек. Он позволяет писать стили прямо на элементе:

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

// Способ 1: строка CSS
function Button() {
  return (
    <button
      css={css`
        background-color: #6c63ff;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;

        &:hover {
          background-color: #5a52d5;
        }
      `}
    >
      Нажми меня
    </button>
  );
}

// Способ 2: объект стилей
function Card() {
  return (
    <div
      css={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      Карточка
    </div>
  );
}
```

### Вынос стилей в переменные

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

// Определяем стили отдельно — переиспользуемые
const baseButtonStyles = css`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const primaryStyles = css`
  background-color: #6c63ff;
  color: white;

  &:hover {
    background-color: #5a52d5;
    transform: translateY(-1px);
  }
`;

const dangerStyles = css`
  background-color: #e53e3e;
  color: white;

  &:hover {
    background-color: #c53030;
  }
`;

// Композиция стилей через массив
function App() {
  return (
    <div>
      <button css={[baseButtonStyles, primaryStyles]}>Основная</button>
      <button css={[baseButtonStyles, dangerStyles]}>Опасная</button>
    </div>
  );
}
```

Массив стилей — мощный инструмент Emotion: стили применяются слева направо, более поздние переопределяют предыдущие. Можно передавать `false` для условного включения стилей:

```jsx
function Button({ disabled, primary }) {
  return (
    <button
      css={[
        baseButtonStyles,
        primary && primaryStyles,
        disabled && css`
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        `,
      ]}
    >
      Кнопка
    </button>
  );
}
```

## Styled API — второй способ стилизации

Если вы знакомы со Styled Components, `@emotion/styled` будет привычен — синтаксис практически идентичен:

```jsx
import styled from '@emotion/styled';

const Button = styled.button`
  background-color: #6c63ff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background-color: #5a52d5;
  }
`;

// Динамические стили через пропсы
const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${props => {
    switch (props.variant) {
      case 'success': return '#48bb78';
      case 'error': return '#e53e3e';
      case 'warning': return '#ed8936';
      default: return '#6c63ff';
    }
  }};
  color: white;
`;

// TypeScript версия
interface CardProps {
  elevated?: boolean;
}

const Card = styled.div<CardProps>`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: ${props => props.elevated
    ? '0 10px 40px rgba(0, 0, 0, 0.15)'
    : '0 2px 8px rgba(0, 0, 0, 0.05)'
  };
`;
```

## Темизация

Emotion имеет встроенную поддержку тем через `ThemeProvider`:

```jsx
import { ThemeProvider } from '@emotion/react';

const theme = {
  colors: {
    primary: '#6c63ff',
    secondary: '#48bb78',
    background: '#f7f8fc',
    text: '#2d3748',
    error: '#e53e3e',
  },
  spacing: (factor) => `${8 * factor}px`,
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  );
}
```

Доступ к теме в стилях:

```jsx
import styled from '@emotion/styled';
import { css, useTheme } from '@emotion/react';

// В styled API
const Button = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing(1.5)} ${props => props.theme.spacing(3)};
`;

// В css prop
function Card() {
  const theme = useTheme();
  
  return (
    <div
      css={css`
        background: ${theme.colors.background};
        padding: ${theme.spacing(3)};
        
        @media (min-width: ${theme.breakpoints.md}) {
          padding: ${theme.spacing(4)};
        }
      `}
    >
      Содержимое карточки
    </div>
  );
}
```

Для TypeScript расширяем тип темы:

```typescript
// emotion.d.ts
import '@emotion/react';

declare module '@emotion/react' {
  export interface Theme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      error: string;
    };
    spacing: (factor: number) => string;
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  }
}
```

## Глобальные стили

```jsx
import { Global, css } from '@emotion/react';

function App() {
  return (
    <>
      <Global
        styles={css`
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f7f8fc;
            color: #2d3748;
          }
        `}
      />
      <Router>
        <Layout />
      </Router>
    </>
  );
}
```

## Анимации

```jsx
import { css, keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(108, 99, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0);
  }
`;

const BouncingBall = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #6c63ff;
  animation: ${bounce} 1s ease infinite;
`;

const PulseButton = styled.button`
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  animation: ${pulseAnimation} 2s ease infinite;
`;
```

## Серверный рендеринг

В Next.js App Router Emotion требует специальной настройки для корректного SSR:

```jsx
// app/registry.tsx
'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

export default function StyledComponentsRegistry({ children }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

// app/layout.tsx
import StyledComponentsRegistry from './registry';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
```

## Emotion vs Styled Components

| Характеристика | Emotion | Styled Components |
|---------------|---------|------------------|
| CSS prop | ✅ Есть | ❌ Нет |
| styled API | ✅ Есть | ✅ Есть |
| Производительность | Немного быстрее | Немного медленнее |
| Размер бандла | ~11KB | ~15KB |
| SSR | Требует настройки | Лучше из коробки |
| TypeScript | Отличная поддержка | Отличная поддержка |
| Используется в | MUI, Chakra UI | Множество проектов |

## Итоги

Emotion — мощная и гибкая библиотека CSS-in-JS, которая предлагает два подхода к стилизации: `css` prop для тех, кто предпочитает писать стили рядом с JSX, и `styled` API для тех, кто привык к компонентному подходу. Высокая производительность, отличная TypeScript-поддержка и использование в MUI делают Emotion надёжным выбором для React-проектов.
