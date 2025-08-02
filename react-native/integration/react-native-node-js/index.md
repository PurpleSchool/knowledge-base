---
metaTitle: Интеграция Node.js с React Native
metaDescription: Пошаговое руководство по интеграции Node.js с React Native - разбор архитектуры, примеры общения через REST и WebSocket, настройка, безопасность и live-обновления
author: Олег Марков
title: Интеграция Node.js с React Native
preview: Разберитесь в интеграции Node.js и React Native - настройте обмен данными, выберите архитектуру, реализуйте обмен по REST API и WebSocket с примерами
---

## Введение

Связка Node.js и React Native давно стала стандартным подходом разработки комплексных мобильных приложений, где фронтенд и бэкенд разделены по ролям. Node.js используется как мощная серверная платформа, предоставляющая API, а React Native — популярный фреймворк для написания мобильных приложений на JavaScript с возможностью реального нативного рендеринга интерфейса.

В этой статье я расскажу вам о типичной архитектуре интеграции Node.js и React Native, поясню, какие способы взаимодействия чаще всего применяют, и покажу примеры рабочих решений. Вы узнаете, как создать API в Node.js, обратиться к нему из мобильного приложения на React Native, какие пакеты и подходы использовать для push-уведомлений, WebSocket, работы с файлами и аутентификации. Добавлю схемы и код, чтобы вы могли повторить всё шаг за шагом.

## Архитектура интеграции: как связать Node.js и React Native

### Общая схема

Обычно архитектура интеграции между Node.js и React Native выглядит так:

- Node.js работает на сервере, предоставляет публичный HTTP API (REST или GraphQL) и поддерживает постоянное соединение через WebSocket или другие методы обмена реального времени.
- React Native запущен на устройстве — например, телефоне — и выполняет запросы к серверному API через HTTP/HTTPS или подключается по WebSocket.

Давайте посмотрим на схему:

```
[React Native App] <---HTTP/HTTPS/WebSocket---> [Node.js Server] <---MongoDB/Postgres/Redis--->
```

Node.js становится точкой входа для всех клиентских запросов, обработки логики, работы с базой и push-уведомлений.

Интеграция React Native с Node.js backend открывает широкие возможности для создания сложных мобильных приложений, требующих обмена данными с сервером, аутентификации пользователей и обработки бизнес-логики. Однако, такая интеграция требует понимания сетевых запросов, работы с API, обработки ошибок и обеспечения безопасности. Если вы хотите детальнее погрузиться в создание полноценных React Native приложений с Node.js backend, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-Node.js-s-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Почему так удобно?

- Оба стека используют JavaScript, что ускоряет разработку и делает проектирование гибким.
- Node.js сервер можно быстро развернуть и масштабировать, даже если приложение разрастётся.
- Прямое интегрирование реального времени через сокеты — ключевой плюс для современных мобильных приложений.

## Запуск серверной части Node.js для React Native

### Минимальный пример REST сервера на Express

Посмотрим на самую простую серверную часть, которую часто используют в связке с React Native:

```js
// Импортируем Express - популярный фреймворк для Node.js
const express = require('express');
const app = express();
const port = 3000;

// Добавляем стандартную middleware для распознавания JSON в теле запроса
app.use(express.json());

// Создаем тестовый GET-метод — его будет вызывать React Native
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' }); // Ответ клиенту
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
```

Сейчас вы запустили сервер с простым GET маршрутом `/api/ping`. Мобильное приложение сможет к нему обращаться.

### Как протестировать сервер?

Из React Native, Postman или обычного браузера откройте:
```
http://localhost:3000/api/ping
```

Должно вернуться:
```json
{ "message": "pong" }
```

Теперь будем делать на стороне клиента в React Native вызовы к этому серверу.

## Взаимодействие React Native с Node.js: что есть в арсенале

### Вариант 1 — HTTP REST API

Самый популярный способ: мобильное приложение делает HTTP-запросы (GET, POST и др.) к API Node.js с помощью fetch или axios.

