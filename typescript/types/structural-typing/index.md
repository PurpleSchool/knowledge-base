---
metaTitle: "Структурная типизация в TypeScript — как работает совместимость типов"
metaDescription: "Разбираем структурную типизацию в TypeScript: совместимость типов, утиная типизация, отличия от номинальной, практические примеры и ловушки."
author: "Антон Ларичев"
title: "Структурная типизация в TypeScript"
preview: "Как TypeScript определяет совместимость типов по структуре, а не по имени — и что это значит на практике."
---

## Что такое структурная типизация

TypeScript использует структурную типизацию (structural typing) в отличие от номинальной типизации (nominal typing), которая применяется в языках вроде Java или C#. Это одно из ключевых архитектурных решений, определяющих поведение системы типов.

В номинальной типизации совместимость типов определяется именем типа или явными объявлениями наследования. В структурной типизации совместимость определяется структурой типа — набором свойств и их типов. Два типа считаются совместимыми, если один из них содержит все свойства другого, независимо от названий типов.

```typescript
interface Dog {
  name: string;
  breed: string;
}

interface Cat {
  name: string;
  breed: string;
}

const dog: Dog = { name: 'Rex', breed: 'Labrador' };
const cat: Cat = dog; // Работает — структуры идентичны
```

TypeScript не выдаёт ошибку, потому что `Dog` и `Cat` имеют одинаковую структуру, несмотря на разные имена.

## Принцип утиной типизации

Структурная типизация реализует принцип утиной типизации: «Если это ходит как утка и крякает как утка — это утка». TypeScript не требует явных объявлений `implements` или наследования — достаточно, чтобы объект имел нужные свойства.

```typescript
interface Printable {
  print(): void;
}

class Document {
  content: string;

  constructor(content: string) {
    this.content = content;
  }

  print(): void {
    console.log(this.content);
  }
}

class Invoice {
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  print(): void {
    console.log(`Invoice: $${this.amount}`);
  }
}

function printItem(item: Printable): void {
  item.print();
}

const doc = new Document('Hello World');
const invoice = new Invoice(100);

printItem(doc);     // Работает — Document имеет метод print()
printItem(invoice); // Работает — Invoice имеет метод print()
```

Ни `Document`, ни `Invoice` явно не реализуют интерфейс `Printable`, но TypeScript принимает оба объекта, потому что у них есть метод `print()`.

## Совместимость типов: подробности

### Присвоение более широкого типа

Ключевое правило: тип с большим количеством свойств совместим с типом с меньшим количеством свойств при присвоении переменной.

```typescript
interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const point3D: Point3D = { x: 1, y: 2, z: 3 };
const point2D: Point2D = point3D; // Работает — Point3D содержит все свойства Point2D

const another3D: Point3D = point2D; // Ошибка! В Point2D нет свойства z
```

`Point3D` является подтипом `Point2D` в терминах структурной типизации, потому что содержит все свойства `Point2D` плюс дополнительные.

### Проверка избыточных свойств

Есть важное исключение — когда вы передаёте объектный литерал напрямую, TypeScript применяет проверку избыточных свойств (excess property checking):

```typescript
interface Config {
  host: string;
  port: number;
}

// Ошибка: объектный литерал с лишним свойством
const config: Config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000 // Error: Object literal may only specify known properties
};

// Через промежуточную переменную — работает
const configWithTimeout = {
  host: 'localhost',
  port: 3000,
  timeout: 5000
};

const validConfig: Config = configWithTimeout; // Работает
```

Проверка избыточных свойств срабатывает только для литералов — это помогает поймать опечатки при инициализации, но не является частью обычной структурной проверки.

## Структурная типизация и функции

### Совместимость параметров

Для функций TypeScript проверяет совместимость параметров и возвращаемого значения. Функция с меньшим количеством параметров совместима с типом функции с большим количеством параметров:

```typescript
type Handler = (event: MouseEvent, id: number) => void;

const simpleHandler: Handler = (event) => {
  console.log(event.type);
};
// Работает — функция с меньшим числом параметров совместима
```

Это объясняет, почему в методах массива можно опускать неиспользуемые аргументы:

```typescript
const numbers = [1, 2, 3];

// Callback получает три аргумента: элемент, индекс, массив
// Но нам нужен только элемент — TypeScript это разрешает
const doubled = numbers.map(n => n * 2);
```

### Совместимость возвращаемых типов

Функция, возвращающая более конкретный тип, совместима с функцией, возвращающей более общий тип:

```typescript
type GetAnimal = () => { name: string };
type GetDog = () => { name: string; breed: string };

const getDog: GetDog = () => ({ name: 'Rex', breed: 'Labrador' });
const getAnimal: GetAnimal = getDog; // Работает — GetDog возвращает тип с большим числом свойств
```

## Структурная типизация и классы

Классы в TypeScript подчиняются тем же правилам структурной типизации. Два класса считаются совместимыми, если их публичные структуры совпадают:

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  move(): void {
    console.log(`${this.name} is moving`);
  }
}

class Robot {
  name: string;
  batteryLevel: number;

