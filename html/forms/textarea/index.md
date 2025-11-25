---
metaTitle: Текстовая область HTML textarea - полное руководство для разработчиков
metaDescription: Узнайте как работать с HTML элементом textarea - создавайте многострочные поля ввода, управляйте размерами, стилями и поведением через HTML CSS и JavaScript
author: Олег Марков
title: Текстовая область HTML textarea - практическое руководство
preview: Исследуйте HTML элемент textarea - от базового применения до тонкой настройки поведения и интеграции с формами и JavaScript
---

## Введение

Элемент textarea в HTML — это многострочная текстовая область, с помощью которой пользователь может вводить и редактировать большие объемы текста. В отличие от однострочного input с типом text, textarea позволяет переносы строк, удобное редактирование и часто используется для комментариев, описаний, настроек в виде текста, отправки сообщений и других сценариев, где одной строки недостаточно.

Смотрите, я покажу вам, как на практике использовать textarea, какие атрибуты она поддерживает, как управлять ее размером и поведением, как работать с ней через JavaScript и что важно учитывать для доступности и валидации форм.

---

## Базовый синтаксис и структура textarea

### Минимальный пример

Начнем с самого простого варианта:

```html
<form>
  <!-- Подпись для текстовой области -->
  <label for="message">Сообщение</label>
  
  <!-- Базовая текстовая область -->
  <textarea id="message" name="message"></textarea>
  
  <button type="submit">Отправить</button>
</form>
```

- textarea — парный тег. Текст между открывающим и закрывающим тегами — это начальное значение.
- Атрибут name обязателен, если вы хотите отправить данные формы на сервер.
- Атрибут id часто используют, чтобы связать textarea с label и для работы с JavaScript.

Если вы добавите текст внутрь тега, он станет начальными данными:

```html
<textarea name="comment">Здесь вы можете оставить свой комментарий</textarea>
```

// Комментарий внутри тега становится исходным текстом в поле

---

## Основные атрибуты textarea

Давайте разберем ключевые атрибуты, с которыми вы будете работать чаще всего.

### name, id и связка с label

```html
<label for="feedback">Ваш отзыв</label>
<textarea id="feedback" name="feedback"></textarea>
```

// Атрибут for у label связывает подпись с textarea по значению id  
// Благодаря этому клик по тексту label фокусирует текстовую область

- name — имя поля, под которым значение придет на сервер при отправке формы.
- id — используется для связи с label и доступа через JavaScript.
- Связывание с label повышает удобство и доступность для пользователей и скринридеров.

### rows и cols — управление базовым размером

```html
<textarea
  name="description"
  rows="4"
  cols="40"
>Краткое описание товара</textarea>
```

// rows - примерное количество видимых строк  
// cols - примерное количество видимых символов в строке

- rows и cols задают **базовый размер** в символах и строках.
- Это не строгий пиксельный размер, а приблизительный, зависящий от шрифта.
- В современном вебе размер textarea чаще задают через CSS, но rows и cols по-прежнему полезны как дефолтные параметры.

### placeholder — подсказка пользователю

```html
<textarea
  name="bio"
  rows="3"
  placeholder="Расскажите немного о себе..."
></textarea>
```

// placeholder показывает подсказку пока поле пустое  
// При вводе текста подсказка исчезает

Важно отличать placeholder от реального значения — placeholder не отправляется на сервер и не считается введенными данными.

### required — обязательное поле

```html
<form>
  <label for="review">Отзыв</label>
  <textarea id="review" name="review" required></textarea>
  
  <button type="submit">Отправить</button>
</form>
```

// required сообщает браузеру, что поле нельзя оставлять пустым  
// При пустом поле отправка формы будет заблокирована

Браузер покажет встроенную подсказку, если пользователь попытается отправить форму с пустой текстовой областью.

### maxlength и minlength — ограничение длины текста

```html
<textarea
  name="short_note"
  rows="3"
  maxlength="200"
  minlength="10"
></textarea>
```

// maxlength ограничивает максимальное количество символов  
// minlength задает минимальную длину для успешной валидации формы

- maxlength не позволит ввести больше указанного числа символов.
- minlength не блокирует ввод, но форма не пройдет валидацию, если длина меньше.

### readonly и disabled — ограничение редактирования

```html
<!-- Только для чтения, можно скопировать текст -->
<textarea name="code_example" readonly>
int x = 10;
</textarea>

<!-- Поле полностью выключено -->
<textarea name="hidden_note" disabled>Скрытый текст</textarea>
```