```js
// Импортируем fetch — он встроен в React Native
const fetchData = async () => {
  try {
    const response = await fetch('http://YOUR_IP:3000/api/ping');
    const data = await response.json();
    console.log('Сервер ответил:', data);
  } catch (error) {
    console.error('Ошибка запроса:', error);
  }
};
```

Обратите внимание:
- Вместо `localhost` используйте IP-адрес вашей машины или сервера, чтобы приложение на эмуляторе или реальном устройстве могло достучаться до Node.js.
- Протестируйте запрос через Wi-Fi или выставьте правильную настройку портов.

### Вариант 2 — WebSocket (реальное время)

Через WebSocket можно реализовать live-чаты, обновления сообщений, push-уведомления и игры.

#### Минимальный пример на сервере (Node.js + socket.io):

```js
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } }); // Разрешаем CORS для мобильного клиента

io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);

  // Отправка тестового сообщения клиенту сразу после подключения
  socket.emit('hello', { message: 'Привет из Node.js!' });

  // Логика получения сообщения от клиента
  socket.on('ping', (data) => {
    console.log('Получен ping:', data);
    socket.emit('pong', { received: true });
  });
});

server.listen(3000, () => {
  console.log('Socket.io сервер запущен на порту 3000');
});
```

#### На стороне React Native:

Для работы с WebSocket берём пакет [socket.io-client](https://www.npmjs.com/package/socket.io-client).

```bash
npm install socket.io-client
```

Код в React Native:

```js
import { useEffect } from 'react';
import io from 'socket.io-client';

const useSocket = () => {
  useEffect(() => {
    // Подключение к серверу
    const socket = io('http://YOUR_IP:3000');

    // Подписка на событие 'hello'
    socket.on('hello', (data) => {
      console.log('Сервер: ', data.message); // => 'Привет из Node.js!'
    });

    // Отправим ping-сообщение
    socket.emit('ping', { time: Date.now() });

    // Подписка на ответ
    socket.on('pong', (data) => {
      console.log('Ответ на ping:', data);
    });

    // Очистка при размонтировании
    return () => {
      socket.disconnect();
    };
  }, []);
};

export default useSocket;
```

Используйте этот хук в компоненте, чтобы подключать сокеты.

### Вариант 3 — GraphQL (альтернатива REST)

Если нужен гибкий обмен данными, можно поднять в Node.js сервер Apollo или graphql-yoga. Клиенты React Native делают запросы через ApolloClient.

```js
// Пример клиентской части Apollo в React Native
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

// Создаем Apollo клиент
const client = new ApolloClient({
  uri: 'http://YOUR_IP:4000/graphql',
  cache: new InMemoryCache(),
});

// Пример запроса
const GET_PRODUCTS = gql`
  query {
    products {
      id
      name
      price
    }
  }
`;

// Используем в компоненте:
function ProductList() {
  const { data, loading, error } = useQuery(GET_PRODUCTS, { client });

  if (loading) return <Text>Загрузка...</Text>;
  if (error) return <Text>Ошибка: {error.message}</Text>;

  return data.products.map((product) => (
    <Text key={product.id}>{product.name} — {product.price}</Text>
  ));
}
```

GraphQL часто применяют для сложных сервисов, где структура запросов меняется во времени.

### Вопросы безопасности: аутентификация и авторизация

#### JWT токены

Самый удобный и стандартный способ аутентификации, когда фронтенд и бэкенд разделены. Сервер выдает токен пользователю, а клиент хранит его и передает в заголовках.

Код для Node.js (выдача токена):

```js
const jwt = require('jsonwebtoken');

// Генерируем токен (после логина)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Простая проверка (на практике проверяйте по базе)
  if (username === 'user' && password === 'pass') {
    const token = jwt.sign({ username }, 'MY_SECRET_KEY', { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Неверные данные' });
  }
});
```

Код в React Native (отправка токена):

```js
// Отправляем логин/пароль, получаем токен
const login = async () => {
  const response = await fetch('http://YOUR_IP:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user', password: 'pass' }),
  });
  const data = await response.json();
  // Сохраняем токен в AsyncStorage
  if (data.token) {
    await AsyncStorage.setItem('jwt', data.token);
  }
};

// Используем токен для запросов
const fetchProtectedData = async () => {
  const token = await AsyncStorage.getItem('jwt');
  const response = await fetch('http://YOUR_IP:3000/api/secret', {
    headers: { Authorization: `Bearer ${token}` }
  });
  // дальнейшая обработка ответа
};
```

#### Защита на сервере (middleware):

```js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  try {
    req.user = jwt.verify(token, 'MY_SECRET_KEY'); // Декодируем токен
    next();
  } catch (e) {
    res.status(403).json({ error: 'Нет доступа' });
  }
}

// Используем как middleware
app.get('/api/secret', authMiddleware, (req, res) => {
  res.json({ confidential: 'Данные для авторизованных' });
});
```

Теперь вы защищаете ваши приватные маршруты.

### Работа с файлами: загрузка фото/видео в Node.js через React Native

В современной мобильной разработке часто нужно отправлять изображения или видео с клиента на сервер.

На стороне React Native используют пакет [react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker) — он позволяет выбрать файл.

Пример отправки фото на Node.js через FormData:

```js
import { launchImageLibrary } from 'react-native-image-picker';

const uploadPhoto = async () => {
  const { assets } = await launchImageLibrary({ mediaType: 'photo' });
  if (!assets || assets.length === 0) return;

  const photo = assets[0];

  const data = new FormData();
  data.append('file', {
    uri: photo.uri,
    type: photo.type,
    name: photo.fileName,
  });

  const response = await fetch('http://YOUR_IP:3000/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: data,
  });

  const result = await response.json();
  console.log('Ответ от сервера:', result);
};
```

Node.js сервер с загрузкой файлов через [multer](https://www.npmjs.com/package/multer):

```js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Сохраняем файлы в папку uploads

app.post('/api/upload', upload.single('file'), (req, res) => {
  // req.file содержит инфо о файле
  res.json({ filename: req.file.filename, original: req.file.originalname });
});
```

### Push-уведомления: интеграция через Node.js

Для простых задач (например, отправка уведомления о новом сообщении) React Native взаимодействует с сервером Node.js через пуш-уведомления. Чаще всего используют сервисы Firebase, а Node.js делает вызовы к их API.

#### Пример отправки push в Firebase через Node.js

```js
const fetch = require('node-fetch');

const sendPushNotification = async (deviceToken, title, body) => {
  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'key=YOUR_SERVER_KEY', // Берется из console Firebase Cloud Messaging
    },
    body: JSON.stringify({
      to: deviceToken,
      notification: {
        title,
        body,
      },
    }),
  });
};
```

В React Native установите и настройте пакет [@react-native-firebase/messaging](https://invertase.io/oss/react-native-firebase/v6/messaging/quick-start), получите deviceToken пользователя, отправьте его на сервер и используйте как адресата.

## Реализация live-обновлений: пример чата в реальном времени

Для обмена сообщениями между несколькими пользователями, чтобы сообщения появлялись мгновенно, часто используют WebSocket.

Покажу базовую реализацию:

#### Сервер (Node.js c socket.io):

```js
io.on('connection', (socket) => {
  // Подписка пользователя на комнату
  socket.on('join', ({ roomId }) => {
    socket.join(roomId); // Комнаты позволяют объединить пользователей
  });

  // Получение и рассылка сообщения
  socket.on('sendMessage', ({ roomId, message }) => {
    // Раздаем сообщение всем подписанным
    io.to(roomId).emit('receiveMessage', { message, from: socket.id });
  });
});
```

#### Клиент (React Native):

```js
const socket = io('http://YOUR_IP:3000');

// Входим в комнату
socket.emit('join', { roomId: 'room1' });

// Отправка сообщения
socket.emit('sendMessage', { roomId: 'room1', message: 'Привет всем!' });

// Получение и отображение
socket.on('receiveMessage', ({ message, from }) => {
  // Добавляем сообщение к списку чата
  setChat((prev) => [...prev, { message, from }]);
});
```

Теперь каждое новое сообщение автоматически доставляется всем участникам комнаты.

## Отладка и тестирование

### Советы для локальной разработки

- Эмуляторы Android разрешают обращаться к хостовой машине как `10.0.2.2`, а iOS эмулятор — как `localhost`.
- Для реальных устройств — используйте внешний IP-адрес вашего компьютера.
- Откройте соответствующий порт на фаерволе.
- Используйте ngrok или аналогичные инструменты если нужно выйти за NAT.

### Логирование и анализ

- Старайтесь логировать запросы на стороне сервера (`morgan`, `winston`).
- Для клиента используйте `console.log` и встроенный дебаггер React Native.
- При ошибках проверяйте CORS, протоколы (HTTP/HTTPS), правильность адресов.

## Заключение

Интеграция Node.js с React Native — универсальная и масштабируемая архитектура, которая покрывает весь цикл работы современного мобильного приложения: от хранения и выдачи данных до обмена сообщениями и отправки пуш-уведомлений. С помощью правильно выстроенного API, организации обмена данными через REST, WebSocket или GraphQL, вы можете строить приложения любого уровня сложности.

В ключевых сценариях — авторизация, работа с файлами, live-обновления — вам понадобятся популярные Node.js-библиотеки: express, socket.io, multer, jsonwebtoken. В React Native легко настраиваются запросы и подключается обработка потоковых данных.

В этой статье я постарался сделать так, чтобы даже базовый проект вы могли собрать полностью с нуля. Используйте примеры и подходы — они масштабируются для настоящих задач.

Успешная интеграция Node.js с React Native требует не только знания сетевых запросов и API, но и понимания, как эффективно управлять состоянием приложения, создавать переиспользуемые компоненты и обеспечивать плавную навигацию. Начните с основ, таких как настройка окружения и компонентов, а затем переходите к изучению Expo Router и нативных модулей. Все это и многое другое вы найдете в нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-Node.js-s-React-Native). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме и ответы

### Как подключиться к Node.js серверу из React Native, если приложение разрабатывается на реальном мобильном устройстве через Wi-Fi?

- Узнайте локальный IP-адрес компьютера (например, через `ipconfig` или `ifconfig`).
- Убедитесь, что мобильное устройство в одной Wi-Fi сети с сервером.
- В коде клиента используйте этот IP и открытый порт, например, `http://192.168.1.5:3000`.
- Проверьте, не блокирует ли firewall ваш порт. Откройте его, если нужно.

### Как отлаживать HTTPS соединения между React Native и Node.js на локальной машине?

- Создайте self-signed SSL сертификат или используйте сервисы типа ngrok для туннелирования HTTPS-трафика.
- Добавьте опцию игнорирования проверки сертификата в fetch или axios, если работаете в тестовой среде (не делайте так на проде!).
- Для iOS эмулятора можно подложить сертификаты в настройки Keychain.

### Какие есть способы загрузки больших файлов из React Native на сервер Node.js, чтобы избежать зависаний?

- Используйте FormData и держите размер файлов в разумных пределах.
- Для крупных файлов — смотрите на библиотеки chunked upload (разделение на части), например, [Tus](https://tus.io/).
- На сервере увеличьте лимиты bodyParser и multer.
- Добавьте индикаторы прогресса на стороне клиента через axios/onUploadProgress.

### Чем отличается socket.io от стандартного WebSocket в интеграции React Native и Node.js?

- socket.io — это надстройка над WebSocket, обеспечивающая fallback (автоматическая подмена транспорта), события из коробки, соединения по комнатам и авторизацию.
- Стандартные WebSocket проще, но не поддерживают многие из этих функций; чаще выбирают socket.io для мобильных приложений.

### Как организовать обновление данных в мобильном приложении при изменении данных на сервере без постоянного опроса (polling)?

- Используйте WebSocket (socket.io) для пуш-обновлений.
- Для GraphQL есть subscriptions (на Apollo Server и Apollo Client).
- Не применяйте polling, если важна производительность и ресурс смартфона.
