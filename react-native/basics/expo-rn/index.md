---
metaTitle: Expo — платформа для React Native разработки, EAS Build, Expo Router
metaDescription: Полное руководство по Expo для React Native — Managed и Bare Workflow, Expo SDK, EAS Build/Submit/Update, Expo Router, OTA-обновления, преимущества и недостатки
author: Олег Марков
title: Expo — платформа для React Native разработки
preview: Разбираем Expo как платформу для React Native — как работают Managed и Bare Workflow, EAS Build, Expo Router, OTA-обновления, и когда выбирать Expo вместо чистого React Native
---

## Введение

Если вы работаете с React Native или только планируете начать, Expo — это первое, с чем вы столкнётесь. Это комплексная платформа, которая значительно упрощает разработку, сборку и публикацию мобильных приложений. Однако за простотой скрывается мощный инструментарий, который важно понимать глубоко, чтобы делать осознанный выбор в пользу Expo или чистого React Native.

В этой статье мы разберём всё, что нужно знать о Expo: от базовых концепций и быстрого старта до EAS Build, Expo Router и принципов OTA-обновлений.

## Что такое Expo и зачем он нужен

Expo — это open source платформа и набор инструментов, построенных поверх React Native. Он предоставляет:

- **Унифицированный инструмент разработки** — CLI, эмулятор в браузере, мобильный клиент для тестирования
- **Готовые API и компоненты** — Expo SDK с модулями для камеры, геолокации, уведомлений и многого другого
- **Облачные сервисы** — EAS (Expo Application Services) для сборки, публикации и обновлений
- **Файловую маршрутизацию** — Expo Router для навигации в стиле Next.js

Основная идея Expo — убрать сложность нативной настройки и позволить разработчику сосредоточиться на написании JavaScript/TypeScript кода. Вместо того чтобы разбираться с Xcode, Android Studio, Gradle и CocoaPods, вы просто пишете код, а Expo берёт на себя остальное.

Expo — это отличный выбор для большинства проектов, но для его эффективного использования важно понимать, как работает React Native и мобильная разработка в целом. Если вы хотите получить системные знания — приходите на курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=expo-rn). На курсе 184 урока и 11 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Основные возможности Expo

### Expo Go — мгновенное тестирование

Expo Go — это мобильное приложение из App Store и Google Play, которое позволяет запускать ваш код без сборки нативного приложения. После запуска `npx expo start` вы получаете QR-код, который сканируете в Expo Go, и ваше приложение появляется на телефоне за секунды.

```bash
# Запуск девелоперского сервера
npx expo start

# Expo Go автоматически подхватит изменения при сохранении файлов
```

Ограничение Expo Go: он работает только с пакетами, включёнными в Expo SDK. Если вам нужен кастомный нативный модуль, Expo Go не подойдёт — нужно будет собрать development build.

### Development Build — замена Expo Go

Development Build — это ваше собственное приложение с встроенным expo-dev-client. Оно ведёт себя как Expo Go, но поддерживает любые нативные библиотеки:

```bash
# Установка expo-dev-client
npx expo install expo-dev-client

# Сборка development build через EAS
eas build --profile development --platform android
```

### Expo SDK — готовые модули для нативных функций

Expo SDK — набор модулей для работы с нативными возможностями устройства. Все модули тестируются совместно и обновляются синхронно:

```bash
# Установка нужных модулей
npx expo install expo-camera expo-location expo-notifications
```

Основные модули SDK:

| Модуль | Функциональность |
|--------|-----------------|
| `expo-camera` | Камера, сканирование QR/штрихкодов |
| `expo-location` | GPS и геолокация |
| `expo-notifications` | Push-уведомления |
| `expo-image-picker` | Выбор фото и видео из галереи |
| `expo-file-system` | Работа с файловой системой |
| `expo-secure-store` | Безопасное хранение данных |
| `expo-av` | Аудио и видео воспроизведение |
| `expo-sensors` | Акселерометр, гироскоп, барометр |
| `expo-font` | Загрузка кастомных шрифтов |
| `expo-splash-screen` | Управление сплэш-экраном |

Пример использования камеры:

```javascript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Text, View } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Разрешения ещё загружаются
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>Нужен доступ к камере</Text>
        <Button title="Разрешить" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView style={{ flex: 1 }} facing="back">
      {/* Контент поверх камеры */}
    </CameraView>
  );
}
```

