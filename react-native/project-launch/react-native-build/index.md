---
metaTitle: Как собрать React Native приложение
metaDescription: Пошаговое руководство по сборке React Native приложений для Android и iOS - инструкции по настройке окружения и запуску сборки на разные платформы
author: Олег Марков
title: Как собрать React Native приложение
preview: Изучите процесс сборки React Native приложений для мобильных платформ - настройка окружения, сборка для Android и iOS с комментариями к каждому шагу
---

## Введение

React Native — популярный фреймворк для разработки кроссплатформенных мобильных приложений с использованием JavaScript и React. Его главный плюс — возможность создавать приложения сразу под iOS и Android с базой общего кода. Одна из важных задач, с которой сталкивается каждый разработчик, — сборка готового к публикации приложения. Правильно настроить сборку (build) непросто, но это открывает путь к релизу, тестированию и распространению приложения.

В этой статье разберем, как собрать React Native-приложение для двух основных платформ: Android и iOS. Я поделюсь пошаговыми инструкциями для настройки окружения, сборки debug и release версий, а также дам пояснения к наиболее частым ошибкам и особенностям процесса. После прочтения этой статьи у вас будет чёткое представление, как подготовить приложение к публикации или внутреннему тестированию.

## Необходимые инструменты и подготовка

Перед тем как приступить к сборке, вам потребуется установить некоторые инструменты и библиотеки. Привожу список основных компонентов, которые понадобятся:

### Node.js и npm (или Yarn)

React Native основан на JavaScript, поэтому для работы необходим Node.js.

- Скачайте последнюю стабильную версию с [официального сайта Node.js](https://nodejs.org/).
- Обычно вместе с Node.js устанавливается менеджер пакетов npm. Можно использовать альтернативный Yarn, если он вам привычнее.

Проверьте установки:

```bash
node -v   # Показывает установленную версию Node.js
npm -v    # Показывает установленную версию npm
```

### React Native CLI и Expo

Существует два подхода к сборке:
- **React Native CLI** — стандартное решение, дает полный контроль над нативной частью приложения.
- **Expo CLI** — облегчает разработку и сборку, идеален для проектов без глубоких изменений платформенных функций.

В этой статье основной акцент будет на React Native CLI, но я также кратко затрону Expo для общего понимания.

Сборка React Native приложения — важный этап, который требует правильной настройки окружения, знания инструментов и понимания особенностей различных платформ. Важно уметь генерировать APK для Android и IPA для iOS, подписывать приложения и публиковать их в магазинах. Также необходимо учитывать оптимизацию и размеры приложений. Если вы хотите детальнее погрузиться в сборку приложений и другие аспекты React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-sobrat-React-Native-prilozhenie). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

#### Установка React Native CLI

```bash
npm install -g react-native-cli
# Или если используете Yarn
yarn global add react-native-cli
```

#### Установка Expo CLI (опционально)

```bash
npm install -g expo-cli
# Или с Yarn
yarn global add expo-cli
```

### IDE и инструменты для платформ

