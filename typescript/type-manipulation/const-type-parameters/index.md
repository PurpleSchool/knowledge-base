---
metaTitle: "TypeScript const в параметрах дженериков (const type parameters)"
metaDescription: "Как работает модификатор const в параметрах дженериков TypeScript 5.0: инференс литеральных типов, отличия от as const, практические примеры."
author: "Антон Ларичев"
title: "const в параметрах дженериков TypeScript"
preview: "Разбираем модификатор const в параметрах дженериков: зачем он нужен, как TypeScript 5.0 изменил инференс типов и когда это реально помогает."
---

## Проблема расширения типов при инференсе

Когда TypeScript выводит тип обобщённого параметра из переданного значения, он по умолчанию **расширяет** (widens) его до базового типа. Это удобно в большинстве ситуаций, но иногда приводит к потере точности.

```typescript
function identity<T>(value: T): T {
  return value;
}

const result = identity([1, 2, 3]);
// result: number[]  — информация о конкретных элементах утеряна

const label = identity('hello');
// label: string  — не 'hello', а просто string
```

До TypeScript 5.0 единственным способом сохранить литеральный тип было добавить `as const` на стороне вызова:

```typescript
const result = identity([1, 2, 3] as const);
// result: readonly [1, 2, 3]  — точный тип кортежа

const label = identity('hello' as const);
// label: 'hello'
```

Это работает, но требует от каждого вызывающего помнить про `as const` — неудобно и ненадёжно.

## Модификатор const в параметрах дженериков

TypeScript 5.0 добавил возможность поставить `const` перед именем параметра типа прямо в объявлении функции. Это меняет стратегию инференса: TypeScript начинает выводить самый узкий возможный тип, как если бы вызывающий сам написал `as const`.

```typescript
function identity<const T>(value: T): T {
  return value;
}

const result = identity([1, 2, 3]);
// result: readonly [1, 2, 3]  — кортеж с литеральными типами

const label = identity('hello');
// label: 'hello'  — литеральный строковый тип

const config = identity({ host: 'localhost', port: 3000 });
// config: { readonly host: 'localhost'; readonly port: 3000 }
```

Модификатор `const` в объявлении избавляет от необходимости писать `as const` при каждом вызове.

## Синтаксис

Модификатор ставится перед именем параметра в угловых скобках:

```typescript
// Функция
function fn<const T>(arg: T): T { ... }

// Стрелочная функция
const fn = <const T>(arg: T): T => arg;

// Метод класса
class Builder {
  add<const T>(item: T): this { ... }
}

// Интерфейс / тип
interface Converter<const T> {
  convert(value: T): string;
}
```

Допускается несколько параметров, `const` можно применить к любому из них или ко всем:

```typescript
function pair<const A, const B>(a: A, b: B): [A, B] {
  return [a, b];
}

const p = pair('x', 42);
// p: ['x', 42]  — кортеж из литеральных типов
```

## Практический пример: построитель маршрутов

Один из наиболее наглядных случаев применения — функции, принимающие массивы строк-констант и возвращающие их тип как объединение (union) или кортеж.

```typescript
function defineRoutes<const T extends readonly string[]>(routes: T): T {
  return routes;
}

const routes = defineRoutes(['/home', '/about', '/contact']);
// routes: readonly ['/home', '/about', '/contact']

type Route = typeof routes[number];
// Route: '/home' | '/about' | '/contact'
```

Без `const` тип был бы `string[]` и строгий контроль маршрутов стал бы невозможным.

## Пример: типобезопасный event emitter

```typescript
type EventMap = Record<string, unknown>;

function createEmitter<const Events extends EventMap>(
  _events: Events
) {
  const listeners = new Map<keyof Events, Set<(data: unknown) => void>>();

  return {
    on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler as (data: unknown) => void);
    },
    emit<K extends keyof Events>(event: K, data: Events[K]) {
      listeners.get(event)?.forEach(fn => fn(data));
    },
  };
}

const emitter = createEmitter({
  login: { userId: '' as string },
  logout: { userId: '' as string },
  pageView: { path: '' as string },
});

// TypeScript знает точные имена событий и типы данных
emitter.on('login', ({ userId }) => console.log(userId));
emitter.emit('pageView', { path: '/about' });

// Ошибка компиляции — нет такого события
// emitter.on('click', () => {});
```

## Пример: безопасный доступ по ключам

