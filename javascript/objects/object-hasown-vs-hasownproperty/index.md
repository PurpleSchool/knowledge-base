---
metaTitle: "Object.hasOwn вместо hasOwnProperty в JavaScript"
metaDescription: "Разбираем проблемы hasOwnProperty и как Object.hasOwn решает их. Примеры, сравнение, поддержка браузеров и полифилл."
author: "Антон Ларичев"
title: "Object.hasOwn вместо hasOwnProperty"
preview: "Почему hasOwnProperty небезопасен и как Object.hasOwn из ES2022 исправляет его недостатки — с примерами кода."
---

## Что такое собственное свойство объекта

В JavaScript каждый объект может иметь два типа свойств: собственные (own) и унаследованные через цепочку прототипов. Собственные свойства — это те, что были определены непосредственно на самом объекте, а не получены от его прототипа.

```javascript
const user = {
  name: 'Alice',
  age: 30
};

console.log('name' in user);       // true — собственное
console.log('toString' in user);   // true — унаследованное от Object.prototype
```

Оператор `in` проверяет наличие свойства по всей цепочке прототипов, поэтому для проверки именно собственного свойства традиционно использовали `hasOwnProperty`.

## Проблемы hasOwnProperty

Метод `hasOwnProperty` существует в JavaScript с самого начала и знаком каждому разработчику:

```javascript
const user = {
  name: 'Alice',
  age: 30
};

console.log(user.hasOwnProperty('name'));     // true
console.log(user.hasOwnProperty('toString')); // false
```

Однако у него есть несколько серьёзных проблем, которые могут привести к труднообнаруживаемым багам.

### Проблема 1: метод можно переопределить

`hasOwnProperty` — это обычный метод, доступный через прототип. Это означает, что его можно перезаписать на конкретном объекте:

```javascript
const obj = {
  hasOwnProperty: function() {
    return false; // всегда возвращает false
  },
  name: 'Alice'
};

console.log(obj.hasOwnProperty('name')); // false — неверный результат!
```

На практике это случается, когда объект создаётся из данных, пришедших извне: например, из JSON или пользовательского ввода. Если входные данные содержат ключ `hasOwnProperty`, объект получит свойство, которое затенит метод прототипа.

```javascript
// Данные из внешнего источника
const parsed = JSON.parse('{"hasOwnProperty": true, "value": 42}');

// Падает с ошибкой: TypeError: parsed.hasOwnProperty is not a function
console.log(parsed.hasOwnProperty('value'));
```

### Проблема 2: объекты без прототипа

Объекты, созданные через `Object.create(null)`, не имеют прототипа. Они не наследуют ни один метод из `Object.prototype`, включая `hasOwnProperty`.

```javascript
const dict = Object.create(null);
dict.name = 'Alice';

// Ошибка: TypeError: dict.hasOwnProperty is not a function
console.log(dict.hasOwnProperty('name'));
```

Такие объекты часто используют именно как «чистые» словари, чтобы избежать конфликтов с унаследованными свойствами. Это популярный паттерн для хранения произвольных ключей.

### Проблема 3: правило линтера

ESLint имеет правило `no-prototype-builtins`, которое запрещает вызывать методы `Object.prototype` напрямую через экземпляр. Это правило включено в конфигурации `eslint:recommended`. Поэтому во многих командах `obj.hasOwnProperty()` помечается как ошибка линтера.

Обходной путь, который использовали до ES2022:

```javascript
// Безопасный, но многословный способ
Object.prototype.hasOwnProperty.call(obj, 'name');

// Или с сохранением ссылки
const hasOwn = Object.prototype.hasOwnProperty;
console.log(hasOwn.call(obj, 'name')); // true
```

Это работает, но синтаксически громоздко и неочевидно для читателя кода.

## Object.hasOwn — современное решение

В ES2022 появился статический метод `Object.hasOwn`, который решает все описанные проблемы. Он принимает объект и имя свойства, возвращая `true`, если свойство является собственным.

```javascript
const user = {
  name: 'Alice',
  age: 30
};

console.log(Object.hasOwn(user, 'name'));     // true
console.log(Object.hasOwn(user, 'toString')); // false
```

### Синтаксис

```javascript
Object.hasOwn(obj, propKey)
```

- `obj` — объект, который проверяется. Если передать не-объект, метод выбросит `TypeError`.
- `propKey` — строка или символ, имя проверяемого свойства.

Метод возвращает `boolean`.

## Сравнение с hasOwnProperty

### Устойчивость к переопределению

`Object.hasOwn` — статический метод самого конструктора `Object`, а не метод прототипа. Его невозможно случайно переопределить на уровне конкретного объекта:

```javascript
const obj = {
  hasOwnProperty: function() {
    return false;
  },
  name: 'Alice'
};

// hasOwnProperty переопределён — даёт неверный результат
console.log(obj.hasOwnProperty('name')); // false

// Object.hasOwn не зависит от объекта — всегда работает правильно
console.log(Object.hasOwn(obj, 'name')); // true
```

### Работа с объектами без прототипа

```javascript
const dict = Object.create(null);
dict.key = 'value';
dict.count = 42;

// hasOwnProperty не доступен — объект без прототипа
// dict.hasOwnProperty('key') => TypeError

// Object.hasOwn работает без проблем
console.log(Object.hasOwn(dict, 'key'));   // true
console.log(Object.hasOwn(dict, 'other')); // false
```

### Итерация по ключам

Распространённый паттерн — перебрать только собственные перечислимые свойства объекта, исключив унаследованные. Раньше код выглядел так:

```javascript
const settings = { theme: 'dark', lang: 'ru', debug: false };

// Старый способ
for (const key in settings) {
  if (Object.prototype.hasOwnProperty.call(settings, key)) {
    console.log(key, settings[key]);
  }
}
```

С `Object.hasOwn` код становится чище:

```javascript
const settings = { theme: 'dark', lang: 'ru', debug: false };

for (const key in settings) {
  if (Object.hasOwn(settings, key)) {
    console.log(key, settings[key]);
  }
}
// theme dark
// lang ru
// debug false
```

Хотя для этой задачи лучше подходит `Object.keys()`, который и так возвращает только собственные перечислимые свойства, комбинация `for...in` + `Object.hasOwn` удобна, когда нужно обойти также неперечислимые свойства или свойства-символы с дополнительной фильтрацией.

## Практические примеры

### Безопасная проверка наличия ключа в конфигурации

```javascript
function applyConfig(config) {
  const defaults = { timeout: 3000, retries: 3, debug: false };

  for (const key in defaults) {
    if (!Object.hasOwn(config, key)) {
      config[key] = defaults[key];
    }
  }

  return config;
}

const result = applyConfig({ timeout: 5000 });
console.log(result);
// { timeout: 5000, retries: 3, debug: false }
```

### Валидация данных из внешнего источника

```javascript
function validateUser(data) {
  const requiredFields = ['name', 'email', 'age'];

  for (const field of requiredFields) {
    if (!Object.hasOwn(data, field)) {
      throw new Error(`Отсутствует обязательное поле: ${field}`);
    }
  }

  return true;
}

// Данные из API — могут содержать любые ключи
const userData = JSON.parse('{"name":"Bob","email":"bob@example.com","age":25}');

try {
  validateUser(userData);
  console.log('Данные валидны');
} catch (e) {
  console.error(e.message);
}
```

### Работа с Map-подобными объектами

```javascript
// Объект как словарь без прototipe-загрязнения
function createRegistry() {
  return Object.create(null);
}

const registry = createRegistry();
registry['user:1'] = { name: 'Alice' };
registry['user:2'] = { name: 'Bob' };

function getEntry(registry, id) {
  if (Object.hasOwn(registry, id)) {
    return registry[id];
  }
  return null;
}

console.log(getEntry(registry, 'user:1')); // { name: 'Alice' }
console.log(getEntry(registry, 'user:3')); // null
```

### Проверка свойств-символов

`Object.hasOwn` работает не только со строками, но и с символами:

```javascript
const ID = Symbol('id');

const entity = {
  [ID]: 12345,
  name: 'Product'
};

console.log(Object.hasOwn(entity, ID));     // true
console.log(Object.hasOwn(entity, 'name')); // true
console.log(Object.hasOwn(entity, Symbol('id'))); // false — разные символы
```

## Поддержка браузеров и полифилл

`Object.hasOwn` введён в ES2022 и поддерживается во всех современных браузерах начиная с 2022 года: Chrome 93+, Firefox 92+, Safari 15.4+, Node.js 16.9+.

Если нужна поддержка более старых окружений, полифилл прост:

```javascript
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}
```

Этот полифилл можно добавить один раз на уровне точки входа приложения. Babel и core-js начиная с версии 3.16 также включают его автоматически при соответствующих настройках targets.

## Когда использовать Object.hasOwn, а когда — альтернативы

Выбор метода зависит от задачи:

| Задача | Рекомендуемый подход |
|--------|---------------------|
| Проверить собственное свойство | `Object.hasOwn(obj, key)` |
| Перечислить собственные перечислимые свойства | `Object.keys(obj)` или `Object.entries(obj)` |
| Проверить наличие свойства в цепочке прототипов | `key in obj` |
| Перечислить все собственные свойства (включая неперечислимые) | `Object.getOwnPropertyNames(obj)` |
| Перечислить собственные символьные свойства | `Object.getOwnPropertySymbols(obj)` |

Для большинства случаев, когда нужно убедиться, что ключ задан непосредственно на объекте, а не унаследован — используйте `Object.hasOwn`.

## Переход с hasOwnProperty на Object.hasOwn

Если в существующем коде есть вызовы `hasOwnProperty`, их можно заменить по следующим правилам:

```javascript
// Было
obj.hasOwnProperty(key)

// Стало
Object.hasOwn(obj, key)

// Было (через call — защита от переопределения)
Object.prototype.hasOwnProperty.call(obj, key)

// Стало
Object.hasOwn(obj, key)
```

Замена механическая и безопасна в любом из перечисленных вариантов — поведение идентично для обычных объектов, но `Object.hasOwn` корректно работает ещё и с объектами без прототипа.

ESLint-правило `prefer-object-has-own` (доступно начиная с ESLint 8.5) автоматически помечает устаревшие вызовы `hasOwnProperty` и предлагает автофикс:

```json
{
  "rules": {
    "prefer-object-has-own": "error"
  }
}
```

## Итог

`Object.hasOwn` — это безопасная, лаконичная и рекомендуемая замена `hasOwnProperty`. Он не зависит от прототипа объекта, не может быть случайно переопределён и читается естественно. Используйте его во всём новом коде и постепенно мигрируйте существующий — ESLint-правило `prefer-object-has-own` упростит поиск мест для замены.

Чтобы глубже разобраться с объектами, прототипами и современными возможностями JavaScript, записывайтесь на курс: [JavaScript для профессионалов на PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=object-hasown-vs-hasownproperty)