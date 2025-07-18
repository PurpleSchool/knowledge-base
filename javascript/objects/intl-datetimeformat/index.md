---
metaTitle: Intl.DateTimeFormat в JavaScript
metaDescription: Разбираемся как работает Intl.DateTimeFormat в JavaScript
author: Дмитрий Нечаев
title: Intl.DateTimeFormat в JavaScript
preview: Учимся пользоваться Intl.DateTimeFormat в JavaScript. Разбираем примеры использования
---

JavaScript предоставляет различные инструменты для работы с датами и временем, одним из которых является объект Intl.DateTimeFormat. Этот объект предоставляет удобный способ форматирования даты и времени с учетом локали, что делает его мощным инструментом для создания приложений, поддерживающих многоязычность и мультирегиональность.

## Введение в Intl.DateTimeFormat

Intl.DateTimeFormat - это объект, встроенный в JavaScript, который позволяет форматировать дату и время в соответствии с правилами локали пользователя. Он предоставляет гибкий и удобный интерфейс для настройки вывода даты и времени.

## Создание экземпляра Intl.DateTimeFormat

Прежде чем начать использовать Intl.DateTimeFormat, необходимо создать экземпляр этого объекта. Для этого используется конструктор Intl.DateTimeFormat(). Он принимает два параметра: локаль и объект опций.

```jsx
// Создание экземпляра Intl.DateTimeFormat для локали по умолчанию
const dateFormatter = new Intl.DateTimeFormat();

// Создание экземпляра Intl.DateTimeFormat для определенной локали и с определенными опциями
const dateFormatterRu = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', // Полное название дня недели
  year: 'numeric', // Год
  month: 'long',   // Полное название месяца
  day: 'numeric',  // День месяца
  hour: 'numeric', // Час
  minute: 'numeric', // Минута
});

```
Объект `Intl.DateTimeFormat` предоставляет мощные возможности для форматирования дат и времени в соответствии с локальными стандартами.  Использование этого объекта позволяет создавать приложения, которые адаптируются к различным региональным настройкам. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=intl-datetimeformat-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Форматирование даты и времени

После создания экземпляра Intl.DateTimeFormat можно использовать его для форматирования даты и времени.

```jsx
// Текущая дата и время
const now = new Date();

// Форматирование даты и времени с использованием локали по умолчанию
const formattedDate = dateFormatter.format(now);
console.log("Дата и время (локаль по умолчанию):", formattedDate);

// Форматирование даты и времени с использованием русской локали и определенных опций
const formattedDateRu = dateFormatterRu.format(now);
console.log("Дата и время (русская локаль):", formattedDateRu);

```

## Опции форматирования

Intl.DateTimeFormat позволяет задавать различные опции для форматирования даты и времени. Ниже приведены некоторые из них:

- `weekday`: Формат вывода дня недели.
- `year`: Формат вывода года.
- `month`: Формат вывода месяца.
- `day`: Формат вывода дня месяца.
- `hour`: Формат вывода часа.
- `minute`: Формат вывода минуты.
- `second`: Формат вывода секунды.
- `timeZoneName`: Формат вывода названия временной зоны.

## Примеры

```jsx
const dateFormatterEn = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const dateFormatterDe = new Intl.DateTimeFormat('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const date = new Date('2024-05-06T12:30:00');

console.log("День недели (EN):", dateFormatterEn.format(date));
console.log("День недели (DE):", dateFormatterDe.format(date));

```

## Заключение

Intl.DateTimeFormat предоставляет удобный способ форматирования даты и времени с учетом локали пользователя. Его гибкость и мощные возможности делают его важным инструментом при создании приложений, ориентированных на международный рынок. Внимательно настраивайте опции форматирования, чтобы соответствовать требованиям вашего проекта и ожиданиям пользователей.

Правильное форматирование дат и времени - важная часть разработки приложений, ориентированных на международную аудиторию. Чтобы узнать больше о `Intl.DateTimeFormat` и других способах работы с датами и временем в JavaScript, присоединяйтесь к нашему курсу [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=intl-datetimeformat-v-javascript). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
