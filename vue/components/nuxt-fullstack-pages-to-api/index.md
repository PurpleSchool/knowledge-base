---
metaTitle: "Fullstack-приложение на Nuxt: страницы и API"
metaDescription: "Создаём fullstack-приложение на Nuxt 3: файловый роутинг, серверные API-роуты, useFetch, middleware и деплой."
author: "Антон Ларичев"
title: "Fullstack-приложение на Nuxt: от страниц до API"
preview: "Пошаговое руководство по созданию fullstack-приложения на Nuxt 3: страницы, серверные API, получение данных и state."
---

## Что такое Nuxt и зачем он нужен

Nuxt — это фреймворк поверх Vue.js, который превращает фронтенд-инструмент в полноценный fullstack-стек. Он даёт файловый роутинг, серверный рендеринг (SSR), статическую генерацию (SSG) и серверные API-роуты из коробки — всё в одном проекте, без настройки отдельного Express или Fastify.

Главное преимущество: один репозиторий, один `npm run dev`, и у вас работает и клиент, и сервер. Это особенно ценно для небольших продуктов, MVP и внутренних инструментов, где overhead отдельного бэкенда не оправдан.

В этой статье создадим реальное мини-приложение: список задач с хранением в памяти сервера, CRUD через API-роуты и реактивным UI на Vue-компонентах.

## Инициализация проекта

Требования: Node.js 18+.

```bash
npx nuxi@latest init nuxt-todo
cd nuxt-todo
npm install
npm run dev
```

После запуска приложение доступно на `http://localhost:3000`. Структура проекта:

```
nuxt-todo/
├── app.vue          # корневой компонент
├── nuxt.config.ts   # конфигурация фреймворка
├── pages/           # файловый роутинг
├── components/      # переиспользуемые компоненты
├── server/
│   └── api/         # серверные API-роуты
└── composables/     # переиспользуемая логика
```

## Файловый роутинг: страницы без конфигурации

Nuxt генерирует роуты автоматически на основе файловой структуры в папке `pages/`. Каждый файл — это маршрут.

```
pages/
├── index.vue          → /
├── about.vue          → /about
└── tasks/
    ├── index.vue      → /tasks
    └── [id].vue       → /tasks/:id
```

Чтобы роутинг заработал, нужно добавить `<NuxtPage />` в корневой компонент. Обновим `app.vue`:

```vue
<template>
  <div>
    <header>
      <nav>
        <NuxtLink to="/">Главная</NuxtLink>
        <NuxtLink to="/tasks">Задачи</NuxtLink>
      </nav>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>
```

`<NuxtLink>` — это аналог `<RouterLink>` из Vue Router, но с дополнительными оптимизациями: предзагрузкой страниц при наведении и корректной работой с SSR.

Создадим главную страницу `pages/index.vue`:

```vue
<template>
  <div>
    <h1>Todo App на Nuxt</h1>
    <p>Простое fullstack-приложение с серверным API.</p>
    <NuxtLink to="/tasks">Перейти к задачам</NuxtLink>
  </div>
</template>
```

### Динамические роуты

Файл `pages/tasks/[id].vue` создаёт динамический маршрут. Параметр `id` доступен через хук `useRoute()`:

```vue
<script setup lang="ts">
const route = useRoute()
const taskId = computed(() => route.params.id as string)

const { data: task } = await useFetch(`/api/tasks/${taskId.value}`)
</script>

<template>
  <div v-if="task">
    <h2>{{ task.title }}</h2>
    <p>Статус: {{ task.done ? 'Выполнено' : 'В процессе' }}</p>
  </div>
  <div v-else>
    <p>Задача не найдена</p>
  </div>
</template>
```

## Серверные API-роуты

Папка `server/api/` — главная магия Nuxt для fullstack-разработки. Каждый файл здесь становится API-эндпоинтом, который выполняется только на сервере. Никакой секретный код или переменные среды не попадут в браузер.

### Хранилище данных

Для примера используем хранение в памяти сервера. В реальном проекте здесь будет Prisma, Drizzle или любой другой ORM.

Создадим `server/utils/db.ts`:

```typescript
export interface Task {
  id: number
  title: string
  done: boolean
  createdAt: string
}

let tasks: Task[] = [
  { id: 1, title: 'Изучить Nuxt', done: false, createdAt: new Date().toISOString() },
  { id: 2, title: 'Написать API', done: true, createdAt: new Date().toISOString() },
]

let nextId = 3

export function getTasks(): Task[] {
  return tasks
}

export function getTask(id: number): Task | undefined {
  return tasks.find(t => t.id === id)
}

export function createTask(title: string): Task {
  const task: Task = { id: nextId++, title, done: false, createdAt: new Date().toISOString() }
  tasks.push(task)
  return task
}

export function updateTask(id: number, data: Partial<Task>): Task | null {
  const index = tasks.findIndex(t => t.id === id)
  if (index === -1) return null
  tasks[index] = { ...tasks[index], ...data }
  return tasks[index]
}

export function deleteTask(id: number): boolean {
  const before = tasks.length
  tasks = tasks.filter(t => t.id !== id)
  return tasks.length < before
}
```

### GET /api/tasks — список задач

```typescript
// server/api/tasks/index.get.ts
import { getTasks } from '~/server/utils/db'

export default defineEventHandler(() => {
  return getTasks()
})
```

Суффикс `.get.ts` означает, что этот файл обрабатывает только GET-запросы. Nuxt поддерживает все HTTP-методы: `.get.ts`, `.post.ts`, `.put.ts`, `.patch.ts`, `.delete.ts`.

### POST /api/tasks — создание задачи

```typescript
// server/api/tasks/index.post.ts
import { createTask } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ title: string }>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, message: 'Поле title обязательно' })
  }

  const task = createTask(body.title.trim())
  setResponseStatus(event, 201)
  return task
})
```

`readBody()` автоматически парсит JSON из тела запроса. `createError()` возвращает корректный HTTP-ответ с нужным статусом.

### GET /api/tasks/:id — одна задача

```typescript
// server/api/tasks/[id].get.ts
import { getTask } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный id' })
  }

  const task = getTask(id)

  if (!task) {
    throw createError({ statusCode: 404, message: 'Задача не найдена' })
  }

  return task
})
```

### PATCH /api/tasks/:id — обновление

```typescript
// server/api/tasks/[id].patch.ts
import { updateTask } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ title?: string; done?: boolean }>(event)

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный id' })
  }

  const task = updateTask(id, body)

  if (!task) {
    throw createError({ statusCode: 404, message: 'Задача не найдена' })
  }

  return task
})
```

### DELETE /api/tasks/:id — удаление

```typescript
// server/api/tasks/[id].delete.ts
import { deleteTask } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Некорректный id' })
  }

  const deleted = deleteTask(id)

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Задача не найдена' })
  }

  return { success: true }
})
```

## Получение данных на клиенте

Nuxt предоставляет три composable для работы с данными: `useFetch`, `useAsyncData` и `$fetch`.

- **`useFetch`** — основной инструмент. Работает и на сервере (SSR), и на клиенте. Кэширует результат, дедуплицирует запросы.
- **`useAsyncData`** — более гибкий вариант, когда нужна произвольная асинхронная логика, не обязательно HTTP.
- **`$fetch`** — низкоуровневый HTTP-клиент (аналог `fetch`), используется для мутаций.

### Страница со списком задач

```vue
<!-- pages/tasks/index.vue -->
<script setup lang="ts">
import type { Task } from '~/server/utils/db'

const { data: tasks, refresh } = await useFetch<Task[]>('/api/tasks')

const newTitle = ref('')
const isAdding = ref(false)

async function addTask() {
  if (!newTitle.value.trim()) return
  isAdding.value = true

  try {
    await $fetch('/api/tasks', {
      method: 'POST',
      body: { title: newTitle.value },
    })
    newTitle.value = ''
    await refresh()
  } finally {
    isAdding.value = false
  }
}

async function toggleDone(task: Task) {
  await $fetch(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    body: { done: !task.done },
  })
  await refresh()
}

async function removeTask(id: number) {
  await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <h1>Задачи</h1>

    <form @submit.prevent="addTask">
      <input
        v-model="newTitle"
        placeholder="Новая задача..."
        :disabled="isAdding"
      />
      <button type="submit" :disabled="isAdding">Добавить</button>
    </form>

    <ul>
      <li v-for="task in tasks" :key="task.id">
        <span :style="{ textDecoration: task.done ? 'line-through' : 'none' }">
          {{ task.title }}
        </span>
        <button @click="toggleDone(task)">
          {{ task.done ? 'Вернуть' : 'Выполнить' }}
        </button>
        <NuxtLink :to="`/tasks/${task.id}`">Детали</NuxtLink>
        <button @click="removeTask(task.id)">Удалить</button>
      </li>
    </ul>
  </div>
</template>
```

