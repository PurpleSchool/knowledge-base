---
metaTitle: setInterval() – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает setInterval() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: setInterval() в JavaScript
preview: setInterval() - это функция в JavaScript, которая используется для повторного выполнения кода через определенный интервал времени...
---

setInterval() - это функция в JavaScript, которая используется для повторного выполнения кода через определенный интервал времени.

Пример использования функции setInterval():

```javascript
let counter = 0;

function incrementCounter() {
  counter++;
  console.log('Текущее значение счетчика: ' + counter);
}

setInterval(incrementCounter, 1000);
```

Этот код вызывает функцию incrementCounter() каждую секунду и увеличивает значение переменной counter на 1. Каждый раз в консоль выводится текущее значение счетчика.

## Форма записи

Функция setInterval() вызывается с двумя аргументами: функцией, которую нужно повторять, и интервалом времени в миллисекундах между запусками.

Пример:

```javascript
setInterval(() => {
  console.log('Код, который будет выполнен каждые 3 секунды');
}, 3000);
```

В этом примере код, переданный в качестве аргумента функции setInterval(), будет выполнен каждые 3 секунды.

## Заключение

Функция setInterval() - это удобный способ повторять выполнение кода через определенный интервал времени. Она позволяет вызывать функцию многократно и может быть использована для создания анимации, обновления данных и других задач.