---
metaTitle: "JavaScript декораторы TC39 Stage 3 — синтаксис и примеры"
metaDescription: "Разбираем декораторы JavaScript по стандарту TC39 Stage 3: классовые, методные, полевые декораторы и auto-accessor с примерами кода."
author: "Антон Ларичев"
title: "JavaScript декораторы: TC39 Stage 3"
preview: "Разбираем новый стандарт декораторов TC39 Stage 3: чем они отличаются от экспериментальных, как работают классовые, методные и полевые декораторы."
---

## Что такое декораторы

Декораторы — специальный синтаксис, который позволяет изменять поведение классов, методов, полей и других элементов кода. Записываются через символ `@` перед объявлением и широко известны разработчикам на Python и Java.

В мире JavaScript декораторы долгое время были нестабильной экспериментальной функцией TypeScript. В 2022 году предложение достигло Stage 3 в процессе стандартизации TC39, а TypeScript начиная с версии 5.0 добавил поддержку нового стандартного синтаксиса. Теперь декораторы — полноценная часть современного JavaScript.

## История: от экспериментальных к стандартным

Чтобы понять важность нового стандарта, стоит разобраться, чем он отличается от предшественника.

**Старые экспериментальные декораторы** (`experimentalDecorators` в TypeScript) были нестабильными, слабо типизированными и несовместимыми с итоговым стандартом TC39. Их поведение зависело от реализации компилятора.

**Новые декораторы TC39** — часть официального стандарта с чёткой предсказуемой семантикой, хорошей интеграцией с системой типов TypeScript и поддержкой в современных движках JavaScript.

Ключевые отличия нового стандарта:
- Декоратор не может изменять тип декорируемого элемента
- Вместо дескрипторов свойств декоратор получает объект контекста
- Появился новый тип элемента — `auto-accessor`
- Стандартизирован порядок выполнения

## Синтаксис и принцип работы

Декоратор — это функция с двумя аргументами: декорируемое значение и объект контекста.

```javascript
function myDecorator(value, context) {
  // value — декорируемый элемент (класс, метод, поле и т.д.)
  // context — объект с метаданными о декорируемом элементе
  return value; // можно вернуть новое значение или undefined
}
```

Объект `context` содержит следующие поля:

- `kind` — тип элемента: `'class'`, `'method'`, `'field'`, `'getter'`, `'setter'`, `'accessor'`
- `name` — имя декорируемого элемента
- `access` — объект с методами `get` и/или `set` для доступа к значению
- `static` — `true`, если элемент статический
- `private` — `true`, если элемент приватный
- `addInitializer` — функция для добавления инициализатора

## Декораторы классов

Декоратор класса применяется к конструктору и может вернуть новый класс или `undefined`.

```javascript
function sealed(target, context) {
  Object.seal(target);
  Object.seal(target.prototype);
}

@sealed
class ApiService {
  baseUrl = 'https://api.example.com';

  fetch(endpoint) {
    return `${this.baseUrl}/${endpoint}`;
  }
}

// В strict mode попытка добавить свойство вызовет ошибку
// ApiService.newProp = 'test'; // TypeError
```

Для передачи параметров создаётся фабрика декораторов:

```javascript
function withVersion(version) {
  return function(target, context) {
    target.version = version;
    return target;
  };
}

@withVersion('2.0.0')
class App {
  start() {
    console.log(`App v${App.version} started`);
  }
}

const app = new App();
app.start(); // App v2.0.0 started
```

## Декораторы методов

Декоратор метода получает функцию и может вернуть новую функцию, которая заменит оригинальную.

```javascript
function log(target, context) {
  const methodName = context.name;

  return function(...args) {
    console.log(`[${methodName}] вызван с аргументами:`, args);
    const result = target.apply(this, args);
    console.log(`[${methodName}] вернул:`, result);
    return result;
  };
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }

  @log
  multiply(a, b) {
    return a * b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// [add] вызван с аргументами: [2, 3]
// [add] вернул: 5
```

