---
metaTitle: Тестирование в Feature-Sliced Design - практическое руководство
metaDescription: Разбираем как организовать тестирование в проекте на Feature-Sliced Design - от юнит тестов до интеграционных и контрактных тестов
author: Олег Марков
title: Тестирование в Feature-Sliced Design - testing в Feature Sliced архитектуре
preview: Вы узнаете как выстроить систему тестирования в проекте по Feature Sliced Design - какие уровни покрывать и как изолировать слои с помощью тестов
---

## Введение

Тестирование в проектах с архитектурой Feature-Sliced Design (FSD) подчиняется тем же общим принципам, что и в других фронтенд-приложениях, но есть один важный акцент: вы тестируете не просто компоненты, а слои и слайсы ответственности.

Вам важно не только проверить, что отдельная кнопка работает, но и то, что:

- фича корректно использует сущности;
- страницы собирают фичи и виджеты без лишних связей;
- процессы и апп-слой остаются максимально «тонкими» и проверяемыми.

Смотрите, я приведу практическую схему, как выстроить тесты в FSD-проекте, где их располагать в структуре, что именно тестировать на каждом уровне и какие типичные ошибки здесь возникают.

## Базовые принципы тестирования в Feature-Sliced Design

### Соответствие тестов слоям и слайсам

Главная идея: тесты живут там же, где живет код, который они проверяют. То есть:

- тесты фичи — в слайсе `features/...`;
- тесты сущности — в `entities/...`;
- тесты виджета — в `widgets/...`;
- тесты страницы — в `pages/...`;
- инфраструктурные и общие утилиты — в `shared/...`.

Это помогает вам:

- быстрее находить тест, когда меняете код;
- держать тесты в одном контексте с бизнес-логикой;
- избегать гигантской папки `__tests__` без структуры.

Чаще всего используются два подхода:

1. Тесты рядом с файлами:
   - `feature-name/model/someSlice.ts`
   - `feature-name/model/someSlice.test.ts`

2. Тесты в подпапках:
   - `feature-name/model/someSlice.ts`
   - `feature-name/model/__tests__/someSlice.test.ts`

Оба варианта допустимы. Главное — быть последовательными в рамках проекта.

### Что тестировать на каждом уровне

Чтобы не возникало хаоса, полезно мысленно «привязать» типы тестов к слоям:

- `shared`  
  - утилиты — юнит-тесты;
  - UI-кит — визуальные/скриншотные и компонентные тесты.
- `entities`  
  - доменные модели и селекторы — юнит-тесты;
  - простые контейнеры — компонентные тесты.
- `features`  
  - публичный API фичи (фасад) — интеграционные и компонентные тесты;
  - бизнес-правила — юнит- и интеграционные тесты.
- `widgets`  
  - сборка нескольких фич и сущностей — в основном интеграционные и компонентные тесты.
- `pages`  
  - E2E и интеграционные тесты на сценарий страницы;
  - минимальное количество логики, поэтому мало юнит-тестов.
- `app`  
  - базовая интеграция роутинга, сторов, провайдеров;
  - чаще проверяется через E2E и smoke-тесты.

Теперь давайте подробно разберем подход к каждому слою.

## Организация структуры тестов в FSD-проекте

### Пример структуры проекта с тестами

Давайте посмотрим условный пример структуры:

```text
src/
  app/
    index.tsx
    providers/
      store.ts
      router.tsx
      __tests__/
        router.test.tsx
  pages/
    profile/
      ui/
        ProfilePage.tsx
        ProfilePage.test.tsx
  widgets/
    sidebar/
      ui/
        Sidebar.tsx
        Sidebar.test.tsx
  features/
    auth-by-username/
      model/
        slice.ts
        selectors.ts
        __tests__/
          slice.test.ts
          selectors.test.ts
      ui/
        LoginForm.tsx
        LoginForm.test.tsx
  entities/
    user/
      model/
        userSlice.ts
        __tests__/
          userSlice.test.ts
      ui/
        UserAvatar.tsx
        UserAvatar.test.tsx
  shared/
    lib/
      date/
        formatDate.ts
        formatDate.test.ts
    ui/
      Button/
        Button.tsx
        Button.test.tsx
```

