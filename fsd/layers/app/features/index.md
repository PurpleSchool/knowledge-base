---
metaTitle: Слой features в архитектуре фронтенда - как организовать функциональные фичи проекта
metaDescription: Разбор слоя features в архитектуре feature sliced design - как выделять фичи описывать границы ответственности и не допускать утечек бизнес логики
author: Олег Марков
title: Слой features в архитектуре фронтенда - практическое руководство
preview: Подробно разбираем слой features в архитектуре feature sliced design - как проектировать фичи декомпозировать бизнес поведение и выстраивать границы между слоями
---

## Введение

Слой features (features-layer) в современной фронтенд‑архитектуре — это уровень, где сосредоточено прикладное поведение приложения, то есть конкретные возможности, которые получает пользователь: оформить заказ, добавить товар в корзину, сменить язык интерфейса, авторизоваться, подписаться на рассылку.

Здесь вы работаете не с абстрактными сущностями вроде пользователя или заказа, а с завершенными сценариями использования. Именно на слое features эти сценарии соединяют доменную логику из слоя entities с пользовательским интерфейсом из слоев widgets и pages.

В статье я покажу, как:

- понимать роль слоя features в общем срезе архитектуры
- правильно выделять фичи и их границы
- организовывать структуру файлов и модулей
- строить публичные API фич
- подключать фичи в интерфейс без нарушения зависимостей
- избегать популярных ошибок и «утечек» ответственности

И все это — с ориентиром на Feature-Sliced Design (FSD), но подход будет полезен и вне строгого следования FSD.

---

## Место слоя features в архитектуре

### Связь с другими слоями

Давайте сначала зафиксируем, в каком окружении живет слой features. В типовой архитектуре по FSD у вас есть:

- app — инициализация приложения, провайдеры, роутинг
- processes — долгоживущие бизнес-процессы
- pages — конкретные страницы
- widgets — композиции блоков интерфейса
- features — пользовательские фичи (то, что пользователь «умеет делать»)
- entities — доменные сущности (User, Product, Order)
- shared — общие утилиты, UI‑компоненты, библиотеки

Слой features находится над entities и под widgets/pages.

Это означает:

- features МОЖЕТ зависеть от:
  - shared
  - entities
- features НЕ ДОЛЖЕН зависеть от:
  - widgets
  - pages
  - app
  - processes

Смотрите, я покажу вам это в виде простой схемы зависимостей (стрелка означает «может импортировать»):

- shared ← entities ← features ← widgets ← pages ← app

Так вы предотвращаете циклические зависимости и сохраняете предсказуемость архитектуры: фича использует сущности, а не наоборот.

### Что такое фича по смыслу

Фича — это прикладная возможность, понятная бизнесу и пользователю. Примеры:

- auth/by-email — авторизация по email и паролю
- cart/add-item — добавление товара в корзину
- profile/edit — редактирование профиля пользователя
- article/like — лайк статьи
- notifications/subscribe — подписка на уведомления

Ключевые признаки фичи:

- имеет четкий бизнес-смысл
- отвечает за один завершенный сценарий
- может использовать одну или несколько сущностей (User, Product, Order)
- имеет собственное состояние и обработчики (если нужно)
- предоставляет понятный публичный API

---

## Основные принципы слоя features

### Принцип 1. Фича = сценарий использования

Важно не путать features и entities. entities описывает «что есть» (User, Product), а features — «что можно сделать» с этими сущностями.

Например:

- entities/user — данные и операции пользователя
- features/auth/by-email — сценарий входа в систему
- features/profile/edit — сценарий изменения профиля

Если вы ловите себя на мысли «это просто компонент UserCard», скорее всего, это не фича, а либо entity‑компонент, либо widget.

### Принцип 2. Фича не знает о страницах и виджетах

Фича должна быть переиспользуемой без привязки к конкретной странице. Она не должна знать, где именно ее отрисуют: в модалке, в боковой панели или в отдельной странице — это задача слоев выше.

Поэтому:

- в коде фичи не должно быть:
  - импортов из pages
  - импортов из widgets
  - логики роутинга на уровень страниц (переходы лучше делегировать наверх или использовать абстракции навигации в shared)

### Принцип 3. Публичный API и инкапсуляция

Каждая фича должна четко управлять тем, что она «выставляет наружу». Для этого обычно создают файл public API, например:

- index.ts
- public.ts
- api.ts (менее удачное имя, может путать с HTTP‑API)

