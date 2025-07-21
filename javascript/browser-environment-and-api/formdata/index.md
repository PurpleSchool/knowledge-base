---
metaTitle: FormData – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает FormData в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: FormData в JavaScript
preview: FormData - это интерфейс JavaScript, который позволяет работать с данными формы HTML...
---

FormData - это интерфейс JavaScript, который позволяет работать с данными формы HTML. Он предоставляет удобный способ отправки данных на сервер без необходимости вручную создавать и настраивать объекты XMLHttpRequest.

## Форма записи
Для создания объекта FormData используется конструктор FormData(), который можно вызвать без параметров или передать ему форму HTML в качестве параметра.

Пример:

```javascript
const formData = new FormData();
```

```html
<form>
  <input type="text" name="username">
  <input type="password" name="password">
  <input type="file" name="avatar">
  <button type="submit">Отправить</button>
</form>
```

```javascript
const form = document.querySelector('form');
const formData = new FormData(form);
```

`FormData` предоставляет удобный способ создания и отправки данных формы на сервер. Это особенно полезно для отправки файлов и других сложных данных.  Чтобы эффективно использовать `FormData`, необходимо понимать, как работают формы, как отправлять данные на сервер и как обрабатывать ответы. Если вы хотите детальнее погрузиться в мир JavaScript и научиться работать с формами и данными, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=formdata-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Описание работы
FormData может быть использован в тех случаях, когда нужно отправить данные формы на сервер, включая текстовые поля, флажки, переключатели, файлы и т.д. Он также может быть использован для отправки данных в формате multipart/form-data, который используется при загрузке файлов на сервер.

Создание объекта FormData:

```javascript
const formData = new FormData();
```

Добавление значений в форму:

```javascript
formData.append('username', 'john');
formData.append('password', 'secret');
formData.append('avatar', fileInput.files[0]);
```

Работа с коллекцией значений:

```javascript
formData.set('username', 'jane');
formData.delete('password');
formData.has('avatar'); // true
formData.get('avatar'); // File object
formData.getAll('username'); // ['john', 'jane']
```

Обход значений в форме:

```javascript
for (const [key, value] of formData) {
  console.log(`${key}: ${value}`);
}
```

## Заключение
FormData предоставляет удобный способ отправки данных формы на сервер в JavaScript. Он может быть использован для отправки текстовых полей, файлов и других типов данных. FormData также может быть использован для отправки данных в формате multipart/form-data, который используется при загрузке файлов на сервер. Использование FormData значительно расширяет возможности JavaScript и позволяет создавать интерактивные веб-приложения.

Работа с `FormData` упрощает отправку данных формы на сервер. Для углубленного изучения работы с сетевыми запросами, API и современными техниками JavaScript, рассмотрите курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=formdata-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
