---
metaTitle: "Error cause в JavaScript — цепочки ошибок (ES2022)"
metaDescription: "Как использовать свойство cause в Error для создания цепочек ошибок в JavaScript. Примеры, паттерны и работа с кастомными классами."
author: "Антон Ларичев"
title: "Error cause — цепочки ошибок в JavaScript"
preview: "Разбираем свойство Error.cause из ES2022: как строить цепочки ошибок, сохранять первопричину и упрощать отладку в реальных проектах."
---

## Что такое Error cause и зачем он нужен

До ES2022 JavaScript разработчики сталкивались с одной и той же проблемой: при перехвате исключения и выбрасывании нового контекстного исключения оригинальная ошибка терялась. В логах оказывался лишь поверхностный слой — «обёртка» — без информации о том, что послужило первопричиной.

ES2022 ввёл стандартный механизм для решения этой проблемы — свойство `cause` у объекта `Error`. Теперь при создании новой ошибки можно явно указать исходную, сформировав цепочку ошибок (error chain), которую легко проследить от точки возникновения до места обработки.

## Проблема, которую решает Error cause

Рассмотрим типичную ситуацию: функция загружает данные пользователя, а при неудаче выбрасывает собственную ошибку.

```javascript
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    // Оригинальная ошибка `err` теряется
    throw new Error('Не удалось загрузить пользователя');
  }
}
```

Когда вызывающий код перехватит это исключение, он увидит только сообщение `«Не удалось загрузить пользователя»`. Причина — HTTP-ошибка или сетевая проблема — исчезла. При отладке приходится либо добавлять дополнительное логирование, либо вкладывать информацию в сообщение строкой, что делает парсинг логов неудобным.

## Синтаксис Error cause

Для передачи первопричины конструктор `Error` принимает второй аргумент — объект с полем `cause`:

```javascript
new Error('Сообщение об ошибке', { cause: originalError });
```

Свойство `cause` доступно на экземпляре ошибки:

```javascript
const original = new Error('Сетевая ошибка');
const wrapper = new Error('Не удалось загрузить данные', { cause: original });

console.log(wrapper.message); // 'Не удалось загрузить данные'
console.log(wrapper.cause);   // Error: Сетевая ошибка
console.log(wrapper.cause === original); // true
```

Тип `cause` не ограничен `Error` — это может быть любое значение: строка, число, объект. Однако чаще всего передают именно экземпляр ошибки.

```javascript
const err = new Error('Что-то пошло не так', { cause: 42 });
console.log(err.cause); // 42
```

## Практические примеры

### Оборачивание ошибок при обращении к API

Вернёмся к примеру с `fetchUser`, но теперь сохраним первопричину:

```javascript
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    throw new Error('Не удалось загрузить пользователя', { cause: err });
  }
}

async function renderUserProfile(id) {
  try {
    const user = await fetchUser(id);
    // рендеринг...
  } catch (err) {
    console.error(err.message);        // 'Не удалось загрузить пользователя'
    console.error(err.cause.message);  // 'HTTP error: 404'
  }
}
```

Теперь при обработке ошибки на верхнем уровне есть вся цепочка: что пошло не так в бизнес-логике и почему именно.

### Многоуровневые цепочки

Цепочки могут быть произвольной глубины. Каждый слой добавляет контекст:

```javascript
function parseConfig(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new SyntaxError('Невалидный формат конфига', { cause: err });
  }
}

function loadConfig(path) {
  try {
    const raw = readFileSync(path, 'utf-8');
    return parseConfig(raw);
  } catch (err) {
    throw new Error(`Не удалось загрузить конфиг из ${path}`, { cause: err });
  }
}

function bootstrap() {
  try {
    const config = loadConfig('./app.config.json');
    startApp(config);
  } catch (err) {
    throw new Error('Ошибка запуска приложения', { cause: err });
  }
}
```

Когда ошибка всплывёт на уровень `bootstrap`, можно пройтись по всей цепочке:

```javascript
function printErrorChain(err, depth = 0) {
  const indent = '  '.repeat(depth);
  console.error(`${indent}${err.name}: ${err.message}`);
  if (err.cause) {
    printErrorChain(err.cause, depth + 1);
  }
}

try {
  bootstrap();
} catch (err) {
  printErrorChain(err);
}
// Error: Ошибка запуска приложения
//   Error: Не удалось загрузить конфиг из ./app.config.json
//     SyntaxError: Невалидный формат конфига
//       SyntaxError: Unexpected token } in JSON at position 42
```

## Работа с кастомными классами ошибок

Кастомные классы ошибок также поддерживают `cause`. Нужно лишь передать опции в `super()`:

```javascript
class DatabaseError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

class UserNotFoundError extends DatabaseError {
  constructor(userId, options) {
    super(`Пользователь с id ${userId} не найден`, options);
    this.name = 'UserNotFoundError';
    this.userId = userId;
  }
}

async function getUser(id) {
  try {
    const row = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!row) {
      throw new UserNotFoundError(id);
    }
    return row;
  } catch (err) {
    if (err instanceof UserNotFoundError) throw err;
    throw new DatabaseError('Ошибка выполнения запроса', { cause: err });
  }
}
```