Давайте разберемся на примере. Структура фичи:

- features
  - auth
    - by-email
      - model
        - effects.ts
        - selectors.ts
      - ui
        - form.tsx
      - lib
        - validation.ts
      - index.ts

Внутри index.ts вы явно экспортируете только то, что хотите предоставить другим слоям:

```ts
// features/auth/by-email/index.ts

// Экспортируем только публичный компонент формы авторизации
export { AuthByEmailForm } from "./ui/form";

// Экспортируем публичный тип пропсов, если он нужен снаружи
export type { AuthByEmailFormProps } from "./ui/form";

// Экспортируем публичный эффект, если хотим дать возможность вызывать авторизацию программно
export { authByEmailFx } from "./model/effects";
```

Теперь во внешнем коде используется только то, что вы явно разрешили:

```ts
// pages/login/ui/LoginPage.tsx

// Импортируем фичу через ее публичный API
import { AuthByEmailForm } from "features/auth/by-email";

export const LoginPage = () => {
  return (
    <main>
      <h1>Вход</h1>
      <AuthByEmailForm />  {/* Здесь фича встроена в страницу */}
    </main>
  );
};
```

Это помогает избежать ситуации, когда другие части приложения случайно начинают использовать внутренние детали фичи.

---

## Структура слоев и пространств имен в features

### Общий подход к структурированию

Чаще всего внутри слоя features используют следующую структуру:

- features
  - <domain>
    - <feature-name>
      - ui
      - model
      - lib
      - config (опционально)
      - api (опционально)
      - index.ts

Где:

- `<domain>` — область бизнеса (auth, cart, profile, article, order)
- `<feature-name>` — конкретная возможность (by-email, add-item, edit, like)

Пример:

- features
  - cart
    - add-item
    - remove-item
  - auth
    - by-email
    - by-phone

Смотрите, я покажу вам пример структуры для фичи добавления товара в корзину.

```txt
features/
  cart/
    add-item/
      ui/
        AddToCartButton.tsx
      model/
        events.ts
        store.ts
        effects.ts
      lib/
        analytics.ts
      index.ts
```

### Что хранить в ui, model, lib

- ui — визуальные компоненты фичи:
  - кнопки
  - формы
  - маленькие виджеты, относящиеся только к этой фиче
- model — состояние и бизнес-логика уровня фичи:
  - эффекты (запросы к API, сайд‑эффекты)
  - события и сторы (если вы используете state‑менеджер)
  - адаптация доменных сущностей под сценарий фичи
- lib — вспомогательные функции:
  - форматирование данных
  - преобразование DTO
  - небольшие хелперы

---

## Пример: фича добавления товара в корзину

Теперь вы увидите, как это выглядит в коде.

### Исходные данные

Предположим, у вас есть сущность Product и корзина Cart на уровне entities:

```ts
// entities/product/model/types.ts
export interface Product {
  id: string;
  title: string;
  price: number;
}

// entities/cart/model/store.ts
import { createEvent, createStore } from "effector";

export const addItem = createEvent<{ productId: string; quantity: number }>();

export const $cartItems = createStore<{ productId: string; quantity: number }[]>([])
  .on(addItem, (items, payload) => {
    // Здесь мы добавляем товар в корзину
    return [...items, payload];
  });
```

Теперь создадим фичу features/cart/add-item.

### Структура фичи

```txt
features/
  cart/
    add-item/
      ui/
        AddToCartButton.tsx
      model/
        index.ts
      index.ts
```

### Модель фичи

```ts
// features/cart/add-item/model/index.ts
import { createEvent, sample } from "effector";
import { addItem } from "entities/cart/model/store";

// Событие клика по кнопке "Добавить в корзину"
export const addToCartClicked = createEvent<{ productId: string }>();

// Здесь мы связываем клик с доменным событием добавления в корзину
sample({
  clock: addToCartClicked,          // Что слушаем - событие клика
  fn: ({ productId }) => ({
    productId,
    quantity: 1,                    // Для простоты всегда добавляем 1
  }),
  target: addItem,                  // Куда отправляем данные
});
```

Комментарии помогут вам увидеть, что фича фактически адаптирует доменную операцию под конкретный пользовательский сценарий.

### UI фичи

