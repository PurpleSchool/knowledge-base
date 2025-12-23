---
metaTitle: FSD для React - архитектура react-fsd
metaDescription: Разбор подхода FSD для React - структура проекта по функциональным срезам, уровни архитектуры, правила зависимостей и практические примеры настройки react-fsd
author: Олег Марков
title: Архитектура FSD для React - практическое руководство по react-fsd
preview: Подробное руководство по FSD архитектуре в React - как организовать проект по функциональным срезам, настроить слои и зависимости и использовать подход react-fsd на практике
---

## Введение

Feature-Sliced Design (FSD) для React — это подход к архитектуре, который помогает организовать фронтенд‑проект так, чтобы он не рассыпался по мере роста. Вместо хаотичных папок `components`, `pages` и `utils` вы строите приложение вокруг бизнес‑функциональности и четко определенных слоев.

Смотрите, в этой статье я покажу вам, как применить FSD в React‑проектах (часто это называют react-fsd), какие уровни и сущности у него есть, как организовать папки и импорт, и как постепенно мигрировать к этой архитектуре. Мы будем разбирать все на примерах кода и структуры файлов, чтобы вы могли сразу применять это в реальной работе.

---

## Что такое FSD и зачем он нужен в React

### Основная идея FSD

FSD предлагает строить фронтенд по трем ключевым осям:

1. **По функционалу** — основой становится фича (feature), а не тип сущности.  
2. **По уровню абстракции** — приложение делится на слои: от атомарных building blocks до композиции страниц.  
3. **По областям ответственности** — каждый слой имеет свои правила, какие слои он может импортировать, а какие нет.

В React это особенно полезно, потому что в типичной структуре вида:

- `components/`
- `pages/`
- `hooks/`
- `utils/`

через полгода становится трудно понять, какой компонент к чему относится, а переиспользование логики — боль. FSD помогает сделать так, чтобы:

- Фичи были изолированы.
- Бизнес‑логика не размазывалась по всему проекту.
- Импорты были предсказуемыми и контролируемыми.

---

## Базовая структура проекта по FSD для React

### Слои FSD в react-fsd

Чаще всего в React‑проектах по FSD используют следующие слои:

- `app` — точка входа и общая конфигурация.
- `processes` — долгоживущие бизнес‑процессы (не всегда используется).
- `pages` — конечные страницы приложения.
- `widgets` — крупные интерфейсные блоки, собирающие несколько фич.
- `features` — отдельные пользовательские действия (логин, фильтрация и т.п.).
- `entities` — бизнес‑сущности (User, Product, Order и т.д.).
- `shared` — переиспользуемые низкоуровневые части (UI‑кит, либы, конфиги).

Теперь давайте посмотрим пример структуры проекта.

### Пример структуры React‑проекта с FSD

Ниже я размещаю пример структуры, чтобы вам было проще понять общую картину:

```bash
src/
  app/
    providers/
      RouterProvider.tsx
      StoreProvider.tsx
    index.tsx           # Инициализация приложения
    App.tsx             # Корневой компонент
  processes/
    auth/
      model/
        authProcess.ts  # Логика долгоживущего процесса авторизации
      ui/
        AuthGuard.tsx   # Обертка для защищенных роутов
  pages/
    home/
      index.ts          # Публичный интерфейс страницы Home
      ui/
        HomePage.tsx
      model/
        homePageModel.ts
    profile/
      index.ts
      ui/
        ProfilePage.tsx
      model/
        profilePageModel.ts
  widgets/
    header/
      index.ts
      ui/
        Header.tsx
      model/
        headerModel.ts
  features/
    authByEmail/
      index.ts
      ui/
        LoginForm.tsx
      model/
        useLoginForm.ts
        authByEmailApi.ts
    updateProfile/
      index.ts
      ui/
        ProfileForm.tsx
      model/
        useProfileForm.ts
  entities/
    user/
      index.ts
      model/
        userSlice.ts
        selectors.ts
        types.ts
      ui/
        UserAvatar.tsx
        UserName.tsx
      lib/
        formatUserName.ts
    article/
      index.ts
      model/
        articleSlice.ts
        selectors.ts
        types.ts
      ui/
        ArticleCard.tsx
  shared/
    ui/
      Button/
        Button.tsx
        Button.module.css
        index.ts
      Input/
        Input.tsx
        Input.module.css
        index.ts
    lib/
      api/
        axiosInstance.ts
      hooks/
        useDebounce.ts
      helpers/
        classNames.ts
    config/
      env.ts
    types/
      global.d.ts
```

