---
metaTitle: Сравнение методологии vs-atomic и Atomic Design
metaDescription: Подробное сравнение методологии vs-atomic и Atomic Design - разбор уровней абстракции структуры директорий и подходов к проектированию интерфейсов
author: Олег Марков
title: Сравнение с Atomic Design - vs-atomic
preview: Разберитесь в том как vs-atomic соотносится с Atomic Design - чем они отличаются где пересекаются и как выбрать подход для вашего проекта
---

## Введение

Методология Atomic Design долгое время остается одной из самых популярных схем организации интерфейсных компонентов. Многие UI‑библиотеки и дизайн‑системы так или иначе опираются на атомы, молекулы, организмы и шаблоны.

Но по мере усложнения фронтенд‑проектов одних только визуальных уровней компонентов становится недостаточно. Появляются вопросы: как разделять «чистую» UI‑часть и бизнес‑логику, где хранить композиции контейнеров, как выглядят границы модулей приложения. На этом месте появляется vs-atomic — подход, который использует идеи Atomic Design, но переносит акцент с чисто визуальной иерархии на архитектуру приложения.

В этой статье вы увидите, как vs-atomic соотносится с классическим Atomic Design, где они схожи, в чем различаются и как комбинировать оба подхода в реальном проекте. Я покажу вам пример структуры директорий, разберу несколько типовых сценариев и дам практические рекомендации по миграции и внедрению.

## Что такое Atomic Design в практике фронтенда

### Краткое напоминание уровней Atomic Design

Чтобы сравнивать подходы, нужно четко понимать, как обычно трактуют Atomic Design в разработке.

Чаще всего Atomic Design в коде выражается так:

- **Atoms (атомы)**  
  Базовые неделимые элементы интерфейса:
  - кнопки
  - поля ввода
  - иконки
  - типовые текстовые компоненты

- **Molecules (молекулы)**  
  Небольшие композиции атомов:
  - инпут + лейбл + сообщение об ошибке
  - кнопка с иконкой
  - аватар с подписью

- **Organisms (организмы)**  
  Более сложные части интерфейса:
  - шапка сайта с логотипом, меню и поиском
  - карточка товара с изображением, ценой и кнопкой
  - сайдбар с навигацией

- **Templates (шаблоны)**  
  Макеты страниц с расположением блоков (но без конкретных данных):
  - каркас страницы профиля
  - каркас дашборда

- **Pages (страницы)**  
  Конкретные реализации шаблонов с настоящими данными:
  - /profile/123
  - /orders/active

На уровне кода это часто выглядит как структура:

```text
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
    pages/
```

Преимущество такого подхода — понятная визуальная иерархия и возможность переиспользовать компоненты на разных уровнях детализации интерфейса.

Но здесь почти не задано, где и как хранить:

- бизнес‑логику
- работу с API
- доменные модели
- состояние приложения

Именно этот пробел и пытается покрыть vs-atomic.

## Что такое vs-atomic и зачем он нужен

### Основная идея vs-atomic

vs-atomic — это подход, который берет образность Atomic Design, но переносит фокус на **архитектурные уровни приложения**, а не только на визуальные.

Частая трактовка уровней vs-atomic:

- **v (view / visual)**  
  Чистые, «тупые» компоненты интерфейса. Аналогом можно считать комбинацию атомов/молекул/организмов, но без бизнес‑логики.

- **s (service / state / smart)**  
  Слой «умных» сущностей:
  - контейнеры
  - хуки
  - сервисы работы с API
  - управление состоянием

- **atomic (atomic modules / feature units)**  
  Завершенные атомарные модули, объединяющие view и service в цельный фрагмент функционала:
  - отдельная фича
  - часть домена
  - бизнес‑подмодуль

Смотрите, я покажу вам на простой схеме:

- View — отвечает за «как это выглядит».
- Service — отвечает за «как это работает».
- Atomic — цельный блок «выглядит + работает» и его можно переиспользовать как модуль.

### Чем vs-atomic отличается от чистого Atomic Design

Главное отличие:

- **Atomic Design** мыслит визуальными единицами — кнопки, формы, карточки.
- **vs-atomic** мыслит архитектурными модулями — UI‑слой, слой логики, и цельные модули приложения.

