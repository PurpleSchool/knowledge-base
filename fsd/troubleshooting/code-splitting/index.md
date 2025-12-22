---
metaTitle: Code splitting в FSD - как грамотно делить фронтенд по слоям и фичам
metaDescription: Подробный разбор code splitting в архитектуре FSD - как разбивать код на чанки по фичам и слоям, настраивать роутинг и ленивая загрузка и избегать типичных ошибок
author: Олег Марков
title: Code splitting в FSD - практическое руководство для фронтенд разработчиков
preview: Разберитесь как реализовать code splitting в проектах с архитектурой Feature Sliced Design - изучите подходы для роутов фич и виджетов увидите примеры настройки и разберете частые проблемы
---

## Введение

Code splitting — это техника, которая позволяет разбивать фронтенд-приложение на отдельные части (чанки), чтобы загружать их по мере необходимости, а не одним большим бандлом. В проектах с архитектурой Feature-Sliced Design (FSD) этот подход особенно хорошо сочетается со структурой слоёв и фич.

Здесь мы разберем, как вписать code splitting в FSD:

- как делить чанки по роутам, фичам и виджетам;
- как строить lazy-роутинг поверх слоев `pages`, `widgets`, `features`;
- как не «пробить» границы слоёв при динамическом импорте;
- как сделать удобные обёртки для `React.lazy` и Suspense;
- как подходить к shared-коду и кэшированию.

Смотрите, я покажу вам, как это работает шаг за шагом на примере типичного SPA с React и FSD.

---

## Зачем нужен code splitting в FSD

### Основные задачи

В архитектуре FSD код уже логически разделён:

- `app` — корневые настройки приложения;
- `processes` — долгоживущие бизнес-процессы;
- `pages` — страницы;
- `widgets` — крупные композиции интерфейса;
- `features` — независимые пользовательские сценарии;
- `entities` — бизнес-сущности;
- `shared` — общий инфраструктурный код.

Code splitting отвечает на вопрос: **как превратить эту логическую структуру в отдельные чанки**, которые будут загружаться:

- по роуту (страничный splitting),
- по фиче/виджету (функциональный splitting),
- по редко используемым кускам (on-demand splitting).

### Какие проблемы он решает

1. Уменьшение initial bundle  
   Пользователь быстрее получает первую рабочую страницу.

2. Плавное масштабирование  
   Проект растёт, а стартовый бандл не раздувается за счет lazy-загрузки новых страниц и фич.

3. Локализация зависимостей  
   Вес фичи или страницы не «подмешивается» ко всему приложению, если она редко используется.

В FSD это особенно удобно: уже есть слои и сущности, достаточно только **правильно выбрать точки входа** для динамического импорта.

---

## Базовые подходы к code splitting в FSD

### Где обычно делаем code splitting

В проектах с FSD чаще всего делают разделение в трёх местах:

1. **По страницам (`pages`)**
   - каждая страница — отдельный чанк;
   - это самый очевидный и безопасный вариант.

2. **По фичам (`features`)**
   - фичи, которые нужны не везде (например, оплата, расширенный поиск), можно грузить лениво.

3. **По виджетам (`widgets`)**
   - тяжёлые компоненты, которые не нужны сразу (например, сложная аналитика в админке), можно сделать lazy.

Обратите внимание: code splitting **не ломает** слои FSD. Он работает поверх уже настроенных границ и зависит от того, где вы подключаете импорт.

---

## Настройка code splitting при роутинге

Для примеров буду использовать React Router v6, но подход похож и для других решений.

### Стандартный импорт без разделения

Давайте посмотрим на простой роутинг без code splitting:

```tsx
// app/providers/router/ui/AppRouter.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Импорт страниц обычным способом - без code splitting
import { MainPage } from '@/pages/main'
import { ProfilePage } from '@/pages/profile'
import { NotFoundPage } from '@/pages/not-found'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Стартовая страница всегда в бандле */}
        <Route path="/" element={<MainPage />} />
        {/* Страница профиля тоже всегда в бандле */}
        <Route path="/profile" element={<ProfilePage />} />
        {/* Страница 404 также грузится всегда */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Такой подход прост, но все страницы попадают в initial bundle.

### Подключаем React.lazy и Suspense

Теперь давайте сделаем ленивую загрузку страниц:

```tsx
// app/providers/router/ui/AppRouter.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'

