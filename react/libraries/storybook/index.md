---
metaTitle: Storybook для React - документация компонентов и разработка UI в изоляции
metaDescription: Как настроить и использовать Storybook в React проекте. Написание Stories, документирование компонентов, аддоны, тестирование и интеграция с TypeScript
author: Олег Марков
title: Storybook - документация компонентов
preview: Полное руководство по Storybook для React. Установка, написание Stories, документирование UI-компонентов в изоляции, работа с аддонами и тестирование
---

## Введение

При разработке крупных React-приложений быстро возникает проблема: компоненты становятся сложными, их трудно тестировать изолированно, а документация быстро устаревает. Storybook — это инструмент разработки пользовательских интерфейсов, который позволяет создавать, документировать и тестировать компоненты в полной изоляции от основного приложения.

В этой статье вы узнаете, что такое Storybook и зачем он нужен, как установить и настроить его в React-проекте, научитесь писать истории (stories) для компонентов, работать с аддонами, документировать props с помощью TypeScript, а также интегрировать Storybook в процесс разработки и CI/CD.

## Что такое Storybook и зачем он нужен

Storybook — это среда разработки, которая позволяет работать с компонентами в полной изоляции. Каждый компонент отображается в отдельной «истории» (story), где вы можете задавать любые props и наблюдать за поведением компонента без необходимости запускать всё приложение.

### Основные преимущества Storybook

- **Разработка в изоляции.** Вы создаёте компоненты без зависимости от состояния приложения, маршрутизации или API.
- **Живая документация.** Stories — это одновременно документация и демонстрация компонента. Она всегда актуальна, так как тесно связана с кодом.
- **Визуальное тестирование.** Вы можете визуально проверять компоненты во всех возможных состояниях: загрузка, ошибка, пустое состояние, заполненное состояние.
- **Совместная работа.** Дизайнеры, менеджеры и тестировщики могут просматривать компоненты без необходимости запускать код.
- **Переиспользование компонентов.** Storybook стимулирует создание универсальных компонентов, которые легко переиспользовать в разных частях приложения.

### Когда стоит использовать Storybook

Storybook особенно полезен, когда:
- Команда разрабатывает дизайн-систему или библиотеку компонентов.
- Над проектом работают несколько разработчиков, и важна согласованность UI.
- Компоненты имеют множество состояний, которые сложно воспроизвести в реальном приложении.
- Нужна документация, которую могут читать нетехнические члены команды.

## Установка и настройка Storybook в React проекте

### Автоматическая установка

Storybook предоставляет удобный инициализатор, который автоматически обнаруживает используемый фреймворк и настраивает всё необходимое.

Для существующего React-проекта выполните:

```bash
npx storybook@latest init
```

Команда автоматически:
- Определит, что вы используете React (с Vite или Webpack).
- Установит необходимые зависимости.
- Создаст конфигурационный файл `.storybook/main.ts`.
- Создаст файл с настройками предварительного просмотра `.storybook/preview.ts`.
- Добавит примеры stories в папку `src/stories/`.
- Добавит скрипты в `package.json`.

После установки запустите Storybook:

```bash
npm run storybook
```

По умолчанию Storybook запускается на порту `6006`. Откройте `http://localhost:6006` в браузере.

### Ручная установка

Если автоматическая установка не подходит, установите зависимости вручную:

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
npm install --save-dev @storybook/react-vite  # для Vite
# или
npm install --save-dev @storybook/react-webpack5  # для Webpack
```

Создайте конфигурацию `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
```

### Структура проекта с Storybook

Рекомендованная структура проекта:

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx    ← stories рядом с компонентом
│   │   └── Button.test.tsx
│   ├── Input/
│   │   ├── Input.tsx
│   │   └── Input.stories.tsx
│   └── ...
.storybook/
├── main.ts
└── preview.ts
```

Размещение файлов stories рядом с компонентом — наиболее распространённый подход, так как упрощает навигацию и поиск.

