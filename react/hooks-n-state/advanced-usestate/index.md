---
metaTitle: useState продвинутое использование в React — полное руководство
metaDescription: Полное руководство по продвинутым паттернам useState в React — ленивая инициализация, функциональные обновления, батчинг, машины состояний, управление формами, TypeScript типизация, оптимизация производительности и когда переходить на useReducer
author: Олег Марков
title: useState продвинутое использование в React
preview: Узнайте продвинутые паттерны использования хука useState в React — от ленивой инициализации и функциональных обновлений до машин состояний, управления формами, батчинга обновлений и полной типизации на TypeScript
---

## Введение

Хук `useState` — один из первых, с которым знакомятся разработчики React. На первый взгляд он кажется простым: задаёшь начальное значение, получаешь текущее состояние и функцию для его обновления. Однако за этой простотой скрывается целый набор продвинутых паттернов, которые позволяют писать более эффективный, предсказуемый и поддерживаемый код.

В этой статье вы узнаете:

- Как использовать ленивую инициализацию для оптимизации первого рендера
- Почему функциональные обновления критически важны в асинхронном коде
- Как правильно работать с объектами и массивами в состоянии
- Что такое батчинг обновлений и как он изменился в React 18
- Как управлять состоянием сложных форм
- Как моделировать машины состояний через `useState`
- Зачем и как использовать `key` для сброса состояния компонента
- Когда стоит переходить от `useState` к `useReducer`
- Как правильно типизировать `useState` в TypeScript
- Распространённые ошибки и антипаттерны
- Советы по оптимизации производительности

Если вы хотите систематически изучить React и освоить все инструменты управления состоянием — приходите на курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=advanced-usestate). На курсе 177 уроков и 17 упражнений, AI-тренажёры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Ленивая инициализация (Lazy Initialization)

### Проблема: дорогостоящее начальное значение

По умолчанию React вычисляет аргумент `useState` при **каждом** рендере компонента. Если это выражение требует сложных вычислений или обращения к медленному API (например, `localStorage`), производительность страдает на каждом рендере, хотя результат используется только один раз — при монтировании.

```jsx
// Плохо: expensiveComputation() вызывается при КАЖДОМ рендере
const [state, setState] = useState(expensiveComputation());

// Хорошо: expensiveComputation() вызывается только при первом рендере
const [state, setState] = useState(() => expensiveComputation());
```

### Синтаксис ленивой инициализации

Вместо значения в `useState` передаётся **функция-инициализатор**. React вызовет её только один раз — при первом рендере компонента — и использует возвращённое значение как начальное состояние.

```jsx
// Форма: функция без аргументов, возвращающая начальное значение
const [value, setValue] = useState(() => {
  // Эта функция выполняется только при монтировании
  return computeInitialValue();
});
```

### Практические примеры

#### Чтение из localStorage

```jsx
function ThemeToggle() {
  // Без ленивой инициализации: localStorage.getItem вызывается при каждом рендере
  // const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // С ленивой инициализацией: читаем localStorage только один раз
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      // localStorage может быть недоступен (приватный режим браузера, SSR)
      return 'light';
    }
  });

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <button onClick={toggle}>
      Текущая тема: {theme}
    </button>
  );
}
```

#### Восстановление состояния формы

```jsx
interface FormState {
  name: string;
  email: string;
  message: string;
}

function ContactForm() {
  const [form, setForm] = useState<FormState>(() => {
    const saved = sessionStorage.getItem('contactForm');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Игнорируем повреждённые данные
      }
    }
    return { name: '', email: '', message: '' };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Сохраняем прогресс заполнения
      sessionStorage.setItem('contactForm', JSON.stringify(next));
      return next;
    });
  };

  return (
    <form>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Имя" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="Сообщение" />
    </form>
  );
}
```

#### Инициализация из props

```jsx
interface TableProps {
  initialData: Row[];
  defaultSort: 'asc' | 'desc';
}

function DataTable({ initialData, defaultSort }: TableProps) {
  // Ленивая инициализация позволяет выполнить первичную обработку данных
  const [rows, setRows] = useState<Row[]>(() => {
    // Сортируем данные только при монтировании
    return [...initialData].sort((a, b) =>
      defaultSort === 'asc'
        ? a.id - b.id
        : b.id - a.id
    );
  });

  // rows уже отсортированы, компонент готов к работе
  return <table>{/* ... */}</table>;
}
```

### Когда использовать ленивую инициализацию

| Ситуация | Использовать? |
|----------|---------------|
| Чтение из `localStorage` / `sessionStorage` | Да |
| Парсинг JSON из внешнего источника | Да |
| Сложные вычисления начального состояния | Да |
| Создание больших структур данных | Да |
| Простые примитивы (`0`, `''`, `false`) | Нет, не нужно |
| Константные объекты/массивы | Нет, React это оптимизирует |

## Функциональные обновления состояния

### Проблема устаревшего замыкания (stale closure)

Когда обработчики событий или эффекты захватывают значение состояния через замыкание, они могут работать с устаревшим значением — тем, которое было актуально в момент создания функции, а не в момент её вызова.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleTripleIncrement = () => {
    // count захвачен замыканием и равен 0 во всех трёх вызовах
    setCount(count + 1); // планируется: 0 + 1 = 1
    setCount(count + 1); // планируется: 0 + 1 = 1 (не 2!)
    setCount(count + 1); // планируется: 0 + 1 = 1 (не 3!)
    // Итог: count будет 1, а не 3
  };

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={handleTripleIncrement}>+3</button>
    </div>
  );
}
```

### Решение: функциональная форма setState

Когда в `setState` передаётся функция, React передаёт ей **гарантированно актуальное** значение предыдущего состояния — то, которое было применено после всех предыдущих обновлений в очереди.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleTripleIncrement = () => {
    setCount(prev => prev + 1); // prev = 0, возвращает 1
    setCount(prev => prev + 1); // prev = 1, возвращает 2
    setCount(prev => prev + 1); // prev = 2, возвращает 3
    // Итог: count будет 3
  };

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={handleTripleIncrement}>+3</button>
    </div>
  );
}
```

