---
metaTitle: Преобразование типов в TypeScript
metaDescription: Преобразование типов в TypeScript
author: Дмитрий Нечаев
title: Преобразование типов в TypeScript
preview: Преобразование типов в TypeScript. Разбираем примеры использования
---

Преобразование типов в TypeScript позволяет менять типы данных переменных на нужные, чтобы избежать ошибок и обеспечить корректную работу программы. Ранее мы рассматривали тему преобразования типов с помощью утверждений типов (type assertion). В этой статье мы рассмотрим более подробно, как это применимо к классам и интерфейсам.

### Утверждение типов (Type Assertion)

Type assertion позволяет программисту явно указывать тип переменной, когда компилятор TypeScript не может определить точный тип.

### Пример использования утверждений типов

```tsx
let someValue: any = "Hello, TypeScript";
let strLength: number = (someValue as string).length;

console.log(strLength); // 16

```

В этом примере `someValue` имеет тип `any`, что означает, что компилятор не знает его точный тип. Мы используем утверждение типов `(someValue as string)`, чтобы указать компилятору, что `someValue` следует рассматривать как строку. Это позволяет получить доступ к свойству `length` строки.

### Преобразование типов с классами и интерфейсами

При работе с классами и интерфейсами TypeScript позволяет использовать утверждение типов для преобразования объекта одного типа в объект другого типа, если между ними существует совместимость.

### Пример преобразования типов с классами

```tsx
class Animal {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

class Dog extends Animal {
    breed: string;
    constructor(name: string, breed: string) {
        super(name);
        this.breed = breed;
    }
}

let animal: Animal = new Dog("Buddy", "Golden Retriever");

console.log((animal as Dog).breed); // "Golden Retriever"

```

В этом примере объект `animal` является экземпляром класса `Dog`, но объявлен как `Animal`. Мы используем утверждение типов `(animal as Dog)`, чтобы указать компилятору, что `animal` следует рассматривать как `Dog`, и получить доступ к свойству `breed`.

### Пример преобразования типов с интерфейсами

```tsx
interface Bird {
    fly(): void;
    layEggs(): void;
}

interface Fish {
    swim(): void;
    layEggs(): void;
}

function getRandomPet(): Bird | Fish {
    return Math.random() > 0.5 ? { fly: () => {}, layEggs: () => {} } : { swim: () => {}, layEggs: () => {} };
}

let pet = getRandomPet();

if ((pet as Bird).fly) {
    (pet as Bird).fly(); // объект рассматривается как Bird
} else {
    (pet as Fish).swim(); // объект рассматривается как Fish
}

```

В этом примере функция `getRandomPet` возвращает объект, который может быть либо `Bird`, либо `Fish`. С помощью утверждения типов мы можем указать компилятору, как рассматривать возвращаемый объект, и вызывать соответствующие методы.

### Преобразование типов с интерфейсами и классами

Интерфейсы и классы в TypeScript могут использоваться вместе для создания более сложных структур данных. Преобразование типов также можно использовать для преобразования объектов, реализующих интерфейсы, в экземпляры классов.

### Пример преобразования типов с интерфейсами и классами

```tsx
interface Shape {
    color: string;
}

class Square implements Shape {
    color: string;
    sideLength: number;

    constructor(color: string, sideLength: number) {
        this.color = color;
        this.sideLength = sideLength;
    }
}

let shape: Shape = { color: "red" };
let square: Square = new Square("blue", 10);

// Преобразование объекта shape в Square
let newSquare = shape as Square;
newSquare.sideLength = 15;

console.log(newSquare.color); // "red"
console.log(newSquare.sideLength); // 15

```

В этом примере мы преобразуем объект `shape`, реализующий интерфейс `Shape`, в экземпляр класса `Square`. Это позволяет нам использовать свойства и методы класса `Square` на объекте `shape`.

### Преобразование типов с использованием обобщений (Generics)

Обобщения (Generics) в TypeScript позволяют создавать компоненты, которые работают с различными типами данных, обеспечивая их типобезопасность. Преобразование типов также может быть применено к обобщенным типам.

### Пример преобразования типов с обобщениями

```tsx
function identity<T>(arg: T): T {
    return arg;
}

let output = identity<string>("myString");

// Преобразование типа
let strLength: number = (output as string).length;

console.log(strLength); // 8

```

В этом примере функция `identity` использует обобщения для работы с любым типом данных. Мы используем утверждение типов, чтобы преобразовать результат функции в строку и получить доступ к свойству `length`.

### Заключение

Преобразование типов в TypeScript является мощным инструментом для обеспечения гибкости и типобезопасности при работе с различными структурами данных. Утверждения типов позволяют явно указывать типы переменных, что особенно полезно при работе с классами, интерфейсами и обобщениями. Правильное использование преобразований типов помогает создавать надежный и читаемый код, минимизируя ошибки, связанные с неправильной типизацией данных.