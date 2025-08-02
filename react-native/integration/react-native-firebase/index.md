---
metaTitle: Интеграция Firebase с React Native
metaDescription: Полное руководство по интеграции Firebase с React Native - авторизация, база данных, уведомления, аналитика и советы по безопасности
author: Олег Марков
title: Интеграция Firebase с React Native
preview: Пошаговое руководство по подключению Firebase к React Native - настройка, работа с аутентификацией, базой данных, push-уведомлениями и аналитикой
---

## Введение

Интеграция Firebase с React Native — это современный подход к созданию полноценных мобильных приложений без необходимости разработки собственного бэкенда и сервисов. С помощью Firebase вы получаете в свое распоряжение готовые инструменты для аутентификации пользователей, работы с базой данных в реальном времени, управления push-уведомлениями, аналитики, хранения файлов и многого другого. 

В этой статье я подробно расскажу, как базово и продвинуто встроить Firebase в ваше React Native приложение. Здесь вы найдете работающие примеры кода и инструкции на всех этапах: от установки до использования отдельных сервисов.

## Установка и начальная настройка

### Шаг 1. Инициализация проекта React Native

Создайте новый проект, если он ещё не создан:

```bash
npx react-native init MyFirebaseApp
```
или, если вы используете Expo:
```bash
npx create-expo-app MyFirebaseApp
```

Firebase предоставляет широкий набор сервисов для разработки мобильных приложений, включая аутентификацию, базу данных, хранилище и аналитику. Интеграция Firebase с React Native позволяет создавать масштабируемые и надежные приложения с использованием готовых решений. Чтобы эффективно использовать Firebase, необходимо понимать принципы работы каждого сервиса и уметь их интегрировать в React Native проект. Если вы хотите детально разобраться в интеграции Firebase с React Native и создавать современные full-stack мобильные приложения — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integraciya-Firebase-s-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Шаг 2. Регистрация приложения в Firebase

1. Перейдите на [консоль Firebase](https://console.firebase.google.com/).
2. Нажмите "Добавить проект" или выберите уже существующий.
3. Добавьте новое приложение – выберите Android или iOS в зависимости от вашей цели.
4. Следуйте инструкциям для загрузки Google Services файлов:
   - Для Android — `google-services.json` поместите в папку `android/app`.
   - Для iOS — `GoogleService-Info.plist` в папку `ios/YourProject/`.

### Шаг 3. Установка зависимостей

Для типового RN проекта (без Expo) поставьте:

```bash
npm install @react-native-firebase/app
```

Если нужно подключать отдельные модули (например, аутентификацию или базу данных):

```bash
npm install @react-native-firebase/auth @react-native-firebase/firestore
```

Для Expo проекты используйте:

```bash
npx expo install expo-firebase-core firebase
```

**Важно:** Для iOS выполните после установки библиотек команду:

```bash
cd ios && pod install && cd ..
```
Это поставит CocoaPods зависимости.

### Шаг 4. Проверка интеграции

Откройте или создайте любой компонент и добавьте простой вызов:

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import app from '@react-native-firebase/app'; // Импортируйте пакет Firebase

const HomeScreen = () => {
  // Проверяем, что приложение инициализировано
  console.log('Firebase name:', app().name); // Выведет '[DEFAULT]', если все работает

  return (
    <View>
      <Text>Firebase is configured!</Text>
    </View>
  );
};

export default HomeScreen;
```

Если ошибок не возникло, интеграция на базовом уровне завершена.

## Использование основных модулей Firebase

### Аутентификация пользователей

Firebase Auth поддерживает email-пароль, Google, Facebook и другие способы входа.

#### Регистрация и вход по E-mail и паролю

Добавьте пакет:

```bash
npm install @react-native-firebase/auth
```

Теперь пример регистрации и входа:

```javascript
import auth from '@react-native-firebase/auth';

// Регистрация нового пользователя
const register = async (email, password) => {
  try {
    await auth().createUserWithEmailAndPassword(email, password);
    // Пользователь добавлен
  } catch (error) {
    // Обработка ошибок
    console.error(error.message);
  }
};

// Вход пользователя
const login = async (email, password) => {
  try {
    await auth().signInWithEmailAndPassword(email, password);
    // Пользователь вошел
  } catch (error) {
    // Обработка ошибок
    console.error(error.message);
  }
};
```
**Комментарии:**
- error.code даст тип ошибки (например, почта занята, слабый пароль и т. п.).
- Для работы с social login (Google, Facebook) потребуется добавить SDK и настроить OAuth — это делается отдельно для каждой платформы.

#### Подписка на изменения состояния пользователя

Хорошей практикой будет слушать изменение статуса авторизации, чтобы, например, перестраивать навигацию:

```javascript
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';

function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Подписка на изменение авторизации
    const unsubscribe = auth().onAuthStateChanged(setUser);
    return unsubscribe; // снимет подписку при размонтировании компонента
  }, []);

  return user;
}
```

Использование:

```javascript
const user = useAuth();
if (user) {
  // Пользователь вошел
} else {
  // Не авторизован
}
```

### Работа с базой данных Firestore

Cloud Firestore — это облачная база данных NoSQL реального времени.

#### Инициализация и базовые операции

Установите пакет:

```bash
npm install @react-native-firebase/firestore
```

Теперь покажу, как добавить и получить данные:

```javascript
import firestore from '@react-native-firebase/firestore';

