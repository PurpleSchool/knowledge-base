---
metaTitle: Как создать модальные окна в React Native
metaDescription: Подробная инструкция по созданию модальных окон в React Native - разберитесь с компонентом Modal и настройкой пользовательских окон с анимациями и обработкой событий
author: Олег Марков
title: Как создать модальные окна в React Native
preview: Изучите способы создания модальных окон в React Native - от базового использования компонента Modal до кастомных решений с анимацией и управлением событиями
---

## Введение

Модальные окна — важная часть любого современного мобильного приложения. Они используются, чтобы показать дополнительную информацию, запросить подтверждение или ввести данные, не переходя на другую страницу. В React Native есть встроенные средства для работы с модальными окнами, а также большое количество сторонних библиотек, позволяющих создавать сложные и гибкие решения. В этой статье вы узнаете, как реализовать различные виды модальных окон в React Native, научитесь управлять их состоянием, обрабатывать события закрытия и открытия, а также добавлять анимации.

Мы будем разбирать примеры для новичков, однако вы найдете здесь и полезные советы для более продвинутого использования модалей и оптимизации работы с ними. Если вы только начинаете осваивать React Native или хотите структурировать свои знания по этой теме — вам обязательно поможет этот разбор.

## Что такое модальное окно в React Native

### Основное определение

Модальное окно — это всплывающий элемент интерфейса, перекрывающий другие компоненты и требующий от пользователя взаимодействия перед продолжением работы с приложением. Обычно модальные окна используются для:

- уведомлений
- подтверждения действий (например, «Вы уверены, что хотите удалить?»)
- ввода дополнительной информации (например, формы)
- отображения изображений, подсказок и прочего

В React Native для модальных окон чаще всего применяется компонент Modal, который предоставляет базовые функции для создания простых диалоговых окон.

Модальные окна - важный элемент пользовательского интерфейса в React Native, позволяющий отображать важную информацию или запрашивать действие пользователя. Создание модальных окон требует знания компонентов React Native, анимации и управления состоянием. Важно уметь настраивать внешний вид, обрабатывать закрытие и обеспечивать доступность для пользователей с ограниченными возможностями. Если вы хотите детальнее погрузиться в создание модальных окон и другие аспекты UI в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-sozdat-modalnye-okna-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Использование стандартного компонента Modal

### Импорт и базовое применение

React Native из коробки предлагает компонент Modal. Для его использования достаточно импортировать его из библиотеки react-native:

```javascript
import { Modal, View, Text, Button } from 'react-native';
```

Рассмотрим простой пример модального окна, который появляется по нажатию кнопки:

```javascript
import React, { useState } from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

export default function App() {
  // Управление видимостью модального окна
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Button title="Показать модальное окно" onPress={() => setModalVisible(true)} />
      <Modal
        visible={modalVisible} // Видимость модального окна
        animationType="slide"  // Тип анимации при открытии/закрытии ("slide", "fade", "none")
        transparent={true}     // Прозрачный фон для возможности стилизовать бэкграунд
        onRequestClose={() => setModalVisible(false)} // Обработка события закрытия
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text>Это модальное окно!</Text>
            <Button title="Закрыть" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Стили для модального окна
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Затемненный полупрозрачный фон
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: 300
  }
});
```

В этом примере вам видно, как с помощью состояния мы управляем видимостью модального окна. Свойство `transparent={true}` позволяет создавать затемненный фон, а обработчик `onRequestClose` нужен для корректной работы на Android (закрывает модальное окно при нажатии на системную кнопку «назад»).

### Свойства компонента Modal

Вот основные свойства, которые стоит знать:

- `visible`: Показывать или скрывать модальное окно (true/false).
- `animationType`: Тип анимации окна при появлении ("none", "slide", "fade").
- `transparent`: Если true — позволяет стилизовать фон за модальным окном.
- `onRequestClose`: Функция, вызывающаяся при попытке закрыть окно (актуально для Android).
- `onShow`: Функция, вызываемая при появлении модального окна.
- `presentationStyle`: Способ отображения модального окна (`fullScreen`, `pageSheet`, `formSheet`, `overFullScreen` — только для iOS).

## Обработка нажатия вне модального окна

