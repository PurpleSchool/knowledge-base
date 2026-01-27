---
metaTitle: JavaScript хуки анимаций animation-hooks
metaDescription: Подробный разбор JavaScript хуков анимаций animation-hooks - как перехватывать жизненный цикл анимаций управлять состоянием и оптимизировать производительность
author: Олег Марков
title: JavaScript хуки анимаций animation-hooks
preview: Узнайте как работать с JavaScript хуками анимаций animation-hooks - от базовых событий CSS и Web Animations API до создания собственных абстракций и оптимизации
---

## Введение

Хуки анимаций в JavaScript — это подход и набор техник, которые позволяют «подцепиться» к жизненному циклу анимации и управлять ей: запускать код до начала, во время и после завершения анимации, реагировать на отмену и повтор, синхронизировать несколько эффектов и следить за состоянием интерфейса.

Когда вы начинаете делать не просто одноразовый `fade-in`, а полноценные переходы страниц, сложные hover-эффекты, анимации появления модальных окон и списков, становится важно:

- понимать, когда анимация началась и когда закончилась;
- уметь аккуратно отменять или переносить анимации;
- не «ломать» верстку и состояние приложения, если пользователь быстро кликает по интерфейсу;
- не тратить ресурсы впустую и не блокировать основной поток.

Давайте разберем, какие есть «хуки» в браузере для анимаций, как их использовать на «чистом» JavaScript и как на их основе строить свои удобные абстракции уровня `animation-hooks`.

---

## Базовые механизмы хуков анимаций в браузере

### CSS-анимации и их события

Самый простой вариант — использовать встроенные события для CSS анимаций и переходов.

#### События CSS Animation

Смотрите, я покажу вам список ключевых событий:

- `animationstart` — анимация только что началась;
- `animationiteration` — закончилась итерация анимации и началась следующая;
- `animationend` — анимация завершилась (последняя итерация);
- `animationcancel` — анимация была отменена.

Пример: отслеживаем начало и конец CSS-анимации.

```html
<div class="box animated"></div>

<style>
  .box {
    width: 100px;
    height: 100px;
    background: coral;
  }

  /* Класс animated запускает анимацию */
  .animated {
    animation: move 2s ease-in-out forwards;
  }

  @keyframes move {
    from { transform: translateX(0); }
    to   { transform: translateX(200px); }
  }
</style>

<script>
// Получаем элемент, который анимируется
const box = document.querySelector('.box');

// Хук "до" завершения анимации - срабатывает в начале
box.addEventListener('animationstart', (event) => {
  // Здесь можно, например, заблокировать кнопки интерфейса
  console.log('Анимация началась', event.animationName);
});

// Хук на каждую итерацию, если анимация повторяется
box.addEventListener('animationiteration', (event) => {
  console.log('Новая итерация анимации', event.elapsedTime);
});

// Хук "после" завершения анимации
box.addEventListener('animationend', (event) => {
  // Здесь можно разблокировать элементы или сменить состояние UI
  console.log('Анимация завершена');
});

// Хук при отмене анимации (например, если класс удалили)
box.addEventListener('animationcancel', () => {
  console.log('Анимация была отменена');
});
</script>
```

Обратите внимание, как просто мы подключаемся к жизненному циклу анимации: начало, итерации, завершение и отмена.

#### События CSS Transition

Для переходов (`transition`) есть похожие события:

- `transitionrun` — переход поставлен в очередь;
- `transitionstart` — переход реально стартовал;
- `transitionend` — переход завершился;
- `transitioncancel` — переход был отменен.

Пример:

```html
<button id="toggle">Переключить</button>
<div class="panel"></div>

<style>
  .panel {
    width: 100px;
    height: 100px;
    background: lightblue;
    transition: transform 0.5s ease, opacity 0.5s ease;
    transform: translateY(0);
    opacity: 1;
  }

  .panel.hidden {
    transform: translateY(-20px);
    opacity: 0;
  }
</style>

<script>
const panel = document.querySelector('.panel');
const btn = document.querySelector('#toggle');

btn.addEventListener('click', () => {
  // Переключаем класс, который запускает CSS-переход
  panel.classList.toggle('hidden');
});

panel.addEventListener('transitionstart', (event) => {
  console.log('Переход начался для свойства', event.propertyName);
});

panel.addEventListener('transitionend', (event) => {
  console.log('Переход завершен для свойства', event.propertyName);
});

panel.addEventListener('transitioncancel', (event) => {
  console.log('Переход отменен для свойства', event.propertyName);
});
</script>
```

