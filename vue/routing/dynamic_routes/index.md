---
metaTitle: Динамические маршруты в веб приложениях
metaDescription: Подробный разбор механизма dynamic-routes в веб разработке - шаблоны маршрутов параметры вложенность и работа на стороне сервера и клиента
author: Олег Марков
title: Динамические маршруты dynamic-routes в современных фреймворках
preview: Разберите на практике как работают динамические маршруты dynamic-routes - от базовых параметров в URL до вложенных маршрутов перегенерации страниц и защиты доступа
---

## Введение

Динамические маршруты (dynamic-routes) — это способ описать в веб-приложении URL, которые зависят от данных. Вы не перечисляете каждую возможную ссылку вручную, а задаете шаблон маршрута, и фреймворк сам подставляет значения.

Когда вы видите адрес вида:

- /users/42  
- /blog/react-dynamic-routes  
- /products/notebooks/lenovo-ideapad-3

очень вероятно, что за ними стоят динамические маршруты с параметрами:

- /users/:id  
- /blog/:slug  
- /products/:category/:productId

Смотрите, я покажу вам, как эти шаблоны позволяют:

- строить гибкую структуру страниц без копирования одинакового кода;
- подгружать данные в зависимости от параметров URL;
- реализовывать SEO-дружественные адреса;
- разделять логику на вложенные компоненты.

Давайте двигаться по шагам: сначала разберем базовую идею динамических маршрутов, потом посмотрим на примеры с популярными фреймворками (Next.js, React Router, Express), затем обсудим нюансы — вложенность, обработку ошибок, защиту маршрутов и оптимизацию.

---

## Что такое динамический маршрут

### Статический vs динамический маршрут

Статический маршрут — это маршрут с полностью фиксированным путем:

- /about
- /contacts
- /pricing

Он всегда ведет к одной и той же странице, вне зависимости от параметров.

Динамический маршрут — это шаблон, внутри которого есть переменные части (параметры). Они обозначают сегменты URL, значения которых меняются:

- /users/:id
- /blog/:year/:month/:slug
- /shop/:category/:productId

Каждый раз, когда вы заходите по адресу /users/10 или /users/25 — вы попадаете на одну и ту же страницу-шаблон, но с разными данными, подставленными по параметру id.

### Основная идея dynamic-routes

Если упростить, динамический маршрут решает задачу:

> Есть много однотипных страниц, отличающихся только данными — как не создать для каждой отдельный файл или обработчик?

Ответ — использовать один обработчик (компонент, страницу) и сделать путь динамическим через параметры. Фреймворк делает за вас:

1. Сопоставление URL с шаблоном маршрута.
2. Извлечение параметров из реального URL.
3. Передачу этих параметров в ваш обработчик (функцию, компонент).
4. Вызов вашей логики загрузки данных и рендера.

---

## Основные типы параметров в динамических маршрутах

Давайте разберем, какие бывают параметры и как они обычно выглядят.

### Параметры пути (path params)

Это самые распространенные параметры — они зашиваются в путь URL.

Пример шаблона:

- /users/:id
- /blog/:slug
- /products/:category/:productId

Пример реальных URL:

- /users/7
- /blog/dynamic-routes-in-next
- /products/laptops/lenovo-ideapad-3

В коде вы получаете значения через объект параметров.

Пример на Express:

```js
// Обрабатываем маршрут с параметром id
app.get('/users/:id', (req, res) => {
  // Здесь мы вытаскиваем параметр из URL
  const userId = req.params.id

  // Обычно на этом этапе вы загружаете пользователя из базы данных
  // Например:
  // const user = db.getUserById(userId)

  // Для примера просто вернем id
  res.send(`Пользователь с id = ${userId}`)
})
```

Здесь вы определяете один маршрут /users/:id и получаете поддержку всех вариантов /users/1, /users/2 и так далее.

### Параметры запроса (query params)

Это не совсем часть динамического пути, но они часто используются вместе с динамическими маршрутами:

- /users/10?tab=posts
- /search?q=react&page=2

Путь может быть динамическим (например /users/:id), а query-параметры дополняют фильтрацию, сортировку, пагинацию.

В Express, например:

```js
app.get('/search', (req, res) => {
  // Параметр поиска из query-строки
  const query = req.query.q
  const page = req.query.page || 1

  // Здесь могла бы быть логика поиска
  // const results = searchService.search(query, page)

  res.send(`Поиск по запросу "${query}" - страница ${page}`)
})
```

Путь /search статичен, но содержимое страниц становится динамическим за счет query-параметров.

### Множественные и вложенные параметры

Вы можете передавать сразу несколько параметров, и они будут представлены как разные ключи:

- /blog/:year/:month/:slug
- /shop/:category/:subCategory/:productId

Схема всегда одинаковая: фреймворк сопоставляет сегменты URL с сегментами шаблона и складывает значения в объект params.

---

## Динамические маршруты в популярных фреймворках

Чтобы вам было проще сопоставить теорию с практикой, давайте посмотрим, как dynamic-routes реализованы в разных окружениях.

### Next.js (file-system routing)

В Next.js маршруты завязаны на файловую систему. Здесь динамический маршрут создается за счет имени файла в квадратных скобках.

#### Базовый пример динамического маршрута

Структура проекта:

- pages
  - users
    - [id].tsx

Файл pages/users/[id].tsx:

```tsx
// Страница пользователя для URL вида /users/123
import { useRouter } from 'next/router'

export default function UserPage() {
  // Здесь мы получаем объект router
  const router = useRouter()

  // Параметры пути берем из router.query
  const { id } = router.query

  // Обычно на основе id вы загружаете данные пользователя
  // Например через fetch или библиотеку для работы с API

  return (
    <div>
      {/* Выводим id чтобы увидеть текущего пользователя */}
      <h1>Профиль пользователя {id}</h1>
    </div>
  )
}
```

Как видите, достаточно создать файл [id].tsx, и Next.js автоматически сопоставит его с любым адресом /users/что-угодно.

#### Вложенные динамические маршруты

Теперь давайте посмотрим на более сложную структуру:

- pages
  - blog
    - [year]
      - [month]
        - [slug].tsx

Такой набор файлов даст вам маршруты вида:

- /blog/2024/01/next-dynamic-routes
- /blog/2023/12/react-router-tutorial

Пример простой страницы:

```tsx
// Страница статьи блога, завязанная на год, месяц и slug
import { useRouter } from 'next/router'

export default function BlogPostPage() {
  const router = useRouter()
  const { year, month, slug } = router.query

  // На практике вы бы использовали эти параметры
  // для выборки статьи из базы данных или API

  return (
    <article>
      <h1>Статья {slug}</h1>
      <p>Дата публикации - {month}.{year}</p>
    </article>
  )
}
```

Next.js сам сопоставит части URL с частями пути в файловой системе.

#### getStaticPaths и динамическая генерация

Если вы используете статическую генерацию (SSG) в Next.js, то для динамических маршрутов вы должны сообщить фреймворку, какие варианты путей надо сгенерировать заранее.

Смотрите, я покажу вам пример:

```tsx
// pages/blog/[slug].tsx

import { GetStaticPaths, GetStaticProps } from 'next'

// Компонент страницы принимает пропсы с данными
export default function BlogPost({ post }: { post: { title: string } }) {
  // Здесь мы просто отображаем заголовок статьи
  return <h1>{post.title}</h1>
}

// Функция говорит Next.js какие значения slug нужно сгенерировать
export const getStaticPaths: GetStaticPaths = async () => {
  // Обычно вы получаете список статей из базы данных или API
  // Здесь для примера используем жестко заданный массив
  const posts = [{ slug: 'first-post' }, { slug: 'second-post' }]

  return {
    // Формируем массив путей вида { params: { slug: 'first-post' } }
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    // fallback определяет поведение для путей которых нет в paths
    fallback: false,
  }
}

// Функция загружает данные для конкретного slug
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // Извлекаем slug из параметров
  const slug = params?.slug as string

  // Здесь могла бы быть реальная загрузка поста по slug
  const post = { title: `Статья со slug ${slug}` }

  return {
    props: {
      post,
    },
  }
}
```

Ключевой момент: динамический маршрут [slug] соединяется с данными из getStaticPaths. Вы описываете все slug, которые хотите сгенерировать, и Next.js связывает это с конкретными URL.

#### catch-all маршруты ([...param])

Иногда вы не знаете заранее, сколько сегментов будет в пути. Для этого есть catch-all маршруты.

Структура:

- pages
  - docs
    - [...slug].tsx

Маршрут docs/[...slug].tsx будет обрабатывать:

- /docs
- /docs/getting-started
- /docs/guide/intro
- /docs/guide/advanced/part-2

Пример:

```tsx
// Страница документации которая принимает произвольное количество сегментов
import { useRouter } from 'next/router'

export default function DocsPage() {
  const router = useRouter()
  const { slug } = router.query

  // slug может быть строкой или массивом строк
  // Для удобства приведем его к массиву
  const segments = Array.isArray(slug) ? slug : slug ? [slug] : []

  return (
    <div>
      <h1>Документация</h1>
      {/* Показываем какие сегменты пути мы получили */}
      <p>Сегменты пути {segments.join(' / ')}</p>
    </div>
  )
}
```

Здесь удобно строить древовидную документацию, wiki, вложенные разделы.

---

### React Router (SPA на React)

В React Router динамические маршруты задаются прямо в коде через двоеточие в пути.

#### Простейший динамический маршрут

Давайте разберемся на примере:

```tsx
// Настройка маршрутов в React Router v6
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'

function UserPage() {
  // Здесь мы получаем параметры из URL
  const { id } = useParams()

  return <h1>Пользователь с id {id}</h1>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Определяем динамический маршрут для /users/:id */}
        <Route path="/users/:id" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Компонент UserPage будет отрисован и для /users/1, и для /users/abc, и для /users/999 — во всех случаях in попадает в useParams.

#### Вложенные динамические маршруты

Смотрите, как можно описать вложенность:

```tsx
import { Routes, Route, Outlet, useParams } from 'react-router-dom'

function UserLayout() {
  // Общий layout для всех страниц пользователя
  return (
    <div>
      <h1>Профиль пользователя</h1>
      {/* Здесь будут рендериться вложенные маршруты */}
      <Outlet />
    </div>
  )
}

function UserProfile() {
  const { id } = useParams()
  return <p>Основная информация о пользователе {id}</p>
}

function UserSettings() {
  const { id } = useParams()
  return <p>Настройки пользователя {id}</p>
}

export default function App() {
  return (
    <Routes>
      {/* Родительский маршрут с динамическим параметром */}
      <Route path="/users/:id" element={<UserLayout />}>
        {/* Дочерние маршруты */}
        <Route index element={<UserProfile />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>
    </Routes>
  )
}
```

Теперь:

- /users/10 рендерит UserLayout + UserProfile
- /users/10/settings рендерит UserLayout + UserSettings

Важно, что параметр id доступен во всех вложенных компонентах через useParams.

---

### Express (Node.js сервер)

На сервере идея такая же, но вместо компонентов у вас функции-обработчики.

#### Динамический маршрут с параметром

```js
const express = require('express')
const app = express()

// Определяем маршрут с динамическим параметром :id
app.get('/api/users/:id', (req, res) => {
  // Достаем id из параметров
  const userId = req.params.id

  // Здесь вы могли бы загрузить пользователя из базы
  // const user = await db.getUserById(userId)

  // Для примера вернем объект с id
  res.json({ id: userId, name: 'Заглушка пользователя' })
})

// Запускаем сервер на порту 3000
app.listen(3000, () => {
  // Этот лог нужен только для отладки
  console.log('Сервер запущен на http://localhost:3000')
})
```

Любой запрос на /api/users/123 попадет в этот обработчик, и вы получите req.params.id === '123'.

#### Несколько параметров в пути

```js
// Маршрут для товара внутри категории
app.get('/api/categories/:categoryId/products/:productId', (req, res) => {
  // Извлекаем оба параметра
  const { categoryId, productId } = req.params

  // Эти параметры обычно используются для выборки товара
  // const product = db.getProduct(categoryId, productId)

  res.json({
    categoryId,
    productId,
  })
})
```

Чем больше параметров, тем аккуратнее стоит проектировать структуру URL, чтобы она оставалась читабельной.

---

## Вложенные и иерархические dynamic-routes

### Зачем нужна вложенность

Когда ваше приложение растет, вам нужно группировать страницы по разделам:

- /dashboard/users/...
- /dashboard/settings/...
- /products/:category/:productId
- /account/:section/:subSection

Вложенные динамические маршруты позволяют:

- описать одну общую «рамку» (layout) для всей группы страниц;
- переиспользовать общий код (меню, проверку авторизации, загрузку базовых данных);
- держать структуру проекта близкой к структуре URL.

### Вложенность в Next.js (app router / pages router)

В pages router вложенность строится через папки:

- pages
  - dashboard
    - index.tsx          → /dashboard
    - users
      - [id].tsx         → /dashboard/users/:id
    - settings
      - index.tsx        → /dashboard/settings

В app router (Next.js 13+) структура похожа, но с layout:

- app
  - dashboard
    - layout.tsx          → общий layout для /dashboard/*
    - page.tsx            → /dashboard
    - users
      - [id]
        - page.tsx        → /dashboard/users/:id

Пример layout с динамическими дочерними маршрутами:

```tsx
// app/dashboard/layout.tsx
// Общий layout для всех страниц /dashboard/*
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* Общий заголовок для админки */}
      <h1>Админка</h1>
      {/* Основной контент страницы */}
      <main>{children}</main>
    </div>
  )
}
```

```tsx
// app/dashboard/users/[id]/page.tsx
// Страница конкретного пользователя в админке
interface Props {
  params: { id: string }
}

