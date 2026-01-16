---
metaTitle: Инициализация проекта на Feature Sliced Design
metaDescription: Подробная разборка шага init в Feature Sliced Design - как корректно инициализировать проект настроить слои модули алиасы линтеры и сборку
author: Олег Марков
title: Инициализация Feature Sliced Design проекта - init
preview: Разберем как правильно запустить новый проект по Feature Sliced Design - какие команды выполнить как организовать структуру слоев и что важно учесть на старте
---

## Введение

Feature-Sliced Design (FSD) помогает выстроить фронтенд‑проект вокруг фич и бизнес‑логики, а не вокруг страниц или технических деталей. Но прежде чем применять подход, проект нужно правильно инициализировать. От шага init зависит, будет ли архитектура жить и развиваться, или превратится в набор случайных папок.

Здесь мы пройдемся по практическим моментам инициализации FSD‑проекта: от выбора инструмента до настройки алиасов, линтеров, тестовой инфраструктуры и первых слоев. Смотрите, я покажу вам, как это работает на примере типичного проекта на React с Vite или Create React App, но подход легко переносится и на другие стеки.

---

## Подход к инициализации FSD проекта

### Что такое init в контексте Feature-Sliced Design

Под init в контексте FSD обычно понимают не одну команду, а целый набор стартовых действий:

- запуск базового фронтенд‑шаблона (Vite, CRA, Next, Remix и т.д.)
- настройка структуры папок под уровни (layers) FSD
- настройка алиасов для слоев
- добавление базовых утилит и конфигураций (ESLint, Prettier, Stylelint, jest/vitest и т.д.)
- создание первых заглушек фич, сущностей, страниц, процессов

То есть init — это момент, когда вы закладываете архитектурный скелет приложения, не трогая еще полноценную бизнес‑логику.

### Почему важно делать init осознанно

Если на старте вы:

- не заведете четкую структуру слоев
- не настроите алиасы и не закрепите правила импорта
- не добавите архитектурные правила в линтер

то очень быстро в проекте появятся «шорткаты» вроде:

```ts
import { SomeComponent } from '../../../../../components';
```

и хаотичные связи между любыми папками. Позже перевести такой проект на FSD будет во много раз сложнее.

---

## Стартовый шаблон проекта

### Выбор инструмента сборки

Чаще всего FSD используют в SPA на:

- Vite + React
- Next.js
- CRA (реже, но все еще встречается)
- Webpack + кастомная сборка

Я покажу вам пример на Vite + React. Принципы будут теми же и для других вариантов.

### Создание базового проекта

Давайте разберемся на примере Vite:

```bash
# Инициализация проекта с Vite и React
npm create vite@latest my-fsd-app -- --template react-ts

cd my-fsd-app

# Установка зависимостей
npm install
```

На этом этапе у вас есть стандартный Vite‑проект с минимальной структурой `src`. Дальше мы будем адаптировать его под FSD.

---

## Базовая структура Feature-Sliced Design

### Классические уровни FSD

В типичном FSD‑проекте уровни (layers) выглядят так:

- app — корневые настройки и композиция (роутинг, провайдеры, глобальная конфигурация)
- processes — длинные, сквозные бизнес‑процессы (онбординг, checkout и т.п.)
- pages — конкретные страницы приложения
- widgets — крупные интерфейсные блоки, собранные из фич и сущностей
- features — самостоятельные пользовательские возможности (логин, фильтр, смена языка)
- entities — бизнес‑сущности доменной области (User, Product, Order)
- shared — переиспользуемые вещи без привязки к домену (UI‑кит, либы, конфиги)

Создадим эту структуру. Теперь вы увидите, как это выглядит в коде.

```bash
mkdir -p src/app
mkdir -p src/processes
mkdir -p src/pages
mkdir -p src/widgets
mkdir -p src/features
mkdir -p src/entities
mkdir -p src/shared
```

Можно добавить еще внутренние подпапки в `shared`:

```bash
mkdir -p src/shared/ui
mkdir -p src/shared/lib
mkdir -p src/shared/config
mkdir -p src/shared/api
```

Комментарии к структуре:

- `shared/ui` — базовые UI‑компоненты и дизайн‑система
- `shared/lib` — вспомогательные функции и хелперы
- `shared/config` — общие конфигурации (например, `config.ts`)
- `shared/api` — общие HTTP‑клиенты, инстансы axios/fetch‑оберток

---

## Инициализация слоя app

### Основная идея слоя app

