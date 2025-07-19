---
metaTitle: Псевдокласс has в CSS. Стилизация родителя при наличии конкретного ребёнка
metaDescription: Псевдокласс has в CSS. Стилизация родителя при наличии конкретного ребёнка
author: Дмитрий Нечаев
title: Псевдокласс has в CSS. Полное руководство с примерами
preview: Псевдокласс has в CSS — это мощный инструмент, который позволяет стилизовать родительский элемент на основе наличия определённых дочерних элементов.
---

Псевдокласс `:has()` в CSS — это мощный инструмент, который позволяет стилизовать родительский элемент на основе наличия определённых дочерних элементов. Это уникальная возможность, делающая стилизацию более гибкой и точной. В этой статье мы подробно рассмотрим псевдокласс `:has()`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:has()`?

Псевдокласс `:has()` применяется к элементам, которые содержат определённые дочерние элементы, соответствующие указанному селектору. Это позволяет изменять стили родительского элемента в зависимости от наличия или отсутствия конкретных детей.

Чтобы эффективно использовать этот псевдокласс, необходимо понимать структуру HTML-документа и принципы работы CSS-селекторов. Также необходимы твердые знания о вложенности элементов и их взаимодействии. Если вы хотите углубить свои знания в HTML и CSS и научиться создавать сложные и адаптивные стили — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-has-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример базового использования `:has()`

```css
parent:has(child) {
  /* Стили для родителя, если он содержит указанный дочерний элемент */
}

```

Пример использования псевдокласса `:has()` для изменения фона родительского элемента, если он содержит определённый дочерний элемент:

```css
div:has(p) {
  background-color: lightblue;
}

```

В этом примере фон `<div>` будет светло-голубым, если он содержит `<p>`.

## Примеры использования псевдокласса `:has()`

### Основные примеры

### Изменение фона родителя при наличии дочернего элемента

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div:has(p) {
      background-color: lightblue; /* Изменение фона родителя при наличии дочернего элемента <p> */
      padding: 20px;
      border: 1px solid #ccc;
    }
  </style>
  <title>Изменение фона родителя</title>
</head>
<body>
  <div>
    <p>Этот элемент содержит абзац.</p>
  </div>
  <div>
    Этот элемент не содержит абзац.
  </div>
</body>
</html>

```

В этом примере фон первого `<div>` будет светло-голубым, так как он содержит `<p>`, тогда как второй `<div>` останется без изменений.

### Стилизация списка при наличии элементов

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ul:has(li) {
      border: 2px solid green; /* Добавление рамки к списку, если он содержит элементы <li> */
      padding: 10px;
    }
  </style>
  <title>Стилизация списка при наличии элементов</title>
</head>
<body>
  <ul>
    <li>Элемент списка 1</li>
    <li>Элемент списка 2</li>
  </ul>
  <ul>
    <!-- Пустой список -->
  </ul>
</body>
</html>

```

В этом примере к первому `<ul>`, содержащему `<li>`, будет добавлена зелёная рамка, а второй `<ul>`, который пуст, останется без изменений.

### Сложные примеры

### Стилизация формы при наличии заполненных полей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    form:has(input:not(:placeholder-shown)) {
      border: 2px solid blue; /* Добавление синей рамки к форме при наличии заполненных полей */
      padding: 20px;
    }

    input {
      display: block;
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #ccc;
    }
  </style>
  <title>Стилизация формы при наличии заполненных полей</title>
</head>
<body>
  <form>
    <input type="text" placeholder="Имя">
    <input type="email" placeholder="Email">
    <input type="text" placeholder="Заполненное поле" value="Текст">
  </form>
  <form>
    <input type="text" placeholder="Имя">
    <input type="email" placeholder="Email">
  </form>
</body>
</html>

```

В этом примере к первой форме, содержащей заполненное поле ввода, будет добавлена синяя рамка, а вторая форма останется без изменений.

### Стилизация карточек товаров при наличии скидки

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .product:has(.discount) {
      border: 2px solid red; /* Добавление красной рамки к карточке товара при наличии элемента с классом .discount */
      padding: 10px;
      position: relative;
    }

    .discount {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: red;
      color: white;
      padding: 5px;
      font-size: 12px;
    }

    .product {
      margin-bottom: 20px;
    }
  </style>
  <title>Стилизация карточек товаров при наличии скидки</title>
