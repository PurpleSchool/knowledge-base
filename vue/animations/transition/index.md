---
metaTitle: Компонент transition во Vue 3
metaDescription: Разбор компонента transition во Vue 3 - как работать с анимациями появления и скрытия элементов и какие возможности он предоставляет разработчику
author: Олег Марков
title: Transition компонент во Vue 3 - подробный разбор
preview: Узнайте как работает компонент transition во Vue 3 - какие классы он добавляет как управлять длительностью и состояниями и как создавать плавные анимации в реальных интерфейсах
---

## Введение

Компонент transition во Vue 3 — это простой способ добавить плавные анимации появления и исчезновения элементов без сложной ручной настройки. Вы описываете, *когда* элемент должен появиться или скрыться, а Vue автоматически добавляет нужные CSS‑классы и следит за жизненным циклом анимации.

С его помощью вы можете:
- анимировать появление и исчезновение элементов по условию v-if / v-show
- управлять анимацией при монтировании и размонтировании компонентов
- использовать как CSS‑переходы, так и CSS‑анимации
- подключать JavaScript‑хуки для сложных случаев

Давайте разберем, как transition устроен изнутри и как применять его в реальных задачах.

## Базовое использование компонента transition

### Обертка вокруг одного элемента или компонента

Компонент transition работает как обертка вокруг одного дочернего узла. Смотрите, я покажу вам самый простой пример:

```html
<template>
  <button @click="show = !show">
    Переключить блок
  </button>

  <transition name="fade">
    <!-- Внутри transition должен быть один корневой элемент -->
    <p v-if="show">
      Этот текст появляется и исчезает с анимацией
    </p>
  </transition>
</template>

<script setup>
// Здесь мы создаем реактивное состояние show
import { ref } from 'vue'

const show = ref(true)
</script>

<style>
/* Начальное состояние при появлении */
.fade-enter-from {
  opacity: 0;
}
/* Конечное состояние при появлении */
.fade-enter-to {
  opacity: 1;
}
/* Промежуточный класс для самого перехода */
.fade-enter-active {
  transition: opacity 0.3s ease;
}

/* Начальное состояние при исчезновении */
.fade-leave-from {
  opacity: 1;
}
/* Конечное состояние при исчезновении */
.fade-leave-to {
  opacity: 0;
}
/* Промежуточный класс для исчезновения */
.fade-leave-active {
  transition: opacity 0.3s ease;
}
</style>
```

Как видите, вы:
1. Оборачиваете элемент в transition
2. Даёте ему имя (атрибут name)
3. Описываете набор CSS‑классов с этим префиксом

Vue сам будет добавлять эти классы в нужные моменты.

### Какие классы добавляет transition

По умолчанию для имени name="fade" используются такие классы:

- для появления (enter):
  - fade-enter-from — начальное состояние
  - fade-enter-active — активный переход
  - fade-enter-to — конечное состояние
- для исчезновения (leave):
  - fade-leave-from — начальное состояние
  - fade-leave-active — активный переход
  - fade-leave-to — конечное состояние

Давайте разберемся на временной шкале появления элемента:

1. Элемент монтируется, Vue добавляет классы:
   - fade-enter-from
   - fade-enter-active
2. На следующем кадре (после reflow) fade-enter-from заменяется на fade-enter-to
3. После окончания CSS‑transition или CSS‑animation:
   - Vue удаляет fade-enter-active и fade-enter-to

С исчезновением происходит аналогично, только используется группа leave‑классов.

## Управление классами и именами

### Атрибут name и пользовательские классы

Большинство задач вы решите с помощью name и стандартного набора классов. Но иногда нужно более точное управление. Тогда вы можете задать каждый класс отдельно:

```html
<transition
  enter-from-class="fade-in-start"
  enter-active-class="fade-in-active"
  enter-to-class="fade-in-end"
  leave-from-class="fade-out-start"
  leave-active-class="fade-out-active"
  leave-to-class="fade-out-end"
>
  <div v-if="visible">
    Кастомные классы для анимации
  </div>
</transition>
```

Комментарии к этому примеру:

```css
/* Здесь мы сами определяем имена классов без префикса name */

/* Появление */
.fade-in-start {
  opacity: 0;
  transform: translateY(10px);
}
.fade-in-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-in-end {
  opacity: 1;
  transform: translateY(0);
}

/* Исчезновение */
.fade-out-start {
  opacity: 1;
  transform: translateY(0);
}
.fade-out-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-out-end {
  opacity: 0;
  transform: translateY(10px);
}
```

Обратите внимание, что если вы задаете кастомные классы, Vue не будет использовать name для генерации стандартных.

### Ключевой момент: только один дочерний узел

Transition ожидает ровно одного дочернего элемента или компонента. Если нужно анимировать список, используется другой компонент — transition-group. Здесь я приведу пример неправильного использования:

```html
<!-- Так делать нельзя - два корневых элемента внутри transition -->
<transition name="fade">
  <p v-if="show">Первый абзац</p>
  <p v-if="show">Второй абзац</p>
</transition>
```

Чтобы исправить, оберните всё в одну обертку:

```html
<transition name="fade">
  <!-- Один корневой элемент -->
  <div v-if="show">
    <p>Первый абзац</p>
    <p>Второй абзац</p>
  </div>
</transition>
```

## CSS-переходы и CSS-анимации

### Использование CSS transition

Самый частый сценарий — обычный CSS‑transition. Он отлично подходит для плавного изменения простых свойств: opacity, transform, height и других.

```css
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
```

Здесь:
- в from / to вы описываете начальное и конечное состояние
- в active указываете сам переход (что и сколько длится)

### Использование CSS animation

Если вам нужны более сложные эффекты, можно использовать animation. В этом случае вы чаще всего задаете анимацию в active‑классах и почти не используете from/to.

```css
@keyframes bounce-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* Появление через animation */
.bounce-enter-active {
  animation: bounce-in 0.3s ease-out;
}

/* Исчезновение через animation */
.bounce-leave-active {
  animation: bounce-out 0.2s ease-in forwards;
}
```

Здесь я использую только active‑классы, потому что ключевые кадры уже описывают начальное и конечное состояние.

### Как Vue определяет, когда анимация закончилась

Vue смотрит на элемент и проверяет:
- есть ли у него transition-duration или animation-duration
- какую из них использовать, если есть обе

По умолчанию:
- если вы не указали type, Vue выберет то, у чего длительность больше — transition или animation
- вы можете явно указать type="transition" или type="animation"

```html
<transition name="fade" type="transition">
  <div v-if="show">...</div>
</transition>
```

Это полезно, если вы по какой-то причине сочетаете transition и animation в одном эффекте и хотите контролировать, по чему ориентироваться.

## Управление временем и ожиданием

### Атрибут duration

Иногда браузер может не совсем корректно посчитать время, особенно если есть несколько переходов на разных свойствах. В таких случаях полезно указать duration вручную.

```html
<transition
  name="fade"
  :duration="300"
>
  <div v-if="show">
    Явно задаем длительность 300 мс
  </div>
</transition>
```

Вы также можете указать разные значения для появления и исчезновения:

```html
<transition
  name="fade"
  :duration="{ enter: 200, leave: 500 }"
>
  <div v-if="show">
    Появляюсь быстрее чем исчезаю
  </div>
</transition>
```

Vue в этом случае не будет полагаться на CSS‑значения, а будет ждать заданное время.

### Атрибут appear — анимация при первом рендере

По умолчанию transition срабатывает только при динамических изменениях (например, переключении v-if). Если вы хотите, чтобы анимация была уже при первом появлении элемента на странице, используйте appear:

```html
<transition name="fade" appear>
  <div>
    Этот блок плавно появится при загрузке
  </div>
</transition>
```

Vue при этом будет использовать те же классы, что и для enter:
- fade-enter-from
- fade-enter-active
- fade-enter-to

Если нужно, вы можете задать отдельные классы для appear через специальные атрибуты (appear-class, appear-active-class и т.д.), но на практике это требуется не так часто.

### Атрибут appear с кастомными классами

Давайте посмотрим вариант с отдельными классами для первого появления:

```html
<transition
  appear
  appear-from-class="intro-from"
  appear-active-class="intro-active"
  appear-to-class="intro-to"
>
  <h1>Заголовок с особой стартовой анимацией</h1>
</transition>
```

