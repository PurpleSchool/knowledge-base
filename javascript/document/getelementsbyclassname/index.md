---
metaTitle: .getElementsByClassName() – JavaScript Document – Объект страницы
metaDescription: Как работает .getElementsByClassName() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: .getElementsByClassName() в JavaScript
preview: .getElementsByClassName() - это метод JavaScript, который позволяет получить список элементов на веб-странице, которые имеют заданный класс...
---

`.getElementsByClassName()` - это метод JavaScript, который позволяет получить список элементов на веб-странице, которые имеют заданный класс. Он используется для того, чтобы получить ссылки на все элементы с определенным классом и работать с ними в JavaScript.

## Описание работы

`.getElementsByClassName()` работает путем поиска всех элементов на веб-странице, которые имеют заданный класс. Если элементы найдены, метод возвращает список ссылок на эти элементы.

`.getElementsByClassName()` имеет следующий синтаксис:

```javascript
document.getElementsByClassName(className);
```

где:

- `className` - это строка, представляющая имя класса, по которому мы ищем элементы.

Пример использования `.getElementsByClassName()` для получения списка ссылок на все элементы с классом `myClass`:

```html
<div class="myClass">Это мой элемент 1</div>
<div class="myClass">Это мой элемент 2</div>
<div class="notMyClass">Это не мой элемент</div>
```

```javascript
const elements = document.getElementsByClassName('myClass');
for (let i = 0; i < elements.length; i++) {
  elements[i].style.color = 'red';
}
```

В данном примере мы получаем список ссылок на все элементы с классом `myClass` с помощью метода `.getElementsByClassName()`, а затем изменяем их цвет текста на красный.

## Заключение

`.getElementsByClassName()` - это метод JavaScript, который позволяет получить список элементов на веб-странице, которые имеют заданный класс. Он используется для того, чтобы получить ссылки на все элементы с определенным классом и работать с ними в JavaScript.