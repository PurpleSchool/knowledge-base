---
metaTitle: Селектор по идентификатору в CSS. Стилизация элементов с уникальным атрибутом id
metaDescription: Селектор по идентификатору в CSS. Стилизация элементов с уникальным атрибутом id
author: Дмитрий Нечаев
title: Селектор по идентификатору в CSS; Полное руководство с примерами
preview: Селектор по идентификатору (id) в CSS используется для стилизации элементов, которые имеют уникальный атрибут id. Это мощный инструмент для точечного воздействия на конкретные элементы веб-страницы.
---

Селектор по идентификатору (id) в CSS используется для стилизации элементов, которые имеют уникальный атрибут `id`. Это мощный инструмент для точечного воздействия на конкретные элементы веб-страницы. В этой статье мы подробно рассмотрим, как использовать селекторы по идентификатору, их преимущества и ограничения, а также приведем примеры для различных ситуаций.

## Что такое селектор по идентификатору?

Селектор по идентификатору выбирает элемент HTML с определённым значением атрибута `id`. В CSS селекторы по идентификатору обозначаются символом решетки (`#`) перед именем идентификатора.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #main-header {
      color: blue; /* Устанавливает синий цвет текста для элемента с id "main-header" */
    }
  </style>
  <title>Селектор по идентификатору</title>
</head>
<body>
  <h1 id="main-header">Заголовок</h1>
</body>
</html>

```

В этом примере заголовок `<h1>` с id `main-header` будет иметь синий цвет текста.

## Преимущества использования селекторов по идентификатору

- **Точность**: Идентификаторы являются уникальными в пределах HTML-документа, что позволяет точно выбирать и стилизовать конкретные элементы.
- **Высокая специфичность**: Селекторы по идентификатору имеют более высокую специфичность по сравнению с селекторами по тегу и классу, что позволяет переопределять стили, установленные другими селекторами.
- **Удобство для JavaScript**: Идентификаторы часто используются в JavaScript для манипуляции элементами.

## Селекторы по идентификатору и их применение

### Основные примеры

Рассмотрим несколько примеров использования селекторов по идентификатору для различных элементов.

### Стилизация заголовка

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #header {
      font-size: 36px;
      color: darkred;
      text-align: center;
    }
  </style>
  <title>Стилизация заголовка</title>
</head>
<body>
  <h1 id="header">Главный заголовок</h1>
</body>
</html>

```

В этом примере заголовок `<h1>` с id `header` будет стилизован с использованием уникальных свойств.

### Стилизация параграфа

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #intro {
      font-size: 18px;
      line-height: 1.6;
      color: #333;
    }
  </style>
  <title>Стилизация параграфа</title>
</head>
<body>
  <p id="intro">Этот параграф содержит введение и стилизован по-своему.</p>
</body>
</html>

```

### Комбинирование с другими селекторами

Селекторы по идентификатору можно комбинировать с селекторами по тегу, классу и псевдоклассами для более точного управления стилями.

### Комбинирование с селекторами по тегу

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div#content {
      padding: 20px;
      background-color: lightgrey;
    }
  </style>
  <title>Комбинирование с селекторами по тегу</title>
</head>
<body>
  <div id="content">
    <p>Контент внутри блока div с id "content".</p>
  </div>
</body>
</html>

```

### Комбинирование с селекторами по классу

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .highlight#special {
      background-color: yellow;
      font-weight: bold;
    }
  </style>
  <title>Комбинирование с селекторами по классу</title>
</head>
<body>
  <p class="highlight" id="special">Этот текст будет выделен жёлтым фоном и жирным шрифтом.</p>
</body>
</html>

```

### Комбинирование с псевдоклассами

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #menu a:hover {
      color: red;
      text-decoration: underline;
    }
  </style>
  <title>Комбинирование с псевдоклассами</title>
</head>
<body>
  <div id="menu">
    <a href="#">Ссылка 1</a>
    <a href="#">Ссылка 2</a>
  </div>
</body>
</html>

```

### Ограничения использования идентификаторов

- **Уникальность**: Идентификатор должен быть уникальным в пределах HTML-документа. Использование одного и того же id для нескольких элементов является ошибкой и может привести к непредсказуемому поведению.
- **Высокая специфичность**: Высокая специфичность селекторов по идентификатору делает их сложными для переопределения другими стилями. Это может усложнить поддержку и обновление стилей.
- **Не рекомендуется для многократного использования**: Если требуется применить один и тот же стиль к нескольким элементам, лучше использовать классы вместо идентификаторов.

## Примеры реальных сценариев использования

### Стилизация формы

Селекторы по идентификатору можно использовать для стилизации отдельных полей формы и кнопок.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #name {
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      border: 1px solid #ccc;
    }

    #submit-btn {
      background-color: blue;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
    }

    #submit-btn:hover {
      background-color: darkblue;
    }
  </style>
  <title>Стилизация формы</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name">
    <button type="submit" id="submit-btn">Отправить</button>
  </form>
</body>
</html>

```

### Стилизация навигационного меню

Селекторы по идентификатору также полезны для стилизации элементов навигации.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #navbar {
      background-color: #333;
      overflow: hidden;
    }

    #navbar a {
      float: left;
      display: block;
      color: white;
      text-align: center;
      padding: 14px 20px;
      text-decoration: none;
    }

    #navbar a:hover {
      background-color: #ddd;
      color: black;
    }
  </style>
  <title>Стилизация навигационного меню</title>
</head>
<body>
  <div id="navbar">
    <a href="#home">Главная</a>
    <a href="#services">Услуги</a>
    <a href="#contact">Контакты</a>
  </div>
</body>
</html>

```

## Заключение

Селекторы по идентификатору в CSS являются мощным инструментом для стилизации конкретных элементов HTML с уникальными атрибутами id. Они позволяют точно управлять внешним видом элементов и имеют высокую специфичность. Однако их следует использовать с осторожностью, чтобы избежать проблем с переопределением стилей и поддержкой кода. В большинстве случаев рекомендуется применять классы для многократного использования стилей и идентификаторы для уникальных элементов. Экспериментируйте с различными селекторами и находите оптимальные решения для ваших проектов.