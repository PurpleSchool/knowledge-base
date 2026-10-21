---
metaTitle: "Intl.RelativeTimeFormat в JavaScript — локализация дат"
metaDescription: "Как использовать Intl.RelativeTimeFormat для отображения относительного времени на разных языках: опции, примеры, интеграция с датами."
author: "Антон Ларичев"
title: "Intl.RelativeTimeFormat: локализация относительного времени"
preview: "Intl.RelativeTimeFormat позволяет отображать относительное время («3 дня назад», «через 2 часа») на любом языке без сторонних библиотек."
---

## Что такое Intl.RelativeTimeFormat

`Intl.RelativeTimeFormat` — встроенный API браузера и Node.js для форматирования относительного времени с учётом локали. Вместо того чтобы писать «3 дня назад» вручную или подключать heavy-библиотеки вроде moment.js, вы получаете готовое решение прямо из стандарта ECMAScript Internationalization API.

Относительное время — это фразы типа «вчера», «через 5 минут», «3 недели назад». Они зависят не только от числа, но и от грамматических правил языка: в русском «1 день», «2 дня», «5 дней» — три разные формы. `Intl.RelativeTimeFormat` справляется с этим автоматически.

## Базовое использование

Конструктор принимает локаль и объект опций:

```javascript
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });

console.log(rtf.format(-1, 'day'));    // «вчера»
console.log(rtf.format(1, 'day'));     // «завтра»
console.log(rtf.format(-3, 'day'));    // «3 дня назад»
console.log(rtf.format(2, 'hour'));    // «через 2 часа»
console.log(rtf.format(-30, 'minute')); // «30 минут назад»
```

Метод `format(value, unit)` принимает:
- `value` — число (отрицательное = прошлое, положительное = будущее)
- `unit` — единица времени: `'second'`, `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'`, `'quarter'`, `'year'`

## Доступные единицы времени

```javascript
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'always' });

const units = [
  [1, 'second'],
  [5, 'minute'],
  [-2, 'hour'],
  [3, 'day'],
  [-1, 'week'],
  [2, 'month'],
  [-4, 'quarter'],
  [1, 'year'],
];

units.forEach(([value, unit]) => {
  console.log(rtf.format(value, unit));
});
// через 1 секунду
// через 5 минут
// 2 часа назад
// через 3 дня
// 1 неделю назад
// через 2 месяца
// 4 квартала назад
// через 1 год
```

## Опции конфигурации

### numeric

Опция `numeric` управляет тем, использовать ли числа или словесные замены.

```javascript
const always = new Intl.RelativeTimeFormat('ru', { numeric: 'always' });
const auto = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });

console.log(always.format(-1, 'day')); // «1 день назад»
console.log(auto.format(-1, 'day'));   // «вчера»

console.log(always.format(0, 'day'));  // «через 0 дней»
console.log(auto.format(0, 'day'));    // «сегодня»

console.log(always.format(1, 'day')); // «через 1 день»
console.log(auto.format(1, 'day'));   // «завтра»
```

Значение `'auto'` предпочтительнее для пользовательских интерфейсов — оно даёт более естественные фразы там, где они определены в языке.

### style

Опция `style` влияет на длину вывода:

```javascript
const long = new Intl.RelativeTimeFormat('ru', { style: 'long' });
const short = new Intl.RelativeTimeFormat('ru', { style: 'short' });
const narrow = new Intl.RelativeTimeFormat('ru', { style: 'narrow' });

console.log(long.format(-3, 'month'));   // «3 месяца назад»
console.log(short.format(-3, 'month'));  // «3 мес. назад»
console.log(narrow.format(-3, 'month')); // «3 мес. назад»
```

Различия между `short` и `narrow` заметнее в некоторых языках (например, в английском: `3 mo. ago` vs `3mo. ago`).

## Поддержка разных локалей

Вот ключевое преимущество — один и тот же код работает для любого языка:

```javascript
const locales = ['ru', 'en', 'de', 'fr', 'zh', 'ar', 'ja'];
const value = -3;
const unit = 'day';

locales.forEach(locale => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  console.log(`${locale}: ${rtf.format(value, unit)}`);
});
// ru: 3 дня назад
// en: 3 days ago
// de: vor 3 Tagen
// fr: il y a 3 jours
// zh: 3天前
// ar: قبل 3 أيام
// ja: 3日前
```

Арабский язык автоматически использует правильное направление и арабские числовые грамматические формы.

## Метод formatToParts

Метод `formatToParts` возвращает результат в виде массива токенов — удобно для кастомного рендеринга:

```javascript
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'always' });

console.log(rtf.formatToParts(-3, 'day'));
// [
//   { type: 'integer', value: '3', unit: 'day' },
//   { type: 'literal', value: ' дня назад' }
// ]

console.log(rtf.formatToParts(2, 'hour'));
// [
//   { type: 'literal', value: 'через ' },
//   { type: 'integer', value: '2', unit: 'hour' },
//   { type: 'literal', value: ' часа' }
// ]
```

Это полезно, когда нужно выделить число жирным или покрасить его в другой цвет:

```javascript
function formatRelativeHighlighted(value, unit, locale = 'ru') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
  const parts = rtf.formatToParts(value, unit);

  return parts
    .map(part => {
      if (part.type === 'integer') {
        return `<strong>${part.value}</strong>`;
      }
      return part.value;
    })
    .join('');
}

console.log(formatRelativeHighlighted(-5, 'minute'));
// «<strong>5</strong> минут назад»
```

## Вычисление относительного времени из Date

На практике вы получаете объект `Date` и хотите показать, сколько времени прошло. Вот утилита, которая автоматически выбирает подходящую единицу:

```javascript
const UNITS = [
  { unit: 'year',   seconds: 60 * 60 * 24 * 365 },
  { unit: 'month',  seconds: 60 * 60 * 24 * 30  },
  { unit: 'week',   seconds: 60 * 60 * 24 * 7   },
  { unit: 'day',    seconds: 60 * 60 * 24        },
  { unit: 'hour',   seconds: 60 * 60             },
  { unit: 'minute', seconds: 60                  },
  { unit: 'second', seconds: 1                   },
];

function timeAgo(date, locale = 'ru') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffSeconds = Math.round((date - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  for (const { unit, seconds } of UNITS) {
    if (absSeconds >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return rtf.format(0, 'second');
}

const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

console.log(timeAgo(threeDaysAgo)); // «3 дня назад»
console.log(timeAgo(inTwoHours));   // «через 2 часа»
console.log(timeAgo(yesterday));    // «вчера»
```

## Совместное использование с Intl.DateTimeFormat

Часто требуется показывать и относительное время, и абсолютную дату — например, в тултипе:

```javascript
function formatWithTooltip(date, locale = 'ru') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const dtf = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const diffDays = Math.round((date - Date.now()) / (1000 * 60 * 60 * 24));
  const relative = rtf.format(diffDays, 'day');
  const absolute = dtf.format(date);

  return { relative, absolute };
}

const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
const { relative, absolute } = formatWithTooltip(date);

console.log(relative); // «2 дня назад»
console.log(absolute); // «19 октября 2026 г. в 12:30»
```

## Кэширование экземпляров

Создание `Intl.RelativeTimeFormat` — не бесплатная операция. Если функция вызывается часто, кэшируйте экземпляры:

```javascript
const cache = new Map();

function getFormatter(locale, options = {}) {
  const key = `${locale}-${JSON.stringify(options)}`;
  if (!cache.has(key)) {
    cache.set(key, new Intl.RelativeTimeFormat(locale, options));
  }
  return cache.get(key);
}

function timeAgo(date, locale = 'ru') {
  const rtf = getFormatter(locale, { numeric: 'auto' });
  const diffSeconds = Math.round((date - Date.now()) / 1000);
  // ... логика выбора единицы
}
```

