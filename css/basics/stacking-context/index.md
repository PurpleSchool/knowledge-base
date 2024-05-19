---
metaTitle: Контекст наложения в CSS
metaDescription: Контекст наложения в CSS
author: Дмитрий Нечаев
title: Контекст наложения в CSS. Полное руководство с примерами
preview: В CSS контекст наложения определяет порядок, в котором элементы рисуются на веб-странице.
---

В CSS контекст наложения определяет порядок, в котором элементы рисуются на веб-странице. Когда несколько элементов перекрывают друг друга, важно знать, какой из них будет отображаться сверху, а какой — снизу. Браузер решает это по определённым правилам, и понимание этих правил помогает разработчикам контролировать визуальную иерархию элементов на странице.

## Основные концепции контекста наложения

Контекст наложения создаётся элементами, у которых есть определённые свойства, такие как `position` со значениями `absolute` или `relative`, свойство `opacity` меньше 1, или использование `z-index`. Контексты наложения формируются иерархически, что означает, что каждый новый контекст наложения создаёт отдельную "стековую" группу для своих дочерних элементов.

### Свойство `z-index`

Свойство `z-index` определяет порядок рисования элементов в пределах одного контекста наложения. Элементы с более высоким значением `z-index` будут нарисованы поверх элементов с более низким значением `z-index`.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .box1 {
      position: absolute;
      left: 50px;
      top: 50px;
      width: 100px;
      height: 100px;
      background-color: red;
      z-index: 1;
    }

    .box2 {
      position: absolute;
      left: 100px;
      top: 100px;
      width: 100px;
      height: 100px;
      background-color: blue;
      z-index: 2;
    }
  </style>
  <title>Контекст наложения</title>
</head>
<body>
  <div class="box1"></div>
  <div class="box2"></div>
</body>
</html>

```

В этом примере синий квадрат будет нарисован поверх красного квадрата, так как у него `z-index: 2`, а у красного квадрата `z-index: 1`.

### Создание нового контекста наложения

Новый контекст наложения создаётся в следующих случаях:

1. Элемент позиционирован и имеет свойство `z-index`, отличное от `auto`.
2. Элемент с непрозрачностью (opacity) меньше 1.
3. Элемент с трансформацией (transform), фильтрацией (filter), или с CSS-свойствами, такими как `perspective` или `clip-path`.
4. Элемент с `display: flex` или `display: grid` и `z-index`, отличным от `auto`.

Пример создания контекста наложения:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .parent {
      position: relative;
      z-index: 1;
      background-color: yellow;
      width: 200px;
      height: 200px;
    }

    .child {
      position: absolute;
      left: 50px;
      top: 50px;
      width: 100px;
      height: 100px;
      background-color: green;
      z-index: 2;
    }

    .sibling {
      position: absolute;
      left: 100px;
      top: 100px;
      width: 100px;
      height: 100px;
      background-color: blue;
    }
  </style>
  <title>Контекст наложения</title>
</head>
<body>
  <div class="parent">
    <div class="child"></div>
  </div>
  <div class="sibling"></div>
</body>
</html>

```

В этом примере зелёный квадрат (`child`) будет нарисован поверх жёлтого квадрата (`parent`), так как у него более высокий `z-index` внутри контекста наложения `parent`. Синий квадрат (`sibling`) будет нарисован под жёлтым, так как его `z-index` не влияет на контекст наложения, созданный `parent`.

## Важные нюансы контекста наложения

### Уровни наложения

Каждый контекст наложения имеет свои собственные уровни наложения. В пределах одного контекста наложения порядок наложения определяется `z-index`, но между разными контекстами наложения действует иерархия родителей и потомков.

### Автоматический контекст наложения

Некоторые свойства автоматически создают новый контекст наложения. Например, `opacity` меньше 1 или трансформация (`transform`).

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .parent {
      position: relative;
      z-index: 1;
      background-color: yellow;
      width: 200px;
      height: 200px;
    }

    .child {
      position: absolute;
      left: 50px;
      top: 50px;
      width: 100px;
      height: 100px;
      background-color: green;
      opacity: 0.5; /* Создание нового контекста наложения */
    }

    .sibling {
      position: absolute;
      left: 100px;
      top: 100px;
      width: 100px;
      height: 100px;
      background-color: blue;
    }
  </style>
  <title>Контекст наложения</title>
</head>
<body>
  <div class="parent">
    <div class="child"></div>
  </div>
  <div class="sibling"></div>
</body>
</html>

```

В этом примере зелёный квадрат с `opacity: 0.5` создаёт новый контекст наложения, но остаётся в иерархии внутри `parent`, что влияет на порядок наложения.

## Заключение

Контекст наложения в CSS — это важный механизм, который позволяет управлять порядком рисования элементов на веб-странице. Понимание принципов контекста наложения, таких как `z-index`, создание нового контекста наложения и уровни наложения, помогает разработчикам создавать более предсказуемую и управляемую верстку. Используйте контексты наложения, чтобы контролировать визуальную иерархию ваших элементов и избежать неожиданных наложений.