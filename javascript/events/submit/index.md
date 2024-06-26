---
metaTitle: Событие submit в JavaScript
metaDescription: Разбираемся как работает событие submit в JavaScript
author: Дмитрий Нечаев
title: Событие submit в JavaScript
preview: Учимся пользоваться событием submit в JavaScript. Разбираем примеры использования
---

Событие `submit` является ключевым в JavaScript для управления отправкой форм. Это событие срабатывает, когда пользователь пытается отправить форму, например, нажатием на кнопку типа `submit` или нажатием клавиши Enter, находясь в одном из полей формы. Основное предназначение этого события — дать возможность разработчикам выполнить необходимые действия перед отправкой данных на сервер, такие как проверка валидности данных, предотвращение стандартной отправки формы для асинхронной отправки или логирование информации.

### Как работает событие "submit"?

Событие `submit` привязывается к элементу формы (`<form>`), а не к кнопке отправки. Это позволяет централизованно управлять процессом отправки всех форм на странице, не зависимо от способа, которым пользователь инициирует отправку формы.

### Примеры использования события "submit"

### Отмена стандартной отправки формы

Часто разработчики используют JavaScript для обработки данных формы перед их отправкой на сервер, или для отправки данных асинхронно с помощью AJAX. В таких случаях может потребоваться отменить стандартное поведение отправки формы.

```jsx
const form = document.getElementById('myForm');

form.addEventListener('submit', function(event) {
    event.preventDefault(); // Отменяет стандартную отправку формы
    console.log('Форма не будет отправлена автоматически.');
    // Тут можно добавить код для проверки данных или асинхронной отправки
});

```

### Валидация данных перед отправкой

Перед тем как данные формы будут отправлены на сервер, их можно проверить на клиентской стороне, чтобы убедиться, что все введено корректно.

```jsx
form.addEventListener('submit', function(event) {
    const username = form.querySelector('#username').value;
    if(username.length < 4) {
        event.preventDefault(); // Останавливаем отправку формы
        alert('Имя пользователя должно содержать минимум 4 символа.');
    }
});

```

### Асинхронная отправка данных с помощью Fetch API

Иногда лучше отправить данные формы асинхронно, чтобы страница не перезагружалась. Это улучшает пользовательский опыт, делая взаимодействие с сайтом более плавным.

```jsx
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвратить стандартную отправку

    const formData = new FormData(form);

    fetch('<https://example.com/submit>', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log('Успех:', data))
    .catch(error => console.error('Ошибка:', error));
});

```

### Когда использовать событие "submit"?

Событие `submit` идеально подходит для следующих сценариев:

- Проверка валидности данных на стороне клиента перед отправкой формы.
- Отправка данных формы без перезагрузки страницы (AJAX).
- Логирование или аналитика отправки форм.

### Заключение

Событие `submit` в JavaScript предоставляет мощный инструмент для управления процессом отправки форм. Оно позволяет разработчикам выполнить необходимые проверки и действия перед тем, как данные будут отправлены на сервер или обработаны асинхронно. Использование этого события может значительно улучшить качество взаимодействия пользователя с веб-сайтом, повышая его удобство и безопасность.