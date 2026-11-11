---
metaTitle: "Storybook в Next.js: настройка и написание историй"
metaDescription: "Как интегрировать Storybook в проект Next.js: установка, конфигурация, написание stories, работа с роутером и изображениями."
author: "Антон Ларичев"
title: "Next.js со Storybook"
preview: "Полное руководство по интеграции Storybook в Next.js: от установки до написания историй для компонентов с поддержкой App Router."
---

## Что такое Storybook и зачем он нужен

Storybook — это инструмент для разработки UI-компонентов в изоляции. Он позволяет создавать, тестировать и документировать компоненты независимо от основного приложения. Каждое состояние компонента описывается отдельной «историей» (story), которую можно просмотреть в браузере без запуска всего приложения.

Основные преимущества:

- Разработка компонентов без зависимости от данных и роутинга
- Визуальное документирование всех состояний компонента
- Упрощение code review для UI-изменений
- Интеграция с тестами через `@storybook/test`

## Установка Storybook в проект Next.js

Storybook поддерживает Next.js через официальный фреймворк `@storybook/nextjs`, который автоматически настраивает webpack/Vite с учётом специфики Next.js.

Запустите инициализацию в корне проекта:

```bash
npx storybook@latest init
```

Инсталлятор определит, что вы используете Next.js, и установит нужные зависимости автоматически. После завершения в проекте появятся:

- `.storybook/main.ts` — основная конфигурация
- `.storybook/preview.ts` — глобальные декораторы и параметры
- `src/stories/` — примеры историй (можно удалить)

Запустите Storybook:

```bash
npm run storybook
```

По умолчанию он запускается на `http://localhost:6006`.

## Структура конфигурации

### main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};

export default config;
```

Поле `stories` задаёт glob-паттерны для поиска файлов историй. Рекомендуется размещать файлы историй рядом с компонентами: `Button.stories.tsx` рядом с `Button.tsx`.

### preview.ts

```typescript
import type { Preview } from '@storybook/nextjs';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

В `preview.ts` подключаются глобальные стили. Если вы используете CSS-модули или Tailwind, импортируйте их здесь.

## Написание первой истории

Создадим компонент кнопки и напишем для него истории.

```typescript
// src/components/Button/Button.tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

Файл историй для этого компонента:

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Нажми меня',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Отмена',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    label: 'Удалить',
    variant: 'danger',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Недоступно',
    disabled: true,
  },
};

export const Large: Story = {
  args: {
    label: 'Большая кнопка',
    size: 'lg',
  },
};
```

Тег `autodocs` указывает Storybook автоматически генерировать страницу документации на основе JSDoc-комментариев и prop-типов.

## Работа с Next.js Image

`@storybook/nextjs` из коробки поддерживает компонент `next/image`. Никакой дополнительной настройки не требуется — изображения будут отображаться в историях корректно.

```typescript
// src/components/Avatar/Avatar.tsx
import Image from 'next/image';

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
}

export function Avatar({ src, alt, size = 48 }: AvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  );
}
```

```typescript
// src/components/Avatar/Avatar.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/150',
    alt: 'Аватар пользователя',
    size: 48,
  },
};

export const Large: Story = {
  args: {
    src: 'https://i.pravatar.cc/150',
    alt: 'Аватар пользователя',
    size: 96,
  },
};
```

Если изображения загружаются с внешних доменов, добавьте их в `next.config.ts`. Storybook читает эту конфигурацию автоматически.

## Работа с Next.js Router

Компоненты, использующие `useRouter`, `usePathname` или `useSearchParams`, требуют мока роутера в Storybook.

`@storybook/nextjs` предоставляет встроенный мок через параметр `nextjs`:

```typescript
// src/components/Breadcrumbs/Breadcrumbs.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ProductPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/catalog/electronics/phones',
        segments: [
          ['category', 'electronics'],
          ['subcategory', 'phones'],
        ],
      },
    },
  },
};

export const HomePage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
};
```

Для компонентов на Pages Router используйте:

```typescript
export const WithQuery: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: '/products/[id]',
        query: { id: '42' },
      },
    },
  },
};
```

## Декораторы для провайдеров

