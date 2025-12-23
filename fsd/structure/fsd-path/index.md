---
metaTitle: Путь к файлу в архитектуре FSD - fsd-path
metaDescription: Узнайте как правильно проектировать и именовать пути к файлам в архитектуре Feature Sliced Design - разберем паттерны fsd-path и практику организации модулей по слоям и фичам
author: Олег Марков
title: Путь к файлу в FSD - fsd-path и практики организации кода
preview: Разберем принцип fsd-path в архитектуре Feature Sliced Design - как выбирать путь к файлу в зависимости от слоя фичи и типа сущности и как это упрощает поддержку и развитие проекта
---

## Введение

Путь к файлу в проекте — это не просто место, где лежит код. От структуры путей зависят:

- скорость навигации по проекту;
- простота рефакторинга;
- возможность разделять ответственность между командами;
- предсказуемость импорта модулей.

В архитектуре Feature-Sliced Design (FSD) эта тема выделена в отдельный аспект, который часто обозначают как fsd-path — система правил, по которым вы выстраиваете структуру директорий и файлов в проекте.

Здесь мы разберем, что такое fsd-path в контексте FSD, как выбирать путь к файлу в зависимости от слоя, типа сущности и контекста применения, а также как это влияет на импорты, переиспользование и масштабируемость проекта. Смотрите, я покажу вам это на практических схемах и фрагментах кода.

---

## Что такое fsd-path и зачем он нужен

### Основная идея fsd-path

В FSD путь к файлу — это отражение:

- слоя (layer), к которому относится модуль;
- типа сущности (slice) — app, processes, pages, widgets, features, entities, shared;
- конкретной фичи, сущности или виджета;
- типа артефакта (ui, model, lib, api и другие).

Проще говоря, fsd-path — это соглашения о том, где именно в дереве папок должен лежать модуль с определенной ролью.

Главный принцип: по пути к файлу вы всегда можете понять:

1. какова зона ответственности этого кода;
2. насколько он переиспользуемый;
3. какие уровни абстракции он может использовать и кого может импортировать.

### Почему это важнее, чем просто «красиво разложить файлы»

Если архитектура не согласована с путями к файлам:

- сложно понять, что можно импортировать, а что приведет к циклическим зависимостям;
- появляются «слои-помойки», куда складывают все подряд;
- при масштабировании проекта изменятся десятки импортов из-за хаотичного перемещения файлов.

FSD предлагает договориться об общей карте проекта. fsd-path — это как маршруты на этой карте.

---

## Базовая структура проекта и слои FSD

### Стандартные слои

В классическом FSD выделяют следующие слои верхнего уровня:

- app — инициализация приложения, корневые провайдеры, глобальные стили;
- processes — долгоживущие бизнес-процессы, охватывающие несколько страниц;
- pages — страницы приложения;
- widgets — крупные композиционные блоки интерфейса (секции страниц);
- features — законченные пользовательские возможности (логин, поиск, фильтрация);
- entities — бизнес-сущности доменной области (User, Product, Order);
- shared — переиспользуемая инфраструктура и примитивы, не привязанные к домену.

Смотрите, как может выглядеть корень проекта:

```bash
src/
  app/
  processes/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Здесь каждый каталог верхнего уровня — это первый шаг в формировании fsd-path.

### Принцип «от общего к частному»

Путь к файлу в FSD, как правило, следует паттерну:

слой / конкретная-сущность / внутренняя-структура

Например:

- features/auth/by-username/model/services/loginByUsername.ts
- entities/user/ui/UserAvatar.tsx
- widgets/cart/ui/CartWidget.tsx

Давайте разберемся, как именно решать, куда класть новый модуль.

---

## Как выбрать правильный слой для файла

### Когда использовать entities

Слой entities описывает модель предметной области:

- типы сущностей (User, Product, Order);
- их базовые компоненты отображения;
- простые операции с ними, не завязанные на конкретный сценарий (например, нормализация данных).

Если вы создаете модуль, который:

- описывает сущность;
- используется в нескольких фичах;
- не завязан жестко на UX и конкретный сценарий,

то его путь к файлу, скорее всего, пройдет через entities.

Пример:

```bash
src/entities/user/
  model/
    types/user.ts          # Типы для сущности User
    selectors/getUser.ts   # Селекторы сущности
  ui/
    UserAvatar.tsx         # Базовый UI-компонент для аватара
    UserName.tsx           # Компонент для отображения имени
