---
metaTitle: Архитектура FSD для Next.js - практическое руководство по nextjs-fsd
metaDescription: Разбор подхода Feature Sliced Design для Next.js - структура проекта принципы разделения ответственности примеры кода и практические рекомендации по применению nextjs-fsd
author: Олег Марков
title: FSD для Next.js - nextjs-fsd архитектура фронтенда на фичах
preview: Узнайте как применять Feature Sliced Design в Next.js проектах - выстроить понятную структуру модулей упростить поддержку кода и масштабировать продукт с помощью подхода nextjs-fsd
---

## Введение

Feature-Sliced Design (FSD) — это подход к архитектуре фронтенда, который строит проект вокруг фич, а не вокруг страниц или технических слоев. Он помогает держать кодовую базу управляемой, когда приложение растет, а команда расширяется.

В контексте Next.js часто возникает проблема: встроенная файловая архитектура (pages или app router) диктует структуру проекта, и со временем в папке `app` или `pages` накапливается множество несвязанных сущностей. Появляются «бесконечные» папки `components`, `utils`, «общие» хуки, которые используют все и везде, а связи между модулями становятся неочевидными.

Подход nextjs-fsd — это применение принципов FSD в рамках Next.js-проекта с учетом его особенностей:

- серверные и клиентские компоненты;
- роутинг через `app` или `pages`;
- серверные действия (server actions);
- API-роуты и взаимодействие с backend.

Давайте разберемся, как вы можете шаг за шагом внедрить FSD в свой Next.js-проект, какие слои использовать, как раскладывать файлы, как организовать импорт, и посмотрим на конкретные примеры кода.

---

## Базовые принципы FSD, адаптированные для Next.js

### Слои иерархии

Стандартный FSD предлагает несколько слоев:

- `app` — стартовая точка приложения, интеграция окружения;
- `processes` — сквозные бизнес-процессы (регистрация, онбординг, оплата);
- `pages` — композиция фич, виджетов и процессов в конкретный экран;
- `widgets` — крупные блоки интерфейса (header, sidebar, dashboard-widget);
- `features` — законченные пользовательские сценарии (логин, выбор товара, фильтрация списка);
- `entities` — бизнес-сущности (user, product, order);
- `shared` — общий фундамент (UI-кит, хелперы, конфиги).

Для Next.js важно понять, как это сочетается с его `app` или `pages`:

- Папка `src/app` (или `app`) — это не FSD-слой `app`, а системная часть Next.js, где живет роутинг.
- FSD-слой `app` удобно положить внутрь `src`, но отделить его от `app`-роутера. Чуть ниже я покажу структуру.

Задача — не сломать встроенный роутинг, но при этом разложить бизнес-логику и компоненты по слоям FSD.

### Основные принципы, которых стоит придерживаться

1. Фичи и сущности важнее страниц.  
   Страница — это композиция, а не место, где живет вся логика.

2. Импорты «сверху вниз».  
   Верхние слои (pages, widgets) могут импортировать нижние (features, entities, shared), но не наоборот.

3. Минимизировать «сквозняки».  
   Старайтесь не тащить `shared` везде бездумно. Важнее строить зависимости вокруг сущностей и фич.

4. Учитывать серверные/клиентские компоненты.  
   В Next.js 13+ (app router) каждый компонент по умолчанию серверный, а пометка `'use client'` делает его клиентским. В FSD-структуре это нужно отражать аккуратно, чтобы клиентские зависимости не «протекали» наверх.

---

## Структура проекта Next.js с FSD (nextjs-fsd)

### Пример структуры для Next.js 13+ c app router

Смотрите, я покажу вам один из типичных вариантов схемы директорий:

```txt
src/
  app/                      // Роутинг Next.js (app router)
    layout.tsx
    page.tsx
    profile/
      page.tsx
    api/
      auth/
        route.ts            // API route
  appProviders/             // FSD-слой app (инициализация)
    index.tsx
  processes/
    onboarding/
      model/
      ui/
  pages/                    // FSD-слой pages: композиция экранов
    home/
      ui/
        HomePage.tsx
    profile/
      ui/
        ProfilePage.tsx
  widgets/
    header/
      ui/
        Header.tsx
      model/
    sidebar/
      ui/
        Sidebar.tsx
  features/
    auth/
      login/
        ui/
          LoginForm.tsx
        model/
          useLogin.ts
    user/
      updateProfile/
        ui/
        model/
  entities/
    user/
      model/
        types.ts
        api.ts
        selectors.ts
      ui/
        UserAvatar.tsx
        UserProfileCard.tsx
  shared/
    ui/
      Button/
        Button.tsx
      Input/
        Input.tsx
    api/
      baseClient.ts
    config/
      env.ts
    lib/
      formatDate.ts
      validators/
    types/
      global.d.ts
```

