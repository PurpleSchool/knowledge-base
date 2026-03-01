# Асинхронные компоненты в React

**Асинхронные компоненты (Async Components)** — паттерн React, при котором компонент самостоятельно выполняет асинхронные операции (загрузку данных, обращения к API, чтение файлов) непосредственно в своём теле, используя `async/await`. В экосистеме React Server Components (Next.js App Router, React 19) этот подход стал первоклассным инструментом для работы с данными на стороне сервера.

```jsx
// Асинхронный серверный компонент — данные загружаются прямо в теле
async function UserProfile({ userId }) {
  const user = await fetchUser(userId);
  return <div>{user.name}</div>;
}
```

## Server Components и async/await

До появления React Server Components все асинхронные операции приходилось выносить в хуки (`useEffect`, `useState`) или внешние стейт-менеджеры. Server Components позволяют писать компоненты с `async/await` напрямую — React выполнит их на сервере и отправит клиенту уже готовый HTML.

### Основной синтаксис

```tsx
// app/users/[id]/page.tsx (Next.js App Router)
async function UserPage({ params }: { params: { id: string } }) {
  // Прямой вызов БД или API — без useEffect, без useState
  const user = await db.user.findUnique({ where: { id: params.id } });

  if (!user) {
    notFound(); // Next.js утилита для 404
  }

  return (
    <main>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </main>
  );
}

export default UserPage;
```

### Параллельная загрузка данных

```tsx
// ❌ Последовательно — медленно (waterfall)
async function DashboardPage() {
  const user = await fetchUser();       // ждём...
  const posts = await fetchPosts();     // потом ждём...
  const stats = await fetchStats();     // и снова ждём...

  return <Dashboard user={user} posts={posts} stats={stats} />;
}

// ✅ Параллельно — быстро (Promise.all)
async function DashboardPage() {
  const [user, posts, stats] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchStats(),
  ]);

  return <Dashboard user={user} posts={posts} stats={stats} />;
}
```

### Вложенные асинхронные компоненты

```tsx
// Каждый компонент загружает только свои данные
async function PostList({ authorId }: { authorId: string }) {
  const posts = await fetchPostsByAuthor(authorId);

  return (
    <ul>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </ul>
  );
}

async function PostItem({ post }: { post: Post }) {
  const comments = await fetchComments(post.id);

  return (
    <li>
      <h3>{post.title}</h3>
      <span>{comments.length} комментариев</span>
    </li>
  );
}
```

## Suspense — граница ожидания

`Suspense` — механизм React для декларативного управления состоянием загрузки. Пока асинхронный компонент (или ленивый импорт) выполняется, React отображает `fallback`. Как только данные готовы — заменяет его на реальный UI.

### Базовое использование

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<p>Загрузка...</p>}>
      <UserProfile userId="42" />
    </Suspense>
  );
}
```

### Стратегии размещения Suspense

```tsx
// ✅ Один Suspense для всей страницы — простой подход
function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

// ✅ Вложенные Suspense — разные части страницы грузятся независимо
function Dashboard() {
  return (
    <div className="dashboard">
      {/* Шапка грузится сразу */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <div className="dashboard-body">
        {/* Боковая панель и основной контент — независимо */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <Suspense fallback={<ContentSkeleton />}>
          <MainContent />
        </Suspense>
      </div>
    </div>
  );
}
```

### Skeleton-компоненты для fallback

```tsx
function UserCardSkeleton() {
  return (
    <div className="user-card skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-line" style={{ width: '60%' }} />
      <div className="skeleton-line" style={{ width: '80%' }} />
    </div>
  );
}

async function UserCard({ userId }: { userId: string }) {
  const user = await fetchUser(userId);

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
    </div>
  );
}

// Использование
function UserSection({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<UserCardSkeleton />}>
      <UserCard userId={userId} />
    </Suspense>
  );
}
```

## Загрузка данных с async-компонентами

### Fetch с кешированием (Next.js)

```tsx
// Next.js автоматически дедуплицирует одинаковые запросы
async function ProductList() {
  // force-cache (по умолчанию) — кешируется между запросами
  const products = await fetch('/api/products', {
    next: { revalidate: 60 }, // ISR: обновлять раз в 60 секунд
  }).then((r) => r.json());

  return (
    <ul>
      {products.map((p: Product) => (
        <li key={p.id}>{p.name} — {p.price} ₽</li>
      ))}
    </ul>
  );
}

