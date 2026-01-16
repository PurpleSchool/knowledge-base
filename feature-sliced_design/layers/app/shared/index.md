---
metaTitle: Слой shared shared-layer в фронтенд архитектуре
metaDescription: Разбор слоя shared shared-layer в архитектуре фронтенда на примерах - как выделять общие модули компоненты и утилиты и не превращать проект в свалку
author: Олег Марков
title: Слой shared shared-layer
preview: Понимание слоя shared shared-layer поможет вам строить масштабируемую архитектуру фронтенда и грамотно выделять переиспользуемый код
---

## Введение

Слой shared (его еще называют shared-layer или shared module) — это уровень архитектуры проекта, в котором собираются переиспользуемые части кода, не завязанные на конкретную бизнес-логику.  

Если говорить проще, в shared складывают то, чем могут пользоваться все остальные слои: страницы, фичи, виджеты, доменные модули. Но у этого слоя есть важные правила и ограничения, без которых он быстро превращается в свалку «всего подряд».

В этой статье вы разберетесь:

- что именно должно лежать в shared, а что — нет  
- как структурировать папки и модули внутри shared  
- какие зависимости допустимы для shared и как не создать циклы  
- как организовать экспорт, типы, стили и тесты в shared  
- как подключать shared из других слоев и не нарушать архитектуру

Смотрите, я покажу вам это на примерах и типичных ошибках, которые часто допускают команды.

---

## Что такое слой shared и зачем он нужен

### Основная идея shared-layer

Слой shared — это набор общих, нейтральных по отношению к бизнесу сущностей:

- базовые UI-компоненты  
- переиспользуемые хелперы и утилиты  
- общие типы и контракты  
- константы, не завязанные на конкретный домен  
- общая инфраструктура: логирование, HTTP-клиент, конфиг

Главное свойство этого слоя — он не должен знать, **как именно** используется его код в конкретных фичах или страницах. Он предоставляет кирпичики, а не готовые здания.

Можно представить shared как библиотеку внутри монорепозитория. Другие слои ее используют, но сам shared о них ничего не знает.

### Задачи, которые решает shared-layer

1. **Избегание дублирования кода**  
   Общие компоненты/утилиты хранятся в одном месте, а не копируются из проекта в проект или из модуля в модуль.

2. **Централизованная поддержка**  
   Исправили баг в кнопке в shared — он автоматически уходит везде, где эта кнопка используется.

3. **Единый визуальный язык**  
   Если вы кладете в shared базовые UI-компоненты, у вас появляется единый набор визуальных примитивов: Button, Input, Modal и т.д.

4. **Снижение связанности доменов**  
   Доменные модули не зависят напрямую друг от друга, а общаются через shared (типами, абстракциями, интерфейсами).

5. **Повторное использование между приложениями**  
   Если у вас монорепо или несколько фронтенд-приложений, shared может быть общим слоем для всех.

---

## Границы и правила слоя shared

### Что можно класть в shared

Давайте посмотрим, какие категории кода подходят для shared.

#### Примитивные UI-компоненты

- Кнопки  
- Инпуты  
- Чекбоксы  
- Табы  
- Простые модалки  
- Базовые layout-компоненты (Container, Stack, Grid)

Главное: эти компоненты не знают ничего о конкретной бизнес-логике и не привязаны к доменным моделям.

Пример:

```tsx
// shared/ui/Button/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; // Вариант стилизации
  isLoading?: boolean;     // Состояние загрузки
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  disabled,
  ...rest
}) => {
  // Здесь мы заранее считаем атрибут disabled с учетом загрузки
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      data-variant={variant}
      disabled={isDisabled}
      {...rest}
    >
      {/* В реальном проекте здесь будут стили, иконка лоадера и т.д. */}
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

Обратите внимание: Button не знает, в каком домене он используется — это идеальный кандидат для shared.

#### Утилитарные функции и хелперы

- Форматирование дат, чисел, валют  
- Общие функции работы с массивами, объектами  
- Универсальная валидация (email, phone, длина пароля)  
- Работа с localStorage, cookies, query-параметрами, но без домена

Пример:

```ts
// shared/lib/format/formatDate.ts
// Здесь мы создаем простую функцию форматирования даты
export function formatDate(date: Date | string, locale = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    // Если дата некорректна, возвращаем пустую строку, а не бросаем ошибку
    return '';
  }

  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