Здесь важно:

- папка `src/app` — зона ответственности Next.js (роутер, layout, api routes);
- FSD-слой `pages` содержит реальную страницу с точки зрения бизнеса (`HomePage`, `ProfilePage` и т. д.);
- Next.js-страницы в `src/app` просто подключают нужный FSD-экран.

Давайте разберем это на конкретном примере.

### Связка Next.js-роута и FSD-страницы

Допустим, у нас есть главная страница `/`. В `src/pages/home/ui/HomePage.tsx` мы собираем экран:

```tsx
// src/pages/home/ui/HomePage.tsx

import { Header } from '@/widgets/header/ui/Header'
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar'
import { LoginForm } from '@/features/auth/login/ui/LoginForm'
import { UserProfileCard } from '@/entities/user/ui/UserProfileCard'

// Здесь мы собираем страницу из виджетов, фич и сущностей
export const HomePage = () => {
  return (
    <div className="layout">
      <Header />
      <div className="content">
        <Sidebar />
        <main>
          <LoginForm />
          <UserProfileCard />
        </main>
      </div>
    </div>
  )
}
```

Теперь вы увидите, как это связывается с Next.js-роутом:

```tsx
// src/app/page.tsx

import { HomePage } from '@/pages/home/ui/HomePage'

// Это серверный компонент по умолчанию (Next.js 13+)
// Он просто рендерит FSD-страницу
export default function Page() {
  return <HomePage />
}
```

Так мы разделяем:

- `app` — отвечает за маршрутизацию;
- `pages` — отвечает за композицию интерфейса.

---

## Слои FSD и их роль в Next.js-проекте

### Слой app — интеграция приложения

В классическом FSD слой `app` — это точка входа, провайдеры, глобальные стили. В Next.js с app router глобальный layout и провайдеры часто живут в `src/app/layout.tsx`. Чтобы не смешивать инфраструктуру с бизнес-кодом, удобно вынести провайдеры в `src/appProviders`.

```tsx
// src/appProviders/index.tsx

'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

const queryClient = new QueryClient()

// Здесь мы собираем все клиентские провайдеры
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

Теперь подключаем это в layout:

```tsx
// src/app/layout.tsx

import './globals.css'
import { AppProviders } from '@/appProviders'

// Layout по умолчанию серверный, но внутри мы можем использовать клиентские провайдеры
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
```

Комментарии:

- layout остается максимально «тонким»;
- все, что связано с состоянием клиента, уходит в FSD-слой `appProviders` (слой `app`).

### Слой pages — композиция экранов

Слой `pages` вы уже увидели на примере `HomePage`. Основная идея:

- не размещать бизнес-логику в Next.js-страницах;
- не смешивать routing и бизнесовый UI.

Еще один пример, теперь с профилем:

```tsx
// src/pages/profile/ui/ProfilePage.tsx

import { Header } from '@/widgets/header/ui/Header'
import { UserProfileCard } from '@/entities/user/ui/UserProfileCard'
import { UpdateProfileForm } from '@/features/user/updateProfile/ui/UpdateProfileForm'

// Здесь мы строим страницу профиля из виджета и фичи обновления профиля
export const ProfilePage = () => {
  return (
    <>
      <Header />
      <section>
        <UserProfileCard />
        <UpdateProfileForm />
      </section>
    </>
  )
}
```

И Next.js-роут:

```tsx
// src/app/profile/page.tsx

import { ProfilePage } from '@/pages/profile/ui/ProfilePage'

// Next.js страница занимается только вызовом FSD-страницы
export default function Page() {
  return <ProfilePage />
}
```

### Слой widgets — крупные композиционные блоки

Виджеты — это готовые блоки, которые можно переиспользовать на разных страницах. Обычно они зависят от:

- `features`;
- `entities`;
- `shared`.

Пример виджета `Header`:

```tsx
// src/widgets/header/ui/Header.tsx

