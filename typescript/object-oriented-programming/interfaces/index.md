---
metaTitle: Интерфейсы в TypeScript
metaDescription: Интерфейсы в TypeScript
author: Дмитрий Нечаев
title: Интерфейсы в TypeScript
preview: Интерфейсы в TypeScript. Разбираем примеры использования
---

Интерфейсы в TypeScript позволяют определять структуру объектов, включая их свойства и методы, без предоставления конкретной реализации.

### Определение интерфейсов

Интерфейсы определяются с помощью ключевого слова `interface`. Они описывают, какие свойства и методы должен иметь объект.

Интерфейсы — это ключевой элемент TypeScript, позволяющий определять структуры объектов и обеспечивать типобезопасность. Чтобы в полной мере освоить возможности интерфейсов и создавать надежные типы, необходимо глубокое понимание системы типов TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=interfeysy-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример простого интерфейса

```tsx
interface Person {
    name: string;
    age: number;
}

let user: Person = {
    name: "John",
    age: 30
};

console.log(user.name); // "John"
console.log(user.age); // 30

```

В этом примере интерфейс `Person` определяет два свойства: `name` и `age`. Переменная `user` соответствует этому интерфейсу, так как содержит оба свойства.

### Необязательные свойства

Интерфейсы могут включать необязательные свойства. Такие свойства определяются с помощью знака вопроса (`?`).

### Пример интерфейса с необязательными свойствами

```tsx
interface Person {
    name: string;
    age?: number; // свойство age необязательно
}

let user1: Person = {
    name: "Alice"
};

let user2: Person = {
    name: "Bob",
    age: 25
};

console.log(user1.name); // "Alice"
console.log(user2.age); // 25

```

В этом примере свойство `age` является необязательным, поэтому объект может его не содержать.

### Интерфейсы для функций

Интерфейсы могут описывать сигнатуры функций, указывая типы параметров и возвращаемое значение.

### Пример интерфейса для функции

```tsx
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;

mySearch = function(source: string, subString: string): boolean {
    return source.indexOf(subString) > -1;
}

console.log(mySearch("Hello, world", "world")); // true

```

В этом примере интерфейс `SearchFunc` описывает функцию, которая принимает два строковых параметра и возвращает логическое значение. Переменная `mySearch` реализует этот интерфейс.

### Интерфейсы для массивов

Интерфейсы могут использоваться для описания типов массивов и других коллекций.

### Пример интерфейса для массива

```tsx
interface StringArray {
    [index: number]: string;
}

let myArray: StringArray;

myArray = ["Bob", "Alice"];

console.log(myArray[0]); // "Bob"
console.log(myArray[1]); // "Alice"

```

В этом примере интерфейс `StringArray` описывает массив строк, где каждый элемент имеет тип `string`.

### Интерфейсы для классов

Интерфейсы могут использоваться для описания структуры классов. Класс, реализующий интерфейс, должен содержать все свойства и методы, указанные в интерфейсе.

### Пример интерфейса для класса

```tsx
interface ClockInterface {
    currentTime: Date;
    setTime(d: Date): void;
}

class Clock implements ClockInterface {
    currentTime: Date;

    constructor(h: number, m: number) {
        this.currentTime = new Date();
        this.currentTime.setHours(h, m);
    }

    setTime(d: Date): void {
        this.currentTime = d;
    }
}

let clock = new Clock(12, 0);
console.log(clock.currentTime); // текущее время
clock.setTime(new Date());
console.log(clock.currentTime); // обновленное время

```

В этом примере класс `Clock` реализует интерфейс `ClockInterface`, что означает, что он должен содержать свойство `currentTime` и метод `setTime`.

### Расширение интерфейсов

Интерфейсы могут расширять другие интерфейсы, создавая новые интерфейсы на основе существующих.

### Пример расширения интерфейсов

```tsx
interface Shape {
    color: string;
}

interface Square extends Shape {
    sideLength: number;
}

let square: Square = {
    color: "blue",
    sideLength: 10
};

console.log(square.color); // "blue"
console.log(square.sideLength); // 10

```

В этом примере интерфейс `Square` расширяет интерфейс `Shape`, добавляя новое свойство `sideLength`.

### Гибридные интерфейсы

Интерфейсы могут комбинировать описание свойств и методов, а также функции.

### Пример гибридного интерфейса

```tsx
interface Counter {
    (start: number): string;
    interval: number;
    reset(): void;
}

function getCounter(): Counter {
    let counter = <Counter>function (start: number): string {
        return `Start from ${start}`;
    };
    counter.interval = 123;
    counter.reset = function () {
        console.log("Counter reset");
    };
    return counter;
}

let c = getCounter();
console.log(c(10)); // "Start from 10"
c.reset(); // "Counter reset"
console.log(c.interval); // 123

```

В этом примере интерфейс `Counter` описывает функцию, которая принимает один параметр и возвращает строку, а также содержит свойство `interval` и метод `reset`.

### Заключение

Интерфейсы в TypeScript являются мощным инструментом для определения структур объектов, описания сигнатур функций и классов. Они обеспечивают строгую типизацию и позволяют создавать более надежный и понятный код. Использование интерфейсов способствует повышению гибкости и расширяемости кода, облегчая его поддержку и развитие.

Интерфейсы широко используются в TypeScript для определения контрактов и обеспечения соответствия типов. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=interfeysy-v-typescript) вы изучите все аспекты работы с интерфейсами. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
