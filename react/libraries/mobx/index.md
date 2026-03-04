---
metaTitle: MobX — реактивное управление состоянием в React
metaDescription: Полное руководство по MobX — библиотеке реактивного управления состоянием для React. Observable, action, computed, reaction, интеграция с React, сравнение с Redux, лучшие практики
author: Олег Марков
title: MobX — реактивное управление состоянием в React
preview: Узнайте, как использовать MobX для реактивного управления состоянием в React-приложениях — от базовых концепций observable и action до продвинутых паттернов с computed, reaction и TypeScript-декораторами
---

## Введение

Управление состоянием в React-приложениях — одна из самых обсуждаемых тем в сообществе. Существует множество подходов: встроенный `useState` и `useContext`, Redux с иммутабельными обновлениями, Zustand с минималистичным API. Каждый из них имеет свои сильные стороны и подходит для разных сценариев.

**MobX** занимает особое место в этом ряду. В отличие от Redux, где вы явно описываете каждое изменение через actions и reducers, MobX использует принцип **реактивного программирования**: вы просто изменяете данные, а MobX автоматически определяет, что нужно обновить. Это делает код значительно лаконичнее и ближе к привычному объектно-ориентированному стилю.

MobX — это зрелая, проверенная временем библиотека. Она используется в крупных проектах по всему миру и хорошо интегрируется с TypeScript. В этой статье вы познакомитесь с ключевыми концепциями MobX, научитесь использовать её в React-приложениях и поймёте, когда она является оптимальным выбором.

## Что такое MobX и зачем он нужен

MobX — это библиотека для управления состоянием приложений, основанная на принципах реактивного программирования. Её центральная идея проста: **всё, что можно вычислить из состояния — вычисляется автоматически**.

Вместо того чтобы вручную подписываться на изменения и вызывать ре-рендеры, вы просто описываете состояние и его производные. MobX берёт на себя всю работу по отслеживанию зависимостей и обновлению интерфейса.

### Ключевые преимущества MobX

- **Минимум шаблонного кода** — не нужно писать actions, reducers, selectors в отдельных файлах
- **Мутабельное состояние** — вы изменяете данные напрямую, как в обычном JavaScript
- **Автоматическое отслеживание зависимостей** — MobX сам знает, какие компоненты зависят от каких данных
- **Гранулярные обновления** — перерендеривается только то, что реально изменилось
- **Отличная интеграция с TypeScript** — полная поддержка типов и декораторов
- **Принцип наименьшего удивления** — код ведёт себя так, как вы ожидаете

### Философия MobX

MobX придерживается принципа: **состояние должно быть минимальным**. Всё остальное — производные данные и побочные эффекты — должно вычисляться и выполняться автоматически при изменении исходного состояния.

```
Состояние (Observable) → Производные (Computed) → Реакции (Reactions/UI)
```

Именно это делает код предсказуемым: при изменении одного observable-значения все зависящие от него computed-значения и компоненты обновляются синхронно и автоматически.

## Установка и настройка

### Установка пакетов

```bash
# Основные пакеты
npm install mobx mobx-react-lite

# Если вы используете классовые компоненты (устаревший подход)
npm install mobx mobx-react
```

Пакет `mobx-react-lite` — это облегчённая версия интеграции с React, оптимизированная для функциональных компонентов с хуками. Именно её мы будем использовать в этой статье.

### Настройка TypeScript (для декораторов)

Если вы хотите использовать декораторы MobX (старый синтаксис), добавьте в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": true
  }
}
```

Однако в современном MobX (версия 6+) предпочтительнее использовать `makeObservable` или `makeAutoObservable` вместо декораторов — это более совместимо с различными сборщиками и не требует дополнительной конфигурации.

### Простейший пример

Вот как выглядит минимальное MobX-приложение:

```tsx
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

// Хранилище состояния
class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}

const store = new CounterStore();

// Компонент автоматически обновляется при изменении store.count
const Counter = observer(() => {
  return (
    <div>
      <p>Счётчик: {store.count}</p>
      <button onClick={() => store.increment()}>+1</button>
      <button onClick={() => store.decrement()}>-1</button>
    </div>
  );
});
```

Всего несколько строк кода — и у нас есть реактивный счётчик. Никаких actions, reducers, dispatch — просто изменяем свойство напрямую.

## Основные концепции MobX

### Observable — наблюдаемое состояние

`observable` — это основа MobX. Когда вы помечаете данные как observable, MobX начинает отслеживать все обращения к ним и автоматически уведомляет подписчиков при изменениях.

#### makeAutoObservable

Самый простой способ создать observable — использовать `makeAutoObservable` в конструкторе класса:

```tsx
import { makeAutoObservable } from 'mobx';

