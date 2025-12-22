---
metaTitle: Микрофронтенды в FSD - как организовать масштабируемый фронтенд
metaDescription: Подробный разбор микрофронтендов в контексте Feature Sliced Design - подходы архитектура интеграция и примеры реализации для масштабируемых фронтенд проектов
author: Олег Марков
title: Микрофронтенды в FSD - microfrontends на практике
preview: Разбираем как комбинировать микрофронтенды и Feature Sliced Design - когда это нужно как делить приложение и как организовать общие слои и коммуникацию между частями
---

## Введение

Микрофронтенды часто описывают как попытку перенести идеи микросервисов в мир клиентских приложений. У вас есть один большой интерфейс, который со временем становится трудным для развития, и вы делите его на несколько независимых частей, каждая из которых развивается собственной командой, может иметь собственный цикл релизов и даже собственный стек.

Feature-Sliced Design (FSD) решает похожую проблему, но на уровне архитектуры одного фронтенд-репозитория. Этот подход помогает структурировать код, разделяя его по уровням абстракции и по функциональным областям. Он делает монолитный фронтенд более предсказуемым и управляемым.

В этой статье я покажу вам, как объединить микрофронтенды и FSD, чтобы получить масштабируемую архитектуру, где:

- границы между микрофронтендами проходят по бизнес-доменам;
- внутри каждого микрофронтенда соблюдается FSD-структура;
- общие слои и библиотеки оформлены как независимые пакеты;
- интеграция между микрофронтендами контролируема и предсказуема.

Мы пройдем путь от архитектурных принципов до конкретных примеров кода и разберем практические вопросы, которые чаще всего возникают у разработчиков.

## Что такое микрофронтенды и зачем комбинировать их с FSD

### Микрофронтенды одним абзацем

Микрофронтенд — это автономная часть фронтенда, которая:

- может разрабатываться и деплоиться независимо;
- отвечает за конкретный бизнес-домен или пользовательский сценарий;
- имеет собственную архитектуру внутри (в том числе свой state-менеджмент, роутинг, UI-компоненты).

По сути, вы разбиваете один большой SPA на несколько самостоятельных приложений, которые собираются в единый интерфейс на уровне браузера (через модульную федерацию, веб-компоненты, iframes или иной механизм).

### Где здесь FSD

FSD отвечает на вопрос «как правильно организовать код внутри приложения». Он предлагает делить код:

- по слоям (app, processes, pages, features, entities, shared);
- и по слайсам (конкретные домены и сущности).

Когда вы используете микрофронтенды, каждое отдельное приложение все равно нуждается в ясной внутренней структуре. Здесь и помогает FSD:

- упрощает навигацию по коду крупных микрофронтендов;
- задает понятные границы между слоями и зависимостями;
- делает единообразным подход к архитектуре во всех микрофронтендах.

### Когда микрофронтенды вообще нужны

Давайте коротко зафиксируем, когда стоит переходить от одного FSD-монолита к микрофронтендам:

- У вас несколько команд, которые регулярно мешают друг другу в одном репозитории.
- Время сборки и деплоя выросло до неприемлемого уровня.
- Разные части продукта развиваются разными темпами и требуют разных стеков.
- Вы хотите деплоить отдельные домены независимо.

Если пока ничего из этого не болит, часто достаточно аккуратного FSD-монолита.

## Как делить приложение на микрофронтенды в терминах FSD

### Базовый принцип — домены, а не страницы

Частая ошибка — делить приложение на микрофронтенды по страницам или технологиям. Лучше делить по бизнес-доменам. Смотрите, как это можно сделать:

- `billing` — все, что связано с оплатой и подписками;
- `profile` — профиль пользователя и его настройки;
- `analytics` — отчеты и метрики;
- `catalog` — товары, категории, фильтрация.

Каждый такой домен становится отдельным микрофронтендом, внутри которого вы строите FSD-структуру.

Пример структуры репозитория в монорепо:

- apps
  - shell (root приложение-оркестратор)
  - mf-billing
  - mf-profile
  - mf-analytics
- packages
  - ui-kit
  - shared-lib
  - config

### FSD внутри каждого микрофронтенда

Теперь посмотрим, как может выглядеть структура одного микрофронтенда в стиле FSD. Давайте возьмем `mf-billing`:

- src
  - app
  - processes
  - pages
  - features
  - entities
  - shared

Обратите внимание: здесь та же иерархия, что и в монолитном FSD-приложении. Разница в том, что:

- каждый микрофронтенд может иметь свой роутер (например, подроуты `/billing/*`);
- общие вещи (UI, утилиты) лучше вынести в отдельные пакеты `packages/*`, а не дублировать в каждом микрофронтенде.

### Варианты разделения FSD-слоев между микрофронтендами

Часто возникает вопрос — а можно ли иметь общие `entities` или `features` для нескольких микрофронтендов. Да, но лучше оформлять их как отдельные пакеты.

Например:

- `packages/entities-user` — логика и модели сущности пользователя;
- `packages/features-auth` — фича авторизации;
- `packages/shared-api` — общая конфигурация запросов.

В самих микрофронтендах вы тогда используете их как внешние зависимости:

- `mf-billing`
  - src
    - app
    - pages
    - features
      - billing-payments
      - billing-invoices
    - entities
      - billing-subscription
    - shared

А в коде импортируете:

```ts
// Здесь мы импортируем общую сущность пользователя как отдельный пакет
import { useCurrentUser } from '@entities/user';

// А это локальная сущность подписки, специфичная для биллинга
import { useSubscription } from '@/entities/billing-subscription';
```

Так вы сохраняете принципы FSD и одновременно используете преимущества микрофронтенд-архитектуры.

## Типы микрофронтенд-интеграции и их влияние на FSD

### Варианты интеграции

Есть несколько основных способов собрать микрофронтенды в один интерфейс:

1. Сборка времени компиляции (composition at build time):
   - все части подключаются как зависимости и склеиваются на этапе сборки;
   - чаще всего — просто несколько npm-пакетов, подключенных в одно SPA;
   - независимых деплоев почти нет.
2. Модульная федерация Webpack Module Federation:
   - каждый микрофронтенд собирается и деплоится отдельно;
   - shell-приложение подгружает их динамически через remote-entries.
3. Веб-компоненты:
   - каждый микрофронтенд отрисовывается как кастомный элемент;
   - коммуникация через props, события и общий store.
4. iframes:
   - полная изоляция по безопасности;
   - сложнее коммуникация и совместный роутинг.

Чаще всего в современных SPA используют модульную федерацию. Давайте опираться на нее как на основной вариант и посмотрим, как это сочетается с FSD.

### Shell-приложение как FSD-«оболочка»

Shell-приложение — это микрофронтенд, который выступает в роли root-приложения:

- отвечает за общие вещи (главный роутер, layout, навигацию, шапку/подвал);
- конфигурирует DI, глобальные провайдеры (например, i18n);
- подгружает микрофронтенды как remote-модули.

С точки зрения FSD shell — это обычное приложение со своими слоями. Типичная структура:

- apps
  - shell
    - src
      - app
        - providers
        - routing
        - layout
      - processes
      - pages
        - home
        - not-found
      - features
        - navigation
      - entities
        - session
        - user
      - shared

Особенность в том, что часть страниц и фич в shell — это по сути «проксирование» к удаленным микрофронтендам.

Теперь посмотрим на пример кода.

```ts
// apps/shell/src/app/providers/router.tsx
// Здесь мы создаем главный роутер и подключаем микрофронтенды как ленивые страницы

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShellLayout } from '@/app/layout';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';

// Ленивая загрузка микрофронтенда биллинга через модульную федерацию
const BillingApp = React.lazy(() => import('mf_billing/App'));

// Ленивая загрузка микрофронтенда профиля
const ProfileApp = React.lazy(() => import('mf_profile/App'));

export const AppRouter = () => (
  <BrowserRouter>
    <ShellLayout>
      <React.Suspense fallback={<div>Загрузка...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Здесь мы делегируем подроуты микрофронтенду биллинга */}
          <Route path="/billing/*" element={<BillingApp />} />
          {/* Здесь мы делегируем подроуты микрофронтенду профиля */}
          <Route path="/profile/*" element={<ProfileApp />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
    </ShellLayout>
  </BrowserRouter>
);
```

