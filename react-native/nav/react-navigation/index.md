---
metaTitle: Навигация в React Native с react-navigation — полное руководство
metaDescription: Полное руководство по react-navigation в React Native — Stack Navigator, Tab Navigator, Drawer Navigator, передача параметров, вложенная навигация, кастомизация заголовков и примеры кода
author: Олег Марков
title: Навигация в React Native (react-navigation)
preview: Разбираем react-navigation во всех деталях — устанавливаем и настраиваем, работаем со Stack, Tab и Drawer навигаторами, передаём параметры между экранами, создаём вложенную навигацию и кастомизируем заголовки
---

## Введение

Навигация — один из ключевых аспектов любого мобильного приложения. В React Native нет встроенного решения для маршрутизации, поэтому большинство разработчиков используют библиотеку **react-navigation** — самое популярное, хорошо поддерживаемое и гибкое решение для навигации в экосистеме React Native.

React Navigation предоставляет набор навигаторов, которые имитируют привычные паттерны мобильного UX: стековые переходы (Stack), нижние вкладки (Tabs), боковое меню (Drawer) и многое другое. Благодаря хорошей документации, TypeScript-поддержке и активному сообществу, библиотека давно стала стандартом де-факто.

В этой статье мы разберём react-navigation с нуля: установку, базовую настройку, все основные типы навигаторов, передачу параметров, вложенную навигацию и кастомизацию. После прочтения вы будете уверенно применять react-navigation в реальных проектах.

Навигация — это только начало. Для глубокого погружения в React Native разработку с современными инструментами, включая Expo Router, приходите на курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=react-navigation). На курсе 184 урока и 11 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Установка и настройка

### Базовые пакеты

Начнём с установки основного пакета `@react-navigation/native`, который является ядром библиотеки:

```bash
npm install @react-navigation/native
```

React Navigation требует ряд дополнительных нативных зависимостей. Для управляемого Expo-проекта используйте:

```bash
npx expo install react-native-screens react-native-safe-area-context
```

Для чистого React Native проекта:

```bash
npm install react-native-screens react-native-safe-area-context
# Для iOS потребуется дополнительно
npx pod-install
```

### Установка навигаторов

Устанавливайте только те навигаторы, которые нужны в вашем проекте:

```bash
# Stack Navigator (стековая навигация)
npm install @react-navigation/native-stack

# Bottom Tabs Navigator (нижние вкладки)
npm install @react-navigation/bottom-tabs

# Drawer Navigator (боковое меню)
npm install @react-navigation/drawer

# Дополнительные зависимости для Drawer
npm install react-native-gesture-handler react-native-reanimated
```

### Настройка NavigationContainer

`NavigationContainer` — это обёртка верхнего уровня, которую нужно разместить в корне приложения. Она управляет деревом навигации и отслеживает текущее состояние маршрутизации:

```tsx
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <NavigationContainer>
      {/* Навигаторы и экраны размещаются здесь */}
    </NavigationContainer>
  );
}
```

Для Drawer Navigator потребуется обернуть приложение в `GestureHandlerRootView`:

```tsx
// App.tsx с Drawer
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {/* Ваши навигаторы */}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

## Stack Navigator

Stack Navigator реализует паттерн стека — каждый новый экран "кладётся" поверх предыдущего. Пользователь может вернуться назад, нажав кнопку "назад" или выполнив свайп. Этот навигатор подходит для большинства линейных переходов в приложении.

### Создание Stack Navigator

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Создаём экземпляр стека
const Stack = createNativeStackNavigator();

// Экран "Главная"
function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Главная страница</Text>
      <Button
        title="Перейти к деталям"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

// Экран "Детали"
function DetailsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Экран деталей</Text>
      <Button
        title="Назад"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

// Корневой компонент приложения
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
```

`initialRouteName` определяет, какой экран отображается первым. Если не указан, будет показан первый экран в списке.

### Методы навигации в стеке

Объект `navigation`, который автоматически передаётся в каждый экран, содержит несколько ключевых методов:

