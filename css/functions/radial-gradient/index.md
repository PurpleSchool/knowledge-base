---
metaTitle: Функция radial-gradient в CSS. Создание кругового градиента
metaDescription: Функция radial-gradient в CSS. Создание кругового градиента
author: Дмитрий Нечаев
title: Функция radial-gradient в CSS. Полное руководство с примерами
preview: CSS предоставляет разнообразные инструменты для создания визуально привлекательных элементов на веб-страницах. Одним из таких инструментов является функция radial-gradient, которая позволяет создавать круговые градиенты.
---

CSS предоставляет разнообразные инструменты для создания визуально привлекательных элементов на веб-страницах. Одним из таких инструментов является функция `radial-gradient()`, которая позволяет создавать круговые градиенты. Эти градиенты создают плавные переходы цветов, исходящие из центра элемента, что добавляет дизайну глубину и стиль. В этой статье мы рассмотрим, как использовать `radial-gradient()`, и приведём примеры её применения.

## Основы `radial-gradient()`

Функция `radial-gradient()` создаёт радиальный градиент, который можно использовать в качестве значения свойства `background-image`. Основной синтаксис функции выглядит следующим образом:

```css
background-image: radial-gradient(shape size at position, color-stop1, color-stop2, ...);

```

- `shape` — форма градиента (например, `circle` или `ellipse`).
- `size` — размер градиента.
- `position` — положение центра градиента.
- `color-stop` — точки остановки цвета, определяющие, где и как цвета должны переходить друг в друга.

### Пример простого радиального градиента

```css
background-image: radial-gradient(circle, red, blue);

```

В этом примере создаётся радиальный градиент круговой формы, который плавно переходит от красного цвета к синему.

Функция `radial-gradient` является мощным инструментом для создания красивых и выразительных фонов. Однако для её эффективного использования необходимо понимать принципы работы с цветом, позиционированием и другими свойствами CSS. Если вы хотите освоить все тонкости создания градиентов и стать настоящим мастером веб-дизайна, наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=funktsiia-radial-gradient-v-css-polnoe-rukovodstvo-s-primerami) станет для вас незаменимым помощником. На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Указание формы и размера градиента

### Форма градиента

Форма градиента может быть круговой (`circle`) или эллиптической (`ellipse`). По умолчанию, если форма не указана, градиент будет эллиптическим.

```css
background-image: radial-gradient(circle, red, yellow, green);
background-image: radial-gradient(ellipse, red, yellow, green);

```

### Размер градиента

Размер градиента может быть задан ключевыми словами (`closest-side`, `farthest-side`, `closest-corner`, `farthest-corner`) или конкретными значениями (например, пиксели или проценты).

```css
background-image: radial-gradient(circle closest-side, red, blue);
background-image: radial-gradient(circle farthest-corner, red, blue);

```

## Положение центра градиента

Центр градиента можно задать с помощью ключевых слов (например, `center`, `top`, `bottom`, `left`, `right`) или конкретных координат (например, в процентах или пикселях).

```css
background-image: radial-gradient(circle at center, red, blue);
background-image: radial-gradient(circle at 50% 50%, red, blue);
background-image: radial-gradient(circle at top left, red, blue);

```

## Точки остановки цвета

### Основные точки остановки

Цвета в градиенте могут располагаться в определённых точках, что позволяет создавать более сложные переходы. По умолчанию цвета равномерно распределяются от центра к краям градиента.

```css
background-image: radial-gradient(circle, red 0%, yellow 50%, green 100%);

```

В этом примере жёлтый цвет занимает середину градиента, создавая переход от красного к зелёному через жёлтый.

### Использование нескольких цветов

Можно использовать больше двух цветов для создания многоцветного градиента.

```css
background-image: radial-gradient(circle, red, yellow, green, blue);

```

## Примеры использования

### Создание радиального градиента для фона кнопки

```css
button {
    background-image: radial-gradient(circle, #ff7e5f, #feb47b);
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
}

```

### Градиентный фон для блока

```css
div.gradient-box {
    background-image: radial-gradient(ellipse at center, #ff7e5f, #feb47b);
    padding: 20px;
    border-radius: 5px;
    color: white;
}

```

### Радиальный градиент с заданным размером и положением

```css
div.custom-gradient {
    background-image: radial-gradient(circle farthest-corner at 70% 30%, #ff7e5f, #feb47b);
    height: 200px;
    width: 100%;
}

```

## Заключение

Функция `radial-gradient()` в CSS предоставляет мощные возможности для создания визуально привлекательных фонов с круговыми переходами цветов. С её помощью можно легко задавать форму, размер и положение градиента, а также управлять точками остановки цвета. Освоив эту функцию, вы сможете значительно улучшить внешний вид своих веб-страниц и добавить им стильных и динамичных элементов.

Освоив `radial-gradient`, вы сможете создавать потрясающие визуальные эффекты, но для создания полноценных веб-страниц необходимо знание и других техник, таких как Flexbox и Grid. Чтобы комплексно прокачать свои навыки в веб-разработке, рассмотрите наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=funktsiia-radial-gradient-v-css-polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
