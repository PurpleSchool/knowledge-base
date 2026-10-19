---
metaTitle: "Expo Router навигация в React Native — полный гайд"
metaDescription: "Файловая навигация в React Native с Expo Router: стек, табы, динамические маршруты, защищённые экраны и хуки навигации."
author: "Антон Ларичев"
title: "React Native Expo Router: навигация в мобильных приложениях"
preview: "Как настроить файловую навигацию в React Native с помощью Expo Router: стек, табы, динамические маршруты и защита экранов."
---

## Что такое Expo Router

Expo Router — это библиотека маршрутизации для React Native, построенная поверх React Navigation. Её главная идея заимствована из Next.js: структура файлов в папке `app/` определяет маршруты приложения. Вместо ручного объявления навигаторов и экранов достаточно создать нужный файл — и маршрут появится автоматически.

Такой подход даёт несколько преимуществ:

- Маршруты читаются как структура папок, а не как вложенный JSX
- Deep linking настраивается автоматически
- Одна кодовая база работает на iOS, Android и в вебе
- Типобезопасная навигация через TypeScript

## Установка и первоначальная настройка

Проще всего начать с официального шаблона:

```bash
npx create-expo-app@latest my-app --template tabs
cd my-app
npx expo start
```

Если нужно добавить Expo Router в существующий проект:

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

Затем в `package.json` укажите точку входа:

```json
{
  "main": "expo-router/entry"
}
```

И настройте схему deep link в `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    }
  }
}
```

## Файловая система маршрутов

Вся навигация живёт в папке `app/`. Каждый файл — это экран, каждая папка — это сегмент маршрута.

```
app/
  _layout.tsx       # корневой layout
  index.tsx         # экран /
  about.tsx         # экран /about
  profile/
    _layout.tsx     # layout для /profile/*
    index.tsx       # экран /profile
    settings.tsx    # экран /profile/settings
  (tabs)/
    _layout.tsx     # tab-навигатор
    home.tsx        # таб /home
    explore.tsx     # таб /explore
```

Файлы с особым назначением:

- `_layout.tsx` — обёртка для группы экранов, здесь объявляется тип навигатора
- `index.tsx` — индексный экран директории
- `[id].tsx` — динамический сегмент маршрута
- `(group)/` — папка в скобках группирует экраны без добавления сегмента в URL
- `+not-found.tsx` — экран для несуществующих маршрутов

## Stack-навигация

Стековая навигация — это базовый тип: экраны укладываются друг на друга, новый экран появляется поверх предыдущего.

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Главная' }} />
      <Stack.Screen name="about" options={{ title: 'О нас' }} />
      <Stack.Screen
        name="profile/[id]"
        options={{ title: 'Профиль', headerBackTitle: 'Назад' }}
      />
    </Stack>
  );
}
```

Открыть новый экран в стеке:

```tsx
// app/index.tsx
import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View>
      <Text>Главная</Text>
      <Link href="/about">Перейти на страницу «О нас»</Link>
      <Link href="/profile/42">Открыть профиль</Link>
    </View>
  );
}
```

Компонент `Link` работает аналогично `<a>` в вебе. Для программной навигации используйте хук `useRouter`:

```tsx
import { useRouter } from 'expo-router';
import { Button } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <Button
      title="Открыть профиль"
      onPress={() => router.push('/profile/42')}
    />
  );
}
```

Методы `router`:

- `router.push(href)` — добавляет экран в стек
- `router.replace(href)` — заменяет текущий экран без сохранения в истории
- `router.back()` — возвращается назад
- `router.dismiss()` — закрывает модальный экран

## Tab-навигация

Табовая навигация — панель вкладок внизу экрана. Для её настройки создайте группу `(tabs)/`:

```
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    explore.tsx
    profile.tsx
```

Объявите tab-навигатор:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

Корневой layout должен знать о группе `(tabs)` как об отдельном маршруте:

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

## Динамические маршруты

Файл `[id].tsx` создаёт динамический сегмент. Квадратные скобки — это параметр, который можно считать в экране.

```tsx
// app/product/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Text>Товар #{id}</Text>
    </View>
  );
}
```

Чтобы поймать любое количество сегментов, используйте `[...slug].tsx`:

```tsx
// app/category/[...slug].tsx
import { useLocalSearchParams } from 'expo-router';

