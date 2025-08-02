---
metaTitle: Интеграция видео плеера в приложение на React Native
metaDescription: Подробное руководство по интеграции современного видео плеера в приложение на React Native - лучшие библиотеки, настройка, пользовательские функции, примеры кода
author: Олег Марков
title: Интеграция видео плеера в приложение на React Native
preview: Пошаговая инструкция по добавлению видео плеера в React Native приложение - настройка, управление, советы и обработка ошибок
---

## Введение

Видеоконтент играет ключевую роль в мобильных приложениях: он делает обучение более наглядным, добавляет интерактивности и помогает держать пользователей на платформе дольше. В React Native вы можете без особых сложностей добавить современный видео-плеер — для этого достаточно использовать готовые библиотеки, которые отлично дружат с кроссплатформенной архитектурой фреймворка.

В этой статье я расскажу, как интегрировать видео-плеер в приложение на React Native, покажу, как подключить одну из самых популярных библиотек, продемонстрирую примеры кода, объясню, как настраивать и расширять функциональность плеера, а также подскажу, как обрабатывать частые ошибки. Всё будет разложено по полочкам для вашего удобства.

---

## Выбор библиотеки видео-плеера для React Native

Для реализации функционального и кроссплатформенного видео-плеера чаще всего используют библиотеку `react-native-video`. Она удобна, поддерживает как Android, так и iOS, позволяет воспроизводить локальные и потоковые видеофайлы, предоставляет гибкие настройки и хорошо документирована.

### Почему именно react-native-video?

- Поддерживает HLS, DASH, mp4, mkv и другие популярные форматы
- Позволяет проигрывать видео из интернета и из локального хранилища приложения
- Дает возможность легко управлять воспроизведением (паузой, перемоткой, изменением громкости и скоростью)
- Позволяет кастомизировать интерфейс плеера

Есть и альтернативы: например, `expo-av` (если используете Expo), но именно `react-native-video` считается более гибкой и функциональной при необходимости детальной настройки.

---

## Установка и настройка библиотеки

### Установка react-native-video

Сначала давайте установим зависимость в ваш проект. Если вы используете npm, выполните:

```bash
npm install react-native-video
```

Используете yarn? Тогда так:

```bash
yarn add react-native-video
```

### Линковка модулей (если не используете автолинковку)

В последних версиях React Native ошибка с запуском из-за не залинкованных модулей маловероятна, но если ваш проект старый (до 0.60), то после установки выполните линковку:

```bash
react-native link react-native-video
```

### iOS: обновление Podfile

Если вы разрабатываете под iOS, не забудьте сделать следующее в папке ios:

```bash
cd ios
pod install
cd ..
```

---

## Базовый пример интеграции видео-плеера

Покажу вам простой способ вставки видео-плеера в экран вашего приложения.

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

const BasicVideoPlayer = () => {
  // Урл видео - можно заменить на ваш собственный
  const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}    // Ссылка на видео-файл
        style={styles.video}
        controls={true}                // Показывать стандартные элементы управления
        resizeMode="contain"           // Как масштабировать видео
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',         // Можно указать свой фон
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,              // Пропорция видео
  },
});

export default BasicVideoPlayer;
```

**Что происходит в этом примере:**

- Мы импортируем сам видеокомпонент.
- Передаем в проп `source` объект с uri — исходное видео берётся из указанного URL.
- Через проп `controls={true}` включается отображение стандартных элементов управления: play/stop/seek/volume.
- С помощью свойства `resizeMode` можно управлять тем, как видео заполняет свой блок.
- Задаём стили через StyleSheet — для удобства и правильной пропорции.

---

## Расширенные функции и методы video-плеера

Простой пример — это здорово, но часто требуется больше контроля над видео. Например, обработка событий (когда видео проигралось до конца, когда появилась ошибка, когда изменилась позиция и т.д.), добавление своих кнопок, динамическое управление проигрыванием.

### Кастомизация и события

Покажу пример, где мы реагируем на события проигрывания и отображаем, сколько секунд уже прошло с начала.

```jsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import Video from 'react-native-video';

