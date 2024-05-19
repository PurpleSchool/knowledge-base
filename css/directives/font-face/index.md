---
metaTitle: Подключаем кастомные шрифты с помощью @font-face в CSS
metaDescription: Подключаем кастомные шрифты с помощью @font-face в CSS
author: Дмитрий Нечаев
title: Директива @font-face в CSS. Полное руководство с примерами
preview: С помощью правила @font-face в CSS можно подключить любые шрифты, которые будут корректно отображаться на всех устройствах.
---

Кастомные шрифты позволяют придать веб-странице уникальный и стильный внешний вид. С помощью правила `@font-face` в CSS можно подключить любые шрифты, которые будут корректно отображаться на всех устройствах. В этой статье мы подробно рассмотрим, как использовать `@font-face` для подключения кастомных шрифтов, и приведём примеры его применения.

## Основы @font-face

Правило `@font-face` позволяет определять кастомные шрифты, которые могут быть использованы в CSS-стилях. Оно указывает, где находится шрифт и как он должен использоваться на веб-странице.

### Синтаксис @font-face

```css
@font-face {
    font-family: 'CustomFont';
    src: url('path/to/font.woff2') format('woff2'),
         url('path/to/font.woff') format('woff');
    font-weight: normal;
    font-style: normal;
}

```

- `font-family` — задаёт имя шрифта, которое будет использоваться в CSS.
- `src` — указывает путь к файлу шрифта и его формат.
- `font-weight` — (необязательно) задаёт начертание шрифта (например, `normal`, `bold`).
- `font-style` — (необязательно) задаёт стиль шрифта (например, `normal`, `italic`).

### Пример базового использования @font-face

```css
@font-face {
    font-family: 'OpenSans';
    src: url('fonts/OpenSans-Regular.woff2') format('woff2'),
         url('fonts/OpenSans-Regular.woff') format('woff');
}

body {
    font-family: 'OpenSans', sans-serif;
}

```

В этом примере подключается шрифт `OpenSans` из папки `fonts`, и он применяется ко всему тексту на странице.

## Поддержка различных форматов шрифтов

Для обеспечения кроссбраузерной совместимости рекомендуется указывать несколько форматов шрифтов. Наиболее часто используются следующие форматы:

- `woff2` — наиболее предпочтительный формат для современных браузеров.
- `woff` — широко поддерживаемый формат.
- `ttf` — старый формат, поддерживается во многих браузерах.
- `eot` — используется в старых версиях Internet Explorer.
- `svg` — используется в некоторых мобильных браузерах.

### Пример подключения нескольких форматов шрифта

```css
@font-face {
    font-family: 'CustomFont';
    src: url('fonts/CustomFont.woff2') format('woff2'),
         url('fonts/CustomFont.woff') format('woff'),
         url('fonts/CustomFont.ttf') format('truetype'),
         url('fonts/CustomFont.eot') format('embedded-opentype'),
         url('fonts/CustomFont.svg#CustomFont') format('svg');
}

```

## Указание различных начертаний и стилей

Для разных начертаний (весов) и стилей шрифта (например, курсив) необходимо определить отдельные правила `@font-face`.

### Пример определения различных начертаний и стилей

```css
@font-face {
    font-family: 'OpenSans';
    src: url('fonts/OpenSans-Regular.woff2') format('woff2'),
         url('fonts/OpenSans-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'OpenSans';
    src: url('fonts/OpenSans-Bold.woff2') format('woff2'),
         url('fonts/OpenSans-Bold.woff') format('woff');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'OpenSans';
    src: url('fonts/OpenSans-Italic.woff2') format('woff2'),
         url('fonts/OpenSans-Italic.woff') format('woff');
    font-weight: normal;
    font-style: italic;
}

```

В этом примере подключаются три разных шрифта: обычный, жирный и курсив.

## Примеры использования @font-face

### Пример 1: Подключение кастомного шрифта и его использование

```css
@font-face {
    font-family: 'Roboto';
    src: url('fonts/Roboto-Regular.woff2') format('woff2'),
         url('fonts/Roboto-Regular.woff') format('woff');
}

body {
    font-family: 'Roboto', sans-serif;
}

```

### Пример 2: Подключение шрифта с несколькими начертаниями и стилями

```css
@font-face {
    font-family: 'Lato';
    src: url('fonts/Lato-Regular.woff2') format('woff2'),
         url('fonts/Lato-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Lato';
    src: url('fonts/Lato-Bold.woff2') format('woff2'),
         url('fonts/Lato-Bold.woff') format('woff');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'Lato';
    src: url('fonts/Lato-Italic.woff2') format('woff2'),
         url('fonts/Lato-Italic.woff') format('woff');
    font-weight: normal;
    font-style: italic;
}

h1 {
    font-family: 'Lato', sans-serif;
    font-weight: bold;
}

p {
    font-family: 'Lato', sans-serif;
    font-style: italic;
}

```

### Пример 3: Использование шрифта в разных контекстах

```css
@font-face {
    font-family: 'Montserrat';
    src: url('fonts/Montserrat-Regular.woff2') format('woff2'),
         url('fonts/Montserrat-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('fonts/Montserrat-Bold.woff2') format('woff2'),
         url('fonts/Montserrat-Bold.woff') format('woff');
    font-weight: bold;
    font-style: normal;
}

h1, h2, h3 {
    font-family: 'Montserrat', sans-serif;
    font-weight: bold;
}

p {
    font-family: 'Montserrat', sans-serif;
}

```

## Заключение

Правило `@font-face` в CSS предоставляет мощные возможности для подключения кастомных шрифтов на веб-страницы. С его помощью можно использовать уникальные шрифты, улучшая визуальное восприятие и стиль сайта. Освоив использование `@font-face`, вы сможете значительно расширить возможности стилизации и придать вашим веб-проектам профессиональный и уникальный внешний вид.