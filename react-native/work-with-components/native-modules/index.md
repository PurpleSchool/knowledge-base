---
metaTitle: Нативные модули в React Native — полное руководство
metaDescription: Подробное руководство по нативным модулям в React Native: TurboModules, JSI, создание и использование готовых модулей, работа с Android и iOS
author: Олег Марков
title: Нативные модули в React Native
preview: Разберитесь, как работают нативные модули в React Native — от базовой архитектуры до современных TurboModules на JSI, с практическими примерами для Android и iOS
---

## Введение

React Native позволяет создавать кроссплатформенные мобильные приложения на JavaScript, однако рано или поздно разработчик сталкивается с необходимостью использовать возможности, которые JavaScript сам по себе не предоставляет: доступ к датчикам устройства, Bluetooth, камере, файловой системе, биометрии и прочим нативным API. Именно для этих целей существуют **нативные модули** — мост между JavaScript и нативным кодом платформы (Android/iOS).

В этой статье вы узнаете:
- Как устроена архитектура нативных модулей в React Native
- В чём разница между старой архитектурой (Bridge) и новой (JSI / TurboModules)
- Как подключать готовые нативные пакеты
- Как создать собственный нативный модуль для Android (Java/Kotlin) и iOS (Objective-C/Swift)
- Как тестировать нативные модули и избегать типичных ошибок

Мы разберём тему последовательно, от теории к практике, с подробными примерами кода.

## Архитектура нативных модулей

### Старая архитектура: JavaScript Bridge

В классическом React Native обмен данными между JavaScript и нативным кодом осуществлялся через так называемый **Bridge** (мост). Эта архитектура работала следующим образом:

1. JavaScript-поток формирует сообщение (сериализованное в JSON)
2. Сообщение передаётся через Bridge в нативный поток
3. Нативный код обрабатывает запрос и возвращает ответ обратно

```
┌─────────────────────────────────────────────────────┐
│  JavaScript Thread                                   │
│  NativeModules.PlatformInfo.getInfo() → JSON msg    │
└─────────────────┬───────────────────────────────────┘
                  │ Bridge (async, JSON serialization)
┌─────────────────▼───────────────────────────────────┐
│  Native Thread (Java / Objective-C)                  │
│  Обработка вызова → promise.resolve(result)          │
└─────────────────────────────────────────────────────┘
```

**Ограничения старой архитектуры:**
- Все вызовы асинхронны — синхронного доступа из JS нет
- JSON-сериализация вносит накладные расходы на производительность
- Большой объём данных передаётся медленно

### Новая архитектура: JSI и TurboModules

Начиная с React Native 0.68, команда Meta активно развивает **новую архитектуру**, основу которой составляет **JSI** (JavaScript Interface). JSI позволяет JavaScript напрямую обращаться к нативным объектам без JSON-сериализации.

Ключевые компоненты новой архитектуры:

| Компонент | Описание |
|-----------|----------|
| **JSI** | Низкоуровневый C++ интерфейс для прямого взаимодействия JS с нативным кодом |
| **TurboModules** | Нативные модули, построенные на JSI — загружаются лениво по требованию |
| **Fabric** | Новый рендерер UI-компонентов на JSI |
| **Codegen** | Генерация типобезопасных интерфейсов из TypeScript/Flow спецификаций |

**Преимущества новой архитектуры:**
- Синхронные вызовы из JavaScript
- Ленивая загрузка модулей (экономия памяти)
- Строгая типизация через Codegen
- Значительно лучшая производительность

```
┌─────────────────────────────────────────────────────┐
│  JavaScript Thread                                   │
│  turboModule.getInfo() — прямой вызов через JSI     │
└──────────────────────┬──────────────────────────────┘
                       │ JSI (C++, без сериализации)
┌──────────────────────▼──────────────────────────────┐
│  Native Code (TurboModule C++ host object)           │
│  Прямой доступ к нативным методам                   │
└─────────────────────────────────────────────────────┘
```

