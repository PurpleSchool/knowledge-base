---
metaTitle: "TypeScript accessor: авто-аксессоры в классах"
metaDescription: "Разбираем ключевое слово accessor в TypeScript 4.9+: как работают авто-аксессоры, отличия от get/set, применение с декораторами и практические примеры."
author: "Антон Ларичев"
title: "TypeScript accessor — новое ключевое слово для свойств класса"
preview: "Что такое accessor в TypeScript, как он генерирует getter и setter автоматически и зачем это нужно при работе с декораторами."
---

## Что такое accessor

В TypeScript 4.9 появилось ключевое слово `accessor` — часть предложения TC39 «Auto-Accessors» для ECMAScript. Оно позволяет объявить свойство класса, которое автоматически получает скрытое хранилище, а также публичный getter и setter.

До появления `accessor` разработчики вручную писали пару `get`/`set` и отдельное приватное поле для хранения значения. Теперь это можно сделать одной строкой.

```typescript
class User {
  accessor name: string = 'Антон';
}
```

Компилятор разворачивает это в следующую конструкцию:

```typescript
class User {
  #name: string = 'Антон';

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    this.#name = value;
  }
}
```

Приватное поле хранения создаётся с использованием синтаксиса приватных полей JavaScript (`#`), поэтому оно по-настоящему недоступно снаружи класса — в отличие от `private` из TypeScript, которое является лишь проверкой на этапе компиляции.

## Синтаксис и базовое использование

Объявление выглядит так же, как обычное свойство класса, только с добавлением ключевого слова `accessor` перед именем:

```typescript
class Product {
  accessor title: string = '';
  accessor price: number = 0;
  accessor inStock: boolean = true;
}

const product = new Product();
product.title = 'Курс TypeScript';
console.log(product.title); // 'Курс TypeScript'
```

Поведение для внешнего кода ничем не отличается от обычного публичного свойства — читать и писать можно через `.`.

### Инициализация значения

Значение по умолчанию задаётся сразу при объявлении или через конструктор:

```typescript
class Circle {
  accessor radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  get area(): number {
    return Math.PI * this.radius ** 2;
  }
}

const c = new Circle(5);
console.log(c.area); // 78.53...
```

### Модификаторы доступа

`accessor` поддерживает все стандартные модификаторы TypeScript: `public`, `protected`, `private`, `readonly`, `static`, а также `abstract` в абстрактных классах.

```typescript
class Base {
  accessor id: number = 0;
  protected accessor secret: string = '';
  static accessor instanceCount: number = 0;
}

abstract class Shape {
  abstract accessor color: string;
}

class Square extends Shape {
  accessor color: string = 'red';
}
```

`readonly accessor` запрещает присвоение значения после инициализации:

```typescript
class Config {
  readonly accessor version: string = '1.0.0';
}

const config = new Config();
console.log(config.version); // '1.0.0'
config.version = '2.0.0';    // Error: Cannot assign to 'version' because it is a read-only property.
```

## Сравнение с ручным getter/setter

Посмотрим, как выглядел код до появления `accessor` и как он выглядит сейчас.

### До accessor

```typescript
class Temperature {
  private _celsius: number = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new RangeError('Температура не может быть ниже абсолютного нуля');
    }
    this._celsius = value;
  }
}
```

### После accessor (с переопределением)

`accessor` сам по себе не добавляет логику в getter/setter — он лишь генерирует их автоматически. Чтобы добавить валидацию, нужно переопределить getter и setter в подклассе или использовать декоратор.

Вариант через наследование:

```typescript
class BaseTemperature {
  accessor celsius: number = 0;
}

class ValidatedTemperature extends BaseTemperature {
  get celsius(): number {
    return super.celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new RangeError('Температура не может быть ниже абсолютного нуля');
    }
    super.celsius = value;
  }
}
```

На практике основная ценность `accessor` раскрывается именно при использовании с декораторами.

## accessor и декораторы

Главная мотивация для введения `accessor` — удобная точка для применения декораторов (в стандарте Stage 3 / TypeScript с `experimentalDecorators: false` или при включённом `experimentalDecorators: true`).

Декораторы для обычного поля (`field decorator`) имеют ограниченные возможности: они не могут перехватить чтение и запись значения, потому что не контролируют getter/setter. Декораторы для `accessor` получают доступ к `get` и `set`, что позволяет реализовать любую логику.

### Пример: декоратор валидации

```typescript
function minValue(min: number) {
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    return {
      get(this: This): Value {
        return target.get.call(this);
      },
      set(this: This, value: Value) {
        if (value < min) {
          throw new RangeError(
            `${String(context.name)}: значение ${value} меньше минимума ${min}`
          );
        }
        target.set.call(this, value);
      },
    };
  };
}

class Product {
  @minValue(0)
  accessor price: number = 0;

  @minValue(1)
  accessor quantity: number = 1;
}

const p = new Product();
p.price = 100;  // OK
p.price = -5;   // RangeError: price: значение -5 меньше минимума 0
```

### Пример: декоратор логирования

