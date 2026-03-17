---
metaTitle: Рефакторинг React-кода — техники и паттерны улучшения компонентов
metaDescription: Практическое руководство по рефакторингу React-приложений: декомпозиция компонентов, извлечение хуков, устранение prop drilling, замена устаревших паттернов
author: Олег Марков
title: Рефакторинг React-кода — техники и паттерны улучшения компонентов
preview: Компоненты на 500 строк, prop drilling на 5 уровней, логика и UI в одном месте — знакомые проблемы? Узнайте системные техники рефакторинга React-кода, которые превращают запутанный код в чистый и поддерживаемый
---

## Введение

Рефакторинг — это улучшение внутренней структуры кода без изменения его внешнего поведения. В React-разработке потребность в рефакторинге возникает регулярно: требования меняются, компоненты разрастаются, появляется дублирование.

Хороший рефакторинг — не переписывание «с нуля», а систематическое применение конкретных техник. В этой статье мы разберём наиболее важные из них с практическими примерами.

## Признаки кода, требующего рефакторинга

Прежде чем начинать рефакторинг, важно уметь распознавать проблемные места:

- **Компонент > 200 строк** — скорее всего, делает слишком много
- **Prop drilling > 2-3 уровней** — пора думать о контексте или composition
- **Дублирование логики** в нескольких компонентах — нужен общий хук или утилита
- **Трудно написать тест** — признак плохой архитектуры
- **Смешанная ответственность** — логика, данные и UI в одном месте

## Декомпозиция компонентов

### Разделение большого компонента

Самая частая задача рефакторинга — разбить большой компонент на меньшие:

```tsx
// ❌ До рефакторинга — один компонент делает всё
function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchUser(userId),
      fetchOrders(userId),
    ]).then(([userData, ordersData]) => {
      setUser(userData);
      setOrders(ordersData);
      setIsLoading(false);
    });
  }, [userId]);

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <span>Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <img src={user?.avatarUrl} alt={user?.name} className="avatar" />
        <div>
          <h1>{user?.name}</h1>
          <span>{user?.email}</span>
        </div>
      </header>

      <nav className="dashboard-tabs">
        {(['profile', 'orders', 'settings'] as const).map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'profile' ? 'Профиль' : tab === 'orders' ? 'Заказы' : 'Настройки'}
          </button>
        ))}
      </nav>

      {activeTab === 'profile' && (
        <section>
          <h2>Профиль</h2>
          <p>Имя: {user?.name}</p>
          <p>Email: {user?.email}</p>
          <p>Дата регистрации: {user?.createdAt?.toLocaleDateString()}</p>
        </section>
      )}

      {activeTab === 'orders' && (
        <section>
          <h2>Заказы ({orders.length})</h2>
          <ul>
            {orders.map(order => (
              <li key={order.id}>
                <span>#{order.number}</span>
                <span>{order.total} ₽</span>
                <span>{order.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === 'settings' && (
        <section>
          <h2>Настройки</h2>
          {/* ... настройки ... */}
        </section>
      )}
    </div>
  );
}
```

```tsx
// ✅ После рефакторинга — декомпозиция на логические части

// Хук для данных
function useUserDashboard(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchUser(userId), fetchOrders(userId)])
      .then(([userData, ordersData]) => {
        setUser(userData);
        setOrders(ordersData);
        setIsLoading(false);
      });
  }, [userId]);

  return { user, orders, isLoading };
}

// Компонент заголовка
function DashboardHeader({ user }: { user: User }) {
  return (
    <header className="dashboard-header">
      <img src={user.avatarUrl} alt={user.name} className="avatar" />
      <div>
        <h1>{user.name}</h1>
        <span>{user.email}</span>
      </div>
    </header>
  );
}

// Компонент вкладок
type DashboardTab = 'profile' | 'orders' | 'settings';

function DashboardTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const tabs: { value: DashboardTab; label: string }[] = [
    { value: 'profile', label: 'Профиль' },
    { value: 'orders', label: 'Заказы' },
    { value: 'settings', label: 'Настройки' },
  ];

  return (
    <nav className="dashboard-tabs">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          className={`tab ${activeTab === value ? 'tab--active' : ''}`}
          onClick={() => onTabChange(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

// Компонент списка заказов
function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="empty-state">У вас пока нет заказов</p>;
  }

  return (
    <section>
      <h2>Заказы ({orders.length})</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id} className="order-item">
            <span>#{order.number}</span>
            <span>{order.total} ₽</span>
            <OrderStatusBadge status={order.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Основной компонент — теперь простой оркестратор
function UserDashboard({ userId }: { userId: string }) {
  const { user, orders, isLoading } = useUserDashboard(userId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('profile');

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <ErrorState message="Пользователь не найден" />;

  return (
    <div className="dashboard">
      <DashboardHeader user={user} />
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'profile' && <UserProfileSection user={user} />}
      {activeTab === 'orders' && <OrderList orders={orders} />}
      {activeTab === 'settings' && <UserSettingsSection userId={userId} />}
    </div>
  );
}
```

