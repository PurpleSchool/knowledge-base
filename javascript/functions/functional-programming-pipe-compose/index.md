---
metaTitle: "Pipe и Compose в JavaScript — функциональное программирование"
metaDescription: "Разбираем pipe и compose в JavaScript: как реализовать, чем отличаются, где применять. Практические примеры функциональной композиции."
author: "Антон Ларичев"
title: "Функциональное программирование: pipe и compose"
preview: "Что такое pipe и compose, как они работают в JavaScript и зачем нужна функциональная композиция в реальных проектах."
---

## Что такое функциональная композиция

Функциональная композиция — это способ строить сложную логику из небольших, независимых функций. Вместо того чтобы писать одну большую функцию, вы создаёте несколько маленьких и «склеиваете» их вместе.

Математически это выглядит так: если есть функции `f` и `g`, то `compose(f, g)(x)` равно `f(g(x))`. Результат одной функции становится входом для другой.

В JavaScript этот подход реализуется через две утилиты — `compose` и `pipe`. Они делают одно и то же, но в разном порядке применения функций.

## Почему это важно

Посмотрите на типичный императивный код обработки данных:

```javascript
function processUser(user) {
  const trimmed = user.name.trim();
  const lower = trimmed.toLowerCase();
  const normalized = lower.replace(/\s+/g, '_');
  const prefixed = 'user_' + normalized;
  return prefixed;
}
```

Каждая строка делает одно преобразование. Проблема в том, что эти шаги жёстко связаны внутри функции — их нельзя переиспользовать отдельно.

Функциональный подход разбивает это на независимые функции:

```javascript
const trim = str => str.trim();
const toLowerCase = str => str.toLowerCase();
const replaceSpaces = str => str.replace(/\s+/g, '_');
const addPrefix = str => 'user_' + str;
```

Каждую из них можно использовать самостоятельно, тестировать отдельно и комбинировать в любом порядке.

## compose — от правого к левому

`compose` применяет функции справа налево: последняя в списке выполняется первой.

### Реализация

```javascript
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
```

Здесь `reduceRight` проходит массив функций с конца, передавая результат каждой следующей функции.

### Пример использования

```javascript
const trim = str => str.trim();
const toLowerCase = str => str.toLowerCase();
const replaceSpaces = str => str.replace(/\s+/g, '_');
const addPrefix = str => 'user_' + str;

const processUsername = compose(addPrefix, replaceSpaces, toLowerCase, trim);

console.log(processUsername('  John Doe  '));
// 'user_john_doe'
```

Порядок чтения: `addPrefix(replaceSpaces(toLowerCase(trim(x))))` — сначала `trim`, потом `toLowerCase`, потом `replaceSpaces`, потом `addPrefix`. В коде они написаны в обратном порядке, что поначалу непривычно.

### Пошаговое выполнение

```javascript
const composed = compose(addPrefix, replaceSpaces, toLowerCase, trim);

// Эквивалентно:
// 1. trim('  John Doe  ')      => 'John Doe'
// 2. toLowerCase('John Doe')   => 'john doe'
// 3. replaceSpaces('john doe') => 'john_doe'
// 4. addPrefix('john_doe')     => 'user_john_doe'
```

## pipe — от левого к правому

`pipe` делает то же самое, но применяет функции слева направо. Это более интуитивный порядок — такой же, как цепочка `.then()` в промисах.

### Реализация

```javascript
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
```

Вместо `reduceRight` используется обычный `reduce`.

### Пример использования

```javascript
const processUsername = pipe(trim, toLowerCase, replaceSpaces, addPrefix);

console.log(processUsername('  John Doe  '));
// 'user_john_doe'
```

Теперь порядок функций совпадает с порядком их выполнения — читать значительно проще.

### Сравнение compose и pipe

```javascript
// compose: читается снизу вверх / справа налево
const withCompose = compose(step4, step3, step2, step1);

// pipe: читается сверху вниз / слева направо
const withPipe = pipe(step1, step2, step3, step4);

// Результат одинаковый
withCompose('input') === withPipe('input'); // true
```

В большинстве команд предпочитают `pipe` — порядок функций соответствует порядку выполнения. `compose` встречается чаще в математически ориентированных библиотеках.

## Чистые функции — основа композиции

Композиция работает надёжно только с чистыми функциями. Чистая функция:

- всегда возвращает одинаковый результат для одних и тех же аргументов
- не имеет побочных эффектов (не меняет внешнее состояние)

```javascript
// Чистая функция — можно безопасно использовать в pipe/compose
const double = x => x * 2;
const addTen = x => x + 10;

const transform = pipe(double, addTen);
transform(5); // 20
transform(5); // 20 — всегда одинаково

// Нечистая функция — непредсказуемый результат в цепочке
let multiplier = 2;
const impureDouble = x => x * multiplier; // зависит от внешней переменной
```

## Практические примеры

### Обработка массива данных

```javascript
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const filterActive = users => users.filter(u => u.active);
const sortByName = users => [...users].sort((a, b) => a.name.localeCompare(b.name));
const takeFirst10 = users => users.slice(0, 10);
const extractNames = users => users.map(u => u.name);

const getTopActiveUsers = pipe(
  filterActive,
  sortByName,
  takeFirst10,
  extractNames
);

const users = [
  { name: 'Alice', active: true },
  { name: 'Bob', active: false },
  { name: 'Charlie', active: true },
  // ...
];

console.log(getTopActiveUsers(users));
// ['Alice', 'Charlie', ...]
```

### Форматирование цены

```javascript
const toNumber = str => parseFloat(str);
const applyDiscount = percent => price => price * (1 - percent / 100);
const roundToCents = price => Math.round(price * 100) / 100;
const formatUSD = price => `$${price.toFixed(2)}`;

const formatDiscountedPrice = pipe(
  toNumber,
  applyDiscount(15),
  roundToCents,
  formatUSD
);

console.log(formatDiscountedPrice('199.99'));
// '$169.99'
```

