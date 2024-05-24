---
metaTitle: Псевдоклассы disabled и enabled в CSS. Стилизация элементов на основе их состояния
metaDescription: Псевдокласс empty в CSS. Как определить, что элемент пустой?
author: Дмитрий Нечаев
title: Псевдоклассы disabled и enabled в CSS. Полное руководство с примерами
preview: Псевдоклассы disabled и enabled в CSS используются для стилизации элементов формы на основе их состояния — доступности для взаимодействия.
---

Псевдоклассы `:disabled` и `:enabled` в CSS используются для стилизации элементов формы на основе их состояния — доступности для взаимодействия. Элементы с атрибутом `disabled` отключены и недоступны для взаимодействия, в то время как элементы с атрибутом `enabled` доступны. В этой статье мы подробно рассмотрим псевдоклассы `:disabled` и `:enabled`, их применение и приведем примеры использования для различных ситуаций.

## Что такое псевдоклассы `:disabled` и `:enabled`?

Псевдокласс `:disabled` применяется к элементам формы, которые имеют атрибут `disabled`. Такие элементы отключены и недоступны для взаимодействия, то есть пользователь не может с ними взаимодействовать.

Псевдокласс `:enabled` применяется к элементам формы, которые не имеют атрибута `disabled`. Эти элементы доступны для взаимодействия и могут быть использованы пользователем.

### Пример базового использования `:disabled`

```css
input:disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

```

### Пример базового использования `:enabled`

```css
input:enabled {
  background-color: #fff;
  color: #000;
  cursor: pointer;
}

```

## Примеры использования псевдоклассов `:disabled` и `:enabled`

### Основные примеры

### Стилизация отключенных полей ввода

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:disabled {
      background-color: #eee; /* Изменение фона отключенного поля ввода */
      color: #999; /* Изменение цвета текста отключенного поля ввода */
      border: 1px solid #ccc; /* Изменение цвета границы отключенного поля ввода */
    }
  </style>
  <title>Стилизация отключенных полей ввода</title>
</head>
<body>
  <input type="text" value="Отключенное поле" disabled>
</body>
</html>

```

### Стилизация доступных полей ввода

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:enabled {
      background-color: #fff; /* Изменение фона доступного поля ввода */
      color: #000; /* Изменение цвета текста доступного поля ввода */
      border: 1px solid #000; /* Изменение цвета границы доступного поля ввода */
    }
  </style>
  <title>Стилизация доступных полей ввода</title>
</head>
<body>
  <input type="text" value="Доступное поле">
</body>
</html>

```

### Сложные примеры

### Стилизация кнопок на основе их состояния

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    button:enabled {
      background-color: #28a745; /* Фон доступной кнопки */
      color: white; /* Цвет текста доступной кнопки */
      border: none; /* Без границы */
      padding: 10px 20px; /* Внутренние отступы */
      cursor: pointer; /* Курсор указателя */
    }

    button:disabled {
      background-color: #ccc; /* Фон отключенной кнопки */
      color: #666; /* Цвет текста отключенной кнопки */
      border: none; /* Без границы */
      padding: 10px 20px; /* Внутренние отступы */
      cursor: not-allowed; /* Курсор неразрешенного действия */
    }
  </style>
  <title>Стилизация кнопок на основе их состояния</title>
</head>
<body>
  <button>Доступная кнопка</button>
  <button disabled>Отключенная кнопка</button>
</body>
</html>

```

### Стилизация элементов формы

Пример использования `:disabled` и `:enabled` для различных элементов формы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:enabled, select:enabled, textarea:enabled {
      background-color: #fff; /* Фон доступных элементов */
      color: #000; /* Цвет текста доступных элементов */
      border: 1px solid #000; /* Цвет границы доступных элементов */
      cursor: pointer; /* Курсор указателя */
    }

    input:disabled, select:disabled, textarea:disabled {
      background-color: #eee; /* Фон отключенных элементов */
      color: #999; /* Цвет текста отключенных элементов */
      border: 1px solid #ccc; /* Цвет границы отключенных элементов */
      cursor: not-allowed; /* Курсор неразрешенного действия */
    }
  </style>
  <title>Стилизация элементов формы</title>
</head>
<body>
  <form>
    <label for="text-input">Текстовое поле:</label>
    <input type="text" id="text-input" value="Доступно">
    <input type="text" value="Отключено" disabled>
    <br><br>
    <label for="select-input">Выпадающий список:</label>
    <select id="select-input">
      <option>Опция 1</option>
      <option>Опция 2</option>
    </select>
    <select disabled>
      <option>Отключенная опция</option>
    </select>
    <br><br>
    <label for="textarea-input">Текстовая область:</label>
    <textarea id="textarea-input" rows="4" cols="50">Доступно</textarea>
    <textarea rows="4" cols="50" disabled>Отключено</textarea>
  </form>
</body>
</html>

```

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
    button:enabled:hover {
      background-color: #218838; /* Изменение фона при наведении на доступную кнопку */
    }
  </style>
  <title>Комбинирование с псевдоклассом :hover</title>
