---
metaTitle: Гайд по push и notifications на React Native
metaDescription: Практическое руководство по работе с push и notifications в React Native - настройка, интеграция, примеры кода и ответы на частые вопросы
author: Олег Марков
title: Гайд по push и notifications на React Native
preview: Подробный гайд по push-уведомлениям и notifications в React Native - настройка, интеграция сервисов, детальные примеры кода и разбор частых ошибок
---

## Введение

Push-уведомления играют ключевую роль в мобильных приложениях, помогая поддерживать связь с пользователем даже тогда, когда приложение неактивно или закрыто. В React Native тема push и локальных уведомлений очень популярна — как среди начинающих, так и среди опытных разработчиков. Здесь есть свои особенности, связанные с кроссплатформенностью, а также масса готовых решений, которые позволяют быстро внедрить такую функциональность.

В этой статье я покажу вам, какие подходы существуют для интеграции push-уведомлений в React Native, разберу самые популярные библиотеки, дам рабочие примеры кода на Android и iOS и объясню основные принципы, которые важно учитывать при работе с уведомлениями. Разберём и push, и локальные notifications, чтобы вы могли разобраться в их сходствах и различиях. Поехали!

## Как работают push-уведомления и notifications

### Теория: чем отличаются push-уведомления от notifications

Смотрите, разница на самом деле довольно простая, но часто вызывает вопросы у новичков:

- **Push-уведомления** (Push Notifications) — приходят на устройство из внешнего сервера (например, вашего backend или через сервисы Firebase Cloud Messaging / Apple Push Notification Service), даже если приложение не запущено. Их цель — донести новую информацию до пользователя.
- **Локальные уведомления** (Local Notifications) — генерируются самим приложением на устройстве; могут использоваться для напоминаний, алертов или событий внутри самого приложения, без необходимости "внешней" доставки.

Давайте рассмотрим архитектуру push-уведомлений на React Native:

1. **Сервер (Backend)** — отправляет push через посредника (например, FCM для Android или APNS для iOS).
2. **Сервис платформы (FCM, APNS)** — пересылает уведомление на нужное устройство.
3. **React Native приложение** — получает уведомление, обрабатывает его, отображает, запускает действия внутри приложения (например, открывает экран, показывает popup и т. д.).

Локальные уведомления обходят этапы 1-2 — всё происходит только на устройстве.

## Обзор популярных решений для уведомлений в React Native

### Основные библиотеки и когда их использовать

На сегодняшний день разработчики чаще всего используют:

- **react-native-push-notification** — популярная кроссплатформенная библиотека, довольно простая, хорошо документирована, поддерживает обе платформы.
- **@react-native-firebase/messaging** и **@react-native-firebase/notifications** — модуль для интеграции Firebase Cloud Messaging, работает и с push, и с data-уведомлениями. Позволяет контролировать большое количество нюансов (например, обработку push в background).
- **notifee/react-native-notifee** — мощная и современная библиотека для работы с notifications, классно подходит для сложных сценариев.
- **expo-notifications** — если вы используете Expo, обязательно обратите внимание на этот модуль.

Советую выбирать библиотеку исходя из ваших задач, требуемого функционала, размера сборки и поддержки features (например, кастомизация уведомлений, взаимодействие с background, integration с FCM).

Теперь перейдём к практической части.

## Интеграция push-уведомлений с помощью `@react-native-firebase/messaging`

Я покажу вам, как реализовать push-уведомления на примере Firebase Cloud Messaging (FCM), потому что большинство современных проектов используют именно эту технологию.

### 1. Установка библиотек

Сначала устанавливаем необходимые пакеты:

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# или
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

Если вы работаете с bare React Native — выполните pod install для iOS:

```bash
cd ios && pod install && cd ..
```

### 2. Настройка FCM в Firebase Console

