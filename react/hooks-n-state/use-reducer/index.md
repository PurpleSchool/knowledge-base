---
metaTitle: useReducer в React — альтернатива useState для сложной логики
metaDescription: Полное руководство по хуку useReducer в React — как управлять сложным состоянием компонента, работать с редьюсерами, actions и dispatch, когда предпочесть useReducer вместо useState, с практическими примерами и лучшими практиками
author: Олег Марков
title: useReducer — альтернатива useState для сложной логики
preview: Узнайте как использовать хук useReducer в React для управления сложным состоянием компонентов — с редьюсерами, диспатчем экшенов, типизацией TypeScript и реальными практическими примерами
---

## Введение

Когда вы только начинаете работать с React, хук `useState` кажется универсальным инструментом для управления состоянием. И действительно — для простых случаев он отлично справляется. Однако с ростом сложности компонента вы начинаете замечать, что логика обновления состояния разбросана по множеству обработчиков событий, а сами обработчики становятся всё сложнее.

Именно для таких ситуаций React предоставляет хук `useReducer`. Он позволяет централизовать логику обновления состояния в одной функции — редьюсере — и управлять сложными переходами между состояниями предсказуемым способом.

В этой статье вы узнаете:

- Что такое `useReducer` и как он работает
- Когда стоит выбирать `useReducer` вместо `useState`
- Как писать редьюсеры и типизировать их в TypeScript
- Практические примеры: корзина покупок, форма, конечный автомат
- Как комбинировать `useReducer` с `useContext` для глобального состояния
- Лучшие практики и типичные ошибки

## Что такое useReducer

`useReducer` — это хук React, который позволяет управлять состоянием компонента через паттерн редьюсера. Идея заимствована из Redux и функционального программирования.

### Базовый синтаксис

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

Хук принимает два обязательных аргумента:

- **reducer** — чистая функция `(state, action) => newState`, которая описывает как состояние меняется в ответ на экшены
- **initialState** — начальное значение состояния

И возвращает кортеж:

- **state** — текущее состояние
- **dispatch** — функция для отправки экшенов в редьюсер

### Как это работает

Посмотрите на простейший пример — счётчик:

```jsx
import { useReducer } from 'react';

// Редьюсер: чистая функция (state, action) => newState
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      return state; // Важно: всегда возвращать state по умолчанию
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Счётчик: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Сбросить</button>
    </div>
  );
}
```

Когда вы вызываете `dispatch({ type: 'increment' })`, React:
1. Вызывает редьюсер с текущим состоянием и переданным экшеном
2. Сохраняет возвращённое значение как новое состояние
3. Перерисовывает компонент

### Третий аргумент: инициализатор

`useReducer` принимает необязательный третий аргумент — функцию инициализации:

```jsx
function init(initialCount) {
  return { count: initialCount };
}

function Counter({ initialCount }) {
  const [state, dispatch] = useReducer(counterReducer, initialCount, init);
  // ...
}
```

Это полезно когда начальное состояние нужно вычислить из пропса, или когда вы хотите повторно использовать логику инициализации (например, при сбросе состояния через dispatch).

## useState vs useReducer: когда что выбирать

Оба хука предназначены для управления состоянием, но у каждого есть своя область применения.

### Используйте useState когда:

- Состояние простое: одно значение, строка, булево, число
- Переходы между состояниями простые и независимые
- Логика обновления умещается в одну строку

```jsx
// Хорошо подходит для useState
const [isOpen, setIsOpen] = useState(false);
const [name, setName] = useState('');
const [count, setCount] = useState(0);
```

### Используйте useReducer когда:

- Состояние — сложный объект с несколькими взаимосвязанными полями
- Следующее состояние зависит от предыдущего нетривиальным образом
- Логика обновления состояния сложная и её стоит протестировать отдельно
- Несколько разных экшенов приводят к похожим изменениям состояния
- Компонент имеет много обработчиков событий, которые меняют состояние схожим образом

