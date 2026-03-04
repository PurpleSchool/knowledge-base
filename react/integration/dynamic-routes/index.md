---
metaTitle: Динамические маршруты в React Router — useParams, вложенные и генерируемые пути
metaDescription: Подробное руководство по динамическим маршрутам в React Router v6. Параметры URL, useParams, wildcard-маршруты, программная генерация путей, index-маршруты и breadcrumbs
author: Олег Марков
title: Динамические маршруты
preview: Научитесь работать с динамическими маршрутами в React Router v6 — параметры URL, вложенные динамические пути, wildcard-маршруты, breadcrumbs и генерация ссылок через useHref
---

## Введение

Статические маршруты вроде `/about` или `/contacts` — это лишь часть реальных приложений. Большинство страниц требуют **динамических маршрутов**: страница товара `/products/42`, профиль пользователя `/users/john-doe`, ветка форума `/categories/react/topics/hooks`.

**Динамический маршрут** — это маршрут с переменными частями, которые определяются во время навигации, а не при написании кода. React Router v6 предоставляет мощный и гибкий механизм для работы с ними.

## Базовые параметры маршрута

### Синтаксис `:paramName`

Динамические сегменты обозначаются двоеточием перед именем:

```tsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {/* :userId — динамический сегмент */}
      <Route path="/users/:userId" element={<UserProfile />} />

      {/* :categoryId и :productId — несколько параметров */}
      <Route path="/categories/:categoryId/products/:productId" element={<ProductDetail />} />

      {/* :year, :month, :day — дата в URL */}
      <Route path="/blog/:year/:month/:day/:slug" element={<BlogPost />} />
    </Routes>
  );
}
```

### useParams — чтение параметров

```tsx
import { useParams } from 'react-router-dom';

function UserProfile() {
  // Тип выводится как Record<string, string | undefined>
  const { userId } = useParams<{ userId: string }>();

  return <h1>Профиль пользователя: {userId}</h1>;
}

function ProductDetail() {
  const { categoryId, productId } = useParams<{
    categoryId: string;
    productId: string;
  }>();

  return (
    <div>
      <p>Категория: {categoryId}</p>
      <p>Товар: {productId}</p>
    </div>
  );
}

function BlogPost() {
  const { year, month, day, slug } = useParams<{
    year: string;
    month: string;
    day: string;
    slug: string;
  }>();

  return (
    <article>
      <p>Опубликовано: {year}-{month}-{day}</p>
      <h1>Статья: {slug}</h1>
    </article>
  );
}
```

### Загрузка данных по параметру

Типичный паттерн — загрузка данных на основе параметра из URL:

```tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Товар не найден (${res.status})`);
        return res.json();
      })
      .then((data: Product) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]); // Перезагружаем при смене productId

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return null;

  return (
    <div>
      <img src={product.imageUrl} alt={product.name} />
      <h1>{product.name}</h1>
      <p>{product.price} ₽</p>
      <p>{product.description}</p>
    </div>
  );
}
```

## Опциональные параметры

React Router v6 не поддерживает опциональные параметры напрямую (вроде `:id?`), но их можно реализовать через несколько маршрутов:

```tsx
<Routes>
  {/* Маршрут без фильтра */}
  <Route path="/products" element={<ProductsList />} />
  {/* Маршрут с категорией */}
  <Route path="/products/:category" element={<ProductsList />} />
  {/* Маршрут с категорией и подкатегорией */}
  <Route path="/products/:category/:subcategory" element={<ProductsList />} />
</Routes>
```

```tsx
function ProductsList() {
  const { category, subcategory } = useParams<{
    category?: string;
    subcategory?: string;
  }>();

  // category и subcategory могут быть undefined
  const title = subcategory
    ? `${category} / ${subcategory}`
    : category
    ? category
    : 'Все товары';

  return (
    <div>
      <h1>{title}</h1>
      {/* Фильтруем товары по параметрам */}
      <ProductsGrid category={category} subcategory={subcategory} />
    </div>
  );
}
```

## Wildcard-маршруты (`*`)

Символ `*` соответствует любому количеству сегментов пути:

```tsx
<Routes>
  {/* Обработка 404 */}
  <Route path="*" element={<NotFoundPage />} />

  {/* Передача управления вложенному роутеру */}
  <Route path="/docs/*" element={<DocsSection />} />
</Routes>
```

### Вложенные Routes с wildcard

`*` позволяет создавать автономные секции приложения со своим роутингом:

```tsx
// App.tsx — передаём /docs/* в DocsSection
<Route path="/docs/*" element={<DocsSection />} />