Как видите, каждая фича, сущность, виджет или страница оформлены как отдельный модуль с поддиректориями `ui`, `model`, `lib` и т.п. Это помогает держать рядом компоненты, бизнес‑логику и утилиты, относящиеся к одной и той же части приложения.

---

## Детальный разбор слоев FSD в React

### Слой app

Слой `app` — это "оболочка" всего приложения. Здесь вы настраиваете:

- роутинг;
- провайдеры (Redux, React Query, ThemeProvider и т.п.);
- глобальные стили;
- инициализацию.

Давайте разберемся на примере:

```tsx
// src/app/App.tsx
import { BrowserRouter } from "react-router-dom"
import { RouterProvider } from "./providers/RouterProvider"
import { StoreProvider } from "./providers/StoreProvider"

export const App = () => {
  return (
    // Здесь мы задаем общие для всего приложения провайдеры
    <StoreProvider>
      <BrowserRouter>
        {/* Здесь мы подключаем конфигурацию роутов */}
        <RouterProvider />
      </BrowserRouter>
    </StoreProvider>
  )
}
```

```tsx
// src/app/index.tsx
import React from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

// Здесь мы монтируем корневой компонент приложения
const container = document.getElementById("root")

if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
```

Слой `app` не должен знать деталей конкретных фич. Он лишь собирает вместе страницы и инфраструктуру.

### Слой entities

Слой `entities` описывает доменные сущности: пользователя, статью, продукт, заказ. Важно понимать, что:

- сущность — это не просто данные;
- это набор логики, типов, UI‑компонентов, работающих вокруг этих данных.

Покажу вам, как это реализовано на практике.

```ts
// src/entities/user/model/types.ts
// Здесь мы описываем типы данных сущности User
export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
}
```

```ts
// src/entities/user/model/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { User } from "./types"

interface UserState {
  authData?: User
}

const initialState: UserState = {
  authData: undefined,
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Здесь мы сохраняем данные авторизованного пользователя
    setAuthData(state, action: PayloadAction<User>) {
      state.authData = action.payload
    },
    // Здесь мы очищаем данные при логауте
    clearAuthData(state) {
      state.authData = undefined
    },
  },
})

export const { actions: userActions, reducer: userReducer } = userSlice
```

```tsx
// src/entities/user/ui/UserAvatar.tsx
import { User } from "../model/types"

interface UserAvatarProps {
  user: User
  size?: number
}

export const UserAvatar = ({ user, size = 32 }: UserAvatarProps) => {
  // Здесь мы отображаем аватар пользователя, если он есть
  return (
    <img
      src={user.avatarUrl || "/default-avatar.png"}
      alt={user.username}
      width={size}
      height={size}
    />
  )
}
```

```ts
// src/entities/user/index.ts
// Здесь мы описываем публичный интерфейс сущности User
export * from "./model/types"
export { userReducer, userActions } from "./model/userSlice"
export { UserAvatar } from "./ui/UserAvatar"
```

Смотрите, наружу мы отдаем только то, что нужно другим слоям. Внутренние детали (вспомогательные функции, приватные утилиты) могут оставаться скрытыми.

### Слой features

Фича — это конкретное пользовательское действие: "авторизоваться по email", "добавить товар в корзину", "лайкнуть статью". Фича может использовать несколько сущностей и `shared`‑модулей.

Теперь вы увидите, как это выглядит в коде.

```tsx
// src/features/authByEmail/ui/LoginForm.tsx
import { FormEvent, useState } from "react"
import { Button } from "shared/ui/Button"
import { Input } from "shared/ui/Input"
import { useLoginForm } from "../model/useLoginForm"

export const LoginForm = () => {
  // Здесь мы получаем бизнес-логику формы через кастомный хук
  const { login, isLoading, error } = useLoginForm()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Здесь мы вызываем логин с данными формы
    login({ email, password })
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Поле ввода email */}
      <Input
        value={email}
        onChange={setEmail}
        placeholder="Email"
      />
      {/* Поле ввода пароля */}
      <Input
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Пароль"
      />
      {/* Отображение возможной ошибки */}
      {error && <p>{error}</p>}
      {/* Кнопка отправки формы */}
      <Button disabled={isLoading} type="submit">
        Войти
      </Button>
    </form>
  )
}
```

