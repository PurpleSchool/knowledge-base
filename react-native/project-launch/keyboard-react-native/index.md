---
metaTitle: Обработка keyboard-событий в React Native
metaDescription: Как работать с keyboard-событиями в React Native - пошаговое руководство с примерами и объяснениями по управлению поведением клавиатуры
author: Олег Марков
title: Обработка keyboard-событий в React Native
preview: Узнайте, как ловить, обрабатывать и кастомизировать события клавиатуры в React Native - наглядная инструкция с подробными примерами кода
---

## Введение

При разработке мобильных приложений с помощью React Native часто возникает задача управлять поведением экранной клавиатуры — например, отслеживать ее появление и скрытие, корректно работать с расположением элементов при вводе текста, прятать или кастомизировать клавиатуру при определённых сценариях. Якщо вы сталкивались с тем, что поля ввода перекрывались клавиатурой или интерфейс выглядел "сломано", эта статья поможет понять, как грамотно обрабатывать keyboard-события.

В React Native предоставлены специальные средства для работы с клавиатурой, отслеживания её статуса и автоматического/ручного управления поведением. Я покажу, как грамотно ловить события появления и исчезновения клавиатуры, реагировать на эти события, а также корректно выстраивать UI, чтобы обеспечить пользователю комфортный ввод данных.

## Keyboard-события в React Native: основы

### Компонент Keyboard и его методы

React Native предоставляет модуль `Keyboard`, который помогает отслеживать различные события, связанные с клавиатурой:

- появление клавиатуры (keyboardDidShow, keyboardWillShow)
- скрытие клавиатуры (keyboardDidHide, keyboardWillHide)
- изменение размера клавиатуры и изменение её фрейма (keyboardWillChangeFrame, keyboardDidChangeFrame — на iOS)

Для использования этих событий необходимо сделать импорт:

```javascript
import { Keyboard } from 'react-native';
```

### Основные события и их отличие

Давайте рассмотрим основные события, которые вы сможете использовать в своем приложении:

- `keyboardDidShow` — вызывается сразу после того, как клавиатура появилась на экране.
- `keyboardWillShow` — вызывается перед тем, как клавиатура появится (поддерживается только iOS).
- `keyboardDidHide` — вызывается после того, как клавиатура убрана с экрана.
- `keyboardWillHide` — срабатывает перед тем, как клавиатура будет скрыта (только iOS).
- `keyboardWillChangeFrame` и `keyboardDidChangeFrame` — уведомляют об изменении размеров/позиции клавиатуры (iOS).

**Почему важно различать эти события?**

События "will" особенно полезны, когда необходимо заранее начать анимацию элементов, чтобы они не перекрывались клавиатурой, а "did" — когда нужно отреагировать уже после появления или скрытия клавиатуры.

## Добавление обработчиков keyboard-событий: пошагово

### Как подписаться на события клавиатуры

Обычно вы подписываетесь на события в componentDidMount (или внутри useEffect - для функциональных компонентов), и не забудьте удалить обработчики при размонтировании компонента, чтобы избежать утечек памяти.

**Пример для функционального компонента с useEffect**:

```javascript
import React, { useEffect } from 'react';
import { Keyboard } from 'react-native';

const KeyboardHandlerComponent = () => {
  useEffect(() => {
    // Добавляем обработчики событий
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      // Реакция на появление клавиатуры
      console.log('Клавиатура появилось');
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      // Реакция на скрытие клавиатуры
      console.log('Клавиатура исчезло');
    });

    // Удаляем обработчики при размонтировании
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return null; // Важно, что этот компонент только слушает события
};
```

В этом примере мы явно подписываемся на два основных события, которые будут работать как на Android, так и на iOS.

### Пример с обработкой статуса и анимацией

Давайте интегрируем знание о событии в ваш UI, например, чтобы скрыть/показать кнопку, когда клавиатура открыта:

```javascript
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Keyboard, Text } from 'react-native';

const ExampleWithKeyboard = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <TextInput placeholder="Введите текст..." style={{ borderWidth: 1, margin: 16 }} />
      {/* Показываем кнопку только когда клавиатура скрыта */}
      {!keyboardVisible && <Button title="Отправить" onPress={() => {}} />}
      <Text>Статус клавиатуры: {keyboardVisible ? 'Открыта' : 'Закрыта'}</Text>
    </View>
  );
};
```