- **Android Studio** — необходим для работы и сборки Android-версии, содержит SDK и эмулятор. [Скачать тут](https://developer.android.com/studio)
- **Xcode** — только на macOS и нужен для сборки iOS. [Скачать в Mac App Store](https://apps.apple.com/ru/app/xcode/id497799835)

### Java JDK (для Android)

Для сборки Android нужен JDK версии 11 или новее. Обычно Android Studio сам устанавливает нужную версию, но можно проверить в настройках.

### CocoaPods (для iOS)

Для работы с зависимостями iOS-проектов:

```bash
sudo gem install cocoapods
```

### Проверка установки

Проверьте переменные окружения, особенно `ANDROID_HOME` (Android SDK) и пути к Xcode (iOS). Это избавит от части ошибок на этапе сборки.

## Создание и подготовка проекта

### Инициализация нового проекта

Создаём новый проект через CLI:

```bash
npx react-native init MyAwesomeApp
# Вместо MyAwesomeApp можете указать ваше название
```

В каталоге проекта появится структура с папками `android`, `ios`, `App.js` и другими файлами. По умолчанию в проекте уже есть готовый набор конфигураций для сборки под обе платформы.

Если вы используете Expo:

```bash
npx create-expo-app MyAwesomeApp
```

### Проверка работоспособности приложения

Перед тем как собирать релиз, убедитесь, что приложение успешно запускается в debug-режиме:

#### Android

```bash
cd MyAwesomeApp
npx react-native run-android
```

- Приложение установится и запустится на подключенном устройстве или эмуляторе.

#### iOS

```bash
npx react-native run-ios
```

- Либо используйте Xcode и откройте проект из папки `ios`.

### Установка зависимостей для iOS

Для корректной работы iOS-модуля выполните из папки ios:

```bash
cd ios
pod install
cd ..
```

Этот шаг важен для корректного подключения всех зависимостей и нативных библиотек.

## Сборка приложения для Android

Теперь давайте соберем ваше React Native приложение для Android.

### Сборка debug-версии

Debug-версия обычно используется для внутреннего тестирования.

```bash
cd android
./gradlew assembleDebug
```

- Файл APK появится в каталоге `android/app/build/outputs/apk/debug/`.
- Можно установить файл с помощью adb:

```bash
adb install app-debug.apk
```

### Сборка release-версии APK

Release-сборка предназначена для публикации в Google Play или передачи конечным пользователям. Здесь уже будет включено минимальное логирование и оптимизации.

#### 1. Генерация ключа подписи

APK-файл должен быть подписан уникальным ключом. Создайте его командой:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
# Следуйте инструкциям для ввода пароля и информации
```

Файл `my-release-key.keystore` сохраните, он нужен для всех будущих релизов.

#### 2. Указание ключа подписи в проекте

Скопируйте `.keystore` файл (например, в папку `android/app`) и откройте файл `android/gradle.properties` для добавления переменных:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=ваш_пароль
MYAPP_RELEASE_KEY_PASSWORD=ваш_пароль
```

В `android/app/build.gradle` найдите `signingConfigs` и укажите:

```groovy
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE) // указываем путь к keystore
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

#### 3. Сборка release-APK

```bash
./gradlew assembleRelease
# APK будет по пути: android/app/build/outputs/apk/release/app-release.apk
```

#### 4. Обфускация и оптимизация (Proguard)

По умолчанию release-сборка включает минимальную оптимизацию. Для увеличения защиты кода настройте Proguard в файле `proguard-rules.pro`, который находится в папке `android/app`.

#### 5. Генерация App Bundle (AAB)

Для публикации в Google Play сразу рекомендую собирать `AAB`:

```bash
./gradlew bundleRelease
# Файл появится здесь: android/app/build/outputs/bundle/release/app-release.aab
```

## Сборка приложения для iOS

Сборка iOS-приложения требует macOS и установленного Xcode.

### Сборка debug-версии

Для тестирования удобно запускать приложение на симуляторе:

```bash
npx react-native run-ios
# Или через Xcode: Откройте MyAwesomeApp/ios/MyAwesomeApp.xcworkspace, выберите устройство и нажмите "Run"
```

### Сборка release-версии

#### 1. Подготовка и настройки

- Перейдите в папку `ios`
- Откройте проект через Xcode: двойной клик по `MyAwesomeApp.xcworkspace`.
- Проверьте версию целевой платформы и деплоймент-целевую версию (в General > Deployment Info).
- Настройте Bundle Identifier.
- Включите автоматическое управление подписями (Signing & Capabilities). Введите аккаунт разработчика Apple.

#### 2. Сборка release через Xcode

- В левой верхней части выберите устройство (или Generic iOS Device).
- В меню `Product` выберите `Archive`.
- После архивации Xcode откроет Organizer, где вы сможете экспортировать .ipa для загрузки в App Store или для внутреннего распространения.

#### 3. Сборка release через CLI

Есть команды для CLI, но они обычно требуют применения Xcode для финального экспорта. Можно использовать:

```bash
xcodebuild -workspace MyAwesomeApp.xcworkspace -scheme MyAwesomeApp -configuration Release -sdk iphoneos -archivePath $PWD/build/MyAwesomeApp.xcarchive archive
```

- Полученный архив экспортируется в `.ipa` с помощью Xcode или команды `xcodebuild -exportArchive`.

#### 4. Подключение к App Store Connect

Загрузка приложения в App Store происходит через Transporter или напрямую из Xcode. Введите логин разработчика, заполните все необходимые данные в App Store Connect.

#### 5. Настройка Environment Variables

Часто для каждой сборки (debug, release) используются разные значения переменных (например, API эндпоинты, ключи). Используйте пакеты вроде `react-native-config`:

```bash
npm install react-native-config
npx pod-install
```

Создайте `.env` и `.env.production`, а в коде обращайтесь к значениям через:

```javascript
import Config from "react-native-config";
console.log(Config.API_URL);
```

## Особенности сборки с использованием Expo

Expo значительно упрощает сборку приложений, особенно если не требуется нативная интеграция (например, собственные C++ библиотеки, Bluetooth и другое).

### Сборка с помощью Expo

#### 1. Подготовка

Создать проект и установить зависимости:

```bash
npx create-expo-app MyAwesomeApp
cd MyAwesomeApp
npm install
```

#### 2. Запуск приложения

```bash
npx expo start
# Запустится локальный dev-сервер
```

#### 3. Сборка для публикации

Expo предлагает облачную сборку:

```bash
npx expo build:android    # Создает APK или AAB для Android
npx expo build:ios        # Создает .ipa для iOS (требуется Apple аккаунт)
```

Expo также предлагает новые команды через EAS Build:

```bash
npm install -g eas-cli
eas build --platform android    # или ios
# После первой сборки примените eas submit для загрузки билда в магазины
```

#### 4. Получение собранных файлов

После завершения сборки Expo предоставит ссылку на скачивание APK, AAB или IPA через облако.

### Когда стоит выбирать Expo

Expo отлично подходит для быстрого прототипирования, MVP и приложений без сложной нативной логики. Если вы планируете добавлять собственные модули или использовать нестандартные SDK, лучше сразу выбирать React Native CLI.

## Частые ошибки и их устранение

Расскажу о частых ошибках, которые встречаются на этапе сборки.

### 1. "SDK location not found"

**Решение:** добавьте путь к Android SDK в переменную окружения `ANDROID_HOME` и убедитесь, что пути к `platform-tools` и `tools` прописаны в PATH. Пример для `.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 2. "Could not install the app on the device, read the error above for details"

Часто бывает, если не запущен эмулятор или не подключено физическое устройство.

**Решение:** Запустите эмулятор с помощью Android Studio или подключите устройство по USB с включенным режимом разработчика.

### 3. Ошибки с версиями Node.js, npm, Xcode

Разнобой версий часто вызывает сбои.

**Решение:** Используйте рекомендуемые версии из официальной документации React Native (их можно проверить [тут](https://reactnative.dev/docs/environment-setup)). Для Node.js удобно использовать nvm:

```bash
nvm install 18
nvm use 18
```

### 4. Проблемы с CocoaPods

Ошибки "Could not find 'Podfile'" или устаревшие pods.

**Решение:** Из папки ios запускайте:

```bash
pod install
pod update
```

### 5. Подписывание APK не выполнено

Если APK не подписан, то вы не сможете опубликовать приложение на Play Market.

**Решение:** Проверьте файл keystore и настройки `signingConfigs` в build.gradle.

## Заключение

Сборка React Native приложения — процесс, который начинается с настройки системы и инструментов, и завершается получением файлов APK/AAB и IPA, готовых к публикации в магазинах. Основной поток работы повторяется от проекта к проекту, но детали настройки для конкретной платформы и ваших бизнес-требований (к примеру, интеграция с внешними службами, поддержка разных environment) всегда заслуживают внимания.

В этой статье я на практике показал, как вы можете собрать приложение под Android и iOS с нуля. Параллельно я указал возможные подводные камни и дал быстрые решения для наиболее распространённых проблем. Помимо классического CLI-подхода, я затронул и Expo — современный инструмент для быстрой сборки мобильных приложений.

Освоив всё описанное выше, вы сможете уверенно готовить свои приложения к публикации, внутреннему тестированию, CI/CD и дальнейшему развитию.

Сборка проекта является неотъемлемой частью разработки приложения. Для разработки полноценного приложения необходимо также уметь управлять состоянием, обеспечивать навигацию и работать с API. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-sobrat-React-Native-prilozhenie) вы найдете все необходимые знания для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как добавить к проекту стороннюю нативную библиотеку (например, кастомный модуль на Android/iOS)?

1. Для Android положите исходники в папку `android/app/src/main/java`.
2. Внесите изменения в MainApplication.java и зарегистрируйте модуль.
3. Для iOS — создайте podspec и добавьте dependency в Podfile, затем выполните `pod install`.
4. Свяжите JS-код через bridge React Native согласно документации.

### Как очистить кеш сборки, если возникают странные ошибки?

Выполните команды в корне проекта:
```bash
# Для Android
cd android && ./gradlew clean && cd ..

# Для iOS
cd ios && xcodebuild clean && cd ..

# Для npm/yarn
rm -rf node_modules
npm cache clean --force
npm install
```

### Как организовать автоматическую сборку и доставку через CI/CD?

Используйте системы типа GitHub Actions, GitLab CI, Bitrise, Codemagic.
1. В workflow добавьте шаги установки окружения (Node.js, JDK, Xcode).
2. Пропишите команды сборки, аналогичные локальной сборке.
3. Используйте секреты для хранения ключей подписи.
4. Для публикации интегрируйте шаги с Fastlane, Google Play API, App Store Connect API.

### Можно ли собрать iOS-приложение на Windows или Linux?

Нет, финальная сборка .ipa и подписание возможны только на macOS с установленным Xcode. Вы можете разрабатывать бизнес-логику, но финальный билд — только через Mac.

### Что делать, если после обновления React Native сборки ломаются?

1. Проверьте изменения в официальном changelog.
2. Обновите зависимости (npm/yarn, pods).
3. Проверьте, нет ли несовместимых нативных пакетов или устаревших API.
4. Пересоздайте проектную структуру и перенесите код, если конфликт не удаётся устранить.
5. Обратитесь к инструментам `react-native upgrade` и общим рекомендациям сообщества.
