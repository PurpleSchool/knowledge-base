---
metaTitle: "generateStaticParams в Next.js — статическая генерация маршрутов"
metaDescription: "Узнайте, как использовать generateStaticParams в Next.js App Router для статической генерации динамических маршрутов при сборке проекта."
author: "Антон Ларичев"
title: "generateStaticParams — статическая генерация динамических маршрутов"
preview: "Как использовать generateStaticParams для статической генерации динамических маршрутов в Next.js App Router."
---

## Что такое generateStaticParams

`generateStaticParams` — это функция App Router в Next.js, которая позволяет статически генерировать динамические маршруты во время сборки. Она заменяет `getStaticPaths` из Pages Router и работает совместно с сегментами динамических маршрутов, такими как `[slug]`, `[id]` или `[...slug]`.

Когда приложение собирается, Next.js вызывает `generateStaticParams` и получает список всех возможных значений параметров. Для каждого набора параметров генерируется отдельная HTML-страница. В итоге пользователи получают мгновенный ответ — без серверного рендеринга в момент запроса.

## Зачем нужна статическая генерация динамических маршрутов

Статическая генерация даёт несколько ключевых преимуществ перед серверным рендерингом:

- **Скорость**: страницы отдаются как готовые HTML-файлы из CDN без обращения к серверу
- **Надёжность**: отсутствие серверной обработки снижает вероятность сбоев
- **SEO**: поисковые роботы получают полностью отрендеренный HTML
- **Снижение нагрузки**: база данных опрашивается один раз при сборке, а не при каждом запросе

Типичные сценарии использования: сайты с контентом из CMS, блоги, страницы товаров в интернет-магазине, документация.

## Базовый синтаксис

Функция `generateStaticParams` экспортируется из файла `page.tsx` внутри динамического сегмента и возвращает массив объектов, где каждый объект описывает один маршрут.

```typescript
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  return [
    { slug: 'getting-started' },
    { slug: 'advanced-patterns' },
    { slug: 'deployment-guide' },
  ]
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Пост: {params.slug}</h1>
}
```

При сборке Next.js создаст три страницы:
- `/blog/getting-started`
- `/blog/advanced-patterns`
- `/blog/deployment-guide`

## Получение параметров из внешнего источника

На практике список параметров почти всегда приходит из базы данных или внешнего API. `generateStaticParams` поддерживает асинхронные запросы:

```typescript
// app/products/[id]/page.tsx

type Product = {
  id: string
  name: string
}

async function getAllProducts(): Promise<Product[]> {
  const response = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 },
  })
  return response.json()
}

export async function generateStaticParams() {
  const products = await getAllProducts()

  return products.map((product) => ({
    id: product.id,
  }))
}

export default async function ProductPage({
  params,
}: {
  params: { id: string }
}) {
  const response = await fetch(`https://api.example.com/products/${params.id}`)
  const product: Product = await response.json()

  return (
    <article>
      <h1>{product.name}</h1>
    </article>
  )
}
```

Next.js автоматически дедуплицирует одинаковые запросы: если `generateStaticParams` и компонент страницы делают один и тот же `fetch`-запрос, данные запрашиваются только один раз.

## Вложенные динамические сегменты

Когда маршрут содержит несколько динамических сегментов, каждый уровень может определять свою функцию `generateStaticParams`. Next.js перебирает все комбинации.

```
app/
  blog/
    [categorySlug]/
      [postSlug]/
        page.tsx
```

Первый способ — вернуть сразу все комбинации параметров из одной функции:

```typescript
// app/blog/[categorySlug]/[postSlug]/page.tsx

type Post = {
  categorySlug: string
  postSlug: string
}

export async function generateStaticParams() {
  const response = await fetch('https://api.example.com/posts')
  const posts: Post[] = await response.json()

  return posts.map((post) => ({
    categorySlug: post.categorySlug,
    postSlug: post.postSlug,
  }))
}

export default function PostPage({
  params,
}: {
  params: { categorySlug: string; postSlug: string }
}) {
  return (
    <div>
      <p>Категория: {params.categorySlug}</p>
      <p>Пост: {params.postSlug}</p>
    </div>
  )
}
```

Второй способ — определять `generateStaticParams` на каждом уровне отдельно. Функция дочернего сегмента принимает `params` родительского:

```typescript
// app/blog/[categorySlug]/page.tsx
export async function generateStaticParams() {
  const categories = await fetch('https://api.example.com/categories').then(
    (r) => r.json()
  )

  return categories.map((cat: { slug: string }) => ({
    categorySlug: cat.slug,
  }))
}