## Подключение готовых нативных модулей

Большинство распространённых нативных функций уже реализованы в готовых библиотеках. Прежде чем писать собственный модуль, всегда стоит поискать существующее решение.

### Установка нативного пакета

Большинство современных пакетов поддерживают **автолинкинг** — механизм, который автоматически связывает нативный код с проектом при `npm install`.

```bash
# Установка пакета с нативным кодом
npm install react-native-device-info

# Для iOS — обновите нативные зависимости
cd ios && pod install && cd ..
```

После установки запустите `npx react-native run-android` или `npx react-native run-ios`.

> **Важно:** Для проектов на Expo используйте `expo install` вместо `npm install`, чтобы получить совместимую версию пакета.

### Автолинкинг и ручная линковка

**Автолинкинг** работает начиная с React Native 0.60 и не требует дополнительных действий. Система автоматически сканирует `node_modules` и находит пакеты с нативным кодом.

Если пакет не поддерживает автолинкинг (старые библиотеки), потребуется **ручная линковка**:

```bash
# Устаревший способ (React Native < 0.60)
react-native link react-native-some-package
```

Для ручной линковки на Android нужно вручную добавить пакет в `MainApplication.java` и `settings.gradle`. На iOS — добавить библиотеку в Xcode и обновить `Podfile`.

### Пример использования готового нативного модуля

Рассмотрим работу с `react-native-device-info` — популярным пакетом для получения информации об устройстве:

```bash
npm install react-native-device-info
cd ios && pod install && cd ..
```

```typescript
import DeviceInfo from 'react-native-device-info';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

interface DeviceDetails {
  model: string;
  systemVersion: string;
  bundleId: string;
  isEmulator: boolean;
}

export default function DeviceScreen() {
  const [details, setDetails] = useState<DeviceDetails | null>(null);

  useEffect(() => {
    // Получаем информацию об устройстве асинхронно
    async function fetchDeviceInfo() {
      const model = await DeviceInfo.getModel();
      const systemVersion = DeviceInfo.getSystemVersion(); // синхронный
      const bundleId = DeviceInfo.getBundleId(); // синхронный
      const isEmulator = await DeviceInfo.isEmulator();

      setDetails({ model, systemVersion, bundleId, isEmulator });
    }

    fetchDeviceInfo();
  }, []);

  if (!details) {
    return <Text>Загрузка...</Text>;
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>Модель: {details.model}</Text>
      <Text>Система: {details.systemVersion}</Text>
      <Text>Bundle ID: {details.bundleId}</Text>
      <Text>Эмулятор: {details.isEmulator ? 'Да' : 'Нет'}</Text>
    </View>
  );
}
```

## Создание собственного нативного модуля

Если подходящего готового решения нет, вам нужно создать собственный нативный модуль. Рассмотрим процесс на примере модуля для получения информации о батарее.

### Структура проекта

Рекомендуется выносить нативные модули в отдельную папку:

```
android/
  app/
    src/main/java/com/yourapp/
      battery/
        BatteryModule.java       # нативный модуль Android
        BatteryPackage.java      # пакет Android
ios/
  YourApp/
    battery/
      BatteryModule.h            # заголовочный файл iOS
      BatteryModule.m            # реализация iOS
src/
  modules/
    Battery.ts                   # JS-обёртка
```

### Нативный модуль для Android

#### Шаг 1: Создание класса модуля (Java)