```ts
// src/features/authByEmail/model/useLoginForm.ts
import { useState } from "react"
import { useAppDispatch } from "shared/lib/hooks/useAppDispatch"
import { userActions } from "entities/user"
import { loginByEmail } from "./authByEmailApi"

interface LoginParams {
  email: string
  password: string
}

export const useLoginForm = () => {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async ({ email, password }: LoginParams) => {
    try {
      setIsLoading(true)
      setError(null)
      // Здесь мы вызываем API логина
      const user = await loginByEmail({ email, password })
      // Здесь мы сохраняем данные пользователя в хранилище
      dispatch(userActions.setAuthData(user))
    } catch (e) {
      // Здесь мы обрабатываем ошибку
      setError("Не удалось авторизоваться")
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
```

```ts
// src/features/authByEmail/model/authByEmailApi.ts
import { axiosInstance } from "shared/lib/api/axiosInstance"
import { User } from "entities/user"

interface LoginRequest {
  email: string
  password: string
}

export const loginByEmail = async (
  data: LoginRequest,
): Promise<User> => {
  // Здесь мы отправляем запрос на бэкенд
  const response = await axiosInstance.post<User>("/login", data)
  return response.data
}
```

```ts
// src/features/authByEmail/index.ts
// Публичный интерфейс фичи - только нужные внешние части
export { LoginForm } from "./ui/LoginForm"
```

Как видите, фича инкапсулирует в себе:

- UI (форма);
- хук с логикой;
- доступ к API.

Другие слои видят только `LoginForm`, не зная деталей реализации.

### Слой widgets

`widgets` — это крупные композиционные блоки интерфейса, которые объединяют несколько фич и сущностей. Пример — `Header`, `Sidebar`, `UserProfilePanel`.

Давайте разберем обычный `Header`, который использует сущность пользователя и фичу авторизации.

```tsx
// src/widgets/header/ui/Header.tsx
import { LoginForm } from "features/authByEmail"
import { UserAvatar, User } from "entities/user"

interface HeaderProps {
  user?: User
}

export const Header = ({ user }: HeaderProps) => {
  // Если пользователь авторизован - показываем его аватар
  if (user) {
    return (
      <header>
        <UserAvatar user={user} />
      </header>
    )
  }

  // Если пользователь не авторизован - показываем форму логина
  return (
    <header>
      <LoginForm />
    </header>
  )
}
```

```ts
// src/widgets/header/index.ts
export { Header } from "./ui/Header"
```

Смотрите, виджет не реализует сам бизнес‑логику, он просто соединяет уже готовые части.

### Слой pages

Страница (`pages`) — это конечная точка, к которой приходит пользователь по URL. На странице вы:

- подключаете нужные виджеты;
- добавляете фичи;
- используете сущности;
- не пишете сложную бизнес‑логику (она должна жить в фичах и сущностях).

Теперь давайте перейдем к примеру страницы профиля.

```tsx
// src/pages/profile/ui/ProfilePage.tsx
import { Header } from "widgets/header"
import { ProfileForm } from "features/updateProfile"
import { User } from "entities/user"

interface ProfilePageProps {
  user: User
}

export const ProfilePage = ({ user }: ProfilePageProps) => {
  return (
    <div>
      {/* Здесь мы используем виджет шапки */}
      <Header user={user} />
      {/* Здесь мы используем фичу редактирования профиля */}
      <main>
        <h1>Профиль</h1>
        <ProfileForm user={user} />
      </main>
    </div>
  )
}
```

```ts
// src/pages/profile/index.ts
export { ProfilePage } from "./ui/ProfilePage"
```

Часто страницы подключаются к роутеру в `app`.

```tsx
// src/app/providers/RouterProvider.tsx
import { Routes, Route } from "react-router-dom"
import { HomePage } from "pages/home"
import { ProfilePage } from "pages/profile"
import { useSelector } from "react-redux"
import { selectUserAuthData } from "entities/user/model/selectors"

export const RouterProvider = () => {
  // Здесь мы получаем данные пользователя из хранилища
  const user = useSelector(selectUserAuthData)

  return (
    <Routes>
      {/* Главная страница */}
      <Route path="/" element={<HomePage />} />
      {/* Страница профиля получает авторизованного пользователя */}
      <Route
        path="/profile"
        element={user ? <ProfilePage user={user} /> : <HomePage />}
      />
    </Routes>
  )
}
```