## Написание Stories

### Формат Component Story Format (CSF)

Начиная со Storybook 6, рекомендуется использовать формат CSF (Component Story Format) на основе ES-модулей. Это стандартный способ написания stories.

Пример базового файла story для кнопки:

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

// Метаданные компонента
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],  // автоматически генерирует документацию
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    disabled: {
      control: "boolean",
    },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Первая история — основное состояние
export const Primary: Story = {
  args: {
    label: "Нажми меня",
    variant: "primary",
  },
};

// Вторая история — вторичный вариант
export const Secondary: Story = {
  args: {
    label: "Вторичная кнопка",
    variant: "secondary",
  },
};

// История для задисабленного состояния
export const Disabled: Story = {
  args: {
    label: "Недоступно",
    disabled: true,
  },
};

// История с большим текстом
export const LongText: Story = {
  args: {
    label: "Кнопка с очень длинным текстом, который может не уместиться",
  },
};
```

### Понимание структуры Story

Каждый файл stories экспортирует:

1. **Default export** — метаданные компонента (meta).
2. **Named exports** — отдельные истории (stories).

В meta вы указываете:
- `title` — путь в навигационном меню Storybook (например, `"UI/Button"` создаёт группу "UI" с элементом "Button").
- `component` — сам React-компонент.
- `argTypes` — описание props и элементы управления для них.
- `parameters` — дополнительные настройки (layout, backgrounds и т.д.).

### Args и ArgTypes

**Args** — это props компонента в контексте Storybook. Они позволяют динамически менять props через интерфейс Storybook без изменения кода.

```typescript
// Компонент Badge
interface BadgeProps {
  count: number;
  color: "red" | "blue" | "green";
  size: "small" | "medium" | "large";
}

const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    count: {
      control: { type: "number", min: 0, max: 99 },
      description: "Число для отображения в бейдже",
    },
    color: {
      control: "select",
      options: ["red", "blue", "green"],
      description: "Цвет бейджа",
    },
    size: {
      control: "radio",
      options: ["small", "medium", "large"],
      description: "Размер бейджа",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 5,
    color: "red",
    size: "medium",
  },
};
```

### Типы controls для ArgTypes

Storybook поддерживает разные типы элементов управления:

| Тип | Описание | Когда использовать |
|-----|----------|-------------------|
| `"text"` | Текстовое поле | Для строковых значений |
| `"number"` | Числовое поле | Для числовых значений |
| `"boolean"` | Переключатель | Для булевых значений |
| `"select"` | Выпадающий список | Для фиксированного набора вариантов |
| `"radio"` | Радиокнопки | Для небольшого набора вариантов |
| `"color"` | Выбор цвета | Для цветовых значений |
| `"date"` | Выбор даты | Для значений дат |
| `"range"` | Ползунок | Для числовых диапазонов |
| `"object"` | JSON-редактор | Для объектов |
| `"file"` | Загрузка файла | Для файловых props |

### Stories для составных компонентов

Иногда компонент требует контекста или обёртки для корректной работы. Используйте декораторы:

```typescript
// Card.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "400px", padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Заголовок карточки",
    description: "Описание карточки с некоторым текстом",
    imageUrl: "https://via.placeholder.com/400x200",
  },
};

