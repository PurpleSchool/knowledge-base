---
metaTitle: Псевдокласс hover в CSS. Оживляем элементы, реагируем на наведение курсора
metaDescription: Псевдокласс hover в CSS. Оживляем элементы, реагируем на наведение курсора
author: Дмитрий Нечаев
title: Псевдокласс hover в CSS. Полное руководство с примерами
preview: Псевдокласс hover в CSS используется для изменения стилей элементов при наведении на них курсора.
---

Псевдокласс `:hover` в CSS используется для изменения стилей элементов при наведении на них курсора. Это один из наиболее часто используемых псевдоклассов, который позволяет создавать интерактивные и динамичные элементы интерфейса. В этой статье мы подробно рассмотрим псевдокласс `:hover`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:hover`?

Псевдокласс `:hover` применяется к элементам, когда пользователь наводит на них курсор. Стили, заданные с помощью этого псевдокласса, активируются в момент наведения и могут изменять внешний вид элемента, добавляя интерактивность и улучшая пользовательский опыт.

Пример базового использования `:hover`:

```css
selector:hover {
  /* Стили при наведении курсора */
}

```

Пример использования псевдокласса `:hover` для ссылки:

```css
a:hover {
  color: red;
}

```

В этом примере цвет текста ссылки изменится на красный при наведении курсора.

## Примеры использования псевдокласса `:hover`

### Основные примеры

### Изменение цвета текста при наведении

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:hover {
      color: blue; /* Изменение цвета текста при наведении */
    }
  </style>
  <title>Изменение цвета текста при наведении</title>
</head>
<body>
  <p>Наведите курсор на этот текст, чтобы изменить его цвет.</p>
</body>
</html>

```

### Изменение фона при наведении

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div:hover {
      background-color: yellow; /* Изменение фона при наведении */
    }
  </style>
  <title>Изменение фона при наведении</title>
</head>
<body>
  <div style="padding: 20px; border: 1px solid #000;">
    Наведите курсор на этот блок, чтобы изменить его фон.
  </div>
</body>
</html>

```

### Добавление подчеркивания при наведении на ссылку

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    a:hover {
      text-decoration: underline; /* Добавление подчеркивания при наведении */
    }
  </style>
  <title>Подчеркивание при наведении на ссылку</title>
</head>
<body>
  <a href="<https://example.com>">Наведите курсор на эту ссылку</a>
</body>
</html>

```

### Сложные примеры

### Анимация при наведении

Псевдокласс `:hover` можно использовать для создания анимаций при наведении.

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
      transition: transform 0.3s; /* Плавный переход */
    }

    .box:hover {
      transform: scale(1.2); /* Увеличение размера при наведении */
    }
  </style>
  <title>Анимация при наведении</title>
</head>
<body>
  <div class="box"></div>
</body>
</html>

```

### Изменение стилей кнопки при наведении

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
      transition: background-color 0.3s;
    }

    .button:hover {
      background-color: #0056b3; /* Изменение фона кнопки при наведении */
    }
  </style>
  <title>Изменение стилей кнопки при наведении</title>
</head>
<body>
  <button class="button">Наведите курсор на кнопку</button>
</body>
</html>

```

### Изменение прозрачности изображения при наведении

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .image {
      transition: opacity 0.3s; /* Плавный переход */
    }

    .image:hover {
      opacity: 0.5; /* Изменение прозрачности при наведении */
    }
  </style>
  <title>Изменение прозрачности изображения при наведении</title>
</head>
<body>
  <img src="<https://via.placeholder.com/150>" alt="Пример изображения" class="image">
</body>
</html>

```

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:hover` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

### Комбинирование с псевдоклассами `:before` и `:after`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .hover-effect {
      position: relative;
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      overflow: hidden;
    }

    .hover-effect:before,
    .hover-effect:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 3px;
      background-color: #0056b3;
      transition: transform 0.3s;
    }

    .hover-effect:before {
      top: 0;
      left: 0;
      transform: scaleX(0);
    }

    .hover-effect:after {
      bottom: 0;
      right: 0;
      transform: scaleX(0);
    }

    .hover-effect:hover:before,
    .hover-effect:hover:after {
      transform: scaleX(1);
    }
  </style>
  <title>Комбинирование с псевдоклассами before и after</title>
</head>
<body>
  <a href="#" class="hover-effect">Навести курсор</a>
</body>
</html>

```

## Примеры использования в реальных проектах

### Стилизация навигационного меню

Использование псевдокласса `:hover` для стилизации ссылок в навигационном меню:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    nav a {
      color: #007bff;
      text-decoration: none;
      padding: 10px;
      display: inline-block;
      transition: background-color 0.3s, color 0.3s;
    }

    nav a:hover {
      background-color: #e2e6ea;
      color: #0056b3;
    }
  </style>
  <title>Навигационное меню</title>
</head>
<body>
  <nav>
    <a href="#">Главная</a>
    <a href="#">О нас</a>
    <a href="#">Контакты</a>
  </nav>
</body>
</html>

```

### Карточки товаров

Использование псевдокласса `:hover` для стилизации карточек товаров:

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
      transition: box-shadow 0.3s;
    }

    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  <title>Карточки товаров</title>
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

Псевдокласс `:hover` в CSS предоставляет мощный инструмент для создания интерактивных и динамичных элементов на веб-страницах. Он позволяет изменять стили элементов при наведении курсора, что улучшает пользовательский опыт и делает интерфейс более привлекательным. Понимание различных способов использования псевдокласса `:hover`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.