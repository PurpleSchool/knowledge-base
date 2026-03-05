---
metaTitle: Защищённые маршруты в React Router — PrivateRoute, авторизация и перенаправление
metaDescription: Подробное руководство по реализации защищённых маршрутов в React Router v6. PrivateRoute, контекст авторизации, перенаправление на логин, роли пользователей и лучшие практики
author: Олег Марков
title: Защищённые маршруты (Protected Routes)
preview: Научитесь создавать защищённые маршруты в React Router v6 — реализуйте PrivateRoute, настройте авторизацию через контекст, перенаправление на страницу входа и ролевой доступ к разделам приложения
---

## Введение

Практически каждое веб-приложение содержит разделы, доступные только авторизованным пользователям: личный кабинет, настройки профиля, административная панель. Реализовать такое разграничение доступа в React-приложении помогают **защищённые маршруты** (protected routes или guarded routes).

В этой статье я покажу, как шаг за шагом реализовать защищённые маршруты с помощью React Router v6. Мы разберём базовый паттерн `PrivateRoute`, интеграцию с контекстом авторизации, сохранение целевого URL для редиректа после входа, а также ролевой контроль доступа.

Если вы хотите системно изучить React Router и всё, что с ним связано, приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=zashhishhennye-marshruty-react-router). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Что такое защищённый маршрут

**Защищённый маршрут** — это маршрут, доступ к которому ограничен определённым условием. Чаще всего таким условием является авторизация пользователя: если пользователь не вошёл в систему, его перенаправляют на страницу входа вместо показа запрашиваемой страницы.

Принцип работы прост:

1. Пользователь переходит по защищённому URL (например, `/dashboard`).
2. Приложение проверяет, авторизован ли пользователь.
3. Если да — отображает запрашиваемую страницу.
4. Если нет — перенаправляет на `/login`.

## Базовая реализация PrivateRoute

### Простейший вариант

Начнём с минимальной реализации. Создадим компонент `PrivateRoute`, который принимает состояние авторизации и либо отображает дочерний компонент, либо перенаправляет на страницу входа:

```tsx
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

// Этот компонент проверяет авторизацию и либо показывает children, либо редиректит
function PrivateRoute({ isAuthenticated, children }: PrivateRouteProps) {
  if (!isAuthenticated) {
    // Пользователь не авторизован — перенаправляем на страницу входа
    return <Navigate to="/login" replace />;
  }

  // Пользователь авторизован — показываем защищённый контент
  return <>{children}</>;
}
```

Использование в роутере:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  // В реальном приложении это значение берётся из состояния или контекста
  const isAuthenticated = true;

  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты — доступны всем */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Защищённые маршруты — только для авторизованных */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <ProfilePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

Обратите внимание на prop `replace` у компонента `<Navigate>`. Он заменяет текущую запись в истории браузера вместо добавления новой, чтобы пользователь не попал в цикл при нажатии кнопки «Назад».

## Интеграция с контекстом авторизации

В реальных приложениях статус авторизации хранится централизованно — в контексте, Redux или другом хранилище состояния. Рассмотрим вариант с React Context.

### Создание контекста авторизации

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Создаём контекст для хранения данных об авторизации
const AuthContext = createContext<AuthContextType | null>(null);

// Провайдер — оборачивает всё приложение и даёт доступ к состоянию авторизации
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Хук для удобного доступа к контексту авторизации
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Обновлённый PrivateRoute с контекстом

Теперь компонент `PrivateRoute` сам получает данные из контекста, не нужно передавать `isAuthenticated` как prop:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  // Получаем статус авторизации из контекста
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

Подключение провайдера в корне приложения:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    // AuthProvider должен быть снаружи BrowserRouter — или внутри, но до Routes
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Сохранение целевого URL и редирект после входа

Типичное поведение: пользователь пытается открыть `/dashboard`, его перенаправляют на `/login`, а после успешного входа он должен попасть именно на `/dashboard`, а не на главную страницу. Для этого используем `useLocation`.

### Передача целевого URL при редиректе

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // useLocation возвращает объект с текущим URL
  const location = useLocation();

  if (!isAuthenticated) {
    // Сохраняем текущий URL в state, чтобы после входа вернуться сюда
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Обработка редиректа на странице входа

```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем сохранённый URL или используем главную страницу по умолчанию
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleSubmit = async (email: string, password: string) => {
    // Здесь был бы запрос к API для авторизации
    const userData = await authApi.login(email, password);

    // Сохраняем данные пользователя в контексте
    login(userData);

    // Перенаправляем туда, куда пользователь изначально хотел попасть
    navigate(from, { replace: true });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit('...', '...'); }}>
      {/* Форма входа */}
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Пароль" />
      <button type="submit">Войти</button>
    </form>
  );
}
```

## Паттерн Layout Route для группировки защищённых маршрутов

В React Router v6 есть элегантный способ защитить сразу группу маршрутов через **layout route**. Вместо оборачивания каждого маршрута отдельно, создаём один охраняющий компонент с `<Outlet>`:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Этот компонент защищает все дочерние маршруты через Outlet
function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Outlet отрисовывает дочерний маршрут
  return <Outlet />;
}
```

Использование в роутере — все маршруты внутри `RequireAuth` будут защищены:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Все маршруты внутри этого Route требуют авторизации */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Этот подход намного чище — не нужно оборачивать каждый маршрут по отдельности, и логика защиты сосредоточена в одном месте.

## Ролевой контроль доступа (Role-Based Access Control)

Иногда недостаточно проверить только факт авторизации — нужно также учитывать **роль** пользователя. Например, административная панель доступна только пользователям с ролью `admin`.

### Расширение контекста с поддержкой ролей

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
}
```