class TodoStore {
  todos: string[] = [];
  filter: 'all' | 'active' | 'done' = 'all';
  isLoading = false;

  constructor() {
    // MobX автоматически определяет:
    // - свойства → observable
    // - геттеры → computed
    // - методы → action
    makeAutoObservable(this);
  }

  addTodo(text: string) {
    this.todos.push(text);
  }

  setFilter(filter: 'all' | 'active' | 'done') {
    this.filter = filter;
  }
}
```

#### makeObservable — явная конфигурация

Если нужен более тонкий контроль, используйте `makeObservable` с явным указанием аннотаций:

```tsx
import { makeObservable, observable, action, computed } from 'mobx';

class UserStore {
  name = '';
  age = 0;
  isLoggedIn = false;

  constructor() {
    makeObservable(this, {
      name: observable,
      age: observable,
      isLoggedIn: observable,
      // computed и action объявляем явно
      isAdult: computed,
      login: action,
      logout: action,
    });
  }

  get isAdult() {
    return this.age >= 18;
  }

  login(name: string, age: number) {
    this.name = name;
    this.age = age;
    this.isLoggedIn = true;
  }

  logout() {
    this.name = '';
    this.age = 0;
    this.isLoggedIn = false;
  }
}
```

#### observable для примитивных значений и объектов

Вне классов можно использовать `observable` как функцию:

```tsx
import { observable, runInAction } from 'mobx';

// Observable объект
const person = observable({
  name: 'Иван',
  age: 30,
});

// Observable массив
const items = observable(['яблоко', 'банан', 'вишня']);

// Observable Map
const settings = observable(new Map([
  ['theme', 'dark'],
  ['language', 'ru'],
]));

// Изменения работают реактивно
runInAction(() => {
  person.name = 'Мария';
  items.push('груша');
  settings.set('theme', 'light');
});
```

### Action — изменение состояния

Все изменения observable-данных должны происходить внутри `action`. Это обеспечивает батчинг обновлений: даже если вы изменяете несколько полей, MobX запустит только одно обновление зависимых вычислений.

```tsx
import { makeAutoObservable, action, runInAction } from 'mobx';

class CartStore {
  items: Array<{ id: number; name: string; price: number; quantity: number }> = [];
  discount = 0;

  constructor() {
    makeAutoObservable(this);
  }

  // Простой action — метод класса автоматически становится action с makeAutoObservable
  addItem(id: number, name: string, price: number) {
    const existing = this.items.find(item => item.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ id, name, price, quantity: 1 });
    }
  }

  removeItem(id: number) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  setDiscount(discount: number) {
    this.discount = discount;
  }

  // Несколько изменений в одном action — только одно обновление
  applyPromoCode(code: string) {
    if (code === 'SAVE20') {
      this.discount = 20;
      // Можно изменять несколько полей — MobX обновит всё разом
    }
  }
}
```

#### action.bound — привязка контекста

Если вам нужно передать метод как колбэк, используйте `action.bound`:

```tsx
import { makeObservable, observable, action } from 'mobx';

class FormStore {
  value = '';

  constructor() {
    makeObservable(this, {
      value: observable,
      // action.bound автоматически привязывает this
      handleChange: action.bound,
    });
  }

  // Можно передавать в обработчики событий напрямую
  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.value = event.target.value;
  }
}

const formStore = new FormStore();

// Безопасно использовать без .bind(formStore)
<input onChange={formStore.handleChange} value={formStore.value} />
```

#### runInAction — асинхронные операции

Для асинхронных операций изменения состояния нужно оборачивать в `runInAction`:

```tsx
import { makeAutoObservable, runInAction } from 'mobx';

class ProductStore {
  products: Product[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchProducts() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      // После await нужно использовать runInAction
      runInAction(() => {
        this.products = data;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = (error as Error).message;
        this.isLoading = false;
      });
    }
  }
}
```

### Computed — производные значения

`computed` — это значения, которые автоматически вычисляются из observable-данных. MobX кэширует их и пересчитывает только тогда, когда изменяются зависимые observable.

```tsx
import { makeAutoObservable, computed } from 'mobx';

