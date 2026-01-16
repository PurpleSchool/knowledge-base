---
metaTitle: Путь к файлу в архитектуре FSD - fsd-path
metaDescription: Подробное руководство по работе с путями и модулями в архитектуре Feature Sliced Design - разбор принципов построения структуры проекта и навигации по файлам
author: Олег Марков
title: Путь к файлу в архитектуре Feature Sliced Design - fsd-path
preview: Разберем как организовывать и читать пути к файлам в проектах с архитектурой FSD - чтобы вы уверенно ориентировались в слоях, слайсах и сегментах и без лишних усилий находили нужный код
---

## Введение

Когда вы начинаете работать с архитектурой Feature-Sliced Design (FSD), одна из первых реальных проблем — это пути к файлам. Структура проекта становится более сложной, появляются слои, слайсы, сегменты, публичные API и внутренние реализации. Без понятной системы именования и организации путей код быстро превращается в хаос.

Термин "fsd-path" обычно используют как собирательное название для подхода к формированию путей к файлам и модулям в проектах, построенных по FSD. В некоторых командах под этим даже понимают утилиту или набор правил, которые упрощают работу с импортами, навигацию по проекту и соблюдение архитектурных границ.

В этой статье вы разберетесь:

- как устроен путь к файлу в FSD-проекте;
- чем путь в FSD отличается от "обычной" структуры;
- как делить путь на слои, слайсы и сегменты;
- как правильно импортировать код между слоями;
- как использовать alias-импорты для удобной навигации;
- как не нарушать архитектурные правила при работе с путями.

Я буду показывать вам примеры структуры, конфигурации и кода, чтобы вы могли сразу сопоставить теорию с практикой.

## Базовые понятия FSD и их связь с путями

### Основные элементы архитектуры FSD

Прежде чем говорить про пути, нужно определить, из чего вообще состоит FSD-проект. В классическом варианте вы используете следующие слои:

- `app` — старт приложения, инициализация, роуты, провайдеры;
- `processes` — сквозные бизнес-процессы (необязательный слой);
- `pages` — страницы, которые пользователь видит в маршрутах;
- `widgets` — крупные, но переиспользуемые части интерфейса;
- `features` — функциональные возможности с понятным бизнес-смыслом;
- `entities` — бизнес-сущности (пользователь, продукт, заказ);
- `shared` — переиспользуемые утилиты и компоненты без бизнес-смысла.

Каждый слой обычно реализуется как папка верхнего уровня в `src`:

- `src/app`
- `src/pages`
- `src/widgets`
- `src/features`
- `src/entities`
- `src/shared`

Смотрите, это уже первый уровень структуры пути — слой. Следующие уровни добавляют детализацию.

### Слайсы (slices) и сегменты (segments)

Внутри слоя код делится на слайсы. Слайс — это логически цельный кусок функциональности или сущность.

Примеры слайсов:

- `entities/user`
- `entities/product`
- `features/auth`
- `features/cart`
- `widgets/header`
- `pages/profile`

Внутри каждого слайса есть сегменты. Часто используются такие сегменты:

- `ui` — компоненты интерфейса;
- `model` — состояние, бизнес-логика (actions, reducers, services);
- `lib` — вспомогательные функции;
- `api` — сетевые слои;
- `config` — конфигурация.

Таким образом, полный путь к файлу в FSD можно разложить на части:

1. слой
2. слайс
3. сегмент
4. конкретный файл или вложенный модуль

Обратите внимание, что именно такое разбиение помогает сделать путь осмысленным, а не просто "папка внутри папки".

### Типовая структура проекта

Вот пример простой, но уже осмысленной структуры:

src  
└─ entities  
&nbsp;&nbsp;└─ user  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ UserCard.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ UserAvatar.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;├─ model  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ types.ts  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ selectors.ts  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ slice.ts  
&nbsp;&nbsp;&nbsp;&nbsp;└─ api  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ userApi.ts  

└─ features  
&nbsp;&nbsp;└─ auth  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ LoginForm.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;└─ model  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ useLogin.ts  

└─ shared  
&nbsp;&nbsp;└─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;└─ Button  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ index.ts  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ Button.tsx  

