---
metaTitle: Принципы FSD в фронтенд разработке
metaDescription: Разберем принципы FSD в фронтенд разработке - как организовать архитектуру по фичам слоям и сегментам чтобы код был масштабируемым и поддерживаемым
author: Олег Марков
title: Принципы FSD - как проектировать архитектуру фронтенда по фичам и слоям
preview: Исследуем принципы FSD - как они помогают строить понятную модульную и устойчивую архитектуру фронтенда с примерами структуры кода и практическими рекомендациями
---

## Введение

Feature-Sliced Design (FSD) — это подход к архитектуре фронтенда, который предлагает организовывать проект по фичам и слоям, а не по типам файлов. Вместо папок `components`, `pages`, `utils` и растущего хаоса вы получаете понятную структуру, где каждая часть приложения знает, что ей можно, а что нельзя.

Вам не нужно помнить десятки правил наизусть. Важно понимать несколько базовых принципов FSD и научиться применять их последовательно. В этой статье я разберу именно принципы: на чем держится FSD, почему он работает и как его внедрять без боли в реальном проекте.

Смотрите, я покажу вам:

- какие уровни (слои) есть в FSD и зачем они нужны;
- как устроена модульность по фичам;
- какие ограничения между слоями помогают не превратить проект в «спагетти»;
- как использовать сегменты (entities, features, widgets и др.);
- как описывать и применять публичные API модулей;
- как постепенно переходить к FSD в существующем коде.

По ходу статьи я буду приводить примеры структуры проекта и фрагменты кода, чтобы вам было легче связать теорию с реальной практикой.

## Основные принципы FSD

### Принцип 1. Архитектура вокруг фич, а не вокруг типов файлов

Классический способ организации фронтенд-проекта — по типам:

- `components/`
- `pages/`
- `services/`
- `hooks/`
- `utils/`

Через несколько месяцев такая структура начинает плохо масштабироваться. Компоненты, относящиеся к одной бизнес-задаче, оказываются разбросаны по разным папкам. Появляются «общие» компоненты, которые на самом деле давно завязаны на конкретные фичи.

FSD предлагает другой подход: группировать код вокруг фич (функциональности), а не вокруг типов.

#### Как выглядит структура по фичам

Давайте посмотрим на упрощенный пример структуры на основе FSD:

```bash
src/
  app/               # Корневые настройки приложения
  processes/         # Долгоживущие бизнес-процессы
  pages/             # Страницы (композиция виджетов и фич)
  widgets/           # Крупные UI-блоки из фич и сущностей
  features/          # Фичи (функции, которые есть у пользователя)
    auth-by-email/
      model/
      ui/
      lib/
    change-profile/
      model/
      ui/
  entities/          # Сущности домена (пользователь, статья и т.д.)
    user/
      model/
      ui/
  shared/            # Переиспользуемые примитивы
    ui/
    lib/
    api/
    config/
```

Смотрите, здесь ключевое — папки `features`, `entities`, `widgets`, `pages`. Каждая фича (например, `auth-by-email`) содержит все, что ей нужно:

- `ui` — компоненты интерфейса;
- `model` — состояние и бизнес-логика;
- `lib` — вспомогательные функции.

Вы больше не ищете «где лежит логика авторизации» по трем-четырем папкам. Вы просто идете в `features/auth-by-email`.

Это и есть первый базовый принцип FSD:

> Код группируется по бизнес-функциональности, а не по техническому типу.

### Принцип 2. Деление на слои и ограничения между ними

FSD вводит несколько слоев (layers), каждый из которых имеет свою зону ответственности и свои зависимости. Это помогает ограничить «проникновение» деталей низкого уровня вверх по приложению и наоборот.

Классический набор слоев:

- `app` — инициализация приложения;
- `processes` — кросс-страничные бизнес-процессы (опционально);
- `pages` — страницы и маршруты;
- `widgets` — крупные UI-блоки;
- `features` — пользовательские фичи;
- `entities` — бизнес-сущности;
- `shared` — переиспользуемые примитивы и утилиты.