Слой `app` отвечает за:

- инициализацию роутера
- подключение глобальных провайдеров (store, i18n, theme и т.п.)
- точку входа в приложение (`index.tsx` или аналог)
- базовую композицию основных слоев (pages, widgets и т.д.)

Давайте посмотрим, что происходит в минимальной версии `app`.

### Пример структуры app

Один из удобных вариантов:

```bash
src/app/
  index.tsx        # Точка входа
  App.tsx          # Корневой компонент приложения
  providers/       # Провайдеры контекстов
  routes/          # Конфиг роутера и маршруты
  styles/          # Глобальные стили
```

Теперь давайте перейдем к коду.

#### `src/main.tsx` (точка входа Vite по умолчанию)

```tsx
// Здесь мы подключаем React и корневой компонент приложения
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';

// Здесь мы монтируем приложение в корневой DOM-элемент
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### `src/app/App.tsx`

```tsx
// В этом файле мы собираем базовую композицию приложения
import React from 'react';
import { withProviders } from './providers';
import { AppRouter } from './routes';

// Базовый компонент, в котором размещаются роутер и провайдеры
const AppBase = () => {
  // Здесь можно добавить глобальные layout-компоненты, если они есть
  return <AppRouter />;
};

// Оборачиваем AppBase в цепочку провайдеров
export const App = withProviders(AppBase);
```

#### `src/app/providers/index.tsx`

```tsx
// Здесь мы собираем всех провайдеров в одну функцию высшего порядка
import React, { ComponentType } from 'react';
import { BrowserRouter } from 'react-router-dom';
// Пример - можно добавить Redux Provider, QueryClientProvider и т.п.

// Тип компонента приложения, который мы будем оборачивать
type AppComponent = ComponentType;

// Функция, которая оборачивает переданный компонент всеми провайдерами
export const withProviders = (Component: AppComponent) => () => {
  return (
    // Провайдер роутера
    <BrowserRouter>
      {/* Здесь можно добавить другие провайдеры */}
      <Component />
    </BrowserRouter>
  );
};
```

#### `src/app/routes/index.tsx`

```tsx
// Здесь мы описываем основные маршруты приложения
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';

// Компонент, отвечающий за переключение страниц
export const AppRouter = () => {
  return (
    <Routes>
      {/* Главная страница */}
      <Route path="/" element={<HomePage />} />
      {/* Страница 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
```

Обратите внимание, что в импортах используется алиас `@/pages/home`. Это часть инициализации: сейчас мы настроим алиасы, чтобы вы могли писать такие импорты во всем проекте.

---

## Настройка алиасов под FSD уровни

### Зачем нужны алиасы

Алиасы упрощают:

- навигацию по коду
- рефакторинг структуры
- контроль зависимостей между слоями

Вместо длинных относительных путей вы пишете:

```ts
import { HomePage } from '@/pages/home';
import { userModel } from '@/entities/user';
import { Button } from '@/shared/ui/button';
```

Это наглядно показывает, к какому слою относится модуль, даже не глядя на путь на диске.

### Настройка алиасов в Vite

Откройте `vite.config.ts` и добавьте алиасы. Я покажу вам, как это реализовано на практике.

```ts
// Здесь мы подключаем path для работы с путями
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Экспортируем конфигурацию Vite
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Общий алиас на src
      '@': path.resolve(__dirname, 'src'),
      // Отдельные алиасы по слоям (по желанию)
      '@app': path.resolve(__dirname, 'src/app'),
      '@processes': path.resolve(__dirname, 'src/processes'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
```

Чтобы TypeScript понимал те же пути, нужно настроить `tsconfig.json`.

### Настройка алиасов в TypeScript

Откройте `tsconfig.json` и добавьте раздел `paths`:

```json
{
  "compilerOptions": {
    // Здесь мы включаем поддержку модулей и JSX, если используем React
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@app/*": ["app/*"],
      "@processes/*": ["processes/*"],
      "@pages/*": ["pages/*"],
      "@widgets/*": ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

Комментарий:

- `baseUrl: "src"` говорит TypeScript считать `src` корнем для путей
- `"@/*": ["*"]` позволяет писать `@/path/to/module`
- остальные алиасы привязаны к конкретным слоям

Теперь алиасы будут работать и в среде разработки, и при сборке.

---

## Первые модули в слоях pages и entities

На шаге init полезно сразу создать по одному‑двум примерам страниц и сущностей, чтобы структура проекта стала осязаемой.

### Пример страницы HomePage

Создадим простую страницу `HomePage`:

```bash
mkdir -p src/pages/home
```

#### `src/pages/home/index.ts`

```ts
// Здесь мы реэкспортируем компонент страницы
export { HomePage } from './ui/HomePage';
```

#### `src/pages/home/ui/HomePage.tsx`

```tsx
// Здесь мы описываем компонент конкретной страницы
import React from 'react';
import { Counter } from '@/features/counter';
import { UserCard } from '@/entities/user';
import { Page } from '@/shared/ui/Page';

// Пример простой главной страницы
export const HomePage = () => {
  return (
    <Page>
      {/* Здесь мы используем сущность User и фичу Counter */}
      <UserCard />
      <Counter />
    </Page>
  );
};
```

### Пример сущности User

Теперь создадим простую сущность `User`:

```bash
mkdir -p src/entities/user/ui
mkdir -p src/entities/user/model
```

#### `src/entities/user/index.ts`

```ts
// Главная точка входа в сущность User
export * as userModel from './model';
export * from './ui/UserCard';
```

#### `src/entities/user/model/index.ts`

```ts
// Здесь мы описываем модель данных и бизнес-логику сущности User

