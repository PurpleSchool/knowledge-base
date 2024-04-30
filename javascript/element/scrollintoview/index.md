---
metaTitle: .scrollIntoView() в JavaScript
metaDescription: Разбираемся как использовать .scrollIntoView() в JavaScript
author: Дмитрий Нечаев
title: .scrollIntoView() в JavaScript
preview: Учимся пользоваться .scrollIntoView() в JavaScript. Разбираем примеры использования
---

Метод `.scrollIntoView()` в JavaScript позволяет прокрутить окно браузера так, чтобы указанный элемент стал видимым для пользователя. Этот метод особенно полезен, когда на странице есть большое количество контента, и нужно быстро переместить пользователя к определенному месту на странице. Давайте подробно рассмотрим, как использовать `.scrollIntoView()` с примерами.

## Введение в `.scrollIntoView()`

Метод `.scrollIntoView()` вызывается на элементе DOM и автоматически прокручивает окно браузера так, чтобы этот элемент оказался в области видимости. Если элемент уже виден, ничего не произойдет. По умолчанию элемент будет выравнен в верхней части области видимости, но это поведение можно настроить.

Синтаксис метода `.scrollIntoView()` следующий:

```jsx
element.scrollIntoView(options);

```

Где:

- `element` - это элемент DOM, который мы хотим сделать видимым.
- `options` (необязательно) - это объект с настройками для прокрутки.

## Примеры использования `.scrollIntoView()`

Давайте рассмотрим несколько примеров использования метода `.scrollIntoView()` для прокрутки окна браузера до указанного элемента.

### 1. Прокрутка до элемента при загрузке страницы

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="targetElement" style="height: 1000px; background-color: lightblue;">
    Целевой элемент
  </div>

  <script>
    // Прокрутить до целевого элемента при загрузке страницы
    document.getElementById('targetElement').scrollIntoView();
  </script>
</body>
</html>

```

В этом примере при загрузке страницы браузер автоматически прокрутит окно так, чтобы целевой элемент стал видимым.

### 2. Прокрутка до элемента с плавной анимацией

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
  <style>
    html, body {
      scroll-behavior: smooth; /* Добавляем плавную анимацию прокрутки */
    }
  </style>
</head>
<body>
  <button onclick="scrollToElement()">Прокрутить до элемента</button>
  <div id="targetElement" style="height: 1000px; background-color: lightblue;">
    Целевой элемент
  </div>

  <script>
    // Прокрутить до целевого элемента с плавной анимацией
    function scrollToElement() {
      document.getElementById('targetElement').scrollIntoView();
    }
  </script>
</body>
</html>

```

В этом примере при нажатии на кнопку "Прокрутить до элемента" страница будет плавно прокручена до целевого элемента.

### 3. Прокрутка с настройками выравнивания

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <button onclick="scrollToElement()">Прокрутить до элемента</button>
  <div id="targetElement" style="height: 1000px; background-color: lightblue;">
    Целевой элемент
  </div>

  <script>
    // Прокрутить до целевого элемента с выравниванием в центре
    function scrollToElement() {
      document.getElementById('targetElement').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  </script>
</body>
</html>

```

В этом примере при нажатии на кнопку "Прокрутить до элемента" страница будет плавно прокручена до целевого элемента, выравнивая его в центре области просмотра.

## Заключение

Метод `.scrollIntoView()` предоставляет простой и удобный способ программно прокрутить страницу до указанного элемента. Это особенно полезно для создания пользовательских интерфейсов, где нужно обеспечить быструю навигацию по странице. Надеюсь, данная статья помогла вам понять, как использовать `.scrollIntoView()` в ваших проектах JavaScript.