```

Комментарии в файлах могут выглядеть так:

```ts
// model/types/user.ts

// Описание типа сущности пользователя
export interface User {
  id: string
  username: string
  avatarUrl?: string
}
```

### Когда использовать features

Слой features отвечает за завершенные пользовательские возможности. Это то, что пользователь воспринимает как действие или функцию: «войти», «добавить в избранное», «оформить заказ».

Вы выбираете features, если:

- модуль реализует полноценный сценарий или его часть;
- логика завязана на UX и контекст взаимодействия;
- код использует одну или несколько entities.

Пример пути:

```bash
src/features/auth/by-username/
  ui/
    LoginForm.tsx
  model/
    types/loginForm.ts
    selectors/getLoginState.ts
    services/loginByUsername.ts
```

И поясняющий код:

```ts
// services/loginByUsername.ts

// Сервис авторизации по имени пользователя
export const loginByUsername = async (username: string, password: string) => {
  // Здесь реализован запрос к API
  // В реальном проекте вы вынесете URL и клиент в shared/api
}
```

### Когда использовать widgets

widgets — это композиции, которые собирают:

- несколько features;
- entities;
- shared-компоненты

в единый блок интерфейса.

Выберите widgets, если:

- блок может использоваться на разных страницах;
- он достаточно крупный (например, «Корзина», «Шапка сайта», «Секция профиля»);
- внутри есть независимые фичи.

Пример:

```bash
src/widgets/cart/
  ui/
    CartWidget.tsx
```

```tsx
// ui/CartWidget.tsx

// Виджет корзины, собирает несколько фич и сущностей
export const CartWidget = () => {
  // Здесь может быть вывод списка товаров, итоговой суммы, кнопки «Оформить заказ»
  return (
    <section>
      {/* Контент корзины */}
    </section>
  )
}
```

### Когда использовать pages

pages — это слой, привязанный к маршрутам:

- каждая страница отражает url-роут;
- внутри собираются widgets и features, относящиеся к конкретному экрану.

Путь к файлу страницы обычно:

```bash
src/pages/profile/
  ui/
    ProfilePage.tsx
  model/
    # опционально - состояние, специфичное только для этой страницы
```

### Когда использовать app

Слой app — это точка входа и глобальная конфигурация:

- инициализация маршрутизации;
- провайдеры состояния;
- глобальные стили/темы;
- корневые компоненты.

Пример:

```bash
src/app/
  providers/
  routes/
  styles/
  App.tsx
```

### Когда использовать processes

processes — редкий, но полезный слой для долгоживущих процессов, которые:

- включают несколько страниц;
- описывают сложный бизнес-процесс;
- имеют собственное состояние и логику.

Пример:

```bash
src/processes/checkout/
  model/
  ui/
```

### Когда использовать shared

shared — это:

- ui — переиспользуемые атомарные или молекулярные компоненты (кнопки, инпуты);
- lib — утилиты и хелперы;
- api — общие клиенты и конфигурация запросов;
- config — константы и настройки.

Если модуль не зависит от домена и может быть перенесен в другой проект без изменений доменной логики, он почти всегда находится в shared.

---

## Внутренняя структура сущности по fsd-path

### Типовая структура сущности (slice)

Для каждого «слайса» (например, features/auth, entities/user) часто используют следующий шаблон:

- ui — компоненты интерфейса;
- model — состояние, действия, редьюсеры, селекторы;
- api — запросы к серверу, специфичные для этого слайса;
- lib — утилиты и хелперы, связанные только с этим слайсом;
- config или consts — локальные настройки.

Смотрите пример для features/auth/by-username:

```bash
src/features/auth/by-username/
  ui/
    LoginForm.tsx
  model/
    selectors/
      getLoginIsLoading.ts
    services/
      loginByUsername.ts
    slices/
      loginSlice.ts
    types/
      loginSchema.ts
  lib/
    mapApiErrorToMessage.ts
  api/
    loginApi.ts