## Managed Workflow vs Bare Workflow

Это принципиальный выбор, который определяет архитектуру вашего проекта.

### Managed Workflow

В Managed Workflow Expo полностью управляет нативным кодом. У вас нет папок `android/` и `ios/` в репозитории. Конфигурация идёт через `app.json` или `app.config.js`:

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.company.myapp",
      "supportsTablet": true
    },
    "android": {
      "package": "com.company.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      ["expo-camera", { "cameraPermission": "Нужен доступ к камере" }]
    ]
  }
}
```

Преимущества Managed Workflow:
- Нет нативного кода в репозитории — чище, проще
- Обновления Expo SDK минимальны — меняете версию в `package.json`
- Конфигурация нативных функций через Config Plugins
- OTA-обновления работают из коробки

Ограничения Managed Workflow:
- Только модули из Expo SDK или совместимые с ним
- Нельзя добавить произвольный нативный код напрямую
- Зависимость от цикла обновлений Expo SDK

### Bare Workflow

В Bare Workflow у вас есть полный доступ к нативному коду — папки `android/` и `ios/` присутствуют в проекте. Вы можете использовать любые React Native библиотеки и вносить любые нативные изменения, но берёте на себя ответственность за управление нативными зависимостями.

```bash
# Создание проекта в Bare Workflow
npx create-expo-app my-app --template bare-minimum

# Или переход из Managed (устаревший способ)
npx expo prebuild
```

Команда `expo prebuild` генерирует нативные папки из вашей конфигурации в `app.config.js`. Это ключевая особенность — вы можете работать в стиле Managed, но при необходимости "овеществить" нативный код.

Когда выбирать Bare Workflow:
- Нужны кастомные нативные модули, которых нет в Expo SDK
- Требуется глубокая интеграция с нативными SDK (например, сложные платёжные системы)
- Нужен полный контроль над нативными настройками

## Expo Router для навигации

Expo Router — это файловая система маршрутизации для React Native, работающая по принципу Next.js. Структура папок в `app/` определяет маршруты приложения:

```
app/
├── _layout.tsx       # Корневой layout
├── index.tsx         # Маршрут "/" (главный экран)
├── (tabs)/
│   ├── _layout.tsx   # Layout для tab-навигации
│   ├── home.tsx      # Маршрут "/home"
│   └── profile.tsx   # Маршрут "/profile"
├── product/
│   ├── [id].tsx      # Динамический маршрут "/product/123"
│   └── index.tsx     # Маршрут "/product"
└── modal.tsx         # Модальный экран
```

Пример layout с tab-навигацией:

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

Навигация в Expo Router:

```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Переход на экран
router.push('/product/123');

// Замена текущего маршрута
router.replace('/home');

// Назад
router.back();

// Получение параметров маршрута
function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>Продукт: {id}</Text>;
}
```

Expo Router поддерживает Deep Linking из коробки — маршруты автоматически становятся Universal Links для iOS и App Links для Android.

## EAS — Expo Application Services

EAS — это набор облачных сервисов для профессиональной разработки с Expo. Он включает три основных продукта.

### EAS Build

EAS Build — облачный сервис для сборки нативных приложений. Вы не собираете приложение локально — EAS делает это на своих серверах:

```bash
# Установка EAS CLI
npm install -g eas-cli

# Авторизация в Expo
eas login

# Инициализация EAS в проекте
eas build:configure
```

Конфигурация в `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

Запуск сборки:

```bash
# Сборка для Android (production)
eas build --platform android

# Сборка для iOS (production)
eas build --platform ios

# Сборка для обеих платформ
eas build --platform all

# Сборка preview (APK для тестирования)
eas build --profile preview --platform android
```

Преимущества EAS Build:
- Не нужен macOS для сборки iOS приложений
- Подписывает приложения автоматически
- Кеширует зависимости для ускорения
- Интегрируется с CI/CD

### EAS Submit

EAS Submit автоматизирует загрузку приложения в App Store и Google Play:

```bash
# Загрузка последней сборки в магазины
eas submit --platform android
eas submit --platform ios

# Указание конкретной сборки
eas submit --platform android --id <build-id>
```

### EAS Update — OTA обновления

