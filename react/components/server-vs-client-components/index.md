---
metaTitle: "React Server Components vs Client Components — когда использовать"
metaDescription: "Разбираем отличия Server и Client Components в React: когда использовать каждый тип, примеры кода, типичные ошибки и паттерны композиции."
author: "Антон Ларичев"
title: "Server Components vs Client Components: когда использовать"
preview: "Подробный разбор Server и Client Components в React: ключевые отличия, критерии выбора, примеры кода и паттерны композиции."
---

## Введение

React Server Components (RSC) — одно из самых значимых нововведений в экосистеме React за последние годы. Они появились вместе с Next.js App Router и изменили подход к построению приложений: теперь разработчик явно выбирает, какой компонент рендерится на сервере, а какой — на клиенте.

На первый взгляд разделение кажется простым, но на практике возникает масса вопросов: что именно означает «серверный компонент», почему нельзя использовать `useState` в нём, зачем вообще нужен `'use client'` и как правильно комбинировать оба типа. Эта статья даёт системный ответ на все эти вопросы.

## Что такое Server Components

Server Component — это компонент React, который **выполняется исключительно на сервере**. Его код никогда не попадает в JavaScript-бандл, отправляемый браузеру. Сервер рендерит компонент в специальный формат (React Server Component Payload), который затем передаётся клиенту и встраивается в дерево компонентов.

Ключевые характеристики Server Components:

- Нет доступа к браузерным API (`window`, `document`, `localStorage`)
- Нет хуков состояния и эффектов (`useState`, `useEffect`, `useReducer`)
- Нет обработчиков событий (`onClick`, `onChange`)
- Есть прямой доступ к серверным ресурсам: базам данных, файловой системе, переменным окружения
- Импортированные зависимости не увеличивают размер клиентского бандла

В Next.js App Router все компоненты являются серверными **по умолчанию**.

```typescript
// app/users/page.tsx — Server Component по умолчанию
import { db } from '@/lib/database'

interface User {
  id: number
  name: string
  email: string
}

async function UsersPage() {
  // Прямой запрос к базе данных — работает только на сервере
  const users: User[] = await db.query('SELECT id, name, email FROM users')

  return (
    <main>
      <h1>Пользователи</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} — {user.email}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default UsersPage
```

Здесь `db.query` выполняется на сервере, результат сериализуется и отправляется клиенту уже в виде готового HTML. Никаких `fetch`, никакого `useEffect` — просто `async/await` прямо в теле компонента.

## Что такое Client Components

Client Component — компонент, который **может работать в браузере**. Он по-прежнему может рендериться на сервере в рамках SSR (Server-Side Rendering), но его JavaScript-код обязательно включается в клиентский бандл, потому что браузеру нужно уметь его «гидрировать» и обновлять.

Для обозначения Client Component используется директива `'use client'` в самом начале файла:

```typescript
'use client'

import { useState } from 'react'

interface CounterProps {
  initialValue?: number
}

function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>Увеличить</button>
      <button onClick={() => setCount(count - 1)}>Уменьшить</button>
    </div>
  )
}

export default Counter
```

Директива `'use client'` — это **граница** (boundary) между серверным и клиентским кодом. Все компоненты, импортированные из файла с `'use client'`, автоматически становятся частью клиентского дерева.

## Ключевые отличия: сравнительная таблица

| Возможность | Server Component | Client Component |
|---|---|---|n| `useState`, `useReducer` | Нет | Да |
| `useEffect`, `useLayoutEffect` | Нет | Да |
| Обработчики событий | Нет | Да |
| Browser API (`window`, `localStorage`) | Нет | Да |
| `async/await` в теле компонента | Да | Нет |
| Прямой доступ к БД, файловой системе | Да | Нет |
| Переменные среды (без `NEXT_PUBLIC_`) | Да | Нет |
| Влияние на размер JS-бандла | Нет | Да |
| Рефетчинг при навигации | Автоматически | Вручную |

## Когда использовать Server Components

### Получение данных

Сервер-компоненты идеальны для любой загрузки данных. Вместо стандартного паттерна с `useEffect` + `useState` + `fetch` можно написать компонент напрямую:

```typescript
// Старый подход с Client Component
'use client'

import { useState, useEffect } from 'react'

function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Загрузка...</div>
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

```typescript
// Новый подход с Server Component
async function ProductList() {
  const products = await fetch('https://api.example.com/products').then(r => r.json())

  return (
    <ul>
      {products.map((p: { id: number; name: string }) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

Серверный вариант проще, не требует состояния загрузки и не отправляет лишний JS на клиент.

### Работа с конфиденциальными данными

API-ключи, токены, секреты — всё это остаётся на сервере. Переменные окружения без префикса `NEXT_PUBLIC_` недоступны в клиентском коде:

```typescript
// Этот код безопасен — ключ никогда не попадёт в браузер
async function WeatherWidget({ city }: { city: string }) {
  const apiKey = process.env.WEATHER_API_KEY // только серверная переменная

  const data = await fetch(
    `https://api.weather.com/v1/current?city=${city}&key=${apiKey}`
  ).then(r => r.json())

  return <div>{data.temperature}°C в {city}</div>
}
```

### Тяжёлые зависимости

Если компонент использует крупную библиотеку (например, для парсинга markdown, работы с датами или генерации PDF), Server Component не добавит её вес в бандл:

```typescript
import { marked } from 'marked' // тяжёлая библиотека — ~200 КБ

async function ArticleRenderer({ slug }: { slug: string }) {
  const raw = await readFile(`./content/${slug}.md`, 'utf-8')
  const html = marked(raw) // выполняется только на сервере

  return <article dangerouslySetInnerHTML={{ __html: html }} />
}
```

Клиент получит только готовый HTML — `marked` не попадёт в браузерный JS.

### Статический и редко меняющийся контент

Шапка сайта, подвал, навигация, SEO-метаданные — всё, что не требует интерактивности, лучше оставить серверным.

## Когда использовать Client Components

### Интерактивность и обработка событий

Любой компонент с `onClick`, `onChange`, `onSubmit` и другими обработчиками событий должен быть клиентским:

```typescript
'use client'

import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <button type="submit">Найти</button>
    </form>
  )
}

