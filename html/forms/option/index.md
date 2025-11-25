---
metaTitle: Опция списка HTML option - полный разбор тега
metaDescription: Подробное руководство по HTML тэгу option - синтаксис атрибуты управление выбором и доступностью варианты использования в формах и интерфейсах
author: Олег Марков
title: Опция списка HTML option - как работает и как правильно использовать
preview: Разберите HTML тег option вместе с практическими примерами - управление списками select множественный выбор доступность и динамическое создание опций через JavaScript
---

## Введение

Тег option в HTML описывает отдельный пункт в выпадающем списке select или в списке datalist. Именно через option вы задаете, какие значения сможет выбрать пользователь, как они будут отображаться в интерфейсе и какие данные в итоге отправятся на сервер.

Смотрите, я покажу вам, как это выглядит в базовом варианте:

```html
<select name="country">
  <!-- Здесь каждая строка option представляет один пункт списка -->
  <option value="ru">Россия</option>
  <option value="us">США</option>
  <option value="de">Германия</option>
</select>
```

Как видите, у пользователя на экране отображаются понятные названия стран, а в запрос на сервер уходят короткие значения из атрибута value. Это ключевая идея работы option. В этой статье мы подробно разберем, какие атрибуты поддерживает option, как он ведет себя внутри select и datalist, как управлять выбранным значением, как работать с этим тегом через JavaScript и на что обратить внимание с точки зрения доступности и UX.

## Базовый синтаксис option

### Минимальный пример

Самый простой вариант использования option выглядит так:

```html
<select>
  <!-- Здесь value не указан, поэтому его значение будет равно тексту "Apple" -->
  <option>Apple</option>
</select>
```

Если атрибут value не задан, браузер использует текст внутри тега как значение. Однако в реальных проектах почти всегда явно указывают value, чтобы отделить машинное значение от того, что видит пользователь.

### Обязательные и необязательные части

У option нет строго обязательных атрибутов. Обязательна только правильная вложенность:

- option должен находиться внутри select или datalist;
- тег нельзя вставлять напрямую в body или, например, в div.

Пример корректной структуры:

```html
<!-- Корректно - option внутри select -->
<select name="fruit">
  <option value="apple">Яблоко</option>
</select>

<!-- Корректно - option внутри datalist -->
<input list="browsers" name="browser" />

<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
</datalist>
```

Если option находится вне разрешенных контейнеров, поведение браузеров может отличаться, разметка станет невалидной, а часть опций может просто игнорироваться.

## Основные атрибуты option

Теперь давайте подробно разберем ключевые атрибуты, с которыми вы будете работать чаще всего.

### Атрибут value

Атрибут value определяет значение, которое отправится на сервер при выборе этой опции. Обычно оно более краткое и формальное, чем текст внутри option.

```html
<select name="payment_method">
  <!-- value - то, что увидит сервер -->
  <!-- Текст внутри option - то, что увидит пользователь -->
  <option value="card">Банковская карта</option>
  <option value="cash">Наличные</option>
  <option value="transfer">Банковский перевод</option>
</select>
```

Если атрибут value не указан:

- значение опции равно ее текстовому содержимому (без ведущих и завершающих пробелов);
- в запрос формы уйдет именно этот текст.

Это может быть неудобно при локализации: если текст меняется, значение формы тоже меняется. Поэтому лучше разделять отображаемый текст и значение через value.

### Атрибут selected

Атрибут selected ставит опцию в состояние выбранной по умолчанию.

```html
<select name="city">
  <option value="msk" selected>Москва</option>
  <option value="spb">Санкт-Петербург</option>
  <option value="nsk">Новосибирск</option>
</select>
```

Несколько важных моментов:

- В обычном select с одиночным выбором (без multiple) браузер выберет:
  - первую опцию с selected, если их несколько;
  - если selected нет ни у одной, будет выбрана первая не отключенная опция (не disabled).
