---
metaTitle: TypeScript в React
metaDescription: Разбираемся как использовать TypeScript в React
author: Вячеслав Руденко
title: TypeScript в React
preview: Стабильность и эффективность в разработке React с TypeScript. Узнайте, как типы улучшают процесс frontend-разработки
---

# Введение

Frontend-разработка в наше время ставит перед нами вызов повышения эффективности и безопасности кода. В этом контексте TypeScript, надстройка над JavaScript с добавленной статической типизацией, выступает как ключевой инструмент для достижения этих целей. Мы рассмотрим роль TypeScript в разработке React-приложений, подчеркивая преимущества, которые статическая типизация приносит в процесс кодирования.

Интеграция TypeScript в React требует понимания не только синтаксиса TypeScript, но и принципов работы React. Без этих знаний сложно создавать надежные и масштабируемые приложения. Если вы хотите детальнее погрузиться в TypeScript, чтобы писать качественный код для React — приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-v-react). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

# Типизация хуков

## userState()

Хук `useState` предоставляет простой способ добавления локального состояния в функциональные компоненты. В TypeScript, мы можем улучшить надежность и понимание кода, используя явную типизацию для `useState`.

Пример типизации использования `useState`:

```tsx
import React, {useState} from 'react';

const MyComponent: React.FC = () => {
  // Используем useState с явным указанием типа начального состояния
  const initialState = 0;
  const [count, setCount] = useState<number>(initialState);

  // Теперь count имеет тип number, а setCount принимает параметр с таким же типом
  const increment = () => {
    setCount((prevCount) => prevCount + 1);
  };

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </>
  );
};
```

Единственное нужно помнить, что несмотря на уточнение типа, при отсутствии `initialState`, состояние будет принадлежать к объединению `T | undefined`.

## useEffect() и useLayoutEffect()

Поскольку у данных хуков отсутствует возвращаемое значение, сложно представить сценарий в котором возникает ошибка связанная с передачей аргументов. Поэтому подробное рассмотрение и пояснение будет опущено.

## useContext()

Чтобы использовать `useContext` в TypeScript, сначала нужно создать объект `context` с параметром `generic type`, который задает тип значения контекста.

Вот пример того, как это сделать:

```tsx
import {createContext} from 'react';

interface Theme {
  color: string;
  background: string;
}

const ThemeContext = createContext<Theme>({
  color: 'black',
  background: 'white',
});
```

В этом примере мы создали объект контекста `ThemeContext`, который хранит объект `Theme` со свойствами `color` и `background`. Функция `createContext` принимает в качестве аргумента значение по умолчанию, которое будет использоваться, если значение контекста не предоставлено родительским компонентом.

Создав объект контекста, вы можете использовать хук `useContext` для использования значения контекста в компоненте функции. Вот пример того, как это сделать:

```tsx
import {useContext} from 'react';

function MyComponent() {
  const theme = useContext(ThemeContext);

  return <div style={{color: theme.color, background: theme.background}}>Hello World!</div>;
}
```

Чтобы предоставить значение контекста компоненту функции, можно использовать компонент `Context.Provider`. Этот компонент принимает значение `prop`, которое является значением, предоставляемым всем компонентам, потребляющим контекст. Вот пример использования `Context.Provider`:

```tsx
import {ThemeContext} from './ThemeContext';

function App() {
  const theme = {color: 'white', background: 'black'};

  return (
    <ThemeContext.Provider value={theme}>
      <MyComponent />
    </ThemeContext.Provider>
  );
}
```

В этом примере мы импортировали объект `ThemeContext` и создали объект темы с белым цветом текста и черным фоном. Затем мы обернули наш `MyComponent` в компонент `ThemeContext.Provider` и передали объект темы в качестве значения prop. Это сделает объект темы доступным для всех компонентов, которые используют `ThemeContext`.

# Типизация компонентов

## Типизация пропсов компонента

В React компоненты принимают данные через пропсы и могут иметь внутренний стейт. Использование TypeScript позволяет нам явно определить ожидаемые типы данных, что улучшает понимание и предотвращает ошибки на этапе разработки.

Рассмотрим пример функционального компонента:

```tsx
import React, {useState} from 'react';

interface MyComponentProps {
  name: string;
  age: number;
}

const MyComponent: React.FC<MyComponentProps> = ({name, age}) => {
  return (
    <div>
      <p>{`Name: ${name}, Age: ${age}`}</p>
    </div>
  );
};
```

