---
metaTitle: Гайд по использованию React Native CLI
metaDescription: Освойте React Native CLI - установка, создание проектов, запуск на Android и iOS, кастомизация, основные команды и практические примеры использования
author: Олег Марков
title: Гайд по использованию React Native CLI
preview: Изучите, как эффективно использовать React Native CLI - от установки до запуска приложений на Android и iOS, кастомизации, управления зависимостями и автоматизации
---

## Введение

React Native CLI — это официальный интерфейс командной строки для работы с фреймворком React Native. С помощью CLI вы можете создавать новые мобильные приложения, управлять зависимостями, запускать проекты на устройствах или эмуляторах, подключать нативные библиотеки и выполнять множество других задач. В отличие от Expo, который изолирует большую часть нативного кода, CLI дает полный доступ к исходникам на Java, Kotlin, Objective-C и Swift. Это делает его крайне важным для разработчиков, которым нужно гибко управлять проектом, внедрять нативные модули, подключать сторонние библиотеки или решать нестандартные задачи.

В этом гайде я подробно покажу, как установить CLI, создать новый проект, запускать приложения на Android и iOS, управлять зависимостями и выполнять ключевые задачи, которые нужны в каждодневной работе. Примеры кода и подробные инструкции помогут разобраться с CLI даже тем, кто только начинает знакомство с React Native.

## Установка React Native CLI

### Проверка требований к системе

Перед началом убедитесь, что у вас установлены необходимые инструменты:

- Node.js (желательно последняя LTS-версия)
- npm или yarn
- Git
- JDK (Java Development Kit), если планируется запуск на Android
- Xcode, если вы хотите разрабатывать для iOS (доступно только на macOS)

Вот как можно проверить наличие Node.js:

```bash
node -v
# выводит текущую версию Node.js
```

React Native CLI - мощный инструмент для создания и управления проектами, но его возможности раскрываются в полной мере только при глубоком понимании принципов работы фреймворка. Без знания основных компонентов, стилизации и навигации, работа с CLI может оказаться затруднительной. Если вы хотите детальнее погрузиться в React Native и освоить все необходимые навыки для создания качественных мобильных приложений — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Gayd-po-ispolzovaniyu-React-Native-CLI). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Установка CLI

React Native CLI рекомендуется ставить глобально:

```bash
npm install -g react-native-cli
# или, если вы используете yarn
yarn global add react-native-cli
```

Проверьте корректность установки так:

```bash
react-native --version
# вывод версии установленных инструментов CLI
```

Если команда не найдена — убедитесь, что папка с npm-глобальными пакетами находится в PATH.

## Создание нового проекта

Создать базовый проект проще всего одной командой. Она сгенерирует структуру папок, настроит все зависимости и создаст простой стартовый экран.

```bash
react-native init MyFirstProject
# MyFirstProject — это имя вашего будущего приложения
```

После выполнения появится папка `MyFirstProject` со всеми файлами.

#### Краткий разбор структуры проекта

- `android/` и `ios/` — каталоги с кодом для Android/iOS
- `App.js` — основной корневой компонент вашего будущего приложения
- `node_modules/` — все JS-зависимости
- `package.json` — файл зависимостей и скриптов

## Запуск приложения на эмуляторе и устройстве

React Native CLI позволяет запускать проекты как на эмуляторе, так и на физических устройствах — на обоих платформах.

### Запуск на Android

Перед запуском убедитесь, что:

- Android Studio установлен
- Включен Android Emulator ИЛИ подключен реальный Android-устройство с включенной отладкой по USB (developer mode)

Далее выполните:

```bash
cd MyFirstProject
react-native run-android
# Собирает и запускает APK на эмуляторе/подключенном устройстве
```

Если все правильно настроено, через пару минут приложение появится на экране симулятора или реального устройства.

**Замечание:** Иногда при первом запуске нужно подождать, пока Gradle скачает все зависимости. Это может занять достаточно много времени при медленном интернете.

### Запуск на iOS

Для iOS все несколько сложнее:

- Требуется macOS — запуск приложений iOS невозможен на Windows/Linux
- Xcode должен быть установлен и не ниже минимальной версии, поддерживаемой React Native

Команда для запуска:

```bash
cd MyFirstProject
react-native run-ios
# Запускает симулятор iOS с вашим приложением
```

По умолчанию проект запускается на последнем использованном симуляторе. Можно выбрать конкретное устройство так:

```bash
react-native run-ios --device="iPhone 14"
# Запускает проект на выбранном симуляторе iPhone 14
```