</head>
<body>
  <div class="product">
    <h2>Товар 1</h2>
    <p>Описание товара 1</p>
    <div class="discount">Скидка</div>
  </div>
  <div class="product">
    <h2>Товар 2</h2>
    <p>Описание товара 2</p>
  </div>
</body>
</html>

```

В этом примере карточка товара, содержащая элемент с классом `.discount`, будет выделена красной рамкой.

### Комбинирование с другими псевдоклассами

### Комбинирование с псевдоклассом `:hover`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    div:has(p):hover {
      background-color: lightgreen; /* Изменение фона при наведении на родительский элемент, содержащий <p> */
    }
  </style>
  <title>Комбинирование с псевдоклассом :hover</title>
</head>
<body>
  <div>
    <p>Этот элемент содержит абзац.</p>
  </div>
  <div>
    Этот элемент не содержит абзац.
  </div>
</body>
</html>

```

В этом примере фон первого `<div>`, содержащего `<p>`, изменится на светло-зелёный при наведении курсора.

### Комбинирование с псевдоклассом `:not`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ul:has(li:not(.special)) {
      border: 2px dashed blue; /* Добавление синей пунктирной рамки к списку, если он содержит элементы <li>, не имеющие класса .special */
      padding: 10px;
    }

    .special {
      color: red;
    }
  </style>
  <title>Комбинирование с псевдоклассом :not</title>
</head>
<body>
  <ul>
    <li>Элемент списка 1</li>
    <li class="special">Элемент списка 2</li>
  </ul>
  <ul>
    <li>Элемент списка 3</li>
    <li>Элемент списка 4</li>
  </ul>
</body>
</html>

```

В этом примере ко второму списку будет добавлена синяя пунктирная рамка, так как он содержит элементы `<li>`, не имеющие класса `.special`.

## Использование в реальных проектах

### Стилизация контейнера при наличии изображений

Пример использования псевдокласса `:has()` для стилизации контейнера, содержащего изображения:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .gallery:has(img) {
      border: 3px solid green; /* Добавление зелёной рамки к контейнеру, содержащему изображения */
      padding: 10px;
    }

    img {
      display: block;
      margin-bottom: 10px;
      max-width: 100%;
      height: auto;
    }
  </style>

  <title>Стилизация контейнера при наличии изображений</title>
</head>
<body>
  <div class="gallery">
    <img src="<https://via.placeholder.com/150>" alt="Изображение 1">
    <img src="<https://via.placeholder.com/150>" alt="Изображение 2">
  </div>
  <div class="gallery">
    <!-- Пустая галерея -->
  </div>
</body>
</html>

```

В этом примере к контейнеру `.gallery`, содержащему изображения, будет добавлена зелёная рамка.

### Стилизация меню при наличии активных элементов

Пример использования псевдокласса `:has()` для стилизации меню, содержащего активные элементы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .menu:has(li.active) {
      border-left: 5px solid orange; /* Добавление оранжевой левой границы к меню, содержащему активные элементы */
      padding-left: 10px;
    }

    .menu li {
      list-style-type: none;
      padding: 10px;
    }

    .menu li.active {
      font-weight: bold;
      color: orange;
    }
  </style>
  <title>Стилизация меню при наличии активных элементов</title>
</head>
<body>
  <ul class="menu">
    <li>Элемент 1</li>
    <li class="active">Элемент 2</li>
    <li>Элемент 3</li>
  </ul>
  <ul class="menu">
    <li>Элемент 4</li>
    <li>Элемент 5</li>
  </ul>
</body>
</html>

```

В этом примере к меню, содержащему активные элементы (с классом `.active`), будет добавлена оранжевая левая граница.

## Заключение

Псевдокласс `:has()` в CSS предоставляет уникальный способ для стилизации родительских элементов на основе наличия определённых дочерних элементов. Это улучшает гибкость и точность в создании стилей, позволяя разработчикам создавать более адаптивные и поддерживаемые стили. Понимание различных способов использования псевдокласса `:has()`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать сложные и мощные правила стилизации. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

`:has` открывает новые возможности для создания динамических и адаптивных интерфейсов. Для глубокого изучения этого псевдокласса и других инструментов CSS, рекомендуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-has-v-CSS-Polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