```tsx
// navigate — переход к экрану. Если экран уже в стеке — возвращается к нему
navigation.navigate('ScreenName');

// push — всегда добавляет новый экран в стек, даже если такой уже есть
navigation.push('ScreenName');

// goBack — возврат к предыдущему экрану
navigation.goBack();

// popToTop — возврат к первому экрану в стеке
navigation.popToTop();

// replace — заменяет текущий экран новым (без возможности вернуться)
navigation.replace('ScreenName');

// reset — полностью сбрасывает стек навигации
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});
```

### TypeScript типизация для Stack Navigator

Для строгой типизации создайте тип параметров маршрутов:

```tsx
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Описываем все экраны и их параметры
type RootStackParamList = {
  Home: undefined; // экран без параметров
  Details: { productId: number; title: string }; // экран с параметрами
  Profile: { userId: string };
};

// Типы для navigation и route
type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

function HomeScreen({
  navigation,
}: {
  navigation: HomeScreenNavigationProp;
}) {
  return (
    <Button
      title="К деталям товара"
      onPress={() =>
        navigation.navigate('Details', {
          productId: 42,
          title: 'Смартфон XYZ',
        })
      }
    />
  );
}

function DetailsScreen({ route }: { route: DetailsScreenRouteProp }) {
  // TypeScript знает, что productId это number, а title — string
  const { productId, title } = route.params;

  return <Text>{title} (ID: {productId})</Text>;
}
```

## Tab Navigator

Tab Navigator (нижние вкладки) отображает несколько экранов в виде горизонтальных вкладок в нижней части экрана. Каждая вкладка — независимый раздел приложения. Этот паттерн широко используется в Instagram, Twitter, Telegram и большинстве популярных приложений.

### Создание Tab Navigator

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Главная</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text>Поиск</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Профиль</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

### Кастомизация вкладок с иконками

Для добавления иконок установите библиотеку иконок:

```bash
npm install @expo/vector-icons
# или
npm install react-native-vector-icons
```

Затем настройте иконки через `screenOptions`:

```tsx
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          // Цвета активной и неактивной вкладки
          tabBarActiveTintColor: '#6200EE',
          tabBarInactiveTintColor: '#999',
          // Стиль нижней панели вкладок
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 60,
            paddingBottom: 8,
          },
          // Стиль заголовка
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### Бейдж на иконке вкладки

Часто нужно показать счётчик уведомлений на иконке вкладки:

```tsx
<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{
    tabBarBadge: 3, // Число или строка на иконке
    title: 'Уведомления',
  }}
/>
```

## Drawer Navigator

Drawer Navigator создаёт боковое выдвижное меню, которое открывается свайпом от края экрана или нажатием на кнопку-гамбургер. Подходит для приложений с большим количеством разделов или для дополнительных настроек.

### Создание Drawer Navigator

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Главная</Text>
      {/* Кнопка для открытия drawer */}
      <Button
        title="Открыть меню"
        onPress={() => navigation.openDrawer()}
      />
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>О приложении</Text>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="Home">
          <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
          <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
          <Drawer.Screen name="About" component={AboutScreen} options={{ title: 'О приложении' }} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
});
```

### Управление Drawer программно

```tsx
// Открыть drawer
navigation.openDrawer();

// Закрыть drawer
navigation.closeDrawer();

// Переключить состояние drawer
navigation.toggleDrawer();
```

### Кастомный контент Drawer

Можно полностью переопределить содержимое бокового меню:

```tsx
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Шапка с аватаром и именем пользователя */}
      <View style={{ padding: 20, backgroundColor: '#6200EE' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          Иван Иванов
        </Text>
        <Text style={{ color: '#ddd' }}>ivan@example.com</Text>
      </View>

      {/* Стандартные пункты меню */}
      <DrawerItemList {...props} />

      {/* Кастомный пункт меню */}
      <DrawerItem
        label="Выйти"
        onPress={() => console.log('Выход из аккаунта')}
        style={{ borderTopWidth: 1, borderTopColor: '#eee', marginTop: 'auto' }}
      />
    </DrawerContentScrollView>
  );
}

// Используем кастомный контент в навигаторе
<Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
  {/* Экраны */}
</Drawer.Navigator>
```

## Передача параметров между экранами

Передача данных между экранами — одна из базовых задач при работе с навигацией. React Navigation предоставляет простой механизм через `route.params`.

### Передача параметров при переходе

