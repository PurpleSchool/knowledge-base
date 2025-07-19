---
metaTitle: Селектор по тегу в CSS. Основы стилизации HTML-элементов
metaDescription: Селектор по тегу в CSS. Основы стилизации HTML-элементов
author: Дмитрий Нечаев
title: Селектор по тегу в CSS. Полное руководство с примерами
preview: Селекторы по тегу в CSS используются для стилизации определённых HTML-элементов.
---

Селекторы по тегу в CSS используются для стилизации определённых HTML-элементов. Это один из базовых типов селекторов, который позволяет выбрать все элементы определённого типа на странице и применить к ним стили. В этой статье мы подробно рассмотрим, как работают селекторы по тегу, их использование и приведем примеры для различных HTML-тегов.

## Что такое селектор по тегу?

Селектор по тегу (или элементный селектор) выбирает все элементы определённого типа в HTML-документе. Например, если нужно изменить стиль всех абзацев (`<p>`) на странице, можно использовать селектор `p`.

Пример:

```css
p {
  color: blue; /* Устанавливает синий цвет текста для всех абзацев */
}

```

Этот CSS-код изменит цвет текста всех элементов `<p>` на странице на синий.

Селектор по тегу – это один из самых простых и распространенных способов стилизации элементов в CSS. Однако, для эффективного использования этого селектора необходимо понимать, как работает каскад стилей, как наследуются свойства и как правильно использовать другие типы селекторов для более точного таргетинга. Если вы хотите детальнее изучить селекторы в CSS и научиться создавать сложные и красивые веб-страницы, — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=selektor-po-tegu-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Основные теги и их стилизация

Рассмотрим несколько примеров использования селекторов по тегу для различных HTML-элементов.

### Стилизация заголовков

HTML предоставляет теги для различных уровней заголовков от `<h1>` до `<h6>`. Селекторы по тегу позволяют легко стилизовать их.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    h1 {
      font-size: 36px;
      color: darkblue;
      text-align: center;
    }

    h2 {
      font-size: 30px;
      color: darkgreen;
    }
  </style>
  <title>Стилизация заголовков</title>
</head>
<body>
  <h1>Заголовок уровня 1</h1>
  <h2>Заголовок уровня 2</h2>
  <h2>Еще один заголовок уровня 2</h2>
</body>
</html>

```

В этом примере заголовки `<h1>` и `<h2>` имеют разные стили.

### Стилизация абзацев

Абзацы текста заключаются в теги `<p>`. Используя селектор `p`, можно задать общий стиль для всех абзацев.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p {
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
  </style>
  <title>Стилизация абзацев</title>
</head>
<body>
  <p>Это первый абзац.</p>
  <p>Это второй абзац.</p>
</body>
</html>

```

### Стилизация списков

Для списков используются теги `<ul>` (ненумерованные списки) и `<ol>` (нумерованные списки), а также `<li>` для элементов списка.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ul {
      list-style-type: square;
      padding-left: 20px;
    }

    ol {
      list-style-type: decimal;
      padding-left: 20px;
    }

    li {
      margin-bottom: 10px;
      color: darkred;
    }
  </style>
  <title>Стилизация списков</title>
</head>
<body>
  <ul>
    <li>Элемент ненумерованного списка 1</li>
    <li>Элемент ненумерованного списка 2</li>
  </ul>
  <ol>
    <li>Элемент нумерованного списка 1</li>
    <li>Элемент нумерованного списка 2</li>
  </ol>
</body>
</html>

```

### Стилизация ссылок

Ссылки в HTML определяются тегом `<a>`. Используя селектор по тегу `a`, можно задать стиль для всех ссылок на странице.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a {
      color: blue;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
  <title>Стилизация ссылок</title>
</head>
<body>
  <a href="<https://example.com>">Это ссылка</a>
</body>
</html>

```

### Стилизация изображений

Изображения в HTML добавляются с помощью тега `<img>`. Селектор по тегу `img` позволяет задавать стили для всех изображений.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    img {
      max-width: 100%;
      height: auto;
      border: 2px solid black;
    }
  </style>
  <title>Стилизация изображений</title>
</head>
<body>
  <img src="<https://via.placeholder.com/150>" alt="Пример изображения">
</body>
</html>

```

## Сочетание селекторов по тегу с другими селекторами

Селекторы по тегу можно комбинировать с другими селекторами, такими как классы, идентификаторы и псевдоклассы, для более точного управления стилями.

### Сочетание с классами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p.special {
      color: purple;
      font-weight: bold;
    }
  </style>
  <title>Сочетание с классами</title>
</head>
<body>
  <p>Обычный абзац.</p>
  <p class="special">Особенный абзац.</p>
</body>
</html>

```

### Сочетание с идентификаторами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    h1#main-title {
      color: darkorange;
      text-transform: uppercase;
    }
  </style>
  <title>Сочетание с идентификаторами</title>
</head>
<body>
  <h1 id="main-title">Главный заголовок</h1>
  <h1>Обычный заголовок</h1>
</body>
</html>

```

### Сочетание с псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:hover {
      color: red;
      text-decoration: underline;
    }
  </style>
  <title>Сочетание с псевдоклассами</title>
</head>
<body>
  <a href="<https://example.com>">Наведи на меня</a>
</body>
</html>

```

## Заключение

В CSS селекторы по тегу являются основополагающим инструментом для стилизации HTML-элементов. Они позволяют применять стили ко всем элементам определённого типа на странице, обеспечивая единообразие и упрощая процесс верстки. Понимание того, как использовать селекторы по тегу и сочетать их с другими селекторами, помогает разработчикам создавать гибкие и хорошо структурированные стили для веб-страниц. Экспериментируйте с различными селекторами и находите оптимальные решения для ваших проектов.

Селектор по тегу – это важный инструмент в арсенале веб-разработчика, но для создания современных и интерактивных веб-сайтов необходимо владеть гораздо большим набором навыков и технологий. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=selektor-po-tegu-v-css-polnoe-rukovodstvo-s-primerami) вы получите все необходимые знания и практические навыки для успешной работы. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