### Функциональные обновления в асинхронном коде

Асинхронный код особенно подвержен проблеме устаревших замыканий, потому что значение состояния могло измениться пока выполнялась асинхронная операция.

```jsx
function AsyncCounter() {
  const [count, setCount] = useState(0);

  const incrementAfterDelay = async () => {
    // count = 5 в момент клика
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Через 2 секунды пользователь мог нажать кнопку ещё раз
    // count всё ещё = 5 (из замыкания), а реальное значение может быть 7

    // Плохо: используем устаревшее значение из замыкания
    setCount(count + 1); // 5 + 1 = 6, а должно было быть 8

    // Хорошо: используем актуальное значение
    setCount(prev => prev + 1); // всегда корректно
  };

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={incrementAfterDelay}>+1 через 2 секунды</button>
    </div>
  );
}
```

### Функциональные обновления в useCallback и useEffect

```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Функциональное обновление позволяет не добавлять page в зависимости
  const loadNextPage = useCallback(async () => {
    // Используем функциональную форму, чтобы не добавлять page в deps
    setPage(prev => {
      const nextPage = prev + 1;
      // Загружаем данные для следующей страницы
      fetchResults(query, nextPage).then(data => {
        setResults(prevResults => [...prevResults, ...data]);
      });
      return nextPage;
    });
  }, [query]); // page не нужен в зависимостях

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results.map(r => <div key={r}>{r}</div>)}
      <button onClick={loadNextPage}>Загрузить ещё</button>
    </div>
  );
}
```

### Правило: когда использовать функциональную форму

Используйте функциональную форму `setState(prev => newValue)` **всегда**, когда новое значение зависит от предыдущего. Это защищает от race conditions и устаревших замыканий.

```jsx
// Всегда используйте функциональную форму для:
setCount(prev => prev + 1);          // инкремент
setItems(prev => [...prev, newItem]); // добавление в массив
setFlags(prev => ({ ...prev, isOpen: !prev.isOpen })); // toggle
setHistory(prev => [...prev, current]); // накопление истории
```

## Работа с объектами и массивами в состоянии

### Принцип иммутабельности

React использует **ссылочное равенство** для определения того, изменилось ли состояние. Если вы мутируете объект или массив напрямую, React не увидит изменений и не выполнит повторный рендер.

```jsx
const [user, setUser] = useState({ name: 'Иван', age: 25 });

// Плохо: мутация — React не увидит изменения
user.name = 'Пётр'; // Изменяем тот же объект
setUser(user);       // React сравнивает ссылки: они одинаковые, рендер не запускается

// Хорошо: создаём новый объект
setUser({ ...user, name: 'Пётр' }); // Новая ссылка — React видит изменение
```

### Работа с объектами

#### Поверхностное обновление через spread

```jsx
interface Profile {
  name: string;
  email: string;
  bio: string;
  isPublic: boolean;
}

function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>({
    name: 'Иван Петров',
    email: 'ivan@example.com',
    bio: 'Разработчик',
    isPublic: true,
  });

  // Обновление одного поля
  const updateName = (name: string) => {
    setProfile(prev => ({ ...prev, name }));
  };

  // Универсальный обработчик для текстовых полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Обновление булевого поля
  const togglePublic = () => {
    setProfile(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };

  return (
    <form>
      <input name="name" value={profile.name} onChange={handleChange} />
      <input name="email" value={profile.email} onChange={handleChange} />
      <textarea name="bio" value={profile.bio} onChange={handleChange} />
      <label>
        <input
          type="checkbox"
          name="isPublic"
          checked={profile.isPublic}
          onChange={handleChange}
        />
        Публичный профиль
      </label>
    </form>
  );
}
```

#### Обновление вложенных объектов

```jsx
interface Address {
  street: string;
  city: string;
  country: string;
  zipCode: string;
}

interface User {
  name: string;
  email: string;
  address: Address;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}

function UserEditor() {
  const [user, setUser] = useState<User>({
    name: 'Анна',
    email: 'anna@example.com',
    address: { street: 'ул. Пушкина', city: 'Москва', country: 'Россия', zipCode: '101000' },
    settings: { notifications: true, theme: 'light' },
  });

  // Обновление вложенного поля адреса
  const updateCity = (city: string) => {
    setUser(prev => ({
      ...prev,
      address: { ...prev.address, city },
    }));
  };

  // Обновление вложенного поля настроек
  const toggleNotifications = () => {
    setUser(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        notifications: !prev.settings.notifications,
      },
    }));
  };

  // Универсальный обработчик для вложенных полей
  const updateNestedField = <K extends keyof User>(
    section: K,
    field: keyof User[K],
    value: unknown
  ) => {
    setUser(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  return (
    <div>
      <input
        value={user.address.city}
        onChange={e => updateCity(e.target.value)}
        placeholder="Город"
      />
      <button onClick={toggleNotifications}>
        Уведомления: {user.settings.notifications ? 'вкл' : 'выкл'}
      </button>
    </div>
  );
}
```

### Работа с массивами

#### Все операции с массивами

```jsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

function TodoManager() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nextId, setNextId] = useState(1);

  // Добавление элемента в конец
  const addTodo = (text: string, priority: Todo['priority'] = 'medium') => {
    setTodos(prev => [
      ...prev,
      { id: nextId, text, done: false, priority, createdAt: new Date() },
    ]);
    setNextId(prev => prev + 1);
  };

  // Добавление элемента в начало
  const prependTodo = (text: string) => {
    setTodos(prev => [
      { id: nextId, text, done: false, priority: 'high', createdAt: new Date() },
      ...prev,
    ]);
    setNextId(prev => prev + 1);
  };

  // Удаление элемента по id
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

  // Обновление текста
  const updateTodoText = (id: number, text: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text } : todo
      )
    );
  };

  // Замена элемента целиком
  const replaceTodo = (id: number, newTodo: Omit<Todo, 'id'>) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...newTodo, id } : todo
      )
    );
  };

  // Вставка элемента на конкретную позицию
  const insertAt = (index: number, text: string) => {
    setTodos(prev => [
      ...prev.slice(0, index),
      { id: nextId, text, done: false, priority: 'medium', createdAt: new Date() },
      ...prev.slice(index),
    ]);
    setNextId(prev => prev + 1);
  };

  // Перемещение элемента
  const moveTodo = (fromIndex: number, toIndex: number) => {
    setTodos(prev => {
      const result = [...prev];
      const [moved] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, moved);
      return result;
    });
  };

  // Сортировка (создаём новый массив, не мутируем)
  const sortByPriority = () => {
    const order = { high: 0, medium: 1, low: 2 };
    setTodos(prev => [...prev].sort((a, b) => order[a.priority] - order[b.priority]));
  };

  const sortByDate = () => {
    setTodos(prev =>
      [...prev].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    );
  };

  // Пакетное обновление
  const markAllDone = () => {
    setTodos(prev => prev.map(todo => ({ ...todo, done: true })));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.done));
  };

  return (
    <div>
      <button onClick={() => addTodo('Новая задача')}>Добавить</button>
      <button onClick={sortByPriority}>Сортировать по приоритету</button>
      <button onClick={markAllDone}>Отметить все выполненными</button>
      <button onClick={clearCompleted}>Удалить выполненные</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
            <button onClick={() => removeTodo(todo.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Распространённые ошибки при работе с массивами

```jsx
// Плохо: мутация массива напрямую
const addItem = (item: string) => {
  todos.push(item); // Мутация!
  setTodos(todos); // React не увидит изменения — та же ссылка
};

// Плохо: sort мутирует оригинальный массив
const sortItems = () => {
  setTodos(todos.sort()); // sort() мутирует массив и возвращает ту же ссылку!
};

// Хорошо: создаём копию перед сортировкой
const sortItems = () => {
  setTodos([...todos].sort()); // spread создаёт новый массив
  // или
  setTodos(prev => [...prev].sort());
};

// Плохо: splice мутирует массив
const removeItem = (index: number) => {
  todos.splice(index, 1); // Мутация!
  setTodos(todos);
};

// Хорошо: filter создаёт новый массив
const removeItem = (index: number) => {
  setTodos(prev => prev.filter((_, i) => i !== index));
};
```

## Батчинг обновлений (State Batching)

### Что такое батчинг

Батчинг — это оптимизация React, при которой несколько вызовов `setState` в одном обработчике объединяются в один рендер. Это существенно улучшает производительность.

### Батчинг в React 17 и ранее

В React 17 батчинг работал только внутри синтетических обработчиков событий React. В асинхронном коде каждый вызов `setState` вызывал отдельный рендер.

```jsx
// React 17: внутри обработчика — один рендер
function handleClick() {
  setCount(c => c + 1); // Не рендерит сразу
  setFlag(f => !f);     // Не рендерит сразу
  // Один рендер здесь
}

// React 17: внутри setTimeout — два отдельных рендера!
setTimeout(() => {
  setCount(c => c + 1); // Рендер 1
  setFlag(f => !f);     // Рендер 2
}, 1000);
```

### Автоматический батчинг в React 18

React 18 ввёл **автоматический батчинг** (Automatic Batching) — теперь обновления объединяются везде: в обработчиках событий, `setTimeout`, `Promise`, нативных обработчиках и т.д.

```jsx
// React 18: батчинг работает везде
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const [text, setText] = useState('');

  // Один рендер для всех трёх обновлений
  const handleClick = () => {
    setCount(c => c + 1);
    setFlag(f => !f);
    setText('обновлено');
    // Рендер происходит один раз после выхода из обработчика
  };

  // React 18: один рендер даже в setTimeout
  const handleDelayed = () => {
    setTimeout(() => {
      setCount(c => c + 1); // Не рендерит сразу
      setFlag(f => !f);     // Не рендерит сразу
      // Один рендер здесь
    }, 1000);
  };

  // React 18: один рендер даже в Promise
  const handleAsync = async () => {
    const data = await fetch('/api/data').then(r => r.json());
    setCount(data.count); // Не рендерит сразу
    setFlag(data.flag);   // Не рендерит сразу
    // Один рендер здесь
  };

  return (
    <div>
      <p>Count: {count}, Flag: {String(flag)}, Text: {text}</p>
      <button onClick={handleClick}>Синхронно</button>
      <button onClick={handleDelayed}>С задержкой</button>
      <button onClick={handleAsync}>Асинхронно</button>
    </div>
  );
}
```

### Отключение батчинга с flushSync

В редких случаях вам может потребоваться принудительный синхронный рендер — например, для измерения DOM после обновления состояния.

```jsx
import { flushSync } from 'react-dom';

