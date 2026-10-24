---
metaTitle: "TypeScript декораторы с reflect-metadata — полное руководство"
metaDescription: "Как использовать reflect-metadata с декораторами TypeScript: Reflect.metadata, getMetadata, defineMetadata, практические примеры DI и валидации."
author: "Антон Ларичев"
title: "TypeScript декораторы с reflect-metadata"
preview: "Разбираем reflect-metadata: как хранить и читать метаданные через декораторы, строить DI-контейнеры и системы валидации."
---

## Что такое reflect-metadata и зачем он нужен

Декораторы в TypeScript позволяют добавлять поведение к классам, методам, свойствам и параметрам. Но сами по себе они не имеют стандартного способа хранить произвольные данные, привязанные к классу или его членам. Именно эту задачу решает библиотека `reflect-metadata`.

`reflect-metadata` реализует черновик спецификации Reflect Metadata API, которая позволяет:

- прикреплять произвольные метаданные к классам, методам и свойствам;
- читать эти метаданные в рантайме;
- получать встроенные типы TypeScript (`design:type`, `design:paramtypes`, `design:returntype`) через компилятор.

Библиотека активно используется в популярных фреймворках: NestJS, TypeORM, InversifyJS, class-validator — все они строятся поверх этого механизма.

## Настройка проекта

### Установка зависимостей

```bash
npm install reflect-metadata
npm install typescript --save-dev
```

### tsconfig.json

Для работы декораторов и эмиссии метаданных типов необходимо включить два флага:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "lib": ["ES2017"]
  }
}
```

- `experimentalDecorators` — включает поддержку декораторов;
- `emitDecoratorMetadata` — заставляет компилятор автоматически записывать метаданные типов (`design:type`, `design:paramtypes`, `design:returntype`).

### Импорт полифила

`reflect-metadata` должен быть импортирован **один раз** в точке входа приложения, до любого использования декораторов:

```typescript
import 'reflect-metadata';
```

## Базовые операции Reflect Metadata API

API предоставляет набор статических методов на глобальном объекте `Reflect`.

### Запись метаданных

```typescript
import 'reflect-metadata';

class UserService {
  findById(id: number): string {
    return `user_${id}`;
  }
}

// Записываем метаданные на метод
Reflect.defineMetadata('role', 'admin', UserService.prototype, 'findById');

// Записываем метаданные на класс
Reflect.defineMetadata('injectable', true, UserService);
```

### Чтение метаданных

```typescript
const role = Reflect.getMetadata('role', UserService.prototype, 'findById');
console.log(role); // 'admin'

const injectable = Reflect.getMetadata('injectable', UserService);
console.log(injectable); // true
```

### Проверка наличия метаданных

```typescript
const hasRole = Reflect.hasMetadata('role', UserService.prototype, 'findById');
console.log(hasRole); // true

// hasOwnMetadata не проверяет цепочку прототипов
const hasOwn = Reflect.hasOwnMetadata('role', UserService.prototype, 'findById');
console.log(hasOwn); // true
```

### Список ключей метаданных

```typescript
const keys = Reflect.getMetadataKeys(UserService.prototype, 'findById');
console.log(keys); // ['role']
```

## Декоратор Reflect.metadata

Библиотека экспортирует фабрику `Reflect.metadata(key, value)`, которая возвращает декоратор. Это удобный способ прикреплять метаданные прямо в определении класса:

```typescript
import 'reflect-metadata';

@Reflect.metadata('description', 'Manages user data')
class UserService {
  @Reflect.metadata('http:method', 'GET')
  @Reflect.metadata('http:path', '/users/:id')
  findById(id: number): string {
    return `user_${id}`;
  }
}

const desc = Reflect.getMetadata('description', UserService);
console.log(desc); // 'Manages user data'

const method = Reflect.getMetadata('http:method', UserService.prototype, 'findById');
console.log(method); // 'GET'
```

## Встроенные метаданные типов TypeScript

Когда включён флаг `emitDecoratorMetadata`, компилятор автоматически записывает метаданные типов для декорированных элементов. Это самая мощная часть интеграции.

### design:type — тип свойства

```typescript
import 'reflect-metadata';

function Log(target: any, propertyKey: string): void {
  const type = Reflect.getMetadata('design:type', target, propertyKey);
  console.log(`${propertyKey} has type: ${type.name}`);
}

class Article {
  @Log
  title: string = '';

  @Log
  views: number = 0;

  @Log
  publishedAt: Date = new Date();
}

