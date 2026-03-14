---
metaTitle: React Native основы - полное руководство для начинающих
metaDescription: Изучите основы React Native - компоненты, стили, состояние, навигация и работа с API. Полное руководство с примерами кода для старта мобильной разработки
author: Олег Марков
title: React Native - основы
preview: Погружение в основы React Native - от первых компонентов до управления состоянием и работы с данными. Всё необходимое для старта мобильной разработки с практическими примерами
---

## Введение

React Native — это фреймворк для создания кроссплатформенных мобильных приложений под iOS и Android с использованием JavaScript и React. В отличие от гибридных решений на основе WebView, React Native отображает настоящие нативные UI-компоненты, что обеспечивает высокую производительность и привычный пользовательский опыт.

В этой статье мы разберём фундаментальные концепции React Native: базовые компоненты, принципы стилизации, управление состоянием, обработку пользовательского ввода и работу с данными. После изучения вы будете готовы создавать полноценные мобильные приложения.

Если вы хотите освоить React Native глубоко и комплексно — приходите на наш курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=React-Native-osnovy). На курсе 184 урока и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, живое ревью наставника и еженедельные встречи с менторами.

## Архитектура React Native

Прежде чем писать код, важно понять, как React Native работает под капотом.

### Потоки выполнения

React Native использует многопоточную архитектуру:

- **JS Thread** — выполняет ваш JavaScript-код: обрабатывает логику приложения, управляет состоянием, вызывает обработчики событий
- **UI Thread (Main Thread)** — нативный поток для рендеринга компонентов и обработки жестов
- **Shadow Thread** — вычисляет layout с помощью Yoga (кросс-платформенная реализация Flexbox)

### Новая архитектура (JSI)

В современных версиях React Native (0.68+) введена новая архитектура на базе **JSI (JavaScript Interface)**:

- Заменяет старый асинхронный Bridge на синхронный интерфейс
- **Fabric** — новый рендерер, улучшающий производительность UI
- **TurboModules** — более эффективная работа с нативными модулями
- **CodeGen** — автоматическая генерация кода для нативных модулей

```javascript
// Пример: старый Bridge (асинхронный)
// JS → Bridge → Native (задержка из-за сериализации JSON)

// Новая архитектура JSI (синхронный доступ)
// JS → JSI → Native (прямое взаимодействие через C++)
```

## Базовые компоненты

React Native предоставляет набор базовых компонентов, которые компилируются в нативные элементы интерфейса.

### View

`View` — основной строительный блок, аналог `<div>` в HTML. Используется для группировки и позиционирования элементов.

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

function CardComponent() {
  return (
    <View style={styles.card}>
      <View style={styles.header} />
      <View style={styles.body} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3, // только для Android
  },
  header: {
    height: 48,
    backgroundColor: '#6200ee',
    borderRadius: 4,
  },
  body: {
    marginTop: 12,
    height: 100,
  },
});
```

### Text

Весь текст в React Native **обязательно** должен быть обёрнут в компонент `Text`. Нельзя размещать строки прямо в `View`.

```jsx
import React from 'react';
import { Text, View } from 'react-native';

function TypographyExample() {
  return (
    <View>
      {/* Базовый текст */}
      <Text>Простой текст</Text>

      {/* Стилизованный текст */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
        Заголовок
      </Text>

      {/* Вложенный текст — наследует стили родителя */}
      <Text style={{ color: 'blue' }}>
        Текст синим, а <Text style={{ fontWeight: 'bold' }}>этот жирный и синий</Text>
      </Text>

      {/* Ограничение строк */}
      <Text numberOfLines={2} ellipsizeMode="tail">
        Очень длинный текст, который будет обрезан после второй строки с многоточием в конце
      </Text>
    </View>
  );
}
```

### Image

Компонент для отображения изображений из сети, локального файла или bundle.

```jsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

function ImageExample() {
  return (
    <View>
      {/* Изображение из сети */}
      <Image
        source={{ uri: 'https://example.com/photo.jpg' }}
        style={styles.networkImage}
        resizeMode="cover"
        onLoad={() => console.log('Загружено!')}
        onError={(e) => console.log('Ошибка:', e.nativeEvent.error)}
      />

      {/* Локальное изображение */}
      <Image
        source={require('./assets/logo.png')}
        style={styles.localImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  networkImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  localImage: {
    width: 120,
    height: 120,
  },
});
```

### TextInput

Компонент для пользовательского ввода текста.

```jsx
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        returnKeyType="done"
      />

      <Text style={styles.hint}>
        Введите email: {email}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  hint: {
    color: '#666',
    fontSize: 14,
  },
});
```

### TouchableOpacity и Pressable

Для обработки нажатий на элементы используются специальные обёртки.

```jsx
import React from 'react';
import { TouchableOpacity, Pressable, Text, View, StyleSheet } from 'react-native';

