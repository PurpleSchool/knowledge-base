---
metaTitle: "TypeScript strict и strictNullChecks — строгий режим"
metaDescription: "Разбираем флаги strict и strictNullChecks в TypeScript: что они включают, как настроить и как мигрировать существующий проект."
author: "Антон Ларичев"
title: "TypeScript strict и strictNullChecks — строгий режим"
preview: "Что такое строгий режим TypeScript, как работает strictNullChecks и какие флаги входят в strict."
---

## Зачем нужен строгий режим

По умолчанию TypeScript достаточно либерален: он допускает неявные `any`, не требует явной обработки `null` и `undefined`, и позволяет ряд потенциально опасных конструкций. Это сделано для плавной миграции с JavaScript — код начинает компилироваться сразу, без необходимости переписывать всё с нуля.

Однако в продакшен-проекте такая гибкость превращается в источник ошибок. Именно для этого существует флаг `strict` — он включает набор более строгих проверок, которые помогают поймать баги ещё на этапе компиляции.

## Как включить строгий режим

Флаги задаются в `tsconfig.json`. Самый простой вариант — включить `strict`, который активирует сразу несколько проверок:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Если нужен тонкий контроль, можно включать флаги по отдельности:

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

Флаг `strict: true` является сокращением — он включает все перечисленные выше флаги одновременно. Если `strict: true` задан, но какой-то из подфлагов явно выставлен в `false`, этот подфлаг будет отключён.

```json
{
  "compilerOptions": {
    "strict": true,
    "strictPropertyInitialization": false
  }
}
```

## strictNullChecks

Это самый важный из строгих флагов. Без него `null` и `undefined` являются валидными значениями для любого типа:

```typescript
// strictNullChecks: false (режим по умолчанию)
let name: string = null;       // OK
let age: number = undefined;   // OK
```

Когда `strictNullChecks` включён, `null` и `undefined` становятся отдельными типами и не могут быть присвоены переменным других типов без явного указания:

```typescript
// strictNullChecks: true
let name: string = null;       // Ошибка: Type 'null' is not assignable to type 'string'
let age: number = undefined;   // Ошибка: Type 'undefined' is not assignable to type 'number'

// Правильно — явно указываем возможность null
let name: string | null = null;
let age: number | undefined = undefined;
```

### Nullable-типы и Optional Chaining

Когда функция может вернуть `null`, TypeScript заставит вас обработать этот случай перед использованием результата:

```typescript
function findUser(id: number): { name: string } | null {
  if (id === 1) {
    return { name: 'Alice' };
  }
  return null;
}

const user = findUser(2);

// Ошибка: Object is possibly 'null'
console.log(user.name);

// Вариант 1: проверка через if
if (user !== null) {
  console.log(user.name); // OK
}

// Вариант 2: optional chaining
console.log(user?.name); // string | undefined

// Вариант 3: non-null assertion (используйте осторожно)
console.log(user!.name); // утверждаем, что user не null
```

### Необязательные параметры функций

Параметры со знаком `?` автоматически получают тип `T | undefined`:

```typescript
function greet(name?: string): string {
  // Без strictNullChecks: name имеет тип string
  // Со strictNullChecks: name имеет тип string | undefined
  
  // Ошибка: name может быть undefined
  return 'Hello, ' + name.toUpperCase();
  
  // Правильно
  return 'Hello, ' + (name ?? 'Guest').toUpperCase();
}
```

### Тип never для исключённых случаев

После сужения типа через проверки TypeScript отслеживает, какие варианты остались возможными:

```typescript
function processValue(value: string | number | null) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // value: string
  }
  
  if (typeof value === 'number') {
    return value.toFixed(2);    // value: number
  }
  
  // Здесь value: null — TypeScript знает это
  console.log('Value is null');
}
```

## noImplicitAny

Этот флаг запрещает TypeScript неявно выводить тип `any`. Без него параметры функций без аннотаций типов молча получают `any`:

```typescript
// noImplicitAny: false
function add(a, b) { // a и b имеют тип any
  return a + b;
}

// noImplicitAny: true
function add(a, b) { // Ошибка: Parameter 'a' implicitly has an 'any' type
  return a + b;
}

// Правильно
function add(a: number, b: number): number {
  return a + b;
}
```

Использовать `any` явно при этом по-прежнему можно — запрещено только неявное использование:

```typescript
function processData(data: any) { // OK — явный any
  return data;
}
```

## strictFunctionTypes

Флаг включает корректную (контравариантную) проверку типов параметров функций. Без него можно передать функцию с более широким типом параметра туда, где ожидается функция с более узким:

```typescript
type Handler = (event: MouseEvent) => void;

function addClickHandler(handler: Handler) {
  document.addEventListener('click', handler);
}

// Без strictFunctionTypes — OK, но опасно
const handler = (event: Event) => {
  console.log(event.target);
};
addClickHandler(handler);

// С strictFunctionTypes — ошибка
// Argument of type '(event: Event) => void' is not assignable to parameter of type 'Handler'
// Types of parameters 'event' and 'event' are incompatible
```

Этот флаг применяется только к типам функций в синтаксисе `(x: T) => U`, но не к методам объектов — для обратной совместимости.

## strictPropertyInitialization

Требует, чтобы все свойства класса были инициализированы в конструкторе или имели значение по умолчанию:

```typescript
class User {
  name: string;  // Ошибка: Property 'name' has no initializer
  age: number;   // Ошибка: Property 'age' has no initializer
}

// Вариант 1: инициализация в конструкторе
class User {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// Вариант 2: значение по умолчанию
class User {
  name: string = 'Anonymous';
  age: number = 0;
}

// Вариант 3: явное указание, что свойство может быть undefined
class User {
  name?: string;          // string | undefined
  role: string | null = null; // явный null
}

// Вариант 4: Definite Assignment Assertion (если вы точно знаете)
class User {
  name!: string; // TypeScript доверяет вам, что name будет присвоено
}
```

## strictBindCallApply

Включает проверку типов для методов `bind`, `call` и `apply`:

```typescript
function greet(name: string, age: number): string {
  return `Hello, ${name}, you are ${age}`;
}

// Без strictBindCallApply — аргументы не проверяются
greet.call(null, 'Alice', '30'); // не поймает ошибку типа

// С strictBindCallApply — ошибка
greet.call(null, 'Alice', '30'); 
// Argument of type 'string' is not assignable to parameter of type 'number'

// Правильно
greet.call(null, 'Alice', 30);
```

## noImplicitThis

Запрещает использование `this` без явного типа в функциях (не в методах класса или объекта):

```typescript
// Ошибка: 'this' implicitly has type 'any'
function getFullName() {
  return this.firstName + ' ' + this.lastName;
}

// Правильно — явно указываем тип this
function getFullName(this: { firstName: string; lastName: string }) {
  return this.firstName + ' ' + this.lastName;
}

// Или используем стрелочные функции, которые захватывают this из контекста
const obj = {
  firstName: 'John',
  lastName: 'Doe',
  getFullName() {
    const format = () => this.firstName + ' ' + this.lastName; // OK
    return format();
  }
};
```

## alwaysStrict

Вставляет директиву `'use strict'` в начало каждого скомпилированного JavaScript-файла. В современных проектах с ES-модулями это делается автоматически, но для CommonJS-окружений флаг полезен.

## Постепенная миграция на strict

Включить `strict: true` сразу в большом проекте бывает непрактично — это порождает сотни ошибок. Есть несколько стратегий постепенного перехода.

### Стратегия 1: пофайловое включение

Включайте флаги по одному, начиная с менее болезненных:

```json
{
  "compilerOptions": {
    "noImplicitAny": true
  }
}
```

После того как проект компилируется без ошибок с одним флагом, добавляйте следующий.

### Стратегия 2: использование @ts-strict-ignore

Для файлов, которые ещё не готовы к strict-режиму, можно временно отключить проверки на уровне файла:

```typescript
// @ts-nocheck
// В этом файле TypeScript отключает все проверки

function legacyFunction(data) {
  return data.value;
}
```

Но лучше использовать точечные подавления ошибок через `@ts-ignore` или `@ts-expect-error`:

```typescript
// @ts-expect-error — следующая строка намеренно содержит ошибку
const value: string = null;
```

Отличие `@ts-expect-error` от `@ts-ignore` в том, что первый сам сообщит об ошибке, если следующая строка внезапно станет корректной — это помогает не забыть убрать подавление после рефакторинга.

### Стратегия 3: отдельный tsconfig для нового кода

Можно создать `tsconfig.strict.json`, который расширяет основной конфиг и добавляет `strict: true`. Новые файлы пишутся под строгий конфиг, старые — под основной:

```json
// tsconfig.strict.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true
  },
  "include": ["src/new-modules/**/*"]
}
```

## Практический пример: работа с API-ответами

Один из наиболее частых случаев, где строгий режим действительно спасает, — работа с данными от внешних API:

```typescript
interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null; // может отсутствовать
}

async function loadUserProfile(userId: number): Promise<ApiUser | null> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      return null;
    }
    return response.json() as ApiUser;
  } catch {
    return null;
  }
}

async function displayUser(userId: number) {
  const user = await loadUserProfile(userId);
  
  // Без strictNullChecks: нет предупреждения, возможен runtime crash
  // С strictNullChecks: ошибка компиляции
  // console.log(user.name); // Object is possibly 'null'
  
  // Правильная обработка
  if (!user) {
    console.log('User not found');
    return;
  }
  
  // После проверки TypeScript знает, что user: ApiUser
  console.log(user.name); // OK
  
  // avatar может быть null — нужна обработка
  const avatarUrl = user.avatar ?? '/default-avatar.png';
  console.log(avatarUrl);
}
```

## Итог

Строгий режим TypeScript — это инструмент, который делает код надёжнее за счёт явных контрактов. Ключевые флаги:

- `strict: true` — включает все строгие проверки сразу
- `strictNullChecks` — `null` и `undefined` перестают быть «тихими» значениями
- `noImplicitAny` — устраняет случайные дыры в типизации
- `strictPropertyInitialization` — гарантирует инициализацию свойств классов
- `strictFunctionTypes` — корректная проверка типов функций

Для новых проектов рекомендуется включать `strict: true` с самого начала. В существующих — мигрировать поэтапно, добавляя флаги один за другим и исправляя ошибки по мере продвижения.

Чтобы глубже изучить систему типов TypeScript и научиться писать надёжный типизированный код, пройдите курс на PurpleSchool: [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-strict-mode)
