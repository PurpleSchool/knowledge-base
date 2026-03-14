---
metaTitle: Загрузка и индикаторы в React - Loading States и Skeleton
metaDescription: Как реализовать индикаторы загрузки в React: спиннеры, skeleton loading, Suspense, progress bar и оптимистичные обновления
author: Олег Марков
title: Загрузка и индикаторы
preview: Изучите паттерны загрузки данных в React: спиннеры, skeleton экраны, Suspense и оптимистичные обновления для лучшего UX
---

## Введение

Каждое приложение работает с асинхронными операциями: загружает данные с сервера, обрабатывает файлы, выполняет долгие вычисления. Пока операция идёт, пользователь ждёт — и именно в этот момент решается, считает ли он приложение быстрым и отзывчивым.

Хорошо реализованные индикаторы загрузки — это не украшение, а необходимый элемент UX. Они сообщают пользователю: «система работает, подожди немного». Без них пользователь не понимает, что происходит, и начинает нажимать кнопки снова, обновлять страницу или уходить.

В этой статье вы узнаете, как управлять состояниями загрузки в React: от простого `useState` до глобальных индикаторов и оптимистичных обновлений. Разберём спиннеры, skeleton screens, progress bar, React Suspense и интеграцию с популярными библиотеками запросов.

## Зачем нужны индикаторы загрузки

Хорошие индикаторы загрузки решают несколько UX-задач одновременно:

**Снижение воспринимаемого времени ожидания.** Исследования показывают, что анимированный индикатор делает ожидание субъективно короче. Пользователь видит, что приложение «живое», и терпеливее ждёт результата.

**Предотвращение двойных действий.** Если кнопка «Отправить» не реагирует — пользователь нажимает ещё раз. Индикатор и блокировка кнопки предотвращают дублирование запросов.

**Снижение тревожности.** Пустой экран или зависший интерфейс вызывают стресс. Индикатор загрузки успокаивает: система работает, скоро всё будет.

**Управление ожиданиями.** Progress bar с реальным прогрессом даёт пользователю ориентир: сколько ещё ждать.

## Управление loading состоянием с useState

Самый базовый подход — хранить состояние загрузки в `useState`. Этот паттерн подходит для большинства простых случаев.

```tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки');
        return res.json();
      })
      .then(data => {
        setUser(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error">{error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

Обратите внимание: `setLoading(true)` и `setError(null)` вызываются при каждом изменении `userId`, а `setLoading(false)` — в блоке `finally`, который выполняется и при успехе, и при ошибке.

### Кастомный хук useAsync

Если паттерн повторяется в нескольких компонентах, вынесите логику в кастомный хук:

```tsx
import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Неизвестная ошибка',
      });
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

// Использование
function UserList() {
  const { data: users, loading, error, refetch } = useAsync(
    () => fetch('/api/users').then(r => r.json()),
    []
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Спиннеры и лоадеры

### CSS анимации

Простой спиннер можно сделать с помощью CSS-анимации без дополнительных зависимостей:

```tsx
// Spinner.tsx
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Spinner({ size = 'md', color = '#6366f1' }: SpinnerProps) {
  const sizes = { sm: 16, md: 32, lg: 48 };
  const px = sizes[size];

  return (
    <div
      className="spinner"
      style={{
        width: px,
        height: px,
        borderColor: `${color}33`,
        borderTopColor: color,
      }}
      role="status"
      aria-label="Загрузка..."
    />
  );
}
```

```css
/* Spinner.css */
.spinner {
  border: 3px solid;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Библиотека react-spinners

Для более богатого набора анимаций используйте `react-spinners`:

```bash
npm install react-spinners
```

Библиотека предоставляет более 20 различных типов спиннеров:

```tsx
import { ClipLoader, BeatLoader, PulseLoader, BarLoader } from 'react-spinners';

function LoadingExamples() {
  return (
    <div>
      {/* Классический крутящийся кружок */}
      <ClipLoader color="#6366f1" size={35} />

      {/* Три точки */}
      <BeatLoader color="#6366f1" />

      {/* Пульсирующий */}
      <PulseLoader color="#6366f1" />

      {/* Прогресс-бар */}
      <BarLoader color="#6366f1" width={200} />
    </div>
  );
}
```

Вы можете управлять видимостью через пропс `loading`:

```tsx
import { ClipLoader } from 'react-spinners';

function SubmitButton({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={isLoading} className="btn">
      {isLoading ? (
        <ClipLoader color="#ffffff" size={18} />
      ) : (
        'Отправить'
      )}
    </button>
  );
}
```

### Оверлей загрузки

Для блокировки всего интерфейса во время операции используйте оверлей:

```tsx
import { ClipLoader } from 'react-spinners';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

function LoadingOverlay({ isLoading, children, message = 'Загрузка...' }: LoadingOverlayProps) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            zIndex: 10,
          }}
        >
          <ClipLoader color="#6366f1" size={40} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