Как видите, shell воспринимает микрофронтенды просто как ленивые страницы. Внутри них вы уже строите собственный FSD-роутинг.

## FSD-структура микрофронтенда на примере

Давайте разберем на примере условный микрофронтенд `mf-billing`. Я покажу упрощенную структуру и фрагменты кода, чтобы вам было проще перенести это в свой проект.

### Структура микрофронтенда billing

Представим такую структуру:

- apps
  - mf-billing
    - src
      - app
        - index.tsx
        - providers
          - router.tsx
      - pages
        - invoices
        - subscriptions
      - features
        - billing-pay-invoice
      - entities
        - invoice
        - subscription
      - shared
        - api
        - config
        - ui

Рассмотрим ключевые элементы.

### Точка входа микрофронтенда

```tsx
// apps/mf-billing/src/app/index.tsx
// Это корневой компонент микрофронтенда, который будет импортировать shell

import { BillingRouter } from './providers/router';

export const App = () => {
  // Здесь вы можете добавить локальные провайдеры, если они нужны
  return <BillingRouter />;
};

// Важно - по договоренности это экспорт по умолчанию для федерации модулей
export default App;
```

### Локальный роутер микрофронтенда

```tsx
// apps/mf-billing/src/app/providers/router.tsx
// Здесь мы создаем внутренний роутер микрофронтенда на основе basename

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { InvoicesPage } from '@/pages/invoices';
import { SubscriptionsPage } from '@/pages/subscriptions';

export const BillingRouter = () => {
  const location = useLocation();
  // Здесь вы можете при необходимости логировать или обрабатывать маршрут

  return (
    <Routes location={location}>
      {/* Список счетов по умолчанию */}
      <Route path="/" element={<Navigate to="invoices" replace />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="subscriptions" element={<SubscriptionsPage />} />
    </Routes>
  );
};
```

Здесь мы предполагаем, что shell монтирует `BillingRouter` на путь `/billing/*`. Внутри микрофронтенда мы уже оперируем относительными путями.

### Пример сущности в FSD в контексте микрофронтенда

Теперь давайте посмотрим, как может выглядеть сущность `invoice` в FSD-стиле:

- apps
  - mf-billing
    - src
      - entities
        - invoice
          - model
            - types.ts
            - api.ts
            - hooks.ts
          - ui
            - invoice-card.tsx
            - invoice-list.tsx
          - index.ts

```ts
// apps/mf-billing/src/entities/invoice/model/types.ts
// Здесь мы описываем типы сущности счета

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue';

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}
```

```ts
// apps/mf-billing/src/entities/invoice/model/api.ts
// Здесь мы описываем API для работы со счетами внутри микрофронтенда

import { httpClient } from '@/shared/api/httpClient';
import { Invoice } from './types';

export const fetchInvoices = async (): Promise<Invoice[]> => {
  // Здесь мы выполняем запрос к бэкенду микросервиса биллинга
  const response = await httpClient.get('/billing/invoices');
  return response.data;
};
```

```ts
// apps/mf-billing/src/entities/invoice/model/hooks.ts
// Здесь мы описываем React-хуки для работы со счетами

import { useEffect, useState } from 'react';
import { fetchInvoices } from './api';
import { Invoice } from './types';

export const useInvoices = () => {
  const [data, setData] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchInvoices()
      .then(setData)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
```

