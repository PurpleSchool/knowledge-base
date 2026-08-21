---
metaTitle: "TanStack Router в React — полное руководство"
metaDescription: "Изучите TanStack Router для React: установка, настройка маршрутов, вложенная навигация, поиск параметров и защищённые роуты с примерами кода."
author: "Антон Ларичев"
title: "React с TanStack Router"
preview: "Практическое руководство по TanStack Router: типобезопасная маршрутизация, вложенные роуты, поиск параметров и защита маршрутов в React-приложениях."
---

## Что такое TanStack Router

TanStack Router — это современная библиотека маршрутизации для React с полной поддержкой TypeScript из коробки. В отличие от React Router, она предоставляет 100% типобезопасность: параметры пути, строка запроса, данные загрузчиков — всё проверяется на уровне типов без дополнительных усилий.

Ключевые особенности:
- Полная типобезопасность без ручных аннотаций
- Встроенное кэширование данных загрузчиков (loader)
- Типизированные параметры поиска (search params)
- Поддержка вложенных (nested) маршрутов
- Встроенный devtools для отладки
- Поддержка серверного рендеринга (SSR)

## Установка и начальная настройка

Установите библиотеку:

```bash
npm install @tanstack/react-router
```

Для автоматической генерации типов маршрутов установите плагин для Vite:

```bash
npm install -D @tanstack/router-plugin
```

Настройте `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
})
```

Плагин будет автоматически генерировать файл `src/routeTree.gen.ts` при каждом изменении файлов маршрутов.

## Структура файлов маршрутов

TanStack Router использует файловую систему для определения маршрутов. Создайте директорию `src/routes/`:

```
src/
  routes/
    __root.tsx        # корневой макет
    index.tsx         # маршрут /
    about.tsx         # маршрут /about
    posts/
      index.tsx       # маршрут /posts
      $postId.tsx     # маршрут /posts/:postId
  main.tsx
  routeTree.gen.ts    # генерируется автоматически
```

### Корневой маршрут

Файл `src/routes/__root.tsx` — это обёртка для всего приложения:

```typescript
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <nav>
        <Link to="/" activeProps={{ className: 'active' }}>
          Главная
        </Link>
        <Link to="/about" activeProps={{ className: 'active' }}>
          О нас
        </Link>
        <Link to="/posts" activeProps={{ className: 'active' }}>
          Посты
        </Link>
      </nav>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

`<Outlet />` — место, куда рендерятся дочерние маршруты.

### Основные маршруты

Файл `src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ 
  component: HomePage,
})

function HomePage() {
  return <h1>Добро пожаловать</h1>
}
```

Файл `src/routes/about.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <h1>О нас</h1>
}
```

## Инициализация роутера

Файл `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

Объявление модуля `Register` даёт TypeScript знание о конкретном экземпляре роутера — это активирует полную типобезопасность по всему приложению.

## Динамические параметры пути

Файл с символом `$` в имени становится динамическим маршрутом. Файл `src/routes/posts/$postId.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const response = await fetch(`https://api.example.com/posts/${params.postId}`)
    if (!response.ok) throw new Error('Пост не найден')
    return response.json()
  },
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()
  const { postId } = Route.useParams()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>ID: {postId}</p>
      <p>{post.body}</p>
    </article>
  )
}
```

`params.postId` здесь имеет тип `string` — TypeScript автоматически выводит его из имени файла `$postId.tsx`.

## Типизированные параметры поиска

Одна из мощнейших возможностей TanStack Router — типизированная строка запроса. Обычные библиотеки работают с `URLSearchParams` вручную, здесь же всё проверяется компилятором.

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().default(1),
  filter: z.string().optional(),
  sort: z.enum(['asc', 'desc']).default('asc'),
})

export const Route = createFileRoute('/posts/')({  
  validateSearch: searchSchema,
  component: PostsPage,
})

function PostsPage() {
  const { page, filter, sort } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div>
      <p>Страница: {page} | Сортировка: {sort}</p>
      <button
        onClick={() => navigate({ search: { page: page + 1, sort } })
      }>
        Следующая страница
      </button>
      <input
        value={filter ?? ''}
        onChange={(e) =>
          navigate({ search: { page: 1, sort, filter: e.target.value } })
        }
        placeholder="Поиск..."
      />
    </div>
  )
}
```

Параметр `page` всегда будет `number`, `filter` — `string | undefined`, а `sort` — только `'asc'` или `'desc'`. Любое несоответствие вызовет ошибку TypeScript ещё до запуска кода.

## Загрузчики данных (Loaders)

Loader — функция, которая выполняется перед рендером компонента. Данные из неё доступны через `Route.useLoaderData()` без дополнительных состояний или `useEffect`.

