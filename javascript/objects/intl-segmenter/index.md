---
metaTitle: "Intl.Segmenter в JavaScript — сегментация текста"
metaDescription: "Как использовать Intl.Segmenter для разбивки текста на графемы, слова и предложения с учётом локали в JavaScript."
author: "Антон Ларичев"
title: "Intl.Segmenter: сегментация текста в JavaScript"
preview: "Разбираем Intl.Segmenter — стандартный API для корректной сегментации текста с поддержкой Unicode и локалей."
---

## Что такое Intl.Segmenter

`Intl.Segmenter` — встроенный класс JavaScript, входящий в состав Internationalization API (ECMA-402). Он позволяет разбивать текст на смысловые единицы — графемы, слова или предложения — с учётом правил конкретного языка и стандартов Unicode.

До появления этого API разработчики делили текст с помощью регулярных выражений или метода `split`. Такой подход работает приемлемо для ASCII-текстов, но ломается на эмодзи, иероглифах, тайском, арабском и других письменностях, где границы символов и слов определяются иначе, чем в английском.

```javascript
// Наивный подход — разбивка по пробелам
const text = 'Hello world';
console.log(text.split(' ')); // ['Hello', 'world'] — работает

// Но с тайским языком (нет пробелов между словами) — не работает
const thai = 'สวัสดีชาวโลก';
console.log(thai.split(' ')); // ['สวัสดีชาวโลก'] — одним куском
```

