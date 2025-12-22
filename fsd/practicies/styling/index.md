---
metaTitle: Стилизация в FSD styling
metaDescription: Подробное руководство по стилизации интерфейса в архитектуре Feature Sliced Design - разбор подходов организации стилей и структуры файлов стилизации
author: Олег Марков
title: Стилизация в FSD styling
preview: Разберитесь как организовывать стили в проектах с архитектурой Feature Sliced Design - от выбора стека стилизации до структуры файлов и практических рекомендаций
---

## Введение

Стилизация в проектах с архитектурой Feature-Sliced Design (FSD) часто вызывает больше всего вопросов. С одной стороны, вы уже делите код на `app`, `processes`, `pages`, `features`, `entities`, `shared`. С другой — нужно еще правильно разнести стили, чтобы:

- не было «магических» общих стилей, которые ломают всё приложение;
- компоненты можно было реиспользовать без неожиданного поведения;
- дизайн-система оставалась целостной, но не превращалась в монолит.

Здесь я покажу вам, как можно организовать стилизацию в FSD-проекте, какие подходы чаще всего используют, где держать файлы стилей и как привязать их к слоям и слайсам. Мы не будем навязывать единственно правильный стек (CSS Modules, CSS-in-JS, Tailwind и т.п.), а разберем принципы, которые работают поверх конкретного инструмента.

## Базовые принципы стилизации в FSD

### Ограничения и зависимости

Главная идея FSD — слои и модули не должны знать лишнего друг о друге. Для стилизации это означает:

- Стили не должны «протекать» через слои.
- Нельзя переопределять стили компонентов из других слоев «снаружи» (например, через глобальный CSS).
- Каждый модуль (slice) отвечает за свои стили и не ломает чужие.

Хорошее правило: стили живут там же, где живет компонент. Если вы видите, что стиль меняет внешний вид модуля из другого слоя, значит, структура либо ответственности, либо расположения стилей выбрана неправильно.

### Локальные стили против глобальных

В FSD мы держим фокус на локальности:

- Локальные стили:
  - CSS Modules / CSS-in-JS, привязанные к компоненту,
  - минимизируют влияние на остальной код;
  - хорошо подходят для `features`, `entities`, `widgets`.

- Глобальные стили:
  - базовые reset/normalize;
  - общие токены дизайна (цвета, шрифты, отступы);
  - базовые HTML-теги (body, html, a и т.п.);
  - лучше располагать в слое `app` или `shared` (как часть дизайн-системы).

Смотрите, я покажу вам типичное разделение:

- `app` — подключение глобальных стилей, шрифтов, темизации;
- `shared/ui` — примитивы с собственными локальными стилями;
- `entities` / `features` / `widgets` / `pages` — комбинации примитивов со своими локальными стилями;
- `shared/config` — конфиги постпроцессоров, Tailwind, ThemeProvider и т.п.

## Где хранить стили в структуре FSD

### Общий подход к структуре файлов

Обычно стили кладут рядом с компонентами. Давайте разберемся на примерной структуре проекта:

```bash
src/
  app/
    index.tsx              # Точка входа приложения
    styles/
      index.css            # Глобальные базовые стили
      normalize.css        # Normalize или reset
      themes/
        light.css          # Тема светлая
        dark.css           # Тема темная
  shared/
    ui/
      button/
        index.tsx          # Компонент Button
        button.module.css  # Локальные стили для Button
      input/
        index.tsx
        input.module.css
    config/
      theme/
        ThemeProvider.tsx  # Логика темизации
        useTheme.ts        # Хук для работы с темой
  entities/
    user/
      ui/
        UserCard/
          UserCard.tsx
          UserCard.module.css
  features/
    auth/
      ui/
        LoginForm/
          LoginForm.tsx
          LoginForm.module.css
  pages/
    login/
      ui/
        LoginPage/
          LoginPage.tsx
          LoginPage.module.css
```

Здесь важно:

- Стили хранятся в тех же директориях, что и компоненты.
- Глобальные вещи — в `app/styles` и частично в `shared`.
- Ничего из `features` или `entities` не пробивается в глобальные стили.

### Принцип «стили как часть публичного API модуля»

В FSD у каждого модуля есть публичный API — обычно это `index.ts` или `index.tsx`, через который модуль «показывает себя» наружу. Для стилей действует похожая идея:

- внутренние стили модуля не должны быть нужны снаружи;
- если снаружи нужно поменять внешний вид, модуль должен предоставить пропы или специальные слоты (className, render props, стилизуемые подкомпоненты).

Пример:

```tsx
// features/auth/ui/LoginForm/LoginForm.tsx
import { Button } from "shared/ui/button";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  className?: string; // Позволяем обернуть форму и добавить внешний класс
}

export const LoginForm = (props: LoginFormProps) => {
  const { className } = props;

  return (
    <form className={`${styles.form} ${className ?? ""}`}>
      {/* Поле логина */}
      <input className={styles.input} />
      {/* Поле пароля */}
      <input className={styles.input} type="password" />
      {/* Кнопка отправки */}
      <Button className={styles.submit}>Войти</Button>
    </form>
  );
};
```

```css
/* features/auth/ui/LoginForm/LoginForm.module.css */
.form {
  display: flex;
  flex-direction: column; /* Поля и кнопка идут вертикально */
  gap: 8px;               /* Отступ между элементами */
}

.input {
  padding: 8px 12px;
  border-radius: 4px;
}

.submit {
  margin-top: 12px;
}
```

Обратите внимание:

- внешние `pages` или `widgets` могут оборачивать `LoginForm`, добавлять свои отступы, но не залезают в его внутреннюю разметку;
- компонент не заставляет вас знать конкретные названия его внутренних css-классов.

## Выбор стека стилизации в контексте FSD

### CSS Modules

CSS Modules — частый выбор, потому что:

- дают локальность классов по умолчанию;
- хорошо сочетаются с FSD-структурой;
- легко типизируются и интегрируются с любым сборщиком.

Теперь давайте посмотрим, как это выглядит в коде.

```tsx
// shared/ui/button/index.tsx
import styles from "./button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"; // Тип кнопки
}

export const Button = (props: ButtonProps) => {
  const { variant = "primary", className, ...rest } = props;

  const variantClass =
    variant === "primary" ? styles.primary : styles.secondary;

  return (
    <button
      // Здесь мы объединяем базовый класс, вариативный класс и внешний className
      className={`${styles.button} ${variantClass} ${className ?? ""}`}
      {...rest}
    />
  );
};
```

```css
/* shared/ui/button/button.module.css */
.button {
  padding: 8px 16px;          /* Внутренние отступы */
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.primary {
  background-color: var(--color-primary);
  color: white;
}

.secondary {
  background-color: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}
```

Преимущества для FSD:

- каждый модуль не «подсвечивает» классами весь проект;
- легко переносить модуль между проектами — вы переносите компонент и файлы стилей.

### CSS-in-JS (styled-components, Emotion, etc.)

CSS-in-JS чаще используют, когда нужен:

- продвинутый theming;
- динамическая стилизация от пропов;
- возможность использовать тему без глобальных CSS-переменных.

В FSD с CSS-in-JS действуют те же принципы:

- файлы стилей рядом с компонентом;
- темы и ThemeProvider — в `app` или `shared/config/theme`;
- токены темы — единый источник правды.

Пример со `styled-components`:

```tsx
// shared/config/theme/ThemeProvider.tsx
import { ThemeProvider as StyledProvider } from "styled-components";

const lightTheme = {
  colors: {
    primary: "#4f46e5",  // Основной цвет
    text: "#111827",
  },
};

export const ThemeProvider = (props: { children: React.ReactNode }) => {
  const { children } = props;

  return (
    <StyledProvider theme={lightTheme}>
      {/* Оборачиваем все приложение в провайдер темы */}
      {children}
    </StyledProvider>
  );
};
```

