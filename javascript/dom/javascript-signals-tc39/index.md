---
metaTitle: "JavaScript Signals TC39: нативная реактивность в JS"
metaDescription: "Разбираем TC39 Signals proposal: Signal.State, Signal.Computed, Watcher. Как нативная реактивность меняет подход к управлению состоянием в JavaScript."
author: "Антон Ларичев"
title: "JavaScript Signals (TC39): реактивность нативно"
preview: "TC39 Signals proposal приносит нативную реактивность в JavaScript: разбираем Signal.State, Signal.Computed и Watcher с практическими примерами."
---

## Что такое сигналы и зачем они нужны

Реактивное программирование — это парадигма, при которой вычисления автоматически обновляются при изменении зависимостей. Вместо того чтобы явно вызывать функцию пересчёта, вы описываете зависимости один раз, и система сама отслеживает изменения.

Фреймворки давно решают эту задачу по-своему: `ref` и `computed` в Vue 3, `signal` в Solid.js, `signal` в Angular 16+, `atom` в Jotai, `observable` в MobX. Каждый фреймворк реализовал реактивные примитивы независимо, что приводит к нескольким проблемам:

- Код с реактивным состоянием невозможно переносить между фреймворками
- Библиотеки не могут создавать реактивные абстракции, работающие в любой среде
- Нет стандартного протокола для интеграции реактивных систем

TC39 Signals Proposal (предложение для стандарта ECMAScript) решает эту проблему, добавляя реактивные примитивы на уровень языка.

## Текущее состояние без нативных сигналов

Чтобы понять ценность предложения, посмотрим на типичный код управления состоянием без сигналов:

```javascript
// Классический подход: явный пересчёт
let price = 10;
let quantity = 5;
let total = price * quantity; // 50

price = 20;
// total всё ещё 50 — нужно явно обновить
total = price * quantity; // 100
```

При разрастании приложения такой подход становится неуправляемым: нужно помнить, что именно нужно пересчитать после каждого изменения. Фреймворки автоматизируют это через подписки, прокси или компиляцию, но каждый по-своему.

Вот как та же логика выглядит в разных фреймворках:

```javascript
// Vue 3
import { ref, computed } from 'vue';
const price = ref(10);
const quantity = ref(5);
const total = computed(() => price.value * quantity.value);

// Solid.js
import { createSignal, createMemo } from 'solid-js';
const [price, setPrice] = createSignal(10);
const [quantity, setQuantity] = createSignal(5);
const total = createMemo(() => price() * quantity());

// Angular 16+
import { signal, computed } from '@angular/core';
const price = signal(10);
const quantity = signal(5);
const total = computed(() => price() * quantity());
```

Семантика похожа, но API несовместимы. Библиотека, написанная под Vue, не может передавать реактивное состояние в Solid-компонент.

## TC39 Signals Proposal: суть предложения

ТC39 Signals Proposal — это предложение добавить в JavaScript стандартные реактивные примитивы. На момент написания статьи предложение находится на стадии Stage 1, что означает: комитет заинтересован в идее, но API ещё может существенно измениться до финального утверждения.

Основная цель — не заменить сигналы во фреймворках, а предоставить нижний уровень, на котором фреймворки смогут строить свои абстракции совместимым образом. Это похоже на то, как `Promise` стандартизировал асинхронность, не убив существующие решения.

Предложение вводит три ключевых примитива:

- `Signal.State` — записываемый сигнал с изменяемым значением
- `Signal.Computed` — вычисляемый сигнал, зависящий от других сигналов
- `Signal.subtle.Watcher` — низкоуровневый механизм для запуска эффектов при изменениях

## Signal.State: управляемое состояние

`Signal.State` — это контейнер для значения, которое может меняться со временем. При каждом изменении все зависящие от него вычисляемые сигналы помечаются как устаревшие.

```javascript
import { Signal } from 'signal-polyfill';

// Создание сигнала с начальным значением
const count = new Signal.State(0);

// Чтение значения
console.log(count.get()); // 0

// Запись нового значения
count.set(1);
console.log(count.get()); // 1
```

В отличие от обычной переменной, `Signal.State` отслеживает, кто его читает. Когда значение изменяется, все читатели уведомляются автоматически.

Можно передавать опции при создании:

```javascript
const user = new Signal.State(
  { name: 'Alice', age: 30 },
  {
    // Кастомная функция сравнения
    // Если вернёт true — сигнал не считается изменённым
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
  }
);

user.set({ name: 'Alice', age: 30 }); // Не вызовет обновление — значения равны
user.set({ name: 'Bob', age: 25 });   // Вызовет обновление
```