```jsx
// Хорошо подходит для useReducer
const [formState, dispatch] = useReducer(formReducer, {
  values: { name: '', email: '', password: '' },
  errors: {},
  isSubmitting: false,
  submitError: null,
});
```

### Наглядное сравнение

Рассмотрим управление формой с `useState`:

```jsx
// С useState — логика разбросана по компоненту
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false); // Не забыть сбросить!
    }
  };

  // ...
}
```

И тот же компонент с `useReducer`:

```jsx
// С useReducer — логика централизована в редьюсере
const initialState = {
  email: '',
  password: '',
  isSubmitting: false,
  error: null,
};

function loginReducer(state, action) {
  switch (action.type) {
    case 'field_change':
      return { ...state, [action.field]: action.value };
    case 'submit_start':
      return { ...state, isSubmitting: true, error: null };
    case 'submit_success':
      return { ...state, isSubmitting: false };
    case 'submit_error':
      return { ...state, isSubmitting: false, error: action.error };
    default:
      return state;
  }
}

function LoginForm() {
  const [state, dispatch] = useReducer(loginReducer, initialState);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'submit_start' });

    try {
      await login(state.email, state.password);
      dispatch({ type: 'submit_success' });
    } catch (err) {
      dispatch({ type: 'submit_error', error: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={state.email}
        onChange={(e) => dispatch({ type: 'field_change', field: 'email', value: e.target.value })}
      />
      <input
        type="password"
        value={state.password}
        onChange={(e) => dispatch({ type: 'field_change', field: 'password', value: e.target.value })}
      />
      {state.error && <p>{state.error}</p>}
      <button disabled={state.isSubmitting}>
        {state.isSubmitting ? 'Входим...' : 'Войти'}
      </button>
    </form>
  );
}
```

Второй вариант явно описывает все переходы состояния, и редьюсер можно легко протестировать изолированно.

## Практические примеры

### Пример 1: Корзина покупок

Рассмотрим полноценную корзину покупок — классический пример для `useReducer`:

```jsx
import { useReducer } from 'react';

// Типы экшенов — хорошая практика хранить как константы
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_DISCOUNT: 'APPLY_DISCOUNT',
};

// Начальное состояние
const initialCartState = {
  items: [],
  discount: 0,
};

// Редьюсер
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItem = state.items.find(item => item.id === action.product.id);

      if (existingItem) {
        // Увеличиваем количество
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      // Добавляем новый товар
      return {
        ...state,
        items: [...state.items, { ...action.product, quantity: 1 }],
      };
    }

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
      };

    case CART_ACTIONS.UPDATE_QUANTITY: {
      if (action.quantity <= 0) {
        // Если количество 0 или меньше — удаляем товар
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.id),
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return { ...initialCartState };

    case CART_ACTIONS.APPLY_DISCOUNT:
      return {
        ...state,
        discount: action.percent,
      };

    default:
      return state;
  }
}

// Вспомогательные вычисления
function getCartTotals(state) {
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = subtotal * (state.discount / 100);
  const total = subtotal - discountAmount;
  return { subtotal, discountAmount, total };
}

// Компонент корзины
function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);
  const { subtotal, discountAmount, total } = getCartTotals(cart);

  const handleAddItem = (product) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, product });
  };

  const handleRemoveItem = (id) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, id });
  };

  const handleQuantityChange = (id, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, id, quantity });
  };

  const handleApplyDiscount = () => {
    dispatch({ type: CART_ACTIONS.APPLY_DISCOUNT, percent: 10 });
  };

  const handleClear = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  return (
    <div>
      {/* Список товаров для добавления */}
      <div>
        <button onClick={() => handleAddItem({ id: 1, name: 'Книга', price: 500 })}>
          Добавить книгу
        </button>
        <button onClick={() => handleAddItem({ id: 2, name: 'Курс', price: 2000 })}>
          Добавить курс
        </button>
      </div>

      {/* Корзина */}
      <h2>Корзина ({cart.items.length} позиций)</h2>
      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.name} — {item.price} ₽</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
            min="0"
          />
          <button onClick={() => handleRemoveItem(item.id)}>Удалить</button>
        </div>
      ))}

      {/* Итоги */}
      <div>
        <p>Подытог: {subtotal} ₽</p>
        {cart.discount > 0 && <p>Скидка ({cart.discount}%): -{discountAmount} ₽</p>}
        <p><strong>Итого: {total} ₽</strong></p>
      </div>

      <button onClick={handleApplyDiscount}>Применить скидку 10%</button>
      <button onClick={handleClear}>Очистить корзину</button>
    </div>
  );
}
```

