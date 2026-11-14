---
metaTitle: "React Native Maps — карты в мобильных приложениях"
metaDescription: "Как подключить и использовать react-native-maps: маркеры, геолокация, полилинии, кастомизация карты. Практические примеры для iOS и Android."
author: "Антон Ларичев"
title: "React Native Maps: работа с картами в мобильных приложениях"
preview: "Полное руководство по react-native-maps: установка, отображение карты, маркеры, геолокация пользователя и кастомизация стилей."
---

## Что такое react-native-maps

Библиотека `react-native-maps` — стандартный инструмент для отображения интерактивных карт в React Native приложениях. Под капотом она использует нативные SDK: Google Maps на Android и Apple Maps (MapKit) или Google Maps на iOS.

Основные возможности:

- Отображение карты с управлением регионом и зумом
- Добавление маркеров с кастомными иконками и всплывающими подсказками
- Рисование полилиний, полигонов и окружностей
- Отображение текущего местоположения пользователя
- Кастомизация стиля карты
- Обработка пользовательских жестов (тап, лонг-тап, перетаскивание)

## Установка и настройка

Устанавливаем библиотеку:

```bash
npm install react-native-maps
```

Для проектов на bare React Native дополнительно линкуем нативные зависимости:

```bash
npx pod-install
```

### Настройка Android

В файле `android/app/src/main/AndroidManifest.xml` добавляем API-ключ Google Maps:

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="ВАШ_GOOGLE_MAPS_API_KEY"/>
</application>
```

В `android/build.gradle` проверяем наличие зависимости:

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

### Настройка iOS

Для Google Maps на iOS нужно добавить инициализацию в `AppDelegate.mm`:

```objectivec
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"ВАШ_GOOGLE_MAPS_API_KEY"];
  // остальной код...
}
```

Если используем Apple Maps (по умолчанию), дополнительных ключей не нужно.

## Базовое отображение карты

Компонент `MapView` — основной строительный блок. Ему необходимо задать явные размеры, иначе карта не отобразится:

```jsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export function BasicMap() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
```

Проп `initialRegion` задаёт начальную область карты:

- `latitude` и `longitude` — координаты центра
- `latitudeDelta` и `longitudeDelta` — уровень зума (меньше значение — сильнее приближено)

### Программное управление регионом

Чтобы управлять картой из кода, используем `ref`:

```jsx
import React, { useRef } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

export function ControlledMap() {
  const mapRef = useRef(null);

  const goToMoscow = () => {
    mapRef.current?.animateToRegion({
      latitude: 55.7558,
      longitude: 37.6173,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      />
      <Button title="Москва" onPress={goToMoscow} />
    </View>
  );
}
```

## Маркеры на карте

Компонент `Marker` добавляется как дочерний элемент `MapView`:

```jsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const LOCATIONS = [
  {
    id: '1',
    title: 'Красная площадь',
    description: 'Главная площадь Москвы',
    coordinate: { latitude: 55.7539, longitude: 37.6208 },
  },
  {
    id: '2',
    title: 'Парк Горького',
    description: 'Центральный парк культуры',
    coordinate: { latitude: 55.7298, longitude: 37.6016 },
  },
];

export function MapWithMarkers() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {LOCATIONS.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.title}
            description={location.description}
          />
        ))}
      </MapView>
    </View>
  );
}
```

### Кастомные маркеры

Стандартный маркер можно заменить любым React-компонентом через проп `children` или через специальный компонент `Callout`:

```jsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

export function CustomMarkerMap() {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 55.7558,
        longitude: 37.6173,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={{ latitude: 55.7558, longitude: 37.6173 }}>
        <View style={styles.markerContainer}>
          <Text style={styles.markerText}>!</Text>
        </View>

        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Офис</Text>
            <Text>ул. Тверская, 1</Text>
          </View>
        </Callout>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  callout: { width: 150, padding: 8 },
  calloutTitle: { fontWeight: 'bold', marginBottom: 4 },
});
```

## Геолокация пользователя

Для отображения текущего местоположения устанавливаем дополнительный пакет:

```bash
npm install @react-native-community/geolocation
```

Для iOS добавляем в `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Приложению нужен доступ к геолокации для отображения вашего местоположения</string>
```

Для Android в `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Компонент с отслеживанием местоположения:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export function UserLocationMap() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Вы здесь"
            pinColor="#00B894"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
```

Проп `showsUserLocation` включает встроенную синюю точку геолокации. Если нужен собственный маркер — рисуем его вручную, как в примере выше.

## Полилинии и полигоны

### Маршрут между точками

`Polyline` рисует линию через массив координат:

```jsx
import MapView, { Marker, Polyline } from 'react-native-maps';