```tsx
// shared/ui/button/index.tsx
import styled from "styled-components";

export const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;

  color: white;
  background-color: ${({ theme }) => theme.colors.primary}; 
  /* Цвет берем из темы */

  &:hover {
    opacity: 0.9; /* Легкий эффект наведения */
  }
`;
```

### Utility-first стили (Tailwind и аналоги)

Tailwind можно использовать в FSD, но важно не нарушить границы слоев:

- конфиг Tailwind — в `shared/config` или `config` проекта;
- глобальное подключение стилей Tailwind — в `app`;
- в слоях `features`, `entities` и т.п. вы используете классы Tailwind как обычные классы.

Но есть нюанс: Tailwind часто «подталкивает» к тому, чтобы разметка и стили смешивались. В FSD это допустимо, но:

- сложные виджеты лучше выносить в `shared/ui` с инкапсулированным набором классов Tailwind;
- переиспользуемые паттерны (например, card, modal) стоит оформить как компоненты, а не копировать классы.

Пример:

```tsx
// shared/ui/card/index.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = (props: CardProps) => {
  const { children, className } = props;

  return (
    <div
      // Здесь мы комбинируем базовые utility-классы и внешний className
      className={`rounded-lg shadow-sm bg-white p-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
};
```

## Глобальные стили и дизайн-система

### Что должно быть глобальным

Глобальный CSS в FSD — это минимальный, контролируемый набор вещей, который нужен всему приложению:

- normalize/reset;
- базовые переменные (CSS custom properties) для темизации;
- базовые настройки шрифтов;
- иногда — базовая сетка или container-классы, если вы решили их сделать глобальными.

Давайте разберёмся на примере:

```css
/* app/styles/index.css */

/* Подключаем normalize */
@import "./normalize.css";

/* Корневые CSS-переменные */
:root {
  --color-primary: #4f46e5;
  --color-primary-soft: #eef2ff;
  --color-text: #111827;
  --font-base: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* Базовые стили документа */
html,
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-base);
  color: var(--color-text);
  background-color: #f9fafb;
}

/* Утилита контейнера */
.container {
  max-width: 1200px;
  margin: 0 auto;   /* Выравнивание по центру */
  padding: 0 16px;  /* Боковые отступы */
}
```

Эти вещи используются всеми слоями, но важно:

- не добавлять сюда стили конкретных компонентов;
- не завязываться на структуру модулей (никаких `.login-page .button { ... }` в глобальном CSS).

### Токены и темы

В FSD удобно держать токены (цвета, размеры, шрифты) в централизованном месте. Для чистого CSS это:

- CSS custom properties на уровне `:root` и, например, `.theme-dark`.

Для темизации можно сделать так:

```css
/* app/styles/themes/light.css */
:root {
  --color-bg: #f9fafb;
  --color-text: #111827;
}

/* app/styles/themes/dark.css */
:root.theme-dark {
  --color-bg: #030712;
  --color-text: #e5e7eb;
}
```

```tsx
// shared/config/theme/useTheme.ts
import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Здесь мы переключаем класс на элементе html или body
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
  }, [theme]);

  return {
    theme,
    setTheme,
  };
};
```

```tsx
// app/providers/ThemeProvider.tsx
import { createContext, useContext } from "react";
import { useTheme } from "shared/config/theme/useTheme";

const ThemeContext = createContext<ReturnType<typeof useTheme> | null>(null);

export const ThemeProvider = (props: { children: React.ReactNode }) => {
  const { children } = props;

  const themeState = useTheme();

  return (
    <ThemeContext.Provider value={themeState}>
      {/* Делаем тему доступной всему приложению */}
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return ctx;
};
```

Теперь вы можете менять тему в любом слое, но сама реализация темы живет в `shared/config` и `app`.

## Стилизация по слоям: app, shared, entities, features, pages

### Слой app

Слой `app` отвечает за:

- инициализацию приложения;
- глобальные стили и темы;
- шрифты и базовый layout.

Пример точки входа:

```tsx
// app/index.tsx
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "app/providers/ThemeProvider";

// Подключаем глобальные стили
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // Подключаем провайдеры вокруг всего приложения
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
```

Здесь важно:

- глобальные стили подключаются один раз;
- тема и прочие провайдеры не «просачиваются» в бизнес-логику — лишь оборачивают её.

### Слой shared

`shared` — это переиспользуемые примитивы, не зависящие от предметной области. Для стилизации:

- `shared/ui` — визуальные компоненты (Button, Input, Card, Modal);
- `shared/lib` — хелперы, в том числе для сборки className и работы с темой;
- `shared/config` — конфиги темы, Tailwind, CSS-ресеты, если их нужно переиспользовать.

Покажу вам простой пример утилиты для объединения классов, которая часто нужна:

```ts
// shared/lib/classNames.ts
export const classNames = (
  base: string,
  mods: Record<string, boolean | undefined> = {},
  additional: Array<string | undefined> = []
) => {
  // Здесь мы собираем итоговую строку классов
  return [
    base,
    ...Object.entries(mods)
      .filter(([_, value]) => Boolean(value))
      .map(([className]) => className),
    ...additional.filter(Boolean),
  ].join(" ");
};
```

```tsx
// shared/ui/button/index.tsx
import { classNames } from "shared/lib/classNames";
import styles from "./button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const Button = (props: ButtonProps) => {
  const { fullWidth, className, ...rest } = props;

  return (
    <button
      className={classNames(styles.button, { [styles.fullWidth]: fullWidth }, [
        className,
      ])}
      {...rest}
    />
  );
};
```

```css
/* shared/ui/button/button.module.css */
.button {
  padding: 8px 16px;
}

.fullWidth {
  width: 100%; /* Кнопка занимает всю ширину контейнера */
}
```

### Слой entities

`entities` — это «сущности» предметной области (User, Product, Order и т.п.). По стилизации:

- сущности могут иметь собственные UI-компоненты;
- они используют `shared/ui` и могут иметь сложные внутренние стили;
- стили остаются локальными для сущности.

Пример:

```tsx
// entities/user/ui/UserCard/UserCard.tsx
import { Card } from "shared/ui/card";
import styles from "./UserCard.module.css";

interface UserCardProps {
  name: string;
  avatarUrl?: string;
}

export const UserCard = (props: UserCardProps) => {
  const { name, avatarUrl } = props;

  return (
    <Card className={styles.card}>
      <div className={styles.avatar}>
        {/* Здесь выводим аватар или инициал имени */}
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarInitial}>
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
      </div>
    </Card>
  );
};
```

```css
/* entities/user/ui/UserCard/UserCard.module.css */
.card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background-color: var(--color-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatarImage {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover; /* Сохраняем пропорции изображения */
}

.avatarInitial {
  font-weight: 600;
  color: var(--color-primary);
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 500;
}
```

### Слой features

`features` — это функциональные возможности (авторизация, фильтрация, лайк и т.п.). С точки зрения стилей:

- фича отвечает за стили только своих UI-компонентов;
- может использовать `shared/ui` и `entities`;
- не должна напрямую переопределять их стили через глобальные классы.

Если нужно адаптировать внешний вид `shared`-компонента под конкретную фичу, делайте это через пропы или дополнительные классы, а не через «глобальные» CSS-хаки.

Пример фичи:

```tsx
// features/auth/ui/LoginForm/LoginForm.tsx
import { Button } from "shared/ui/button";
import styles from "./LoginForm.module.css";

export const LoginForm = () => {
  return (
    <form className={styles.form}>
      <input
        className={styles.input}
        name="email"
        placeholder="Email"
      />
      <input
        className={styles.input}
        type="password"
        name="password"
        placeholder="Пароль"
      />
      <Button className={styles.submit}>Войти</Button>
    </form>
  );
};
```

### Слой pages

`pages` — это композиция из `widgets`, `features`, `entities`. Здесь обычно:

- минимальная логика;
- стили отвечают за layout конкретной страницы;
- не переопределяются внутренние стили нижележащих слоев.

Пример:

```tsx
// pages/login/ui/LoginPage/LoginPage.tsx
import { LoginForm } from "features/auth/ui/LoginForm/LoginForm";
import styles from "./LoginPage.module.css";

export const LoginPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход в систему</h1>
        <LoginForm />
      </div>
    </div>
  );
};
```

```css
/* pages/login/ui/LoginPage/LoginPage.module.css */
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;           /* Центрируем по вертикали */
  justify-content: center;       /* Центрируем по горизонтали */
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(15, 23, 42, 0.1);
}

.title {
  margin-bottom: 16px;
  font-size: 24px;
}
```

Как видите, `page` отвечает за расположение и внешний вид «карты» целиком, а сама форма авторизации не знает, где именно её разместят.

## Переиспользуемость и расширяемость стилей

### className-проп как канал кастомизации

Один из самых безопасных способов адаптировать внешний вид компонента под разные контексты — проп `className`. В FSD это особенно полезно, когда:

- компонент из `shared/ui` используется и в `features`, и в `entities`;
- `features` хочет слегка адаптировать внешний вид (например, размер или отступы);
- важно не ломать инкапсуляцию базового компонента.

Давайте разберемся на примере:

```tsx
// shared/ui/button/index.tsx
import styles from "./button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = (props: ButtonProps) => {
  const { size = "md", className, ...rest } = props;

  const sizeClass =
    size === "sm"
      ? styles.sizeSm
      : size === "lg"
      ? styles.sizeLg
      : styles.sizeMd;

  return (
    <button className={`${styles.button} ${sizeClass} ${className ?? ""}`} {...rest} />
  );
};
```

```css
/* shared/ui/button/button.module.css */
.button {
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.sizeSm {
  padding: 4px 8px;
  font-size: 12px;
}

.sizeMd {
  padding: 8px 16px;
  font-size: 14px;
}

.sizeLg {
  padding: 12px 20px;
  font-size: 16px;
}
```

```tsx
// features/auth/ui/LoginForm/LoginForm.tsx
import { Button } from "shared/ui/button";
import styles from "./LoginForm.module.css";

export const LoginForm = () => {
  return (
    <form className={styles.form}>
      {/* Поля ввода опущены для краткости */}
      <Button size="lg" className={styles.submit}>
        Войти
      </Button>
    </form>
  );
};
```

```css
/* features/auth/ui/LoginForm/LoginForm.module.css */
.submit {
  width: 100%;         /* Кнопка на ширину формы */
  margin-top: 12px;
}
```

Здесь `Button` остаётся универсальным, а фича подстраивает только то, что ей нужно (ширину и отступ).

### Слоты и подкомпоненты

Иногда нужно дать еще больше контроля над внешним видом. Тогда вместо props-набора делают:

- слоты (`renderLeft`, `renderRight`, `header`, `footer`);
- подкомпоненты (`Card.Header`, `Card.Body`, `Card.Footer`).

Это помогает избежать ситуаций, когда вы начинаете переопределять кучу внутренних стилей извне.

Пример:

```tsx
// shared/ui/card/index.tsx
import styles from "./card.module.css";

interface CardProps {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Card = (props: CardProps) => {
  const { title, footer, children, className } = props;

  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {title && <div className={styles.header}>{title}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
```

```css
/* shared/ui/card/card.module.css */
.card {
  border-radius: 8px;
  background-color: white;
  padding: 16px;
}

.header {
  margin-bottom: 8px;
  font-weight: 600;
}

.body {
  margin-bottom: 8px;
}

.footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
}
```

Так `features` или `pages` могут менять содержимое header и footer, не ломая структуру стилей компонента `Card`.

## Антипаттерны стилизации в FSD

### Глобальные переопределения из нижних слоев

Проблемный пример:

```css
/* features/auth/styles/override.css */

/* Плохая практика - фича залезает в глобальный класс */
.button {
  border-radius: 9999px;
}
```

Здесь фича:

- переопределяет глобальный класс;
- может неожиданно повлиять на другие слои.

Как лучше:

- использовать `className` и локальные стили;
- если вы хотите изменить все кнопки во всем приложении — меняйте `shared/ui/button`, а не переопределяйте его глобально.

### Общие «магические» компоненты в shared

Другой антипаттерн — слишком рано выносить в `shared` компоненты с особыми стилями, которые завязаны на конкретную фичу или сущность. Например:

- `UserProfileCard` в `shared/ui`;
- `ProductPageLayout` в `shared/ui`.

Такие компоненты несут в себе знания о предметной области и обычно должны жить в `entities` или `features`.

Правило: в `shared` — только то, что не знает ничего о домене. Если компонент нарисован в специфичном стиле только для одной фичи, держите его там, где он нужен.

### Дублирование стилей между слоями

Иногда разработчики копируют одинаковые CSS-фрагменты в `features`, `entities` и `pages`. Это признак того, что:

- вы упустили возможность сделать примитив в `shared/ui`;
- или забыли вынести тему/токены в глобальное место.

Если вы видите, что класс `.card` с одинаковыми стилями повторяется в трех местах — стоит сделать `shared/ui/card`.

## Организация тем, брейкпоинтов и адаптивности

### Брейкпоинты и сетка

Брейкпоинты и общие принципы адаптивности относятся к дизайн-системе, то есть к слоям `app` и `shared`. Их удобно задавать:

- через CSS custom properties;
- или через SCSS-переменные/миксины, если вы используете препроцессор.

Пример с CSS custom properties:

```css
/* app/styles/index.css */
/* Общие брейкпоинты */
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
}
```

```css
/* pages/login/ui/LoginPage/LoginPage.module.css */
.card {
  width: 100%;
  max-width: 400px;
}

@media (min-width: var(--bp-md)) {
  .card {
    padding: 32px; /* Больше отступы на больших экранах */
  }
}
```

Это позволяет вам поддерживать согласованный адаптивный дизайн по всему проекту, не «зашивая» магические числа в каждый модуль.

### Темизация компонентов через CSS-переменные

Если вы используете глобальные CSS-переменные, компоненты в `shared` и выше могут их просто читать:

```css
/* shared/ui/button/button.module.css */
.button {
  background-color: var(--color-primary);
  color: var(--color-primary-text, white);
}
```

А `app` или `ThemeProvider` меняет значение переменных в зависимости от темы. Так стили компонентов не зависят от сложной логики темы — они просто используют переменные.

## Подход к миграции существующего проекта на FSD по части стилей

Если у вас уже есть проект с хаотичной стилизацией, и вы хотите перейти на FSD-структуру, удобнее двигаться поэтапно.

### Шаг 1. Выделить глобальное и локальное

- Вынесите все reset/normalize, шрифты и базовые токены в `app/styles`.
- Убедитесь, что глобальные стили не содержат конкретных компонентных селекторов.

### Шаг 2. Локализовать стили компонентов

- Начните переносить компоненты в структуру слоев `shared`, `entities`, `features`.
- К каждому компоненту перенесите его стили рядом и сделайте их локальными (CSS Modules или CSS-in-JS).
- Уберите из глобальных стилей селекторы вида `.login-page .button`.

### Шаг 3. Выделить design tokens и темы

- Сконцентрируйте цвета, брейкпоинты, отступы в одном месте (`app/styles`, `shared/config/theme`).
- Замените «жестко» прописанные цвета в компонентах на CSS-переменные или значения из темы.

### Шаг 4. Создать базовые UI-примитивы в shared

- Посмотрите, какие паттерны повторяются чаще всего (кнопка, инпут, карточка, модалка).
- Вынесите их в `shared/ui`.
- Замените дублирующие реализации в `features` и `entities` на `shared`-примитивы.

Так вы шаг за шагом приведете стили к более предсказуемой структуре, не ломая приложение одним большим рефакторингом.

## Заключение

Стилизация в FSD — это не про конкретный инструмент CSS, а про дисциплину и границы:

- стили живут там же, где живут компоненты;
- каждый слой отвечает только за свои визуальные обязанности;
- глобальные стили минимальны и описывают только foundation — токены, базовую типографику, reset;
- `shared` содержит фундаментальные UI-кирпичи, а `features` и `entities` строят из них предметно-ориентированные представления.

Если вы будете смотреть на стили как на часть архитектуры, а не как на отдельный слой магии, проект останется управляемым даже при росте команды и кодовой базы.

## Частозадаваемые технические вопросы

### Как поступать с глобальными библиотеками стилей (Bootstrap, Ant Design) в FSD

Если вы используете библиотеку, которая подтягивает свои глобальные стили, лучше:

1. Подключать её в слое `app` (один раз, в точке входа).
2. Оборачивать сторонние компоненты в адаптеры в `shared/ui`:
   - создать `shared/ui/AntButton`, `shared/ui/AntModal` и т.п.;
   - в этих адаптерах заворачивать оригинальные компоненты и задавать единые правила использования.
3. Не использовать библиотечные компоненты напрямую из `features` и `entities`, а только через `shared/ui`.

Так вы сможете со временем сменить библиотеку или адаптировать её стили, почти не трогая доменные слои.

### Как правильно организовать CSS-переменные для нескольких брендов или продуктов

При мультибрендовой теме удобно:

1. Создать отдельные файлы токенов для брендов, например:
   - `app/styles/themes/brandA.css`
   - `app/styles/themes/brandB.css`
2. В каждом объявить свои значения переменных:
   - `--color-primary`, `--color-bg`, `--border-radius-base` и т.п.
3. При инициализации приложения подгружать нужный файл или добавлять класс `brand-a`/`brand-b` на корневой элемент и переопределять переменные там.
4. Компоненты при этом просто читают `var(--color-primary)` и не знают ничего о конкретном бренде.

### Как быть с анимациями и keyframes в FSD

Анимации часто нужны в разных местах, поэтому:

1. Базовые анимации, которые используются много раз (fade-in, slide-up), лучше объявить глобально:
   - в `app/styles/animations.css` или `shared/styles/animations.css`;
   - подключить этот файл один раз в `app`.
2. Специфичные анимации для конкретного компонента (например, анимация открытия кастомного поповера) можно описать в его локальном CSS-модуле:
   - объявить `@keyframes` в этом модуле;
   - использовать только внутри компонента.

### Как тестировать стили в контексте FSD

Полноценные визуальные регрессионные тесты зависят от стека, но базовый подход такой:

1. Для критичных `shared/ui` компонентов:
   - писать скриншотные тесты (Chromatic, Loki, Playwright).
2. Для `features` и `pages`:
   - использовать интеграционные e2e-тесты с проверкой классов и стейтов (например, через Playwright или Cypress);
   - проверять, что основной сценарий не ломает layout (наличие нужных элементов, корректные состояния).

### Как поступать с глобальными CSS-классами из сторонних виджетов (например, плееры, карты)

Когда сторонний виджет требует подключить свои CSS-файлы с глобальными классами:

1. Подключайте их в `app` или в специальном адаптере в `shared/lib` / `shared/ui`.
2. Оборачивайте такие виджеты в собственные адаптеры:
   - `shared/ui/MapWidget`, `shared/ui/VideoPlayer`.
3. Локально «изолируйте» их от остального стайлинга:
   - оборачивайте в контейнер с нейтральными стилями;
   - избегайте использования конфликтующих глобальных классов в своем коде.

Так вы минимизируете риск столкновения глобальных стилей стороннего виджета с вашей FSD-архитектурой.