export default SearchBar
```

### Хуки React

Все хуки, работающие с состоянием и жизненным циклом, доступны только в Client Components:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

function NotificationBell() {
  const [count, setCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/notifications/count')
      const data = await res.json()
      setCount(data.unread)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), [])

  return (
    <button onClick={toggleOpen}>
      Уведомления {count > 0 && <span>({count})</span>}
    </button>
  )
}
```

### Браузерные API

`localStorage`, `sessionStorage`, `navigator`, `IntersectionObserver`, `ResizeObserver` — всё это доступно только в браузере:

```typescript
'use client'

import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button onClick={toggle}>
      {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
    </button>
  )
}
```

### Сторонние библиотеки без поддержки RSC

Многие UI-библиотеки (Framer Motion, React Query, Zustand, большинство компонентных библиотек) рассчитаны на клиентский рендеринг. Их нужно оборачивать в Client Components:

```typescript
'use client'

import { motion } from 'framer-motion'

function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard
```

## Паттерн композиции: вставляем клиент внутрь сервера

Самый мощный паттерн при работе с RSC — передача серверных компонентов как `children` в клиентские. Это позволяет добавить интерактивность, не превращая всё дерево в клиентское:

```typescript
// components/Collapsible.tsx — Client Component
'use client'

import { useState } from 'react'

interface CollapsibleProps {
  title: string
  children: React.ReactNode // принимает серверный контент
}

function Collapsible({ title, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {title} {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}

export default Collapsible
```

```typescript
// app/faq/page.tsx — Server Component
import Collapsible from '@/components/Collapsible'

async function FaqPage() {
  const faqs = await db.query('SELECT * FROM faqs ORDER BY order_index')

  return (
    <main>
      {faqs.map((faq) => (
        <Collapsible key={faq.id} title={faq.question}>
          {/* Этот контент — серверный, не попадает в бандл */}
          <p>{faq.answer}</p>
        </Collapsible>
      ))}
    </main>
  )
}
```

Клиентский `Collapsible` управляет состоянием открыт/закрыт, но сам контент (`children`) остаётся серверным — он уже отрендерен сервером и передан как props.

## Типичные ошибки

### Ошибка 1: импорт Server Component из Client Component

Серверный компонент нельзя импортировать напрямую в клиентский — это разрывает серверную границу:

```typescript
// Неправильно
'use client'

import ServerDataTable from './ServerDataTable' // ошибка!

function Dashboard() {
  return <ServerDataTable /> // не сработает как ожидается
}
```

Вместо этого используйте паттерн `children`:

```typescript
// Правильно — передаём серверный компонент как children
// app/dashboard/page.tsx (Server Component)
import DashboardShell from '@/components/DashboardShell' // Client Component
import ServerDataTable from './ServerDataTable' // Server Component

export default function DashboardPage() {
  return (
    <DashboardShell>
      <ServerDataTable />
    </DashboardShell>
  )
}
```

### Ошибка 2: ненужный 'use client' на верхних уровнях

Часто разработчики добавляют `'use client'` в layout или крупные компоненты «на всякий случай». Это переводит всё их поддерево в клиентский режим и уничтожает преимущества RSC.

Правило простое: добавляйте `'use client'` только там, где это реально нужно — и как можно ближе к листьям дерева компонентов.

### Ошибка 3: передача несериализуемых данных через границу

Props, передаваемые из Server Component в Client Component, должны быть сериализуемы (JSON-совместимы). Функции, классы, `Date`, `Map`, `Set` — не передавайте их напрямую:

```typescript
// Неправильно
<ClientButton onClick={someServerFunction} /> // функции не сериализуются

// Правильно — используйте Server Actions
async function handleAction() {
  'use server'
  // логика на сервере
}

<ClientButton action={handleAction} />
```

## Практическое правило выбора

Отвечайте себе на вопросы по порядку:

1. **Нужна ли интерактивность?** (события, хуки, браузерные API) — если да, то Client Component.
2. **Нужен ли доступ к серверным ресурсам?** (БД, файловая система, секреты) — если да, то Server Component.
3. **Компонент чисто отображает данные без интерактивности?** — по умолчанию оставьте Server Component.
4. **Используется ли сторонняя библиотека без поддержки RSC?** — оберните в Client Component-обёртку.

Стремитесь к тому, чтобы клиентские компоненты были небольшими и находились как можно ближе к листьям дерева. Крупные страницы и layout-компоненты, как правило, должны оставаться серверными.

## Итог

Server и Client Components — не конкуренты, а взаимодополняющие инструменты. Server Components берут на себя получение данных, работу с секретами и тяжёлые вычисления, не нагружая браузер лишним JS. Client Components обеспечивают интерактивность там, где она действительно нужна.

Главный принцип: **начинайте с серверного компонента и переходите к клиентскому только когда это необходимо**. Такой подход даёт более быструю загрузку, меньший бандл и лучший SEO из коробки.

Чтобы глубже разобраться с React и современными паттернами разработки, изучите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-server-vs-client-components