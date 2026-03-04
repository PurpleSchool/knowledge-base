---
metaTitle: "Code Splitting в React — оптимизация загрузки бандла"
metaDescription: "Полное руководство по Code Splitting: React.lazy, Suspense, динамический импорт, разделение по маршрутам, предзагрузка чанков и анализ бандла (Bundle Analyzer)."
author: "Олег Марков"
title: "Code Splitting в React: как уменьшить бандл и ускорить загрузку приложения"
preview: "Узнайте, как эффективно разделять код на части, загружать компоненты по требованию и не заставлять пользователя качать лишние мегабайты JavaScript. Разбираем паттерны React.lazy, интеграцию с роутингом и секреты предзагрузки."
---

# Code Splitting в React

**Code Splitting** — техника разбиения JavaScript-бандла на несколько более мелких частей (чанков), которые загружаются **по требованию**, а не все сразу при первом открытии страницы. Это ключевой инструмент оптимизации производительности крупных React-приложений.

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Каждая страница — отдельный чанк, загружаемый при переходе
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Загрузка страницы...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## Что такое Code Splitting и зачем он нужен

Без Code Splitting весь JavaScript приложения упаковывается в один файл (`bundle.js`). При этом браузер обязан загрузить и разобрать **весь** код, прежде чем пользователь увидит хоть что-то на экране.

### Проблема монолитного бандла

```
Без Code Splitting:
┌─────────────────────────────────────────────────────┐
│  bundle.js (3.2 MB)                                 │
│  ├── HomePage (10 KB)       ← нужна сразу           │
│  ├── AdminPanel (800 KB)    ← нужна 5% пользователей│
│  ├── ReportsPage (600 KB)   ← только авторизованные │
│  ├── ChartLibrary (400 KB)  ← только на dashboard   │
│  └── ... ещё 20 страниц                             │
└─────────────────────────────────────────────────────┘
Пользователь ждёт всё целиком даже чтобы увидеть главную
```

### Решение с Code Splitting

```
С Code Splitting:
┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐
│ main.js (80 KB) │  │ admin.chunk.js   │  │ reports.chunk │
│ (загружается    │  │ (800 KB)         │  │ (600 KB)      │
│  всегда)        │  │ (только для      │  │ (только при   │
└─────────────────┘  │  администраторов)│  │  переходе)    │
                     └──────────────────┘  └───────────────┘
Пользователь видит страницу быстро, остальное — по необходимости
```

### Когда Code Splitting даёт выигрыш

- Приложение весит **более 200 KB** в сжатом виде
- Есть разделы, которые видит **не каждый** пользователь (админ-панель, страницы с тяжёлыми библиотеками)
- Маршрутизация между несколькими **страницами**
- Использование **тяжёлых npm-пакетов** (chart.js, pdf.js, monaco-editor и т.д.)

## Динамический импорт — основа Code Splitting

В основе любого Code Splitting лежит **динамический импорт** (`import()`). В отличие от статического `import` в начале файла, `import()` возвращает Promise и сообщает сборщику (Webpack, Vite) создать отдельный чанк.

### Статический vs динамический импорт

```ts
// ❌ Статический — всегда попадает в основной бандл
import { heavyFunction } from './heavy-utils';

// ✅ Динамический — создаёт отдельный чанк
const { heavyFunction } = await import('./heavy-utils');
```

### Базовое использование

```ts
// Загружается только при вызове функции
async function loadPDFParser() {
  const { parsePDF } = await import('./pdf-parser');
  return parsePDF;
}

// В обработчике события
button.addEventListener('click', async () => {
  const module = await import('./modal');
  module.openModal();
});
```

### Promise-интерфейс

```ts
import('./heavy-module')
  .then((module) => {
    module.init();
  })
  .catch((error) => {
    console.error('Не удалось загрузить модуль:', error);
  });
```

## React.lazy — Code Splitting для компонентов

