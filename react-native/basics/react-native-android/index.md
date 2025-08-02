---
metaTitle: Настройка React Native для работы с Android
metaDescription: Узнайте как правильно и по шагам настраивать React Native для разработки приложений под Android - инструкции, примеры и лучшие практики
author: Олег Марков
title: Настройка React Native для работы с Android
preview: Подробная инструкция по настройке React Native под Android - от установки зависимостей до запуска приложения на эмуляторе и устройстве
---

## Введение

React Native стал одним из самых популярных фреймворков для кроссплатформенной разработки мобильных приложений. Он позволяет создавать мобильные приложения, используя знакомый многим JavaScript и фреймворк React. Если вы только начинаете работать с React Native, важно понять, как подготовить его к полноценной работе с Android. С первого взгляда весь процесс может показаться сложным из-за количества зависимостей и инструментов, требуемых для разработки. Здесь вы найдете пошаговую инструкцию по настройке среды для Android, чтобы ваши React Native приложения работали на Android-устройствах и эмуляторах.

## Требования к системе

### Операционная система

React Native поддерживает Windows, macOS и Linux. Но для разработки под Android наибольшей популярностью пользуются Windows и macOS.

### Зависимости

Перед началом работы стоит убедиться, что у вас установлены следующие инструменты:

- Node.js (рекомендуется версия LTS)
- npm (устанавливается вместе с Node.js) или yarn
- JDK (Java Development Kit) версии не ниже 11
- Android Studio (с необходимыми SDK)
- Python 2.7 для некоторых зависимостей (редко, но в старых пакетах иногда требуется)
- Git (для работы с кодом и зависимостями)

Смотрите, я сразу покажу, как проверить установку самых важных инструментов.

#### Проверка наличия Node.js и npm

