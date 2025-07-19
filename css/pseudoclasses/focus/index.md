---
metaTitle: Псевдокласс focus в CSS. Меняем внешний вид элемента в фокусе
metaDescription: Псевдокласс focus в CSS. Меняем внешний вид элемента в фокусе
author: Дмитрий Нечаев
title: Псевдокласс focus в CSS. Полное руководство с примерами
preview: Псевдокласс focus в CSS используется для изменения стилей элементов, которые находятся в фокусе.
---

Псевдокласс `:focus` в CSS используется для изменения стилей элементов, которые находятся в фокусе. Это важно для улучшения взаимодействия пользователя с веб-страницей, особенно при навигации с помощью клавиатуры. В этой статье мы подробно рассмотрим псевдокласс `:focus`, его применение и приведем примеры использования для различных ситуаций.

## Что такое псевдокласс `:focus`?

Псевдокласс `:focus` применяется к элементам, когда они находятся в фокусе, то есть когда на них установлено внимание пользователя. Это может происходить при клике на элемент или при переходе к нему с помощью клавиши Tab на клавиатуре. Стили, заданные с помощью этого псевдокласса, активируются, когда элемент получает фокус.

Пример базового использования `:focus`:

```css
selector:focus {
  /* Стили для элемента в фокусе */
}

```

Пример использования псевдокласса `:focus` для поля ввода:

```css
input:focus {
  border-color: blue;
}

```

В этом примере цвет границы поля ввода изменится на синий, когда оно получит фокус.

Для работы с псевдоклассом `:focus` необходимо понимание HTML-элементов, которые могут получать фокус, а также принципов навигации по веб-странице с помощью клавиатуры. Знание HTML является базовым для эффективного использования `:focus` в CSS. Если вы хотите глубже изучить HTML и CSS и создавать интерактивные и доступные веб-интерфейсы — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-focus-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования псевдокласса `:focus`

### Основные примеры

### Изменение цвета границы при фокусе

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:focus {
      border-color: blue; /* Изменение цвета границы при фокусе */
    }
  </style>
  <title>Изменение цвета границы при фокусе</title>
</head>
<body>
  <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
</body>
</html>

```

### Изменение фона при фокусе

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    textarea:focus {
      background-color: lightyellow; /* Изменение фона при фокусе */
    }
  </style>
  <title>Изменение фона при фокусе</title>
</head>
<body>
  <textarea rows="4" cols="50" placeholder="Нажмите Tab, чтобы перейти к этому полю"></textarea>
</body>
</html>

```

### Изменение цвета текста при фокусе

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    button:focus {
      color: red; /* Изменение цвета текста при фокусе */
    }
  </style>
  <title>Изменение цвета текста при фокусе</title>
</head>
<body>
  <button>Нажмите Tab, чтобы перейти к этой кнопке</button>
</body>
</html>

```

### Сложные примеры

### Анимация при фокусе

Псевдокласс `:focus` можно использовать для создания анимаций при фокусе.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .box {
      width: 100px;
      height: 100px;
      background-color: blue;
      transition: transform 0.3s ease; /* Плавный переход */
    }

    .box:focus {
      transform: scale(1.2); /* Увеличение размера при фокусе */
    }
  </style>
  <title>Анимация при фокусе</title>
</head>
<body>
  <div class="box" tabindex="0"></div> <!-- tabindex="0" позволяет элементу получать фокус -->
</body>
</html>

```

### Изменение стилей кнопки при фокусе

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .button {
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .button:focus {
      background-color: #0056b3; /* Изменение фона кнопки при фокусе */
    }
  </style>
  <title>Изменение стилей кнопки при фокусе</title>
</head>
<body>
  <button class="button">Нажмите Tab, чтобы перейти к этой кнопке</button>
</body>
</html>

```

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:focus` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

### Комбинирование с псевдоклассом `:hover`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .link {
      color: #007bff;
      text-decoration: none;
      padding: 5px 10px;
      display: inline-block;
      transition: background-color 0.3s, color 0.3s;
    }

    .link:hover,
    .link:focus {
      background-color: #e2e6ea;
      color: #0056b3;
    }
  </style>
  <title>Комбинирование с :hover и :focus</title>
</head>
<body>
  <a href="#" class="link">Наведите или нажмите Tab, чтобы перейти к ссылке</a>
</body>
</html>

```

### Комбинирование с псевдоэлементами `:before` и `:after`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .button-effect {
      position: relative;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
      overflow: hidden;
      transition: background-color 0.3s;
    }

    .button-effect:before,
    .button-effect:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: rgba(255, 255, 255, 0.2);
      transition: transform 0.3s;
    }

    .button-effect:before {
      transform: scaleX(0);
      transform-origin: left;
    }

    .button-effect:after {
      transform: scaleX(0);
      transform-origin: right;
    }

    .button-effect:hover:before,
    .button-effect:hover:after,
    .button-effect:focus:before,
    .button-effect:focus:after {
      transform: scaleX(1);
    }

    .button-effect:focus {
      background-color: #0056b3;
    }
  </style>
  <title>Комбинирование с псевдоэлементами</title>
</head>
<body>
  <button class="button-effect">Нажмите Tab или наведите курсор на кнопку</button>
</body>
</html>

```

## Примеры использования в реальных проектах

### Стилизация форм

Использование псевдокласса `:focus` для стилизации полей ввода в форме:

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
      transition: border-color 0.3s;
    }

    input:focus, textarea:focus {
      border-color: #007bff; /* Изменение цвета границы при фокусе */
    }
  </style>
  <title>Стилизация форм</title>
</head>
<body>
  <form>
    <label for

="name">Имя:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="5" required></textarea>

    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

### Стилизация навигационного меню

Использование псевдокласса `:focus` для стилизации ссылок в навигационном меню:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    nav a {
      color: #007bff;
      text-decoration: none;
      padding: 10px;
      display: inline-block;
      transition: background-color 0.3s, color 0.3s;
    }

    nav a:hover,
    nav a:focus {
      background-color: #e2e6ea;
      color: #0056b3;
    }
  </style>
  <title>Навигационное меню</title>
</head>
<body>
  <nav>
    <a href="#">Главная</a>
    <a href="#">О нас</a>
    <a href="#">Контакты</a>
  </nav>
</body>
</html>

```

## Заключение

Псевдокласс `:focus` в CSS предоставляет мощный способ для изменения стилей элементов в момент, когда они находятся в фокусе. Это улучшает взаимодействие пользователя с веб-страницей, делая её более доступной и удобной для навигации. Понимание различных способов использования псевдокласса `:focus`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Для более полного понимания возможностей CSS и HTML и создания качественных веб-сайтов, рекомендуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-focus-v-CSS-Polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
