---
metaTitle: "cacheTag и cacheLife в Next.js 15 — управление кэшем"
metaDescription: "Как использовать cacheTag и cacheLife в Next.js 15 для гибкого управления кэшированием компонентов и функций с директивой use cache."
author: "Антон Ларичев"
title: "Next.js 15: cacheTag и cacheLife — управление кэшем"
preview: "Разбираем новую систему кэширования Next.js 15: директива use cache, функции cacheLife и cacheTag, инвалидация по тегам."
---

## Новая модель кэширования в Next.js 15

Next.js 15 представил экспериментальную, но уже стабильно работающую систему кэширования на основе директивы `use cache`. Она приходит на замену привычным опциям `fetch` с `cache` и `next.revalidate`, предлагая более явный и предсказуемый способ управления временем жизни и инвалидацией кэша.

Ключевые участники новой системы:

- `use cache` — директива, помечающая функцию или компонент как кэшируемые
- `cacheLife` — задаёт профиль времени жизни кэша
- `cacheTag` — назначает теги кэш-записи для последующей инвалидации
- `revalidateTag` — инвалидирует все записи с указанным тегом

Чтобы использовать эти API, необходимо включить экспериментальный флаг в `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
}

export default nextConfig
```

Флаг `dynamicIO` активирует всю новую инфраструктуру кэширования, включая поддержку `use cache`, `cacheTag` и `cacheLife`.

## Директива use cache

`use cache` работает аналогично `use client` и `use server` — это строковая директива, которая размещается в начале файла, функции или компонента.

### Кэширование на уровне функции

```typescript
import { unstable_cacheTag as cacheTag, unstable_cacheLife as cacheLife } from 'next/cache'

async function getProduct(id: string) {
  'use cache'

  const response = await fetch(`https://api.example.com/products/${id}`)
  return response.json()
}
```

### Кэширование на уровне компонента

```typescript
async function ProductCard({ id }: { id: string }) {
  'use cache'

  const product = await fetch(`https://api.example.com/products/${id}`).then(r => r.json())

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.price} ₽</p>
    </div>
  )
}
```

### Кэширование на уровне файла

Если директива размещена в начале файла, все экспортируемые из него функции становятся кэшируемыми:

```typescript
'use cache'

import { unstable_cacheTag as cacheTag } from 'next/cache'

export async function getUser(id: string) {
  const response = await fetch(`https://api.example.com/users/${id}`)
  return response.json()
}

export async function getPostsByUser(userId: string) {
  const response = await fetch(`https://api.example.com/posts?userId=${userId}`)
  return response.json()
}
```

## cacheLife — управление временем жизни

`cacheLife` позволяет задать временной профиль кэширования. Вызов происходит внутри функции с директивой `use cache`.

### Встроенные профили

Next.js 15 поставляется с набором предустановленных профилей:

```typescript
import { unstable_cacheLife as cacheLife } from 'next/cache'

async function getNews() {
  'use cache'
  cacheLife('minutes')  // кэш на несколько минут

  const response = await fetch('https://api.example.com/news')
  return response.json()
}

async function getStaticContent() {
  'use cache'
  cacheLife('max')  // максимально долгое кэширование

  const response = await fetch('https://api.example.com/static-pages')
  return response.json()
}
```

Доступные встроенные профили:

| Профиль | Описание |
|---|---|
| `seconds` | Несколько секунд |
| `minutes` | Несколько минут |
| `hours` | Несколько часов |
| `days` | Несколько дней |
| `weeks` | Несколько недель |
| `max` | Максимально возможный срок |

### Пользовательский профиль

Можно передать объект с точными параметрами:

```typescript
import { unstable_cacheLife as cacheLife } from 'next/cache'