### Слой shared

`shared` — это общие кирпичики, не зависящие от доменной логики. Сюда выносится:

- UI‑компоненты (кнопки, поля, модальные окна);
- общие хелперы и утилиты;
- базовая инфраструктура (axios инстанс, общие хуки);
- конфиги и глобальные типы.

Давайте посмотрим, что происходит в следующем примере.

```tsx
// src/shared/ui/Button/Button.tsx
import { ButtonHTMLAttributes } from "react"
import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = ({
  variant = "primary",
  children,
  ...props
}: ButtonProps) => {
  // Здесь мы применяем класс в зависимости от варианта кнопки
  const className = [
    styles.button,
    styles[`button_${variant}`],
  ].join(" ")

  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}
```

```ts
// src/shared/ui/Button/index.ts
// Публичный интерфейс для компонента Button
export { Button } from "./Button"
```

```ts
// src/shared/lib/api/axiosInstance.ts
import axios from "axios"

export const axiosInstance = axios.create({
  // Здесь мы задаем базовый адрес API
  baseURL: process.env.API_URL,
  // Здесь можно указать заголовки по умолчанию
  headers: {
    "Content-Type": "application/json",
  },
})
```

---

## Правила зависимостей между слоями

Чтобы архитектура FSD действительно работала, важны не только папки, но и **правила, кто кого может импортировать**.

### Базовые правила импортов

Обычно для React‑проекта по FSD принимают такие правила:

- `app` может импортировать все слои.
- `processes` может импортировать `pages`, `widgets`, `features`, `entities`, `shared`.
- `pages` может импортировать `widgets`, `features`, `entities`, `shared`.
- `widgets` может импортировать `features`, `entities`, `shared`.
- `features` может импортировать `entities`, `shared`.
- `entities` может импортировать только `shared`.
- `shared` не может импортировать ничего, кроме `shared` (то есть только себя).

Проще запомнить так — зависимости должны идти **вниз по слоям**, но не вверх.

Обратите внимание, как это помогает:

- `shared` остается максимально чистым и переиспользуемым.
- `entities` не зависят от фич, хотя фичи могут использовать сущности.
- Страницы имеют доступ только к безопасному набору слоев.

---

## Index‑файлы и публичный интерфейс модулей

### Зачем нужны index.ts в FSD

В FSD подходе важно, чтобы внешний код не лез в "глубину" модуля. Для этого у каждой сущности, фичи, виджета и страницы есть `index.ts`, который описывает **публичный интерфейс**.

Посмотрите на этот пример:

```ts
// Плохо - мы импортируем внутренние детали модуля
import { UserAvatar } from "entities/user/ui/UserAvatar"

// Хорошо - мы импортируем через публичный интерфейс модуля
import { UserAvatar } from "entities/user"
```

Сейчас я покажу вам, как выглядит хороший `index.ts`:

```ts
// src/entities/user/index.ts

// Здесь мы экспортируем только то, что нужно снаружи
export type { User } from "./model/types"
export { userReducer, userActions } from "./model/userSlice"
export { UserAvatar } from "./ui/UserAvatar"
```

Если в будущем вы решите поменять внутреннюю структуру модуля (например, перенести `UserAvatar` в другую папку), внешние файлы, которые импортируют из `entities/user`, не сломаются.

---

## Локальные слои внутри модуля

Чаще всего внутри модулей FSD используются повторяющиеся подпапки:

- `ui` — все визуальные компоненты модуля;
- `model` — бизнес‑логика, состояние, типы, селекторы;
- `lib` — вспомогательные функции, специфичные для этого модуля;
- `config` — конфигурация модуля;
- `api` — иногда выносят отдельной папкой, если API сложное.

Давайте посмотрим, как это может выглядеть, например, в фиче `updateProfile`.

```bash
features/
  updateProfile/
    index.ts
    ui/
      ProfileForm.tsx
    model/
      useProfileForm.ts
      validators.ts
    lib/
      mapUserToForm.ts
```

