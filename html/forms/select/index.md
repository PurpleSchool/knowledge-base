---
metaTitle: Выпадающий список HTML select
metaDescription: Узнайте как работать с выпадающим списком HTML select - изучите синтаксис атрибуты события и способы управления через JavaScript
author: Олег Марков
title: Выпадающий список HTML select - полное руководство для разработчиков
preview: Исследуйте элемент HTML select - разберитесь в создании выпадающих списков настройке внешнего вида и управлении ими через JavaScript
---

## Введение

Выпадающий список на странице часто кажется чем-то простым и очевидным. На практике HTML-элемент select умеет гораздо больше, чем просто показывать список значений. Он тесно связан с формами, серверной обработкой данных, валидацией и JavaScript-логикой.

Здесь вы шаг за шагом разберете, как работать с элементом select: от базового синтаксиса до динамического наполнения через JavaScript, обработки событий и особенностей доступности. Я буду сопровождать код комментариями, чтобы вам было проще понять, что происходит.

## Базовый синтаксис select и option

### Самый простой пример выпадающего списка

Давайте начнем с минимального рабочего примера:

```html
<form action="/submit" method="post">
  <!-- Выпадающий список выбора страны -->
  <label for="country">Страна:</label>
  <select name="country" id="country">
    <!-- Каждый option - это вариант выбора -->
    <option value="ru">Россия</option>
    <option value="us">США</option>
    <option value="de">Германия</option>
  </select>

  <button type="submit">Отправить</button>
</form>
```

Обратите внимание на ключевые элементы:

- `<select>` — сам выпадающий список;
- `<option>` — отдельный вариант в списке;
- атрибут `name` у select — именно это имя придет на сервер вместе со значением выбранного варианта;
- атрибут `value` у option — то, что реально отправится на сервер, если пользователь выбрал этот вариант.

Если у option не указать value, браузер возьмет текст между тегами option как значение. Однако на практике почти всегда лучше задавать value явно, чтобы не зависеть от текста для пользователя.

### Атрибут name и передача данных на сервер

Посмотрите, как данные из select выглядят в запросе:

```html
<form action="/register" method="get">
  <label for="role">Роль:</label>
  <select name="role" id="role">
    <option value="user">Обычный пользователь</option>
    <option value="admin">Администратор</option>
  </select>

  <button type="submit">Отправить</button>
</form>
```

Если пользователь выберет «Администратор» и форма отправится методом GET, в адресной строке вы увидите:

```text
/register?role=admin
```

Здесь `role` — это значение атрибута name у select, а `admin` — value выбранного option.

Если вы забудете указать name у select, его значение вообще не уйдет на сервер. Это частая ошибка, на которую стоит обращать внимание.

## Основные атрибуты select

### Атрибут id и связь с label

Вы уже видели связку label + select. Здесь важно понимать, что:

- атрибут `id` у select должен совпадать с атрибутом `for` у label;
- такая связка улучшает доступность: клик по тексту label фокусирует select.

```html
<label for="payment">Способ оплаты:</label>
<select name="payment" id="payment">
  <option value="card">Банковская карта</option>
  <option value="cash">Наличные</option>
</select>
```

### Атрибут multiple — множественный выбор

Элемент select по умолчанию позволяет выбрать только один вариант. Но если вы добавите атрибут multiple, пользователь сможет выбрать несколько значений.

```html
<label for="skills">Навыки:</label>
<select name="skills" id="skills" multiple size="4">
  <!-- multiple - позволяет выбрать несколько значений -->
  <!-- size - задает высоту списка в количестве видимых строк -->
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="go">Go</option>
</select>
```

Чтобы отметить несколько вариантов, пользователь будет зажимать Ctrl (или Cmd на macOS) и кликать по нужным пунктам (или Shift для диапазона).

На сервер в этом случае уходит несколько значений с одним и тем же именем параметра. Для GET-запроса это будет выглядеть так:

```text
/form?skills=html&skills=css&skills=js
```

На стороне сервера такой параметр нужно обрабатывать как массив значений. В PHP это можно сделать так:

```html
<select name="skills[]" id="skills" multiple>
  <!-- ... -->
</select>
```

```php
<?php
// Здесь $_GET['skills'] уже будет массивом значений
$skills = $_GET['skills']; 
```

Комментарии:

```php
// В этом примере мы ожидаем несколько значений с одинаковым именем
// Запись name="skills[]" подсказывает PHP собрать их в массив
```

### Атрибут disabled — блокировка списка

Иногда нужно временно запретить пользователю взаимодействовать с select. Для этого есть атрибут disabled:

```html
<select name="plan" id="plan" disabled>
  <!-- disabled - пользователь не может открыть список и выбрать значение -->
  <option value="free">Бесплатный</option>
  <option value="pro">Профессиональный</option>
</select>
```

Особенности:

- пользователь не может изменить значение;
- значение такого select не отправляется на сервер;
- браузер обычно показывает его в «сером» виде.

Если вы хотите только визуально показать, что выбор уже сделан, но все же отправить значение, часто лучше заменить select статическим текстом и скрытым полем input type="hidden".

### Атрибут required — обязательный выбор

Атрибут required говорит браузеру, что пользователю обязательно нужно что-то выбрать перед отправкой формы.

```html
<select name="city" id="city" required>
  <!-- required - нельзя отправить форму без выбора города -->
  <option value="">Выберите город</option>
  <option value="msk">Москва</option>
  <option value="spb">Санкт-Петербург</option>
</select>
```

Здесь есть важный момент. Чтобы required работал ожидаемо, часто используют «пустой» вариант по умолчанию:

```html
<option value="">Выберите город</option>
```

Браузер не позволит отправить форму, если пользователь оставит этот вариант выбранным. Но в некоторых браузерах, если вы не ставите disabled к первому option, выбор все равно считается валидным. Поэтому более надежный вариант:

```html
<select name="city" id="city" required>
  <option value="" disabled selected>Выберите город</option>
  <option value="msk">Москва</option>
  <option value="spb">Санкт-Петербург</option>
</select>
```

Комментарии:

```html
<!-- disabled - не позволяет выбрать этот вариант после открытия списка -->
<!-- selected - делает его вариантом по умолчанию при загрузке страницы -->
```

### Атрибут size — высота списка

Атрибут size задает, сколько вариантов отображать сразу, не раскрывая список:

```html
<select name="theme" id="theme" size="3">
  <!-- size="3" - видно сразу 3 строки, список выглядит как список, а не как один блок -->
  <option value="light">Светлая</option>
  <option value="dark">Темная</option>
  <option value="auto">Авто</option>
</select>
```

Если вы ставите size больше 1, внешний вид select становится ближе к обычному списку, а не к классическому выпадающему меню. Этот прием иногда используют для настроек, где требуется видеть несколько вариантов сразу.

## Атрибуты option: value, selected, disabled

### value — то, что уходит на сервер

Атрибут value у option — это то, что вы потом будете обрабатывать на сервере или в JavaScript.

```html
<select name="status" id="status">
  <option value="draft">Черновик</option>
  <option value="published">Опубликовано</option>
  <option value="archived">В архиве</option>
</select>
```

Комментарии:

```html
<!-- Текст между тегами option видит пользователь -->
<!-- Значение из value будет отправлено на сервер или прочитано в JS -->
```

### selected — вариант по умолчанию

Чтобы задать выбранный вариант при загрузке страницы, используется атрибут selected:

```html
<select name="lang" id="lang">
  <option value="en">English</option>
  <option value="ru" selected>Русский</option>
  <option value="de">Deutsch</option>
</select>
```

Если у вас несколько option помечены selected в обычном (одиночном) select, браузер использует первый из них. А вот в multiple-select вы можете отметить несколько вариантов selected:

```html
<select name="days[]" id="days" multiple>
  <option value="mon" selected>Понедельник</option>
  <option value="tue">Вторник</option>
  <option value="wed" selected>Среда</option>
</select>
```

### disabled у option — неактивные пункты

Иногда нужно показать вариант в списке, но запретить его выбор. Для этого используйте disabled у option:

```html
<select name="tariff" id="tariff">
  <option value="basic">Базовый</option>
  <option value="pro" disabled>Профессиональный (временно недоступен)</option>
  <option value="enterprise">Корпоративный</option>
</select>
```

Комментарии:

```html
<!-- disabled - вариант отображается, но выбрать его нельзя -->
```

Этот прием помогает показать пользователю, что такой вариант существует, но сейчас недоступен (например, тариф временно закрыт для новых подключений).

