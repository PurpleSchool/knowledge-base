---
metaTitle: Как реализовать аудиоплеер на React Native
metaDescription: Узнайте шаг за шагом как создать аудиоплеер на React Native - подробная инструкция по базовой настройке, плеерным функциям и интеграции
author: Олег Марков
title: Как реализовать аудиоплеер на React Native
preview: Подробное руководство по созданию аудиоплеера на React Native для мобильных приложений с практическими примерами кода и полезными советами
---

## Введение

Аудиоплеер — популярный элемент во многих мобильных приложениях. Он используется для подкастов, потоковой музыки, аудиокниг и так далее. Реализация аудиоплеера может показаться сложной задачей, особенно если вы только начинаете знакомство с React Native. На самом деле это возможно даже без глубоких знаний в области нативной разработки, если правильно подобрать инструменты и разобраться в базовой логике.

В этой статье я покажу вам, как добавить аудиоплеер в проект на React Native. Мы рассмотрим популярные библиотеки, их базовые функции, написание компонентов UI для плеера и работу с основными действиями: проигрывание, пауза, перемотка и контроль громкости. Всё с пошаговыми объяснениями и примерами, чтобы вам было проще повторить это в своих приложениях.

## Выбор библиотеки для работы с аудио в React Native

Сначала давайте обсудим, что есть на рынке для удобной работы с аудио. Для мобильной платформы важно, чтобы библиотека была кроссплатформенной, имела хороший API и поддержку основных возможностей: потоковое воспроизведение, локальные файлы, управление состоянием плеера, фоновый режим.

