---
metaTitle: Сборка APK для Android на React Native
metaDescription: Узнайте как собрать APK для Android на React Native - полная инструкция по настройке, сборке, подписыванию и отладке приложений для начинающих и продвинутых разработчиков
author: Олег Марков
title: Сборка APK для Android на React Native
preview: Подробная инструкция по сборке APK для Android на React Native - настройте окружение, подпишите и соберите приложение с примерами и комментариями
---

## Введение

React Native стал популярной платформой для разработки мобильных приложений — вы пишете код на JavaScript, а приложение работает как на Android, так и на iOS. В этой статье вы узнаете, как собрать APK-файл для Android из проекта на React Native. Я объясню, какие шаги нужно пройти, почему они нужны, поделюсь примерами команд, расскажу про типичные ошибки и дам советы по их устранению. Если вы только начинаете собирать APK или хотите понять тонкости процесса — эта статья будет полезна.

---

## Требования и подготовка окружения

Перед тем как перейти к процессу сборки APK, убедитесь, что ваше рабочее окружение готово.

### Установка Node.js, npm и React Native CLI

Вам понадобятся Node.js и npm (или Yarn), а также React Native CLI.

```bash
# Установите React Native CLI глобально
npm install -g react-native-cli
```
> Убедитесь, что используете Node.js версии, рекомендуемой документацией React Native для вашей версии.

### Установка Java Development Kit (JDK)

Для Android необходим JDK 11 или новее.

```bash
# Для Ubuntu
sudo apt install openjdk-11-jdk
# Для MacOS чаще рекомендуют Homebrew:
brew install openjdk@11
```

Проверьте, что установленная версия JDK корректна:

```bash
java -version
```

### Установка Android Studio и Android SDK

Скачайте Android Studio с официального сайта, установите ее. При первом запуске убедитесь, что установлен Android SDK и менеджер SDK Tools.

- Для работы потребуется Android SDK Platform версии, соответствующие целевому API вашего приложения.
- Установите Android SDK Build-Tools, Platform-Tools и необходимые эмуляторы (если нужно).
- Проверьте переменные окружения: `ANDROID_HOME`, а также добавьте в `PATH` пути к toolchains (`platform-tools`, `tools`).

#### Пример настройки переменных окружения

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
_Добавьте эти строки в `.bashrc`, `.zshrc` или другой профиль вашей оболочки._

---

## Сборка дебаг-версии APK

Когда проект создан и окружение готово, можно сгенерировать debug APK для тестов на устройстве.

### Использование Metro Bundler и запуск APK

Откройте терминал в каталоге проекта и выполните:

```bash
# Для запуска на эмуляторе Android
npx react-native run-android
```

- Эта команда автоматически запустит сборку и установит приложение на подключенное устройство или выбранный в эмуляторе.
- В каталоге проекта после сборки файл с расширением .apk можно найти по адресу:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

- Такой APK не подписан, но подходит для быстрой локальной проверки и отладки.

#### Использование Gradle напрямую

Если приложение не запускается через CLI или нужен только сам файл APK для передачи:

```bash
cd android
./gradlew assembleDebug
```
Апк-файл появится по тому же пути.

---

## Сборка релизной (release) версии APK

Для публикации приложения в Google Play требуется собрать релизный APK и корректно его подписать.

### Шаг 1. Генерация ключа для подписи (Keystore)

В вашем проекте React Native откройте терминал:

```bash
# Сгенерируем приватный ключ
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
- Обязательно запомните пароль, alias и остальные параметры. _Не публикуйте keystore в открытый доступ!_
- Файл keystore поместите в папку `android/app`.

### Шаг 2. Настройка build.gradle

Откройте файл `android/app/build.gradle` и добавьте параметры подписи:

```groovy
android {
  ...
  defaultConfig { ... }
  signingConfigs {
    release {
      storeFile file('my-release-key.keystore') // Путь к вашему keystore
      storePassword 'ВАШ_ПАРОЛЬ_К_ХРАНИЛИЩУ'      // Ваш пароль
      keyAlias 'my-key-alias'                     // Имя ключа
      keyPassword 'ВАШ_ПАРОЛЬ_К_КЛЮЧУ'            // Пароль к ключу
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled enableProguardInReleaseBuilds // true если нужна минификация
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
  }
}
```
_Чтобы не хранить пароли в коде, используйте файл `gradle.properties` и переменные._

#### Пример с gradle.properties

В файл `android/gradle.properties` добавьте:

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=мой_секретный_пароль
MYAPP_RELEASE_KEY_PASSWORD=мой_секретный_пароль
```

И в `android/app/build.gradle`:

```groovy
signingConfigs {
  release {
    storeFile file(MYAPP_RELEASE_STORE_FILE)
    storePassword MYAPP_RELEASE_STORE_PASSWORD
    keyAlias MYAPP_RELEASE_KEY_ALIAS
    keyPassword MYAPP_RELEASE_KEY_PASSWORD
  }
}
```

### Шаг 3. Сборка релизного APK

Перейдите в директорию android и выполните:

```bash
cd android
./gradlew assembleRelease
```
- Через несколько минут релизный APK появится в:

```
android/app/build/outputs/apk/release/app-release.apk
```

Этот файл уже подписан и готов к загрузке в Google Play.

---

## Инспекция, тестирование и оптимизация APK

### Проверка подписи

Перед загрузкой в Google Play обязательно убедитесь, что APK действительно подписан.

```bash
jarsigner -verify -verbose -certs app-release.apk
```
- В результате увидите информацию о ключе и подписи.
- Можно также воспользоваться `apksigner` из Android Build Tools.

### Проверка размера и состава APK

Полезно понять, из чего состоит APK и как уменьшить его размер.

```bash
# Получить информацию о составе пакета
unzip -l app-release.apk

# Использовать bundletool для анализа
java -jar bundletool-all.jar dump manifest --bundle=app-release.apk --output=manifest.txt
```

### Оптимизация Proguard

Если ваш проект использует Proguard, убедитесь, что правила оптимизации настроены корректно — иногда минификация может сломать работу React Native или сторонних библиотек.

В файле `android/app/proguard-rules.pro` добавьте максимально щадящие правила для React Native:

```proguard
# Не оптимизировать классы React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp *; }
-dontwarn com.facebook.react.**
```

---

## Генерация App Bundle (AAB) вместо APK

Google Play теперь требует загрузки Android App Bundle (AAB). Для этого процесс схож, меняется только команда:

```bash
cd android
./gradlew bundleRelease
```
- Получившийся файл появится в:

```
android/app/build/outputs/bundle/release/app-release.aab
```
- Этот файл используйте для публикации в Play Market. APK можно сгенерировать из AAB через Google Play или локальные инструменты.

---

## Запуск и установка APK на устройство

### Использование adb

Для простого тестирования быстро установите APK на подключенное устройство (USB/эмулятор):

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```
Если APK уже установлен, используйте с флагом `-r` для перезаписи:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## Особенности поддержки разных архитектур и версий Android

По умолчанию React Native собирает APK для архитектуры вашего хоста. Чтобы получить APK для всех популярных процессоров (armeabi-v7a, arm64-v8a, x86, x86_64), в файле `android/app/build.gradle` (в блоке defaultConfig) укажите:

```groovy
defaultConfig {
    ...
    ndk {
        abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64" // Сборка под все указанные архитектуры
    }
}
```
- Это увеличит размер финального APK, но сделает его универсальным.
- Можно собирать APK отдельно для каждой архитектуры.

---

## Работа с переменными окружения и .env файлами

Если ваше приложение использует переменные среды (например, различные URL API для продакшн и теста), в React Native часто применяют модуль `react-native-config`.

### Установка

```bash
npm install react-native-config
```

### Использование

В корне создайте .env файл:

```
API_URL=https://api.example.com
```

Теперь обращайтесь к переменным из кода:

```javascript
import Config from "react-native-config";
console.log(Config.API_URL); // https://api.example.com
```

- Для правильной работы помните: переменные окружения инжектируются во время сборки APK. Если поменяли .env — соберите APK заново.

---

## Решение частых ошибок и советы

### 1. Ошибка "SDK location not found"

Убедитесь, что переменная `ANDROID_HOME` верно настроена.

### 2. Проблемы с разрешениями при сборке

Иногда нужно запускать gradlew с правами администратора или давать права на папки:

```bash
chmod +x gradlew
```

### 3. "Unable to merge dex" / "Duplicate class"

Конфликт версий библиотек — проверьте зависимости в `android/app/build.gradle` и `android/build.gradle`.

### 4. Проблемы с Proguard

При минификации могут "ломаться" сторонние модули. Отключите Proguard или добавьте исключения (как указано выше).

### 5. Зависание сборки или ошибки Java Heap Space

Добавьте больше памяти для Gradle:

В `android/gradle.properties`:

```
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
```

---

## Заключение

Вы изучили все этапы сборки APK для Android-приложений на React Native: от подготовки окружения до релизной подписки и загрузки на устройство. Я показал вам ключевые аспекты: создание keystore, настройка gradle, генерация release- и debug-версий, оптимизация и проверка файлов, а также типовые способы решения ошибок. Этот путь универсален для большинства React Native проектов и позволяет максимально автоматизировать и обезопасить процесс релизной публикации приложения.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как собрать APK с нестандартным именем пакета?

Откройте файл `android/app/build.gradle` и в блоке `defaultConfig` укажите новое значение поля `applicationId`. Например:
```groovy
defaultConfig {
    applicationId "com.example.myapp"
    ...
}
```
После этого выполните полную ресборку:  
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

#### Как подключить Google Services (Firebase) при сборке APK?

В корень проекта `android/app/` поместите файл `google-services.json`, затем подключите Google Services в `android/build.gradle` и `android/app/build.gradle`:
```groovy
// android/build.gradle
classpath 'com.google.gms:google-services:4.3.10'

// android/app/build.gradle
apply plugin: 'com.google.gms.google-services'
```
После этих действий проведите сборку APK как обычно.

#### Как увеличить версию приложения при каждой новой сборке?

Измените значения `versionCode` и `versionName` в `android/app/build.gradle`. Например:
```groovy
defaultConfig {
  versionCode 2
  versionName "1.1"
}
```
Изменение `versionCode` обязательно для загрузки каждой новой версии APK в Play Market.

#### Как избавиться от ошибки Duplicate Resource при сборке?

Проверьте все зависимости и убедитесь, что нет конфликтующих файлов ресурсов (например, разных версий одной и той же библиотеки). Обычно помогает явное указание версии библиотеки или чистка кеша Gradle:
```bash
cd android
./gradlew clean
```

#### Как ускорить время сборки APK?

- Используйте кэширование сборки (Gradle Daemon уже включён по умолчанию).
- Установите больше ОЗУ для Gradle через `android/gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4096m
  ```
- Избегайте ненужных зависимостей и крупных изображений в ресурсах.
- Отключайте ненужные архитектуры через `abiFilters` в build.gradle.

