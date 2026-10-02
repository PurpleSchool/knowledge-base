---
metaTitle: "Мемоизация функций в JavaScript — кэширование результатов"
metaDescription: "Мемоизация в JavaScript: реализация кэширования результатов функций, работа с Map, TTL-кэш, обработка сложных аргументов и реальные примеры применения."
author: "Антон Ларичев"
title: "Мемоизация функций и кэширование результатов"
preview: "Разбираем мемоизацию в JavaScript: от простой реализации до кэша с TTL и обработкой сложных аргументов."
---

## Что такое мемоизация

Мемоизация — техника оптимизации, при которой функция сохраняет результаты своих вычислений и при повторном вызове с теми же аргументами возвращает кэшированное значение вместо повторного вычисления.

Суть идеи проста: если функция детерминирована (при одних и тех же входных данных всегда даёт одинаковый результат), нет смысла вычислять её снова.

```javascript
// Без мемоизации — вычисляем каждый раз
function slowSquare(n) {
  // Имитация тяжёлого вычисления
  for (let i = 0; i < 1e6; i++) {}
  return n * n;
}

slowSquare(5); // долго
slowSquare(5); // снова долго
slowSquare(5); // снова долго
```

С мемоизацией второй и последующие вызовы с теми же аргументами возвращают результат мгновенно.

## Базовая реализация

Простейший вариант — функция-обёртка, которая использует замыкание для хранения кэша:

```javascript
function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

Пример использования:

```javascript
function heavyCalculation(n) {
  console.log(`Вычисляем для ${n}...`);
  return n * n;
}

const memoizedCalc = memoize(heavyCalculation);

console.log(memoizedCalc(5));  // Вычисляем для 5... → 25
console.log(memoizedCalc(5));  // (из кэша) → 25
console.log(memoizedCalc(10)); // Вычисляем для 10... → 100
console.log(memoizedCalc(5));  // (из кэша) → 25
```

Второй вызов `memoizedCalc(5)` не выводит строку в консоль — вычисления не было.

## Почему Map лучше обычного объекта

В старых реализациях кэш хранили в `{}`. Это работает, но у `Map` есть преимущества:

- Ключи могут быть любого типа, не только строки
- `Map` не имеет собственных ключей вроде `constructor` или `toString`, которые могут конфликтовать с данными
- Методы `has`, `get`, `set` семантически точнее для задачи кэширования
- `Map` эффективнее при большом количестве операций чтения/записи

```javascript
// Проблема с объектом-кэшем
const cache = {};
cache['constructor']; // не undefined! Это встроенное свойство объекта

// С Map — чисто
const map = new Map();
map.get('constructor'); // undefined — всё предсказуемо
```

## Мемоизация с несколькими аргументами

Функция выше уже поддерживает несколько аргументов через `JSON.stringify(args)`. Разберём нюансы:

```javascript
function add(a, b) {
  return a + b;
}

const memoizedAdd = memoize(add);

memoizedAdd(1, 2); // ключ: '[1,2]' → 3
memoizedAdd(2, 1); // ключ: '[2,1]' → 3 (новое вычисление!)
```

Обратите внимание: `memoizedAdd(1, 2)` и `memoizedAdd(2, 1)` — это разные ключи, даже если результат одинаков. Для коммутативных операций это неоптимально, но в общем случае правильно: порядок аргументов имеет значение.

## Работа со сложными аргументами

`JSON.stringify` не всегда подходит в роли ключа. Рассмотрим проблемные случаи:

```javascript
// Функции не сериализуются
JSON.stringify([() => {}]); // '[null]'

// undefined теряется
JSON.stringify([undefined, 1]); // '[null,1]'

// Циклические ссылки вызовут ошибку
const obj = {};
obj.self = obj;
JSON.stringify([obj]); // TypeError: Converting circular structure to JSON