`React.lazy` — встроенный API React для динамической загрузки компонентов. Принимает функцию, возвращающую Promise с динамическим `import()`.

### Синтаксис

```tsx
import { lazy, Suspense } from 'react';

// Компонент объявляется на уровне модуля (НЕ внутри другого компонента)
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<p>Загрузка...</p>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Требования к React.lazy

1. **Функция должна возвращать Promise** (динамический `import()`)
2. **Компонент должен быть default export** в исходном файле
3. **Suspense обязателен** как компонент-предок
4. **Объявляется на уровне модуля**, а не внутри функций

```tsx
// ❌ Не работает — статический импорт
const A = lazy(import('./A'));

// ❌ Не работает — объявление внутри компонента (пересоздаётся на каждый ре-рендер)
function Parent() {
  const Child = lazy(() => import('./Child')); // Ошибка!
  return <Suspense fallback={null}><Child /></Suspense>;
}

// ✅ Правильно
const Child = lazy(() => import('./Child'));
function Parent() {
  return <Suspense fallback={null}><Child /></Suspense>;
}
```

### Именованные экспорты

`React.lazy` работает только с default export, но именованные экспорты можно адаптировать:

```tsx
// Component.tsx
export function MyComponent() { /* ... */ }
export function AnotherComponent() { /* ... */ }

// Вариант 1: промежуточный файл-реэкспорт
// MyComponentLazy.ts
export { MyComponent as default } from './Component';

// Вариант 2: обёртка в lazy
const MyComponent = lazy(() =>
  import('./Component').then((module) => ({
    default: module.MyComponent,
  }))
);

// Вариант 3: React 19+ поддерживает именованные экспорты нативно
const MyComponent = lazy(() => import('./Component'), { name: 'MyComponent' });
```

## Suspense — граница ожидания загрузки

`Suspense` «ловит» состояние загрузки ленивых компонентов и показывает `fallback` вместо них. После загрузки автоматически переключается на реальный компонент.

### Базовое использование

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Гранулярность Suspense

Один `Suspense` может обслуживать несколько ленивых компонентов:

```tsx
// Один Suspense на несколько компонентов
<Suspense fallback={<PageSkeleton />}>
  <Header />        {/* lazy */}
  <MainContent />   {/* lazy */}
  <Footer />        {/* lazy */}
</Suspense>

// Или вложенные Suspense для разных частей
<Suspense fallback={<AppShell />}>
  <Header />
  <Suspense fallback={<ContentSkeleton />}>
    <MainContent />
    <Suspense fallback={<SidebarSkeleton />}>
      <Sidebar />
    </Suspense>
  </Suspense>
</Suspense>
```

### Suspense + Error Boundary

`Suspense` не перехватывает ошибки загрузки — для этого нужен `ErrorBoundary`:

```tsx
import { lazy, Suspense, Component } from 'react';

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Ошибка загрузки компонента:', error, info);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const LazyDashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <ErrorBoundary fallback={<div>Не удалось загрузить страницу. <button>Попробовать снова</button></div>}>
      <Suspense fallback={<Spinner />}>
        <LazyDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Route-based Code Splitting

Наиболее распространённый и эффективный подход — разбивать код по маршрутам. Каждая страница загружается только при переходе на неё.

### React Router v6

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Страницы — отдельные чанки
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Общий LoadingFallback
function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <p>Загрузка страницы...</p>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Вложенные маршруты с Code Splitting

```tsx
// AdminPage.tsx — сама является lazy, внутри тоже lazy-разделение
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminReports = lazy(() => import('./AdminReports'));
const AdminSettings = lazy(() => import('./AdminSettings'));

export default function AdminPage() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main>
        <Suspense fallback={<SectionLoader />}>
          <Routes>
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
```

### Data Router (React Router v6.4+)

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
        loader: async () => {
          // Данные загружаются параллельно с компонентом
          return fetch('/api/dashboard-data').then(r => r.json());
        },
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

## Component-level Code Splitting

