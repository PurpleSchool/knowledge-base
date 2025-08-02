---
metaTitle: Интеграция камеры в приложение на React Native
metaDescription: Подробное руководство по интеграции камеры в приложение на React Native - основные библиотеки, примеры кода и настройка роутинга камеры для Android и iOS
author: Олег Марков
title: Интеграция камеры в приложение на React Native
preview: Пошаговая инструкция и примеры по интеграции камеры в React Native приложение. Осваивайте работу с медиа API, делайте снимки и видео, получайте доступ к галерее и настраивайте разрешения
---

## Введение

Мобильные приложения сегодня все чаще требуют работы с камерой устройства: будь то сканирование QR-кодов, создание фотографий для профиля или видеосъемка для пользовательского контента. В мире React Native — популярного фреймворка для кроссплатформенной мобильной разработки, — интеграция камеры становится одной из основных задач для многих проектов.

К счастью, в React Native существует набор унифицированных библиотек и методов, упрощающих работу с камерой как на Android, так и на iOS. Давайте разберёмся, как реализовать интеграцию камеры, какие инструменты использовать, с какими трудностями вы можете столкнуться, и каким образом быстро запустить рабочий пример.

## Какие библиотеки пригодятся для интеграции камеры

В экосистеме React Native исторически сложились две основные библиотеки для работы с камерой:

- **react-native-camera** — больше не поддерживается активно и не рекомендуется для новых проектов.
- **react-native-vision-camera** — современное, быстрое решение с поддержкой последних возможностей камер и стабильным API.

Чаще всего сегодня выбирают **react-native-vision-camera**, так как она предоставляет более высокую производительность и расширенную поддержку платформ.

### Установка react-native-vision-camera

Начиная с этого шага, покажу, как подключить и настроить эту библиотеку. Команду запускайте в вашем проекте:

```bash
npm install react-native-vision-camera
```

Или, если используете Yarn:

```bash
yarn add react-native-vision-camera
```

Затем выполните автозапуск линковки (для iOS):

```bash
cd ios && pod install && cd ..
```

Теперь библиотека установлена, но нужно явно запросить разрешения у пользователя на съемку фото и видео.

Интеграция камеры в React Native приложение позволяет пользователям делать фотографии и записывать видео прямо из приложения. Для этого требуется знание нативных API, разрешений и умение обрабатывать полученные данные. Важно также учитывать особенности различных платформ и обеспечивать конфиденциальность данных. Если вы хотите детальнее погрузиться в интеграцию камеры и другие нативные возможности в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-kamery-v-prilozhenie-na-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Работа с разрешениями

Для корректной работы камеры нужно запросить разрешения:

### iOS

Откройте файл Info.plist (находится в ios/PROJECT_NAME/Info.plist) и добавьте строки:

```xml
<key>NSCameraUsageDescription</key>
<string>Разрешите использование камеры для съёмки фото и видео</string>
<key>NSMicrophoneUsageDescription</key>
<string>Разрешите использование микрофона для записи видео</string>
```

Это необходимо, чтобы появилось стандартное системное окно запроса доступа.

### Android

В Android откройте файл AndroidManifest.xml (app/src/main/) и добавьте такие разрешения:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
```

Эти разрешения позволят использовать камеру и запись видео с микрофоном.

### Запрос разрешений в коде

Vision Camera предоставляет метод для запроса разрешений. Например:

```js
import { Camera } from 'react-native-vision-camera';

// Проверяем разрешение на использование камеры
const getCameraPermission = async () => {
  const cameraPermission = await Camera.getCameraPermissionStatus(); // 'authorized', 'denied' и т.д.
  if (cameraPermission !== 'authorized') {
    const newCameraPermission = await Camera.requestCameraPermission();
    // newCameraPermission - новый статус
  }
};

