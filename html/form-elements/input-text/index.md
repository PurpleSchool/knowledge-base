---
metaTitle: Текстовое поле input text в HTML
metaDescription: Подробное руководство по текстовому полю input text в HTML - разберем атрибуты поведение валидацию UX нюансы и примеры кода
author: Олег Марков
title: Текстовое поле input text в HTML - полное руководство
preview: Узнайте как правильно использовать текстовое поле input text в HTML - какие атрибуты доступны как настроить ввод и валидацию и сделать форму удобной для пользователей
---

## Введение

Текстовое поле `input type="text"` — один из самых часто используемых элементов форм в HTML. С его помощью вы получаете от пользователя строки текста: имя, логин, город, поисковый запрос и многое другое. Вроде бы элемент простой, но у него много тонкостей: автозаполнение, ограничения длины, подсказки, обработка ошибок, доступность, работа на мобильных устройствах.

Смотрите, я покажу вам, как последовательно разобрать все основные возможности `input type="text"`, чтобы вы могли уверенно использовать его в реальных формах и при этом не ломать интерфейс ни на десктопе, ни на телефоне.

---

## Базовый синтаксис input type="text"

### Минимальный пример

Давайте начнем с самого простого текстового поля.

```html
<input type="text" name="username">
```

```html
<!-- Простейшее текстовое поле для ввода имени пользователя -->
<input type="text" name="username">
```

Здесь:

- `type="text"` — говорит браузеру, что это однострочное текстовое поле;
- `name="username"` — имя поля, под которым значение уйдет на сервер при отправке формы.

Обычно текстовое поле используют внутри формы:

```html
<form action="/register" method="post">
  <!-- Поле ввода имени -->
  <label>
    Имя пользователя
    <input type="text" name="username">
  </label>

  <!-- Кнопка отправки формы -->
  <button type="submit">Зарегистрироваться</button>
</form>
```

```html
<!-- Оборачиваем input в label, чтобы подпись была связана с полем ввода -->
<form action="/register" method="post">
  <label>
    Имя пользователя
    <input type="text" name="username">
  </label>
  <button type="submit">Зарегистрироваться</button>
</form>
```

Когда пользователь нажмет кнопку, браузер отправит на сервер данные вида `username=введенное_значение`.

---

## Основные атрибуты текстового поля

Теперь давайте разберем самые важные атрибуты, которые вы будете использовать постоянно.

### Атрибут name

Атрибут `name` связывает поле с данными формы.

```html
<input type="text" name="email">
```

```html
<!-- Значение этого поля уйдет в запросе с ключом email -->
<input type="text" name="email">
```

Без `name` сервер не получит значение этого поля при отправке формы. То есть поле будет визуально, но его содержимое пропадет.

### Атрибут id и связка с label

Чтобы подписать поле и улучшить доступность, используется связка `label` + `id`.

```html
<label for="city">Город</label>
<input type="text" id="city" name="city">
```

```html
<!-- for у label ссылается на id у input -->
<label for="city">Город</label>
<input type="text" id="city" name="city">
```

Когда вы кликните по тексту «Город», фокус перейдет в поле ввода. Это удобно и для пользователей, и для скринридеров.

### Атрибут value — начальное значение

Иногда нужно задать значение по умолчанию.

```html
<input type="text" name="city" value="Москва">
```

```html
<!-- Поле уже заполнено значением Москва -->
<input type="text" name="city" value="Москва">
```

Пользователь может изменить это значение, если поле не заблокировано. Если вы меняете `value` через JavaScript, это меняет текущее значение поля.

### Атрибут placeholder — подсказка внутри поля

`placeholder` показывает серую подсказку, пока поле пустое.

```html
<input type="text" name="email" placeholder="Введите ваш email">
```

```html
<!-- Подсказка исчезнет, когда пользователь начнет ввод -->
<input type="text" name="email" placeholder="Введите ваш email">
```

Пара важных моментов:

- placeholder не заменяет подпись поля — он пропадает при вводе;
- для доступности лучше всегда использовать `label`, а placeholder использовать как дополнительную подсказку.

### Атрибут required — обязательное поле

Если добавить `required`, браузер не даст отправить форму, пока поле пустое.

```html
<input type="text" name="username" required>
```

```html
<!-- Поле обязательно для заполнения, браузер покажет ошибку если пусто -->
<input type="text" name="username" required>
```

Браузер сам покажет стандартное сообщение (часто на языке системы). Если вам нужен свой текст ошибки, подключают JavaScript и используют валидацию Constraint Validation API или отдельные обработчики.

### Атрибут maxlength и minlength

Эти атрибуты ограничивают длину строки в символах.

```html
<input
  type="text"
  name="username"
  minlength="3"
  maxlength="20"
  required
>
```

```html
<!-- Имя должно быть от 3 до 20 символов -->
<input
  type="text"
  name="username"
  minlength="3"
  maxlength="20"
  required
>
```

- `maxlength` — не даст ввести больше указанного числа символов;
- `minlength` — не даст отправить форму, если введено меньше символов (браузер покажет ошибку).

Здесь я специально добавляю `required`, потому что при пустом поле `minlength` сам по себе не сработает: пустое значение считается отдельным случаем.

### Атрибут readonly — только для чтения

Поле видно, его можно выделить, но нельзя изменить.

```html
<input
  type="text"
  name="user_id"
  value="12345"
  readonly
>
```

```html
<!-- Поле видно и копируемо, но изменить текст нельзя -->
<input
  type="text"
  name="user_id"
  value="12345"
  readonly
>
```

Важно: поле с `readonly` по-прежнему отправится на сервер вместе с формой.

### Атрибут disabled — отключенное поле

Поле неактивно и не отправляется при отправке формы.

```html
<input
  type="text"
  name="promo"
  value="Скидка недоступна"
  disabled
>
```

```html
<!-- Поле выглядит неактивным и не попадет в данные формы -->
<input
  type="text"
  name="promo"
  value="Скидка недоступна"
  disabled
>
```

В отличие от `readonly`, атрибут `disabled` полностью исключает поле из данных формы.

---

## Управление поведением ввода

Теперь давайте посмотрим на атрибуты, которые помогают контролировать поведение ввода: подсказки браузера, автозаполнение, регистр текста и так далее.

### Атрибут autocomplete

`autocomplete` управляет автозаполнением браузером.

```html
<!-- Поле логина с подсказками браузера -->
<input
  type="text"
  name="username"
  autocomplete="username"
>
```

```html
<!-- Автозаполнение включено и подсказки будут подходить под тип данных -->
<input
  type="text"
  name="username"
  autocomplete="username">
```

Примеры значений:

- `on` — автозаполнение включено (по умолчанию);
- `off` — отключить подсказки;
- конкретные значения вроде `name`, `email`, `username`, `country`, `address-line1` помогают браузеру подбирать подходящие сохраненные данные.

Для чувствительных полей (например, одноразовый код) часто используют `autocomplete="one-time-code"`.

### Атрибут inputmode — подсказка для виртуальной клавиатуры

На мобильных устройствах можно подсказать, какую клавиатуру показывать.

```html
<!-- Поле для ввода чисел, но тип оставляем text -->
<input
  type="text"
  name="code"
  inputmode="numeric"
  pattern="[0-9]{4}"
  maxlength="4"
>
```

```html
<!-- Просим телефон показать цифровую клавиатуру и ограничиваем ввод до 4 цифр -->
<input
  type="text"
  name="code"
  inputmode="numeric"
  pattern="[0-9]{4}"
  maxlength="4">
```

Часто используемые значения:

- `text` — обычная клавиатура;
- `numeric` — только цифры;
- `tel` — клавиатура для телефона;
- `email` — клавиатура с символом `@`;
- `url` — клавиатура для ввода ссылок.

