---
metaTitle: Архитектура Feature Sliced Design для Next.js без боли
metaDescription: Подробное руководство по применению Feature Sliced Design в Next.js проектах - структура слоев примеры кода лучшие практики и типичные ошибки
author: Олег Марков
title: Feature Sliced Design для Next.js - как организовать масштабируемый фронтенд
preview: Разберем как применять Feature Sliced Design в Next.js - разложим проект на слои и срезы увидим живую структуру nextjs fsd и примеры реализации
---

## Введение

Feature-Sliced Design (FSD) за последние годы стал одним из самых обсуждаемых подходов к архитектуре фронтенда. Он особенно хорошо ложится на React-приложения с растущей сложностью: раздувающиеся компоненты, хаотичные директории, бесконечные «перекидывания» пропсов.

Но когда вы начинаете применять его в Next.js, появляется ряд вопросов:

- как совместить FSD со встроенными правилами маршрутизации Next.js  
- где хранить страницы, если в FSD основная единица — фича  
- как использовать новый App Router и серверные компоненты вместе с FSD  
- какие директории заводить и как называть слои  

Смотрите, в этой статье я покажу вам, как адаптировать Feature-Sliced Design под Next.js (далее будем называть это nextjs-fsd), на живых примерах структуры и кода. Вы увидите, как можно построить проект так, чтобы:

- страница была только «сборщиком» интерфейса  
- бизнес-логика и UI были разложены по слоям  
- маршрутизация Next.js не ломала архитектуру, а дополняла ее  

Будем рассматривать подход в контексте нового App Router (`app/` директория), потому что именно он сейчас является рекомендуемым способом разработки на Next.js.

---

## Базовые принципы Feature-Sliced Design

### Что такое Feature-Sliced Design в двух словах

FSD — это способ организовать фронтенд-проект так, чтобы:

- код был разбит по **функциональности**, а не по типам файлов  
- уровень абстракции повышался от «мелкой логики» к крупным сценариям  
- зависимости шли **только вверх** по слоям (от более низких к более высокоуровневым)  

Классические слои FSD:

- **shared** — переиспользуемые примитивы, утилиты, дизайн-система  
- **entities** — бизнес-сущности (User, Product, Order и т.д.)  
- **features** — законченные пользовательские возможности (Login, AddToCart)  
- **widgets** — крупные блоки страницы (Header, CartPanel, ProductGallery)  
- **pages** — конкретные страницы, собранные из виджетов и фич  
- **app** — точка входа, конфигурация, провайдеры  

В Next.js уже есть свой `app/` или `pages/`, поэтому FSD немного адаптируем.

### Как FSD стыкуется с Next.js

Для Next.js с App Router удобно использовать следующую верхнеуровневую структуру:

```
src/
  app/           // маршрутизация Next.js
  shared/
  entities/
  features/
  widgets/
  processes/     // опционально - сложные сценарии
  pages/         // "страницы как слой FSD", но не как маршруты Next.js
```

Здесь важно разделить:

- **`app/`** — маршруты и layout’ы Next.js (файлы `page.tsx`, `layout.tsx`, `loading.tsx`)  
- **`pages/` (слой FSD)** — React-компоненты страниц, собранные из виджетов и фич  

То есть реальный маршрут Next.js (`/app/profile/page.tsx`) может просто импортировать FSD-страницу (`src/pages/profile`) и использовать ее как основной контент.

---

## Структура nextjs-fsd проекта

### Общий скелет проекта

Давайте посмотрим, как может выглядеть базовая структура Next.js приложения с FSD:

```
src/
  app/
    layout.tsx
    page.tsx                // route: /
    profile/
      page.tsx              // route: /profile
  shared/
    ui/
      button/
        index.ts
        button.tsx
      input/
        index.ts
        input.tsx
    config/
      api.ts
      env.ts
    lib/
      fetcher.ts
      format-date.ts
    styles/
      globals.css
  entities/
    user/
      model/
        types.ts
        selectors.ts
        hooks.ts
      api/
        get-current-user.ts
      ui/
        user-card/
          index.ts
          user-card.tsx
  features/
    auth/
      login-by-email/
        model/
          use-login.ts
        ui/
          login-form/
            index.ts
            login-form.tsx
  widgets/
    header/
      ui/
        header.tsx
    user-profile/
      ui/
        user-profile.tsx
  pages/
    home/
      ui/
        home-page.tsx
    profile/
      ui/
        profile-page.tsx
```

Смотрите, здесь важные моменты:

- `src/app` — отвечает за маршрутизацию и интеграцию с платформой Next.js  
- остальные слои (`shared`, `entities`, `features`, `widgets`, `pages`) — **чистый React + бизнес-логика** по правилам FSD  
- `pages/*` в FSD — не маршруты, а **компоненты-страницы** (для сборки интерфейса)  

Теперь давайте разберем каждый слой детальнее.

---

## Слой shared в nextjs-fsd

### Назначение слоя shared

Слой `shared` содержит то, что может использоваться в любом месте проекта и при этом:

- не зависит от бизнес-домена  
- не знает о конкретных сущностях (User, Product и т.д.)  
- часто представляет собой дизайн-систему, хелперы, конфигурацию  

Можно ориентироваться на такое деление:

- `shared/ui` — базовые UI-компоненты  
- `shared/lib` — утилиты и хелперы  
- `shared/config` — конфигурация (endpoints, environment)  
- `shared/api` — общая настройка клиента (например, axios instance)  
- `shared/styles` — глобальные стили, темы  

### Пример простого UI-компонента

Теперь вы увидите, как это выглядит в коде. Допустим, у вас есть общий `Button`.

```tsx
// src/shared/ui/button/button.tsx

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; // Вариант отображения кнопки
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  return (
    <button
      // Здесь мы собираем классы: базовые стили + конкретный вариант + дополнительные классы
      className={clsx(
        "rounded px-4 py-2 text-sm font-medium",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" && "bg-gray-200 text-gray-900 hover:bg-gray-300",
        className
      )}
      {...props} // Пробрасываем все остальные пропсы дальше
    />
  );
};
```

```ts
// src/shared/ui/button/index.ts

export { Button } from "./button";
// Здесь мы экспортируем компонент через index.ts,
// чтобы снаружи импорт выглядел короче: import { Button } from "@/shared/ui/button";
```

Такой `Button` может использоваться в любом слое: в сущностях, фичах, виджетах и страницах.

### Пример общей конфигурации API

Еще один пример — конфигурация HTTP-клиента, которая может использоваться во всем приложении.

```ts
// src/shared/config/api.ts

// Здесь мы храним базовый URL для API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com";
```

```ts
// src/shared/lib/fetcher.ts

// Здесь мы создаем универсальную функцию-обертку над fetch
export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    // Добавляем к запросу базовую конфигурацию
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    // Если сервер вернул ошибку - бросаем исключение
    throw new Error(`Request failed with status ${response.status}`);
  }

  // Преобразуем JSON в типизированный ответ
  return response.json() as Promise<T>;
}
```

---

## Слой entities: работа с бизнес-сущностями

### Что такое сущность в FSD

Сущность (`entity`) — это бизнес-объект, вокруг которого строится логика: пользователь, товар, заказ, статья и т.д. У сущности есть:

- типы данных  
- API-запросы к серверу  
- состояния и селекторы  
- базовые UI-компоненты, завязанные на конкретную сущность  

Главное — сущность не знает о сценариях использования, она просто описывает «что такое User» или «что такое Product».

### Пример сущности User

Давайте разберемся на примере `User`.

```ts
// src/entities/user/model/types.ts

// Здесь мы описываем тип пользователя,
// который будем использовать во всем приложении
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
```