// Импортируем React.lazy для ленивой загрузки
const MainPage = React.lazy(() => import('@/pages/main'))
const ProfilePage = React.lazy(() => import('@/pages/profile'))
const NotFoundPage = React.lazy(() => import('@/pages/not-found'))

// Простой компонент-заглушка на время загрузки
const PageLoader = () => <div>Загрузка страницы...</div>

export const AppRouter = () => {
  return (
    <BrowserRouter>
      {/* Оборачиваем роуты в Suspense - пока страница грузится, показываем fallback */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

Что здесь происходит:

- для каждой страницы создается отдельный чанк (webpack / Vite сделают это автоматически);
- когда пользователь открывает путь `/profile`, загружается только чанк профиля;
- если он туда никогда не зайдёт, чанк не будет загружен.

### Обёртка для lazy-компонентов в FSD

Чтобы не копировать `Suspense` и `fallback` везде, удобно сделать обёртку в `shared`:

```tsx
// shared/lib/withSuspense.tsx

import { ComponentType, Suspense } from 'react'

// HOC для оборачивания ленивых компонентов
export function withSuspense<T extends object>(
  Component: ComponentType<T>,
  Fallback: ComponentType | null = null,
) {
  // Возвращаем новый компонент-обёртку
  return (props: T) => {
    // Если фолбек не передан - используем простой div
    const FallbackComponent = Fallback ?? (() => <div>Загрузка...</div>)

    return (
      <Suspense fallback={<FallbackComponent />}>
        <Component {...props} />
      </Suspense>
    )
  }
}
```

Теперь вы можете использовать её в роутере:

```tsx
// app/providers/router/ui/AppRouter.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import { withSuspense } from '@/shared/lib/withSuspense'
import { PageLoader } from '@/shared/ui/PageLoader'

// Ленивая загрузка страниц
const MainPageLazy = React.lazy(() => import('@/pages/main'))
const ProfilePageLazy = React.lazy(() => import('@/pages/profile'))
const NotFoundPageLazy = React.lazy(() => import('@/pages/not-found'))

// Оборачиваем в HOC с нужным фолбеком
const MainPage = withSuspense(MainPageLazy, PageLoader)
const ProfilePage = withSuspense(ProfilePageLazy, PageLoader)
const NotFoundPage = withSuspense(NotFoundPageLazy, PageLoader)

export const AppRouter = () => {
  return (
    <BrowserRouter>
      {/* Suspense теперь внутри HOC - здесь код чище */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Так вы централизуете логику загрузки и оставляете руты максимально простыми.

---

## Code splitting на уровне страниц (`pages`)

### Структура файлов в FSD

Смотрите, как может выглядеть структура `pages`:

```txt
src/
  pages/
    main/
      ui/
        MainPage.tsx
      index.ts
    profile/
      ui/
        ProfilePage.tsx
      index.ts
    article/
      ui/
        ArticlePage.tsx
      index.ts
```

В `index.ts` страницы обычно экспортируют только публичный компонент:

```ts
// pages/profile/index.ts

// Экспортируем только публичный компонент страницы
export { ProfilePage } from './ui/ProfilePage'
```

### Ленивая страница как отдельный модуль

Часто для удобства создают отдельный файл для ленивой версии:

```tsx
// pages/profile/ui/ProfilePage.lazy.tsx

import React from 'react'
import { withSuspense } from '@/shared/lib/withSuspense'
import { PageLoader } from '@/shared/ui/PageLoader'

// Лениваем саму страницу
const ProfilePageLazy = React.lazy(() => import('./ProfilePage'))

// Оборачиваем в HOC с общим лоадером
export const ProfilePageAsync = withSuspense(ProfilePageLazy, PageLoader)
```

А в индексе экспортируют оба варианта при необходимости:

```ts
// pages/profile/index.ts

export { ProfilePage } from './ui/ProfilePage'
// Асинхронный вариант только если нужен снаружи
export { ProfilePageAsync } from './ui/ProfilePage.lazy'
```

Теперь вы можете использовать `ProfilePageAsync` в роутере:

```tsx
// app/providers/router/ui/AppRouter.tsx

import { ProfilePageAsync } from '@/pages/profile'

<Route path="/profile" element={<ProfilePageAsync />} />
```

Такой подход хорошо соответствует FSD: публичный API страницы (`index.ts`) сам решает, какой именно вариант страницы предоставить потребителю.

---

## Code splitting для виджетов (`widgets`)

### Когда имеет смысл разделять виджеты

Разделение по виджетам полезно, когда:

- виджет тяжелый (графики, сложные таблицы, карты);
- виджет не всегда виден (отдельная вкладка, модальное окно, раскрывающаяся панель);
- виджеты отличаются по правам доступа (админские панели, статистика).

Пример: у вас есть виджет аналитики, который открывается по клику во вкладке.

Структура:

```txt
src/
  widgets/
    analytics-panel/
      ui/
        AnalyticsPanel.tsx
        AnalyticsPanel.lazy.tsx
      index.ts
```

Смотрите, как можно сделать ленивый виджет:

```tsx
// widgets/analytics-panel/ui/AnalyticsPanel.lazy.tsx

import React from 'react'
import { withSuspense } from '@/shared/lib/withSuspense'
import { WidgetLoader } from '@/shared/ui/WidgetLoader'

// Ленивая загрузка реализации виджета
const AnalyticsPanelLazy = React.lazy(() => import('./AnalyticsPanel'))

// Объявляем публичный ленивый компонент
export const AnalyticsPanelAsync = withSuspense(
  AnalyticsPanelLazy,
  WidgetLoader,
)
```

Теперь в `index.ts`:

```ts
// widgets/analytics-panel/index.ts

export { AnalyticsPanelAsync as AnalyticsPanel } from './ui/AnalyticsPanel.lazy'
```

И использование в странице:

```tsx
// pages/dashboard/ui/DashboardPage.tsx

import { useState } from 'react'
import { AnalyticsPanel } from '@/widgets/analytics-panel'

export const DashboardPage = () => {
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsAnalyticsVisible((prev) => !prev)}
      >
        Показать аналитику
      </button>

      {isAnalyticsVisible && (
        // Виджет загрузится только при первом отображении
        <AnalyticsPanel />
      )}
    </div>
  )
}
```

Здесь вы видите пример **on-demand** загрузки: пока пользователь не нажал кнопку, чанк с аналитикой не загружается.

---

## Code splitting для фич (`features`)

### Пример фичи, которую стоит грузить лениво

Представим фичу, связанную с оплатой:

```txt
src/
  features/
    payment/
      ui/
        PaymentForm.tsx
        PaymentForm.lazy.tsx
      model/
        ...
      index.ts
```

Форму оплаты (`PaymentForm`) вы показываете редко, например только на шаге оформления заказа. Грузить её при первом рендере главной страницы нет смысла.

Теперь давайте посмотрим, как это реализовать.

```tsx
// features/payment/ui/PaymentForm.lazy.tsx

import React from 'react'
import { withSuspense } from '@/shared/lib/withSuspense'
import { FeatureLoader } from '@/shared/ui/FeatureLoader'

// Ленивая загрузка формы оплаты
const PaymentFormLazy = React.lazy(() => import('./PaymentForm'))

// Экспортируем обёрнутую версию
export const PaymentFormAsync = withSuspense(
  PaymentFormLazy,
  FeatureLoader,
)
```

В `index.ts` фичи:

```ts
// features/payment/index.ts

export { PaymentFormAsync as PaymentForm } from './ui/PaymentForm.lazy'
```

Теперь вы увидите, как это выглядит в коде на странице заказа:

```tsx
// pages/checkout/ui/CheckoutPage.tsx

import { useState } from 'react'
import { PaymentForm } from '@/features/payment'

export const CheckoutPage = () => {
  const [isPaymentStarted, setIsPaymentStarted] = useState(false)

  return (
    <div>
      {/* Другие шаги оформления заказа... */}

      <button
        onClick={() => setIsPaymentStarted(true)}
      >
        Перейти к оплате
      </button>

      {isPaymentStarted && (
        // Фича оплаты загрузится только на этом шаге
        <PaymentForm />
      )}
    </div>
  )
}
```

Так вы уменьшаете объём кода, который загружается до того, как пользователь вообще решит платить.

### Важно соблюдать границы слоёв

При ленивой загрузке фич следите за тем, чтобы:

- фичи импортировались только из разрешённых слоёв (`pages`, `widgets`, иногда `processes`);
- shared-код оставался в `shared`, а не расползался по ленивым модулям.

Если вы начнёте импортировать `shared` из ленивой фичи и обратно, можно создать циклические зависимости и усложнить сборку. Лучше держать общие компоненты и хелперы в `shared` и подключать их симметрично.

---

## Работа с Suspense и fallback’ами в FSD

### Где хранить fallback-компоненты

Обычно выделяют отдельные компоненты-заглушки:

- `shared/ui/PageLoader` — для страниц;
- `shared/ui/WidgetLoader` — для виджетов;
- `shared/ui/FeatureLoader` — для фич.

Простой пример:

```tsx
// shared/ui/PageLoader.tsx

export const PageLoader = () => {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      {/* Здесь может быть спиннер или skeleton */}
      Загрузка страницы...
    </div>
  )
}
```

```tsx
// shared/ui/WidgetLoader.tsx

