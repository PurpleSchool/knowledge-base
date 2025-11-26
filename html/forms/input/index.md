---
metaTitle: Тег input в HTML - полный разбор и практические примеры
metaDescription: Разберитесь как работает тег input в HTML - какие типы существуют как их использовать и валидировать данные на стороне браузера
author: Олег Марков
title: Тег input в HTML - типы атрибуты валидация и примеры
preview: Узнайте как правильно использовать тег input в HTML - от простых текстовых полей до сложных форм с валидацией и подсказками
---

## Введение

Тег input в HTML — это основа любых форм на сайте. С его помощью вы получаете данные от пользователя: текст, пароль, email, файлы, даты, числа и многое другое. Если вы научитесь уверенно работать с input, вы сможете создавать удобные формы, которые будут понятны и браузеру, и пользователю.

В этой статье я покажу вам, как устроен тег input, какие у него есть типы, как работают основные атрибуты и встроенная валидация. Мы пройдемся по частым сценариям: поля логина, чекбоксы, радио-кнопки, загрузка файлов, работа с датами, маски ввода, доступность и взаимодействие с JavaScript.

---

## Базовый синтаксис и роль input в форме

### Общий вид тега input

Тег input — одиночный (самозакрывающийся). У него нет содержимого между открывающим и закрывающим тегом. Общий вид:

```html
<input type="text" name="username" />
<!-- type - тип поля ввода -->
<!-- name - имя поля, под этим ключом значение уйдет на сервер -->
```

В HTML5 можно опускать слэш в конце:

```html
<input type="text" name="username">
```

Браузеры воспринимают оба варианта одинаково.

### Input внутри формы

Тег input чаще всего используется внутри form. Давайте разберемся на простом примере:

```html
<form action="/login" method="post">
  <!-- Поле для логина -->
  <label for="login">Логин</label>
  <input id="login" name="login" type="text">

  <!-- Поле для пароля -->
  <label for="password">Пароль</label>
  <input id="password" name="password" type="password">

  <!-- Кнопка отправки формы -->
  <input type="submit" value="Войти">
</form>
```

Комментарии к примеру:

- form задает границы формы и параметры отправки (action и method).
- Каждый input имеет атрибут name — именно это имя будет ключом в данных, которые отправятся на сервер.
- label связывается с input по атрибуту for и id — это важно для доступности и удобства (по клику на label фокус попадает в поле).

---

## Основные типы input: обзор

Атрибут type определяет поведение и внешний вид поля. Смотрите, я кратко перечислю самые часто используемые типы, а дальше мы разберем их подробнее:

- text — обычное текстовое поле;
- password — скрытый ввод (пароль);
- email — email-адрес с встроенной проверкой;
- url — URL-адрес;
- number — числовой ввод;
- tel — телефонный номер;
- search — поле поиска;
- checkbox — флажок;
- radio — переключатель из группы вариантов;
- file — выбор файла;
- hidden — скрытое поле;
- submit, reset, button — разные типы кнопок;
- date, time, datetime-local, month, week — работа с датой и временем;
- range — ползунок для выбора значения;
- color — выбор цвета.

Теперь давайте пройдемся по основным типам с примерами.

---

## Текстовые поля

### type="text"

Это самый базовый тип. Используется для ввода произвольного текста.

```html
<label for="username">Имя пользователя</label>
<input
  id="username"
  name="username"
  type="text"
  placeholder="Введите имя"
/>
<!-- placeholder - подсказка внутри поля до ввода -->
```

Полезные атрибуты:

- maxlength — максимальная длина строки;
- minlength — минимальная длина;
- value — начальное значение;
- readonly — только чтение;
- disabled — выключено и не отправляется с формой;
- required — обязательное поле.

Пример:

```html
<input
  type="text"
  name="nickname"
  maxlength="20"
  minlength="3"
  required
  placeholder="От 3 до 20 символов"
/>
<!-- required не даст отправить форму, если поле пустое -->
```

### type="password"

Работает как text, но введенные символы не показываются явно.