```

Такая функция не привязана к конкретному домену и может использоваться где угодно.

#### Общие типы и интерфейсы

- Базовые Result / Error типы  
- Типы для API-ответов, которые используются несколькими доменами  
- Общие значения enum для статусов, которые повторяются в разных модулях

Пример:

```ts
// shared/types/result.ts

// Здесь мы описываем унифицированный результат операции
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// Утилита для простого создания успешного результата
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

// Утилита для создания ошибочного результата
export function fail<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

Такой Result может использоваться в разных слоях и доменах.

#### Инфраструктурные модули

- HTTP-клиент (например, обертка над fetch или axios)  
- Логирование  
- Функции трейсинга, метрик  
- Конфиг приложения (apiBaseUrl, feature-flags)

Пример:

```ts
// shared/api/httpClient.ts

export interface HttpClientOptions {
  // Базовый URL для всех запросов
  baseUrl: string;
  // Общие заголовки запроса
  headers?: Record<string, string>;
}

export class HttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.headers = options.headers ?? {};
  }

  // Базовый GET-запрос
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      ...init,
      method: 'GET',
      headers: {
        ...this.headers,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      // В реальном коде лучше бросать кастомную ошибку
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Аналогично можно реализовать post put delete и т.д.
}
```

Такой клиент может использоваться разными доменами, не зная ни одного из них.

### Что не должно быть в shared

Здесь важно провести четкую границу, иначе shared превратится в мусорку.

В shared **не кладем**:

- компоненты с конкретной бизнес-логикой (OrderList, UserProfile)  
- утилиты, завязанные на доменные модели (например, `calculateOrderPrice`)  
- хранилища и стейты, завязанные на конкретный домен  
- специфические для страницы компоненты и стили  
- конкретные API-клиенты (например, UserApi, OrderApi) — обычно это слой features/domain

Простой критерий:  
**Если модуль невозможно переиспользовать в другом проекте без изменения — скорее всего, ему не место в shared.**

---

## Организация структуры папок shared-layer

### Базовая структура shared

Распространенный и понятный вариант структуры:

```txt
src/
  shared/
    ui/         # Базовые UI-компоненты
    lib/        # Утилиты, хелперы, адаптеры
    api/        # Инфраструктурные клиенты и обертки
    config/     # Конфигурация
    types/      # Общие типы и контракты
    assets/     # Иконки, шрифты, статичные ресурсы
    styles/     # Глобальные стили, темы
    index.ts    # Удобные реэкспорты
```

Теперь давайте разберем каждый раздел подробнее.

### shared/ui — базовые UI-компоненты

Внутри ui обычно раскладывают компоненты по директориям:

```txt
shared/
  ui/
    Button/
      Button.tsx
      Button.module.scss
      index.ts
    Input/
      Input.tsx
      Input.module.scss
      index.ts
    Modal/
      Modal.tsx
      Modal.module.scss
      index.ts
```

Пример простого инпута:

```tsx
// shared/ui/Input/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;     // Подпись над полем
  errorText?: string; // Текст ошибки для отображения
}

export const Input: React.FC<InputProps> = ({
  label,
  errorText,
  ...rest
}) => {
  return (
    <label>
      {/* Если передали label - покажем его */}
      {label && <span>{label}</span>}
      <input {...rest} />
      {/* Если есть текст ошибки - выведем его под полем */}
      {errorText && <span style={{ color: 'red' }}>{errorText}</span>}
    </label>
  );
};
```

