---
metaTitle: С чего начать разработку проекта на React Native
metaDescription: Подробное руководство для начинающих по старту разработки мобильного приложения на React Native - включает сетап, примеры кода и ответы на главные вопросы
author: Олег Марков
title: С чего начать разработку проекта на React Native
preview: Узнайте, как шаг за шагом начать разработку мобильного приложения на React Native от подготовки окружения до запуска первых компонентов. Читайте с примерами и лайфхаками
---

## Введение

React Native — это популярный фреймворк для разработки кроссплатформенных мобильных приложений с использованием JavaScript и React. Он позволяет создавать приложения под Android и iOS из единой кодовой базы, что облегчает поддержку, масштабирование и ускоряет выпуск новых продуктов. Если вы знакомы с основами JavaScript и, возможно, уже работали с React на вебе, вам будет легко перейти к мобильной разработке с помощью React Native. В этой статье я расскажу, как правильно стартовать проект на React Native, начиная с подготовки окружения и заканчивая созданием первых компонентов приложения. Мы разберём основные инструменты, рассмотрим рабочий процесс и затронем нюансы, на которые стоит обратить внимание на старте.

## Установка и подготовка окружения

Перед тем, как начать кодить, нужно подготовить рабочее место. Для React Native поддерживается несколько способов старта, но для новичков я советую использовать Expo: это инструмент, который значительно облегчает установку и запуск проекта.

### Установка Node.js и Yarn

Первый шаг — установка Node.js, потому что он необходим для работы React Native.

- Перейдите на [официальный сайт Node.js](https://nodejs.org/) и скачайте последнюю LTS-версию.
- После установки проверьте наличие Node и npm:

```bash
node -v
npm -v
```

- Также очень удобно использовать Yarn вместо стандартного npm:

```bash
npm install -g yarn
```

Yarn ускоряет установку зависимостей и предотвращает некоторые типовые ошибки.

Выбор правильного подхода к старту проекта на React Native - это залог успешной разработки в будущем. Важно учитывать не только базовые знания React, но и понимать особенности нативной разработки, настройки окружения и выбора подходящих инструментов. Если вы хотите детальнее погрузиться в особенности разработки на React Native и получить четкое понимание, с чего начать свой первый проект, чтобы избежать распространенных ошибок — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=S-chego-nachat-razrabotku-proekta-na-React-Native%3F). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Установка Expo CLI

Expo CLI — это инструментальный набор, значительно упрощающий старт новых проектов.

```bash
npm install -g expo-cli
```

После установки можете проверить:

```bash
expo --version
```

### Инициализация нового проекта

Теперь самое время создать новый проект.

```bash
expo init MyFirstProject
```

Expo предложит выбрать шаблон. Для начала отлично подойдёт `blank` (пустой) или “blank (TypeScript)”, если вы уже немного знакомы с TypeScript.

```bash
cd MyFirstProject
yarn start
```

Откроется Metro Bundler — это локальный сервер, который собирает ваше приложение. Вы увидите QR-код, который можно отсканировать через приложение Expo Go на телефоне.

### Запуск приложения на эмуляторе или устройстве

- **Устройство:** скачайте Expo Go из App Store или Google Play, отсканируйте QR-код на экране Metro Bundler.
- **Эмулятор:** для Android установите Android Studio, для iOS — Xcode. Expo CLI умеет запускать ваше приложение на эмуляторе автоматически (через команды «Run on Android device/emulator» или «Run on iOS simulator»).

Это всё, теперь у вас локально работает стартер-приложение React Native.

## Структура проекта React Native

Давайте посмотрим, что находится внутри нового приложения. Папка нового проекта содержит такие файлы и каталоги:

- `App.js` — основной компонент приложения.
- `package.json` — описание зависимостей и скриптов.
- `assets/` — папка для статических файлов (картинки, шрифты и т. д.).
- `node_modules/` — папка с установленными библиотеками.

Вы работаете в основном с `App.js` или `App.tsx` (если выбрали TypeScript). Вот базовая структура:

```javascript
import React from 'react';
import { Text, View } from 'react-native';

// Это главный компонент приложения
export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Привет, React Native!</Text>
    </View>
  );
}
```

Всё приложение начинается с этого компонента, а дальше вы подключаете и создаёте новые.

## Основные концепции: компоненты и стилизация

React Native перенимает большую часть концепций React, но с некоторыми отличиями из-за особенностей мобильных платформ.

### JSX и компоненты

Вы описываете интерфейс через так называемый JSX-синтаксис, который похож на HTML, но с определёнными ограничениями и собственными стилями.

