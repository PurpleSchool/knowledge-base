---
metaTitle: "useSearchParams и usePathname в Next.js App Router"
metaDescription: "Как использовать хуки useSearchParams и usePathname в Next.js App Router: чтение URL, query-параметры, Suspense и практические примеры."
author: "Антон Ларичев"
title: "useSearchParams и usePathname в Next.js App Router"
preview: "Разбираем хуки useSearchParams и usePathname для работы с URL в клиентских компонентах Next.js App Router."
---

## Введение

App Router в Next.js предоставляет два специализированных хука для работы с текущим URL в клиентских компонентах: `usePathname` для чтения пути и `useSearchParams` для чтения строки запроса. Оба хука работают **только в Client Components** — это не ограничение, а намеренное архитектурное решение, обеспечивающее консистентность данных при навигации.

В этой статье разберём оба хука по отдельности, а затем рассмотрим практические сценарии их совместного использования.

## usePathname

### Что возвращает хук

`usePathname` возвращает строку — текущий путь URL без строки запроса и хэша.

| URL | Возвращаемое значение |
|---|---|
| `/` | `'/'` |
| `/dashboard` | `'/dashboard'` |
| `/dashboard?v=2` | `'/dashboard'` |
| `/blog/hello-world` | `'/blog/hello-world'` |

### Базовое использование

```typescript
'use client'

import { usePathname } from 'next/navigation'

export default function CurrentPath() {
  const pathname = usePathname()
  return <p>Текущий путь: {pathname}</p>
}
```

### Практический пример: активная ссылка в навигации

Самый распространённый сценарий — подсветка активного пункта меню.

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/dashboard', label: 'Дашборд' },
  { href: '/settings', label: 'Настройки' },
]

export default function NavMenu() {
  const pathname = usePathname()

  return (
    <nav>
      {navLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? 'font-bold text-blue-600' : 'text-gray-700'}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

Для вложенных маршрутов удобнее проверять начало пути:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link'}
    >
      {children}
    </Link>
  )
}
```

### Реакция на смену маршрута

`usePathname` автоматически вызывает ре-рендер компонента при изменении пути, поэтому его удобно использовать в `useEffect` для отслеживания навигации — например, для аналитики.

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Отправляем событие просмотра страницы в аналитику
    analytics.page(pathname)
  }, [pathname])

  return null
}
```

## useSearchParams

### Что возвращает хук

`useSearchParams` возвращает объект, реализующий интерфейс [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), — но в режиме **только для чтения**. Изменять параметры через этот объект нельзя.

```typescript
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()

  // URL: /products?search=ноутбук
  const search = searchParams.get('search') // 'ноутбук'

  return <p>Поиск: {search}</p>
}
```

### Методы URLSearchParams

Объект `searchParams` предоставляет все стандартные методы для чтения:

**`get(name)`** — возвращает первое значение параметра или `null`:

```typescript
// URL: /shop?category=electronics
const category = searchParams.get('category') // 'electronics'
const brand = searchParams.get('brand')       // null
```

**`getAll(name)`** — возвращает все значения параметра (для повторяющихся ключей):

```typescript
// URL: /shop?tag=sale&tag=new&tag=popular
const tags = searchParams.getAll('tag') // ['sale', 'new', 'popular']
```

**`has(name)`** — проверяет наличие параметра:

```typescript
// URL: /dashboard?debug
const isDebug = searchParams.has('debug') // true
```

**`keys()`, `values()`, `entries()`** — итерация по параметрам:

```typescript
for (const [key, value] of searchParams.entries()) {
  console.log(`${key}: ${value}`)
}
```

**`toString()`** — строковое представление параметров:

```typescript
// URL: /shop?category=books&sort=price
const queryString = searchParams.toString() // 'category=books&sort=price'
```

### Suspense и пре-рендеринг

Это самая важная особенность `useSearchParams`, которую легко пропустить.

Когда маршрут **статически пре-рендерится** (что является поведением по умолчанию в App Router), компонент, использующий `useSearchParams`, приостанавливает рендеринг дерева вплоть до ближайшей границы `<Suspense>`. Это позволяет остальной части страницы пре-рендериться и отправиться в виде начального HTML, пока динамическая часть рендерится на клиенте.

**Без Suspense при production-сборке — ошибка:**

```typescript
// Неправильно — упадёт при сборке для статических маршрутов
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  return <div>Результаты для: {query}</div>
}
```

**Правильно — изолируем компонент в Suspense:**

```typescript
// app/search/search-results.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  return <div>Результаты для: {query}</div>
}
```

