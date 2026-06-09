---
metaTitle: "WeakRef в JavaScript — слабые ссылки и сборщик мусора"
metaDescription: "Разбираем WeakRef в JavaScript: как создавать слабые ссылки на объекты, использовать FinalizationRegistry и управлять памятью в приложениях."
author: "Антон Ларичев"
title: "WeakRef в JavaScript"
preview: "Что такое WeakRef, зачем нужны слабые ссылки и как совместно использовать WeakRef и FinalizationRegistry для управления памятью."
---

## Что такое WeakRef

WeakRef — это объект, появившийся в ES2021 (ECMAScript 12), который позволяет хранить **слабую ссылку** на другой объект. Слабая ссылка отличается от обычной (сильной) тем, что не препятствует сборщику мусора удалить объект из памяти.

Чтобы понять суть, нужно разобраться в том, как работает сборщик мусора в JavaScript.

## Сильные и слабые ссылки

Когда вы создаёте переменную и присваиваете ей объект, между переменной и объектом в куче образуется **сильная ссылка**. Пока хотя бы одна сильная ссылка на объект существует, сборщик мусора не тронет объект.

```javascript
let user = { name: 'Алексей', age: 30 };
// user — сильная ссылка. Объект не будет удалён.

let alias = user;
// alias — ещё одна сильная ссылка на тот же объект.

user = null;
// Осталась одна сильная ссылка — alias.
// Объект всё ещё жив.

alias = null;
// Сильных ссылок нет. Объект будет удалён сборщиком мусора.
```

**Слабая ссылка** не влияет на счётчик сильных ссылок. Если на объект не осталось сильных ссылок, сборщик мусора может удалить его в любой момент — даже при наличии слабых ссылок.

```javascript
let user = { name: 'Алексей' };
const weakUser = new WeakRef(user);

user = null;
// Сильных ссылок нет. Сборщик мусора вправе удалить объект.
// weakUser всё ещё существует, но может указывать на уже удалённый объект.
```

## Создание WeakRef

Конструктор `WeakRef` принимает один аргумент — объект (или не-примитивное значение), на который нужно создать слабую ссылку.

```javascript
const obj = { data: 'важные данные' };
const ref = new WeakRef(obj);
```

Примитивы (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) передавать нельзя — будет выброшена ошибка `TypeError`.

```javascript
// Так нельзя:
const ref = new WeakRef(42); // TypeError
const ref2 = new WeakRef('строка'); // TypeError
```

## Метод deref()

Единственный метод экземпляра WeakRef — `deref()`. Он возвращает хранимый объект, если тот ещё не был удалён, или `undefined`, если объект уже собрал мусор.

```javascript
let cache = { result: [1, 2, 3] };
const ref = new WeakRef(cache);

// Получаем объект:
const value = ref.deref();
console.log(value); // { result: [1, 2, 3] }

// После того как сильных ссылок не останется:
cache = null;

// В какой-то момент после сборки мусора:
// ref.deref() вернёт undefined
```

Важно всегда проверять результат `deref()` на `undefined` перед использованием:

```javascript
function processCache(ref) {
  const data = ref.deref();
  if (data === undefined) {
    console.log('Объект был удалён сборщиком мусора');
    return null;
  }
  return data;
}
```

## FinalizationRegistry — уведомления об удалении объектов

Вместе с WeakRef в ES2021 появился `FinalizationRegistry`. Он позволяет зарегистрировать **колбэк**, который будет вызван, когда зарегистрированный объект будет удалён сборщиком мусора.

```javascript
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Объект с ключом "${heldValue}" был удалён`);
});

let user = { name: 'Мария' };
registry.register(user, 'user-maria');
// Второй аргумент — произвольное значение, которое будет передано в колбэк.

