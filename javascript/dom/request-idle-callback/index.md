---
metaTitle: "requestIdleCallback в JavaScript — планирование фоновых задач"
metaDescription: "Как использовать requestIdleCallback для выполнения некритичных задач в периоды простоя браузера без ущерба для производительности UI."
author: "Антон Ларичев"
title: "requestIdleCallback — планирование задач в периоды простоя браузера"
preview: "Узнайте, как requestIdleCallback помогает выносить некритичные операции в периоды простоя браузера, не блокируя рендеринг и анимации."
---

## Что такое requestIdleCallback

`requestIdleCallback` — это браузерный API, позволяющий запланировать выполнение функции в момент, когда основной поток браузера свободен. Браузер сам определяет, когда у него есть «свободное время» (idle period), и вызывает зарегистрированный колбэк именно в этот момент.

Основная идея: не все задачи одинаково срочны. Аналитические события, кэширование данных, предзагрузка ресурсов — всё это можно отложить, не нанося вреда пользовательскому опыту. `requestIdleCallback` даёт инструмент для такой отсрочки.

```javascript
requestIdleCallback((deadline) => {
  console.log('Браузер свободен, можно работать');
  console.log('Осталось времени (мс):', deadline.timeRemaining());
});
```

## Как браузер определяет периоды простоя

Браузер выполняет задачи в рамках «кадров» (frames). При стандартных 60 fps на один кадр отводится около 16,7 мс. Этот бюджет уходит на:

- обработку пользовательских событий;
- выполнение JavaScript;
- вычисление стилей и layout;
- рендеринг (paint, composite).

Если все эти шаги укладываются в 16,7 мс и остаётся запас — это и есть idle период. Именно тогда браузер вызывает зарегистрированные через `requestIdleCallback` функции.

В периоды полного бездействия (пользователь ничего не делает) idle периоды могут длиться значительно дольше — до 50 мс.

## Синтаксис и параметры

```javascript
const id = requestIdleCallback(callback, options);
```

**callback** — функция, которая будет вызвана в период простоя. Получает один аргумент — объект `IdleDeadline`.

**options** — необязательный объект с полем `timeout` (число миллисекунд). Если колбэк не был вызван за указанное время, браузер вызовет его принудительно, даже если поток занят.

Возвращаемый `id` можно передать в `cancelIdleCallback(id)` для отмены.

## Объект IdleDeadline

Колбэк получает объект с двумя свойствами:

```javascript
requestIdleCallback((deadline) => {
  // Сколько миллисекунд осталось в текущем idle периоде
  const remaining = deadline.timeRemaining(); // число от 0 до ~50

  // true, если колбэк был вызван принудительно из-за timeout
  const forced = deadline.didTimeout;

  console.log(`Осталось: ${remaining}мс, принудительно: ${forced}`);
});
```

### timeRemaining()

Возвращает приблизительное количество миллисекунд, оставшихся в текущем idle периоде. Значение динамически уменьшается по мере выполнения кода. Когда оно близко к нулю, нужно прекратить работу и, при необходимости, запланировать продолжение через новый `requestIdleCallback`.

### didTimeout

Если вы указали опцию `timeout` и время вышло, `didTimeout` будет `true`. В этом случае `timeRemaining()` вернёт `0`, и нужно выполнить хотя бы минимальный объём работы — иначе задача вообще не выполнится.

## Пример: разбивка тяжёлой задачи на части

Самый распространённый паттерн — обработка большого массива данных небольшими порциями:

```javascript
const items = Array.from({ length: 10000 }, (_, i) => i);
let index = 0;

function processItems(deadline) {
  // Продолжаем работу, пока есть время и данные
  while (index < items.length && deadline.timeRemaining() > 1) {
    heavyProcess(items[index]);
    index++;
  }

  // Если не всё обработано — планируем следующую итерацию
  if (index < items.length) {
    requestIdleCallback(processItems);
  } else {
    console.log('Все элементы обработаны');
  }
}

function heavyProcess(item) {
  // Имитация тяжёлой операции
  return item * item + Math.sqrt(item);
}

requestIdleCallback(processItems);
```

Ключ здесь — проверка `deadline.timeRemaining() > 1` перед каждой итерацией. Порог в 1 мс оставляет небольшой запас на выход из цикла и планирование следующего вызова.

## Использование опции timeout

Без `timeout` нет гарантии, что колбэк вообще когда-либо выполнится — если браузер постоянно занят, idle периодов может не быть долгое время.

```javascript
requestIdleCallback(
  (deadline) => {
    if (deadline.didTimeout) {
      // Принудительный вызов — выполняем минимум необходимого
      saveAnalyticsData();
      return;
    }

    // Обычный вызов — можем делать больше
    if (deadline.timeRemaining() > 5) {
      saveAnalyticsData();
      prefetchNextPage();
    }
  },
  { timeout: 2000 } // Через 2 секунды вызвать принудительно
);
```

Правило: если задача важна и должна выполниться в любом случае (например, отправка аналитики перед уходом пользователя) — всегда задавайте `timeout`.

## Отмена запланированной задачи

```javascript
const id = requestIdleCallback((deadline) => {
  prefetchData();
});

// Отменяем, если пользователь перешёл на другую страницу
function onNavigate() {
  cancelIdleCallback(id);
}

document.addEventListener('click', onNavigate, { once: true });
```

## Практические сценарии применения

### Отправка аналитики

