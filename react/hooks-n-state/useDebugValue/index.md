---
metaTitle: "useDebugValue в React — отладка кастомных хуков в DevTools"
metaDescription: "Разбираемся с хуком useDebugValue в React: как добавить метки к кастомным хукам в React DevTools, использовать форматтер и ленивое вычисление. Практические примеры на TypeScript."
author: Олег Марков
title: useDebugValue — отладка кастомных хуков
preview: Хук useDebugValue позволяет добавлять читаемые метки к кастомным хукам в React DevTools. В этой статье разберём синтаксис, форматтер, ленивое вычисление и реальные сценарии использования.
---

## Введение

При разработке сложных React-приложений кастомные хуки становятся основным инструментом переиспользования логики. Но когда что-то идёт не так, отладка таких хуков в React DevTools может превратиться в испытание: вы видите только набор непонятных значений без контекста.

Именно для этого существует `useDebugValue` — хук, который позволяет добавить читаемую метку к любому кастомному хуку прямо в панели React DevTools.

Вы можете узнать о React хуках подробнее в [нашем курсе по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useDebugValue).

## Что такое useDebugValue и зачем он нужен

`useDebugValue` — это хук React, предназначенный исключительно для инструментов разработчика. Он не влияет на логику и производительность приложения в продакшне, но делает отладку кастомных хуков значительно удобнее.

### Проблема без useDebugValue

Представьте, что у вас есть кастомный хук `useAuth`, который возвращает состояние аутентификации. В React DevTools без дополнительной разметки вы увидите просто:

```
useAuth
  user: {id: 1, name: "Алексей", ...}
  isLoading: false
  isAuthenticated: true
```

Если у вас несколько экземпляров такого хука в разных компонентах, или хук используется в сложной иерархии, понять что именно происходит — непросто.

С `useDebugValue` вы можете добавить информативную метку:

```
useAuth
  DebugValue: "Алексей | авторизован"
  user: {id: 1, name: "Алексей", ...}
  isLoading: false
  isAuthenticated: true
```

Теперь состояние хука читается с первого взгляда.

## Синтаксис useDebugValue

```tsx
useDebugValue(value, formatFn?)
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `value` | `any` | Значение для отображения в React DevTools |
| `formatFn` | `(value: T) => string` (необязательно) | Функция-форматтер для преобразования значения в строку |

`useDebugValue` не возвращает никакого значения — он только добавляет метку в DevTools.

## Базовый пример использования

Вот самый простой пример — добавляем метку к хуку онлайн-статуса:

```tsx
import { useState, useEffect, useDebugValue } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Добавляем метку — в DevTools отобразится "Online" или "Offline"
  useDebugValue(isOnline ? 'Online' : 'Offline');

  return isOnline;
}
```

Теперь в React DevTools рядом с `useOnlineStatus` вы увидите либо `"Online"`, либо `"Offline"` — прямо в дереве компонентов.

## Использование форматтера

Второй аргумент `useDebugValue` — необязательная функция-форматтер. Она принимает значение и возвращает строку для отображения.

```tsx
import { useState, useDebugValue } from 'react';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);

  // Форматтер преобразует объект User в читаемую строку
  useDebugValue(user, (u) =>
    u ? `${u.name} (${u.role})` : 'Гость'
  );

  return { user, setUser };
}
```

В DevTools вы увидите `"Алексей (admin)"` вместо сырого объекта `User`.

## Ленивое вычисление (lazy formatting)

Ключевое преимущество форматтера — **ленивое вычисление**. Функция-форматтер вызывается **только тогда**, когда компонент инспектируется в DevTools, а не при каждом рендере.

Это критично, если формирование метки требует дорогостоящих вычислений:

```tsx
import { useMemo, useDebugValue } from 'react';

function useFilteredItems<T>(
  items: T[],
  predicate: (item: T) => boolean
) {
  const filtered = useMemo(
    () => items.filter(predicate),
    [items, predicate]
  );

  // Форматтер вызывается лениво — только при открытии DevTools
  useDebugValue(filtered, (arr) => {
    // Дорогостоящая операция — JSON-сериализация большого массива
    const preview = arr.slice(0, 3).map(String).join(', ');
    return `${arr.length} элементов: [${preview}${arr.length > 3 ? '...' : ''}]`;
  });

  return filtered;
}
```

Без форматтера вы должны были бы вычислять строку при каждом рендере. С форматтером — только при инспекции.

## Практический пример: хук аутентификации

Рассмотрим реальный сценарий — хук управления сессией пользователя:

```tsx
import { useState, useEffect, useCallback, useDebugValue } from 'react';