Здесь компонент универсален: он не знает, чей это инпут — логина, поиска или фильтра.

### shared/lib — утилиты и хелперы

В lib удобно группировать функции по смыслу.

```txt
shared/
  lib/
    format/
      formatDate.ts
      formatCurrency.ts
    validators/
      isEmail.ts
      isPhone.ts
    array/
      groupBy.ts
      chunk.ts
    dom/
      scrollToElement.ts
```

Пример утилиты:

```ts
// shared/lib/validators/isEmail.ts

// Упрощенная проверка email
export function isEmail(value: string): boolean {
  // В реальных задачах лучше использовать более аккуратные проверки
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value);
}
```

### shared/config — конфигурация

Часто сюда кладут конфиги, зависящие от окружения.

```ts
// shared/config/env.ts

// Здесь мы читаем значения из глобального объекта процесса сборки
const API_BASE_URL = process.env.API_BASE_URL ?? '';
const APP_ENV = process.env.APP_ENV ?? 'development';

// Экспортируем конфиг в виде простого объекта
export const env = {
  apiBaseUrl: API_BASE_URL,
  appEnv: APP_ENV as 'development' | 'staging' | 'production',
};
```

Такой модуль можно использовать в любом месте приложения, не привязывая его к конкретному домену.

### shared/types — общие типы

Структура может быть такой:

```txt
shared/
  types/
    id.ts
    pagination.ts
    result.ts
    common.ts
```

Пример:

```ts
// shared/types/pagination.ts

// Общая модель пагинации которая может использоваться разными списками
export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
```

---

## Правила зависимостей и импортов для shared-layer

### Направление зависимостей

Очень важный момент: слой shared — **нижний** слой архитектуры.  

Обычно зависимости выглядят так (от низкого к высокому):

- shared  
- entities / domain  
- features  
- widgets  
- pages / app

Это значит:

- **Все** слои могут зависеть от shared  
- shared **ни от кого больше не зависит** (кроме внешних библиотек)

Иначе у вас появляются циклические зависимости: shared использует domain, domain использует shared. Поддерживать такую схему сложно.

### Как проверять, что shared не зависит от верхних слоев

Есть несколько практических приемов:

1. Явное правило в код-ревью:  
   никаких импортов из `features/*`, `entities/*`, `widgets/*`, `pages/*` внутри `shared/*`.

2. ESLint / архитектурные плагины  
   Например, с помощью `eslint-plugin-boundaries` или кастомных eslint-правил можно запретить такие импорты программно.

3. Простая проверка по алиасам:  
   если у вас есть алиасы вида `@shared`, `@features`, то в коде shared разрешено импортировать только:
   - `@shared/*`
   - внешние библиотеки (`react`, `lodash` и т.п.)

Пример неправильного импорта, которого нужно избегать:

```ts
// ПЛОХО - shared не должен знать о доменных типах
import { User } from '@/entities/user';

// Такое использование приводит к сильной связности и циклам
```

---

## Экспорты и публичный API shared-layer

### Зачем нужен публичный API

Если экспортировать каждый файл по отдельности, импорты в проекте быстро становятся хаотичными.  

Лучше собрать **публичный API** shared в одном или нескольких файлах:

- `shared/index.ts` — для базового набора  
- `shared/ui/index.ts`, `shared/lib/index.ts` — для более точечных импортов

Пример:

```ts
// shared/ui/index.ts
// Здесь мы явно перечисляем все публичные UI-компоненты shared слоя
export { Button } from './Button/Button';
export { Input } from './Input/Input';
export { Modal } from './Modal/Modal';
```

```ts
// shared/lib/index.ts
export * from './format/formatDate';
export * from './format/formatCurrency';
export * from './validators/isEmail';
```

```ts
// shared/index.ts
// Собираем общедоступный API shared слоя
export * as ui from './ui';
export * as lib from './lib';
export * as types from './types';
export * as config from './config';
```