// Добавить документ
const addUser = async () => {
  await firestore()
    .collection('Users')
    .add({
      name: 'Ivan',
      age: 30,
      createdAt: firestore.FieldValue.serverTimestamp(), // Время создания
    });
};

// Получить все документы из коллекции
const getUsers = async () => {
  const usersSnapshot = await firestore().collection('Users').get();
  // Преобразуем документы в объекты
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return users;
};
```

#### Реальное время

Вы можете слушать изменения данных:

```javascript
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    // Слушаем коллекцию
    const unsubscribe = firestore()
      .collection('Users')
      .onSnapshot(snapshot => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      });
    return unsubscribe; // Очистка подписки
  }, []);
  return users;
}
```

**Комментарии:**
- С onSnapshot ваш UI будет обновляться сразу после изменения данных на сервере.
- Firestore поддерживает сложные запросы и фильтрацию — смотрите документацию для продвинутых кейсов.

### Хранение файлов: Cloud Storage

Cloud Storage подходит для загрузки и отдачи изображений, PDF и любых файлов.

#### Установка и добавление файлов

Установите зависимость:

```bash
npm install @react-native-firebase/storage
```

Пример загрузки фото:

```javascript
import storage from '@react-native-firebase/storage';

// Загрузка файла с устройства
const uploadFile = async (pathToFile, fileName) => {
  const reference = storage().ref(fileName);
  // Загрузить файл методом putFile
  await reference.putFile(pathToFile);
  // Получить ссылку для скачивания
  const url = await reference.getDownloadURL();
  return url;
};
```
**Комментарии:**
- `pathToFile` — путь к файлу на устройстве, его можно получить через react-native-image-picker или аналогичный пакет.
- Файлы можно группировать в подпапки, например: `images/avatars/userid.jpg`.

### Отправка Push-уведомлений через Firebase Cloud Messaging (FCM)

Firebase поддерживает работу с пушами для iOS и Android.

#### Установка и базовая интеграция

```bash
npm install @react-native-firebase/messaging
```

**Android:** автоматически настроится через `google-services.json`.

**iOS**: важна дополнительная конфигурация — настройка APNs, сертификатов, описана в [официальной документации](https://rnfirebase.io/messaging/usage).

#### Получение и обработка уведомлений

Пример подписки на уведомления в приложении:

```javascript
import messaging from '@react-native-firebase/messaging';

// Запросить разрешения (iOS требует)
await messaging().requestPermission();

// Получить токен устройства
const fcmToken = await messaging().getToken(); // Этот токен нужен серверу для отправки пушей

// Слушаем входящие сообщения
messaging().onMessage(async remoteMessage => {
  // remoteMessage содержит данные уведомления
  console.log('New FCM message:', remoteMessage);
});
```

**Комментарии:**
- Из приложения вы обычно только получаете пуши. Отправлять их массово можно через Firebase Console или сервер.
- Для кастомизации уведомлений используйте payload с нужными параметрами.

### Аналитика в Firebase

Firebase Analytics позволяет отслеживать действия пользователей.

#### Установка и отслеживание событий

```bash
npm install @react-native-firebase/analytics
```

Пример отправки кастомного события:

```javascript
import analytics from '@react-native-firebase/analytics';