function Example() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const handleClick = () => {
    flushSync(() => {
      setCount(c => c + 1);
    });
    // DOM уже обновлён здесь
    console.log(listRef.current?.scrollHeight); // Актуальная высота

    flushSync(() => {
      setFlag(f => !f);
    });
    // Снова DOM обновлён
  };

  return (
    <div>
      <ul ref={listRef}>
        {Array.from({ length: count }).map((_, i) => <li key={i}>Элемент {i + 1}</li>)}
      </ul>
      <button onClick={handleClick}>Добавить с измерением</button>
    </div>
  );
}
```

### Батчинг и React.startTransition

`startTransition` позволяет пометить обновления как некритические — React может отложить их рендер в пользу более важных обновлений.

```jsx
import { useState, startTransition } from 'react';

function SearchComponent() {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Обновление поля ввода — критично, должно быть немедленным
    setInputValue(e.target.value);

    // Обновление поисковой строки — можно отложить
    startTransition(() => {
      setSearchQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={inputValue} onChange={handleInput} />
      {/* SearchResults использует searchQuery — рендерится с задержкой если нужно */}
      <SearchResults query={searchQuery} />
    </div>
  );
}
```

## Управление состоянием форм

### Стратегии управления формами

В React существует несколько подходов к формам:
- **Controlled components** (управляемые компоненты) — состояние формы в React через `useState`
- **Uncontrolled components** — состояние в DOM, доступ через `ref`

Для большинства форм рекомендуются управляемые компоненты.

### Простая форма с валидацией

```jsx
interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

type FormErrors = Partial<Record<keyof RegistrationForm, string>>;

function RegistrationForm() {
  const [form, setForm] = useState<RegistrationForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setForm(prev => ({ ...prev, [name]: fieldValue }));

    // Очищаем ошибку поля при вводе
    if (errors[name as keyof RegistrationForm]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name as keyof RegistrationForm];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (form.username.length < 3) {
      newErrors.username = 'Минимум 3 символа';
    }

    if (!form.email.includes('@')) {
      newErrors.email = 'Введите корректный email';
    }

    if (form.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну заглавную букву';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!form.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо принять условия';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerUser(form);
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return <div>Регистрация прошла успешно!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Имя пользователя"
          disabled={isSubmitting}
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>

      <div>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          disabled={isSubmitting}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Пароль"
          disabled={isSubmitting}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <div>
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Подтвердите пароль"
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
      </div>

      <div>
        <label>
          <input
            name="agreeToTerms"
            type="checkbox"
            checked={form.agreeToTerms}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          Я принимаю условия использования
        </label>
        {errors.agreeToTerms && <span className="error">{errors.agreeToTerms}</span>}
      </div>

      {submitError && <div className="error">{submitError}</div>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
```

### Многошаговая форма

```jsx
type Step = 'personal' | 'address' | 'payment' | 'review';

const STEPS: Step[] = ['personal', 'address', 'payment', 'review'];

const STEP_LABELS: Record<Step, string> = {
  personal: 'Личные данные',
  address: 'Адрес',
  payment: 'Оплата',
  review: 'Подтверждение',
};

interface CheckoutData {
  personal: { name: string; email: string; phone: string };
  address: { street: string; city: string; zipCode: string };
  payment: { cardNumber: string; expiry: string; cvv: string };
}

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [data, setData] = useState<CheckoutData>({
    personal: { name: '', email: '', phone: '' },
    address: { street: '', city: '', zipCode: '' },
    payment: { cardNumber: '', expiry: '', cvv: '' },
  });

  const currentStepIndex = STEPS.indexOf(currentStep);

  const updateSection = <K extends keyof CheckoutData>(
    section: K,
    values: Partial<CheckoutData[K]>
  ) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...values },
    }));
  };

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  return (
    <div>
      {/* Индикатор шагов */}
      <div className="steps">
        {STEPS.map((step, idx) => (
          <div
            key={step}
            className={`step ${idx <= currentStepIndex ? 'active' : ''}`}
          >
            {STEP_LABELS[step]}
          </div>
        ))}
      </div>

      {/* Контент текущего шага */}
      {currentStep === 'personal' && (
        <PersonalStep
          data={data.personal}
          onChange={values => updateSection('personal', values)}
        />
      )}
      {currentStep === 'address' && (
        <AddressStep
          data={data.address}
          onChange={values => updateSection('address', values)}
        />
      )}
      {currentStep === 'payment' && (
        <PaymentStep
          data={data.payment}
          onChange={values => updateSection('payment', values)}
        />
      )}
      {currentStep === 'review' && (
        <ReviewStep data={data} />
      )}

      {/* Навигация */}
      <div className="navigation">
        <button onClick={goPrev} disabled={currentStepIndex === 0}>
          Назад
        </button>
        {currentStep === 'review' ? (
          <button onClick={() => handleSubmit(data)}>Оформить заказ</button>
        ) : (
          <button onClick={goNext}>Далее</button>
        )}
      </div>
    </div>
  );
}
```

## Машины состояний с useState

### Зачем моделировать машины состояний

Явное моделирование состояний через дискриминированные объединения (discriminated unions) делает логику компонента предсказуемой: в каждый момент времени компонент находится в ровно одном состоянии, и переходы между ними строго определены.

### Простая машина состояний для асинхронного запроса

```jsx
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });

  const fetch_ = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: T = await response.json();
      setState({ status: 'success', data });
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    }
  }, [url]);

  const reset = () => setState({ status: 'idle' });

  return { state, fetch: fetch_, reset };
}

// Использование с полной type safety
function UserProfile({ userId }: { userId: string }) {
  const { state, fetch, reset } = useFetch<User>(`/api/users/${userId}`);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // TypeScript знает, какие поля доступны в каждом состоянии
  if (state.status === 'idle') {
    return <button onClick={fetch}>Загрузить профиль</button>;
  }

  if (state.status === 'loading') {
    return <div>Загрузка...</div>;
  }

  if (state.status === 'error') {
    return (
      <div>
        <p>Ошибка: {state.error}</p>
        <button onClick={reset}>Попробовать снова</button>
      </div>
    );
  }

  // Здесь TypeScript знает, что state.data существует
  return <div>Привет, {state.data.name}!</div>;
}
```

### Машина состояний для UI-компонента

```jsx
type ModalState =
  | { phase: 'closed' }
  | { phase: 'opening' }
  | { phase: 'open'; content: React.ReactNode }
  | { phase: 'closing' };