#### Направление зависимостей

Направление зависимостей строго сверху вниз. Давайте разберем:

- `app` может зависеть от всех нижележащих слоев;
- `pages` может зависеть от `widgets`, `features`, `entities`, `shared`;
- `widgets` — от `features`, `entities`, `shared`;
- `features` — от `entities`, `shared`;
- `entities` — только от `shared`;
- `shared` — ни от кого из домена, только от внешних библиотек.

То есть запрещено, например:

- чтобы `entities` зависел от `features`;
- чтобы `shared` импортировал что-то из `entities` или `widgets`.

Это одно из ключевых ограничений FSD, которое сохраняет архитектуру чистой.

Давайте представим пример неправильной зависимости:

```ts
// ПЛОХО - сущность user тянет фичу авторизации

// entities/user/model/auth.ts
import { loginByEmail } from "@/features/auth-by-email"; // так делать нельзя

export const ensureUserAuthorized = async () => {
  // ...
  await loginByEmail(); 
};
```

Такой импорт приводит к тому, что базовая сущность `user` становится зависимой от конкретной фичи авторизации. Если вы захотите убрать эту фичу или заменить ее, придётся править базовый слой сущностей.

Как правильно:

```ts
// features/auth-by-email/model/effects.ts
// Здесь мы импортируем сущность user из entities
import { userModel } from "@/entities/user";

// Здесь мы реализуем авторизацию по email и уже работаем с userModel
export const loginByEmail = async (email: string, password: string) => {
  // ...
  // Здесь мы обновляем состояние пользователя
  userModel.setAuthData({ email });
};
```

Сущности остаются «ниже» и не знают о фичах. Фичи используют сущности, а страницы собирают фичи и виджеты.

### Принцип 3. Сегменты (entities, features, widgets, pages, processes)

Чтобы архитектура была не только по слоям, но и по смыслу, FSD вводит понятие сегментов. Это логические зоны приложения по отношению к пользователю и домену.

#### Entities — сущности домена

`entities` описывают предметную область: пользователь, статья, заказ, продукт и т.д. Они не знают ни о страницах, ни о маршрутизации, ни о конкретных сценариях.

Структура:

```bash
entities/
  user/
    model/
      types.ts
      selectors.ts
      slice.ts
    ui/
      UserAvatar.tsx
      UserName.tsx
    lib/
      formatUserName.ts
```

Здесь я размещаю все, что относится к сущности `user`:

- `model` — состояние и бизнес-логика сущности;
- `ui` — минимальные UI-компоненты, которые показывают данные пользователя;
- `lib` — вспомогательные функции, работающие с user.

#### Features — возможности пользователя

`features` описывают то, что пользователь может делать: авторизоваться, менять профиль, лайкать статью, добавлять товар в корзину.

Структура:

```bash
features/
  auth-by-email/
    model/
      effects.ts
      slice.ts
    ui/
      LoginForm.tsx
    lib/
      validators.ts
```

Фича может использовать одну или несколько сущностей. Например, авторизация может работать с `entities/user`.

Фичи — это «действия», которые пользователь совершает в интерфейсе. Когда вы формулируете фичу, описывайте ее глаголами: `add-to-cart`, `change-profile`, `rate-article`.

#### Widgets — крупные UI-блоки

`widgets` — это составные блоки интерфейса, которые могут содержать в себе несколько фич и сущностей. Например:

- `ArticleComments` — блок комментариев под статьей;
- `UserProfileHeader` — шапка страницы профиля;
- `CartPreview` — виджет мини-корзины.

Структура:

```bash
widgets/
  article-comments/
    ui/
      ArticleComments.tsx
    model/
      index.ts
    lib/
      mapCommentToView.ts
```

Давайте посмотрим пример кода для виджета:

```tsx
// widgets/article-comments/ui/ArticleComments.tsx

// Здесь мы подключаем сущность комментариев и фичу добавления комментария
import { CommentList } from "@/entities/comment/ui/CommentList";
import { AddCommentForm } from "@/features/add-comment/ui/AddCommentForm";

interface ArticleCommentsProps {
  articleId: string;
}

export const ArticleComments = (props: ArticleCommentsProps) => {
  const { articleId } = props;

  // Здесь может быть логика получения комментариев по articleId
  // Либо она инкапсулирована в CommentList

  return (
    <section>
      {/* Список комментариев к статье */}
      <CommentList articleId={articleId} />

      {/* Форма добавления комментария */}
      <AddCommentForm articleId={articleId} />
    </section>
  );
};
```

Обратите внимание, как этот фрагмент кода решает задачу: виджет собирает из сущностей и фич готовый блок интерфейса, который можно использовать на разных страницах.

#### Pages — страницы приложения

`pages` — это уроверь маршрутизации и конечная композиция. Страница собирает виджеты и фичи в конечный интерфейс.

Пример:

```bash
pages/
  article-details/
    ui/
      ArticleDetailsPage.tsx
    model/
      index.ts
```

```tsx
// pages/article-details/ui/ArticleDetailsPage.tsx

// Здесь мы импортируем виджеты и фичи, а не «глубокие» детали
import { ArticleContent } from "@/widgets/article-content";
import { ArticleComments } from "@/widgets/article-comments";

interface ArticleDetailsPageProps {
  id: string;
}

export const ArticleDetailsPage = (props: ArticleDetailsPageProps) => {
  const { id } = props;

  return (
    <div>
      {/* Виджет с содержимым статьи */}
      <ArticleContent articleId={id} />

      {/* Виджет с комментариями */}
      <ArticleComments articleId={id} />
    </div>
  );
};
```

Страницы не должны содержать сложную бизнес-логику. Их задача — сочетать уже готовые элементы.

#### Processes — бизнес-процессы

`processes` используются реже, но бывают полезны для долгоживущих сценариев, которые затрагивают несколько страниц или жизненные циклы (например, онбординг, checkout с несколькими шагами).

Если у вас нет таких сложных сценариев, вы можете начать без `processes` и добавить слой позже.

### Принцип 4. Публичный API модулей

Каждый модуль (фича, сущность, виджет) должен иметь четко определенный публичный API — то, что можно импортировать снаружи. Это помогает избежать «протекания» деталей реализации.

Смотрите, как это выглядит на практике.

#### Пример: публичный API фичи

Структура:

```bash
features/
  auth-by-email/
    model/
      effects.ts
      slice.ts
      selectors.ts
    ui/
      LoginForm.tsx
    index.ts        # публичный API фичи
```

В `index.ts` вы явно перечисляете, что доступно из фичи:

```ts
// features/auth-by-email/index.ts

// Здесь мы экспортируем только то, что хотим показать наружу

export { LoginForm } from "./ui/LoginForm";
export type { LoginFormValues } from "./model/types";
export { loginByEmail } from "./model/effects";
```

Теперь снаружи фичу используют так:

```ts
// pages/login/ui/LoginPage.tsx

import { LoginForm } from "@/features/auth-by-email";

export const LoginPage = () => {
  return (
    <main>
      {/* Публичный компонент фичи авторизации */}
      <LoginForm />
    </main>
  );
};
```

Обратите внимание: импорт идет из корня `features/auth-by-email`, а не из `ui/LoginForm`. Это важно, потому что:

- вы можете поменять внутреннюю структуру фичи;
- страница не должна знать, как именно фича устроена внутри;
- видно, какие элементы фичи являются частью ее контракта.

#### Пример: публичный API сущности

```bash
entities/
  user/
    model/
      slice.ts
      selectors.ts
      types.ts
    ui/
      UserAvatar.tsx
      UserName.tsx
    index.ts
```

```ts
// entities/user/index.ts

// Здесь мы экспортируем доступные компоненты и модель

export { UserAvatar } from "./ui/UserAvatar";
export { UserName } from "./ui/UserName";

export { userReducer, userActions } from "./model/slice";
export * as userSelectors from "./model/selectors";
export type { User, UserId } from "./model/types";
```

