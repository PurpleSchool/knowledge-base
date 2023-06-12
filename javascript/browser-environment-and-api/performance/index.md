---
metaTitle: Performance – JavaScript Browser Environment And API – Браузерное окружение и API в JS
metaDescription: Как работает Performance в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: Performance в JavaScript
preview: Performance API - это набор инструментов в браузере, который позволяет измерять производительность JavaScript-кода...
---

Performance API - это набор инструментов в браузере, который позволяет измерять производительность JavaScript-кода. Он предоставляет методы для создания меток и измерений, а также для получения информации о времени выполнения задач и производительности сети.

Пример:

```javascript
// Создание метки
performance.mark('myFunction-start');

// Выполнение функции
myFunction();

// Завершение метки
performance.mark('myFunction-end');

// Создание измерения
performance.measure('myFunction', 'myFunction-start', 'myFunction-end');

// Получение результатов
const perfEntries = performance.getEntriesByName('myFunction');
console.log(perfEntries[0].duration);
```

## Форма записи

### Создание меток

Для создания метки используйте метод `performance.mark(name)`, где `name` - это уникальный идентификатор метки.

Пример:

```javascript
performance.mark('myFunction-start');
```

### Создание измерений

Для создания измерения используйте метод `performance.measure(name, startMark, endMark)`, где `name` - это уникальный идентификатор измерения, `startMark` - это идентификатор начальной метки, а `endMark` - это идентификатор конечной метки.

Пример:

```javascript
performance.measure('myFunction', 'myFunction-start', 'myFunction-end');
```

### Способы получения меток и измерений

Для получения меток и измерений используйте методы `performance.getEntries()`, `performance.getEntriesByName(name)` или `performance.getEntriesByType(type)`, где `name` - это уникальный идентификатор метки или измерения, а `type` - это тип записи (например, 'mark' или 'measure').

Пример:

```javascript
const perfEntries = performance.getEntriesByName('myFunction');
console.log(perfEntries[0].duration);
```

### Способы очистить записи

Для очистки всех записей используйте метод `performance.clearMarks()` или `performance.clearMeasures()`.

Пример:

```javascript
performance.clearMarks();
performance.clearMeasures();
```

## Описание

Performance API предоставляет различные типы записей, такие как:

- Метки (marks) - это идентификаторы, которые помогают измерить время выполнения определенного участка кода.
- Измерения (measures) - это разница между двумя метками, которая позволяет измерить время выполнения определенного участка кода.

Для измерения производительности в JavaScript можно использовать Performance API, который предоставляет методы для создания меток и измерений, а также для получения информации о времени выполнения задач и производительности сети. Кроме того, существуют сторонние инструменты, такие как Google Chrome DevTools, которые предоставляют расширенные возможности для измерения производительности.

## Заключение

Performance API - это мощный инструмент, который помогает измерять производительность JavaScript-кода. Использование меток и измерений позволяет измерять время выполнения определенных участков кода и идентифицировать узкие места в производительности. Кроме того, существует множество инструментов и методов оптимизации, которые помогают улучшить производительность вашего JavaScript-кода. Использование Performance API позволяет более точно и детально измерять производительность вашего кода и оптимизировать его для достижения максимальной производительности.