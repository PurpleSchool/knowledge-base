---
metaTitle: "Nullish coalescing (??) в JavaScript — оператор нулевого слияния"
metaDescription: "Разбираем оператор ?? в JavaScript: отличия от ||, практические примеры, сочетание с optional chaining и реальные сценарии применения."
author: "Антон Ларичев"
title: "Оператор нулевого слияния (??) в JavaScript"
preview: "Оператор ?? возвращает правый операнд только при null или undefined — в отличие от ||, он не отбрасывает 0, пустую строку и false."
---

## Что такое nullish coalescing

Оператор нулевого слияния `??` (nullish coalescing) появился в JavaScript в ES2020 (ES11). Он возвращает правый операнд, если левый равен `null` или `undefined`, и левый операнд — во всех остальных случаях.

Синтаксис:

```javascript
левый_операнд ?? правый_операнд
```

Простой пример:

```javascript
const result = null ?? 'значение по умолчанию';
console.log(result); // 'значение по умолчанию'

const result2 = undefined ?? 42;
console.log(result2); // 42

const result3 = 'привет' ?? 'значение по умолчанию';
console.log(result3); // 'привет'
```

Главная идея: оператор `??` реагирует только на **nullish-значения** — то есть исключительно на `null` и `undefined`. Всё остальное считается валидным значением.

## Отличие от оператора ||

До появления `??` разработчики использовали логическое ИЛИ `||` для установки значений по умолчанию. Но у него есть существенный недостаток: `||` срабатывает на любое **falsy-значение**, а не только на `null`/`undefined`.

Falsy-значения в JavaScript:
- `false`
- `0`
- `-0`
- `0n` (BigInt ноль)
- `''` (пустая строка)
- `null`
- `undefined`
- `NaN`

Посмотрим на разницу:

```javascript
// Оператор ||
const count1 = 0 || 10;
console.log(count1); // 10 — нежелательно, 0 является валидным числом

const name1 = '' || 'Аноним';
console.log(name1); // 'Аноним' — нежелательно, пустая строка может быть намеренной

const active1 = false || true;
console.log(active1); // true — нежелательно, false может быть корректным значением

// Оператор ??
const count2 = 0 ?? 10;
console.log(count2); // 0 — правильно

const name2 = '' ?? 'Аноним';
console.log(name2); // '' — правильно

const active2 = false ?? true;
console.log(active2); // false — правильно
```

Оператор `||` подходит, когда нужно заменить любое ложное значение. Оператор `??` подходит, когда нужно заменить только отсутствующее значение (`null` или `undefined`).

## Практические примеры

### Настройки с числовыми значениями

Типичная ситуация — функция принимает объект настроек, где некоторые числа могут быть равны нулю:

```javascript
function createSlider(options) {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const step = options.step ?? 1;

  console.log(`min: ${min}, max: ${max}, step: ${step}`);
}

createSlider({ min: 0, max: 50, step: 5 });
// min: 0, max: 50, step: 5

createSlider({ min: 0, max: 50 });
// min: 0, max: 50, step: 1 (step не передан — используем 1)

createSlider({});
// min: 0, max: 100, step: 1 (все значения по умолчанию)
```

Если бы использовали `||`, то `min: 0` заменялось бы на `0` (совпадение в этом случае), но `step: 0` заменялось бы на `1`, что неверно.

### Данные из API

При получении данных с сервера поля могут отсутствовать или быть явно `null`:

```javascript
const user = {
  id: 1,
  name: 'Иван',
  age: null,
  bio: undefined,
  rating: 0,
  isVerified: false,
};

const displayAge = user.age ?? 'Возраст не указан';
const displayBio = user.bio ?? 'Биография не заполнена';
const displayRating = user.rating ?? 'Нет оценок';
const displayVerified = user.isVerified ?? 'Статус неизвестен';

console.log(displayAge);      // 'Возраст не указан'
console.log(displayBio);      // 'Биография не заполнена'
console.log(displayRating);   // 0 (нулевой рейтинг — валидное значение)
console.log(displayVerified); // false (не верифицирован, но статус известен)
```

