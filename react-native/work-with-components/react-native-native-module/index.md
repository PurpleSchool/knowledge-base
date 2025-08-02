---
metaTitle: Создание и настройка нативного модуля в React Native
metaDescription: Подробная инструкция по созданию и настройке native module в React Native - интеграция с платформенным кодом, примеры, тонкости работы
author: Олег Марков
title: Создание и настройка native module на React Native
preview: Освойте создание и подключение собственных нативных модулей в React Native - добавляйте функциональность, которой нет в JS-библиотеках, и интегрируйте Java, Swift или Objective C код в мобильное приложение
---

## Введение

Разработка приложений на React Native дает возможность использовать преимущества кроссплатформенного подхода, позволяя писать большую часть функционала на JavaScript. Однако бывают ситуации, когда для реализации той или иной задачи необходимо обратиться к "нативному" коду — к возможностям конкретной платформы (Android или iOS), которые не доступны из коробки через JavaScript.

В таких случаях на выручку приходят **native modules** — особый механизм React Native, который позволяет подключать и использовать собственные фрагменты кода на Java, Kotlin, Objective-C или Swift внутри вашего React Native проекта.

В этой статье вы узнаете:
- Для чего нужны native modules
- Как создать собственный native module для Android и iOS
- Как связать этот модуль с JavaScript
- Какие существуют типовые ошибки, как их избегать и устранять

В статье покажу инструкцию на примере простого модуля, который возвращает строку с платформенной информацией, и дам рекомендации по дальнейшему развитию и тестированию native modules.

## Зачем использовать Native Modules

Прежде чем перейти к коду, давайте чуть подробнее разберемся, когда native modules действительно нужны:

- **Нет подходящего JS-решения** — Бывает, что необходимый вам API или функционал еще не реализованы никакой существующей библиотекой React Native.
- **Требуется доступ к специальным возможностям устройства** — Например, работа с Bluetooth Low Energy, системными сервисами, технологическими датчиками.
- **Улучшение производительности** — Критичные к скорости задачи можно выполнять на платформенном языке, а затем возвращать результат в JS.
- **Бриджинг SDK** сторонних производителей, когда у библиотеки есть только Android/iOS SDK, но нет поддержки React Native.

Попробуем реализовать на практике — пусть наш native module возвращает строку с названием платформы и простой информацией о версии.

Создание и настройка native module открывает огромные возможности для расширения функциональности React Native приложений, позволяя использовать нативный код для доступа к аппаратным ресурсам, оптимизации производительности и интеграции с существующими нативными библиотеками. Для успешного создания native module необходимо понимать архитектуру React Native, уметь писать код на Objective-C/Swift или Java/Kotlin и правильно связывать его с JavaScript кодом. Если вы хотите детальнее погрузиться в создание native module и узнать другие продвинутые техники React Native разработки — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-i-nastroyka-native-module-na-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Процесс создания native module в React Native

Я разобью инструкцию на отдельные разделы для Android и iOS. Обычно их делают в рамках одной папки в проекте, название — по желанию, например, `native-modules` или `myNativeModules`.

### Шаг 1. Подготовка проекта

Первый шаг универсален и очень простой: создайте новый React Native проект либо используйте уже существующий.

```sh
npx react-native init NativeModuleDemo
cd NativeModuleDemo
```

Если вы просто учитесь, рекомендую отдельный проект: так проще отслеживать изменения.

### Шаг 2. Создание Native Module для Android

#### 2.1 Создание Java-класса модуля

Откройте проект в Android Studio или любом редакторе кода.

Перейдите в папку: `android/app/src/main/java/<ваш_пакет>/`

Создайте Java-файл, например `PlatformInfoModule.java`.

```java
package com.nativemoduledemo; // используйте ваш пакет

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

// Класс модуля должен наследоваться от ReactContextBaseJavaModule
public class PlatformInfoModule extends ReactContextBaseJavaModule {
    PlatformInfoModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        // Это имя будет использоваться в JS для импорта модуля
        return "PlatformInfo";
    }

    // Для JS-метода используйте @ReactMethod
    @ReactMethod
    public void getPlatformInfo(Promise promise) {
        try {
            String info = "Android v" + android.os.Build.VERSION.RELEASE;
            promise.resolve(info);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }
}
```
**Комментарии к коду:**
- `getName()` возвращает название модуля.
- Механизм через `Promise` — стандартный способ передавать асинхронный результат в JS.