```

Теперь вы увидите, как это выглядит в коде для одного из модулей:

```ts
// model/services/loginByUsername.ts

import { loginApi } from '../../api/loginApi'

// Сервис авторизации по имени пользователя
export const loginByUsername = async (username: string, password: string) => {
  // Вызываем API-метод для авторизации
  const response = await loginApi.login({ username, password })

  // Обрабатываем результат и возвращаем данные
  return response.data
}
```

Комментарии помогают быстро понять назначение файла, не заглядывая глубоко внутрь.

### Как выбирать имена папок и файлов

Есть несколько правил, которые хорошо сочетаются с fsd-path:

1. Папка должна отражать доменную или техническую роль:
   - model, ui, api, lib, config;
   - selectors, services, slices, types внутри model.

2. Имя файла должно быть достаточно конкретным:
   - loginByUsername.ts вместо login.ts;
   - getUserAuthData.ts вместо selector.ts.

3. Для React-компонентов обычно используют PascalCase:
   - LoginForm.tsx;
   - UserAvatar.tsx.

4. Для функций и утилит — camelCase:
   - formatPrice.ts;
   - mapApiErrorToMessage.ts.

---

## Импорт модулей и относительные пути при fsd-path

### Проблема «лесенки» с относительными импортами

В больших проектах легко получить импорт вида:

```ts
import { LoginForm } from '../../../../features/auth/by-username/ui/LoginForm'
```

Такой путь:

- плохо читается;
- сложно обновляется при перемещении файлов;
- провоцирует ошибки при рефакторинге.

В FSD принято использовать alias (webpack, Vite, tsconfig) для слоев:

- app -> app
- processes -> processes
- pages -> pages
- widgets -> widgets
- features -> features
- entities -> entities
- shared -> shared

Тогда импорт будет выглядеть так:

```ts
// Импорт формы логина по алиасу слоя
import { LoginForm } from 'features/auth/by-username'
```

### Индексные файлы как часть fsd-path

Чтобы упростить импорт, внутри слайса часто создают index-файл, который является публичным API этого слайса:

```bash
src/features/auth/by-username/
  index.ts
  ui/
    LoginForm.tsx
  model/
    services/
      loginByUsername.ts
```

index.ts:

```ts
// index.ts

// Экспортируем только то, что можно использовать снаружи
export { LoginForm } from './ui/LoginForm'
export { loginByUsername } from './model/services/loginByUsername'
```

Теперь из других слоев вы импортируете только через публичное API:

```ts
// Импорт UI-компонента фичи
import { LoginForm } from 'features/auth/by-username'

// Импорт бизнес-логики фичи
import { loginByUsername } from 'features/auth/by-username'
```

Обратите внимание, что вы не лезете внутрь структуры фичи (ui/model/services). Это снижает связанность и позволяет менять внутреннюю структуру, не ломая импорты.

---

## Правила зависимостей между слоями

### Базовый граф зависимостей

FSD предлагает направление зависимостей:

- app может зависеть от всех слоев;
- processes — от pages, widgets, features, entities, shared;
- pages — от widgets, features, entities, shared;
- widgets — от features, entities, shared;
- features — от entities, shared;
- entities — от shared;
- shared — не должен зависеть от других слоев.

Смотрите, как это можно сформулировать в виде кратких правил:

- Нельзя импортировать сверху вниз (например, из features в widgets) — только в сторону более высокоуровневых слоев.
- shared не знает о домене, поэтому не тянет за собой entities или features.

### Пример корректного и некорректного импорта

Корректный импорт:

```ts
// pages/profile/ui/ProfilePage.tsx

// Страница может использовать виджеты, фичи и сущности
import { ProfileHeader } from 'widgets/profile-header'
import { ProfileCard } from 'entities/profile'
import { UpdateProfileForm } from 'features/profile/update-profile'
```

Некорректный импорт:

```ts
// features/profile/update-profile/model/services/updateProfile.ts

