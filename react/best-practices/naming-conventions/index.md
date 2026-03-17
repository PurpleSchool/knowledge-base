---
metaTitle: Именование компонентов в React — соглашения и лучшие практики
metaDescription: Подробное руководство по именованию компонентов, пропсов, хуков, файлов и переменных в React. Соглашения об именовании для чистого и поддерживаемого кода
author: Олег Марков
title: Именование компонентов в React — соглашения и лучшие практики
preview: Правильное именование — основа читаемого и поддерживаемого React-кода. Узнайте, как называть компоненты, пропсы, хуки и файлы, чтобы ваш код был понятен всей команде с первого взгляда
---

## Введение

Именование — одно из ключевых решений в программировании. Хорошие имена делают код самодокументирующимся, снижают когнитивную нагрузку и ускоряют онбординг новых разработчиков. В экосистеме React сложился ряд устойчивых соглашений об именовании, которые поддерживаются сообществом, инструментами статического анализа и самим React DevTools.

В этой статье мы подробно разберём соглашения для компонентов, пропсов, хуков, файлов и переменных состояния — с примерами правильного и неправильного подхода.

## Именование компонентов

### PascalCase — стандарт для компонентов

Все React-компоненты именуются в **PascalCase** (каждое слово с заглавной буквы). Это не просто конвенция — React различает компоненты и обычные HTML-элементы именно по регистру первой буквы: `<button>` — HTML-элемент, `<Button>` — React-компонент.

```tsx
// ✅ Правильно — PascalCase
function UserProfile() {
  return <div>Профиль пользователя</div>;
}

const ProductCard = () => {
  return <div>Карточка товара</div>;
};

// ❌ Неправильно — camelCase или snake_case
function userProfile() { // React не распознает как компонент
  return <div>Профиль</div>;
}

const product_card = () => { // Нарушение конвенции
  return <div>Карточка</div>;
};
```

### Описательные имена компонентов

Имя компонента должно точно описывать его назначение. Избегайте общих имён вроде `Component`, `Item`, `Box` без контекста.

```tsx
// ✅ Правильно — имя описывает назначение
function NavigationSidebar() { ... }
function UserAvatarWithStatus() { ... }
function ProductSearchResultList() { ... }
function CheckoutPaymentForm() { ... }

// ❌ Слишком общие имена
function MyComponent() { ... }
function Item() { ... }
function Box() { ... }
function Wrapper() { ... }
```

### Суффиксы для уточнения типа компонента

Для уточнения роли компонента используют смысловые суффиксы:

```tsx
// Формы
function LoginForm() { ... }
function RegistrationForm() { ... }
function ProfileEditForm() { ... }

// Модальные окна и диалоги
function ConfirmDeleteModal() { ... }
function ImagePreviewDialog() { ... }

// Провайдеры контекста
function ThemeProvider() { ... }
function AuthProvider() { ... }
function CartProvider() { ... }

// Страницы (в Next.js и React Router)
function UserProfilePage() { ... }
function ProductDetailPage() { ... }

// Layouts
function DashboardLayout() { ... }
function AuthLayout() { ... }
```

### HOC — именование компонентов высшего порядка

Компоненты высшего порядка принято именовать с префикса `with`:

```tsx
// ✅ Правильно — с префиксом with
function withAuthentication<P>(Component: React.ComponentType<P>) {
  return function WithAuthentication(props: P) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <LoginPage />;
    return <Component {...props} />;
  };
}

// Использование
const ProtectedDashboard = withAuthentication(Dashboard);
const ProtectedSettings = withAuthentication(Settings);

// ❌ Неинформативно
function auth(Component) { ... }
function requiresAuth(Component) { ... }
```

## Именование пропсов

### camelCase для пропсов

Пропсы именуются в **camelCase**, как и все JavaScript-переменные:

```tsx
// ✅ Правильно
interface UserCardProps {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeenAt: Date;
  onFollowClick: () => void;
}

// ❌ Неправильно
interface UserCardProps {
  first_name: string;   // snake_case
  LastName: string;     // PascalCase
  avatar-url: string;   // kebab-case (синтаксически невалидно)
}
```

### Булевы пропсы — с префиксом is, has, can, should

Для булевых значений используют смысловые префиксы, которые делают код читаемым как обычный текст:

```tsx
interface ButtonProps {
  // ✅ is — текущее состояние
  isDisabled: boolean;
  isLoading: boolean;
  isActive: boolean;
  isVisible: boolean;

  // ✅ has — наличие чего-либо
  hasError: boolean;
  hasIcon: boolean;
  hasBadge: boolean;

  // ✅ can — разрешение/возможность
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;

  // ✅ should — ожидаемое поведение
  shouldAutoFocus: boolean;
  shouldCloseOnClickOutside: boolean;
}

// Пример использования — читается как предложение
<Button isLoading={true} isDisabled={false} canSubmit={isFormValid} />
```

### Обработчики событий — с префиксом on

Пропсы-колбэки для событий именуются с префикса `on`:

```tsx
interface FormProps {
  // ✅ Правильно — onСобытие
  onSubmit: (data: FormData) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  onCancel: () => void;
  onSuccess: (result: ApiResponse) => void;
  onError: (error: Error) => void;
}

// ❌ Неправильно
interface FormProps {
  submitHandler: () => void;   // без on
  handleChange: () => void;    // глагол без on
  clickCallback: () => void;   // слово callback
}
```

### Рендер-пропсы — с префиксом render

Если пропс принимает функцию, возвращающую JSX, используйте префикс `render`:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderHeader?: () => React.ReactNode;
}

// Использование
<List
  items={users}
  renderItem={(user) => <UserCard key={user.id} user={user} />}
  renderEmpty={() => <EmptyState message="Пользователей не найдено" />}
/>
```

## Именование хуков

### Обязательный префикс use

Все кастомные хуки **обязаны** начинаться с `use`. Это не просто конвенция — React использует это правило для линтера (`eslint-plugin-react-hooks`), чтобы проверять соблюдение правил хуков.

```tsx
// ✅ Правильно — начинаются с use
function useAuth() { ... }
function useLocalStorage<T>(key: string) { ... }
function useDebounce<T>(value: T, delay: number) { ... }
function useWindowSize() { ... }
function useIntersectionObserver(ref: RefObject<Element>) { ... }

// ❌ Неправильно — React не считает их хуками
function getAuth() { ... }        // нет use
function authHook() { ... }       // use не первое слово
function UseAuth() { ... }        // не camelCase, PascalCase зарезервирован для компонентов
```

### Хук должен описывать, что возвращает или делает

```tsx
// ✅ Ясно по названию — возвращает данные пользователя
function useCurrentUser() {
  const { data } = useQuery(['user', userId], fetchUser);
  return data;
}

// ✅ Ясно — управляет состоянием переключателя
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
}

// ✅ Ясно — предоставляет операции с корзиной
function useShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return { items, addItem, removeItem, clearCart };
}

// ❌ Непонятно из названия
function useData() { ... }   // какие данные?
function useHelper() { ... } // что помогает?
function useStuff() { ... }  // вообще неясно
```

## Именование файлов и папок

### Компонент = папка с index.tsx

Стандартный подход — каждый компонент получает собственную папку:

```
components/
├── UserProfile/
│   ├── index.tsx          # Основной компонент
│   ├── UserProfile.tsx    # Альтернатива: явное имя вместо index
│   ├── UserProfile.test.tsx
│   ├── UserProfile.stories.tsx
│   └── UserProfile.module.css
├── ProductCard/
│   ├── index.tsx
│   └── ProductCard.module.css
└── NavigationSidebar/
    ├── index.tsx
    ├── NavItem.tsx        # Дочерний компонент
    └── useNavigation.ts   # Хук, специфичный для компонента
```

### Соглашение для имён файлов

```
# Компоненты — PascalCase
UserProfile.tsx
ProductCard.tsx
NavigationSidebar.tsx

# Хуки — camelCase с use
useAuth.ts
useLocalStorage.ts
useDebounce.ts

# Утилиты и хелперы — camelCase
formatDate.ts
parseUserData.ts
validateEmail.ts

# Типы — camelCase или PascalCase
types.ts
userTypes.ts
ProductTypes.ts

# Константы — camelCase или SCREAMING_SNAKE_CASE
constants.ts
API_ENDPOINTS.ts

# Тесты — суффикс .test или .spec
UserProfile.test.tsx
useAuth.spec.ts
```

### Именование папок разделов

```
src/
├── components/       # Переиспользуемые компоненты
├── pages/            # Страницы (или app/ в Next.js)
├── hooks/            # Кастомные хуки
├── utils/            # Вспомогательные функции
├── services/         # API-сервисы
├── store/            # Глобальное состояние
├── types/            # TypeScript-типы и интерфейсы
├── constants/        # Константы
└── contexts/         # React Context'ы
```

## Именование состояния и переменных

### useState — имя состояния и сеттер

По конвенции первый элемент — состояние, второй — функция обновления с префиксом `set`:

```tsx
// ✅ Правильно — [состояние, setСостояние]
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
const [userName, setUserName] = useState('');
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

