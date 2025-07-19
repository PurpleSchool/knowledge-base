---
metaTitle: Псевдоклассы группы type в CSS. Выбор элементов одного типа по порядковому номеру
metaDescription: Псевдоклассы группы type в CSS. Выбор элементов одного типа по порядковому номеру
author: Дмитрий Нечаев
title: Псевдоклассы группы type в CSS. Полное руководство с примерами
preview: Псевдоклассы группы type в CSS позволяют выбирать элементы одного типа на основе их порядкового номера среди родственных элементов.
---

Псевдоклассы группы `type` в CSS позволяют выбирать элементы одного типа на основе их порядкового номера среди родственных элементов. Это мощный инструмент для точной стилизации элементов, учитывая их тип и порядок внутри родителя. В этой статье мы рассмотрим основные псевдоклассы группы `type`, их применение и приведём примеры для различных ситуаций.

## Основные псевдоклассы группы `type`

### `:first-of-type`

Псевдокласс `:first-of-type` выбирает первый элемент среди родственных элементов одного типа.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:first-of-type {
      color: blue; /* Изменение цвета текста первого абзаца среди других абзацев */
    }
  </style>
  <title>:first-of-type</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
    <p>Третий абзац.</p>
  </div>
</body>
</html>

```

В этом примере первый абзац внутри `<div>` будет синим.

### `:last-of-type`

Псевдокласс `:last-of-type` выбирает последний элемент среди родственных элементов одного типа.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:last-of-type {
      color: red; /* Изменение цвета текста последнего абзаца среди других абзацев */
    }
  </style>
  <title>:last-of-type</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
    <p>Третий абзац.</p>
  </div>
</body>
</html>

```

В этом примере последний абзац внутри `<div>` будет красным.

### `:nth-of-type(n)`

Псевдокласс `:nth-of-type(n)` выбирает n-ный элемент среди родственных элементов одного типа. N может быть числом, ключевым словом или формулой.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:nth-of-type(2) {
      background-color: yellow; /* Изменение фона второго абзаца среди других абзацев */
    }
  </style>
  <title>:nth-of-type</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
    <p>Третий абзац.</p>
  </div>
</body>
</html>

```

В этом примере второй абзац внутри `<div>` будет с жёлтым фоном.

Псевдоклассы группы `:nth-child` позволяют выбирать элементы одного типа по порядковому номеру, что открывает широкие возможности для создания сложных и адаптивных макетов. Но для эффективного использования этих псевдоклассов необходимо понимать, как работает каскад стилей, как рассчитывается специфичность селекторов и как правильно использовать различные типы псевдоклассов. Если вы хотите детальнее изучить CSS и научиться создавать сложные и красивые веб-страницы, — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=psevdoklassy-gruppy-type-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Использование формулы

Псевдокласс `:nth-of-type` может использовать формулу для выбора элементов.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:nth-of-type(odd) {
      background-color: #f0f0f0; /* Изменение фона нечётных абзацев */
    }

    p:nth-of-type(even) {
      background-color: #ccc; /* Изменение фона чётных абзацев */
    }
  </style>
  <title>:nth-of-type с формулой</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
    <p>Третий абзац.</p>
    <p>Четвёртый абзац.</p>
    <p>Пятый абзац.</p>
  </div>
</body>
</html>

```

В этом примере фон нечётных абзацев будет светло-серым, а чётных — более тёмным.

### `:nth-last-of-type(n)`

Псевдокласс `:nth-last-of-type(n)` выбирает n-ный элемент среди родственных элементов одного типа, начиная с конца.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:nth-last-of-type(2) {
      background-color: lightgreen; /* Изменение фона предпоследнего абзаца среди других абзацев */
    }
  </style>
  <title>:nth-last-of-type</title>
</head>
<body>
  <div>
    <p>Первый абзац.</p>
    <p>Второй абзац.</p>
    <p>Третий абзац.</p>
    <p>Четвёртый абзац.</p>
    <p>Пятый абзац.</p>
  </div>
