---
metaTitle: Пошаговая инструкция по установке React Native
metaDescription: Подробная инструкция по установке React Native - от подготовки системы до создания первого проекта и запуска на эмуляторе или устройстве
author: Олег Марков
title: Пошаговая инструкция по установке React Native
preview: Следуйте этому подробному гайду для быстрой установки среды разработки React Native под Windows, macOS и Linux и запуска первого приложения
---

## Введение

React Native — это популярный фреймворк от Facebook для кроссплатформенной разработки мобильных приложений. Он позволяет создавать приложения под iOS и Android, используя JavaScript и библиотеку React. Если вы хотите начать разрабатывать мобильные приложения быстро и эффективно, React Native отлично подойдет для этого. В этой статье вы найдете подробную пошаговую инструкцию по установке среды для разработки React Native на Windows, macOS и Linux, узнаете о настройках Android Studio и Xcode, а также о создании и запуске первого проекта.

## Выбор способа установки React Native

Существует два официальных способа установки и запуска приложений на React Native:

- **Использование Expo** — быстрый старт без необходимости настройки Android Studio или Xcode, многие функции доступны "из коробки", но есть ограничения на доступ к нативным возможностям.
- **Использование React Native CLI** — классический способ, требуется настройка нативных инструментов, зато доступен весь функционал.

Давайте разберём оба варианта.

## Требования к системе

Перед установкой убедитесь, что ваш компьютер соответствует минимальным требованиям. Вот общие рекомендации:

- **Для Windows:** требуется Windows 10 или новее, 64-разрядная версия, установленная Visual Studio Code или другой редактор.
- **Для macOS:** macOS 10.14 или новее. Для разработки под iOS — только Mac и установленный Xcode.
- **Для Linux:** официально поддерживается только для Android, необходим Node.js и JDK.

Убедитесь, что у вас установлены:

- Node.js (желательно последняя LTS-версия)
- npm или yarn
- Git

## Установка инструментов (Node.js, npm, Yarn, Git)

### Шаг 1: Установка Node.js и npm