// Тип данных пользователя
export type User = {
  id: string;
  name: string;
};

// Временный мок пользователя для примера
const mockUser: User = {
  id: '1',
  name: 'Иван Петров',
};

// Функция для получения текущего пользователя
export const getCurrentUser = (): User => {
  // Здесь вы могли бы вызывать API или доставать данные из store
  return mockUser;
};
```

#### `src/entities/user/ui/UserCard.tsx`

```tsx
// Компонент карточки пользователя
import React from 'react';
import { getCurrentUser } from '../model';

// Простая карточка, отображающая имя пользователя
export const UserCard = () => {
  const user = getCurrentUser(); // Получаем данные сущности

  return (
    <div>
      {/* Здесь мы выводим имя пользователя */}
      <h2>Пользователь</h2>
      <p>{user.name}</p>
    </div>
  );
};
```

Так мы разделяем модель (данные и бизнес‑логику) и UI для сущности.

---

## Пример фичи: Counter

Фичи (features) — это пользовательские возможности. На init‑этапе часто делают демонстрационную фичу‑счетчик, чтобы показать, как фича подключается к странице.

### Структура фичи Counter

```bash
mkdir -p src/features/counter/ui
mkdir -p src/features/counter/model
```

#### `src/features/counter/index.ts`

```ts
// Точка входа фичи Counter
export * from './ui/Counter';
export * as counterModel from './model';
```

#### `src/features/counter/model/index.ts`

```ts
// Пример простой модели счетчика без глобального состояния

// Здесь мы описываем тип состояния счетчика
export type CounterState = {
  value: number;
};

// Функция для получения начального состояния
export const getInitialState = (): CounterState => ({
  value: 0,
});

// Функция-инкремент
export const increment = (state: CounterState): CounterState => ({
  value: state.value + 1,
});

// Функция-декремент
export const decrement = (state: CounterState): CounterState => ({
  value: state.value - 1,
});
```

#### `src/features/counter/ui/Counter.tsx`

```tsx
// Компонент фичи Counter
import React, { useState } from 'react';
import { getInitialState, increment, decrement } from '../model';

// Простой компонент счетчика
export const Counter = () => {
  // Локальное состояние счетчика
  const [state, setState] = useState(getInitialState());

  // Обработчик увеличения
  const handleIncrement = () => {
    setState((prev) => increment(prev));
  };

  // Обработчик уменьшения
  const handleDecrement = () => {
    setState((prev) => decrement(prev));
  };

  return (
    <div>
      {/* Выводим текущее значение */}
      <p>Значение счетчика {state.value}</p>

      {/* Кнопки управления */}
      <button onClick={handleDecrement}>-</button>
      <button onClick={handleIncrement}>+</button>
    </div>
  );
};
```

Как видите, даже простая фича уже разделена на модель и UI, и при необходимости ее легко будет подключить к глобальному состоянию.

---

## Слой shared и базовые UI компоненты

На init‑этапе полезно сразу сформировать минимальный shared‑слой, чтобы не тянуть туда что попало.

### Простейший layout‑компонент Page

Создадим компонент Page, который будем использовать в страницах.

```bash
mkdir -p src/shared/ui/Page
```

#### `src/shared/ui/Page/index.ts`

```ts
// Реэкспорт компонента Page
export { Page } from './Page';
```

#### `src/shared/ui/Page/Page.tsx`

```tsx
// Базовый layout-компонент для страниц
import React, { ReactNode } from 'react';

