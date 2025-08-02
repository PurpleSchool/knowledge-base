---
metaTitle: Как реализовать linking на React Native
metaDescription: Откройте возможности linking на React Native - учитесь работать с deep linking, открытием внешних ссылок, настройкой навигации и интеграцией с другими приложениями
author: Олег Марков
title: Как реализовать linking на React Native
preview: Научитесь реализовывать linking на React Native - подробное руководство по deep linking и использованию Linking API в мобильных приложениях
---

## Введение

В мобильных приложениях часто возникает необходимость открывать внешние ресурсы, интегрироваться с другими приложениями или реагировать на определённые ссылки. В экосистеме React Native этим занимается Linking API. С помощью Linking вы сможете не только открывать внешние URL, но и реализовать deep linking — механизм, благодаря которому приложение может запускаться и выполнять определённые действия по заданным схемам URI. Давайте подробно рассмотрим, как Linking работает, какие есть особенности и как на практике соединить ваше приложение с остальным миром.

## Что такое Linking в React Native

Linking — это модуль, который объединяет ваше приложение с внешними источниками через ссылки (URL). На практике это означает три основных сценария:

- Открытие внешних ссылок (обычных сайтов, номеров телефонов, email и т.д.).
- Получение и обработка ссылок, по которым было запущено приложение (deep linking).
- Взаимодействие между приложениями (например, запускаем карты или мессенджеры).

В основе Linking лежит использование URI-схем и специальных методов API, обеспечивающих взаимодействие с системой мобильного устройства.

## Открытие внешних ссылок через Linking

Самый простой случай использования Linking — открыть внешний адрес (например, сайт или видеоролик).

### Как использовать Linking для открытия URL

Смотрите, я покажу вам, как это реализовать на практике.

```javascript
import { Linking, Button } from 'react-native';

const openWebsite = async () => {
  const url = 'https://reactnative.dev';
  // Проверяем, может ли устройство открыть этот URL
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    // Если поддерживается, открываем сайт в браузере
    await Linking.openURL(url);
  } else {
    // Если нет, например, при ошибке в схеме — выводим сообщение
    alert("Не могу открыть ссылку: " + url);
  }
};

// Внутри компонента размещаем кнопку
<Button title="Открыть сайт React Native" onPress={openWebsite} />
```

#### Что делает этот код:

- `canOpenURL(url)` — проверяет, можно ли открыть этот адрес на устройстве.
- `openURL(url)` — инициирует открытие ссылки.
- Обычно это используется для перехода на сайты, запусков почтового клиента (`mailto:`), звонков (`tel:`), мессенджеров (их схемы).

### Открытие специальных схем

Вы можете открывать приложение по другим схемам. Например, для звонка:

```javascript
await Linking.openURL('tel:88005553535') // Открывает телефонный набор
```

Для отправки письма:

```javascript
await Linking.openURL('mailto:example@example.com')
```

Чтобы открыть карту с координатами, используйте сервисную ссылку платформы, например:

- Для Google Maps (Android):

```javascript
await Linking.openURL('geo:37.484847,-122.148386') // Открывается Google Maps
```

- Для Apple Maps (iOS):

```javascript
await Linking.openURL('http://maps.apple.com/?ll=37.484847,-122.148386')
```

## Deep Linking: запуск и обработка ссылок в приложении

Deep linking — ключевая часть Linking API. Она позволяет запускать ваше приложение через специальные ссылки (схемы), а также реагировать на переходы по таким ссылкам.

### Типы deep linking

В React Native поддерживаются два вида deep linking:

1. **Custom URL Scheme** — собственная схема приложения (`myapp://profile/42`).
2. **Universal Links (iOS) и App Links (Android)** — ссылки на реальные домены (`https://myapp.com/profile/42`), которые открывают приложение, если оно установлено.

### Добавление custom URL scheme

#### Настройка для iOS

1. Откройте Xcode, найдите ваш проект в навигации слева.
2. Перейдите во вкладку **Info** → **URL Types**.
3. Добавьте новый тип URL:
   - В поле **Identifier** — любое название (не влияет на работу).
   - В поле **URL Schemes** — имя схемы (например, `myapp`).

