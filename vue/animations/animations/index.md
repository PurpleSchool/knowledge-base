---
metaTitle: Анимации во Vue animations
metaDescription: Подробное руководство по анимациям во Vue animations - разбор transition и transition-group работа с CSS и JS анимациями и практические примеры использования
author: Олег Марков
title: Анимации во Vue animations - от базовых переходов до сложных сценариев
preview: Узнайте как работать с анимациями во Vue animations - используйте transition и transition-group настраивайте CSS и JS анимации и оптимизируйте интерфейс
---

## Введение

Анимации во Vue помогают сделать интерфейс живым и понятным. Пользователь лучше воспринимает изменения в интерфейсе, когда видит постепенный переход, а не резкое появление или исчезновение элементов. Vue даёт вам встроенные инструменты, чтобы не «прикручивать» анимации вручную на чистом JavaScript, а описывать их декларативно.

Давайте разберёмся, какие возможности предоставляет Vue для анимаций, как использовать компоненты transition и transition-group, как подключать CSS-анимации, как управлять ими через JavaScript и как комбинировать эти подходы.

В статье я буду опираться на Vue 3, но большая часть примеров актуальна и для Vue 2 (кроме мелких отличий в синтаксисе).

---

## Базовый компонент transition

### Зачем нужен transition

Компонент transition — это специальная обёртка, которую вы используете вокруг элемента или дочернего компонента, чтобы автоматически привязать к нему CSS-классы, связанные с появлением и исчезновением.

Vue сам добавляет и убирает классы в нужные моменты жизненного цикла элемента:

- когда элемент появляется;
- когда элемент исчезает;
- когда элемент уже вставлен в DOM, но анимация ещё идёт.

Вам остаётся только описать стили для этих классов.

### Простейший пример появления и скрытия элемента

Смотрите, я покажу вам, как это работает.

```html
<template>
  <div>
    <!-- Переключаем флаг show -->
    <button @click="show = !show">
      Переключить
    </button>

    <!-- Оборачиваем элемент в transition -->
    <transition name="fade">
      <!-- v-if управляет появлением / исчезновением -->
      <p v-if="show">
        Этот текст будет плавно появляться и исчезать
      </p>
    </transition>
  </div>
</template>

<script setup>
// Здесь мы создаем реактивное состояние show
import { ref } from 'vue'

const show = ref(true)
</script>

<style scoped>
/* Класс для начального и конечного состояния (скрыт) */
.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* Прозрачный элемент */
}

/* Класс для состояния, когда элемент показан */
.fade-enter-to,
.fade-leave-from {
  opacity: 1; /* Полностью видимый */
}

/* Класс, который задает сам переход */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease; /* Плавное изменение прозрачности */
}
</style>
```

Как видите, всё управление анимацией сводится к работе с CSS-классами, которые Vue автоматически навешивает в нужный момент.

### Как именно Vue навешивает классы

Чтобы вы лучше понимали, что происходит, давайте перечислим основные фазы:

При показе (enter):

- элемент добавляется в DOM;
- Vue устанавливает классы:
  - `fade-enter-from`
  - `fade-enter-active`
- затем, на следующем кадре анимации, Vue заменяет:
  - `fade-enter-from` → `fade-enter-to`
- после завершения CSS-перехода удаляется:
  - `fade-enter-active`
  - `fade-enter-to`

При скрытии (leave):

- Vue сразу добавляет классы:
  - `fade-leave-from`
  - `fade-leave-active`
- затем заменяет:
  - `fade-leave-from` → `fade-leave-to`
- после окончания анимации:
  - удаляет `fade-leave-to` и `fade-leave-active`
  - удаляет сам элемент из DOM

Важно понять: наличие классов `*-enter-active` и `*-leave-active` говорит Vue, что есть CSS-переход или анимация, и нужно дождаться её завершения (по событиям transitionend или animationend).

---

## Набор классов анимаций во Vue

### Список классов, которые использует transition

Давайте посмотрим, какие именно классы может навешивать компонент transition для имени `fade` (через атрибут name):

- `fade-enter-from`
- `fade-enter-active`
- `fade-enter-to`
- `fade-leave-from`
- `fade-leave-active`
- `fade-leave-to`