// Использование
function DataTable({ data, isRefreshing }) {
  return (
    <LoadingOverlay isLoading={isRefreshing} message="Обновление данных...">
      <table>
        {/* содержимое таблицы */}
      </table>
    </LoadingOverlay>
  );
}
```

## Skeleton Loading

Skeleton loading (скелетные экраны) — паттерн, при котором вместо реального контента показывается анимированная «заглушка» в форме будущего контента. Это значительно лучше воспринимается пользователями по сравнению со спиннером: они видят структуру страницы ещё до загрузки данных.

Исследования показали, что skeleton screens воспринимаются на 20% быстрее, чем классические спиннеры.

### Простой Skeleton компонент

```tsx
import './Skeleton.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}
```

```css
/* Skeleton.css */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Skeleton для карточки пользователя

```tsx
function UserCardSkeleton() {
  return (
    <div className="user-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Аватар */}
        <Skeleton width={48} height={48} borderRadius="50%" />
        <div style={{ flex: 1 }}>
          {/* Имя */}
          <Skeleton width="60%" height={16} />
          <div style={{ marginTop: 8 }}>
            {/* Email */}
            <Skeleton width="80%" height={12} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {/* Описание */}
        <Skeleton height={12} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="75%" height={12} />
        </div>
      </div>
    </div>
  );
}

// Компонент с переключением skeleton/контент
function UserCard({ userId }: { userId: number }) {
  const { data: user, loading } = useAsync(
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    [userId]
  );

  if (loading) return <UserCardSkeleton />;

  return (
    <div className="user-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={user.avatar} width={48} height={48} style={{ borderRadius: '50%' }} />
        <div>
          <strong>{user.name}</strong>
          <p>{user.email}</p>
        </div>
      </div>
      <p>{user.bio}</p>
    </div>
  );
}
```

### Библиотека react-loading-skeleton

Для удобства можно использовать готовую библиотеку:

```bash
npm install react-loading-skeleton
```

```tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function ArticleCardSkeleton() {
  return (
    <div className="article-card">
      {/* Обложка */}
      <Skeleton height={200} />

      <div style={{ padding: 16 }}>
        {/* Теги */}
        <Skeleton width={80} height={20} />

        {/* Заголовок */}
        <Skeleton count={2} style={{ marginTop: 8 }} />

        {/* Описание */}
        <Skeleton count={3} height={14} style={{ marginTop: 12 }} />

        {/* Автор */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <Skeleton circle width={32} height={32} />
          <Skeleton width={100} height={14} />
        </div>
      </div>
    </div>
  );
}

// Список карточек со skeleton
function ArticleList() {
  const { data: articles, loading } = useAsync(
    () => fetch('/api/articles').then(r => r.json()),
    []
  );

  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

## Progress Bar для длительных операций

Для операций с известным прогрессом (загрузка файла, многошаговый процесс) используйте progress bar:

```tsx
interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: string;
}

