---
metaTitle: Работа с цветами в React Native
metaDescription: Узнайте - как управлять цветами в React Native - использовать стандартные палитры - настраивать темы и создавать анимации с плавной сменой цвета
author: Олег Марков
title: Работа с цветами в React Native
preview: Освойте все основы работы с цветами в React Native - типы цветов - кастомные палитры - динамические значения и примеры для вашего мобильного приложения
---

## Введение

Цвета играют огромную роль в дизайне мобильных приложений. Они формируют первое впечатление пользователя, делают интерфейс удобным и помогают управлять вниманием. В React Native есть много способов задать цвет для компонентов, реализовать темы и поддерживать динамическое изменение цветовой схемы. Здесь вы познакомитесь со всеми практическими аспектами работы с цветами в React Native, узнаете о популярных форматах записи цвета, подключении кастомных палитр, плавных анимаций и смены темы.

---

## Форматы задания цветов

React Native поддерживает несколько основных форматов цветов. Сейчас покажу, какие именно.

### Названия цветов (Color Names)

Для базовых оттенков вы можете использовать стандартные названия на английском языке. Всего поддерживается около 140 вариантов, таких же как в web-разработке:

```jsx
<View style={{ backgroundColor: 'red' }} />
```

// Применяет чисто красный цвет к фону

### Шестнадцатеричные значения (Hex)

Один из самых частых способов задания — hex-код, который начинается с # и указывает значения R (красный), G (зелёный), B (синий):

```jsx
<View style={{ backgroundColor: '#FF6347' }} />
```

// Цвет томата (#FF6347)

#### Hex с Alpha (прозрачность)

Можно использовать и 8-символьную запись: первые 6 — цвет, последние 2 — прозрачность. Например:

```jsx
<View style={{ backgroundColor: '#FF634780' }} /> 
```

// Цвет томата с 50% прозрачностью

### RGB и RGBA

Позволяет точно указать интенсивность каждого из компонентов, используя числовые значения от 0 до 255. RGBA даёт ещё и альфа-канал (прозрачность):

```jsx
<View style={{ backgroundColor: 'rgb(34, 139, 34)' }} />
<View style={{ backgroundColor: 'rgba(34, 139, 34, 0.5)' }} />
```

### HSL и HSLA

Этот формат задаёт цвет через оттенок (Hue), насыщенность (Saturation), яркость (Lightness), а HSLA добавляет ещё альфу (Alpha):

```jsx
<View style={{ backgroundColor: 'hsl(120, 100%, 50%)' }} />
<View style={{ backgroundColor: 'hsla(120, 100%, 50%, 0.7)' }} />
```

---

## Применение цвета в стилях компонентов

Вы можете задавать цвет практически любому визуальному компоненту через его стиль.

### Цвет фона

```jsx
<View style={{ backgroundColor: '#F0E68C' }}>
  <Text>Фон View компонента</Text>
</View>
```

### Цвет текста

```jsx
<Text style={{ color: 'midnightblue' }}>
  Цвет текста
</Text>
```

### Цвет рамки

```jsx
<View style={{ borderColor: '#008B8B', borderWidth: 2 }}>
  <Text>С цветной рамкой</Text>
</View>
```

### Цвет иконок

Если вы используете векторные иконки из `react-native-vector-icons` или SVG-иконки — цвет задается явно через проп `color`:

```jsx
import Icon from 'react-native-vector-icons/FontAwesome';
// Использование цвета для иконки
<Icon name="rocket" size={30} color="#900" />
```

---

## Организация цветовой палитры проекта

Когда приложение разрастается, жестко прописывать цвета прямо в стилях неудобно и плохо поддерживается. Обычно создают единый файл с палитрой.

### Пример файла с палитрой

Создайте файл `colors.js` в директории с темами или стилями:

```js
const colors = {
  primary: '#409EFF',
  secondary: '#2D3A4B',
  accent: '#FFD600',
  background: '#F5F6FA',
  error: '#FF5252',
  text: {
    main: '#222222',
    muted: '#999999',
    inverse: '#FFFFFF',
  },
};

export default colors;
```

### Использование палитры в стилях

```jsx
import colors from './colors';

<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.text.inverse }}>Привет!</Text>
</View>
```

Это снижает риск опечаток, ускоряет смену палитры и упрощает командную работу.

---

## Темизации приложения (Light/Dark Mode)

Многие приложения поддерживают светлую и тёмную темы (особенно с учётом системных настроек мобильных платформ). В React Native удобно реализовать динамическую смену темы.

### Использование Appearance API

React Native предоставляет API для определения системной темы:

```js
import { Appearance } from 'react-native';

const colorScheme = Appearance.getColorScheme(); // 'light' или 'dark'
```

### Реализация тем с помощью Context

Вариант, который часто используют — определяют две палитры и выбор значения зависит от текущей темы. Вот пример:

```js
// theme.js
export const lightColors = {
  background: '#FFFFFF',
  text: '#222222',
};
export const darkColors = {
  background: '#222222',
  text: '#FFFFFF',
};
```

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from './theme';

