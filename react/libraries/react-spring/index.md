---
metaTitle: React Spring - анимации на основе физики в React
metaDescription: Полное руководство по React Spring: useSpring, useTrail, useTransition, физические анимации и gesture взаимодействия
author: Олег Марков
title: React Spring - анимации
preview: Изучите React Spring для создания плавных физических анимаций в React. useSpring, useTrail, useTransition и gesture анимации
---

## Введение

Когда речь заходит об анимациях в React, разработчики часто выбирают одну из двух популярных библиотек: Framer Motion или React Spring. Обе решают задачу, но делают это принципиально по-разному.

**React Spring** — это библиотека анимаций, основанная на принципах физики пружин (spring physics). Вместо того чтобы задавать длительность и функцию ускорения (easing), вы описываете поведение пружины: насколько она жёсткая, насколько тяжёлая, насколько быстро затухает. Это даёт анимациям естественный, органичный вид — именно такой, к которому привыкли пользователи в нативных приложениях.

React Spring существует с 2018 года и прошёл долгий путь развития. Текущая версия (v9) предоставляет набор хуков, которые делают работу с анимациями декларативной и удобной.

### Почему физические анимации?

Традиционный подход к анимациям — задать начальное состояние, конечное состояние, длительность и easing-функцию. Проблема в том, что если анимация прерывается на полпути (например, пользователь кликнул снова), переход выглядит неестественно: объект резко меняет направление.

Физика пружин работает иначе. Пружина всегда учитывает текущую скорость объекта и плавно изменяет направление движения с учётом этой скорости. Это называется **velocity-aware анимация** — и именно она делает интерфейсы ощущаться живыми.

## Установка

Устанавливайте пакет в зависимости от вашего стека:

```bash
# Для браузерных React-приложений
npm install @react-spring/web

# Для React Native
npm install @react-spring/native

# Для Three.js (r3f)
npm install @react-spring/three
```

В этой статье мы будем работать с `@react-spring/web`.

Если вы хотите добавить gesture-анимации (реакция на перетаскивание, пинч и т.д.), установите дополнительно:

```bash
npm install @use-gesture/react
```

## Основные концепции

Перед тем как погружаться в хуки, разберём базовые концепции React Spring.

### animated компоненты

React Spring не анимирует обычные HTML-элементы напрямую. Вместо этого она предоставляет обёртки — **animated-компоненты**. Это специальные версии стандартных HTML-тегов, которые умеют принимать анимированные значения:

```tsx
import { animated, useSpring } from '@react-spring/web';

function Box() {
  const springs = useSpring({ opacity: 1, from: { opacity: 0 } });

  // Используем animated.div, а не просто div
  return <animated.div style={springs}>Hello!</animated.div>;
}
```

Библиотека предоставляет `animated.div`, `animated.span`, `animated.p`, `animated.h1`-`animated.h6`, `animated.button`, `animated.img`, `animated.a`, `animated.ul`, `animated.li` и другие. Для кастомных компонентов используйте `animated(MyComponent)`.

### SpringValue

Когда вы получаете значение из хука (например, `springs.opacity`), это не просто число — это `SpringValue`. Передавайте его напрямую в `style` animated-компонента, и React Spring будет обновлять его в каждом кадре анимации без лишних ре-рендеров React.

```tsx
const springs = useSpring({ x: 100, opacity: 1, from: { x: 0, opacity: 0 } });

// springs.x и springs.opacity — это SpringValue объекты
<animated.div style={{ transform: springs.x.to(x => `translateX(${x}px)`), opacity: springs.opacity }} />
```

## Конфигурация анимации

Физическое поведение пружины настраивается через объект `config`:

```tsx
import { useSpring, config } from '@react-spring/web';

// Встроенные пресеты
const springs = useSpring({
  x: 100,
  config: config.wobbly  // или config.stiff, config.slow, config.molasses, config.gentle
});
```

Встроенные пресеты:
- `config.default` — сбалансированная анимация (tension: 170, friction: 26)
- `config.gentle` — мягкая, плавная (tension: 120, friction: 14)
- `config.wobbly` — пружинящая, с отскоком (tension: 180, friction: 12)
- `config.stiff` — жёсткая, быстрая (tension: 210, friction: 20)
- `config.slow` — медленная, торжественная (tension: 280, friction: 60)
- `config.molasses` — очень медленная (tension: 280, friction: 120)