Лучше всего скачать Node.js с официального сайта [nodejs.org](https://nodejs.org/). На странице загрузки выберите LTS-версию (она стабильнее и рекомендуется для большинства случаев).

- На Windows: установите скачанный `.msi`-файл.
- На Mac: используйте `.pkg`-файл или Homebrew:

```bash
brew install node
```
- На Linux: используйте пакетный менеджер вашей системы, например:

```bash
sudo apt update
sudo apt install nodejs npm
```

После установки проверьте версии:

```bash
node -v
npm -v
```

### Шаг 2: Установка Yarn (необязательно, но рекомендуется)

Yarn — это альтернативный пакетный менеджер, который часто используется с React Native.

```bash
npm install --global yarn
```

### Шаг 3: Установка Git

Для Windows скачайте установщик с [git-scm.com](https://git-scm.com/)  
Для MacOS и Linux — используйте Homebrew или apt:

```bash
brew install git
sudo apt install git
```

Проверьте, что всё установлено:

```bash
git --version
```

## Установка React Native через Expo CLI (Быстрый старт)

Expo — это набор инструментов и сервисов, которые позволяют быстро "запустить" приложение.

### Шаг 1: Установка Expo CLI

Установите Expo CLI глобально через npm или Yarn.

```bash
npm install -g expo-cli
# или
yarn global add expo-cli
```

### Шаг 2: Создание нового проекта

```bash
expo init MyAwesomeProject
```
- Выберите шаблон — например, "blank" для пустого проекта или с поддержкой TypeScript.
- Следуйте инструкциям на экране.

### Шаг 3: Запуск приложения

Перейдите в папку созданного проекта:

```bash
cd MyAwesomeProject
expo start
```
- Откроется Metro Bundler в браузере.
- Чтобы запустить на телефоне, установите Expo Go из App Store или Google Play, отсканируйте QR-код.

### Преимущества и ограничения Expo

Expo отлично подходит для быстрого прототипирования и тестирования, не требует настройки эмуляторов. Однако, если вы хотите использовать сложные нативные модули или подключать сторонние нативные библиотеки, вам понадобится использовать React Native CLI.

## Установка React Native через React Native CLI

Этот способ требует настройки Android Studio (для Android) и Xcode (для iOS).

### Шаг 1: Установка React Native CLI

С версии 0.60 и выше React Native CLI больше не нужен как глобальный пакет, но для запуска старых команд можно установить его:

```bash
npm install -g react-native-cli
```

### Шаг 2: Установка Android Studio (для Android)

1. Скачайте и установите Android Studio с [официального сайта](https://developer.android.com/studio).
2. При установке выберите "Android SDK", "Android SDK Platform", "Android Virtual Device".
3. После установки откройте "SDK Manager" и убедитесь, что установлены:
   - Android SDK Platform 33 (или актуальная версия)
   - Android SDK Build-Tools (последняя версия)

4. Добавьте пути к инструментам Android в переменную окружения PATH:

   - **Для Windows:**
     Откройте свойства системы → "Дополнительно" → "Переменные среды" и добавьте путь вида:
     `C:\Users\<ИмяПользователя>\AppData\Local\Android\Sdk\platform-tools`

   - **Для MacOS/Linux:**  
     Добавьте в `.bashrc` или `.zshrc`:

     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

5. Создайте эмулятор Android через AVD Manager, выберите нужное устройство (например, Pixel_3, Android 12).

6. Запустите эмулятор.

### Шаг 3: Установка Xcode (для iOS)

Только для macOS.

1. Установите Xcode из Mac App Store.
2. Откройте Xcode и в разделе Preferences → Locations выберите актуальную командную строку Xcode.
3. Установите командные инструменты:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

### Шаг 4: Установка CocoaPods

Для iOS-проектов требуется CocoaPods. Установите через:

```bash
sudo gem install cocoapods
```

### Шаг 5: Создание нового проекта React Native

```bash
npx react-native init MyAwesomeProject
# или с TypeScript
npx react-native init MyAwesomeProject --template react-native-template-typescript
```

- Дождитесь, пока все пакеты скачаются.
- Перейдите в папку проекта:

```bash
cd MyAwesomeProject
```

### Шаг 6: Запуск приложения на Android

- Запустите эмулятор или подключите реальное устройство (с USB-отладкой).
- Откройте терминал в папке проекта и выполните:

```bash
npx react-native run-android
```

- Если Android Studio настроен правильно, приложение будет собрано и установлено на эмуляторе или устройстве.

### Шаг 7: Запуск приложения на iOS

Только на macOS.

- Запустите симулятор iOS (или подключите iPhone)
- Откройте новый терминал и выполните:

```bash
npx react-native run-ios
```
- Приложение соберется и откроется в симуляторе.

### Шаг 8: Завершение установки — запуск Metro Bundler

Metro — это пакетный сборщик JavaScript для React Native. Обычно он запускается автоматически с помощью `run-android` или `run-ios`, но отдельно его можно запустить командой:

```bash
npx react-native start
```

Эта команда запускает сервер, который раздает JS-код вашему приложению.

## Структура проекта React Native

После создания проекта вы увидите такую структуру:

```
MyAwesomeProject/
├── android/      # нативная часть Android
├── ios/          # нативная часть iOS
├── node_modules/ # зависимости проекта
├── App.js        # основной файл приложения
├── package.json  # параметры проекта
└── ...
```

- Для большей части кода вам нужно работать только с файлами JS/TS.
- Папки `android/` и `ios/` нужны для нативных модулей или кастомизации.

## Популярные команды для работы с React Native

### Установка новых пакетов

```bash
yarn add <package>
# или
npm install <package>
```

### Запуск Metro Bundler

```bash
npx react-native start
```

### Перезапуск приложения на устройстве

```bash
npx react-native run-android
npx react-native run-ios
```

### Сборка APK (Android)

```bash
cd android
./gradlew assembleDebug
```
APK будет в `android/app/build/outputs/apk/debug/`.

### Использование горячей перезагрузки

В режиме разработки вы можете использовать быструю перезагрузку кода (Fast Refresh), чтобы видеть изменения без полной перезагрузки приложения.

## Проверка установки

Вы можете проверить корректность установки, добавив простую строку в файл `App.js`:

```javascript
import React from 'react';
import { View, Text } from 'react-native';

const App = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>
      Hello, React Native!
    </Text>
  </View>
);

export default App;

// Этот компонент отображает текст по центру экрана
```
Запустите проект. Если всё прошло успешно, появится надпись “Hello, React Native!”.

## Решение проблем и типичные ошибки

### Проблемы с переменными окружения

Если при сборке проекта выводятся ошибки, связанные с Android SDK или Java, проверьте, что переменные окружения (`ANDROID_HOME`, `JAVA_HOME`, `PATH`) прописаны корректно.

- В Windows настройте их через "Свойства системы".
- В Mac/Linux — через профиль терминала (`.bashrc`, `.zshrc`).

### Эмулятор не отображается

- Проверьте, что AVD Manager в Android Studio настроен, и эмулятор запущен.
- Иногда помогает перезапуск Android Studio или самого эмулятора.

### CocoaPods не установлены

- Выполните команду:

```bash
cd ios
pod install
```

Если появляется ошибка, попробуйте:

```bash
sudo gem install cocoapods
```

### Проблемы с зависимостями

Если проект не запускается после установки новых пакетов, удалите папку `node_modules`, затем выполните:

```bash
npm install
# или
yarn install
```

## Как обновлять React Native

Разработчику следует регулярно обновлять React Native и его зависимости. Лучше использовать официальные гайды и утилиту [react-native upgrade-helper](https://react-native-community.github.io/upgrade-helper/).

```bash
npx react-native upgrade
```
Перед обновлением обязательно делайте резервные копии проекта.

## Дополнительные ресурсы

- Официальная документация: [reactnative.dev](https://reactnative.dev/)
- Гайд по Expo: [docs.expo.dev](https://docs.expo.dev/)
- Гайд по Android Studio: [developer.android.com](https://developer.android.com/studio)
- Рекомендуемый редактор кода: [Visual Studio Code](https://code.visualstudio.com/)

## Заключение

Установка среды для разработки React Native — процесс, требующий базовых знаний о Node.js, менеджерах пакетов, а в некоторых случаях — о настройке эмуляторов и системных переменных. Самый быстрый старт возможен с помощью Expo, но классический способ через React Native CLI открывает доступ к полному стеку возможностей, включая работу с нативным кодом для Android и iOS. Следуя описанным выше шагам, вы сможете развернуть рабочую среду и создать первый проект, готовый к разработке полноценного мобильного приложения.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Почему `npx react-native run-android` не видит устройство, хотя эмулятор запущен?

Проверьте, что эмулятор действительно работает и определяется системой. Выполните в терминале команду:

```bash
adb devices
```
Если в списке нет ни одного устройства, перезапустите эмулятор. Для Windows проверьте, что Android SDK Platform-Tools добавлен в PATH.

---

### Как подключить библиотеку, которая требует настройки нативного кода?

Для таких библиотек (например, работающих с Bluetooth или push-уведомлениями) часто нужно настраивать Android и iOS проекты отдельно:

1. Установите библиотеку через npm или yarn.
2. Зайдите в папку `ios` и выполните `pod install`.
3. Следуйте инструкциям по добавлению строк в файлы `android/build.gradle` и `MainActivity.java`, если это требуется.

---

### Как поднять локальный API для тестирования приложения?

Используйте такие инструменты, как json-server или Express. Например:

```bash
npm install -g json-server
json-server --watch db.json
```
В React Native используйте адрес `http://10.0.2.2:3000` для эмулятора Android и `http://localhost:3000` для iOS-симулятора.

---

### Почему приложение не видит изменения кода при сохранении файлов?

Убедитесь, что включён режим Fast Refresh (горячей перезагрузки). Если этого не происходит, вручную перезапустите Metro Bundler:

```bash
npx react-native start --reset-cache
```

---

### Как добавить поддержку TypeScript в уже существующий проект?

1. Установите зависимости: `yarn add --dev typescript @types/jest @types/react @types/react-native @types/react-test-renderer`
2. Создайте файл `tsconfig.json` в корне проекта.
3. Переименуйте файлы `.js` на `.tsx` (для компонентов) или `.ts` (для обычных модулей).
4. Исправьте ошибки, появившиеся после перехода на TypeScript.

---