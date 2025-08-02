---
metaTitle: Реализация аутентификации пользователей в React Native
metaDescription: Изучите как реализовать аутентификацию пользователей в React Native - основные подходы, лучшие библиотеки, практические примеры c управлением токенами
author: Олег Марков
title: Реализация аутентификации пользователей в React Native
preview: Изучите на практике, как сделать аутентификацию пользователей в React Native приложении - пошаговые примеры, хранение токенов и интеграция с backend
---

## Введение

Аутентификация пользователей — одна из ключевых задач, с которыми сталкивается большинство мобильных приложений. Если вы разрабатываете приложение на React Native, обеспечение надежного входа и управления состоянием пользователя становится не только технической необходимостью, но и частью пользовательского опыта. Давайте разберемся, как реализовать процесс аутентификации на практике: от хранения данных до интеграции с API, выбора библиотек и назначения защищенных маршрутов.

## Способы аутентификации в React Native

Перед тем как перейти к коду, важно понимать основные подходы:

- **Классическая аутентификация по email и паролю** — пользователь вводит свои данные, приложение отправляет их на сервер, получает токен доступа.
- **Социальная аутентификация** — пользователь входит через Google, Facebook, Apple и т.д.
- **Безопасное хранение и автоматизация с помощью сохранения токенов** — авторизованный пользователь может не вводить логин при каждом запуске.

В этой статье основной акцент будет на классической схеме: email/пароль + токены. В конце также затронем обработку социальных логинов, чтобы вы понимали, как их интегрировать.

## Архитектура аутентификации: из чего состоит процесс

В React Native процесс выглядит так:

1. Пользователь вводит данные и отправляет запрос на сервер.
2. Сервер возвращает токен (например, JWT).
3. Приложение хранит токен (например, в AsyncStorage или SecureStore).
4. Все защищённые запросы отправляются с этим токеном.
5. Когда токен истекает, пользователь перенаправляется на экран входа.

Давайте реализуем это шаг за шагом.

## Хранение токенов: выбор хранилища

### AsyncStorage

Самый простой вариант для демонстрации — использование [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/).

Установка:

```bash
npm install @react-native-async-storage/async-storage
```

Использование:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Сохраняем токен
const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token); // Сохраняем токен под ключом authToken
  } catch (e) {
    // Обработка ошибок сохранения
  }
};

// Получаем токен
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch(e) {
    // Обработка ошибок получения
  }
};
```

> **Важно:** AsyncStorage не защищает данные на уровне ОС. Для высокочувствительных задач лучше использовать [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) или Keychain (iOS) / Encrypted Shared Preferences (Android).

### SecureStore (Expo)

Если вы используете Expo, вам подойдет SecureStore:

```bash
expo install expo-secure-store
```

```javascript
import * as SecureStore from 'expo-secure-store';

// Сохранение токена
await SecureStore.setItemAsync('authToken', token);

// Получение токена
const token = await SecureStore.getItemAsync('authToken');
```

Этот вариант предпочтительнее для защиты данных.

## Создание экранов входа и регистрации

Давайте создадим базовые формы для авторизации. Для простоты будем использовать React Hooks.

### Компонент входа

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState(''); // Храним email пользователя
  const [password, setPassword] = useState(''); // Храним пароль
  const [error, setError] = useState(null);

  // Функция отправки формы
  const handleLogin = async () => {
    try {
      const response = await fetch('https://ваш-сервер/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.token); // Передаем токен дальше
      } else {
        setError(data.message || 'Ошибка входа');
      }
    } catch (e) {
      setError('Сетевая ошибка');
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Войти" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
```

Здесь реализована отправка формы на сервер, обработка ошибок и обновление состояния интерфейса.

### Обработка успешного входа: сохранение токена и переход

После успешного входа сохраните токен и откройте основной экран приложения. Пример:

```javascript
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import MainAppScreen from './MainAppScreen';

const App = () => {
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    // Пробуем загрузить токен при старте приложения
    AsyncStorage.getItem('authToken').then(setToken);
  }, []);

  const handleLogin = async (newToken) => {
    await AsyncStorage.setItem('authToken', newToken); // Сохраняем новый токен
    setToken(newToken); // Обновляем состояние
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  return <MainAppScreen />;
};

export default App;
```

> Обратите внимание: при запуске приложения мы сразу пробуем достать токен, чтобы не просить пользователя входить повторно.

## Защищённые маршруты и навигация

