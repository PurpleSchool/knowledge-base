---
metaTitle: SWR - библиотека для запросов данных в React
metaDescription: Полное руководство по SWR: useSWR, fetcher, мутации, pagination и стратегия stale-while-revalidate в React приложениях
author: Олег Марков
title: SWR - библиотека для запросов
preview: Изучите SWR для управления серверными данными в React. useSWR, глобальная конфигурация, мутации и стратегия stale-while-revalidate
---

## Введение

Когда вы разрабатываете React-приложение, рано или поздно перед вами встаёт вопрос: как правильно получать данные с сервера? На первый взгляд всё кажется простым — достаточно `useEffect` и `useState`. Но по мере роста приложения возникают проблемы: данные устаревают, пользователь видит неактуальную информацию, приходится вручную управлять состояниями загрузки и ошибок, а дублирующиеся запросы снижают производительность.

**SWR** — это библиотека от команды Vercel, созданная специально для решения этих задач. Название расшифровывается как **stale-while-revalidate** — HTTP стратегия кэширования, описанная в RFC 5861. Суть стратегии: возвращай кэшированные (устаревшие) данные немедленно, а в фоне отправляй запрос для получения актуальных данных и обновляй UI.

В результате пользователь видит данные мгновенно — без задержки, которая была бы при обычном запросе. А когда приходит свежий ответ, интерфейс тихо обновляется. Это создаёт ощущение быстрого и отзывчивого приложения.

В этой статье вы узнаете, как установить и использовать SWR, разберётесь с хуком `useSWR`, научитесь создавать кастомные fetcher-функции, настраивать глобальную конфигурацию, делать мутации, реализовывать пагинацию и бесконечную прокрутку, а также сравните SWR с TanStack Query.

## Установка

Установка SWR максимально проста — библиотека не имеет обязательных зависимостей:

```bash
npm install swr
```

Или с помощью yarn:

```bash
yarn add swr
```

SWR поставляется с TypeScript-типами из коробки — отдельно устанавливать `@types/swr` не нужно.

## Базовое использование useSWR

Центральный хук библиотеки — `useSWR`. Его сигнатура выглядит следующим образом:

```typescript
const { data, error, isLoading, isValidating } = useSWR(key, fetcher, options?)
```

- `key` — уникальный ключ запроса (обычно URL). Если `null` — запрос не будет выполнен.
- `fetcher` — функция, которая принимает `key` и возвращает промис с данными.
- `options` — необязательный объект с настройками.

Возвращаемые значения:
- `data` — результат запроса (или `undefined` пока идёт загрузка).
- `error` — ошибка, если запрос завершился неудачно.
- `isLoading` — `true` если данных ещё нет и идёт загрузка.
- `isValidating` — `true` если идёт ревалидация (данные есть, но запрашиваются новые).

Вот простейший пример получения данных:

```typescript
import useSWR from 'swr'

// Простая fetcher-функция
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface User {
  id: number
  name: string
  email: string
}

function UserProfile({ userId }: { userId: number }) {
  const { data, error, isLoading } = useSWR<User>(
    `/api/users/${userId}`,
    fetcher
  )

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  )
}
```

Обратите внимание: здесь не нужны `useState` и `useEffect` — SWR управляет состоянием за вас.

### Автоматическая дедупликация

Если несколько компонентов используют один и тот же ключ, SWR автоматически дедуплицирует запросы — отправляется только один HTTP-запрос, а все компоненты получают одни и те же данные:

```typescript
// Оба компонента используют один ключ — запрос будет только один
function ComponentA() {
  const { data } = useSWR('/api/user', fetcher)
  return <div>{data?.name}</div>
}

function ComponentB() {
  const { data } = useSWR('/api/user', fetcher)
  return <div>{data?.email}</div>
}
```

Это особенно полезно, когда один и тот же запрос нужен в разных частях дерева компонентов.

## Fetcher функция