### Подробно о параметрах событий клавиатуры

В callback-функцию события клавиатуры (например, для `keyboardDidShow`) передается объект события с полезной информацией:

```javascript
Keyboard.addListener('keyboardDidShow', (event) => {
  // event.endCoordinates.height содержит высоту клавиатуры
  // event.duration - длительность анимации (iOS)
  // event.easing - тип анимации (iOS)
  console.log(event);
});
```

Это помогает адаптировать размер элементов на экране. Например, вы можете добавить padding или убрать перекрытие на основании высоты клавиатуры.

## Практические сценарии использования keyboard-событий

### Смещение элементов при появлении клавиатуры

Очень часто поля ввода могут перекрываться клавиатурой. Чтобы этого не происходило, можно динамически изменять внутренние отступы (`padding` или `margin_bottom`) вашего контейнера. Вот пример простой реализации:

```javascript
import React, { useState, useEffect } from 'react';
import { View, TextInput, Keyboard, Platform } from 'react-native';

const KeyboardAvoidingViewExample = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height); // Сохраняем высоту клавиатуры
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: keyboardHeight }}>
      <TextInput placeholder="Ваш комментарий..." style={{ borderWidth: 1, margin: 16 }} />
    </View>
  );
};
```

Здесь мы автоматически увеличиваем отступ `paddingBottom` на высоту клавиатуры, чтобы поле ввода всегда было видно на экране.

#### Platform-specific особенности

На iOS рекомендуется использовать событие "keyboardWillShow", "keyboardWillHide", чтобы начать анимацию до появления/скрытия клавиатуры и синхронизироваться с системной анимацией.

### Использование компонента KeyboardAvoidingView

Вместо ручного управления отступами вы можете воспользоваться специальным компонентом `KeyboardAvoidingView` из React Native. Он автоматически перемещает свои дочерние элементы, чтобы избежать перекрытия клавиатурой. Пример:

```javascript
import React from 'react';
import { KeyboardAvoidingView, Platform, TextInput, Button } from 'react-native';

const KeyboardAvoidingComponent = () => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Указываем, как изменять поведение в зависимости от платформы
      style={{ flex: 1, justifyContent: 'flex-end' }}>
      <TextInput placeholder="Введите что-нибудь..." style={{ borderWidth: 1, margin: 16 }} />
      <Button title="Сохранить" onPress={() => {}} />
    </KeyboardAvoidingView>
  );
};
```

- `behavior='padding'` — нижний padding увеличивается на высоту клавиатуры
- `behavior='height'` — высота контейнера уменьшается до высоты, необходимой для отображения содержимого над клавиатурой

Это быстрый способ обеспечить "правильное" поведение всех дочерних элементов без ручных вычислений.

### Закрытие клавиатуры при нажатии вне поля ввода

Пользователям часто бывает удобно, если клавиатура автоматически убирается при касании вне полей ввода. Для этого существует паттерн с использованием `TouchableWithoutFeedback`:

```javascript
import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View, TextInput } from 'react-native';

const DismissKeyboardComponent = () => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {/* Любой ваш контент здесь */}
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <TextInput placeholder="Введите текст..." style={{ borderWidth: 1, margin: 16 }} />
    </View>
  </TouchableWithoutFeedback>
);
```

Теперь при нажатии в любую "пустую" область экрана клавиатура будет автоматически скрыта.

### Программное управление клавиатурой

В модуле `Keyboard` есть еще методы:

- `Keyboard.dismiss()` — программное скрытие клавиатуры. Можно вызвать вручную, например, чтобы убрать клавиатуру при отправке формы.

```javascript
Keyboard.dismiss(); // Закрыть клавиатуру программно
```

- Явно вызвать появление клавиатуры нельзя (нужно фокусировать поле ввода), например:
```javascript
// Фокусируем поле ввода, чтобы показать клавиатуру
inputRef.current.focus();
```

### KeyboardAwareScrollView: ещё один подход