### Компонент для ролевого доступа

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RequireRoleProps {
  allowedRoles: string[];
}

function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Сначала проверяем авторизацию
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Затем проверяем, есть ли у пользователя нужная роль
  if (!user || !allowedRoles.includes(user.role)) {
    // Авторизован, но не имеет прав — показываем страницу "Нет доступа"
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
```

Применение в роутере:

```tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Доступно всем авторизованным */}
        <Route element={<RequireRole allowedRoles={['user', 'moderator', 'admin']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Только для модераторов и администраторов */}
        <Route element={<RequireRole allowedRoles={['moderator', 'admin']} />}>
          <Route path="/moderation" element={<ModerationPage />} />
        </Route>

        {/* Только для администраторов */}
        <Route element={<RequireRole allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Защита маршрутов с асинхронной проверкой авторизации

В реальных приложениях статус авторизации часто загружается асинхронно — например, при старте приложения нужно проверить токен в `localStorage` и получить данные пользователя с сервера. В этом случае нужно обрабатывать состояние загрузки.

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;  // Добавляем флаг загрузки
  login: (userData: User) => void;
  logout: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // По умолчанию загружаем

  useEffect(() => {
    // Проверяем сохранённую сессию при старте приложения
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Запрашиваем данные пользователя с сервера
          const userData = await authApi.getMe(token);
          setUser(userData);
        }
      } catch {
        // Токен недействителен — очищаем
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false); // Загрузка завершена в любом случае
      }
    };

    checkAuth();
  }, []);

  // ... login, logout методы

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

Обновлённый `RequireAuth` с обработкой загрузки:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Пока загружаем статус — показываем спиннер, не редиректим
  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

Это важно: без проверки `isLoading` при первом рендере пользователь будет редиректиться на `/login`, даже если его токен валиден — просто данные ещё не загружены.

## Публичные маршруты только для неавторизованных

Иногда нужна обратная логика: страницы `/login` и `/register` должны быть недоступны для уже авторизованных пользователей — их следует перенаправлять на дашборд.

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Маршрут доступен только если пользователь НЕ авторизован
function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (isAuthenticated) {
    // Авторизованному пользователю незачем видеть страницу входа
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

Применение:

```tsx
<Routes>
  {/* Маршруты только для неавторизованных */}
  <Route element={<PublicOnlyRoute />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Маршруты только для авторизованных */}
  <Route element={<RequireAuth />}>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Route>

  {/* Маршруты для всех */}
  <Route path="/" element={<HomePage />} />
</Routes>
```

## Полный пример с TypeScript

Соберём всё вместе в реальный пример:

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Здесь был бы реальный запрос к API
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => localStorage.removeItem('authToken'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { token, user } = await res.json();
    localStorage.setItem('authToken', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

```tsx
// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="spinner">Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
```

```tsx
// src/components/RequireRole.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireRoleProps {
  roles: string[];
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="spinner">Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
```

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Защищённые маршруты для всех авторизованных */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Только для администраторов */}
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

## Лучшие практики

- **Используйте Layout Routes** вместо оборачивания каждого маршрута — это избавляет от дублирования кода.
- **Всегда обрабатывайте состояние загрузки** — без этого возможны ложные редиректы при асинхронной проверке авторизации.
- **Сохраняйте целевой URL** через `state` при редиректе на `/login` — это улучшает UX.
- **Разделяйте логику**: контекст авторизации — в одном файле, компоненты защиты маршрутов — в отдельных файлах.
- **Не храните чувствительные данные в URL** при перенаправлениях.
- **Используйте `replace`** в `<Navigate>` — чтобы страница авторизации не попадала в историю браузера.

## Заключение

Защищённые маршруты — важный паттерн безопасности клиентских React-приложений. С React Router v6 их реализация стала значительно проще благодаря Layout Routes и компоненту `<Outlet>`. Вы научились создавать базовый `PrivateRoute`, интегрировать его с контекстом авторизации, сохранять целевой URL для редиректа после входа и реализовывать ролевой контроль доступа.

Помните: защита маршрутов на клиенте — это только UX-слой. Реальная безопасность обеспечивается на сервере: каждый API-запрос должен проверять токен и права доступа независимо от клиентской навигации.

React Router и управление состоянием авторизации — фундаментальные навыки для React-разработчика. Чтобы освоить их системно, записывайтесь на курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=zashhishhennye-marshruty-react-router). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в React уже сегодня.

## Часто задаваемые вопросы

#### Как защитить маршрут, если данные авторизации хранятся в Redux, а не в контексте?

Принцип тот же — замените `useAuth()` на `useSelector()` из Redux:

```tsx
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const location = useLocation();

  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
```

#### Можно ли защитить маршруты без контекста или Redux?

Да, можно передавать `isAuthenticated` как prop или использовать кастомный хук, читающий из `localStorage`. Контекст — лишь наиболее удобный способ для большинства приложений.

#### Почему при обновлении страницы я попадаю на `/login` вместо защищённого маршрута?

Скорее всего, вы не обрабатываете состояние загрузки. При обновлении страницы приложение инициализируется заново, и пока данные пользователя загружаются, `isAuthenticated` равен `false`. Добавьте проверку `isLoading` и показывайте спиннер вместо редиректа.

#### Как реализовать «запомнить меня» для сохранения сессии?

Используйте `localStorage` для долгосрочного хранения токена (и очищайте при выходе) против `sessionStorage` — данные в `sessionStorage` удаляются при закрытии вкладки.

#### Безопасна ли защита маршрутов только на клиенте?

Нет. Клиентские защищённые маршруты — это только визуальный уровень защиты. Злоумышленник может обойти их, изменив код в DevTools. Всегда проверяйте авторизацию и права доступа на сервере при каждом API-запросе.