Если ваши компоненты требуют контекстных провайдеров (тем, интернационализации, состояния), оберните их в декораторы.

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/nextjs';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import '../src/app/globals.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

Для декораторов, специфичных для одной истории:

```typescript
export const WithCustomTheme: Story = {
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Тёмная тема',
  },
};
```

## Написание историй для Server Components

Server Components нельзя напрямую использовать в Storybook, так как он работает в браузере. Есть два подхода:

**Подход 1: Вынести логику в Client Component**

Разделите компонент на серверную часть (получение данных) и клиентскую (отображение). Пишите истории для клиентской части.

```typescript
// src/components/ProductCard/ProductCardView.tsx — Client Component
'use client';

interface ProductCardViewProps {
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

export function ProductCardView({ name, price, image, inStock }: ProductCardViewProps) {
  return (
    <div className="border rounded-lg p-4">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <h3 className="mt-2 font-semibold">{name}</h3>
      <p className="text-blue-600 font-bold">{price} ₽</p>
      {!inStock && <span className="text-red-500 text-sm">Нет в наличии</span>}
    </div>
  );
}
```

```typescript
// src/components/ProductCard/ProductCardView.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProductCardView } from './ProductCardView';

const meta: Meta<typeof ProductCardView> = {
  title: 'Products/ProductCardView',
  component: ProductCardView,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {
  args: {
    name: 'iPhone 15 Pro',
    price: 99990,
    image: 'https://via.placeholder.com/300x200',
    inStock: true,
  },
};

export const OutOfStock: Story = {
  args: {
    name: 'Samsung Galaxy S24',
    price: 79990,
    image: 'https://via.placeholder.com/300x200',
    inStock: false,
  },
};
```

## Интерактивное тестирование через play functions

Storybook позволяет писать автоматизированные сценарии взаимодействия прямо в историях:

```typescript
// src/components/LoginForm/LoginForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from '@storybook/test';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Forms/LoginForm',
  component: LoginForm,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const emailInput = canvas.getByLabelText('Email');
    const passwordInput = canvas.getByLabelText('Пароль');
    const submitButton = canvas.getByRole('button', { name: 'Войти' });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');

    await expect(emailInput).toHaveValue('user@example.com');
    await expect(submitButton).toBeEnabled();
  },
};

export const ValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole('button', { name: 'Войти' });

    await userEvent.click(submitButton);

    await expect(
      canvas.getByText('Введите email')
    ).toBeInTheDocument();
  },
};
```

Эти тесты запускаются как в браузере Storybook, так и в CI через:

```bash
npx storybook test
```

## Storybook и переменные окружения

Storybook не имеет доступа к переменным окружения Next.js. Для клиентских переменных (с префиксом `NEXT_PUBLIC_`) добавьте их в `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  env: (config) => ({
    ...config,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  }),
};

export default config;
```

## Сборка Storybook для деплоя

Для публикации документации в виде статического сайта:

```bash
npm run build-storybook
```

В `package.json` по умолчанию добавляются скрипты:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

Результат сборки помещается в папку `storybook-static/`. Эту папку можно деплоить на любой статический хостинг: Vercel, Netlify, GitHub Pages или Chromatic.

## Советы по организации историй

**Именование через `title`** строится иерархически:

```typescript
// Создаёт группу UI > Forms > Input
export default {
  title: 'UI/Forms/Input',
  component: Input,
} satisfies Meta<typeof Input>;
```

**Соглашение по размещению файлов** — рядом с компонентом:

```
src/
  components/
    Button/
      Button.tsx
      Button.stories.tsx
      Button.test.tsx
```

**Используйте `satisfies`** вместо явного приведения типов — TypeScript лучше выведет типы аргументов:

```typescript
const meta = {
  title: 'UI/Button',
  component: Button,
} satisfies Meta<typeof Button>;
```

## Заключение

Storybook в связке с Next.js даёт среду для изолированной разработки компонентов, живую документацию и возможность тестировать UI без запуска всего приложения. Начните с простых компонентов, постепенно добавляя истории для всех состояний. Со временем Storybook становится единым источником истины для дизайн-системы проекта.

Подробнее о разработке компонентов, архитектуре и всех возможностях Next.js — на курсе [Next.js для разработчиков](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-storybook).