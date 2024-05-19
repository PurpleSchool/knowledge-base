---
metaTitle: Псевдоэлемент placeholder в CSS. Стилизация плейсхолдеров в полях ввода
metaDescription: Псевдоэлемент placeholder в CSS. Стилизация плейсхолдеров в полях ввода
author: Дмитрий Нечаев
title: Псевдоэлемент placeholder в CSS. Полное руководство с примерами
preview: Псевдоэлемент placeholder в CSS позволяет стилизовать этот текст, чтобы улучшить внешний вид и повысить удобство использования форм.
---

Плейсхолдеры в полях ввода (`<input>`, `<textarea>`) используются для отображения временного текста, который исчезает, когда пользователь начинает вводить данные. Псевдоэлемент `::placeholder` в CSS позволяет стилизовать этот текст, чтобы улучшить внешний вид и повысить удобство использования форм. В этой статье мы подробно рассмотрим псевдоэлемент `::placeholder`, его применение и приведём примеры использования для различных ситуаций.

## Основы использования псевдоэлемента `::placeholder`

Псевдоэлемент `::placeholder` применяется к тексту плейсхолдера внутри элементов `<input>` и `<textarea>`. Он позволяет изменить цвет, шрифт, размер шрифта и другие свойства текста плейсхолдера.

### Пример базового использования псевдоэлемента `::placeholder`

```css
input::placeholder {
  color: gray;
  font-style: italic;
}

```

```html
<input type="text" placeholder="Введите ваше имя">

```

В этом примере текст плейсхолдера будет серым и курсивным.

## Поддержка браузерами

Поддержка псевдоэлемента `::placeholder` широко распространена в современных браузерах, но в некоторых случаях могут потребоваться вендорные префиксы для обеспечения кроссбраузерной совместимости.

### Пример использования вендорных префиксов

```css
input::placeholder {
  color: gray;
}

input:-ms-input-placeholder { /* Для Internet Explorer 10-11 */
  color: gray;
}

input::-ms-input-placeholder { /* Для Microsoft Edge */
  color: gray;
}

input::-webkit-input-placeholder { /* Для WebKit-браузеров (Chrome, Safari) */
  color: gray;
}

input::-moz-placeholder { /* Для Firefox 4-18 */
  color: gray;
}

input:-moz-placeholder { /* Для Firefox 19+ */
  color: gray;
}

```

## Примеры использования псевдоэлемента `::placeholder`

### Стилизация плейсхолдеров в текстовых полях

Пример:

```css
input[type="text"]::placeholder {
  color: lightgray;
  font-style: italic;
}

```

```html
<input type="text" placeholder="Введите ваш текст">

```

В этом примере плейсхолдер в текстовом поле будет светло-серым и курсивным.

### Стилизация плейсхолдеров в текстовых областях

Пример:

```css
textarea::placeholder {
  color: darkgray;
  font-weight: bold;
}

```

```html
<textarea placeholder="Введите ваше сообщение"></textarea>

```

В этом примере плейсхолдер в текстовой области будет темно-серым и жирным.

### Стилизация плейсхолдеров в различных типах полей ввода

Пример:

```css
input[type="email"]::placeholder {
  color: blue;
}

input[type="password"]::placeholder {
  color: red;
  font-style: italic;
}

input[type="search"]::placeholder {
  color: green;
  text-transform: uppercase;
}

```

```html
<input type="email" placeholder="Введите ваш email">
<input type="password" placeholder="Введите ваш пароль">
<input type="search" placeholder="Поиск">

```

В этом примере плейсхолдеры в различных типах полей ввода будут иметь разные стили: синий для email, красный курсив для пароля и зелёный верхний регистр для поиска.

## Сложные примеры использования псевдоэлемента `::placeholder`

### Анимация плейсхолдера

Плейсхолдеры могут быть анимированы для привлечения внимания пользователя к полю ввода.

```css
@keyframes fadeInOut {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

input::placeholder {
  color: gray;
  animation: fadeInOut 2s infinite;
}

```

```html
<input type="text" placeholder="Введите ваше имя">

```

В этом примере плейсхолдер будет плавно изменять прозрачность, создавая эффект мерцания.

### Стилизация плейсхолдера в зависимости от состояния поля ввода

Можно изменить стиль плейсхолдера в зависимости от состояния фокуса поля ввода.

```css
input::placeholder {
  color: gray;
}

input:focus::placeholder {
  color: blue;
}

```

```html
<input type="text" placeholder="Введите ваш текст">

```

В этом примере цвет плейсхолдера изменится с серого на синий, когда поле ввода будет в фокусе.

## Использование в реальных проектах

### Форма регистрации

Пример использования псевдоэлемента `::placeholder` для стилизации плейсхолдеров в форме регистрации:

```css
form {
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.form-field {
  margin-bottom: 15px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
}

.form-field input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.form-field input::placeholder {
  color: gray;
  font-style: italic;
}

.submit-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.submit-button:hover {
  background-color: #0056b3;
}

```

```html
<form>
  <div class="form-field">
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" placeholder="Введите ваше имя">
  </div>
  <div class="form-field">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" placeholder="Введите ваш email">
  </div>
  <div class="form-field">
    <label for="password">Пароль:</label>
    <input type="password" id="password" name="password" placeholder="Введите ваш пароль">
  </div>
  <button type="submit" class="submit-button">Регистрация</button>
</form>

```

В этом примере плейсхолдеры в полях ввода формы регистрации будут серыми и курсивными.

### Форма обратной связи

Пример использования псевдоэлемента `::placeholder` для стилизации плейсхолдеров в форме обратной связи:

```css
form {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
}

.form-field input,
.form-field textarea {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.form-field input::placeholder,
.form-field textarea::placeholder {
  color: darkgray;
  font-style: italic;
}

.submit-button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.submit-button:hover {
  background-color: #218838;
}

```

```html
<form>
  <div class="form-field">
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" placeholder="Введите ваше имя">
  </div>
  <div class="form-field">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" placeholder="Введите ваш email">
  </div>
  <div class="form-field">
    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="5" placeholder="Введите ваше сообщение"></textarea>
  </div>
  <button type="submit" class="submit-button">Отправить</button>
</form>

```

В этом примере плейсхолдеры в полях ввода и текстовой области формы обратной связи будут темно-серыми и курсивными.

## Заключение

Псевдоэлемент `::placeholder` в CSS предоставляет мощный способ стилизации плейсхолдеров в полях ввода и текстовых областях. Это помогает улучшить внешний вид форм и повысить удобство их использования. Понимание различных способов использования псевдоэлемента `::placeholder`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.