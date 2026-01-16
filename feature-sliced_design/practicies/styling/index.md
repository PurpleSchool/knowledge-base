---
metaTitle: Стилизация в Feature-Sliced Design - принципы и практики
metaDescription: Разберитесь как организовывать стили в архитектуре Feature-Sliced Design - от уровней и слоев до подходов к инкапсуляции и переиспользованию UI
author: Олег Марков
title: Стилизация в Feature-Sliced Design - практическое руководство
preview: Узнайте как выстроить систему стилизации в проекте с Feature-Sliced Design - чтобы компоненты были изолированы а дизайн оставался целостным
---

## Введение

Стилизация в проектах с Feature-Sliced Design (FSD) часто оказывается сложнее, чем кажется на первый взгляд. Архитектура помогает красиво разложить код по уровням и слайсам, но стили при этом легко превратить в хаос: часть в `features`, часть в `shared`, что‑то живет в теме, что‑то в компонентах, а глобальные стили вообще не ясно куда положить.

Здесь я покажу вам, как вы можете выстроить систему стилизации так, чтобы:

- каждый слой отвечал за свой уровень абстракции в оформлении;
- переиспользуемые стили не протекали в доменные модули;
- можно было спокойно рефакторить дизайн без слома архитектуры;
- легко подключались разные UI‑киты, дизайн‑системы и темы.

Мы пройдемся по типовым задачам: глобальные стили, темы, CSS‑модули, CSS‑in‑JS, utility‑классы, и посмотрим, как они вписываются в FSD. Я буду опираться на фронтенд‑контекст (часто это React), но принципы остаются теми же и в других стэках.

---

## Роли уровней FSD в стилизации

### Зачем вообще связывать стили с уровнями

Feature-Sliced Design делит код не только по смыслу (features, entities, pages), но и по уровню абстракции. Точно так же стоит разделить и стили. Иначе у вас быстро появляется ситуация, когда:

- глобальные переменные цветов используются в глубине конкретного виджета;
- фича тянет внутрь себя `global.scss`;
- изменения темы ломают layout страниц.

Поэтому стили тоже должны уважать границы:

- **глобальные правила и токены** живут в `app` и `shared`;
- **оформление конкретных доменных блоков** живет рядом с ними — в `features`, `entities`, `widgets`, `pages`;
- **направление зависимостей** такое же, как для кода: нижние уровни не знают про верхние.

Давайте по порядку.

### Уровень app — точка входа и базовая «кожа» приложения

На уровне `app` обычно:

- подключаются глобальные стили;
- настраивается тема;
- определяются root‑контейнеры, сетка, базовая типографика.

Пример структуры:

- `app/styles/index.scss` — глобальные импорты и ресеты
- `app/styles/themes/light.scss` — переменные для светлой темы
- `app/styles/themes/dark.scss` — переменные для темной темы
- `app/providers/ThemeProvider` — логика переключения темы

Здесь я размещаю пример, чтобы вам было проще понять:

```tsx
// app/App.tsx
import { ThemeProvider } from './providers/ThemeProvider'
import './styles/index.scss' // Глобальный стиль один на все приложение

export const App = () => {
  return (
    // ThemeProvider прокидывает тему через контекст
    <ThemeProvider>
      {/* Здесь начинается слой pages */}
      <Routing />
    </ThemeProvider>
  )
}
```

```scss
/* app/styles/index.scss */
/* Здесь задаем базовые стили, которые касаются всего приложения */

@import './reset';      // Сброс стилей браузера
@import './variables';  // Общие переменные, не завязанные на бизнес-логику
@import './themes/light';
@import './themes/dark';

html,
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Корневой контейнер приложения */
#root {
  min-height: 100vh;
  background: var(--app-bg);
  color: var(--text-main);
}
```

Важно: `app` — это не место для оформления каждой кнопки и карточки. Здесь вы задаете «фон» всего приложения.

### Уровень shared — фундаментальная визуальная библиотека

`shared` отвечает за переиспользуемые элементы, не завязанные на конкретную предметную область:

- базовые компоненты (Button, Input, Modal);
- системные токены (цвета, радиусы, шрифты);
- utility‑классы (если вы не используете utility‑CSS из пакета);
- общие mixin’ы.

Здесь допустимо хранить общие SCSS‑переменные, CSS‑custom‑properties, mixin’ы и абстрактные helpers. Но важно: `shared` не должен содержать стили конкретных фич (`profile`, `orders` и т.п.).