```ts
// src/entities/user/api/get-current-user.ts

import { API_BASE_URL } from "@/shared/config/api";
import { apiFetch } from "@/shared/lib/fetcher";
import { User } from "../model/types";

// Здесь мы описываем запрос к API для получения текущего пользователя
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await apiFetch<User>(`${API_BASE_URL}/me`, {
      credentials: "include", // Добавляем cookie к запросу
    });

    return user;
  } catch (error) {
    // Если запрос не удался (например, пользователь не авторизован) - возвращаем null
    return null;
  }
}
```

```tsx
// src/entities/user/ui/user-card/user-card.tsx

import Image from "next/image";
import { User } from "../../model/types";

interface UserCardProps {
  user: User; // Пользователь, которого мы отображаем
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl && (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}

      <div className="flex flex-col">
        {/* Здесь мы показываем имя пользователя */}
        <span className="font-medium">{user.name}</span>
        {/* Здесь мы показываем email пользователя */}
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
    </div>
  );
};
```

```ts
// src/entities/user/ui/user-card/index.ts

export { UserCard } from "./user-card";
```

Смотрите, сущность `user` уже умеет:

- описывать структуру данных  
- запрашивать данные о текущем пользователе  
- отображать пользователя в виде компонента `UserCard`  

Но при этом она **не** реализует сценариев входа в систему, смены пароля и т.д. Это уже задачи фич.

---

## Слой features: пользовательские возможности

### Идея слоя features

Фича (`feature`) — это конкретная пользовательская возможность:

- «Войти по email и паролю»  
- «Добавить товар в корзину»  
- «Отфильтровать список»  
- «Поставить лайк»  

Фича может использовать сущности (`entities`) и `shared`, но не должна напрямую зависеть от `widgets` или `pages`.

Структурно можно разделить:

- `model` — бизнес-логика фичи (хуки, сторы, эффекты)  
- `ui` — компоненты интерфейса фичи  

### Пример фичи «Login по email»

Покажу вам, как это реализовано на практике.

```ts
// src/features/auth/login-by-email/model/use-login.ts

"use client"; // Фича использует client-компоненты и хуки

import { useState } from "react";

interface LoginFormValues {
  email: string;
  password: string;
}

interface UseLoginResult {
  values: LoginFormValues;
  isLoading: boolean;
  error: string | null;
  handleChange: (field: keyof LoginFormValues, value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useLogin(onSuccess?: () => void): UseLoginResult {
  // Здесь мы храним значения формы
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  // Здесь мы храним состояние загрузки
  const [isLoading, setIsLoading] = useState(false);
  // Здесь мы храним текст ошибки, если она произошла
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof LoginFormValues, value: string) {
    // Обновляем только одно поле формы
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    try {
      // Здесь вы можете вызвать реальный API авторизации
      // В примере для простоты мы просто ждем полсекунды
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Если авторизация прошла успешно - вызываем колбек
      onSuccess?.();
    } catch (e) {
      // В случае ошибки сохраняем текст ошибки
      setError("Не удалось выполнить вход. Попробуйте еще раз.");
    } finally {
      // В любом случае снимаем флаг загрузки
      setIsLoading(false);
    }
  }

  return {
    values,
    isLoading,
    error,
    handleChange,
    handleSubmit,
  };
}
```

```tsx
// src/features/auth/login-by-email/ui/login-form/login-form.tsx

"use client"; // Компонент использует хуки, значит должен быть клиентским

import { FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { useLogin } from "../../model/use-login";

interface LoginFormProps {
  onSuccess?: () => void; // Колбек при успешном входе
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { values, isLoading, error, handleChange, handleSubmit } = useLogin(
    onSuccess
  );

  async function onSubmit(event: FormEvent) {
    // Отменяем стандартное поведение формы (перезагрузку страницы)
    event.preventDefault();
    // Вызываем логику отправки формы
    await handleSubmit();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <div className="flex flex-col gap-1">
        {/* Поле email */}
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        {/* Поле password */}
        <label className="text-sm font-medium">Пароль</label>
        <input
          type="password"
          value={values.password}
          onChange={(event) => handleChange("password", event.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Блок с ошибкой, если она есть */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Кнопка отправки формы */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Входим..." : "Войти"}
      </Button>
    </form>
  );
};
```

