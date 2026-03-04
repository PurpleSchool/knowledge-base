---
metaTitle: "Error Boundaries в React — обработка и изоляция ошибок"
metaDescription: "Полное руководство по Error Boundaries в React: создание декларативных предохранителей, работа с getDerivedStateFromError и componentDidCatch, интеграция с Next.js и библиотекой react-error-boundary."
author: "Олег Марков"
title: "Error Boundaries: создаем надежные React-приложения"
preview: "Узнайте, как предотвратить «белый экран смерти» в вашем приложении. Разберем, как изолировать ошибки в отдельных виджетах, настроить автоматическое логирование в Sentry и предоставить пользователям возможность восстановить работу страницы без перезагрузки."
---

# Error Boundaries — обработка ошибок в React

**Error Boundaries** — это React-компоненты, которые **перехватывают JavaScript-ошибки** в дереве дочерних компонентов, логируют их и показывают запасной UI вместо упавшего дерева компонентов.

```tsx
// Базовый пример Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Поймана ошибка:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Использование
<ErrorBoundary fallback={<p>Что-то пошло не так</p>}>
  <MyComponent />
</ErrorBoundary>
```

## Зачем нужны Error Boundaries

В React 16+ необработанная ошибка в компоненте **размонтирует всё дерево** приложения. Это лучше, чем показывать сломанный UI — но полный краш неприемлем для продакшена.

Error Boundaries позволяют:
- **Изолировать ошибки** — сбой в одной части не ронит всё приложение
- **Показывать fallback UI** — понятное сообщение вместо белого экрана
- **Логировать ошибки** — отправлять отчёты в Sentry, Datadog и т.д.
- **Восстанавливаться** — предоставить кнопку "Попробовать снова"

## Реализация на классовых компонентах

Error Boundaries **можно создать только как классовые компоненты** — функциональные компоненты пока не поддерживают `getDerivedStateFromError` и `componentDidCatch`.

```tsx
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Вызывается при рендере после ошибки
  // Обновляет state для показа fallback UI
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Вызывается после рендера с ошибкой
  // Используется для логирования
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Логируем в внешний сервис
    this.props.onError?.(error, info);
    console.error('ErrorBoundary поймал:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-fallback">
          <h2>Что-то пошло не так</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Два метода жизненного цикла

### `getDerivedStateFromError`

Статический метод, вызываемый **во время фазы рендера** после ошибки. Должен возвращать новый state.

```tsx
static getDerivedStateFromError(error: Error) {
  // ✅ Только возвращаем новый state
  return { hasError: true, error };
  // ❌ Нельзя вызывать side effects здесь
}
```

### `componentDidCatch`

Вызывается **после коммита** (phase commit). Используется для side effects — логирования, отчётов об ошибках.

```tsx
componentDidCatch(error: Error, info: React.ErrorInfo) {
  // ✅ Side effects — логирование, аналитика
  logErrorToService(error, info.componentStack);
}
```

## Продвинутый Error Boundary с восстановлением

```tsx
// components/ErrorBoundary.tsx
import React from 'react';
import { logError } from '@/lib/monitoring';

interface Props {
  children: React.ReactNode;
  fallback?: (props: FallbackProps) => React.ReactNode;
  onReset?: () => void;
}

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Отправляем в мониторинг (Sentry, Datadog, etc.)
    logError(error, {
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  // Сброс состояния ошибки
  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Кастомный fallback с возможностью восстановления
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      // Дефолтный fallback
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <h2 className="text-xl font-semibold text-red-600">
            Произошла ошибка
          </h2>
          <p className="text-gray-600">{this.state.error.message}</p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Оборачивание функциональным компонентом

Для удобства использования хуков и props можно создать обёртку:

```tsx
// components/WithErrorBoundary.tsx
'use client';

import ErrorBoundary from './ErrorBoundary';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  redirectOnError?: string;
}

export function WithErrorBoundary({ children, redirectOnError }: Props) {
  const router = useRouter();

  const handleReset = () => {
    if (redirectOnError) {
      router.push(redirectOnError);
    }
  };

  return (
    <ErrorBoundary
      onReset={handleReset}
      fallback={({ error, resetError }) => (
        <div className="error-container">
          <h2>Ошибка: {error.message}</h2>
          <button onClick={resetError}>Попробовать снова</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Использование библиотеки react-error-boundary

Популярная библиотека `react-error-boundary` предоставляет готовое решение с поддержкой функциональных компонентов:

```bash
npm install react-error-boundary
```

```tsx
// Базовое использование
import { ErrorBoundary } from 'react-error-boundary';

function FallbackComponent({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <p>Что-то пошло не так:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Попробовать снова</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={(error, info) => logError(error, info)}
      onReset={() => {
        // Сброс состояния приложения при необходимости
      }}
    >
      <MyWidget />
    </ErrorBoundary>
  );
}
```

```tsx
// Хук useErrorBoundary для программного выброса ошибок
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleAsyncError = async () => {
    try {
      await fetchSomeData();
    } catch (error) {
      // Передаём async-ошибку в ближайший Error Boundary
      showBoundary(error);
    }
  };

  return <button onClick={handleAsyncError}>Загрузить данные</button>;
}
```

## Интеграция с Next.js

### App Router — error.tsx

В Next.js App Router есть встроенная поддержка через файл `error.tsx`:

```tsx
// app/dashboard/error.tsx
'use client'; // Обязательно — error.tsx должен быть Client Component

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Логируем ошибку в сервис мониторинга
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold">Ошибка в дашборде</h2>
      <p className="text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Повторить попытку
      </button>
    </div>
  );
}
```

```tsx
// app/dashboard/global-error.tsx — перехватывает ошибки в корневом layout
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

