# Ленивая загрузка компонентов в React

**Ленивая загрузка (Lazy Loading)** — паттерн React, при котором компонент загружается не при старте приложения, а **только в момент, когда он действительно нужен пользователю**. Реализуется через `React.lazy` + `Suspense` и позволяет разбить JavaScript-бандл на более мелкие части, ускоряя начальную загрузку страницы.

```tsx
import { lazy, Suspense } from 'react';

// Компонент загружается только при первом рендере
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<p>Загрузка графика...</p>}>
      <HeavyChart />
    </Suspense>
  );
}
```

## React.lazy — динамический импорт

`React.lazy` принимает функцию, которая возвращает `Promise` с динамическим `import()`. Браузер загружает соответствующий чанк только когда компонент впервые оказывается в дереве.

### Базовый синтаксис

```tsx
import { lazy, Suspense } from 'react';

// ✅ Компонент объявляется вне тела других компонентов (на уровне модуля)
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>Настройки</button>

      {showSettings && (
        <Suspense fallback={<div>Загрузка настроек...</div>}>
          <SettingsPanel />
        </Suspense>
      )}
    </div>
  );
}
```

### Именованные экспорты

`React.lazy` работает только с **default-экспортами**. Для именованных нужна обёртка:

```tsx
// components/Charts.tsx — несколько экспортов
export function LineChart() { /* ... */ }
export function BarChart() { /* ... */ }
export function PieChart() { /* ... */ }

// ✅ Обёртка для именованного экспорта
const LineChart = lazy(() =>
  import('./components/Charts').then((module) => ({
    default: module.LineChart,
  }))
);

const BarChart = lazy(() =>
  import('./components/Charts').then((module) => ({
    default: module.BarChart,
  }))
);

function ReportPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LineChart data={salesData} />
      <BarChart data={categoryData} />
    </Suspense>
  );
}
```

## Suspense — граница ожидания

`Suspense` отображает `fallback` пока ленивый компонент загружается, и автоматически подменяет его на реальный UI после загрузки.

### Один Suspense для нескольких lazy-компонентов

```tsx
const Sidebar = lazy(() => import('./Sidebar'));
const MainContent = lazy(() => import('./MainContent'));
const Footer = lazy(() => import('./Footer'));

function Layout() {
  return (
    // Один Suspense — ждёт пока ВСЕ компоненты загрузятся
    <Suspense fallback={<FullPageSkeleton />}>
      <Sidebar />
      <MainContent />
      <Footer />
    </Suspense>
  );
}
```

### Вложенные Suspense — независимая загрузка частей

```tsx
const Header = lazy(() => import('./Header'));
const Sidebar = lazy(() => import('./Sidebar'));
const Feed = lazy(() => import('./Feed'));

function App() {
  return (
    <div>
      {/* Каждая секция грузится независимо */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <div className="content">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <Suspense fallback={<FeedSkeleton />}>
          <Feed />
        </Suspense>
      </div>
    </div>
  );
}
```

## Маршрутизация с ленивой загрузкой

Разбиение по маршрутам (route-based code splitting) — самый распространённый сценарий применения lazy loading. Каждая страница загружается только при переходе на неё.

### React Router v6

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Next.js App Router

В Next.js App Router каждый файл `page.tsx` уже является отдельным чанком. Для компонентов внутри страницы используется `dynamic`:

```tsx
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

// Загружается только на клиенте, без SSR
const HeavyEditor = dynamic(() => import('@/components/HeavyEditor'), {
  ssr: false,
  loading: () => <p>Загрузка редактора...</p>,
});

// Загружается с SSR + кастомный fallback
const DataGrid = dynamic(() => import('@/components/DataGrid'), {
  loading: () => <GridSkeleton />,
});

export default function DashboardPage() {
  return (
    <div>
      <DataGrid />
      <HeavyEditor />
    </div>
  );
}
```

### Next.js Pages Router

```tsx
// pages/editor.tsx
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('../components/RichTextEditor'),
  {
    ssr: false, // Редакторы часто несовместимы с SSR
    loading: () => <div>Загрузка редактора...</div>,
  }
);

export default function EditorPage() {
  return (
    <div>
      <h1>Редактор статьи</h1>
      <RichTextEditor />
    </div>
  );
}
```

## Обработка ошибок загрузки

Сетевые ошибки при загрузке чанков нужно обрабатывать через `ErrorBoundary`:

### ErrorBoundary с поддержкой повторной попытки

```tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.retry)
      ) : (
        <div>
          <p>Не удалось загрузить компонент</p>
          <button onClick={this.retry}>Повторить</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Использование
const HeavyMap = lazy(() => import('./HeavyMap'));

function MapSection() {
  return (
    <LazyErrorBoundary
      fallback={(retry) => (
        <div className="error-state">
          <p>Карта не загрузилась. Проверьте соединение.</p>
          <button onClick={retry}>Загрузить снова</button>
        </div>
      )}
    >
      <Suspense fallback={<MapSkeleton />}>
        <HeavyMap />
      </Suspense>
    </LazyErrorBoundary>
  );
}
```

### Автоматический retry при ошибке загрузки чанка

```tsx
// Утилита с повторными попытками
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval * (i + 1)));
        }
      }
    }

    throw lastError;
  });
}

// Использование
const HeavyComponent = lazyWithRetry(
  () => import('./HeavyComponent'),
  3,    // 3 попытки
  500   // интервал 500 мс
);
```

## Предзагрузка (Preloading)

Предзагрузка позволяет начать загрузку чанка **до того, как компонент появится в дереве** — при наведении, фокусе или по иному сигналу.

```tsx
const HeavyModal = lazy(() => import('./HeavyModal'));

// Функция для запуска предзагрузки
function preloadHeavyModal() {
  // Вызов import() начинает загрузку чанка, браузер его кеширует
  import('./HeavyModal');
}

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        // Предзагружаем при наведении — компонент уже готов к моменту клика
        onMouseEnter={preloadHeavyModal}
        onFocus={preloadHeavyModal}
      >
        Открыть панель
      </button>

      {isOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <HeavyModal onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

## Условная ленивая загрузка

```tsx
const AdminTools = lazy(() => import('./AdminTools'));
const UserDashboard = lazy(() => import('./UserDashboard'));

function App({ userRole }: { userRole: 'admin' | 'user' }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {userRole === 'admin' ? (
        <AdminTools />
      ) : (
        <UserDashboard />
      )}
    </Suspense>
  );
}
```

## Лучшие практики

### 1. Объявляй lazy-компоненты на уровне модуля

```tsx
// ❌ Плохо — при каждом рендере создаётся новый lazy, теряется кеш
function ParentComponent() {
  const HeavyChild = lazy(() => import('./HeavyChild')); // пересоздаётся!
  return (
    <Suspense fallback={<div>...</div>}>
      <HeavyChild />
    </Suspense>
  );
}

// ✅ Хорошо — объявление на уровне модуля, создаётся один раз
const HeavyChild = lazy(() => import('./HeavyChild'));

function ParentComponent() {
  return (
    <Suspense fallback={<div>...</div>}>
      <HeavyChild />
    </Suspense>
  );
}
```

### 2. Используй информативные fallback-компоненты

```tsx
// ❌ Плохо — неинформативный fallback
<Suspense fallback={<div>Загрузка...</div>}>
  <ProductList />
</Suspense>

// ✅ Хорошо — skeleton повторяет структуру реального компонента
function ProductListSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="product-card skeleton">
          <div className="skeleton-image" />
          <div className="skeleton-title" />
          <div className="skeleton-price" />
        </div>
      ))}
    </div>
  );
}

<Suspense fallback={<ProductListSkeleton />}>
  <ProductList />
