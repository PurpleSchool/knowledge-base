---
metaTitle: Geolocation API – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает Geolocation API в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: Geolocation API в JavaScript
preview: Geolocation API - это встроенный в браузер API, который позволяет получать местоположение пользователя через GPS или другие источники...
---

Geolocation API - это встроенный в браузер API, который позволяет получать местоположение пользователя через GPS или другие источники. Он может быть использован для создания геолокационных приложений, которые позволяют пользователю получать доступ к информации о местоположении.

## Форма записи
Geolocation API предоставляет набор методов, которые можно использовать для получения местоположения пользователя и отслеживания его изменений в реальном времени.

```javascript
navigator.geolocation
```

## Описание работы
Чтобы использовать Geolocation API, необходимо проверить, поддерживается ли он в текущем браузере. Для этого можно использовать следующий код:

```javascript
if (navigator.geolocation) {
  // Geolocation поддерживается
} else {
  // Geolocation не поддерживается
}
```

Geolocation API позволяет веб-приложениям получать доступ к местоположению пользователя. Это открывает возможности для создания карт, сервисов геолокации и других приложений, использующих местоположение. Однако, для работы с Geolocation API необходимо понимать вопросы приватности и безопасности, а также уметь обрабатывать ошибки. Если вы хотите изучить Geolocation API и научиться создавать приложения, использующие местоположение пользователя, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=geolocation-api-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Узнать геолокацию
Чтобы получить местоположение пользователя, можно использовать метод `getCurrentPosition()`. Этот метод принимает две функции обратного вызова - одну для успешного получения местоположения и другую для обработки ошибок.

- latitude - Широта
- longitude - Долгота
- accuracy - Точность измерений в метрах
- altitude - Высота над уровнем моря
- heading - Направление движения
- speed - Скорость движения

Пример:

```javascript
navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position.coords.latitude, position.coords.longitude); // выводит координаты местоположения пользователя
}, function(error) {
  console.log(error.message); // выводит сообщение об ошибке
});
```

## Отслеживание в реальном времени
Чтобы отслеживать изменения местоположения пользователя в реальном времени, можно использовать метод `watchPosition()`. Этот метод также принимает две функции обратного вызова - одну для успешного получения местоположения и другую для обработки ошибок.

Пример:

```javascript
let watchId = navigator.geolocation.watchPosition(function(position) {
  console.log(position.coords.latitude, position.coords.longitude); // выводит координаты местоположения пользователя
}, function(error) {
  console.log(error.message); // выводит сообщение об ошибке
});
```

## Остановка отслеживания
Чтобы остановить отслеживание изменений местоположения пользователя, можно использовать метод `clearWatch()`. Этот метод принимает идентификатор, возвращенный методом `watchPosition()`.

Пример:

```javascript
navigator.geolocation.clearWatch(watchId); // останавливает отслеживание изменений местоположения пользователя
```

## обработка ошибок
При использовании Geolocation API могут возникать ошибки, например, если пользователь не разрешил доступ к его местоположению или если устройство не имеет доступа к GPS или другим источникам местоположения. Чтобы обработать ошибки, нужно использовать функцию обратного вызова для обработки ошибок, передаваемую в методы `getCurrentPosition()` и `watchPosition()`.

Пример:

```javascript
navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position.coords.latitude, position.coords.longitude); // выводит координаты местоположения пользователя
}, function(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.log("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.log("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.log("An unknown error occurred.");
      break;
  }
});
```


## Заключение
Это только некоторые методы ивозможности Geolocation API, которые могут быть использованы для получения местоположения пользователя в JavaScript. Использование Geolocation API может помочь создавать более динамические и адаптивные геолокационные приложения, которые могут адаптироваться к местоположению пользователя и его потребностям. Для более глубокого изучения JavaScript, работы с асинхронными запросами и другими API браузера, рассмотрите курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=geolocation-api-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
