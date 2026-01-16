---
metaTitle: Слой pages в фронтенд архитектуре - как устроен pages-layer
metaDescription: Подробное объяснение того как работает слой pages в современной фронтенд архитектуре - паттерны организации страниц маршрутизация и связь с domain и ui
author: Олег Марков
title: Слой pages - архитектура страниц в фронтенд приложении
preview: Разберем слой pages в архитектуре фронтенда - за что он отвечает как связывает маршруты бизнес логику и UI и как правильно его проектировать на практике
---

## Введение

Слой pages (pages-layer) — это уровень фронтенд‑архитектуры, который отвечает за страницы приложения как за конечные точки пользовательских сценариев. Можно сказать, что именно здесь пользователь «взаимодействует» с вашим продуктом: логика маршрутов, сборка нескольких виджетов и фич в единую страницу, подключение данных, состояния и ограничений.

Смотрите, я покажу вам, как удобно рассматривать слой pages как «композиционный» слой над остальными:  
ниже находятся domain, entities, features, widgets, а выше — уже конкретные маршруты и страницы, которыми оперирует роутер (например, React Router, Next.js routing или собственное решение).

В этой статье вы разберетесь:

- какую роль выполняет слой pages;
- какую ответственность на него стоит возлагать, а какую — нет;
- как организовывать файлы, маршруты и код;
- как связать pages с другими слоями архитектуры;
- как реализовать типичные сценарии: публичные/закрытые страницы, загрузка данных, обработка ошибок.

Я буду опираться на типичную модульную архитектуру фронтенда (часто её связывают с подходом Feature Sliced Design), но принципы применимы и в других архитектурах.

---

## Что такое слой pages и зачем он нужен

### Концепция pages-layer

Слой pages — это уровень, на котором вы описываете:

- **маршруты приложения** (адреса URL и соответствующие им компоненты);
- **композицию страницы** из готовых частей: widgets, features, entities;
- **инициализацию страницы**: получение данных, запуск запросов, подключение хранилищ состояния;
- **страничные ограничения**: проверки доступа, редиректы, выбор нужной конфигурации.

Важно: слой pages **не должен** содержать бизнес‑логику в «чистом» виде. Здесь вы связываете уже реализованные части, а не придумываете правила домена заново.

Если проводить аналогию с backend, слой pages часто похож на слой контроллеров: это «входные точки», которые вызывают нужные сервисы, собирают данные и выдают результат.

### Основные задачи слоя pages

Перечислю ключевые задачи, которые обычно отдают слою pages:

1. **Определение страниц и маршрутов**  
   - какая страница отображается по какому URL;  
   - какие параметры используются (id, slug и т.п.).

2. **Композиция интерфейса страницы**  
   - какие виджеты и фичи присутствуют на странице;  
   - в каком порядке и с какими пропсами они монтируются.

3. **Права доступа и ограничения**  
   - проверка, может ли пользователь открыть страницу;  
   - редиректы на страницу логина, 403, 404 и т.д.

4. **Стратегия загрузки данных**  
   - какие данные нужно получить до рендера;  
   - что подгружается отложенно;  
   - как обрабатывать загрузку и ошибки на уровне страницы.

5. **Интеграция с внешним окружением**  
   - SEO‑метаданные (title, description);  
   - работа с layout‑ами, модальными роутами.

---

## Место слоя pages в общей архитектуре

### Слоистая модель

Чаще всего слой pages располагают на **верхнем уровне** фронтенд‑архитектуры:

- app (инициализация приложения, провайдеры, корневой роутинг);
- processes (длинные бизнес‑процессы, если используются);
- pages (конкретные страницы);
- widgets (самодостаточные части интерфейса, состоящие из фич и сущностей);
- features (законченные пользовательские действия и сценарии);
- entities (базовые сущности: User, Product, Article и т.п.);
- shared (переиспользуемые утилиты, UI‑компоненты, библиотеки).

