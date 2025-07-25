---
metaTitle: Логические операторы – JavaScript Logic Operators – Логические операторы в JS
metaDescription: Как работают логические операторы в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: Логические операторы в JavaScript
preview: Логические операторы в JavaScript позволяют объединять несколько простых условий в одно сложное...
---

Логические операторы в JavaScript позволяют объединять несколько простых условий в одно сложное. Это помогает создавать более гибкие и мощные условия для управления потоком выполнения программы. В JavaScript существует три логических оператора: И, ИЛИ и НЕ.

Чтобы детально изучить логические операторы, как они работают и как их правильно использовать для создания сложных условий, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=logicheskie-operatory-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Форма записи

Логические операторы в JavaScript записываются с помощью специальных символов. Вот форма записи для каждого из них:

- И (&&): `условие1 && условие2`
- ИЛИ (||): `условие1 || условие2`
- НЕ (!): `!условие`

## Описание работы

### И (&&)

Оператор И (&&) используется для объединения двух условий. Если оба условия истинны, то оператор возвращает true. Если хотя бы одно из условий ложно, то оператор возвращает false. 

Пример использования оператора И:

```javascript
if (x > 0 && x < 10) {
  // выполнить код, если x больше 0 и меньше 10
}
```

### ИЛИ (||)

Оператор ИЛИ (||) используется для объединения двух условий. Если хотя бы одно из условий истинно, то оператор возвращает true. Если оба условия ложны, то оператор возвращает false.

Пример использования оператора ИЛИ:

```javascript
if (x === 'apple' || x === 'banana') {
  // выполнить код, если x равно "apple" или "banana"
}
```

### НЕ (!)

Оператор НЕ (!) используется для инвертирования логического значения условия. Если условие истинно, то оператор возвращает false. Если условие ложно, то оператор возвращает true.

Пример использования оператора НЕ:

```javascript
if (!(x > 0)) {
  // выполнить код, если x не больше 0
}
```

## Заключение

Логические операторы в JavaScript позволяют создавать более гибкие и мощные условия для управления потоком выполнения программы. Они помогают объединять несколько простых условий в одно сложное, что делает код более читабельным и эффективным. Для более глубокого изучения языка и написания сложной логики, рассмотрите курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=logicheskie-operatory-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
