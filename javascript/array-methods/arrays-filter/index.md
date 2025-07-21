---
metaTitle: filter() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод filter() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод filter() - JavaScript
preview: Метод filter() возвращает новый массив со всеми элементами, которые прошли проверку, определенную заданной функцией...
---

Метод `filter()` возвращает новый массив со всеми элементами, которые прошли проверку, определенную заданной функцией.

```javascript
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// функция проверки чётных чисел
function checkEven(number) {
  if (number % 2 == 0) return true;
  else return false;
}

// создание нового массива с элементами, прошедшими проверку на чётность
let evenNumbers = numbers.filter(checkEven);
console.log(evenNumbers);

// Output: [ 2, 4, 6, 8, 10 ]
```

## Синтаксис filter()

Синтаксис метода `filter()` следующий:

```javascript
arr.filter(callback(element), thisArg);
```

Где `arr` - это массив.

Метод `filter()` создает новый массив, содержащий только те элементы исходного массива, которые удовлетворяют заданному условию. Этот метод широко используется для выборки данных из массивов. Для эффективного использования `filter()` необходимо хорошее понимание основ JavaScript и умение работать с функциями. Если вы хотите детальнее погрузиться в JavaScript и узнать больше о методах фильтрации массивов, — приходите на наш большой курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-filter-javascript). На курсе 198 уроков и 30 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Параметры filter()

Метод `filter()` принимает:

- `callback` - функцию с проверкой, для вызова на каждом элементе массива; возвращает `true`, если элемент прошёл проверку, иначе возвращает `false`. Принимает:
  - `element` - текущий обрабатываемый элемент в массиве.
- `thisArg` (необязательно) - значение, используемое в качестве `this`, при вызове функции `callback`. По умолчанию определен как `undefined`.

## Возвращаемое значение filter()

Возвращает новый массив, содержащий только те элементы, которые прошли проверку.

> ### Примечания:
>
> - `filter()` не изменяет исходный массив.
> - `filter()` не вызывает функцию `callback` для элементов массива без значений.

## Примеры

### Пример 1: Фильтрация элементов массива

```javascript
const prices = [1800, 2000, null, 3000, 5000, "Thousand", 500, 8000];

function checkPrice(element) {
  return element > 2000 && !Number.isNaN(element);
}

let filteredPrices = prices.filter(checkPrice);
console.log(filteredPrices); // [ 3000, 5000, 8000 ]

// используем стрелочную функцию
let newPrices = prices.filter((price) => price > 2000 && !Number.isNaN(price));
console.log(newPrices); // [ 3000, 5000, 8000 ]
```

Вывод в консоль:

```
[ 3000, 5000, 8000 ]
[ 3000, 5000, 8000 ]
```

Здесь отфильтровываются все числа, меньшие или равные 2000, а также все нечисловые значения.

### Пример 2: Поиск в массиве

```javascript
const languages = [
  "JavaScript",
  "Python",
  "Ruby",
  "C",
  "C++",
  "Swift",
  "PHP",
  "Java",
];

function searchFor(arr, query) {
  function condition(element) {
    return element.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  }
  return arr.filter(condition);
}

let newArr = searchFor(languages, "ja");
console.log(newArr); // [ 'JavaScript', 'Java' ]

// используем стрелочную функцию
const searchArr = (arr, query) =>
  arr.filter(
    (element) => element.toLowerCase().indexOf(query.toLowerCase()) !== -1
  );

let newLanguages = searchArr(languages, "p");
console.log(newLanguages); // [ 'JavaScript', 'Python', 'PHP' ]
```

Вывод в консоль:

```
[ 'JavaScript', 'Java' ]
[ 'JavaScript', 'Python', 'PHP' ]
```

Здесь `element` и `query` преобразуются в нижний регистр, а метод `indexOf()` используется для проверки наличия `query` внутри `element`.

Те элементы, которые не проходят эту проверку, отфильтровываются.

`filter()` - это один из самых полезных методов для работы с массивами. Чтобы уверенно использовать этот и другие методы фильтрации, важно понимать структуру массивов, принципы работы с функциями и концепцию callback-функций. Курс [JavaScript с нуля](https://purpleschool.ru/course/javascript-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=kak-rabotaet-metod-filter-javascript) предоставит вам все необходимые знания. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир JavaScript прямо сегодня.