### Стратегия изоляции ошибок

```tsx
// app/layout.tsx — несколько уровней Error Boundary
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {/* Глобальный boundary для критических ошибок */}
        <ErrorBoundary fallback={<CriticalErrorPage />}>
          <Header />
          {/* Изолированный boundary для основного контента */}
          <ErrorBoundary fallback={<ContentErrorFallback />}>
            <main>{children}</main>
          </ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Ограничения Error Boundaries

Error Boundaries **НЕ перехватывают** ошибки:

| Тип ошибки | Перехватывается? | Решение |
|-----------|-----------------|---------|
| Ошибки в обработчиках событий | ❌ | try/catch в обработчике |
| Асинхронный код (setTimeout, fetch) | ❌ | useErrorBoundary() из react-error-boundary |
| Server-side rendering (SSR) | ❌ | error.tsx в Next.js App Router |
| Ошибки в самом Error Boundary | ❌ | Вышестоящий Error Boundary |
| Ошибки при рендере дочерних компонентов | ✅ | getDerivedStateFromError |
| Ошибки в конструкторе дочерних компонентов | ✅ | getDerivedStateFromError |

```tsx
// ❌ Плохо — ошибка в обработчике события не поймается Error Boundary
function BadComponent() {
  const handleClick = () => {
    throw new Error('Ошибка в обработчике'); // Не поймается!
  };
  return <button onClick={handleClick}>Нажми</button>;
}

// ✅ Хорошо — используем try/catch для обработчиков событий
function GoodComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      showBoundary(error); // Пробрасываем в Error Boundary
    }
  };

  return <button onClick={handleClick}>Нажми</button>;
}
```

## Антипаттерны

```tsx
// ❌ Один Error Boundary на всё приложение
// При любой ошибке весь UI заменяется fallback
function App() {
  return (
    <ErrorBoundary fallback={<Fallback />}>
      <Header />
      <Sidebar />
      <MainContent />  {/* Ошибка здесь обнуляет весь интерфейс */}
      <Footer />
    </ErrorBoundary>
  );
}

// ✅ Хорошо — гранулярная изоляция
function App() {
  return (
    <div>
      <Header /> {/* Критичный UI — без boundary или с отдельным */}
      <ErrorBoundary fallback={<SidebarError />}>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary fallback={<ContentError />}>
        <MainContent />
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
```

```tsx
// ❌ Плохо — игнорирование логирования
static getDerivedStateFromError(error: Error) {
  return { hasError: true };
  // Ошибка нигде не логируется!
}

// ✅ Хорошо — всегда логируем в componentDidCatch
componentDidCatch(error: Error, info: React.ErrorInfo) {
  // Отправляем в Sentry
  Sentry.captureException(error, {
    contexts: { react: { componentStack: info.componentStack } },
  });
}
```

## Лучшие практики

1. **Гранулярность** — оборачивайте отдельные независимые части UI, а не всё приложение
2. **Информативный fallback** — показывайте понятное сообщение и возможность восстановления
3. **Всегда логируйте** — отправляйте ошибки в систему мониторинга (Sentry, Datadog)
4. **Кнопка "Попробовать снова"** — дайте пользователю возможность восстановить работу
5. **Используйте react-error-boundary** — готовое решение с поддержкой хуков
6. **Отдельный boundary для критичных секций** — Header, навигация — изолируйте от остального
7. **Тестируйте Error Boundaries** — убедитесь что fallback отображается корректно
8. **Не злоупотребляйте** — не нужен boundary для каждого компонента

## Сравнение подходов

| Подход | Когда использовать | Плюсы | Минусы |
|--------|-------------------|-------|--------|
| Классовый ErrorBoundary | Кастомная логика восстановления | Полный контроль | Verbose синтаксис |
| react-error-boundary | Большинство случаев | Готовое решение, хуки | Зависимость |
| Next.js error.tsx | Сегменты маршрутов | Встроено в Next.js | Только App Router |
| Next.js global-error.tsx | Ошибки в root layout | Перехват критических ошибок | Заменяет весь layout |

## Краткое резюме

| Концепция | Суть |
|-----------|------|
| Error Boundary | Классовый компонент, перехватывающий ошибки рендера |
| `getDerivedStateFromError` | Обновляет state для показа fallback (фаза рендера) |
| `componentDidCatch` | Логирует ошибку (фаза коммита) |
| Fallback UI | Запасной интерфейс при ошибке |
| `useErrorBoundary` | Пробрасывает async-ошибки в boundary |
| `error.tsx` | Next.js App Router аналог Error Boundary |

## Дополнительные материалы

- [React Docs — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary на GitHub](https://github.com/bvaughn/react-error-boundary)
- [Next.js — error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