- В select с multiple можно пометить selected несколько опций, и все они будут выбраны по умолчанию.

Давайте рассмотрим пример с множественным выбором:

```html
<select name="languages" multiple>
  <!-- Здесь по умолчанию выбраны два языка -->
  <option value="js" selected>JavaScript</option>
  <option value="py" selected>Python</option>
  <option value="go">Go</option>
</select>
```

В форме вы получите несколько значений для одного имени поля, обычно в виде массива на стороне сервера.

### Атрибут disabled

disabled делает опцию недоступной для выбора. В интерфейсе она скорее всего будет выглядеть «приглушенной» и не будет реагировать на клики.

```html
<select name="delivery">
  <!-- Опция показывается, но выбрать ее нельзя -->
  <option value="standard">Стандартная доставка</option>
  <option value="express">Экспресс-доставка</option>
  <option value="pickup" disabled>Самовывоз временно недоступен</option>
</select>
```

Особенность: если опция с disabled помечена как selected, конечное поведение зависит от браузера, но обычно:

- такая опция будет отображаться как выбранная, если нет других доступных;
- при попытке отправить форму браузер может выбрать первую доступную опцию;
- значение disabled опции, как правило, не попадает в отправляемые данные.

Лучше не делать disabled опцию единственной выбранной, если вы рассчитываете, что ее значение придет на сервер.

### Атрибут label

label задает краткую подпись для опции, которая может использоваться:

- браузером для автозаполнения;
- ассистивными технологиями;
- в некоторых специфических случаях отображения.

Обычно текст между открывающим и закрывающим тегом option уже является тем, что видит пользователь. Но label допускает разделение отображаемого текста и вспомогательного описания.

Простой пример:

```html
<select name="timezone">
  <!-- label может быть более коротким, чем текст -->
  <option value="utc+3" label="MSK">Москва UTC+3</option>
  <option value="utc+1" label="CET">Берлин UTC+1</option>
</select>
```

Несколько замечаний:

- В большинстве современных браузеров текст между тегами option отображается в интерфейсе, а label напрямую не виден;
- label полезен при генерации списков браузером, подсказках и для машинной обработки.

На практике разработчики используют label не очень часто, так как обычно достаточно просто текста внутри option.

### Атрибут title

title задает всплывающую подсказку при наведении курсора на опцию. Работает не во всех браузерах одинаково, но поддержка достаточно широкая.

```html
<select name="file_format">
  <!-- При наведении мыши пользователь увидит подсказку -->
  <option value="pdf" title="Подходит для печати и чтения">PDF</option>
  <option value="docx" title="Удобен для редактирования в офисных пакетах">DOCX</option>
</select>
```

Используйте title, когда нужно дать дополнительное пояснение, не перегружая сам текст опции.

### Глобальные и ARIA-атрибуты

К тегу option можно применять глобальные HTML-атрибуты, например:

- id
- class
- hidden
- data-* (пользовательские атрибуты)
- и прочие глобальные атрибуты.

А также ARIA-атрибуты для доступности:

- aria-disabled
- aria-selected
- и т.д.

Пример использования data-* и ARIA:

```html
<select name="plan">
  <!-- data-price хранит цену тарифа -->
  <!-- aria-label уточняет, как озвучивать опцию экранному диктору -->
  <option
    value="basic"
    data-price="0"
    aria-label="Базовый тариф, бесплатный"
  >
    Базовый
  </option>
</select>
```

Здесь data-price может быть использован скриптом для отображения цены, а aria-label делает вариант понятнее для пользователей с экранными дикторами.

## option внутри select

Теперь давайте подробно посмотрим, как option ведет себя внутри тега select, который используется для выпадающих списков.

### Обычный одиночный выбор

Классический случай — select без атрибута multiple. Выбрать можно только одну опцию.

```html
<select name="color">
  <option value="">Выберите цвет</option>
  <option value="red">Красный</option>
  <option value="green">Зеленый</option>
  <option value="blue">Синий</option>
</select>
```

