---
metaTitle: Инструкция по реализации календаря во Vue
metaDescription: Подробно о создании календаря во Vue - от структуры компонентов до обработки событий и кастомизации интерфейса
author: Олег Марков
title: Инструкция по реализации календаря во Vue
preview: Узнайте, как создать календарь во Vue - примеры компонентов, обработка даты и событий, кастомизация и советы по расширению функционала
---

## Введение

Современные веб-приложения часто требуют элементов взаимодействия с датами: бронирование встреч, планирование задач, упаковка расписаний и рабочих смен. Календарь — один из самых востребованных компонентов для таких задач. Библиотеки дают готовые решения, но нередко разработчику важно создать кастомный, гибкий календарь под конкретное приложение на Vue.

В этой инструкции предлагаю подробно разобрать пошаговую реализацию календаря во Vue — начиная с проектирования компонентов, разметки, генерации дат до продвинутой обработки пользовательских событий и стилизации. Мы рассмотрим базовые принципы, предоставим примеры и конкретные схемы работы, чтобы вы смогли быстро внедрить календарь в своё приложение.

## Проектирование структуры календаря

### Определение основных элементов

Перед реализацией давайте подумаем, какие функциональные и визуальные элементы нужны для базового отображения календаря:

- Заголовок месяца/года и кнопки навигации (вперед/назад)
- Сетка дней недели (Пн, Вт, Ср…)
- Ячейки дней с правильным смещением для первого дня месяца
- Возможность выделить текущую дату и выбранную дату
- Обработка кликов по датам

Для начала спланируем дерево компонентов. Часто календарь реализуют в одном компоненте, но при необходимости его можно разбить:

- `Calendar.vue` — основной контейнер календаря
- `CalendarHeader.vue` — заголовок с навигацией
- `CalendarGrid.vue` — часть с сеткой дней

В этой статье мы сосредоточимся на одном компоненте, чтобы пример был проще для понимания и доработки.

### Минимальные требования к данным

Календарю нужны:

- Текущий выбранный месяц/год
- Текущая выбранная дата (она же может быть `null`)
- Список дней для текущего месяца (включая смещение для первой недели)

Теперь покажу, как всё это реализовать на практике.

## Реализация календарного компонента на Vue

### Базовая структура компонента

Вот пример скелета, с которого начинается практически любой календарь во Vue 3 (с Options API):

```vue
<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <button @click="prevMonth">&#8592;</button>
      <span>{{ monthNames[currentMonth] }} {{ currentYear }}</span>
      <button @click="nextMonth">&#8594;</button>
    </div>
    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div v-for="wday in weekDays" :key="wday">{{ wday }}</div>
      </div>
      <div class="calendar-days">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          :class="{
            'not-current-month': !day.currentMonth,
            'today': day.isToday,
            'selected': day.isSelected
          }"
          @click="selectDate(day)"
        >
          {{ day.date.getDate() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Calendar',
  data() {
    const today = new Date()
    return {
      currentMonth: today.getMonth(),      // Индекс месяца: 0 - январь
      currentYear: today.getFullYear(),
      selectedDate: null,                  // Хранит выбранную дату
      today: today,
      weekDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      monthNames: [
        'Январь', 'Февраль', 'Март', 'Апрель', 
        'Май', 'Июнь', 'Июль', 'Август', 
        'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ]
    }
  },
  computed: {
    calendarDays() {
      return this.generateCalendar()
    }
  },
  methods: {
    // Методы будут описаны позже
  }
}
</script>
```

В этом коде мы подготовили заготовку для календаря, с которой можно работать дальше. Обратите внимание, что в разметке мы используем циклы для вывода дней и дней недели. Все стили будут зависеть от классов: `not-current-month`, `today`, `selected`.

Создание календаря во Vue.js – отличный способ улучшить функциональность ваших веб-приложений.  Изучение структуры компонентов, обработки событий и кастомизации интерфейса позволит вам создавать удобные и интерактивные календари. Если вы хотите детальнее погрузиться в Vue.js, изучить основы, компоненты, свойства и события, реактивность, жизненный цикл, а также научиться работать с Vue Router и Pinia, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Instrukciya-po-realizacii-kalendarya-vo-Vue). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Генерация дней месяца