Смотрите, здесь тесты находятся в тех же слоях и слайсах, что и основной код. Это упрощает навигацию и помогает держать слои изолированными: вы сразу видите, какие зависимости тестируются.

### Общие правила именования и запуска

Рекомендуется:

- использовать суффиксы `.test` или `.spec`;
- одинаково называть файл модуля и файл теста, чтобы IDE легко искала пары;
- настроить тестовый раннер (например, Jest или Vitest) на поиск файлов по маске `**/*.test.{ts,tsx,js,jsx}`;

Пример конфигурации Jest (TypeScript + React):

```ts
// jest.config.ts
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",                    // Тестируем React-компоненты
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],    // Ищем файлы с окончанием .test.ts / .test.tsx
  setupFilesAfterEnv: ["<rootDir>/config/jest/setupTests.ts"],
  moduleNameMapper: {
    "^app/(.*)$": "<rootDir>/src/app/$1",
    "^pages/(.*)$": "<rootDir>/src/pages/$1",
    "^widgets/(.*)$": "<rootDir>/src/widgets/$1",
    "^features/(.*)$": "<rootDir>/src/features/$1",
    "^entities/(.*)$": "<rootDir>/src/entities/$1",
    "^shared/(.*)$": "<rootDir>/src/shared/$1",
  },
};

export default config;
```

Комментарии поясняют, что делает каждая настройка, чтобы вы могли адаптировать конфиг под свою структуру.

## Тестирование слоя shared

### Юнит-тесты утилит

Слой `shared/lib` обычно содержит чистые функции, которые идеально подходят для юнит-тестов.

Посмотрите на пример:

```ts
// shared/lib/date/formatDate.ts

export function formatDate(date: Date, locale: string = "ru-RU"): string {
  // Функция форматирует дату в строку с учетом локали
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
```

Теперь покажу вам тест:

```ts
// shared/lib/date/formatDate.test.ts

import { formatDate } from "./formatDate";

describe("formatDate", () => {
  test("форматирует дату в формате ДД.ММ.ГГГГ для ru-RU", () => {
    // Создаем фиксированную дату, чтобы тест не зависел от текущего времени
    const date = new Date("2023-01-15T00:00:00.000Z");

    // Вызываем функцию форматирования
    const result = formatDate(date, "ru-RU");

    // Проверяем ожидаемый формат строки
    expect(result).toBe("15.01.2023");
  });

  test("использует локаль по умолчанию ru-RU", () => {
    const date = new Date("2023-01-15T00:00:00.000Z");

    // Вызываем функцию без передачи локали
    const result = formatDate(date);

    // Ожидаем, что поведение будет таким же, как при явной передаче "ru-RU"
    expect(result).toBe("15.01.2023");
  });
});
```

Обратите внимание, что здесь мы тестируем только поведение функции, без привязки к какому-либо слою выше. Это ровно то, чего хочет FSD от `shared/lib`.

### Компонентные тесты UI-кита

В `shared/ui` часто живет переиспользуемый UI-кит. Его удобно покрывать компонентными тестами (например, с `@testing-library/react`).

```tsx
// shared/ui/Button/Button.tsx

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = (props: ButtonProps) => {
  const { variant = "primary", children, ...rest } = props;

  // Определяем CSS-класс в зависимости от варианта кнопки
  const className = variant === "primary" ? "btn-primary" : "btn-secondary";

  return (
    <button className={className} {...rest}>
      {/* Выводим дочерний контент кнопки */}
      {children}
    </button>
  );
};
```

Теперь вы увидите, как это выглядит в тесте:

```tsx
// shared/ui/Button/Button.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  test("рендерит текст children", () => {
    // Рендерим кнопку с текстом "Click me"
    render(<Button>Click me</Button>);

    // Проверяем, что текст отображается в документе
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("вызывает onClick при клике", async () => {
    const onClick = jest.fn();

    // Рендерим кнопку с обработчиком клика
    render(<Button onClick={onClick}>Click</Button>);

    // Симулируем клик пользователя по кнопке
    await userEvent.click(screen.getByText("Click"));

    // Проверяем, что обработчик был вызван один раз
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("использует правильный класс для variant secondary", () => {
    // Рендерим кнопку с вариантом "secondary"
    render(<Button variant="secondary">Secondary</Button>);

    // Находим элемент кнопки
    const button = screen.getByText("Secondary");

    // Проверяем, что у кнопки правильный класс
    expect(button).toHaveClass("btn-secondary");
  });
});
```

