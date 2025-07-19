---
metaTitle: .classList в JavaScript
metaDescription: Разбираемся как использовать .classList в JavaScript
author: Дмитрий Нечаев
title: .classList в JavaScript
preview: Учимся пользоваться .classList в JavaScript. Разбираем примеры использования
---

Метод `.classList` в JavaScript предоставляет удобный способ динамически читать, добавлять и удалять классы у элементов DOM. Этот метод полезен, когда нам нужно изменять стили элементов в зависимости от определенных условий или событий. Давайте рассмотрим использование `.classList` более подробно с примерами.

## Введение в `.classList`

Свойство `.classList` представляет собой объект, который содержит методы для работы с классами элемента. Этот объект имеет следующие методы:

- `add(className)`: добавляет указанный класс к элементу.
- `remove(className)`: удаляет указанный класс из элемента.
- `toggle(className)`: добавляет указанный класс к элементу, если его нет, и удаляет, если уже присутствует.
- `contains(className)`: проверяет, содержит ли элемент указанный класс.
- `item(index)`: возвращает имя класса по индексу.

## Примеры использования `.classList`

Давайте рассмотрим различные сценарии использования методов `.classList` для управления классами элементов.

### 1. Добавление класса к элементу

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
  <style>
    .highlight {
      background-color: yellow;
    }
  </style>
</head>
<body>
  <div id="myElement">Это элемент</div>

  <script>
    // Получаем ссылку на элемент
    const element = document.getElementById('myElement');

    // Добавляем класс к элементу
    element.classList.add('highlight');
  </script>
</body>
</html>

```

Этот пример добавляет класс `highlight` к элементу с идентификатором `myElement`, что приводит к изменению его фона на желтый.

Свойство `.classList` предоставляет удобный способ для работы с классами CSS, назначенными элементу. Оно позволяет добавлять, удалять и проверять наличие классов, что упрощает динамическое изменение внешнего вида элементов. Если вы хотите научиться стилизации через JavaScript и детальнее изучить `.classList` — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=classList-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### 2. Удаление класса у элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
  <style>
    .highlight {
      background-color: yellow;
    }
  </style>
</head>
<body>
  <div id="myElement" class="highlight">Это элемент</div>

  <script>
    // Получаем ссылку на элемент
    const element = document.getElementById('myElement');

    // Удаляем класс у элемента
    element.classList.remove('highlight');
  </script>
</body>
</html>

```

Этот пример удаляет класс `highlight` у элемента с идентификатором `myElement`, что возвращает его фон к изначальному состоянию.

### 3. Переключение класса у элемента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
  <style>
    .highlight {
      background-color: yellow;
    }
  </style>
</head>
<body>
  <div id="myElement">Это элемент</div>

  <button onclick="toggleHighlight()">Переключить класс</button>

  <script>
    // Получаем ссылку на элемент
    const element = document.getElementById('myElement');

    // Функция для переключения класса
    function toggleHighlight() {
      element.classList.toggle('highlight');
    }
  </script>
</body>
</html>

```

В этом примере при нажатии на кнопку "Переключить класс" будет переключаться класс `highlight` у элемента `myElement`.

## Заключение

Метод `.classList` предоставляет удобный интерфейс для динамического управления классами элементов DOM. Это помогает в создании интерактивных пользовательских интерфейсов и адаптивного дизайна веб-приложений. Надеюсь, данная статья помогла вам лучше понять, как использовать `.classList` в ваших проектах JavaScript.

Использование `.classList` предпочтительнее прямого изменения атрибута `class`, поскольку оно позволяет избежать случайного удаления существующих классов и упрощает добавление и удаление нескольких классов одновременно. Углубите ваши знания на нашем курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=classList-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
