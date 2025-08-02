---
metaTitle: Руководство по navigation в React Native
metaDescription: Обзор основных подходов и компонентов для навигации в React Native - изучите библиотеки, стек- и таб-навигацию, глубокие ссылки и другие возможности
author: Олег Марков
title: Руководство по navigation в React Native
preview: Разберитесь в навигации в React Native - как организовать переходы между экранами, правильно использовать stack, tab и другие типы навигации, а также работать с параметрами и deep linking
---

## Введение

Навигация — одна из важнейших составляющих любого мобильного приложения. В React Native навигация позволяет пользователю перемещаться между различными экранами или разделами интерфейса, обеспечивая удобство использования и структурную целостность приложения. В данном руководстве мы рассмотрим основные способы реализации навигации в React Native, познакомимся с популярными библиотеками, типами навигации, а также разберем примеры кода с полезными пояснениями.

Независимо от размера приложения, грамотная организация переходов между экранами позволит поддерживать код в чистоте, избегать сложных переходов и повышает отзывчивость интерфейса. Давайте шаг за шагом разберемся, как внедрять навигацию в ваши проекты на React Native.

## Почему навигация в React Native — это не просто?

В веб-разработке переходы зачастую реализуются с помощью маршрутизации браузера, но в мобильных приложениях требуется имитировать привычные мобильные паттерны: стековые (stack) переходы, табы (tabs), модальные окна и даже вложенную навигацию. Важно правильно подобрать инструмент для решения ваших задач.

Навигация является ключевым элементом любого мобильного приложения. В React Native существует несколько способов организации навигации, и выбор правильного подхода зависит от сложности приложения и требований к пользовательскому интерфейсу. Чтобы создавать удобные и интуитивно понятные интерфейсы, важно понимать особенности различных библиотек навигации и уметь их настраивать. Если вы хотите детальнее погрузиться в мир React Native навигации и научиться создавать сложные переходы между экранами — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rukovodstvo-po-navigation-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Основные подходы и библиотека React Navigation