Теперь вы можете использовать сущность в любом модуле, который имеет право зависеть от `entities`:

```ts
// widgets/user-profile-header/ui/UserProfileHeader.tsx

import { UserAvatar, UserName } from "@/entities/user";

export const UserProfileHeader = () => {
  return (
    <header>
      <UserAvatar size="large" />
      <UserName />
    </header>
  );
};
```

Здесь важно, что `UserProfileHeader` не лезет внутрь `entities/user/model`. Он работает только с тем, что явно экспортировано.

### Принцип 5. Локальность и независимость модулей

Каждая фича или сущность стремится быть максимально локальной и независимой. Это означает:

- минимум внешних зависимостей;
- отсутствие «магических» глобальных импортов;
- явное указание на то, какие данные и функции нужны модулю.

#### Локальность состояния и логики

Смотрите, я покажу вам простой пример. Допустим, у нас есть фича «лайкнуть статью»:

```bash
features/
  toggle-article-like/
    model/
      effects.ts
      api.ts
      selectors.ts
    ui/
      LikeButton.tsx
    index.ts
```

```ts
// features/toggle-article-like/model/api.ts

// Здесь мы описываем работу с API для лайков
export const likeArticle = (articleId: string) => {
  // Тут мог бы быть вызов fetch или axios
  // return api.post(`/articles/${articleId}/like`);
};

export const unlikeArticle = (articleId: string) => {
  // Аналогично здесь снимаем лайк
  // return api.delete(`/articles/${articleId}/like`);
};
```

```ts
// features/toggle-article-like/model/effects.ts

import { likeArticle, unlikeArticle } from "./api";

// Здесь мы определяем эффект переключения лайка
export const toggleLike = async (articleId: string, isLiked: boolean) => {
  if (isLiked) {
    await unlikeArticle(articleId);
  } else {
    await likeArticle(articleId);
  }
};
```

```tsx
// features/toggle-article-like/ui/LikeButton.tsx

// Здесь мы объявляем публичный компонент для кнопки лайка
import React from "react";
import { toggleLike } from "../model/effects";

interface LikeButtonProps {
  articleId: string;
  isLiked: boolean;
}

// Компонент ничего не знает о глобальном состоянии приложения
export const LikeButton = (props: LikeButtonProps) => {
  const { articleId, isLiked } = props;

  const handleClick = async () => {
    // Вызываем локальный эффект фичи
    await toggleLike(articleId, isLiked);
  };

  return (
    <button onClick={handleClick}>
      {isLiked ? "Убрать лайк" : "Поставить лайк"}
    </button>
  );
};
```

Здесь вы видите, как это выглядит в коде: фича сама инкапсулирует свой API, эффекты и UI. В идеале вы можете взять эту фичу и перенести в другой проект, если доменная логика совпадает.

Локальность помогает:

- проще рефакторить отдельные фичи;
- тестировать их отдельно;
- повторно использовать в других местах.

### Принцип 6. Явные границы и запреты

FSD не ограничивается только «рекомендуемыми» зависимостями. Он подразумевает явные запреты:

- нельзя импортировать из «более высокого» слоя;
- нельзя делать «сквозные» импорты, обходящие публичный API;
- нельзя из `shared` тянуть код из бизнес-сегментов.

Чтобы эти правила не оставались только на бумаге, обычно подключают линтеры (ESLint) и кастомные правила импортов. Чуть ниже я покажу типовой подход.

#### Пример: запрещенные импорты

Плохой случай:

```ts
// shared/ui/Button.tsx

// ПЛОХО - shared не должен знать о сущности user
import { User } from "@/entities/user";

interface ButtonProps {
  label: string;
  owner?: User;
}
```

Так делать нельзя, потому что `shared` лежит в основании пирамиды и должен быть свободен от доменных зависимостей. Сегмент `shared` — это низкоуровневые блоки: кнопки, поля ввода, хелперы, API-клиент.

