---
metaTitle: Создание сложных анимаций с помощью библиотеки React Native Reanimated
metaDescription: Подробное руководство по созданию сложных анимаций в React Native с использованием библиотеки Reanimated - от принципов работы до практических примеров и разъяснений ключевых особенностей
author: Олег Марков
title: Создание сложных анимаций (reanimated) на React Native
preview: Научитесь создавать плавные и сложные анимации в React Native с помощью Reanimated - в статье рассмотрены концепции, примеры кода, советы по производительности и ответы на распространённые вопросы разработчиков
---

## Введение

В мобильной разработке анимации делают приложения более плавными и интерактивными, помогают упростить восприятие интерфейса и могут кардинально улучшить пользовательский опыт. Для создания продвинутых анимаций в экосистеме React Native одной из самых мощных и популярных библиотек является React Native Reanimated.

Reanimated выделяется среди других решений благодаря своему продвинутому API и способности обрабатывать анимации на стороне нативного потока анимации (worklet), что гарантирует высокую производительность даже на сложных интерфейсах и старых устройствах.

В этой статье подробно рассмотрим основные возможности библиотеки Reanimated 2, разберём ключевые концепции (worklets, shared values, анимационные хуки), реализуем примеры сложных анимаций и дадим полезные советы по использованию.

## Установка и базовая настройка

### Зачем Reanimated и когда его стоит использовать

Разработчики часто начинают с базовых Animated API или даже простых CSS-анимаций (через StyleSheet или отдельные библиотеки). Однако эти инструменты ограничены: при попытках создать более сложный взаимодействующий UI, реагирующий на жесты (drag-and-drop, свайпы, перетаскивания, кастомные переходы экранов), вы обнаруживаете проблемы с производительностью или невозможность построить необходимую логику.

Reanimated убирает эти ограничения благодаря своей уникальной архитектуре, позволяя запускать анимационные вычисления вне основного JS-потока, что особенно критично для быстрого отклика интерфейса.

React Native Reanimated - мощная библиотека для создания плавных и производительных анимаций. Она позволяет переносить логику анимации на нативный уровень, что значительно повышает производительность. Чтобы эффективно использовать Reanimated, необходимо понимать принципы работы анимации в React Native и уметь создавать сложные анимационные последовательности. Если вы хотите детально разобраться в создании сложных анимаций с использованием Reanimated и вывести свои React Native приложения на новый уровень — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-slozhnyh-animacij-(reanimated)-na-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Установка библиотеки

Для работы с Reanimated версии 2 и выше используйте официальную инструкцию в зависимости от используемого package manager:

```bash
// Для npm
npm install react-native-reanimated

// Для yarn
yarn add react-native-reanimated
```

После установки обязательно подключите Reanimated в начале главного JavaScript-файла вашего приложения:

```javascript
import 'react-native-reanimated';
```

Далее выполните необходимые шаги по интеграции с Babel (важно для работы worklet-функционала):

1. Откройте babel.config.js вашего проекта и добавьте плагин:
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
```
2. Если вы используете React Navigation — следуйте их дополнительным рекомендациям для корректной работы Gesture Handler и сквозной анимации.

3. Если вы на Expo, убедитесь что используете SDK >= 41 (лучше новее: поддержка Reanimated v2 добавлена в SDK 41+).

Перезапустите packager: это обязательно для корректной работы библиотеки.


## Ключевые концепции архитектуры Reanimated

### Shared Values

Основа системы Reanimated — это shared values. Это специальные «реактивные» значения, которые могут хранить числа, цвета или объекты. Их основная особенность: любое изменение shared value автоматически триггерит обновление всех анимаций и стилей, привязанных к этому значению.

Вот пример создания shared value:

```javascript
import { useSharedValue } from 'react-native-reanimated';

const progress = useSharedValue(0); // progress.value можно изменять, и анимация будет реагировать
```

Значение хранится внутри объекта и доступно через свойство `value` — это важно для правильной работы библиотеки.

### Worklets

Worklet — это специальная функция, которая может выполняться вне основного JS-потока, прямо на стороне анимационного движка. Для библиотеки важно, чтобы код worklet был чистым, без побочных эффектов и не использовал сторонние переменные или функции, не объявленные внутри worklet или не переданные явно (через closure или параметры).

Все функции, которые работают как worklets (например, колбэки для изменений анимации) автоматически определяются благодаря babel-плагину.

Пример worklet:
```javascript
import { runOnJS } from 'react-native-reanimated';