Самые распространенные библиотеки:
- [react-native-track-player](https://github.com/DoubleSymmetry/react-native-track-player)
- [react-native-sound](https://github.com/zmxv/react-native-sound)
- [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) (для приложений на Expo)

В этой статье основной акцент будет на `react-native-track-player` — это полноценное решение с поддержкой фона, очередей, уведомлений и даже платформенных элементов управления. Если вы используете Expo, подойдёт `expo-av`, но возможности его ограниченнее, особенно для сложных кейсов.

Реализация аудио-плеера в React Native требует понимания форматов аудио, работы с нативными API и управления воспроизведением. Необходимо уметь обрабатывать события, стилизовать плеер и обеспечивать совместимость с различными устройствами. Важно так же учитывать работу с remote control. Если вы хотите детальнее погрузиться в создание аудио-плеера и другие мультимедийные возможности в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-realizovat-audio-pleer-na-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка и настройка react-native-track-player

### Добавление библиотеки в проект

Сначала вам потребуется добавить библиотеку в ваш проект:

```sh
npm install react-native-track-player
# или
yarn add react-native-track-player
```

Затем выполните установку нативных зависимостей:

```sh
npx pod-install
```

### Проект Expo

Если вы работаете с Expo (bare workflow), установка аналогична. В managed workflow работать не получится, используйте в этом случае `expo-av` (про него ниже).

### Базовая инициализация

Создайте отдельный файл, например, `playerService.js`, где будет находиться конфигурация плеера:

```js
import TrackPlayer from 'react-native-track-player';

export const setupPlayer = async () => {
  await TrackPlayer.setupPlayer(); // Инициализация плеера
  await TrackPlayer.updateOptions({
    stopWithApp: true, // Останавливать плеер при завершении работы приложения
    capabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
      TrackPlayer.CAPABILITY_STOP
    ], // Доступные действия для плеера
  });
};
```

Вы вызываете `setupPlayer` один раз при старте приложения, до начала проигрывания.

## Добавление треков и базовая работа с плеером

### Добавление аудиофайлов

Трек добавляется с помощью метода `TrackPlayer.add()`:

```js
await TrackPlayer.add({
  id: 'trackId', // Уникальный идентификатор трека
  url: require('./assets/audio.mp3'), // Можно использовать локальный файл или ссылку
  title: 'Название песни',
  artist: 'Исполнитель',
  artwork: require('./assets/art.jpg'), // Обложка
});
```

Для потокового аудио используйте ссылку (`url: 'https://...'`). Локальные файлы подключайте через `require`.

### Проигрывание, пауза и остановка

Смотрите, насколько просто управлять воспроизведением:

```js
// Запуск воспроизведения
await TrackPlayer.play();

// Пауза
await TrackPlayer.pause();

// Остановить воспроизведение и сбросить плеер
await TrackPlayer.stop();
```

Команды асинхронные — не забывайте про `await` или обработку промисов.

## Реализация UI аудиоплеера

Теперь давайте создадим базовый компонент плеера.

### Перемотка и перемещение по треку

Используем хук для отслеживания позиции воспроизведения:

```js
import { useProgress } from 'react-native-track-player';

function AudioProgress() {
  const progress = useProgress(); // Получаем { position, duration }

  return (
    <View>
      <Text>{Math.floor(progress.position)} / {Math.floor(progress.duration)} сек</Text>
      <Slider
        minimumValue={0}
        maximumValue={progress.duration}
        value={progress.position}
        onSlidingComplete={async (val) => {
          await TrackPlayer.seekTo(val); // Перемотка на значение
        }}
      />
    </View>
  );
}
```

#### Объяснение кода
- `useProgress` возвращает текущее положение и длительность трека.
- Слайдер позволяет перематывать воспроизведение.
- После отпускания ползунка вызывается `seekTo` для перемотки.

### Кнопки управления

Создадим компоненты для управления:

```js
import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import TrackPlayer, { State, usePlaybackState } from 'react-native-track-player';

function PlayerControls() {
  const playbackState = usePlaybackState(); // Текущее состояние (playing, paused...)

  const isPlaying = playbackState === State.Playing;

  const onPlayPause = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <Button title="Назад" onPress={() => TrackPlayer.skipToPrevious()} />
      <Button title={isPlaying ? "Пауза" : "Старт"} onPress={onPlayPause} />
      <Button title="Вперёд" onPress={() => TrackPlayer.skipToNext()} />
    </View>
  );
}
```

Теперь объедините `AudioProgress` и `PlayerControls` в общий компонент плеера.

## Отображение информации о треке

Часто хочется видеть название, исполнителя и обложку.

```js
import { useTrackPlayerEvents, TrackPlayerEvents, useTrackPlayerCurrentTrack } from 'react-native-track-player';

function TrackInfo() {
  const trackId = useTrackPlayerCurrentTrack();
  const [track, setTrack] = useState(null);

  useEffect(() => {
    async function fetchTrack() {
      if (trackId) {
        const trackObject = await TrackPlayer.getTrack(trackId);
        setTrack(trackObject);
      }
    }
    fetchTrack();
  }, [trackId]);

  if (!track) return null;

  return (
    <View>
      <Image source={track.artwork} style={{ width: 120, height: 120 }} />
      <Text>{track.title}</Text>
      <Text>{track.artist}</Text>
    </View>
  );
}
```
- Здесь получаем текущий трек и отображаем связанные данные.

## Фоновое воспроизведение

React Native Track Player поддерживает фон.

1. Добавьте файл `service.js` с содержимым:

```js
import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
  // Добавьте нужные события (например, skipToNext/skipToPrevious)
};
```

2. Зарегистрируйте сервис в `index.js`:

```js
import TrackPlayer from 'react-native-track-player';
import playerService from './service';

TrackPlayer.registerPlaybackService(() => playerService);
```

Это позволяет реагировать на медиакнопки и уведомления системы даже когда приложение закрыто.

## Пример полного аудиоплеера

Соберём всё вместе:

```js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { setupPlayer } from './playerService';
import TrackPlayer from 'react-native-track-player';
import TrackInfo from './TrackInfo';
import AudioProgress from './AudioProgress';
import PlayerControls from './PlayerControls';

export default function AudioPlayerScreen() {
  useEffect(() => {
    async function init() {
      await setupPlayer();
      await TrackPlayer.add({
        id: '1',
        url: require('./assets/audio.mp3'),
        title: 'Название',
        artist: 'Исполнитель',
        artwork: require('./assets/art.jpg'),
      });
    }
    init();

    return () => {
      TrackPlayer.destroy(); // Освобождаем ресурсы при размонтировании компонента
    }
  }, []);

  return (
    <View style={styles.container}>
      <TrackInfo />
      <AudioProgress />
      <PlayerControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

Код полностью рабочий после добавления необходимых ассетов и установки зависимостей. Разбейте крупные компоненты на отдельные файлы — это улучшает читаемость и поддержку проекта.

## Дополнительные возможности

React Native Track Player позволяет добавить многое:

- **Музыкальные очереди:** добавляйте плейлист из нескольких треков через массив в `add`.
- **Управление извне:** контроль потокового воспроизведения, поддержка уведомлений на Android и iOS.
- **Сложные обработки:** оповещения о событиях (пауза, конец файла, ошибка) — подписывайтесь на события через хук или слушатель.
- **Громкость и скорость:** используйте методы `setVolume` или `setRate` для этих задач.

## Использование expo-av для приложений Expo

Если вы не можете использовать трек-плеер, попробуйте `expo-av`:

```sh
expo install expo-av
```

Пример воспроизведения аудио:

```js
import { Audio } from 'expo-av';
import React, { useState } from 'react';
import { Button, View } from 'react-native';

function SimpleExpoPlayer() {
  const [sound, setSound] = useState(null);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(require('./assets/audio.mp3'));
    setSound(sound);
    await sound.playAsync();
  }

  return (
    <View>
      <Button title="Играть" onPress={playSound} />
      <Button title="Стоп" onPress={() => sound && sound.unloadAsync()} />
    </View>
  );
}
```

Имейте в виду, что у этого варианта нет продвинутого управления очередями и фоновым режимом на уровне трек-плеера.

## Заключение

Реализация аудиоплеера в React Native не представляет больших сложностей, если вы используете подходящую библиотеку. Самый полный функционал — у react-native-track-player: он поддерживает фон, очереди, уведомления и широкие возможности управления. Для приложений на Expo подойдет expo-av, но там набор функций проще.

Теперь у вас есть рабочий каркас аудиоплеера с пояснениями, примерами кода и советами по расширению функциональности. Используйте и адаптируйте под свои задачи, не забывайте про асинхронность вызовов и очистку ресурсов.

Умение работать со звуком это круто, но не стоит забывать и про другие важные вещи. Для разработки полноценного приложения необходимо также уметь управлять состоянием, обеспечивать навигацию и работать с API. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-realizovat-audio-pleer-na-React-Native) вы найдете все необходимые знания для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи

### Как реализовать стриминг аудио (например, из интернета), а не только проигрывание локальных файлов?

Для потокового аудио просто используйте ссылку на файл вместо локального ресурса в поле `url`:

```js
await TrackPlayer.add({
  id: '2',
  url: 'https://example.com/audio.mp3',
  title: 'Стримовый трек'
});
```
Главное — чтобы сервер поддерживал потоковое воспроизведение (правильные заголовки, поддержка HTTP Range).

### Как обработать ошибку при загрузке/проигрывании трека?

Подпишитесь на событие ошибки:

```js
import TrackPlayer, { Event } from 'react-native-track-player';

TrackPlayer.addEventListener(Event.PlaybackError, (e) => {
  console.warn('Ошибка воспроизведения', e);
});
```
Оповестите пользователя и попробуйте загрузить другой трек или повторно воспроизвести текущий.

### Как сделать "Next" и "Previous" между несколькими треками?

Добавьте массив треков, далее используйте методы:

```js
await TrackPlayer.skipToNext(); // Следующий трек
await TrackPlayer.skipToPrevious(); // Предыдущий трек
```
Следите за текущим треком с помощью `useTrackPlayerCurrentTrack()` и передавайте логику управления состоянием.

### Можно ли реализовать регулировку громкости?

Да, используйте метод:

```js
await TrackPlayer.setVolume(0.5); // Диапазон от 0 (тихо) до 1 (максимум)
```
Для системной громкости используйте отдельные решения или нативные модули.

### Почему не воспроизводится аудио на эмуляторе Android/iOS?

На эмуляторе/симуляторе возможно отсутствие поддержки некоторых аудиоформатов, проблемы с путями к файлам (особенно если ресурс большой), настройки политики безопасности. Протестируйте на реальном устройстве, попробуйте другой формат файла или ссылку на небольшой mp3.
