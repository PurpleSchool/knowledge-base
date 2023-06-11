---
metaTitle: BOM – JavaScript BOM – Браузерное окружение и API в JS
metaDescription: Как работает BOM в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: BOM в JavaScript
preview: JavaScript имеет доступ к браузерному окружению, которое значительно расширяет его возможности...
---

JavaScript имеет доступ к браузерному окружению, которое значительно расширяет его возможности. BOM (Browser Object Model) - это один из важных элементов браузерного окружения для JavaScript. Он предоставляет доступ к различным функциям и свойствам браузера, что делает JavaScript таким мощным и популярным языком программирования.

## Navigator
Navigator - это объект, который предоставляет информацию о браузере, в котором запущен JavaScript. Он содержит различные свойства, такие как userAgent, который позволяет определить тип браузера, и appVersion, который указывает версию браузера. 

Пример:

```javascript
if (navigator.userAgent.indexOf("Chrome") != -1) {
  console.log("Вы используете Chrome");
} else if (navigator.userAgent.indexOf("Firefox") != -1) {
  console.log("Вы используете Firefox");
} else {
  console.log("Вы используете другой браузер");
}
```

## Screen
Screen - это объект, который предоставляет информацию о разрешении экрана пользователя. Он содержит свойства, такие как width и height, которые указывают размеры экрана. 

Пример:

```javascript
console.log(`Ширина экрана: ${screen.width}`);
console.log(`Высота экрана: ${screen.height}`);
```

## Location
Location - это объект, который предоставляет информацию о текущем URL-адресе страницы. Он содержит свойства, такие как href, который указывает на текущий URL-адрес, и search, который содержит строку запроса.

Пример:

```javascript
console.log(`Текущий URL-адрес: ${location.href}`);
console.log(`Строка запроса: ${location.search}`);
```

## Fetch
Fetch - это метод, который позволяет отправлять HTTP-запросы с помощью JavaScript. Он используется для получения данных с сервера и отправки данных на сервер. 

Пример:

```javascript
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => response.json())
  .then(data => console.log(data))
```

## History
History - это объект, который предоставляет информацию о истории браузера. Он содержит методы, такие как back и forward, которые позволяют перемещаться по истории браузера.

Пример:

```javascript
history.back(); // перейти на предыдущую страницу
history.forward(); // перейти на следующую страницу
```

## LocalStorage и SessionStorage
LocalStorage и SessionStorage - это объекты, которые позволяют сохранять данные в браузере. SessionStorage хранит данные только в течение сессии браузера, а LocalStorage хранит данные даже после закрытия браузера.

Пример:

```javascript
localStorage.setItem('name', 'John');
console.log(localStorage.getItem('name')); // выведет 'John'
```

## Заключение
BOM - это один из важных элементов браузерного окружения для JavaScript, который предоставляет доступ к различным функциям и свойствам браузера. Например, объект Navigator позволяет определить тип браузера, Screen - получить размер экрана, Location - получить информацию о текущем URL-адресе, Fetch - отправлять HTTP-запросы, History - перемещаться по истории браузера, а LocalStorage и SessionStorage - сохранять данные в браузере. Использование этих функций и свойств BOM значительно расширяет возможности JavaScript и делает его мощным и популярным языком программирования.