---
metaTitle: "Хук use() в React 19 — работа с Promise и Context"
metaDescription: "Разбираем хук use() в React 19: чтение Promise внутри компонентов, условное использование Context, интеграция с Suspense и Error Boundary."
author: "Антон Ларичев"
title: "Хук use() в React 19"
preview: "Хук use() в React 19 позволяет читать Promise и Context прямо внутри рендера — без useEffect и промежуточных состояний."
---

## Что такое хук use()

В React 19 появился новый встроенный хук `use()`, который принципиально отличается от всех остальных хуков. Он позволяет читать значение **ресурса** прямо во время рендера: будь то `Promise` или объект контекста (`Context`).

Главное отличие `use()` от привычных хуков — его можно вызывать **условно**: внутри `if`, циклов, вложенных функций. Это нарушает одно из базовых правил React-хуков, которое гласит «не вызывай хуки условно» — но для `use()` это правило специально не применяется.

```typescript
import { use } from 'react';

function UserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // React «приостановит» компонент до разрешения Promise

  return <div>{user.name}</div>;
}
```

## Использование use() с Promise

### Базовый принцип работы

Когда `use()` получает `Promise`, React приостанавливает рендер компонента (аналогично механизму Suspense) и ждёт, пока промис не разрешится. После этого компонент рендерится заново уже с готовым значением.

Для корректной работы необходимо обернуть компонент в `<Suspense>`, чтобы показать пользователю состояние загрузки:

```typescript
import { use, Suspense } from 'react';

interface Post {
  id: number;
  title: string;
  body: string;
}

function PostContent({ postPromise }: { postPromise: Promise<Post> }) {
  const post = use(postPromise);

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </article>
  );
}

function PostPage({ id }: { id: number }) {
  const postPromise = fetch(`/api/posts/${id}`).then(res => res.json());

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <PostContent postPromise={postPromise} />
    </Suspense>
  );
}
```

### Важно: создавайте Promise вне компонента

Передача промиса, созданного прямо при рендере родителя, приведёт к бесконечной перезагрузке — каждый рендер создаёт новый промис. Правильный подход — создавать промис вне компонента или кэшировать его:

```typescript
import { use, Suspense, useState } from 'react';

// Правильно: промис создаётся один раз вне компонента
const userPromise = fetch('/api/user/1').then(res => res.json());

function UserProfile() {
  const user = use(userPromise);
  return <p>Привет, {user.name}!</p>;
}

// Или через состояние родителя, которое не меняется при ре-рендере
function App() {
  const [postPromise] = useState(() =>
    fetch('/api/posts/1').then(res => res.json())
  );

  return (
    <Suspense fallback={<p>Загрузка поста...</p>}>
      <PostContent postPromise={postPromise} />
    </Suspense>
  );
}
```

### Обработка ошибок через Error Boundary

Если промис отклоняется (rejected), `use()` выбрасывает ошибку. Её нужно перехватить с помощью Error Boundary:

```typescript
import { use, Suspense, Component } from 'react';

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function UserData({ promise }: { promise: Promise<User> }) {
  const user = use(promise);
  return <span>{user.name}</span>;
}

function App() {
  const userPromise = fetchUser(1);

  return (
    <ErrorBoundary fallback={<p>Не удалось загрузить данные</p>}>
      <Suspense fallback={<p>Загрузка...</p>}>
        <UserData promise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Использование use() с Context

`use()` может заменять `useContext()`, но с важным преимуществом: его можно вызывать **внутри условных выражений**.

```typescript
import { use, createContext } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemeIcon({ showTheme }: { showTheme: boolean }) {
  // useContext нельзя вызвать здесь условно, use() — можно
  if (showTheme) {
    const theme = use(ThemeContext);
    return <span>Тема: {theme}</span>;
  }

  return null;
}
```

### Сравнение useContext и use

```typescript
import { useContext, use, createContext } from 'react';

const AuthContext = createContext<{ isAdmin: boolean } | null>(null);

// Старый подход — нельзя вызывать условно
function AdminPanel_Old({ showPanel }: { showPanel: boolean }) {
  const auth = useContext(AuthContext); // всегда вызывается, даже если не нужен

  if (!showPanel) return null;

  return auth?.isAdmin ? <div>Панель администратора</div> : null;
}

// Новый подход с use() — вызываем только когда нужно
function AdminPanel_New({ showPanel }: { showPanel: boolean }) {
  if (!showPanel) return null;

  const auth = use(AuthContext); // вызываем только при showPanel === true
  return auth?.isAdmin ? <div>Панель администратора</div> : null;
}
```

## Паттерн: передача Promise сверху вниз

Один из ключевых паттернов React 19 — **поднять создание промиса в родительский компонент** и передавать его дочерним через пропсы. Это позволяет начать загрузку данных как можно раньше:

```typescript
import { use, Suspense, useState } from 'react';

interface Comment {
  id: number;
  text: string;
  author: string;
}

interface Article {
  title: string;
  content: string;
}

