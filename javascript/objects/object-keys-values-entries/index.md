---
metaTitle: "Object.keys, Object.values, Object.entries в JavaScript"
metaDescription: "Разбор методов Object.keys, Object.values и Object.entries в JavaScript с практическими примерами трансформации и фильтрации объектов."
author: "Антон Ларичев"
title: "Object.keys, Object.values, Object.entries в JavaScript"
preview: "Три метода для итерации и трансформации объектов в JavaScript: как работают Object.keys, Object.values и Object.entries и когда применять каждый из них."
---

## Работа с ключами и значениями объекта

JavaScript предоставляет три статических метода объекта `Object`, которые стали стандартным способом итерации по объектам и их преобразования: `Object.keys()`, `Object.values()` и `Object.entries()`. Методы появились в ES2017 и позволяют работать с объектами так же удобно, как с массивами — используя `map`, `filter`, `reduce` и другие функции высшего порядка.

## Object.keys()

`Object.keys()` возвращает массив строк, содержащий все перечисляемые собственные ключи объекта в порядке их добавления.

### Синтаксис

```javascript
Object.keys(obj)
```

### Базовый пример

```javascript
const user = {
  name: 'Антон',
  age: 30,
  city: 'Москва'
};

console.log(Object.keys(user)); // ['name', 'age', 'city']
```

### Итерация по ключам

```javascript
const config = {
  host: 'localhost',
  port: 3000,
  debug: true
};

Object.keys(config).forEach(key => {
  console.log(`${key}: ${config[key]}`);
});
// host: localhost
// port: 3000
// debug: true
```

### Подсчёт количества свойств

Простой способ узнать количество полей объекта без ручного перебора:

```javascript
const product = {
  id: 1,
  name: 'Ноутбук',
  price: 75000,
  inStock: true
};

console.log(Object.keys(product).length); // 4
```

### Проверка наличия свойства

```javascript
const settings = {
  theme: 'dark',
  language: 'ru'
};

console.log(Object.keys(settings).includes('theme')); // true
console.log(Object.keys(settings).includes('font'));  // false
```

## Object.values()

`Object.values()` возвращает массив значений всех перечисляемых собственных свойств объекта — в том же порядке, что и `Object.keys()`.

### Синтаксис

```javascript
Object.values(obj)
```

### Базовый пример

```javascript
const prices = {
  apple: 50,
  banana: 30,
  cherry: 120
};

console.log(Object.values(prices)); // [50, 30, 120]
```

### Вычисление суммы значений

```javascript
const cart = {
  laptop: 75000,
  mouse: 2500,
  keyboard: 5000
};

const total = Object.values(cart).reduce((sum, price) => sum + price, 0);
console.log(total); // 82500
```

### Поиск максимального значения

```javascript
const scores = {
  alice: 95,
  bob: 87,
  charlie: 92
};

const maxScore = Math.max(...Object.values(scores));
console.log(maxScore); // 95
```

### Проверка, что все значения соответствуют условию

```javascript
const formFields = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secret123'
};

const allFilled = Object.values(formFields).every(value => value.trim() !== '');
console.log(allFilled); // true
```

## Object.entries()

`Object.entries()` возвращает массив пар `[ключ, значение]` для каждого перечисляемого собственного свойства. Это самый мощный из трёх методов, так как даёт доступ одновременно и к ключу, и к значению.

### Синтаксис

```javascript
Object.entries(obj)
```

### Базовый пример

```javascript
const person = {
  name: 'Мария',
  age: 25,
  role: 'developer'
};

console.log(Object.entries(person));
// [['name', 'Мария'], ['age', 25], ['role', 'developer']]
```

### Деструктуризация в цикле

Самый читаемый способ итерации по объекту с доступом и к ключу, и к значению:

```javascript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

for (const [key, value] of Object.entries(config)) {
  console.log(`${key} = ${value}`);
}
// apiUrl = https://api.example.com
// timeout = 5000
// retries = 3
```

### Трансформация объекта через map

Сочетание `Object.entries()` и `Object.fromEntries()` позволяет трансформировать объект функционально, не мутируя исходный:

```javascript
const prices = {
  apple: 50,
  banana: 30,
  cherry: 120
};

// Увеличить все цены на 10%
const updatedPrices = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [key, value * 1.1])
);

console.log(updatedPrices);
// { apple: 55, banana: 33, cherry: 132 }
```

### Фильтрация свойств объекта

```javascript
const user = {
  name: 'Дмитрий',
  age: 28,
  password: 'secret123',
  email: 'dmitry@example.com',
  token: 'abc123'
};

const sensitiveFields = ['password', 'token'];

const safeUser = Object.fromEntries(
  Object.entries(user).filter(([key]) => !sensitiveFields.includes(key))
);

console.log(safeUser);
// { name: 'Дмитрий', age: 28, email: 'dmitry@example.com' }
```

## Object.fromEntries()

Метод `Object.fromEntries()` является парным к `Object.entries()` — он принимает массив пар `[ключ, значение]` или итерируемый объект и возвращает новый объект.

