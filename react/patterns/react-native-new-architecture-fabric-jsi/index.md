---
metaTitle: "React Native New Architecture: Fabric и JSI"
metaDescription: "Разбираем новую архитектуру React Native — JSI, Fabric рендерер, TurboModules и Codegen. Как работает и зачем нужен переход."
author: "Антон Ларичев"
title: "React Native New Architecture: Fabric и JSI"
preview: "Подробный разбор новой архитектуры React Native: что такое JSI и Fabric, почему они заменили старый Bridge и как это влияет на производительность."
---

## Что такое New Architecture в React Native

Начиная с версии 0.68 React Native получил новую архитектуру, которая стала стабильной и включённой по умолчанию в версии 0.74. Она принципиально меняет способ взаимодействия JavaScript-кода с нативным слоем.

Новая архитектура состоит из трёх ключевых компонентов:

- **JSI (JavaScript Interface)** — новый механизм связи между JS и нативным кодом
- **Fabric** — переписанный рендерер компонентов
- **TurboModules** — новая система нативных модулей

Для понимания того, зачем всё это появилось, нужно сначала разобраться с тем, что было раньше.

## Проблемы старой архитектуры: мост (Bridge)

В классической архитектуре React Native взаимодействие между JavaScript и нативным кодом происходило через асинхронный мост — **Bridge**.

Схема работы была следующей:

1. JavaScript-поток генерирует сообщения (сериализованные в JSON)
2. Сообщения передаются через Bridge в нативный поток
3. Нативный поток десериализует JSON и выполняет команды
4. Результат сериализуется обратно в JSON и возвращается в JS

```
JS Thread  →  [JSON serialize]  →  Bridge  →  [JSON deserialize]  →  Native Thread
JS Thread  ←  [JSON serialize]  ←  Bridge  ←  [JSON deserialize]  ←  Native Thread
```

Этот подход имел ряд серьёзных ограничений:

**Асинхронность как ограничение.** Все вызовы через мост были асинхронными. JS не мог напрямую вызвать нативную функцию и получить результат синхронно. Это затрудняло реализацию плавных анимаций и жестов.

**Накладные расходы на сериализацию.** Каждая передача данных требовала сериализации в JSON и обратно. При большом объёме данных или высокой частоте обмена это создавало заметные задержки.

**Избыточная инициализация модулей.** При старте приложения все нативные модули инициализировались сразу, независимо от того, будут ли они реально использованы.

**Трёхпоточная модель.** Рендеринг требовал координации трёх потоков: JS-поток, Shadow-поток (для расчёта лейаута через Yoga) и UI-поток. Синхронизация между ними добавляла задержки.

## JSI — JavaScript Interface

JSI (JavaScript Interface) — это C++ API, который позволяет JavaScript-движку напрямую взаимодействовать с нативным кодом без промежуточной сериализации.

### Как работает JSI

JSI предоставляет возможность регистрировать нативные объекты как объекты JavaScript-движка (JSRuntime). После регистрации JS-код может вызывать нативные методы **синхронно**, как обычные функции.

```cpp
// Пример регистрации нативного объекта через JSI (C++)
auto nativeModule = std::make_shared<NativeModuleExample>();
runtime.global().setProperty(
  runtime,
  "NativeModuleExample",
  jsi::Object::createFromHostObject(runtime, nativeModule)
);
```

После этого в JavaScript:

```javascript
// Прямой вызов без Bridge и без JSON-сериализации
const result = global.NativeModuleExample.getValue(42);
// result доступен синхронно
```

### Ключевые возможности JSI

**Прямое владение объектами.** JS может хранить ссылки на нативные объекты C++, и наоборот — нативный код может хранить ссылки на JS-объекты.

**Синхронные вызовы.** Можно синхронно вызывать нативные функции из JS и получать результат немедленно. Это критично для жестов, анимаций и других чувствительных к времени операций.

**Независимость от движка.** JSI не привязан к конкретному JS-движку. React Native использует Hermes, но JSI позволяет при необходимости заменить его на V8 или другой.

```javascript
// Пример использования JSI через TurboModule
import { TurboModuleRegistry } from 'react-native';

const CameraModule = TurboModuleRegistry.getEnforcing('CameraModule');

// Синхронный вызов — работает без Bridge
const isAvailable = CameraModule.isAvailable(); // boolean, синхронно
```

## TurboModules — новые нативные модули

TurboModules — это следующее поколение нативных модулей, построенное поверх JSI.

