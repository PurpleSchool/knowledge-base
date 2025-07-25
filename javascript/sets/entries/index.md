---
metaTitle: entries() – JavaScript Set – Множества в JS
metaDescription: Как работает keys() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: entries() в JavaScript
preview: Метод entries() в языке программирования JavaScript используется для получения итератора, который позволяет обходить значения коллекции Set в виде пар [значение, значение]. Итератор возвращает значения коллекции в порядке их добавления.
---

Метод entries() в языке программирования JavaScript используется для получения итератора, который позволяет обходить значения коллекции Set в виде пар [значение, значение]. Итератор возвращает значения коллекции в порядке их добавления.

## Форма записи

```javascript
set.entries();
```

где `set` - коллекция Set, метод `entries()` - метод, который возвращает итератор для обхода значений коллекции в виде пар [значение, значение].

`entries()` позволяет получить итерируемый объект, содержащий пары ключ-значение для Map или Set. Для понимания работы этого метода и эффективного использования итераторов, требуется уверенное знание продвинутых концепций JavaScript. Если вы хотите детальнее погрузиться в продвинутые знания языка — приходите на наш большой курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-entries-javascript). На курсе 196 уроков и 18 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры

Получение итератора для обхода значений коллекции Set в виде пар [значение, значение] с использованием метода entries():

```javascript
const set = new Set(["apple", "banana", "orange"]);
const iterator = set.entries();
console.log(iterator.next().value); // ["apple", "apple"]
console.log(iterator.next().value); // ["banana", "banana"]
console.log(iterator.next().value); // ["orange", "orange"]
```

Как видно из примера, метод entries() используется для получения итератора, который позволяет обходить значения коллекции Set в виде пар [значение, значение]. В данном случае, коллекция Set содержала значения "apple", "banana" и "orange". После вызова метода entries() был получен итератор, который последовательно возвращает значения коллекции в виде пар [значение, значение] в порядке их добавления. С помощью метода next() можно получать следующую пару [значение, значение] итератора.

Метод entries() является удобным способом получения итератора для обхода значений коллекции Set в виде пар [значение, значение]. Этот метод позволяет получить значения коллекции в порядке их добавления и использовать их для дальнейших операций.

Чтобы узнать больше о его возможностях и других методах работы с коллекциями, посетите наш курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-entries-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в продвинутый JavaScript прямо сегодня.