user = null;
// Когда сборщик мусора удалит объект, в консоли появится:
// «Объект с ключом "user-maria" был удалён»
```

Колбэк вызывается **асинхронно** и не гарантированно сразу после удаления объекта. Движок JavaScript может откладывать вызов финализатора.

### Отмена регистрации

`FinalizationRegistry` поддерживает токен отмены — третий аргумент метода `register`. Его можно передать в `unregister`, чтобы отписаться до удаления объекта:

```javascript
const registry = new FinalizationRegistry((key) => {
  console.log(`Удалён: ${key}`);
});

let obj = { value: 100 };
const token = {}; // токен — любой объект

registry.register(obj, 'my-key', token);

// Если передумали отслеживать:
registry.unregister(token);

obj = null;
// Колбэк уже не вызовется.
```

## Практический пример: кэш с автоматической инвалидацией

Один из самых распространённых сценариев применения WeakRef — **кэш**, который не удерживает объекты в памяти искусственно. Если объект больше не нужен другим частям программы, кэш не должен мешать его удалению.

```javascript
class WeakCache {
  #cache = new Map();
  #registry;

  constructor() {
    this.#registry = new FinalizationRegistry((key) => {
      // Удаляем запись из Map при сборке объекта
      const ref = this.#cache.get(key);
      if (ref !== undefined && ref.deref() === undefined) {
        this.#cache.delete(key);
        console.log(`Кэш: запись "${key}" удалена автоматически`);
      }
    });
  }

  set(key, value) {
    const ref = new WeakRef(value);
    this.#cache.set(key, ref);
    this.#registry.register(value, key);
  }

  get(key) {
    const ref = this.#cache.get(key);
    if (ref === undefined) return undefined;

    const value = ref.deref();
    if (value === undefined) {
      this.#cache.delete(key);
      return undefined;
    }
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }
}

// Использование:
const cache = new WeakCache();

let heavyData = { payload: new Array(1000).fill('данные') };
cache.set('heavy', heavyData);

console.log(cache.get('heavy')); // объект

heavyData = null;
// После сборки мусора:
// cache.get('heavy') вернёт undefined
// FinalizationRegistry очистит Map
```

## Пример: отслеживание DOM-элементов

WeakRef удобен при работе с DOM, когда нужно отслеживать элементы, не мешая их удалению при unmount:

```javascript
const elementRefs = new Map();
const cleanupRegistry = new FinalizationRegistry((id) => {
  elementRefs.delete(id);
  console.log(`Элемент #${id} удалён из DOM и очищен из реестра`);
});

function trackElement(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const ref = new WeakRef(element);
  elementRefs.set(id, ref);
  cleanupRegistry.register(element, id);
}

function getTrackedElement(id) {
  const ref = elementRefs.get(id);
  return ref ? ref.deref() : undefined;
}

trackElement('modal');

// Позже:
const modal = getTrackedElement('modal');
if (modal) {
  modal.style.display = 'none';
} else {
  console.log('Элемент уже удалён из DOM');
}
```

## Важные ограничения и нюансы

### Не используйте WeakRef как основной кэш

Сборщик мусора недетерминирован: вы не можете знать, когда именно объект будет удалён. В тестах объект может жить долго и создавать иллюзию работающего кэша, а на проде под нагрузкой удаляться немедленно.

```javascript
// Плохая идея — WeakRef как основное хранилище сессии:
const sessionRef = new WeakRef(loadSession());

// Нет гарантии, что сессия будет жить нужное время!
const session = sessionRef.deref(); // может быть undefined в любой момент
```

### WeakRef и синхронный код

Внутри одного **синхронного блока** кода сборщик мусора не запускается. Поэтому если `deref()` вернул объект, он гарантированно будет живым до конца текущего микрозадания:

```javascript
const ref = new WeakRef(someObject);