```java
// android/app/src/main/java/com/yourapp/battery/BatteryModule.java
package com.yourapp.battery;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

// Наследуемся от ReactContextBaseJavaModule
public class BatteryModule extends ReactContextBaseJavaModule {

  // Контекст приложения для доступа к системным API
  private final ReactApplicationContext reactContext;

  public BatteryModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    // Это имя используется в JavaScript: NativeModules.Battery
    return "Battery";
  }

  // @ReactMethod — аннотация для методов, доступных из JS
  @ReactMethod
  public void getBatteryLevel(Promise promise) {
    try {
      // Получаем информацию о батарее через системный API Android
      IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
      Intent batteryStatus = reactContext.registerReceiver(null, ifilter);

      int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

      // Вычисляем процент заряда
      float batteryPct = level * 100 / (float) scale;

      // Создаём объект для передачи в JS
      WritableMap result = Arguments.createMap();
      result.putDouble("level", batteryPct);
      result.putBoolean("isLow", batteryPct < 20);

      promise.resolve(result);
    } catch (Exception e) {
      // Обязательно обрабатываем ошибки
      promise.reject("BATTERY_ERROR", "Could not get battery level: " + e.getMessage());
    }
  }

  // Метод с аннотацией @ReactMethod(isBlockingSynchronousMethod = true)
  // работает только в TurboModules (новая архитектура)
  @ReactMethod(isBlockingSynchronousMethod = false)
  public void isCharging(Promise promise) {
    try {
      IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
      Intent batteryStatus = reactContext.registerReceiver(null, ifilter);

      int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
      boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING
                        || status == BatteryManager.BATTERY_STATUS_FULL;

      promise.resolve(isCharging);
    } catch (Exception e) {
      promise.reject("BATTERY_ERROR", e.getMessage());
    }
  }
}
```

#### Шаг 2: Регистрация в пакете

```java
// android/app/src/main/java/com/yourapp/battery/BatteryPackage.java
package com.yourapp.battery;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// Пакет связывает модуль с React Native
public class BatteryPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new BatteryModule(reactContext)); // регистрируем наш модуль
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList(); // только нативный модуль, не UI
  }
}
```

#### Шаг 3: Подключение в MainApplication

```java
// android/app/src/main/java/com/yourapp/MainApplication.java
import com.yourapp.battery.BatteryPackage; // импортируем наш пакет

// ...

@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new BatteryPackage()); // добавляем пакет
    return packages;
}
```

### Нативный модуль для iOS

#### Шаг 1: Заголовочный файл (Objective-C)

```objc
// ios/YourApp/battery/BatteryModule.h
#import <React/RCTBridgeModule.h>

// Объявляем класс с протоколом RCTBridgeModule
@interface BatteryModule : NSObject <RCTBridgeModule>
@end
```

#### Шаг 2: Реализация модуля

```objc
// ios/YourApp/battery/BatteryModule.m
#import "BatteryModule.h"
#import <UIKit/UIKit.h>

@implementation BatteryModule

// Экспортируем модуль с именем "Battery"
RCT_EXPORT_MODULE(Battery);

// Метод для получения уровня заряда
RCT_REMAP_METHOD(getBatteryLevel,
                 getBatteryLevelWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    // Включаем мониторинг батареи
    [[UIDevice currentDevice] setBatteryMonitoringEnabled:YES];

    float batteryLevel = [[UIDevice currentDevice] batteryLevel];

    if (batteryLevel < 0) {
      // batteryLevel = -1.0 если мониторинг не поддерживается
      reject(@"BATTERY_ERROR", @"Battery monitoring not available", nil);
      return;
    }

    float percentage = batteryLevel * 100;

    // Создаём словарь для передачи в JS
    NSDictionary *result = @{
      @"level": @(percentage),
      @"isLow": @(percentage < 20)
    };

    resolve(result);
  }
  @catch (NSException *exception) {
    reject(@"BATTERY_ERROR", exception.reason, nil);
  }
}

// Метод определения статуса зарядки
RCT_REMAP_METHOD(isCharging,
                 isChargingWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [[UIDevice currentDevice] setBatteryMonitoringEnabled:YES];
    UIDeviceBatteryState state = [[UIDevice currentDevice] batteryState];

    BOOL charging = (state == UIDeviceBatteryStateCharging
                  || state == UIDeviceBatteryStateFull);
    resolve(@(charging));
  }
  @catch (NSException *exception) {
    reject(@"BATTERY_ERROR", exception.reason, nil);
  }
}

@end
```

#### Реализация на Swift

