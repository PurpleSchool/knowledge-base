---
metaTitle: Как работать с внешними API на React Native
metaDescription: Узнайте как реализовать запросы к внешним API в React Native - пошаговые инструкции по fetch, axios, асинхронным функциям, обработке ошибок и выяснению лучших практик
author: Олег Марков
title: Как работать с внешними API на React Native
preview: Освойте подключение к сторонним API в React Native - разъяснения, примеры реальных запросов, рекомендации и эффективные паттерны для работы с асинхронными данными
---

## Введение

Мобильное приложение редко бывает «островом»: большинство современных решений общаются с удалёнными серверами, получают и отправляют данные с помощью API (Application Programming Interface). React Native — мощная платформа для кроссплатформенной мобильной разработки на JavaScript и TypeScript — предоставляет эффективные инструменты для работы с такими внешними API.

В этой статье вы поймёте, как правильно организовать работу с внешними API на React Native, узнаете про основные подходы, разберетесь с инструментами вроде fetch и axios, научитесь обрабатывать ответы и ошибки, а также познакомитесь с рекомендациями, которые помогут избегать типичных подводных камней.

---

## Подходы к работе с API в React Native

### Зачем нужны внешние API в приложении

Внешние API позволяют вашему приложению:

- Получать актуальные данные с сервера (например, новости, курсы валют, погоду, профили пользователей и пр.)
- Отправлять информацию (например, авторизацию, добавление контента, покупки)
- Взаимодействовать с различными внешними сервисами и объединять возможности (например, картографические данные или платежные системы)

### Асинхронность: что нужно знать

Вся работа с сетевыми запросами — асинхронная. Это означает, что приложение не «замерзает» в ожидании ответа API, а продолжает работать дальше. Поэтому для работы с API в React Native вы будете использовать асинхронные функции, промисы и синтаксис async/await.  
Давайте рассмотрим на простом примере:

```javascript
// Функция использует async/await для асинхронного запроса к серверу
async function fetchData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();
    // Здесь данные можно использовать дальше
    console.log(data);
  } catch (error) {
    console.error(error); // Обработка ошибки сети или запроса
  }
}
```

## Основные инструменты: fetch vs axios

В React Native чаще всего используют две библиотеки для работы с API:

- **Fetch** — стандартная встроенная функция JavaScript для HTTP-запросов, поддерживается как в браузере, так и в React Native.
- **Axios** — популярная сторонняя библиотека для выполнения HTTP-запросов, обладающая расширенными возможностями.

### Использование fetch: базовые примеры

Fetch — встроенный вариант, не требует установки. Вот базовый пример GET-запроса:

```javascript
useEffect(() => {
  // Выполняется запрос на сервер при монтировании компонента
  fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then(response => response.json()) // Преобразуем ответ в JSON
    .then(json => setTodo(json)) // Сохраняем полученные данные в состояние
    .catch(error => console.error(error)); // Обрабатываем возможные ошибки
}, []);
```

#### Отправка POST-запроса с fetch

```javascript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST', // Указываем, что это POST
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json', // Сообщаем, что отправляем JSON
  },
  body: JSON.stringify({
    title: 'foo', // Данные, которые отправляются на сервер
    body: 'bar',
    userId: 1,
  }),
})
  .then(response => response.json())
  .then(json => console.log(json));
```
> Здесь важно всегда явно настраивать заголовки, когда отправляете JSON.

### Использование axios

Axios берёт на себя часть рутины с парсингом данных и настройкой запросов. Для работы поставьте пакет:

```
npm install axios
```

#### Пример GET-запроса с axios

```javascript
import axios from 'axios';

useEffect(() => {
  // Здесь axios сразу возвращает уже распарсенный ответ, можно передавать параметры
  axios.get('https://jsonplaceholder.typicode.com/users')
    .then(response => setUsers(response.data))
    .catch(error => console.error(error));
}, []);
```

#### Пример POST-запроса с axios

```javascript
axios.post('https://jsonplaceholder.typicode.com/posts', {
  title: 'foo',
  body: 'bar',
  userId: 1,
})
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

#### Преимущества axios по сравнению с fetch

- Автоматический парсинг JSON в response.data
- Простая обработка ошибок (отдельно можно получить ошибки сервера)
- Удобная настройка заголовков, таймаутов, перехватчиков и многих других опций

В большинстве реальных проектов axios используют чаще, однако fetch отлично подходит для небольших задач и когда не хочется тянуть сторонние зависимости.

## Организация кода для работы с API

### Выделяйте слой работы с API

Хорошей практикой является вынос логики запросов в отдельные функции/модули. Это упрощает поддержку и тестирование.

```javascript
// api/userApi.js

