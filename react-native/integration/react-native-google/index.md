---
metaTitle: Интеграция React Native с сервисами Google
metaDescription: Изучите практические подходы к интеграции React Native с сервисами Google - авторизация, карты, аналитика, уведомления и работа с Google Drive
author: Олег Марков
title: Интеграция React Native с сервисами Google
preview: Научитесь подключать и использовать сервисы Google в React Native для мобильных приложений — подробные инструкции, примеры кода, решения частых проблем интеграции
---

## Введение

Интеграция мобильных приложений с сервисами Google — стандартная задача для современных разработчиков. Большинство приложений требуют авторизации, аналитики, работы с картами или пуш-уведомлениями. React Native предоставляет разработчикам мощные инструменты для кроссплатформенной мобильной разработки, и нередко возникает необходимость добавить поддержку Google сервисов в такие проекты.

В этой статье вы узнаете, как организовать интеграцию между приложением на React Native и основными сервисами Google, а также получите практические примеры настройки и использования популярных API: авторизация через Google, Google Maps, Firebase Cloud Messaging, аналитика с помощью Google Analytics (через Firebase) и подключение Google Drive API. По ходу статьи я буду делиться с вами советами, разбирать примерные куски кода и рассказывать о подводных камнях, которые стоит учитывать.

## Авторизация пользователей через Google

Авторизация пользователей с помощью Google — одна из самых востребованных функций. Это позволяет пользователям входить в приложение через Google-аккаунт, что упрощает процесс регистрации и входа, а вам дает быстрый доступ к профилю пользователя.

Разработка мобильных приложений, интегрированных с сервисами Google, требует глубокого понимания не только React Native, но и нюансов работы с API Google, аутентификации, авторизации и обработки данных. Некорректная настройка может привести к уязвимостям в безопасности или нестабильной работе приложения. Если вы хотите детальнее погрузиться в разработку React Native приложений, которые тесно интегрированы с сервисами Google, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-React-Native-s-servisami-Google). На курсе рассматриваются темы от базовой настройки окружения и компонентов до продвинутых техник работы с нативными модулями, анимацией и публикацией приложений. Вы научитесь создавать сложные UI, эффективно управлять состоянием и использовать возможности Expo Router для навигации. На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Минимальные требования

Для организации авторизации вам потребуется:

