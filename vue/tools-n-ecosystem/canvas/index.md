---
metaTitle: Работа с Canvas во Vue
metaDescription: Практическое руководство по работе с Canvas во Vue - подключение канваса, управление context, рендер различной графики, интеграция событий и оптимизация
author: Олег Марков
title: Работа с Canvas во Vue
preview: Освойте Canvas во Vue - настройка, подключение, работа с context, реактивное рисование и лучшие практики для динамической графики в ваших приложениях
---

## Введение

Canvas — мощный инструмент для работы с растровой графикой в браузере. Он позволяет создавать интерактивные графики, динамическую анимацию, игры и визуализации, работая низкоуровнево с пикселями на странице. Если вы используете Vue для построения пользовательских интерфейсов, интеграция Canvas предоставляет огромные возможности для создания визуальных и креативных решений прямо внутри ваших компонентов.

В этой статье я покажу, как вы можете использовать Canvas во Vue, на что стоит обратить внимание при организации кода, какие сложности могут возникнуть, и какие паттерны обеспечивают удобную и производительную работу с графикой. Мы разберём базовые примеры, а также советы по интеграции событий и реактивности, чтобы сделать рисунки интерактивными.

## Рендеринг Canvas во Vue-компоненте

### Базовая интеграция Canvas

Давайте начнем с простого: добавим элемент canvas на страницу через Vue-компонент.

```vue
<template>
  <canvas ref="myCanvas" width="400" height="300"></canvas>
</template>

<script>
export default {
  mounted() {
    // Получаем ссылку на DOM-элемент canvas
    const canvas = this.$refs.myCanvas;
    // Получаем 2D контекст для рисования
    const ctx = canvas.getContext('2d');
    // Простейшее рисование: красный прямоугольник
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 80); // x, y, width, height
  }
};
</script>
```

Как видите, всё просто: мы получаем доступ к canvas через ref, а в `mounted()` можем сразу работать с ним, ведь компонент уже добавлен в DOM.

Canvas – мощный инструмент для создания графики и анимации в веб-приложениях.  Умение работать с Canvas во Vue.js позволяет создавать уникальные и интерактивные визуальные эффекты. Если вы хотите детальнее погрузиться в Vue.js, изучить основы, компоненты, свойства и события, реактивность, жизненный цикл, а также научиться работать с Vue Router и Pinia, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota-s-Canvas-vo-Vue). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Управление размерами и стилями Canvas

Очень важно правильно задавать размеры canvas — это влияет на его плотность пикселей:

- **Атрибуты `width` и `height`** задают внутренний размер полотна (в пикселях!).
- **CSS-свойства** определяют отображаемый размер.

Если вы не сделаете их одинаковыми, изображение может быть растянутым или размытым:

```vue
<canvas 
  ref="mainCanvas" 
  width="600"    // внутренний размер
  height="400"   // внутренний размер
  style="width: 600px; height: 400px;" // CSS размер
></canvas>
```

Если вы хотите сделать canvas адаптивным, ширину и высоту стоит выставлять программно из кода — через props или computed значения, которые вычисляют нужные параметры по размеру окна.

Давайте рассмотрим адаптивный пример:

```vue
<template>
  <canvas
    ref="responsiveCanvas"
    :width="canvasWidth"
    :height="canvasHeight"
    style="width: 100%; height: auto"
  ></canvas>
</template>

<script>
export default {
  data() {
    return {
      canvasWidth: 0,
      canvasHeight: 0
    }
  },
  mounted() {
    this.updateCanvasSize();
    window.addEventListener('resize', this.updateCanvasSize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateCanvasSize);
  },
  methods: {
    updateCanvasSize() {
      const width = window.innerWidth * 0.8;
      const height = width * 0.6;
      this.canvasWidth = Math.floor(width);
      this.canvasHeight = Math.floor(height);
    }
  }
}
</script>
```

## Использование Canvas API в Vue

### Работа с 2d-контекстом

Большинство задач реализуется через 2d context, у которого огромный набор методов:

- `fillRect`, `strokeRect` — прямоугольники,
- `beginPath`, `moveTo`, `lineTo`, `arc`, `closePath`, `stroke`, `fill` — произвольная графика,
- `drawImage` — отрисовка изображений,
- `getImageData`, `putImageData` — работа с пикселями, создание фильтров.

Пример рисования круга и линии:

```javascript
mounted() {
  const canvas = this.$refs.myCanvas;
  const ctx = canvas.getContext('2d');
  
  // Черная линия
  ctx.beginPath();
  ctx.moveTo(120, 80); // Начальная точка
  ctx.lineTo(340, 230); // Конечная точка
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.closePath();

  // Синяя окружность
  ctx.beginPath();
  ctx.arc(200, 150, 60, 0, 2 * Math.PI); // x, y, radius, startAngle, endAngle
  ctx.fillStyle = 'blue';
  ctx.fill();
  ctx.closePath();
}
```