Если вы не зададите атрибут name, по умолчанию будет использоваться `v`:

- `v-enter-from`
- `v-enter-active`
- и так далее.

### Разница между from, active и to

Обратите внимание на роли этих классов:

- `*-enter-from` и `*-leave-to` — это «начальное» или «конечное» состояние элемента. Через них удобно задать позицию, прозрачность и т.д.
- `*-enter-to` и `*-leave-from` — противоположное состояние (элемент показан или скрыт).
- `*-enter-active` и `*-leave-active` — задают общие параметры перехода: `transition`, `animation`, `will-change` и так далее.

Смотрите, я покажу вам на коротком примере, как это помогает.

```css
.slide-enter-from {
  transform: translateY(-10px); /* Элемент немного выше и невидим */
  opacity: 0;
}

.slide-enter-to {
  transform: translateY(0); /* Возвращаем на место */
  opacity: 1;
}

.slide-enter-active {
  transition: all 0.2s ease-out; /* Плавный сдвиг и появление */
}
```

Вы описываете начальное и конечное состояния, а active определяет «как перейти между ними».

---

## Особенности работы с v-if и v-show

### Анимации с v-if

С v-if всё понятно: пока условие истинно — элемент существует в DOM; когда условие становится ложным, элемент удаляется. Vue анимирует момент добавления и удаления.

- `v-if` + `transition` — классический случай «появился/исчез».

### Анимации с v-show

`v-show` не удаляет элемент из DOM, а просто переключает `display: none` и `display: ''`. Vue тоже умеет анимировать эти переходы, но работает это иначе: вместо enter/leave здесь используется так называемый transition mode «appear/leave» для изменения display.

Пример:

```html
<template>
  <div>
    <button @click="visible = !visible">
      Переключить v-show
    </button>

    <transition name="fade">
      <!-- Элемент всегда в DOM, но скрывается через display -->
      <p v-show="visible">
        Я скрываюсь через display none
      </p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(true) // Управляет видимостью
</script>
```

Практический момент: анимации с v-show подходят для элементов, которые часто показываются и скрываются, чтобы не пересоздавать их каждый раз (формы, панели и т.п.). Но учтите, что такие элементы продолжают участвовать в разметке, если только вы не скрываете их ещё и по размеру или позиционированию.

---

## Входные анимации при первой загрузке (appear)

По умолчанию transition не анимирует элемент при первом появлении на странице (при монтировании компонента). Чтобы включить такую анимацию, используется атрибут appear.

Давайте разберёмся на примере.

```html
<template>
  <transition
    name="fade"
    appear
  >
    <h1>Заголовок плавно появляется при загрузке</h1>
  </transition>
</template>

<style scoped>
/* Классы для обычного enter */
.fade-enter-from,
.fade-appear-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-appear-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-enter-active,
.fade-appear-active {
  transition: all 0.4s ease-out;
}
</style>
```

Здесь Vue дополнительно использует классы:

- `fade-appear-from`
- `fade-appear-active`
- `fade-appear-to`

Если вы их не зададите, Vue переиспользует enter-классы, но возможность их разделять бывает полезна, когда вы хотите другое поведение при первой загрузке.

---

## Режимы переходов (transition modes)

Когда вы анимируете взаимозаменяющиеся элементы (пример: переключение между вкладками, смена текста и т.п.), может потребоваться контролировать порядок скрытия старого и появления нового. Для этого служит атрибут mode.

Доступные значения:

- `out-in` — сначала скрывается старый элемент, потом появляется новый;
- `in-out` — наоборот, сначала появляется новый, потом скрывается старый.

По умолчанию оба элемента могут присутствовать одновременно, если вы используете, например, `v-if / v-else` внутри одного transition.

Посмотрим, что происходит в коде.

```html
<template>
  <div>
    <button @click="toggle">
      Переключить состояние
    </button>

    <transition name="fade" mode="out-in">
      <!-- Только один из элементов показывается за раз -->
      <p v-if="on" key="on">
        Состояние включено
      </p>
      <p v-else key="off">
        Состояние выключено
      </p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const on = ref(true)

const toggle = () => {
  // Меняем флаг on при нажатии на кнопку
  on.value = !on.value
}
</script>
```