Это основа, к которой будут привязаны все пути в импортируемых модулях.

## Путь к файлу в FSD как набор семантических уровней

### Почему важно думать о путях как о "fsd-path"

В классическом проекте вы часто видите пути вида:

- ../../components/Button
- ../../../utils/date
- ./__tests__/SomeComponent.test

Они почти ничего не говорят о роли модуля и его месте в архитектуре. В FSD-проекте, если вы настраиваете fsd-path грамотно, вы стараетесь, чтобы путь отражал:

- слой, в котором находится код;
- слайс (функциональную область);
- публичный или внутренний API модуля.

Например:

- `entities/user` — означает слой `entities`, слайс `user`, и, как правило, импорт через публичный API;
- `features/auth/model/useLogin` — вы сразу видите, что это фича `auth`, сегмент `model`, хук `useLogin`.

Это помогает и вам, и всей команде быстро понимать, что происходит, не открывая каждый файл.

### Структура fsd-path: пример формальной схемы

Давайте запишем общий шаблон пути в виде схемы (словами, без кода):

- base alias (опционально, например `@/`)
- layer (`app`, `pages`, `widgets`, `features`, `entities`, `shared`)
- slice (имя сущности или фичи, например `user`, `auth`)
- segment (`ui`, `model`, `lib`, `api`, `config`, и т.д.)
- file или вложенный модуль

Если вы используете alias (что в FSD почти всегда желательно), итоговый путь может выглядеть так:

- `@/entities/user`
- `@/entities/user/ui/UserCard`
- `@/features/auth/model/useLogin`
- `@/shared/ui/Button`

Здесь `@/` — это настройка сборщика (Webpack, Vite, etc.), о которой мы еще поговорим подробнее.

## Публичный API слайса и влияние на пути

### Зачем нужен публичный API

Одна из ключевых идей FSD — ограничивать внешнее использование слайса набором публичных модулей. Обычно это делается через `index.ts` в корне слайса.

Например, структура:

src  
└─ entities  
&nbsp;&nbsp;└─ user  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ UserCard.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;├─ model  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ selectors.ts  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ slice.ts  
&nbsp;&nbsp;&nbsp;&nbsp;└─ index.ts  

Содержимое `entities/user/index.ts`:

```ts
// Экспортируем только то, что можно использовать снаружи слайса

export { UserCard } from "./ui/UserCard"
// Публичный React-компонент карточки пользователя

export { selectCurrentUser } from "./model/selectors"
// Публичный селектор для получения текущего пользователя
```

Как видите, этот файл определяет публичный API слайса `user`. Это сильно влияет на то, как выглядит fsd-path в остальной части проекта.

### Путь для внешнего использования слайса

Снаружи (например, в `features` или `widgets`) вы стараетесь импортировать только из публичного API:

```ts
// Используем сущность User из виджета или страницы

import { UserCard, selectCurrentUser } from "@/entities/user"

// Здесь мы не лезем внутрь сегментов ui или model напрямую
// Это упрощает рефакторинг и контролирует архитектурные зависимости
```

Таким образом, стандартный fsd-path к сущности или фиче для внешнего кода обычно не длиннее:

- `@/entities/user`
- `@/features/auth`
- `@/widgets/header`

Внутреннее устройство (ui, model, api) скрывается за `index.ts`.

### Путь для внутреннего кода слайса

Внутри самого слайса вы можете импортировать модули "по-настоящему", без публичного API:

```ts
// Файл entities/user/ui/UserCard.tsx

import { selectCurrentUser } from "../model/selectors"
// Здесь мы можем импортировать прямо из model,
// потому что это внутренний код слайса user

// Также можем использовать относительные пути
// если не используем alias внутри слайса
```

Давайте разберемся, почему лучше разделять пути для внешнего и внутреннего использования.

- Внешний код — только через публичный API слайса:
  - путь короткий, стабильный;
  - вы можете реорганизовать внутреннюю структуру без массовых изменений импортов.

- Внутренний код — может использовать относительные пути или alias внутри слоя:
  - так проще реорганизовывать локальные файлы;
  - вы не боитесь "скрытых" зависимостей между слайсами.

