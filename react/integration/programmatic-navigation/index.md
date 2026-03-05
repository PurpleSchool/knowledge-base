# Программная навигация (Programmatic Navigation) в React и Next.js

## Введение

Программная навигация — это управление переходами между страницами приложения с помощью кода JavaScript, а не кликами пользователя по ссылкам. Это один из ключевых паттернов в современных Single Page Applications (SPA).

В отличие от декларативной навигации через компонент `<Link>`, программная навигация позволяет выполнять переходы в ответ на любые события: отправку формы, завершение API-запроса, получение WebSocket-сообщения, истечение таймера и т.д.

В этой статье мы разберём:
- Хук `useNavigate` в React Router v6
- Хук `useRouter` в Next.js (Pages Router)
- Хук `useRouter` и `usePathname`/`useSearchParams` в Next.js (App Router)
- Методы `push`, `replace`, `back`, `forward`
- Компонент `<Link>` и когда его использовать вместо программной навигации
- Типичные паттерны и best practices

---

## React Router v6: useNavigate

### Базовое использование

React Router v6 предоставляет хук `useNavigate` для программной навигации:

```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(formData);

    if (success) {
      // Переход на главную страницу после успешного входа
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* поля формы */}
      <button type="submit">Войти</button>
    </form>
  );
}
```

### navigate(to, options)

Функция `navigate` принимает путь и опциональный объект настроек:

```tsx
// Простой переход
navigate('/users');

// Переход с заменой текущей записи в истории
navigate('/login', { replace: true });

// Относительная навигация
navigate('../profile');

// Переход с передачей состояния
navigate('/checkout', {
  state: {
    orderId: '12345',
    total: 2500
  }
});

// Назад в истории
navigate(-1);

// Вперёд в истории
navigate(1);
```

### Передача и чтение state

State позволяет передавать данные при навигации без отображения их в URL:

```tsx
// Страница-источник
function OrderConfirmation({ orderId }: { orderId: string }) {
  const navigate = useNavigate();

  const handleViewOrder = () => {
    navigate('/orders/detail', {
      state: { orderId, timestamp: Date.now() }
    });
  };

  return <button onClick={handleViewOrder}>Посмотреть заказ</button>;
}

// Страница-получатель
import { useLocation } from 'react-router-dom';

function OrderDetail() {
  const location = useLocation();
  const { orderId, timestamp } = location.state || {};

  return (
    <div>
      <h1>Заказ #{orderId}</h1>
      <p>Создан: {new Date(timestamp).toLocaleString()}</p>
    </div>
  );
}
```

### replace: true — когда и зачем

Параметр `replace: true` заменяет текущую запись в стеке истории браузера, не добавляя новую. Это важно в следующих случаях:

```tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // replace: true чтобы пользователь не мог вернуться обратно
      // кнопкой "Назад" на защищённую страницу
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? <>{children}</> : null;
}
```

Другой пример — после отправки формы, чтобы повторная кнопка "Назад" не вызывала повторную отправку:

```tsx
async function handleFormSubmit(data: FormData) {
  await submitOrder(data);
  // Заменяем страницу формы, чтобы при нажатии "Назад"
  // пользователь не попал снова на форму
  navigate('/order-success', { replace: true });
}
```

---

## Next.js Pages Router: useRouter

В Next.js Pages Router (директория `pages/`) используется хук `useRouter` из `next/router`:

```tsx
import { useRouter } from 'next/router';

function ProfilePage() {
  const router = useRouter();

  const handleSaveProfile = async (data: ProfileData) => {
    await updateProfile(data);

    // Переход на страницу профиля
    router.push('/profile/view');
  };

  const handleCancel = () => {
    // Назад в истории
    router.back();
  };

  return (
    <form>
      {/* форма */}
      <button onClick={handleSaveProfile}>Сохранить</button>
      <button onClick={handleCancel}>Отмена</button>
    </form>
  );
}
```

### Методы router в Pages Router

| Метод | Описание |
|-------|----------|
| `router.push(url)` | Переход с добавлением в историю |
| `router.replace(url)` | Переход с заменой текущей записи |
| `router.back()` | Назад в истории (как `window.history.back()`) |
| `router.forward()` | Вперёд в истории |
| `router.reload()` | Перезагрузка текущей страницы |
| `router.prefetch(url)` | Предзагрузка страницы |
| `router.events` | События роутера для подписки |

