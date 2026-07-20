---
metaTitle: "Object.groupBy в JavaScript — группировка элементов"
metaDescription: "Как использовать Object.groupBy в JavaScript для группировки массивов и итерируемых объектов. Примеры, сравнение с reduce и Map.groupBy"
author: "Антон Ларичев"
title: "Object.groupBy в JavaScript — группировка элементов"
preview: "Разбираем Object.groupBy — статический метод ES2024 для группировки элементов по ключу с примерами и сравнением альтернатив"
---

`Object.groupBy` — статический метод, появившийся в стандарте ECMAScript 2024. Он позволяет разбить элементы любого итерируемого объекта на группы по ключу, который возвращает функция-колбэк. Результатом является обычный объект, где каждое свойство — это массив элементов одной группы.

До появления этого метода разработчики использовали `Array.prototype.reduce`, сторонние библиотеки вроде Lodash или писали вспомогательные утилиты вручную. `Object.groupBy` стандартизировал эту операцию и сделал её частью языка.

## Синтаксис

```javascript
Object.groupBy(iterable, callbackFn)
```

**Параметры:**

- `iterable` — любой итерируемый объект: массив, `Set`, `Map`, строка и т.д.
- `callbackFn` — функция, вызываемая для каждого элемента. Принимает два аргумента:
  - `element` — текущий элемент
  - `index` — индекс текущего элемента

**Возвращаемое значение:**

Объект без прототипа (`null`-прототип, как у `Object.create(null)`), где каждый ключ — строка или Symbol, возвращённые из `callbackFn`, а значение — массив элементов, для которых колбэк вернул этот ключ.

## Базовые примеры

### Группировка чисел

Простейший пример — разбить массив чисел на чётные и нечётные:

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const grouped = Object.groupBy(numbers, (num) => {
  return num % 2 === 0 ? 'even' : 'odd';
});

console.log(grouped);
// {
//   odd: [1, 3, 5, 7, 9],
//   even: [2, 4, 6, 8, 10]
// }
```

Колбэк возвращает строку `'even'` или `'odd'`, и метод автоматически создаёт соответствующие массивы в результирующем объекте.

### Группировка по диапазону значений

```javascript
const scores = [45, 72, 88, 34, 91, 60, 55, 79, 100, 23];

const graded = Object.groupBy(scores, (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
});

console.log(graded);
// {
//   F: [45, 34, 55, 23],
//   C: [72, 79],
//   B: [88],
//   A: [91, 100],
//   D: [60]
// }
```

### Группировка строк

```javascript
const words = ['apple', 'banana', 'avocado', 'blueberry', 'cherry', 'apricot'];

const byFirstLetter = Object.groupBy(words, (word) => word[0].toUpperCase());

console.log(byFirstLetter);
// {
//   A: ['apple', 'avocado', 'apricot'],
//   B: ['banana', 'blueberry'],
//   C: ['cherry']
// }
```

## Группировка массива объектов

На практике чаще всего группируют массивы объектов — именно здесь `Object.groupBy` показывает наибольшую ценность.

### Группировка товаров по категории

```javascript
const products = [
  { id: 1, name: 'Ноутбук', category: 'electronics', price: 80000 },
  { id: 2, name: 'Футболка', category: 'clothing', price: 1500 },
  { id: 3, name: 'Смартфон', category: 'electronics', price: 60000 },
  { id: 4, name: 'Джинсы', category: 'clothing', price: 4000 },
  { id: 5, name: 'Наушники', category: 'electronics', price: 8000 },
  { id: 6, name: 'Кроссовки', category: 'footwear', price: 7000 },
];

const byCategory = Object.groupBy(products, (product) => product.category);

console.log(byCategory);
// {
//   electronics: [
//     { id: 1, name: 'Ноутбук', category: 'electronics', price: 80000 },
//     { id: 3, name: 'Смартфон', category: 'electronics', price: 60000 },
//     { id: 5, name: 'Наушники', category: 'electronics', price: 8000 }
//   ],
//   clothing: [
//     { id: 2, name: 'Футболка', category: 'clothing', price: 1500 },
//     { id: 4, name: 'Джинсы', category: 'clothing', price: 4000 }
//   ],
//   footwear: [
//     { id: 6, name: 'Кроссовки', category: 'footwear', price: 7000 }
//   ]
// }
```

### Группировка пользователей по роли

```javascript
const users = [
  { id: 1, name: 'Анна', role: 'admin', active: true },
  { id: 2, name: 'Борис', role: 'user', active: false },
  { id: 3, name: 'Виктор', role: 'moderator', active: true },
  { id: 4, name: 'Галина', role: 'user', active: true },
  { id: 5, name: 'Дмитрий', role: 'admin', active: false },
  { id: 6, name: 'Елена', role: 'user', active: true },
];

