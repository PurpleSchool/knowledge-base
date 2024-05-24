---
metaTitle: Псевдокласс focus-within в CSS. Выделяем элементы в фокусе и их родителей
metaDescription: Псевдокласс focus-within в CSS. Выделяем элементы в фокусе и их родителей
author: Дмитрий Нечаев
title: Псевдокласс focus-within в CSS. Полное руководство с примерами
preview: Псевдокласс focus-within в CSS используется для выделения элементов, которые содержат элементы, находящиеся в фокусе.
---

Псевдокласс `:focus-within` в CSS используется для выделения элементов, которые содержат элементы, находящиеся в фокусе. Это позволяет стилизовать родительские элементы, когда любой из их дочерних элементов получает фокус. В этой статье мы подробно рассмотрим псевдокласс `:focus-within`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:focus-within`?

Псевдокласс `:focus-within` применяется к элементам, которые содержат дочерний элемент, находящийся в фокусе. Это позволяет стилизовать родительский элемент, когда один из его потомков получает фокус. Это особенно полезно для улучшения взаимодействия пользователя с формами и интерактивными элементами на веб-странице.

Пример базового использования `:focus-within`:

```css
selector:focus-within {
  /* Стили для родительского элемента, когда его дочерний элемент в фокусе */
}

```

Пример использования псевдокласса `:focus-within` для контейнера формы:

```css
.form-container:focus-within {
  border-color: blue;
}

```

В этом примере цвет границы контейнера формы изменится на синий, когда один из его дочерних элементов (например, поле ввода) получит фокус.

## Примеры использования псевдокласса `:focus-within`

### Основные примеры

### Изменение цвета границы контейнера формы при фокусе на любом из полей

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .form-container {
      padding: 20px;
      border: 2px solid #ccc;
      border-radius: 5px;
      transition: border-color 0.3s;
    }

    .form-container:focus-within {
      border-color: blue; /* Изменение цвета границы контейнера при фокусе на любом из полей */
    }
  </style>
  <title>Изменение цвета границы контейнера формы</title>
</head>
<body>
  <div class="form-container">
    <form>
      <label for="name">Имя:</label>
      <input type="text" id="name" name="name">
      <br><br>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email">
      <br><br>
      <button type="submit">Отправить</button>
    </form>
  </div>
</body>
</html>

```

В этом примере цвет границы контейнера формы изменится на синий, когда любое из полей ввода получит фокус.

### Изменение фона контейнера при фокусе на любом из его дочерних элементов

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .card {
      padding: 20px;
      background-color: #f0f0f0;
      transition: background-color 0.3s;
    }

    .card:focus-within {
      background-color: lightyellow; /* Изменение фона контейнера при фокусе на любом из его дочерних элементов */
    }
  </style>
  <title>Изменение фона контейнера</title>
</head>
<body>
  <div class="card">
    <h2>Заголовок карточки</h2>
    <p>Описание карточки.</p>
    <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
  </div>
</body>
</html>

```

В этом примере фон контейнера карточки изменится на светло-жёлтый, когда поле ввода внутри карточки получит фокус.

### Сложные примеры

### Анимация при фокусе на любом дочернем элементе

Псевдокласс `:focus-within` можно использовать для создания анимаций при фокусе на любом дочернем элементе.

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .box {
      width: 200px;
      padding: 20px;
      background-color: #007bff;
      transition: transform 0.3s ease; /* Плавный переход */
    }

    .box:focus-within {
      transform: scale(1.1); /* Увеличение размера при фокусе на любом дочернем элементе */
    }
  </style>
  <title>Анимация при фокусе на любом дочернем элементе</title>
</head>
<body>
  <div class="box">
    <h2>Заголовок</h2>
    <p>Текст внутри контейнера.</p>
    <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
  </div>
</body>
</html>

```

В этом примере контейнер увеличится в размере, когда одно из полей ввода внутри него получит фокус.

### Изменение стилей кнопки при фокусе на её дочерних элементах

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .button:focus-within {
      background-color: #0056b3; /* Изменение фона кнопки при фокусе на её дочерних элементах */
    }

    .button span {
      display: inline-block;
      padding: 5px;
    }
  </style>
  <title>Изменение стилей кнопки при фокусе на её дочерних элементах</title>
