---
metaTitle: Деструктуризация в JavaScript — массивы и объекты
metaDescription: Деструктуризация в JavaScript — как работает для массивов и объектов, вложенная деструктуризация, переименование и значения по умолчанию. Примеры кода.
author: Антон Ларичев
title: Деструктуризация в JavaScript — полное руководство
preview: Разбираем деструктуризацию в JavaScript — синтаксис для массивов, объектов, вложенных структур и параметров функций. Примеры и частые ошибки.
---

## Введение

Деструктуризация — это синтаксис ES6, который позволяет «распаковать» значения из массивов и объектов в отдельные переменные. Вместо обращения к элементам через индексы или свойства объекта, вы получаете нужные данные одной строкой.

Эта возможность активно используется в современном JavaScript: при работе с API, деструктуризации пропсов в React, обработке ответов с сервера. Без понимания деструктуризации сложно читать современный JS-код.

## Деструктуризация массивов

### Базовый синтаксис

До ES6 для извлечения элементов массива нужно было писать так:

```javascript
const colors = ['red', 'green', 'blue'];

const first = colors[0];  // 'red'
const second = colors[1]; // 'green'
```

С деструктуризацией это записывается в одну строку:

```javascript
const colors = ['red', 'green', 'blue'];

const [first, second, third] = colors;

console.log(first);  // 'red'
console.log(second); // 'green'
console.log(third);  // 'blue'
```

Переменные получают значения по позиции: первая переменная — первый элемент, вторая — второй и так далее.

### Пропуск элементов

Если нужны не все элементы, лишние позиции можно пропустить через запятую:

```javascript
const numbers = [1, 2, 3, 4, 5];

// Берём только первый и третий элемент
const [first, , third] = numbers;

console.log(first); // 1
console.log(third); // 3
```

### Значения по умолчанию

Если массив короче, чем количество переменных, можно задать значения по умолчанию:

```javascript
const [a = 10, b = 20, c = 30] = [1, 2];

console.log(a); // 1  — из массива
console.log(b); // 2  — из массива
console.log(c); // 30 — значение по умолчанию
```

### Rest-оператор в деструктуризации

`...rest` собирает оставшиеся элементы в новый массив:

```javascript
const [head, ...tail] = [1, 2, 3, 4, 5];

console.log(head); // 1
console.log(tail); // [2, 3, 4, 5]
```

### Обмен переменных

Деструктуризация позволяет менять значения переменных без временной переменной:

```javascript
let x = 1;
let y = 2;

[x, y] = [y, x];

console.log(x); // 2
console.log(y); // 1
```

Если вы хотите глубже разобраться в основах JavaScript, включая деструктуризацию, spread-оператор и другие возможности ES6+ — приходите на наш курс [JavaScript с нуля](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=article&utm_campaign=destructuring). На курсе 218 уроков и 80 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Деструктуризация объектов

### Базовый синтаксис

Для объектов деструктуризация работает через фигурные скобки. Имена переменных должны совпадать с ключами объекта:

```javascript
const user = {
  name: 'Иван',
  age: 30,
  city: 'Москва'
};

const { name, age, city } = user;

console.log(name); // 'Иван'
console.log(age);  // 30
console.log(city); // 'Москва'
```

### Переименование переменных

Если имя свойства не подходит как имя переменной, можно переименовать:

```javascript
const user = {
  first_name: 'Иван',
  last_name: 'Петров'
};

// Слева — ключ в объекте, справа — новое имя переменной
const { first_name: firstName, last_name: lastName } = user;

console.log(firstName); // 'Иван'
console.log(lastName);  // 'Петров'
```

### Значения по умолчанию

Если свойства нет в объекте, используется значение по умолчанию:

```javascript
const settings = {
  theme: 'dark'
};

const { theme = 'light', language = 'ru', fontSize = 14 } = settings;

console.log(theme);    // 'dark'    — из объекта
console.log(language); // 'ru'      — значение по умолчанию
console.log(fontSize); // 14        — значение по умолчанию
```

Переименование и значение по умолчанию можно комбинировать:

```javascript
const { first_name: firstName = 'Аноним' } = {};

console.log(firstName); // 'Аноним'
```

### Rest-оператор для объектов

`...rest` собирает оставшиеся свойства в новый объект:

```javascript
const { name, age, ...address } = {
  name: 'Иван',
  age: 30,
  city: 'Москва',
  street: 'Ленина',
  zip: '123456'
};

console.log(name);    // 'Иван'
console.log(age);     // 30
console.log(address); // { city: 'Москва', street: 'Ленина', zip: '123456' }
```

## Вложенная деструктуризация

### Объект внутри объекта

Деструктуризацию можно применять к вложенным структурам:

```javascript
const user = {
  name: 'Иван',
  address: {
    city: 'Москва',
    zip: '123456'
  }
};

const { name, address: { city, zip } } = user;

console.log(name); // 'Иван'
console.log(city); // 'Москва'
console.log(zip);  // '123456'

// Важно: переменная address здесь не создаётся!
// console.log(address); // ReferenceError
```

Если нужен и вложенный объект, и его свойства — объявите `address` отдельно:

```javascript
const { address, address: { city } } = user;

console.log(address); // { city: 'Москва', zip: '123456' }
console.log(city);    // 'Москва'
```

### Массив внутри объекта

```javascript
const response = {
  status: 200,
  data: ['яблоко', 'банан', 'апельсин']
};

const { status, data: [firstFruit, secondFruit] } = response;

console.log(status);      // 200
console.log(firstFruit);  // 'яблоко'
console.log(secondFruit); // 'банан'
```

### Массив объектов

```javascript
const users = [
  { id: 1, name: 'Иван' },
  { id: 2, name: 'Мария' }
];

const [{ name: firstName }, { name: secondName }] = users;

console.log(firstName);  // 'Иван'
console.log(secondName); // 'Мария'
```

## Деструктуризация в параметрах функций

Это один из самых частых паттернов в современном JavaScript:

```javascript
// Без деструктуризации
function greet(user) {
  console.log(`Привет, ${user.name}! Тебе ${user.age} лет.`);
}

// С деструктуризацией в параметрах
function greet({ name, age }) {
  console.log(`Привет, ${name}! Тебе ${age} лет.`);
}

greet({ name: 'Иван', age: 30 }); // Привет, Иван! Тебе 30 лет.
```

Можно задавать значения по умолчанию прямо в параметрах:

```javascript
function createUser({ name = 'Аноним', role = 'user', active = true } = {}) {
  return { name, role, active };
}

createUser({ name: 'Иван' });
// { name: 'Иван', role: 'user', active: true }

createUser();
// { name: 'Аноним', role: 'user', active: true }
```

Обратите внимание на `= {}` в конце — это гарантирует, что функцию можно вызвать без аргументов.

## Практические примеры

### Обработка ответа API

```javascript
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const { data: { user }, meta: { total } } = await response.json();

  console.log(user);  // объект пользователя
  console.log(total); // общее количество
}
```

### Работа с import

Деструктуризация используется при импорте именованных экспортов:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { createStore, combineReducers } from 'redux';
```

### Возврат нескольких значений из функции

```javascript
function getMinMax(numbers) {
  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers)
  };
}

const { min, max } = getMinMax([3, 1, 4, 1, 5, 9, 2, 6]);

console.log(min); // 1
console.log(max); // 9
```

### Работа с промисами и async/await

```javascript
const [userData, postsData] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json())
]);
```

## Частые ошибки

* **Обращение к `address` после вложенной деструктуризации.** При `const { address: { city } } = user` переменная `address` не создаётся — только `city`. Чтобы получить оба, используйте `const { address, address: { city } } = user`.

* **Деструктуризация `null` или `undefined`.** Если объект может быть `null`, добавьте значение по умолчанию: `const { name } = user ?? {}` или проверьте наличие значения перед деструктуризацией.

* **Попытка деструктурировать примитив.** Деструктуризация объекта работает только с объектами (и массивами). `const { length } = 'hello'` сработает (строки — объекты), но `const { x } = null` выбросит ошибку.

* **Забытый знак `=` при переименовании.** `const { name: newName }` — это переименование, не пара «ключ: значение». Ключ объекта слева от `:`, новое имя переменной — справа.

* **Rest-элемент не последний.** `const [first, ...rest, last] = arr` — синтаксическая ошибка. Rest-оператор всегда должен быть последним.

## Часто задаваемые вопросы

**Можно ли деструктурировать Map и Set?**

Нет напрямую. Map и Set — итерируемые объекты, но синтаксис деструктуризации объекта к ним не применим. Можно деструктурировать массив, полученный из них: `const [first] = new Set([1, 2, 3])` даёт `1`.

**В чём разница между деструктуризацией и spread-оператором?**

Деструктуризация извлекает значения из структуры данных в переменные. Spread (`...`) распаковывает итерируемое в другую структуру. Внешне похожи, но решают разные задачи: `const [a, ...rest] = arr` — деструктуризация с rest; `const newArr = [...arr, 4, 5]` — spread для создания нового массива.

**Работает ли деструктуризация для любых итерируемых объектов?**

Деструктуризация массива работает с любым итерируемым: строками, Set, Map, генераторами. `const [a, b, c] = 'abc'` даёт `'a'`, `'b'`, `'c'`.

**Влияет ли деструктуризация на исходный объект?**

Нет, деструктуризация не мутирует исходные данные. Вы просто создаёте новые переменные, которые ссылаются на те же значения (для примитивов — копии).

**Как деструктурировать свойство с именем, совпадающим с зарезервированным словом?**

Используйте переименование: `const { class: className, for: forAttr } = element`.

## Заключение

Деструктуризация — один из самых важных синтаксических сахаров ES6. Она делает код компактным и читаемым, особенно при работе с вложенными объектами, ответами API и параметрами функций. Знание этого синтаксиса обязательно для разработки на современном JavaScript, React и Node.js.

Для закрепления навыков JavaScript, включая деструктуризацию и другие возможности ES6+, рекомендуем курс [JavaScript с нуля](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=article&utm_campaign=destructuring). В первых 3 модулях курса доступно бесплатное содержание — это позволяет познакомиться с подходом преподавания и понять структуру курса до покупки полного доступа.