```ts
// src/features/auth/login-by-email/ui/login-form/index.ts

export { LoginForm } from "./login-form";
```

Теперь у вас есть фича, которая:

- инкапсулирует логику авторизации  
- предоставляет готовый UI-компонент  
- может использоваться на любой странице, без копипасты форм  

---

## Слой widgets: крупные блоки страницы

### Что делают виджеты

Виджет (`widget`) — это крупный, но все еще переиспользуемый блок, который:

- может объединять несколько фич и сущностей  
- может использовать контекст приложения  
- не является целой страницей, но уже представляет собой значимый кусок интерфейса  

Примеры:

- `header` — шапка сайта с логотипом, навигацией и кнопкой профиля  
- `user-profile` — блок с данными пользователя, в котором используются несколько фич (например, редактирование + отображение)  
- `cart` — панель корзины с количеством товара и стоимостью  

### Пример виджета Header

Давайте посмотрим, что происходит в следующем примере.

```tsx
// src/widgets/header/ui/header.tsx

import Link from "next/link";
import { UserCard } from "@/entities/user/ui/user-card";
import { getCurrentUser } from "@/entities/user/api/get-current-user";

// Обратите внимание - это серверный компонент (нет "use client")
// Мы можем выполнять здесь серверные запросы
export const Header = async () => {
  // Здесь мы получаем текущего пользователя на сервере
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Логотип и навигация */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            Next FSD
          </Link>
          <nav className="flex gap-3 text-sm text-gray-600">
            <Link href="/profile">Профиль</Link>
          </nav>
        </div>

        {/* Блок пользователя справа */}
        <div>
          {user ? (
            // Если пользователь авторизован - показываем карточку
            <UserCard user={user} />
          ) : (
            // Если пользователь не авторизован - показываем ссылку Войти
            <Link href="/login" className="text-sm text-blue-600">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
```

Такой виджет вы можете использовать:

- в общем `layout.tsx`  
- в конкретных страницах, если нужно  

---

## Слой pages (FSD) и app (Next.js)

### Почему в FSD есть свой слой pages

Слой `pages` в FSD отвечает за:

- композицию виджетов и фич в конкретные страницы  
- определение структуры страницы (секции, блоки)  
- минимальное количество логики  

При этом в Next.js маршрутизация живет в `app/` или `pages/` (старый подход). В nextjs-fsd подход обычно такой:

- файл маршрута (`src/app/profile/page.tsx`) — «обертка» вокруг FSD-страницы  
- FSD-страница (`src/pages/profile/ui/profile-page.tsx`) — сама реализация страницы  

Это позволяет:

- изолировать бизнес-архитектуру от фреймворка  
- проще переносить или переиспользовать страницу (например, в Storybook)  

### Пример FSD-страницы

```tsx
// src/pages/profile/ui/profile-page.tsx

import { Header } from "@/widgets/header/ui/header";
import { UserProfile } from "@/widgets/user-profile/ui/user-profile";

// Здесь мы описываем структуру страницы профиля,
// используя готовые виджеты
export const ProfilePage = async () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Шапка сайта */}
      <Header />

      {/* Контент страницы */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Профиль</h1>

        {/* Здесь мы выводим виджет профиля пользователя */}
        <UserProfile />
      </main>
    </div>
  );
};
```

### Пример интеграции с Next.js app router

Теперь давайте перейдем к следующему шагу — подключим эту страницу в Next.js.

```tsx
// src/app/profile/page.tsx

import { ProfilePage } from "@/pages/profile/ui/profile-page";

// Этот компонент будет использован Next.js как страница по адресу /profile
// Внутри него мы просто рендерим FSD-страницу
export default function ProfileRoute() {
  return <ProfilePage />;
}
```

Здесь маршрут Next.js:

- не содержит логики  
- не знает о деталях реализации `UserProfile`, `Header` и т.д.  
- просто «связывает» Next.js с FSD-слоем  