// Вывод:
// title has type: String
// views has type: Number
// publishedAt has type: Date
```

### design:paramtypes — типы параметров конструктора или метода

```typescript
import 'reflect-metadata';

function Injectable(target: any): void {
  const params = Reflect.getMetadata('design:paramtypes', target);
  console.log('Constructor params:', params?.map((p: any) => p.name));
}

class DatabaseService {}
class LoggerService {}

@Injectable
class UserRepository {
  constructor(
    private db: DatabaseService,
    private logger: LoggerService
  ) {}
}

// Вывод: Constructor params: ['DatabaseService', 'LoggerService']
```

### design:returntype — тип возвращаемого значения

```typescript
import 'reflect-metadata';

function LogReturn(target: any, key: string, descriptor: PropertyDescriptor) {
  const returnType = Reflect.getMetadata('design:returntype', target, key);
  console.log(`${key} returns: ${returnType?.name}`);
  return descriptor;
}

class OrderService {
  @LogReturn
  getTotal(): number {
    return 100;
  }

  @LogReturn
  getLabel(): string {
    return 'Order #1';
  }
}

// Вывод:
// getTotal returns: Number
// getLabel returns: String
```

## Практический пример: простой DI-контейнер

Именно `emitDecoratorMetadata` + `design:paramtypes` лежат в основе инъекции зависимостей в NestJS и InversifyJS. Рассмотрим упрощённую реализацию:

```typescript
import 'reflect-metadata';

const INJECTABLE_KEY = Symbol('injectable');

// Помечаем классы как инжектируемые
function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE_KEY, true, target);
  };
}

// Простой контейнер
class Container {
  private registry = new Map<any, any>();

  register<T>(token: new (...args: any[]) => T): void {
    this.registry.set(token, null);
  }

  resolve<T>(token: new (...args: any[]) => T): T {
    if (!Reflect.getMetadata(INJECTABLE_KEY, token)) {
      throw new Error(`${token.name} is not injectable`);
    }

    const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', token) ?? [];
    const dependencies = paramTypes.map((dep) => this.resolve(dep));

    return new token(...dependencies);
  }
}

// Использование
@Injectable()
class ConfigService {
  getDbUrl(): string {
    return 'postgres://localhost/mydb';
  }
}

@Injectable()
class DatabaseService {
  constructor(private config: ConfigService) {}

  connect(): void {
    console.log(`Connecting to ${this.config.getDbUrl()}`);
  }
}

@Injectable()
class UserRepository {
  constructor(private db: DatabaseService) {}

  findAll(): string[] {
    this.db.connect();
    return ['Alice', 'Bob'];
  }
}

const container = new Container();
const repo = container.resolve(UserRepository);
console.log(repo.findAll()); // Connecting to postgres://localhost/mydb, ['Alice', 'Bob']
```

Контейнер читает `design:paramtypes` и рекурсивно разрешает зависимости — без единой строки конфигурации вручную.

## Практический пример: система валидации

Метаданные удобно использовать для декларативной валидации, аналогично библиотеке `class-validator`:

```typescript
import 'reflect-metadata';

interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'min' | 'max' | 'required';
  value?: number;
  message: string;
}

const VALIDATION_KEY = 'validation:rules';

function addRule(rule: ValidationRule): PropertyDecorator {
  return (target, propertyKey) => {
    const existing: ValidationRule[] =
      Reflect.getMetadata(VALIDATION_KEY, target, propertyKey as string) ?? [];
    Reflect.defineMetadata(
      VALIDATION_KEY,
      [...existing, rule],
      target,
      propertyKey as string
    );
  };
}

function MinLength(length: number): PropertyDecorator {
  return addRule({
    type: 'minLength',
    value: length,
    message: `Минимальная длина: ${length}`,
  });
}

function MaxLength(length: number): PropertyDecorator {
  return addRule({
    type: 'maxLength',
    value: length,
    message: `Максимальная длина: ${length}`,
  });
}

function Required(): PropertyDecorator {
  return addRule({ type: 'required', message: 'Поле обязательно' });
}

function validate(instance: object): string[] {
  const errors: string[] = [];
  const proto = Object.getPrototypeOf(instance);

  for (const key of Object.keys(instance)) {
    const rules: ValidationRule[] =
      Reflect.getMetadata(VALIDATION_KEY, proto, key) ?? [];
    const value = (instance as any)[key];

    for (const rule of rules) {
      if (rule.type === 'required' && !value) {
        errors.push(`${key}: ${rule.message}`);
      }
      if (rule.type === 'minLength' && typeof value === 'string' && value.length < rule.value!) {
        errors.push(`${key}: ${rule.message}`);
      }
      if (rule.type === 'maxLength' && typeof value === 'string' && value.length > rule.value!) {
        errors.push(`${key}: ${rule.message}`);
      }
    }
  }

  return errors;
}

