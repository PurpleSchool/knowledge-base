---
metaTitle: Тестирование в FSD testing
metaDescription: Разбор подхода к тестированию в архитектуре FSD - уровни тестов примеры реализации и настройка окружения
author: Олег Марков
title: Тестирование в FSD testing в проектах на фронтенде
preview: Разбираем как организовать тестирование в архитектуре FSD - от структуры файлов и видов тестов до примеров и рекомендаций по практике
---

## Введение

Тестирование в архитектуре Feature Sliced Design (FSD) часто вызывает вопросы именно на уровне организации: где хранить тесты, что тестировать на каком слое, как не превратить проект в хаос из тестовых файлов. Смотрите, здесь мы шаг за шагом разберем, как встроить тестирование в FSD так, чтобы структура оставалась прозрачной, а тесты реально помогали поддерживать проект.

Мы пройдемся по уровням архитектуры, договоримся, что тестируем на каждом уровне, и закрепим это конкретными примерами. Я покажу вам, как можно организовать окружение, как писать юнит‑тесты для сущностей и фич, как проверять интеграцию между слоями и как подходить к UI‑тестам страниц.  

Ниже я буду опираться на классический FSD для фронтенда (layers: shared, entities, features, widgets, pages, app), но сами принципы легко адаптируются под ваш конкретный стек.

## Роль тестирования в FSD

### Зачем FSD заморачивается с тестами

В FSD основная идея — четкое разделение областей ответственности. Это идеально ложится на тестирование: каждый слой можно тестировать изолированно, с понятными границами.

Давайте перечислим, какие задачи решает тестирование в контексте FSD:

- Защищает инварианты домена на уровне entities  
- Гарантирует стабильность пользовательских сценариев на уровне features  
- Проверяет корректную сборку интерфейса на уровне widgets и pages  
- Позволяет безопасно рефакторить слои, не боясь сломать поведение в других местах  
- Делает поведение модулей явным, через тесты вы как бы документируете их контракт

Если держать это в голове, становится проще отвечать на вопрос «что именно тестировать и на каком уровне».

### Какие типы тестов обычно применяют

Чаще всего в FSD‑проектах используют такой набор:

- Юнит‑тесты для бизнес‑логики и утилит  
- Тесты на кастомные хуки и чистые функции в UI‑части  
- Интеграционные тесты для взаимодействия слоев (feature + entity, widget + features)  
- Компонентные тесты UI (с помощью React Testing Library или аналогов)  
- E2E‑тесты для ключевых пользовательских потоков (на уровне pages/app)

Вы можете начать хотя бы с юнит‑тестов для shared и entities, а затем постепенно поднимать уровень покрытия до features и widgets.

## Структура тестов в FSD

### Где хранить тесты

Самый практичный подход, который хорошо сочетается с FSD, — хранить тесты рядом с кодом (co-located tests).  

Пример структуры:

- `src/shared/lib/format-date/format-date.ts`  
- `src/shared/lib/format-date/format-date.test.ts`  

- `src/entities/user/model/user.ts`  
- `src/entities/user/model/user.test.ts`  

- `src/features/auth-by-email/model/login-form.ts`  
- `src/features/auth-by-email/model/login-form.test.ts`  

Обратите внимание:  
- Тест лежит рядом с модулем — не нужно искать его по всему проекту  
- Имя файла совпадает с исходным, добавляется только `.test`  
- Можно дополнительно группировать тесты внутри директории `__tests__`, если вам так удобнее, но в FSD это реже нужно

### Привязка типов тестов к слоям

Давайте разберем, что обычно тестируют на каждом уровне.

#### Слой shared

Здесь мы проверяем:

- Чистые функции и утилиты  
- Адаптеры API (если они без привязки к домену)  
- Кастомные хуки, которые не завязаны на конкретную сущность/фичу  
- UI‑компоненты общего назначения (кнопки, инпуты, модальные окна)

Пример: `shared/lib`, `shared/ui`, `shared/api`.

#### Слой entities

Это сердце бизнес‑логики. Здесь тестируем:

- Модели данных и их инварианты  
- Селекторы и вычисления на уровне сущности  
- CRUD‑операции над сущностями  
- Примитивные сервисы, работающие с конкретной моделью

#### Слой features

На этом уровне мы проверяем:

- Завершенные пользовательские сценарии (логин, добавление товара в корзину, лайк поста)  
- Связку UI + бизнес‑логика, если она локальна в фиче  
- Взаимодействие с entities и сервисами  
- Форма с валидацией, локальный state и отправка запросов

#### Слой widgets и pages

Здесь уже больше интеграция:

- Сборка готовых кусочков интерфейса из нескольких features и entities  
- Роутинг и состояние, агрегирующее несколько доменов  
- Поведение страницы в целом — на уровне E2E или «толстых» интеграционных тестов

## Настройка окружения для тестов

### Выбор инструмента тестирования

В экосистеме фронтенда под FSD чаще всего берут:

- Jest или Vitest — для юнит и интеграционных тестов  
- React Testing Library — для тестирования компонентов и UI логики  
- Cypress, Playwright или WebdriverIO — для E2E тестов

Давайте я покажу на примере Jest + React Testing Library, так как это один из самых распространенных вариантов.

### Базовый конфиг Jest для FSD‑проекта

Предположим, у вас React‑проект с TypeScript и FSD‑структурой. Конфигурация может выглядеть так:

```js
// jest.config.cjs
module.exports = {
  // Корень исходников
  roots: ['<rootDir>/src'],

  // Шаблон поиска тестов
  testMatch: ['**/*.test.[jt]s?(x)'],

  // Пресет для TS и React
  preset: 'ts-jest',

  // Эмуляция DOM
  testEnvironment: 'jsdom',

  // Настройка модулей
  moduleNameMapper: {
    // Алиасы слоев FSD
    '^shared/(.*)$': '<rootDir>/src/shared/$1',
    '^entities/(.*)$': '<rootDir>/src/entities/$1',
    '^features/(.*)$': '<rootDir>/src/features/$1',
    '^widgets/(.*)$': '<rootDir>/src/widgets/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
  },

  // Файлы с общими настройками тестов
  setupFilesAfterEnv: ['<rootDir>/config/jest/setup-tests.ts'],
};
```

В `setup-tests.ts` можно подключить React Testing Library и нужные полифилы.

```ts
// config/jest/setup-tests.ts

// Расширения для удобных матчеров
import '@testing-library/jest-dom';

// Здесь вы можете добавить глобальные моки
// Например, мок локального хранилища
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
});
```

Комментарии помогают видеть, где встраивается инфраструктура проекта.

### Виртуальные модули и алиасы

В FSD часто используют алиасы по слоям, чтобы не писать длинные относительные пути. Важно, чтобы тестовый раннер понимал эти алиасы так же, как ваш bundler.

Например, если в `tsconfig.json` у вас прописано:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "shared/*": ["shared/*"],
      "entities/*": ["entities/*"],
      "features/*": ["features/*"],
      "widgets/*": ["widgets/*"],
      "pages/*": ["pages/*"]
    }
  }
}
```

Тогда в `jest.config.cjs` или конфиге Vitest вы настраиваете `moduleNameMapper` аналогично, чтобы импорт `features/auth-by-email` корректно резолвился в тестах.

## Юнит‑тесты в FSD

### Что считать юнитом в контексте FSD

Юнит‑тест — это максимально изолированный тест, который:

- Проверяет один модуль или функцию  
- Не зависит от реального сети, файловой системы, БД  
- Не рендерит целый UI, если можно протестировать чистую логику

В FSD юнитом часто является:

- Чистая функция (`shared/lib`, селекторы, адаптеры)  
- Метод сущности (`entities/user/model`)  
- Хук, который не зависит от внешних сервисов  
- Малый UI‑компонент без сложной интеграции

### Юнит‑тесты для shared/lib

Давайте разберемся на примере утилиты форматирования даты.

```ts
// src/shared/lib/format-date/format-date.ts