#### 2.2 Регистрация модуля в пакете

Чтобы RN узнал о модуле, создайте новый Java-файл: `PlatformInfoPackage.java`

```java
package com.nativemoduledemo;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// Реализация пакета для регистрации нативного модуля
public class PlatformInfoPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new PlatformInfoModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(
            ReactApplicationContext reactContext) {
        return Collections.emptyList(); // ViewManager не используется
    }
}
```
Этот пакет связывает модуль с RN.

#### 2.3 Добавление пакета в приложение

Теперь подключите пакет в основной файл приложения — `MainApplication.java`.

Внутри метода `getPackages()` добавьте ваш пакет:

```java
import com.nativemoduledemo.PlatformInfoPackage; // Импортируйте пакет

// ...

@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();

    // Добавьте вашу строчку после этой
    packages.add(new PlatformInfoPackage());

    return packages;
}
```
Теперь RN узнает о вашем native module.

### Шаг 3. Создание Native Module для iOS

Для iOS частью кода работают с Objective-C или Swift. Наиболее универсально показывать на Objective-C, так как это гарантированно поддерживается во всех проектах.

#### 3.1 Создайте Objective-C файл

Перейдите в `ios/NativeModuleDemo/` и создайте файлы: `PlatformInfo.h` и `PlatformInfo.m`.

```objc
// PlatformInfo.h
#import <React/RCTBridgeModule.h>

// Подключаем протокол RCTBridgeModule
@interface PlatformInfo : NSObject <RCTBridgeModule>
@end
```

```objc
// PlatformInfo.m
#import "PlatformInfo.h"
#import <UIKit/UIKit.h>

@implementation PlatformInfo

// Обязательно, для экспорта модуля в JS
RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(getPlatformInfo,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSString *info = [NSString stringWithFormat:@"iOS v%@", [[UIDevice currentDevice] systemVersion]];
        resolve(info);
    }
    @catch (NSException *exception) {
        reject(@"error", @"Error retrieving platform info", nil);
    }
}

@end
```
**Объяснения:**
- `RCT_EXPORT_MODULE` делает класс видимым в JS.
- `RCT_REMAP_METHOD` позволяет менять имя метода между Objective-C и RN.

#### 3.2 Обновите Podfile

Убедитесь, что ваш Podfile синхронизирован, затем выполните:

```sh
cd ios
pod install
```
Если появятся ошибки компиляции — проверьте правильность путей и имен файлов.

### Шаг 4. Вызов Native Module из JavaScript

Теперь давайте реализуем JS-интерфейс. Еще пример — используем ES6 импорт.

Создайте файл `PlatformInfo.js` в корне проекта:

```javascript
import { NativeModules } from 'react-native';
// Получаем ссылку на нативный модуль
const { PlatformInfo } = NativeModules;

export function getPlatformInfo() {
  // Оборачиваем вызов в Promise для удобства использования
  return PlatformInfo.getPlatformInfo();
}
```

Теперь вызовем модуль из компонента:

```javascript
import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { getPlatformInfo } from './PlatformInfo';

export default function App() {
  const [info, setInfo] = useState('Нажмите кнопку для получения данных');

  const handlePress = async () => {
    const platformData = await getPlatformInfo();
    setInfo(platformData);
  };

  return (
    <View style={{padding: 24}}>
      <Button title="Получить информацию о платформе" onPress={handlePress} />
      <Text style={{marginTop: 20}}>{info}</Text>
    </View>
  );
}
```

#### Краткое резюме работы

- **Android:** добавили Java-класс, зарегистрировали его в пакете, подключили пакет в main application.
- **iOS:** реализовали Objective-C класс, ничего регистрировать дополнительно не нужно — RN сам находит модули, если используются макросы `RCT_EXPORT_MODULE`.
- **JS:** используем `NativeModules`, делаем красивую обертку для методов.

