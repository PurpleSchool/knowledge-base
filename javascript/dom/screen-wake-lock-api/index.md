---
metaTitle: "Screen Wake Lock API в JavaScript — блокировка экрана"
metaDescription: "Как использовать Screen Wake Lock API в JavaScript: запрос блокировки, освобождение, обработка ошибок и практические примеры применения."
author: "Антон Ларичев"
title: "Screen Wake Lock API — блокировка засыпания экрана"
preview: "Разбираем Screen Wake Lock API — как предотвратить засыпание экрана в браузере с помощью JavaScript и когда это действительно нужно."
---

## Что такое Screen Wake Lock API

Screen Wake Lock API — это браузерный интерфейс, который позволяет веб-приложению запрещать устройству гасить экран или переходить в режим сна. Раньше такая возможность была доступна только нативным приложениям, но теперь её можно использовать прямо из браузера.

API входит в спецификацию W3C и доступен через объект `navigator.wakeLock`. Он позволяет запросить так называемый «wake lock» — блокировку, которая удерживает экран включённым на протяжении всего времени, пока блокировка активна.

Важно понимать: блокировка работает только тогда, когда вкладка находится в фокусе и видима пользователю. Если пользователь переключится на другую вкладку, браузер автоматически снимет блокировку.

## Когда это нужно

SScreen Wake Lock API решает конкретную задачу: не дать экрану погаснуть в момент, когда пользователь не взаимодействует с устройством вручную, но всё равно смотрит на него.

Типичные сценарии использования:

- **Медиаплееры** — пользователь смотрит видео или слушает подкаст с субтитрами, не касаясь экрана.
- **Навигация** — приложение показывает маршрут на карте во время поездки.
- **Презентации** — слайды показываются в полноэкранном режиме без взаимодействия.
- **Рецепты и инструкции** — пользователь читает пошаговый рецепт, пока готовит.
- **Спортивные таймеры** — экран должен оставаться включённым во время тренировки.
- **Дашборды мониторинга** — данные отображаются в реальном времени на экране без касаний.

Без Wake Lock API единственным способом решить эту задачу было периодически вызывать какое-то незаметное для пользователя взаимодействие через `setInterval`, что являлось грубым хаком и потребляло лишние ресурсы.

## Типы wake lock

Спецификация определяет один тип блокировки — `'screen'`. Существовал также тип `'system'`, который предотвращал переход устройства в сон полностью (без гашения экрана), но он был удалён из спецификации. Поэтому сегодня при работе с API всегда используется тип `'screen'`.

## Запрос блокировки

Для запроса блокировки используется метод `navigator.wakeLock.request()`. Метод асинхронный и возвращает Promise, который разрешается объектом `WakeLockSentinel`.

```javascript
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake lock активен');
    return wakeLock;
  } catch (error) {
    console.error(`Ошибка: ${error.name} — ${error.message}`);
  }
}
```

Объект `WakeLockSentinel` — это дескриптор активной блокировки. Он содержит:

- `sentinel.type` — тип блокировки (`'screen'`).
- `sentinel.released` — булево значение, показывающее, была ли блокировка снята.
- `sentinel.release()` — метод для явного снятия блокировки.
- Событие `release` — срабатывает при снятии блокировки.

```javascript
const wakeLock = await navigator.wakeLock.request('screen');

console.log(wakeLock.type);     // 'screen'
console.log(wakeLock.released); // false

wakeLock.addEventListener('release', () => {
  console.log('Блокировка снята');
});
```

## Освобождение блокировки

Блокировка должна быть явно снята, когда она больше не нужна. Это делается через метод `release()` объекта `WakeLockSentinel`.

```javascript
let wakeLock = null;

async function enableWakeLock() {
  wakeLock = await navigator.wakeLock.request('screen');
}

async function disableWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log('Блокировка снята вручную');
  }
}
```

Помимо явного вызова `release()`, блокировка снимается автоматически в следующих случаях:

- Пользователь переключился на другую вкладку или свернул браузер.
- Страница потеряла видимость (`document.visibilityState` стал `'hidden'`).
- Операционная система или браузер приняли решение снять блокировку (например, при низком заряде батареи).

## Обработка потери видимости

