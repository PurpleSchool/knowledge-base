---
metaTitle: "Canvas API в JavaScript: рисование на холсте"
metaDescription: "Полное руководство по Canvas API в JavaScript: создание фигур, работа с изображениями, анимации и практические примеры."
author: "Антон Ларичев"
title: "Canvas API в JavaScript"
preview: "Разбираем Canvas API: как рисовать фигуры, текст, работать с изображениями и создавать анимации прямо в браузере."
---

## Что такое Canvas API

Canvas API — это встроенный браузерный интерфейс, позволяющий рисовать двумерную графику с помощью JavaScript. Он работает через HTML-элемент `<canvas>`, который предоставляет пиксельный холст. В отличие от SVG, где каждый элемент является частью DOM-дерева, Canvas работает с пикселями напрямую — всё нарисованное немедленно растровизируется и «забывается» DOM.

Canvas используется для:
- визуализации данных (графики, диаграммы)
- браузерных игр
- обработки изображений
- генерации анимаций
- создания графических редакторов

## Базовая настройка

Для начала работы нужен HTML-элемент `<canvas>` и получение контекста рендеринга.

```html
<canvas id="myCanvas" width="800" height="600"></canvas>
```

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
```

Метод `getContext('2d')` возвращает объект `CanvasRenderingContext2D` — именно через него выполняются все операции рисования. Существует также контекст `'webgl'` для трёхмерной графики, но он относится к отдельному API.

### Размеры холста

Важно различать CSS-размеры элемента и его реальное разрешение. CSS изменяет визуальный размер, но не количество пикселей.

```javascript
// Правильно: размеры через атрибуты
canvas.width = 800;
canvas.height = 600;

// Неправильно для разрешения: CSS масштабирует пиксели
// canvas.style.width = '800px';
```

Для поддержки дисплеев с высокой плотностью пикселей (Retina) нужно учитывать `devicePixelRatio`:

```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = 800 * dpr;
canvas.height = 600 * dpr;
canvas.style.width = '800px';
canvas.style.height = '600px';
ctx.scale(dpr, dpr);
```

## Рисование фигур

### Прямоугольники

Прямоугольник — единственная встроенная примитивная фигура в Canvas API.

```javascript
// Залитый прямоугольник
ctx.fillStyle = '#3b82f6';
ctx.fillRect(50, 50, 200, 100); // x, y, ширина, высота

// Только контур
ctx.strokeStyle = '#1e40af';
ctx.lineWidth = 3;
ctx.strokeRect(300, 50, 200, 100);

// Очистить область
ctx.clearRect(0, 0, canvas.width, canvas.height); // очистить весь холст
```

### Пути (paths)

Все сложные фигуры строятся через пути — последовательности точек и кривых.

```javascript
// Треугольник
ctx.beginPath();
ctx.moveTo(400, 50);  // начальная точка
ctx.lineTo(500, 200); // линия к точке
ctx.lineTo(300, 200);
ctx.closePath();      // замкнуть путь обратно к начальной точке
ctx.fillStyle = '#10b981';
ctx.fill();
ctx.strokeStyle = '#065f46';
ctx.lineWidth = 2;
ctx.stroke();
```

Вызов `beginPath()` обязателен перед каждой новой фигурой — иначе предыдущие пути продолжат накапливаться.

### Окружности и дуги

```javascript
ctx.beginPath();
ctx.arc(
  200,          // x центра
  300,          // y центра
  80,           // радиус
  0,            // начальный угол (радианы)
  Math.PI * 2,  // конечный угол
  false         // против часовой стрелки?
);
ctx.fillStyle = '#f59e0b';
ctx.fill();

// Полукруг
ctx.beginPath();
ctx.arc(450, 300, 80, 0, Math.PI);
ctx.strokeStyle = '#b45309';
ctx.lineWidth = 4;
ctx.stroke();
```

### Кривые Безье

Для плавных кривых используются квадратичные и кубические кривые Безье.

```javascript
// Квадратичная кривая Безье (одна контрольная точка)
ctx.beginPath();
ctx.moveTo(50, 400);
ctx.quadraticCurveTo(250, 300, 450, 400); // (cx, cy, x, y)
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 3;
ctx.stroke();