Теперь использование в другом слое может выглядеть так:

```ts
// Пример импорта в feature
import { ui, lib } from '@/shared';

const dateStr = lib.formatDate(new Date());
```

Или:

```tsx
import { Button, Input } from '@/shared/ui';
```

Так гораздо легче контролировать, что именно считается «официальной частью» shared, а что — внутренней реализацией.

### Локальный и публичный код в shared

Не все файлы внутри shared должны быть доступны наружу.  

Вы можете:

- экспортировать только стабильные, согласованные интерфейсы  
- скрывать подкапотные детали реализации внутри директории компонента/модуля

Пример структуры:

```txt
shared/
  ui/
    Button/
      Button.tsx
      useButtonStyles.ts  # Внутренний хук, не экспортируется наружу
      index.ts            # Экспорт только Button
```

```ts
// shared/ui/Button/index.ts
export { Button } from './Button';
```

Хук `useButtonStyles` остается внутренней деталью.

---

## Примеры использования shared в других слоях

### Использование в feature

Представьте, что у вас есть фича «Авторизация пользователя».  

Она может использовать компоненты и утилиты из shared.

```tsx
// features/auth/ui/LoginForm.tsx

import React, { useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { isEmail } from '@/shared/lib/validators/isEmail';

export const LoginForm: React.FC = () => {
  // Здесь мы храним состояние полей формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // А здесь - текст ошибки валидации
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Валидация email с помощью shared утилиты
    if (!isEmail(email)) {
      setError('Некорректный email');
      return;
    }

    setError(null);
    // Далее - бизнес-логика авторизации (вызов API и т.д.)
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={error ?? undefined}
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit">
        Войти
      </Button>
    </form>
  );
};
```

Здесь вы видите, как фича собирает UI из shared-компонентов и использует shared-утилиту.

### Использование shared в нескольких приложениях

Если у вас монорепозиторий с несколькими фронтенд-приложениями, shared можно вынести в отдельный пакет внутри репо:

```txt
packages/
  shared/
    src/
      ui/
      lib/
      ...
    package.json
apps/
  admin-panel/
  client-app/
```

Оба приложения устанавливают пакет `@my-org/shared` и используют его как обычную библиотеку.  

Подходы и принципы остаются теми же: shared не должен знать о конкретном приложении.

---

## Работа с типами и generic-подходом в shared

### Почему важно не тянуть доменные типы в shared

Если вы начнете импортировать типы конкретного домена в shared, он станет от них зависеть.  

Лучше использовать generic-подход: пусть shared определяет форму абстракции, но не привязывается к реализации.

Пример: универсальный DataLoader-компонент.

```tsx
// shared/ui/DataLoader/DataLoader.tsx
import React from 'react';

// Здесь мы описываем пропсы универсального компонента загрузки
interface DataLoaderProps<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  children: (data: T) => React.ReactNode;
}

export function DataLoader<T>({
  data,
  isLoading,
  error,
  children,
}: DataLoaderProps<T>) {
  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка загрузки данных</div>;
  }

  if (!data) {
    return null;
  }

  // Если данные есть - рендерим детей и передаем им data
  return <>{children(data)}</>;
}
```

А в доменном слое вы можете использовать его с любым типом:

```tsx
// features/users/ui/UsersList.tsx
import React from 'react';
import { DataLoader } from '@/shared/ui/DataLoader/DataLoader';
import type { User } from '@/entities/user';

interface UsersListProps {
  users: User[] | null;
  isLoading: boolean;
  error: Error | null;
}

export const UsersList: React.FC<UsersListProps> = (props) => {
  return (
    <DataLoader<User[]>
      data={props.users}
      isLoading={props.isLoading}
      error={props.error}
    >
      {(users) => (
        <ul>
          {users.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </DataLoader>
  );
};
```

DataLoader ничего не знает о типе User — он просто параметризуется им.

---

