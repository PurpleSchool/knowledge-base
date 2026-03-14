---
metaTitle: Микрофронтенды с React - архитектура, Module Federation и практические примеры
metaDescription: Полное руководство по микрофронтендам с React. Module Federation, iframes, Web Components, коммуникация, роутинг, шаринг зависимостей и best practices с примерами кода
author: Олег Марков
title: Микрофронтенды с React (micro-frontends)
preview: Разбираем архитектуру микрофронтендов на React от основ до продакшена. Webpack Module Federation, коммуникация между приложениями, роутинг, шаринг зависимостей и реальные примеры кода
---

## Введение

По мере роста веб-приложений монолитный фронтенд становится всё тяжелее поддерживать: большие команды конфликтуют при слиянии кода, деплой одной фичи требует пересборки всего приложения, а технический долг накапливается в едином репозитории. Микрофронтенды — это архитектурный подход, который переносит принципы микросервисов на уровень пользовательского интерфейса.

В этой статье вы разберёте, что такое микрофронтенды и когда их стоит применять, изучите все основные подходы к реализации, получите детальный пример с Webpack Module Federation и React, узнаете о коммуникации между приложениями, роутинге и шаринге зависимостей, а также познакомитесь с практическими советами и антипаттернами.

## Что такое микрофронтенды и зачем они нужны

Микрофронтенд — это независимо разрабатываемый, тестируемый и деплоируемый участок пользовательского интерфейса. Аналогично тому, как микросервисы разбивают бэкенд на отдельные сервисы, микрофронтенды разбивают фронтенд на отдельные приложения, которые в браузере собираются в единый интерфейс.

### Ключевые принципы

- **Технологическая независимость.** Каждая команда может выбирать свой стек (React, Vue, Angular) внутри своего микрофронтенда, хотя на практике лучше придерживаться единого фреймворка.
- **Изолированные кодовые базы.** Нет общих runtime-зависимостей, каждое приложение компилируется отдельно.
- **Независимый деплой.** Изменение одного микрофронтенда не требует пересборки других.
- **Отдельные команды.** Каждая команда владеет своим продуктовым доменом — от базы данных до UI.

### Когда микрофронтенды оправданы

Микрофронтенды — не серебряная пуля. Они оправданы когда:

- Над проектом работают несколько независимых команд (5+ человек во фронтенде).
- Части приложения развиваются с разными скоростями и имеют разные релизные циклы.
- Необходимо постепенно мигрировать устаревший монолит на новый стек.
- Части приложения переиспользуются в нескольких продуктах.

Для небольших команд (2-4 разработчика) хорошо структурированный монолит проще в поддержке и эффективнее.

## Основные подходы к реализации

### 1. Webpack Module Federation

Наиболее зрелый и мощный подход для React-экосистемы. Позволяет в runtime загружать код из отдельно задеплоенных приложений и шарить зависимости (например, единственный экземпляр React для всех микрофронтендов).

**Плюсы:** Нативная интеграция с экосистемой Webpack, шаринг зависимостей, горячая замена модулей.
**Минусы:** Привязка к Webpack (хотя есть порты для Vite), сложная отладка, требует продуманной версионности.

### 2. iframes

Самый простой способ изоляции — каждый микрофронтенд живёт в отдельном iframe.

```html
<!-- Shell App -->
<iframe src="https://catalog.example.com" id="catalog-frame"></iframe>
<iframe src="https://checkout.example.com" id="checkout-frame"></iframe>
```

**Плюсы:** Полная изоляция CSS и JavaScript, независимость стека.
**Минусы:** Плохой UX (независимая прокрутка, URL не синхронизирован), сложная коммуникация через `postMessage`, проблемы с SEO, производительность.

### 3. Web Components

Каждый микрофронтенд оборачивается в кастомный HTML-элемент.

```javascript
// React-приложение как Web Component
class CatalogApp extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);
    ReactDOM.render(<CatalogRoot />, mountPoint);
  }

  disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this.shadowRoot.firstChild);
  }
}

customElements.define('catalog-app', CatalogApp);
```