## Извлечение кастомных хуков

Логика, которая не связана с рендером — кандидат на хук:

```tsx
// ❌ Логика смешана с компонентом
function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    setError(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (!value.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchProducts(value);
        setResults(data);
      } catch (err) {
        setError('Ошибка поиска. Попробуйте снова.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div>
      <input value={query} onChange={e => handleSearch(e.target.value)} />
      {isLoading && <Spinner />}
      {error && <ErrorMessage text={error} />}
      <ProductList products={results} />
    </div>
  );
}
```

```tsx
// ✅ Хук извлечён — логика переиспользуема и тестируема отдельно

function useProductSearch(delay = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchProducts(query);
        setResults(data);
      } catch {
        setError('Ошибка поиска. Попробуйте снова.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return { query, setQuery, results, isLoading, error };
}

// Компонент — только UI
function ProductSearch() {
  const { query, setQuery, results, isLoading, error } = useProductSearch();

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск товаров..."
      />
      {isLoading && <Spinner />}
      {error && <ErrorMessage text={error} />}
      <ProductList products={results} />
    </div>
  );
}
```

## Устранение Prop Drilling

Передача пропсов через множество промежуточных компонентов — одна из наиболее болезненных проблем React-приложений.

### Диагностика prop drilling

```tsx
// ❌ Пропс userId передаётся через 4 уровня, из которых 3 его только пробрасывают
function App() {
  const [userId] = useState('123');
  return <Layout userId={userId} />;
}

function Layout({ userId }: { userId: string }) {
  return <Dashboard userId={userId} />;
}

function Dashboard({ userId }: { userId: string }) {
  return <Sidebar userId={userId} />;
}

function Sidebar({ userId }: { userId: string }) {
  return <UserMenu userId={userId} />;
}

// Только здесь userId используется
function UserMenu({ userId }: { userId: string }) {
  const user = useUser(userId);
  return <Avatar src={user.avatarUrl} />;
}
```

### Решение 1: Context API

```tsx
// ✅ Context API для данных, которые нужны многим компонентам

const UserContext = createContext<User | null>(null);

function useCurrentUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error('Компонент должен быть внутри UserProvider');
  return user;
}

function App() {
  const [user] = useState<User>({ id: '123', name: 'Иван', avatarUrl: '...' });
  return (
    <UserContext.Provider value={user}>
      <Layout />
    </UserContext.Provider>
  );
}

// Промежуточные компоненты не знают о userId
function Layout() { return <Dashboard />; }
function Dashboard() { return <Sidebar />; }
function Sidebar() { return <UserMenu />; }

// Компонент берёт данные напрямую из контекста
function UserMenu() {
  const user = useCurrentUser();
  return <Avatar src={user.avatarUrl} />;
}
```

### Решение 2: Composition (Children Pattern)

Иногда лучшее решение — изменить структуру компонентов, а не добавлять контекст:

```tsx
// ✅ Composition: дочерний компонент передаётся сверху, минуя промежуточные
function App() {
  const [userId] = useState('123');
  return (
    <Layout>
      <Dashboard>
        <Sidebar>
          {/* UserMenu создаётся здесь, где есть userId */}
          <UserMenu userId={userId} />
        </Sidebar>
      </Dashboard>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="layout">{children}</div>;
}

function Dashboard({ children }: { children: React.ReactNode }) {
  return <div className="dashboard">{children}</div>;
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return <aside className="sidebar">{children}</aside>;
}
```

## Замена устаревших паттернов