</head>
<body>
  <button>Доступная кнопка</button>
  <button disabled>Отключенная кнопка</button>
</body>
</html>

```

### Комбинирование с псевдоклассом `:focus`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input:enabled:focus {
      border-color: #007bff; /* Изменение цвета границы при фокусе на доступном поле ввода */
    }
  </style>
  <title>Комбинирование с псевдоклассом :focus</title>
</head>
<body>
  <input type="text" value="Доступное поле">
  <input type="text" value="Отключенное поле" disabled>
</body>
</html>

```

## Использование в реальных проектах

### Стилизация форм в зависимости от состояния

Пример использования псевдоклассов `:disabled` и `:enabled` для улучшения пользовательского интерфейса формы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    form {
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }

    input, select, textarea, button {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 3px;
      transition: border-color 0.3s, background-color 0.3s;
    }

    input:enabled, select:enabled, textarea:enabled, button:enabled {
      background-color: #fff; /* Фон доступных элементов */
      color: #000; /* Цвет текста доступных элементов */
    }

 input:disabled, select:disabled, textarea:disabled, button:disabled {
      background-color: #eee; /* Фон отключенных элементов */
      color: #999; /* Цвет текста отключенных элементов */
    }

    input:enabled:hover, select:enabled:hover, textarea:enabled:hover, button:enabled:hover {
      border-color: #007bff; /* Цвет границы при наведении на доступные элементы */
    }
  </style>
  <title>Стилизация формы в зависимости от состояния</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required disabled>

    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="5" required></textarea>

    <button type="submit">Отправить</button>
    <button type="reset" disabled>Сбросить</button>
  </form>
</body>
</html>

```

В этом примере доступны и отключены различные элементы формы, стилизация которых изменяется на основании их состояния.

### Стилизация карточек товаров

Пример использования псевдоклассов `:disabled` и `:enabled` для стилизации карточек товаров:

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

    .product-card button:enabled {
      background-color: #28a745; /* Фон доступной кнопки */
      color: white; /* Цвет текста доступной кнопки */
      border: none; /* Без границы */
      padding: 10px 20px; /* Внутренние отступы */
      cursor: pointer; /* Курсор указателя */
      margin-top: 10px; /* Отступ сверху */
      transition: background-color 0.3s;
    }

    .product-card button:disabled {
      background-color: #ccc; /* Фон отключенной кнопки */
      color: #666; /* Цвет текста отключенной кнопки */
      border: none; /* Без границы */
      padding: 10px 20px; /* Внутренние отступы */
      cursor: not-allowed; /* Курсор неразрешенного действия */
      margin-top: 10px; /* Отступ сверху */
    }

    .product-card button:enabled:hover {
      background-color: #218838; /* Изменение фона при наведении на доступную кнопку */
    }
  </style>
  <title>Стилизация карточек товаров</title>
</head>
<body>
  <div class="product-card">
    <img src="<https://via.placeholder.com/150>" alt="Продукт 1">
    <h3>Продукт 1</h3>
    <p>Описание продукта 1</p>
    <button>Добавить в корзину</button>
  </div>
  <div class="product-card">
    <img src="<https://via.placeholder.com/150>" alt="Продукт 2">
    <h3>Продукт 2</h3>
    <p>Описание продукта 2</p>
    <button disabled>Нет в наличии</button>
  </div>
</body>
</html>

```

В этом примере кнопки на карточках товаров стилизованы в зависимости от их состояния — доступны они или отключены.

## Заключение

Псевдоклассы `:disabled` и `:enabled` в CSS предоставляют мощный способ для стилизации элементов формы на основании их состояния. Это улучшает взаимодействие пользователя с веб-страницей, делая её более интуитивной и удобной. Понимание различных способов использования псевдоклассов `:disabled` и `:enabled`, а также их комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.