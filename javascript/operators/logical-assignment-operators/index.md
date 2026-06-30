---
metaTitle: "Логическое присваивание &&=, ||=, ??= в JavaScript"
metaDescription: "Операторы логического присваивания &&=, ||=, ??= в JavaScript: синтаксис, примеры, отличия от обычного присваивания и тернарного оператора."
author: "Антон Ларичев"
title: "Логическое присваивание (&&=, ||=, ??=)"
preview: "Операторы &&=, ||= и ??= объединяют логику и присваивание в одну строку — разбираем, как они работают и где применять."
---

## Что такое операторы логического присваивания

Операторы логического присваивания появились в JavaScript в стандарте ES2021. Они объединяют логическую операцию и присваивание в одном выражении и позволяют писать компактный, читаемый код при работе с условными значениями.

Всего таких операторов три:

- `||=` — присваивание через логическое ИЛИ
- `&&=` — присваивание через логическое И
- `??=` — присваивание через оператор нулевого слияния

Каждый из них работает по принципу «ленивого» вычисления: правая часть выражения выполняется только тогда, когда это необходимо.

## Оператор ||= (OR assignment)

### Синтаксис и принцип работы

Оператор `||=` присваивает значение переменной только в том случае, если текущее значение является ложным (falsy).

```javascript
x ||= y;
// Эквивалентно:
x || (x = y);
```

Обратите внимание: запись `x ||= y` не равнозначна `x = x || y`. Разница в том, что при `x ||= y` присваивание вообще не происходит, если `x` уже является истинным — это важно в случаях, когда установка значения вызывает побочные эффекты (например, сеттер в объекте).

### Пример использования

Типичная задача: задать значение по умолчанию, если переменная пуста.

```javascript
let username = '';
username ||= 'Гость';
console.log(username); // 'Гость'

let city = 'Москва';
city ||= 'Не указан';
console.log(city); // 'Москва'
```

Это удобная замена паттерна `if (!x) x = default`:

```javascript
// Было:
if (!config.timeout) {
  config.timeout = 3000;
}

// Стало:
config.timeout ||= 3000;
```

### Что считается falsy

Оператор `||=` срабатывает для всех ложных значений JavaScript:

```javascript
let a = null;
let b = undefined;
let c = 0;
let d = '';
let e = false;
let f = NaN;

a ||= 'новое'; // 'новое'
b ||= 'новое'; // 'новое'
c ||= 'новое'; // 'новое'
d ||= 'новое'; // 'новое'
e ||= 'новое'; // 'новое'
f ||= 'новое'; // 'новое'
```

Это означает, что `||=` заменит `0`, пустую строку и `false` — что иногда нежелательно.

## Оператор &&= (AND assignment)

### Синтаксис и принцип работы

Оператор `&&=` присваивает новое значение только в том случае, если текущее значение является истинным (truthy).

```javascript
x &&= y;
// Эквивалентно:
x && (x = y);
```

То есть: «если `x` существует и истинно — обнови его».

### Пример использования

```javascript
let user = { name: 'Иван', role: 'admin' };
user &&= { ...user, verified: true };
console.log(user); // { name: 'Иван', role: 'admin', verified: true }

let guest = null;
guest &&= { ...guest, verified: true };
console.log(guest); // null — присваивание не произошло
```

Практический пример — обновление вложенных данных без проверки существования:

```javascript
// Было:
if (element.dataset) {
  element.dataset.loaded = 'true';
}

// Стало:
element.dataset &&= { ...element.dataset, loaded: 'true' };
```

Ещё один распространённый случай — мутирование объекта только при его наличии:

```javascript
const cache = new Map();

function updateCache(key, value) {
  // Обновляем запись только если она уже есть в кеше
  cache.get(key) &&= value;
}
```

### Работа с DOM

`&&=` хорошо подходит для обновления DOM-элементов, которые могут отсутствовать:

```javascript
const tooltip = document.querySelector('.tooltip');
// Обновляем текст подсказки только если элемент существует
tooltip &&= Object.assign(tooltip, { textContent: 'Новый текст' });
```

## Оператор ??= (Nullish Coalescing Assignment)

### Синтаксис и принцип работы

Оператор `??=` присваивает значение только в том случае, если текущее значение равно `null` или `undefined` (nullish-значения).

```javascript
x ??= y;
// Эквивалентно:
x ?? (x = y);
```

Это ключевое отличие от `||=`: оператор `??=` не затрагивает `0`, пустую строку и `false`.

### Пример использования

```javascript
let score = 0;
score ??= 100;
console.log(score); // 0 — не перезаписано, так как 0 не является null/undefined

let title = '';
title ??= 'Без названия';
console.log(title); // '' — не перезаписано

let value = null;
value ??= 'по умолчанию';
console.log(value); // 'по умолчанию'

let missing = undefined;
missing ??= 42;
console.log(missing); // 42
```

### Инициализация настроек

`??=` идеально подходит для задания начальных значений конфигурации, где `0` и `false` являются допустимыми значениями:

```javascript
function createServer(options = {}) {
  options.port ??= 3000;
  options.host ??= 'localhost';
  options.debug ??= false;
  options.maxConnections ??= 100;

  return options;
}

console.log(createServer({ port: 8080, debug: false }));
// { port: 8080, host: 'localhost', debug: false, maxConnections: 100 }
// debug: false НЕ перезаписан на false по умолчанию — и это правильно
```

## Сравнение трёх операторов

Чтобы наглядно увидеть разницу между операторами, рассмотрим одни и те же значения:

```javascript
const values = [null, undefined, 0, '', false, NaN, 'данные', 42, true];

for (const val of values) {
  let a = val;
  let b = val;
  let c = val;

  a ||= 'заменено';
  b &&= 'заменено';
  c ??= 'заменено';

  console.log(`${String(val).padEnd(10)} ||= ${String(a).padEnd(10)} &&= ${String(b).padEnd(10)} ??= ${c}`);
}
```

Результат:

```
null       ||= заменено   &&= null       ??= заменено
undefined  ||= заменено   &&= undefined  ??= заменено
0          ||= заменено   &&= 0          ??= 0
           ||= заменено   &&=            ??= 
false      ||= заменено   &&= false      ??= false
NaN        ||= заменено   &&= NaN        ??= NaN
данные     ||= данные     &&= заменено   ??= данные
42         ||= 42         &&= заменено   ??= 42
true       ||= true       &&= заменено   ??= true
```

Таблица выбора оператора:

| Ситуация | Оператор |
|---|---|
| Заменить любое falsy значение | `\|\|=` |
| Обновить существующее (truthy) значение | `&&=` |
| Заменить только null/undefined | `??=` |

## Практические сценарии

### Инициализация состояния компонента

```javascript
class Component {
  constructor(props) {
    this.state = {};

    // Безопасная инициализация: не трогаем false и 0
    this.state.count ??= props.initialCount ?? 0;
    this.state.visible ??= props.visible ?? true;
    this.state.label ??= props.label ?? '';
  }
}
```

### Кеширование вычислений

```javascript
const memo = {};

function computeExpensive(key) {
  // Вычисляем только если значения нет в кеше
  memo[key] ??= heavyComputation(key);
  return memo[key];
}

function heavyComputation(key) {
  console.log(`Вычисляю для ${key}...`);
  return key.toUpperCase();
}

computeExpensive('hello'); // Вычисляю для hello...
computeExpensive('hello'); // Берёт из кеша, вывода нет
```

### Накопление данных

```javascript
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    // Создаём массив для группы только при первом появлении ключа
    groups[item[key]] ??= [];
    groups[item[key]].push(item);
    return groups;
  }, {});
}

const users = [
  { name: 'Алиса', role: 'admin' },
  { name: 'Боб', role: 'user' },
  { name: 'Виктор', role: 'admin' },
  { name: 'Галина', role: 'user' },
];

console.log(groupBy(users, 'role'));
// {
//   admin: [{ name: 'Алиса', role: 'admin' }, { name: 'Виктор', role: 'admin' }],
//   user:  [{ name: 'Боб', role: 'user' }, { name: 'Галина', role: 'user' }]
// }
```

### Обновление конфигурации

```javascript
const defaults = { theme: 'light', lang: 'ru', notifications: true };

function applyUserPreferences(config, userPrefs) {
  // &&= применяем только если userPrefs существует
  // ??= для каждого поля — берём из defaults только если не задано
  if (userPrefs) {
    for (const key of Object.keys(defaults)) {
      config[key] ??= userPrefs[key] ?? defaults[key];
    }
  } else {
    for (const key of Object.keys(defaults)) {
      config[key] ??= defaults[key];
    }
  }
  return config;
}

const result = applyUserPreferences(
  { theme: 'dark' },
  { lang: 'en', notifications: false }
);
// { theme: 'dark', lang: 'en', notifications: false }
```

## Ленивое вычисление правой части

Важная особенность всех трёх операторов — правая часть не вычисляется, если присваивание не нужно. Это отличает их от записи вида `x = x || y`:

```javascript
let counter = 0;

function sideEffect() {
  counter++;
  return 'значение';
}

let a = 'существующее';
a ||= sideEffect(); // sideEffect не вызывается, counter остаётся 0
console.log(counter); // 0

let b = null;
b ??= sideEffect(); // sideEffect вызывается, counter становится 1
console.log(counter); // 1
```

Это полезно, когда правая часть — дорогостоящая операция или функция с побочными эффектами.

## Чего не стоит делать

### Путать ||= и ??=

```javascript
// Ошибка: счётчик visits может быть 0, но его перезапишут
function trackVisit(stats) {
  stats.visits ||= 0; // Если visits === 0, всё равно присвоит 0, но логика неверна
}

// Правильно:
function trackVisit(stats) {
  stats.visits ??= 0; // Присвоит только если visits не задан
}
```

### Злоупотреблять &&= с объектами

```javascript
// Плохо: труднее читать, чем явная проверка
obj.nested &&= obj.nested.value &&= transform(obj.nested.value);

// Лучше: использовать опциональную цепочку
if (obj.nested?.value) {
  obj.nested.value = transform(obj.nested.value);
}
```

## Поддержка в браузерах и окружениях

Операторы логического присваивания доступны во всех современных браузерах и Node.js начиная с версии 15:

- Chrome 85+
- Firefox 79+
- Safari 14+
- Node.js 15+

При работе со старыми окружениями используйте Babel с плагином `@babel/plugin-proposal-logical-assignment-operators` или TypeScript, который компилирует их в совместимый код автоматически начиная с версии 4.0.

## Итог

Операторы логического присваивания позволяют писать лаконичный код для распространённых паттернов:

- `||=` — присвоить значение по умолчанию, если переменная содержит любое falsy значение
- `&&=` — обновить переменную только если она уже содержит truthy значение
- `??=` — присвоить значение по умолчанию только при `null` или `undefined`, не трогая `0`, `false` и пустую строку

Главное правило выбора: если нужно сохранить `0` и `false` как осмысленные значения — используйте `??=`, а не `||=`.

Для углублённого изучения JavaScript и современного синтаксиса пройдите курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=logical-assignment-operators