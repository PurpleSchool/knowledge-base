---
metaTitle: Отображение webview в приложении на React Native
metaDescription: Узнайте как интегрировать и эффективно использовать модуль webview в приложении на React Native - примеры настройки перенаправления взаимодействия пользовательского интерфейса и обмена данными между webview и нативной частью
author: Олег Марков
title: Отображение webview в приложении на React Native
preview: Изучите способы внедрения webview в приложение на React Native - настройка навигации между страницами обмен данными с webview и адаптация интерфейса под мобильные платформы
---

## Введение

В современном мобильном развитии часто возникает задача интеграции веб-контента — например, страниц сайта, встроенных платежей или микросервисов — непосредственно в мобильное приложение. Именно для решения этой задачи был создан webview. В приложениях на React Native webview позволяет отображать веб-страницы и даже сложные веб-приложения внутри мобильного интерфейса, обеспечивая гибкость и расширяя функциональность без написания большого объема нативного кода.

React Native изначально не включает webview в стандартной поставке. Для работы с webview вам потребуется отдельная библиотека. Давайте рассмотрим, как добавить и настроить компонент webview в вашем проекте на React Native, научимся управлять его поведением, разберём возможные сценарии обмена данными между JavaScript-кодом в webview и основным приложением, рассмотрим обработку ошибок, работу с различными платформами, вопросы безопасности и производительности, а также уделим внимание типичным ситуациям, с которыми сталкиваются разработчики.

## Установка и базовая настройка WebView

