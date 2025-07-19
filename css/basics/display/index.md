---
metaTitle: display в CSS - Основные типы отображения и их использование
metaDescription: В этой статье мы рассмотрим, как изменить стандартный тип отображения на произвольный, и подробно поговорим об основных типах отображения.
author: Дмитрий Нечаев
title: display в CSS - Основные типы отображения и их использование
preview: В этой статье мы рассмотрим, как изменить стандартный тип отображения на произвольный, и подробно поговорим об основных типах отображения.
---

## Введение

Свойство `display` в CSS определяет, как элемент будет отображаться на веб-странице. Понимание работы этого свойства является ключевым для управления макетом и расположением элементов. В этой статье мы рассмотрим, как изменить стандартный тип отображения на произвольный, и подробно поговорим об основных типах отображения. В частности, мы объясним, как поставить несколько элементов `<div>` в одну строку.

## Основные типы отображения

Свойство `display` имеет несколько значений, каждое из которых по-разному влияет на поведение элементов. Рассмотрим основные значения, которые чаще всего используются при верстке веб-страниц.

### `display: block`

Элемент с `display: block` занимает всю доступную ширину родительского элемента, а также начинается с новой строки. Примеры таких элементов включают `<div>`, `<h1> - <h6>`, `<p>` и другие.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .block {
      display: block;
      width: 100%;
      background-color: lightblue;
      margin-bottom: 10px;
    }
  </style>
  <title>display: block</title>
</head>
<body>
  <div class="block">Блок 1</div>
  <div class="block">Блок 2</div>
</body>
</html>

```

### `display: inline`

Элемент с `display: inline` не начинает новую строку и занимает только необходимую ширину. Примеры таких элементов включают `<span>`, `<a>`, `<strong>` и другие.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .inline {
      display: inline;
      background-color: lightgreen;
    }
  </style>
  <title>display: inline</title>
</head>
<body>
  <span class="inline">Инлайн 1</span>
  <span class="inline">Инлайн 2</span>
</body>
</html>

```

### `display: inline-block`

Элемент с `display: inline-block` сочетает свойства `block` и `inline`. Он не начинает новую строку, но позволяет задавать ширину и высоту.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .inline-block {
      display: inline-block;
      width: 150px;
      height: 100px;
      background-color: lightcoral;
      margin-right: 10px;
    }
  </style>
  <title>display: inline-block</title>
</head>
<body>
  <div class="inline-block">Инлайн-блок 1</div>
  <div class="inline-block">Инлайн-блок 2</div>
</body>
</html>

```

### `display: flex`

Элемент с `display: flex` используется для создания гибких макетов. Он позволяет легко выравнивать и распределять пространство между дочерними элементами.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .flex-container {
      display: flex;
      justify-content: space-between;
    }
    .flex-item {
      background-color: lightsalmon;
      padding: 10px;
      margin: 5px;
    }
  </style>
  <title>display: flex</title>
</head>
<body>
  <div class="flex-container">
    <div class="flex-item">Флекс 1</div>
    <div class="flex-item">Флекс 2</div>
    <div class="flex-item">Флекс 3</div>
  </div>
</body>
</html>

```

### `display: grid`

Элемент с `display: grid` используется для создания сеточных макетов. Он позволяет управлять расположением элементов в двухмерной сетке.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .grid-item {
      background-color: lightseagreen;
      padding: 20px;
    }
  </style>
  <title>display: grid</title>
</head>
<body>
  <div class="grid-container">
    <div class="grid-item">Грид 1</div>
    <div class="grid-item">Грид 2</div>
    <div class="grid-item">Грид 3</div>
  </div>
</body>
</html>

```

### `display: none`

Элемент с `display: none` полностью удаляется из визуального отображения и не занимает места на странице.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .hidden {
      display: none;
    }
  </style>
  <title>display: none</title>
</head>
<body>
  <div class="hidden">Этот текст не будет виден.</div>
  <div>Этот текст будет виден.</div>
</body>
</html>

```

## Как поставить несколько элементов `<div>` в строку

Существует несколько способов размещения элементов `<div>` в одну строку. Рассмотрим наиболее распространенные методы.

### Использование `display: inline-block`

Как уже упоминалось, `inline-block` позволяет элементам оставаться в одной строке, при этом сохраняя возможность задавать их размеры.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .inline-block {
      display: inline-block;
      width: 200px;
      height: 100px;
      background-color: lightblue;
      margin-right: 10px;
    }
  </style>
  <title>Inline-block</title>
</head>
<body>
  <div class="inline-block">Блок 1</div>
  <div class="inline-block">Блок 2</div>
  <div class="inline-block">Блок 3</div>
</body>
</html>

```

### Использование `float`

Использование свойства `float` позволяет элементам выстраиваться в одну линию, но этот метод менее гибок и сложен в управлении, особенно при создании сложных макетов.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .float {
      float: left;
      width: 200px;
      height: 100px;
      background-color: lightgreen;
      margin-right: 10px;
    }
    .container {
      overflow: hidden; /* Очищаем обтекание */
    }
  </style>
  <title>Float</title>
</head>
<body>
  <div class="container">
    <div class="float">Блок 1</div>
    <div class="float">Блок 2</div>
    <div class="float">Блок 3</div>
  </div>
</body>
</html>

```

### Использование Flexbox

Flexbox является современным и гибким методом для размещения элементов в строку и управления их расположением.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .flex-container {
      display: flex;
      justify-content: space-between;
    }
    .flex-item {
      width: 200px;
      height: 100px;
      background-color: lightcoral;
    }
  </style>
  <title>Flexbox</title>
</head>
<body>
  <div class="flex-container">
    <div class="flex-item">Блок 1</div>
    <div class="flex-item">Блок 2</div>
    <div class="flex-item">Блок 3</div>
  </div>
</body>
</html>

```

### Использование CSS Grid

CSS Grid — ещё один современный метод, который позволяет легко управлять расположением элементов в строку и колонку.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .grid-item {
      background-color: lightseagreen;
      padding: 20px;
      text-align: center;
    }
  </style>
  <title>CSS Grid</title>
</head>
<body>
  <div class="grid-container">
    <div class="grid-item">Блок 1</div>
    <div class="grid-item">Блок 2</div>
    <div class="grid-item">Блок 3</div>
  </div>
</body>
</html>

```

## Заключение

Свойство `display` является важным инструментом для управления расположением и отображением элементов на веб-странице. Знание различных значений этого свойства и умение их применять позволяет создавать гибкие и адаптивные макеты. Независимо от того, нужно ли вам разместить элементы `<div>` в строку или создать сложную сетку, CSS предлагает множество возможностей для достижения нужного результата. Экспериментируйте с различными методами и выбирайте тот, который наилучшим образом подходит для ваших задач.
