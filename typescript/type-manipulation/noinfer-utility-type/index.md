---
metaTitle: "NoInfer в TypeScript — управление выводом типов"
metaDescription: "Разбираем утилитный тип NoInfer в TypeScript 5.4: зачем нужен, как работает, практические примеры использования в дженериках."
author: "Антон Ларичев"
title: "Утилитный тип NoInfer в TypeScript"
preview: "NoInfer<T> — утилитный тип TypeScript 5.4, который запрещает выводить тип из конкретной позиции аргумента, делая дженерики предсказуемее."
---

## Что такое NoInfer

`NoInfer<T>` — это утилитный тип, появившийся в TypeScript 5.4. Он оборачивает тип `T` и сообщает компилятору: не используй эту позицию аргумента для вывода типового параметра дженерика. Вывод должен произойти из других мест, а данная позиция лишь проверяется на соответствие уже выведенному типу.

До появления `NoInfer` разработчики решали ту же задачу обходными путями — промежуточными дженериками, условными типами или приведением типов. Теперь в языке есть прямое и выразительное решение.

## Проблема, которую решает NoInfer

Чтобы понять, зачем нужен `NoInfer`, начнём с конкретного примера. Представьте функцию, которая принимает список допустимых значений и значение по умолчанию:

```typescript
function createSelect<T extends string>(
  options: T[],
  defaultValue: T
): { options: T[]; defaultValue: T } {
  return { options, defaultValue };
}
```

Идея проста: `defaultValue` должен быть одним из значений `options`. Проверим поведение:

```typescript
const select = createSelect(
  ['apple', 'banana', 'cherry'],
  'grape' // ожидаем ошибку — 'grape' нет в массиве
);
```

Ожидаем ошибку компилятора, но её нет. TypeScript выводит `T` сразу из двух позиций — из массива `options` и из `defaultValue`. Результирующий тип оказывается объединением: `'apple' | 'banana' | 'cherry' | 'grape'`. Значение `'grape'` входит в это объединение, и ошибки не возникает.

Проблема в том, что TypeScript по умолчанию собирает тип из всех позиций, где встречается `T`, объединяя их. Это удобно в большинстве случаев, но здесь ломает задуманную проверку.

### Попытки решить проблему без NoInfer

До TypeScript 5.4 применяли несколько обходных приёмов.

**Вариант 1 — дополнительный дженерик с ограничением:**

```typescript
function createSelect<T extends string, D extends T>(
  options: T[],
  defaultValue: D
): { options: T[]; defaultValue: D } {
  return { options, defaultValue };
}

// Теперь ошибка есть:
createSelect(['apple', 'banana'], 'grape');
// Argument of type '"grape"' is not assignable to parameter
// of type '"apple" | "banana"'
```

Решение работает, но загромождает сигнатуру лишним параметром `D`, который не несёт смысловой нагрузки для вызывающего кода.

**Вариант 2 — промежуточный тип через условный тип:**

```typescript
type NoExpand<T> = T extends unknown ? T : never;

function createSelect<T extends string>(
  options: T[],
  defaultValue: NoExpand<T>
): { options: T[]; defaultValue: T } {
  return { options, defaultValue };
}
```

Подобные трюки хрупкие, плохо читаются и их смысл неочевиден коллегам.

## Как работает NoInfer

`NoInfer<T>` говорит компилятору: при выводе типового параметра `T` игнорируй значение в этой позиции. После того как `T` выведен из других мест, значение в позиции `NoInfer<T>` просто проверяется на совместимость с уже известным типом.

Применим это к нашему примеру:

```typescript
function createSelect<T extends string>(
  options: T[],
  defaultValue: NoInfer<T>
): { options: T[]; defaultValue: T } {
  return { options, defaultValue };
}
```

Теперь `T` выводится только из `options`. Аргумент `defaultValue` не участвует в выводе — он лишь проверяется на соответствие выведенному `T`.

```typescript
// Ошибка: Argument of type '"grape"' is not assignable
// to parameter of type '"apple" | "banana" | "cherry"'
createSelect(['apple', 'banana', 'cherry'], 'grape');

// Корректно:
createSelect(['apple', 'banana', 'cherry'], 'apple');
```

