---
metaTitle: clearInterval() – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает clearInterval() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: clearInterval() в JavaScript
preview: clearInterval() - это функция в JavaScript, которая используется для остановки повторного выполнения задержанного кода, который был запущен с помощью функции setInterval()...
---

clearInterval() - это функция в JavaScript, которая используется для остановки повторного выполнения задержанного кода, который был запущен с помощью функции setInterval().

Пример использования функции clearInterval():

```javascript
let counter = 0;

function incrementCounter() {
  counter++;
  console.log('Текущее значение счетчика: ' + counter);
}

const intervalId = setInterval(incrementCounter, 1000);

setTimeout(() => {
  clearInterval(intervalId);
}, 5000);
```

Этот код вызывает функцию incrementCounter() каждую секунду и увеличивает значение переменной counter на 1. Функция clearInterval() остановит выполнение этой функции через 5 секунд.

## Форма записи

Функция clearInterval() вызывается с одним аргументом - идентификатором таймера, который был возвращен функцией setInterval().

Пример:

```javascript
const intervalId = setInterval(() => {
  console.log('Код, который будет повторяться каждые 3 секунды');
}, 3000);

clearInterval(intervalId);
```

В этом примере код, переданный в качестве аргумента функции setInterval(), будет повторяться каждые 3 секунды. Однако, функция clearInterval() остановит повторное выполнение этого кода до того, как он будет запущен.

## Заключение

Функция clearInterval() - это удобный способ остановить повторное выполнение задержанного кода, который был запущен с помощью функции setInterval(). Она позволяет избежать выполнения ненужного кода и повысить производительность программы.