async function ProductDetail({ id }: { id: string }) {
  // no-store — не кешировать (всегда свежие данные)
  const product = await fetch(`/api/products/${id}`, {
    cache: 'no-store',
  }).then((r) => r.json());

  return <ProductView product={product} />;
}
```

### Прямой доступ к базе данных

```tsx
import { prisma } from '@/lib/prisma';

async function ArticleList() {
  // Серверный компонент — можно обращаться к БД напрямую
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, title: true, slug: true, createdAt: true },
  });

  return (
    <section>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </section>
  );
}
```

### Передача промисов в клиентские компоненты (React 19)

```tsx
// page.tsx (Server Component)
import { use } from 'react';

async function Page() {
  // Передаём незавершённый промис — не ждём!
  const postsPromise = fetchPosts(); // Promise<Post[]>

  return (
    <Suspense fallback={<PostsSkeleton />}>
      <PostsClient postsPromise={postsPromise} />
    </Suspense>
  );
}

// PostsClient.tsx (Client Component)
'use client';

function PostsClient({ postsPromise }: { postsPromise: Promise<Post[]> }) {
  // use() разворачивает промис и интегрируется с Suspense
  const posts = use(postsPromise);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Обработка ошибок

### Error Boundary

```tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-state">
            <h2>Что-то пошло не так</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Попробовать снова
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

### Комбинирование ErrorBoundary и Suspense

```tsx
function SafeUserCard({ userId }: { userId: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-card">
          Не удалось загрузить пользователя
        </div>
      }
    >
      <Suspense fallback={<UserCardSkeleton />}>
        <UserCard userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### error.tsx в Next.js App Router

```tsx
// app/users/[id]/error.tsx
'use client';

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Ошибка загрузки пользователя</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Повторить</button>
    </div>
  );
}
```

### Обработка ошибок внутри async-компонента

```tsx
async function UserProfile({ userId }: { userId: string }) {
  try {
    const user = await fetchUser(userId);
    return <UserView user={user} />;
  } catch (error) {
    // Можно вернуть запасной UI прямо здесь
    // или пробросить ошибку в ErrorBoundary
    if (error instanceof NotFoundError) {
      return <p>Пользователь не найден</p>;
    }
    throw error; // Пробрасываем в ближайший ErrorBoundary
  }
}
```

## Лучшие практики

### 1. Разделяй ответственность: Server vs Client

```tsx
// ✅ Серверный компонент — только данные и разметка
async function ProductPage({ id }: { id: string }) {
  const product = await fetchProduct(id);
  return (
    <div>
      <ProductInfo product={product} />
      {/* Интерактивность — в клиентский компонент */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}

// ✅ Клиентский компонент — только интерактивность
'use client';
function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  return (
    <button onClick={() => setAdded(true)}>
      {added ? 'Добавлено' : 'В корзину'}
    </button>
  );
}
```

### 2. Размещай Suspense как можно ближе к источнику данных

```tsx
// ❌ Плохо — Suspense слишком высоко, блокирует всю страницу
function Page() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Header />        {/* Не требует данных */}
      <Navigation />    {/* Не требует данных */}
      <UserPosts />     {/* Требует данных */}
    </Suspense>
  );
}

// ✅ Хорошо — оборачиваем только то, что реально ждёт данные
function Page() {
  return (
    <>
      <Header />
      <Navigation />
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts />
      </Suspense>
    </>
  );
}
```

### 3. Используй generateStaticParams для статической генерации

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetchPostBySlug(params.slug);
  return <PostContent post={post} />;
}

export default BlogPost;
```

### 4. Не злоупотребляй глубиной вложенности

```tsx
// ❌ Каскадные запросы — каждый ждёт предыдущего
async function OrderDetails({ orderId }: { orderId: string }) {
  const order = await fetchOrder(orderId);
  const user = await fetchUser(order.userId);     // ждёт order
  const items = await fetchOrderItems(order.id);  // ждёт order
  const shipping = await fetchShipping(order.id); // ждёт order

  return <OrderView order={order} user={user} items={items} shipping={shipping} />;
}

// ✅ Параллельные запросы там, где нет зависимостей
async function OrderDetails({ orderId }: { orderId: string }) {
  const order = await fetchOrder(orderId);

  // user, items и shipping не зависят друг от друга — грузим параллельно
  const [user, items, shipping] = await Promise.all([
    fetchUser(order.userId),
    fetchOrderItems(order.id),
    fetchShipping(order.id),
  ]);

  return <OrderView order={order} user={user} items={items} shipping={shipping} />;
}
```

### 5. TypeScript: типизируй пропсы и возвращаемые значения

```tsx
import { Suspense } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`Пользователь ${id} не найден`);
  return res.json();
}