### Параметры физики

Вы можете задать параметры вручную:

```tsx
const springs = useSpring({
  x: 100,
  config: {
    tension: 200,    // Жёсткость пружины (чем больше — тем быстрее)
    friction: 20,    // Трение (чем больше — тем меньше "пружинистости")
    mass: 1,         // Масса объекта (чем больше — тем инертнее)
    clamp: false,    // Остановить анимацию при достижении цели (без overshooting)
    precision: 0.01, // Точность для определения "завершённости" анимации
    velocity: 0,     // Начальная скорость
  }
});
```

**Как параметры влияют на анимацию:**

| Параметр | Эффект при увеличении |
|----------|----------------------|
| `tension` | Анимация быстрее стремится к цели |
| `friction` | Меньше отскоков, плавнее остановка |
| `mass` | Больше инертности, медленнее разгон и торможение |

**Типичные комбинации:**
- Быстрая без отскока: `{ tension: 300, friction: 30 }`
- С небольшим отскоком: `{ tension: 200, friction: 15 }`
- Сильный отскок: `{ tension: 150, friction: 8 }`
- Очень мягкая: `{ tension: 100, friction: 14, mass: 2 }`

Если хотите контролировать анимацию через время (а не физику), используйте `duration`:

```tsx
const springs = useSpring({
  x: 100,
  config: { duration: 500 }  // 500ms, игнорирует tension/friction
});
```

## useSpring — базовая анимация

`useSpring` — основной хук React Spring. Он анимирует один набор значений.

### Декларативное использование

```tsx
import { useSpring, animated } from '@react-spring/web';

function FadeIn() {
  const springs = useSpring({
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
  });

  return (
    <animated.div
      style={{
        opacity: springs.opacity,
        transform: springs.y.to(y => `translateY(${y}px)`),
      }}
    >
      Привет, я плавно появился!
    </animated.div>
  );
}
```

### Переключение состояния

```tsx
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

function Toggle() {
  const [isOpen, setIsOpen] = useState(false);

  const springs = useSpring({
    width: isOpen ? 300 : 100,
    height: isOpen ? 200 : 100,
    backgroundColor: isOpen ? '#6200ea' : '#03dac6',
    config: { tension: 200, friction: 20 },
  });

  return (
    <animated.div
      style={{ ...springs, cursor: 'pointer', borderRadius: 8 }}
      onClick={() => setIsOpen(!isOpen)}
    />
  );
}
```

### Императивное управление через api

`useSpring` возвращает второй элемент — api-объект для программного управления:

```tsx
import { useSpring, animated } from '@react-spring/web';

function ControlledAnimation() {
  const [springs, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
  }));

  const handleClick = () => {
    api.start({
      x: 200,
      opacity: 0.5,
      config: { tension: 300 },
    });
  };

  const handleReset = () => {
    api.start({ x: 0, opacity: 1 });
  };

  return (
    <>
      <animated.div
        style={{
          width: 80,
          height: 80,
          background: '#6200ea',
          borderRadius: 8,
          transform: springs.x.to(x => `translateX(${x}px)`),
          opacity: springs.opacity,
        }}
      />
      <button onClick={handleClick}>Анимировать</button>
      <button onClick={handleReset}>Сбросить</button>
    </>
  );
}
```

### Анимация цвета, transform и других CSS-свойств

```tsx
const springs = useSpring({
  from: {
    rotate: 0,
    scale: 0.5,
    backgroundColor: '#ff6b6b',
  },
  to: {
    rotate: 360,
    scale: 1,
    backgroundColor: '#6200ea',
  },
  loop: true,  // зациклить анимацию
});

<animated.div
  style={{
    ...springs,
    // transform комбинируется через .to()
  }}
/>
```

Для комбинированных transform-значений используйте `.to()`:

```tsx
const { x, y, rotate } = useSpring({ x: 100, y: 50, rotate: 45 });

<animated.div
  style={{
    transform: x.to((xVal) =>
      `translateX(${xVal}px) translateY(${y.get()}px) rotate(${rotate.get()}deg)`
    ),
  }}
/>
```

Или interpolate несколько значений сразу:

```tsx
import { to } from '@react-spring/web';

const transform = to(
  [springs.x, springs.y, springs.rotate],
  (x, y, r) => `translate(${x}px, ${y}px) rotate(${r}deg)`
);
```

## useTrail — анимация списков с задержкой

`useTrail` создаёт цепочку анимаций для списка элементов. Каждый следующий элемент начинает анимироваться чуть позже предыдущего — это даёт красивый "волновой" эффект.

```tsx
import { useTrail, animated } from '@react-spring/web';

const items = ['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'];

function TrailList() {
  const trails = useTrail(items.length, {
    from: { opacity: 0, x: -40 },
    to: { opacity: 1, x: 0 },
    config: { tension: 200, friction: 20 },
  });

  return (
    <ul>
      {trails.map((spring, index) => (
        <animated.li
          key={items[index]}
          style={{
            opacity: spring.opacity,
            transform: spring.x.to(x => `translateX(${x}px)`),
          }}
        >
          {items[index]}
        </animated.li>
      ))}
    </ul>
  );
}
```

### Управление направлением трейла

```tsx
import { useState } from 'react';
import { useTrail, animated } from '@react-spring/web';

const ITEMS = ['🎸', '🎹', '🎺', '🥁', '🎻'];

function TrailDemo() {
  const [open, setOpen] = useState(false);

  const trails = useTrail(ITEMS.length, {
    from: { opacity: 0, scale: 0, y: 40 },
    to: open
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 0, scale: 0, y: 40 },
    config: { tension: 300, friction: 25 },
    // reverse: !open,  // реверсировать порядок анимации при закрытии
  });

  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        {open ? 'Скрыть' : 'Показать'}
      </button>
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        {trails.map((style, i) => (
          <animated.div
            key={i}
            style={{
              ...style,
              fontSize: 40,
            }}
          >
            {ITEMS[i]}
          </animated.div>
        ))}
      </div>
    </div>
  );
}
```

### useTrail с императивным управлением

```tsx
const [trails, api] = useTrail(3, () => ({ opacity: 0, y: 20 }));

// Запустить анимацию
api.start({ opacity: 1, y: 0 });

// Сбросить
api.start({ opacity: 0, y: 20, immediate: true });
```

## useTransition — анимация появления/исчезновения

`useTransition` — пожалуй, самый мощный хук React Spring. Он управляет жизненным циклом элементов: анимирует их появление, обновление и исчезновение.

```tsx
import { useTransition, animated } from '@react-spring/web';

function FadeMessage({ show, text }: { show: boolean; text: string }) {
  const transitions = useTransition(show, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, isVisible) =>
    isVisible ? (
      <animated.div style={style}>{text}</animated.div>
    ) : null
  );
}
```

### Анимированный список с добавлением/удалением

```tsx
import { useState } from 'react';
import { useTransition, animated } from '@react-spring/web';

let idCounter = 0;

interface Item {
  id: number;
  text: string;
}

function AnimatedList() {
  const [items, setItems] = useState<Item[]>([]);

  const transitions = useTransition(items, {
    keys: item => item.id,
    from: { opacity: 0, height: 0, x: -100 },
    enter: { opacity: 1, height: 50, x: 0 },
    leave: { opacity: 0, height: 0, x: 100 },
    config: { tension: 250, friction: 25 },
  });

  const addItem = () => {
    setItems(prev => [...prev, { id: ++idCounter, text: `Элемент ${idCounter}` }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div>
      <button onClick={addItem}>Добавить</button>
      <div>
        {transitions((style, item) => (
          <animated.div
            style={{
              ...style,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              background: '#f0f0f0',
              marginBottom: 4,
              borderRadius: 4,
            }}
          >
            <span>{item.text}</span>
            <button onClick={() => removeItem(item.id)}>✕</button>
          </animated.div>
        ))}
      </div>
    </div>
  );
}
```

### Переходы между страницами / вкладками

