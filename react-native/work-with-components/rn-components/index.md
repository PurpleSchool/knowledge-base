---
metaTitle: Основные компоненты React Native — полный обзор
metaDescription: Изучите основные компоненты React Native: View, Text, Image, TextInput, ScrollView, FlatList, TouchableOpacity и другие — примеры кода и рекомендации
author: Олег Марков
title: Основные компоненты React Native
preview: Узнайте, какие компоненты входят в ядро React Native и как их использовать — подробный разбор View, Text, Image, TextInput, Button, ScrollView, FlatList с примерами
---

## Введение

React Native предоставляет набор встроенных компонентов, которые являются фундаментом любого мобильного приложения. В отличие от React для веба, где вы работаете с HTML-элементами, в React Native каждый компонент отображается нативными средствами операционной системы — iOS или Android. Это означает, что `<View>` превращается в `UIView` на iOS и в `android.view.View` на Android, а `<Text>` — в `UILabel` / `TextView` соответственно.

В этой статье вы познакомитесь с ключевыми компонентами React Native: поймёте, когда и зачем их применять, как стилизовать и комбинировать между собой, а также увидите конкретные примеры кода. После прочтения у вас появится чёткая картина того, из чего строятся интерфейсы мобильных приложений.

Знание основных компонентов React Native — первый шаг к созданию качественных мобильных приложений. Чтобы ускорить обучение и сразу получить практику с разбором реальных задач, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Osnovnye-komponenty-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## View

`View` — это основной строительный блок интерфейса в React Native. Аналог `<div>` в вебе: служит контейнером для других элементов, поддерживает Flexbox-вёрстку, стилизацию, обработку касаний и доступность (accessibility).

### Базовое использование View

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

const MyBox = () => (
  <View style={styles.container}>
    <View style={styles.box} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: '#6200ea',
    borderRadius: 8,
  },
});

export default MyBox;
```

В этом примере внешний `View` занимает весь экран (`flex: 1`) и центрирует содержимое. Внутренний `View` выглядит как фиолетовый прямоугольник со скруглёнными углами.

### Flexbox в View

Большинство компонентов React Native используют Flexbox для расположения дочерних элементов. По умолчанию `flexDirection: 'column'` — элементы располагаются вертикально.

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Row = () => (
  <View style={styles.row}>
    <View style={[styles.cell, { backgroundColor: '#e53935' }]} />
    <View style={[styles.cell, { backgroundColor: '#43a047' }]} />
    <View style={[styles.cell, { backgroundColor: '#1e88e5' }]} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  cell: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
});

export default Row;
```

Здесь три цветных квадрата расположены в строку с равными промежутками между ними.

## Text

`Text` — компонент для отображения текста. В React Native весь текст должен быть обёрнут в `<Text>`, в отличие от веба, где текст можно писать прямо внутри контейнерного тега.

### Базовое использование Text

```jsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const Typography = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Заголовок</Text>
    <Text style={styles.subheading}>Подзаголовок</Text>
    <Text style={styles.body}>
      Обычный текст абзаца. Может содержать{' '}
      <Text style={styles.bold}>жирный</Text> или{' '}
      <Text style={styles.italic}>курсивный</Text> фрагменты.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  subheading: { fontSize: 18, color: '#616161', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, color: '#424242' },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
});

export default Typography;
```

Вложенные `Text` компоненты наследуют стили родительского `Text`, что позволяет смешивать форматирование внутри одного абзаца.

### Ограничение количества строк

Свойство `numberOfLines` обрезает текст и показывает многоточие, если текст не помещается:

```jsx
<Text numberOfLines={2} ellipsizeMode="tail" style={{ fontSize: 14 }}>
  Очень длинный текст, который не помещается в две строки и будет автоматически
  обрезан с добавлением многоточия в конце строки.
</Text>
```

### Обработка нажатий на текст

```jsx
import { Text, Alert } from 'react-native';

const ClickableText = () => (
  <Text
    onPress={() => Alert.alert('Нажали на ссылку!')}
    style={{ color: '#1565c0', textDecorationLine: 'underline' }}
  >
    Нажми на меня
  </Text>
);
```

## Image

`Image` отображает изображения из разных источников: локальных ресурсов, сети или base64.

### Локальное изображение

```jsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const LocalImage = () => (
  <View style={styles.container}>
    {/* require() возвращает числовой идентификатор ресурса */}
    <Image
      source={require('./assets/logo.png')}
      style={styles.image}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  image: { width: 200, height: 100 },
});

export default LocalImage;
```

### Изображение из сети

```jsx
import React from 'react';
import { Image, ActivityIndicator, View } from 'react-native';

const NetworkImage = () => (
  <Image
    source={{
      uri: 'https://via.placeholder.com/300x200',
      // Опциональные заголовки для авторизованных запросов
      headers: { Authorization: 'Bearer token' },
    }}
    style={{ width: 300, height: 200, borderRadius: 8 }}
    resizeMode="cover"
    // Показываем что-то пока картинка грузится
    defaultSource={require('./assets/placeholder.png')}
  />
);
```

### resizeMode

| Значение | Поведение |
|----------|-----------|
| `cover` | Заполняет область, обрезая лишнее |
| `contain` | Вписывает целиком, не обрезая |
| `stretch` | Растягивает до размеров контейнера |
| `repeat` | Повторяет тайлингом (только iOS) |
| `center` | По центру без масштабирования |

## TextInput

`TextInput` — поле ввода текста. Один из самых гибких и часто используемых компонентов.

### Базовый TextInput

```jsx
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9e9e9e"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor="#9e9e9e"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
});

export default LoginForm;
```

### Полезные props TextInput

| Prop | Описание |
|------|----------|
| `keyboardType` | Тип клавиатуры: `default`, `numeric`, `email-address`, `phone-pad` и др. |
| `secureTextEntry` | Скрывает символы (для паролей) |
| `multiline` | Многострочный режим |
| `maxLength` | Максимальное количество символов |
| `autoFocus` | Автофокус при монтировании |
| `onFocus` / `onBlur` | Коллбэки фокуса и потери фокуса |
| `onSubmitEditing` | Вызывается при нажатии Enter / Done |

### Многострочный TextInput

```jsx
<TextInput
  style={{
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top', // Важно для Android
  }}
  multiline
  numberOfLines={4}
  placeholder="Введите описание..."
  onChangeText={(text) => console.log(text)}
/>
```

## Button

`Button` — простой кроссплатформенный компонент кнопки. Ограничен в стилизации, но удобен для быстрого прототипирования.

```jsx
import React from 'react';
import { Button, View, Alert } from 'react-native';

const SimpleButton = () => (
  <View style={{ padding: 16 }}>
    <Button
      title="Нажми меня"
      onPress={() => Alert.alert('Кнопка нажата!')}
      color="#6200ea" // Цвет текста на iOS, фон кнопки на Android
      disabled={false}
    />
  </View>
);

export default SimpleButton;
```

> **Совет:** Для кастомной стилизации кнопок используйте `TouchableOpacity`, `Pressable` или `TouchableHighlight` — они дают полный контроль над внешним видом.

## TouchableOpacity

`TouchableOpacity` — интерактивный контейнер, который при нажатии уменьшает прозрачность своего содержимого. Является стандартным подходом для создания нажимаемых элементов.

```jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const CustomButton = ({ title, onPress, loading, disabled }: CustomButtonProps) => (
  <TouchableOpacity
    style={[styles.button, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.7} // Непрозрачность при нажатии (0–1)
  >
    {loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Text style={styles.text}>{title}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200ea',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default CustomButton;
```

## Pressable

`Pressable` — более современный и гибкий аналог `TouchableOpacity`, добавленный в React Native 0.63. Позволяет задавать стили для разных состояний нажатия.

```jsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const PressableButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.pressed,
    ]}
  >
    {({ pressed }) => (
      <Text style={[styles.text, pressed && styles.pressedText]}>
        {pressed ? 'Нажато' : title}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressed: { backgroundColor: '#0d47a1', transform: [{ scale: 0.98 }] },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pressedText: { color: '#bbdefb' },
});

export default PressableButton;
```

`Pressable` поддерживает колбэки `onPressIn`, `onPressOut`, `onLongPress`, а также `hitSlop` для расширения области нажатия.

## ScrollView

`ScrollView` — прокручиваемый контейнер. Подходит для небольшого количества элементов (до ~20), так как все они отрисовываются сразу.

```jsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

const VerticalScroll = () => (
  <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
    bounces={true} // iOS: отскок при конце прокрутки
    keyboardShouldPersistTaps="handled" // Скрывает клавиатуру при нажатии вне TextInput
  >
    {Array.from({ length: 20 }, (_, i) => (
      <View key={i} style={styles.card}>
        <Text style={styles.cardText}>Карточка {i + 1}</Text>
      </View>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2, // Android тень
    shadowColor: '#000', // iOS тень
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardText: { fontSize: 16 },
});

export default VerticalScroll;
```

### Горизонтальная прокрутка

```jsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {categories.map((cat) => (
    <TouchableOpacity key={cat.id} style={styles.chip}>
      <Text>{cat.name}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

## FlatList

`FlatList` — виртуализированный список, который отрисовывает только видимые элементы. Незаменим для длинных списков.

```jsx
import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';

interface Item {
  id: string;
  title: string;
  subtitle: string;
}

const DATA: Item[] = Array.from({ length: 100 }, (_, i) => ({
  id: String(i),
  title: `Элемент ${i + 1}`,
  subtitle: `Описание элемента ${i + 1}`,
}));

const ListItem = React.memo(({ item }: { item: Item }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.subtitle}>{item.subtitle}</Text>
  </View>
));

const MyList = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const keyExtractor = useCallback((item: Item) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Item }) => <ListItem item={item} />, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Загрузка данных
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <FlatList
      data={DATA}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={<Text style={styles.header}>Список элементов</Text>}
      ListEmptyComponent={<Text style={styles.empty}>Список пуст</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  item: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#757575', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#eeeeee' },
  header: { padding: 16, fontSize: 20, fontWeight: 'bold' },
  empty: { padding: 32, textAlign: 'center', color: '#9e9e9e' },
});

export default MyList;
```

### Важные props FlatList

| Prop | Описание |
|------|----------|
| `data` | Массив данных |
| `renderItem` | Функция рендера каждого элемента |
| `keyExtractor` | Функция для уникального ключа |
| `numColumns` | Количество колонок (для сетки) |
| `onEndReached` | Колбэк при достижении конца списка |
| `onEndReachedThreshold` | Порог срабатывания (0–1) |
| `getItemLayout` | Оптимизация прокрутки при фиксированной высоте элементов |

## SectionList

`SectionList` — виртуализированный список с секциями. Удобен для контактов, FAQ, настроек.

```jsx
import React from 'react';
import { SectionList, View, Text, StyleSheet } from 'react-native';

const SECTIONS = [
  {
    title: 'Фрукты',
    data: ['Яблоко', 'Банан', 'Апельсин', 'Груша'],
  },
  {
    title: 'Овощи',
    data: ['Морковь', 'Картофель', 'Помидор', 'Огурец'],
  },
  {
    title: 'Ягоды',
    data: ['Клубника', 'Черника', 'Малина'],
  },
];

const GroupedList = () => (
  <SectionList
    sections={SECTIONS}
    keyExtractor={(item, index) => item + index}
    renderItem={({ item }) => (
      <View style={styles.item}>
        <Text style={styles.itemText}>{item}</Text>
      </View>
    )}
    renderSectionHeader={({ section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    )}
    stickySectionHeadersEnabled
  />
);

const styles = StyleSheet.create({
  item: { padding: 12, paddingLeft: 16, backgroundColor: '#fff' },
  itemText: { fontSize: 15 },
  sectionHeader: { padding: 8, paddingLeft: 16, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#616161', textTransform: 'uppercase' },
});

export default GroupedList;
```

## Switch

`Switch` — переключатель (тумблер), аналог чекбокса в мобильном UI.

```jsx
import React, { useState } from 'react';
import { Switch, View, Text, StyleSheet } from 'react-native';

const SettingsRow = ({ label, description }: { label: string; description: string }) => {
  const [enabled, setEnabled] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: '#bdbdbd', true: '#b39ddb' }}
        thumbColor={enabled ? '#6200ea' : '#f5f5f5'}
        ios_backgroundColor="#bdbdbd"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  labelContainer: { flex: 1, marginRight: 16 },
  label: { fontSize: 16, color: '#212121' },
  description: { fontSize: 13, color: '#757575', marginTop: 2 },
});