```tsx
// apps/mf-billing/src/entities/invoice/ui/invoice-list.tsx
// Здесь мы строим UI-компонент, который показывает список счетов

import { useInvoices } from '../model/hooks';
import { InvoiceCard } from './invoice-card';

export const InvoiceList = () => {
  const { data, loading, error } = useInvoices();

  if (loading) {
    return <div>Загружаем счета...</div>;
  }

  if (error) {
    // Здесь можно использовать общий компонент ошибки из shared слоя
    return <div>Ошибка при загрузке счетов</div>;
  }

  if (!data || data.length === 0) {
    return <div>Счета не найдены</div>;
  }

  return (
    <div>
      {data.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
};
```

```tsx
// apps/mf-billing/src/entities/invoice/ui/invoice-card.tsx
// Здесь мы описываем карточку счета

import { Invoice } from '../model/types';

interface Props {
  invoice: Invoice;
}

export const InvoiceCard = ({ invoice }: Props) => {
  return (
    <div>
      {/* Здесь мы выводим основные данные счета */}
      <div>Счет №{invoice.id}</div>
      <div>
        Сумма: {invoice.amount} {invoice.currency}
      </div>
      <div>Статус: {invoice.status}</div>
    </div>
  );
};
```

```ts
// apps/mf-billing/src/entities/invoice/index.ts
// Это публичный интерфейс сущности счета для использования в других слоях

export * from './model/types';
export * from './model/hooks';
export * from './ui/invoice-list';
export * from './ui/invoice-card';
```

Теперь вы видите, как сущность оформлена внутри микрофронтенда по всем правилам FSD: типы, API, хуки, UI — и единая точка экспорта.

## Общие слои и библиотеки между микрофронтендами

### Почему нельзя просто копировать shared

Если у вас несколько микрофронтендов, очень быстро возникает соблазн просто скопировать `shared` из одного проекта в другой. Это приводит к:

- расхождению реализаций (компоненты визуально отличаются);
- дублированию кода (все баги приходится чинить в нескольких местах);
- сложностям при обновлении UI.

Лучше вынести действительно общие части в отдельные пакеты.

### Как оформить общий UI-kit в монорепо

Давайте посмотрим на пример общего UI-пакета:

- packages
  - ui-kit
    - src
      - button
      - input
      - modal
    - index.ts
    - package.json

```tsx
// packages/ui-kit/src/button/index.tsx
// Здесь мы описываем базовую кнопку, которую будут использовать микрофронтенды

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ variant = 'primary', ...props }: ButtonProps) => {
  const className =
    variant === 'primary' ? 'btn btn-primary' : 'btn btn-secondary';

  return (
    <button className={className} {...props}>
      {props.children}
    </button>
  );
};
```

```ts
// packages/ui-kit/src/index.ts
// Публичный интерфейс UI-кита

export * from './button';
export * from './input';
export * from './modal';
```

В микрофронтендах вы используете эту библиотеку так:

```tsx
// apps/mf-billing/src/features/billing-pay-invoice/ui/pay-button.tsx
// Здесь мы используем общую кнопку из UI-кита

import { Button } from '@ui-kit/button';

interface Props {
  invoiceId: string;
}

export const PayInvoiceButton = ({ invoiceId }: Props) => {
  const handleClick = () => {
    // Здесь вы вызываете оплату счета
    console.log('Оплачиваем счет', invoiceId);
  };

  return (
    <Button variant="primary" onClick={handleClick}>
      Оплатить
    </Button>
  );
};
```

Так вы:

- сохраняете единый внешний вид во всех микрофронтендах;
- обновляете общие компоненты в одном месте;
- не нарушаете FSD-принципы внутри каждого микрофронтенда.

### Общие сущности и фичи

Часть `entities` и `features` также может быть вынесена в отдельные пакеты, например:

- `packages/entities-user`
- `packages/features-auth`
- `packages/shared-config`

Важно:

- пакеты лучше проектировать так, чтобы они оставались независимыми от конкретного микрофронтенда;
- внутри каждого пакета вы тоже можете использовать FSD-идеологию (минимум — деление на `model` и `ui`).