// readonly - текст нельзя менять, но можно фокусировать и копировать  
// disabled - текст нельзя менять, поле не фокусируется и не отправляется на сервер

- readonly подходит, когда вы хотите показать неизменяемый текст, который можно выделить и скопировать.
- disabled используют, когда поле временно неактивно, и его значение не должно отправляться.

### autofocus — автоматический фокус

```html
<textarea
  name="first_comment"
  autofocus
  placeholder="Напишите первый комментарий..."
></textarea>
```

// autofocus устанавливает фокус в эту textarea при загрузке страницы

Используйте аккуратно, так как избыточные автофокусы могут раздражать пользователя.

### wrap — управление переносом строк при отправке

Атрибут wrap влияет на то, как браузер будет обрабатывать переносы строк при отправке формы.

```html
<!-- Переносы только при вводе, в отправленных данных строки не "допереносит" -->
<textarea name="text_soft" wrap="soft"></textarea>

<!-- Переносы строк вставляются и в отправляемые данные -->
<textarea name="text_hard" wrap="hard"></textarea>
```

// wrap="soft" - по умолчанию, переносы строк в данных только там, где пользователь нажал Enter  
// wrap="hard" - браузер добавляет переносы в данных по ширине textarea

На практике wrap="soft" используется гораздо чаще, потому что сохраняет текст в исходном виде, без дополнительных, искусственно вставленных переносов.

---

## Управление размером textarea через CSS

### Использование свойств width и height

Хотя rows и cols задают размер в символах, в реальных проектах удобнее использовать CSS.

```html
<textarea
  name="comment"
  class="comment-textarea"
  placeholder="Оставьте ваш комментарий"
></textarea>
```

```css
.comment-textarea {
  /* Ширина 100 процент контейнера */
  width: 100%;
  
  /* Фиксированная высота */
  height: 150px;
  
  /* Дополнительные стили для читаемости */
  padding: 8px;
  font-size: 14px;
  box-sizing: border-box; /* Включаем отступы в расчёт ширины */
}
```

// width и height задают размер в пикселях или процентах  
// box-sizing: border-box упрощает расчет ширины с учетом паддингов

### Управление возможностью растягивания (resize)

По умолчанию пользователь может изменять размер textarea, перетягивая угол. Иногда это нужно отключить или ограничить.

```css
/* Полное отключение изменения размера */
.textarea-no-resize {
  resize: none; /* Пользователь не сможет тянуть за угол */
}

/* Разрешаем изменять размер только по вертикали */
.textarea-vertical-only {
  resize: vertical;
}

/* Разрешаем только по горизонтали */
.textarea-horizontal-only {
  resize: horizontal;
}
```

```html
<textarea class="textarea-no-resize"></textarea>
<textarea class="textarea-vertical-only"></textarea>
```

// В первом случае угол для растягивания исчезнет  
// Во втором случае размер можно менять только по высоте

---

## Работа с текстовой областью через JavaScript

Теперь давайте посмотрим, как управлять значением textarea, реагировать на события и динамически изменять ее размер.

### Получение и изменение значения

```html
<textarea id="messageBox" rows="4">
Начальный текст
</textarea>

<button id="readBtn">Прочитать</button>
<button id="writeBtn">Записать</button>
```

```javascript
// Получаем ссылки на элементы
const messageBox = document.getElementById('messageBox');
const readBtn = document.getElementById('readBtn');
const writeBtn = document.getElementById('writeBtn');

// Читаем текущее значение textarea
readBtn.addEventListener('click', () => {
  const value = messageBox.value; // Получаем введенный текст
  console.log('Текущее значение:', value);
});

// Записываем новое значение в textarea
writeBtn.addEventListener('click', () => {
  messageBox.value = 'Новое значение, установленное из JavaScript';
  // Теперь пользователю покажется этот текст
});
```

// Свойство value - основной способ работать с текстом внутри textarea  
// Текст между тегами влияет только на начальное значение, а дальше используем value

### Слежение за изменениями текста

Чтобы реагировать на ввод пользователя, удобно использовать событие input.

```html
<textarea
  id="commentBox"
  rows="4"
  maxlength="200"
  placeholder="Напишите комментарий"
></textarea>

<div id="counter">Осталось символов 200</div>
```