Такие события — уже по сути «хуки» анимаций: вы подключаете свой код к конкретным стадиям.

---

### Web Animations API как источник богатых хуков

Если вам мало событий CSS, можно перейти к Web Animations API (WAAPI). Он дает прямой объект `Animation`, у которого есть:

- свойства `playState`, `currentTime`, `playbackRate`;
- методы `play`, `pause`, `reverse`, `cancel`, `finish`;
- промисы `finished` и `ready`.

Все это можно использовать как гибкую систему хуков.

#### Базовый пример WAAPI

Давайте разберемся на примере:

```html
<div class="box-waapi"></div>

<style>
  .box-waapi {
    width: 80px;
    height: 80px;
    background: mediumseagreen;
  }
</style>

<script>
const box = document.querySelector('.box-waapi');

// Создаем анимацию через WAAPI
const animation = box.animate(
  [
    // Ключевые кадры
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(200px)', opacity: 0.3 }
  ],
  {
    duration: 1500,   // Длительность в миллисекундах
    easing: 'ease-in-out',
    iterations: 2,    // Количество повторений
    direction: 'alternate' // Туда-сюда
  }
);

// Хук - когда анимация готова к проигрыванию
animation.ready.then(() => {
  console.log('Анимация подготовлена и может быть запущена');
});

// Хук - когда анимация полностью завершилась
animation.finished.then(() => {
  console.log('Анимация полностью завершила все итерации');
});

// Пример управления из кода
setTimeout(() => {
  // Ставим на паузу через 700 мс
  animation.pause();
  console.log('Анимация остановлена. Состояние', animation.playState);

  setTimeout(() => {
    // Снова продолжаем
    animation.play();
    console.log('Анимация продолжена');
  }, 700);
}, 700);
</script>
```

Здесь `ready` и `finished` выступают как промис-хуки, а методы `play`, `pause`, `cancel` позволяют вам контролировать состояние из кода и строить свою логику.

---

## Создание собственных «хуков» анимаций на чистом JS

Теперь давайте перейдем от встроенных событий к пользовательским абстракциям. Под «JavaScript хуки анимаций» часто понимают функции-обертки, которые:

- принимают параметры анимации и колбэки;
- настраивают анимацию;
- автоматически подписываются на события;
- вызывают ваши колбэки в нужные моменты.

### Простой хук для CSS-анимации

Представьте, что вы хотите просто вызвать анимацию и получить удобный набор событий в одном месте. Смотрите, я покажу вам пример утилиты:

```js
// Простая утилита-хук для CSS анимаций
function animateWithHooks(element, animationClass, {
  onStart,
  onIteration,
  onEnd,
  onCancel
} = {}) {
  // Обертки вокруг обработчиков, чтобы потом их снять
  const handleAnimationStart = (event) => {
    if (event.target !== element) return; // Игнорируем всплытие
    onStart?.(event);
  };

  const handleAnimationIteration = (event) => {
    if (event.target !== element) return;
    onIteration?.(event);
  };

  const handleAnimationEnd = (event) => {
    if (event.target !== element) return;
    onEnd?.(event);
    cleanup();
  };

  const handleAnimationCancel = (event) => {
    if (event.target !== element) return;
    onCancel?.(event);
    cleanup();
  };

  function cleanup() {
    // Снимаем все обработчики после завершения или отмены
    element.removeEventListener('animationstart', handleAnimationStart);
    element.removeEventListener('animationiteration', handleAnimationIteration);
    element.removeEventListener('animationend', handleAnimationEnd);
    element.removeEventListener('animationcancel', handleAnimationCancel);
    // И удаляем класс, чтобы вернуть исходное состояние
    element.classList.remove(animationClass);
  }

  // Вешаем обработчики
  element.addEventListener('animationstart', handleAnimationStart);
  element.addEventListener('animationiteration', handleAnimationIteration);
  element.addEventListener('animationend', handleAnimationEnd);
  element.addEventListener('animationcancel', handleAnimationCancel);

  // Запускаем анимацию, добавляя класс
  element.classList.add(animationClass);

  // Возвращаем функцию для принудительной отмены
  return () => {
    element.dispatchEvent(new AnimationEvent('animationcancel'));
  };
}
```

Теперь вы увидите, как это выглядит в коде при использовании:

```js
const box = document.querySelector('.box');

const cancel = animateWithHooks(box, 'shake', {
  onStart() {
    console.log('Старт анимации shake');
  },
  onEnd() {
    console.log('shake закончилась');
  },
  onCancel() {
    console.log('shake отменена');
  }
});

// Пример принудительной отмены
setTimeout(() => {
  cancel(); // Вызываем хук отмены
}, 500);
```

Здесь вы получаете удобный «хук» вокруг CSS-анимации и можете контролировать ее жизненный цикл.

---

### Хук на основе Web Animations API

Теперь давайте посмотрим, как сделать подобную обертку для WAAPI.

```js
// Хук для создания и управления анимацией через WAAPI
function createAnimationHook(element, keyframes, options = {}) {
  const {
    onReady,
    onFinish,
    onCancel,
    autoPlay = true
  } = options;

  // Создаем объект анимации
  const animation = element.animate(keyframes, options);

  // Хук готовности
  animation.ready.then((anim) => {
    onReady?.(anim);
  });

  // Хук завершения
  animation.finished
    .then((anim) => {
      onFinish?.(anim);
    })
    .catch((error) => {
      // Попадаем сюда, если анимация была отменена
      if (onCancel) {
        onCancel(error);
      }
    });

  if (!autoPlay) {
    // Если autoPlay false — ставим на паузу сразу
    animation.pause();
  }

  // Возвращаем API управления
  return {
    animation,
    play: () => animation.play(),
    pause: () => animation.pause(),
    reverse: () => animation.reverse(),
    cancel: () => animation.cancel(),
    setTime: (time) => {
      // Устанавливаем конкретное время анимации
      animation.currentTime = time;
    }
  };
}
```

Использование:

```js
const circle = document.querySelector('.circle');

const animHook = createAnimationHook(
  circle,
  [
    { transform: 'scale(1)', background: 'blue' },
    { transform: 'scale(1.3)', background: 'red' }
  ],
  {
    duration: 1000,
    iterations: Infinity,
    direction: 'alternate',
    autoPlay: false,
    onReady(animation) {
      console.log('Анимация инициализирована', animation.playState);
    },
    onFinish() {
      console.log('Анимация полностью завершена');
    },
    onCancel() {
      console.log('Анимация отменена через cancel()');
    }
  }
);

// Управляем анимацией программно
setTimeout(() => {
  animHook.play(); // Запускаем анимацию
}, 300);

setTimeout(() => {
  animHook.pause(); // Ставим на паузу
}, 1300);

setTimeout(() => {
  animHook.cancel(); // Полностью отменяем
}, 2500);
```

Обратите внимание, как этот фрагмент кода дает вам унифицированный интерфейс управления и удобные хуки `onReady`, `onFinish`, `onCancel`.

---

## Хуки анимаций в SPA и фреймворках

В приложениях на React, Vue, Svelte и других фреймворках идея «хуков анимаций» особенно удобна. Вы часто хотите:

- запускать анимации при монтировании и размонтировании компонентов;
- синхронизировать переходы между страницами;
- анимировать изменение списка (добавление/удаление элементов).

Давайте посмотрим, как можно спроецировать общую идею `animation-hooks` на разные контексты.

### Реактивный подход к хукам: пример на уровне паттерна

Даже без конкретного фреймворка можно мыслить так:

1. Есть «состояние» видимости (`visible`).
2. Есть анимация показа (`enter`) и скрытия (`leave`).
3. Компонент должен:
   - при `visible = true` играть `enter`;
   - при `visible = false` играть `leave`, а после завершения — реально скрывать элемент из DOM.

Смотрите, я покажу вам простую функцию, реализующую такой паттерн через события CSS:

```js
function useVisibilityAnimation(element, {
  enterClass,
  leaveClass,
  initiallyVisible = false
}) {
  let visible = initiallyVisible;
  let isAnimating = false;

  function show() {
    if (visible || isAnimating) return;
    isAnimating = true;
    visible = true;

    element.classList.remove(leaveClass);
    element.classList.add(enterClass);
    element.style.display = ''; // Показываем элемент

    const onEnd = (event) => {
      if (event.target !== element) return;
      element.removeEventListener('animationend', onEnd);
      isAnimating = false;
      // Очищаем класс анимации, оставляя конечное состояние
      element.classList.remove(enterClass);
    };

    element.addEventListener('animationend', onEnd);
  }

  function hide() {
    if (!visible || isAnimating) return;
    isAnimating = true;

    element.classList.remove(enterClass);
    element.classList.add(leaveClass);

    const onEnd = (event) => {
      if (event.target !== element) return;
      element.removeEventListener('animationend', onEnd);
      isAnimating = false;
      visible = false;
      element.classList.remove(leaveClass);
      element.style.display = 'none'; // Прячем элемент после анимации
    };

    element.addEventListener('animationend', onEnd);
  }

  // Возвращаем методы управления
  return { show, hide, isVisible: () => visible };
}
```

