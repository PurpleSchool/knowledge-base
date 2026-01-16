---
metaTitle: Сегмент components - подробное руководство по components-segment
metaDescription: Разбор сегмента components в системе дизайна - как устроен components-segment его структура настройки и использование в проекте
author: Олег Марков
title: Сегмент components - как использовать components-segment в интерфейсных проектах
preview: Разберем что такое сегмент components - как устроен components-segment и как с ним работать при создании интерфейсных компонентов
---

## Введение

Сегмент components (components-segment) — это логический блок в дизайне или фронтенд-архитектуре, в котором вы описываете и группируете повторно используемые интерфейсные компоненты. Чаще всего он встречается в контексте дизайн-систем, UI-китов или крупных приложений, где компоненты собраны в отдельный модуль проекта, каталог, либо конфигурационный блок.

Смотрите, я покажу вам, как на практике используют такой сегмент:

- как обычно структурируют сегмент components;
- как внутри него организуют базовые, составные и контейнерные компоненты;
- как описывают API компонентов и связи между ними;
- как подключать components-segment в приложение и переиспользовать его;
- как расширять сегмент без нарушения обратной совместимости.

В статье будем опираться на типичный стек фронтенда: React и модульную структуру проекта, но большинство идей можно перенести и на Vue, Angular или любую другую компонентную архитектуру.

---

## Что такое сегмент components (components-segment)

### Основная идея сегмента components

Сегмент components — это выделенная часть проекта, где живут все проектные UI-компоненты. Обычно это:

- отдельная директория в репозитории, например:  
  `src/components` или `packages/components`;
- или отдельный модуль библиотеки, например:  
  `@project/components`, `@company/ui-components`;
- или сегмент в монорепозитории, который собирается в отдельный пакет.

Главная задача компонетного сегмента — отделить:

- логику представления (отображения) от бизнес-логики;
- переиспользуемые компоненты от «страниц» или «фич»;
- общую визуальную систему (кнопки, поля, модальные окна) от частных сценариев.

Когда у вас есть понятный components-segment, вы:

- быстрее находите нужный компонент;
- проще поддерживаете единый стиль интерфейса;
- можете независимо развивать дизайн-систему и прикладной код.

### Типичная структура components-segment

Давайте разберемся на примере, как обычно выглядит структура компонетного сегмента:

```bash
src/
  components/                # Сегмент components - общий каталог UI-компонентов
    index.ts                 # Точка входа - реэкспорт всех компонентов сегмента
    atoms/                   # Простейшие базовые элементы (кнопки, иконки, поля ввода)
      Button/
        Button.tsx
        Button.types.ts
        Button.styles.ts
        index.ts
      Icon/
        Icon.tsx
        Icon.types.ts
        index.ts
    molecules/               # Составные блоки из нескольких атомов
      InputField/
        InputField.tsx
        InputField.types.ts
        index.ts
    organisms/               # Крупные компоненты - виджеты, формы, панели
      FilterPanel/
        FilterPanel.tsx
        FilterPanel.types.ts
        index.ts
    layout/                  # Компоненты верстки - Grid, Container, Stack
      Grid/
        Grid.tsx
        index.ts
    theme/                   # Темизация - токены, переменные, провайдеры
      ThemeProvider.tsx
      tokens.ts
```

Обратите внимание:

- компонент разбит на отдельные файлы: логика, типы, стили;
- внутри сегмента компоненты структурированы по уровням: atoms, molecules, organisms;
- есть общая точка входа `components/index.ts`, которая собирает и экспортирует все компоненты.

---

## Организация кода в components-segment

### Точка входа сегмента components

Задача точки входа — предоставить наружу единый API сегмента components. Теперь вы увидите, как это выглядит в коде:

