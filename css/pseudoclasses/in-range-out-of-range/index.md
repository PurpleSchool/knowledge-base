---
metaTitle: Псевдоклассы in-range и out-of-range в CSS. Проверка правильности заполнения полей ввода с числами
metaDescription: Псевдоклассы in-range и out-of-range в CSS. Проверка правильности заполнения полей ввода с числами
author: Дмитрий Нечаев
title: Псевдоклассы in-range и out-of-range. Полное руководство с примерами
preview: Псевдоклассы in-range и out-of-range в CSS используются для стилизации полей ввода с числовыми значениями на основе их допустимых значений.
---

Псевдоклассы `:in-range` и `:out-of-range` в CSS используются для стилизации полей ввода с числовыми значениями на основе их допустимых значений. Эти псевдоклассы помогают проверить правильность заполнения полей ввода прямо в браузере, предоставляя визуальные подсказки пользователю. В этой статье мы подробно рассмотрим псевдоклассы `:in-range` и `:out-of-range`, их применение и приведём примеры использования для различных ситуаций.

## Что такое псевдоклассы `:in-range` и `:out-of-range`?

Псевдокласс `:in-range` применяется к полям ввода, значение которых находится в пределах допустимого диапазона, определённого атрибутами `min` и `max`.

Псевдокласс `:out-of-range` применяется к полям ввода, значение которых выходит за пределы допустимого диапазона.

Для эффективного использования псевдоклассов `in-range` и `out-of-range` необходимо понимание HTML5 атрибутов, определяющих допустимые значения для полей ввода. Без знания HTML основ, стилизация этих псевдоклассов будет неполной. Если вы хотите детально изучить HTML и CSS и научиться валидировать формы на стороне клиента, то наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklassy-in-range-i-out-of-range-Polnoe-rukovodstvo-s-primerami) будет для вас полезен. На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример базового использования `:in-range` и `:out-of-range`

```css
input:in-range {
  /* Стили для поля ввода, значение которого в пределах допустимого диапазона */
}

input:out-of-range {
  /* Стили для поля ввода, значение которого выходит за пределы допустимого диапазона */
}

```

Пример использования псевдоклассов `:in-range` и `:out-of-range` для изменения стилей полей ввода:

```css
input:in-range {
  border-color: green;
}

input:out-of-range {
  border-color: red;
}

```

В этом примере поле ввода с числовым значением в пределах допустимого диапазона будет иметь зелёную границу, а поле ввода с значением вне допустимого диапазона — красную.

## Примеры использования псевдоклассов `:in-range` и `:out-of-range`

### Основные примеры