function AnimatedModal() {
  const [modalState, setModalState] = useState<ModalState>({ phase: 'closed' });

  const open = (content: React.ReactNode) => {
    setModalState({ phase: 'opening' });
    // После анимации открытия
    setTimeout(() => {
      setModalState({ phase: 'open', content });
    }, 300);
  };

  const close = () => {
    setModalState({ phase: 'closing' });
    // После анимации закрытия
    setTimeout(() => {
      setModalState({ phase: 'closed' });
    }, 300);
  };

  return (
    <div>
      <button onClick={() => open(<p>Содержимое модального окна</p>)}>
        Открыть
      </button>

      {modalState.phase !== 'closed' && (
        <div
          className={`modal modal--${modalState.phase}`}
          onClick={close}
        >
          {modalState.phase === 'open' && modalState.content}
        </div>
      )}
    </div>
  );
}
```

### Машина состояний для игрового компонента

```jsx
type GameState =
  | { phase: 'idle' }
  | { phase: 'countdown'; seconds: number }
  | { phase: 'playing'; score: number; timeLeft: number }
  | { phase: 'paused'; score: number; timeLeft: number }
  | { phase: 'gameover'; finalScore: number; highScore: number };

function GameComponent() {
  const [game, setGame] = useState<GameState>({ phase: 'idle' });

  const start = () => {
    setGame({ phase: 'countdown', seconds: 3 });
    const interval = setInterval(() => {
      setGame(prev => {
        if (prev.phase !== 'countdown') return prev;
        if (prev.seconds <= 1) {
          clearInterval(interval);
          return { phase: 'playing', score: 0, timeLeft: 60 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  };

  const pause = () => {
    setGame(prev =>
      prev.phase === 'playing'
        ? { phase: 'paused', score: prev.score, timeLeft: prev.timeLeft }
        : prev
    );
  };

  const resume = () => {
    setGame(prev =>
      prev.phase === 'paused'
        ? { phase: 'playing', score: prev.score, timeLeft: prev.timeLeft }
        : prev
    );
  };

  const addScore = (points: number) => {
    setGame(prev =>
      prev.phase === 'playing'
        ? { ...prev, score: prev.score + points }
        : prev
    );
  };

  switch (game.phase) {
    case 'idle':
      return <button onClick={start}>Начать игру</button>;
    case 'countdown':
      return <div>Начало через {game.seconds}...</div>;
    case 'playing':
      return (
        <div>
          <p>Счёт: {game.score}</p>
          <p>Время: {game.timeLeft}</p>
          <button onClick={pause}>Пауза</button>
        </div>
      );
    case 'paused':
      return (
        <div>
          <p>Пауза. Счёт: {game.score}</p>
          <button onClick={resume}>Продолжить</button>
        </div>
      );
    case 'gameover':
      return (
        <div>
          <p>Игра окончена! Счёт: {game.finalScore}</p>
          <p>Рекорд: {game.highScore}</p>
          <button onClick={start}>Играть снова</button>
        </div>
      );
  }
}
```

## Сброс состояния компонента через prop key

### Как работает key

React использует `key` для идентификации элементов в дереве. Когда `key` изменяется, React **полностью размонтирует** старый компонент и монтирует новый — со свежим начальным состоянием. Это мощный механизм для полного сброса состояния.

```jsx
function ParentComponent() {
  const [formKey, setFormKey] = useState(0);

  const resetForm = () => {
    // Увеличиваем key — React размонтирует старую форму и монтирует новую
    setFormKey(prev => prev + 1);
  };

  return (
    <div>
      {/* При изменении key вся форма сбрасывается в начальное состояние */}
      <ComplexForm key={formKey} />
      <button onClick={resetForm}>Сбросить форму</button>
    </div>
  );
}

function ComplexForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);

  // Всё это состояние будет сброшено автоматически при изменении key
  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
    </form>
  );
}
```

### Сброс при изменении данных

```jsx
interface UserEditorProps {
  userId: string;
}

function UserEditor({ userId }: UserEditorProps) {
  // Сброс состояния редактора при переключении между пользователями
  return <UserEditorInner key={userId} userId={userId} />;
}

function UserEditorInner({ userId }: UserEditorProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editedData, setEditedData] = useState<Partial<User>>({});

  useEffect(() => {
    // Загружаем данные пользователя
    fetchUser(userId).then(setUser);
  }, [userId]);

  // При изменении userId компонент размонтируется и монтируется заново
  // isDirty и editedData автоматически сбрасываются в начальные значения
  return (
    <div>
      {user && (
        <form>
          <input
            value={editedData.name ?? user.name}
            onChange={e => {
              setEditedData(prev => ({ ...prev, name: e.target.value }));
              setIsDirty(true);
            }}
          />
          {isDirty && <span>Есть несохранённые изменения</span>}
        </form>
      )}
    </div>
  );
}
```

### key vs явный сброс состояния

```jsx
// Подход 1: key (проще, полный сброс)
function WithKeyReset() {
  const [key, setKey] = useState(0);
  return (
    <div>
      <Child key={key} />
      <button onClick={() => setKey(k => k + 1)}>Сбросить</button>
    </div>
  );
}

// Подход 2: явный сброс (больше контроля)
function WithManualReset() {
  const [name, setName] = useState('');
  const [count, setCount] = useState(0);

  const reset = () => {
    setName('');
    setCount(0);
  };

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={reset}>Сбросить</button>
    </div>
  );
}
```

Используйте `key` когда нужно сбросить **всё** состояние компонента (включая вложенные компоненты). Используйте явный сброс, когда нужно сбросить **часть** состояния или выполнить дополнительные действия при сбросе.

## Когда переходить к useReducer

### Сигналы к рефакторингу

`useState` отлично справляется с независимыми, простыми значениями. Когда начинают появляться следующие паттерны, это сигнал рассмотреть `useReducer`:

**Сигнал 1: Много связанных состояний**

```jsx
// Слишком много useState — каждое обновление требует координации
function DataGrid() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 9 состояний — пора переходить на useReducer
}
```

**Сигнал 2: Сложные переходы с несколькими обновлениями**

```jsx
// Плохо: разрозненные обновления, легко забыть одно из них
const handleSort = (column: string) => {
  if (sortColumn === column) {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  } else {
    setSortColumn(column);
    setSortDirection('asc');
    setCurrentPage(1); // Не забыть сбросить страницу!
    setSelectedRows(new Set()); // И выделение!
  }
};