Если вы предпочитаете Swift, потребуется Bridging Header:

```swift
// ios/YourApp/battery/BatteryModuleSwift.swift
import Foundation
import UIKit

@objc(BatteryModuleSwift)
class BatteryModuleSwift: NSObject {

  // requiresMainQueueSetup определяет, нужен ли Main Thread для инициализации
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func getBatteryLevel(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel

    guard level >= 0 else {
      reject("BATTERY_ERROR", "Battery monitoring not available", nil)
      return
    }

    let percentage = level * 100
    resolve([
      "level": percentage,
      "isLow": percentage < 20
    ])
  }
}
```

```objc
// ios/YourApp/battery/BatteryModuleSwift.m — Bridging wrapper
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BatteryModuleSwift, NSObject)

RCT_EXTERN_METHOD(
  getBatteryLevel:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
```

Обновите Podfile и выполните `pod install`:

```sh
cd ios && pod install && cd ..
```

### JavaScript-обёртка

После создания нативного кода напишем удобную TypeScript-обёртку:

```typescript
// src/modules/Battery.ts
import { NativeModules, Platform } from 'react-native';

// Типизируем интерфейс нативного модуля
interface BatteryResult {
  level: number;
  isLow: boolean;
}

// Получаем ссылку на нативный модуль
const { Battery } = NativeModules;

// Проверка доступности модуля
if (!Battery) {
  console.warn(
    'BatteryModule: нативный модуль не найден. ' +
    'Убедитесь, что выполнены pod install (iOS) и rebuild проект.'
  );
}

// Экспортируем типизированный API
export const BatteryModule = {
  /**
   * Получить уровень заряда батареи
   * @returns объект с level (0-100) и isLow (boolean)
   */
  getBatteryLevel: (): Promise<BatteryResult> => {
    if (!Battery) {
      return Promise.reject(new Error('BatteryModule not available'));
    }
    return Battery.getBatteryLevel();
  },

  /**
   * Проверить, заряжается ли устройство
   */
  isCharging: (): Promise<boolean> => {
    if (!Battery) {
      return Promise.reject(new Error('BatteryModule not available'));
    }
    return Battery.isCharging();
  },
};

export default BatteryModule;
```

Использование в компоненте:

```typescript
// src/components/BatteryStatus.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BatteryModule from '../modules/Battery';

interface BatteryState {
  level: number | null;
  isLow: boolean;
  isCharging: boolean | null;
  error: string | null;
}

export default function BatteryStatus() {
  const [battery, setBattery] = useState<BatteryState>({
    level: null,
    isLow: false,
    isCharging: null,
    error: null,
  });

  useEffect(() => {
    async function fetchBatteryInfo() {
      try {
        // Получаем данные параллельно
        const [levelInfo, charging] = await Promise.all([
          BatteryModule.getBatteryLevel(),
          BatteryModule.isCharging(),
        ]);

        setBattery({
          level: levelInfo.level,
          isLow: levelInfo.isLow,
          isCharging: charging,
          error: null,
        });
      } catch (err) {
        setBattery(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Неизвестная ошибка',
        }));
      }
    }

    fetchBatteryInfo();
  }, []);

  if (battery.error) {
    return <Text style={styles.error}>Ошибка: {battery.error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Статус батареи</Text>
      {battery.level !== null && (
        <Text style={battery.isLow ? styles.low : styles.normal}>
          Заряд: {battery.level.toFixed(0)}%{battery.isLow ? ' ⚠️ Низкий заряд' : ''}
        </Text>
      )}
      {battery.isCharging !== null && (
        <Text>{battery.isCharging ? '🔌 Зарядка' : '🔋 От батареи'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  normal: { color: '#4CAF50' },
  low: { color: '#F44336' },
  error: { color: '#F44336', padding: 16 },
});
```

## TurboModules: нативные модули в новой архитектуре

TurboModules — это следующий уровень нативных модулей, построенный на JSI. Они поддерживают строгую типизацию через Codegen и загружаются лениво.