### Пример 2: Конечный автомат (State Machine)

`useReducer` отлично подходит для реализации конечных автоматов — когда компонент может находиться в строго определённых состояниях:

```jsx
import { useReducer } from 'react';

// Возможные состояния
const STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Начальное состояние
const initialState = {
  status: STATES.IDLE,
  data: null,
  error: null,
};

// Редьюсер-автомат
function fetchReducer(state, action) {
  switch (action.type) {
    case 'fetch_start':
      // Из idle → loading
      if (state.status !== STATES.IDLE && state.status !== STATES.ERROR) {
        return state; // Нельзя начать запрос в другом состоянии
      }
      return { status: STATES.LOADING, data: null, error: null };

    case 'fetch_success':
      // Из loading → success
      if (state.status !== STATES.LOADING) {
        return state;
      }
      return { status: STATES.SUCCESS, data: action.data, error: null };

    case 'fetch_error':
      // Из loading → error
      if (state.status !== STATES.LOADING) {
        return state;
      }
      return { status: STATES.ERROR, data: null, error: action.error };

    case 'reset':
      return initialState;

    default:
      return state;
  }
}

// Хук для работы с API
function useApiRequest(fetchFn) {
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  const execute = async (...args) => {
    dispatch({ type: 'fetch_start' });

    try {
      const data = await fetchFn(...args);
      dispatch({ type: 'fetch_success', data });
    } catch (err) {
      dispatch({ type: 'fetch_error', error: err.message });
    }
  };

  const reset = () => dispatch({ type: 'reset' });

  return { ...state, execute, reset };
}

// Использование
function UserProfile({ userId }) {
  const {
    status,
    data: user,
    error,
    execute: fetchUser,
    reset,
  } = useApiRequest(() => fetch(`/api/users/${userId}`).then(r => r.json()));

  if (status === STATES.IDLE) {
    return <button onClick={fetchUser}>Загрузить профиль</button>;
  }

  if (status === STATES.LOADING) {
    return <div>Загружаем...</div>;
  }

  if (status === STATES.ERROR) {
    return (
      <div>
        <p>Ошибка: {error}</p>
        <button onClick={fetchUser}>Повторить</button>
      </div>
    );
  }

  if (status === STATES.SUCCESS) {
    return (
      <div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <button onClick={reset}>Закрыть</button>
      </div>
    );
  }
}
```

### Пример 3: Многошаговая форма

Управление многошаговой формой — ещё один хороший кандидат для `useReducer`:

```jsx
import { useReducer } from 'react';

const STEPS = {
  PERSONAL: 0,
  CONTACT: 1,
  PAYMENT: 2,
  CONFIRMATION: 3,
};

const initialFormState = {
  currentStep: STEPS.PERSONAL,
  data: {
    personal: { firstName: '', lastName: '', birthDate: '' },
    contact: { email: '', phone: '', address: '' },
    payment: { cardNumber: '', cardHolder: '', expiry: '' },
  },
  completedSteps: new Set(),
};

function formReducer(state, action) {
  switch (action.type) {
    case 'update_step_data':
      return {
        ...state,
        data: {
          ...state.data,
          [action.step]: {
            ...state.data[action.step],
            ...action.data,
          },
        },
      };

    case 'complete_step':
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.step]),
        currentStep: state.currentStep + 1,
      };

    case 'go_to_step':
      // Разрешаем переход только к уже пройденным шагам или текущему
      if (action.step <= state.currentStep) {
        return { ...state, currentStep: action.step };
      }
      return state;

    case 'reset':
      return {
        ...initialFormState,
        data: {
          personal: { firstName: '', lastName: '', birthDate: '' },
          contact: { email: '', phone: '', address: '' },
          payment: { cardNumber: '', cardHolder: '', expiry: '' },
        },
        completedSteps: new Set(),
      };

    default:
      return state;
  }
}

function MultiStepForm() {
  const [form, dispatch] = useReducer(formReducer, initialFormState);

  const updateField = (step, field, value) => {
    dispatch({
      type: 'update_step_data',
      step,
      data: { [field]: value },
    });
  };

  const completeStep = (step) => {
    dispatch({ type: 'complete_step', step });
  };

  const stepNames = ['Личные данные', 'Контакты', 'Оплата', 'Подтверждение'];

  return (
    <div>
      {/* Индикатор прогресса */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {stepNames.map((name, index) => (
          <button
            key={index}
            onClick={() => dispatch({ type: 'go_to_step', step: index })}
            style={{
              background: form.completedSteps.has(index)
                ? 'green'
                : form.currentStep === index
                ? 'blue'
                : 'gray',
              color: 'white',
              padding: '8px 16px',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Шаг 1: Личные данные */}
      {form.currentStep === STEPS.PERSONAL && (
        <div>
          <h2>Личные данные</h2>
          <input
            placeholder="Имя"
            value={form.data.personal.firstName}
            onChange={(e) => updateField('personal', 'firstName', e.target.value)}
          />
          <input
            placeholder="Фамилия"
            value={form.data.personal.lastName}
            onChange={(e) => updateField('personal', 'lastName', e.target.value)}
          />
          <button onClick={() => completeStep(STEPS.PERSONAL)}>Далее</button>
        </div>
      )}

      {/* Шаг 2: Контакты */}
      {form.currentStep === STEPS.CONTACT && (
        <div>
          <h2>Контактные данные</h2>
          <input
            placeholder="Email"
            value={form.data.contact.email}
            onChange={(e) => updateField('contact', 'email', e.target.value)}
          />
          <input
            placeholder="Телефон"
            value={form.data.contact.phone}
            onChange={(e) => updateField('contact', 'phone', e.target.value)}
          />
          <button onClick={() => completeStep(STEPS.CONTACT)}>Далее</button>
        </div>
      )}

      {/* Шаг 3: Оплата */}
      {form.currentStep === STEPS.PAYMENT && (
        <div>
          <h2>Данные оплаты</h2>
          <input
            placeholder="Номер карты"
            value={form.data.payment.cardNumber}
            onChange={(e) => updateField('payment', 'cardNumber', e.target.value)}
          />
          <button onClick={() => completeStep(STEPS.PAYMENT)}>Далее</button>
        </div>
      )}

      {/* Шаг 4: Подтверждение */}
      {form.currentStep === STEPS.CONFIRMATION && (
        <div>
          <h2>Подтверждение</h2>
          <pre>{JSON.stringify(form.data, null, 2)}</pre>
          <button onClick={() => dispatch({ type: 'reset' })}>
            Заполнить снова
          </button>
        </div>
      )}
    </div>
  );
}
```

## Типизация useReducer в TypeScript

TypeScript отлично работает с `useReducer` — типы позволяют избежать опечаток в названиях экшенов и неверных структур данных.

### Базовая типизация

```typescript
import { useReducer } from 'react';

// Описываем типы состояния
interface CounterState {
  count: number;
  step: number;
}

// Описываем все возможные экшены через дискриминированный union
type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'set_step'; step: number }
  | { type: 'set_count'; count: number };

// Редьюсер с типами
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'reset':
      return { ...state, count: 0 };
    case 'set_step':
      // TypeScript знает, что здесь action.step существует
      return { ...state, step: action.step };
    case 'set_count':
      return { ...state, count: action.count };
    default:
      return state;
  }
}

const initialState: CounterState = { count: 0, step: 1 };

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  return (
    <div>
      <p>Счётчик: {state.count}</p>
      <label>
        Шаг:
        <input
          type="number"
          value={state.step}
          // TypeScript потребует передать step как number
          onChange={(e) => dispatch({ type: 'set_step', step: Number(e.target.value) })}
        />
      </label>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Сбросить</button>
    </div>
  );
}
```