```ts
// src/components/index.ts

// Реэкспорт атомов
export { Button } from "./atoms/Button";
export type { ButtonProps } from "./atoms/Button/Button.types";

export { Icon } from "./atoms/Icon";
export type { IconProps } from "./atoms/Icon/Icon.types";

// Реэкспорт молекул
export { InputField } from "./molecules/InputField";
export type { InputFieldProps } from "./molecules/InputField/InputField.types";

// Реэкспорт организмов
export { FilterPanel } from "./organisms/FilterPanel";
export type { FilterPanelProps } from "./organisms/FilterPanel/FilterPanel.types";

// Реэкспорт layout
export { Grid } from "./layout/Grid";

// Реэкспорт темы
export { ThemeProvider } from "./theme/ThemeProvider";
export * as themeTokens from "./theme/tokens";
```

Комментарий:

- вы формируете стабильный внешний контракт для всего сегмента;
- внутри можно переставлять файлы, но импорт вида  
  `import { Button } from "components";`  
  останется прежним.

Это сильно помогает при рефакторинге: вы меняете структуру внутри сегмента, но не ломаете весь проект.

### Структура отдельного компонента в сегменте

Теперь давайте посмотрим, как описывается один компонент внутри components-segment. Возьмем простой пример `Button`.

```tsx
// src/components/atoms/Button/Button.types.ts

// Здесь мы описываем публичный интерфейс пропсов кнопки
export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  // Текст внутри кнопки
  children: React.ReactNode;
  // Вариант оформления кнопки
  variant?: ButtonVariant;
  // Флаг отключения
  disabled?: boolean;
  // Обработчик клика
  onClick?: () => void;
  // Дополнительный CSS-класс для кастомизации
  className?: string;
}
```

```tsx
// src/components/atoms/Button/Button.styles.ts

import styled from "styled-components";
import type { ButtonVariant } from "./Button.types";

// Здесь мы описываем базовый styled-компонент для кнопки
export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $disabled?: boolean;
}>`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  // Обратите внимание - в зависимости от варианта оформления
  // меняется фон и цвет текста
  background-color: ${({ $variant }) =>
    $variant === "primary" ? "#007bff" : "#ffffff"};
  color: ${({ $variant }) =>
    $variant === "primary" ? "#ffffff" : "#333333"};
  border: 1px solid
    ${({ $variant }) => ($variant === "primary" ? "#007bff" : "#cccccc")};

  // Состояние disabled - обесцвечиваем и убираем курсор
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;
```

```tsx
// src/components/atoms/Button/Button.tsx

import React from "react";
import { StyledButton } from "./Button.styles";
import type { ButtonProps } from "./Button.types";

// Здесь мы описываем React-компонент - обертку над стилями и пропсами
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  disabled,
  onClick,
  className,
}) => {
  // Обратите внимание - мы прокидываем в StyledButton только нужные свойства
  return (
    <StyledButton
      $variant={variant}
      $disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {children}
    </StyledButton>
  );
};
```

```ts
// src/components/atoms/Button/index.ts

// Здесь мы упрощаем импорт - наружу экспортируем только сам компонент и типы
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant } from "./Button.types";
```

Здесь я размещаю пример максимально подробной структуры файла, чтобы вам было проще понять:

- где описываются типы;
- где оформляются стили;
- где логика компонента;
- как это собирается в публичный экспорт.

---

## Типы компонентов внутри сегмента

### Атомы

Атомы — минимальные по смыслу элементы: кнопки, иконки, чекбоксы, поля ввода. В сегменте components они обычно лежат в подпапке `atoms`.

Атомы:

- не знают о бизнес-логике;
- не содержат сетевых запросов;
- делегируют состояние вверх (через пропсы и колбэки).

Пример атома `Checkbox`:

```tsx
// src/components/atoms/Checkbox/Checkbox.tsx

import React from "react";

export interface CheckboxProps {
  checked: boolean;          // Текущее состояние
  label?: string;            // Подпись справа от чекбокса
  onChange: (value: boolean) => void;  // Колбэк при изменении
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  label,
  onChange,
}) => {
  // Здесь мы обрабатываем клик по чекбоксу и передаем новое значение наружу
  const handleChange = () => {
    onChange(!checked);
  };

  return (
    <label>
      <input type="checkbox" checked={checked} onChange={handleChange} />
      {label && <span>{label}</span>}
    </label>
  );
};
```

### Молекулы

Молекулы — это сочетание нескольких атомов. Например, `InputField` может включать:

- label;
- сам `input`;
- иконку ошибки;
- текст ошибки.

Покажу вам, как это реализовано на практике:

```tsx
// src/components/molecules/InputField/InputField.tsx