- Консоль разработчика Google Cloud Platform (GCP)
- Оформленный OAuth Client ID (тип — Android/iOS)
- Библиотека для интеграции (например, [`react-native-google-signin`](https://github.com/react-native-google-signin/google-signin))

### Пошаговая инструкция интеграции

#### 1. Создание OAuth Client ID в Google Cloud Console

- Перейдите на [console.cloud.google.com](https://console.cloud.google.com)
- Создайте или выберите проект
- Включите API Google Sign-In (OAuth2)
- В разделе "Credentials" добавьте OAuth Client ID — указывая тип (Android/iOS), bundle identifier и hash

#### 2. Установка и настройка библиотеки

Установите пакет:

```bash
npm install @react-native-google-signin/google-signin
```

Для iOS выполните также:

```bash
cd ios && pod install
```

#### 3. Конфигурация в проекте

Импортируйте GoogleSignin и настройте его:

```js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Укажите ваш webClientId
GoogleSignin.configure({
  webClientId: 'ВАШ_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

#### 4. Вход пользователя через Google

```js
async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices(); // Проверка сервисов
    const userInfo = await GoogleSignin.signIn();
    // userInfo содержит информацию о пользователе
    console.log(userInfo);
  } catch (error) {
    // Обработка ошибок при авторизации
    console.error(error);
  }
}
```

- Убедитесь, что вы обрабатываете возможные ошибки, связанные с отсутствием сервисов Google Play на устройстве.
- Интеграция с backend реализуется через токен доступа, который вы получаете после входа.

## Подключение Google Maps в React Native

Google Maps необходимы для отображения карт, геолокационных маркеров и навигации.

### Выбор библиотеки

Самое популярное и поддерживаемое решение — [`react-native-maps`](https://github.com/react-native-maps/react-native-maps), поддерживает Google Maps для iOS и Android.

### Подготовка и получение API ключа

1. В Google Cloud Console включите сервис "Maps SDK for Android" и "Maps SDK for iOS"
2. Создайте API ключ и добавьте его на Android и iOS платформы

### Установка библиотеки

```bash
npm install react-native-maps
cd ios && pod install
```

### Конфигурация Android

В `android/app/src/main/AndroidManifest.xml` добавьте:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="ВАШ_API_КЛЮЧ"/>
```

### Конфигурация iOS

В `AppDelegate.m` добавьте:

```objc
#import <GoogleMaps/GoogleMaps.h>
...

[GMSServices provideAPIKey:@"ВАШ_API_КЛЮЧ"];
```

В `Info.plist` можно добавить правила безопасности, связанные с локацией.

### Пример отображения карты

```jsx
import MapView, { Marker } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 55.751244, // Пример - Москва
    longitude: 37.618423,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  <Marker 
    coordinate={{ latitude: 55.751244, longitude: 37.618423 }}
    title="Москва"
    description="Центр города"
  />
</MapView>
```

- Любой маркер можно связать с пользовательским действием, например, открытием деталей объекта.
- Карта автоматически получает события касания, перемещения, масштабирования.

## Firebase Cloud Messaging — Пуш-уведомления

Firebase Cloud Messaging (FCM) — стандарт для отправки push-уведомлений на мобильные устройства.

### Минимальные шаги по настройке

#### 1. Создайте проект в Firebase и добавьте мобильное приложение

- Для Android и iOS скачайте  `google-services.json` и `GoogleService-Info.plist`
- Подключите их к своим проектам

#### 2. Установка библиотеки

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
cd ios && pod install
```

#### 3. Конфигурация Android

В `android/build.gradle`:

```groovy
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.13'
  }
}
```

В `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.gms.google-services'
```

#### 4. Обработка сообщений в приложении

```js
import messaging from '@react-native-firebase/messaging';

// Запрос разрешения и слушатель входящих сообщений
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Уведомления разрешены');
  }
}

useEffect(() => {
  // Получение токена устройства
  messaging()
    .getToken()
    .then(token => {
      // Сохраните токен на бэкенде для дальнейшей отправки сообщений
      console.log('FCM Token:', token);
    });

  // Слушатель для входящих сообщений при активном приложении
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    // Здесь вы можете показать локальное уведомление
    console.log('Новое уведомление:', remoteMessage);
  });

  return unsubscribe;
}, []);
```

---

## Google Analytics через Firebase в React Native

Сбор аналитических данных — ключ к улучшению продукта. Через интеграцию Firebase Analytics вы получаете отчеты о поведении пользователей, событиях, просматриваемых экранах и прочем.

### Установка и подключение

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
cd ios && pod install
```

### Пример базового использования

```js
import analytics from '@react-native-firebase/analytics';

async function trackLoginEvent() {
  // Отправка события входа
  await analytics().logEvent('login', {
    method: 'Google', // Можно передать дополнительные параметры
  });
}
```

### Автоматический сбор событий

Firebase Analytics автоматически отслеживает много событий (открытие приложения, отключение, обновления), что позволяет не заботиться о ручном описании всех сценариев пользовательского поведения. Но для кастомных событий используйте `logEvent`.

#### Отслеживание экранов вручную

```js
async function onScreenView(screenName) {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
}
```

- Используйте этот метод при реализации собственного роутера или навигации для трекинга переходов между экранами.

## Использование Google Drive API (доступ к облачному хранилищу)

Интеграция с Google Drive позволяет вашим пользователям загружать, скачивать и управлять своими файлами приложения в облаке.

### Основные этапы интеграции

1. Создайте проект и включите Google Drive API в Google Cloud Console.
2. Создайте OAuth Client ID с типом "Web" или "Android/iOS".
3. Настройте библиотеку авторизации для получения access_token (см. выше раздел про Google Sign-In).
4. Используйте стандартные REST-запросы к Google Drive API.