### router.push с объектом URL

`router.push` может принимать как строку, так и объект:

```tsx
const router = useRouter();

// Простой переход
router.push('/products');

// Переход с query параметрами
router.push('/products?category=electronics&sort=price');

// Через объект (рекомендуется для динамических параметров)
router.push({
  pathname: '/products',
  query: {
    category: 'electronics',
    sort: 'price',
    page: 1
  }
});

// Для динамических роутов (pages/products/[id].tsx)
router.push({
  pathname: '/products/[id]',
  query: { id: '42' }
});
// Результат URL: /products/42

// С as — отображаемый URL
router.push(
  { pathname: '/products/[id]', query: { id: '42' } },
  '/products/42'  // этот URL отображается в адресной строке
);
```

### router.replace

```tsx
// Замена без добавления в историю
router.replace('/login');

// Замена с query-параметрами
router.replace({
  pathname: router.pathname,
  query: { ...router.query, tab: 'settings' }
});
```

### Подписка на события роутера

Pages Router предоставляет систему событий для отслеживания навигации:

```tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

function NavigationProgress() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    const handleError = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  return loading ? <div className="progress-bar" /> : null;
}
```

### Чтение параметров маршрута

```tsx
// pages/products/[id].tsx
import { useRouter } from 'next/router';

function ProductPage() {
  const router = useRouter();

  // Параметры маршрута
  const { id } = router.query; // string | string[] | undefined

  // Query-параметры
  const { sort, filter } = router.query;

  // Текущий путь
  console.log(router.pathname); // '/products/[id]'
  console.log(router.asPath);   // '/products/42?sort=price'

  return <div>Товар: {id}</div>;
}
```

---

## Next.js App Router: useRouter, usePathname, useSearchParams

App Router (директория `app/`) в Next.js 13+ использует другой набор хуков из `next/navigation`. Это важное отличие от Pages Router.

> **Важно:** Хуки `useRouter`, `usePathname` и `useSearchParams` работают только в Client Components (`'use client'`). Server Components не имеют доступа к этим хукам.

### useRouter в App Router

```tsx
'use client';

import { useRouter } from 'next/navigation'; // Не из 'next/router'!

function CheckoutButton({ cartId }: { cartId: string }) {
  const router = useRouter();

  const handleCheckout = async () => {
    const session = await createCheckoutSession(cartId);

    if (session.url) {
      router.push(session.url);
    }
  };

  return (
    <button onClick={handleCheckout}>
      Оформить заказ
    </button>
  );
}
```

### Методы router в App Router

```tsx
'use client';

import { useRouter } from 'next/navigation';

function NavigationExample() {
  const router = useRouter();

  return (
    <div>
      {/* Переход с добавлением в историю */}
      <button onClick={() => router.push('/dashboard')}>
        Перейти в дашборд
      </button>

      {/* Переход с заменой в истории */}
      <button onClick={() => router.replace('/login')}>
        В логин (без добавления в историю)
      </button>

      {/* Назад */}
      <button onClick={() => router.back()}>
        Назад
      </button>

      {/* Вперёд */}
      <button onClick={() => router.forward()}>
        Вперёд
      </button>

      {/* Обновление (как F5, но без перезагрузки страницы) */}
      <button onClick={() => router.refresh()}>
        Обновить данные
      </button>
    </div>
  );
}
```

### router.refresh() — уникальная возможность App Router

Метод `router.refresh()` обновляет текущий маршрут без полной перезагрузки страницы. Он повторно запрашивает Server Components с сервера, обновляя данные, но сохраняя состояние Client Components:

```tsx
'use client';

import { useRouter } from 'next/navigation';

function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    await deletePost(postId);

    // Обновляем страницу чтобы список постов обновился
    // Server Component перезапросит данные с сервера
    router.refresh();
  };

  return (
    <button onClick={handleDelete}>
      Удалить пост
    </button>
  );
}
```

### usePathname

Хук для получения текущего пути:

```tsx
'use client';

import { usePathname } from 'next/navigation';

function Breadcrumbs() {
  const pathname = usePathname(); // '/products/electronics/laptops'

  const segments = pathname.split('/').filter(Boolean);
  // ['products', 'electronics', 'laptops']

  return (
    <nav>
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        return (
          <span key={path}>
            <a href={path}>{segment}</a>
            {index < segments.length - 1 && ' / '}
          </span>
        );
      })}
    </nav>
  );
}
```