import React from "react";
import type { InputHTMLAttributes } from "react";
import { Checkbox } from "../../atoms/Checkbox";

export interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;          // Подпись над полем
  error?: string;          // Текст ошибки
  required?: boolean;      // Флаг обязательного поля
  withAgreement?: boolean; // Флаг дополнительного чекбокса согласия
}

// Здесь мы объединяем несколько атомов в один составной компонент
export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  required,
  withAgreement,
  ...inputProps
}) => {
  const [agreement, setAgreement] = React.useState(false);

  return (
    <div>
      {label && (
        <label>
          {label}
          {required && <span>*</span>}
        </label>
      )}

      <input {...inputProps} />

      {error && <div style={{ color: "red" }}>{error}</div>}

      {withAgreement && (
        <div style={{ marginTop: 8 }}>
          <Checkbox
            checked={agreement}
            onChange={setAgreement}
            label="Согласен с условиями"
          />
        </div>
      )}
    </div>
  );
};
```

Здесь важно:

- молекула использует атомы из того же сегмента components;
- логику хранения состояния (например, `agreement`) можно оставить здесь, если это локальное UI-состояние, не связанное с бизнес-логикой;
- молекула всё равно остается переиспользуемой и не привязывается к конкретной странице.

### Организмы и layout

Организмы — это уже большие компоненты: фильтры, панели, карточки с формами. Layout-компоненты — гриды, контейнеры, флекс-обертки.

Пример layout-компонента `Stack`:

```tsx
// src/components/layout/Stack/Stack.tsx

import React from "react";

export interface StackProps {
  direction?: "row" | "column"; // Направление элементов
  gap?: number;                 // Отступ между элементами
  children: React.ReactNode;    // Вложенные элементы
}

// Stack - простой компоновочный компонент
export const Stack: React.FC<StackProps> = ({
  direction = "row",
  gap = 8,
  children,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap,
      }}
    >
      {children}
    </div>
  );
};
```

Организмы очень зависят от конкретного проекта, но общая идея:

- внутри организма вы используете атомы, молекулы, layout из того же сегмента;
- бизнес-логику стараетесь выносить либо наверх (в фичи), либо инкапсулировать так, чтобы компонент можно было переиспользовать на разных экранах.

---

## Темизация в components-segment

### Токены и ThemeProvider

Чтобы сегмент components не был жестко привязан к одному визуальному стилю, обычно вводят тему и токены. Токены — это абстрактные значения цветов, отступов, размеров шрифтов.

Вот простой пример токенов:

```ts
// src/components/theme/tokens.ts

// Здесь мы описываем базовые токены темы
export const colors = {
  primary: "#007bff",
  primaryText: "#ffffff",
  secondary: "#ffffff",
  secondaryText: "#333333",
  border: "#cccccc",
  danger: "#dc3545",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

export const radius = {
  sm: 4,
  md: 8,
};
```

Теперь давайте перейдем к провайдеру темы:

```tsx
// src/components/theme/ThemeProvider.tsx

import React from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import * as tokens from "./tokens";

export interface ThemeProviderProps {
  children: React.ReactNode;
}

// Здесь мы создаем ThemeProvider для всей дизайн-системы
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // В простом варианте мы просто передаем токены в styled-components
  const theme = React.useMemo(
    () => ({
      colors: tokens.colors,
      spacing: tokens.spacing,
      radius: tokens.radius,
    }),
    []
  );

  return <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>;
};
```

Обратите внимание, как этот фрагмент кода решает задачу:

- компоненты внутри сегмента будут использовать `props.theme`;
- внешний код просто оборачивает приложение в `ThemeProvider` из components-сегмента.

### Использование токенов в компонентах

Покажу вам, как это выглядит в коде:

```tsx
// src/components/atoms/Button/Button.styles.ts