### Спецификация через Codegen

При использовании TurboModules сначала создаётся TypeScript-спецификация:

```typescript
// src/NativeBattery.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Описание результата метода
interface BatteryInfo {
  level: number;
  isLow: boolean;
}

// Спецификация модуля
export interface Spec extends TurboModule {
  getBatteryLevel(): Promise<BatteryInfo>;
  isCharging(): Promise<boolean>;
}

// Регистрация TurboModule — загружается лениво
export default TurboModuleRegistry.getEnforcing<Spec>('Battery');
```

По этой спецификации Codegen генерирует типобезопасный C++ код, который связывает JS с нативными реализациями.

### Реализация TurboModule для Android (Kotlin)

```kotlin
// android/app/src/main/java/com/yourapp/battery/BatteryTurboModule.kt
package com.yourapp.battery

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager

// NativeBatterySpec генерируется Codegen из TypeScript-спецификации
class BatteryTurboModule(reactContext: ReactApplicationContext) :
    NativeBatterySpec(reactContext) {

  override fun getName() = NAME

  override fun getBatteryLevel(promise: Promise) {
    try {
      val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      val batteryStatus = reactApplicationContext.registerReceiver(null, ifilter)

      val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
      val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1

      val batteryPct = level * 100.0f / scale

      val result = Arguments.createMap().apply {
        putDouble("level", batteryPct.toDouble())
        putBoolean("isLow", batteryPct < 20)
      }

      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("BATTERY_ERROR", e.message)
    }
  }

  override fun isCharging(promise: Promise) {
    try {
      val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      val batteryStatus = reactApplicationContext.registerReceiver(null, ifilter)

      val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
      val charging = status == BatteryManager.BATTERY_STATUS_CHARGING
              || status == BatteryManager.BATTERY_STATUS_FULL

      promise.resolve(charging)
    } catch (e: Exception) {
      promise.reject("BATTERY_ERROR", e.message)
    }
  }

  companion object {
    const val NAME = "Battery"
  }
}
```

## Работа с событиями из нативного кода

Часто нативный код должен уведомлять JavaScript о событиях (изменение уровня заряда, входящее уведомление и т.д.). Для этого используются **Event Emitter'ы**.

### Android: отправка событий

```java
// В BatteryModule.java
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.os.Bundle;
import android.content.BroadcastReceiver;

// Регистрируем слушатель изменения батареи
@ReactMethod
public void startBatteryMonitoring() {
  IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);

  BroadcastReceiver receiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
      float pct = level * 100 / (float) scale;

      // Отправляем событие в JavaScript
      sendBatteryEvent(pct);
    }
  };

  reactContext.registerReceiver(receiver, filter);
}

// Метод отправки события
private void sendBatteryEvent(float level) {
  WritableMap params = Arguments.createMap();
  params.putDouble("level", level);
  params.putBoolean("isLow", level < 20);

  // Имя события должно совпадать с именем в JS
  reactContext
    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
    .emit("batteryLevelChanged", params);
}

// Обязательно переопределите для React 0.65+
@Override
public void addListener(String eventName) {
  // Вызывается при добавлении слушателя из JS
}

@Override
public void removeListeners(double count) {
  // Вызывается при удалении слушателей из JS
}
```

### iOS: отправка событий

```objc
// BatteryModule.m
#import <React/RCTEventEmitter.h>

// Наследуемся от RCTEventEmitter вместо NSObject
@interface BatteryModule : RCTEventEmitter <RCTBridgeModule>
@end

@implementation BatteryModule

RCT_EXPORT_MODULE(Battery);

// Перечисляем поддерживаемые события
- (NSArray<NSString *> *)supportedEvents {
  return @[@"batteryLevelChanged"];
}

// Начинаем мониторинг
RCT_EXPORT_METHOD(startBatteryMonitoring) {
  [[UIDevice currentDevice] setBatteryMonitoringEnabled:YES];

  [[NSNotificationCenter defaultCenter]
    addObserver:self
    selector:@selector(batteryLevelDidChange:)
    name:UIDeviceBatteryLevelDidChangeNotification
    object:nil];
}

// Обработчик изменения уровня
- (void)batteryLevelDidChange:(NSNotification *)notification {
  float level = [[UIDevice currentDevice] batteryLevel] * 100;

  // Отправляем событие в JS
  [self sendEventWithName:@"batteryLevelChanged"
                    body:@{
                      @"level": @(level),
                      @"isLow": @(level < 20)
                    }];
}

@end
```

