---
metaTitle: Псевдоклассы invalid и valid в CSS. Валидируем форму прямо в браузере
metaDescription: Псевдоклассы invalid и valid в CSS. Валидируем форму прямо в браузере
author: Дмитрий Нечаев
title: Псевдоклассы invalid и valid в CSS. Полное руководство с примерами
preview: Псевдоклассы invalid и valid в CSS используются для стилизации полей формы на основе их состояния валидации.
---

Псевдоклассы `:invalid` и `:valid` в CSS используются для стилизации полей формы на основе их состояния валидации. Эти псевдоклассы позволяют показывать пользователям, правильно ли они заполнили форму, без использования JavaScript. Валидация происходит автоматически, основываясь на встроенных HTML-атрибутах, таких как `required`, `pattern`, `type` и другие. В этой статье мы подробно рассмотрим псевдоклассы `:invalid` и `:valid`, их применение и приведём примеры использования для различных ситуаций.

## Что такое псевдоклассы `:invalid` и `:valid`?

Псевдокласс `:invalid` применяется к полям формы, которые не прошли валидацию. Это означает, что значение поля не соответствует установленным требованиям.

Псевдокласс `:valid` применяется к полям формы, которые прошли валидацию. Это означает, что значение поля соответствует установленным требованиям.

Работа с псевдоклассами `:invalid` и `:valid` тесно связана с HTML-формами и их валидацией. Чтобы эффективно стилизовать формы в зависимости от их состояния, необходимо понимать, как работают атрибуты валидации в HTML5 и как CSS взаимодействует с этими атрибутами. Если вы хотите детально изучить создание и стилизацию веб-форм, а также научиться валидировать их прямо в браузере — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklassy-invalid-i-valid-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример базового использования `:invalid` и `:valid`

```css
input:invalid {
  /* Стили для полей формы, которые не прошли валидацию */
}

input:valid {
  /* Стили для полей формы, которые прошли валидацию */
}

```

Пример использования псевдоклассов `:invalid` и `:valid` для изменения стилей полей ввода:

```css
input:invalid {
  border-color: red;
}

input:valid {
  border-color: green;
}

```

В этом примере поля ввода, которые не прошли валидацию, будут иметь красную границу, а поля ввода, которые прошли валидацию, будут иметь зелёную границу.

## Примеры использования псевдоклассов `:invalid` и `:valid`

### Основные примеры

### Стилизация текстовых полей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:invalid {
      border: 2px solid red; /* Красная граница для полей, не прошедших валидацию */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input:valid {
      border: 2px solid green; /* Зелёная граница для полей, прошедших валидацию */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }
  </style>
  <title>Стилизация текстовых полей</title>
</head>
<body>
  <form>
    <label for="name">Имя (обязательное):</label>
    <input type="text" id="name" name="name" required>
    <br>
    <label for="email">Email (обязательный и валидный формат):</label>
    <input type="email" id="email" name="email" required>
  </form>
</body>
</html>

```

В этом примере поля ввода будут иметь красную границу и светло-красный фон, если они не прошли валидацию, и зелёную границу и светло-зелёный фон, если они прошли валидацию.

### Стилизация полей с числовыми значениями

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:invalid {
      border: 2px solid red; /* Красная граница для полей, не прошедших валидацию */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input:valid {
      border: 2px solid green; /* Зелёная граница для полей, прошедших валидацию */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }
  </style>
  <title>Стилизация полей с числовыми значениями</title>
</head>
<body>
  <form>
    <label for="age">Возраст (от 18 до 65):</label>
    <input type="number" id="age" name="age" min="18" max="65" required>
  </form>
</body>
</html>

```

В этом примере поле ввода для возраста будет стилизовано аналогичным образом в зависимости от того, прошло ли оно валидацию.

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

    input:invalid {
      border: 2px solid red; /* Красная граница для полей, не прошедших валидацию */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input:valid {
      border: 2px solid green; /* Зелёная граница для полей, прошедших валидацию */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input:invalid:after {
      content: "✖"; /* Красный крестик для обозначения ошибки */
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: red;
      font-size: 20px;
    }

    input:valid:after {
      content: "✔"; /* Зелёная галочка для обозначения успешной валидации */
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: green;
      font-size: 20px;
    }
  </style>
  <title>Стилизация с использованием псевдоэлементов</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="username">Имя пользователя (только буквы и цифры):</label>
      <input type="text" id="username" name="username" pattern="[A-Za-z0-9]+" required>
    </div>
    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

В этом примере к полям ввода добавлены красный крестик или зелёная галочка, используя псевдоэлементы `:after`, в зависимости от состояния валидации.

### Комбинирование с другими псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:invalid:focus {
      border-color: darkred; /* Более тёмная красная граница при фокусе */
      box-shadow: 0 0 5px red; /* Тень красного цвета */
    }

    input:valid:focus {
      border-color: darkgreen; /* Более тёмная зелёная граница при фокусе */
      box-shadow: 0 0 5px green; /* Тень зелёного цвета */
    }
  </style>
  <title>Комбинирование с другими псевдоклассами</title>
</head>
<body>
  <form>
    <label for="email">Email (обязательный и валидный формат):</label>
    <input type="email" id="email" name="email" required>
  </form>
</body>
</html>

```

В этом примере граница и тень поля ввода изменяются при фокусе, в зависимости от состояния валидации.

## Использование в реальных проектах

### Стилизация формы регистрации

Пример использования псевдоклассов `:invalid` и `:valid` для стилизации полей в форме регистрации:

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

    input:invalid,
    textarea:invalid {
      border: 2px solid red; /* Красная граница для полей, не прошедших валидацию */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input:valid,
    textarea:valid {
      border: 2px solid green; /* Зелёная граница для полей, прошедших валидацию */
      background-color: #e0ffe0; /* Светло-зелёный фон */
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
      <label for="bio">О себе:</label>
      <textarea id="bio" name="bio" required></textarea>
    </div>
    <button type="submit" class="submit-button">Регистрация</button>
  </form>
</body>
</html>

```

В этом примере все обязательные поля ввода и текстовая область в форме регистрации будут стилизованы в зависимости от их состояния валидации.

### Стилизация формы обратной связи

Пример использования псевдоклассов `:invalid` и `:valid` для стилизации полей в форме обратной связи:

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

    input:invalid,
    textarea:invalid {
      border: 2px solid red; /* Красная граница для полей, не прошедших валидацию */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input:valid,
    textarea:valid {
      border: 2px solid green; /* Зелёная граница для полей, прошедших валидацию */
      background-color: #e0ffe0; /* Светло-зелёный фон */
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
      <label for="message">Сообщение:</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit" class="submit-button">Отправить</button>
  </form>
</body>
</html>

```

В этом примере все обязательные поля ввода и текстовая область в форме обратной связи будут стилизованы в зависимости от их состояния валидации.

## Заключение

Псевдоклассы `:invalid` и `:valid` в CSS предоставляют мощный способ для стилизации полей формы на основе их состояния валидации, улучшая взаимодействие пользователя с веб-страницей и предоставляя визуальные подсказки о правильности введённых данных. Понимание различных способов использования псевдоклассов `:invalid` и `:valid`, а также их комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Чтобы использовать эти инструменты максимально эффективно, необходимы знания HTML и CSS. Курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklassy-invalid-i-valid-v-CSS-Polnoe-rukovodstvo-s-primerami) предоставит вам все необходимые навыки для создания современных веб-форм. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
