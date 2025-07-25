---
metaTitle: Generics в TypeScript
metaDescription: Разбираемся как использовать Generics в TypeScript
author: Дмитрий Нечаев
title: Generics в TypeScript
preview: Учимся работать с Generics в TypeScript. Разбираем примеры использования
---

Generics (обобщения) в TypeScript - это мощный инструмент, который позволяет программистам создавать гибкие и многократно используемые компоненты. Они обеспечивают возможность создавать компоненты, способные работать с различными типами данных, что улучшает повторное использование кода и увеличивает его надёжность.

### Что такое Generics?

Generics в TypeScript позволяют функциям, интерфейсам и классам оперировать с различными типами данных, не теряя при этом информации о типах. Это означает, что вы можете создать функцию, класс или интерфейс, который может работать с любым типом данных, который будет указан при вызове или инстанцировании.

`Generics` — это мощный инструмент для создания переиспользуемого и типобезопасного кода. Чтобы в полной мере использовать `Generics` и создавать гибкие компоненты, требуется уверенное знание TypeScript и понимание принципов обобщенного программирования. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=generics-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Примеры использования Generics

#### Пример 1: Обобщённая функция

```typescript
function identity<T>(arg: T): T {
    return arg;
}

let output1 = identity<string>("myString");  // тип выводится автоматически: string
let output2 = identity<number>(100);         // тип выводится автоматически: number
```

В этом примере функция `identity` принимает один аргумент `arg` типа `T` и возвращает значение того же типа `T`. При вызове функции мы явно указываем тип, с которым она должна работать (`string`, `number`).

#### Пример 2: Обобщённый интерфейс

```typescript
interface GenericIdentityFn<T> {
    (arg: T): T;
}

function identity<T>(arg: T): T {
    return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

Здесь мы определили интерфейс `GenericIdentityFn`, который описывает функцию с обобщённым типом. Функция `identity` снова используется, и мы присваиваем её переменной `myIdentity`, явно указывая, что эта переменная будет работать с числами.

#### Пример 3: Обобщённые классы

```typescript
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };
```

Этот пример демонстрирует создание класса `GenericNumber`, который может работать с различными числовыми типами данных. Мы инстанцируем класс с типом `number`.

### Преимущества использования Generics

1. **Типобезопасность:** Generics помогают обеспечить типобезопасность без ущерба для производительности, позволяя отлавливать ошибки на этапе компиляции.
2. **Повторное использование кода:** С помощью обобщений можно создавать компоненты, которые работают с любым типом данных, что значительно увеличивает их переиспользуемость.
3. **Гибкость:** Generics предоставляют возможность работать с несколькими типами данных, что делает код более адаптивным и легко масштабируемым.

### Заключение

Generics в TypeScript - это мощный инструмент для создания гибких и переиспользуемых компонентов. Они позволяют программистам писать более чистый, понятный и безопасный код, что важно для современной разработки программного обеспечения. Использование Generics может существенно повысить качество вашего кода и его поддержку.

Для глубокого понимания `Generics` необходимо уверенное владение системой типов TypeScript, включая условные типы, mapped types и type inference. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=generics-v-typescript) вы изучите все эти концепции и научитесь применять их на практике. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