export default function DashboardUserPage({ params }: Props) {
  // Здесь мы берем id из params что пришли из маршрута
  const { id } = params

  return <div>Пользователь в админке с id {id}</div>
}
```

Так вы получаете иерархию: /dashboard — общая оболочка, внутри которой рендерится любая страница, в том числе динамическая /dashboard/users/:id.

---

## Обработка ошибок и несуществующих динамических маршрутов

### 404 для динамических страниц

С динамическими маршрутами важно уметь корректно отвечать на несуществующие значения параметров.

Например, вы заходите на /blog/some-slug, которого нет в базе. С точки зрения маршрутизации страница существует (маршрут [slug] найден), но данных нет.

#### В Next.js (getStaticProps / getServerSideProps)

Вы можете вернуть notFound: true, чтобы отдать страницу 404.

```tsx
// pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next'

export default function BlogPost({ post }: { post: any }) {
  // Если сюда попали значит пост существует
  return <h1>{post.title}</h1>
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Здесь могли бы быть реальные slug
  return {
    paths: [],
    // Разрешаем fallback чтобы генерировать новые страницы на лету
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string

  // Имитируем поиск в базе
  const post = null // Представим что пост не найден

  if (!post) {
    // Сообщаем Next.js что нужно отдать 404
    return { notFound: true }
  }

  return {
    props: { post },
  }
}
```

Такой подход позволяет вам гибко контролировать, какие значения параметров считаются валидными.

#### В Express

На сервере все еще проще: если вы не находите сущность, верните 404 статус.

```js
app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id

  // Здесь могла бы быть реальная загрузка пользователя
  const user = null // Допустим пользователь не найден

  if (!user) {
    // Отправляем HTTP статус 404 и сообщение
    res.status(404).json({ error: 'Пользователь не найден' })
    return
  }

  res.json(user)
})
```

---

## Ограничения и валидация параметров динамических маршрутов

### Ограничение формата параметра

Если вам нужно, чтобы параметр был только числом, вы можете:

1. Валидировать его внутри обработчика.
2. В некоторых фреймворках — описать это в самом маршруте.

#### Валидация внутри обработчика (универсальный подход)

```js
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id

  // Проверяем что id состоит только из цифр
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ error: 'Некорректный формат id' })
    return
  }

  // Здесь мы уверены что id - число
  const numericId = Number(id)

  // Дальше логика загрузки пользователя
  res.json({ id: numericId })
})
```

Так вы защищаете систему от некорректных значений, даже если маршрут их технически принимает.

#### Регулярные выражения в маршрутах (пример с Express)

Express позволяет добавлять регулярное выражение прямо в путь:

```js
// Здесь :id(\d+) означает что id должен состоять только из цифр
app.get('/api/users/:id(\\d+)', (req, res) => {
  const id = Number(req.params.id)
  res.json({ id })
})
```

Такой маршрут вообще не будет соответствовать /api/users/abc, и код внутри не выполнится.

---

## Генерация ссылок и переходов на динамические маршруты

Динамические маршруты — это только половина дела. Важно научиться правильно формировать ссылки на них.

### React Router

```tsx
import { Link } from 'react-router-dom'