### Автоматическое изменение регистра: autocapitalize

Этот атрибут чаще используется в мобильных браузерах.

```html
<!-- Первая буква предложения с заглавной -->
<input
  type="text"
  name="comment"
  autocapitalize="sentences"
>
```

```html
<!-- Мобильный браузер будет начинать предложение с заглавной буквы -->
<input
  type="text"
  name="comment"
  autocapitalize="sentences">
```

Варианты:

- `none` — не менять регистр;
- `sentences` — первая буква предложения — заглавная;
- `words` — первая буква каждого слова — заглавная;
- `characters` — все символы — заглавные.

---

## Ограничение формата ввода: pattern и валидация

Для поля `type="text"` браузер не знает, какой именно формат вы ждете. Если вам нужно проверить структуру строки, можно использовать атрибут `pattern` с регулярным выражением.

### Пример: логин из латинских букв и цифр

```html
<input
  type="text"
  name="login"
  required
  pattern="[A-Za-z0-9]{3,16}"
  title="Логин от 3 до 16 символов, только латинские буквы и цифры"
>
```

```html
<!-- Регулярное выражение pattern задает допустимые символы и длину -->
<input
  type="text"
  name="login"
  required
  pattern="[A-Za-z0-9]{3,16}"
  title="Логин от 3 до 16 символов, только латинские буквы и цифры">
```

Здесь:

- `pattern="[A-Za-z0-9]{3,16}"` — логин длиной от 3 до 16 символов;
- `title="..."` — текст подсказки, который браузер покажет при ошибке.

### Пример: телефон в формате +7 XXX XXX-XX-XX

```html
<input
  type="text"
  name="phone"
  placeholder="+7 999 123-45-67"
  pattern="\+7\s?[0-9]{3}\s?[0-9]{3}-?[0-9]{2}-?[0-9]{2}"
  title="Введите телефон в формате +7 999 123-45-67"
>
```

```html
<!-- Проверяем формат российского номера телефона через регулярное выражение -->
<input
  type="text"
  name="phone"
  placeholder="+7 999 123-45-67"
  pattern="\+7\s?[0-9]{3}\s?[0-9]{3}-?[0-9]{2}-?[0-9]{2}"
  title="Введите телефон в формате +7 999 123-45-67">
```

При несоответствии ввода шаблону браузер не даст отправить форму и покажет подсказку.

---

## Внешний вид текстового поля

HTML управляет структурой и поведением, а вид вы задаете с помощью CSS. Давайте посмотрим, как вы можете оформить `input type="text"`.

### Ширина и высота

По умолчанию браузеры задают свои стили. Обычно вы переопределяете их:

```html
<input type="text" class="text-input" name="search" placeholder="Поиск">
```

```css
/* Стили для текстового поля */
.text-input {
  width: 100%;          /* Занимает всю ширину контейнера */
  max-width: 320px;     /* Ограничиваем максимальную ширину */
  padding: 8px 12px;    /* Отступы внутри поля */
  font-size: 14px;      /* Размер шрифта */
  box-sizing: border-box; /* Включаем рамку в ширину */
}
```

```css
/* Здесь мы задаем основные размеры и отступы для текстового поля */
.text-input {
  width: 100%;
  max-width: 320px;
  padding: 8px 12px;
  font-size: 14px;
  box-sizing: border-box;
}
```

Атрибут `size` тоже влияет на ширину поля (в символах), но в современном CSS куда удобнее управлять шириной через стили.

### Рамка, фон и радиус скругления

```css
/* Стилизация рамки и фона */
.text-input {
  border: 1px solid #ccc;     /* Серая рамка */
  border-radius: 4px;         /* Легкое скругление углов */
  background-color: #fff;     /* Белый фон */
  color: #222;                /* Цвет текста */
}

/* Внешний вид поля при фокусе */
.text-input:focus {
  border-color: #2684ff;      /* Синяя рамка при фокусе */
  outline: none;              /* Убираем стандартный outline браузера */
  box-shadow: 0 0 0 2px rgba(38, 132, 255, 0.2); /* Мягкая подсветка */
}
```

