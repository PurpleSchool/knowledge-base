---
metaTitle: clear() – JavaScript Set – Множества в JS
metaDescription: Как работает clear() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: clear() в JavaScript
preview: Метод clear() в языке программирования JavaScript используется для удаления всех значений из коллекции Set...
---

Метод clear() в языке программирования JavaScript используется для удаления всех значений из коллекции Set. После выполнения метода clear() коллекция Set становится пустой.

## Форма записи

```javascript
set.clear();
```

где `set` - коллекция Set, метод `clear()` - метод, который удаляет все значения из коллекции.

Метод `clear()` часто используется для очистки коллекций, таких как массивы или объекты.  Важно понимать, как этот метод работает в различных контекстах и какие побочные эффекты он может вызывать. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=clear-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры

Удаление всех значений из коллекции Set с использованием метода clear():

```javascript
const set = new Set([1, 2, 3]);
console.log(set); // Set {1, 2, 3}
set.clear();
console.log(set); // Set {}
```

Как видно из примера, метод clear() используется для удаления всех значений из коллекции Set. В данном случае, коллекция Set содержала значения 1, 2 и 3. После выполнения метода clear() коллекция Set становится пустой.

Метод clear() является удобным способом удаления всех значений из коллекции Set. Этот метод позволяет очистить коллекцию и использовать ее заново.

Использование `clear()` может быть удобным способом очистить коллекцию, но важно знать альтернативные подходы и учитывать возможные последствия для производительности. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=clear-v-javascript) вы изучите различные способы работы с массивами и объектами, включая методы очистки и удаления элементов, чтобы выбрать наиболее подходящий для вашей задачи. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
