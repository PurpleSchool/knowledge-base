---
metaTitle: "PerformanceObserver API в JavaScript — мониторинг производительности"
metaDescription: "Как использовать PerformanceObserver API для измерения Web Vitals, загрузки ресурсов и пользовательских меток производительности в браузере."
author: "Антон Ларичев"
title: "PerformanceObserver API в JavaScript"
preview: "Узнайте, как с помощью PerformanceObserver API отслеживать метрики производительности браузера в реальном времени без блокировки основного потока."
---

## Что такое PerformanceObserver API

PerformanceObserver — это браузерный API, который позволяет наблюдать за записями производительности по мере их появления, не блокируя основной поток выполнения. В отличие от `performance.getEntries()`, который возвращает данные синхронно в определённый момент времени, PerformanceObserver работает асинхронно и уведомляет вас о новых метриках по мере их появления.

API входит в состав спецификации Performance Timeline Level 2 и поддерживается во всех современных браузерах.

## Зачем нужен PerformanceObserver

До появления PerformanceObserver разработчики использовали `performance.getEntries()` или `performance.getEntriesByType()` для получения данных о производительности. Проблема такого подхода заключается в том, что вы должны самостоятельно решать, когда запрашивать эти данные — если запросить слишком рано, часть метрик ещё не будет готова.

PerformanceObserver решает эту проблему, работая по принципу подписки: вы указываете, какие типы записей вас интересуют, и получаете уведомления автоматически.

```javascript
// Старый подход — нужно угадать правильный момент
window.addEventListener('load', () => {
  const entries = performance.getEntriesByType('resource');
  console.log(entries); // Часть ресурсов может загружаться ещё
});

// Новый подход — получаем записи по мере их появления
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => console.log(entry));
});

observer.observe({ type: 'resource', buffered: true });
```

## Типы записей производительности

PerformanceObserver поддерживает наблюдение за несколькими типами (`entryTypes`) записей:

### Встроенные типы

- `navigation` — данные о навигации страницы (время загрузки документа, DNS, TCP и т.д.)
- `resource` — загрузка каждого ресурса (скрипты, стили, изображения, XHR/fetch)
- `mark` — пользовательские метки, установленные через `performance.mark()`
- `measure` — пользовательские измерения через `performance.measure()`
- `longtask` — задачи в основном потоке длиннее 50 мс
- `paint` — метрики `first-paint` и `first-contentful-paint`
- `largest-contentful-paint` — LCP, ключевая метрика Web Vitals
- `layout-shift` — сдвиги макета для расчёта CLS
- `first-input` — первое взаимодействие пользователя для расчёта FID
- `event` — все пользовательские события для расчёта INP

Узнать, какие типы поддерживает конкретный браузер, можно так:

```javascript
const supportedTypes = PerformanceObserver.supportedEntryTypes;
console.log(supportedTypes);
// ['element', 'event', 'first-input', 'largest-contentful-paint',
//  'layout-shift', 'longtask', 'mark', 'measure', 'navigation',
//  'paint', 'resource', 'visibility-state']
```

## Создание наблюдателя

Конструктор `PerformanceObserver` принимает callback-функцию, которая вызывается при появлении новых записей.

```javascript
const observer = new PerformanceObserver((list, observer) => {
  // list — объект PerformanceObserverEntryList
  // observer — ссылка на сам наблюдатель

  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log(`Тип: ${entry.entryType}`);
    console.log(`Имя: ${entry.name}`);
    console.log(`Начало: ${entry.startTime.toFixed(2)} мс`);
    console.log(`Длительность: ${entry.duration.toFixed(2)} мс`);
  });
});
```

Запуск наблюдения:

```javascript
// Наблюдение за одним типом
observer.observe({ type: 'paint' });

// Наблюдение за несколькими типами
observer.observe({ entryTypes: ['mark', 'measure'] });

// С параметром buffered — получить и уже накопленные записи
observer.observe({ type: 'largest-contentful-paint', buffered: true });
```

Параметр `buffered: true` важен для метрик, которые могли быть зафиксированы до создания наблюдателя (например, LCP часто фиксируется в первые секунды загрузки).

## Измерение Web Vitals

PerformanceObserver является основой для измерения Core Web Vitals — ключевых метрик качества пользовательского опыта.

### Largest Contentful Paint (LCP)

LCP измеряет время до отображения самого крупного видимого элемента страницы. Хорошее значение — менее 2.5 секунды.

```javascript
let lcpValue = 0;

const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  // Берём последнюю запись — она самая актуальная
  const lastEntry = entries[entries.length - 1];
  lcpValue = lastEntry.startTime;
});

lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

// LCP фиксируется при первом взаимодействии пользователя
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    lcpObserver.disconnect();
    console.log(`LCP: ${lcpValue.toFixed(2)} мс`);
  }
});
```

### Cumulative Layout Shift (CLS)

CLS измеряет визуальную стабильность страницы — сумму всех неожиданных смещений элементов. Хорошее значение — менее 0.1.

```javascript
let clsScore = 0;
let clsEntries = [];

const clsObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Не учитываем сдвиги после взаимодействия пользователя
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
      clsEntries.push(entry);
    }
  }
});

clsObserver.observe({ type: 'layout-shift', buffered: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    console.log(`CLS: ${clsScore.toFixed(4)}`);
    console.log('Смещения:', clsEntries);
  }
});
```

### First Input Delay / Interaction to Next Paint (INP)

INP (пришёл на смену FID) измеряет задержку отклика на пользовательские взаимодействия.