```tsx
// Передаём параметры при вызове navigate
navigation.navigate('ProductDetails', {
  productId: 123,
  productName: 'Ноутбук Lenovo',
  price: 89999,
});
```

### Получение параметров на экране

```tsx
function ProductDetailsScreen({ route }: any) {
  // Извлекаем параметры из route.params
  const { productId, productName, price } = route.params;

  return (
    <View>
      <Text>Товар: {productName}</Text>
      <Text>ID: {productId}</Text>
      <Text>Цена: {price} ₽</Text>
    </View>
  );
}
```

### Параметры по умолчанию

Если параметры могут быть необязательными, задайте значения по умолчанию:

```tsx
<Stack.Screen
  name="ProductDetails"
  component={ProductDetailsScreen}
  initialParams={{ price: 0 }} // Значение по умолчанию
/>
```

### Обновление параметров экрана

Иногда нужно обновить параметры текущего экрана без перехода:

```tsx
// Обновить параметры текущего экрана
navigation.setParams({ price: 79999 });
```

### Передача callback между экранами

Распространённый паттерн — передать функцию обратного вызова дочернему экрану:

```tsx
// Родительский экран
function ParentScreen({ navigation }: any) {
  const [selectedValue, setSelectedValue] = React.useState('');

  function handleSelectValue(value: string) {
    setSelectedValue(value);
  }

  return (
    <View>
      <Text>Выбранное значение: {selectedValue}</Text>
      <Button
        title="Выбрать"
        onPress={() =>
          navigation.navigate('SelectScreen', {
            onSelect: handleSelectValue,
          })
        }
      />
    </View>
  );
}

// Дочерний экран выбора
function SelectScreen({ route, navigation }: any) {
  const { onSelect } = route.params;

  return (
    <View>
      {['Вариант 1', 'Вариант 2', 'Вариант 3'].map((item) => (
        <Button
          key={item}
          title={item}
          onPress={() => {
            onSelect(item); // Вызываем переданный callback
            navigation.goBack(); // Возвращаемся назад
          }}
        />
      ))}
    </View>
  );
}
```

## Вложенная навигация

В реальных приложениях навигаторы редко используются по отдельности — чаще всего они вкладываются друг в друга. Например, каждая вкладка нижнего меню может иметь собственный стек экранов.

### Stack внутри Tab Navigator

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Стек для вкладки "Главная"
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Главная' }} />
      <Stack.Screen name="HomeDetails" component={DetailsScreen} options={{ title: 'Детали' }} />
      <Stack.Screen name="HomeProfile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Stack.Navigator>
  );
}

// Стек для вкладки "Каталог"
function CatalogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CatalogMain" component={CatalogScreen} options={{ title: 'Каталог' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Товар' }} />
    </Stack.Navigator>
  );
}

// Основной навигатор с вкладками
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Главная' }} />
        <Tab.Screen name="Catalog" component={CatalogStack} options={{ title: 'Каталог' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Обратите внимание на `headerShown: false` в Tab.Navigator — это скрывает заголовок вкладки, так как каждый вложенный Stack имеет собственные заголовки.

### Навигация между вложенными экранами

При вложенной навигации для перехода к экрану внутри другого навигатора используйте вложенный синтаксис:

```tsx
// Переход к экрану ProductDetails внутри вкладки Catalog
navigation.navigate('Catalog', {
  screen: 'ProductDetails',
  params: { productId: 42 },
});
```

### Drawer с Tab Navigator внутри

```tsx
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator>
          {/* Вкладки как один из пунктов drawer */}
          <Drawer.Screen name="Main" component={TabNavigator} options={{ title: 'Главная' }} />
          <Drawer.Screen name="About" component={AboutScreen} options={{ title: 'О нас' }} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

## Кастомизация заголовков и вкладок

### Кастомизация заголовков Stack Navigator

Заголовок экрана настраивается через `options` на уровне экрана или глобально через `screenOptions`:

```tsx
<Stack.Navigator
  screenOptions={{
    // Глобальные настройки для всех экранов
    headerStyle: {
      backgroundColor: '#6200EE',
    },
    headerTintColor: '#fff', // Цвет текста и кнопки "назад"
    headerTitleStyle: {
      fontWeight: 'bold',
      fontSize: 18,
    },
    headerBackTitle: 'Назад', // Текст кнопки "назад" (только iOS)
  }}
>
  <Stack.Screen
    name="Home"
    component={HomeScreen}
    options={{
      title: 'Главная страница', // Заголовок конкретного экрана
      headerRight: () => (
        // Кнопка в правой части заголовка
        <Button title="Информация" onPress={() => alert('Информация')} />
      ),
    }}
  />
</Stack.Navigator>
```

### Динамический заголовок

Заголовок можно менять программно на основе данных экрана:

```tsx
function ProductScreen({ navigation, route }: any) {
  const { productName } = route.params;

  // Обновляем заголовок после монтирования
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: productName,
      headerRight: () => (
        <Button
          title="Поделиться"
          onPress={() => console.log('Поделиться:', productName)}
        />
      ),
    });
  }, [navigation, productName]);

  return <View><Text>{productName}</Text></View>;
}
```

### Кастомный компонент заголовка

Можно полностью заменить стандартный заголовок своим компонентом:

```tsx
function CustomHeader({ title }: { title: string }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingHorizontal: 16,
      backgroundColor: '#6200EE',
    }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
        {title}
      </Text>
    </View>
  );
}