class ShoppingStore {
  items: Array<{ name: string; price: number; quantity: number }> = [];
  taxRate = 0.2; // 20% НДС

  constructor() {
    makeAutoObservable(this);
  }

  // Computed — автоматически кэшируется
  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get tax() {
    return this.subtotal * this.taxRate;
  }

  get total() {
    return this.subtotal + this.tax;
  }

  get itemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  // Computed с фильтрацией
  get expensiveItems() {
    return this.items.filter(item => item.price > 1000);
  }
}

const store = new ShoppingStore();
store.items.push({ name: 'Ноутбук', price: 80000, quantity: 1 });
store.items.push({ name: 'Мышь', price: 2000, quantity: 2 });

// Computed вычисляются лениво и кэшируются
console.log(store.subtotal);   // 84000
console.log(store.tax);        // 16800
console.log(store.total);      // 100800
console.log(store.itemCount);  // 3
```

#### Продвинутое использование computed

```tsx
import { makeAutoObservable, computed } from 'mobx';

class FilteredListStore {
  items: Array<{ id: number; title: string; category: string; done: boolean }> = [];
  searchQuery = '';
  selectedCategory = 'all';
  showOnlyDone = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Computed с несколькими условиями фильтрации
  get filteredItems() {
    return this.items.filter(item => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());

      const matchesCategory =
        this.selectedCategory === 'all' ||
        item.category === this.selectedCategory;

      const matchesDone = !this.showOnlyDone || item.done;

      return matchesSearch && matchesCategory && matchesDone;
    });
  }

  // Computed на основе другого computed
  get groupedItems() {
    const groups: Record<string, typeof this.filteredItems> = {};
    for (const item of this.filteredItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }

  get totalCount() {
    return this.filteredItems.length;
  }
}
```

### Reaction — побочные эффекты

Reactions — это механизм выполнения побочных эффектов при изменении observable-данных. MobX предоставляет несколько функций для создания реакций.

#### autorun

`autorun` выполняется немедленно и затем при каждом изменении используемых внутри observable:

```tsx
import { observable, autorun, makeAutoObservable } from 'mobx';

class SettingsStore {
  theme: 'light' | 'dark' = 'light';
  language = 'ru';

  constructor() {
    makeAutoObservable(this);
  }
}

const settings = new SettingsStore();

// autorun запускается сразу и при каждом изменении theme или language
const dispose = autorun(() => {
  console.log(`Тема: ${settings.theme}, Язык: ${settings.language}`);
  // Сохраняем в localStorage при каждом изменении
  localStorage.setItem('theme', settings.theme);
  localStorage.setItem('language', settings.language);
});

settings.theme = 'dark';   // Выведет: "Тема: dark, Язык: ru"
settings.language = 'en';  // Выведет: "Тема: dark, Язык: en"

// Отписываемся когда нужно
dispose();
```

#### reaction

`reaction` — более гибкий вариант. Принимает два аргумента: функцию-наблюдатель (data function) и эффект. Эффект запускается только при изменении данных, а не сразу:

```tsx
import { reaction, makeAutoObservable } from 'mobx';

class AuthStore {
  user: { id: number; name: string } | null = null;
  token: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  login(user: { id: number; name: string }, token: string) {
    this.user = user;
    this.token = token;
  }

  logout() {
    this.user = null;
    this.token = null;
  }
}

const authStore = new AuthStore();

