---
metaTitle: Документирование React-компонентов — JSDoc, Storybook и README
metaDescription: Полное руководство по документированию React-компонентов: JSDoc для пропсов и хуков, создание историй в Storybook, написание README для компонентных библиотек
author: Олег Марков
title: Документирование React-компонентов — JSDoc, Storybook и README
preview: Хорошо задокументированные компоненты живут дольше и используются чаще. Узнайте, как создавать документацию, которую разработчики действительно будут читать — от JSDoc до живых примеров в Storybook
---

## Введение

Документирование компонентов — это инвестиция, которая окупается многократно. Хорошо задокументированный компонент используют правильно, не дублируют и не боятся изменять. Плохо задокументированный — копируют с ошибками, используют не по назначению и обходят стороной.

В React-экосистеме сложилось три уровня документации: JSDoc-аннотации прямо в коде, живые примеры в Storybook и README-файлы для компонентных библиотек. Рассмотрим каждый уровень подробно.

## JSDoc — документация прямо в коде

JSDoc — стандарт документирования JavaScript/TypeScript, который понимают все современные IDE. Правильно оформленный JSDoc превращает подсказки редактора в полноценную документацию.

### Документирование пропсов через интерфейс

Самый эффективный способ документировать пропсы в TypeScript — добавить JSDoc-комментарии к полям интерфейса:

```tsx
interface DataTableProps<T extends Record<string, unknown>> {
  /** Массив данных для отображения в таблице */
  data: T[];

  /**
   * Конфигурация колонок таблицы.
   * Каждый объект описывает один столбец: ключ данных, заголовок и рендерер.
   */
  columns: ColumnDef<T>[];

  /**
   * Количество строк на странице.
   * @default 10
   * @minimum 5
   * @maximum 100
   */
  pageSize?: number;

  /**
   * Включает возможность сортировки по клику на заголовок колонки.
   * @default false
   */
  sortable?: boolean;

  /**
   * Включает фильтрацию строк по введённому тексту.
   * Поиск происходит по всем видимым колонкам.
   * @default false
   */
  filterable?: boolean;

  /**
   * Колбэк, вызываемый при клике на строку таблицы.
   * Получает элемент данных и его индекс в массиве.
   *
   * @param row - Элемент данных из массива data
   * @param index - Индекс элемента в массиве
   */
  onRowClick?: (row: T, index: number) => void;

  /**
   * Компонент-заглушка для пустого состояния.
   * Отображается когда data.length === 0.
   * По умолчанию показывает стандартное сообщение «Нет данных».
   */
  emptyState?: React.ReactNode;
}
```

### Документирование компонента

```tsx
/**
 * Таблица данных с поддержкой сортировки, фильтрации и пагинации.
 *
 * Компонент типизирован дженериком T — тип данных выводится автоматически
 * из переданного массива `data`.
 *
 * @template T - Тип элемента данных. Должен быть объектом.
 *
 * @example Базовое использование
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { key: 'name', header: 'Имя' },
 *   { key: 'email', header: 'Email' },
 * ];
 *
 * <DataTable data={users} columns={columns} />
 * ```
 *
 * @example С сортировкой и пагинацией
 * ```tsx
 * <DataTable
 *   data={products}
 *   columns={productColumns}
 *   sortable
 *   filterable
 *   pageSize={25}
 *   onRowClick={(product) => navigate(`/products/${product.id}`)}
 * />
 * ```
 *
 * @see {@link https://company-storybook.example.com/?path=/docs/data-table} Storybook
 */
function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  sortable = false,
  filterable = false,
  onRowClick,
  emptyState,
}: DataTableProps<T>) {
  // Реализация компонента
  return <table>...</table>;
}
```

### Документирование хуков

Хуки — особенно важны для документирования, так как их поведение не всегда очевидно:

```tsx
/**
 * Хук для управления асинхронными операциями с отслеживанием состояния.
 *
 * @template T - Тип возвращаемых данных
 * @template E - Тип ошибки (по умолчанию Error)
 *
 * @param asyncFunction - Асинхронная функция для выполнения
 * @param options - Дополнительные параметры
 * @param options.immediate - Выполнить сразу при монтировании компонента
 * @param options.onSuccess - Колбэк при успешном выполнении
 * @param options.onError - Колбэк при ошибке
 *
 * @returns Объект с состоянием и функцией запуска
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, isLoading, error, execute } = useAsync(
 *     () => api.fetchUser(userId),
 *     { immediate: true }
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   return <ProfileView user={data} />;
 * }
 * ```
 */
