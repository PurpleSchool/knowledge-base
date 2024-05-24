---
metaTitle: Псевдокласс checked в CSS. Отражение состояния чекбокса или радиокнопки
metaDescription: Псевдокласс checked в CSS. Отражение состояния чекбокса или радиокнопки
author: Дмитрий Нечаев
title: Псевдокласс checked в CSS. Полное руководство с примерами
preview: Псевдокласс checked в CSS используется для стилизации элементов формы, таких как чекбоксы и радиокнопки, когда они находятся в состоянии выбрано.
---

Псевдокласс `:checked` в CSS используется для стилизации элементов формы, таких как чекбоксы (`<input type="checkbox">`) и радиокнопки (`<input type="radio">`), когда они находятся в состоянии "выбрано". Это позволяет изменить внешний вид этих элементов и связанных с ними элементов на основании их состояния. В этой статье мы подробно рассмотрим псевдокласс `:checked`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:checked`?

Псевдокласс `:checked` применяется к элементам формы, которые находятся в состоянии "выбрано". Это означает, что данный псевдокласс будет активирован для чекбоксов и радиокнопок, когда они помечены как выбранные пользователем.

Пример базового использования `:checked`:

```css
input:checked {
  /* Стили для выбранных элементов */
}

```

Пример использования псевдокласса `:checked` для изменения фона чекбокса:

```css
input[type="checkbox"]:checked {
  background-color: lightblue;
}

```

В этом примере фон выбранного чекбокса будет светло-голубым.

## Примеры использования псевдокласса `:checked`

### Основные примеры

### Стилизация чекбоксов

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:checked {
      background-color: lightblue; /* Изменение фона выбранного чекбокса */
    }
  </style>
  <title>Стилизация чекбоксов</title>
</head>
<body>
  <label>
    <input type="checkbox">
    Выберите меня
  </label>
</body>
</html>

```

В этом примере фон выбранного чекбокса будет светло-голубым.

### Стилизация радиокнопок

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="radio"]:checked {
      background-color: lightgreen; /* Изменение фона выбранной радиокнопки */
    }
  </style>
  <title>Стилизация радиокнопок</title>
</head>
<body>
  <label>
    <input type="radio" name="option">
    Вариант 1
  </label>
  <br>
  <label>
    <input type="radio" name="option">
    Вариант 2
  </label>
</body>
</html>

```

В этом примере фон выбранной радиокнопки будет светло-зелёным.

### Сложные примеры

### Изменение стиля связанных элементов

Псевдокласс `:checked` можно использовать для изменения стиля связанных элементов, таких как метки (`<label>`).

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="checkbox"]:checked + label {
      color: red; /* Изменение цвета текста метки при выборе чекбокса */
    }
  </style>
  <title>Изменение стиля связанных элементов</title>
</head>
<body>
  <input type="checkbox" id="checkbox1">
  <label for="checkbox1">Выберите меня</label>
</body>
</html>

```

В этом примере цвет текста метки изменится на красный, когда чекбокс будет выбран.

### Стилизация переключателей

Создание переключателя с использованием псевдокласса `:checked`.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.4s;
    }

    input:checked + .slider {
      background-color: #2196F3;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .slider.round {
      border-radius: 34px;
    }

    .slider.round:before {
      border-radius: 50%;
    }
  </style>
  <title>Стилизация переключателей</title>
</head>
<body>
  <label class="switch">
    <input type="checkbox">
    <span class="slider round"></span>
  </label>
</body>
</html>

```

В этом примере создаётся переключатель, который меняет цвет и положение ползунка при выборе.

### Использование в реальных проектах

### Стилизация списка задач

Использование псевдокласса `:checked` для стилизации выполненных задач в списке.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ul {
      list-style-type: none;
      padding: 0;
    }

    li {
      padding: 10px;
      margin-bottom: 5px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 3px;
      transition: background-color 0.3s, text-decoration 0.3s;
    }

    input[type="checkbox"]:checked + li {
      background-color: lightgreen; /* Изменение фона выполненной задачи */
      text-decoration: line-through; /* Перечёркивание текста выполненной задачи */
    }

    input[type="checkbox"] {
      display: none;
    }
  </style>
  <title>Список задач</title>
</head>
<body>
  <ul>
    <input type="checkbox" id="task1">
    <label for="task1"><li>Задача 1</li></label>
    <input type="checkbox" id="task2">
    <label for="task2"><li>Задача 2</li></label>
    <input type="checkbox" id="task3">
    <label for="task3"><li>Задача 3</li></label>
  </ul>
</body>
</html>

```

В этом примере выполненные задачи будут отмечаться зелёным фоном и перечёркиваться.

### Стилизация формы выбора

Использование псевдокласса `:checked` для стилизации выбранных элементов формы.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .option {
      display: inline-block;
      padding: 10px 20px;
      margin: 5px;
      border: 2px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
      transition: border-color 0.3s, background-color 0.3s;
    }

    input[type="radio"]:checked + .option {
      border-color: #007bff; /* Изменение цвета границы выбранной опции */
      background-color: #e2e6ea; /* Изменение фона выбранной опции */
    }

    input[type="radio"] {
      display: none;
    }
  </style>
  <title>Стилизация формы выбора</title>
</head>
<body>
  <form>
    <input type="radio" id="option1" name="options">
    <label for="option1" class="option">Вариант 1</label>
    <input type="radio" id="option2" name="options">
    <label for="option2" class="option">Вариант 2</label>
    <input type="radio" id="option3" name="options">
    <label for="option3" class="option">Вариант 3</label>
  </form>
</body>
</html>

```

В этом примере выбранные опции формы будут выделяться с помощью изменённых фона и границы.

## Заключение

Псевдокласс `:checked` в CSS предоставляет мощный способ для стилизации элементов формы на основании их состояния "выбрано". Это улучшает взаимодействие пользователя с веб-страницей, делая её более интерактивной и интуитивно понятной. Понимание различных способов использования псевдокласса `:checked`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.