```javascript
const entries = [['a', 1], ['b', 2], ['c', 3]];
const obj = Object.fromEntries(entries);
console.log(obj); // { a: 1, b: 2, c: 3 }
```

### Конвертация Map в объект

```javascript
const map = new Map([
  ['name', 'Елена'],
  ['age', 32],
  ['city', 'Санкт-Петербург']
]);

const obj = Object.fromEntries(map);
console.log(obj);
// { name: 'Елена', age: 32, city: 'Санкт-Петербург' }
```

## Практические сценарии

### Нормализация ответа API

Нередко API возвращает объекты с ключами в стиле `snake_case`, а во фронтенде принят `camelCase`:

```javascript
const apiResponse = {
  user_name: 'ivan_petrov',
  user_age: 35,
  user_email: 'ivan@example.com'
};

const toCamelCase = str =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const normalized = Object.fromEntries(
  Object.entries(apiResponse).map(([key, value]) => [toCamelCase(key), value])
);

console.log(normalized);
// { userName: 'ivan_petrov', userAge: 35, userEmail: 'ivan@example.com' }
```

### Создание индекса из массива

Преобразование массива объектов в хеш-таблицу для быстрого поиска по ключу:

```javascript
const users = [
  { id: 1, name: 'Алексей' },
  { id: 2, name: 'Наталья' },
  { id: 3, name: 'Сергей' }
];

const usersById = Object.fromEntries(
  users.map(user => [user.id, user])
);

console.log(usersById[2]); // { id: 2, name: 'Наталья' }
console.log(usersById[3]); // { id: 3, name: 'Сергей' }
```

### Валидация данных формы

```javascript
const formData = {
  username: 'john_doe',
  email: '',
  password: 'pass'
};

const errors = Object.fromEntries(
  Object.entries(formData)
    .filter(([_, value]) => !value)
    .map(([key]) => [key, `Поле «${key}» обязательно для заполнения`])
);

console.log(errors);
// { email: 'Поле «email» обязательно для заполнения' }
```

### Инвертирование ключей и значений

```javascript
const codeToName = {
  ru: 'Русский',
  en: 'English',
  de: 'Deutsch'
};

const nameToCode = Object.fromEntries(
  Object.entries(codeToName).map(([key, value]) => [value, key])
);

console.log(nameToCode);
// { Русский: 'ru', English: 'en', Deutsch: 'de' }
```

## Важные особенности

### Только собственные перечисляемые свойства

Все три метода работают исключительно с собственными перечисляемыми свойствами. Унаследованные свойства из прототипа не попадают в результат:

```javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.type = 'animal';

const dog = new Animal('Бобик');

console.log(Object.keys(dog));    // ['name']
console.log(Object.values(dog));  // ['Бобик']
console.log(Object.entries(dog)); // [['name', 'Бобик']]
// Свойство 'type' из прототипа не включается
```

### Символы не включаются

Свойства с ключами типа `Symbol` игнорируются всеми тремя методами:

```javascript
const id = Symbol('id');
const obj = {
  [id]: 123,
  name: 'Тест'
};

console.log(Object.keys(obj));    // ['name']
console.log(Object.values(obj));  // ['Тест']
console.log(Object.entries(obj)); // [['name', 'Тест']]

// Для символов используйте отдельный метод:
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(id)]
```

### Неперечисляемые свойства

Свойства, созданные через `Object.defineProperty` с `enumerable: false`, тоже не попадают в результат:

```javascript
const obj = {};

Object.defineProperty(obj, 'hidden', {
  value: 'скрыто',
  enumerable: false
});

obj.visible = 'видно';

console.log(Object.keys(obj));    // ['visible']
console.log(Object.values(obj));  // ['видно']
```

### Порядок свойств

Методы возвращают свойства в следующем порядке:
1. Целочисленные ключи по возрастанию
2. Строковые ключи в порядке добавления

```javascript
const mixed = {
  b: 'second string',
  1: 'first number',
  a: 'first string',
  2: 'second number'
};

console.log(Object.keys(mixed));
// ['1', '2', 'b', 'a'] — числовые ключи идут первыми
```

## Сравнение методов

| Метод | Возвращает | Когда использовать |
|---|---|---|
| `Object.keys()` | Массив ключей | Нужны только имена свойств |
| `Object.values()` | Массив значений | Нужны только данные, ключи не важны |
| `Object.entries()` | Массив пар `[ключ, значение]` | Нужен доступ и к ключу, и к значению |

## Итог

`Object.keys()`, `Object.values()` и `Object.entries()` — фундаментальный инструментарий для работы с объектами в JavaScript. Они открывают весь арсенал методов массивов для обработки объектных данных: фильтрацию, трансформацию, агрегацию. В связке с `Object.fromEntries()` эти методы позволяют писать чистый функциональный код без мутаций исходных данных.

Чтобы глубже освоить JavaScript и уверенно работать с объектами, массивами и современными API языка, приходите на курс [JavaScript с нуля](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=object-keys-values-entries) на PurpleSchool.