## Группировка вариантов с помощью optgroup

### Как логично сгруппировать варианты

Когда вариантов в списке много, разумно разбивать их на группы. Для этого есть тег optgroup:

```html
<label for="car">Выберите автомобиль:</label>
<select name="car" id="car">
  <!-- optgroup - объединяет опции по смыслу -->
  <optgroup label="Немецкие марки">
    <option value="bmw">BMW</option>
    <option value="audi">Audi</option>
  </optgroup>
  <optgroup label="Японские марки">
    <option value="toyota">Toyota</option>
    <option value="honda">Honda</option>
  </optgroup>
</select>
```

Комментарии:

```html
<!-- label у optgroup - заголовок группы, он виден в списке, но не выбирается -->
```

Особенности:

- пользователь не может выбрать optgroup, только option внутри него;
- label отображается визуально обычно жирным шрифтом;
- вы можете использовать disabled у optgroup, чтобы заблокировать всю группу:

```html
<optgroup label="Премиальные" disabled>
  <option value="mb">Mercedes-Benz</option>
  <option value="lexus">Lexus</option>
</optgroup>
```

## Управление select через JavaScript

Теперь давайте перейдем к динамическому управлению select. Вы увидите, как считывать выбранные значения, менять их, добавлять или удалять варианты.

### Получение выбранного значения

Самый распространенный сценарий: вам нужно прочитать, какой пункт пользователь выбрал.

```html
<select id="color">
  <option value="red">Красный</option>
  <option value="green">Зеленый</option>
  <option value="blue">Синий</option>
</select>

<button id="showColor">Показать выбранный цвет</button>

<script>
// Находим элементы на странице
const select = document.getElementById('color');
const button = document.getElementById('showColor');

button.addEventListener('click', () => {
  // Читаем текущее значение select
  const value = select.value; // Здесь будет "red", "green" или "blue"

  // Читаем текст выбранного option
  const selectedOption = select.options[select.selectedIndex];
  const text = selectedOption.text;

  // Выводим информацию в консоль
  console.log('Значение:', value); // Значение, которое вы бы отправили на сервер
  console.log('Текст:', text);     // Текст, который видит пользователь
});
</script>
```

Комментарии:

```js
// select.value - это value выбранного option
// select.selectedIndex - индекс выбранного варианта в списке options
// select.options - коллекция всех option внутри select
```

### Установка значения программно

Если вам нужно программно выбрать определенный пункт, сделайте так:

```html
<select id="langSelect">
  <option value="en">English</option>
  <option value="ru">Русский</option>
  <option value="de">Deutsch</option>
</select>

<button id="setRussian">Выбрать русский</button>

<script>
const select = document.getElementById('langSelect');
const button = document.getElementById('setRussian');

button.addEventListener('click', () => {
  // Устанавливаем значение "ru"
  select.value = 'ru'; 

  // Если option с таким value нет, значение не изменится
  console.log('Текущее значение:', select.value);
});
</script>
```

Для multiple-select установка значения чуть сложнее: нужно отметить несколько option selected:

```html
<select id="daysSelect" multiple>
  <option value="mon">Пн</option>
  <option value="tue">Вт</option>
  <option value="wed">Ср</option>
  <option value="thu">Чт</option>
  <option value="fri">Пт</option>
</select>

<script>
// Функция, которая отмечает нужные значения в multiple-select
function setMultipleValues(select, values) {
  // Проходимся по всем option
  for (const option of select.options) {
    // Ставим selected true, если значение есть в массиве values
    option.selected = values.includes(option.value);
  }
}

const select = document.getElementById('daysSelect');
// Отмечаем понедельник, среду и пятницу
setMultipleValues(select, ['mon', 'wed', 'fri']);
</script>
```

### Добавление и удаление вариантов option

Давайте посмотрим, как динамически менять состав списка.

#### Добавление нового пункта

```html
<select id="citySelect">
  <option value="msk">Москва</option>
  <option value="spb">Санкт-Петербург</option>
</select>

<button id="addCity">Добавить Казань</button>

<script>
const select = document.getElementById('citySelect');
const addButton = document.getElementById('addCity');

addButton.addEventListener('click', () => {
  // Создаем новый элемент option
  const option = document.createElement('option');
  option.value = 'kzn';         // Значение, которое уйдет на сервер
  option.text = 'Казань';       // Текст, который увидит пользователь

  // Добавляем его в конец списка
  select.add(option);           // Можно также использовать select.append(option)

  console.log('Добавлен новый город');
});
</script>
```

