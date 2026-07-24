---
metaTitle: "React Native: от создания до публикации в App Store и Google Play"
metaDescription: "Пошаговое руководство по созданию React Native приложения: настройка окружения, разработка, сборка и публикация в App Store и Google Play."
author: "Антон Ларичев"
title: "React Native приложение с нуля до публикации в сторах"
preview: "Полный цикл разработки мобильного приложения на React Native — от инициализации проекта до публикации в App Store и Google Play."
---

## Что такое React Native и почему он популярен

React Native — это фреймворк от Meta, позволяющий создавать нативные мобильные приложения для iOS и Android, используя JavaScript и React. В отличие от WebView-решений, React Native компилирует код в настоящие нативные компоненты, что обеспечивает производительность, близкую к нативным приложениям.

Ключевые преимущества:

- Один кодовая база для iOS и Android
- Горячая перезагрузка во время разработки
- Доступ к нативным API устройства
- Большое сообщество и экосистема пакетов
- Переиспользование бизнес-логики с веб-проектами на React

## Настройка окружения разработки

Для работы с React Native потребуется установить несколько инструментов. Выберите подход: Expo CLI (проще для начала) или React Native CLI (полный контроль).

### Установка через React Native CLI

Установите необходимые зависимости:

```bash
# Node.js 18+ обязателен
npm install -g react-native-cli

# Для macOS — Xcode из App Store (для iOS)
# Android Studio для Android на любой платформе
```

Для Android настройте переменные окружения в `~/.bashrc` или `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Установка через Expo CLI

Expo — это надстройка над React Native, которая упрощает начало работы и скрывает большую часть нативной конфигурации:

```bash
npm install -g expo-cli
expo init MyApp
cd MyApp
npx expo start
```

Для большинства продакшн-проектов в итоге выбирают «голый» React Native CLI, так как Expo ограничивает доступ к некоторым нативным API. В этой статье рассмотрим именно React Native CLI.

## Создание проекта

```bash
npx react-native@latest init PurpleApp --template react-native-template-typescript
cd PurpleApp
```

Запуск на устройстве или эмуляторе:

```bash
# iOS (только macOS)
npx react-native run-ios

# Android
npx react-native run-android
```

## Структура проекта

Рекомендуемая структура для масштабируемого приложения:

```
PurpleApp/
├── android/          # Нативный Android проект
├── ios/              # Нативный iOS проект
├── src/
│   ├── api/          # Сетевые запросы
│   ├── components/   # Переиспользуемые компоненты
│   ├── navigation/   # Конфигурация навигации
│   ├── screens/      # Экраны приложения
│   ├── store/        # Управление состоянием
│   ├── hooks/        # Кастомные хуки
│   ├── utils/        # Вспомогательные функции
│   └── types/        # TypeScript типы
├── App.tsx
└── package.json
```

## Основные компоненты React Native

React Native предоставляет собственный набор компонентов вместо HTML-элементов:

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface CourseCardProps {
  course: Course;
  onPress: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(course.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: course.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
  },
  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default CourseCard;
```

Обратите внимание: стили в React Native — это JavaScript-объекты, не CSS. Свойства написаны в camelCase, а единицы измерения — безразмерные числа (density-independent pixels).

## Навигация с React Navigation

