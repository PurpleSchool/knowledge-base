---
metaTitle: "Рефакторинг React-кода — техники и лучшие практики"
metaDescription: "Практическое руководство по рефакторингу React-компонентов: разбиение компонентов, извлечение хуков, устранение дублирования и оптимизация производительности."
author: Олег Марков
title: "Рефакторинг React-кода: техники и лучшие практики"
preview: "Разбираем систематический подход к рефакторингу React-приложений. От признаков плохого кода до конкретных техник улучшения компонентов, хуков и структуры проекта."
---

# Рефакторинг React-кода

Рефакторинг — это улучшение внутренней структуры кода без изменения его внешнего поведения. В React-проектах со временем накапливается технический долг: компоненты разрастаются, логика дублируется, пропсы передаются через несколько уровней. В этой статье разберём системный подход к рефакторингу.

## Признаки кода, требующего рефакторинга

Прежде чем рефакторить, научитесь распознавать проблемные места:

- **Большой компонент** — файл на 300+ строк
- **Prop drilling** — пропсы передаются через 3+ уровня
- **Дублирование логики** — один и тот же `useEffect` в нескольких компонентах
- **Смешанные ответственности** — компонент делает запрос к API, валидирует данные и рендерит
- **Сложные условия** — `if/else` или тернарные операторы на несколько уровней вложенности

## Техника 1: Разбиение крупных компонентов

Первый и самый очевидный рефакторинг — выделение логических частей в отдельные компоненты.

### До рефакторинга

```tsx
// ❌ Компонент на 200+ строк — делает всё сразу
function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [userData, ordersData] = await Promise.all([
        fetchUser(),
        fetchOrders(),
      ]);
      setUser(userData);
      setOrders(ordersData);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div className="dashboard">
      {/* 50 строк разметки профиля */}
      <div className="profile">
        <img src={user?.avatar} alt={user?.name} />
        <h1>{user?.name}</h1>
        <p>{user?.email}</p>
        {/* ... */}
      </div>

      {/* 80 строк таблицы заказов */}
      <div className="orders">
        <h2>Заказы</h2>
        <table>
          {/* ... */}
        </table>
      </div>
    </div>
  );
}
```

### После рефакторинга

```tsx
// ✅ Маленькие сфокусированные компоненты

// Компонент профиля
function UserProfileSection({ user }: { user: User }) {
  return (
    <div className="profile">
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Компонент таблицы заказов
function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="orders">
      <h2>Заказы</h2>
      <table>
        <tbody>
          {orders.map(order => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Корневой компонент остаётся простым
function UserDashboard() {
  const { user, orders, isLoading } = useDashboardData();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="dashboard">
      <UserProfileSection user={user} />
      <OrdersTable orders={orders} />
    </div>
  );
}
```

## Техника 2: Извлечение кастомных хуков

Логика состояния и побочные эффекты часто могут быть вынесены в хуки, что делает компоненты проще.

### До рефакторинга

```tsx
// ❌ Бизнес-логика смешана с рендерингом
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts({ query: searchQuery, page })
      .then(setProducts)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [searchQuery, page]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Рендер...
}
```

### После рефакторинга

```tsx
// ✅ Хук инкапсулирует всю логику

function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts({ query: searchQuery, page })
      .then(setProducts)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [searchQuery, page]);

  return {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
  };
}

// Компонент стал чистым — только рендеринг
function ProductList() {
  const { products, isLoading, error, searchQuery, setSearchQuery } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      <ul>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </div>
  );
}
```

## Техника 3: Устранение Prop Drilling через контекст

Когда пропсы передаются через несколько уровней компонентов, это сигнал для использования Context API.

### До рефакторинга

```tsx
// ❌ Prop drilling — theme передаётся через 3 уровня
function App() {
  const [theme, setTheme] = useState('light');
  return <Layout theme={theme} setTheme={setTheme} />;
}

function Layout({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />;
}

function Header({ theme, setTheme }) {
  return <ThemeToggle theme={theme} setTheme={setTheme} />;
}
```

### После рефакторинга

```tsx
// ✅ Контекст убирает prop drilling

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// Теперь Layout и Header не знают о theme
function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}

function Layout() {
  return <Header />;
}

function Header() {
  return <ThemeToggle />; // берёт данные из контекста
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme(); // прямой доступ
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

## Техника 4: Упрощение условного рендеринга

Сложные условия в JSX тяжело читать. Вот несколько техник упрощения.

### Извлечение условных блоков

```tsx
// ❌ Сложная логика прямо в JSX
function UserCard({ user, isAdmin, isLoading, error }) {
  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !user ? (
        <EmptyState message="Пользователь не найден" />
      ) : (
        <div>
          {isAdmin && (
            <AdminBadge />
          )}
          <span>{user.name}</span>
        </div>
      )}
    </div>
  );
}