Пример простой сущности пользователя как отдельного пакета:

- packages
  - entities-user
    - src
      - model
        - types.ts
        - hooks.ts
      - ui
        - user-avatar.tsx
      - index.ts

```ts
// packages/entities-user/src/model/types.ts
// Здесь мы описываем типы сущности пользователя

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}
```

```tsx
// packages/entities-user/src/ui/user-avatar.tsx
// Здесь мы описываем компонент аватара пользователя

import { User } from '../model/types';

interface Props {
  user: User;
}

export const UserAvatar = ({ user }: Props) => {
  return (
    <div>
      {/* Если есть ссылка на аватар, показываем картинку, иначе инициалы */}
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} />
      ) : (
        <span>{user.name.charAt(0)}</span>
      )}
    </div>
  );
};
```

```ts
// packages/entities-user/src/model/hooks.ts
// Здесь мы описываем простой хук для работы с текущим пользователем

import { useContext } from 'react';
import { User } from './types';
import { UserContext } from './user-context';

// Этот контекст вы можете пробрасывать из shell-приложения
export const useCurrentUser = (): User | null => {
  return useContext(UserContext);
};
```

```ts
// packages/entities-user/src/index.ts
// Публичный интерфейс пакета сущности пользователя

export * from './model/types';
export * from './model/hooks';
export * from './ui/user-avatar';
```

Такой подход помогает вам повторно использовать доменные сущности между микрофронтендами без нарушения концепций FSD.

## Коммуникация между микрофронтендами с учетом FSD

### Общий принцип — слабая связность

Микрофронтенды задуманы как независимые части приложения. Если вы начнете напрямую импортировать код одно из другого, архитектурные границы быстро размоются, и вы получите распределенный монолит.

Лучше использовать один из двух подходов:

1. Коммуникация через общий слой (shared store, event bus, API).
2. Коммуникация через shell (подъем состояния наверх).

Давайте разберем их и посмотрим, как это выглядит в коде.

### 1. Общий event bus или store

Один из простых вариантов — общий event bus в shared-пакете.

Структура:

- packages
  - shared-event-bus
    - src
      - event-bus.ts
      - events.ts

```ts
// packages/shared-event-bus/src/events.ts
// Здесь мы описываем типы событий для шины

export type AppEvent =
  | { type: 'billing.invoice.paid'; payload: { invoiceId: string } }
  | { type: 'user.logged-out'; payload: { userId: string } };

// Здесь мы явно выписываем возможные события, чтобы было проще поддерживать код
```

```ts
// packages/shared-event-bus/src/event-bus.ts
// Здесь мы реализуем простую шину событий для обмена между микрофронтендами

import { AppEvent } from './events';

type Listener = (event: AppEvent) => void;

const listeners = new Set<Listener>();

export const eventBus = {
  subscribe(listener: Listener) {
    // Подключаем нового слушателя
    listeners.add(listener);
    return () => {
      // Отписка
      listeners.delete(listener);
    };
  },
  publish(event: AppEvent) {
    // Рассылаем событие всем слушателям
    listeners.forEach((listener) => listener(event));
  },
};
```

Теперь в `mf-billing` вы можете публиковать события:

```ts
// apps/mf-billing/src/features/billing-pay-invoice/model/pay-invoice.ts
// Здесь мы публикуем событие об успешной оплате

import { eventBus } from '@shared/event-bus';

export const payInvoice = async (invoiceId: string) => {
  // Здесь вы вызываете API оплаты
  // await api.payInvoice(invoiceId);

  // После успешной оплаты отправляем событие в шину
  eventBus.publish({
    type: 'billing.invoice.paid',
    payload: { invoiceId },
  });
};
```

А в другом микрофронтенде или в shell — подписываться:

```ts
// apps/shell/src/processes/analytics-listener/index.tsx
// Здесь мы подписываемся на события для аналитики

import { useEffect } from 'react';
import { eventBus } from '@shared/event-bus';

export const AnalyticsListener = () => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      // Здесь вы можете отправить событие в систему аналитики
      console.log('App event', event);
    });

    return unsubscribe;
  }, []);

  return null;
};
```