// Хорошо: с useReducer вся логика в одном месте
dispatch({ type: 'SORT_CHANGED', payload: column });
```

**Сигнал 3: Состояние передаётся вниз для обновления**

```jsx
// Плохо: много пропов-функций
<DataTable
  rows={rows}
  onRowSelect={handleRowSelect}
  onRowDeselect={handleRowDeselect}
  onSelectAll={handleSelectAll}
  onClearSelection={handleClearSelection}
  onSort={handleSort}
  onPageChange={handlePageChange}
  onFilterChange={handleFilterChange}
/>

// Хорошо: один dispatch
<DataTable rows={rows} dispatch={dispatch} />
```

### Рефакторинг useState → useReducer

```jsx
// До: набор useState
function ShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { productId: product.id, product, qty: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  // ... много других обработчиков
}

// После: useReducer
interface CartState {
  items: CartItem[];
  coupon: string | null;
  isCheckingOut: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { productId: string; qty: number } }
  | { type: 'APPLY_COUPON'; payload: string }
  | { type: 'REMOVE_COUPON' }
  | { type: 'START_CHECKOUT' }
  | { type: 'CANCEL_CHECKOUT' }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.productId === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.productId === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { productId: action.payload.id, product: action.payload, qty: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.productId !== action.payload) };
    case 'APPLY_COUPON':
      return { ...state, coupon: action.payload };
    case 'START_CHECKOUT':
      return { ...state, isCheckingOut: true };
    case 'CLEAR_CART':
      return { items: [], coupon: null, isCheckingOut: false };
    default:
      return state;
  }
}
```

### Сравнение: когда что выбирать

| Критерий | useState | useReducer |
|----------|----------|------------|
| Количество состояний | 1-3 независимых | 4+ или связанные |
| Логика переходов | Простая | Сложная, условная |
| Тестируемость | Средняя | Высокая (редьюсер — чистая функция) |
| Читаемость | Хорошая для простых случаев | Лучше для сложных |
| Отладка | Стандартная | Удобнее (action log) |
| Переиспользование логики | Сложнее | Проще (редьюсер отдельно) |

## TypeScript типизация useState

### Базовые типы

TypeScript может **автоматически вывести** тип из начального значения. Но иногда явная аннотация необходима.

```tsx
// Автоматический вывод типов
const [count, setCount] = useState(0);          // number
const [name, setName] = useState('');           // string
const [active, setActive] = useState(false);   // boolean
const [items, setItems] = useState([]);         // never[] — проблема!

// Явная аннотация (рекомендуется для массивов и объектов)
const [items, setItems] = useState<string[]>([]); // string[]
const [data, setData] = useState<number[] | null>(null); // number[] | null
```

### Nullable типы и начальное значение null

```tsx
interface User {
  id: string;
  name: string;
  email: string;
}

// Правильный паттерн для данных, которые загружаются асинхронно
const [user, setUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);

// После загрузки
setUser({ id: '1', name: 'Иван', email: 'ivan@example.com' });

// Проверка перед использованием
if (user !== null) {
  console.log(user.name); // TypeScript знает, что user не null
}
```

### Union типы и дискриминированные объединения

```tsx
// Простой union для конечного числа вариантов
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');

// Дискриминированный union для разных состояний с разными данными
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; loadedAt: Date }
  | { status: 'error'; message: string; code: number };

function useRequest<T>() {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' });

  const execute = async (fetcher: () => Promise<T>) => {
    setState({ status: 'loading' });
    try {
      const data = await fetcher();
      setState({ status: 'success', data, loadedAt: new Date() });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Ошибка',
        code: 500,
      });
    }
  };

  return { state, execute };
}
```

### Generic компоненты с useState

```tsx
// Generic хук для управления выбором из списка
function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const select = (id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
  };

  const deselect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map(i => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    select,
    deselect,
    toggle,
    selectAll,
    clearSelection,
  };
}

// Использование
interface Product {
  id: string;
  name: string;
  price: number;
}

function ProductList({ products }: { products: Product[] }) {
  const { selectedItems, toggle, selectAll, clearSelection } = useSelection(products);

  return (
    <div>
      <button onClick={selectAll}>Выбрать всё</button>
      <button onClick={clearSelection}>Сбросить выбор</button>
      <p>Выбрано: {selectedItems.length}</p>
      {products.map(p => (
        <div key={p.id} onClick={() => toggle(p.id)}>
          {p.name}
        </div>
      ))}
    </div>
  );
}
```

### Типизация setState функции

```tsx
// Тип функции обновления состояния
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// React.SetStateAction<T> — это T | ((prevState: T) => T)
// Поэтому setState принимает и значение, и функцию