```tsx
// features/cart/add-item/ui/AddToCartButton.tsx
import React from "react";
import { addToCartClicked } from "../model";

// Пропсы компонента кнопки
interface AddToCartButtonProps {
  productId: string;         // Идентификатор товара
  children?: React.ReactNode; // Текст или содержимое кнопки
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = (props) => {
  const { productId, children = "Добавить в корзину" } = props;

  const handleClick = () => {
    // При клике отправляем событие фичи
    addToCartClicked({ productId });
  };

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
};
```

### Публичный API фичи

```ts
// features/cart/add-item/index.ts

// Экспортируем только компонент кнопки как публичный интерфейс фичи
export { AddToCartButton } from "./ui/AddToCartButton";

// Экспортируем тип пропсов для стороннего кода
export type { AddToCartButtonProps } from "./ui/AddToCartButton";
```

Теперь давайте посмотрим, как это используется в widgets или pages.

```tsx
// widgets/product-card/ui/ProductCard.tsx
import React from "react";
import { AddToCartButton } from "features/cart/add-item";
import type { Product } from "entities/product";

interface ProductCardProps {
  product: Product;  // Товар, который отображаем
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <article>
      <h2>{product.title}</h2>
      <p>{product.price} ₽</p>

      {/* Здесь мы встраиваем фичу в карточку товара */}
      <AddToCartButton productId={product.id} />
    </article>
  );
};
```

Как видите, фича «добавление в корзину» превращается в независимый блок поведения, который можно встроить куда угодно: в карточку товара, в список рекомендаций, на страницу деталей.

---

## Работа с состоянием на слое features

### Локальное против глобального состояния

На слое features обычно встречается два вида состояния:

1. Чисто локальное UI‑состояние
   - открыта ли модалка
   - текст в форме
   - выбранная вкладка

2. Прикладное состояние, связанное с несколькими слоями
   - состояние отправки формы
   - ошибки валидации
   - выбранные фильтры

Если состояние относится только к конкретному UI‑компоненту фичи, можно смело хранить его локально в компоненте.

Если состояние влияет на другие части приложения (например, выбранный способ сортировки товаров), лучше вынести его в model фичи или на уровень entities, если это общая настройка домена.

### Пример: фича лайка статьи

Покажу вам, как можно реализовать фичу лайка статьи с учетом состояния загрузки.

```ts
// features/article/like/model/index.ts
import { createEvent, createStore, sample } from "effector";
import { likeArticleFx } from "shared/api/article";

// Событие клика по кнопке "лайк"
export const likeClicked = createEvent<{ articleId: string }>();

// Храним идентификаторы статей, по которым сейчас идет запрос
export const $pendingLikes = createStore<Set<string>>(new Set())
  .on(likeArticleFx.pending, (set, isPending) => {
    // Здесь мы обновляем множество "в процессе лайка"
    const newSet = new Set(set);
    // Предположим, что эффект сам знает, для какой статьи идет запрос
    // и хранит идентификатор в параметрах
    return newSet;
  });

// Связываем клик с вызовом эффекта
sample({
  clock: likeClicked,        // Слушаем клики по кнопке
  target: likeArticleFx,     // Передаем событие в эффект
});
```

В UI:

```tsx
// features/article/like/ui/LikeButton.tsx
import React from "react";
import { likeClicked, $pendingLikes } from "../model";
import { useUnit } from "effector-react";

interface LikeButtonProps {
  articleId: string;
  isLiked: boolean; // Текущее состояние лайка статьи
}

export const LikeButton: React.FC<LikeButtonProps> = ({ articleId, isLiked }) => {
  const pendingLikes = useUnit($pendingLikes);

  const isPending = pendingLikes.has(articleId); // Статья сейчас лайкается

  const handleClick = () => {
    if (!isPending) {
      // Отправляем событие только если нет активного запроса
      likeClicked({ articleId });
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={isPending}>
      {isPending ? "..." : isLiked ? "Убрать лайк" : "Лайк"}
    </button>
  );
};
```

Обратите внимание, как этот фрагмент кода решает задачу:

- хранит техническое состояние (идет ли запрос)
- предотвращает повторные клики
- инкапсулирует поведение внутри фичи

---

## Интеграция фичей в более крупные слои

### Использование в widgets

В widgets вы обычно собираете вместе несколько фич и сущностей.

Например, виджет ArticleActions может включать:

- features/article/like
- features/article/share
- features/article/bookmark

