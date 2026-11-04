---
metaTitle: "Navigation API в JavaScript — управление навигацией"
metaDescription: "Navigation API в JavaScript: перехват переходов, управление историей, работа с navigate-событиями. Примеры использования в SPA-приложениях."
author: "Антон Ларичев"
title: "JavaScript Navigation API — управление навигацией в браузере"
preview: "Разбираем Navigation API — современный способ управлять навигацией в браузере без хаков с History API."
---

## Что такое Navigation API

Navigation API — это современный браузерный интерфейс для управления навигацией, который пришёл на смену перегруженному `History API`. Он позволяет перехватывать переходы между страницами, программно управлять историей и реагировать на изменения URL — всё через единый, последовательный интерфейс.

До появления Navigation API разработчики были вынуждены комбинировать `window.history`, `window.location`, события `popstate` и `hashchange`, а также самостоятельно обрабатывать переходы через `<a>` и `fetch`. Результат — хрупкий код с множеством крайних случаев. Navigation API решает эти проблемы на уровне платформы.

API доступен через глобальный объект `window.navigation`.

```javascript
console.log(window.navigation); // Navigation {}
```

## Поддержка браузерами

По состоянию на 2024 год Navigation API поддерживается в Chromium-браузерах (Chrome 102+, Edge 102+, Opera). Firefox и Safari поддержку ещё не добавили, поэтому для продакшена необходимо проверять наличие API:

```javascript
if ('navigation' in window) {
  // Navigation API доступен
} else {
  // Fallback на History API
}
```

## Основные концепции

### NavigationEntry

Каждая запись в истории браузера представлена объектом `NavigationEntry`. У него есть несколько ключевых свойств:

```javascript
const entry = navigation.currentEntry;

console.log(entry.url);       // текущий URL
console.log(entry.key);       // уникальный ключ записи (не меняется при переходах)
console.log(entry.id);        // идентификатор конкретного посещения
console.log(entry.index);     // позиция в истории (0, 1, 2...)
console.log(entry.sameDocument); // true, если переход был внутри одного документа
```

Ключ `key` стабилен — если пользователь вернулся назад и снова перешёл вперёд, `key` остаётся тем же. `id` же генерируется заново при каждом посещении записи.

### Получение всех записей истории

```javascript
const entries = navigation.entries();

entries.forEach((entry, index) => {
  console.log(`[${index}] ${entry.url}`);
});
```

В отличие от `History API`, где доступна только длина истории, Navigation API предоставляет полный список записей текущей сессии.

## Событие navigate

Центральное событие Navigation API — `navigate`. Оно срабатывает при любом переходе: клике по ссылке, вызове `navigation.navigate()`, переходе назад/вперёд, изменении URL через `pushState`.

```javascript
navigation.addEventListener('navigate', (event) => {
  console.log('Переход на:', event.destination.url);
  console.log('Тип перехода:', event.navigationType);
});
```

### Объект NavigateEvent

Объект события содержит подробную информацию о переходе:

```javascript
navigation.addEventListener('navigate', (event) => {
  const {
    destination,      // NavigationDestination — куда переходим
    navigationType,   // 'push' | 'replace' | 'reload' | 'traverse'
    canIntercept,     // можно ли перехватить переход
    userInitiated,    // инициирован ли переход пользователем
    hashChange,       // изменился ли только хэш
    signal,           // AbortSignal для отмены загрузки
    formData,         // FormData при отправке формы
  } = event;

  console.log(destination.url);
  console.log(destination.key);
  console.log(destination.index);
  console.log(destination.sameDocument);
});
```

### Перехват навигации через intercept()

Метод `event.intercept()` позволяет взять управление переходом на себя. Браузер ждёт завершения переданного промиса и обновляет URL только после этого:

```javascript
navigation.addEventListener('navigate', (event) => {
  const url = new URL(event.destination.url);

  // Перехватываем только переходы внутри нашего сайта
  if (!url.pathname.startsWith('/app')) return;

  // Перехват разрешён только для определённых типов
  if (!event.canIntercept) return;

  event.intercept({
    async handler() {
      // Показываем индикатор загрузки
      showLoadingSpinner();

      try {
        // Загружаем данные для новой страницы
        const data = await fetchPageData(url.pathname);
        // Рендерим содержимое
        renderPage(data);
      } finally {
        hideLoadingSpinner();
      }
    },
  });
});
```

Пока `handler` не завершится, браузер отображает состояние загрузки (например, favicon со спиннером в Chrome). Если промис отклонится — переход будет отменён.

### Параметр scroll в intercept()

Можно управлять поведением прокрутки после перехода:

```javascript
event.intercept({
  scroll: 'after-transition', // прокрутить после завершения handler (по умолчанию)
  // scroll: 'manual',        // управлять прокруткой вручную
  async handler() {
    await loadContent();
  },
});
```

## Программная навигация

### navigation.navigate()

Метод для перехода на новый URL:

```javascript
// Простой переход
navigation.navigate('/about');

// Переход с состоянием
navigation.navigate('/product/42', {
  state: { fromSearch: true, query: 'laptop' },
});

// Замена текущей записи в истории
navigation.navigate('/login', { history: 'replace' });
```

Возвращаемое значение — объект с двумя промисами:

```javascript
const { committed, finished } = navigation.navigate('/dashboard');

// committed — URL уже изменился, но handler ещё выполняется
await committed;
console.log('URL обновлён:', navigation.currentEntry.url);

// finished — handler завершился
await finished;
console.log('Переход полностью завершён');
```

### navigation.reload()

```javascript
// Перезагрузка с обновлением состояния
navigation.reload({
  state: { ...navigation.currentEntry.getState(), refreshed: true },
});
```

### Навигация по истории

```javascript
// Назад
navigation.back();

// Вперёд
navigation.forward();

// Переход на конкретную запись по ключу
const targetEntry = navigation.entries().find(e => e.url.includes('/home'));
if (targetEntry) {
  navigation.traverseTo(targetEntry.key);
}
```

Все эти методы также возвращают `{ committed, finished }`.

## Работа с состоянием

Navigation API предоставляет встроенный механизм хранения состояния, привязанного к записи истории:

```javascript
// Запись состояния при навигации
navigation.navigate('/cart', {
  state: {
    items: cartItems,
    total: calculateTotal(cartItems),
  },
});

// Чтение состояния текущей записи
const state = navigation.currentEntry.getState();
console.log(state.items);

// Обновление состояния без изменения URL
const currentState = navigation.currentEntry.getState() ?? {};
navigation.updateCurrentEntry({
  state: { ...currentState, lastVisited: Date.now() },
});
```

Состояние сериализуется через structured clone — можно хранить объекты, массивы, Map, Set, но не функции и DOM-узлы.

## Событие navigatesuccess и navigateerror

```javascript
navigation.addEventListener('navigatesuccess', () => {
  console.log('Переход завершён успешно');
  analytics.track('page_view', { url: navigation.currentEntry.url });
});

navigation.addEventListener('navigateerror', (event) => {
  console.error('Ошибка навигации:', event.error);
  showErrorPage();
});
```

## Практический пример: роутер для SPA

Объединим всё вместе и напишем минималистичный роутер:

```javascript
const routes = {
  '/': () => import('./pages/Home.js'),
  '/about': () => import('./pages/About.js'),
  '/users': () => import('./pages/Users.js'),
  '/users/:id': () => import('./pages/UserDetail.js'),
};

function matchRoute(pathname) {
  for (const [pattern, loader] of Object.entries(routes)) {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'
    );
    const match = pathname.match(regex);
    if (match) {
      return { loader, params: match.slice(1) };
    }
  }
  return null;
}

async function renderRoute(pathname, signal) {
  const matched = matchRoute(pathname);

  if (!matched) {
    document.getElementById('app').innerHTML = '<h1>404 — страница не найдена</h1>';
    return;
  }

  const { default: Page } = await matched.loader();

  // Проверяем, не была ли навигация отменена
  if (signal.aborted) return;

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(new Page(matched.params).render());
}

if ('navigation' in window) {
  navigation.addEventListener('navigate', (event) => {
    const url = new URL(event.destination.url);

    if (!event.canIntercept || url.origin !== location.origin) return;

    event.intercept({
      async handler() {
        await renderRoute(url.pathname, event.signal);
      },
    });
  });

  // Рендерим начальное состояние
  renderRoute(location.pathname, new AbortController().signal);
}
```

### Добавляем ссылки

Так как Navigation API перехватывает все переходы автоматически, обычные `<a href="...">` работают без дополнительных обработчиков:

```html
<nav>
  <a href="/">Главная</a>
  <a href="/about">О нас</a>
  <a href="/users">Пользователи</a>
</nav>
```

Клик по ссылке вызовет `navigate`-событие, которое перехватит наш роутер.

## Отмена навигации

Если нужно заблокировать переход — например, при несохранённых изменениях в форме:

```javascript
let hasUnsavedChanges = false;

document.querySelector('form').addEventListener('input', () => {
  hasUnsavedChanges = true;
});

navigation.addEventListener('navigate', (event) => {
  if (hasUnsavedChanges) {
    const confirmed = confirm('Есть несохранённые изменения. Уйти со страницы?');
    if (!confirmed) {
      event.preventDefault();
      return;
    }
    hasUnsavedChanges = false;
  }
});
```

`event.preventDefault()` полностью отменяет переход.

## Navigation API против History API

| Возможность | History API | Navigation API |
|---|---|---|
| Перехват любых переходов | Только через обёртки | Встроено |
| Список записей истории | Только длина | Полный список |
| Состояние записи | `history.state` | `entry.getState()` |
| Отмена перехода | Нет | `event.preventDefault()` |
| Асинхронный handler | Нет | Встроено |
| AbortSignal | Нет | `event.signal` |

## Итог

Navigation API устраняет фундаментальные недостатки `History API`: теперь не нужно отдельно слушать `popstate`, перехватывать клики по ссылкам и патчить `pushState`. Единое событие `navigate` покрывает все сценарии, а `intercept()` делает асинхронную загрузку данных первоклассным примитивом.

Для продакшена пока нужен полифил или проверка `'navigation' in window` с фолбэком на History API, но для Chromium-окружений API уже готов к использованию.

Чтобы глубже разобраться в браузерных API, асинхронности и всех современных возможностях JavaScript — приходите на курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=javascript-navigation-api).