Правильный подход: выносить зависимость от `User` наверх, например, в фичу или виджет.

### Принцип 7. Внешние зависимости «прячутся» внизу

FSD рекомендует инкапсулировать использование внешних библиотек в нижних слоях, чтобы они не «расползались» по всему проекту.

Примеры внешних зависимостей:

- UI-библиотеки (`MUI`, `Ant Design`);
- клиент для запросов (`axios`, `fetch` с оберткой);
- роутеры (`react-router`);
- стейт-менеджеры (`Redux`, `Zustand`, `MobX`);
- библиотеки валидации (`yup`, `zod`).

Идея в том, чтобы:

- вы могли заменить библиотеку в одном месте;
- верхние уровни работали с абстракциями, а не с конкретной реализацией.

#### Пример: обертка над API-клиентом

```bash
shared/
  api/
    base.ts
    httpClient.ts
```

```ts
// shared/api/httpClient.ts

// Здесь мы создаем и настраиваем HTTP-клиент
// Допустим, это обертка над fetch или axios

export const httpClient = {
  get: async <T>(url: string): Promise<T> => {
    // Здесь вы можете настроить общий обработчик ошибок
    const response = await fetch(url);
    return response.json() as Promise<T>;
  },

  post: async <T>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return response.json() as Promise<T>;
  },
};
```

Теперь фича или сущность используют не `axios` напрямую, а ваш `httpClient`:

```ts
// features/auth-by-email/model/api.ts

// Здесь мы используем обертку httpClient вместо прямого axios
import { httpClient } from "@/shared/api/httpClient";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

// Функция для авторизации по email и паролю
export const loginByEmailRequest = (data: LoginRequest) => {
  return httpClient.post<LoginResponse>("/login", data);
};
```

Если вы захотите заменить `fetch` на `axios`, вы поменяете только `shared/api/httpClient.ts`.

### Принцип 8. Инкрементальное внедрение FSD

FSD почти никогда не внедряют «за один раз» во взрослом проекте. Чаще всего вы:

- начинаете с выделения нескольких фич;
- постепенно переносите сущности;
- переименовываете и перекладываете папки по мере рефакторинга.

Здесь важно не пытаться переписать все сразу, а двигаться шаг за шагом.

#### Стратегия: с чего начать реальный проект

Давайте разберемся на практическом сценарии.

1. **Создайте базовую структуру слоев** в `src`:

   - `app`, `pages`, `widgets`, `features`, `entities`, `shared`.

2. **Выделите пару ключевых сущностей** (user, article, product) и перенесите код, относящийся к ним, в `entities`.

3. **Определите несколько фич**:

   - `auth-by-email`, `add-to-cart`, `change-profile` и т.п.

4. **Постепенно переподключайте импорты** через публичный API:

   - вместо `../../components/LoginForm` — `@/features/auth-by-email`.

5. **Включите правила линтера** для импортов (например, с помощью `eslint-plugin-boundaries` или `eslint-plugin-import`), чтобы новые нарушения не появлялись.

#### Пример простого правила для путей (идейно)

Схематичный пример (идея важнее точной конфигурации):

```js
// .eslintrc.js (идея, не полный конфиг)
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/shared",
            importNames: ["SomethingFromUpperLayer"],
            message: "shared не может зависеть от верхних слоев",
          },
        ],
        patterns: [
          // Например, запрет прямых импортов из «глубоких» путей чужих модулей
          {
            group: ["@/features/*/model/*", "@/features/*/ui/*"],
            message: "Используйте публичный API фичи через '@/features/feature-name'",
          },
        ],
      },
    ],
  },
};
```

В реальном проекте вы можете использовать специальные плагины под FSD, которые уже знают о сегментах `entities`, `features`, `widgets` и т.д.

### Принцип 9. Единый подход к именованию и структуре внутри модуля

FSD не жестко диктует внутреннюю структуру фичи или сущности, но рекомендует придерживаться единообразия. Это очень помогает, когда команда растет.

