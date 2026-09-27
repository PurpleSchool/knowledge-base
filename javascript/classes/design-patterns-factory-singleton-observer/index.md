---
metaTitle: "Паттерны Factory, Singleton, Observer в JavaScript"
metaDescription: "Разбираем три ключевых паттерна проектирования в JavaScript: Factory, Singleton и Observer — с примерами кода и практическими сценариями применения."
author: "Антон Ларичев"
title: "Паттерны проектирования в JavaScript: Factory, Singleton, Observer"
preview: "Практическое руководство по паттернам Factory, Singleton и Observer в JavaScript с примерами кода и сценариями применения."
---

Паттерны проектирования — это проверенные решения часто встречающихся задач в разработке программного обеспечения. В JavaScript три из них особенно востребованы на практике: **Factory**, **Singleton** и **Observer**. Каждый решает свою категорию задач: Factory управляет созданием объектов, Singleton гарантирует единственный экземпляр, Observer организует реактивное взаимодействие компонентов.

В этой статье разберём каждый паттерн с примерами кода, объясним, когда их применять и каких ошибок избегать.

## Factory (Фабрика)

### Что такое Factory

Паттерн Factory инкапсулирует логику создания объектов. Вместо того чтобы вызывать `new ConcreteClass()` напрямую в разных местах кода, вы делегируете это фабричной функции или классу. Это позволяет менять реализацию создания объектов централизованно, не затрагивая клиентский код.

Существует две основные разновидности:

- **Factory Function** — простая функция, возвращающая объект
- **Factory Method** — метод класса, определяющий интерфейс создания объектов, но позволяющий подклассам менять тип создаваемого объекта

### Factory Function

Самый распространённый вариант в JavaScript — обычная функция, которая создаёт и возвращает объект:

```javascript
function createUser(name, role) {
  return {
    name,
    role,
    createdAt: new Date(),
    greet() {
      return `Привет, я ${this.name} (${this.role})`;
    },
  };
}

const admin = createUser('Иван', 'admin');
const guest = createUser('Мария', 'guest');

console.log(admin.greet()); // Привет, я Иван (admin)
console.log(guest.greet()); // Привет, я Мария (guest)
```

Фабричная функция избавляет от необходимости помнить, какой именно класс нужно инстанциировать, и позволяет добавить логику инициализации в одном месте.

### Factory Method с классами

Когда создание объектов зависит от типа или условий, удобно использовать статический метод:

```javascript
class Transport {
  constructor(type, capacity) {
    this.type = type;
    this.capacity = capacity;
  }

  describe() {
    return `${this.type} вместимостью ${this.capacity} мест`;
  }

  static create(type) {
    const config = {
      car: { type: 'Автомобиль', capacity: 5 },
      bus: { type: 'Автобус', capacity: 50 },
      bike: { type: 'Велосипед', capacity: 1 },
    };

    const params = config[type];
    if (!params) {
      throw new Error(`Неизвестный тип транспорта: ${type}`);
    }

    return new Transport(params.type, params.capacity);
  }
}

const bus = Transport.create('bus');
console.log(bus.describe()); // Автобус вместимостью 50 мест

const car = Transport.create('car');
console.log(car.describe()); // Автомобиль вместимостью 5 мест
```

### Когда использовать Factory

- Когда точный тип создаваемого объекта определяется в рантайме
- Когда нужно централизовать и стандартизировать создание объектов
- Когда создание объекта требует сложной логики инициализации
- Когда вы хотите скрыть детали реализации от клиентского кода

### Практический пример: логгер с Factory

```javascript
function createLogger(level) {
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level] ?? '[LOG]';

  return {
    log(message) {
      console.log(`${prefix} ${new Date().toISOString()} — ${message}`);
    },
  };
}

const infoLogger = createLogger('info');
const errorLogger = createLogger('error');

infoLogger.log('Сервер запущен');   // [INFO] 2026-... — Сервер запущен
errorLogger.log('База недоступна'); // [ERROR] 2026-... — База недоступна
```

## Singleton (Одиночка)

### Что такое Singleton

Singleton гарантирует, что класс имеет только один экземпляр, и предоставляет глобальную точку доступа к нему. Повторный вызов конструктора или фабричного метода возвращает уже существующий экземпляр.

Этот паттерн часто используется для:

- Менеджера конфигурации приложения
- Подключения к базе данных
- Кеша в памяти
- Глобального хранилища состояния

### Реализация через замыкание

```javascript
const createConfigManager = (() => {
  let instance = null;

  return function () {
    if (instance) {
      return instance;
    }

    instance = {
      settings: {},
      set(key, value) {
        this.settings[key] = value;
      },
      get(key) {
        return this.settings[key];
      },
    };

    return instance;
  };
})();

const config1 = createConfigManager();
const config2 = createConfigManager();

config1.set('theme', 'dark');
console.log(config2.get('theme')); // dark
console.log(config1 === config2);  // true
```

Замыкание скрывает переменную `instance` — снаружи нет способа сбросить или подменить её напрямую.

### Реализация через ES6 класс

```javascript
class DatabaseConnection {
  static #instance = null;

  #connection = null;

  constructor(connectionString) {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }

    this.#connection = connectionString;
    DatabaseConnection.#instance = this;
  }

  query(sql) {
    return `Выполняю запрос [${sql}] через ${this.#connection}`;
  }

  static getInstance(connectionString) {
    if (!DatabaseConnection.#instance) {
      new DatabaseConnection(connectionString);
    }
    return DatabaseConnection.#instance;
  }
}

const db1 = DatabaseConnection.getInstance('postgres://localhost/app');
const db2 = DatabaseConnection.getInstance('postgres://other/db');

console.log(db1 === db2); // true
console.log(db1.query('SELECT * FROM users'));
// Выполняю запрос [SELECT * FROM users] через postgres://localhost/app
```

Приватные поля (`#instance`, `#connection`) через ES2022 обеспечивают настоящую инкапсуляцию — они недоступны извне класса.

### Синглтон через модуль ES6

В современном JavaScript самый простой Singleton — это модуль. Модули кешируются после первого импорта, поэтому экспортируемый объект всегда один:

```javascript
// store.js
const state = {
  user: null,
  theme: 'light',
  notifications: [],
};

export function getUser() {
  return state.user;
}

export function setUser(user) {
  state.user = user;
}

export function addNotification(message) {
  state.notifications.push({ message, createdAt: Date.now() });
}

export function getNotifications() {
  return [...state.notifications];
}
```

```javascript
// main.js
import { setUser, addNotification } from './store.js';

setUser({ id: 1, name: 'Иван' });
addNotification('Добро пожаловать!');
```

```javascript
// profile.js
import { getUser, getNotifications } from './store.js';

// Тот же объект state, что и в main.js
console.log(getUser()); // { id: 1, name: 'Иван' }
console.log(getNotifications()); // [{ message: 'Добро пожаловать!', ... }]
```

### Когда использовать Singleton

- Управление единственным подключением к внешнему ресурсу (БД, WebSocket)
- Глобальная конфигурация, читаемая из разных модулей
- Кеш, который должен быть общим для всего приложения
- Менеджер событий или шина событий

### Чего избегать

Singleton нередко называют антипаттерном. Причины:

- Скрытые зависимости — компоненты берут данные из глобального состояния, это усложняет тестирование
- Сложность тестирования — между тестами нужно явно сбрасывать состояние синглтона
- Проблемы с мультипоточностью — в Node.js в пределах одного процесса это не актуально, но важно при использовании Worker Threads

Применяйте Singleton осознанно и только там, где единственный экземпляр действительно оправдан.

## Observer (Наблюдатель)

### Что такое Observer

Паттерн Observer (также называемый Publish/Subscribe или EventEmitter) определяет зависимость «один ко многим» между объектами. Когда один объект (Publisher) меняет состояние, все зависимые объекты (Subscribers) автоматически уведомляются и обновляются.

Этот паттерн лежит в основе реактивного программирования, системы событий браузера (`addEventListener`), а также библиотек вроде RxJS.

### Базовая реализация EventEmitter

```javascript
class EventEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(listener);
    return this;
  }

  off(event, listener) {
    this.#listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach((listener) => listener(...args));
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}
```

Использование:

```javascript
const emitter = new EventEmitter();

function onLogin(user) {
  console.log(`Вошёл пользователь: ${user.name}`);
}

function onLoginAudit(user) {
  console.log(`Аудит: логин в ${new Date().toLocaleTimeString()}`);
}

emitter.on('login', onLogin);
emitter.on('login', onLoginAudit);

emitter.emit('login', { name: 'Иван', id: 42 });
// Вошёл пользователь: Иван
// Аудит: логин в 14:35:22

// Отписаться от одного обработчика
emitter.off('login', onLoginAudit);

emitter.emit('login', { name: 'Мария', id: 7 });
// Вошёл пользователь: Мария
```