Помимо маршрутов, можно дробить код на уровне отдельных компонентов — тяжёлых диалогов, редакторов, графиков.

### Условная загрузка (по действию пользователя)

```tsx
import { lazy, Suspense, useState } from 'react';

const RichTextEditor = lazy(() => import('./RichTextEditor'));
const VideoPlayer = lazy(() => import('./VideoPlayer'));

function PostEditor() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        Открыть редактор
      </button>

      {showEditor && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />
        </Suspense>
      )}
    </div>
  );
}
```

### Загрузка тяжёлых библиотек по требованию

```tsx
import { lazy, Suspense, useState } from 'react';

// Recharts весит ~400 KB — грузим только когда нужен
const SalesChart = lazy(() => import('./SalesChart'));

// Monaco Editor весит ~2 MB — только при открытии редактора кода
const CodeEditor = lazy(() =>
  import('./CodeEditor').then(module => ({
    default: module.CodeEditor,
  }))
);

function Analytics() {
  const [tab, setTab] = useState<'table' | 'chart'>('table');

  return (
    <div>
      <TabBar active={tab} onChange={setTab} />

      {tab === 'table' && <DataTable />}

      {tab === 'chart' && (
        <Suspense fallback={<ChartSkeleton />}>
          <SalesChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Загрузка по видимости (Intersection Observer)

```tsx
import { lazy, Suspense, useRef, useEffect, useState } from 'react';

const HeavyWidget = lazy(() => import('./HeavyWidget'));

function LazyOnVisible({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Начать загрузку за 200px до появления
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ minHeight: 200 }} />}
    </div>
  );
}

function Page() {
  return (
    <div>
      <AboveTheFoldContent />

      <LazyOnVisible>
        <Suspense fallback={<WidgetSkeleton />}>
          <HeavyWidget />
        </Suspense>
      </LazyOnVisible>
    </div>
  );
}
```

## Preloading — предзагрузка чанков

Иногда нужно загрузить чанк **заранее** — до того, как пользователь кликнет. Это убирает задержку при переходе.

### Ручной preload

```tsx
import { lazy, Suspense } from 'react';

// Создаём ссылку на import()-промис вне компонента
const preloadDashboard = () => import('./Dashboard');
const Dashboard = lazy(preloadDashboard);

function NavLink() {
  return (
    <a
      href="/dashboard"
      // Предзагружаем при наведении курсора
      onMouseEnter={preloadDashboard}
      // Или при фокусе (доступность)
      onFocus={preloadDashboard}
    >
      Dashboard
    </a>
  );
}
```

### Паттерн с фабрикой

```tsx
function lazyWithPreload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = lazy(factory);
  // Добавляем метод preload к компоненту
  (Component as { preload?: () => Promise<{ default: T }> }).preload = factory;
  return Component as typeof Component & { preload: typeof factory };
}

const Dashboard = lazyWithPreload(() => import('./Dashboard'));
const Settings = lazyWithPreload(() => import('./Settings'));

function Navigation() {
  return (
    <nav>
      <Link
        to="/dashboard"
        onMouseEnter={() => Dashboard.preload()}
      >
        Dashboard
      </Link>
      <Link
        to="/settings"
        onMouseEnter={() => Settings.preload()}
      >
        Настройки
      </Link>
    </nav>
  );
}
```

### Preload после загрузки основного контента

```tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // После загрузки главной страницы начинаем фоновую предзагрузку
    const preloadChunks = async () => {
      // Небольшая задержка чтобы не мешать основной загрузке
      await new Promise(resolve => setTimeout(resolve, 2000));
      import('./Dashboard');
      import('./Settings');
    };

    preloadChunks();
  }, []);

  return <HomePage />;
}
```

## Magic Comments в Webpack

Webpack поддерживает специальные комментарии внутри `import()` для управления поведением чанков.

### Именование чанков

```tsx
// Без комментария — имя генерируется автоматически: 1.chunk.js
const A = lazy(() => import('./ComponentA'));

