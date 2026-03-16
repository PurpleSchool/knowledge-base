---
metaTitle: "Документирование компонентов в React — Storybook, JSDoc и README"
metaDescription: "Как документировать React-компоненты с помощью Storybook, JSDoc, PropTypes и README. Практические подходы к созданию живой документации для UI-библиотек."
author: Олег Марков
title: "Документирование компонентов в React: Storybook, JSDoc и README"
preview: "Изучаем подходы к документированию React-компонентов: от JSDoc-аннотаций до Storybook. Узнайте, как создать живую документацию, которую команда действительно будет использовать."
---

# Документирование компонентов в React

Хорошая документация компонента — это не просто список пропсов. Это живой ресурс, который помогает команде быстро понять, как использовать компонент, какие у него варианты и ограничения. В этой статье рассмотрим несколько подходов: от минималистичного JSDoc до полноценного Storybook.

## Почему важно документировать компоненты

Без документации каждый новый разработчик вынужден читать исходный код, чтобы понять, как работает компонент. Для простых компонентов это занимает минуты, для сложных — часы. Умноженное на размер команды и количество компонентов, это существенные потери.

Хорошая документация:
- Ускоряет онбординг
- Предотвращает неправильное использование
- Показывает доступные варианты и граничные случаи
- Служит живым примером использования

## Документирование через TypeScript и JSDoc

Самый доступный уровень документации — типы TypeScript в сочетании с JSDoc-комментариями. Они работают прямо в IDE без дополнительных инструментов.

### Документирование пропсов через интерфейс

```tsx
/**
 * Универсальная кнопка с поддержкой вариантов стиля и состояний загрузки.
 *
 * @example
 * ```tsx
 * // Основное использование
 * <Button onClick={handleSubmit}>Сохранить</Button>
 *
 * // С вариантом и состоянием загрузки
 * <Button variant="danger" isLoading={submitting} onClick={handleDelete}>
 *   Удалить
 * </Button>
 * ```
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Визуальный вариант кнопки.
   * - `primary` — основное действие
   * - `secondary` — второстепенное действие
   * - `danger` — деструктивное действие (удаление, сброс)
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger';

  /**
   * Размер кнопки.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Показывает спиннер и блокирует кнопку во время асинхронной операции.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Иконка слева от текста. Принимает React-элемент (например, из lucide-react).
   * @example `leftIcon={<PlusIcon size={16} />}`
   */
  leftIcon?: React.ReactNode;
}

function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size }))}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
}
```

### Документирование хуков

```tsx
/**
 * Управляет состоянием асинхронного запроса.
 *
 * @template T Тип возвращаемых данных
 * @param asyncFn - Асинхронная функция для выполнения
 * @returns Объект с данными, состоянием загрузки, ошибкой и функцией execute
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data: user, isLoading, error, execute } = useAsync(
 *     () => fetchUser(userId)
 *   );
 *
 *   useEffect(() => { execute(); }, [userId]);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error.message} />;
 *   if (!user) return null;
 *
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
function useAsync<T>(asyncFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, execute };
}
```

## Storybook: живая документация

Storybook — стандарт де-факто для документирования UI-компонентов. Он позволяет разрабатывать и демонстрировать компоненты в изоляции.

### Установка Storybook

```bash
npx storybook@latest init
```

### Написание историй (stories)

Каждый файл `.stories.tsx` описывает варианты использования компонента:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { PlusIcon, TrashIcon } from 'lucide-react';

// Метаданные компонента
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  // Автоматически генерирует таблицу с пропсами из TypeScript-типов
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: 'Визуальный стиль кнопки',
      control: { type: 'select' },
    },
    isLoading: {
      description: 'Состояние загрузки',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Базовый вариант
export const Default: Story = {
  args: {
    children: 'Нажми меня',
  },
};

// Все варианты
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Основное действие',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Второстепенное',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Удалить',
    leftIcon: <TrashIcon size={16} />,
  },
};

// Состояние загрузки
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Сохранение...',
  },
};

// Задокументированный сценарий использования
export const WithIcon: Story = {
  args: {
    leftIcon: <PlusIcon size={16} />,
    children: 'Добавить элемент',
  },
};

