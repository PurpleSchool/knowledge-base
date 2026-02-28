# Компоненты высшего порядка (HOC) в React

**Компонент высшего порядка (Higher-Order Component, HOC)** — паттерн в React, при котором функция принимает компонент и возвращает новый компонент с расширенной функциональностью.

```
HOC = (Component) => EnhancedComponent
```

HOC — это реализация принципа **composition over inheritance** в React. Это не часть React API, а паттерн проектирования, следующий из composable-природы React.

## Базовый синтаксис

```jsx
// HOC — функция, принимающая компонент и возвращающая новый компонент
function withEnhancement(WrappedComponent) {
  // Возвращаем новый компонент
  function EnhancedComponent(props) {
    // Добавляем функциональность
    const extraProps = { someData: 'enhanced' };

    // Рендерим оригинальный компонент с исходными и добавленными пропсами
    return <WrappedComponent {...props} {...extraProps} />;
  }

  // Устанавливаем отображаемое имя для DevTools
  EnhancedComponent.displayName = `withEnhancement(${getDisplayName(WrappedComponent)})`;

  return EnhancedComponent;
}

// Вспомогательная функция для имени
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
```

## Практические примеры HOC

### 1. HOC для аутентификации

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function withAuth(WrappedComponent) {
  function AuthenticatedComponent(props) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return <div className="spinner">Загрузка...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return <WrappedComponent {...props} user={user} />;
  }

  AuthenticatedComponent.displayName = `withAuth(${getDisplayName(WrappedComponent)})`;
  return AuthenticatedComponent;
}

// Использование
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedProfile = withAuth(UserProfile);

// В роутере
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/profile" element={<ProtectedProfile />} />
    </Routes>
  );
}
```

### 2. HOC для логирования

```jsx
function withLogger(WrappedComponent) {
  function LoggedComponent(props) {
    useEffect(() => {
      console.log(`[${getDisplayName(WrappedComponent)}] mounted`, props);
      return () => {
        console.log(`[${getDisplayName(WrappedComponent)}] unmounted`);
      };
    }, []);

    useEffect(() => {
      console.log(`[${getDisplayName(WrappedComponent)}] props updated`, props);
    });

    return <WrappedComponent {...props} />;
  }

  LoggedComponent.displayName = `withLogger(${getDisplayName(WrappedComponent)})`;
  return LoggedComponent;
}
```

### 3. HOC для загрузки данных

```jsx
function withData(WrappedComponent, fetchData) {
  function DataComponent({ id, ...props }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!id) return;

      setLoading(true);
      setError(null);

      fetchData(id)
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data) return null;

    return <WrappedComponent {...props} data={data} />;
  }

  DataComponent.displayName = `withData(${getDisplayName(WrappedComponent)})`;
  return DataComponent;
}

// Создаём специализированные HOC
const withUserData = (Component) => withData(Component, api.getUser);
const withProductData = (Component) => withData(Component, api.getProduct);

// Использование
const UserCard = withUserData(UserCardUI);
<UserCard id={userId} onEdit={handleEdit} />
```

### 4. HOC для обработки ошибок (Error Boundary)

```jsx
class ErrorBoundaryHOC extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Отправка в Sentry и т.д.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function withErrorBoundary(WrappedComponent, FallbackComponent) {
  function ComponentWithErrorBoundary(props) {
    return (
      <ErrorBoundaryHOC FallbackComponent={FallbackComponent}>
        <WrappedComponent {...props} />
      </ErrorBoundaryHOC>
    );
  }

  ComponentWithErrorBoundary.displayName =
    `withErrorBoundary(${getDisplayName(WrappedComponent)})`;
  return ComponentWithErrorBoundary;
}
```

### 5. HOC для аналитики

```jsx
function withAnalytics(WrappedComponent, eventName) {
  function TrackedComponent(props) {
    const analytics = useAnalytics();

    useEffect(() => {
      analytics.track(`${eventName}_viewed`);
    }, []);

    const handleClick = useCallback(() => {
      analytics.track(`${eventName}_clicked`);
    }, []);

    return (
      <div onClick={handleClick}>
        <WrappedComponent {...props} />
      </div>
    );
  }

  TrackedComponent.displayName = `withAnalytics(${getDisplayName(WrappedComponent)})`;
  return TrackedComponent;
}

// Использование
const TrackedButton = withAnalytics(Button, 'purchase_button');
const TrackedProductCard = withAnalytics(ProductCard, 'product_card');
```

## Композиция HOC

HOC можно композировать — применять несколько к одному компоненту.

```jsx
// Ручная композиция
const EnhancedComponent = withLogger(withAuth(withData(BaseComponent, fetchData)));

// Функция compose для удобства
function compose(...fns) {
  return (x) => fns.reduceRight((acc, fn) => fn(acc), x);
}

const enhance = compose(
  withLogger,
  withAuth,
  withErrorBoundary,
  (Component) => withData(Component, api.fetchUser)
);

const EnhancedComponent = enhance(BaseComponent);
```

## TypeScript с HOC

```typescript
import React, { ComponentType } from 'react';

// Типизация пропсов, которые HOC инжектирует
interface WithAuthProps {
  user: User;
}