  constructor(name: string, batteryLevel: number) {
    this.name = name;
    this.batteryLevel = batteryLevel;
  }

  move(): void {
    console.log(`${this.name} is moving`);
  }
}

function makeMove(entity: Animal): void {
  entity.move();
}

const robot = new Robot('R2D2', 90);
makeMove(robot); // Работает — Robot содержит все публичные члены Animal
```

### Приватные и защищённые члены

Приватные члены класса влияют на структурную совместимость. Если у класса есть приватные поля, TypeScript требует, чтобы они происходили из одного и того же класса:

```typescript
class Animal {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class Dog {
  private name: string; // Тот же тип, но другой класс

  constructor(name: string) {
    this.name = name;
  }
}

let animal: Animal = new Dog('Rex');
// Ошибка! Types have separate declarations of a private property 'name'.
```

Это одно из редких мест, где TypeScript применяет элементы номинальной типизации.

## Практические примеры

### Адаптер через структурную типизацию

Структурная типизация позволяет строить гибкие адаптеры без сложного наследования:

```typescript
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Сторонняя библиотека с другим API
class ThirdPartyLogger {
  writeLog(msg: string): void {
    console.log(`[LOG] ${msg}`);
  }

  writeError(msg: string): void {
    console.error(`[ERR] ${msg}`);
  }
}

function createLoggerAdapter(thirdParty: ThirdPartyLogger): Logger {
  return {
    log: (message) => thirdParty.writeLog(message),
    error: (message) => thirdParty.writeError(message)
  };
}

function processData(data: string[], logger: Logger): void {
  logger.log(`Processing ${data.length} items`);
}

const thirdParty = new ThirdPartyLogger();
const logger = createLoggerAdapter(thirdParty);
processData(['a', 'b', 'c'], logger);
```

### Тестирование с моками

Структурная типизация сильно упрощает написание тестовых моков — не нужно создавать классы-наследники или использовать фреймворки для мокирования:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserRepository {
  findById(id: number): Promise<User>;
  save(user: User): Promise<void>;
}

async function getUserName(repo: UserRepository, id: number): Promise<string> {
  const user = await repo.findById(id);
  return user.name;
}

// В тестах — простой объект нужной структуры
const mockRepository: UserRepository = {
  findById: async (id) => ({
    id,
    name: 'Test User',
    email: 'test@example.com'
  }),
  save: async () => {}
};

const name = await getUserName(mockRepository, 1);
console.log(name); // 'Test User'
```

## Потенциальные ловушки

### Случайная совместимость

Структурная типизация может привести к неожиданной совместимости типов, которые семантически разные:

```typescript
interface UserId {
  value: number;
}

interface ProductId {
  value: number;
}

function getUser(id: UserId): void {
  // ...
}

const productId: ProductId = { value: 42 };
getUser(productId); // TypeScript не видит проблемы!
```

Для таких случаев используют брендирование типов (branded types):

```typescript
type UserId = number & { readonly __brand: 'UserId' };
type ProductId = number & { readonly __brand: 'ProductId' };

function createUserId(value: number): UserId {
  return value as UserId;
}

function createProductId(value: number): ProductId {
  return value as ProductId;
}

function getUser(id: UserId): void {
  // ...
}

const userId = createUserId(1);
const productId = createProductId(42);

getUser(userId);    // Работает
getUser(productId); // Ошибка! Type 'ProductId' is not assignable to type 'UserId'
```

Брендированные типы добавляют номинальное поведение в отдельных местах, не ломая остальную архитектуру.

### Совместимость пустых типов

Пустой объектный тип `{}` совместим с большинством значений:

```typescript
interface Empty {}

const str: Empty = 'hello'; // Работает
const num: Empty = 42;      // Работает
const obj: Empty = { a: 1 }; // Работает
```

Если нужно принимать только объекты, используйте `Record<string, unknown>` или `object` вместо `{}`.

## Структурная типизация в дженериках

Структурная совместимость применяется и при работе с обобщёнными типами:

```typescript
interface Box<T> {
  value: T;
}

function unwrap<T>(box: Box<T>): T {
  return box.value;
}

// Любой объект с полем value подойдёт
const namedBox = {
  value: 'hello',
  label: 'greeting'
};

const result = unwrap(namedBox); // result: string — TypeScript вывел тип
```

Это позволяет писать более гибкий переиспользуемый код без жёстких требований к точному типу.

## Структурная vs номинальная типизация: итог

| Характеристика | Структурная (TypeScript) | Номинальная (Java, C#) |
|---|---|---|
| Совместимость по | Структуре (набору свойств) | Имени типа / наследованию |
| Нужен `implements`? | Нет | Да |
| Гибкость | Высокая | Ниже |
| Риск случайных совпадений | Есть | Минимален |
| Адаптеры и моки | Просты | Требуют наследования |

Структурная типизация делает TypeScript более гибким при работе с JavaScript-экосистемой, где объекты часто создаются литерально и передаются между библиотеками без общей иерархии классов.

Чтобы углубиться в систему типов TypeScript и научиться использовать её возможности в реальных проектах, изучите курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=structural-typing).