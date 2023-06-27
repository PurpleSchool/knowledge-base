---
metaTitle: window.navigator – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает window.navigator в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: window.navigator в JavaScript
preview: window.navigator - объект JavaScript, который предоставляет информацию о браузере или приложении, в котором выполняется скрипт...
---

window.navigator - объект JavaScript, который предоставляет информацию о браузере или приложении, в котором выполняется скрипт. Он содержит ряд методов, которые можно использовать для получения дополнительной информации о браузере и его возможностях.

## window.navigator.userAgent
- Возвращает строку, которая содержит информацию о браузере и операционной системе. Эта строка называется User-Agent и может быть использована для определения типа браузера и его версии.

Пример:

```javascript
console.log(window.navigator.userAgent); // выводит строку User-Agent, которая содержит информацию о браузере и операционной системе
```

## window.navigator.cookieEnabled
- Возвращает логическое значение true, если браузер поддерживает cookies, и false в противном случае. Cookies - это механизм, который используется для хранения информации на стороне клиента.

Пример:

```javascript
console.log(window.navigator.cookieEnabled); // выводит true, если браузер поддерживает cookies, и false в противном случае
```

## window.navigator.languages
- Возвращает массив, который содержит предпочтительные языки пользователя. Это может быть полезно для создания мультиязычных веб-приложений, которые могут адаптироваться к языковым настройкам пользователей.

Пример:

```javascript
console.log(window.navigator.languages); // выводит массив, который содержит предпочтительные языки пользователя
```

## window.navigator.geolocation
- Используется для получения информации о местоположении пользователя. Он требует разрешения пользователя для доступа к его местоположению и может быть использован для создания геолокационных приложений.

Пример:

```javascript
if (window.navigator.geolocation) {
  window.navigator.geolocation.getCurrentPosition(function(position) {
    console.log(position.coords.latitude, position.coords.longitude); // выводит координаты местоположения пользователя
  });
} else {
  console.log('Geolocation is not supported by this browser.');
}
```

## Заключение
Window.navigator предоставляет информацию о браузере или приложении, в котором выполняется скрипт. Это может быть полезно для создания более динамических и интерактивных веб-приложений, которые могут адаптироваться к различным условиям и настройкам пользователей. Window.navigator может содержать информацию о типе устройства, разрешении экрана, языке, временной зоне и многом другом.