function ProgressBar({ value, label, showPercent = true, color = '#6366f1' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        style={{
          height: 8,
          background: '#e5e7eb',
          borderRadius: 4,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
```

### Загрузка файла с прогрессом через XMLHttpRequest

```tsx
function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const uploadFile = (file: File) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        setProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      setUploading(false);
      setProgress(100);
    });

    xhr.addEventListener('error', () => {
      setUploading(false);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  return (
    <div>
      <input
        type="file"
        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && (
        <ProgressBar value={progress} label="Загрузка файла" />
      )}
    </div>
  );
}
```

### Многошаговый прогресс

```tsx
interface Step {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

function StepProgress({ steps }: { steps: Step[] }) {
  const completed = steps.filter(s => s.status === 'done').length;
  const progress = (completed / steps.length) * 100;

  return (
    <div>
      <ProgressBar value={progress} label={`Шаг ${completed} из ${steps.length}`} />
      <ul style={{ marginTop: 12, listStyle: 'none', padding: 0 }}>
        {steps.map(step => (
          <li key={step.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
            {step.status === 'done' && <span style={{ color: 'green' }}>✓</span>}
            {step.status === 'running' && <ClipLoader size={14} color="#6366f1" />}
            {step.status === 'error' && <span style={{ color: 'red' }}>✗</span>}
            {step.status === 'pending' && <span style={{ color: '#9ca3af' }}>○</span>}
            <span
              style={{
                color:
                  step.status === 'done' ? 'green' :
                  step.status === 'error' ? 'red' :
                  step.status === 'running' ? '#6366f1' :
                  '#9ca3af',
              }}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Suspense и React.lazy для ленивой загрузки

React предоставляет встроенные инструменты для управления загрузкой компонентов — `React.lazy` и `Suspense`.

### Ленивая загрузка компонентов

```tsx
import React, { Suspense, lazy } from 'react';

// Компоненты загружаются только при необходимости
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div>
      <nav>
        <button onClick={() => setPage('dashboard')}>Дашборд</button>
        <button onClick={() => setPage('analytics')}>Аналитика</button>
        <button onClick={() => setPage('settings')}>Настройки</button>
      </nav>

      <Suspense fallback={<div className="page-loading"><Spinner size="lg" /></div>}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'analytics' && <Analytics />}
        {page === 'settings' && <Settings />}
      </Suspense>
    </div>
  );
}
```

### Красивый fallback для Suspense

```tsx
function PageLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 16,
        color: '#6b7280',
      }}
    >
      <ClipLoader color="#6366f1" size={40} />
      <p>Загрузка страницы...</p>
    </div>
  );
}

// Или skeleton-версия
function PageSkeletonFallback() {
  return (
    <div style={{ padding: 24 }}>
      <Skeleton width={300} height={32} />
      <div style={{ marginTop: 24 }}>
        <Skeleton count={3} height={16} />
      </div>
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={150} />
            <Skeleton style={{ marginTop: 8 }} />
            <Skeleton width="60%" style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Suspense с React Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeletonFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### use() хук и серверные данные (React 19)

В React 19 появился хук `use()`, который позволяет использовать Suspense с промисами:

```tsx
import { use, Suspense } from 'react';

// Функция возвращает промис
async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

// Компонент, использующий use()
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // React приостанавливает рендеринг, пока промис не разрешится
  const user = use(userPromise);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Родительский компонент
function App() {
  const [userId, setUserId] = useState(1);
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<UserCardSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

## Оптимистичные обновления

Оптимистичные обновления (optimistic updates) — техника, при которой интерфейс обновляется немедленно, ещё до подтверждения от сервера. Это создаёт ощущение мгновенного отклика.

### Базовый паттерн

```tsx
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const toggleTodo = async (id: number) => {
    // 1. Немедленно обновляем UI (оптимистично)
    const previousTodos = todos;
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );

    try {
      // 2. Отправляем запрос на сервер
      await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
      // Успех — UI уже обновлён, ничего делать не нужно
    } catch (err) {
      // 3. При ошибке — откатываем к предыдущему состоянию
      setTodos(previousTodos);
      alert('Не удалось обновить задачу');
    }
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

### Оптимистичные обновления с временным ID

```tsx
interface Comment {
  id: number | string;
  text: string;
  author: string;
  isPending?: boolean;
}

function CommentSection({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');

  const addComment = async () => {
    const newText = text;
    setText('');

    // Оптимистично добавляем комментарий с временным ID
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      text: newText,
      author: 'Вы',
      isPending: true,
    };

    setComments(prev => [...prev, optimisticComment]);

    try {
      const saved = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      }).then(r => r.json());

      // Заменяем временный комментарий реальным
      setComments(prev =>
        prev.map(c => (c.id === tempId ? { ...saved, isPending: false } : c))
      );
    } catch {
      // Удаляем временный комментарий при ошибке
      setComments(prev => prev.filter(c => c.id !== tempId));
      setText(newText); // Возвращаем текст в поле ввода
    }
  };

  return (
    <div>
      <ul>
        {comments.map(comment => (
          <li
            key={comment.id}
            style={{ opacity: comment.isPending ? 0.6 : 1 }}
          >
            <strong>{comment.author}:</strong> {comment.text}
            {comment.isPending && <em> (отправка...)</em>}
          </li>
        ))}
      </ul>
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ваш комментарий..."
        />
        <button onClick={addComment} disabled={!text.trim()}>
          Отправить
        </button>
      </div>
    </div>
  );
}
```

## Глобальный индикатор загрузки с NProgress

NProgress — популярная библиотека для отображения тонкой полоски прогресса в верхней части страницы (как на GitHub или YouTube).

```bash
npm install nprogress
npm install @types/nprogress --save-dev
```

### Настройка NProgress

```tsx
// lib/nprogress.ts
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({
  minimum: 0.1,       // Начальный прогресс
  speed: 400,         // Скорость анимации
  trickleSpeed: 200,  // Скорость инкремента
  showSpinner: false, // Скрыть спиннер в углу
});

export function startProgress() {
  NProgress.start();
}

export function doneProgress() {
  NProgress.done();
}
```

### Кастомный цвет через CSS

```css
/* Добавьте в globals.css */
#nprogress .bar {
  background: #6366f1;
  height: 3px;
}

#nprogress .peg {
  box-shadow: 0 0 10px #6366f1, 0 0 5px #6366f1;
}
```

### Интеграция с React Router

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startProgress, doneProgress } from './lib/nprogress';

function NavigationProgress() {
  const location = useLocation();

  useEffect(() => {
    startProgress();
    // Имитируем завершение через небольшую задержку
    const timer = setTimeout(() => doneProgress(), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <NavigationProgress />
      <Routes>
        {/* маршруты */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Интеграция с Next.js

```tsx
// app/layout.tsx или pages/_app.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

export function NavigationProgress() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.done();
  }, [pathname]);

  return null;
}
```

## Обработка loading в Axios

Axios позволяет добавить глобальные интерцепторы для управления индикатором загрузки:

```tsx
// lib/axios.ts
import axios from 'axios';
import { startProgress, doneProgress } from './nprogress';

let requestCount = 0;

const api = axios.create({
  baseURL: '/api',
});

// Интерцептор запроса — начало загрузки
api.interceptors.request.use(config => {
  requestCount++;
  if (requestCount === 1) {
    startProgress();
  }
  return config;
});

// Интерцептор ответа — конец загрузки
api.interceptors.response.use(
  response => {
    requestCount--;
    if (requestCount === 0) {
      doneProgress();
    }
    return response;
  },
  error => {
    requestCount--;
    if (requestCount === 0) {
      doneProgress();
    }
    return Promise.reject(error);
  }
);

export { api };
```

### Индикатор загрузки на уровне компонента с Axios

```tsx
import { useState, useEffect } from 'react';
import axios, { CancelTokenSource } from 'axios';

function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const source = axios.CancelToken.source();
    setLoading(true);

    const timer = setTimeout(() => {
      axios
        .get('/api/users/search', {
          params: { q: query },
          cancelToken: source.token,
        })
        .then(res => {
          setResults(res.data);
          setLoading(false);
        })
        .catch(err => {
          if (!axios.isCancel(err)) {
            setLoading(false);
          }
        });
    }, 300); // Debounce 300ms

    return () => {
      clearTimeout(timer);
      source.cancel('Новый запрос');
    };
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск пользователей..."
      />
      {loading && <ClipLoader size={20} color="#6366f1" />}
      <ul>
        {results.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Обработка loading в SWR

SWR предоставляет встроенные состояния загрузки через возвращаемые значения хука:

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function UserProfile({ id }: { id: number }) {
  const {
    data: user,
    error,
    isLoading,      // true при первой загрузке (нет кэша)
    isValidating,   // true при любом запросе (включая фоновую ревалидацию)
  } = useSWR(`/api/users/${id}`, fetcher);

  // Первая загрузка — показываем skeleton
  if (isLoading) return <UserCardSkeleton />;

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div style={{ position: 'relative' }}>
      {/* Фоновая ревалидация — тонкий индикатор */}
      {isValidating && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <ClipLoader size={14} color="#6366f1" />
        </div>
      )}
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Глобальный индикатор с SWR

```tsx
import { useSWRConfig } from 'swr';
import { useEffect, useRef, useState } from 'react';

// Хук для отслеживания глобального состояния загрузки SWR
function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const activeRequests = useRef(0);

  // Используем middleware для подсчёта запросов
  const { mutate } = useSWRConfig();

  return isLoading;
}

// Более простой вариант через собственный счётчик
const swrMiddleware = (useSWRNext) => (key, fetcher, config) => {
  const wrappedFetcher = async (...args) => {
    startProgress();
    try {
      const result = await fetcher(...args);
      doneProgress();
      return result;
    } catch (err) {
      doneProgress();
      throw err;
    }
  };

  return useSWRNext(key, wrappedFetcher, config);
};

// Подключение middleware в конфигурации SWR
import { SWRConfig } from 'swr';

function App() {
  return (
    <SWRConfig value={{ use: [swrMiddleware] }}>
      {/* приложение */}
    </SWRConfig>
  );
}
```

## Обработка loading в React Query

TanStack Query (React Query) предоставляет богатый набор состояний загрузки:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function ArticleList() {
  const {
    data: articles,
    error,
    isLoading,        // true при первой загрузке без кэша
    isFetching,       // true при любом запросе, включая фоновое обновление
    isRefetching,     // true при refetch
    isPending,        // true пока нет данных
    isSuccess,        // true когда данные успешно получены
  } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  if (isLoading) {
    return (
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div style={{ position: 'relative' }}>
      {/* Индикатор фонового обновления */}
      {isFetching && !isLoading && (
        <div className="refetch-indicator">
          <ClipLoader size={16} color="#6366f1" />
          <span>Обновление...</span>
        </div>
      )}
      <div className="grid">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
```

### Оптимистичные обновления в React Query

```tsx
function LikeButton({ articleId, initialLikes }: { articleId: number; initialLikes: number }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/articles/${articleId}/like`, { method: 'POST' }).then(r => r.json()),

    // Оптимистичное обновление
    onMutate: async () => {
      // Отменяем текущие запросы для этого ключа
      await queryClient.cancelQueries({ queryKey: ['articles', articleId] });

      // Сохраняем предыдущее значение
      const previous = queryClient.getQueryData(['articles', articleId]);

      // Оптимистично обновляем
      queryClient.setQueryData(['articles', articleId], (old: Article) => ({
        ...old,
        likes: old.likes + 1,
        likedByMe: true,
      }));

      return { previous };
    },

    // При ошибке откатываем
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['articles', articleId], context?.previous);
    },

    // После завершения (успех или ошибка) инвалидируем кэш
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', articleId] });
    },
  });

  return (
    <button
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isPending}
    >
      {likeMutation.isPending ? <ClipLoader size={14} color="white" /> : '❤️'}
      Нравится ({initialLikes})
    </button>
  );
}
```

### Глобальный индикатор с React Query

```tsx
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import NProgress from 'nprogress';

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching + isMutating > 0;

  useEffect(() => {
    if (isLoading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isLoading]);

  return null;
}

// Добавьте в корень приложения
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingIndicator />
      {/* остальное приложение */}
    </QueryClientProvider>
  );
}
```

## Лучшие практики

Собирая все паттерны вместе, вот что стоит применять в реальных проектах:

**Выбирайте индикатор под задачу:**
- Спиннер — для коротких операций (< 2 секунд) или когда структура контента неизвестна заранее
- Skeleton — для загрузки данных, когда структура страницы известна (карточки, списки, профили)
- Progress bar — для операций с известным прогрессом (загрузка файлов, пошаговые процессы)
- NProgress — для навигации между страницами

**Всегда обрабатывайте три состояния:** loading, error и success. Не забывайте про состояние пустого результата (empty state).

**Используйте оптимистичные обновления** для операций, которые практически всегда успешны: лайки, чекбоксы, переключатели. Это делает приложение мгновенно отзывчивым.

**Избегайте мерцания (flash):** если данные загружаются быстро (< 200ms), skeleton может мелькнуть и исчезнуть — это раздражает. Добавьте минимальную задержку перед показом индикатора:

```tsx
function useDelayedLoading(loading: boolean, delay = 200) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return showLoading;
}

// Использование
function Component() {
  const { data, isLoading } = useQuery(/* ... */);
  const showSkeleton = useDelayedLoading(isLoading);

  if (showSkeleton) return <Skeleton />;
  return <Content data={data} />;
}
```

**Доступность (a11y):** добавляйте `role="status"`, `aria-label` и `aria-live` к индикаторам загрузки, чтобы скринридеры сообщали о них пользователям.

```tsx
function AccessibleLoadingIndicator({ message = 'Загрузка...' }) {
  return (
    <div role="status" aria-live="polite" aria-label={message}>
      <Spinner />
      <span className="sr-only">{message}</span>
    </div>
  );
}
```

## Заключение

Грамотное управление состояниями загрузки — один из ключевых факторов воспринимаемой производительности приложения. Пользователи оценивают не только реальную скорость, но и то, насколько приложение кажется им отзывчивым и «живым».

Начните с простого `useState` для базовых случаев, переходите к skeleton screens для улучшения UX, используйте оптимистичные обновления там, где это уместно, и добавьте глобальный NProgress для навигации. Библиотеки SWR и React Query берут на себя большую часть работы по управлению loading-состояниями, позволяя сосредоточиться на логике приложения.

Главное правило: пользователь всегда должен понимать, что происходит в приложении. Индикатор загрузки — это не просто анимация, это диалог между интерфейсом и человеком.
