---
metaTitle: Методы доступа get и set в TypeScript
metaDescription: Методы доступа get и set в TypeScript
author: Дмитрий Нечаев
title: Методы доступа get и set в TypeScript
preview: Методы доступа get и set в TypeScript. Разбираем примеры использования
---

Методы доступа `get` и `set` предоставляют способ управления доступом к свойствам объекта в TypeScript. Они позволяют определить логику получения и установки значения свойства, что дает возможность инкапсулировать и контролировать доступ к данным. Эта концепция была предложена в стандарте JavaScript ECMAScript 5 и получила широкое применение благодаря своей гибкости и удобству.

### Определение методов доступа

Методы доступа определяются с использованием ключевых слов `get` и `set`. `Get`-метод используется для получения значения свойства, а `set`-метод — для установки значения свойства.

Методы доступа `get` и `set` позволяют контролировать доступ к свойствам класса и добавлять логику при чтении и записи значений. Чтобы уверенно использовать `get` и `set` и создавать надежный код, необходимо глубокое понимание TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=metody-dostupa-get-i-set-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример определения методов доступа

```tsx
class Person {
    private _name: string;

    constructor(name: string) {
        this._name = name;
    }

    // get-метод для получения значения свойства name
    public get name(): string {
        return this._name;
    }

    // set-метод для установки значения свойства name
    public set name(newName: string) {
        if (newName.length > 0) {
            this._name = newName;
        } else {
            console.log("Имя не может быть пустым.");
        }
    }
}

let person = new Person("Alice");
console.log(person.name); // "Alice"
person.name = "Bob";
console.log(person.name); // "Bob"
person.name = ""; // "Имя не может быть пустым."

```

В этом примере класс `Person` содержит приватное поле `_name` и методы доступа для управления этим полем. `Get`-метод возвращает значение `_name`, а `set`-метод проверяет новое значение перед его установкой.

### Инкапсуляция с помощью методов доступа

Использование методов доступа позволяет инкапсулировать внутреннее состояние объекта и предоставлять контролируемый интерфейс для взаимодействия с ним.

### Пример инкапсуляции с валидацией

```tsx
class Employee {
    private _salary: number;

    constructor(salary: number) {
        this._salary = salary;
    }

    public get salary(): number {
        return this._salary;
    }

    public set salary(newSalary: number) {
        if (newSalary > 0) {
            this._salary = newSalary;
        } else {
            console.log("Зарплата должна быть положительной.");
        }
    }
}

let employee = new Employee(50000);
console.log(employee.salary); // 50000
employee.salary = 55000;
console.log(employee.salary); // 55000
employee.salary = -1000; // "Зарплата должна быть положительной."
console.log(employee.salary); // 55000

```

В этом примере класс `Employee` использует методы доступа для управления значением зарплаты и проверки его корректности перед установкой.

### Методы доступа и наследование

Методы доступа также могут быть использованы в наследуемых классах. Это позволяет создавать более гибкие и расширяемые системы.

### Пример использования методов доступа в наследуемых классах

```tsx
class Rectangle {
    private _width: number;
    private _height: number;

    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
    }

    public get width(): number {
        return this._width;
    }

    public set width(newWidth: number) {
        if (newWidth > 0) {
            this._width = newWidth;
        } else {
            console.log("Ширина должна быть положительной.");
        }
    }

    public get height(): number {
        return this._height;
    }

    public set height(newHeight: number) {
        if (newHeight > 0) {
            this._height = newHeight;
        } else {
            console.log("Высота должна быть положительной.");
        }
    }

    public get area(): number {
        return this._width * this._height;
    }
}

class Square extends Rectangle {
    constructor(size: number) {
        super(size, size);
    }

    public set size(newSize: number) {
        if (newSize > 0) {
            this.width = newSize;
            this.height = newSize;
        } else {
            console.log("Размер должен быть положительным.");
        }
    }

    public get size(): number {
        return this.width;
    }
}

let square = new Square(10);
console.log(square.size); // 10
console.log(square.area); // 100
square.size = 15;
console.log(square.size); // 15
console.log(square.area); // 225
square.size = -5; // "Размер должен быть положительным."

```

В этом примере класс `Square` наследует класс `Rectangle` и использует методы доступа для управления размером квадрата.

### Преимущества использования методов доступа

1. **Инкапсуляция**: Методы доступа позволяют скрыть внутреннее состояние объекта и предоставлять контролируемый доступ к данным.
2. **Валидация данных**: С помощью `set`методов можно проверять корректность данных перед их установкой.
3. **Гибкость**: Методы доступа могут быть использованы для создания вычисляемых свойств, которые изменяются динамически.
4. **Совместимость с наследованием**: Методы доступа работают с наследованием, что позволяет создавать расширяемые и поддерживаемые системы.

### Заключение

Методы доступа `get` и `set` в TypeScript предоставляют мощный инструмент для управления доступом к свойствам объекта. Они помогают инкапсулировать данные, обеспечивать их валидацию и создавать гибкие и расширяемые системы. Использование методов доступа делает код более читаемым, безопасным и легким в поддержке, что особенно важно в больших и сложных проектах.

Правильное использование `get` и `set` может значительно улучшить структуру и читаемость вашего кода. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=metody-dostupa-get-i-set-v-typescript) вы получите все необходимые знания и навыки для работы с классами в TypeScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
