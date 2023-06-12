---
metaTitle: window.matchMedia – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает window.matchMedia в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: window.matchMedia в JavaScript
preview: window.matchMedia - это встроенный в браузер API, который позволяет получить доступ к медиавыражениям CSS из JavaScript...
---

window.matchMedia - это встроенный в браузер API, который позволяет получить доступ к медиавыражениям CSS из JavaScript. Он может быть использован для изменения поведения веб-страницы в зависимости от параметров экрана и системной темы оформления.

## Форма записи
Для использования window.matchMedia в JavaScript необходимо создать объект MediaQueryList, который содержит информацию о медиавыражении. Объект можно создать, вызвав метод `window.matchMedia(mediaQueryString)`, где `mediaQueryString` - строка, содержащая медиавыражение.

Пример:

```javascript
let mediaQuery = window.matchMedia('(min-width: 768px)');
```

## Описание работы
MediaQueryList предоставляет несколько методов и свойств, позволяющих определить ширину экрана по заданному медиавыражению и системную тему оформления.

- `matches` - свойство, возвращающее true, если медиавыражение соответствует текущему состоянию экрана, и false в противном случае.

Пример:

```javascript
let mediaQuery = window.matchMedia('(min-width: 768px)');
if (mediaQuery.matches) {
  // выполняется, если ширина экрана больше 768 пикселей
} else {
  // выполняется, если ширина экрана меньше или равна 768 пикселям
}
```

- `addListener(callback)` - метод, позволяющий добавить обработчик события, который будет вызываться при изменении состояния медиавыражения.

Пример:

```javascript
let mediaQuery = window.matchMedia('(min-width: 768px)');
mediaQuery.addListener(function(event) {
  if (event.matches) {
    // выполняется, если ширина экрана больше 768 пикселей
  } else {
    // выполняется, если ширина экрана меньше или равна 768 пикселям
  }
});
```

- `media` - свойство, возвращающее строку, содержащую медиавыражение.

Пример:

```javascript
let mediaQuery = window.matchMedia('(min-width: 768px)');
console.log(mediaQuery.media); // выводит "(min-width: 768px)"
```

Определение ширины экрана по заданному медиавыражению
MediaQueryList позволяет определить ширину экрана по заданному медиавыражению. Например, можно определить, является ли ширина экрана больше 768 пикселей, используя медиавыражение `(min-width: 768px)`.

Пример:

```javascript
let mediaQuery = window.matchMedia('(min-width: 768px)');
if (mediaQuery.matches) {
  console.log('Ширина экрана больше 768 пикселей');
} else {
  console.log('Ширина экрана меньше или равна 768 пикселям');
}
```

Определение системной темы оформления
MediaQueryList также позволяет определить системную тему оформления, используя медиавыражение `(prefers-color-scheme: dark)` для темной темы и `(prefers-color-scheme: light)` для светлой темы.

Пример:

```javascript
let darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
if (darkModeQuery.matches) {
  console.log('Системная тема оформления - темная');
} else {
  console.log('Системная тема оформления - светлая');
}
```

## Заключение
window.matchMedia - это важный инструмент для получения информации о медиавыражениях CSS из JavaScript. Он позволяет определить ширину экрана по заданному медиавыражению и системную тему оформления, что может быть использовано для изменения поведения веб-страницы в зависимости от параметров экрана и предпочтений пользователя.