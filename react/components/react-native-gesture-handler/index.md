---
metaTitle: "React Native Gesture Handler — обработка жестов"
metaDescription: "Полное руководство по React Native Gesture Handler: установка, TapGestureHandler, PanGestureHandler, Pinch, композиция жестов и интеграция с Reanimated."
author: "Антон Ларичев"
title: "React Native Gesture Handler: обработка жестов в мобильных приложениях"
preview: "Разбираем React Native Gesture Handler: как настроить библиотеку, работать с жестами tap, pan, pinch и composing gestures в мобильных приложениях."
---

React Native Gesture Handler — это библиотека для обработки пользовательских жестов в мобильных приложениях на React Native. В отличие от встроенной системы жестов, она переносит обработку касаний на нативный уровень, что даёт плавную анимацию даже при загруженном JS-потоке.

## Почему не встроенная система жестов

Стандартный `PanResponder` из React Native работает в JavaScript-потоке. Когда JS занят рендером или вычислениями, обработка жестов запаздывает — пользователь видит дёрганые анимации.

Gesture Handler перехватывает события касания на уровне нативного кода (Android: `GestureDetector`, iOS: `UIGestureRecognizer`) и передаёт результаты в JS только тогда, когда это нужно. В связке с `react-native-reanimated` вся анимация выполняется вне JS-потока.

## Установка и настройка

### Установка пакета

```bash
npm install react-native-gesture-handler
# или
yarn add react-native-gesture-handler
```

Для iOS после установки нужно поставить нативные зависимости:

```bash
cd ios && pod install
```

### Оборачивание приложения

Важный шаг — обернуть корень приложения в `GestureHandlerRootView`. Без этого жесты не будут работать.

```javascript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* остальное приложение */}
    </GestureHandlerRootView>
  );
}
```

Если используете Expo, начиная с SDK 50, `GestureHandlerRootView` добавляется автоматически при использовании `expo-router`. В других случаях оборачивайте вручную.

## Новый API: Gesture

С версии 2.x библиотека перешла на новый декларативный API через объект `Gesture` и компонент `GestureDetector`. Старый API с `TapGestureHandler`, `PanGestureHandler` и другими компонентами-обёртками считается устаревшим.

### Базовая структура

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export function TapExample() {
  const tap = Gesture.Tap()
    .onStart(() => {
      console.log('Нажатие началось');
    })
    .onEnd(() => {
      console.log('Нажатие завершено');
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={{ width: 100, height: 100, backgroundColor: 'blue' }} />
    </GestureDetector>
  );
}
```

## Основные типы жестов

### Tap — одиночное нажатие

`Gesture.Tap()` срабатывает при быстром касании экрана.

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function TapButton() {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .numberOfTaps(1)
    .onBegin(() => {
      scale.value = withSpring(0.9);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          { width: 120, height: 50, backgroundColor: '#6200EE', borderRadius: 8 },
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
}
```

`.numberOfTaps(2)` позволяет распознавать двойное нажатие. `.maxDuration(500)` ограничивает максимальное время касания в миллисекундах.

### LongPress — долгое нажатие

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useState } from 'react';

export function LongPressExample() {
  const [activated, setActivated] = useState(false);
  const opacity = useSharedValue(1);

  const longPress = Gesture.LongPress()
    .minDuration(600)
    .onStart(() => {
      opacity.value = withTiming(0.5, { duration: 150 });
      runOnJS(setActivated)(true);
    })
    .onFinalize(() => {
      opacity.value = withTiming(1, { duration: 150 });
      runOnJS(setActivated)(false);
    });

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View
        style={[
          { width: 100, height: 100, backgroundColor: activated ? '#FF5252' : '#4CAF50' },
          style,
        ]}
      />
    </GestureDetector>
  );
}
```

Обратите внимание на `runOnJS` — он нужен, чтобы вызвать setState из worklet-функции (которая выполняется в нативном потоке).

### Pan — перетаскивание

`Gesture.Pan()` отслеживает движение пальца по экрану. Это один из самых часто используемых жестов.

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

export function DraggableCard() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onChange((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      // Можно добавить возврат к исходной позиции
      // translateX.value = withSpring(0);
      // translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            width: 150,
            height: 150,
            backgroundColor: '#3F51B5',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
          },
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
}
```

Объект `event` в `.onChange()` содержит:
- `translationX`, `translationY` — смещение от начала жеста
- `velocityX`, `velocityY` — скорость движения
- `x`, `y` — абсолютные координаты на экране

### Pinch — масштабирование

`Gesture.Pinch()` обрабатывает жест щипка двумя пальцами для масштабирования.

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

export function ZoomableImage() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.Image
        source={{ uri: 'https://example.com/photo.jpg' }}
        style={[{ width: 300, height: 300 }, animatedStyle]}
      />
    </GestureDetector>
  );
}
```

### Rotation — вращение

```javascript
const rotation = useSharedValue(0);
const savedRotation = useSharedValue(0);