Применение:

```js
const modal = document.querySelector('.modal');

const { show, hide, isVisible } = useVisibilityAnimation(modal, {
  enterClass: 'modal-enter',
  leaveClass: 'modal-leave',
  initiallyVisible: false
});

// Здесь вы можете вызывать show() и hide()
// при кликах по кнопкам или изменении состояния приложения
```

Такая функция уже очень похожа на «хук»: она инкапсулирует всю механику анимации и предоставляет чистое API.

---

## Дизайн собственных API хуков анимаций

Чтобы ваши `animation-hooks` были удобны в реальных проектах, полезно продумать несколько моментов.

### Структура параметров

Хуки анимаций часто принимают:

- ссылку на элемент или селектор;
- тип анимации или ключевые кадры;
- опции (длительность, задержка, easing и т.д.);
- колбэки жизненного цикла (onStart, onUpdate, onEnd, onCancel);
- флаги (автозапуск, повторение, нужно ли скрывать элемент после).

Давайте посмотрим, как это может выглядеть в виде «универсального» объекта:

```js
const config = {
  element: document.querySelector('.item'),
  type: 'css',           // или 'waapi'
  animationClass: 'fade-in', // для CSS
  keyframes: [],         // для WAAPI
  options: {
    duration: 500,
    easing: 'ease-out'
  },
  autoPlay: true,
  hideOnEnd: false,
  hooks: {
    onStart() {},
    onUpdate(progress) {}, // полезно для requestAnimationFrame
    onEnd() {},
    onCancel() {}
  }
};
```

На основе такой конфигурации можно построить универсальный хук, который внутри решает, какой именно механизм анимации использовать и какие события подписывать.

---

## Хуки анимаций через requestAnimationFrame

Пока мы смотрели на CSS и WAAPI, но у вас всегда остается вариант делать полностью кастомную анимацию через `requestAnimationFrame`. Там хуки еще более явные, потому что вы полностью контролируете процесс.

### Простейший аниматор с хуками

Покажу вам, как это реализовано на практике:

```js
// Универсальная функция анимации со своими хуками
function animate({ duration, timing, draw, onStart, onEnd, onCancel }) {
  let start = null;
  let frameId = null;
  let cancelled = false;

  // Хук старта
  onStart?.();

  function frame(timestamp) {
    if (!start) {
      // Фиксируем момент старта
      start = timestamp;
    }

    const timeFraction = Math.min((timestamp - start) / duration, 1);
    const progress = timing(timeFraction); // Функция сглаживания

    // Хук обновления — здесь вызывается draw
    draw(progress);

    if (timeFraction < 1 && !cancelled) {
      frameId = requestAnimationFrame(frame);
    } else {
      if (!cancelled) {
        onEnd?.(); // Хук завершения
      }
    }
  }

  frameId = requestAnimationFrame(frame);

  // Возвращаем функцию отмены
  return () => {
    cancelled = true;
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    onCancel?.(); // Хук отмены
  };
}
```

Использование:

```js
const box = document.querySelector('.box-rafa');

const cancel = animate({
  duration: 1000,
  // Линейная функция изменения прогресса
  timing: (t) => t,
  // Функция отрисовки - двигаем элемент
  draw(progress) {
    box.style.transform = `translateX(${progress * 300}px)`; // Движение по оси X
  },
  onStart() {
    console.log('Кастомная анимация началась');
  },
  onEnd() {
    console.log('Кастомная анимация завершилась');
  },
  onCancel() {
    console.log('Кастомная анимация отменена');
  }
});

// Пример отмены
setTimeout(() => {
  cancel();
}, 500);
```

Такой подход полезен, когда CSS/WAAPI не дают нужной гибкости (комбинации нескольких свойств, специальные кривые easing, интеграция с физическими моделями).

---

## Управление конкурентными анимациями

Одна из главных задач, где особенно помогают хуки, — управление конфликтами и конкуренцией анимаций.

### Проблема «двоится» анимация

Представьте, у вас кнопка, по клику на которую панель должна плавно открываться и закрываться. Если пользователь кликает очень быстро, могут наложиться несколько анимаций:

- панель еще не открылась, а уже прилетела команда закрыть;
- открытие и закрытие используют разные классы, и браузер может «потерять» нужное состояние.