async function getCatalog() {
  'use cache'
  cacheLife({
    stale: 30,       // браузер считает кэш свежим 30 секунд
    revalidate: 60,  // фоновая ревалидация каждые 60 секунд
    expire: 3600,    // максимальный срок жизни записи — 1 час
  })

  const response = await fetch('https://api.example.com/catalog')
  return response.json()
}
```

Параметры профиля:

- `stale` — время в секундах, в течение которого клиент отдаёт кэшированные данные без обращения к серверу
- `revalidate` — интервал фоновой ревалидации на сервере (аналог `next.revalidate` в `fetch`)
- `expire` — абсолютный максимальный срок, после которого запись удаляется из кэша независимо от обращений

### Кастомные профили в конфигурации

Повторяющиеся профили удобно вынести в `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
    cacheLife: {
      product: {
        stale: 60,
        revalidate: 300,
        expire: 86400,
      },
      user: {
        stale: 10,
        revalidate: 30,
        expire: 600,
      },
    },
  },
}

export default nextConfig
```

Использование именованных профилей:

```typescript
import { unstable_cacheLife as cacheLife } from 'next/cache'

async function getProductDetails(id: string) {
  'use cache'
  cacheLife('product')  // используем профиль из конфигурации

  const response = await fetch(`https://api.example.com/products/${id}`)
  return response.json()
}

async function getUserProfile(id: string) {
  'use cache'
  cacheLife('user')

  const response = await fetch(`https://api.example.com/users/${id}`)
  return response.json()
}
```

## cacheTag — теги для инвалидации

`cacheTag` назначает одну или несколько строк-тегов кэш-записи. Позже эти теги используются для точечной инвалидации через `revalidateTag`.

### Базовое использование

```typescript
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache'

async function getProduct(id: string) {
  'use cache'
  cacheTag(`product-${id}`, 'products')
  cacheLife('hours')

  const response = await fetch(`https://api.example.com/products/${id}`)
  return response.json()
}
```

Здесь запись получает два тега: специфичный `product-42` и общий `products`. Это позволяет инвалидировать как конкретный товар, так и весь список товаров одним вызовом.

### Инвалидация через Server Action

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function updateProduct(id: string, data: FormData) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PUT',
    body: data,
  })

  // Инвалидируем только конкретный товар
  revalidateTag(`product-${id}`)
}

export async function deleteProduct(id: string) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'DELETE',
  })

  // Инвалидируем весь список товаров
  revalidateTag('products')
}
```

### Инвалидация в Route Handler

```typescript
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { tag } = await request.json()

  // Webhook от CMS: инвалидируем нужный контент
  revalidateTag(tag)

  return NextResponse.json({ revalidated: true })
}
```

## Практический пример: интернет-магазин

Рассмотрим реальный сценарий — каталог товаров с отдельным кэшем для списка и деталей.

### Слой данных с кэшированием

```typescript
// lib/products.ts
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache'

export interface Product {
  id: string
  name: string
  price: number
  categoryId: string
  inStock: boolean
}

export async function getProducts(): Promise<Product[]> {
  'use cache'
  cacheTag('products')
  cacheLife('minutes')

  const response = await fetch('https://api.example.com/products')
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}

export async function getProductById(id: string): Promise<Product> {
  'use cache'
  cacheTag(`product-${id}`, 'products')
  cacheLife('hours')

  const response = await fetch(`https://api.example.com/products/${id}`)
  if (!response.ok) throw new Error('Failed to fetch product')
  return response.json()
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  'use cache'
  cacheTag(`category-${categoryId}`, 'products')
  cacheLife('minutes')

  const response = await fetch(
    `https://api.example.com/products?categoryId=${categoryId}`
  )
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}
```

### Server Actions для мутаций

```typescript
// actions/products.ts
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const response = await fetch('https://api.example.com/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.get('name'),
      price: Number(formData.get('price')),
      categoryId: formData.get('categoryId'),
    }),
  })

  if (!response.ok) throw new Error('Failed to create product')
  const product = await response.json()

  // Инвалидируем общий список и список по категории
  revalidateTag('products')
  revalidateTag(`category-${product.categoryId}`)

  redirect(`/products/${product.id}`)
}

export async function updateProductStock(id: string, inStock: boolean) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inStock }),
  })

  // Достаточно инвалидировать конкретный товар
  revalidateTag(`product-${id}`)
}

