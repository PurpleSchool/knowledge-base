---
metaTitle: .querySelectorAll() – JavaScript Document – Объект страницы
metaDescription: Как работает .querySelectorAll() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: .querySelectorAll() в JavaScript
preview: .querySelectorAll() - это метод JavaScript, который позволяет получить все элементы на веб-странице, соответствующие заданному CSS-селектору...
---

`.querySelectorAll()` - это метод JavaScript, который позволяет получить все элементы на веб-странице, соответствующие заданному CSS-селектору. Он используется для того, чтобы получить ссылки на все элементы и работать с ними в JavaScript.

## Форма записи

`.querySelectorAll()` имеет следующий синтаксис:

```javascript
document.querySelectorAll(cssSelector);
```

где:

- `cssSelector` - это строка, содержащая CSS-селектор, по которому мы ищем элементы.

Пример использования `.querySelectorAll()` для получения ссылок на все элементы с классом `myClass`:

```html
<div class="myClass">Это мой элемент 1</div>
<div class="myClass">Это мой элемент 2</div>
<p>Это не мой элемент</p>
```

```javascript
const elements = document.querySelectorAll('.myClass');
for (let i = 0; i < elements.length; i++) {
  elements[i].style.color = 'red';
}
```

В данном примере мы используем метод `.querySelectorAll()` для получения ссылок на все элементы с классом `myClass`, а затем изменяем их цвет текста на красный.

## Описание работы

`.querySelectorAll()` работает путем поиска всех элементов на веб-странице, которые соответствуют заданному CSS-селектору. Если элементы найдены, метод возвращает список ссылок на эти элементы. Он позволяет обращаться к группам элементов и изменять их свойства и содержимое непосредственно из JavaScript.

Пример использования `.querySelectorAll()` для получения ссылок на все элементы с тегом `div`:

```html
<div>Это мой элемент 1</div>
<div>Это мой элемент 2</div>
<p>Это не мой элемент</p>
```

```javascript
const elements = document.querySelectorAll('div');
for (let i = 0; i < elements.length; i++) {
  elements[i].style.color = 'red';
}
```

В данном примере мы используем CSS-селектор `div` для поиска всех элементов с тегом `div`, а затем изменяем их цвет текста на красный.

## Заключение

`.querySelectorAll()` - это метод JavaScript, который позволяет получить все элементы на веб-странице, соответствующие заданному CSS-селектору. Он используется для того, чтобы получить ссылки на все элементы и работать с ними в JavaScript.