export const WithLongContent: Story = {
  args: {
    title: "Карточка с длинным содержимым",
    description:
      "Это очень длинное описание, которое проверяет, как карточка обрабатывает большое количество текста. " +
      "Текст продолжается и продолжается, чтобы убедиться в корректном отображении.",
  },
};
```

### Play Functions — интерактивные stories

Play functions позволяют симулировать взаимодействие пользователя прямо в story:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { LoginForm } from "./LoginForm";

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Находим поля ввода
    const emailInput = canvas.getByLabelText("Email");
    const passwordInput = canvas.getByLabelText("Пароль");
    const submitButton = canvas.getByRole("button", { name: "Войти" });

    // Имитируем ввод данных
    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "секретный-пароль");

    // Нажимаем кнопку
    await userEvent.click(submitButton);

    // Проверяем результат
    await expect(
      canvas.getByText("Вход выполнен успешно")
    ).toBeInTheDocument();
  },
};

export const EmptyValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole("button", { name: "Войти" });

    // Пытаемся отправить пустую форму
    await userEvent.click(submitButton);

    // Проверяем появление ошибок валидации
    await expect(canvas.getByText("Email обязателен")).toBeInTheDocument();
    await expect(canvas.getByText("Пароль обязателен")).toBeInTheDocument();
  },
};
```

## Конфигурация и настройка

### Файл preview.ts

Файл `.storybook/preview.ts` применяет глобальные настройки ко всем stories:

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import "../src/index.css"; // Импорт глобальных стилей

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#333333",
        },
        {
          name: "gray",
          value: "#f5f5f5",
        },
      ],
    },
  },
  // Глобальные декораторы для всех stories
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
```

### Настройка для Tailwind CSS

Если вы используете Tailwind CSS, добавьте импорт стилей в preview:

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import "../src/app/globals.css"; // или путь к вашему CSS с Tailwind

const preview: Preview = {
  parameters: {
    // ... другие параметры
  },
};

export default preview;
```

### Настройка псевдонимов путей

Если вы используете псевдонимы (`@/components`), настройте их в `main.ts`:

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinalConfig: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
    };
    return config;
  },
};

export default config;
```

Для Webpack:

```typescript
// .storybook/main.ts для Webpack
import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";

const config: StorybookConfig = {
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname, "../src"),
      };
    }
    return config;
  },
};

export default config;
```

## Работа с аддонами

### Essentials (базовый набор аддонов)

`@storybook/addon-essentials` включает набор наиболее используемых аддонов:

- **Controls** — панель для изменения props в реальном времени.
- **Actions** — логирование событий (например, клики на кнопки).
- **Backgrounds** — переключение фона для предпросмотра.
- **Viewport** — эмуляция разных размеров экранов.
- **Docs** — автоматическая генерация документации.
- **Outline** — отображение контуров элементов.
- **Measure** — измерение размеров элементов.

### Аддон Actions

Аддон Actions позволяет отслеживать вызовы функций-обработчиков:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    // fn() создаёт шпиона (spy), который логирует вызовы
    onClick: fn(),
    onFocus: fn(),
    onBlur: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "Нажми меня",
  },
};
```

Теперь при клике на кнопку в панели "Actions" будет отображаться лог вызовов.

### Аддон Controls

Controls автоматически генерирует UI для изменения props, основываясь на TypeScript-типах или PropTypes:

```typescript
interface InputProps {
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number";
  size?: "sm" | "md" | "lg";
  error?: string;
}
```

Storybook автоматически определит типы и создаст соответствующие элементы управления:
- `placeholder` → текстовое поле
- `disabled` → переключатель
- `type` → выпадающий список с вариантами
- `size` → выпадающий список с вариантами
- `error` → текстовое поле

### Аддон Viewport

Позволяет тестировать компонент на разных размерах экранов. По умолчанию включены стандартные разрешения, но вы можете добавить свои:

```typescript
// .storybook/preview.ts
const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "900px" },
        },
      },
      defaultViewport: "desktop",
    },
  },
};
```

### Установка дополнительных аддонов

```bash
# Аддон для a11y тестирования
npm install --save-dev @storybook/addon-a11y

# Аддон для тестирования взаимодействий
npm install --save-dev @storybook/addon-interactions

# Аддон для визуального тестирования с Chromatic
npm install --save-dev @chromatic-com/storybook
```

