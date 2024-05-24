---
metaTitle: Перечисление селекторов в CSS. Стилизация нескольких элементов одновременно
metaDescription: Перечисление селекторов в CSS. Стилизация нескольких элементов одновременно
author: Дмитрий Нечаев
title: Перечисление селекторов в CSS. Полное руководство с примерами
preview: Перечисление селекторов в CSS позволяет применить одни и те же стили к нескольким элементам одновременно.
---

Перечисление селекторов в CSS позволяет применить одни и те же стили к нескольким элементам одновременно. Этот подход упрощает управление стилями, улучшает читаемость кода и снижает вероятность ошибок. В этой статье мы подробно рассмотрим, как использовать перечисление селекторов, его преимущества и приведем примеры для различных ситуаций.

## Что такое перечисление селекторов?

Перечисление селекторов позволяет указать несколько селекторов, разделённых запятой, чтобы применить к ним одни и те же стили. Это означает, что одно правило CSS может быть применено к множеству элементов, что значительно упрощает процесс стилизации.

Пример:

```css
h1, h2, h3 {
  color: blue;
  font-family: Arial, sans-serif;
}

```

В этом примере заголовки `<h1>`, `<h2>` и `<h3>` будут иметь одинаковый цвет и шрифт.

## Преимущества использования перечисления селекторов

- **Упрощение кода**: Одно правило может применяться к нескольким элементам, что сокращает количество строк кода.
- **Удобство управления стилями**: Изменение стилей в одном месте автоматически применяется ко всем перечисленным селекторам.
- **Повышение читаемости**: Код становится более структурированным и легко поддерживаемым.

## Основные примеры использования перечисления селекторов

### Стилизация заголовков

Использование перечисления селекторов для заголовков разного уровня:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    h1, h2, h3 {
      color: navy;
      text-align: center;
    }
  </style>
  <title>Стилизация заголовков</title>
</head>
<body>
  <h1>Заголовок 1 уровня</h1>
  <h2>Заголовок 2 уровня</h2>
  <h3>Заголовок 3 уровня</h3>
</body>
</html>

```

В этом примере заголовки `<h1>`, `<h2>` и `<h3>` будут иметь одинаковый цвет и выравнивание по центру.

### Стилизация текста

Использование перечисления селекторов для абзацев и ссылок:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p, a {
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
  <title>Стилизация текста</title>
</head>
<body>
  <p>Этот текст в абзаце.</p>
  <a href="#">Эта ссылка</a>
</body>
</html>

```

В этом примере стили для размера шрифта и межстрочного интервала применяются как к абзацам, так и к ссылкам.

### Стилизация форм

Использование перечисления селекторов для различных элементов формы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input, textarea, select {
      border: 1px solid #ccc;
      padding: 10px;
      font-size: 14px;
    }
  </style>
  <title>Стилизация форм</title>
</head>
<body>
  <form>
    <input type="text" placeholder="Введите текст">
    <textarea placeholder="Введите сообщение"></textarea>
    <select>
      <option>Выберите опцию</option>
    </select>
  </form>
</body>
</html>

```

В этом примере одинаковые стили применяются к полям ввода, текстовым областям и выпадающим спискам.

### Стилизация кнопок

Использование перечисления селекторов для кнопок разных типов:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background-color: blue;
      color: white;
    }

    .btn-secondary {
      background-color: grey;
      color: white;
    }
  </style>
  <title>Стилизация кнопок</title>
</head>
<body>
  <button class="btn-primary">Primary</button>
  <button class="btn-secondary">Secondary</button>
</body>
</html>

```

В этом примере базовые стили применяются к обоим классам `.btn-primary` и `.btn-secondary`, а затем добавляются дополнительные стили для каждого типа кнопки.

## Комбинированное перечисление селекторов

### Перечисление селекторов по тегу и классу

Комбинирование селекторов по тегу и классу для более точного выбора элементов:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    h1, h2, .highlight {
      color: red;
    }
  </style>
  <title>Комбинированное перечисление селекторов</title>
</head>
<body>
  <h1>Заголовок 1 уровня</h1>
  <h2>Заголовок 2 уровня</h2>
  <p class="highlight">Этот текст выделен</p>
</body>
</html>

```

В этом примере стиль применяется к заголовкам `<h1>`, `<h2>` и любым элементам с классом `highlight`.

### Перечисление селекторов по идентификатору и псевдоклассу

Комбинирование селекторов по идентификатору и псевдоклассу для стилизации элементов в определённом состоянии:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    #main-content, a:hover {
      background-color: yellow;
    }
  </style>
  <title>Комбинированное перечисление селекторов</title>
</head>
<body>
  <div id="main-content">Основной контент</div>
  <a href="#">Ссылка</a>
</body>
</html>

```

В этом примере стиль применяется к элементу с id `main-content` и к ссылкам при наведении курсора.

## Примеры использования в реальных проектах

### Стилизация карточек товаров

Использование перечисления селекторов для стилизации карточек товаров на странице интернет-магазина:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .product-card, .product-card h3, .product-card p {
      margin: 0;
      padding: 10px;
      border: 1px solid #ddd;
    }

    .product-card h3 {
      font-size: 18px;
      color: #333;
    }

    .product-card p {
      font-size: 14px;
      color: #666;
    }
  </style>
  <title>Стилизация карточек товаров</title>
</head>
<body>
  <div class="product-card">
    <h3>Название товара</h3>
    <p>Описание товара</p>
  </div>
</body>
</html>

```

### Стилизация навигационного меню

Использование перечисления селекторов для стилизации элементов навигационного меню:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    nav ul, nav li, nav a {
      margin: 0;
      padding: 0;
      list-style: none;
      text-decoration: none;
    }

    nav li {
      display: inline-block;
      margin-right: 10px;
    }

    nav a {
      color: #333;
      padding: 10px 15px;
    }

    nav a:hover {
      background-color: #f0f0f0;
    }
  </style>
  <title>Стилизация навигационного меню</title>
</head>
<body>
  <nav>
    <ul>
      <li><a href="#">Главная</a></li>
      <li><a href="#">О нас</a></li>
      <li><a href="#">Контакты</a></li>

    </ul>
  </nav>
</body>
</html>

```

## Заключение

Перечисление селекторов в CSS позволяет легко и эффективно применять одни и те же стили к нескольким элементам. Это упрощает управление стилями, улучшает читаемость кода и снижает вероятность ошибок. Понимание того, как использовать перечисление селекторов, комбинировать их с другими типами селекторов и применять их в реальных проектах, помогает разработчикам создавать более гибкие, адаптивные и поддерживаемые стили. Экспериментируйте с различными комбинациями и находите оптимальные решения для ваших проектов.