### Прослушивание событий в JavaScript

```typescript
// src/hooks/useBatteryMonitor.ts
import { useEffect, useCallback } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { Battery } = NativeModules;

interface BatteryChangeEvent {
  level: number;
  isLow: boolean;
}

export function useBatteryMonitor(
  onBatteryChange: (event: BatteryChangeEvent) => void
) {
  const startMonitoring = useCallback(() => {
    // Создаём emitter для нашего модуля
    const emitter = new NativeEventEmitter(Battery);

    // Подписываемся на событие
    const subscription = emitter.addListener(
      'batteryLevelChanged',
      onBatteryChange
    );

    // Запускаем нативный мониторинг
    Battery.startBatteryMonitoring();

    // Отписываемся при размонтировании
    return () => {
      subscription.remove();
    };
  }, [onBatteryChange]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);
}
```

```typescript
// Использование в компоненте
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useBatteryMonitor } from '../hooks/useBatteryMonitor';

export default function BatteryMonitor() {
  const [level, setLevel] = useState<number | null>(null);
  const [isLow, setIsLow] = useState(false);

  useBatteryMonitor(({ level: newLevel, isLow: newIsLow }) => {
    setLevel(newLevel);
    setIsLow(newIsLow);
  });

  return (
    <View>
      {level !== null && (
        <Text style={{ color: isLow ? 'red' : 'green' }}>
          Батарея: {level.toFixed(0)}%
        </Text>
      )}
    </View>
  );
}
```

## Передача различных типов данных

Нативные модули поддерживают несколько типов данных. Вот сводная таблица соответствия:

| JavaScript | Android | iOS (Objective-C) |
|------------|---------|-------------------|
| `string` | `String` | `NSString` |
| `number` | `int`, `float`, `double` | `NSInteger`, `CGFloat` |
| `boolean` | `boolean` | `BOOL` |
| `object` | `ReadableMap` (вход) / `WritableMap` (выход) | `NSDictionary` |
| `array` | `ReadableArray` (вход) / `WritableArray` (выход) | `NSArray` |
| `null` | `null` | `nil` |
| `Promise` | `Promise` | `RCTPromiseResolveBlock` + `RCTPromiseRejectBlock` |

### Пример: принять объект из JS и вернуть объект

```java
// Android: принимаем объект из JS
@ReactMethod
public void processConfig(ReadableMap config, Promise promise) {
  String name = config.getString("name");       // читаем строку
  int timeout = config.getInt("timeout");       // читаем число
  boolean debug = config.getBoolean("debug");   // читаем boolean

  // Формируем ответ
  WritableMap result = Arguments.createMap();
  result.putString("processed", name.toUpperCase());
  result.putDouble("timestamp", System.currentTimeMillis());

  // Создаём массив
  WritableArray items = Arguments.createArray();
  items.pushString("item1");
  items.pushString("item2");
  result.putArray("items", items);

  promise.resolve(result);
}
```

```objc
// iOS: принимаем объект из JS
RCT_EXPORT_METHOD(processConfig:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *name = config[@"name"];
  NSInteger timeout = [config[@"timeout"] integerValue];
  BOOL debug = [config[@"debug"] boolValue];

  NSDictionary *result = @{
    @"processed": [name uppercaseString],
    @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000),
    @"items": @[@"item1", @"item2"]
  };

  resolve(result);
}
```

## Отладка нативных модулей