```typescript
function pick<const T extends object, const K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

const user = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' };

const preview = pick(user, ['id', 'name']);
// preview: { id: number; name: string }

// Ошибка — 'password' не является ключом объекта
// const bad = pick(user, ['id', 'password']);
```

## Отличия от as const

Важно понимать, что `const` в параметре дженерика и `as const` — разные механизмы.

```typescript
function withAs<T>(value: T): T {
  return value;
}

function withConst<const T>(value: T): T {
  return value;
}

// as const применяется снаружи и меняет выражение целиком
const a = withAs({ x: 1, y: [2, 3] } as const);
// a: { readonly x: 1; readonly y: readonly [2, 3] }

// const-параметр применяется при инференсе
const b = withConst({ x: 1, y: [2, 3] });
// b: { readonly x: 1; readonly y: readonly [2, 3] }
```

Результат в большинстве случаев идентичен, но есть различия:

| Аспект | `as const` | `const`-параметр |
|---|---|---|
| Где указывается | На стороне вызова | В объявлении функции |
| Применение | К конкретному выражению | Ко всем вызовам функции |
| Рекурсивность | Полная (вложенные объекты) | Полная |
| Требует изменений у вызывающего | Да | Нет |

### Когда as const всё же нужен

Если передаётся переменная, а не литерал, `const`-параметр не поможет — расширение уже произошло при объявлении переменной:

```typescript
const arr = [1, 2, 3];  // тип: number[]

const result = withConst(arr);
// result: number[]  — const-параметр не отменяет уже произошедшее расширение

// Чтобы получить кортеж, нужно объявить с as const
const arrConst = [1, 2, 3] as const;  // тип: readonly [1, 2, 3]
const result2 = withConst(arrConst);
// result2: readonly [1, 2, 3]
```

## Взаимодействие с ограничениями (extends)

`const` хорошо сочетается с `extends`, сужая тип внутри заданного ограничения:

```typescript
function parseConfig<const T extends Record<string, string | number | boolean>>(
  config: T
): T {
  return config;
}

const cfg = parseConfig({
  debug: true,
  port: 8080,
  host: 'localhost',
});
// cfg: { readonly debug: true; readonly port: 8080; readonly host: 'localhost' }
```

Если значение не соответствует ограничению, TypeScript выдаёт ошибку как обычно:

```typescript
// Ошибка: null не входит в string | number | boolean
// parseConfig({ key: null });
```

## Ограничения и подводные камни

### Примитивы без эффекта

Для примитивов разница незначительна: TypeScript и без `const` часто выводит литеральный тип при присвоении константе.

```typescript
const x = 42;       // тип: 42 (и так литерал)
let y = 42;         // тип: number

const a = withConst(42);  // 42
const b = withConst(y);   // number — переменная уже расширена
```

### Не работает с классами инициализированными через new

```typescript
const map = withConst(new Map([['a', 1]]));  
// Map<string, number> — const не влияет на экземпляры классов
```

### Осторожно с мутацией

`const`-параметр добавляет `readonly` к выведенному типу. Если функция пытается мутировать значение, TypeScript выдаст ошибку:

```typescript
function sortItems<const T extends number[]>(items: T): T {
  items.sort();  // Ошибка: cannot assign to a readonly property
  return items;
}

// Решение: работать с копией или не использовать const-параметр
function sortItems<T extends number[]>(items: T): T {
  items.sort();
  return items;
}
```

## Когда использовать const-параметры

Модификатор `const` в параметрах дженериков наиболее полезен в следующих сценариях:

- Функции, возвращающие тип аргумента «как есть» (identity-подобные)
- Построители конфигураций, маршрутов, схем
- Функции-хелперы для определения типов (defineRoutes, createSlice, createStore)
- Event emitter'ы и шинообразные паттерны с фиксированным набором событий
- Утилиты для работы с массивами констант (pick, omit, pluck)

Не стоит злоупотреблять там, где широкий тип — именно то, что нужно, или где функция принимает переменные, а не литералы.

## Итог

Модификатор `const` в параметрах дженериков — элегантное решение проблемы расширения типов при инференсе. Он переносит ответственность с вызывающего кода на объявление функции, делая API строже и удобнее одновременно. Используйте его всякий раз, когда хотите сохранить литеральные типы аргументов без требования `as const` от пользователей функции.

Для глубокого изучения системы типов TypeScript, дженериков и инференса смотрите курс на PurpleSchool: [TypeScript с нуля до профессионала](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=const-type-parameters)