Опция `equals` позволяет избежать лишних обновлений при работе с объектами — по умолчанию используется `Object.is`, которое для объектов всегда возвращает `false` при создании нового объекта с теми же данными.

## Signal.Computed: производные значения

`Signal.Computed` создаёт сигнал, значение которого автоматически вычисляется из других сигналов. Вычисление происходит лениво — только при первом чтении и при чтении после того, как одна из зависимостей изменилась.

```javascript
import { Signal } from 'signal-polyfill';

const price = new Signal.State(100);
const discount = new Signal.State(0.1); // 10%

const finalPrice = new Signal.Computed(() => {
  return price.get() * (1 - discount.get());
});

console.log(finalPrice.get()); // 90

price.set(200);
console.log(finalPrice.get()); // 180 — пересчитано автоматически

discount.set(0.2);
console.log(finalPrice.get()); // 160 — снова пересчитано
```

Важная особенность — `Signal.Computed` кеширует результат. Если вы читаете его несколько раз подряд без изменения зависимостей, функция-вычислитель вызывается только один раз:

```javascript
let computeCount = 0;

const expensive = new Signal.Computed(() => {
  computeCount++;
  return price.get() * 2;
});

console.log(expensive.get()); // computeCount: 1
console.log(expensive.get()); // computeCount: 1 — не пересчитывается
console.log(expensive.get()); // computeCount: 1 — не пересчитывается

price.set(300);
console.log(expensive.get()); // computeCount: 2 — пересчитан после изменения
```

Вложенные вычисляемые сигналы работают ожидаемо — зависимости отслеживаются транзитивно:

```javascript
const a = new Signal.State(1);
const b = new Signal.Computed(() => a.get() * 2);
const c = new Signal.Computed(() => b.get() + 10);

console.log(c.get()); // 12
a.set(5);
console.log(c.get()); // 20 — c зависит от b, b зависит от a
```

## Signal.subtle.Watcher: наблюдатели и эффекты

`Signal.subtle.Watcher` — низкоуровневый API для запуска произвольного кода при изменении сигналов. Он намеренно вынесен в `subtle`-пространство (аналогично `crypto.subtle` в Web Crypto API) — это сигнал о том, что прямое использование сложно и предназначено для разработчиков фреймворков.

```javascript
import { Signal } from 'signal-polyfill';

const name = new Signal.State('Alice');

// Создаём наблюдатель с колбэком
const watcher = new Signal.subtle.Watcher((notified) => {
  // Вызывается синхронно при пометке сигнала как грязного
  // НЕ вызывает compute — это делается вручную
  console.log('Сигнал изменился, нужно обновить эффект');
});

// Отслеживаем вычисляемый сигнал
const greeting = new Signal.Computed(() => `Привет, ${name.get()}!`);

watcher.watch(greeting);
greeting.get(); // Нужно прочитать, чтобы установить зависимости

name.set('Bob'); // Вызовет колбэк наблюдателя
```

Важный момент: колбэк наблюдателя вызывается синхронно в момент изменения, но до перевычисления. Это позволяет фреймворкам планировать обновления батчами — например, откладывать перерисовку DOM до следующего микрозадания.

Типичный паттерн построения эффекта поверх `Watcher`:

```javascript
import { Signal } from 'signal-polyfill';

function effect(fn) {
  let scheduled = false;

  const watcher = new Signal.subtle.Watcher(() => {
    if (!scheduled) {
      scheduled = true;
      // Откладываем выполнение до следующей микрозадачи
      queueMicrotask(() => {
        scheduled = false;
        watcher.watch(); // Возобновляем наблюдение
        computed.get(); // Перевычисляем
      });
    }
  });

  const computed = new Signal.Computed(() => {
    fn();
  });

  watcher.watch(computed);
  computed.get(); // Первоначальное выполнение

  // Возвращаем функцию отписки
  return () => watcher.unwatch(computed);
}

// Использование
const count = new Signal.State(0);

const dispose = effect(() => {
  console.log(`Текущее значение: ${count.get()}`);
});
// Вывод: "Текущее значение: 0"

count.set(1);
// После микрозадачи вывод: "Текущее значение: 1"

dispose(); // Отписываемся от обновлений
```

## Практический пример: корзина покупок

Соберём реалистичный пример с несколькими взаимосвязанными сигналами:

```javascript
import { Signal } from 'signal-polyfill';

// Состояние корзины
const items = new Signal.State([
  { name: 'Курс TypeScript', price: 2990, qty: 1 },
  { name: 'Курс React', price: 3490, qty: 2 },
]);

const promoCode = new Signal.State(null);

// Вычисляемые значения
const subtotal = new Signal.Computed(() =>
  items.get().reduce((sum, item) => sum + item.price * item.qty, 0)
);

const discount = new Signal.Computed(() => {
  const code = promoCode.get();
  if (code === 'PURPLE20') return 0.2;
  if (code === 'PURPLE10') return 0.1;
  return 0;
});

const total = new Signal.Computed(() =>
  Math.round(subtotal.get() * (1 - discount.get()))
);

const itemCount = new Signal.Computed(() =>
  items.get().reduce((sum, item) => sum + item.qty, 0)
);

console.log(subtotal.get());  // 9970
console.log(total.get());     // 9970
console.log(itemCount.get()); // 3

// Применяем промокод
promoCode.set('PURPLE20');
console.log(total.get()); // 7976

// Добавляем товар
const currentItems = items.get();
items.set([
  ...currentItems,
  { name: 'Курс Node.js', price: 2490, qty: 1 }
]);
console.log(subtotal.get());  // 12460
console.log(total.get());     // 9968
console.log(itemCount.get()); // 4
```

Видно, что все вычисляемые значения автоматически обновились при изменении зависимостей, без единого явного вызова.

## Граф зависимостей и ленивые вычисления

Одно из ключевых свойств сигналов — push-pull модель обновлений. Когда `Signal.State` изменяется, он "толкает" (push) уведомление об изменении вниз по графу зависимостей. Но само перевычисление происходит лениво — только когда кто-то "тянет" (pull) значение через `.get()`.

```javascript
const a = new Signal.State(1);
const b = new Signal.Computed(() => {
  console.log('b вычисляется');
  return a.get() * 2;
});
const c = new Signal.Computed(() => {
  console.log('c вычисляется');
  return b.get() + 10;
});

a.set(5);
// Ничего не выведено — никто ещё не читал c

console.log(c.get());
// "b вычисляется"
// "c вычисляется"
// 20
```

Это принципиально важно для производительности: если никто не читает вычисляемый сигнал, его функция никогда не вызовется, даже при изменении зависимостей.

## Сравнение с реализациями в фреймворках

TC39 Signals явно вдохновлены существующими реализациями. Вот таблица соответствий:

| TC39 Signals | Vue 3 | Solid.js | Angular | Preact Signals |
|---|---|---|---|---|
| `Signal.State` | `ref` | `createSignal` | `signal` | `signal` |
| `Signal.Computed` | `computed` | `createMemo` | `computed` | `computed` |
| `Signal.subtle.Watcher` | `watchEffect` (внутри) | `createEffect` (внутри) | `effect` (внутри) | `effect` (внутри) |

Фреймворки смогут использовать стандартные примитивы как основу, добавляя свои абстракции поверх. Это позволит, например, передавать реактивное состояние между компонентами разных фреймворков через общую библиотеку.

## Как попробовать сейчас

Поскольку предложение на стадии Stage 1, нативной поддержки в браузерах нет. Существует официальный полифилл:

```bash
npm install signal-polyfill
```

```javascript
import { Signal } from 'signal-polyfill';

const counter = new Signal.State(0);
const doubled = new Signal.Computed(() => counter.get() * 2);

console.log(doubled.get()); // 0
counter.set(5);
console.log(doubled.get()); // 10
```

Полифилл максимально точно следует спецификации и подходит для экспериментов и изучения API. Для продакшн-кода рекомендуется использовать зрелые реализации в фреймворках.

## Текущий статус и что будет дальше

TC39 Signals Proposal находится в активной разработке. Stage 1 означает, что:

- Комитет TC39 признал проблему реальной и стоящей решения
- Идут дискуссии о деталях API и семантике
- Финальный вид API может существенно отличаться от текущего
- До включения в стандарт остаётся как минимум несколько лет

Авторы предложения — разработчики из Google, Microsoft, Bloomberg и авторы популярных фреймворков. Это повышает шансы на то, что предложение будет принято с учётом реальных нужд экосистемы.

Следить за статусом можно в официальном репозитории: `tc39/proposal-signals` на GitHub.

## Итоги

TC39 Signals Proposal приносит в JavaScript стандартные примитивы реактивного программирования:

- `Signal.State` — записываемое реактивное значение
- `Signal.Computed` — производное значение с кешированием и ленивым вычислением
- `Signal.subtle.Watcher` — низкоуровневый механизм для эффектов

Главная ценность — не замена фреймворков, а создание общего языка для реактивных систем. Как `Promise` унифицировал асинхронный код, Signals могут унифицировать управление состоянием. Даже до принятия стандарта полезно понимать модель push-pull реактивности, которую Signals делают явной — эта модель лежит в основе Vue, Solid, Angular и MobX.

Чтобы углублённо изучить JavaScript, включая современные паттерны управления состоянием и другие продвинутые возможности языка, приходите на курс [JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=javascript-signals).