const byRole = Object.groupBy(users, ({ role }) => role);

console.log(byRole.admin);
// [
//   { id: 1, name: 'Анна', role: 'admin', active: true },
//   { id: 5, name: 'Дмитрий', role: 'admin', active: false }
// ]
```

Можно комбинировать несколько полей в одном ключе:

```javascript
const byRoleAndStatus = Object.groupBy(users, ({ role, active }) => {
  return `${role}_${active ? 'active' : 'inactive'}`;
});

console.log(Object.keys(byRoleAndStatus));
// ['admin_active', 'user_inactive', 'moderator_active', 'user_active', 'admin_inactive']
```

### Группировка транзакций по месяцу

```javascript
const transactions = [
  { id: 1, amount: 500, date: '2024-01-15' },
  { id: 2, amount: 1200, date: '2024-01-20' },
  { id: 3, amount: 800, date: '2024-02-03' },
  { id: 4, amount: 300, date: '2024-02-15' },
  { id: 5, amount: 950, date: '2024-01-28' },
];

const byMonth = Object.groupBy(transactions, ({ date }) => {
  const [year, month] = date.split('-');
  return `${year}-${month}`;
});

// Подсчитать сумму по каждому месяцу
Object.entries(byMonth).forEach(([month, items]) => {
  const total = items.reduce((sum, t) => sum + t.amount, 0);
  console.log(`${month}: ${total} руб.`);
});
// 2024-01: 2650 руб.
// 2024-02: 1100 руб.
```

## Map.groupBy vs Object.groupBy

Одновременно с `Object.groupBy` в ES2024 появился метод `Map.groupBy`. Он работает аналогично, но возвращает `Map` вместо обычного объекта.

```javascript
const inventory = [
  { name: 'Молоко', quantity: 5 },
  { name: 'Хлеб', quantity: 2 },
  { name: 'Сыр', quantity: 0 },
  { name: 'Масло', quantity: 1 },
  { name: 'Яйца', quantity: 0 },
];

const result = Map.groupBy(inventory, ({ quantity }) => {
  return quantity > 0 ? 'inStock' : 'outOfStock';
});

console.log(result.get('outOfStock'));
// [{ name: 'Сыр', quantity: 0 }, { name: 'Яйца', quantity: 0 }]
```

`Map.groupBy` стоит выбирать в следующих случаях:

- Ключи не являются строками — например, объекты или Symbol.
- Важен гарантированный порядок ключей (Map сохраняет порядок вставки).
- Результат должен передаваться в API, ожидающее `Map`.

```javascript
const RESTOCK = Symbol('restock');
const OK = Symbol('ok');

const grouped = Map.groupBy(inventory, ({ quantity }) => {
  return quantity < 3 ? RESTOCK : OK;
});

console.log(grouped.get(RESTOCK));
// [{ name: 'Хлеб', quantity: 2 }, { name: 'Сыр', quantity: 0 }, ...]
```

В большинстве задач с строковыми ключами достаточно `Object.groupBy` — результат легче сериализовать в JSON и передать через сеть.

## Сравнение с Array.prototype.reduce

До ES2024 стандартным способом группировки был метод `reduce`. Сравним оба подхода:

```javascript
const people = [
  { name: 'Алексей', department: 'engineering' },
  { name: 'Марина', department: 'marketing' },
  { name: 'Сергей', department: 'engineering' },
  { name: 'Ольга', department: 'hr' },
  { name: 'Николай', department: 'marketing' },
];

// Старый способ — reduce
const withReduce = people.reduce((acc, person) => {
  const key = person.department;
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(person);
  return acc;
}, {});

// Новый способ — Object.groupBy
const withGroupBy = Object.groupBy(people, ({ department }) => department);
```

`Object.groupBy` лаконичнее и читается значительно проще. Намерение кода очевидно с первого взгляда без анализа аккумулятора и ветвлений.

Важное отличие от `reduce`: объект, возвращаемый `Object.groupBy`, создаётся без прототипа. Это означает, что у него нет унаследованных методов вроде `toString` или `hasOwnProperty`. Такой объект безопасен для хранения данных, где ключи могут конфликтовать с методами прототипа.

```javascript
const result = Object.groupBy(['foo', 'bar'], (s) => s);

console.log(Object.getPrototypeOf(result)); // null
console.log(result.toString);               // undefined
```

Если нужно работать с результатом как с обычным объектом, используйте `Object.entries()`, `Object.keys()` и `Object.values()` — они работают с `null`-прототипом без проблем.

## Работа с итерируемыми объектами

`Object.groupBy` принимает любой итерируемый объект, не только массивы.

```javascript
// Группировка Set
const uniqueNumbers = new Set([1, 2, 3, 4, 5, 6]);

