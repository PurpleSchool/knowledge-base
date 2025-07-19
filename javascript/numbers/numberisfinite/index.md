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

Функция `Number.isFinite()` позволяет определить, является ли значение конечным числом. Она возвращает `true`, если значение является числом и не является `NaN`, `Infinity` или `-Infinity`. Если вы хотите детальнее погрузиться в фундаментальные знания JavaScript, получить системное понимание языка и научиться применять его на практике — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=number-isfinite-v-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

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

Использование `Number.isFinite()` позволяет точно определить, является ли значение конечным числом, что полезно для валидации данных и предотвращения ошибок при математических операциях. На курсе [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=number-isfinite-v-javascript) вы изучите эту функцию и другие способы работы с числами в JavaScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в JavaScript прямо сегодня.