Обратите внимание: чтобы избежать "наслоения" путей, вызывайте `beginPath()` перед рисованием и `closePath()` после.

### Использование Canvas и реактивности во Vue

Canvas по своей сути не реактивен — любые изменения состояния Vue не приводят к перерисовке канваса. Чтобы иметь динамическую графику, нужно явно вызывать функцию отрисовки каждый раз, когда данные меняются.

Рассмотрим пример: рисуем круг, радиус которого управляется через элемент управления (input):

```vue
<template>
  <div>
    <input type="range" min="10" max="150" v-model="radius" @input="draw" />
    <canvas ref="circleCanvas" width="300" height="300"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      radius: 50
    }
  },
  mounted() {
    this.draw();
  },
  methods: {
    draw() {
      const canvas = this.$refs.circleCanvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст

      ctx.beginPath();
      ctx.arc(150, 150, this.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.closePath();
    }
  }
}
</script>
```

Теперь изменение слайдера `input` приводит к перерисовке круга с новым радиусом. Такой подход работает всегда: любые реактивные данные Vue могут быть визуализированы на canvas, если запускать draw-функцию при каждом изменении.

### Взаимодействие с событиями мыши

Canvas из коробки не имеет разметки DOM, поэтому чтобы обработать клик или движение мыши, мы вешаем события на сам canvas и вычисляем координаты вручную.

Допустим, вы хотите рисовать линии, следуя за мышкой:

```vue
<template>
  <canvas ref="drawCanvas" width="500" height="350"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"></canvas>
</template>

<script>
export default {
  data() {
    return {
      isDrawing: false,
      lastX: 0,
      lastY: 0
    }
  },
  methods: {
    getMousePos(e) {
      const rect = this.$refs.drawCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    },
    onMouseDown(e) {
      const pos = this.getMousePos(e);
      this.isDrawing = true;
      this.lastX = pos.x;
      this.lastY = pos.y;
    },
    onMouseMove(e) {
      if (!this.isDrawing) return;
      const canvas = this.$refs.drawCanvas;
      const ctx = canvas.getContext('2d');
      const pos = this.getMousePos(e);

      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();

      this.lastX = pos.x;
      this.lastY = pos.y;
    },
    onMouseUp() {
      this.isDrawing = false;
    }
  }
}
</script>
```

Этот компонент позволяет рисовать линии мышью. Я добавил функцию для пересчета координат мыши относительно canvas, потому что клики бывают в разных координатах, если страница прокручена или у canvas есть отступы.

### Инкапсуляция Canvas-логики

Чтобы поддерживать ваш код в чистоте и порядке, лучше инкапсулировать взаимодействие с canvas в отдельные методы или даже выделять отдельные компоненты для разных задач (например, один компонент для рисования линий, другой — для complex visualization).

Вы можете также использовать provide/inject или отдельные сервисы (например, классы или composable-функции во Vue 3).

#### Пример использования composable во Vue 3

Допустим, у вас есть простая функция для инициализации canvas, которую вы хотите повторно использовать:

```javascript
// useCanvas.js
import { ref, onMounted, onUnmounted } from "vue";

export default function useCanvas(drawFn) {
  const canvasRef = ref(null);

  onMounted(() => {
    if (canvasRef.value && typeof drawFn === 'function') {
      // Передаем ctx в drawFn
      const ctx = canvasRef.value.getContext('2d');
      drawFn(ctx);
    }
  });

  return {
    canvasRef
  }
}
```

Используется так:

```vue
<template>
  <canvas ref="canvasRef" width="200" height="200"></canvas>
</template>

<script>
import useCanvas from './useCanvas';

export default {
  setup() {
    // Передаем функцию, описывающую отрисовку
    const { canvasRef } = useCanvas((ctx) => {
      ctx.fillStyle = 'orange';
      ctx.fillRect(40, 40, 120, 120);
    });

    return { canvasRef };
  }
}
</script>
```

## Отрисовка изображений, работа с пикселями и продвинутая графика

### Рисование изображений

Вы можете рисовать изображения и работать с ними на canvas — для этого используйте метод `drawImage`. Важно дождаться загрузки изображения, прежде чем рисовать его на canvas.

```javascript
mounted() {
  const canvas = this.$refs.imageCanvas;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = 'https://placekitten.com/400/300';
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
}
```

### Работа с пикселями

Canvas позволяет манипулировать каждым пикселем с помощью методов `getImageData` и `putImageData`. Это можно использовать для создания фильтров — например, инвертировать цвета изображения:

```javascript
methods: {
  invertColors() {
    const canvas = this.$refs.imageCanvas;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Инвертируем каждый пиксель
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];       // Красный
      data[i + 1] = 255 - data[i+1]; // Зеленый
      data[i + 2] = 255 - data[i+2]; // Синий
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
```

Вызывайте этот метод кнопкой, и изображение на canvas поменяет цвета на противоположные.

## Анимация и render loop в Vue

Если вы делаете анимацию, используйте requestAnimationFrame, чтобы обеспечить плавность и максимально эффективный рендеринг.

```javascript
data() {
  return {
    x: 0
  }
},
mounted() {
  this.animate();
},
methods: {
  animate() {
    const canvas = this.$refs.animCanvas;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(this.x, 50, 30, 0, 2 * Math.PI);
    ctx.fill();

    // Увеличение x, чтобы шар двигался вправо
    this.x = (this.x + 2) % canvas.width;

    // Рекурсивный вызов на следующий кадр
    requestAnimationFrame(this.animate);
  }
}
```

В этом примере по канвасу бегает шарик, и за счет рекурсивного вызова animate анимация остаётся плавной и не блокирует основной поток.

## Интеграция Canvas с жизненным циклом Vue

Рекомендуется всегда инициализировать canvas на стадии `mounted` — так он гарантированно существует в DOM. Если вам нужно сбрасывать/перерисовывать canvas при обновлении props, используйте watch для отслеживания изменений и вызывайте функцию отрисовки при каждом изменении.

```javascript
watch: {
  someProp() {
    this.draw();
  }
}
```

Помните, что если компонент уничтожается, отписывайтесь от global-событий или отменяйте animation loop, чтобы избежать утечек памяти.

## Популярные библиотеки для Canvas и Vue

- **vue-konva** — обертка над популярной библиотекой Konva (для сложной графики, drag&drop, групп и слоев).
- **vue-canvas** — облегчённый способ подключения canvas с поддержкой реактивных свойств.
- **Fabric.js** — не vue-специфичный, но отлично дружит с Vue при интеграции через refs.

Использование библиотеки обосновано, если вам нужна многослойная графика, drag&drop объектов или масштабирование. Однако даже "чистый Canvas" легко интегрируется в ваше приложение на Vue — главное соблюдать принципы управления состоянием, чтобы ваша отрисовка всегда отображала актуальные данные.

## Итог

Реализация Canvas во Vue — это отличный способ создавать динамическую и интерактивную графику, объединяя мощь низкоуровневых API браузера с реактивностью Vue. Вы можете использовать базовые механики для рисования, а также продвинутые техники: анимации, обработка изображений, интеграция с lifecycle хуками. Благодаря гибкой структуре компонентов и жизненному циклу Vue любые нестандартные фичи легко реализуются, если правильно подключать канвас, контролировать событие и поддерживать актуальность данных для рендера.

Изучение принципов работы с Canvas поможет вам создавать более сложные и креативные веб-приложения.  В первых 3 модулях курса [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota-s-Canvas-vo-Vue) уже доступно бесплатное содержание — начните погружаться в мир Vue.js и Canvas прямо сейчас.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как сохранить изображение из Canvas на диск пользователя?**  
Вам нужно получить данные из canvas методом `toDataURL()`, а затем создать ссылку (`<a>`) для скачивания:
```javascript
const canvas = this.$refs.myCanvas;
const dataURL = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.href = dataURL;
link.download = 'canvas-image.png';
link.click();
```

**2. Как очистить canvas полностью?**  
Используйте метод `clearRect`:
```javascript
const ctx = this.$refs.myCanvas.getContext('2d');
ctx.clearRect(0, 0, canvas.width, canvas.height);
```
Это удаляет ВСЕ нарисованное на canvas.

**3. Как получить координаты клика относительно канваса при скролле или сдвиге страницы?**  
Вам поможет метод getBoundingClientRect:
```javascript
const rect = canvas.getBoundingClientRect();
const x = event.clientX - rect.left;
const y = event.clientY - rect.top;
```

**4. Как оптимизировать перерисовку при частых изменениях данных?**  
Используйте `requestAnimationFrame` для отрисовки, и устраивайте redraw только при необходимости (например, debounce/fps limit для событий). Обновляйте только те части canvas, которые действительно изменились.

**5. Почему изображение выглядит размытым на устройствах с высокой плотностью пикселей (Retina)?**  
Canvas нужно увеличивать пропорционально devicePixelRatio:
```javascript
const ratio = window.devicePixelRatio || 1;
canvas.width = width * ratio;
canvas.height = height * ratio;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // Масштабирование
```
Так изображение выйдет четким.