const ThemeContext = createContext(lightColors);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [colors, setColors] = useState(lightColors);

  useEffect(() => {
    const scheme = Appearance.getColorScheme();
    setColors(scheme === 'dark' ? darkColors : lightColors);

    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setColors(colorScheme === 'dark' ? darkColors : lightColors);
    });
    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
};
```

Теперь можно использовать контекст для доступа к палитре:

```jsx
import { useTheme } from './ThemeProvider';

const MyComponent = () => {
  const colors = useTheme();
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Смена темы «на лету»</Text>
    </View>
  );
};
```

---

## Цвета и platform-specific подходы

Иногда требуется задавать разные цвета на Android и iOS. Например, для работы с системными статус-барами или Material Design.

### Платформо-зависимый цвет

```js
import { Platform } from 'react-native';

const buttonColor = Platform.OS === 'ios' ? '#007AFF' : '#2196F3';
```

---

## Градиенты и кастомные переходы

Системный API React Native не поддерживает градиенты «из коробки». Используйте популярные библиотеки — например, `react-native-linear-gradient`:

### Установка и использование

1. Установите зависимость:

```
npm install react-native-linear-gradient
```

2. Подключите и применяйте компонент:

```jsx
import LinearGradient from 'react-native-linear-gradient';

<LinearGradient
  colors={['#4c669f', '#3b5998', '#192f6a']}
  style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
  <Text style={{ color: '#fff' }}>Градиентный фон</Text>
</LinearGradient>
```

// В массиве `colors` можно задать сколько угодно цветовых переходов.

---

## Цвета и анимации

Иногда требуется анимировать смену цвета (например, для кнопок при наведении или интеракции). Для этого используйте Animated API.

### Пример анимации изменения цвета

```jsx
import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';

const AnimatedColorBox = () => {
  // Animated.Value от 0 до 1
  const animation = useRef(new Animated.Value(0)).current;

  const startAnimation = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000, // Время анимации 1 секунда
      useNativeDriver: false, // Цвета анимируются только на JS
    }).start();
  };

  // Интерполяция: от красного к синему
  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F44336', '#2196F3'],
  });

  return (
    <TouchableOpacity onPress={startAnimation}>
      <Animated.View
        style={{
          height: 100,
          width: 100,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: '#fff' }}>Нажми</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedColorBox;
```

// Анимация плавно сменит цвет квадрата с красного на синий при нажатии.

---

## Использование прозрачности и слоёв

Полупрозрачные цвета полезны для наложения эффектов. Например, затемнение фона «оверлея»:

```jsx
<View style={{
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)'
}} />
```

// Это «полу-черный» оверлей на весь экран.

---

## Интеграция с внешними библиотеками (color, tinycolor и др.)

Чтобы удобно манипулировать цветами (например, сделать оттенок светлее или темнее, инвертировать) применяют JS-библиотеки типа `color` или `tinycolor2`.

### Пример использования color

1. Установите библиотеку color:

```
npm install color
```

2. Используйте для трансформаций:

```js
import Color from 'color';

const original = '#409EFF';
const lighter = Color(original).lighten(0.2).hex();
const darker = Color(original).darken(0.2).hex();

// Вы можете теперь использовать lighter/darker в стилях
```

---

## Использование цветов ресурсов в Android (advanced)

Если нужно интегрироваться с системными ресурсами Android (например, цвета в XML), воспользуйтесь связкой с Native Modules. Обычно это не требуется, но если нужно — используйте React Native Module API для получения системных значений и передачи их в JavaScript.

---

## Заключение

Работа с цветами в React Native довольно гибка и включает поддержку всех привычных web-форматов, организацию палитр, динамическую смену тем и анимацию цветов. С помощью палитры и ThemeProvider можно реализовать единые стандарты дизайна во всём приложении, а для сложных задач доступны внешние библиотеки. Основные моменты — указывать цвета однородно во всём проекте и строить их структуру так, чтобы изменения были быстрыми и контролируемыми.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как сделать градиент текста в React Native?**  
Для этого используйте `react-native-linear-gradient` совместно с модулем маскирования (например, `react-native-masked-view`).  
Пример:  
- Установите обе библиотеки  
- Оберните текст внутри MaskedView, как градиент  
- Пример кода в [официальной документации MaskedView](https://github.com/react-native-masked-view/masked-view)

**2. Как поддерживать автоматическую смену темы при изменении системной настройки?**  
В React Native через Appearance API. Установите слушателя через `Appearance.addChangeListener`, не забудьте его снимать при размонтировании компонента.

**3. Можно ли сделать свой кастомный ColorPicker?**  
Да, есть компоненты `react-native-color-picker` или `react-native-wheel-color-picker`. Можно реализовать свой, используя `PanResponder` для кастомной логики выбора цвета.

**4. Как сделать цвет адаптивным к разному цветовому профилю экрана?**  
Изучите библиотеку `react-native-device-info` для определения экрана, но принципиально цвет подстраивается только под тему приложения.

**5. Как использовать переменные CSS для цвета в React Native?**  
React Native не поддерживает CSS-переменные. Для подобного поведения используйте объектные палитры (как в примерах colors.js выше) или библиотеки типа `react-native-extended-stylesheet`, поддерживающие псевдопеременные.