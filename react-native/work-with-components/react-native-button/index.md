---
metaTitle: Создание интерактивных кнопок в React Native
metaDescription: Изучите методы создания интерактивных кнопок в React Native - узнайте про стандартные и кастомные решения, обработку событий, стилизацию и анимацию
author: Олег Марков
title: Создание интерактивных кнопок в React Native
preview: Разберитесь, как создавать и кастомизировать интерактивные кнопки в React Native - подробные инструкции, примеры кода, обработка кликов и плавная анимация
---

## Введение

Кнопки — одна из центральных интерактивных составляющих мобильных приложений. Пользователь ожидает, что нажатие на кнопку вызовет определенное действие: оформит заказ, отправит сообщение или развернет скрытый список. В React Native вы можете использовать как стандартные компоненты для кнопок, так и создавать свои полностью кастомные решения с уникальным поведением и стилями. В этой статье мы пошагово разберем, как реализовывать такие кнопки, обрабатывать события, добавлять анимации, кастомизировать их под свои задачи, а также рассмотрим нюансы работы с ними.

## Стандартные компоненты кнопок в React Native

Давайте начнем с краткого обзора стандартных способов создания кнопок.

Интерактивные кнопки — ключевой элемент пользовательского интерфейса в React Native. Для создания привлекательных и удобных кнопок необходимо знать, как стилизовать их, обрабатывать события нажатия, добавлять анимацию и обеспечивать обратную связь пользователю. Важно также учитывать доступность кнопок для пользователей с ограниченными возможностями. Если вы хотите детальнее погрузиться в создание интерактивных кнопок и других UI-компонентов в React Native, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-interaktivnyh-knopok-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Button

Компонент `Button` — самый простой способ добавить интерактивную кнопку в приложение на React Native.

#### Пример использования Button

```jsx
import React from 'react';
import { Button, View } from 'react-native';

const SimpleButton = () => (
  <View>
    <Button
      title="Нажми меня"
      onPress={() => alert('Вы нажали на кнопку!')}
      // Обработчик onPress вызывается при нажатии
      color="#841584"
      // цвет фона кнопки (работает не на всех платформах)
    />
  </View>
);

export default SimpleButton;
```

Обратите внимание: стандартный `Button` довольно ограничен. Его внешний вид трудно поменять — для особых стилей придется выбирать другие компоненты.

### TouchableOpacity

Если вам нужно больше контроля над стилями и плавное затухание при нажатии — используйте `TouchableOpacity`.

#### Пример TouchableOpacity

```jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = () => (
  <TouchableOpacity
    style={styles.button}
    onPress={() => alert('Вы нажали на кастомную кнопку!')}
    activeOpacity={0.7} // Прозрачность при нажатии
  >
    <Text style={styles.buttonText}>Клик!</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#009688',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CustomButton;
```

`TouchableOpacity` используется, когда вам нужен кастомный вид и анимационный эффект при нажатии.

### TouchableHighlight

`TouchableHighlight` отличается от `TouchableOpacity` тем, что подсвечивает элемент фоном при нажатии.

```jsx
import React from 'react';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';

const HighlightButton = () => (
  <TouchableHighlight
    style={styles.button}
    underlayColor="#DDDDDD" // Цвет подсветки при нажатии
    onPress={() => alert('Вы нажали!')}
  >
    <Text style={styles.buttonText}>Highlight</Text>
  </TouchableHighlight>
);

// Стилизация аналогична предыдущему примеру
```

### Pressable — современный подход

С выходом новой версии React Native появился компонент `Pressable`. Он гибче предыдущих и позволяет реагировать на разные этапы взаимодействия с кнопкой.

```jsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const PressableButton = () => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      { backgroundColor: pressed ? '#3e8e41' : '#5ba9d6' }
      // Меняем цвет кнопки в зависимости от состояния
    ]}
    onPress={() => alert('Pressable работает!')}
    onLongPress={() => alert('Долгое нажатие!')}
  >
    <Text style={styles.buttonText}>Pressable</Text>
  </Pressable>
);
```

## Кастомные кнопки: создание своего компонента

В большинстве реальных проектов стандартных кнопок бывает недостаточно — требуется уникальный дизайн, иконки, кастомная анимация, поддержка спиннеров при загрузке. Покажу, как реализовать свою кнопку.

### Базовая кастомная кнопка

```jsx
import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const MyButton = ({ onPress, title, loading, disabled }) => (
  <TouchableOpacity
    style={[
      styles.button,
      disabled ? styles.buttonDisabled : null
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading
      ? <ActivityIndicator color="#fff" size="small" /> // Показываем спиннер во время загрузки
      : <Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 8
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default MyButton;
```