`Intl.Segmenter` решает эту задачу правильно, опираясь на алгоритмы Unicode Text Segmentation (UAX #29).

## Создание экземпляра

Конструктор принимает два аргумента: локаль и объект опций.

```javascript
const segmenter = new Intl.Segmenter(locale, options);
```

- `locale` — строка BCP 47 (например, `'ru'`, `'en-US'`, `'ja'`, `'th'`). Если передать `undefined`, используется локаль среды выполнения.
- `options.granularity` — уровень детализации: `'grapheme'` (по умолчанию), `'word'` или `'sentence'`.

```javascript
const wordSegmenter = new Intl.Segmenter('ru', { granularity: 'word' });
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const graphemeSegmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
```

## Метод segment и итерация результатов

Основной метод `segment(string)` возвращает объект `Segments` — итерируемую коллекцию сегментов. Каждый сегмент представлен объектом со следующими полями:

| Поле | Тип | Описание |
|------|-----|----------|
| `segment` | `string` | Строка сегмента |
| `index` | `number` | Индекс начала в исходной строке |
| `input` | `string` | Исходная строка целиком |
| `isWordLike` | `boolean` | Только для `granularity: 'word'` — является ли сегмент словом |

```javascript
const segmenter = new Intl.Segmenter('ru', { granularity: 'word' });
const segments = segmenter.segment('Привет, мир!');

for (const seg of segments) {
  console.log(seg);
}
// { segment: 'Привет', index: 0, input: 'Привет, мир!', isWordLike: true }
// { segment: ',',      index: 6, input: 'Привет, мир!', isWordLike: false }
// { segment: ' ',      index: 7, input: 'Привет, мир!', isWordLike: false }
// { segment: 'мир',   index: 8, input: 'Привет, мир!', isWordLike: true }
// { segment: '!',     index: 11, input: 'Привет, мир!', isWordLike: false }
```

Коллекцию удобно преобразовать в массив через spread или `Array.from`:

```javascript
const words = [...segmenter.segment('Привет, мир!')];
const wordOnly = words
  .filter(seg => seg.isWordLike)
  .map(seg => seg.segment);

console.log(wordOnly); // ['Привет', 'мир']
```

## Уровни детализации

### grapheme — графемные кластеры

Графема — минимальная воспринимаемая единица письма. Она не всегда совпадает с кодовой точкой Unicode или с `length` строки в JavaScript.

```javascript
const graphemeSegmenter = new Intl.Segmenter();

// Эмодзи с модификатором тона кожи — 1 графема, но 2+ кодовые точки
const emoji = '👋🏽';
console.log(emoji.length);             // 4 (суррогатные пары)
console.log([...emoji].length);        // 2 (кодовые точки)
console.log([...graphemeSegmenter.segment(emoji)].length); // 1 (правильно!)

// Комбинированные символы (буква + диакритика)
const combined = 'é'; // e + \u0301
console.log(combined.length);          // 2
console.log([...graphemeSegmenter.segment(combined)].length); // 1
```

Это важно при подсчёте видимых символов, реализации курсора в текстовом редакторе или обрезке строк по визуальной длине.

```javascript
// Безопасная обрезка строки с эмодзи
function truncate(text, maxGraphemes) {
  const segmenter = new Intl.Segmenter();
  const graphemes = [...segmenter.segment(text)];
  if (graphemes.length <= maxGraphemes) return text;
  return graphemes.slice(0, maxGraphemes).map(s => s.segment).join('') + '…';
}

console.log(truncate('Hello 👋🏽 World', 8)); // 'Hello 👋🏽…'
// naive slice('Hello 👋🏽 World', 0, 8) срезало бы часть эмодзи
```

### word — границы слов

Сегментация по словам особенно полезна для поиска, подсветки, аналитики текста и языков без пробелов между словами (японский, китайский, тайский).

```javascript
const thaiSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
const thaiText = 'สวัสดีชาวโลก';

const thaiWords = [...thaiSegmenter.segment(thaiText)]
  .filter(seg => seg.isWordLike)
  .map(seg => seg.segment);

console.log(thaiWords); // ['สวัสดี', 'ชาว', 'โลก'] — 'Привет', 'народ', 'мир'
```

Флаг `isWordLike` позволяет отделить настоящие слова от знаков препинания и пробелов:

```javascript
const enSegmenter = new Intl.Segmenter('en', { granularity: 'word' });
const sentence = "Don't stop, can't stop!";

const allSegments = [...enSegmenter.segment(sentence)];
console.log(allSegments.map(s => `"${s.segment}" (${s.isWordLike ? 'word' : 'punct'})`))
// "Don't" (word)
// ","     (punct)
// " "     (punct)
// "stop"  (word)
// ...
// Апостроф внутри "Don't" корректно считается частью слова
```

### sentence — границы предложений

Сегментация по предложениям учитывает сокращения, инициалы, числа с точками и другие случаи, где точка не означает конец предложения.

```javascript
const sentSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

const text = 'Dr. Smith went to Washington D.C. He returned on Jan. 5th. What a trip!';
const sentences = [...sentSegmenter.segment(text)].map(s => s.segment);

console.log(sentences);
// [
//   'Dr. Smith went to Washington D.C. He returned on Jan. 5th. ',
//   'What a trip!'
// ]
// Правильно определяет, что "Dr." и "D.C." — не конец предложения
```

Для русского языка аналогично:

```javascript
const ruSentSegmenter = new Intl.Segmenter('ru', { granularity: 'sentence' });
const ruText = 'Иван Иванов работает в г. Москве. Он приехал 5 янв. 2024 г. Как интересно!';

const ruSentences = [...ruSentSegmenter.segment(ruText)].map(s => s.segment);
console.log(ruSentences);
// [
//   'Иван Иванов работает в г. Москве. Он приехал 5 янв. 2024 г. ',
//   'Как интересно!'
// ]
```

## Статический метод supportedLocalesOf

Метод `Intl.Segmenter.supportedLocalesOf` позволяет проверить, какие из запрошенных локалей поддерживаются без откатки к локали по умолчанию.

```javascript
const supported = Intl.Segmenter.supportedLocalesOf(['ru', 'th', 'xx-invalid']);
console.log(supported); // ['ru', 'th'] — 'xx-invalid' отсеян
```

## Метод resolvedOptions

Каждый экземпляр предоставляет метод `resolvedOptions()`, который возвращает фактически применённые настройки:

```javascript
const segmenter = new Intl.Segmenter('zh-Hans-CN', { granularity: 'word' });
console.log(segmenter.resolvedOptions());
// { locale: 'zh-Hans-CN', granularity: 'word' }
```

## Практические применения

### Подсчёт слов с учётом локали

```javascript
function countWords(text, locale = 'ru') {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
  return [...segmenter.segment(text)].filter(s => s.isWordLike).length;
}

console.log(countWords('Привет, мир! Как дела?', 'ru')); // 4
console.log(countWords('สวัสดีชาวโลก', 'th'));            // 3
console.log(countWords('日本語のテスト', 'ja'));             // 4
```

### Подсветка найденного слова в тексте

```javascript
function highlightWord(text, query, locale = 'ru') {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
  const segments = [...segmenter.segment(text)];
  const lowerQuery = query.toLowerCase();

  return segments.map(seg => {
    if (seg.isWordLike && seg.segment.toLowerCase() === lowerQuery) {
      return `<mark>${seg.segment}</mark>`;
    }
    return seg.segment;
  }).join('');
}

const result = highlightWord('Привет, мир! Привет всем.', 'привет', 'ru');
console.log(result);
// '<mark>Привет</mark>, мир! <mark>Привет</mark> всем.'
```

### Разбивка длинного текста на страницы по предложениям

```javascript
function paginateBySentences(text, sentencesPerPage, locale = 'ru') {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' });
  const sentences = [...segmenter.segment(text)].map(s => s.segment);

  const pages = [];
  for (let i = 0; i < sentences.length; i += sentencesPerPage) {
    pages.push(sentences.slice(i, i + sentencesPerPage).join(''));
  }
  return pages;
}

const longText = 'Первое предложение. Второе предложение. Третье предложение. Четвёртое предложение.';
console.log(paginateBySentences(longText, 2, 'ru'));
// [
//   'Первое предложение. Второе предложение. ',
//   'Третье предложение. Четвёртое предложение.'
// ]
```

### Корректное определение длины строки для UI

```javascript
function getVisualLength(text) {
  const segmenter = new Intl.Segmenter();
  return [...segmenter.segment(text)].length;
}

// Строка, содержащая эмодзи с модификаторами
const str = '👨‍👩‍👧‍👦 семья'; // family emoji + text
console.log(str.length);           // 17 (кодовые единицы)
console.log([...str].length);      // 11 (кодовые точки)
console.log(getVisualLength(str)); // 7  (видимые символы)
```

## Производительность и переиспользование

Создание экземпляра `Intl.Segmenter` требует загрузки языковых данных, поэтому при частой сегментации имеет смысл кэшировать экземпляры.

```javascript
const segmenterCache = new Map();

function getSegmenter(locale, granularity) {
  const key = `${locale}:${granularity}`;
  if (!segmenterCache.has(key)) {
    segmenterCache.set(key, new Intl.Segmenter(locale, { granularity }));
  }
  return segmenterCache.get(key);
}

// Переиспользуем один экземпляр для тысяч строк
const texts = ['Первый текст.', 'Второй текст.', 'Третий текст.'];
texts.forEach(t => {
  const words = [...getSegmenter('ru', 'word').segment(t)]
    .filter(s => s.isWordLike)
    .map(s => s.segment);
  console.log(words);
});
```

## Поддержка в браузерах и Node.js

`Intl.Segmenter` поддерживается во всех современных браузерах начиная с 2022 года:

- Chrome 87+
- Firefox 93+
- Safari 14.1+
- Edge 87+
- Node.js 16+ (с полными ICU данными)

Для Node.js важно убедиться, что приложение запускается с полными данными ICU. В Docker-образах и большинстве хостингов это выполняется по умолчанию. Проверить можно так:

```bash
node -e "console.log(typeof Intl.Segmenter)" # должно вывести 'function'
```

Если нужна поддержка старых сред, существует полифил `@formatjs/intl-segmenter`:

```bash
npm install @formatjs/intl-segmenter
```

```javascript
import '@formatjs/intl-segmenter/polyfill';
// После импорта Intl.Segmenter доступен глобально
```

## Сравнение с альтернативами

| Подход | Правильные графемы | Слова без пробелов | Предложения |
|--------|-------------------|-------------------|-------------|
| `split('')` | Нет | Нет | Нет |
| Spread `[...str]` | Частично | Нет | Нет |
| Regex `\b` | Нет | Нет | Нет |
| `Intl.Segmenter` | Да | Да | Да |

Регулярное выражение `\w` и граница `\b` ориентированы на ASCII и не работают с кириллицей и другими алфавитами без дополнительных флагов Unicode:

```javascript
// Regex с флагом /u — лучше, но не учитывает правила конкретного языка
const regex = /\p{L}+/gu;
const words = 'Привет, мир!'.match(regex);
console.log(words); // ['Привет', 'мир'] — работает для CJK хуже

// Intl.Segmenter — правильно во всех случаях
const segmenter = new Intl.Segmenter('ru', { granularity: 'word' });
const segWords = [...segmenter.segment('Привет, мир!')]
  .filter(s => s.isWordLike)
  .map(s => s.segment);
console.log(segWords); // ['Привет', 'мир']
```

## Итоги

`Intl.Segmenter` — правильный инструмент для любой задачи, связанной с разбивкой текста на составные части. Он заменяет ненадёжные регулярные выражения и `split` там, где важна корректность: многоязычные приложения, текстовые редакторы, поиск, аналитика контента. Три уровня детализации — `grapheme`, `word`, `sentence` — покрывают большинство реальных сценариев, а интеграция с BCP 47 локалями гарантирует правильное поведение для любого языка мира.

Хотите глубже разобраться в JavaScript и работе со строками, числами и датами? Записывайтесь на курс [JavaScript для профессионалов](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=intl-segmenter) на PurpleSchool — разберём язык от основ до продвинутых API с практическими проектами.
