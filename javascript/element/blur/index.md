---
metaTitle: .blur() в JavaScript
metaDescription: Разбираемся как использовать .blur() в JavaScript
author: Дмитрий Нечаев
title: .blur() в JavaScript
preview: Учимся пользоваться .blur() в JavaScript. Разбираем примеры использования
---

Метод `.blur()` в JavaScript предоставляет возможность программно снять фокус с указанного DOM-элемента. Фокус обычно устанавливается на элемент, когда пользователь взаимодействует с ним, например, щелкая по текстовому полю для ввода. Однако иногда может возникнуть необходимость снять фокус с элемента, например, после завершения действия или для управления последовательностью фокусировки. Давайте рассмотрим более подробно, как использовать метод `.blur()` с примерами.

## Введение в `.blur()`

Метод `.blur()` является частью интерфейса `HTMLElement` в JavaScript. Он вызывается на элементе DOM и приводит к потере фокуса этим элементом. Это означает, что элемент больше не будет активным для ввода, и фокус переходит к другому элементу или к самому документу.

Синтаксис метода `.blur()` прост:

```jsx
element.blur();

```

Где `element` - это DOM-элемент, на котором мы хотим снять фокус.

Метод `.blur()` используется для удаления фокуса с элемента. Это полезно, когда нужно скрыть клавиатуру на мобильных устройствах или отменить выделение элемента после выполнения определенного действия. Если вы хотите разобраться в пользовательском взаимодействии с элементами и научиться управлять фокусом — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=blur-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Примеры использования `.blur()`

Давайте рассмотрим несколько примеров использования метода `.blur()` для снятия фокуса с элементов на веб-странице.

### 1. Снятие фокуса после ввода данных

```html
<input type="text" id="myInput" placeholder="Введите текст">

```

```jsx
// Получаем ссылку на текстовое поле
const input = document.getElementById('myInput');

// Устанавливаем обработчик события на ввод данных
input.addEventListener('input', function() {
  // Снимаем фокус с текстового поля
  input.blur();
});

```

В этом примере при вводе данных в текстовое поле, мы вызываем метод `.blur()`, чтобы снять фокус с этого поля.

### 2. Снятие фокуса после клика на кнопку

```html
<button id="myButton">Нажми меня</button>

```

```jsx
// Получаем ссылку на кнопку
const button = document.getElementById('myButton');

// Устанавливаем обработчик события на клик
button.addEventListener('click', function() {
  // Снимаем фокус с кнопки
  button.blur();
});

```

В этом примере, после клика на кнопку, вызывается метод `.blur()`, чтобы снять фокус с этой кнопки.

### 3. Снятие фокуса при потере фокуса у другого элемента

```html
<input type="text" id="input1" placeholder="Введите текст">
<input type="text" id="input2" placeholder="Введите текст">

```

```jsx
// Получаем ссылки на оба текстовых поля
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');

// Устанавливаем обработчик события на потерю фокуса у input1
input1.addEventListener('blur', function() {
  // Снимаем фокус с input2 после потери фокуса у input1
  input2.blur();
});

```

В этом примере, при потере фокуса у первого текстового поля, мы снимаем фокус с другого текстового поля, вызвав метод `.blur()`.

## Заключение

Метод `.blur()` предоставляет удобный способ снять фокус с DOM-элемента на веб-странице. Это может быть полезно для управления фокусировкой и улучшения пользовательского опыта. Мы рассмотрели его базовый синтаксис и примеры использования для различных сценариев. Надеюсь, данная статья помогла вам лучше понять, как использовать `.blur()` в ваших проектах JavaScript.

`.blur()` является противоположностью метода `.focus()`. Для детального понимания работы с фокусом, приглашаем вас на наш курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=blur-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
