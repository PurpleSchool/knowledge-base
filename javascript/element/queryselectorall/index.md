---
metaTitle: .querySelectorAll() в JavaScript
metaDescription: Разбираемся как использовать .querySelectorAll() в JavaScript
author: Дмитрий Нечаев
title: .querySelectorAll() в JavaScript
preview: Учимся пользоваться .querySelectorAll() в JavaScript. Разбираем примеры использования
---

JavaScript является языком программирования, который активно используется для веб-разработки. Один из ключевых элементов веб-разработки - это манипуляция DOM (Document Object Model), который представляет структуру HTML-документа в виде дерева объектов. Метод .querySelectorAll() является одним из инструментов JavaScript, который позволяет выбирать DOM-элементы с помощью CSS-селекторов.

### Что такое .querySelectorAll()?

Метод .querySelectorAll() представляет собой часть интерфейса DOM и предназначен для поиска всех элементов на веб-странице, которые соответствуют заданному CSS-селектору. Он возвращает статический NodeList, который содержит все найденные элементы. NodeList похож на массив, но не является им, и предоставляет доступ к коллекции узлов (например, DOM-элементов или текстовых узлов).

### Синтаксис

```javascript
var elements = document.querySelectorAll(selector);
```

- `selector`: Строка, содержащая CSS-селектор, по которому будет производиться поиск элементов.

### Примеры использования

Давайте рассмотрим несколько примеров использования метода .querySelectorAll() с различными CSS-селекторами.

#### Пример 1: Выбор всех элементов <p> на странице и изменение их стилей.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Пример использования .querySelectorAll()</title>
</head>
<body>

<p>Первый параграф.</p>
<p>Второй параграф.</p>
<p>Третий параграф.</p>

<script>
// Выбор всех элементов <p> на странице
var paragraphs = document.querySelectorAll('p');

// Изменение стилей для каждого параграфа
paragraphs.forEach(function(paragraph) {
    paragraph.style.color = 'red';
});
</script>

</body>
</html>
```

#### Пример 2: Выбор всех элементов с классом "highlight" и добавление им класса "selected".

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Пример использования .querySelectorAll()</title>
<style>
    .highlight {
        background-color: yellow;
    }
    .selected {
        border: 2px solid blue;
    }
</style>
</head>
<body>

<p class="highlight">Первый параграф.</p>
<p>Второй параграф.</p>
<p class="highlight">Третий параграф.</p>

<script>
// Выбор всех элементов с классом "highlight"
var highlightedElements = document.querySelectorAll('.highlight');

// Добавление класса "selected" к найденным элементам
highlightedElements.forEach(function(element) {
    element.classList.add('selected');
});
</script>

</body>
</html>
```

### Вывод

Метод .querySelectorAll() является мощным инструментом для выбора DOM-элементов на веб-странице с использованием CSS-селекторов. Он позволяет легко и эффективно манипулировать элементами страницы, что делает его важным компонентом веб-разработки на JavaScript. Используя этот метод в сочетании с другими DOM-методами и возможностями JavaScript, разработчики могут создавать более интерактивные и динамические веб-приложения.