Добавьте аддоны в конфигурацию:

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook",
  ],
};
```

## Автоматическая документация с TypeScript

### Теги autodocs

Добавьте тег `"autodocs"` в meta, и Storybook автоматически создаст страницу документации на основе TypeScript-типов и JSDoc-комментариев:

```typescript
// Input.tsx
interface InputProps {
  /** Текст-заглушка, отображаемый когда поле пустое */
  placeholder?: string;
  /** Тип поля ввода */
  type?: "text" | "email" | "password" | "number";
  /** Блокирует взаимодействие с полем */
  disabled?: boolean;
  /** Текст ошибки валидации */
  error?: string;
  /** Обработчик изменения значения */
  onChange?: (value: string) => void;
}

// Input.stories.tsx
const meta: Meta<typeof Input> = {
  component: Input,
  tags: ["autodocs"],
};
```

Storybook автоматически создаст таблицу с описанием всех props, включая:
- Имя prop.
- Тип prop (из TypeScript).
- Значение по умолчанию.
- Описание из JSDoc-комментария.
- Элемент управления для изменения значения.

### MDX документация

Для более подробной документации используйте MDX-файлы:

```mdx
{/* Button.mdx */}
import { Canvas, Meta, Controls } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";

<Meta of={ButtonStories} />

# Button

Компонент кнопки — базовый элемент интерактивного интерфейса.
Используется для запуска действий и навигации.

## Когда использовать

- Для отправки форм
- Для запуска важных действий
- Для навигации, когда нужен визуальный акцент

## Использование

<Canvas of={ButtonStories.Primary} />

## Props

<Controls />

## Варианты

### Основная кнопка

<Canvas of={ButtonStories.Primary} />

### Вторичная кнопка

<Canvas of={ButtonStories.Secondary} />

### Опасное действие

<Canvas of={ButtonStories.Destructive} />
```

## Примеры Stories для распространённых компонентов

### Story для компонента форм

```typescript
// FormField.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Forms/FormField",
  component: FormField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email адрес",
    placeholder: "введите@email.com",
    type: "email",
  },
};

export const WithError: Story = {
  args: {
    label: "Email адрес",
    placeholder: "введите@email.com",
    type: "email",
    error: "Введите корректный email адрес",
    value: "некорректный-email",
  },
};

export const Disabled: Story = {
  args: {
    label: "Email адрес",
    placeholder: "введите@email.com",
    disabled: true,
    value: "user@example.com",
  },
};

export const Required: Story = {
  args: {
    label: "Email адрес",
    placeholder: "введите@email.com",
    required: true,
  },
};
```

### Story для компонента с данными

```typescript
// UserCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { UserCard } from "./UserCard";

const mockUser = {
  id: "1",
  name: "Иван Петров",
  email: "ivan@example.com",
  role: "Разработчик",
  avatarUrl: "https://i.pravatar.cc/150?img=3",
  isOnline: true,
};

const meta: Meta<typeof UserCard> = {
  title: "Cards/UserCard",
  component: UserCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    user: mockUser,
  },
};

export const Offline: Story = {
  args: {
    user: { ...mockUser, isOnline: false },
  },
};

export const WithoutAvatar: Story = {
  args: {
    user: { ...mockUser, avatarUrl: undefined },
  },
};

export const LongName: Story = {
  args: {
    user: {
      ...mockUser,
      name: "Александр Николаевич Краснопольский",
      role: "Старший инженер по разработке программного обеспечения",
    },
  },
};
```

### Story для компонента с загрузкой

```typescript
// DataTable.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./DataTable";

const mockData = [
  { id: 1, name: "Продукт А", price: 1200, stock: 45 },
  { id: 2, name: "Продукт Б", price: 850, stock: 12 },
  { id: 3, name: "Продукт В", price: 2300, stock: 0 },
];

const meta: Meta<typeof DataTable> = {
  title: "Data/DataTable",
  component: DataTable,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: {
    data: mockData,
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    data: [],
    isLoading: false,
    error: "Не удалось загрузить данные. Проверьте соединение с интернетом.",
  },
};

