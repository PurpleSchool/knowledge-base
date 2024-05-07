---
metaTitle: Объект TypedArray в JavaScript
metaDescription: Разбираемся как работает объект TypedArray в JavaScript
author: Дмитрий Нечаев
title: Объект TypedArray в JavaScript
preview: Учимся пользоваться объектом TypedArray в JavaScript. Разбираем примеры использования
---

TypedArray в JavaScript представляет собой объект для работы с бинарными данными, хранящимися в ArrayBuffer. Он предоставляет эффективный способ работы с бинарными данными, такими как изображения, аудиофайлы и другие форматы данных, которые могут быть представлены в виде байтов.

### Создание TypedArray

TypedArray можно создать несколькими способами, включая использование конструкторов TypedArray или преобразование существующего ArrayBuffer в TypedArray.

```jsx
// Создание нового массива Uint8Array (беззнаковые целые числа от 0 до 255) длиной 10 элементов
const buffer = new ArrayBuffer(10); // Создаем буфер
const uint8Array = new Uint8Array(buffer); // Создаем TypedArray из буфера

// Преобразование существующего буфера в TypedArray
const existingBuffer = new Uint8Array([1, 2, 3, 4, 5]); // Создаем буфер и заполняем его данными

```

### Работа с данными в TypedArray

TypedArray предоставляет доступ к бинарным данным с помощью индексации элементов, а также поддерживает множество методов для работы с данными.

```jsx
const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);

// Доступ к элементам TypedArray
console.log(uint8Array[0]); // Выведет 1

// Методы для работы с данными
console.log(uint8Array.length); // Выведет 5 - длина массива
uint8Array.reverse(); // Разворачиваем массив
console.log(uint8Array); // Выведет [5, 4, 3, 2, 1]

```

### Различные типы TypedArray

JavaScript предоставляет несколько различных типов TypedArray, каждый из которых представляет данные разного размера и формата.

```jsx
const uint8Array = new Uint8Array(); // Беззнаковые 8-битные целые числа
const int16Array = new Int16Array(); // 16-битные целые числа
const float32Array = new Float32Array(); // 32-битные числа с плавающей точкой
// и так далее

```

### Работа с бинарными данными

TypedArray облегчает работу с бинарными данными, такими как изображения или аудиофайлы. Например, можно использовать Uint8Array для чтения и записи пиксельных данных изображения.

```jsx
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Преобразование данных изображения в Uint8Array
const pixelData = new Uint8Array(imageData.data.buffer);

```

### Использование TypedArray в сетевых запросах

TypedArray часто используется для обработки данных в сетевых запросах, таких как получение или отправка файлов или потоков данных.

```jsx
fetch('<https://example.com/data>') // Получение данных по сети
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const uint8Array = new Uint8Array(buffer);
    // Обработка полученных данных
  })
  .catch(error => console.error(error));

```

### Преобразование TypedArray

TypedArray можно преобразовать в обычные массивы и наоборот.

```jsx
const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
const normalArray = Array.from(uint8Array); // Преобразование TypedArray в обычный массив
const newUint8Array = new Uint8Array(normalArray); // Преобразование обычного массива в TypedArray

```

### Заключение

TypedArray в JavaScript предоставляет эффективный и удобный способ работы с бинарными данными в буфере. Он позволяет быстро и эффективно обрабатывать данные, такие как изображения, аудиофайлы и другие бинарные форматы данных. Понимание и использование TypedArray может значительно улучшить производительность и гибкость работы с бинарными данными в веб-приложениях.