## Стили, темы и дизайн-система в shared

### Общий подход к стилям shared-компонентов

Shared часто становится местом, где живут базовые стили и темы.  

Типичные элементы:

- токены дизайна (цвета, отступы, типографика)  
- базовые mixin и helpers для CSS/SCSS  
- тема (light/dark) и переключение тем  
- глобальный reset/normalize

Пример токенов:

```ts
// shared/styles/tokens.ts

// Здесь мы описываем базовые значения цветов и отступов
export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  danger: '#dc2626',
  text: '#111827',
  background: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

Эти токены могут использоваться в компонентах UI или в CSS-in-JS решениях.

---

## Тестирование кода в shared-layer

### Почему тесты особенно важны для shared

Shared — слой, от которого зависят **многие** модули. Ошибка в нем бьет по всему приложению.  

Поэтому:

- утилиты и хелперы должны иметь хороший набор unit-тестов  
- сложные UI-компоненты — как минимум snapshot/interaction-тесты

Пример простого теста для утилиты:

```ts
// shared/lib/format/formatDate.test.ts
import { formatDate } from './formatDate';

describe('formatDate', () => {
  // Здесь мы проверяем работу функции на корректной дате
  it('форматирует корректную дату', () => {
    const date = new Date('2023-01-15T00:00:00Z');
    const result = formatDate(date, 'ru-RU');
    expect(result).toBe('15.01.2023');
  });

  // А здесь - поведение на некорректной строке
  it('возвращает пустую строку для некорректной даты', () => {
    const result = formatDate('not-a-date', 'ru-RU');
    expect(result).toBe('');
  });
});
```

---

## Типичные ошибки при проектировании shared-layer

### Ошибка 1: превращение shared в «свалку всего подряд»

Сценарий выглядит так:

1. «Не знаем, куда положить модуль X — давайте пока в shared».  
2. Через несколько месяцев в shared лежат и доменные сервисы, и специфические компоненты.

Как этого избежать:

- перед тем как положить что-то в shared, спросите себя:
  - это **универсально**?  
  - это можно переиспользовать в другом проекте?  
  - это не тянет за собой доменные типы и бизнес-логику?
- вводите минимум 2 пары глаз на ревью любых изменений в shared  
- регламентируйте категории: ui, lib, api, types и не выходите за их рамки

### Ошибка 2: зависимость shared от доменов

Иногда разработчики ради удобства импортируют доменные типы в shared (например, в общую таблицу, которая принимает `User`, `Order`, `Invoice` и т.д.).

Лучший путь — обобщить компонент:

- вместо `UserTable` в shared сделать `Table<T>`  
- рендерить колонки через коллбеки, а не жестко зашивать модель внутрь компонента

### Ошибка 3: слишком жирные компоненты в shared

Еще одна проблема — помещать в shared **сложно устроенные** компоненты, которые делают слишком много и завязаны на конкретное поведение.

Правильнее:

- в shared хранить базовый примитив (например, `Table`, `Modal`)  
- а доменные комбинации (например, `UserTable`, `ConfirmDeleteModal`) создавать в features/widgets

---

## Практический пример небольшой shared-layer

Чтобы все сложить в одну картинку, давайте соберем небольшой пример структуры и используем ее.

### Структура

```txt
src/
  shared/
    ui/
      Button/
        Button.tsx
        index.ts
      Input/
        Input.tsx
        index.ts
    lib/
      format/
        formatDate.ts
      validators/
        isEmail.ts
    types/
      result.ts
    config/
      env.ts
    index.ts
  features/
    auth/
      ui/
        LoginForm.tsx