Такие тесты помогают гарантировать, что общие компоненты ведут себя предсказуемо во всех слоях, где они используются.

## Тестирование слоя entities

### Юнит-тесты доменных моделей и слайсов

Слой `entities` обычно содержит:

- состояние и бизнес-правила сущности;
- селекторы;
- простые UI-компоненты, связанные с этой сущностью.

Смотрите пример слайса пользователя:

```ts
// entities/user/model/userSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  username: string;
}

interface UserState {
  authData?: User;
}

const initialState: UserState = {
  // По умолчанию пользователь не авторизован
  authData: undefined,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuthData(state, action: PayloadAction<User>) {
      // Записываем данные авторизованного пользователя в состояние
      state.authData = action.payload;
    },
    logout(state) {
      // При выходе из системы очищаем данные пользователя
      state.authData = undefined;
    },
  },
});

export const { actions: userActions, reducer: userReducer } = userSlice;
```

Юнит-тест для этого слайса:

```ts
// entities/user/model/__tests__/userSlice.test.ts

import { userActions, userReducer } from "../userSlice";
import type { User } from "../userSlice";

describe("userSlice", () => {
  test("setAuthData устанавливает данные пользователя", () => {
    const user: User = { id: "1", username: "test" };

    // Вызываем редьюсер с действием setAuthData
    const state = userReducer(undefined, userActions.setAuthData(user));

    // Проверяем, что в состоянии появились данные пользователя
    expect(state.authData).toEqual(user);
  });

  test("logout очищает authData", () => {
    const initialState = {
      authData: { id: "1", username: "test" },
    };

    // Вызываем редьюсер с действием logout
    const state = userReducer(initialState, userActions.logout());

    // Проверяем, что данные пользователя удалены
    expect(state.authData).toBeUndefined();
  });
});
```

Такие тесты не зависят от UI и проверяют только бизнес-состояние сущности.

### Компонентные тесты UI сущностей

Давайте разберемся на примере простого компонента:

```tsx
// entities/user/ui/UserAvatar.tsx

interface UserAvatarProps {
  username: string;
}

export const UserAvatar = ({ username }: UserAvatarProps) => {
  // Получаем первую букву имени пользователя
  const firstLetter = username.slice(0, 1).toUpperCase();

  return (
    <div aria-label="user-avatar">
      {/* Показываем первую букву имени */}
      {firstLetter}
    </div>
  );
};
```

И тест:

```tsx
// entities/user/ui/UserAvatar.test.tsx

import { render, screen } from "@testing-library/react";
import { UserAvatar } from "./UserAvatar";

describe("UserAvatar", () => {
  test("отображает первую букву имени в верхнем регистре", () => {
    // Рендерим компонент с именем пользователя
    render(<UserAvatar username="oleg" />);

    // Находим аватар по aria-label
    const avatar = screen.getByLabelText("user-avatar");

    // Проверяем, что отображается буква "O"
    expect(avatar).toHaveTextContent("O");
  });
});
```

Компонент остается простым: он не знает о сторе, о фичах или страницах. В тестах вы проверяете только то, что относится к сущности.

## Тестирование слоя features

### Фокус на публичном API фичи

Фича в FSD — это законченный бизнес-сценарий (например, «авторизация по логину и паролю», «добавить товар в корзину»). У фичи есть публичный API, который обычно описывается в файле `index.ts`.

Смотрите, как это может выглядеть:

```ts
// features/auth-by-username/index.ts

export { LoginForm } from "./ui/LoginForm";
export type { LoginFormProps } from "./ui/LoginForm";
export { loginByUsername } from "./model/services/loginByUsername";
export type { LoginSchema } from "./model/types/loginSchema";
```

Тесты на фичу должны в первую очередь проверять:

- публичные UI-компоненты (например, `LoginForm`);
- публичные сервисы (`loginByUsername`);
- взаимодействие с сущностями (например, установка пользователя в стор).

### Юнит- и интеграционные тесты бизнес-логики фичи

Посмотрите пример асинхронного thunk для логина:

