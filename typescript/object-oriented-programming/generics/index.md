---
metaTitle: Обобщения в TypeScript
metaDescription: Обобщения в TypeScript
author: Дмитрий Нечаев
title: Обобщения в TypeScript
preview: Обобщения в TypeScript. Разбираем примеры использования
---

TypeScript является строго типизированным языком, однако иногда нужно создать функционал, который может работать с данными различных типов. Для решения этой задачи используются обобщения (generics). Обобщения позволяют создавать компоненты, которые могут работать с различными типами данных, сохраняя при этом типобезопасность.

### Основы обобщений

Обобщения позволяют параметризовать типы данных. Это достигается с помощью синтаксиса `<T>`, где `T` является параметром типа.

### Пример обобщенной функции

```tsx
function identity<T>(arg: T): T {
    return arg;
}

let output1 = identity<string>("Hello, TypeScript");
let output2 = identity<number>(42);

console.log(output1); // "Hello, TypeScript"
console.log(output2); // 42

```

В этом примере функция `identity` принимает параметр типа `T` и возвращает значение того же типа. Вызов функции с типом `string` и типом `number` демонстрирует гибкость и типобезопасность обобщений.

Обобщения (Generics) позволяют писать переиспользуемый код, который может работать с различными типами данных, сохраняя при этом типобезопасность. Чтобы эффективно использовать обобщения и создавать гибкие компоненты, требуется глубокое понимание TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=obobshcheniya-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Обобщенные типы

Обобщения могут использоваться не только в функциях, но и в интерфейсах и классах.

### Пример обобщенного интерфейса

```tsx
interface KeyValuePair<K, V> {
    key: K;
    value: V;
}

let kvp1: KeyValuePair<string, number> = { key: "one", value: 1 };
let kvp2: KeyValuePair<number, string> = { key: 2, value: "two" };

console.log(kvp1); // { key: "one", value: 1 }
console.log(kvp2); // { key: 2, value: "two" }

```

В этом примере интерфейс `KeyValuePair` принимает два параметра типа `K` и `V`, что позволяет создавать объекты с различными комбинациями типов для ключа и значения.

### Пример обобщенного класса

```tsx
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;

    constructor(zeroValue: T, addFunction: (x: T, y: T) => T) {
        this.zeroValue = zeroValue;
        this.add = addFunction;
    }
}

let myGenericNumber = new GenericNumber<number>(0, (x, y) => x + y);

console.log(myGenericNumber.add(5, 10)); // 15

```

В этом примере класс `GenericNumber` принимает параметр типа `T`, что позволяет определить свойства и методы, работающие с этим типом. Мы создаем экземпляр класса с типом `number` и определяем метод `add` для сложения чисел.

### Ограничения обобщений

Обобщения можно ограничивать с помощью ключевого слова `extends`, чтобы указать, что параметр типа должен соответствовать определенному интерфейсу или классу.

### Пример ограничения обобщений

```tsx
interface Lengthwise {
    length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
    console.log(arg.length);
}

logLength("Hello, TypeScript"); // 16
logLength([1, 2, 3, 4, 5]); // 5
// logLength(42); // Ошибка: Argument of type 'number' is not assignable to parameter of type 'Lengthwise'

```

В этом примере функция `logLength` принимает параметр типа `T`, который должен иметь свойство `length`. Это ограничение позволяет использовать только те типы данных, которые содержат свойство `length`, такие как строки и массивы.

### Обобщения с несколькими параметрами

Функции, интерфейсы и классы могут принимать несколько параметров типа.

### Пример обобщенной функции с несколькими параметрами

```tsx
function merge<T, U>(obj1: T, obj2: U): T & U {
    return { ...obj1, ...obj2 };
}

let mergedObj = merge({ name: "Alice" }, { age: 30 });

console.log(mergedObj); // { name: "Alice", age: 30 }

```

В этом примере функция `merge` принимает два параметра типа `T` и `U` и возвращает новый объект, который является объединением обоих объектов. Тип возвращаемого значения `T & U` представляет собой пересечение типов `T` и `U`.

### Обобщенные классы с наследованием

Классы могут наследовать обобщенные классы, добавляя больше гибкости и повторного использования кода.

### Пример обобщенного класса с наследованием

```tsx
class Collection<T> {
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    remove(item: T): void {
        this.items = this.items.filter(i => i !== item);
    }

    getItems(): T[] {
        return this.items;
    }
}

class NumberCollection extends Collection<number> {
    sum(): number {
        return this.getItems().reduce((acc, num) => acc + num, 0);
    }
}

let numbers = new NumberCollection();
numbers.add(10);
numbers.add(20);
numbers.add(30);

console.log(numbers.getItems()); // [10, 20, 30]
console.log(numbers.sum()); // 60

```

В этом примере класс `Collection` является обобщенным и может работать с любыми типами данных. Класс `NumberCollection` наследует `Collection<number>` и добавляет метод `sum`, который возвращает сумму всех чисел в коллекции.

### Заключение

Обобщения в TypeScript предоставляют мощный инструмент для создания гибких и типобезопасных компонентов. Они позволяют работать с различными типами данных, сохраняя при этом строгую типизацию. Обобщенные функции, интерфейсы и классы обеспечивают высокий уровень абстракции и позволяют создавать повторно используемые компоненты, которые могут легко адаптироваться к различным типам данных. Это делает код более универсальным, читаемым и поддерживаемым.

Обобщения — это мощный инструмент для создания переиспользуемого кода. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=obobshcheniya-v-typescript) вы изучите продвинутые типы и получите практический опыт работы с ними. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