// Объекты с одинаковым содержимым, но разными ссылками
JSON.stringify([{a: 1}]) === JSON.stringify([{a: 1}]); // true — это нормально
```

Для большинства реальных задач `JSON.stringify` достаточен. Если нужна поддержка функций или циклических ссылок, можно написать собственную функцию сериализации или использовать WeakMap для кэширования по ссылке на объект.

### Кэширование по ссылке на объект

Если аргумент — объект, и важна идентичность по ссылке (а не по содержимому), используют `WeakMap`:

```javascript
function memoizeByRef(fn) {
  const cache = new WeakMap();

  return function (obj) {
    if (cache.has(obj)) {
      return cache.get(obj);
    }

    const result = fn(obj);
    cache.set(obj, result);
    return result;
  };
}

const processUser = memoizeByRef((user) => {
  console.log('Обрабатываем пользователя...');
  return { ...user, processed: true };
});

const user = { id: 1, name: 'Иван' };
processUser(user); // Обрабатываем пользователя...
processUser(user); // (из кэша)

const sameData = { id: 1, name: 'Иван' };
processUser(sameData); // Обрабатываем пользователя... — другая ссылка!
```

`WeakMap` дополнительно позволяет объектам-ключам быть удалёнными сборщиком мусора — кэш не будет удерживать их в памяти.

## Кэш с ограничением по времени (TTL)

Иногда кэшированные данные устаревают. Добавим параметр TTL (time-to-live) — время жизни записи в миллисекундах:

```javascript
function memoizeWithTTL(fn, ttl) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    const now = Date.now();

    if (cache.has(key)) {
      const { value, expiresAt } = cache.get(key);
      if (now < expiresAt) {
        return value;
      }
      // Запись устарела — удаляем
      cache.delete(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, {
      value: result,
      expiresAt: now + ttl,
    });
    return result;
  };
}
```

Пример: кэширование результата API-запроса на 5 секунд:

```javascript
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

const cachedFetchUser = memoizeWithTTL(fetchUserData, 5000);

await cachedFetchUser(42); // Запрос к серверу
await cachedFetchUser(42); // Из кэша (быстро)

// Через 5 секунд:
await cachedFetchUser(42); // Снова запрос к серверу
```

## Кэш с ограничением размера (LRU)

При долгой работе кэш может бесконечно расти. Классическое решение — LRU (Least Recently Used): когда кэш достигает максимального размера, вытесняется наименее используемая запись.

```javascript
function memoizeLRU(fn, maxSize = 100) {
  // Map сохраняет порядок вставки — это свойство используется для LRU
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      // Перемещаем в конец (недавно использованный)
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = fn.apply(this, args);

    if (cache.size >= maxSize) {
      // Удаляем первый (самый давно использованный) ключ
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  };
}

const memoized = memoizeLRU(heavyFn, 50);
```

Эта реализация опирается на поведение `Map`: итерация по ключам идёт в порядке вставки, поэтому первый ключ — самый старый.

## Практический пример: числа Фибоначчи

Классический пример, где мемоизация даёт драматический прирост производительности:

```javascript
// Без мемоизации — экспоненциальная сложность O(2^n)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

console.time('без мемоизации');
fib(40); // занимает несколько секунд
console.timeEnd('без мемоизации');
```

```javascript
// С мемоизацией — линейная сложность O(n)
const fibMemo = memoize(function fib(n) {
  if (n <= 1) return n;
  return fibMemo(n - 1) + fibMemo(n - 2);
});

console.time('с мемоизацией');
fibMemo(40); // мгновенно
console.timeEnd('с мемоизацией');

fibMemo(40); // снова мгновенно — из кэша
```

Важный момент: внутри функции используется `fibMemo`, а не `fib`, иначе рекурсивные вызовы не будут пользоваться кэшем.

## Практический пример: дорогие вычисления в UI

Мемоизация особенно полезна при вычислениях, которые запускаются на каждое действие пользователя:

```javascript
const filterAndSortProducts = memoize((products, category, sortBy) => {
  console.log('Фильтрация и сортировка...');

  return products
    .filter((p) => p.category === category)
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
});