// Описываем пропсы компонента
type PageProps = {
  children: ReactNode;
};

// Компонент Page задает базовую разметку страницы
export const Page = ({ children }: PageProps) => {
  return (
    <main style={{ padding: '16px' }}>
      {/* Здесь выводится содержимое конкретной страницы */}
      {children}
    </main>
  );
};
```

Со временем здесь можно будет подключить общие хедеры, футеры и т.п., но на init‑этапе этой заготовки достаточно.

---

## Линтер и архитектурные правила

Чтобы FSD‑структура не разрушалась со временем, важно включить архитектурные правила в линтер. Это одна из ключевых задач инициализации.

Смотрите, я покажу вам базовый вариант с ESLint.

### Установка и базовая конфигурация ESLint

Установим необходимые пакеты:

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-import
```

Создадим `.eslintrc.cjs`:

```js
// Конфигурация ESLint для TypeScript-проекта с поддержкой алиасов
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Парсер TypeScript
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    'import/resolver': {
      // Настраиваем импорт по алиасам
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Здесь вы можете включать нужные вам правила
  },
};
```

Этот файл пока не включает конкретные архитектурные ограничения, но создает основу для их добавления.

### Контроль импортов между слоями

Один из способов — использовать `eslint-plugin-boundaries` или собственные запреты по регулярным выражениям. В этой статье я не буду углубляться в сложную конфигурацию, но на init‑этапе полезно хотя бы:

- запретить относительные импорты, которые выходят за пределы текущего слоя
- поощрять использование алиасов

Пример минимального правила:

```js
// В rules .eslintrc.cjs
rules: {
  // Запрещаем импорты с подъемом на несколько уровней вверх
  'no-restricted-imports': [
    'error',
    {
      patterns: ['../*', '../../*', '../../../*'],
    },
  ],
},
```

Комментарий:

- Это простое правило, оно не идеально, но на старте поможет отучиться от глубоких относительных импортов
- В дальнейшем лучше заменить его на более гибкие правила с учетом FSD‑слоев

---

## Тестовая инфраструктура на этапе init

Даже на старте уже стоит подумать о тестах, иначе позже их будет сложнее внедрять в существующую архитектуру.

### Выбор тестового фреймворка

Чаще всего в современных проектах используются:

- Vitest (если используете Vite)
- Jest (классический вариант)
- Testing Library для тестирования React‑компонентов

Покажу пример на Vitest, так как он хорошо интегрируется с Vite.

### Установка Vitest и настройка

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Добавим конфигурацию в `vite.config.ts`:

```ts
// ...
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // другие алиасы
    },
  },
  test: {
    // Указываем окружение для тестирования React-компонентов
    environment: 'jsdom',
    // Пути, по которым vitest будет искать тесты
    globals: true,
    setupFiles: './src/shared/config/tests/setupTests.ts',
  },
});
```

Создадим файл настроек тестов:

```bash
mkdir -p src/shared/config/tests
```

#### `src/shared/config/tests/setupTests.ts`

```ts
// Здесь мы настраиваем окружение для тестов React-компонентов
import '@testing-library/jest-dom';
```

Теперь давайте посмотрим на простой тест для `Counter`.

#### `src/features/counter/ui/Counter.test.tsx`

```tsx
// Тест для компонента Counter
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from './Counter';

test('Counter increments value on button click', () => {
  // Рендерим компонент
  render(<Counter />);

  // Находим кнопки и элемент с текстом
  const incButton = screen.getByText('+');
  const value = screen.getByText(/Значение счетчика/i);

  // Проверяем начальное значение
  expect(value).toHaveTextContent('0');

  // Нажимаем на кнопку увеличения
  fireEvent.click(incButton);

  // Проверяем, что значение стало 1
  expect(value).toHaveTextContent('1');
});
```

Так мы с самого начала связываем архитектуру фич с тестовой инфраструктурой.

---

## Init в существующем проекте

Не всегда вы начинаете новый проект. Часто FSD внедряют в уже живой код. На init‑этапе в таком случае:

1. Создается целевая FSD‑структура в `src`
2. Настраиваются алиасы под новые слои
3. Старый код постепенно переносится:

   - выделяются `shared` утилиты и UI
   - собираются сущности (entities) вокруг доменных типов
   - фичи формируются вокруг пользовательских сценариев
   - страницы (pages) становятся точками входа для роутов