```html
<!-- Shell App -->
<catalog-app data-user-id="42"></catalog-app>
```

**Плюсы:** Стандартный браузерный API, изоляция через Shadow DOM, технологически нейтральный контракт.
**Минусы:** Shadow DOM усложняет глобальные стили, React плохо работает с Shadow DOM без workarounds, server-side rendering затруднён.

### 4. NPM-пакеты (Build-time integration)

Каждый микрофронтенд публикуется как npm-пакет и импортируется в shell во время сборки.

```json
{
  "dependencies": {
    "@company/catalog-app": "^2.3.0",
    "@company/checkout-app": "^1.8.0"
  }
}
```

**Плюсы:** Простота, типизация, понятный процесс.
**Минусы:** Нет независимого деплоя — изменение любого пакета требует пересборки shell. Фактически это монорепо, не настоящие микрофронтенды.

### 5. Server-Side Composition (Edge-side Includes)

Сервер или CDN-edge собирает HTML из нескольких источников перед отдачей клиенту.

```nginx
# Nginx SSI
location /page {
  ssi on;
  root /var/www;
}
```

```html
<!-- page.html -->
<div id="header">
  <!--#include virtual="https://header.example.com/fragment" -->
</div>
<div id="catalog">
  <!--#include virtual="https://catalog.example.com/fragment" -->
</div>
```

**Плюсы:** Отличный First Contentful Paint, хороший SEO, нет JavaScript-зависимостей.
**Минусы:** Сложность инфраструктуры, ограниченная интерактивность, зависимость от uptime всех сервисов.

## Webpack Module Federation с React — детальный пример

Module Federation появился в Webpack 5 и де-факто стал стандартом для микрофронтендов в экосистеме React. Рассмотрим архитектуру из трёх приложений:

- **shell** (host) — контейнер, который загружает остальные приложения
- **catalog** (remote) — каталог товаров
- **checkout** (remote) — оформление заказа

### Структура проекта

```
microfrontend-demo/
├── shell/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── bootstrap.tsx
│   │   └── index.ts
│   ├── webpack.config.js
│   └── package.json
├── catalog/
│   ├── src/
│   │   ├── CatalogApp.tsx
│   │   ├── bootstrap.tsx
│   │   └── index.ts
│   ├── webpack.config.js
│   └── package.json
└── checkout/
    ├── src/
    │   ├── CheckoutApp.tsx
    │   ├── bootstrap.tsx
    │   └── index.ts
    ├── webpack.config.js
    └── package.json
```

### Настройка Remote (catalog)

Установите необходимые зависимости:

```bash
npm install react react-dom
npm install --save-dev webpack webpack-cli webpack-dev-server \
  babel-loader @babel/core @babel/preset-react @babel/preset-typescript \
  html-webpack-plugin ts-loader typescript
```

Настройте `webpack.config.js` для микрофронтенда catalog:

```javascript
// catalog/webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    // publicPath важен: браузер использует его для загрузки чанков
    publicPath: 'http://localhost:3001/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    // Для production используйте реальный URL CDN/сервера
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      // Уникальное имя этого микрофронтенда
      name: 'catalog',
      // Имя файла-манифеста, который shell будет загружать
      filename: 'remoteEntry.js',
      // Экспортируемые модули
      exposes: {
        // './CatalogApp' — имя, под которым shell импортирует компонент
        // './src/CatalogApp' — реальный путь к файлу
        './CatalogApp': './src/CatalogApp',
      },
      // Шаринг зависимостей с другими микрофронтендами
      shared: {
        react: {
          // singleton: true гарантирует единственный экземпляр React
          singleton: true,
          // requiredVersion берём из package.json
          requiredVersion: require('./package.json').dependencies.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: require('./package.json').dependencies['react-dom'],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    port: 3001,
    // Важно: разрешить CORS для shell
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};
```

Создайте компонент для экспорта:

```typescript
// catalog/src/CatalogApp.tsx
import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Ноутбук Pro', price: 89990 },
  { id: 2, name: 'Механическая клавиатура', price: 12990 },
  { id: 3, name: 'Монитор 4K', price: 54990 },
];

interface CatalogAppProps {
  // Пропсы для коммуникации с shell
  onAddToCart?: (product: Product) => void;
  userId?: string;
}

const CatalogApp: React.FC<CatalogAppProps> = ({ onAddToCart, userId }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleAddToCart = (product: Product) => {
    setSelectedId(product.id);
    // Передаём событие в shell через пропс
    onAddToCart?.(product);
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px' }}>
      <h2>Каталог товаров {userId && `(пользователь: ${userId})`}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {PRODUCTS.map(product => (
          <div
            key={product.id}
            style={{
              padding: '16px',
              border: selectedId === product.id ? '2px solid green' : '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.price.toLocaleString('ru-RU')} ₽</p>
            <button onClick={() => handleAddToCart(product)}>
              В корзину
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogApp;
```

Важный паттерн — отдельный `bootstrap.tsx`:

```typescript
// catalog/src/bootstrap.tsx
// Этот файл используется только для standalone-запуска catalog
import React from 'react';
import ReactDOM from 'react-dom/client';
import CatalogApp from './CatalogApp';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<CatalogApp />);
```

```typescript
// catalog/src/index.ts
// Динамический импорт bootstrap обязателен для Module Federation!
// Без него возникнет Shared module is not available for eager consumption
import('./bootstrap');
```

### Настройка Host (shell)

```javascript
// shell/webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    publicPath: 'http://localhost:3000/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      // Shell ничего не экспортирует, только потребляет remotes
      remotes: {
        // 'catalog' — имя для import(), должно совпадать с name в catalog/webpack.config.js
        // 'catalog@...' — URL remoteEntry.js
        catalog: 'catalog@http://localhost:3001/remoteEntry.js',
        checkout: 'checkout@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: require('./package.json').dependencies.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: require('./package.json').dependencies['react-dom'],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};
```

Главный компонент shell с ленивой загрузкой:

```typescript
// shell/src/App.tsx
import React, { Suspense, lazy, useState } from 'react';

// Ленивая загрузка микрофронтендов — они будут скачаны только когда потребуются
const CatalogApp = lazy(() => import('catalog/CatalogApp'));
const CheckoutApp = lazy(() => import('checkout/CheckoutApp'));

// TypeScript не знает о remote-модулях — нужны декларации
// Создайте src/declarations.d.ts:
// declare module 'catalog/CatalogApp';
// declare module 'checkout/CheckoutApp';

interface CartItem {
  id: number;
  name: string;
  price: number;
}

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState<'catalog' | 'checkout'>('catalog');

  const handleAddToCart = (product: CartItem) => {
    setCart(prev => {
      // Проверяем, нет ли уже этого товара в корзине
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
  };

  return (
    <div>
      <header style={{ padding: '16px', backgroundColor: '#343a40', color: 'white' }}>
        <h1>Мой Магазин (Shell)</h1>
        <nav>
          <button
            onClick={() => setCurrentPage('catalog')}
            style={{ marginRight: '8px', color: currentPage === 'catalog' ? 'yellow' : 'white' }}
          >
            Каталог
          </button>
          <button
            onClick={() => setCurrentPage('checkout')}
            style={{ color: currentPage === 'checkout' ? 'yellow' : 'white' }}
          >
            Корзина ({cart.length})
          </button>
        </nav>
      </header>

      <main style={{ padding: '20px' }}>
        {/* ErrorBoundary обязателен — если remote упал, остальное должно работать */}
        <Suspense fallback={<div>Загружаем каталог...</div>}>
          {currentPage === 'catalog' && (
            <CatalogApp
              onAddToCart={handleAddToCart}
              userId="user-123"
            />
          )}
        </Suspense>

        <Suspense fallback={<div>Загружаем оформление заказа...</div>}>
          {currentPage === 'checkout' && (
            <CheckoutApp
              cart={cart}
              onRemoveFromCart={(id) => setCart(prev => prev.filter(item => item.id !== id))}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
```