// Реагируем только на изменение token, не запускаемся сразу
const disposeAuth = reaction(
  // Data function: что отслеживать
  () => authStore.token,
  // Effect: что делать при изменении
  (token) => {
    if (token) {
      // Устанавливаем токен в заголовки API при логине
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Убираем токен при логауте
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }
);

// reaction с опциями
const disposeRouter = reaction(
  () => authStore.user,
  (user) => {
    if (!user) {
      router.push('/login');
    }
  },
  {
    fireImmediately: false, // не запускать сразу (по умолчанию)
    delay: 300,             // дебаунс в мс
  }
);
```

#### when

`when` ждёт, пока условие станет истинным, и выполняет действие один раз:

```tsx
import { when, makeAutoObservable } from 'mobx';

class DataStore {
  data: string[] = [];
  isLoaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadData() {
    // Симуляция загрузки
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.data = ['элемент 1', 'элемент 2', 'элемент 3'];
    this.isLoaded = true;
  }
}

const dataStore = new DataStore();

// when возвращает Promise — ждём загрузки данных
async function processAfterLoad() {
  await when(() => dataStore.isLoaded);
  console.log('Данные загружены:', dataStore.data);
}

// Или с колбэком
when(
  () => dataStore.isLoaded,
  () => {
    console.log('Данные готовы, начинаем обработку');
  }
);

dataStore.loadData();
```

## Интеграция с React

### observer — HOC для реактивных компонентов

`observer` из `mobx-react-lite` — это высший компонент порядка (HOC), который делает функциональный компонент реактивным. Компонент, обёрнутый в `observer`, автоматически перерендеривается при изменении используемых внутри него observable-значений.

```tsx
import { observer } from 'mobx-react-lite';
import { makeAutoObservable } from 'mobx';

class CounterStore {
  value = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() { this.value++; }
  decrement() { this.value--; }
  reset() { this.value = 0; }
}

const counterStore = new CounterStore();

// Оборачиваем компонент в observer
const Counter = observer(() => {
  return (
    <div>
      <h2>Счётчик: {counterStore.value}</h2>
      <button onClick={() => counterStore.increment()}>+</button>
      <button onClick={() => counterStore.decrement()}>-</button>
      <button onClick={() => counterStore.reset()}>Сбросить</button>
    </div>
  );
});

// Дочерний компонент тоже должен быть observer, если использует observable
const CounterDisplay = observer(({ store }: { store: CounterStore }) => {
  return <span>{store.value}</span>;
});
```

### React Context для передачи стора

Наиболее распространённый паттерн — использование React Context для передачи сторов в дерево компонентов:

```tsx
import React, { createContext, useContext } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

// Определяем сторы
class UserStore {
  name = '';
  email = '';
  isLoggedIn = false;

  constructor() {
    makeAutoObservable(this);
  }

  login(name: string, email: string) {
    this.name = name;
    this.email = email;
    this.isLoggedIn = true;
  }

  logout() {
    this.name = '';
    this.email = '';
    this.isLoggedIn = false;
  }
}

class NotificationStore {
  messages: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  add(message: string) {
    this.messages.push(message);
  }

  remove(index: number) {
    this.messages.splice(index, 1);
  }
}

// Корневой стор, объединяющий все сторы
class RootStore {
  userStore: UserStore;
  notificationStore: NotificationStore;

  constructor() {
    this.userStore = new UserStore();
    this.notificationStore = new NotificationStore();
  }
}

// Создаём контекст
const StoreContext = createContext<RootStore | null>(null);

// Хук для использования стора
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore должен использоваться внутри StoreProvider');
  }
  return store;
}

// Провайдер
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = React.useMemo(() => new RootStore(), []);

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

