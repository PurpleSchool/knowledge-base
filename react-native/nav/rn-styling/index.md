---
metaTitle: Стили в React Native — StyleSheet, Flexbox, темизация и адаптивный дизайн
metaDescription: Полное руководство по стилизации в React Native: StyleSheet API, Flexbox, работа с размерами, платформо-зависимые стили, темизация и адаптивный дизайн
author: Олег Марков
title: Стили в React Native
preview: Изучите всё о стилизации в React Native: как работает StyleSheet, Flexbox с column по умолчанию, адаптивный дизайн, темизация и платформо-зависимые стили
---

## Введение

Стилизация в React Native принципиально отличается от веб-разработки. Вместо CSS-файлов и классов вы используете JavaScript-объекты, а вместо пикселей — независимые от плотности единицы. Flexbox здесь работает немного иначе — колонка по умолчанию, а не строка. Зато JavaScript позволяет создавать динамические стили гораздо проще, чем в CSS.

В этой статье вы изучите StyleSheet API, Flexbox в React Native, работу с размерами экрана, адаптивный дизайн, платформо-зависимые стили и создание темизации.

Умение грамотно стилизовать приложения — важный навык React Native разработчика. Чтобы научиться создавать красивые, адаптивные интерфейсы для iOS и Android — приходите на наш курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=stili-rn). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики и живое ревью наставника.

## StyleSheet API

`StyleSheet.create()` — основной способ определения стилей:

```jsx
import { StyleSheet, View, Text } from 'react-native';

function Card({ title, subtitle }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    // Тени для iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Тени для Android
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 20,
  },
});
```

### Зачем использовать StyleSheet.create

`StyleSheet.create` делает следующее:
- Валидирует стили в режиме разработки
- Оптимизирует отправку стилей в нативный слой
- Даёт подсказки TypeScript при использовании с типизацией

```jsx
// Можно также использовать обычный объект (без оптимизаций)
const inlineStyles = {
  container: { flex: 1 }
};

// Или передавать стили напрямую (подходит для динамических стилей)
<View style={{ backgroundColor: isActive ? '#6200ee' : '#e0e0e0' }} />
```

### Составные стили

```jsx
// Массив стилей — объединяются справа налево
<View style={[styles.base, styles.primary, isActive && styles.active]} />

// StyleSheet.flatten — объединяет стили в один объект
const mergedStyle = StyleSheet.flatten([styles.base, styles.primary]);
```

## Flexbox в React Native

Flexbox в React Native работает аналогично CSS Flexbox, но с важным отличием: **по умолчанию `flexDirection: 'column'`**.

### Основные свойства

```jsx
const styles = StyleSheet.create({
  // Контейнер
  container: {
    flex: 1,                          // Занять всё доступное пространство
    flexDirection: 'column',          // column (по умолчанию) | row | column-reverse | row-reverse
    justifyContent: 'center',         // Выравнивание вдоль основной оси
    alignItems: 'center',             // Выравнивание поперёк основной оси
    alignSelf: 'auto',                // Индивидуальное выравнивание элемента
    flexWrap: 'nowrap',               // nowrap | wrap | wrap-reverse
    gap: 8,                           // Отступ между элементами
  },

  // Элементы
  item: {
    flex: 1,                          // Занять оставшееся пространство
    flexGrow: 1,                      // Как flex в CSS (расширение)
    flexShrink: 0,                    // Сжатие при нехватке места
    flexBasis: 'auto',                // Базовый размер элемента
    width: '50%',                     // Можно использовать проценты
  },
});
```

### Практические примеры Flexbox

```jsx
// Горизонтальная строка с иконкой и текстом
function ListItem({ icon, title, subtitle }) {
  return (
    <View style={listStyles.container}>
      <View style={listStyles.iconContainer}>
        {icon}
      </View>
      <View style={listStyles.textContainer}>
        <Text style={listStyles.title}>{title}</Text>
        <Text style={listStyles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={listStyles.chevron}>›</Text>
    </View>
  );
}

const listStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',    // Горизонтальное расположение
    alignItems: 'center',    // По центру вертикально
    padding: 16,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,    // Занять всё оставшееся место
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
});
```

## Работа с размерами

### Единицы измерения

React Native использует "density-independent pixels" (dp) — числа без единиц:

```jsx
// Числа автоматически конвертируются в правильные пиксели на каждом устройстве
const styles = StyleSheet.create({
  box: {
    width: 100,    // 100dp — выглядит одинаково на экранах с разной плотностью
    height: 100,
    padding: 16,
    margin: 8,
  }
});
```

### Получение размеров экрана