В CSS вы можете описать, например, более длинную или «богатую» анимацию для первого рендера, отличающуюся от обычного enter.

## Работа с JavaScript-хуками

### Когда нужны JS‑хуки

CSS анимации покрывают большую часть задач. Но бывают ситуации, когда:
- нужно анимировать что-то, что не решается чистым CSS (например, скролл)
- анимация зависит от динамически вычисленных значений
- вы используете стороннюю JS‑библиотеку анимаций

В этих случаях вы можете использовать JS‑хуки компонента transition и (опционально) отключить автоматическое использование CSS.

### Основные хуки жизненного цикла

У компонента transition есть такие события‑хуки:

- before-enter(el)
- enter(el, done)
- after-enter(el)
- enter-cancelled(el)
- before-leave(el)
- leave(el, done)
- after-leave(el)
- leave-cancelled(el)

Здесь:
- el — DOM‑элемент
- done — коллбек, который нужно вызвать, когда JS‑анимация завершена

### Пример с JS‑анимацией

Покажу вам, как это реализовано на практике с использованием requestAnimationFrame:

```html
<template>
  <button @click="show = !show">
    Переключить
  </button>

  <transition
    :css="false"          <!-- Отключаем автоматические CSS-классы -->
    @before-enter="beforeEnter"
    @enter="enter"
    @leave="leave"
  >
    <div v-if="show" ref="box" class="box">
      JS-анимация высоты
    </div>
  </transition>
</template>

<script setup>
// Здесь мы используем JS-хуки для управления высотой
import { ref, nextTick } from 'vue'

const show = ref(false)
const box = ref(null)

const beforeEnter = (el) => {
  // Ставим начальную высоту 0
  el.style.height = '0px'
  el.style.overflow = 'hidden'
}

const enter = async (el, done) => {
  // Ждем, пока контент отрендерится, чтобы измерить высоту
  await nextTick()
  const targetHeight = el.scrollHeight

  // Запускаем простой JS-переход по высоте
  const duration = 300
  const start = performance.now()

  const animate = (time) => {
    const progress = Math.min((time - start) / duration, 1)
    el.style.height = `${targetHeight * progress}px`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Убираем лишние стили после завершения
      el.style.height = ''
      el.style.overflow = ''
      done() // Сообщаем Vue, что анимация закончилась
    }
  }

  requestAnimationFrame(animate)
}

const leave = (el, done) => {
  const startHeight = el.scrollHeight
  const duration = 300
  const start = performance.now()

  const animate = (time) => {
    const progress = Math.min((time - start) / duration, 1)
    el.style.height = `${startHeight * (1 - progress)}px`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      done()
    }
  }

  requestAnimationFrame(animate)
}
</script>

<style>
.box {
  background: #f4f4f4;
  padding: 8px;
  margin-top: 8px;
}
</style>
```

Обратите внимание:
- мы отключаем CSS атрибутом :css="false"
- Vue не будет ждать конца CSS‑перехода, а будет полагаться только на вызовы done
- очень важно не забывать вызывать done, иначе Vue «застрянет» в состоянии анимации

## Управление состоянием и reflow

### Использование key для разных состояний

Иногда под одним и тем же v-if вы хотите показывать разные элементы, и важно, чтобы Vue не переиспользовал старый DOM‑узел. Для этого служит атрибут key.

```html
<transition name="fade" mode="out-in">
  <p v-if="step === 1" key="step1">
    Шаг 1
  </p>
  <p v-else-if="step === 2" key="step2">
    Шаг 2
  </p>
  <p v-else key="step3">
    Шаг 3
  </p>
</transition>
```

Здесь:
- каждый шаг имеет свой key
- Vue понимает, что это разные элементы, и будет корректно анимировать уход одного и приход другого

### Атрибут mode: in-out и out-in

Mode определяет порядок, в котором происходят анимации:

- out-in: сначала уходит старый элемент, потом появляется новый
- in-out: сначала появляется новый, затем уходит старый

```html
<transition name="fade" mode="out-in">
  <component :is="currentComponent" />
</transition>
```

Если бы mode не был указан, оба состояния могли бы накладываться по времени и визуально вести себя не так предсказуемо.