Часто возникает задача: закрывать модальное окно, если пользователь нажал вне самого диалога. Стандартный компонент Modal по умолчанию не обрабатывает эти касания, но это легко реализовать с помощью Touchables.

Смотрите, как это можно сделать:

```javascript
import { TouchableWithoutFeedback } from 'react-native';

// ...

<Modal
  visible={modalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
    <View style={styles.modalBackground}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text>Модальное окно, нажмите вне его для закрытия.</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
```

В этом примере все пространство за диалогом реагирует на нажатие — и модальное окно закрывается.

## Создание кастомных модальных окон

### Стилизуем под свои задачи

Компонент Modal предоставляет только контейнер. Всё остальное (шапка, кнопки, поля) вы размещаете внутри самостоятельно. Вот пример, как добавить форму в модальном окне:

```javascript
import { TextInput } from 'react-native';

// ...

<View style={styles.modalContent}>
  <Text>Введите свое имя:</Text>
  <TextInput style={styles.input} placeholder="Имя" />
  <Button title="Сохранить" onPress={() => { /* обработка */ }} />
  <Button title="Отмена" onPress={() => setModalVisible(false)} />
</View>

// В стилях:
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  marginVertical: 10,
  paddingHorizontal: 10
}
```

Как видите, любой JSX внутри Modal будет отображён внутри модального окна. Вы можете добавить не только форму, но и, например, карусель с изображениями или даже карту.

### Диалог подтверждения действия

Вот пример простого диалогового окна подтверждения:

```javascript
<Modal
  visible={showConfirm}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowConfirm(false)}
>
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      <Text>Удалить элемент?</Text>
      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <Button title="Да" onPress={handleConfirmDelete} />
        <Button title="Нет" onPress={() => setShowConfirm(false)} />
      </View>
    </View>
  </View>
</Modal>
```

## Добавляем анимации и эффект затемнения

### Анимация появления окна

Вы можете выбрать один из стандартных вариантов:

- `"slide"` — модальное окно выезжает снизу вверх
- `"fade"` — плавное появление
- `"none"` — появление без анимации

Вот пример как это переключать:

```javascript
<Modal
  visible={modalVisible}
  animationType="slide" // Попробуйте сменить на "fade" или "none"
  transparent={true}
  // ...
>
  {/* ... */}
</Modal>
```

### Кастомные анимации с использованием Animated

Если требуется больше гибкости, используйте Together с Modal компонентами анимации на базе Animated API. Здесь покажу простой пример:

```javascript
import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

function AnimatedModal({ visible, children, ...props }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent={true} {...props}>
      <Animated.View style={[styles.modalBackground, { opacity }]}>
        <View style={styles.modalContent}>{children}</View>
      </Animated.View>
    </Modal>
  );
}
```

Здесь любой контент будет плавно затухать вместе с затемнённым фоном.

## Применение сторонних библиотек для модальных окон

Встроенного компонента зачастую хватает, но в реальных проектах хочется большего: например, управлять несколькими модальными окнами сразу, иметь нестандартные анимации или компактный синтаксис для сложных сценариев.

### react-native-modal

