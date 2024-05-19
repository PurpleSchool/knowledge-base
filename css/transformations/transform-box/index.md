---
metaTitle: Управление областью трансформации элементов с помощью transform-box в CSS
metaDescription: Узнайте, как использовать свойство transform-box в CSS для определения области элемента, к которой применяются свойства трансформации. Подробное руководство с примерами.
author: Дмитрий Нечаев
title: Полное руководство по свойству transform-box в CSS
preview: Откройте для себя возможности свойства transform-box в CSS и научитесь управлять областью трансформации элементов. Примеры и советы.
---

Свойство `transform-box` в CSS позволяет определить, к какой области элемента будут применяться трансформации. Это свойство играет важную роль при создании сложных анимаций и эффектов, так как позволяет точно контролировать, как трансформации влияют на элемент. В этой статье мы подробно рассмотрим, как использовать `transform-box`, его синтаксис и примеры применения.

**Что такое transform-box?**

Свойство `transform-box` определяет область элемента, которая будет использоваться для расчета трансформаций. Оно может принимать одно из трех значений: `border-box`, `fill-box` и `view-box`.

**Синтаксис**

```css
transform-box: border-box | fill-box | view-box;
```

- `border-box`: Трансформации применяются к области, включающей границы элемента.
- `fill-box`: Трансформации применяются к области, ограниченной содержимым элемента.
- `view-box`: Трансформации применяются к области видимого содержимого элемента (актуально для SVG).

**Пример использования**

Рассмотрим пример, где мы применяем разные значения `transform-box` к элементам, чтобы увидеть разницу в их трансформации.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transform Box Example</title>
    <style>
        .container {
            display: flex;
            justify-content: space-around;
            margin: 50px;
        }

        .box {
            width: 100px;
            height: 100px;
            border: 5px solid black;
            background-color: lightblue;
            transform: rotate(45deg);
        }

        .border-box {
            transform-box: border-box;
        }

        .fill-box {
            transform-box: fill-box;
        }

        .view-box {
            width: 100px;
            height: 100px;
            transform-box: view-box;
        }

        svg {
            width: 100px;
            height: 100px;
            border: 1px solid black;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="box border-box">Border Box</div>
        <div class="box fill-box">Fill Box</div>
    </div>
    <div class="container">
        <svg class="view-box" viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="80" fill="lightgreen" />
        </svg>
    </div>
</body>
</html>
```

В этом примере у нас есть два блока и один SVG-элемент, к которым применены разные значения `transform-box`. Первый блок использует `border-box`, второй — `fill-box`, а SVG-элемент — `view-box`.

**Подробное объяснение значений transform-box**

1. **border-box**: Трансформации применяются к области элемента, включая его границы. Это значение по умолчанию для большинства HTML-элементов.
   ```css
   .example-border {
       transform-box: border-box;
   }
   ```

2. **fill-box**: Трансформации применяются к области содержимого элемента, исключая границы. Это значение по умолчанию для SVG-элементов.
   ```css
   .example-fill {
       transform-box: fill-box;
   }
   ```

3. **view-box**: Трансформации применяются к области, определенной атрибутом `viewBox` для SVG-элементов.
   ```css
   .example-view {
       transform-box: view-box;
   }
   ```

**Пример с SVG и transform-box**

Рассмотрим более сложный пример с использованием SVG и различными значениями `transform-box`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Transform Box Example</title>
    <style>
        svg {
            width: 150px;
            height: 150px;
            border: 1px solid black;
            margin: 20px;
        }

        .svg-border-box {
            transform-box: border-box;
            transform: rotate(45deg);
        }

        .svg-fill-box {
            transform-box: fill-box;
            transform: rotate(45deg);
        }

        .svg-view-box {
            transform-box: view-box;
            transform: rotate(45deg);
        }
    </style>
</head>
<body>
    <svg class="svg-border-box" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="red" />
    </svg>
    <svg class="svg-fill-box" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="green" />
    </svg>
    <svg class="svg-view-box" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="blue" />
    </svg>
</body>
</html>
```

В этом примере три SVG-элемента, каждый из которых использует разные значения `transform-box`. Мы можем видеть, как трансформации влияют на их отображение в зависимости от выбранного значения.

**Заключение**

Свойство `transform-box` в CSS является мощным инструментом для управления областью элемента, к которой применяются трансформации. Оно позволяет точно контролировать, как трансформации будут влиять на элемент и его содержимое, что особенно важно при работе с SVG и сложными анимациями. Использование `transform-box` открывает дополнительные возможности для создания визуально привлекательных и интерактивных веб-страниц. Надеюсь, это руководство помогло вам лучше понять, как эффективно использовать `transform-box` в ваших проектах.