```

### Реализация shared

Код Button:

```tsx
// shared/ui/Button/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  ...rest
}) => {
  // Для наглядности используем data-атрибут для стилизации
  return (
    <button
      type="button"
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  );
};
```

Код Input:

```tsx
// shared/ui/Input/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  ...rest
}) => {
  return (
    <label>
      {label && <span>{label}</span>}
      <input {...rest} />
    </label>
  );
};
```

Утилита:

```ts
// shared/lib/validators/isEmail.ts
export function isEmail(value: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value);
}
```

Публичные экспорты:

```ts
// shared/ui/index.ts
export { Button } from './Button/Button';
export { Input } from './Input/Input';
```

```ts
// shared/lib/index.ts
export * from './validators/isEmail';
export * from './format/formatDate';
```

```ts
// shared/index.ts
export * from './ui';
export * from './lib';
export * from './types';
export * from './config';
```

### Использование в feature

```tsx
// features/auth/ui/LoginForm.tsx

import React, { useState } from 'react';
import { Button, Input, isEmail } from '@/shared';

export const LoginForm: React.FC = () => {
  // Состояние полей формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Ошибка валидации
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isEmail(email)) {
      setError('Введите корректный email');
      return;
    }

    setError(null);
    // Здесь может быть вызов доменного сервиса авторизации
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <Button type="submit">
        Войти
      </Button>
    </form>
  );
};
```

Как видите, shared предоставляет кирпичики, а фича из них собирает форму и навешивает поведение.

---

Слой shared (shared-layer) — это базовый фундамент архитектуры, который позволяет:

- выделить действительно общие для проекта части кода  
- снижать дублирование и связанность  
- ускорять разработку за счет готовых примитивов

Ключевые моменты, которые важно соблюдать:

- shared не зависит от верхних слоев и доменов  
- в shared лежат только универсальные, переиспользуемые сущности  
- публичный API shared должен быть четко определен  
- любые изменения в shared требуют повышенного внимания и тестов

Если вы будете относиться к shared как к внутренней библиотеке, а не к свалке, он станет сильной стороной архитектуры, а не источником постоянных проблем.

---

## Частозадаваемые технические вопросы

### Как лучше разделить shared/lib на подмодули чтобы не создавать «спагетти» из утилит

Разбивайте lib по функциональным областям а не по типу файла. Например format validators array dom api и т.д. Внутри каждого раздела следите чтобы утилиты были независимы друг от друга. Если функция используется только одной другой утилитой держите ее рядом в том же файле но не выносите в общий helpers чтобы не плодить микромодули без явного смысла.

### Как ограничить импорт внутренних файлов shared и заставить всех использовать только публичный API

Используйте алиасы сборщика. Настройте алиас @shared который указывает на shared/index.ts. В eslint добавьте правило запрещающее относительные импорты из shared вне самого shared. В TypeScript можно использовать paths и выставить только индекс как доступный путь. Это заставит разработчиков импортировать только то что явно экспортировано из публичного API.

### Как в shared организовать поддержку нескольких тем оформления без привязки к конкретным доменам

В shared/styles заведите токены темы и интерфейс Theme. Реализуйте ThemeProvider который через контекст React отдает текущую тему. Компоненты shared/ui берут цвета и размеры из контекста а не напрямую. Доменные слои могут подставлять разные темы но сам shared об этом не знает и оперирует только интерфейсом Theme.

### Как поступать с тяжеловесными зависимостями в shared например date-fns или chart библиотеки

Если библиотека используется многими слоями имеет смысл держать ее обертку в shared/lib чтобы унифицировать конфигурацию. Но не стоит напрямую реэкспортировать всю библиотеку наружу. Вместо этого сделайте небольшие адаптеры например formatDate parseDate и т.д. Тогда вы сможете сменить библиотеку внутри shared без затрагивания всего кода.

### Как версионировать shared если его использует несколько приложений в монорепозитории

В монорепо используйте отдельный пакет shared с собственным package.json и версией. Приложения зависят от shared по semver. Для критичных изменений в shared поднимайте major версию и мигрируйте приложения постепенно. Автоматизируйте проверку с помощью CI который собирает все приложения при изменениях в shared чтобы не допускать скрытых несовместимостей.