### Стилизация поля ввода с числовыми значениями

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="number"]:in-range {
      border: 2px solid green; /* Зелёная граница для значений в пределах диапазона */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input[type="number"]:out-of-range {
      border: 2px solid red; /* Красная граница для значений вне диапазона */
      background-color: #ffe0e0; /* Светло-красный фон */
    }
  </style>
  <title>Стилизация поля ввода с числовыми значениями</title>
</head>
<body>
  <label for="age">Возраст (от 18 до 65):</label>
  <input type="number" id="age" name="age" min="18" max="65">
</body>
</html>

```

В этом примере поле ввода будет иметь зелёную границу и светло-зелёный фон, если значение находится в пределах от 18 до 65, и красную границу и светло-красный фон, если значение выходит за эти пределы.

### Стилизация нескольких полей ввода

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="number"]:in-range {
      border: 2px solid green; /* Зелёная граница для значений в пределах диапазона */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input[type="number"]:out-of-range {
      border: 2px solid red; /* Красная граница для значений вне диапазона */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    .form-field {
      margin-bottom: 20px; /* Отступ снизу для каждого поля формы */
    }
  </style>
  <title>Стилизация нескольких полей ввода</title>
</head>
<body>
  <div class="form-field">
    <label for="age">Возраст (от 18 до 65):</label>
    <input type="number" id="age" name="age" min="18" max="65">
  </div>
  <div class="form-field">
    <label for="height">Рост (от 150 до 200 см):</label>
    <input type="number" id="height" name="height" min="150" max="200">
  </div>
</body>
</html>

```

В этом примере каждое поле ввода будет стилизовано аналогично предыдущему примеру, но теперь у нас два поля: одно для возраста, другое для роста.

### Сложные примеры

### Стилизация с использованием псевдоэлементов

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="number"]:in-range {
      border: 2px solid green; /* Зелёная граница для значений в пределах диапазона */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input[type="number"]:out-of-range {
      border: 2px solid red; /* Красная граница для значений вне диапазона */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    input[type="number"]:out-of-range::after {
      content: "Значение вне допустимого диапазона"; /* Сообщение для значений вне диапазона */
      color: red; /* Цвет текста сообщения */
      display: block; /* Отображение блока */
      margin-top: 5px; /* Отступ сверху */
    }
  </style>
  <title>Стилизация с использованием псевдоэлементов</title>
</head>
<body>
  <label for="salary">Зарплата (от 30,000 до 100,000):</label>
  <input type="number" id="salary" name="salary" min="30000" max="100000">
</body>
</html>

```

В этом примере к полю ввода добавляется сообщение, если введённое значение выходит за пределы допустимого диапазона.

### Комбинирование с другими псевдоклассами

### Комбинирование с псевдоклассом `:focus`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    input[type="number"]:in-range:focus {
      border-color: darkgreen; /* Более тёмная зелёная граница при фокусе */
      box-shadow: 0 0 5px green; /* Тень зелёного цвета */
    }

    input[type="number"]:out-of-range:focus {
      border-color: darkred; /* Более тёмная красная граница при фокусе */
      box-shadow: 0 0 5px red; /* Тень красного цвета */
    }
  </style>
  <title>Комбинирование с псевдоклассом :focus</title>
</head>
<body>
  <label for="temperature">Температура (от -10 до 40):</label>
  <input type="number" id="temperature" name="temperature" min="-10" max="40">
</body>
</html>

```

В этом примере граница и тень поля ввода изменяются при фокусе, в зависимости от того, находится ли значение в допустимом диапазоне или нет.

## Использование в реальных проектах

### Стилизация формы регистрации

Пример использования псевдоклассов `:in-range` и `:out-of-range` для стилизации полей ввода в форме регистрации:

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

    input[type="number"]:in-range {
      border: 2px solid green; /* Зелёная граница для значений в пределах диапазона */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input[type="number"]:out-of-range {
      border: 2px solid red; /* Красная граница для значений вне диапазона */
      background-color: #ffe0e0; /* Светло-красный фон

 */
    }

    .form-field {
      margin-bottom: 15px; /* Отступ снизу для каждого поля формы */
    }

    .form-field label {
      display: block; /* Блочное отображение */
      margin-bottom: 5px; /* Отступ снизу */
    }

    .form-field input {
      width: 100%; /* Ширина 100% */
      padding: 8px; /* Внутренние отступы */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button {
      background-color: #007bff; /* Фон кнопки */
      color: white; /* Цвет текста */
      padding: 10px 20px; /* Внутренние отступы */
      border: none; /* Без границы */
      border-radius: 5px; /* Скругление углов */
      cursor: pointer; /* Курсор указателя */
      display: block; /* Блочное отображение */
      width: 100%; /* Ширина 100% */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button:hover {
      background-color: #0056b3; /* Изменение фона при наведении */
    }
  </style>
  <title>Стилизация формы регистрации</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="age">Возраст (от 18 до 65):</label>
      <input type="number" id="age" name="age" min="18" max="65">
    </div>
    <div class="form-field">
      <label for="height">Рост (от 150 до 200 см):</label>
      <input type="number" id="height" name="height" min="150" max="200">
    </div>
    <div class="form-field">
      <label for="weight">Вес (от 40 до 150 кг):</label>
      <input type="number" id="weight" name="weight" min="40" max="150">
    </div>
    <button type="submit" class="submit-button">Регистрация</button>
  </form>
</body>
</html>

```

В этом примере поля ввода для возраста, роста и веса в форме регистрации будут стилизованы в зависимости от того, находятся ли введённые значения в пределах допустимого диапазона.

### Стилизация формы заказа

Пример использования псевдоклассов `:in-range` и `:out-of-range` для стилизации полей ввода в форме заказа:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    form {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }

    input[type="number"]:in-range {
      border: 2px solid green; /* Зелёная граница для значений в пределах диапазона */
      background-color: #e0ffe0; /* Светло-зелёный фон */
    }

    input[type="number"]:out-of-range {
      border: 2px solid red; /* Красная граница для значений вне диапазона */
      background-color: #ffe0e0; /* Светло-красный фон */
    }

    .form-field {
      margin-bottom: 20px; /* Отступ снизу для каждого поля формы */
    }

    .form-field label {
      display: block; /* Блочное отображение */
      margin-bottom: 5px; /* Отступ снизу */
    }

    .form-field input {
      width: 100%; /* Ширина 100% */
      padding: 10px; /* Внутренние отступы */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button {
      background-color: #28a745; /* Фон кнопки */
      color: white; /* Цвет текста */
      padding: 10px 20px; /* Внутренние отступы */
      border: none; /* Без границы */
      border-radius: 5px; /* Скругление углов */
      cursor: pointer; /* Курсор указателя */
      display: block; /* Блочное отображение */
      width: 100%; /* Ширина 100% */
      box-sizing: border-box; /* Учет границы в ширину */
    }

    .submit-button:hover {
      background-color: #218838; /* Изменение фона при наведении */
    }
  </style>
  <title>Стилизация формы заказа</title>
</head>
<body>
  <form>
    <div class="form-field">
      <label for="quantity">Количество (от 1 до 100):</label>
      <input type="number" id="quantity" name="quantity" min="1" max="100">
    </div>
    <div class="form-field">
      <label for="price">Цена (от 100 до 10000):</label>
      <input type="number" id="price" name="price" min="100" max="10000">
    </div>
    <button type="submit" class="submit-button">Оформить заказ</button>
  </form>
</body>
</html>

```

В этом примере поля ввода для количества и цены в форме заказа будут стилизованы в зависимости от того, находятся ли введённые значения в пределах допустимого диапазона.

## Заключение

Псевдоклассы `:in-range` и `:out-of-range` в CSS предоставляют мощный способ для стилизации полей ввода с числовыми значениями на основе их допустимых значений. Это улучшает взаимодействие пользователя с веб-страницей, предоставляя визуальные подсказки о правильности введённых данных. Понимание различных способов использования псевдоклассов `:in-range` и `:out-of-range`, а также их комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Применение псевдоклассов `in-range` и `out-of-range` позволяет улучшить взаимодействие пользователя с формами, делая их более понятными. Чтобы освоить этот и другие полезные инструменты, советуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklassy-in-range-i-out-of-range-Polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
