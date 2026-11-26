---
metaTitle: "TanStack Router vs React Router: сравнение 2024"
metaDescription: "Подробное сравнение TanStack Router и React Router: типизация, загрузка данных, search-параметры, вложенные маршруты. Что выбрать для проекта."
author: "Антон Ларичев"
title: "TanStack Router против React Router: сравнение"
preview: "Разбираемся в ключевых отличиях TanStack Router и React Router: типобезопасность, работа с данными и поиск по параметрам."
---

## TanStack Router против React Router: сравнение

React Router — фактический стандарт маршрутизации в экосистеме React с 2014 года. TanStack Router появился как ответ на его ограничения: полная типизация, встроенные лоадеры, type-safe search-параметры. Оба решения активно используются в продакшне, но решают задачи по-разному.

Эта статья разбирает конкретные различия с примерами кода, чтобы вы могли осознанно выбрать инструмент под свой проект.

## Установка и базовая настройка

### React Router

```bash
npm install react-router-dom
```

Минимальная конфигурация через компоненты:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';
import { RootLayout } from './layouts/RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'users/:id', element: <UserPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### TanStack Router

```bash
npm install @tanstack/react-router
```

TanStack Router требует создания объектов маршрутов через фабричные функции:

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$id',
  component: UserPage,
});

const routeTree = rootRoute.addChildren([indexRoute, userRoute]);
const router = createRouter({ routeTree });

export function App() {
  return <RouterProvider router={router} />;
}
```

Настройка TanStack Router объёмнее, но каждый маршрут — это типизированная сущность, из которой можно извлекать параметры с автодополнением.

## Типизация

Это главное отличие двух библиотек.

### React Router: типизация через дженерики

React Router предоставляет хуки с обобщённым типом, который нужно указывать вручную:

```tsx
import { useParams } from 'react-router-dom';

function UserPage() {
  // Тип указывается вручную — нет связи с объявлением маршрута
  const { id } = useParams<{ id: string }>();

  return <div>User: {id}</div>;
}
```

Если в объявлении маршрута путь изменится с `/users/:id` на `/users/:userId`, компилятор не предупредит — `id` просто станет `undefined` в рантайме.

### TanStack Router: сквозная типизация

Каждый маршрут знает о своих параметрах, и хук `useParams` возвращает точно типизированный объект:

```tsx
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './rootRoute';

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$id', // $id — соглашение TanStack Router
  component: UserPage,
});

function UserPage() {
  // id: string — тип выведен автоматически из объявления маршрута
  const { id } = userRoute.useParams();

  return <div>User: {id}</div>;
}
```

Типы параметров выводятся из пути маршрута — переименуете `$id` в `$userId`, и TypeScript немедленно укажет на все места, где ожидается старое имя.

## Search-параметры

Обработка query string — область, где разрыв между библиотеками особенно заметен.

### React Router

```tsx
import { useSearchParams } from 'react-router-dom';

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Всё — строки, тип не гарантирован
  const page = Number(searchParams.get('page') ?? '1');
  const sort = searchParams.get('sort') ?? 'asc';

  function goToNextPage() {
    setSearchParams({ page: String(page + 1), sort });
  }

  return (
    <div>
      <p>Page: {page}, Sort: {sort}</p>
      <button onClick={goToNextPage}>Next</button>
    </div>
  );
}
```

Валидация и приведение типов лежат на разработчике. При сложных фильтрах с 10+ параметрами код быстро превращается в набор `searchParams.get()` с ручными преобразованиями.

### TanStack Router

Search-параметры объявляются как схема прямо в маршруте:

```tsx
import { createRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { rootRoute } from './rootRoute';

const productsSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  sort: z.enum(['asc', 'desc']).default('asc'),
  category: z.string().optional(),
});

export const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  validateSearch: productsSearchSchema,
  component: ProductsPage,
});