// Кубическая кривая Безье (две контрольные точки)
ctx.beginPath();
ctx.moveTo(50, 500);
ctx.bezierCurveTo(150, 400, 350, 600, 450, 500);
ctx.strokeStyle = '#ec4899';
ctx.lineWidth = 3;
ctx.stroke();
```

## Стили и цвета

### Градиенты

```javascript
// Линейный градиент
const linearGrad = ctx.createLinearGradient(0, 0, 400, 0);
linearGrad.addColorStop(0, '#3b82f6');
linearGrad.addColorStop(0.5, '#8b5cf6');
linearGrad.addColorStop(1, '#ec4899');

ctx.fillStyle = linearGrad;
ctx.fillRect(50, 50, 400, 100);

// Радиальный градиент
const radialGrad = ctx.createRadialGradient(250, 250, 10, 250, 250, 100);
radialGrad.addColorStop(0, '#fef9c3');
radialGrad.addColorStop(1, '#f59e0b');

ctx.fillStyle = radialGrad;
ctx.beginPath();
ctx.arc(250, 250, 100, 0, Math.PI * 2);
ctx.fill();
```

### Тени

```javascript
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 15;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;

ctx.fillStyle = '#3b82f6';
ctx.fillRect(100, 100, 200, 150);

// Сброс тени
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
```

### Прозрачность

```javascript
ctx.globalAlpha = 0.5; // 0 — прозрачный, 1 — непрозрачный
ctx.fillStyle = '#ef4444';
ctx.fillRect(100, 100, 200, 200);
ctx.globalAlpha = 1; // вернуть полную непрозрачность
```

## Работа с текстом

```javascript
ctx.font = 'bold 32px Arial, sans-serif';
ctx.fillStyle = '#1f2937';
ctx.textAlign = 'center';    // 'left' | 'center' | 'right'
ctx.textBaseline = 'middle'; // 'top' | 'middle' | 'bottom'

ctx.fillText('Привет, Canvas!', canvas.width / 2, 100);

// Контур текста
ctx.strokeStyle = '#3b82f6';
ctx.lineWidth = 1;
ctx.strokeText('Контурный текст', canvas.width / 2, 160);

// Измерить ширину текста
const metrics = ctx.measureText('Привет, Canvas!');
console.log(metrics.width); // ширина в пикселях
```

## Работа с изображениями

### Отрисовка изображения

```javascript
const img = new Image();
img.src = '/path/to/image.png';

img.onload = () => {
  // Простая отрисовка
  ctx.drawImage(img, 50, 50);

  // С заданными размерами
  ctx.drawImage(img, 50, 50, 300, 200);

  // Обрезка (crop): src x, src y, src w, src h, dst x, dst y, dst w, dst h
  ctx.drawImage(img, 100, 100, 200, 200, 50, 50, 150, 150);
};
```

### Манипуляция пикселями

Canvas позволяет читать и изменять каждый пиксель через `ImageData`.

```javascript
// Получить данные пикселей
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data; // Uint8ClampedArray [R, G, B, A, R, G, B, A, ...]

// Перевести изображение в оттенки серого
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = avg;     // R
  data[i + 1] = avg; // G
  data[i + 2] = avg; // B
  // data[i + 3] — альфа-канал, не меняем
}

// Записать изменённые данные обратно
ctx.putImageData(imageData, 0, 0);
```

## Трансформации

Canvas поддерживает стандартные матричные трансформации.

```javascript
// Сохранить текущее состояние контекста
ctx.save();

// Перемещение
ctx.translate(200, 200);

// Поворот (в радианах)
ctx.rotate(Math.PI / 4); // 45 градусов

// Масштабирование
ctx.scale(1.5, 1.5);

// Нарисовать прямоугольник относительно новой системы координат
ctx.fillStyle = '#3b82f6';
ctx.fillRect(-50, -50, 100, 100);

