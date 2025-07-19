---
metaTitle: Управление видимостью задней стороны элементов с помощью backface-visibility в CSS
metaDescription: Узнайте, как использовать свойство backface-visibility в CSS для управления видимостью задней стороны элементов при 3D-трансформациях. Полное руководство с примерами.
author: Дмитрий Нечаев
title: Полное руководство по свойству backface-visibility в CSS
preview: Откройте для себя возможности свойства backface-visibility в CSS и научитесь управлять видимостью задней стороны элементов при 3D-трансформациях. Примеры и советы.
---

При создании трехмерных трансформаций в CSS важно учитывать видимость задней стороны элементов. Свойство `backface-visibility` позволяет управлять тем, будет ли видна задняя сторона элемента при его поворотах и других 3D-трансформациях. В этой статье мы подробно рассмотрим, как использовать `backface-visibility`, его синтаксис и примеры применения.

**Что такое backface-visibility?**

Свойство `backface-visibility` в CSS определяет, должна ли быть видна задняя сторона элемента, когда он повернут к зрителю задней стороной. Это свойство особенно полезно при создании вращающихся карточек или других трехмерных объектов, где требуется скрыть или показать обратную сторону элемента.

**Синтаксис**

```css
backface-visibility: visible | hidden;
```

- `visible`: Задняя сторона элемента видна (значение по умолчанию).
- `hidden`: Задняя сторона элемента скрыта.

**Пример использования**

Рассмотрим пример, где мы применяем `backface-visibility` к элементу, чтобы скрыть его заднюю сторону при вращении:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backface Visibility Example</title>
    <style>
        .container {
            width: 200px;
            height: 200px;
            perspective: 600px;
            margin: 50px auto;
        }

        .box {
            width: 100%;
            height: 100%;
            background-color: lightblue;
            transform: rotateY(0deg);
            transition: transform 1s;
            transform-style: preserve-3d;
            position: relative;
        }

        .box:hover {
            transform: rotateY(180deg);
        }

        .box .back {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: lightcoral;
            transform: rotateY(180deg);
            backface-visibility: hidden;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="box">
            <div class="front">Front</div>
            <div class="back">Back</div>
        </div>
    </div>
</body>
</html>
```

В этом примере контейнер `.container` создает перспективу для элемента `.box`. При наведении курсора на `.box` элемент вращается на 180 градусов по оси Y, и задняя сторона скрывается благодаря `backface-visibility: hidden`.

Свойство `backface-visibility` играет важную роль в управлении видимостью задней стороны элементов при 3D-трансформациях. Тем не менее, для эффективного использования этого свойства и создания сложных анимаций необходимо глубокое понимание основ CSS, включая блочную модель, каскад и селекторы. Без этих знаний работа с 3D-трансформациями может быть сложной и непредсказуемой. Если вы хотите детальнее изучить CSS и научиться создавать профессиональные веб-интерфейсы, — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=polnoe-rukovodstvo-po-svoystvu-backface-visibility-v-css). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

**Детальное объяснение свойств**

1. **visible**: Значение по умолчанию, при котором задняя сторона элемента будет видна при повороте. Это полезно, если вы хотите, чтобы задняя сторона элемента отображалась при вращении.
   ```css
   .element {
       backface-visibility: visible;
   }
   ```

2. **hidden**: Скрывает заднюю сторону элемента при повороте. Это значение используется, когда нужно скрыть обратную сторону элемента для создания более реалистичного эффекта.
   ```css
   .element {
       backface-visibility: hidden;
   }
   ```

**Пример с несколькими элементами**

Рассмотрим пример, где у нас есть несколько элементов, каждый из которых использует разные значения `backface-visibility`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backface Visibility Comparison</title>
    <style>
        .container {
            width: 200px;
            height: 200px;
            perspective: 600px;
            margin: 50px auto;
            display: flex;
            justify-content: space-around;
        }

        .box {
            width: 100px;
            height: 100px;
            transform: rotateY(0deg);
            transition: transform 1s;
            transform-style: preserve-3d;
            position: relative;
        }

        .box:hover {
            transform: rotateY(180deg);
        }

        .box .front,
        .box .back {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
        }

        .box .front {
            background-color: lightblue;
        }

        .box .back {
            background-color: lightcoral;
            transform: rotateY(180deg);
        }

        .visible .back {
            backface-visibility: visible;
        }

        .hidden .back {
            backface-visibility: hidden;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="box visible">
            <div class="front">Front</div>
            <div class="back">Back</div>
        </div>
        <div class="box hidden">
            <div class="front">Front</div>
            <div class="back">Back</div>
        </div>
    </div>
</body>
</html>
```

В этом примере первый блок с классом `visible` показывает заднюю сторону элемента при вращении, тогда как второй блок с классом `hidden` скрывает заднюю сторону.

**Заключение**

Свойство `backface-visibility` в CSS предоставляет разработчикам возможность управлять видимостью задней стороны элементов при их 3D-трансформациях. Это свойство важно учитывать при создании сложных анимаций и интерактивных элементов, чтобы обеспечить правильное отображение и реализм. Использование `backface-visibility` позволяет создавать более профессиональные и визуально привлекательные веб-страницы. Надеюсь, это руководство помогло вам лучше понять, как эффективно использовать `backface-visibility` в ваших проектах.

`backface-visibility` – это ценный инструмент для создания интересных 3D-эффектов, но он является лишь частью огромного мира веб-разработки. Для создания привлекательных и функциональных веб-сайтов необходимо освоить множество других технологий и инструментов. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=polnoe-rukovodstvo-po-svoystvu-backface-visibility-v-css) вы получите прочную основу в HTML и CSS, а также изучите современные методы верстки и анимации. В первых 3 модулях уже доступно бесплатное содержание — начните прямо сейчас.