// Отправка кастомного события
const logEvent = async () => {
  await analytics().logEvent('visit_screen', {
    screen_name: 'Home',
    time: Date.now(),
  });
};
```

**Комментарии:**
- Все события будут доступны в Google Analytics.
- Firebase сам считает основные метрики: количество active users, retention, screen views и др.

## Настройка безопасности и прав доступа

### Firestore Security Rules

Вам стоит сразу продумать правила доступа к данным — иначе ваша база будет открыта всему миру.

Пример базового ограничения: только аутентифицированный пользователь может читать или писать свою коллекцию.

```js
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
**Комментарии:**
- Изучите правила безопасности в консоли Firebase!
- Для Storage также пишутся отдельные security rules.

## Разработка и отладка: советы и особенности

#### Польза переменных окружения

Используйте переменные окружения для ключей проекта, не храните секреты в Git:

```bash
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
```
Подключайте их через библиотеки типа `react-native-dotenv`.

#### Инструменты для тестирования локально

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) позволяет поднимать локальные сервера Auth, Firestore, Storage и др.
- Это удобно для теста без расхода бюджета и без риска случайно повредить боевую базу.

#### Продвинутые возможности

- **Remote Config** — позволяет менять параметры приложения без обновления.
- **Dynamic Links** — глубокие ссылки между приложением и веб-сайтом.
- **Crashlytics** — мониторинг сбоев приложения.

## Что делать при ошибках: частые проблемы и их диагностика

- **Ошибка инициализации:** Проверьте расположение и содержимое `google-services.json`/`GoogleService-Info.plist`.
- **Не срабатывает аутентификация:** Убедитесь, что включен нужный способ входа в консоли Firebase.
- **Не приходят пуши:** Проверьте, что все разрешения выданы приложению, и что вы используете свежий push-токен устройства.
- **Firestore "Permission denied":** Правила безопасности не разрешают доступ — отладьте их в Firebase консоли.

## Заключение

Вы узнали, как подключить и использовать основные функции Firebase в приложении React Native. Такой подход экономит месяцы работы и позволяет сконцентрироваться на бизнес-логике, а не инфраструктуре. Firebase легко масштабируется, поддерживает интеграцию с аналитикой, push-уведомлениями и авторизацией практически «из коробки». Вы можете расширить свой проект с помощью дополнительных сервисов Firebase, когда это потребуется. Не забывайте тщательно следить за настройкой безопасности и конфиденциальности — особенно в продакшн-приложениях.

Интеграция с Firebase является важным аспектом разработки современного React Native приложения. Однако, для создания полноценного приложения необходимо освоить множество других технологий и подходов, включая работу с UI, данными и нативными функциями. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integraciya-Firebase-s-React-Native) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как безопасно хранить ключи Firebase и другие конфиденциальные данные в React Native проекте?**  
*Не добавляйте конфиги или секреты в исходный код и не коммитьте их в репозиторий. Используйте переменные окружения с помощью библиотек типа react-native-config или dotenv. Для iOS и Android ключи из service-файлов всё равно должны быть включены, но они не содержат приватных средств доступа.*

**2. Что делать, если нет доступа к определённым коллекциям или документам в Firestore, хотя пользователь авторизован?**  
*Проверьте Firebase Security Rules. Ошибки “Permission denied” свидетельствуют о неправильных правилах доступа. Проверьте, что правило разрешает — например, uid пользователя совпадает с частью пути в коллекции.*

**3. Почему пуш-уведомления не приходят на iOS, хотя всё работает на Android?**  
*iOS требует настройки APNs, регистрации App ID и создания p8/p12 сертификата в Apple Developer Console. Также не забудьте запросить и обработать разрешения пользователя на получения уведомлений (messaging().requestPermission()).*

**4. Как выполнить атомарную операцию (например, инкремент числа) в Firestore?**  
*Для этого используйте FieldValue.increment из Firestore:*
```javascript
await firestore().collection('Users').doc(userId).update({
  score: firestore.FieldValue.increment(1),
});
```
*Эта операция безопасна для конкурентного доступа.*

**5. Как разлогинить пользователя и сбросить состояние приложения?**  
*Вызовите auth().signOut(), а затем обновите ваш state или сбросьте навигацию. Пользователь будет полностью разлогинен в приложении:*
```javascript
await auth().signOut();
```