```html
<label for="pass">Пароль</label>
<input
  id="pass"
  name="password"
  type="password"
  required
  minlength="6"
/>
<!-- Браузер отобразит точки или звездочки вместо текста -->
```

---

## Ввод email, URL, телефона и поиска

### type="email"

Браузер проверяет, что введено что-то похожее на email. Поддерживает список email через запятую, если указать multiple.

```html
<label for="email">Email</label>
<input
  id="email"
  name="email"
  type="email"
  required
  placeholder="example@mail.com"
/>
```

Важные моменты:

- Проверка "примерная" — она не гарантирует, что почта существует, только что строка соответствует формату.
- На мобильных устройствах клавиатура может подстраиваться (например, сразу показывать символ @).

### type="url"

Проверяет формат URL:

```html
<label for="site">Адрес сайта</label>
<input
  id="site"
  name="website"
  type="url"
  placeholder="https://example.com"
/>
```

### type="tel"

Используется для телефонов. Браузер не проверяет формат, но на мобильных показывает удобную цифровую клавиатуру.

```html
<label for="phone">Телефон</label>
<input
  id="phone"
  name="phone"
  type="tel"
  placeholder="+7 900 000-00-00"
/>
<!-- Валидацию формата удобнее делать через pattern -->
```

Пример с pattern:

```html
<input
  type="tel"
  name="phone"
  pattern="\+7\s?\d{3}\s?\d{3}-\d{2}-\d{2}"
  placeholder="+7 900 000-00-00"
/>
<!-- pattern - регулярное выражение для проверки формата ввода -->
```

### type="search"

Похоже на text, но может иметь стилизованный вид (крестик очистки и т.п.). Используется для поисковых строк.

```html
<label for="q">Поиск</label>
<input id="q" name="q" type="search" placeholder="Что ищем?" />
```

---

## Числовой ввод: number и range

### type="number"

Разрешает ввод только чисел (плюс некоторые символы вроде минуса и точки). Браузер добавляет стрелочки для увеличения/уменьшения.

```html
<label for="age">Возраст</label>
<input
  id="age"
  name="age"
  type="number"
  min="0"
  max="120"
  step="1"
/>
<!-- min и max ограничивают диапазон -->
<!-- step - шаг изменения (по стрелкам) -->
```

Несколько нюансов:

- В некоторых браузерах можно вводить текст, но при валидации будет ошибка.
- Лучше всегда добавлять min, max и step, чтобы сделать поведение понятным.

### type="range"

Ползунок для выбора числа из диапазона. Смотрите, как это может выглядеть:

```html
<label for="volume">Громкость</label>
<input
  id="volume"
  name="volume"
  type="range"
  min="0"
  max="100"
  value="50"
/>
<!-- value - начальное положение ползунка -->
```

Это поле часто используют вместе с JavaScript, чтобы отображать текущее значение:

```html
<label for="volume2">Громкость</label>
<input
  id="volume2"
  name="volume"
  type="range"
  min="0"
  max="100"
  value="30"
/>
<span id="volume-value">30</span>

<script>
// Находим элементы
const volumeInput = document.getElementById('volume2');
const volumeValue = document.getElementById('volume-value');

// При изменении ползунка обновляем текст
volumeInput.addEventListener('input', () => {
  volumeValue.textContent = volumeInput.value; // Показываем текущее значение
});
</script>
```

---

## Переключатели: checkbox и radio

### type="checkbox"

Чекбокс — флажок, который может быть включен или выключен.

```html
<label>
  <input type="checkbox" name="subscribe" value="yes" />
  Подписаться на новости
</label>
<!-- Важно: тег label оборачивает checkbox и текст -->
```

Особенности:

- Если checkbox не отмечен, значение не отправляется вообще (поля subscribe не будет в данных формы).
- Атрибут checked задает начальное состояние.

```html
<input
  type="checkbox"
  name="terms"
  value="agree"
  checked
/>
<!-- checked - флажок включен по умолчанию -->
```

### type="radio"

Радио-кнопки позволяют выбрать один вариант из нескольких. Ключевой момент — у всех вариантов должно быть одинаковое имя name.