Теперь у вас есть собственная кнопка с возможностью показать лоадер и отключение при необходимости.

#### Использование кастомной кнопки

```jsx
<MyButton
  title="Отправить"
  onPress={() => { /* Действие */ }}
  loading={isLoading}
  disabled={false}
/>
```

### Добавление иконок

Часто полезно добавить иконку. Для этого используйте любую библиотеку иконок, например, [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons).

```jsx
import Icon from 'react-native-vector-icons/MaterialIcons';

// Внутри вашей кнопки:
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Icon name="send" size={20} color="#fff" />
  <Text style={styles.buttonText}>Отправить</Text>
</View>
```

Помните про стили: удобно использовать flexDirection: 'row' для горизонтального расположения иконки и текста.

### Обработка событий: onPress, onLongPress, onPressIn и onPressOut

Компоненты `TouchableOpacity`, `Pressable` и другие позволяет обрабатывать различные пользовательские события:

- **onPress** — обычное короткое нажатие;
- **onLongPress** — долгое нажатие;
- **onPressIn** — срабатывает в момент касания;
- **onPressOut** — срабатывает, когда палец убрали.

```jsx
<Pressable
  onPress={() => console.log('Press')}
  onPressIn={() => console.log('Press In')}
  onPressOut={() => console.log('Press Out')}
  onLongPress={() => console.log('Long Press')}
>
  <Text>Интерактивная кнопка</Text>
</Pressable>
```

Это позволяет реализовывать сложное поведение: например, при onPressIn показывать эффект нажатия, или давать разный функционал на короткое и долгое нажатие.

## Детальная настройка стиля кнопки

Почти всегда нужно изменять внешний вид кнопки. Вот основные параметры, которые чаще всего меняют:

- Цвет фона (`backgroundColor`)
- Размеры (`padding`, `width`, `height`)
- Радиус скругления (`borderRadius`)
- Цвет, размер, шрифт текста
- Тень (только для некоторых платформ)
- Плавные переходы состояний (анимации)

### Пример стилизации

```jsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 5, // Тень для Android
    shadowColor: '#000', // Тень для iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: 1
  }
});
```

Какие параметры использовать для тени зависит от платформы — для Android работает свойство elevation, для iOS — несколько свойств shadow*.

## Использование анимаций для кнопок

Анимация создает ощущение отклика и делает интерфейс приятнее для пользователя. React Native поддерживает анимации через стандартный API:

- Animated
- LayoutAnimation
- Реализации через сторонние библиотеки (например, Reanimated)

### Простой пример с Animated

Давайте рассмотрим реализацию кнопки с анимацией масштаба при нажатии:

```jsx
import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

const ScaleButton = ({ title, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  // Функция для анимации нажатия
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95, // уменьшение размера
      useNativeDriver: true
    }).start();
  };

  // Возврат к обычному размеру
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        <Text style={styles.buttonText}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#388e3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 18
  }
});

export default ScaleButton;
```

Смотрите, здесь анимируется свойство transform: scale — кнопка слегка уменьшается при нажатии, а затем плавно возвращается к исходному размеру.

## Индикация состояния: загрузка, ошибки, успех

Важно, чтобы пользователь понимал, что происходит при нажатии на кнопку:

- Когда выполняется действие — показываем спиннер (loading)
- После ошибки — подсвечиваем кнопку или текст ошибки
- При успехе — визуальное подтверждение (например, смена цвета)

### Пример индикации загрузки и ошибок

```jsx
const StatusButton = ({ loading, error, onPress, title }) => (
  <TouchableOpacity
    style={[
      styles.button,
      error && styles.buttonError
    ]}
    onPress={onPress}
    disabled={loading}
  >
    {loading
      ? <ActivityIndicator color="#fff" size="small" />
      : <Text style={styles.buttonText}>{title}</Text>
    }
    {error && <Text style={styles.errorText}>{error}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonError: {
    backgroundColor: '#e53935' // Красный цвет для ошибок
  },
  buttonText: {
    color: '#fff'
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    position: 'absolute',
    bottom: -18
  }
});
```

В этом примере кнопка отображает индикатор загрузки, затем — сообщение об ошибке и меняет цвет при возникновении ошибки.

## Работа с состояниями: активная, отключенная, нажатая кнопка

Реализация разных состояний кнопки помогает сделать интерфейс понятнее.

- **Активная (active):** готова к нажатию;
- **Отключенная (disabled):** визуально и функционально неактивна;
- **Нажатая (pressed):** показывает эффект во время касания.