export async function deleteCategory(categoryId: string) {
  await fetch(`https://api.example.com/categories/${categoryId}`, {
    method: 'DELETE',
  })

  // Инвалидируем всё, что связано с категорией
  revalidateTag(`category-${categoryId}`)
  revalidateTag('products')
}
```

### Страница товара

```typescript
// app/products/[id]/page.tsx
import { getProductById } from '@/lib/products'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProductById(id)

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.price} ₽</p>
      <span>{product.inStock ? 'В наличии' : 'Нет в наличии'}</span>
    </main>
  )
}
```

## Вложенное кэширование

Директиву `use cache` можно применять на разных уровнях вложенности. Внутренний кэш не может иметь более длинный срок жизни, чем внешний.

```typescript
async function ProductReviews({ productId }: { productId: string }) {
  'use cache'
  cacheTag(`reviews-${productId}`)
  cacheLife('minutes')  // отзывы обновляются часто

  const reviews = await fetch(
    `https://api.example.com/reviews?productId=${productId}`
  ).then(r => r.json())

  return (
    <ul>
      {reviews.map((review: { id: string; text: string }) => (
        <li key={review.id}>{review.text}</li>
      ))}
    </ul>
  )
}

async function ProductPage({ id }: { id: string }) {
  'use cache'
  cacheTag(`product-${id}`)
  cacheLife('days')  // основные данные товара меняются редко

  const product = await fetch(`https://api.example.com/products/${id}`).then(r =>
    r.json()
  )

  return (
    <div>
      <h1>{product.name}</h1>
      {/* Вложенный кэшируемый компонент с более коротким TTL */}
      <ProductReviews productId={id} />
    </div>
  )
}
```

## Отличия от предыдущего подхода

До Next.js 15 кэширование запросов настраивалось прямо в `fetch`:

```typescript
// Старый подход
async function getProduct(id: string) {
  const response = await fetch(`https://api.example.com/products/${id}`, {
    next: {
      revalidate: 3600,
      tags: [`product-${id}`],
    },
  })
  return response.json()
}
```

Новый подход через `use cache` позволяет кэшировать не только `fetch`-запросы, но и результаты любых вычислений, обращений к базе данных или внешним SDK:

```typescript
import { db } from '@/lib/db'
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache'

async function getUserOrders(userId: string) {
  'use cache'
  cacheTag(`user-orders-${userId}`)
  cacheLife('minutes')

  // Прямой запрос к базе данных — тоже кэшируется
  const orders = await db.order.findMany({
    where: { userId },
    include: { items: true },
  })

  return orders
}
```

## Важные ограничения

При работе с `use cache` нужно учитывать несколько правил:

**Только сериализуемые аргументы и возвращаемые значения.** Функция с `use cache` принимает и возвращает только то, что можно сериализовать в JSON — примитивы, массивы, plain-объекты. Классы, функции и замыкания передавать нельзя.

```typescript
// Неправильно — функция не сериализуется
async function getData(transform: (data: unknown) => unknown) {
  'use cache'
  // ...
}

// Правильно — только примитивы и простые объекты
async function getData(filters: { category: string; minPrice: number }) {
  'use cache'
  // ...
}
```

**Нет доступа к динамическим данным запроса.** Внутри функции с `use cache` нельзя вызывать `cookies()`, `headers()` или `searchParams` — они динамические и несовместимы с кэшированием.

**`cacheTag` и `cacheLife` вызываются только внутри `use cache`.** Вызов этих функций за пределами кэшируемого контекста приведёт к ошибке.

## Итог

`cacheTag` и `cacheLife` в сочетании с директивой `use cache` образуют цельную систему кэширования в Next.js 15. Она решает несколько задач одновременно: явно помечает кэшируемые единицы кода, задаёт гранулярные временные профили и позволяет точечно инвалидировать кэш по тегам — без лишних перезагрузок страниц и без необходимости вручную управлять ключами кэша.

Система особенно полезна в проектах с часто обновляемыми данными, где разные части страницы живут в разных ритмах: заголовок меняется раз в неделю, список товаров — ежечасно, а наличие на складе — каждые несколько минут.

Для глубокого погружения в Next.js, включая все аспекты работы с кэшированием, Server Components и App Router, изучите курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-cache-tag-life).