// DocsSection.tsx — свои Routes внутри
function DocsSection() {
  return (
    <div className="docs-layout">
      <DocsSidebar />
      <main>
        <Routes>
          {/* Эти пути относительны к /docs/ */}
          <Route index element={<DocsIndex />} />
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="api/:component" element={<ApiDocs />} />
          <Route path="guides/:guide" element={<Guide />} />
          <Route path="*" element={<DocsNotFound />} />
        </Routes>
      </main>
    </div>
  );
}
```

### Получение wildcard-части пути

```tsx
import { useParams } from 'react-router-dom';

function CatchAll() {
  const params = useParams();
  // params['*'] содержит совпавшую часть пути
  const splat = params['*'];

  return <p>Неизвестный путь: /{splat}</p>;
}
```

## Относительные пути и навигация

В вложенных маршрутах можно использовать **относительные пути**:

```tsx
function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Пользователь {userId}</h1>

      {/* Относительные ссылки */}
      <Link to="edit">Редактировать</Link>      {/* /users/:userId/edit */}
      <Link to="posts">Посты</Link>             {/* /users/:userId/posts */}
      <Link to="..">← К списку пользователей</Link>  {/* /users */}
      <Link to="../123">Другой пользователь</Link>   {/* /users/123 */}

      {/* Программная навигация */}
      <button onClick={() => navigate('edit')}>Редактировать</button>
      <button onClick={() => navigate(-1)}>Назад</button>
    </div>
  );
}
```

## generatePath — генерация путей программно

`generatePath` создаёт URL из шаблона и параметров — удобно для централизованного управления маршрутами:

```tsx
import { generatePath, Link, useNavigate } from 'react-router-dom';

// Централизованные шаблоны маршрутов
const ROUTES = {
  HOME: '/',
  USERS: '/users',
  USER_PROFILE: '/users/:userId',
  USER_POSTS: '/users/:userId/posts',
  USER_POST: '/users/:userId/posts/:postId',
  PRODUCT: '/categories/:categoryId/products/:productId',
} as const;

// Генерация URL из шаблона
const profileUrl = generatePath(ROUTES.USER_PROFILE, { userId: '42' });
// → '/users/42'

const postUrl = generatePath(ROUTES.USER_POST, {
  userId: '42',
  postId: '123',
});
// → '/users/42/posts/123'

const productUrl = generatePath(ROUTES.PRODUCT, {
  categoryId: 'electronics',
  productId: 'iphone-15',
});
// → '/categories/electronics/products/iphone-15'

// Использование в компоненте
function UserCard({ user }: { user: User }) {
  const navigate = useNavigate();

  return (
    <div>
      <Link to={generatePath(ROUTES.USER_PROFILE, { userId: user.id })}>
        {user.name}
      </Link>
      <button
        onClick={() =>
          navigate(generatePath(ROUTES.USER_POSTS, { userId: user.id }))
        }
      >
        Посты
      </button>
    </div>
  );
}
```

## Вложенные динамические маршруты

Реальное приложение часто имеет несколько уровней вложенности:

```tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* /forum */}
          <Route path="forum" element={<ForumLayout />}>
            {/* /forum */}
            <Route index element={<ForumHome />} />

            {/* /forum/:categorySlug */}
            <Route path=":categorySlug" element={<CategoryView />}>
              {/* /forum/:categorySlug */}
              <Route index element={<TopicsList />} />

              {/* /forum/:categorySlug/:topicId */}
              <Route path=":topicId" element={<TopicView />}>
                {/* /forum/:categorySlug/:topicId */}
                <Route index element={<TopicPosts />} />

                {/* /forum/:categorySlug/:topicId/reply */}
                <Route path="reply" element={<ReplyForm />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// В компоненте доступны ВСЕ параметры из родительских маршрутов
function TopicView() {
  const { categorySlug, topicId } = useParams<{
    categorySlug: string;
    topicId: string;
  }>();

  return (
    <div>
      <Breadcrumbs category={categorySlug} topicId={topicId} />
      <Outlet />
    </div>
  );
}
```

## Breadcrumbs из параметров маршрута

Динамические маршруты удобно использовать для хлебных крошек:

```tsx
import { useParams, Link, useMatches } from 'react-router-dom';

interface MatchHandle {
  crumb?: (params: Record<string, string | undefined>) => React.ReactNode;
}

// Определяем маршруты с handle для breadcrumbs
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    handle: { crumb: () => <Link to="/">Главная</Link> },
    children: [
      {
        path: 'categories',
        element: <CategoriesPage />,
        handle: { crumb: () => <Link to="/categories">Категории</Link> },
        children: [
          {
            path: ':categoryId',
            element: <CategoryPage />,
            loader: ({ params }) => fetchCategory(params.categoryId!),
            handle: {
              crumb: (params) => (
                <Link to={`/categories/${params.categoryId}`}>
                  {params.categoryId} {/* В реальном приложении — название из loader */}
                </Link>
              ),
            },
            children: [
              {
                path: 'products/:productId',
                element: <ProductPage />,
                handle: {
                  crumb: (params) => (
                    <span>{params.productId}</span>
                  ),
                },
              },
            ],
          },
        ],
      },
    ],
  },
]);