Здесь важны `key` у элементов: Vue понимает, что это два разных состояния и применяет к каждому свой цикл анимации. Режим `out-in` не даёт им существовать одновременно.

---

## CSS transition и CSS animation

### Когда использовать transition, а когда animation

Через CSS вы можете делать анимации двумя способами:

- с помощью `transition` — когда нужно плавно изменить известные свойства из одного состояния в другое;
- с помощью `animation` и `@keyframes` — когда нужно более сложное поведение (несколько этапов, циклы, задержки и т.д.).

Vue поддерживает оба варианта. Разница только в том, какое событие будет «сигналом» завершения анимации:

- для transition — `transitionend`;
- для animation — `animationend`.

Vue сам слушает оба события. Если есть и transition, и animation одновременно, Vue будет считать длительность по большему из них, поэтому иногда лучше разделять их или явно управлять с помощью JavaScript.

Давайте посмотрим пример с CSS-анимацией.

```html
<template>
  <transition name="bounce">
    <button v-if="show" @click="show = false">
      Нажми меня, я подпрыгну и исчезну
    </button>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(true) // Контролируем показ кнопки
</script>

<style scoped>
/* Определяем keyframes для подпрыгивания */
@keyframes bounce-out {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.1); /* Немного увеличиваем кнопку */
  }
  100% {
    transform: scale(0); /* Уменьшаем до нуля */
  }
}

/* Активный класс для анимации ухода */
.bounce-leave-active {
  animation: bounce-out 0.4s ease-in forwards;
  /* forwards - чтобы сохранить итоговое состояние */
}

/* Начальное состояние для ухода */
.bounce-leave-from {
  transform: scale(1);
}

/* Конечное состояние (можно не задавать, если есть forwards) */
.bounce-leave-to {
  transform: scale(0);
}
</style>
```

Здесь вы видите, как через animation задаётся более сложная логика, чем при обычном transition.

---

## Анимации списков с transition-group

### Зачем нужен transition-group

Когда вы анимируете появление/исчезновение одного элемента, transition вполне достаточно. Но если вам нужно:

- анимировать добавление и удаление элементов массива;
- анимировать их сортировку;
- анимировать перестановку (перетаскивание, изменение порядка),

используется компонент transition-group.

Он умеет:

- анимировать элементы при добавлении и удалении так же, как transition;
- добавлять специальные классы для анимации перемещения элементов (`*-move`).

### Базовый пример анимации списка

Давайте разберём простой пример с добавлением и удалением.

```html
<template>
  <div>
    <button @click="addItem">
      Добавить элемент
    </button>

    <button @click="removeItem" :disabled="items.length === 0">
      Удалить последний
    </button>

    <!-- Используем transition-group для списка -->
    <transition-group name="list" tag="ul">
      <!-- Здесь важны уникальные key для каждого элемента -->
      <li
        v-for="item in items"
        :key="item.id"
      >
        {{ item.text }}
      </li>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue'

let idCounter = 1

// Создаем реактивный массив элементов
const items = ref([
  { id: idCounter++, text: 'Элемент 1' },
  { id: idCounter++, text: 'Элемент 2' }
])

const addItem = () => {
  // Добавляем новый элемент в конец массива
  items.value.push({
    id: idCounter++,
    text: `Элемент ${idCounter - 1}`
  })
}

const removeItem = () => {
  // Удаляем последний элемент массива
  items.value.pop()
}
</script>

<style scoped>
/* Выделим список для наглядности */
ul {
  padding: 0;
  list-style: none;
}

li {
  margin: 4px 0;
  padding: 8px;
  background: #f3f3f3;
}

/* Появление элемента */
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Исчезновение элемента */
.list-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Плавный переход */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease-out;
}
</style>
```

Vue будет анимировать каждый элемент списка при его добавлении или удалении на основе этих CSS-классов.

### Анимация перемещения элементов (move)

Особенность transition-group в том, что он отслеживает изменение позиций элементов и позволяет анимировать их «перетекание» на новое место.

Vue добавляет класс `*-move` (для нашего примера `list-move`), когда элемент меняет своё положение. Чтобы это заработало, важно:

- задать `transition` для `list-move`;
- обеспечить, чтобы элементы могли перемещаться (обычно они должны быть отображены в нормальном потоке, а не absolute).

Покажу вам, как это реализовано на практике.

```html
<template>
  <div>
    <button @click="shuffle">
      Перемешать список
    </button>

    <transition-group name="list" tag="ul">
      <li
        v-for="item in items"
        :key="item.id"
      >
        {{ item.text }}
      </li>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Инициализируем список элементов
const items = ref([
  { id: 1, text: 'Первый' },
  { id: 2, text: 'Второй' },
  { id: 3, text: 'Третий' },
  { id: 4, text: 'Четвертый' }
])

// Простая функция перемешивания (Fisher–Yates)
const shuffleArray = (array) => {
  // Клонируем массив, чтобы не мутировать его напрямую
  const result = array.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

const shuffle = () => {
  // Перезаписываем items новым перемешанным массивом
  items.value = shuffleArray(items.value)
}
</script>

<style scoped>
ul {
  padding: 0;
  list-style: none;
}

li {
  margin: 4px 0;
  padding: 8px;
  background: #f3f3f3;
}

/* Вход и выход можно не задавать, если главное - перемещение */
.list-move {
  transition: transform 0.4s ease; /* Переход применяется при смене позиции элемента */
}
</style>
```

Как только меняется порядок в массиве, Vue вычисляет старые и новые позиции элементов и применяет CSS-трансформации для плавного перемещения.

---

## JavaScript-хуки для анимаций

### Когда нужна JS-анимация

Иногда возможностей CSS не хватает:

- вам нужно анимировать что-то, что трудно выразить в CSS;
- вы хотите использовать стороннюю JS-библиотеку (GSAP, anime.js и т.д.);
- вам нужна полная программа контроля (например, прерывание анимации по событию).

В таких случаях вы можете задать JavaScript-хуки на события перехода:

- before-enter
- enter
- after-enter
- enter-cancelled
- before-leave
- leave
- after-leave
- leave-cancelled (только в Vue 2; в Vue 3 используется onVnodeUnmounted и т.п.)

### Пример с JavaScript-анимацией

Смотрите, я покажу вам пример, где мы вручную меняем стиль элемента в JS.

```html
<template>
  <div>
    <button @click="show = !show">
      Показать / скрыть блок (JS-анимация)
    </button>

    <transition
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
    >
      <div
        v-if="show"
        ref="box"
        class="box"
      >
        Блок с JS-анимацией
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false) // Показывать ли блок

const box = ref(null) // Ссылка на элемент для анимации

const beforeEnter = (el) => {
  // Здесь мы задаем начальное состояние перед входом
  // el - это реальный DOM-элемент
  el.style.opacity = '0'
  el.style.transform = 'translateY(-20px)'
}

const enter = (el, done) => {
  // Эта функция вызывается, когда начинается анимация входа
  // done - колбек, который нужно вызвать по завершении анимации
  const duration = 300 // Длительность в миллисекундах

  // Начинаем переход
  el.style.transition = `all ${duration}ms ease-out`
  el.style.opacity = '1'
  el.style.transform = 'translateY(0)'

  // Таймер, чтобы вызвать done после завершения
  setTimeout(() => {
    // Очищаем transition, чтобы не влиял на дальнейшие изменения
    el.style.transition = ''
    done() // Сообщаем Vue, что анимация завершена
  }, duration)
}

const leave = (el, done) => {
  // Аналогично на выходе
  const duration = 300

  el.style.transition = `all ${duration}ms ease-in`
  el.style.opacity = '0'
  el.style.transform = 'translateY(-20px)'

  setTimeout(() => {
    el.style.transition = ''
    done()
  }, duration)
}
</script>

<style scoped>
.box {
  padding: 16px;
  background: #e0f3ff;
  border-radius: 4px;
}
</style>
```

Ключевой момент: когда вы используете JS-хуки, Vue ожидает, что вы вручную вызовете функцию done по завершении анимации, иначе Vue будет думать, что анимация никогда не заканчивается.

---

## Совмещение CSS и JS-анимаций

Иногда полезно комбинировать CSS и JS:

- CSS отвечает за основной визуальный эффект;
- JS — за дополнительную логику (например, динамический расчёт расстояния, состояния, запросы на сервер и т.д.).

Vue позволяет вам переключаться между режимами:

- если вы используете CSS-классы (enter/leave-active), Vue ориентируется на события CSS;
- если вы используете JS-хуки и явно указываете `:css="false"`, Vue не будет ждать CSS-событий и полностью доверит управление вам.

Давайте разберёмся на примере, когда мы используем только JS-анимацию и отключаем CSS.

```html
<template>
  <div>
    <button @click="visible = !visible">
      Переключить (только JS)
    </button>

    <transition
      :css="false"             <!-- Отключает CSS-анимацию -->
      @enter="enter"
      @leave="leave"
    >
      <div
        v-if="visible"
        class="block"
      >
        JS-only анимация
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)

const enter = (el, done) => {
  // Устанавливаем начальное состояние
  el.style.opacity = '0'

  // Плавно увеличиваем прозрачность через JS
  let opacity = 0
  const step = 0.05

  const tick = () => {
    opacity += step
    el.style.opacity = String(opacity)

    if (opacity < 1) {
      requestAnimationFrame(tick)
    } else {
      done() // Сообщаем, что анимация завершена
    }
  }

  requestAnimationFrame(tick)
}

const leave = (el, done) => {
  // Обратный процесс - уменьшаем opacity
  let opacity = 1
  const step = 0.05

  const tick = () => {
    opacity -= step
    el.style.opacity = String(opacity)

    if (opacity > 0) {
      requestAnimationFrame(tick)
    } else {
      done()
    }
  }

  requestAnimationFrame(tick)
}
</script>

<style scoped>
.block {
  padding: 16px;
  background: #ffe8cc;
  border-radius: 4px;
}
</style>
```

Здесь нет ни одного CSS-класса для анимации, всё делает JavaScript.

---

## Анимации при маршрутизации (Vue Router)

Очень частый сценарий — анимация перехода между страницами (компонентами маршрутов). Для этого вы так же используете transition или transition-group, но оборачиваете в него `<RouterView>`.

Теперь вы увидите, как это выглядит в коде.

```html
<template>
  <!-- Оборачиваем RouterView в transition -->
  <transition name="route-fade" mode="out-in">
    <!-- Важно: RouterView должен иметь key, зависящий от маршрута -->
    <RouterView :key="$route.fullPath" />
  </transition>
</template>

<style scoped>
.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
  transform: translateX(20px); /* Чуть сдвигаем вправо */
}

.route-fade-enter-to,
.route-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition: all 0.3s ease;
}
</style>
```

Атрибут mode="out-in" позволяет аккуратно завершить анимацию ухода предыдущего маршрута, прежде чем показывать новый. Это особенно полезно, если вы делаете слайдовые переходы или сложные эффекты.

---

## Оптимизация анимаций и производительность

### Что влияет на производительность

Анимации могут быть тяжёлыми, если:

- вы анимируете свойства, которые вызывают перерисовку и перерасчёт макета (например, `width`, `height`, `top`, `left`);
- одновременно анимируются десятки или сотни элементов;
- вы используете JS-анимации с тяжёлыми вычислениями внутри.

Чтобы интерфейс оставался отзывчивым, старайтесь:

- по возможности анимировать `transform` и `opacity` — они аппаратно ускоряются;
- избегать анимаций, которые требуют сложного пересчёта размеров и положения;
- группировать изменения стилей (использовать requestAnimationFrame при JS-анимациях, как в примере выше).

### Использование will-change

Когда вы планируете анимировать какое-то свойство, можно подсказать браузеру заранее, чтобы он подготовил оптимизацию. Для этого служит CSS-свойство `will-change`.

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  will-change: opacity; /* Подсказываем браузеру, что opacity будет меняться */
}
```

Но здесь важно не переусердствовать: постоянное использование will-change на большом числе элементов может, наоборот, ухудшить производительность.

---

## Анимация между состояниями одного компонента

Не всегда нужно анимировать появление/исчезновение элемента. Часто требуется плавно переходить между двумя состояниями одного и того же блока (например, менять высоту, цвет, размер шрифта).

В таких случаях вы можете:

- оборачивать компонент в transition и переключать `key`, чтобы Vue воспринимал его как разные экземпляры;
- или использовать CSS transition напрямую на изменяемых свойствах (без компонента transition).

Покажу вам подход с ключами.

```html
<template>
  <transition name="card" mode="out-in">
    <!-- Меняем key при переключении compact -->
    <div
      :key="compact ? 'compact' : 'full'"
      class="card"
      :class="{ compact }"
    >
      <h3>Карточка</h3>
      <p v-if="!compact">
        Расширенное описание карточки
      </p>
    </div>
  </transition>

  <button @click="compact = !compact">
    Переключить режим
  </button>