// То же для микрофона (для видео)
const getMicrophonePermission = async () => {
  const micPermission = await Camera.getMicrophonePermissionStatus();
  if (micPermission !== 'authorized') {
    await Camera.requestMicrophonePermission();
  }
};
```

Обычно вызывать эти функции нужно до отображения компонента камеры.

## Как использовать компонент камеры

Vision Camera предоставляет универсальный компонент `<Camera>`:

```js
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const MyCameraScreen = () => {
  const devices = useCameraDevices();
  const device = devices.back; // Используем заднюю камеру (можно front для селфи)

  if (device == null) return <Text>Камера загружается...</Text>;

  return (
    <Camera
      style={{ flex: 1 }}
      device={device}
      isActive={true} // Включаем камеру при отображении
      photo={true} // Разрешаем делать фото
      video={true} // Разрешаем видео (опционально)
      audio={true} // Для записи звука (опционально)
    />
  );
};
```
#### Пояснения:

- `useCameraDevices()` возвращает объект с доступными камерами устройства.
- Вы выбираете камеру (обычно `front` или `back`).
- В `isActive` передавайте `true`, чтобы показывался превью в реальном времени.

## Съёмка фото

Покажу, как сделать фотографию по нажатию кнопки:

```js
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const TakePhotoScreen = () => {
  const camera = useRef(null); // Сохраняем реф для доступа к методам камеры
  const devices = useCameraDevices();
  const device = devices.back;

  const capturePhoto = async () => {
    if (camera.current == null) return;
    const photo = await camera.current.takePhoto({
      flash: 'off', // Варианты: 'on', 'off', 'auto'
    });
    // photo.path содержит путь к сохраненному изображению
    console.log('Сделано фото:', photo);
  };

  if (device == null) return <View />;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
        ref={camera} // Передаем ref
      />
      <Button title="Сделать фото" onPress={capturePhoto} />
    </View>
  );
};
```
#### Примечания:

- После съёмки `photo.path` содержит локальный путь (iOS и Android имеют разный формат).
- Учтите, что некоторые Android-устройства требуют разрешение на запись файлов.

## Запись видео

Процесс похожий, только вместо `takePhoto` вызывается `startRecording`:

```js
const startVideoRecording = async () => {
  if (camera.current == null) return;
  camera.current.startRecording({
    onRecordingFinished: (video) => {
      // video.path содержит путь к видеофайлу
      console.log('Готово видео:', video);
    },
    onRecordingError: (error) => {
      console.error('Ошибка при записи:', error);
    }
  });
};

const stopVideoRecording = () => {
  if (camera.current) {
    camera.current.stopRecording();
  }
};
```
Для этого используйте две кнопки: «Начать запись» и «Остановить запись».

#### Пример с двумя кнопками:

```js
<Button title="Записать видео" onPress={startVideoRecording} />
<Button title="Остановить запись" onPress={stopVideoRecording} />
```

Теперь вы видите, как реализовать базовую логику съемки видео.

## Переключение между фронтальной и тыльной камерой

Очень популярная задача — предоставить пользователю выбор, какой камерой пользоваться:

```js
const [isFront, setIsFront] = useState(false);
const devices = useCameraDevices();
const device = isFront ? devices.front : devices.back;

// Кнопка для переключения камеры
<Button
  title="Сменить камеру"
  onPress={() => setIsFront((v) => !v)}
/>
```

Это обновит состояние, вызовет повторный рендер и отдаст компоненту нужную камеру.

## Дополнительные возможности и настройки камеры

react-native-vision-camera позволяет настраивать не только базовые параметры. Вот некоторые фишки, которые особенно полезны:

- **Автофокус** — обычно камера по умолчанию фокусируется автоматически, но можно задать focus point вручную.
- **Зум** — свойство `zoom` (от 1 до максимального значения для камеры).
- **Расширенные настройки экспозиции, ISO, баланса белого** — возможны через отдельные методы (см. [документацию Vision Camera](https://mrousavy.com/docs/vision-camera/)).

### Как добавить зум

```js
<Camera
  // ...
  zoom={2} // Кратность зума
