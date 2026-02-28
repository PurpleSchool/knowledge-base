---
metaTitle: "useEffect vs useLayoutEffect в React — полное сравнение"
metaDescription: "Подробное сравнение useEffect и useLayoutEffect в React: когда использовать каждый хук, различия в тайминге, работа в SSR, практические примеры и паттерны."
---

# useEffect vs useLayoutEffect

`useEffect` и `useLayoutEffect` — два хука для работы с побочными эффектами в React. На первый взгляд они похожи, но различаются временем запуска и сценариями применения. Понимание этой разницы критически важно для написания корректного и производительного кода.

## Содержание

- [Что такое побочные эффекты](#что-такое-побочные-эффекты)
- [useEffect — основы](#useeffect--основы)
- [useLayoutEffect — основы](#uselayouteffect--основы)
- [Ключевое различие: тайминг](#ключевое-различие-тайминг)
- [Когда использовать useEffect](#когда-использовать-useeffect)
- [Когда использовать useLayoutEffect](#когда-использовать-uselayouteffect)
- [Проблема мерцания (flash)](#проблема-мерцания-flash)
- [useLayoutEffect и SSR](#uselayouteffect-и-ssr)
- [Изоморфный паттерн](#изоморфный-паттерн)
- [Сравнительная таблица](#сравнительная-таблица)
- [Типичные ошибки](#типичные-ошибки)
- [Практические примеры](#практические-примеры)
- [Итоги](#итоги)

## Что такое побочные эффекты

Побочный эффект (side effect) — это любое взаимодействие компонента с внешним миром: запросы к API, работа с DOM, подписки на события, таймеры и т.д.

React рендерит компоненты в изолированной среде. Прямая работа с DOM или внешними системами внутри функции рендера может привести к непредсказуемым результатам. Хуки эффектов (`useEffect`, `useLayoutEffect`) позволяют безопасно выполнять такие операции в нужный момент жизненного цикла.

## useEffect — основы

```jsx
import { useEffect } from 'react'

function Component() {
  useEffect(() => {
    // Код эффекта
    console.log('Эффект выполнен')

    return () => {
      // Функция очистки (cleanup)
      console.log('Очистка эффекта')
    }
  }, [/* зависимости */])

  return <div>Компонент</div>
}
```

`useEffect` принимает два аргумента:
- **callback** — функция с кодом эффекта, может возвращать функцию очистки
- **deps** — массив зависимостей (опционально)

Поведение в зависимости от массива зависимостей:
```jsx
// Запускается после каждого рендера
useEffect(() => { /* ... */ })

// Запускается только один раз — после первого рендера (монтирование)
useEffect(() => { /* ... */ }, [])

// Запускается при монтировании и при изменении count
useEffect(() => { /* ... */ }, [count])
```

## useLayoutEffect — основы

`useLayoutEffect` имеет идентичный API:

```jsx
import { useLayoutEffect } from 'react'

function Component() {
  useLayoutEffect(() => {
    // Код эффекта
    console.log('Layout эффект выполнен')

    return () => {
      console.log('Очистка layout эффекта')
    }
  }, [])

  return <div>Компонент</div>
}
```

С точки зрения синтаксиса — полная копия `useEffect`. Разница исключительно в тайминге выполнения.

## Ключевое различие: тайминг

Это самое важное, что нужно понять:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Жизненный цикл рендера React                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. Выполнение функции компонента (рендер)                       │
│ 2. React обновляет виртуальный DOM                              │
│ 3. React вносит изменения в реальный DOM                        │
│ 4. ▶ useLayoutEffect запускается СИНХРОННО                      │
│    └── Браузер ждёт завершения перед отрисовкой                 │
│ 5. Браузер отрисовывает изменения (paint)                       │
│ 6. ▶ useEffect запускается АСИНХРОННО                           │
│    └── Браузер уже показал пользователю обновление              │
└─────────────────────────────────────────────────────────────────┘
```

**`useEffect`** — выполняется **после** того, как браузер отрисовал изменения. Не блокирует визуальное обновление. Асинхронный.

**`useLayoutEffect`** — выполняется **до** отрисовки браузером, но после того, как React обновил DOM. Блокирует визуальное обновление до завершения. Синхронный.

Пример, демонстрирующий порядок:

```jsx
import { useEffect, useLayoutEffect } from 'react'

function OrderDemo() {
  console.log('1. Рендер')

  useLayoutEffect(() => {
    console.log('3. useLayoutEffect (DOM обновлён, браузер ещё не нарисовал)')
    return () => console.log('2a. Очистка useLayoutEffect')
  })

  useEffect(() => {
    console.log('4. useEffect (браузер уже нарисовал)')
    return () => console.log('2b. Очистка useEffect')
  })

  return <div>Demo</div>
}

// При первом рендере в консоли:
// 1. Рендер
// 3. useLayoutEffect (DOM обновлён, браузер ещё не нарисовал)
// [Браузер отрисовывает]
// 4. useEffect (браузер уже нарисовал)

// При последующих рендерах:
// 1. Рендер
// 2a. Очистка useLayoutEffect
// 3. useLayoutEffect
// [Браузер отрисовывает]
// 2b. Очистка useEffect
// 4. useEffect
```

## Когда использовать useEffect

`useEffect` — правильный выбор в большинстве случаев. Используйте его когда:

### Запросы данных

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) setUser(data)
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  if (!user) return <div>Загрузка...</div>
  return <div>{user.name}</div>
}
```

### Подписки на события

```jsx
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div>{size.width} x {size.height}</div>
}
```

### Таймеры и интервалы

```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <div>Прошло: {seconds} сек</div>
}
```

### Аналитика и логирование

```jsx
function Page({ title }) {
  useEffect(() => {
    document.title = title
    analytics.pageView(title)
  }, [title])

  return <main>{/* ... */}</main>
}
```

## Когда использовать useLayoutEffect

`useLayoutEffect` нужен, когда вам необходимо прочитать или изменить DOM **до** того, как браузер отрисует изменения пользователю. Это помогает избежать визуальных артефактов.

### Измерение DOM-элементов

```jsx
function Tooltip({ children, text }) {
  const tooltipRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!tooltipRef.current) return

    // Читаем реальные размеры элемента из DOM
    const rect = tooltipRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth

    // Если тултип выходит за правый край — переносим влево
    if (rect.right > viewportWidth) {
      setPosition({
        top: rect.top,
        left: viewportWidth - rect.width - 10
      })
    }
  })

  return (
    <div>
      {children}
      <div ref={tooltipRef} style={position} className="tooltip">
        {text}
      </div>
    </div>
  )
}
```

Здесь важно использовать `useLayoutEffect`: если использовать `useEffect`, пользователь на долю секунды увидит тултип в неправильной позиции, а потом он "прыгнет" на правильное место.

### Синхронные анимации

```jsx
function SlideIn({ children, isVisible }) {
  const elementRef = useRef(null)

  useLayoutEffect(() => {
    if (!elementRef.current) return

    if (isVisible) {
      // Устанавливаем начальное состояние ДО отрисовки
      elementRef.current.style.transform = 'translateX(-100%)'
      elementRef.current.style.opacity = '0'

      // Запускаем анимацию
      requestAnimationFrame(() => {
        elementRef.current.style.transition = 'transform 0.3s, opacity 0.3s'
        elementRef.current.style.transform = 'translateX(0)'
        elementRef.current.style.opacity = '1'
      })
    }
  }, [isVisible])

  return <div ref={elementRef}>{children}</div>
}
```

### Синхронизация с внешними библиотеками

```jsx
function Chart({ data }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useLayoutEffect(() => {
    if (!canvasRef.current) return

    // Chart.js должен знать реальные размеры canvas до первого рендера
    const ctx = canvasRef.current.getContext('2d')
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: data
    })

    return () => {
      chartRef.current?.destroy()
    }
  }, [])

  useLayoutEffect(() => {
    if (!chartRef.current) return
    chartRef.current.data = data
    chartRef.current.update()
  }, [data])

  return <canvas ref={canvasRef} />
}
```

## Проблема мерцания (flash)

Это классическая ситуация, где разница между хуками наиболее очевидна:

```jsx
// ❌ Плохо: с useEffect пользователь увидит мерцание
function BadAdaptiveText() {
  const [fontSize, setFontSize] = useState(16)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      // Пользователь сначала видит текст размером 16px,
      // потом он "прыгает" до нужного размера
      setFontSize(width < 400 ? 12 : 16)
    }
  })

  return (
    <div ref={containerRef}>
      <p style={{ fontSize }}>Адаптивный текст</p>
    </div>
  )
}

// ✅ Хорошо: с useLayoutEffect мерцания нет
function GoodAdaptiveText() {
  const [fontSize, setFontSize] = useState(16)
  const containerRef = useRef(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      // Размер установлен ДО того, как браузер нарисует —
      // пользователь сразу видит правильный размер
      setFontSize(width < 400 ? 12 : 16)
    }
  })

  return (
    <div ref={containerRef}>
      <p style={{ fontSize }}>Адаптивный текст</p>
    </div>
  )
}
```

## useLayoutEffect и SSR

Это одна из самых важных практических проблем. При серверном рендеринге (SSR — Next.js, Remix, Gatsby) `useLayoutEffect` **не выполняется** на сервере, потому что на сервере нет DOM.

React выводит предупреждение:
```
Warning: useLayoutEffect does nothing on the server because its effect cannot be
encoded into the server renderer's output format.
```

Это происходит потому что:
1. На сервере нет браузера и DOM
2. `useLayoutEffect` должен запускаться синхронно перед отрисовкой — но на сервере нет "отрисовки"
3. Код сервера и клиента может отличаться, что нарушает гидратацию

```jsx
// ❌ Проблема в Next.js: предупреждение при SSR
function ServerComponent() {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    setWidth(window.innerWidth) // ReferenceError на сервере!
  }, [])

  return <div>Ширина: {width}</div>
}
```

## Изоморфный паттерн

Решение проблемы SSR — изоморфный хук, который использует `useLayoutEffect` на клиенте и `useEffect` на сервере:

```jsx
import { useEffect, useLayoutEffect } from 'react'

// Определяем, работаем ли мы на сервере
const isServer = typeof window === 'undefined'

// Изоморфный хук: useLayoutEffect в браузере, useEffect на сервере
export const useIsomorphicLayoutEffect = isServer ? useEffect : useLayoutEffect
```

Использование:

```jsx
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

function AdaptiveComponent() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const ref = useRef(null)

  // Работает корректно и на сервере (SSR), и на клиенте
  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect()
      setDimensions({ width, height })
    }
  }, [])

  return (
    <div ref={ref}>
      {dimensions.width}px × {dimensions.height}px
    </div>
  )
}
```

Этот паттерн используется во многих популярных библиотеках: react-use, framer-motion, radix-ui и других.

Пример реализации кастомного хука с изоморфным паттерном:

```jsx
// hooks/useDimensions.js
import { useState, useRef } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

export function useDimensions() {
  const ref = useRef(null)
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0
  })

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return

    const updateDimensions = () => {
      const rect = ref.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      })
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(ref.current)

    return () => resizeObserver.disconnect()
  }, [])

  return [ref, dimensions]
}

// Использование
function ResponsiveCard() {
  const [cardRef, { width }] = useDimensions()

  return (
    <div ref={cardRef} className={width > 400 ? 'card-wide' : 'card-narrow'}>
      <p>Ширина карточки: {width}px</p>
    </div>
  )
}
```

## Сравнительная таблица

| Характеристика | useEffect | useLayoutEffect |
|----------------|-----------|-----------------|
| Тайминг | После отрисовки браузером | До отрисовки браузером |
| Блокирует отрисовку | Нет | Да |
| Тип выполнения | Асинхронный | Синхронный |
| Работает на сервере (SSR) | Да | Нет |
| Производительность | Выше | Ниже (при долгих операциях) |
| Визуальные артефакты | Возможны | Исключены |
| Аналог в классовых компонентах | componentDidMount/Update/Unmount | componentDidMount/Update (синхронная версия) |
| Когда использовать | Большинство случаев | Работа с DOM до отрисовки |

## Типичные ошибки

### Использование useLayoutEffect везде

```jsx
// ❌ Избыточно: useLayoutEffect для fetch не нужен
function BadFetch() {
  const [data, setData] = useState(null)

  useLayoutEffect(() => {
    // Это блокирует отрисовку пока идёт запрос!
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{data?.title}</div>
}

// ✅ Правильно: useEffect для асинхронных операций
function GoodFetch() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{data?.title}</div>
}
```

### Тяжёлые вычисления в useLayoutEffect

```jsx
// ❌ Плохо: тяжёлые вычисления блокируют отрисовку
function BadHeavyCalculation({ data }) {
  const [result, setResult] = useState(null)

  useLayoutEffect(() => {
    // Долгое вычисление блокирует браузер!
    const computed = data.reduce((acc, item) => {
      // Очень долгая операция...
      return acc + heavyCompute(item)
    }, 0)
    setResult(computed)
  }, [data])

  return <div>{result}</div>
}

// ✅ Правильно: useMemo для вычислений
function GoodHeavyCalculation({ data }) {
  const result = useMemo(() => {
    return data.reduce((acc, item) => acc + heavyCompute(item), 0)
  }, [data])

  return <div>{result}</div>
}
```

### Игнорирование предупреждения об SSR

```jsx
// ❌ Вызывает ошибку при SSR
function BadSSR() {
  useLayoutEffect(() => {
    console.log('Ширина:', window.innerWidth)
  }, [])
  return <div>Component</div>
}

// ✅ Изоморфный подход
function GoodSSR() {
  useIsomorphicLayoutEffect(() => {
    console.log('Ширина:', window.innerWidth)
  }, [])
  return <div>Component</div>
}
```

### Отсутствие cleanup в useLayoutEffect

```jsx
// ❌ Утечка памяти
function BadCleanup({ isActive }) {
  useLayoutEffect(() => {
    if (isActive) {
      const observer = new MutationObserver(callback)
      observer.observe(document.body, { childList: true })
      // Забыли очистить!
    }
  }, [isActive])

  return <div>Component</div>
}

// ✅ Правильная очистка
function GoodCleanup({ isActive }) {
  useLayoutEffect(() => {
    if (!isActive) return

    const observer = new MutationObserver(callback)
    observer.observe(document.body, { childList: true })

    return () => observer.disconnect() // Очищаем
  }, [isActive])

  return <div>Component</div>
}
```

## Практические примеры

### Всплывающее меню с автопозиционированием

```jsx
function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let top = triggerRect.bottom + 4
    let left = triggerRect.left

    // Меню выходит за нижний край?
    if (top + menuRect.height > viewportHeight) {
      top = triggerRect.top - menuRect.height - 4
    }

    // Меню выходит за правый край?
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 8
    }

    setMenuStyle({ top, left, position: 'fixed' })
  }, [isOpen])

  return (
    <div>
      <button ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        Открыть меню
      </button>

      {isOpen && (
        <ul ref={menuRef} style={menuStyle} className="dropdown">
          {items.map(item => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Sticky Header с отступом

```jsx
function StickyHeader() {
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useIsomorphicLayoutEffect(() => {
    if (!headerRef.current) return

    const updateHeight = () => {
      setHeaderHeight(headerRef.current.offsetHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(headerRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100 }}
      >
        <nav>Навигация</nav>
      </header>

      {/* Отступ точно равен высоте хедера — без мерцания */}
      <main style={{ paddingTop: headerHeight }}>
        Контент страницы
      </main>
    </>
  )
}
```

### Плавное раскрытие аккордеона

```jsx
function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)

  useIsomorphicLayoutEffect(() => {
    if (!contentRef.current) return
    setContentHeight(contentRef.current.scrollHeight)
  }, [children, isOpen])

  return (
    <div className="accordion">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {title}
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      <div
        ref={contentRef}
        style={{
          height: isOpen ? contentHeight : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

## Итоги

**Используйте `useEffect` когда:**
- Выполняете HTTP-запросы и загружаете данные
- Подписываетесь на события браузера или WebSocket
- Работаете с таймерами и интервалами
- Обновляете `document.title` или внешние системы
- Вам не нужна синхронизация с визуальным рендером

**Используйте `useLayoutEffect` когда:**
- Нужно измерить DOM-элементы (размеры, позиции) перед отрисовкой
- Необходимо избежать визуального мерцания при изменении DOM
- Синхронизируетесь с внешними библиотеками, которые напрямую работают с DOM
- Устанавливаете начальное состояние для анимаций

**Запомните:**
- `useEffect` выполняется **после** отрисовки — не блокирует браузер
- `useLayoutEffect` выполняется **до** отрисовки — блокирует браузер
- `useLayoutEffect` не работает на сервере (SSR) — используйте `useIsomorphicLayoutEffect`
- По умолчанию используйте `useEffect`, переходите на `useLayoutEffect` только при необходимости
