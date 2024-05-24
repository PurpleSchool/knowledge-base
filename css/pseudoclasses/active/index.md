---
metaTitle: Псевдокласс active в CSS. Отклик интерфейса на действия пользователя
metaDescription: Псевдокласс active в CSS. Отклик интерфейса на действия пользователя
author: Дмитрий Нечаев
title: Псевдокласс active в CSS. Полное руководство с примерами
preview: Псевдокласс active в CSS используется для изменения стилей элементов в момент их активации, например, при нажатии на кнопку или ссылку.
---

Псевдокласс `:active` в CSS используется для изменения стилей элементов в момент их активации, например, при нажатии на кнопку или ссылку. Это один из ключевых псевдоклассов, который помогает улучшить интерактивность и отклик интерфейса на действия пользователя. В этой статье мы подробно рассмотрим псевдокласс `:active`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:active`?

Псевдокласс `:active` применяется к элементам в момент их активации. Активация происходит, когда пользователь нажимает и удерживает кнопку мыши на элементе. Стили, заданные с помощью этого псевдокласса, активируются в момент нажатия и могут изменять внешний вид элемента, показывая, что элемент находится в активном состоянии.

Пример базового использования `:active`:

```css
selector:active {
  /* Стили для активного состояния */
}

```

Пример использования псевдокласса `:active` для кнопки:

```css
button:active {
  background-color: red;
}

```

В этом примере цвет фона кнопки изменится на красный в момент нажатия.

## Примеры использования псевдокласса `:active`

### Основные примеры

### Изменение цвета текста при активации

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:active {
      color: green; /* Изменение цвета текста при активации */
    }
  </style>
  <title>Изменение цвета текста при активации</title>
</head>
<body>
  <p>Нажмите и удерживайте этот текст, чтобы изменить его цвет.</p>
</body>
</html>

```

### Изменение фона при активации

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div:active {
      background-color: lightblue; /* Изменение фона при активации */
    }
  </style>
  <title>Изменение фона при активации</title>
</head>
<body>
  <div style="padding: 20px; border: 1px solid #000;">
    Нажмите и удерживайте этот блок, чтобы изменить его фон.
  </div>
</body>
</html>

```

### Изменение стилей ссылки при активации

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:active {
      color: orange; /* Изменение цвета текста ссылки при активации */
      text-decoration: none; /* Удаление подчеркивания при активации */
    }
  </style>
  <title>Изменение стилей ссылки при активации</title>
</head>
<body>
  <a href="<https://example.com>">Нажмите на эту ссылку</a>
</body>
</html>

```

### Сложные примеры

### Анимация при активации

Псевдокласс `:active` можно использовать для создания анимаций при нажатии.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .box {
      width: 100px;
      height: 100px;
      background-color: blue;
      transition: transform 0.1s; /* Плавный переход */
    }

    .box:active {
      transform: scale(0.9); /* Уменьшение размера при активации */
    }
  </style>
  <title>Анимация при активации</title>
</head>
<body>
  <div class="box"></div>
</body>
</html>

```

### Изменение стилей кнопки при активации

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .button {
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      transition: background-color 0.1s, transform 0.1s;
    }

    .button:hover {
      background-color: #0056b3; /* Изменение фона кнопки при наведении */
    }

    .button:active {
      background-color: #003865; /* Изменение фона кнопки при активации */
      transform: scale(0.95); /* Уменьшение размера при активации */
    }
  </style>
  <title>Изменение стилей кнопки при активации</title>
</head>
<body>
  <button class="button">Нажмите на кнопку</button>
</body>
</html>

```

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:active` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

### Комбинирование с псевдоклассом `:hover`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .link {
      color: #007bff;
      text-decoration: none;
      padding: 5px 10px;
      display: inline-block;
      transition: background-color 0.1s, color 0.1s;
    }

    .link:hover {
      background-color: #e2e6ea;
      color: #0056b3;
    }

    .link:active {
      background-color: #0056b3;
      color: #fff;
    }
  </style>
  <title>Комбинирование с псевдоклассом :hover</title>
</head>
<body>
  <a href="#" class="link">Нажмите на ссылку</a>
</body>
</html>

```

### Комбинирование с псевдоэлементами `:before` и `:after`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .button-effect {
      position: relative;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
      overflow: hidden;
      transition: background-color 0.3s;
    }

    .button-effect:before,
    .button-effect:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: rgba(255, 255, 255, 0.2);
      transition: transform 0.3s;
    }

    .button-effect:before {
      transform: scaleX(0);
      transform-origin: left;
    }

    .button-effect:after {
      transform: scaleX(0);
      transform-origin: right;
    }

    .button-effect:hover:before,
    .button-effect:hover:after {
      transform: scaleX(1);
    }

    .button-effect:active {
      background-color: #0056b3;
    }
  </style>
  <title>Комбинирование с псевдоэлементами</title>
</head>
<body>
  <button class="button-effect">Нажмите на кнопку</button>
</body>
</html>

```

## Примеры использования в реальных проектах

### Стилизация кнопок формы

Использование псевдокласса `:active` для стилизации кнопок формы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .form-button {
      background-color: #28a745;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.1s;
    }

    .form-button:hover {
      background-color: #218838;
    }

    .form-button:active {
      background-color: #1e7e34;
      transform: scale

(0.95);
    }
  </style>
  <title>Стилизация кнопок формы</title>
</head>
<body>
  <form>
    <button class="form-button" type="submit">Отправить</button>
  </form>
</body>
</html>

```

### Стилизация карточек товаров

Использование псевдокласса `:active` для стилизации карточек товаров:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .product-card {
      border: 1px solid #ccc;
      padding: 20px;
      margin: 10px;
      text-align: center;
      transition: box-shadow 0.3s, transform 0.1s;
    }

    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .product-card:active {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform: scale(0.98);
    }

    .product-card img {
      max-width: 100%;
      height: auto;
    }

    .product-card h3 {
      margin: 10px 0;
    }

    .product-card p {
      color: #666;
    }
  </style>
  <title>Стилизация карточек товаров</title>
</head>
<body>
  <div class="product-card">
    <img src="<https://via.placeholder.com/150>" alt="Продукт 1">
    <h3>Продукт 1</h3>
    <p>Описание продукта 1</p>
  </div>
  <div class="product-card">
    <img src="<https://via.placeholder.com/150>" alt="Продукт 2">
    <h3>Продукт 2</h3>
    <p>Описание продукта 2</p>
  </div>
</body>
</html>

```

## Заключение

Псевдокласс `:active` в CSS предоставляет мощный способ для создания интерактивных и динамичных элементов на веб-страницах. Он позволяет изменять стили элементов в момент их активации, что улучшает пользовательский опыт и делает интерфейс более отзывчивым. Понимание различных способов использования псевдокласса `:active`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.