Слой pages «знает» о слоях ниже (widgets, features, entities, shared), но не наоборот. Это помогает держать зависимостную структуру под контролем.

### Почему нельзя складывать все в pages

Иногда разработчики пытаются «ускориться» и начинают писать всю логику сразу в компоненте страницы. В итоге получается:

- огромный компонент;
- бизнес‑логика вперемешку с вёрсткой;
- невозможность переиспользовать функции в других страницах;
- сложная навигация по коду.

Слой pages должен оставаться **тонким**: он оркестрирует, а не реализует. Здесь удобно:

- вызывать уже готовые хуки и функции (из features, entities, shared);
- композировать виджеты;
- описывать high-level поведение страницы (что с чем соединить).

---

## Организация структуры файлов слоя pages

### Базовый пример структуры

Давайте разберём пример структуры приложения с несколькими страницами:

- app  
  - providers  
  - routing  
- pages  
  - home  
    - ui  
      - HomePage.tsx  
    - index.ts  
  - profile  
    - ui  
      - ProfilePage.tsx  
    - index.ts  
  - article  
    - ui  
      - ArticlePage.tsx  
    - index.ts  
- widgets  
  - Header  
  - Sidebar  
  - ArticleList  
- features  
  - auth  
  - articleFilters  
- entities  
  - user  
  - article  
- shared  
  - ui  
  - lib  
  - api  

Внутри каждой страницы создаётся «слайс» с понятной структурой:

- ui — компоненты страницы (обычно один основной компонент, но может быть несколько вариаций);
- иногда добавляют:
  - model — страничные состояния, специфичные только для этой страницы;
  - lib — специфичные хелперы для страницы;
  - config — константы страницы.

### Пример index файла страницы

Часто для удобства делают точку входа index.ts, чтобы снаружи импортировать страницу одной строкой.

Пример:

```ts
// pages/profile/index.ts

// Здесь мы реэкспортируем компонент страницы,
// чтобы при импорте не указывать лишние внутренние пути
export { ProfilePage } from "./ui/ProfilePage";
```

Теперь вы можете использовать страницу так:

```ts
// app/routing/routes.tsx

// Здесь мы импортируем страницу целиком как модуль
import { ProfilePage } from "@/pages/profile";

// Дальше используем ProfilePage в декларации маршрутов
```

Это повышает читабельность и упрощает рефакторинг: если вы смените структуру файлов внутри pages/profile, внешним импортам ничего менять не придётся.

---

## Связь слоя pages с маршрутизацией

### Где хранить декларацию маршрутов

Есть два распространённых подхода:

1. **Маршруты описаны в слое app**, а pages лишь экспортирует компоненты.
2. **Каждая страница сама описывает часть маршрута**, а слой app их объединяет.

На практике первый вариант проще для начала, поэтому давайте рассмотрим именно его.

Пример декларации маршрутов:

```tsx
// app/routing/routes.tsx

// Здесь мы импортируем компоненты страниц
import { HomePage } from "@/pages/home";
import { ProfilePage } from "@/pages/profile";
import { ArticlePage } from "@/pages/article";

// Далее определяем структуру маршрутов
export const routes = [
  {
    path: "/",
    element: <HomePage />, // Главная страница
  },
  {
    path: "/profile",
    element: <ProfilePage />, // Профиль пользователя
  },
  {
    path: "/article/:id",
    element: <ArticlePage />, // Страница статьи с параметром id
  },
];
```

Дальше этот список маршрутов подключается в корневой компонент:

```tsx
// app/routing/Router.tsx

import { useRoutes } from "react-router-dom";
import { routes } from "./routes";

// Компонент Router инкапсулирует создание роутера
export function Router() {
  // Здесь useRoutes создает дерево роутов по нашему описанию
  const element = useRoutes(routes);
  return element;
}
```

### Когда выносить логику роутинга в сами страницы

Иногда удобнее, чтобы страница сама отвечала за то, как парсить параметры URL, какую логику применять при отсутствии данных и т.п. Тогда можно сделать так:

- app/routing знает только, какой компонент отрендерить;
- сама страница получает параметры маршрута и решает, что делать.

Давайте посмотрим, как это может выглядеть.

```tsx
// pages/article/ui/ArticlePage.tsx

import { useParams } from "react-router-dom";
import { ArticleDetails } from "@/widgets/ArticleDetails";
import { ArticleComments } from "@/widgets/ArticleComments";

// Компонент страницы статьи
export function ArticlePage() {
  // Здесь мы извлекаем параметр id из URL
  const { id } = useParams<{ id: string }>();

  // Если параметра нет, мы можем отрендерить заглушку или страницу 404
  if (!id) {
    return <div>Статья не найдена</div>;
  }

  return (
    <div>
      {/* Компонент с подробностями статьи */}
      <ArticleDetails articleId={id} />

      {/* Компонент с комментариями к статье */}
      <ArticleComments articleId={id} />
    </div>
  );
}
```

Слой pages здесь:

- получает параметры маршрута;
- подготавливает пропсы для виджетов (articleId);
- решает, что делать при отсутствии обязательных параметров.

---

## Ответственность слоя pages: что внутри, а что снаружи

### Что должно быть в pages

В pages хорошо размещать:

- **композицию**: сборка виджетов и фич в единую страницу;
- **обработку параметров URL**: useParams, useSearchParams, парсинг query;
- **обработку прав доступа** (если нет отдельного слоя processes);
- **инициализацию страничного состояния**, если оно не переиспользуется;
- **конфигурацию layout‑ов** (основная раскладка, хедер, сайдбар).

Давайте разберём пример страницы профиля пользователя:

```tsx
// pages/profile/ui/ProfilePage.tsx

import { ProfileHeader } from "@/widgets/ProfileHeader";
import { ProfileInfo } from "@/widgets/ProfileInfo";
import { UserArticles } from "@/widgets/UserArticles";
import { useAuthUser } from "@/entities/user";
import { Navigate } from "react-router-dom";

// Страница профиля текущего пользователя
export function ProfilePage() {
  // Здесь мы получаем текущего авторизованного пользователя
  const user = useAuthUser();

  // Если пользователь не авторизован - перенаправляем его на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      {/* Виджет заголовка профиля */}
      <ProfileHeader />

      {/* Виджет информации о пользователе */}
      <ProfileInfo userId={user.id} />

      {/* Виджет списка статей пользователя */}
      <UserArticles userId={user.id} />
    </div>
  );
}
```

Здесь страница:

- проверяет авторизацию;
- принимает решение о редиректе;
- собирает виджеты в единый экран.

При этом бизнес‑логика авторизации (как получить текущего пользователя, как обновить токен) живёт ниже — в entities/user или features/auth.

### Что не должно быть в pages

Важно не перегружать слой pages. Сюда **не стоит** помещать:

- сложные вычисления, не завязанные на конкретной странице;
- запросы к API «вручную» (без вынесения в слой entities/shared);
- специфические бизнес‑правила, которые могут понадобиться на других страницах;
- UI‑компоненты, которые вы хотите переиспользовать.

Если вы замечаете, что код в компоненте страницы:

- растянулся на сотни строк;
- содержит много логики без прямой связи с маршрутом;
- использует API напрямую,

это повод вынести часть логики в:

- widgets (если это композиция нескольких фич и сущностей);
- features (если это законченное действие пользователя);
- entities (если это логика сущности — User, Article и т.д.);
- shared (если это общий инструмент или утилита).

---

## Типовые паттерны реализации страниц

### Публичная страница

Публичная страница доступна без авторизации. Например, главная.

```tsx
// pages/home/ui/HomePage.tsx

import { HomeBanner } from "@/widgets/HomeBanner";
import { ArticleFeed } from "@/widgets/ArticleFeed";
import { PopularTags } from "@/widgets/PopularTags";

// Главная страница приложения
export function HomePage() {
  return (
    <div>
      {/* Баннер на главной */}
      <HomeBanner />

      {/* Список статей (виджет) */}
      <ArticleFeed />

      {/* Популярные теги (виджет) */}
      <PopularTags />
    </div>
  );
}
```

