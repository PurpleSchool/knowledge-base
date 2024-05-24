---
metaTitle: Псевдокласс optional в CSSю Стилизация необязательных полей формы
metaDescription: Псевдокласс optional в CSSю Стилизация необязательных полей формы
author: Дмитрий Нечаев
title: Псевдокласс optional в CSS. Полное руководство с примерами
preview: Псевдокласс optional в CSS используется для стилизации полей формы, которые не являются обязательными для заполнения.
---

Псевдокласс `:optional` в CSS используется для стилизации полей формы, которые не являются обязательными для заполнения. Эти поля не имеют атрибута `required`, что позволяет пользователю отправить форму, даже если они остаются незаполненными. Использование `:optional` помогает улучшить пользовательский интерфейс, чётко показывая, какие поля можно пропустить при заполнении формы. В этой статье мы подробно рассмотрим псевдокласс `:optional`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:optional`?

Псевдокласс `:optional` применяется к полям формы, которые не имеют атрибута `required`. Эти поля не обязательно заполнять перед отправкой формы.

### Пример базового использования `:optional`

```css
input:optional {
  /* Стили для необязательных полей формы */
}

```

Пример использования псевдокласса `:optional` для изменения стилей необязательных полей ввода:

```css
input:optional {
  border-color: green;
}

```

В этом примере необязательные поля ввода будут иметь зелёную границу.

## Примеры использования псевдокласса `:optional`

### Основные примеры

### Стилизация необязательных текстовых полей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:optional {
      border: 2px solid green; /* Зелёная граница для необязательных полей */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }
  </style>
  <title>Стилизация необязательных текстовых полей</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name">
    <br>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </form>
</body>
</html>

```

В этом примере необязательное поле ввода для имени будет иметь зелёную границу и светло-зелёный фон.

### Стилизация необязательных текстовых областей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    textarea:optional {
      border: 2px solid green; /* Зелёная граница для необязательных текстовых областей */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }
  </style>
  <title>Стилизация необязательных текстовых областей</title>
</head>
<body>
  <form>
    <label for="comments">Комментарии:</label>
    <textarea id="comments" name="comments"></textarea>
    <br>
    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

В этом примере необязательная текстовая область для комментариев будет иметь зелёную границу и светло-зелёный фон.

### Сложные примеры

### Стилизация необязательных полей с использованием псевдоэлементов

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

    input:optional,
    textarea:optional {
      border: 2px solid green; /* Зелёная граница для необязательных полей */
      background-color: #e0ffe0; /* Светло-зелёный фон */
      padding-right: 30px; /* Внутренний отступ справа для иконки */
    }

    input:optional:before,
    textarea:optional:before {
      content: "необязательно"; /* Текст для обозначения необязательного поля */
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: green;
      font-size: 12px;
    }
  </style>
  <title>Стилизация необязательных полей с использованием псевдоэлементов</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="phone">Телефон:</label>
      <input type="tel" id="phone" name="phone">
    </div>
    <div class="form-field">
      <label for="address">Адрес:</label>
      <textarea id="address" name="address"></textarea>
    </div>
    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

В этом примере к необязательным полям добавлен текст "необязательно", используя псевдоэлемент `:before`.

### Комбинирование с другими псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:optional:focus,
    textarea:optional:focus {
      border-color: darkgreen; /* Более тёмная зелёная граница при фокусе */
      box-shadow: 0 0 5px green; /* Тень зелёного цвета */
    }
  </style>
  <title>Комбинирование с другими псевдоклассами</title>
</head>
<body>
  <form>
    <label for="nickname">Псевдоним:</label>
    <input type="text" id="nickname" name="nickname">
  </form>
</body>
</html>

```

В этом примере граница и тень необязательного поля ввода изменяются при фокусе, привлекая больше внимания к активному полю.

## Использование в реальных проектах

### Стилизация формы регистрации

Пример использования псевдокласса `:optional` для стилизации необязательных полей в форме регистрации:

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

    input:optional,
    textarea:optional {
      border: 2px solid green; /* Зелёная граница для необязательных полей */
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
      <input type="text" id="name" name="name">
    </div>
    <div class="form-field">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-field">
      <label for="phone">Телефон:</label>
      <input type="tel" id="phone" name="phone">
    </div>
    <

div class="form-field">
      <label for="bio">О себе:</label>
      <textarea id="bio" name="bio"></textarea>
    </div>
    <button type="submit" class="submit-button">Регистрация</button>
  </form>
</body>
</html>

```

В этом примере все необязательные поля ввода и текстовая область в форме регистрации будут стилизованы с зелёной границей и светло-зелёным фоном.

### Стилизация формы обратной связи

Пример использования псевдокласса `:optional` для стилизации необязательных полей в форме обратной связи:

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

    input:optional,
    textarea:optional {
      border: 2px solid green; /* Зелёная граница для необязательных полей */
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
      <input type="text" id="name" name="name">
    </div>
    <div class="form-field">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-field">
      <label for="message">Сообщение:</label>
      <textarea id="message" name="message" rows="5"></textarea>
    </div>
    <button type="submit" class="submit-button">Отправить</button>
  </form>
</body>
</html>

```

В этом примере все необязательные поля ввода и текстовая область в форме обратной связи будут стилизованы с зелёной границей и светло-зелёным фоном.

## Заключение

Псевдокласс `:optional` в CSS предоставляет удобный способ для стилизации необязательных полей формы, улучшая пользовательский интерфейс и обеспечивая визуальные подсказки о том, какие поля можно пропустить при заполнении формы. Понимание различных способов использования псевдокласса `:optional`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более интуитивные и удобные формы. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.