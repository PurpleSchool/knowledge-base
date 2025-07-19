---
metaTitle: Объекты в TypeScript
metaDescription: Объекты в TypeScript
author: Дмитрий Нечаев
title: Объекты в TypeScript
preview: Объекты в TypeScript. Разбираем примеры использования
---

Объекты являются одним из фундаментальных элементов программирования в JavaScript и TypeScript. Они позволяют группировать значения различных типов и структурировать данные. В TypeScript объекты могут содержать как примитивные типы данных, так и другие объекты. Благодаря строгой типизации TypeScript мы можем точно определять структуру объектов, что делает код более предсказуемым и защищенным от ошибок.

### Создание и использование объектов

Рассмотрим пример создания объекта в JavaScript и TypeScript:

```tsx
let person = { name: "Tom", age: 23 };
console.log(person.name); // Tom
console.log(person["name"]); // Tom

```

В этом примере объект `person` имеет два свойства: `name` (строка) и `age` (число). Мы можем получить доступ к свойствам объекта как через точечную нотацию (`person.name`), так и через квадратные скобки (`person["name"]`).

Объекты являются фундаментальным типом данных в TypeScript, и понимание их структуры, свойств и методов необходимо для эффективной разработки. TypeScript предоставляет мощные инструменты для работы с объектами, включая интерфейсы, типы и классы. Чтобы углубить знания об объектах и научиться их правильно использовать, посетите наш курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Objekty_v_TypeScript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Строгая типизация объектов в TypeScript

В отличие от JavaScript, TypeScript позволяет определять типы объектов, что обеспечивает дополнительные проверки на этапе компиляции. Это можно сделать с помощью интерфейсов или типов.

### Использование интерфейсов

Интерфейсы определяют структуру объекта, описывая его свойства и их типы.

```tsx
interface Person {
    name: string;
    age: number;
}

let person: Person = { name: "Tom", age: 23 };
console.log(person.name); // Tom

```

В этом примере мы определили интерфейс `Person`, который описывает объект с двумя свойствами: `name` (строка) и `age` (число). Объект `person` затем объявляется с типом `Person`, что гарантирует, что он соответствует этой структуре.

### Использование типов

Типы в TypeScript можно использовать аналогично интерфейсам для описания структуры объектов.

```tsx
type Person = {
    name: string;
    age: number;
};

let person: Person = { name: "Tom", age: 23 };
console.log(person.name); // Tom

```

Типы и интерфейсы в большинстве случаев взаимозаменяемы, но у типов есть некоторые дополнительные возможности, такие как объединение и пересечение типов.

### Необязательные свойства и свойства только для чтения

В TypeScript можно определить необязательные свойства, используя знак вопроса (`?`), и свойства только для чтения, используя ключевое слово `readonly`.

```tsx
interface Person {
    name: string;
    age: number;
    address?: string; // необязательное свойство
    readonly id: number; // свойство только для чтения
}

let person: Person = { name: "Tom", age: 23, id: 1 };
console.log(person.name); // Tom
// person.id = 2; // Ошибка: нельзя изменить свойство только для чтения

```

В этом примере `address` является необязательным свойством, что позволяет объекту `Person` не содержать это свойство. Свойство `id` является только для чтения, поэтому его значение нельзя изменить после инициализации.

### Вложенные объекты

Объекты в TypeScript могут содержать вложенные объекты. Рассмотрим пример:

```tsx
interface Address {
    street: string;
    city: string;
    country: string;
}

interface Person {
    name: string;
    age: number;
    address: Address; // вложенный объект
}

let person: Person = {
    name: "Tom",
    age: 23,
    address: {
        street: "123 Main St",
        city: "Anytown",
        country: "USA"
    }
};

console.log(person.address.city); // Anytown

```

В этом примере мы создали интерфейс `Address`, который описывает структуру вложенного объекта, и включили его в интерфейс `Person`.

### Функции в объектах

Объекты в TypeScript могут содержать функции. Эти функции также могут быть типизированы.

```tsx
interface Person {
    name: string;
    age: number;
    greet: () => string; // функция без параметров, возвращающая строку
}

let person: Person = {
    name: "Tom",
    age: 23,
    greet: function() {
        return `Hello, my name is ${this.name}`;
    }
};

console.log(person.greet()); // Hello, my name is Tom

```

### Типизация с использованием `type`

Типы могут быть использованы для описания сложных структур данных, включая объединение и пересечение типов.

### Объединение типов

```tsx
type Developer = {
    name: string;
    skills: string[];
};

type Manager = {
    name: string;
    teamSize: number;
};

type Employee = Developer | Manager;

let employee: Employee;

employee = { name: "Alice", skills: ["TypeScript", "JavaScript"] };
employee = { name: "Bob", teamSize: 5 };
// employee = { name: "Charlie", age: 30 }; // Ошибка: объект не соответствует типу Employee

```

### Пересечение типов

```tsx
type Developer = {
    name: string;
    skills: string[];
};

type Manager = {
    name: string;
    teamSize: number;
};

type Lead = Developer & Manager;

let lead: Lead = {
    name: "Alice",
    skills: ["TypeScript", "JavaScript"],
    teamSize: 5
};

console.log(lead.name); // Alice

```

### Типизация JSON

TypeScript позволяет типизировать JSON-данные, что полезно при работе с внешними API.

```tsx
interface ApiResponse {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}

let response: ApiResponse = {
    userId: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false
};

console.log(response.title); // delectus aut autem

```

### Заключение

Объекты в TypeScript позволяют эффективно структурировать данные и обеспечивать их целостность с помощью строгой типизации. Использование интерфейсов и типов для определения структуры объектов делает код более предсказуемым и защищенным от ошибок. Вложенные объекты, необязательные свойства, свойства только для чтения, функции в объектах и сложные структуры данных с объединением и пересечением типов — все это предоставляет разработчикам мощные инструменты для создания надежных и масштабируемых приложений.

Изучение объектов - важная часть освоения TypeScript, но это лишь один из кирпичиков в фундаменте ваших знаний. Расширьте свои познания, изучив Generics, Mapped types, условные типы на курсе [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=Objekty_v_TypeScript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