### Дополнительные возможности Native Modules

#### Работа с событиями (Event Emitters)

Часто от нативного кода надо не только получать данные по запросу, но и отправлять сообщения (например, пуш-уведомления). Для этого используются event emitter'ы.

Пример для Android:

```java
import com.facebook.react.modules.core.DeviceEventManagerModule;

// Где-то в коде
private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
}
```
В JS слушайте:

```javascript
import { NativeEventEmitter, NativeModules } from 'react-native';

const { YourModule } = NativeModules;
const emitter = new NativeEventEmitter(YourModule);

emitter.addListener('EventName', (data) => {
  // обработка события
});
```

#### Передача и получение данных разного типа

Native modules поддерживают строки, числа, массивы, объекты (в Java — WritableMap, WritableArray), булевы значения.

Пример передачи объекта:

**Android:**
```java
@ReactMethod
public void getUser(Promise promise) {
    WritableMap user = Arguments.createMap();
    user.putString("name", "Ivan");
    user.putInt("age", 25);
    promise.resolve(user);
}
```

**JavaScript:**
```javascript
YourModule.getUser().then(user => {
  console.log(user.name);
});
```

#### Синхронные методы (с оговорками)

Синхронные методы поддерживаются, но **крайне не рекомендуются** и доступны только для TurboModules (новая архитектура RN). Почти все взаимодействия рекомендуется выполнять асинхронно через Promises.

### Ошибки, тонкости и best-practices

- **Обновляйте модули под каждую версию RN** — иногда меняются API.
- Перегруженные методы, большое количество параметров — делайте объектом (map), а не длинным списком аргументов.
- Не делайте тяжелых операций в UI thread — используйте background, если нужно.
- Always handle exceptions и возвращайте информацию об ошибке в promise.reject (Android) или reject (iOS).
- Тестируйте оба варианта (Android/iOS) — API платформы несовместимы.

## Заключение

Native modules расширяют возможности React Native, позволяя решать задачи, для которых стандартных JS API недостаточно. Вы теперь знаете, как создать, зарегистрировать и использовать native module на обеих ключевых платформах. Вы познакомились не только с базовым примером, но и с механикой передачи данных, использования событий и обработки ошибок, что позволяет строить сложные и производительные кроссплатформенные приложения.

Создание native module — сложная задача, требующая глубокого понимания React Native и нативных языков, но для создания полноценного приложения необходимо также уметь управлять состоянием, создавать переиспользуемые компоненты и обеспечивать удобную навигацию. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-i-nastroyka-native-module-na-React-Native) вы найдете все необходимые знания и навыки для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Часто задаваемые технические вопросы

### Как отладить native module, если он не виден в JS?

Откройте консоль Xcode (для iOS) или Logcat Android Studio. Убедитесь, что имя модуля в методе `getName()` (Android) или макросе `RCT_EXPORT_MODULE()` (iOS) совпадает с используемым в JS. Очистите сборку (`cd android && ./gradlew clean` или сбросьте DerivedData в Xcode).

### Как отправить событие из native модуля в JS?

В Android используйте `DeviceEventManagerModule.RCTDeviceEventEmitter`, на iOS — `RCTEventEmitter`. Экспортируйте emitter и добавьте прослушивание в JS через `NativeEventEmitter`.

### Почему не приходят данные из Promise на нативной стороне?

Убедитесь, что вы вызываете либо `promise.resolve(data)`, либо `promise.reject(error)`. Если ни тот ни другой не вызван, JS-дождется ответа и "зависнет".

### Как отправлять сложные структуры данных (объекты, массивы) из native module?

Используйте `WritableMap` и `WritableArray` на Android, на iOS — `NSDictionary`, `NSArray`. В JS будет обычный объект/массив.

### Можно ли использовать Swift или Kotlin для модулей?

Да, поддержка есть. Для Swift: добавьте `@objc` перед классом, убедитесь, что в проекте настроен "Bridging Header". Для Kotlin настройте файл Gradle (Kotlin DSL) и используйте стандартную интеграцию через интерфейс ReactPackage.

---
