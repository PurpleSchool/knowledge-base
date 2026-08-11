---
metaTitle: "Методы toSorted, toReversed и with в JavaScript"
metaDescription: "Разбираем иммутабельные методы массивов toSorted, toReversed и with из ES2023: отличия от sort/reverse, практические примеры и кейсы применения."
author: "Антон Ларичев"
title: "Методы массивов toSorted, toReversed и with"
preview: "Иммутабельные методы ES2023 для работы с массивами: toSorted, toReversed и with — как использовать и чем они лучше мутирующих аналогов."
---

## Иммутабельные методы массивов в ES2023

В ECMAScript 2023 появились три новых метода массивов: `toSorted`, `toReversed` и `with`. Все они решают одну задачу — позволяют выполнять операции с массивами без изменения исходного массива, возвращая новую копию с применёнными изменениями.

До их появления разработчики были вынуждены вручную копировать массив перед сортировкой или разворотом, либо мириться с мутацией исходных данных. Новые методы делают иммутабельный подход встроенным и лаконичным.

## Проблема мутирующих методов

Методы `sort()` и `reverse()` существуют в JavaScript с самого начала, и оба они изменяют исходный массив на месте.

```javascript
const numbers = [3, 1, 4, 1, 5, 9];
const sorted = numbers.sort((a, b) => a - b);

console.log(sorted);  // [1, 1, 3, 4, 5, 9]
console.log(numbers); // [1, 1, 3, 4, 5, 9] — исходный массив изменён
console.log(sorted === numbers); // true — это один и тот же массив
```

Такое поведение нарушает принцип наименьшего удивления: функция с виду возвращает результат, но при этом незаметно меняет данные, переданные ей на вход. Это частая причина труднообнаруживаемых багов, особенно в React-приложениях или при работе со состоянием.

Традиционное решение — копировать массив перед операцией:

```javascript
const numbers = [3, 1, 4, 1, 5, 9];
const sorted = [...numbers].sort((a, b) => a - b);

console.log(numbers); // [3, 1, 4, 1, 5, 9] — исходный не тронут
console.log(sorted);  // [1, 1, 3, 4, 5, 9]
```

Это работает, но добавляет шум в код. `toSorted`, `toReversed` и `with` предоставляют встроенное решение.

## Метод toSorted

`toSorted` — иммутабельная версия `sort`. Принимает тот же необязательный компаратор, возвращает новый отсортированный массив, не трогая исходный.

### Синтаксис

```javascript
array.toSorted()
array.toSorted(compareFn)
```

### Базовый пример

```javascript
const fruits = ['банан', 'яблоко', 'груша', 'апельсин'];
const sortedFruits = fruits.toSorted();

console.log(sortedFruits); // ['апельсин', 'банан', 'груша', 'яблоко']
console.log(fruits);       // ['банан', 'яблоко', 'груша', 'апельсин'] — без изменений
```

### Сортировка с компаратором

Как и `sort`, метод `toSorted` принимает функцию-компаратор для нестандартной сортировки:

```javascript
const products = [
  { name: 'Ноутбук', price: 85000 },
  { name: 'Мышь', price: 1200 },
  { name: 'Монитор', price: 32000 },
  { name: 'Клавиатура', price: 4500 },
];

const byPriceAsc = products.toSorted((a, b) => a.price - b.price);
const byPriceDesc = products.toSorted((a, b) => b.price - a.price);

console.log(byPriceAsc.map(p => p.name));
// ['Мышь', 'Клавиатура', 'Монитор', 'Ноутбук']

console.log(byPriceDesc.map(p => p.name));
// ['Ноутбук', 'Монитор', 'Клавиатура', 'Мышь']

console.log(products[0].name); // 'Ноутбук' — исходный массив не изменён
```

### Практический кейс в React

Без `toSorted` сортировка списка в компоненте могла испортить состояние:

```javascript
// Было — баг: мутирует state
function ProductList({ products }) {
  const [sortBy, setSortBy] = useState('name');

  const sorted = products.sort((a, b) =>
    a[sortBy].localeCompare(b[sortBy])
  );

  return <ul>{sorted.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

// Стало — корректно с toSorted
function ProductList({ products }) {
  const [sortBy, setSortBy] = useState('name');

  const sorted = products.toSorted((a, b) =>
    String(a[sortBy]).localeCompare(String(b[sortBy]))
  );

  return <ul>{sorted.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

## Метод toReversed

`toReversed` — иммутабельная версия `reverse`. Возвращает новый массив с элементами в обратном порядке.

### Синтаксис

```javascript
array.toReversed()
```

### Базовый пример

```javascript
const steps = ['Открыть файл', 'Прочитать данные', 'Обработать', 'Сохранить'];
const reversed = steps.toReversed();

console.log(reversed);
// ['Сохранить', 'Обработать', 'Прочитать данные', 'Открыть файл']

console.log(steps);
// ['Открыть файл', 'Прочитать данные', 'Обработать', 'Сохранить'] — без изменений
```

### Сравнение с reverse

```javascript
const original = [1, 2, 3, 4, 5];

// Старый способ — мутирует
const reversed1 = original.reverse();
console.log(original === reversed1); // true — один массив
console.log(original); // [5, 4, 3, 2, 1] — исходный изменён

// Новый способ — иммутабельно
const arr = [1, 2, 3, 4, 5];
const reversed2 = arr.toReversed();
console.log(arr === reversed2); // false — разные массивы
console.log(arr);       // [1, 2, 3, 4, 5] — без изменений
console.log(reversed2); // [5, 4, 3, 2, 1]
```

### Применение в цепочках методов

`toReversed` удобно использовать в цепочках, когда нужно показать историю событий в обратном порядке:

```javascript
const logs = [
  { time: '10:00', message: 'Сервер запущен' },
  { time: '10:05', message: 'Подключение к БД' },
  { time: '10:10', message: 'Первый запрос' },
  { time: '10:15', message: 'Ошибка авторизации' },
];

const recentFirst = logs
  .toReversed()
  .map(log => `[${log.time}] ${log.message}`);

console.log(recentFirst);
// [
//   '[10:15] Ошибка авторизации',
//   '[10:10] Первый запрос',
//   '[10:05] Подключение к БД',
//   '[10:00] Сервер запущен'
// ]

// Исходный массив logs не изменён
```

## Метод with

`with` — иммутабельный способ заменить элемент по индексу. Это функциональная альтернатива прямому присвоению `array[index] = value`.

### Синтаксис

```javascript
array.with(index, value)
```

`index` — позиция элемента (поддерживаются отрицательные значения, отсчёт с конца). `value` — новое значение на этой позиции.

### Базовый пример

```javascript
const colors = ['красный', 'зелёный', 'синий'];
const updated = colors.with(1, 'жёлтый');

console.log(updated); // ['красный', 'жёлтый', 'синий']
console.log(colors);  // ['красный', 'зелёный', 'синий'] — без изменений
```

### Отрицательные индексы

Метод `with` поддерживает отрицательные индексы, как `at()`:

```javascript
const items = ['a', 'b', 'c', 'd', 'e'];

console.log(items.with(-1, 'z')); // ['a', 'b', 'c', 'd', 'z']
console.log(items.with(-2, 'y')); // ['a', 'b', 'c', 'y', 'e']
console.log(items);               // ['a', 'b', 'c', 'd', 'e'] — без изменений
```

### Обновление объектов в массиве

Особенно полезен `with` при работе со списками объектов, где нужно заменить один элемент:

```javascript
const todos = [
  { id: 1, text: 'Купить молоко', done: false },
  { id: 2, text: 'Прочитать книгу', done: false },
  { id: 3, text: 'Сделать зарядку', done: false },
];

function toggleTodo(todos, id) {
  const index = todos.findIndex(todo => todo.id === id);
  if (index === -1) return todos;

  return todos.with(index, {
    ...todos[index],
    done: !todos[index].done,
  });
}

const updated = toggleTodo(todos, 2);

console.log(updated);
// [
//   { id: 1, text: 'Купить молоко', done: false },
//   { id: 2, text: 'Прочитать книгу', done: true },
//   { id: 3, text: 'Сделать зарядку', done: false },
// ]