function ButtonsExample() {
  return (
    <View style={styles.container}>
      {/* TouchableOpacity — снижает прозрачность при нажатии */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('Нажали!')}
        onLongPress={() => console.log('Долгое нажатие!')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>TouchableOpacity</Text>
      </TouchableOpacity>

      {/* Pressable — более гибкий, современный вариант */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => console.log('Pressable нажали!')}
      >
        {({ pressed }) => (
          <Text style={styles.buttonText}>
            {pressed ? 'Нажато!' : 'Pressable'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#3700b3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### ScrollView и FlatList

Для прокручиваемого контента в React Native используют `ScrollView` или `FlatList`.

```jsx
import React from 'react';
import { ScrollView, FlatList, View, Text, StyleSheet } from 'react-native';

// ScrollView — для небольшого количества элементов
function ScrollExample() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <View key={i} style={styles.item}>
          <Text>Элемент {i + 1}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// FlatList — для длинных списков с виртуализацией
const DATA = Array.from({ length: 1000 }, (_, i) => ({
  id: String(i),
  title: `Элемент ${i + 1}`,
}));

function FlatListExample() {
  const renderItem = ({ item }: { item: typeof DATA[0] }) => (
    <View style={styles.item}>
      <Text>{item.title}</Text>
    </View>
  );

  return (
    <FlatList
      data={DATA}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text>Список пуст</Text>}
      ListHeaderComponent={<Text style={styles.header}>Список элементов</Text>}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  item: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  separator: {
    height: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
  },
});
```

## Стилизация в React Native

React Native использует подмножество CSS с некоторыми особенностями.

### StyleSheet.create

Всегда используйте `StyleSheet.create` вместо inline-объектов — это повышает производительность и позволяет React Native оптимизировать стили.

```jsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Все свойства в camelCase (не kebab-case)
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,  // paddingLeft + paddingRight
    paddingVertical: 8,     // paddingTop + paddingBottom
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    fontWeight: '500',      // строка, не число
    textAlign: 'center',
  },
  // Числа — пиксели по умолчанию (НЕ rem или px)
  box: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
```

### Flexbox

React Native использует Flexbox для верстки. В отличие от веб, здесь `flexDirection` по умолчанию `column`, а `alignContent` — `flex-start`.

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function FlexboxExample() {
  return (
    <View style={styles.container}>
      {/* Горизонтальное расположение */}
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: '#e91e63' }]}>
          <Text style={styles.boxText}>1</Text>
        </View>
        <View style={[styles.box, { backgroundColor: '#9c27b0', flex: 1 }]}>
          <Text style={styles.boxText}>2 (flex: 1)</Text>
        </View>
        <View style={[styles.box, { backgroundColor: '#2196f3' }]}>
          <Text style={styles.boxText}>3</Text>
        </View>
      </View>

      {/* Центрирование */}
      <View style={styles.centered}>
        <Text>По центру</Text>
      </View>

      {/* Space between */}
      <View style={styles.spaceBetween}>
        <Text>Слева</Text>
        <Text>В центре</Text>
        <Text>Справа</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centered: {
    height: 80,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
  },
});
```

### Адаптивные размеры

```jsx
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Функция для адаптивных размеров
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

const styles = StyleSheet.create({
  // Процентные значения (работают для width/height)
  halfWidth: {
    width: '50%',
  },
  // Адаптивный размер шрифта
  adaptiveText: {
    fontSize: scale(16),
  },
  // Платформо-специфичные стили
  platformBox: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

## Управление состоянием

React Native использует те же хуки React, что и веб-разработка.

### useState и useEffect

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';

interface Post {
  id: number;
  title: string;
  body: string;
}

function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        if (isMounted) {
          setPosts(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    // Очистка при размонтировании
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ee" />;
  }

  if (error) {
    return <Text style={{ color: 'red', padding: 16 }}>{error}</Text>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{item.title}</Text>
          <Text style={{ color: '#666' }}>{item.body}</Text>
        </View>
      )}
    />
  );
}
```

### useCallback и useMemo

```jsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';

const ITEMS = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Товар ${i + 1}`,
  price: Math.floor(Math.random() * 10000),
}));

function SearchableList() {
  const [query, setQuery] = useState('');

  // useMemo — кэшируем фильтрацию
  const filteredItems = useMemo(
    () => ITEMS.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  );

  // useCallback — стабильный рендер-метод для FlatList
  const renderItem = useCallback(
    ({ item }: { item: typeof ITEMS[0] }) => (
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text>{item.name}</Text>
        <Text style={{ color: '#999' }}>{item.price} ₽</Text>
      </View>
    ),
    []
  );

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={{ height: 44, borderWidth: 1, borderColor: '#ddd', margin: 16, paddingHorizontal: 12, borderRadius: 8 }}
        placeholder="Поиск..."
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
      />
    </View>
  );
}
```

### Context API

```jsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Типы для контекста
interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Создаём контекст
const AuthContext = createContext<AuthContextType | null>(null);

// Провайдер
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Симуляция запроса к API
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}

// Использование в компоненте
function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Text>Войдите в систему</Text>;
  }

  return (
    <View>
      <Text>Привет, {user?.name}!</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Платформенные особенности

### Platform API

```jsx
import { Platform, StyleSheet } from 'react-native';

// Определение платформы
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Версия платформы
const iosVersion = Platform.Version; // string: "17.0"
const androidVersion = Platform.Version; // number: 33

// Выбор значений по платформе
const statusBarHeight = Platform.select({
  ios: 44,
  android: 24,
  default: 0,
});

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.select({ ios: 50, android: 24 }),
    backgroundColor: '#6200ee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### SafeAreaView

На современных устройствах есть "вырезы" (notch), динамический остров и нижние индикаторы. `SafeAreaView` автоматически добавляет отступы.

```jsx
import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, StatusBar } from 'react-native';

function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Мое приложение</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

## Работа с данными: AsyncStorage

Для хранения простых данных на устройстве используется AsyncStorage.

```jsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Сохранение данных
async function saveUserData(user: object) {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    console.log('Данные сохранены');
  } catch (error) {
    console.error('Ошибка сохранения:', error);
  }
}

// Чтение данных
async function loadUserData() {
  try {
    const jsonValue = await AsyncStorage.getItem('user');
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return null;
  } catch (error) {
    console.error('Ошибка чтения:', error);
    return null;
  }
}

// Удаление данных
async function clearUserData() {
  try {
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
}

// Использование с useEffect
function useUserData() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData().then(setUser);
  }, []);

  const saveUser = useCallback(async (userData: object) => {
    await saveUserData(userData);
    setUser(userData);
  }, []);

  return { user, saveUser };
}
```

## Навигация: React Navigation

React Navigation — стандартный инструмент для навигации в React Native.

```bash
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

```jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button } from 'react-native';

// Типизация параметров навигации
type RootStackParamList = {
  Home: undefined;
  Detail: { id: number; title: string };
  Profile: { userId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

// Экраны
function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Главная</Text>
      <Button
        title="Перейти к деталям"
        onPress={() => navigation.navigate('Detail', { id: 1, title: 'Статья 1' })}
      />
    </View>
  );
}

function DetailScreen({ route, navigation }) {
  const { id, title } = route.params;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
      <Text style={{ color: '#666', marginTop: 8 }}>ID: {id}</Text>
      <Button title="Назад" onPress={() => navigation.goBack()} />
    </View>
  );
}

// Настройка навигатора
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Работа с сетью (fetch и axios)

### fetch API

```jsx
import React, { useState, useEffect } from 'react';

interface ApiError {
  message: string;
  status: number;
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `HTTP Error: ${response.status}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// Создание записи
async function createPost(title: string, body: string) {
  const post = await apiRequest<{ id: number }>('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({ title, body, userId: 1 }),
  });
  return post;
}
```

### Кастомный хук для запросов

```jsx
import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useApi<T>(url: string): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка запроса');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url, trigger]);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  return { data, loading, error, refetch };
}

// Использование
function UserProfile({ userId }: { userId: number }) {
  const { data: user, loading, error, refetch } = useApi<{ name: string; email: string }>(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );

  if (loading) return <ActivityIndicator />;
  if (error) return (
    <View>
      <Text>Ошибка: {error}</Text>
      <Button title="Повторить" onPress={refetch} />
    </View>
  );

  return (
    <View>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
    </View>
  );
}
```

## Жизненный цикл и хуки

### AppState

```jsx
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

function useAppState(
  onChange?: (state: AppStateStatus) => void
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('Приложение на переднем плане');
        // Например: обновить данные, проверить уведомления
      }

      appState.current = nextAppState;
      onChange?.(nextAppState);
    });

    return () => subscription.remove();
  }, [onChange]);

  return appState.current;
}
```

### Keyboard API

```jsx
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, keyboardVisible };
}
```

## Нативные возможности

### Vibration

```jsx
import { Vibration, Platform } from 'react-native';

function hapticFeedback() {
  if (Platform.OS === 'android') {
    // Android: вибрация 200мс
    Vibration.vibrate(200);
  } else {
    // iOS: используйте @react-native-community/haptic-feedback для богатых вибраций
    Vibration.vibrate();
  }
}
```

### Linking

```jsx
import { Linking, Alert } from 'react-native';

async function openWebsite(url: string) {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Ошибка', `Не удалось открыть: ${url}`);
  }
}

// Открыть телефон
function callPhone(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

// Открыть email
function sendEmail(email: string) {
  Linking.openURL(`mailto:${email}?subject=Привет`);
}

// Открыть карты
function openMaps(lat: number, lng: number) {
  const url = Platform.select({
    ios: `maps:${lat},${lng}`,
    android: `geo:${lat},${lng}`,
  });
  if (url) Linking.openURL(url);
}
```

## Отладка и инструменты

### Встроенные инструменты отладки

```jsx
// console.log для отладки
console.log('Данные:', JSON.stringify(data, null, 2));
console.warn('Предупреждение');
console.error('Ошибка');

// __DEV__ — только в development режиме
if (__DEV__) {
  console.log('Это только для разработки');
}
```

### Flipper

Flipper — официальный дебаггер для React Native. Позволяет:
- Инспектировать элементы (React DevTools)
- Смотреть сетевые запросы
- Просматривать базу данных SQLite
- Отслеживать производительность

### React DevTools

```bash
# Установка
npm install -g react-devtools

# Запуск
react-devtools
```

## Лучшие практики

### Структура проекта

```
src/
├── components/        # Переиспользуемые компоненты
│   ├── ui/            # Базовые UI: Button, Input, Card
│   └── features/      # Фичевые компоненты
├── screens/           # Экраны приложения
├── navigation/        # Настройка навигации
├── hooks/             # Кастомные хуки
├── services/          # API-вызовы, бизнес-логика
├── store/             # Глобальное состояние (Redux/Zustand)
├── utils/             # Вспомогательные функции
├── constants/         # Константы, конфиг
└── types/             # TypeScript типы
```

### Оптимизация производительности

```jsx
import React, { memo, useCallback } from 'react';

// memo — не перерисовывать без изменения props
const ListItem = memo(({ item, onPress }: { item: Item; onPress: (id: number) => void }) => {
  return (
    <Pressable onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </Pressable>
  );
});

// Стабильный колбэк для передачи в дочерние компоненты
function List({ items }: { items: Item[] }) {
  const handlePress = useCallback((id: number) => {
    console.log('Нажали на', id);
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <ListItem item={item} onPress={handlePress} />}
      removeClippedSubviews={true}  // Удалять невидимые элементы из памяти
      getItemLayout={(data, index) => ({  // Если известна высота — ускоряет прокрутку
        length: 64,
        offset: 64 * index,
        index,
      })}
    />
  );
}
```

### TypeScript в React Native

```tsx
import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';

// Интерфейс компонента
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
}

const VARIANT_COLORS = {
  primary: '#6200ee',
  secondary: '#03dac6',
  danger: '#b00020',
};

const SIZE_PADDING = {
  small: { vertical: 6, horizontal: 12 },
  medium: { vertical: 10, horizontal: 20 },
  large: { vertical: 14, horizontal: 28 },
};

function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  loading = false,
}: ButtonProps) {
  const padding = SIZE_PADDING[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: disabled ? '#ccc' : VARIANT_COLORS[variant],
          paddingVertical: padding.vertical,
          paddingHorizontal: padding.horizontal,
          borderRadius: 8,
          alignItems: 'center',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text
          style={[{ color: '#fff', fontWeight: '600', fontSize: 16 }, textStyle]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
```

## Заключение

Мы рассмотрели основные концепции React Native:

- **Архитектура**: JS Thread, UI Thread, новая архитектура JSI
- **Базовые компоненты**: View, Text, Image, TextInput, TouchableOpacity, Pressable, ScrollView, FlatList
- **Стилизация**: StyleSheet.create, Flexbox, адаптивные размеры, Platform.select
- **Управление состоянием**: useState, useEffect, useCallback, useMemo, Context API
- **Навигация**: React Navigation, Stack Navigator
- **Работа с данными**: fetch API, AsyncStorage, кастомные хуки
- **Нативные возможности**: AppState, Keyboard, Vibration, Linking
- **Оптимизация**: memo, FlatList-оптимизации, TypeScript-типизация

React Native предоставляет богатую экосистему для создания полноценных мобильных приложений. Понимание этих основ является фундаментом для дальнейшего изучения более продвинутых тем: Expo Router, анимации с Reanimated, нативных модулей и публикации приложений.

Если вы хотите стать профессиональным разработчиком React Native — присоединяйтесь к нашему курсу [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=React-Native-osnovy). Вас ждут 184 урока, практические задания с AI-тренажерами и живое ревью от опытных наставников.