### Отличия от старых NativeModules

В старой архитектуре все нативные модули регистрировались и инициализировались при старте. Если приложение использует 50 модулей, но при запуске нужен только один — все 50 всё равно инициализировались.

TurboModules используют **ленивую инициализацию**: модуль создаётся только тогда, когда JS-код первый раз обращается к нему.

```javascript
// Старый подход — NativeModules
import { NativeModules } from 'react-native';
const { BluetoothModule } = NativeModules;
// BluetoothModule уже инициализирован при старте приложения

// Новый подход — TurboModules
import { TurboModuleRegistry } from 'react-native';
const BluetoothModule = TurboModuleRegistry.get('BluetoothModule');
// BluetoothModule инициализируется только при первом обращении
```

### Типизация через Codegen

TurboModules требуют строгой типизации, которая обеспечивается через **Codegen** — инструмент генерации кода на основе Flow или TypeScript-описаний.

```typescript
// Спецификация TurboModule на TypeScript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Синхронный метод
  readonly multiply: (a: number, b: number) => number;
  // Асинхронный метод
  readonly fetchData: (url: string) => Promise<string>;
  // Метод с callback
  readonly addEventListener: (
    eventName: string,
    callback: (data: Object) => void
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyModule');
```

Codegen на основе этой спецификации автоматически генерирует:
- Заголовочные файлы для iOS (Objective-C/Swift)
- Файлы для Android (Java/Kotlin)
- C++ связующий код

Это исключает несоответствие типов между JS и нативным кодом на этапе компиляции, а не в рантайме.

## Fabric — новый рендерер

Fabric — это полностью переписанная система рендеринга UI-компонентов. Он работает параллельно с JSI и решает проблемы синхронизации между потоками.

### Архитектура Fabric

Фundamentally, Fabric изменяет то, как строится и обновляется дерево компонентов.

В старой архитектуре:
1. React строит Virtual DOM в JS-потоке
2. Дерево теней (Shadow Tree) строится в отдельном C++ потоке
3. Изменения передаются в нативный UI-поток через Bridge

В Fabric:
1. React строит Element Tree в JS-потоке
2. Fabric C++ рендерер строит Shadow Tree напрямую через JSI
3. Монтирование происходит синхронно на нативном потоке

```
Старая архитектура:
JS → [Bridge/JSON] → Shadow Thread (Yoga) → [Bridge/JSON] → UI Thread

Fabric:
JS → [JSI/C++] → Shadow Thread (Yoga + Fabric) → UI Thread
                    ↑
              Синхронный доступ
```

### Concurrent Features

Fabric спроектирован для поддержки **конкурентного режима** React — тех же возможностей, что появились в React 18 для веба.

```javascript
import React, { useState, useTransition } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';

function SearchList({ items }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (text) => {
    setQuery(text);
    // Помечаем обновление списка как некритичное
    startTransition(() => {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
    });
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Поиск..."
      />
      {isPending && <Text>Загрузка...</Text>}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <Text>{item.name}</Text>}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

Без Fabric `useTransition` в React Native не работал корректно, потому что старый Bridge не мог обеспечить нужную приоритизацию обновлений.

### Синхронные измерения лейаута

Ещё одно важное преимущество Fabric — возможность синхронно читать размеры и позиции компонентов.

```javascript
import React, { useRef } from 'react';
import { View } from 'react-native';

function MeasureExample() {
  const viewRef = useRef(null);

  const handleLayout = () => {
    // В старой архитектуре measure был асинхронным
    // В Fabric можно использовать measureInWindow синхронно
    viewRef.current?.measureInWindow((x, y, width, height) => {
      console.log('Позиция:', { x, y, width, height });
    });
  };

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      style={{ width: 100, height: 100, backgroundColor: 'blue' }}
    />
  );
}
```

## Codegen — генерация типобезопасного кода

Codegen — инструмент, который запускается во время сборки и генерирует нативный код на основе TypeScript/Flow-спецификаций.

### Зачем нужен Codegen

До новой архитектуры несоответствие типов между JS и нативным кодом обнаруживалось только в рантайме. Если JS передавал строку вместо числа, приложение падало во время работы.

Codegen решает это на этапе компиляции:

```typescript
// Спецификация нативного компонента
import type { ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Int32,
  Float,
} from 'react-native/Libraries/Types/CodegenTypes';

export type OnProgressEvent = Readonly<{
  loaded: Float;
  total: Float;
}>;

