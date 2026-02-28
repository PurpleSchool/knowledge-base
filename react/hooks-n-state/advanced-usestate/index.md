---
# Продвинутое использование useState в React

`useState` — базовый хук React, но его возможности далеко выходят за рамки простого хранения примитивных значений. Рассмотрим продвинутые паттерны использования.

## Ленивая инициализация (Lazy Initialization)

По умолчанию начальное значение `useState` вычисляется при каждом рендере, даже если используется только при первом. Для дорогостоящих вычислений используй **ленивую инициализацию** — передавай функцию вместо значения.

```jsx
// ❌ Вычисляется при каждом рендере
const [state, setState] = useState(expensiveComputation()); // Вызывается всегда!

// ✅ Вычисляется только один раз при монтировании
const [state, setState] = useState(() => expensiveComputation()); // Вызывается один раз

// Пример: чтение из localStorage
const [theme, setTheme] = useState(() => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
});

// Пример: парсинг данных
const [data, setData] = useState(() => {
  const saved = sessionStorage.getItem('formData');
  return saved ? JSON.parse(saved) : { name: '', email: '', age: 0 };
});
```

### Когда использовать ленивую инициализацию?

- Чтение из `localStorage` / `sessionStorage`
- Парсинг JSON
- Сложные вычисления начального состояния
- Создание объектов с большим количеством полей

## Функциональные обновления состояния

Когда новое состояние зависит от предыдущего, используй **функциональную форму** `setState`.

```jsx
// ❌ Проблема: использование устаревшего состояния
function Counter() {
  const [count, setCount] = useState(0);

  const handleTripleIncrement = () => {
    setCount(count + 1); // count = 0
    setCount(count + 1); // count = 0 (не 1!)
    setCount(count + 1); // count = 0 (не 2!)
    // Результат: count = 1, а не 3!
  };
}

// ✅ Правильно: функциональное обновление
function Counter() {
  const [count, setCount] = useState(0);

  const handleTripleIncrement = () => {
    setCount(prev => prev + 1); // 0 → 1
    setCount(prev => prev + 1); // 1 → 2
    setCount(prev => prev + 1); // 2 → 3
    // Результат: count = 3 ✅
  };
}
```

### Применение в асинхронном коде

```jsx
function AsyncCounter() {
  const [count, setCount] = useState(0);

  const incrementAsync = async () => {
    await someAsyncOperation();
    
    // ❌ count может быть устаревшим
    setCount(count + 1);
    
    // ✅ Всегда работает с актуальным значением
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementAsync}>Increment async</button>
    </div>
  );
}
```

## Состояние объектов и массивов

React требует **иммутабельного обновления** состояния — нельзя мутировать текущий объект/массив.

### Объекты

```jsx
function UserForm() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0,
    address: {
      city: '',
      country: ''
    }
  });

  // ✅ Поверхностное обновление через spread
  const updateName = (name: string) => {
    setUser(prev => ({ ...prev, name }));
  };

  // ✅ Глубокое обновление вложенного объекта
  const updateCity = (city: string) => {
    setUser(prev => ({
      ...prev,
      address: { ...prev.address, city }
    }));
  };

  // ✅ Универсальный обработчик для формы
  const handleChange = (field: keyof typeof user) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUser(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form>
      <input value={user.name} onChange={handleChange('name')} />
      <input value={user.email} onChange={handleChange('email')} />
    </form>
  );
}
```

### Массивы

```jsx
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Добавление элемента
  const addTodo = (text: string) => {
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);
  };

  // Удаление элемента
  const removeTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // Обновление элемента
  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  // Сортировка (создаём новый массив)
  const sortByText = () => {
    setTodos(prev => [...prev].sort((a, b) => a.text.localeCompare(b.text)));
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
      <button onClick={() => addTodo('New task')}>Add</button>
    </ul>
  );
}
```

## Батчинг обновлений (Batching)

В React 18 все обновления состояния **автоматически батчируются** — объединяются в один рендер, даже внутри асинхронного кода.

