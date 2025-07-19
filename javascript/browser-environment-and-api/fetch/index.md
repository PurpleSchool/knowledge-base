---
metaTitle: fetch() – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает fetch() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: fetch() в JavaScript
preview: Fetch API - это интерфейс JavaScript для отправки и получения данных с сервера...
---

Fetch API - это интерфейс JavaScript для отправки и получения данных с сервера. Он предоставляет простой и гибкий способ работы с сетевыми запросами, а также обработки ответов.

fetch() - это современный метод для выполнения сетевых запросов в JavaScript. Он предоставляет более гибкий и удобный интерфейс, чем старый XMLHttpRequest.  Чтобы эффективно использовать fetch(), необходимо понимать, как работают HTTP-запросы, как обрабатывать ответы и как работать с асинхронным кодом. Если вы хотите научиться выполнять сетевые запросы в JavaScript с помощью fetch() и создавать динамические веб-приложения, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=fetch-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

fetch() - это мощный инструмент для выполнения сетевых запросов. Для более глубокого изучения асинхронности, работы с Promise и современными API, рассмотрите курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=fetch-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
