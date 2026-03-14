---
metaTitle: Стили в React Native - полное руководство по StyleSheet и Flexbox
metaDescription: Изучите систему стилей в React Native: StyleSheet API, Flexbox-раскладка, адаптивные размеры, платформенные стили, темизация и практические примеры для iOS и Android
author: Олег Марков
title: Стили в React Native
preview: Разберитесь, как работают стили в React Native - от базового StyleSheet.create до Flexbox-раскладки, адаптивных размеров и платформенных стилей. Практические примеры для реальных проектов
---

## Введение

Стилизация в React Native — одна из тем, с которой сталкивается каждый разработчик с опытом в веб-разработке. На первый взгляд всё выглядит привычно: вы используете свойства, похожие на CSS, описываете внешний вид компонентов через JavaScript-объекты. Но под капотом всё работает иначе.

React Native не использует браузер и не знает ничего о DOM. Вместо этого он транслирует стили в нативные инструкции — NSLayoutConstraint на iOS и аналоги на Android. Это означает, что вы получаете высокую производительность, но теряете часть возможностей CSS: нет каскада, нет наследования, нет псевдоселекторов, нет медиазапросов в классическом понимании.

В этой статье вы узнаете, как именно устроена система стилей в React Native, как правильно использовать `StyleSheet` API, как применять Flexbox для построения раскладок и как адаптировать интерфейс под разные экраны и платформы.

## StyleSheet API — основа стилизации

### Что такое StyleSheet.create

В React Native стили описываются как обычные JavaScript-объекты. Однако для лучшей производительности рекомендуется создавать их через `StyleSheet.create`:

```javascript
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Привет, React Native!</Text>
    </View>
  );
}
```

`StyleSheet.create` делает несколько полезных вещей. Во-первых, он валидирует стили во время разработки — если вы укажете неизвестное свойство или неверный тип значения, вы получите предупреждение. Во-вторых, созданные стили оптимизируются: React Native может кешировать их и передавать нативным слоям по идентификаторам, а не сериализовать объекты снова и снова.

### Inline-стили и когда их использовать

Вы также можете передавать стили прямо в `style` без `StyleSheet.create`:

```javascript
<View style={{ backgroundColor: 'red', padding: 10 }}>
  <Text style={{ color: 'white' }}>Текст</Text>
</View>
```

Inline-стили удобны для динамических значений — когда нужно изменить стиль в зависимости от состояния или пропсов. Но их постоянное использование снижает производительность, поскольку каждый рендер создаёт новый объект.

### Комбинирование стилей

Свойство `style` принимает как одиночный объект стилей, так и массив объектов. Это позволяет комбинировать стили:

```javascript
const styles = StyleSheet.create({
  base: {
    padding: 10,
    backgroundColor: '#eee',
  },
  active: {
    backgroundColor: '#007AFF',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  activeText: {
    color: '#fff',
  },
});

function Button({ isActive, label }) {
  return (
    <View style={[styles.base, isActive && styles.active]}>
      <Text style={[styles.text, isActive && styles.activeText]}>
        {label}
      </Text>
    </View>
  );
}
```

Когда вы передаёте массив стилей, последующие объекты перекрывают свойства предыдущих — это аналог переопределения стилей, только явный и предсказуемый. `false`, `null` и `undefined` в массиве игнорируются, поэтому `isActive && styles.active` — безопасный паттерн.

## Основные свойства стилей

### Размеры и отступы

В React Native размеры задаются в независимых от устройства пикселях (dp/pt). Процентные значения не поддерживаются везде, но для `width`, `height`, `margin` и `padding` они работают:

```javascript
const styles = StyleSheet.create({
  box: {
    width: 100,          // 100dp
    height: 50,
    margin: 8,           // одинаково со всех сторон
    marginVertical: 16,  // сверху и снизу
    marginHorizontal: 8, // слева и справа
    padding: 12,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 16,
  },
  halfWidth: {
    width: '50%',        // половина от родителя
  },
});
```

Обратите внимание — в отличие от CSS, в React Native нет сокращённых форм типа `margin: 10 20`. Каждое направление задаётся отдельно или через `Vertical`/`Horizontal` суффиксы.

### Типографика

```javascript
const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '700',    // числовые строки: '100'-'900' или 'normal'/'bold'
    fontFamily: 'System', // или имя подключённого шрифта
    color: '#1a1a1a',
    lineHeight: 32,
    letterSpacing: 0.5,
    textAlign: 'center',  // 'left' | 'right' | 'center' | 'justify'
    textTransform: 'uppercase', // 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  },
  body: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
});
```