```typescript
// shell/src/declarations.d.ts
// TypeScript декларации для remote-модулей
declare module 'catalog/CatalogApp' {
  import React from 'react';
  interface CatalogAppProps {
    onAddToCart?: (product: { id: number; name: string; price: number }) => void;
    userId?: string;
  }
  const CatalogApp: React.FC<CatalogAppProps>;
  export default CatalogApp;
}

declare module 'checkout/CheckoutApp' {
  import React from 'react';
  interface CheckoutAppProps {
    cart: Array<{ id: number; name: string; price: number }>;
    onRemoveFromCart?: (id: number) => void;
  }
  const CheckoutApp: React.FC<CheckoutAppProps>;
  export default CheckoutApp;
}
```

### Error Boundary для микрофронтендов

Всегда оборачивайте remote-компоненты в Error Boundary — если один микрофронтенд упал, остальные должны продолжать работать:

```typescript
// shell/src/MicroFrontendErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class MicroFrontendErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[MFE Error] ${this.props.name}:`, error, errorInfo);
    // Отправьте ошибку в систему мониторинга (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
          <h3>Микрофронтенд "{this.props.name}" недоступен</h3>
          <p>Пожалуйста, обновите страницу или попробуйте позже.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MicroFrontendErrorBoundary;
```

Используйте его в App:

```typescript
// В App.tsx
<MicroFrontendErrorBoundary name="Каталог">
  <Suspense fallback={<div>Загружаем...</div>}>
    <CatalogApp onAddToCart={handleAddToCart} userId="user-123" />
  </Suspense>
</MicroFrontendErrorBoundary>
```

## Коммуникация между микрофронтендами

Один из самых сложных аспектов микрофронтендов — это передача данных между изолированными приложениями. Существует несколько подходов.

### 1. Props и callbacks (рекомендуется)

Самый простой и типобезопасный способ — shell передаёт данные через пропсы, а микрофронтенды сообщают о событиях через колбэки. Этот подход уже продемонстрирован в примере выше.

```typescript
// Shell передаёт данные и обработчики событий
<CatalogApp
  userId={currentUser.id}
  onAddToCart={handleAddToCart}
  theme={appTheme}
/>
```

**Плюсы:** Типобезопасность, предсказуемость, простота.
**Минусы:** Все данные проходят через shell, иерархия жёсткая.

### 2. Custom Events (Browser Events API)

Микрофронтенды могут общаться через браузерные события, минуя shell:

```typescript
// catalog/src/CatalogApp.tsx — отправка события
const handleAddToCart = (product: Product) => {
  // Отправляем кастомное событие на уровень document
  const event = new CustomEvent('catalog:product-added', {
    detail: { product },
    bubbles: true,
  });
  document.dispatchEvent(event);
};
```

```typescript
// checkout/src/CheckoutApp.tsx — получение события
import { useEffect, useState } from 'react';

const CheckoutApp = () => {
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const handleProductAdded = (event: CustomEvent) => {
      const { product } = event.detail;
      setCart(prev => [...prev, product]);
    };

    document.addEventListener('catalog:product-added', handleProductAdded as EventListener);

    return () => {
      document.removeEventListener('catalog:product-added', handleProductAdded as EventListener);
    };
  }, []);

  return <div>Корзина: {cart.length} товар(ов)</div>;
};
```

**Плюсы:** Микрофронтенды не зависят друг от друга напрямую, слабое связывание.
**Минусы:** Нет типизации из коробки, сложно отлаживать, риск коллизий имён событий.

### 3. Shared State через SharedWorker или localStorage

Для более сложных сценариев можно использовать SharedWorker:

```typescript
// shared/CartWorker.ts (компилируется отдельно)
let cart: any[] = [];