// Передача setState как prop
interface ControlledInputProps {
  value: string;
  onChange: SetState<string>;
}

function ControlledInput({ value, onChange }: ControlledInputProps) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// Использование
function Parent() {
  const [text, setText] = useState('');
  return <ControlledInput value={text} onChange={setText} />;
}
```

## Распространённые ошибки и антипаттерны

### Антипаттерн 1: Хранение производных данных в состоянии

```tsx
// Плохо: дублирование и рассинхронизация
function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0); // Производное значение — не нужен useState!

  const addItem = (item: CartItem) => {
    const newItems = [...items, item];
    setItems(newItems);
    setTotal(newItems.reduce((sum, i) => sum + i.price * i.qty, 0)); // Риск рассинхронизации
  };
}

// Хорошо: вычисляем при рендере
function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0); // Всегда актуально

  const addItem = (item: CartItem) => {
    setItems(prev => [...prev, item]);
    // total обновится автоматически при следующем рендере
  };
}
```

### Антипаттерн 2: Синхронизация состояний через useEffect

```tsx
// Плохо: синхронизация через эффект
function FilteredList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  // Это antipattern: filteredItems всегда можно вычислить из items и filter
  useEffect(() => {
    setFilteredItems(items.filter(i => i.name.includes(filter)));
  }, [items, filter]);

  return <ul>{filteredItems.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// Хорошо: вычисляем напрямую
function FilteredList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const filteredItems = items.filter(i => i.name.includes(filter)); // Вычисляем при рендере

  return <ul>{filteredItems.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// Если вычисление дорогостоящее — используем useMemo
function FilteredList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );

  return <ul>{filteredItems.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

### Антипаттерн 3: Копирование props в состояние

```tsx
// Плохо: состояние не синхронизируется при изменении prop
function UserDisplay({ name }: { name: string }) {
  const [displayName, setDisplayName] = useState(name); // Копирует значение при монтировании

  // Если name изменится в родителе, displayName останется старым!
  return <h1>{displayName}</h1>;
}

// Хорошо 1: использовать prop напрямую
function UserDisplay({ name }: { name: string }) {
  return <h1>{name}</h1>;
}

// Хорошо 2: если нужно редактирование, явно называем initialName
function UserEditor({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName); // Явно — начальное значение

  return <input value={name} onChange={e => setName(e.target.value)} />;
}

// Хорошо 3: использовать key для сброса при изменении userId
function UserEditorWithReset({ userId, initialName }: { userId: string; initialName: string }) {
  return <UserEditorInner key={userId} initialName={initialName} />;
}
```

### Антипаттерн 4: useState внутри условий и циклов

```tsx
// Плохо: нарушение Rules of Hooks
function BadComponent({ show }: { show: boolean }) {
  if (show) {
    const [value, setValue] = useState(''); // Ошибка! Хуки не могут быть условными
  }

  for (let i = 0; i < 3; i++) {
    const [item, setItem] = useState(''); // Ошибка! Хуки не могут быть в циклах
  }
}

// Хорошо: хуки всегда на верхнем уровне
function GoodComponent({ show }: { show: boolean }) {
  const [value, setValue] = useState(''); // Всегда вызывается
  // Используем show только в JSX:
  return show ? <input value={value} onChange={e => setValue(e.target.value)} /> : null;
}
```

### Антипаттерн 5: Слишком гранулярное состояние

```tsx
// Плохо: каждое поле формы в отдельном useState
function OverGranularForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  // 10+ отдельных useState — сложно управлять

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('');
    // Легко забыть одно из полей
  };
}

// Хорошо: группируем логически связанные поля
function GoodForm() {
  const [personal, setPersonal] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [address, setAddress] = useState({ street: '', city: '', zipCode: '' });

  const reset = () => {
    setPersonal({ firstName: '', lastName: '', email: '', phone: '' });
    setAddress({ street: '', city: '', zipCode: '' });
  };
}
```

### Антипаттерн 6: Ненужные промежуточные состояния

```tsx
// Плохо: храним и флаг, и данные, хотя данные уже содержат информацию о состоянии
function UserLoader() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // Лишнее! user !== null уже означает isLoaded

  useEffect(() => {
    fetchUser().then(u => {
      setUser(u);
      setIsLoaded(true); // Лишний вызов
    });
  }, []);

  return isLoaded ? <UserCard user={user!} /> : <Skeleton />;
}

// Хорошо: используем null как индикатор загрузки
function UserLoader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  return user !== null ? <UserCard user={user} /> : <Skeleton />;
}
```

## Оптимизация производительности

### Предотвращение лишних рендеров

```tsx
// Проблема: каждое изменение родителя перерендеривает дочерний компонент
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>{count}</p>
      <ExpensiveChild /> {/* Рендерится при каждом вводе в поле! */}
    </div>
  );
}

// Решение 1: React.memo
const ExpensiveChild = React.memo(function ExpensiveChild() {
  // Рендерится только при изменении своих props
  return <div>Дорогой компонент</div>;
});

// Решение 2: Разделение состояния на отдельные компоненты
function NameInput() {
  const [name, setName] = useState(''); // Только этот компонент рендерится при вводе
  return <input value={name} onChange={e => setName(e.target.value)} />;
}

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Оптимизация начальной инициализации

```tsx
// Тяжёлая инициализация без оптимизации
function SlowComponent() {
  // generateInitialData() вызывается при КАЖДОМ рендере!
  const [data, setData] = useState(generateInitialData()); // Плохо
}

// С ленивой инициализацией
function FastComponent() {
  // generateInitialData() вызывается ТОЛЬКО при монтировании
  const [data, setData] = useState(() => generateInitialData()); // Хорошо
}
```

### Стабилизация обратных вызовов

```tsx
// Проблема: новая функция при каждом рендере
function Parent() {
  const [count, setCount] = useState(0);

  // Эта функция создаётся заново при каждом рендере
  const handleEvent = () => setCount(c => c + 1);

  // Child получает новую ссылку на handleEvent и перерендеривается
  return <MemoizedChild onEvent={handleEvent} />;
}

// Решение: useCallback для стабилизации
function Parent() {
  const [count, setCount] = useState(0);

  // Функция стабильна между рендерами
  const handleEvent = useCallback(() => {
    setCount(c => c + 1); // Функциональная форма — не нужен count в deps
  }, []); // Пустые зависимости — функция не меняется

  return <MemoizedChild onEvent={handleEvent} />;
}
```

### Разделение крупного состояния

```tsx
// Плохо: одно большое состояние — любое изменение вызывает полный рендер
function Dashboard() {
  const [state, setState] = useState({
    user: null as User | null,
    notifications: [] as Notification[],
    settings: defaultSettings,
    ui: { sidebarOpen: true, activeTab: 'dashboard' },
    analytics: { visitors: 0, revenue: 0 },
  });
}

// Хорошо: разделяем на логически независимые части
function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [ui, setUi] = useState({ sidebarOpen: true, activeTab: 'dashboard' });
  const [analytics, setAnalytics] = useState({ visitors: 0, revenue: 0 });

  // Изменение notifications не перерендерит компоненты, зависящие только от user
}
```

### useDeferredValue для плавного UI

```tsx
import { useState, useDeferredValue, useMemo } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  // deferredQuery обновляется "позже" — после срочных обновлений
  const deferredQuery = useDeferredValue(query);

  // Тяжёлая фильтрация откладывается
  const results = useMemo(
    () => heavyFilter(allItems, deferredQuery),
    [deferredQuery]
  );

  // Индикатор устаревших данных
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {/* Поле ввода реагирует мгновенно, результаты — с задержкой */}
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        {results.map(item => <div key={item.id}>{item.name}</div>)}
      </div>
    </div>
  );
}
```

## Заключение

Продвинутое использование `useState` — это не просто набор трюков, а понимание того, как React управляет состоянием на низком уровне. Ключевые выводы:

- **Ленивая инициализация** устраняет лишние вычисления при каждом рендере
- **Функциональные обновления** защищают от race conditions в асинхронном коде
- **Иммутабельность** — основное правило при работе с объектами и массивами
- **Батчинг в React 18** автоматически оптимизирует несколько обновлений в один рендер
- **Машины состояний** делают логику предсказуемой и тестируемой
- **key для сброса** — элегантный способ полного сброса состояния компонента
- **TypeScript типизация** даёт compile-time безопасность и улучшает DX
- **Производные данные** не должны храниться в состоянии — вычисляйте их при рендере

Если вы чувствуете, что `useState` уже не справляется — это сигнал рассмотреть `useReducer` для сложной логики или вынести состояние во внешнее хранилище.

Чтобы освоить управление состоянием React в полном объёме — от простых хуков до Redux Toolkit — приходите на курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=advanced-usestate). Первые 3 модуля доступны бесплатно.

## Частозадаваемые вопросы

### Почему setState не обновляет значение немедленно в той же функции?

React откладывает применение обновлений состояния до следующего рендера. Это оптимизация — несколько вызовов `setState` в одном обработчике батчируются в один рендер. Если вам нужно следующее значение сразу, вычислите его сами:

```tsx
const nextCount = count + 1;
setCount(nextCount);
console.log(nextCount); // Актуальное значение доступно здесь
```

### Как сравниваются значения при вызове setState?

React использует `Object.is()` для сравнения нового и старого значений. Если они одинаковы, рендер пропускается. Для объектов и массивов сравниваются **ссылки**, а не содержимое.

```tsx
// Рендер не запустится — та же строка
setName('Иван');
setName('Иван');