Чтобы корректно отобразить сетку месяца, календарю важно:

- Начать месяц с нужного дня недели (например, если 1 июня — это суббота, то дни должны сдвинуться)
- Заполнить пустые ячейки предыдущими/следующими месяцами (для целостности сетки)
- Отметить, какие даты из текущего месяца

Покажу, как реализовать функцию генерации.

```js
methods: {
  generateCalendar() {
    // 1. Определяем первый и последний день месяца
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1)
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0)
    // 2. Определяем день недели для первого дня месяца: 0 - воскресенье
    let startDay = firstDayOfMonth.getDay()
    // Для недели, где Пн - первый, превращаем 0 в 6, иначе уменьшаем на 1
    startDay = (startDay + 6) % 7

    const days = []

    // 3. Добавляем предыдущие дни (от конца прошлого месяца, если нужно)
    for (let i = 0; i < startDay; i++) {
      const date = new Date(
        this.currentYear, 
        this.currentMonth, 
        -(startDay - i - 1)
      )
      days.push({
        date,
        currentMonth: false,
        isToday: this.isToday(date),
        isSelected: this.isSelected(date)
      })
    }

    // 4. Текущий месяц
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d)
      days.push({
        date,
        currentMonth: true,
        isToday: this.isToday(date),
        isSelected: this.isSelected(date)
      })
    }

    // 5. Дополняем до полного количества ячеек (6 строк по 7 дней)
    while (days.length % 7 !== 0) {
      const date = new Date(this.currentYear, this.currentMonth + 1, days.length - lastDayOfMonth.getDate() - startDay + 1)
      days.push({
        date,
        currentMonth: false,
        isToday: this.isToday(date),
        isSelected: this.isSelected(date)
      })
    }

    return days
  },
  isToday(date) {
    // Проверяет, совпадает ли дата с сегодняшней
    return (
      date.getDate() === this.today.getDate() &&
      date.getMonth() === this.today.getMonth() &&
      date.getFullYear() === this.today.getFullYear()
    )
  },
  isSelected(date) {
    if (!this.selectedDate) return false
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    )
  },
  prevMonth() {
    // Переход на предыдущий месяц
    if (this.currentMonth === 0) {
      this.currentMonth = 11
      this.currentYear -= 1
    } else {
      this.currentMonth -= 1
    }
  },
  nextMonth() {
    // Переход на следующий месяц
    if (this.currentMonth === 11) {
      this.currentMonth = 0
      this.currentYear += 1
    } else {
      this.currentMonth += 1
    }
  },
  selectDate(day) {
    if (!day.currentMonth) {
      // Если пользователь кликнул по дню из прошлого/следующего месяца — перелистываем месяц
      const date = day.date
      this.currentMonth = date.getMonth()
      this.currentYear = date.getFullYear()
    }
    this.selectedDate = day.date
  }
}
```

Посмотрите, как устроена генерация массива дней для отображения сетки — элементы для предыдущего и следующего месяцев добавляются автоматически, чтобы календарь всегда выглядел целостно. Все вычисления и проверки вынесены в отдельные методы для лучшей читаемости.

### Визуальное выделение дат

Чтобы пользователю было удобно взаимодействовать с вашим календарём, важно визуально показывать текущее положение и выбор:

- Для выделения сегодняшней даты используйте класс `today`
- Для выделенной (выбранной) даты класс `selected`
- Для неактивных дат предыдущего или следующего месяца — `not-current-month`

CSS для этих классов может быть, например, такой:

```css
.calendar-days > div {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  cursor: pointer;
  border-radius: 50%;
  margin: 2px;
  display: inline-block;
}
.calendar-days > div.today {
  background: #f7b731;
  color: #fff;
}
.calendar-days > div.selected {
  background: #3867d6;
  color: #fff;
}
.calendar-days > div.not-current-month {
  color: #bbb;
  opacity: 0.6;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
}
.calendar-weekdays > div {
  font-weight: bold;
  width: 32px;
  text-align: center;
  display: inline-block;
}
```