```ts
// features/auth-by-username/model/services/loginByUsername.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ThunkConfig } from "app/providers/StoreProvider";
import type { User } from "entities/user";
import { userActions } from "entities/user";

interface LoginByUsernameProps {
  username: string;
  password: string;
}

export const loginByUsername = createAsyncThunk<
  User,
  LoginByUsernameProps,
  ThunkConfig<string>
>(
  "auth/loginByUsername",
  async ({ username, password }, thunkAPI) => {
    const { extra, dispatch, rejectWithValue } = thunkAPI;

    try {
      // Выполняем запрос к API для авторизации пользователя
      const response = await extra.api.post<User>("/login", {
        username,
        password,
      });

      if (!response.data) {
        // Если в ответе нет данных, возвращаем ошибку
        throw new Error();
      }

      // Сохраняем данные пользователя в состоянии через actions сущности user
      dispatch(userActions.setAuthData(response.data));

      // Возвращаем данные пользователя как результат успешного thunk
      return response.data;
    } catch (e) {
      // В случае ошибки пробрасываем пользовательское сообщение
      return rejectWithValue("error");
    }
  }
);
```

Чтобы протестировать такую функцию, удобно использовать кастомный helper над thunk. Здесь я размещаю упрощенный пример:

```ts
// shared/lib/tests/TestAsyncThunk.ts

import type { AsyncThunk } from "@reduxjs/toolkit";

export class TestAsyncThunk<Return, Arg, RejectedValue> {
  // Сюда сохраняем сам thunk
  public thunk: AsyncThunk<Return, Arg, { rejectValue: RejectedValue }>;
  // Мокаем функцию API post
  public api = {
    post: jest.fn(),
  };
  // Мокаем функцию dispatch
  public dispatch = jest.fn();

  constructor(
    thunk: AsyncThunk<Return, Arg, { rejectValue: RejectedValue }>
  ) {
    this.thunk = thunk;
  }

  async callThunk(arg: Arg) {
    // Собираем объект thunkAPI с моками
    const thunkAPI: any = {
      dispatch: this.dispatch,
      extra: { api: this.api },
      rejectWithValue: (value: RejectedValue) => value,
    };

    // Вызываем thunk как обычную функцию
    const action = await this.thunk(arg)(thunkAPI.dispatch, () => ({}), {
      api: this.api,
    });

    // Возвращаем результат выполнения thunk
    return action;
  }
}
```

Теперь давайте применим helper в тестах:

```ts
// features/auth-by-username/model/services/loginByUsername.test.ts

import { loginByUsername } from "./loginByUsername";
import { TestAsyncThunk } from "shared/lib/tests/TestAsyncThunk";
import { userActions } from "entities/user";

describe("loginByUsername", () => {
  test("успешный логин", async () => {
    const user = { id: "1", username: "test" };

    // Создаем экземпляр helper c конкретным thunk
    const thunk = new TestAsyncThunk(loginByUsername);

    // Настраиваем мок API, чтобы он возвращал успешный ответ
    thunk.api.post.mockResolvedValue({ data: user });

    // Вызываем thunk с тестовыми данными
    const result = await thunk.callThunk({
      username: "test",
      password: "123",
    });

    // Проверяем, что dispatch вызывался с установкой данных пользователя
    expect(thunk.dispatch).toHaveBeenCalledWith(
      userActions.setAuthData(user)
    );
    // Проверяем успешный статус выполнения
    expect(result.meta.requestStatus).toBe("fulfilled");
    // Проверяем, что в payload пришли данные пользователя
    expect(result.payload).toEqual(user);
  });

  test("ошибка логина", async () => {
    const thunk = new TestAsyncThunk(loginByUsername);

    // Настраиваем мок API, чтобы он вернул ответ без данных
    thunk.api.post.mockResolvedValue({});

    const result = await thunk.callThunk({
      username: "test",
      password: "wrong",
    });

    // Проверяем, что статус выполнения rejected
    expect(result.meta.requestStatus).toBe("rejected");
    // Проверяем, что в payload вернулось сообщение об ошибке
    expect(result.payload).toBe("error");
  });
});
```

Как видите, мы не трогаем UI, а проверяем поведение бизнес-логики фичи и ее взаимодействие с сущностью `user`.

### Компонентные тесты публичного UI фич

