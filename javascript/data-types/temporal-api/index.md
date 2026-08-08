---
metaTitle: "JavaScript Temporal API: работа с датой и временем"
metaDescription: "Temporal API — современная замена Date в JavaScript. Разбираем PlainDate, ZonedDateTime, Duration и арифметику дат с примерами кода."
author: "Антон Ларичев"
title: "JavaScript Temporal API — новый стандарт работы с датой"
preview: "Temporal API приходит на смену устаревшему Date: строгая типизация, часовые пояса, арифметика дат и предсказуемое поведение из коробки."
---

## Почему Date больше не справляется

Объект `Date` появился в JavaScript в 1995 году и был скопирован с Java с минимальными изменениями. За прошедшие три десятилетия он накопил столько проблем, что разработчики по всему миру вынуждены тянуть в проекты сторонние библиотеки — Moment.js, date-fns, Luxon — только чтобы получить предсказуемое поведение при работе с датами.

Основные проблемы `Date`:

- **Месяцы начинаются с нуля.** `new Date(2024, 0, 1)` — это 1 января, не 1 февраля. Это источник ошибок, которые обнаруживаются только в production.
- **Мутабельность.** Методы вроде `setMonth()` изменяют объект на месте, что приводит к трудноуловимым багам при передаче дат между функциями.
- **Нет поддержки часовых поясов.** `Date` хранит только UTC и локальное время системы. Работать с произвольными таймзонами практически невозможно без сторонних инструментов.
- **Непоследовательный парсинг строк.** Поведение `new Date('2024-01-01')` различается между браузерами и окружениями.
- **Нет арифметики длительностей.** Чтобы прибавить один месяц к дате, нужно вручную обрабатывать граничные случаи — конец месяца, высокосные годы и переходы на летнее время.

Temporal API — это предложение TC39, которое на момент написания статьи находится на Stage 3 и уже доступно через полифил. Это не обёртка над `Date`, а полностью новая система типов для работы со временем.

## Ключевые принципы Temporal

Прежде чем разбирать конкретные типы, важно понять философию API:

**Иммутабельность.** Все объекты Temporal неизменяемы. Любая операция возвращает новый объект, не модифицируя исходный.

**Явные типы для разных сценариев.** Temporal не пытается сделать один универсальный тип. Вместо этого — набор специализированных типов: дата без времени, время без даты, момент в UTC, дата со временем и зоной.

**Строгая работа с часовыми поясами.** Нет неявных преобразований между UTC и локальным временем. Зону нужно указывать явно.

**Корректная арифметика.** Операции с датами учитывают переходы на летнее/зимнее время, разное количество дней в месяцах и секунды координации.

## Основные типы Temporal

### Temporal.Instant

`Temporal.Instant` представляет конкретный момент во времени — точку на временной шкале UTC. Это аналог `Date`, но без привязки к локальной зоне и без метаданных о календаре.

```javascript
// Текущий момент
const now = Temporal.Now.instant();
console.log(now.toString()); // 2024-03-15T10:30:00Z

// Из Unix-timestamp (в наносекундах)
const fromEpoch = Temporal.Instant.fromEpochMilliseconds(1710498600000);

// Из ISO-строки
const fromISO = Temporal.Instant.from('2024-03-15T10:30:00Z');

// Сравнение
const a = Temporal.Instant.from('2024-01-01T00:00:00Z');
const b = Temporal.Instant.from('2024-06-01T00:00:00Z');
console.log(Temporal.Instant.compare(a, b)); // -1
```

`Temporal.Instant` подходит для хранения временных меток в базах данных и логах — там, где важна точная точка во времени без привязки к локали пользователя.

### Temporal.PlainDate

`Temporal.PlainDate` — дата без времени и без часового пояса. Подходит для дней рождения, праздников, сроков — всего, что относится к конкретному дню, а не к конкретной секунде.

```javascript
// Создание
const date = Temporal.PlainDate.from({ year: 2024, month: 3, day: 15 });
const fromISO = Temporal.PlainDate.from('2024-03-15');

// Месяцы начинаются с 1 — никакого смещения
console.log(date.month); // 3
console.log(date.day);   // 15
console.log(date.year);  // 2024

// Текущая дата
const today = Temporal.Now.plainDateISO();

// Арифметика
const nextWeek = today.add({ weeks: 1 });
const lastMonth = today.subtract({ months: 1 });

console.log(nextWeek.toString());  // 2024-03-22
console.log(lastMonth.toString()); // 2024-02-15

// Граничные случаи обрабатываются корректно
const jan31 = Temporal.PlainDate.from('2024-01-31');
const oneMonthLater = jan31.add({ months: 1 });
console.log(oneMonthLater.toString()); // 2024-02-29 (2024 — высокосный)
```

### Temporal.PlainTime

`Temporal.PlainTime` — время суток без даты и без часового пояса. Полезен для расписаний: "встреча каждый день в 14:30".

