---
metaTitle: .textContent в JavaScript
metaDescription: Разбираемся как использовать .textContent в JavaScript
author: Дмитрий Нечаев
title: .textContent в JavaScript
preview: Учимся пользоваться .textContent в JavaScript. Разбираем примеры использования
---

Свойство `.textContent` в JavaScript позволяет нам получать текстовое содержимое элемента и его потомков, а также устанавливать новое текстовое содержимое. Это полезно, когда нам нужно получить или изменить текст на странице без учета HTML-разметки. Давайте рассмотрим использование `.textContent` более подробно с примерами.

## Введение в `.textContent`

Свойство `.textContent` предоставляет доступ к текстовому содержимому элемента, игнорируя все его дочерние элементы, и позволяет устанавливать новое текстовое содержимое. Оно возвращает или устанавливает только текст, без HTML-разметки.

## Примеры использования `.textContent`

Давайте рассмотрим несколько примеров использования свойства `.textContent` для чтения и записи текстового содержимого.

### 1. Чтение текста элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="myDiv">
    Пример текста <span>внутри элемента</span>
  </div>

  <script>
    // Получаем ссылку на элемент
    const myDiv = document.getElementById('myDiv');

    // Читаем текстовое содержимое элемента
    const textContent = myDiv.textContent;
    console.log(textContent); // Выведет: Пример текста внутри элемента
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.textContent` для чтения текстового содержимого элемента `<div>` с идентификатором `myDiv`, игнорируя содержимое внутренних элементов.

### 2. Изменение текста элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="myDiv">
    Пример текста <span>внутри элемента</span>
  </div>

  <button onclick="changeText()">Изменить текст</button>

  <script>
    // Функция для изменения текста элемента
    function changeText() {
      // Получаем ссылку на элемент
      const myDiv = document.getElementById('myDiv');

      // Устанавливаем новый текст
      myDiv.textContent = 'Новый текст';
    }
  </script>
</body>
</html>

```

В этом примере мы используем свойство `.textContent` для изменения текстового содержимого элемента `<div>` с идентификатором `myDiv` на новый текст при нажатии на кнопку.

## Заключение

Свойство `.textContent` в JavaScript предоставляет простой и надежный способ чтения и изменения текстового содержимого элементов на странице. Оно игнорирует HTML-разметку и возвращает или устанавливает только текст. Это позволяет легко манипулировать текстом на странице, делая пользовательский интерфейс более динамичным и удобным для пользователей. Надеюсь, данная статья помогла вам лучше понять, как использовать `.textContent` в ваших проектах JavaScript.