Важный момент с `fontWeight`: на iOS поддерживаются все значения от '100' до '900'. На Android поддержка зависит от подключённого шрифта — системный шрифт может не иметь всех вариантов насыщенности. Если вам нужно надёжное управление начертанием — используйте кастомные шрифты через `expo-font` или react-native-vector-icons.

### Границы и скругления

```javascript
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    // Можно задавать отдельные стороны:
    borderTopLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 0,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
```

### Тени

Тени в React Native задаются по-разному для iOS и Android:

```javascript
const styles = StyleSheet.create({
  shadow: {
    // iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android
    elevation: 4,
  },
});
```

На iOS тень реализуется через Core Animation и работает корректно с любой формой. На Android используется `elevation` — свойство Material Design, которое задаёт высоту элемента над поверхностью и автоматически рисует тень. Значения несопоставимы напрямую, поэтому нужно подбирать визуально под каждую платформу.

## Flexbox в React Native

### Основные отличия от веб

React Native использует Flexbox, но с некоторыми отличиями от веб-CSS:

1. **Направление по умолчанию** — `flexDirection: 'column'` (в CSS по умолчанию `row`)
2. **Выравнивание по умолчанию** — `alignItems: 'stretch'`
3. **Нет `flex-wrap`** в старых версиях, но он поддерживается в современных
4. Все блочные элементы по умолчанию ведут себя как flex-контейнеры

### flex и размеры

```javascript
const styles = StyleSheet.create({
  // Занять всё доступное пространство
  fullscreen: {
    flex: 1,
  },
  // Разделить пространство в пропорции 2:1
  bigColumn: {
    flex: 2,
    backgroundColor: '#f0f0f0',
  },
  smallColumn: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
});
```

Свойство `flex` в React Native работает как сокращение: `flex: 1` означает `flexGrow: 1`, `flexShrink: 1`, `flexBasis: 0`. Это отличается от веб-поведения, где `flex: 1` разворачивается иначе. Для точного управления используйте `flexGrow`, `flexShrink` и `flexBasis` отдельно.

### Направление и выравнивание

```javascript
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',           // элементы по горизонтали
    justifyContent: 'space-between', // распределение по главной оси
    alignItems: 'center',           // выравнивание по поперечной оси
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

Значения `justifyContent`:
- `flex-start` — элементы в начале главной оси
- `flex-end` — элементы в конце
- `center` — по центру
- `space-between` — равные промежутки между элементами
- `space-around` — равные промежутки вокруг элементов
- `space-evenly` — полностью равные промежутки

### Реальный пример раскладки

```javascript
import { View, Text, StyleSheet } from 'react-native';

function ProfileCard({ name, role, avatar }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {/* место для аватарки */}
        <View style={styles.avatar} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
  },
  info: {
    flex: 1, // занять оставшееся пространство
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  role: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
});
```

## Адаптивные размеры и Dimensions

### Получение размеров экрана

```javascript
import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  heroImage: {
    width: width,           // на всю ширину экрана
    height: height * 0.4,  // 40% от высоты
  },
  halfScreen: {
    width: width / 2,
    padding: width * 0.04, // 4% от ширины как отступ
  },
});
```

Однако `Dimensions.get` возвращает размеры на момент вычисления и не обновляется при повороте экрана. Для реактивных размеров используйте хук `useWindowDimensions`:

```javascript
import { useWindowDimensions, View, StyleSheet } from 'react-native';

function ResponsiveBox() {
  const { width, height } = useWindowDimensions();

  return (
    <View
      style={[
        styles.box,
        {
          width: width > 400 ? 200 : width * 0.5,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    height: 100,
    backgroundColor: '#007AFF',
  },
});
```

### PixelRatio и чёткие границы

На устройствах с высокой плотностью пикселей (Retina, AMOLED) тонкие линии могут выглядеть размыто. Для пиксельно-чёткого отображения используйте `PixelRatio`:

```javascript
import { PixelRatio, StyleSheet } from 'react-native';

const hairlineWidth = StyleSheet.hairlineWidth; // тончайшая видимая линия

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
  },
  border: {
    // 1 физический пиксель
    borderWidth: 1 / PixelRatio.get(),
    borderColor: '#ddd',
  },
});
```

`StyleSheet.hairlineWidth` возвращает минимальную видимую толщину линии для текущего устройства — обычно `0.5` на Retina-экранах.

## Платформенные стили

### Platform.select

Часто нужно задать разные стили для iOS и Android. Для этого используется `Platform.select`:

```javascript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      ios: {
        paddingTop: 50, // учёт status bar на iOS
        backgroundColor: '#f8f9fa',
      },
      android: {
        paddingTop: 30,
        backgroundColor: '#ffffff',
      },
    }),
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### Platform.OS