### Observer для реактивного состояния

Паттерн Observer отлично подходит для создания реактивного хранилища данных:

```javascript
class Store {
  #state;
  #emitter = new EventEmitter();

  constructor(initialState) {
    this.#state = { ...initialState };
  }

  getState() {
    return { ...this.#state };
  }

  setState(partial) {
    const prevState = { ...this.#state };
    this.#state = { ...this.#state, ...partial };
    this.#emitter.emit('change', this.#state, prevState);
  }

  subscribe(listener) {
    this.#emitter.on('change', listener);
    return () => this.#emitter.off('change', listener);
  }
}

// Использование
const store = new Store({ count: 0, user: null });

const unsubscribe = store.subscribe((newState, prevState) => {
  console.log(`count: ${prevState.count} -> ${newState.count}`);
});

store.setState({ count: 1 }); // count: 0 -> 1
store.setState({ count: 5 }); // count: 1 -> 5

unsubscribe(); // отписались

store.setState({ count: 10 }); // тишина
```

Метод `subscribe` возвращает функцию отписки — стандартная идиома в React (`useEffect`) и RxJS (`.subscribe()` → `.unsubscribe()`).

### Практический пример: уведомления в интерфейсе

```javascript
class NotificationService extends EventEmitter {
  #queue = [];

  push(type, message) {
    const notification = { id: crypto.randomUUID(), type, message };
    this.#queue.push(notification);
    this.emit('add', notification);
    return this;
  }

  dismiss(id) {
    this.#queue = this.#queue.filter((n) => n.id !== id);
    this.emit('remove', id);
    return this;
  }

  getAll() {
    return [...this.#queue];
  }
}

const notifications = new NotificationService();

// Компонент Toast подписывается
notifications.on('add', ({ type, message }) => {
  console.log(`Toast [${type}]: ${message}`);
});

notifications.on('remove', (id) => {
  console.log(`Уведомление ${id} закрыто`);
});

const n = notifications.push('success', 'Данные сохранены');
// Toast [success]: Данные сохранены

notifications.dismiss(notifications.getAll()[0].id);
// Уведомление <uuid> закрыто
```

### Когда использовать Observer

- Реакция на события в разных частях приложения без прямой связи между модулями
- Обновление нескольких компонентов при изменении одного источника данных
- Реализация системы плагинов или хуков
- Декуплинг: издатель не знает о подписчиках

## Сравнение паттернов

| Паттерн   | Задача                              | Ключевая идея                                |
|-----------|-------------------------------------|----------------------------------------------|
| Factory   | Создание объектов                   | Инкапсулировать `new`, скрыть детали типа    |
| Singleton | Единственный экземпляр              | Вернуть один и тот же объект при любом вызове|
| Observer  | Связь «один ко многим»              | Подписчики реагируют на события издателя     |

Паттерны хорошо комбинируются. Часто Singleton реализуется через Factory Function, а Observer-шина событий оформляется как Singleton, доступный из любой точки приложения:

```javascript
// eventBus.js — Singleton + Observer
const eventBus = new EventEmitter();
export default eventBus;

// moduleA.js
import eventBus from './eventBus.js';
eventBus.emit('user:login', { id: 1 });

// moduleB.js
import eventBus from './eventBus.js';
eventBus.on('user:login', (user) => {
  console.log('Обновляю профиль для', user.id);
});
```

## Итоги

Factory, Singleton и Observer — три фундаментальных паттерна, покрывающих большинство задач по организации кода:

- **Factory** снижает связанность кода с конкретными классами и упрощает создание объектов с вариативной логикой
- **Singleton** полезен для ресурсов, которые должны существовать в единственном экземпляре, но требует осторожности из-за глобального состояния
- **Observer** обеспечивает реактивность и декуплинг — компоненты общаются через события, не зная друг о друге напрямую

Понимание этих паттернов помогает писать более структурированный и поддерживаемый JavaScript-код.

Если вы хотите углубиться в JavaScript и изучить продвинутые техники разработки, приходите на курс по JavaScript на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=design-patterns-factory-singleton-observer