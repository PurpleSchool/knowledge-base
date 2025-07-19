---
metaTitle: Псевдокласс default в CSS. Стилизация элементов, используемых по умолчанию
metaDescription: Псевдокласс default в CSS. Стилизация элементов, используемых по умолчанию
author: Дмитрий Нечаев
title: Псевдокласс default в CSS. Полное руководство с примерами
preview: Псевдокласс default в CSS используется для стилизации элементов, которые являются выбором по умолчанию в группе аналогичных элементов, таких как кнопки отправки формы, радиокнопки или чекбоксы.
---

Псевдокласс `:default` в CSS используется для стилизации элементов, которые являются выбором по умолчанию в группе аналогичных элементов, таких как кнопки отправки формы, радиокнопки или чекбоксы. Это позволяет разработчикам выделять элементы, которые будут выбраны или активны по умолчанию при загрузке страницы. В этой статье мы подробно рассмотрим псевдокласс `:default`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:default`?

Псевдокласс `:default` применяется к элементам формы, которые являются выбором по умолчанию в группе аналогичных элементов. Это может быть полезно для выделения таких элементов визуально, чтобы пользователи могли легко их распознать.

### Пример базового использования `:default`

```css
element:default {
  /* Стили для элементов, используемых по умолчанию */
}

```

Пример использования псевдокласса `:default` для изменения стилей элементов, используемых по умолчанию:

```css
input:default {
  border-color: blue;
}

```

В этом примере элементы формы, которые являются выбором по умолчанию, будут иметь синюю границу.

Псевдокласс `:default` позволяет стилизовать элементы, которые выбраны по умолчанию в группе элементов управления формы (например, radio button или submit button). Для его понимания необходимо понимать, как работают формы, и как определяются элементы, выбранные по умолчанию, в HTML. Если вы хотите углубить свои знания в HTML и CSS и научиться создавать сложные формы, приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-default-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования псевдокласса `:default`

### Основные примеры

### Стилизация кнопок по умолчанию

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    button:default {
      border: 2px solid blue; /* Синяя граница для кнопок по умолчанию */
      background-color: #e0f7ff; /* Светло-голубой фон */
      color: blue; /* Синий цвет текста */
    }
  </style>
  <title>Стилизация кнопок по умолчанию</title>
</head>
<body>
  <form>
    <button type="submit">Отправить</button>
    <button type="reset">Сбросить</button>
  </form>
</body>
</html>

```

В этом примере кнопка отправки формы будет иметь синюю границу, светло-голубой фон и синий цвет текста, так как она является кнопкой по умолчанию.

### Стилизация радиокнопок по умолчанию

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="radio"]:default {
      outline: 2px solid blue; /* Синяя граница для радиокнопок по умолчанию */
    }
  </style>
  <title>Стилизация радиокнопок по умолчанию</title>
</head>
<body>
  <form>
    <label>
      <input type="radio" name="choice" value="1" checked> Вариант 1
    </label>
    <label>
      <input type="radio" name="choice" value="2"> Вариант 2
    </label>
  </form>
</body>
</html>

```

В этом примере радиокнопка, которая выбрана по умолчанию, будет иметь синюю границу.

### Сложные примеры

### Стилизация с использованием псевдоэлементов

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .form-field {
      position: relative;
      margin-bottom: 20px; /* Отступ снизу для каждого поля формы */
    }

    input[type="radio"]:default:before {
      content: "⭐"; /* Звездочка для обозначения выбора по умолчанию */
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      color: blue;
      font-size: 20px;
    }
  </style>
  <title>Стилизация с использованием псевдоэлементов</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label>
        <input type="radio" name="option" value="1" checked> Опция 1
      </label>
    </div>
    <div class="form-field">
      <label>
        <input type="radio" name="option" value="2"> Опция 2
      </label>
    </div>
  </form>
</body>
</html>

```

В этом примере к радиокнопке, выбранной по умолчанию, добавлена звездочка, используя псевдоэлемент `:before`.

### Комбинирование с другими псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:default:focus {
      outline: 2px solid blue; /* Синяя граница при фокусе */
      box-shadow: 0 0 5px blue; /* Тень синего цвета */
    }
  </style>
  <title>Комбинирование с другими псевдоклассами</title>
