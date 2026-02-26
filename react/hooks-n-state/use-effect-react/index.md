---
metaTitle: useEffect в React что это и как использовать
metaDescription: Узнайте что такое useEffect в React - как работают побочные эффекты, синтаксис хука, массив зависимостей, очистка эффектов и типичные паттерны использования
author: Олег Марков
title: useEffect в React что это и как использовать
preview: В этой статье подробно разбирается что такое useEffect в React, как управлять побочными эффектами, работать с зависимостями и правильно очищать эффекты для создания надёжных компонентов
---

## Введение

Функциональные компоненты React — это по сути чистые функции: принимают props и возвращают JSX. Но в реальных приложениях компоненты нередко должны выполнять действия, выходящие за рамки простого рендеринга: делать запросы к API, подписываться на события, работать с таймерами, вручную изменять DOM. Всё это называется **побочными эффектами** (side effects).

Именно для управления побочными эффектами в функциональных компонентах предназначен хук `useEffect`. Он позволяет синхронизировать компонент с внешними системами и выполнять операции после каждого рендера или только при изменении определённых значений.

В этой статье я подробно объясню, что такое `useEffect`, как он работает, как правильно управлять зависимостями и очищать эффекты. Если вы хотите глубже изучить хуки React и научиться правильно управлять состоянием — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=chto-takoe-useeffect-v-react). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Что такое useEffect и зачем он нужен

`useEffect` — это React Hook, позволяющий выполнять побочные эффекты в функциональных компонентах. Под «побочным эффектом» понимается любая операция, которая взаимодействует с чем-то за пределами функции рендеринга: сервером, браузерным API, подписками и т.д.

До появления хуков такие операции выполнялись в методах жизненного цикла классовых компонентов: `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`. `useEffect` объединяет все три в один универсальный инструмент.

**Типичные задачи для useEffect:**
- Загрузка данных с сервера (fetch, axios)
- Подписка на события (WebSocket, EventEmitter, DOM-события)
- Работа с таймерами и интервалами
- Ручное управление DOM (например, фокус на элементе)
- Интеграция со сторонними библиотеками

## Синтаксис useEffect

Базовый синтаксис хука выглядит так:

```jsx
import { useEffect } from 'react';

useEffect(() => {
  // Код эффекта — выполняется после рендера
}, [зависимости]);
```

Хук принимает два аргумента:
1. **Функция эффекта** — код, который нужно выполнить
2. **Массив зависимостей** (необязательный) — значения, при изменении которых эффект перезапускается

## Варианты поведения useEffect

### Эффект без массива зависимостей

Если не передать второй аргумент, эффект будет выполняться **после каждого рендера** компонента:

```jsx
import { useState, useEffect } from 'react';

function Logger() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Выполняется после каждого рендера
    console.log('Компонент перерисован, count:', count);
  });

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Нажато: {count}
    </button>
  );
}
```

Такой вариант используется редко — обычно он приводит к лишним операциям.

### Эффект с пустым массивом зависимостей

Если передать пустой массив `[]`, эффект выполнится **один раз после первого рендера** (аналог `componentDidMount`):

```jsx
import { useState, useEffect } from 'react';

function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Выполняется один раз при монтировании компонента
    fetch('/api/user/1')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []); // Пустой массив — эффект запускается только при монтировании

  if (!user) return <p>Загрузка...</p>;
  return <h1>Привет, {user.name}!</h1>;
}
```

### Эффект с зависимостями

Если передать значения в массив зависимостей, эффект будет выполняться **при первом рендере и каждый раз, когда изменится хотя бы одна зависимость**:

```jsx
import { useState, useEffect } from 'react';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Перезапускается каждый раз, когда меняется query
    if (!query) return;

    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(data => setResults(data));
  }, [query]); // Зависимость — query

  return (
    <ul>
      {results.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

Здесь при каждом изменении пропса `query` будет выполняться новый запрос к API.

## Очистка эффектов

Некоторые эффекты требуют «уборки за собой» — отмены подписок, очистки таймеров, отмены запросов. Для этого функция эффекта может **возвращать функцию очистки**:

```jsx
useEffect(() => {
  // Устанавливаем подписку или таймер
  const timerId = setInterval(() => {
    console.log('Тик');
  }, 1000);

  // Возвращаем функцию очистки
  return () => {
    clearInterval(timerId); // Очищаем таймер при размонтировании
  };
}, []);
```

Функция очистки вызывается:
- **Перед каждым следующим запуском эффекта** (если у него есть зависимости)
- **При размонтировании компонента** (аналог `componentWillUnmount`)

### Пример с подпиской на WebSocket

```jsx
import { useState, useEffect } from 'react';

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Подключаемся к комнате
    const socket = new WebSocket(`wss://chat.example.com/room/${roomId}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    // Возвращаем функцию очистки — отключаемся при смене комнаты
    return () => {
      socket.close();
    };
  }, [roomId]); // Переподключаемся при смене roomId

  return (
    <div>
      {messages.map((msg, i) => (
        <p key={i}>{msg.text}</p>
      ))}
    </div>
  );
}
```

При смене `roomId` React сначала вызовет очистку (закроет старый WebSocket), а затем запустит эффект заново (откроет новый).

## Практические паттерны использования

### Загрузка данных с обработкой состояния загрузки

```jsx
import { useState, useEffect } from 'react';

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch('https://jsonplaceholder.typicode.com/posts')
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Загрузка постов...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Отмена запроса с помощью AbortController

Важная проблема при загрузке данных — гонка запросов (race condition). Если пользователь быстро меняет параметры, старые запросы могут вернуть результат позже новых. `AbortController` помогает отменять устаревшие запросы:

```jsx
import { useState, useEffect } from 'react';

function UserCard({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch(`/api/users/${userId}`, { signal: abortController.signal })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => {
        // Игнорируем ошибку отмены запроса
        if (err.name === 'AbortError') return;
        console.error('Ошибка загрузки:', err);
      });

    // Отменяем запрос при смене userId или размонтировании
    return () => {
      abortController.abort();
    };
  }, [userId]);

  if (!user) return <p>Загрузка...</p>;
  return <div>{user.name}</div>;
}
```

### Подписка на DOM-события

```jsx
import { useEffect } from 'react';

function KeyboardLogger() {
  useEffect(() => {
    function handleKeyDown(event) {
      console.log('Нажата клавиша:', event.key);
    }

    // Подписываемся на событие
    window.addEventListener('keydown', handleKeyDown);

    // Отписываемся при размонтировании
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Пустой массив — подписываемся один раз

  return <p>Нажмите любую клавишу</p>;
}
```

### Синхронизация заголовка страницы

```jsx
import { useEffect } from 'react';

function PageTitle({ title }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    // Восстанавливаем исходный заголовок при размонтировании
    return () => {
      document.title = prevTitle;
    };
  }, [title]); // Обновляем при каждом изменении title

  return null;
}
```

## Правила использования useEffect

### Правила хуков

Как и все хуки, `useEffect` подчиняется общим правилам:

1. **Вызывайте только на верхнем уровне** — не внутри условий, циклов или вложенных функций
2. **Вызывайте только из функциональных компонентов или кастомных хуков**

```jsx
// ПРАВИЛЬНО:
function MyComponent() {
  useEffect(() => {
    // ...
  }, []);
}

// НЕПРАВИЛЬНО — хук внутри условия:
function MyComponent({ show }) {
  if (show) {
    useEffect(() => { // Ошибка!
      // ...
    }, []);
  }
}
```

### Честный массив зависимостей

Включайте в массив зависимостей **все значения**, которые используете внутри эффекта. Иначе эффект будет работать с устаревшими значениями:

```jsx
// ПЛОХО — userId используется, но не указан в зависимостях:
useEffect(() => {
  fetchUser(userId); // userId может быть устаревшим!
}, []);

// ПРАВИЛЬНО:
useEffect(() => {
  fetchUser(userId);
}, [userId]); // userId указан — эффект перезапустится при его изменении
```

## Распространённые ошибки

### Бесконечный цикл

Самая частая ошибка — изменение состояния внутри эффекта без правильных зависимостей:

```jsx
// ПЛОХО — бесконечный цикл!
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1); // Изменяем count...
}, [count]); // ...что вызывает повторный запуск эффекта!

