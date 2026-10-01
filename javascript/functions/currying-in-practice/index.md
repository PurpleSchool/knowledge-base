---
metaTitle: "Каррирование функций в JavaScript — практическое руководство"
metaDescription: "Разбираем каррирование функций в JavaScript: что это такое, как реализовать curry, примеры использования в реальных проектах."
author: "Антон Ларичев"
title: "Каррирование функций на практике"
preview: "Каррирование — это преобразование функции с несколькими аргументами в цепочку функций с одним аргументом. Разбираем на практических примерах."
---

## Что такое каррирование

Каррирование (currying) — это техника функционального программирования, при которой функция с несколькими аргументами преобразуется в последовательность функций, каждая из которых принимает ровно один аргумент.

Название происходит от имени математика Хаскелла Карри, хотя саму идею впервые описал Моисей Шейнфинкель.

Простейший пример: обычная функция сложения выглядит так:

```javascript
function add(a, b) {
  return a + b;
}

add(2, 3); // 5
```

Каррированная версия той же функции:

```javascript
function curriedAdd(a) {
  return function(b) {
    return a + b;
  };
}

curriedAdd(2)(3); // 5
```

Функция `curriedAdd` принимает `a` и возвращает новую функцию, которая принимает `b` и возвращает результат. Вызов происходит через цепочку скобок.

## Ручное каррирование

До того как перейти к автоматизации, важно понять ручной подход — он хорошо показывает механику.

```javascript
function multiply(a) {
  return function(b) {
    return function(c) {
      return a * b * c;
    };
  };
}

multiply(2)(3)(4); // 24

// Можно разбить на шаги
const double = multiply(2);
const sixTimes = double(3);
sixTimes(4); // 24
```

Здесь виден ключевой эффект каррирования — возможность зафиксировать часть аргументов и получить специализированную функцию. `double` — это `multiply(2)`, то есть функция, которая всегда умножает на 2.

Со стрелочными функциями запись становится лаконичнее:

```javascript
const multiply = a => b => c => a * b * c;

const double = multiply(2);
double(5)(3); // 30
```

## Универсальная функция curry

Ручное каррирование для каждой функции — утомительно. На практике пишут универсальную функцию `curry`, которая автоматически каррирует любую функцию.

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}
```

Как это работает:

1. `fn.length` — это количество параметров исходной функции.
2. Если переданных аргументов достаточно (`args.length >= fn.length`), вызываем исходную функцию.
3. Если аргументов не хватает, возвращаем новую функцию, которая ждёт остальные аргументы и вызывает `curried` заново с объединёнными аргументами.

Пример использования:

```javascript
function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);

curriedSum(1)(2)(3);   // 6
curriedSum(1, 2)(3);   // 6
curriedSum(1)(2, 3);   // 6
curriedSum(1, 2, 3);   // 6
```

Универсальная `curry` поддерживает смешанный вызов — аргументы можно передавать по одному или группами в любом сочетании.

## Практические примеры

### Фильтрация и трансформация массивов

Один из самых распространённых случаев применения — создание переиспользуемых предикатов и трансформаторов для работы с массивами.

```javascript
const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
};

const filter = curry((predicate, array) => array.filter(predicate));
const map = curry((transform, array) => array.map(transform));
const reduce = curry((reducer, initial, array) => array.reduce(reducer, initial));

// Создаём специализированные функции
const filterEven = filter(x => x % 2 === 0);
const double = map(x => x * 2);
const sum = reduce((acc, x) => acc + x, 0);

const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

filterEven(numbers);  // [2, 4, 6, 8]
double(numbers);      // [2, 4, 6, 8, 10, 12, 14, 16]
sum(numbers);         // 36
```

### Валидация данных

Каррирование удобно для построения гибких валидаторов:

```javascript
const validate = curry((rule, errorMessage, value) => {
  if (!rule(value)) {
    return { valid: false, error: errorMessage };
  }
  return { valid: true, error: null };
});

