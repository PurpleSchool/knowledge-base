---
metaTitle: "Object.fromEntries в JavaScript — полное руководство"
metaDescription: "Object.fromEntries: преобразование Map и массива пар в объект, фильтрация и трансформация объектов. Примеры и практические кейсы."
author: "Антон Ларичев"
title: "Object.fromEntries в JavaScript"
preview: "Разбираем Object.fromEntries — метод, который превращает итерируемые пары ключ-значение в объект. Практические примеры с Map, массивами и трансформацией объектов."
---

## Что такое Object.fromEntries

`Object.fromEntries` — статический метод, появившийся в ES2019 (ES10). Он принимает итерируемую коллекцию пар `[ключ, значение]` и возвращает новый объект, построенный из этих пар.

Метод является обратной операцией к `Object.entries`: если `Object.entries` разбирает объект на массив пар, то `Object.fromEntries` собирает объект обратно из таких пар.

```javascript
const entries = [['name', 'Alice'], ['age', 30], ['city', 'Moscow']];
const obj = Object.fromEntries(entries);

console.log(obj);
// { name: 'Alice', age: 30, city: 'Moscow' }
```

## Синтаксис

```javascript
Object.fromEntries(iterable)
```

**Параметры:**
- `iterable` — любой итерируемый объект, каждый элемент которого является парой `[ключ, значение]`. Подходят `Map`, массивы массивов, генераторы и любые другие итерируемые структуры.

**Возвращаемое значение:**
- Новый объект с собственными перечисляемыми свойствами, соответствующими парам входного итерируемого.

Если во входной коллекции встречаются дублирующиеся ключи, побеждает последнее значение — точно так же, как при обычном присваивании свойств объекта.

```javascript
const entries = [['x', 1], ['x', 2], ['x', 3]];
const obj = Object.fromEntries(entries);

console.log(obj); // { x: 3 }
```

## Преобразование Map в объект

До появления `Object.fromEntries` преобразование `Map` в обычный объект требовало ручного перебора. Теперь это делается в одну строку.

```javascript
const map = new Map([
  ['firstName', 'Ivan'],
  ['lastName', 'Petrov'],
  ['role', 'developer'],
]);

const obj = Object.fromEntries(map);
console.log(obj);
// { firstName: 'Ivan', lastName: 'Petrov', role: 'developer' }
```

`Map` является итерируемым объектом, каждая итерация которого отдаёт пару `[ключ, значение]`, поэтому `Object.fromEntries` принимает его напрямую без каких-либо промежуточных преобразований.

Обратите внимание: ключи `Map` могут быть любого типа, но свойства объекта — только строки и символы. Если ключ `Map` не является строкой или символом, он будет неявно приведён к строке.

```javascript
const map = new Map([
  [1, 'one'],
  [true, 'yes'],
  [{}, 'object'],
]);

const obj = Object.fromEntries(map);
console.log(obj);
// { '1': 'one', 'true': 'yes', '[object Object]': 'object' }
```

## Трансформация объектов

Самый распространённый практический сценарий — изменить значения всех свойств объекта. Классическая задача: применить некую функцию к каждому значению.

До ES2019 для этого использовали `Object.keys` или `Object.entries` вместе с `reduce`:

```javascript
// Старый способ через reduce
const prices = { apple: 100, banana: 50, cherry: 200 };

const discounted = Object.keys(prices).reduce((acc, key) => {
  acc[key] = prices[key] * 0.9;
  return acc;
}, {});

console.log(discounted);
// { apple: 90, banana: 45, cherry: 180 }
```

С `Object.fromEntries` и `Object.entries` это записывается значительно лаконичнее:

```javascript
const prices = { apple: 100, banana: 50, cherry: 200 };

const discounted = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [key, value * 0.9])
);

console.log(discounted);
// { apple: 90, banana: 45, cherry: 180 }
```

Цепочка `Object.entries → map → Object.fromEntries` стала идиоматическим способом трансформации объектов в современном JavaScript.

### Переименование ключей

Аналогичным образом можно трансформировать не значения, а ключи:

```javascript
const snakeCaseObj = {
  first_name: 'Anna',
  last_name: 'Ivanova',
  birth_year: 1990,
};

const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const camelCaseObj = Object.fromEntries(
  Object.entries(snakeCaseObj).map(([key, value]) => [toCamelCase(key), value])
);

console.log(camelCaseObj);
// { firstName: 'Anna', lastName: 'Ivanova', birthYear: 1990 }
```

## Фильтрация свойств объекта

В JavaScript нет встроенного аналога `Array.prototype.filter` для объектов. `Object.fromEntries` закрывает этот пробел в паре с `Object.entries` и `filter`.

```javascript
const user = {
  id: 42,
  name: 'Sergey',
  password: 'secret123',
  token: 'abc-def-ghi',
  email: 'sergey@example.com',
};

// Убираем чувствительные поля перед отправкой клиенту
const PRIVATE_FIELDS = new Set(['password', 'token']);

const publicUser = Object.fromEntries(
  Object.entries(user).filter(([key]) => !PRIVATE_FIELDS.has(key))
);

console.log(publicUser);
// { id: 42, name: 'Sergey', email: 'sergey@example.com' }
```

Ещё один пример — выбрать только те свойства, значения которых удовлетворяют условию:

```javascript
const scores = { alice: 85, bob: 42, carol: 91, dave: 38, eve: 77 };

const passing = Object.fromEntries(
  Object.entries(scores).filter(([, score]) => score >= 60)
);

console.log(passing);
// { alice: 85, carol: 91, eve: 77 }
```

## Работа с URLSearchParams

`URLSearchParams` реализует интерфейс итерируемого объекта пар, поэтому `Object.fromEntries` отлично работает с параметрами URL.

```javascript
const queryString = 'page=2&limit=20&sort=desc&filter=active';
const params = new URLSearchParams(queryString);

const paramsObj = Object.fromEntries(params);
console.log(paramsObj);
// { page: '2', limit: '20', sort: 'desc', filter: 'active' }
```

Это удобно, когда нужно передать параметры запроса в функцию, которая ожидает обычный объект, или сохранить их в состояние React/Vue-компонента.

Важное ограничение: `URLSearchParams` для одного ключа может содержать несколько значений (например, `tags=js&tags=ts`). `Object.fromEntries` оставит только последнее значение. Для множественных значений используйте `params.getAll(key)` явно.

```javascript
const params = new URLSearchParams('tags=js&tags=ts&tags=node');

// Неправильно: теряем значения
const wrong = Object.fromEntries(params);
console.log(wrong); // { tags: 'node' }

// Правильно: собираем вручную
const keys = [...new Set(params.keys())];
const correct = Object.fromEntries(
  keys.map((key) => [key, params.getAll(key)])
);
console.log(correct); // { tags: ['js', 'ts', 'node'] }
```

## Использование с генераторами

`Object.fromEntries` принимает любой итерируемый объект, включая генераторы. Это позволяет лениво вычислять пары ключ-значение.

```javascript
function* generateEntries(keys, transform) {
  for (const key of keys) {
    yield [key, transform(key)];
  }
}

const fields = ['width', 'height', 'depth'];
const dimensions = Object.fromEntries(
  generateEntries(fields, (key) => Math.floor(Math.random() * 100))
);

console.log(dimensions);
// { width: 73, height: 12, depth: 56 } — значения случайные
```

Практический пример: построить объект значений по умолчанию для формы на основе схемы полей.

```javascript
const formSchema = [
  { name: 'username', default: '' },
  { name: 'age', default: 0 },
  { name: 'subscribed', default: false },
];

const initialValues = Object.fromEntries(
  formSchema.map(({ name, default: defaultValue }) => [name, defaultValue])
);

console.log(initialValues);
// { username: '', age: 0, subscribed: false }
```

## Практический пример: нормализация данных API

Часто данные, приходящие с сервера, нужно нормализовать перед использованием в приложении. Например, преобразовать массив объектов в словарь по идентификатору.

```javascript
const usersFromApi = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 3, name: 'Carol', active: true },
];

// Нормализация: массив → словарь по id
const usersById = Object.fromEntries(
  usersFromApi.map((user) => [user.id, user])
);

console.log(usersById);
// {
//   1: { id: 1, name: 'Alice', active: true },
//   2: { id: 2, name: 'Bob', active: false },
//   3: { id: 3, name: 'Carol', active: true }
// }

// Теперь доступ по id — O(1) вместо O(n)
console.log(usersById[2].name); // 'Bob'
```

