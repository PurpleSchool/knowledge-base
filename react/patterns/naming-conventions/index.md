---
metaTitle: "Именование компонентов в React — соглашения и лучшие практики"
metaDescription: "Подробное руководство по именованию компонентов, пропсов, хуков и файлов в React. Стандарты, примеры и типичные ошибки при именовании в React-проектах."
author: Олег Марков
title: "Именование компонентов в React: соглашения и лучшие практики"
preview: "Разбираем стандарты именования компонентов, хуков, пропсов и файлов в React. Узнайте, почему правильное именование критично для читаемости и поддержки кода."
---

# Именование компонентов в React

Именование — одна из тех вещей, которые кажутся тривиальными, но на практике сильно влияют на читаемость, поддерживаемость и масштабируемость проекта. В React сложились устойчивые соглашения об именовании, которых придерживается подавляющее большинство команд. В этой статье разберём все аспекты именования: от компонентов до CSS-классов.

## Почему именование важно

Представьте, что вы открываете незнакомый компонент в большом проекте. Если он называется `D`, `Component1` или `Handler`, вы тратите время на чтение кода, чтобы понять его назначение. Если компонент называется `UserProfileCard` или `PaymentFormModal`, назначение очевидно с первого взгляда.

Хорошее именование:
- Сокращает время onboarding новых разработчиков
- Упрощает поиск компонентов в проекте
- Снижает количество ошибок из-за неверного понимания назначения

## Компоненты: PascalCase

Все React-компоненты именуются в **PascalCase** (каждое слово с заглавной буквы). Это не просто договорённость — React использует регистр первой буквы для различения компонентов и HTML-элементов.

```tsx
// ✅ Правильно
function UserProfile() {
  return <div>...</div>;
}

// ✅ Правильно
const OrderSummaryCard = () => {
  return <div>...</div>;
};

// ❌ Неправильно — React воспримет как HTML-элемент
function userProfile() {
  return <div>...</div>;
}

// ❌ Неправильно
const order_summary = () => {
  return <div>...</div>;
};
```

### Принцип одной ответственности в именовании

Название компонента должно отражать, что именно он делает или что отображает. Избегайте общих слов вроде `Component`, `Block`, `Item` без уточнения:

```tsx
// ❌ Слишком общее
function Block() { ... }
function Item() { ... }
function Component() { ... }

// ✅ Конкретное и описательное
function ProductCard() { ... }
function CartItem() { ... }
function NavigationMenu() { ... }
```

### Составные имена

Когда компонент является частью большей сущности, используйте составные имена:

```tsx
// Группа компонентов для формы авторизации
function AuthForm() { ... }
function AuthFormInput() { ... }
function AuthFormSubmitButton() { ... }
function AuthFormErrorMessage() { ... }
```

Это сразу показывает принадлежность компонентов и облегчает поиск по проекту.

## Именование файлов и директорий

Существует два популярных подхода к именованию файлов:

### Подход 1: PascalCase (совпадает с именем компонента)

```
components/
  UserProfile.tsx
  OrderSummaryCard.tsx
  NavigationMenu.tsx
```

Преимущество: сразу видно, что файл содержит компонент. Легко найти файл по имени компонента.

### Подход 2: kebab-case

```
components/
  user-profile.tsx
  order-summary-card.tsx
  navigation-menu.tsx
```

Преимущество: избегает проблем с регистром на разных ОС (Linux чувствителен к регистру, macOS — нет).

### Структура директорий для компонента

Для сложных компонентов создавайте директорию:

```
components/
  UserProfile/
    index.tsx          // Основной компонент
    UserProfile.tsx    // Или так (если используете именованный файл)
    UserAvatar.tsx     // Дочерние компоненты
    useUserProfile.ts  // Хук компонента
    types.ts           // Типы
    styles.module.css  // Стили (если CSS Modules)
```

## Именование хуков

Все кастомные хуки обязательно должны начинаться с `use`. Это требование React — только так линтер и React DevTools могут отличить хук от обычной функции.

```tsx
// ✅ Правильно
function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  // ...
  return { user };
}

function useDebounce<T>(value: T, delay: number): T {
  // ...
}

function useLocalStorage<T>(key: string, initialValue: T) {
  // ...
}

// ❌ Неправильно — React не распознает как хук
function getUserData(userId: string) { ... }
function debounce<T>(value: T, delay: number) { ... }
```

### Принципы именования хуков

Хорошее имя хука описывает, что он **предоставляет** или **делает**:

```tsx
// Описывает что возвращает
useUserProfile()     // возвращает данные профиля
useFormValidation()  // возвращает состояние валидации
useWindowSize()      // возвращает размер окна

// Описывает поведение
useToggle()          // переключает булевое значение
useDebounce()        // откладывает выполнение
usePrevious()        // хранит предыдущее значение
```

## Именование пропсов

### Булевые пропсы

Булевые пропсы принято именовать с префиксом `is`, `has`, `can`, `should`:

```tsx
interface ButtonProps {
  isDisabled?: boolean;   // состояние
  isLoading?: boolean;    // состояние загрузки
  hasError?: boolean;     // наличие ошибки
  canSubmit?: boolean;    // возможность действия
  shouldAnimate?: boolean; // поведение
}

// Использование — читается как утверждение
<Button isDisabled={!isValid} isLoading={submitting} />
```

### Обработчики событий

Обработчики событий именуются с префиксом `on`:

```tsx
interface CardProps {
  onClose: () => void;
  onClick: (id: string) => void;
  onDataLoad: (data: User[]) => void;
  onChange: (value: string) => void;
}

// Внутри компонента функции-обработчики именуются с handle
function UserCard({ onClose, onClick }: CardProps) {
  const handleClose = () => {
    // внутренняя логика
    onClose();
  };

  const handleClick = () => {
    onClick(user.id);
  };

  return (
    <div onClick={handleClick}>
      <button onClick={handleClose}>×</button>
    </div>
  );
}
```

### Рендер-пропсы и children

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;  // prefix render
  renderEmpty?: () => React.ReactNode;
  children?: React.ReactNode;
}
```

## Именование переменных состояния

Для `useState` принято именовать пару `[значение, setЗначение]`:

```tsx
// ✅ Стандартное именование
const [isOpen, setIsOpen] = useState(false);
const [userName, setUserName] = useState('');
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);

// ❌ Неудобно читать
const [value1, setValue1] = useState(false);
const [x, setX] = useState('');
```

## Именование констант и перечислений

Глобальные константы и значения перечислений именуются в `UPPER_SNAKE_CASE`:

```tsx
// Константы
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// Enum — значения в PascalCase или UPPER_SNAKE_CASE
enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER',
}

// Объект-константа как альтернатива enum
const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

## Именование типов и интерфейсов

```tsx
// Интерфейсы — PascalCase, без префикса I (современная практика)
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Типы — PascalCase
type ButtonVariant = 'primary' | 'secondary' | 'danger';
type UserId = string;

// Дженерики — краткое имя или описательное
type ApiResponse<T> = {
  data: T;
  error: string | null;
};

// Пропсы компонента — ComponentNameProps
interface UserCardProps {
  user: UserProfile;
  onEdit: (id: string) => void;
}
```

## Типичные ошибки именования

### Аббревиатуры и сокращения

Избегайте неочевидных сокращений:

```tsx
// ❌ Непонятно
function UsrPrfl() { ... }
function PrdCrd() { ... }
const usr = getUser();

// ✅ Понятно
function UserProfile() { ... }
function ProductCard() { ... }
const user = getUser();
```

Исключение — общепринятые аббревиатуры: `URL`, `ID`, `API`, `HTML`, `CSS`.

```tsx
// ✅ Общепринятые аббревиатуры — ок
function getUserById(id: string) { ... }
const apiUrl = 'https://...';
interface HTMLElementProps { ... }
```

### Слишком длинные имена

```tsx
// ❌ Слишком длинно
function TheMainUserProfilePageHeaderNavigationMenuComponent() { ... }

// ✅ Достаточно конкретно
function ProfileHeader() { ... }
function ProfileNavigation() { ... }
```

### Бессмысленные суффиксы

```tsx
// ❌ Суффикс ничего не добавляет
function UserProfileHelper() { ... }
function OrderManager() { ... }
const dataObject = { ... };

// ✅ Если нужно уточнить — уточняйте конкретно
function formatUserProfile() { ... }
function useOrderState() { ... }
const orderData = { ... };
```

## Соглашения для CSS и стилизации

При использовании CSS Modules:

```tsx
// styles.module.css — kebab-case классы
.user-profile { ... }
.user-profile__avatar { ... }
.user-profile--active { ... }

// В компоненте
import styles from './styles.module.css';

function UserProfile() {
  return (
    <div className={styles['user-profile']}>
      <img className={styles['user-profile__avatar']} />
    </div>
  );
}
```

При использовании Tailwind или styled-components именование следует тем же принципам PascalCase для компонентов.

## Итоги

Подведём ключевые правила именования в React:

| Сущность | Стиль | Пример |
|----------|-------|--------|
| Компоненты | PascalCase | `UserProfile` |
| Файлы компонентов | PascalCase или kebab-case | `UserProfile.tsx` |
| Хуки | camelCase с `use` | `useUserData` |
| Пропсы-обработчики | camelCase с `on` | `onClick` |
| Внутренние обработчики | camelCase с `handle` | `handleClick` |
| Булевые пропсы | camelCase с `is/has/can` | `isDisabled` |
| Константы | UPPER_SNAKE_CASE | `MAX_COUNT` |
| Типы/интерфейсы | PascalCase | `UserProfileProps` |
| Состояние | camelCase + `set` | `[count, setCount]` |

Следование этим соглашениям делает код предсказуемым: любой разработчик, знакомый с React-экосистемой, сможет быстро разобраться в вашем проекте.
