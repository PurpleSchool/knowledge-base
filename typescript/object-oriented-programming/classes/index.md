---
metaTitle: Классы в TypeScript
metaDescription: Классы в TypeScript
author: Дмитрий Нечаев
title: Классы в TypeScript
preview: Классы в TypeScript. Разбираем примеры использования
---

TypeScript реализует объектно-ориентированный подход и предоставляет полноценную поддержку классов. Класс представляет собой шаблон для создания объектов и инкапсулирует функциональность, которую должен иметь объект. Класс определяет состояние и поведение, которыми обладает объект.

### Объявление класса

Класс объявляется с использованием ключевого слова `class`, за которым следует имя класса.

Классы являются основой объектно-ориентированного программирования в TypeScript и позволяют создавать сложные структуры данных и компоненты. Чтобы в полной мере освоить возможности классов и создавать надежные приложения, необходимо глубокое понимание TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=klassy-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример объявления класса

```tsx
class Person {
    // Поля (свойства) класса
    name: string;
    age: number;

    // Конструктор класса
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    // Метод класса
    greet(): void {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
    }
}

// Создание экземпляра класса
let person = new Person("Alice", 25);
person.greet(); // "Hello, my name is Alice and I am 25 years old."

```

### Поля класса

Поля класса (или свойства) определяют состояние объекта. Они объявляются внутри класса и могут иметь различные уровни доступа.

### Пример полей класса

```tsx
class Car {
    // Поля класса
    make: string;
    model: string;
    year: number;

    // Конструктор класса
    constructor(make: string, model: string, year: number) {
        this.make = make;
        this.model = model;
        this.year = year;
    }
}

```

### Методы класса

Методы класса определяют поведение объекта. Они объявляются внутри класса и могут вызываться у экземпляра класса.

### Пример методов класса

```tsx
class Calculator {
    // Метод сложения
    add(a: number, b: number): number {
        return a + b;
    }

    // Метод вычитания
    subtract(a: number, b: number): number {
        return a - b;
    }
}

let calculator = new Calculator();
console.log(calculator.add(2, 3)); // 5
console.log(calculator.subtract(5, 3)); // 2

```

### Конструктор класса

Конструктор используется для инициализации объекта при его создании. Он объявляется с использованием ключевого слова `constructor`.

### Пример конструктора класса

```tsx
class Rectangle {
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    area(): number {
        return this.width * this.height;
    }
}

let rectangle = new Rectangle(10, 20);
console.log(rectangle.area()); // 200

```

### Модификаторы доступа

TypeScript поддерживает модификаторы доступа, такие как `public`, `private` и `protected`, для управления доступом к полям и методам класса.

### Пример использования модификаторов доступа

```tsx
class Employee {
    public name: string;
    private salary: number;

    constructor(name: string, salary: number) {
        this.name = name;
        this.salary = salary;
    }

    // Публичный метод
    public getDetails(): string {
        return `Name: ${this.name}, Salary: ${this.salary}`;
    }

    // Приватный метод
    private calculateTax(): number {
        return this.salary * 0.2;
    }
}

let employee = new Employee("Bob", 50000);
console.log(employee.getDetails()); // "Name: Bob, Salary: 50000"
// console.log(employee.calculateTax()); // Ошибка: метод 'calculateTax' приватный

```

### Наследование

TypeScript поддерживает наследование, что позволяет одному классу наследовать свойства и методы другого класса с использованием ключевого слова `extends`.

### Пример наследования

```tsx
class Animal {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    makeSound(): void {
        console.log(`${this.name} makes a sound.`);
    }
}

class Dog extends Animal {
    constructor(name: string) {
        super(name);
    }

    makeSound(): void {
        console.log(`${this.name} barks.`);
    }
}

let dog = new Dog("Rex");
dog.makeSound(); // "Rex barks."

```

### Абстрактные классы

Абстрактные классы не могут быть инстанцированы и служат для создания базовых классов, которые могут содержать абстрактные методы. Абстрактные методы должны быть реализованы в классах-наследниках.

### Пример абстрактного класса

```tsx
abstract class Shape {
    abstract area(): number;

    describe(): void {
        console.log(`This shape has an area of ${this.area()} square units.`);
    }
}

class Circle extends Shape {
    radius: number;

    constructor(radius: number) {
        super();
        this.radius = radius;
    }

    area(): number {
        return Math.PI * this.radius ** 2;
    }
}

let circle = new Circle(5);
circle.describe(); // "This shape has an area of 78.53981633974483 square units."

```

### Интерфейсы и классы

Классы могут реализовывать интерфейсы с помощью ключевого слова `implements`, что обеспечивает соответствие структуры класса определенному интерфейсу.

### Пример реализации интерфейса

```tsx
interface Drivable {
    drive(): void;
}

class Car implements Drivable {
    drive(): void {
        console.log("The car is driving.");
    }
}

let car = new Car();
car.drive(); // "The car is driving."

```

### Свойства с доступом через геттеры и сеттеры

TypeScript позволяет создавать свойства с использованием геттеров и сеттеров для контроля доступа к полям класса.

### Пример использования геттеров и сеттеров

```tsx
class Person {
    private _age: number;

    constructor(age: number) {
        this._age = age;
    }

    get age(): number {
        return this._age;
    }

    set age(value: number) {
        if (value < 0) {
            throw new Error("Age cannot be negative");
        }
        this._age = value;
    }
}

let person = new Person(25);
console.log(person.age); // 25
person.age = 30;
console.log(person.age); // 30
// person.age = -5; // Ошибка: Age cannot be negative

```

### Статические свойства и методы

Статические свойства и методы принадлежат классу, а не его экземплярам. Они объявляются с использованием ключевого слова `static`.

### Пример использования статических свойств и методов

```tsx
class MathUtil {
    static PI: number = 3.14;

    static calculateCircumference(radius: number): number {
        return 2 * MathUtil.PI * radius;
    }
}

console.log(MathUtil.PI); // 3.14
console.log(MathUtil.calculateCircumference(10)); // 62.8

```

### Заключение

Классы в TypeScript предоставляют мощные возможности для создания объектно-ориентированных приложений. Они позволяют инкапсулировать состояние и поведение объектов, использовать наследование для создания иерархий классов, применять интерфейсы для определения контрактов, а также контролировать доступ к свойствам и методам с помощью модификаторов доступа. Гибкость и строгость типизации, предоставляемые TypeScript, делают разработку на этом языке эффективной и безопасной.

Классы позволяют создавать переиспользуемые компоненты и структурировать код. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=klassy-v-typescript) вы изучите все аспекты работы с классами в TypeScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