## Настройка alias и fsd-path в сборщике

Чтобы пути были читаемыми и не превратились в лес `../../../`, вам нужны alias-импорты.

### Пример с Webpack

Для Webpack обычно используют настройку `resolve.alias`. Пример:

```js
// webpack.config.js

const path = require("path") // Подключаем модуль path для работы с файловой системой

module.exports = {
  // ...другая конфигурация
  resolve: {
    extensions: [".tsx", ".ts", ".js"], // Указываем расширения файлов для импорта без указания расширения
    alias: {
      "@": path.resolve(__dirname, "src"), 
      // Теперь "@/entities/user" будет ссылаться на "src/entities/user"
    },
  },
}
```

Теперь вы можете писать:

```ts
import { UserCard } from "@/entities/user"
// Вместо относительного "../../entities/user"
```

Такая настройка — одно из ключевых технических условий для удобного fsd-path.

### Пример с Vite

Для Vite вы делаете похожее в `vite.config.ts`:

```ts
// vite.config.ts

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Точно так же настраиваем базовый alias
    },
  },
})
```

После этого структура путей в проекте становится единообразной.

### Пример с TypeScript (paths)

Если вы пишете на TypeScript, важно также настроить `paths` в `tsconfig.json`, чтобы компилятор понимал alias.

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    // Указываем базовую директорию для относительных путей
    "paths": {
      "@/*": ["*"]
      // Говорим TypeScript что "@/entities/user" = "src/entities/user"
    }
  }
}
```

Обратите внимание, как TypeScript-схема `@/*` и `["*"]` соответствует тому, что мы задали в сборщике.

Если вы этого не сделаете, то сборщик (Webpack, Vite) сможет собрать проект, но IDE и TypeScript будут ругаться на импорты.

## Правила построения fsd-path между слоями

### Вертикальные зависимости: кто может импортировать кого

В FSD есть рекомендуемая матрица зависимостей между слоями. Вкратце:

- `app` может импортировать все остальные слои;
- `processes` могут импортировать `pages`, `widgets`, `features`, `entities`, `shared`;
- `pages` могут импортировать `widgets`, `features`, `entities`, `shared`;
- `widgets` могут импортировать `features`, `entities`, `shared`;
- `features` могут импортировать `entities`, `shared`;
- `entities` могут импортировать только `shared`;
- `shared` не импортирует бизнес-слои (`entities`, `features`, `widgets`, `pages`, `processes`, `app`).

Теперь вы понимаете, что fsd-path — это еще и способ контролировать эти зависимости. Когда вы видите импорт:

```ts
import { SomeWidget } from "@/widgets/some-widget"
```

Вы можете быстро проверить, в каком слое вы находитесь, и не нарушаете ли архитектуру.

### Примеры "правильных" путей

Посмотрим на несколько примеров корректных fsd-path.

1. Страница использует виджет и фичу:

```ts
// Файл src/pages/profile/ui/ProfilePage.tsx

import { ProfileHeader } from "@/widgets/profile-header"
// Виджет, который рендерит шапку профиля

import { UpdateProfileForm } from "@/features/update-profile"
// Фича для редактирования профиля пользователя
```

2. Фича использует сущность и shared:

```ts
// Файл src/features/update-profile/ui/UpdateProfileForm.tsx

import { UserCard } from "@/entities/user"
// Сущность User используется внутри фичи

import { Button } from "@/shared/ui/Button"
// Общий UI-компонент
```

3. Сущность использует только shared:

```ts
// Файл src/entities/user/model/userSlice.ts

import { createSlice } from "@reduxjs/toolkit"
// Внешняя библиотека

import { apiClient } from "@/shared/api/apiClient"
// Общий API-клиент из shared
```

### Примеры "плохих" путей

А теперь давайте разберем, что лучше не делать.

1. Сущность использует фичу:

```ts
// Файл src/entities/user/model/userSlice.ts

import { updateProfile } from "@/features/update-profile/model/updateProfile"
// Нарушение - слой entities не должен зависеть от features
```

2. Shared импортирует сущность:

```ts
// Файл src/shared/lib/formatUser.ts

import { User } from "@/entities/user"
// Нарушение - shared должен быть независим от сущностей и фич
```

Если у вас включен линтер архитектуры (есть готовые ESLint-плагины под FSD), то такие импорты будут находиться автоматически.

## Внутренние правила именования и структуры сегментов

### Соглашения по сегментам

Чтобы fsd-path оставался предсказуемым, вы обычно выбираете фиксированный набор сегментов. Например:

- `ui` — React-компоненты;
- `model` — состояние и бизнес-логика;
- `api` — запросы;
- `config` — конфигурация;
- `lib` — вспомогательные функции;
- `types` — типы, если их выносите отдельно.

Смотрите, как это выглядит на примере фичи `auth`:

src  
└─ features  
&nbsp;&nbsp;└─ auth  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ LoginForm.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ LogoutButton.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;├─ model  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;├─ useLogin.ts  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ authSlice.ts  
&nbsp;&nbsp;&nbsp;&nbsp;├─ api  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ authApi.ts  
&nbsp;&nbsp;&nbsp;&nbsp;└─ index.ts  

Пути к этим файлам:

- `@/features/auth/ui/LoginForm`
- `@/features/auth/model/useLogin`
- `@/features/auth/api/authApi`

### Правила именования файлов

Часто используют следующие подходы к именам файлов:

- Компоненты: PascalCase (`UserCard.tsx`, `LoginForm.tsx`);
- Хуки: camelCase с префиксом `use` (`useLogin.ts`);
- Слайсы состояния: camelCase с суффиксом `Slice` (`authSlice.ts`);
- Сервисы: camelCase с суффиксом `Service` или `Api` (`userService.ts`, `authApi.ts`).

Эти соглашения не являются строго обязательными, но они помогают читать пути и понимать, что за модуль вы импортируете.

Например, строка:

```ts
import { useLogin } from "@/features/auth/model/useLogin"
```

сразу говорит:

- это фича `auth`;
- сегмент `model`;
- модуль — React-хук.

## Паттерны использования fsd-path в коде

### Импорт компонентов страницы

Давайте разберем на примере страницы профиль пользователя.

Структура:

src  
└─ pages  
&nbsp;&nbsp;└─ profile  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ ProfilePage.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;└─ index.ts  

`pages/profile/index.ts`:

```ts
// Публичный API страницы Profile

export { ProfilePage } from "./ui/ProfilePage"
// Именно этот компонент будет использован в роутинге
```

Роутинг:

```ts
// src/app/providers/router/config.tsx

import { ProfilePage } from "@/pages/profile"
// Используем путь через публичный API страницы

// Здесь мы не лезем в "@/pages/profile/ui/ProfilePage"
// чтобы не привязываться к внутренней структуре
```

### Импорт виджетов в страницу

Пусть у нас есть виджет `profile-header` и фича `update-profile`.

```ts
// src/pages/profile/ui/ProfilePage.tsx

import { ProfileHeader } from "@/widgets/profile-header"
// Крупный виджет - шапка профиля

import { UpdateProfileForm } from "@/features/update-profile"
// Форма редактирования профиля

export const ProfilePage = () => {
  // Здесь мы комбинируем виджет и фичу

  return (
    <div>
      {/* Рендерим шапку профиля */}
      <ProfileHeader />

      {/* Рендерим форму обновления профиля */}
      <UpdateProfileForm />
    </div>
  )
}
```

Смотрите, путь к виджету и фиче короткий и стабильный. Вам достаточно знать имя слайса.

### Импорт сущностей в фичу

Теперь посмотрим, как вы можете использовать сущность `user` внутри фичи:

```ts
// src/features/update-profile/ui/UpdateProfileForm.tsx

