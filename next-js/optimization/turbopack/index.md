---
metaTitle: "Turbopack в Next.js: быстрая сборка на Rust"
metaDescription: "Turbopack — новый сборщик для Next.js на Rust. Как включить, настроить и мигрировать с Webpack. Сравнение скорости и поддерживаемые функции."
author: "Антон Ларичев"
title: "Turbopack в Next.js"
preview: "Turbopack — сборщик модулей на Rust, встроенный в Next.js. Разбираем, как его включить, настроить и что он даёт на практике."
---

## Что такое Turbopack

Turbopack — это инкрементальный сборщик модулей, написанный на Rust компанией Vercel. Он создавался как замена Webpack в экосистеме Next.js и призван решить проблему медленных холодных стартов и пересборок при разработке больших приложений.

Чисто технически Turbopack не является прямым портом Webpack на Rust. Это принципиально новая архитектура, основанная на инкрементальных вычислениях: при изменении файла пересчитывается только тот граф зависимостей, который затронут изменением, а не весь бандл целиком.

Beginning with Next.js 13.1, Turbopack доступен в режиме альфа, а начиная с Next.js 15 — стабилен для режима разработки (`next dev`).

## Почему Webpack перестал справляться

Webpack создавался в эпоху, когда типичное фронтенд-приложение содержало несколько сотен модулей. Современные проекты могут включать десятки тысяч файлов с учётом `node_modules`, компонентов, стилей и типов.

Проблемы Webpack в больших проектах:

- **Холодный старт** занимает от 30 секунд до нескольких минут, так как Webpack синхронно обходит весь граф модулей перед запуском dev-сервера.
- **HMR (Hot Module Replacement)** замедляется по мере роста проекта, потому что обновление одного файла может затрагивать большой подграф зависимостей.
- **Параллелизм** ограничен — JavaScript однопоточный, и тяжёлые операции (минификация, компиляция TypeScript) блокируют основной поток.

Turbopack решает эти проблемы за счёт:

- Нативной параллелизации на уровне Rust и операционной системы.
- Инкрементального кэша на уровне функций: каждая операция трансформации кэшируется отдельно.
- Ленивой компиляции — в dev-режиме компилируются только те модули, которые реально запросил браузер.

## Как включить Turbopack

### В режиме разработки

Начиная с Next.js 15, Turbopack является сборщиком по умолчанию для `next dev`. Если вы используете более раннюю версию или хотите явно указать его, добавьте флаг `--turbopack`:

```bash
next dev --turbopack
```

Или через `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}
```

### Проверка активации

При запуске с Turbopack в консоли появится соответствующая метка:

```bash
▲ Next.js 15.0.0 (Turbopack)
- Local:        http://localhost:3000
```

### Для production-сборки

В Next.js 15 `next build` с Turbopack доступен, но всё ещё имеет ряд ограничений по сравнению с Webpack. Флаг включается аналогично:

```bash
next build --turbopack
```

Для production рекомендуется убедиться, что все используемые плагины и лоадеры поддерживают Turbopack, прежде чем переключать CI/CD.

## Настройка Turbopack в next.config

Turbopack настраивается через поле `turbopack` в `next.config.ts` (или `next.config.js`).

### Псевдонимы модулей (aliases)

Если в проекте используются алиасы путей, их нужно продублировать в конфигурации Turbopack:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@components': './src/components',
      '@utils': './src/utils',
      '@hooks': './src/hooks',
    },
  },
};

export default nextConfig;
```

### Расширения файлов для разрешения

По умолчанию Turbopack резолвит стандартный набор расширений. Добавить собственные можно так:

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    resolveExtensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
};

export default nextConfig;
```

### Подключение Webpack-лоадеров

Turbopack поддерживает часть Webpack-лоадеров через слой совместимости. Это позволяет использовать существующую экосистему без полной миграции:

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
```

Важно: не все Webpack-лоадеры совместимы. Лоадеры, которые зависят от внутреннего API Webpack (например, обращаются к `this.webpack`), работать не будут.

## Что поддерживается, а что нет

### Поддерживается

- TypeScript и JSX/TSX из коробки
- CSS Modules
- PostCSS
- Sass/SCSS
- Tailwind CSS
- Алиасы путей из `tsconfig.json` (через `paths`)
- Большинство стандартных Next.js функций: App Router, Server Components, API Routes, Middleware
- CSS-in-JS библиотеки с поддержкой RSC (например, `@emotion/react` с правильной конфигурацией)
- Переменные окружения через `.env`

### Не поддерживается или с ограничениями

- `next.config.js` поле `webpack` — кастомные Webpack-конфигурации игнорируются при включённом Turbopack. Используйте `turbopack` поле вместо него.
- Некоторые Babel-плагины — Turbopack использует SWC для трансформации, а не Babel. Если `.babelrc` присутствует в проекте, Turbopack переключится на Babel, что замедлит работу.
- `experimental.serverComponentsExternalPackages` — аналог для Turbopack называется иначе.

## Практический пример: SVG как React-компоненты

Одна из распространённых задач — импорт SVG как React-компонентов. С Webpack это решается через `@svgr/webpack`. С Turbopack конфигурация выглядит следующим образом.

Установка зависимости:

```bash
npm install --save-dev @svgr/webpack
```

Настройка в `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
```

Объявление типов в `svg.d.ts`:

```typescript
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
```

Использование в компоненте:

```tsx
import Logo from '@/assets/logo.svg';

