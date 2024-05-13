---
metaTitle: Модификаторы доступа в TypeScript
metaDescription: Модификаторы доступа в TypeScript
author: Дмитрий Нечаев
title: Модификаторы доступа в TypeScript
preview: Модификаторы доступа в TypeScript. Разбираем примеры использования
---

Модификаторы доступа в TypeScript позволяют управлять доступом к свойствам и методам классов. Они помогают инкапсулировать данные, защищать внутреннее состояние объектов и управлять видимостью компонентов. В TypeScript доступны три модификатора доступа: `public`, `protected` и `private`.

### Модификатор `public`

Модификатор `public` является модификатором по умолчанию. Свойства и методы, помеченные как `public`, доступны из любого места, как внутри класса, так и вне его.

### Пример использования `public`

```tsx
class Person {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public greet(): void {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

let person = new Person("Alice");
console.log(person.name); // "Alice"
person.greet(); // "Hello, my name is Alice."

```

В этом примере свойство `name` и метод `greet` доступны как внутри, так и вне класса `Person`.

### Модификатор `protected`

Свойства и методы, помеченные как `protected`, доступны только внутри класса и его наследников. Это позволяет защищать внутреннее состояние объекта от прямого доступа извне, но позволяет наследникам использовать и изменять эти свойства и методы.

### Пример использования `protected`

```tsx
class Animal {
    protected name: string;

    constructor(name: string) {
        this.name = name;
    }

    protected makeSound(): void {
        console.log(`${this.name} makes a sound.`);
    }
}

class Dog extends Animal {
    constructor(name: string) {
        super(name);
    }

    public bark(): void {
        console.log(`${this.name} barks.`);
        this.makeSound(); // Вызов защищенного метода родительского класса
    }
}

let dog = new Dog("Rex");
dog.bark(); // "Rex barks." затем "Rex makes a sound."
// console.log(dog.name); // Ошибка: свойство 'name' защищено
// dog.makeSound(); // Ошибка: метод 'makeSound' защищен

```

В этом примере свойство `name` и метод `makeSound` доступны внутри класса `Animal` и его наследника `Dog`, но недоступны извне.

### Модификатор `private`

Свойства и методы, помеченные как `private`, доступны только внутри самого класса, в котором они объявлены. Они недоступны ни в классе-наследнике, ни извне.

### Пример использования `private`

```tsx
class BankAccount {
    private balance: number;

    constructor(initialBalance: number) {
        this.balance = initialBalance;
    }

    public deposit(amount: number): void {
        if (amount > 0) {
            this.balance += amount;
            console.log(`Deposited: ${amount}. New balance: ${this.balance}`);
        }
    }

    public getBalance(): number {
        return this.balance;
    }
}

let account = new BankAccount(100);
account.deposit(50); // "Deposited: 50. New balance: 150"
console.log(account.getBalance()); // 150
// console.log(account.balance); // Ошибка: свойство 'balance' приватно

```

В этом примере свойство `balance` доступно только внутри класса `BankAccount` и недоступно извне, что защищает внутреннее состояние счета от прямого изменения.

### Примеры использования модификаторов доступа

### Пример с комбинацией модификаторов

```tsx
class Vehicle {
    public make: string;
    protected model: string;
    private year: number;

    constructor(make: string, model: string, year: number) {
        this.make = make;
        this.model = model;
        this.year = year;
    }

    public getDetails(): void {
        console.log(`Make: ${this.make}, Model: ${this.model}, Year: ${this.year}`);
    }
}

class Car extends Vehicle {
    private mileage: number;

    constructor(make: string, model: string, year: number, mileage: number) {
        super(make, model, year);
        this.mileage = mileage;
    }

    public getCarDetails(): void {
        console.log(`Make: ${this.make}, Model: ${this.model}, Mileage: ${this.mileage}`);
        // console.log(`Year: ${this.year}`); // Ошибка: свойство 'year' приватно
    }
}

let car = new Car("Toyota", "Camry", 2020, 5000);
car.getDetails(); // "Make: Toyota, Model: Camry, Year: 2020"
car.getCarDetails(); // "Make: Toyota, Model: Camry, Mileage: 5000"

```

В этом примере класс `Vehicle` содержит свойства с разными модификаторами доступа. Класс `Car` наследует `Vehicle` и демонстрирует доступ к защищенным и публичным свойствам, но не к приватным.

### Использование методов-модификаторов

Для управления доступом к приватным и защищенным свойствам и методам можно использовать публичные методы, которые обеспечивают безопасное взаимодействие с внутренними данными.

### Пример использования методов-модификаторов

```tsx
class Employee {
    private salary: number;

    constructor(salary: number) {
        this.salary = salary;
    }

    public getSalary(): number {
        return this.salary;
    }

    public setSalary(newSalary: number): void {
        if (newSalary > 0) {
            this.salary = newSalary;
        } else {
            console.log("Invalid salary.");
        }
    }
}

let employee = new Employee(50000);
console.log(employee.getSalary()); // 50000
employee.setSalary(55000);
console.log(employee.getSalary()); // 55000
employee.setSalary(-1000); // "Invalid salary."
console.log(employee.getSalary()); // 55000

```

В этом примере класс `Employee` использует публичные методы `getSalary` и `setSalary` для доступа и изменения приватного свойства `salary`.

### Заключение

Модификаторы доступа в TypeScript предоставляют мощный механизм для управления видимостью и доступом к свойствам и методам классов. Они помогают инкапсулировать данные и защищать внутреннее состояние объектов, обеспечивая более безопасное и управляемое взаимодействие с ними. Правильное использование модификаторов `public`, `protected` и `private` способствует созданию надежного и легко поддерживаемого кода.