function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: E) => void;
  } = {}
): {
  data: T | null;
  isLoading: boolean;
  error: E | null;
  execute: () => Promise<void>;
} {
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: E | null;
  }>({ data: null, isLoading: false, error: null });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await asyncFunction();
      setState({ data: result, isLoading: false, error: null });
      options.onSuccess?.(result);
    } catch (err) {
      setState({ data: null, isLoading: false, error: err as E });
      options.onError?.(err as E);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (options.immediate) execute();
  }, []);

  return { ...state, execute };
}
```

## Storybook — живая документация

Storybook — стандарт для документирования UI-компонентов в React. Он создаёт изолированную среду, где каждый компонент можно увидеть и потрогать с разными пропсами.

### Установка и настройка

```bash
# Установка в существующий проект
npx storybook@latest init

# Storybook запускается на localhost:6006
npm run storybook
```

### Написание историй (Stories) — CSF 3

Component Story Format 3 (CSF3) — текущий стандарт написания историй:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Мета-данные компонента
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  // Автоматически документируем все пропсы
  tags: ['autodocs'],
  // Параметры на уровне всех историй
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Основная кнопка интерфейса. Поддерживает 4 варианта и 3 размера.',
      },
    },
  },
  // Дефолтные аргументы для всех историй
  args: {
    onClick: () => console.log('Clicked!'),
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// История: базовое состояние
export const Default: Story = {
  args: {
    label: 'Нажми меня',
    variant: 'primary',
  },
};

// История: с конкретными пропсами
export const Secondary: Story = {
  args: {
    label: 'Дополнительное действие',
    variant: 'secondary',
  },
};

// История: состояние загрузки
export const Loading: Story = {
  args: {
    label: 'Сохранение...',
    variant: 'primary',
    isLoading: true,
  },
};

// История: заблокированная
export const Disabled: Story = {
  args: {
    label: 'Недоступно',
    isDisabled: true,
  },
};

// История: все размеры
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button label="Маленькая" size="small" />
      <Button label="Средняя" size="medium" />
      <Button label="Большая" size="large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Компонент доступен в трёх размерах: small, medium и large.',
      },
    },
  },
};
```

### Документирование через autodocs

Storybook с тегом `autodocs` автоматически генерирует таблицу пропсов из TypeScript-типов и JSDoc-комментариев:

```tsx
// Чтобы autodocs работал корректно — важно:
// 1. TypeScript-типы должны быть явными (не any)
// 2. JSDoc на интерфейсе пропсов
// 3. Значения по умолчанию в деструктуризации

interface CardProps {
  /** Заголовок карточки */
  title: string;

  /** Описание (опциональное) */
  description?: string;

  /**
   * Визуальное выделение карточки.
   * @default false
   */
  highlighted?: boolean;

  /** Дочерние элементы */
  children: React.ReactNode;
}

function Card({ title, description, highlighted = false, children }: CardProps) {
  return (
    <div className={highlighted ? 'card card--highlighted' : 'card'}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
```

### Декораторы для контекста

Многим компонентам нужен контекст (тема, роутер, i18n). В Storybook это решается через декораторы:

```tsx
// .storybook/preview.tsx
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

export const decorators = [
  (Story) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
];

// Или на уровне конкретной истории
export const WithAuth: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={mockUser}>
        <Story />
      </AuthProvider>
    ),
  ],
  args: {
    // ...
  },
};
```

### Interaction Tests в Storybook

Storybook позволяет писать автоматические тесты взаимодействия прямо в историях:

```tsx
import { within, userEvent, expect } from '@storybook/test';

export const FormSubmission: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Находим поля ввода
    const emailInput = canvas.getByLabelText('Email');
    const passwordInput = canvas.getByLabelText('Пароль');
    const submitButton = canvas.getByRole('button', { name: 'Войти' });

    // Заполняем форму
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Отправляем
    await userEvent.click(submitButton);

    // Проверяем, что колбэк вызван с правильными данными
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  },
};
```

## README для компонентных библиотек