Часто используют следующую структуру:

- `ui` — компоненты;
- `model` — состояние, бизнес-логика, эффекты;
- `lib` — хелперы;
- `config` — локальная конфигурация;
- `api` — запросы к бэкенду (если не вынесены в `model`).

#### Пример структуры фичи с пояснениями

```bash
features/
  change-profile/
    ui/
      ChangeProfileForm.tsx    # Компонент формы
    model/
      slice.ts                 # Состояние фичи (если используется Redux или аналог)
      effects.ts               # Асинхронные операции (запросы к API, сайд-эффекты)
      selectors.ts             # Селекторы, чтобы получать данные из state
      validators.ts            # Функции валидации формы
    lib/
      mapProfileToForm.ts      # Преобразование доменной модели в форму
    index.ts                   # Публичный API
```

Такой шаблон помогает вам и коллегам быстро понимать, где искать:

- состояние;
- эффекты;
- UI;
- вспомогательные функции.

Покажу вам, как это реализовано на практике внутри фичи:

```ts
// features/change-profile/model/validators.ts

// Здесь мы объявляем простую валидацию профиля
export const validateProfile = (data: { name: string; age: number }) => {
  const errors: Record<string, string> = {};

  if (!data.name) {
    errors.name = "Имя обязательно";
  }

  if (data.age < 0) {
    errors.age = "Возраст не может быть отрицательным";
  }

  return errors;
};
```

```tsx
// features/change-profile/ui/ChangeProfileForm.tsx

// Здесь мы используем локальный валидатор и API фичи
import React, { useState } from "react";
import { validateProfile } from "../model/validators";

interface ChangeProfileFormProps {
  initialName: string;
  initialAge: number;
  onSubmit: (data: { name: string; age: number }) => void;
}

export const ChangeProfileForm = (props: ChangeProfileFormProps) => {
  const { initialName, initialAge, onSubmit } = props;

  const [name, setName] = useState(initialName);
  const [age, setAge] = useState(initialAge);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Сначала валидируем данные
    const validationErrors = validateProfile({ name, age });

    if (Object.keys(validationErrors).length > 0) {
      // Сохраняем ошибки, если они есть
      setErrors(validationErrors);
      return;
    }

    // Вызываем переданный колбек, если все ок
    onSubmit({ name, age });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <label>
          Имя
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {/* Если есть ошибка по имени, показываем ее */}
        {errors.name && <span>{errors.name}</span>}
      </div>

      <div>
        <label>
          Возраст
          <input
            type="number"
            value={age}
            onChange={(event) => setAge(Number(event.target.value))}
          />
        </label>
        {/* Если есть ошибка по возрасту, показываем ее */}
        {errors.age && <span>{errors.age}</span>}
      </div>

      <button type="submit">Сохранить</button>
    </form>
  );
};
```

Эта фича уже сама по себе вполне самостоятельна. Страница или виджет могут использовать ее через публичный API.

### Принцип 10. Разделение UI-композиции и бизнес-логики

Еще одна важная идея FSD — разделять:

- компоненты, которые просто отображают данные и испускают события;
- компоненты/модули, которые знают о бизнес-логике, запросах, сторе.

Внутри фичи часто выделяют «умные» и «глупые» компоненты (хотя терминология может быть другой):

- в `ui` могут быть простые компоненты, которые получают пропсы;
- в `model` — логика работы с данными, эффекты, интеграция со стором.

Давайте разберемся на примере лайка статьи, где `LikeButton` — простая «глупая» кнопка.

```tsx
// features/toggle-article-like/ui/LikeButton.tsx

interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
}

export const LikeButton = (props: LikeButtonProps) => {
  const { isLiked, onToggle } = props;

  return (
    <button onClick={onToggle}>
      {isLiked ? "Убрать лайк" : "Поставить лайк"}
    </button>
  );
};
```