```javascript
const commentBox = document.getElementById('commentBox');
const counter = document.getElementById('counter');
const maxLen = commentBox.maxLength; // Считываем значение maxlength

// Обновляем счетчик при каждом изменении
commentBox.addEventListener('input', () => {
  const currentLength = commentBox.value.length;
  const remaining = maxLen - currentLength;
  
  // Обновляем текст счетчика
  counter.textContent = 'Осталось символов ' + remaining;
});
```

// Событие input срабатывает при каждом вводе или удалении символа  
// Так удобно делать счетчики, превью и валидацию "на лету"

### Автоматическое изменение высоты под содержимое

Частая задача — сделать textarea, которая будет увеличиваться по высоте, когда пользователь вводит больше строк. Покажу вам простой способ.

```html
<textarea
  id="autoGrow"
  rows="1"
  placeholder="Введите текст, и поле будет расти по высоте"
></textarea>
```

```css
#autoGrow {
  width: 100%;
  overflow: hidden; /* Скрываем скролл, чтобы он не мешал */
  resize: none;     /* Отключаем ручное изменение размера */
}
```

```javascript
const autoGrow = document.getElementById('autoGrow');

function adjustHeight(el) {
  el.style.height = 'auto';        // Сбрасываем высоту
  el.style.height = el.scrollHeight + 'px'; // Устанавливаем высоту по содержимому
}

// Настраиваем поведение при вводе текста
autoGrow.addEventListener('input', () => {
  adjustHeight(autoGrow);
});

// Один раз вызываем при загрузке, если есть начальный текст
adjustHeight(autoGrow);
```

// scrollHeight хранит фактическую высоту контента внутри textarea  
// Мы подстраиваем высоту под это значение, чтобы убрать внутренний скролл

---

## Использование textarea в формах

### Как данные отправляются на сервер

Когда вы отправляете форму, значение textarea приходит так же, как и значение обычных полей. Например:

```html
<form action="/submit" method="post">
  <label for="comment">Комментарий</label>
  <textarea id="comment" name="comment"></textarea>
  
  <button type="submit">Отправить</button>
</form>
```

// При отправке формы на сервер придет пара "comment=текст_пользователя"  
// Имя параметра определяется атрибутом name

Если вы используете метод GET, значение попадет в строку запроса:

- Пример URL: `/submit?comment=Привет%20мир`

### Валидация textarea

Вы можете использовать встроенные механизмы валидации:

- required — нельзя оставить пустым.
- minlength и maxlength — ограничения длины.
- pattern — регулярное выражение (поддерживается и для textarea, хотя используется реже).

Пример с pattern:

```html
<form>
  <label for="digits">Введите только цифры</label>
  <textarea
    id="digits"
    name="digits"
    rows="2"
    required
    pattern="[0-9\s]+"
    placeholder="Например 123 456"
  ></textarea>
  
  <button type="submit">Отправить</button>
</form>
```

// pattern задает формат, которому должен соответствовать введенный текст  
// В данном примере разрешены только цифры и пробелы

Если текст не подходит под pattern, браузер покажет сообщение об ошибке и не отправит форму, пока условие не выполнено.

### Работа с Enter и отправкой формы

В отличие от input type="text", в textarea клавиша Enter добавляет перенос строки, а не отправляет форму. Но иногда нужно позволить пользователю отправить форму сочетанием клавиш, например Ctrl+Enter. Покажу вам, как это сделать.

```html
<form id="messageForm">
  <label for="msg">Сообщение</label>
  <textarea id="msg" name="msg" rows="4"></textarea>
  
  <button type="submit">Отправить</button>
  <p>Подсказка - Ctrl+Enter для отправки</p>
</form>
```

```javascript
const form = document.getElementById('messageForm');
const msg = document.getElementById('msg');

msg.addEventListener('keydown', (event) => {
  // Проверяем сочетание Ctrl+Enter
  const isCtrlEnter = event.key === 'Enter' && event.ctrlKey;
  
  if (isCtrlEnter) {
    event.preventDefault(); // Отменяем обычный перенос строки
    form.submit();          // Отправляем форму
  }
});
```

// keydown позволяет отследить нажатие клавиш  
// При Ctrl+Enter мы предотвращаем добавление новой строки и отправляем форму вручную

---

## Стилизация и UX-трюки для textarea

### Базовая стилизация