// JSX.Element обычно выводится автоматически, но явная типизация помогает
async function UserCard({ userId }: { userId: string }): Promise<JSX.Element> {
  const user = await fetchUser(userId);
  return (
    <div className="user-card">
      <img src={user.avatarUrl} alt={user.name} />
      <strong>{user.name}</strong>
      <span>{user.email}</span>
    </div>
  );
}
```

## Антипаттерны

### useEffect для загрузки данных в Server Components

```tsx
// ❌ Плохо — useEffect для загрузки данных устарел при наличии async-компонентов
'use client';
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

// ✅ Хорошо — async Server Component с Suspense
async function UserList() {
  const users = await fetchUsers();
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

function UserSection() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserList />
    </Suspense>
  );
}
```

### Отсутствие обработки ошибок

```tsx
// ❌ Плохо — нет обработки ошибок, приложение упадёт
async function Posts() {
  const posts = await fetchPosts(); // Что если API недоступен?
  return <PostList posts={posts} />;
}

// ✅ Хорошо — каждый уровень защищён
function PostsSection() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Передача функций и секретов клиенту через async-компоненты

```tsx
// ❌ Плохо — приватные данные могут утечь на клиент
async function SecretComponent() {
  const data = await fetchSensitiveData(); // содержит токены, пароли и т.д.
  return <ClientComponent data={data} />; // всё пропсы сериализуются!
}

// ✅ Хорошо — передавай только то, что нужно для UI
async function SecretComponent() {
  const rawData = await fetchSensitiveData();
  const safeData = { id: rawData.id, displayName: rawData.displayName };
  return <ClientComponent data={safeData} />;
}
```

## Сравнение подходов к загрузке данных

| Подход | Среда | Когда использовать |
|--------|-------|-------------------|
| `async` Server Component | Сервер | Основная загрузка данных, SEO, первичный рендер |
| `use(promise)` | Клиент + Suspense | Потоковая передача данных с сервера на клиент |
| `useEffect` + `useState` | Клиент | Данные, зависящие от действий пользователя |
| SWR / React Query | Клиент | Кеширование, фоновое обновление, мутации |
| `getServerSideProps` | Сервер (Pages Router) | Легаси Next.js Pages Router |

## Резюме

Асинхронные компоненты с `async/await` — современный стандарт работы с данными в React Server Components. Ключевые правила:

| Правило | Описание |
|---------|---------|
| `async/await` в теле | Серверные компоненты поддерживают `async` нативно |
| `Suspense` для загрузки | Оборачивай async-компоненты в `Suspense` с `fallback` |
| `ErrorBoundary` для ошибок | Всегда добавляй обработку ошибок рядом с Suspense |
| `Promise.all` для параллельности | Независимые запросы — параллельно |
| Минимальный client-bundle | Переноси логику данных на сервер, клиенту — только UI |

## Дополнительные ресурсы

- [React Server Components — React Docs](https://react.dev/reference/rsc/server-components)
- [Suspense — React Docs](https://react.dev/reference/react/Suspense)
- [use() hook — React Docs](https://react.dev/reference/react/use)
- [Data Fetching — Next.js Docs](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Error Handling — Next.js Docs](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
