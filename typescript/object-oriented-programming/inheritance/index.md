---
metaTitle: Наследование в TypeScript
metaDescription: Наследование в TypeScript
author: Дмитрий Нечаев
title: Наследование в TypeScript
preview: Наследование в TypeScript. Разбираем примеры использования
---

Наследование является одним из ключевых принципов объектно-ориентированного программирования (ООП), и TypeScript, как строго типизированный язык, поддерживает его на высоком уровне. Наследование позволяет создавать новые классы на основе уже существующих, что способствует повторному использованию кода и упрощает его сопровождение. В TypeScript наследование реализуется с помощью ключевого слова `extends`.

### Основы наследования

Когда один класс наследует другой, он приобретает все свойства и методы родительского класса, при этом может добавлять свои собственные или переопределять унаследованные. Класс, который наследует другой класс, называется дочерним или производным классом, а класс, от которого наследуются, называется родительским или базовым классом.

### Пример базового и дочернего классов

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
        super(name); // Вызов конструктора базового класса
    }

    makeSound(): void {
        console.log(`${this.name} barks.`);
    }
}

let dog = new Dog("Rex");
dog.makeSound(); // "Rex barks."

```

### Конструкторы и наследование

Когда дочерний класс имеет собственный конструктор, он должен вызывать конструктор базового класса с помощью функции `super`. Это необходимо для инициализации свойств, объявленных в базовом классе.

### Пример с конструкторами

```tsx
class Vehicle {
    make: string;
    model: string;

    constructor(make: string, model: string) {
        this.make = make;
        this.model = model;
    }

    displayInfo(): void {
        console.log(`Vehicle: ${this.make} ${this.model}`);
    }
}

class Car extends Vehicle {
    year: number;

    constructor(make: string, model: string, year: number) {
        super(make, model); // Вызов конструктора базового класса
        this.year = year;
    }

    displayInfo(): void {
        super.displayInfo(); // Вызов метода базового класса
        console.log(`Year: ${this.year}`);
    }
}

let car = new Car("Toyota", "Camry", 2020);
car.displayInfo();
// "Vehicle: Toyota Camry"
// "Year: 2020"

```

### Переопределение методов

Дочерний класс может переопределять методы базового класса, предоставляя свою реализацию. Для вызова метода базового класса из переопределенного метода используется ключевое слово `super`.

### Пример переопределения методов

```tsx
class Bird {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    fly(): void {
        console.log(`${this.name} is flying.`);
    }
}

class Eagle extends Bird {
    fly(): void {
        console.log(`${this.name} is soaring high.`);
    }
}

let eagle = new Eagle("Eagle");
eagle.fly(); // "Eagle is soaring high."

```

### Модификаторы доступа и наследование

TypeScript поддерживает модификаторы доступа `public`, `private` и `protected`, которые контролируют доступ к свойствам и методам класса. Модификатор `protected` позволяет свойствам и методам быть доступными в дочерних классах, но не снаружи этих классов.

### Пример использования `protected`

```tsx
class Person {
    protected name: string;

    constructor(name: string) {
        this.name = name;
    }
}

class Employee extends Person {
    private salary: number;

    constructor(name: string, salary: number) {
        super(name);
        this.salary = salary;
    }

    displayInfo(): void {
        console.log(`Employee: ${this.name}, Salary: ${this.salary}`);
    }
}

let employee = new Employee("Alice", 50000);
employee.displayInfo(); // "Employee: Alice, Salary: 50000"
// console.log(employee.name); // Ошибка: свойство 'name' защищено

```

### Абстрактные классы и методы

Абстрактные классы используются для создания базовых классов, которые не могут быть инстанцированы напрямую. Абстрактные методы в таких классах должны быть реализованы в дочерних классах.

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

### Интерфейсы и наследование

Классы могут реализовывать интерфейсы, обеспечивая наличие определенных методов и свойств. Классы могут также наследовать другие классы и одновременно реализовывать интерфейсы.

### Пример реализации интерфейса

```tsx
interface Movable {
    move(): void;
}

class Vehicle implements Movable {
    move(): void {
        console.log("Vehicle is moving.");
    }
}

class Bike extends Vehicle {
    move(): void {
        console.log("Bike is moving.");
    }
}

let bike = new Bike();
bike.move(); // "Bike is moving."

```

### Множественное наследование интерфейсов

TypeScript поддерживает множественное наследование интерфейсов, что позволяет классу реализовывать несколько интерфейсов.

### Пример множественного наследования интерфейсов

```tsx
interface Flyable {
    fly(): void;
}

interface Swimmable {
    swim(): void;
}

class Duck implements Flyable, Swimmable {
    fly(): void {
        console.log("Duck is flying.");
    }

    swim(): void {
        console.log("Duck is swimming.");
    }
}

let duck = new Duck();
duck.fly(); // "Duck is flying."
duck.swim(); // "Duck is swimming."

```

### Заключение

Наследование в TypeScript предоставляет мощные инструменты для создания иерархий классов и повторного использования кода. Оно позволяет строить сложные системы, разделяя функциональность между различными уровнями абстракции. Модификаторы доступа, абстрактные классы и интерфейсы добавляют гибкость и строгость в управление доступом и реализацией функциональности. Использование наследования помогает сделать код более организованным, читаемым и легко поддерживаемым.