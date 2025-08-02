---
metaTitle: Создание и использование tabs в React Native
metaDescription: Практическое руководство по добавлению вкладок tabs в React Native - от выбора библиотеки до кастомизации и навигации
author: Олег Марков
title: Создание и использование tabs в React Native
preview: Освойте работу с tabs во вложенных и полноэкранных интерфейсах React Native - обзор лучших библиотек, примеры кода, советы по кастомизации и интеграции с навигацией
---

## Введение

Вкладки (tabs) — привычный элемент интерфейса, который помогает организовать навигацию между различными разделами приложения. Реализация вкладок позволяет структурировать контент, упростить доступ к ключевым экранам и повысить удобство использования вашего мобильного приложения. В React Native создание tabs может быть реализовано разными способами — от использования стандартных компонентов до интеграции сторонних библиотек для полноценной таб-навигации, поддерживающей анимацию и жесты.

В этой статье покажу вам, как создавать и настраивать вкладки в React Native, рассмотрим лучшие библиотеки для реализации этого функционала, а также разберем примеры кода с комментариями. Поговорим о плюсах и минусах разных подходов, затронем вопросы кастомизации внешнего вида вкладок и рассмотрим, как tabs интегрируются с навигацией в мобильных приложениях на React Native.

## Краткий обзор способов создания tabs в React Native

Прежде чем погружаться в детали, давайте опишу основные стратегии:

- **Стандартные компоненты и ручная организация вкладок** — когда вы сами отображаете нужный компонент в зависимости от выбранной вкладки.
- **Сторонние библиотеки** — такие как `react-navigation` (и его подбиблиотека `@react-navigation/bottom-tabs`), а также популярная библиотека `react-native-tab-view`.
- **Кастомные реализации** — когда вы пишете полностью свой компонент вкладок, если нужно специальное поведение или дизайн.

Чаще всего используются готовые библиотеки, чтобы получить красивый и удобный функционал с минимальными усилиями.

Давайте начнем с простейшей ручной реализации.

## Пример собственной реализации tabs на React Native

Смотрите, я покажу вам, как реализовать простейшие вкладки своими руками, без сторонних зависимостей. Это полезно, если вам нужно что-то очень легкое или минимальное.

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MyTabs = () => {
  const [activeTab, setActiveTab] = useState(0); // Храним индекс активной вкладки

  return (
    <View style={styles.container}>
      {/* Здесь размещаем кнопки вкладок */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 0 && styles.activeTab]} onPress={() => setActiveTab(0)}>
          <Text style={activeTab === 0 ? styles.activeText : styles.tabText}>Вкладка 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 1 && styles.activeTab]} onPress={() => setActiveTab(1)}>
          <Text style={activeTab === 1 ? styles.activeText : styles.tabText}>Вкладка 2</Text>
        </TouchableOpacity>
      </View>
      {/* Контент выбранной вкладки */}
      <View style={styles.tabContent}>
        {activeTab === 0 ? (
          <Text>Контент первой вкладки</Text>
        ) : (
          <Text>Контент второй вкладки</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40 },
  tabBar: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  tabButton: { padding: 10, backgroundColor: '#eee', margin: 2, borderRadius: 6 },
  activeTab: { backgroundColor: '#2196f3' }, // Активная вкладка выделена цветом
  tabText: { color: '#333' },
  activeText: { color: '#fff' },
  tabContent: { alignItems: 'center', justifyContent: 'center', flex: 1 }
});

export default MyTabs;
```

Давайте разберёмся:
- С помощью состояния (`activeTab`) определяем, какая вкладка активна.
- Используем `TouchableOpacity` для имитации кнопок вкладок.
- Стилизуем активную вкладку отдельно.
- Показываем нужный контент на основе выбранного индекса.

Такой подход хорош для очень простых случаев, но у него есть ограничения: отсутствуют анимации, свайпы, плохая масштабируемость и кастомизация.

Теперь давайте рассмотрим популярные библиотеки, которые дают гораздо больше возможностей.

## Использование react-navigation с Bottom Tabs

Самое распространённое решение — навигация с помощью библиотеки `react-navigation`. Она давно стала стандартом для мобильных приложений на React Native и включает удобные API для создания вкладок.

### Установка зависимостей

Вам потребуется:
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- Плюс несколько зависимостей, необходимых для работы самой навигации.

Давайте начнем:

```sh
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

Для Expo этого обычно достаточно. Для bare React Native внимательно следите за документацией и настройте `react-native-reanimated`, если необходимо.

### Создание вкладок с помощью createBottomTabNavigator

Смотрите, я покажу вам пример кода для реализации нижней панели вкладок (Bottom Tabs):

```jsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen'; // Ваши компоненты-экраны
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Главная" component={HomeScreen} />
        <Tab.Screen name="Настройки" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Здесь:
- `Tab.Navigator` описывает панель вкладок.
- `Tab.Screen` регистрирует каждый экран, который будет на своей вкладке.

### Кастомизация внешнего вида вкладок

Вы легко можете настроить иконки, цвета, шрифты вкладок:

```jsx
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      // Покажу пример с react-native-vector-icons
      let iconName;
      if (route.name === 'Главная') {
        iconName = focused ? 'home' : 'home-outline';
      } else if (route.name === 'Настройки') {
        iconName = focused ? 'settings' : 'settings-outline';
      }
      // Возвращаем компонент иконки (зависит от выбранной библиотеки иконок)
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#2196f3',
    tabBarInactiveTintColor: 'gray',
    tabBarStyle: { backgroundColor: '#f5f5f5', paddingBottom: 4 },
    // Дополнительные параметры
  })}
>
  {/* ... экраны */}
</Tab.Navigator>
```

Комментарии к этому примеру:
- В функции `tabBarIcon` можно подставлять любые компоненты, иконки и менять стиль иконок в зависимости от фокуса.
- `tabBarActiveTintColor` и `tabBarInactiveTintColor` управляют цветами текста/иконок.
- Не забывайте импортировать и использовать выбранную библиотеку иконок, например, Ionicons.

### Верхние вкладки (Material Top Tabs)

Вам может понадобиться верхняя панель вкладок. Для этого в экосистеме `react-navigation` существует пакет `@react-navigation/material-top-tabs`, основанный на реализации TabView от React Native Community.

#### Установка

```sh
npm install @react-navigation/material-top-tabs react-native-tab-view
```

#### Пример

```jsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
const TopTab = createMaterialTopTabNavigator();

export default function TopTabs() {
  return (
    <NavigationContainer>
      <TopTab.Navigator>
        <TopTab.Screen name="Feed" component={FeedScreen} />
        <TopTab.Screen name="Messages" component={MessagesScreen} />
      </TopTab.Navigator>
    </NavigationContainer>
  );
}
```

Дополнительные опции для стилизации верхней панели:
- `tabBarIndicatorStyle` — кастомизация линии под активной вкладкой
- `tabBarLabelStyle`, `tabBarStyle` и другие — для стиля текста вкладок и общей панели

### Вложенные вкладки и интеграция с StackNavigator

Часто вкладки — только часть вашей архитектуры. Например, одна вкладка может быть Stack Navigator'ом.

```jsx
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Главная" component={HomeStack} />
        <Tab.Screen name="Настройки" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Обратите внимание, как удобно можно комбинировать разные типы навигации, если вы используете библиотеки `react-navigation`.

## Использование react-native-tab-view для гибких интерфейсов

Если вы хотите реализовать своеобразные вкладки внутри одного экрана (например, свайп между вкладками без изменения навигационного маршрута), вам пригодится библиотека `react-native-tab-view`.

### Установка

```sh
npm install react-native-tab-view
```

### Базовый пример использования