### Общие проблемы и решения

**Модуль не найден в JavaScript**

```typescript
// Проверяем доступность модуля
import { NativeModules } from 'react-native';
console.log('Доступные модули:', Object.keys(NativeModules));
```

Если модуль отсутствует:
1. Убедитесь, что `getName()` в Java или `RCT_EXPORT_MODULE` в Objective-C возвращает правильное имя
2. Проверьте регистрацию пакета в `MainApplication.java`
3. Пересоберите проект (полная пересборка, не hot reload)
4. Для iOS: выполните `cd ios && pod install` и пересоберите

**Ошибка "Module Battery tried to override..."**

Два модуля зарегистрированы с одинаковым именем. Переименуйте один из них.

**Android: очистка кэша сборки**

```bash
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

**iOS: сброс DerivedData**

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ios && pod deintegrate && pod install
```

### Логирование из нативного кода

```java
// Android: используйте Log
import android.util.Log;
Log.d("BatteryModule", "getBatteryLevel called");
Log.e("BatteryModule", "Error: " + e.getMessage());
```

```objc
// iOS: используйте NSLog или RCTLog
#import <React/RCTLog.h>
RCTLogInfo(@"[BatteryModule] getBatteryLevel called");
RCTLogError(@"[BatteryModule] Error: %@", error);
```

Логи Android видны в `Android Studio → Logcat`, логи iOS — в `Xcode → Console`.

## Тестирование нативных модулей

### Мокинг в Jest

```typescript
// __mocks__/react-native.ts или jest.setup.ts
import { NativeModules } from 'react-native';

// Мокаем нативный модуль для тестов
NativeModules.Battery = {
  getBatteryLevel: jest.fn().mockResolvedValue({ level: 80, isLow: false }),
  isCharging: jest.fn().mockResolvedValue(true),
  startBatteryMonitoring: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};
```

```typescript
// __tests__/BatteryStatus.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BatteryStatus from '../src/components/BatteryStatus';
import { NativeModules } from 'react-native';

describe('BatteryStatus', () => {
  it('отображает уровень заряда', async () => {
    // Настраиваем мок
    (NativeModules.Battery.getBatteryLevel as jest.Mock).mockResolvedValue({
      level: 75,
      isLow: false,
    });
    (NativeModules.Battery.isCharging as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(<BatteryStatus />);

    // Ждём обновления состояния
    await waitFor(() => {
      expect(getByText(/75%/)).toBeTruthy();
    });
  });

  it('показывает предупреждение при низком заряде', async () => {
    (NativeModules.Battery.getBatteryLevel as jest.Mock).mockResolvedValue({
      level: 10,
      isLow: true,
    });
    (NativeModules.Battery.isCharging as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(<BatteryStatus />);

    await waitFor(() => {
      expect(getByText(/Низкий заряд/)).toBeTruthy();
    });
  });
});
```

### Нативные тесты

**Android (JUnit):**

```java
// androidTest/java/com/yourapp/BatteryModuleTest.java
@RunWith(AndroidJUnit4.class)
public class BatteryModuleTest {

  @Test
  public void testGetBatteryLevel() {
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    BatteryModule module = new BatteryModule(context);

    // Проверяем имя модуля
    assertEquals("Battery", module.getName());
  }
}
```

## Best Practices

### Архитектурные рекомендации

1. **Одна ответственность** — каждый нативный модуль должен решать одну задачу
2. **Абстракция в JS** — всегда создавайте TypeScript-обёртку над `NativeModules`, не используйте их напрямую в компонентах
3. **Проверка доступности** — всегда проверяйте, что модуль существует, прежде чем вызывать методы
4. **Обработка ошибок** — нативный код должен всегда вызывать либо `resolve`, либо `reject`

### Производительность

5. **Асинхронность** — выполняйте тяжёлые операции в фоновом потоке, не в UI thread
6. **Батчинг данных** — вместо множества мелких вызовов передавайте данные одним объектом
7. **Кэширование** — кэшируйте результаты дорогостоящих нативных операций на JS-стороне

