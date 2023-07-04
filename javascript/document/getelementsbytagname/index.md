---
metaTitle: .getElementsByTagName() – JavaScript Document – Объект страницы
metaDescription: Как работает .getElementsByTagName() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: .getElementsByTagName() в JavaScript
preview: .getElementsByTagName() - это метод JavaScript, который позволяет получить список элементов на веб-странице с заданным тегом...
---

`.getElementsByTagName()` - это метод JavaScript, который позволяет получить список элементов на веб-странице с заданным тегом. Он используется для того, чтобы получить ссылки на все элементы с определенным тегом и работать с ними в JavaScript.

## Описание работы

`.getElementsByTagName()` работает путем поиска всех элементов на веб-странице, которые имеют заданный тег. Если элементы найдены, метод возвращает список ссылок на эти элементы.

`.getElementsByTagName()` имеет следующий синтаксис:

```javascript
document.getElementsByTagName(tagName);
```

где:

- `tagName` - это строка, представляющая тег элемента, по которому мы ищем элементы.

Пример использования `.getElementsByTagName()` для получения списка ссылок на все элементы с тегом `div`:

```html
<div>Это мой элемент 1</div>
<div>Это мой элемент 2</div>
<p>Это не мой элемент</p>
```

```javascript
const elements = document.getElementsByTagName('div');
for (let i = 0; i < elements.length; i++) {
  elements[i].style.color = 'red';
}
```

В данном примере мы получаем список ссылок на все элементы с тегом `div` с помощью метода `.getElementsByTagName()`, а затем изменяем их цвет текста на красный.

## Заключение

`.getElementsByTagName()` - это метод JavaScript, который позволяет получить список элементов на веб-странице с заданным тегом. Он используется для того, чтобы получить ссылки на все элементы с определенным тегом и работать с ними в JavaScript.