self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'ADD_TO_CART':
      cart = [...cart, payload.product];
      // Уведомляем всех подключённых клиентов
      (self as SharedWorkerGlobalScope).ports.forEach(port => {
        port.postMessage({ type: 'CART_UPDATED', cart });
      });
      break;
    case 'GET_CART':
      event.ports[0]?.postMessage({ type: 'CART_UPDATED', cart });
      break;
  }
};
```

```typescript
// В любом микрофронтенде
const worker = new SharedWorker('/cart-worker.js');
worker.port.start();

// Получение обновлений
worker.port.onmessage = (event) => {
  if (event.data.type === 'CART_UPDATED') {
    setCart(event.data.cart);
  }
};

// Отправка действия
const addToCart = (product: Product) => {
  worker.port.postMessage({ type: 'ADD_TO_CART', payload: { product } });
};
```

### 4. URL как источник правды

Используйте URL как единственный источник состояния для навигационных данных:

```typescript
// Текущий маршрут, фильтры, поиск — в URL
// catalog?category=laptops&brand=apple&page=2
const CatalogApp = () => {
  // Читаем параметры из URL
  const searchParams = new URLSearchParams(window.location.search);
  const category = searchParams.get('category');

  const handleCategoryChange = (newCategory: string) => {
    // Обновляем URL — все заинтересованные могут его читать
    const url = new URL(window.location.href);
    url.searchParams.set('category', newCategory);
    window.history.pushState({}, '', url.toString());
  };
};
```

## Шаринг зависимостей

Без правильного шаринга каждый микрофронтенд включал бы свою копию React (~130KB). Module Federation решает эту проблему через секцию `shared`.

### Стратегии шаринга

```javascript
// webpack.config.js — расширенные настройки shared
new ModuleFederationPlugin({
  shared: {
    react: {
      // Один экземпляр React на всю страницу — обязательно!
      singleton: true,
      // Предупреждение вместо ошибки при несовместимых версиях
      strictVersion: false,
      requiredVersion: '^18.2.0',
      // eager: true — включить в основной чанк, не загружать асинхронно
      // Нужно только для bootstrap — для remotes оставьте false
      eager: false,
    },
    'react-dom': {
      singleton: true,
      strictVersion: false,
      requiredVersion: '^18.2.0',
    },
    // Роутер тоже должен быть singleton
    'react-router-dom': {
      singleton: true,
      requiredVersion: '^6.0.0',
    },
    // Большие библиотеки, которые используются везде
    'date-fns': {
      singleton: false, // Не singleton — разные версии совместимы
      requiredVersion: '^3.0.0',
    },
  },
})
```

### Автоматическое определение shared-зависимостей

Вместо ручного перечисления можно использовать пакет `@module-federation/utilities`:

```javascript
// webpack.config.js
const { shareAll } = require('@module-federation/utilities');

new ModuleFederationPlugin({
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto',
    }),
  },
})
```

Это удобно для больших проектов, но может привести к неожиданным singleton-конфликтам — используйте осторожно.

## Роутинг в micro-frontend архитектуре

Роутинг в микрофронтендах требует чёткого разграничения ответственности.

### Паттерн: Shell управляет верхнеуровневым роутингом

Shell отвечает за маршруты верхнего уровня и загружает соответствующий микрофронтенд. Внутренний роутинг — ответственность микрофронтенда.

```typescript
// shell/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const CatalogApp = lazy(() => import('catalog/CatalogApp'));
const CheckoutApp = lazy(() => import('checkout/CheckoutApp'));
const ProfileApp = lazy(() => import('profile/ProfileApp'));

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Shell маршрутизирует по первому сегменту пути */}
        <Route
          path="/catalog/*"
          element={
            <Suspense fallback={<Loader />}>
              <CatalogApp />
            </Suspense>
          }
        />
        <Route
          path="/checkout/*"
          element={
            <Suspense fallback={<Loader />}>
              <CheckoutApp />
            </Suspense>
          }
        />
        <Route
          path="/profile/*"
          element={
            <Suspense fallback={<Loader />}>
              <ProfileApp />
            </Suspense>
          }
        />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

