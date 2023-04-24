---
metaTitle: Number.isFinite() – JavaScript Numbers – Числа в JS
metaDescription: Как работает Number.isFinite() в JS | База знаний PurpleSchool
author: Дмитрий Фандорин
title: Number.isFinite() в JavaScript
preview: Number.isFinite() - это стандартный метод в JavaScript, который позволяет проверить, является ли переданное значение конечным числом...
---

Number.isFinite() - это стандартный метод в JavaScript, который позволяет проверить, является ли переданное значение конечным числом. Он возвращает логическое значение true, если аргумент является конечным числом, и false, если аргумент является бесконечностью или не является числом.

## Формат записи:
```javascript
Number.isFinite(value)
```
где value - значение, которое нужно проверить на конечность.

Примеры:
```javascript
Number.isFinite(42); // true
Number.isFinite(Infinity); // false
Number.isFinite(-Infinity); // false
Number.isFinite(NaN); // false
Number.isFinite("42"); // false
Number.isFinite(null); // false
Number.isFinite(undefined); // false
Number.isFinite(); // false
```

В первом примере метод вернет true, так как число 42 является конечным числом. Во втором и третьем примерах метод вернет false, так как Infinity и -Infinity не являются конечными числами. В четвертом примере метод также вернет false, так как NaN не является числом. В остальных примерах метод вернет false, так как переданные значения не являются числами.

Важно отметить, что Number.isFinite() не преобразует переданное значение в число, а просто проверяет, является ли оно числом и конечным. Если переданное значение не является числом, метод вернет false.

В итоге, метод Number.isFinite() очень полезен при работе с числами в JavaScript и позволяет легко проверить, является ли переданное значение конечным числом без необходимости выполнять дополнительные проверки.