```tsx
// features/toggle-article-like/ui/LikeButtonContainer.tsx

// Здесь мы добавляем бизнес-логику к простой кнопке
import React from "react";
import { LikeButton } from "./LikeButton";
import { toggleLike } from "../model/effects";

interface LikeButtonContainerProps {
  articleId: string;
  isLiked: boolean;
}

export const LikeButtonContainer = (props: LikeButtonContainerProps) => {
  const { articleId, isLiked } = props;

  const handleToggle = async () => {
    // Здесь мы вызываем бизнес-логику из model
    await toggleLike(articleId, isLiked);
  };

  return <LikeButton isLiked={isLiked} onToggle={handleToggle} />;
};
```

Теперь вы увидите, как это выглядит: простой `LikeButton` можно без проблем использовать в других контекстах, а всю бизнес-логику держать в контейнере.

## Заключение

Основная идея Feature-Sliced Design — построить архитектуру фронтенда вокруг фич и сущностей домена, а не вокруг технических типов файлов. Вы делите проект на слои (`app`, `pages`, `widgets`, `features`, `entities`, `shared`), задаете понятные ограничения между ними и описываете публичный API для каждого модуля.

Ключевые принципы FSD, которые стоит держать в голове:

- группировка кода по фичам и сущностям;
- иерархия слоев и направление зависимостей только сверху вниз;
- использование сегментов (`entities`, `features`, `widgets`, `pages`, `processes`);
- четкий публичный API модулей;
- локальность логики и состояния;
- инкапсуляция внешних библиотек на нижних уровнях;
- единый подход к структуре модулей и именованию;
- постепенное, инкрементальное внедрение.

Если вы будете придерживаться этих принципов и усиливать их линтером и код-ревью, проект станет гораздо лучше масштабироваться, а новые разработчики будут быстрее ориентироваться в кодовой базе.

## Частозадаваемые технические вопросы по FSD

### Как организовать тесты в структуре FSD

Обычно тесты располагают рядом с тестируемыми файлами, внутри того же модуля. Например:

- `features/auth-by-email/model/effects.test.ts`;
- `entities/user/model/selectors.test.ts`.

Главная идея — тесты живут на том же уровне, что и код, который они проверяют. Это сохраняет локальность и облегчает навигацию. Если у вас общая папка `tests`, имеет смысл постепенно переносить тесты ближе к модулям.

### Как быть с типами TypeScript которые используются в разных модулях

Базовые доменные типы (например, `User`, `Article`) хранятся в соответствующих сущностях: `entities/user/model/types.ts`. Если тип действительно общий и не относится к конкретной сущности, его можно вынести в `shared/kernel` или `shared/types`. Важно не складывать все подряд в одну «свалку типов», а сохранять привязку к домену.

### Как подключать роутер в FSD структуре

Роутер обычно живет в слое `app` или `pages`:

- в `app/providers/router` — конфигурация роутинга;
- в `pages` — компоненты страниц, которые используются в конфиге роутера.

Страницы не должны напрямую зависеть от конкретной библиотеки роутинга. В сложных проектах можно создать абстракцию роутера в `shared/router` и уже через нее работать с конкретной библиотекой.

### Как организовать глобальное состояние в FSD

Если вы используете Redux или другой стор, обычно:

- храните конфигурацию стора в `app/store` или `app/providers/store`;
- разрезаете стор по модулям — каждый модуль экспортирует свой reducer и actions через публичный API (`entities/user`, `features/auth-by-email`);
- подключаете редьюсеры к корневому стору на уровне `app`.

Фичи и сущности объявляют свои слайсы и селекторы внутри `model`, а верхние уровни только подключают их к стору.

### Можно ли использовать FSD только частично например без слоя processes

Да, FSD допускает частичное использование. Вы можете начать только с сегментов `entities`, `features`, `widgets`, `pages` и слоя `app`. Слой `processes` добавляется позже, если появляются сложные кросс-страничные сценарии. Важно сохранять основные идеи: сегменты, слои, направление зависимостей и публичные API модулей.