import { useSelector } from "react-redux"
// Библиотека для доступа к состоянию

import { UserCard, selectCurrentUser } from "@/entities/user"
// Сущность user - компонент и селектор

import { Button } from "@/shared/ui/Button"
// Общая кнопка

export const UpdateProfileForm = () => {
  // Получаем текущего пользователя с помощью селектора
  const user = useSelector(selectCurrentUser)

  if (!user) {
    // Если пользователя нет - не рендерим форму
    return null
  }

  return (
    <form>
      {/* Показываем информацию о пользователе */}
      <UserCard user={user} />

      {/* Кнопка сохранения формы */}
      <Button type="submit">Сохранить</Button>
    </form>
  )
}
```

Как видите, путь `"@/entities/user"` спрятал под собой и UI, и model. Это делает код читабельным и независимым от внутренней структуры.

## Локальные и глобальные пути: когда что использовать

### Локальные (относительные) пути

Относительные пути удобно использовать:

- внутри одного слайса;
- для "мелких" связей между файлами в одном сегменте.

Пример:

```ts
// src/entities/user/model/selectors.ts

import { RootState } from "@/app/providers/store"
// Путь к типу корневого состояния через alias

import { UserSchema } from "./types"
// Локальный относительный путь внутри модельного сегмента

export const selectCurrentUser = (state: RootState): UserSchema | null =>
  state.user.current