import axios from 'axios';

export const getUsers = () => axios.get('https://jsonplaceholder.typicode.com/users');
export const getUserById = (id) => axios.get(`https://jsonplaceholder.typicode.com/users/${id}`);
export const createUser = (user) => axios.post('https://jsonplaceholder.typicode.com/users', user);
```

А в компоненте:

```javascript
import { getUsers } from './api/userApi';

// ...в компоненте
useEffect(() => {
  getUsers()
    .then(response => setUsers(response.data))
    .catch(error => console.error(error));
}, []);
```
> Такой подход делает ваш код структурированным и модульным.

### Обработка ошибок

Ошибки бывают разного рода: сеть недоступна, сервер вернул ошибку, данные имеют неожиданный формат.  
Обрабатывать ошибки — всегда важно! Смотрите, как это реализовать с помощью try/catch и axios:

```javascript
async function loadUser(id) {
  try {
    const response = await axios.get(`/api/users/${id}`);
    setUser(response.data);
  } catch (error) {
    if (error.response) {
      // Сервер ответил ошибкой
      alert(`Ошибка сервера: ${error.response.status}`);
    } else if (error.request) {
      // Не получили ответ
      alert('Нет ответа от сервера');
    } else {
      // Ошибка при формировании запроса
      alert('Ошибка запроса');
    }
  }
}
```
> Разница между error.response и error.request: первая говорит о том, что сервер что-то ответил, вторая — что ответа не было (например, из-за проблем с сетью).

## Использование асинхронных функций и хуков

### useEffect: выполнение запроса при монтировании компонента

```javascript
import React, { useEffect, useState } from 'react';

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const usersData = await response.json();
        setUsers(usersData);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, []); // Пустой массив — значит, вызов один раз при монтировании
}
```

### useCallback: мемоизация функций запроса

Если вы передаёте обработчики или функции API-запроса в дочерние компоненты, их удобно оборачивать в useCallback, чтобы избежать лишних рендеров:

```javascript
import { useCallback } from 'react';

const fetchTodo = useCallback(async (id) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);
    const todo = await response.json();
    setTodo(todo);
  } catch (error) {
    console.error(error);
  }
}, [id]);
```

## Обработка Loading и Error состояний

При работе с запросами всегда нужно учитывать разные состояния:

- данные загружаются
- данные успешно загружены
- возникла ошибка

Давайте реализуем простой паттерн с состояниями:

```javascript
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true); // Отображаем индикатор загрузки
  fetch('https://jsonplaceholder.typicode.com/users')
    .then((response) => response.json())
    .then((data) => setUsers(data))
    .catch((err) => setError(err))
    .finally(() => setLoading(false)); // Готово: скрываем индикатор
}, []);
```

В компоненте показываем разные сообщения:

```javascript
{loading && <ActivityIndicator />}
{error && <Text>Ошибка загрузки</Text>}
{!loading && !error && users.map(user => <Text key={user.id}>{user.name}</Text>)}
```

## Тонкости работы с API в React Native

### Ограничения платформы

На мобильных устройствах возможны следующие проблемы:

- Нестабильное подключение к интернету  
- Ограниченные ресурсы устройства  
- Необходимость указывать разрешения на сетевой доступ (Android/iOS)

Проверьте, что ваше приложение запрашивает необходимые разрешения, а также корректно реагирует на долгие или неудачные запросы (таймауты, повторные попытки).

### Безопасность работы с API

- Никогда не храните секретные ключи, токены, пароли в исходниках приложения  
- Используйте защищённые протоколы (https)  
- По возможности реализуйте дополнительную обработку ошибок, чтобы не раскрывать пользователю детали API

### Как кешировать данные

Если вам важно не нагружать API и ускорить работу приложения, вы можете сохранять результаты запросов локально, например через AsyncStorage:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Сохраняем результат запроса в local storage
await AsyncStorage.setItem('users', JSON.stringify(users));

// Читаем данные (при отсутствии интернета, например)
const cachedUsers = await AsyncStorage.getItem('users');
```

### Обработка отмены запросов

Пользователь может уйти со страницы, пока данные загружаются. В этом случае бывает полезно отменить лишние сетевые вызовы, чтобы не было ошибок при попытке изменить состояние размонтированного компонента.

У fetch отмена реализуется через AbortController:

```javascript
useEffect(() => {
  const controller = new AbortController();

  fetch('https://jsonplaceholder.typicode.com/users', {
    signal: controller.signal // Добавляем сигнал для отмены
  })
    .then(response => response.json())
    .then(data => setUsers(data))
    .catch(error => {
      if (error.name === 'AbortError') {
        // Запрос был отменен
        return;
      }
      // Обрабатываем другие ошибки
      setError(error);
    });

  return () => controller.abort(); // Отменяем запрос при размонтировании компонента
}, []);
```
> Это защищает ваши компоненты от обновления после анмаунта и утечек памяти.

## Популярные паттерны и лучшие практики

### Используйте готовые решения для state management и запросов

В средних и крупных приложениях удобно управлять асинхронными запросами и состояниями с помощью библиотек:

- **React Query** — мощный инструмент для синхронизации данных с сервером, управления загрузками, кешем, повторными попытками, статусами ошибок
- **Redux Toolkit Query** — интегрируется с Redux, похожие возможности по запросам, автоматическое кеширование, мутации
- **SWR** — библиотека от Vercel для кеширования и обновления данных

#### Пример использования React Query

```javascript
import { useQuery } from '@tanstack/react-query'

function UsersComponent() {
  const { data, error, isLoading } = useQuery(['users'], () =>
    fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json())
  );

  if (isLoading) return <Text>Загрузка...</Text>;
  if (error) return <Text>Ошибка: {error.message}</Text>;

  return (
    <View>
      {data.map(user => <Text key={user.id}>{user.name}</Text>)}
    </View>
  );
}
```
> Здесь все процессы запроса, загрузки и ошибок обрабатываются внутри useQuery.

### Обрабатывайте ошибки максимально дружелюбно

Показывайте пользователю понятные ошибки. Не выводите технические детали — лучше подскажите, что делать: «Проверьте интернет-соединение», «Повторить попытку».

### Логируйте и анализируйте ошибки

Реально помогает сервис интеграций Sentry и аналогичных систем — это позволит находить и реагировать на непредвиденные сбои.

## Тестирование работы приложения с API

### Мокаем (заменяем) запросы на тестовые

Для тестирования компонентов, делающих сетевые вызовы, используйте моки, чтобы не зависеть от реального API. Например, через jest:

```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([{ id: 1, name: 'John' }]),
  })
);

// Теперь ваш компонент будет получать предсказуемые данные для тестов
```

### Использование Mock Service Worker (MSW)

Эта утилита позволяет перехватывать запросы не только в тестах, но и в локальной разработке, чтобы симулировать различные сценарии ответов API.

---

## Заключение

Работа с внешними API — неотъемлемая часть мобильной разработки на React Native. С помощью подходов, описанных в статье: использования fetch и axios для запросов, выделения логики работы с API в отдельные модули, обработки асинхронных состояний и ошибок, применения современных инструментов типа React Query, вы сможете создавать надёжные и отзывчивые приложения. Уделяйте внимание безопасности, производительности и чёткому разделению логики, чтобы упростить дальнейшую поддержку.

---

## Частозадаваемые технические вопросы по теме

**Вопрос 1. Почему мой fetch / axios-запрос не срабатывает на Android, а на iOS всё работает?**  
*Ответ:* На Android обязательно настройте разрешения на доступ к интернету. В android/app/src/main/AndroidManifest.xml должно быть `<uses-permission android_name="android.permission.INTERNET" />`. Без этого приложение не сможет выходить в сеть.

**Вопрос 2. Как я могу автоматически повторять запрос, если произошел таймаут или временная ошибка?**  
*Ответ:* Для этого используйте axios-retry или React Query с параметром `retry`. В ручных решениях реализуйте рекурсивный вызов функции по таймеру после неудачи.

**Вопрос 3. Как передавать токены авторизации в каждом запросе с axios?**  
*Ответ:* Используйте перехватчик (interceptor) axios:  
```javascript
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
Это автоматически вставляет токен во все исходящие запросы.

**Вопрос 4. Почему получаю ошибку CORS при обращении к тестовому API?**  
*Ответ:* В мобильных приложениях CORS-ограничения возникают редко. Если они всё же проявляются, проблема, скорее всего, в сервере. Используйте правильный endpoint или настройте прокси для локальной разработки.

**Вопрос 5. Как лучше всего структурировать работу с несколькими независимыми API в одном приложении?**  
*Ответ:* Разбивайте логику каждого API в отдельный модуль/folder, например `api/githubApi.js`, `api/newsApi.js`. Создавайте универсальные функции-обёртки для запросов, используйте менеджер состояний для централизованного контроля данных и ошибок.