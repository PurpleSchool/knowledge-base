---
metaTitle: Функция repeating-radial-gradient в CSS. Создание градиента из повторяющихся круговых или эллиптических узоров
metaDescription: Функция repeating-radial-gradient в CSS. Создание градиента из повторяющихся круговых или эллиптических узоров
author: Дмитрий Нечаев
title: Функция repeating-radial-gradient в CSS. Полное руководство с примерами
preview: CSS предоставляет мощные инструменты для создания стильных и сложных фонов. Одним из таких инструментов является функция repeating-radial-gradient, которая позволяет создавать градиенты из повторяющихся круговых или эллиптических узоров.
---

CSS предоставляет мощные инструменты для создания стильных и сложных фонов. Одним из таких инструментов является функция `repeating-radial-gradient()`, которая позволяет создавать градиенты из повторяющихся круговых или эллиптических узоров. Эта функция может добавить глубину и визуальный интерес к веб-странице. В этой статье мы подробно рассмотрим, как работает `repeating-radial-gradient()`, и приведём примеры её использования в различных сценариях.

## Основы `repeating-radial-gradient()`

Функция `repeating-radial-gradient()` создаёт повторяющийся радиальный градиент, который можно использовать в качестве значения свойства `background-image`. Основной синтаксис функции выглядит следующим образом:

```css
background-image: repeating-radial-gradient(shape size at position, color-stop1, color-stop2, ...);

```

- `shape` — форма градиента (например, `circle` или `ellipse`).
- `size` — размер градиента.
- `position` — положение центра градиента.
- `color-stop` — точки остановки цвета, определяющие, где и как цвета должны переходить друг в друга.

### Пример простого повторяющегося радиального градиента

```css
background-image: repeating-radial-gradient(circle, red, yellow 10%, green 20%);

```

В этом примере создаётся радиальный градиент круговой формы, который повторяется каждые 20% ширины элемента, создавая узор из красного, жёлтого и зелёного цветов.

## Указание формы и размера градиента

### Форма градиента

Форма градиента может быть круговой (`circle`) или эллиптической (`ellipse`). По умолчанию, если форма не указана, градиент будет эллиптическим.

```css
background-image: repeating-radial-gradient(circle, red, yellow, green);
background-image: repeating-radial-gradient(ellipse, red, yellow, green);

```

### Размер градиента

Размер градиента может быть задан ключевыми словами (`closest-side`, `farthest-side`, `closest-corner`, `farthest-corner`) или конкретными значениями (например, пиксели или проценты).

```css
background-image: repeating-radial-gradient(circle closest-side, red, blue);
background-image: repeating-radial-gradient(circle farthest-corner, red, blue);

```

## Положение центра градиента

Центр градиента можно задать с помощью ключевых слов (например, `center`, `top`, `bottom`, `left`, `right`) или конкретных координат (например, в процентах или пикселях).

```css
background-image: repeating-radial-gradient(circle at center, red, blue);
background-image: repeating-radial-gradient(circle at 50% 50%, red, blue);
background-image: repeating-radial-gradient(circle at top left, red, blue);

```

## Точки остановки цвета

### Основные точки остановки

Цвета в градиенте могут располагаться в определённых точках, что позволяет создавать более сложные узоры. По умолчанию цвета равномерно распределяются от центра к краям градиента.

```css
background-image: repeating-radial-gradient(circle, red 0%, yellow 10%, green 20%);

```

В этом примере жёлтый цвет занимает 10% радиуса градиента, создавая повторяющийся узор.

### Использование нескольких цветов

Можно использовать больше двух цветов для создания многоцветного повторяющегося градиента.

```css
background-image: repeating-radial-gradient(circle, red, yellow 10%, green 20%, blue 30%);

```

## Примеры использования

### Создание радиального градиента для фона кнопки

```css
button {
    background-image: repeating-radial-gradient(circle, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
}

```

### Градиентный фон для блока

```css
div.gradient-box {
    background-image: repeating-radial-gradient(ellipse at center, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    padding: 20px;
    border-radius: 5px;
    color: white;
}

```

### Радиальный градиент с заданным размером и положением

```css
div.custom-gradient {
    background-image: repeating-radial-gradient(circle farthest-corner at 70% 30%, #ff7e5f, #feb47b 10%, #ff7e5f 20%);
    height: 200px;
    width: 100%;
}

```

## Создание узоров с помощью `repeating-radial-gradient()`

### Полосы

```css
div.stripes {
    background-image: repeating-radial-gradient(circle at center, black, white 10px, black 20px);
    height: 200px;
    width: 100%;
}

```

### Шахматный узор

```css
div.checkerboard {
    background-image: repeating-radial-gradient(circle at center, #000000, #000000 25px, #ffffff 25px, #ffffff 50px);
    height: 200px;
    width: 100%;
}

```

## Заключение

Функция `repeating-radial-gradient()` в CSS предоставляет мощные возможности для создания визуально привлекательных фонов с повторяющимися круговыми или эллиптическими узорами. С её помощью можно легко задавать форму, размер и положение градиента, а также управлять точками остановки цвета. Освоив эту функцию, вы сможете значительно улучшить внешний вид своих веб-страниц и добавить им стильных и динамичных элементов.