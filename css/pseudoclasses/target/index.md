---
metaTitle: Псевдокласс target в CSS. Управление стилем элемента, на который ссылается якорная ссылка
metaDescription: Псевдокласс target в CSS. Управление стилем элемента, на который ссылается якорная ссылка
author: Дмитрий Нечаев
title: Псевдокласс target в CSS. Полное руководство с примерами
preview: Псевдокласс target в CSS используется для стилизации элемента, на который ссылается якорная ссылка.
---

Псевдокласс `:target` в CSS используется для стилизации элемента, на который ссылается якорная ссылка. Это мощный инструмент, который помогает создавать интерактивные и динамичные веб-страницы. В этой статье мы подробно рассмотрим псевдокласс `:target`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:target`?

Псевдокласс `:target` применяется к элементу, на который ссылается якорная ссылка. Когда пользователь переходит по якорной ссылке, браузер прокручивает страницу к элементу с соответствующим идентификатором и применяет стили, заданные для `:target`.

Пример базового использования `:target`:

```css
selector:target {
  /* Стили для элемента, на который ссылается якорная ссылка */
}

```

Пример использования псевдокласса `:target` для изменения фона элемента:

```css
#section1:target {
  background-color: yellow;
}

```

В этом примере фон элемента с идентификатором `section1` изменится на жёлтый, когда он будет целью якорной ссылки.

Псевдокласс `:target` позволяет управлять стилем элемента, на который ссылается якорная ссылка, что может быть полезным для создания интерактивных веб-страниц и улучшения навигации. Но для эффективного использования этого псевдокласса необходимо понимать, как работают якорные ссылки, как применять различные свойства CSS и как учитывать особенности отображения в разных браузерах. Если вы хотите детальнее изучить CSS и научиться создавать сложные и красивые веб-страницы, — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=psevdoklass-target-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования псевдокласса `:target`

### Основные примеры

### Изменение фона при переходе по якорной ссылке

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    section {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 10px 0;
    }

    section:target {
      background-color: lightyellow; /* Изменение фона при переходе по якорной ссылке */
    }
  </style>
  <title>Изменение фона при переходе по якорной ссылке</title>
</head>
<body>
  <nav>
    <a href="#section1">Перейти к секции 1</a>
    <a href="#section2">Перейти к секции 2</a>
    <a href="#section3">Перейти к секции 3</a>
  </nav>

  <section id="section1">
    <h2>Секция 1</h2>
    <p>Содержание секции 1.</p>
  </section>

  <section id="section2">
    <h2>Секция 2</h2>
    <p>Содержание секции 2.</p>
  </section>

  <section id="section3">
    <h2>Секция 3</h2>
    <p>Содержание секции 3.</p>
  </section>
</body>
</html>

```

В этом примере фон секции изменится на светло-жёлтый, когда она станет целью якорной ссылки.

### Выделение текста при переходе по якорной ссылке

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:target {
      color: red; /* Изменение цвета текста при переходе по якорной ссылке */
      font-weight: bold; /* Жирный шрифт для выделения */
    }
  </style>
  <title>Выделение текста при переходе по якорной ссылке</title>
</head>
<body>
  <nav>
    <a href="#paragraph1">Перейти к абзацу 1</a>
    <a href="#paragraph2">Перейти к абзацу 2</a>
    <a href="#paragraph3">Перейти к абзацу 3</a>
  </nav>

  <p id="paragraph1">Абзац 1. Наведите на меня.</p>
  <p id="paragraph2">Абзац 2. Наведите на меня.</p>
  <p id="paragraph3">Абзац 3. Наведите на меня.</p>
</body>
</html>

```

В этом примере текст абзаца станет красным и жирным, когда он станет целью якорной ссылки.

### Сложные примеры

### Анимация при переходе по якорной ссылке

Псевдокласс `:target` можно использовать для создания анимаций при переходе по якорной ссылке.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 10px 0;
      transition: transform 0.3s ease; /* Плавный переход */
    }

    div:target {
      transform: scale(1.1); /* Увеличение размера при переходе по якорной ссылке */
    }
  </style>
  <title>Анимация при переходе по якорной ссылке</title>
</head>
<body>
  <nav>
    <a href="#box1">Перейти к блоку 1</a>
    <a href="#box2">Перейти к блоку 2</a>
    <a href="#box3">Перейти к блоку 3</a>
  </nav>

  <div id="box1">Блок 1. Наведите на меня.</div>
  <div id="box2">Блок 2. Наведите на меня.</div>
  <div id="box3">Блок 3. Наведите на меня.</div>
</body>
</html>

```