const grouped = Object.groupBy(uniqueNumbers, (n) => n % 2 === 0 ? 'even' : 'odd');
// { odd: [1, 3, 5], even: [2, 4, 6] }

// Группировка записей из Map
const userMap = new Map([
  ['alice', { role: 'admin' }],
  ['bob', { role: 'user' }],
  ['carol', { role: 'admin' }],
]);

const groupedEntries = Object.groupBy(userMap, ([, { role }]) => role);
// {
//   admin: [['alice', { role: 'admin' }], ['carol', { role: 'admin' }]],
//   user: [['bob', { role: 'user' }]]
// }
```

## Вложенная группировка

`Object.groupBy` не поддерживает многоуровневую группировку из коробки, но её легко реализовать, применяя метод рекурсивно к каждой группе:

```javascript
const employees = [
  { name: 'Иван', department: 'engineering', level: 'senior' },
  { name: 'Мария', department: 'engineering', level: 'junior' },
  { name: 'Пётр', department: 'marketing', level: 'senior' },
  { name: 'Анна', department: 'marketing', level: 'junior' },
  { name: 'Кирилл', department: 'engineering', level: 'senior' },
];

// Сначала группируем по отделу
const byDepartment = Object.groupBy(employees, ({ department }) => department);

// Затем каждый отдел группируем по уровню
const nested = Object.fromEntries(
  Object.entries(byDepartment).map(([dept, members]) => [
    dept,
    Object.groupBy(members, ({ level }) => level),
  ])
);

console.log(nested.engineering);
// {
//   senior: [{ name: 'Иван', ... }, { name: 'Кирилл', ... }],
//   junior: [{ name: 'Мария', ... }]
// }
```

## Поддержка браузерами и средами выполнения

`Object.groupBy` входит в стандарт ES2024 и поддерживается во всех современных средах:

- Chrome / Edge — с версии 117
- Firefox — с версии 119
- Safari — с версии 17.4
- Node.js — с версии 21

Если требуется поддержка устаревших окружений, можно написать полифил вручную:

```javascript
if (!Object.groupBy) {
  Object.groupBy = function (iterable, callbackFn) {
    const result = Object.create(null);
    let index = 0;
    for (const element of iterable) {
      const key = callbackFn(element, index++);
      if (key in result) {
        result[key].push(element);
      } else {
        result[key] = [element];
      }
    }
    return result;
  };
}
```

Альтернативно — подключить `core-js`:

```bash
npm install core-js
```

```javascript
import 'core-js/actual/object/group-by';
```

## Типичные ошибки

### Колбэк возвращает не строку и не Symbol

Если колбэк вернёт число, оно будет приведено к строке. Это работает предсказуемо, но лучше явно возвращать строку, чтобы избежать путаницы:

```javascript
const arr = [1.5, 2.7, 3.1, 4.9];

// Возвращаем число — будет преобразовано в строку
const g = Object.groupBy(arr, (n) => Math.floor(n));
console.log(Object.keys(g)); // ['1', '2', '3', '4']
```

### Ожидание мутации исходного массива

`Object.groupBy` не мутирует исходный итерируемый объект и не копирует элементы — он создаёт новые массивы, содержащие ссылки на те же объекты. Изменение объекта в группе отразится в исходном массиве:

```javascript
const items = [{ id: 1, tag: 'a' }, { id: 2, tag: 'b' }];
const grouped = Object.groupBy(items, ({ tag }) => tag);

grouped.a[0].id = 99;
console.log(items[0].id); // 99 — изменился исходный объект
```

Если нужна полная копия, используйте структурированное клонирование или `JSON.parse(JSON.stringify(...))`.

## Итог

`Object.groupBy` — лаконичный и читаемый способ группировки элементов любого итерируемого объекта. Метод принимает итерируемое и колбэк-функцию, возвращающую ключ группы, и строит объект, где каждый ключ содержит массив подходящих элементов.

Главные тезисы:

- Работает с любым итерируемым: массив, `Set`, `Map`, генератор.
- Возвращает объект без прототипа — нет конфликтов с унаследованными методами.
- Используйте `Map.groupBy`, если ключи — не строки, или важен порядок вставки.
- Заменяет громоздкие конструкции на `reduce` и сторонние утилиты.
- Элементы в группах — ссылки на исходные объекты, не копии.

Чтобы глубже разобраться с объектами, массивами и современными возможностями JavaScript, приходите на курс по JavaScript на PurpleSchool.

[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=object-groupby)