Здесь нет проверки доступа, но страница по‑прежнему:

- собирает виджеты;
- задаёт разметку основной области.

### Закрытая страница (требует авторизации)

Мы уже смотрели пример с профилем, но давайте разберём общий паттерн.

```tsx
// pages/settings/ui/SettingsPage.tsx

import { Navigate } from "react-router-dom";
import { useAuthUser } from "@/entities/user";
import { SettingsForm } from "@/widgets/SettingsForm";

// Страница настроек пользователя
export function SettingsPage() {
  const user = useAuthUser();

  // Если пользователь не авторизован, отправляем его на страницу логина
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <h1>Настройки</h1>

      {/* Форма настроек пользователя */}
      <SettingsForm user={user} />
    </div>
  );
}
```

Слой pages здесь:

- решает, что делать с неавторизованным пользователем;
- не реализует сам логику редактирования настроек (это ответственность widgets/features).

### Страница списка и страница детали

Очень часто встречается связка:

- ListPage — список сущностей;
- DetailsPage — детальная карточка одной сущности по id.

Давайте посмотрим, как это выглядит для статей.

#### Страница списка статей

```tsx
// pages/articles-list/ui/ArticlesListPage.tsx

import { ArticleList } from "@/widgets/ArticleList";
import { ArticleFilters } from "@/features/articleFilters";

// Страница со списком статей
export function ArticlesListPage() {
  return (
    <div>
      {/* Панель фильтров (фича изменения параметров списка) */}
      <ArticleFilters />

      {/* Список статей (виджет, использующий текущие фильтры) */}
      <ArticleList />
    </div>
  );
}
```

Комментарии:

- filters и список статей реализованы ниже по слоям;
- страница отвечает за их совместное размещение.

#### Страница детали статьи

```tsx
// pages/article/ui/ArticlePage.tsx

import { useParams } from "react-router-dom";
import { ArticleDetails } from "@/widgets/ArticleDetails";
import { ArticleComments } from "@/widgets/ArticleComments";

// Страница конкретной статьи
export function ArticlePage() {
  const { id } = useParams<{ id: string }>();

  // Если параметр id отсутствует, показываем сообщение
  if (!id) {
    return <div>Статья не найдена</div>;
  }

  return (
    <div>
      {/* Виджет с деталями статьи */}
      <ArticleDetails articleId={id} />

      {/* Виджет с комментариями */}
      <ArticleComments articleId={id} />
    </div>
  );
}
```

Страница:

- получает id из URL;
- передаёт его виджетам;
- не реализует загрузку статьи и комментариев напрямую.

---

## Локальное состояние и сторы на уровне страницы

### Когда странице нужно собственное состояние

Иногда возникают сценарии, когда состояние **уникально для одной страницы** и вряд ли пригодится в других местах. Тогда можно:

- хранить это состояние прямо в компоненте страницы (через useState, useReducer);
- или вынести в модель страницы (pages/xxx/model).

Пример: страница с мастером (wizard) из нескольких шагов, где шаги специфичны только для этой страницы.

```tsx
// pages/payment/ui/PaymentPage.tsx

import { useState } from "react";
import { PaymentMethodStep } from "@/widgets/PaymentMethodStep";
import { PaymentDetailsStep } from "@/widgets/PaymentDetailsStep";
import { PaymentConfirmStep } from "@/widgets/PaymentConfirmStep";

type Step = "method" | "details" | "confirm";

// Страница оплаты (мастер из нескольких шагов)
export function PaymentPage() {
  // Здесь мы храним текущий шаг мастера
  const [step, setStep] = useState<Step>("method");

  // Функция для перехода на следующий шаг
  const goToNext = (nextStep: Step) => setStep(nextStep);

  return (
    <div>
      {step === "method" && (
        <PaymentMethodStep onNext={() => goToNext("details")} />
      )}

      {step === "details" && (
        <PaymentDetailsStep onNext={() => goToNext("confirm")} />
      )}

      {step === "confirm" && <PaymentConfirmStep />}
    </div>
  );
}
```