```tsx
// widgets/article-actions/ui/ArticleActions.tsx
import React from "react";
import { LikeButton } from "features/article/like";
import { ShareButton } from "features/article/share";
import { BookmarkButton } from "features/article/bookmark";
import type { Article } from "entities/article";

interface ArticleActionsProps {
  article: Article;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({ article }) => {
  return (
    <div>
      {/* Фича лайка */}
      <LikeButton articleId={article.id} isLiked={article.isLiked} />

      {/* Фича поделиться статьей */}
      <ShareButton articleId={article.id} />

      {/* Фича закладок */}
      <BookmarkButton articleId={article.id} isBookmarked={article.isBookmarked} />
    </div>
  );
};
```

Здесь сам виджет просто композитирует фичи, не влезая в их внутреннюю логику.

### Использование в pages

На уровне страниц вы чаще всего:

- загружаете данные через entities или processes
- собираете интерфейс из widgets и features

```tsx
// pages/article/ui/ArticlePage.tsx
import React from "react";
import { useArticle } from "entities/article";
import { ArticleActions } from "widgets/article-actions";

export const ArticlePage = () => {
  const article = useArticle(); // Допустим, хук получения статьи

  if (!article) {
    return <div>Загрузка...</div>;
  }

  return (
    <main>
      <h1>{article.title}</h1>
      <p>{article.body}</p>

      {/* Здесь встраиваем виджет, внутри которого живут фичи */}
      <ArticleActions article={article} />
    </main>
  );
};
```

Фича никогда сама не лезет «наверх» до pages — ее встраивают сверху.

---

## Ошибки и анти‑паттерны в слое features

### Ошибка 1. Смешивание доменной логики и фич

Если в features вы храните:

- модели User
- общие операции с корзиной
- базовые правила валидации для домена

это сигнал, что часть кода пора перенести в entities.

Как правило:

- если логика относится к сущности во многих сценариях — это entities
- если логика нужна только в одном сценарии — это features

Например:

- расчет итоговой стоимости корзины с учетом скидок — скорее entities/cart
- «применить купон в корзине на этапе оформления заказа» — features/checkout/apply-coupon

### Ошибка 2. Фича знает о роутинге и страницах

Частая ловушка — внутри фичи вызывать переходы на конкретные страницы:

```ts
// ПЛОХО
import { useNavigate } from "react-router-dom";

export const AuthByEmailForm = () => {
  const navigate = useNavigate();

  const onSuccess = () => {
    // Привязка к конкретному маршруту ломает переиспользование фичи
    navigate("/profile");
  };

  // ...
};
```

Лучше сделать так:

- фича принимает onSuccess как проп, а сама не решает, куда переходить
- страница или виджет передает нужное поведение

```tsx
// features/auth/by-email/ui/form.tsx
interface AuthByEmailFormProps {
  onSuccess?: () => void; // Коллбек успеха, но без знания о роуте
}

// pages/login/ui/LoginPage.tsx
import { useNavigate } from "react-router-dom";
import { AuthByEmailForm } from "features/auth/by-email";

export const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <AuthByEmailForm
      onSuccess={() => {
        // Страница сама решает, куда перенаправлять
        navigate("/profile");
      }}
    />
  );
};
```

### Ошибка 3. Раздувание одной фичи

Если вы замечаете, что в одной фиче у вас:

- три разных сценария
- десятки файлов
- сложно понять, за что она отвечает

значит, стоит попробовать разделить ее на несколько фич.

Признаки, что нужно декомпозировать:

- разные сценарии используют разные подмножества кода
- сложно описать фичу одним коротким предложением
- в названии фичи появляются «и» (checkout-pay-and-confirm)

Лучше разделить:

- features/checkout/select-payment
- features/checkout/confirm-order
- features/checkout/apply-discount

---

## Как выделять фичи на практике

### Шаг 1. Идем от пользовательских историй

Сначала возьмите конкретную пользовательскую историю. Например:

«Пользователь может добавить товар в список желаний, чтобы вернуться к нему позже.»

Из этого получается:

- domain: wishlist
- feature: add-item

И структура:

- features/wishlist/add-item

### Шаг 2. Формулируем ответственность фичи

Сформулируйте вслух: «Фича add-item в домене wishlist отвечает за...»

Например:

«Фича add-item в домене wishlist отвечает за добавление конкретного товара в список желаний и отображение кнопки с правильным состоянием.»

Если формулировка получается слишком длинной или включает несколько «и», возможно, вам нужна не одна, а две фичи.

### Шаг 3. Определяем границы API

Решаем:

- какие компоненты нужны извне
  - WishlistToggleButton
  - WishlistAddButton