### Инвертирование объекта

Ещё один классический приём — поменять местами ключи и значения:

```javascript
const codeToName = {
  RU: 'Россия',
  US: 'США',
  DE: 'Германия',
  FR: 'Франция',
};

const nameToCode = Object.fromEntries(
  Object.entries(codeToName).map(([code, name]) => [name, code])
);

console.log(nameToCode);
// { 'Россия': 'RU', 'США': 'US', 'Германия': 'DE', 'Франция': 'FR' }
```

## Сравнение с альтернативами

### Object.fromEntries vs reduce

```javascript
const entries = [['a', 1], ['b', 2], ['c', 3]];

// Через reduce — многословно
const obj1 = entries.reduce((acc, [key, value]) => {
  acc[key] = value;
  return acc;
}, {});

// Через Object.fromEntries — лаконично
const obj2 = Object.fromEntries(entries);

console.log(obj1); // { a: 1, b: 2, c: 3 }
console.log(obj2); // { a: 1, b: 2, c: 3 }
```

`Object.fromEntries` декларативно выражает намерение и читается как часть словаря языка, а не как ручная реализация логики. Вариант с `reduce` по-прежнему полезен, когда логика сборки объекта сложнее простого отображения.

### Object.fromEntries vs Object.assign

`Object.assign` хорош для слияния объектов, но не для создания объекта из пар:

```javascript
const entries = [['x', 10], ['y', 20]];

// Object.assign требует преобразования каждой пары в объект
const obj1 = Object.assign({}, ...entries.map(([k, v]) => ({ [k]: v })));

// Object.fromEntries — напрямую
const obj2 = Object.fromEntries(entries);
```

## Поддержка браузерами и полифилл

`Object.fromEntries` поддерживается во всех современных браузерах и Node.js начиная с версии 12. Для старых окружений можно использовать полифилл.

```javascript
// Полифилл для окружений без поддержки Object.fromEntries
if (!Object.fromEntries) {
  Object.fromEntries = function fromEntries(iterable) {
    return [...iterable].reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  };
}
```

Альтернативно — используйте `core-js` или `@babel/polyfill`, которые автоматически добавят нужные полифиллы на основе настроек `browserslist`.

## Типичные ошибки

### Передача не-итерируемого значения

```javascript
// Ошибка: объект не является итерируемым
const obj = { a: 1, b: 2 };
Object.fromEntries(obj); // TypeError: obj is not iterable

// Правильно: сначала получить массив пар
Object.fromEntries(Object.entries(obj)); // { a: 1, b: 2 }
```

### Элементы без двух компонентов

```javascript
// Ошибка: каждый элемент должен иметь хотя бы два значения
const wrong = [['a'], ['b']];
const obj = Object.fromEntries(wrong);
console.log(obj); // { a: undefined, b: undefined } — не ошибка, но неожиданный результат

// Правильно
const correct = [['a', 1], ['b', 2]];
Object.fromEntries(correct); // { a: 1, b: 2 }
```

Если элемент содержит больше двух значений, лишние молча игнорируются:

```javascript
const entries = [['key', 'value', 'ignored', 'also-ignored']];
const obj = Object.fromEntries(entries);
console.log(obj); // { key: 'value' }
```

## Итоги

`Object.fromEntries` закрывает давний пробел в стандартной библиотеке JavaScript:

- Является парным методом к `Object.entries`, делая их симметричными.
- Принимает любые итерируемые коллекции: массивы, `Map`, `URLSearchParams`, генераторы.
- В связке `Object.entries → Array.prototype.map/filter → Object.fromEntries` обеспечивает функциональный стиль работы с объектами без мутаций.
- Заменяет громоздкие конструкции с `reduce` при сборке объектов из пар.

Основные сценарии применения: трансформация объектов, фильтрация свойств, конвертация `Map` в объект, нормализация данных из API и работа с параметрами URL.

Чтобы глубже освоить JavaScript и уверенно работать с объектами, массивами и современными возможностями языка, приходите на курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=object-fromentries).