```css
/* Смотрите, здесь мы задаем базовую рамку и изменяем ее при фокусе */
.text-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #222;
}

.text-input:focus {
  border-color: #2684ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(38, 132, 255, 0.2);
}
```

Такое оформление делает состояние фокуса заметным, но не агрессивным.

### Состояния ошибок и успеха

Давайте разберемся, как визуально показывать пользователю, что он ввел что-то неверно.

```html
<input
  type="text"
  name="email"
  class="text-input text-input_error"
  aria-invalid="true"
>
<span class="error-message">Неверный формат email</span>
```

```html
<!-- Класс text-input_error и aria-invalid=true помогут визуальной и доступной индикации ошибки -->
<input
  type="text"
  name="email"
  class="text-input text-input_error"
  aria-invalid="true">
<span class="error-message">Неверный формат email</span>
```

```css
/* Базовый стиль */
.text-input {
  border: 1px solid #ccc;
}

/* Красная рамка при ошибке */
.text-input_error {
  border-color: #e55353;
}

/* Текст ошибки под полем */
.error-message {
  color: #e55353;
  font-size: 12px;
  margin-top: 4px;
}
```

```css
/* Здесь поле ввода получает красную рамку если присутствует класс text-input_error */
.text-input {
  border: 1px solid #ccc;
}

.text-input_error {
  border-color: #e55353;
}

.error-message {
  color: #e55353;
  font-size: 12px;
  margin-top: 4px;
}
```

Вы можете добавлять или убирать класс `text-input_error` с помощью JavaScript в зависимости от результата проверки.

---

## Доступность текстового поля

Чтобы формы были удобны не только зрительно, но и для пользователей со скринридерами или только с клавиатурой, нужно учитывать несколько моментов.

### Подписи через label

Самое важное — правильная подпись поля.

```html
<label for="email">Электронная почта</label>
<input type="text" id="email" name="email" autocomplete="email">
```

```html
<!-- for связывает подпись с полем, скринридер прочитает название поля -->
<label for="email">Электронная почта</label>
<input type="text" id="email" name="email" autocomplete="email">
```

Если вам удобнее, можно вкладывать input внутрь label, как мы делали раньше.

### Подсказки и ошибки с aria-describedby

Иногда нужно привязать к полю дополнительные тексты: подсказку или сообщение об ошибке.

```html
<label for="password">Пароль</label>

<!-- Поле с подсказкой и зоной для сообщений об ошибке -->
<input
  type="text"
  id="password"
  name="password"
  aria-describedby="password-help password-error"
>

<!-- Подсказка -->
<div id="password-help">
  Минимум 8 символов, хотя бы одна цифра и одна буква
</div>

<!-- Сообщение об ошибке (можно показывать или скрывать через JS) -->
<div id="password-error" hidden>
  Пароль слишком короткий
</div>
```

```html
<!-- aria-describedby перечисляет id элементов с подсказками и ошибками -->
<label for="password">Пароль</label>
<input
  type="text"
  id="password"
  name="password"
  aria-describedby="password-help password-error">

<div id="password-help">
  Минимум 8 символов, хотя бы одна цифра и одна буква
</div>

<div id="password-error" hidden>
  Пароль слишком короткий
</div>
```

Скринридер, фокусируясь на поле, прочитает оба текста — и подсказку, и ошибку (если она видима).

### aria-invalid для ошибок

Когда значение поля не проходит валидацию, полезно помечать его:

```html
<input
  type="text"
  name="email"
  aria-invalid="true"
>
```

```html
<!-- aria-invalid говорит ассистивным технологиям что в поле сейчас ошибка -->
<input
  type="text"
  name="email"
  aria-invalid="true">
```

