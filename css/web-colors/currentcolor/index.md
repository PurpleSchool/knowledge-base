---
metaTitle: currentColor в CSS - Полное руководство с примерами
metaDescription: CSS предоставляет множество полезных свойств и ключевых слов для управления стилями на веб-страницах. Одним из таких ключевых слов является currentColor, которое позволяет унаследовать цвет текста родительского элемента.
author: Дмитрий Нечаев
title: currentColor в CSS - Полное руководство с примерами
preview: CSS предоставляет множество полезных свойств и ключевых слов для управления стилями на веб-страницах. Одним из таких ключевых слов является currentColor, которое позволяет унаследовать цвет текста родительского элемента.
---

CSS предоставляет множество полезных свойств и ключевых слов для управления стилями на веб-страницах. Одним из таких ключевых слов является `currentColor`, которое позволяет унаследовать цвет текста родительского элемента. Это мощный и удобный инструмент для стилизации, который помогает сделать код более чистым и легко поддерживаемым. В этой статье мы подробно рассмотрим, что такое `currentColor`, и приведём примеры его использования.

## Основы `currentColor`

Ключевое слово `currentColor` относится к текущему значению свойства `color` элемента. Оно может быть использовано в любых CSS-свойствах, которые принимают значение цвета, таких как `background-color`, `border-color`, `box-shadow`, и т.д. Применение `currentColor` позволяет элементам автоматически подстраиваться под цвет текста, заданный родительским элементом, что упрощает управление стилями и поддерживает согласованность дизайна.

### Пример базового использования `currentColor`

```css
.parent {
    color: blue;
}

.child {
    border: 2px solid currentColor;
}

```

В этом примере цвет границы элемента с классом `child` будет синим, так как он наследует значение `color` от родительского элемента с классом `parent`.

Использование `currentColor` упрощает поддержку единого стиля для вашего сайта. Для гибкой работы с CSS необходимо знать все его возможности. Если вы хотите детальнее погрузиться в тонкости работы со стилями — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=currentcolor-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Преимущества использования `currentColor`

### Упрощение управления стилями

Использование `currentColor` позволяет легко поддерживать согласованность цвета в различных элементах. Это особенно полезно при работе с темами и кастомными компонентами.

### Снижение избыточности кода

С `currentColor` нет необходимости повторно задавать один и тот же цвет для разных свойств элемента. Это делает код более чистым и компактным.

### Динамическое изменение цвета

При изменении значения свойства `color` родительского элемента все дочерние элементы, использующие `currentColor`, автоматически обновляют свои цвета, что упрощает процесс изменения стилей.

## Примеры использования `currentColor`

### Пример 1: Стилизация границ и фона

```css
.card {
    color: darkred;
    border: 1px solid currentColor;
    background-color: currentColor;
}

```

В этом примере цвет границы и фона элемента с классом `card` будет совпадать с цветом текста.

### Пример 2: Использование `currentColor` в псевдоэлементах

```css
.button {
    color: #2c3e50;
    position: relative;
}

.button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: currentColor;
    opacity: 0.2;
}

```

В этом примере псевдоэлемент `::before` будет иметь полупрозрачный фон, совпадающий с цветом текста кнопки.

### Пример 3: Стилизация иконок

```css
.icon {
    color: green;
}

.icon svg {
    fill: currentColor;
}

```

В этом примере цвет заливки SVG-иконки будет совпадать с цветом текста элемента с классом `icon`.

## Применение `currentColor` в различных свойствах

### Пример 4: Тени

```css
.text-shadow {
    color: navy;
    text-shadow: 2px 2px 4px currentColor;
}

```

### Пример 5: Обводка текста

```css
.text-stroke {
    color: darkorange;
    -webkit-text-stroke: 1px currentColor; /* для поддержки в Webkit браузерах */
    text-stroke: 1px currentColor;
}

```

### Пример 6: Границы и декоративные элементы

```css
.box {
    color: teal;
    border: 3px dotted currentColor;
    box-shadow: 0 0 10px currentColor;
}

```

## Заключение

Ключевое слово `currentColor` в CSS предоставляет удобный и мощный способ унаследовать цвет текста родительского элемента. Оно упрощает управление стилями, снижает избыточность кода и позволяет динамически изменять цвета. Использование `currentColor` делает ваш CSS-код более чистым, поддерживаемым и согласованным, что особенно важно в крупных и сложных проектах. Освоив применение `currentColor`, вы сможете более эффективно управлять цветами и создавать стильные и функциональные веб-страницы.

`currentColor` – отличный инструмент, однако это лишь часть огромного мира CSS. Овладев всеми возможностями CSS, вы сможете создавать по-настоящему впечатляющие веб-страницы. Начните свое путешествие в мир стилей с нашим курсом [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=currentcolor-v-css-polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