```tsx
import { useState } from 'react';
import { useTransition, animated } from '@react-spring/web';

const pages = [
  { id: 0, component: () => <div style={{ background: '#ff6b6b', height: 200 }}>Страница 1</div> },
  { id: 1, component: () => <div style={{ background: '#6200ea', height: 200 }}>Страница 2</div> },
  { id: 2, component: () => <div style={{ background: '#03dac6', height: 200 }}>Страница 3</div> },
];

function PageTransition() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 — вперёд, -1 — назад

  const transitions = useTransition(index, {
    key: index,
    from: { opacity: 0, transform: `translate3d(${direction * 100}%,0,0)` },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: `translate3d(${direction * -100}%,0,0)` },
    config: { tension: 250, friction: 30 },
  });

  const navigate = (newIndex: number) => {
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {transitions((style, i) => {
        const Page = pages[i].component;
        return (
          <animated.div style={{ ...style, position: 'absolute', width: '100%' }}>
            <Page />
          </animated.div>
        );
      })}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 220 }}>
        {pages.map((page, i) => (
          <button key={page.id} onClick={() => navigate(i)}>
            Страница {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Анимация модального окна

```tsx
import { useTransition, animated } from '@react-spring/web';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  const overlayTransition = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  const modalTransition = useTransition(isOpen, {
    from: { opacity: 0, scale: 0.8, y: -40 },
    enter: { opacity: 1, scale: 1, y: 0 },
    leave: { opacity: 0, scale: 0.8, y: 40 },
    config: { tension: 300, friction: 25 },
  });

  return (
    <>
      {overlayTransition((style, visible) =>
        visible ? (
          <animated.div
            style={{
              ...style,
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 100,
            }}
            onClick={onClose}
          />
        ) : null
      )}
      {modalTransition((style, visible) =>
        visible ? (
          <animated.div
            style={{
              ...style,
              position: 'fixed',
              top: '50%',
              left: '50%',
              marginLeft: -200,
              marginTop: -150,
              width: 400,
              background: 'white',
              borderRadius: 12,
              padding: 24,
              zIndex: 101,
            }}
          >
            {children}
          </animated.div>
        ) : null
      )}
    </>
  );
}
```

## useSprings — несколько независимых анимаций

`useSprings` создаёт несколько независимых пружин одновременно — каждая со своей конфигурацией. Удобно для списков, где каждый элемент анимируется отдельно.

```tsx
import { useSprings, animated } from '@react-spring/web';

const items = ['Красный', 'Зелёный', 'Синий', 'Жёлтый'];
const colors = ['#ff6b6b', '#51cf66', '#339af0', '#ffd43b'];

function IndependentSprings() {
  const [springs, api] = useSprings(items.length, (index) => ({
    x: 0,
    opacity: 1,
    background: colors[index],
  }));

  const shuffleItem = (index: number) => {
    api.start((i) => {
      if (i === index) {
        return {
          x: Math.random() * 200 - 100,
          opacity: 0.5 + Math.random() * 0.5,
          config: { tension: 100 + Math.random() * 200, friction: 10 + Math.random() * 20 },
        };
      }
      return {}; // Остальные не трогаем
    });
  };

  return (
    <div>
      {springs.map((spring, i) => (
        <animated.div
          key={i}
          style={{
            ...spring,
            transform: spring.x.to(x => `translateX(${x}px)`),
            padding: '8px 16px',
            marginBottom: 8,
            borderRadius: 4,
            cursor: 'pointer',
            color: 'white',
            fontWeight: 'bold',
          }}
          onClick={() => shuffleItem(i)}
        >
          {items[i]}
        </animated.div>
      ))}
    </div>
  );
}
```

### Перетасовка карточек

```tsx
import { useSprings, animated } from '@react-spring/web';

const CARDS = ['🃏', '♠️', '♥️', '♦️', '♣️'];

function CardDeck() {
  const [springs, api] = useSprings(CARDS.length, (i) => ({
    x: 0,
    y: i * 4,  // Небольшое смещение для эффекта стопки
    rotate: (i - 2) * 3,
    scale: 1,
  }));

  const scatter = () => {
    api.start((i) => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      rotate: (Math.random() - 0.5) * 60,
      scale: 0.8 + Math.random() * 0.4,
      config: { tension: 200 + i * 20, friction: 20 },
    }));
  };

  const gather = () => {
    api.start((i) => ({
      x: 0,
      y: i * 4,
      rotate: (i - 2) * 3,
      scale: 1,
    }));
  };

  return (
    <div>
      <div style={{ position: 'relative', height: 200 }}>
        {springs.map((spring, i) => (
          <animated.div
            key={i}
            style={{
              position: 'absolute',
              width: 80,
              height: 120,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              transform: spring.x.to((x) =>
                `translate(${x}px, ${spring.y.get()}px) rotate(${spring.rotate.get()}deg) scale(${spring.scale.get()})`
              ),
            }}
          >
            {CARDS[i]}
          </animated.div>
        ))}
      </div>
      <button onClick={scatter}>Разбросать</button>
      <button onClick={gather}>Собрать</button>
    </div>
  );
}
```

## Дополнительные возможности

### Зацикленные анимации

```tsx
const springs = useSpring({
  from: { rotate: 0 },
  to: { rotate: 360 },
  loop: true,
  config: { duration: 2000 },
});

