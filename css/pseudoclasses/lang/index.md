---
metaTitle: Псевдокласс lang в CSS. Стилизация текста в зависимости от языка
metaDescription: Псевдокласс lang в CSS. Стилизация текста в зависимости от языка
author: Дмитрий Нечаев
title: Псевдокласс lang в CSS. Полное руководство с примерами
preview: Псевдокласс lang в CSS используется для стилизации текста в зависимости от языка, на котором он написан.
---

Псевдокласс `:lang` в CSS используется для стилизации текста в зависимости от языка, на котором он написан. Это полезно для создания многоязычных веб-сайтов, где стиль текста может изменяться в зависимости от языка пользователя. В этой статье мы подробно рассмотрим псевдокласс `:lang`, его применение и приведём примеры использования для различных ситуаций.

## Что такое псевдокласс `:lang`?

Псевдокласс `:lang` применяется к элементам, язык которых указан с помощью атрибута `lang`. Это позволяет стилизовать текст на основе заданного языка. Например, можно изменить шрифт, цвет или выравнивание текста в зависимости от языка.

Использование псевдокласса `:lang` требует понимания не только CSS, но и HTML-атрибута `lang`, который определяет язык контента. Чтобы эффективно стилизовать текст в зависимости от языка, необходимо знать, как правильно указывать языковые атрибуты в HTML и как CSS взаимодействует с этими атрибутами. Если вы хотите углубить свои знания в HTML и CSS и научиться создавать многоязычные веб-сайты — приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-lang-v-CSS-Polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Пример базового использования `:lang`

```css
element:lang(language-code) {
  /* Стили для элементов с указанным языковым кодом */
}

```

Пример использования псевдокласса `:lang` для изменения стилей текста на русском и английском языках:

```css
p:lang(ru) {
  color: blue; /* Синий цвет текста для русского языка */
}

p:lang(en) {
  color: green; /* Зелёный цвет текста для английского языка */
}

```

В этом примере текст абзацев на русском языке будет синим, а на английском языке — зелёным.

## Примеры использования псевдокласса `:lang`

### Основные примеры

### Стилизация текста в зависимости от языка

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:lang(ru) {
      color: blue; /* Синий цвет текста для русского языка */
    }

    p:lang(en) {
      color: green; /* Зелёный цвет текста для английского языка */
    }
  </style>
  <title>Стилизация текста в зависимости от языка</title>
</head>
<body>
  <p lang="ru">Это текст на русском языке.</p>
  <p lang="en">This is text in English.</p>
</body>
</html>

```

В этом примере текст абзацев на русском языке будет синим, а на английском языке — зелёным.

### Сложные примеры

### Стилизация текста с разными шрифтами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:lang(ru) {
      font-family: 'Arial', sans-serif; /* Шрифт Arial для русского текста */
      font-size: 16px; /* Размер шрифта */
    }

    p:lang(en) {
      font-family: 'Times New Roman', serif; /* Шрифт Times New Roman для английского текста */
      font-size: 14px; /* Размер шрифта */
    }
  </style>
  <title>Стилизация текста с разными шрифтами</title>
</head>
<body>
  <p lang="ru">Это текст на русском языке с шрифтом Arial.</p>
  <p lang="en">This is text in English with Times New Roman font.</p>
</body>
</html>

```

В этом примере текст абзацев на русском языке будет отображаться с шрифтом Arial, а на английском языке — с шрифтом Times New Roman.

### Стилизация текста с разным выравниванием

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:lang(ru) {
      text-align: justify; /* Выравнивание текста по ширине для русского языка */
    }

    p:lang(en) {
      text-align: left; /* Выравнивание текста по левому краю для английского языка */
    }
  </style>
  <title>Стилизация текста с разным выравниванием</title>
</head>
<body>
  <p lang="ru">Это текст на русском языке, выровненный по ширине.</p>
  <p lang="en">This is text in English, aligned to the left.</p>
</body>
</html>

```

В этом примере текст абзацев на русском языке будет выровнен по ширине, а на английском языке — по левому краю.

### Комбинирование с другими селекторами и псевдоклассами

Пример:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    p:lang(ru):first-letter {
      font-size: 2em; /* Увеличение первой буквы для русского текста */
      color: red; /* Красный цвет первой буквы */
    }

    p:lang(en)::first-line {
      font-weight: bold; /* Полужирный шрифт для первой строки английского текста */
      text-transform: uppercase; /* Преобразование первой строки в верхний регистр */
    }
  </style>
  <title>Комбинирование с другими селекторами и псевдоклассами</title>
</head>
<body>
  <p lang="ru">Это текст на русском языке. Первая буква этого абзаца будет увеличена и выделена красным цветом.</p>
  <p lang="en">This is text in English. The first line of this paragraph will be bold and uppercase.</p>
</body>
</html>

```