Комментарии:

```js
// document.createElement('option') - создаем новый элемент option
// option.value - задаем значение
// option.text - задаем текст для отображения
// select.add(option) - вставляем в список
```

#### Удаление вариантов

Удалить вариант можно по индексу:

```js
// Удаляем первый вариант
select.remove(0);
```

Или через DOM:

```js
// Удаляем конкретный option
const optionToRemove = select.querySelector('option[value="spb"]');
if (optionToRemove) {
  optionToRemove.remove();
}
```

Комментарии:

```js
// select.remove(index) - удаляет option с указанным индексом
// option.remove() - удаляет сам элемент из DOM
```

### Реакция на изменение значения: событие change

Наиболее полезное событие для select — change. Оно срабатывает, когда пользователь выбрал другой пункт.

```html
<select id="themeSelect">
  <option value="light">Светлая тема</option>
  <option value="dark">Темная тема</option>
</select>

<script>
const select = document.getElementById('themeSelect');

select.addEventListener('change', () => {
  const value = select.value;
  
  // Здесь можно переключить тему сайта
  console.log('Выбранная тема:', value);

  // Пример простого переключения класса на body
  document.body.classList.toggle('dark-theme', value === 'dark');
});
</script>
```

Комментарии:

```js
// Событие change - удобный способ реагировать на выбор пользователя
// classList.toggle('dark-theme', условие) - добавит класс, если условие true, и уберет, если false
```

## Работа с multiple-select в JavaScript

### Получение всех выбранных значений

Для multiple-select select.value вернет только первое выбранное значение. Чтобы получить все, нужно пройтись по options:

```html
<select id="skillsSelect" multiple>
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="react">React</option>
</select>

<button id="showSkills">Показать выбранные навыки</button>

<script>
const select = document.getElementById('skillsSelect');
const button = document.getElementById('showSkills');

button.addEventListener('click', () => {
  const selectedValues = [];

  // Перебираем все option у select
  for (const option of select.options) {
    if (option.selected) {
      // Если option выбран, добавляем его value в массив
      selectedValues.push(option.value);
    }
  }

  console.log('Выбранные навыки:', selectedValues);
});
</script>
```

Комментарии:

```js
// option.selected - показывает, выбран ли конкретный вариант
// selectedValues - массив всех выбранных значений
```

### Снятие выбора со всех пунктов

Иногда вам нужно сбросить выбор:

```js
function clearSelection(select) {
  for (const option of select.options) {
    option.selected = false;
  }
}

clearSelection(document.getElementById('skillsSelect'));
```

Комментарии:

```js
// Функция clearSelection снимает выбор со всех пунктов multiple-select
```

## Стилизация select: возможности и ограничения

### Базовая стилизация через CSS

Элемент select наследует многие CSS-свойства, такие как:

- font-family;
- font-size;
- color;
- background-color;
- padding;
- border.

Пример:

```html
<select id="styledSelect">
  <option value="1">Первый вариант</option>
  <option value="2">Второй вариант</option>
  <option value="3">Третий вариант</option>
</select>

<style>
#styledSelect {
  /* Шрифт и размер текста */
  font-family: Arial, sans-serif;
  font-size: 14px;

  /* Цвет текста и фона */
  color: #333;              /* Цвет текста */
  background-color: #f5f5f5;/* Цвет фона */

  /* Границы и скругления */
  border: 1px solid #ccc;   /* Серая граница */
  border-radius: 4px;       /* Небольшое скругление углов */

  /* Внутренние отступы и ширина */
  padding: 4px 8px;
  width: 200px;
}
</style>
```

Комментарии:

```css
/* Здесь мы задаем общий стиль для select как для обычного блока */
```

### Ограничения нативного select

Нативный select сложно полностью кастомизировать. Ограничения зависят от браузера, но в целом:

- сложно (или невозможно) полностью изменить стрелку раскрытия;
- всплывающий список (выпадающая часть) почти не поддается стилизации;
- внешний вид сильно отличается в разных браузерах и операционных системах.

