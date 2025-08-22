---
metaTitle: Использование API в React-приложениях
metaDescription: Полное руководство по использованию API в React-приложениях - методы получения, обработки и отображения данных, примеры с fetch и axios, работа с ошибками и оптимизация запросов
author: Олег Марков
title: Использование API в React-приложениях
preview: Разбираем как правильно использовать API в React - строим запросы, обрабатываем ответы, храним и отображаем данные с учетом всех современных практик
---

## Введение

Работа с внешними API — неотъемлемая часть большинства современных React-приложений. Благодаря API вы получаете данные с серверов, публикуете новые записи, обрабатываете события пользователей. Смотрите, я расскажу вам, как правильно интегрировать запросы к API в React-проекты, чтобы получить надежное, отзывчивое и эффективное приложение.

Вы узнаете, как реализовать сетевые запросы при помощи стандартного fetch, сторонних библиотек типа axios, научитесь обрабатывать ошибки и контролировать состояние загрузки данных. Я покажу, как удобно хранить данные в состоянии компонента или приложения, расскажу о подходах к размещению логики работы с API. В статье рассмотрю продвинутые паттерны: кеширование, отмену запросов, обработку авторизации. Любую теоретическую часть я обязательно подкреплю примерами — вы увидите, как всё реализуется на практике.

## Что такое API и зачем он нужен в React

Перед тем как перейти к примерам, давайте уточним основные моменты. API (Application Programming Interface) — это способ обмена данными между клиентом (вашим приложением на React) и сервером (например, сервером базы данных). Обычно используется REST API или GraphQL. Вся современная frontend-разработка построена вокруг получения, изменения и удаления данных на сервере.

С React любые сторонние данные (списки товаров, профили пользователей, содержимое постов или комментариев) почти всегда загружаются через API. Правильная интеграция этих запросов — залог стабильности и удобства приложения.

## Организация запросов к API в React

### Где размещать запросы к API

В React запросы размещаются:

- **Внутри useEffect** — для запросов, происходящих при монтировании компонента.
- **В обработчиках событий** — когда пользователь что-то делает (например, оставляет комментарий).
- **В специализированных хуках** — reusable-логика для переиспользования.
- **В context/provider** — для глобального хранение и рассылки данных.

Простой пример: загрузка списка задач при открытии компонента.

```jsx
import React, { useState, useEffect } from "react";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Запрос к API при первом рендере компонента
    fetch("https://jsonplaceholder.typicode.com/todos")
      .then((response) => response.json()) // Преобразуем ответ в JSON
      .then((data) => {
        setTodos(data); // Сохраняем полученные данные
        setLoading(false); // Отключаем индикатор загрузки
      });
  }, []); // Пустой массив зависимостей - вызов только при монтировании

  if (loading) return <div>Загрузка...</div>;

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li> // Выводим названия задач
      ))}
    </ul>
  );
}
```

Обратите внимание, как я вынес запрос в useEffect и сразу обработал состояние загрузки.

### Использование fetch

Метод fetch — стандартный способ отправки HTTP-запросов из браузера.

```jsx
fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST", // Указываем метод запроса
  headers: { "Content-Type": "application/json" }, // Заголовки
  body: JSON.stringify({
    title: "Post title",
    body: "Post body",
    userId: 1
  }) // Данные запроса приводим к строке
})
  .then((res) => res.json()) // Обрабатываем ответ
  .then((data) => {
    // Используем полученные данные
    console.log(data);
  });
```

Тем не менее, fetch не покрывает автоматическую обработку ошибок и отмену запросов. Поэтому многие выбирают альтернативы.

### Использование axios

Библиотека axios — один из самых популярных инструментов для запросов к API в React.

- По умолчанию обрабатывает JSON.
- Удобнее настраивать заголовки, interceptor'ы, отмену запросов.

```jsx
import axios from "axios";

axios
  .get("https://jsonplaceholder.typicode.com/todos/1")
  .then((response) => {
    // response.data — нужные вам данные
    console.log(response.data);
  })
  .catch((error) => {
    // Ловим ошибки
    console.error("Ошибка при загрузке данных:" , error);
  });
```