async function fetchArticle(id: number): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`);
  if (!res.ok) throw new Error('Статья не найдена');
  return res.json();
}

async function fetchComments(articleId: number): Promise<Comment[]> {
  const res = await fetch(`/api/articles/${articleId}/comments`);
  if (!res.ok) throw new Error('Комментарии недоступны');
  return res.json();
}

function ArticleBody({ articlePromise }: { articlePromise: Promise<Article> }) {
  const article = use(articlePromise);
  return (
    <div>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </div>
  );
}

function CommentList({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  return (
    <ul>
      {comments.map(c => (
        <li key={c.id}>
          <strong>{c.author}:</strong> {c.text}
        </li>
      ))}
    </ul>
  );
}

// Оба запроса стартуют параллельно — Promise создаётся в родителе
function ArticlePage({ articleId }: { articleId: number }) {
  const [articlePromise] = useState(() => fetchArticle(articleId));
  const [commentsPromise] = useState(() => fetchComments(articleId));

  return (
    <div>
      <Suspense fallback={<p>Загрузка статьи...</p>}>
        <ArticleBody articlePromise={articlePromise} />
      </Suspense>
      <Suspense fallback={<p>Загрузка комментариев...</p>}>
        <CommentList commentsPromise={commentsPromise} />
      </Suspense>
    </div>
  );
}
```

Благодаря тому, что оба промиса создаются в `ArticlePage` одновременно, запросы идут параллельно — нет «водопада» (waterfall), как это случалось при использовании `useEffect`.

## Сравнение с useEffect

Традиционный подход с `useEffect` порождает дополнительные состояния, условный рендер и «мигание» UI:

```typescript
// Старый подход с useEffect
function UserCard_Old({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error.message}</p>;
  if (!user) return null;

  return <div>{user.name}</div>;
}

// Новый подход с use()
function UserCard_New({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // чисто и прямолинейно
  return <div>{user.name}</div>;
}
```

Логику загрузки и ошибок `use()` делегирует `Suspense` и `ErrorBoundary` — компонент остаётся чистым и отвечает только за отображение данных.

## Ограничения хука use()

### Только клиентские и серверные компоненты

`use()` работает в обоих типах компонентов, но семантика отличается. В серверных компонентах React лучше использовать `async/await` напрямую, так как серверный рендер не имеет понятия «приостановить и возобновить»:

```typescript
// Серверный компонент — используй async/await
async function ServerUserCard({ userId }: { userId: number }) {
  const user = await fetchUser(userId); // предпочтительно на сервере
  return <div>{user.name}</div>;
}

// Клиентский компонент — используй use()
'use client';
function ClientUserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // подходит для клиента
  return <div>{user.name}</div>;
}
```

### use() нельзя использовать внутри try/catch

```typescript
function Component({ promise }: { promise: Promise<Data> }) {
  // Не делай так — это не работает
  try {
    const data = use(promise);
    return <div>{data.value}</div>;
  } catch (e) {
    return <div>Ошибка</div>;
  }

  // Правильно: используй ErrorBoundary снаружи
}
```

Ошибки из `use()` должны перехватываться Error Boundary-компонентом, а не `try/catch` внутри функции рендера.

## Практический пример: поиск с use()

```typescript
import { use, Suspense, useState, useTransition } from 'react';

interface SearchResult {
  id: number;
  name: string;
}

function searchProducts(query: string): Promise<SearchResult[]> {
  return fetch(`/api/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json());
}

function SearchResults({ resultsPromise }: { resultsPromise: Promise<SearchResult[]> }) {
  const results = use(resultsPromise);

  if (results.length === 0) {
    return <p>Ничего не найдено</p>;
  }

  return (
    <ul>
      {results.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const [resultsPromise, setResultsPromise] = useState<Promise<SearchResult[]>>(
    () => Promise.resolve([])
  );
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    startTransition(() => {
      // useTransition откладывает обновление промиса,
      // пока не будут готовы новые данные
      setResultsPromise(searchProducts(value));
    });
  }

  return (
    <div>
      <input
        value={query}
        onChange={handleSearch}
        placeholder="Поиск товаров..."
      />
      {isPending && <p>Поиск...</p>}
      <Suspense fallback={<p>Загрузка результатов...</p>}>
        <SearchResults resultsPromise={resultsPromise} />
      </Suspense>
    </div>
  );
}
```

Использование `useTransition` вместе с `use()` — рекомендуемый паттерн: переход считается «неприоритетным», и React не блокирует UI на время ожидания нового промиса.

## Итог

Хук `use()` — это фундаментальное изменение в модели работы с асинхронными данными в React:

- Позволяет читать `Promise` прямо во время рендера без `useEffect` и промежуточных состояний
- Может вызываться условно, в отличие от других хуков
- Заменяет `useContext()` там, где нужна условная читаемость контекста
- Делегирует состояния загрузки и ошибок `Suspense` и `Error Boundary`
- Хорошо работает в связке с `useTransition` для плавной смены данных

Для освоения React 19 и всех новых возможностей — включая серверные компоненты, Server Actions и обновлённую модель работы с данными — смотри курс на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=use-hook-react-19