Из-за этого для сложных интерфейсов часто делают «кастомные» выпадающие списки на div/ul/li, а нативный select скрывают или синхронизируют с ним выбранные значения.

### Простой прием: убираем системную стрелку

В некоторых случаях вы можете частично скрыть стандартную стрелку и нарисовать свою:

```html
<div class="select-wrapper">
  <select id="customArrow">
    <option value="1">Вариант 1</option>
    <option value="2">Вариант 2</option>
  </select>
</div>

<style>
.select-wrapper {
  position: relative;       /* Нужно для позиционирования псевдоэлемента */
  display: inline-block;
}

#customArrow {
  appearance: none;         /* Сбрасываем стандартный вид в поддерживаемых браузерах */
  -webkit-appearance: none; /* Для Safari */
  -moz-appearance: none;    /* Для Firefox */

  padding-right: 24px;      /* Оставляем место под свою стрелку */
}

/* Рисуем свою стрелку */
.select-wrapper::after {
  content: "▼";             /* Символ стрелки вниз */
  font-size: 10px;
  color: #555;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;     /* Стрелка не перекрывает клики по select */
}
</style>
```

Комментарии:

```css
/* appearance: none - попытка убрать нативное оформление */
/* ::after на .select-wrapper - рисуем свою стрелку поверх select */
```

Этот подход работает не идеально во всех браузерах, но для простых задач его достаточно.

## Доступность (accessibility) и select

### Роль label и атрибутов

Чтобы ваш выпадающий список был доступен для пользователей с экранными читалками и клавиатурой, важно:

- использовать label, связанный с select через for/id;
- логично задавать текст у option;
- не злоупотреблять пустыми значениями.

Пример:

```html
<label for="currency">Выберите валюту платежа:</label>
<select name="currency" id="currency" required>
  <option value="" disabled selected>Выберите валюту</option>
  <option value="rub">Российский рубль</option>
  <option value="usd">Доллар США</option>
  <option value="eur">Евро</option>
</select>
```

Комментарии:

```html
<!-- Текст label и option должен быть понятным без контекста -->
```

### Управление с клавиатуры

Нативный select хорошо работает с клавиатурой:

- Tab — переходит к элементу;
- Space или Alt+↓ (зависит от браузера) — открывает список;
- стрелки — перемещают выделение;
- Enter или Space — подтверждают выбор.

Если вы создаете кастомный «select» на div/ul, нужно вручную реализовывать все эти сценарии. Поэтому, когда возможно, лучше использовать стандартный select.

## Типичные практические сценарии

### Зависимые списки (например, страна → город)

Один из частых сценариев — когда второй select зависит от выбранного значения первого. Покажу вам простой пример с JavaScript.

```html
<label for="countrySelect">Страна:</label>
<select id="countrySelect">
  <option value="">Выберите страну</option>
  <option value="ru">Россия</option>
  <option value="us">США</option>
</select>

<label for="citySelectDynamic">Город:</label>
<select id="citySelectDynamic" disabled>
  <option value="">Сначала выберите страну</option>
</select>

<script>
// Набор городов в зависимости от страны
const citiesByCountry = {
  ru: [
    { value: 'msk', text: 'Москва' },
    { value: 'spb', text: 'Санкт-Петербург' }
  ],
  us: [
    { value: 'nyc', text: 'Нью-Йорк' },
    { value: 'la',  text: 'Лос-Анджелес' }
  ]
};

const countrySelect = document.getElementById('countrySelect');
const citySelect = document.getElementById('citySelectDynamic');

countrySelect.addEventListener('change', () => {
  const country = countrySelect.value;

  // Очищаем список городов
  citySelect.innerHTML = '';

  if (!country || !citiesByCountry[country]) {
    // Если страна не выбрана, блокируем список городов
    citySelect.disabled = true;
    const option = document.createElement('option');
    option.value = '';
    option.text = 'Сначала выберите страну';
    citySelect.add(option);
    return;
  }

  // Разблокируем список
  citySelect.disabled = false;

  // Добавляем placeholder
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.text = 'Выберите город';
  placeholder.disabled = true;
  placeholder.selected = true;
  citySelect.add(placeholder);

  // Добавляем города для выбранной страны
  for (const city of citiesByCountry[country]) {
    const option = document.createElement('option');
    option.value = city.value;
    option.text = city.text;
    citySelect.add(option);
  }
});
</script>
```