```scss
/* shared/styles/tokens.scss */
/* Общие дизайн-токены, которые не зависят от домена */

:root {
  --border-radius-s: 4px;
  --border-radius-m: 8px;
  --border-radius-l: 16px;

  --font-size-s: 12px;
  --font-size-m: 14px;
  --font-size-l: 18px;

  --transition-fast: 0.15s ease-in-out;
}
```

```tsx
// shared/ui/button/Button.tsx
import styles from './Button.module.scss'

// Упрощенный пример: базовая кнопка без доменной логики
export const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { className, children, ...otherProps } = props

  return (
    <button
      className={`${styles.button} ${className ?? ''}`}
      {...otherProps} // Пробрасываем стандартные пропсы кнопки
    >
      {children}
    </button>
  )
}
```

```scss
/* shared/ui/button/Button.module.scss */
/* Стиль базовой кнопки, который может переиспользовать токены из shared/styles */

@import '../../styles/tokens';

.button {
  padding: 8px 16px;
  border-radius: var(--border-radius-m);
  border: none;
  cursor: pointer;
  background-color: var(--accent-main);
  color: var(--text-contrast);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--accent-main-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}
```

Как видите, `Button` опирается на общие токены, но сам находится в `shared` и не знает ничего про конкретные фичи.

### Уровни entities, features, widgets, pages — прикладная стилизация

Здесь стили уже сильно завязаны на контекст:

- `entities` — оформление элементарных доменных сущностей (UserCard, ProductItem);
- `features` — стили для интерактивных сценариев (LoginForm, AddToCartButton);
- `widgets` — композитные блоки (Header, Sidebar, DashboardWidget);
- `pages` — layout всей страницы (страничная сетка, отступы между блоками).

В этих слоях вы:

- не определяете новые глобальные токены;
- не трогаете глобальные темы;
- описываете внешний вид конкретного модуля, используя уже заданные токены и базовые компоненты.

Пример для `features`:

```tsx
// features/auth/login-form/ui/LoginForm.tsx
import { Button } from '@/shared/ui/button/Button'
import styles from './LoginForm.module.scss'

// Форма логина, стилизованная в рамках своей фичи
export const LoginForm = () => {
  return (
    <form className={styles.form}>
      <input className={styles.input} type="email" placeholder="Email" />
      <input className={styles.input} type="password" placeholder="Пароль" />

      {/* Переиспользуем базовую кнопку из shared, но можем её обернуть своим контейнером */}
      <Button className={styles.submitButton}>
        Войти
      </Button>
    </form>
  )
}
```

```scss
/* features/auth/login-form/ui/LoginForm.module.scss */
/* Локальные стили фичи - работают только внутри LoginForm */

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--surface-bg);
  border-radius: var(--border-radius-l);
}

.input {
  padding: 8px 10px;
  border-radius: var(--border-radius-s);
  border: 1px solid var(--border-subtle);
}

/* Мы можем дополнительно повлиять на базовую кнопку, но через контейнерный класс */
.submitButton {
  align-self: flex-end;
}
```

Так вы сохраняете:

- базовую консистентность UI через `shared`;
- изоляцию фич — их можно переносить, не трогая глобальные слои.

---

## Подходы к организации стилей в FSD

Теперь давайте пройдемся по распространенным техникам стилизации и посмотрим, как их вписать в FSD.

### CSS‑модули: простой и безопасный по умолчанию вариант

CSS‑модули хорошо ложатся на идею «файл стиля рядом с компонентом»:

- нет утечек глобальных классов;
- легко контролировать связи;
- удобно типизировать (через d.ts).

Рекомендуемый паттерн:

- каждый UI‑компонент имеет свой `*.module.scss` рядом;
- файлы называются по имени компонента;
- публичный API слайса экспортирует компонент, но не экспортирует стили напрямую.

Пример структуры для `feature`:

- `features/auth/login-form/ui/LoginForm.tsx`
- `features/auth/login-form/ui/LoginForm.module.scss`
- `features/auth/login-form/index.ts` — публичный API фичи

```ts
// features/auth/login-form/index.ts
// Экспортируем только компонент, стили остаются деталью реализации
export { LoginForm } from './ui/LoginForm'
```

Плюсы для FSD:

- легко понять зону действия стилей;
- при переносе слайса вы переносите и его стили;
- циклические зависимости через стили практически исключены.