// Восстановить сохранённое состояние
ctx.restore();
```

`save()` и `restore()` сохраняют/восстанавливают стек состояний контекста: трансформации, стили, `globalAlpha` и прочее. Это ключевой паттерн при работе с несколькими независимыми объектами.

## Анимация

Анимации в Canvas строятся на `requestAnimationFrame` — браузерном API, который вызывает функцию перед следующей отрисовкой экрана (обычно 60 раз в секунду).

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let x = 0;
const ballRadius = 30;
const speed = 3;
let direction = 1;

function animate() {
  // Очистить холст
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Обновить состояние
  x += speed * direction;
  if (x + ballRadius >= canvas.width || x - ballRadius <= 0) {
    direction *= -1;
  }

  // Нарисовать
  ctx.beginPath();
  ctx.arc(x, canvas.height / 2, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();

  // Запросить следующий кадр
  requestAnimationFrame(animate);
}

animate();
```

### Управление временем

Для скорости, не зависящей от частоты кадров, используют дельту времени.

```javascript
let lastTime = 0;
const pixelsPerSecond = 200;

function animate(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // секунды
  lastTime = timestamp;

  x += pixelsPerSecond * deltaTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(x % canvas.width, 200, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

## Практический пример: простой график

Соберём всё вместе и нарисуем линейный график данных.

```javascript
function drawLineChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const padding = options.padding || 60;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Фон
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Сетка
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    // Метки оси Y
    const value = maxValue - (range / 5) * i;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toFixed(0), padding - 10, y);
  }

  // Линия данных
  ctx.beginPath();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Точки данных
  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Использование
const canvas = document.getElementById('chart');
canvas.width = 700;
canvas.height = 400;

drawLineChart(canvas, [30, 55, 45, 70, 65, 90, 85, 100], { padding: 60 });
```

## Экспорт холста в изображение

```javascript
// Получить base64-строку PNG
const dataURL = canvas.toDataURL('image/png');

// Скачать как файл
const link = document.createElement('a');
link.download = 'canvas-image.png';
link.href = dataURL;
link.click();

// Получить Blob (для отправки на сервер)
canvas.toBlob((blob) => {
  const formData = new FormData();
  formData.append('image', blob, 'canvas.png');
  fetch('/upload', { method: 'POST', body: formData });
}, 'image/png');
```

## Производительность

Несколько правил для эффективной работы с Canvas:

**Используйте offscreen-холст для сложных вычислений.** Рисуйте статичные или редко меняющиеся элементы на отдельном невидимом холсте, а затем копируйте его целиком.

```javascript
const offscreen = document.createElement('canvas');
offscreen.width = canvas.width;
offscreen.height = canvas.height;
const offCtx = offscreen.getContext('2d');

// Один раз нарисовать сложный фон
drawComplexBackground(offCtx);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0); // быстро скопировать фон
  drawMovingElements(ctx);
  requestAnimationFrame(animate);
}
```

**Группируйте похожие операции.** Смена `fillStyle` или `strokeStyle` относительно дорога — рисуйте все элементы одного цвета последовательно.

**Минимизируйте работу с `getImageData`.** Доступ к пиксельным данным — медленная операция, так как требует синхронизации с GPU. Вызывайте её только когда необходимо.

**Отключите сглаживание для пиксельной графики.**

```javascript
ctx.imageSmoothingEnabled = false;
```

## Заключение

Canvas API предоставляет мощный инструментарий для создания любой 2D-графики прямо в браузере. Ключевые концепции для освоения: управление путями, стили и трансформации, работа с `save()`/`restore()`, а также анимационный цикл на основе `requestAnimationFrame`. Понимая эти основы, можно строить как простые графики, так и сложные интерактивные приложения.

Освоить Canvas API и другие ключевые возможности браузерного JavaScript можно на курсе [JavaScript от PurpleSchool](https://purpleschool.ru/course/javascript?utm_source=knowledgebase&utm_medium=text&utm_campaign=canvas-api).