### Локальное хранилище

Значения из `localStorage` могут быть `null`, если ключ не существует:

```javascript
function getTheme() {
  const saved = localStorage.getItem('theme');
  return saved ?? 'light';
}

// Если ключ 'theme' не задан, localStorage.getItem вернёт null
// и мы получим 'light' по умолчанию
const theme = getTheme();
```

### Параметры функций

```javascript
function sendNotification(message, options) {
  const timeout = options?.timeout ?? 3000;
  const type = options?.type ?? 'info';
  const closable = options?.closable ?? true;

  console.log({ message, timeout, type, closable });
}

sendNotification('Готово!', { timeout: 0 });
// { message: 'Готово!', timeout: 0, type: 'info', closable: true }
// timeout: 0 сохранён корректно

sendNotification('Ошибка!', { type: 'error', closable: false });
// { message: 'Ошибка!', timeout: 3000, type: 'error', closable: false }
// closable: false сохранён корректно
```

## Сочетание с optional chaining (?.)

Операторы `??` и `?.` отлично работают вместе. Optional chaining возвращает `undefined` при обращении к несуществующему свойству, а `??` подставляет значение по умолчанию:

```javascript
const config = {
  database: {
    host: 'localhost',
    port: 5432,
  },
};

const host = config?.database?.host ?? 'localhost';
const port = config?.database?.port ?? 5432;
const timeout = config?.database?.timeout ?? 30000;
const maxRetries = config?.retry?.maxAttempts ?? 3;

console.log(host);       // 'localhost'
console.log(port);       // 5432
console.log(timeout);    // 30000 (свойство отсутствует)
console.log(maxRetries); // 3 (объект retry отсутствует)
```

Пример с массивом:

```javascript
const response = {
  data: {
    users: null,
  },
};

const users = response?.data?.users ?? [];
console.log(users); // [] (users равен null, подставляем пустой массив)

const firstUser = response?.data?.users?.[0] ?? 'Пользователей нет';
console.log(firstUser); // 'Пользователей нет'
```

## Цепочка операторов ??

Можно выстраивать цепочку из нескольких `??`:

```javascript
const env = process.env.PORT;
const configPort = null;
const defaultPort = 3000;

const port = env ?? configPort ?? defaultPort;
console.log(port); // 3000 (если PORT не задан в переменных окружения)
```

Вычисление идёт слева направо и останавливается на первом ненулевом значении:

```javascript
console.log(null ?? undefined ?? 0 ?? 'default');
// 0 — первое ненулевое значение

console.log(null ?? undefined ?? null ?? 'default');
// 'default' — все предыдущие значения nullish
```

## Приоритет операторов

Оператор `??` имеет низкий приоритет — ниже, чем у большинства операторов, но выше присваивания.

Важное ограничение: нельзя напрямую комбинировать `??` с `&&` и `||` без скобок. Это сделано намеренно, чтобы избежать путаницы:

```javascript
// Ошибка синтаксиса (SyntaxError)
// const result = a || b ?? c;
// const result = a && b ?? c;

// Правильно — используем скобки
const result1 = (a || b) ?? c;
const result2 = a || (b ?? c);

const result3 = (a && b) ?? c;
const result4 = a && (b ?? c);
```

С другими операторами скобки не обязательны, но делают код читаемее:

```javascript
const value = getPrice() * 1.2 ?? 0;
// Сначала выполнится умножение, потом ??
// Но лучше явно расставить скобки для ясности

const value2 = (getPrice() * 1.2) ?? 0;
```

## Присваивание с нулевым слиянием (??=)

В ES2021 появился оператор логического присваивания `??=`. Он присваивает значение только если переменная равна `null` или `undefined`:

```javascript
let a = null;
a ??= 'значение';
console.log(a); // 'значение'

let b = 0;
b ??= 'значение';
console.log(b); // 0 — не изменилось, так как 0 не nullish

let c = 'существующее';
c ??= 'значение';
console.log(c); // 'существующее' — не изменилось
```

