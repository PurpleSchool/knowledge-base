---
metaTitle: reverse() – JavaScript Array – Методы массивов в JS
metaDescription: Как работает метод reverse() в JavaScript. Всё о методах работы с массивами в JavaScript | База знаний PurpleSchool
author: Виталий Котов
title: Как работает метод reverse() - JavaScript
preview: Метод reverse() возвращает массив в обратном порядке. Первый элемент массива становится последним, а последний — первым...
---

Метод `reverse()` возвращает массив в обратном порядке. Первый элемент массива становится последним, а последний — первым.

### Пример

```javascript
let numbers = [1, 2, 3, 4, 5];

// переворачиваем массив чисел
let reversedArray = numbers.reverse();

console.log(reversedArray);

// Вывод в консоль: [ 5, 4, 3, 2, 1 ]
```

## Синтаксис reverse()

Синтаксис метода `reverse()` следующий:

```javascript
arr.reverse();
```

Где `arr` - это массив.

## Параметры reverse()

Метод `reverse()` не принимает никаких параметров.

## Возвращаемое значение reverse()

Возвращает массив после изменения расположения его элементов в обратном порядке

> ### Примечания:
>
> Метод `reverse()` меняет порядок элементов на месте в котором был вызван. Это означает, что метод изменяет исходный массив.

## Примеры

### Пример 1: Использование метода reverse()

```javascript
let languages = ["JavaScript", "Python", "C++", "Java", "Lua"];

// задаём обратный порядок массиву languages
let reversedArray = languages.reverse();

console.log("Перевёрнутый массив: ", reversedArray);

// изменяется исходный массив
console.log("Исходный массив: ", languages);
```

Вывод в консоль:

```
Перевёрнутый массив: [ 'Lua', 'Java', 'C++', 'Python', 'JavaScript' ]
Исходный массив: [ 'Lua', 'Java', 'C++', 'Python', 'JavaScript' ]
```

В приведенном выше примере мы использовали метод `reverse()` для переворачивания массива `languages`.

`languages.reverse()` изменяет порядок следования каждого элемента в массиве и возвращает перевёрнутый массив.

Поскольку метод изменяет исходный массив, и `languages`, и `reversedArray` имеют одно и то же значение.

### Пример 2: Метод reverse() с оператором spread

В примере 1 мы видели, как метод `reverse()` модифицирует исходный массив.

Но если мы используем в массиве вместе с методом `reverse()` оператор `spread(...)`, то он не модифицирует исходный массив. Например:

```javascript
let languages = ["JavaScript", "Python", "C++", "Java", "Lua"];

// использetv оператор spread для переворачивания массива
let reversedArray = [...languages].reverse();

console.log("Перевёрнутый массив:", reversedArray);

// изменяется исходный массив
console.log("Исходный массив:", languages);
```

Вывод в консоль:

```
Перевёрнутый массив: [ 'Lua', 'Java', 'C++', 'Python', 'JavaScript' ]
Исходный массив: [ 'JavaScript', 'Python', 'C++', 'Java', 'Lua' ]
```