- какие эффекты и события нужны извне
  - toggleWishlistItem
- какие типы нужно экспортировать

И все это прописываем через публичный API в index.ts.

---

## Конфигурация фич и фича‑флаги

Иногда фичи нужно включать и выключать, либо переключать поведение в зависимости от конфигурации (A/B‑тесты, платные функции, предпросмотр).

### Где хранить конфигурацию

Обычно используют:

- shared/config — глобальные настройки приложения
- features/<domain>/<feature>/config — локальные настройки фичи

Пример простого фича‑флага:

```ts
// shared/config/features.ts

// Здесь мы описываем фича флаги
export const featureFlags = {
  newCheckout: false,
  wishlist: true,
};
```

В фиче:

```ts
// features/wishlist/add-item/lib/isWishlistEnabled.ts
import { featureFlags } from "shared/config/features";

export const isWishlistEnabled = () => featureFlags.wishlist;
```

В UI:

```tsx
// widgets/product-card/ui/ProductCard.tsx
import { isWishlistEnabled } from "features/wishlist/add-item/lib/isWishlistEnabled";
import { WishlistToggleButton } from "features/wishlist/add-item";

export const ProductCard = ({ product }) => {
  return (
    <article>
      {/* ... */}
      {isWishlistEnabled() && (
        <WishlistToggleButton productId={product.id} />
      )}
    </article>
  );
};
```

Так вы можете гибко включать и выключать фичи без разрушения структуры.

---

## Заключение

Слой features — это уровень, где бизнес‑сценарии приложения становятся реальными действиями пользователя. Он связывает доменные сущности с интерфейсом и позволяет:

- декомпозировать продукт на понятные возможности
- четко разделять ответственность между слоями
- гибко переиспользовать функционал в разных частях приложения
- управлять сложностью за счет публичных API и инкапсуляции

Ключевые моменты, которые важно держать в голове:

- фича — это сценарий, а не сущность
- features опирается на entities и shared, но не знает про widgets и pages
- каждая фича имеет собственный публичный API и скрывает внутренние детали
- состояние фичи ограничено ее задачей и не превращается в «второй глобальный стор»
- декомпозиция фич идет от пользовательских историй и бизнес‑требований

Если вы будете последовательно следовать этим принципам, слой features станет не набором «случайных компонентов», а четко организованной коллекцией возможностей приложения, которую удобно развивать, тестировать и поддерживать.

---

## Частозадаваемые технические вопросы

### Как поступать с фичами, которые зависят от разных сущностей сразу

Если фича использует несколько сущностей (например, Order и PaymentMethod), это нормально для слоя features. Главное — не переносить их общую доменную логику в features. Логику расчета суммы или проверки доступности метода оплаты лучше держать в entities, а фича только оркестрирует сценарий: загружает данные, вызывает нужные операции и отображает результат.

### Можно ли создавать фичи, которые используются только на одной странице

Да, можно. Но перед этим стоит задать себе вопрос — действительно ли это фича, а не часть страницы или виджета. Если сценарий потенциально может понадобиться в другом месте или имеет самостоятельный смысл, логично оформить его как фичу. Если это чисто «разовая» логика конкретной страницы, ее можно оставить в pages или widgets.

### Как тестировать фичи отдельно от приложения

Лучше всего организовать модульные тесты для model и интеграционные тесты для ui фичи. Для model вы тестируете события, эффекты и сторы, не трогая реальный DOM. Для ui можно использовать React Testing Library или аналог, подменяя внешние зависимости (API, конфиг). Важно импортировать фичу через ее публичный API и не обращаться к внутренним файлам напрямую.

### Как поступать с переиспользуемыми фрагментами между несколькими фичами

Если вы замечаете, что одинаковая логика повторяется в нескольких фичах, вынесите ее либо в shared/lib, либо в entities, если эта логика относится к сущности. Не стоит создавать «общую суперфичу», которая используется другими фичами, — это приведет к путанице в зависимостях. Фича должна оставаться независимым сценарием, а не библиотекой хелперов.

### Как разделять фичу между вебом и мобильным фронтендом

Если у вас есть общая логика фичи для разных платформ, модель и бизнес‑правила лучше вынести в общий пакет (monorepo, shared ядро и т. п.), а платформозависимый UI реализовать в отдельных проектах. При этом публичный API фичи можно сделать совместимым по контракту — например, сохранить одинаковые имена пропсов и событий, но реализовать их по‑разному для веба и для мобильного клиента.