export const WidgetLoader = () => {
  return (
    <div style={{ minHeight: '100px' }}>
      {/* Здесь можно показать placeholder под виджет */}
      Загрузка виджета...
    </div>
  )
}
```

```tsx
// shared/ui/FeatureLoader.tsx

export const FeatureLoader = () => {
  return (
    <div>
      {/* Небольшая заглушка для локальной части интерфейса */}
      Загрузка функционала...
    </div>
  )
}
```

Такой подход хорошо вписывается в FSD: лоадеры — это shared UI.

### Глобальный Suspense на уровне приложения

Иногда удобно иметь общий fallback на случай, если какая-то часть дерева React ещё не загрузилась. Например, на уровне `app`:

```tsx
// app/App.tsx

import { Suspense } from 'react'
import { AppRouter } from './providers/router'
import { PageLoader } from '@/shared/ui/PageLoader'

export const App = () => {
  return (
    // Глобальный Suspense на всё приложение
    <Suspense fallback={<PageLoader />}>
      <AppRouter />
    </Suspense>
  )
}
```

Даже если вы используете HOC `withSuspense`, глобальный `Suspense` обеспечивает резервную защиту: например, если кто-то забудет обёртку.

---

## Как code splitting влияет на FSD-границы

### Что именно разделяет code splitting

Важно понимать: code splitting **меняет только способ доставки кода в браузер**, а не архитектуру самого приложения.

- FSD задаёт **логические и архитектурные границы**: кто кого может импортировать.
- Code splitting задаёт **границы загрузки**: когда именно этот код попадёт в браузер.

Грамотный подход: сначала навести порядок по FSD, а уже потом поверх него накладывать ленивые загрузки.

### Типичные ошибки и как их избежать

#### Ошибка 1. Ленивая загрузка ломает типы и автодополнение

Иногда разработчики пытаются скрыть ленивую реализацию за фабриками, теряя явный компонент:

```ts
// Антипаттерн - слишком усложнённая фабрика

