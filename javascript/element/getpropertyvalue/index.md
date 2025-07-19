---
metaTitle: .getPropertyValue() в JavaScript
metaDescription: Разбираемся как использовать .getPropertyValue() в JavaScript
author: Дмитрий Нечаев
title: .getPropertyValue() в JavaScript
preview: Учимся пользоваться .getPropertyValue() в JavaScript. Разбираем примеры использования
---

Метод `.getPropertyValue()` в JavaScript используется для получения значения CSS-свойства у указанного элемента. Этот метод полезен, когда нам нужно получить конкретное значение CSS-свойства элемента для последующей обработки или анализа в нашем JavaScript-коде. В этой статье мы рассмотрим, как использовать `.getPropertyValue()` с примерами.

## Введение в `.getPropertyValue()`

Метод `.getPropertyValue()` является частью интерфейса `CSSStyleDeclaration` и позволяет получить значение CSS-свойства для указанного элемента. Этот метод возвращает строку, представляющую значение указанного CSS-свойства.

Синтаксис метода `.getPropertyValue()` выглядит следующим образом:

```jsx
element.style.getPropertyValue(propertyName);

```

Где:

- `element` - это элемент DOM, у которого мы хотим получить значение CSS-свойства.
- `propertyName` - это строка, представляющая имя CSS-свойства, значение которого мы хотим получить.

Метод `.getPropertyValue()` позволяет получить значение CSS-свойства элемента, установленное в CSS-файле или с помощью атрибута `style`. Это удобный способ для получения информации о стилях элемента и использования ее в JavaScript-коде. Если вы хотите детальнее углубиться в методы DOM и CSS, а также научиться получать значение стиля конкретного элемента — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=getPropertyValue-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования `.getPropertyValue()`

Давайте рассмотрим несколько примеров использования метода `.getPropertyValue()` для получения значений различных CSS-свойств у элементов на веб-странице.

### 1. Получение значения цвета текста элемента

```html
<div id="myDiv" style="color: red;">Пример текста</div>

```

```jsx
// Получаем ссылку на div
const div = document.getElementById('myDiv');

// Получаем значение цвета текста
const colorValue = window.getComputedStyle(div).getPropertyValue('color');

// Выводим значение цвета текста
console.log('Цвет текста:', colorValue);

```

В этом примере мы используем метод `.getPropertyValue()` для получения значения цвета текста у элемента `<div>`.

### 2. Получение значения ширины рамки элемента

```html
<div id="myDiv" style="border: 2px solid black; width: 100px; height: 100px;">Пример блока</div>

```

```jsx
// Получаем ссылку на div
const div = document.getElementById('myDiv');

// Получаем значение ширины рамки
const borderWidthValue = window.getComputedStyle(div).getPropertyValue('border-width');

// Выводим значение ширины рамки
console.log('Ширина рамки:', borderWidthValue);

```

В этом примере мы используем метод `.getPropertyValue()` для получения значения ширины рамки у элемента `<div>`.

### 3. Получение значения отступа слева элемента

```html
<div id="myDiv" style="margin-left: 20px;">Пример блока</div>

```

```jsx
// Получаем ссылку на div
const div = document.getElementById('myDiv');

// Получаем значение отступа слева
const marginLeftValue = window.getComputedStyle(div).getPropertyValue('margin-left');

// Выводим значение отступа слева
console.log('Отступ слева:', marginLeftValue);

```

В этом примере мы используем метод `.getPropertyValue()` для получения значения отступа слева у элемента `<div>`.

## Заключение

Метод `.getPropertyValue()` предоставляет удобный способ получить значения CSS-свойств у элементов на веб-странице в JavaScript. Это полезно для динамического анализа стилей и их использования в JavaScript-коде. Мы рассмотрели его базовый синтаксис и примеры использования для различных CSS-свойств. Надеюсь, данная статья помогла вам лучше понять, как использовать `.getPropertyValue()` в ваших проектах JavaScript.

При работе с CSS-свойствами важно учитывать их приоритет и наследование. Метод `.getPropertyValue()` позволяет получить только значение, явно установленное для элемента, а не унаследованное от родительских элементов. Чтобы научиться управлять CSS и освоить наследование, мы рекомендуем наш курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=getPropertyValue-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