</head>
<body>
  <div class="button" tabindex="0">
    <span>Нажмите Tab</span>
  </div>
</body>
</html>

```

В этом примере фон кнопки изменится на более тёмный, когда фокус будет установлен на её дочернем элементе `<span>`.

### Комбинирование с другими псевдоклассами и псевдоэлементами

Псевдокласс `:focus-within` можно комбинировать с другими псевдоклассами и псевдоэлементами для создания сложных эффектов.

### Комбинирование с псевдоклассом `:hover`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .container {
      padding: 20px;
      border: 2px solid #ccc;
      transition: border-color 0.3s, background-color 0.3s;
    }

    .container:hover,
    .container:focus-within {
      border-color: #007bff;
      background-color: #e2e6ea;
    }
  </style>
  <title>Комбинирование с :hover и :focus-within</title>
</head>
<body>
  <div class="container">
    <h2>Заголовок контейнера</h2>
    <p>Текст внутри контейнера.</p>
    <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
  </div>
</body>
</html>

```

В этом примере цвет границы и фона контейнера изменится, когда фокус будет установлен на любом дочернем элементе или при наведении курсора на контейнер.

### Комбинирование с псевдоэлементами `:before` и `:after`

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .input-container {
      position: relative;
      padding: 10px;
      border: 2px solid #ccc;
      border-radius: 5px;
      transition: border-color 0.3s;
    }

    .input-container:before {
      content: "Фокус на одном из элементов";
      position: absolute;
      top: -20px;
      left: 10px;
      font-size: 12px;
      color: transparent;
      transition: color 0.3s;
    }

    .input-container:focus-within {
      border-color:

 #007bff;
    }

    .input-container:focus-within:before {
      color: #007bff;
    }

    input {
      padding: 10px;
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
  </style>
  <title>Комбинирование с псевдоэлементами</title>
</head>
<body>
  <div class="input-container">
    <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
  </div>
</body>
</html>

```

В этом примере псевдоэлемент `:before` добавляет текст перед содержимым контейнера и изменяет его цвет, когда одно из полей ввода внутри контейнера получает фокус.

## Примеры использования в реальных проектах

### Стилизация форм

Использование псевдокласса `:focus-within` для стилизации контейнера формы:

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
      transition: border-color 0.3s;
    }

    form:focus-within {
      border-color: #007bff; /* Изменение цвета границы при фокусе на любом поле */
    }

    input, textarea {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
  </style>
  <title>Стилизация форм</title>
</head>
<body>
  <form>
    <label for="name">Имя:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <label for="message">Сообщение:</label>
    <textarea id="message" name="message" rows="5" required></textarea>

    <button type="submit">Отправить</button>
  </form>
</body>
</html>

```

### Стилизация карточек

Использование псевдокласса `:focus-within` для стилизации карточек при фокусе на любом их дочернем элементе:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .card {
      padding: 20px;
      border: 2px solid #ccc;
      border-radius: 10px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    .card:focus-within {
      border-color: #007bff;
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1);
    }

    .card input {
      padding: 10px;
      width: calc(100% - 22px); /* Учитываем padding и border */
      border: 1px solid #ccc;
      border-radius: 5px;
    }
  </style>
  <title>Стилизация карточек</title>
</head>
<body>
  <div class="card" tabindex="0">
    <h2>Заголовок карточки</h2>
    <p>Описание карточки.</p>
    <input type="text" placeholder="Нажмите Tab, чтобы перейти к этому полю">
  </div>
</body>
</html>

```

В этом примере граница и тень карточки изменятся, когда поле ввода внутри карточки получит фокус.

## Заключение

Псевдокласс `:focus-within` в CSS предоставляет мощный способ для стилизации родительских элементов, когда любой из их дочерних элементов находится в фокусе. Это улучшает взаимодействие пользователя с веб-страницей, делая её более интуитивно понятной и удобной для навигации. Понимание различных способов использования псевдокласса `:focus-within`, а также его комбинирование с другими псевдоклассами и псевдоэлементами, помогает разработчикам создавать гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

Напиши статью на русском языке на тему ":focus-within (Выделяем элементы в фокусе и их родителей.)" по CSS. Где нужно и возможно - с примерами (комментарии на русском языке).

Максимально подробно. Охвати большинство составляющих этой темы.