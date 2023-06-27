---
metaTitle: fetch() – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает fetch() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: fetch() в JavaScript
preview: Fetch API - это интерфейс JavaScript для отправки и получения данных с сервера...
---

Fetch API - это интерфейс JavaScript для отправки и получения данных с сервера. Он предоставляет простой и гибкий способ работы с сетевыми запросами, а также обработки ответов.

## Коротко
Fetch API позволяет отправлять запросы на сервер и получать ответы. Он использует промисы для обработки ответов, что позволяет легко управлять асинхронными операциями. 

## Форма записи и описание работы
Fetch API используется с помощью функции fetch(), которая принимает URL-адрес и объект параметров. Этот объект может содержать различные параметры, такие как метод запроса, заголовки, тело запроса и т.д.

Пример:

```javascript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Мой пост',
    body: 'Текст поста',
    userId: 1
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

Fetch API также позволяет использовать Cookies для хранения данных аутентификации и сеанса. Для этого нужно установить параметр credentials в значение 'include'.

Пример:

```javascript
fetch('https://example.com', {
  credentials: 'include'
})
.then(response => console.log(response))
.catch(err => console.error(err));
```

Обработка ошибок в Fetch API осуществляется с помощью метода catch(). Он вызывается, когда происходит ошибка в запросе или ответе. В методе catch() можно обработать ошибку и выполнить соответствующие действия.

Пример:

```javascript
fetch('https://example.com')
.then(response => {
  if (!response.ok) {
    throw new Error('Ошибка запроса');
  }
  return response.json();
})
.then(data => console.log(data))
.catch(err => console.error(err));
```

## Заключение
Fetch API предоставляет простой и гибкий способ работы с сетевыми запросами и ответами. Он используется с помощью функции fetch(), которая принимает URL-адрес и объект параметров. Fetch API также позволяет использовать Cookies для хранения данных аутентификации и сеанса, а также обрабатывать ошибки с помощью метода catch().