Теперь по переходу на ссылку типа `myapp://profile` система будет запускать ваше приложение.

#### Настройка для Android

Откройте файл `android/app/src/main/AndroidManifest.xml` и добавьте в раздел `<activity ...>` следующий intent-filter:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" />
</intent-filter>
```

Теперь Android будет ассоциировать ваши ссылки с приложением.

### Добавление Universal Links и App Links

Если вам нужно поддержать открытие по обычным https-ссылкам — настройка чуть сложнее, с использованием ассоциированных доменов. Обычно такие сценарии требуют:

- владения доменом
- настройки ассоциаций на вашем сервере

Рекомендуется изучить [официальное руководство по deep linking](https://reactnative.dev/docs/linking#enabling-deep-links) для расширенной интеграции.

### Получение URL, по которому запущено приложение

Когда пользователь запускает приложение по ссылке, React Native позволяет получить этот URL.

```javascript
import { Linking } from 'react-native';

const handleInitialURL = async () => {
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    // Приложение запущено по ссылке initialUrl
    // Можно распарсить ссылку и открыть необходимый экран
    console.log('App launched with URL:', initialUrl);
  }
};
```

### Обработка ссылок во время работы приложения

Чтобы реагировать на новые ссылки, используйте подписку:

```javascript
import { useEffect } from 'react';
import { Linking } from 'react-native';

useEffect(() => {
  // Получаем функцию-обработчик
  const onUrlChange = ({ url }) => {
    // При любом открытии ссылки через scheme (или universal link)
    // Эта функция сработает
    console.log('Received URL:', url);
  };

  // Подписка на событие linking
  const subscription = Linking.addEventListener('url', onUrlChange);

  // Очистка при размонтировании компонента
  return () => {
    subscription.remove();
  };
}, []);
```

Теперь ваше приложение сможет реагировать на любые открытия ссылок, пока оно работает.

#### Парсинг ссылки для навигации

Обычно ссылки содержат информацию о маршруте (`myapp://profile/42`). Чтобы правильно обработать это, нужно выделить параметры и передать их навигации. Вот как это реализовать:

```javascript
import { useNavigation } from '@react-navigation/native';

// Разбор URL и навигация
function handleOpenUrl(url) {
  // Например, url = myapp://profile/42
  const route = url.replace(/.*?:\/\//g, ''); // Убираем схему
  const [screen, param] = route.split('/');

  // Открываем нужный экран через React Navigation
  navigation.navigate(screen, { id: param });
}
```

## Linking в связке с React Navigation

В большинстве современных приложений используется навигация. React Navigation имеет встроенную поддержку deep linking. Давайте рассмотрим, как реализовать интеграцию Linking с React Navigation.

### Подключение Linking к навигации

В конфиг навигатора добавьте секцию linking:

```javascript
import { NavigationContainer } from '@react-navigation/native';

const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'profile/:id',
      Settings: 'settings',
    },
  },
};

// Пример интеграции
<NavigationContainer linking={linking}>{/* ... */}</NavigationContainer>
```

Здесь:

- `prefixes` — список поддерживаемых схем и доменов.
- `config` — сопоставление путей и экранов.

Теперь при запуске приложения по ссылке вроде `myapp://profile/42` или `https://myapp.com/profile/42` соответствующий экран откроется автоматически.

### Пример обработки deep linking в React Navigation

Допустим, ссылка `myapp://profile/12` должна открыть экран профиля с id=12:

```javascript
// В linking.config
screens: {
  Profile: 'profile/:id',
}

// На экране профиля
const ProfileScreen = ({ route }) => {
  // id попадёт в route.params.id
  return <Text>Профиль пользователя #{route.params.id}</Text>;
};
```

Теперь переход по ссылке автоматически перенаправит пользователя на нужный экран.

## Особенности работы Linking на iOS и Android

Хотя Linking работает схожим образом на обеих платформах, есть нюансы:

- **Android** требует обязательно разрешать работу вашего scheme или host через intent-фильтр. Без этого система не предоставит вашему приложению сведения о ссылке.
- **iOS** использует ассоциацию schemes и Universal Links через Xcode, а запуск через universal links требует сертификата и размещённого на сервере файла apple-app-site-association.
- **Universal Links** могут быть перехвачены браузером, если приложение не ассоциировано с доменом.

