---
metaTitle: "IndexedDB в JavaScript — хранение данных в браузере"
metaDescription: "Полное руководство по IndexedDB: открытие базы, транзакции, индексы, курсоры, миграции и практические примеры на JavaScript."
author: "Антон Ларичев"
title: "IndexedDB в JavaScript"
preview: "Как хранить большие объёмы структурированных данных прямо в браузере с помощью IndexedDB: транзакции, индексы и Promise-обёртки."
---

## Что такое IndexedDB

IndexedDB — это низкоуровневый браузерный API для хранения значительных объёмов структурированных данных, включая файлы и блобы. В отличие от `localStorage`, который хранит только строки и ограничен примерно 5 МБ, IndexedDB позволяет работать с полноценными JavaScript-объектами, поддерживает транзакции, индексы и асинхронный доступ.

Основные характеристики:

- Хранит пары ключ-значение, где значения — произвольные JavaScript-объекты
- Поддерживает транзакции для атомарных операций
- Работает асинхронно и не блокирует поток UI
- Поддерживает индексы для быстрого поиска по любому полю
- Лимит хранилища зависит от браузера и устройства (обычно от 50 МБ до нескольких ГБ)

## Основные концепции

### База данных

Каждый источник (origin) может иметь несколько баз данных. База данных идентифицируется именем и версией. При изменении структуры базы версию увеличивают.

### Хранилище объектов

Аналог таблицы в реляционной базе данных. Каждое хранилище содержит набор записей, доступных по ключу.

### Транзакция

Все операции выполняются в рамках транзакции. Транзакция обеспечивает атомарность: если одна операция завершится ошибкой, все изменения в рамках транзакции будут отменены.

### Индекс

Позволяет эффективно искать записи по любому полю, а не только по первичному ключу.

### Курсор

Механизм для поочерёдной итерации по записям хранилища с возможностью фильтрации.

## Открытие базы данных

Вся работа с IndexedDB начинается с открытия (или создания) базы данных:

```javascript
const request = indexedDB.open('myDatabase', 1);

request.onerror = (event) => {
  console.error('Ошибка открытия базы данных:', event.target.error);
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('База данных открыта успешно');
};

request.onupgradeneeded = (event) => {
  const db = event.target.result;

  const usersStore = db.createObjectStore('users', { keyPath: 'id' });
  usersStore.createIndex('name', 'name', { unique: false });
  usersStore.createIndex('email', 'email', { unique: true });
};
```

Событие `onupgradeneeded` срабатывает при первом создании базы данных или при увеличении её версии. Это единственное место, где разрешено создавать и изменять хранилища объектов и индексы.

## Добавление данных

Для записи данных нужна транзакция в режиме `readwrite`:

```javascript
function addUser(db, user) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.add(user);

    request.onsuccess = () => {
      resolve(request.result); // возвращает ключ добавленной записи
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Использование
addUser(db, { id: 1, name: 'Иван Петров', email: 'ivan@example.com', age: 30 });
addUser(db, { id: 2, name: 'Мария Сидорова', email: 'maria@example.com', age: 25 });
```

Метод `add` выбросит ошибку, если запись с таким ключом уже существует. Для обновления существующей записи используйте `put`.

## Чтение данных

### Получение записи по ключу

```javascript
function getUserById(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result); // undefined, если запись не найдена
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

getUserById(db, 1).then(user => {
  console.log('Найден пользователь:', user);
});
```

### Получение всех записей

```javascript
function getAllUsers(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
```

## Обновление данных

Метод `put` добавляет запись или полностью заменяет её, если запись с таким ключом уже существует:

```javascript
function updateUser(db, user) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

updateUser(db, { id: 1, name: 'Иван Петров', email: 'ivan@example.com', age: 31 });
```

## Удаление данных

```javascript
function deleteUser(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}
```

## Работа с индексами

Индексы позволяют искать записи не только по первичному ключу, но и по любому другому полю:

```javascript
function getUserByEmail(db, email) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('email');
    const request = index.get(email);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

getUserByEmail(db, 'ivan@example.com').then(user => {
  console.log('Пользователь по email:', user);
});
```

## Работа с курсором

Курсор позволяет итерировать по всем записям хранилища и применять произвольную фильтрацию:

```javascript
function getUsersOlderThan(db, minAge) {
  return new Promise((resolve, reject) => {
    const users = [];
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.age >= minAge) {
          users.push(cursor.value);
        }
        cursor.continue();
      } else {
        resolve(users);
      }
    };

    request.onerror = (event) => reject(event.target.error);
  });
}
```

### Диапазоны ключей с IDBKeyRange

Для поиска по диапазону значений используется `IDBKeyRange`:

```javascript
// Пользователи с возрастом от 20 до 35 лет (нужен индекс по полю age)
function getUsersByAgeRange(db, minAge, maxAge) {
  return new Promise((resolve, reject) => {
    const users = [];
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('age');

    // bound(lower, upper, lowerOpen, upperOpen)
    const range = IDBKeyRange.bound(minAge, maxAge);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        users.push(cursor.value);
        cursor.continue();
      } else {
        resolve(users);
      }
    };

    request.onerror = (event) => reject(event.target.error);
  });
}
```

Доступные методы `IDBKeyRange`:

- `IDBKeyRange.only(value)` — строгое совпадение
- `IDBKeyRange.lowerBound(value, open?)` — значения больше (или равные)
- `IDBKeyRange.upperBound(value, open?)` — значения меньше (или равные)
- `IDBKeyRange.bound(lower, upper, lowerOpen?, upperOpen?)` — значения в диапазоне

## Promise-обёртка над IndexedDB

Нативный API IndexedDB основан на событиях, что неудобно при работе с современным асинхронным кодом. Создадим универсальную обёртку:

```javascript
class DatabaseService {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  open(stores) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        stores.forEach(({ name, keyPath, autoIncrement = false, indexes = [] }) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath, autoIncrement });
            indexes.forEach(({ name: idxName, keyPath: idxKey, unique = false }) => {
              store.createIndex(idxName, idxKey, { unique });
            });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  add(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  put(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

// Использование
const dbService = new DatabaseService('appDB', 1);

await dbService.open([
  {
    name: 'users',
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'name', keyPath: 'name', unique: false }
    ]
  }
]);

await dbService.add('users', { id: 1, name: 'Алексей', email: 'alex@example.com' });
const user = await dbService.get('users', 1);
console.log(user); // { id: 1, name: 'Алексей', email: 'alex@example.com' }
```

## Миграции и версионирование

При изменении структуры базы данных нужно увеличивать версию и обрабатывать все миграции инкрементально:

```javascript
const request = indexedDB.open('myDatabase', 3);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  const transaction = event.target.transaction;

  if (oldVersion < 1) {
    // Первоначальная схема
    const store = db.createObjectStore('users', { keyPath: 'id' });
    store.createIndex('email', 'email', { unique: true });
  }

  if (oldVersion < 2) {
    // Добавляем индекс по имени
    const store = transaction.objectStore('users');
    store.createIndex('name', 'name', { unique: false });
  }

  if (oldVersion < 3) {
    // Добавляем новое хранилище для продуктов
    const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
    productsStore.createIndex('category', 'category', { unique: false });
  }
};
```

Порядок важен: каждый блок `if (oldVersion < N)` применяется только если база данных ещё не достигла этой версии. Так пользователь, обновляющийся с версии 1 сразу до версии 3, пройдёт все промежуточные миграции.

## Практический пример: офлайн-список задач

```javascript
class TodoApp {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await this.openDB();
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('todoDB', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('todos', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('completed', 'completed', { unique: false });
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  addTodo(text) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['todos'], 'readwrite');
      const store = tx.objectStore('todos');
      const request = store.add({
        text,
        completed: false,
        createdAt: Date.now()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  toggleTodo(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['todos'], 'readwrite');
      const store = tx.objectStore('todos');

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const todo = getReq.result;
        todo.completed = !todo.completed;
        const putReq = store.put(todo);
        putReq.onsuccess = () => resolve(todo);
        putReq.onerror = (e) => reject(e.target.error);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  getActiveTodos() {
    return new Promise((resolve, reject) => {
      const todos = [];
      const tx = this.db.transaction(['todos'], 'readonly');
      const store = tx.objectStore('todos');
      const index = store.index('completed');
      const request = index.openCursor(IDBKeyRange.only(false));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          todos.push(cursor.value);
          cursor.continue();
        } else {
          resolve(todos);
        }
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }
}

// Использование
const app = new TodoApp();
await app.init();

await app.addTodo('Изучить IndexedDB');
await app.addTodo('Написать PWA');

const active = await app.getActiveTodos();
console.log('Активных задач:', active.length);
```

## Когда использовать IndexedDB

IndexedDB подходит в следующих сценариях:

- **PWA и офлайн-режим**: данные доступны без подключения к сети
- **Большие объёмы данных**: сотни тысяч записей или файлы
- **Сложные запросы**: поиск и фильтрация по нескольким полям
- **Локальный кэш**: снижение нагрузки на сервер и ускорение интерфейса

Для небольших настроек и токенов достаточно `localStorage`. Для временного хранения в рамках одной вкладки используйте `sessionStorage`.

## Библиотеки для упрощения работы

Нативный IndexedDB API многословен. Популярные обёртки решают эту проблему:

- **idb** — тонкая Promise-обёртка от Jake Archibald, минимальный размер
- **Dexie.js** — полноценный ORM с реактивностью и живыми запросами
- **localForage** — единый API для IndexedDB, WebSQL и localStorage

```javascript
// Пример с библиотекой idb
import { openDB } from 'idb';

const db = await openDB('myDB', 1, {
  upgrade(db) {
    const store = db.createObjectStore('users', { keyPath: 'id' });
    store.createIndex('email', 'email', { unique: true });
  }
});

await db.put('users', { id: 1, name: 'Тест', email: 'test@example.com' });
const user = await db.get('users', 1);
console.log(user);

// С Dexie.js
import Dexie from 'dexie';

const db = new Dexie('myDatabase');
db.version(1).stores({
  users: '++id, name, email'
});

await db.users.add({ name: 'Тест', email: 'test@example.com' });
const allUsers = await db.users.toArray();
```

Для большинства проектов использование `idb` или `Dexie.js` предпочтительнее написания нативного кода вручную: они сокращают объём шаблонного кода и упрощают поддержку.

Чтобы освоить браузерные API и научиться строить современные веб-приложения, пройдите курс по JavaScript на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=indexeddb-javascript