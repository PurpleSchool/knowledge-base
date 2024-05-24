---
metaTitle: Псевдокласс focus-visible в CSS. Выделяем элементы в фокусе только тогда, когда это действительно необходимо
metaDescription: Псевдокласс focus-visible в CSS. Выделяем элементы в фокусе только тогда, когда это действительно необходимо
author: Дмитрий Нечаев
title: Псевдокласс focus-visible в CSS. Полное руководство с примерами
preview: Псевдокласс focus-visible в CSS используется для выделения элементов, которые находятся в фокусе, только когда это действительно необходимо, например, при навигации с помощью клавиатуры.
---

Псевдокласс `:focus-visible` в CSS используется для выделения элементов, которые находятся в фокусе, только когда это действительно необходимо, например, при навигации с помощью клавиатуры. Этот псевдокласс помогает улучшить пользовательский опыт, делая веб-страницы более доступными и удобными. В этой статье мы подробно рассмотрим псевдокласс `:focus-visible`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:focus-visible`?

Псевдокласс `:focus-visible` применяется к элементам, которые находятся в фокусе и требуют визуального выделения. Это происходит, когда пользователь взаимодействует с элементом с помощью клавиатуры или другого устройства ввода, которое не предоставляет визуальную обратную связь. В отличие от псевдокласса `:focus`, который применяется при любом способе получения фокуса (например, мышью или клавиатурой), `:focus-visible` активируется только в случаях, когда необходимо явно указать на элемент в фокусе.

Пример базового использования `:focus-visible`:

```css
selector:focus-visible {
  /* Стили для элемента в фокусе, когда это необходимо */
}

```

Пример использования псевдокласса `:focus-visible` для поля ввода:

```css
input:focus-visible {
  border-color: blue;
}

```

В этом примере цвет границы поля ввода изменится на синий, когда оно получит фокус через клавиатуру.

## Примеры использования псевдокласса `:focus-visible`

### Основные примеры

### Изменение цвета границы при фокусе через клавиатуру

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:focus-visible {
      border-color: blue; /* Изменение цвета границы при фокусе через клавиатуру */
    }
  </style>
  <title>Изменение цвета границы при фокусе через клавиатуру</title>
</head>
<body>
  <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
</body>
</html>

```

### Изменение фона при фокусе через клавиатуру

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    textarea:focus-visible {
      background-color: lightyellow; /* Изменение фона при фокусе через клавиатуру */
    }
  </style>
  <title>Изменение фона при фокусе через клавиатуру</title>
</head>
<body>
  <textarea rows="4" cols="50" placeholder="Нажмите Tab, чтобы перейти к этому полю"></textarea>
</body>
</html>

```

### Изменение цвета текста при фокусе через клавиатуру

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    button:focus-visible {
      color: red; /* Изменение цвета текста при фокусе через клавиатуру */
    }
  </style>
  <title>Изменение цвета текста при фокусе через клавиатуру</title>
</head>
<body>
  <button>Нажмите Tab, чтобы перейти к этой кнопке</button>
</body>
</html>

```

### Сложные примеры

### Анимация при фокусе через клавиатуру

Псевдокласс `:focus-visible` можно использовать для создания анимаций при фокусе через клавиатуру.

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

    .box:focus-visible {
      transform: scale(1.2); /* Увеличение размера при фокусе через клавиатуру */
    }
  </style>
  <title>Анимация при фокусе через клавиатуру</title>
</head>
<body>
  <div class="box" tabindex="0"></div> <!-- tabindex="0" позволяет элементу получать фокус -->
</body>
</html>

```

### Изменение стилей кнопки при фокусе через клавиатуру

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

    .button:focus-visible {
      background-color: #0056b3; /* Изменение фона кнопки при фокусе через клавиатуру */
    }
  </style>
  <title>Изменение стилей кнопки при фокусе через клавиатуру</title>
</head>
<body>
  <button class="button">Нажмите Tab, чтобы перейти к этой кнопке</button>
</body>
</html>

```

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:focus-visible` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

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
    .link:focus-visible {
      background-color: #e2e6ea;
      color: #0056b3;
    }
  </style>
  <title>Комбинирование с :hover и :focus-visible</title>
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
    .button-effect:focus-visible:before,
    .button-effect:focus-visible:after {
      transform: scaleX(1);
    }

    .button-effect:focus-visible {
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

Использование псевдокласса `:focus-visible` для стилизации полей ввода в форме:

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

    input:focus-visible, textarea:focus-visible {
      border-color: #007bff; /* Изменение цвета границы при фокусе через клавиатуру */
    }
  </style>
  <title>Стилизация форм</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
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

Использование псевдокласса `:focus-visible` для стилизации ссылок в навигационном меню:

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
    nav a:focus-visible {
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

Псевдокласс `:focus-visible` в CSS предоставляет мощный способ для изменения стилей элементов, которые находятся в фокусе, только когда это действительно необходимо. Это улучшает пользовательский опыт, делая веб-страницы более доступными и удобными для навигации. Понимание различных способов использования псевдокласса `:focus-visible`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.