// Или с условием
const springs = useSpring({
  from: { opacity: 0.3 },
  to: { opacity: 1 },
  loop: { reverse: true },  // ping-pong эффект
  config: { tension: 120, friction: 14 },
});
```

### delay и onRest

```tsx
const springs = useSpring({
  from: { opacity: 0 },
  to: { opacity: 1 },
  delay: 300,  // задержка перед стартом (мс)
  onRest: () => console.log('Анимация завершена'),
  onStart: () => console.log('Анимация началась'),
});
```

### immediate — мгновенное обновление без анимации

```tsx
api.start({
  x: 0,
  immediate: true,  // без анимации
});

// Или conditionally
api.start({
  x: 100,
  immediate: (key) => key === 'x',  // 'x' без анимации, остальное — с анимацией
});
```

### Передача пропа style через to()

```tsx
const springs = useSpring({ width: 100, from: { width: 0 } });

// Простое значение
<animated.div style={{ width: springs.width }} />

// С единицей измерения
<animated.div style={{ width: springs.width.to(w => `${w}px`) }} />

// Диапазон значений → диапазон вывода (интерполяция)
<animated.div style={{
  opacity: springs.width.to([0, 50, 100], [0, 1, 0.5]),
  background: springs.width.to([0, 100], ['#ff0000', '#0000ff']),
}} />
```

## Gesture анимации с @use-gesture/react

`@use-gesture/react` — это отдельная библиотека от той же команды. Она отслеживает жесты пользователя и передаёт их данные в React Spring (или любую другую анимационную библиотеку).

### Установка и настройка

```bash
npm install @use-gesture/react @react-spring/web
```

### useDrag — перетаскивание

```tsx
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

function DraggableCard() {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(({ offset: [ox, oy] }) => {
    api.start({ x: ox, y: oy, immediate: true });
  });

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        width: 120,
        height: 120,
        background: '#6200ea',
        borderRadius: 12,
        cursor: 'grab',
        touchAction: 'none',  // Важно для тач-устройств
        userSelect: 'none',
      }}
    />
  );
}
```

### Перетаскивание с возвратом на место

```tsx
function SnapBackCard() {
  const [{ x, y, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
  }));

  const bind = useDrag(({ active, movement: [mx, my] }) => {
    api.start({
      x: active ? mx : 0,
      y: active ? my : 0,
      scale: active ? 1.1 : 1,
      immediate: (key) => active && (key === 'x' || key === 'y'),
      config: { tension: 300, friction: 25 },
    });
  });

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        scale,
        width: 120,
        height: 120,
        background: '#6200ea',
        borderRadius: 12,
        cursor: 'grab',
        touchAction: 'none',
      }}
    />
  );
}
```

### Свайп карточек (Tinder-style)

```tsx
import { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated, to } from '@react-spring/web';

const CARDS = ['🍕', '🍔', '🌮', '🍜', '🍱'];

function SwipeCards() {
  const [gone] = useState(() => new Set<number>());
  const [props, api] = useSprings(CARDS.length, (i) => ({
    x: 0,
    y: i * -4,
    scale: 1,
    rot: -5 + Math.random() * 10,
    delay: i * 100,
  }));

  const bind = useDrag(({ args: [index], active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2; // Скорость свайпа
    if (!active && trigger) gone.add(index);

    api.start((i) => {
      if (index !== i) return;
      const isGone = gone.has(index);
      const x = isGone ? (200 + window.innerWidth) * xDir : active ? mx : 0;
      const rot = mx / 100 + (isGone ? xDir * 10 * vx : 0);
      const scale = active ? 1.1 : 1;
      return {
        x,
        rot,
        scale,
        config: { friction: 50, tension: active ? 800 : isGone ? 200 : 500 },
      };
    });
  });

  return (
    <div style={{ position: 'relative', height: 300 }}>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div
          key={i}
          {...bind(i)}
          style={{
            position: 'absolute',
            width: 200,
            height: 260,
            willChange: 'transform',
            transform: to([x, y, rot, scale], (x, y, r, s) =>
              `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`
            ),
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: 12,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            {CARDS[i]}
          </div>
        </animated.div>
      ))}
    </div>
  );
}
```

### useHover и useMove

```tsx
import { useHover, useMove } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

