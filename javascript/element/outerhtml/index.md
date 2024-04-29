---
metaTitle: .outerHTML в JavaScript
metaDescription: Разбираемся как использовать .outerHTML в JavaScript
author: Дмитрий Нечаев
title: .outerHTML в JavaScript
preview: Учимся пользоваться .outerHTML в JavaScript. Разбираем примеры использования
---

Свойство `.outerHTML` в JavaScript предоставляет возможность читать HTML-разметку элемента целиком, включая его собственное открывающее и закрывающее теги, а также всё его содержимое. Более того, оно позволяет заменить элемент и его содержимое на новую разметку. Давайте рассмотрим использование `.outerHTML` более подробно с примерами.

## Введение в `.outerHTML`

Свойство `.outerHTML` предоставляет доступ к HTML-разметке элемента, включая его собственные теги и содержимое, в виде строки. Кроме того, оно позволяет заменить элемент и его содержимое на новую HTML-разметку.

## Примеры использования `.outerHTML`

Давайте рассмотрим несколько примеров использования свойства `.outerHTML` для чтения и замены HTML-элементов.

### 1. Чтение HTML-разметки элемента

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

    // Читаем HTML-разметку элемента
    const htmlContent = myDiv.outerHTML;
    console.log(htmlContent); // Выведет: <div id="myDiv">Пример текста</div>
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.outerHTML` для чтения HTML-разметки элемента `<div>` с идентификатором `myDiv` и выводим его в консоль.

### 2. Замена элемента и его содержимого

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

  <button onclick="replaceElement()">Заменить элемент</button>

  <script>
    // Функция для замены элемента
    function replaceElement() {
      // Создаем новый элемент
      const newElement = document.createElement('p');
      newElement.textContent = 'Новый текст';

      // Получаем ссылку на элемент, который нужно заменить
      const oldElement = document.getElementById('myDiv');

      // Заменяем элемент и его содержимое
      oldElement.outerHTML = newElement.outerHTML;
    }
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.outerHTML` для замены элемента `<div>` с идентификатором `myDiv` на новый элемент `<p>` с текстом "Новый текст" при нажатии на кнопку.

## Заключение

Свойство `.outerHTML` в JavaScript предоставляет простой и эффективный способ чтения HTML-разметки элемента и его замены на новую разметку. Это позволяет нам динамически изменять структуру страницы и обновлять содержимое элементов на лету. Надеюсь, данная статья помогла вам лучше понять, как использовать `.outerHTML` в ваших проектах JavaScript.