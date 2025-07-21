---
metaTitle: Управление трансформациями дочерних элементов с помощью transform-style в CSS
metaDescription: Узнайте, как использовать свойство transform-style в CSS для контроля над трансформациями дочерних элементов вместе с родителем. Полное руководство с примерами.
author: Дмитрий Нечаев
title: Полное руководство по свойству transform-style в CSS
preview: Откройте для себя возможности свойства transform-style в CSS и научитесь управлять трансформациями дочерних элементов вместе с родителем. Примеры и советы.
---

Свойство `transform-style` в CSS позволяет управлять тем, будут ли дочерние элементы трансформироваться вместе с родительским элементом или нет. Это свойство особенно полезно при работе с трехмерными трансформациями. В этой статье мы подробно рассмотрим, как использовать `transform-style`, его синтаксис и примеры применения.

**Что такое transform-style?**

Свойство `transform-style` определяет, как будут отображаться дочерние элементы при применении трансформаций к их родительскому элементу. Оно имеет два значения: `flat` и `preserve-3d`.

**Синтаксис**

```css
transform-style: flat | preserve-3d;
```

- `flat`: Значение по умолчанию. Дочерние элементы не сохраняют свои трехмерные трансформации и отображаются в плоскости родительского элемента.
- `preserve-3d`: Дочерние элементы сохраняют свои трехмерные трансформации и отображаются в трехмерном пространстве родительского элемента.

**Пример использования**

Рассмотрим пример, где мы применяем трехмерную трансформацию к родительскому элементу и управляем отображением дочерних элементов с помощью `transform-style`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transform Style Example</title>
    <style>
        .container {
            width: 200px;
            height: 200px;
            margin: 50px;
            perspective: 1000px;
            transform: rotateY(45deg);
        }

        .flat {
            transform-style: flat;
            background-color: lightblue;
        }

        .preserve-3d {
            transform-style: preserve-3d;
            background-color: lightgreen;
        }

        .box {
            width: 100px;
            height: 100px;
            background-color: red;
            margin: 10px;
            transform: rotateX(45deg);
        }
    </style>
</head>
<body>
    <div class="container flat">
        <div class="box"></div>
    </div>

    <div class="container preserve-3d">
        <div class="box"></div>
    </div>
</body>
</html>
```

В этом примере у нас есть два контейнера: один с `transform-style: flat`, другой с `transform-style: preserve-3d`. Оба контейнера имеют дочерний элемент `.box`, который подвергается трехмерной трансформации. Разница в том, что при `transform-style: flat` дочерний элемент будет отображаться в плоскости родительского элемента, тогда как при `transform-style: preserve-3d` дочерний элемент сохранит свою трехмерную трансформацию.

Использование `transform-style` открывает двери к созданию сложных 3D-трансформаций, но для достижения впечатляющих результатов важно понимать принципы работы с пространством и уметь комбинировать различные CSS-свойства. Если вы хотите детальнее погрузиться в мир трансформаций и анимаций — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=polnoe-rukovodstvo-po-svoystvu-transform-style-v-css). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

**Подробное объяснение**

1. **flat**: Значение по умолчанию, при котором все дочерние элементы будут отрисованы в плоскости родительского элемента. Это означает, что любые трехмерные трансформации, примененные к дочерним элементам, будут проигнорированы.

2. **preserve-3d**: Это значение позволяет дочерним элементам сохранять свои трехмерные трансформации, создавая иллюзию глубины и пространства. Когда используется `preserve-3d`, трехмерные трансформации дочерних элементов будут видны, как если бы они находились в одном трехмерном пространстве с родительским элементом.

**Рассмотрим более сложный пример**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transform Style Complex Example</title>
    <style>
        .scene {
            width: 300px;
            height: 300px;
            margin: 50px;
            perspective: 800px;
        }

        .cube {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            animation: rotate 5s infinite linear;
        }

        .face {
            position: absolute;
            width: 300px;
            height: 300px;
            background: rgba(255, 0, 0, 0.7);
            border: 2px solid black;
        }

        .front  { transform: translateZ(150px); }
        .back   { transform: rotateY(180deg) translateZ(150px); }
        .right  { transform: rotateY(90deg) translateZ(150px); }
        .left   { transform: rotateY(-90deg) translateZ(150px); }
        .top    { transform: rotateX(90deg) translateZ(150px); }
        .bottom { transform: rotateX(-90deg) translateZ(150px); }

        @keyframes rotate {
            from { transform: rotateX(0) rotateY(0); }
            to { transform: rotateX(360deg) rotateY(360deg); }
        }
    </style>
</head>
<body>
    <div class="scene">
        <div class="cube">
            <div class="face front"></div>
            <div class="face back"></div>
            <div class="face right"></div>
            <div class="face left"></div>
            <div class="face top"></div>
            <div class="face bottom"></div>
        </div>
    </div>
</body>
</html>
```

В этом примере создается вращающийся куб, каждая сторона которого является дочерним элементом с трехмерными трансформациями. Свойство `transform-style: preserve-3d` для элемента `.cube` позволяет каждой грани куба сохранять свои трансформации, создавая иллюзию настоящего куба.

**Заключение**

Свойство `transform-style` в CSS является важным инструментом для управления тем, как будут отображаться дочерние элементы при применении трансформаций к родительскому элементу. Оно позволяет создать сложные трехмерные эффекты и точно контролировать отображение элементов. Использование `transform-style: preserve-3d` открывает широкие возможности для создания интерактивных и визуально привлекательных веб-страниц. Надеюсь, это руководство помогло вам лучше понять, как эффективно использовать `transform-style` в ваших проектах.

Свойство `transform-style` позволяет создавать интересные визуальные эффекты, однако для создания сложных и интерактивных интерфейсов этого недостаточно. Освоив все возможности HTML и CSS, вы сможете создавать удивительные веб-страницы. Начните свое путешествие в мир веб-разработки с нашим курсом [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=polnoe-rukovodstvo-po-svoystvu-transform-style-v-css). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