```ts
// src/features/updateProfile/model/useProfileForm.ts
import { useState } from "react"
import { User } from "entities/user"
import { validateProfile } from "./validators"
import { mapUserToForm } from "../lib/mapUserToForm"

interface ProfileFormValues {
  username: string
  email: string
}

export const useProfileForm = (user: User) => {
  // Здесь мы приводим данные пользователя к форме
  const [values, setValues] = useState<ProfileFormValues>(
    mapUserToForm(user),
  )
  const [errors, setErrors] = useState<Partial<ProfileFormValues>>({})

  const onChange = (field: keyof ProfileFormValues, value: string) => {
    // Здесь мы обновляем локальное состояние формы
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const onSubmit = () => {
    // Здесь мы валидируем данные перед сохранением
    const validationErrors = validateProfile(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // Здесь вы можете вызвать API сохранения профиля
    // saveProfile(values)
  }

  return { values, errors, onChange, onSubmit }
}
```

```ts
// src/features/updateProfile/model/validators.ts
import { ProfileFormValues } from "./useProfileForm"

export const validateProfile = (
  values: ProfileFormValues,
): Partial<ProfileFormValues> => {
  const errors: Partial<ProfileFormValues> = {}

  // Здесь мы проверяем, что имя заполнено
  if (!values.username) {
    errors.username = "Имя обязательно"
  }

  // Здесь мы проверяем корректность email
  if (!values.email.includes("@")) {
    errors.email = "Некорректный email"
  }

  return errors
}
```

```ts
// src/features/updateProfile/lib/mapUserToForm.ts
import { User } from "entities/user"

interface ProfileFormValues {
  username: string
  email: string
}

// Здесь мы мапим сущность User в значения формы
export const mapUserToForm = (user: User): ProfileFormValues => ({
  username: user.username,
  email: user.email,
})
```

Как видите, логика аккуратно разложена по подпапкам. Это помогает новому человеку в команде быстро разобраться, где искать нужный код.

---

## Абсолютные импорты и алиасы в react-fsd

Чтобы структура FSD была удобной, часто используют **абсолютные импорты** по слоям:

- `app/...`
- `pages/...`
- `widgets/...`
- `features/...`
- `entities/...`
- `shared/...`

Это удобнее, чем писать относительные пути вида `../../../shared/ui/Button`.

### Настройка алиасов для TypeScript и React

Рассмотрим вариант настройки с Vite и TypeScript.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "app/*": ["app/*"],
      "pages/*": ["pages/*"],
      "widgets/*": ["widgets/*"],
      "features/*": ["features/*"],
      "entities/*": ["entities/*"],
      "shared/*": ["shared/*"]
    }
  }
}
```

Для Vite в `vite.config.ts` можно добавить:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Здесь мы настраиваем алиасы для FSD слоев
      app: path.resolve(__dirname, "src/app"),
      pages: path.resolve(__dirname, "src/pages"),
      widgets: path.resolve(__dirname, "src/widgets"),
      features: path.resolve(__dirname, "src/features"),
      entities: path.resolve(__dirname, "src/entities"),
      shared: path.resolve(__dirname, "src/shared"),
    },
  },
})
```

Теперь вместо длинных относительных импортов вы можете писать:

```ts
// Было
import { Button } from "../../../shared/ui/Button"

// Стало
import { Button } from "shared/ui/Button"
```

---

## Организация стилей в FSD‑проекте

В FSD нет жесткого требования по системе стилей, но важно, чтобы стили следовали тем же границам модулей. Чаще всего используют:

- CSS Modules;
- либо CSS‑in‑JS/Styled Components;
- либо Tailwind, но с привязкой к модулям.

Посмотрите на пример с CSS Modules.

```tsx
// src/features/authByEmail/ui/LoginForm.tsx
import styles from "./LoginForm.module.css"
import { Input } from "shared/ui/Input"
import { Button } from "shared/ui/Button"
import { useLoginForm } from "../model/useLoginForm"

export const LoginForm = () => {
  const { login, isLoading, error } = useLoginForm()
  // Здесь мы используем локальные стили LoginForm
  return (
    <form className={styles.form}>
      {/* Поля формы и сообщения об ошибке */}
      {/* ... */}
      <Button disabled={isLoading} type="submit">
        Войти
      </Button>
    </form>
  )
}
```

