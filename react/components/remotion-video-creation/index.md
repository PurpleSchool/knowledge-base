---
metaTitle: "Remotion: создание видео на React — полное руководство"
metaDescription: "Как создавать программные видео с помощью Remotion и React: установка, компоненты, анимации, рендеринг и практические примеры."
author: "Антон Ларичев"
title: "Remotion: создание видео на React"
preview: "Remotion позволяет создавать видеоролики с помощью обычных React-компонентов, CSS-анимаций и JavaScript. Разбираем установку, ключевые хуки и полный цикл рендеринга."
---

## Что такое Remotion

Remotion — это фреймворк для программного создания видео с использованием React. Вместо видеоредактора вы описываете каждый кадр как React-компонент, используете привычные CSS-свойства для анимаций и рендерите итоговый файл через командную строку.

Подход открывает несколько практических сценариев:

- генерация персонализированных видео (отчёты, дипломы, поздравления)
- создание анимированных баннеров и рекламных роликов
- автоматизация производства контента для социальных сетей
- визуализация данных в формате видео

Remotion использует Chromium под капотом: каждый кадр — это снимок (скриншот) React-дерева при определённом значении времени. Итоговые кадры склеиваются через FFmpeg в видеофайл.

## Установка и первый проект

Создайте новый проект с помощью официального шаблона:

```bash
npx create-video@latest my-video
cd my-video
npm install
```

Запустите студию разработки:

```bash
npm start
```

Студия откроется по адресу `http://localhost:3000`. Здесь можно воспроизводить видео прямо в браузере, перематывать по кадрам и видеть изменения в реальном времени.

Структура проекта после создания:

```
my-video/
  src/
    Root.tsx        # точка входа, регистрация композиций
    HelloWorld.tsx  # пример компонента
  remotion.config.ts
  package.json
```

## Ключевые концепции

### Composition

`Composition` — это регистрация видеоролика: его размер, частота кадров и длительность.

```tsx
import { Composition } from 'remotion';
import { MyVideo } from './MyVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

Параметры:
- `id` — уникальный идентификатор, используется при рендеринге
- `durationInFrames` — длина видео в кадрах (150 кадров при 30 fps = 5 секунд)
- `fps` — частота кадров (обычно 24, 30 или 60)
- `width` / `height` — разрешение в пикселях

### useCurrentFrame

Главный хук Remotion. Возвращает номер текущего кадра — число от `0` до `durationInFrames - 1`.

```tsx
import { useCurrentFrame } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{ fontSize: 60, color: 'white' }}>
      Кадр: {frame}
    </div>
  );
};
```

Весь смысл анимации в Remotion строится на этом хуке: вы вычисляете любые CSS-свойства как функцию от `frame`.

### useVideoConfig

Возвращает параметры текущей композиции:

```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const progress = frame / durationInFrames;

  return (
    <div style={{
      width,
      height,
      backgroundColor: `hsl(${progress * 360}, 70%, 50%)`
    }} />
  );
};
```

## Анимации с interpolate

Функция `interpolate` — основной инструмент для создания плавных переходов. Она принимает текущее значение и два диапазона: входной и выходной.

```tsx
import { useCurrentFrame, interpolate } from 'remotion';

export const FadeIn = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 30],       // входной диапазон: кадры 0–30
    [0, 1],        // выходной диапазон: opacity 0–1
    { extrapolateRight: 'clamp' }
  );

  return (
    <div style={{
      opacity,
      fontSize: 80,
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%'
    }}>
      Привет, Remotion!
    </div>
  );
};
```

Опция `extrapolateRight: 'clamp'` фиксирует значение после достижения правой границы диапазона — без неё opacity продолжила бы расти за пределы 1.

### Несколько анимаций в одном компоненте

```tsx
import { useCurrentFrame, interpolate } from 'remotion';

export const SlideAndFade = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 20], [40, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize: 64,
        color: 'white',
      }}
    >
      Появление снизу
    </div>
  );
};
```

## spring: физические анимации

Fункция `spring` создаёт пружинные анимации с физически правдоподобным ускорением и замедлением.

```tsx
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const SpringDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 100,
      mass: 0.5,
    },
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        width: 200,
        height: 200,
        backgroundColor: '#7b61ff',
        borderRadius: 20,
      }}
    />
  );
};
```

Параметры пружины:
- `damping` — затухание (чем выше, тем меньше колебаний)
- `stiffness` — жёсткость (чем выше, тем быстрее движение)
- `mass` — масса объекта (чем выше, тем инертнее)

## Sequence: организация сцен

`Sequence` позволяет запускать дочерние компоненты в определённый момент времени. Внутри `Sequence` хук `useCurrentFrame` обнуляется — компонент «не знает», на каком глобальном кадре находится.

```tsx
import { Sequence } from 'remotion';
import { Title } from './Title';
import { Subtitle } from './Subtitle';
import { Logo } from './Logo';