/>
```
Или используйте ползунок для динамической настройки.

## Пример: Минималистичное приложение с камерой

Вот простая заготовка с фото и видео — добавьте её как отдельный экран (например, CameraScreen.js):

```js
import React, { useRef, useState } from 'react';
import { View, Button, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const CameraScreen = () => {
  const camera = useRef(null);
  const [isFront, setIsFront] = useState(false);
  const [recording, setRecording] = useState(false);
  const devices = useCameraDevices();
  const device = isFront ? devices.front : devices.back;

  const takePhoto = async () => {
    if (camera.current) {
      const photo = await camera.current.takePhoto({});
      console.log('Фото:', photo);
    }
  };

  const startRecording = async () => {
    setRecording(true);
    if (camera.current) {
      camera.current.startRecording({
        onRecordingFinished: (video) => {
          setRecording(false);
          console.log('Видео:', video);
        },
        onRecordingError: (e) => {
          setRecording(false);
          console.error(e);
        },
      });
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    if (camera.current) {
      camera.current.stopRecording();
    }
  };

  if (device == null) return <Text>Нет доступа к камере</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
        video={true}
        audio={true}
        ref={camera}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 8 }}>
        <Button title="Сменить камеру" onPress={() => setIsFront(v => !v)} />
        <Button title="Фото" onPress={takePhoto} />
        {!recording ? (
          <Button title="Видео" onPress={startRecording} />
        ) : (
          <Button title="Стоп" onPress={stopRecording} color="red" />
        )}
      </View>
    </View>
  );
};
```
Добавьте этот экран в роутинг приложения, и получите работающее решение.

## Тонкости платформ и распространенные проблемы

### Android

- Не забудьте о всех разрешениях.
- Для эмулятора камера не всегда доступна – тестируйте обязательно на реальном устройстве.
- Путь к фото или видео обычно начинается с `/storage/emulated/0/`.

### iOS

- Поддержка камеры в симуляторе сильно ограничена — тестируйте на устройстве.
- Иногда требуется явно выключать режим Live Preview, если камера не используется (устанавливать `isActive={false}`), иначе приложение может расходовать много ресурсов.

### Общие моменты

- После удаления приложения и повторной установки разрешения нужно запрашивать заново.
- Не забывайте отключать все подписки и listeners на unmount-ах компонентов.

## Интеграция с галереей

Хотите добавить возможность выбора фото или видео из галереи? Для этого отлично подходит библиотека `react-native-image-picker`:

```bash
npm install react-native-image-picker
```
Запросите разрешения аналогично основным камерам, и используйте:

```js
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

launchImageLibrary({ mediaType: 'photo' }, (result) => {
  if (!result.didCancel) {
    // result содержит выбранное фото
    console.log(result);
  }
});
```

Здесь пользователь увидит стандартный диалог выбора изображения или видео.

## Советы по производительности и архитектуре

- **Не держите камеру активной дольше, чем нужно**. Отключайте ее при уходе со страницы.
- Используйте lazy loading для тяжелых компонентов камеры.
- Ограничьте доступ к фото и видео только при необходимости (например, требуйте разрешения не на старте приложения, а только на определенном экране).

Это позволит избежать лишних запросов разрешений и экономить ресурсы устройства.

## Заключение

Встраивание камеры в React Native-приложение сводится к установке подходящей библиотеки (например, vision-camera), грамотной работе с разрешениями и построению компонента камеры с доступными функциями. Вы можете легко расширять возможности (зум, автофокус, запись аудио) и интегрировать выбор фото и видео из галереи.

Главное – тщательно тестируйте на разных устройствах и не забывайте правильно обрабатывать разрешения и возможные ошибки.

Умение работать с камерой сильно расширяет возможности приложения. Тем не менее, для разработки полноценного приложения необходимо также уметь управлять состоянием, обеспечивать навигацию и работать с API. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Integratsiya-kamery-v-prilozhenie-na-React-Native) вы найдете все необходимые знания для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Почему камера не запускается на Android эмуляторе?

Часто эмуляторы Android не поддерживают работу с камерой по умолчанию или подключают виртуальную камеру. Проверяйте настройки эмулятора: в разделе Camera выберите опцию "Emulated" или "Webcam". Однако для реальных тестов всегда используйте физическое устройство — некоторые аппаратные функции эмулятор не эмулирует.

#### Как получить изображение в base64 сразу после съемки?

В Vision Camera стандартно путь к файлу возвращается, чтобы получить base64, можно воспользоваться дополнительными библиотеками, например, react-native-fs, чтобы прочитать файл в формате base64.
```js
import RNFS from 'react-native-fs';
const base64photo = await RNFS.readFile(photo.path, 'base64');
```

#### Как обработать ошибку "Camera not found" или "Нет доступа к камере"?

Проверьте, что:
- Вы запросили разрешения (см. раздел статьи).
- Ваше устройство/эмулятор имеет физическую (или эмулируемую) камеру.
- Используется правильное свойство devices.front или devices.back (может быть отличное для планшетов и бюджетных смартфонов).

#### Где хранятся файлы фото и видео после съемки?

На Android файлы обычно сохраняются во внутреннем хранилище или на SD-карте, путь начинается с `/storage/`. На iOS путь временный, и стоит скопировать файл в постоянное хранилище, если вы планируете работать с ним дальше. Для сохранения в галерею используйте react-native-cameraroll.

#### Как добавить сканирование QR-кодов?

Vision Camera предоставляет API для интеграции с фреймворками обработки изображений (Frame Processors). Можно использовать готовый плагин vision-camera-code-scanner или интегрировать сторонние библиотеки, поблочно обрабатывая поток с камеры для обнаружения QR-кодов.
