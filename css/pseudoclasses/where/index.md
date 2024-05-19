---
metaTitle: Псевдокласс where в CSS. Упрощение перечисления нескольких селекторов
metaDescription: Псевдокласс where в CSS. Упрощение перечисления нескольких селекторов
author: Дмитрий Нечаев
title: Псевдокласс where в CSS. Полное руководство с примерами
preview: Псевдокласс where в CSS позволяет объединять несколько селекторов в одном выражении, упрощая написание сложных правил стилизации.
---

Псевдокласс `:where()` в CSS позволяет объединять несколько селекторов в одном выражении, упрощая написание сложных правил стилизации. Этот псевдокласс схож с псевдоклассом `:is()`, но имеет нулевую специфичность, что делает его особенно полезным для использования в базовых стилях. В этой статье мы подробно рассмотрим псевдокласс `:where()`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:where()`?

Псевдокласс `:where()` используется для выбора элементов, которые соответствуют любому из селекторов, указанных внутри `:where()`. Основное отличие от `:is()` заключается в том, что `:where()` имеет нулевую специфичность, что позволяет применять базовые стили, не влияя на приоритеты других правил.

### Пример базового использования `:where()`

```css
:where(selector1, selector2, selector3) {
  /* Стили для элементов, которые соответствуют любому из указанных селекторов */
}

```

Пример использования псевдокласса `:where()` для применения стилей к элементам `<h1>`, `<h2>` и `<h3>`:

```css
:where(h1, h2, h3) {
  color: blue; /* Изменение цвета текста */
}

```

В этом примере цвет текста элементов `<h1>`, `<h2>` и `<h3>` будет синим.

## Примеры использования псевдокласса `:where()`

### Основные примеры

### Применение стилей к нескольким заголовкам

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(h1, h2, h3) {
      color: blue; /* Изменение цвета текста для всех заголовков h1, h2 и h3 */
    }
  </style>
  <title>Применение стилей к нескольким заголовкам</title>
</head>
<body>
  <h1>Заголовок 1</h1>
  <h2>Заголовок 2</h2>
  <h3>Заголовок 3</h3>
</body>
</html>

```

В этом примере цвет текста всех заголовков `<h1>`, `<h2>` и `<h3>` будет синим.

### Применение стилей к элементам формы

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(input[type="text"], input[type="email"], textarea) {
      border: 2px solid #ccc; /* Изменение границы для текстовых полей ввода, email и текстовой области */
      padding: 10px; /* Внутренние отступы */
      width: 100%; /* Ширина 100% */
      box-sizing: border-box; /* Учет границы в ширину */
      margin-bottom: 10px; /* Отступ снизу */
    }
  </style>
  <title>Применение стилей к элементам формы</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name">
    <br>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email">
    <br>
    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="4"></textarea>
  </form>
</body>
</html>

```

В этом примере текстовые поля ввода, email и текстовая область будут иметь одинаковые стили.

### Сложные примеры

### Применение стилей к активным и фокусированным элементам

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(a:hover, a:focus) {
      color: red; /* Изменение цвета текста для ссылок при наведении и фокусе */
    }
  </style>
  <title>Применение стилей к активным и фокусированным элементам</title>
</head>
<body>
  <a href="#">Ссылка 1</a>
  <br>
  <a href="#">Ссылка 2</a>
</body>
</html>

```

В этом примере цвет текста ссылок изменится на красный при наведении и фокусе.

### Применение стилей к элементам списка

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(ul, ol) {
      list-style-position: inside; /* Внутренняя позиция маркеров списка */
      padding-left: 0; /* Удаление отступа слева */
    }

    :where(ul > li, ol > li) {
      padding: 10px; /* Внутренние отступы для элементов списка */
      margin-bottom: 5px; /* Отступ снизу */
      background-color: #f9f9f9; /* Цвет фона */
      border: 1px solid #ddd; /* Граница */
      border-radius: 3px; /* Скругление углов */
    }
  </style>
  <title>Применение стилей к элементам списка</title>
</head>
<body>
  <ul>
    <li>Элемент списка 1</li>
    <li>Элемент списка 2</li>
    <li>Элемент списка 3</li>
  </ul>
  <ol>
    <li>Элемент списка 1</li>
    <li>Элемент списка 2</li>
    <li>Элемент списка 3</li>
  </ol>
</body>
</html>

