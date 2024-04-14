---
metaTitle: readonly в TypeScript
metaDescription: Разбираемся как использовать readonly в TypeScript
author: Дмитрий Нечаев
title: readonly в TypeScript
preview: Учимся пользоваться readonly в TypeScript. Разбираем примеры использования
---

В TypeScript возможно объявление свойств объектов как только для чтения с помощью модификатора `readonly`. Этот модификатор не влияет на поведение программы во время выполнения, однако он ограничивает изменение значения свойства во время компиляции, что помогает предотвратить ошибки программирования.

Давайте рассмотрим пример:

```tsx
interface User {
  readonly id: number;
  name: string;
}

function displayUser(user: User) {
  console.log(`Пользователь с ID ${user.id} имеет имя ${user.name}.`);
  // user.id = 101; 
  // Ошибка: нельзя изменить 'id', так как это свойство 
  // только для чтения.
}

```

В примере выше, попытка изменения `id` приведёт к ошибке компиляции, что предотвратит возможные баги, связанные с некорректной мутацией данных.

### Внутреннее изменение объектов

Модификатор `readonly` не делает объект полностью неизменяемым; он лишь запрещает переназначение самого свойства. Внутренние атрибуты объекта могут быть изменены, если они не помечены как `readonly`.

Рассмотрим следующий пример:

```tsx
interface House {
  readonly owner: { name: string; age: number };
}

function celebrateBirthday(house: House) {
  console.log(`С днем рождения, ${house.owner.name}!`);
  house.owner.age++; // Допустимо: 
  // мы можем изменять внутренние свойства объекта 'owner'.
}

function changeOwner(house: House) {
  // house.owner = { name: "Anna", age: 30 }; 
  // Ошибка: свойство 'owner' только для чтения.
}

```

### Наследование и иммутабельность

TypeScript допускает присвоение обычных объектов переменным с типами, содержащими свойства только для чтения:

```tsx
interface MutablePerson {
  name: string;
  age: number;
}

interface ImmutablePerson {
  readonly name: string;
  readonly age: number;
}

let person: MutablePerson = { name: "Alex", age: 30 };
let readonlyPerson: ImmutablePerson = person;

console.log(readonlyPerson.age); // Выводит: 30
person.age++;
console.log(readonlyPerson.age); // Выводит: 31

```

В данном случае, изменение свойства `age` в объекте `person` также отражается на `readonlyPerson`, поскольку обе переменные ссылаются на один и тот же объект в памяти.

### Заключение

Использование `readonly` в TypeScript является мощным инструментом для обозначения намерений относительно неизменяемости свойств объектов. Это не только помогает в поддержании кода, но и уменьшает возможность ошибок, связанных с непреднамеренной мутацией данных. Однако важно понимать ограничения и поведение, связанные с модификатором `readonly`, чтобы эффективно его использовать.