Обычно атрибут обновляют из JavaScript, когда вы валидируете форму.

---

## Работа с input type="text" в JavaScript

Теперь давайте посмотрим, как вы можете программно управлять значением и поведением текстового поля.

### Получение и изменение значения

```html
<input type="text" id="username" name="username">
<button id="fill-button">Подставить имя</button>

<script>
// Находим элементы в DOM
const input = document.getElementById('username');
const fillButton = document.getElementById('fill-button');

// Обработка клика по кнопке
fillButton.addEventListener('click', () => {
  // Устанавливаем значение в текстовое поле
  input.value = 'guest_user';
});
</script>
```

```javascript
// Здесь мы получаем ссылку на input и меняем его значение по клику на кнопку
const input = document.getElementById('username');
const fillButton = document.getElementById('fill-button');

fillButton.addEventListener('click', () => {
  input.value = 'guest_user';
});
```

Чтение значения:

```javascript
// Получаем текущее значение поля
const currentValue = input.value;
// Можно использовать currentValue дальше в логике
```

```javascript
// Здесь мы сохраняем текущее значение поля username в переменную
const currentValue = input.value;
```

### События input и change

Событие `input` срабатывает при каждом изменении текста (каждый символ), `change` — когда пользователь закончил ввод и ушел из поля.

```html
<input type="text" id="search" placeholder="Поиск">
<div id="debug"></div>

<script>
// Получаем ссылки на элементы
const searchInput = document.getElementById('search');
const debugDiv = document.getElementById('debug');

// Реагируем на каждое изменение текста
searchInput.addEventListener('input', () => {
  // Показываем текущий ввод в отдельном блоке
  debugDiv.textContent = 'Вы ввели: ' + searchInput.value;
});
</script>
```

```javascript
// Смотрите, здесь обработчик input обновляет текст в debugDiv при каждом изменении поля
const searchInput = document.getElementById('search');
const debugDiv = document.getElementById('debug');

searchInput.addEventListener('input', () => {
  debugDiv.textContent = 'Вы ввели: ' + searchInput.value;
});
```

### Фокус и выделение текста

Можно программно фокусировать поле и выделять текст — это удобно, если вы хотите сразу дать пользователю возможность изменить значение.

```html
<input type="text" id="promo" value="WELCOME2025">
<button id="copy">Выделить код</button>

<script>
// Находим элементы
const promoInput = document.getElementById('promo');
const copyButton = document.getElementById('copy');

// Обработка клика по кнопке
copyButton.addEventListener('click', () => {
  // Переводим фокус в поле
  promoInput.focus();
  // Выделяем весь текст
  promoInput.select();
});
</script>
```

```javascript
// Здесь мы по клику даем фокус полю и выделяем в нем весь текст
const promoInput = document.getElementById('promo');
const copyButton = document.getElementById('copy');

copyButton.addEventListener('click', () => {
  promoInput.focus();
  promoInput.select();
});
```

С помощью `setSelectionRange(start, end)` можно выделять только часть текста.

---

## Частые практические сценарии

Теперь давайте разберемся на примерах, как текстовое поле используется в типичных задачах.

### Поисковая строка с «лупой»

```html
<form action="/search" method="get" class="search-form">
  <input
    type="text"
    name="q"
    class="search-input"
    placeholder="Поиск по сайту"
    autocomplete="off"
  >
  <button type="submit" class="search-button">Найти</button>
</form>
```

```html
<!-- Здесь мы создаем простую поисковую строку с кнопкой -->
<form action="/search" method="get" class="search-form">
  <input
    type="text"
    name="q"
    class="search-input"
    placeholder="Поиск по сайту"
    autocomplete="off">
  <button type="submit" class="search-button">Найти</button>
</form>
```