Теперь давайте посмотрим на тестирование формы логина, как пример публичного UI фичи.

```tsx
// features/auth-by-username/ui/LoginForm.tsx

import { useState } from "react";
import { useAppDispatch } from "shared/lib/hooks/useAppDispatch";
import { loginByUsername } from "../model/services/loginByUsername";

export const LoginForm = () => {
  // Локальное состояние для логина и пароля
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Получаем dispatch Redux
  const dispatch = useAppDispatch();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Вызываем thunk авторизации
    await dispatch(loginByUsername({ username, password }));
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Поле ввода логина */}
      <input
        aria-label="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {/* Поле ввода пароля */}
      <input
        aria-label="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {/* Кнопка отправки формы */}
      <button type="submit">Войти</button>
    </form>
  );
};
```

Тест:

```tsx
// features/auth-by-username/ui/LoginForm.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { LoginForm } from "./LoginForm";
import { loginByUsername } from "../model/services/loginByUsername";

// Мокаем thunk, чтобы не делать реальный запрос
jest.mock("../model/services/loginByUsername");

describe("LoginForm", () => {
  test("отправляет данные логина и пароля при сабмите", async () => {
    const user = userEvent.setup();

    // Создаем пустой стор для теста
    const store = configureStore({
      reducer: (state) => state || {},
    });

    // Приводим мок к типу jest.Mock для доступа к .mock
    const mockedLoginByUsername = loginByUsername as jest.Mock;

    // Настраиваем возврат значения, чтобы thunk выглядел корректным
    mockedLoginByUsername.mockReturnValue({ type: "auth/loginByUsername" });

    // Рендерим форму в контексте Redux Provider
    render(
      <Provider store={store}>
        <LoginForm />
      </Provider>
    );

    // Находим поля ввода
    const usernameInput = screen.getByLabelText("username");
    const passwordInput = screen.getByLabelText("password");
    const submitButton = screen.getByText("Войти");

    // Вводим значения в поля
    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "123456");

    // Нажимаем на кнопку "Войти"
    await user.click(submitButton);

    // Проверяем, что thunk был вызван с правильными аргументами
    expect(mockedLoginByUsername).toHaveBeenCalledWith({
      username: "testuser",
      password: "123456",
    });
  });
});
```

Обратите внимание: мы тестируем только взаимодействие формы с thunk, но не проверяем детали реализации сетевого слоя. Это соответствует идее FSD — каждый слой отвечает за свое.

## Тестирование слоя widgets

### Интеграционные тесты сборок из фич и сущностей

Виджет — это композиция фич, сущностей и shared-компонентов. Логика виджета должна быть минимальной, но он часто несет ответственность за общий сценарий.

Например, виджет сайдбара, который показывает навигацию в зависимости от того, авторизован пользователь или нет:

```tsx
// widgets/sidebar/ui/Sidebar.tsx

import { useSelector } from "react-redux";
import { getUserAuthData } from "entities/user/model/selectors/getUserAuthData";
import { Link } from "react-router-dom";

export const Sidebar = () => {
  // Получаем данные авторизованного пользователя из состояния
  const authData = useSelector(getUserAuthData);

  return (
    <aside>
      {/* Общий пункт меню всегда доступен */}
      <Link to="/">Главная</Link>

      {/* Пункт меню "Профиль" показываем только авторизованному пользователю */}
      {authData && <Link to="/profile">Профиль</Link>}
    </aside>
  );
};
```

Теперь протестируем это поведение:

```tsx
// widgets/sidebar/ui/Sidebar.test.tsx

import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  const renderSidebar = (initialState: any) => {
    // Создаем тестовый стор с начальными данными
    const store = configureStore({
      reducer: (state) => state || initialState,
      preloadedState: initialState,
    });

    // Рендерим Sidebar в контексте Redux и Router
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      </Provider>
    );
  };

  test("отображает ссылку Профиль для авторизованного пользователя", () => {
    // Передаем в состояние данные авторизованного пользователя
    renderSidebar({
      user: {
        authData: { id: "1", username: "test" },
      },
    });

    // Проверяем, что ссылка "Профиль" есть
    expect(screen.getByText("Профиль")).toBeInTheDocument();
  });

  test("не отображает ссылку Профиль для неавторизованного пользователя", () => {
    // Передаем состояние без authData
    renderSidebar({
      user: {
        authData: undefined,
      },
    });

    // Проверяем, что ссылка "Профиль" отсутствует
    expect(screen.queryByText("Профиль")).toBeNull();
  });
});
```

