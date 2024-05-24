---
metaTitle: Функция repeating-conic-gradient в CSS. Создание повторяющегося конического градиента
metaDescription: Функция repeating-conic-gradient в CSS. Создание повторяющегося конического градиента
author: Дмитрий Нечаев
title: Функция repeating-conic-gradient в CSS. Полное руководство с примерами
preview: CSS предлагает множество инструментов для создания разнообразных визуальных эффектов, и одним из таких инструментов является функция repeating-conic-gradient.
---

CSS предлагает множество инструментов для создания разнообразных визуальных эффектов, и одним из таких инструментов является функция `repeating-conic-gradient()`. Эта функция позволяет создавать повторяющиеся конические градиенты, которые могут добавить уникальные узоры и текстуры на веб-страницу. В этой статье мы подробно рассмотрим, как работает `repeating-conic-gradient()`, и приведём примеры её использования.

## Основы `repeating-conic-gradient()`

Функция `repeating-conic-gradient()` создаёт повторяющийся конический градиент, который можно использовать в качестве значения свойства `background-image`. Основной синтаксис функции выглядит следующим образом:

```css
background-image: repeating-conic-gradient(from angle at position, color-stop1, color-stop2, ...);

```

- `from angle` — начальный угол градиента.
- `position` — положение центральной точки градиента.
- `color-stop` — точки остановки цвета, определяющие, где и как цвета должны переходить друг в друга.

### Пример простого повторяющегося конического градиента

```css
background-image: repeating-conic-gradient(red, yellow 20%, green 40%);

```

В этом примере создаётся конический градиент, который повторяется каждые 40% угла, создавая узор из красного, жёлтого и зелёного цветов.

## Указание начального угла и позиции градиента

### Начальный угол

Начальный угол градиента указывается с помощью ключевого слова `from` и значения в градусах. По умолчанию градиент начинается с 0 градусов (верх элемента).

```css
background-image: repeating-conic-gradient(from 45deg, red, yellow 20%, green 40%);

```

В этом примере градиент начинается с угла 45 градусов.

### Позиция градиента

Позиция центральной точки градиента указывается с помощью ключевого слова `at` и значения координат (например, в процентах или пикселях). По умолчанию градиент центрируется в середине элемента.

```css
background-image: repeating-conic-gradient(at 50% 50%, red, yellow, green);
background-image: repeating-conic-gradient(at top left, red, yellow, green);

```

## Точки остановки цвета

### Основные точки остановки

Цвета в градиенте могут располагаться в определённых точках, что позволяет создавать более сложные узоры. По умолчанию цвета равномерно распределяются по окружности градиента.

```css
background-image: repeating-conic-gradient(red 0%, yellow 25%, green 50%, blue 75%, red 100%);

```

В этом примере жёлтый цвет занимает четверть окружности градиента, зелёный — половину, синий — три четверти, и снова красный завершает круг.

### Использование нескольких цветов

Можно использовать больше двух цветов для создания многоцветного повторяющегося градиента.

```css
background-image: repeating-conic-gradient(red, yellow 10%, green 20%, blue 30%, purple 40%);

```

## Примеры использования

### Создание повторяющегося конического градиента для фона кнопки

```css
button {
    background-image: repeating-conic-gradient(from 0deg at center, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
}

```

### Градиентный фон для блока

```css
div.gradient-box {
    background-image: repeating-conic-gradient(at center, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    padding: 20px;
    border-radius: 5px;
    color: white;
}

```

### Повторяющийся конический градиент с заданным углом и положением

```css
div.custom-gradient {
    background-image: repeating-conic-gradient(from 90deg at 50% 50%, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    height: 200px;
    width: 100%;
}

```

## Создание узоров с помощью `repeating-conic-gradient()`

### Полосатый узор

```css
div.striped-pattern {
    background-image: repeating-conic-gradient(black 0deg 10deg, white 10deg 20deg);
    height: 200px;
    width: 200px;
    border-radius: 50%;
}

```

### Цветочный узор

```css
div.flower-pattern {
    background-image: repeating-conic-gradient(from 0deg, red 0deg 15deg, yellow 15deg 30deg, green 30deg 45deg, blue 45deg 60deg, purple 60deg 75deg);
    height: 200px;
    width: 200px;
    border-radius: 50%;
}

```

## Заключение

Функция `repeating-conic-gradient()` в CSS предоставляет мощные возможности для создания визуально привлекательных фонов с повторяющимися коническими узорами. С её помощью можно легко задавать начальный угол, позицию градиента и управлять точками остановки цвета. Освоив эту функцию, вы сможете значительно улучшить внешний вид своих веб-страниц и добавить им стильных и динамичных элементов.