// ПЛОХО - фича импортирует страницу (обратная зависимость)
import { ProfilePage } from 'pages/profile'
```

В идеале подобные нарушения контролируются линтером, но основа — все равно в четкой структуре путей и разделении ответственности.

---

## Публичное и приватное API слайсов

### Публичное API через index.ts

fsd-path тесно связан с концепцией public API. Для каждого слайса (features, entities, widgets, иногда pages) определяют:

- index.ts — публичный вход в модуль;
- внутренние пути, на которые не полагаются снаружи.

Пример:

```bash
src/entities/user/
  index.ts
  ui/
    UserAvatar.tsx
    UserName.tsx
  model/
    selectors/
      getUserAuthData.ts
    types/
      user.ts
```

index.ts:

```ts
// index.ts

// Экспортируем только то, что реально нужно снаружи
export { UserAvatar } from './ui/UserAvatar'
export { UserName } from './ui/UserName'
export type { User } from './model/types/user'
export { getUserAuthData } from './model/selectors/getUserAuthData'
```

Теперь во всех местах проекта вы используете только путь:

```ts
import { UserAvatar, getUserAuthData } from 'entities/user'
```

Если вы решите изменить внутреннюю структуру (например, добавить поддиректорию ui/profile), внешние импорты останутся неизменными.

### Скрытие внутренней реализации

Главный плюс такого пути:

- вы можете менять организацию файлов и папок внутри сущности, не трогая десятки мест импорта;
- вы ограничиваете, что можно использовать снаружи, и не допускаете «утечки деталей».

---

## Примеры реальных путей fsd-path для разных задач

### Пример 1: Авторизация пользователя

Представим, что нужно реализовать фичу «авторизация по логину и паролю». Давайте посмотрим, как это можно разложить по FSD.

Пути к файлам:

```bash
src/
  entities/
    user/
      index.ts
      model/
        types/user.ts
        selectors/getUserAuthData.ts
      ui/
        UserAvatar.tsx
        UserName.tsx

  features/
    auth/
      by-username/
        index.ts
        ui/
          LoginForm.tsx
        model/
          services/loginByUsername.ts
          types/loginSchema.ts
        lib/
          mapApiErrorToMessage.ts

  pages/
    login/
      ui/
        LoginPage.tsx

  widgets/
    auth-by-username/
      ui/
        AuthByUsernameWidget.tsx
```

Фрагмент страницы:

```tsx
// pages/login/ui/LoginPage.tsx

import { AuthByUsernameWidget } from 'widgets/auth-by-username'

// Страница логина - собирает виджет авторизации
export const LoginPage = () => {
  return (
    <main>
      {/* Виджет авторизации по имени пользователя */}
      <AuthByUsernameWidget />
    </main>
  )
}
```

Фрагмент виджета:

```tsx
// widgets/auth-by-username/ui/AuthByUsernameWidget.tsx

import { LoginForm } from 'features/auth/by-username'

// Виджет, оборачивающий форму логина
export const AuthByUsernameWidget = () => {
  return (
    <section>
      {/* Фича авторизации подставляется внутрь виджета */}
      <LoginForm />
    </section>
  )
}
```

Фичу в будущем можно будет переиспользовать в другом месте (например, в модальном окне), так как путь к ней фиксированный и понятный.

### Пример 2: Список товаров и добавление в избранное

Допустим, есть доменная сущность Product и фича «добавить в избранное».

Пути:

```bash
src/entities/product/
  index.ts
  ui/
    ProductCard.tsx
  model/
    types/product.ts

src/features/favorites/toggle-favorite/
  index.ts
  ui/
    FavoriteButton.tsx
  model/
    services/toggleFavorite.ts

src/widgets/catalog/
  ui/
    CatalogWidget.tsx
```

Смотрите, как может выглядеть виджет каталога:

```tsx
// widgets/catalog/ui/CatalogWidget.tsx

import { ProductCard } from 'entities/product'
import { FavoriteButton } from 'features/favorites/toggle-favorite'