Здесь есть важный нюанс: первая опция "Выберите цвет" скорее всего тоже будет считаться выбранной, если вы не добавите дополнительные проверки на стороне клиента или сервера. Поэтому:

- часто делают value пустым;
- на сервере проверяют, что значение не пустое;
- либо добавляют required на select:

```html
<select name="color" required>
  <option value="">Выберите цвет</option>
  <option value="red">Красный</option>
  <option value="green">Зеленый</option>
  <option value="blue">Синий</option>
</select>
```

С required браузер не позволит отправить форму, пока пользователь не выберет опцию с непустым значением (поведение может немного отличаться по браузерам, но эта схема обычно работает).

### Множественный выбор (multiple)

Если к select добавить атрибут multiple, пользователь сможет выбрать несколько опций.

```html
<select name="skills" multiple size="4">
  <!-- multiple - можно выбрать несколько опций -->
  <!-- size - сколько опций показывать одновременно -->
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="react">React</option>
</select>
```

Обратите внимание:

- Атрибут size управляет высотой списка в строках.
- Чаще всего пользователь будет удерживать Ctrl (или Cmd на macOS), чтобы выбрать несколько значений.
- На сервере вы получите массив значений (подробности зависят от бэкенд-технологии).

С точки зрения поведения option:

- может быть выбрано несколько опций с selected одновременно;
- удаление атрибута selected у одной из опций не влияет на другие.

### Группировка опций через optgroup

Чтобы логически объединить связанные опции, используют тег optgroup. Внутри optgroup находятся option.

```html
<select name="car">
  <!-- optgroup группирует связанные модели -->
  <optgroup label="Audi">
    <option value="a4">A4</option>
    <option value="a6">A6</option>
  </optgroup>

  <optgroup label="BMW">
    <option value="3series">3 серия</option>
    <option value="5series">5 серия</option>
  </optgroup>
</select>
```

Здесь:

- label на optgroup задает заголовок группы;
- option по-прежнему определяет отдельные пункты;
- опции внутри optgroup ведут себя так же, как и без него.

Дополнительно optgroup можно сделать disabled, чтобы запретить выбор всех опций в группе.

```html
<select name="subscription">
  <optgroup label="Текущие тарифы">
    <option value="standard">Стандарт</option>
  </optgroup>

  <optgroup label="Архивные тарифы" disabled>
    <!-- Все нижеследующие опции будут недоступны -->
    <option value="old_basic">Старый базовый</option>
    <option value="old_pro">Старый профессиональный</option>
  </optgroup>
</select>
```

В этом примере опции в архивной группе отображаются, но выбрать их нельзя.

## option внутри datalist

Тег datalist позволяет создавать список подсказок для поля ввода input. В отличие от select:

- пользователь не обязан выбирать одно из предложений;
- он может ввести произвольный текст;
- option здесь играет роль подсказки.

Давайте разберемся на примере:

```html
<!-- Поле ввода с привязкой к datalist через атрибут list -->
<input list="browsers" name="browser" />

<datalist id="browsers">
  <!-- Здесь значение подсказки берется из value -->
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
  <option value="Edge">
</datalist>
```

Особенности option в datalist:

- Текст между тегами option обычно игнорируется, важен атрибут value.
- Пользователь увидит выпадающий список подсказок, но может ввести другое значение.
- selected и disabled в контексте datalist обычно не используются. disabled может работать как способ скрыть подсказку, но это зависит от браузера.

## Управление опциями через JavaScript

Очень часто список опций нужно формировать или изменять динамически: в зависимости от предыдущего выбора, данных с сервера, фильтров и т.д. Покажу вам базовые приемы работы с option через JavaScript.

### Получение выбранной опции

Начнем с того, как получить выбранное значение.