При сложных формах или длинных списках рекомендуется использовать 
[`react-native-keyboard-aware-scroll-view`](https://github.com/APSL/react-native-keyboard-aware-scroll-view). Этот компонент "умнее" подстраивает скролл и позиционирование вложенных элементов при работе с клавиатурой.

```javascript
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const FormWithKeyboardAware = () => (
  <KeyboardAwareScrollView>
    {/* Ваши поля ввода здесь */}
  </KeyboardAwareScrollView>
);
```

Этот компонент сам "подкинет" нужные элементы, чтобы скроллировать их над клавиатурой, и решит большинство стандартных проблем с перекрытиями и доступностью.

## Особенности работы с клавиатурой на Android и iOS

- На Android события `keyboardWillShow` и `keyboardWillHide` не поддерживаются, только `keyboardDidShow` и `keyboardDidHide`.
- Поведение клавиатуры может зависеть от настроек AndroidManifest.xml: параметр `windowSoftInputMode` в <activity> определяет, как изменять layout при появлении клавиатуры (resize, pan, adjustNothing).
- На iOS появление клавиатуры сопровождается анимациями, события "will" приходят заранее, есть параметры анимации (easing, duration), что можно использовать для создания плавных переходов.

Настройки AndroidManifest.xml для корректной работы (обычно рекомендуется):

```xml
<activity
  android:windowSoftInputMode="adjustResize">
</activity>
```

Это обеспечит resize вашего layout и позволит вашей логике работать корректно. Если стоит `adjustPan`, layout не изменяется, экран просто "скроллит".

### Подсказка по тестированию

При работе с клавиатурой всегда тестируйте на реальных устройствах, так как эмуляторы иногда ведут себя иначе: особенно на Android бывают нюансы.

## Частые ошибки и распространенные "грабли"

- Забыли удалить обработчики событий — приводит к утечке памяти или повторным вызовам.
- Использовали неподдерживаемое событие для Android — код не сработает.
- Не учли изменение размера клавиатуры на устройствах с разными раскладками/опциями (ментально закладывайте, что высота клавиатуры может быть разной).
- Забыли настроить `windowSoftInputMode` – UI не меняет размер, элементы могут оказаться скрытыми навсегда.

## Заключение

Keyboard-события в React Native — один из фундаментальных аспектов грамотной работы с полями ввода и комфортной организации UX. Применяя обработку этих событий, используя стандартные средства (`Keyboard`, `KeyboardAvoidingView`), а также сторонние библиотеки (`react-native-keyboard-aware-scroll-view`), вы сможете избегать перекрытий интерфейса и сделать ввод данных действительно удобным. Главный совет — всегда тестируйте на "живых" устройствах и не забывайте чистить обработчики событий.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как узнать, какая раскладка клавиатуры открыта (цифровая, стандартная, email и др.)?**

React Native сам по себе не предоставляет API для отслеживания раскладки клавиатуры. Однако вы можете косвенно управлять этим через свойство `keyboardType` у TextInput. Если критично определить тип, придётся полагаться на вашу собственную логику, например, запоминать какой тип поля сейчас в фокусе.

**2. Почему `KeyboardAvoidingView` не работает для некоторых кастомных компонентов или внутри ScrollView?**

`KeyboardAvoidingView` корректно работает только с непосредственными дочерними элементами и не всегда дружит с вложенными ScrollView. Рекомендуется использовать `react-native-keyboard-aware-scroll-view` для сложных кейсов.

**3. Какие бывают трудности с аппаратными клавиатурами (Bluetooth-клавиатуры или физические клавиши)?**

Встроенные события Keyboard не отличаются для аппаратных клавиатур — клавиатура может не запускать появление системной экранной клавиатуры. Для обработки ввода с физической клавиатуры нужно использовать другие методы: слушать события ввода на TextInput через props типа `onKeyPress`.

**4. Как сделать так, чтобы клавиатура автоматически скрывалась после отправки формы?**

В обработчике нажатия кнопки (submit), вызывайте `Keyboard.dismiss()` сразу после обработки данных.

**5. Почему клавиатура иногда перекрывает input на Android, даже при adjustResize?**

Это может быть баг самого Android-устройства, либо неправильная структура layout. Убедитесь, что корнем вашей иерархии является View с `flex:1`, и что настроено `windowSoftInputMode=adjustResize` в AndroidManifest.xml. Если не помогает, попробуйте использовать `KeyboardAwareScrollView`.