console.log(todos[1].done); // false — исходный не изменён
```

### Сравнение со старым подходом

```javascript
// Старый способ — мутирует исходный массив
const arr = [10, 20, 30, 40];
arr[2] = 99;
console.log(arr); // [10, 20, 99, 40] — исходный изменён

// Иммутабельный способ через spread
const arr2 = [10, 20, 30, 40];
const updated2 = [...arr2.slice(0, 2), 99, ...arr2.slice(3)];
console.log(arr2);    // [10, 20, 30, 40]
console.log(updated2); // [10, 20, 99, 40]

// С методом with — лаконично и читаемо
const arr3 = [10, 20, 30, 40];
const updated3 = arr3.with(2, 99);
console.log(arr3);    // [10, 20, 30, 40]
console.log(updated3); // [10, 20, 99, 40]
```

## Сочетание методов в цепочках

Все три метода возвращают новый массив, поэтому их легко комбинировать:

```javascript
const scores = [
  { player: 'Алексей', score: 450 },
  { player: 'Мария', score: 820 },
  { player: 'Иван', score: 310 },
  { player: 'Ольга', score: 670 },
];

// Обновить счёт Ивана, отсортировать по убыванию и показать первых трёх
const ivanIndex = scores.findIndex(s => s.player === 'Иван');

const topThree = scores
  .with(ivanIndex, { ...scores[ivanIndex], score: 950 })
  .toSorted((a, b) => b.score - a.score)
  .slice(0, 3);

console.log(topThree);
// [
//   { player: 'Иван', score: 950 },
//   { player: 'Мария', score: 820 },
//   { player: 'Ольга', score: 670 },
// ]

console.log(scores[ivanIndex].score); // 310 — исходный не изменён
```

## Обработка разреженных массивов

Все три метода обрабатывают разреженные массивы (массивы с «дырами») единообразно — пустые слоты заменяются значением `undefined`:

```javascript
const sparse = [1, , 3]; // разреженный массив

console.log(sparse.toReversed()); // [3, undefined, 1]
console.log(sparse.toSorted());   // [1, 3, undefined]
console.log(sparse.with(1, 99));  // [1, 99, 3]

console.log(sparse); // [1, empty, 3] — исходный не изменён
```

Это отличает их от `sort()` и `reverse()`, которые сохраняют пустые слоты на месте.

## Поддержка в браузерах и окружениях

Все три метода вошли в спецификацию ES2023 и доступны в:

- Chrome 110+
- Firefox 115+
- Safari 16+
- Node.js 20+

Для поддержки более старых окружений можно использовать полифилы из `core-js`:

```javascript
import 'core-js/actual/array/to-sorted';
import 'core-js/actual/array/to-reversed';
import 'core-js/actual/array/with';
```

Либо написать простые полифилы вручную:

```javascript
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

if (!Array.prototype.with) {
  Array.prototype.with = function(index, value) {
    const arr = [...this];
    const i = index < 0 ? arr.length + index : index;
    arr[i] = value;
    return arr;
  };
}
```

## Когда использовать иммутабельные методы

Предпочитайте `toSorted`, `toReversed` и `with` в следующих ситуациях:

**В компонентах React и Vue.** Прямая мутация массива из props или state приводит к непредсказуемому поведению и пропущенным ре-рендерам.

**При работе с данными, которые нельзя изменять.** Если массив приходит из внешнего API, кэша или является частью неизменяемой структуры — мутации могут сломать логику в других частях приложения.

**В функциональном стиле.** При написании чистых функций, которые не производят побочных эффектов, иммутабельные методы — правильный выбор по умолчанию.

**В коде, где важна предсказуемость.** Чем меньше мест, где данные могут неожиданно измениться, тем проще отлаживать и тестировать код.

## Итог

`toSorted`, `toReversed` и `with` — это не замена старым методам, а дополнение к ним. В задачах, где скорость и экономия памяти критичны (например, обработка больших массивов в узком цикле), мутирующие методы по-прежнему уместны. Но во всех остальных случаях — особенно в UI-коде и при работе с состоянием — иммутабельные версии делают код безопаснее и понятнее без лишних усилий.

Освоить современный JavaScript с его новыми возможностями и научиться писать профессиональный код можно на курсе [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=tosorted-toreversed-with).