// Использование в компонентах
const UserProfile = observer(() => {
  const { userStore, notificationStore } = useStore();

  const handleLogout = () => {
    userStore.logout();
    notificationStore.add('Вы вышли из системы');
  };

  if (!userStore.isLoggedIn) {
    return <p>Войдите в систему</p>;
  }

  return (
    <div>
      <h2>Привет, {userStore.name}!</h2>
      <p>{userStore.email}</p>
      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
});

// В корневом компоненте
function App() {
  return (
    <StoreProvider>
      <UserProfile />
    </StoreProvider>
  );
}
```

### useLocalObservable — локальное состояние

Для локального состояния компонента используйте `useLocalObservable`:

```tsx
import { useLocalObservable, observer } from 'mobx-react-lite';

// Локальный стор внутри компонента — аналог useState, но реактивный
const SearchInput = observer(() => {
  const state = useLocalObservable(() => ({
    query: '',
    results: [] as string[],
    isSearching: false,

    setQuery(query: string) {
      this.query = query;
    },

    async search() {
      if (!this.query) return;
      this.isSearching = true;
      try {
        const response = await fetch(`/api/search?q=${this.query}`);
        const data = await response.json();
        // runInAction не нужен, так как используем makeAutoObservable
        this.results = data.results;
      } finally {
        this.isSearching = false;
      }
    },

    get hasResults() {
      return this.results.length > 0;
    },
  }));

  return (
    <div>
      <input
        value={state.query}
        onChange={e => state.setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <button onClick={() => state.search()} disabled={state.isSearching}>
        {state.isSearching ? 'Ищу...' : 'Найти'}
      </button>

      {state.hasResults && (
        <ul>
          {state.results.map((result, i) => (
            <li key={i}>{result}</li>
          ))}
        </ul>
      )}
    </div>
  );
});
```

### Пример: полноценная форма с валидацией

```tsx
import { makeAutoObservable, computed } from 'mobx';
import { observer } from 'mobx-react-lite';

class RegistrationFormStore {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;
  submitError: string | null = null;
  isSubmitted = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Геттеры для полей
  setFirstName(value: string) { this.firstName = value; }
  setLastName(value: string) { this.lastName = value; }
  setEmail(value: string) { this.email = value; }
  setPassword(value: string) { this.password = value; }
  setConfirmPassword(value: string) { this.confirmPassword = value; }

  // Computed — ошибки валидации
  get firstNameError() {
    if (!this.firstName) return 'Введите имя';
    if (this.firstName.length < 2) return 'Имя слишком короткое';
    return null;
  }

  get emailError() {
    if (!this.email) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) return 'Неверный формат email';
    return null;
  }

  get passwordError() {
    if (!this.password) return 'Введите пароль';
    if (this.password.length < 8) return 'Пароль минимум 8 символов';
    return null;
  }

  get confirmPasswordError() {
    if (!this.confirmPassword) return 'Подтвердите пароль';
    if (this.password !== this.confirmPassword) return 'Пароли не совпадают';
    return null;
  }

  get isValid() {
    return (
      !this.firstNameError &&
      !this.emailError &&
      !this.passwordError &&
      !this.confirmPasswordError
    );
  }

  async submit() {
    if (!this.isValid) return;

    this.isSubmitting = true;
    this.submitError = null;

    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          password: this.password,
        }),
      });

      runInAction(() => {
        this.isSubmitted = true;
        this.isSubmitting = false;
      });
    } catch (error) {
      runInAction(() => {
        this.submitError = 'Произошла ошибка при регистрации';
        this.isSubmitting = false;
      });
    }
  }
}