Добавьте этот CSS в соответствующие стили компонента или проекта.

### Обработка переходов месяца и года

В приведённом выше коде для методов `prevMonth` и `nextMonth` реализована корректная обработка смены года при переполнении (например, с декабря на январь, или наоборот). Так обеспечивается плавная навигация по всему диапазону дат.

### Выбор даты и связь с моделью данных

В методе `selectDate(day)` реализован универсальный подход к выбору даты. Выбранная дата сохраняется в состоянии компонента (`selectedDate`). Если требуется, чтобы календарь работал как контролируемый компонент — передавайте значение через пропсы и сообщайте о выборе с помощью события:

```js
props: {
  modelValue: Date,
},
emits: ['update:modelValue'],
data() {
  // ...
  return {
    // ...
    selectedDate: this.modelValue || null
  }
},
watch: {
  modelValue(newVal) {
    this.selectedDate = newVal
  }
},
methods: {
  selectDate(day) {
    // ...
    this.selectedDate = day.date
    this.$emit('update:modelValue', this.selectedDate)
  }
}
```

Этот подход позволит использовать календарь с синтаксисом v-model, а родительский компонент будет управлять значением даты.

### Кастомизация и расширение календаря

#### Добавление событий

Календарь часто используется для отображения событий, например встреч, напоминаний или отпусков. Для этого к каждому дню можно прикреплять массив событий и подсвечивать их:

```js
props: {
  events: {
    type: Array,
    default: () => []
  }
},
methods: {
  eventsForDay(date) {
    // Фильтруем события по дате
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        date.getDate() === eventDate.getDate() &&
        date.getMonth() === eventDate.getMonth() &&
        date.getFullYear() === eventDate.getFullYear()
      )
    })
  }
}
```

В шаблоне:

```html
<div
  v-for="(day, idx) in calendarDays"
  :key="idx"
  @click="selectDate(day)"
  :class="..."
>
  {{ day.date.getDate() }}
  <span
    v-if="eventsForDay(day.date).length"
    class="event-dot"
  ></span>
</div>
```

Добавьте CSS для `.event-dot`, чтобы события отображались в виде точки или иконки.

#### Ограничение диапазона дат

Иногда требуется запретить выбор дат вне заданного диапазона (например, нельзя выбрать дату раньше сегодняшнего дня).

Добавьте пропсы `minDate` и `maxDate`, а затем проверьте их в методе выбора даты:

```js
methods: {
  canSelect(date) {
    if (this.minDate && date < this.minDate) return false
    if (this.maxDate && date > this.maxDate) return false
    return true
  },
  selectDate(day) {
    if (this.canSelect(day.date)) {
      this.selectedDate = day.date
      this.$emit('update:modelValue', this.selectedDate)
    }
  }
}
```

В шаблоне используйте условие disabled и измените стили неактивных дней.

## Международная локализация и форматы дат

Для поддержки разных языков и региональных стандартов вы можете использовать встроенные методы Intl.DateTimeFormat или сторонние библиотеки (например, date-fns, dayjs, moment.js). Переводите названия месяцев и дней недели, выбирайте правильный первый день недели (например, в США воскресенье, в России — понедельник).

Пример с Intl.DateTimeFormat:

```js
computed: {
  weekDays() {
    // Возвращаем массив дней недели согласно локали
    const formatter = new Intl.DateTimeFormat('ru', { weekday: 'short' })
    const days = []
    for (let i = 1; i <= 7; i++) { // понедельник (1) - воскресенье (7)
      const tempDate = new Date(2021, 0, i)
      days.push(formatter.format(tempDate))
    }
    return days
  }
}
```

Вы можете передавать локаль как пропс, чтобы поддерживать переключение пользователя.

## Поддержка мобильных устройств и адаптивная верстка

Календарь должен оставаться удобным на маленьких экранах. Используйте медиазапросы для уменьшения размера ячеек, увеличения области нажатия и упрощения интерфейса. Можно показать дни одной строкой (горизонтальный скролл) или добавить отдельную мобильную версию через условия в шаблоне.