export default SettingsRow;
```

## ActivityIndicator

`ActivityIndicator` — спиннер загрузки. Используется для индикации фоновых операций.

```jsx
import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay = ({ visible, message = 'Загрузка...' }: LoadingOverlayProps) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
  },
  message: { marginTop: 12, fontSize: 14, color: '#424242' },
});

export default LoadingOverlay;
```

## StatusBar

`StatusBar` управляет строкой состояния (статусной строкой) устройства.

```jsx
import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';

const Screen = () => (
  <View style={styles.container}>
    <StatusBar
      barStyle="dark-content"    // 'default' | 'light-content' | 'dark-content'
      backgroundColor="#ffffff"  // Только Android
      translucent={false}        // Android: прозрачная статусбар
      hidden={false}             // Скрыть статусбар полностью
    />
    {/* Содержимое экрана */}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});

export default Screen;
```

## Modal

`Modal` отображает содержимое поверх основного экрана.

```jsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable
} from 'react-native';

const ConfirmDialog = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel} // Android: кнопка "Назад"
  >
    {/* Затемнение фона */}
    <Pressable style={styles.backdrop} onPress={onCancel}>
      {/* Предотвращаем закрытие при нажатии на сам диалог */}
      <Pressable style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={onConfirm}>
            <Text style={styles.confirmText}>Подтвердить</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    elevation: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#212121' },
  message: { fontSize: 14, color: '#616161', marginBottom: 20, lineHeight: 20 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#f5f5f5' },
  confirmBtn: { backgroundColor: '#6200ea' },
  cancelText: { color: '#424242', fontWeight: '500' },
  confirmText: { color: '#fff', fontWeight: '500' },
});

export default ConfirmDialog;
```

## SafeAreaView

`SafeAreaView` — контейнер, который автоматически добавляет отступы для областей, занятых аппаратными элементами: вырезами камеры, закруглёнными углами, индикатором домашнего экрана.

```jsx
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

const App = () => (
  // Обязательно оборачивайте корневой экран в SafeAreaView
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    {/* Весь контент приложения */}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
```

> **Рекомендация:** В проектах с React Navigation для более гибкого управления безопасными зонами используйте пакет `react-native-safe-area-context` и хук `useSafeAreaInsets`.

## KeyboardAvoidingView

`KeyboardAvoidingView` автоматически смещает содержимое вверх, когда появляется экранная клавиатура. Особенно важен для форм.

```jsx
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const FormScreen = () => (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
  >
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Поля формы */}
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
});

export default FormScreen;
```

## Практический пример: профиль пользователя

Объединим несколько компонентов в реальный экран:

```jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const ProfileScreen = () => {
  const [name, setName] = useState('Иван Иванов');
  const [email, setEmail] = useState('ivan@example.com');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Аватар */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changePhoto}>
            <Text style={styles.changePhotoText}>Изменить фото</Text>
          </TouchableOpacity>
        </View>

        {/* Поля */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Личные данные</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Имя"
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        {/* Настройки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Уведомления</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Тёмная тема</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>

        {/* Кнопка */}
        <TouchableOpacity style={styles.saveButton} onPress={() => {}}>
          <Text style={styles.saveText}>Сохранить</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  changePhoto: { padding: 8 },
  changePhotoText: { color: '#6200ea', fontSize: 14 },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#616161',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 15, color: '#212121' },
  saveButton: {
    backgroundColor: '#6200ea',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ProfileScreen;
```

## Заключение

React Native предоставляет богатый набор встроенных компонентов для создания мобильных интерфейсов:

- **View** — базовый контейнер с поддержкой Flexbox
- **Text** — отображение текста с вложенным форматированием
- **Image** — вывод изображений из разных источников
- **TextInput** — ввод данных с гибкими настройками клавиатуры
- **Button** / **TouchableOpacity** / **Pressable** — интерактивные элементы
- **ScrollView** — прокрутка небольших списков
- **FlatList** / **SectionList** — виртуализированные списки для больших данных
- **Switch** — переключатели в настройках
- **ActivityIndicator** — индикация загрузки
- **Modal** — всплывающие окна
- **SafeAreaView** — безопасная зона экрана
- **KeyboardAvoidingView** — управление клавиатурой в формах

Понимание каждого из этих компонентов — необходимая база для уверенной работы с React Native. Комбинируя их и используя StyleSheet, вы сможете строить сложные, производительные и красивые интерфейсы для iOS и Android.