function HoverCard() {
  const [{ scale, background }, api] = useSpring(() => ({
    scale: 1,
    background: '#6200ea',
  }));

  const bindHover = useHover(({ hovering }) => {
    api.start({
      scale: hovering ? 1.05 : 1,
      background: hovering ? '#9c27b0' : '#6200ea',
    });
  });

  return (
    <animated.div
      {...bindHover()}
      style={{
        scale,
        background,
        padding: 24,
        borderRadius: 12,
        cursor: 'pointer',
        color: 'white',
      }}
    >
      Наведи на меня!
    </animated.div>
  );
}

function TiltCard() {
  const [{ rotateX, rotateY }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
  }));

  const bindMove = useMove(({ xy: [x, y], currentTarget }) => {
    const rect = (currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    api.start({
      rotateX: ((y - centerY) / rect.height) * -20,
      rotateY: ((x - centerX) / rect.width) * 20,
    });
  });

  const bindLeave = useHover(({ hovering }) => {
    if (!hovering) api.start({ rotateX: 0, rotateY: 0 });
  });

  return (
    <animated.div
      {...bindMove()}
      {...bindLeave()}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 600,
        width: 200,
        height: 200,
        background: 'linear-gradient(135deg, #6200ea, #03dac6)',
        borderRadius: 16,
      }}
    />
  );
}
```

### usePinch — масштабирование

```tsx
import { usePinch } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

function PinchImage() {
  const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

  const bind = usePinch(({ offset: [s] }) => {
    api.start({ scale: s });
  }, {
    scaleBounds: { min: 0.5, max: 3 },
    rubberband: true,
  });

  return (
    <animated.div
      {...bind()}
      style={{
        scale,
        width: 200,
        height: 200,
        background: '#6200ea',
        borderRadius: 12,
        touchAction: 'none',
      }}
    />
  );
}
```

## React Spring vs Framer Motion — сравнение

Оба инструмента решают одну задачу, но с разных углов. Давайте разберём, когда что использовать.

| Критерий | React Spring | Framer Motion |
|----------|-------------|---------------|
| **Концепция** | Физика пружин | Keyframe/duration-based |
| **API** | Хуки (useSpring, useTrail, ...) | Компонент motion + хуки |
| **Размер бандла** | ~25 KB (gzip) | ~50 KB (gzip) |
| **Кривая обучения** | Средняя (нужно понять физику) | Пологая (интуитивно) |
| **Жесты** | @use-gesture/react (отдельно) | Встроено (drag, hover, tap) |
| **Layout анимации** | Нет встроенного | Да (layoutId, shared layout) |
| **AnimatePresence** | useTransition | AnimatePresence |
| **TypeScript** | Хорошая поддержка | Отличная поддержка |
| **Scroll анимации** | Базовые | useScroll, useTransform |
| **Производительность** | Очень высокая (RAF, без ре-рендеров) | Высокая |
| **3D / r3f** | Да (@react-spring/three) | Да, но сложнее |
| **Поддержка** | Активная | Очень активная |

### Когда выбирать React Spring

- Вам нужны анимации, которые выглядят **физически достоверно** и "живо"
- Вы работаете с **жестами** (drag, pinch, scroll) через @use-gesture/react
- Важна **максимальная производительность** — React Spring обновляет DOM напрямую, минуя React
- Вы строите сложные **canvas или 3D анимации** с react-three-fiber
- Вы хотите контролировать **каждый параметр** анимации

### Когда выбирать Framer Motion

- Вам нужны **переходы между страницами** или **shared layout анимации**
- Хотите **быстро начать** — API Framer Motion более интуитивен
- Нужны **scroll-based анимации** (useScroll, useTransform)
- Важна **AnimatePresence** для анимации unmount с простым API
- Вы делаете **маркетинговые сайты** с эффектными анимациями

### Код сравнения: fade in

**React Spring:**
```tsx
const springs = useSpring({ from: { opacity: 0 }, to: { opacity: 1 } });
return <animated.div style={springs}>Содержимое</animated.div>;
```

**Framer Motion:**
```tsx
return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    Содержимое
  </motion.div>
);
```

Framer Motion выглядит лаконичнее для простых случаев. React Spring даёт больше контроля для сложных сценариев.

## Практические паттерны

### Кастомный хук для hover-анимации

```tsx
import { useSpring } from '@react-spring/web';
import { useHover } from '@use-gesture/react';