Теперь давайте рассмотрим, как можно интегрировать axios в React-компонент:

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function UserData() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // асинхронная функция запроса
    async function fetchData() {
      try {
        const res = await axios.get("https://jsonplaceholder.typicode.com/users/2");
        setUser(res.data); // Сохраняем пользователя в состояние
      } catch (err) {
        console.error(err);
      }
    }
    fetchData(); // Вызываем функцию после первого рендера
  }, []); // Следим только за маунтом

  if (!user) return <span>Загрузка...</span>;

  return (
    <div>
      <h3>Имя: {user.name}</h3>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

Я использовал try/catch, чтобы перехватывать возможные ошибки запроса.

## Обработка ошибок и управление состояниями

### Как обрабатывать ошибки при запросах

Работа с ошибками — критически важна для пользовательского опыта. Проще всего добавить отдельное состояние для ошибки:

```jsx
const [error, setError] = useState(null);
// ...

useEffect(() => {
  fetch(...)
    .then((response) => {
      if (!response.ok) {
        // Если сервер вернул ошибку
        throw new Error("Ошибка сервера");
      }
      return response.json();
    })
    .then(data => setData(data))
    .catch(err => {
      setError(err.message); // Сохраняем текст ошибки
      setLoading(false);
    });
}, []);
```

Теперь отображаем ошибку в компоненте:

```jsx
if (error) return <div>Ошибка: {error}</div>;
```

### Состояние загрузки

Смотрите, я выделил отдельное состояние loading, чтобы вы могли показать индикатор загрузки. Это делается через useState:

```jsx
const [loading, setLoading] = useState(true);
// После успешного получения данных:
setLoading(false);
```

### Управление и хранение данных

Обычно полученные данные с API хранят во внутреннем состоянии компонента (`useState`), иногда — в глобальном состоянии (например, через Redux, Zustand, React Context, Jotai и др.).

Покажу с Context:

```jsx
// создаем контекст
const DataContext = React.createContext();

function DataProvider({ children }) {
  const [data, setData] = useState([]);

  // Функция загрузки
  const fetchData = async () => {
    const res = await fetch(...);
    setData(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <DataContext.Provider value={{ data, fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
// В любом дочернем компоненте:
const { data } = React.useContext(DataContext);
```

Контекст удобен, если вы используете данные в разных компонентах дерева.

## Как делать POST, PUT, DELETE запросы

До этого мы рассматривали только GET-запросы. Смотрите, чтобы создать, обновить или удалить данные, используйте методы запроса POST, PUT (или PATCH), DELETE.

### Пример POST-запроса с fetch

```jsx
fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({ title: "foo", body: "bar", userId: 1 })
})
  .then(response => response.json())
  .then(newPost => {
    // получаем добавленный пост
    console.log(newPost);
  });
```

### Пример PUT-запроса

```jsx
fetch("https://jsonplaceholder.typicode.com/posts/1", {
  method: "PUT",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({ title: "новый заголовок", body: "новый текст" })
})
  .then(res => res.json())
  .then(updatedPost => {
    // получаем обновленную запись
    console.log(updatedPost);
  });
```

### Пример DELETE-запроса

```jsx
fetch("https://jsonplaceholder.typicode.com/posts/1", {
  method: "DELETE"
})
  .then(res => {
    if (res.ok) {
      // запись удалена
      console.log("Запись удалена");
    }
  });
```

Как видите — к свойству `method` просто передается нужный HTTP-метод. Не забывайте о правильных заголовках.

## Хуки для работы с API: useEffect, useCallback, useReducer

### useEffect

Я часто использую useEffect для загрузки данных при монтировании:

```jsx
useEffect(() => {
  fetch("...")
    .then(res => res.json())
    .then(setData);
}, []); // [] — вызов только при маунте
```

### useCallback

Если вы передаете функцию для изменения данных в дочерние компоненты — оборачивайте её в useCallback, чтобы не возникало лишних перерисовок.

```jsx
const addItem = useCallback(
  (item) => {
    // Код для добавления данных (например, POST)
  },
  []  // зависимости, если есть
);
```

### useReducer

Для сложных состояний, например, нескольких вложенных сущностей (данные, ошибки, состояние загрузки) удобно использовать useReducer:

```jsx
const initialState = { data: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "SUCCESS":
      return { ...state, data: action.data, loading: false };
    case "ERROR":
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
// ...
```

Этот подход часто используется вместе с кастомными хуками.

## Кастомные хуки для запросов

Создание собственного хука для запросов позволяет переиспользовать логику и сделать код чище.

### Пример useFetch

Вот простой кастомный хук для GET-запросов:

```jsx
import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [url]); // перезапускаем при смене url

  return { data, loading, error };
}
```

Теперь используйте хук так:

```jsx
const { data, loading, error } = useFetch("https://jsonplaceholder.typicode.com/posts");
```

Можно его расширить и для POST/PUT/DELETE.

## Использование сторонних библиотек для работы с API

### React Query и SWR

Для большинства проектов всё чаще применяют React Query или SWR. Эти библиотеки берут на себя:

- Кеширование данных;
- Повторные запросы при ошибках;
- Инвалидизацию данных;
- Автоматическую синхронизацию с сервером.

### Пример React Query

```jsx
import { useQuery } from "@tanstack/react-query";

function Posts() {
  const { data, isLoading, error } = useQuery(["posts"], () =>
    fetch("https://jsonplaceholder.typicode.com/posts").then((res) => res.json())
  );

  if (isLoading) return <span>Загрузка...</span>;
  if (error) return <span>Ошибка: {error.message}</span>;

  return (
    <ul>
      {data.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

React Query автоматически валидирует, кеширует и рефетчит данные, если они устарели.

### Пример SWR

```jsx
import useSWR from "swr";

const fetcher = (url) => fetch(url).then(res => res.json());

function Profile() {
  const { data, error, isLoading } = useSWR("https://jsonplaceholder.typicode.com/users/3", fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return <div>Имя пользователя: {data.name}</div>;
}
```

SWR и React Query очень помогают и с оптимистичным обновлением данных, и с работой offline. Рассмотрите эти инструменты, если ваше приложение достаточно сложное.

## Продвинутые техники: отмена, задержка, кеширование запросов

### Как отменять запросы

Иногда пользователь быстро покидает компонент, а запрос еще не завершён. Чтобы не обновлять размонтированный компонент, запросы нужно уметь отменять.

Fetch поддерживает AbortController, смотрите, как это работает:

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(e => {
      if (e.name === "AbortError") {
        // Запрос был отменён
      } else {
        setError(e);
      }
    });

  return () => controller.abort(); // отменяем запрос при демонтировании
}, [url]);
```

### Использование кеша

Кеширование позволяет уменьшить количество обращений к серверу.

- React Query/SWR реализуют автоматическое кеширование.
- Можно реализовать мемоизированный кеш вручную внутри кастомного хука.

Вот простой пример кеша:

```jsx
const cache = {};

export function useCachedFetch(url) {
  const [data, setData] = useState(cache[url] || null);

  useEffect(() => {
    if (!cache[url]) {
      fetch(url)
        .then(res => res.json())
        .then(json => {
          cache[url] = json;
          setData(json);
        });
    }
  }, [url]);
  return data;
}
```

### Задержка запросов (debouncing)

Если вы делаете запросы на каждом нажатии клавиши (например, поиск), используйте debouncing, чтобы ограничить частоту запросов.

```jsx
import { useState, useEffect } from "react";

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(handler); // очищаем таймер при новом вводе
  }, [value, delay]);

  return debounced;
}
```

Теперь отправляйте запрос только после задержки.

## Проблемы авторизации и безопасности

Часто API требует авторизации. Обычно используется JWT или session cookie.

### Как передавать токены

- Передавайте accessToken в заголовке Authorization:

```js
fetch("/api/protected", {
  headers: { "Authorization": "Bearer <token>" }
});
```

В случае axios:

```js
axios.get("/api/protected", {
  headers: { "Authorization": `Bearer ${token}` }
});
```

Часто удобнее добавить interceptor, который автоматически подставляет токен.

### Обновление токена (refresh-token flow)

Если accessToken устарел, можно выполнить обновление токена по refreshToken. Здесь логика строится на ловле ошибки 401 и авто-повторном запросе.

## Интеграция API в архитектуру приложения

С ростом проекта полезно отделить логику работы с API в отдельные файлы/модули (`services` или `api`). Это облегчает поддержку и повторное использование.

### Пример структуры

```
/src
  /api
    userApi.js
    postsApi.js
  /components
    Users.js
    Posts.js
```

В файлах userApi.js/ postsApi.js размещайте все функции для работы с определённой сущностью.

```js
// userApi.js
export function fetchUsers() {
  return fetch("/api/users").then(res => res.json());
}
```

В компоненте используйте:

```js
import { fetchUsers } from "../api/userApi";
// ...
useEffect(() => {
  fetchUsers().then(setUsers);
}, []);
```

## Заключение

В React-приложениях интеграция с API — это ключевой навык для современного фронтенд-разработчика. Я показал вам, как реализовать запросы к API с помощью стандартных средств (fetch), библиотеки axios, продвинутых хуков, а также как работать с библиотеками для автоматизации работы с удаленными источниками данных (React Query, SWR). Мы рассмотрели приемы управления состояниями, обработки ошибок, реализации запросов разных типов и хранения данных, техники отмены, кеширования и авторизации.

Подходите к организации общения с внешними API системно: выносите логику в сервисы, пользуйтесь кастомными и сторонними хуками, не забывайте о безопасности и UX. Это упростит поддержку, ускорит разработку и сделает приложение отзывчивым и удобным для пользователей.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как автоматически повторить запрос при ошибке соединения?

Используйте дополнительную функцию-обертку для повторных попыток. Например, с fetch:

```js
async function fetchWithRetry(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Ошибка ответа");
      return await res.json();
    } catch (e) {
      if (i === attempts - 1) throw e; // На последней попытке выбрасываем ошибку
    }
  }
}
```

### Как обрабатывать массив параллельных запросов и ждать их выполнения?

Можно использовать Promise.all:

```js
const urls = ["/api/1", "/api/2"];
Promise.all(urls.map(url => fetch(url).then(r => r.json())))
  .then(results => {
    // results — массив результатов
  });
```

### Можно ли инициировать запрос до маунта компонента?

В React запросы обычно делают внутри useEffect после маунта. Запускать сетевые операции до маунта не рекомендуется, так как компонент еще не существует в DOM и не сможет обновить свое состояние.

### Как обрабатывать загрузку файлов через API?

Используйте FormData:

```js
const formData = new FormData();
formData.append("file", file);

fetch("/api/upload", {
  method: "POST",
  body: formData
});
```

### Как повторно использовать полученные JWT-токены в нескольких запросах?

Рекомендуется хранить токен в памяти (например, в Context или Zustand). Для axios настройте interceptor:

```js
axios.interceptors.request.use(config => {
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});
```