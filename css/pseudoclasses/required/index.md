---
metaTitle: Псевдокласс required в CSS. Стилизация обязательных полей формы
metaDescription: Псевдокласс required в CSS. Стилизация обязательных полей формы
author: Дмитрий Нечаев
title: Псевдокласс required в CSS. Полное руководство с примерами
preview: Псевдокласс required в CSS используется для стилизации обязательных полей формы.
---

Псевдокласс `:required` в CSS используется для стилизации обязательных полей формы. Эти поля имеют атрибут `required` и требуют заполнения перед отправкой формы. С помощью этого псевдокласса можно легко улучшить пользовательский интерфейс, привлекая внимание к полям, которые необходимо заполнить. В этой статье мы подробно рассмотрим псевдокласс `:required`, его применение и приведем примеры использования для различных ситуаций.

## Что такое псевдокласс `:required`?

Псевдокласс `:required` применяется к полям формы, которые имеют атрибут `required`. Эти поля обязательны для заполнения пользователем перед отправкой формы.

### Пример базового использования `:required`

```css
input:required {
  /* Стили для обязательных полей формы */
}

```

Пример использования псевдокласса `:required` для изменения стилей обязательных полей ввода:

```css
input:required {
  border-color: red;
}

```

В этом примере обязательные поля ввода будут иметь красную границу.

## Примеры использования псевдокласса `:required`

### Основные примеры

### Стилизация обязательных текстовых полей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:required {
      border: 2px solid red; /* Красная граница для обязательных полей */
      background-color: #ffe0e0; /* Светло-красный фон */
    }
  </style>
  <title>Стилизация обязательных текстовых полей</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" required>
    <br>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email">
  </form>
</body>
</html>

```

В этом примере обязательное поле ввода для имени будет иметь красную границу и светло-красный фон.

### Стилизация обязательных текстовых областей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    textarea:required {
      border: 2px solid red; /* Красная граница для обязательных текстовых областей */
      background-color: #ffe0e0; /* Светло-красный фон */
    }
  </style>
  <title>Стилизация обязательных текстовых областей</title>
</head>
<body>
  <form>
    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" required></textarea>
    <br>
    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

В этом примере обязательная текстовая область для сообщения будет иметь красную границу и светло-красный фон.

### Сложные примеры

### Стилизация обязательных полей с использованием псевдоэлементов

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

    input:required,
    textarea:required {
      border: 2px solid red; /* Красная граница для обязательных полей */
      background-color: #ffe0e0; /* Светло-красный фон */
      padding-right: 30px; /* Внутренний отступ справа для иконки */
    }

    input:required:after,
    textarea:required:after {
      content: "*"; /* Звездочка для обозначения обязательного поля */
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: red;
      font-size: 20px;
    }
  </style>
  <title>Стилизация обязательных полей с использованием псевдоэлементов</title>
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
      <textarea id="message" name="message" required></textarea>
    </div>
    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

В этом примере к обязательным полям добавлена красная звездочка, используя псевдоэлемент `:after`.

### Комбинирование с другими псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:required:focus,
    textarea:required:focus {
      border-color: darkred; /* Более тёмная красная граница при фокусе */
      box-shadow: 0 0 5px red; /* Тень красного цвета */
    }
  </style>
  <title>Комбинирование с другими псевдоклассами</title>
</head>
<body>
  <form>
    <label for="age">Возраст:</label>
    <input type="number" id="age" name="age" required>
  </form>
</body>
</html>

```

В этом примере граница и тень обязательного поля ввода изменяются при фокусе, привлекая больше внимания к активному полю.

## Использование в реальных проектах

### Стилизация формы регистрации

Пример использования псевдокласса `:required` для стилизации обязательных полей в форме регистрации:

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

    input:required,
    textarea:required {
      border: 2px solid red; /* Красная граница для обязательных полей */
      background-color: #ffe0e0; /* Светло-красный фон */
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
      <label for

="bio">О себе:</label>
      <textarea id="bio" name="bio" required></textarea>
    </div>
    <button type="submit" class="submit-button">Регистрация</button>
  </form>
</body>
</html>

```

В этом примере все обязательные поля ввода и текстовая область в форме регистрации будут стилизованы с красной границей и светло-красным фоном.

### Стилизация формы обратной связи

Пример использования псевдокласса `:required` для стилизации обязательных полей в форме обратной связи:

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

    input:required,
    textarea:required {
      border: 2px solid red; /* Красная граница для обязательных полей */
      background-color: #ffe0e0; /* Светло-красный фон */
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

В этом примере все обязательные поля ввода и текстовая область в форме обратной связи будут стилизованы с красной границей и светло-красным фоном.

## Заключение

Псевдокласс `:required` в CSS предоставляет мощный способ для стилизации обязательных полей формы, улучшая пользовательский интерфейс и обеспечивая визуальные подсказки о необходимости заполнения этих полей. Понимание различных способов использования псевдокласса `:required`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более интуитивные и удобные формы. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.