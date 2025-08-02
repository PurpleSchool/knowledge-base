---
metaTitle: Интеграция Java-кода в React Native
metaDescription: Узнайте как подключать нативный Java-код и создавать модули для расширения возможностей React Native приложений с помощью Android
author: Олег Марков
title: Интеграция Java-кода в React Native
preview: Практическое руководство по интеграции Java-кода с React Native – от подключения модулей до передачи данных между JS и Android
---

## Введение

React Native позволяет разрабатывать кроссплатформенные мобильные приложения на JavaScript с нативной производительностью. Однако иногда стандартных возможностей React Native оказывается недостаточно — например, если вы хотите получить доступ к нативным возможностям Android или использовать стороннюю Java-библиотеку. В таких случаях на помощь приходит интеграция нативного Java-кода (Android) прямо в ваше React Native-приложение.

Давайте разберем, как добавить собственный Java-код, создать нативный модуль для Android, вызвать его из JavaScript, передавать данные между Java и JS и правильно обрабатывать ошибки. Я покажу на практике, как это реализовать, с пояснениями для каждого этапа и примерами. Также рассмотрим часто возникающие проблемы и варианты их решения.

## Что такое нативные модули и зачем их использовать

React Native работает по следующему принципу: большая часть логики пишется на JavaScript и исполняется в собственном движке, а для работы с реальными возможностями телефона (Bluetooth, камера, датчики, работа с файловой системой, доступ к сторонним SDK) требуются так называемые нативные модули. 

**Нативные модули** — это специальные интерфейсы на стороне Java (или Kotlin для Android и Objective-C/Swift для iOS), которые экспортируют одну или несколько функций или событий в JavaScript. Используя такие модули, вы расширяете возможности React Native за пределы поддерживаемого набора API.

Интеграция Java-кода в React Native позволяет использовать существующие нативные библиотеки, оптимизировать производительность и расширить функциональность приложений. Однако, для успешной интеграции необходимо понимать, как работает мост между JavaScript и Java, как передавать данные между ними и как обрабатывать исключения. Важно уметь создавать нативные модули, регистрировать их в React Native и правильно типизировать интерфейсы. Если вы хотите детальнее погрузиться в интеграцию Java-кода в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-Java-koda-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Когда вам потребуется интеграция Java-кода

- Использование функций Android, которых нет во внешних RN-библиотеках.
- Необходимость работы с устаревшими или внутренними SDK от производителей оборудования.
- Оптимизация по производительности (например, работа с большими объёмами данных непосредственно на Java).
- Внедрение уже существующей бизнес-логики на Java из других Android-проектов.

## Как добавить собственный Java-код в React Native

Опишу детально процесс включения Java-кода и создания простого нативного модуля для Android. Давайте пройдем этот путь пошагово.

### Создание структуры нативного модуля

#### 1. Переход в проект Android

В корне вашего проекта React Native находится папка **android**. Откройте эту папку в Android Studio или любом удобном редакторе.

#### 2. Создание Java-класса для модуля

Перейдите в директорию:

```
android/app/src/main/java/com/yourproject/
```

Здесь создайте новый файл, например `CustomModule.java`. Вот базовый шаблон:

```java
package com.yourproject; // Указывайте корректный пакет вашего приложения

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class CustomModule extends ReactContextBaseJavaModule {
    public CustomModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        // Это имя используется при импорте модуля в JS
        return "CustomModule";
    }

    @ReactMethod
    public void getGreeting(String name, Promise promise) {
        // Демонстрация простой бизнес-логики
        String greeting = "Hello, " + name + "!";
        promise.resolve(greeting); // Возвращаем результат в JS
    }
}
```

В этом примере:
- `Promise` – это объект, который позволяет возвращать результат в JS-код асинхронно.
- `@ReactMethod` помечает функции, которые можно вызывать из JavaScript.

#### 3. Регистрация модуля

Теперь нужно сообщить React Native, что у нас появился новый модуль. Создайте или откройте файл **CustomPackage.java**:

```java
package com.yourproject;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CustomPackage implements ReactPackage {
   @Override
   public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
      // Сюда добавляется ваш модуль
      List<NativeModule> modules = new ArrayList<>();
      modules.add(new CustomModule(reactContext));
      return modules;
   }

   @Override
   public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
      // Если вы делаете View-компоненты, добавляйте их здесь
      return Collections.emptyList();
   }
}
```

#### 4. Подключение пакета в `MainApplication.java`

В файле `MainApplication.java` найдите метод `getPackages()` внутри класса `ReactNativeHost` и добавьте строку для вашего пакета:

```java
import com.yourproject.CustomPackage;

@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new CustomPackage()); // Подключаем свой пакет
    return packages;
}
```

### Использование созданного модуля в JavaScript

Теперь перейдем на уровень JavaScript — подключим и используем созданный нативный Java-модуль в React Native.

#### 1. Импорт нативного модуля

В JS-коде импортируем нативный модуль через специальный API:

```javascript
import { NativeModules } from 'react-native';

const { CustomModule } = NativeModules;
```

#### 2. Вызов нативной функции

Вызываем функцию, которую мы реализовали на Java:

```javascript
CustomModule.getGreeting('Андрей')
  .then(greeting => {
    // greeting будет содержать строку "Hello, Андрей!"
    console.log(greeting);
  })
  .catch(error => {
    // Здесь можно обработать ошибку, если что-то пойдет не так
    console.error('Ошибка вызова нативного метода:', error);
  });
```

**Обратите внимание**: В случае ошибок на стороне Java используйте `promise.reject("ERROR_CODE", "Ошибка")`, тогда в JS можно отловить ошибку в блоке `catch`.

### Передача данных между Java и JavaScript

В качестве параметров можно передавать строки, числа, объекты (в виде `ReadableMap`/`WritableMap`), массивы и даже промисы.

#### Пример обработки объекта

Покажу, как принимать и отдавать объекты на Java/JS.

**Java:**

```java
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

@ReactMethod
public void processUser(ReadableMap user, Promise promise) {
    String username = user.getString("username");
    int age = user.getInt("age");

    WritableMap result = Arguments.createMap();
    result.putString("summary", "User: " + username + ", age: " + age);
    promise.resolve(result); // Возвращаем объект в JS
}
```

**JS:**

```javascript
CustomModule.processUser({ username: 'Мария', age: 28 })
  .then(result => {
    // result.summary === "User: Мария, age: 28"
  });
```

### Работа с событиями: отправляем события из Java в JS

Допустим, нужно отправить событие в JavaScript из Java-кода (например сообщение о завершении фоновой задачи).

Для этого потребуется использовать `RCTDeviceEventEmitter`. Вот пример:

**Java:**

```java
import com.facebook.react.modules.core.DeviceEventManagerModule;

// Внутри класса модуля
private void sendEvent(String eventName, @Nullable WritableMap params) {
    ReactApplicationContext reactContext = getReactApplicationContext();
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
}
```

Вызвать функцию и передать событие:

```java
@ReactMethod
public void notifyTaskDone() {
    WritableMap params = Arguments.createMap();
    params.putString("result", "Задача завершена");
    sendEvent("TaskDone", params);
}
```

**JS:**

```javascript
import { NativeEventEmitter, NativeModules } from 'react-native';

const { CustomModule } = NativeModules;
const moduleEmitter = new NativeEventEmitter(CustomModule);

useEffect(() => {
  const subscription = moduleEmitter.addListener('TaskDone', (event) => {
    // Получаем уведомление
    console.log('Task done:', event.result);
  });

  // Не забывайте удалять подписку при размонтировании!
  return () => subscription.remove();
}, []);
```

### Работа с асинхронностью: отличие между Callbacks и Promises

React Native поддерживает оба типа — синхронные и асинхронные вызовы. В современных приложениях стоит использовать Promises; однако если для обратной совместимости требуется использовать callbacks, можно сделать так:

**Java:**

```java
import com.facebook.react.bridge.Callback;

@ReactMethod
public void multiply(int a, int b, Callback callback) {
    int result = a * b;
    callback.invoke(result); // Отправляем результат в JS
}
```

**JS:**

```javascript
CustomModule.multiply(2, 3, (result) => {
  // result === 6
});
```

## Лучшие практики по интеграции Java-кода