// Компонент Breadcrumbs
function Breadcrumbs() {
  const matches = useMatches();
  const params = useParams();

  const crumbs = matches
    .filter((match) => Boolean((match.handle as MatchHandle)?.crumb))
    .map((match) => ({
      key: match.pathname,
      crumb: (match.handle as MatchHandle).crumb!(params),
    }));

  return (
    <nav aria-label="breadcrumb">
      <ol>
        {crumbs.map(({ key, crumb }, index) => (
          <li key={key}>
            {index < crumbs.length - 1 ? (
              <>
                {crumb}
                <span aria-hidden> / </span>
              </>
            ) : (
              <span aria-current="page">{crumb}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## Index-маршруты

**Index-маршрут** (`index` вместо `path`) — маршрут по умолчанию для родительского пути:

```tsx
<Route path="/dashboard" element={<DashboardLayout />}>
  {/* Рендерится при точном совпадении /dashboard */}
  <Route index element={<DashboardHome />} />

  {/* /dashboard/analytics */}
  <Route path="analytics" element={<Analytics />} />

  {/* /dashboard/reports */}
  <Route path="reports" element={<Reports />} />
</Route>
```

```tsx
function DashboardLayout() {
  return (
    <div>
      <nav>
        <Link to="/dashboard">Обзор</Link>
        <Link to="/dashboard/analytics">Аналитика</Link>
        <Link to="/dashboard/reports">Отчёты</Link>
      </nav>
      <Outlet />
      {/* При /dashboard — рендерится DashboardHome */}
      {/* При /dashboard/analytics — рендерится Analytics */}
    </div>
  );
}
```

## Паттерн: типизированные маршруты

Для TypeScript-проектов удобно создать типизированные утилиты для маршрутов:

```typescript
// routes.ts — централизованное описание всех маршрутов
const routes = {
  home: () => '/',
  users: () => '/users',
  user: (userId: string) => `/users/${userId}`,
  userPosts: (userId: string) => `/users/${userId}/posts`,
  userPost: (userId: string, postId: string) =>
    `/users/${userId}/posts/${postId}`,
  product: (categoryId: string, productId: string) =>
    `/categories/${categoryId}/products/${productId}`,
} as const;

// Использование
<Link to={routes.user('42')}>Профиль</Link>
<Link to={routes.product('electronics', 'iphone-15')}>iPhone 15</Link>

// В navigate
navigate(routes.userPosts(userId));
```

## Обработка несуществующих записей

При загрузке данных по динамическому параметру важно правильно обрабатывать ситуацию, когда запись не найдена:

```tsx
// Через useLoaderData и loader
const router = createBrowserRouter([
  {
    path: '/users/:userId',
    loader: async ({ params }) => {
      const response = await fetch(`/api/users/${params.userId}`);
      if (response.status === 404) {
        // Response будет поймана ErrorBoundary или errorElement
        throw new Response('Пользователь не найден', { status: 404 });
      }
      return response.json();
    },
    element: <UserProfile />,
    // errorElement рендерится при ошибке в loader
    errorElement: <UserNotFound />,
  },
]);

function UserNotFound() {
  const error = useRouteError() as Response;
  return (
    <div>
      <h1>404</h1>
      <p>{error.statusText}</p>
      <Link to="/users">Вернуться к списку</Link>
    </div>
  );
}
```

## Заключение

Динамические маршруты — фундамент современных React-приложений. React Router v6 предоставляет все необходимые инструменты:

- **`:paramName`** — захват динамических сегментов URL
- **`useParams`** — чтение параметров в компонентах
- **Wildcard `*`** — гибкий захват оставшейся части пути
- **`generatePath`** — типобезопасная генерация URL
- **Вложенные маршруты** через `Outlet` для многоуровневой навигации
- **Index-маршруты** для страниц по умолчанию
- **`useMatches`** — для сложных задач вроде breadcrumbs

Освоив динамические маршруты, вы сможете построить навигационную структуру любой сложности — от простого блога до многоуровневого корпоративного портала.