// Компонент формы
const RegistrationForm = observer(() => {
  const form = React.useMemo(() => new RegistrationFormStore(), []);

  if (form.isSubmitted) {
    return <div>Регистрация успешна!</div>;
  }

  return (
    <form onSubmit={e => { e.preventDefault(); form.submit(); }}>
      <div>
        <input
          value={form.firstName}
          onChange={e => form.setFirstName(e.target.value)}
          placeholder="Имя"
        />
        {form.firstNameError && <span>{form.firstNameError}</span>}
      </div>

      <div>
        <input
          value={form.email}
          onChange={e => form.setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        {form.emailError && <span>{form.emailError}</span>}
      </div>

      <div>
        <input
          value={form.password}
          onChange={e => form.setPassword(e.target.value)}
          placeholder="Пароль"
          type="password"
        />
        {form.passwordError && <span>{form.passwordError}</span>}
      </div>

      <div>
        <input
          value={form.confirmPassword}
          onChange={e => form.setConfirmPassword(e.target.value)}
          placeholder="Подтвердите пароль"
          type="password"
        />
        {form.confirmPasswordError && <span>{form.confirmPasswordError}</span>}
      </div>

      {form.submitError && <div>{form.submitError}</div>}

      <button type="submit" disabled={!form.isValid || form.isSubmitting}>
        {form.isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
});
```

## MobX с TypeScript

MobX отлично работает с TypeScript. Вот рекомендуемые паттерны:

### Типизация сторов

```tsx
import { makeAutoObservable, ObservableMap } from 'mobx';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

class StoreWithTypes {
  // Типизированные observable
  products: Product[] = [];
  cart: CartItem[] = [];
  selectedProductId: number | null = null;

  // ObservableMap для словарей
  productCache = new Map<number, Product>();

  constructor() {
    makeAutoObservable(this);
  }

  get selectedProduct(): Product | undefined {
    if (this.selectedProductId === null) return undefined;
    return this.products.find(p => p.id === this.selectedProductId);
  }

  get cartTotal(): number {
    return this.cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  addToCart(product: Product): void {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  selectProduct(id: number | null): void {
    this.selectedProductId = id;
  }
}
```

### Абстрактный базовый класс для сторов

```tsx
import { makeAutoObservable } from 'mobx';

abstract class BaseStore {
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  protected setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  protected setError(error: string | null) {
    this.error = error;
  }

  protected async executeAsync<T>(fn: () => Promise<T>): Promise<T | null> {
    this.setLoading(true);
    this.setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      runInAction(() => {
        this.setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      });
      return null;
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }
}

class ArticleStore extends BaseStore {
  articles: Article[] = [];

  async loadArticles() {
    await this.executeAsync(async () => {
      const response = await fetch('/api/articles');
      const data = await response.json();
      runInAction(() => {
        this.articles = data;
      });
    });
  }
}
```

## Сравнение с Redux

MobX и Redux — два самых популярных решения для управления состоянием в React. Давайте сравним их по ключевым параметрам.

### Философия и подход

| Аспект | MobX | Redux |
|--------|------|-------|
| Парадигма | Реактивное, ООП | Функциональное, иммутабельное |
| Изменение состояния | Мутация напрямую | Через чистые редьюсеры |
| Шаблонный код | Минимум | Значительный (action types, reducers, selectors) |
| Кривая обучения | Пологая | Крутая |
| Отладка | Хуже (из-за магии) | Лучше (time-travel debugging) |
| DevTools | Есть, но проще | Мощные Redux DevTools |

### Пример одной и той же логики

**Задача:** корзина покупок с товарами и подсчётом итога.

**MobX:**

```tsx
import { makeAutoObservable } from 'mobx';

class CartStore {
  items: CartItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get total() {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  addItem(item: CartItem) {
    this.items.push(item);
  }

  removeItem(id: number) {
    this.items = this.items.filter(i => i.id !== id);
  }
}
```

**Redux Toolkit (RTK):**

```tsx
import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';

interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; }

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] } as CartState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      state.items.push(action.payload);
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
});

// Selector
const selectTotal = createSelector(
  (state: RootState) => state.cart.items,
  (items) => items.reduce((sum, item) => sum + item.price * item.qty, 0)
);

export const { addItem, removeItem } = cartSlice.actions;
```

### Когда выбрать MobX, а когда Redux

**Выбирайте MobX, если:**
- Нужен быстрый старт с минимумом кода
- Команда привыкла к ООП-стилю
- Состояние сложное и нелинейное (много взаимозависимостей)
- Приоритет — скорость разработки
- Важна производительность (гранулярные обновления)

**Выбирайте Redux, если:**
- Нужна максимальная предсказуемость и отлаживаемость
- Важен time-travel debugging
- Большая команда, важна стандартизация кода
- Уже используете Redux в других проектах
- Нужны мощные middleware (redux-saga, redux-thunk)

### Сравнение с Context API

MobX выигрывает у Context API в производительности: Context перерендеривает всех подписчиков при каждом изменении, тогда как MobX обновляет только компоненты, использующие изменённые данные.

```tsx
// Context: все Consumer перерендерятся при изменении ЛЮБОГО поля
const ThemeContext = createContext({ color: 'red', size: 'medium' });

// MobX: перерендерится только компонент, использующий изменённое поле
class ThemeStore {
  color = 'red';
  size = 'medium';
  constructor() { makeAutoObservable(this); }
}
```

## Продвинутые паттерны

### Interceptors и observe

MobX предоставляет низкоуровневые API для перехвата изменений:

```tsx
import { observe, intercept, makeAutoObservable } from 'mobx';

class AuditedStore {
  value = '';

  constructor() {
    makeAutoObservable(this);

    // Перехватываем изменения до их применения
    intercept(this, 'value', (change) => {
      console.log(`Попытка изменить value: ${change.newValue}`);
      // Можно отменить изменение, вернув null
      if (change.newValue.includes('запрещено')) {
        return null; // Отменяем изменение
      }
      return change; // Применяем изменение
    });

    // Наблюдаем за изменениями после их применения
    observe(this, 'value', (change) => {
      console.log(`value изменился: ${change.oldValue} → ${change.newValue}`);
    });
  }

  setValue(v: string) {
    this.value = v;
  }
}
```

### Ленивые вычисления и keepAlive

По умолчанию computed-значения пересчитываются только при наличии подписчиков. Иногда нужно держать их "живыми":

```tsx
import { computed, makeObservable, observable } from 'mobx';

class CachedStore {
  data: number[] = [];

  constructor() {
    makeObservable(this, {
      data: observable,
      // keepAlive: true - значение не удаляется из кэша когда нет подписчиков
      expensiveResult: computed({ keepAlive: true }),
    });
  }

  get expensiveResult() {
    // Дорогостоящее вычисление всегда будет закэшировано
    return this.data.reduce((acc, val) => acc + Math.sqrt(val), 0);
  }
}
```

### Реакции в хуках

```tsx
import { useEffect } from 'react';
import { autorun, reaction } from 'mobx';

// Хук для использования autorun в компонентах
function useAutorun(fn: () => void) {
  useEffect(() => {
    const dispose = autorun(fn);
    return dispose; // Очистка при размонтировании
  }, []);
}

// Хук для использования reaction в компонентах
function useReaction<T>(
  dataFn: () => T,
  effectFn: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const dispose = reaction(dataFn, effectFn);
    return dispose;
  }, deps);
}