</head>
<body>
  <form>
    <label>
      <input type="checkbox" name="terms" checked> Я согласен с условиями
    </label>
  </form>
</body>
</html>

```

В этом примере чекбокс, выбранный по умолчанию, будет иметь синюю границу и тень при фокусе.

## Использование в реальных проектах

### Стилизация формы регистрации

Пример использования псевдокласса `:default` для стилизации полей в форме регистрации:

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
      background-color: #f9f9f9;
    }

    .form-field {
      margin-bottom: 15px; /* Отступ снизу для каждого поля формы */
    }

    .form-field label {
      display: block; /* Блочное отображение */
      margin-bottom: 5px; /* Отступ снизу */
    }

    .form-field input,
    .form-field textarea {
      width: 100%; /* Ширина 100% */
      padding: 8px; /* Внутренние отступы */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    input:default,
    textarea:default {
      border: 2px solid blue; /* Синяя граница для полей по умолчанию */
      background-color: #e0f7ff; /* Светло-голубой фон */
    }

    .submit-button {
      background-color: #007bff; /* Фон кнопки */
      color: white; /* Цвет текста */
      padding: 10px 20px; /* Внутренние отступы */
      border: none; /* Без границы */
      border-radius: 5px; /* Скругление углов */
      cursor: pointer; /* Курсор указателя */
      display: block; /* Блочное отображение */
      width: 100%; /* Ширина 100% */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button:hover {
      background-color: #0056b3; /* Изменение фона при наведении */
    }
  </style>
  <title>Стилизация формы регистрации</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="name">Имя:</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-field">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-field">
      <label for="password">Пароль:</label>
      <input type="password" id="password" name="password" required>
    </div>
    <div class="form-field">
      <label for="gender">Пол:</label>
      <select id="gender" name="gender">
        <option value="male">Мужской</option>
        <option value="female" selected>Женский</option>
      </select>
    </div>
    <button type="submit" class="submit-button">Регистрация</button>
  </form>
</body>
</html>

```

В этом примере поле

выбора пола будет выделено синим цветом, так как оно выбрано по умолчанию.

### Стилизация формы обратной связи

Пример использования псевдокласса `:default` для стилизации полей в форме обратной связи:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    form {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }

    .form-field {
      margin-bottom: 20px; /* Отступ снизу для каждого поля формы */
    }

    .form-field label {
      display: block; /* Блочное отображение */
      margin-bottom: 5px; /* Отступ снизу */
    }

    .form-field input,
    .form-field textarea {
      width: 100%; /* Ширина 100% */
      padding: 10px; /* Внутренние отступы */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    input:default,
    textarea:default {
      border: 2px solid blue; /* Синяя граница для полей по умолчанию */
      background-color: #e0f7ff; /* Светло-голубой фон */
    }

    .submit-button {
      background-color: #28a745; /* Фон кнопки */
      color: white; /* Цвет текста */
      padding: 10px 20px; /* Внутренние отступы */
      border: none; /* Без границы */
      border-radius: 5px; /* Скругление углов */
      cursor: pointer; /* Курсор указателя */
      display: block; /* Блочное отображение */
      width: 100%; /* Ширина 100% */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button:hover {
      background-color: #218838; /* Изменение фона при наведении */
    }
  </style>
  <title>Стилизация формы обратной связи</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="name">Имя:</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-field">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-field">
      <label for="topic">Тема:</label>
      <select id="topic" name="topic">
        <option value="feedback" selected>Обратная связь</option>
        <option value="support">Поддержка</option>
      </select>
    </div>
    <div class="form-field">
      <label for="message">Сообщение:</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit" class="submit-button">Отправить</button>
  </form>
</body>
</html>

```

В этом примере поле выбора темы будет выделено синим цветом, так как оно выбрано по умолчанию.

## Заключение

Псевдокласс `:default` в CSS предоставляет удобный способ для стилизации элементов формы, которые являются выбором по умолчанию в группе аналогичных элементов. Это помогает улучшить пользовательский интерфейс, предоставляя визуальные подсказки и делая форму более интуитивно понятной. Понимание различных способов использования псевдокласса `:default`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Использование `:default` может быть полезно для выделения наиболее важных действий в форме. Для того, чтобы хорошо понимать его возможности и грамотно применять, рекомендуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-default-v-CSS-Polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