```typescript
function logged<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  const name = String(context.name);
  return {
    get(this: This): Value {
      const value = target.get.call(this);
      console.log(`get ${name} =>`, value);
      return value;
    },
    set(this: This, value: Value) {
      console.log(`set ${name} <=`, value);
      target.set.call(this, value);
    },
  };
}

class UserProfile {
  @logged
  accessor email: string = '';

  @logged
  accessor age: number = 0;
}

const user = new UserProfile();
user.email = 'test@example.com'; // set email <= test@example.com
console.log(user.email);          // get email => test@example.com
```

### Тип ClassAccessorDecoratorContext

Для написания декораторов к `accessor` TypeScript предоставляет встроенные типы:

```typescript
// Описывает объект { get, set } для доступа к внутреннему хранилищу
type ClassAccessorDecoratorTarget<This, Value> = {
  get(this: This): Value;
  set(this: This, value: Value): void;
};

// Контекст, передаваемый декоратору
type ClassAccessorDecoratorContext<This, Value> = {
  kind: 'accessor';
  name: string | symbol;
  static: boolean;
  private: boolean;
  access: { get(object: This): Value; set(object: This, value: Value): void };
  addInitializer(initializer: (this: This) => void): void;
};

// Возвращаемый тип из функции-декоратора
type ClassAccessorDecoratorResult<This, Value> = {
  get?(this: This): Value;
  set?(this: This, value: Value): void;
  init?(this: This, value: Value): Value;
};
```

Обратите внимание на поле `init` в результате декоратора — оно позволяет трансформировать начальное значение при инициализации экземпляра:

```typescript
function uppercase<This>(
  target: ClassAccessorDecoratorTarget<This, string>,
  _context: ClassAccessorDecoratorContext<This, string>
): ClassAccessorDecoratorResult<This, string> {
  return {
    init(_this: This, value: string): string {
      return value.toUpperCase();
    },
    set(this: This, value: string) {
      target.set.call(this, value.toUpperCase());
    },
  };
}

class Category {
  @uppercase
  accessor name: string = 'frontend';
}

const cat = new Category();
console.log(cat.name); // 'FRONTEND'
cat.name = 'backend';
console.log(cat.name); // 'BACKEND'
```

## Реактивность и наблюдаемые свойства

Один из популярных паттернов с `accessor` — реализация реактивных или наблюдаемых свойств без сторонних библиотек:

```typescript
type Listener<T> = (newValue: T, oldValue: T) => void;

function observable<This extends object, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  const listenersKey = Symbol(`${String(context.name)}_listeners`);

  context.addInitializer(function (this: This & Record<symbol, Listener<Value>[]>) {
    (this as any)[listenersKey] = [];
  });

  return {
    set(this: This, newValue: Value) {
      const oldValue = target.get.call(this);
      target.set.call(this, newValue);
      const listeners = (this as any)[listenersKey] as Listener<Value>[];
      for (const listener of listeners) {
        listener(newValue, oldValue);
      }
    },
  };
}

function watch<T extends object, V>(
  instance: T,
  propertyName: keyof T,
  listener: Listener<V>
): void {
  const key = Symbol(`${String(propertyName)}_listeners`);
  ((instance as any)[key] as Listener<V>[]).push(listener);
}

class Store {
  @observable
  accessor count: number = 0;
}

const store = new Store();
watch(store, 'count', (next, prev) => {
  console.log(`count: ${prev} -> ${next}`);
});

store.count = 1; // count: 0 -> 1
store.count = 5; // count: 1 -> 5
```

## Ограничения

### Нет деструктуризации геттера

Если деструктурировать экземпляр, `accessor`-свойство не сохранит связь с объектом:

```typescript
class Counter {
  accessor value: number = 0;
}

const counter = new Counter();
const { value } = counter; // просто примитив, копия
counter.value = 42;
console.log(value); // 0, не 42
```

Это не баг, а ожидаемое поведение: деструктуризация копирует значение, а не ссылку на свойство.

### Совместимость с tsconfig

Для работы `accessor` нужен TypeScript 4.9 или выше. Убедитесь, что `target` в `tsconfig.json` установлен как минимум в `ES2015` (иначе приватные поля `#name` не будут поддержаны в рантайме, и компилятор сгенерирует другой вывод).

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "experimentalDecorators": false
  }
}
```

`experimentalDecorators: false` (значение по умолчанию начиная с TS 5.0) включает поддержку стандартных декораторов Stage 3, которые совместимы с `accessor`. Если вы используете старые декораторы (`experimentalDecorators: true`), синтаксис будет немного другим.

## Когда использовать accessor

`accessor` стоит применять в следующих ситуациях:

- Вы пишете декоратор, которому нужно перехватывать чтение или запись свойства.
- Вы хотите сделать свойство реактивным, валидируемым или наблюдаемым через декоратор.
- Вы проектируете библиотеку или фреймворк, где декораторы являются публичным API.
- Вы хотите обеспечить инкапсуляцию значения без написания шаблонного кода `#field + get + set`.

Для простых свойств без дополнительной логики обычное поле класса (`name: string`) по-прежнему предпочтительнее — оно прямолинейнее и не добавляет лишних слоёв абстракции.

---

Чтобы глубже разобраться с классами, декораторами и другими возможностями TypeScript, смотрите курс на PurpleSchool:
https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-accessor