```

В этом примере стили применяются к нумерованным и ненумерованным спискам и их элементам.

### Комбинирование с другими псевдоклассами

### Комбинирование с псевдоклассом `:not`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(button, a):not(.disabled) {
      background-color: #007bff; /* Фон для доступных кнопок и ссылок */
      color: white; /* Цвет текста */
      padding: 10px 20px; /* Внутренние отступы */
      text-decoration: none; /* Удаление подчеркивания у ссылок */
      border: none; /* Без границы */
      cursor: pointer; /* Курсор указателя */
      border-radius: 5px; /* Скругление углов */
      display: inline-block; /* Инлайн-блочный элемент */
    }

    .disabled {
      background-color: #ccc; /* Фон для отключенных элементов */
      color: #666; /* Цвет текста для отключенных элементов */
      cursor: not-allowed; /* Курсор неразрешенного действия */
    }
  </style>
  <title>Комбинирование с псевдоклассом :not</title>
</head>
<body>
  <button>Доступная кнопка</button>
  <button class="disabled">Отключенная кнопка</button>
  <br>
  <a href="#">Доступная ссылка</a>
  <a href="#" class="disabled">Отключенная ссылка</a>
</body>
</html>

```

В этом примере стили применяются к доступным кнопкам и ссылкам, исключая элементы с классом `.disabled`.

### Комбинирование с псевдоклассами группы `child`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :where(ul, ol) > :where(:first-child, :last-child) {
      background-color: lightblue; /* Фон для первого и последнего элемента списка */
    }
  </style>
  <title>Комбинирование с псевдоклассами группы child</title>
</head>
<body>
  <ul>
    <li>Первый элемент списка</li>
    <li>Средний элемент списка</li>
    <li>Последний элемент списка</li>
  </ul>
  <ol>
    <li>Первый

 элемент списка</li>
    <li>Средний элемент списка</ли>
    <li>Последний элемент списка</li>
  </ol>
</body>
</html>

```

В этом примере стили применяются к первому и последнему элементу как нумерованных, так и ненумерованных списков.

## Использование в реальных проектах

### Стилизация карточек товаров

Пример использования псевдокласса `:where()` для стилизации карточек товаров:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .product-card {
      border: 1px solid #ccc; /* Граница */
      padding: 20px; /* Внутренние отступы */
      margin: 10px; /* Внешние отступы */
      border-radius: 5px; /* Скругление углов */
      transition: transform 0.2s; /* Плавное изменение трансформации */
    }

    :where(.product-card:hover, .product-card:focus-within) {
      transform: scale(1.05); /* Увеличение масштаба при наведении или фокусе */
      border-color: #007bff; /* Цвет границы при наведении или фокусе */
    }
  </style>
  <title>Стилизация карточек товаров</title>
</head>
<body>
  <div class="product-card" tabindex="0">
    <h2>Товар 1</h2>
    <p>Описание товара 1</p>
  </div>
  <div class="product-card" tabindex="0">
    <h2>Товар 2</h2>
    <p>Описание товара 2</p>
  </div>
</body>
</html>

```

В этом примере карточки товаров увеличиваются в масштабе и изменяют цвет границы при наведении курсора или фокусе.

### Стилизация элементов навигации

Пример использования псевдокласса `:where()` для стилизации элементов навигации:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .nav-item {
      display: inline-block; /* Инлайн-блочный элемент */
      margin-right: 15px; /* Отступ справа */
      font-size: 18px; /* Размер шрифта */
    }

    :where(.nav-item a, .nav-item button) {
      color: #007bff; /* Цвет текста */
      text-decoration: none; /* Удаление подчеркивания у ссылок */
      background: none; /* Удаление фона у кнопок */
      border: none; /* Удаление границы у кнопок */
      cursor: pointer; /* Курсор указателя */
    }

    :where(.nav-item a:hover, .nav-item button:hover) {
      text-decoration: underline; /* Подчеркивание текста при наведении */
    }
  </style>
  <title>Стилизация элементов навигации</title>
</head>
<body>
  <nav>
    <div class="nav-item"><a href="#">Главная</a></div>
    <div class="nav-item"><a href="#">О нас</a></div>
    <div class="nav-item"><button onclick="alert('Контакты')">Контакты</button></div>
  </nav>
</body>
</html>

```

В этом примере стили применяются к элементам навигации, будь то ссылки или кнопки.

## Заключение

Псевдокласс `:where()` в CSS предоставляет мощный способ для объединения нескольких условий в одном селекторе, что упрощает написание сложных правил стилизации и улучшает читаемость кода. Основное отличие `:where()` от `:is()` заключается в нулевой специфичности, что позволяет применять базовые стили без влияния на приоритеты других правил. Понимание различных способов использования псевдокласса `:where()`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.