Fetcher — это любая асинхронная функция, которая принимает ключ SWR и возвращает данные. SWR не привязан к конкретному HTTP-клиенту, и вы можете использовать любой: `fetch`, `axios`, `ky` и другие.

### Fetcher с нативным fetch

```typescript
const fetcher = async (url: string) => {
  const res = await fetch(url)

  // Важно: fetch не бросает ошибку при статусах 4xx/5xx
  if (!res.ok) {
    const error = new Error('Ошибка при запросе данных')
    // Добавляем дополнительную информацию к ошибке
    ;(error as any).status = res.status
    throw error
  }

  return res.json()
}
```

### Fetcher с axios

```typescript
import axios from 'axios'

const fetcher = (url: string) => axios.get(url).then(res => res.data)
```

### Fetcher с несколькими аргументами

Когда для запроса нужно передать несколько параметров (например, URL и токен авторизации), ключ SWR может быть массивом:

```typescript
const fetcher = async ([url, token]: [string, string]) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

function Profile() {
  const token = useAuthToken()
  const { data } = useSWR(['/api/profile', token], fetcher)

  return <div>{data?.name}</div>
}
```

SWR сравнивает ключи по значению, поэтому при изменении любого элемента массива будет автоматически выполнен новый запрос.

### Глобальный fetcher

Чтобы не передавать fetcher в каждый вызов `useSWR`, его можно задать глобально через `SWRConfig`:

```typescript
import { SWRConfig } from 'swr'

const globalFetcher = (url: string) => fetch(url).then(res => res.json())

function App() {
  return (
    <SWRConfig value={{ fetcher: globalFetcher }}>
      <MyApp />
    </SWRConfig>
  )
}

// Теперь fetcher можно не передавать явно
function UserProfile() {
  const { data } = useSWR('/api/user') // fetcher берётся из контекста
  return <div>{data?.name}</div>
}
```

## Глобальная конфигурация с SWRConfig

`SWRConfig` позволяет задать настройки по умолчанию для всех `useSWR` хуков внутри дерева компонентов. Это удобно для настройки общего поведения без дублирования кода в каждом хуке.

```typescript
import { SWRConfig } from 'swr'

function App() {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        revalidateOnFocus: true,        // ревалидировать при фокусе окна
        revalidateOnReconnect: true,     // ревалидировать при восстановлении сети
        refreshInterval: 0,              // автообновление (0 = отключено)
        dedupingInterval: 2000,          // интервал дедупликации (мс)
        errorRetryCount: 3,              // количество повторных попыток при ошибке
        shouldRetryOnError: true,        // повторять при ошибке
        loadingTimeout: 3000,            // таймаут загрузки (мс)
        onError: (error) => {
          console.error('SWR Error:', error)
        },
        onSuccess: (data, key) => {
          console.log('Успешный запрос:', key, data)
        },
      }}
    >
      <MyApp />
    </SWRConfig>
  )
}
```

### Вложенные конфигурации

`SWRConfig` можно вкладывать — дочерняя конфигурация переопределяет родительскую:

```typescript
function AdminPanel() {
  return (
    // Для этого раздела увеличиваем частоту обновления
    <SWRConfig value={{ refreshInterval: 5000 }}>
      <AdminDashboard />
    </SWRConfig>
  )
}
```

### Доступ к глобальной конфигурации

Если нужно прочитать текущую конфигурацию внутри компонента, используйте хук `useSWRConfig`:

```typescript
import { useSWRConfig } from 'swr'

function MyComponent() {
  const { mutate, cache } = useSWRConfig()

  // mutate — функция для ручного обновления кэша
  // cache — объект кэша
}
```

## Мутации и обновление данных

SWR предоставляет два способа мутаций: **bound mutate** (привязана к конкретному ключу) и **global mutate** (глобальная).

### Bound mutate

Функция `mutate`, возвращаемая из `useSWR`, автоматически привязана к ключу хука:

```typescript
import useSWR from 'swr'

interface Todo {
  id: number
  title: string
  completed: boolean
}

function TodoItem({ id }: { id: number }) {
  const { data, mutate } = useSWR<Todo>(`/api/todos/${id}`, fetcher)

  const toggleTodo = async () => {
    if (!data) return

    // Оптимистичное обновление: сначала обновляем UI
    await mutate(
      { ...data, completed: !data.completed },
      { revalidate: false } // не ревалидируем сразу
    )

    // Затем отправляем запрос на сервер
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !data.completed }),
        headers: { 'Content-Type': 'application/json' },
      })
      // Ревалидируем для синхронизации с сервером
      mutate()
    } catch (error) {
      // При ошибке откатываемся
      mutate(data)
    }
  }

  return (
    <div>
      <span style={{ textDecoration: data?.completed ? 'line-through' : 'none' }}>
        {data?.title}
      </span>
      <button onClick={toggleTodo}>Переключить</button>
    </div>
  )
}
```

### Global mutate

Глобальная `mutate` из `useSWRConfig` позволяет обновить данные для любого ключа из любого места приложения:

```typescript
import { useSWRConfig } from 'swr'

function AddTodo() {
  const { mutate } = useSWRConfig()

  const addTodo = async (title: string) => {
    // Отправляем запрос
    await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
      headers: { 'Content-Type': 'application/json' },
    })

    // Инвалидируем список todos — SWR перезапросит данные
    mutate('/api/todos')
  }

  return (
    <button onClick={() => addTodo('Новая задача')}>
      Добавить задачу
    </button>
  )
}
```

### Оптимистичные обновления через mutate

Паттерн оптимистичного обновления позволяет немедленно обновить UI, не дожидаясь ответа сервера:

```typescript
import useSWR, { mutate } from 'swr'

interface User {
  name: string
  email: string
}

function UserSettings() {
  const { data } = useSWR<User>('/api/user', fetcher)

  const updateName = async (newName: string) => {
    // Оптимистично обновляем данные с отложенной ревалидацией
    await mutate(
      '/api/user',
      async (currentUser: User | undefined) => {
        // Отправляем запрос на сервер
        const updatedUser = await fetch('/api/user', {
          method: 'PUT',
          body: JSON.stringify({ name: newName }),
          headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json())

        return updatedUser
      },
      {
        optimisticData: { ...data!, name: newName }, // немедленно обновляем UI
        rollbackOnError: true,                        // откат при ошибке
        populateCache: true,                          // обновляем кэш
        revalidate: false,                            // не ревалидируем после
      }
    )
  }

  return (
    <div>
      <p>Имя: {data?.name}</p>
      <button onClick={() => updateName('Новое имя')}>
        Обновить имя
      </button>
    </div>
  )
}
```

## Условные запросы (Conditional Fetching)

Иногда запрос нужно выполнять только при определённых условиях. В SWR для этого достаточно передать `null` (или функцию, возвращающую `null`) в качестве ключа — запрос не будет выполнен:

```typescript
function UserProfile({ userId }: { userId: string | null }) {
  // Запрос выполняется только если userId не null
  const { data } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher
  )

  if (!userId) return <div>Войдите в систему</div>
  if (!data) return <div>Загрузка...</div>

  return <div>{data.name}</div>
}
```

### Зависимые запросы

Часто второй запрос зависит от результата первого. SWR позволяет легко реализовать такой паттерн:

```typescript
function UserPosts() {
  // Сначала получаем пользователя
  const { data: user } = useSWR('/api/user', fetcher)

  // Запрос к постам выполнится только после получения user.id
  const { data: posts } = useSWR(
    user ? `/api/posts?userId=${user.id}` : null,
    fetcher
  )

  if (!user) return <div>Загрузка пользователя...</div>
  if (!posts) return <div>Загрузка постов...</div>

  return (
    <ul>
      {posts.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Условный запрос с функцией

Ключ может быть функцией — если она бросает исключение или возвращает `falsy` значение, запрос не выполняется:

```typescript
function ConditionalFetch() {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data } = useSWR(
    () => shouldFetch ? '/api/data' : null,
    fetcher
  )

  return (
    <div>
      <button onClick={() => setShouldFetch(true)}>Загрузить</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

## Pagination и Infinite Loading с useSWRInfinite

Для пагинации и бесконечной прокрутки SWR предоставляет специальный хук `useSWRInfinite`.

### Базовая пагинация

```typescript
import useSWRInfinite from 'swr/infinite'

interface Post {
  id: number
  title: string
  body: string
}

interface PostsPage {
  posts: Post[]
  hasMore: boolean
}

const PAGE_SIZE = 10

function PostList() {
  const { data, error, isLoading, size, setSize } = useSWRInfinite<PostsPage>(
    // Функция-ключ: принимает индекс страницы и данные предыдущей страницы
    (pageIndex, previousPageData) => {
      // Если предыдущая страница пустая или нет следующей — останавливаемся
      if (previousPageData && !previousPageData.hasMore) return null

      return `/api/posts?page=${pageIndex + 1}&limit=${PAGE_SIZE}`
    },
    fetcher
  )

  const posts = data ? data.flatMap(page => page.posts) : []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const hasMore = data ? data[data.length - 1]?.hasMore : false

  if (error) return <div>Ошибка загрузки</div>

  return (
    <div>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={() => setSize(size + 1)}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  )
}
```

### Бесконечная прокрутка с Intersection Observer

Для автоматической загрузки при прокрутке используйте `IntersectionObserver`:

```typescript
import { useRef, useEffect } from 'react'
import useSWRInfinite from 'swr/infinite'

function InfinitePostList() {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data, size, setSize, isValidating } = useSWRInfinite(
    (index) => `/api/posts?page=${index + 1}&limit=10`,
    fetcher
  )

  // Автоматически подгружаем при появлении элемента в viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isValidating) {
          setSize(size + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [size, setSize, isValidating])

  const posts = data ? data.flatMap((page: any) => page.posts) : []

  return (
    <div>
      {posts.map((post: any) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
        </div>
      ))}

      {/* Элемент-триггер для подгрузки */}
      <div ref={loadMoreRef} style={{ height: 20 }}>
        {isValidating && <span>Загрузка...</span>}
      </div>
    </div>
  )
}
```

### Курсорная пагинация

SWR хорошо подходит для API с курсорной пагинацией:

```typescript
interface PostsCursorResponse {
  items: Post[]
  nextCursor: string | null
}

function CursorPaginatedList() {
  const { data, size, setSize } = useSWRInfinite<PostsCursorResponse>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.nextCursor) return null
      if (pageIndex === 0) return '/api/posts?limit=10'
      return `/api/posts?limit=10&cursor=${previousPageData?.nextCursor}`
    },
    fetcher
  )

  const allItems = data ? data.flatMap(page => page.items) : []
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : false

  return (
    <div>
      {allItems.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
      {hasMore && (
        <button onClick={() => setSize(size + 1)}>Загрузить ещё</button>
      )}
    </div>
  )
}
```

## Revalidation: при фокусе и при переподключении

SWR автоматически ревалидирует данные в двух ключевых сценариях. Это одна из наиболее ценных возможностей библиотеки.

### Ревалидация при фокусе окна

Когда пользователь переключается в другое приложение, а потом возвращается на вкладку браузера, SWR автоматически обновляет данные. Это гарантирует, что пользователь всегда видит актуальную информацию.

```typescript
function StockPrice() {
  const { data } = useSWR('/api/stock/AAPL', fetcher, {
    revalidateOnFocus: true,   // включено по умолчанию
    focusThrottleInterval: 5000 // не чаще раза в 5 секунд
  })

  return <div>Цена: ${data?.price}</div>
}
```

Для отключения:

```typescript
const { data } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: false
})
```

### Ревалидация при переподключении к сети

Если пользователь теряет интернет, а потом восстанавливает соединение, SWR автоматически перезапрашивает данные. Это особенно важно для мобильных приложений.

```typescript
function LiveData() {
  const { data } = useSWR('/api/live-data', fetcher, {
    revalidateOnReconnect: true // включено по умолчанию
  })

  return <div>{data?.value}</div>
}
```

### Автоматическое обновление по интервалу

Для данных, которые нужно обновлять регулярно (например, биржевые котировки или статусы задач):

```typescript
function OrderStatus({ orderId }: { orderId: string }) {
  const { data } = useSWR(
    `/api/orders/${orderId}/status`,
    fetcher,
    {
      // Обновляем каждые 3 секунды
      refreshInterval: 3000,
      // Только пока вкладка активна
      refreshWhenHidden: false,
      // Только при наличии сети
      refreshWhenOffline: false,
    }
  )

  return <div>Статус заказа: {data?.status}</div>
}
```

### Ручная ревалидация

Помимо автоматической, можно вызвать ревалидацию вручную:

```typescript
function DataWithRefresh() {
  const { data, mutate } = useSWR('/api/data', fetcher)

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={() => mutate()}>Обновить данные</button>
    </div>
  )
}
```

### Первоначальная загрузка без ревалидации

Если данные уже доступны (например, от SSR), можно передать их как начальные и отключить немедленную ревалидацию:

```typescript
function Page({ serverData }: { serverData: any }) {
  const { data } = useSWR('/api/data', fetcher, {
    fallbackData: serverData,
    revalidateIfStale: false,  // не ревалидировать при наличии кэшированных данных
    revalidateOnMount: false,  // не ревалидировать при монтировании
  })

  return <div>{data?.title}</div>
}
```

## Обработка ошибок

SWR автоматически повторяет запросы при ошибках с экспоненциальной задержкой:

```typescript
function DataWithErrors() {
  const { data, error } = useSWR('/api/data', fetcher, {
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Не повторяем для 404 ошибок
      if (error.status === 404) return

      // Максимум 3 попытки
      if (retryCount >= 3) return

      // Повторяем через 5 секунд
      setTimeout(() => revalidate({ retryCount }), 5000)
    }
  })

  if (error) {
    if (error.status === 404) return <div>Данные не найдены</div>
    return <div>Произошла ошибка. Повторяем...</div>
  }

  return <div>{data?.name}</div>
}
```

### Глобальная обработка ошибок

```typescript
<SWRConfig
  value={{
    onError: (error, key) => {
      if (error.status !== 403 && error.status !== 404) {
        // Отправляем ошибку в систему мониторинга
        reportError(error, { key })
      }
    }
  }}
>
  <App />
</SWRConfig>
```

## Предзагрузка данных (Preloading)

SWR поддерживает предзагрузку данных до того, как компонент смонтируется:

```typescript
import { preload } from 'swr'

// Предзагружаем данные сразу при загрузке модуля
preload('/api/user', fetcher)

function App() {
  return <UserProfile />
}

function UserProfile() {
  // Данные уже в кэше — нет задержки
  const { data } = useSWR('/api/user', fetcher)
  return <div>{data?.name}</div>
}
```

## Интеграция с Next.js (SSR/SSG)

SWR хорошо интегрируется с Next.js, позволяя использовать серверные данные как начальные:

```typescript
// pages/profile.tsx
import { GetServerSideProps } from 'next'
import useSWR, { SWRConfig } from 'swr'

function Profile() {
  // На сервере данные уже в fallback — загрузка мгновенная
  const { data } = useSWR('/api/user', fetcher)
  return <div>{data?.name}</div>
}

export default function Page({ fallback }: { fallback: any }) {
  return (
    <SWRConfig value={{ fallback }}>
      <Profile />
    </SWRConfig>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const user = await fetchUser()
  return {
    props: {
      fallback: {
        '/api/user': user
      }
    }
  }
}
```

## SWR vs React Query — сравнение

Оба инструмента решают схожие задачи, но имеют разные приоритеты. Вот подробное сравнение:

### Размер и зависимости

- **SWR**: ~4 KB gzipped, без зависимостей
- **React Query**: ~13 KB gzipped, без зависимостей

SWR выигрывает по размеру — это важно для проектов, где критична скорость загрузки.

### API и концепции

```typescript
// SWR — минималистичный API
const { data, error, isLoading, mutate } = useSWR('/api/user', fetcher)

// TanStack Query — более явный API с большим количеством опций
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
})
```

TanStack Query требует явного указания `queryKey` и `queryFn`. SWR использует URL как ключ и fetcher-функцию — API проще.

### Мутации

```typescript
// SWR — мутации через mutate
const { mutate } = useSWR('/api/user', fetcher)
await mutate(newData, { revalidate: false })

// TanStack Query — специальный хук useMutation
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }
})
mutation.mutate(newData)
```

TanStack Query предоставляет более богатый API для мутаций: `onMutate`, `onSuccess`, `onError`, `onSettled`.

### DevTools

- **SWR**: нет официальных DevTools
- **TanStack Query**: мощные DevTools из коробки (`@tanstack/react-query-devtools`)

Для отладки сложных приложений TanStack Query имеет явное преимущество.

### Кэширование и инвалидация

```typescript
// TanStack Query — явная инвалидация по тегам
queryClient.invalidateQueries({ queryKey: ['posts'] })
// Инвалидирует все запросы с ключом, начинающимся на 'posts'

// SWR — ревалидация конкретного ключа или по регулярному выражению
mutate('/api/posts')
mutate(key => typeof key === 'string' && key.startsWith('/api/posts'))
```

TanStack Query предоставляет более гибкую систему инвалидации через иерархические ключи.

### Пагинация

```typescript
// SWR useSWRInfinite
const { data, size, setSize } = useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher
)

// TanStack Query useInfiniteQuery
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

TanStack Query имеет более удобный API для курсорной пагинации через `getNextPageParam`.

### Когда выбрать SWR

- Небольшие и средние проекты
- Когда важен минимальный размер бандла
- Когда нужна простота API
- Проекты на Next.js (SWR от той же команды — Vercel)
- Когда большинство операций — это GET-запросы

### Когда выбрать TanStack Query

- Крупные проекты с множеством мутаций
- Когда нужны DevTools для отладки
- Когда важна гибкая система инвалидации кэша
- Проекты с оффлайн-поддержкой
- Когда нужен React Native (TanStack Query поддерживает обе платформы)

### Итоговая таблица

| Характеристика | SWR | TanStack Query |
|---|---|---|
| Размер | ~4 KB | ~13 KB |
| API сложность | Простой | Средний |
| Мутации | Базовые | Расширенные |
| DevTools | Нет | Есть |
| Infinite loading | Есть | Есть |
| Оффлайн поддержка | Базовая | Расширенная |
| TypeScript | Отличный | Отличный |
| React Native | Нет | Да |

## Итог

SWR — это мощная, лаконичная библиотека, которая реализует стратегию stale-while-revalidate для управления серверными данными в React. Её ключевые преимущества:

- **Простота**: минималистичный API, быстрое освоение
- **Производительность**: дедупликация запросов, автоматическое кэширование
- **Надёжность**: автоматическая ревалидация при фокусе и reconnect
- **Гибкость**: поддержка любого HTTP-клиента через fetcher

Если вы ищете лёгкую библиотеку для работы с серверными данными и ваш проект не требует сложной системы мутаций или DevTools — SWR отличный выбор. Для проектов с высокими требованиями к управлению серверным состоянием присмотритесь к TanStack Query.

В обоих случаях вы уйдёте от ручного управления `useEffect` и `useState` к декларативному подходу, где библиотека берёт на себя сложности синхронизации данных с сервером.