<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    header: () => <CustomHeader title="Мой заголовок" />,
  }}
/>
```

### Скрытие заголовка

```tsx
// Скрыть заголовок для конкретного экрана
<Stack.Screen
  name="Login"
  component={LoginScreen}
  options={{ headerShown: false }}
/>

// Скрыть заголовки для всех экранов в навигаторе
<Stack.Navigator screenOptions={{ headerShown: false }}>
```

### Кастомизация Tab Navigator

```tsx
<Tab.Navigator
  screenOptions={({ route }) => ({
    // Скрыть заголовки (обычно используют заголовки из Stack внутри Tab)
    headerShown: false,
    // Стиль нижней панели
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopColor: '#eee',
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 10,
      paddingTop: 6,
    },
    // Активный и неактивный цвет
    tabBarActiveTintColor: '#6200EE',
    tabBarInactiveTintColor: '#9e9e9e',
    // Шрифт лейбла
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600',
    },
    // Иконки
    tabBarIcon: ({ focused, color, size }) => {
      const icons: Record<string, string> = {
        Home: focused ? '🏠' : '🏡',
        Search: focused ? '🔍' : '🔎',
        Profile: focused ? '👤' : '👥',
      };
      return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
    },
  })}
>
  <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
  <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
  <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
</Tab.Navigator>
```

### Кастомная нижняя панель вкладок

Для полного контроля над внешним видом Tab Bar создайте свой компонент:

```tsx
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={tabBarStyles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tabBarStyles.tab}
          >
            <Text style={[tabBarStyles.label, isFocused && tabBarStyles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: { fontSize: 12, color: '#999' },
  labelActive: { color: '#6200EE', fontWeight: 'bold' },
});

// Применение кастомного Tab Bar
<Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
```

## Хуки навигации

React Navigation предоставляет хуки для удобного доступа к объектам навигации в любом компоненте дерева:

```tsx
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';

// useNavigation — получить объект navigation из любого компонента
function SomeComponent() {
  const navigation = useNavigation();

  return (
    <Button
      title="К профилю"
      onPress={() => navigation.navigate('Profile')}
    />
  );
}

// useRoute — получить объект route с параметрами
function AnotherComponent() {
  const route = useRoute();
  console.log(route.params); // Параметры текущего экрана
  return null;
}

// useFocusEffect — выполнить действие при фокусировке на экране
function FocusAwareScreen() {
  useFocusEffect(
    React.useCallback(() => {
      // Код выполняется при каждом появлении экрана
      console.log('Экран появился');

      return () => {
        // Cleanup при уходе с экрана
        console.log('Экран скрыт');
      };
    }, [])
  );

  return <View />;
}