Обычно используют [React Navigation](https://reactnavigation.org/) для управления маршрутами. Давайте посмотрим, как реализовать защищённые и публичные экраны с помощью стека:

```bash
npm install @react-navigation/native @react-navigation/stack
```

Пример навигации:

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const AppNavigator = ({ token, onLogin }) => (
  <NavigationContainer>
    <Stack.Navigator>
      {!token ? (
        // Если нет токена, показываем экран входа
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
      ) : (
        // Если токен есть, показываем главный экран
        <Stack.Screen name="Main" component={MainAppScreen} />
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
```

Такое разделение помогает контролировать доступ к защищённым экранам.

## Использование токенов в API-запросах

Любой защищенный запрос на сервер должен содержать токен авторизации. Обычно для этого формируют специальную функцию или API-клиент:

```javascript
const apiRequest = async (endpoint, options = {}) => {
  // Получаем токен из хранилища для каждого запроса
  const token = await AsyncStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`, // Добавляем заголовок авторизации
    'Content-Type': 'application/json',
  };

  const response = await fetch(`https://ваш-сервер/api/${endpoint}`, {
    ...options,
    headers,
  });
  return response.json();
};

// Пример использования:
const getUserProfile = () => apiRequest('users/me');
```

Обратите внимание, как мы автоматически добавляем токен к каждому запросу.

## Реализация выхода из системы

Когда пользователь выходит, важно полностью удалить токен и перенаправить на экран входа:

```javascript
const handleLogout = async () => {
  await AsyncStorage.removeItem('authToken'); // Удаляем токен из хранилища
  setToken(null); // Возвращаемся к состоянию неавторизованного пользователя
};
```

Интерфейс выхода стоит обязательно сделать заметным и всегда доступным в UI приложения.

## Управление состоянием авторизации

Для сложных проектов используйте глобальное состояние (например, Redux или Context). Пример с Context API:

```javascript
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  const signIn = (newToken) => setToken(newToken);
  const signOut = () => setToken(null);

  // Можно расширить логикой получения пользователя
  return (
    <AuthContext.Provider value={{ token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

Используйте этот контекст в любом компоненте для управления состоянием авторизации.

## Обработка истечения токена и автоматический выход

Токены доступа обычно имеют срок жизни. Ваш API вернет ошибку 401/403 при устаревшем токене — важно сразу обработать это и выйти пользователя из системы. Например:

```javascript
const apiRequest = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('authToken');
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const response = await fetch(`https://ваш-сервер/api/${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Токен просрочен — удаляем и перенаправляем на экран входа
    await AsyncStorage.removeItem('authToken');
    // Можно вызвать функцию выхода из вашего context/provider
  }

  return response.json();
};
```

## Социальная аутентификация

Интегрировать социальные логины можно с помощью специализированных библиотек:

- Google: [react-native-google-signin](https://github.com/react-native-google-signin/google-signin)
- Facebook: [react-native-fbsdk-next](https://github.com/thebergamo/react-native-fbsdk-next)
- Apple: [@invertase/react-native-apple-authentication](https://github.com/invertase/react-native-apple-authentication)

Краткий пример (Google):

```bash
npm install @react-native-google-signin/google-signin
```

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'ваш-web-client-id.apps.googleusercontent.com', // Настройте в Google Cloud
});

const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  // userInfo содержит данные пользователя и accessToken
  // Далее отправьте этот токен на свой сервер для валидации или регистрации
};
```

Каждая соцсеть требует отдельной регистрации вашей платформы и настройки идентификаторов (client id и пр.).

## Защита маршрутов и lazy-loading экранов

Часто защищённые экраны отделяют от публичных с помощью навигационных стеков и проверки токена. Для повышения UX используйте экран загрузки (Splash Screen), пока идет проверка наличия токена.

Пример структуры приложения:

- SplashScreen — проверка токена
- AuthStack — экраны входа/регистрации
- AppStack — защищённые экраны

## Работа с Push-уведомлениями при аутентификации

Если ваше приложение использует Push-уведомления, помните: регистрация устройства на уведомления часто также зависит от токена пользователя. Меняйте токен устройства на сервере при входе и выходе пользователя.

## Заключение

Реализация аутентификации в React Native приложении требует комплексного подхода: продуманная архитектура, безопасное хранение токенов, корректная обработка состояния авторизации и интеграция с API или социальными провайдерами. Используйте современные библиотеки и следуйте рекомендациям по безопасности — тогда ваше приложение будет не только удобным, но и защищенным.

## Частозадаваемые технические вопросы по теме и ответы

### 1. Как защититься от кражи токенов в React Native?

Для большей безопасности не храните токены в `AsyncStorage`, используйте защищённые хранилища — SecureStore или Keychain/Encrypted Shared Preferences. На сервере применяйте короткий TTL для access-токенов и обновления по refresh-токену.

### 2. Как обновлять access-токен не прося пользователя снова войти?

Обычно сервер выдает два токена: access и refresh. Access-токен используется для запросов, refresh — чтобы получить новый access, когда первый устарел. Сохраняйте оба токена и обновляйте при ошибке 401, по необходимости реализуйте соответствующий эндпоинт на бэкенде.

### 3. Как очистить всю пользовательскую информацию при выходе?

Убедитесь, что вы удалили не только токен, но и другие связанные данные: профили, настройки, кэш. После выхода через `removeItem` вызовите функции сброса глобального состояния или сбросьте store сессии.

### 4. Почему не стоит использовать localStorage (webStorage) в React Native?

В React Native стандартного `localStorage` нет. Используйте специальные решения (`AsyncStorage`, SecureStore), предназначенные для мобильных платформ.

### 5. Как лучше тестировать работу аутентификации?

Используйте модульные тесты с моками API и инструментальное тестирование (например, Detox, Jest). Тестируйте сценарии входа, выхода, истечения токена и восстановления сессии.