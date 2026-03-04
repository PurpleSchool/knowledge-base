---
metaTitle: React Router v6 - основы маршрутизации в React приложениях
metaDescription: Полное руководство по React Router v6 - установка, базовые концепции, BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams и практические примеры
author: Олег Марков
title: React Router v6 - основы
preview: Изучите React Router v6 - современную библиотеку маршрутизации для React. Разберём установку, основные компоненты BrowserRouter, Routes, Route, Link, хуки useNavigate и useParams с практическими примерами
---

# React Router v6 - основы

React Router — самая популярная библиотека для реализации маршрутизации в React-приложениях. Версия 6 была полностью переработана: появился более простой API, улучшена работа с вложенными маршрутами, добавлены новые хуки. В этой статье разберём всё, что нужно знать для начала работы с React Router v6.

## Установка

```bash
npm install react-router-dom
# или
yarn add react-router-dom
# или
pnpm add react-router-dom
```

Для v6 нужен React 16.8 или новее (hooks support).

## Базовая настройка

### BrowserRouter

Самый простой способ начать — обернуть приложение в `BrowserRouter`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Отличия от v5

```tsx
// React Router v5 — устаревший синтаксис
import { Switch, Route } from 'react-router-dom';

<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route component={NotFound} />
</Switch>

// React Router v6 — новый синтаксис
import { Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

Ключевые изменения:
- `Switch` → `Routes`
- `component={Home}` → `element={<Home />}`
- `exact` больше не нужен — маршруты точные по умолчанию
- `<Route component={NotFound}>` → `<Route path="*" element={<NotFound />}>`

## Навигация

### Компонент Link

```tsx
import { Link, NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      {/* Обычная ссылка */}
      <Link to="/">Главная</Link>
      <Link to="/about">О нас</Link>

      {/* NavLink добавляет класс active к активному маршруту */}
      <NavLink
        to="/users"
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        Пользователи
      </NavLink>

      {/* Стилизация активной ссылки через style */}
      <NavLink
        to="/settings"
        style={({ isActive }) => ({
          color: isActive ? 'blue' : 'gray',
          fontWeight: isActive ? 'bold' : 'normal',
        })}
      >
        Настройки
      </NavLink>
    </nav>
  );
}
```

### Программная навигация с useNavigate

```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      // Переход на главную после логина
      navigate('/dashboard');

      // Замена в истории (нельзя вернуться назад)
      navigate('/dashboard', { replace: true });

      // Переход с передачей состояния
      navigate('/checkout', { state: { from: '/cart' } });
    } catch (error) {
      navigate('/login?error=1');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

function BackButton() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(-1)}>← Назад</button>
  );
}
```

## Параметры маршрута

### Динамические параметры с useParams

```tsx
// Определяем маршрут с параметром
<Route path="/users/:userId" element={<UserProfile />} />
<Route path="/posts/:postId/comments/:commentId" element={<Comment />} />
```

```tsx
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams<{ userId: string }>();

  return <h1>Профиль пользователя #{userId}</h1>;
}

function Comment() {
  const { postId, commentId } = useParams<{
    postId: string;
    commentId: string;
  }>();

  return <p>Комментарий {commentId} к посту {postId}</p>;
}
```

### Query-параметры с useSearchParams

```tsx
import { useSearchParams } from 'react-router-dom';

function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Читаем параметры из URL: /products?category=electronics&sort=price&page=2
  const category = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort') ?? 'date';
  const page = Number(searchParams.get('page') ?? '1');

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams((prev) => {
      prev.set('category', newCategory);
      prev.set('page', '1'); // Сбрасываем страницу при смене категории
      return prev;
    });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams((prev) => {
      prev.set('sort', newSort);
      return prev;
    });
  };

  return (
    <div>
      <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
        <option value="all">Все</option>
        <option value="electronics">Электроника</option>
        <option value="clothing">Одежда</option>
      </select>

      <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
        <option value="date">По дате</option>
        <option value="price">По цене</option>
        <option value="rating">По рейтингу</option>
      </select>

      <p>Страница {page}</p>
    </div>
  );
}
```

## Вложенные маршруты и Outlet

**Outlet** — одно из главных нововведений v6. Он позволяет рендерить дочерние маршруты внутри родительского компонента.

```tsx
// Определяем структуру с вложенными маршрутами
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout-маршрут */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />        {/* / */}
          <Route path="about" element={<AboutPage />} />  {/* /about */}

          {/* Вложенные маршруты пользователей */}
          <Route path="users" element={<UsersLayout />}>
            <Route index element={<UsersList />} />           {/* /users */}
            <Route path=":userId" element={<UserProfile />} />  {/* /users/123 */}
            <Route path=":userId/edit" element={<EditUser />} /> {/* /users/123/edit */}
          </Route>

          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```tsx
// Layout рендерит общие части и Outlet для дочерних маршрутов
function Layout() {
  return (
    <div>
      <Header />
      <nav>
        <NavLink to="/">Главная</NavLink>
        <NavLink to="/about">О нас</NavLink>
        <NavLink to="/users">Пользователи</NavLink>
      </nav>

      <main>
        {/* Здесь рендерится текущий дочерний маршрут */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

// UsersLayout — свой лейаут для раздела пользователей
function UsersLayout() {
  return (
    <div>
      <h1>Управление пользователями</h1>
      <Outlet /> {/* Рендерит UsersList или UserProfile */}
    </div>
  );
}
```

