---
metaTitle: "structuredClone в JavaScript — глубокое копирование объектов"
metaDescription: "Как работает structuredClone в JavaScript: глубокое копирование объектов, поддерживаемые типы, отличия от JSON.parse и spread-оператора."
author: "Антон Ларичев"
title: "structuredClone — глубокое копирование объектов в JavaScript"
preview: "structuredClone — нативный метод глубокого копирования объектов в JavaScript, появившийся в 2022 году. Разбираем как он работает и чем лучше аналогов."
---

## Что такое structuredClone

`structuredClone` — глобальная функция JavaScript, которая создаёт глубокую копию переданного значения. Она появилась в спецификации в 2022 году и сегодня поддерживается во всех современных браузерах и в Node.js начиная с версии 17.

До её появления разработчики годами использовали обходные решения: `JSON.parse(JSON.stringify(obj))`, библиотеки вроде Lodash, или писали рекурсивные функции копирования вручную. Каждый из этих способов имеет существенные ограничения. `structuredClone` решает большинство из них на уровне платформы.

## Синтаксис

```javascript
const clone = structuredClone(value);
const clone = structuredClone(value, { transfer: transferable });
```

- `value` — любое значение, которое нужно скопировать
- `transfer` — необязательный массив передаваемых объектов (Transferable), которые будут перемещены, а не скопированы

## Базовое использование

```javascript
const original = {
  name: 'Alice',
  address: {
    city: 'Moscow',
    zip: '101000'
  },
  tags: ['admin', 'user']
};

const clone = structuredClone(original);

clone.address.city = 'Saint Petersburg';
clone.tags.push('moderator');

console.log(original.address.city); // 'Moscow' — не изменился
console.log(original.tags);         // ['admin', 'user'] — не изменился
```

Вложенные объекты и массивы полностью независимы от оригинала. Это и отличает глубокое копирование от поверхностного.

## Поверхностное vs глубокое копирование

Чтобы понять ценность `structuredClone`, важно разобраться с разницей между двумя подходами.

### Поверхностное копирование

```javascript
const original = { a: 1, nested: { b: 2 } };

// Spread-оператор
const shallow1 = { ...original };

// Object.assign
const shallow2 = Object.assign({}, original);

shallow1.nested.b = 99;
console.log(original.nested.b); // 99 — оригинал изменился!
```

Spread и `Object.assign` копируют только верхний уровень. Вложенные объекты копируются по ссылке, поэтому изменение клона затрагивает оригинал.

### Глубокое копирование через structuredClone

```javascript
const original = { a: 1, nested: { b: 2 } };

const deep = structuredClone(original);

deep.nested.b = 99;
console.log(original.nested.b); // 2 — оригинал не изменился
```

## Поддерживаемые типы данных

`structuredClone` использует алгоритм структурированного клонирования (Structured Clone Algorithm), который поддерживает значительно больше типов, чем `JSON.parse/JSON.stringify`.

### Примитивы

```javascript
structuredClone(42);           // 42
structuredClone('hello');      // 'hello'
structuredClone(true);         // true
structuredClone(null);         // null
structuredClone(undefined);    // undefined
structuredClone(BigInt(9999)); // 9999n
```

Обратите внимание: `undefined` и `BigInt` поддерживаются, в отличие от `JSON.stringify`, который их теряет или выбрасывает ошибку.

### Специальные числовые значения

```javascript
structuredClone(NaN);       // NaN
structuredClone(Infinity);  // Infinity
structuredClone(-0);        // -0
```

Всё это `JSON.parse(JSON.stringify(...))` преобразует в `null` или теряет.

### Объекты-обёртки

```javascript
structuredClone(new Number(42));   // Number {42}
structuredClone(new String('hi')); // String {'hi'}
structuredClone(new Boolean(true));// Boolean {true}
```

### Дата

```javascript
const original = { createdAt: new Date('2024-01-15') };
const clone = structuredClone(original);

clone.createdAt.setFullYear(2030);
console.log(original.createdAt.getFullYear()); // 2024 — не изменился
```

При `JSON.stringify` дата превращается в строку и теряет тип `Date`.

### RegExp

```javascript
const original = { pattern: /\d+/gi };
const clone = structuredClone(original);

console.log(clone.pattern instanceof RegExp); // true
console.log(clone.pattern.flags);             // 'gi'
```

### Map и Set

