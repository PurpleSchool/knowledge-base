---
metaTitle: "React Native MMKV — быстрое хранилище данных"
metaDescription: "Как использовать MMKV в React Native: установка, чтение и запись данных, интеграция с хуками и Zustand, сравнение с AsyncStorage."
author: "Антон Ларичев"
title: "React Native MMKV: быстрое хранилище для мобильных приложений"
preview: "MMKV — высокопроизводительное хранилище ключ-значение для React Native, работающее в 10–30 раз быстрее AsyncStorage."
---

## Что такое MMKV

MMKV — это библиотека хранилища ключ-значение, разработанная командой WeChat. Она основана на формате memory-mapped files, что позволяет читать и записывать данные практически без задержек. В экосистеме React Native библиотека доступна через пакет `react-native-mmkv`.

В отличие от `AsyncStorage`, MMKV работает **синхронно** и не блокирует JS-поток, поскольку нативные операции выполняются на уровне C++ через JSI (JavaScript Interface). Данные сохраняются на диск автоматически.

### Когда стоит использовать MMKV

- Хранение токенов аутентификации и настроек пользователя
- Кэширование небольших объёмов данных между сессиями
- Флаги onboarding, тема приложения, язык интерфейса
- Персистентность состояния стор-менеджеров (Zustand, Redux)

Для хранения крупных структурированных данных (сотни тысяч записей) лучше выбрать SQLite или Realm.

## Сравнение с AsyncStorage

| Характеристика | AsyncStorage | MMKV |
|---|---|---|n| API | Асинхронный | Синхронный |
| Скорость чтения | ~100 мс | ~1 мс |
| Скорость записи | ~100 мс | ~1 мс |
| Шифрование | Нет | Есть (AES-256) |
| Поддержка JSI | Нет | Есть |
| Размер данных | До 6 МБ (Android) | Нет жёсткого лимита |

По бенчмаркам из официальной документации MMKV превосходит AsyncStorage в 10–30 раз на типичных операциях.

## Установка

Установите пакет и его зависимость:

```bash
npm install react-native-mmkv
```

Для iOS после установки выполните:

```bash
npx pod-install
```

Для Expo-приложений с управляемым workflow MMKV недоступен напрямую — потребуется Expo Development Build или переход на bare workflow.

### Минимальные требования

- React Native 0.71+
- iOS 13+
- Android API 21+
- Включённый New Architecture (для полного JSI-режима)

## Базовое использование

Создайте экземпляр хранилища один раз и используйте его по всему приложению:

```typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();
```

### Запись данных

```typescript
// Строки
storage.set('username', 'anton');

// Числа
storage.set('score', 42);

// Булевы значения
storage.set('isLoggedIn', true);

// Объекты — сериализуйте вручную
const user = { id: 1, name: 'Anton' };
storage.set('user', JSON.stringify(user));
```

### Чтение данных

```typescript
const username = storage.getString('username'); // 'anton' | undefined
const score = storage.getNumber('score');       // 42 | undefined
const isLoggedIn = storage.getBoolean('isLoggedIn'); // true | undefined

// Объекты — десериализуйте вручную
const raw = storage.getString('user');
const user = raw ? JSON.parse(raw) : null;
```

### Удаление данных

```typescript
// Удалить один ключ
storage.delete('username');

// Удалить все данные хранилища
storage.clearAll();

// Получить список всех ключей
const keys = storage.getAllKeys(); // string[]
```

## Несколько независимых хранилищ

Вы можете создавать несколько изолированных экземпляров с разными `id`:

```typescript
import { MMKV } from 'react-native-mmkv';

export const authStorage = new MMKV({ id: 'auth' });
export const settingsStorage = new MMKV({ id: 'settings' });
export const cacheStorage = new MMKV({ id: 'cache' });
```

Каждый экземпляр хранит данные в отдельном файле. Это позволяет, например, очищать кэш не затрагивая данные аутентификации.

## Шифрование

MMKV поддерживает шифрование AES-256. Ключ шифрования передаётся при создании экземпляра:

```typescript
import { MMKV } from 'react-native-mmkv';

export const secureStorage = new MMKV({
  id: 'secure',
  encryptionKey: 'my-secret-32-char-encryption-key',
});
```

Ключ шифрования рекомендуется получать из нативного Keychain (iOS) или Keystore (Android), а не хранить в коде. Для этого используйте `react-native-keychain` в связке с MMKV.

## Хуки React

Библиотека предоставляет хук `useMMKVString`, `useMMKVNumber`, `useMMKVBoolean` для реактивного чтения данных:

```typescript
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
import { storage } from './storage';

function ProfileScreen() {
  const [username, setUsername] = useMMKVString('username', storage);
  const [isDark, setIsDark] = useMMKVBoolean('darkMode', storage);

  return (
    // ...
  );
}
```

Компонент автоматически перерисуется при изменении значения по ключу — даже если изменение произошло в другом компоненте или вне React-дерева.

### Хук для объектов

Для хранения объектов напишите обёртку:

```typescript
import { useMMKVString } from 'react-native-mmkv';
import { storage } from './storage';

function useMMKVObject<T>(key: string) {
  const [raw, setRaw] = useMMKVString(key, storage);

  const value: T | undefined = raw ? JSON.parse(raw) : undefined;

  const setValue = (newValue: T) => {
    setRaw(JSON.stringify(newValue));
  };

  return [value, setValue] as const;
}

// Использование
function App() {
  const [user, setUser] = useMMKVObject<{ id: number; name: string }>('user');

  return // ...
}
```

## Интеграция с Zustand

MMKV отлично работает как персистентный слой для Zustand через middleware `persist`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const storage = new MMKV({ id: 'zustand' });

const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

Теперь состояние Zustand автоматически сохраняется между перезапусками приложения через MMKV.

## Интеграция с Redux Persist

Для Redux-приложений создайте кастомный storage-адаптер:

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'redux' });

export const reduxStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};
```

Затем передайте его в `persistConfig`:

```typescript
import { persistReducer } from 'redux-persist';
import { reduxStorage } from './mmkvStorage';

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
};
```

## Слушатели изменений

MMKV позволяет подписаться на изменения конкретного ключа:

```typescript
import { storage } from './storage';

const listener = storage.addOnValueChangedListener((changedKey) => {
  console.log(`Ключ «${changedKey}» был изменён`);
  const newValue = storage.getString(changedKey);
  console.log('Новое значение:', newValue);
});

// Отписаться при размонтировании
listener.remove();
```

В компоненте используйте `useEffect` для управления жизненным циклом подписки:

```typescript
import { useEffect } from 'react';
import { storage } from './storage';

function SyncComponent() {
  useEffect(() => {
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === 'theme') {
        // Обновить тему приложения
      }
    });

    return () => listener.remove();
  }, []);

  return null;
}
```

## Типизация хранилища

Для строгой типизации создайте типизированную обёртку над MMKV:

```typescript
import { MMKV } from 'react-native-mmkv';

type StorageSchema = {
  token: string;
  userId: number;
  isOnboarded: boolean;
  settings: { theme: 'light' | 'dark'; language: string };
};

const mmkv = new MMKV({ id: 'app' });

function get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | undefined {
  const type = typeof ({} as StorageSchema)[key];

  if (type === 'string') {
    return mmkv.getString(key as string) as StorageSchema[K];
  }
  if (type === 'number') {
    return mmkv.getNumber(key as string) as StorageSchema[K];
  }
  if (type === 'boolean') {
    return mmkv.getBoolean(key as string) as StorageSchema[K];
  }

  const raw = mmkv.getString(key as string);
  return raw ? (JSON.parse(raw) as StorageSchema[K]) : undefined;
}

function set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
  const type = typeof value;
  if (type === 'string') mmkv.set(key as string, value as string);
  else if (type === 'number') mmkv.set(key as string, value as number);
  else if (type === 'boolean') mmkv.set(key as string, value as boolean);
  else mmkv.set(key as string, JSON.stringify(value));
}

export const typedStorage = { get, set };
```

## Частые ошибки

**Хранение больших объёмов данных.** MMKV оптимизирован для небольших значений (до нескольких мегабайт). Если нужно хранить списки из тысяч записей — используйте SQLite.

**Потеря реактивности.** Если вы читаете значение через `storage.getString()` напрямую внутри компонента (без хука), компонент не перерисуется при изменении данных. Используйте `useMMKVString` и аналоги.

**Несинхронизированный ключ шифрования.** При смене ключа шифрования старые данные станут нечитаемыми. Перед сменой ключа необходимо мигрировать данные вручную.

**Создание нескольких экземпляров с одним id.** Каждый `new MMKV({ id: 'same' })` возвращает один и тот же underlying-экземпляр, но обёртки не синхронизированы. Создавайте экземпляр единожды и экспортируйте его.

## Итог

MMKV — это стандарт де-факто для хранения небольших данных в React Native приложениях. Синхронный JSI-API, встроенное шифрование и реактивные хуки делают его удобной заменой AsyncStorage во всех сценариях: от хранения токенов до персистентности глобального стора.

Чтобы углубиться в разработку React Native приложений, пройдите курс на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-mmkv-fast-storage