Поскольку браузер автоматически снимает блокировку при скрытии вкладки, нужно отслеживать видимость страницы и повторно запрашивать блокировку при возврате. Для этого используется событие `visibilitychange`.

```javascript
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');

    wakeLock.addEventListener('release', () => {
      console.log('Wake lock снят');
    });
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && wakeLock !== null && wakeLock.released) {
    await requestWakeLock();
  }
});

await requestWakeLock();
```

Здесь проверяется условие `wakeLock.released` — важно не запрашивать новую блокировку, если текущая ещё активна. Это предотвращает утечку нескольких одновременно активных блокировок.

## Обработка ошибок

Метод `request()` может выбросить исключение в нескольких ситуациях:

- `NotAllowedError` — браузер отказал в выдаче блокировки. Это может произойти при низком заряде батареи, в режиме экономии энергии, или если пользователь запретил этот API для сайта.
- `AbortError` — запрос был прерван.

```javascript
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    return wakeLock;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      console.warn('Браузер не разрешил блокировку экрана');
    } else {
      console.error('Непредвиденная ошибка:', error);
    }
    return null;
  }
}
```

Также стоит проверять поддержку API перед использованием:

```javascript
if ('wakeLock' in navigator) {
  // API поддерживается
} else {
  console.warn('Screen Wake Lock API не поддерживается в этом браузере');
}
```

## Практические примеры

### Переключатель блокировки с кнопкой

Простой UI-компонент для управления блокировкой:

```javascript
class WakeLockController {
  #wakeLock = null;
  #button;

  constructor(buttonElement) {
    this.#button = buttonElement;
    this.#button.addEventListener('click', () => this.#toggle());

    document.addEventListener('visibilitychange', async () => {
      if (
        document.visibilityState === 'visible' &&
        this.#wakeLock !== null &&
        this.#wakeLock.released
      ) {
        await this.#acquire();
      }
    });
  }

  async #acquire() {
    try {
      this.#wakeLock = await navigator.wakeLock.request('screen');
      this.#wakeLock.addEventListener('release', () => this.#updateUI());
      this.#updateUI();
    } catch (error) {
      console.error('Не удалось заблокировать экран:', error.message);
    }
  }

  async #release() {
    if (this.#wakeLock) {
      await this.#wakeLock.release();
      this.#wakeLock = null;
    }
  }

  async #toggle() {
    if (this.#wakeLock && !this.#wakeLock.released) {
      await this.#release();
    } else {
      await this.#acquire();
    }
  }

  #updateUI() {
    const isActive = this.#wakeLock && !this.#wakeLock.released;
    this.#button.textContent = isActive ? 'Отключить блокировку' : 'Включить блокировку';
    this.#button.setAttribute('aria-pressed', String(isActive));
  }
}

const button = document.querySelector('#wake-lock-btn');
if ('wakeLock' in navigator) {
  new WakeLockController(button);
} else {
  button.disabled = true;
  button.textContent = 'Не поддерживается';
}
```

### Автоматическая блокировка во время воспроизведения видео

Пример интеграции с HTML-видео: блокировка запрашивается при старте воспроизведения и снимается при паузе или завершении.

```javascript
const video = document.querySelector('video');
let wakeLock = null;

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;

  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (error) {
    console.warn('Wake lock недоступен:', error.message);
  }
}

async function releaseWakeLock() {
  if (wakeLock && !wakeLock.released) {
    await wakeLock.release();
    wakeLock = null;
  }
}

video.addEventListener('play', acquireWakeLock);
video.addEventListener('pause', releaseWakeLock);
video.addEventListener('ended', releaseWakeLock);

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && !video.paused) {
    await acquireWakeLock();
  }
});
```

### Таймер тренировки с блокировкой экрана

```javascript
class WorkoutTimer {
  #wakeLock = null;
  #intervalId = null;
  #seconds = 0;

  async start() {
    await this.#requestWakeLock();
    this.#intervalId = setInterval(() => {
      this.#seconds++;
      this.#render();
    }, 1000);
  }

  async stop() {
    clearInterval(this.#intervalId);
    this.#intervalId = null;
    await this.#releaseWakeLock();
  }

  async #requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      this.#wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      // Таймер продолжает работать даже без блокировки
    }
  }

  async #releaseWakeLock() {
    if (this.#wakeLock && !this.#wakeLock.released) {
      await this.#wakeLock.release();
      this.#wakeLock = null;
    }
  }

  #render() {
    const minutes = String(Math.floor(this.#seconds / 60)).padStart(2, '0');
    const secs = String(this.#seconds % 60).padStart(2, '0');
    document.querySelector('#timer').textContent = `${minutes}:${secs}`;
  }
}
```