// Рендер запустится — новый объект, другая ссылка
setUser({ ...user }); // Даже если содержимое одинаковое
```

### Можно ли хранить функцию в useState?

Да, но нужно использовать обёрточную функцию, иначе React интерпретирует функцию как ленивый инициализатор:

```tsx
// Плохо: React вызовет myFn как инициализатор и сохранит результат
const [fn, setFn] = useState(myFn); // Сохранится myFn(), а не myFn

// Хорошо: оборачиваем в функцию
const [fn, setFn] = useState(() => myFn); // Сохранится сама функция myFn
setFn(() => newFn); // Обновление тоже через обёртку
```

### Как избежать бесконечного цикла в useEffect с setState?

Убедитесь, что не добавляете изменяемое состояние в зависимости эффекта, если эффект его же и обновляет:

```tsx
// Бесконечный цикл!
useEffect(() => {
  setCount(count + 1); // Обновляет count
}, [count]); // count в зависимостях — эффект запускается снова

// Правильно: функциональная форма, убираем count из зависимостей
useEffect(() => {
  setCount(prev => prev + 1); // Не нужен count в замыкании
}, []); // Пустые зависимости — запускается один раз
```

### Когда использовать useState, а когда useRef?

`useState` вызывает рендер при обновлении. `useRef` — нет. Используйте `useRef` для значений, которые не влияют на отображение:

```tsx
const [count, setCount] = useState(0); // Влияет на UI — useState
const timerRef = useRef<number | null>(null); // Не влияет на UI — useRef
const prevCountRef = useRef(count); // Хранение предыдущего значения — useRef
```

## Дополнительные ресурсы

- [useState — официальная документация React](https://react.dev/reference/react/useState)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Automatic batching in React 18](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