Хуки помогают решить это так:

1. Хранить состояние, идет ли анимация.
2. При получении нового события (например, нового клика):
   - если анимация в процессе, отменить ее;
   - запустить новую анимацию с нуля;
   - корректно обработать ее завершение через колбэк `onEnd` или событие `animationend`.

Давайте посмотрим, что происходит в следующем примере:

```js
function createToggleAnimation(element, {
  openClass,
  closeClass
}) {
  let isOpen = false;
  let isAnimating = false;
  let currentCancel = null;

  function play(open) {
    // Если текущее состояние уже такое - пропускаем
    if (isOpen === open && !isAnimating) return;

    // Отменяем предыдущую анимацию, если она еще идет
    if (currentCancel) {
      currentCancel();
      currentCancel = null;
    }

    const animationClass = open ? openClass : closeClass;

    isAnimating = true;

    currentCancel = animateWithHooks(element, animationClass, {
      onStart() {
        console.log('toggle анимация start', open ? 'open' : 'close');
      },
      onEnd() {
        isAnimating = false;
        isOpen = open;
        currentCancel = null;
        console.log('toggle анимация end');
      },
      onCancel() {
        isAnimating = false;
        currentCancel = null;
        console.log('toggle анимация cancel');
      }
    });
  }

  return {
    open: () => play(true),
    close: () => play(false),
    toggle: () => play(!isOpen),
    isOpen: () => isOpen
  };
}
```

Здесь мы комбинируем нашу предыдущую функцию `animateWithHooks` и небольшую логику управления состоянием, чтобы избежать конфликтов.

---

## Производительность и оптимизация в animation-hooks

Когда вы строите свои хуки для анимаций, важно учитывать производительность.

### Что учитывать

1. **Количество активных анимаций.**  
   Если у вас сотни параллельных анимаций через `requestAnimationFrame` — это нагрузка на основной поток.

2. **Свойства, которые вы анимируете.**  
   Анимации `transform` и `opacity` гораздо легче для браузера, чем, например, `width` или `left`. В хуках стоит стараться использовать именно их.

3. **Очистка обработчиков событий.**  
   Если вы подписываетесь на `animationend` или `transitionend` в хуке, не забывайте отписываться, чтобы не было утечек памяти.

4. **Синхронизация с `prefers-reduced-motion`.**  
   Пользователь может попросить «минимум анимаций». Хуки должны уметь учитывать это.

### Пример: уважение prefers-reduced-motion

Давайте посмотрим простой пример проверки:

```js
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Функция-хук, которая учитывает настройку пользователя
function animateRespectingMotion(element, keyframes, options) {
  if (prefersReducedMotion) {
    // Если пользователь просит уменьшить анимации,
    // просто применяем конечное состояние без анимации.
    const lastFrame = keyframes[keyframes.length - 1];
    Object.assign(element.style, lastFrame);
    return {
      play() {},
      pause() {},
      cancel() {}
    };
  }

  // В обычном случае используем наш WAAPI-хук
  return createAnimationHook(element, keyframes, options);
}
```

Такой подход позволяет реализовать в хуках более осознанное поведение, а не только визуальные эффекты.

---

## Взаимодействие хуков анимаций с состоянием приложения

Часто анимация — это не самоцель, а часть «сценария» интерфейса. Например:

- показываем лоадер;
- ждем завершения анимации;
- после окончания меняем состояние и загружаем данные.

Здесь промисы и колбэки жизненного цикла очень удобны.

### Пример сценария: показать, анимировать, потом загрузить

```js
async function showLoaderAndFetch(element, url) {
  // Сначала показываем loader с анимацией
  const { animation } = createAnimationHook(
    element,
    [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    {
      duration: 300,
      easing: 'ease-out',
      iterations: 1,
      autoPlay: true
    }
  );

  // Ждем завершения появления
  await animation.finished;

  // После анимации делаем запрос
  const response = await fetch(url);
  const data = await response.json();

  // Можно запустить анимацию скрытия
  const hideAnim = element.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 }
    ],
    {
      duration: 200,
      easing: 'ease-in'
    }
  );

  await hideAnim.finished;

  // После всего обновляем содержимое
  return data;
}
```

Здесь вы связываете «визуальный» сценарий и «данные» через промисы от анимаций, что делает поведение предсказуемым.

---

## Как строить свои библиотеки animation-hooks

Если вы захотите оформить этот подход в небольшую библиотеку, полезно:

1. **Определить основной use-case.**  
   Например: «анимация появления и скрытия элементов», «управление сложными последовательностями», «синхронизация скролла и анимации».

2. **Выбрать основной движок.**  
   CSS-события, WAAPI, requestAnimationFrame или их комбинация.

3. **Сделать четкое, простое API.**  
   Например:
   - `useEnterLeaveAnimation(element, config)`
   - `useSequenceAnimation(steps)`
   - `useScrollAnimation(triggerElement, options)`

4. **Продумать хуки ошибок и отмены.**  
   Чтобы в реальных условиях (броузер закешировал вкладку, пользователь ушел, элемент размонтировали) все вело себя устойчиво.

---

## Заключение

Под «JavaScript хуками анимаций» имеет смысл понимать не только события браузера, но и ваши собственные абстракции, которые:

- подцепляются к жизненному циклу анимации;
- дают предсказуемые колбэки и промисы (onStart, onEnd, onCancel, onReady, onUpdate);
- инкапсулируют детали (CSS-анимации, Web Animations API, requestAnimationFrame);
- помогают синхронизировать анимации со состоянием приложения и пользовательскими действиями.

Используя события CSS-анимаций и переходов, объекты `Animation` из WAAPI и свою логику управления, вы можете построить надежную систему `animation-hooks`, которая будет понятна и вам, и вашей команде, и не превратится в набор разрозненных таймеров и магических классов.

---

## Частозадаваемые технические вопросы по теме animation-hooks

### 1. Как корректно работать с хуками анимаций, если элемент может быть удален из DOM во время анимации

Если есть вероятность, что элемент размонтируют (например, в SPA), всегда:

1) Храните ссылки на отмену анимаций и отписку от событий.  
2) В хендлере размонтирования вызывайте `cancel()` у WAAPI-анимаций и `removeEventListener` у CSS-событий.  
3) Проверяйте, что элемент еще в документе, перед тем как менять его стили:

```js
if (!document.body.contains(element)) return; // Элемент уже удален
```

Это предотвратит ошибки доступа к `null` и утечки памяти.

---

### 2. Как сделать общий хук, который умеет работать и с transition, и с animation

Можно создать обертку, которая подписывается и на `transitionend`, и на `animationend`, и ждет, пока не завершится хотя бы одно:

```js
function onVisualEffectEnd(element, callback) {
  let called = false;

  function handler(event) {
    if (event.target !== element || called) return;
    called = true;
    element.removeEventListener('transitionend', handler);
    element.removeEventListener('animationend', handler);
    callback(event);
  }

  element.addEventListener('transitionend', handler);
  element.addEventListener('animationend', handler);
}
```

Такой хук полезен, когда не важно, чем именно сделан эффект, но нужно знать, что он закончился.

---

### 3. Почему событие transitionend иногда не срабатывает и как это учитывать в хуках

Причины:

- свойство реально не изменилось (начальное и конечное значение одинаковы);
- элемент скрыт `display: none` в момент запуска;
- длительность перехода равна нулю.

В хуке можно добавить «страховку» через таймер немного дольше длительности:

```js
function onTransitionEndWithFallback(element, timeout, callback) {
  let finished = false;

  const onEnd = () => {
    if (finished) return;
    finished = true;
    element.removeEventListener('transitionend', onEnd);
    callback();
  };

  element.addEventListener('transitionend', onEnd);

  setTimeout(onEnd, timeout + 50); // Фолбек, если событие не пришло
}
```

---

### 4. Как передать в хуке текущее значение прогресса анимации для синхронизации с другим эффектом

Для WAAPI можно использовать `animation.currentTime / animation.effect.getComputedTiming().duration`. Для `requestAnimationFrame` прогресс уже есть в вашем `draw(progress)`. Для CSS-анимаций прогресс напрямую недоступен, но можно:

- дублировать анимацию на JS через `requestAnimationFrame`;
- или использовать CSS-переменные и постепенно менять их из JS.

---

### 5. Как синхронизировать несколько анимаций, чтобы они стартовали и завершались одновременно

Используйте один управляющий хук, который:

1) Создает несколько анимаций (CSS или WAAPI).  
2) Ставит их на `pause` сразу после создания (в WAAPI через `autoPlay: false`).  
3) Когда все готовы, одновременно вызывает `play()` у каждой.  
4) Ждет `Promise.all([...animations.map(a => a.finished)])`, чтобы узнать момент общего завершения.  

Такой паттерн удобно оформить в функцию `createGroupAnimation(animationsConfig)`, которая возвращает `play()` и промис завершения группы.