```javascript
const original = {
  userMap: new Map([['alice', { role: 'admin' }]]),
  tagSet: new Set(['js', 'ts'])
};

const clone = structuredClone(original);

clone.userMap.get('alice').role = 'viewer';
clone.tagSet.add('node');

console.log(original.userMap.get('alice').role); // 'admin'
console.log(original.tagSet.size);               // 2
```

### ArrayBuffer и TypedArray

```javascript
const buffer = new ArrayBuffer(16);
const view = new Uint8Array(buffer);
view[0] = 255;

const clonedBuffer = structuredClone(buffer);
const clonedView = new Uint8Array(clonedBuffer);

clonedView[0] = 0;
console.log(view[0]); // 255 — оригинал не изменился
```

### Error

```javascript
const err = new TypeError('something went wrong');
const clone = structuredClone(err);

console.log(clone instanceof TypeError); // true
console.log(clone.message);              // 'something went wrong'
```

## Что structuredClone не поддерживает

Алгоритм намеренно не копирует некоторые типы. При попытке передать их будет выброшен `DataCloneError`.

### Функции

```javascript
const obj = { fn: () => 'hello' };

try {
  structuredClone(obj); // DataCloneError
} catch (e) {
  console.error(e.name); // 'DataCloneError'
}
```

Функции содержат замыкания и привязки к окружению, их копирование семантически бессмысленно.

### DOM-узлы

```javascript
try {
  structuredClone(document.body); // DataCloneError
} catch (e) {
  console.error(e.name); // 'DataCloneError'
}
```

### Symbol

```javascript
try {
  structuredClone(Symbol('id')); // DataCloneError
} catch (e) {
  console.error(e.name); // 'DataCloneError'
}
```

### Цепочка прототипов не сохраняется

Это важный нюанс. `structuredClone` не сохраняет пользовательский прототип:

```javascript
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `Hello, ${this.name}`;
  }
}

const user = new User('Bob');
const clone = structuredClone(user);

console.log(clone.name);           // 'Bob' — данные скопированы
console.log(clone instanceof User);// false — прототип потерян
console.log(clone.greet);          // undefined
```

Клон будет простым объектом `{}` с теми же свойствами, но без методов класса.

## Поддержка циклических ссылок

Одно из ключевых преимуществ перед `JSON.parse/JSON.stringify` — корректная обработка циклических ссылок:

```javascript
const obj = { name: 'circular' };
obj.self = obj; // циклическая ссылка

// JSON.stringify выбросит ошибку:
try {
  JSON.stringify(obj); // TypeError: Converting circular structure to JSON
} catch (e) {
  console.error(e.message);
}

// structuredClone справляется:
const clone = structuredClone(obj);
console.log(clone.name);       // 'circular'
console.log(clone.self === clone); // true — ссылка корректно воспроизведена
```

## Опция transfer — передача без копирования

По умолчанию `structuredClone` копирует данные. Но для `ArrayBuffer` и других Transferable-объектов можно использовать опцию `transfer`, чтобы переместить данные вместо копирования. Это эффективнее по памяти:

```javascript
const buffer = new ArrayBuffer(1024 * 1024); // 1 МБ
const view = new Uint8Array(buffer);
view[0] = 42;

const clone = structuredClone(buffer, { transfer: [buffer] });

console.log(new Uint8Array(clone)[0]); // 42 — данные перемещены
console.log(buffer.byteLength);        // 0 — оригинал теперь пуст
```

После передачи оригинальный буфер становится отсоединённым и недоступным.

## Сравнение с другими методами копирования

### structuredClone vs JSON.parse/JSON.stringify

```javascript
const data = {
  date: new Date(),
  regex: /test/i,
  map: new Map([['key', 'value']]),
  undef: undefined,
  big: BigInt(1000)
};

// JSON-подход теряет или ломает большинство типов:
const jsonClone = JSON.parse(JSON.stringify(data));
console.log(jsonClone.date instanceof Date); // false (стала строкой)
console.log(jsonClone.regex);               // {} (пустой объект)
console.log(jsonClone.map);                 // {} (Map потерян)
console.log(jsonClone.undef);               // undefined (свойство исчезло)
// BigInt выбросит TypeError

// structuredClone сохраняет все поддерживаемые типы:
const structuredData = { date: new Date(), regex: /test/i, map: new Map([['key', 'value']]) };
const sClone = structuredClone(structuredData);
console.log(sClone.date instanceof Date);   // true
console.log(sClone.regex instanceof RegExp);// true
console.log(sClone.map instanceof Map);     // true
```

