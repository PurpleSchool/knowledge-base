---
metaTitle: "Intl.NumberFormat в JavaScript — полное руководство"
metaDescription: "Как использовать Intl.NumberFormat для форматирования чисел, валют и процентов с учётом локали в JavaScript. Примеры и опции."
author: "Антон Ларичев"
title: "Intl.NumberFormat — форматирование чисел в JavaScript"
preview: "Разбираем встроенный API Intl.NumberFormat: форматирование чисел, валют, процентов и единиц измерения с учётом локали."
---

## Что такое Intl.NumberFormat

`Intl.NumberFormat` — встроенный конструктор JavaScript, входящий в состав API интернационализации (`Intl`). Он позволяет форматировать числа в соответствии с правилами конкретной локали: разделители групп разрядов, десятичный разделитель, символы валют, единицы измерения и многое другое.

До появления `Intl` разработчики писали собственные функции форматирования или тянули тяжёлые библиотеки. Сегодня браузеры и Node.js поддерживают этот API нативно, без сторонних зависимостей.

```javascript
const formatter = new Intl.NumberFormat('ru-RU');
console.log(formatter.format(1234567.89)); // "1 234 567,89"
```

## Создание экземпляра

Конструктор принимает два аргумента:

```javascript
new Intl.NumberFormat(locales, options)
```

- `locales` — строка или массив строк с BCP 47-тегами локали (`'ru-RU'`, `'en-US'`, `'de-DE'`). Если передать `undefined` или опустить, используется системная локаль.
- `options` — объект с настройками форматирования.

```javascript
// Одна локаль
const ruFormatter = new Intl.NumberFormat('ru-RU');

// Массив локалей — движок выберет наиболее подходящую
const formatter = new Intl.NumberFormat(['ru-RU', 'en-US']);

// Системная локаль
const sysFormatter = new Intl.NumberFormat();
```

## Метод format

Основной метод — `format(number)`. Он принимает число и возвращает отформатированную строку.

```javascript
const en = new Intl.NumberFormat('en-US');
const ru = new Intl.NumberFormat('ru-RU');
const de = new Intl.NumberFormat('de-DE');

const num = 9876543.21;

console.log(en.format(num)); // "9,876,543.21"
console.log(ru.format(num)); // "9 876 543,21"
console.log(de.format(num)); // "9.876.543,21"
```

Каждая локаль применяет собственные правила: в русской — пробел как разделитель разрядов, запятая как десятичный разделитель; в американской — наоборот.

### Быстрый вызов без создания экземпляра

Если форматирование нужно один раз, можно использовать статический метод:

```javascript
console.log(Intl.NumberFormat('ru-RU').format(42000)); // "42 000"
```

Но если нужно форматировать много чисел — создайте экземпляр один раз и переиспользуйте его. Создание объекта `Intl.NumberFormat` — операция дорогая.

## Опция style — стиль форматирования

Опция `style` определяет базовый режим форматирования.

### decimal — обычное число (по умолчанию)

```javascript
const fmt = new Intl.NumberFormat('ru-RU', { style: 'decimal' });
console.log(fmt.format(12345.6)); // "12 345,6"
```

### currency — валюта

При использовании `style: 'currency'` обязательно нужно указать `currency` — код валюты по ISO 4217.

```javascript
const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

const usd = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
});

const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

console.log(rub.format(1500));   // "1 500,00 ₽"
console.log(usd.format(1500));   // "1 500,00 $"
console.log(eur.format(1500));   // "1.500,00 €"
```

Отображением символа валюты управляет опция `currencyDisplay`:

```javascript
const opts = { style: 'currency', currency: 'USD' };

// symbol (по умолчанию) — символ валюты
new Intl.NumberFormat('en-US', { ...opts, currencyDisplay: 'symbol' }).format(99);
// "$99.00"

// narrowSymbol — короткий символ без привязки к стране
new Intl.NumberFormat('en-US', { ...opts, currencyDisplay: 'narrowSymbol' }).format(99);
// "$99.00"

// code — ISO-код
new Intl.NumberFormat('en-US', { ...opts, currencyDisplay: 'code' }).format(99);
// "USD 99.00"

// name — полное название
new Intl.NumberFormat('ru-RU', { ...opts, currencyDisplay: 'name' }).format(99);
// "99,00 доллара США"
```

### percent — проценты

```javascript
const pct = new Intl.NumberFormat('ru-RU', { style: 'percent' });

console.log(pct.format(0.75));  // "75%"
console.log(pct.format(1.5));   // "150%"
console.log(pct.format(0.001)); // "0%"
```

Обратите внимание: значение умножается на 100. Чтобы отобразить `75%`, нужно передать `0.75`.

### unit — единицы измерения