### Сохранение дополнительных данных в cause

`cause` не обязан быть экземпляром `Error`. Иногда удобно передавать структурированные данные:

```javascript
class ValidationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

function validateUser(data) {
  const errors = [];

  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Имя должно содержать минимум 2 символа' });
  }
  if (!data.email || !data.email.includes('@')) {
    errors.push({ field: 'email', message: 'Некорректный email' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Данные пользователя не прошли валидацию', {
      cause: errors,
    });
  }

  return true;
}

try {
  validateUser({ name: 'A', email: 'not-an-email' });
} catch (err) {
  console.error(err.message);
  // Данные пользователя не прошли валидацию
  console.table(err.cause);
  // [ { field: 'name', message: '...' }, { field: 'email', message: '...' } ]
}
```

## Проверка типа ошибки через цепочку

При наличии цепочек важно уметь найти нужный тип ошибки на любой глубине:

```javascript
function findCause(err, errorClass) {
  let current = err;
  while (current) {
    if (current instanceof errorClass) return current;
    current = current.cause instanceof Error ? current.cause : null;
  }
  return null;
}

try {
  await loadConfig('./missing.json');
} catch (err) {
  const syntaxErr = findCause(err, SyntaxError);
  if (syntaxErr) {
    console.error('Проблема с форматом JSON:', syntaxErr.message);
  } else {
    console.error('Неизвестная ошибка:', err.message);
  }
}
```

## Логирование цепочек ошибок

При логировании полезно сериализовать всю цепочку, а не только верхний уровень:

```javascript
function serializeError(err) {
  if (!(err instanceof Error)) {
    return { raw: err };
  }

  const result = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };

  if (err.cause !== undefined) {
    result.cause = serializeError(err.cause);
  }

  return result;
}

try {
  await bootstrap();
} catch (err) {
  logger.error('Критическая ошибка', serializeError(err));
}
```

Такой формат удобно индексировать в системах вроде Elasticsearch или Datadog — вся цепочка хранится в одном документе.

## Error cause в Promise-цепочках

С `async/await` и промисами паттерн работает так же органично:

```javascript
const pipeline = Promise.resolve(rawData)
  .then(data => {
    try {
      return JSON.parse(data);
    } catch (err) {
      throw new Error('Ошибка парсинга входных данных', { cause: err });
    }
  })
  .then(parsed => {
    try {
      return transform(parsed);
    } catch (err) {
      throw new Error('Ошибка трансформации', { cause: err });
    }
  })
  .then(result => save(result))
  .catch(err => {
    // err.cause содержит ошибку из конкретного шага
    console.error('Pipeline failed:', err.message);
    if (err.cause) console.error('Root cause:', err.cause.message);
  });
```

## Поддержка в браузерах и Node.js

Свойство `Error.cause` стало частью спецификации ECMAScript 2022 (ES13). Поддержка:

- Node.js: начиная с версии 16.9.0
- Chrome / Edge: с версии 93
- Firefox: с версии 91
- Safari: с версии 15

Для окружений без нативной поддержки можно использовать простую полифил-обёртку:

```javascript
function createError(message, options) {
  const err = new Error(message);
  if (options && options.cause !== undefined) {
    err.cause = options.cause;
  }
  return err;
}
```

Eсли проект транспилируется через Babel или TypeScript, `cause` поддерживается как обычное свойство объекта — транспиляция не требует отдельных плагинов.

## Ключевые практики при работе с Error cause

**Всегда передавайте оригинальную ошибку.** Когда вы перехватываете исключение и выбрасываете новое, передавайте исходное через `cause`. Это правило помогает сохранить стек вызовов и контекст.

```javascript
// Плохо — первопричина теряется
try {
  await db.connect();
} catch {
  throw new Error('Не удалось подключиться к БД');
}

// Хорошо — цепочка сохранена
try {
  await db.connect();
} catch (err) {
  throw new Error('Не удалось подключиться к БД', { cause: err });
}
```

**Добавляйте контекст на каждом слое.** Каждая обёртка должна добавлять информацию, которой нет в исходной ошибке: имя операции, идентификатор ресурса, входные параметры.

**Не злоупотребляйте вложенностью.** Если цепочка из одного звена справляется с задачей, двух уровней вполне достаточно. Избыточная вложенность затрудняет анализ.

**Используйте `cause` при повторном выбрасывании.** Если вы перехватываете ошибку только для логирования и затем выбрасываете её снова, `cause` не нужен — повторно выбрасывайте саму ошибку через `throw err`.

## Итог

`Error.cause` — небольшое, но значимое дополнение к стандарту, которое закрывает давнюю проблему потери контекста при обёртывании ошибок. Механизм прост в использовании, не требует сторонних библиотек и хорошо сочетается с кастомными классами ошибок, промисами и `async/await`.

Внедрение этого паттерна в кодовую базу делает отладку предсказуемой: вместо поиска по логам с расплывчатыми сообщениями вы получаете полную трассировку пути ошибки от источника до обработчика.

Для углублённого изучения JavaScript и современных возможностей языка — [курс JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=error-cause-chaining).