---
metaTitle: "Stale Closures в React хуках — как избежать ошибок"
metaDescription: "Разбираем проблему устаревших замыканий в React хуках useEffect, useCallback и useRef. Причины, примеры и способы решения на практике."
author: "Антон Ларичев"
title: "React Stale Closures — устаревшие замыкания в хуках"
preview: "Что такое устаревшие замыкания в React, почему они возникают в хуках и как их диагностировать и устранять."
---

## Что такое устаревшие замыкания

Замыкание в JavaScript — это функция, которая «захватывает» переменные из своей области видимости на момент создания. Проблема устаревшего замыкания (stale closure) возникает, когда функция продолжает ссылаться на старое значение переменной, хотя в компоненте оно уже обновилось.

В React это особенно заметно в хуках: `useEffect`, `useCallback`, `useMemo`, а также при использовании `setTimeout` и `setInterval` внутри компонентов.

Понять проблему помогает базовый пример без React:

```javascript
function createCounter() {
  let count = 0;

  return {
    increment() {
      count++;
    },
    printLater() {
      setTimeout(() => {
        // Эта функция захватила count на момент создания
        console.log(count);
      }, 1000);
    },
  };
}

const counter = createCounter();
counter.printLater(); // запланировали вывод
counter.increment();  // изменили count
counter.increment();
// через 1 секунду выведет 2 — здесь всё правильно,
// потому что count — примитив, переданный по ссылке через объект
```

Но в React каждый рендер создаёт **новые** переменные. Замыкание, созданное во время одного рендера, навсегда «запоминает» значения именно того рендера.

## Как stale closure проявляется в useEffect

Рассмотрим классический пример — счётчик с автоинкрементом:

```typescript
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Эта функция была создана при первом рендере.
      // Она захватила count === 0 и никогда его не обновит.
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []); // пустой массив зависимостей — эффект запускается один раз

  return <div>{count}</div>;
}
```

Компонент будет показывать 1 и остановится. `setInterval` каждую секунду вызывает `setCount(0 + 1)`, потому что `count` в замыкании навсегда равен `0`.

Это и есть stale closure: коллбэк внутри `setInterval` устарел — он работает со значением из прошлого рендера.

## Три способа решить проблему

### 1. Добавить зависимости в массив

Самый очевидный способ — указать `count` как зависимость, чтобы эффект пересоздавался при каждом изменении:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [count]); // пересоздаём интервал при каждом изменении count
```

Теперь при каждом обновлении `count` React очищает старый интервал и создаёт новый. Это работает, но не оптимально: интервал постоянно пересоздаётся.

### 2. Использовать функциональное обновление состояния

Для счётчиков и любых обновлений «на основе предыдущего значения» лучше передавать в сеттер функцию. React передаст ей актуальное значение состояния, и замыкание на старые данные не нужно:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // React передаёт актуальный prevCount — замыкание не нужно
    setCount(prevCount => prevCount + 1);
  }, 1000);

  return () => clearInterval(interval);
}, []); // зависимостей нет, интервал создаётся один раз
```

Это идиоматичное решение для данного случая. Функциональная форма сеттера всегда получает свежее значение состояния независимо от замыканий.

### 3. Использовать useRef для мутабельных значений

Если нужен доступ к актуальному значению внутри длительного коллбэка (не только для обновления состояния), используют `useRef`:

```typescript
import { useState, useEffect, useRef } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // Синхронизируем ref с актуальным значением при каждом рендере
  countRef.current = count;

  useEffect(() => {
    const interval = setInterval(() => {
      // countRef.current всегда актуален, потому что ref мутабелен
      console.log('Текущее значение:', countRef.current);
      setCount(countRef.current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>{count}</div>;
}
```

Реф не вызывает перерендер при изменении, поэтому его можно читать внутри любого замыкания и всегда получать свежее значение.

## Stale closure в useCallback

Проблема не ограничивается `useEffect`. В `useCallback` она встречается так же часто:

```typescript
import { useState, useCallback } from 'react';

function SearchForm() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Проблема: handleSearch захватит query === '' при первом рендере
  // и никогда не обновится, если query не указан в зависимостях
  const handleSearch = useCallback(() => {
    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(setResults);
  }, []); // пустой массив — query всегда будет пустой строкой

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Найти</button>
    </div>
  );
}
```

Правильное решение — добавить `query` в зависимости:

```typescript
const handleSearch = useCallback(() => {
  fetch(`/api/search?q=${query}`)
    .then(res => res.json())
    .then(setResults);
}, [query]); // теперь функция пересоздаётся при изменении query
```

Или передавать `query` аргументом и убрать зависимость:

```typescript
const handleSearch = useCallback((searchQuery: string) => {
  fetch(`/api/search?q=${searchQuery}`)
    .then(res => res.json())
    .then(setResults);
}, []); // зависимостей нет, функция стабильна

// При вызове передаём актуальное значение
<button onClick={() => handleSearch(query)}>Найти</button>
```

## Паттерн useEvent (useEffectEvent)

В React 19 появился хук `useEffectEvent` (ранее он обсуждался под названием `useEvent`), который решает частый конфликт: нужна стабильная функция для `useCallback`/`useEffect`, но внутри неё нужен доступ к актуальным значениям.

```typescript
import { useState, useEffect, experimental_useEffectEvent as useEffectEvent } from 'react';

function Chat({ roomId, theme }: { roomId: string; theme: string }) {
  const onMessage = useEffectEvent((message: string) => {
    // theme всегда актуален, но функция стабильна
    showNotification(message, theme);
  });

  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onMessage);
    return () => connection.disconnect();
  }, [roomId]); // onMessage не нужно указывать в зависимостях
}
```

`useEffectEvent` создаёт функцию, которая всегда читает актуальные значения, но сама при этом считается нереактивной — React не требует включать её в массив зависимостей.

## Диагностика с eslint-plugin-react-hooks

Вручную отслеживать устаревшие замыкания сложно. Плагин `eslint-plugin-react-hooks` с правилом `exhaustive-deps` автоматически предупреждает о недостающих зависимостях.

Установка:

```bash
npm install --save-dev eslint-plugin-react-hooks
```

Конфигурация `.eslintrc.json`:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Плагин подсветит каждый случай, когда в массиве зависимостей пропущена переменная, используемая внутри хука. Не стоит отключать это правило без понимания — оно обнаруживает реальные баги.

## Реальный пример: дебаунс с устаревшим значением

Рассмотрим компонент поиска с дебаунсом. Это частый источник stale closure:

```typescript
import { useState, useEffect, useRef } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    // Проблема: query в замыкании устареет, если не указать его в зависимостях
    const timer = setTimeout(() => {
      if (query.length > 2) {
        fetch(`/api/search?q=${query}`)
          .then(res => res.json())
          .then(setResults);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]); // query указан — замыкание всегда свежее

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      <ul>
        {results.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

Здесь всё правильно: `query` указан в зависимостях. При каждом изменении ввода эффект перезапускается — старый таймер очищается, новый создаётся с актуальным значением `query`.

## Устаревшие замыкания в обработчиках событий

Обработчики событий, добавленные через `addEventListener`, тоже могут захватывать устаревшие значения:

```typescript
import { useState, useEffect } from 'react';

function KeyTracker() {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проблема: keys всегда будет [] из первого рендера
      setKeys([...keys, e.key]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // keys не указан — stale closure

  return <div>Нажатые клавиши: {keys.join(', ')}</div>;
}
```

Решение — функциональное обновление, чтобы не зависеть от замыкания:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // prevKeys всегда актуален — зависимость на keys не нужна
    setKeys(prevKeys => [...prevKeys, e.key]);
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Итоговая шпаргалка

Вот сводка подходов к решению проблемы устаревших замыканий:

```typescript
// 1. Добавить все используемые значения в зависимости
useEffect(() => {
  doSomething(value);
}, [value]);

// 2. Функциональное обновление — когда новое состояние зависит от предыдущего
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);

// 3. useRef — для мутабельного доступа к актуальному значению
const valueRef = useRef(value);
valueRef.current = value; // обновляем при каждом рендере
// ... внутри коллбэка читаем valueRef.current

// 4. Передавать значение аргументом, а не брать из замыкания
const handleSearch = useCallback((q: string) => {
  fetch(`/api?q=${q}`);
}, []);

// 5. useEffectEvent (React 19) — стабильная функция с актуальными значениями
const onEvent = useEffectEvent(() => {
  use(value); // value всегда свежий
});
```

## Ключевые правила

Первое правило: никогда не игнорируйте предупреждения `exhaustive-deps`. Если правило требует добавить зависимость, это сигнал реальной проблемы, а не придирка линтера. Если добавление зависимости ломает логику — это значит, что логика требует пересмотра.

Второе правило: для вычислений «новое значение на основе старого» всегда используйте функциональную форму сеттера. Это устраняет целый класс stale closure без необходимости добавлять зависимости.

Третье правило: `useRef` — это не обходной путь, а легитимный инструмент для значений, которые должны быть доступны в замыканиях, но не вызывать перерендер при изменении.

Понимание того, как React создаёт новые значения при каждом рендере и как JavaScript захватывает переменные в замыканиях, — основа для написания корректных хуков без трудноуловимых багов.

Освоить хуки и работу с состоянием глубже можно на курсе по React — [React — с нуля до профессионала](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-stale-closures).