Здесь страница управляет:

- текущим шагом;
- переходами между шагами.

При этом каждый шаг реализован как отдельный виджет.

### Когда лучше вынести модель из страницы

Если:

- ту же последовательность шагов вы хотите использовать в другом месте;
- или логика шагов слишком сложная, с большим количеством проверок;

то модель можно вынести, например, в:

- widgets/PaymentWizard/model — если это виджет‑мастер;
- features/paymentWizard/model — если это фича.

Страница тогда станет ещё тоньше, просто размещая виджет‑мастер:

```tsx
// pages/payment/ui/PaymentPage.tsx

import { PaymentWizard } from "@/widgets/PaymentWizard";

// Страница оплаты с вынесенным мастером
export function PaymentPage() {
  return (
    <div>
      <PaymentWizard />
    </div>
  );
}
```

---

## Загрузка данных и обработка ошибок на уровне страницы

### Вариант 1 — загрузка внутри виджетов

Самый простой вариант: пусть виджеты сами запрашивают данные. Тогда страницы почти не думают о загрузке и ошибках.

Плюсы:

- страницы остаются очень простыми;
- меньше кода в pages.

Минусы:

- сложнее реализовывать сложные сценарии: например, сначала загрузить A, потом на основе A загрузить B;
- меньше контроля над общими состояниями (общий лоадер для страницы, общий error boundary).

Пример:

```tsx
// pages/dashboard/ui/DashboardPage.tsx

import { UserStats } from "@/widgets/UserStats";
import { RecentActivity } from "@/widgets/RecentActivity";

// Страница с дашбордом
export function DashboardPage() {
  return (
    <div>
      {/* Виджет статистики пользователя сам загружает свои данные */}
      <UserStats />

      {/* Виджет последней активности также сам делает запрос */}
      <RecentActivity />
    </div>
  );
}
```

### Вариант 2 — координация загрузки в pages

Когда вам важно:

- синхронизировать несколько запросов;
- показывать общий лоадер;
- централизованно обрабатывать ошибку,

страница может вызывать хук‑загрузчик и отдавать виджетам уже подготовленные данные.

Давайте разберём пример.

```tsx
// pages/dashboard/ui/DashboardPage.tsx

import { useDashboardData } from "../model/useDashboardData";
import { DashboardView } from "@/widgets/DashboardView";

// Страница дашборда с координацией загрузки
export function DashboardPage() {
  // Здесь мы используем кастомный хук, который загружает все данные для дашборда
  const { data, isLoading, error } = useDashboardData();

  // Показ лоадера пока данные загружаются
  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  // Показ сообщения об ошибке, если что-то пошло не так
  if (error) {
    return <div>Ошибка при загрузке дашборда</div>;
  }

  // Если данных нет, также можно показать заглушку
  if (!data) {
    return <div>Нет данных для отображения</div>;
  }

  // Если всё в порядке, передаем данные виджету
  return <DashboardView data={data} />;
}
```

Теперь страница:

- контролирует жизненный цикл загрузки;
- передаёт виджету уже «готовое» состояние.

А сам хук можно реализовать, опираясь на entities и features.

```ts
// pages/dashboard/model/useDashboardData.ts

import { useUserStats } from "@/entities/user";
import { useRecentActivity } from "@/entities/activity";

// Кастомный хук, который агрегирует данные для дашборда
export function useDashboardData() {
  // Здесь мы вызываем два хука: каждый загружает свои данные
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useUserStats();

  const {
    data: activity,
    isLoading: isActivityLoading,
    error: activityError,
  } = useRecentActivity();

  // Объединяем флаги загрузки
  const isLoading = isStatsLoading || isActivityLoading;

  // Если есть любая ошибка, считаем что ошибка у страницы
  const error = statsError || activityError;

  // Объединяем данные в удобную структуру
  const data = stats && activity ? { stats, activity } : null;

  return { data, isLoading, error };
}
```