// С комментарием — читаемое имя: dashboard.chunk.js
const Dashboard = lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './Dashboard')
);

// Группировка нескольких компонентов в один чанк
const AdminUsers = lazy(() =>
  import(/* webpackChunkName: "admin" */ './AdminUsers')
);
const AdminSettings = lazy(() =>
  import(/* webpackChunkName: "admin" */ './AdminSettings')
);
// Оба попадут в admin.chunk.js
```

### Prefetch и Preload

```tsx
// prefetch — загружается в idle-время браузера (низкий приоритет)
const Dashboard = lazy(() =>
  import(/* webpackPrefetch: true */ './Dashboard')
);
// Webpack добавит в HTML: <link rel="prefetch" href="dashboard.chunk.js">

// preload — загружается параллельно с текущим чанком (высокий приоритет)
const CriticalModal = lazy(() =>
  import(/* webpackPreload: true */ './CriticalModal')
);
// Webpack добавит в HTML: <link rel="preload" href="critical-modal.chunk.js">
```

### Магия в Vite

В Vite синтаксис немного другой:

```tsx
// Именование через rollupOptions в vite.config.ts
// В коде используем обычный import()
const Dashboard = lazy(() => import('./Dashboard'));

// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts', 'd3'],
          'vendor-editor': ['@monaco-editor/react'],
          'admin': ['./src/pages/AdminUsers', './src/pages/AdminSettings'],
        }
      }
    }
  }
}
```

## Next.js: dynamic()

Next.js предоставляет собственный API `next/dynamic`, который расширяет `React.lazy` поддержкой SSR-настроек.

### Базовое использование

```tsx
import dynamic from 'next/dynamic';

// ssr: true — компонент рендерится на сервере и клиенте (по умолчанию)
const ChartComponent = dynamic(() => import('./ChartComponent'));

// ssr: false — только на клиенте (для библиотек без SSR-поддержки)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <p>Карта загружается...</p>,
});
```

### Разные варианты использования

```tsx
import dynamic from 'next/dynamic';

// Кастомный лоадер
const HeavyModal = dynamic(() => import('./HeavyModal'), {
  loading: () => <ModalSkeleton />,
});

// Именованный экспорт
const { SpecificComponent } = dynamic(
  () => import('./ComponentLibrary').then(mod => mod.SpecificComponent)
);

// Полное отключение SSR (для browser-only кода)
const BrowserOnlyMap = dynamic(
  () => import('./LeafletMap'),
  { ssr: false }
);

// Страница с несколькими динамическими компонентами
export default function Page() {
  return (
    <main>
      <StaticHeader />
      <HeavyModal />
      <BrowserOnlyMap />
    </main>
  );
}
```

### App Router (React Server Components)

В Next.js App Router большинство компонентов — серверные, поэтому `dynamic()` используется для клиентских компонентов:

```tsx
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

// Клиентский компонент с интерактивным графиком — загружается лениво
const InteractiveChart = dynamic(
  () => import('./InteractiveChart'),
  {
    ssr: false, // Клиентская интерактивность не нужна на сервере
    loading: () => <ChartSkeleton />,
  }
);

// Серверный компонент загружает данные, клиентский — отображает
export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div>
      <ServerDataTable data={data} />
      <InteractiveChart initialData={data.chartData} />
    </div>
  );
}
```

## Анализ бандла

Прежде чем применять Code Splitting, нужно понять, что занимает место в бандле.

### Webpack Bundle Analyzer

```bash
npm install --save-dev webpack-bundle-analyzer

# В package.json
"scripts": {
  "analyze": "ANALYZE=true next build"
}

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});
```

### Vite Bundle Analyzer

```bash
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,        // Открыть автоматически
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ]
};

# Запуск
npm run build  # Откроет stats.html с визуализацией
```

### Source Map Explorer

```bash
npm install --save-dev source-map-explorer