const myWorklet = () => {
  'worklet'; // Специальная директива для работы вне основного потока
  // здесь пишется код, который может быть вызван внутри анимационного цикла
};
```

### Animated Styles

Reanimated использует хуки для описания стилей, зависящих от shared values. Используется хук `useAnimatedStyle`, который позволяет создавать динамические, реагирующие на изменения значения стили.

Смотрите на пример:

```javascript
import { useAnimatedStyle } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => {
  return {
    opacity: progress.value, // автоматически сработает при изменении progress.value
    transform: [{ scale: 1 + progress.value * 0.5 }],
  };
});
```

Затем animatedStyle применяете к любому компоненту через `Animated.View`:

```javascript
import Animated from 'react-native-reanimated';

<Animated.View style={animatedStyle} />
```

### Анимационные хуки и методы

Для обновления shared values с анимацией используйте предоставленные хуки, вроде `withTiming`, `withSpring`, `withDecay`.

- `withTiming` — плавная анимация между значениями за фиксированное время.
- `withSpring` — физическая анимация с эффектом пружины.
- `withDecay` — постепенное убывание (используется для инерции).

Вот краткий пример:

```javascript
import { withTiming, withSpring } from 'react-native-reanimated';

// Например, внутри обработчика onPress
progress.value = withTiming(1, { duration: 500 }); // плавный переход за 500 мс
progress.value = withSpring(0); // возврат к значению 0 с эффектом пружины
```

## Реализация сложной анимации: Drag & Drop с откликом

Теперь давайте реализуем практический пример: анимацию перетаскивания карточки с помощью жеста, когда компонент следует за пальцем и возвращается на место с пружинящей анимацией.

### Создание shared values и animated style

```javascript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function Example() {
  // Shared values для координат
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Анимированный стиль
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 100, height: 100, backgroundColor: 'tomato', borderRadius: 15 }
});
```

### Работа с жестами: интеграция с Gesture Handler

Для отслеживания жестов используйте библиотеку react-native-gesture-handler. Пример ниже показывает, как совместить ее с Reanimated для drag-and-drop:

```javascript
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAnimatedGestureHandler } from 'react-native-reanimated';

// ... прошлый код

const gestureHandler = useAnimatedGestureHandler({
  onStart: (event, ctx) => {
    // ctx — это контекст для хранения данных между обработчиками
    ctx.startX = translateX.value;
    ctx.startY = translateY.value;
  },
  onActive: (event, ctx) => {
    // Прямое изменение координат в ответ на движение пальца
    translateX.value = ctx.startX + event.translationX;
    translateY.value = ctx.startY + event.translationY;
  },
  onEnd: () => {
    // Возврат в начальную точку с эффектом пружины
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }
});

return (
  <PanGestureHandler onGestureEvent={gestureHandler}>
    <Animated.View style={[styles.box, animatedStyle]} />
  </PanGestureHandler>
);
```

Обратите внимание: вся анимационная логика работает вне JS, поэтому нет задержек, лагов, и анимация всегда плавная.

## Сочетание нескольких анимаций и кастомных последовательностей

Иногда необходимо запускать несколько анимаций друг за другом либо одновременно. Для этого библиотека предоставляет утилиты для построения сложных последовательностей, например, `withSequence`, `withDelay`, `withRepeat`.

### Пример последовательного запуска нескольких анимаций

Смотрите, как можно реализовать сложную анимацию с задержкой и циклическим повторением:

```javascript
import { withSequence, withTiming, withDelay, withRepeat } from 'react-native-reanimated';

// Анимируем opacity: появление, пауза, исчезание в цикле
opacity.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 400 }),   // плавно появляемся
    withDelay(600, withTiming(0, { duration: 400 })) // пауза и исчезание
  ),
  3, // три повторения
  false // не задом-наперед
);
```

Аналогично можно составлять гибкие комбинации любых анимационных хуков.

## Использование deriveValue, реакции на изменение shared values

Может возникнуть задача: анимировано реагировать на изменение сразу нескольких переменных или динамически рассчитывать значение на основе других shared values. Для этого применяется хук `useDerivedValue`.

Пример:

```javascript
import { useDerivedValue } from 'react-native-reanimated';

// Вычисляем размер box в зависимости от степени opacity
const boxScale = useDerivedValue(() => {
  return 1 + opacity.value * 0.8; // масштаб изменяется в диапазоне 1..1.8
});
```

Этот подход позволяет эффективно связывать различные анимационные состояния.

## Анимация с пользовательскими кривыми движения

Иногда требуется не просто плавное движение, а использование нестандартных кривых или собственного алгоритма изменения значения. Для этого служит хук `withTiming` с настройкой easing-функций.

```javascript
import { Easing } from 'react-native-reanimated';