Используйте:
- mode="out-in", когда вы хотите избегать пересечений (например, при переключении страниц)
- mode="in-out", когда важнее, чтобы новый контент появился как можно раньше

## v-if против v-show в контексте transition

### Анимация с v-if

v-if управляет монтированием и размонтированием элемента. Это значит:

- при переключении с false на true элемент создается, и запускается enter‑анимация
- при переключении с true на false элемент удаляется после leave‑анимации

```html
<transition name="fade">
  <div v-if="show">Я монтируюсь и размонтируюсь</div>
</transition>
```

v-if подходит:
- для тяжелых блоков, которые не должны постоянно висеть в DOM
- когда важен контроль за жизненным циклом компонента

### Анимация с v-show

v-show только управляет CSS‑свойством display. Элемент всегда остается в DOM, но становится невидимым.

```html
<transition name="fade">
  <div v-show="show">
    Я всегда в DOM, просто иногда скрыт
  </div>
</transition>
```

Особенности:
- будет анимироваться только смена display: none/block? Не совсем. На самом деле браузер не анимирует display, но Vue применяет классы enter/leave, и вы можете, например, анимировать opacity.
- элемент не размонтируется, поэтому внутреннее состояние (например, инпуты) сохранится

v-show удобно использовать:
- для вкладок, модалок и других элементов, которые часто показываются и скрываются
- когда нужно сохранять состояние между показами

## Типичные паттерны использования transition

### Плавное появление модального окна

Давайте посмотрим, что происходит в следующем примере модального окна:

```html
<template>
  <button @click="open = true">
    Открыть модалку
  </button>

  <!-- Задний фон -->
  <transition name="fade">
    <div
      v-if="open"
      class="backdrop"
      @click="open = false"
    ></div>
  </transition>

  <!-- Само окно -->
  <transition name="modal">
    <div v-if="open" class="modal">
      <h2>Заголовок</h2>
      <p>Текст модального окна</p>
      <button @click="open = false">Закрыть</button>
    </div>
  </transition>
</template>

<script setup>
// Здесь мы управляем состоянием модального окна
import { ref } from 'vue'
const open = ref(false)
</script>

<style>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

/* Плавный фон */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

/* Окно */
.modal {
  position: fixed;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
}

/* Анимация окна */
.modal-enter-from {
  opacity: 0;
  transform: translate(-50%, -45%);
}
.modal-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%);
}
.modal-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%);
}
.modal-leave-to {
  opacity: 0;
  transform: translate(-50%, -55%);
}
.modal-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
</style>
```

Здесь вы видите:
- раздельные transition для фона и окна
- использование разных эффектов для enter и leave
- сохранение чистой логики в шаблоне и перенос анимаций в CSS

### Плавное раскрытие/сворачивание блоков

Покажу вам пример аккордеона, где плавно анимируется высота содержимого:

```html
<template>
  <button @click="open = !open">
    {{ open ? 'Свернуть' : 'Развернуть' }}
  </button>

  <transition
    name="collapse"
    @before-enter="beforeEnter"
    @enter="onEnter"
    @before-leave="beforeLeave"
    @leave="onLeave"
  >
    <div v-show="open" ref="panel" class="panel">
      <p>Содержимое аккордеона</p>
      <p>Еще немного текста</p>
    </div>
  </transition>
</template>

<script setup>
// Здесь мы комбинируем CSS-классы и JS-хуки
import { ref } from 'vue'

const open = ref(false)
const panel = ref(null)

const beforeEnter = (el) => {
  el.style.height = '0px'
  el.style.overflow = 'hidden'
}

const onEnter = (el) => {
  const h = el.scrollHeight
  el.style.height = h + 'px'
}

const beforeLeave = (el) => {
  el.style.height = el.scrollHeight + 'px'
  el.style.overflow = 'hidden'
}

const onLeave = (el) => {
  // Запускаем CSS-переход высоты
  void el.offsetHeight // форсируем reflow
  el.style.height = '0px'
}
</script>

<style>
.panel {
  background: #f7f7f7;
  padding: 8px 12px;
}

/* Здесь transition задаем только для высоты */
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.25s ease;
}
</style>
```

Здесь интересный момент:
- высота рассчитывается динамически через scrollHeight
- JS‑хуки используют только inline‑стили, а плавность задается в CSS

