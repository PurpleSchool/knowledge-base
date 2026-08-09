---
metaTitle: "Интеграция Stripe в Next.js — приём платежей"
metaDescription: "Подробное руководство по интеграции Stripe в Next.js: PaymentIntent, Checkout Session, Stripe Elements и обработка вебхуков с примерами кода."
author: "Антон Ларичев"
title: "Next.js с Stripe — интеграция платёжной системы"
preview: "Как подключить Stripe к Next.js-приложению: настройка Route Handlers, обработка вебхуков и отображение формы оплаты через Stripe Elements."
---

## Что такое Stripe и зачем он нужен

Stripe — одна из самых популярных платёжных платформ в мире, которая позволяет принимать онлайн-платежи, управлять подписками, выплатами и финансовыми данными. Для разработчиков Stripe предоставляет хорошо задокументированный API и готовые библиотеки для большинства языков и фреймворков.

Next.js — идеальная платформа для интеграции Stripe: Route Handlers позволяют безопасно работать с секретными ключами на сервере, а клиентские компоненты дают возможность использовать Stripe Elements для отображения формы оплаты.

В этой статье вы научитесь:

- настраивать Stripe SDK на сервере и клиенте;
- создавать PaymentIntent через Route Handler;
- отображать форму оплаты с помощью Stripe Elements;
- запускать Checkout Session как альтернативный подход;
- обрабатывать вебхуки для подтверждения успешных платежей.

## Подготовка проекта

Установите необходимые зависимости:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

Пакет `stripe` используется на сервере, `@stripe/stripe-js` и `@stripe/react-stripe-js` — на клиенте.

Создайте файл `.env.local` в корне проекта и добавьте ключи из вашего Stripe Dashboard:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Переменная с префиксом `NEXT_PUBLIC_` будет доступна в браузере. Секретный ключ `STRIPE_SECRET_KEY` должен использоваться только на сервере — никогда не передавайте его клиенту.

## Настройка Stripe на сервере

Создайте утилитарный файл для серверного экземпляра Stripe:

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});
```

Инициализация Stripe происходит один раз и экспортируется как синглтон. Это гарантирует, что во всех Route Handlers используется один и тот же экземпляр.

## Создание PaymentIntent через Route Handler

PaymentIntent — объект Stripe, который представляет намерение совершить платёж. Он создаётся на сервере, чтобы клиент не мог подменить сумму.

```typescript
// app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'rub' } = await request.json();

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Сумма должна быть не менее 50 копеек' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // в минимальных единицах валюты (копейки для RUB)
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Ошибка создания PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Не удалось создать платёж' },
      { status: 500 }
    );
  }
}
```

Route Handler возвращает `client_secret` — временный токен, который клиент использует для завершения платежа. Секретный ключ Stripe при этом остаётся только на сервере.

## Stripe Elements на клиенте

### Провайдер Stripe

Оберните страницу оплаты в `Elements`-провайдер:

```typescript
// components/StripeProvider.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
```

`loadStripe` вызывается вне компонента, чтобы объект Stripe не пересоздавался при каждом рендере.

### Форма оплаты

```typescript
// components/CheckoutForm.tsx
'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface CheckoutFormProps {
  amount: number;
}

export function CheckoutForm({ amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? 'Произошла ошибка при оплате');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && (
        <p style={{ color: 'red', marginTop: '8px' }}>{errorMessage}</p>
      )}
      <button type="submit" disabled={!stripe || isLoading}>
        {isLoading ? 'Обработка...' : `Оплатить ${amount / 100} ₽`}
      </button>
    </form>
  );
}
```

### Страница оплаты

Соберите всё вместе — страница запрашивает `clientSecret` при монтировании, затем рендерит форму:

```typescript
// app/checkout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StripeProvider } from '@/components/StripeProvider';
import { CheckoutForm } from '@/components/CheckoutForm';