```html
<p>Выберите способ доставки:</p>

<label>
  <input
    type="radio"
    name="delivery"
    value="courier"
    checked
  />
  Курьером
</label>

<label>
  <input
    type="radio"
    name="delivery"
    value="pickup"
  />
  Самовывоз
</label>

<label>
  <input
    type="radio"
    name="delivery"
    value="post"
  />
  Почта
</label>
```

Комментарии:

- Благодаря одинаковому name браузер понимает, что это одна группа.
- checked можно задать только у одного варианта в группе.

---

## Кнопки: submit, reset, button

### type="submit"

Кнопка отправки формы:

```html
<input type="submit" value="Отправить форму" />
```

- По клику происходит отправка данных формы.
- value задает текст на кнопке.

Часто submit заменяют на тег button, чтобы добавить HTML-иконки или более сложную разметку, но input по-прежнему используется в простых случаях.

### type="reset"

Сбрасывает значения всех полей формы к исходным (тем, что были при загрузке страницы).

```html
<input type="reset" value="Очистить форму" />
```

### type="button"

Обычная кнопка без встроенного поведения. Вы сами задаете логику через JavaScript.

```html
<input
  type="button"
  value="Показать сообщение"
  onclick="alert('Нажата кнопка')"
/>
<!-- onclick - обработчик нажатия (для примера) -->
```

На практике для кастомных кнопок чаще используется тег button, но знать про type="button" все равно полезно.

---

## Работа с файлами: type="file"

type="file" позволяет пользователю выбрать файл(ы) на диске.

```html
<label for="avatar">Загрузите аватар</label>
<input
  id="avatar"
  name="avatar"
  type="file"
  accept="image/*"
/>
<!-- accept ограничивает допустимые типы файлов -->
```

Популярные значения атрибута accept:

- image/* — только изображения;
- video/* — только видео;
- .pdf — только PDF;
- .jpg,.png — перечисление конкретных расширений.

Выбор нескольких файлов:

```html
<input
  type="file"
  name="photos"
  multiple
  accept="image/*"
/>
<!-- multiple разрешает выбрать несколько файлов сразу -->
```

Важно: чтобы файлы корректно отправлялись на сервер, у формы должен быть специальный enctype:

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <!-- поля формы с type="file" -->
</form>
```

---

## Поля для работы с датой и временем

HTML5 ввел несколько типов input, которые выводят специальные виджеты выбора даты и времени. Их поведение зависит от браузера и платформы, но общая идея одна.

### type="date"

Ввод даты (год, месяц, день):

```html
<label for="birth">Дата рождения</label>
<input
  id="birth"
  name="birth_date"
  type="date"
  min="1900-01-01"
  max="2025-12-31"
/>
<!-- Формат значений min и max - YYYY-MM-DD -->
```

### type="time"

Ввод времени (часы и минуты):

```html
<label for="meeting-time">Время встречи</label>
<input
  id="meeting-time"
  name="meeting_time"
  type="time"
  step="900"
/>
<!-- step=900 означает шаг 900 секунд, то есть 15 минут -->
```

### type="datetime-local"

Дата и время без учета часового пояса:

```html
<label for="event">Дата и время события</label>
<input
  id="event"
  name="event_datetime"
  type="datetime-local"
/>
```

### type="month" и type="week"

- month — выбор месяца;
- week — выбор недели.

```html
<label for="report-month">Месяц отчета</label>
<input id="report-month" name="report_month" type="month" />

<label for="sprint-week">Неделя спринта</label>
<input id="sprint-week" name="sprint_week" type="week" />
```

Если браузер не поддерживает какой-то тип, он обычно отображает его как обычный text. Поэтому при критичных формах стоит добавлять дополнительную проверку на стороне сервера или полифилы.

---

## Цвет: type="color"

Позволяет выбрать цвет через встроенный цветовой пикер.

```html
<label for="favcolor">Выберите любимый цвет</label>
<input
  id="favcolor"
  name="favorite_color"
  type="color"
  value="#ff0000"
/>
<!-- value - начальное значение в формате #RRGGBB -->
```

Значение отправляется как строка с hex-кодом цвета.

---

## Скрытое поле: type="hidden"

type="hidden" не отображается на странице, но участвует в отправке формы. Используется для передачи служебных данных: токенов, идентификаторов и т.п.

```html
<input
  type="hidden"
  name="user_id"
  value="12345"
/>
<!-- Пользователь не видит это поле, но значение уйдет на сервер -->
```

Будьте осторожны: пользователь все равно может изменить значение скрытого поля через инструменты разработчика в браузере. Нельзя полагаться на hidden для безопасности, всегда проверяйте данные на сервере.

---

## Основные атрибуты input: как они работают

Теперь давайте соберем в одном месте ключевые атрибуты, которые чаще всего используются с input.

### name и id

- name — нужно для отправки данных на сервер.
- id — нужно для связи с label и JavaScript.

```html
<label for="city">Город</label>
<input id="city" name="city" type="text" />
```

Если у input нет name, его значение не попадет в данные формы.

### value

value задает начальное значение. Для некоторых типов (checkbox, radio) оно играет особую роль.

```html
<input type="text" name="city" value="Москва" />
<!-- Поле уже заполнено текстом "Москва" -->
```

Для checkbox и radio value определяет то значение, которое уйдет при выборе:

```html
<label>
  <input type="checkbox" name="interests" value="sports" />
  Спорт
</label>

<label>
  <input type="checkbox" name="interests" value="music" />
  Музыка
</label>
<!-- На сервер уйдут interests=sports&interests=music если оба выбраны -->
```

### placeholder

Текст-подсказка внутри поля до ввода:

```html
<input
  type="text"
  name="search"
  placeholder="Введите запрос"
/>
```

Важно: placeholder не заменяет label, особенно с точки зрения доступности. Лучше использовать и то, и другое.

### required

Делает поле обязательным. Браузер не отправит форму, пока оно пустое (для некоторых типов — некорректное).

```html
<input type="email" name="email" required />
```

### disabled и readonly

Оба делают поле недоступным для изменения, но по-разному:

- disabled — поле "отключено", не фокусируется и не отправляется с формой.
- readonly — поле видно, его можно выделить и скопировать, но нельзя изменить. При этом оно отправится с формой.

```html
<input type="text" name="code" value="ABC123" readonly />
<!-- Пользователь видит код, но не может его менять -->

<input type="text" name="promo" value="PROMO2025" disabled />
<!-- Поле выглядит отключенным и не отправится -->
```

### autocomplete

Подсказывает браузеру, можно ли подставлять сохраненные значения.

```html
<input
  type="email"
  name="email"
  autocomplete="email"
/>
<!-- Браузер будет предлагать сохраненные email-адреса -->
```

Примеры значений autocomplete:

- on / off — включить или выключить автозаполнение;
- email, name, organization, street-address и т.д. — более точные подсказки браузеру.

### pattern

Регулярное выражение для проверки ввода. Работает в связке с built-in валидацией.

```html
<input
  type="text"
  name="username"
  pattern="[A-Za-z0-9_]{3,15}"
  title="От 3 до 15 символов: латинские буквы, цифры и нижнее подчеркивание"
/>
<!-- title - текст подсказки, который браузер может показать при ошибке -->
```

Браузер проверит pattern перед отправкой формы. Если строка не подходит, форма не отправится.

---

## Встроенная валидация в браузере

HTML дает возможность сделать базовую валидацию без JavaScript. Вы уже видели атрибуты required, min, max, pattern, type. Сейчас покажу, как это работает вместе.

```html
<form>
  <!-- Email обязателен -->
  <label>
    Email
    <input
      type="email"
      name="email"
      required
      placeholder="example@mail.com"
    />
  </label>

  <!-- Пароль не короче 6 символов -->
  <label>
    Пароль
    <input
      type="password"
      name="password"
      required
      minlength="6"
    />
  </label>

  <!-- Возраст от 18 до 99 -->
  <label>
    Возраст
    <input
      type="number"
      name="age"
      min="18"
      max="99"
    />
  </label>

  <input type="submit" value="Зарегистрироваться" />
</form>
```

Как видите, без единой строки JavaScript браузер уже:

- проверяет, что email выглядит как email;
- не пропустит пустой пароль и проверит длину;
- проверит, что возраст в диапазоне.

Если вы хотите полностью контролировать валидацию через JavaScript, можно отключить встроенную валидацию с помощью атрибута novalidate у формы:

```html
<form novalidate>
  <!-- ваши поля -->
</form>
```

---

## Связка label и input: доступность и удобство

Правильная работа с label — важная часть хороших форм. Давайте разберемся.

Вы можете связать label и input двумя способами.

### Через for и id

```html
<label for="email2">Email</label>
<input id="email2" name="email" type="email" />
```

Теперь при клике по тексту "Email" фокус попадет в поле ввода.

### Обернуть input внутри label

```html
<label>
  Email
  <input name="email" type="email" />
</label>
```

Оба способа работают. Для радио-кнопок и чекбоксов часто используют именно обертку, потому что так удобнее стилизовать.

Почему это важно:

- Улучшает доступность для пользователей с экранными считывателями.
- Увеличивает кликабельную область (особенно важно на мобильных).
- Делает структуру формы понятнее.

---

## Взаимодействие с input через JavaScript

Смотрите, я покажу вам базовый сценарий работы с input из JavaScript: получение значения, установка значения, работа с событиями.

### Получение и изменение значения

```html
<input id="user-name" type="text" value="Иван" />

<script>
// Находим input по id
const input = document.getElementById('user-name');

// Получаем текущее значение
console.log(input.value); // Выведет "Иван"

// Меняем значение
input.value = 'Мария'; // Установим новое значение
</script>
```

### События input и change

Событие input срабатывает при каждом изменении (нажатии клавиши, вставке и т.п.). change — при завершении редактирования (обычно при потере фокуса или выборе значения).

```html
<label for="live-input">Введите текст</label>
<input id="live-input" type="text" />

<p>Вы ввели: <span id="output"></span></p>

<script>
// Находим элементы
const liveInput = document.getElementById('live-input');
const output = document.getElementById('output');

// Обновляем текст при каждом изменении
liveInput.addEventListener('input', () => {
  output.textContent = liveInput.value; // Синхронизируем текст
});
</script>
```

---

## Input и доступность (a11y)

Чтобы формы были удобны не только зрительно, но и для пользователей с особыми потребностями, полезно учитывать несколько моментов.

### Правильные подписи

- Всегда используйте label для полей, даже если кажутся очевидными.
- Не заменяйте label только placeholder-ом — placeholder исчезает после ввода.

### Атрибут aria-describedby

Иногда нужно дать более подробное описание:

```html
<label for="password2">Пароль</label>
<input
  id="password2"
  name="password"
  type="password"
  aria-describedby="password-help"
/>
<small id="password-help">
  Минимум 8 символов, хотя бы одна цифра и одна буква
</small>
<!-- aria-describedby связывает поле с текстом подсказки -->
```

### Фокус и клавиатура

По умолчанию input участвуют в табуляции. Пользователь может переходить между полями с помощью клавиши Tab. Не отключайте это без необходимости.

---

## Частые практические комбинации

### Поле логина или регистрации

```html
<form action="/login" method="post">
  <label for="email-login">Email</label>
  <input
    id="email-login"
    name="email"
    type="email"
    required
    autocomplete="email"
  />

  <label for="password-login">Пароль</label>
  <input
    id="password-login"
    name="password"
    type="password"
    required
    minlength="6"
    autocomplete="current-password"
  />

  <input type="submit" value="Войти" />
</form>
```

Комментарии:

- autocomplete="email" и autocomplete="current-password" помогают браузеру правильно подставлять сохраненные данные.
- minlength на пароле — минимальный уровень безопасности.

### Форма с выбором опций и файла

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <!-- Имя -->
  <label>
    Имя
    <input type="text" name="first_name" required />
  </label>

  <!-- Пол (radio) -->
  <p>Пол</p>
  <label>
    <input type="radio" name="gender" value="male" checked />
    Мужской
  </label>
  <label>
    <input type="radio" name="gender" value="female" />
    Женский
  </label>

  <!-- Интересы (checkbox) -->
  <p>Интересы</p>
  <label>
    <input type="checkbox" name="interests" value="sports" />
    Спорт
  </label>
  <label>
    <input type="checkbox" name="interests" value="music" />
    Музыка
  </label>

  <!-- Аватар (file) -->
  <label>
    Аватар
    <input type="file" name="avatar" accept="image/*" />
  </label>

  <input type="submit" value="Сохранить" />
</form>
```

Здесь вы видите, как разные типы input работают вместе в реальной форме.

---

## Заключение

Тег input — один из самых важных элементов HTML, потому что именно через него вы получаете данные от пользователя. От того, насколько правильно и продуманно вы его используете, зависит удобство форм, качество данных и даже конверсия на сайте.

Мы рассмотрели основные типы input, их назначение и особенности, разобрали ключевые атрибуты (name, value, placeholder, required, pattern и другие), посмотрели, как работает встроенная валидация и как связать input с label. Также вы увидели примеры работы с input через JavaScript и базовые советы по доступности.

Следующий шаг — начать применять это в ваших формах: комбинировать типы, настраивать валидацию, добавлять логику на JavaScript и проверку на сервере. Чем лучше вы понимаете поведение input, тем надежнее и понятнее будут ваши веб-приложения.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как отключить встроенную валидацию браузера и проверять все через JavaScript?

Добавьте атрибут novalidate на форму:

```html
<form novalidate>
  <!-- ваши поля -->
</form>
```

После этого браузер не будет блокировать отправку формы из-за ошибок. Валидацию нужно реализовать вручную в обработчике submit: вызывать preventDefault() при ошибках и показывать свои сообщения.

---

### Почему у меня не отправляется значение у checkbox, даже если он есть в разметке?

Checkbox отправляется только если он отмечен. Если он не отмечен, браузер вообще не добавляет его в данные формы. Убедитесь, что:

```html
<input type="checkbox" name="subscribe" value="yes">
```

- Есть атрибут name.
- Вы проверяете на сервере, что поля subscribe может не быть. Если вам нужно всегда получать какое-то значение, можно добавить hidden с тем же name до checkbox и на сервере учитывать последнее значение.

---

### Как задать маску ввода для телефона с помощью одного HTML без сторонних библиотек?

На уровне HTML можно только ограничить формат через pattern и подсказать формат через placeholder:

```html
<input
  type="tel"
  name="phone"
  pattern="\+7 \d{3} \d{3}-\d{2}-\d{2}"
  placeholder="+7 900 000-00-00"
  title="Формат +7 900 000-00-00"
/>
```

Обратите внимание, что pattern не "маскирует" ввод, а только проверяет строку при отправке. Для настоящей маски (подстановка пробелов, тире при вводе) потребуется JavaScript или специальные библиотеки.

---

### Как программно поставить фокус в нужный input после загрузки страницы?

Используйте метод focus() в JavaScript:

```html
<input id="email3" type="email" name="email">

<script>
// Ждем полной загрузки документа
window.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email3');
  emailInput.focus(); // Устанавливаем фокус в поле email
});
</script>
```

Либо можно добавить атрибут autofocus на один input в форме, но он сработает только один раз при загрузке страницы:

```html
<input type="text" name="username" autofocus>
```

---

### Как изменить текст стандартных сообщений об ошибках встроенной валидации?

Нужно использовать JavaScript и метод setCustomValidity:

```html
<input id="user" name="user" required>

<script>
const userInput = document.getElementById('user');

userInput.addEventListener('input', () => {
  // Очищаем кастомное сообщение при вводе
  userInput.setCustomValidity('');
});

userInput.addEventListener('invalid', () => {
  if (userInput.validity.valueMissing) {
    // valueMissing - поле пустое
    userInput.setCustomValidity('Пожалуйста, введите имя пользователя');
  }
});
</script>
```

Браузер покажет ваше сообщение вместо стандартного.