Обратите внимание, что:

- сам запрос к API не делается в pages;
- страницы только «шьют» несколько источников данных вместе.

---

## Layout‑ы и композиция общих частей

### Центральный layout в app

Обычно в слое app делают общий layout, который одинаков для большинства страниц: хедер, сайдбар, футер.

```tsx
// app/layouts/MainLayout.tsx

import { Header } from "@/widgets/Header";
import { Sidebar } from "@/widgets/Sidebar";

type Props = {
  children: React.ReactNode;
};

// Главный layout приложения
export function MainLayout({ children }: Props) {
  return (
    <div className="app-layout">
      {/* Общий хедер */}
      <Header />

      <div className="app-body">
        {/* Общий сайдбар */}
        <Sidebar />

        {/* Область контента, в которую рендерятся страницы */}
        <main>{children}</main>
      </div>
    </div>
  );
}
```

Тогда Router оборачивает страницы в MainLayout.

```tsx
// app/App.tsx

import { BrowserRouter } from "react-router-dom";
import { Router } from "./routing/Router";
import { MainLayout } from "./layouts/MainLayout";

// Корневой компонент приложения
export function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        {/* Здесь рендерятся все страницы в зависимости от маршрута */}
        <Router />
      </MainLayout>
    </BrowserRouter>
  );
}
```

### Специальный layout для отдельных страниц

Иногда нужно использовать другой layout для части маршрутов (например, страница логина без хедера и сайдбара).

Тогда можно:

- сделать второй layout (AuthLayout);
- использовать его только для определённых маршрутов.

```tsx
// app/layouts/AuthLayout.tsx

type Props = {
  children: React.ReactNode;
};

// Layout для страниц аутентификации
export function AuthLayout({ children }: Props) {
  return (
    <div className="auth-layout">
      {/* Здесь можно разместить лого, фон, информацию о продукте */}
      <div className="auth-content">{children}</div>
    </div>
  );
}
```

Маршруты можно разделить на группы:

```tsx
// app/routing/routes.tsx

import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";

export const routes = [
  {
    path: "/login",
    element: (
      <AuthLayout>
        {/* Страница логина рендерится в специальном layout */}
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/",
    element: (
      <MainLayout>
        {/* Главная страница в основном layout */}
        <HomePage />
      </MainLayout>
    ),
  },
  // Здесь можно добавить остальные маршруты, обернув их в MainLayout
];
```

Слой pages в этом случае по‑прежнему не знает о layout‑ах — это остаётся в app. Но вы можете и наоборот: часть логики по выбору layout можно положить в pages, если это удобнее для вашего проекта.

---

## Практические рекомендации по проектированию pages-layer

### Держите страницы «тонкими»

Хороший индикатор: компонент страницы редко должен превышать 150–200 строк. Если он разрастается:

- вынесите локальное состояние в кастомные хуки в той же папке;
- вынесите составные части в widgets;
- вынесите повторяющиеся сценарии в features.

Давайте посмотрим, как можно постепенно «очищать» страницу.

Было:

```tsx
// pages/profile/ui/ProfilePage.tsx

// Здесь много кода: запросы, валидация, форма, модалки, уведомления
// Все это смешано в одном компоненте
export function ProfilePage() {
  // Очень много логики...
}
```

Становится:

```tsx
// pages/profile/ui/ProfilePage.tsx

import { ProfileView } from "@/widgets/ProfileView";
import { useProfilePage } from "../model/useProfilePage";

// Упрощенная страница профиля
export function ProfilePage() {
  // Здесь мы вызываем кастомный хук для инициализации
  const { user, isLoading, error } = useProfilePage();

  // Примитивная обработка состояний на уровне страницы
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка загрузки профиля</div>;
  if (!user) return <div>Пользователь не найден</div>;

  // Основное отображение профиля
  return <ProfileView user={user} />;
}
```

