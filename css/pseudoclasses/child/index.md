---
metaTitle: Псевдоклассы группы child в CSS. Выбор элементов по порядковому номеру
metaDescription: Псевдоклассы группы child в CSS. Выбор элементов по порядковому номеру
author: Дмитрий Нечаев
title: Псевдоклассы группы child в CSS. Полное руководство с примерами
preview: Псевдоклассы группы child в CSS позволяют выбирать элементы не по классу или тегу, а по их порядковому номеру среди родительских элементов.
---

Псевдоклассы группы `child` в CSS позволяют выбирать элементы не по классу или тегу, а по их порядковому номеру среди родительских элементов. Это мощный инструмент для точной стилизации элементов, исходя из их положения в структуре HTML-документа. В этой статье мы рассмотрим основные псевдоклассы группы `child`, их применение и приведем примеры для различных ситуаций.

## Основные псевдоклассы группы `child`

### `:first-child`

Псевдокласс `:first-child` выбирает первый дочерний элемент своего родителя.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:first-child {
      color: blue; /* Изменение цвета текста первого дочернего абзаца */
    }
  </style>
  <title>:first-child</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
  </div>
</body>
</html>

```

В этом примере первый абзац внутри `<div>` будет синим.

### `:last-child`

Псевдокласс `:last-child` выбирает последний дочерний элемент своего родителя.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:last-child {
      color: red; /* Изменение цвета текста последнего дочернего абзаца */
    }
  </style>
  <title>:last-child</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
  </div>
</body>
</html>

```

В этом примере последний абзац внутри `<div>` будет красным.

### `:nth-child(n)`

Псевдокласс `:nth-child(n)` выбирает n-ный дочерний элемент своего родителя. N может быть числом, ключевым словом или формулой.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    li:nth-child(2) {
      background-color: yellow; /* Изменение фона второго элемента списка */
    }
  </style>
  <title>:nth-child</title>
</head>
<body>
  <ul>
    <li>Элемент 1</li>
    <li>Элемент 2</li>
    <li>Элемент 3</li>
  </ul>
</body>
</html>

```

В этом примере второй элемент списка будет с жёлтым фоном.

### Использование формулы

Псевдокласс `:nth-child` может использовать формулу для выбора элементов.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    li:nth-child(odd) {
      background-color: #f0f0f0; /* Изменение фона нечётных элементов списка */
    }

    li:nth-child(even) {
      background-color: #ccc; /* Изменение фона чётных элементов списка */
    }
  </style>
  <title>:nth-child с формулой</title>
</head>
<body>
  <ul>
    <li>Элемент 1</li>
    <li>Элемент 2</li>
    <li>Элемент 3</li>
    <li>Элемент 4</li>
    <li>Элемент 5</li>
  </ul>
</body>
</html>

```

В этом примере фон нечётных элементов списка будет светло-серым, а чётных — более тёмным.

### `:nth-last-child(n)`

Псевдокласс `:nth-last-child(n)` выбирает n-ный дочерний элемент с конца своего родителя.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    li:nth-last-child(2) {
      background-color: lightgreen; /* Изменение фона предпоследнего элемента списка */
    }
  </style>
  <title>:nth-last-child</title>
</head>
<body>
  <ul>
    <li>Элемент 1</li>
    <li>Элемент 2</li>
    <li>Элемент 3</li>
    <li>Элемент 4</li>
    <li>Элемент 5</li>
  </ul>
</body>
</html>

```

В этом примере предпоследний элемент списка будет с светло-зелёным фоном.

### `:only-child`

Псевдокласс `:only-child` выбирает элемент, который является единственным дочерним элементом своего родителя.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:only-child {
      font-style: italic; /* Курсив для единственного дочернего элемента */
    }
  </style>
  <title>:only-child</title>
</head>
<body>
  <div>
    <p>Я единственный абзац внутри этого div.</p>
  </div>
  <div>
    <p>Я не единственный абзац.</p>
    <p>Я тоже не единственный абзац.</p>
  </div>
</body>
</html>

```

В этом примере абзац внутри первого `<div>` будет курсивным.

## Комбинирование псевдоклассов группы `child`

Псевдоклассы группы `child` можно комбинировать с другими селекторами и псевдоклассами для создания более сложных и точных правил стилизации.

### Комбинирование с селекторами по классу

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .item:nth-child(3) {
      font-weight: bold; /* Жирный шрифт для третьего элемента с классом item */
    }
  </style>
  <title>Комбинирование с классами</title>
</head>
<body>
  <div class="item">Элемент 1</div>
  <div class="item">Элемент 2</div>
  <div class="item">Элемент 3</div>
  <div class="item">Элемент 4</div>
</body>
</html>

```

### Комбинирование с псевдоклассами `:hover` и `:focus`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    li:nth-child(2):hover {
      color: red; /* Изменение цвета текста при наведении на второй элемент списка */
    }

    li:nth-child(3):focus {
      background-color: lightblue; /* Изменение фона при фокусе на третьем элементе списка */
    }
  </style>
  <title>Комбинирование с :hover и :focus</title>
</head>
<body>
  <ul>
    <li tabindex="0">Элемент 1</li>
    <li tabindex="0">Элемент 2</li>
    <li tabindex="0">Элемент 3</li>
    <li tabindex="0">Элемент 4</li>
  </ul>
</body>
</html>

```

## Примеры использования в реальных проектах

### Таблица с чередующимися строками

Использование псевдокласса `:nth-child` для создания таблицы с чередующимися строками:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 10px;
      border: 1px solid #ccc;
    }

    tr:nth-child(even) {
      background-color: #f2f2f2; /* Изменение фона чётных

 строк таблицы */
    }
  </style>
  <title>Чередующиеся строки таблицы</title>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>Заголовок 1</th>
        <th>Заголовок 2</th>
        <th>Заголовок 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Ячейка 1</td>
        <td>Ячейка 2</td>
        <td>Ячейка 3</td>
      </tr>
      <tr>
        <td>Ячейка 4</td>
        <td>Ячейка 5</td>
        <td>Ячейка 6</td>
      </tr>
      <tr>
        <td>Ячейка 7</td>
        <td>Ячейка 8</td>
        <td>Ячейка 9</td>
      </tr>
    </tbody>
  </table>
</body>
</html>

```

### Список с выделением первых элементов

Использование псевдокласса `:first-child` для выделения первых элементов списка:

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

    ul li:first-child {
      background-color: #007bff;
      color: white;
      padding: 10px;
      margin-bottom: 5px;
    }
  </style>
  <title>Выделение первых элементов списка</title>
</head>
<body>
  <ul>
    <li>Первый элемент</li>
    <li>Второй элемент</li>
    <li>Третий элемент</li>
  </ul>
</body>
</html>

```

## Заключение

Псевдоклассы группы `child` в CSS предоставляют мощный способ для выбора и стилизации элементов на основе их порядкового номера. Они позволяют создавать более точные и гибкие правила стилизации, улучшая внешний вид и функциональность веб-страниц. Понимание различных псевдоклассов группы `child` и их правильное использование помогает разработчикам создавать адаптивные и поддерживаемые стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.