```typescript
import { createFileRoute } from '@tanstack/react-router'

interface Post {
  id: number
  title: string
  body: string
}

export const Route = createFileRoute('/posts/')({ 
  loader: async (): Promise<Post[]> => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')
    return response.json()
  },
  component: PostsListPage,
  pendingComponent: () => <div>Загрузка постов...</div>,
  errorComponent: ({ error }) => <div>Ошибка: {error.message}</div>,
})

function PostsListPage() {
  const posts = Route.useLoaderData()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link to="/posts/$postId" params={{ postId: String(post.id) }}>
            {post.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

`pendingComponent` отображается пока данные загружаются, `errorComponent` — при ошибке. Роутер сам управляет этими состояниями.

## Программная навигация

Для навигации из кода используйте хук `useNavigate`:

```typescript
import { useNavigate } from '@tanstack/react-router'

function LoginForm() {
  const navigate = useNavigate()

  const handleSubmit = async (credentials: Credentials) => {
    await login(credentials)
    navigate({ to: '/dashboard', replace: true })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

Парамтр `to` полностью типизирован — автодополнение подскажет все доступные маршруты.

## Защищённые маршруты

Для защиты маршрутов используйте `beforeLoad` — функцию, которая выполняется перед загрузкой маршрута:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthSession } from '../lib/auth'

export const Route = createFileRoute('/dashboard')({ 
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
    return { session }
  },
  loader: async ({ context }) => {
    const { session } = context
    return fetchDashboardData(session.userId)
  },
  component: DashboardPage,
})
```

Данные, возвращённые из `beforeLoad`, попадают в `context` и доступны в `loader` и компоненте.

### Общий контекст аутентификации через корневой маршрут

Чтобы не повторять проверку в каждом маршруте, вынесите её в `__root.tsx`:

```typescript
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})
```

Передайте контекст при создании роутера в `main.tsx`:

```typescript
const auth = useAuth()

const router = createRouter({
  routeTree,
  context: { auth },
})
```

Теперь в любом `beforeLoad` или `loader` будет доступен `context.auth`.

## Компонент Link и активные стили

```typescript
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <nav>
      <Link
        to="/posts/$postId"
        params={{ postId: '42' }}
        search={{ page: 1, sort: 'desc' }}
        activeProps={{ className: 'nav-link--active' }}
        inactiveProps={{ className: 'nav-link' }}
      >
        Пост #42
      </Link>
    </nav>
  )
}
```

`activeProps` применяются, когда текущий URL совпадает с маршрутом ссылки. Все параметры (`params`, `search`) проверяются TypeScript на корректность.

## Вложенные маршруты и макеты

Вложенность создаётся через директории. Файл `src/routes/dashboard.tsx` будет родителем для всего внутри `src/routes/dashboard/`:

```typescript
// src/routes/dashboard.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <div className="dashboard-layout">
      <aside>
        <Link to="/dashboard/profile">Профиль</Link>
        <Link to="/dashboard/settings">Настройки</Link>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  ),
})
```

```typescript
// src/routes/dashboard/profile.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/profile')({
  component: () => <h1>Профиль пользователя</h1>,
})
```

Компонент `dashboard.tsx` будет обёрткой — боковая панель останется при переходах между `/dashboard/profile` и `/dashboard/settings`.

## Devtools

Установите devtools для отладки:

```bash
npm install -D @tanstack/router-devtools
```

Добавьте в корневой маршрут:

```typescript
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
```

Devtools показывают текущее дерево маршрутов, параметры, состояние загрузчиков и историю навигации.

## Сравнение с React Router

| Функция | TanStack Router | React Router v6 |
|---|---|---|
| Типобезопасность параметров | Полная | Ручные аннотации |
| Типизированный search | Встроен | Ручная работа |
| Встроенные загрузчики | Да | Да (v6.4+) |
| Файловая маршрутизация | Да | Нет |
| Размер бандла | ~13 KB | ~15 KB |
| Кэширование данных | Встроено | Нет |

TanStack Router особенно выигрывает в проектах на TypeScript, где типобезопасность навигации критична — например, в приложениях с большим количеством маршрутов и сложными параметрами.

## Итог

TanStack Router предлагает принципиально другой уровень комфорта для разработчиков на TypeScript. Типобезопасные параметры пути и строки запроса, встроенные загрузчики с состояниями загрузки и ошибок, декларативная защита маршрутов через `beforeLoad` — всё это делает маршрутизацию надёжной частью архитектуры, а не источником runtime-ошибок.

Чтобы глубже освоить экосистему React — от базовых концепций до продвинутых паттернов — посмотрите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=tanstack-router