Декоратор для измерения времени выполнения:

```javascript
function measure(target, context) {
  const methodName = context.name;

  return function(...args) {
    const start = performance.now();
    const result = target.apply(this, args);
    const end = performance.now();
    console.log(`[${methodName}] выполнен за ${(end - start).toFixed(2)}ms`);
    return result;
  };
}

class DataProcessor {
  @measure
  processLargeDataset(data) {
    return data.map(item => item * 2).filter(item => item > 10);
  }
}
```

### Декоратор мемоизации

Мемоизация — классический пример применения декораторов методов:

```javascript
function memoize(target, context) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`[${context.name}] результат из кэша`);
      return cache.get(key);
    }

    const result = target.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

class FibonacciService {
  @memoize
  compute(n) {
    if (n <= 1) return n;
    return this.compute(n - 1) + this.compute(n - 2);
  }
}

const fib = new FibonacciService();
console.log(fib.compute(10)); // 55
console.log(fib.compute(10)); // 55 (из кэша)
```

## Декораторы полей

Декораторы полей работают иначе — они не получают само значение поля, поскольку оно ещё не существует в момент определения класса. Вместо этого декоратор может вернуть функцию-инициализатор, которая вызывается при создании каждого экземпляра.

```javascript
function validate(min, max) {
  return function(target, context) {
    return function(initialValue) {
      if (typeof initialValue === 'number') {
        if (initialValue < min || initialValue > max) {
          throw new RangeError(
            `${context.name} должно быть между ${min} и ${max}`
          );
        }
      }
      return initialValue;
    };
  };
}

class Config {
  @validate(1, 100)
  timeout = 30;

  @validate(0, 65535)
  port = 8080;
}

const config = new Config();
console.log(config.timeout); // 30
console.log(config.port);    // 8080

// Следующее вызовет RangeError при создании экземпляра:
// class BadConfig { @validate(1, 100) timeout = 150; }
```

## Auto-accessor

`auto-accessor` — новый тип элемента класса, уникальный для декораторов TC39. Объявляется ключевым словом `accessor` и автоматически создаёт приватное поле хранения вместе с публичными геттером и сеттером.

```javascript
class Person {
  accessor name = 'Иван';
}

// Приблизительный эквивалент:
class Person {
  #name = 'Иван';

  get name() {
    return this.#name;
  }

  set name(value) {
    this.#name = value;
  }
}
```

Декоратор `accessor` может перехватывать операции чтения и записи:

```javascript
function observed(target, context) {
  const { get, set } = target;

  return {
    get() {
      const value = get.call(this);
      console.log(`Чтение ${context.name}:`, value);
      return value;
    },
    set(value) {
      console.log(`Запись ${context.name}: ${value}`);
      set.call(this, value);
    },
    init(initialValue) {
      return initialValue;
    }
  };
}

class Store {
  @observed
  accessor count = 0;
}

const store = new Store();
store.count = 5;          // Запись count: 5
console.log(store.count); // Чтение count: 5
```

### Реактивные данные с auto-accessor

```javascript
function reactive(target, context) {
  const { get, set } = target;
  const listeners = new Set();

  return {
    get() {
      return get.call(this);
    },
    set(value) {
      const oldValue = get.call(this);
      set.call(this, value);
      if (oldValue !== value) {
        listeners.forEach(fn => fn(value, oldValue));
      }
    },
    init(initialValue) {
      this._listeners = listeners;
      return initialValue;
    }
  };
}

class ReactiveModel {
  @reactive
  accessor title = '';
}

const model = new ReactiveModel();
model._listeners.add((newVal, oldVal) => {
  console.log(`title изменился: "${oldVal}" -> "${newVal}"`);
});

model.title = 'Привет'; // title изменился: "" -> "Привет"
model.title = 'Мир';    // title изменился: "Привет" -> "Мир"
```

## addInitializer