```javascript
import { View, Text } from 'react-native';

export default function Welcome() {
  return (
    <View>
      <Text>Добро пожаловать!</Text>
    </View>
  );
}
```

- `View` — аналог `<div>` в веб-разработке, контейнер для группировки элементов.
- `Text` — компонент для отображения текста, обязательно оборачивать текст в этот компонент.

### Стилизация компонентов

Всё, что касается внешнего вида, задаётся через JavaScript-объекты в стиле CSS-in-JS:

```javascript
import { StyleSheet, View, Text } from 'react-native';

export default function StyledComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Заголовок</Text>
    </View>
  );
}

// Здесь создаются стили для компонентов
const styles = StyleSheet.create({
  container: {
    flex: 1,              // Занимает все доступное пространство
    justifyContent: 'center', // Центрирует по вертикали
    alignItems: 'center',     // Центрирует по горизонтали
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    color: '#333'
  }
});
```

- Всё оформление задаётся через StyleSheet.create().
- Свойства максимально похожи на CSS, но используют camelCase (например, `backgroundColor` вместо `background-color`).

### Работа с состоянием

Как и в React, состояний компонента (state) управляется через хуки, например, useState.

```javascript
import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function Counter() {
  // Здесь создается состояние счетчика
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>Счетчик: {count}</Text>
      <Button
        title="Увеличить"
        onPress={() => setCount(count + 1)}
      />
    </View>
  );
}
```

- `useState` позволяет добавлять состояние прямо в функциональный компонент.
- `Button` — стандартная кнопка для мобильного интерфейса.

## Навигация между экранами

Мобильные приложения с одной страницей — редкость, поэтому нужно организовать навигацию между экранами. Для этого чаще всего используется библиотека React Navigation.

### Установка React Navigation

Запустите эти команды в папке проекта:

```bash
yarn add @react-navigation/native
expo install react-native-screens react-native-safe-area-context
yarn add @react-navigation/native-stack
```

### Базовый стек-навигация

Создадим две страницы и настроим переход между ними.

#### HomeScreen.js

```javascript
import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View>
      <Text>Главная страница</Text>
      <Button
        title="Перейти к деталям"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}
```

#### DetailsScreen.js

```javascript
import React from 'react';
import { View, Text } from 'react-native';

export default function DetailsScreen() {
  return (
    <View>
      <Text>Это страница деталей</Text>
    </View>
  );
}
```

#### Подключение навигации в App.js

```javascript
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import DetailsScreen from './DetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- В компоненте `NavigationContainer` оборачивается всё приложение.
- `Stack.Navigator` — навигация по принципу стека (push/pop), как в мобильных ОС.

## Работа с данными и асинхронность

В мобильных приложениях вам понадобится работать с сервером — получать и отправлять данные. Для этого обычно используется fetch или другие http-клиенты (axios).

### Пример запроса к API

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function DataLoader() {
  const [data, setData] = useState(null); // Состояние для данных
  const [loading, setLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    // Здесь выполняется запрос к API
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then((response) => response.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View>
      <Text>Данные: {data.title}</Text>
    </View>
  );
}
```

- `ActivityIndicator` показывает индикатор загрузки, пока данные ещё не получены.
- Все стандартные методы JavaScript (fetch, promise) работают так же, как на вебе.

## Работа с платформенными отличиями

React Native даёт единый API, но иногда потребуется что-то особенное для iOS или Android.

### Пример: специфичные стили для платформ

```javascript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    backgroundColor: Platform.OS === 'ios' ? 'blue' : 'green'
    // Для iOS цвет синий, для Android — зелёный
  }
});
```

- `Platform.OS` содержит строку "ios" или "android".
- Подобные проверки позволяют адаптировать поведение под разные устройства.

## Хранение данных на устройстве

Для хранения локальных данных (например, токенов или пользовательских настроек) часто используют библиотеку AsyncStorage.

### Быстрый пример использования

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Сохранение данных
await AsyncStorage.setItem('@userToken', 'abc123');

// Чтение данных
const token = await AsyncStorage.getItem('@userToken');
```

- AsyncStorage асинхронный: все методы возвращают промисы.
- Хранить большие объёмы данных (например, медиафайлы) здесь не рекомендуется.

## Работа с медиа-ресурсами

Добавление изображений и иконок обычно осуществляется через компонент `Image`:

```javascript
import { Image } from 'react-native';

<Image
  source={require('./assets/logo.png')}
  style={{ width: 100, height: 100 }}
/>
```

- Для локальных файлов используйте `require`.
- Для изображений из интернета — объект с ключом `uri`:

```javascript
<Image
  source={{ uri: 'https://example.com/image.png' }}
  style={{ width: 100, height: 100 }}