```javascript
const speed = new Intl.NumberFormat('ru-RU', {
  style: 'unit',
  unit: 'kilometer-per-hour',
});

const weight = new Intl.NumberFormat('ru-RU', {
  style: 'unit',
  unit: 'kilogram',
  unitDisplay: 'long',
});

console.log(speed.format(120));  // "120 км/ч"
console.log(weight.format(5));   // "5 килограммов"
```

Опция `unitDisplay` управляет формой записи единицы: `'short'` (по умолчанию), `'narrow'`, `'long'`.

Полный список допустимых единиц можно найти в спецификации Unicode CLDR — он включает `byte`, `megabyte`, `celsius`, `fahrenheit`, `meter`, `mile`, `liter`, `gallon` и десятки других.

## Контроль количества знаков

### minimumFractionDigits и maximumFractionDigits

```javascript
const price = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

console.log(price.format(10));      // "10,00"
console.log(price.format(10.5));    // "10,50"
console.log(price.format(10.559));  // "10,56" — округление
```

### minimumIntegerDigits

Задаёт минимальное количество цифр до десятичного разделителя. Число дополняется нулями слева.

```javascript
const fmt = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
console.log(fmt.format(7));   // "007"
console.log(fmt.format(42));  // "042"
console.log(fmt.format(100)); // "100"
```

### minimumSignificantDigits и maximumSignificantDigits

Значимые цифры — альтернатива фиксированному количеству знаков после запятой.

```javascript
const sig = new Intl.NumberFormat('en-US', {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 5,
});

console.log(sig.format(1));          // "1.00"
console.log(sig.format(1.23456789)); // "1.2346"
console.log(sig.format(12345.6789)); // "12,346"
```

## Опция notation — вид записи числа

### standard (по умолчанию)

Обычная запись числа без изменений.

### scientific

Научная нотация: число × 10^n.

```javascript
const sci = new Intl.NumberFormat('en-US', { notation: 'scientific' });
console.log(sci.format(123456789)); // "1.235E8"
console.log(sci.format(0.000042));  // "4.2E-5"
```

### engineering

Похожа на научную, но показатель степени всегда кратен 3.

```javascript
const eng = new Intl.NumberFormat('en-US', { notation: 'engineering' });
console.log(eng.format(123456789)); // "123.457E6"
```

### compact

Сокращённая форма — удобна для отображения больших чисел в интерфейсах.

```javascript
const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact' });
console.log(compact.format(1000));        // "1 тыс."
console.log(compact.format(1500000));     // "1,5 млн"
console.log(compact.format(2300000000));  // "2,3 млрд"

// compactDisplay: 'long' даёт полные слова
const compactLong = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  compactDisplay: 'long',
});
console.log(compactLong.format(1500000)); // "1,5 миллиона"
```

## Знак числа — опция signDisplay

По умолчанию знак минус ставится только для отрицательных чисел. Опция `signDisplay` меняет это поведение.

```javascript
const always = new Intl.NumberFormat('en-US', { signDisplay: 'always' });
console.log(always.format(42));  // "+42"
console.log(always.format(-42)); // "-42"
console.log(always.format(0));   // "+0"

// exceptZero — знак везде, кроме нуля
const excZero = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' });
console.log(excZero.format(42));  // "+42"
console.log(excZero.format(0));   // "0"
console.log(excZero.format(-42)); // "-42"

// negative — знак только у отрицательных (поведение по умолчанию)
// never — знак никогда не показывается
```

## Метод formatToParts

`formatToParts(number)` возвращает массив объектов, каждый из которых описывает отдельный элемент числа. Это полезно, когда нужно стилизовать части числа по-разному.

```javascript
const fmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

const parts = fmt.formatToParts(1234.56);
console.log(parts);
/*
[
  { type: 'integer',          value: '1'    },
  { type: 'group',            value: '\u00A0' }, // неразрывный пробел
  { type: 'integer',          value: '234'  },
  { type: 'decimal',          value: ','    },
  { type: 'fraction',         value: '56'   },
  { type: 'literal',          value: '\u00A0' },
  { type: 'currency',         value: '₽'    },
]
*/
```

Пример применения — подсветка дробной части:

```javascript
function formatWithHighlight(number, locale, options) {
  const fmt = new Intl.NumberFormat(locale, options);
  return fmt.formatToParts(number).map(({ type, value }) => {
    if (type === 'fraction') {
      return `<span class="fraction">${value}</span>`;
    }
    return value;
  }).join('');
}

console.log(formatWithHighlight(1234.56, 'ru-RU', { minimumFractionDigits: 2 }));
// "1 234,<span class="fraction">56</span>"
```

## Метод formatRange

`formatRange(startNumber, endNumber)` форматирует диапазон чисел. Метод относительно новый, появился в 2022 году.