// Использование
const MyComponent = observer(() => {
  const { userStore } = useStore();

  // Синхронизируем title страницы с именем пользователя
  useAutorun(() => {
    document.title = userStore.isLoggedIn
      ? `Привет, ${userStore.name}!`
      : 'Войдите в систему';
  });

  // Отправляем аналитику при смене страницы
  useReaction(
    () => userStore.currentPage,
    (page) => {
      analytics.track('page_view', { page });
    }
  );

  return <div>...</div>;
});
```

### Паттерн "Стор магазина" (Domain Store)

```tsx
import { makeAutoObservable, runInAction } from 'mobx';

// Отдельный домейн-стор для управления данными
class PostStore {
  posts: Map<number, Post> = new Map();
  isLoading = false;
  hasMore = true;
  page = 1;

  constructor(private api: ApiClient) {
    makeAutoObservable(this);
  }

  get allPosts() {
    return Array.from(this.posts.values());
  }

  get sortedPosts() {
    return this.allPosts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPost(id: number) {
    return this.posts.get(id);
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    try {
      const newPosts = await this.api.getPosts({ page: this.page });
      runInAction(() => {
        newPosts.forEach(post => this.posts.set(post.id, post));
        this.hasMore = newPosts.length > 0;
        this.page++;
        this.isLoading = false;
      });
    } catch {
      runInAction(() => { this.isLoading = false; });
    }
  }

  async createPost(data: CreatePostDto) {
    const post = await this.api.createPost(data);
    runInAction(() => {
      this.posts.set(post.id, post);
    });
    return post;
  }

  async deletePost(id: number) {
    await this.api.deletePost(id);
    runInAction(() => {
      this.posts.delete(id);
    });
  }
}
```

## Best Practices

### 1. Используйте makeAutoObservable

Предпочитайте `makeAutoObservable` вместо ручного указания аннотаций — это уменьшает количество кода и риск ошибок:

```tsx
// Хорошо — автоматически определяет типы
class Store {
  count = 0;
  get doubled() { return this.count * 2; }
  increment() { this.count++; }

  constructor() {
    makeAutoObservable(this);
  }
}

// Избыточно — явное указание того, что MobX и так определит
class Store {
  count = 0;
  constructor() {
    makeObservable(this, {
      count: observable,
      doubled: computed,
      increment: action,
    });
  }
}
```

### 2. Не забывайте observer для компонентов

Каждый компонент, читающий observable, **должен** быть обёрнут в `observer`:

```tsx
// Ошибка: компонент не перерендерится при изменении store.count
const BadCounter = () => <div>{store.count}</div>;

// Правильно: компонент реагирует на изменения
const GoodCounter = observer(() => <div>{store.count}</div>);
```

### 3. Оборачивайте изменения после await в runInAction

```tsx
class Store {
  data = null;