### CSS‑in‑JS и styled‑components: где им место

Если вы используете styled‑components, Emotion или аналогичный CSS‑in‑JS, общая идея остается такой же:

- логика+стили живут внутри модуля;
- общие темы и токены определяются в `app`/`shared`;
- верхние уровни не знают про внутренние styled‑компоненты.

Давайте разберемся на примере:

```tsx
// shared/styles/theme.ts
// Определяем типизированную тему - её будет получать ThemeProvider

export const theme = {
  colors: {
    textMain: '#111827',
    textMuted: '#6B7280',
    accent: '#3B82F6',
  },
  radii: {
    m: '8px',
  },
}
```

```tsx
// app/providers/ThemeProvider.tsx
import { ThemeProvider as StyledProvider } from 'styled-components'
import { theme } from '@/shared/styles/theme'

// Оборачиваем приложение в ThemeProvider из styled-components
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledProvider theme={theme}>
      {children}
    </StyledProvider>
  )
}
```

```tsx
// shared/ui/button/Button.tsx
import styled from 'styled-components'

// Покажу вам, как это реализовано на практике:
// Базовая кнопка опирается на значения из темы,
// которые мы объявили на уровне shared/styles/theme.ts
const StyledButton = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.m};
  border: none;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textMain};
`

export const Button = StyledButton
```

Особенности в контексте FSD:

- сама библиотека (`styled-components`) — в `shared/lib` или просто как внешняя зависимость;
- объявление темы — в `shared/styles` или `shared/config/theme`;
- провайдер темы — в `app/providers`;
- конкретные styled‑компоненты — в своих слоях (`shared/ui`, `features/.../ui` и т.п.).

### Utility‑CSS (Tailwind, UnoCSS) в FSD

Utility‑подход можно сочетать с FSD, но важно не потерять модульные границы.

Какие варианты используются чаще всего:

1. **Utility‑CSS только в нижних слоях**  
   - базовые утилиты и конфигурация Tailwind — в `app` или `shared/styles`;
   - компоненты в `shared/ui` используют утилитные классы;
   - в `features`/`widgets` — минимальные донастройки или комбинирование.

2. **Смешанный подход**  
   - нижний слой — Tailwind/utility‑CSS;
   - локальные уточняющие стили — CSS‑модули рядом с компонентами.

Пример:

```tsx
// shared/ui/card/Card.tsx
// Здесь мы комбинируем utility-классы и минимальную логику
export const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-lg shadow-sm bg-white p-4">
      {children}
    </div>
  )
}
```

```tsx
// features/profile/user-card/ui/UserCard.tsx
import styles from './UserCard.module.scss'
import { Card } from '@/shared/ui/card/Card'

export const UserCard = () => {
  return (
    // Обратите внимание, как этот фрагмент кода решает задачу:
    // Карта берет базовое оформление из shared Card
    // а фича добавляет свою собранную обертку через CSS-модуль
    <Card>
      <div className={styles.header}>
        {/* ... */}
      </div>
      <div className={styles.body}>
        {/* ... */}
      </div>
    </Card>
  )
}
```

Так вы не смешиваете Tailwind‑классы по всему проекту в хаотичном виде, а держите их ближе к `shared`.

---

## Темизация в Feature-Sliced Design

### Где живет тема и как она распространяется

Тема — это сквозной слой. Она затрагивает почти все уровни, но хранить её логику в каждом модуле было бы ошибкой. В FSD удобно разделить:

- **описание темы** (токены, наборы переменных) — `shared`;
- **логика переключения темы** (контекст, провайдер) — `shared` + `app`;
- **применение темы** (CSS‑переменные на root, data‑атрибуты) — `app`.

Пример с CSS‑custom‑properties:

```tsx
// shared/lib/theme/ThemeContext.tsx
import { createContext, useContext, useState } from 'react'

// Тип темы - строка, чтобы можно было легко добавлять новые варианты
type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // В реальной жизни стоит бросить более осмысленную ошибку
    throw new Error('ThemeContext is not provided')
  }
  return ctx
}

// Провайдер темы - логика переключения и хранение текущего значения
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* Здесь можно навесить data-атрибут для CSS */}
      <div data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
```

```scss
/* app/styles/themes/light.scss */
/* Смотрите, я покажу вам, как это работает для светлой темы */

