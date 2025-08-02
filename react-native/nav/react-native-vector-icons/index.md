---
metaTitle: Как использовать векторные иконки в React Native
metaDescription: Узнайте как подключать и настраивать векторные иконки в React Native - монтаж библиотек, работа с SVG, кастомизация и импорт пользовательских иконок на практике
author: Олег Марков
title: Как использовать векторные иконки в React Native
preview: Подробная инструкция по работе с векторными иконками в React Native - узнайте как подключить, кастомизировать и использовать SVG иконки в своих мобильных приложениях
---

## Введение

Векторные иконки — важная часть современного мобильного интерфейса. В отличие от растровых изображений, они масштабируются без потери качества и отлично смотрятся на экранах с любым разрешением. Для разработки на React Native существует ряд удобных инструментов, которые позволяют легко подключать, использовать и настраивать векторные иконки. В этой статье я расскажу вам, как внедрять векторные иконки в проекты React Native, разберу основные подходы, покажу реальный код и опишу возможности популярных библиотек.

## Выбор библиотеки для работы с векторными иконками

### Популярные решения

Самыми популярными и стабильными библиотеками для работы с иконками являются:

- [`react-native-vector-icons`](https://github.com/oblador/react-native-vector-icons) — включает коллекции Material Icons, FontAwesome, Ionicons и многие другие.
- [`react-native-svg`](https://github.com/software-mansion/react-native-svg) — даёт инструменты для отрисовки SVG-графики, в том числе пользовательских иконок.
- [`@expo/vector-icons`](https://docs.expo.dev/guides/icons/) — надстройка над `react-native-vector-icons` для проектов на Expo.

Давайте подробно разберём каждый инструмент и его использование.

### Когда использовать react-native-vector-icons

Эта библиотека прекрасно подходит, если вам нужно быстро добавить готовые иконки из популярных коллекций. Она работает как с Expo, так и с bare React Native проектами.

### Когда использовать react-native-svg

Если у вас есть собственные SVG-файлы или вы хотите использовать свои кастомные векторные изображения, этот вариант для вас. Кроме простых иконок, через `react-native-svg` можно отображать сложную графику или даже делать анимацию.

## Установка библиотек

### Установка react-native-vector-icons

Для обычных React Native проектов:

```sh
npm install react-native-vector-icons
# или
yarn add react-native-vector-icons
```

Если у вас Expo проект:

```sh
expo install react-native-vector-icons
```

#### Линковка для bare React Native

В новых версиях React Native ручная линковка не нужна. Если у вас древний проект, используйте:

```sh
npx react-native link react-native-vector-icons
```

#### Дополнение для Android

Добавьте следующий код в `android/app/build.gradle` в раздел `apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"`

```groovy
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

Это автоматически скопирует файлы шрифтов при сборке.

#### Дополнение для iOS

В большинстве случаев ничего делать не нужно — достаточно перезапустить проект через Xcode или использовать `npx pod-install`, если используется CocoaPods.

### Установка react-native-svg

```sh
npm install react-native-svg
# или
yarn add react-native-svg
```

Для Expo:

```sh
expo install react-native-svg
```

## Использование готовых коллекций иконок

### Базовое использование иконок из react-native-vector-icons

Посмотрите пример, как импортировать иконку из Material Icons и использовать в компоненте:

```jsx
import Icon from 'react-native-vector-icons/MaterialIcons';

function MyButton() {
  return (
    <Icon name="home" size={30} color="#4F8EF7" />
  );
}
// Здесь мы выводим иконку "home" с размерами 30 и цветом #4F8EF7
```

Вы можете менять размер (через свойство `size`), цвет (`color`) и даже стили компонента.

### Список коллекций

Некоторые часто используемые коллекции внутри библиотеки:

- AntDesign
- Entypo
- EvilIcons
- Feather
- FontAwesome
- FontAwesome5
- Ionicons
- MaterialIcons
- MaterialCommunityIcons
- SimpleLineIcons

Пример подключения другой коллекции:

```jsx
import FontAwesome from 'react-native-vector-icons/FontAwesome';

<FontAwesome name="rocket" size={24} color="red" />
// Используем иконку "rocket" из FontAwesome
```

Посмотреть все доступные иконки можно на [странице репозитория](https://oblador.github.io/react-native-vector-icons/).

### Как сделать иконки кликабельными

В React Native иконка — это обычный компонент. Вам просто обернуть его в Touchable-компонент:

```jsx
import { TouchableOpacity } from 'react-native';

<TouchableOpacity onPress={() => alert('Иконка нажата!')}>
  <Icon name="menu" size={30} color="#333" />
</TouchableOpacity>
// Теперь при нажатии на иконку появится alert
```

### Кастомизация иконок через style

Вы можете использовать пропс `style`:

```jsx
<Icon
  name="star"
  size={40}
  color="#FFD700"
  style={{ margin: 20, alignSelf: 'center' }}
/>
// Добавлены отступы и центрирование
```

## Использование ваших собственных SVG-иконок

Если у вас есть собственная SVG-иконка, вы можете использовать её с помощью библиотеки `react-native-svg`.

### Как конвертировать SVG и использовать как компонент

Смотрите, я покажу вам процесс пошагово.

1. Возьмите SVG-файл, например:

```svg
<svg width="24" height="24" viewBox="0 0 24 24">
  <path fill="#000000" d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z" />
</svg>
```

2. Скопируйте содержимое тега `<svg>` и оберните его в компонент из `react-native-svg`:

```jsx
import Svg, { Path } from 'react-native-svg';

const MyIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      fill="#000"
      d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z"
    />
  </Svg>
);
// Теперь MyIcon — это React компонент, который рисует вашу иконку
```

### Как быстро преобразовать SVG в компоненты для React Native

Существуют сервисы типа [SVGR](https://react-svgr.com/playground/) — просто вставьте туда ваш SVG, выберите "React Native", и сразу получите компонент с правильным синтаксисом.

### Работа с атрибутами SVG в React Native

В React Native имена атрибутов идут в camelCase, а не через дефис. Например:

- `fill-opacity` → `fillOpacity`
- `stroke-width` → `strokeWidth`

Также для цветов используйте строки (`"#ff0000"`, вместо rgb или именованных цветов).

### Замена цвета и размера SVG-иконки через пропсы

Сделайте компонент иконки так, чтобы в него можно было передавать цвет и размер:

```jsx
const MyIcon = ({ color = '#000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z"
    />
  </Svg>
);

// Пример использования: 
<MyIcon color="#1e90ff" size={32} />
```

Это удобно, если вы хотите переиспользовать иконку с разными параметрами.

### Как вставить SVG напрямую в код

Даже если у вас нет компонента, скопируйте сегменты прямо в код. Вот пример:

```jsx
import Svg, { Circle } from 'react-native-svg';

const SimpleCircle = () => (
  <Svg width={30} height={30}>
    <Circle cx={15} cy={15} r={10} stroke="green" strokeWidth={2} fill="yellow" />
  </Svg>
);
// Этот компонент рисует жёлтый круг с зелёной обводкой
```

## Использование векторных иконок в ListView/FlatList

Очень часто векторные иконки используются в списках. Пример того, как это организовать:

```jsx
import { FlatList, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DATA = [
  { key: '1', label: 'Профиль', icon: 'person' },
  { key: '2', label: 'Настройки', icon: 'settings' },
  { key: '3', label: 'Информация', icon: 'info' },
];

function MenuList() {
  return (
    <FlatList
      data={DATA}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Icon name={item.icon} size={24} style={{ marginRight: 12 }} />
          <Text>{item.label}</Text>
        </View>
      )}
    />
  );
}
// В этом примере в каждой строке списка отображается иконка и текст
```

## Динамическая подгрузка иконок

### Как делать подстановку иконок по условию

Если тип иконки выбирается из данных:

```jsx
import FontAwesome from 'react-native-vector-icons/FontAwesome';

function CategoryIcon({ type }) {
  // Обратите внимание: можно использовать switch или объект для соответствия имени иконки
  const iconName = {
    food: 'cutlery',
    transport: 'car',
    health: 'medkit',
  }[type] || 'question-circle';

  return <FontAwesome name={iconName} size={24} color="gray" />;
}
// Теперь <CategoryIcon type="health" /> покажет медицинскую иконку
```

## Импорт пользовательских иконок как шрифт (Fontello, IcoMoon)

Если вам понадобились свои собственные иконки в формате шрифта, используйте сервисы:

- [Fontello](https://fontello.com/)
- [IcoMoon](https://icomoon.io/)

Скачайте итоговый набор в виде файлов `.ttf`, добавьте их в проект (обычно директория `assets/fonts`), настройте их через `react-native-vector-icons`, используя встроенный инструмент генерации:

```sh
npx react-native-vector-icons --generate
```

А далее используйте свой кастомный набор иконок так же, как и любой другой.

## Организация общего набора иконок как отдельных компонентов

Для крупных проектов удобно завести папку `icons/` и сложить туда все иконки как компоненты:

```
src/
  icons/
    HomeIcon.js
    SearchIcon.js
    CustomLogoIcon.js
```

Это повысит читаемость кода, особенно если есть миксы SVG и стандартных иконок.

## Поддержка темной темы

Цвет иконки удобно получать из темы приложения:

```jsx
import { useColorScheme } from 'react-native';

const ThemedIcon = () => {
  const theme = useColorScheme(); // вернёт 'light' или 'dark'

  const color = theme === 'dark' ? '#fff' : '#000';

  return <Icon name="star" size={32} color={color} />;
};
// Такой подход позволит вашим иконкам выглядеть гармонично в любой теме
```

## Проблемы с производительностью при большом количестве иконок

Имейте в виду: если вы используете сотни SVG-иконок на одном экране, производительность может пострадать из-за количества отрисовок. В таких случаях лучше отдавать предпочтение иконкам-шрифтам, либо оптимизировать SVG (уберите лишние детали, используйте только нужные атрибуты).

## Заключение

Использование векторных иконок в React Native даёт вам гибкость и красивый внешний вид без потери качества на разных устройствах. Существует несколько мощных и простых инструментов для работы с иконками: стандартные коллекции, кастомные SVG, собственные шрифтовые наборы. Научитесь подключать нужную библиотеку, кастомизировать и использовать иконки как компоненты — и ваш интерфейс станет стильнее и современнее. Все основные способы — от простых до более профессиональных — я показал на практике. Выбирайте оптимальный подход под свои задачи!

## Частозадаваемые технические вопросы по теме

### Как динамически менять цвет SVG-иконки в зависимости от состояния?

Передавайте цвет как пропс в компонент SVG-иконки и используйте его в атрибуте `fill`.
```jsx
const MyIcon = ({ color }) => (
  <Svg><Path fill={color} ... /></Svg>
);
// В родителе: <MyIcon color={active ? 'blue' : 'gray'} />
```

### Почему моя SVG-иконка рендерится слишком большой или маленькой?

Убедитесь, что правильно указан атрибут `viewBox` в вашем SVG. При его отсутствии или неправильных значениях масштаб будет некорректный.
```jsx
<Svg width={24} height={24} viewBox="0 0 24 24">...</Svg>
```

### Как анимировать векторные иконки?

Анимацию можно реализовать разными способами — чаще всего используют библиотеку `react-native-reanimated` или API Animated, оборачивая SVG/иконку во view с анимацией или изменяя пропсы напрямую.

### Как оптимизировать SVG-файлы для мобильного приложения?

Перед вставкой SVG воспользуйтесь сервисом [SVGOMG](https://jakearchibald.github.io/svgomg/), чтобы удалить лишние группы и неиспользуемые атрибуты. Это сократит размер и ускорит рендер.

### Как использовать один и тот же набор иконок в Web и React Native?

Для совместного кода пригодится [react-native-svg-transformer](https://github.com/kristerkari/react-native-svg-transformer), который позволяет импортировать SVG как компоненты, а для Web применять с помощью `react-svg` или аналогичных решений. Старайтесь использовать одинаковую структуру папок и компонент.