Практический пример — ленивая инициализация объекта:

```javascript
const cache = {};

function getUserData(id) {
  cache[id] ??= fetchUserFromServer(id);
  return cache[id];
}
```

Эквивалент без `??=`:

```javascript
function getUserData(id) {
  if (cache[id] === null || cache[id] === undefined) {
    cache[id] = fetchUserFromServer(id);
  }
  return cache[id];
}
```

## Распространённые ошибки

### Путаница между ?? и ||

```javascript
// Неверно: при count = 0 выведется 'Нет элементов'
function displayCount(count) {
  const text = count || 'Нет элементов';
  return `Количество: ${text}`;
}

console.log(displayCount(0));  // 'Количество: Нет элементов' — ошибка!
console.log(displayCount(5));  // 'Количество: 5'

// Верно: ?? сохраняет 0
function displayCountFixed(count) {
  const text = count ?? 'Нет элементов';
  return `Количество: ${text}`;
}

console.log(displayCountFixed(0));  // 'Количество: 0'
console.log(displayCountFixed(5));  // 'Количество: 5'
```

### Ожидание проверки на falsy

```javascript
const input = '';

// Разработчик ожидал получить 'default' при пустой строке
const result = input ?? 'default';
console.log(result); // '' — пустая строка не nullish!

// Если нужно заменить и пустую строку, используйте ||
const result2 = input || 'default';
console.log(result2); // 'default'
```

### Неверный порядок проверок

```javascript
// Потенциальная ошибка: data может быть null, тогда data.value выбросит исключение
const value = data.value ?? 'default'; // TypeError если data === null

// Правильно: сначала проверяем наличие объекта через ?.
const value2 = data?.value ?? 'default';
```

## Сравнение подходов

До ES2020 разработчики использовали несколько способов задать значение по умолчанию:

```javascript
const config = getConfig();

// Вариант 1: тернарный оператор
const timeout1 = config.timeout !== null && config.timeout !== undefined
  ? config.timeout
  : 5000;

// Вариант 2: оператор ||
// Не подходит при timeout = 0
const timeout2 = config.timeout || 5000;

// Вариант 3: явная проверка
const timeout3 = config.timeout != null ? config.timeout : 5000;
// Оператор != null проверяет и на null, и на undefined

// Вариант 4: оператор ?? (ES2020)
const timeout4 = config.timeout ?? 5000;
// Читается ясно, корректно обрабатывает 0
```

Оператор `??` — наиболее лаконичный и семантически точный способ.

## Поддержка браузерами и Node.js

Оператор `??` поддерживается во всех современных браузерах и в Node.js начиная с версии 14. Если необходима поддержка старых окружений, используйте Babel с соответствующим плагином или TypeScript (который транспилирует `??` в совместимый код).

```bash
npm install --save-dev @babel/plugin-proposal-nullish-coalescing-operator
```

В TypeScript оператор `??` поддерживается начиная с версии 3.7 без дополнительных настроек.

## Итог

Оператор `??` решает конкретную и частую задачу: подставить значение по умолчанию только тогда, когда данные действительно отсутствуют. Его ключевые преимущества:

- Реагирует только на `null` и `undefined`, игнорируя `0`, `false`, `''` и другие falsy-значения
- Делает намерение кода явным — читатель сразу понимает, что заменяются только «пустые» значения
- Отлично сочетается с optional chaining `?.` для безопасной работы с вложенными объектами
- Поддерживает лаконичный вариант присваивания `??=`

Выбирайте оператор в зависимости от задачи: `||` — когда нужно заменить любое ложное значение, `??` — когда нужно заменить только отсутствующее.

Чтобы углубиться в JavaScript и научиться уверенно работать с операторами, деструктуризацией, асинхронностью и другими возможностями языка, записывайтесь на курс: [JavaScript для разработчиков на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=nullish-coalescing).