## Работа с несколькими блокировками

Браузер поддерживает несколько одновременно активных сентинелов. Экран будет оставаться включённым, пока хотя бы один из них не освобождён. Это позволяет разным частям одного приложения независимо управлять блокировкой.

```javascript
// Два разных модуля запрашивают блокировку независимо
const lock1 = await navigator.wakeLock.request('screen');
const lock2 = await navigator.wakeLock.request('screen');

// Экран отключится только после снятия обеих блокировок
await lock1.release(); // экран ещё не гаснет
await lock2.release(); // теперь можно гаснуть
```

## Поддержка браузерами

Screen Wake Lock API поддерживается во всех современных браузерах на основе Chromium (Chrome, Edge, Opera) начиная с 2020–2021 годов. Firefox и Safari добавили поддержку позже.

API работает только по протоколу HTTPS или на `localhost`. В HTTP-контексте `navigator.wakeLock` будет `undefined`.

Проверка поддержки и контекста безопасности:

```javascript
function isWakeLockSupported() {
  return 'wakeLock' in navigator && location.protocol === 'https:';
}

if (isWakeLockSupported()) {
  // Можно использовать API
}
```

## Права доступа и политики

В отличие от многих других браузерных API (геолокация, камера), Screen Wake Lock API не требует явного разрешения от пользователя. Браузер принимает решение о выдаче блокировки самостоятельно, основываясь на системных условиях: уровне заряда, режиме энергосбережения и политиках безопасности.

Политика разрешений (`Permissions Policy`) позволяет отключить API для встроенных фреймов:

```html
<!-- Запретить use wake-lock во всех iframe -->
<iframe src="..." allow=""></iframe>

<!-- Разрешить конкретному источнику -->
<iframe src="https://example.com" allow="screen-wake-lock"></iframe>
```

## Полный пример с обработкой всех состояний

```javascript
class WakeLockManager {
  #sentinel = null;
  #isEnabled = false;

  get isActive() {
    return this.#sentinel !== null && !this.#sentinel.released;
  }

  async enable() {
    if (!('wakeLock' in navigator)) {
      throw new Error('Screen Wake Lock API не поддерживается');
    }

    this.#isEnabled = true;
    await this.#request();

    document.addEventListener('visibilitychange', this.#onVisibilityChange);
  }

  async disable() {
    this.#isEnabled = false;
    document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    await this.#release();
  }

  #onVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && this.#isEnabled) {
      await this.#request();
    }
  };

  async #request() {
    try {
      this.#sentinel = await navigator.wakeLock.request('screen');
      this.#sentinel.addEventListener('release', () => {
        this.#sentinel = null;
      });
    } catch (error) {
      this.#sentinel = null;
      if (error.name !== 'NotAllowedError') {
        throw error;
      }
    }
  }

  async #release() {
    if (this.#sentinel && !this.#sentinel.released) {
      await this.#sentinel.release();
    }
    this.#sentinel = null;
  }
}

// Использование
const manager = new WakeLockManager();

try {
  await manager.enable();
  console.log('Экран заблокирован от сна');
} catch (error) {
  console.error('Ошибка:', error.message);
}

// Когда блокировка больше не нужна
await manager.disable();
```

## Итог

Screen Wake Lock API — лаконичный, но полезный инструмент для сценариев, где экран должен оставаться включённым без участия пользователя. Ключевые моменты при работе с API:

- Всегда проверяйте поддержку через `'wakeLock' in navigator`.
- Обрабатывайте автоматическое снятие блокировки при скрытии вкладки через `visibilitychange`.
- Явно освобождайте блокировку, когда она больше не нужна.
- Оборачивайте вызов `request()` в `try/catch` — браузер может отказать в блокировке.
- API работает только по HTTPS.

Хотите глубже разобраться в браузерных API и современном JavaScript? Пройдите курс по JavaScript на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=screen-wake-lock-api