// Здесь мы описываем форматтер даты, который не зависит от React
export function formatDate(date: Date, locale = 'ru-RU'): string {
  // Если дата не передана, бросаем ошибку — это инвариант функции
  if (!date) {
    throw new Error('Date is required');
  }

  // Используем стандартный Intl API
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
```

Теперь вы увидите, как это выглядит в тесте:

```ts
// src/shared/lib/format-date/format-date.test.ts
import { formatDate } from './format-date';

describe('formatDate', () => {
  test('форматирует дату в формате DD.MM.YYYY', () => {
    // Здесь мы создаем конкретную дату
    const date = new Date(2020, 0, 15); // 15 января 2020

    // Вызываем функцию и проверяем строку
    const result = formatDate(date, 'ru-RU');

    // Проверяем ожидаемый формат
    expect(result).toBe('15.01.2020');
  });

  test('бросает ошибку если дата не передана', () => {
    // Оборачиваем вызов в функцию чтобы jest мог поймать ошибку
    const call = () => formatDate(null as unknown as Date);

    // Ожидаем что будет выброшена ошибка с конкретным текстом
    expect(call).toThrow('Date is required');
  });
});
```

Обратите внимание, что тест не зависит ни от FSD слоев, ни от React. Это чистый юнит‑тест.

### Юнит‑тесты для entities

Сущности в FSD часто содержат бизнес‑логику. Смотрите, я покажу вам простой пример с сущностью `User`.

```ts
// src/entities/user/model/user.ts

// Тип описывает минимальный набор данных пользователя
export interface User {
  id: string;
  name: string;
  age: number;
}

// Здесь мы описываем инварианты для возраста пользователя
export function createUser(data: Omit<User, 'id'>): User {
  // Не позволяем создавать пользователя младше 14 лет
  if (data.age < 14) {
    throw new Error('User must be at least 14 years old');
  }

  // В реальном коде id сгенерирует uuid
  return {
    id: 'generated-id',
    ...data,
  };
}

// Здесь мы добавляем чистую функцию валидации для формы
export function isAdult(user: User): boolean {
  return user.age >= 18;
}
```

Теперь давайте посмотрим, какие тесты имеет смысл написать:

```ts
// src/entities/user/model/user.test.ts
import { createUser, isAdult } from './user';

describe('entities/user model', () => {
  test('createUser создает пользователя со сгенерированным id', () => {
    // Описываем входные данные без id
    const data = { name: 'Alex', age: 20 };

    // Создаем пользователя
    const user = createUser(data);

    // Проверяем что id появился
    expect(user.id).toBeDefined();

    // Проверяем что остальные поля скопированы
    expect(user.name).toBe('Alex');
    expect(user.age).toBe(20);
  });

  test('createUser не позволяет создавать пользователей младше 14 лет', () => {
    // Описываем заведомо некорректные данные
    const data = { name: 'Max', age: 12 };

    // Ожидаем что создание пользователя завершится ошибкой
    const create = () => createUser(data as any);

    expect(create).toThrow('User must be at least 14 years old');
  });

  test('isAdult корректно определяет совершеннолетие', () => {
    // Создаем двух пользователей с разным возрастом
    const user17 = { id: '1', name: 'Kate', age: 17 };
    const user18 = { id: '2', name: 'John', age: 18 };

    // Проверяем что только второй считается совершеннолетним
    expect(isAdult(user17)).toBe(false);
    expect(isAdult(user18)).toBe(true);
  });
});
```

Здесь мы тестируем бизнес‑правила сущности (`инварианты`) и чистые функции. Это та логика, которая дольше всего живет в проекте и чаще всего ломается при рефакторинге.

### Юнит‑тесты для hooks и модельных слоев

В FSD логика фич часто выносится в `model` и оформляется как хуки или чистые функции. Хорошая практика — тестировать модель отдельно от UI‑обертки.

Допустим, есть хук для работы с локальным счетчиком в фиче:

```ts
// src/features/counter/model/use-counter.ts
import { useState } from 'react';

// Здесь мы описываем максимально простой хук счетчика
export function useCounter(initial = 0) {
  const [value, setValue] = useState(initial);

  // Увеличиваем значение
  const inc = () => setValue((prev) => prev + 1);

  // Уменьшаем значение
  const dec = () => setValue((prev) => prev - 1);

  // Сбрасываем к начальному значению
  const reset = () => setValue(initial);

  return {
    value,
    inc,
    dec,
    reset,
  };
}
```

Покажу вам, как протестировать такой хук с помощью React Testing Library Hooks API (или аналогов):

```ts
// src/features/counter/model/use-counter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './use-counter';

describe('useCounter', () => {
  test('возвращает начальное значение', () => {
    // Рендерим хук с начальными параметрами
    const { result } = renderHook(() => useCounter(10));

    // Проверяем что значение равно 10
    expect(result.current.value).toBe(10);
  });

  test('инкремент увеличивает значение', () => {
    const { result } = renderHook(() => useCounter(0));

    // Оборачиваем изменения состояния в act
    act(() => {
      result.current.inc();
    });

    // Проверяем что значение стало 1
    expect(result.current.value).toBe(1);
  });

  test('reset возвращает значение к начальному', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.inc();
      result.current.inc();
      result.current.reset();
    });

    // Проверяем что после нескольких изменений значение вернулось к 5
    expect(result.current.value).toBe(5);
  });
});
```

Здесь мы все еще на уровне юнит‑теста, потому что хук не зависит от внешних API, роутера или контекстов.

## Интеграционные тесты в FSD

### Зачем они нужны именно в FSD

В FSD очень важно, как слои взаимодействуют между собой. Можно иметь идеально протестированные сущности и фичи по отдельности, но получить неожиданные ошибки на уровне их сборки в widgets и pages. Интеграционные тесты помогают проверить именно «стыки».

Интеграционный тест:

- Затрагивает несколько модулей сразу  
- Может работать с реальными зависимостями (например, реальным стором)  
- Но при этом обычно не поднимает весь стек (например, не ходит в настоящий backend)

### Пример интеграционного теста для feature + entity

Представим фичу «лайк поста» (`features/toggle-like`). Она зависит от сущности `Post` и API, но в тесте мы замокаем сеть.

```ts
// src/features/toggle-like/model/toggle-like.ts
import { useState } from 'react';