// Здесь мы описываем селектор сущности user
```

Относительные пути хороши тем, что вы можете перемещать целиком слайс, не трогая его внутренние импорты (если переносите их вместе).

### Глобальные (через alias) пути

Alias лучше использовать:

- между слоями;
- между слайсами;
- для доступа к shared-модулям.

Примеры:

```ts
import { UserCard } from "@/entities/user"

import { Button } from "@/shared/ui/Button"

import { ProfileHeader } from "@/widgets/profile-header"
```

Главное правило: alias-импорт должен отражать архитектурный путь (слой → слайс → сегмент/публичный API).

## Контроль архитектуры через ESLint и плагины

### Зачем проверять fsd-path автоматически

Даже если вы внимательно следите за путями, в большом проекте легко допустить ошибку:

- случайно импортировать `entities` из `shared`;
- обратиться к внутреннему модулю другого слайса (`../model/useLogin` вместо `@/features/auth`);
- перепутать слой в пути.

Чтобы это отслеживать, часто используют ESLint-плагины или кастомные правила, которые проверяют:

- соответствие импортов допустимым слоям;
- запрет на выход за публичный API;
- запрещенные пересечения слоев.

### Пример идеи правила для публичного API

Логика может быть такой:

- если импорт идет из `entities`, `features`, `widgets`, `pages`;
- то он должен заканчиваться на имя слайса (`@/entities/user`);
- и не должен содержать сегмент (`/ui/`, `/model/`, `/api/`) снаружи.

Тогда импорт:

```ts
import { UserCard } from "@/entities/user/ui/UserCard"
// Плохой импорт - обход публичного API
```

будет считаться ошибкой, а:

```ts
import { UserCard } from "@/entities/user"
// Правильный импорт через публичный API
```

считается корректным.

Такие правила сильно дисциплинируют работу с fsd-path и помогают сохранить архитектуру проекта.

## Расширенные сценарии: процессы и сложные фичи

### Слой processes и пути

Если вы используете слой `processes`, он обычно отвечает за объединение нескольких фич в один сквозной сценарий.

Пример структуры:

src  
└─ processes  
&nbsp;&nbsp;└─ checkout  
&nbsp;&nbsp;&nbsp;&nbsp;├─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ CheckoutProcess.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;├─ model  
&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ useCheckout.ts  
&nbsp;&nbsp;&nbsp;&nbsp;└─ index.ts  

Пути внутри процесса могут выглядеть так:

```ts
// src/processes/checkout/ui/CheckoutProcess.tsx

import { CartWidget } from "@/widgets/cart"
// Виджет корзины

import { PaymentForm } from "@/features/payment"
// Форма оплаты

import { AddressForm } from "@/features/address"
// Форма ввода адреса

