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

В JavaScript свойство `.outerHTML` позволяет получить или установить HTML-разметку элемента, включая сам элемент. Это удобный способ для замены элемента целиком или для получения его HTML-кода для дальнейшей обработки. Если вы стремитесь к глубокому пониманию структуры HTML, хотите научиться манипулировать элементами и их содержимым с помощью JavaScript, узнать о различиях между `.outerHTML` и `.innerHTML`, а также создавать динамические и интерактивные веб-приложения — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=outerHTML-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

Важно помнить о безопасности при использовании `.outerHTML` для вставки HTML-кода, полученного от пользователя, чтобы избежать XSS-атак.  Для глубокого понимания DOM и освоения безопасных методов манипуляции HTML, мы рекомендуем наш курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=outerHTML-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