function ProductsPage() {
  // page: number, sort: 'asc' | 'desc', category: string | undefined
  const { page, sort } = productsRoute.useSearch();

  const navigate = productsRoute.useNavigate();

  function goToNextPage() {
    navigate({
      search: (prev) => ({ ...prev, page: prev.page + 1 }),
    });
  }

  return (
    <div>
      <p>Page: {page}, Sort: {sort}</p>
      <button onClick={goToNextPage}>Next</button>
    </div>
  );
}
```

Search-параметры автоматически парсятся, валидируются через Zod и возвращаются с правильными TypeScript-типами. Попытка передать `page: 'abc'` вместо числа вызовет ошибку валидации.

## Загрузка данных (Loaders)

### React Router

С версии 6.4 React Router поддерживает лоадеры в объявлении маршрута:

```tsx
import { createBrowserRouter, useLoaderData } from 'react-router-dom';

async function userLoader({ params }: { params: { id: string } }) {
  const response = await fetch(`/api/users/${params.id}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
}

const router = createBrowserRouter([
  {
    path: '/users/:id',
    loader: userLoader,
    element: <UserPage />,
  },
]);

function UserPage() {
  // Тип — unknown, нужно явное приведение
  const user = useLoaderData() as User;

  return <div>{user.name}</div>;
}
```

Проблема: `useLoaderData()` возвращает `unknown`. Чтобы получить типизированный результат, нужно либо приводить тип вручную, либо использовать генератор типов из пакета `@react-router/dev` (доступен в React Router v7).

### TanStack Router

```tsx
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './rootRoute';

interface User {
  id: string;
  name: string;
  email: string;
}

export const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$id',
  loader: async ({ params }): Promise<User> => {
    const response = await fetch(`/api/users/${params.id}`);
    if (!response.ok) throw new Error('User not found');
    return response.json();
  },
  component: UserPage,
});

function UserPage() {
  // user: User — тип выведен из возвращаемого типа loader
  const user = userRoute.useLoaderData();

  return <div>{user.name}</div>;
}
```

Тип данных лоадера автоматически становится типом `useLoaderData()`. Изменили интерфейс `User` — TypeScript немедленно покажет несоответствия в компоненте.

## Вложенная маршрутизация

Оба роутера поддерживают вложенные маршруты, но синтаксис различается.

### React Router

```tsx
const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'settings', element: <Settings /> },
      {
        path: 'users',
        element: <UsersLayout />,
        children: [
          { index: true, element: <UsersList /> },
          { path: ':id', element: <UserDetail /> },
        ],
      },
    ],
  },
]);
```

Отображение вложенных маршрутов через `<Outlet />`:

```tsx
import { Outlet } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div>
      <nav>Dashboard Nav</nav>
      <Outlet />
    </div>
  );
}
```

### TanStack Router

```tsx
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardHome,
});

const usersRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/users',
  component: UsersLayout,
});

const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/$id',
  component: UserDetail,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    usersRoute.addChildren([userDetailRoute]),
  ]),
]);
```

Структура дерева маршрутов явная и типизированная. `getParentRoute` создаёт иерархию, из которой TypeScript выводит все доступные параметры для каждого маршрута.

## Навигация

### React Router

```tsx
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();

  function handleClick() {
    // Строка без проверки типов
    navigate('/users/123?tab=posts');
  }

  return (
    <div>
      {/* Путь — обычная строка */}
      <Link to="/users/123">User 123</Link>
      <button onClick={handleClick}>Navigate</button>
    </div>
  );
}
```

### TanStack Router

```tsx
import { Link, useNavigate } from '@tanstack/react-router';

function Navigation() {
  const navigate = useNavigate();

  function handleClick() {
    navigate({
      to: '/users/$id',
      params: { id: '123' },
    });
  }

  return (
    <div>
      {/* Путь и параметры проверяются TypeScript */}
      <Link to="/users/$id" params={{ id: '123' }}>
        User 123
      </Link>
      <button onClick={handleClick}>Navigate</button>
    </div>
  );
}
```

Компонент `Link` и функция `navigate` в TanStack Router типобезопасны: IDE подсказывает доступные пути, а при передаче неизвестного пути или неверных параметров TypeScript выдаёт ошибку компиляции.

## Обработка ошибок

### React Router

```tsx
const router = createBrowserRouter([
  {
    path: '/users/:id',
    loader: userLoader,
    element: <UserPage />,
    errorElement: <UserError />,
  },
]);

import { useRouteError } from 'react-router-dom';

function UserError() {
  const error = useRouteError(); // unknown — нужна проверка типа

  if (error instanceof Error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>Unknown error</div>;
}
```

### TanStack Router

```tsx
export const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$id',
  loader: async ({ params }): Promise<User> => {
    const response = await fetch(`/api/users/${params.id}`);
    if (!response.ok) {
      throw new NotFoundError(`User ${params.id} not found`);
    }
    return response.json();
  },
  errorComponent: UserError,
  component: UserPage,
});

function UserError({ error }: { error: Error }) {
  return <div>Error: {error.message}</div>;
}
```

TanStack Router передаёт `error` напрямую как проп компонента с типом `Error`, что избавляет от `useRouteError()` и ручных проверок типа.

## Итоговое сравнение

| Характеристика | React Router | TanStack Router |
|---|---|---|
| Типизация параметров | Ручная через дженерики | Автоматическая из маршрута |
| Search-параметры | Строки, ручной парсинг | Схема + Zod, type-safe |
| Типизация лоадеров | `unknown` (v6), лучше в v7 | Автоматически из типа лоадера |
| Типобезопасная навигация | Нет | Да |
| Зрелость | 10+ лет, огромное сообщество | Активно развивается с 2022 |
| Размер бандла | ~50 KB (gzip) | ~60 KB (gzip) |
| Файловая маршрутизация | Через `@react-router/dev` | Встроенный генератор |
| Экосистема | Remix, React Router v7 | TanStack Start |
| Кривая входа | Низкая | Средняя |

## Когда использовать React Router

React Router — разумный выбор, если:

- Вы поддерживаете существующий проект с React Router v5/v6 и миграция дорого стоит.
- Команда знакома с библиотекой и хочет минимизировать время на onboarding.
- Проект использует Remix или планирует переход на React Router v7 с серверным рендерингом.
- Маршрутизация простая: несколько страниц, минимум search-параметров, не требующих строгой типизации.

## Когда использовать TanStack Router

TanStack Router предпочтителен, если:

- Проект новый и TypeScript является приоритетом.
- Вы активно работаете со сложными search-параметрами: фильтры, пагинация, сортировка с множеством полей.
- Важна согласованность типов от объявления маршрута до компонента — без ручного `as User`.
- Команда уже использует TanStack Query и хочет единую экосистему (TanStack Router хорошо интегрируется с TanStack Query для управления кешем лоадеров).
- Планируется переход на TanStack Start для SSR.

## Совместное использование с TanStack Query

TanStack Router и TanStack Query отлично дополняют друг друга. Лоадер маршрута инициирует загрузку данных, а Query управляет кешем:

```tsx
import { createRoute } from '@tanstack/react-router';
import { queryClient } from './queryClient';
import { userQueryOptions } from './queries/user';

export const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$id',
  loader: ({ params }) =>
    // Данные предзагружаются в кеш Query до рендера компонента
    queryClient.ensureQueryData(userQueryOptions(params.id)),
  component: UserPage,
});

function UserPage() {
  const { id } = userRoute.useParams();

  // useSuspenseQuery берёт данные из кеша — запрос уже выполнен лоадером
  const { data: user } = useSuspenseQuery(userQueryOptions(id));

  return <div>{user.name}</div>;
}
```

Такой паттерн устраняет водопадные запросы: данные начинают загружаться параллельно с JS-бандлом маршрута, а компонент рендерится сразу с готовыми данными из кеша.

---

Чтобы глубже изучить React и современные подходы к маршрутизации, ознакомьтесь с курсом по React на PurpleSchool: [React — полный курс](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=tanstack-router-vs-react-router).