// Здесь мы соединяем несколько фич в один процесс покупки
```

Как видите, fsd-path помогает вам визуально увидеть, что происходит: слой `processes` координирует несколько `features` и `widgets`.

### Множественные уровни вложенности

Иногда в слайсе вам нужно сделать дополнительную вложенность, например, для разных вариантов UI.

Пример:

src  
└─ features  
&nbsp;&nbsp;└─ auth  
&nbsp;&nbsp;&nbsp;&nbsp;└─ ui  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ desktop  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;└─ LoginFormDesktop.tsx  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ mobile  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ LoginFormMobile.tsx  

Пути:

- `@/features/auth/ui/desktop/LoginFormDesktop`
- `@/features/auth/ui/mobile/LoginFormMobile`

Здесь важно сохранить первую тройку слоев в пути (layer/slice/segment), а дальше вы уже можете варьировать структуру под задачу.

## Практический чек-лист по fsd-path

### Что проверить при настройке проекта

1. В `src` есть слои: `app`, `pages`, `widgets`, `features`, `entities`, `shared` (и, при необходимости, `processes`).
2. В `webpack.config.js` или `vite.config.ts` настроен alias `"@" → "src"`.
3. В `tsconfig.json` (если используется TypeScript) настроены `"baseUrl": "src"` и `"paths": { "@/*": ["*"] }`.
4. В каждом слайсе, который используется снаружи, есть `index.ts` — публичный API.
5. Вы договорились о наборе сегментов (`ui`, `model`, `api`, `lib`, `config`, и т.п.).
6. ESLint (или другой инструмент) проверяет архитектурные ограничения импортов.

### Как читать и писать fsd-path в коде

Когда вы видите путь:

- `@/features/auth/model/useLogin` — фича `auth`, модельный сегмент, хук `useLogin`;
- `@/entities/user` — сущность `user`, импорт через публичный API;
- `@/widgets/profile-header` — виджет `profile-header`, публичный API;
- `@/shared/ui/Button` — общий UI-компонент `Button` из shared.

Когда вы пишете путь, ориентируйтесь на:

1. Где я нахожусь (слой, файл)?
2. К какому слою я хочу обратиться?
3. Это внешний импорт (нужен публичный API) или внутренний (можно относительный путь)?

Если вы следуете этим правилам, структура проекта остается понятной и масштабируемой.

---

В итоге, путь к файлу в FSD — это не просто строка для импорта, а отражение архитектурного решения: слой, слайс, сегмент, публичный или внутренний API, допустимость зависимости. Когда вы мыслите путями как "fsd-path", вы начинаете использовать их как инструмент навигации и контроля, а не просто как техническую деталь.

## Частозадаваемые технические вопросы по теме и ответы

### Как организовать fsd-path для тестов и storybook файлов

Обычно тесты и stories размещают рядом с исходным кодом:

- `UserCard.tsx`
- `UserCard.test.tsx`
- `UserCard.stories.tsx`

При этом путь слоя и слайса сохраняется: `@/entities/user/ui/UserCard`. Тесты и stories не выделяют в отдельный сегмент, чтобы не ломать основную структуру fsd-path.

### Как сделать несколько публичных точек входа в одном слайсе

Если в одном слайсе нужно несколько независимых API, используйте подпапки с собственными index-файлами:

- `entities/user/index.ts`
- `entities/user/profile/index.ts`
- `entities/user/settings/index.ts`

Тогда пути будут: `@/entities/user`, `@/entities/user/profile`, `@/entities/user/settings`. Важно не плодить их без необходимости, чтобы не усложнять навигацию.

### Как подключить alias fsd-path в Jest или Vitest

В Jest используйте `moduleNameMapper`:

```js
// jest.config.js
moduleNameMapper: {
  "^@(.*)$": "<rootDir>/src$1",
}
```

В Vitest (через Vite-конфиг) уже достаточно alias в `vite.config.ts`, Vitest его подхватит. Важно, чтобы конфиги тестового раннера и сборщика были согласованы.

### Как быть с абсолютными путями без alias например from /src/... 

Технически это работает, но нарушает переносимость. Лучше всегда использовать согласованный alias вида "@/". Тогда при переносе проекта, изменении структуры или добавлении монорепозитория вы меняете только одну настройку alias.

### Можно ли смешивать несколько архитектур в одном проекте и как тогда задавать fsd-path

Если часть проекта еще не переведена на FSD, можно выделить отдельную папку, например `legacy`, и настроить для нее отдельный путь: `@/legacy/...`. Новые модули кладите сразу в FSD-структуру, а для старых постепенно выносите участки в слои `entities`, `features` и т.д. При этом alias `"@"` остается общим, а архитектурные правила ESLint можно сначала включать только для FSD-папок.