EAS Update позволяет обновлять JavaScript-код приложения без публикации новой версии в магазины. Это работает потому, что React Native выполняет JS-код динамически:

```bash
# Установка модуля
npx expo install expo-updates

# Публикация обновления
eas update --branch production --message "Исправлен баг с авторизацией"
```

Конфигурация обновлений в `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id",
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

Программное управление обновлениями:

```typescript
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // Применяем обновление при следующем запуске
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.log('Ошибка при проверке обновлений:', error);
  }
}
```

Ограничения OTA-обновлений:
- Нельзя обновить нативный код (Java/Kotlin/Swift/ObjC)
- Нельзя добавить новые нативные зависимости
- Обновление JavaScript, ассетов (картинки, шрифты) — можно

## Преимущества Expo

**Скорость разработки**
- Нет нужды настраивать Xcode/Android Studio для базовой разработки
- Expo Go позволяет видеть изменения мгновенно
- Hot reloading работает из коробки

**Экосистема**
- Более 200 готовых нативных модулей в Expo SDK
- Все модули тестируются совместно — нет конфликтов версий
- Регулярные обновления с поддержкой новых версий React Native

**Инфраструктура**
- EAS Build — сборка без локального окружения
- EAS Submit — автоматическая публикация в магазины
- OTA-обновления — быстрые фиксы без ревью магазина

**Expo Router**
- Файловая маршрутизация как в Next.js
- Типобезопасные маршруты
- Universal Links из коробки
- Tab-навигация, stack-навигация, модалы — всё конфигурируется через файловую структуру

**TypeScript**
- Полная поддержка TypeScript из коробки
- Типы для всех модулей SDK

## Недостатки Expo

**Зависимость от Expo SDK**
В Managed Workflow вы ограничены тем, что поддерживает Expo SDK. Если нужна библиотека с нативным кодом, которой нет в SDK — придётся переходить в Bare Workflow.

**Размер приложения**
Expo SDK включает много предустановленных модулей, что увеличивает размер итогового приложения. В Managed Workflow нет возможности убрать неиспользуемые нативные модули без Bare Workflow.

**Задержка обновлений React Native**
Expo SDK обновляется после выхода новой версии React Native — обычно с задержкой в несколько месяцев. Если нужны самые свежие возможности RN, Expo может не успевать.

**Зависимость от облачной инфраструктуры**
EAS Build — платный сервис (с бесплатным тарьфом с ограничениями). Команды с большим количеством сборок платят за облачное время сборки.

**Сложность при глубокой нативной интеграции**
Для некоторых случаев (специализированные SDK для устройств, сложные платёжные системы, Bluetooth Low Energy) интеграция в Expo сложнее, чем в чистом React Native.

## Когда выбирать Expo, когда чистый React Native

**Выбирайте Expo если:**
- Стартуете новый проект — Expo даст преимущество в скорости старта
- Команда не имеет опыта с нативной разработкой (Xcode/Android Studio)
- Нужны стандартные нативные функции: камера, геолокация, уведомления, авторизация
- Важно OTA-обновления для быстрого деплоя фиксов
- Нет выделенного iOS-разработчика — EAS Build позволяет собирать iOS без Mac
- Небольшая или средняя команда, важна скорость разработки

**Выбирайте чистый React Native если:**
- Уже существующий проект с большим количеством кастомного нативного кода
- Нужна глубокая интеграция с проприетарными нативными SDK
- Критична минимальная размер приложения и максимальный контроль над бандлом
- Требуются возможности, которые Expo SDK не покрывает
- Команда имеет сильный опыт в iOS/Android разработке

**Компромисс: Bare Workflow**
Bare Workflow даёт вам лучшее из двух миров — вы используете инструменты Expo (EAS Build, OTA-обновления, Config Plugins), но имеете полный доступ к нативному коду. Большинство продакшн-проектов, которые начинают с Managed Workflow, в итоге переходят к Bare Workflow по мере роста.

## Быстрый старт и базовые команды

### Создание нового проекта

```bash
# Новый проект с Expo Router (рекомендуется)
npx create-expo-app my-app

# С конкретным шаблоном
npx create-expo-app my-app --template tabs

# Bare Workflow
npx create-expo-app my-app --template bare-minimum
```

### Основные команды разработки

```bash
# Запуск девелоперского сервера
npx expo start

