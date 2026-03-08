---
metaTitle: Generics в React с TypeScript — создание переиспользуемых типизированных компонентов
metaDescription: Подробное руководство по использованию дженериков в React с TypeScript. Создание переиспользуемых компонентов, generic хуков и паттерны для типизации
author: Олег Марков
title: Generics в React с TypeScript
preview: Изучите дженерики в React: создавайте переиспользуемые типизированные компоненты и хуки, которые работают с любыми данными при полной поддержке TypeScript
---

## Введение

Дженерики (generics) — одна из самых мощных возможностей TypeScript, и они особенно полезны в React-разработке. С их помощью вы создаёте компоненты и хуки, которые работают с любыми типами данных, сохраняя при этом полную типобезопасность. В этой статье мы разберём дженерики с практическими примерами из реального проекта.

## Зачем нужны дженерики в React

Рассмотрим проблему без дженериков. Допустим, нужен компонент списка:

```tsx
// Проблема: жёсткая привязка к типу
function UserList({ users }: { users: User[] }) {
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Приходится дублировать для каждого типа
function ProductList({ products }: { products: Product[] }) {
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

С дженериками — один компонент для всего:

```tsx
// Решение: generic компонент
function List<T extends { id: number | string }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map(item => <li key={String(item.id)}>{renderItem(item)}</li>)}</ul>;
}

// Работает с любым типом
<List items={users} renderItem={user => user.name} />
<List items={products} renderItem={product => `${product.name} — ${product.price} ₽`} />
```

## Базовый синтаксис generic компонентов

```tsx
// Синтаксис: <T> перед параметрами компонента
function Container<T>({ value, render }: {
  value: T;
  render: (value: T) => React.ReactNode;
}) {
  return <div>{render(value)}</div>;
}

// С ограничением типа (constraint)
function Container<T extends object>({ value, render }: {
  value: T;
  render: (value: T) => React.ReactNode;
}) {
  return <div>{render(value)}</div>;
}

// Множественные дженерики
function Transformer<TInput, TOutput>({
  value,
  transform,
  render,
}: {
  value: TInput;
  transform: (input: TInput) => TOutput;
  render: (output: TOutput) => React.ReactNode;
}) {
  const transformed = transform(value);
  return <div>{render(transformed)}</div>;
}
```

## Generic компонент Select

Один из самых частых кандидатов для дженерика — компонент выпадающего списка:

```tsx
interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T> {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Кастомный рендер опций
  renderOption?: (option: SelectOption<T>) => React.ReactNode;
  // Как сравнивать значения
  getKey?: (value: T) => string | number;
}

