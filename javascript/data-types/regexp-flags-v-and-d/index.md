---
metaTitle: "Флаги регулярных выражений v и d в JavaScript"
metaDescription: "Подробный разбор флагов v (unicodeSets) и d (hasIndices) в JavaScript — синтаксис, операции над множествами, индексы совпадений с примерами кода."
author: "Антон Ларичев"
title: "Новые флаги регулярных выражений: v и d"
preview: "Разбираем флаги v и d для регулярных выражений: как получить позиции захватывающих групп и использовать операции над множествами символов."
---

## Новые флаги регулярных выражений: v и d

JavaScript планомерно развивает работу с регулярными выражениями. В ES2022 появился флаг `d`, добавляющий индексы позиций к результатам совпадений, а в ES2024 — флаг `v`, расширяющий возможности работы с Unicode и вводящий операции над множествами символов. Оба флага решают реальные задачи, которые раньше требовали обходных решений.

## Флаг d — индексы позиций захватывающих групп

При обычном вызове `exec()` или `match()` вы получаете совпавшую строку и индекс начала всего совпадения через свойство `index`. Но где заканчивается совпадение? Где начинается и заканчивается каждая захватывающая группа? До ES2022 приходилось вычислять это вручную.

Флаг `d` добавляет к результату свойство `indices` — массив с парами `[start, end]` для каждой группы.

```javascript
const re = /(\d{4})-(\d{2})-(\d{2})/d;
const result = re.exec('Дата: 2024-03-15, следующая: 2024-04-01');

console.log(result[0]);       // '2024-03-15'
console.log(result.index);    // 6
console.log(result.indices);  // [[6, 16], [6, 10], [11, 13], [14, 16]]
```

Каждый элемент `indices` — это пара `[начало, конец]`, где `конец` — индекс символа после последнего совпавшего. Такой формат совпадает с соглашением методов `slice()` и `substring()`:

```javascript
const str = 'Дата: 2024-03-15';
const re = /(\d{4})-(\d{2})-(\d{2})/d;
const result = re.exec(str);

const [fullStart, fullEnd] = result.indices[0];
console.log(str.slice(fullStart, fullEnd)); // '2024-03-15'

const [yearStart, yearEnd] = result.indices[1];
console.log(str.slice(yearStart, yearEnd)); // '2024'
```

### Именованные группы и indices.groups

Флаг `d` особенно удобен в связке с именованными захватывающими группами (`?<name>`). Индексы именованных групп доступны через `indices.groups`:

```javascript
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/d;
const str = 'Релиз: 2024-03-15';
const result = re.exec(str);

console.log(result.groups);
// { year: '2024', month: '03', day: '15' }

console.log(result.indices.groups);
// { year: [7, 11], month: [12, 14], day: [15, 17] }
```

Теперь не нужно считать символы вручную — позиция каждой части доступна напрямую по имени группы.

### Практический пример: подсветка совпадений в тексте

Индексы позволяют точно выделять найденные фрагменты без дополнительных вычислений:

```javascript
function highlight(text, pattern) {
  const re = new RegExp(`(${pattern})`, 'gd');
  let result = '';
  let lastIndex = 0;

  for (const match of text.matchAll(re)) {
    const [start, end] = match.indices[1];
    result += text.slice(lastIndex, start);
    result += `<mark>${text.slice(start, end)}</mark>`;
    lastIndex = end;
  }

  result += text.slice(lastIndex);
  return result;
}

console.log(highlight('JavaScript и TypeScript популярны', 'Script'));
// 'Java<mark>Script</mark> и Type<mark>Script</mark> популярны'
```

### Если группа не участвовала в совпадении

Когда необязательная группа (`?`) не совпала, её позиция в `indices` равна `undefined` — в точности как сама группа в массиве совпадений:

```javascript
const re = /(\d+)(?:\.(\d+))?/d;

const intResult = re.exec('42');
console.log(intResult[2]);           // undefined
console.log(intResult.indices[2]);   // undefined

const floatResult = re.exec('3.14');
console.log(floatResult[2]);         // '14'
console.log(floatResult.indices[2]); // [2, 4]
```