// История для демонстрации всех размеров
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button size="sm">Маленький</Button>
      <Button size="md">Средний</Button>
      <Button size="lg">Большой</Button>
    </div>
  ),
};
```

### Документирование сложных взаимодействий

Для компонентов с состоянием используйте `play` функцию:

```tsx
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const FormSubmission: Story = {
  render: () => (
    <LoginForm onSuccess={() => {}} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Симулируем заполнение формы
    await userEvent.type(
      canvas.getByLabelText('Email'),
      'user@example.com'
    );
    await userEvent.type(
      canvas.getByLabelText('Пароль'),
      'password123'
    );

    // Проверяем что кнопка стала активной
    const submitButton = canvas.getByRole('button', { name: 'Войти' });
    await expect(submitButton).not.toBeDisabled();
  },
};
```

## README для компонентов

Для сложных или переиспользуемых компонентов создавайте `README.md` рядом с компонентом:

```
components/
  DataTable/
    index.tsx
    DataTable.tsx
    useDataTable.ts
    README.md
```

Структура README для компонента:

```markdown
# DataTable

Компонент для отображения табличных данных с сортировкой, фильтрацией и пагинацией.

## Быстрый старт

\```tsx
import { DataTable } from '@/components/DataTable';

const columns = [
  { key: 'name', header: 'Имя', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Роль', filterable: true },
];

function UsersPage() {
  const { data } = useUsers();

  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={20}
    />
  );
}
\```

## Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `data` | `T[]` | — | Массив данных для отображения |
| `columns` | `Column<T>[]` | — | Конфигурация колонок |
| `pageSize` | `number` | `10` | Строк на странице |
| `onRowClick` | `(row: T) => void` | — | Обработчик клика по строке |

## Рецепты

### Кастомный рендер ячейки

\```tsx
const columns = [
  {
    key: 'status',
    header: 'Статус',
    render: (value: string) => (
      <StatusBadge status={value} />
    ),
  },
];
\```

## Ограничения

- Виртуализация не поддерживается — не используйте для списков > 1000 строк
- Серверная сортировка настраивается через проп `onSort`
```

## Документирование через PropTypes (для JS-проектов)

Если проект на JavaScript без TypeScript, используйте PropTypes:

```jsx
import PropTypes from 'prop-types';

function UserAvatar({ user, size, showStatus }) {
  // ...
}

UserAvatar.propTypes = {
  /** Объект пользователя */
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
  }).isRequired,
  /** Размер аватара в пикселях */
  size: PropTypes.oneOf([24, 32, 40, 48, 64]),
  /** Показывать индикатор статуса онлайн */
  showStatus: PropTypes.bool,
};

UserAvatar.defaultProps = {
  size: 40,
  showStatus: false,
};
```

## Документирование контекстов и провайдеров

```tsx
/**
 * Контекст темы приложения.
 *
 * Предоставляет текущую тему и функцию для её переключения.
 * Должен оборачивать всё приложение или секцию, которой нужен доступ к теме.
 *
 * @example
 * ```tsx
 * // В root layout
 * <ThemeProvider defaultTheme="light">
 *   <App />
 * </ThemeProvider>
 *
 * // В компоненте
 * const { theme, toggleTheme } = useTheme();
 * ```
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Хук для доступа к контексту темы.
 * Выбрасывает ошибку если используется вне ThemeProvider.
 */
function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
}
```

## Автоматическая генерация документации

Для TypeScript-проектов можно использовать `react-docgen-typescript` или `typedoc`:

```bash
# Установка typedoc
npm install --save-dev typedoc typedoc-plugin-markdown

# Генерация из JSDoc-комментариев
npx typedoc --plugin typedoc-plugin-markdown --out docs src/components
```

Это создаст Markdown-документацию из JSDoc-аннотаций в TypeScript-файлах.

## Итоги

Уровни документации по возрастанию затрат:

1. **TypeScript типы** — минимум, всегда делайте это
2. **JSDoc-комментарии к пропсам** — добавляйте к переиспользуемым компонентам
3. **Примеры использования в JSDoc** — для нетривиальных компонентов
4. **README.md** — для сложных компонентов в shared/UI-библиотеке
5. **Storybook** — для команд с дизайн-системой или UI-библиотекой

Начните с хорошо типизированных интерфейсов и JSDoc. Storybook добавляйте тогда, когда команда растёт и необходимо показывать состояния компонентов нон-разработчикам (дизайнерам, QA).