### Типизация с generic-функцией редьюсера

Для переиспользуемых редьюсеров удобно использовать generic:

```typescript
// Общий тип для CRUD-операций
type CrudAction<T> =
  | { type: 'create'; item: T }
  | { type: 'update'; id: string; updates: Partial<T> }
  | { type: 'delete'; id: string }
  | { type: 'set_all'; items: T[] };

interface WithId {
  id: string;
}

function createCrudReducer<T extends WithId>() {
  return function reducer(state: T[], action: CrudAction<T>): T[] {
    switch (action.type) {
      case 'create':
        return [...state, action.item];
      case 'update':
        return state.map(item =>
          item.id === action.id ? { ...item, ...action.updates } : item
        );
      case 'delete':
        return state.filter(item => item.id !== action.id);
      case 'set_all':
        return action.items;
      default:
        return state;
    }
  };
}

// Использование
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const taskReducer = createCrudReducer<Task>();

function TaskList() {
  const [tasks, dispatch] = useReducer(taskReducer, []);

  const addTask = (title: string) => {
    dispatch({
      type: 'create',
      item: { id: Date.now().toString(), title, completed: false },
    });
  };

  const toggleTask = (id: string, completed: boolean) => {
    dispatch({ type: 'update', id, updates: { completed } });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'delete', id });
  };

  return (
    <div>
      <button onClick={() => addTask('Новая задача')}>Добавить</button>
      {tasks.map(task => (
        <div key={task.id}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => toggleTask(task.id, e.target.checked)}
          />
          <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          <button onClick={() => deleteTask(task.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

## useReducer + useContext: глобальное состояние

Комбинирование `useReducer` с `useContext` — мощный паттерн для управления глобальным состоянием без Redux.

```typescript
import { createContext, useContext, useReducer, ReactNode } from 'react';

// Типы
interface User {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  notifications: string[];
}

type AppAction =
  | { type: 'login'; user: User }
  | { type: 'logout' }
  | { type: 'toggle_theme' }
  | { type: 'add_notification'; message: string }
  | { type: 'remove_notification'; index: number };

// Редьюсер
const initialAppState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: 'light',
  notifications: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'login':
      return {
        ...state,
        user: action.user,
        isAuthenticated: true,
      };

    case 'logout':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };

    case 'toggle_theme':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };

    case 'add_notification':
      return {
        ...state,
        notifications: [...state.notifications, action.message],
      };

    case 'remove_notification':
      return {
        ...state,
        notifications: state.notifications.filter((_, i) => i !== action.index),
      };

    default:
      return state;
  }
}

// Контексты
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

// Провайдер
function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Кастомные хуки для удобного использования
function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}

// Использование в компонентах
function Header() {
  const { user, isAuthenticated, theme } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <span>Привет, {user?.name}!</span>
          <button onClick={() => dispatch({ type: 'logout' })}>Выйти</button>
        </div>
      ) : (
        <button onClick={() => dispatch({
          type: 'login',
          user: { id: '1', name: 'Иван', email: 'ivan@example.com' }
        })}>
          Войти
        </button>
      )}
      <button onClick={() => dispatch({ type: 'toggle_theme' })}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}

// Обёртка всего приложения
function App() {
  return (
    <AppProvider>
      <Header />
      {/* Остальные компоненты */}
    </AppProvider>
  );
}
```

### Разделение dispatch на action creators

Для удобства можно вынести экшены в отдельные функции:

```typescript
// actions.ts
export const authActions = {
  login: (user: User): AppAction => ({ type: 'login', user }),
  logout: (): AppAction => ({ type: 'logout' }),
};

