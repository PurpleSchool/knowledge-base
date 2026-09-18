---
metaTitle: "GSAP анимации в React — useRef, useGSAP, ScrollTrigger"
metaDescription: "Как использовать GSAP в React-приложениях: useRef, хук useGSAP, таймлайны, ScrollTrigger и правильная очистка анимаций."
author: "Антон Ларичев"
title: "Анимации в React с GSAP"
preview: "Подключаем GSAP к React, управляем анимациями через хуки и создаём сложные сценарии с таймлайнами и ScrollTrigger."
---

## Что такое GSAP и зачем он нужен в React

GSAP (GreenSock Animation Platform) — это JavaScript-библиотека для создания высокопроизводительных анимаций. Она работает быстрее CSS-анимаций в сложных сценариях, поддерживает любые DOM-элементы, SVG, Canvas и даже произвольные числовые значения. В отличие от Framer Motion, GSAP — императивная библиотека: вы явно указываете, что и как анимировать.

GSAP хорошо вписывается в React, если понимать несколько ключевых правил:

- **Не трогайте DOM напрямую** — используйте `useRef` для получения ссылки на элемент.
- **Запускайте анимации после монтирования** — в `useEffect` или через хук `useGSAP`.
- **Всегда возвращайте cleanup-функцию** — чтобы GSAP не создавал утечек памяти.

## Установка

```bash
npm install gsap
```

Если нужен ScrollTrigger или другие плагины:

```bash
npm install gsap
```

Все основные плагины (ScrollTrigger, Draggable, MorphSVGPlugin и др.) поставляются в одном пакете. Для плагинов клубной лицензии (SplitText, MorphSVG) потребуется аккаунт GreenSock.

## Базовая анимация через useRef и useEffect

Самый простой способ — получить ссылку на DOM-элемент через `useRef` и запустить анимацию в `useEffect`.

```tsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export function FadeInBox() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(boxRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power2.out',
      });
    }, boxRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={boxRef}
      style={{ width: 100, height: 100, background: 'rebeccapurple' }}
    />
  );
}
```

`gsap.context()` — это встроенный механизм GSAP для групповой очистки. Всё, что создано внутри контекста, будет уничтожено при вызове `ctx.revert()`. Это эквивалентно ручному сохранению списка твинов и их остановке — но намного удобнее.

`gsap.from` анимирует элемент **из** указанных значений в его текущее состояние. Противоположный метод — `gsap.to` — анимирует **в** указанные значения. `gsap.fromTo` позволяет задать оба конца анимации явно.

## Хук useGSAP

GSAP предоставляет официальный React-хук, который инкапсулирует весь шаблонный код с `useEffect` и `gsap.context`.

```bash
npm install @gsap/react
```

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function SlideInCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.card', {
        x: -100,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'back.out(1.7)',
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <div className="card">Карточка 1</div>
      <div className="card">Карточка 2</div>
      <div className="card">Карточка 3</div>
    </div>
  );
}
```

Параметр `scope` ограничивает область поиска CSS-селекторов текущим контейнером. Без него `'.card'` найдёт все элементы с таким классом на странице.

`stagger` — это задержка между анимациями нескольких элементов. `0.15` означает, что каждая следующая карточка начнёт анимацию на 150 мс позже предыдущей.

`useGSAP` по умолчанию принимает те же зависимости, что и `useEffect`:

```tsx
useGSAP(
  () => {
    gsap.to('.bar', { width: `${progress}%`, duration: 0.4 });
  },
  { scope: containerRef, dependencies: [progress] }
);
```

## Таймлайны — последовательные и параллельные анимации

Для сложных многошаговых сценариев используют `gsap.timeline()`. Таймлайн позволяет выстраивать анимации в цепочку, добавлять метки и управлять всем как одним объектом.

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-title', { y: 60, opacity: 0, duration: 0.7 })
        .from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-button', { scale: 0.8, opacity: 0, duration: 0.4 }, '-=0.2');
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef}>
      <h1 className="hero-title">Добро пожаловать</h1>
      <p className="hero-subtitle">Создавайте быстро и красиво</p>
      <button className="hero-button">Начать</button>
    </section>
  );
}
```

Значение `'-=0.3'` в позиции означает «начни на 0.3 секунды раньше предыдущей анимации». Это создаёт перекрытие анимаций, что выглядит более плавно, чем строгая последовательность.

`defaults` задаёт параметры, общие для всех твинов таймлайна — чтобы не повторять одно и то же `ease` в каждом вызове.

## ScrollTrigger — анимации при прокрутке

