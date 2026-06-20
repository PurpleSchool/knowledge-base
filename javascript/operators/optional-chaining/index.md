---
metaTitle: "Optional chaining (?.) в JavaScript — оператор безопасного доступа"
metaDescription: "Optional chaining ?. в JavaScript — как безопасно обращаться к свойствам объекта, методам и элементам массива без ошибок TypeError. Примеры и практика."
author: "Антон Ларичев"
title: "Optional chaining (?.) в JavaScript"
preview: "Optional chaining (?.) позволяет безопасно обращаться к вложенным свойствам объекта без риска получить TypeError, если промежуточное значение равно null или undefined."
---

## Что такое optional chaining

Optional chaining (`?.`) — оператор, появившийся в ES2020, который позволяет читать значение вложенного свойства объекта без явной проверки каждого промежуточного звена на `null` или `undefined`. Если какое-либо промежуточное значение отсутствует, выражение немедленно возвращает `undefined` вместо выброса `TypeError`.

До появления этого оператора безопасное обращение к глубоко вложенным свойствам выглядело так:

```javascript
const city = user && user.address && user.address.city;
```

С optional chaining тот же код записывается в одну короткую строку:

```javascript
const city = user?.address?.city;
```

## Синтаксис

Оператор `?.` имеет три формы применения:

- `obj?.prop` — доступ к свойству объекта
- `obj?.[expr]` — доступ к свойству через скобочную нотацию
- `func?.()` — вызов функции или метода

Важно понимать семантику: оператор проверяет только левую часть от `?.`. Если она равна `null` или `undefined`, вычисление прекращается и возвращается `undefined`. Если нет — выполняется обычное обращение.

## Доступ к свойствам объекта

Самый распространённый сценарий — чтение данных из объекта, структура которого не гарантирована.

```javascript
const user = {
  name: 'Иван',
  address: {
    city: 'Москва',
    zip: '101000'
  }
};

console.log(user?.address?.city);   // 'Москва'
console.log(user?.phone?.number);   // undefined (не TypeError)
```

Без `?.` второй вызов выбросил бы ошибку `TypeError: Cannot read properties of undefined (reading 'number')`, потому что `user.phone` равно `undefined`.

Рассмотрим пример с API-ответом, где часть полей может отсутствовать:

```javascript
function getUserDisplayName(response) {
  const firstName = response?.data?.user?.profile?.firstName;
  const lastName = response?.data?.user?.profile?.lastName;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return response?.data?.user?.email ?? 'Аноним';
}

// Все варианты работают без ошибок
getUserDisplayName(null);                        // 'Аноним'
getUserDisplayName({});                          // 'Аноним'
getUserDisplayName({ data: { user: { email: 'ivan@example.com' } } }); // 'ivan@example.com'
getUserDisplayName({
  data: {
    user: {
      profile: { firstName: 'Иван', lastName: 'Петров' }
    }
  }
}); // 'Иван Петров'
```

## Скобочная нотация

Когда имя свойства вычисляется динамически, используется форма `obj?.[expr]`:

```javascript
const config = {
  theme: {
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa'
    }
  }
};

const colorKey = 'primary';
console.log(config?.theme?.colors?.[colorKey]); // '#7c3aed'

const missingKey = 'accent';
console.log(config?.theme?.colors?.[missingKey]); // undefined
```

Эта же форма применяется для безопасного доступа к элементам массива по индексу:

```javascript
const users = [
  { name: 'Анна', role: 'admin' },
  { name: 'Борис', role: 'user' }
];

const firstUser = users?.[0]?.name;  // 'Анна'
const thirdUser = users?.[2]?.name;  // undefined

// Массив может быть undefined
const emptyList = null;
console.log(emptyList?.[0]?.name);   // undefined
```

## Вызов функций и методов

Форма `func?.()` позволяет вызвать функцию только если она существует:

```javascript
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

logger.info?.('Приложение запущено');   // '[INFO] Приложение запущено'
logger.debug?.('Отладочное сообщение'); // ничего не происходит, не TypeError
```

Частый паттерн — опциональные коллбэки в функциях:

```javascript
function fetchData(url, options) {
  const { onSuccess, onError, onFinally } = options ?? {};

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      onSuccess?.(data);
      return data;
    })
    .catch((err) => {
      onError?.(err);
      throw err;
    })
    .finally(() => {
      onFinally?.();
    });
}

// Можно вызвать без коллбэков — ошибок не будет
fetchData('/api/users', {});

// И с коллбэками
fetchData('/api/users', {
  onSuccess: (data) => console.log('Получено:', data.length, 'записей'),
  onError: (err) => console.error('Ошибка:', err.message)
});
```

То же самое работает с методами объекта:

```javascript
class EventEmitter {
  constructor() {
    this.handlers = {};
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  emit(event, data) {
    this.handlers[event]?.(data);
  }
}

const emitter = new EventEmitter();
emitter.on('login', (user) => console.log(`Вошёл: ${user.name}`));

emitter.emit('login', { name: 'Мария' }); // 'Вошёл: Мария'
emitter.emit('logout', { name: 'Мария' }); // ничего — обработчик не зарегистрирован
```

## Комбинация с оператором ?? (nullish coalescing)

Операторы `?.` и `??` созданы дополнять друг друга. `?.` возвращает `undefined` при отсутствующем значении, а `??` позволяет задать значение по умолчанию:

```javascript
const settings = {
  display: {
    fontSize: 0  // намеренно 0, не отсутствие значения
  }
};

// Проблема с оператором ||
const fontSizeOr = settings?.display?.fontSize || 16;
console.log(fontSizeOr); // 16 — неправильно! 0 — валидное значение

// Правильно с оператором ??
const fontSizeNullish = settings?.display?.fontSize ?? 16;
console.log(fontSizeNullish); // 0 — корректно

// Практический пример
function getPageTitle(page) {
  return page?.meta?.title ?? page?.title ?? 'Без названия';
}

console.log(getPageTitle(null));                          // 'Без названия'
console.log(getPageTitle({ title: 'Главная' }));          // 'Главная'
console.log(getPageTitle({ meta: { title: 'О нас' } })); // 'О нас'
```

## Короткое замыкание

Optional chaining работает по принципу короткого замыкания: как только встречается `null` или `undefined`, вычисление всего выражения справа прекращается. Это означает, что побочные эффекты справа от `?.` не выполняются:

```javascript
let counter = 0;

const obj = null;
const result = obj?.method(counter++);

console.log(result);  // undefined
console.log(counter); // 0 — инкремент не произошёл
```

Это поведение важно учитывать, чтобы не допускать ситуаций, когда вы рассчитываете на выполнение кода правее `?.`, но объект оказывается `null`.

## Что нельзя делать с optional chaining

### Нельзя использовать слева от присваивания

`?.` — только для чтения, не для записи:

```javascript
const user = { profile: {} };

// Синтаксическая ошибка
user?.profile?.name = 'Иван'; // SyntaxError

// Правильно — сначала проверить, потом присвоить
if (user?.profile) {
  user.profile.name = 'Иван';
}
```

### Не стоит злоупотреблять

Optional chaining не должен заменять явную обработку ошибок и скрывать баги. Если объект всегда обязан существовать по логике приложения, лучше получить `TypeError` раньше, чем молча продолжать работу с `undefined`:

```javascript
// Плохо — скрывает потенциальный баг
function processOrder(order) {
  const total = order?.items?.reduce((sum, item) => sum + item.price, 0);
  sendConfirmation(total); // total может быть undefined!
}

// Лучше — явная проверка там, где данные действительно могут отсутствовать
function processOrder(order) {
  if (!order || !order.items) {
    throw new Error('Заказ должен содержать список товаров');
  }

  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  sendConfirmation(total);
}
```

## Реальные примеры использования

### Работа с DOM

```javascript
// Безопасное обращение к элементам, которые могут отсутствовать
const submitButton = document.querySelector('#submit-btn');
submitButton?.addEventListener('click', handleSubmit);

// Чтение значений из формы
function getFormValues() {
  return {
    email: document.querySelector('#email')?.value?.trim(),
    name: document.querySelector('#name')?.value?.trim()
  };
}
```

### Обработка данных из внешних API

```javascript
async function loadUserProfile(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const json = await response.json();

  return {
    id: json?.user?.id,
    fullName: [
      json?.user?.firstName,
      json?.user?.lastName
    ].filter(Boolean).join(' ') || 'Неизвестный пользователь',
    avatar: json?.user?.avatar?.url ?? '/images/default-avatar.png',
    role: json?.user?.permissions?.role ?? 'guest',
    lastLogin: json?.user?.activity?.lastLoginAt
      ? new Date(json.user.activity.lastLoginAt)
      : null
  };
}
```

### Работа с конфигурацией

```javascript
const appConfig = JSON.parse(localStorage.getItem('config') || 'null');

const theme = appConfig?.appearance?.theme ?? 'light';
const language = appConfig?.localization?.language ?? 'ru';
const pageSize = appConfig?.pagination?.defaultPageSize ?? 20;

console.log({ theme, language, pageSize });
// { theme: 'light', language: 'ru', pageSize: 20 } — если config не задан
```

### Паттерн опциональных плагинов

```javascript
class App {
  constructor(plugins = {}) {
    this.analytics = plugins.analytics;
    this.errorTracker = plugins.errorTracker;
    this.featureFlags = plugins.featureFlags;
  }

  trackEvent(name, data) {
    this.analytics?.track(name, data);
  }

  reportError(error) {
    this.errorTracker?.captureException(error);
    console.error(error);
  }

  isFeatureEnabled(flag) {
    return this.featureFlags?.isEnabled(flag) ?? false;
  }
}

// Работает и с плагинами, и без них
const app = new App();
app.trackEvent('page_view', { url: '/home' }); // молча игнорируется
app.isFeatureEnabled('dark_mode');              // false
```

## Поддержка в браузерах и средах

Optional chaining поддерживается во всех современных браузерах (Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+) и в Node.js начиная с версии 14. Для старых окружений используется Babel с плагином `@babel/plugin-proposal-optional-chaining` или TypeScript с `target: 'ES5'`.

```bash
# Проверка версии Node.js
node --version

# Установка Babel-плагина для старых окружений
npm install --save-dev @babel/plugin-proposal-optional-chaining
```

```json
{
  "plugins": ["@babel/plugin-proposal-optional-chaining"]
}
```

## Итог

Optional chaining (`?.`) — один из наиболее полезных операторов современного JavaScript:

- Убирает многоуровневые проверки на `null`/`undefined`
- Делает код короче и читаемее
- Работает для свойств, скобочной нотации и вызовов функций
- В связке с `??` даёт удобный способ задать значения по умолчанию
- Не подходит для записи значений и не должен скрывать логические ошибки

Чтобы глубже изучить операторы JavaScript и научиться писать чистый, современный код — пройдите курс по JavaScript на PurpleSchool: https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=optional-chaining