---
metaTitle: Директива @import в CSS. Импортируем одни файлы стилей в другие
metaDescription: Директива @import в CSS. Импортируем одни файлы стилей в другие
author: Дмитрий Нечаев
title: Директива @import в CSS. Полное руководство с примерами
preview: Директива @import в CSS позволяет импортировать один файл стилей в другой.
---

Директива `@import` в CSS позволяет импортировать один файл стилей в другой. Это упрощает управление стилями, позволяет организовать код более структурированно и повторно использовать общие стили на разных страницах. В этой статье мы подробно рассмотрим, как использовать директиву `@import`, и приведём примеры её применения.

## Основы директивы `@import`

Директива `@import` используется для включения содержимого одного CSS-файла в другой. Это позволяет разделять стили на логические блоки и включать их по мере необходимости.

### Синтаксис директивы `@import`

```css
@import url('path/to/styles.css');

```

Также можно использовать двойные кавычки для указания пути к файлу:

```css
@import "path/to/styles.css";

```

Директива `@import` позволяет импортировать стили из других файлов CSS, что облегчает организацию и поддержку кода. Однако, для эффективного использования `@import` необходимо понимать, как работает каскад стилей, как управлять зависимостями и как оптимизировать загрузку стилей для лучшей производительности. Если вы хотите углубить свои знания в области CSS и научиться создавать профессиональные веб-сайты с чистым и структурированным кодом, приглашаем вас на наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=direktiva-import-v-css-polnoe-rukovodstvo-s-primerami). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования `@import`

### Пример 1: Импорт базовых стилей

Предположим, у нас есть базовый файл стилей `base.css`, содержащий общие стили:

```css
/* base.css */
body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
}

h1 {
    color: #333;
}

```

Мы можем импортировать этот файл в другой CSS-файл, например, `styles.css`:

```css
/* styles.css */
@import url('base.css');

.container {
    width: 80%;
    margin: 0 auto;
}

p {
    line-height: 1.6;
}

```

В этом примере стили из `base.css` будут применены вместе со стилями из `styles.css`.

### Пример 2: Импорт с использованием медиазапросов

Директива `@import` может быть использована с медиазапросами для применения различных стилей в зависимости от устройства или размера экрана.

```css
@import url('mobile.css') screen and (max-width: 600px);
@import url('print.css') print;

```

В этом примере файл `mobile.css` будет импортирован только для экранов шириной до 600 пикселей, а файл `print.css` — только для печати.

### Пример 3: Импорт нескольких файлов

Можно импортировать несколько файлов стилей в один основной файл.

```css
@import url('reset.css');
@import url('layout.css');
@import url('typography.css');

```

В этом примере мы импортируем файлы `reset.css`, `layout.css` и `typography.css`, чтобы структурировать стили по категориям.

## Важные аспекты использования `@import`

### Порядок выполнения

Директива `@import` должна располагаться в начале CSS-файла, перед любыми другими правилами стилей. Если она используется после других стилей, эти стили могут не применяться должным образом.

```css
/* Правильно */
@import url('base.css');
@import url('layout.css');

/* Остальные стили */
body {
    background-color: #f0f0f0;
}

/* Неправильно */
body {
    background-color: #f0f0f0;
}

@import url('base.css');
@import url('layout.css');

```

### Производительность

Импортирование большого количества файлов с помощью `@import` может негативно сказаться на производительности загрузки страницы, так как каждый импортированный файл создаёт отдельный HTTP-запрос. В таких случаях рекомендуется использовать инструмент сборки CSS (например, Sass, PostCSS) для объединения файлов стилей в один.

### Альтернативы

Вместо использования `@import` для включения внешних файлов стилей, можно подключать их непосредственно в HTML-документе с помощью тега `<link>`:

```html
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="layout.css">
<link rel="stylesheet" href="typography.css">

```

Это может улучшить производительность за счёт параллельной загрузки файлов.

## Заключение

Директива `@import` в CSS предоставляет удобный способ включения внешних файлов стилей в основной файл, что упрощает организацию и управление стилями. Несмотря на её полезность, важно учитывать влияние на производительность и правильно использовать директиву в сочетании с другими методами подключения стилей. Освоив использование `@import`, вы сможете создавать более структурированные и поддерживаемые CSS-файлы для ваших веб-проектов.

`@import` упрощает организацию CSS-кода, но для создания полноценных и современных веб-сайтов необходимо владеть и другими техниками, такими как Flexbox и Grid. Чтобы получить комплексные навыки в области веб-разработки и научиться создавать профессиональные веб-страницы, рекомендуем вам наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=direktiva-import-v-css-polnoe-rukovodstvo-s-primerami). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