```html
<select id="themeSelect">
  <option value="light">Светлая тема</option>
  <option value="dark" selected>Темная тема</option>
</select>

<script>
// Здесь мы находим сам select по id
const select = document.getElementById('themeSelect')

// Получаем текущее значение выбранной опции
const value = select.value  // "dark"

// Получаем сам DOM-элемент выбранной опции
const selectedOption = select.options[select.selectedIndex]

// Выводим в консоль текст выбранной опции
console.log(selectedOption.text)  // "Темная тема"
</script>
```

Здесь важны два свойства:

- select.value — значение атрибута value у выбранной опции;
- select.selectedIndex — индекс выбранной опции в коллекции options.

### Добавление новой опции

Есть несколько способов добавить новую опцию. Давайте рассмотрим два распространенных.

#### Способ 1: createElement и свойства

```html
<select id="citySelect">
  <option value="msk">Москва</option>
</select>

<script>
const select = document.getElementById('citySelect')

// Создаем новый элемент option
const newOption = document.createElement('option')

// Задаем значение для отправки на сервер
newOption.value = 'spb'

// Задаем текст, который увидит пользователь
newOption.text = 'Санкт-Петербург'

// Добавляем новую опцию в конец списка
select.add(newOption)  // эквивалентно select.appendChild(newOption)
</script>
```

Здесь метод add — это специализированный способ добавить элемент option в select. Можно использовать и appendChild, результат будет тем же.

#### Способ 2: конструктор new Option

В браузерах доступен удобный конструктор Option:

```html
<select id="langSelect">
  <option value="en">English</option>
</select>

<script>
const select = document.getElementById('langSelect')

// Здесь мы создаем опцию через конструктор Option
// Параметры: текст, value, defaultSelected, selected
const newOption = new Option('Русский', 'ru', false, true)

// Добавляем в список
select.add(newOption)

// Теперь selected опция - "Русский"
console.log(select.value)  // "ru"
</script>
```

Пояснение по параметрам конструктора Option:

1. text — текст, который видит пользователь;
2. value — значение для отправки на сервер;
3. defaultSelected — будет ли selected по умолчанию в HTML (реже используется);
4. selected — будет ли опция выбрана прямо сейчас.

### Удаление опций

Удалить опцию можно разными способами.

```html
<select id="removeExample">
  <option value="1">Первая</option>
  <option value="2">Вторая</option>
  <option value="3">Третья</option>
</select>

<script>
const select = document.getElementById('removeExample')

// Удаляем вторую опцию по индексу
// Здесь index 1 - это вторая опция (индексация с нуля)
select.remove(1)

// Либо можно удалить через removeChild
// select.removeChild(select.options[1])
</script>
```

Чтобы удалить все опции:

```html
const select = document.getElementById('removeExample')

// Способ 1 - обнулить длину коллекции
select.options.length = 0

// Способ 2 - через innerHTML
// select.innerHTML = ''
```

Первый способ (length = 0) обычно считается более «чистым» для select.

### Изменение выбранной опции программно

Теперь вы увидите, как можно изменить выбор опции из JavaScript.

```html
<select id="themeChoice">
  <option value="light">Светлая</option>
  <option value="dark">Темная</option>
  <option value="auto">Авто</option>
</select>

<script>
const select = document.getElementById('themeChoice')

// Способ 1 - задать значение
select.value = 'auto'

// Способ 2 - задать индекс
select.selectedIndex = 1  // выберет "Темная"
</script>
```

Если вы используете multiple, то управление немного отличается:

```html
<select id="multiSelect" multiple>
  <option value="a">Вариант A</option>
  <option value="b">Вариант B</option>
  <option value="c">Вариант C</option>
</select>

<script>
const select = document.getElementById('multiSelect')

// Снимаем выбор со всех опций
for (const option of select.options) {
  // Здесь мы явно выключаем выбор
  option.selected = false
}

// Выбираем нужные опции
select.options[0].selected = true  // A
select.options[2].selected = true  // C
</script>
```

Здесь важно помнить: в multiple select не существует одного-единственного selectedIndex, нужно работать с флагом selected у каждой опции.

