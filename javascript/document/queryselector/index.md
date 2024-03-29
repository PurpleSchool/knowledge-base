---
metaTitle: .querySelector() – JavaScript Document – Объект страницы
metaDescription: Как работает .querySelector() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: .querySelector() в JavaScript
preview: .querySelector() - это метод JavaScript, который позволяет получить первый элемент на веб-странице, соответствующий заданному CSS-селектору...
---

`.querySelector()` - это метод JavaScript, который позволяет получить первый элемент на веб-странице, соответствующий заданному CSS-селектору. Он используется для того, чтобы получить ссылку на элемент и работать с ним в JavaScript.

## Форма записи

`.querySelector()` имеет следующий синтаксис:

```javascript
document.querySelector(cssSelector);
```

где:

- `cssSelector` - это строка, содержащая CSS-селектор, по которому мы ищем элемент.

Пример использования `.querySelector()` для получения ссылки на первый элемент с классом `myClass`:

```html
<div class="myClass">Это мой элемент 1</div>
<div class="myClass">Это мой элемент 2</div>
<p>Это не мой элемент</p>
```

```javascript
const element = document.querySelector('.myClass');
element.style.color = 'red';
```

В данном примере мы используем метод `.querySelector()` для получения ссылки на первый элемент с классом `myClass`, а затем изменяем его цвет текста на красный.

`.querySelector()` может использоваться для получения ссылки на любой элемент на веб-странице, который соответствует заданному CSS-селектору. Он позволяет обращаться к элементам по их атрибутам, классам, идентификаторам, типам элемента и т.д.

## Описание работы

`.querySelector()` работает путем поиска первого элемента на веб-странице, который соответствует заданному CSS-селектору. Если элемент найден, метод возвращает ссылку на этот элемент. CSS-селекторы представляют собой строку, описывающую правила выбора элементов на основе их атрибутов, классов, идентификаторов, типов элемента и т.д.

Пример использования `.querySelector()` для получения ссылки на первый элемент с идентификатором `myId`:

```html
<div id="myId">Это мой элемент</div>
<p>Это не мой элемент</p>
```

```javascript
const element = document.querySelector('#myId');
element.style.color = 'red';
```

В данном примере мы используем CSS-селектор `#myId` для поиска элемента с идентификатором `myId`, а затем изменяем его цвет текста на красный.

## Заключение

`.querySelector()` - это метод JavaScript, который позволяет получить первый элемент на веб-странице, соответствующий заданному CSS-селектору. Он используется для того, чтобы получить ссылку на элемент и работать с ним в JavaScript.