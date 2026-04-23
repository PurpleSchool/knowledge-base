---
metaTitle: Декораторы в TypeScript — полное руководство
metaDescription: Полное руководство по декораторам в TypeScript: class, method, property и parameter декораторы, включение experimentalDecorators, примеры с NestJS.
author: Антон Ларичев
title: Декораторы в TypeScript — полное руководство
preview: Изучаем все виды декораторов в TypeScript: классов, методов, свойств и параметров. Настройка experimentalDecorators, паттерны применения и примеры из NestJS.
---

## Введение

Декораторы в TypeScript — это специальный вид объявлений, который позволяет добавлять аннотации и изменять поведение классов, методов, свойств и параметров. По сути, декоратор — это функция, которая вызывается во время определения класса и получает доступ к его метаданным. Синтаксис `@expression` перед объявлением указывает TypeScript применить эту функцию.

Декораторы широко используются в популярных фреймворках: NestJS строится на них почти целиком, Angular активно применяет `@Component`, `@Injectable`, `@NgModule`. Понимание декораторов открывает доступ к паттернам декларативного программирования.

## Включение декораторов

Прежде чем использовать декораторы, необходимо включить их поддержку в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true  // Нужно для NestJS и reflect-metadata
  }
}
```

`experimentalDecorators` включает классические (Stage 2) декораторы. `emitDecoratorMetadata` — опциональная настройка, которая добавляет метаданные о типах при компиляции; требует пакет `reflect-metadata`.

## Декораторы классов

Декоратор класса применяется к конструктору класса. Он принимает один аргумент — конструктор, и может либо возвращать новый конструктор (заменяя класс), либо ничего не возвращать (только добавляя поведение):

```typescript
// Декоратор, добавляющий метаданные к классу
function Entity(tableName: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Добавляем статическое свойство с именем таблицы
    return class extends constructor {
      static tableName = tableName;
      static find(id: number) {
        console.log(`SELECT * FROM ${tableName} WHERE id = ${id}`);
      }
    };
  };
}

@Entity("users")
class User {
  constructor(
    public id: number,
    public name: string,
  ) {}
}

// TypeScript знает о tableName благодаря декоратору
console.log((User as any).tableName); // "users"
(User as any).find(42);               // "SELECT * FROM users WHERE id = 42"
```

```typescript
// Декоратор для «запечатывания» класса (запрет расширения)
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class Config {
  apiUrl = "https://api.example.com";
  timeout = 5000;
}
// После @Sealed нельзя добавлять новые свойства к Config
```

Если вы хотите детально изучить декораторы и создавать серверные приложения на NestJS с TypeScript — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=typescript-decorators).
На курсе 192 урока и 17 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Декораторы методов

Декоратор метода получает три аргумента: прототип класса (или конструктор для статических методов), имя метода и дескриптор свойства. Изменяя дескриптор, можно полностью перехватить или обернуть вызов метода:

```typescript
// Декоратор для логирования вызовов
function Log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`[${new Date().toISOString()}] Вызов ${propertyKey}(${args.join(", ")})`);
    const result = originalMethod.apply(this, args);
    console.log(`[${new Date().toISOString()}] ${propertyKey} вернул: ${result}`);
    return result;
  };

  return descriptor;
}

// Декоратор для кэширования результатов
function Memoize(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`Возвращаем из кэша для аргументов: ${key}`);
      return cache.get(key);
    }
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

