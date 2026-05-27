---
metaTitle: "JavaScript Proxy и Reflect — перехват операций с объектами"
metaDescription: "Разбираем JavaScript Proxy и Reflect: как перехватывать операции с объектами, валидировать данные, логировать доступ и строить реактивные системы."
author: "Антон Ларичев"
title: "JavaScript Proxy и Reflect"
preview: "Proxy и Reflect — мощные инструменты для перехвата и управления операциями с объектами в JavaScript."
---

## Что такое Proxy

Proxy — это обёртка вокруг объекта, которая позволяет перехватывать и переопределять фундаментальные операции: чтение свойств, запись, удаление, проверку наличия и многое другое. Вместо того чтобы работать с объектом напрямую, вы работаете с его прокси, который может изменять поведение на лету.

Концепция проста: есть целевой объект (target) и обработчик (handler) с набором ловушек (traps). Каждая ловушка — это метод, который вызывается вместо стандартной операции.

```javascript
const target = { name: 'Alice', age: 30 };

const handler = {
  get(target, property) {
    console.log(`Читаем свойство: ${property}`);
    return target[property];
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.name); // Читаем свойство: name → Alice
console.log(proxy.age);  // Читаем свойство: age → 30
```

## Синтаксис и базовая структура

Конструктор `Proxy` принимает два аргумента:

```javascript
const proxy = new Proxy(target, handler);
```

- **target** — любой объект, массив, функция или даже другой прокси
- **handler** — объект, методы которого определяют поведение прокси

Если handler пустой, прокси просто пропускает все операции к целевому объекту без изменений:

```javascript
const obj = { value: 42 };
const proxy = new Proxy(obj, {});

console.log(proxy.value); // 42 — прозрачный прокси
```

## Основные ловушки (traps)

### get — перехват чтения свойств

Ловушка `get` срабатывает при обращении к свойству объекта.

```javascript
const defaults = new Proxy({}, {
  get(target, property) {
    return property in target ? target[property] : `Свойство "${property}" не найдено`;
  }
});

defaults.username = 'Bob';
console.log(defaults.username); // Bob
console.log(defaults.email);    // Свойство "email" не найдено
```

Практический пример — ленивая загрузка данных:

```javascript
function createLazyLoader(fetchFn) {
  const cache = {};

  return new Proxy({}, {
    get(target, property) {
      if (!(property in cache)) {
        cache[property] = fetchFn(property);
      }
      return cache[property];
    }
  });
}

const api = createLazyLoader((key) => `Fetched: ${key}`);
console.log(api.users);    // Fetched: users
console.log(api.users);    // Fetched: users (из кэша)
console.log(api.products); // Fetched: products
```

### set — перехват записи свойств

Ловушка `set` позволяет контролировать, какие значения можно присваивать свойствам. Метод должен возвращать `true` при успехе, иначе будет выброшен `TypeError`.

```javascript
const validator = new Proxy({}, {
  set(target, property, value) {
    if (property === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('Возраст должен быть числом');
      }
      if (value < 0 || value > 150) {
        throw new RangeError('Возраст должен быть от 0 до 150');
      }
    }
    target[property] = value;
    return true;
  }
});

validator.name = 'Charlie'; // OK
validator.age = 25;         // OK
validator.age = -5;         // RangeError: Возраст должен быть от 0 до 150
validator.age = 'old';      // TypeError: Возраст должен быть числом
```

### has — перехват оператора in

Ловушка `has` срабатывает при проверке `property in proxy`.

```javascript
const range = new Proxy({ min: 1, max: 100 }, {
  has(target, property) {
    const num = Number(property);
    return num >= target.min && num <= target.max;
  }
});

console.log(50 in range);  // true
console.log(0 in range);   // false
console.log(101 in range); // false
```

### deleteProperty — перехват удаления

```javascript
const protected = new Proxy({ id: 1, name: 'Admin', temp: 'data' }, {
  deleteProperty(target, property) {
    if (property === 'id' || property === 'name') {
      throw new Error(`Нельзя удалить защищённое свойство: ${property}`);
    }
    delete target[property];
    return true;
  }
});

delete protected.temp;  // OK
delete protected.id;    // Error: Нельзя удалить защищённое свойство: id
```