## Поведение по умолчанию и подводные камни

### Что происходит, если нет ни одной опции

Если select пустой, то:

- поле все равно существует в форме;
- значение у него будет пустым;
- пользователь ничего не сможет выбрать.

Обычно пустой select не несет пользы, поэтому такие ситуации стараются предотвращать на этапе генерации разметки или при динамическом обновлении.

### Несколько selected в одиночном select

Если у вас несколько option помечены selected, но атрибута multiple у select нет, браузер выберет только одну из них.

```html
<select name="test">
  <option value="1" selected>Один</option>
  <option value="2" selected>Два</option>
</select>
```

На практике:

- большинство браузеров выберет первую из них (значение 1);
- разметка будет считаться неидеальной, хотя и работоспособной.

Лучше не полагаться на такое поведение и держать только одну selected в одиночном select.

### Пустой value и отсутствие value

Сравните два варианта:

```html
<select name="example1">
  <!-- Здесь значение опции равно пустой строке -->
  <option value="">Нет значения</option>
</select>

<select name="example2">
  <!-- Здесь значение будет равно тексту "Нет значения" -->
  <option>Нет значения</option>
</select>
```

В первом случае:

- в форме будет отправлено поле example1 со значением "" (пустая строка).

Во втором случае:

- будет отправлено поле example2 со значением "Нет значения".

Это влияет на валидацию и обработку данных на сервере. Обычно разработчики предпочитают явное value, чтобы поведение было предсказуемым.

### disabled плюс selected

Мы уже упоминали это, но стоит закрепить:

```html
<select name="plan">
  <option value="free" disabled selected>Бесплатный план недоступен</option>
  <option value="pro">Профессиональный</option>
</select>
```

В разных браузерах результат может отличаться, но чаще всего:

- интерфейс покажет, что выбран "Бесплатный" вариант, но он серый и недоступен;
- при отправке формы выберется pro, как первая доступная опция, или значение будет пустым.

Поэтому старайтесь не использовать disabled одновременно с selected для той опции, значение которой вам действительно нужно при отправке формы.

## Доступность и UX при работе с option

### Текст должен быть понятным сам по себе

Текст внутри option должен быть самодостаточным, без опоры на внешний контекст.

```html
<!-- Неудачный пример: без заголовка select непонятно, что означает "Базовый" -->
<select>
  <option>Базовый</option>
  <option>Премиум</option>
</select>

<!-- Лучше так: -->
<select aria-label="Тарифный план">
  <option>Базовый</option>
  <option>Премиум</option>
</select>
```

Здесь aria-label помогает пользователям экранных дикторов понять, к чему относятся опции.

### Опции-заглушки «Выберите…»

Часто используется первая опция-заглушка:

```html
<select name="category" required>
  <option value="" disabled selected>Выберите категорию</option>
  <option value="books">Книги</option>
  <option value="electronics">Электроника</option>
</select>
```

Здесь есть нюанс:

- disabled + selected может вести себя неоднозначно;
- если вы хотите требовать выбора другой опции, этот прием часто работает, но стоит протестировать поведение в целевых браузерах.

Альтернатива:

- использовать пустое значение без disabled;
- и проверять на стороне сервера, что значение не пустое.

```html
<select name="category" required>
  <option value="">Выберите категорию</option>
  <option value="books">Книги</option>
  <option value="electronics">Электроника</option>
</select>
```

В современных браузерах при required и пустом value пользователь не сможет отправить форму, пока не выберет другую опцию.

### Длина текста и переносы

Слишком длинные тексты в option ухудшают читаемость:

- в узких select текст может обрезаться;
- в разных браузерах поведение переносов отличается.

По возможности:

- делайте текст опций относительно коротким;
- дополнительные детали выносите в title или в текст рядом с select.

### Локализация

Так как текст опций — часть интерфейса, он должен быть локализуемым. Разделение value и видимого текста сильно упрощает локализацию:

```html
<select name="status">
  <!-- value остается стабильным во всех языках -->
  <option value="new">Новая заявка</option>
  <option value="in_progress">В работе</option>
  <option value="done">Завершена</option>
</select>
```

При переводе:

- меняется только текст между тегами option;
- значения value остаются прежними, что упрощает работу бэкенда и логики приложения.

## Практические примеры использования option

Теперь давайте посмотрим несколько типичных сценариев.

### Связанные списки: страна → город

Часто один select зависит от выбранного значения другого. Покажу вам простой пример на JavaScript.

```html
<select id="countrySelect">
  <option value="">Выберите страну</option>
  <option value="ru">Россия</option>
  <option value="de">Германия</option>
</select>

<select id="citySelect">
  <option value="">Сначала выберите страну</option>
</select>

<script>
// Здесь мы описываем список городов для каждой страны
const citiesByCountry = {
  ru: [
    { value: 'msk', label: 'Москва' },
    { value: 'spb', label: 'Санкт-Петербург' }
  ],
  de: [
    { value: 'berlin', label: 'Берлин' },
    { value: 'munich', label: 'Мюнхен' }
  ]
}

const countrySelect = document.getElementById('countrySelect')
const citySelect = document.getElementById('citySelect')

countrySelect.addEventListener('change', () => {
  // Очищаем список городов
  citySelect.options.length = 0

  const country = countrySelect.value

  if (!country || !citiesByCountry[country]) {
    // Если страна не выбрана, показываем заглушку
    const option = new Option('Сначала выберите страну', '')
    citySelect.add(option)
    return
  }

  // Добавляем первую опцию-заглушку
  citySelect.add(new Option('Выберите город', ''))

  // Добавляем города для выбранной страны
  for (const city of citiesByCountry[country]) {
    // Здесь для каждого города создается опция
    const option = new Option(city.label, city.value)
    citySelect.add(option)
  }
})
</script>
```

Обратите внимание:

- Мы полностью пересоздаем список опций при смене страны.
- Новые option создаются через конструктор new Option.
- Первая опция — подсказка, чтобы пользователь понимал, что нужно сделать.

### Подсказки через datalist для поля поиска

Еще один сценарий — подсказки на основе datalist.

```html
<label for="productSearch">Поиск товара:</label>
<input id="productSearch" list="productList" name="product" />

<datalist id="productList">
  <!-- В datalist важно только значение value -->
  <option value="Ноутбук">
  <option value="Смартфон">
  <option value="Планшет">
  <option value="Наушники">
</datalist>
```

Здесь:

- при вводе текста пользователь увидит подсказки из option;
- он может как выбрать одну из них, так и ввести другое значение;
- в итоговой форме отправится значение, которое осталось в input.

### Хранение дополнительной информации в data-атрибутах

Вы можете дополнительно «обогащать» опции данными для логики на стороне клиента.

```html
<select id="planSelect">
  <!-- data-price хранит цену тарифа -->
  <option value="free" data-price="0">Бесплатный</option>
  <option value="pro" data-price="500">Профессиональный</option>
  <option value="business" data-price="1500">Бизнес</option>
</select>

<p>Стоимость: <span id="price">0</span> ₽ в месяц</p>

<script>
const planSelect = document.getElementById('planSelect')
const priceSpan = document.getElementById('price')

planSelect.addEventListener('change', () => {
  // Здесь мы находим выбранную опцию
  const selectedOption = planSelect.options[planSelect.selectedIndex]

  // Получаем цену из data-атрибута
  const price = selectedOption.dataset.price

  // Обновляем текст на странице
  priceSpan.textContent = price
})
</script>
```

В этом примере:

- каждый option содержит цену в data-price;
- при выборе тарифа цена автоматически отображается на странице;
- вам не нужно дополнительно искать информацию в массиве или на сервере.

## Заключение