```css
.textarea-basic {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;     /* Наследуем шрифт от документа */
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;         /* Разрешаем тянуть только по вертикали */
}

.textarea-basic:focus {
  border-color: #4a90e2;
  outline: none;            /* Убираем стандартный outline */
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}
```

```html
<textarea
  class="textarea-basic"
  placeholder="Напишите ваш комментарий..."
></textarea>
```

// Класс задает удобный минимальный размер и аккуратную рамку  
// Селектор :focus улучшает визуальный фокус для пользователя

### Подсветка ошибок ввода

Часто нужно подсветить textarea, если сервер вернул ошибку или валидация не прошла.

```css
.textarea-error {
  border-color: #e74c3c;       /* Красная рамка */
  background-color: #ffeceb;   /* Легкий фон */
}

.textarea-error:focus {
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}
```

```html
<textarea
  class="textarea-basic textarea-error"
  placeholder="Опишите проблему подробнее"
>Слишком короткое описание</textarea>
```

// Добавляем класс textarea-error если есть ошибка  
// Можно делать это динамически через JavaScript или с сервера

### Отключение автозаполнения (autocapitalize, spellcheck и другие)

Бывает важно контролировать автозамену, автотекст и проверку орфографии:

```html
<textarea
  name="code"
  rows="6"
  spellcheck="false"
  autocomplete="off"
  autocorrect="off"
  autocapitalize="off"
  placeholder="Вставьте сюда код или конфигурацию"
></textarea>
```

// spellcheck="false" отключает проверку орфографии  
// autocorrect и autocapitalize актуальны в мобильных браузерах  
// Это полезно для полей с кодом, логинами и техническими данными

---

## Доступность textarea (ARIA и удобство для всех пользователей)

### Правильные подписи и описания

Для доступности важны:

- label, связанный с textarea.
- Описания ошибок и подсказок.

```html
<label for="supportMessage">Сообщение в поддержку</label>

<p id="supportHelp">
  Опишите проблему максимально подробно - это поможет быстрее найти решение.
</p>

<textarea
  id="supportMessage"
  name="supportMessage"
  aria-describedby="supportHelp"
/>
```

// aria-describedby связывает textarea с элементом, который ее описывает  
// Скринридеры прочитают и заголовок, и текст подсказки

### Обработка ошибок с ARIA

```html
<label for="feedbackText">Ваш отзыв</label>

<textarea
  id="feedbackText"
  name="feedbackText"
  aria-invalid="true"
  aria-describedby="feedbackError"
/>

<p id="feedbackError" role="alert">
  Отзыв должен содержать минимум 20 символов.
</p>
```

// aria-invalid="true" сообщает вспомогательным технологиям об ошибке  
// role="alert" указывает, что сообщение важно и его нужно озвучить

ARIA-атрибуты помогают сделать интерфейс понятным для пользователей с особыми потребностями.

---

## Предзаполненные и только для чтения текстовые области

Иногда textarea используется как многострочный текст только для чтения — например, чтобы показать пользователю сгенерированный код, настройки или пример запроса.

```html
<label for="apiExample">Пример запроса к API</label>
<textarea
  id="apiExample"
  rows="6"
  readonly
>
POST /api/messages HTTP/1.1
Content-Type: application/json

{
  "text": "Привет мир"
}
</textarea>
```

// readonly запрещает редактирование, но позволяет выделять и копировать текст  
// Такой вариант часто используют для примеров конфигураций и команд

Если вам вообще не нужно взаимодействие, иногда вместо textarea логичнее использовать обычный pre, но textarea удобно тем, что в ней текст легко копировать целиком, например с помощью сочетания клавиш.

---

## Расширенные приемы работы с textarea

### Вставка текста в текущую позицию курсора

Иногда нужно вставлять шаблоны или подсказки в то место, где сейчас курсор пользователя.

```html
<textarea
  id="templateBox"
  rows="5"
  placeholder="Введите текст, используйте кнопку для вставки шаблона"
></textarea>

<button id="insertTemplate">Вставить шаблон</button>
```

```javascript
const templateBox = document.getElementById('templateBox');
const insertTemplateBtn = document.getElementById('insertTemplate');

insertTemplateBtn.addEventListener('click', () => {
  const start = templateBox.selectionStart; // Начало выделения или позиция курсора
  const end = templateBox.selectionEnd;     // Конец выделения
  
  // Текст, который нужно вставить
  const templateText = '[Шаблон]';
  
  const current = templateBox.value;
  
  // Формируем новое значение: до курсора + шаблон + после курсора
  templateBox.value =
    current.slice(0, start) +
    templateText +
    current.slice(end);
  
  // Перемещаем курсор за вставленный шаблон
  const newPosition = start + templateText.length;
  templateBox.selectionStart = newPosition;
  templateBox.selectionEnd = newPosition;
  
  // Возвращаем фокус в textarea
  templateBox.focus();
});
```