// Виджет каталога - список продуктов с возможностью добавления в избранное
export const CatalogWidget = ({ products }) => {
  return (
    <section>
      {products.map((product) => (
        <article key={product.id}>
          {/* Карточка товара из слоя сущностей */}
          <ProductCard product={product} />
          {/* Кнопка избранного из слоя фич */}
          <FavoriteButton productId={product.id} />
        </article>
      ))}
    </section>
  )
}
```

Здесь fsd-path подсказывает:

- entities/product — отвечает за отображение и типизацию товара;
- features/favorites/toggle-favorite — за сценарий добавления товара в избранное;
- widgets/catalog — за компоновку всего этого для конкретной страницы.

---

## Нейминг и группировка фич и сущностей в fsd-path

### Группировка по доменам

В больших проектах возникает вопрос: как группировать фичи и сущности, чтобы пути были понятными?

Частый подход:

- использовать домены верхнего уровня (auth, profile, orders, catalog и т.д.);
- внутри домена выделять конкретные сценарии.

Примеры:

```bash
features/auth/by-username/
features/auth/by-email/
features/profile/update-profile/
features/cart/add-to-cart/
features/cart/remove-from-cart/

entities/user/
entities/product/
entities/cart/
```

Так пути к файлам остаются выразительными и не превращаются в «features/v1/feature1».

### Когда вводить дополнительные уровни папок

Иногда внутри одного домена накапливается много сценариев. Тогда можно ввести дополнительный уровень:

```bash
features/profile/edit/
features/profile/change-password/
features/profile/upload-avatar/
```

Вместо одной перегруженной папки features/profile.

Главный ориентир: если при открытии директории вы теряетесь в десятках файлов и подпапок, значит, структуру стоит уточнить и, возможно, добавить доменный уровень или дополнительное разбиение.

---

## Инструменты и автоматизация для контроля fsd-path

### Настройка alias в TypeScript

Чтобы использовать fsd-path с алиасами, многие настраивают paths в tsconfig:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "app/*": ["app/*"],
      "processes/*": ["processes/*"],
      "pages/*": ["pages/*"],
      "widgets/*": ["widgets/*"],
      "features/*": ["features/*"],
      "entities/*": ["entities/*"],
      "shared/*": ["shared/*"]
    }
  }
}
```

Комментарии к конфигу:

// baseUrl - корень, от которого считаются алиасы  
// paths - соответствие алиаса реальной папке

После этого в коде можно писать:

```ts
// Импортируем страницу по алиасу
import { ProfilePage } from 'pages/profile'
```

### Настройка alias в Webpack или Vite

Пример для Webpack:

```js
// webpack.config.js

const path = require('path')

module.exports = {
  // ...
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app'),
      processes: path.resolve(__dirname, 'src/processes'),
      pages: path.resolve(__dirname, 'src/pages'),
      widgets: path.resolve(__dirname, 'src/widgets'),
      features: path.resolve(__dirname, 'src/features'),
      entities: path.resolve(__dirname, 'src/entities'),
      shared: path.resolve(__dirname, 'src/shared'),
    },
  },
}
```

Комментарии:

// alias - задаем короткие имена для импортов  
// path.resolve - получаем абсолютный путь к каталогу слоя

---

## Типичные ошибки при выборе пути к файлу и как их избегать

### Ошибка 1: Все складывать в shared

Сценарий: «фича использует общую кнопку, значит, положим все в shared/ui». Через время в shared оказывается и логика авторизации, и формы, и бизнес-правила.

Как избежать:

- помните, что shared — слой без домена и без знаний о бизнес-логике;
- UI-компонент, связанный с конкретным доменом, должен жить в entities или features, а не в shared/ui.

### Ошибка 2: Фича без отдельной папки

Иногда разработчики создают фичу так:

```bash
src/features/
  loginForm.tsx
  loginSlice.ts
```

Такая плоская структура плохо масштабируется. Гораздо яснее ввести директорию для фичи:

```bash
src/features/auth/by-username/
  ui/LoginForm.tsx
  model/loginSlice.ts
```

### Ошибка 3: Дублирование путей и ролей