Метод `context.addInitializer` позволяет зарегистрировать функцию, которая выполняется при создании каждого экземпляра. Это удобно для привязки методов:

```javascript
function bind(target, context) {
  context.addInitializer(function() {
    this[context.name] = this[context.name].bind(this);
  });
}

class EventHandler {
  constructor() {
    this.value = 42;
  }

  @bind
  handleClick() {
    console.log(this.value);
  }
}

const handler = new EventHandler();
const { handleClick } = handler;
handleClick(); // 42 (this корректно привязан без .bind() вручную)
```

## Порядок применения декораторов

Декораторы применяются в строгом порядке:

1. Декораторы методов, полей, геттеров и сеттеров — в порядке объявления сверху вниз
2. Декоратор класса — последним

При нескольких декораторах на одном элементе они применяются снизу вверх:

```javascript
function first(target, context) {
  console.log('first applied');
  return target;
}

function second(target, context) {
  console.log('second applied');
  return target;
}

class Example {
  @first
  @second
  method() {}
}

// second applied
// first applied
```

## Практический пример: система валидации

Рассмотрим реальный сценарий — создание системы валидации полей формы:

```javascript
const validators = new WeakMap();

function required(target, context) {
  return function(initialValue) {
    if (!validators.has(this)) validators.set(this, {});
    validators.get(this)[context.name] = (value) => {
      if (value === null || value === undefined || value === '') {
        return `Поле "${context.name}" обязательно для заполнения`;
      }
      return null;
    };
    return initialValue;
  };
}

function minLength(min) {
  return function(target, context) {
    return function(initialValue) {
      if (!validators.has(this)) validators.set(this, {});
      validators.get(this)[context.name] = (value) => {
        if (typeof value === 'string' && value.length < min) {
          return `"${context.name}" должно содержать минимум ${min} символов`;
        }
        return null;
      };
      return initialValue;
    };
  };
}

function validate(instance) {
  const fieldValidators = validators.get(instance) || {};
  const errors = {};

  for (const [field, validator] of Object.entries(fieldValidators)) {
    const error = validator(instance[field]);
    if (error) errors[field] = error;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

class RegistrationForm {
  @required
  name = '';

  @minLength(6)
  password = '';
}

const form = new RegistrationForm();
form.name = 'Алексей';
form.password = '123';

const errors = validate(form);
console.log(errors);
// { password: '"password" должно содержать минимум 6 символов' }
```

## Как использовать декораторы сегодня

### TypeScript 5.0+

Начиная с TypeScript 5.0, новые декораторы TC39 поддерживаются по умолчанию — без флага `experimentalDecorators`. Достаточно актуальной версии TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

Важно: если в проекте есть `"experimentalDecorators": true`, TypeScript переключится на старое поведение. Для нового стандарта этот флаг не нужен и его следует убрать.

### Babel

Для JavaScript-проектов без TypeScript используйте Babel:

```bash
npm install --save-dev @babel/plugin-proposal-decorators
```

```json
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "version": "2023-11" }]
  ]
}
```

### Node.js

Чтобы использовать декораторы нативно в Node.js без компилятора, убедитесь, что версия Node.js поддерживает эту возможность, либо используйте `--experimental-vm-modules` и актуальную конфигурацию проекта.

## Итог

Декораторы TC39 Stage 3 — это зрелый, стандартизированный инструмент с предсказуемым поведением. Они хорошо подходят для:

- Логирования и отладки
- Мемоизации и кэширования
- Валидации данных
- Привязки контекста
- Реализации реактивности
- Внедрения зависимостей (DI)

Главное отличие от экспериментальных декораторов — надёжность и соответствие стандарту. Код, написанный с использованием TC39-декораторов, будет работать корректно по мере роста нативной поддержки в браузерах и Node.js.

Если хотите глубже разобраться в современном JavaScript и освоить продвинутые возможности языка на практике, приходите на курс по JavaScript на PurpleSchool.

[Курс по JavaScript на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=tc39-decorators)