# Сборка с source maps
npm run build

# Анализ
npx source-map-explorer 'build/static/js/*.js'
```

### Что искать при анализе

```
Тревожные признаки:
├── moment.js (300 KB) — можно заменить на date-fns
├── lodash (70 KB) — используй tree-shaking: import get from 'lodash/get'
├── Полная библиотека иконок (500 KB) — импортируй только нужные иконки
├── PDF.js в main bundle — должен загружаться только при открытии PDF
└── Admin-компоненты в main bundle — должны быть отдельным чанком
```

## Паттерны и рецепты

### Централизованный реестр ленивых компонентов

```tsx
// lazy-components.ts — единое место для всех lazy-импортов
import { lazy } from 'react';

export const LazyComponents = {
  // Страницы
  HomePage: lazy(() => import('./pages/HomePage')),
  DashboardPage: lazy(() => import('./pages/DashboardPage')),
  ProfilePage: lazy(() => import('./pages/ProfilePage')),

  // Тяжёлые виджеты
  RichTextEditor: lazy(() => import('./widgets/RichTextEditor')),
  FullCalendar: lazy(() => import('./widgets/FullCalendar')),
  DataGrid: lazy(() => import('./widgets/DataGrid')),

  // Модальные окна
  CreateProjectModal: lazy(() => import('./modals/CreateProjectModal')),
  ExportModal: lazy(() => import('./modals/ExportModal')),
} as const;

// Использование
import { LazyComponents } from './lazy-components';
const { DashboardPage } = LazyComponents;
```

### HOC для добавления Suspense

```tsx
import { lazy, Suspense, ComponentType } from 'react';

function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <Spinner />
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Использование
const LazyDashboard = withSuspense(
  lazy(() => import('./Dashboard')),
  <PageSkeleton />
);

// Теперь не нужно каждый раз писать Suspense
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<LazyDashboard />} />
    </Routes>
  );
}
```

### Кастомный хук для динамической загрузки

```tsx
import { useState, useEffect } from 'react';

type ImportFn<T> = () => Promise<{ default: T }>;

function useLazyImport<T>(importFn: ImportFn<T>, load: boolean) {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!load) return;

    setLoading(true);
    importFn()
      .then(mod => {
        setModule(mod.default);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [load]);

  return { module, loading, error };
}

// Использование
function App() {
  const [showMap, setShowMap] = useState(false);
  const { module: MapComponent, loading } = useLazyImport(
    () => import('./Map'),
    showMap
  );

  return (
    <div>
      <button onClick={() => setShowMap(true)}>Показать карту</button>
      {loading && <Spinner />}
      {MapComponent && <MapComponent />}
    </div>
  );
}
```

## Code Splitting и TypeScript

TypeScript полностью поддерживает динамические импорты — типы сохраняются.

### Типизированный динамический импорт

```tsx
import { lazy, Suspense } from 'react';

// TypeScript автоматически выводит тип из модуля
const Dashboard = lazy(() => import('./Dashboard'));
// Эквивалентно: React.LazyExoticComponent<typeof import('./Dashboard').default>

// Явная типизация при необходимости
interface DashboardProps {
  userId: string;
  role: 'admin' | 'user';
}

const TypedDashboard = lazy<React.FC<DashboardProps>>(
  () => import('./Dashboard')
);
```

### Типизация именованных экспортов

```tsx
// ComponentLibrary.tsx
export function ComponentA({ title }: { title: string }) { /* ... */ }
export function ComponentB({ count }: { count: number }) { /* ... */ }

// Типизированная загрузка
const ComponentA = lazy(() =>
  import('./ComponentLibrary').then(module => ({
    default: module.ComponentA,
  }))
);

// Props выводятся автоматически — TypeScript знает о { title: string }
<Suspense fallback={null}>
  <ComponentA title="Привет" />