  async fetchData() {
    const result = await fetch('/api/data');
    // Ошибка: изменение состояния вне action после await
    this.data = await result.json(); // В строгом режиме выбросит ошибку

    // Правильно:
    runInAction(() => {
      this.data = await result.json();
    });
  }
}
```

### 4. Используйте computed для производных данных

Не вычисляйте производные данные в render-методах компонентов — выносите их в computed:

```tsx
// Плохо: вычисление в компоненте, нет кэширования
const Component = observer(() => {
  // Пересчитывается при каждом рендере
  const total = store.items.reduce((sum, item) => sum + item.price, 0);
  return <div>{total}</div>;
});

// Хорошо: computed кэшируется и пересчитывается только при изменении items
class Store {
  items: Item[] = [];
  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}
const Component = observer(() => <div>{store.total}</div>);
```

### 5. Не передавайте observable напрямую в компоненты без observer

```tsx
// Проблема: rawData — observable массив, но компонент не обёрнут в observer
function ItemList({ items }: { items: Item[] }) {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// Лучше: компонент-получатель тоже observer
const ItemList = observer(({ items }: { items: Item[] }) => {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
});
```

### 6. Структурируйте сторы по доменам

```
stores/
  RootStore.ts      # Корневой стор, объединяет все
  UserStore.ts      # Данные пользователя
  ProductStore.ts   # Каталог продуктов
  CartStore.ts      # Корзина
  UIStore.ts        # UI-состояние (модалки, уведомления)
```

### 7. Включайте строгий режим в разработке

```tsx
import { configure } from 'mobx';

// В development-режиме
configure({
  enforceActions: 'always', // Все изменения только через action
  computedRequiresReaction: true, // Computed только внутри реактивного контекста
  reactionRequiresObservable: true, // Реакции только на observable
  observableRequiresReaction: true, // Предупреждения о non-reactive доступе
  disableErrorBoundaries: false,
});
```

### 8. Тестирование сторов

Сторы MobX легко тестировать — они просто классы с методами:

```tsx
import { makeAutoObservable } from 'mobx';

class CounterStore {
  count = 0;
  constructor() { makeAutoObservable(this); }
  increment() { this.count++; }
  decrement() { this.count--; }
  reset() { this.count = 0; }
}

// Тесты
describe('CounterStore', () => {
  let store: CounterStore;

  beforeEach(() => {
    store = new CounterStore();
  });

  test('начальное значение 0', () => {
    expect(store.count).toBe(0);
  });

  test('increment увеличивает счётчик', () => {
    store.increment();
    expect(store.count).toBe(1);
  });

  test('reset сбрасывает счётчик', () => {
    store.increment();
    store.increment();
    store.reset();
    expect(store.count).toBe(0);
  });
});
```

## Когда использовать MobX

### MobX подходит, если:

1. **Сложная доменная логика** — много взаимозависимых данных, которые нужно синхронизировать. MobX автоматически отслеживает зависимости.

2. **Быстрое прототипирование** — меньше кода, быстрее можно создать рабочий прототип.

3. **ООП-ориентированная команда** — разработчики из мира Java, C#, Python, привыкшие к классам и мутабельному состоянию.

4. **Производительность** — гранулярные обновления означают, что рендерится только то, что реально изменилось.

5. **Формы с валидацией** — computed-значения идеально подходят для вычисления состояния валидности форм.

6. **Реальное время** — данные часто обновляются (чаты, биржевые котировки, мониторинг).

### MobX менее подходит, если:

1. **Нужен time-travel debugging** — история изменений важна для отладки (Redux DevTools с перемоткой времени).

2. **Строгая предсказуемость** — важно видеть каждое изменение как явный action с типом.

3. **Большая команда с разным уровнем** — "магия" MobX сложнее для джуниоров, чем явные Redux-паттерны.

4. **Функциональный стиль** — если команда предпочитает FP и иммутабельность.

5. **Уже использует Redux** — нет смысла смешивать два стора в одном проекте.

## Итоги

MobX — мощная и элегантная библиотека для управления состоянием в React-приложениях. Её реактивная модель позволяет писать меньше кода, при этом получая высокую производительность и автоматическую синхронизацию между состоянием и UI.

**Ключевые концепции:**
- `observable` — помечает данные как отслеживаемые
- `action` — описывает изменения состояния, обеспечивает батчинг
- `computed` — производные значения с автоматическим кэшированием
- `reaction/autorun/when` — побочные эффекты при изменении состояния
- `observer` — делает React-компоненты реактивными

**Основные паттерны:**
- Класс + `makeAutoObservable` — стандартный способ создания стора
- React Context — для передачи сторов в дерево компонентов
- `useLocalObservable` — для локального состояния компонента
- `runInAction` — для изменений после await

MobX не заменяет Redux и не является универсальным решением. Но для многих проектов, особенно с богатой доменной логикой и частыми обновлениями данных, MobX предлагает значительно лучший опыт разработки при той же или лучшей производительности.