export default function CategoryScreen() {
  // /category/electronics/phones → slug = ['electronics', 'phones']
  const { slug } = useLocalSearchParams<{ slug: string[] }>();

  return <Text>{slug.join(' > ')}</Text>;
}
```

Передача дополнительных параметров через query string:

```tsx
// навигация
router.push({
  pathname: '/product/[id]',
  params: { id: '42', color: 'red', size: 'M' },
});

// получение параметров
const { id, color, size } = useLocalSearchParams();
```

## Группы маршрутов и вложенные навигаторы

Группы в скобках позволяют организовать файлы логически, не влияя на URL:

```
app/
  (auth)/
    _layout.tsx   # Stack без header
    login.tsx     # /login
    register.tsx  # /register
  (app)/
    _layout.tsx   # Tab-навигатор
    index.tsx     # /
    profile.tsx   # /profile
```

Пример разделения авторизованной и публичной зоны:

```tsx
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

```tsx
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Лента' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
```

## Защищённые маршруты

Expo Router предоставляет хук `useSegments` для проверки текущего пути и `useRootNavigationState` для ожидания готовности навигатора.

```tsx
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';

function useProtectedRoute(isAuthenticated: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [isAuthenticated, segments]);
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useProtectedRoute(isAuthenticated);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

## Модальные экраны

Модальное окно объявляется в корневом layout с `presentation: 'modal'`:

```tsx
// app/_layout.tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen
    name="modal"
    options={{
      presentation: 'modal',
      title: 'Выберите опцию',
    }}
  />
</Stack>
```

Открыть модалку и закрыть её:

```tsx
// Открытие
router.push('/modal');

// Закрытие внутри modal.tsx
const router = useRouter();
router.dismiss();
// или если нужно вернуться на конкретный экран
router.back();
```

## Полезные хуки

### usePathname

Возвращает текущий путь без параметров:

```tsx
import { usePathname } from 'expo-router';

export default function NavBar() {
  const pathname = usePathname(); // '/profile/settings'
  return <Text>Текущий экран: {pathname}</Text>;
}
```

### useGlobalSearchParams

Возвращает все query-параметры текущего маршрута:

```tsx
import { useGlobalSearchParams } from 'expo-router';

export default function Screen() {
  const { sort, filter } = useGlobalSearchParams();
  // ...
}
```

### useFocusEffect

Выполняет код при фокусировке экрана — например, обновляет данные при возврате:

```tsx
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ListScreen() {
  useFocusEffect(
    useCallback(() => {
      fetchData();

      return () => {
        // очистка при потере фокуса
      };
    }, [])
  );
}
```

## TypeScript и типобезопасные маршруты

Expo Router может автоматически генерировать типы маршрутов. Добавьте в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["expo-router/types"]
  }
}
```

И включите генерацию в `app.json`:

```json
{
  "expo": {
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Теперь `href` в компоненте `Link` и методах `router` будут проверяться на этапе компиляции:

```tsx
// TypeScript подскажет ошибку, если маршрут не существует
<Link href="/profle">Профиль</Link>; // ошибка: /profle не существует
<Link href="/profile">Профиль</Link>; // OK
```

## Итог

Expo Router превращает навигацию в React Native из сложной конфигурации навигаторов в интуитивную файловую структуру. Стековая и табовая навигация, динамические маршруты, группировка экранов и защита маршрутов — всё это решается декларативно, без лишнего кода.

Главное, что стоит запомнить:

- Структура папки `app/` — это и есть карта экранов
- `_layout.tsx` объявляет тип навигатора для вложенных экранов
- Группы `(group)/` помогают разделять авторизованную и публичную части
- Хук `useRouter` заменяет весь императивный API навигации
- Типизированные маршруты ловят опечатки в путях на этапе компиляции

Чтобы уверенно работать с React Native и Expo Router, изучите полный курс на PurpleSchool: https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=text&utm_campaign=expo-router-navigation