`refresh()` повторно запрашивает данные без перезагрузки страницы. При SSR `useFetch` выполняется на сервере, HTML приходит уже с данными — это важно для SEO и скорости.

## Middleware: защита маршрутов

Nuxt middleware — это функции, которые выполняются перед переходом на страницу. Создадим простой пример защиты роута.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const isLoggedIn = useCookie('auth_token').value

  if (!isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

Подключение middleware к конкретной странице:

```vue
<!-- pages/tasks/index.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>
```

## Composables: переиспользуемая логика

Папка `composables/` автоматически импортируется во всех компонентах и страницах. Вынесем логику работы с задачами:

```typescript
// composables/useTasks.ts
import type { Task } from '~/server/utils/db'

export function useTasks() {
  const { data: tasks, refresh, pending } = useFetch<Task[]>('/api/tasks')

  async function add(title: string) {
    await $fetch('/api/tasks', { method: 'POST', body: { title } })
    await refresh()
  }

  async function toggle(task: Task) {
    await $fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: { done: !task.done },
    })
    await refresh()
  }

  async function remove(id: number) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return { tasks, pending, add, toggle, remove }
}
```

Теперь любой компонент может использовать `const { tasks, add, toggle, remove } = useTasks()` без дублирования кода.

## SEO и мета-теги

Nuxt предоставляет `useHead()` для управления метаданными страницы:

```vue
<script setup lang="ts">
useHead({
  title: 'Список задач | Todo App',
  meta: [
    { name: 'description', content: 'Управляйте своими задачами с помощью Todo App на Nuxt' }
  ]
})
</script>
```

Для динамических страниц (например, детальная страница задачи), мета-теги можно генерировать на основе загруженных данных:

```vue
<script setup lang="ts">
const route = useRoute()
const { data: task } = await useFetch(`/api/tasks/${route.params.id}`)

useHead(() => ({
  title: task.value ? `${task.value.title} | Todo App` : 'Задача не найдена'
}))
</script>
```

## Конфигурация и переменные среды

`nuxt.config.ts` — центральная точка настройки. Переменные среды доступны через `runtimeConfig`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Доступны ТОЛЬКО на сервере
    databaseUrl: process.env.DATABASE_URL,
    secretKey: process.env.SECRET_KEY,
    // Доступны на клиенте и сервере
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '/api',
    }
  }
})
```

Использование в серверном коде:

```typescript
// server/api/tasks/index.get.ts
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  console.log('DB URL:', config.databaseUrl) // только на сервере
  return getTasks()
})
```

В клиентском компоненте:

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
console.log('API base:', config.public.apiBase) // /api
</script>
```

## Итог

Nuxt позволяет строить fullstack-приложения в едином стеке:

- **`pages/`** — файловый роутинг без конфигурации, динамические сегменты через `[param]`
- **`server/api/`** — HTTP-роуты, разделённые по методам суффиксами `.get.ts`, `.post.ts` и т.д.
- **`useFetch`** — получение данных с SSR-поддержкой и автоматическим кэшированием
- **`$fetch`** — HTTP-клиент для мутаций
- **`composables/`** — автоимпортируемая переиспользуемая логика
- **`middleware/`** — хуки навигации для защиты роутов и логирования
- **`runtimeConfig`** — типобезопасные переменные среды с разделением сервер/клиент

Эта архитектура покрывает большинство задач: от прототипа до продакшн-приложения с аутентификацией, базой данных и SEO.

Для глубокого изучения Vue.js и экосистемы вокруг него, включая Nuxt, рекомендуем курс на PurpleSchool: [Курс по Vue.js](https://purpleschool.ru/course/vue?utm_source=knowledgebase&utm_medium=text&utm_campaign=nuxt-fullstack)