function useHoverSpring(config = {}) {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    shadow: 0,
    ...config,
  }));

  const bind = useHover(({ hovering }) => {
    api.start({
      scale: hovering ? 1.05 : 1,
      shadow: hovering ? 20 : 0,
    });
  });

  return { bind, springs };
}

// Использование
function ProductCard({ title }: { title: string }) {
  const { bind, springs } = useHoverSpring();

  return (
    <animated.div
      {...bind()}
      style={{
        scale: springs.scale,
        boxShadow: springs.shadow.to(s => `0 ${s}px ${s * 2}px rgba(0,0,0,0.15)`),
        padding: 20,
        borderRadius: 12,
        background: 'white',
        cursor: 'pointer',
      }}
    >
      {title}
    </animated.div>
  );
}
```

### Анимированный счётчик

```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedCounter({ value }: { value: number }) {
  const springs = useSpring({
    number: value,
    from: { number: 0 },
    config: { tension: 100, friction: 30 },
  });

  return (
    <animated.span>
      {springs.number.to(n => Math.round(n).toLocaleString())}
    </animated.span>
  );
}

// Использование
<AnimatedCounter value={1337} />
```

### Параллакс-эффект

```tsx
import { useSpring, animated } from '@react-spring/web';
import { useScroll } from '@use-gesture/react';

function ParallaxSection() {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  useScroll(({ xy: [, scrollY] }) => {
    api.start({ y: scrollY * 0.5, immediate: true });
  });

  return (
    <div style={{ height: 400, overflow: 'hidden', position: 'relative' }}>
      <animated.img
        src="/hero-bg.jpg"
        alt="Hero"
        style={{
          position: 'absolute',
          width: '100%',
          height: '120%',
          objectFit: 'cover',
          transform: y.to(y => `translateY(${-y}px)`),
        }}
      />
    </div>
  );
}
```

## TypeScript-типизация

React Spring имеет встроенную TypeScript-поддержку. Вот несколько полезных паттернов:

```tsx
import { useSpring, animated, SpringValues, config } from '@react-spring/web';

// Тип для значений пружины
type BoxSpring = {
  x: number;
  opacity: number;
  scale: number;
};

const [springs, api] = useSpring<BoxSpring>(() => ({
  x: 0,
  opacity: 1,
  scale: 1,
}));

// Компонент, принимающий анимированные пропсы
interface AnimatedBoxProps {
  springs: SpringValues<BoxSpring>;
}

function AnimatedBox({ springs }: AnimatedBoxProps) {
  return (
    <animated.div
      style={{
        transform: springs.x.to(x => `translateX(${x}px) scale(${springs.scale.get()})`),
        opacity: springs.opacity,
      }}
    />
  );
}
```

## Заключение

React Spring — мощная библиотека для создания физически достоверных анимаций в React. Её ключевые преимущества:

- **Естественные анимации** — физика пружин даёт органичный, "живой" вид
- **Высокая производительность** — обновления DOM происходят напрямую через requestAnimationFrame, минуя React ре-рендеры
- **Гибкий API** — от простого декларативного синтаксиса до полного программного контроля
- **Gesture-интеграция** — @use-gesture/react идеально дополняет библиотеку

Для большинства проектов выбор между React Spring и Framer Motion — это вопрос предпочтений. React Spring даёт чуть больше контроля и работает быстрее при сложных жестах, Framer Motion удобнее для быстрого старта и layout-анимаций. Оба инструмента активно поддерживаются и хорошо документированы.

Если вам важно, чтобы интерфейс двигался так же естественно, как объекты в реальном мире — выбирайте React Spring.