</template>

<script setup>
import { ref } from 'vue'

const compact = ref(false) // Режим отображения карточки
</script>

<style scoped>
.card {
  border: 1px solid #ddd;
  padding: 16px;
  margin-top: 8px;
  border-radius: 4px;
  background: #fff;
}

/* Компактная карточка */
.card.compact {
  padding: 8px;
}

/* Анимация появления/исчезновения разных состояний карточки */
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.card-enter-to,
.card-leave-from {
  opacity: 1;
  transform: scale(1);
}

.card-enter-active,
.card-leave-active {
  transition: all 0.2s ease;
}
</style>
```

Здесь мы заставляем Vue воспринимать компактный и полный вариант как разные компоненты благодаря разным ключам, и переход между ними анимируется так же, как смена элементов.

---

## Заключение

Возможности анимаций во Vue строятся вокруг нескольких ключевых идей:

- компонент transition для одиночных элементов;
- компонент transition-group для списков и перемещений;
- система CSS-классов, которая позволяет описывать анимации декларативно;
- JavaScript-хуки, которые дают полный контроль над процессом.

Вы можете использовать простые CSS-переходы для небольших эффектов, добавлять сложные keyframes-анимации, интегрировать сторонние JS-библиотеки и анимировать маршруты в приложении. Главное — понимать, какие классы и события Vue генерирует, и как правильно сочетать их с вашим стилем и логикой.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как анимировать смену текста в одном и том же теге без использования v-if и v-else

Можно использовать key на самом элементе, чтобы Vue воспринимал разные тексты как разные экземпляры:

```html
<transition name="fade" mode="out-in">
  <span :key="message">
    {{ message }}
  </span>
</transition>
```

Когда `message` меняется, key тоже меняется, и Vue применяет анимацию выхода для старого текста и входа для нового.

---

### Почему анимация не срабатывает, когда я меняю классы через :class

Компонент transition следит только за монтажом и размонтированием элементов, а не за изменением классов. Если вы хотите анимировать смену классов, используйте обычный CSS transition прямо на свойствах, которые меняются:

```css
.button {
  transition: background-color 0.2s ease;
}
.button.active {
  background-color: #008cff;
}
```

И переключайте `active` через :class. transition-компонент в этом случае не нужен.

---

### Как сделать, чтобы transition-group оборачивал элементы не в ul, а, например, в div

Укажите тег через атрибут tag:

```html
<transition-group name="fade" tag="div">
  <div v-for="item in items" :key="item.id">
    {{ item.text }}
  </div>
</transition-group>
```

По умолчанию transition-group рендерится как span, поэтому tag часто нужно задавать явно.

---

### Почему событие after-leave не вызывается, когда я использую v-show

При v-show элемент не удаляется из DOM, а только скрывается. Событие after-leave срабатывает, но видимый эффект может быть незаметен, если вы не задали корректные CSS-классы для leave. Убедитесь, что у вас есть:

```css
.my-name-leave-active { transition: opacity 0.2s; }
.my-name-leave-from { opacity: 1; }
.my-name-leave-to { opacity: 0; }
```

И не забывайте, что элемент остаётся в DOM после завершения анимации.

---

### Как задать разные скорости анимации для входа и выхода

Для этого можно использовать разные классы `*-enter-active` и `*-leave-active`:

```css
.fade-enter-active {
  transition: opacity 0.6s ease-out; /* Долгий вход */
}

.fade-leave-active {
  transition: opacity 0.2s ease-in;  /* Быстрый выход */
}
```

Vue применит соответствующий класс в зависимости от направления анимации, и вы получите разные длительности.