```typescript
// catalog/src/CatalogApp.tsx — внутренний роутинг
import { Routes, Route, useNavigate } from 'react-router-dom';

const CatalogApp = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Маршруты внутри /catalog/* */}
      <Route index element={<ProductList />} />
      <Route path="product/:id" element={<ProductDetail />} />
      <Route path="search" element={<SearchResults />} />
    </Routes>
  );
};
```

### MemoryRouter для изолированных микрофронтендов

Когда микрофронтенд должен работать как standalone (для разработки и тестирования), используйте условный роутер:

```typescript
// catalog/src/CatalogApp.tsx
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom';

interface CatalogAppProps {
  // Флаг для standalone-режима (разработка/тестирование)
  standalone?: boolean;
  basePath?: string;
}

const CatalogApp: React.FC<CatalogAppProps> = ({ standalone = false, basePath = '/catalog' }) => {
  const Router = standalone ? MemoryRouter : React.Fragment;
  const routerProps = standalone ? { initialEntries: ['/'] } : {};

  // Когда встроен в shell — используем его BrowserRouter
  // Когда standalone — используем собственный MemoryRouter
  if (standalone) {
    return (
      <MemoryRouter>
        <CatalogRoutes />
      </MemoryRouter>
    );
  }

  // В shell роутинг уже предоставлен
  return <CatalogRoutes />;
};

const CatalogRoutes = () => (
  <Routes>
    <Route index element={<ProductList />} />
    <Route path="product/:id" element={<ProductDetail />} />
  </Routes>
);
```

### Синхронизация URL между микрофронтендами

Проблема возникает, когда микрофронтенд меняет URL, а другие микрофронтенды должны об этом знать:

```typescript
// Слушатель изменений URL — шаринг через кастомное событие
const useSyncedNavigation = (callback: (path: string) => void) => {
  useEffect(() => {
    const handlePopState = () => callback(window.location.pathname);

    window.addEventListener('popstate', handlePopState);

    // Патчим history.pushState для перехвата программной навигации
    const originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = (...args) => {
      originalPushState(...args);
      callback(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
    };
  }, [callback]);
};
```

## Module Federation с Vite

Для проектов на Vite используйте плагин `@originjs/vite-plugin-federation`:

```bash
npm install --save-dev @originjs/vite-plugin-federation
```

```typescript
// catalog/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogApp': './src/CatalogApp',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext', // Обязательно для Module Federation в Vite
    minify: false,
  },
});
```

```typescript
// shell/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        catalog: 'http://localhost:5001/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
```

## Плюсы и минусы микрофронтендов

### Плюсы

| Аспект | Преимущество |
|--------|-------------|
| Независимый деплой | Каждая команда деплоит свой микрофронтенд независимо |
| Масштабирование команд | Разные команды работают без конфликтов в коде |
| Технологическая свобода | Каждый микрофронтенд может использовать свой стек |
| Изоляция сбоев | Ошибка в одном MFE не роняет всё приложение |
| Инкрементальная миграция | Монолит можно мигрировать по частям |
| Фокус команды | Команда отвечает за конкретный бизнес-домен |

### Минусы

| Аспект | Проблема |
|--------|----------|
| Сложность инфраструктуры | Нужен CI/CD для каждого MFE, service discovery, мониторинг |
| Дублирование кода | Общий код сложно шарить без монорепо |
| Производительность | Дополнительные HTTP-запросы за remoteEntry.js, риск дублирования бандлов |
| Консистентность UI | Сложнее поддерживать единый дизайн между командами |
| Отладка | Ошибки в runtime сложнее диагностировать |
| Overhead для малых команд | Операционная сложность не окупается для команд до 5 человек |

## Best Practices

### 1. Версионируйте контракты

Определите явные интерфейсы (контракты) для взаимодействия между MFE. Публикуйте их как TypeScript-пакеты:

```typescript
// @company/mfe-contracts (отдельный npm-пакет)
export interface CatalogAppProps {
  userId: string;
  onAddToCart: (product: CartProduct) => void;
  theme?: 'light' | 'dark';
}

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}
```