В этом примере первая буква русского текста будет увеличена и выделена красным цветом, а первая строка английского текста будет полужирной и преобразованной в верхний регистр.

## Использование в реальных проектах

### Стилизация многоязычного веб-сайта

Пример использования псевдокласса `:lang` для стилизации элементов на многоязычном веб-сайте:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    h1:lang(ru) {
      color: blue; /* Синий цвет заголовка для русского языка */
    }

    h1:lang(en) {
      color: green; /* Зелёный цвет заголовка для английского языка */
    }

    p:lang(ru) {
      font-family: 'Arial', sans-serif; /* Шрифт Arial для русского текста */
      font-size: 16px; /* Размер шрифта */
    }

    p:lang(en) {
      font-family: 'Times New Roman', serif; /* Шрифт Times New Roman для английского текста */
      font-size: 14px; /* Размер шрифта */
    }
  </style>
  <title>Стилизация многоязычного веб-сайта</title>
</head>
<body>
  <h1 lang="ru">Добро пожаловать на наш сайт!</h1>
  <p lang="ru">Это текст на русском языке.</p>

  <h1 lang="en">Welcome to our website!</h1>
  <p lang="en">This is text in English.</p>
</body>
</html>

```

В этом примере заголовки и абзацы будут стилизованы в зависимости от языка, указанного в атрибуте `lang`.

### Стилизация формы обратной связи

Пример использования псевдокласса `:lang` для стилизации формы обратной связи на разных языках:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    label:lang(ru) {
      color: blue; /* Синий цвет текста для меток на русском языке */
    }

    label:lang(en) {
      color: green; /* Зелёный цвет текста для меток на английском языке */
    }

    input:lang(ru),
    textarea:lang(ru) {
      font-family: 'Arial', sans-serif; /* Шрифт Arial для русского текста */
      font-size: 16px; /* Размер шрифта */
    }

    input:lang(en),
    textarea:lang(en) {
      font-family: 'Times New Roman', serif; /* Шрифт Times New Roman для английского текста */
      font-size: 14px; /* Размер шрифта */
    }
  </style>
  <title>Стилизация формы обратной связи</title>
</head>
<body>
  <form>
    <label for="name" lang="ru">Имя:</label>
    <input type="text" id="name" name="name" lang="ru" placeholder="Введите ваше имя">
    <br>
    <label for="email" lang="ru">Email:</

label>
    <input type="email" id="email" name="email" lang="ru" placeholder="Введите ваш email">
    <br>
    <label for="message" lang="ru">Сообщение:</label>
    <textarea id="message" name="message" lang="ru" rows="5" placeholder="Введите ваше сообщение"></textarea>
    <br>
    <button type="submit" lang="ru">Отправить</button>
  </form>

  <form>
    <label for="name-en" lang="en">Name:</label>
    <input type="text" id="name-en" name="name-en" lang="en" placeholder="Enter your name">
    <br>
    <label for="email-en" lang="en">Email:</label>
    <input type="email" id="email-en" name="email-en" lang="en" placeholder="Enter your email">
    <br>
    <label for="message-en" lang="en">Message:</label>
    <textarea id="message-en" name="message-en" lang="en" rows="5" placeholder="Enter your message"></textarea>
    <br>
    <button type="submit" lang="en">Submit</button>
  </form>
</body>
</html>

```

В этом примере форма обратной связи будет стилизована в зависимости от языка, указанного в атрибуте `lang`.

## Заключение

Псевдокласс `:lang` в CSS предоставляет мощный способ для стилизации текста в зависимости от языка, на котором он написан. Это особенно полезно для создания многоязычных веб-сайтов, где стиль текста может изменяться в зависимости от языка пользователя. Понимание различных способов использования псевдокласса `:lang`, а также его комбинирование с другими селекторами и псевдоклассами, помогает разработчикам создавать более гибкие и адаптивные стили. Экспериментируйте с различными подходами и находите оптимальные решения для ваших проектов.

`:lang` позволяет адаптировать стили текста под различные языки, делая веб-сайты более удобными для пользователей со всего мира. Чтобы овладеть этим и другими инструментами веб-разработки, необходима прочная база знаний. Курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass-lang-v-CSS-Polnoe-rukovodstvo-s-primerami) предоставит вам все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