const CustomVideoPlayer = () => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(false);

  // Функция вызывается, когда проигрывание идет - обновляем позицию в state
  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  // Функция вызывается, когда видео закончило проигрываться
  const handleEnd = () => {
    setPaused(true); // Ставим на паузу по окончанию
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={styles.video}
        controls={true}
        paused={paused}
        onProgress={handleProgress} // Следим за текущим временем
        onEnd={handleEnd}           // Срабатывает в конце воспроизведения
        resizeMode="contain"
      />
      <Text style={styles.timeText}>
        Текущее время: {currentTime.toFixed(1)} сек.
      </Text>
      <Button
        title={paused ? "Воспроизвести" : "Пауза"}
        onPress={() => setPaused(!paused)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  video: { width: 320, height: 180, backgroundColor: '#000' },
  timeText: { color: '#fff', marginTop: 12 }
});

export default CustomVideoPlayer;
```

**Здесь вы видите:**
- Использование событий `onProgress`, чтобы получать время воспроизведения.
- Использование `onEnd`, чтобы понять, когда видео закончилось.
- Управление состоянием paused через кнопку.

---

### Управление через ref

Иногда нужно программно останавливать, запускать или перематывать видео. Библиотека предоставляет ref и методы типа `seek(time)` — давайте посмотрим, как этим пользоваться.

```jsx
// Внутри компонента:
const videoRef = useRef(null);

// ...в рендере:
<Video
  ref={videoRef}
/>

// Где-нибудь в функции обработчике:
const seekToMiddle = () => {
  // Перемотка примерно на середину видео (например, 30 секунда)
  videoRef.current.seek(30); // Секунды
};
```

Это полезно, например, для создания "Перейти к началу"/"Пропустить интро" и прочих кастомных функций.

---

### Пользовательский интерфейс управления

Стандартные controls — простое решение. Если вам нужен уникальный интерфейс (например, крупная кнопка "Play" или собственные таймлайны) — controls можно отключить и создать собственные элементы UI.

Смотрите, как это реализовано:

```jsx
<Video
  controls={false}
  // ...остальные пропсы
/>
<Button title="Play" onPress={() => setPaused(false)} />
<Button title="Pause" onPress={() => setPaused(true)} />
```

Для управления звуком, скоростью воспроизведения и другими параметрами вы просто добавляете нужные кнопки и изменяете значения пропсов плеера (например, передаете `rate`).

---

## Работа с источниками видео: локальные и онлайн-файлы

### Онлайновое видео (HTTP/HTTPS)

- Передаёте ссылку на файл или поток:
  ```jsx
  source={{ uri: 'https://example.com/video.mp4' }}
  ```
- Можно прямо использовать HLS (.m3u8), DASH-потоки, YouTube не поддерживается напрямую.

### Локальные видеофайлы (assets и файловая система)

- Для ресурсов, встроенных в приложение:
  ```jsx
  source={require('./assets/video.mp4')}
  ```
- Для динамически скачанных файлов (находящихся в FileSystem на устройстве), указывайте путь:
  ```jsx
  source={{ uri: 'file:///path/to/video.mp4' }}
  ```

---

## Особенности работы на Android и iOS

### iOS

- Если используете локальные файлы, обязательно добавьте их в настройки Xcode (Copy Bundle Resources).
- Для потокового видео (HLS, mp4) нет дополнительных настроек.

#### Не забудьте добавить разрешения

В Info.plist для загрузки по http может понадобиться:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android

- Проверьте, что у вас есть разрешение на доступ к интернету (`android.permission.INTERNET`).
- Для локальных файлов путь должен начинаться с `file:///`.

---

## Важные параметры компонента Video

| Свойство            | Описание                                                                      |
|---------------------|-------------------------------------------------------------------------------|
| source              | Объект с источником видео (uri или require)                                   |
| paused              | true/false. Останавливает или воспроизводит видео                             |
| controls            | Показывать стандартные элементы управления                                   |
| onBuffer            | Колбек при буферизации                                                        |
| onLoad              | Когда видео полностью загрузилось                                             |
| onProgress          | Отслеживание времени воспроизведения                                          |
| onEnd               | Сигнал о завершении проигрывания                                              |
| resizeMode          | Масштабирование: 'contain', 'cover', 'stretch'                               |
| fullscreen          | Управление режимом полного экрана                                             |
| repeat              | Зацикливать видео                                                             |
| muted               | Выключить звук                                                                |
| volume              | Громкость (от 0 до 1)                                                        |
| rate                | Скорость воспроизведения                                                      |

