---
metaTitle: "React Native Skia: графика и анимации в приложениях"
metaDescription: "Руководство по React Native Skia — рисование фигур, градиентов, путей и GPU-ускоренных анимаций в React Native приложениях."
author: "Антон Ларичев"
title: "React Native Skia для графики"
preview: "Полное руководство по созданию графики, анимаций и кастомных UI-компонентов с помощью библиотеки React Native Skia."
---

## Что такое React Native Skia

React Native Skia — это высокопроизводительный графический движок для React Native, основанный на библиотеке Skia от Google. Именно Skia отвечает за отрисовку интерфейса в Chrome, Android и Flutter. Официальный пакет `@shopify/react-native-skia` предоставляет декларативный React-API поверх этого движка.

Ключевые преимущества библиотеки:

- Рендеринг выполняется на GPU, что исключает «дрожание» анимаций
- Полная поддержка `react-native-reanimated` v3 — анимационные значения напрямую передаются в шейдеры
- Единый API для iOS и Android без нативных бриджей в горячем пути
- Возможность рисовать произвольные пути, градиенты, шрифты, изображения и эффекты

Типичные сценарии использования: кастомные графики, анимированные иллюстрации, игровые элементы, аватары с масками и сложные переходы между экранами.

## Установка и настройка

```bash
npx expo install @shopify/react-native-skia
```

Для bare React Native проекта потребуется дополнительная нативная сборка:

```bash
npm install @shopify/react-native-skia
cd ios && pod install
```

Esm-импорты и TypeScript-типы поставляются вместе с пакетом — дополнительно устанавливать `@types/...` не нужно.

Проверьте минимальные версии: React Native >= 0.71, iOS >= 13, Android API >= 21.

## Основные примитивы

Все элементы Skia располагаются внутри компонента `<Canvas>`, который задаёт область отрисовки.

```tsx
import { Canvas, Circle, Rect, Line, vec } from '@shopify/react-native-skia';

export function BasicShapes() {
  return (
    <Canvas style={{ width: 300, height: 300 }}>
      {/* Прямоугольник */}
      <Rect x={20} y={20} width={100} height={60} color="#6C63FF" />

      {/* Круг */}
      <Circle cx={200} cy={50} r={40} color="#FF6584" />

      {/* Линия */}
      <Line
        p1={vec(20, 150)}
        p2={vec(280, 150)}
        color="#43B89C"
        strokeWidth={2}
      />
    </Canvas>
  );
}
```

Каждый примитив принимает стандартные пропсы позиционирования и цвет. Цвета можно задавать строкой (`"#hex"`, `"rgba(...)"`) или через хелпер `Skia.Color`.

### Скруглённые прямоугольники

```tsx
import { Canvas, RoundedRect } from '@shopify/react-native-skia';

export function Card() {
  return (
    <Canvas style={{ width: 300, height: 160 }}>
      <RoundedRect
        x={16}
        y={16}
        width={268}
        height={128}
        r={16}
        color="#1E1E2E"
      />
    </Canvas>
  );
}
```

## Работа с путями (Path)

`Path` — самый мощный примитив: он позволяет рисовать любые векторные фигуры, кривые Безье и сложные контуры.

```tsx
import { Canvas, Path } from '@shopify/react-native-skia';

export function ArrowShape() {
  const path = 'M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80';

  return (
    <Canvas style={{ width: 200, height: 160 }}>
      <Path
        path={path}
        color="transparent"
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color="#6C63FF"
      />
    </Canvas>
  );
}
```

Путь задаётся SVG-строкой — это удобно при экспорте иконок из Figma или Illustrator.

Для программного построения пути используйте `Skia.Path.Make()`:

```tsx
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

export function StarShape() {
  const path = Skia.Path.Make();
  path.moveTo(100, 10);
  path.lineTo(120, 70);
  path.lineTo(190, 70);
  path.lineTo(135, 110);
  path.lineTo(160, 170);
  path.lineTo(100, 130);
  path.lineTo(40, 170);
  path.lineTo(65, 110);
  path.lineTo(10, 70);
  path.lineTo(80, 70);
  path.close();

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      <Path path={path} color="#FFD700" />
    </Canvas>
  );
}
```