// Простая имитация API запроса
async function apiToggleLike(postId: string, liked: boolean): Promise<boolean> {
  // В реальном коде здесь будет HTTP запрос
  return !liked;
}

export function useToggleLike(initialLiked: boolean, postId: string) {
  const [liked, setLiked] = useState(initialLiked);

  const toggle = async () => {
    // Делаем запрос к API
    const next = await apiToggleLike(postId, liked);
    // Обновляем локальное состояние
    setLiked(next);
  };

  return {
    liked,
    toggle,
  };
}
```

Теперь давайте разберемся, как протестировать, что фича корректно обновляет состояние при успешном ответе API. Для этого замокаем `apiToggleLike`.

```ts
// src/features/toggle-like/model/toggle-like.test.ts
import { renderHook, act } from '@testing-library/react';
import * as moduleUnderTest from './toggle-like';

describe('useToggleLike', () => {
  test('переключает состояние liked после успешного вызова API', async () => {
    // Здесь мы мокаем внутреннюю функцию apiToggleLike
    const apiMock = jest
      .spyOn(moduleUnderTest as any, 'apiToggleLike')
      // Возвращаем обещание с противоположным значением
      .mockResolvedValueOnce(true);

    // Рендерим хук с начальными параметрами
    const { result } = renderHook(() =>
      moduleUnderTest.useToggleLike(false, 'post-1'),
    );

    // Выполняем toggle внутри act
    await act(async () => {
      await result.current.toggle();
    });

    // Проверяем что liked поменялся на true
    expect(result.current.liked).toBe(true);

    // Проверяем что API был вызван с корректными аргументами
    expect(apiMock).toHaveBeenCalledWith('post-1', false);
  });
});
```

Такой тест уже интеграционный: мы проверяем связку между локальным состоянием, вызовом API и обновлением модели.

### Интеграционный тест для виджета

Теперь давайте посмотрим интеграцию на уровне виджета. Допустим, виджет `UserProfile` собирает данные о пользователе и его постах:

```tsx
// src/widgets/user-profile/ui/user-profile.tsx
import { UserInfo } from 'entities/user';
import { UserPosts } from 'entities/post';
import { useUserProfile } from '../model/use-user-profile';