</body>
</html>

```

В этом примере предпоследний абзац внутри `<div>` будет с светло-зелёным фоном.

### `:only-of-type`

Псевдокласс `:only-of-type` выбирает элемент, который является единственным дочерним элементом своего типа среди родственных элементов.

Пример использования:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:only-of-type {
      font-style: italic; /* Курсив для единственного абзаца среди других типов элементов */
    }
  </style>
  <title>:only-of-type</title>
</head>
<body>
  <div>
    <p>Я единственный абзац внутри этого div.</p>
    <span>Я не абзац.</span>
  </div>
  <div>
    <p>Я не единственный абзац.</p>
    <p>Я тоже не единственный абзац.</p>
  </div>
</body>
</html>

```

В этом примере абзац внутри первого `<div>` будет курсивным, так как он единственный элемент своего типа.

## Комбинирование псевдоклассов группы `type`

Псевдоклассы группы `type` можно комбинировать с другими селекторами и псевдоклассами для создания более сложных и точных правил стилизации.

### Комбинирование с селекторами по классу

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .highlight:nth-of-type(3) {
      font-weight: bold; /* Жирный шрифт для третьего элемента с классом highlight */
    }
  </style>
  <title>Комбинирование с классами</title>
</head>
<body>
  <div class="highlight">Элемент 1</div>
  <div class="highlight">Элемент 2</div>
  <div class="highlight">Элемент 3</div>
  <div class="highlight">Элемент 4</div>
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
    p:nth-of-type(2):hover {
      color: red; /* Изменение цвета текста при наведении на второй абзац */
    }

    p:nth-of-type(3):focus {
      background-color: lightblue; /* Изменение фона при фокусе на третьем абзаце */
    }
  </style>
  <title>Комбинирование с :hover и :focus</title>
</head>
<body>
  <div>
    <p tabindex="0">Первый абзац.</p>
    <p tabindex="0">Второй абзац.</p>
    <p tabindex="0">Третий абзац.</p>
    <p tabindex="0">Четвёртый абзац.</p>
  </div>
</body>
</html>

```

## Примеры использования в реальных проектах

### Таблица с выделением строк

Использование псевдокласса `:nth-of-type` для создания таблицы с выделением строк:

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

    tr:nth-of-type(odd) {
      background-color: #f2f2f2; /* Изменение фона нечётных строк таблицы */
    }

    tr:nth-of-type(even) {
      background-color: #e6e6e6; /* Изменение фона чётных строк таблицы */
    }
  </style>
  <title>Выделение строк таблицы</title>
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

### Список с выделением определённых элементов

Использование псевдокласса `:nth-of-type` для выделения определённых элементов списка:

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

    ul li:nth-of-type(2n) {
      background-color: #007bff;
      color: white;
      padding: 10px;
      margin-bottom: 5px;
    }
  </style>
  <title>Выделение элементов списка</title>
</head>
<body>
  <ul>
    <li>Первый элемент</li>
    <li>Второй элемент</li>
    <li>Третий элемент</li>
    <li>Четвёртый элемент</li>
    <li>Пятый элемент</li>
  </ul>
</body>
</html>
```

## Заключение

Псевдоклассы группы `type` в CSS предоставляют мощный способ для выбора и стилизации элементов на основе их порядкового номера среди родственных элементов одного типа. Они позволяют создавать более точные и гибкие правила стилизации, улучшая внешний вид и функциональность веб-страниц. Понимание различных псевдоклассов группы `type` и их правильное использование помогает разработчикам создавать адаптивные и поддерживаемые стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Для создания современных и интерактивных веб-сайтов необходимо владеть гораздо большим набором навыков и технологий. На нашем курсе [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=psevdoklassy-gruppy-type-v-css-polnoe-rukovodstvo-s-primerami) вы получите все необходимые знания и практические навыки для успешной работы. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
