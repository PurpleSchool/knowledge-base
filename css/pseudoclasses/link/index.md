---
metaTitle: Псевдокласс link в CSS. Стилизация непросмотренных ссылок
metaDescription: Псевдокласс link в CSS. Стилизация непросмотренных ссылок
author: Дмитрий Нечаев
title: Псевдокласс link в CSS. Полное руководство с примерами
preview: Псевдокласс link в CSS используется для стилизации ссылок, по которым ещё не переходили.
---

Псевдокласс `:link` в CSS используется для стилизации ссылок, по которым ещё не переходили. Это мощный инструмент, который позволяет задать уникальные стили для непросмотренных ссылок, улучшая визуальное восприятие и навигацию на веб-страницах. В этой статье мы подробно рассмотрим псевдокласс `:link`, его применение и приведем примеры использования для различных ситуаций.

## Что такое псевдокласс `:link`?

Псевдокласс `:link` применяется к элементам `<a>`, которые имеют атрибут `href` и ещё не были посещены пользователем. Он позволяет задать стили, которые будут применяться только к непросмотренным ссылкам.

Пример базового использования `:link`:

```css
a:link {
  /* Стили для непросмотренных ссылок */
}

```

## Примеры использования псевдокласса `:link`

### Основные примеры

### Изменение цвета непросмотренных ссылок

Одним из самых распространённых применений псевдокласса `:link` является изменение цвета непросмотренных ссылок.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:link {
      color: blue; /* Цвет непросмотренных ссылок */
      text-decoration: none; /* Убираем подчеркивание */
    }
  </style>
  <title>Цвет непросмотренных ссылок</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере все непросмотренные ссылки будут синими и без подчеркивания.

### Изменение фона и добавление рамки для непросмотренных ссылок

Также можно изменить фон и добавить рамку для непросмотренных ссылок.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:link {
      background-color: yellow; /* Фон непросмотренных ссылок */
      border: 1px solid #000; /* Рамка непросмотренных ссылок */
      padding: 5px; /* Внутренний отступ */
      color: black; /* Цвет текста */
    }
  </style>
  <title>Стилизация фона и рамки для непросмотренных ссылок</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере все непросмотренные ссылки будут с жёлтым фоном, чёрной рамкой и чёрным текстом.

### Комбинирование с другими псевдоклассами

Псевдокласс `:link` можно комбинировать с другими псевдоклассами для создания более сложных стилей. Наиболее часто `:link` используется вместе с псевдоклассами `:visited`, `:hover` и `:active`.

### Комбинирование с `:visited`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:link {
      color: blue; /* Цвет непросмотренных ссылок */
    }

    a:visited {
      color: purple; /* Цвет посещенных ссылок */
    }
  </style>
  <title>Комбинирование с :visited</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере непросмотренные ссылки будут синими, а посещённые — пурпурными.

### Комбинирование с `:hover` и `:active`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:link {
      color: blue; /* Цвет непросмотренных ссылок */
      text-decoration: none;
    }

    a:visited {
      color: purple; /* Цвет посещенных ссылок */
    }

    a:hover {
      text-decoration: underline; /* Подчеркивание при наведении */
    }

    a:active {
      color: red; /* Цвет активной ссылки */
    }
  </style>
  <title>Комбинирование с :hover и :active</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере непросмотренные ссылки будут синими, посещённые — пурпурными, при наведении на ссылку появится подчеркивание, а при нажатии на неё цвет изменится на красный.

## Примеры использования в реальных проектах

### Навигационное меню

Использование псевдокласса `:link` для стилизации непросмотренных ссылок в навигационном меню:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    nav a:link {
      color: #007bff;
      text-decoration: none;
      padding: 10px;
      display: inline-block;
    }

    nav a:visited {
      color: #0056b3;
    }

    nav a:hover {
      background-color: #e2e6ea;
      border-radius: 5px;
    }

    nav a:active {
      color: #003865;
    }
  </style>
  <title>Навигационное меню</title>
</head>
<body>
  <nav>
    <a href="<https://example.com/home>">Главная</a>
    <a href="<https://example.com/about>">О нас</a>
    <a href="<https://example.com/contact>">Контакты</a>
  </nav>
</body>
</html>

```

### Боковая панель

Использование псевдокласса `:link` для стилизации непросмотренных ссылок на боковой панели:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .sidebar a:link {
      color: #343a40;
      text-decoration: none;
      display: block;
      padding: 10px 15px;
      border-bottom: 1px solid #ccc;
    }

    .sidebar a:visited {
      color: #6c757d;
    }

    .sidebar a:hover {
      background-color: #f8f9fa;
    }

    .sidebar a:active {
      color: #0056b3;
    }
  </style>
  <title>Боковая панель</title>
</head>
<body>
  <div class="sidebar">
    <a href="<https://example.com/item1>">Элемент 1</a>
    <a href="<https://example.com/item2>">Элемент 2</a>
    <a href="<https://example.com/item3>">Элемент 3</a>
  </div>
</body>
</html>

```

## Заключение

Псевдокласс `:link` в CSS предоставляет возможность стилизовать ссылки, по которым ещё не переходили пользователи. Это помогает улучшить визуальное восприятие и навигацию на веб-страницах, делая их более понятными и привлекательными для пользователей. Понимание различных способов использования псевдокласса `:link`, а также его комбинирование с другими псевдоклассами, помогает разработчикам создавать более гибкие и динамичные стили для веб-страниц. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.