function UsersList() {
  const users = [
    // Здесь могли бы быть реальные данные
    { id: 1, name: 'Иван' },
    { id: 2, name: 'Мария' },
  ]

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {/* Формируем URL из параметра id */}
          <Link to={`/users/${user.id}`}>
            {/* Показываем имя пользователя */}
            {user.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

Важно следить, чтобы значения параметров правильно кодировались (encodeURIComponent), если в них могут быть пробелы или спецсимволы.

### Next.js (Link и router.push)

```tsx
import Link from 'next/link'

function BlogList() {
  const posts = [
    // Представим что это пришло из API
    { slug: 'first-post', title: 'Первая статья' },
    { slug: 'second-post', title: 'Вторая статья' },
  ]

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>
          {/* Next.js сам подставит slug в динамический маршрут /blog/[slug] */}
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  )
}
```

Вы можете использовать объектную форму, если вам удобнее:

```tsx
<Link href={{ pathname: '/blog/[slug]', query: { slug: post.slug } }}>
  {post.title}
</Link>
```

---

## Динамические маршруты и SEO

### Читаемые URL

Одно из ключевых преимуществ dynamic-routes — возможность делать человекочитаемые и SEO-дружественные адреса:

- Вместо /product?id=123 → /products/laptops/lenovo-ideapad-3
- Вместо /article?id=10 → /blog/10-dynamic-routes

Хорошая практика:

- Использовать slug вместо raw id, например /blog/dynamic-routes-v-next-js.
- Делить слова дефисами, а не подчеркиваниями.
- Избегать лишних параметров, если их можно зашить в путь.

### Канонические URL и редиректы

Если ваш маршрут допускает разные формы записи (например, с и без слеша в конце), стоит настроить:

- редирект на каноническую версию;
- указание canonical в мета-тегах.

Это уже больше про SEO-настройки, но динамические маршруты дают удобный каркас для таких решений.

---

## Производительность и кэширование с dynamic-routes

### Статическая генерация (SSG) для динамических маршрутов

В Next.js вы можете заранее сгенерировать часть маршрутов (через getStaticPaths), чтобы:

- ускорить отдачу страниц;
- разгрузить базу данных;
- получить стабильные SEO-оптимизированные страницы.

Здесь важно выбрать:

- какие маршруты вы точно знаете заранее;
- какие нужно генерировать «на лету» (fallback: 'blocking' или true);
- как часто их нужно пересобираать (revalidate).

Пример с revalidate:

```tsx
// pages/blog/[slug].tsx

export const getStaticProps = async ({ params }) => {
  const slug = params?.slug as string

  // Здесь вы бы загрузили данные поста по slug
  const post = { title: `Статья ${slug}` }

  return {
    props: { post },
    // Разрешаем Next.js пересоздавать страницу раз в 60 секунд
    revalidate: 60,
  }
}
```

Так динамические маршруты остаются актуальными, но при этом отдаются как статические.

### Кэширование на уровне API

Если вы используете динамические маршруты в API (например /api/products/:id), вы можете кэшировать ответы по комбинации:

- путь маршрута;
- значения параметров;
- значения query.

Это позволяет быстро обслуживать часто запрашиваемые URL без повторной выборки из базы.

---

## Динамические маршруты и защита доступа

### Приватные маршруты в SPA (React Router пример)

Если у вас есть маршруты, доступные только авторизованным пользователям, динамические параметры все равно присутствуют, но сам маршрут оборачивается в защитный компонент.

```tsx
import { Navigate, useLocation, Outlet } from 'react-router-dom'

function RequireAuth() {
  // Здесь вы берете состояние авторизации
  const isAuth = false // Для примера считаем что пользователь не авторизован
  const location = useLocation()

  if (!isAuth) {
    // Перенаправляем на логин и запоминаем откуда пришли
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Если авторизован - рендерим вложенные маршруты
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      {/* Группа защищенных маршрутов */}
      <Route element={<RequireAuth />}>
        {/* Динамический защищенный маршрут */}
        <Route path="/account/:section" element={<AccountPage />} />
      </Route>
    </Routes>
  )
}

function AccountPage() {
  // Здесь у нас будет доступ к динамическому параметру
  // const { section } = useParams()
  return <div>Страница аккаунта</div>
}
```

Так вы можете защитить сразу группу динамических маршрутов с разными параметрами.

### Проверка прав в серверных динамических маршрутах

В API-обработчиках с динамическими маршрутами важно:

- проверять токены/сессии;
- убеждаться, что пользователь имеет доступ к ресурсу с данным параметром (например к /api/users/:id только если это его id или он администратор).

```js
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const requestedId = req.params.id
  const currentUser = req.user // предположим authMiddleware заполнил это поле

  // Проверяем что пользователь может смотреть этот профиль
  if (currentUser.role !== 'admin' && currentUser.id !== requestedId) {
    res.status(403).json({ error: 'Недостаточно прав' })
    return
  }

  // Дальнейшая логика по выдаче данных
  res.json({ id: requestedId })
})
```

---

## Заключение

Динамические маршруты — ключевой инструмент для построения гибких, масштабируемых и удобных для пользователя веб-приложений. Вы описываете не конкретный URL, а шаблон с параметрами, а фреймворк берет на себя:

- сопоставление фактического URL с шаблоном;
- извлечение параметров;
- передачу их в ваш код.

Мы посмотрели, как это работает:

- в Next.js — через файловую систему и синтаксис [param], [...param], getStaticPaths, getStaticProps;
- в React Router — через path="/users/:id" и useParams;
- в Express — через /api/users/:id и req.params;

а также обсудили вложенность, обработку ошибок, валидацию, защиту маршрутов и влияние на SEO и производительность.

Главная мысль: вместо множества однотипных обработчиков под разные URL вы строите единую, логичную иерархию dynamic-routes, а данные и конкретное содержимое страниц меняются за счет параметров пути и query-параметров.

---

## Частозадаваемые технические вопросы

### Как сделать разные компоненты для одного динамического маршрута в зависимости от параметра

Иногда нужно, чтобы /products/:type показывал разные компоненты для type=phone и type=laptop.

Один из подходов (React Router):

```tsx
function ProductPage() {
  const { type } = useParams()

  if (type === 'phone') {
    // Здесь вы рендерите компонент для телефона
    return <PhonePage />
  }

  if (type === 'laptop') {
    // Здесь вы рендерите компонент для ноутбука
    return <LaptopPage />
  }

  // Для остальных значений показываем 404 или заглушку
  return <NotFound />
}
```

Если типов много, вы можете хранить мапу type → компонент и выбирать по ключу.

### Как правильно типизировать параметры маршрута в TypeScript (React Router)

Для useParams вы можете явно указать тип параметров:

```tsx
import { useParams } from 'react-router-dom'

type RouteParams = {
  id: string
}

function UserPage() {
  const { id } = useParams<RouteParams>()

  // Теперь TypeScript знает что id - строка
  return <div>{id}</div>
}
```

Если параметров несколько, добавьте их в тип.

### Как обрабатывать динамические маршруты на уровне nginx или другого reverse-proxy

Если у вас есть SPA с динамическими маршрутами (например React Router), proxy-сервер может пытаться искать реальные файлы по пути /users/10. Чтобы все такие запросы попадали на index.html, в nginx обычно добавляют:

```nginx
location / {
  try_files $uri /index.html;
}
```

Так любой несуществующий файл будет обслуживаться SPA-приложением, а уже внутри него router разберет dynamic-routes.

### Как запретить доступ к определенным значениям параметров в dynamic-routes

Например, вы хотите закрыть /users/admin, но оставить /users/1, /users/2. Можно сделать проверку внутри обработчика:

```js
app.get('/users/:id', (req, res) => {
  const { id } = req.params

  if (id === 'admin') {
    res.status(403).send('Доступ запрещен')
    return
  }

  // Обычная логика обработки маршрута
  res.send(`Пользователь ${id}`)
})
```

В клиентских фреймворках (Next.js, React Router) подход аналогичный — валидируете params и, если нужно, отдаете 404 или редиректите на другую страницу.

### Как реализовать локализацию с динамическими маршрутами

Часто нужен префикс языка перед всеми путями: /en/users/1, /ru/users/1. Один из вариантов:

- на сервере добавить язык в начало пути, например /:locale/users/:id;
- в Next.js использовать i18n-routing и структуру /[locale]/users/[id];
- внутри компонентов использовать params.locale или контекст локализации, чтобы подгружать нужные переводы и форматировать данные.