import styled from "styled-components";
import type { ButtonVariant } from "./Button.types";

export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $disabled?: boolean;
}>`
  padding: ${({ theme }) => theme.spacing.sm}px
    ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  font-size: 14px;

  // Здесь мы используем токены темы - никакого "жесткого" цвета
  background-color: ${({ theme, $variant }) =>
    $variant === "primary" ? theme.colors.primary : theme.colors.secondary};
  color: ${({ theme, $variant }) =>
    $variant === "primary"
      ? theme.colors.primaryText
      : theme.colors.secondaryText};
  border: 1px solid
    ${({ theme }) => theme.colors.border};

  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;
```

Так вы отвязываете сегмент components от конкретных значений и делаете его настраиваемым.

---

## Использование сегмента components в приложении

### Подключение через общий индекс

Обычно в приложении подключают components-segment одной строкой:

```tsx
// src/app/App.tsx

import React from "react";
// Мы импортируем все нужные компоненты из сегмента components
import { ThemeProvider, Button, InputField, Stack } from "../components";

export const App: React.FC = () => {
  const [value, setValue] = React.useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Здесь мы обновляем локальное состояние инпута
    setValue(event.target.value);
  };

  return (
    <ThemeProvider>
      {/* Оборачиваем всё приложение в ThemeProvider из сегмента components */}
      <Stack direction="column" gap={16}>
        <InputField
          label="Ваше имя"
          placeholder="Введите имя"
          value={value}
          onChange={handleChange}
        />

        <Button onClick={() => alert(`Здравствуйте, ${value || "гость"}`)}>
          Сохранить
        </Button>
      </Stack>
    </ThemeProvider>
  );
};
```

Здесь вы видите классический сценарий:

- компоненты не знают, где они используются;
- компоненты отвечают только за отображение и небольшое UI-состояние;
- все компоненты приходят из одного сегмента — `../components`.

### Импорт по уровням

Иногда нужно разграничить доступ к компонентам, особенно если сегмент большой. Например, вы можете разрешить внешнему коду использовать только `molecules` и `organisms`, а `atoms` оставить как внутреннюю деталь.

В таком случае `index.ts` может реэкспортировать только нужные уровни:

```ts
// src/components/index.ts

// Наружу отдаем только молекулы и организмы
export { InputField } from "./molecules/InputField";
export { FilterPanel } from "./organisms/FilterPanel";

// Атомы остаются внутренними - без реэкспорта
```

Тогда в приложении нельзя будет случайно завязаться на внутренний атом, который вы планируете часто менять.

---

## Правила и ограничения внутри components-segment

### Чего не должно быть в сегменте components

Чтобы сегмент components оставался стабильным и переиспользуемым, обычно вводят ограничения:

- никаких прямых запросов к API;
- минимум бизнес-логики;
- отсутствие привязки к конкретным сущностям домена (например, User, Order, Invoice) внутри базовых компонентов.

Например, вместо компонента `UserCard` в базовом сегменте компонентов лучше сделать:

- универсальный `Card`;
- универсальный `Avatar`;
- далее собрать `UserCard` либо в отдельном слое (features), либо в отдельном сегменте доменных компонентов.

### Чего в сегменте быть должно

Вместо этого в components-segment стоит держать:

- общие элементы интерфейса (кнопки, поля, иконки);
- сложные, но при этом абстрактные компоненты (таблицы, модальные окна, навигацию);
- layout-компоненты и обертки;
- общее оформление (тема, токены, общие стили) — при условии, что они не завязаны на конкретный продукт.

---

## Версионирование и развитие сегмента components

### Контракт и обратная совместимость

Сегмент components обычно воспринимается командой как библиотека. У него есть публичный контракт:

- экспортируемые компоненты;
- их пропсы и типы;
- события и слоты (если речь не о React, а, например, о Vue).

При изменениях важно:

- не ломать уже существующие контракты без веской причины;
- при необходимости вводить новые пропсы, помечать старые как устаревшие;
- давать разработчикам время на миграцию.

Например, вы хотите переименовать проп `variant` в `appearance`. Вместо жёсткого удаления можно сделать так:

```tsx
// src/components/atoms/Button/Button.tsx

import React from "react";
import { StyledButton } from "./Button.styles";
import type { ButtonProps } from "./Button.types";

export const Button: React.FC<ButtonProps> = ({
  children,
  variant,      // устаревшее название
  appearance,   // новое название
  disabled,
  onClick,
  className,
}) => {
  // Здесь мы поддерживаем оба пропса какое-то время
  const finalAppearance = appearance ?? variant ?? "primary";

  return (
    <StyledButton
      $variant={finalAppearance}
      $disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {children}
    </StyledButton>
  );
};
```

Так вы сохраняете работоспособность старого кода и даете возможность постепенно перейти на новое API.

### Переиспользование в нескольких проектах

Если сегмент components получился удачным, его выносят:

- либо в отдельный пакет (npm, частный регистр);
- либо в отдельный репозиторий с версионированием.

Минимальная схема:

1. Вынести `src/components` в отдельный пакет, например `@company/ui`.
2. Настроить сборку (Rollup, Vite, Webpack) так, чтобы экспортировать только публичный API.
3. Внутри приложения использовать этот пакет как обычную зависимость.

Важно:

- явно указывать peerDependencies (React, styled-components и так далее), чтобы не дублировать их в бандле;
- следить за размером пакета и не тянуть в него лишние библиотеки.

---

## Документация и каталог в components-segment

### Живой каталог компонентов

Чтобы сегмент components не превратился в «черный ящик», обычно делают живую документацию:

- Storybook;
- Ladle;
- Styleguidist;
- собственное playground-приложение.

Смотрите, я покажу вам, как это может выглядеть на примере Storybook:

```tsx
// src/components/atoms/Button/Button.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

// Здесь мы описываем метаинформацию о компоненте для Storybook
const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
};

export default meta;

// Здесь мы описываем несколько историй - разных состояний кнопки
export const Primary: StoryObj<typeof Button> = {
  args: {
    children: "Primary button",
    variant: "primary",
  },
};

export const Secondary: StoryObj<typeof Button> = {
  args: {
    children: "Secondary button",
    variant: "secondary",
  },
};
```

Это позволяет:

- увидеть все компоненты сегмента на одной витрине;
- понять, какие пропсы компонент принимает и как на них реагирует;
- согласовывать дизайн с UX-дизайнерами прямо в каталоге.

---

## Тестирование компонентов в сегменте

### Юнит-тесты

Для базовых компонентов важно писать хотя бы минимальные юнит-тесты, чтобы не ломать их поведение при рефакторинге.

Давайте посмотрим, что происходит в следующем примере:

```tsx
// src/components/atoms/Button/Button.test.tsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

test("Button вызывает onClick при клике", () => {
  // Здесь мы создаем мок-функцию для проверки вызова
  const handleClick = jest.fn();

  render(<Button onClick={handleClick}>Нажми меня</Button>);

  // Ищем по тексту
  const button = screen.getByText("Нажми меня");

  // Имитируем клик
  fireEvent.click(button);

  // Проверяем, что обработчик был вызван
  expect(handleClick).toHaveBeenCalled();
});

test("Button не вызывает onClick когда disabled", () => {
  const handleClick = jest.fn();

  render(
    <Button disabled onClick={handleClick}>
      Нажми меня
    </Button>
  );

  const button = screen.getByText("Нажми меня");
  fireEvent.click(button);

  // Здесь мы убеждаемся, что обработчик не сработал
  expect(handleClick).not.toHaveBeenCalled();
});
```

Такие тесты защищают сегмент components от случайных регрессий, особенно когда компоненты массово переиспользуются в проекте.

---

## Практические рекомендации по работе с components-segment

### Как добавлять новый компонент

Удобный и предсказуемый процесс такой:

1. Определить, к какому уровню относится компонент: atom, molecule, organism, layout.
2. Создать директорию компонента, завести минимум файлов:
   - `Component.tsx` — код;
   - `Component.types.ts` — типы;
   - `Component.styles.ts` — стили;
   - `index.ts` — локальный экспорт.
3. Добавить компонент в публичный индекс сегмента (если он должен быть доступен внешнему коду).
4. Добавить сториз в Storybook.
5. При необходимости покрыть ключевой сценарий юнит-тестом.

### Как изменять существующий компонент

Когда нужно поменять компонент:

1. Сначала оцените, является ли изменение обратноссовместимым.
2. Если нет:
   - по возможности введите новый проп вместо изменения существующего;
   - либо создайте новый компонент и пометьте старый как устаревший.
3. Обновите документацию (сториз, README, комментарии).
4. Пробегитесь по проекту и проверьте, где компонент используется.

---

## Заключение

Сегмент components (components-segment) — это фундаментальный блок архитектуры UI, который позволяет:

- централизованно управлять всеми интерфейсными компонентами;
- поддерживать единый визуальный стиль через тему и токены;
- переиспользовать одни и те же элементы в разных частях приложения и даже в разных проектах;
- развивать дизайн-систему независимо от бизнес-логики.

Структурируя components-segment по уровням (atoms, molecules, organisms, layout), вы облегчаете навигацию по коду и повышаете предсказуемость разработки. Использование общей точки входа и четкого API делает сегмент устойчивым к изменениям и удобным для интеграции.

Подход, о котором мы говорили, не привязан к конкретному фреймворку: вы можете применять те же принципы в Vue, Angular, Svelte или веб-компонентах. Главное — воспринимать components-segment как отдельную, хорошо спроектированную библиотеку UI-компонентов, а не просто как папку с разрозненными файлами.

---

## Частозадаваемые технические вопросы по теме

### Как разделить components-segment на общий и продуктовый набор компонентов

Если у вас несколько продуктов, сделайте два уровня:

- базовый пакет `@company/ui` с нейтральными абстрактными компонентами;
- продуктовый пакет `@company/product-ui`, который зависит от базового и добавляет доменные компоненты.

В коде продуктового пакета переиспользуйте атомы и молекулы из базового, а организмы собирайте уже под задачи конкретного продукта.

### Как подключить components-segment в монорепозитории

Частая схема:

1. Создаете пакет `packages/components`.
2. В корне монорепозитория настраиваете yarn workspaces или pnpm workspaces.
3. В приложении импортируете компоненты: `import { Button } from "@company/components";`.

Важно не забыть:

- правильно прописать `main`, `module`, `types` в `package.json` пакета с компонентами;
- использовать относительные пути внутри пакета, а не пути из приложения.

### Как использовать components-segment без styled-components

Если вы не хотите использовать styled-components, сделайте слой стилей абстрактным:

- либо через CSS-модули и className;
- либо через Tailwind и набор утилитных классов;
- либо через обычные CSS или SCSS-файлы.

Внутри компонентов передавайте `className` и комбинируйте его с базовыми классами, а сегмент стилей держите рядом, но независимым от логики.

### Как поступать с иконками в сегменте components

Обычно в components-segment создают отдельный Icon-компонент:

- он принимает имя иконки и размер;
- внутри использует спрайт, SVG-импорт или шрифт иконок.

Пример: `Icon name="search" size={16}`. Конкретные SVG-файлы лежат в подпапке `icons`, а Icon-компонент инкапсулирует способ их подключения.

### Как внедрить storybook только для сегмента components

Разместите конфигурацию Storybook в каталоге сегмента, а не всего приложения:

- `components/.storybook` с конфигами;
- `components/src` как корень сториз.

В `main.js` пропишите путь к сториз вида `"../src/**/*.stories.@(js|jsx|ts|tsx)"`. Запускайте Storybook через отдельный скрипт, например `yarn storybook:components`. Так вы отделите документацию сегмента components от остального приложения.