// При повторном рендере с теми же параметрами — мгновенно
const result = filterAndSortProducts(products, 'electronics', 'price');
```

Однако здесь есть нюанс: `JSON.stringify(products)` при большом массиве сам по себе может быть дорогой операцией. В таких случаях стоит рассмотреть мемоизацию по ссылке (`WeakMap`) или использовать специализированные библиотеки.

## Мемоизация методов класса

Для методов класса нужно учитывать контекст `this`:

```javascript
class Calculator {
  constructor(precision) {
    this.precision = precision;
    // Привязываем мемоизированную версию к экземпляру
    this.computeExpensive = memoize(this.computeExpensive.bind(this));
  }

  computeExpensive(x, y) {
    console.log('Вычисление...');
    return parseFloat((x * y * this.precision).toFixed(2));
  }
}

const calc = new Calculator(1.5);
calc.computeExpensive(3, 4); // Вычисление... → 18
calc.computeExpensive(3, 4); // (из кэша) → 18
```

Альтернатива — декоратор (если проект поддерживает соответствующий синтаксис).

## Ограничения и когда не использовать мемоизацию

### Функции с побочными эффектами

Мемоизация не подходит для функций, которые должны выполнять действия при каждом вызове:

```javascript
// Плохой кандидат для мемоизации
function logAndReturn(value) {
  console.log(`Logging: ${value}`); // побочный эффект
  sendToAnalytics(value);           // побочный эффект
  return value;
}
```

При повторном вызове из кэша побочные эффекты не выполнятся.

### Функции, которые вызываются редко или с уникальными аргументами

Кэш никогда не даст попадания — только лишний расход памяти:

```javascript
// Каждый запрос уникален — мемоизация бесполезна
const memoizedRandom = memoize(() => Math.random()); // антипаттерн
```

### Утечки памяти

Кэш растёт бесконечно без LRU или TTL. При работе с большим количеством уникальных аргументов следите за потреблением памяти.

### Изменяемые аргументы

```javascript
const process = memoize((arr) => arr.sort());

const data = [3, 1, 2];
process(data); // [1, 2, 3] — и оригинальный массив тоже изменён!
data.push(0);  // Добавляем элемент
process(data); // Возвращает старый кэшированный результат — баг!
```

При изменяемых аргументах кэш становится некорректным. Либо работайте с иммутабельными данными, либо используйте глубокое клонирование.

## Отличие от debounce и throttle

Важно не путать мемоизацию с другими техниками оптимизации:

| Техника | Что делает |
|---|---|
| Мемоизация | Кэширует результат по аргументам, пропускает вычисление |
| Debounce | Откладывает выполнение до конца серии событий |
| Throttle | Ограничивает частоту вызовов по времени |

Debounce и throttle управляют тем, *когда* выполняется функция. Мемоизация управляет тем, *выполняется ли* она вообще.

## Готовые реализации

Вместо написания своей реализации можно использовать проверенные библиотеки:

```bash
npm install lodash
```

```javascript
import memoize from 'lodash/memoize';

const memoizedFn = memoize(expensiveFunction);

// Кастомный resolver для ключа
const memoizedWithKey = memoize(
  (user, settings) => computeLayout(user, settings),
  (user, settings) => `${user.id}-${settings.theme}`
);
```

Lodash позволяет передать второй аргумент — функцию-резолвер для генерации ключа кэша, что удобнее `JSON.stringify` в ряде случаев.

## Итог

Мемоизация — инструмент с чётким применением: детерминированные функции с тяжёлыми вычислениями, которые вызываются повторно с одними и теми же аргументами. Базовая реализация на `Map` + замыкание решает большинство задач. Для production-кода добавляйте TTL или LRU, чтобы контролировать потребление памяти.

Ключевые решения при внедрении мемоизации:
- Как генерируется ключ кэша (`JSON.stringify` vs `WeakMap` vs кастомный резолвер)
- Нужно ли ограничение по размеру кэша (LRU)
- Нужно ли ограничение по времени жизни записи (TTL)
- Не имеет ли функция побочных эффектов, которые нельзя пропускать

Для глубокого понимания JavaScript и его возможностей оптимизации рекомендуем курс [JavaScript для разработчиков](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=memoization) на PurpleSchool.