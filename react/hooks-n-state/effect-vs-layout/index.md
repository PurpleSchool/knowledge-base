# useEffect vs useLayoutEffect в React

React предоставляет два хука для выполнения побочных эффектов: `useEffect` и `useLayoutEffect`. Они похожи по API, но принципиально отличаются **моментом выполнения** относительно обновления DOM.

## Разница во времени выполнения

```
Рендер компонента
      ↓
Обновление виртуального DOM
      ↓
Фиксация изменений в реальный DOM
      ↓
[useLayoutEffect запускается ЗДЕСЬ — синхронно]
      ↓
Браузер отрисовывает изменения (paint)
      ↓
[useEffect запускается ЗДЕСЬ — асинхронно]
```

### useEffect

- Запускается **после** того, как браузер отрисовал изменения
- **Асинхронный** — не блокирует браузер
- Подходит для большинства побочных эффектов

### useLayoutEffect

- Запускается **до** отрисовки браузером, сразу после обновления DOM
- **Синхронный** — блокирует отрисовку до завершения
- Подходит для операций, влияющих на визуальное отображение

## Синтаксис (идентичный)

```jsx
// useEffect
useEffect(() => {
  // Побочный эффект
  return () => {
    // Очистка (cleanup)
  };
}, [dependencies]);

// useLayoutEffect — тот же синтаксис
useLayoutEffect(() => {
  // Побочный эффект (выполняется синхронно после DOM-мутации)
  return () => {
    // Очистка
  };
}, [dependencies]);
```

## Когда использовать useEffect

`useEffect` подходит для подавляющего большинства случаев:

```jsx
// ✅ Получение данных
useEffect(() => {
  let cancelled = false;

  fetchUser(userId).then(user => {
    if (!cancelled) setUser(user);
  });

  return () => { cancelled = true; };
}, [userId]);

// ✅ Подписки на события
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [onClose]);

// ✅ Таймеры
useEffect(() => {
  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

// ✅ Синхронизация с внешними системами
useEffect(() => {
  analytics.track('page_view', { page: location.pathname });
}, [location.pathname]);

// ✅ Обновление заголовка страницы
useEffect(() => {
  document.title = `${count} новых сообщений`;
}, [count]);
```

## Когда использовать useLayoutEffect

`useLayoutEffect` нужен, когда необходимо измерить DOM или изменить его **до** того, как пользователь увидит результат.

### 1. Измерение размеров элементов

```jsx
function Tooltip({ text, targetRef }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // useLayoutEffect: измеряем и позиционируем до отрисовки
  // useEffect здесь вызвал бы "мигание" — tooltip сначала появился бы
  // в неправильном месте, потом переместился
  useLayoutEffect(() => {
    if (!tooltipRef.current || !targetRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    setPosition({
      top: targetRect.top - tooltipRect.height - 8,
      left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
    });
  }, [text]);

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
    >
      {text}
    </div>
  );
}
```

### 2. Предотвращение "мигания" (flash of unstyled content)

```jsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // ✅ useLayoutEffect: тема применяется до первой отрисовки
  // Пользователь не увидит "мигание" неправильной темы
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // ❌ useEffect: может произойти мигание —
  // страница сначала покажется со светлой темой, потом переключится

  return <ThemeContext.Provider value={{ theme, setTheme }}>
    {children}
  </ThemeContext.Provider>;
}
```

### 3. Синхронизация с анимацией

```jsx
function AnimatedDrawer({ isOpen, children }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    if (isOpen) {
      // Устанавливаем начальное состояние ПЕРЕД отрисовкой
      drawer.style.transform = 'translateX(-100%)';
      // Запускаем анимацию
      requestAnimationFrame(() => {
        drawer.style.transition = 'transform 0.3s ease';
        drawer.style.transform = 'translateX(0)';
      });
    }
  }, [isOpen]);

  return <div ref={drawerRef}>{children}</div>;
}
```

### 4. Scroll позиция

```jsx
function MessageList({ messages }) {
  const listRef = useRef<HTMLDivElement>(null);

  // ✅ useLayoutEffect: скролл до отрисовки, без видимого прыжка
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={listRef} style={{ overflowY: 'auto', height: '400px' }}>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  );
}
```

## Сравнительная таблица

| Характеристика | useEffect | useLayoutEffect |
|----------------|-----------|-----------------|
| Время выполнения | После отрисовки браузером | После обновления DOM, до отрисовки |
| Тип выполнения | Асинхронный | Синхронный |
| Блокирует отрисовку | Нет | Да |
| Риск мигания | Есть (при изменении DOM) | Нет |
| Влияние на производительность | Минимальное | Может задержать отрисовку |
| SSR поддержка | ✅ Работает | ⚠️ Вызывает предупреждение |
| Рекомендуется по умолчанию | ✅ Да | Только при необходимости |

## Проблема SSR с useLayoutEffect

`useLayoutEffect` не выполняется на сервере (SSR/Next.js), что вызывает предупреждение:

```
Warning: useLayoutEffect does nothing on the server because its effect
cannot be encoded into the server renderer's output format.
```

### Решение 1: Условное использование

```typescript
import { useEffect, useLayoutEffect } from 'react';

// Используй useLayoutEffect только в браузере
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Применение
function Component() {
  useIsomorphicLayoutEffect(() => {
    // Безопасно для SSR
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
}
```

### Решение 2: Проверка клиентской среды

```tsx
function ClientOnlyComponent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
}
```

## Порядок выполнения при вложенных компонентах

```jsx
// Порядок useLayoutEffect при вложенности:
function Parent() {
  useLayoutEffect(() => {
    console.log('Parent useLayoutEffect');
  });
  return <Child />;
}

function Child() {
  useLayoutEffect(() => {
    console.log('Child useLayoutEffect');
  });
  return <div />;
}

// Вывод:
// Child useLayoutEffect  ← дочерние выполняются первыми!
// Parent useLayoutEffect

// То же самое для useEffect:
// Child useEffect
// Parent useEffect
```

## Практический пример: сравнение поведения

```jsx
function FlashingTooltip() {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // ❌ useEffect: пользователь увидит мигание
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // Tooltip сначала рендерится в (0,0), потом прыгает
      setPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  return <div ref={ref} style={position}>Tooltip</div>;
}

function StableTooltip() {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // ✅ useLayoutEffect: позиция установлена до отрисовки
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  return <div ref={ref} style={position}>Tooltip</div>;
}
```

## Правило выбора

```
Нужно измерить DOM или изменить его до того,
как пользователь увидит результат?
          │
    ДА ───┤──── useLayoutEffect
          │
    НЕТ ──┤──── useEffect (по умолчанию)
```

**Используй `useEffect` в 95% случаев.** `useLayoutEffect` — специализированный инструмент для конкретных задач с DOM-измерениями и синхронными обновлениями.

## Резюме

- **`useEffect`** — стандартный хук для побочных эффектов. Запускается асинхронно после отрисовки. Используй по умолчанию.
- **`useLayoutEffect`** — синхронный хук, запускается до отрисовки. Используй только для DOM-измерений и предотвращения мигания интерфейса.
- На сервере (SSR) используй `useIsomorphicLayoutEffect` вместо `useLayoutEffect`.

## Дополнительные ресурсы

- [useEffect — React Docs](https://react.dev/reference/react/useEffect)
- [useLayoutEffect — React Docs](https://react.dev/reference/react/useLayoutEffect)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