// selectionStart и selectionEnd позволяют узнать и задать выделение  
// Так можно реализовать вставку шаблонов, тегов и других конструкций

### Очистка поля и сброс формы

```html
<form id="noteForm">
  <label for="note">Заметка</label>
  <textarea id="note" name="note" rows="4"></textarea>
  
  <button type="submit">Сохранить</button>
  <button type="button" id="clearBtn">Очистить</button>
</form>
```

```javascript
const noteForm = document.getElementById('noteForm');
const note = document.getElementById('note');
const clearBtn = document.getElementById('clearBtn');

// Очистка только textarea
clearBtn.addEventListener('click', () => {
  note.value = ''; // Сбрасываем значение
});

// Полный сброс формы
noteForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Пример - отменяем реальную отправку
  // Здесь могла бы быть отправка через AJAX
  
  // После успешной отправки - сбрасываем форму
  noteForm.reset();
});
```

// reset() возвращает все поля к исходным значениям из HTML  
// А прямая установка value очищает только нужную textarea

---

## Заключение

Элемент textarea в HTML — это базовый, но очень гибкий инструмент для работы с многострочным текстом. Он поддерживает множество атрибутов для управления размером, поведением и валидацией, хорошо интегрируется с формами и легко настраивается через CSS и JavaScript.

Вы можете:

- Задавать начальные значения и подсказки.
- Контролировать обязательность и длину текста.
- Гибко управлять размером: фиксированным, изменяемым пользователем или автоматически подстраивающимся.
- Настраивать взаимодействие с пользователем через события и сочетания клавиш.
- Повышать доступность с помощью правильных связок label и ARIA-атрибутов.
- Использовать textarea как для ввода, так и для отображения текста только для чтения.

Когда вы понимаете, как работает textarea на всех уровнях — от HTML-разметки до JavaScript-логики и UX-мелочей, создание удобных форм и интерфейсов для ввода текста становится намного проще.

---

## Частозадаваемые технические вопросы по теме и ответы

### 1. Как сделать так, чтобы в textarea нельзя было вводить переносы строк?

Используйте обработчик keydown и блокируйте Enter:

```javascript
const ta = document.getElementById('noNewLines');

ta.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Блокируем перенос строки
  }
});
```

// Так вы сохраните многострочный вид, но запретите ввод новых строк

### 2. Как вставить текст в textarea без потери уже введенного содержимого (добавить в конец)?

```javascript
const ta = document.getElementById('appendBox');

function appendText(text) {
  ta.value += text; // Добавляем текст в конец
}
```

// Можно вызывать appendText из обработчика кнопки или другого события

### 3. Как программно установить курсор в конец текста textarea?

```javascript
const ta = document.getElementById('focusEnd');

function focusToEnd() {
  ta.focus(); // Устанавливаем фокус
  const length = ta.value.length;
  ta.selectionStart = length; // Ставим курсор в конец
  ta.selectionEnd = length;
}
```

// Такая функция полезна после автодобавления текста или форматирования

### 4. Как сделать подсветку синтаксиса внутри textarea?

Напрямую в textarea подсветку сделать нельзя, так как он показывает только простой текст. Обычно используют комбинацию:

1. textarea для ввода.
2. div с contenteditable или pre рядом для отображения с подсветкой.
3. JavaScript, который синхронизирует содержимое textarea и форматирует текст в соседнем элементе.

Библиотеки типа CodeMirror или Monaco Editor реализуют это за вас, подменяя стандартную textarea на более сложный компонент.

### 5. Как предотвратить отправку формы при нажатии Enter в textarea?

По умолчанию Enter не отправляет форму из textarea, но если где-то в логике есть слушатели keypress или keydown на форме, нужно фильтровать событие. Пример:

```javascript
form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA') {
    // Ничего не делаем - позволяем просто перенос строки
    return;
  }
  
  // Здесь может быть логика отправки при Enter для других полей
});
```

// Проверка tagName позволяет не применять "быструю отправку" к textarea