Грубо говоря, Atomic Design отвечает на вопрос:  
«Из каких визуальных блоков состоит наш интерфейс?»

А vs-atomic отвечает на вопрос:  
«Из каких архитектурных блоков состоит наше приложение и где находится логика?»

Поэтому vs-atomic не конкурирует напрямую с Atomic Design, а скорее расширяет его, накладываясь сверху на структуру модулей приложения.

## Структура проекта в стиле vs-atomic

### Базовая структура директорий

Давайте разберем пример структуры для фронтенд‑проекта на React с использованием vs-atomic.

```text
src/
  shared/           # Переиспользуемые вспомогательные сущности
    ui/            # Базовые UI-компоненты (кнопки, инпуты)
    lib/           # Утилиты, хелперы
    api/           # Общие клиенты и конфигурация API
  v/               # View-слой (чистые компоненты)
    user/
      UserCard/
      UserList/
    auth/
      LoginForm/
  s/               # Service-слой (логика, состояние, работа с данными)
    user/
      useUserList.ts
      useUserDetails.ts
      userService.ts
    auth/
      useLogin.ts
      authService.ts
  atomic/          # Завершенные модули/фичи
    user/
      UserListWidget/
      UserProfileWidget/
    auth/
      LoginWidget/
  app/             # Корневое приложение, роутинг, инициализация
    router/
    providers/
    App.tsx
```

Смотрите, что здесь важно:

- в **v/** вы держите только «немые» компоненты, которые получают данные через пропсы;
- в **s/** живут все «умные» сущности:
  - запросы к серверу
  - хранилища
  - сложные хуки;
- в **atomic/** собираете законченные блоки интерфейса с логикой:
  - виджеты
  - модули страниц
  - большие фичи.

### Пример: как выглядит один модуль во vs-atomic

Давайте разберемся на примере фичи отображения списка пользователей.

#### View‑компонент (папка `v/user/UserList`)

```tsx
// v/user/UserList/UserList.tsx
import React from "react";

// Здесь мы описываем только то, как список пользователей выглядит
export interface UserListProps {
  users: Array<{
    id: string
    name: string
    email: string
  }>
  isLoading: boolean
  onUserClick?: (id: string) => void
}

export const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  onUserClick,
}) => {
  if (isLoading) {
    return <div>Загрузка...</div> // Простой индикатор загрузки
  }

  if (!users.length) {
    return <div>Пользователи не найдены</div> // Сообщение об отсутствии данных
  }

  return (
    <ul>
      {users.map(user => (
        <li
          key={user.id}
          // Обратите внимание - компонент не знает,
          // что именно будет происходить при клике
          onClick={() => onUserClick?.(user.id)}
        >
          <div>{user.name}</div>
          <div>{user.email}</div>
        </li>
      ))}
    </ul>
  )
}
```

Здесь `UserList` — чистый view‑компонент. Никаких запросов, никаких стораджей.

#### Service‑слой (папка `s/user`)

```ts
// s/user/userService.ts
// Здесь мы инкапсулируем работу с API
import { apiClient } from "../../shared/api/client"

export interface User {
  id: string
  name: string
  email: string
}

// Получение списка пользователей с сервера
export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get("/users")
  return response.data as User[]
}
```

```ts
// s/user/useUserList.ts
// Здесь мы описываем логику загрузки и состояния списка пользователей
import { useEffect, useState } from "react"
import { fetchUsers, User } from "./userService"

export function useUserList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let canceled = false // Флаг для отмены, чтобы избежать утечек

    setIsLoading(true)
    fetchUsers()
      .then(data => {
        if (!canceled) {
          setUsers(data)
        }
      })
      .catch(err => {
        if (!canceled) {
          setError(err)
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsLoading(false)
        }
      })

    return () => {
      // Отмечаем, что эффект больше не актуален
      canceled = true
    }
  }, [])

  return {
    users,
    isLoading,
    error,
  }
}
```

В этом слое мы работаем с API, храним состояние и обрабатываем ошибки.

#### Atomic‑модуль (папка `atomic/user/UserListWidget`)

```tsx
// atomic/user/UserListWidget/UserListWidget.tsx
// Здесь мы соединяем логику и представление в готовый виджет
import React from "react"
import { useUserList } from "../../../s/user/useUserList"
import { UserList } from "../../../v/user/UserList/UserList"

export const UserListWidget: React.FC = () => {
  const { users, isLoading, error } = useUserList()

  if (error) {
    // Здесь мы решаем, как именно показывать ошибку
    return <div>Ошибка при загрузке пользователей</div>
  }

  return (
    <UserList
      users={users}
      isLoading={isLoading}
      onUserClick={id => {
        // Теперь вы увидите, как можно внедрить логику навигации
        console.log("Пользователь кликнул по пользователю", id)
        // Здесь могла бы быть навигация или открытие модального окна
      }}
    />
  )
}
```

Теперь у нас есть:

- переиспользуемая логика (`useUserList`);
- чистый UI‑компонент (`UserList`);
- законченный блок (`UserListWidget`), который можно вставить на любую страницу.

## Как совместить Atomic Design и vs-atomic

### Вариант 1: Atomic Design внутри слоя `v/`

Частая практика — использовать Atomic Design **внутри view‑слоя vs-atomic**. То есть:

```text
v/
  ui/              # Абстрактные атомы и молекулы
    atoms/
      Button/
      Input/
    molecules/
      LabeledInput/
      AvatarWithName/
    organisms/
      Header/
      Sidebar/
  user/
    UserCard/      # Конкретный view-компонент, собранный из atoms/molecules
    UserList/
  auth/
    LoginForm/
```

Смотрите, как это работает:

- `v/ui/atoms` — самые базовые независимые элементы;
- `v/ui/molecules` — небольшие композиции для переиспользования;
- `v/ui/organisms` — сложные части интерфейса, которые могут жить вне домена;
- `v/user/*` — view‑компоненты уже с доменным смыслом (например, `UserCard`, `UserList`).

По сути, vs-atomic становится «каркасом» архитектуры, а Atomic Design — способом организовать сами UI‑детали.

### Вариант 2: Atomic Design только в дизайн‑системе

Второй распространенный вариант — вообще не смешивать доменные сущности с Atomic Design, а зафиксировать его только для дизайн‑системы.

Структура может выглядеть так:

```text
shared/
  ui/              # Реализованная в коде дизайн-система
    atoms/
    molecules/
    organisms/
v/
  user/
  auth/
  ...
```

В этом случае:

- `shared/ui` соответствует уровням Atomic Design;
- `v/*` — собирает из этих кирпичей доменные интерфейсы;
- `s/*` — логика;
- `atomic/*` — готовые модули.

Так вы сохраняете чистоту дизайн‑системы и не смешиваете ее с доменом.

### Сравнение: что куда попадает

Для наглядности давайте посмотрим сравнение по типичным элементам.

#### Таблица распределения по Atomic Design и vs-atomic

| Тип сущности              | Atomic Design уровень     | vs-atomic уровень         |
|---------------------------|---------------------------|---------------------------|
| Базовая кнопка            | Atom                      | v (shared/ui/atoms)      |
| Поле ввода с лейблом      | Molecule                  | v (shared/ui/molecules)  |
| Хедер сайта               | Organism                  | v (shared/ui/organisms)  |
| Каркас страницы           | Template                  | v (страничный layout)    |
| Конкретная страница       | Page                      | app/pages или atomic      |
| Хук `useUserList`         | Не описан                 | s/user                    |
| Сервис `userService`      | Не описан                 | s/user                    |
| Виджет `UserListWidget`   | Ближе к Organism/Page     | atomic/user               |
| Навигация по маршрутам    | Не описана                | app/router                |

Как видите, Atomic Design покрывает в первую очередь визуальный столбец, а vs-atomic — архитектурный.

## Преимущества и недостатки обоих подходов

### Что дает Atomic Design

Плюсы:

- единый язык между дизайнерами и разработчиками;
- явная иерархия UI‑компонентов;
- высокая степень переиспользования базовых элементов;
- упрощение формирования библиотеки компонентов.

Минусы:

- почти нет ответа на вопрос «где хранить бизнес‑логику»;
- может быть сложно однозначно отнести компонент к уровню (молекула или организм?);
- при росте проекта структура `components/atoms/molecules/...` становится перегруженной.

### Что дает vs-atomic

Плюсы:

- четкое разделение:
  - представление (`v/`)
  - логика (`s/`)
  - завершенные модули (`atomic/`);
- проще находить, где находится конкретная часть функционала;
- удобно разделять ответственность в команде:
  - одни инженеры делают view;
  - другие — бизнес‑логику;
- легко выделять фичи в отдельные пакеты или микрофронтенды.

Минусы:

- требует дисциплины:
  - не класть логику в `v/`;
  - не дублировать сущности между `s/` и `atomic/`;
- для небольших проектов может казаться «избыточным»;
- если команда привыкла к чистому Atomic Design, переход потребует переучивания.

### Как комбинировать, чтобы взять лучшее

Давайте сформулируем практичную комбинацию:

1. **Используйте Atomic Design строго для дизайн‑системы**  
   Все базовые кнопки, инпуты, поля форм, типографика — в `shared/ui/atoms`, `shared/ui/molecules` и т.д.

2. **Выстраивайте остальную архитектуру через vs-atomic**  
   - доменные view‑компоненты — в `v/`;
   - сервисы, хуки, API — в `s/`;
   - фичи и виджеты — в `atomic/`;
   - инициализацию и роутинг — в `app/`.

3. **Не пытайтесь строго маппить все уровни Atomic Design на vs-atomic**  
   Например, нет необходимости отдельно выделять `templates` и `pages` внутри vs-atomic, если у вас уже есть хорошая структура роутинга.

## Практические рекомендации по применению vs-atomic

### Когда vs-atomic особенно полезен

Подход vs-atomic раскрывается лучше всего, когда:

- у вас **много логики на клиенте**:
  - сложные формы;
  - множество состояний;
  - локальный кеш;
- приложение активно работает с **разными источниками данных**;
- в команде есть разделение ролей:
  - «UI‑разработчики» и «архитекторы / backend‑ориентированные фронтендеры»;
- вам нужно **масштабировать проект** на несколько команд.

В таких случаях четкое разделение view/logic/atomic‑модулей позволяет снизить связанность и избежать хаоса.

### Где держать состояние — в `s/` или в `atomic/`?

Общее правило можно сформулировать так:

- **повторно используемое состояние** (например, хук `useUserList`, сервис `userService`) — в `s/`;
- **специфическое состояние только для конкретного виджета** — в `atomic/`.

Давайте посмотрим, что это значит на примере.

#### Повторно используемый хук в `s/`

```ts
// s/cart/useCart.ts
// Хук корзины, который может использоваться в разных модулях
import { useState } from "react"

export function useCart() {
  const [items, setItems] = useState<{ id: string; qty: number }[]>([])

  const addItem = (id: string) => {
    // Здесь мы добавляем товар в корзину
    setItems(prev => {
      const existing = prev.find(item => item.id === id)
      if (existing) {
        return prev.map(item =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [...prev, { id, qty: 1 }]
    })
  }

  const removeItem = (id: string) => {
    // Здесь мы удаляем товар из корзины
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return {
    items,
    addItem,
    removeItem,
  }
}
```

Этот хук можно использовать в разных atomic‑модулях: в шапке, в странице корзины, в попапе.

#### Локальное состояние виджета в `atomic/`

```tsx
// atomic/cart/CartWidget/CartWidget.tsx
// Здесь мы можем добавить локальное состояние, связанное
// только с этим конкретным виджетом
import React, { useState } from "react"
import { useCart } from "../../../s/cart/useCart"
import { CartView } from "../../../v/cart/CartView/CartView"

export const CartWidget: React.FC = () => {
  const { items, addItem, removeItem } = useCart()
  const [isOpen, setIsOpen] = useState(false) // Локальное состояние открытия

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Открыть корзину ({items.length})
      </button>

      {isOpen && (
        <CartView
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
```

Как видите, глобальная логика корзины — в `s/`, а локальное представление конкретного виджета (открыта корзина или нет) — в `atomic/`.

### Как мигрировать с чистого Atomic Design к vs-atomic

Если у вас уже есть проект, организованный только через Atomic Design (atoms/molecules/organisms/pages), давайте посмотрим, как вы можете аккуратно перейти к vs-atomic.

#### Шаг 1. Выделите дизайн‑систему

1. Оставьте в новом каталоге `shared/ui` компоненты, которые **не зависят от домена**:
   - кнопки;
   - инпуты;
   - модальные окна;
   - базовые карточки без привязки к бизнес‑сущностям.

2. Сохраните внутри `shared/ui` структуру Atomic Design, если она удобна команде.

```text
shared/
  ui/
    atoms/
    molecules/
    organisms/
```

#### Шаг 2. Перенесите доменные UI‑компоненты в `v/`

Все компоненты вроде:

- `UserCard`
- `OrderList`
- `ProductGallery`

перенесите в каталог `v/<домен>/...`.

```text
v/
  user/
    UserCard/
    UserList/
  order/
    OrderTable/
```

#### Шаг 3. Вынесите бизнес‑логику в `s/`

Извлеките:

- обращение к API;
- работу с хранилищем (Redux, Zustand, MobX и т.п.);
- сложные хуки;

в каталог `s/<домен>/...`.

```text
s/
  user/
    userService.ts
    useUserList.ts
  order/
    orderService.ts
    useOrderDetails.ts
```

#### Шаг 4. Соберите feature‑модули в `atomic/`

Создайте в `atomic/` более крупные блоки интерфейса:

- виджеты;
- части страниц;
- законченные элементы функционала.

```text
atomic/
  user/
    UserListWidget/
    UserProfileWidget/
  order/
    OrderDetailsWidget/
```

Так вы плавно перейдете к архитектуре vs-atomic, не разрушая существующую логику Atomic Design.

## Примеры конкретных сравнений: Atomic Design vs vs-atomic

### Пример 1. Форма логина

#### В Atomic Design

Структура может выглядеть так:

```text
components/
  atoms/
    Input/
    Button/
  molecules/
    LabeledInput/
  organisms/
    LoginForm/
  pages/
    LoginPage/
```

`LoginForm` одновременно:

- отображает поля;
- хранит локальное состояние формы;
- может отправлять запрос логина.

#### Во vs-atomic

Здесь мы более явно разделяем слои.

```text
shared/
  ui/
    atoms/Input
    atoms/Button
    molecules/LabeledInput

v/
  auth/
    LoginForm/           # Чистая форма без обращения к API

s/
  auth/
    authService.ts       # Запрос логина
    useLogin.ts          # Хук с логикой отправки

atomic/
  auth/
    LoginWidget/         # Готовый модуль логина
```

Код получается понятнее по ответственности.

View:

```tsx
// v/auth/LoginForm/LoginForm.tsx
// Форма знает только о полях и событиях, но не знает как именно будет происходить логин
import React, { useState } from "react"

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void
  isSubmitting: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Здесь мы вызываем внешний обработчик с текущими значениями
    onSubmit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        // Обновляем локальное состояние поля
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        // Обновляем локальное состояние поля
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Входим..." : "Войти"}
      </button>
    </form>
  )
}
```

Service:

```ts
// s/auth/authService.ts
// Здесь мы описываем как именно происходит запрос логина
import { apiClient } from "../../shared/api/client"

export async function login(email: string, password: string) {
  const response = await apiClient.post("/login", { email, password })
  return response.data // Здесь могут быть токены или данные пользователя
}
```

```ts
// s/auth/useLogin.ts
// Хук, который управляет состоянием логина
import { useState } from "react"
import { login } from "./authService"

export function useLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (email: string, password: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const data = await login(email, password)
      // Здесь вы можете сохранить токен или пользователя
      console.log("Успешный логин", data)
      return data
    } catch (e) {
      // Обратите внимание - мы не показываем ошибку напрямую в UI
      setError("Ошибка авторизации")
      throw e
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    error,
    submit,
  }
}
```

Atomic‑модуль:

```tsx
// atomic/auth/LoginWidget/LoginWidget.tsx
// Виджет собирает логику и UI вместе и решает что показывать пользователю
import React from "react"
import { LoginForm } from "../../../v/auth/LoginForm/LoginForm"
import { useLogin } from "../../../s/auth/useLogin"

export const LoginWidget: React.FC = () => {
  const { isSubmitting, error, submit } = useLogin()

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <LoginForm
        isSubmitting={isSubmitting}
        onSubmit={async ({ email, password }) => {
          try {
            await submit(email, password)
            // Давайте посмотрим - здесь может быть редирект после успешного логина
            console.log("Переходим на /dashboard")
          } catch {
            // Ошибка уже обработана в хуке, здесь можно оставить пусто
          }
        }}
      />
    </div>
  )
}
```

Такой подход делает зависимость между слоями явной и упрощает тестирование: можно отдельно тестировать `useLogin`, отдельно `LoginForm`, отдельно `LoginWidget`.

## Заключение

Atomic Design и vs-atomic решают разные, хотя и пересекающиеся задачи.

- Atomic Design помогает систематизировать визуальные элементы интерфейса и выстроить понятную иерархию UI‑компонентов.
- vs-atomic помогает структурировать архитектуру приложения по слоям ответственности: view, service, atomic‑модули.

Во многих проектах оптимальным оказывается не выбор между ними, а их совместное использование:

- Atomic Design — на уровне дизайн‑системы и базовых UI‑компонентов.
- vs-atomic — на уровне архитектуры модулей, логики и фич.

Такой гибридный подход дает:

- ясную картину, где искать логику, а где — только представление;
- возможность переиспользовать как UI‑кирпичики, так и бизнес‑хуки;
- удобную масштабируемую структуру для больших команд.

Если у вас уже есть проект на Atomic Design, вы можете постепенно ввести уровни `v/`, `s/` и `atomic/`, не ломая существующие компоненты, а просто распределяя их по слоям. На практике это помогает избавиться от «компонентов‑монстров», где смешаны верстка, логика и запросы, и сделать код более предсказуемым.

## Частозадаваемые технические вопросы по теме и ответы

### 1. Как организовать тесты во vs-atomic относительно Atomic Design?

Рекомендуемый подход:

- тесты для базовых Atomic‑компонентов (`shared/ui/atoms`, `molecules`) — проверяют лишь отрисовку и простые взаимодействия;
- тесты для `v/` — снапшоты и сценарии отрисовки без моков API;
- тесты для `s/` — юнит‑тесты логики, хуков и сервисов с моками сети;
- тесты для `atomic/` — интеграционные тесты, проверяющие работу виджетов целиком.

Структура каталогов тестов может повторять основную структуру:

```text
v/user/UserList/__tests__/
s/user/useUserList/__tests__/
atomic/user/UserListWidget/__tests__/
```

### 2. Как решать пересечение доменов в `s/` и `atomic/`?

Если некоторая логика принадлежит сразу нескольким доменам (например, фильтрация списков), вынесите ее в `shared/lib` или `shared/model`, а доменные части держите в `s/<домен>`. В `atomic/` импортируйте общую логику из `shared`.

### 3. Можно ли внутри `v/` использовать контекст или глобальное состояние?

Для чистоты подхода vs-atomic лучше этого избегать. Контексты и глобальные стораджи логичнее держать либо в `s/` (доменные), либо в `app/` (глобальные), а внутрь `v/` передавать данные уже готовыми пропсами. Это упрощает тестирование и переиспользование view‑слоя.

### 4. Как разделять кроссплатформенные компоненты (web и mobile) во vs-atomic?

Обычно создают подуровень платформ:

```text
v/user/UserCard/web/
v/user/UserCard/native/
```

Логику (`s/`) и atomic‑модули по возможности делают платформенно‑агностичными, а различия выносят только в view‑реализацию. В `atomic/` можно собирать разные виджеты для каждой платформы или делать адаптеры.

### 5. Как связать vs-atomic с модульной/feature‑sliced архитектурой?

vs-atomic хорошо сочетается с feature‑sliced подходом: уровни `v/`, `s/`, `atomic/` можно вкладывать внутрь фич и доменов. Например:

```text
features/
  user/
    v/
    s/
    atomic/
``` 

Так вы совмещаете удобство разделения по слоям (vs-atomic) и по функциональным областям (features).