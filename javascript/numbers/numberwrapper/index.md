---
metaTitle: Обёртка Number – JavaScript Numbers – Числа в JS
metaDescription: Как работает обёртка Number в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: Обёртка Number в JavaScript
preview: Number - это встроенный объект в JavaScript, который представляет числа и обеспечивает различные методы для работы с ними...
---

Number - это встроенный объект в JavaScript, который представляет числа и обеспечивает различные методы для работы с ними. Объект Number также может использоваться в качестве обёртки для примитивных числовых типов данных в JavaScript, таких как число, чтобы предоставить им доступ к методам и свойствам объекта Number.

## Форма записи

Для создания объекта Number можно использовать ключевое слово "new" и вызвать функцию-конструктор Number(). Например:

```javascript
let num = new Number(42);
console.log(num); // Output: Number {42}
```

Однако, в большинстве случаев не нужно использовать объект Number в качестве обёртки для чисел, так как JavaScript автоматически преобразует примитивные числовые значения в объекты Number при вызове методов объекта Number.

## Описание работы

Объект Number предоставляет множество методов и свойств для работы с числами. Рассмотрим несколько из них:

### Проверки на специальные значения

Методы объекта Number позволяют проверить числа на специальные значения, такие как NaN, Infinity и -Infinity. Например:

```javascript
console.log(Number.isNaN(NaN)); // Output: true
console.log(Number.isFinite(42)); // Output: true
console.log(Number.isFinite(Infinity)); // Output: false
```

### Форматирование числа

Объект Number также предоставляет методы для форматирования числа, такие как toFixed(), toPrecision() и toExponential(). Например:

```javascript
let num = 42.123456;
console.log(num.toFixed(2)); // Output: "42.12"
console.log(num.toPrecision(4)); // Output: "42.12"
console.log(num.toExponential(4)); // Output: "4.2123e+1"
```

### Константы
Объект Number также предоставляет несколько констант, такие как Number.MAX_VALUE, Number.MIN_VALUE и Number.EPSILON. Например:

```javascript
console.log(Number.MAX_VALUE); // Output: 1.7976931348623157e+308
console.log(Number.MIN_VALUE); // Output: 5e-324
console.log(Number.EPSILON); // Output: 2.220446049250313e-16
```

Ниже приведены примеры использования некоторых методов объекта Number:

#### Пример 1:

```javascript
let num = 42.123456;
console.log(Number.isNaN(num)); // Output: false
console.log(num.toFixed(2)); // Output: "42.12"
console.log(num.toPrecision(4)); // Output: "42.12"
console.log(num.toExponential(4)); // Output: "4.2123e+1"
```

#### Пример 2:

```javascript
console.log(Number.isFinite(42)); // Output: true
console.log(Number.isFinite(Infinity)); // Output: false
console.log(Number.MAX_VALUE); // Output: 1.7976931348623157e+308
console.log(Number.MIN_VALUE); // Output: 5e-324
console.log(Number.EPSILON); // Output: 2.220446049250313e-16
```

В итоге, объект Number предоставляет множество методов и свойств для работы с числами в JavaScript, и может использоваться в качестве обёртки для примитивных числовых типов данных в JavaScript. Однако, в большинстве случаев не нужно использовать объект Number в качестве обёртки для чисел, так как JavaScript автоматически преобразует примитивные числовые значения в объекты Number при вызове методов объекта Number.