Пример неудачной структуры:

```bash
src/features/auth/
  ui/
    LoginForm.tsx
  model/
    LoginForm.ts         # файл с тем же именем, другая роль
```

В итоге становится сложно понять, какой LoginForm где использовать.

Лучше:

```bash
src/features/auth/by-username/
  ui/LoginForm.tsx
  model/loginSlice.ts
```

И не использовать одинаковые имена в ui и model для разных сущностей.

### Ошибка 4: Импорты во внутренние файлы слайса

Если везде писать:

```ts
import { loginByUsername } from 'features/auth/by-username/model/services/loginByUsername'
```

то вы теряете преимущество public API, и любое изменение структуры приведет к массовому рефакторингу.

Лучше ограничиться:

```ts
import { loginByUsername } from 'features/auth/by-username'
```

а в index.ts экспортировать нужный сервис.

---

## Как постепенно внедрять fsd-path в существующий проект

### Шаг 1: Ввести слои верхнего уровня

Сначала можно просто:

- создать папки app, pages, widgets, features, entities, shared;
- начать складывать новые модули по слоям.

Старые модули можно не трогать сразу.

### Шаг 2: Ввести индексные файлы и публичное API

Далее вы:

- для каждой новой фичи создаете index.ts;
- в остальном коде импортируете только через index-файлы.

Это уже добавляет стабильность путям.

### Шаг 3: Постепенный перенос старых модулей

Когда вы будете трогать старый код:

- при необходимости меняете путь к файлу, приводя к fsd-path;
- создаете сущности и фичи вместо «грязных» папок типа components или utils.

---

С точки зрения теории fsd-path — это не единственный возможный способ организовать проект, но он делает архитектуру более явной и проверяемой. Чем последовательнее вы будете придерживаться его принципов, тем проще станет навигация по проекту и развитие кода в команде.

---

## Частозадаваемые технические вопросы по fsd-path

### Как быть с тестами - где хранить файлы тестов в структуре FSD

Обычно тесты кладут рядом с тестируемым модулем, сохраняя тот же путь. Например, для features/auth/by-username/model/services/loginByUsername.ts создайте файл features/auth/by-username/model/services/loginByUsername.test.ts. Это помогает сразу видеть связь между кодом и тестом. Если вы используете единый test-слой, сохраняйте внутри него те же подпути, что и в src, чтобы путь отражал домен и слой.

### Как размещать стили - делать отдельные style-папки или хранить рядом с компонентом

Чаще всего стили хранят рядом с компонентом, чтобы путь оставался локальным к UI. Например, entities/user/ui/UserAvatar.tsx и entities/user/ui/UserAvatar.module.scss. Это соответствует идее FSD - каждый слайс инкапсулирует свою реализацию, включая стили. Отдельные style-папки на верхнем уровне делают навигацию по стилям сложнее и нарушают локальность.

### Где хранить типы для API-ответов - в shared или в entities

Если типы описывают конкретную доменную сущность, стоит разместить их в entities - например, entities/user/model/types/user.ts. Если тип привязан к конкретному эндпоинту или сценарию, его можно оставить в соответствующем api-модуле внутри features или entities. В shared имеет смысл выносить только полностью инфраструктурные типы - вроде общих оберток response или error.

### Как организовать путь к файлам для монорепозитория с несколькими приложениями

Часто создают общий src и подпапки для каждого приложения. Например apps/admin/src и apps/client/src. Внутри каждого src повторяют FSD-слои - app, pages, widgets и так далее. Общие сущности и shared-код выносят в отдельные пакеты или в общий каталог packages/entities, packages/shared. Важно сохранять единый подход к слоям и алиасам для всех приложений.

### Как поступать с конфигурацией роутинга - это app или pages

Конфигурация маршрутов обычно относится к слою app, потому что она описывает каркас всего приложения. При этом сами компоненты страниц лежат в pages. То есть в app/routes вы храните описание маршрутов и их привязку к страницам, а реализация UI страниц находится по путям вида pages/profile/ui/ProfilePage.tsx. Такой подход сохраняет роль app как точки сборки и инициализации проекта.