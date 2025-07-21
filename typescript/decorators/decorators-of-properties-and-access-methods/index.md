---
metaTitle: Декораторы свойств и методов доступа в TypeScript
metaDescription: Разбираемся как использовать декораторы свойств и методов доступа в TypeScript
author: Дмитрий Нечаев
title: Декораторы свойств и методов доступа в TypeScript
preview: Учимся пользоваться декораторами свойств и методов доступа в TypeScript. Разбираем примеры использования
---

Декораторы в TypeScript позволяют добавлять метаданные к свойствам, методам и параметрам классов. В этой статье мы подробно рассмотрим декораторы свойств и методы доступа (геттеры и сеттеры).

### Декораторы свойств

Декораторы свойств позволяют добавлять или изменять метаданные для свойств класса. Они применяются непосредственно к свойству и принимают два аргумента:

1. **target**: Прототип класса, к которому принадлежит свойство (если свойство статическое, то сам конструктор класса).
2. **propertyKey**: Имя свойства.

Декораторы свойств и методов доступа предоставляют мощный механизм для добавления метаданных и изменения поведения свойств и методов доступа классов. Чтобы уверенно использовать декораторы свойств и методов доступа и создавать надежный код, необходимо глубокое понимание TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=dekoratory-svoystv-i-metodov-dostupa-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример декоратора свойства

Создадим декоратор `logProperty`, который будет выводить в консоль сообщение при изменении значения свойства:

```tsx
function logProperty(target: any, propertyKey: string) {
  let value = target[propertyKey];

  const getter = () => {
    console.log(`Getting value of ${propertyKey}: ${value}`);
    return value;
  };

  const setter = (newValue) => {
    console.log(`Setting value of ${propertyKey} to ${newValue}`);
    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true
  });
}

class User {
  @logProperty
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

const user = new User('Alice');
console.log(user.name); // Логирует получение значения
user.name = 'Bob'; // Логирует установку нового значения

```

В этом примере декоратор `logProperty` оборачивает свойство `name`, добавляя логирование при его чтении и записи.

### Декоратор метода доступа

Декораторы методов доступа применяются к геттерам и сеттерам класса. Они позволяют добавлять или изменять метаданные для методов доступа и принимают те же аргументы, что и декораторы методов:

1. **target**: Прототип класса, к которому принадлежит метод доступа (если метод статический, то сам конструктор класса).
2. **propertyKey**: Имя метода доступа.
3. **descriptor**: Дескриптор свойства, содержащий информацию о методе доступа.

### Пример декоратора метода доступа

Создадим декоратор `logAccess`, который будет логировать вызовы геттера и сеттера:

```tsx
function logAccess(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalGet = descriptor.get;
  const originalSet = descriptor.set;

  if (originalGet) {
    descriptor.get = function () {
      console.log(`Getting value of ${propertyKey}`);
      return originalGet.call(this);
    };
  }

  if (originalSet) {
    descriptor.set = function (value) {
      console.log(`Setting value of ${propertyKey} to ${value}`);
      originalSet.call(this, value);
    };
  }
}

class Person {
  private _age: number;

  constructor(age: number) {
    this._age = age;
  }

  @logAccess
  get age(): number {
    return this._age;
  }

  @logAccess
  set age(value: number) {
    this._age = value;
  }
}

const person = new Person(25);
console.log(person.age); // Логирует получение значения
person.age = 30; // Логирует установку нового значения

```

В этом примере декоратор `logAccess` добавляет логирование при вызове геттера и сеттера свойства `age`.

### Заключение

Декораторы свойств и методов доступа в TypeScript предоставляют мощные инструменты для добавления метаданных и изменения поведения свойств и методов доступа классов. С их помощью можно легко реализовать такие функции, как логирование, валидация, кэширование и многое другое, не изменяя основной код классов. Это делает код более модульным, читаемым и легко расширяемым.

Правильное использование декораторов свойств и методов доступа может значительно упростить разработку и поддержку сложных приложений. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=dekoratory-svoystv-i-metodov-dostupa-v-typescript) вы получите все необходимые знания и навыки для работы с декораторами в TypeScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