```javascript
const inputObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // processingStart — момент начала обработки браузером
    // startTime — момент взаимодействия пользователя
    const delay = entry.processingStart - entry.startTime;
    console.log(`Тип взаимодействия: ${entry.name}`);
    console.log(`Задержка: ${delay.toFixed(2)} мс`);
    console.log(`Длительность: ${entry.duration.toFixed(2)} мс`);
  }
});

// 'first-input' для FID, 'event' для INP
inputObserver.observe({ type: 'first-input', buffered: true });
```

## Мониторинг загрузки ресурсов

Тип `resource` позволяет отслеживать загрузку всех внешних ресурсов.

```javascript
const resourceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Пропускаем ресурсы без полных данных тайминга
    if (entry.responseEnd === 0) continue;

    const timings = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      total: entry.responseEnd - entry.startTime,
    };

    if (timings.total > 500) {
      console.warn(`Медленный ресурс: ${entry.name}`);
      console.table(timings);
    }
  }
});

resourceObserver.observe({ type: 'resource', buffered: true });
```

## Пользовательские метки и измерения

PerformanceObserver отлично работает совместно с `performance.mark()` и `performance.measure()` для измерения производительности собственного кода.

```javascript
const measureObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration.toFixed(2)} мс`);
    }
  }
});

measureObserver.observe({ entryTypes: ['mark', 'measure'] });

// Теперь замеряем производительность своего кода
performance.mark('fetch-start');

fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    performance.mark('fetch-end');
    performance.measure('fetch-duration', 'fetch-start', 'fetch-end');
    return data;
  });
```

### Практический пример — профилирование React-рендера

```javascript
function measureRender(componentName, renderFn) {
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  const measureName = `${componentName}-render`;

  performance.mark(startMark);
  const result = renderFn();
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  return result;
}

// Использование
measureRender('UserList', () => {
  renderUserList(users);
});
```

## Обнаружение долгих задач

Тип `longtask` помогает найти задачи, которые блокируют основной поток более 50 мс и делают интерфейс неотзывчивым.

```javascript
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn(
      `Долгая задача: ${entry.duration.toFixed(2)} мс ` +
      `начата в ${entry.startTime.toFixed(2)} мс`
    );

    // attribution содержит информацию об источнике задачи
    if (entry.attribution && entry.attribution.length > 0) {
      const attr = entry.attribution[0];
      console.warn(`Источник: ${attr.name}, контейнер: ${attr.containerType}`);
    }
  }
});

// longtask требует Feature Policy в некоторых браузерах
try {
  longTaskObserver.observe({ type: 'longtask', buffered: true });
} catch (e) {
  console.log('longtask не поддерживается в этом браузере');
}
```

## Управление наблюдателем

### Отключение наблюдателя

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry);
  }
});

observer.observe({ type: 'paint', buffered: true });

// Остановить наблюдение
observer.disconnect();
```

### Получение накопленных записей

```javascript
const observer = new PerformanceObserver((list) => {});
observer.observe({ type: 'resource', buffered: true });

// Получить все записи, накопленные наблюдателем
const records = observer.takeRecords();
console.log(`Записей в очереди: ${records.length}`);
```

`takeRecords()` возвращает и одновременно очищает внутреннюю очередь наблюдателя — полезно при отключении, чтобы не потерять последние данные.

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Забираем оставшиеся данные перед отключением
    const remaining = observer.takeRecords();
    processEntries(remaining);
    observer.disconnect();
  }
});
```

## Отправка метрик на сервер

Типичный паттерн — собрать метрики и отправить их при уходе пользователя со страницы. Для этого используйте `navigator.sendBeacon()`, который гарантирует отправку даже при закрытии вкладки.

```javascript
const metrics = {};

const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  metrics.lcp = entries[entries.length - 1].startTime;
});
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

let clsScore = 0;
const clsObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
    }
  }
});
clsObserver.observe({ type: 'layout-shift', buffered: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    metrics.cls = clsScore;
    metrics.url = location.href;
    metrics.timestamp = Date.now();

    // sendBeacon работает асинхронно и не блокирует закрытие вкладки
    navigator.sendBeacon(
      '/api/metrics',
      JSON.stringify(metrics)
    );
  }
});
```

## Проверка поддержки

PerformanceObserver поддерживается во всех современных браузерах, но конкретные типы записей могут отличаться.

```javascript
function observeIfSupported(type, callback) {
  if (!('PerformanceObserver' in window)) {
    console.log('PerformanceObserver не поддерживается');
    return null;
  }

  if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
    console.log(`Тип '${type}' не поддерживается`);
    return null;
  }

  const observer = new PerformanceObserver(callback);
  observer.observe({ type, buffered: true });
  return observer;
}

// Использование
const lcpObserver = observeIfSupported('largest-contentful-paint', (list) => {
  const entry = list.getEntries().pop();
  if (entry) {
    console.log(`LCP: ${entry.startTime.toFixed(0)} мс`);
  }
});
```

## Итоги

PerformanceObserver API предоставляет мощный и неблокирующий способ мониторинга производительности веб-приложений:

- Используйте `largest-contentful-paint`, `layout-shift` и `first-input` для измерения Core Web Vitals
- Тип `resource` поможет найти медленные сетевые запросы
- Тип `longtask` выявит задачи, блокирующие основной поток
- Пользовательские `mark` и `measure` позволяют замерять производительность любого участка кода
- Всегда указывайте `buffered: true`, если метрика могла появиться до создания наблюдателя
- Для отправки данных при закрытии страницы используйте `navigator.sendBeacon()`

Глубокое понимание работы браузера и инструментов оптимизации производительности — важная часть профессионального JavaScript-разработчика. Освоить эти и другие продвинутые возможности языка можно на курсе [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=performance-observer).