```jsx
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // React 18: оба обновления → один рендер
  const handleClick = async () => {
    await fetch('/api/data');
    setCount(c => c + 1); // Не вызывает рендер сразу
    setFlag(f => !f);     // Не вызывает рендер сразу
    // Один рендер здесь
  };

  // Если нужно отключить батчинг (редкий случай)
  const handleClick2 = () => {
    flushSync(() => setCount(c => c + 1)); // Рендер 1
    flushSync(() => setFlag(f => !f));     // Рендер 2
  };
}
```

## Управление состоянием форм

### Простая форма

```jsx
interface FormData {
  username: string;
  email: string;
  password: string;
}

function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при вводе
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.username) newErrors.username = 'Обязательное поле';
    if (!formData.email.includes('@')) newErrors.email = 'Неверный email';
    if (formData.password.length < 8) newErrors.password = 'Минимум 8 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Отправка формы
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={formData.username} onChange={handleChange} />
      {errors.username && <span>{errors.username}</span>}
      <input name="email" value={formData.email} onChange={handleChange} />
      {errors.email && <span>{errors.email}</span>}
      <input name="password" type="password" value={formData.password} onChange={handleChange} />
      {errors.password && <span>{errors.password}</span>}
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

## Состояние как машина состояний

Для сложной логики переходов моделируй состояние явно.

```jsx
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  status: RequestStatus;
  data: T | null;
  error: string | null;
}

function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
  });

  const setLoading = () =>
    setState({ status: 'loading', data: null, error: null });

  const setSuccess = (data: T) =>
    setState({ status: 'success', data, error: null });

  const setError = (error: string) =>
    setState({ status: 'error', data: null, error });

  const reset = () =>
    setState({ status: 'idle', data: initialData, error: null });

  return { ...state, setLoading, setSuccess, setError, reset };
}

// Использование
function DataFetcher() {
  const { status, data, error, setLoading, setSuccess, setError } =
    useAsyncState<User[]>();

  const fetchUsers = async () => {
    setLoading();
    try {
      const users = await api.getUsers();
      setSuccess(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorMessage message={error!} />;
  if (status === 'success') return <UserList users={data!} />;
  return <button onClick={fetchUsers}>Загрузить пользователей</button>;
}
```

## Сброс состояния через key

Для полного сброса состояния компонента используй изменение `key`.

```jsx
function ParentComponent() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div>
      <ComplexForm key={resetKey} />
      <button onClick={() => setResetKey(k => k + 1)}>
        Сбросить форму
      </button>
    </div>
  );
}

// Когда key меняется, React размонтирует старый CompexForm
// и монтирует новый с чистым состоянием
function ComplexForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // При изменении key всё состояние сбрасывается автоматически
  return (/* ... */);
}
```

## Оптимизация: когда useState недостаточно

### Переход к useReducer

Если логика обновления состояния становится сложной, рассмотри `useReducer`:

```jsx
// useState — начинает усложняться
function ComplexComponent() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // 5+ useState — сигнал к рефакторингу в useReducer
}

// useReducer — чище для сложной логики
type State = {
  items: Item[];
  filter: 'all' | 'active' | 'done';
  sort: 'date' | 'name';
  page: number;
  loading: boolean;
};

type Action =
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'SET_FILTER'; payload: State['filter'] }
  | { type: 'SET_SORT'; payload: State['sort'] }
  | { type: 'NEXT_PAGE' }
  | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEMS': return { ...state, items: action.payload };
    case 'SET_FILTER': return { ...state, filter: action.payload, page: 1 };
    case 'NEXT_PAGE': return { ...state, page: state.page + 1 };
    // ...
  }
}
```

## Резюме продвинутых паттернов

| Паттерн | Когда использовать |
|---------|-------------------|
| Ленивая инициализация | Дорогое начальное вычисление |
| Функциональное обновление | Новое значение зависит от предыдущего |
| Иммутабельное обновление | Всегда при работе с объектами и массивами |
| Состояние-машина | Сложные переходы между состояниями |
| Сброс через key | Полный сброс состояния компонента |
| Переход к useReducer | 3+ связанных состояния со сложной логикой |

## Дополнительные ресурсы

- [useState — React Docs](https://react.dev/reference/react/useState)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