### 2. Дизайн-система как foundation

Выделите общие UI-компоненты (кнопки, формы, таблицы) в отдельную шаренную библиотеку. Это обеспечит консистентность UX без жёсткой связанности:

```json
{
  "dependencies": {
    "@company/ui-kit": "^3.0.0"
  }
}
```

### 3. Независимая разработка и тестирование

Каждый MFE должен запускаться и тестироваться автономно. Для этого создайте `standalone` режим:

```typescript
// catalog/src/standalone.tsx — только для разработки
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CatalogApp from './CatalogApp';

// Мок данных для standalone-разработки
const mockCallbacks = {
  onAddToCart: (product: any) => console.log('Add to cart:', product),
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <MemoryRouter>
    <CatalogApp {...mockCallbacks} userId="dev-user" />
  </MemoryRouter>
);
```

### 4. Мониторинг и observability

Каждый MFE должен иметь собственный мониторинг с правильным контекстом:

```typescript
// Добавьте MFE-контекст в логи ошибок
const initMonitoring = (mfeName: string) => {
  // Sentry, Datadog, etc.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    beforeSend(event) {
      event.tags = { ...event.tags, microFrontend: mfeName };
      return event;
    },
  });
};
```

### 5. Graceful degradation

Всегда обрабатывайте недоступность remote:

```typescript
// Используйте заглушки если remote недоступен
const loadRemoteComponent = async (componentPath: string) => {
  try {
    return await import(/* webpackChunkName: "remote" */ componentPath);
  } catch (error) {
    console.error(`Failed to load remote: ${componentPath}`, error);
    // Возвращаем заглушку или кешированную версию
    return { default: FallbackComponent };
  }
};
```

### 6. Единая точка конфигурации

Не хардкодьте URL remotes в webpack.config.js. Используйте переменные окружения и runtime-конфигурацию:

```javascript
// webpack.config.js
new ModuleFederationPlugin({
  remotes: {
    catalog: `catalog@${process.env.CATALOG_URL || 'http://localhost:3001'}/remoteEntry.js`,
    checkout: `checkout@${process.env.CHECKOUT_URL || 'http://localhost:3002'}/remoteEntry.js`,
  },
})
```

Для более гибкого подхода используйте runtime configuration:

```typescript
// shell/src/loadRemote.ts
interface RemoteConfig {
  [key: string]: string; // name -> URL
}

// Конфигурацию можно получить с API в runtime
const getRemoteConfig = async (): Promise<RemoteConfig> => {
  const response = await fetch('/api/mfe-config');
  return response.json();
};

// Динамическая загрузка remote
const loadRemote = async (remoteName: string, modulePath: string) => {
  const config = await getRemoteConfig();
  const remoteUrl = config[remoteName];

  // Загружаем remoteEntry.js
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${remoteUrl}/remoteEntry.js`;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Инициализируем контейнер
  const container = (window as any)[remoteName];
  await container.init(__webpack_share_scopes__.default);

  // Получаем нужный модуль
  const factory = await container.get(modulePath);
  return factory();
};
```

## Реальные примеры кода

### Загрузка пользовательских данных в shell и передача в MFE

```typescript
// shell/src/hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading };
};
```

```typescript
// shell/src/App.tsx
const App = () => {
  const { user, loading } = useCurrentUser();

  if (loading) return <GlobalLoader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/catalog/*"
          element={
            <MicroFrontendErrorBoundary name="Каталог">
              <Suspense fallback={<SectionLoader />}>
                {/* Передаём пользовательский контекст в MFE */}
                <CatalogApp
                  userId={user?.id}
                  userRole={user?.role}
                  onAddToCart={handleAddToCart}
                />
              </Suspense>
            </MicroFrontendErrorBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

### Тема и i18n через Context

Шарьте глобальные настройки через React Context, экспортированный из shell:

```typescript
// shell/src/ThemeProvider.tsx — экспортируется как shared-модуль
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'ru' | 'en';

interface AppContextValue {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('ru');

  return (
    <AppContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

```javascript
// shell/webpack.config.js — экспортируем контекст как shared
new ModuleFederationPlugin({
  name: 'shell',
  exposes: {
    // MFE могут импортировать общий контекст из shell
    './AppContext': './src/ThemeProvider',
  },
  remotes: { /* ... */ },
  shared: { /* ... */ },
})
```

```typescript
// catalog/src/CatalogApp.tsx — используем контекст из shell
// import { useAppContext } from 'shell/AppContext'; // Если шарим через MF
// Или используем пропсы — проще и надёжнее:

const CatalogApp: React.FC<CatalogAppProps & { theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => {
  const styles = theme === 'dark'
    ? { background: '#1a1a1a', color: '#fff' }
    : { background: '#fff', color: '#000' };

  return (
    <div style={styles}>
      {/* ... */}
    </div>
  );
};
```

### Пример CI/CD конфигурации (GitHub Actions)

```yaml
# catalog/.github/workflows/deploy.yml
name: Deploy Catalog MFE

on:
  push:
    branches: [main]
    paths:
      - 'catalog/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: catalog/package-lock.json

      - name: Install dependencies
        working-directory: catalog
        run: npm ci

      - name: Build
        working-directory: catalog
        run: npm run build
        env:
          NODE_ENV: production

      - name: Deploy to CDN
        run: aws s3 sync catalog/dist/ s3://my-mfe-bucket/catalog/ --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      # После деплоя catalog — shell обновляется автоматически
      # так как загружает remoteEntry.js в runtime
```

## Инструменты экосистемы

### Module Federation Manager

Для управления несколькими микрофронтендами используйте `@module-federation/dashboard`:

```bash
npm install @module-federation/dashboard-plugin
```

### Nx для монорепо

Если все MFE в одном репозитории (монорепо), Nx предоставляет отличную интеграцию:

```bash
npx create-nx-workspace@latest my-mfe --preset=react
cd my-mfe
nx generate @nx/react:application catalog
nx generate @nx/react:application shell
```

```json
// nx.json — настройка Module Federation
{
  "generators": {
    "@nx/react": {
      "application": {
        "bundler": "webpack"
      }
    }
  }
}
```

### single-spa

Для оркестрации микрофронтендов от разных команд с разными фреймворками используйте [single-spa](https://single-spa.js.org/):

```javascript
// shell/src/index.js — single-spa root config
import { registerApplication, start } from 'single-spa';

registerApplication({
  name: '@company/catalog',
  app: () => System.import('@company/catalog'),
  activeWhen: ['/catalog'],
  customProps: { userId: getCurrentUserId() },
});

registerApplication({
  name: '@company/checkout',
  app: () => System.import('@company/checkout'),
  activeWhen: ['/checkout'],
});

start({ urlRerouteOnly: true });
```

## Заключение

Микрофронтенды — мощный архитектурный паттерн, который позволяет крупным командам работать независимо и деплоить части приложения без координации. Webpack Module Federation сделал реализацию значительно проще, добавив шаринг зависимостей и runtime-интеграцию.

Ключевые выводы:

- **Начинайте с монолита.** Разбивайте на микрофронтенды только когда команда и продукт переросли монолитный подход.
- **Module Federation — текущий стандарт** для React-экосистемы, доступен и для Vite.
- **Паттерн bootstrap.tsx обязателен** — без него возникают ошибки с eager shared modules.
- **Error Boundary + Suspense** — обязательная обёртка для всех remote-компонентов.
- **Пропсы и callbacks** — самый безопасный способ коммуникации, Custom Events — для слабосвязанного взаимодействия.
- **Синглтоны для React и роутера** — без `singleton: true` вы получите несколько экземпляров и баги.
- **Дизайн-система как фундамент** — без неё UI станет несогласованным.
- **CI/CD для каждого MFE независимо** — иначе теряется главное преимущество.