</Suspense>
```

### 3. Комбинируй с ErrorBoundary

```tsx
// ✅ Полная защита: ErrorBoundary + Suspense
function SafeLazyComponent({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Переиспользуемая обёртка
const Analytics = lazy(() => import('./Analytics'));

<SafeLazyComponent>
  <Analytics />
</SafeLazyComponent>
```

### 4. Не дроби слишком мелко

```tsx
// ❌ Плохо — слишком много мелких чанков, HTTP overhead превысит выигрыш
const Button = lazy(() => import('./Button'));
const Input = lazy(() => import('./Input'));
const Label = lazy(() => import('./Label'));

// ✅ Хорошо — ленивая загрузка для действительно тяжёлых компонентов
const RichTextEditor = lazy(() => import('./RichTextEditor'));   // ~200 KB
const PdfViewer = lazy(() => import('./PdfViewer'));             // ~500 KB
const VideoPlayer = lazy(() => import('./VideoPlayer'));         // ~300 KB
```

### 5. Приоритизируй загрузку выше сгиба

```tsx
// ✅ Компоненты в зоне видимости — загружаем сразу (без lazy)
import HeroSection from './HeroSection';
import Navigation from './Navigation';

// Компоненты ниже сгиба — ленивая загрузка
const BlogSection = lazy(() => import('./BlogSection'));
const Footer = lazy(() => import('./Footer'));
const ChatWidget = lazy(() => import('./ChatWidget'));

function LandingPage() {
  return (
    <>
      <Navigation />    {/* Сразу */}
      <HeroSection />   {/* Сразу */}

      <Suspense fallback={<BlogSkeleton />}>
        <BlogSection />   {/* Лениво */}
      </Suspense>

      <Suspense fallback={null}>
        <Footer />         {/* Лениво */}
      </Suspense>

      <Suspense fallback={null}>
        <ChatWidget />     {/* Лениво */}
      </Suspense>
    </>
  );
}
```

## Антипаттерны

### Ленивая загрузка для маленьких компонентов

```tsx
// ❌ Плохо — чанк в 2 KB создаёт лишний сетевой запрос без выгоды
const SmallBadge = lazy(() => import('./SmallBadge'));

// ✅ Хорошо — ленивая загрузка только для тяжёлых зависимостей
const MonacoEditor = lazy(() => import('./MonacoEditor')); // monaco-editor ~2 MB
```

### Отсутствие Suspense

```tsx
// ❌ Плохо — React выбросит ошибку без Suspense
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  // Нет Suspense — ошибка!
  return <LazyComponent />;
}

// ✅ Хорошо — Suspense обязателен
function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Ленивая загрузка критически важных компонентов

```tsx
// ❌ Плохо — форма логина должна быть доступна немедленно
const LoginForm = lazy(() => import('./LoginForm'));

// ✅ Хорошо — логин критичен, импортируем статически
import LoginForm from './LoginForm';

// Зато тяжёлая аналитика на странице после логина — лениво
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
```

### Создание lazy внутри компонента

```tsx
// ❌ Плохо — lazy пересоздаётся при каждом ререндере родителя
function Parent({ showChild }: { showChild: boolean }) {
  // Каждый ререндер Parent создаёт новый объект lazy!
  const Child = lazy(() => import('./Child'));

  return showChild ? (
    <Suspense fallback={<div>...</div>}>
      <Child />
    </Suspense>
  ) : null;
}

// ✅ Хорошо — вынесено на уровень модуля
const Child = lazy(() => import('./Child'));

function Parent({ showChild }: { showChild: boolean }) {
  return showChild ? (
    <Suspense fallback={<div>...</div>}>
      <Child />
    </Suspense>
  ) : null;
}
```

## Сравнение способов ленивой загрузки

| Способ | Среда | Когда использовать |
|--------|-------|-------------------|
| `React.lazy` + `Suspense` | React (CRA, Vite) | Стандартный подход в клиентских приложениях |
| `next/dynamic` | Next.js | Ленивая загрузка в Next.js (Pages и App Router) |
| `React.lazy` + App Router | Next.js (клиентские) | Клиентские компоненты в App Router |
| Route-based splitting | Любой роутер | Разбиение по страницам — самый эффективный сценарий |
| Intersection Observer | Любой | Загрузка компонентов при появлении в вьюпорте |

## Резюме

Ленивая загрузка с `React.lazy` и `Suspense` — ключевой инструмент оптимизации производительности React-приложений.

| Правило | Описание |
|---------|---------|
| Объявление на уровне модуля | Никогда не создавай `lazy` внутри компонента |
| `Suspense` обязателен | Каждый `lazy`-компонент должен быть обёрнут в `Suspense` |
| `ErrorBoundary` рядом | Защищай от сетевых ошибок при загрузке чанков |
| Тяжёлые компоненты | Применяй только к компонентам с весомыми зависимостями |
| Route-splitting приоритет | Разбиение по маршрутам даёт наибольший прирост |
| Информативные скелетоны | Fallback должен повторять структуру реального UI |

## Дополнительные ресурсы

- [React.lazy — React Docs](https://react.dev/reference/react/lazy)
- [Suspense — React Docs](https://react.dev/reference/react/Suspense)
- [Code Splitting — Create React App](https://create-react-app.dev/docs/code-splitting/)
- [next/dynamic — Next.js Docs](https://nextjs.org/docs/app/api-reference/functions/lazy)
- [Web Performance — web.dev](https://web.dev/performance/)