### Классовые компоненты → Функциональные

```tsx
// ❌ Классовый компонент (legacy)
class UserCounter extends React.Component<Props, State> {
  state = { count: 0 };

  componentDidMount() {
    document.title = `Счётчик: ${this.state.count}`;
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (prevState.count !== this.state.count) {
      document.title = `Счётчик: ${this.state.count}`;
    }
  }

  increment = () => {
    this.setState(prev => ({ count: prev.count + 1 }));
  };

  render() {
    return (
      <div>
        <span>{this.state.count}</span>
        <button onClick={this.increment}>+</button>
      </div>
    );
  }
}

// ✅ Функциональный компонент с хуками
function UserCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Счётчик: ${count}`;
  }, [count]);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(prev => prev + 1)}>+</button>
    </div>
  );
}
```

### render props → кастомный хук

```tsx
// ❌ Render Props (устаревший паттерн)
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };

  handleMouseMove = (e: MouseEvent) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };

  render() {
    return (
      <div onMouseMove={this.handleMouseMove}>
        {this.props.render(this.state)}
      </div>
    );
  }
}

// Использование
<MouseTracker render={({ x, y }) => <span>{x}, {y}</span>} />

// ✅ Кастомный хук
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}

// Использование
function MouseDisplay() {
  const { x, y } = useMousePosition();
  return <span>{x}, {y}</span>;
}
```

## Улучшение читаемости условного рендера

```tsx
// ❌ Вложенные тернарники сложно читать
function UserStatus({ user }: { user: User | null }) {
  return (
    <div>
      {user !== null
        ? user.isVerified
          ? user.isPremium
            ? <PremiumBadge />
            : <VerifiedBadge />
          : <UnverifiedWarning />
        : <GuestPlaceholder />
      }
    </div>
  );
}

// ✅ Ранние возвраты и отдельные переменные
function UserStatus({ user }: { user: User | null }) {
  if (!user) return <GuestPlaceholder />;
  if (!user.isVerified) return <UnverifiedWarning />;

  return (
    <div>
      {user.isPremium ? <PremiumBadge /> : <VerifiedBadge />}
    </div>
  );
}
```

## Рефакторинг обработки форм

```tsx
// ❌ Много дублирующихся useState для каждого поля
function RegistrationForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 50+ строк обработчиков...
}

// ✅ useReducer для сложных форм
type FormState = {
  values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  errors: Partial<Record<keyof FormState['values'], string>>;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState['values']; value: string }
  | { type: 'SET_ERRORS'; errors: FormState['errors'] }
  | { type: 'RESET' };

const initialState: FormState = {
  values: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  errors: {},
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = (field: keyof FormState['values']) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_FIELD', field, value: e.target.value });
    };

  return (
    <form>
      <input value={state.values.firstName} onChange={handleChange('firstName')} />
      <input value={state.values.email} onChange={handleChange('email')} />
      {/* ... остальные поля ... */}
    </form>
  );
}
```

## Безопасность рефакторинга

### Тесты как страховка

Прежде чем рефакторить — убедитесь, что есть тесты, которые подтвердят, что поведение не изменилось:

```tsx
// Тест ПЕРЕД рефакторингом — фиксирует текущее поведение
describe('ProductSearch', () => {
  it('показывает результаты при вводе запроса', async () => {
    const mockResults = [{ id: '1', name: 'Ноутбук' }];
    jest.spyOn(api, 'searchProducts').mockResolvedValue(mockResults);

    render(<ProductSearch />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'ноут');
    await screen.findByText('Ноутбук');

    expect(screen.getByText('Ноутбук')).toBeInTheDocument();
  });
});

// Рефакторинг — тест должен пройти без изменений
```

### Инкрементальный подход

Рефакторинг большого компонента лучше проводить поэтапно:

1. Добавить тесты на текущее поведение
2. Извлечь один хук
3. Убедиться, что тесты проходят
4. Извлечь один дочерний компонент
5. Убедиться, что тесты проходят
6. Повторять до достижения нужного состояния

## Связанные темы

- [Именование компонентов](../naming-conventions/index.md) — соглашения об именовании
- [Безопасность в React](../security/index.md) — защита от уязвимостей при рефакторинге
- [Паттерны React](../../patterns/index.md) — архитектурные паттерны