# Запуск на конкретной платформе
npx expo start --android
npx expo start --ios

# Очистка кеша
npx expo start --clear

# Установка пакетов (используйте expo install вместо npm install)
npx expo install expo-camera
npx expo install react-native-reanimated

# Проверка совместимости пакетов
npx expo doctor
```

### Команды EAS

```bash
# Сборка development build
eas build --profile development --platform android

# Сборка для production
eas build --platform all

# Публикация OTA-обновления
eas update --branch production --message "Fix"

# Отправка в магазины
eas submit --platform all

# Просмотр истории сборок
eas build:list
```

## Структура проекта

Типичный Expo проект с Expo Router выглядит так:

```
my-app/
├── app/                    # Маршруты (Expo Router)
│   ├── _layout.tsx         # Корневой layout
│   ├── (tabs)/             # Группа вкладок
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── explore.tsx
│   └── modal.tsx
├── assets/                 # Статические файлы
│   ├── fonts/
│   └── images/
├── components/             # Переиспользуемые компоненты
│   ├── ui/
│   └── ...
├── hooks/                  # Кастомные хуки
├── constants/              # Константы (цвета, размеры)
├── app.json                # Конфигурация Expo
├── eas.json                # Конфигурация EAS
├── babel.config.js         # Конфигурация Babel
├── tsconfig.json           # TypeScript конфигурация
└── package.json
```

Конфигурационные файлы:

```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel']
  };
};
```

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Заключение

Expo — это зрелая платформа, которая за годы развития стала стандартом для большинства новых проектов на React Native. Managed Workflow даёт быстрый старт и простоту поддержки, Bare Workflow — гибкость и контроль. EAS Build, Submit и Update закрывают весь цикл CI/CD без необходимости настраивать собственную инфраструктуру. Expo Router привносит знакомую файловую маршрутизацию в мобильную разработку.

Правильный выбор между Expo и чистым React Native зависит от требований проекта, опыта команды и нативных зависимостей. Для большинства новых проектов Expo в Managed Workflow — это оптимальная отправная точка, от которой всегда можно перейти к Bare Workflow при необходимости.

Чтобы освоить Expo и React Native на практике, включая работу с Expo Router, EAS и нативными модулями, приходите на курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=expo-rn). В первых 3 модулях доступно бесплатное содержание — можно начать прямо сейчас.

## Часто задаваемые вопросы

### Можно ли использовать Expo с существующим React Native проектом?

Да, можно подключить отдельные пакеты Expo SDK к существующему RN проекту, но полноценные возможности Expo (EAS Build, Expo Router, Config Plugins) лучше использовать с проектами, созданными через `create-expo-app`. Частичная интеграция возможна, но потребует ручной настройки.

### Expo Router или React Navigation — что выбрать?

Expo Router работает поверх React Navigation и добавляет файловую маршрутизацию. Если начинаете новый проект с Expo — используйте Expo Router: он проще в конфигурации и поддерживает Deep Linking из коробки. React Navigation по-прежнему актуален для Bare Workflow и проектов, где нужна нестандартная структура навигации.

### Как работает OTA-обновление, если пользователь не открывает приложение?

OTA-обновление загружается при следующем запуске приложения. Если пользователь редко открывает приложение, обновление всё равно применится при следующем запуске. Вы можете настроить поведение: применять обновление сразу (`reloadAsync()`) или при следующем запуске.

### Нужен ли аккаунт Expo для использования Expo CLI?

Для базовой разработки с Expo Go аккаунт не обязателен. Для EAS Build, EAS Submit и EAS Update — нужна регистрация на expo.dev. Бесплатный план включает ограниченное количество сборок в месяц.

### Как управлять разными окружениями (dev/staging/production) в Expo?

Используйте `app.config.js` вместо `app.json` для динамической конфигурации, переменные окружения через `process.env` и профили в `eas.json`. Каждый профиль EAS может иметь свои переменные окружения и настройки сборки.

```javascript
// app.config.js
export default ({ config }) => {
  const isProduction = process.env.APP_ENV === 'production';

  return {
    ...config,
    name: isProduction ? 'My App' : 'My App (Dev)',
    slug: 'my-app',
    extra: {
      apiUrl: isProduction
        ? 'https://api.production.com'
        : 'https://api.staging.com',
    },
  };
};
```