// HOC с TypeScript
function withAuth<P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>
) {
  // Тип пропсов внешнего компонента — без инжектируемых пропсов
  type ExternalProps = Omit<P, keyof WithAuthProps>;

  function AuthenticatedComponent(props: ExternalProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    // TypeScript знает, что user — это User
    return <WrappedComponent {...(props as P)} user={user} />;
  }

  AuthenticatedComponent.displayName =
    `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

// Базовый компонент принимает user
interface DashboardProps {
  user: User;
  title: string;
}

function Dashboard({ user, title }: DashboardProps) {
  return <div>Welcome, {user.name}! {title}</div>;
}

// Enhanced компонент принимает только внешние пропсы
const ProtectedDashboard = withAuth(Dashboard);
<ProtectedDashboard title="Main Dashboard" /> // ✅ user инжектируется HOC
```

## Правила написания HOC

### 1. Не мутируй оригинальный компонент

```jsx
// ❌ Неправильно — мутация
function withLogging(WrappedComponent) {
  WrappedComponent.prototype.componentDidUpdate = function () { /* ... */ };
  return WrappedComponent; // Возвращаем изменённый компонент!
}

// ✅ Правильно — создание нового компонента
function withLogging(WrappedComponent) {
  function LoggedComponent(props) {
    useEffect(() => { console.log('updated'); });
    return <WrappedComponent {...props} />;
  }
  return LoggedComponent;
}
```

### 2. Передавай все пропсы через spread

```jsx
// ❌ Пропсы потеряны
function withLogger(WrappedComponent) {
  return function(props) {
    return <WrappedComponent />; // Пропсы не переданы!
  };
}

// ✅ Все пропсы передаются дальше
function withLogger(WrappedComponent) {
  return function(props) {
    return <WrappedComponent {...props} />;
  };
}
```

### 3. Устанавливай displayName

```jsx
function withSomething(WrappedComponent) {
  function EnhancedComponent(props) {
    return <WrappedComponent {...props} />;
  }

  // Важно для React DevTools
  EnhancedComponent.displayName =
    `withSomething(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return EnhancedComponent;
}
```

### 4. Копируй статические методы

```jsx
import hoistNonReactStatics from 'hoist-non-react-statics';

function withSomething(WrappedComponent) {
  function EnhancedComponent(props) {
    return <WrappedComponent {...props} />;
  }

  // Копируем статические методы (getStaticProps, getServerSideProps и т.д.)
  hoistNonReactStatics(EnhancedComponent, WrappedComponent);

  return EnhancedComponent;
}
```

## HOC vs Hooks vs Render Props

| | HOC | Custom Hook | Render Props |
|--|-----|-------------|--------------|
| Синтаксис | `withX(Component)` | `useX()` | `<X render={fn}>` |
| Переиспользование логики | ✅ | ✅ | ✅ |
| Изменяет структуру | ✅ (оборачивает) | ❌ | ✅ (рендерит) |
| JSX overhead | Есть | Нет | Есть |
| Prop drilling | Может быть | Нет | Нет |
| TypeScript | Сложнее | Легко | Средне |
| React DevTools | Вложенность HOC | Просто | Вложенность |
| Современность | Legacy | Современный | Устаревает |

### Пример одной задачи тремя способами

```jsx
// Задача: получить текущего пользователя

// 1. HOC
function withCurrentUser(Component) {
  return function(props) {
    const user = useCurrentUser();
    return <Component {...props} currentUser={user} />;
  };
}
const MyComponent = withCurrentUser(BaseComponent);

// 2. Custom Hook (предпочтительный способ сегодня)
function MyComponent() {
  const user = useCurrentUser();
  return <div>{user.name}</div>;
}

// 3. Render Props
function MyComponent() {
  return (
    <CurrentUserProvider>
      {(user) => <div>{user.name}</div>}
    </CurrentUserProvider>
  );
}
```

## Когда использовать HOC в современном React

HOC остаются актуальными для:

1. **Условный рендеринг на уровне компонента** — `withAuth`, `withPermission`
2. **Обёртка в Error Boundary** — классовые компоненты нельзя заменить хуками
3. **Интеграция со сторонними библиотеками** — `connect()` из Redux, `withRouter` из старого React Router
4. **Декораторы** — когда нужно применить поведение ко множеству компонентов
5. **Легаси-кодовая база** — рефакторинг классовых компонентов

В новом коде, как правило, **кастомные хуки** решают задачи переиспользования логики проще и понятнее.

## Резюме

HOC — мощный паттерн для:
- Добавления кросс-компонентной функциональности (аутентификация, логирование, аналитика)
- Инжекции данных и зависимостей
- Создания Error Boundary-оберток

**Правила:** Не мутируй оригинал, передавай все пропсы, устанавливай displayName, копируй статические методы.

В современном React предпочитай **кастомные хуки** для логики и HOC — для изменения структуры компонента или работы с Error Boundary.

## Дополнительные ресурсы

- [Higher-Order Components — React Docs](https://react.dev/reference/react/Component#static-getderivedstatefromprops)
- [hoist-non-react-statics](https://github.com/mridgway/hoist-non-react-statics)
- [Recompose — библиотека HOC-утилит](https://github.com/acdlite/recompose)
