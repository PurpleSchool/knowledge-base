---
metaTitle: Как правильно использовать forEach
metaDescription: Разбираемся как использовать  forEach правильно
author: 
title: Как правильно использовать метод forEach
preview: Метод forEach()вызывает функцию и перебирает элементы массива.
---

JavaScript для каждого()
В этом руководстве вы узнаете о методе JavaScript forEach() с помощью примеров.

_.Метод forEach()вызывает функцию и перебирает элементы массива. Этот forEach()метод также можно использовать на картах и ​​наборах._

JavaScript для каждого
Синтаксис метода forEach():

array.forEach(function(currentValue, index, arr))
Здесь,

function(currentValue, index, arr) — функция, которая будет выполняться для каждого элемента массива
currentValue - значение массива
index (необязательный) - индекс текущего элемента
arr (необязательный) - массив текущих элементов

forEach с массивами
Метод forEach()используется для перебора массива. Например,

```let students = ['John', 'Sara', 'Jack'];

// using forEach
students.forEach(myFunction);

function myFunction(item) {

    console.log(item);
}
```
Выполнить код
Выход

Джон
Сара
Джек
В приведенной выше программе forEach()метод принимает myFunction()функцию, которая отображает каждый элемент ученики множество.

Обновление элементов массива
Как мы видели в приведенном выше примере, forEach()метод используется для перебора массива, обновить элементы массива довольно просто. Например,

```let students = ['John', 'Sara', 'Jack'];

// using forEach
students.forEach(myFunction);

function myFunction(item, index, arr) {

    // adding strings to the array elements
    arr[index] = 'Hello ' + item;
}

console.log(students);
```
Выполнить код
Выход

["Привет, Джон", "Привет, Сара", "Привет, Джек"]
forEach с функцией стрелки
Вы можете использовать функцию стрелки с forEach()методом для написания программы. Например,

```// with arrow function and callback

const students = ['John', 'Sara', 'Jack'];

students.forEach(element => {
  console.log(element);
});
```
Выполнить код
Выход

Джон
Сара
Джек
для цикла forEach()
Вот пример того, как мы можем написать программу с for циклом и с forEach().

Использование цикла

```const arrayItems = ['item1', 'item2', 'item3'];
const copyItems = [];

// using for loop
for (let i = 0; i < arrayItems.length; i++) {
  copyItems.push(arrayItems[i]);
}

console.log(copyItems);
```
Выполнить код
Выход

["элемент1", "элемент2", "элемент3"]
Использование forEach()

```const arrayItems = ['item1', 'item2', 'item3'];
const copyItems = [];

// using forEach
arrayItems.forEach(function(item){
  copyItems.push(item);
})

console.log(copyItems);
```
Выполнить код
для...из с наборами
Вы можете перебирать элементы Set , используя forEach()метод. Например,

```// define Set
const set = new Set([1, 2, 3]);

// looping through Set
set.forEach(myFunction);

function myFunction(item) {
    console.log(item);
}
```
Выполнить код
Выход

1
2
3
forEach с картами
Вы можете перебирать элементы карты , используя forEach()метод. Например,

```let map = new Map();

// inserting elements
map.set('name', 'Jack');
map.set('age', '27');

// looping through Map
map.forEach (myFunction);

function myFunction(value, key) {
    
    console.log(key + '- ' + value);
}
```
Выполнить код