// useIsFocused — проверить, виден ли текущий экран
function ConditionalComponent() {
  const isFocused = useIsFocused();

  return isFocused ? <Text>Экран активен</Text> : null;
}
```

## Практический пример: полное приложение

Давайте соберём полноценное приложение с Tab Navigator, несколькими Stack Navigator внутри вкладок и Drawer Navigator:

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Типы параметров
type HomeStackParamList = {
  HomeMain: undefined;
  ProductDetails: { productId: number; name: string };
};

type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const Drawer = createDrawerNavigator();

// Экраны
function HomeMainScreen({ navigation }: any) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Главная</Text>
      <Button
        title="Открыть товар"
        onPress={() =>
          navigation.navigate('ProductDetails', {
            productId: 1,
            name: 'Смартфон Pro',
          })
        }
      />
    </View>
  );
}

function ProductDetailsScreen({ route, navigation }: any) {
  const { productId, name } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{name}</Text>
      <Text>ID товара: {productId}</Text>
      <Button title="Назад" onPress={() => navigation.goBack()} />
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Поиск</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Профиль</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Настройки</Text>
    </View>
  );
}

// Стек для вкладки "Главная"
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeMainScreen}
        options={{ title: 'Главная' }}
      />
      <HomeStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        // Заголовок установим программно через setOptions
      />
    </HomeStack.Navigator>
  );
}

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Главная' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: 'Поиск' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

// Корневой Drawer Navigator
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator>
          <Drawer.Screen
            name="MainApp"
            component={TabNavigator}
            options={{ title: 'Приложение', headerShown: false }}
          />
          <Drawer.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Настройки' }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

## Заключение

React Navigation — мощная и гибкая библиотека, которая закрывает все потребности в навигации для React Native приложений. Мы рассмотрели:

- **Установку и настройку** — подключение NavigationContainer и нужных навигаторов
- **Stack Navigator** — линейные переходы между экранами с историей
- **Tab Navigator** — нижние вкладки для основных разделов приложения
- **Drawer Navigator** — боковое выдвижное меню для дополнительных разделов
- **Передачу параметров** — передача данных между экранами через `route.params`
- **Вложенную навигацию** — комбинирование навигаторов для сложных структур
- **Кастомизацию** — полный контроль над внешним видом заголовков и вкладок

Начните с простого Stack Navigator, постепенно добавляйте новые навигаторы по мере роста приложения. Следите за документацией react-navigation — библиотека активно развивается и регулярно получает новые возможности.

Для создания полноценных React Native приложений с грамотной навигацией и архитектурой приходите на курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=react-navigation). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Часто задаваемые вопросы

### Как передать параметры в начальный экран Navigator?

Используйте `initialParams` в `Stack.Screen`:

```tsx
<Stack.Screen
  name="Home"
  component={HomeScreen}
  initialParams={{ userId: 'guest', isAdmin: false }}
/>
```

### Как перейти к экрану в другом Tab из текущего стека?

Используйте вложенный синтаксис navigate:

```tsx
// Из HomeTab перейти к SearchTab и сразу к экрану внутри него
navigation.navigate('SearchTab', {
  screen: 'SearchResults',
  params: { query: 'телефон' },
});
```

### Как показать модальный экран поверх текущего?

Настройте `presentation: 'modal'` в screenOptions:

```tsx
<Stack.Navigator>
  <Stack.Screen name="Main" component={MainScreen} />
  <Stack.Screen
    name="Modal"
    component={ModalScreen}
    options={{ presentation: 'modal' }}
  />
</Stack.Navigator>
```

### Как сбросить навигацию при выходе из аккаунта?

Используйте `navigation.reset` для полного сброса стека:

```tsx
function handleLogout() {
  // Очистка токена...

  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }], // Единственный экран в новом стеке
  });
}
```

### Как добавить анимацию перехода между экранами?

Настройте `animation` в `screenOptions` Stack Navigator:

```tsx
<Stack.Navigator
  screenOptions={{
    animation: 'slide_from_right', // По умолчанию
    // Другие варианты: 'fade', 'flip', 'simple_push', 'none'
    // Для полного контроля используйте transitionSpec и cardStyleInterpolator
  }}
>
```

### Как отслеживать переходы между экранами для аналитики?

Используйте колбэк `onStateChange` в NavigationContainer:

```tsx
<NavigationContainer
  onStateChange={(state) => {
    const currentRoute = state?.routes[state.index];
    console.log('Текущий экран:', currentRoute?.name);
    // analytics.trackScreen(currentRoute?.name);
  }}
>
```