class MathService {
  @Log
  @Memoize
  fibonacci(n: number): number {
    // Тяжёлое вычисление — будет кэшироваться
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const service = new MathService();
service.fibonacci(10); // Вычисляет и кэширует
service.fibonacci(10); // Берёт из кэша
```

## Декораторы свойств

Декораторы свойств получают два аргумента: прототип класса и имя свойства. Они не имеют дескриптора, поэтому применяются через `Object.defineProperty`:

```typescript
// Декоратор для валидации минимальной длины строки
function MinLength(min: number) {
  return function (target: any, propertyKey: string) {
    let value: string;

    const getter = () => value;
    const setter = (newValue: string) => {
      if (newValue.length < min) {
        throw new Error(
          `Свойство ${propertyKey} должно содержать минимум ${min} символов. Получено: ${newValue.length}`,
        );
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

// Декоратор для readonly свойств
function Readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false,
    configurable: false,
  });
}

class UserAccount {
  @MinLength(3)
  username: string;

  @MinLength(8)
  password: string;

  constructor(username: string, password: string) {
    this.username = username; // Вызывает сеттер с валидацией
    this.password = password;
  }
}

const account = new UserAccount("ivan", "secret123"); // OK
// new UserAccount("ab", "secret123"); // Ошибка: минимум 3 символа
```

## Декораторы параметров

Декораторы параметров получают три аргумента: прототип класса, имя метода и индекс параметра. Они обычно используются совместно с `reflect-metadata` для сбора информации о параметрах:

```typescript
import "reflect-metadata";

// Ключ метаданных для обязательных параметров
const REQUIRED_KEY = Symbol("required");

// Декоратор, помечающий параметр как обязательный
function Required(target: any, propertyKey: string, parameterIndex: number) {
  const existingRequired: number[] =
    Reflect.getOwnMetadata(REQUIRED_KEY, target, propertyKey) || [];
  existingRequired.push(parameterIndex);
  Reflect.defineMetadata(REQUIRED_KEY, existingRequired, target, propertyKey);
}

// Декоратор метода, который проверяет обязательные параметры
function Validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] =
      Reflect.getOwnMetadata(REQUIRED_KEY, target, propertyKey) || [];

    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(
          `Параметр с индексом ${index} в методе ${propertyKey} является обязательным`,
        );
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class NotificationService {
  @Validate
  send(@Required to: string, @Required message: string, subject?: string) {
    console.log(`Отправляем "${message}" на ${to}`);
  }
}

const notifications = new NotificationService();
notifications.send("user@example.com", "Привет!"); // OK
// notifications.send(null, "Привет!");             // Ошибка: параметр 0 обязателен
```

## Декораторы в NestJS

NestJS использует декораторы как основу своей архитектуры. Вот как выглядит типичный контроллер:

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";

// @Controller определяет базовый путь
@Controller("users")
// @UseGuards применяет гард авторизации ко всем методам контроллера
@UseGuards(AuthGuard)
class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Get создаёт GET-обработчик
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // @Get(':id') — обработчик с параметром пути
  @Get(":id")
  findOne(@Param("id") id: string) {
    // @Param извлекает параметр из URL
    return this.usersService.findOne(+id);
  }

  // @Post создаёт POST-обработчик
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // @Body извлекает тело запроса
    return this.usersService.create(createUserDto);
  }
}
```

## Порядок применения декораторов

Когда на один элемент применяется несколько декораторов, порядок их вычисления и применения важен:

```typescript
function First() {
  console.log("Вычисление декоратора First");
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log("Применение декоратора First");
    return descriptor;
  };
}

function Second() {
  console.log("Вычисление декоратора Second");
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log("Применение декоратора Second");
    return descriptor;
  };
}

class Example {
  @First()  // Вычисляется первым, применяется вторым
  @Second() // Вычисляется вторым, применяется первым
  method() {}
}

// Вывод:
// "Вычисление декоратора First"
// "Вычисление декоратора Second"
// "Применение декоратора Second"
// "Применение декоратора First"
```

## Частые ошибки

* **Забыть включить `experimentalDecorators`** — TypeScript выдаст синтаксическую ошибку, если опция не включена в `tsconfig.json`
* **Возвращать `void` вместо дескриптора из декоратора метода** — чтобы декоратор применил изменения, нужно вернуть изменённый дескриптор или убедиться, что мутация `descriptor.value` достаточна
* **Потеря контекста `this`** — если в декораторе метода использовать стрелочную функцию вместо `function`, `this` будет указывать не на экземпляр, а на лексическое окружение декоратора
* **Декораторы свойств не получают дескриптор** — в отличие от методов, декораторы свойств не могут изменить дескриптор напрямую; нужно использовать `Object.defineProperty`
* **Декораторы выполняются при объявлении класса, не при создании экземпляра** — это распространённое заблуждение; декоратор вызывается один раз, когда JS-движок обрабатывает определение класса

## Заключение

Декораторы — это элегантный способ добавить декларативное поведение к объектно-ориентированному коду. Вместо того чтобы вставлять логику логирования, валидации или кэширования внутрь каждого метода, вы оборачиваете её в декоратор и применяете одним символом `@`.

Освоив декораторы, вы не только научитесь писать более чистый код, но и поймёте, как работают NestJS, TypeORM и другие популярные TypeScript-фреймворки «под капотом». Для углублённого изучения TypeScript с практикой на реальных проектах рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=typescript-decorators).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет оценить качество обучения и начать изучение TypeScript без риска для бюджета.