Комментарии:

```js
// citiesByCountry - простой объект с массивами городов по коду страны
// innerHTML = '' - удаляет все существующие option
// citySelect.disabled - блокируем или разблокируем select городов
```

### Подстановка значения по умолчанию на основе данных пользователя

Представьте, что у вас есть информация о предпочтениях пользователя (например, язык интерфейса). Вы можете программно установить select на нужное значение.

```html
<select id="userLang">
  <option value="en">English</option>
  <option value="ru">Русский</option>
  <option value="de">Deutsch</option>
</select>

<script>
// Пусть у вас есть сохраненное значение языка, например из localStorage
const savedLang = localStorage.getItem('preferredLang'); 
// Для примера зададим значение вручную
// const savedLang = 'ru';

const select = document.getElementById('userLang');

if (savedLang) {
  // Если значение есть, пытаемся его установить
  select.value = savedLang;
}

// При изменении - сохраняем выбор
select.addEventListener('change', () => {
  const value = select.value;
  localStorage.setItem('preferredLang', value);
  console.log('Сохранен язык:', value);
});
</script>
```

Комментарии:

```js
// localStorage - простой способ хранить настройки на стороне клиента
// select.value = savedLang - устанавливаем сохраненное значение
```

## Заключение

Элемент select в HTML сначала кажется очень простым, но за ним скрывается множество нюансов:

- он тесно связан с формами и серверной обработкой;
- имеет набор полезных атрибутов — multiple, required, disabled, size;
- каждый option важен своими атрибутами value, selected, disabled;
- optgroup помогает структурировать длинные списки;
- JavaScript позволяет динамически управлять списками, реагировать на события и создавать зависимые селекты;
- нативный select ограничен в стилизации, но хорошо работает с клавиатуры и обеспечивает базовую доступность.

Подходите к проектированию выпадающих списков осознанно: продумывайте, какие значения вы будете получать на сервере, как структура списка выглядит для пользователя и насколько просто им управлять с клавиатуры. Тогда select станет надежным и понятным элементом вашего интерфейса.

## Частозадаваемые технические вопросы

### 1. Как сделать так, чтобы select отправлял данные даже если он disabled?

По спецификации disabled-поля не отправляются. Обойти это можно так:

1. Оставьте select disabled, чтобы пользователь не менял значение.
2. При отправке формы скопируйте значение в скрытое поле.

Пример:

```html
<select id="plan" disabled>
  <option value="basic" selected>Базовый</option>
</select>
<input type="hidden" name="plan" id="planHidden">

<script>
const select = document.getElementById('plan');
const hidden = document.getElementById('planHidden');

hidden.value = select.value;
</script>
```

Так сервер получит значение через скрытое поле.

### 2. Почему у меня не срабатывает required у select?

Частая причина — первый option имеет непустой value и одновременно selected. Браузер считает, что выбор уже сделан. Решение:

1. Добавьте первый option с пустым value и disabled.
2. Сделайте его selected.

```html
<select name="city" required>
  <option value="" disabled selected>Выберите город</option>
  <option value="msk">Москва</option>
</select>
```

Тогда браузер потребует выбор другого варианта.

### 3. Как программно триггерить событие change после изменения select.value?

После установки значения через select.value событие change автоматически не вызывается. Его нужно сгенерировать вручную:

```js
select.value = 'ru'; // Меняем значение
select.dispatchEvent(new Event('change')); // Явно вызываем change
```

Теперь все обработчики change сработают корректно.

### 4. Как получить текст выбранного option без доступа к selectedIndex?

Можно пройтись по options и найти выбранный:

```js
function getSelectedText(select) {
  for (const option of select.options) {
    if (option.selected) {
      return option.text;
    }
  }
  return '';
}
```

Это удобно для multiple-select, где selectedIndex не отражает все выбранные варианты.

### 5. Как сбросить select к состоянию по умолчанию (как при загрузке страницы)?

Используйте метод формы reset или вручную снимите выбранные флаги и заново поставьте selected у нужного варианта.

Через форму:

```html
<form id="myForm">
  <select name="status">
    <option value="new" selected>Новый</option>
    <option value="old">Старый</option>
  </select>
</form>

<script>
document.getElementById('myForm').reset();
// Все элементы формы, включая select, вернутся к исходным selected
</script>
```