## Частые ошибки и как их избегать

### Ошибка: отсутствуют CSS‑классы

Ситуация: вы добавили transition, но анимации нет. Обычно причина в том, что CSS‑классы не определены или имя не совпадает.

Проверьте:
- атрибут name в transition
- префикс классов в CSS
- нет ли опечаток в enter/leave‑классах

### Ошибка: несколько дочерних элементов

Если внутри transition более одного дочернего узла, Vue покажет предупреждение, а анимация будет работать некорректно или не будет работать вообще.

Решение: оборачивайте несколько элементов в один контейнер (div, section или фрагмент с одним элементом внутри).

### Ошибка: не вызывается done в JS‑хуках

Если вы используете JS‑анимации и не вызываете done, Vue так и будет считать, что анимация не закончилась.

Рекомендация:
- всегда оборачивайте логику анимации таким образом, чтобы done был вызван в любом сценарии (успех, отмена, ошибка)
- для отмены анимации (enter-cancelled / leave-cancelled) очищайте таймеры и requestAnimationFrame

### Ошибка: конфликт нескольких transition

Если вы оборачиваете один и тот же элемент несколькими transition (например, через вложенные компоненты), классы могут конфликтовать.

Лучше спроектировать структуру так, чтобы каждый визуальный блок имел один «основной» transition‑контроллер.

## Заключение

Компонент transition во Vue 3 — это не просто декоративное дополнение. Он напрямую влияет на то, насколько отзывчивым и понятным для пользователя кажется интерфейс. Важная особенность transition в том, что вы отделяете логику отображения (v-if, v-show, смена компонентов) от самой анимации, а Vue берет на себя управление классами и жизненным циклом элементов.

Вы можете:
- использовать простой CSS‑transition для большинства задач
- подключать CSS‑animation, когда требуется более богатый эффект
- при необходимости переходить к JS‑хукам, если анимация зависит от вычислений или сторонних библиотек
- управлять временем, типом и порядком анимаций через атрибуты компонента

Если держать в голове базовый набор классов (enter-from / enter-active / enter-to, leave-from / leave-active / leave-to) и понимать, как они применяются во времени, настройка даже сложных интерфейсных переходов станет предсказуемой и контролируемой.

## Частозадаваемые технические вопросы

### 1. Как анимировать смену текста внутри одного и того же элемента через transition?

Transition работает по узлам, а не по тексту внутри. Если вы хотите анимировать смену содержимого, создайте разные элементы с разными key:

```html
<transition name="fade" mode="out-in">
  <span :key="message">{{ message }}</span>
</transition>
```

Здесь каждый новый message порождает новый span, и Vue анимирует уход старого и появление нового.

### 2. Почему анимация с высотой работает рывками или не срабатывает?

Проблема обычно в том, что высота задается auto. Браузер не умеет анимировать auto. Решение — анимировать числовые значения: в JS‑хуках вычисляйте scrollHeight и задавайте height в пикселях, как в примере с аккордеоном, а потом сбрасывайте стиль, чтобы блок снова мог подстраиваться по контенту.

### 3. Как запустить анимацию только при скрытии, но не при первом появлении?

Используйте флаг, чтобы пропустить первый enter:

```html
<transition name="fade" v-if="mounted">
  <div v-if="visible">...</div>
</transition>
```

В setup сначала ставьте mounted = false, потом в onMounted переведите в true. Либо управляйте через условие и классы: для первого показа не добавляйте классы enter.

### 4. Как использовать transition с keep-alive компонентами?

Оберните динамический компонент в оба компонента — keep-alive и transition:

```html
<transition name="fade" mode="out-in">
  <keep-alive>
    <component :is="currentView" />
  </keep-alive>
</transition>
```

Так кэшированный компонент не размонтируется, но при переключении между ними будут применяться анимации появления/исчезновения.

### 5. Как отлаживать, какие классы transition реально добавляет?

Откройте DevTools браузера и наблюдайте за элементом в момент переключения состояния. Vue по очереди добавляет/удаляет классы enter-from, enter-active, enter-to и соответствующие leave‑классы. Если классы не появляются, проверьте: корректно ли задан name, есть ли v-if/v-show, не отключен ли CSS атрибутом :css="false".