```sh
node -v    # покажет версию Node.js
npm -v     # покажет версию npm
```
Если команды не выводят версию, значит Node.js нужно установить с [официального сайта Node.js](https://nodejs.org/).

#### Проверка наличия Java

```sh
java -version       # покажет версию Java runtime
javac -version      # покажет версию Java компилятора
```
Если обе команды не возвращают версии Java, скачайте JDK с сайта [OpenJDK](https://openjdk.org/) или [Oracle](https://www.oracle.com/java/technologies/downloads/).

#### Проверка Git

```sh
git --version      # покажет версию git
```
Если не установлен, скачайте с [git-scm.com](https://git-scm.com/).

## Установка и настройка Android Studio

### Установка Android Studio

1. Скачайте Android Studio с официального сайта [developer.android.com](https://developer.android.com/studio).
2. Запустите установщик и следуйте инструкциям на экране.

### Первый запуск и настройка Android Studio

- При первом запуске выберите стандартную установку (Standard).
- Дайте согласие на установку нужных SDK и инструментов.

### Установка и настройка Android SDK

Android Studio обычно предлагает установить платформы Android SDK, инструменты командной строки и эмуляторы. Важно убедиться, что установлен Android SDK версии не ниже 23, а также Android SDK Build-Tools.

Перейдите в **SDK Manager**:

- В Android Studio откройте "Configure" — "SDK Manager".
- Проверьте, чтобы были отмечены:
  - Android SDK Platform (API Level 23 или выше)
  - Android SDK Build-Tools (последняя версия)
  - Android SDK Tools

### Установка переменных среды

Android SDK не всегда добавляет свои пути в переменные среды автоматически. Это необходимо сделать самостоятельно.

#### Для Windows

1. Откройте свойства системы.
2. Перейдите во вкладку "Дополнительно" — "Переменные среды".
3. Добавьте переменную среды `ANDROID_HOME`, указывающую на путь к установленному Android SDK, например:

```
C:\Users\ВашеИмя\AppData\Local\Android\Sdk
```

4. Измените переменную среды `Path`, добавив такие пути:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

#### Для macOS / Linux

Вставьте эти строки в ваш `~/.bash_profile`, `~/.zshrc` или `~/.bashrc`:

```sh
export ANDROID_HOME=$HOME/Library/Android/sdk      # Проверьте фактический путь
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
Примените изменения:

```sh
source ~/.zshrc   # или ваша версия файла оболочки
```

### Проверка установки SDK

Проверьте, работает ли команда `adb` (инструмент управления устройствами Android):

```sh
adb --version   # Должен вывести версию adb
```

Если команда не находит `adb`, проверьте правильность путей к `platform-tools`.

## Установка и инициализация проекта React Native

### Установка CLI-инструмента и инициализация проекта

С 2020 года React Native рекомендует использовать `npx`, позволяя запускать последнюю версию CLI без установки пакета глобально.

```sh
npx react-native init MyAwesomeProject
# 'MyAwesomeProject' — имя вашего нового приложения
```
В каталоге появится папка проекта. Перейдите в неё:

```sh
cd MyAwesomeProject
```

Создадутся директорий `android` и другие файлы, необходимые для Android-приложения.

### Структура Android-проекта в React Native

- `android/app` — основной код Android-приложения (манифест, ресурсы, исходники).
- `android/gradle` и файлы конфигурации — настройки сборки, зависимости.
- Все управляется через систему сборки Gradle.

## Первый запуск проекта на Android

### Пуск на эмуляторе

1. Запустите Android Studio и откройте **AVD Manager** (Tools → Device Manager).
2. Создайте устройство-эмулятор с нужной версией Android.
3. Запустите эмулятор.

После этого выполните:

```sh
npx react-native run-android
```
Команда соберет приложение и установит его на эмулятор. Если всё работает правильно, увидите экран приветствия React Native.

### Пуск на реальном устройстве

1. Включите **отладку по USB** на своем Android-устройстве (Settings — Developer options — USB debugging).
2. Подключите устройство к компьютеру через USB.
3. Проверьте подключение:

```sh
adb devices
# Список должен содержать ваше устройство со статусом 'device'
```
4. Запустите:

```sh
npx react-native run-android
```
Приложение установится и запустится на реальном устройстве.

## Основные команды и сценарии

### Сборка приложения

- `npx react-native run-android` — сборка и установка дебаг-версии на выбранное устройство или эмулятор.
- `cd android && ./gradlew assembleRelease` — сборка релизной версии APK (для публикации).

### Перезапуск Metro Bundler

Иногда требуется перезапустить Metro Bundler (это сервер для сборки JS-кода):

```sh
npx react-native start
```
- Если вы видите ошибки, попробуйте остановить все Metro Bundler процессы и перезапустить.

### Работа с зависимостями

Добавить сторонний пакет можно стандартно:

```sh
npm install react-native-device-info
npx pod-install    # только для iOS, для Android не требуется
```
Для нативных Android-модулей требуется перезапуск сборки:

```sh
npx react-native run-android
```

### Очистка кешей и переустановка

Если появляется странное поведение, помогает очистка build-кэшей:

```sh
cd android
./gradlew clean
cd ..
npx react-native run-android
```
Этот прием часто решает проблемы с "зависшей" сборкой.

## Настройка эмулятора Android

### Создание эмулятора

В Android Studio:

- Откройте Tools -> Device Manager.
- Нажмите «Create Device».
- Выберите устройство, версию Android (API Level 23+), завершите создание.
- Запустите эмулятор.

### Подключение приложения к эмулятору

Если эмулятор уже работает, `npx react-native run-android` автоматически установит приложение на него. Если несколько эмуляторов/устройств, используйте:

```sh
adb devices
# Посмотреть список устройств
```
Укажите нужное устройство через:

```sh
npx react-native run-android --deviceId=<id>
```

## Основные настройки и файл gradle

### Файл build.gradle

Откройте `android/build.gradle` и `android/app/build.gradle` — эти файлы управляют версиями зависимостей, названием приложения, ключами подписи.

#### Основные поля

- `compileSdkVersion` — версия SDK, с которой собирается приложение (должна совпадать с одной из установленных в SDK).
- `minSdkVersion` — минимальная поддерживаемая версия Android.
- `targetSdkVersion` — версия, на которую приложение оптимизировано.
- `applicationId` — уникальный идентификатор приложения.
- `versionCode` и `versionName` — версии для Play Market.

#### Пример секции defaultConfig:

```groovy
defaultConfig {
    applicationId "com.myawesomeproject" // Идентификатор вашего приложения
    minSdkVersion 21                     // Минимальная версия Android
    targetSdkVersion 33                  // Целевая версия Android
    versionCode 1                        // Код версии для Play Store
    versionName "1.0"                    // Человеко-читаемая версия
}
```

### Управление зависимостями

В файле `android/app/build.gradle` в секции `dependencies` добавляются внешние библиотеки. Большая часть типичных зависимостей поставляется с React Native, но иногда нужно добавить дополнительные.

```groovy
dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-native:+"
    // Пример сторонней библиотеки:
    implementation 'com.google.code.gson:gson:2.9.0'
}
```

## Разбор распространённых проблем

### Частые ошибки сборки Android в React Native

- Несовпадение версий SDK (compileSdk, buildTools)
- Перепутанные пути к `ANDROID_HOME`
- Неправильно настроенные переменные среды
- Неустановленные Build-Tools или Platform-Tools
- Конфликты зависимостей Gradle

#### Как действовать при ошибке "SDK location not found"

- Проверьте переменные среды.
- Перезапустите терминал или IDE.
- Запустите `sdkmanager --list` для проверки установленных SDK.

#### Ошибка "Could not find com.android.tools.build:gradle"

- Проверьте доступ к интернету.
- Перезапустите Android Studio для обновления индексов.

#### Ошибка "Execution failed for task :app:compileDebugJavaWithJavac"

- Часто возникает при несовместимости версий JDK и Gradle.
- Проверьте, что используете поддерживаемую версию JDK (11+).

## Интеграция с нативным Android-кодом

React Native позволяет интегрировать Java-модули напрямую. Основной код располагается в директории `android/app/src/main/java/com/myawesomeproject`. Если нужна особая функциональность:

- Добавьте новый Java-класс (модуль).
- Зарегистрируйте его в пакете приложения.
- Используйте из JS через NativeModules.

Пример простого модуля:

```java
// Пример Java-модуля для Android, android/app/src/main/java/com/myawesomeproject/MyModule.java
package com.myawesomeproject;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class MyModule extends ReactContextBaseJavaModule {
    public MyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "MyModule";
    }

    @ReactMethod
    public void customFunction(String param) {
        // Ваша реализация
    }
}
```
Зарегистрируйте модуль в `MainApplication.java`. После этого модуль будет доступен в JavaScript через `NativeModules.MyModule`.

## Настройка подписи приложения для релиза

Для загрузки приложения в Play Market, необходимо подписать апк-файл.

1. Создайте ключ:

```sh
keytool -genkeypair -v -keystore my-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Поместите файл my-key.keystore в android/app

3. Откройте `android/gradle.properties` и добавьте строки:

```
MYAPP_UPLOAD_STORE_FILE=my-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

4. В `android/app/build.gradle` измените секцию signingConfigs:

```groovy
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
```

5. Соберите релизный apk:

```sh
cd android
./gradlew assembleRelease
```
Файл будет лежать по пути: `android/app/build/outputs/apk/release/app-release.apk`

## Использование Flipper и отладка

React Native поддерживает инструмент Flipper для отладки приложений Android (и iOS). Flipper позволяет просматривать логи, инспектировать SQLite-базу, отслеживать сетевые запросы.

Убедитесь, что в файле `android/app/build.gradle` не отключены зависимости Flipper в debug-конфигурации.

- Flipper запускается автоматически при включенном приложении.

## Заключение

Настройка React Native под Android — процесс, включающий установку и настройку множества компонентов, таких как Android Studio, Java, переменные среды и эмуляторы. Как только разберетесь в структуре проекта и инструментах сборки, разработка и тестирование под Android станут значительно быстрее и проще. Освоив базовую настройку, вы легко интегрируете нативные модули, наладите сборку релиза и публикацию приложения. Следуйте инструкциям, не пропускайте этапы проверки переменных среды и версий инструментов — и вы получите уверенную и продуктивную среду для кроссплатформенной мобильной разработки.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Какой JDK лучше использовать для React Native под Android?

React Native официально поддерживает JDK 11 для Android. Более новые версии (17, 21) могут не поддерживаться некоторыми версиями Gradle. Рекомендуется установить OpenJDK 11 и добавить его в переменную среды JAVA_HOME.

### Как добавить свой файл .aar или .jar (нативную библиотеку) в проект React Native для Android?

Скопируйте .aar или .jar в папку `android/app/libs`, а затем добавьте в секцию dependencies в `android/app/build.gradle` строку:

```
implementation files('libs/имя_файла.aar')
```
Создайте папку libs, если её нет.

### Как исправить ошибку "Could not connect to development server" на эмуляторе? 

В эмуляторе Android используйте адрес `10.0.2.2:8081` вместо `localhost:8081`, так как localhost ссылается на сам эмулятор, а не на вашу машину. Убедитесь, что Metro Bundler запущен (`npx react-native start`).

### Как подключить Hermes для оптимизации производительности?

Откройте `android/app/build.gradle`, найдите строку `enableHermes: false` и замените на `true`. После этого выполните очистку проекта (`cd android && ./gradlew clean`) и пересоберите приложение. Hermes дает быстрый запуск JavaScript-кода и уменьшение размера apk.

### Как обновить версию React Native без поломки Android-сборки?

Сначала изучите [официальный гайд Upgrade Helper](https://react-native-community.github.io/upgrade-helper/), где показаны все ручные изменения для вашего перехода. После обновления выполните `npm install` и пересоберите приложение. Рекомендуется делать бэкап проекта и поэтапно решать конфликты зависимостей в `build.gradle` и package.json.