const rotate = Gesture.Rotation()
  .onUpdate((event) => {
    rotation.value = savedRotation.value + event.rotation;
  })
  .onEnd(() => {
    savedRotation.value = rotation.value;
  });

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ rotateZ: `${rotation.value}rad` }],
}));
```

## Композиция жестов

Самая мощная функция библиотеки — объединение нескольких жестов в одном компоненте.

### Simultaneous — одновременные жесты

`Gesture.Simultaneous()` позволяет двум жестам работать одновременно. Классический пример — одновременный Pinch и Rotation для манипуляций с изображением.

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

export function TransformableView() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composed = Gesture.Simultaneous(pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          { width: 200, height: 200, backgroundColor: '#E91E63', borderRadius: 16 },
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
}
```

### Exclusive — взаимоисключающие жесты

`Gesture.Exclusive()` запускает первый жест, который сработал, и блокирует остальные. Полезно, когда одиночный и двойной tap должны делать разные вещи.

```javascript
const singleTap = Gesture.Tap()
  .numberOfTaps(1)
  .onEnd(() => {
    console.log('Одиночное нажатие');
  });

const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .onEnd(() => {
    console.log('Двойное нажатие');
  });

// Двойной tap имеет приоритет над одиночным
const composed = Gesture.Exclusive(doubleTap, singleTap);
```

### Race — гонка жестов

`Gesture.Race()` активирует только первый жест, который перешёл в активное состояние, и отменяет остальные.

```javascript
const pan = Gesture.Pan();
const longPress = Gesture.LongPress();

// Кто первый активируется — тот и работает
const race = Gesture.Race(pan, longPress);
```

## Практический пример: карточка со свайпом

Компонент карточки, которую можно смахнуть вправо или влево с динамическим индикатором направления:

```javascript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export function SwipeCard({ onSwipeLeft, onSwipeRight }) {
  const translateX = useSharedValue(0);

  const handleSwipeLeft = () => onSwipeLeft?.();
  const handleSwipeRight = () => onSwipeRight?.();

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        runOnJS(handleSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(handleSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotateZ: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.Text style={[styles.like, likeOpacity]}>LIKE</Animated.Text>
        <Animated.Text style={[styles.nope, nopeOpacity]}>NOPE</Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 480,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  like: {
    position: 'absolute',
    top: 40,
    left: 24,
    fontSize: 32,
    fontWeight: '800',
    color: '#4CAF50',
    borderWidth: 4,
    borderColor: '#4CAF50',
    padding: 8,
    transform: [{ rotate: '-15deg' }],
  },
  nope: {
    position: 'absolute',
    top: 40,
    right: 24,
    fontSize: 32,
    fontWeight: '800',
    color: '#F44336',
    borderWidth: 4,
    borderColor: '#F44336',
    padding: 8,
    transform: [{ rotate: '15deg' }],
  },
});
```

## Работа с ScrollView и FlatList

Когда GestureDetector используется внутри прокручиваемых контейнеров, могут возникать конфликты жестов. Библиотека предоставляет нативные замены:

```javascript
import { ScrollView, FlatList } from 'react-native-gesture-handler';

// Используйте эти компоненты вместо react-native аналогов
// внутри GestureHandlerRootView для корректной работы
export function GestureList() {
  return (
    <ScrollView>
      {/* жесты внутри работают корректно */}
    </ScrollView>
  );
}
```

Для разрешения конфликта между Pan и ScrollView используйте `.activeOffsetX()` и `.failOffsetY()`:

```javascript
const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])
  .failOffsetY([-5, 5]);
// Жест активируется только при горизонтальном движении
// и отменяется при вертикальном — ScrollView получает контроль
```

## Частые ошибки

**Забыли GestureHandlerRootView.** Жесты не работают совсем или ведут себя непредсказуемо. Всегда оборачивайте корень приложения.

**Вызов setState напрямую из worklet.** Код в `.onStart()`, `.onChange()`, `.onEnd()` выполняется в нативном потоке. Для вызова JS-функций используйте `runOnJS(fn)(args)`.

**Смешивание старого и нового API.** Компоненты `PanGestureHandler` из старого API не работают с `Gesture.Pan()` из нового. Используйте только один подход.

**Мутация sharedValue вместо присваивания.** `sharedValue.value = newValue` — правильно. `sharedValue.value.push(item)` — неправильно для массивов, нужно создавать новый массив.

## Итог

React Native Gesture Handler решает главную проблему нативной обработки жестов — зависимость от JS-потока. Новый API через `Gesture` и `GestureDetector` даёт читаемый декларативный код, а `Gesture.Simultaneous()`, `Exclusive()` и `Race()` позволяют строить сложные взаимодействия без конфликтов между жестами. В связке с `react-native-reanimated` это основа для создания плавных и отзывчивых мобильных интерфейсов.

Чтобы освоить разработку мобильных приложений на React Native с нуля до профессионального уровня, записывайтесь на курс [React Native на PurpleSchool](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-gesture-handler).