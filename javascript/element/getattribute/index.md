---
metaTitle: .getAttribute() в JavaScript
metaDescription: Разбираемся как использовать .getAttribute() в JavaScript
author: Дмитрий Нечаев
title: .getAttribute() в JavaScript
preview: Учимся пользоваться .getAttribute() в JavaScript. Разбираем примеры использования
---

Метод `.getAttribute()` в JavaScript позволяет получить значение любого HTML-атрибута у указанного элемента. Этот метод полезен, когда нам нужно получить или использовать значения атрибутов элементов в нашем JavaScript-коде. В этой статье мы рассмотрим, как использовать `.getAttribute()` и какие возможности он предоставляет.

## Введение в `.getAttribute()`

Метод `.getAttribute()` используется для получения значения атрибута HTML элемента. Этот метод возвращает строку, представляющую значение указанного атрибута, если атрибут присутствует у элемента, или `null`, если атрибут отсутствует.

Синтаксис `.getAttribute()` выглядит следующим образом:

```jsx
element.getAttribute(attributeName);

```

Где:

- `element` - это элемент DOM, у которого мы хотим получить значение атрибута.
- `attributeName` - это строка, представляющая имя атрибута, значение которого мы хотим получить.

## Примеры использования `.getAttribute()`

Давайте рассмотрим несколько примеров использования метода `.getAttribute()` для получения значений различных HTML-атрибутов.

### 1. Получение значения атрибута `src` у изображения

```html
<img id="myImage" src="example.jpg" alt="Пример изображения">

```

```jsx
// Получаем элемент изображения
const image = document.getElementById('myImage');

// Получаем значение атрибута src
const srcValue = image.getAttribute('src');

// Выводим значение атрибута src
console.log('Значение атрибута src:', srcValue);

```

В этом примере мы используем `.getAttribute()` для получения значения атрибута `src` у изображения с id "myImage".

### 2. Получение значения атрибута `href` у ссылки

```html
<a id="myLink" href="<https://example.com>">Пример ссылки</a>

```

```jsx
// Получаем ссылку
const link = document.getElementById('myLink');

// Получаем значение атрибута href
const hrefValue = link.getAttribute('href');

// Выводим значение атрибута href
console.log('Значение атрибута href:', hrefValue);

```

В этом примере мы используем `.getAttribute()` для получения значения атрибута `href` у ссылки с id "myLink".

### 3. Получение пользовательских атрибутов

```html
<div id="myDiv" data-custom="12345">Пример элемента с пользовательским атрибутом</div>

```

```jsx
// Получаем элемент div
const div = document.getElementById('myDiv');

// Получаем значение пользовательского атрибута data-custom
const customValue = div.getAttribute('data-custom');

// Выводим значение пользовательского атрибута
console.log('Значение пользовательского атрибута data-custom:', customValue);

```

В этом примере мы используем `.getAttribute()` для получения значения пользовательского атрибута `data-custom` у элемента `<div>`.

### 4. Проверка наличия атрибута

```html
<input id="myInput" type="text" placeholder="Введите значение">

```

```jsx
// Получаем элемент input
const input = document.getElementById('myInput');

// Проверяем наличие атрибута placeholder
if (input.hasAttribute('placeholder')) {
  console.log('Атрибут placeholder присутствует');
} else {
  console.log('Атрибут placeholder отсутствует');
}

```

В этом примере мы используем метод `.hasAttribute()` для проверки наличия атрибута `placeholder` у элемента `<input>`.

## Заключение

Метод `.getAttribute()` предоставляет удобный способ получения значений атрибутов HTML элементов в JavaScript. Он позволяет нам динамически получать и использовать значения атрибутов для различных целей в нашем коде. Мы рассмотрели его базовый синтаксис и примеры использования для различных сценариев. Надеюсь, эта статья помогла вам лучше понять, как использовать `.getAttribute()` в ваших проектах JavaScript.