export const uiActions = {
  toggleTheme: (): AppAction => ({ type: 'toggle_theme' }),
  addNotification: (message: string): AppAction => ({ type: 'add_notification', message }),
  removeNotification: (index: number): AppAction => ({ type: 'remove_notification', index }),
};

// Использование в компоненте
function LoginButton() {
  const dispatch = useAppDispatch();
  const handleLogin = () => {
    dispatch(authActions.login({ id: '1', name: 'Иван', email: 'ivan@example.com' }));
    dispatch(uiActions.addNotification('Вы успешно вошли в систему!'));
  };

  return <button onClick={handleLogin}>Войти</button>;
}
```

## Тестирование редьюсеров

Одно из главных преимуществ `useReducer` — редьюсер является чистой функцией и легко тестируется без рендеринга компонента:

```typescript
// cartReducer.test.ts
import { cartReducer, initialCartState, CART_ACTIONS } from './cartReducer';

describe('cartReducer', () => {
  it('добавляет новый товар в пустую корзину', () => {
    const product = { id: 1, name: 'Книга', price: 500 };
    const action = { type: CART_ACTIONS.ADD_ITEM, product };

    const newState = cartReducer(initialCartState, action);

    expect(newState.items).toHaveLength(1);
    expect(newState.items[0]).toMatchObject({ ...product, quantity: 1 });
  });

  it('увеличивает количество при добавлении существующего товара', () => {
    const product = { id: 1, name: 'Книга', price: 500 };
    const stateWithItem = {
      ...initialCartState,
      items: [{ ...product, quantity: 1 }],
    };

    const newState = cartReducer(stateWithItem, {
      type: CART_ACTIONS.ADD_ITEM,
      product,
    });

    expect(newState.items).toHaveLength(1);
    expect(newState.items[0].quantity).toBe(2);
  });

  it('удаляет товар из корзины', () => {
    const stateWithItem = {
      ...initialCartState,
      items: [{ id: 1, name: 'Книга', price: 500, quantity: 1 }],
    };

    const newState = cartReducer(stateWithItem, {
      type: CART_ACTIONS.REMOVE_ITEM,
      id: 1,
    });

    expect(newState.items).toHaveLength(0);
  });

  it('очищает корзину', () => {
    const stateWithItems = {
      ...initialCartState,
      items: [
        { id: 1, name: 'Книга', price: 500, quantity: 2 },
        { id: 2, name: 'Курс', price: 2000, quantity: 1 },
      ],
      discount: 15,
    };

    const newState = cartReducer(stateWithItems, { type: CART_ACTIONS.CLEAR_CART });

    expect(newState.items).toHaveLength(0);
    expect(newState.discount).toBe(0);
  });

  it('применяет скидку', () => {
    const newState = cartReducer(initialCartState, {
      type: CART_ACTIONS.APPLY_DISCOUNT,
      percent: 20,
    });

    expect(newState.discount).toBe(20);
  });

  it('не изменяет состояние при неизвестном экшене', () => {
    const newState = cartReducer(initialCartState, { type: 'UNKNOWN_ACTION' } as any);
    expect(newState).toBe(initialCartState); // Ссылочное равенство!
  });
});
```

## Лучшие практики

### 1. Редьюсер — это чистая функция

Редьюсер не должен иметь побочных эффектов: никаких запросов к API, никакого изменения аргументов, никаких случайных значений:

```jsx
// ❌ Плохо — мутация, нечистая функция
function badReducer(state, action) {
  switch (action.type) {
    case 'add_item':
      state.items.push(action.item); // Мутируем аргумент!
      return state; // Возвращаем тот же объект
    default:
      return state;
  }
}

// ✅ Хорошо — иммутабельное обновление
function goodReducer(state, action) {
  switch (action.type) {
    case 'add_item':
      return { ...state, items: [...state.items, action.item] };
    default:
      return state;
  }
}
```

### 2. Выносите тяжёлые вычисления в инициализатор

```jsx
// ❌ Плохо — тяжёлое вычисление при каждом рендере
const [state, dispatch] = useReducer(reducer, computeHeavyInitialState());