React Native не поставляется с навигационными решениями "из коробки". Самой популярной и функциональной библиотекой для навигации в современных приложениях является [React Navigation](https://reactnavigation.org/). Она предоставляет всё необходимое для организации переходов между экранами: стековую, табовую, drawer-навигацию, глубокие ссылки, параметры и многое другое.

Есть и альтернативные решения (например, React Native Navigation от Wix или native-stack от React Navigation), но именно React Navigation считается золотым стандартом из-за простого API, поддержки TypeScript и активного сообщества.

## Установка React Navigation и основные зависимости

Перед началом работы необходимо установить основные пакеты. Для базовой стек-навигации потребуется несколько зависимостей. Если у вас еще нет проекта, сначала создайте его с помощью:

```bash
npx react-native init MyNavigationApp
```

Теперь установим навигацию:

```bash
npm install @react-navigation/native
```

React Navigation требует нескольких дополнительных зависимостей для работы на iOS и Android. Установите их:

```bash
npm install react-native-screens react-native-safe-area-context
```

Для использования stack-навигации:

```bash
npm install @react-navigation/native-stack
```

Если вы хотите использовать табы:

```bash
npm install @react-navigation/bottom-tabs
```

Если нужен drawer (выдвижное меню):

```bash
npm install @react-navigation/drawer
```

Далее установите и свяжите необходимые библиотеки для нативных зависимостей (обычно на Android/iOS):

```bash
npx pod-install
```
(На Android pod-install не потребуется, только для iOS.)

## Создание первой навигации

Давайте разберём минимальный рабочий пример стек-навигации между двумя экранами.

### Импорт и настройка навигатора

```javascript
// Импорт необходимых компонентов
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native'; // Контейнер для навигации
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Создаём стек

// Создание объекта стека
const Stack = createNativeStackNavigator();

// Объявляем экраны
function HomeScreen({ navigation }) {
  return (
    // Кнопка для перехода к DetailsScreen
    <Button
      title="Перейти на детали"
      onPress={() => navigation.navigate('Details')}
    />
  );
}

function DetailsScreen() {
  return (
    <Text>Экран с деталями</Text>
  );
}

// Основной компонент приложения
export default function App() {
  return (
    // NavigationContainer обязательно должен быть на верхнем уровне
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Здесь вы видите простой стек из двух экранов. Кнопка позволяет перейти с домашнего экрана (`HomeScreen`) на экран деталей (`DetailsScreen`). 

#### Объяснения по коду

- `NavigationContainer` — корневой компонент, который позволяет навигации работать во всем приложении.
- `Stack.Navigator` и `Stack.Screen` — позволяют создавать стек и определять, какие экраны в нем есть.
- Проп `navigation` появляется у всех экранов, подключенных к навигации, с его помощью производится переход между экранами.

### Как работает стек-навигация

В классических мобильных приложениях переход между экранами реализован как стек: каждый новый экран кладётся поверх предыдущего. Пользователь может возвращаться назад ("pop"), а также переходить на другие экраны. 

## Навигация с передачей параметров между экранами

Очень часто требуется передавать данные между экранами — например, идентификатор элемента или какие-либо значения.

Рассмотрим, как передать параметры из одного экрана на другой:

```javascript
function HomeScreen({ navigation }) {
  return (
    <Button
      title="Смотреть детали пользователя"
      onPress={() =>
        navigation.navigate('Details', {
          userId: 42, // Передаём userId как параметр
        })
      }
    />
  );
}

function DetailsScreen({ route }) {
  // Получаем параметр, если он есть
  const { userId } = route.params || {};
  return <Text>ID пользователя: {userId}</Text>;
}
```

Обратите внимание, что для получения параметров используется объект `route`, который автоматически передается экрану.

## Типы навигации: Stack, Tab, Drawer

### Stack Navigation

Мы рассмотрели стековую навигацию выше. Это наилучший выбор для большинства переходов между отдельными экранами/разделами.

### Tab Navigation (табы)

Если ваше приложение имеет логически разделенные разделы (например, "Главная", "Профиль", "Настройки"), удобно использовать табы.

```javascript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Главная" component={HomeScreen} />
        <Tab.Screen name="Профиль" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Таб-навигация интегрируется максимально просто. Каждый экран — отдельный таб.

### Drawer Navigation (выдвижное меню)

Drawer используется, если экраны не помещаются в табах, либо если нужны редкие, но важные пункты меню.

```javascript
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator>
        <Drawer.Screen name="Главная" component={HomeScreen} />
        <Drawer.Screen name="О приложении" component={AboutScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
```

Вы сможете свайпом или нажатием на кнопку открывать боковое меню.

## Вложенная (Nested) навигация

Иногда требуется использовать несколько уровней навигации, например, стек внутри таба или табы внутри drawer. Давайте посмотрим как это реализовано.

### Пример: Стек внутри табов

```javascript
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="HomeDetails" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Домой" component={HomeStack} />
        <Tab.Screen name="Профиль" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Такой паттерн позволяет вам иметь стек внутри каждого таба, а параметры переходов не будут смешиваться.

## Работа с Deep Linking (Глубокие ссылки)

Глубокие ссылки позволяют открывать определённый экран приложения по url-ссылке. Это особенно важно для интеграции с push-уведомлениями, web-ссылками и т.д.

### Базовая настройка deep linking

Вам потребуется указать схему ссылок в `NavigationContainer`:

```javascript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'], // Ваши схемы и домены
  config: {
    screens: {
      Home: 'home',
      Details: 'details/:id', // :id — параметр
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      {/* Навигаторы */}
    </NavigationContainer>
  );
}
```

Теперь ссылка вида `myapp://details/777` откроет экран Details с параметром id=777.

## Навигация по условию (например, экран авторизации)

В сложных приложениях логика перехода зависит от состояния авторизации пользователя. Обычно пишут навигационные "стеки" отдельно для экрана входа и для основного приложения.

```javascript
function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppStack /> // основной стек приложения
      ) : (
        <AuthStack /> // стек с экранами входа/регистрации
      )}
    </NavigationContainer>
  );
}
```

AppStack и AuthStack — ваши обычные стеки, созданные с помощью навигаторов.

## Управление заголовками, параметрами навигации и стилями

React Navigation позволяет настроить заголовки (`header`), скрыть их или стилизовать.

```javascript
<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    title: 'Главная страница',
    headerStyle: { backgroundColor: '#f4511e' },
    headerTintColor: '#fff',
    // Можно передать функцию для изменения заголовка или кнопок
  }}
/>
```

Для динамического обновления заголовка можно использовать следующий трюк:

```javascript
function DetailsScreen({ navigation, route }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({ title: `Детали #${route.params?.id}` });
  }, [navigation, route.params?.id]);
  // ...
}
```

## Хуки навигации: useNavigation, useRoute

Для более удобного доступа к объекту навигации или маршрута используйте хуки.

```javascript
import { useNavigation, useRoute } from '@react-navigation/native';