const ROUTE_COORDINATES = [
  { latitude: 55.7558, longitude: 37.6173 },
  { latitude: 55.7620, longitude: 37.6300 },
  { latitude: 55.7700, longitude: 37.6450 },
  { latitude: 55.7800, longitude: 37.6500 },
];

export function RouteMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 55.7679,
        longitude: 37.6336,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
    >
      <Polyline
        coordinates={ROUTE_COORDINATES}
        strokeColor="#6C5CE7"
        strokeWidth={4}
        lineDashPattern={[10, 5]}
      />
      <Marker coordinate={ROUTE_COORDINATES[0]} title="Старт" pinColor="green" />
      <Marker
        coordinate={ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1]}
        title="Финиш"
        pinColor="red"
      />
    </MapView>
  );
}
```

### Выделение области

`Polygon` замыкает контур и заливает его цветом:

```jsx
import MapView, { Polygon } from 'react-native-maps';

const AREA_COORDINATES = [
  { latitude: 55.74, longitude: 37.59 },
  { latitude: 55.74, longitude: 37.65 },
  { latitude: 55.78, longitude: 37.65 },
  { latitude: 55.78, longitude: 37.59 },
];

export function AreaMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 55.76,
        longitude: 37.62,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
    >
      <Polygon
        coordinates={AREA_COORDINATES}
        fillColor="rgba(108, 92, 231, 0.2)"
        strokeColor="#6C5CE7"
        strokeWidth={2}
      />
    </MapView>
  );
}
```

## Выбор точки на карте

Практический пример — компонент выбора адреса тапом по карте:

```jsx
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export function LocationPicker({ onConfirm }) {
  const [selectedCoord, setSelectedCoord] = useState(null);

  const handleMapPress = (event) => {
    setSelectedCoord(event.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (selectedCoord) {
      onConfirm(selectedCoord);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {selectedCoord && (
          <Marker
            coordinate={selectedCoord}
            title="Выбранная точка"
          />
        )}
      </MapView>

      <View style={styles.footer}>
        {selectedCoord ? (
          <>
            <Text style={styles.coords}>
              {selectedCoord.latitude.toFixed(5)}, {selectedCoord.longitude.toFixed(5)}
            </Text>
            <Button title="Подтвердить" onPress={handleConfirm} />
          </>
        ) : (
          <Text style={styles.hint}>Нажмите на карту, чтобы выбрать точку</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  coords: { fontSize: 14, color: '#636e72' },
  hint: { fontSize: 14, color: '#636e72', textAlign: 'center' },
});
```

## Кастомизация стиля карты

Google Maps поддерживает JSON-стили для полного изменения внешнего вида. Стиль задаётся через проп `customMapStyle`:

```jsx
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

const DARK_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

export function DarkMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      customMapStyle={DARK_MAP_STYLE}
      initialRegion={{
        latitude: 55.7558,
        longitude: 37.6173,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    />
  );
}
```

Готовые наборы стилей можно найти и сгенерировать в Google Maps Styling Wizard или на snazzymaps.com.

## Часто используемые пропсы MapView

| Проп | Тип | Описание |
|---|---|---|
| `initialRegion` | Region | Начальный регион, не реактивный |
| `region` | Region | Контролируемый регион (управляется из state) |
| `provider` | string | `PROVIDER_GOOGLE` или `PROVIDER_DEFAULT` |
| `showsUserLocation` | boolean | Показывает синюю точку геолокации |
| `showsMyLocationButton` | boolean | Кнопка центрирования на Android |
| `showsTraffic` | boolean | Пробки |
| `mapType` | string | `standard`, `satellite`, `hybrid`, `terrain` |
| `onPress` | function | Тап по карте |
| `onLongPress` | function | Долгое нажатие |
| `onRegionChangeComplete` | function | Завершение жеста перемещения |
| `customMapStyle` | array | JSON-стиль (только Google Maps) |

## Типичные ошибки

**Карта не отображается** — чаще всего причина в том, что у `MapView` не задан размер. Добавьте `flex: 1` или явные `width`/`height`.

**Маркеры мигают при обновлении состояния** — не пересоздавайте массив координат на каждый рендер. Вынесите данные за пределы компонента или мемоизируйте через `useMemo`.

**Ошибка `DEVELOPER_ERROR` на Android** — неверный SHA-1 отпечаток в Google Cloud Console. Добавьте оба: отпечаток debug keystore и release keystore.

**Карта зависает при большом количестве маркеров** — используйте кластеризацию через библиотеку `react-native-map-clustering` или рендерите только маркеры в видимом регионе через `onRegionChangeComplete`.

---

Чтобы углубить знания React Native и научиться создавать полноценные мобильные приложения с картами, геолокацией и нативными интеграциями, переходите на курс: https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-native-maps