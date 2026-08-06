---
metaTitle: "requestAnimationFrame в JavaScript — плавные анимации"
metaDescription: "Как использовать requestAnimationFrame для создания плавных анимаций в браузере: принцип работы, примеры, отличия от setTimeout и cancelAnimationFrame."
author: "Антон Ларичев"
title: "requestAnimationFrame — плавные анимации в JavaScript"
preview: "Разбираем requestAnimationFrame: как работает, чем отличается от setTimeout и как создавать плавные анимации без лишней нагрузки на браузер."
---

## Что такое requestAnimationFrame

`requestAnimationFrame` — это браузерный API, который позволяет выполнять функцию перед следующей перерисовкой экрана. Браузер сам определяет момент вызова, синхронизируясь с частотой обновления дисплея — как правило, 60 раз в секунду (60 FPS).

Метод принимает колбэк и возвращает числовой идентификатор запроса, который можно использовать для отмены:

```javascript
const id = requestAnimationFrame(callback);
```

Колбэк получает один аргумент — метку времени в миллисекундах, отсчитываемую от момента открытия страницы (тот же формат, что и `performance.now()`):

```javascript
requestAnimationFrame((timestamp) => {
  console.log(timestamp); // например, 1234.56
});
```

## Почему не setTimeout и setInterval

До появления `requestAnimationFrame` разработчики использовали `setTimeout` или `setInterval` с интервалом ~16 мс (1000 / 60). У этого подхода несколько серьёзных проблем.

**Таймер не синхронизирован с экраном.** Браузер перерисовывает экран в свой собственный момент. Если вызов таймера попадает между двумя перерисовками, кадр пропускается или задваивается — анимация дёргается.

**Таймер работает в фоновой вкладке.** `setInterval` продолжает выполняться, даже когда вкладка неактивна, понапрасну расходуя CPU и батарею устройства.

**Нет доступа к точному времени кадра.** Без временной метки кадра сложно делать анимации, независимые от частоты обновления экрана.

`requestAnimationFrame` решает все три проблемы: браузер сам управляет расписанием, автоматически приостанавливает анимацию в неактивных вкладках и передаёт точную временную метку в колбэк.

## Базовый пример: одиночный вызов

Для одноразового действия перед следующим кадром достаточно одного вызова:

```javascript
const box = document.getElementById('box');

requestAnimationFrame(() => {
  box.style.opacity = '1';
  box.style.transform = 'translateY(0)';
});
```

Это полезно, когда нужно применить изменение стиля после того, как браузер завершит текущий поток выполнения, — например, для запуска CSS-перехода.

## Анимационный цикл

Для непрерывной анимации колбэк должен вызывать `requestAnimationFrame` рекурсивно. Это создаёт цикл, который работает в ритме экрана:

```javascript
const box = document.getElementById('box');
let position = 0;

function animate() {
  position += 2;
  box.style.transform = `translateX(${position}px)`;

  if (position < 400) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);
```

Здесь `animate` вызывается примерно 60 раз в секунду, сдвигая блок вправо на 2 пикселя за кадр. Когда позиция достигает 400 пикселей, цикл останавливается.

## Анимация, независимая от частоты кадров

Проблема с кодом выше — скорость анимации зависит от частоты обновления экрана. На мониторе 120 Гц блок будет двигаться вдвое быстрее, чем на 60 Гц.

Решение — использовать временную метку для расчёта смещения на основе прошедшего времени:

```javascript
const box = document.getElementById('box');
const SPEED = 200; // пикселей в секунду

let position = 0;
let lastTime = null;

function animate(timestamp) {
  if (lastTime === null) {
    lastTime = timestamp;
  }

  const elapsed = timestamp - lastTime; // мс с прошлого кадра
  lastTime = timestamp;

  position += SPEED * (elapsed / 1000);
  box.style.transform = `translateX(${position}px)`;

  if (position < 400) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);
```

Теперь `SPEED` задаётся в пикселях в секунду, и анимация выглядит одинаково на любом устройстве. `elapsed / 1000` переводит миллисекунды в секунды, чтобы умножение давало корректное смещение.

## Остановка анимации: cancelAnimationFrame

`requestAnimationFrame` возвращает числовой идентификатор. Передав его в `cancelAnimationFrame`, можно отменить запланированный кадр:

```javascript
const box = document.getElementById('box');
let animationId = null;
let position = 0;

function animate(timestamp) {
  position += 2;
  box.style.transform = `translateX(${position}px)`;
  animationId = requestAnimationFrame(animate);
}

function start() {
  if (animationId === null) {
    animationId = requestAnimationFrame(animate);
  }
}

function stop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', stop);
```

Хранение идентификатора в переменной — стандартная практика. Проверка `animationId === null` предотвращает запуск нескольких параллельных циклов.

## Практический пример: анимация прогресс-бара

Рассмотрим анимацию прогресс-бара от 0 до 100% за заданное время:

```html
<div class="progress-track">
  <div class="progress-fill" id="progressFill"></div>
</div>
<button id="startBtn">Запустить</button>
```

```css
.progress-track {
  width: 400px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 0%;
  background: #6c47ff;
  border-radius: 12px;
  transition: none;
}
```