Для условной логики прямо в коде компонента:

```javascript
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

function Header() {
  return (
    <View style={[
      styles.header,
      isIOS && styles.headerIOS,
    ]}>
      <Text style={styles.title}>Заголовок</Text>
    </View>
  );
}
```

## Динамические стили и темизация

### Стили на основе состояния

```javascript
import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

function ToggleButton() {
  const [active, setActive] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive]}
      onPress={() => setActive(!active)}
    >
      <Text style={[styles.label, active && styles.labelActive]}>
        {active ? 'Включено' : 'Выключено'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  label: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  labelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

### Создание простой системы тем

Для небольших проектов можно реализовать темизацию через контекст React:

```javascript
import { createContext, useContext } from 'react';

const lightTheme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  primary: '#007AFF',
  text: '#1a1a1a',
  textSecondary: '#888',
  border: '#e0e0e0',
};

const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#0A84FF',
  text: '#ffffff',
  textSecondary: '#aaa',
  border: '#333',
};

const ThemeContext = createContext(lightTheme);

export function ThemeProvider({ children, dark = false }) {
  const theme = dark ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Использование в компоненте
function Card({ title, text }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
```

Для более крупных проектов рассмотрите библиотеки как `react-native-paper`, `NativeBase` или `Tamagui` — они предоставляют готовую систему тем.

## Производительность стилей

### Что влияет на производительность

- **Inline-объекты при каждом рендере** снижают производительность, потому что создают новые объекты и вызывают сравнение в `shouldComponentUpdate`. Используйте `StyleSheet.create` для статических стилей.
- **Слишком глубокая вложенность `View`** увеличивает время рендеринга. По возможности упрощайте иерархию.
- **`overflow: 'hidden'` и `borderRadius` одновременно** требуют дополнительной работы от GPU, особенно в анимациях.

### Мемоизация динамических стилей

Если стиль зависит от пропсов или состояния, используйте `useMemo`:

```javascript
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

function ColorBox({ color, size }) {
  const boxStyle = useMemo(() => ({
    backgroundColor: color,
    width: size,
    height: size,
    borderRadius: size / 2,
  }), [color, size]);

  return <View style={[styles.base, boxStyle]} />;
}

const styles = StyleSheet.create({
  base: {
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

## Практические советы

### Организация стилей в проекте

Когда проект растёт, хаотично разбросанные стили становятся проблемой. Вот несколько подходов:

**1. Стили рядом с компонентом** (наиболее распространённый):
```
components/
  Button/
    index.tsx
    styles.ts    ← стили в отдельном файле
```

**2. Токены дизайна**:
```javascript
// theme.ts
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  danger: '#FF3B30',
  success: '#34C759',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Использование
import { colors, spacing, borderRadius } from '@/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
});
```

### Избегайте этих ошибок

**Неправильно — тень без учёта платформы:**
```javascript
// Это не работает на Android
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
```

**Правильно — кросс-платформенная тень:**
```javascript
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // добавить для Android
  },
});
```

**Неправильно — фиксированный размер без учёта экрана:**
```javascript
const styles = StyleSheet.create({
  modal: {
    width: 320, // может не поместиться на маленьком экране
  },
});
```

**Правильно — адаптивный размер:**
```javascript
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modal: {
    width: Math.min(320, width - 32), // не шире экрана минус отступы
  },
});
```

## Заключение

Система стилей React Native — мощный и гибкий инструмент, который при правильном использовании позволяет создавать красивые и производительные интерфейсы. Ключевые моменты, которые стоит запомнить:

- Используйте `StyleSheet.create` для статических стилей — это и валидация, и оптимизация
- Flexbox по умолчанию работает в режиме `column`, а не `row` как в CSS
- Тени задаются по-разному для iOS (`shadow*`) и Android (`elevation`)
- Для адаптивных размеров используйте `useWindowDimensions`, а не статический `Dimensions.get`
- Разделяйте статические и динамические стили — первые в `StyleSheet.create`, вторые с `useMemo`
- Создавайте систему токенов (цвета, отступы, радиусы) для поддерживаемости кода

Если вы хотите детально освоить React Native и научиться создавать профессиональные мобильные приложения, приходите на курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=stili-v-react-native). На курсе вы изучите все аспекты разработки — от стилизации до работы с нативными модулями и публикации в App Store и Google Play.