// ✅ Ранний возврат упрощает JSX
function UserCard({ user, isAdmin, isLoading, error }) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <EmptyState message="Пользователь не найден" />;

  return (
    <div>
      {isAdmin && <AdminBadge />}
      <span>{user.name}</span>
    </div>
  );
}
```

### Компонент-обёртка для условного рендеринга

```tsx
// Для повторяющегося паттерна условного рендеринга
interface ShowProps {
  when: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function Show({ when, fallback = null, children }: ShowProps) {
  return when ? <>{children}</> : <>{fallback}</>;
}

// Использование
function Dashboard({ user, isAdmin }) {
  return (
    <div>
      <Show when={isAdmin} fallback={<ReadOnlyView />}>
        <AdminPanel />
      </Show>
      <UserInfo user={user} />
    </div>
  );
}
```

## Техника 5: Оптимизация useEffect

Неправильные зависимости `useEffect` — частый источник багов и производительностных проблем.

### Разбиение одного большого эффекта

```tsx
// ❌ Один эффект делает несколько несвязанных вещей
useEffect(() => {
  // Загрузка данных
  fetchUser(userId).then(setUser);

  // Аналитика
  trackPageView('profile');

  // Обновление заголовка страницы
  document.title = `Профиль ${userId}`;
}, [userId]);

// ✅ Разделяем на независимые эффекты
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

useEffect(() => {
  trackPageView('profile');
}, []); // Только при монтировании

useEffect(() => {
  document.title = user ? `Профиль ${user.name}` : 'Загрузка...';
}, [user]);
```

### Перенос логики в обработчики событий

```tsx
// ❌ useEffect для реакции на действие пользователя
function Form() {
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState(formData);

  useEffect(() => {
    if (submitted) {
      saveToAPI(data);
      setSubmitted(false);
    }
  }, [submitted, data]);

  return <button onClick={() => setSubmitted(true)}>Сохранить</button>;
}

// ✅ Логика в обработчике, не в эффекте
function Form() {
  const [data, setData] = useState(formData);

  const handleSubmit = async () => {
    await saveToAPI(data);
  };

  return <button onClick={handleSubmit}>Сохранить</button>;
}
```

## Техника 6: Устранение дублирования через HOC и Render Props

Когда одна и та же логика нужна в нескольких компонентах, выносите её:

```tsx
// Хук для инкапсуляции логики загрузки
function withLoading<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WithLoadingWrapper({
    isLoading,
    ...props
  }: T & { isLoading: boolean }) {
    if (isLoading) return <LoadingSpinner />;
    return <Component {...(props as T)} />;
  };
}

// Использование
const UserCardWithLoading = withLoading(UserCard);

function App() {
  const { user, isLoading } = useUser();
  return <UserCardWithLoading isLoading={isLoading} user={user} />;
}
```

## Стратегия безопасного рефакторинга

Рефакторинг без тестов опасен. Следуйте этому подходу:

1. **Покройте код тестами до рефакторинга** — хотя бы интеграционными
2. **Делайте маленькие шаги** — один рефакторинг за один коммит
3. **Запускайте тесты после каждого шага** — убедитесь, что поведение не изменилось
4. **Используйте TypeScript** — компилятор поймает многие ошибки при переименовании

```tsx
// Пример: безопасное переименование пропса
// 1. Добавляем новый проп, сохраняем старый (deprecated)
interface ButtonProps {
  /** @deprecated Используйте isDisabled */
  disabled?: boolean;
  isDisabled?: boolean;
}

function Button({ disabled, isDisabled, ...props }: ButtonProps) {
  const isButtonDisabled = isDisabled ?? disabled;
  return <button {...props} disabled={isButtonDisabled} />;
}

// 2. Обновляем все вызовы
// 3. Удаляем deprecated проп
```

## Инструменты для рефакторинга

- **ESLint** с плагинами `eslint-plugin-react-hooks` — поймает неверные зависимости `useEffect`
- **TypeScript** — безопасное переименование через IDE
- **React DevTools Profiler** — найдёт лишние ре-рендеры
- **Storybook** — позволяет разрабатывать компоненты в изоляции
- **Vitest / Jest** + **React Testing Library** — тесты для безопасного рефакторинга

## Итоги

Рефакторинг — это непрерывный процесс, а не разовое событие. Признаки кода для рефакторинга: компоненты > 200 строк, prop drilling, дублирование логики, сложные условия в JSX. Основные техники: разбиение компонентов, извлечение хуков, использование контекста, упрощение эффектов. Всегда рефакторите маленькими шагами с тестами.