ScrollTrigger — плагин GSAP, который привязывает анимации к позиции скролла.

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.feature-item', {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.feature-list',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <ul className="feature-list">
        <li className="feature-item">Высокая скорость</li>
        <li className="feature-item">Гибкая настройка</li>
        <li className="feature-item">Полная документация</li>
      </ul>
    </div>
  );
}
```

`start: 'top 80%'` означает: «начать, когда верхний край триггера достигнет 80% высоты viewport». `toggleActions` задаёт поведение для четырёх событий: onEnter, onLeave, onEnterBack, onLeaveBack.

Возможные значения для каждого события: `play`, `pause`, `resume`, `reset`, `restart`, `complete`, `reverse`, `none`.

Для параллакс-эффекта используют `scrub`:

```tsx
useGSAP(
  () => {
    gsap.to('.parallax-bg', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.parallax-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  },
  { scope: containerRef }
);
```

`scrub: true` привязывает прогресс анимации напрямую к позиции скролла. Число вместо `true` (например, `scrub: 0.5`) добавляет инерцию.

## Анимация при наведении

Для интерактивных анимаций по событиям мыши GSAP используется в обработчиках событий. Важно создавать анимации внутри `useGSAP` или контролировать их жизненный цикл вручную.

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function HoverCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;

      const enterAnim = gsap.to(card, {
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        duration: 0.3,
        ease: 'power2.out',
        paused: true,
      });

      card.addEventListener('mouseenter', () => enterAnim.play());
      card.addEventListener('mouseleave', () => enterAnim.reverse());
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      style={{
        padding: 24,
        background: '#fff',
        borderRadius: 12,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      Наведите на меня
    </div>
  );
}
```

Создание твина с `paused: true` и последующий вызов `.play()` / `.reverse()` — стандартный паттерн для двунаправленных hover-анимаций. Он эффективнее, чем создавать новый твин при каждом наведении.

## Работа с SVG

GSAP отлично работает с SVG-элементами — можно анимировать `stroke-dashoffset` для эффекта рисования линий.

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function DrawingCircle() {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const circle = svgRef.current?.querySelector('circle');
      if (!circle) return;

      const length = circle.getTotalLength();

      gsap.set(circle, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      gsap.to(circle, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    },
    { scope: svgRef }
  );

  return (
    <svg ref={svgRef} width="120" height="120" viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="rebeccapurple"
        strokeWidth="4"
      />
    </svg>
  );
}
```

## Типичные ошибки и как их избежать

**Запуск анимации без useEffect**

Если вызвать `gsap.to` прямо в теле компонента, анимация будет запускаться при каждом рендере — это сломает поведение и создаст утечки.

```tsx
// Неправильно
export function Broken() {
  const ref = useRef(null);
  gsap.to(ref.current, { x: 100 }); // запускается на каждом рендере
  return <div ref={ref} />;
}

// Правильно
export function Correct() {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.to(ref.current, { x: 100 });
  }, { scope: ref });
  return <div ref={ref} />;
}
```

**Забытая регистрация плагинов**

GSAP-плагины нужно регистрировать один раз перед использованием. Лучше делать это на уровне модуля, а не внутри компонента.

```tsx
// Один раз в верхней части файла или в отдельном gsap-config.ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

**Проблемы с React StrictMode**

В режиме `StrictMode` React намеренно монтирует и размонтирует компоненты дважды в development. Именно поэтому важна очистка через `ctx.revert()` или через `useGSAP` — без неё анимации будут дублироваться.

**Конфликт с React State**

Не стоит хранить ссылки на твины в state — это вызовет лишние рендеры. Для хранения объектов GSAP используйте `useRef`.

```tsx
const tlRef = useRef<gsap.core.Timeline | null>(null);

useGSAP(() => {
  tlRef.current = gsap.timeline().from('.item', { opacity: 0 });
});

// Позже можно управлять таймлайном
const handlePause = () => tlRef.current?.pause();
```

## Интеграция с React Router

При навигации между страницами полезно делать анимации входа и выхода. Простой паттерн — оборачивать страницы в компонент с анимацией монтирования.

```tsx
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(wrapperRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.out',
      });
    },
    { scope: wrapperRef }
  );

  return <div ref={wrapperRef}>{children}</div>;
}
```

Оберните каждую страницу в этот компонент — и вы получите плавный fade-in при каждом переходе.

## Итог

GSAP в React строится на трёх принципах: DOM-доступ через `useRef`, инициализация анимаций через `useGSAP` (или `useEffect`), очистка через `ctx.revert()`. Для последовательных сценариев используйте таймлайны, для анимаций при прокрутке — ScrollTrigger. Регистрируйте плагины один раз на уровне модуля и не храните GSAP-объекты в state.

Подробнее о разработке на React — в курсе на PurpleSchool:
[Курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=gsap-animations)