const isNotEmpty = validate(value => value.trim().length > 0);
const isEmail = validate(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
const isMinLength = curry((min, value) => value.length >= min);

const validateRequired = isNotEmpty('Поле не может быть пустым');
const validateEmail = isEmail('Введите корректный email');
const validatePassword = validate(isMinLength(8), 'Минимум 8 символов');

console.log(validateRequired(''));            // { valid: false, error: 'Поле не может быть пустым' }
console.log(validateEmail('test@mail.ru'));   // { valid: true, error: null }
console.log(validatePassword('12345'));       // { valid: false, error: 'Минимум 8 символов' }
```

### Логирование с контекстом

```javascript
const log = curry((level, context, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [${context}]: ${message}`);
});

const logError = log('ERROR');
const logInfo = log('INFO');

const authLogger = logError('AUTH');
const dbLogger = logInfo('DATABASE');

authLogger('Неверный пароль для пользователя admin');
// [2026-10-01T12:00:00.000Z] [ERROR] [AUTH]: Неверный пароль для пользователя admin

dbLogger('Соединение установлено');
// [2026-10-01T12:00:00.000Z] [INFO] [DATABASE]: Соединение установлено
```

### HTTP-запросы

```javascript
const fetchData = curry(async (baseUrl, headers, endpoint) => {
  const response = await fetch(`${baseUrl}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json();
});

const apiRequest = fetchData('https://api.example.com');

const authenticatedRequest = apiRequest({
  'Authorization': 'Bearer token123',
  'Content-Type': 'application/json',
});

// Теперь достаточно передать только endpoint
authenticatedRequest('/users');    // GET https://api.example.com/users
authenticatedRequest('/products'); // GET https://api.example.com/products
```

## Каррирование и частичное применение

Эти два понятия часто путают, но между ними есть принципиальное различие.

**Каррирование** — преобразование функции `f(a, b, c)` в `f(a)(b)(c)`. Каждый вызов принимает ровно один аргумент.

**Частичное применение** — фиксация одного или нескольких аргументов функции для получения новой функции с меньшим числом параметров.

```javascript
// Частичное применение через bind
function add(a, b, c) {
  return a + b + c;
}

const add5 = add.bind(null, 5);    // фиксируем a = 5
add5(3, 2);  // 10

const add5and3 = add.bind(null, 5, 3); // фиксируем a = 5, b = 3
add5and3(2); // 10

// Частичное применение вручную
function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const multiply = (a, b, c) => a * b * c;
const triple = partial(multiply, 3);
triple(2, 4); // 24
```

Универсальная `curry` из предыдущего раздела фактически совмещает оба подхода — она позволяет как передавать аргументы по одному, так и группами.

## Композиция функций с каррированием

Каррирование особенно мощно в сочетании с функциональной композицией — техникой соединения нескольких функций в цепочку:

```javascript
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
};

const prop = curry((key, obj) => obj[key]);
const gt = curry((threshold, value) => value > threshold);
const map = curry((fn, arr) => arr.map(fn));
const filter = curry((fn, arr) => arr.filter(fn));

const users = [
  { name: 'Алексей', age: 28 },
  { name: 'Мария', age: 17 },
  { name: 'Дмитрий', age: 34 },
  { name: 'Анна', age: 15 },
];

// Получить имена пользователей старше 18 лет
const getAdultNames = pipe(
  filter(user => gt(17, user.age)),
  map(prop('name'))
);

getAdultNames(users); // ['Алексей', 'Дмитрий']
```

## Ограничения и подводные камни

### Функции с переменным числом аргументов

Универсальная `curry` опирается на `fn.length`, а это свойство не учитывает rest-параметры и значения по умолчанию:

```javascript
function broken(a, b = 0, ...rest) {
  return a + b;
}

console.log(broken.length); // 1 — b и rest не считаются!

const curriedBroken = curry(broken);
curriedBroken(1)(2); // не работает как ожидается
```

Для таких функций каррирование нужно делать вручную или явно указывать арность:

```javascript
function curryN(arity, fn) {
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

const sum = (...args) => args.reduce((a, b) => a + b, 0);
const curriedSum3 = curryN(3, sum);

curriedSum3(1)(2)(3); // 6
```

### Читаемость кода

Цепочки вроде `f(a)(b)(c)(d)` могут быть сложны для восприятия в команде, где не все знакомы с функциональным программированием. Используйте каррирование там, где оно действительно упрощает код, а не ради самого паттерна.

### Производительность

Каждый вызов в цепочке создаёт новое замыкание. В критических по производительности участках это может быть ощутимо. Для hot path предпочтительнее обычные функции.

## Итог

Каррирование — это инструмент, который позволяет:

- Создавать специализированные функции из общих, фиксируя часть аргументов.
- Строить читаемые конвейеры обработки данных через композицию.
- Писать более декларативный и переиспользуемый код.

Начните с простых случаев — каррированные предикаты для `filter` и трансформаторы для `map`. Это самый естественный способ почувствовать пользу от паттерна в реальном коде.

Чтобы глубоко освоить JavaScript, включая функциональные паттерны, замыкания и продвинутую работу с функциями, приходите на курс [JavaScript для профессионалов](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=currying-in-practice).