Здесь тест уже ближе к интеграционному: он использует Redux, роутер и селектор сущности одновременно, но при этом не выходит за пределы виджета.

## Тестирование слоя pages

### Интеграционные сценарии уровня страницы

Страницы обычно представляют собой композицию виджетов и фич, связанных роутером. На этом уровне удобно проверять целостные сценарии, но внутри одного роута.

Например, страница профиля пользователя:

```tsx
// pages/profile/ui/ProfilePage.tsx

import { ProfileCard } from "entities/profile";
import { EditableProfileCard } from "features/editable-profile-card";
import { Suspense } from "react";

export const ProfilePage = () => {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      {/* Карточка профиля (сущность) */}
      <ProfileCard />
      {/* Фича редактирования профиля */}
      <EditableProfileCard />
    </Suspense>
  );
};
```

Тест может проверять, что все ключевые элементы страницы на месте и корректно взаимодействуют (в упрощенном виде, без реальных запросов):

```tsx
// pages/profile/ui/ProfilePage.test.tsx

import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";

// Для простоты мокаем фичу и сущность, чтобы сосредоточиться на странице
jest.mock("entities/profile", () => ({
  ProfileCard: () => <div data-testid="profile-card">ProfileCard</div>,
}));
jest.mock("features/editable-profile-card", () => ({
  EditableProfileCard: () => (
    <div data-testid="editable-profile-card">EditableProfileCard</div>
  ),
}));

describe("ProfilePage", () => {
  test("рендерит карточку профиля и фичу редактирования", () => {
    const store = configureStore({
      reducer: (state) => state || {},
    });

    // Рендерим страницу в контексте Redux и Router
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      </Provider>
    );

    // Проверяем, что обе части страницы на месте
    expect(screen.getByTestId("profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("editable-profile-card")).toBeInTheDocument();
  });
});
```

Как видите, мы можем мокаить детали реализации фич и сущностей, чтобы тест страницы оставался устойчивым и не зависел от более низких слоев. Это помогает избежать «ломких» тестов.

### E2E-тесты на уровне страниц

E2E-тесты (например, Playwright, Cypress) хорошо ложатся на слой `pages`. Обычно вы проверяете:

- переходы между страницами;
- полный пользовательский сценарий внутри одной или нескольких страниц;
- корректную работу роутинга и глобальных провайдеров.

Пример на Playwright (псевдокод, структуру вы можете адаптировать под свой стэк):

```ts
// tests/e2e/profile-page.spec.ts

import { test, expect } from "@playwright/test";

test("пользователь может просмотреть страницу профиля", async ({ page }) => {
  // Авторизуем пользователя (например, через прямой вызов API или cookie)
  await page.request.post("/api/login", {
    data: { username: "testuser", password: "123456" },
  });

  // Переходим на страницу профиля
  await page.goto("http://localhost:3000/profile");

  // Ожидаем, что заголовок профиля будет виден
  await expect(page.getByText("Профиль пользователя")).toBeVisible();

  // Проверяем наличие ключевых элементов
  await expect(page.getByTestId("profile-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "Редактировать" })).toBeVisible();
});
```

Здесь вы тестируете систему в целом, но точки входа все равно организованы через слой страниц.

## Тестирование слоя app

### Проверка инициализации приложения

Слой `app` отвечает за инициализацию:

- роутера;
- стора;
- глобальных провайдеров (темы, i18n, error boundary);
- базовой конфигурации приложения.

Этот уровень редко покрывают детальными юнит-тестами. Чаще всего используются:

- smoke-тесты (приложение монтируется без ошибок в тестовой среде);
- интеграционные тесты роутинга;
- E2E на основные сценарии.

Смотрите пример компонента инициализации:

```tsx
// app/App.tsx

import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./providers/router";
import { StoreProvider } from "./providers/StoreProvider";

export const App = () => {
  return (
    <StoreProvider>
      <BrowserRouter>
        {/* Компонент, который управляет маршрутами приложения */}
        <AppRouter />
      </BrowserRouter>
    </StoreProvider>
  );
};
```