### apply — перехват вызова функции

Ловушка `apply` работает, если target является функцией:

```javascript
function sum(a, b) {
  return a + b;
}

const loggedSum = new Proxy(sum, {
  apply(target, thisArg, args) {
    console.log(`Вызов с аргументами: ${args}`);
    const result = target.apply(thisArg, args);
    console.log(`Результат: ${result}`);
    return result;
  }
});

loggedSum(3, 4);
// Вызов с аргументами: 3,4
// Результат: 7
```

### construct — перехват оператора new

```javascript
function User(name, role) {
  this.name = name;
  this.role = role;
}

const SafeUser = new Proxy(User, {
  construct(target, args) {
    const [name, role] = args;
    if (!['admin', 'user', 'guest'].includes(role)) {
      throw new Error(`Недопустимая роль: ${role}`);
    }
    return new target(name, role);
  }
});

const u1 = new SafeUser('Alice', 'admin'); // OK
const u2 = new SafeUser('Bob', 'superuser'); // Error: Недопустимая роль: superuser
```

## Reflect API

`Reflect` — это встроенный объект, методы которого соответствуют каждой ловушке Proxy. Он предоставляет стандартные реализации операций, которые можно вызывать внутри ловушек.

### Зачем нужен Reflect

Внутри ловушки Proxy нельзя просто обратиться к `target[property]` в сложных сценариях — это может нарушить инварианты прокси или привести к рекурсии. `Reflect` даёт правильный способ выполнить операцию «по умолчанию»:

```javascript
const handler = {
  get(target, property, receiver) {
    console.log(`get: ${property}`);
    // Reflect.get корректно обрабатывает prototype chain и receiver
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(`set: ${property} = ${value}`);
    return Reflect.set(target, property, value, receiver);
  }
};

const proxy = new Proxy({ x: 1 }, handler);
proxy.x;     // get: x
proxy.y = 2; // set: y = 2
```

### Методы Reflect

Каждый метод Reflect соответствует одной ловушке:

```javascript
const obj = { a: 1 };

Reflect.get(obj, 'a');          // 1 — аналог obj.a
Reflect.set(obj, 'b', 2);       // true — аналог obj.b = 2
Reflect.has(obj, 'a');          // true — аналог 'a' in obj
Reflect.deleteProperty(obj, 'a'); // true — аналог delete obj.a
Reflect.ownKeys(obj);           // ['b'] — аналог Object.getOwnPropertyNames + Symbols

function greet(name) { return `Hello, ${name}`; }
Reflect.apply(greet, null, ['World']); // Hello, World
```

### Reflect vs прямые операции

Главное преимущество Reflect — возврат булевых значений вместо исключений для операций, которые могут провалиться:

```javascript
// Прямое удаление бросает исключение при строгом режиме
// если свойство не configurable
try {
  delete Object.freeze({}).prop; // В strict режиме — TypeError
} catch (e) {
  console.log(e.message);
}

// Reflect возвращает false без исключения
const frozen = Object.freeze({ prop: 1 });
console.log(Reflect.deleteProperty(frozen, 'prop')); // false — спокойно
```

## Практические применения

### Логирование и аудит

```javascript
function createAuditProxy(target, logger = console.log) {
  return new Proxy(target, {
    get(t, prop, receiver) {
      logger(`[READ] ${String(prop)}`);
      return Reflect.get(t, prop, receiver);
    },
    set(t, prop, value, receiver) {
      logger(`[WRITE] ${String(prop)} = ${JSON.stringify(value)}`);
      return Reflect.set(t, prop, value, receiver);
    },
    deleteProperty(t, prop) {
      logger(`[DELETE] ${String(prop)}`);
      return Reflect.deleteProperty(t, prop);
    }
  });
}

const config = createAuditProxy({ debug: false, version: '1.0' });
config.debug;        // [READ] debug
config.debug = true; // [WRITE] debug = true
delete config.debug; // [DELETE] debug
```

### Реактивная система данных

