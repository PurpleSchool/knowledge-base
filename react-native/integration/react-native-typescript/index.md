---
metaTitle: Интеграция Typescript в React Native
metaDescription: Как интегрировать Typescript в проект React Native - пошаговое руководство, настройка, примеры использования типов и советы по ежедневной работе
author: Алексей Данилов
title: Интеграция Typescript в React Native
preview: Научитесь интегрировать Typescript в React Native - настройте проект, создайте типы, используйте преимущества строгой типизации и инструменты для повышения продуктивности
---

## Введение

React Native позволяет создавать кроссплатформенные мобильные приложения с помощью JavaScript и React. Однако, по мере роста проекта и усложнения архитектуры, вам может стать трудно поддерживать масштабируемость и надежность кода на JavaScript. Здесь на помощь приходит TypeScript — строго типизированный язык, компилируемый в JavaScript, который позволяет ловить ошибки еще до запуска приложения.

Когда вы используете TypeScript вместе с React Native, вы получаете более мощную статическую проверку типов, улучшенное автодополнение и понятные контракты данных. Это критично, если вы работаете в команде или стремитесь к долгосрочной поддержке проекта.

В этой статье я покажу вам, как добавить и настроить TypeScript в существующем или новом проекте React Native, расскажу о типизации компонентов, props, state, hooks, а также дам советы по структуре проектов и ежедневной работе с типами.

## Создание нового проекта React Native с TypeScript

Удобнее всего начинать с уже встроенной поддержки TypeScript в React Native CLI или Expo. Сейчас я покажу оба подхода.

### С помощью React Native CLI

Вот типичная команда для создания проекта с поддержкой TypeScript:

```bash
npx react-native init MyTSApp --template react-native-template-typescript
```

- С помощью этой команды создается проект с уже настроенными конфигами tsconfig.json и примерами компонентов на TypeScript.
- Если у вас уже есть проект на JavaScript, добавьте необходимые пакеты и конфиги (расскажу об этом ниже).

### С помощью Expo CLI

Expo CLI тоже умеет создавать проекты с TypeScript:

```bash
npx create-expo-app MyTSExpoApp -t expo-template-blank-typescript
```

- Здесь Expo сразу положит вам tsconfig.json, а все файлы примеров будут в формате .ts или .tsx.

### Добавление TypeScript в существующий проект

Если у вас уже есть React Native на JavaScript, последовательность шагов будет другой.

#### Установка зависимостей

Установите необходимые пакеты:

```bash
npm install --save-dev typescript @types/react @types/react-native
```

- `typescript` — сам компилятор.
- `@types/react` и `@types/react-native` — описания типов для React и React Native.

#### Добавление конфигурационного файла tsconfig.json

Создайте tsconfig.json в корне проекта:

```json
{
  "compilerOptions": {
    "target": "esnext", // Поддержка новых возможностей JS
    "module": "esnext",
    "jsx": "react",
    "strict": true, // Включает строгую проверку типов
    "moduleResolution": "node",
    "allowJs": true, // Разрешает работать с обычными файлами .js
    "skipLibCheck": true,
    "noEmit": true, // Не генерировать файлы, TypeScript только проверяет
    "esModuleInterop": true
  },
  "include": ["src", "App.tsx"],
  "exclude": ["node_modules"]
}
```

- Этот конфиг подойдет для большинства случаев. Если ваши исходники не в каталоге `src`, замените его на актуальный.

#### Переименование файлов

Постепенно переименовывайте ваши `.js` / `.jsx` файлы в `.ts` / `.tsx`:

- `.ts` — для обычных файлов TypeScript без JSX.
- `.tsx` — для файлов с JSX-разметкой.

## Типизация компонентов и props

Теперь, когда проект готов к работе с TypeScript, давайте разберемся, как типизировать различные элементы вашего приложения.

### Функциональные компоненты

Вот базовый пример функционального компонента с типизированными props:

```tsx
type ButtonProps = {
  title: string; // Ожидается строка
  onPress: () => void; // Колбек без параметров
};

const CustomButton: React.FC<ButtonProps> = ({ title, onPress }) => (
  <Button title={title} onPress={onPress} />
);

// Теперь на этапе написания кода TypeScript подскажет, если вы забудете передать title или onPress
```

- Когда вы попытаетесь вызвать `<CustomButton />` без обязательных параметров, редактор ругнется.
- Добавлять необязательные параметры можно через вопросительный знак: `color?: string`.

### Типизация state через useState

useState возвращает tuple. Вот пример, который поможет понять, как явно указать тип состояния:

```tsx
const [count, setCount] = React.useState<number>(0);
// Здесь count всегда будет number, и TypeScript предупредит, если вы случайно попробуете присвоить туда строку
```

Если вы работаете с более сложными объектами:

```tsx
type User = {
  id: number;
  name: string;
  email?: string;
};

const [user, setUser] = React.useState<User | null>(null);
// Теперь user строго либо User, либо null
```

### Типизация ref

Использование useRef с типами:

```tsx
const inputRef = React.useRef<TextInput>(null);
// inputRef.current имеет тип TextInput | null
```

### Типизация классовых компонентов

Для классовых компонентов структура следующая:

```tsx
type MyProps = { title: string };
type MyState = { isVisible: boolean };

class ExampleComponent extends React.Component<MyProps, MyState> {
  state = { isVisible: false };

  render() {
    return <Text>{this.props.title}</Text>;
  }
}
```

- Здесь TypeScript контролирует и входные параметры и state компонента.

## Использование сторонних библиотек и type definition’ы

В React Native часто используются сторонние библиотеки, которые могут не содержать типы "из коробки". В таком случае обратите внимание на @types:

- Перед установкой новой библиотеки всегда проверяйте, есть ли для нее типы в репозитории [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped).
- Например, для библиотеки lodash понадобится пакет `@types/lodash`.

```bash
npm install --save lodash
npm install --save-dev @types/lodash
```

- Многие популярные библиотеки, вроде react-navigation или redux, поставляются с встроенными типами.

### Пример интеграции стороннего пакета

Посмотрите, например, как выглядит импорт и использование типизированного пакета react-navigation:

```tsx
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

const HomeScreen: React.FC<StackScreenProps<RootStackParamList, 'Home'>> = ({ navigation }) => (
  <Button
    title="Open Details"
    // TypeScript проверит, что вы передаёте itemId
    onPress={() => navigation.navigate('Details', { itemId: 123 })}
  />
);
```

- В этом примере строгое определение параметров экрана помогает избежать случайных ошибок при переходах.

## Организация типов в проекте

Когда вы работаете над средним или крупным приложением, типов становится много. Лучше всего содержать их в отдельной папке или файле.

### Пример структуры типа для пользователя

В директории `src/types/User.ts`:

```ts
export type UserProfile = {
  id: string;
  name: string;
  avatarUrl: string;
  birthDate?: string;
};
```

Затем используйте этот тип в компонентах:

```tsx
import { UserProfile } from '../types/User';

const ProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => (
  <View>
    <Text>{user.name}</Text>
    {/* Здесь TypeScript проверит все поля */}
  </View>
);
```

- Такой подход улучшает переиспользуемость и облегчает рефакторинг.

## Интеграция с линтерами и форматтерами

Важно не только писать типы, но и поддерживать единый стиль кода.

### Настройка ESLint для TypeScript

Установите необходимые пакеты для поддержки TypeScript:

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Дальше настройте ваш .eslintrc:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ]
}
```

### Настройка Prettier

Подключите Prettier, чтобы автоматически форматировать ваш код:

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

Создайте конфиг `.prettierrc` для глобальных правил форматирования.

## Работа с типами в популярных паттернах React Native

Иногда встречаются ситуации, которые вызывают вопросы — как правильно типизировать их в TypeScript.

### Типизация useContext

Когда вы используете контекст, типизация выглядит так:

```tsx
type Theme = { color: string };