```typescript
// Пример кэширования результатов
class BatteryCache {
  private cache: { level: number; isLow: boolean } | null = null;
  private lastFetch = 0;
  private readonly TTL = 5000; // 5 секунд

  async getBatteryLevel() {
    const now = Date.now();
    if (this.cache && now - this.lastFetch < this.TTL) {
      return this.cache; // возвращаем кэш
    }

    this.cache = await BatteryModule.getBatteryLevel();
    this.lastFetch = now;
    return this.cache;
  }
}
```

### Совместимость

8. **Версионирование** — следите за совместимостью модуля с версиями React Native
9. **Платформенные проверки** — используйте `Platform.OS` для платформо-специфичного кода
10. **Graceful degradation** — предоставляйте запасное поведение, если нативный модуль недоступен

```typescript
import { Platform } from 'react-native';
import BatteryModule from '../modules/Battery';

// Запасная реализация для платформ без поддержки
async function getBatteryInfo() {
  if (Platform.OS === 'web') {
    // Web не поддерживает нативные модули
    return { level: 100, isLow: false };
  }

  return BatteryModule.getBatteryLevel();
}
```

Нативные модули открывают перед React Native разработчиком возможности, недостижимые средствами одного лишь JavaScript. При правильной организации они не только расширяют функциональность приложения, но и улучшают его производительность. Если вы хотите глубже освоить архитектуру React Native, работу с нативным кодом и создание профессиональных мобильных приложений — приходите на наш курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=nativnye-moduli-react-native). Курс включает 184 урока и 11 упражнений, AI-тренажёры для практики 24/7, живое ревью наставника и еженедельные встречи с менторами.

## Заключение

Нативные модули — это мощный инструмент React Native разработчика. В этой статье мы разобрали:

- **Архитектуру**: от классического Bridge до современного JSI и TurboModules
- **Готовые пакеты**: как устанавливать и использовать нативные библиотеки с автолинкингом
- **Создание своих модулей**: полный цикл для Android (Java/Kotlin) и iOS (Objective-C/Swift)
- **Event Emitter'ы**: как нативный код уведомляет JavaScript о событиях
- **Типизацию данных**: соответствие типов между JS и нативными платформами
- **Отладку и тестирование**: практические приёмы для надёжной разработки

Понимание нативных модулей открывает возможность реализовывать любую функциональность в React Native приложении — от работы с биометрией до интеграции нативных SDK.

## Часто задаваемые вопросы

### Чем TurboModules отличаются от обычных нативных модулей?

TurboModules используют JSI для прямого обращения к нативному коду без JSON-сериализации через Bridge. Они загружаются лениво (только при первом обращении), имеют строгую типизацию через Codegen и поддерживают синхронные вызовы. Производительность TurboModules значительно выше.

### Можно ли использовать нативные модули в Expo?

В Expo Go нативные модули, требующие кастомного нативного кода, не поддерживаются. Однако с Expo Dev Client или при создании managed workflow с `expo prebuild` вы получаете полный доступ к нативным модулям.

### Как передать Callback из нативного кода в JS?

Используйте `Callback` (однократный вызов) или Event Emitter (многократные события). Callbacks в React Native документации отмечены как устаревшие в пользу Promises и Event Emitters.

### Почему нативный модуль работает на одной платформе и не работает на другой?

Нативные реализации Android и iOS независимы. Убедитесь, что имена методов совпадают, и реализация есть для обеих платформ. Используйте `Platform.select` или `Platform.OS` для платформо-специфичного поведения в JS.

### Как мигрировать с Bridge-модуля на TurboModule?

Создайте TypeScript-спецификацию (`NativeXxx.ts`), настройте Codegen в `package.json`, реализуйте TurboModule на нативной стороне (наследуясь от сгенерированного Spec-класса) и обновите регистрацию. Подробная инструкция доступна в официальной документации React Native Migration Guide.

---