### structuredClone vs Lodash cloneDeep

```javascript
import cloneDeep from 'lodash/cloneDeep';

// Lodash cloneDeep пытается сохранять прототипы:
const userClone = cloneDeep(user);
console.log(userClone instanceof User); // true
console.log(userClone.greet());         // 'Hello, Bob'

// structuredClone прототипы не сохраняет, зато это нативный метод
// без зависимостей и с поддержкой ArrayBuffer, Map, Set
```

Если важно сохранить прототипы экземпляров классов — используйте Lodash. Для всего остального `structuredClone` предпочтительнее: он быстрее, не требует зависимостей и корректно работает с типизированными массивами.

## Практические сценарии применения

### Иммутабельное обновление состояния без библиотек

```javascript
const state = {
  user: { name: 'Alice', settings: { theme: 'dark' } },
  cart: [{ id: 1, qty: 2 }]
};

function updateTheme(currentState, newTheme) {
  const nextState = structuredClone(currentState);
  nextState.user.settings.theme = newTheme;
  return nextState;
}

const newState = updateTheme(state, 'light');
console.log(state.user.settings.theme);    // 'dark' — оригинал цел
console.log(newState.user.settings.theme); // 'light'
```

### Сохранение снимка данных перед редактированием

```javascript
class FormManager {
  constructor(initialData) {
    this.original = structuredClone(initialData);
    this.current = structuredClone(initialData);
  }

  update(field, value) {
    this.current[field] = value;
  }

  reset() {
    this.current = structuredClone(this.original);
  }

  hasChanges() {
    return JSON.stringify(this.current) !== JSON.stringify(this.original);
  }
}

const form = new FormManager({ name: 'Alice', email: 'alice@example.com' });
form.update('name', 'Bob');
console.log(form.hasChanges()); // true
form.reset();
console.log(form.current.name); // 'Alice'
```

### Безопасная передача данных между воркерами

```javascript
// main.js
const worker = new Worker('worker.js');

const sharedData = {
  timestamp: new Date(),
  buffer: new ArrayBuffer(256),
  config: new Map([['timeout', 5000]])
};

// postMessage использует тот же алгоритм структурированного клонирования
// Можно предварительно проверить, что данные клонируются корректно:
const verified = structuredClone(sharedData);
worker.postMessage(verified);
```

### Кеширование с независимыми копиями

```javascript
const cache = new Map();

function getCachedData(key, fetchFn) {
  if (!cache.has(key)) {
    cache.set(key, fetchFn());
  }
  // Возвращаем клон, чтобы мутации снаружи не испортили кеш
  return structuredClone(cache.get(key));
}

const data = getCachedData('config', () => ({
  features: ['a', 'b'],
  updatedAt: new Date()
}));

data.features.push('c'); // не испортит кеш
```

## Поддержка в браузерах и Node.js

`structuredClone` доступен без полифилов в:

- Chrome 98+
- Firefox 94+
- Safari 15.4+
- Node.js 17.0+
- Deno 1.14+

Для старых окружений можно использовать небольшой полифил:

```javascript
if (typeof structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
```

Однако этот полифил не поддерживает `Date`, `Map`, `Set`, `RegExp` и другие типы — это лишь временная заглушка для базовых объектов.

## Итоги

`structuredClone` — правильный инструмент для глубокого копирования в большинстве задач:

- Нативная реализация без зависимостей
- Поддержка `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, `TypedArray`, `Error`, `BigInt`
- Корректная обработка циклических ссылок
- Сохранение `undefined` и специальных числовых значений (`NaN`, `Infinity`, `-0`)

Главные ограничения, о которых нужно помнить: функции не копируются, пользовательские прототипы не сохраняются, DOM-узлы и Symbol не поддерживаются. Если нужно клонировать экземпляры классов с методами — рассмотрите Lodash `cloneDeep` или ручную сериализацию.

Для всего остального `structuredClone` — лучший выбор по соотношению возможностей, производительности и отсутствия внешних зависимостей.

---

Хотите глубже разобраться с объектами, методами массивов и другими возможностями JavaScript? Смотрите курс [JavaScript с нуля на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=structured-clone).