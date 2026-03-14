---
metaTitle: Framer Motion - библиотека анимаций для React
metaDescription: Полное руководство по Framer Motion: motion компоненты, variants, AnimatePresence, жесты, layout анимации и scroll эффекты
author: Олег Марков
title: Framer Motion - библиотека анимаций
preview: Изучите Framer Motion для создания красивых анимаций в React. motion компоненты, variants, AnimatePresence, жесты и scroll-based анимации
---

## Введение

Когда речь заходит о создании анимаций в React-приложениях, Framer Motion занимает особое место. Это одна из самых популярных и мощных библиотек анимаций в экосистеме React — и на то есть веские причины.

**Framer Motion** — это production-ready библиотека анимаций с декларативным API, которая делает создание сложных анимаций простым и понятным. Вы описываете, _что_ должно анимироваться и _как_, а библиотека берёт на себя всю техническую реализацию.

### Почему Framer Motion?

Framer Motion выделяется среди конкурентов по нескольким причинам:

- **Декларативный API**: вы описываете начальное и конечное состояние, а библиотека сама выстраивает переход
- **Простота для сложных случаев**: AnimatePresence для анимации размонтирования, layout анимации — всё это работает из коробки
- **Производительность**: анимации выполняются непосредственно в браузере с помощью CSS transform и opacity, минуя React render-цикл
- **Жесты**: встроенная поддержка hover, tap, drag без дополнительных библиотек
- **TypeScript**: полная поддержка типов из коробки
- **Активное развитие**: библиотека активно развивается командой Framer

По сравнению с React Spring, Framer Motion предлагает более интуитивный API с явным указанием длительности и easing, тогда как React Spring использует физику пружин. Для большинства UI-анимаций Framer Motion — оптимальный выбор.

## Установка

Установка Framer Motion стандартная:

```bash
npm install framer-motion
```

Или через yarn / pnpm:

```bash
yarn add framer-motion
pnpm add framer-motion
```

Начиная с версии 11, пакет называется `motion` (новый минималистичный вариант), но `framer-motion` продолжает работать:

```bash
npm install motion
```

В этой статье мы используем `framer-motion`.

## motion компоненты

Ключевая концепция Framer Motion — это **motion компоненты**. Это расширенные версии стандартных HTML-элементов и SVG, которые поддерживают все возможности анимации библиотеки.

```tsx
import { motion } from 'framer-motion';

// Вместо <div> используем <motion.div>
function App() {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
    >
      Привет, Framer Motion!
    </motion.div>
  );
}
```

Framer Motion предоставляет motion-версии для всех HTML-элементов:

```tsx
import { motion } from 'framer-motion';

// HTML элементы
<motion.div />
<motion.span />
<motion.p />
<motion.button />
<motion.a />
<motion.ul />
<motion.li />
<motion.h1 />
<motion.section />
<motion.article />
<motion.form />
<motion.input />
<motion.img />

// SVG элементы
<motion.svg />
<motion.path />
<motion.circle />
<motion.rect />
```

Если вам нужен motion-компонент для кастомного компонента, используйте `motion()` как HOC:

```tsx
import { motion } from 'framer-motion';
import { MyButton } from './MyButton';

const MotionButton = motion(MyButton);

function App() {
  return (
    <MotionButton
      animate={{ scale: 1 }}
      initial={{ scale: 0 }}
    >
      Кликни меня
    </MotionButton>
  );
}
```

## initial, animate, exit — базовые пропсы анимации

Три главных пропса Framer Motion определяют состояния анимации:

- **`initial`** — начальное состояние (до монтирования или начальная позиция)
- **`animate`** — целевое состояние (к которому должен прийти элемент)
- **`exit`** — состояние при размонтировании (работает в паре с AnimatePresence)

```tsx
import { motion } from 'framer-motion';

function FadeInCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}  // начинаем невидимым и смещённым вниз
      animate={{ opacity: 1, y: 0 }}   // появляемся и встаём на место
      exit={{ opacity: 0, y: -20 }}    // уходим вверх при размонтировании
    >
      <h2>Карточка</h2>
      <p>Контент карточки</p>
    </motion.div>
  );
}
```

