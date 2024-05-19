---
metaTitle: Псевдокласс visited в CSS. Подсвечиваем посещённые ссылки
metaDescription: Псевдокласс visited в CSS. Подсвечиваем посещённые ссылки
author: Дмитрий Нечаев
title: Псевдокласс visited в CSS. Полное руководство с примерами
preview: Псевдокласс visited в CSS используется для стилизации ссылок, по которым пользователь уже переходил.
---

Псевдокласс `:visited` в CSS используется для стилизации ссылок, по которым пользователь уже переходил. Это позволяет улучшить навигацию на веб-страницах, помогая пользователям различать посещённые и непросмотренные ссылки. В этой статье мы подробно рассмотрим псевдокласс `:visited`, его применение и ограничения, а также приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:visited`?

Псевдокласс `:visited` применяется к элементам `<a>`, которые имеют атрибут `href` и уже были посещены пользователем. Это позволяет задать стили, которые будут применяться только к посещённым ссылкам.

Пример базового использования `:visited`:

```css
a:visited {
  /* Стили для посещённых ссылок */
}

```

## Примеры использования псевдокласса `:visited`

### Основные примеры

### Изменение цвета посещённых ссылок

Одним из самых распространённых применений псевдокласса `:visited` является изменение цвета посещённых ссылок.

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
      color: purple; /* Цвет посещённых ссылок */
    }
  </style>
  <title>Цвет посещённых ссылок</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере непросмотренные ссылки будут синими, а посещённые — пурпурными.

### Изменение стиля текста для посещённых ссылок

Также можно изменить стиль текста для посещённых ссылок, например, сделать их курсивными или подчеркнутыми.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:visited {
      font-style: italic; /* Курсив для посещённых ссылок */
      text-decoration: underline; /* Подчёркивание для посещённых ссылок */
    }
  </style>
  <title>Стиль текста для посещённых ссылок</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере все посещённые ссылки будут курсивными и подчеркнутыми.

### Комбинирование с другими псевдоклассами

Псевдокласс `:visited` можно комбинировать с другими псевдоклассами для создания более сложных стилей. Наиболее часто `:visited` используется вместе с псевдоклассами `:link`, `:hover` и `:active`.

### Комбинирование с `:link`, `:hover` и `:active`

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
      color: purple; /* Цвет посещённых ссылок */
    }

    a:hover {
      text-decoration: underline; /* Подчеркивание при наведении */
    }

    a:active {
      color: red; /* Цвет активной ссылки */
    }
  </style>
  <title>Комбинирование псевдоклассов</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере непросмотренные ссылки будут синими, посещённые — пурпурными, при наведении на ссылку появится подчеркивание, а при нажатии на неё цвет изменится на красный.

## Ограничения использования псевдокласса `:visited`

### Безопасность и конфиденциальность

Браузеры ограничивают стили, которые могут быть применены с помощью псевдокласса `:visited`, чтобы предотвратить возможность утечки данных о посещённых пользователем страницах. Например, нельзя изменить размер шрифта, фон, содержимое или позиционирование элементов для посещённых ссылок.

### Поддерживаемые свойства

Для посещённых ссылок могут быть изменены только следующие свойства:

- `color` — цвет текста.
- `background-color` — цвет фона.
- `border-color` — цвет рамки.
- `outline-color` — цвет обводки.
- `column-rule-color` — цвет разделительной линии между колонками.

### Пример с ограничениями

Пример, демонстрирующий поддерживаемые свойства:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:visited {
      color: purple; /* Цвет текста */
      background-color: yellow; /* Цвет фона */
      border: 1px solid red; /* Цвет рамки */
    }
  </style>
  <title>Ограничения псевдокласса :visited</title>
</head>
<body>
  <a href="<https://example.com>">Посетите наш сайт</a>
</body>
</html>

```

В этом примере изменяются цвет текста, цвет фона и цвет рамки для посещённых ссылок.

## Примеры использования в реальных проектах

### Навигационное меню

Использование псевдокласса `:visited` для стилизации посещённых ссылок в навигационном меню:

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
      color: #6c757d;
    }

    nav a:hover {
      background-color: #e2e6ea;
      border-radius: 5px;
    }

    nav a:active {
      color: #0056b3;
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

### Список статей или постов

Использование псевдокласса `:visited` для стилизации посещённых ссылок в списке статей или постов:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .post-list a:link {
      color: #333;
      text-decoration: none;
      display: block;
      padding: 10px;
      border-bottom: 1px solid #ccc;
    }

    .post-list a:visited {
      color: #888;
    }

    .post-list a:hover {
      background-color: #f0f0f0;
    }

    .post-list a:active {
      color: #0056b3;
    }
  </style>
  <title>Список статей или постов</title>
</head>
<body>
  <div class="post-list">
    <a href="<https://example.com/post1>">Статья 1</a>
    <a href="<https://example.com/post2>">Статья 2</a>
    <a href="<https://example.com/post3>">Статья 3</a>
  </div>
</body>
</html>

```

## Заключение

Псевдокласс `:visited` в CSS предоставляет возможность стилизовать ссылки, по которым пользователь уже переходил. Это помогает улучшить навигацию и визуальное восприятие на веб-страницах, делая их более понятными и удобными для пользователей. Понимание различных способов использования псевдокласса `:visited`, а также его ограничений, помогает разработчикам создавать более гибкие и поддерживаемые стили для веб-страниц. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.