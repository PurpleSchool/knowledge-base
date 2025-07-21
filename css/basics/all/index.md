---
metaTitle: Свойство all в CSS. Удобное средство для сброса всех стилей
metaDescription: Свойство all в CSS. Удобное средство для сброса всех стилей
author: Дмитрий Нечаев
title: Свойство all в CSS. Полное руководство с примерами
preview: Свойство all в CSS — это мощный инструмент, который позволяет разработчикам сбросить все примененные к элементу стили, возвращая их к исходным значениям.
---

Свойство `all` в CSS — это мощный инструмент, который позволяет разработчикам сбросить все примененные к элементу стили, возвращая их к исходным значениям. Это свойство особенно полезно при необходимости сбросить стили для конкретных элементов, не затрагивая остальные части документа. В этой статье мы подробно рассмотрим, как использовать свойство `all`, его возможности и приведем примеры использования.

## Что такое свойство `all`?

Свойство `all` позволяет задать все свойства CSS одновременно. Оно может принимать следующие значения:

- `initial`: сбрасывает все свойства элемента к их начальным значениям по умолчанию.
- `inherit`: заставляет все свойства элемента наследоваться от родителя.
- `unset`: устанавливает значение каждого свойства в `inherit`, если оно наследуемое, или в `initial` в противном случае.
- `revert`: сбрасывает все свойства к значениям, установленным в каскадировании.

### Пример использования `all: initial`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .styled {
      color: red;
      background-color: yellow;
      padding: 20px;
      font-size: 18px;
    }

    .reset {
      all: initial; /* Сброс всех стилей */
    }
  </style>
  <title>all: initial</title>
</head>
<body>
  <div class="styled">
    Этот блок стилизован
    <div class="styled reset">
      Этот блок сбросит все стили
    </div>
  </div>
</body>
</html>

```

В этом примере внешний блок `<div>` имеет несколько стилей, но внутренний блок с классом `reset` сбрасывает все эти стили, возвращаясь к начальным значениям.

Свойство `all` – это мощный инструмент, позволяющий сбросить или изменить все свойства элемента одновременно. Однако, его использование требует осторожности, так как оно может повлиять на стили, заданные в других частях кода. Чтобы эффективно использовать свойство `all`, необходимо хорошо понимать принципы работы CSS и каскада. Если вы хотите детальнее погрузиться в мир CSS и научиться использовать все его возможности на максимум — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=svoystvo-all-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример использования `all: inherit`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .parent {
      color: blue;
      font-size: 20px;
    }

    .child {
      color: red;
      all: inherit; /* Наследование всех стилей от родителя */
    }
  </style>
  <title>all: inherit</title>
</head>
<body>
  <div class="parent">
    Родительский блок
    <div class="child">
      Дочерний блок, наследующий все стили
    </div>
  </div>
</body>
</html>

```

В этом примере дочерний блок с классом `child` наследует все стили от родительского блока, несмотря на то, что у него были заданы собственные стили.

### Пример использования `all: unset`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .parent {
      color: green;
    }

    .child {
      color: red;
      all: unset; /* Наследуемые свойства сбрасываются, остальные - к initial */
    }
  </style>
  <title>all: unset</title>
</head>
<body>
  <div class="parent">
    Родительский блок
    <div class="child">
      Дочерний блок, сбрасывающий все стили
    </div>
  </div>
</body>
</html>

```

В этом примере дочерний блок с классом `child` сбрасывает свои стили. Наследуемые свойства, такие как `color`, сбрасываются к значению по умолчанию.

### Пример использования `all: revert`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .styled {
      color: red;
      background-color: yellow;
      padding: 20px;
      font-size: 18px;
    }

    .reset {
      all: revert; /* Возвращает стили к значениям, установленным в каскадировании */
    }
  </style>
  <title>all: revert</title>
</head>
<body>
  <div class="styled">
    Этот блок стилизован
    <div class="styled reset">
      Этот блок сбросит все стили к значениям из каскадирования
    </div>
  </div>
</body>
</html>

```

В этом примере дочерний блок с классом `reset` сбрасывает свои стили к значениям, установленным в каскадировании.

## Использование свойства `all` в реальных проектах

### Сброс стилей в компонентах

Свойство `all` может быть полезно при создании компонентов, которые должны иметь независимые стили. Это особенно важно при использовании CSS-фреймворков или библиотек, где глобальные стили могут влиять на ваши компоненты.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      padding: 20px;
    }

    .custom-component {
      all: initial; /* Сброс всех стилей */
      font-family: 'Courier New', Courier, monospace;
      color: black;
      border: 1px solid #ccc;
      padding: 10px;
    }
  </style>
  <title>all: initial в компонентах</title>
</head>
<body>
  <div class="custom-component">
    Это независимый компонент со своими стилями.
  </div>
</body>
</html>

```

### Сброс стилей в определенных участках страницы

Свойство `all` можно использовать для сброса стилей в определённых участках страницы, таких как содержимое, вставленное пользователем или сторонним сервисом, чтобы предотвратить влияние внешних стилей.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background-color: #f0f0f0;
      color: #333;
      font-family: Arial, sans-serif;
    }

    .external-content {
      all: unset; /* Сброс стилей, наследуемые свойства возвращены к значениям по умолчанию */
      background-color: white;
      padding: 20px;
      border: 1px solid #ccc;
    }
  </style>
  <title>all: unset для внешнего контента</title>
</head>
<body>
  <div class="external-content">
    <h1>Заголовок</h1>
    <p>Содержимое, вставленное пользователем или сторонним сервисом.</p>
  </div>
</body>
</html>

```

## Заключение

Свойство `all` в CSS предоставляет удобный способ сброса всех стилей для элемента, возвращая их к исходным значениям. Это полезный инструмент для создания независимых компонентов, предотвращения конфликтов стилей и управления внешним содержимым. Знание и правильное использование этого свойства помогают разработчикам более эффективно контролировать стилизацию своих веб-страниц.

`all` может быть полезным инструментом для сброса стилей, но его не стоит использовать без необходимости. Чтобы создавать чистый и поддерживаемый код, необходимо хорошо понимать, как работают все свойства CSS и как они взаимодействуют между собой. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=svoystvo-all-v-css-polnoe-rukovodstvo-s-primerami) вы получите все необходимые знания и навыки для создания профессиональных веб-сайтов. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