function MyComponent() {
  const navigation = useNavigation(); // Позволяет навигировать из вложенных компонентов
  const route = useRoute();

  // navigation.navigate('ScreenName')
  // route.params
}
```

Использование этих хуков не привязано к экрану, можно помещать их в любых вложенных компонентах.

## Навигация через стек: методы navigate, push, goBack

- `navigate('ScreenName', params)` — перейти к экрану (если уже открыт — не кладет новый в стек).
- `push('ScreenName', params)` — всегда кладет новый экран в стек, даже если такой уже есть.
- `goBack()` — вернуться назад по стеку.
- `popToTop()` — вернуть пользователя на самый первый экран в стеке.

Пример:

```javascript
navigation.push('Profile', { userId: 99 });
// Откроет новый экран Profile с нужным параметром
navigation.goBack();
// Вернет к предыдущему экрану
```

## Пользовательский переход между экранами

Иногда требуется реализовать собственный переход: например, вызвать переход из кастомной кнопки, размещенной вне экрана.

Используйте контекст или хук:

```javascript
import { useNavigation } from '@react-navigation/native';

function CustomButton() {
  const navigation = useNavigation();

  return (
    <Button
      title="Открыть профиль"
      onPress={() => navigation.navigate('Profile')}
    />
  );
}
```

Такой подход очень удобен для компонентов, не являющихся экранами, но участвующих в навигации.

## Работа с асинхронными действиями при навигации

Иногда нужно подождать завершения асинхронной операции (например, загрузки) перед переходом:

```javascript
async function handlePress() {
  await fetchData();
  navigation.navigate('Details');
}

<Button title="Показать детали" onPress={handlePress} />
```

Такой способ гарантирует, что пользователь окажется на новом экране только после получения необходимых данных.

## Навигация и состояние приложения

Навигация тесно связана с управлением состоянием. Например, вы можете сделать редирект на экран входа, если токен пользователя устарел. Используйте глобальное состояние (React Context, Redux или MobX) для хранения информации о состоянии авторизации и маршрутизации.

## Заключение

Навигация — это ключ к удобному и функциональному мобильному приложению на React Native. Используя библиотеку React Navigation, вы получаете гибкость и мощные возможности по организации переходов между экранами, передачи параметров, объединения разных видов навигации, работы с deep linking и настройкой поведения под ваши задачи. Понимание этих инструментов значительно облегчает разработку сложных мобильных интерфейсов.

Если вы только начинаете осваивать навигацию, попробуйте реализовать сначала маленькое приложение, а затем постепенно усложняйте архитектуру, добавляя вложенные навигаторы и параметры. Со временем вы почувствуете, насколько такой подход дисциплинирует и ускоряет разработку мобильных продуктов.

Создание эффективной навигации - это только один из аспектов разработки качественного React Native приложения. Для создания полноценного приложения необходимо освоить множество других технологий и подходов, включая работу с UI, данными и нативными функциями. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rukovodstvo-po-navigation-v-React-Native) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы и ответы

### Как реализовать сброс стека навигации, чтобы после перехода назад нельзя было вернуться?

Используйте метод `reset` для навигации, чтобы полностью заменить текущий стек:

```javascript
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});
// Теперь пользователь не сможет вернуться назад
```

### Как динамически добавлять новые экраны в навигатор?

Навигаторы требуют описания экранов заранее, но если нужен динамический список, создайте экран-контейнер, который по пропам рендерит нужный компонент. В остальном структура навигации должна быть заранее определена.

### Как открывать модальные окна внутри навигации?

Для этого используйте модальный стек:

```javascript
<Stack.Navigator screenOptions={{ presentation: 'modal' }}>
  <Stack.Screen name="Main" component={MainScreen} />
  <Stack.Screen name="Modal" component={ModalScreen} />
</Stack.Navigator>
```
Теперь `navigation.navigate('Modal')` откроет его как модальный экран.

### Почему экран не обновляет параметры при повторном переходе с разными props?

Добавьте слушатель на изменение параметров или используйте хук `useEffect` с зависимостью от `route.params`, чтобы отреагировать на новые значения и обновить состояние или UI при необходимости.

### Как правильно интегрировать Redux-состояние с состоянием навигации?

Не пытайтесь дублировать state навигации в Redux. Лучше реагируйте на изменения в навигаторе через обработчики (`onStateChange`) или используйте навигацию и Redux независимо, передавая только необходимые параметры между экранами.