// app/blog/[categorySlug]/[postSlug]/page.tsx
export async function generateStaticParams({
  params: { categorySlug },
}: {
  params: { categorySlug: string }
}) {
  const posts = await fetch(
    `https://api.example.com/categories/${categorySlug}/posts`
  ).then((r) => r.json())

  return posts.map((post: { slug: string }) => ({
    postSlug: post.slug,
  }))
}
```

При таком подходе Next.js вызывает дочернюю функцию для каждого значения родительского параметра. Это полезно, когда набор дочерних элементов зависит от родителя.

## Catch-all сегменты

`generateStaticParams` работает и с catch-all сегментами `[...slug]` и опциональными `[[...slug]]`. В этом случае параметр является массивом строк:

```typescript
// app/docs/[...slug]/page.tsx

export async function generateStaticParams() {
  return [
    { slug: ['introduction'] },
    { slug: ['guides', 'installation'] },
    { slug: ['guides', 'configuration', 'advanced'] },
  ]
}

export default function DocsPage({
  params,
}: {
  params: { slug: string[] }
}) {
  const path = params.slug.join('/')

  return <h1>Документация: /{path}</h1>
}
```

Это создаст маршруты:
- `/docs/introduction`
- `/docs/guides/installation`
- `/docs/guides/configuration/advanced`

## Управление поведением для незаданных маршрутов

По умолчанию маршруты, не возвращённые из `generateStaticParams`, отрабатываются на сервере в режиме динамического рендеринга. Поведение можно изменить с помощью экспорта `dynamicParams`:

```typescript
// app/blog/[slug]/page.tsx

// true (по умолчанию): неизвестные slug генерируются динамически
// false: неизвестные slug возвращают 404
export const dynamicParams = true

export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((r) =>
    r.json()
  )

  return posts.map((post: { slug: string }) => ({ slug: post.slug }))
}
```

Установка `dynamicParams = false` полезна для сайтов, где весь контент известен заранее и появление незнакомого маршрута должно завершаться ошибкой 404:

```typescript
export const dynamicParams = false
```

## Инкрементальная статическая регенерация

`generateStaticParams` хорошо сочетается с ISR. Если добавить `revalidate` в `page.tsx`, страницы будут периодически пересоздаваться в фоне:

```typescript
// app/news/[slug]/page.tsx

export const revalidate = 60 // обновлять раз в 60 секунд

export async function generateStaticParams() {
  const articles = await fetch('https://api.example.com/news').then((r) =>
    r.json()
  )

  return articles.map((article: { slug: string }) => ({
    slug: article.slug,
  }))
}

export default async function NewsArticle({
  params,
}: {
  params: { slug: string }
}) {
  const article = await fetch(
    `https://api.example.com/news/${params.slug}`
  ).then((r) => r.json())

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  )
}
```

Статически сгенерированные страницы отдаются мгновенно, а через каждые 60 секунд Next.js в фоне проверяет обновления и при необходимости пересоздаёт страницу.

## Типизация параметров

Правильная типизация помогает избежать ошибок при работе с динамическими маршрутами:

```typescript
// app/shop/[category]/[productId]/page.tsx

type PageParams = {
  category: string
  productId: string
}

type PageProps = {
  params: PageParams
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const products = await fetch('https://api.example.com/products').then((r) =>
    r.json()
  )

  return products.map(
    (product: { category: string; id: string }): PageParams => ({
      category: product.category,
      productId: product.id,
    })
  )
}