Самая популярная библиотека для навигации — React Navigation:

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# iOS
cd ios && pod install
```

Настройка навигации:

```tsx
// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CourseScreen from '../screens/CourseScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  Course: { courseId: string; title: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Курсы' }}
        />
        <Stack.Screen
          name="Course"
          component={CourseScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Профиль' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

Использование навигации в компоненте:

```tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavProp>();

  const openCourse = (courseId: string, title: string) => {
    navigation.navigate('Course', { courseId, title });
  };

  // ...
};
```

## Управление состоянием и сетевые запросы

Для сетевых запросов и кэширования данных хорошо зарекомендовала себя связка Zustand + React Query:

```bash
npm install @tanstack/react-query zustand
```

```tsx
// src/api/courses.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
}

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch('https://api.purpleschool.ru/courses');
  if (!response.ok) {
    throw new Error('Ошибка загрузки курсов');
  }
  return response.json();
};

// src/screens/HomeScreen.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../api/courses';
import { FlatList, ActivityIndicator, Text, View } from 'react-native';

const HomeScreen: React.FC = () => {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  if (error) {
    return <Text>Произошла ошибка загрузки</Text>;
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CourseCard
          course={item}
          onPress={(id) => navigation.navigate('Course', { courseId: id, title: item.title })}
        />
      )}
    />
  );
};
```

## Работа с нативными возможностями

React Native предоставляет доступ к нативным API через специализированные библиотеки:

```bash
# Хранилище данных
npm install @react-native-async-storage/async-storage

# Пуш-уведомления
npm install @notifee/react-native

# Доступ к камере
npm install react-native-vision-camera

# Биометрия
npm install react-native-biometrics
```

Пример работы с AsyncStorage для сохранения токена авторизации:

```tsx
// src/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

const TOKEN_KEY = '@auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true,

  loadToken: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    set({ token, isLoading: false });
  },

  login: async (token: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },
}));
```

## Подготовка к публикации

### Общие шаги

Перед сборкой релизной версии убедитесь, что:

- Иконки и сплэш-экран настроены (библиотека `react-native-bootsplash`)
- Приложение протестировано на реальных устройствах, а не только на эмуляторах
- Все переменные окружения вынесены в конфиг, а не захардкожены
- Версия и build number обновлены

### Публикация в Google Play

Сгенерируйте ключ подписи:

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore purple-app-release.keystore \
  -alias purple-app \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Добавьте данные ключа в `android/gradle.properties`:

```properties
PURPLE_APP_UPLOAD_STORE_FILE=purple-app-release.keystore
PURPLE_APP_UPLOAD_KEY_ALIAS=purple-app
PURPLE_APP_UPLOAD_STORE_PASSWORD=ваш_пароль
PURPLE_APP_UPLOAD_KEY_PASSWORD=ваш_пароль
```

Обновите `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
    signingConfigs {
        release {
            storeFile file(PURPLE_APP_UPLOAD_STORE_FILE)
            storePassword PURPLE_APP_UPLOAD_STORE_PASSWORD
            keyAlias PURPLE_APP_UPLOAD_KEY_ALIAS
            keyPassword PURPLE_APP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

Соберите AAB-файл для Google Play:

```bash
cd android
./gradlew bundleRelease
```

Файл появится в `android/app/build/outputs/bundle/release/app-release.aab`. Загрузите его в Google Play Console.

### Публикация в App Store

Для iOS нужен Mac с Xcode и аккаунт Apple Developer ($99/год).

Шаги для публикации:

1. Откройте `ios/PurpleApp.xcworkspace` в Xcode
2. Выберите команду разработчиков в `Signing & Capabilities`
3. Установите `Version` и `Build Number`
4. Выберите схему `Release` (Product → Scheme → Edit Scheme)
5. Создайте архив: Product → Archive
6. В Organizer нажмите `Distribute App` → `App Store Connect`

Для автоматизации процесса сборки и публикации используют `fastlane`:

```bash
gem install fastlane
fastlane init
```

Пример `Fastfile`:

```ruby
lane :deploy_android do
  gradle(
    task: 'bundle',
    build_type: 'Release',
    project_dir: 'android/'
  )
  upload_to_play_store(
    track: 'internal',
    aab: 'android/app/build/outputs/bundle/release/app-release.aab'
  )
end

lane :deploy_ios do
  build_app(
    workspace: 'ios/PurpleApp.xcworkspace',
    scheme: 'PurpleApp',
    configuration: 'Release'
  )
  upload_to_app_store(
    skip_metadata: true,
    skip_screenshots: true
  )
end
```

## Обновление приложения без переизданий

Для мелких обновлений JavaScript-кода без прохождения ревью в сторах используют CodePush от Microsoft (App Center):

```bash
npm install react-native-code-push
```

```tsx
import CodePush from 'react-native-code-push';

const App: React.FC = () => {
  // ... логика приложения
};

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  updateDialog: true,
  installMode: CodePush.InstallMode.IMMEDIATE,
})(App);
```

Важно: CodePush подходит только для обновлений JS-бандла. Изменения в нативном коде всегда требуют нового релиза через стор.

## Типичные ошибки при публикации

Список проблем, с которыми сталкиваются разработчики при первой публикации:

- Забыли обновить `versionCode` (Android) или `Build Number` (iOS) — стор отклонит загрузку
- Используется HTTP вместо HTTPS — Apple требует App Transport Security
- Приложение запрашивает разрешения, которые не указаны в `Info.plist` (iOS) или `AndroidManifest.xml` (Android)
- Иконки не соответствуют требованиям размеров (iOS не принимает иконки с прозрачностью)
- Не настроен Deep Linking, хотя приложение его использует
- Отсутствует политика конфиденциальности — обязательна для обоих сторов

## Итоги

Разработка мобильного приложения на React Native включает несколько ключевых этапов: настройка окружения, создание структуры проекта, реализация UI на нативных компонентах, настройка навигации, управление состоянием и сетевыми запросами, а затем сборка и публикация в Google Play и App Store.

React Native позволяет переиспользовать до 80-90% кода между платформами, значительно ускоряя разработку. При этом для требовательных к производительности частей всегда можно добавить нативные модули на Kotlin или Swift.

Чтобы углубить знания и на практике собрать полноценное приложение от проектирования до публикации, смотрите курс по React Native на PurpleSchool: https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-from-scratch-to-stores