interface AuthState {
  userId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    if (token && userId) {
      setState({
        userId,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback((userId: string, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', userId);
    setState({ userId, token, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    setState({ userId: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  // Информативная метка для DevTools
  useDebugValue(state, (s) => {
    if (s.isLoading) return '⏳ Загрузка...';
    if (s.isAuthenticated) return `✅ userId: ${s.userId}`;
    return '❌ Не авторизован';
  });

  return { ...state, login, logout };
}
```

Теперь в DevTools для любого компонента, использующего `useAuth`, вы сразу видите текущее состояние сессии без необходимости раскрывать все поля.

## Практический пример: хук работы с localStorage

```tsx
import { useState, useEffect, useDebugValue } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Ошибка записи в localStorage[${key}]:`, error);
    }
  };

  // Показываем ключ и тип значения в DevTools
  useDebugValue({ key, storedValue }, ({ key, storedValue }) =>
    `localStorage["${key}"] = ${JSON.stringify(storedValue)}`
  );

  return [storedValue, setValue] as const;
}
```

## Использование с TypeScript

`useDebugValue` полностью типизирован. TypeScript автоматически выводит тип первого аргумента и проверяет совместимость форматтера:

```tsx
import { useDebugValue } from 'react';

// Тип value выводится автоматически
function useTypedDebug() {
  const status: 'idle' | 'loading' | 'success' | 'error' = 'loading';

  // TypeScript проверяет: форматтер должен принимать тот же тип
  useDebugValue(status, (s: 'idle' | 'loading' | 'success' | 'error') => {
    const icons = { idle: '⏸', loading: '⏳', success: '✅', error: '❌' };
    return `${icons[s]} ${s}`;
  });
}

// Явное указание типа через дженерик (обычно не нужно)
function useExplicitType<T extends { name: string }>(value: T) {
  useDebugValue<T>(value, (v) => v.name);
}
```

## Распространённые ошибки

### Использование useDebugValue вне кастомного хука

`useDebugValue` имеет смысл только внутри кастомных хуков. Использовать его в компонентах — технически допустимо, но бессмысленно:

```tsx
// ❌ Неправильно — в компоненте useDebugValue бесполезен
function MyComponent() {
  const [count, setCount] = useState(0);
  useDebugValue(count); // метка не привязана к хуку
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ Правильно — внутри кастомного хука
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  useDebugValue(count, (c) => `Счётчик: ${c}`);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}
```

### Дорогие вычисления без форматтера

Если формирование метки требует значительных ресурсов, не передавайте готовую строку — используйте форматтер:

```tsx
// ❌ Неправильно — сериализация выполняется при каждом рендере
function useHeavyData(data: Record<string, unknown>[]) {
  useDebugValue(JSON.stringify(data)); // вызывается при каждом рендере!
  return data;
}

// ✅ Правильно — форматтер вызывается только при инспекции в DevTools
function useHeavyData(data: Record<string, unknown>[]) {
  useDebugValue(data, (d) => JSON.stringify(d)); // лениво!
  return data;
}
```

### Отображение лишних деталей

Метка в DevTools должна давать быстрый ответ на вопрос "что здесь происходит". Не перегружайте её:

```tsx
// ❌ Слишком много информации в метке
function useUser(userId: string) {
  const [user] = useState({ id: userId, name: 'Алексей', email: 'alex@example.com', role: 'admin', createdAt: '2024-01-01' });
  useDebugValue(user, (u) => JSON.stringify(u)); // весь объект — лишнее
  return user;
}

// ✅ Только ключевая информация
function useUser(userId: string) {
  const [user] = useState({ id: userId, name: 'Алексей', email: 'alex@example.com', role: 'admin', createdAt: '2024-01-01' });
  useDebugValue(user, (u) => `${u.name} | ${u.role}`); // коротко и ясно
  return user;
}
```

## Когда использовать useDebugValue

| Сценарий | Рекомендация |
|----------|-------------|
| Кастомный хук используется в нескольких компонентах | ✅ Добавить метку для быстрой идентификации |
| Хук имеет сложное внутреннее состояние | ✅ Добавить форматтер для читаемого отображения |
| Хук находится в публичной библиотеке | ✅ Обязательно — для удобства пользователей библиотеки |
| Простой хук с одним состоянием | ⚠️ Опционально — только если повышает читаемость |
| Любой компонент (не хук) | ❌ Не использовать |
| Продакшн-код с тяжёлыми вычислениями метки | ✅ Использовать форматтер для ленивого вычисления |

## Заключение

`useDebugValue` — небольшой, но полезный инструмент в арсенале React-разработчика. Он не влияет на логику приложения, но значительно упрощает отладку кастомных хуков в React DevTools. Особенно это ценно при разработке библиотек хуков или при работе с комплексной логикой состояния.

Главные выводы:
- Используйте `useDebugValue` только внутри кастомных хуков
- Форматтер вызывается лениво — применяйте его для дорогих вычислений
- Метка должна быть краткой и информативной
- В продакшне хук работает без каких-либо накладных расходов

Хотите углубиться в разработку на React и освоить все хуки на практике? Записывайтесь на [курс по React от PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useDebugValue).

## Частозадаваемые технические вопросы

### Влияет ли useDebugValue на производительность в продакшне?

Нет. React DevTools не подключены в продакшн-сборке, поэтому `useDebugValue` полностью игнорируется. Накладных расходов нет. Форматтер также не вызывается — только в режиме разработки при открытых DevTools.

### Можно ли использовать несколько useDebugValue в одном хуке?

Да, вы можете вызвать `useDebugValue` несколько раз. Каждый вызов добавляет отдельную метку. Однако обычно достаточно одной информативной метки.

```tsx
function useComplexHook() {
  const [status, setStatus] = useState('idle');
  const [count, setCount] = useState(0);

  useDebugValue(status, (s) => `Статус: ${s}`);
  useDebugValue(count, (c) => `Счётчик: ${c}`);
}
```

### В чём разница между useDebugValue и console.log для отладки?

`console.log` засоряет консоль и вызывается при каждом рендере. `useDebugValue` показывает информацию только в React DevTools при инспекции компонента, не оставляет следов в консоли и работает с ленивым вычислением. Это более чистый и управляемый подход к отладке хуков.

### Работает ли useDebugValue в React Native?

Да, `useDebugValue` поддерживается в React Native. React DevTools для React Native работает так же, как для веб-приложений, и метки отображаются в инспекторе компонентов.

### Нужно ли удалять useDebugValue перед деплоем?

Нет, удалять не нужно. В продакшн-сборке он не вызывается и не влияет на производительность. Оставьте его в коде — это хорошая практика, которая поможет вам и вашей команде при дальнейшей поддержке кода.