Чтобы минимизировать хаос:

- начните с `app`, `shared`, `pages`
- постепенно выделяйте `entities` и `features`, не трогая все сразу
- используйте временные «мосты», вроде `legacy`‑папки, откуда вы будете по частям вытаскивать модули в новые слои

---

## Типичные ошибки при init FSD и как их избежать

### Смешивание уровней в одной папке

Ошибка: складывать страницы, фичи и сущности вперемешку в `src/components` или `src/modules`.

Как лучше:

- сразу заведите отдельные папки для каждого слоя
- не помещайте в `shared` то, что еще не понятно, куда относится — лучше сначала оставить это рядом с местом использования и только потом обобщить

### Отсутствие четких точек входа в модули

Ошибка: импортировать глубоко вложенные файлы напрямую, вроде:

```ts
import { UserCard } from '@/entities/user/ui/UserCard';
```

Как лучше:

- заводить `index.ts` на уровень сущности/фичи/виджета
- экспортировать наружу только то, что действительно нужно использовать снаружи

Пример:

```ts
// src/entities/user/index.ts
export * from './ui/UserCard';
export * as userModel from './model';
```

И далее:

```ts
import { UserCard, userModel } from '@/entities/user';
```

### Игнорирование линтера и правил импортов

Ошибка: настроить архитектуру, но не закрепить ее в инструментах.

Как лучше:

- добавить хотя бы базовые ограничения на относительные пути
- зафиксировать соглашения по алиасам и точкам входа в README проекта

### Отсутствие документации по структуре

Ошибка: разработчики не понимают, куда класть новый код.

Как лучше:

- в `README` или отдельном `ARCHITECTURE.md` описать:
  - слои проекта
  - примеры размещения сущности, фичи и страницы
  - примеры корректных импортов

---

## Заключение

На этапе инициализации Feature-Sliced Design проекта вы решаете несколько ключевых задач:

- задаете структуру слоев (app, processes, pages, widgets, features, entities, shared)
- настраиваете алиасы и пути для каждого слоя
- создаете первые примеры страниц, сущностей и фич
- включаете линтер и, по возможности, архитектурные ограничения
- подключаете тестовую инфраструктуру

От того, насколько аккуратно выполнен init, зависит, насколько легко вы сможете развивать проект и масштабировать функциональность. Если слои созданы осознанно, а правила использования закреплены в конфигурации и документации, архитектура не будет «расползаться» по мере роста кода.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как организовать barrel файлы index.ts так чтобы не получать циклические зависимости

Не создавайте один общий `index.ts` на весь слой. Делайте точки входа на уровне конкретной сущности или фичи. Внутри сущности не импортируйте через ее же `index.ts`, используйте относительные пути (`./ui/...`, `./model/...`). Циклы чаще всего появляются, когда один barrel тянет другой barrel того же уровня.

### Как поступать с глобальным состоянием при init когда пока не ясно какое хранилище использовать

На старте размещайте логику состояния максимально локально в фичах и сущностях (через `useState`, `useReducer`). Когда станет понятно, что состояние нужно разделить между разными частями приложения, переносите его в выбранное глобальное решение (Redux, Zustand, RTK Query и т.п.) внутри `shared` или `app`, а в фичах и сущностях оставляйте только обертки над этим API.

### Как подключать сторонние библиотеки не нарушая принципы FSD

Старайтесь изолировать внешнюю библиотеку в слое `shared` или в конкретной сущности/фиче. Например, обертку над axios положите в `shared/api`, а не импортируйте axios из каждой фичи напрямую. Тогда при замене библиотеки вы будете менять минимальное количество модулей.

### Можно ли смешивать CSS модули styled components и tailwind в одном FSD проекте

Технически да, но важно определить правила. На init‑этапе зафиксируйте в документации основной способ стилизации. Остальные допускайте только в ограниченных местах (например, только в `shared/ui` или только в новых модулях). Иначе стилизация превратится в хаотичный набор подходов.

### Как поступать с legacy кодом который не укладывается в FSD на этапе init

Создайте папку `src/legacy` и оставьте там старую структуру. Постепенно выносите из нее части в новые слои FSD по мере доработок. Не пытайтесь одним коммитом перекинуть весь проект — это почти всегда приводит к поломкам и сложноотслеживаемым регрессиям. Важно, чтобы новые фичи сразу создавались в FSD‑структуре, а legacy постепенно «усыхал».