Сигнатура остаётся чистой, поведение — предсказуемым.

## Практические примеры

### Функция с обратным вызовом и начальным состоянием

Часто встречается паттерн, где начальное значение задаёт тип состояния, а колбэк работает с этим типом:

```typescript
function createStore<TState>(
  initialState: TState,
  onChange: (state: NoInfer<TState>) => void
): { getState: () => TState } {
  let state = initialState;
  onChange(state);
  return { getState: () => state };
}
```

Без `NoInfer` TypeScript мог бы расширить `TState` на основе того, что возвращает или принимает `onChange`. С `NoInfer` тип `TState` фиксируется по `initialState`, и колбэк проверяется именно по нему:

```typescript
const store = createStore(
  { count: 0, name: 'app' },
  (state) => {
    // state: { count: number; name: string }
    console.log(state.count);
    console.log(state.missingField); // Ошибка!
  }
);
```

### Роутер с типизированными маршрутами

Рассмотрим упрощённый роутер, где нужно убедиться, что маршрут по умолчанию существует среди зарегистрированных:

```typescript
type Route = {
  path: string;
  component: () => void;
};

function createRouter<TPath extends string>(
  routes: Array<Route & { path: TPath }>,
  options: {
    defaultPath: NoInfer<TPath>;
    notFoundPath: NoInfer<TPath>;
  }
) {
  return { routes, ...options };
}

const router = createRouter(
  [
    { path: '/home', component: () => {} },
    { path: '/about', component: () => {} },
    { path: '/404', component: () => {} },
  ],
  {
    defaultPath: '/home',   // OK
    notFoundPath: '/admin', // Ошибка: '/admin' не зарегистрирован
  }
);
```

Тип `TPath` выводится только из массива `routes`. Оба поля в `options` проверяются по этому типу без участия в его выводе.

### Работа с картами событий

Типичный случай — системы событий, где тип данных привязан к имени события:

```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string; ctrlKey: boolean };
  resize: { width: number; height: number };
};

function createHandler<TEvent extends keyof EventMap>(
  eventName: TEvent,
  initialData: EventMap[TEvent],
  transform: (data: NoInfer<EventMap[TEvent]>) => void
): void {
  transform(initialData);
}

createHandler(
  'click',
  { x: 100, y: 200 },
  (data) => {
    // data: { x: number; y: number }
    console.log(data.x, data.y);
    console.log(data.key); // Ошибка: 'key' нет в типе клика
  }
);
```

### Значения перечисления с дефолтом

Практичный пример — функция-фабрика конфигурации, где нужно гарантировать, что значение по умолчанию входит в заданный набор:

```typescript
type Config<T extends string> = {
  values: readonly T[];
  defaultValue: T;
  placeholder: string;
};

function defineConfig<T extends string>(
  values: readonly T[],
  defaultValue: NoInfer<T>,
  placeholder: string
): Config<T> {
  if (!values.includes(defaultValue)) {
    throw new Error(`Default value "${defaultValue}" not in values`);
  }
  return { values, defaultValue, placeholder };
}

// Ошибка на этапе компиляции:
const sizeConfig = defineConfig(
  ['sm', 'md', 'lg', 'xl'] as const,
  'xxl',                         // Type '"xxl"' is not assignable
  'Выберите размер'
);

// Корректно:
const validConfig = defineConfig(
  ['sm', 'md', 'lg', 'xl'] as const,
  'md',
  'Выберите размер'
);
```

## NoInfer в стандартной библиотеке TypeScript

С версии 5.4 `NoInfer` используется в самой стандартной библиотеке TypeScript. Наиболее заметный пример — метод `Array.prototype.reduce`:

```typescript
// Упрощённая сигнатура из lib.es5.d.ts
reduce<U>(
  callbackfn: (
    previousValue: U,
    currentValue: T,
    currentIndex: number,
    array: T[]
  ) => U,
  initialValue: NoInfer<U>
): U;
```