:root[data-theme='light'] {
  --app-bg: #f9fafb;
  --surface-bg: #ffffff;
  --text-main: #111827;
  --text-muted: #6b7280;
  --accent-main: #3b82f6;
  --accent-main-hover: #2563eb;
  --border-subtle: #e5e7eb;
}
```

```scss
/* app/styles/themes/dark.scss */
/* Аналогичный набор переменных для темной темы */

:root[data-theme='dark'] {
  --app-bg: #020617;
  --surface-bg: #020617;
  --text-main: #e5e7eb;
  --text-muted: #9ca3af;
  --accent-main: #3b82f6;
  --accent-main-hover: #60a5fa;
  --border-subtle: #1f2937;
}
```

```tsx
// shared/ui/theme-switcher/ThemeSwitcher.tsx
import { useTheme } from '@/shared/lib/theme/ThemeContext'

// Компактный переключатель темы - логика фичи, но реализован на базе shared-хуков
export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  const toggle = () => {
    // Здесь мы просто переворачиваем значение, можно добавить более сложную логику
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle}>
      {/* Можно стилизовать иконки темы в зависимости от текущего state */}
      {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
    </button>
  )
}
```

На что стоит обратить внимание:

- токены темы (`--app-bg`, `--accent-main` и т.п.) определяются один раз;
- компоненты на всех уровнях используют только эти значения, не придумывают свои цвета;
- логика переключения темы централизована.

### Тематические вариации компонентов

Иногда вам нужно, чтобы конкретный компонент менял вид в зависимости от темы. В FSD‑подходе вы избегаете «ручного» пробрасывания темы через пропсы, если уже есть общий контекст.

Давайте посмотрим, что происходит в следующем примере:

```tsx
// shared/ui/alert/Alert.tsx
import { useTheme } from '@/shared/lib/theme/ThemeContext'
import styles from './Alert.module.scss'

interface AlertProps {
  message: string
}

// Компонент знает о теме через общий хук, но по-прежнему относится к shared/ui
export const Alert = ({ message }: AlertProps) => {
  const { theme } = useTheme()

  // В зависимости от темы выбираем CSS-класс
  const themeClass = theme === 'dark' ? styles.dark : styles.light

  return (
    <div className={`${styles.alert} ${themeClass}`}>
      {message}
    </div>
  )
}
```

```scss
/* shared/ui/alert/Alert.module.scss */
.alert {
  padding: 12px 16px;
  border-radius: var(--border-radius-m);
  border: 1px solid transparent;
}

/* Варианты оформления под разные темы */
.light {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #0c4a6e;
}

.dark {
  background: #0f172a;
  border-color: #1d4ed8;
  color: #e5e7eb;
}
```

Так вы:

- сохраняете компоненты в `shared`, но даете им чувствительность к теме;
- избегаете излишнего дублирования компонентов под каждую тему.

---

## Инкапсуляция и переиспользование стилей

### Почему не стоит тянуть глобальные стили во фичи

Распространенная ошибка — в фиче писать что‑то вроде:

```tsx
// ПЛОХОЙ пример - фича явно тянет глобальный CSS внутри себя
import '@/app/styles/index.scss'
```

Проблема:

- фича перестает быть переносимой — она теперь зависит от конкретного `app`;
- если вы захотите переиспользовать фичу в другом приложении, вам придется тянуть весь набор глобальных стилей.

Лучше:

- `app` один раз импортирует глобальные стили;
- все остальные слои полагаются на токены и базовые компоненты, а не на прямой импорт глобального CSS.

### Деление стилей на «структуру» и «кожу»

Хорошая практика в FSD — разделять:

- **структуру** (layout, размеры, расположение элементов) — чаще живет в виджетах и страницах;
- **кожу** (цвета, шрифты, отступы внутри компонентов) — чаще живет в `shared`/`entities`/`features`.

Пример:

```tsx
// widgets/profile-card/ui/ProfileCardWidget.tsx
import { UserCard } from '@/entities/user'
import styles from './ProfileCardWidget.module.scss'

// Виджет отвечает за размещение сущностей и управление их комбинацией
export const ProfileCardWidget = () => {
  return (
    <section className={styles.wrapper}>
      <UserCard />
      {/* Здесь могут быть ещё компоненты, связанные с профилем */}
    </section>
  )
}
```

```scss
/* widgets/profile-card/ui/ProfileCardWidget.module.scss */
/* Здесь мы задаем только layout, не лезем в внутреннюю стилизацию UserCard */

.wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
}
```

А уже внутри `UserCard`:

```tsx
// entities/user/ui/UserCard.tsx
import styles from './UserCard.module.scss'

export const UserCard = () => {
  return (
    <article className={styles.card}>
      {/* Внутренности карточки */}
    </article>
  )
}
```

```scss
/* entities/user/ui/UserCard.module.scss */
/* Здесь описана «кожа» сущности - отступы, цвета, рамки и т.п. */

.card {
  padding: 16px;
  background: var(--surface-bg);
  border-radius: var(--border-radius-m);
  box-shadow: 0 0 0 1px var(--border-subtle);
}
```

Так вы легко можете:

- поменять расположение карточки, не трогая её содержимое;
- переиспользовать сущности в других виджетах с теми же внутренними стилями.

---

## Работа с глобальными стилями и reset’ами

### Что действительно должно быть глобальным

Глобальные стили в FSD нужны, но их список должен быть ограничен. Обычно сюда попадает:

- CSS‑reset или normalize;
- базовая типографика для `body`, `a`, `button` (на минимальном уровне);
- общие переменные или root‑токены;
- стили для корневых контейнеров `html`, `body`, `#root`.

Пример минимального глобального набора:

```scss
/* app/styles/reset.scss */
/* Базовый reset, можно взять любой проверенный набор или Tailwind preflight */

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
}
```

```scss
/* app/styles/base.scss */
/* Базовая типографика и фон приложения */

body {
  font-family: system-ui, sans-serif;
  font-size: var(--font-size-m);
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
}
```

И уже в `index.scss` вы это собираете:

```scss
/* app/styles/index.scss */

@import './reset';
@import './tokens';  /* общий набор токенов, если вы используете SCSS-переменные */
@import './themes/light';
@import './themes/dark';
@import './base';
```

### Чего лучше избегать в глобальных стилях

- перебивать стили конкретных компонентов по селекторам `div .some-class`;
- держать в глобальном файле стили фич (`.login-form`, `.profile-page` и т.п.);
- использовать сложные каскады для переопределения локальных стилей.

Если вы чувствуете, что вам нужен специфичный стиль для чего‑то — почти всегда это сигнал, что ему место в CSS‑модуле рядом с компонентом.

---

## Соглашения по именованию и структуре файлов

### Именование файлов со стилями

Для FSD важно, чтобы по имени файла было понятно:

- к какому модулю он относится;
- на каком уровне архитектуры он находится.

Рекомендуемая схема:

- `Component.tsx` + `Component.module.scss`;
- для групп стилей (токены, темы): `tokens.scss`, `themes/light.scss`, `themes/dark.scss`.

Примеры по уровням:

- `shared/ui/button/Button.tsx`, `Button.module.scss`
- `entities/order/ui/OrderCard.tsx`, `OrderCard.module.scss`
- `features/cart/add-to-cart-button/ui/AddToCartButton.tsx`, `AddToCartButton.module.scss`
- `widgets/header/ui/Header.tsx`, `Header.module.scss`
- `pages/profile/ui/ProfilePage.tsx`, `ProfilePage.module.scss`

### Именование CSS‑классов внутри модулей

Так как CSS‑модули всё равно преобразуют имена в уникальные, можно использовать простые классы:

- `root`, `wrapper`, `title`, `content`, `actions` и т.п.;
- без привязки к имени компонента (это уже очевидно из имени файла).

Например:

```scss
/* features/cart/add-to-cart-button/ui/AddToCartButton.module.scss */

.button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 16px;
  height: 16px;
}

.label {
  font-weight: 500;
}
```

Внутри `AddToCartButton.tsx`:

```tsx
import styles from './AddToCartButton.module.scss'

export const AddToCartButton = () => {
  return (
    <button className={styles.button}>
      <span className={styles.icon}>{/* Иконка */}</span>
      <span className={styles.label}>Добавить в корзину</span>
    </button>
  )
}
```

---

## Типичные анти‑паттерны стилизации в FSD и как их избегать

### 1. «Магические» глобальные классы

Проблема:

- у вас есть глобальный класс `.primary-button`, который используется по всему проекту;
- его определение лежит в `app/styles/index.scss`;
- любая правка ломает сразу десятки модулей.

Как сделать лучше:

- перенесите базовый вид кнопки в `shared/ui/Button`;
- вместо глобального класса экспортируйте компонент;
- пропустите стили через CSS‑модули, а public‑API `shared` предоставит только сам компонент.

### 2. Импорт стилей через «глубокие» относительные пути

Например:

```scss
/* ПЛОХО: фича напрямую тянет shared/styles через относительный путь */

@import '../../../../shared/styles/tokens';
```

Риски:

- ломкие пути при реорганизации;
- скрытые зависимости между слайсами.

Лучше:

- вынести такие вещи в alias‑импорты (`@/shared/styles/tokens`);
- использовать их только из тех слоёв, которым действительно нужен доступ;
- стараться, чтобы более высокие уровни не импортировали стили из нижних напрямую, а работали через компоненты.

### 3. Смешение ответственности страниц и виджетов

Иногда стили layout’а страницы попадают в виджеты, и наоборот. В итоге:

- виджеты сложно переиспользовать на других страницах;
- любые изменения сетки ломают компоненты.

Решение:

- layout, отступы между крупными блоками — в `pages`;
- внутренний layout конкретного блока — в `widgets` или ещё ниже;
- сущности не знают о страницах, а страницы не знают о внутренностях сущностей.

---

## Итог

Стилизация в Feature-Sliced Design хорошо работает, когда вы относитесь к стилям как к полноценной части архитектуры:

- **уровень `app`** задает глобальные правила, темы и базовый фон приложения;
- **уровень `shared`** предоставляет дизайн‑систему: токены, базовые UI‑компоненты и общие утилиты;
- **уровни `entities`, `features`, `widgets`, `pages`** описывают внешний вид конкретных модулей, используя уже существующие токены и компоненты, не ломая границы слоев.

При этом:

- CSS‑модули удобно использовать как дефолтный способ инкапсуляции стилей;
- CSS‑in‑JS и utility‑CSS тоже вписываются в FSD, если вы сохраняете архитектурные зависимости;
- тема и глобальные токены живут внизу, а прикладное оформление — рядом с модулями;
- страницы отвечают за крупный layout, виджеты и сущности — за «кожу» и локальное позиционирование.

Если держать эти принципы в голове, вы сможете выстраивать масштабируемую и предсказуемую систему стилизации, в которой дизайн развивается вместе с архитектурой, а не борется с ней.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как подключать сторонний UI‑кит в FSD и где хранить его стили

Разместите адаптацию UI‑кита в `shared/ui` или `shared/lib`. Оберните компоненты кита своими фасадами (например, `shared/ui/AntButton`) и используйте их как стандартные базовые компоненты. Глобальные стили кита импортируйте в `app/styles/index.scss`. Не тяните стили кита напрямую из фич, всегда проходите через адаптационный слой.

### Как правильно использовать CSS‑переменные и SCSS‑переменные вместе

CSS‑переменные подходят для темизации в рантайме, SCSS‑переменные — для констант на этапе сборки. Держите SCSS‑переменные в `shared/styles/tokens.scss` для вычислений (например, размеры), а CSS‑переменные — в `app/styles/themes/*.scss` для значений, которые нужно менять по теме. В компонентах используйте CSS‑переменные в первую очередь, SCSS — только для промежуточных вычислений.

### Как организовать стили для адаптивной верстки по уровням

Медиа‑запросы, связанные с глобальной сеткой, размещайте в `app/styles` и `pages` (ширина контейнеров, общие брейкпоинты). Локальную адаптацию конкретных модулей (перестроение карточки, переключение направления flex) описывайте в CSS‑модулях этих модулей. Не делайте единый огромный файл с медиа‑запросами для всего проекта.

### Как избежать дублирования однотипных отступов и размеров между фичами

Вынесите часто используемые размеры и отступы в токены (`--space-xs`, `--space-s`, `--space-m`, и т.д.) в `shared/styles`. В компонентах используйте только их. Если повторяется целая композиция (например, «карточка с заголовком и контентом»), вынесите её в `shared/ui` как отдельный компонент, а не копируйте разметку и стили по фичам.

### Как тестировать стили в контексте FSD

Визуальные регрессионные тесты (Loki, Chromatic, Storybook) удобно строить на уровне `shared/ui`, `entities` и `features`. Для каждого публичного компонента слайса создавайте историю в Storybook, привязывая её к структуре FSD. Так вы сможете проверять стили изолированно, не завязываясь на конкретные страницы, и быстрее ловить проблемы с темизацией и адаптивом.