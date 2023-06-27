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