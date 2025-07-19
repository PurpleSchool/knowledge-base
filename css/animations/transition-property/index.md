---
metaTitle: Основы использования transition-property в CSS
metaDescription: Узнайте, как правильно использовать свойство transition-property в CSS для создания плавных анимаций.
author: Дмитрий Нечаев
title: Основы использования transition-property в CSS; управление плавными переходами
preview: Изучите, как с помощью transition-property в CSS можно управлять плавными переходами для различных свойств элементов на веб-странице.
---

Анимации и плавные переходы стали неотъемлемой частью современного веб-дизайна, добавляя интерактивность и улучшая пользовательский опыт. Одним из ключевых свойств, которые позволяют контролировать эти переходы, является `transition-property`. В этой статье мы подробно рассмотрим, как работает это свойство, какие значения оно может принимать и как его использовать для создания плавных анимаций.

## Что такое transition-property?

Свойство `transition-property` в CSS определяет, какие свойства элемента будут анимироваться при изменении их значений. Это позволяет разработчику точно указать, какие изменения должны происходить плавно, а какие - мгновенно.

## Основной синтаксис

Синтаксис свойства `transition-property` выглядит следующим образом:

```css
.element {
    transition-property: свойство;
}
```

Значением свойства `transition-property` может быть одно или несколько CSS-свойств, которые нужно анимировать. Эти свойства перечисляются через запятую.

### Пример

Рассмотрим простой пример, где мы изменяем цвет фона и ширину элемента при наведении курсора:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Пример transition-property</title>
    <style>
        .box {
            width: 100px;
            height: 100px;
            background-color: blue;
            transition-property: background-color, width; /* Указываем свойства для анимации */
            transition-duration: 2s; /* Длительность анимации */
        }

        .box:hover {
            background-color: red;
            width: 200px;
        }
    </style>
</head>
<body>
    <div class="box"></div>
</body>
</html>
```

В этом примере мы задаем для элемента `div` с классом `box` изменение цвета фона и ширины при наведении курсора мыши. Свойство `transition-property` указывает, что должны анимироваться только `background-color` и `width`.

`transition-property` определяет, какие свойства CSS будут анимироваться при изменении их значений. Правильный выбор анимируемых свойств может значительно улучшить пользовательский опыт и сделать веб-сайт более привлекательным. Чтобы эффективно использовать `transition-property`, необходимо понимать, какие свойства анимируются лучше всего и как управлять плавностью переходов. Если вы хотите детальнее погрузиться в мир CSS-анимаций и научиться создавать плавные и красивые переходы — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=osnovy-ispolzovaniya-transition-property-v-css-upravlenie-plavnymi-perehodami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Значения свойства transition-property

Свойство `transition-property` может принимать различные значения:

### all

Значение `all` указывает, что все изменяющиеся свойства элемента должны быть анимированы:

```css
.element {
    transition-property: all;
    transition-duration: 1s;
}
```

### none

Значение `none` отключает анимацию для всех свойств:

```css
.element {
    transition-property: none;
}
```

### Специфические свойства

Вы также можете указать конкретные свойства, которые должны быть анимированы. Например, если нужно анимировать только ширину и высоту:

```css
.element {
    transition-property: width, height;
    transition-duration: 2s;
}
```

## Множественные анимации

Если нужно анимировать несколько свойств с разной длительностью, это можно сделать с помощью комбинирования `transition-property`, `transition-duration`, `transition-timing-function` и `transition-delay`:

```css
.element {
    transition-property: width, height, background-color;
    transition-duration: 1s, 2s, 3s;
    transition-timing-function: ease-in, linear, ease-out;
    transition-delay: 0s, 1s, 2s;
}
```

## Совместимость с браузерами

Свойство `transition-property` поддерживается всеми современными браузерами, включая Chrome, Firefox, Safari, Edge и Opera. Для старых версий браузеров могут понадобиться префиксы:

```css
.element {
    -webkit-transition-property: background-color, width; /* Для старых версий Safari и Chrome */
    -moz-transition-property: background-color, width; /* Для старых версий Firefox */
    -o-transition-property: background-color, width; /* Для старых версий Opera */
    transition-property: background-color, width;
}
```

## Практические примеры

### Анимация изменения цвета и размера кнопки

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Пример анимации кнопки</title>
    <style>
        .button {
            padding: 10px 20px;
            background-color: green;
            color: white;
            border: none;
            cursor: pointer;
            transition-property: background-color, transform;
            transition-duration: 0.5s, 1s;
        }

        .button:hover {
            background-color: limegreen;
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <button class="button">Нажми меня</button>
</body>
</html>
```

В этом примере кнопка плавно изменяет цвет и увеличивается в размере при наведении курсора.

## Заключение

Свойство `transition-property` является мощным инструментом для создания плавных и привлекательных анимаций на веб-страницах. Понимание того, как использовать это свойство, позволяет разработчикам точно управлять тем, какие изменения будут происходить плавно, а какие - мгновенно. Это улучшает пользовательский опыт и делает интерфейсы более динамичными и интерактивными. Экспериментируйте с различными значениями `transition-property` и создавайте уникальные анимации для ваших проектов.

`transition-property` – это важный инструмент для создания интерактивных веб-сайтов. Но для создания действительно впечатляющих переходов необходимо не только знать, как работает `transition-property`, но и понимать принципы анимации и дизайна. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=osnovy-ispolzovaniya-transition-property-v-css-upravlenie-plavnymi-perehodami) вы научитесь создавать профессиональные веб-сайты с красивой и плавной анимацией. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
