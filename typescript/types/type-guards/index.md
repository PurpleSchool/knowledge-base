---
metaTitle: Type Guards в TypeScript — сужение типов с примерами
metaDescription: Type Guards в TypeScript — typeof, instanceof, in, discriminated union и пользовательские предикаты типов. Как правильно сужать типы и избежать ошибок.
author: Антон Ларичев
title: Type Guards в TypeScript — как работает сужение типов
preview: Разбираем Type Guards в TypeScript — встроенные операторы typeof, instanceof, in, discriminated union и пользовательские функции-предикаты типов с примерами.
---

## Введение

Type Guards (стражи типов) — это выражения, которые позволяют TypeScript сузить тип переменной в определённом блоке кода. Если у вас есть значение типа `string | number`, TypeScript не позволит вызвать на нём методы строки без проверки. Type Guards — это способ сообщить компилятору: «в этом блоке переменная точно является строкой».

Это ключевой паттерн при работе с union-типами, `unknown`, ответами API и любыми данными, тип которых заранее неизвестен.

## Встроенные Type Guards

### typeof

Работает для примитивных типов: `string`, `number`, `bigint`, `boolean`, `symbol`, `undefined`, `function`.

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript знает: value — string
    console.log(value.toUpperCase()); // OK
  } else {
    // TypeScript знает: value — number
    console.log(value.toFixed(2)); // OK
  }
}
```

Важно: `typeof null === 'object'` — историческая ошибка JavaScript. Не используйте `typeof` для проверки на `null`.

```typescript
function processValue(value: string | null) {
  if (typeof value === 'string') {
    // TypeScript знает: value — string (null отсеян)
    console.log(value.length);
  }
}
```

### instanceof

Работает для проверки принадлежности к классу:

```typescript
class Dog {
  bark() { return 'Гав!'; }
}

class Cat {
  meow() { return 'Мяу!'; }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    console.log(animal.bark()); // OK
  } else {
    console.log(animal.meow()); // OK
  }
}
```

`instanceof` работает только с классами, не с интерфейсами или type-алиасами (они стираются при компиляции).

### in

Проверяет наличие свойства в объекте — работает как с классами, так и с интерфейсами:

```typescript
interface Circle {
  radius: number;
}

interface Rectangle {
  width: number;
  height: number;
}

function getArea(shape: Circle | Rectangle): number {
  if ('radius' in shape) {
    // TypeScript знает: shape — Circle
    return Math.PI * shape.radius ** 2;
  } else {
    // TypeScript знает: shape — Rectangle
    return shape.width * shape.height;
  }
}
```

Если вы хотите детально изучить систему типов TypeScript, включая Type Guards и narrowing — приходите на наш курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=type-guards). На курсе 180 уроков, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Проверка на null и undefined

```typescript
function greet(name: string | null | undefined) {
  if (name == null) {
    // Проверяет и null, и undefined (== вместо ===)
    console.log('Привет, незнакомец!');
  } else {
    // TypeScript знает: name — string
    console.log(`Привет, ${name.toUpperCase()}!`);
  }
}

// Альтернатива — опциональная цепочка
function greetSafe(name: string | null | undefined) {
  console.log(`Привет, ${name?.toUpperCase() ?? 'незнакомец'}!`);
}
```

## Discriminated Union (размеченные объединения)

Один из самых мощных паттернов TypeScript. Каждый вариант union содержит общее дискриминирующее поле (обычно `type` или `kind`), по которому можно однозначно определить вариант:

```typescript
interface SuccessResponse {
  status: 'success';
  data: User[];
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code: number;
}

interface LoadingResponse {
  status: 'loading';
}

type ApiResponse = SuccessResponse | ErrorResponse | LoadingResponse;

