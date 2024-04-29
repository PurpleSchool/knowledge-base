---
metaTitle: .dataset в JavaScript
metaDescription: Разбираемся как использовать .dataset в JavaScript
author: Дмитрий Нечаев
title: .dataset в JavaScript
preview: Учимся пользоваться .dataset в JavaScript. Разбираем примеры использования
---

Свойство `.dataset` в JavaScript предоставляет удобный способ хранения пользовательских данных непосредственно в HTML-разметке и дальнейшего доступа к этим данным из JavaScript. Это особенно полезно, когда нам нужно передать какую-то информацию из HTML в JavaScript или обратно без необходимости использования глобальных переменных или атрибутов. Давайте рассмотрим использование `.dataset` более подробно с примерами.

## Введение в `.dataset`

Свойство `.dataset` позволяет нам хранить пользовательские данные в HTML-разметке, используя атрибуты данных (data-attributes), и легко получать доступ к этим данным из JavaScript. Атрибуты данных имеют префикс `data-`, за которым следует произвольное имя, которое мы определяем. Например, `data-name`, `data-age`, и т.д.

Свойство `.dataset` представляет собой объект, содержащий все атрибуты данных элемента в виде ключей и соответствующих им значений.

## Примеры использования `.dataset`

Давайте рассмотрим несколько примеров использования свойства `.dataset` для хранения и чтения пользовательских данных.

### 1. Хранение данных в HTML

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="person" data-name="John" data-age="30" data-city="New York"></div>

  <script>
    // Получаем ссылку на элемент
    const personElement = document.getElementById('person');

    // Читаем данные из атрибутов данных и выводим их в консоль
    console.log(personElement.dataset.name); // Выведет: John
    console.log(personElement.dataset.age); // Выведет: 30
    console.log(personElement.dataset.city); // Выведет: New York
  </script>
</body>
</html>

```

В этом примере мы храним информацию о человеке (имя, возраст, город) с помощью атрибутов данных элемента `<div>`. Затем мы используем свойство `.dataset`, чтобы получить доступ к этим данным из JavaScript.

### 2. Изменение данных через JavaScript

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="person" data-name="John" data-age="30" data-city="New York"></div>

  <script>
    // Получаем ссылку на элемент
    const personElement = document.getElementById('person');

    // Изменяем данные атрибутов данных
    personElement.dataset.age = 35;
    personElement.dataset.city = 'Los Angeles';

    // Выводим измененные данные в консоль
    console.log(personElement.dataset.age); // Выведет: 35
    console.log(personElement.dataset.city); // Выведет: Los Angeles
  </script>
</body>
</html>

```

В этом примере мы изменяем данные атрибутов данных элемента через JavaScript, присваивая новые значения свойствам `.dataset`. Затем мы выводим измененные данные в консоль для проверки.

### 3. Использование данных для динамического создания контента

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пример</title>
</head>
<body>
  <div id="person" data-name="John" data-age="30" data-city="New York"></div>

  <script>
    // Получаем ссылку на элемент
    const personElement = document.getElementById('person');

    // Создаем HTML-разметку на основе данных атрибутов данных
    const infoMarkup = `
      <p>Имя: ${personElement.dataset.name}</p>
      <p>Возраст: ${personElement.dataset.age}</p>
      <p>Город: ${personElement.dataset.city}</p>
    `;

    // Вставляем созданную разметку в элемент
    personElement.innerHTML = infoMarkup;
  </script>
</body>
</html>

```

В этом примере мы используем данные из атрибутов данных элемента для динамического создания HTML-контента. Мы создаем HTML-разметку с помощью шаблонных строк (template literals), вставляя данные из атрибутов данных, а затем вставляем эту разметку в элемент.

## Заключение

Свойство `.dataset` предоставляет простой и удобный способ хранения пользовательских данных непосредственно в HTML-разметке и последующего доступа к этим данным из JavaScript. Это помогает сделать код более модульным и управляемым, а также улучшает читаемость и поддерживаемость проекта. Надеюсь, данная статья помогла вам лучше понять, как использовать `.dataset` в ваших проектах JavaScript.