// Модель
class CreateUserDto {
  @Required()
  @MinLength(2)
  @MaxLength(50)
  name: string = '';

  @Required()
  @MinLength(6)
  password: string = '';
}

// Проверка
const dto = new CreateUserDto();
dto.name = 'A';
dto.password = '';

const errors = validate(dto);
console.log(errors);
// ['name: Минимальная длина: 2', 'password: Поле обязательно', 'password: Минимальная длина: 6']
```

## Наследование и прототипная цепочка

Важный нюанс: `getMetadata` идёт по цепочке прототипов, а `getOwnMetadata` — только по собственным метаданным объекта. Это критично при наследовании:

```typescript
import 'reflect-metadata';

function Tag(value: string): ClassDecorator {
  return (target) => Reflect.defineMetadata('tag', value, target);
}

@Tag('base')
class Base {}

class Child extends Base {}

// getMetadata ищет по прототипной цепочке
console.log(Reflect.getMetadata('tag', Child)); // 'base'

// getOwnMetadata — только собственные
console.log(Reflect.getOwnMetadata('tag', Child)); // undefined
console.log(Reflect.getOwnMetadata('tag', Base)); // 'base'
```

При работе с иерархиями классов учитывайте это поведение — иначе дочерние классы могут неожиданно унаследовать метаданные родителя.

## Типизация ключей метаданных

Чтобы избежать опечаток в строковых ключах и улучшить поддержку IDE, рекомендуется использовать `Symbol` или константы:

```typescript
import 'reflect-metadata';

// Вместо строк — символы
const META_ROLES = Symbol('meta:roles');
const META_ROUTE = Symbol('meta:route');

function Roles(...roles: string[]): MethodDecorator {
  return (target, key) => {
    Reflect.defineMetadata(META_ROLES, roles, target, key as string);
  };
}

function Get(path: string): MethodDecorator {
  return (target, key) => {
    Reflect.defineMetadata(META_ROUTE, { method: 'GET', path }, target, key as string);
  };
}

class PostController {
  @Get('/posts')
  @Roles('admin', 'editor')
  getPosts() {
    return [];
  }
}

const route = Reflect.getMetadata(META_ROUTE, PostController.prototype, 'getPosts');
const roles = Reflect.getMetadata(META_ROLES, PostController.prototype, 'getPosts');

console.log(route); // { method: 'GET', path: '/posts' }
console.log(roles); // ['admin', 'editor']
```

## Частые ошибки

**Забыть импортировать `reflect-metadata`**. Все методы `Reflect.defineMetadata` / `Reflect.getMetadata` будут `undefined`. Импорт должен быть первым в точке входа.

**Не включить `emitDecoratorMetadata`**. Без этого флага `design:paramtypes` и `design:type` не будут эмитироваться — DI-контейнер не сможет разрешить зависимости.

**Циклические зависимости**. Если класс A зависит от B, а B — от A, TypeScript в момент компиляции вернёт `undefined` как тип одного из параметров. Решение — `forwardRef` (паттерн из NestJS) или рефакторинг.

**Использование с `target: 'ESNext'` и bundler**. Некоторые сборщики (esbuild, Vite без специального плагина) не поддерживают `emitDecoratorMetadata`. Нужен `@swc/core` с нужными опциями или Babel с плагином `babel-plugin-transform-typescript`.

## Итог

`reflect-metadata` превращает декораторы TypeScript из простых функций-обёрток в полноценную систему аннотаций. Ключевые моменты:

- `Reflect.defineMetadata` / `Reflect.getMetadata` — основа хранения и чтения метаданных;
- `emitDecoratorMetadata` даёт доступ к реальным TypeScript-типам через `design:paramtypes`, `design:type`, `design:returntype`;
- На этом механизме построены NestJS, TypeORM, InversifyJS, class-validator;
- Используйте `Symbol` как ключи метаданных, чтобы избежать коллизий;
- Помните о разнице между `getMetadata` (с прототипной цепочкой) и `getOwnMetadata`.

Чтобы глубже разобраться с декораторами, системой типов и продвинутыми паттернами TypeScript, смотрите курс на PurpleSchool:

[Курс по TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=decorators-reflect-metadata)