---

## Пример расширенного применения (слайдер перемотки)

Чтобы дать пользователю больше контроля, можно добавить слайдер для перемотки.

```jsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';

const SliderVideoPlayer = () => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={styles.video}
        paused={paused}
        resizeMode="contain"
        onProgress={data => setCurrentTime(data.currentTime)}
        onLoad={data => setDuration(data.duration)}
      />
      <Slider
        style={{ width: 240, height: 40 }}
        minimumValue={0}
        maximumValue={duration}
        value={currentTime}
        onValueChange={value => videoRef.current.seek(value)}
      />
      <Text style={styles.time}>{Math.floor(currentTime)} / {Math.floor(duration)} сек.</Text>
      <Text style={styles.button} onPress={() => setPaused(!paused)}>
        {paused ? '▶️ Play' : '⏸ Pause'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e' },
  video: { width: 320, height: 180, backgroundColor: '#000' },
  time: { color: 'white', marginTop: 8 },
  button: { color: '#49b', padding: 10, marginTop: 10, fontSize: 18 }
});

export default SliderVideoPlayer;
```

**Здесь используются:**
- Слайдер для перемотки по текущему времени видео
- Получение полной длительности и текущего положения
- Кнопка Play/Pause — весь UI простой и понятный

---

## Обработка ошибок и советы по стабильной работе

- Используйте событие `onError` чтобы поймать неудачные попытки проигрывания (например, когда файл не загружен):

```jsx
<Video
  onError={e => {
    console.warn("Ошибка видео:", e);
    // Можно показать пользователю сообщение
  }}
/>
```
- Проверьте, доступно ли у пользователя подключение к интернету, если источник видео — онлайн.
- Для тяжелых видео рекомендуется настраивать буферизацию через параметры или показывать индикаторы загрузки.
- При необходимости оптимизации трафика — отдавайте оптимизированные для мобил устройств видео-форматы (например, h264 с низким битрейтом).

---

## Интеграция в сложные проекты

- Для сложных интерфейсов интеграцию плеера лучше оборачивать в собственный компонент.
- Старайтесь держать состояние управления видео (paused, position) в родительском компоненте или в контексте.
- Используйте кастомные иконки и анимации, когда это требуется дизайном.

---

## Поддержка фонового воспроизведения и PiP (картинка в картинке)

`react-native-video` частично поддерживает фоновое воспроизведение и режим "картинка в картинке". Для iOS достаточно правильно настроить проект (Background Modes>Audio), для Android могут потребоваться дополнительные настройки AndroidManifest и службы.

- Для поддержки фонового воспроизведения обратите внимание на документацию по Background Modes для каждой платформы.
- PiP на Android поддерживается только с API 26 и выше.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как добавить подзаголовки (субтитры) к видео?

Добавьте проп `textTracks` к компоненту Video:

```jsx
<Video
  textTracks={[
    {
      title: "English CC",
      language: "en",
      type: TextTrackType.VTT,
      uri: "https://www.example.com/subs_en.vtt"
    }
  ]}
  selectedTextTrack={{type: "index", value: 0}}
/>
```
Не забудьте импортировать `TextTrackType` из библиотеки.

---

### Почему не работает локальное видео на Android?

Проверьте, что вы используете путь с префиксом `file:///` и у файла есть права на чтение. Проверьте разрешения на чтение файлов в AndroidManifest.

---

### Как сделать видео в full screen при нажатии на кнопку?

Контролируйте prop `fullscreen`:

```jsx
<Video
  fullscreen={isFullScreen}
  // остальные пропсы
/>
```
Некоторые версии требуют ручной обработки через сторонние библиотеки или создание навигационного экрана без статуса/титулбара с Video на весь экран.

---

### Можно ли стримить видео из YouTube?

На данный момент react-native-video не поддерживает прямое воспроизведение видео с YouTube из-за ограничений API и форматов. Используйте либо WebView, либо отдельные библиотеки для поддержки YouTube, такие как `react-native-youtube-iframe`.

---

### Как управлять буферизацией видео?

Используйте события `onBuffer` и пропы, связанные с буферизацией (например, `bufferConfig`). Показывайте лоадер, когда идет буферизация:

```jsx
<Video
  onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
/>
```
И рендерьте индикатор загрузки, пока буферизация не закончится.