// Вместо прямого экспорта компонента
export const createProfilePage = async () => {
  const module = await import('./ui/ProfilePage')
  return module.ProfilePage
}
```

Такой код хуже типизируется и неудобно использовать.

Лучше:

- использовать `React.lazy` и HOC;
- сохранять публичный компонент в `index.ts`.

#### Ошибка 2. Смешение динамических импортов разных уровней

Например, когда страница динамически импортирует фичу, а фича — страницу или виджет, которые уже загружаются отдельно.

Это может привести к:

- непредсказуемому разбиению чанков;
- увеличению веса отдельных чанков;
- циклам импорта.

Рекомендация: держать дерево импорта в FSD **направленным сверху вниз**:

- `app` → `processes` → `pages` → `widgets` → `features` → `entities` → `shared`;
- ленивые компоненты тоже должны следовать этому направлению.

#### Ошибка 3. Случайный дублирующий импорт shared-кода

Если вы импортируете один и тот же модуль `shared` разными путями (например, с разными alias или относительными путями), сборщик может создать дубликаты в чанках.

Решение:

- используйте единые alias (например, `@/shared/...`);
- избегайте микса относительных путей и алиасов к одним и тем же файлам.

---

## Стратегии выбора границ для чанков

### По страницам — базовый уровень

Это минимум, который стоит настроить в любом FSD-проекте:

- каждая страница (`pages`) — отдельный чанк;
- роутер использует ленивые варианты страниц.

Плюсы:

- простая настройка;
- предсказуемый результат;
- почти всегда даёт хороший выигрыш по initial bundle.

### По крупным фичам и виджетам — продвинутый уровень

Следующий шаг — выносить в отдельные чанки:

- тяжёлые виджеты (таблицы, графики, карты);
- фичи, которые доступны только на определённых шагах (регистрация, оплата, расширенная фильтрация).

Главное правило: **не дробить слишком мелко**. Если вы сделаете отдельный чанк для каждой маленькой кнопки, перегрузите браузер количеством запросов.

### Пример комбинированной стратегии

Представим SPA с такими страницами:

- `/` — `MainPage` (главная);
- `/profile` — `ProfilePage` (профиль);
- `/analytics` — `AnalyticsPage` (аналитика, тяжелая).

Можно сделать так:

- страница `/analytics` — отдельный чанк;
- внутри `AnalyticsPage` виджет `AnalyticsPanel` тоже грузится лениво;
- фильтры отчётов (`ReportFiltersFeature`) грузятся по клику «Расширенный фильтр».

Это даёт трёхуровневое разделение:

1. Пользователь сначала загружает только MainPage.
2. Если он идёт в аналитику, подгружается страница с базовым UI.
3. Если он включает расширенные фильтры и диаграммы, грузятся соответствующие фичи и виджеты.

---

## Code splitting и серверный рендеринг (SSR) в FSD

Если вы используете SSR (например, Next.js или кастомное решение), стоит учесть несколько моментов.

### Проблема: SSR и React.lazy

React.lazy и Suspense работают в SSR не так просто, как в CSR-приложениях:

- по умолчанию React.lazy не рендерится на сервере до загрузки модуля;
- нужна интеграция со сборщиком, чтобы знать, какие чанки подключать на сервере и клиенте.

### Подходы к решению

1. Использовать фреймворк с уже встроенной поддержкой (Next.js, Remix).  
   Там code splitting на уровне роутов и компонентов уже реализован.

2. Для кастомного SSR:
   - использовать библиотеки наподобие `@loadable/component`;
   - они дают возможность собирать манифест чанков и подключать их на сервере.

В контексте FSD:

- архитектура слоёв остаётся прежней;
- меняется только способ, как вы описываете ленивые компоненты (через `loadable` вместо `React.lazy`).

Пример (упрощённый) с `@loadable/component`:

```tsx
// pages/profile/ui/ProfilePage.loadable.tsx