export interface NativeProps extends ViewProps {
  // Свойства компонента
  src: string;
  resizeMode?: string;
  // События
  onProgress?: DirectEventHandler<OnProgressEvent>;
  onLoad?: DirectEventHandler<null>;
  // Размер
  blurRadius?: Int32;
}
```

По этой спецификации Codegen генерирует:
- `RCTImageViewComponentView.h` — заголовок для iOS
- `ImageViewNativeComponent.java` — класс для Android
- Типизированный JS-файл для использования в React

### Структура проекта с Codegen

```
my-native-component/
├── src/
│   ├── NativeMyComponent.ts   # Спецификация TurboModule
│   └── MyComponentNativeComponent.ts  # Спецификация компонента
├── ios/
│   ├── MyComponent.mm
│   └── MyComponent.h
├── android/
│   └── MyComponent.java
└── package.json
```

В `package.json` нужно указать конфигурацию Codegen:

```json
{
  "name": "my-native-component",
  "codegenConfig": {
    "name": "MyComponentSpec",
    "type": "all",
    "jsSrcsDir": "./src",
    "android": {
      "javaPackageName": "com.mycomponent"
    }
  }
}
```

## Практический пример: миграция NativeModule на TurboModule

Рассмотрим реальный пример перехода простого модуля на новую архитектуру.

### Старый NativeModule

```javascript
// Использование старого NativeModule
import { NativeModules } from 'react-native';

const { StorageModule } = NativeModules;

// Всегда асинхронно, нет типизации
StorageModule.getItem('key', (error, value) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(value);
});
```

### Новый TurboModule

```typescript
// storage-module/src/NativeStorageModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  // Синхронный метод — возможен благодаря JSI
  getItemSync(key: string): string | null;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StorageModule');
```

```typescript
// Использование TurboModule
import StorageModule from './NativeStorageModule';

// Асинхронный вариант
const value = await StorageModule.getItem('key');

// Синхронный вариант — работает благодаря JSI!
const valueSync = StorageModule.getItemSync('key');
console.log(valueSync); // string | null, немедленно
```

## Включение новой архитектуры

В React Native 0.74+ новая архитектура включена по умолчанию. Для более ранних версий:

### Android (gradle.properties)

```properties
# Включить New Architecture
newArchEnabled=true
```

### iOS (Podfile)

```ruby
# Podfile
use_react_native!(
  :path => config[:reactNativePath],
  # Включить New Architecture
  :fabric_enabled => true,
  :hermes_enabled => true
)
```

### Проверка включения

```javascript
import { TurboModuleRegistry } from 'react-native';

// Если новая архитектура включена, модуль вернёт объект
const isFabricEnabled = global.nativeFabricUIManager != null;
console.log('Fabric включён:', isFabricEnabled);
```

## Влияние на производительность

Новая архитектура даёт заметный прирост в реальных сценариях:

**Время запуска приложения.** Ленивая инициализация TurboModules сокращает время cold start, особенно для приложений с большим количеством нативных модулей.

**Плавность анимаций.** Прямой доступ через JSI позволяет нативным анимациям (через Reanimated 3) работать полностью в C++-потоке без обращений к JS.

```javascript
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function BouncingBox() {
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[{ width: 100, height: 100, backgroundColor: 'blue' }, animatedStyles]}
      onTouchStart={() => {
        // Анимация выполняется в нативном потоке через JSI
        // JS-поток не блокируется
        offset.value = withSpring(Math.random() * 200);
      }}
    />
  );
}
```

**Жесты.** Библиотека react-native-gesture-handler в связке с Fabric обрабатывает жесты синхронно на нативном потоке, не дожидаясь ответа от JS.

## Совместимость и миграция

Новая архитектура обратно совместима со старыми компонентами через слой совместимости. Большинство популярных библиотек уже поддерживают новую архитектуру:

- `react-native-reanimated` 3.x — полная поддержка
- `react-native-gesture-handler` 2.x — полная поддержка
- `react-native-screens` 3.x — полная поддержка
- `react-native-mmkv` — использует JSI нативно

Проверить совместимость библиотеки можно на сайте [reactnative.directory](https://reactnative.directory), где есть фильтр по поддержке New Architecture.

Для собственных нативных модулей миграция требует написания TypeScript-спецификации и обновления нативного кода под новые API — это разовая работа, которая окупается стабильностью и производительностью.

---

Для углублённого изучения React и смежных технологий рекомендуем курс PurpleSchool — [React с нуля до профессионала](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-new-architecture-fabric-jsi).