```javascript
const analyticsQueue = [];

function trackEvent(name, data) {
  analyticsQueue.push({ name, data, timestamp: Date.now() });

  requestIdleCallback(
    () => flushAnalytics(),
    { timeout: 5000 }
  );
}

function flushAnalytics() {
  if (analyticsQueue.length === 0) return;

  const batch = analyticsQueue.splice(0, analyticsQueue.length);
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(batch),
  });
}
```

### Предзагрузка данных для следующей страницы

```javascript
function scheduleDataPrefetch(route) {
  requestIdleCallback(
    async (deadline) => {
      if (deadline.timeRemaining() < 5 && !deadline.didTimeout) {
        // Мало времени — переносим
        requestIdleCallback(() => scheduleDataPrefetch(route));
        return;
      }

      try {
        const data = await fetch(`/api/prefetch?route=${route}`).then(r => r.json());
        sessionStorage.setItem(`prefetch:${route}`, JSON.stringify(data));
      } catch (e) {
        // Не критично — просто не кэшируем
      }
    },
    { timeout: 10000 }
  );
}

// Вызываем при наведении на ссылку
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('mouseenter', () => {
    scheduleDataPrefetch(link.pathname);
  });
});
```

### Сохранение черновика

```javascript
let idleCallbackId = null;

function scheduleDraftSave(content) {
  // Отменяем предыдущий запрос если был
  if (idleCallbackId !== null) {
    cancelIdleCallback(idleCallbackId);
  }

  idleCallbackId = requestIdleCallback(
    (deadline) => {
      idleCallbackId = null;
      localStorage.setItem('draft', content);
      console.log('Черновик сохранён');
    },
    { timeout: 3000 }
  );
}

textarea.addEventListener('input', (e) => {
  scheduleDraftSave(e.target.value);
});
```

## Сравнение с setTimeout(fn, 0)

Часто разработчики используют `setTimeout(fn, 0)` для «фоновых» задач. Разница принципиальная:

```javascript
// setTimeout — выполнится при первой возможности,
// даже если браузер занят рендерингом
setTimeout(() => {
  heavyTask(); // может заблокировать кадр
}, 0);

// requestIdleCallback — выполнится только когда браузер свободен
requestIdleCallback((deadline) => {
  heavyTask(); // не помешает рендерингу
});
```

`setTimeout` ставит задачу в очередь макрозадач — она выполнится после текущего кадра, но может прийтись на начало следующего и вытеснить рендеринг. `requestIdleCallback` явно ждёт свободного времени.

## Ограничения и важные нюансы

**Нельзя выполнять DOM-операции, влияющие на layout.** Если внутри колбэка сделать что-то, вызывающее перевычисление стилей (например, чтение `offsetWidth` после записи в DOM), браузер вынужден будет пересчитать layout прямо сейчас — это нарушает весь смысл idle callback.

```javascript
// Плохо — вызывает layout thrashing в idle периоде
requestIdleCallback(() => {
  element.style.width = '100px';
  console.log(element.offsetWidth); // форсирует layout
});

// Хорошо — только чтение или только запись
requestIdleCallback((deadline) => {
  if (deadline.timeRemaining() > 2) {
    updateDataCache();
    sendAnalytics();
  }
});
```

**Не подходит для срочных задач.** Если задача влияет на то, что пользователь видит прямо сейчас, `requestIdleCallback` не подойдёт — задержка непредсказуема.

**Поддержка браузерами.** API поддерживается во всех современных браузерах, но отсутствует в Safari (добавлен только в Safari 18). Для продакшн-кода нужен полифил:

```javascript
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (callback, options) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };
```

Этот полифил не воспроизводит точное поведение (`setTimeout` не ждёт реального idle периода), но обеспечивает работоспособный API в браузерах без поддержки.

## Пример: класс для управления idle задачами

```javascript
class IdleTaskQueue {
  constructor() {
    this.tasks = [];
    this.isScheduled = false;
  }

  add(task, options = {}) {
    this.tasks.push({ task, timeout: options.timeout });
    if (!this.isScheduled) {
      this.schedule();
    }
  }

  schedule() {
    this.isScheduled = true;
    requestIdleCallback(
      (deadline) => this.run(deadline),
      { timeout: 5000 }
    );
  }

  run(deadline) {
    while (
      this.tasks.length > 0 &&
      (deadline.timeRemaining() > 1 || deadline.didTimeout)
    ) {
      const { task } = this.tasks.shift();
      try {
        task();
      } catch (e) {
        console.error('Idle task failed:', e);
      }
    }

    if (this.tasks.length > 0) {
      this.schedule();
    } else {
      this.isScheduled = false;
    }
  }
}

// Использование
const queue = new IdleTaskQueue();

queue.add(() => saveAnalytics());
queue.add(() => updateCache());
queue.add(() => cleanupStorage());
```

## Итог

`requestIdleCallback` решает конкретную проблему: как выполнять некритичные задачи, не мешая работе приложения. Правильное использование:

- всегда проверяйте `deadline.timeRemaining()` перед каждой единицей работы;
- разбивайте большие задачи на маленькие части;
- используйте `timeout` для задач, которые должны выполниться в любом случае;
- не делайте DOM-операций, вызывающих layout;
- не забывайте о полифиле для Safari;
- не используйте для задач, влияющих на видимый UI.

API особенно ценен в сочетании с другими инструментами планирования: `requestAnimationFrame` для рендеринга, `setTimeout`/`setInterval` для периодических задач, и `requestIdleCallback` — для всего, что можно отложить.

Чтобы глубже разобраться в работе браузера, производительности JavaScript и оптимизации пользовательского опыта, изучите курс на PurpleSchool:

[JavaScript для профессионалов на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=request-idle-callback)
