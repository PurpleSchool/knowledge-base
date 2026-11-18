---
metaTitle: "Page Visibility API в JavaScript — управление вкладками"
metaDescription: "Полное руководство по Page Visibility API: отслеживание видимости вкладки, оптимизация ресурсов, практические примеры с кодом."
author: "Антон Ларичев"
title: "Page Visibility API в JavaScript"
preview: "Узнайте, как с помощью Page Visibility API определять, когда пользователь переключается между вкладками, и оптимизировать работу приложения."
---

## Что такое Page Visibility API

Page Visibility API — стандартный браузерный интерфейс, позволяющий JavaScript-коду определять, видна ли страница пользователю прямо сейчас. Это происходит, когда пользователь переключается на другую вкладку, сворачивает браузер или блокирует экран устройства.

До появления этого API разработчики использовали обходные решения: отслеживали события `focus` и `blur` на объекте `window`. Такой подход ненадёжен — `blur` срабатывает при переключении между элементами внутри той же вкладки, а `focus` не всегда отражает реальную видимость страницы.

Page Visibility API даёт точный и единый механизм для всех современных браузеров.

## Основные свойства и события

### document.visibilityState

Основное свойство API — `document.visibilityState`. Оно возвращает строку с текущим состоянием видимости страницы:

- `"visible"` — страница находится на переднем плане и видна пользователю
- `"hidden"` — страница скрыта: фоновая вкладка, свёрнутое окно, заблокированный экран
- `"prerender"` — страница рендерится предварительно, но ещё не видна (редкое состояние, не все браузеры поддерживают)

```javascript
console.log(document.visibilityState); // 'visible' или 'hidden'
```

### document.hidden

Сокращённый булевый вариант — `document.hidden`. Возвращает `true`, если страница скрыта, и `false`, если видна:

```javascript
if (document.hidden) {
  console.log('Страница не видна пользователю');
} else {
  console.log('Страница видна пользователю');
}
```

На практике `document.hidden` удобен для простых проверок, а `document.visibilityState` — когда нужно различать несколько состояний.

### Событие visibilitychange

Событие `visibilitychange` генерируется на объекте `document` каждый раз, когда состояние видимости меняется:

```javascript
document.addEventListener('visibilitychange', () => {
  console.log('Состояние изменилось:', document.visibilityState);
});
```

Событие не содержит дополнительной информации в объекте `event` — всё необходимое читается через `document.visibilityState` или `document.hidden` прямо в обработчике.

## Практические примеры

### Пауза и возобновление видео

Один из самых распространённых сценариев — автоматически останавливать воспроизведение медиа, когда пользователь уходит с вкладки:

```javascript
const video = document.querySelector('video');

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    video.pause();
  } else {
    video.play();
  }
});
```

Это улучшает пользовательский опыт: звук из фоновой вкладки не отвлекает, а при возврате воспроизведение продолжается автоматически.

### Остановка анимаций и таймеров

Запускать `requestAnimationFrame` или `setInterval` на скрытой вкладке — впустую тратить ресурсы CPU и заряд батареи. Браузеры сами снижают частоту таймеров на фоновых вкладках, но явная проверка надёжнее:

```javascript
let animationId = null;

function animate() {
  // логика анимации
  animationId = requestAnimationFrame(animate);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
    animationId = null;
  } else {
    animate();
  }
});

// запуск при загрузке страницы
animate();
```

Тот же подход применим к `setInterval`:

```javascript
let timerId = null;

function startPolling() {
  timerId = setInterval(fetchUpdates, 5000);
}

function stopPolling() {
  clearInterval(timerId);
  timerId = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    startPolling();
  }
});

startPolling();
```

### Подсчёт активного времени на странице

Аналитика часто требует знать, сколько времени пользователь реально смотрел на страницу, а не просто держал вкладку открытой:

```javascript
let activeTime = 0;
let lastVisible = document.hidden ? null : Date.now();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (lastVisible !== null) {
      activeTime += Date.now() - lastVisible;
      lastVisible = null;
    }
  } else {
    lastVisible = Date.now();
  }
});

window.addEventListener('beforeunload', () => {
  if (lastVisible !== null) {
    activeTime += Date.now() - lastVisible;
  }
  // отправка activeTime на сервер аналитики
  navigator.sendBeacon('/analytics', JSON.stringify({ activeTime }));
});
```

### Обновление данных при возврате на вкладку

Если приложение показывает данные, которые могли измениться за время отсутствия пользователя, логично обновить их при возврате:

```javascript
async function fetchLatestData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  renderData(data);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchLatestData();
  }
});
```

Это полезно для дашбордов, лент новостей, чатов — любых приложений с «живыми» данными.

### Уведомление пользователя в заголовке вкладки

Классический приём — менять `document.title` для привлечения внимания на фоновой вкладке:

```javascript
let originalTitle = document.title;
let flashInterval = null;

function startTitleFlash(message) {
  let isFlashing = false;
  flashInterval = setInterval(() => {
    document.title = isFlashing ? originalTitle : message;
    isFlashing = !isFlashing;
  }, 1000);
}

function stopTitleFlash() {
  clearInterval(flashInterval);
  document.title = originalTitle;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    stopTitleFlash();
  }
});

// вызвать при новом сообщении в чате
function onNewMessage(count) {
  if (document.hidden) {
    startTitleFlash(`(${count}) Новое сообщение`);
  }
}
```

## Игровой пример: пауза при переключении вкладки

Рассмотрим более сложный случай — браузерная игра, которая должна ставить игровой цикл на паузу, когда пользователь уходит:

```javascript
class Game {
  constructor() {
    this.isRunning = false;
    this.score = 0;
    this.loopId = null;

    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  pause() {
    this.isRunning = false;
    cancelAnimationFrame(this.loopId);
    this.loopId = null;
    console.log('Игра на паузе');
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
      console.log('Игра возобновлена');
    }
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.render();
    this.loopId = requestAnimationFrame(() => this.loop());
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  update() {
    // обновление игровой логики
  }

  render() {
    // отрисовка кадра
  }
}

const game = new Game();
game.start();
```

## Поддержка браузеров и совместимость

Page Visibility API поддерживается во всех современных браузерах без исключения. Вендорные префиксы (`webkit`, `moz`) были актуальны до 2013 года — сейчас они не нужны.

Проверка поддержки на случай, если код должен работать в очень старых окружениях:

```javascript
function isPageVisibilitySupported() {
  return typeof document.hidden !== 'undefined';
}

if (isPageVisibilitySupported()) {
  document.addEventListener('visibilitychange', handleChange);
} else {
  // запасной вариант через focus/blur
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
}
```

На практике проверка нужна крайне редко — API поддерживается с IE 10+, Firefox 18+, Chrome 14+, Safari 7+.

## Типичные ошибки

### Игнорирование начального состояния

Событие `visibilitychange` срабатывает только при изменении состояния. Если страница загружается уже в скрытом состоянии (например, открыта через `window.open` в фоне), событие не придёт. Всегда проверяйте начальное состояние при инициализации:

```javascript
function initializeApp() {
  if (!document.hidden) {
    startHeavyWork();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopHeavyWork();
    } else {
      startHeavyWork();
    }
  });
}
```

### Утечка обработчиков событий

Если компоненты создаются и уничтожаются динамически, важно удалять обработчики при уничтожении:

```javascript
class VideoPlayer {
  constructor(element) {
    this.video = element;
    this.handleVisibility = this.handleVisibility.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  handleVisibility() {
    if (document.hidden) {
      this.video.pause();
    } else {
      this.video.play();
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.video = null;
  }
}
```

### Смешивание с событиями focus/blur

`visibilitychange` и `focus`/`blur` решают разные задачи. `focus`/`blur` реагируют на активность конкретного окна, а `visibilitychange` — на фактическую видимость страницы. Не заменяйте одно другим.

## Интеграция с React

В React удобно инкапсулировать логику в кастомный хук:

```javascript
import { useState, useEffect } from 'react';

function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleChange);

    return () => {
      document.removeEventListener('visibilitychange', handleChange);
    };
  }, []);

  return isVisible;
}

// использование в компоненте
function VideoComponent() {
  const isVisible = usePageVisibility();

  useEffect(() => {
    const video = document.querySelector('video');
    if (!video) return;

    if (isVisible) {
      video.play();
    } else {
      video.pause();
    }
  }, [isVisible]);

  return <video src="/video.mp4" controls />;
}
```

## Связь с другими API

Page Visibility API хорошо сочетается с:

- **Intersection Observer API** — определяет, виден ли конкретный элемент в области просмотра (не вся страница целиком)
- **Network Information API** — позволяет дополнительно учитывать качество соединения при принятии решений об оптимизации
- **Background Sync API** (Service Workers) — позволяет откладывать сетевые запросы до момента, когда страница снова станет активной
- **Navigator.sendBeacon** — надёжная отправка аналитики при уходе пользователя, работает даже если страница закрывается

Комбинирование этих инструментов позволяет строить по-настоящему отзывчивые и ресурсоэффективные приложения.

## Итог

Page Visibility API — простой, но мощный инструмент для оптимизации браузерных приложений. Два свойства (`document.visibilityState`, `document.hidden`) и одно событие (`visibilitychange`) дают полный контроль над поведением страницы в зависимости от её видимости.

Основные сценарии применения:
- Пауза медиа и анимаций при переходе на фоновую вкладку
- Остановка таймеров и polling-запросов для экономии ресурсов
- Точный подсчёт активного времени для аналитики
- Обновление данных при возврате пользователя
- Визуальные уведомления через изменение заголовка вкладки

Всегда проверяйте начальное состояние `document.hidden` при инициализации и не забывайте удалять обработчики событий во избежание утечек памяти.

Чтобы углублённо изучить JavaScript и научиться эффективно работать с браузерными API, рекомендуем курс [JavaScript от PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=page-visibility-api).
