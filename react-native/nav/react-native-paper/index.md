---
metaTitle: Использование библиотеки стилей Paper в React Native
metaDescription: Раскройте возможности библиотеки Paper для React Native - внедрение Material Design, компоненты, стилизация и советы по интеграции в мобильных приложениях
author: Алексей Крылов
title: Использование библиотеки стилей Paper в React Native
preview: Изучите как внедрять и применять библиотеку Paper в React Native - настройка стилей, кастомизация компонентов и практические примеры использования Material Design в мобильных приложениях
---

## Введение

Библиотека React Native Paper предоставляет гибкий и современный подход к оформлению мобильных приложений на React Native в стиле Material Design. Эта библиотека популярна среди разработчиков, которые хотят быстро внедрять красивые, отзывчивые и легкие для поддержки компоненты пользовательского интерфейса, следуя рекомендациям Google по дизайну. Благодаря Paper вы получаете не только стандартные визуальные элементы, такие как кнопки, поля ввода, модальные окна и списки, но и мощную систему темизации, кастомизации и удобный механизм работы со стилями. Далее я покажу вам, как вести установку Paper, применять её основные возможности, интегрировать в архитектуру приложения, а также кастомизировать внешний вид компонентов под задачи конкретного проекта.

## Установка и настройка Paper

### Добавление Paper в проект

Для начала, стоит убедиться, что вы работаете с актуальной версией React Native (желательно 0.60 и выше, поскольку Paper зависит от автолинкинга модулей).

Выполните команду для установки библиотеки и её зависимостей:

```bash
npm install react-native-paper
# или
yarn add react-native-paper
```

Paper использует библиотеку react-native-vector-icons для отображения иконок, поэтому нужно добавить и её:

```bash
npm install react-native-vector-icons
```

На iOS потребуется добавить postinstall-скрипт или вручную запустить `npx pod-install` в каталоге ios, чтобы установить pod-зависимости. На Android дополнительных манипуляций, как правило, не требуется.

React Native Paper предоставляет набор готовых компонентов и стилей, соответствующих Material Design. Это значительно ускоряет разработку и обеспечивает единообразие интерфейса. Для эффективной работы с библиотекой важно понимать ее структуру, возможности кастомизации и особенности интеграции с другими компонентами. Если вы хотите детальнее погрузиться в использование React Native Paper и научиться создавать современные Material Design интерфейсы — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Ispolzovanie-biblioteki-stilej-Paper-v-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Первичная интеграция Paper

Paper требует, чтобы общее приложение было обернуто в компонент-провайдер `Provider` из библиотеки. Это обеспечивает правильную работу механизма темизации и позволяет прокидывать стилизацию глубоко вниз по компонентному дереву. Давайте рассмотрим, как это делается:

```jsx
import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import App from './src/App';

export default function Main() {
  return (
    // Оборачиваем приложение в PaperProvider
    <PaperProvider>
      <App />
    </PaperProvider>
  );
}
```

В большинстве случаев над вашим компонентом `App` или навигационным контейнером должен находиться только один провайдер. Дополнительные Provider из других библиотек можно вкладывать по необходимости, но следите за их порядком.

## Компоненты Paper: основа интерфейса Material Design

### Базовые компоненты: Button, TextInput, Card

React Native Paper содержит набор компонентов, которые максимально соответствуют гайдлайнам Material Design. Использование Paper позволяет быстро сверстать прототип приложения, который уже выглядит современно и работает отзывчиво. Давайте рассмотрим ключевые элементы.

#### Кнопка (Button)

Кнопки — один из самых часто используемых компонентов интерфейса. Paper реализует кнопку с гибкой стилизацией:

```jsx
import { Button } from 'react-native-paper';

const MyButton = () => (
  <Button
    mode="contained" // варианты: 'text', 'outlined', 'contained'
    onPress={() => console.log('Нажато!')}
    icon="camera" // иконка из react-native-vector-icons
    disabled={false}
    loading={false}
    uppercase={true} // Приведение текста к uppercase
    style={{ margin: 8 }}
  >
    Сфотографировать
  </Button>
);
```

Вы сразу получаете визуальные эффекты Material Design: ripple-эффект, меняющееся состояние при загрузке или блокировке, анимации и иконки.

#### Поле ввода (TextInput)

Компонент поля ввода поддерживает три визуальных стиля и массу опций:

```jsx
import { TextInput } from 'react-native-paper';

const MyInput = () => {
  const [text, setText] = React.useState('');

  return (
    <TextInput
      label="Email"
      value={text}
      onChangeText={setText}
      mode="outlined" // варианты: 'flat', 'outlined'
      left={<TextInput.Icon icon="email" />}
      right={<TextInput.Icon icon="close" onPress={() => setText('')} />}
      keyboardType="email-address"
      error={text !== '' && !text.includes('@')}
      style={{ margin: 8 }}
    />
  );
};
```

Paper автоматически обрабатывает анимации лейбла, показывает состояния ошибки, поддерживает иконки и стили border.

#### Карточка (Card)

Карточки — основной контейнер для отображения информации согласно Material Design:

```jsx
import { Card, Text, Button } from 'react-native-paper';

const MyCard = () => (
  <Card style={{ margin: 8 }}>
    <Card.Title title="Заголовок" subtitle="Описание" left={(props) => <Avatar.Icon {...props} icon="folder" />} />
    <Card.Content>
      <Text>Здесь основной контент карточки.</Text>
    </Card.Content>
    <Card.Actions>
      <Button>Подробнее</Button>
      <Button>Закрыть</Button>
    </Card.Actions>
  </Card>
);
```
Внутри карточки вы свободны размещать любой контент, а кнопки действий и аватары будут отображаться по стандарту Material.

### Списки, чекбоксы и другие элементы управления

Paper поддерживает не только базовые, но и более сложные элементы управления:

#### Чекбокс (Checkbox)

```jsx
import { Checkbox } from 'react-native-paper';

const MyCheckbox = () => {
  const [checked, setChecked] = React.useState(false);

  return (
    <Checkbox.Item
      label="Я согласен с условиями"
      status={checked ? 'checked' : 'unchecked'}
      onPress={() => setChecked(!checked)}
      position="leading"
    />
  );
};
```

#### Переключатель (Switch)

```jsx
import { Switch } from 'react-native-paper';

const MySwitch = () => {
  const [isOn, setIsOn] = React.useState(false);

  return (
    <Switch value={isOn} onValueChange={setIsOn} />
  );
};
```

#### Радио-группа

```jsx
import { RadioButton } from 'react-native-paper';

const MyRadioGroup = () => {
  const [value, setValue] = React.useState('first');

  return (
    <RadioButton.Group onValueChange={setValue} value={value}>
      <RadioButton.Item label="Первый" value="first" />
      <RadioButton.Item label="Второй" value="second" />
    </RadioButton.Group>
  );
};
```

Все эти компоненты интегрируются в общую тему приложения и автоматически применяют нужные цвета, размеры, анимации.

### Списки (List)

Компонент для построения списков — мощное средство для отрисовки сложных структур:

```jsx
import { List } from 'react-native-paper';

const MyList = () => (
  <List.Section>
    <List.Subheader>Настройки</List.Subheader>
    <List.Item
      title="Профиль"
      description="Изменить данные аккаунта"
      left={props => <List.Icon {...props} icon="account" />}
      onPress={() => {}}
    />
    <List.Item
      title="Уведомления"
      left={props => <List.Icon {...props} icon="bell" />}
      onPress={() => {}}
    />
  </List.Section>
);
```

Разнообразные варианты иконок, расширяемые элементы, вложенные списки (List.Accordion) позволяют легко строить различные меню, аккордеоны или списки с иерархией.