В practice чаще всего меняется внешний вид с помощью стилей и условий.

```jsx
<TouchableOpacity
  style={[
    styles.button,
    disabled ? styles.buttonDisabled : null
  ]}
  onPress={disabled ? null : onPress}
  disabled={disabled}
/>
```

Хорошая практика — явно передавать в компонент свойство disabled и адаптировать обработчики событий.

## Сложные сценарии: кнопки с Ripple-эффектом и платформенная поддержка

На Android принято использовать ripple-эффекты — расширяющуюся волну при нажатии. Реализовать это можно двумя путями:

1. **TouchableNativeFeedback**
2. **Pressable** (современный способ, поддерживает стилевые изменения при нажатии)

```jsx
import { TouchableNativeFeedback, View, Text } from 'react-native';

const RippleButton = ({ onPress, title }) => (
  <TouchableNativeFeedback
    onPress={onPress}
    background={TouchableNativeFeedback.Ripple('#FFF', false)}
  >
    <View style={{ backgroundColor: '#607d8b', borderRadius: 8, padding: 12 }}>
      <Text style={{ color: '#fff' }}>{title}</Text>
    </View>
  </TouchableNativeFeedback>
);
```

Этот компонент корректно работает только на Android. Для кроссплатформенных решений лучше использовать `Pressable`.

## Лучшие практики для интерактивных кнопок в React Native

- Учитывайте размеры: кнопка должна быть достаточно большой (обычно минимум 48x48 px).
- Используйте визуальный фидбек: эффект нажатия, загрузка, ошибка.
- По возможности делайте кастомные компоненты переиспользуемыми.
- Обрабатывайте недоступность (disabled), чтобы пользователь не мог нажать на кнопку в неподходящий момент.
- Проверьте доступность по Accessibility: используйте props вроде `accessibilityLabel`, `accessible`, чтобы облегчить взаимодействие с приложением людям с особенностями восприятия.

## Заключение

Создание интерактивных кнопок в React Native — несложная задача, если знать доступные инструменты. Вы познакомились со стандартными компонентами, кастомизацией кнопок, анимациями, обработкой разных событий и стилизацией. Вам доступен огромный простор для творчества: реализуйте любой дизайн, добавляйте иконки и лоадеры, обеспечьте обратную связь и визуальные эффекты для пользователя.

Кнопки это важная часть любого приложения. Не стоит пренебрегать тем, чтобы они были удобными и интуитивно понятными. Для разработки полноценного приложения необходимо также уметь управлять состоянием, обеспечивать навигацию и работать с API. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Sozdanie-interaktivnyh-knopok-v-React-Native) вы найдете все необходимые знания для создания профессиональных React Native приложений. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме

#### Как запрограммировать двойное нажатие (double tap) на кнопке в React Native?

Для реализации двойного нажатия рекомендуют использовать таймер и счетчик:

```jsx
const [lastPress, setLastPress] = useState(0);
const handlePress = () => {
  const time = new Date().getTime();
  if (time - lastPress < 300) {
    // Двойное нажатие
    doDoubleTapAction();
  }
  setLastPress(time);
};
```
Вставьте обработчик в onPress кнопки.

#### Как сделать анимированный градиентный фон у кнопки?

Используйте библиотеку [react-native-linear-gradient](https://github.com/react-native-linear-gradient):

```jsx
import LinearGradient from 'react-native-linear-gradient';

<LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.button}>
  <Text style={styles.buttonText}>Градиент!</Text>
</LinearGradient>
```
Встроить в TouchableOpacity, чтобы был отклик на нажатие.

#### Как добавить кнопку с уникальной формой (например, круглую)?

Используйте `borderRadius` равный половине ширины/высоты:

```jsx
<View style={{
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#009688',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  <Text style={{ color: '#fff' }}>OK</Text>
</View>
```

#### Почему onPress срабатывает с задержкой на Android?

Иногда TouchableNativeFeedback или тяжелые анимации тормозят отклик. Проверьте оптимизацию кода, используйте Pressable или разбирайте тяжелые операции из onPress в отдельные функции с асинхронным вызовом (setTimeout/Promise).

#### Как обработать клавишу "Enter" как нажатие кнопки?

Для текстовых полей используйте prop `onSubmitEditing` у TextInput и вызывайте функцию:

```jsx
<TextInput
  onSubmitEditing={handleButtonAction}
/>
```
Это позволит пользователю отправить форму клавишей Enter, имитируя нажатие кнопки.
