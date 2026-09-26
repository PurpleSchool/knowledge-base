---
metaTitle: "Debounce и throttle в JavaScript — реализация и примеры"
metaDescription: "Разбираем debounce и throttle в JavaScript: как работают, чем отличаются, реализация с нуля и практические примеры применения."
author: "Антон Ларичев"
title: "Debounce и throttle функции в JavaScript"
preview: "Debounce и throttle — техники оптимизации вызовов функций. Разбираем отличия, пишем реализации с нуля и разбираем практические сценарии."
---

## Зачем нужны debounce и throttle

Некоторые события в браузере могут срабатывать десятки и сотни раз в секунду: прокрутка страницы (`scroll`), изменение размера окна (`resize`), ввод текста (`input`), движение мыши (`mousemove`). Если на каждое из этих событий навешен обработчик, выполняющий тяжёлую работу — запрос к серверу, перерасчёт DOM, фильтрация большого массива — производительность приложения заметно падает.

Для решения этой проблемы используют два паттерна:

- **debounce** — откладывает выполнение функции до тех пор, пока события не прекратятся на заданное время.
- **throttle** — гарантирует, что функция вызывается не чаще одного раза за указанный интервал.

Оба паттерна являются обёртками над исходной функцией и управляют тем, *когда* она выполняется, не меняя *что* она делает.

---

## Debounce

### Принцип работы

Представьте поиск с автодополнением: пользователь набирает «JavaScript» по одной букве. Без debounce каждый нажатый символ вызывает запрос к серверу — итого 10 запросов вместо одного нужного.

Debounce работает иначе: при каждом вызове он сбрасывает таймер и запускает его заново. Реальный вызов функции происходит только тогда, когда таймер наконец истекает — то есть когда пользователь перестал печатать.

```
Нажатия:   J  a  v  a  S  c  r  i  p  t
Таймеры:   |--|--|--|--|--|--|--|--|--|--|
                                        ^
                               Вызов функции
```

### Реализация debounce

```javascript
function debounce(fn, delay) {
  let timerId;

  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

Что здесь происходит:

1. `debounce` возвращает новую функцию-обёртку.
2. При каждом вызове обёртки предыдущий таймер сбрасывается через `clearTimeout`.
3. Запускается новый таймер на `delay` миллисекунд.
4. Если за это время обёртка не была вызвана снова — исходная функция `fn` выполняется.

Использование `fn.apply(this, args)` важно для корректной передачи контекста и аргументов.

### Пример: поиск с debounce

```javascript
const searchInput = document.getElementById('search');

function fetchResults(query) {
  console.log(`Запрос к серверу: "${query}"`);
  // fetch(`/api/search?q=${query}`)...
}

const debouncedSearch = debounce(fetchResults, 400);

searchInput.addEventListener('input', (event) => {
  debouncedSearch(event.target.value);
});
```

Пользователь может печатать сколько угодно быстро — запрос к серверу отправится только через 400 мс после последнего нажатия.

### Debounce с немедленным вызовом (leading edge)

Иногда нужно, чтобы функция вызвалась *сразу* при первом событии, а последующие вызовы во время паузы игнорировались. Это называется trailing/leading поведение.

```javascript
function debounce(fn, delay, immediate = false) {
  let timerId;

  return function (...args) {
    const callNow = immediate && !timerId;

    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);

    if (callNow) {
      fn.apply(this, args);
    }
  };
}
```

При `immediate = true` функция выполнится сразу, а повторные вызовы в течение `delay` мс будут заблокированы.

---

## Throttle

### Принцип работы

Throttle обеспечивает равномерный ритм вызовов: не важно, как часто происходит событие — функция выполняется строго раз в `N` миллисекунд.

```
События:   | | | | | | | | | | | | | |
Вызовы:    |         |         |         |
           <--200ms--><--200ms--><--200ms-->
```

Это полезно там, где важна *непрерывность* реакции на событие, а не только финальное состояние. Например, при прокрутке страницы нужно постоянно обновлять индикатор позиции — не только когда пользователь остановился.

### Реализация throttle

```javascript
function throttle(fn, interval) {
  let lastCallTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastCallTime >= interval) {
      lastCallTime = now;
      fn.apply(this, args);
    }
  };
}
```

Логика простая:

1. Запоминаем время последнего реального вызова в `lastCallTime`.
2. При каждом срабатывании проверяем, прошло ли достаточно времени.
3. Если да — обновляем метку и вызываем функцию.

### Реализация throttle через setTimeout

Альтернативный подход с таймером сохраняет «хвостовой» вызов — функция дополнительно выполнится в конце интервала с последними аргументами:

```javascript
function throttle(fn, interval) {
  let timerId = null;

  return function (...args) {
    if (timerId !== null) {
      return;
    }

    fn.apply(this, args);

    timerId = setTimeout(() => {
      timerId = null;
    }, interval);
  };
}
```

### Пример: обработка scroll с throttle

```javascript
function updateScrollIndicator() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;

  document.getElementById('progress-bar').style.width = `${progress}%`;
}

const throttledScroll = throttle(updateScrollIndicator, 100);