Smoke-тест может выглядеть так:

```tsx
// app/App.test.tsx

import { render } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  test("монтируется без ошибок", () => {
    // Рендерим корневой компонент приложения
    const { container } = render(<App />);

    // Проверяем, что в документе появился корневой DOM-элемент
    expect(container.firstChild).not.toBeNull();
  });
});
```

Если у вас есть отдельный компонент с роутером, его тоже можно протестировать:

```tsx
// app/providers/router/ui/AppRouter.test.tsx

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRouter } from "./AppRouter";

describe("AppRouter", () => {
  test("отображает страницу профиля по маршруту /profile", () => {
    // Используем MemoryRouter для имитации маршрута /profile
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AppRouter />
      </MemoryRouter>
    );

    // Проверяем, что содержимое страницы профиля отобразилось
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  });
});
```

Так вы покрываете базовую инфраструктуру приложения и убедитесь, что маршруты настроены корректно.

## Тестовые хелперы и конфигурация для FSD

### Тестовые рендеры с провайдерами

Чтобы не дублировать обертки Redux/Router в каждом тесте, удобно сделать общий helper в `shared/lib/tests`.

Давайте посмотрим на пример:

```tsx
// shared/lib/tests/renderWithProviders.tsx

import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

interface RenderOptions {
  route?: string;
  initialState?: any;
  asyncReducers?: any;
}

export function renderWithProviders(
  component: ReactElement,
  options: RenderOptions = {}
) {
  const { route = "/", initialState, asyncReducers } = options;

  // Создаем тестовый стор с переданными редьюсерами и начальными данными
  const store = configureStore({
    reducer: asyncReducers || ((state) => state || initialState),
    preloadedState: initialState,
  });

  // При необходимости можно установить route через MemoryRouter,
  // здесь примера ради используем BrowserRouter
  window.history.pushState({}, "", route);

  // Рендерим компонент в контексте Redux и Router
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
}
```

Теперь вы можете использовать этот helper в тестах фич, виджетов и страниц:

```tsx
// features/auth-by-username/ui/LoginForm.test.tsx (упрощенный пример)

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "shared/lib/tests/renderWithProviders";
import { LoginForm } from "./LoginForm";
import { loginByUsername } from "../model/services/loginByUsername";

jest.mock("../model/services/loginByUsername");

test("отправляет данные логина и пароля при сабмите", async () => {
  const user = userEvent.setup();

  // Рендерим форму через общий helper
  renderWithProviders(<LoginForm />);

  const usernameInput = screen.getByLabelText("username");
  const passwordInput = screen.getByLabelText("password");
  const submitButton = screen.getByText("Войти");

  await user.type(usernameInput, "testuser");
  await user.type(passwordInput, "123456");
  await user.click(submitButton);

  expect(loginByUsername as jest.Mock).toHaveBeenCalledWith({
    username: "testuser",
    password: "123456",
  });
});
```

Такой подход делает тесты чище и помогает поддерживать единые правила окружения.

### Разделение тестовых утилит по слоям

Важно не превращать `shared/lib/tests` в «свалку». Можно ориентироваться на те же правила FSD:

- общие хелперы для рендера и async thunk — в `shared/lib/tests`;
- специфичные для фичи хелперы — внутри самой фичи;
- тестовые моки API — в `shared/api/test` или внутри соответствующего слоя, если мок относится только к нему.

Это позволяет контролировать зависимости тестов и не тянуть весь проект в каждый тестовый файл.

## Типичные ошибки и как их избежать

### 1. Тесты нарушают границы слоев

Проблема: тест фичи напрямую импортирует приватный код из `entities` или `shared`, минуя публичный API.

Как избежать:

- в тестах использовать те же публичные входные точки (index-файлы), что и в боевом коде;
- не тестировать приватные детали из других слоев — только поведение текущего слоя.

### 2. Слишком много моков на верхних уровнях

Проблема: тесты страниц и виджетов полностью замоканы, и уже не понятно, что именно они проверяют.

Рекомендации:

- на слое `widgets` стараться мокать только внешние границы (например, сетевой слой), а не внутренние фичи;
- на слое `pages` мокать то, что выходит в другие страницы или глобальные провайдеры, но оставлять реальные виджеты и фичи, если тест проверяет их совместную работу.

