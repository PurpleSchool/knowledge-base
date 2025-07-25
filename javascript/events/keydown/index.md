---
metaTitle: Событие keydown в JavaScript
metaDescription: Разбираемся как работает событие keydown в JavaScript
author: Дмитрий Нечаев
title: Событие keydown в JavaScript
preview: Учимся пользоваться событием keydown в JavaScript. Разбираем примеры использования
---

Событие `keydown` в JavaScript является одним из трех основных типов событий клавиатуры (наряду с `keypress` и `keyup`). Это событие срабатывает, когда пользователь нажимает клавишу на клавиатуре. Оно может использоваться для различных целей, таких как обработка горячих клавиш, управление вводом данных и интерактивное управление элементами интерфейса. В этой статье мы рассмотрим, как работает событие `keydown`, как его можно использовать в веб-приложениях и предоставим примеры кода.

### Как работает событие "keydown"?

Событие `keydown` срабатывает в момент, когда клавиша на клавиатуре нажимается, до того как она отпущена (`keyup`). В отличие от `keypress`, `keydown` срабатывает для всех клавиш, включая функциональные (например, `Shift`, `Ctrl`, `Alt` и стрелки). 

Для правильной обработки `keydown` необходимо учитывать особенности работы события в разных браузерах, уметь определять, какая клавиша была нажата, и избегать проблем с производительностью при обработке большого количества событий. Если вы хотите освоить все нюансы работы с событием `keydown` и создавать интерактивные веб-приложения, реагирующие на ввод с клавиатуры, приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=sobytie-keydown-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Примеры использования события "keydown"

### Обработка комбинаций клавиш

Событие `keydown` часто используется для обработки сочетаний клавиш, таких как сочетания с `Ctrl` или `Alt`.

```jsx
document.addEventListener('keydown', function(event) {
    // Проверяем, нажата ли клавиша Ctrl и клавиша S одновременно
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // предотвращаем стандартное действие (сохранение файла)
        console.log('Выполнено сохранение документа!');
        // Вызываем функцию сохранения документа
        saveDocument();
    }
});

```

### Навигация с помощью клавиатуры

Событие `keydown` также можно использовать для создания клавиатурной навигации на странице.

```jsx
document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'ArrowUp':
            console.log('Нажата стрелка вверх');
            moveUp();
            break;
        case 'ArrowDown':
            console.log('Нажата стрелка вниз');
            moveDown();
            break;
    }
});

```

### Предотвращение ввода нежелательных символов

`keydown` может использоваться для предотвращения ввода определенных символов в поля ввода.

```jsx
const input = document.querySelector('input[type="text"]');

input.addEventListener('keydown', function(event) {
    // Разрешаем только цифры
    if (!event.key.match(/[0-9]/) && event.key !== 'Backspace') {
        event.preventDefault(); // Отменяем ввод символа
    }
});

```

### Особенности работы события "keydown"

- **Повторение событий**: Если клавиша удерживается нажатой, событие `keydown` может срабатывать многократно из-за автоповтора.
- **Доступ к свойствам события**: Событие предоставляет доступ к различным свойствам, таким как `key` (символьное представление клавиши), `keyCode` (устаревший код клавиши) и модификаторам типа `shiftKey`, `ctrlKey`, `altKey`.

### Заключение

Событие `keydown` является важным инструментом для интерактивного управления поведением пользовательского интерфейса. Оно позволяет разработчикам реализовывать сложные функции управления вводом, клавиатурные шорткаты и навигацию, что делает веб-приложения более доступными и удобными для пользователей. Правильное использование `keydown` в сочетании с другими событиями клавиатуры может значительно повысить функциональность и удобство веб-сайтов.

Обработка событий клавиатуры, таких как `keydown` и `keyup`, является важной частью создания доступных и удобных веб-приложений. Для этого необходимо учитывать не только технические аспекты работы с событиями, но и принципы accessibility, чтобы пользователи с ограниченными возможностями могли полноценно взаимодействовать с вашим сайтом. Если вы готовы расширить свой кругозор и изучить все аспекты создания доступных веб-приложений, обратите внимание на курс [JavaScript Advanced](https://purpleschool.ru/course/javascript-advanced?utm_source=knowledgebase&utm_medium=text&utm_campaign=sobytie-keydown-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир продвинутого JavaScript прямо сегодня.