// ❌ Неправильно
const [x, y] = useState(0);           // x и y не описательны
const [val, changeVal] = useState(''); // change вместо set
const [data, updateData] = useState(); // update вместо set (исключение — намеренно, для чёткости)
```

### useRef — суффикс Ref

```tsx
// ✅ Правильно — суффикс Ref говорит, что это не значение, а ссылка
const inputRef = useRef<HTMLInputElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const prevValueRef = useRef(value);

// ❌ Без суффикса — неясно, что это ref
const input = useRef(null);     // может быть спутано с данными
const container = useRef(null); // аналогично
```

### Переменные контекста — суффикс Context

```tsx
// Создание контекста
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const CartContext = createContext<CartContextValue | undefined>(undefined);

// Хук для использования контекста — без суффикса Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return context;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return context;
}
```

## Именование типов и интерфейсов TypeScript

### Props-интерфейсы — суффикс Props

```tsx
// ✅ Стандарт для пропсов компонента
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface UserCardProps {
  user: User;
  onFollow: (userId: string) => void;
}

// Функциональный компонент с типизированными пропсами
function Button({ label, variant, onClick }: ButtonProps) {
  return (
    <button className={`btn btn--${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

### Типы для контекста — суффикс ContextValue

```tsx
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Общие типы данных — PascalCase без суффиксов

```tsx
// Модели данных
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
}

// Перечисления
enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

// Union-типы
type Status = 'idle' | 'loading' | 'success' | 'error';
type Theme = 'light' | 'dark' | 'system';
```

## Именование в CSS Modules

### BEM-подобный подход для CSS-классов

```tsx
// UserCard.module.css
.container { ... }
.header { ... }
.avatar { ... }
.avatarLarge { ... }     // camelCase для модификаторов
.title { ... }
.titlePrimary { ... }
.isActive { ... }        // булевое состояние
.isDisabled { ... }

// UserCard.tsx
import styles from './UserCard.module.css';

function UserCard({ isActive, size }: UserCardProps) {
  return (
    <div className={`${styles.container} ${isActive ? styles.isActive : ''}`}>
      <img className={`${styles.avatar} ${size === 'large' ? styles.avatarLarge : ''}`} />
      <h2 className={styles.title}>...</h2>
    </div>
  );
}
```

## Частые ошибки именования

### Аббревиатуры снижают читаемость

```tsx
// ❌ Аббревиатуры требуют контекста
function UsrPrfl() { ... }         // UserProfile?
const usrAuthCtx = useContext(...); // userAuthContext?
const handleBtnClk = () => { ... }; // handleButtonClick?

// ✅ Полные имена понятны сразу
function UserProfile() { ... }
const userAuthContext = useContext(...);
const handleButtonClick = () => { ... };

// Допустимые общепринятые аббревиатуры
const ref = useRef(null);       // ref — устоявшееся
const el = document.getElementById('root'); // el — принято
const e = (e: MouseEvent) => { }; // e для событий — стандарт
const i = 0;                    // i для счётчика — стандарт
```

### Числа в именах — признак плохой архитектуры

```tsx
// ❌ Числа — признак того, что компоненты делают одно и то же
function Form1() { ... }
function Form2() { ... }
function Form3() { ... }

// ✅ Описательные имена отражают различия
function LoginForm() { ... }
function RegistrationForm() { ... }
function ProfileEditForm() { ... }
```

### Глаголы вместо существительных для компонентов

```tsx
// ❌ Глаголы — для действий (функций), не для компонентов (существ)
function RenderUser() { ... }
function DisplayProduct() { ... }
function ShowModal() { ... }

// ✅ Существительные для компонентов
function UserCard() { ... }
function ProductDisplay() { ... }
function Modal() { ... }

// Исключение — компоненты-действия (HOC, Compound)
function WithRouter(Component) { ... }  // HOC — глагол допустим
```

## Связанные темы

- [Документирование компонентов](../component-documentation/index.md) — JSDoc и Storybook
- [Комментирование кода](../commenting/index.md) — когда и как комментировать
- [Рефакторинг React-кода](../refactoring/index.md) — как улучшать существующий код
