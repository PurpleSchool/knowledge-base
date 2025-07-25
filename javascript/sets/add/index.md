---
metaTitle: add() – JavaScript Set – Множества в JS
metaDescription: Как работает add() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: add() в JavaScript
preview: Метод add() в языке программирования JavaScript используется для добавления нового элемента в коллекцию Set...
---

Метод add() в языке программирования JavaScript используется для добавления нового элемента в коллекцию Set. Этот метод возвращает коллекцию Set с добавленным элементом.

## Форма записи

```javascript
set.add(value);
```

где `set` - коллекция Set, а `value` - значение, которое нужно добавить в коллекцию.

## Описание работы

Метод add() используется для добавления нового элемента в коллекцию Set. Этот метод принимает один аргумент - значение, которое нужно добавить в коллекцию. Если значение уже присутствует в коллекции, то оно не будет добавлено повторно, так как коллекция Set может содержать только уникальные значения.

Понимание того, как `add()` взаимодействует с различными типами данных и структурами, поможет вам создавать динамичные и эффективные приложения. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=add-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Примеры

Добавление элемента в коллекцию Set:

```javascript
const set = new Set([1, 2, 3]);
set.add(4);
console.log(set); // Set(4) {1, 2, 3, 4}
```

Добавление уже существующего элемента в коллекцию Set:

```javascript
const set = new Set([1, 2, 3]);
set.add(3);
console.log(set); // Set(3) {1, 2, 3}
```

Добавление строкового элемента в коллекцию Set:

```javascript
const set = new Set(['apple', 'banana']);
set.add('orange');
console.log(set); // Set(3) {'apple', 'banana', 'orange'}
```

Добавление объекта в коллекцию Set:

```javascript
const set = new Set([{ name: 'John' }, { name: 'Jane' }]);
set.add({ name: 'Jack' });
console.log(set); // Set(3) {{ name: 'John' }, { name: 'Jane' }, { name: 'Jack' }}
```

Метод add() является простым и удобным способом добавления нового элемента в коллекцию Set. Он автоматически проверяет наличие элемента в коллекции и не добавляет его, если он уже присутствует. Это позволяет легко и эффективно работать с уникальными значениями в JavaScript.

Различные способы добавления элементов в JavaScript, такие как `push()`, `concat()` и `add()`, имеют свои особенности и оптимальны для разных сценариев.  На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=add-v-javascript) вы узнаете о каждом из них и научитесь выбирать наиболее подходящий метод для эффективной работы с данными. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