```jsx
import { Dimensions, useWindowDimensions } from 'react-native';

// Статический способ (не обновляется при повороте!)
const { width, height } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('screen');

// Хук (обновляется при изменении ориентации)
function ResponsiveComponent() {
  const { width, height, fontScale, scale } = useWindowDimensions();
  
  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;

  return (
    <View style={{ width: width * 0.9, alignSelf: 'center' }}>
      <Text>Ширина экрана: {width}dp</Text>
      <Text>Масштаб шрифта: {fontScale}</Text>
    </View>
  );
}
```

### SafeAreaView и отступы

```jsx
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// SafeAreaView автоматически добавляет отступы для "чёлки" и нижней панели
function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Контент безопасно расположен</Text>
      </View>
    </SafeAreaView>
  );
}

// Хук для ручного управления отступами
function CustomScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Text>Ручное управление отступами</Text>
    </View>
  );
}
```

## Платформо-зависимые стили

```jsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    // Разные стили для iOS и Android
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    // Разная высота строки на разных платформах
    lineHeight: Platform.OS === 'ios' ? 22 : 24,
  },
});

// Платформо-зависимые компоненты
const StatusBarStyle = Platform.select({
  ios: require('./StatusBarIOS').default,
  android: require('./StatusBarAndroid').default,
  default: require('./StatusBarDefault').default,
});
```

## Динамические стили

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Стили на основе пропсов
function Badge({ label, variant = 'default' }) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Варианты
  badge_default: { backgroundColor: '#e0e0e0' },
  badge_primary: { backgroundColor: '#ede7f6' },
  badge_success: { backgroundColor: '#e8f5e9' },
  badge_error: { backgroundColor: '#ffebee' },

  badgeText_default: { color: '#616161' },
  badgeText_primary: { color: '#6200ee' },
  badgeText_success: { color: '#2e7d32' },
  badgeText_error: { color: '#c62828' },
});
```

## Темизация

Создание системы тем:

```jsx
// theme/colors.ts
export const lightTheme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  primary: '#6200ee',
  primaryVariant: '#3700b3',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#b00020',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#bb86fc',
  primaryVariant: '#3700b3',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  border: '#333333',
  error: '#cf6679',
};

export type Theme = typeof lightTheme;
```

```jsx
// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../theme/colors';

const ThemeContext = createContext<{
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  const theme = isDark ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

```jsx
// Использование в компонентах
function ThemedCard({ title, children }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
```

## Шрифты

### Подключение кастомных шрифтов

С Expo:

```bash
npx expo install expo-font
```

```jsx
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootNavigator />;
}

// Использование
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  boldText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
});
```

## Адаптивный дизайн

```jsx
import { useWindowDimensions, StyleSheet } from 'react-native';

function AdaptiveGrid({ items }) {
  const { width } = useWindowDimensions();

  // Определяем количество колонок в зависимости от ширины
  const numColumns = width < 600 ? 2 : width < 960 ? 3 : 4;
  const itemWidth = (width - 16 * (numColumns + 1)) / numColumns;

  return (
    <FlatList
      data={items}
      numColumns={numColumns}
      key={numColumns} // Важно! При изменении numColumns нужно пересоздать FlatList
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => (
        <View style={[styles.gridItem, { width: itemWidth }]}>
          <Text>{item.title}</Text>
        </View>
      )}
      contentContainerStyle={styles.grid}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
    gap: 16,
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 8,
  },
});
```

## Анимации через Animated API

React Native включает встроенный Animated API:

```jsx
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { useRef } from 'react';

function AnimatedButton({ onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.button,
          { transform: [{ scale }] }
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200ee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});
```

## Советы и best practices

1. **Используйте `StyleSheet.create`** вместо inline-стилей для переиспользуемых стилей — это улучшает производительность.

2. **Создавайте константы для дизайн-токенов:**

```jsx
// constants/design.ts
export const COLORS = {
  primary: '#6200ee',
  background: '#f5f5f5',
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24 },
};
```

3. **Анимируйте только через `useNativeDriver: true`** для плавных анимаций.

4. **Используйте `useWindowDimensions`** вместо `Dimensions.get()` для обработки поворота экрана.

## Заключение

Стилизация в React Native — это JavaScript-объекты вместо CSS, Flexbox с `column` по умолчанию, и работа с device-independent pixels. Ключевые темы:

- **StyleSheet** — основной API для стилей с оптимизацией
- **Flexbox** — для построения layouts (column по умолчанию!)
- **Dimensions/useWindowDimensions** — для адаптивного дизайна
- **Platform.select** — для платформо-зависимых стилей
- **Context API** — для темизации

Освоив эти инструменты, вы сможете создавать красивые, кроссплатформенные интерфейсы для iOS и Android.