function handleResponse(response: ApiResponse) {
  switch (response.status) {
    case 'success':
      // TypeScript знает: response — SuccessResponse
      console.log(response.data);
      break;
    case 'error':
      // TypeScript знает: response — ErrorResponse
      console.error(`${response.code}: ${response.message}`);
      break;
    case 'loading':
      console.log('Загрузка...');
      break;
  }
}
```

TypeScript проверяет exhaustiveness — если забыть один из вариантов в `switch`, компилятор предупредит (при настройке `never`-проверки).

## Пользовательские Type Guard функции

Когда встроенных проверок недостаточно, создаётся функция-предикат с синтаксисом `value is Type`:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Функция-предикат: возвращает true → TypeScript сужает тип
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'number' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

function processApiData(data: unknown) {
  if (isUser(data)) {
    // TypeScript знает: data — User
    console.log(data.name); // OK
    console.log(data.email); // OK
  }
}
```

### Assertion functions

Если функция должна бросить ошибку при неверном типе (а не вернуть `false`), используется `asserts`:

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Ожидалась строка, получено: ${typeof value}`);
  }
}

function process(value: unknown) {
  assertIsString(value);
  // После вызова assertIsString TypeScript знает: value — string
  console.log(value.toUpperCase()); // OK
}
```

## Narrowing с массивами

```typescript
const values: (string | null)[] = ['a', null, 'b', null, 'c'];

// filter не сужает тип автоматически
const strings1 = values.filter(v => v !== null); // (string | null)[]

// С Type Guard — сужение работает
const strings2 = values.filter((v): v is string => v !== null); // string[]
```

## Exhaustive checking с never

Паттерн для проверки, что все варианты union обработаны:

```typescript
type Shape = 'circle' | 'square' | 'triangle';

function describeShape(shape: Shape): string {
  switch (shape) {
    case 'circle': return 'Круг';
    case 'square': return 'Квадрат';
    case 'triangle': return 'Треугольник';
    default:
      // Если добавить новый вариант в Shape и забыть его здесь,
      // TypeScript выдаст ошибку
      const _exhaustive: never = shape;
      throw new Error(`Неизвестная форма: ${shape}`);
  }
}
```

## Частые ошибки

* **`typeof null === 'object'`.** Проверка `typeof value === 'object'` не отсеивает `null`. Всегда добавляйте `&& value !== null`.

* **`instanceof` не работает с интерфейсами.** Интерфейсы стираются в runtime. Используйте `in` или пользовательские предикаты.

* **Слабые проверки в Type Guard функциях.** Если функция `isUser` проверяет только `'name' in value`, TypeScript будет уверен в типе, но реальные данные могут не соответствовать. Проверяйте все обязательные поля и их типы.

* **Мутация после сужения.** TypeScript сужает тип на основе статического анализа. Если значение может измениться между проверкой и использованием (например, в другом потоке), сужение теряет смысл.

## Часто задаваемые вопросы

**Чем Type Guards отличаются от type assertions (as)?**

Type assertion (`value as User`) — это способ сказать TypeScript «доверяй мне, это User» без реальной проверки. Type Guard выполняет реальную проверку в runtime. Assertions небезопасны, Guard функции — безопасны.

**Когда использовать `in` вместо `instanceof`?**

`instanceof` — для классов с прототипами. `in` — для plain-объектов (литералов), интерфейсов, объектов из API. Если работаете с JSON-данными, всегда `in` или пользовательские предикаты.

**Можно ли комбинировать Type Guards?**

Да: `if (typeof value === 'string' && value.length > 0)` — оба условия сужают тип. После первого условия TypeScript знает, что `value` — строка.

**Что такое narrowing?**

Narrowing — процесс сужения типа компилятором TypeScript на основе Type Guards и структуры кода. TypeScript анализирует все ветки `if/else`, `switch`, `&&`, `||`, `??` и для каждой ветки выводит точный тип.

## Заключение

Type Guards — основной инструмент для безопасной работы с union-типами и данными неизвестного типа. Используйте `typeof` для примитивов, `instanceof` для классов, `in` для объектов с определёнными свойствами, discriminated union для сложных иерархий и пользовательские предикаты для валидации внешних данных.

Для углублённого изучения TypeScript рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=type-guards). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.