export function Header() {
  return (
    <header>
      <Logo width={120} height={40} />
    </header>
  );
}
```

## Практический пример: CSS Modules с Sass

Turbopack поддерживает Sass без дополнительной конфигурации — достаточно установить пакет:

```bash
npm install --save-dev sass
```

Файл `Button.module.scss`:

```scss
$primary: #6366f1;
$radius: 8px;

.button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background-color: $primary;
  border-radius: $radius;
  color: white;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &.large {
    padding: 12px 24px;
    font-size: 1.1rem;
  }
}
```

Компонент `Button.tsx`:

```tsx
import styles from './Button.module.scss';

interface ButtonProps {
  children: React.ReactNode;
  size?: 'default' | 'large';
  onClick?: () => void;
}

export function Button({ children, size = 'default', onClick }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${size === 'large' ? styles.large : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

## Миграция с Webpack на Turbopack

### Шаг 1: аудит кастомной конфигурации Webpack

Откройте `next.config.ts` и найдите функцию `webpack`. Всё, что в ней описано, нужно будет перенести в `turbopack.rules` или найти альтернативу:

```typescript
// Было (Webpack)
const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

// Стало (Turbopack)
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};
```

### Шаг 2: проверка .babelrc

Если в проекте есть `.babelrc` или `babel.config.js`, Turbopack переключится с SWC на Babel. Это снизит производительность. Проверьте, какие плагины используются, и постарайтесь заменить их на поддерживаемые SWC-трансформации.

Например, `babel-plugin-module-resolver` можно заменить алиасами в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

### Шаг 3: постепенное переключение

Рекомендуется сначала переключить только dev-режим и прогнать весь проект вручную или через e2e-тесты, прежде чем включать Turbopack для production-сборки:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "build:turbo": "next build --turbopack"
  }
}
```

## Сравнение скорости

Vercel приводит следующие данные на основе крупных реальных приложений:

- **Холодный старт dev-сервера**: Turbopack в 76% случаев быстрее Webpack при первом запуске.
- **Обновление файла (HMR)**: Turbopack обновляет модуль за 1–3 мс против 100–800 мс у Webpack на проектах с 30 000+ модулей.
- **Использование памяти**: на больших проектах Turbopack потребляет меньше памяти благодаря инкрементальной архитектуре.

В небольших проектах разница будет менее заметна, но даже там HMR становится субъективно отзывчивее.

## Диагностика проблем

### Проверка поддержки лоадера

Если лоадер не работает, проверьте список поддерживаемых лоадеров в документации Turbopack. Временное решение — откатиться на Webpack для конкретного типа файлов или найти альтернативный лоадер.

### Конфликт с Babel

Если в корне проекта есть `.babelrc`, но вы хотите использовать SWC, удалите файл и перенастройте нужные трансформации через `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  compiler: {
    // Пример: удаляем console.log в production
    removeConsole: process.env.NODE_ENV === 'production',
    // Поддержка styled-components
    styledComponents: true,
  },
};
```

### Логи компиляции

Для отладки можно включить подробный вывод:

```bash
NEXT_TURBOPACK_TRACING=1 next dev --turbopack
```

Трейсинг сохраняется в файл `.next/trace`, который можно проанализировать с помощью инструментов Vercel.

## Итог

Turbopack — это не просто «быстрый Webpack». Это новая архитектура сборки, которая меняет подход к инкрементальной компиляции. В Next.js 15 он стабилен для разработки и активно развивается для production.

Практические рекомендации:

- Включайте Turbopack в новых проектах сразу — конфигурация минимальна.
- В существующих проектах начните с `next dev --turbopack` и устраните несовместимости постепенно.
- Удалите `.babelrc`, если он используется только для алиасов или базовых трансформаций — SWC покрывает большинство из них.
- Для production-сборки переключайтесь только после полного тестирования.

Чтобы глубже разобраться с оптимизацией Next.js-приложений, изучите курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=turbopack).