Здесь тип `U` выводится из возвращаемого типа колбэка, а не из `initialValue`. Это означает, что TypeScript выберет тип на основе того, что возвращает ваша функция редукции, а `initialValue` будет проверен на соответствие:

```typescript
const result = [1, 2, 3].reduce(
  (acc, val) => ({ sum: acc.sum + val, count: acc.count + 1 }),
  { sum: 0, count: 0 } // Проверяется, но не влияет на вывод U
);
// result: { sum: number; count: number }
```

## Отличие от других подходов

### NoInfer vs as const

`as const` фиксирует литеральные типы на стороне вызова. `NoInfer` управляет выводом на уровне сигнатуры функции. Это разные уровни контроля:

```typescript
// as const влияет на тип переданного значения
createSelect(['apple', 'banana'] as const, 'grape');

// NoInfer влияет на то, какие позиции участвуют в выводе T
function createSelect<T extends string>(
  options: T[],
  defaultValue: NoInfer<T> // T выводится только из options
) {}
```

### NoInfer vs явное указание типа

Можно явно передать тип дженерика при вызове, но это перекладывает ответственность на вызывающего:

```typescript
// Вызывающий обязан указать тип вручную
createSelect<'apple' | 'banana'>(['apple', 'banana'], 'grape');
// Ошибка, но только потому что пользователь явно указал тип
```

`NoInfer` встраивает проверку в саму функцию, и вызывающий код остаётся чистым.

## Ограничения и нюансы

**NoInfer работает только с выводом, не с проверкой.** Если тип `T` задан явно при вызове дженерика, `NoInfer` не меняет поведения — `T` уже известен, вывод не нужен.

```typescript
function wrap<T>(value: T, extra: NoInfer<T>): T {
  return value;
}

// Здесь T выводится из value = string
wrap('hello', 42); // Ошибка: number не совместим со string

// Здесь T указан явно
wrap<string | number>('hello', 42); // OK — NoInfer не влияет
```

**Вложенные NoInfer.** Оборачивание `NoInfer<NoInfer<T>>` эквивалентно одному `NoInfer<T>`. Дополнительное оборачивание не добавляет эффекта.

**Взаимодействие с условными типами.** `NoInfer<T extends U ? A : B>` работает ожидаемо — ограничение применяется к внешнему параметру, а не к ветвям условного типа.

```typescript
type Conditional<T> = T extends string ? 'string' : 'other';

function test<T>(
  value: T,
  label: NoInfer<Conditional<T>> // вывод T только из value
) {}

test(42, 'other');   // OK: T = number, Conditional<number> = 'other'
test(42, 'string');  // Ошибка
test('hi', 'string'); // OK
```

## Версия TypeScript и поддержка

`NoInfer<T>` доступен начиная с TypeScript 5.4, выпущенного в марте 2024 года. Перед использованием убедитесь, что версия в проекте актуальна:

```bash
npx tsc --version
# Version 5.4.0 или выше
```

Если поддерживаете старые версии TypeScript, придётся использовать обходные пути через дополнительный типовой параметр:

```typescript
// Совместимость с TypeScript < 5.4
function createSelect<T extends string, D extends T>(
  options: T[],
  defaultValue: D
) {}

// TypeScript >= 5.4 — чище и прозрачнее
function createSelect<T extends string>(
  options: T[],
  defaultValue: NoInfer<T>
) {}
```

## Итог

`NoInfer<T>` решает классическую проблему дженериков: когда один аргумент должен задавать тип, а другой — только проверяться по нему. Без этого утилитного типа TypeScript объединял типы из всех позиций, что нарушало задуманную логику.

Основные сценарии применения:

- Значение по умолчанию, которое должно входить в набор допустимых значений
- Колбэк или обработчик, тип которого диктует `initialState`, а не он сам
- Поля конфигурации, зависящие от основного параметра функции
- Системы маршрутизации и событий с типизированными ключами

`NoInfer` делает намерение явным прямо в сигнатуре функции — ни скрытых трюков, ни лишних типовых параметров.

Для глубокого изучения системы типов TypeScript, включая продвинутые утилитные типы и работу с дженериками, приходите на курс по TypeScript на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=noinfer-utility-type