```javascript
const time = Temporal.PlainTime.from({ hour: 14, minute: 30, second: 0 });
const fromISO = Temporal.PlainTime.from('14:30:00');

console.log(time.hour);   // 14
console.log(time.minute); // 30

// Добавление времени
const later = time.add({ hours: 2, minutes: 15 });
console.log(later.toString()); // 16:45:00

// Переход через полночь обрабатывается корректно
const lateNight = Temporal.PlainTime.from('23:00:00');
const morning = lateNight.add({ hours: 3 });
console.log(morning.toString()); // 02:00:00
```

### Temporal.PlainDateTime

`Temporal.PlainDateTime` объединяет дату и время, но без информации о часовом поясе. Это гражданское время — «2024-03-15 в 14:30» без уточнения, в каком городе.

```javascript
const dt = Temporal.PlainDateTime.from({
  year: 2024,
  month: 3,
  day: 15,
  hour: 14,
  minute: 30
});

const fromISO = Temporal.PlainDateTime.from('2024-03-15T14:30:00');

// Получение компонентов
console.log(dt.date.toString()); // 2024-03-15
console.log(dt.time.toString()); // 14:30:00

// Арифметика
const inTwoHours = dt.add({ hours: 2 });
console.log(inTwoHours.toString()); // 2024-03-15T16:30:00
```

### Temporal.ZonedDateTime

`Temporal.ZonedDateTime` — самый полный тип: дата, время и часовой пояс. Именно он нужен для большинства пользовательских интерфейсов.

```javascript
// Создание с явным указанием зоны
const moscow = Temporal.ZonedDateTime.from(
  '2024-03-15T14:30:00[Europe/Moscow]'
);

const newYork = Temporal.ZonedDateTime.from({
  year: 2024,
  month: 3,
  day: 15,
  hour: 14,
  minute: 30,
  timeZone: 'America/New_York'
});

// Конвертация между зонами
const moscowTime = Temporal.Now.zonedDateTimeISO('Europe/Moscow');
const tokyoTime = moscowTime.withTimeZone('Asia/Tokyo');

console.log(moscowTime.toString());
console.log(tokyoTime.toString());

// Переход на летнее время учитывается автоматически
const beforeDST = Temporal.ZonedDateTime.from(
  '2024-03-31T01:00:00[Europe/Berlin]'
);
const afterDST = beforeDST.add({ hours: 2 });
// В Берлине 31 марта 2024 переход на летнее время
console.log(afterDST.hour); // 4, а не 3
```

### Temporal.Duration

`Temporal.Duration` представляет промежуток времени. В отличие от простого числа миллисекунд, Duration хранит компоненты явно: годы, месяцы, недели, дни, часы, минуты, секунды.

```javascript
// Создание
const duration = Temporal.Duration.from({
  years: 1,
  months: 2,
  days: 15
});

const fromISO = Temporal.Duration.from('P1Y2M15D');

// Использование с датами
const start = Temporal.PlainDate.from('2024-01-01');
const end = start.add(duration);
console.log(end.toString()); // 2025-03-16

// Разница между датами
const date1 = Temporal.PlainDate.from('2024-01-01');
const date2 = Temporal.PlainDate.from('2024-12-31');
const diff = date1.until(date2);
console.log(diff.toString()); // P365D

// Разница в конкретных единицах
const diffInMonths = date1.until(date2, { largestUnit: 'month' });
console.log(diffInMonths.months); // 11
console.log(diffInMonths.days);   // 30
```

## Сравнение дат

Temporal предоставляет единообразный способ сравнения через статические методы `compare`:

```javascript
const a = Temporal.PlainDate.from('2024-01-01');
const b = Temporal.PlainDate.from('2024-06-15');
const c = Temporal.PlainDate.from('2024-01-01');

// compare возвращает -1, 0 или 1
console.log(Temporal.PlainDate.compare(a, b)); // -1
console.log(Temporal.PlainDate.compare(b, a)); // 1
console.log(Temporal.PlainDate.compare(a, c)); // 0

// Методы equals, since, until
console.log(a.equals(c)); // true

// Удобно для сортировки массивов
const dates = [
  Temporal.PlainDate.from('2024-06-01'),
  Temporal.PlainDate.from('2024-01-01'),
  Temporal.PlainDate.from('2024-03-15')
];

dates.sort(Temporal.PlainDate.compare);
console.log(dates.map(d => d.toString()));
// ['2024-01-01', '2024-03-15', '2024-06-01']
```

## Форматирование дат

Temporal интегрируется с `Intl.DateTimeFormat` через метод `toLocaleString`:

```javascript
const date = Temporal.PlainDate.from('2024-03-15');

console.log(date.toLocaleString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}));
// '15 марта 2024 г.'

const zdt = Temporal.ZonedDateTime.from(
  '2024-03-15T14:30:00[Europe/Moscow]'
);

console.log(zdt.toLocaleString('ru-RU', {
  dateStyle: 'full',
  timeStyle: 'short'
}));
// 'пятница, 15 марта 2024 г., 14:30'

// ISO-формат для API и хранения
console.log(date.toString());         // '2024-03-15'
console.log(zdt.toInstant().toString()); // '2024-03-15T11:30:00Z'
```

## Практический пример: расчёт возраста

Класссическая задача, которая выявляет все слабые места `Date`:

```javascript
function calculateAge(birthDateStr) {
  const birthDate = Temporal.PlainDate.from(birthDateStr);
  const today = Temporal.Now.plainDateISO();

  const diff = birthDate.until(today, { largestUnit: 'year' });

  return {
    years: diff.years,
    months: diff.months,
    days: diff.days
  };
}

const age = calculateAge('1990-05-20');
console.log(`${age.years} лет, ${age.months} месяцев, ${age.days} дней`);

// Проверка, наступил ли уже день рождения в этом году
function hasBirthdayPassedThisYear(birthDateStr) {
  const birth = Temporal.PlainDate.from(birthDateStr);
  const today = Temporal.Now.plainDateISO();

  const birthdayThisYear = birth.with({ year: today.year });
  return Temporal.PlainDate.compare(birthdayThisYear, today) <= 0;
}
```

## Практический пример: работа с расписанием в разных зонах

```javascript
function scheduleWorldwideMeeting(localTimeStr, localTimeZone, participants) {
  const meetingLocal = Temporal.ZonedDateTime.from(
    `${localTimeStr}[${localTimeZone}]`
  );

  return participants.map(({ name, timeZone }) => {
    const localTime = meetingLocal.withTimeZone(timeZone);
    return {
      name,
      localTime: localTime.toLocaleString('ru-RU', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  });
}

const result = scheduleWorldwideMeeting(
  '2024-03-15T15:00:00',
  'Europe/Moscow',
  [
    { name: 'Алексей (Москва)', timeZone: 'Europe/Moscow' },
    { name: 'John (New York)', timeZone: 'America/New_York' },
    { name: 'Yuki (Tokyo)', timeZone: 'Asia/Tokyo' }
  ]
);

result.forEach(({ name, localTime }) => {
  console.log(`${name}: ${localTime}`);
});
// Алексей (Москва): пятница, 15:00 МСК
// John (New York): пятница, 07:00 EST
// Yuki (Tokyo): пятница, 21:00 JST
```

## Статус и использование в проектах

Temporal API находится на Stage 3 TC39 — это означает, что спецификация финализирована и идёт работа по реализации в браузерах. На момент написания статьи:

- **Chrome/V8**: экспериментальная поддержка за флагом
- **Firefox/SpiderMonkey**: в разработке
- **Safari/JavaScriptCore**: в разработке
- **Node.js**: доступно через флаг `--harmony-temporal`

Для использования в production рекомендуется полифил:

```bash
npm install @js-temporal/polyfill
```

```javascript
// В точке входа приложения
import { Temporal, Intl, toTemporalInstant } from '@js-temporal/polyfill';

// Добавление метода к Date для миграции
Date.prototype.toTemporalInstant = toTemporalInstant;

// После этого Temporal доступен глобально
const today = Temporal.Now.plainDateISO();
```

## Миграция с Date на Temporal

Если в проекте уже используется `Date`, переход можно делать постепенно:

```javascript
// До: работа с Date
function addDaysOld(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// После: работа с Temporal
function addDays(dateStr, days) {
  return Temporal.PlainDate.from(dateStr).add({ days }).toString();
}

// Конвертация существующих Date-объектов
const legacyDate = new Date('2024-03-15T14:30:00Z');
const instant = legacyDate.toTemporalInstant(); // требует полифила
const zdt = instant.toZonedDateTimeISO('Europe/Moscow');

// Обратная конвертация при необходимости
const backToDate = new Date(zdt.epochMilliseconds);
```

При миграции удобно придерживаться стратегии: новый код пишется через Temporal, старые интерфейсы конвертируют данные на границе. Так можно переходить постепенно, не переписывая проект целиком.

## Итог

Temporal API решает накопившиеся за 30 лет проблемы `Date` системно, а не точечными патчами. Иммутабельность исключает класс ошибок с неожиданной мутацией. Явные типы для разных сценариев делают код самодокументирующим. Встроенная поддержка часовых поясов убирает необходимость в сторонних библиотеках для большинства задач.

Duration с именованными компонентами вместо миллисекунд делает арифметику дат читаемой и корректной в граничных случаях — конец месяца, переход на летнее время, высокосный год — без написания специальных обработчиков.

API уже готово к использованию через полифил, и инвестиции в изучение Temporal сейчас окупятся, когда поддержка появится нативно во всех окружениях.

Освоить современный JavaScript, включая новые возможности языка и работу с данными, можно на курсе [JavaScript для профессионалов](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=temporal-api) от PurpleSchool.