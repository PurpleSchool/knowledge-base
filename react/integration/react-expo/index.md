---
metaTitle: Использование Expo для разработки на React
metaDescription: Подробное руководство по использованию Expo для разработки мобильных приложений на React с примерами кода и объяснениями шагов для начинающих и опытных специалистов
author: Дмитрий Иванов
title: Использование Expo для разработки на React
preview: Узнайте как работать с Expo в мобильной разработке на React — настройка среды, добавление модулей, эмуляция, сборка и публикация приложений с практическими примерами и советами
---

## Введение

Expo — это мощный инструмент для создания мобильных приложений на основе React (React Native) без необходимости сложной настройки среды и взаимодействия с нативным кодом. Если вы хотите быстро запустить свой проект, протестировать его на реальном устройстве или опубликовать в магазинах, Expo может значительно упростить вашу работу. В этой статье я расскажу, как использовать Expo для разработки на React, покажу примеры кода и объясню, за счет чего Expo становится таким удобным инструментом для мобильной разработки.

## Что такое Expo и для чего он нужен

Expo — это оболочка над React Native, которая поставляется с набором инструментов, библиотек и сервисов, направленных на ускорение и упрощение процесса мобильной разработки. Вы работаете с JavaScript и React, а Expo берет на себя совместимость с iOS и Android, сборку, публикацию и многое другое.

### Преимущества Expo

- **Легкая установка и быстрая инициализация проекта**: Не требует настройки нативных SDK для начала работы
- **Множество встроенных API**: Работа с камерой, push-уведомлениями, геолокацией, файловой системой, доступна "из коробки"
- **Горячая перезагрузка и эмуляция**: Мгновенно видите изменения на своем устройстве или в эмуляторе без пересборки проекта
- **Нативные сборки через облако**: Не нужны Xcode или Android Studio для финальной сборки и публикации

### Когда выбирать Expo

Expo отлично подходит для прототипирования, MVP, а также для большинства коммерческих и некоммерческих мобильных приложений, если не требуется тяжелая интеграция с собственными платформенными модулями.

## Установка и начало работы с Expo

### Предварительные требования

Перед началом:

- Установите Node.js (желательно последнюю стабильную версию)
- Желательно иметь установленный Git

### Установка Expo CLI

Expo CLI — это основной инструмент для управления проектами на Expo. Для установки используйте npm или yarn:

```bash
npm install -g expo-cli
# или
yarn global add expo-cli
```

### Создание нового проекта на Expo

Смотрите, я покажу вам, как создать новый проект:

```bash
expo init my-expo-app
```
Вам будет предложено выбрать шаблон. Для начала можно выбрать `blank` — простой шаблон с базовым примером.

Затем переходим в созданную папку:
```bash
cd my-expo-app
```

Запуск проекта:
```bash
expo start
```

Эта команда откроет Metro Bundler в вашем браузере и предоставит удобный QR-код.

### Запуск на устройстве или эмуляторе

#### На устройстве

1. Установите приложение Expo Go из App Store или Google Play.
2. Отсканируйте QR-код, который покажет Expo при запуске проекта.

#### В эмуляторе

- Для Android: установите Android Studio, настройте эмулятор, затем выберите "Run on Android device/emulator" в Metro Bundler.
- Для iOS: требуется macOS с Xcode. В Metro Bundler выберите "Run on iOS simulator".

## Структура проекта Expo

Давайте разберем, что вы получите после создания проекта:

```
my-expo-app/
├── App.js         // Основной компонент приложения
├── package.json   // Список зависимостей и скриптов
├── app.json       // Конфигурация проекта Expo
├── node_modules/
└── ...
```

Основную логику и интерфейс вы будете реализовывать в файле `App.js`. Здесь находится корневой React-компонент.

Вот пример самого простого приложения на Expo:

```javascript
// App.js

import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Здравствуйте с Expo + React Native!</Text>
    </View>
  );
}

// Этот компонент рендерит текст в центре экрана
```

## Работа с API и библиотеками Expo

Expo поставляется с огромным набором модулей для доступа к функциям устройства.

### Добавление библиотек Expo

Для большинства возможностей рекомендуется использовать библиотеки из экосистемы Expo. Например, чтобы использовать камеру:

```bash
expo install expo-camera
```
Это гарантирует, что совместимость модуля будет соответствовать вашей версии Expo SDK.

### Пример: Работа с камерой

Смотрите, как можно подключить камеру:

```javascript
import React, { useRef, useState } from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraExample() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />; // Разрешения еще не запрошены
  }
  if (hasPermission === false) {
    return <Text>Нет доступа к камере</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} />
      <Button
        title="Сделать фото"
        onPress={async () => {
          if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            // Здесь вы получите фото
            console.log(photo.uri); // uri фотографии
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 }
});
```

Обратите внимание, как просто запрашивать разрешение на доступ к камере и делать снимок.

### Использование других API

Аналогично можно использовать push-уведомления, акселерометр, геолокацию и все, что позволяет Expo. Обычно достаточно добавить необходимый модуль через `expo install`, импортировать его и использовать по документации.

## Использование React Navigation и других сторонних библиотек

Expo совместим со всеми популярными библиотеками для React Native.

### Добавление навигации

React Navigation — самый популярный выбор. Вот как его поставить:

```bash
npm install @react-navigation/native
expo install react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack
```

Пример навигации между двумя экранами:

```javascript
import * as React from 'react';
import { View, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Главный экран</Text>
      <Button
        title="Перейти к деталям"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Экран деталей</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Здесь HomeScreen и DetailsScreen доступны для навигации
```
Как видите, навигация с Expo ничем не отличается от React Native.

## Добавление собственных зависимостей и кастомизации