## Градиенты и заливки

Skia поддерживает линейные, радиальные и конические градиенты. Они применяются как дочерние элементы любого примитива через концепцию «шейдера заливки».

```tsx
import {
  Canvas,
  Rect,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';

export function GradientShowcase() {
  return (
    <Canvas style={{ width: 300, height: 240 }}>
      {/* Линейный градиент */}
      <Rect x={16} y={16} width={268} height={90}>
        <LinearGradient
          start={vec(16, 16)}
          end={vec(284, 106)}
          colors={['#6C63FF', '#FF6584']}
        />
      </Rect>

      {/* Радиальный градиент */}
      <Rect x={16} y={130} width={268} height={90}>
        <RadialGradient
          c={vec(150, 175)}
          r={134}
          colors={['#43B89C', '#1E1E2E']}
        />
      </Rect>
    </Canvas>
  );
}
```

Градиент живёт строго внутри родительской фигуры — он не рендерится сам по себе.

## Текст и шрифты

Для работы с текстом нужно загрузить шрифт через хук `useFont`.

```tsx
import { Canvas, Text, useFont } from '@shopify/react-native-skia';

export function SkiaText() {
  // Путь к шрифту в ассетах проекта
  const font = useFont(require('./assets/fonts/Inter-Bold.ttf'), 24);

  if (!font) {
    return null;
  }

  return (
    <Canvas style={{ width: 300, height: 80 }}>
      <Text
        x={20}
        y={50}
        text="React Native Skia"
        font={font}
        color="#FFFFFF"
      />
    </Canvas>
  );
}
```

Для многострочного текста используйте `Paragraph` — он поддерживает выравнивание, переносы и смешанные стили.

## Анимация с Reanimated

Skia нативно интегрируется с `react-native-reanimated`. Анимированные значения передаются напрямую в пропсы — без перерисовки React-дерева.

```tsx
import { useEffect } from 'react';
import { Canvas, Circle } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function PulsingCircle() {
  const radius = useSharedValue(40);
  const opacity = useSharedValue(1);

  useEffect(() => {
    radius.value = withRepeat(
      withTiming(80, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
  }, []);

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      <Circle cx={100} cy={100} r={radius} color="#6C63FF" opacity={opacity} />
    </Canvas>
  );
}
```

Анимация выполняется полностью в UI-потоке — React JS-поток не задействован на каждом кадре.

### Анимированный путь

Один из самых эффектных сценариев — анимация `end` у пути, создающая эффект «рисования».

```tsx
import { useEffect } from 'react';
import { Canvas, Path } from '@shopify/react-native-skia';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function DrawingPath() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000 });
  }, []);

  return (
    <Canvas style={{ width: 300, height: 200 }}>
      <Path
        path="M 20 100 Q 150 20 280 100"
        color="#6C63FF"
        style="stroke"
        strokeWidth={4}
        strokeCap="round"
        start={0}
        end={progress}
      />
    </Canvas>
  );
}
```

## Практический пример: мини-график

Соберём компонент графика-спарклайна, типичный для финансовых приложений.