export default async function ProductPage({ params }: PageProps) {
  const { category, productId } = params

  const product = await fetch(
    `https://api.example.com/products/${productId}`
  ).then((r) => r.json())

  return (
    <div>
      <p>Категория: {category}</p>
      <h1>{product.name}</h1>
    </div>
  )
}
```

## Отличия от getStaticPaths

Разработчики, переходящие с Pages Router, могут провести параллель между `generateStaticParams` и `getStaticPaths`. Ключевые отличия:

| Характеристика | `getStaticPaths` (Pages) | `generateStaticParams` (App) |
|---|---|---|
| Возвращаемое значение | `{ paths, fallback }` | Массив объектов с параметрами |
| Управление fallback | `fallback: 'blocking'`, `false`, `true` | Экспорт `dynamicParams` |
| Вложенные параметры | Один объект `params` | Иерархические функции |
| Дедупликация fetch | Нет | Автоматически |

В App Router не нужно оборачивать параметры в `{ params: { slug: 'value' } }` — достаточно вернуть `{ slug: 'value' }` напрямую.

## Оптимизация производительности при сборке

Если у вас тысячи маршрутов, генерировать все страницы при каждой сборке может быть неэффективно.

### Частичная генерация с ISR

Генерируйте только самые популярные страницы статически, остальные — по запросу:

```typescript
// app/posts/[slug]/page.tsx

export const dynamicParams = true // остальные страницы рендерятся динамически

export async function generateStaticParams() {
  const posts = await fetch(
    'https://api.example.com/posts?sort=popular&limit=100'
  ).then((r) => r.json())

  return posts.map((post: { slug: string }) => ({ slug: post.slug }))
}
```

### Параллельная загрузка данных

Если нужно загрузить данные из нескольких источников, используйте `Promise.all`:

```typescript
export async function generateStaticParams() {
  const [postsResponse, pagesResponse] = await Promise.all([
    fetch('https://api.example.com/posts'),
    fetch('https://api.example.com/pages'),
  ])

  const [posts, pages] = await Promise.all([
    postsResponse.json(),
    pagesResponse.json(),
  ])

  return [
    ...posts.map((post: { slug: string }) => ({ slug: post.slug })),
    ...pages.map((page: { slug: string }) => ({ slug: page.slug })),
  ]
}
```

## Полный пример: блог с категориями

Рассмотрим реальный пример — блог с разбивкой по категориям:

```
app/
  blog/
    page.tsx                    // список всех постов
    [category]/
      page.tsx                  // список постов в категории
      [slug]/
        page.tsx                // страница отдельного поста
```

```typescript
// app/blog/[category]/page.tsx

type Category = {
  slug: string
  name: string
}

export async function generateStaticParams() {
  const categories: Category[] = await fetch(
    'https://api.example.com/categories'
  ).then((r) => r.json())

  return categories.map((category) => ({
    category: category.slug,
  }))
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const posts = await fetch(
    `https://api.example.com/posts?category=${params.category}`
  ).then((r) => r.json())

  return (
    <div>
      <h1>Категория: {params.category}</h1>
      <ul>
        {posts.map((post: { slug: string; title: string }) => (
          <li key={post.slug}>
            <a href={`/blog/${params.category}/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

```typescript
// app/blog/[category]/[slug]/page.tsx

type Post = {
  category: string
  slug: string
  title: string
  content: string
}

export async function generateStaticParams({
  params: { category },
}: {
  params: { category: string }
}) {
  const posts: Post[] = await fetch(
    `https://api.example.com/posts?category=${category}`
  ).then((r) => r.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { category: string; slug: string }
}) {
  const post: Post = await fetch(
    `https://api.example.com/posts/${params.slug}`
  ).then((r) => r.json())

  return {
    title: post.title,
  }
}

export default async function PostPage({
  params,
}: {
  params: { category: string; slug: string }
}) {
  const post: Post = await fetch(
    `https://api.example.com/posts/${params.slug}`
  ).then((r) => r.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

## Итог

`generateStaticParams` — мощный инструмент для статической генерации динамических маршрутов в Next.js App Router. Он позволяет заранее создавать HTML-страницы для известных параметров, обеспечивая максимальную скорость загрузки и снижая нагрузку на сервер.

Функция работает на любом уровне вложенности, поддерживает catch-all сегменты, автоматически дедуплицирует fetch-запросы и легко комбинируется с ISR для поддержания актуальности данных. Управление незнакомыми маршрутами через `dynamicParams` даёт гибкость в выборе стратегии: полная статика или гибридный подход.

Для глубокого изучения Next.js App Router, включая маршрутизацию, серверные компоненты и оптимизацию производительности, рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=generateStaticParams).