В этом примере мы определяем интерфейс `MyComponentProps` для пропсов, указывая, что они должны содержать `name` (строка) и `age` (число).

## Типизация самого компонента

Давайте типизируем компонент `CustomInput` с использованием `InputHTMLAttributes<HTMLInputElement>` для автоматического включения всех стандартных атрибутов инпута:

```tsx
import React, {InputHTMLAttributes} from 'react';

const CustomInput: React.FC<InputHTMLAttributes<HTMLInputElement>> = ({...inputProps}) => {
  return (
    <input
      {...inputProps} // Включаем все стандартные атрибуты инпута
    />
  );
};

export default CustomInput;
```

В этом примере:

- `React.FC<InputHTMLAttributes<HTMLInputElement>>` - это функциональный компонент, типизированный с использованием `InputHTMLAttributes<HTMLInputElement>`, что позволяет автоматически включить все стандартные атрибуты `<input>`.
- `InputHTMLAttributes` - предоставляет обобщенный тип для HTML-атрибутов элемента `<input>`. Путем передачи этого типа в React.FC мы обеспечиваем правильную типизацию и автоматическое включение всех стандартных атрибутов.
- `{...inputProps}` - спред оператор используется для передачи всех стандартных атрибутов `<input>` в компонент. Это позволяет избежать явного перечисления каждого атрибута, делая компонент более гибким и легко поддерживаемым.

Теперь, при использовании `CustomInput`, любые стандартные атрибуты `<input>`, переданные через пропсы, будут автоматически включены в рендер компонента.

## Типизация event

Давайте разберем типизацию для параметра `event` в функции `handleChange`:

```tsx
import React, {InputHTMLAttributes} from 'react';

const CustomInput: React.FC<InputHTMLAttributes<HTMLInputElement>> = ({...inputProps}) => {
  const [value, setValue] = React.useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return <input {...inputProps} onChange={handleChange} />;
};
export default CustomInput;
```

`React.ChangeEvent<HTMLInputElement>` - это обобщенный тип, предоставляемый React, который представляет событие изменения для элемента `<input>`. В данном случае, мы явно указываем, что событие `event` относится к элементу `<input>`.

Давайте взглянем на другой пример:

```tsx
import React, {ButtonHTMLAttributes} from 'react';

const CustomButton: React.FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({...buttonProps}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log(event);
  };

  return (
    <button {...buttonProps} onClick={handleClick}>
      Submit
    </button>
  );
};
export default CustomButton;
```

`React.MouseEvent<HTMLButtonElement>` - это обобщенный тип события, предоставляемый React. Мы указываем, что это событие относится к элементу `<button>`. C использованием этой типизации TypeScript будет уведомлять вас о доступных свойствах и методах объекта `event`, специфичных для события клика по кнопке.

# Заключение

Внедрение TypeScript в разработку React-приложений предоставляет значительные преимущества в области надежности кода, поддержки и ясности разработки. В данной статье мы рассмотрели основные аспекты типизации, фокусируясь на использовании TypeScript вместе с хуками и компонентами.
Типизация компонентов: Явное указание типов для пропсов и состояний в функциональных и классовых компонентах обеспечивает четкость и предотвращает множество ошибок на этапе разработки.

- **Типизация хуков**: Хуки приобретают дополнительную стабильность и интеллектуальную поддержку благодаря правильному использованию типов.

- **Обработка событий**: Указание типов для параметров событий, таких как `MouseEvent` или `ChangeEvent`, обеспечивает точное понимание взаимодействия с элементами и предотвращает потенциальные ошибки.

- **Безопасность и автодополнение**: TypeScript предоставляет безопасность типов, что снижает вероятность ошибок, а также обеспечивает лучшую поддержку среды разработки через автодополнение и подсказки.

- **Читаемость кода и поддержка**: Явная типизация делает код более читаемым, а также упрощает поддержку и сопровождение кодовой базы.

В целом, использование TypeScript в React улучшает структурированность и надежность приложений, делая их более масштабируемыми и легко поддерживаемыми. Внедрение этого мощного инструмента в процесс разработки позволяет создавать более надежные и устойчивые к изменениям приложения.

Использование TypeScript в React позволяет создавать компоненты, защищенные от runtime-ошибок, и значительно упрощает отладку. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-v-react) вы получите все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
