---
metaTitle: indexOf() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод indexOf() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод indexOf() - JavaScript
preview: Метод indexOf() возвращает первый индекс, по которому данный элемент может быть найден в массиве или -1, если он не найден...
---

Метод `indexOf()` возвращает первый индекс, по которому данный элемент может быть найден в массиве или -1, если он не найден.

### Пример

```javascript
let languages = ["Java", "JavaScript", "Python", "JavaScript"];

// // получаем индекс первого вхождения "JavaScript"
let index = languages.indexOf("JavaScript");
console.log(index);

// Вывод в консоль: 1
```

## Синтаксис indexOf()

Синтаксис метода `indexOf()` следующий:

```javascript
arr.indexOf(searchElement, fromIndex);
```

Где `arr` - это массив.

## Параметры indexOf()

Метод `indexOf()` принимает:

- `searchElement` - элемент, который нужно найти в массиве.
- `fromIndex` (необязательно) - индекс, с которого следует начать поиск. По умолчанию он равен 0.

## Возвращаемое значение indexOf()

- Возвращает первый индекс элемента в массиве, если он присутствует хотя бы один раз.
- Возвращает -1, если элемент не найден в массиве.

> ### Примечание:
>
> `indexOf()` сравнивает элемент `searchElement` с элементами массива, используя строгое равенство (аналогично оператору `triple-equals` или `===`).

## Примеры

### Пример 1: Использование метода indexOf()

```javascript
var priceList = [10, 8, 2, 31, 10, 1, 65];

// indexOf() возвращает индекс первого появления
var index1 = priceList.indexOf(31);
console.log(index1); // 3

var index2 = priceList.indexOf(10);
console.log(index2); // 0

// второй аргумент указывает начальный индекс поиска
var index3 = priceList.indexOf(10, 1);
console.log(index3); // 4

// indexOf() возвращает -1, если ничего не найдено
var index4 = priceList.indexOf(69.5);
console.log(index4); // -1
```

Вывод в консоль:

```
3
0
4
-1
```

> ### Примечания:
>
> - Если `fromIndex >= array.length`, поиск в массиве не производится и возвращается -1.
> - Если `fromIndex < 0`, индекс вычисляется в обратном порядке. Например, -1 обозначает индекс последнего элемента и так далее.

### Пример 2. Поиск всех появлений элемента

```javascript
function findAllIndex(array, element) {
  indices = [];
  var currentIndex = array.indexOf(element);
  while (currentIndex != -1) {
    indices.push(currentIndex);
    currentIndex = array.indexOf(element, currentIndex + 1);
  }
  return indices;
}

var priceList = [10, 8, 2, 31, 10, 1, 65, 10];

var occurance1 = findAllIndex(priceList, 10);
console.log(occurance1); // [ 0, 4, 7 ]

var occurance2 = findAllIndex(priceList, 8);
console.log(occurance2); // [ 1 ]

var occurance3 = findAllIndex(priceList, 9);
console.log(occurance3); // []
```

Вывод в консоль:

```javascript
[ 0, 4, 7 ]
[ 1 ]
[]
```

### Пример 3: Поиск существования элемента, иначе его добавление

```javascript
function checkOrAdd(array, element) {
  if (array.indexOf(element) === -1) {
    array.push(element);
    console.log("Элемент не найден! Обновляем массив.");
  } else {
    console.log(element + " уже находится в массиве.");
  }
}

var parts = ["Monitor", "Keyboard", "Mouse", "Speaker"];

checkOrAdd(parts, "CPU"); // Элемент не найден! Обновляем массив
console.log(parts); // [ 'Monitor', 'Keyboard', 'Mouse', 'Speaker', 'CPU' ]

checkOrAdd(parts, "Mouse"); // Mouse уже находится в массиве
```

Вывод в консоль:

```javascript
Элемент не найден! Обновляем массив.
[ 'Monitor', 'Keyboard', 'Mouse', 'Speaker', 'CPU' ]
Mouse уже находится в массиве.
```