// ✅ Хорошо — вычисление только один раз
const [state, dispatch] = useReducer(reducer, null, () => computeHeavyInitialState());
```

### 3. Используйте константы для типов экшенов

```jsx
// ❌ Плохо — строки напрямую (легко опечататься)
dispatch({ type: 'incrment' }); // Опечатка не вызовет ошибку TypeScript без типизации

// ✅ Хорошо — константы или TypeScript типы
const ACTIONS = {
  INCREMENT: 'increment',
  DECREMENT: 'decrement',
} as const;

dispatch({ type: ACTIONS.INCREMENT }); // TypeScript поймает опечатку
```

### 4. Храните редьюсер вне компонента

```jsx
// ❌ Плохо — редьюсер пересоздаётся при каждом рендере
function MyComponent() {
  function reducer(state, action) { /* ... */ }
  const [state, dispatch] = useReducer(reducer, initialState);
}

// ✅ Хорошо — редьюсер определён вне компонента
function reducer(state, action) { /* ... */ }

function MyComponent() {
  const [state, dispatch] = useReducer(reducer, initialState);
}
```

### 5. Не дублируйте состояние — вычисляйте производные данные

```jsx
// ❌ Плохо — дублирование в состоянии
const [state, dispatch] = useReducer(reducer, {
  items: [],
  totalPrice: 0, // Вычисляется из items — не нужно хранить
  itemCount: 0,  // Вычисляется из items — не нужно хранить
});

// ✅ Хорошо — вычисляем при рендере
const [state, dispatch] = useReducer(reducer, { items: [] });
const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const itemCount = state.items.length;
```

### 6. Группируйте связанные экшены в один

```jsx
// ❌ Плохо — несколько dispatch для одной операции
const handleSubmit = async () => {
  dispatch({ type: 'SET_LOADING', loading: true });
  dispatch({ type: 'CLEAR_ERROR' });
  // ... fetch
  dispatch({ type: 'SET_DATA', data });
  dispatch({ type: 'SET_LOADING', loading: false });
};

// ✅ Хорошо — атомарные переходы
const handleSubmit = async () => {
  dispatch({ type: 'submit_start' });
  try {
    const data = await fetchData();
    dispatch({ type: 'submit_success', data });
  } catch (err) {
    dispatch({ type: 'submit_error', error: err.message });
  }
};
```

## Типичные ошибки

### Ошибка 1: Мутация состояния

```jsx
// ❌ Неправильно
function reducer(state, action) {
  switch (action.type) {
    case 'toggle_item':
      // Прямая мутация — React не увидит изменения!
      const item = state.items.find(i => i.id === action.id);
      item.checked = !item.checked;
      return state;
  }
}

// ✅ Правильно
function reducer(state, action) {
  switch (action.type) {
    case 'toggle_item':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, checked: !item.checked } : item
        ),
      };
  }
}
```

### Ошибка 2: Забытый default

```jsx
// ❌ Опасно — без default редьюсер может вернуть undefined
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    // Нет default!
  }
}

// ✅ Правильно
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state; // Всегда возвращаем состояние
  }
}
```

### Ошибка 3: Побочные эффекты в редьюсере

```jsx
// ❌ Неправильно — побочные эффекты в редьюсере
function reducer(state, action) {
  switch (action.type) {
    case 'add_item':
      localStorage.setItem('cart', JSON.stringify([...state.items, action.item])); // Побочный эффект!
      return { ...state, items: [...state.items, action.item] };
  }
}

// ✅ Правильно — побочные эффекты в useEffect
function reducer(state, action) {
  switch (action.type) {
    case 'add_item':
      return { ...state, items: [...state.items, action.item] };
    default:
      return state;
  }
}

function Cart() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Синхронизация с localStorage через useEffect
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);
}
```

### Ошибка 4: Слишком широкий контекст с dispatch

```jsx
// ❌ Плохо — передаём dispatch через props или один большой контекст
// Это приведёт к лишним перерисовкам