В современных проектах на React Native для webview используется самостоятельная библиотека [`react-native-webview`](https://github.com/react-native-webview/react-native-webview), поддерживаемая сообществом.



### Установка библиотеки

Для интеграции webview выполните установку через npm или yarn:

```bash
npm install react-native-webview
# или
yarn add react-native-webview
```

На iOS потребуется выполнить linking и сборку pods:

```bash
npx pod-install ios
```

Если вы используете Expo, начиная с SDK 41 webview доступен через пакет [expo install](https://docs.expo.dev/versions/latest/sdk/webview/):

```bash
expo install react-native-webview
```

### Минимальная реализация webview

Вот как выглядит самый простой пример использования webview:

```jsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const MyWebViewScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://reactnative.dev' }} // Здесь задается URL сайта
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});

export default MyWebViewScreen;
```

Здесь мы добавляем компонент WebView на весь экран. В параметре `source` указываем объект с ключом `uri` и ссылкой на нужную страницу.

## Передача локальных HTML-страниц в webview

Вместо удаленного URL вы можете отображать и локальные HTML-файлы:

### Подключение локального файла (Android & iOS)

Для этого используется параметр `source` с ключом `require` или метод чтения файла (с учетом особенностей платформы).

```jsx
<WebView
  originWhitelist={['*']}
  source={require('./assets/my-page.html')} // файл должен лежать в каталоге проекта
/>
```

Для гибкой работы с локальным HTML-кодом используйте свойство `source={{ html: '<h1>Hello from WebView!</h1>' }}`:

```jsx
<WebView
  source={{ html: '<h1>Hello from WebView!</h1>' }}
/>
```

## Взаимодействие между приложением и содержимым webview

Ошибочно полагать, что webview — это только "читалка" страницы. Вы можете организовать двусторонний обмен данными:

### Отправка данных из webview в React Native

Для этого используется функция `window.ReactNativeWebView.postMessage` внутри веб-страницы.

#### Пример: отправка сообщения

```jsx
<WebView
  source={{ html: `
    <button onclick="window.ReactNativeWebView.postMessage('Hello from HTML')">Send</button>
  `}}
  onMessage={event => {
    // здесь обрабатываем сообщение из webview
    console.log('Получено сообщение:', event.nativeEvent.data);
  }}
/>
```

В этом примере при нажатии на кнопку вызывается postMessage, а в коде React Native ловим событие через `onMessage` и обрабатываем его.

### Отправка данных из React Native в страницу webview

Для этого используйте метод `injectJavaScript` или свойство `injectedJavaScript`.

#### Исполнение кода на стороне webview

```jsx
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { Button } from 'react-native';

const SendDataExample = () => {
  const webviewRef = useRef(null);

  const sendData = () => {
    // Здесь отправляем JavaScript-код во внутренний контекст webview
    webviewRef.current.injectJavaScript(`
      document.body.style.backgroundColor = "yellow"; //Меняем цвет фона
      true; // требуется для корректного закрытия промиса после выполнения кода
    `);
  };

  return (
    <>
      <WebView
        ref={webviewRef}
        source={{ html: '<h2>Изменить фон страницы</h2>' }}
      />
      <Button title="Поменять фон" onPress={sendData}/>
    </>
  );
};
```

Как видите, с помощью `injectJavaScript` вы напрямую управляете поведением страницы.

#### Использование `injectedJavaScript`

Если нужно выполнить JavaScript при инициализации страницы, используйте props `injectedJavaScript`:

```jsx
<WebView
  source={{ uri: 'https://example.com' }}
  injectedJavaScript={`alert('WebView загружена!'); true;`}
  onLoad={() => console.log('Страница загружена')}
/>
```

## Навигация и контроль переходов

Чтобы управлять переходами внутри webview и предотвратить открытия сторонних сайтов:

### Отслеживание переходов

Используйте событие `onNavigationStateChange`:

```jsx
<WebView
  source={{ uri: 'https://reactnative.dev' }}
  onNavigationStateChange={navState => {
    // navState.url — текущий url
    console.log('Сейчас открыт:', navState.url);
  }}
/>
```

### Открытие некоторых ссылок во внешнем браузере

Пример: открывать внешние сайты вне приложения.

```jsx
import { Linking } from 'react-native';

<WebView
  source={{ uri: 'https://my-internal-page.com' }}
  onShouldStartLoadWithRequest={request => {
    // Проверяем, что ссылка не внутренняя
    if (!request.url.startsWith('https://my-internal-page.com')) {
      Linking.openURL(request.url); // Открываем ссылку в внешнем браузере
      return false; // Запрещаем переход внутри webview
    }
    return true;
  }}
/>
```

## Управление загрузкой, обработка ошибок и кэширование

### Загрузка и индикатор

Для отслеживания статуса загрузки используйте события `onLoadStart`, `onLoadEnd`, `onLoad`:

```jsx
<WebView
  source={{ uri: 'https://example.com' }}
  onLoadStart={() => console.log('Начало загрузки')}
  onLoadEnd={() => console.log('Загрузка завершена')}
  onError={syntheticEvent => {
    const { nativeEvent } = syntheticEvent;
    console.warn('Ошибка загрузки: ', nativeEvent);
  }}
/>
```

Это удобно для показа loader'а на экране во время загрузки страницы.

### Очистка кэша

Можно принудительно очистить кэш webview:

```jsx
import { WebView } from 'react-native-webview';

<WebView
  source={{ uri: 'https://example.com' }}
  cacheEnabled={false} // отключить кэш по необходимости
/>
```

Для более глубокой очистки потребуется использование нативного кода.

## Настройка безопасности

WebView как механизм наследует многие риски обычных браузеров. Обязательно учитывайте следующие моменты:

- Используйте только надежные источники (следите за свойствами originWhitelist, позволяет явно задать разрешенные домены).
- Отключите выполнение сторонних скриптов, если это не требуется (`javaScriptEnabled={false}`).
- Не подключайте неизвестные внешние ресурсы во встроенных страницах.
- Если есть доступ к Cookie или файловой системе, ограничьте его минимально необходимым уровнем.

Пример ограничения доменов:

```jsx
<WebView
  source={{ uri: 'https://secure-site.com' }}
  originWhitelist={['https://secure-site.com']}
/>
```

## Особенности отображения на Android и iOS

### Отличия в поведении

- **iOS**: webview работает на WKWebView (начиная с RNWebview v6), поддерживает features iOS Safari, но не поддерживает Flash, old-style plugins.
- **Android**: построен на системной реализации WebView, может отличаться в зависимости от версии системы.

#### Не всем props доступны обеим платформам!

Например, `allowsInlineMediaPlayback` работает только на iOS, а `onContentProcessDidTerminate` — специфичен для iOS.

#### Использование пользовательских User-Agent

```jsx
<WebView
  source={{ uri: 'https://your-page.com' }}
  userAgent="MyCustomAgent/1.0"
/>
```

#### Управление состоянием

На Android webview иногда не обновляет содержимое при возвращении на экран — используйте props `key` или принудительный обновления через state.

## Производительность и оптимизация

- По возможности минимизируйте использование сторонних скриптов внутри webview.
- Не забывайте закрывать (размонтировать) webview после использования.
- Оцените, нужен ли webview на каждом экране, или можно использовать нативные экраны с REST API для специфических задач.



## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как ограничить скролл внутри webview?  
Используйте свойство `scrollEnabled={false}` — это запретит пользователю листать содержимое webview. На некоторых версиях Android/WKWebView нужно также внутри HTML задавать CSS `overflow:hidden` для body.

#### Как загрузить PDF внутри webview?  
В большинстве случаев для PDF рекомендуется использовать обычное открытие ссылки в браузере, либо использовать сторонние модули (`react-native-pdf`). Для быстрой проверки в webview хватит передачи url на PDF (многие мобильные webview поддерживают просмотр PDF-файлов по url).

#### Ошибка: webview не отображает изображение с внешнего ресурса  
Проверьте HTTPS-протокол: многие webview блокируют небезопасные соединения по HTTP по умолчанию, особенно в iOS. Используйте https-сервер, либо настройте app transport security (ATS) в Info.plist на iOS.

#### Как удалить cookies в webview?  
В Android используйте `import { CookieManager } from '@react-native-cookies/cookies';` — далее вызовите `CookieManager.clearAll()`. На iOS потребуется использовать WKWebViewConfiguration, специальные методы очистки кук или заменить webview на новую с другим session.

#### Как реализовать автологин пользователя во встраиваемом webview?  
Передавайте токен (или сессионную куку) через injectedJavaScript или через props `sharedCookiesEnabled={true}` (iOS) / `thirdPartyCookiesEnabled={true}` (Android); для более продвинутых сценариев генерируйте ссылку с включенной авторизацией либо интегрируйте механизм SSO по вашему API.