// ПРАВИЛЬНО — используем функциональное обновление:
useEffect(() => {
  setCount(c => c + 1); // Не зависит от count
}, []); // Пустой массив — запускается один раз
```

### Объект или массив в зависимостях

Объекты и массивы сравниваются по ссылке, а не по значению. Если создавать новый объект при каждом рендере, эффект будет бесконечно перезапускаться:

```jsx
// ПЛОХО — options создаётся заново при каждом рендере:
function MyComponent() {
  const options = { method: 'GET' }; // Новый объект каждый раз!

  useEffect(() => {
    fetchData(options);
  }, [options]); // Ссылка на options всегда новая!
}

// ПРАВИЛЬНО — выносим объект за пределы компонента или используем useMemo:
const OPTIONS = { method: 'GET' }; // Создаётся один раз

function MyComponent() {
  useEffect(() => {
    fetchData(OPTIONS);
  }, []); // Не зависит от переменной, которая меняется
}
```

## useEffect vs useLayoutEffect

Существует похожий хук `useLayoutEffect`. Разница в том, **когда** они выполняются:

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Когда выполняется | После отрисовки браузером | После обновления DOM, до отрисовки |
| Блокирует ли отрисовку | Нет | Да |
| Когда использовать | Большинство случаев | Измерение DOM, предотвращение мерцания |

В большинстве случаев используйте `useEffect`. `useLayoutEffect` нужен только если вам необходимо измерить размеры элементов или синхронно изменить DOM до того, как браузер отрисует изменения.

## Заключение

`useEffect` — один из ключевых хуков React, без которого невозможно представить современное приложение. Он позволяет:
- Выполнять запросы к API и загружать данные
- Подписываться на события и внешние источники данных
- Синхронизировать компонент с браузерными API
- Корректно освобождать ресурсы при размонтировании

Главное правило — **честно указывайте все зависимости** и **всегда очищайте эффекты**, которые создают подписки или таймеры. Это поможет избежать утечек памяти и неожиданного поведения.

Для создания сложных приложений с правильным управлением состоянием и эффектами рекомендуем наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=chto-takoe-useeffect-v-react). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в основы React уже сегодня.

## Частозадаваемые технические вопросы по теме useEffect

### Как выполнить код только при размонтировании компонента?

Используйте пустой массив зависимостей и верните функцию очистки:

```jsx
useEffect(() => {
  return () => {
    // Этот код выполнится только при размонтировании
    console.log('Компонент удалён из DOM');
  };
}, []);
```

### Почему useEffect запускается дважды в режиме разработки?

В React 18 в режиме разработки со Strict Mode React намеренно монтирует, размонтирует и снова монтирует компонент, чтобы выявить проблемы с очисткой эффектов. В production-сборке этого не происходит. Если видите двойной запуск — убедитесь, что ваша функция очистки корректно работает.

### Можно ли использовать async/await внутри useEffect?

Напрямую нельзя, так как функция эффекта должна возвращать либо функцию очистки, либо ничего. Используйте внутреннюю async-функцию:

```jsx
useEffect(() => {
  async function loadData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  }

  loadData();
}, []);
```

### Как предотвратить запрос при первом рендере?

Используйте `useRef` для отслеживания первого рендера:

```jsx
import { useEffect, useRef } from 'react';

function Component({ value }) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Пропускаем первый рендер
    }

    // Этот код выполнится только при изменении value (не при монтировании)
    console.log('value изменился:', value);
  }, [value]);
}
```

### Что делать, если зависимости постоянно меняются и вызывают бесконечный цикл?

Если зависимость — объект или функция, используйте `useMemo` и `useCallback` для их мемоизации:

```jsx
import { useEffect, useCallback } from 'react';

function Component({ id }) {
  const fetchUser = useCallback(() => {
    return fetch(`/api/users/${id}`).then(r => r.json());
  }, [id]); // fetchUser пересоздаётся только при изменении id

  useEffect(() => {
    fetchUser().then(setUser);
  }, [fetchUser]); // Безопасно — fetchUser стабилен
}
```