export const Empty: Story = {
  args: {
    data: [],
    isLoading: false,
    error: null,
  },
};
```

## Тестирование с помощью Storybook

### Storybook как основа для тестов

Stories можно переиспользовать в unit-тестах, что устраняет дублирование:

```typescript
// Button.test.tsx
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import * as stories from "./Button.stories";

// composeStories применяет все декораторы и параметры из stories
const { Primary, Disabled } = composeStories(stories);

test("рендерит основную кнопку", () => {
  render(<Primary />);
  expect(screen.getByRole("button")).toBeInTheDocument();
  expect(screen.getByText("Нажми меня")).toBeInTheDocument();
});

test("кнопка задисаблена", () => {
  render(<Disabled />);
  expect(screen.getByRole("button")).toBeDisabled();
});
```

### Визуальное тестирование с Chromatic

Chromatic — облачный сервис для визуального регрессионного тестирования, разработанный командой Storybook:

```bash
npm install --save-dev chromatic
```

Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "chromatic": "chromatic --project-token=<ваш-токен>"
  }
}
```

Запустите тесты:

```bash
npm run chromatic
```

Chromatic сделает скриншот каждой story и сравнит с предыдущей версией. При обнаружении визуальных изменений потребуется подтверждение.

### Интеграция с GitHub Actions

```yaml
# .github/workflows/chromatic.yml
name: "Chromatic"

on: push

jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install dependencies
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Организация и масштабирование

### Именование и группировка stories

Используйте `title` в meta для организации stories в дерево навигации:

```typescript
// Группировка по категориям
title: "UI/Atoms/Button"       // UI > Atoms > Button
title: "UI/Molecules/Card"     // UI > Molecules > Card
title: "UI/Organisms/Header"   // UI > Organisms > Header
title: "Pages/Home"            // Pages > Home
title: "Features/Auth/Login"   // Features > Auth > Login
```

### Глобальные декораторы и провайдеры

Для компонентов, которым нужны провайдеры контекста, настройте глобальные декораторы:

```typescript
// .storybook/preview.tsx
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "../src/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Story />
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
};

export default preview;
```

### Мокирование API запросов

Для компонентов, выполняющих API-запросы, используйте Mock Service Worker (MSW):

```bash
npm install --save-dev msw msw-storybook-addon
```

```typescript
// .storybook/preview.ts
import { initialize, mswLoader } from "msw-storybook-addon";

initialize();

const preview: Preview = {
  loaders: [mswLoader],
};
```

Теперь в stories можно мокировать API:

```typescript
// UserProfile.stories.tsx
import { http, HttpResponse } from "msw";

const meta: Meta<typeof UserProfile> = {
  component: UserProfile,
};

export const LoadedProfile: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/user/1", () => {
          return HttpResponse.json({
            id: 1,
            name: "Иван Петров",
            email: "ivan@example.com",
          });
        }),
      ],
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/user/1", async () => {
          // Имитируем медленный запрос
          await new Promise((resolve) => setTimeout(resolve, 30000));
          return HttpResponse.json({});
        }),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/user/1", () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
};
```

## Публикация документации

### Сборка статического сайта

Storybook можно собрать как статический сайт для деплоя:

```bash
npm run build-storybook
```

По умолчанию статические файлы сохраняются в папку `storybook-static`.

Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Деплой на GitHub Pages

```yaml
# .github/workflows/storybook.yml
name: Deploy Storybook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

## Распространённые проблемы и решения

### Storybook не находит компоненты

Убедитесь, что паттерн в `stories` в конфигурации охватывает ваши файлы:

```typescript
// main.ts
const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",  // CSF формат
    "../src/**/*.mdx",  // MDX документация
  ],
};
```

### Ошибки с CSS модулями

Для Webpack добавьте обработчик CSS модулей:

```typescript
// main.ts (Webpack)
const config: StorybookConfig = {
  webpackFinal: async (config) => {
    const cssRule = config.module?.rules?.find(
      (rule) => rule && typeof rule === "object" && String(rule.test).includes("css")
    );
    // Настройте CSS modules здесь
    return config;
  },
};
```

### Проблемы с Next.js

Для проектов Next.js используйте специальный фреймворк:

```bash
npm install --save-dev @storybook/nextjs
```

```typescript
// main.ts
const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
};
```

`@storybook/nextjs` автоматически обрабатывает:
- Псевдонимы путей (`@/components`).
- Компоненты `Image` и `Link` из Next.js.
- Переменные окружения `.env`.
- Конфигурацию Tailwind CSS.

### Проблемы с абсолютными импортами

```typescript
// .storybook/main.ts
import path from "path";

const config: StorybookConfig = {
  viteFinalConfig: async (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        "@": path.resolve(__dirname, "../src"),
        "~": path.resolve(__dirname, "../"),
      },
    };
    return config;
  },
};
```

## Лучшие практики

### 1. Документируйте крайние случаи

Всегда создавайте stories для крайних состояний компонента:

```typescript
export const WithVeryLongText: Story = { ... };
export const WithEmptyData: Story = { ... };
export const WithMaxValues: Story = { ... };
export const WithMinValues: Story = { ... };
export const ErrorState: Story = { ... };
export const LoadingState: Story = { ... };
```

### 2. Используйте реалистичные данные

Вместо заглушек типа "Lorem ipsum" используйте данные, близкие к реальным:

```typescript
// Плохо
args: {
  user: { name: "Test User", email: "test@test.com" }
}

// Хорошо
args: {
  user: {
    name: "Анна Смирнова",
    email: "anna.smirnova@company.ru",
    role: "Продуктовый менеджер"
  }
}
```

### 3. Называйте stories описательно

Имена stories должны описывать состояние или вариант использования:

```typescript
// Плохо
export const Story1: Story = { ... };
export const Story2: Story = { ... };

// Хорошо
export const Default: Story = { ... };
export const WithIcon: Story = { ... };
export const Disabled: Story = { ... };
export const Loading: Story = { ... };
```

### 4. Держите stories маленькими

Каждая story должна демонстрировать одно конкретное состояние:

```typescript
// Плохо — одна большая story
export const AllVariants: Story = {
  render: () => (
    <>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button disabled>Disabled</Button>
    </>
  ),
};

// Хорошо — отдельные stories
export const Primary: Story = {
  args: { variant: "primary", label: "Primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary", label: "Secondary" },
};

export const Disabled: Story = {
  args: { disabled: true, label: "Disabled" },
};
```

### 5. Используйте TypeScript для типобезопасных stories

```typescript
import type { Meta, StoryObj } from "@storybook/react";

// StoryObj обеспечивает типобезопасность для args
type Story = StoryObj<typeof meta>;

// TypeScript подскажет об ошибках в args
export const Primary: Story = {
  args: {
    // Ошибка TypeScript, если props не существует или имеет неверный тип
    unknownProp: "value",
  },
};
```

## Заключение

Storybook — это мощный инструмент, который меняет подход к разработке UI-компонентов. Он позволяет работать с компонентами в изоляции, создавать живую документацию, тестировать все состояния компонента и организовать эффективную совместную работу команды.

В этой статье мы рассмотрели установку и настройку Storybook для React-проектов, написание stories в формате CSF с TypeScript, работу с аддонами (Controls, Actions, Backgrounds, Viewport), автоматическую генерацию документации, play functions для интерактивного тестирования, мокирование API с MSW, а также интеграцию с тестами и CI/CD.

Начните с базовых stories для ваших ключевых компонентов, постепенно добавляя истории для крайних случаев и сложных состояний. Со временем Storybook станет центральным местом для документации и разработки UI в вашем проекте.