### Пример: Получение списка файлов в Google Drive

Предположим, вы уже получили access_token пользователя.

```js
async function fetchDriveFiles(accessToken) {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      Authorization: `Bearer ${accessToken}`, // Токен авторизации пользователя
    },
  });
  const data = await response.json();
  console.log(data); // Здесь вы получите список файлов пользователя
}
```

- Работа с Google Drive API всегда требует запроса дополнительных прав (scopes), указывайте их на этапе авторизации: `https://www.googleapis.com/auth/drive.readonly` и подобные.

- Для загрузки файлов используйте HTTP POST запросы к `/upload/drive/v3/files` с соответствующими заголовками и телом запроса.

### Готовые решения и нюансы

- В экосистеме React Native нет готовых комплексных оберток для Google Drive, поэтому многие операции придется реализовать через fetch/axios.
- Не забывайте обновлять access_token по мере истечения срока его действия (используйте refresh_token).

## Ограничения и советы по безопасности

### Перечислю несколько ключевых моментов, которые стоит помнить:

- **Храните ключи безопасности только на сервере или в переменных окружения, а не в открытом коде.**
- Для iOS не забудьте добавить необходимые разрешения на использование локации, камеры или push-уведомлений.
- Не используйте базовые Google API ключи на клиенте без ограничений.
- Всегда обновляйте используемые зависимости, чтобы минимизировать уязвимости.

Теперь вы имеете представление о базовых интеграциях Google сервисов с React Native, их настройке и использовании. В каждой из рассмотренных тематик интеграция может быть углублена с помощью дополнительных настроек, зависимости выбранных библиотек и требований вашего продукта. Следите за обновлениями документации и используйте последние версии инструментов.

Создание кроссплатформенных приложений, работающих с Google сервисами, это сложный процесс. После развертывания приложения возникает необходимость в его поддержке и масштабировании. Хотите узнать, как сделать этот процесс более эффективным? Начните с основ, таких как настройка окружения и компонентов, а затем переходите к изучению Expo Router и нативных модулей. Все это и многое другое вы найдете в нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-React-Native-s-servisami-Google). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как протестировать Google Sign-In на устройстве Android без Google Services Framework?

Если ваше устройство не поддерживает сервисы Google Play (например, китайские устройства), стандартная библиотека Google Sign-In работать не будет. В таком случае используйте сторонние или серверные методы авторизации через Google OAuth2, а также подумайте о fallback через email или другие провайдеры.

### Как обновлять access_token для Google API после его истечения?

Access_token, выданный на авторизацию пользователя, обычно живет 1 час. Для обновления токена используйте refresh_token, который нужно сохранить при первой авторизации. Затем обращайтесь к endpoint:
```
POST https://oauth2.googleapis.com/token
```
с параметрами `refresh_token`, `client_id`, `client_secret` и `grant_type=refresh_token`. Получите новый access_token и замените им старый.

### Почему Google Maps не отображается на устройстве iOS, а на Android всё работает?

Проверьте, добавлен ли API ключ через `[GMSServices provideAPIKey]` в AppDelegate.m, а также наличие Maps SDK for iOS в проекте Google Cloud и правильность bundle id. Убедитесь, что pod-файлы были обновлены (`pod install`).

### Как корректно работать c background-уведомлениями в React Native и FCM?

Для Android используйте Headless JS для обработки уведомлений при закрытом приложении. Для iOS потребуется запросить правильные разрешения у пользователя и правильно прописать обработку remote notifications, используя `@react-native-firebase/messaging` c соответствующим конфигом.

### Как ограничить доступ к Google Cloud API только из вашего мобильного приложения?

Используйте в Google Cloud Console ограничения API ключей по package name и SHA-1 (Android) или bundle ID (iOS). Кроме того, ограничьте доступ через правильные OAuth scopes и храните секретные ключи на бэкенде. Не вставляйте private keys/secret в публичное приложение.