### Обработка ошибок

Всегда отправляйте подробные сообщения об ошибках через `promise.reject`:

```java
@ReactMethod
public void demoError(Promise promise) {
    try {
        // Ваш код
        throw new Exception("Непредвиденная ошибка");
    } catch (Exception e) {
        promise.reject("DEMO_ERROR", e.getMessage());
    }
}
```

### Проверка типов и входных данных

Проверяйте типы входных параметров на Java, чтобы не возникло исключений во время вызова из JS.

### Использование сторонних библиотек

Если используете внешние Java-библиотеки, не забывайте подключать их через `build.gradle` в разделе `dependencies`:

```gradle
dependencies {
    implementation 'com.some.lib:library:1.2.3'
}
```

### Rebuild/clean после добавления нативного кода

Время от времени после внесения изменений в Java файлы надо запускать команду `cd android && ./gradlew clean` и пересобрать приложение командой `react-native run-android` — иначе изменения могут не примениться.

### Совместимость кода

Если вы планируете использовать модуль только для Android, не забудьте предусмотреть "заглушки" на iOS, чтобы приложение не падало при отсутствии модуля на другой платформе.

## Расширенные возможности: работа с View-компонентами

Можно интегрировать не только логику, но и собственные View-компоненты. Пример будет чуть сложнее, но идейно похоже:

1. Создается Java-класс-наследник из `SimpleViewManager`.
2. Реализуется метод `createViewInstance`.
3. Добавляется менеджер в список возвращаемых через `createViewManagers`.

Подробности обычно нужны отдельно (и для начинающих JS-интеграторов редко используются), но если у вас есть задача отображать кастомный Android-виджет — используйте этот путь.

## Заключение

Интеграция Java-кода в React Native открывает глубокий доступ к возможностям Android и позволяет использовать существующие Java-библиотеки, внутренние SDK или собственные алгоритмы там, где это необходимо. Вы научились создавать кастомные нативные модули, подключать их к JS, обмениваться данными и событиями между Java и JavaScript и обрабатывать возможные ошибки. Подобная интеграция требует строгого соблюдения структуры и чистоты кода, но в результате вы получаете полнофункциональное приложение со всеми Power-возможностями платформы Android.

Важно уметь создавать переиспользуемые компоненты, управлять состоянием, использовать навигацию и понимать основы архитектуры приложений. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-Java-koda-v-React-Native) вы найдете все необходимые знания и навыки для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**Вопрос 1:** Почему мой Java-модуль не виден в JS после добавления?  
**Ответ:** Проверьте:
- Зарегистрирован ли модуль в CustomPackage и добавлен ли пакет в метод `getPackages()` в MainApplication.java.
- Совпадает ли имя пакета в Java-коде с вашим пространством имён.
- Пересобрали ли вы приложение с нуля (`cd android && ./gradlew clean && cd .. && react-native run-android`).

**Вопрос 2:** Как передать сложную структуру объектов между JS и Java?  
**Ответ:** Для JS→Java: используйте объекты JS, которые в Java будут типа ReadableMap (или ReadableArray для массивов). Для Java→JS: возвращайте WritableMap или WritableArray. Не используйте сериализацию/десериализацию JSON вручную.

**Вопрос 3:** Мой модуль вызывает ошибку "Cannot read property of undefined". Что делать?  
**Ответ:** Модуль либо не зарегистрирован, либо не экспортируется под правильным именем, либо вызывается на другой платформе (например, Android-модуль на iOS). Добавьте проверку существования перед вызовом:  
```javascript
if (NativeModules.CustomModule) {
  // Вызов методов
}
```

**Вопрос 4:** Как импортировать стороннюю Java-библиотеку для нативного модуля?  
**Ответ:** Откройте `android/app/build.gradle` и добавьте нужную зависимость в раздел `dependencies`. После этого пересоберите с чисткой проект.

**Вопрос 5:** Можно ли использовать Kotlin вместо Java для нативных модулей?  
**Ответ:** Да, вы можете использовать Kotlin. Вам потребуется добавить Kotlin-плагины и зависимости в build.gradle. Корректно указывайте аннотации и используйте совместимые типы данных для передачи между Kotlin и JavaScript.