Теперь:

- сложная логика находится в useProfilePage и ProfileView;
- страницу легко читать и поддерживать.

### Используйте единый стиль именования

Чтобы проще было ориентироваться:

- Страницы называйте с суффиксом Page: HomePage, ProfilePage, ArticlePage.
- Папку с модулем страницы именуйте по назначению: home, profile, article.
- Внутри модуля страницы используйте ui, model, lib по необходимости.

Так вы легко узнаете, что именно относится к слою pages.

### Не бойтесь добавлять model в pages

Иногда разработчики считают, что model допустима только в features или entities. На практике модель страницы — нормальный инструмент, если:

- состояние и логика относятся только к данной странице;
- нет смысла переиспользовать это состояние в других местах.

Вы можете создать:

- pages/xxx/model/useXxxPage.ts — единый хук инициализации;
- pages/xxx/model/types.ts — типы, используемые только на этой странице.

---

Структура слоя pages позволяет сделать архитектуру фронтенда предсказуемой и удобной: вы точно знаете, где искать определение страницы, как она собирается, какие маршруты есть в приложении и как они связаны с UI и бизнес‑логикой.

Если вы будете придерживаться принципа «тонких страниц» и держать в pages только композиционную логику, то:

- проект легче масштабировать;
- новому разработчику проще понять устройство приложения;
- рефакторинг отдельных частей проходит без касания всех страниц.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как организовать динамические страницы (например, /article/:id/edit) в pages-layer

Создайте отдельный модуль страницы, например pages/article-edit, и используйте useParams внутри:

```tsx
// pages/article-edit/ui/ArticleEditPage.tsx

import { useParams } from "react-router-dom";
import { ArticleEditForm } from "@/widgets/ArticleEditForm";

export function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>Статья не найдена</div>;

  return <ArticleEditForm articleId={id} />;
}
```

Маршрут настраивается в app/routing: path "/article/:id/edit" → ArticleEditPage.

---

### Как лучше обрабатывать 404 на уровне pages

Сделайте отдельную страницу NotFoundPage в pages/not-found и добавьте маршрут с path "*" в роутинг:

```tsx
// pages/not-found/ui/NotFoundPage.tsx

export function NotFoundPage() {
  return <div>Страница не найдена</div>;
}
```

```tsx
// app/routing/routes.tsx

import { NotFoundPage } from "@/pages/not-found";

export const routes = [
  // ...другие маршруты
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
```

---

### Как реализовать ленивую загрузку страниц в pages-layer

В index страницы используйте React.lazy и Suspense:

```tsx
// pages/profile/index.ts

import { lazy } from "react";

export const ProfilePageLazy = lazy(() => import("./ui/ProfilePage"));
```

В роутинге:

```tsx
// app/routing/routes.tsx

import { Suspense } from "react";
import { ProfilePageLazy } from "@/pages/profile";

{
  path: "/profile",
  element: (
    <Suspense fallback={<div>Загрузка страницы...</div>}>
      <ProfilePageLazy />
    </Suspense>
  ),
}
```

---

### Как передавать данные между двумя страницами без глобального стора

Используйте либо параметры URL, либо state навигации:

```tsx
// Переход со страницы A на B с передачей state
navigate("/page-b", { state: { from: "page-a" } });

// В странице B читаем state
const location = useLocation();
const from = (location.state as { from?: string })?.from;
```

Если данных много или они нужны в разных местах, лучше вынести их в entities или общий стор.

---

### Как протестировать страницу из слоя pages

1. Используйте React Testing Library.  
2. Оборачивайте тестируемую страницу в MemoryRouter и нужные провайдеры.  

Пример:

```tsx
// pages/profile/ui/ProfilePage.test.tsx

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";

test("рендерит профиль", () => {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
  // Дальше проверяете нужные элементы на странице
});
```

Так вы проверяете поведение страницы как целостного экрана, не вдаваясь в детали реализации нижележащих слоёв.