```javascript
const price = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

console.log(price.formatRange(1000, 2000)); // "1 000 – 2 000 ₽"
console.log(price.formatRange(500, 500));   // "~500 ₽" — одинаковые значения
```

Метод `formatRangeToParts` аналогичен `formatToParts`, но для диапазонов.

## Метод resolvedOptions

Позволяет узнать, какие опции действительно были применены после нормализации и подбора локали.

```javascript
const fmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
});

console.log(fmt.resolvedOptions());
/*
{
  locale: 'ru-RU',
  numberingSystem: 'latn',
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'symbol',
  currencySign: 'standard',
  minimumIntegerDigits: 1,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'auto',
  notation: 'standard',
  signDisplay: 'auto'
}
*/
```

## Практические примеры

### Форматирование цены в интернет-магазине

```javascript
const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const saleFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
  signDisplay: 'never',
});

const products = [
  { name: 'Ноутбук', price: 89990 },
  { name: 'Мышь',    price: 2499  },
  { name: 'Клавиатура', price: 4990 },
];

products.forEach(({ name, price }) => {
  console.log(`${name}: ${priceFormatter.format(price)}`);
});
// Ноутбук: 89 990 ₽
// Мышь: 2 499 ₽
// Клавиатура: 4 990 ₽
```

### Статистика с компактной нотацией

```javascript
const statFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumSignificantDigits: 3,
});

const stats = {
  views:     4320000,
  likes:     87400,
  comments:  1230,
  followers: 950000,
};

Object.entries(stats).forEach(([key, val]) => {
  console.log(`${key}: ${statFormatter.format(val)}`);
});
// views: 4,32 млн
// likes: 87,4 тыс.
// comments: 1,23 тыс.
// followers: 950 тыс.
```

### Таблица курсов валют

```javascript
function formatCurrency(amount, currency, locale = 'ru-RU') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

const rates = [
  { currency: 'USD', rate: 89.45 },
  { currency: 'EUR', rate: 97.12 },
  { currency: 'CNY', rate: 12.34 },
];

rates.forEach(({ currency, rate }) => {
  console.log(`1 ${currency} = ${formatCurrency(rate, 'RUB')}`);
});
// 1 USD = 89,45 ₽
// 1 EUR = 97,12 ₽
// 1 CNY = 12,34 ₽
```

### Процентные изменения с явным знаком

```javascript
const changeFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const changes = [0.034, -0.018, 0, 0.127, -0.053];

changes.forEach(change => {
  const sign = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  console.log(`${sign} ${changeFormatter.format(change)}`);
});
// ↑ +3,4%
// ↓ -1,8%
// → 0,0%
// ↑ +12,7%
// ↓ -5,3%
```

## Производительность: переиспользуйте экземпляры

Создание экземпляра `Intl.NumberFormat` включает парсинг локали, загрузку данных CLDR и компиляцию правил форматирования. Эта операция занимает значительно больше времени, чем сам вызов `format`.

```javascript
// Плохо: создаём новый объект при каждом вызове
function formatBad(number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(number);
}

// Хорошо: создаём один раз, переиспользуем
const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

function formatGood(number) {
  return rubFormatter.format(number);
}
```

Для динамических локалей используйте кэш:

```javascript
const formatterCache = new Map();

function getFormatter(locale, options) {
  const key = `${locale}-${JSON.stringify(options)}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat(locale, options));
  }
  return formatterCache.get(key);
}

// При повторном вызове с теми же параметрами объект не создаётся заново
getFormatter('ru-RU', { style: 'currency', currency: 'RUB' }).format(1500);
```

## Поддержка браузерами

`Intl.NumberFormat` поддерживается во всех современных браузерах и Node.js начиная с версии 0.12. Некоторые опции появились позже:

- `notation`, `compactDisplay` — Chrome 77+, Firefox 78+, Safari 14.1+
- `style: 'unit'` — Chrome 77+, Firefox 78+, Safari 14.1+
- `formatRange` — Chrome 106+, Firefox 116+, Safari 15.4+

Для старых окружений существуют полифиллы, например `@formatjs/intl-numberformat`.

## Итог

`Intl.NumberFormat` — мощный и гибкий инструмент, который избавляет от необходимости писать велосипеды для форматирования чисел. Он учитывает особенности сотен локалей, поддерживает валюты, проценты, единицы измерения и компактную нотацию. Главные практические правила: создавайте экземпляр один раз и переиспользуйте его, выбирайте нужный `style` в зависимости от контекста, а `formatToParts` используйте когда нужна тонкая стилизация отдельных частей числа.

Чтобы глубже разобраться с JavaScript и встроенными API браузера, приходите на курс [«JavaScript с нуля»](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=intl-number-format) на PurpleSchool.