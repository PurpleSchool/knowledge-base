---
metaTitle: ..innerHTML в JavaScript
metaDescription: Разбираемся как использовать .innerHTML в JavaScript
author: Дмитрий Нечаев
title:  в JavaScript
preview: Учимся пользоваться .innerHTML в JavaScript. Разбираем примеры использования
---

Свойство `.innerHTML` в JavaScript предоставляет возможность читать и изменять содержимое HTML-элемента. Это полезно, когда нам нужно динамически обновлять содержимое элемента, добавлять новые элементы или изменять структуру страницы на лету. Давайте рассмотрим использование `.innerHTML` более подробно с примерами.

## Введение в `.innerHTML`

Свойство `.innerHTML` позволяет нам читать и изменять HTML-содержимое элемента напрямую из JavaScript. Оно представляет собой строку, содержащую HTML-разметку элемента и его потомков.

## Примеры использования `.innerHTML`

Давайте рассмотрим несколько примеров использования свойства `.innerHTML` для чтения и изменения содержимого элементов.

### 1. Чтение содержимого элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="myDiv">Пример текста</div>

  <script>
    // Получаем ссылку на элемент
    const myDiv = document.getElementById('myDiv');

    // Читаем содержимое элемента
    const content = myDiv.innerHTML;
    console.log(content); // Выведет: Пример текста
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.innerHTML` для чтения содержимого элемента `<div>` с идентификатором `myDiv` и выводим его в консоль.

### 2. Изменение содержимого элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="myDiv">Пример текста</div>

  <button onclick="changeContent()">Изменить содержимое</button>

  <script>
    // Функция для изменения содержимого элемента
    function changeContent() {
      // Получаем ссылку на элемент
      const myDiv = document.getElementById('myDiv');

      // Изменяем содержимое элемента
      myDiv.innerHTML = 'Новый текст';
    }
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.innerHTML` для изменения содержимого элемента `<div>` с идентификатором `myDiv` при нажатии на кнопку.

### 3. Добавление новых элементов

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <ul id="myList">
    <li>Элемент 1</li>
    <li>Элемент 2</li>
  </ul>

  <button onclick="addItem()">Добавить элемент</button>

  <script>
    // Функция для добавления нового элемента в список
    function addItem() {
      // Получаем ссылку на список
      const myList = document.getElementById('myList');

      // Создаем новый элемент списка
      const newItem = document.createElement('li');
      newItem.textContent = 'Новый элемент';

      // Добавляем новый элемент в список
      myList.appendChild(newItem);
    }
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.innerHTML` для добавления нового элемента `<li>` в список `<ul>` с идентификатором `myList` при нажатии на кнопку.

## Заключение

Свойство `.innerHTML` в JavaScript предоставляет простой и эффективный способ читать и изменять содержимое HTML-элементов. Это позволяет нам создавать динамические пользовательские интерфейсы и изменять содержимое страницы.