### 3. E2E вместо нормальной пирамиды

Иногда разработчики пытаются решить все E2E-тестами. Это быстро приводит к:

- долгому времени прогона;
- хрупким сценариям, завязанным на реальные данные;
- сложной поддержке.

Лучше придерживаться «пирамиды тестирования» с учетом FSD:

- много юнит-тестов на `shared`, `entities`, бизнес-логику `features`;
- умеренное количество интеграционных тестов на `features`, `widgets`, `pages`;
- небольшое, но важное количество E2E на критичные сценарии `pages` и `app`.

### 4. Тестовые хелперы завязаны на весь проект

Если `renderWithProviders` или `TestAsyncThunk` начинают зависеть от конкретных редьюсеров всех фич и сущностей, вы теряете гибкость.

Что делать:

- держать helpers максимально абстрактными;
- в тесте передавать нужные редьюсеры и начальное состояние;
- специфичные для фич вещи (например, `buildLoginFormStore`) хранить внутри фичи.

---

Тестирование в Feature-Sliced Design строится вокруг тех же сущностей, что и сама архитектура: слоев, слайсов и их публичных контрактов. Если вы:

- располагаете тесты рядом с кодом;
- тестируете публичный API слоев;
- соблюдаете границы при импортах;
- используете общие хелперы для провайдеров и thunk;

то со временем у вас получается предсказуемая и устойчивая система тестов, которая не ломается от мелких рефакторингов и помогает смело менять внутреннюю реализацию модулей.

## Частозадаваемые технические вопросы

### Как протестировать динамический импорт фичи или страницы в FSD

Обычно динамический импорт скрыт в слое `app` или `pages` через `React.lazy`. В юнит-тестах вы можете:

1. Мокнуть модуль, который загружается динамически.
2. В тесте рендерить компонент, обернутый в `Suspense`, и ждать появления заглушки или содержимого.

Пример:

```tsx
jest.mock("../ui/ProfilePage", () => ({
  ProfilePageAsync: () => <div data-testid="profile-page">Profile</div>,
}));

render(
  <Suspense fallback={<div>loading</div>}>
    <ProfilePageAsync />
  </Suspense>
);
```

Так вы проверяете, что роутер или страница корректно подхватывает ленивый компонент, не проверяя сам механизм dynamic import.

### Как организовать мок API в FSD чтобы не сломать границы слоев

Лучше вынести HTTP-клиент в `shared/api`. Для тестов можно:

- сделать `shared/api/test/jestApiMock.ts`, который мапит базовый клиент на моки;
- в Jest-конфиге через `moduleNameMapper` подменять `shared/api/baseApi` на тестовую реализацию;
- в тестах фич и выше работать только с публичным API клиента, не используя частные эндпоинты.

Так вы сохраняете единое место для моков и не размазываете их по слоям.

### Как тестировать селекторы в entities и features

Селекторы удобно тестировать как чистые функции:

1. Создаете минимальное состояние стора с нужной веткой.
2. Вызываете селектор с этим состоянием.
3. Проверяете возвращаемое значение.

Важно делать состояние минимальным: не нужно собирать весь реальный стор приложения, достаточно тех веток, к которым обращается селектор.

### Что делать с тестированием роутов если роутер описан в слое app

Если вам нужно проверить навигацию внутри одной фичи или виджета:

- используйте `MemoryRouter` в тестах;
- настраивайте `initialEntries` и `initialIndex` локально для теста;
- не тяните весь `AppRouter` из `app`, если вам нужно проверить только один локальный маршрут.

Если нужно протестировать общий роутинг приложения — тогда целесообразно писать тесты именно в слое `app`, используя `AppRouter` и реальные страницы.

### Как тестировать i18n в проекте с FSD

Чаще всего провайдер i18n живет в `app`. Для тестов:

1. Создайте тестовую конфигурацию i18n с минимальным набором переводов.
2. Оберните `renderWithProviders` в тестовый `I18nextProvider`.
3. В компонентах используйте `useTranslation` как обычно.

Можно сделать отдельный helper `renderWithTranslation`, который будет:

- подключать тестовый i18n;
- рендерить компонент в нужной локали.

Так вы не завязываетесь на боевую конфигурацию и держите тесты стабильными.