```jsx
import * as React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const FirstRoute = () => (
  <View style={[styles.scene, { backgroundColor: '#ff4081' }]}>
    <Text>Первая вкладка</Text>
  </View>
);

const SecondRoute = () => (
  <View style={[styles.scene, { backgroundColor: '#673ab7' }]}>
    <Text>Вторая вкладка</Text>
  </View>
);

export default function TabViewExample() {
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Вкладка 1' },
    { key: 'second', title: 'Вкладка 2' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={SceneMap({
        first: FirstRoute,
        second: SecondRoute,
      })}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'white' }}
          style={{ backgroundColor: '#2196f3' }}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Вот как это работает:
- Вы задаёте список маршрутов (routes) и способ отрисовки каждой вкладки (`renderScene`).
- С помощью `TabBar` можно полностью кастомизировать вид панели вкладок.
- Свайпы между вкладками реализованы из коробки — удобно для UI, похожего на Instagram или Tinder.

Часто компонент `react-native-tab-view` применяют в интерфейсах с «Tab внутри экрана», а не для глобальной навигации между экранами.

### Гибкая настройка и кастомизация

Покажу, как, например, изменить цвета индикатора и шрифт подписи:

```jsx
renderTabBar={props => (
  <TabBar
    {...props}
    indicatorStyle={{ backgroundColor: '#ff5722', height: 4 }}
    style={{ backgroundColor: '#263238' }}
    labelStyle={{ color: '#fff', fontSize: 16 }}
    tabStyle={{ width: 120 }}
    scrollEnabled // позволяет вкладкам прокручиваться, если их много
  />
)}
```

Вы можете заменить панель вкладок на полностью свою, если передадите собственную функцию в пропс `renderTabBar`. Это позволяет даже добавить нестандартные элементы вроде кнопки "+" рядом с вкладками.

## Советы по проектированию и кастомизации tabs

### Когда использовать Bottom Tabs, а когда TabView?

- **Bottom tabs (`react-navigation/bottom-tabs`)** — идеально для основной навигации между крупными разделами приложения (пример — Instagram: Домой, Поиск, Добавить, Уведомления, Профиль).
- **Top tabs или TabView** — удобно для организации контента внутри конкретного раздела (например, подкатегории в разделе магазина: Новинки, Лидер продаж, Скидки).

### Советы по комбинации навигаций

React Navigation позволяет комбинировать Stack, Tabs и Drawer навигации. Не бойтесь вкладывать их друг в друга для удобной архитектуры. Главное — подумайте, какая навигация должна быть основной (обычно это Tabs или Drawer) и разбейте логику приложения на "разделы".

### Как сделать кастомный TabBar

Иногда стандартного вида вкладок может быть недостаточно. В `react-navigation` вы можете использовать свой компонент панели вкладок:

```jsx
<Tab.Navigator tabBar={props => <MyCustomTabBar {...props} />} />
```

Внутри собственной функции вы получите информацию о текущих вкладках, активной вкладке и сможете реализовать абсолютно уникальный дизайн.

## Проблемы и типичные ошибки при работе с tabs

### Проблема с анимацией переходов

Обычно анимация работает “из коробки”, но если возникают подвисания или мерцания, попробуйте:
- Использовать внешний компонент `react-native-reanimated`
- Проверить, что компоненты внутри вкладок не блокируют поток выполнения

### Проблема с сохранением состояния вкладок

Если пользователь переключает вкладку, а состояние сбрасывается — используйте опцию `unmountOnBlur: false` (для react-navigation). Это поможет сохранить стейт компонента, когда он неактивен.

```jsx
<Tab.Screen
  name="User"
  component={UserScreen}
  options={{ unmountOnBlur: false }}
/>
```

### Не отображаются иконки

Часто забывают подключить библиотеку иконок вроде `react-native-vector-icons`. Убедитесь, что вы установили пакет и импортировали конкретный набор иконок.

### Не работает свайп между вкладками

Для верхних вкладок и реализации на `react-native-tab-view` свайпы есть всегда. В `bottom-tabs` этот функционал специально отсутствует — так устроен Material Design.

## Заключение

Tabs — мощный инструмент для организации навигации и разделения контента в приложениях. В React Native у вас есть как простые нативные способы реализации, так и гибкие, более сложные через сторонние библиотеки вроде `react-navigation` и `react-native-tab-view`. Выбор подхода зависит от архитектуры приложения и требований к пользовательскому интерфейсу.

Используйте ручную реализацию только для очень простых или уникальных случаев. Во всех остальных случаях стоит обращаться к готовым стабильным решениям, которые покрывают большинство задач.

Тестируйте навигацию на разных устройствах, чтобы убедиться, что интерфейс tabs работает плавно и дружелюбно для ваших пользователей. Пишите код так, чтобы вы легко могли расширять и модифицировать tabs в будущем.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### 1. Как сделать скрытие панели вкладок на одном из экранов?

Добавьте в опции экрана параметр:

```jsx
<Tab.Screen
  name="HideMe"
  component={MyComponent}
  options={{ tabBarStyle: { display: 'none' } }}
/>
```
Это скроет вкладки, когда активирован экран.

---

### 2. Как добавить бейджи или счетчики на вкладки?

Передайте параметр `tabBarBadge`:

```jsx
<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{ tabBarBadge: 3 }} // Показывает бейдж с числом 3
/>
```
Для кастомных бейджей настройте свой `tabBarIcon`.

---

### 3. Как реагировать на нажатие вкладки (например, прокручивать до верха списка)?

Используйте собственный обработчик через слушатель события в навигаторе:

```jsx
useEffect(() => {
  const unsubscribe = navigation.addListener('tabPress', e => {
    // Например, листаем FlatList вверх
    flatListRef.current.scrollToOffset({ offset: 0 });
  });
  return unsubscribe;
}, [navigation]);
```

---

### 4. Почему вложенные вкладки не обновляются при переключении родительского Stack Navigator?

Проверьте, не используете ли вы `unmountOnBlur`. Если да, установите параметр в `false` или сохраняйте состояние самостоятельно через глобальный стейт.

---

### 5. Как реализовать динамический список вкладок (например, добавлять/убирать вкладки во время работы приложения)?

Вместо жестко заданного массива экраны вкладок храните список экранов во внешнем массиве (например, в состоянии Redux или Context) и рендерьте экраны через `.map()` или динамический список. Например, в TabView можно обновлять `routes` динамически.

---