```javascript
const fill = document.getElementById('progressFill');
const DURATION = 2000; // 2 секунды

function animateProgress() {
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / DURATION, 1); // от 0 до 1

    fill.style.width = `${progress * 100}%`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

document.getElementById('startBtn').addEventListener('click', animateProgress);
```

`Math.min(elapsed / DURATION, 1)` гарантирует, что `progress` никогда не превысит 1, даже если последний кадр немного выйдет за пределы заданного времени.

## Функции плавности (easing)

Линейная анимация выглядит механически. Функции плавности делают движение естественным:

```javascript
// Функции easing — принимают t от 0 до 1, возвращают от 0 до 1
const easing = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

const fill = document.getElementById('progressFill');
const DURATION = 1500;

function animateWithEasing(easeFn) {
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }

    const rawProgress = Math.min((timestamp - startTime) / DURATION, 1);
    const easedProgress = easeFn(rawProgress);

    fill.style.width = `${easedProgress * 100}%`;

    if (rawProgress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

animateWithEasing(easing.easeInOut);
```

Сначала вычисляется линейный прогресс `rawProgress`, а затем применяется функция плавности. Это разделение позволяет менять `easeFn` без изменения логики цикла.

## Анимация нескольких элементов

Один цикл `requestAnimationFrame` может обновлять любое количество элементов — это эффективнее, чем запускать отдельный цикл для каждого:

```javascript
const particles = [
  { el: document.getElementById('p1'), x: 0, y: 0, vx: 1.5, vy: 0.8 },
  { el: document.getElementById('p2'), x: 100, y: 50, vx: -1, vy: 1.2 },
  { el: document.getElementById('p3'), x: 200, y: 20, vx: 0.7, vy: -1.5 },
];

const BOUNDS = { width: 500, height: 300 };

function animateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    // Отскок от границ
    if (p.x <= 0 || p.x >= BOUNDS.width) p.vx *= -1;
    if (p.y <= 0 || p.y >= BOUNDS.height) p.vy *= -1;

    p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

    requestAnimationFrame(animateParticles);
}

requestAnimationFrame(animateParticles);
```

## Анимация и видимость страницы

Когда вкладка уходит в фон, браузер приостанавливает `requestAnimationFrame`. При возврате временна́я метка делает большой скачок, что может привести к рывку анимации. `document.visibilitychange` помогает обработать этот сценарий:

```javascript
let lastTime = null;
let animationId = null;

function animate(timestamp) {
  if (lastTime !== null) {
    const elapsed = Math.min(timestamp - lastTime, 100); // ограничиваем скачок
    // ... использовать elapsed
  }
  lastTime = timestamp;
  animationId = requestAnimationFrame(animate);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
    lastTime = null;
  } else {
    animationId = requestAnimationFrame(animate);
  }
});
```

`Math.min(elapsed, 100)` ограничивает максимальный шаг 100 мс — даже если вкладка была неактивна минуту, анимация не совершит гигантский прыжок.

## Производительность: что делать и что не делать

**Избегайте чтения и записи DOM в одном кадре.** Чередование чтения (`getBoundingClientRect`, `offsetWidth`) и записи свойств стилей вызывает принудительный пересчёт макета (reflow) на каждом шаге:

```javascript
// Плохо — reflow на каждой итерации
function badAnimate() {
  const width = box.offsetWidth; // чтение
  box.style.width = width + 1 + 'px'; // запись → следующее чтение вызовет reflow
  requestAnimationFrame(badAnimate);
}

// Хорошо — все чтения перед записями
function goodAnimate() {
  const width = box.offsetWidth; // чтение
  // ... вычисления ...
  box.style.width = width + 1 + 'px'; // запись
  requestAnimationFrame(goodAnimate);
}
```

**Анимируйте `transform` и `opacity`.** Эти свойства обрабатываются на уровне compositor-потока браузера и не вызывают reflow или repaint основного потока.

**Используйте `will-change` осторожно.** Подсказка `will-change: transform` выносит элемент на отдельный слой GPU, ускоряя анимацию. Но злоупотребление ею увеличивает потребление памяти.

## Отличие от CSS-анимаций

`requestAnimationFrame` — инструмент для анимаций, которыми нужно управлять из JavaScript: реагировать на пользовательский ввод, зависеть от данных, динамически вычислять траекторию. Для простых декоративных переходов CSS-анимации (`@keyframes`, `transition`) проще и эффективнее — браузер оптимизирует их автоматически.

Используйте `requestAnimationFrame`, когда:
- анимация управляется данными или пользовательским вводом в реальном времени (скроллинг, перетаскивание, игры);
- нужно точно контролировать каждый кадр;
- анимируется canvas или WebGL;
- CSS не справляется с динамической логикой.

## Итог

`requestAnimationFrame` — правильный инструмент для анимаций в браузере. Он синхронизируется с экраном, экономит ресурсы в фоновых вкладках и даёт точную временну́ю метку для расчётов. Ключевые паттерны:

- рекурсивный вызов для непрерывного цикла;
- расчёт смещения через `elapsed / 1000` для независимости от FPS;
- хранение идентификатора и `cancelAnimationFrame` для остановки;
- ограничение максимального `elapsed` при возврате из фона;
- анимация `transform` и `opacity` вместо `left`/`top`/`width`.

Чтобы углублённо изучить JavaScript и браузерные API, включая работу с DOM и анимациями, посмотрите курс на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=request-animation-frame