import loadable from '@loadable/component'
import { PageLoader } from '@/shared/ui/PageLoader'

// Создаем loadable-компонент с фолбеком
export const ProfilePageAsync = loadable(
  () => import('./ProfilePage'),
  {
    fallback: <PageLoader />,
  },
)
```

Дальше FSD-структура не меняется: экспорт из `index.ts` и использование в роутере остаются такими же.

---

## Практические советы по внедрению code splitting в существующий FSD-проект

### 1. Начните с роутов

- Выберите страницу, которая загружается реже других (например, раздел настроек или админка).
- Переведите её на ленивую загрузку через `React.lazy`.
- Проверьте в devtools, что появился отдельный чанк.

Это безопасный шаг, который редко ломает логику.

### 2. Выделите самые тяжелые части приложения

Смотрите в отчёты бандла (например, `webpack-bundle-analyzer` или `rollup-plugin-visualizer`):

- найдите модули, которые занимают больше всего места;
- проверьте, можно ли привязать их к отдельной фиче или виджету;
- решите, не обязаны ли они быть в initial bundle.

Часто это:

- графические библиотеки (charts, maps);
- rich-text-редакторы;
- большие таблицы и гриды;
- библиотеки для работы с файлами (PDF, Excel).

### 3. Продумайте fallback’и

Чтобы UX не страдал:

- страницы — показывайте skeleton или общий лоадер;
- виджеты — показывайте пустой placeholder с индикатором;
- фичи — используйте компактную заглушку, чтобы не нарушать вёрстку.

### 4. Следите за дублированием зависимостей

После внедрения code splitting обязательно проверьте:

- не размножились ли общие библиотеки по разным чанкам;
- не попадают ли тяжёлые зависимости в initial bundle без необходимости.

Если видите дублирование:

- вынесите общие вещи в `shared`;
- убедитесь, что все потребители используют один и тот же путь импорта.

### 5. Не забывайте о кешировании

Code splitting хорошо сочетается с кешированием:

- редко меняющиеся чанки можно агрессивно кешировать;
- при каждом деплое лучше использовать хеши в именах файлов (сборщик обычно делает это сам);
- главная задача — сделать initial bundle минимальным, чтобы первое посещение было быстрым.

---

## Заключение

Code splitting в FSD — это не отдельная технология, а логичное продолжение архитектуры, которая уже разделяет код на слои и фичи. Когда вы внедряете ленивые загрузки:

- границы слоёв (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) остаются прежними;
- вы просто решаете, **когда** и **какой** фрагмент кода попадёт в браузер;
- роуты и страницы — естественные точки разделения;
- тяжёлые виджеты и фичи можно подгружать только в момент использования.

Давайте ещё раз зафиксируем ключевые принципы:

- начинайте с ленивых страниц в роутере — это даёт быстрый результат с минимальными рисками;
- используйте HOC или общие хелперы для Suspense, чтобы не дублировать подозрительный код;
- не дробите приложение слишком мелко — выбирайте чанки по функциональным границам (страницы, крупные виджеты, фичи);
- следите за зависимостями и alias, чтобы не раздувать чанки и не дублировать shared-код;
- при SSR используйте инструменты, которые умеют работать с чанками и манифестами.

Если вы уже используете FSD, то большая часть работы по архитектурному разделению у вас сделана. Осталось лишь аккуратно наслоить на неё грамотный code splitting.

---

## Частозадаваемые технические вопросы

### 1. Как сделать, чтобы одна фича попадала в отдельный чанк, а другая нет

Вы можете экспортировать из `index.ts` фичи как ленивый, так и обычный вариант:

```ts
// features/payment/index.ts
export { PaymentFormAsync as PaymentForm } from './ui/PaymentForm.lazy'
export { PaymentForm } from './ui/PaymentForm'
```

В местах, где важна скорость (например, критичный сценарий), используйте обычный `PaymentForm`. В менее критичных — ленивый. Сборщик сам создаст отдельный чанк только для ленивой версии.

---

### 2. Как задать человеку читаемые имена чанков

В webpack можно использовать «magic comments»:

```ts
const ProfilePageLazy = React.lazy(
  () => import(/* webpackChunkName: "page-profile" */ './ProfilePage'),
)
```

Так вы получите файл `page-profile.xxxxx.js`. Для Vite/Rollup обычно достаточно структуры файлов и настроек output, но при необходимости можно использовать плагины и маппинг.

---

### 3. Что делать с общими типами и интерфейсами при code splitting

Типы (`.d.ts`, `.ts` без использования в runtime) не попадают в бандл, они нужны только TypeScript. Вынесите такие определения в `shared/types` и импортируйте оттуда. Code splitting их не затрагивает, но единое место хранения облегчает поддержку.

---

### 4. Как избежать "мигания" контента при ленивой загрузке виджетов

Сделайте fallback того же размера, что и конечный виджет. Например:

```tsx
// shared/ui/WidgetSkeleton.tsx
export const WidgetSkeleton = () => (
  <div style={{ height: 200, background: '#f0f0f0' }} />
)
```

И используйте его как `fallback` для ленивого виджета. Тогда при загрузке layout не будет прыгать.

---

### 5. Можно ли лениво загружать только часть логики фичи (например, сложный редьюсер)

Да, но это сложнее. Обычно используют динамическое подключение редьюсеров (redux-injectors и похожие решения). В FSD-сценарии это делается так:

- UI-фича грузится лениво;
- внутри неё при монтировании динамически регистрируется редьюсер или slice;
- при размонтировании редьюсер можно удалить. Это продвинутая оптимизация, которую стоит внедрять, только если у вас действительно большая и тяжёлая модель состояния.