```tsx
import { useMemo } from 'react';
import { Canvas, Path, Circle, Skia, LinearGradient, vec } from '@shopify/react-native-skia';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 200,
  height = 80,
  color = '#6C63FF',
}: SparklineProps) {
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (data.length < 2) return { linePath: null, areaPath: null, lastPoint: null };

    const paddingX = 8;
    const paddingY = 8;
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const toX = (i: number) =>
      paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const toY = (v: number) =>
      height - paddingY - ((v - minVal) / range) * (height - paddingY * 2);

    const line = Skia.Path.Make();
    const area = Skia.Path.Make();

    line.moveTo(toX(0), toY(data[0]));
    area.moveTo(toX(0), height);
    area.lineTo(toX(0), toY(data[0]));

    for (let i = 1; i < data.length; i++) {
      const x = toX(i);
      const y = toY(data[i]);
      const prevX = toX(i - 1);
      const prevY = toY(data[i - 1]);
      const cpX = (prevX + x) / 2;

      line.cubicTo(cpX, prevY, cpX, y, x, y);
      area.cubicTo(cpX, prevY, cpX, y, x, y);
    }

    const lastIdx = data.length - 1;
    area.lineTo(toX(lastIdx), height);
    area.close();

    return {
      linePath: line,
      areaPath: area,
      lastPoint: { x: toX(lastIdx), y: toY(data[lastIdx]) },
    };
  }, [data, width, height]);

  if (!linePath || !lastPoint) return null;

  return (
    <Canvas style={{ width, height }}>
      {/* Заливка под линией */}
      <Path path={areaPath} opacity={0.15} color={color}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[color, 'transparent']}
        />
      </Path>

      {/* Линия графика */}
      <Path
        path={linePath}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        strokeJoin="round"
        color={color}
      />

      {/* Последняя точка */}
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} color={color} />
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={2} color="#FFFFFF" />
    </Canvas>
  );
}
```

Использование компонента:

```tsx
export function Dashboard() {
  const priceHistory = [120, 132, 118, 145, 139, 158, 171, 163, 180, 175, 192];

  return (
    <Sparkline
      data={priceHistory}
      width={280}
      height={100}
      color="#43B89C"
    />
  );
}
```

## Изображения и маски

Skia умеет применять маски к изображениям — удобно для аватаров с кастомными формами.

```tsx
import { Canvas, Image, useImage, Circle, mask } from '@shopify/react-native-skia';

export function MaskedAvatar() {
  const image = useImage(require('./assets/avatar.jpg'));

  if (!image) return null;

  return (
    <Canvas style={{ width: 100, height: 100 }}>
      <mask>
        <Circle cx={50} cy={50} r={48} color="white" />
      </mask>
      <Image
        image={image}
        x={0}
        y={0}
        width={100}
        height={100}
        fit="cover"
      />
    </Canvas>
  );
}
```

## Производительность и ограничения

Несколько практических правил для высокой производительности:

**Мемоизируйте объекты Skia.** Пути, краски и шрифты, созданные без `useMemo`, будут пересоздаваться на каждом рендере.

```tsx
const path = useMemo(() => {
  const p = Skia.Path.Make();
  // построение пути...
  return p;
}, [data]);
```

**Не вкладывайте `<Canvas>` друг в друга.** Каждый Canvas — отдельный GPU-контекст. Располагайте все элементы одной сцены в одном Canvas.

**Используйте `Group` для трансформаций.** Применять матрицу к группе элементов дешевле, чем считать координаты каждого по отдельности.

```tsx
import { Canvas, Group, Rect } from '@shopify/react-native-skia';

<Canvas style={{ width: 200, height: 200 }}>
  <Group transform={[{ rotate: Math.PI / 4 }, { translateX: 50 }]}>
    <Rect x={0} y={0} width={60} height={60} color="#6C63FF" />
    <Rect x={70} y={0} width={60} height={60} color="#FF6584" />
  </Group>
</Canvas>
```

**Избегайте `opacity` на группах с перекрывающимися фигурами.** Skia рендерит группу в off-screen буфер — это дополнительный проход по GPU.

## Итог

React Native Skia даёт инструменты для создания полноценных графических интерфейсов, недоступных средствами стандартных нативных компонентов. Библиотека особенно ценна там, где важна плавность: финансовые графики, игровые элементы, сложные анимированные иллюстрации.

Основные концепции, которые нужно освоить: примитивы (`Rect`, `Circle`, `Path`), заливки (`LinearGradient`, `RadialGradient`), интеграция с Reanimated через `useSharedValue` и мемоизация Skia-объектов.

Для более глубокого погружения в разработку React Native приложений, включая анимации и работу с нативными возможностями, смотрите курс на PurpleSchool:

[Курс по React Native на PurpleSchool](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-skia-graphics)