```typescript
// app/search/page.tsx
import { Suspense } from 'react'
import SearchResults from './search-results'

function SearchResultsSkeleton() {
  return <div className="skeleton" aria-label="Загрузка..." />
}

export default function SearchPage() {
  return (
    <main>
      <h1>Поиск</h1>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </main>
  )
}
```

В режиме разработки `Suspense` не обязателен — страница работает без ошибок. Ошибка проявляется только при `next build` для статических маршрутов.

### useSearchParams vs searchParams prop в Server Components

Если нужно читать параметры поиска в серверном компоненте, используйте проп `searchParams` страницы — не хук:

```typescript
// app/products/page.tsx — Server Component
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  // В App Router searchParams — это Promise, нужен await
  const { category, sort } = await searchParams

  const products = await fetchProducts({ category, sort })

  return <ProductList products={products} />
}
```

> Layouts (серверные компоненты-обёртки) **не получают** проп `searchParams`, потому что лэйаут не ре-рендерится при смене query-параметров. Для чтения параметров в лэйауте используйте `useSearchParams` в клиентском компоненте.

## Обновление параметров поиска

Оба хука предназначены только для чтения. Для изменения параметров используйте `useRouter` или компонент `Link`.

```typescript
'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Создаём новую строку запроса, сохраняя существующие параметры
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const removeParam = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(name)
      return params.toString()
    },
    [searchParams]
  )

  const currentSort = searchParams.get('sort') ?? 'default'

  return (
    <div>
      <p>Сортировка: {currentSort}</p>

      {/* Через useRouter — программная навигация */}
      <button
        onClick={() =>
          router.push(pathname + '?' + createQueryString('sort', 'price-asc'))
        }
      >
        По цене (возрастание)
      </button>

      {/* Через Link — декларативная навигация */}
      <Link href={pathname + '?' + createQueryString('sort', 'price-desc')}>
        По цене (убывание)
      </Link>

      {/* Удаление параметра */}
      <button onClick={() => router.push(pathname + '?' + removeParam('sort'))}>
        Сбросить сортировку
      </button>
    </div>
  )
}
```

## Пример: поисковая строка с debounce

Типичный паттерн — инпут поиска, который обновляет URL с задержкой:

```typescript
'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set('q', term)
      } else {
        params.delete('q')
      }
      // Сбрасываем страницу при новом поиске
      params.delete('page')
      router.replace(pathname + '?' + params.toString())
    },
    [pathname, router, searchParams]
  )

  return (
    <input
      type="search"
      defaultValue={searchParams.get('q') ?? ''}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Поиск..."
    />
  )
}
```

Обратите внимание: используем `defaultValue` вместо `value`, чтобы не делать инпут полностью контролируемым и избежать лишних ре-рендеров при каждом нажатии клавиши.

## Отслеживание изменений URL целиком

Часто нужно реагировать на любое изменение URL — как пути, так и параметров. Комбинируйте оба хука в зависимостях `useEffect`:

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function RouteChangeListener() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
    console.log('Маршрут изменился:', url)
    // Сюда можно добавить аналитику, сброс форм, логирование и т.д.
  }, [pathname, searchParams])

  return null
}
```

## Типичные ошибки

**Использование в Server Component.** Оба хука требуют `'use client'`. Попытка вызвать их в серверном компоненте приведёт к ошибке во время компиляции.

**Отсутствие Suspense для useSearchParams.** Статические маршруты не соберутся без границы `<Suspense>` вокруг компонента с `useSearchParams`.

**Прямая мутация searchParams.** Объект, возвращаемый `useSearchParams`, доступен только для чтения. Для создания новых параметров используйте конструктор `new URLSearchParams(searchParams.toString())`.

**useSearchParams в Layout.** Layout не ре-рендерится при смене query-параметров, поэтому значение из хука может быть устаревшим. Для надёжного отслеживания параметров в лэйауте вынесите логику в отдельный клиентский компонент, который расположен внутри лэйаута.

## Заключение

`usePathname` и `useSearchParams` — это основные инструменты для работы с URL в клиентских компонентах Next.js App Router. Ключевые правила:

- Оба хука работают только в `'use client'` компонентах
- `usePathname` безопасен для пре-рендеренных страниц без дополнительных условий
- `useSearchParams` требует обёртки в `<Suspense>` при статическом пре-рендеринге
- В серверных компонентах для чтения параметров поиска используйте проп `searchParams` страницы
- Для изменения URL используйте `useRouter` или `Link`, а не прямое изменение объекта `searchParams`

Чтобы освоить работу с роутингом, компонентами и хуками в Next.js на практике, приходите на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=use-search-params-and-use-pathname).