### Настройка перехода (transition)

Пропс `transition` позволяет настроить параметры анимации:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.5,        // длительность в секундах
    delay: 0.2,           // задержка перед началом
    ease: 'easeInOut',    // функция ускорения
    repeat: Infinity,      // бесконечное повторение
    repeatType: 'reverse', // направление повторения: 'loop' | 'reverse' | 'mirror'
  }}
/>
```

Доступные функции ускорения (ease):

```tsx
transition={{ ease: 'linear' }}
transition={{ ease: 'easeIn' }}
transition={{ ease: 'easeOut' }}
transition={{ ease: 'easeInOut' }}
transition={{ ease: [0.17, 0.67, 0.83, 0.67] }} // кастомная кубическая Безье
```

Для spring-анимаций (физика пружин):

```tsx
transition={{
  type: 'spring',
  stiffness: 100,  // жёсткость пружины
  damping: 10,     // затухание
  mass: 1,         // масса объекта
}}
```

## variants — переиспользуемые наборы анимаций

**Variants** — это именованные наборы состояний анимации. Они позволяют:
1. Вынести логику анимаций из JSX в отдельный объект
2. Синхронизировать анимации родителя и дочерних элементов
3. Переиспользовать анимации в разных компонентах

```tsx
import { motion } from 'framer-motion';

// Определяем variants отдельно от JSX
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // каждый дочерний элемент появляется с задержкой 0.1с
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.li key={index} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

Обратите внимание: дочерние элементы автоматически наследуют `initial` и `animate` от родителя. Вам не нужно повторять эти пропсы на каждом `motion.li`.

### staggerChildren и delayChildren

Для анимации списков с задержкой между элементами:

```tsx
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,    // 50мс между каждым элементом
      delayChildren: 0.2,       // общая задержка перед началом
      staggerDirection: -1,     // анимировать в обратном порядке (-1)
    },
  },
};
```

### Программное переключение состояний

С variants удобно управлять сложной логикой:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const boxVariants = {
  closed: { width: 100, height: 100, borderRadius: '10px' },
  open: { width: 300, height: 200, borderRadius: '20px' },
};

function ExpandableBox() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      variants={boxVariants}
      animate={isOpen ? 'open' : 'closed'}
      transition={{ duration: 0.3 }}
      onClick={() => setIsOpen(!isOpen)}
    />
  );
}
```

## AnimatePresence для анимации unmount

Одна из самых мощных фич Framer Motion — **AnimatePresence**. Она позволяет анимировать компоненты при их размонтировании (что невозможно с обычным CSS).

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}  // эта анимация выполняется при размонтировании
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Модальное окно</h2>
            <button onClick={onClose}>Закрыть</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### mode у AnimatePresence

Пропс `mode` управляет поведением при переключении элементов:

```tsx
// 'sync' (по умолчанию) — выход и вход происходят одновременно
<AnimatePresence mode="sync">

// 'wait' — сначала завершается exit анимация, потом начинается enter
<AnimatePresence mode="wait">