export const MyVideo = () => {
  return (
    <div style={{ backgroundColor: '#0f0f0f', width: '100%', height: '100%' }}>
      {/* Логотип появляется с самого начала */}
      <Sequence from={0} durationInFrames={150}>
        <Logo />
      </Sequence>

      {/* Заголовок появляется на кадре 10 и длится 60 кадров */}
      <Sequence from={10} durationInFrames={60}>
        <Title />
      </Sequence>

      {/* Подзаголовок появляется на кадре 40 */}
      <Sequence from={40}>
        <Subtitle />
      </Sequence>
    </div>
  );
};
```

## Практический пример: слайд с метриками

Соберём полноценный компонент — анимированный слайд с числовой метрикой:

```tsx
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface MetricSlideProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export const MetricSlide: React.FC<MetricSlideProps> = ({
  label,
  value,
  unit = '',
  color = '#7b61ff',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const displayedValue = Math.round(progress * value);

  const labelOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const labelY = interpolate(frame, [10, 30], [20, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f0f0f',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 160,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {displayedValue}{unit}
      </div>

      <div
        style={{
          fontSize: 48,
          color: '#ffffff',
          marginTop: 24,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};
```

Регистрируем в Root.tsx:

```tsx
import { Composition } from 'remotion';
import { MetricSlide } from './MetricSlide';

export const RemotionRoot = () => (
  <Composition
    id="MetricSlide"
    component={MetricSlide}
    durationInFrames={90}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={{
      label: 'Пользователей в месяц',
      value: 124500,
      unit: '',
      color: '#7b61ff',
    }}
  />
);
```

## Передача данных через props

Компоненты Remotion принимают обычные React-пропсы. При рендеринге их можно передать через JSON-файл или параметры командной строки.

```tsx
const { value } = getInputProps<{ value: number }>();
```

Или через `defaultProps` в `Composition` для предпросмотра в студии.

## Встраивание медиа

Remotion поставляет компоненты `Audio`, `Video` и `Img` с синхронизацией по текущему кадру.

```tsx
import { Audio, Video, Img, staticFile } from 'remotion';

export const MediaExample = () => (
  <div style={{ width: '100%', height: '100%' }}>
    <Video
      src={staticFile('background.mp4')}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    <Audio src={staticFile('music.mp3')} volume={0.3} />
    <Img
      src={staticFile('logo.png')}
      style={{ position: 'absolute', top: 40, left: 40, width: 120 }}
    />
  </div>
);
```

Статические файлы размещаются в папке `public/` и подключаются через `staticFile()`.

## Рендеринг видео

Когда компонент готов, запустите рендеринг:

```bash
npx remotion render MetricSlide out/metric.mp4
```

Для передачи props:

```bash
npx remotion render MetricSlide out/metric.mp4 \
  --props='{"value": 99000, "label": "Подписчиков"}'
```

Параметры рендеринга:

```bash
# Изменить кодек
npx remotion render MetricSlide out/metric.webm --codec=vp8

# Только конкретные кадры (для тестирования)
npx remotion render MetricSlide out/metric.mp4 --frames=0-30

# Управление параллелизмом
npx remotion render MetricSlide out/metric.mp4 --concurrency=4
```

Remotion также поддерживает серверный рендеринг через `@remotion/renderer` для автоматизации генерации видео в Node.js-приложениях.

```typescript
import { renderMedia, selectComposition } from '@remotion/renderer';

const composition = await selectComposition({
  serveUrl: 'http://localhost:3000',
  id: 'MetricSlide',
  inputProps: { value: 50000, label: 'Новых клиентов' },
});

await renderMedia({
  composition,
  serveUrl: 'http://localhost:3000',
  codec: 'h264',
  outputLocation: 'out/result.mp4',
});
```

## Советы по производительности

Remotion рендерит каждый кадр независимо, поэтому дорогостоящие вычисления стоит выносить за пределы render-функции:

```tsx
// Плохо: пересчитывается на каждом кадре
export const Heavy = () => {
  const frame = useCurrentFrame();
  const data = processLargeDataset(); // вызывается на каждом кадре
  return <div>{data[frame]}</div>;
};

// Хорошо: данные вычислены один раз снаружи
const data = processLargeDataset();

export const Heavy = () => {
  const frame = useCurrentFrame();
  return <div>{data[frame]}</div>;
};
```

Для компонентов, которые не меняются между кадрами, используйте `React.memo` и `useMemo` как обычно.

## Итог

Remotion переносит привычный React-подход в область создания видео. Если вы умеете писать React-компоненты и CSS-анимации, вы уже обладаете большей частью необходимых знаний. Ключевые строительные блоки:

- `useCurrentFrame` — текущий кадр как источник истины для всех анимаций
- `interpolate` — линейные переходы между значениями
- `spring` — физически правдоподобные пружинные анимации
- `Sequence` — временная координация сцен
- `Composition` — объявление параметров видео

Чтобы уверенно работать с React и строить сложные UI-компоненты, которые затем можно использовать в Remotion-видео, пройдите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=remotion-react-video