---
metaTitle: Управление точкой обзора с помощью свойства perspective-origin в CSS
metaDescription: Узнайте, как использовать свойство perspective-origin в CSS для определения позиции смотрящего по отношению к 3D-объекту. Полное руководство с примерами.
author: Дмитрий Нечаев
title: Полное руководство по свойству perspective-origin в CSS
preview: Откройте для себя возможности свойства perspective-origin в CSS и научитесь управлять точкой обзора для 3D-объектов. Примеры и советы по применению.
---

Свойство `perspective-origin` в CSS позволяет управлять точкой, из которой пользователь наблюдает трехмерный объект. Это свойство определяет позицию наблюдателя относительно элемента с примененной перспективой, создавая тем самым различные визуальные эффекты. В этой статье мы подробно рассмотрим, как использовать `perspective-origin`, его синтаксис и примеры применения.

**Что такое perspective-origin?**

Свойство `perspective-origin` задает позицию точки обзора, из которой наблюдается перспектива для элементов с трехмерными трансформациями. Оно позволяет изменять точку, вокруг которой создается иллюзия глубины и объема.

**Синтаксис**

```css
perspective-origin: x-axis y-axis;
```

- `x-axis`: Позиция по горизонтальной оси (может быть задана в процентах или пикселях).
- `y-axis`: Позиция по вертикальной оси (может быть задана в процентах или пикселях).

**Пример использования**

Рассмотрим пример, где мы применяем `perspective-origin` к контейнеру с трехмерными элементами:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perspective Origin Example</title>
    <style>
        .container {
            width: 300px;
            height: 300px;
            margin: 50px;
            perspective: 600px;
            perspective-origin: 50% 50%;
        }

        .box {
            width: 100px;
            height: 100px;
            background-color: lightblue;
            transform: rotateY(45deg);
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="box"></div>
    </div>
</body>
</html>
```

В этом примере контейнер `.container` имеет свойство `perspective: 600px` и `perspective-origin: 50% 50%`, что задает точку обзора в центре контейнера.

**Изменение позиции точки обзора**

Вы можете изменять значения `perspective-origin`, чтобы увидеть, как меняется перспектива:

1. **По центру** (значение по умолчанию):
   ```css
   .container {
       perspective-origin: 50% 50%;
   }
   ```

2. **Слева сверху**:
   ```css
   .container {
       perspective-origin: 0% 0%;
   }
   ```

3. **Справа снизу**:
   ```css
   .container {
       perspective-origin: 100% 100%;
   }
   ```

**Пример с разными значениями perspective-origin**

Рассмотрим пример с несколькими контейнерами, чтобы увидеть разницу в эффектах при различных значениях `perspective-origin`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perspective Origin Comparison</title>
    <style>
        .container {
            width: 200px;
            height: 200px;
            margin: 50px;
            perspective: 500px;
            display: inline-block;
        }

        .box {
            width: 100px;
            height: 100px;
            background-color: lightblue;
            transform: rotateY(45deg);
            transform-style: preserve-3d;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container" style="perspective-origin: 0% 0%;">
        <div class="box"></div>
    </div>
    <div class="container" style="perspective-origin: 50% 50%;">
        <div class="box"></div>
    </div>
    <div class="container" style="perspective-origin: 100% 100%;">
        <div class="box"></div>
    </div>
</body>
</html>
```

В этом примере три контейнера с разными значениями `perspective-origin` демонстрируют, как изменяется точка обзора и как это влияет на восприятие трехмерного эффекта.

**Использование с анимациями**

Свойство `perspective-origin` можно использовать и в анимациях для создания динамических эффектов:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perspective Origin Animation</title>
    <style>
        .container {
            width: 200px;
            height: 200px;
            margin: 50px;
            perspective: 500px;
            perspective-origin: 50% 50%;
            animation: move-origin 5s infinite alternate;
        }

        .box {
            width: 100px;
            height: 100px;
            background-color: lightblue;
            transform: rotateY(45deg);
            transform-style: preserve-3d;
            margin: 0 auto;
        }

        @keyframes move-origin {
            0% { perspective-origin: 0% 0%; }
            100% { perspective-origin: 100% 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="box"></div>
    </div>
</body>
</html>
```

В этом примере контейнер анимируется с изменением точки обзора, создавая интересный динамический эффект.

**Заключение**

Свойство `perspective-origin` в CSS предоставляет разработчикам мощный инструмент для управления точкой обзора трехмерных объектов. Оно позволяет точно контролировать, как пользователь будет воспринимать трехмерные эффекты, и добавлять интерактивности и реализма веб-страницам. Использование `perspective-origin` открывает широкие возможности для создания визуально привлекательных интерфейсов и анимаций. Надеюсь, это руководство помогло вам лучше понять, как эффективно использовать `perspective-origin` в ваших проектах.