В этом примере блок увеличивается в размере, когда он становится целью якорной ссылки.

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:target` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

### Комбинирование с псевдоклассом `:hover`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .highlight:target {
      background-color: lightblue;
    }

    .highlight:hover {
      background-color: lightgreen;
    }
  </style>
  <title>Комбинирование с псевдоклассом :hover</title>
</head>
<body>
  <nav>
    <a href="#item1">Перейти к элементу 1</a>
    <a href="#item2">Перейти к элементу 2</a>
    <a href="#item3">Перейти к элементу 3</a>
  </nav>

  <div id="item1" class="highlight">Элемент 1</div>
  <div id="item2" class="highlight">Элемент 2</div>
  <div id="item3" class="highlight">Элемент 3</div>
</body>
</html>

```

В этом примере фон элемента изменится на светло-голубой при переходе по якорной ссылке и на светло-зелёный при наведении.

### Комбинирование с псевдоэлементами `:before` и `:after`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .section:target::before {
      content: "→ ";
      color: red;
      font-weight: bold;
    }

    .section {
      padding: 10px;
      border: 1px solid #ccc;
      margin: 10px 0;
    }
  </style>
  <title>Комбинирование с псевдоэлементами</title>
</head>
<body>
  <nav>
    <a href="#section1">Перейти к секции 1</a>
    <a href="#section2">Перейти к секции 2</a>
    <a href="#section3">Перейти к секции 3</a>
  </nav>

  <div id="section1" class="section">Секция 1</div>
  <div id="section2" class="section">Секция 2</div>
  <div id="section3" class="section">Секция 3</div>
</body>
</html>

```

В этом примере псевдоэлемент `::before` добавляет стрелку перед содержимым целевой секции и изменяет её цвет на красный.

## Примеры использования в реальных проектах

### Таблица содержимого

Использование псевдок

ласса `:target` для стилизации элементов таблицы содержимого:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .toc a {
      display: block;
      padding: 5px;
      text-decoration: none;
      color: #007bff;
    }

    .toc a:target {
      background-color: lightgray;
      font-weight: bold;
    }

    .section {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 10px 0;
    }
  </style>
  <title>Таблица содержимого</title>
</head>
<body>
  <nav class="toc">
    <a href="#intro">Введение</a>
    <a href="#chapter1">Глава 1</a>
    <a href="#chapter2">Глава 2</a>
    <a href="#conclusion">Заключение</a>
  </nav>

  <div id="intro" class="section">
    <h2>Введение</h2>
    <p>Текст введения.</p>
  </div>

  <div id="chapter1" class="section">
    <h2>Глава 1</h2>
    <p>Текст первой главы.</p>
  </div>

  <div id="chapter2" class="section">
    <h2>Глава 2</h2>
    <p>Текст второй главы.</p>
  </div>

  <div id="conclusion" class="section">
    <h2>Заключение</h2>
    <p>Текст заключения.</p>
  </div>
</body>
</html>

```

### Стилизация формы обратной связи

Использование псевдокласса `:target` для стилизации элементов формы обратной связи:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    form {
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
    }

    input, textarea {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 3px;
    }

    .success-message {
      display: none;
      padding: 10px;
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      margin-top: 10px;
    }

    .success-message:target {
      display: block;
    }
  </style>
  <title>Форма обратной связи</title>
</head>
<body>
  <form action="#success" method="post">
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="5" required></textarea>

    <button type="submit">Отправить</button>
  </form>

  <div id="success" class="success-message">
    Ваше сообщение успешно отправлено!
  </div>
</body>
</html>

```

В этом примере сообщение об успешной отправке формы отображается только тогда, когда пользователь переходит по якорной ссылке, ссылающейся на элемент с id `success`.

## Заключение

Псевдокласс `:target` в CSS предоставляет мощный способ для стилизации элементов, на которые ссылаются якорные ссылки. Это улучшает интерактивность и навигацию на веб-страницах, делая их более удобными для пользователей. Понимание различных способов использования псевдокласса `:target`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Управление стилем элемента, на который ссылается якорная ссылка, с помощью псевдокласса `:target` - это полезный прием для веб-разработчика, но для создания современных и интерактивных веб-сайтов необходимо владеть гораздо большим набором навыков и технологий. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=psevdoklass-target-v-css-polnoe-rukovodstvo-s-primerami) вы получите все необходимые знания и практические навыки для успешной работы. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