</Suspense>
```

## Лучшие практики

### ✅ Что делать

```tsx
// 1. Дробить по маршрутам — всегда эффективно
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// 2. Использовать осмысленные имена чанков
const AdminPanel = lazy(() =>
  import(/* webpackChunkName: "admin" */ './AdminPanel')
);

// 3. Делать informative fallback-UI
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>

// 4. Оборачивать в ErrorBoundary
<ErrorBoundary fallback={<ErrorPage onRetry={reload} />}>
  <Suspense fallback={<Spinner />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>

// 5. Предзагружать при наведении
<Link onMouseEnter={() => import('./Target')}>Перейти</Link>

// 6. Анализировать бандл перед оптимизацией
// Использовать Bundle Analyzer, Source Map Explorer
```

### ❌ Антипаттерны

```tsx
// 1. Объявлять lazy внутри компонента — ошибка!
function Parent() {
  // ❌ Пересоздаётся каждый рендер → вечная загрузка
  const Child = lazy(() => import('./Child'));
  return <Suspense fallback={null}><Child /></Suspense>;
}

// 2. lazy без Suspense — ошибка во время выполнения
function App() {
  // ❌ Будет ошибка: "A React component suspended while rendering..."
  return <LazyDashboard />;
}

// 3. Дробить слишком мелко
// ❌ 20 KB компонент не стоит делать lazy — накладные расходы > выигрыш
const SmallButton = lazy(() => import('./SmallButton'));

// 4. Игнорировать состояние ошибки сети
// ❌ Пользователь видит пустой экран при проблемах с сетью
<Suspense fallback={<Spinner />}>
  <LazyHeavyPage /> {/* Нет ErrorBoundary */}
</Suspense>

// 5. Пытаться lazy всё подряд
// ❌ Компоненты, используемые на всех страницах, не нужно делать lazy
const Header = lazy(() => import('./Header')); // Всегда рендерится
const Footer = lazy(() => import('./Footer')); // Всегда рендерится
```

### Когда НЕ нужен Code Splitting

- Компонент **весит менее 30 KB** и используется часто
- Компонент **всегда отображается** пользователю (header, footer, nav)
- **Небольшое приложение** — накладные расходы превысят выигрыш
- **Внутренний инструмент** с быстрым интернетом у пользователей

## Реальный пример: SaaS-дашборд

```tsx
// app/layout.tsx или App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Основные страницы — свой чанк для каждой
const HomePage = lazy(() =>
  import(/* webpackChunkName: "home" */ './pages/Home')
);
const DashboardPage = lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './pages/Dashboard')
);
const ProjectsPage = lazy(() =>
  import(/* webpackChunkName: "projects" */ './pages/Projects')
);
const ReportsPage = lazy(() =>
  import(/* webpackChunkName: "reports" */ './pages/Reports')
);

// Административный раздел — один чанк для всего admin
const AdminPage = lazy(() =>
  import(/* webpackChunkName: "admin" */ './pages/Admin')
);

// Модальное окно создания — загружается только при действии
const CreateProjectModal = lazy(() =>
  import(/* webpackChunkName: "create-modal" */ './modals/CreateProject')
);

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-page">
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Попробовать снова</button>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
}

export function App() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <AppShell>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects/*" element={<ProjectsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              {user?.role === 'admin' && (
                <Route path="/admin/*" element={<AdminPage />} />
              )}
            </Routes>
          </Suspense>
        </ErrorBoundary>

        {showCreateModal && (
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ModalLoader />}>
              <CreateProjectModal onClose={() => setShowCreateModal(false)} />
            </Suspense>
          </ErrorBoundary>
        )}
      </AppShell>
    </BrowserRouter>
  );
}
```

## Связанные темы

- [Ленивая загрузка компонентов](../lazy-loading/index.md) — React.lazy и Suspense подробно
- [Профилирование производительности](../profiling/index.md) — измерение и оптимизация
- [useMemo для дорогих вычислений](../expensive-calculations/index.md) — мемоизация вычислений