// 'popLayout' — выходящий элемент убирается из потока сразу
<AnimatePresence mode="popLayout">
```

### AnimatePresence для списков

```tsx
import { AnimatePresence, motion } from 'framer-motion';

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      <AnimatePresence>
        {todos.map((todo) => (
          <motion.li
            key={todo.id}  // key обязателен для AnimatePresence!
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {todo.text}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

Важно: при использовании AnimatePresence для списков каждый элемент должен иметь уникальный `key`.

## layout анимации и layoutId

**Layout анимации** — это возможность Framer Motion автоматически анимировать изменение размера и положения элементов на странице.

Просто добавьте пропс `layout` к motion-компоненту:

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

function LayoutDemo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout  // Framer Motion автоматически анимирует все изменения layout
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        width: isExpanded ? 300 : 100,
        height: isExpanded ? 200 : 100,
        background: 'blue',
      }}
    />
  );
}
```

### Shared Layout с layoutId

**layoutId** позволяет создавать анимации переходов между двумя разными элементами, которые Framer Motion воспримет как один и тот же:

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface Item {
  id: number;
  title: string;
  description: string;
}

function Gallery({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = items.find((item) => item.id === selectedId);

  return (
    <>
      <div className="grid">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layoutId={`card-${item.id}`}  // уникальный ID для shared layout
            onClick={() => setSelectedId(item.id)}
            className="card"
          >
            <motion.h2 layoutId={`title-${item.id}`}>{item.title}</motion.h2>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            layoutId={`card-${selected.id}`}  // тот же layoutId — Framer Motion анимирует переход
            className="card-expanded"
          >
            <motion.h2 layoutId={`title-${selected.id}`}>{selected.title}</motion.h2>
            <p>{selected.description}</p>
            <button onClick={() => setSelectedId(null)}>Закрыть</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### Типы layout анимаций

```tsx
<motion.div layout />                    // анимирует и размер, и позицию
<motion.div layout="position" />         // только позицию
<motion.div layout="size" />             // только размер
<motion.div layout="preserve-aspect" />  // сохраняет пропорции при изменении размера
```

## Жесты с whileHover, whileTap, whileDrag, whileFocus

Framer Motion предоставляет удобные пропсы для анимаций при жестах:

### whileHover и whileTap

```tsx
import { motion } from 'framer-motion';