Аналогично вы можете сделать для главной страницы:

```tsx
// src/pages/home/ui/home-page.tsx

import { Header } from "@/widgets/header/ui/header";

export const HomePage = async () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Главная</h1>
        <p className="text-gray-700">
          Это пример главной страницы, собранной по принципам FSD.
        </p>
      </main>
    </div>
  );
};
```

```tsx
// src/app/page.tsx

import { HomePage } from "@/pages/home/ui/home-page";

export default function HomeRoute() {
  return <HomePage />;
}
```

---

## Работа с серверными и клиентскими компонентами в FSD

Next.js App Router вводит разделение на:

- **серверные компоненты** (по умолчанию)  
- **клиентские компоненты** (`"use client"` в начале файла)  

В контексте FSD это важно учитывать, чтобы не нарушать правила Next.js.

### Общие рекомендации

1. **По умолчанию делайте компоненты серверными**  
   Если компонент не использует хуки React, `useState`, `useEffect`, `useRouter` и т.д. — он может быть серверным.

2. **UI-фича, использующая хуки, должна быть клиентской**  
   В примере с `LoginForm` мы добавили `"use client"`, потому что там используется `useState`.

3. **Виджеты могут быть как серверными, так и клиентскими**  
   Например, `Header` может быть серверным (как в примере с `getCurrentUser`).

4. **Старайтесь «отталкивать» клиентский код вниз по дереву**  
   То есть пусть страница и виджеты будут серверными, а внутри уже рендерят клиентские фичи (формы, интерактив).

### Пример: серверная страница + клиентская фича

```tsx
// src/pages/login/ui/login-page.tsx

import { Header } from "@/widgets/header/ui/header";
import { LoginForm } from "@/features/auth/login-by-email/ui/login-form";

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        {/* Здесь мы выводим клиентскую фичу LoginForm */}
        <LoginForm
          onSuccess={() => {
            // В реальном коде вы можете использовать роутер
            // Но роутер можно передать внутрь через пропсы или контекст
            console.log("Login success");
          }}
        />
      </main>
    </div>
  );
};
```

```tsx
// src/app/login/page.tsx

import { LoginPage } from "@/pages/login/ui/login-page";

export default function LoginRoute() {
  return <LoginPage />;
}
```

Здесь:

- `LoginPage` — серверный компонент (нет `"use client"`)  
- `LoginForm` — клиентский компонент, инкапсулирующий состояние и события  

---

## Организация импортов и alias’ов

### Почему алиасы важны в FSD

В FSD-архитектуре вы часто импортируете модули из разных слоев. Если не настроить alias’ы, пути будут длинными и хрупкими:

- `"../../../../shared/ui/button"`

Гораздо удобнее использовать алиасы:

- `"@/shared/ui/button"`  
- `"@/entities/user"`  

Это делает структуру:

- более читаемой  
- менее зависимой от реальных путей на диске  

### Настройка alias’ов в Next.js 13+

В Next.js на TypeScript достаточно настроить `tsconfig.json` (или `jsconfig.json`).

```json
// tsconfig.json (фрагмент)
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@shared/*": ["shared/*"],
      "@entities/*": ["entities/*"],
      "@features/*": ["features/*"],
      "@widgets/*": ["widgets/*"],
      "@pages/*": ["pages/*"]
    }
  }
}
```

Комментарии к этому фрагменту:

- `baseUrl: "src"` — теперь все пути считаются относительно папки `src`  
- `@/*` — общий алиас, чтобы писать `@/shared/ui/button` вместо `../../shared/ui/button`  
- дополнительные алиасы можно использовать по желанию  

После этого можно импортировать так:

```ts
// Было:
// import { Button } from "../../shared/ui/button";

// Стало:
import { Button } from "@/shared/ui/button";
```

---

## Пример полного пути от запроса до UI в nextjs-fsd

Чтобы картина сложилась полностью, давайте разберем пример сценария:

> «Показать страницу профиля, где в шапке и в блоке профиля отображаются данные текущего пользователя».

### 1. Сущность User

Мы уже описали типы и API в `entities/user`. Добавим хук для работы с пользователем на клиенте (например, при обновлении профиля).

```ts
// src/entities/user/model/hooks.ts

"use client";

import { useState, useEffect } from "react";
import { User } from "./types";
import { getCurrentUser } from "../api/get-current-user";

export function useCurrentUser() {
  // Здесь мы храним пользователя
  const [user, setUser] = useState<User | null>(null);
  // Здесь мы храним флаг загрузки
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // При монтировании хука загружаем данные о пользователе
    getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  return { user, isLoading };
}
```

### 2. Виджет UserProfile

Создадим виджет, который использует этот хук и отображает профиль.

```tsx
// src/widgets/user-profile/ui/user-profile.tsx

"use client";

import { useCurrentUser } from "@/entities/user/model/hooks";
import { UserCard } from "@/entities/user/ui/user-card";

export const UserProfile = () => {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    // Пока идет загрузка - показываем скелетон или простой текст
    return <p>Загружаем профиль...</p>;
  }

  if (!user) {
    // Если пользователь не найден - показываем сообщение
    return <p>Пользователь не авторизован.</p>;
  }

  // Если все хорошо - показываем карточку пользователя
  return (
    <section className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Ваш профиль</h2>
      <UserCard user={user} />
    </section>
  );
};
```

### 3. Страница ProfilePage

Мы уже видели пример `ProfilePage`, где используется `Header` и `UserProfile`. В связке все выглядит так:

```tsx
// src/pages/profile/ui/profile-page.tsx

import { Header } from "@/widgets/header/ui/header";
import { UserProfile } from "@/widgets/user-profile/ui/user-profile";

export const ProfilePage = async () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Профиль</h1>
        <UserProfile />
      </main>
    </div>
  );
};
```

```tsx
// src/app/profile/page.tsx

import { ProfilePage } from "@/pages/profile/ui/profile-page";

export default function ProfileRoute() {
  return <ProfilePage />;
}
```

Итого:

- Next.js отвечает только за маршрут `/profile`  
- страница собирает виджеты  
- виджеты используют фичи и сущности  
- бизнес-логика сосредоточена в `entities` и `features`  

---

## Типичные ошибки при внедрении nextjs-fsd

### 1. Смешивание слоев

Распространенная проблема:

- фича импортирует компонент из `widgets`  
- сущность импортирует фичу  

Это нарушает принцип «зависимости только вверх». Чтобы контролировать это, многие команды используют линтеры архитектуры (например, `eslint-plugin-boundaries`), но даже без них можно придерживаться простого правила:

- `shared` — никого не знает  
- `entities` — знают только `shared`  
- `features` — знают `entities`, `shared`  
- `widgets` — знают `features`, `entities`, `shared`  
- `pages` — знают все выше, кроме `app`  
- `app` — точка входа, знает о FSD-слоях, но старается быть тонким  

### 2. Слишком мелкие фичи

Иногда разработчики создают фичу почти под каждый компонент. Например:

- `toggle-sidebar`  
- `open-modal`  

Такие вещи обычно лучше оставить в `widgets` или даже в `shared`. Фича должна отражать реальную пользовательскую ценность. Если действие не объясняется бизнес-языком («показать корзину», «создать заказ»), возможно, это не фича.

### 3. Игнорирование преимуществ серверных компонентов

При переходе на App Router есть соблазн писать «как раньше»:

- все клиентские компоненты  
- все запросы через `useEffect`  

В FSD с Next.js лучше:

- максимально использовать серверные компоненты (`async`-компоненты, `fetch` на сервере)  
- отдавать данные вниз в клиентские компоненты через пропсы  

---

## Когда FSD действительно нужен Next.js проекту

Для маленьких проектов FSD может показаться избыточным. Но он начинает «отбиваться», когда:

- страниц становится больше 5–7  
- появляются повторяющиеся фичи (логин, избранное, корзина)  
- над проектом работают несколько разработчиков  

Признаки, что FSD поможет:

- вы не понимаете, куда положить новый компонент  
- одинаковая логика дублируется на разных страницах  
- изменение одной фичи вызывает правки в десятке файлов в разных местах проекта  

С FSD у вас есть четкие ответы:

- бизнес-логика — в `entities` и `features`  
- композиция — в `widgets` и `pages`  
- маршруты — в `app`  

---

## Заключение

Feature-Sliced Design хорошо сочетается с архитектурой Next.js, если разделить:

- область ответственности Next.js (маршруты, платформенные возможности, серверные компоненты)  
- область ответственности FSD (структурирование бизнес-логики и UI по слоям и фичам)  

В nextjs-fsd подходе вы:

- используете `app/` для маршрутов и layout’ов  
- строите доменную архитектуру в `shared`, `entities`, `features`, `widgets`, `pages`  
- подключаете FSD-страницы внутри файлов маршрутов Next.js  

Такой подход позволяет:

- не привязывать бизнес-архитектуру к деталям фреймворка  
- проще масштабировать проект и команду  
- быстрее находить место для нового кода и понимать, где что лежит  

Если вы только начинаете внедрять FSD в Next.js, имеет смысл:

1. Ввести базовую структуру слоев.  
2. Начать переносить существующие фичи постепенно, без глобальных рефакторингов.  
3. Следить за направлением зависимостей между слоями.  

---

## Частозадаваемые технические вопросы по теме nextjs-fsd

### Как организовать тесты в проекте с FSD и Next.js

Обычно тесты хранят рядом с кодом слоя:

- `entities/user/model/__tests__/hooks.test.ts`  
- `features/auth/login-by-email/ui/__tests__/login-form.test.tsx`  

Вы можете использовать Jest или Vitest. Главное правило — тестировать модули слоя изолированно: не подтягивать лишние слои в тесты. Для компонентного тестирования удобно использовать Testing Library, рендеря компоненты `features` и `widgets` без участия Next.js маршрутов.

### Как подключать Storybook к FSD структуре

Storybook лучше всего использовать для слоев `shared/ui`, `entities/ui`, `features/ui`, `widgets`. Вы настраиваете Storybook так, чтобы он читал компоненты из `src`, с теми же alias’ами (`@/shared`, `@/features` и т.д.). Затем создаете сторис в тех же директориях, например: `src/features/auth/login-by-email/ui/login-form/login-form.stories.tsx`. Это помогает демонстрировать фичи и виджеты в отрыве от Next.js.

### Как реализовать общие layout’ы с FSD и App Router

Layout’ы Next.js (`src/app/layout.tsx`, `src/app/(auth)/layout.tsx`) можно рассматривать как часть слоя `app`. Внутри layout’ов вы можете подключать виджеты из FSD, например `Header` или `Sidebar`. Логику и UI layout’а, которые относятся к домену, лучше выносить в `widgets`, а в layout оставлять только «каркас» и рендер детей.

### Как обрабатывать глобальное состояние (например, корзину) в FSD

Глобальное состояние, завязанное на бизнес-сущности (Cart, UserSettings), обычно размещают в соответствующей сущности: `entities/cart/model/store.ts`. Фичи и виджеты используют это состояние через публичные API сущности. Если состояние техническое (например, тема светлая/темная), его можно вынести в `shared/model` или отдельный `shared/lib` с контекстом и хук-оберткой.

### Как разделять код для public и admin части в nextjs-fsd

Если у приложения есть две зоны (public и admin), удобно добавить пространственные группировки внутри слоев. Например: `features/admin/manage-users`, `widgets/admin/sidebar`, `pages/admin/dashboard`. Маршруты Next.js можно разнести по группам, используя сегменты App Router (`src/app/(public)/...`, `src/app/(admin)/...`). При этом сами фичи и сущности остаются в общих слоях, но могут иметь поддиректории `admin` при необходимости.