// Кастомная функция смягчения (easing)
progress.value = withTiming(1, {
  duration: 800,
  easing: Easing.bounce, // или Easing.inOut(Easing.cubic)
});
```
Это позволяет создавать уникальные по ощущению анимации, добавлять подергивания, bounce-эффекты, реалистичные затухания и др.

## Анимирование входа/выхода компонентов: useAnimatedLayout, FadeIn/FadeOut

В Reanimated 2 появились готовые компоненты для анимации появления и исчезновения элементов (например, для ленты карточек, списков, уведомлений):

```javascript
import { FadeIn, FadeOut } from 'react-native-reanimated';

<Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)}>
  <Text>Появляюсь и исчезаю с fade-анимацией!</Text>
</Animated.View>
```
Воспользовавшись этими компонентами, вы избавляетесь от ручного контроля shared values для самых распространённых видов анимации.

## Производительность, оптимизация и best practices

- Все важные вычисления производите внутри worklet (в колбэках хуков), не выносите их наружу.
- Избегайте хранения сложных объектов или несериализуемых данных в shared values.
- Не используйте setState из worklet напрямую, если нужен вызов кода в JS, применяйте runOnJS.
- Ограничивайте область animated styles — анимируйте только те параметры, которые реально меняются.
- Компонуйте анимации и жесты через хуки, избегайте глубокой вложенности коллбеков.
- Для сложных загрузок используйте профилировщик или открытые дев-инструменты Reanimated для поиска «тяжёлых» участков.

Вот ещё пример best practice — раскрытие и скрытие элемента по нажатию:

```javascript
const expanded = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  height: withTiming(expanded.value ? 200 : 50, { duration: 400 }), // плавно раскрываем
}));

// При нажатии меняем состояние
onPress={() => {
  expanded.value = expanded.value ? 0 : 1;
}};
```

Работа с shared values позволит вам реализовать даже очень сложные сценарии: раскрытия, скроллы, кастомные лоудеры, анимации появления уведомлений и прочее — и всё это будет происходить плавно и отзывчиво.

## Заключение

Библиотека React Native Reanimated предоставляет мощный инструмент для создания анимаций любого уровня сложности в мобильных приложениях. Её главные преимущества — производительность, гибкость, тесная интеграция с жестами и возможность полной кастомизации поведения UI на лету. Используя shared values, хуки-генераторы animated styles, а также инструменты построения сложных последовательностей, вы сможете реализовать почти любые сценарии: от drag-and-drop до сложных лент, игровых интерфейсов, кастомных попапов и заслонок. Важно тщательно подходить к планированию архитектуры анимаций, выносить вычисления в worklet, оптимизировать производительность и использовать возможности библиотеки по максимуму.

Создание сложных анимаций является важным аспектом разработки современного React Native приложения. Однако, для создания полноценного приложения необходимо освоить множество других технологий и подходов, включая работу с UI, данными и нативными функциями. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-slozhnyh-animacij-(reanimated)-na-React-Native) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как выполнить обратный вызов setState внутри worklet?

Внутри worklet нельзя вызывать setState напрямую. Для этого используйте функцию runOnJS:
```javascript
import { runOnJS } from 'react-native-reanimated';

const gestureHandler = useAnimatedGestureHandler({
  onEnd: (event) => {
    runOnJS(yourSetStateFunction)(event.someParam);
  }
});
```
Это позволит корректно взаимодействовать между worklet и обычным React State.

### Почему анимация тормозит при одновременном изменении нескольких shared values?

Большое число одновременных анимаций может дать лишнюю нагрузку при обновлении стиля, использующих сложные вычисления. Разделяйте animated styles на отдельные хуки для разных свойств, минимизируйте вычисления внутри useAnimatedStyle, по возможности предварительно рассчитывайте часть логики за пределами хука.

### Как использовать Reanimated с React Navigation (транзишны между экранами)?

Убедитесь, что настроены все требования:
- react-native-reanimated установлен и подключён согласно инструкциям (babel plugin)
- используйте createStackNavigator из @react-navigation/stack, поддерживающий пользовательские анимации через transitionSpec, CardStyleInterpolators или кастомные shared elements
- если нужна глубокая интеграция с gesture-handler — следуйте гайдам Reanimated + Navigation

### Как обрабатывать анимации во FlatList или ScrollView без лагов?

Используйте Reanimated компоненты (Animated.FlatList, Animated.ScrollView). Все animated styles и deriveValue выносите на уровень компонента. Для эффектов на скролле используйте scrollHandler из useAnimatedScrollHandler.

### Как дебажить причины "worklet value could not be serialized"?

Это происходит, если через shared value/контекст worklet передаются несериализуемые объекты (например, функции или DOM-узлы). Передавайте только примитивы или объекты, поддерживаемые сериализацией, не передавайте функции напрямую.