function Select<T>({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  disabled = false,
  className = '',
  renderOption,
  getKey = (v) => String(v),
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const selectedOption = value !== null
    ? options.find(opt => getKey(opt.value) === getKey(value))
    : null;
  
  return (
    <div className={`select ${isOpen ? 'select--open' : ''} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="select__trigger"
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>
      
      {isOpen && (
        <ul className="select__dropdown">
          {options.map(option => (
            <li
              key={String(getKey(option.value))}
              className={`select__option ${option.disabled ? 'select__option--disabled' : ''}`}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              {renderOption ? renderOption(option) : option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Использование с разными типами
interface Country {
  code: string;
  name: string;
  flag: string;
}

const CountrySelector = () => {
  const [selectedCountry, setSelectedCountry] = React.useState<Country | null>(null);
  
  const countryOptions: SelectOption<Country>[] = [
    { value: { code: 'RU', name: 'Россия', flag: '🇷🇺' }, label: 'Россия' },
    { value: { code: 'US', name: 'США', flag: '🇺🇸' }, label: 'США' },
    { value: { code: 'DE', name: 'Германия', flag: '🇩🇪' }, label: 'Германия' },
  ];
  
  return (
    <Select<Country>
      options={countryOptions}
      value={selectedCountry}
      onChange={setSelectedCountry}
      getKey={country => country.code}
      renderOption={option => (
        <span>{option.value.flag} {option.label}</span>
      )}
    />
  );
};
```

## Generic компонент Table

Таблица данных — идеальный кейс для дженериков:

```tsx
interface Column<T> {
  key: string;
  header: string;
  // Функция для получения значения из строки
  accessor: (row: T) => React.ReactNode;
  // Ширина колонки
  width?: string;
  // Можно ли сортировать по этой колонке
  sortable?: boolean;
  // Кастомный рендер заголовка
  renderHeader?: () => React.ReactNode;
}

interface TableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  // Сортировка
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  // Выбор строк
  selectedIds?: Set<T['id']>;
  onSelectRow?: (id: T['id']) => void;
  onSelectAll?: (selected: boolean) => void;
  // Состояния
  isLoading?: boolean;
  emptyText?: string;
  // Клик по строке
  onRowClick?: (row: T) => void;
}

function Table<T extends { id: number | string }>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  selectedIds,
  onSelectRow,
  onSelectAll,
  isLoading = false,
  emptyText = 'Нет данных',
  onRowClick,
}: TableProps<T>) {
  const allSelected = selectedIds && data.length > 0 && 
    data.every(row => selectedIds.has(row.id));
  
  if (isLoading) {
    return <div className="table-loading">Загрузка...</div>;
  }
  
  return (
    <table className="table">
      <thead>
        <tr>
          {onSelectRow && (
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAll?.(e.target.checked)}
              />
            </th>
          )}
          {columns.map(column => (
            <th
              key={column.key}
              style={{ width: column.width }}
              className={column.sortable ? 'table__th--sortable' : ''}
              onClick={() => column.sortable && onSort?.(column.key)}
            >
              {column.renderHeader ? column.renderHeader() : column.header}
              {sortColumn === column.key && (
                <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (onSelectRow ? 1 : 0)}>{emptyText}</td>
          </tr>
        ) : (
          data.map(row => (
            <tr
              key={String(row.id)}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'table__row--clickable' : ''} ${
                selectedIds?.has(row.id) ? 'table__row--selected' : ''
              }`}
            >
              {onSelectRow && (
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(row.id) ?? false}
                    onChange={() => onSelectRow(row.id)}
                  />
                </td>
              )}
              {columns.map(column => (
                <td key={column.key}>{column.accessor(row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// Использование
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

const UserTable = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Имя',
      accessor: user => user.name,
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      accessor: user => <a href={`mailto:${user.email}`}>{user.email}</a>,
    },
    {
      key: 'role',
      header: 'Роль',
      accessor: user => (
        <span className={`badge badge--${user.role}`}>
          {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата регистрации',
      accessor: user => user.createdAt.toLocaleDateString('ru-RU'),
      sortable: true,
    },
  ];
  
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  return (
    <Table<User>
      data={users}
      columns={columns}
      selectedIds={selectedIds}
      onSelectRow={toggleSelect}
      onSelectAll={selected => {
        setSelectedIds(selected ? new Set(users.map(u => u.id)) : new Set());
      }}
    />
  );
};
```

## Generic хуки

Дженерики особенно полезны для хуков, которые работают с разными типами данных:

```tsx
// Generic хук для работы с API
interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

type UseAsyncReturn<T> = UseAsyncState<T> & {
  execute: (...args: Parameters<() => Promise<T>>) => Promise<void>;
  reset: () => void;
};

function useAsync<T>(asyncFn: () => Promise<T>): UseAsyncReturn<T> {
  const [state, setState] = React.useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });
  
  const execute = React.useCallback(async () => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const data = await asyncFn();
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e : new Error('Unknown error') });
    }
  }, [asyncFn]);
  
  const reset = React.useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);
  
  return { ...state, execute, reset };
}

// Хук для работы с коллекциями
function useCollection<T extends { id: number | string }>(initialItems: T[] = []) {
  const [items, setItems] = React.useState<T[]>(initialItems);
  
  const add = React.useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);
  
  const update = React.useCallback((id: T['id'], updates: Partial<T>) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  }, []);
  
  const remove = React.useCallback((id: T['id']) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const find = React.useCallback((id: T['id']): T | undefined => {
    return items.find(item => item.id === id);
  }, [items]);
  
  const findAll = React.useCallback((predicate: (item: T) => boolean): T[] => {
    return items.filter(predicate);
  }, [items]);
  
  return { items, add, update, remove, find, findAll };
}