```css
/* Оборачиваем поле и кнопку в одну линию */
.search-form {
  display: flex;
  gap: 8px;              /* Расстояние между полем и кнопкой */
}

/* Поле занимает все доступное место */
.search-input {
  flex: 1;
  padding: 8px 12px;
}

/* Кнопка фиксированной ширины */
.search-button {
  padding: 8px 16px;
}
```

```css
/* Давайте сделаем форму поиска компактной и читаемой */
.search-form {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
}

.search-button {
  padding: 8px 16px;
}
```

### Поле с маской для телефона (пример с JS)

Само по себе `input type="text"` не умеет форматировать ввод. Для этого обычно подключают скрипты. Покажу общий принцип, без полноценной библиотеки.

```html
<input
  type="text"
  id="phone"
  name="phone"
  placeholder="+7 (___) ___-__-__"
  inputmode="tel"
>

<script>
// Находим поле телефона
const phoneInput = document.getElementById('phone');

// Обрабатываем ввод
phoneInput.addEventListener('input', () => {
  // Убираем все нецифры
  let digits = phoneInput.value.replace(/\D/g, '');

  // Начинаем собирать форматированную строку
  let formatted = '+7 ';

  // Удаляем ведущую 7 если пользователь ввел ее сам
  if (digits.startsWith('7')) {
    digits = digits.slice(1);
  }

  // Добавляем скобки и дефисы по мере наличия цифр
  if (digits.length > 0) {
    formatted += '(' + digits.substring(0, 3);
  }
  if (digits.length >= 3) {
    formatted += ') ' + digits.substring(3, 6);
  }
  if (digits.length >= 6) {
    formatted += '-' + digits.substring(6, 8);
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.substring(8, 10);
  }

  // Обновляем значение поля
  phoneInput.value = formatted;
});
</script>
```

```javascript
// Здесь мы убираем лишние символы и по шагам формируем маску +7 (XXX) XXX-XX-XX
const phoneInput = document.getElementById('phone');

phoneInput.addEventListener('input', () => {
  let digits = phoneInput.value.replace(/\D/g, '');
  let formatted = '+7 ';

  if (digits.startsWith('7')) {
    digits = digits.slice(1);
  }

  if (digits.length > 0) {
    formatted += '(' + digits.substring(0, 3);
  }
  if (digits.length >= 3) {
    formatted += ') ' + digits.substring(3, 6);
  }
  if (digits.length >= 6) {
    formatted += '-' + digits.substring(6, 8);
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.substring(8, 10);
  }

  phoneInput.value = formatted;
});
```

В реальных проектах вместо такой «ручной» маски чаще используют готовые библиотеки, но логика похожая: вы отслеживаете `input`, чистите ввод и форматируете вывод.

---

## Выбор между input type="text" и другими типами

Иногда разработчики используют `type="text"` по привычке, хотя HTML уже предлагает более подходящие типы полей.

### Когда лучше text

Используйте `type="text"`, когда:

- вам нужна произвольная строка без строгого формата;
- формат сложно описать стандартными полями;
- вы хотите полностью контролировать валидацию и обработку через JavaScript.

### Когда лучше другие типы

Несколько примеров:

- `type="email"` — для email адресов (браузер проверит формат, мобильные покажут удобную клавиатуру);
- `type="tel"` — для телефонов (удобная клавиатура, но проверки формата нет);
- `type="number"` — для чисел (важные нюансы со step, стрелками и локалью);
- `type="search"` — очень похож на text, но может иметь специфичный UI (кнопка очистки и так далее).

Если вы создаете поле для email, обычно лучше использовать `type="email"`, а не просто `text`. То же самое с URL и числами.

---

## Безопасность и обработка на сервере

HTML и браузерная валидация помогают, но полагаться только на них нельзя. Сейчас кратко разберем те моменты, о которых важно помнить.

### Никогда не доверяйте только client-side проверкам

Любой пользователь может отключить JavaScript, изменить HTML через инструменты разработчика и отправить на сервер любые данные. Поэтому:

- всегда повторяйте валидацию на сервере;
- проверяйте длину, формат, допустимые символы;
- фильтруйте и экранируйте данные перед сохранением в базу или выводом на страницу.

### XSS и вывод значения обратно в HTML

Если вы берете значение из текстового поля и потом показываете его на странице, его нужно экранировать.

```html
<!-- Опасно если вы просто вставите значение без экранирования -->
<div>Вы ввели: <!-- здесь может оказаться вредный скрипт --></div>
```

Лучше выводить данные через безопасные методы серверного шаблонизатора или через `textContent` на стороне клиента.

```javascript
// Безопасно вставляем пользовательский текст в DOM
const resultDiv = document.getElementById('result');
const userInput = '... значение из input ...';

// Вместо innerHTML используем textContent
resultDiv.textContent = 'Вы ввели: ' + userInput;
```

```javascript
// Обратите внимание, что textContent не интерпретирует HTML и скрипты
resultDiv.textContent = 'Вы ввели: ' + userInput;
```

---

## Итог

Текстовое поле `input type="text"` — это фундаментальный элемент HTML-форм, с которым вы сталкиваетесь почти в любом веб-проекте. При этом у него гораздо больше возможностей, чем простое «поле для строки»:

- вы управляете обязательностью, длиной и форматом ввода через атрибуты `required`, `minlength`, `maxlength`, `pattern`;
- улучшаете удобство ввода через `autocomplete`, `inputmode`, `autocapitalize`;
- делаете поле доступным с помощью правильных `label`, `aria-describedby`, `aria-invalid`;
- оформляете внешний вид и состояние ошибок с помощью CSS;
- управляете значением поля и реакцией на ввод через JavaScript;
- комбинируете все это в практических сценариях: поисковые строки, логины, телефоны, коды подтверждения.

Как видите, даже простой `input type="text"` позволяет довольно тонко настраивать поведение форм и улучшать опыт пользователей. Главное — осознанно выбирать атрибуты, продумывать валидацию и не забывать про серверную проверку и безопасность.

---

## Частозадаваемые технические вопросы и ответы

### 1. Как запретить ввод определенных символов в input type="text"?

Используйте обработчик события `beforeinput` или `keydown` и отменяйте ввод нежелательных символов.

```javascript
const input = document.getElementById('username');

input.addEventListener('beforeinput', (event) => {
  // Разрешаем только латиницу и цифры
  const allowed = /^[A-Za-z0-9]*$/;
  if (!allowed.test(event.data ?? '')) {
    // Отменяем ввод символа
    event.preventDefault();
  }
});
```

### 2. Почему maxlength не работает с эмодзи и некоторыми символами?

`maxlength` считает не «символы для человека», а кодовые единицы UTF-16. Эмодзи часто занимают две единицы. Чтобы ограничивать «видимые символы», считайте длину строки через разбиение по объединенным символам и вручную обрезайте значение в обработчике `input`.

### 3. Как сделать «debounce» при вводе в поле поиска?

Используйте таймер в обработчике `input`, чтобы не дергать сервер на каждый символ.

```javascript
const search = document.getElementById('search');
let timerId;

search.addEventListener('input', () => {
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    // Здесь выполняем запрос к серверу с search.value
  }, 300); // Задержка 300 мс
});
```

### 4. Как программно пометить поле как невалидное без отправки формы?

Используйте метод `setCustomValidity` и `reportValidity`.

```javascript
const input = document.getElementById('login');

if (input.value === '') {
  input.setCustomValidity('Заполните логин');
  input.reportValidity(); // Покажет стандартное окно с ошибкой
} else {
  input.setCustomValidity(''); // Сбрасываем ошибку
}
```

### 5. Как предотвратить отправку формы по Enter в текстовом поле?

Добавьте обработчик `keydown` и отмените действие для Enter, если это нужно.

```javascript
const formInput = document.getElementById('search');

formInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // Предотвращаем отправку формы
    event.preventDefault();
  }
});
```