## Система темизации и кастомизации

### Темы: светлая и тёмная

Paper предоставляет готовые темы и инструменты для создания собственных. Стандартно доступны light и dark темы:

```jsx
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  roundness: 8, // закругление углов по умолчанию
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db', // основной цвет
    accent: '#f1c40f', // акцентный цвет
  },
};

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}
```

Вот фрагмент, который покажет вам, как можно переключаться между темами:

```jsx
import { useTheme } from 'react-native-paper';

function ThemedButton() {
  const { colors } = useTheme();

  return (
    <Button style={{ backgroundColor: colors.primary }}>Тематическая кнопка</Button>
  );
}
```

При помощи хука `useTheme` вы получаете доступ к текущей теме в любом дочернем компоненте.

### Использование кастомных цветов и свойств темы

Вы можете полностью пересобрать схему цвета, настроить параметры типографики, радиусы, размеры, поведение ripple-эффектов и многое другое. Пример расширения темы:

```jsx
const MyCustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fffef0',
    primary: '#7b1fa2',
    accent: '#ffc107',
    surface: '#fff',
    text: '#262626',
    placeholder: '#8e99a7',
    disabled: '#cfd8dc',
  },
  fonts: {
    regular: { fontFamily: 'Roboto', fontWeight: 'normal' },
    medium: { fontFamily: 'Roboto-Medium', fontWeight: 'normal' },
    light: { fontFamily: 'Roboto-Light', fontWeight: 'normal' },
    thin: { fontFamily: 'Roboto-Thin', fontWeight: 'normal' },
  },
};
```
Один из классических примеров применения собственной темы — первичная стилизация всех элементов управления в корпоративном стиле.

### Кастомизация компонентов

Помимо глобальной настройки темы, вы можете переопределять отдельные компоненты через props или использовать стиль props напрямую:

```jsx
<Button
  mode="contained"
  color="#e74c3c" // цвет для данной кнопки
  style={{
    margin: 10,
    borderRadius: 24,
    elevation: 5,
  }}
>
  Кастомная кнопка
</Button>
```
Если вы хотите изменить более сложные параметры (например, ripple-эффект, иконки, фоновые цвета в зависимости от состояния), обратитесь к документации Paper — большинство компонентов поддерживают дополнительные props для глубокого управления внешним видом.

## Работа с иконками и типографикой

### Иконки

Все компоненты Paper автоматически поддерживают иконки благодаря тесной интеграции с react-native-vector-icons. Вы просто указываете имя нужной иконки, а Paper займётcя её выводом в нужном цвете и размере.

```jsx
<Button icon="plus">Добавить</Button>
```

Вы также можете передать свой компонент, если нужен SVG или Image.

### Типографика

Paper включает связку компонентов для работы с текстом, подчеркивая соответствие Material Design:

```jsx
import { Title, Paragraph, Caption, Subheading } from 'react-native-paper';

const TextExample = () => (
  <>
    <Title>Заголовок</Title>
    <Subheading>Подзаголовок</Subheading>
    <Paragraph>Основной текст приложения, который вы можете оформить этим компонентом.</Paragraph>
    <Caption>Вспомогательная подпись</Caption>
  </>
);
```

Эти компоненты автоматически следуют выбранной теме и глобальным стилям.

## Paper и React Navigation

Если вы используете React Navigation, рекомендуется интегрировать тему Paper с системой тем навигации, чтобы приложение выглядело однородно:

```jsx
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';

const theme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    primary: '#1976d2',
    background: '#ffffff',
  },
};

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <App />
      </NavigationContainer>
    </PaperProvider>
  );
}
```

Такая совместная интеграция избавит от визуальных расхождений между экранами и остальными компонентами приложения.

## Подключение кастомных стилей к компонентам Paper

Хотя Paper стилизует компоненты по умолчанию через темы и props, ничто не мешает применять и собственные inline-стили или стили из StyleSheet:

```jsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    margin: 12,
    elevation: 8,
    backgroundColor: '#8bc34a',
  },
});

<Button style={styles.button}>Кастомный стиль</Button>
```
Помните, что некоторые внутренние параметры, такие как цвет ripple или эффект наведения, задаются в теме, и inline-стиль не всегда может их переопределить.

## Примеры реальных кейсов и лучших практик

### Базовый шаблон приложения

Один из самых удобных вариантов — сразу поднять структуру из нескольких экранов с навигацией и глобальной темой Paper. Смотрите, вот такой шаблон можно использовать как стартовую точку:

```jsx
import * as React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3949ab',
    accent: '#f50057',
  }
};

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        {/* Screens */}
      </NavigationContainer>
    </PaperProvider>
  );
}
```

### Адаптация под бизнес-стиль

Очень часто требуется внедрить в привычные Material-компоненты компанийную палитру и собственные шрифты. Используйте расширение темы, как показано выше, и не забудьте зарегистрировать кастомные шрифты с помощью React Native.

### Отключение/редактирование ripple-эффектов

Если для дизайна нужно убрать эффект ripple (волны нажатия), задайте соответствующий props:

```jsx
<Button mode="contained" rippleColor="transparent">
  Без ripple
</Button>
```

## Заключение

React Native Paper — это современное решение для быстрого и профессионального оформления интерфейсов мобильных приложений в стиле Material Design. Библиотека упрощает реализацию сложных сценариев UI, предоставляя готовые компоненты, поддержку тем, типографики, иконок, анимаций, работы со списками и элементами управления состоянием. Эта библиотекй интуитивно понятна, безопасна и масштабируема — она прекрасно подходит как для прототипов, так и для полноценных бизнес-приложений.

Использование библиотек стилей, таких как Paper, является важным шагом в разработке современного React Native приложения. Однако, для создания полноценного приложения необходимо освоить множество других технологий и подходов, включая работу с навигацией, данными и нативными функциями. Курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Ispolzovanie-biblioteki-stilej-Paper-v-React-Native) поможет вам в этом. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как корректно переопределить цвета ripple-эффекта у отдельных компонентов?

Добавьте свойство `rippleColor` непосредственно в нужный компонент, например:

```jsx
<Button rippleColor="#FFD700">Золотой ripple</Button>
```
Для универсальной настройки для всех компонентов пропишите цвет ripple на уровне кастомной темы, добавив свойство `rippleColor` в объект `colors`.

### Почему не применяется кастомный шрифт в компонентах Paper?

Шрифты Paper по умолчанию используют Roboto или системный шрифт. Чтобы задать свой, определите объект `fonts` в вашей теме и укажите fontFamily каждого типа (regular, medium, bold и др). Не забудьте загрузить свой шрифт в проект через react-native link или вручную.

### Как использовать иконки сторонних библиотек с Paper?

Используйте проп icon и передайте компонент, например:

```jsx
import FontAwesome from 'react-native-vector-icons/FontAwesome';
<Button icon={() => <FontAwesome name="star" size={20} color="#fff" />}>Избранное</Button>
```
Таким образом можно вставлять любые иконки, поддерживаемые react-native-vector-icons.

### Можно ли использовать собственные компоненты внутри Paper-карточек или списков?

Да, внутрь Paper Card, List и других контейнеров можно помещать любые компоненты, включая ваши собственные, если они соответствуют стандарту React Native-компонентов.

### Не отображаются иконки на Android — что делать?

Проверьте, что:
- Установлена зависимость react-native-vector-icons и выполнен pod install (для iOS — обязательно).
- В android/app/build.gradle подключены fonts (см. документацию vector-icons).
- Не забывайте кэшировать иконки после первой сборки (перезапустите эмулятор).

Эти шаги обычно решают большую часть проблем с иконками.