1. Создайте новый проект в [Firebase Console](https://console.firebase.google.com/).
2. Добавьте Android- и/или iOS-приложение.
3. Загрузите сгенерированный файл `google-services.json` (Android) или `GoogleService-Info.plist` (iOS) в соответствующие каталоги проекта (`android/app/` и `ios/`).
4. Следуйте [официальной документации](https://rnfirebase.io/) для завершения настройки.

### 3. Запрашиваем разрешение на получение уведомлений (iOS)

На Android разрешения нужны только для некоторых сторонних типов уведомлений, а вот на iOS начиная с iOS 10 разрешение — обязательное:

```javascript
import messaging from '@react-native-firebase/messaging';

// Запрашиваем разрешение на уведомления
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    // Пользователь разрешил
    console.log('Authorization status:', authStatus);
  }
}
```

Вызывайте эту функцию при старте приложения. Например, в вашем App.js:

```javascript
useEffect(() => {
  requestUserPermission();
}, []);
```

### 4. Получение токена устройства

FCM использует уникальный device token для доставки уведомлений. Обычно вы отправляете его на бэкенд:

```javascript
async function getFcmToken() {
  const token = await messaging().getToken();
  // Как правило, тут отправляют токен на сервер
  console.log('FCM Token:', token);
  return token;
}
```

Вызовите это после получения разрешения.

### 5. Обработка входящих сообщений

Теперь давайте разберём, как принимать push-сообщения в разных режимах работы приложения.

#### Получение уведомлений в foreground

Если приложение открыто, push-сообщения не показываются автоматически системой — нужно обработать их вручную.

```javascript
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

useEffect(() => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    // Например, покажем popup
    Alert.alert('Новое уведомление', remoteMessage.notification.body);
  });

  return unsubscribe; // Отписка при размонтировании компонента
}, []);
```

#### Обработка уведомлений в background и при закрытом приложении

FCM автоматически отображает уведомления, если их payload содержит ключ `notification`. Если вы хотите обработать нажатие на уведомление, используйте следующий код:

##### Определяем, было ли приложение открыто через уведомление

```javascript
import messaging from '@react-native-firebase/messaging';

useEffect(() => {
  // Когда приложение открывается из уведомления (после kill state)
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        // Здесь можно, например, перейти на нужный экран
        console.log('Приложение открыто из уведомления', remoteMessage);
      }
    });

  // Когда приложение уже в памяти, но свернуто
  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    // Открыть, например, нужный экран на навигаторе
    console.log('Пользователь кликнул на уведомление:', remoteMessage);
  });

  return unsubscribe;
}, []);
```

##### Обработка уведомлений в background (Android)

Чтобы приложение могло реагировать на "тихие" push-сообщения в background, нужно объявить background message handler в самом верхнем уровне файла (например, index.js):

```javascript
// index.js

import messaging from '@react-native-firebase/messaging';

// Этот обработчик должен быть зарегистрирован до запуска JS-движка
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Можно выполнить асинхронные операции
  console.log('Получено сообщение в фоне:', remoteMessage);
});
```

### 6. Тестируем отправку уведомления через Firebase Console

- Зайдите в раздел Cloud Messaging вашего проекта на Firebase
- Нажмите "Send new notification"
- Введите заголовок, текст, выберите ваше приложение (package name / bundle id)
- Отправьте уведомление — оно должно прийти на ваше устройство

Если всё настроено верно, сообщение придёт при любом состоянии приложения.

### 7. Отработка пользовательских сценариев

Покажу пример, как можно реагировать на клик по уведомлению:

```javascript
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';

// Здесь например вы интегрируете переход по notification data
useEffect(() => {
  messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage.data.type === 'order') {
      // Открываем экран заказа
      navigation.navigate('OrderScreen', { orderId: remoteMessage.data.id });
    }
  });
}, []);
```
Обратите внимание, что структуру данных (data) закладываете на этапе отправки push-уведомления с бэкенда.

## Работа с локальными уведомлениями

Часто бывает нужно отправить уведомление "изнутри" приложения — например, напоминание или сообщение о завершении процесса. Вам пригодятся локальные notifications.

Давайте посмотрим, как это делается с помощью, например, библиотеки `react-native-push-notification`.

### 1. Установка библиотеки

```bash
npm install react-native-push-notification
# или
yarn add react-native-push-notification
```

Далее выполните настройку native-части для Android и iOS, как описано в [официальной документации](https://github.com/zo0r/react-native-push-notification).

### 2. Конфигурирование

```javascript
import PushNotification from 'react-native-push-notification';

// Создаем канал (Android Oreo и выше требует)
PushNotification.createChannel(
  {
    channelId: 'default-channel-id', // уникальный id
    channelName: 'Default Channel', // Читабельное имя
    channelDescription: 'A default channel', // Описание
  },
  created => console.log(`createChannel returned '${created}'`)
);
```

### 3. Отправляем локальное уведомление

```javascript
PushNotification.localNotification({
  channelId: 'default-channel-id', // id канала
  title: 'Уведомление', // Заголовок
  message: 'Это локальное уведомление', // Тело уведомления
  playSound: true, // Воспроизводить звук
  soundName: 'default', // Использовать стандартный звук
});
```

Можно добавлять другие поля — например, actions, bigText, дату (для schedule), number (отмечать значком на иконке).

### 4. Запланированные уведомления

```javascript
PushNotification.localNotificationSchedule({
  channelId: 'default-channel-id',
  message: 'Напоминание! Пора что-то сделать.',
  date: new Date(Date.now() + 60 * 1000), // через минуту
});
```

Как видите, синтаксис довольно понятный.

## Важные замечания и особенности

### Требования к настройке платформ

- **iOS**: не забудьте добавить capability "Push Notifications" в Xcode, а также разрешения в Info.plist:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

- **Android**: убедитесь, что сервисы настроены через google-services.json, а разрешения для интернет-доступа прописаны в AndroidManifest.xml.

### Тестирование на устройствах

Emulator Android может работать с push-уведомлениями (если настроен Google Play Services), но лучше тестировать на реальных устройствах, особенно для iOS. Для push на iOS потребуется физическое устройство и Apple Developer Account.

### Настройка фоновых задач

Если вы хотите, чтобы приложение работало с "тихими" уведомлениями (без показа), потребуется добавить дополнительную обработку и фоновый код. К примеру, в iOS для этого требуется `content-available: 1` в payload уведомления, а для Android использовать т.н. data-only уведомления.

### Управление badge (иконка с числом на приложении)

Для работы с badge на иконке используются специальные методы — например:

```javascript
import PushNotification from 'react-native-push-notification';

PushNotification.setApplicationIconBadgeNumber(10); // установить число 10
PushNotification.getApplicationIconBadgeNumber(cb => {
  console.log('Текущее значение badge:', cb);
});
PushNotification.setApplicationIconBadgeNumber(0); // очистить
```

Не забудьте, что для iOS это работает только на реальном устройстве с выданными разрешениями.

### Обработка кастомных действий при нажатии

Вы можете добавить кастомные действия — например, "Открыть", "Архивировать", "Отложить" при свайпе по уведомлению (требует дополнительной настройки и зависит от платформы и используемой библиотеки).

## Заключение

Вы познакомились с основными подходами к интеграции push-уведомлений и локальных notifications в React Native. Перед вами на выбор как минимум несколько библиотек, и каждая из них подходит для разных задач — требуется лишь правильно встроить их в вашу проектную структуру, бэкенд и логику приложения. Не забывайте тестировать реализацию на различных состояниях приложения (foreground, background, kill state) и разных платформах. Помните также о требованиях к настройке native-части, разрешениях пользователя, а при использовании FCM — тщательно следите за актуальностью device token.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как отловить ошибку «Missing Permissions» при работе с push на Android?

Для Android 13 и выше добавьте разрешение POST_NOTIFICATIONS в AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

В коде приложения дополнительно запросите разрешение:

```javascript
import { PermissionsAndroid } from 'react-native';

await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
```

### Как сбросить badge на иконке приложения при прочтении уведомлений?

Для этого используйте соответствующий метод библиотеки:

```javascript
// Для react-native-push-notification
PushNotification.setApplicationIconBadgeNumber(0);
```

Для iOS важно вызвать функцию при открытии приложения или просмотра уведомлений.

### Почему push не приходит на iOS-эмулятор?

Эмулятор iOS физически не поддерживает APNS и push-уведомления вообще. Используйте только реальные устройства с корректно настроенными provisioning profiles и Apple Developer Account.

### Как обработать "тихие" push-уведомления только для background-логики?

На сервере формируйте payload с ключом `content-available: 1` (для iOS) и без notification body (для Android). В React Native регистрируйте background message handler:

```javascript
messaging().setBackgroundMessageHandler(async message => {
  // Фоновая обработка
});
```

### Как получить или обновить FCM token, если он устарел или сброшен?

Слушайте событие обновления токена и отправляйте новый на сервер:

```javascript
messaging().onTokenRefresh(token => {
  // Новый токен — отправьте на backend
});
```

Это позволит серверу всегда иметь актуальный token для рассылки push.