Expo поддерживает установку любых JS-библиотек, которые не используют нативные модули (C, Java, Objective-C, Swift). Если же модуль требует нативной сборки, придется использовать "Bare workflow" — об этом расскажу ниже.

### Яркая настройка интерфейса

Вся кастомизация приложения делается привычно для React: с помощью стилизации компонентов через `StyleSheet`, подключения сторонних JS-библиотек и использования Expo API.

## Сборка и публикация мобильного приложения

Expo делает процесс сборки и публикации простым, даже если у вас нет macOS или Android Studio.

### Облачная сборка

Для создания готового приложения (APK, AAB, IPA) используйте:

```bash
npx expo install expo-cli
npx expo build:android
npx expo build:ios
```

С декабря 2021 Expo рекомендует использовать новую систему EAS Build:

```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

Впервые потребуется зарегистрироваться или войти в свой аккаунт на Expo.

### Публикация в App Store и Google Play

1. Expo или EAS Build сгенерируют для вас файлы для публикации.
2. Полученные файлы можно загружать в Google Play Console или App Store Connect, как если бы они были собраны в Xcode или Android Studio.

### Публикация обновлений "по воздуху"

Expo позволяет обновлять JS-часть приложения без публикации новой версии в сторе:
```bash
expo publish
```
Пользователь получит обновленное приложение при следующем запуске.

## Ограничения и Bare Workflow

Expo покрывает большинство стандартных кейсов, но иногда функционала не хватает. Например, если вам нужен нестандартный доступ к Bluetooth, ARCore или сторонние нативные библиотеки. В этой ситуации существует подход Bare Workflow.

### Bare Workflow: когда и зачем

При инициализации нового проекта можно выбрать "bare-minimum", либо перевести существующий в Bare через `expo eject`. В таком проекте вы получите полный доступ к нативным Android/iOS проектам и сможете устанавливать любые модули React Native.

```bash
expo eject
```

После этого весь нативный код проекта станет доступен для редактирования, и для сборки потребуются Xcode и/или Android Studio.

## Работа с отладкой и тестированием

Expo предлагает удобное средство для быстрой отладки прямо на телефоне или эмуляторе.

- **Hot Reload/Live Reload**: мгновенно видите результат изменений
- **Встроенный DevTools**: Chrome DevTools, React Developer Tools, Flipper
- **Логи в реальном времени**: консоль внутри Metro Bundler

Чтобы посмотреть логи приложения, используйте вкладку "Logs" в терминале или браузере на странице Expo DevTools.

## Работа с переменными окружения и скрытыми данными

Для секретных ключей и значений можно использовать библиотеку `expo-constants` или подключить переменные окружения через `.env` и такие пакеты, как `react-native-dotenv`.

```bash
expo install expo-constants
```

И пример использования:

```javascript
import Constants from 'expo-constants';
console.log(Constants.manifest.extra); // Обычно сюда помещают секреты при сборке
```

## Обновление SDK Expo

Expo выпускает крупные обновления несколько раз в год. Для перехода на новую версию:

1. Смотрите версию в `package.json` и `app.json`
2. Используйте команду:
   ```bash
   expo upgrade
   ```
3. Проверьте совместимость всех используемых библиотек.

Следите за зависимостями: иногда может потребоваться обновить отдельные пакеты вручную.

## Работа с ассетами (картинки, шрифты, аудио)

Expo умеет оптимизировать ассеты. Картинки или другие файлы кладутся в папку assets внутри проекта.

```javascript
import logo from './assets/logo.png';
<Image source={logo} />
```
Для шрифтов используйте модуль `expo-font`:

```bash
expo install expo-font
```

И затем подключение кода:
```javascript
import * as Font from 'expo-font';

Font.loadAsync({
  'Roboto': require('./assets/fonts/Roboto.ttf'),
});
```

## Заключение

Expo — это удобная среда разработки для приложений на React Native, которая позволяет быстро создавать, отлаживать и публиковать мобильные приложения без глубокого погружения в нативную сборку. Она подходит большинству мобильных проектов и существенно снижает порог вхождения в кроссплатформенную мобильную разработку. Если в какой-то момент стандартных возможностей Expo недостаточно, всегда есть путь перехода в Bare Workflow для расширения возможностей.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как подключить сторонний нативный модуль, который не поддерживается в Expo Managed Workflow?**  
Expo Managed ограничивает работу с "голыми" нативными модулями. Для этого используйте команду `expo eject`, чтобы перейти в Bare Workflow. После этого установите модуль как в обычном React Native и следуйте инструкциям по его интеграции.

**2. Можно ли использовать TypeScript в проектах Expo? Как добавить поддержку?**  
Да, поддержка TypeScript встроена. Просто переименуйте основной файл в `.tsx` (например, App.tsx), установите зависимости:
  ```bash
  touch tsconfig.json
  npm install --save-dev typescript @types/react @types/react-native
  ```
  Expo автоматически распознает TypeScript файлы.

**3. Почему некоторые библиотеки требуют установку через expo install, а не npm install?**  
Команда `expo install <pkg>` подберет корректную версию библиотеки, совместимую с вашей версией Expo SDK. Это предотвращает возможные проблемы с несовместимостью библиотек и Expo.

**4. Как реализовать deep linking в приложении Expo?**  
В файле `app.json` в разделе `expo` добавьте свойство `scheme`. Затем настройте `Linking` из React Navigation, передав схему вашему контейнеру навигации. Убедитесь, что уведомили об этом и при публикации.

**5. Как протестировать работу push-уведомлений?**  
Подключите модуль `expo-notifications` через `expo install expo-notifications`. Получайте push-токен на устройстве, используйте сервис [Expo Push Notification Tool](https://expo.dev/notifications), чтобы отправлять тестовые уведомления. Push работает только на реальных устройствах, не на эмуляторах.