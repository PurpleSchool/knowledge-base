---
metaTitle: Обзор использования декораторов в TypeScript
metaDescription: Разбираемся как использовать декораторы в TypeScript
author: Дмитрий Нечаев
title: Обзор использования декораторов в TypeScript
preview: Учимся пользоваться декораторами в TypeScript. Разбираем примеры использования
---

Декораторы являются мощным инструментом декларативного программирования в TypeScript. Они позволяют добавлять метаданные к классам и их членам, изменяя их поведение без непосредственного изменения кода. Декораторы представляют собой функции, которые могут применяться к классам, методам, методам доступа (геттерам и сеттерам), свойствам и параметрам.

### Основы декораторов

Чтобы использовать декораторы в TypeScript, необходимо включить поддержку экспериментальных декораторов в файле конфигурации `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}

```

Декораторы представляют собой функции, которые принимают в качестве аргументов метаданные цели декорирования. Рассмотрим применение декораторов к различным элементам.

### Декораторы классов

Декораторы классов позволяют добавлять поведение или данные к классам. Декоратор класса принимает в качестве аргумента конструктор класса.

### Пример декоратора класса

```tsx
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  constructor(public greeting: string) {}

  greet() {
    return `Hello, ${this.greeting}`;
  }
}

let greeter = new Greeter("world");
console.log(greeter.greet()); // "Hello, world"

```

В этом примере декоратор `sealed` запечатывает класс `Greeter`, предотвращая добавление новых свойств к его экземплярам.

### Декораторы методов

Декораторы методов позволяют изменять или добавлять поведение к методам классов. Декоратор метода принимает в качестве аргументов прототип класса, имя метода и дескриптор свойства.

### Пример декоратора метода

```tsx
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with arguments: ${JSON.stringify(args)}`);
    return originalMethod.apply(this, args);
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calculator = new Calculator();
console.log(calculator.add(2, 3)); // "Calling add with arguments: [2,3]" "5"

```

В этом примере декоратор `log` добавляет логирование вызова метода `add` класса `Calculator`.

### Декораторы методов доступа (геттеров и сеттеров)

Декораторы методов доступа применяются к геттерам и сеттерам классов и работают аналогично декораторам методов.

### Пример декоратора метода доступа

```tsx
function enumerable(value: boolean) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = value;
  };
}

class Person {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  @enumerable(false)
  get name() {
    return this._name;
  }
}

const person = new Person("Tom");
for (let key in person) {
  console.log(key); // не выводит name, так как enumerable=false
}

```

В этом примере декоратор `enumerable` управляет перечисляемостью свойства `name`.

### Декораторы свойств

Декораторы свойств позволяют добавлять поведение к свойствам классов. Декоратор свойства принимает в качестве аргументов прототип класса и имя свойства.

### Пример декоратора свойства

```tsx
function format(target: any, propertyKey: string) {
  let value: string;

  const getter = () => value;
  const setter = (newValue: string) => {
    value = newValue.trim().toUpperCase();
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true
  });
}

class Message {
  @format
  content: string;

  constructor(content: string) {
    this.content = content;
  }
}

const message = new Message("  hello world  ");
console.log(message.content); // "HELLO WORLD"

```

В этом примере декоратор `format` форматирует значение свойства `content`, обрезая пробелы и переводя строку в верхний регистр.

### Декораторы параметров

Декораторы параметров применяются к параметрам методов и конструкторов классов. Декоратор параметра принимает в качестве аргументов прототип класса, имя метода и индекс параметра.

### Пример декоратора параметра

```tsx
function logParameter(target: any, propertyKey: string, parameterIndex: number) {
  const existingParameters = Reflect.getOwnMetadata("logParameters", target, propertyKey) || [];
  existingParameters.push(parameterIndex);
  Reflect.defineMetadata("logParameters", existingParameters, target, propertyKey);
}

class Printer {
  print(@logParameter message: string) {
    console.log(message);
  }
}

const printer = new Printer();
printer.print("Hello, TypeScript!");

```

В этом примере декоратор `logParameter` добавляет метаданные к параметру метода `print`.

### Заключение

Декораторы в TypeScript являются мощным инструментом для добавления метаданных к классам, методам, методам доступа, свойствам и параметрам, изменяя их поведение без изменения их исходного кода. Декораторы позволяют сделать код более декларативным и читаемым, улучшая его структуру и управляемость.