### useSearchParams

Хук для работы с query-параметрами URL:

```tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Читаем параметры
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'default';
  const page = Number(searchParams.get('page') ?? '1');

  // Обновляем один параметр, сохраняя остальные
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Удаляем параметр
  const removeParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  return (
    <div>
      <select
        value={category ?? ''}
        onChange={e => e.target.value
          ? updateParam('category', e.target.value)
          : removeParam('category')
        }
      >
        <option value="">Все категории</option>
        <option value="electronics">Электроника</option>
        <option value="clothing">Одежда</option>
      </select>

      <select
        value={sort}
        onChange={e => updateParam('sort', e.target.value)}
      >
        <option value="default">По умолчанию</option>
        <option value="price-asc">Цена: по возрастанию</option>
        <option value="price-desc">Цена: по убыванию</option>
      </select>
    </div>
  );
}
```

---

## Различия между Pages Router и App Router

| Характеристика | Pages Router | App Router |
|----------------|-------------|------------|
| Импорт useRouter | `next/router` | `next/navigation` |
| Доступность | Client и Server | Только Client (`'use client'`) |
| router.push | Работает | Работает |
| router.replace | Работает | Работает |
| router.back() | Работает | Работает |
| router.forward() | Работает | Работает |
| router.reload() | Работает | Нет (используйте router.refresh()) |
| router.refresh() | Нет | Работает |
| router.prefetch() | Работает | Нет (автоматически) |
| router.events | Работает | Нет аналога |
| usePathname | Через router.pathname | Отдельный хук |
| useSearchParams | Через router.query | Отдельный хук |
| Параметры пути | router.query | useParams() |

---

## Компонент Link vs программная навигация

`<Link>` — декларативный способ навигации, оптимизированный для статических переходов:

```tsx
// Next.js
import Link from 'next/link';

// React Router
import { Link } from 'react-router-dom';

// Предпочтительно для навигации, инициируемой пользователем
<Link href="/about">О нас</Link>
<Link href={`/products/${product.id}`}>{product.name}</Link>
```

### Когда использовать Link

- Навигационные меню
- Ссылки в тексте
- Кнопки-ссылки, которые всегда ведут по одному пути
- Когда нужны стандартные браузерные возможности (правая кнопка — открыть в новой вкладке, Ctrl+Click)

### Когда использовать программную навигацию

- После отправки формы
- После завершения API-запроса
- В response на ошибку (редирект на страницу ошибки)
- Условная навигация (переход зависит от результата операции)
- После аутентификации/выхода
- В таймерах и setInterval
- В ответ на WebSocket-события

```tsx
// Неправильно: использование navigate для статической ссылки
<button onClick={() => navigate('/about')}>О нас</button>

// Правильно: Link для статических переходов
<Link href="/about">О нас</Link>

// Правильно: navigate после async-операции
const handleLogin = async (credentials) => {
  const result = await loginAPI(credentials);
  if (result.success) {
    navigate('/dashboard');
  } else {
    setError(result.message);
  }
};
```

---

## Типичные паттерны использования

### 1. Редирект после авторизации

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Запоминаем URL, куда пытался попасть пользователь
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const handleLogin = async (credentials: Credentials) => {
    const result = await login(credentials);

    if (result.ok) {
      // Возвращаем на страницу, куда пытался попасть
      router.replace(callbackUrl);
    }
  };

  return <form onSubmit={handleLogin}>{/* ... */}</form>;
}
```

### 2. Сохранение URL при редиректе на логин

```tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Сохраняем текущий URL в callbackUrl
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

### 3. Пагинация через URL-параметры

```tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

function Pagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page') ?? '1');

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div>
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Назад
      </button>

      <span>{currentPage} / {totalPages}</span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Вперёд
      </button>
    </div>
  );
}
```

### 4. Навигация в Server Actions (Next.js App Router)

В Server Actions нельзя использовать клиентские хуки, но можно использовать `redirect` из `next/navigation`:

```tsx
// app/actions.ts
'use server';

import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const post = await db.post.create({ data: { title, content } });

  // Редирект выбрасывает специальное исключение Next.js
  redirect(`/posts/${post.id}`);
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Заголовок" />
      <textarea name="content" placeholder="Содержание" />
      <button type="submit">Создать</button>
    </form>
  );
}
```

### 5. Оптимистичная навигация

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

function DeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deletePost(postId);
      router.push('/posts');
      router.refresh();
    });
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Удаление...' : 'Удалить'}
    </button>
  );
}
```

### 6. Программная навигация с параметрами в React Router

```tsx
import { useNavigate, useParams } from 'react-router-dom';

function ProductActions() {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const goToProduct = (productId: string) => {
    // Относительная навигация
    navigate(productId); // от /categories/:categoryId к /categories/:categoryId/:productId
  };

  const goToRelatedCategory = (relatedId: string) => {
    // Абсолютная навигация с параметрами
    navigate(`/categories/${relatedId}`);
  };

  const goBackToList = () => {
    // Возврат на уровень выше
    navigate('..');
  };

  return (
    <div>
      <button onClick={() => goToProduct('laptop-123')}>Ноутбук</button>
      <button onClick={() => goBackToList()}>К списку</button>
    </div>
  );
}
```

---

## Проблемы и их решения

### Проблема 1: Навигация вне компонентов

Иногда нужно перейти на другую страницу вне React-компонента, например в сервисе Axios:

```tsx
// Решение для React Router: создаём утилиту с ref
// router-utils.ts
import { NavigateFunction } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;

export function setNavigate(fn: NavigateFunction) {
  navigateRef = fn;
}

export function navigateTo(path: string) {
  navigateRef?.(path);
}

// App.tsx
import { useNavigate } from 'react-router-dom';
import { setNavigate } from './router-utils';
import { useEffect } from 'react';

function RouterInitializer() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}

// axios-interceptor.ts
import { navigateTo } from './router-utils';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      navigateTo('/login');
    }
    return Promise.reject(error);
  }
);
```

### Проблема 2: Лишние ре-рендеры при использовании useSearchParams

В Next.js App Router, компонент с `useSearchParams` должен быть обёрнут в `Suspense`:

```tsx
// Неправильно (вызовет ошибку при SSR)
export default function Page() {
  return <SearchComponent />;
}

// Правильно
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <SearchComponent />
    </Suspense>
  );
}

function SearchComponent() {
  const searchParams = useSearchParams(); // Теперь безопасно
  // ...
}
```

### Проблема 3: Двойной вызов navigate

В React Strict Mode (development) компоненты рендерятся дважды, но навигация должна происходить только один раз. Используйте `useEffect` с правильными зависимостями:

```tsx
// Проблема: срабатывает дважды в Strict Mode
useEffect(() => {
  navigate('/dashboard');
}); // Нет зависимостей — запускается после каждого рендера

// Решение: добавляем зависимости
useEffect(() => {
  if (isAuthenticated) {
    navigate('/dashboard');
  }
}, [isAuthenticated]); // Запускается только при изменении isAuthenticated
```

---

## Итоговое сравнение API

### React Router v6
```tsx
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const navigate = useNavigate();
navigate('/path');                      // push
navigate('/path', { replace: true });  // replace
navigate(-1);                           // back
navigate(1);                            // forward
navigate('/path', { state: { data } }); // с данными
```

### Next.js Pages Router
```tsx
import { useRouter } from 'next/router';

const router = useRouter();
router.push('/path');          // push
router.replace('/path');       // replace
router.back();                 // back
router.forward();              // forward
router.reload();               // reload
router.refresh();              // нет
```

### Next.js App Router
```tsx
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const router = useRouter();
router.push('/path');          // push
router.replace('/path');       // replace
router.back();                 // back
router.forward();              // forward
router.reload();               // нет
router.refresh();              // мягкое обновление данных (только App Router)
```

---

## Заключение

Программная навигация — незаменимый инструмент для построения полноценных SPA. Ключевые принципы:

1. **Используйте `<Link>` для статических переходов** — это более производительно и семантически корректно.

2. **Используйте программную навигацию для условных переходов** — после API-вызовов, отправки форм, проверки авторизации.

3. **Понимайте разницу между `push` и `replace`** — `replace` нужен там, где нежелателен переход "назад".

4. **В Next.js App Router помните о разнице импортов** — `next/navigation` вместо `next/router`.

5. **Оборачивайте компоненты с `useSearchParams` в `<Suspense>`** в Next.js App Router.

6. **Используйте `router.refresh()`** в App Router для обновления данных Server Components без полной перезагрузки страницы.

Правильное использование программной навигации делает UX приложения более плавным и предсказуемым, а код — более чистым и понятным.