Если вы протестировали ссылку, но приложение не открылось — проверьте настройки схем и фильтров, а также корректность схемы URL.

## Работа с параметрами в ссылках

Давайте посмотрим, что происходит с параметрами. Часто deep link содержит и путь, и query string (например, `myapp://profile/42?ref=newsletter`).

Вот пример разбора параметров query string:

```javascript
// Функция для парсинга query string
function getQueryParams(url) {
  const params = {};
  url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, k, v) {
    params[k] = v;
  });
  return params;
}

// Применение
const url = 'myapp://profile/42?ref=newsletter';
const queryParams = getQueryParams(url);
// queryParams.ref === 'newsletter'
```

## Проверка поддержки scheme перед открытием

Не все схемы поддерживаются устройством. Перед открытием схемы всегда используйте `canOpenURL`:

```javascript
const supported = await Linking.canOpenURL('whatsapp://send?text=Hello');
if (supported) {
  await Linking.openURL('whatsapp://send?text=Hello');
} else {
  alert('У вас не установлен WhatsApp');
}
```

## Открытие других приложений через Linking

Linking позволяет открывать другие приложения, если вы знаете их схему. Примеры популярных схем:

- WhatsApp: `whatsapp://send?text=Hello`
- Telegram: `tg://resolve?domain=username`
- Instagram: `instagram://user?username=yourname`

Не забудьте проверить поддержку через `canOpenURL`.

## Особенности публикации deep linking

- После изменения схемы не забудьте пересобрать приложение.
- Для Universal/App Links требуется обновление app manifests и распространение новых версий приложения.

## Заключение

В React Native Linking — мощный инструмент для взаимодействия вашего приложения с другими ресурсами и мобильными экосистемами. Благодаря Linking вы сможете открывать внешние ссылки, делать интеграцию с другими приложениями, настраивать универсальные и кастомные deep links, автоматически маршрутизировать пользователей в нужные разделы приложения. Настройка Linking требует внимательности к scheme/id, соответствию платформенным правилам, а в сложных сценариях — работы с серверной стороной и файлами ассоциации домена. Надеюсь, теперь взаимодействие вашего приложения с внешним миром станет контролируемым и предсказуемым.

## Частозадаваемые технические вопросы по теме Linking в React Native

#### Как протестировать deep link на эмуляторе или реальном устройстве?

- Для Android используйте команду `adb shell am start -W -a android.intent.action.VIEW -d "myapp://profile/1"` чтобы имитировать открытие ссылки.
- На iOS в симуляторе используйте команду `xcrun simctl openurl booted "myapp://profile/1"`.
- Также можно отправить себе ссылку через email или заметку и открыть её.

#### Почему Linking.openURL не открывает внешнее приложение/ссылку?

- Убедитесь, что схема приложения поддерживается устройством (`canOpenURL`). Например, если открываете WhatsApp, оно должно быть установлено.
- Проверьте правильность схемы, орфографию и наличие соответствующего intent-фильтра на Android или url scheme на iOS.
- Применяйте асинхронную обработку ошибок и ловите исключения через `try/catch`.

#### Как обезопасить обработку deep link от некорректных ссылок?

- Добавляйте проверку, что url — это допустимый маршрут или схема, соответствующая вашему приложению.
- Используйте валидацию параметров и ограничивайте действия внутри приложения в зависимости от источника.

#### Можно ли отключить реакцию на определённые внешние ссылки?

- Да, в конфиге deep linking указывайте только нужные схемы, а в обработчиках фильтруйте или игнорируйте неподходящие url.
- Реализуйте логику, при которой приложение, получив нераспознанную ссылку, ничего не делает или выводит предупреждение.

#### Как реализовать поддержку открытия приложения по push-уведомлениям с deep link?

- Push-уведомления должны содержать url или схему перехода.
- В обработчике уведомления используйте Linking.openURL() с нужным deep link'ом.
- Отдельно проверьте, что при открытии по push обрабатывается нужный payload.

Если сталкиваетесь с ошибками — просмотрите логи, внимательно проверяйте настройки schemes, intent-фильтров и корректность урлов.