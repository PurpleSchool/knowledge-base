---
metaTitle: "Тип never в TypeScript: полное руководство"
metaDescription: "Разбираем тип never в TypeScript: когда возникает, как использовать для exhaustiveness check, условных типов и сужения."
author: "Антон Ларичев"
title: "Тип never в TypeScript"
preview: "Что такое тип never, где он появляется автоматически и как применять его для проверки полноты ветвлений и продвинутых манипуляций с типами."
---

## Что такое тип never

Тип `never` в TypeScript представляет множество значений, которые никогда не существуют. Это звучит парадоксально, но именно эта характеристика делает `never` мощным инструментом для моделирования ситуаций, которые по логике программы не должны наступить.

В системе типов TypeScript `never` является **нижним типом** (bottom type): он является подтипом любого другого типа, но ни один тип не является подтипом `never` (кроме самого `never`). Из этого следует, что переменной типа `never` нельзя присвоить значение — буквально никакое.

```typescript
// Ошибка компиляции: тип string не совместим с never
const x: never = "hello";

// Ошибка компиляции: тип number не совместим с never
const y: never = 42;
```

При этом переменную типа `never` можно присвоить переменной любого другого типа:

```typescript
declare const n: never;

const s: string = n;  // OK
const num: number = n; // OK
const obj: object = n; // OK
```

Это кажется странным на первый взгляд, но соответствует принципу подтипирования: если переменная никогда не существует, то приписать ей любой тип безопасно — такой код просто никогда не выполнится.

## Когда TypeScript выводит never автоматически

### Функции, которые никогда не возвращают управление

Компилятор автоматически выводит `never` как возвращаемый тип функции, если функция:

- всегда выбрасывает исключение;
- содержит бесконечный цикл без возможности выхода.

```typescript
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // ...
  }
}
```

Важно понимать разницу между `never` и `void`. Функция с типом `void` возвращает `undefined` — она всё же завершается. Функция с типом `never` не возвращает управление вызывающему коду никогда.

```typescript
function logMessage(msg: string): void {
  console.log(msg);
  // неявно возвращает undefined
}

function fail(msg: string): never {
  throw new Error(msg);
  // никогда не возвращает управление
}
```

### Сужение типов до невозможного состояния

Когда TypeScript сужает тип переменной в блоке условия до невозможного значения, в этом контексте переменная получает тип `never`.

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    // value: string
    console.log(value.toUpperCase());
  } else if (typeof value === "number") {
    // value: number
    console.log(value.toFixed(2));
  } else {
    // value: never — сюда попасть невозможно
    const _exhaustive: never = value;
  }
}
```

### Пересечение несовместимых типов

Если создать пересечение типов, которые не имеют общих значений, результатом будет `never`.

```typescript
type StringAndNumber = string & number; // never
type A = { a: string } & { a: number }; // { a: never }
```

## Проверка полноты ветвлений (exhaustiveness checking)

Одно из главных практических применений `never` — гарантировать, что все варианты дискриминированного объединения обработаны.

Представим типичный сценарий: есть объединение типов для событий в приложении.

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // shape здесь имеет тип never
      const _check: never = shape;
      throw new Error(`Неизвестная фигура: ${JSON.stringify(shape)}`);
  }
}
```

Если добавить новый вариант в `Shape`, не обновив `getArea`, TypeScript выдаст ошибку в блоке `default` — новый вариант не будет совместим с `never`.

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number }
  | { kind: "rectangle"; width: number; height: number }; // добавили новую фигуру

// Ошибка: тип '{ kind: "rectangle"; width: number; height: number }'
// не совместим с типом 'never'
function getArea(shape: Shape): number {
  switch (shape.kind) {
    // ... предыдущие case ...
    default:
      const _check: never = shape; // <-- ошибка здесь
      throw new Error("Неизвестная фигура");
  }
}
```

Вместо встроенного присваивания удобно вынести проверку в отдельную утилитарную функцию:

```typescript
function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Необработанное значение: ${JSON.stringify(value)}`);
}

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape); // ошибка компиляции, если забыли case
  }
}
```

Функция `assertNever` принимает `never` и сама возвращает `never`, поэтому её можно использовать напрямую в `return` — компилятор доволен, а в рантайме она выбросит ошибку, если вдруг туда всё же попали.

## never в условных типах

Тип `never` играет особую роль в условных типах. При дистрибуции условного типа по объединению `never` ведёт себя как пустое множество — результатом является `never`.

```typescript
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;         // "yes"
type B = IsString<number>;         // "no"
type C = IsString<string | number>; // "yes" | "no"
type D = IsString<never>;          // never
```

Последний случай — `IsString<never>` — возвращает `never`, потому что дистрибуция по пустому объединению даёт пустой результат.

Это поведение используется для фильтрации типов из объединения. Классический пример — утилитарный тип `Exclude`:

```typescript
type Exclude<T, U> = T extends U ? never : T;

type WithoutString = Exclude<string | number | boolean, string>;
// number | boolean
```