Тег option — небольшой по синтаксису элемент, но от него сильно зависит удобство и корректность работы форм, выпадающих списков и подсказок в интерфейсе. Через option вы:

- задаете набор возможных значений для select и datalist;
- управляете тем, какие данные отправятся на сервер (через value);
- определяете, что пользователь увидит в интерфейсе (через текст и, при необходимости, label и title);
- контролируете доступность и состояние пункта (selected, disabled);
- можете хранить дополнительную информацию для клиентской логики (через data-* атрибуты).

При работе с option особенно важно:

- всегда осознанно задавать value, а не полагаться только на текст;
- понимать разницу между поведением в select и datalist;
- аккуратно работать с selected и disabled, особенно при множественном выборе;
- тестировать сценарии с пустыми значениями и опциями-заглушками;
- при необходимости использовать JavaScript для динамического управления списком.

Если вы будете учитывать эти моменты, элементы select и datalist в вашем интерфейсе будут работать предсказуемо, удобно для пользователя и корректно для серверной логики.

## Частозадаваемые технические вопросы

### 1. Как сделать, чтобы по умолчанию не было выбрано ни одной опции в select?

В классическом select без multiple всегда считается выбранной какая-то опция. Если вы хотите заставить пользователя сделать осознанный выбор:

1. Добавьте первую опцию с пустым value.
2. Сделайте select required.
3. Можете визуально подсказать пользователю, что нужно выбрать что-то другое.

Пример:

```html
<select name="category" required>
  <!-- Пустое value и понятный текст-подсказка -->
  <option value="">Выберите категорию</option>
  <option value="books">Книги</option>
  <option value="electronics">Электроника</option>
</select>
```

Браузер не позволит отправить форму, пока выбрана опция с пустым value.

### 2. Почему у меня не работает selected, если я устанавливаю его через innerHTML?

Если вы формируете select через innerHTML, атрибут selected задаст начальное состояние, но если после этого вы еще раз измените value у select или options программно, состояние может не совпадать.

Рекомендации:

1. После установки innerHTML явно задайте выбранное значение через select.value.
2. Либо используйте создание option через createElement или new Option и управляйте флагом selected программно.

```js
select.innerHTML = '<option value="a">A</option><option value="b" selected>B</option>'
// Гарантируем выбор
select.value = 'b'
```

### 3. Как прочитать все выбранные опции в multiple select?

В multiple select свойство value возвращает только первое выбранное значение. Чтобы получить все:

```js
const select = document.getElementById('myMulti')

const selectedValues = []

for (const option of select.options) {
  if (option.selected) {
    selectedValues.push(option.value)
  }
}
```

Дальше вы можете отправить этот массив на сервер через fetch или сериализовать при помощи формы.

### 4. Можно ли скрыть опцию, но оставить ее выбранной?

Стандартный способ скрыть элемент — атрибут hidden или CSS display none. Но:

- если скрыть option через hidden или CSS, она перестанет отображаться в списке;
- в большинстве браузеров при этом опция обычно перестает быть «нормальной» частью выбора.

Если вам нужно сохранить значение, но не показывать опцию пользователю:

1. Храните значение в скрытом input type="hidden".
2. В select показывайте только доступные для изменения опции.

```html
<input type="hidden" name="plan" value="free">
<select name="plan_visible">
  <option value="pro">Профессиональный</option>
  <option value="business">Бизнес</option>
</select>
```

На сервер вы получите и изначальное значение, и выбранное пользователем.

### 5. Почему в datalist не работает selected и не видно текста между тегами option?

В контексте datalist:

- учитывается только атрибут value у option, он формирует список подсказок;
- текст между тегами option обычно игнорируется;
- атрибут selected не имеет смысла, потому что пользователь может ввести любое значение, а не обязан выбирать подсказку.

Если вам нужно задать значение по умолчанию, делайте это прямо в input:

```html
<input list="browsers" name="browser" value="Chrome" />
<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
</datalist>
```