// Использование
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

function TodoApp() {
  const todos = useCollection<Todo>([]);
  
  const addTodo = (text: string) => {
    todos.add({
      id: Date.now(),
      text,
      completed: false,
      priority: 'medium',
    });
  };
  
  const highPriorityTodos = todos.findAll(todo => todo.priority === 'high');
  
  return (
    <div>
      <p>Высокий приоритет: {highPriorityTodos.length}</p>
      {todos.items.map(todo => (
        <div key={todo.id}>
          <span>{todo.text}</span>
          <button onClick={() => todos.update(todo.id, { completed: !todo.completed })}>
            {todo.completed ? 'Отменить' : 'Выполнено'}
          </button>
          <button onClick={() => todos.remove(todo.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
```

## Render Props с дженериками

Паттерн render props становится очень мощным с дженериками:

```tsx
interface DataFetcherProps<T> {
  url: string;
  // Трансформация данных перед рендером
  transform?: (data: unknown) => T;
  children: (state: {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

function DataFetcher<T>({ url, transform, children }: DataFetcherProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      setData(transform ? transform(raw) : raw as T);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [url, transform]);
  
  React.useEffect(() => { fetchData(); }, [fetchData]);
  
  return <>{children({ data, isLoading, error, refetch: fetchData })}</>;
}

// Использование
<DataFetcher<User[]> url="/api/users">
  {({ data: users, isLoading, error, refetch }) => {
    if (isLoading) return <div>Загрузка...</div>;
    if (error) return <button onClick={refetch}>Повторить</button>;
    return <UserList users={users ?? []} />;
  }}
</DataFetcher>
```

## Условные типы и дженерики

```tsx
// Компонент, который меняет поведение в зависимости от типа
type ListOrSingle<T, Multiple extends boolean> = Multiple extends true
  ? { value: T[]; onChange: (value: T[]) => void; multiple: true }
  : { value: T | null; onChange: (value: T | null) => void; multiple?: false };

type CheckboxGroupProps<T> = {
  options: Array<{ value: T; label: string }>;
  getKey: (value: T) => string;
} & ListOrSingle<T, boolean>;

// Более простой вариант с двумя компонентами
function SingleSelect<T>({ options, value, onChange, getKey }: {
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T | null) => void;
  getKey: (value: T) => string;
}) {
  return (
    <div>
      {options.map(option => (
        <label key={getKey(option.value)}>
          <input
            type="radio"
            checked={value !== null && getKey(value) === getKey(option.value)}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
```

## Лучшие практики

**1. Добавляйте ограничения типов (constraints) когда это нужно:**

```tsx
// Ограничение: T должен иметь поле id
function List<T extends { id: number | string }>(props: { items: T[] }) {
  return props.items.map(item => <div key={String(item.id)} />);
}
```

**2. Давайте дженерик-параметрам понятные имена:**

```tsx
// Плохо
function transform<T, U>(input: T): U { ... }

// Хорошо
function transform<TInput, TOutput>(input: TInput): TOutput { ... }
```

**3. Указывайте тип явно только когда TypeScript не может его вывести:**

```tsx
// TypeScript сам выведет тип из аргументов
const result = transform(userData); // TInput = UserData

// Явно — только если нужно
const result = transform<UserData, UserDTO>(userData);
```

**4. Используйте `extends` для безопасного доступа к свойствам:**

```tsx
// Доступ к .length безопасен благодаря ограничению
function first<T extends { length: number }>(collection: T): T extends any[] ? T[0] : never {
  return (collection as any)[0];
}
```

## Заключение

Дженерики в React открывают возможность создания по-настоящему переиспользуемых компонентов и хуков. Ключевые моменты:

- Используйте дженерики там, где компонент должен работать с разными типами данных
- Добавляйте ограничения типов через `extends` для безопасного доступа к свойствам
- Generic хуки особенно полезны для абстракций работы с API и коллекциями
- Паттерн render props с дженериками даёт максимальную гибкость
- Не злоупотребляйте дженериками — иногда проще написать два специфических компонента