/>
```

## Разработка собственного UI и выбор библиотек

React Native помогает быстро собирать интерфейс, но с помощью сторонних UI-библиотек можно значительно упростить себе задачу.

- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native Elements](https://reactnativeelements.com/)

### Установка React Native Elements (пример):

```bash
yarn add react-native-elements
expo install react-native-vector-icons
```

Добавьте базовый компонент в приложение:

```javascript
import { Button } from 'react-native-elements';

<Button
  title="Главная кнопка"
  onPress={() => alert('Нажато!')}
/>
```

- Библиотеки обычно имеют хороший набор готовых компонентов: кнопки, карточки, списки и так далее.

## Подключение сторонних библиотек

Expo поддерживает множество нативных модулей. Для редко встречающихся кейсов иногда потребуется использовать "eject" — переход к bare workflow, когда можно писать нативный код (Java/Kotlin или Swift/Obj-C).

- Узнайте, поддерживается ли нужная библиотека в Expo ([список поддерживаемых модулей](https://docs.expo.dev/versions/latest/)).

## Подготовка к сборке и публикация

Когда прототип готов, его можно протестировать на устройстве, а затем собрать релизные версии.

- Expo Go подходит для разработки, но в релизе приложение должно идти отдельным APK (Android) или IPA (iOS).

### Сборка приложения с использованием Expo

- Зарегистрируйтесь/войдите на [Expo](https://expo.dev/).
- Запустите:

```bash
eas build --platform android
eas build --platform ios
```

- Следуйте подсказкам: Expo соберёт и даст ссылку на скачивание готового файла.

- Для дальнейшей загрузки в App Store или Google Play потребуется выполнить дополнительные шаги (создание учётных записей разработчика и настройки профилей подписи).

## Заключение

Начать создавать мобильное приложение на React Native можно буквально за несколько минут, если использовать Expo. В вашем распоряжении знакомый React-подход, большое количество готовых компонентов и масса обучающих материалов. Освоив базовую структуру проекта, принципы навигации и стилизации, вы сможете быстро прототипировать даже сложные приложения. Взаимодействие с устройством, настройка навигации и подключение библиотек происходит схоже с веб-разработкой, а самое главное — всё описанное работает как на Android, так и на iOS. Теперь у вас есть план действий и практические инструменты для старта работы с React Native.

Начало разработки проекта - это только первый шаг. Для создания полноценного приложения необходимо освоить множество технологий и подходов, включая работу с навигацией, данными, анимацией и нативными функциями. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=S-chego-nachat-razrabotku-proekta-na-React-Native%3F) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### 1. Как подключить и использовать шрифты в Expo-проекте?

Expo предоставляет модуль для работы с кастомными шрифтами — `expo-font`. Установите его:

```bash
expo install expo-font
```

Далее загрузите шрифт при старте приложения:

```javascript
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading'; // Для отсрочки рендера

const [fontsLoaded] = Font.useFonts({
  'MyFont': require('./assets/fonts/MyFont.ttf')
});

if (!fontsLoaded) {
  return <AppLoading />;
}
// Теперь используйте в style: { fontFamily: 'MyFont' }
```

#### 2. Почему приложение не видит подключенную картинку?

Проверьте:
- Правильный путь: путь к файлу должен быть относительным, например, `require('./assets/logo.png')`
- Расширение файла: некоторые форматы не поддерживаются или требуют дополнительных библиотек.
- `metro.config.js`: иногда нужно добавить расширения в whitelist.

#### 3. Как сделать call native code, если Expo не поддерживает нужный модуль?

В такой ситуации переходите на bare workflow с помощью команды:

```bash
expo eject
```

Затем устанавливайте сторонние нативные модули стандартными инструментами npm/yarn и описывайте нативный код для Android/iOS внутри каталога android/ios соответственно.

#### 4. Как протестировать push-уведомления?

Expo поддерживает тестовые push-уведомления через сервис Expo Notifications. Подключите:

```bash
expo install expo-notifications
```

Зарегистрируйтесь на [Expo Notifications](https://expo.dev/notifications), получите токен и можете отправлять тестовые пуши из личного кабинета или через curl-запрос.

#### 5. Как оптимизировать производительность приложения?

- Используйте FlatList вместо ScrollView для больших списков.
- Следите за числами рендеров — используйте React.memo и useCallback.
- Оптимизируйте изображения (сжимайте, конвертируйте).
- Не грузите тяжёлые JS-библиотеки без необходимости. 
- Реже используйте анонимные функции в рендере — злоупотребление ими снижает производительность.