function AnimatedButton({ onClick, children }: ButtonProps) {
  return (
    <motion.button
      whileHover={{
        scale: 1.05,
        backgroundColor: '#0066cc',
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.95,
      }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

### whileDrag и drag

Framer Motion делает drag-and-drop очень простым:

```tsx
import { motion } from 'framer-motion';
import { useRef } from 'react';

function DraggableCard() {
  const constraintsRef = useRef(null);

  return (
    <div ref={constraintsRef} className="container">
      <motion.div
        drag                           // разрешаем перетаскивание
        dragConstraints={constraintsRef}  // ограничиваем область перетаскивания
        dragElastic={0.2}              // упругость при достижении границ (0-1)
        dragMomentum={true}            // инерция после отпускания
        whileDrag={{
          scale: 1.1,
          cursor: 'grabbing',
        }}
        className="draggable-card"
      >
        Перетащи меня
      </motion.div>
    </div>
  );
}
```

Ограничение перетаскивания по одной оси:

```tsx
<motion.div drag="x" />    // только горизонтально
<motion.div drag="y" />    // только вертикально
<motion.div drag />        // в любом направлении
```

### Обработчики событий жестов

```tsx
<motion.div
  onHoverStart={(event, info) => console.log('hover started')}
  onHoverEnd={(event, info) => console.log('hover ended')}
  onTap={(event, info) => console.log('tapped at', info.point)}
  onDragStart={(event, info) => console.log('drag started')}
  onDrag={(event, info) => console.log('dragging', info.point)}
  onDragEnd={(event, info) => console.log('drag ended', info.velocity)}
/>
```

## useAnimation для программного управления

**useAnimation** позволяет управлять анимациями программно — запускать, останавливать, ставить в очередь:

```tsx
import { useAnimation, motion } from 'framer-motion';
import { useEffect } from 'react';

function PulsingCircle({ isActive }: { isActive: boolean }) {
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      controls.start({
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    } else {
      controls.stop();
      controls.set({ scale: 1, opacity: 1 });
    }
  }, [isActive, controls]);

  return (
    <motion.div
      animate={controls}
      className="circle"
    />
  );
}
```

### Последовательные анимации

```tsx
import { useAnimation, motion } from 'framer-motion';

function SequencedAnimation() {
  const controls = useAnimation();

  const runSequence = async () => {
    // Анимации выполняются последовательно
    await controls.start({ x: 100, transition: { duration: 0.5 } });
    await controls.start({ y: 100, transition: { duration: 0.5 } });
    await controls.start({ rotate: 180, transition: { duration: 0.5 } });
    await controls.start({ x: 0, y: 0, rotate: 0, transition: { duration: 1 } });
  };

  return (
    <>
      <motion.div animate={controls} className="box" />
      <button onClick={runSequence}>Запустить анимацию</button>
    </>
  );
}
```

### useAnimation с Intersection Observer

Часто используется для запуска анимаций при появлении элемента в viewport:

```tsx
import { useAnimation, motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

function AnimateOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true }); // срабатывает один раз
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
    >
      {children}
    </motion.div>
  );
}
```

## useScroll и useTransform для scroll-анимаций

Framer Motion предоставляет хуки для создания анимаций, привязанных к прокрутке страницы.

### useScroll

```tsx
import { useScroll, motion } from 'framer-motion';

function ProgressBar() {
  const { scrollYProgress } = useScroll(); // значение от 0 до 1

  return (
    <motion.div
      className="progress-bar"
      style={{ scaleX: scrollYProgress }}  // ширина привязана к прокрутке
    />
  );
}
```

Доступные значения из `useScroll`:

```tsx
const {
  scrollX,          // горизонтальная прокрутка в пикселях (MotionValue)
  scrollY,          // вертикальная прокрутка в пикселях (MotionValue)
  scrollXProgress,  // горизонтальная прокрутка от 0 до 1 (MotionValue)
  scrollYProgress,  // вертикальная прокрутка от 0 до 1 (MotionValue)
} = useScroll();
```

Прокрутка относительно конкретного элемента:

```tsx
import { useScroll, motion } from 'framer-motion';
import { useRef } from 'react';

function ParallaxSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,              // отслеживаем прокрутку относительно этого элемента
    offset: ['start end', 'end start'], // [когда начинаем, когда заканчиваем]
  });

  return <div ref={ref}>...</div>;
}
```

### useTransform

**useTransform** позволяет преобразовывать одно MotionValue в другое:

```tsx
import { useScroll, useTransform, motion } from 'framer-motion';

function ParallaxHero() {
  const { scrollYProgress } = useScroll();

  // Преобразуем scrollYProgress (0-1) в opacity (1-0)
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Параллакс эффект: при прокрутке изображение движется медленнее
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  // Масштаб
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 1.2]);

  return (
    <div className="hero">
      <motion.img
        src="/hero.jpg"
        style={{ opacity, y, scale }}
      />
    </div>
  );
}
```

### useSpring для плавного следования

```tsx
import { useScroll, useSpring, useTransform, motion } from 'framer-motion';

function SmoothProgress() {
  const { scrollYProgress } = useScroll();

  // useSpring сглаживает резкие изменения значения
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return <motion.div className="progress-bar" style={{ scaleX }} />;
}
```

### Полный пример scroll-анимаций

```tsx
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import { useRef } from 'react';

function ScrollAnimatedCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const opacity = useTransform(smoothProgress, [0, 1], [0, 1]);
  const y = useTransform(smoothProgress, [0, 1], [80, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.9, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      className="card"
    >
      <h2>Анимация при скролле</h2>
      <p>Этот блок появляется при прокрутке</p>
    </motion.div>
  );
}
```

## Практические примеры

### Страничные переходы

Для анимации переходов между страницами (например, с React Router):

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <HomePage />
            </PageWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <PageWrapper>
              <AboutPage />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
```

### Анимированное модальное окно

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="modal-dialog"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2>{title}</h2>
              <button onClick={onClose} aria-label="Закрыть">×</button>
            </div>
            <div className="modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
```

### Анимированные карточки

```tsx
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,  // каждая карточка появляется с задержкой
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

interface Card {
  id: number;
  title: string;
  description: string;
  image: string;
}

function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className="card"
          custom={index}           // передаём index в variants как аргумент
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"    // анимация при появлении в viewport
          viewport={{ once: true, margin: '-50px' }}
          whileHover={{
            y: -5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            transition: { duration: 0.2 },
          }}
        >
          <img src={card.image} alt={card.title} />
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
```

### Drag-and-drop список

```tsx
import { motion, Reorder } from 'framer-motion';
import { useState } from 'react';

function DraggableList() {
  const [items, setItems] = useState(['Элемент 1', 'Элемент 2', 'Элемент 3', 'Элемент 4']);

  return (
    // Reorder.Group — специальный контейнер для drag-and-drop сортировки
    <Reorder.Group axis="y" values={items} onReorder={setItems}>
      {items.map((item) => (
        <Reorder.Item key={item} value={item}>
          <motion.div
            className="list-item"
            whileDrag={{ scale: 1.05, zIndex: 1 }}
          >
            {item}
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

## TypeScript и Framer Motion

Framer Motion полностью поддерживает TypeScript:

```tsx
import { motion, Variants, Transition, TargetAndTransition } from 'framer-motion';

// Типизация variants
const myVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Типизация transition
const myTransition: Transition = {
  duration: 0.5,
  ease: 'easeOut',
};

// Типизация animate
const targetState: TargetAndTransition = {
  opacity: 1,
  scale: 1.2,
};

// Работа с MotionValue
import { useMotionValue, useTransform } from 'framer-motion';

function TypedComponent() {
  const x = useMotionValue<number>(0); // MotionValue<number>
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  return <motion.div style={{ x, opacity }} />;
}
```

## Производительность

Несколько советов по производительности с Framer Motion:

### Анимируйте transform и opacity

Лучше всего анимировать свойства, которые не вызывают reflow: `x`, `y`, `scale`, `rotate`, `opacity`. Избегайте анимации `width`, `height`, `top`, `left` — они дорогостоящие.

```tsx
// Хорошо: GPU-ускоренная анимация
<motion.div animate={{ x: 100, opacity: 0.5 }} />

// Плохо: вызывает layout reflow
<motion.div animate={{ left: '100px', width: '200px' }} />
```

### LazyMotion для уменьшения бандла

```tsx
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Загружаем только необходимые функции
function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div animate={{ opacity: 1 }} /> {/* используем m вместо motion */}
    </LazyMotion>
  );
}
```

### will-change

```tsx
<motion.div
  animate={{ x: 100 }}
  style={{ willChange: 'transform' }} // подсказка браузеру
/>
```

## Framer Motion vs React Spring

| Критерий | Framer Motion | React Spring |
|---------|--------------|-------------|
| API | Декларативный, prop-based | Хуки (useSpring, useTrail...) |
| Модель анимаций | Duration + easing / Spring | Физика пружин |
| AnimatePresence | Встроен | Через useTransition |
| Layout анимации | Встроены (layout prop) | Сложнее |
| Жесты | Встроены | Через @use-gesture |
| Размер бандла | ~46kb (gzip) | ~40kb (gzip) |
| TypeScript | Отличная поддержка | Хорошая поддержка |
| Кривая обучения | Пологая | Чуть круче |
| Подходит для | Большинства UI-анимаций | Физически реалистичных анимаций |

**Вывод**: Если вам нужно быстро создать красивые UI-анимации с минимальным погружением в детали — выбирайте Framer Motion. Если важна физическая реалистичность анимаций (например, бросок объекта, пружинящие переходы) — рассмотрите React Spring.

## Заключение

Framer Motion — мощная и удобная библиотека анимаций для React, которая закрывает большинство потребностей в анимациях для production-приложений:

- **motion компоненты** — простая замена HTML-элементам с поддержкой анимаций
- **initial, animate, exit** — декларативное описание состояний анимации
- **variants** — переиспользуемые наборы анимаций с поддержкой оркестровки дочерних элементов
- **AnimatePresence** — анимация размонтирования компонентов
- **layout и layoutId** — автоматические layout-анимации и shared element transitions
- **Жесты** — встроенная поддержка hover, tap, drag без дополнительных библиотек
- **useAnimation** — программное управление анимациями и сложные последовательности
- **useScroll + useTransform** — scroll-based анимации с параллакс-эффектами

Начните с простых fade-in анимаций, постепенно изучайте variants и AnimatePresence, затем переходите к layout-анимациям и scroll-эффектам. Framer Motion масштабируется от простых случаев до самых сложных анимированных интерфейсов.