```css
/* src/features/authByEmail/ui/LoginForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

Стили хранятся рядом с модулем, и если вы переносите фичу или виджет, вы переносите их вместе со стилями.

---

## Работа с состоянием в FSD (Redux, Zustand, React Query)

FSD не привязан к конкретной библиотеке состояния, но задает **место**, где логика состояния должна жить.

### Пример с Redux Toolkit

В сущности `article` мы можем хранить слайс со списком статей.

```ts
// src/entities/article/model/articleSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface Article {
  id: string
  title: string
}

interface ArticleState {
  list: Article[]
}

const initialState: ArticleState = {
  list: [],
}

const articleSlice = createSlice({
  name: "article",
  initialState,
  reducers: {
    // Здесь мы задаем список статей
    setArticles(state, action: PayloadAction<Article[]>) {
      state.list = action.payload
    },
  },
})

export const {
  reducer: articleReducer,
  actions: articleActions,
} = articleSlice
```

```ts
// src/entities/article/model/selectors.ts
import { RootState } from "app/providers/StoreProvider"

export const selectArticles = (state: RootState) =>
  state.article?.list || []
```

Такую сущность потом используют в фичах (например, фильтрация статей) и на страницах.

### Пример с React Query

Если вы используете React Query, то запросы лучше располагать:

- либо в `model` фичи, если запрос специфичен для этой фичи;
- либо в `model` сущности, если запрос относится к доменной сущности.

Например:

```ts
// src/entities/article/model/useArticlesQuery.ts
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "shared/lib/api/axiosInstance"
import { Article } from "./articleSlice"

export const useArticlesQuery = () => {
  // Здесь мы получаем список статей из API
  return useQuery<Article[], Error>({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Article[]>("/articles")
      return data
    },
  })
}
```

---

## Как мигрировать существующий React‑проект на FSD

Если у вас уже есть проект без FSD, полностью переписывать структуру сразу не обязательно. Удобнее двигаться постепенно.

### Шаг 1. Ввести слои на верхнем уровне

Для начала можно создать основные папки:

- `app`
- `pages`
- `widgets`
- `features`
- `entities`
- `shared`

Перенесите:

- все общие UI‑компоненты в `shared/ui`;
- утилиты в `shared/lib` и `shared/helpers`;
- глобальные стили и конфиги в `app` и `shared/config`.

### Шаг 2. Выделить ключевые сущности

Дальше определите основные доменные сущности (User, Product, Article и др.) и вынесите их в `entities`. Сюда можно перенести:

- типы и интерфейсы данных;
- Redux‑слайсы/контекст;
- базовые UI‑компоненты, связанные с сущностью (карточка товара, аватар пользователя и т.д.).

### Шаг 3. Выделить фичи

Теперь разложите пользовательские действия по `features`. Например:

- формы логина и регистрации;
- добавление товара в корзину;
- добавление комментария;
- поиск и фильтрация.

Каждую фичу оформите как модуль с `index.ts`, `ui`, `model`, `lib`.

### Шаг 4. Собрать страницы и виджеты

На этом этапе уже можно:

- создать `pages` и вынести туда композиции фич и сущностей;
- создать `widgets` для шапки, подвала, боковой панели и т.д.

Страницы будут выглядеть как сборка из уже хорошо оформленных блоков.

### Шаг 5. Настроить правила импортов и линтинг

В завершение полезно настроить:

- абсолютные пути по слоям;
- линтер‑правила, запрещающие неправильные импорты (например, с помощью eslint‑плагина для FSD, если вы его используете).

---

## Пример маленького приложения по FSD

Давайте посмотрим упрощенный пример приложения с одной страницей и авторизацией.

### Структура

```bash
src/
  app/
    App.tsx
    index.tsx
  pages/
    home/
      index.ts
      ui/
        HomePage.tsx
  widgets/
    header/
      index.ts
      ui/
        Header.tsx
  features/
    authByEmail/
      index.ts
      ui/
        LoginForm.tsx
      model/
        useLoginForm.ts
  entities/
    user/
      index.ts
      model/
        userSlice.ts
        selectors.ts
        types.ts
      ui/
        UserAvatar.tsx
  shared/
    ui/
      Button/
      Input/
    lib/
      api/
        axiosInstance.ts
```

### Корневой компонент

```tsx
// src/app/App.tsx
import { Provider } from "react-redux"
import { store } from "./store"
import { HomePage } from "pages/home"