window.addEventListener('scroll', throttledScroll);
```

Без throttle `updateScrollIndicator` вызывалась бы при каждом пикселе прокрутки — до 60 раз в секунду. С throttle в 100 мс — не более 10 раз в секунду, что достаточно для плавной анимации.

### Пример: обработка resize с throttle

```javascript
function recalculateLayout() {
  console.log(`Новые размеры: ${window.innerWidth}x${window.innerHeight}`);
  // Пересчёт сетки, графиков, позиционирования...
}

const throttledResize = throttle(recalculateLayout, 200);

window.addEventListener('resize', throttledResize);
```

---

## Сравнение debounce и throttle

| Критерий | Debounce | Throttle |
|---|---|---|  
| Когда вызывается | После паузы в событиях | Равномерно через интервал |
| Вызывается во время активных событий | Нет | Да |
| Вызывается после остановки событий | Да | Нет (если не задан trailing) |
| Типичный сценарий | Поиск, валидация форм | Scroll, resize, mousemove |

**Правило выбора:**

- Используйте **debounce**, когда важен только *конечный* результат серии событий (пользователь закончил печатать, закончил изменять размер окна).
- Используйте **throttle**, когда нужна *регулярная* реакция на продолжающееся событие (индикатор прокрутки, live-трекинг мыши, игровые механики).

---

## Практические сценарии

### Валидация формы — debounce

```javascript
const emailInput = document.getElementById('email');

function validateEmail(value) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const hint = document.getElementById('email-hint');
  hint.textContent = isValid ? '' : 'Некорректный email';
  hint.style.color = 'red';
}

const debouncedValidate = debounce(validateEmail, 500);

emailInput.addEventListener('input', (e) => debouncedValidate(e.target.value));
```

### Отслеживание движения мыши — throttle

```javascript
const cursor = document.getElementById('custom-cursor');

function moveCursor(event) {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
}

// 60fps = ~16ms, throttle на 16ms для плавности
const throttledMove = throttle(moveCursor, 16);

document.addEventListener('mousemove', throttledMove);
```

### Автосохранение — debounce

```javascript
const editor = document.getElementById('editor');

async function saveContent(content) {
  await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('Сохранено');
}

const debouncedSave = debounce(saveContent, 1000);

editor.addEventListener('input', (e) => debouncedSave(e.target.value));
```

Автосохранение сработает через секунду после того, как пользователь перестал печатать.

---

## Отмена debounce и throttle

В реальных приложениях часто нужно иметь возможность отменить отложенный вызов — например, при размонтировании компонента.

```javascript
function debounce(fn, delay) {
  let timerId;

  function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  }

  debounced.cancel = function () {
    clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}

// Использование
const debouncedSearch = debounce(fetchResults, 300);

// При размонтировании компонента
window.addEventListener('beforeunload', () => {
  debouncedSearch.cancel();
});
```

---

## Использование Lodash

Если в проекте уже используется Lodash, нет смысла писать реализации вручную — в библиотеке есть готовые `_.debounce` и `_.throttle` с поддержкой leading/trailing режимов и метода `.cancel()`:

```javascript
import { debounce, throttle } from 'lodash';

const debouncedSearch = debounce(fetchResults, 300, { leading: false, trailing: true });
const throttledScroll = throttle(updateScrollIndicator, 100, { leading: true, trailing: true });

// Отмена
debouncedSearch.cancel();

// Немедленный вызов
debouncedSearch.flush();
```

Параметр `leading: true` вызывает функцию в начале интервала, `trailing: true` — в конце. Можно включить оба.

---

## Debounce и throttle в React

В React важно создавать обёрнутые функции только один раз, иначе при каждом ре-рендере будет создаваться новый экземпляр с обнулённым таймером.

```javascript
import { useCallback, useRef } from 'react';

function useDebounce(fn, delay) {
  const timerRef = useRef(null);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}

// В компоненте
function SearchComponent() {
  const handleSearch = useDebounce((query) => {
    console.log('Поиск:', query);
  }, 400);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

Для более полных реализаций с поддержкой cleanup и TypeScript стоит использовать библиотеки `use-debounce` или `ahooks`.

---

## Распространённые ошибки

**Создание новой обёртки при каждом рендере**

```javascript
// Неправильно — новый debounce при каждом рендере
element.addEventListener('input', debounce(handler, 300));

// Правильно — создать один раз
const debouncedHandler = debounce(handler, 300);
element.addEventListener('input', debouncedHandler);
```

**Потеря контекста `this`**

```javascript
class Form {
  constructor() {
    // Правильно — привязываем контекст
    this.debouncedValidate = debounce(this.validate.bind(this), 300);
  }

  validate() {
    console.log(this); // Form, а не undefined
  }
}
```

**Слишком большая задержка для throttle**

Для визуальных обновлений (скролл, мышь) задержка throttle должна соответствовать частоте кадров: 16 мс для 60 fps. Значения 500 мс и выше сделают интерфейс «дёрганым».

---

Чтобы глубже разобраться с оптимизацией JavaScript-кода, паттернами функций высшего порядка и другими практическими техниками — пройдите курс по JavaScript на PurpleSchool:

[JavaScript курс на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=debounce-throttle)