'use client'

import Link from 'next/link'
import { useUserAuth } from '@/features/auth/login/model/useUserAuth'
import { UserAvatar } from '@/entities/user/ui/UserAvatar'
import { Button } from '@/shared/ui/Button/Button'

// Здесь мы собираем шапку приложения с учетом авторизации
export const Header = () => {
  const { user, logout } = useUserAuth()

  return (
    <header className="header">
      <Link href="/">MyApp</Link>

      <nav>
        <Link href="/profile">Profile</Link>
      </nav>

      <div className="header-right">
        {user ? (
          <>
            <UserAvatar user={user} />
            <Button onClick={logout}>Logout</Button>
          </>
        ) : (
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </header>
  )
}
```

Обратите внимание:

- Виджет помечен `'use client'`, потому что использует хук `useUserAuth`.
- Это осознанное решение — мы не делаем весь layout клиентским, только тот блок, который действительно требует клиентских фич.

### Слой features — пользовательские сценарии

Фича — это «законченное действие» с точки зрения пользователя. Например: «логин», «добавление товара в корзину», «обновление профиля».

Давайте посмотрим на фичу `auth/login`.

Структура:

```txt
features/
  auth/
    login/
      ui/
        LoginForm.tsx
      model/
        useLogin.ts
        types.ts
```

Код:

```tsx
// src/features/auth/login/model/useLogin.ts

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginApi } from '@/entities/user/model/api'

// Этот хук инкапсулирует логику логина
export const useLogin = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Вызов API логина, определенного на уровне сущности user
      await loginApi({ email, password })

      // После успешного логина можно сделать редирект
      router.push('/profile')
    } catch (e) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
```

Теперь UI-часть:

```tsx
// src/features/auth/login/ui/LoginForm.tsx

'use client'

import { FormEvent, useState } from 'react'
import { useLogin } from '../model/useLogin'
import { Input } from '@/shared/ui/Input/Input'
import { Button } from '@/shared/ui/Button/Button'

// Эта форма использует хук useLogin и не знает деталей API
export const LoginForm = () => {
  const { login, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <form onSubmit={onSubmit}>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      {error && <div className="error">{error}</div>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </Button>
    </form>
  )
}
```

Как видите, фича:

- знает о сущности `user` только через API-слой `entities/user`;
- ничего не знает о конкретной странице, на которой используется.

### Слой entities — бизнес-сущности

Сущность — это центральный объект предметной области (user, product, order). В сущности концентрируется:

- типизация (types);
- API-доступ к данным;
- селекторы, адаптеры;
- базовые UI-компоненты, завязанные на конкретную сущность.

Пример для `user`:

```ts
// src/entities/user/model/types.ts

// Здесь мы описываем доменную модель пользователя
export type User = {
  id: string
  email: string
  name: string
  avatarUrl?: string
}
```

```ts
// src/entities/user/model/api.ts

import { User } from './types'
import { apiClient } from '@/shared/api/baseClient'

type LoginParams = {
  email: string
  password: string
}

// Этот модуль инкапсулирует работу с backend для сущности user
export const loginApi = async (params: LoginParams): Promise<User> => {
  const res = await apiClient.post<User>('/auth/login', params)
  return res.data
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  } catch {
    // Если пользователь не авторизован, возвращаем null
    return null
  }
}
```

```tsx
// src/entities/user/ui/UserAvatar.tsx

import Image from 'next/image'
import { User } from '../model/types'

// Простой UI-компонент, показывающий аватар пользователя
export const UserAvatar = ({ user }: { user: User }) => {
  return (
    <div className="user-avatar">
      <Image
        src={user.avatarUrl || '/default-avatar.png'}
        alt={user.name}
        width={32}
        height={32}
      />
    </div>
  )
}
```

Слой сущностей не должен знать о страницах и виджетах. Он предоставляет кирпичики, из которых собираются фичи и дальше — виджеты/страницы.

### Слой shared — общая инфраструктура

Слой `shared` содержит то, что:

- не связано с конкретной сущностью;
- используется большим количеством слоев.

Он часто делится на:

- `ui` — базовые UI-компоненты (Button, Input, Modal);
- `lib` — утилиты и хелперы;
- `api` — базовая настройка API-клиента;
- `config` — конфигурация.

Пример базового API-клиента, который пригодится для всех сущностей:

```ts
// src/shared/api/baseClient.ts