export const App = () => {
  // Здесь мы оборачиваем приложение в Redux Provider
  return (
    <Provider store={store}>
      <HomePage />
    </Provider>
  )
}
```

### Страница Home

```tsx
// src/pages/home/ui/HomePage.tsx
import { useSelector } from "react-redux"
import { Header } from "widgets/header"
import { selectUserAuthData } from "entities/user/model/selectors"

export const HomePage = () => {
  // Здесь мы получаем пользователя из хранилища
  const user = useSelector(selectUserAuthData)

  return (
    <div>
      {/* Виджет шапки использует данные пользователя */}
      <Header user={user} />
      <main>
        <h1>Главная страница</h1>
      </main>
    </div>
  )
}
```

### Виджет Header

```tsx
// src/widgets/header/ui/Header.tsx
import { User, UserAvatar } from "entities/user"
import { LoginForm } from "features/authByEmail"

interface HeaderProps {
  user?: User
}

export const Header = ({ user }: HeaderProps) => {
  return (
    <header>
      {/* Здесь мы условно отображаем контент в зависимости от авторизации */}
      {user ? (
        <UserAvatar user={user} />
      ) : (
        <LoginForm />
      )}
    </header>
  )
}
```

Такое небольшое приложение уже демонстрирует ключевые идеи FSD: слои, модули, index‑файлы и четкие границы ответственностей.

---

## Заключение

FSD для React (react-fsd) — это не просто "еще одна структура папок", а подход к проектированию, который:

- организует код вокруг бизнес‑функциональности;
- делит приложение на понятные слои с явными зависимостями;
- помогает изолировать сущности, фичи, виджеты и страницы;
- делает крупные проекты понятнее и предсказуемее.

Ключевые практики, которые стоит применить:

- Ввести слои `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- Оформлять каждую фичу, сущность, виджет и страницу как модуль с `index.ts`.
- Соблюдать правила импортов "сверху вниз".
- Располагать стили, логику и утилиты рядом с модулями.
- Использовать абсолютные алиасы по слоям.

Начать можно постепенно: вынести `shared`, затем `entities`, потом `features` и `pages`. Со временем структура станет естественной, а рефакторинг и развитие проекта — заметно проще.

---

## Частозадаваемые технические вопросы по FSD для React и ответы

### Как организовать тесты в FSD‑структуре

Обычно тесты размещают рядом с тем кодом, который они проверяют. Например:

- `features/authByEmail/ui/LoginForm.test.tsx`
- `entities/user/model/userSlice.test.ts`

При этом слои сохраняются. Важно использовать те же публичные интерфейсы, что и в основном коде. Если модуль экспортируется через `index.ts`, старайтесь импортировать для тестов именно его, а не внутренние файлы, чтобы тесты не ломались при реорганизации структуры.

### Как подключать глобальные контексты и провайдеры в FSD

Все глобальные провайдеры (Redux Provider, QueryClientProvider, ThemeProvider) стоит размещать в слое `app`, обычно в `app/providers`. Затем они оборачивают `App` или корневые роуты. Фичи и сущности внутри используют уже готовые хуки и контексты, не создавая собственные отдельные провайдеры без необходимости.

### Где размещать типы, общие для нескольких сущностей

Если тип строго относится к одной доменной сущности, его место в `entities/<entity>/model/types.ts`. Если тип действительно общий (например, `Pagination`, `ApiError`), его можно вынести в `shared/types`. Главное — избегать "свалки" универсальных типов; лучше начинать с `entities` и выносить в `shared` только те, что реально используются во многих модулях.

### Как быть с формами, которые относятся сразу к нескольким сущностям

Если форма реализует конкретное пользовательское действие (например, "оформить заказ"), ее логичнее считать фичей и разместить в `features/checkoutForm`. Внутри она может использовать несколько сущностей (`user`, `cart`, `product`) и общие компоненты из `shared`. Разносить форму по нескольким сущностям не стоит, иначе вы потеряете целостность бизнес‑процесса.

### Как организовать код для модальных окон в FSD

Если модальное окно является частью конкретной фичи (например, "подтверждение удаления статьи"), модалку следует размещать в `features/articleDeleteConfirm/ui`. Если это универсальный модальный контейнер (Layout модалки, базовый диалог), его место в `shared/ui/Modal`. Страницы и виджеты используют модалку из `shared`, а фичи наполняют ее конкретным содержимым.