#### Проблемы с разрешениями

Если сталкиваетесь с ошибками "Permission denied", попробуйте перезапустить терминал и убедиться, что исходники проекта находятся вне папки с ограниченными правами доступа.

## Ключевые команды React Native CLI

CLI React Native предоставляет целый ряд команд для управления проектом. Далее я собрал основные, которые понадобятся в повседневной работе.

### Запуск Metro Bundler

Metro Bundler — это сборщик JavaScript, который необходим для работы приложения. Обычно при запуске `run-android` или `run-ios` он стартует сам, но иногда его нужно поднять вручную:

```bash
npx react-native start
# Запускает Metro Bundler на порту 8081
```

### Подключение нативных библиотек

До версии 0.60 многие библиотеки нужно было линковать вручную:

```bash
react-native link <package-name>
# Линкует нативные зависимости выбранной библиотеки
```

Однако сейчас большинство пакетов автоматически линкуются благодаря автолинкингу. Тем не менее для legacy-библиотек иногда команда все еще требуется.

### Очищение кеша

Иногда возникает ситуация, когда проект внезапно перестает собираться — помогает очистка Metro Bundler, кеша npm и временных файлов:

```bash
npx react-native start --reset-cache
# Сброс кеша Metro Bundler

cd android && ./gradlew clean
# Чистка артефактов сборки Android
```

## Структура исходного проекта и кастомизация

Когда проект только создан, он уже содержит все, необходимое, чтобы начать разрабатывать. Однако часто возникает потребность изменить базовые настройки: название приложения, иконку, splash screen, bundle id (идентификатор пакета), разрешения и т.д.

### Изменение названия приложения

Поменять имя приложения можно сразу в нескольких местах.

- Для Android: `android/app/src/main/res/values/strings.xml`
- Для iOS: через Xcode или в файле `ios/MyFirstProject/Info.plist`

### Смена идентификатора пакета (Bundle Identifier)

Это уникальный ID для вашего приложения (например, com.example.myapp).

- **Android:** в файле `android/app/build.gradle` и `AndroidManifest.xml`
- **iOS:** в Xcode — в настройках target (General → Bundle Identifier)

Смотрите, что меняется в Gradle:

```groovy
// android/app/build.gradle
defaultConfig {
    applicationId "com.example.myfirstproject" // Ваш идентификатор пакета
    ...
}
```

### Настройка разрешений

Например, если приложению нужен доступ к камере или микрофону:

- **Android:** файл `android/app/src/main/AndroidManifest.xml`
- **iOS:** файл `ios/MyFirstProject/Info.plist`, добавьте ключи NSCameraUsageDescription, NSMicrophoneUsageDescription с описателем для ревью AppStore.

## Добавление и использование сторонних библиотек

React Native поддерживает интеграцию с множеством JS и нативных библиотек.

### Установка библиотеки

В большинстве случаев:

```bash
npm install @react-native-community/geolocation
# или
yarn add @react-native-community/geolocation
```

Если библиотека требует линковки — используйте `react-native link`.

### Использование в коде

```javascript
import Geolocation from '@react-native-community/geolocation';

// Получение текущей геопозиции
Geolocation.getCurrentPosition(
  position => {
    // position - объект с координатами
    console.log(position);
  },
  error => {
    // Обработка ошибки
    console.error(error);
  },
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
);
```

Обратите внимание, что многие библиотеки требуют настройки разрешений в манифестах и Info.plist, иначе работать не будут.

## Настройка запуска проекта на разных устройствах

### Список доступных устройств iOS

Получить список всех доступных симуляторов можно командой:

```bash
xcrun simctl list devices
# Показывает все устройства, на которых можно запускать проект
```

Полученный UDID можно использовать в команде запуска:

```bash
react-native run-ios --udid <UDID>
```

### Запуск на конкретном Android-устройстве

Посмотреть список подключенных устройств/эмуляторов:

```bash
adb devices
# Показывает список доступных Android-устройств
```

Указать определенное устройство:

```bash
react-native run-android --deviceId <ID>
```

## Интеграция с нативным кодом

Одна из главных причин использовать CLI-версию React Native — возможность самостоятельно модифицировать код нативных частей, добавлять свои модули на Java/Kotlin/Swift/Objective-C или интегрировать SDK, которые не доступны на JavaScript.

### Пример добавления собственного Java-модуля (Android)

Чтобы сделать кастомный Bridge-модуль:

1. В Android Studio откройте папку android
2. Создайте новый Java-класс, например CustomModule.java
3. Реализуйте интерфейс ReactContextBaseJavaModule

```java
package com.myfirstproject; // Укажите ваш пакет

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CustomModule extends ReactContextBaseJavaModule {
  public CustomModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "CustomModule";
  }

  @ReactMethod
  public void myNativeMethod() {
    // Ваша нативная логика
  }
}
```

4. Не забудьте зарегистрировать модуль в пакете.

5. В JS используйте через NativeModules.

```javascript
import { NativeModules } from 'react-native';

NativeModules.CustomModule.myNativeMethod();
```

## Работа со средой разработки и Debug

Для отладки CLI-проектов доступны все стандартные средства:

- Hot reload и fast refresh
- Chrome DevTools для JS-отладки
- Flipper для мониторинга состояния приложения, запросов и логов
- Android Studio Profiler и Xcode Instruments для глубокой нативной диагностики

Запустите hot reload через dev-меню (Shake gesture или команда в командной строке).

## Поддержка нескольких сред (окружений)

Обычно на проекте нужны разные сборки для dev, staging, production. Это реализуется с помощью переменных окружения и конфигов.

### Пример для Android

В `android/app/build.gradle` можно добавить productFlavors:

```groovy
android {
    ...
    flavorDimensions "version"
    productFlavors {
        dev {
            applicationIdSuffix ".dev"
            versionNameSuffix "-dev"
        }
        prod {
            // Основной бандл
        }
    }
}
```

Запускайте командой:

```bash
react-native run-android --variant=devDebug
```
## CI/CD и автоматизация

Собирать проект можно на CI-системах — GitHub Actions, GitLab CI, Jenkins, Bitrise, CircleCI и других. Это удобно для автосборки и автотестирования.

Обычно сборка включает:

- yarn или npm install
- сборки `react-native run-android` или gradle/xcode команды
- выгрузку артефактов

## Заключение

React Native CLI — это надежный инструмент для создания, настройки и управления мобильными приложениями на базе React Native. Он открывает полный доступ к исходному коду Android и iOS, делая возможной глубокую кастомизацию, интеграцию нативных библиотек и автоматизацию процессов разработки. Используя CLI, вы получаете гибкость и контроль, которые не доступны через no-code и no-native решения. С помощью примеров, указанных выше, вы сможете уверенно стартовать новый проект, добавить нужные библиотеки и развернуть приложение на нужной платформе.

Освоив React Native CLI, вы сможете значительно ускорить процесс разработки и повысить свою продуктивность. Однако, для создания действительно качественных приложений необходимо не только уметь пользоваться инструментами, но и понимать архитектуру проектов, уметь работать с нативными модулями и оптимизировать производительность. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Gayd-po-ispolzovaniyu-React-Native-CLI) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как исправить ошибку "Unable to load script from assets index.android.bundle" при запуске на Android?**

Попробуйте эти шаги:
- Зайдите в директорию проекта
- Очистите кеш Metro: `npx react-native start --reset-cache` (в отдельном окне терминала)
- Откройте каталог `android` и выполните `./gradlew clean`
- Снова соберите приложение командой `react-native run-android`

**2. Как добавить поддержку iPad для iOS-приложения?**

Откройте проект в Xcode, перейдите к target приложения → General → Deployment Info, выберите устройства "Universal". Также проверьте поддержку адаптивных лэйаутов во всех компонентах вашего UI.

**3. Как сменить минимальную поддерживаемую версию Android/iOS?**

- Для Android: в файле `android/build.gradle` поменяйте `minSdkVersion` и `targetSdkVersion` в блоке `defaultConfig`.
- Для iOS: измените поле `MinimumOSVersion` в `ios/YourProjectName/Info.plist` и параметр deployment target в Xcode.

**4. Что делать, если не работает push-уведомления на Android?**

Убедитесь, что добавили все разрешения и сервисы в `AndroidManifest.xml`, корректно настроили Firebase Cloud Messaging, указали правильный google-services.json в каталоге `android/app`.

**5. Как добавить кастомный шрифт в приложение?**

- Для iOS: добавьте файл шрифта в каталог `ios/YourProject/Resources` и зарегистрируйте его в `Info.plist` в ключе `Fonts provided by application`.
- Для Android: поместите файлы шрифтов в `android/app/src/main/assets/fonts/` и перезапустите сборку.
- После этого используйте шрифт в JS:  
  ```javascript
  <Text style={{ fontFamily: "MyCustomFont" }}>Пример</Text>
  ```