import axios from 'axios'

// Здесь мы инициализируем общий клиент для REST запросов
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})
```

Пример базовой кнопки:

```tsx
// src/shared/ui/Button/Button.tsx

import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

// Универсальная кнопка, не зависящая от конкретных фич
export const Button = ({ variant = 'primary', className, ...props }: Props) => {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, className)}
      {...props}
    />
  )
}
```

---

## Работа с серверными и клиентскими компонентами в FSD

Next.js 13+ с app router вводит разделение:

- серверные компоненты (по умолчанию);
- клиентские компоненты (с директивой `'use client'`).

В архитектуре FSD для Next.js важно:

- четко понимать, какие слои преимущественно серверные/клиентские;
- не превращать все в клиентские компоненты без необходимости.

### Рекомендации по слоям

Общая логика:

- `app` (Next.js layout и страницы) — преимущественно серверные;
- FSD-слой `pages` — чаще серверный, но может включать клиентские компоненты;
- `widgets` — зависит от содержимого, часто есть и серверные, и клиентские варианты;
- `features` — часто клиентские (формы, интерактивность), но часть логики можно вынести в server actions;
- `entities` — смешанные, но UI часто использует клиентский код (состояние, хендлеры);
- `shared` — тоже смешанный, особенно UI.

### Пример разделения: server actions + клиентская фича

Давайте разберем фичу обновления профиля, чтобы увидеть, как можно использовать server actions.

Сначала server action в Next.js-странице:

```tsx
// src/app/profile/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { updateProfile } from '@/entities/user/model/serverApi'

// Эта серверная функция обновляет профиль и инвалидирует кеш страницы
export async function updateProfileAction(formData: FormData) {
  const name = formData.get('name') as string

  await updateProfile({ name })

  // После обновления данных пересобираем страницу профиля
  revalidatePath('/profile')
}
```

Теперь сущность `user` на серверной стороне:

```ts
// src/entities/user/model/serverApi.ts

import { cookies } from 'next/headers'
import { User } from './types'