Одна из самых популярных библиотек — [react-native-modal](https://github.com/react-native-modal/react-native-modal). Она предоставляет расширенный API, больше возможностей для анимации, перетаскивания по экрану, запрета/разрешения свайпов и прочее.

#### Установка

```bash
npm install react-native-modal
```

#### Базовое использование

```javascript
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import Modal from 'react-native-modal';

export default function App() {
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Открыть модалку" onPress={() => setModalVisible(true)} />
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)} // Закрытие по нажатию вне окна
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
      >
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Это модальное окно библиотеки react-native-modal</Text>
          <Button title="Закрыть" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}
```

#### Особенности и плюсы библиотеки

- Простая обработка кликов по фону окна (`onBackdropPress`)
- Настройка анимаций появления и исчезновения (`animationIn`, `animationOut`)
- Поддержка свайпов и жестов для закрытия окна
- Прозрачность затемнения (`backdropOpacity`)
- Быстрая интеграция с типовыми сценариями

### react-navigation и модальные экраны

Если вы используете навигацию в приложении через `react-navigation`, можно реализовать модальные экраны на базе навигатора.

Вот краткий пример настройки стека с поддержкой модальных окон:

```javascript
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen
          name="MyModal"
          component={ModalScreen}
          options={{ presentation: 'modal' }} // Новый стиль презентации modal для iOS/Android
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

В этом случае появление экрана будет визуально ощущаться как классическое модальное окно.

## Тонкости платформ: Android и iOS

### Ограничения и различия

- На Android, если вы используете аппаратную кнопку «назад», обязательно реализуйте обработчик события `onRequestClose`, иначе приложение упадет с ошибкой.
- Некоторые свойства, как `presentationStyle`, работают только на iOS.
- Системное всплывающее меню, клавиатура и прочие надстройки иногда могут вести себя по-разному — тестируйте окно на разных устройствах!

## Управление вложенными модальными окнами

Иногда появляется задача открывать одно модальное окно из другого (например, подтверждение после формы). В этом случае каждое окно получает свое отдельное состояние и рендерится независимо.

```javascript
const [modalVisible, setModalVisible] = useState(false);
const [confirmationVisible, setConfirmationVisible] = useState(false);

// Открытие второго окна из первого
<Button title="Отправить" onPress={() => setConfirmationVisible(true)} />
```

Строить логику лучше так, чтобы открывалось только одно окно в момент времени.

## Упрощение работы с модальными окнами: хелперы и хуки

Для упрощения управления стоит выносить модальное окно в отдельный компонент или использовать свой хук:

```javascript
function useModal() {
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);
  const close = () => setVisible(false);
  return { visible, open, close };
}
```

Теперь показываю, как можно использовать хук для быстрого внедрения модальных окон:

```javascript
const modal = useModal();

<Button title="Открыть" onPress={modal.open} />
<Modal visible={modal.visible} /* ... */>
  <Button title="Закрыть" onPress={modal.close} />
</Modal>
```

## Заключение

Работа с модальными окнами в React Native довольно прозрачна: вы управляете видимостью стандартного компонента Modal через состояние и размещаете внутри любой нужный дочерний контент. Вы можете свободно стиллизовать модальные окна под требования дизайна, управлять способами их закрытия и открывать сразу несколько окон в рамках приложения. Для более сложных задач подключайте сторонние компоненты, такие как react-native-modal, или используйте модальные экраны стека навигации.

Стоит помнить про специфику платформ и тестировать сценарии с использованием аппаратной клавиши «назад» на Android, а также следить за обновлениями библиотек — функционал официально развивается. Создавайте модальные окна ответственно: избегайте их чрезмерного использования и всегда предоставляйте явные способы закрытия для пользователя.

Создание модальных окон — важный аспект разработки UI, но для разработки полноценного React Native приложения необходимо также уметь управлять состоянием, обеспечивать навигацию, работать с API и создавать переиспользуемые компоненты. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Kak-sozdat-modalnye-okna-v-React-Native) вы найдете все необходимые знания и навыки для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы и мини-инструкции

### Как открыть модальное окно автоматически при запуске экрана?

Используйте хук useEffect для автоматического изменения состояния видимости окна:

```javascript
useEffect(() => {
  setModalVisible(true);
}, []);
```

### Как предотвратить закрытие модального окна по нажатию на кнопку назад на Android?

Компонент Modal требует реализации свойства onRequestClose. Чтобы игнорировать закрытие, просто передайте пустую функцию:

```javascript
<Modal
  onRequestClose={() => {}}
  // другие свойства
/>
```

### Как сделать так, чтобы модальное окно занимало только часть экрана?

Вам нужно задать transparent={true} и стилями modalContent задать размеры и положение, например, с помощью alignItems/justifyContent и flex.

### Как передать данные из модального окна обратно в родительский компонент?

Создайте callback-функцию и передайте её как проп внутрь модального компонента. Вызовите её при подтверждении действия, передав нужные данные.

```javascript
function ParentComponent() {
  const handleData = (value) => { /* обработка value */ };
  return <MyModal onConfirm={handleData} />;
}
```

### Как правильно стилизовать фон за модальным окном?

Используйте стили для View-контейнера, который занимает всё пространство. Например:

```javascript
modalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center'
}
```
