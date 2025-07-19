---
metaTitle: Событие touch в JavaScript
metaDescription: Разбираемся как работает событие touch в JavaScript
author: Дмитрий Нечаев
title: Событие touch в JavaScript
preview: Учимся пользоваться событием touch в JavaScript. Разбираем примеры использования
---

Сенсорные экраны становятся все более распространенными в современных устройствах, начиная от смартфонов и планшетов до ноутбуков и даже настольных компьютеров. Вместе с этим распространением возникает необходимость понимания, как работать с событиями прикосновений на веб-страницах. В этой статье мы рассмотрим, как использовать JavaScript для обработки событий touch и какие возможности они предоставляют.

## Введение в события touch

События touch возникают при взаимодействии пользователя с сенсорным экраном. Они включают в себя различные типы событий, такие как `touchstart`, `touchmove`, `touchend` и `touchcancel`. Давайте подробнее рассмотрим каждый из них:

- `touchstart`: возникает, когда палец пользователя касается экрана.
- `touchmove`: возникает, когда палец пользователя движется по экрану.
- `touchend`: возникает, когда палец пользователя отрывается от экрана.
- `touchcancel`: возникает, когда событие касания прерывается, например, из-за ухода пальца за пределы окна браузера.

Давайте посмотрим, как мы можем использовать эти события в JavaScript.

События `touch` позволяют создавать интерактивные веб-приложения для мобильных устройств, реагирующие на касания, жесты и перемещения пальцев по экрану. Для эффективной разработки под touch-устройства необходимо учитывать особенности сенсорного ввода, обрабатывать несколько одновременных касаний и использовать жесты для управления интерфейсом. Если вы хотите научиться создавать отзывчивые и интуитивно понятные интерфейсы для мобильных устройств, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=sobytie-touch-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Обработка событий touch в JavaScript

Для обработки событий touch в JavaScript мы можем использовать методы добавления слушателей событий, такие как `addEventListener`. Давайте создадим простой пример, который будет выводить координаты касания пользователя на экране при каждом событии `touchmove`.

```jsx
// Получаем элемент, на который будем навешивать обработчики событий
var touchElement = document.getElementById('touchElement');

// Добавляем обработчик события touchmove
touchElement.addEventListener('touchmove', function(event) {
    // Получаем первое касание (touch) из события
    var touch = event.touches[0];

    // Получаем координаты касания
    var x = touch.clientX;
    var y = touch.clientY;

    // Выводим координаты в консоль
    console.log("X: " + x + ", Y: " + y);
});

```

В этом примере мы добавляем обработчик события `touchmove` к элементу с идентификатором `touchElement`. Когда пользователь двигает пальцем по экрану, событие `touchmove` срабатывает, и мы получаем координаты касания пальца на экране.

## Пример создания интерактивного элемента с помощью событий touch

Давайте создадим интерактивный элемент, который будет перемещаться по экрану вместе с перемещением пальца пользователя. Мы будем использовать события `touchstart`, `touchmove` и `touchend` для реализации этой функциональности.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сенсорные экраны и события touch</title>
    <style>
        #movableElement {
            width: 50px;
            height: 50px;
            background-color: blue;
            position: absolute;
            top: 0;
            left: 0;
        }
    </style>
</head>
<body>

<div id="movableElement"></div>

<script>
var movableElement = document.getElementById('movableElement');

movableElement.addEventListener('touchstart', function(event) {
    // Предотвращаем стандартное поведение браузера
    event.preventDefault();

    // Получаем первое касание (touch)
    var touch = event.touches[0];

    // Получаем начальные координаты элемента
    var startX = touch.clientX - movableElement.offsetLeft;
    var startY = touch.clientY - movableElement.offsetTop;

    // Добавляем обработчик события touchmove
    document.addEventListener('touchmove', moveElement);

    // Добавляем обработчик события touchend
    document.addEventListener('touchend', function() {
        // Удаляем обработчики событий touchmove и touchend
        document.removeEventListener('touchmove', moveElement);
        document.removeEventListener('touchend', arguments.callee);
    });

    // Функция для перемещения элемента
    function moveElement(event) {
        var touch = event.touches[0];

        // Вычисляем новые координаты элемента
        var newX = touch.clientX - startX;
        var newY = touch.clientY - startY;

        // Устанавливаем новые координаты элемента
        movableElement.style.left = newX + 'px';
        movableElement.style.top = newY + 'px';
    }
});
</script>

</body>
</html>

```

В этом примере мы создаем квадратный элемент синего цвета, который можно перемещать по экрану, касаясь его пальцем и перетаскивая. Мы используем события `touchstart` для начала перемещения, `touchmove` для обновления положения элемента при движении пальца, и `touchend` для завершения перемещения.

## Заключение

События touch предоставляют мощный механизм для создания интерактивных пользовательских интерфейсов на сенсорных устройствах. Понимание того, как работать с этими событиями в JavaScript, открывает широкие возможности для создания удобных и интуитивно понятных веб-приложений.

Создание мобильных веб-приложений требует не только знания событий `touch`, но и умения оптимизировать производительность, адаптировать интерфейс под разные размеры экранов и использовать другие техники разработки под мобильные устройства. Если вы готовы выйти за рамки базовых знаний и освоить все тонкости разработки под mobile, обратите внимание на курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=sobytie-touch-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