## Поддержка списка локалей

Можно передать массив локалей — движок выберет лучшую из доступных:

```javascript
const rtf = new Intl.RelativeTimeFormat(['ru-RU', 'ru', 'en'], {
  numeric: 'auto',
});

console.log(rtf.resolvedOptions().locale); // «ru-RU» если поддерживается
```

Метод `resolvedOptions()` возвращает итоговые параметры после разрешения локали:

```javascript
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
console.log(rtf.resolvedOptions());
// {
//   locale: 'ru',
//   numberingSystem: 'latn',
//   style: 'long',
//   numeric: 'auto'
// }
```

## Статический метод supportedLocalesOf

Проверить, какие локали поддерживаются без fallback:

```javascript
const supported = Intl.RelativeTimeFormat.supportedLocalesOf(['ru', 'ar', 'xx-FAKE']);
console.log(supported); // ['ru', 'ar']
```

## Практический пример: компонент ленты событий

Рассмотрим реальный сценарий — отображение timestamp в ленте активности:

```javascript
const THRESHOLDS = [
  { max: 45,        unit: 'second' },
  { max: 45 * 60,   unit: 'minute', div: 60       },
  { max: 22 * 3600, unit: 'hour',   div: 3600      },
  { max: 26 * 86400, unit: 'day',   div: 86400     },
  { max: 320 * 86400, unit: 'month', div: 30 * 86400 },
  { max: Infinity,  unit: 'year',   div: 365 * 86400 },
];

function formatActivityTime(timestamp, locale = 'ru') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = (timestamp - Date.now()) / 1000; // секунды
  const abs = Math.abs(diff);

  for (const { max, unit, div = 1 } of THRESHOLDS) {
    if (abs < max) {
      return rtf.format(Math.round(diff / div), unit);
    }
  }
}

const events = [
  { text: 'Новый комментарий', time: Date.now() - 20000 },
  { text: 'Файл загружен',     time: Date.now() - 3 * 60 * 1000 },
  { text: 'Задача закрыта',    time: Date.now() - 5 * 3600 * 1000 },
  { text: 'Спринт начат',      time: Date.now() - 3 * 86400 * 1000 },
];

events.forEach(({ text, time }) => {
  console.log(`${text}: ${formatActivityTime(time)}`);
});
// Новый комментарий: 20 секунд назад
// Файл загружен: 3 минуты назад
// Задача закрыта: 5 часов назад
// Спринт начат: 3 дня назад
```

## Поддержка в браузерах и Node.js

`Intl.RelativeTimeFormat` поддерживается во всех современных браузерах (Chrome 71+, Firefox 65+, Safari 14+, Edge 79+) и в Node.js начиная с версии 12. Для полифила в старых окружениях используется пакет `@formatjs/intl-relativetimeformat`.

```bash
npm install @formatjs/intl-relativetimeformat
```

```javascript
// Полифил подключается только если нативный API отсутствует
if (!Intl.RelativeTimeFormat) {
  await import('@formatjs/intl-relativetimeformat/polyfill');
  await import('@formatjs/intl-relativetimeformat/locale-data/ru');
}
```

## Итог

`Intl.RelativeTimeFormat` — правильный инструмент для отображения относительного времени в локализованных приложениях. Он:
- Поддерживает сложные грамматические правила (падежи, числовые формы)
- Работает с десятками языков без дополнительных данных
- Не требует сторонних зависимостей
- Даёт доступ к отдельным токенам через `formatToParts` для кастомной разметки

Главное, что нужно помнить: создавайте экземпляры заранее и кэшируйте их, выбирайте `numeric: 'auto'` для пользовательского интерфейса и используйте `formatToParts` когда нужен контроль над HTML-разметкой числа.

Чтобы глубже изучить работу с JavaScript и современными браузерными API, смотрите курс на PurpleSchool:
https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=intl-relativetimeformat