// Этот модуль можно вызывать только на сервере
export const updateProfile = async (params: { name: string }): Promise<User> => {
  const token = cookies().get('access_token')?.value

  // Здесь мы делаем запрос к backend с использованием токена
  // Комментарий - в реальном проекте используйте fetch/axios с учетом SSR
  const res = await fetch(`${process.env.API_URL}/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error('Failed to update profile')
  }

  return res.json()
}
```

Теперь UI-фича, использующая server action:

```tsx
// src/features/user/updateProfile/ui/UpdateProfileForm.tsx

'use client'

import { experimental_useFormStatus as useFormStatus } from 'react-dom'
import { updateProfileAction } from '@/app/profile/actions'
import { Button } from '@/shared/ui/Button/Button'

// Вспомогательный компонент, отслеживающий статус отправки формы
const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  )
}

// Клиентский компонент формы, который вызывает серверное действие
export const UpdateProfileForm = () => {
  return (
    <form action={updateProfileAction}>
      <input name="name" placeholder="Your name" />
      <SubmitButton />
    </form>
  )
}
```

Обратите внимание:

- фича остается клиентской, потому что использует `useFormStatus` и интерактивную форму;
- бизнес-логика обновления данных и взаимодействие с cookies сосредоточены в server action и server-side API в сущности `user`.

Такой подход помогает:

- не тащить доступ к cookies и другие серверные детали в клиентские фичи;
- сохранить чистоту слоев в FSD.

---

## Организация импортов и алиасов в nextjs-fsd

Чтобы FSD по-настоящему заработал, важно настроить алиасы, иначе вы быстро «утонете» в относительных путях.

### Настройка алиасов в Next.js

В Next.js (с TypeScript) обычно используется `tsconfig.json` и `next.config.js` (или `jsconfig.json` для JS).

Простой пример `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@app/*": ["app/*"],
      "@pages/*": ["pages/*"],
      "@widgets/*": ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

Комментарий:

- `baseUrl` указывает, что корнем для импортов является папка `src`;
- алиасы отражают FSD-слои, что сразу видно при чтении кода.

Теперь импорт выглядел бы так:

```ts
import { Header } from '@widgets/header/ui/Header'
import { LoginForm } from '@features/auth/login/ui/LoginForm'
import { User } from '@entities/user/model/types'
import { Button } from '@shared/ui/Button/Button'
```

Это делает связи между слоями визуально прозрачными.

---

## Пошаговое внедрение FSD в существующий Next.js-проект

Если у вас уже есть проект с типичной структурой:

```txt
components/
pages/
lib/
```

и вы хотите перейти к nextjs-fsd, вы можете сделать это постепенно.

### Шаг 1. Выделить shared-слой

Давайте начнем с простого:

1. Создайте папку `src/shared`.
2. Переместите туда:
   - базовые UI-компоненты;
   - утилиты (`lib`);
   - конфигурацию.

Пример:

- `components/Button.tsx` → `shared/ui/Button/Button.tsx`;
- `lib/formatDate.ts` → `shared/lib/formatDate.ts`.

### Шаг 2. Выделить сущности (entities)

Посмотрите на свой код и найдите повторяющиеся «темы»:

- user;
- product;
- order;
- article.

Создайте `src/entities/<entity>` и начните переносить:

- типы;
- API-запросы;
- «карточки» и прочие UI-компоненты, которые явно завязаны на эту сущность.

Например:

- `components/UserCard.tsx` → `entities/user/ui/UserProfileCard.tsx`;
- `api/user.ts` → `entities/user/model/api.ts`.

### Шаг 3. Формирование фич (features)

Теперь определите пользовательские сценарии:

- логин;
- регистрация;
- фильтрация списка;
- добавление в корзину.

Создайте для них фичи:

- `features/auth/login`;
- `features/cart/addToCart`.

Перенесите:

- формы;
- хуки, которые управляют этими формами;
- бизнес-правила, относящиеся к этим сценариям.

### Шаг 4. Соберите виджеты (widgets)

Посмотрите на заголовки, боковые панели, карточки дашборда, которые состоят из нескольких фич и сущностей.

Создайте виджеты, например:

- `widgets/header`;
- `widgets/sidebar`;
- `widgets/productList`.

Переместите туда сложные композиционные компоненты.

### Шаг 5. Создайте слой pages

Для каждой важной страницы создайте FSD-страницу:

- `pages/home`;
- `pages/profile`;
- `pages/productDetails`.

И перенесите туда сборку из виджетов и фич.

После этого Next.js-страницы (`app/<route>/page.tsx` или `pages/*.tsx`) станут тонкими обертками.

---

## Практический пример: страница профиля пользователя в стиле nextjs-fsd

Давайте соберем все воедино на примере типичной страницы профиля.

### 1. Сущность user

```ts
// src/entities/user/model/types.ts

export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
}
```

```ts
// src/entities/user/model/api.ts

import { User } from './types'
import { apiClient } from '@shared/api/baseClient'

// Получение профиля текущего пользователя
export const fetchProfile = async (): Promise<User> => {
  const res = await apiClient.get<User>('/user/profile')
  return res.data
}
```

```tsx
// src/entities/user/ui/UserProfileCard.tsx

'use client'

import { useEffect, useState } from 'react'
import { fetchProfile } from '../model/api'
import { User } from '../model/types'

// Компонент, показывающий профиль пользователя
export const UserProfileCard = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Здесь мы загружаем данные профиля при монтировании компонента
    fetchProfile().then(setUser).catch(() => setUser(null))
  }, [])

  if (!user) {
    return <div>Loading profile...</div>
  }

  return (
    <div className="profile-card">
      <h2>{user.name}</h2>
      <div>{user.email}</div>
    </div>
  )
}
```

### 2. Фича обновления профиля

```tsx
// src/features/user/updateProfile/ui/UpdateProfileForm.tsx

'use client'

import { FormEvent, useState } from 'react'
import { Button } from '@shared/ui/Button/Button'
import { Input } from '@shared/ui/Input/Input'
import { apiClient } from '@shared/api/baseClient'

// Форма, которая обновляет имя пользователя
export const UpdateProfileForm = () => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Отправляем новое имя на сервер
      await apiClient.patch('/user/profile', { name })
      // В реальном приложении можно еще обновить локальное состояние пользователя
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New name"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

### 3. Виджет профиля

```tsx
// src/widgets/profile/ui/ProfileWidget.tsx

import { UserProfileCard } from '@entities/user/ui/UserProfileCard'
import { UpdateProfileForm } from '@features/user/updateProfile/ui/UpdateProfileForm'

// Виджет, который комбинирует данные профиля и форму редактирования
export const ProfileWidget = () => {
  return (
    <section>
      <UserProfileCard />
      <UpdateProfileForm />
    </section>
  )
}
```

### 4. FSD-страница профиля

```tsx
// src/pages/profile/ui/ProfilePage.tsx

import { Header } from '@widgets/header/ui/Header'
import { ProfileWidget } from '@widgets/profile/ui/ProfileWidget'

// Страница, которая собирает header и виджет профиля
export const ProfilePage = () => {
  return (
    <>
      <Header />
      <main>
        <ProfileWidget />
      </main>
    </>
  )
}
```

### 5. Next.js-роут

```tsx
// src/app/profile/page.tsx

import { ProfilePage } from '@pages/profile/ui/ProfilePage'

// Страница Next.js, которая просто рендерит FSD-страницу
export default function Page() {
  return <ProfilePage />
}
```

Давайте посмотрим, что здесь важно:

- каждая часть системы знает только то, что ей нужно знать;
- логика API и типы сосредоточены в сущности `user`;
- фича `updateProfile` решает конкретную задачу и не тянет в себя лишнее;
- виджет профиля собирает сущность и фичу в один блок;
- страница профиля собирает layout из виджета и заголовка.

---

## Заключение

Подход nextjs-fsd позволяет согласовать две важные вещи:

- встроенную файловую архитектуру Next.js;
- бизнес-ориентированное разделение кода по фичам и сущностям.

Если кратко об основных идеях:

- Next.js-роуты в `app` или `pages` — транспортный уровень, они не должны содержать сложную бизнес-логику;
- FSD-слои (app, pages, widgets, features, entities, shared) отвечают за структуру и связи внутри фронтенд-приложения;
- импорт по алиасам и движение зависимостей «сверху вниз» помогают избежать хаотичных связей;
- разделение на серверные и клиентские компоненты нужно проектировать осознанно, особенно в layers `features` и `entities`;
- внедрять FSD можно поэтапно, начиная с `shared`, затем `entities`, `features`, `widgets` и только потом `pages`.

Используя этот подход, вы получаете:

- предсказуемую структуру проекта;
- понятные границы между модулями;
- возможность масштабировать команду и функциональность без постоянных «рефакторингов всего на свете».

---

## Частозадаваемые технические вопросы по теме и ответы

### Как лучше организовать тесты в nextjs-fsd структуре

Рекомендуется сохранять ту же иерархию слоев. Вы можете использовать два подхода  
1) Тесты рядом с кодом  
`features/auth/login/ui/LoginForm.test.tsx`  
`entities/user/model/api.test.ts`  
2) Отдельное дерево `tests` с зеркальной структурой  
`tests/features/auth/login/LoginForm.test.tsx`  
Главное — не смешивать тесты разных слоев и сохранять тот же принцип зависимостей сверху вниз.

### Как ограничить неправильные импорты между слоями

Вы можете использовать ESLint c плагином `boundaries` или `import` и задать правила  
- запрещаем импорт `pages` из `features` и `entities`  
- разрешаем импорт `shared` отовсюду  
Пример правила  
`no-restricted-imports` с паттернами `@pages/*` для слоев `features` и `entities`.

### Как хранить глобальное состояние в FSD при использовании Redux или Zustand

Создайте модуль состояния в `shared` или на уровне конкретной сущности  
- глобальное состояние темы или языка — `shared/model/themeStore`  
- состояние пользователя — `entities/user/model/userStore`  
Фичи работают с состоянием через публичные методы сущности или shared-стора, а не напрямую через внутреннюю реализацию.

### Как поступать с layout компонентами Next.js в контексте FSD

Глобальные layout’ы и `template`-компоненты оставляйте в `src/app`. Внутри них можно использовать FSD-компоненты верхних слоев  
например, `Header` из `widgets`. Избегайте логики фич и сущностей прямо в layout’ах — лучше подключайте виджеты и страницы FSD.

### Как версионировать и переиспользовать фичи между несколькими Next.js приложениями

Если фича действительно общая  
- вынесите ее в отдельный npm-пакет с той же FSD-структурой внутри пакета  
- используйте алиасы вида `@acme/features/*`  
Следите, чтобы пакет не тянул в себя детали конкретного приложения — только `shared` и общие сущности, которые вы готовы разделять между проектами.