Этот подход хорошо сочетается с FSD: событие можно рассматривать как часть слоя `processes`, а сама шина — как пакет уровня `shared`.

### 2. Коммуникация через shell

Если вам нужно более тесное взаимодействие (например, передача текущего пользователя во все микрофронтенды), проще всего поднимать состояние в shell и пробрасывать его вниз через контекст или props.

Например:

- в shell вы храните сессию в `entities/session`;
- shell отдает провайдер `SessionProvider`;
- каждый микрофронтенд использует общий хук `useSession` из пакета `entities-session`.

Этот подход позволяет:

- централизовать критичные данные (сессия, настройки, локаль);
- не тащить общие сущности в каждый микрофронтенд отдельно;
- при этом сократить количество связей «микрофронтенд — микрофронтенд».

## Организация монорепо и сборки

### Почему монорепо часто удобнее для микрофронтендов

Для проектов с микрофронтендами монорепо (например, на Turborepo, Nx или просто pnpm workspaces) дает несколько плюсов:

- единое управление зависимостями;
- быстрый локальный запуск всех микрофронтендов;
- возможность легко выделять общие пакеты (ui-kit, entities, features).

Пример простого `pnpm-workspace.yaml`:

```yaml
# Здесь мы описываем рабочие пространства для pnpm

packages:
  - 'apps/*'      # все приложения, включая shell и микрофронтенды
  - 'packages/*'  # общие библиотеки и слои
```

### Конфигурация Module Federation

На практике каждый микрофронтенд конфигурируется как remote-модуль для shell. Приведу упрощенную идею на примере Webpack.

Shell (host):

```js
// webpack.config.js для shell
// Здесь мы настраиваем модульную федерацию и подключаем микрофронтенды

const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  // Другие опции сборки
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // Здесь указываем имена микрофронтендов и их url
        mf_billing: 'mf_billing@https://billing.example.com/remoteEntry.js',
        mf_profile: 'mf_profile@https://profile.example.com/remoteEntry.js',
      },
      shared: {
        // Общие зависимости (react, react-dom и тд)
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
```

Микрофронтенд billing (remote):

```js
// webpack.config.js для mf-billing
// Здесь мы объявляем микрофронтенд как remote модуль

const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  // Другие опции сборки
  plugins: [
    new ModuleFederationPlugin({
      name: 'mf_billing',
      filename: 'remoteEntry.js',
      exposes: {
        // Здесь мы указываем, какой модуль будем экспортировать для shell
        './App': './src/app/index.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
```

Внутри FSD-структуры это почти не чувствуется: для вас `App` — просто корневой компонент микрофронтенда.

## Типичные ошибки при совмещении микрофронтендов и FSD

### Ошибка 1 — путать границы микрофронтенда и слои FSD

Иногда разработчики пытаются сделать так, чтобы разные микрофронтенды отвечали за разные FSD-слои. Например:

- один микрофронтенд — только `pages`;
- другой — только `features` и `entities`.

Так делать не стоит. Микрофронтенд — это самостоятельное мини-приложение, и внутри него должны быть все слои FSD. Слои — это внутреннее архитектурное деление, а микрофронтенды — внешнее.

### Ошибка 2 — делать «общий shared» в виде отдельного микрофронтенда

Идея понятна: «давайте вынесем весь shared в один микрофронтенд и будем его подключать». На практике:

- это создает жесткую зависимость всего приложения от этого микрофронтенда;
- вы получаете бутылочное горлышко по релизам и изменению общих компонентов;
- становится трудно контролировать зависимости.

Лучше оформлять общие вещи как пакеты в `packages/*`, а не как отдельные микрофронтенды.

### Ошибка 3 — хаотичный импорт между микрофронтендами

Если вы начинаете импортировать модули одного микрофронтенда в другой напрямую (без federation и без общих пакетов), вы:

- ломаете независимость сборок;
- усложняете деплой;
- получаете запутанную сеть зависимостей.

Границы микрофронтенда должны быть физическими: отдельная сборка, отдельный деплой. Общий код — только в пакетах.

### Ошибка 4 — игнорировать ограничения FSD по зависимостям

FSD предполагает, что:

- `shared` не зависит ни от кого;
- `entities` может зависеть от `shared`;
- `features` может зависеть от `entities` и `shared`;
- `pages` может зависеть от `features`, `entities`, `shared`;
- `app` может зависеть от всех.

В микрофронтенд-контексте это правило все еще актуально. Если вы его нарушаете, код быстро становится трудно поддерживать, независимо от того, сколько у вас микрофронтендов.

## Заключение

Микрофронтенды и Feature-Sliced Design решают разные, но дополняющие друг друга задачи. Микрофронтенды помогают разделить приложение по физическим границам: отдельные команды, отдельные сборки и деплои. FSD помогает навести порядок внутри каждого отдельного приложения, в том числе внутри каждого микрофронтенда.

Если не торопиться и четко понимать роли уровней:

- микрофронтенд — граница домена и команды;
- FSD — внутренняя архитектура кода;
- общие пакеты — способ разделить переиспользуемую логику между частями,

то вы получаете гибкую архитектуру, которую проще масштабировать по коду, командам и бизнес-функциям.

Смотрите на свой продукт через призму доменов, старайтесь не размывать границы микрофронтендов и следите за зависимостями между слоями FSD. Тогда микрофронтенды перестанут казаться сложной конструкцией, а будут выглядеть как естественное развитие хорошо организованного монолита.

## Частозадаваемые технические вопросы и ответы

### Как хранить общие типы DTO между микрофронтендами

Лучше всего вынести общие DTO и контрактные типы в отдельный пакет, например `packages/shared-contracts`. Там вы храните только типы и схемы (например, Zod или io-ts), без бизнес-логики. Микрофронтенды и бэкенд могут импортировать эти типы, чтобы не расходились форматы данных. Важно не тянуть из этого пакета React или других тяжелых зависимостей, чтобы он оставался легким и универсальным.

### Как запускать локально несколько микрофронтендов и shell одновременно

Используйте монорепо с инструментом, который поддерживает параллельный запуск (Turborepo, Nx или простой npm-скрипт с `concurrently`). Для каждого приложения настройте свой порт, а в конфигурации Module Federation укажите локальные адреса `http://localhost:порт/remoteEntry.js`. Shell при старте будет подгружать микрофронтенды с этих портов, и вы сможете разрабатывать все части параллельно.

### Что делать с глобальными стилями и темой оформления

Глобальную тему и базовые переменные удобно вынести в `packages/ui-theme` или `packages/design-tokens`. Там храните CSS-переменные, токены и базовые глобальные стили. Каждый микрофронтенд подключает этот пакет в своем корневом файле `app` (например, импортом CSS или Emotion theme provider). Тогда вы сможете централизованно менять стили и быть уверенными, что внешний вид останется единообразным.

### Как версионировать общие пакеты, чтобы не ломать микрофронтенды

В монорепо чаще всего используют семантическое версионирование пакетов с помощью инструментов вроде Changesets. Новую версию общих пакетов публикуйте и постепенно обновляйте зависимости в микрофронтендах. При мажорных изменениях поддерживайте переходный период, когда одновременно доступны старая и новая API (например, разные компоненты или флаги конфигурации), чтобы команды могли мигрировать независимо.

### Как отлаживать проблемы взаимодействия между микрофронтендами

Старайтесь логировать события и запросы на границах микрофронтендов. В shell можно включить debug-режим, где вы выводите в консоль все события event bus и основную навигацию. Если используете общие контексты или store, добавьте простой DevTools-компонент, который показывает текущее состояние. Так вы сможете увидеть, какая часть цепочки ломается, не влезая глубоко во внутренности всех микрофронтендов сразу.