## Флаг v — расширенная работа с Unicode

Флаг `v` (режим `unicodeSets`) появился в ES2024 как эволюция флага `u`. Он включает все возможности `u` и добавляет три ключевых нововведения:

- **Операции над множествами** внутри символьных классов
- **Строковые литералы** в символьных классах через `\q{}`
- **Расширенные Unicode-свойства**, в том числе свойства строк

Важно: флаги `v` и `u` несовместимы — нельзя использовать оба одновременно.

### Операции над множествами символов

Раньше символьный класс `[...]` мог только перечислять символы или диапазоны. Флаг `v` добавляет три операции:

**Пересечение `&&`** — символы, входящие в оба класса:

```javascript
// Строчные буквы ASCII, которые одновременно являются гласными
const vowelsAscii = /[\p{ASCII}&&[aeiou]]/v;

console.log(vowelsAscii.test('a')); // true
console.log(vowelsAscii.test('b')); // false
console.log(vowelsAscii.test('а')); // false (кириллица)
```

**Вычитание `--`** — символы первого класса без символов второго:

```javascript
// Все буквы Unicode, кроме строчных латинских
const lettersNotLatin = /[\p{Letter}--[a-z]]/v;

console.log(lettersNotLatin.test('А')); // true  (кириллица)
console.log(lettersNotLatin.test('Z')); // true  (прописная латиница)
console.log(lettersNotLatin.test('a')); // false (строчная латиница)
```

**Объединение** работает как раньше — просто перечисление:

```javascript
// Символ является латинской буквой ИЛИ цифрой
const alphanumeric = /[[a-z][0-9]]/v;

console.log(alphanumeric.test('c')); // true
console.log(alphanumeric.test('5')); // true
console.log(alphanumeric.test('!')); // false
```

### Вложенные символьные классы

Операции можно комбинировать и вкладывать друг в друга:

```javascript
// Буквы ASCII без гласных (согласные ASCII)
const asciiConsonants = /[[a-zA-Z]--[aeiouAEIOU]]/v;

console.log(asciiConsonants.test('b')); // true
console.log(asciiConsonants.test('e')); // false
console.log(asciiConsonants.test('B')); // true
```

### Строковые литералы через \q{}

Флаг `v` разрешает использовать строки (не только отдельные символы) внутри символьных классов с помощью `\q{}`:

```javascript
// Совпадение с одним из многосимвольных вариантов
const greeting = /^\q{hello|hi|hey}$/v;

console.log(greeting.test('hello')); // true
console.log(greeting.test('hi'));    // true
console.log(greeting.test('ho'));    // false
```

Это особенно полезно с Unicode-свойствами строк, например с эмодзи-последовательностями:

```javascript
// \p{RGI_Emoji} — полные эмодзи, включая многосимвольные последовательности
const emoji = /^\p{RGI_Emoji}$/v;

console.log(emoji.test('😀'));       // true  — простой эмодзи
console.log(emoji.test('👨‍👩‍👧')); // true  — семья (последовательность кодовых точек)
console.log(emoji.test('abc'));      // false
```

С флагом `u` это работало бы некорректно, так как `u` не поддерживает свойства строк.

### Расширенные Unicode-свойства

Флаг `v` поддерживает новые категории Unicode-свойств, недоступные с флагом `u`:

```javascript
// Бинарные свойства строк
const basicEmoji = /\p{Basic_Emoji}/v;
const emojiZWJ = /\p{Emoji_ZWJ_Sequence}/v;

// Работа с эмодзи-флагами стран
const emojiFlag = /\p{RGI_Emoji_Flag_Sequence}/v;
console.log(emojiFlag.test('🇷🇺')); // true
```

### Отличия от флага u

Флаг `v` строже обрабатывает синтаксис — некоторые конструкции, допустимые в `u`, вызовут ошибку в `v`:

```javascript
// Флаг u — избыточное экранирование допустимо
const reU = /[\-]/u; // OK

// Флаг v — дефис внутри класса нужно экранировать явно или ставить в начало/конец
const reV1 = /[-]/v;  // OK — в начале класса
const reV2 = /[\-]/v; // OK — экранирован
// const reV3 = /[a-]/v; // SyntaxError — неоднозначно
```

Также в режиме `v` зарезервированы символы `&`, `!`, `#`, `%`, `*`, `+`, `,`, `.`, `:`, `;`, `<`, `=`, `>`, `?`, `@`, `` ` ``, `~` внутри символьных классов — их нужно экранировать:

```javascript
// Флаг u — символ & не нужно экранировать
const reU2 = /[&]/u; // OK

// Флаг v — & зарезервирован для операции &&, нужно экранировать
const reV4 = /[\&]/v; // OK
```

## Совместное использование флагов d и v

Флаги `d` и `v` отлично работают вместе:

```javascript
const re = /(?<emoji>\p{RGI_Emoji})/vdg;
const text = 'Привет 👋 мир 🌍';

for (const match of text.matchAll(re)) {
  const [start, end] = match.indices.groups.emoji;
  console.log(`Эмодзи "${match.groups.emoji}" на позиции ${start}–${end}`);
}
// Эмодзи "👋" на позиции 7–9
// Эмодзи "🌍" на позиции 13–15
```

## Поддержка в браузерах

Флаг `d` поддерживается во всех современных браузерах начиная с 2022 года: Chrome 90+, Firefox 88+, Safari 15+, Node.js 16+.

Флаг `v` появился позже: Chrome 112+, Firefox 116+, Safari 17+, Node.js 20+.

Для проверки поддержки перед использованием:

```javascript
function supportsRegexpV() {
  try {
    new RegExp('', 'v');
    return true;
  } catch {
    return false;
  }
}

function supportsRegexpD() {
  try {
    return /x/d.exec('x').indices !== undefined;
  } catch {
    return false;
  }
}

if (supportsRegexpV()) {
  // Используем флаг v
} else {
  // Запасной вариант с флагом u
}
```

## Практический пример: парсер токенов

Оба флага вместе упрощают написание лексических анализаторов:

```javascript
const TOKEN_PATTERN = /(?<number>\d+\.?\d*)|(?<operator>[+\-*/])|(?<identifier>[a-zA-Z_]\w*)|(?<space>\s+)/dg;

function tokenize(expression) {
  const tokens = [];

  for (const match of expression.matchAll(TOKEN_PATTERN)) {
    const type = Object.keys(match.groups).find(k => match.groups[k] !== undefined);
    if (type === 'space') continue;

    const [start, end] = match.indices.groups[type];
    tokens.push({
      type,
      value: match.groups[type],
      start,
      end,
    });
  }

  return tokens;
}

console.log(tokenize('x + 42 * y'));
// [
//   { type: 'identifier', value: 'x',  start: 0, end: 1 },
//   { type: 'operator',   value: '+',  start: 2, end: 3 },
//   { type: 'number',     value: '42', start: 4, end: 6 },
//   { type: 'operator',   value: '*',  start: 7, end: 8 },
//   { type: 'identifier', value: 'y',  start: 9, end: 10 },
// ]
```

## Итоги

Флаг `d` решает конкретную практическую задачу — предоставляет точные позиции каждой захватывающей группы без ручных вычислений. Это упрощает подсветку синтаксиса, создание ошибок с указанием позиции, редакторы кода и парсеры.

Флаг `v` — более фундаментальное обновление. Он делает JavaScript-регулярки первоклассным инструментом для работы с Unicode: операции над множествами символов, поддержка эмодзи-последовательностей и строковых литералов в классах символов открывают возможности, которые раньше требовали внешних библиотек.

Чтобы освоить работу с регулярными выражениями и другими возможностями современного JavaScript в полном объёме — https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=regexp-flags-v-d