const AMOUNT = 99900; // 999 рублей в копейках

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: AMOUNT }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) {
    return <p>Загрузка...</p>;
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <CheckoutForm amount={AMOUNT} />
    </StripeProvider>
  );
}
```

## Checkout Session — альтернативный подход

Stripe Checkout — готовая страница оплаты, которую хостит сам Stripe. Это более простой способ интеграции: не нужно создавать форму вручную, Stripe берёт на себя весь UI.

### Создание Checkout Session

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Ошибка создания Checkout Session:', error);
    return NextResponse.json(
      { error: 'Не удалось создать сессию' },
      { status: 500 }
    );
  }
}
```

### Кнопка перехода к оплате

```typescript
// components/BuyButton.tsx
'use client';

import { useState } from 'react';

interface BuyButtonProps {
  priceId: string;
  label: string;
}

export function BuyButton({ priceId, label }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    }

    setIsLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Перенаправление...' : label}
    </button>
  );
}
```

Checkout Session удобен для простых магазинов. Недостаток — внешний вид ограничен настройками Stripe Dashboard, полной кастомизации нет.

## Обработка вебхуков

Вебхуки — ключевая часть интеграции Stripe. Они позволяют Stripe уведомлять ваш сервер о событиях: успешном платеже, отмене, возврате средств. Нельзя полагаться только на редирект на `success_url` — пользователь может закрыть вкладку до перехода на страницу успеха.

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Отсутствует подпись вебхука' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Ошибка верификации вебхука:', error);
    return NextResponse.json(
      { error: 'Неверная подпись вебхука' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      await handleCheckoutComplete(session);
      break;
    }
    default:
      console.log(`Необработанное событие: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Обновление статуса заказа в базе данных
  console.log('Платёж успешен:', paymentIntent.id);
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log('Платёж не прошёл:', paymentIntent.id);
}

async function handleCheckoutComplete(session: Stripe.CheckoutSession) {
  // Активация покупки для пользователя
  console.log('Checkout завершён:', session.id);
}
```

Важно: тело запроса нужно читать как текст через `request.text()`, а не парсить как JSON. Stripe проверяет подпись по сырому телу запроса — если его преобразовать, верификация провалится.

## Тестирование платежей

### Тестовые карты

Stripe предоставляет номера карт для тестирования разных сценариев:

| Номер карты | Результат |
|---|---|
| `4242 4242 4242 4242` | Успешный платёж |
| `4000 0000 0000 0002` | Карта отклонена |
| `4000 0025 0000 3155` | Требует 3D Secure |

Для всех тестовых карт используйте любую будущую дату истечения, CVC из трёх цифр и любой почтовый индекс.

### Тестирование вебхуков локально

Для локального тестирования вебхуков используйте Stripe CLI:

```bash
# Установка Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Авторизация
stripe login

# Проксирование вебхуков на локальный сервер
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe CLI выведет `webhook signing secret` — используйте его как значение `STRIPE_WEBHOOK_SECRET` для локальной разработки.

Для отправки тестового события:

```bash
stripe trigger payment_intent.succeeded
```

## Безопасность и важные рекомендации

Несколько правил, которые нельзя нарушать при работе со Stripe:

- Создавайте PaymentIntent и Checkout Session только на сервере — клиент не должен иметь доступа к секретному ключу.
- Верифицируйте подпись каждого вебхука перед обработкой — это защищает от поддельных запросов.
- Не доверяйте сумме, пришедшей с клиента — берите её из вашей базы данных или серверной конфигурации.
- Используйте `idempotencyKey` при создании платёжных объектов, чтобы избежать дублирования при сетевых ошибках:

```typescript
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 99900,
    currency: 'rub',
  },
  {
    idempotencyKey: `order_${orderId}`,
  }
);
```

- Сохраняйте Stripe ID (`payment_intent.id`, `session.id`) в базе данных для аудита и поддержки клиентов.
- В production настройте вебхук в Stripe Dashboard, указав URL `https://yourdomain.com/api/webhooks/stripe` и выбрав нужные типы событий.

Освоить Next.js с нуля до продвинутого уровня, включая работу с внешними API и платёжными системами, можно на курсе PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-stripe