Обратите внимание на `applyDiscount(15)` — это каррированная функция, которая при вызове с одним аргументом возвращает функцию для использования в цепочке.

### Валидация данных

```javascript
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const notEmpty = value => {
  if (!value || value.trim() === '') throw new Error('Field is required');
  return value;
};

const minLength = min => value => {
  if (value.length < min) throw new Error(`Min length is ${min}`);
  return value;
};

const maxLength = max => value => {
  if (value.length > max) throw new Error(`Max length is ${max}`);
  return value;
};

const noSpecialChars = value => {
  if (/[^a-zA-Z0-9_]/.test(value)) throw new Error('Only letters, numbers and underscore allowed');
  return value;
};

const validateUsername = pipe(
  notEmpty,
  minLength(3),
  maxLength(20),
  noSpecialChars
);

try {
  validateUsername('jo');
} catch (e) {
  console.error(e.message); // 'Min length is 3'
}

try {
  validateUsername('john_doe');
  console.log('Valid!');
} catch (e) {
  console.error(e.message);
}
```

## Асинхронная версия pipeAsync

Стандартные `pipe` и `compose` работают только с синхронными функциями. Для асинхронных нужна версия с `async/await`:

```javascript
const pipeAsync = (...fns) => x =>
  fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(x));

const fetchUser = async id => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

const enrichWithPosts = async user => {
  const response = await fetch(`/api/posts?userId=${user.id}`);
  const posts = await response.json();
  return { ...user, posts };
};

const formatForDisplay = user => ({
  name: user.name,
  postCount: user.posts.length,
  lastPost: user.posts[0]?.title ?? 'No posts'
});

const getUserProfile = pipeAsync(
  fetchUser,
  enrichWithPosts,
  formatForDisplay
);

getUserProfile(42).then(console.log);
```

## Каррирование и частичное применение

Каррирование превращает функцию с несколькими аргументами в цепочку функций с одним аргументом. Это ключевой инструмент при работе с `pipe` и `compose`, так как в цепочке каждая функция принимает ровно один аргумент.

```javascript
// Обычная функция
const add = (a, b) => a + b;
add(1, 2); // 3

// Каррированная функция
const curriedAdd = a => b => a + b;
curriedAdd(1)(2); // 3

// Использование в pipe
const addTax = rate => price => price * (1 + rate);
const roundPrice = price => Math.round(price * 100) / 100;

const calculateTotal = pipe(
  addTax(0.2),  // каррированная функция — вызываем с параметром, получаем функцию для pipe
  roundPrice
);

console.log(calculateTotal(100)); // 120
console.log(calculateTotal(99.99)); // 120
```

## Отладка цепочки

Отлаживать `pipe` удобно через функцию-логгер, которую можно вставить между шагами:

```javascript
const tap = label => value => {
  console.log(`[${label}]`, value);
  return value; // возвращаем значение без изменений
};

const processUsername = pipe(
  tap('initial'),
  trim,
  tap('after trim'),
  toLowerCase,
  tap('after toLowerCase'),
  replaceSpaces,
  tap('after replaceSpaces'),
  addPrefix
);

processUsername('  John Doe  ');
// [initial]           '  John Doe  '
// [after trim]        'John Doe'
// [after toLowerCase] 'john doe'
// [after replaceSpaces] 'john_doe'
// результат: 'user_john_doe'
```

Функция `tap` не меняет данные — она только логирует и передаёт значение дальше.

## Библиотеки с готовой реализацией

Если вы хотите использовать `pipe` и `compose` в проекте без написания своих утилит, есть проверенные библиотеки.

### Ramda

```javascript
import { pipe, compose, map, filter, sort } from 'ramda';

const getActiveNames = pipe(
  filter(u => u.active),
  map(u => u.name),
  sort((a, b) => a.localeCompare(b))
);
```

Ramda изначально спроектирована под функциональный стиль — все функции каррированы и принимают данные последним аргументом.

### Lodash/fp

```javascript
import { pipe, filter, map, sortBy } from 'lodash/fp';

const getActiveNames = pipe(
  filter('active'),
  map('name'),
  sortBy(name => name)
);
```

`lodash/fp` — это иммутабельная, авто-каррированная версия Lodash. Хорошо подходит, если Lodash уже используется в проекте.

## Когда использовать pipe и compose

Функциональная композиция полезна когда:

- Нужно применить несколько последовательных преобразований к данным
- Хочется переиспользовать отдельные шаги в разных цепочках
- Важно тестировать каждый шаг изолированно
- Логика преобразований достаточно сложная, чтобы не писать всё в одной функции

Не стоит применять механически везде. Если логика простая — прямой код читается лучше. Три-четыре строчки не обязательно оборачивать в `pipe`.

```javascript
// Не нужно усложнять простую логику
const double = x => x * 2;
const result = pipe(double)(5); // избыточно

// Просто
const result = double(5); // понятнее
```

## Итог

`pipe` и `compose` — это инструменты для построения функций из более мелких. Разница только в порядке применения: `compose` идёт справа налево, `pipe` — слева направо.

Оба подхода поощряют писать маленькие чистые функции, которые делают одно дело. Такой код легче тестировать, переиспользовать и понимать.

Начните с `pipe` — порядок аргументов более интуитивен. Напишите свою реализацию через `reduce`, это займёт одну строку, и вы сразу поймёте, как она устроена.

Если вы хотите глубже разобраться с JavaScript и освоить функциональные паттерны на практике — приходите на курс PurpleSchool:

[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=functional-programming-pipe-compose)