Прокси лежат в основе реактивности во Vue 3:

```javascript
function reactive(target, onChange) {
  return new Proxy(target, {
    set(t, prop, value, receiver) {
      const oldValue = t[prop];
      const result = Reflect.set(t, prop, value, receiver);
      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      return result;
    }
  });
}

const state = reactive(
  { count: 0, name: 'App' },
  (prop, newVal, oldVal) => {
    console.log(`${prop}: ${oldVal} → ${newVal}`);
    // Здесь можно перерисовать UI
  }
);

state.count = 1; // count: 0 → 1
state.count = 1; // Нет вывода — значение не изменилось
state.name = 'MyApp'; // name: App → MyApp
```

### Валидация схемы объекта

```javascript
function createTypedObject(schema) {
  return new Proxy({}, {
    set(target, property, value) {
      if (!(property in schema)) {
        throw new Error(`Неизвестное свойство: ${property}`);
      }
      const expectedType = schema[property];
      if (typeof value !== expectedType) {
        throw new TypeError(
          `${property} должно быть ${expectedType}, получено ${typeof value}`
        );
      }
      return Reflect.set(target, property, value);
    }
  });
}

const user = createTypedObject({
  name: 'string',
  age: 'number',
  active: 'boolean'
});

user.name = 'Diana';  // OK
user.age = 28;        // OK
user.active = true;   // OK
user.age = '28';      // TypeError: age должно быть number, получено string
user.email = 'test';  // Error: Неизвестное свойство: email
```

### Отрицательные индексы для массивов

```javascript
function createArrayWithNegativeIndex(arr) {
  return new Proxy(arr, {
    get(target, property, receiver) {
      const index = Number(property);
      if (Number.isInteger(index) && index < 0) {
        return Reflect.get(target, target.length + index, receiver);
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

const arr = createArrayWithNegativeIndex([1, 2, 3, 4, 5]);
console.log(arr[-1]); // 5
console.log(arr[-2]); // 4
console.log(arr[0]);  // 1
```

## Ограничения и подводные камни

### Прокси не прозрачен для идентичности

```javascript
const target = {};
const proxy = new Proxy(target, {});

console.log(proxy === target); // false
console.log(proxy instanceof Object); // true
```

### Производительность

Каждый перехват добавляет накладные расходы. Если прокси используется в критически важных циклах, это может заметно замедлить работу. Применяйте прокси там, где гибкость важнее скорости.

### Встроенные объекты требуют особого внимания

Некоторые встроенные типы (Map, Set, WeakMap) хранят внутреннее состояние в слотах, недоступных через прокси. Для корректной работы нужно привязывать контекст:

```javascript
const map = new Map();
const proxy = new Proxy(map, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    // Методы Map требуют оригинальный this
    return typeof value === 'function' ? value.bind(target) : value;
  }
});

proxy.set('key', 'value'); // Работает корректно
console.log(proxy.get('key')); // value
```

### Отмена прокси

`Proxy.revocable` создаёт прокси, который можно отключить:

```javascript
const { proxy, revoke } = Proxy.revocable({ data: 'secret' }, {});

console.log(proxy.data); // secret

revoke();

try {
  console.log(proxy.data); // TypeError: Cannot perform 'get' on a revoked proxy
} catch (e) {
  console.log(e.message);
}
```

Это полезно для временного доступа к данным — после отзыва прокси становится полностью недоступным.

## Итог

Proxy и Reflect — это мощные метапрограммные инструменты JavaScript, которые открывают возможности для:

- валидации и контроля данных на уровне объекта
- логирования и аудита без изменения исходного кода
- реактивных систем (как это делает Vue 3)
- создания DSL и умных коллекций
- управления доступом и безопасности

Reflect дополняет Proxy, предоставляя стандартные реализации операций, которые корректно работают с цепочками прототипов и receiver-объектами — его стоит использовать внутри ловушек вместо прямых обращений к свойствам target.

Для глубокого изучения JavaScript и работы с объектами, прокси и другими продвинутыми концепциями языка — записывайтесь на курс [JavaScript для профессионалов на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=proxy-and-reflect).