```css
@media (max-width: 600px) {
  .calendar-days > div,
  .calendar-weekdays > div {
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
  }
  .calendar-header span {
    font-size: 14px;
  }
}
```

## Выделение диапазона дат (выбор интервала)

Для более сложных задач, например выбора периода заселения в отеле, календарь должен поддерживать выделение диапазона.

Для этого заведите в состоянии два значения: `startDate` и `endDate`. 

В методе выбора даты реализуйте следующий алгоритм:

- Если оба значения пусты или заполнены, при выборе первый раз сбрасываете диапазон и устанавливаете только startDate.
- Если startDate есть, но endDate пустой — сравните значения и определите границы.
- В шаблоне подсвечивайте дни между startDate и endDate (например, добавьте класс `range` через computed свойство).

Покажу, как часть этого реализовать:

```js
data() {
  return {
    // ...
    startDate: null,
    endDate: null
  }
},
methods: {
  selectDate(day) {
    if (!this.startDate || (this.startDate && this.endDate)) {
      this.startDate = day.date
      this.endDate = null
    } else {
      if (day.date >= this.startDate) {
        this.endDate = day.date
      } else {
        this.endDate = this.startDate
        this.startDate = day.date
      }
    }
  },
  isInRange(date) {
    if (!this.startDate || !this.endDate) return false
    return date > this.startDate && date < this.endDate
  }
}
// В шаблоне:
:class="{ 'range': isInRange(day.date) }"
```

## Тестирование календаря

Рекомендую протестировать следующие кейсы:

- Клик по дню меняет выбранную дату
- Клик по дню из соседнего месяца листает месяц
- Навигация по месяцам работает в обоих направлениях
- Ограничения по выбору дат (если заданы)
- Корректное отображение дат для любого месяца/года
- Выделение сегодняшнего дня
- Все функции работают при смене языка/локали

Для автоматических тестов можно использовать Vue Test Utils и JEST.

## Заключение

Теперь у вас есть подробная инструкция по реализации кастомного календаря во Vue. Такой компонент легко адаптируется под поиск событий, выбор диапазона, поддержку событий и работу с временными ограничениями. Вы можете расширять функциональность календаря по необходимым сценариям, добавлять стили, поддержку мультивыбора, подсказки, интеграцию с API и многое другое.

Освоение создания календарей поможет вам создавать более удобные и функциональные веб-приложения. В первых 3 модулях курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Instrukciya-po-realizacii-kalendarya-vo-Vue) уже доступно бесплатное содержание — начните погружаться в мир Vue.js и календарей прямо сейчас.

Описание структуры, генерации дней, подключения событий и кастомизации сделает ваш календарь не только гибким, но и удобным для пользователей и коллег по проекту.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать так, чтобы календарь отображал недели с воскресенья?

В функции генерации календаря измените сдвиг startDay для недели, начинающейся с воскресенья:

```js
// С воскресенья: 0 - воскресенье, 1 - понедельник и т.д.
let startDay = firstDayOfMonth.getDay(); // 0 - воскресенье, уже корректно
```
Также переставьте порядок дней недели в массиве `weekDays`.

---

### Как добавить поддержку темной темы?

Используйте динамические классы или CSS-переменные для цветов. Например, переключайте класс `.dark-theme` для контейнера.

---

### Как сделать календарь доступным для скринридеров?

Добавьте атрибуты aria-*, role и семантические теги. Пример: используйте `<table>` для сетки календаря, добавляйте `aria-selected` для выбранных дат.

---

### Почему календарь некорректно работает при смене временной зоны?

Везде используйте UTC-методы (`getUTCDate`, `setUTCDate` и др.) или всегда приводите локальное время к одной временной зоне, например, через moment.js или date-fns.

---

### Как реализовать выбор нескольких дат (мультиселект)?

Вместо `selectedDate` делайте массив выбранных дат и изменяйте его по клику на день. Для выделения используйте проверку наличия даты в массиве.