// ✅ Хорошо — разделяем контекст состояния и dispatch
const StateContext = createContext(null);
const DispatchContext = createContext(null);
// dispatch никогда не меняется между рендерами,
// поэтому компоненты, использующие только dispatch, не будут перерисовываться
```

## useReducer vs Redux

`useReducer` в паре с `useContext` решает много задач, которые раньше требовали Redux. Но у каждого инструмента есть своя ниша:

| Критерий | useReducer + useContext | Redux Toolkit |
|----------|------------------------|---------------|
| **Сложность настройки** | Минимальная | Средняя |
| **DevTools** | Нет (без плагинов) | Redux DevTools |
| **Middleware** | Вручную | Встроенная поддержка |
| **Производительность** | Базовая | Оптимизированная |
| **Масштабируемость** | Средняя | Высокая |
| **Размер бандла** | 0 (встроено в React) | ~14KB gzipped |
| **Подходит для** | Средние приложения | Крупные приложения |

Выбирайте `useReducer` + `useContext` для средних проектов, и переходите на Redux Toolkit (или Zustand, Jotai) когда:
- Нужны Redux DevTools для отладки
- Приложение достаточно большое и появляются проблемы производительности
- Нужна сложная middleware-логика (логирование, кеширование, оптимистичные обновления)

## Часто задаваемые вопросы

**Q: Можно ли использовать несколько useReducer в одном компоненте?**

Да, это вполне нормально. Разделяйте состояние по смысловым доменам:

```jsx
function Dashboard() {
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  const [filtersState, filtersDispatch] = useReducer(filtersReducer, initialFiltersState);
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUiState);
}
```

**Q: Почему React вызывает редьюсер дважды в режиме разработки?**

В Strict Mode React специально вызывает редьюсер дважды, чтобы убедиться, что он является чистой функцией. Это нормальное поведение только в development-окружении.

**Q: Как использовать useReducer с асинхронными операциями?**

Редьюсер синхронный, но вы можете выполнять async-код в обработчиках событий до/после dispatch:

```jsx
function MyComponent() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFetch = async () => {
    dispatch({ type: 'fetch_start' });
    try {
      const data = await api.getData();
      dispatch({ type: 'fetch_success', data });
    } catch (error) {
      dispatch({ type: 'fetch_error', error: error.message });
    }
  };
}
```

**Q: Когда стоит мемоизировать dispatch?**

Никогда — функция `dispatch`, возвращаемая `useReducer`, стабильна между рендерами (как и setState из useState). Можно безопасно передавать её в дочерние компоненты и в массив зависимостей useEffect.

**Q: Как «сбросить» состояние к начальному?**

Используйте инициализатор:

```jsx
function init(initialState) {
  return initialState;
}

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      return init(action.initialState);
    // ...
  }
}

function MyComponent({ initialData }) {
  const [state, dispatch] = useReducer(reducer, initialData, init);
  const handleReset = () => dispatch({ type: 'reset', initialState: initialData });
}
```

## Заключение

`useReducer` — мощный инструмент для управления сложным состоянием в React-компонентах. Он особенно полезен когда:

- Состояние имеет сложную структуру с несколькими взаимосвязанными полями
- Существует много вариантов изменения состояния
- Нужна чёткая документация того, как состояние может меняться
- Вы хотите легко тестируемую логику состояния

Ключевые принципы:
1. **Редьюсер — чистая функция**: нет побочных эффектов, нет мутаций
2. **Экшены описывают что произошло**, а не как изменить состояние
3. **Иммутабельность**: всегда создавайте новые объекты
4. **Всегда возвращайте state в default**: для неизвестных экшенов
5. **Вычисляйте производные данные**, а не храните их в состоянии

Комбинируя `useReducer` с `useContext`, вы получаете мощную систему управления состоянием без внешних зависимостей — отличный выбор для малых и средних React-приложений.