// Это безопасно — объект не исчезнет в середине синхронного блока:
const obj = ref.deref();
if (obj) {
  obj.doSomething();
  obj.doAnotherThing(); // obj всё ещё живой
}
```

### Регистр сборщика — деталь реализации

Спецификация не гарантирует, что сборщик мусора удалит объект сразу после обнуления всех сильных ссылок. Node.js и браузеры могут использовать разные стратегии: отложенный сбор, генерационный GC и т.д. Поведение может отличаться между средами и версиями движков.

### Не применяйте WeakRef для критических данных

Критические данные приложения (токены, пользовательские данные, конфигурация) должны храниться через обычные сильные ссылки. WeakRef — только для вспомогательных структур: кэшей, пулов ресурсов, слушателей событий.

## Отличие от WeakMap и WeakSet

До появления WeakRef разработчики использовали `WeakMap` и `WeakSet` для слабых ассоциаций с объектами. Разница принципиальная:

| Характеристика | WeakMap / WeakSet | WeakRef |
|---|---|---|n| Слабая ссылка на ключ/элемент | Да | — |
| Слабая ссылка на значение | Нет | Да |
| Прямой доступ к объекту | Через ключ | Через `deref()` |
| Уведомление об удалении | Нет | Через FinalizationRegistry |

```javascript
// WeakMap: слабая ссылка на КЛЮЧ
const wm = new WeakMap();
let key = {};
wm.set(key, 'value');
key = null;
// Запись в WeakMap автоматически исчезнет

// WeakRef: слабая ссылка на ЗНАЧЕНИЕ
const ref = new WeakRef({ data: 'value' });
// Хранит слабую ссылку на сам объект
```

## Реальный сценарий: пул виджетов

Предположим, в приложении создаются тяжёлые виджеты, и нужно переиспользовать их, если они ещё живы в памяти:

```javascript
const widgetPool = new Map();
const finalizationRegistry = new FinalizationRegistry((type) => {
  widgetPool.delete(type);
  console.log(`Виджет типа "${type}" освобождён`);
});

function getOrCreateWidget(type, factory) {
  const existingRef = widgetPool.get(type);
  if (existingRef) {
    const widget = existingRef.deref();
    if (widget) {
      console.log(`Переиспользуем виджет "${type}"`);
      return widget;
    }
  }

  console.log(`Создаём новый виджет "${type}"`);
  const widget = factory();
  const ref = new WeakRef(widget);
  widgetPool.set(type, ref);
  finalizationRegistry.register(widget, type);
  return widget;
}

// Пример использования:
function createChartWidget() {
  return {
    type: 'chart',
    render() { console.log('Рендеринг графика'); },
    destroy() { console.log('Виджет уничтожен'); }
  };
}

let chart = getOrCreateWidget('chart', createChartWidget);
chart.render(); // «Создаём новый виджет»

let chart2 = getOrCreateWidget('chart', createChartWidget);
chart2.render(); // «Переиспользуем виджет»

chart = null;
chart2 = null;
// После GC следующий вызов создаст новый виджет
```

## Поддержка в браузерах и Node.js

WeakRef и FinalizationRegistry поддерживаются во всех современных окружениях:

- Chrome 84+
- Firefox 79+
- Safari 14.1+
- Node.js 14.6+

Для старых окружений полноценный полифилл невозможен — поведение сборщика мусора нельзя воспроизвести программно.

## Когда применять WeakRef

WeakRef стоит использовать в следующих ситуациях:

- **Необязательные кэши** — когда кэш улучшает производительность, но потеря данных из кэша допустима.
- **Пулы объектов** — когда хочется переиспользовать объект, если он ещё жив.
- **Слушатели и наблюдатели** — когда объект-наблюдатель не должен удерживаться в памяти только из-за подписки.
- **Отладочные инструменты** — для отслеживания жизненного цикла объектов без влияния на него.

Во всех остальных случаях предпочтительнее использовать обычные ссылки, `WeakMap`/`WeakSet` или явное управление жизненным циклом.

---

Чтобы детально разобраться с управлением памятью, замыканиями и современными возможностями JavaScript — записывайтесь на курс [JavaScript для профессионалов](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=weakref-javascript) на PurpleSchool.