export function UserProfileWidget() {
  // Получаем данные пользователя и постов из модельного слоя виджета
  const { user, posts, isLoading } = useUserProfile();

  if (isLoading) {
    // Показываем индикатор загрузки
    return <div>Loading...</div>;
  }

  if (!user) {
    // Обрабатываем кейс когда пользователь не найден
    return <div>User not found</div>;
  }

  return (
    <section>
      {/* Отображаем информацию о пользователе */}
      <UserInfo user={user} />
      {/* Отображаем список постов пользователя */}
      <UserPosts posts={posts} />
    </section>
  );
}
```

Тест для такого виджета может выглядеть так:

```tsx
// src/widgets/user-profile/ui/user-profile.test.tsx
import { render, screen } from '@testing-library/react';
import * as model from '../model/use-user-profile';
import { UserProfileWidget } from './user-profile';

describe('UserProfileWidget', () => {
  test('отображает информацию о пользователе и его постах', () => {
    // Мокаем модельный хук виджета
    jest.spyOn(model, 'useUserProfile').mockReturnValue({
      user: { id: '1', name: 'Alex', age: 20 },
      posts: [{ id: 'p1', title: 'First post', content: 'Hello' }],
      isLoading: false,
    });

    // Рендерим виджет
    render(<UserProfileWidget />);

    // Проверяем что появилась информация о пользователе
    expect(screen.getByText('Alex')).toBeInTheDocument();

    // Проверяем что список постов отображается
    expect(screen.getByText('First post')).toBeInTheDocument();
  });

  test('отображает "Loading..." пока данные загружаются', () => {
    jest.spyOn(model, 'useUserProfile').mockReturnValue({
      user: null,
      posts: [],
      isLoading: true,
    });

    render(<UserProfileWidget />);

    // Проверяем что отображается индикатор загрузки
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

Здесь вы проверяете не только виджет сам по себе, но и его контракт с моделью: какие состояния он умеет обрабатывать (loading, успешная загрузка, отсутствие данных).

## Тестирование UI в FSD

### Подход к тестированию UI‑компонентов

В архитектуре FSD UI‑компоненты обычно живут в:

- `shared/ui` — переиспользуемые компоненты без привязки к домену  
- `entities/*/ui` — представление конкретной сущности  
- `features/*/ui` — UI для фичи, часто завязанный на модель слоя фичи  
- `widgets/*/ui` и `pages/*/ui` — сборка интерфейса

Для компонентных тестов удобно использовать React Testing Library. Она ориентируется на поведение с точки зрения пользователя (поиск по тексту, ролям), а не на внутренние детали компонент.

### Пример: тест shared UI компонента

Смотрите, я покажу вам простой компонент кнопки:

```tsx
// src/shared/ui/button/button.tsx
import { ButtonHTMLAttributes } from 'react';

// Здесь мы расширяем стандартный HTML атрибуты и добавляем prop variant
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  // Определяем CSS класс в зависимости от варианта
  const className = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <button className={className} {...rest}>
      {/* Отображаем содержимое кнопки */}
      {children}
    </button>
  );
}
```

Теперь давайте посмотрим, как протестировать внешний контракт компонента:

```tsx
// src/shared/ui/button/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  test('рендерит текст и вызывает обработчик клика', () => {
    // Создаем мок обработчика
    const onClick = jest.fn();

    // Рендерим кнопку с текстом и обработчиком
    render(<Button onClick={onClick}>Click me</Button>);

    // Проверяем что текст отобразился
    const button = screen.getByText('Click me');

    // Симулируем клик
    fireEvent.click(button);

    // Проверяем что обработчик был вызван
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('применяет класс для варианта secondary', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByText('Secondary');

    // Проверяем что у кнопки есть нужный CSS класс
    expect(button).toHaveClass('btn-secondary');
  });
});
```

Мы не проверяем внутреннюю реализацию, а смотрим на поведение: текст, обработчики, примененные классы.

### Тестирование UI в features

Фичи часто включают форму и взаимодействие с пользователем. Давайте разберемся на примере фичи «логин по email».

```tsx
// src/features/auth-by-email/ui/login-form.tsx
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  // Локальное состояние полей формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Ошибка при неудачной попытке входа
  const [error, setError] = useState<string | null>(null);

  // Обработчик отправки формы
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Очищаем ошибку перед новой попыткой
      setError(null);

      // Вызываем переданный обработчик
      await onSubmit(email, password);
    } catch (e) {
      // В реальном коде мы можем анализировать ошибку
      setError('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Поле ввода email */}
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Поле ввода пароля */}
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Кнопка отправки формы */}
      <button type="submit">Login</button>

      {/* Сообщение об ошибке */}
      {error && <div>{error}</div>}
    </form>
  );
}
```

Покажу вам, как протестировать сценарий успешного и неуспешного логина:

```tsx
// src/features/auth-by-email/ui/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  test('вызывает onSubmit с корректными данными', async () => {
    // Создаем мок обработчика который возвращает завершенное обещание
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={onSubmit} />);

    // Вводим email и пароль
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret' },
    });

    // Отправляем форму
    fireEvent.click(screen.getByText('Login'));

    // Ждем пока промис обработчика завершится
    await waitFor(() => {
      // Проверяем что onSubmit вызван с нужными аргументами
      expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'secret');
    });
  });

  test('отображает ошибку если onSubmit выбрасывает исключение', async () => {
    // Создаем мок обработчика который возвращает отклоненное обещание
    const onSubmit = jest.fn().mockRejectedValue(new Error('Invalid'));

    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByText('Login'));

    // Ждем пока компонент обновит состояние ошибки
    await waitFor(() => {
      // Проверяем что текст ошибки появился
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });
});
```

Этот тест покрывает поведение фичи: ввод данных, отправка формы, обработка ошибок.

## E2E‑тесты и FSD

### Как E2E сочетаются с уровнями FSD

E2E‑тесты обычно пишут на уровне:

- `pages` — проверяются конкретные страницы  
- `app` — проверяются глобальные флоу (регистрация, покупка, профиль)

При этом структура самих E2E‑тестов может быть вынесена в отдельную папку `tests/e2e` или `e2e`, она не обязана повторять FSD дословно. Главное — вы мысленно привязываете сценарии к страницам и фичам.

Например:

- Тест «Пользователь может залогиниться» — покрывает фичу `auth-by-email` на странице `login`  
- Тест «Пользователь может добавить товар в корзину» — покрывает `cart` и `product` на странице `product-details`

### Пример E2E‑теста (на примере Playwright)

Представим страницу логина с фичей `auth-by-email`. Тест может выглядеть так:

```ts
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('пользователь может авторизоваться по email и паролю', async ({ page }) => {
  // Открываем страницу логина
  await page.goto('http://localhost:3000/login');

  // Вводим email и пароль
  await page.getByPlaceholder('Email').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('secret');

  // Нажимаем кнопку входа
  await page.getByRole('button', { name: 'Login' }).click();

  // Ждем перехода на главную страницу
  await page.waitForURL('http://localhost:3000/');

  // Проверяем что отображается имя пользователя
  await expect(page.getByText('Hello test@example.com')).toBeVisible();
});
```

Здесь вы проверяете весь стек целиком, включая роутинг, фичу авторизации и отображение результата. Важно не пытаться E2E‑тестами покрыть все подряд — оставьте им наиболее критичные сценарии.

## Практические рекомендации по тестированию в FSD

### Что обязательно тестировать, а что можно пропустить

Чтобы не утонуть в количестве тестов, вы можете придерживаться таких приоритетов:

1. Сначала покрыть тестами бизнес‑инварианты в `entities`  
2. Затем — ключевые пользователские сценарии в `features`  
3. После этого — общие утилиты и сложные UI‑компоненты в `shared`  
4. Для `widgets` и `pages` — только критичные сценарии и проблемные зоны

Можно не тестировать:

- Тривиальную верстку без логики  
- Простые обертки, которые не добавляют поведения  
- Логику, которую уже надежно покрывает сторонняя библиотека (если вы ею просто пользуетесь)

### Чего лучше избегать

Есть несколько типичных ошибок при тестировании FSD:

- Тестировать внутренние детали компонент (конкретные имена классов, приватные функции)  
- Завязываться на реализацию вместо контракта (тесты начинают падать при безобидном рефакторинге)  
- Мешать слои в тестах: например, тестить фичу, используя реальные API‑запросы  
- Дублировать E2E‑сценарии в виде десятков интеграционных тестов

Старайтесь держать тестовый код на том же уровне абстракции, что и продукционный: если модуль работает с сущностями — тест говорит на «языке сущностей», если это фича — на языке пользовательских сценариев.

### Как постепенно внедрять тестирование в существующий FSD‑проект

Если у вас уже есть проект без тестов, вы можете начать так:

1. Выберите одну важную сущность в `entities` и покройте ее модель первыми юнит‑тестами.  
2. Найдите одну критичную фичу (например, логин или оформление заказа) и добавьте интеграционные тесты и/или компонентные тесты UI.  
3. Настройте базовый тестовый раннер (Jest или Vitest) и включите запуск тестов в CI.  
4. Введите правило: для нового кода в `entities` и `features` нужны хотя бы базовые тесты.  
5. Постепенно рефакторьте старый код: когда меняете модуль, добавляйте к нему тесты.

Так вы будете двигаться к адекватному покрытию без «переписывания половины проекта».

---

## Заключение

Тестирование в архитектуре Feature Sliced Design естественно вытекает из самого подхода к организации кода. Каждый слой FSD задает свои границы ответственности, а тесты лишь закрепляют эти границы и проверяют, что модули ведут себя согласно задуманному контракту.

Если кратко:

- `shared` — тестируем утилиты, адаптеры и общие компоненты  
- `entities` — защищаем доменные инварианты и модели  
- `features` — проверяем завершенные пользовательские сценарии  
- `widgets` и `pages` — контролируем интеграцию и глобальные потоки  
- E2E — оставляем для самых важных сценариев, чтобы убедиться, что все слои FSD работают вместе

Смотрите на тестирование как на продолжение архитектуры: хорошо выстроенные слои дают вам понятные юниты для тестов, а хорошие тесты позволяют безопасно развивать архитектуру, не ломая существующее поведение.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как тестировать селекторы и Redux‑слой в FSD

Тестируйте селекторы как чистые функции: создайте фиктивный state, вызовите селектор и проверьте результат. Для редьюсеров и слайсов можно писать юнит‑тесты, которые передают текущее состояние и action, а затем сравнивают новое состояние с ожидаемым.

### Как организовать моки API в FSD‑проекте

Вынесите моки в отдельный слой, например `shared/api/mocks`, или используйте MSW. В тестах импортируйте моки через алиасы слоев, чтобы не ломать FSD‑структуру. Для unit и интеграционных тестов чаще всего достаточно моков на уровне модулей (через jest.mock или аналогичные механизмы).

### Как разделять тесты по типам unit интеграционные и e2e

Внутри FSD это удобно делать по директориям и именованию файлов. Например, `*.test.ts` для юнит/интеграционных, `*.spec.ts` для компонентных, а E2E вынести в отдельную директорию `e2e`. На уровне CI вы можете запускать разные группы тестов разными командами.

### Как запускать тесты для одного слоя FSD

Используйте шаблоны файлов или директории. Например, для Jest можно запустить `jest src/entities` чтобы выполнить все тесты из слоя entities, или `jest features/auth-by-email` чтобы протестировать только фичу логина. Аналогично настраиваются фильтры в Vitest и других раннерах.

### Что делать если тесты сильно завязаны на реализацию и часто ломаются

Постепенно переписывайте такие тесты на поведенческий стиль. Для UI переходите к React Testing Library и проверке по тексту, ролям и событиям. Для логики убирайте проверки внутренних полей и оставляйте только публичный контракт: входные данные и ожидаемый результат. Начните с самых проблемных и часто падающих тестов.