Когда компонент или библиотека компонентов публикуется как пакет — README становится первым, что видит разработчик.

### Структура хорошего README

```markdown
# ComponentName

Краткое описание в одном предложении — что делает компонент и для чего.

## Установка

```bash
npm install @company/components
```

## Быстрый старт

```tsx
import { ComponentName } from '@company/components';

function App() {
  return <ComponentName prop="value" />;
}
```

## Пропсы

| Пропс | Тип | По умолчанию | Описание |
|-------|-----|--------------|----------|
| `prop1` | `string` | — | Обязательный пропс |
| `prop2` | `number` | `10` | Опциональный пропс |
| `onAction` | `() => void` | — | Вызывается при действии |

## Примеры

### Базовое использование

```tsx
<ComponentName prop1="значение" />
```

### С дополнительными параметрами

```tsx
<ComponentName
  prop1="значение"
  prop2={20}
  onAction={() => console.log('действие')}
/>
```

## Доступность

- Компонент поддерживает навигацию с клавиатуры
- Соответствует WCAG 2.1 уровня AA
- Использует семантические HTML-элементы

## Связанные компоненты

- [RelatedComponent](./RelatedComponent/README.md)
```

### Документирование сложных паттернов использования

```tsx
// Плохо: нет примера для сложного случая
/**
 * Компонент SelectField с поиском и мультивыбором.
 */

// Хорошо: есть примеры для всех ключевых случаев использования
/**
 * Компонент SelectField с поиском и мультивыбором.
 *
 * @example Одиночный выбор
 * ```tsx
 * const [value, setValue] = useState('');
 *
 * <SelectField
 *   options={countries}
 *   value={value}
 *   onChange={setValue}
 *   placeholder="Выберите страну"
 * />
 * ```
 *
 * @example Мультивыбор
 * ```tsx
 * const [values, setValues] = useState<string[]>([]);
 *
 * <SelectField
 *   multiple
 *   options={tags}
 *   value={values}
 *   onChange={setValues}
 *   placeholder="Выберите теги"
 * />
 * ```
 *
 * @example Асинхронная загрузка опций
 * ```tsx
 * <SelectField
 *   options={[]}
 *   isLoading={isLoadingOptions}
 *   onSearchChange={async (query) => {
 *     const results = await searchUsers(query);
 *     setOptions(results);
 *   }}
 * />
 * ```
 */
```

## Автогенерация документации

### TypeDoc

TypeDoc генерирует HTML-документацию из TypeScript-кода и JSDoc:

```bash
npm install typedoc --save-dev

# typedoc.json
{
  "entryPoints": ["./src/index.ts"],
  "out": "docs",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "markdown",
  "readme": "README.md"
}

# Генерация
npx typedoc
```

### react-docgen

react-docgen — инструмент для извлечения информации о пропсах из JSX-компонентов:

```bash
npm install react-docgen --save-dev

# Извлечение документации из компонента
npx react-docgen src/components/Button/Button.tsx --pretty
```

Вывод:

```json
{
  "description": "Основная кнопка интерфейса",
  "props": {
    "label": {
      "type": { "name": "string" },
      "required": true,
      "description": "Текст кнопки"
    },
    "variant": {
      "type": { "name": "enum", "value": ["primary", "secondary", "danger"] },
      "required": false,
      "defaultValue": { "value": "primary" },
      "description": "Визуальный стиль кнопки"
    }
  }
}
```

## Чеклист документирования компонента

Перед тем как считать компонент готовым — пройдитесь по чеклисту:

- [ ] JSDoc на интерфейсе пропсов — каждый пропс описан
- [ ] JSDoc на самом компоненте — краткое описание назначения
- [ ] Значения по умолчанию указаны в JSDoc (`@default`)
- [ ] Хотя бы один `@example` в JSDoc
- [ ] История в Storybook для каждого важного состояния
- [ ] Storybook autodocs генерирует корректную таблицу пропсов
- [ ] README обновлён (если это пакет)
- [ ] Нетривиальные пропсы имеют подробное описание

## Связанные темы

- [Комментирование кода](../commenting/index.md) — когда и как писать комментарии
- [Именование компонентов](../naming-conventions/index.md) — самодокументирующиеся имена
- [Рефакторинг React-кода](../refactoring/index.md) — улучшение структуры кода
