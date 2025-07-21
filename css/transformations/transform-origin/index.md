---
metaTitle: Как использовать transform-origin в CSS
metaDescription: Узнайте, как управлять точкой опоры трансформаций элементов с помощью свойства transform-origin в CSS. Полное руководство с примерами.
author: Дмитрий Нечаев
title: Управление точкой опоры трансформаций в CSS с помощью transform-origin
preview: Откройте для себя возможности свойства transform-origin в CSS и научитесь управлять точкой опоры для трансформаций элементов. Примеры и советы.
---

Свойство `transform-origin` в CSS играет ключевую роль в управлении точкой, относительно которой применяются трансформации к элементам. Это свойство позволяет задать точку опоры, вокруг которой будут происходить повороты, масштабирование и другие преобразования. В этой статье мы подробно рассмотрим, как использовать `transform-origin`, его синтаксис и примеры применения.

**Что такое transform-origin?**

Свойство `transform-origin` в CSS задает точку опоры для трансформаций элемента. По умолчанию точка опоры находится в центре элемента (50% 50%), но вы можете изменить ее, чтобы трансформации происходили относительно любой другой точки.

**Синтаксис**

```css
transform-origin: x-axis y-axis z-axis;
```

- `x-axis`: Позиция по оси X (может быть задана в процентах, пикселях или других единицах измерения).
- `y-axis`: Позиция по оси Y (может быть задана в процентах, пикселях или других единицах измерения).
- `z-axis` (необязательно): Позиция по оси Z для трехмерных трансформаций.

**Пример использования**

Рассмотрим простой пример, где мы изменяем точку опоры для поворота элемента:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transform Origin Example</title>
    <style>
        .box {
            width: 100px;
            height: 100px;
            background-color: blue;
            margin: 50px;
            transition: transform 0.5s;
        }

        .rotate-center {
            transform-origin: 50% 50%;
            transform: rotate(45deg);
        }

        .rotate-top-left {
            transform-origin: 0% 0%;
            transform: rotate(45deg);
        }

        .rotate-bottom-right {
            transform-origin: 100% 100%;
            transform: rotate(45deg);
        }
    </style>
</head>
<body>
    <div class="box rotate-center"></div>
    <div class="box rotate-top-left"></div>
    <div class="box rotate-bottom-right"></div>
</body>
</html>
```

В этом примере мы видим три квадрата, каждый из которых поворачивается вокруг разных точек опоры: центр, верхний левый угол и нижний правый угол.

`transform-origin` - это мощный инструмент для создания более контролируемых и интересных трансформаций. Для уверенного управления веб-дизайном, необходимо знать и другие возможности CSS. Если вы хотите детальнее погрузиться в мир стилей и освоить все возможности CSS — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=upravlenie-tochkoy-opory-transformatsiy-v-css-s-pomoshchyu-transform-origin). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

**Настройка transform-origin**

Вы можете задавать значения для `transform-origin` в различных единицах измерения:

- **Проценты**: Задают положение относительно размеров элемента.
  ```css
  .example1 {
      transform-origin: 25% 75%;
  }
  ```

- **Пиксели**: Задают точное положение относительно левого верхнего угла элемента.
  ```css
  .example2 {
      transform-origin: 30px 40px;
  }
  ```

- **Ключевые слова**: Можно использовать ключевые слова, такие как `top`, `right`, `bottom`, `left`, `center`.
  ```css
  .example3 {
      transform-origin: top left;
  }
  ```

**Трехмерные трансформации**

Для трехмерных трансформаций вы также можете задавать `transform-origin` по оси Z:

```css
.threeD {
    transform-origin: 50% 50% -200px;
    transform: rotateY(45deg);
}
```

**Пример с трехмерной трансформацией**

Рассмотрим пример, в котором используется `transform-origin` для трехмерной трансформации:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Transform Origin Example</title>
    <style>
        .box {
            width: 100px;
            height: 100px;
            background-color: red;
            margin: 50px;
            perspective: 1000px;
            transition: transform 0.5s;
        }

        .rotate3D {
            transform-origin: 50% 50% -50px;
            transform: rotateY(45deg);
        }
    </style>
</head>
<body>
    <div class="box rotate3D"></div>
</body>
</html>
```

В этом примере квадрат поворачивается вокруг точки, находящейся позади элемента, создавая эффект глубины.

**Заключение**

Свойство `transform-origin` в CSS является важным инструментом для управления точкой опоры трансформаций элементов. Оно позволяет точно контролировать, где будут происходить повороты, масштабирование и другие преобразования, что открывает широкие возможности для создания сложных визуальных эффектов. Использование `transform-origin` помогает сделать анимации и трансформации более гибкими и точными. Надеюсь, это руководство помогло вам понять, как эффективно использовать `transform-origin` в ваших проектах.

Управление точкой опоры трансформаций — это лишь одна из множества возможностей, которые предоставляет CSS для создания привлекательных и интерактивных веб-страниц. Углубите свои знания, чтобы получить больше контроля над веб-дизайном. Начните свое обучение с нашим курсом [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=upravlenie-tochkoy-opory-transformatsiy-v-css-s-pomoshchyu-transform-origin). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