Когда `T = string | number | boolean`, TypeScript раскрывает тип дистрибутивно:
- `string extends string ? never : string` → `never`
- `number extends string ? never : number` → `number`
- `boolean extends string ? never : boolean` → `boolean`

Результат объединения: `never | number | boolean` = `number | boolean`.

На базе `Exclude` строится `NonNullable`:

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null | undefined>; // string
```

### Условные типы для извлечения вложенных типов

Паттерн с `never` позволяет писать утилиты, которые извлекают типы, удовлетворяющие условию.

```typescript
// Оставить только функциональные свойства объекта
type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type Service = {
  id: number;
  name: string;
  fetchData: () => Promise<string>;
  processData: (input: string) => void;
};

type ServiceMethods = FunctionProperties<Service>;
// "fetchData" | "processData"
```

Здесь сначала маппинг создаёт объект, где нефункциональные ключи заменяются на `never`, а затем индексация `[keyof T]` собирает объединение — `never` в объединении исчезает автоматически.

## never при сужении типов

TypeScript использует `never` как сигнал о недостижимом коде. Если после ряда проверок переменная имеет тип `never`, компилятор знает, что этот код выполнен быть не может.

```typescript
function stringify(value: string | number | boolean): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  // value: never
  // TypeScript знает, что сюда невозможно добраться
  value; // тип never
}
```

Это полезно при работе с охранниками типов (type guards). Если логика охранника некорректна, TypeScript покажет, что переменная осталась с непустым типом там, где должен быть `never`.

### Практика: безопасный парсер конфига

```typescript
type ConfigValue =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean };

function formatConfigValue(cv: ConfigValue): string {
  switch (cv.type) {
    case "string":
      return `"${cv.value}"`;
    case "number":
      return cv.value.toString();
    case "boolean":
      return cv.value ? "true" : "false";
    default:
      assertNever(cv);
  }
}
```

Если в `ConfigValue` добавить `{ type: "array"; value: unknown[] }`, компилятор сразу потребует добавить соответствующий `case` — ни одна ветвь не будет молча проигнорирована.

## never в обобщённых типах

Иногда `never` используется как значение по умолчанию для параметра обобщённого типа, чтобы обозначить «не задано».

```typescript
// Builder-паттерн с отслеживанием обязательных полей
type BuilderState<T, Required extends keyof T = never> = {
  data: Partial<T>;
  _required: Required;
};

type UserBuilder = BuilderState<
  { name: string; email: string; age: number },
  "name" | "email" // эти поля обязательны
>;
```

Другой пример — типы для промисов, которые никогда не резолвятся в нормальном потоке:

```typescript
// Функция, которая либо возвращает данные, либо навсегда зависает
function fetchOrHang(): Promise<string> | Promise<never> {
  if (Math.random() > 0.5) {
    return Promise.resolve("data");
  }
  return new Promise<never>(() => {}); // никогда не резолвится
}
```

## Ошибки при работе с never

### Случайное получение never

Наиболее распространённая ошибка — неожиданный `never` в условном типе из-за неправильного использования дистрибуции.

```typescript
// Хотим проверить, является ли T объединением
type IsUnion<T, U extends T = T> =
  T extends unknown ? ([U] extends [T] ? false : true) : never;

// Если передать never — получим never, а не false
type A = IsUnion<never>; // never, не false!
```

Чтобы отключить дистрибуцию и обработать `never` как обычное значение, оборачивают тип в кортеж:

```typescript
type IsNever<T> = [T] extends [never] ? true : false;

type A = IsNever<never>;  // true
type B = IsNever<string>; // false
type C = IsNever<0>;      // false
```

Без оборачивания в кортеж `T extends never` при `T = never` даст `never` из-за дистрибуции по пустому множеству.

### Потеря информации при объединении с never

Помните, что `never` в объединении «исчезает»:

```typescript
type A = string | never;  // string
type B = number | never;  // number
type C = never | never;   // never
```

Это обычно желаемое поведение, но иногда приводит к неожиданным результатам при отладке сложных условных типов.

## Итог: когда применять never

- **Функции-бросатели и бесконечные циклы** — явно аннотируйте возвращаемый тип как `never`, чтобы код после вызова таких функций считался недостижимым.
- **Exhaustiveness checking** — используйте `assertNever` или присваивание в `never` в `default`-ветви, чтобы компилятор требовал обработки всех вариантов объединения.
- **Условные типы** — `never` фильтрует варианты из объединений; на этом строятся `Exclude`, `NonNullable` и многие пользовательские утилиты.
- **Проверка достижимости** — если переменная имеет тип `never` в каком-то блоке, TypeScript подтверждает, что туда нельзя попасть при правильной типизации.
- **Параметры по умолчанию** — `never` как дефолт для generic-параметра означает «ничего не задано».

Понимание `never` помогает писать более строгий и самодокументирующийся код: компилятор становится союзником, который предупреждает о пропущенных случаях ещё до запуска программы.

Для углублённого изучения системы типов TypeScript, включая продвинутые техники с `never`, условными типами и дискриминированными объединениями, смотрите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-never