const ThemeContext = React.createContext<Theme | undefined>(undefined);

const App = () => (
  <ThemeContext.Provider value={{ color: 'blue' }}>
    <ThemedComponent />
  </ThemeContext.Provider>
);

const ThemedComponent = () => {
  const theme = React.useContext(ThemeContext);
  if (!theme) throw new Error('ThemeContext не найден');
  // theme гарантированно тип Theme
  return <View style={{ backgroundColor: theme.color }} />;
};
```

### Типизация навигации

С навигацией в больших приложениях лучше выносить все возможные параметры экрана в единый тип RootStackParamList.

### Типизация Redux-редьюсеров и экшенов

Вот пример типизации action и reducer:

```ts
type CounterAction = 
  | { type: 'increment' }
  | { type: 'decrement' };

function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case 'increment':
      return state + 1;
    case 'decrement':
      return state - 1;
    default:
      return state;
  }
}
```

## Общие советы по использованию TypeScript в React Native

- Старайтесь описывать типы для props, состояний, параметров функций.
- Используйте `interface` для описания props компонентов. Они лучше всего читаются при наследовании.
- Чем раньше вы введете строгую типизацию, тем меньше будет проблем в будущем.
- Не бойтесь постепенно переводить проект. Можно работать с файлами .js и .ts одновременно, если в `tsconfig.json` стоит `allowJs: true`.
- Пользуйтесь автодополнением редактора (VSCode один из лучших).
- Обязательно используйте строгий режим (`"strict": true`), чтобы избежать непредвиденных ошибок.

## Заключение

Интеграция TypeScript в React Native заметно повышает качество и поддерживаемость мобильных приложений. Вы получаете строгую типизацию, информативные ошибки до запуска, качественный автокомплит и помощь редактора при рефакторинге. TypeScript особенно полезен на больших и долгоиграющих проектах — он снижает риск появления трудноуловимых ошибок и значительно ускоряет отладку.

Вы можете начать применение TypeScript на любом этапе разработки: с самого начала — с использованием шаблонов, или путем постепенного внедрения в уже существующий проект. Основное — быть последовательными и не пренебрегать типами там, где это действительно необходимо. Вы заметите, как качество и стабильность кода начнут расти уже после первых интеграций.

## Частозадаваемые технические вопросы по теме и их решения

**1. Как добавить поддержку абсолютных импортов с TypeScript в React Native?**  
— В tsconfig.json добавьте поле paths и baseUrl. Например:
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"]
    }
  }
}
```
Еще потребуется настроить alias для babel: в babel.config.js добавьте babel-plugin-module-resolver.

**2. Почему возникают ошибки “Type definition file not found” или не подтягиваются типы node_modules?**  
— Проверьте, что у вас указан параметр "skipLibCheck": true и не слишком ограничивающий "types" в tsconfig.json. Иногда помогает удалить node_modules и файл tsconfig.tsbuildinfo, затем выполнить npm install.

**3. Как типизировать navigation props в экранах React Navigation v6?**  
— Используйте StackScreenProps<RootStackParamList, 'ScreenName'> для типизации параметров navigation и route. Это позволит TypeScript контролировать правильную передачу данных между экранами.

**4. Как правильно использовать стороннюю библиотеку без доступных типов?**  
— Если типы отсутствуют на DefinitelyTyped, создайте файл типа `declarations.d.ts` и напишите: 
```ts
declare module 'имя-библиотеки';
```
Вы также можете создать собственные описания типов по мере необходимости.

**5. Почему не работают автодополнения и проверки типов в .js файлах после добавления TypeScript?**  
— TypeScript, по умолчанию, не анализирует .js файлы. Нужно установить allowJs: true в tsconfig.json и добавить // @ts-check в начале js-файла, если нужна проверка типов. Для полноценной типизации лучше постепенно переводить такие файлы в .ts/.tsx.