### Передача данных в Outlet через context

```tsx
function UsersLayout() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div>
      <Outlet context={{ selectedUser, setSelectedUser }} />
    </div>
  );
}

// В дочернем компоненте
import { useOutletContext } from 'react-router-dom';

function UserProfile() {
  const { selectedUser, setSelectedUser } = useOutletContext();
  // ...
}
```

## Защищённые маршруты

Защищённые маршруты — стандартный паттерн для ограничения доступа неавторизованным пользователям:

```tsx
import { Navigate, useLocation } from 'react-router-dom';

// Компонент-обёртка для защищённых маршрутов
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Перенаправляем на логин, сохраняя текущий путь для редиректа после входа
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Обёртка для проверки роли
function RequireRole({
  children,
  role,
}: {
  children: JSX.Element;
  role: string;
}) {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

// Использование в маршрутах
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Защищённые маршруты */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      {/* Группа защищённых маршрутов */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Только для администраторов */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminPanel />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}
```

```tsx
// LoginPage — перенаправляем после логина
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const handleLogin = async (credentials) => {
    await login(credentials);
    navigate(from, { replace: true }); // Возвращаем туда, откуда пришли
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

## useLocation и useMatch

```tsx
import { useLocation, useMatch } from 'react-router-dom';

function BreadCrumbs() {
  const location = useLocation();

  // location.pathname — текущий путь
  // location.search — строка запроса (?key=value)
  // location.state — переданное состояние
  // location.hash — хэш (#section)

  return (
    <nav aria-label="breadcrumb">
      <span>Вы здесь: {location.pathname}</span>
    </nav>
  );
}

function ActiveSection() {
  // useMatch проверяет соответствие текущего пути шаблону
  const isUsersPage = useMatch('/users/*');
  const isUserProfile = useMatch('/users/:id');

  return (
    <div>
      {isUsersPage && <p>Вы в разделе пользователей</p>}
      {isUserProfile && <p>Просматриваете профиль #{isUserProfile.params.id}</p>}
    </div>
  );
}
```

## Lazy loading маршрутов

Для оптимизации загрузки — разделение кода по маршрутам:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Ленивая загрузка компонентов страниц
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/users/*" element={<UsersPage />} />
          <Route
            path="/admin/*"
            element={
              <RequireAuth>
                <AdminPanel />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
    </div>
  );
}
```

## createBrowserRouter и Data API

React Router v6.4+ добавил **Data API** — loaders и actions для загрузки данных прямо в маршрутах:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Создаём роутер с loaders
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
        // Загружается ДО рендера компонента
        loader: async () => {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Response('Not Found', { status: 404 });
          return response.json();
        },
      },
      {
        path: 'users/:userId',
        element: <UserProfile />,
        loader: async ({ params }) => {
          const response = await fetch(`/api/users/${params.userId}`);
          if (!response.ok) throw new Response('Not Found', { status: 404 });
          return response.json();
        },
        // action для POST/PUT/DELETE
        action: async ({ request, params }) => {
          const formData = await request.formData();
          const updates = Object.fromEntries(formData);
          await updateUser(params.userId, updates);
          return redirect(`/users/${params.userId}`);
        },
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// В компоненте — данные из loader доступны через useLoaderData
import { useLoaderData, Form } from 'react-router-dom';

function UsersPage() {
  const users = useLoaderData() as User[];

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <Link to={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  );
}

function UserProfile() {
  const user = useLoaderData() as User;

  return (
    <div>
      <h1>{user.name}</h1>
      {/* Form автоматически отправляет данные в action */}
      <Form method="post">
        <input name="name" defaultValue={user.name} />
        <button type="submit">Сохранить</button>
      </Form>
    </div>
  );
}
```

## Переходы и pending состояния

```tsx
import { useNavigation } from 'react-router-dom';

function Layout() {
  const navigation = useNavigation();

  return (
    <div>
      {/* Показываем индикатор при переходе между страницами */}
      {navigation.state === 'loading' && <GlobalSpinner />}

      <Outlet />
    </div>
  );
}
```

## Типичная структура маршрутов

Пример организации маршрутов в реальном приложении:

```tsx
const router = createBrowserRouter([
  // Публичные страницы
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Основное приложение (авторизованные)
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        loader: dashboardLoader,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
        loader: profileLoader,
        action: profileAction,
      },

      // Раздел продуктов
      {
        path: 'products',
        element: <ProductsLayout />,
        children: [
          { index: true, element: <ProductsList />, loader: productsLoader },
          { path: ':id', element: <ProductDetail />, loader: productLoader },
        ],
      },

      // Только для администраторов
      {
        path: 'admin',
        element: <RequireRole role="admin"><AdminLayout /></RequireRole>,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers />, loader: adminUsersLoader },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
```

## Заключение

React Router v6 существенно упростил работу с маршрутизацией в React:

- **`<Routes>` и `<Route>`** — декларативный, лаконичный синтаксис
- **`<Outlet>`** — элегантное решение для вложенных маршрутов и общих лейаутов
- **`useNavigate`** — программная навигация без устаревшего `history`
- **`useParams` и `useSearchParams`** — удобный доступ к параметрам
- **Data API** (loaders/actions) — загрузка данных прямо в маршрутах
- **Lazy loading** через `React.lazy` — разделение кода без лишней настройки

React Router v6 стал стандартом маршрутизации в React-экосистеме. Изучив эти основы, вы сможете организовать навигацию любой сложности в своём приложении.
