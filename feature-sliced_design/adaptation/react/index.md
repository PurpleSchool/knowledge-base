---
metaTitle: Feature Sliced Design для React и библиотека react-fsd
metaDescription: Подробное руководство по применению Feature Sliced Design в React приложениях - структура слоев и слайсов правила разбиения кода и примеры с использованием библиотеки react-fsd
author: Олег Марков
title: Архитектура Feature Sliced Design для React с использованием react-fsd
preview: Разбор архитектурного подхода Feature Sliced Design для React - как устроены слои и слайсы как организовывать модули и как использовать вспомогательные инструменты вроде react-fsd на практике
---

## Введение

Feature-Sliced Design (FSD) — это подход к архитектуре фронтенда, который помогает структурировать проект вокруг бизнес-функций, а не вокруг технических деталей. В контексте React его часто называют просто архитектурой модулей и слоев для React-приложения, а в экосистеме можно встретить библиотеки и шаблоны с названием react-fsd. Они обычно не навязывают конкретный фреймворк, а дают набор правил и вспомогательных утилит для организации кода по принципам Feature-Sliced Design.

Вам не нужно переписывать весь проект с нуля, чтобы начать использовать FSD. Главное — понять идею: код группируется по функциональности (features, entities, pages и т.д.), а не по типу файла (components, services, utils). Это упрощает навигацию по проекту, уменьшает связность между частями кода и облегчает масштабирование.

В этой статье я покажу, как организовать React-проект по FSD, какие слои и слайсы использовать, как это выглядит в коде и как адаптировать существующий проект. Я буду опираться на общие принципы FSD и примеры, которые вы легко сможете использовать вместе с любым «react-fsd»-шаблоном или библиотекой.

---

## Основные идеи Feature-Sliced Design

### Почему «фичи», а не «компоненты»

В классическом подходе структура React-проекта часто выглядит так:

- components  
- hooks  
- services  
- utils  

Сначала кажется, что это удобно. Но по мере роста приложения появляются проблемы:

- сложно понять, какие компоненты относятся к какому бизнес-кейсу;
- изменения в одной фиче затрагивают файлы из разных директорий;
- легко создать «комбайн» из общих компонентов, которые знают слишком много.

Feature-Sliced Design предлагает другой взгляд. Вместо того чтобы делить по типам файлов, вы делите проект по бизнес-области:

- entities — сущности предметной области;
- features — законченные бизнес-возможности;
- widgets — крупные видимые части интерфейса;
- pages — страницы приложения;
- processes — сквозные бизнес-процессы;
- shared — общий слой базовой инфраструктуры.

Смотрите, структура строится «по смыслу»: вы сперва отвечаете на вопрос «что это делает в бизнесе», а уже потом — «какие файлы внутри нужны».

### Основные принципы FSD

Кратко соберу ключевые принципы, чтобы на них опираться дальше:

1. Бизнес в центре  
   Архитектура строится вокруг бизнес-функций, а не вокруг инфраструктуры.

2. Явная модульность  
   Модуль (feature, entity, widget и т.п.) — это директория с четкими границами и публичным интерфейсом (index-файл).

3. Направленная зависимость  
   Слои зависят только «вниз» по иерархии. Так проще контролировать связность и избегать циклических зависимостей.

4. Стабильный публичный API модулей  
   Каждый модуль экспортирует только то, что нужно снаружи. Внутренние детали не торчат наружу.

5. Инкрементальное внедрение  
   FSD можно внедрять постепенно: с одной фичи или страницы, без полного рефакторинга.

---

## Структура слоев в React-приложении по FSD

### Базовая структура проекта

Чаще всего React-проект с FSD выглядит так:

src  
- app  
- processes  
- pages  
- widgets  
- features  
- entities  
- shared  

Давайте разберем каждый слой.

### Слой shared

Слой shared — это ваш фундамент. Здесь находятся:

- базовые UI-компоненты (кнопки, инпуты, модальные окна);
- типы и модели, которые действительно общие;
- базовые хелперы и утилиты;
- общие конфигурации (например, api-клиент).

Пример возможной структуры:

src/shared  
- ui  
  - button  
    - ui  
      - Button.tsx  
    - index.ts  
- api  
  - baseApi.ts  
  - index.ts  
- config  
  - axiosConfig.ts  
- lib  
  - formatDate.ts  
  - debounce.ts  

Теперь вы увидите, как это выглядит в коде.

```ts
// shared/ui/button/ui/Button.tsx
import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary" }) => {
  // Здесь мы определяем базовые стили для кнопки
  const className = variant === "primary" ? "btn btn-primary" : "btn btn-secondary";

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};
```

```ts
// shared/ui/button/index.ts
// Здесь мы формируем публичный API модуля кнопки
export { Button } from "./ui/Button";
```

Смотрите, снаружи вы импортируете только из index-файла:

```ts
// Пример использования кнопки в другой части приложения
import { Button } from "shared/ui/button";

export const Example = () => (
  <Button variant="secondary">
    Нажмите
  </Button>
);
```

Так вы не зависите от внутренней структуры модуля, и можете менять файлы внутри без массовых правок импортов по проекту.

### Слой entities

Entities — это «модели предметной области». Например:

- User  
- Product  
- Order  
- Article  

Каждая сущность — отдельная директория со своим подмодульным устройством:

src/entities/user  
- model  
  - types.ts  
  - selectors.ts  
  - api.ts  
- ui  
  - UserAvatar.tsx  
  - UserName.tsx  
- lib  
  - formatUserName.ts  
- index.ts  

Давайте разберемся на примере сущности пользователя.

```ts
// entities/user/model/types.ts
// Здесь мы описываем типы данных сущности пользователя
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
};
```

```ts
// entities/user/model/selectors.ts
import { RootState } from "app/store";
import { User } from "./types";

// Здесь мы описываем селекторы для получения данных пользователя из стора
export const selectCurrentUser = (state: RootState): User | null => state.user.current;
```

```ts
// entities/user/ui/UserAvatar.tsx
import React from "react";
import { User } from "../model/types";

type UserAvatarProps = {
  user: User;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  // Здесь мы показываем аватар или букву имени
  if (!user.avatarUrl) {
    return <div className="avatar-placeholder">{user.name[0]}</div>;
  }

  return <img src={user.avatarUrl} alt={user.name} className="avatar-img" />;
};
```

```ts
// entities/user/index.ts
// Здесь мы определяем, что сущность пользователя "показывает наружу"
export type { User } from "./model/types";
export { selectCurrentUser } from "./model/selectors";
export { UserAvatar } from "./ui/UserAvatar";
```

Обратите внимание: слой entities не должен зависеть от features, widgets, pages. Он ниже по иерархии.

### Слой features

Features — один из ключевых слоев. Это самостоятельные бизнес-возможности, например:

- userAuth / loginForm — логин пользователя;
- addToCart — добавление товара в корзину;
- toggleFavorite — добавление в избранное;
- commentForm — форма комментария.

Структура фичи часто похожа на сущности:

src/features/auth-by-username  
- model  
  - types.ts  
  - slice.ts  
  - selectors.ts  
  - hooks.ts  
- ui  
  - LoginForm.tsx  
- lib  
  - validators.ts  
- index.ts  

Покажу вам, как это реализовано на практике на примере фичи авторизации по логину и паролю.

```ts
// features/auth-by-username/model/types.ts
// Типы для формы логина
export type LoginFormValues = {
  username: string;
  password: string;
};

export type LoginFormState = {
  values: LoginFormValues;
  isLoading: boolean;
  error?: string;
};
```

```ts
// features/auth-by-username/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginFormState } from "./types";

// Начальное состояние формы
const initialState: LoginFormState = {
  values: {
    username: "",
    password: "",
  },
  isLoading: false,
};

const loginSlice = createSlice({
  name: "loginForm",
  initialState,
  reducers: {
    setUsername(state, action: PayloadAction<string>) {
      // Здесь мы обновляем поле username
      state.values.username = action.payload;
    },
    setPassword(state, action: PayloadAction<string>) {
      // Здесь мы обновляем поле password
      state.values.password = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      // Флаг загрузки при запросе
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      // Сообщение об ошибке авторизации
      state.error = action.payload;
    },
    resetForm() {
      // Сброс формы в исходное состояние
      return initialState;
    },
  },
});

export const { actions: loginFormActions, reducer: loginFormReducer } = loginSlice;
```

```ts
// features/auth-by-username/model/hooks.ts
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { loginFormActions } from "./slice";

// Хук инкапсулирует логику диспатча событий формы логина
export const useLoginFormActions = () => {
  const dispatch = useDispatch();

  const setUsername = useCallback(
    (username: string) => {
      dispatch(loginFormActions.setUsername(username));
    },
    [dispatch]
  );

  const setPassword = useCallback(
    (password: string) => {
      dispatch(loginFormActions.setPassword(password));
    },
    [dispatch]
  );

  const resetForm = useCallback(() => {
    dispatch(loginFormActions.resetForm());
  }, [dispatch]);

  return { setUsername, setPassword, resetForm };
};
```

```tsx
// features/auth-by-username/ui/LoginForm.tsx
import React from "react";
import { useSelector } from "react-redux";
import { Button } from "shared/ui/button";
import { useLoginFormActions } from "../model/hooks";
import { RootState } from "app/store";

export const LoginForm: React.FC = () => {
  // Здесь мы получаем нужные данные формы из стора
  const { username, password, isLoading, error } = useSelector((state: RootState) => ({
    username: state.loginForm.values.username,
    password: state.loginForm.values.password,
    isLoading: state.loginForm.isLoading,
    error: state.loginForm.error,
  }));

  const { setUsername, setPassword, resetForm } = useLoginFormActions();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Здесь можно вызвать асинхронный thunk для авторизации
    // dispatch(loginByUsername({ username, password }))
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Логин"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        type="password"
      />

      {error && <div className="error">{error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={handleSubmit} >
          {isLoading ? "Загрузка..." : "Войти"}
        </Button>

        <Button variant="secondary" onClick={resetForm}>
          Сбросить
        </Button>
      </div>
    </form>
  );
};
```

```ts
// features/auth-by-username/index.ts
// Публичный API фичи авторизации
export { LoginForm } from "./ui/LoginForm";
export { loginFormReducer } from "./model/slice";
```

Как видите, фича — это «законченное действие» пользователя, внутри которого может быть и состояние, и UI, и хелперы.

### Слой widgets

Widget — это более крупный блок интерфейса, который объединяет несколько фич и сущностей. Примеры:

- Sidebar  
- Header  
- CartPreview  
- ArticleList  

Структура похожа:

src/widgets/sidebar  
- ui  
  - Sidebar.tsx  
- model  
  - hooks.ts (если нужно)  
- index.ts  

Давайте посмотрим, что происходит в следующем примере.

```tsx
// widgets/sidebar/ui/Sidebar.tsx
import React from "react";
import { UserAvatar } from "entities/user";
import { LoginForm } from "features/auth-by-username";

export const Sidebar: React.FC = () => {
  // В этом виджете мы объединяем данные пользователя и форму логина
  const isAuth = false; // Здесь должно быть реальное состояние авторизации

  return (
    <aside className="sidebar">
      {isAuth ? (
        <div className="sidebar-user">
          {/* Если пользователь авторизован, показываем его аватар */}
          <UserAvatar
            user={{
              id: "1",
              name: "Demo User",
              avatarUrl: undefined,
            }}
          />
        </div>
      ) : (
        <div className="sidebar-login">
          {/* Если нет авторизации, показываем форму логина */}
          <LoginForm />
        </div>
      )}
    </aside>
  );
};
```

```ts
// widgets/sidebar/index.ts
// Публичный API виджета боковой панели
export { Sidebar } from "./ui/Sidebar";
```

Здесь виджет — это композиция фич и сущностей. Важно, что виджет не должен напрямую знать детали внутренней реализации фич.

### Слой pages

Page — это уровень маршрута. Каждая страница — отдельный модуль, который собирает в себе нужные widgets, features и entities.

src/pages/home  
- ui  
  - HomePage.tsx  
- index.ts  

```tsx
// pages/home/ui/HomePage.tsx
import React from "react";
import { Sidebar } from "widgets/sidebar";
// Допустим, у нас есть виджет со списком статей
import { ArticlesList } from "widgets/articles-list";

export const HomePage: React.FC = () => {
  // Здесь мы компонуем виджеты в структуру страницы
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <ArticlesList />
      </main>
    </div>
  );
};
```

```ts
// pages/home/index.ts
export { HomePage } from "./ui/HomePage";
```

Слой pages не должен содержать бизнес-логику. Его задача — «собрать» страницу из модулей нижних слоев.

### Слой processes

Processes — опциональный, но полезный слой для сложных проектов. Здесь располагаются сквозные сценарии, которые включают несколько страниц и много шагов, например:

- онбординг пользователя;
- оформление заказа (создание, оплата, подтверждение);
- мастер настройки.

Используйте этот слой, когда сценарий слишком большой для одной страницы и при этом логически цельный.

### Слой app

Слой app — это «обвязка» приложения:

- инициализация роутинга;
- провайдеры (Redux, Query, Theme, i18n);
- глобальная конфигурация приложения.

Структура может быть такой:

src/app  
- providers  
  - store  
  - router  
  - theme  
- index.tsx  
- App.tsx  

Пример:

```tsx
// app/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "pages/home";
import { ProfilePage } from "pages/profile";

export const App: React.FC = () => {
  // Здесь мы подключаем роуты и базовый layout
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

---

## Взаимосвязи между слоями и правила зависимостей

### Направление зависимостей

Хорошее правило, которым удобно руководствоваться:

- app → processes → pages → widgets → features → entities → shared  

Это значит:

- Page может импортировать features, entities, widgets, shared, но не должна импортировать app.
- Feature может импортировать entities и shared, но не должна импортировать pages или widgets.

Пример «правильной» зависимости:

```ts
// features/add-to-cart/ui/AddToCartButton.tsx
import { Product } from "entities/product";
import { Button } from "shared/ui/button";

// Здесь фича зависит от сущности и от shared-слоя
type Props = { product: Product };

export const AddToCartButton: React.FC<Props> = ({ product }) => {
  const handleClick = () => {
    // Здесь мы добавляем товар в корзину
  };

  return (
    <Button variant="primary" onClick={handleClick}>
      Добавить {product.title} в корзину
    </Button>
  );
};
```

Пример «неправильной» зависимости, которую лучше избегать:

```ts
// entities/product/ui/ProductCard.tsx
// ПЛОХО - сущность зависит от фичи
import { AddToCartButton } from "features/add-to-cart";

// Здесь сущность "знает" о фиче, что нарушает иерархию
```

Если вы замечаете такие зависимости, лучше вынести композицию в widget или в feature, а сущности оставить максимально «чистыми».

### Публичный API модулей

Чтобы контролировать зависимости, в FSD используют index-файлы в корнях модулей. Вы уже видели примеры, но давайте обобщим.

Идея следующая:

- Внутри модуля файлы импортируют друг друга как угодно.
- Снаружи модуля вы импортируете только из его index.ts.
- Так вы предотвращаете «подглядывание» в приватные детали и случайные зависимости.

Хороший пример:

```ts
// widgets/articles-list/index.ts
export { ArticlesList } from "./ui/ArticlesList";
```

```tsx
// pages/home/ui/HomePage.tsx
// Снаружи страницы мы импортируем только из публичного API
import { ArticlesList } from "widgets/articles-list";
```

Это особенно важно, если вы используете какие-то «react-fsd» инструменты, которые, например, автоматически проверяют импорт на соответствие архитектуре (через ESLint плагины или кастомные проверки).

---

## Организация кода внутри слайса

В FSD каждый модуль (feature, entity, widget и т.д.) можно представить как слайс. Внутри него часто используют немного повторяющуюся структуру:

- ui — React-компоненты;
- model — состояние, типы, селекторы, бизнес-логика;
- lib — хелперы, функции;
- config — настройки (иногда);
- api — запросы к серверу (иногда выносят в model).

Смотрите, я покажу вам, как выглядит полный слайс сущности Product.

```text
src/entities/product
- model
  - types.ts
  - api.ts
  - selectors.ts
- ui
  - ProductCard.tsx
  - ProductPrice.tsx
- lib
  - getProductLabel.ts
- index.ts
```

Теперь давайте разберемся на примере.

```ts
// entities/product/model/types.ts
// Типы данных товара
export type ProductId = string;

export type Product = {
  id: ProductId;
  title: string;
  price: number;
  currency: "RUB" | "USD" | "EUR";
  isFavorite: boolean;
};
```

```ts
// entities/product/model/api.ts
import { Product } from "./types";

// Здесь мы делаем простую функцию имитации запроса
export const fetchProductById = async (id: string): Promise<Product> => {
  // В реальном приложении здесь будет вызов HTTP клиента
  // const response = await api.get(`/products/${id}`);
  // return response.data;

  // Для примера вернем заглушку
  return {
    id,
    title: "Тестовый товар",
    price: 1000,
    currency: "RUB",
    isFavorite: false,
  };
};
```

```ts
// entities/product/lib/getProductLabel.ts
import { Product } from "../model/types";

// Вспомогательная функция формирования подписи товара
export const getProductLabel = (product: Product): string => {
  return `${product.title} — ${product.price} ${product.currency}`;
};
```

```tsx
// entities/product/ui/ProductCard.tsx
import React from "react";
import { Product } from "../model/types";
import { getProductLabel } from "../lib/getProductLabel";

type Props = {
  product: Product;
};

export const ProductCard: React.FC<Props> = ({ product }) => {
  // Здесь мы используем хелпер, чтобы не дублировать логику форматирования
  const label = getProductLabel(product);

  return (
    <div className="product-card">
      <div className="product-title">{label}</div>
      <div className="product-favorite">
        {product.isFavorite ? "В избранном" : "Не в избранном"}
      </div>
    </div>
  );
};
```

```ts
// entities/product/index.ts
// Публичный API сущности товара
export type { Product, ProductId } from "./model/types";
export { fetchProductById } from "./model/api";
export { ProductCard } from "./ui/ProductCard";
export { getProductLabel } from "./lib/getProductLabel";
```

Такой подход помогает вам держать логику и UI рядом, но при этом четко понимать, что можно импортировать снаружи, а что — только внутри.

---

## Использование «react-fsd» шаблонов и утилит

В экосистеме вы найдете несколько шаблонов и библиотек, помогающих стартовать с FSD в React-проектах. Обычно они включают:

- готовую структуру директорий FSD;
- alias-пути для импорта (например, "entities/user" вместо длинных относительных путей);
- ESLint/TSLint правила для проверки зависимостей между слоями;
- генераторы модулей (CLI-команды для создания feature, entity и т.п.).

Даже если вы не используете конкретный пакет react-fsd, вы легко можете перенести те же идеи в свой проект.

### Настройка alias-путей

Часто в FSD-проектах используют alias-импорты, чтобы не писать длинные относительные пути. Давайте посмотрим на пример для TypeScript + Vite/Webpack.

tsconfig.json:

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

// В комментариях пояснять TS-конфиг не требуется, он и так читаемый

Теперь можно писать:

```ts
// Вместо длинного относительного пути
import { Sidebar } from "../../widgets/sidebar";
// Мы используем alias для читаемости
import { Sidebar } from "widgets/sidebar";
```

Если вы используете Vite:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Здесь мы настраиваем alias-пути аналогично tsconfig
      app: path.resolve(__dirname, "src/app"),
      processes: path.resolve(__dirname, "src/processes"),
      pages: path.resolve(__dirname, "src/pages"),
      widgets: path.resolve(__dirname, "src/widgets"),
      features: path.resolve(__dirname, "src/features"),
      entities: path.resolve(__dirname, "src/entities"),
      shared: path.resolve(__dirname, "src/shared"),
    },
  },
});
```

### Линтинг и проверка архитектурных ограничений

Многие «react-fsd» шаблоны включают правила для ESLint, чтобы:

- запретить импорт из «внутренних» файлов модулей;
- контролировать, чтобы слои не зависели «вверх».

Пример простого правила, которое можно дополнительно настроить (псевдокод на уровне идеи):

```js
// Пример кастомного ESLint правила (сильно упрощено)
// Оно запрещает импорт "изнутри" модуля, минуя index.ts
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "запрещает импорт из внутренних модулей FSD-набора",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        // Здесь вы можете проверить строку пути и вызвать report при нарушении
      },
    };
  },
};
```

В готовых решениях это уже реализовано, и вам остается только подключить конфиг. Если вы используете чужой «react-fsd» стартовый шаблон, загляните в .eslintrc.js — скорее всего, там уже есть правила, которые помогают не нарушать архитектуру.

---

## Пошаговое внедрение Feature-Sliced Design в существующий React-проект

Часто возникает вопрос — как перейти к FSD, если у вас уже есть большой проект. Давайте пройдемся по шагам.

### Шаг 1. Выделите слои верхнего уровня

Сначала создайте базовую структуру слоев:

src  
- app  
- pages  
- widgets  
- features  
- entities  
- shared  

Затем перенесите:

- «общие» компоненты (кнопки, инпуты, модалки) в shared/ui;
- общие утилиты и helpers — в shared/lib;
- настройки api и конфиги — в shared/api и shared/config.

На этом шаге вы уже упорядочиваете фундамент, ничего не ломая.

### Шаг 2. Определите сущности (entities)

Посмотрите на ваш проект и выпишите ключевые предметные сущности:

- пользователи (user);
- заказы (order);
- товары (product);
- статьи (article) и т.д.

Создайте папки в entities и постепенно переносите туда:

- типы данных для сущности;
- логику загрузки / сохранения данных;
- простые UI-компоненты, которые отображают эту сущность.

Там же сразу формируйте index.ts, через который будет идти импорт.

### Шаг 3. Выделите фичи

Следующий шаг — найти фичи: это действия пользователя или значения бизнес-функций. Вопрос, который полезно задавать: «что делает пользователь?»

- авторизоваться;
- добавить в корзину;
- оформить заказ;
- поставить лайк.

Создайте директории для features, перенесите туда:

- формы;
- кнопки с бизнес-логикой;
- хуки, связанные с конкретной задачей.

При этом фичи могут использовать entities и shared.

### Шаг 4. Соберите widgets и pages

Когда базовые детали разложены по сущностям и фичам, становится проще выделить widgets и pages:

- widgets — крупные блоки (шапка, сайдбар, блок товаров, блок комментариев);
- pages — отдельные маршруты (HomePage, ProductPage, ProfilePage).

Сюда вы переносите в основном «сборочный» код: компоненты, которые просто компонируют фичи и сущности.

### Шаг 5. Настройте alias-импорты и линтер

После того как структура вырисовалась:

1. Добавьте alias-пути (в tsconfig и конфиге сборщика).
2. Подключите ESLint-правила, которые будут помогать держать архитектуру в порядке.
3. Обновите импорты в проекте под новую структуру.

---

## Практический пример страницы по FSD

Чтобы сложить все воедино, давайте разберем условную страницу «Товары», которая показывает список товаров и позволяет добавлять их в избранное и корзину.

Структура:

src  
- entities  
  - product  
- features  
  - add-to-cart  
  - toggle-favorite  
- widgets  
  - products-list  
- pages  
  - products  

### Сущность Product

Мы уже разбирали пример сущности Product. Дополнительно добавим в нее UI-компонент ProductCard, который будет «чистым» и не знать о фичах.

```tsx
// entities/product/ui/ProductCard.tsx
import React from "react";
import { Product } from "../model/types";

// Этот компонент показывает базовую информацию о товаре
type Props = {
  product: Product;
  actionsSlot?: React.ReactNode;
};

export const ProductCard: React.FC<Props> = ({ product, actionsSlot }) => {
  return (
    <div className="product-card">
      <div className="product-title">{product.title}</div>
      <div className="product-price">
        {product.price} {product.currency}
      </div>
      {/* Здесь мы показываем слот для действий - кнопки могут прийти из фич */}
      <div className="product-actions">{actionsSlot}</div>
    </div>
  );
};
```

Здесь мы добавили actionsSlot — это позволяет фичам добавлять кнопки «Добавить в корзину» и «Избранное» снаружи, не ломая чистоту сущности.

### Фича add-to-cart

```tsx
// features/add-to-cart/ui/AddToCartButton.tsx
import React from "react";
import { Product } from "entities/product";
import { Button } from "shared/ui/button";

type Props = {
  product: Product;
};

export const AddToCartButton: React.FC<Props> = ({ product }) => {
  // Здесь мы имитируем добавление в корзину
  const handleClick = () => {
    // В реальном коде здесь будет вызов action или сервиса корзины
    console.log("Добавлен в корзину", product.id);
  };

  return (
    <Button variant="primary" onClick={handleClick}>
      В корзину
    </Button>
  );
};
```

```ts
// features/add-to-cart/index.ts
export { AddToCartButton } from "./ui/AddToCartButton";
```

### Фича toggle-favorite

```tsx
// features/toggle-favorite/ui/ToggleFavoriteButton.tsx
import React, { useState } from "react";
import { Product } from "entities/product";
import { Button } from "shared/ui/button";

type Props = {
  product: Product;
};

export const ToggleFavoriteButton: React.FC<Props> = ({ product }) => {
  // В реальном приложении состояние нужно брать из стора, здесь для простоты используем локальное
  const [isFavorite, setIsFavorite] = useState(product.isFavorite);

  const handleClick = () => {
    // Здесь мы переключаем состояние избранного
    const next = !isFavorite;
    setIsFavorite(next);
    console.log("Избранное для", product.id, "=", next);
  };

  return (
    <Button variant="secondary" onClick={handleClick}>
      {isFavorite ? "Убрать из избранного" : "В избранное"}
    </Button>
  );
};
```

```ts
// features/toggle-favorite/index.ts
export { ToggleFavoriteButton } from "./ui/ToggleFavoriteButton";
```

### Виджет products-list

Теперь создадим виджет, который соберет сущность и фичи в один блок.

```tsx
// widgets/products-list/ui/ProductsList.tsx
import React, { useEffect, useState } from "react";
import { Product, fetchProductById, ProductCard } from "entities/product";
import { AddToCartButton } from "features/add-to-cart";
import { ToggleFavoriteButton } from "features/toggle-favorite";

export const ProductsList: React.FC = () => {
  // Для примера будем хранить список товаров в локальном состоянии
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Здесь мы имитируем загрузку нескольких товаров
    const load = async () => {
      const product1 = await fetchProductById("1");
      const product2 = await fetchProductById("2");
      setProducts([product1, product2]);
    };

    load();
  }, []);

  if (!products.length) {
    return <div>Загрузка товаров...</div>;
  }

  return (
    <div className="products-list">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          // Здесь мы прокидываем в слот кнопки действий из фич
          actionsSlot={
            <div style={{ display: "flex", gap: 8 }}>
              <AddToCartButton product={product} />
              <ToggleFavoriteButton product={product} />
            </div>
          }
        />
      ))}
    </div>
  );
};
```

```ts
// widgets/products-list/index.ts
export { ProductsList } from "./ui/ProductsList";
```

Как видите, этот виджет — место, где сущность Product и фичи add-to-cart, toggle-favorite взаимодействуют через композицию, не нарушая слои.

### Страница products

И наконец, страница, которая использует виджет.

```tsx
// pages/products/ui/ProductsPage.tsx
import React from "react";
import { ProductsList } from "widgets/products-list";

export const ProductsPage: React.FC = () => {
  // Здесь страница просто использует виджет
  return (
    <div className="page">
      <h1>Товары</h1>
      <ProductsList />
    </div>
  );
};
```

```ts
// pages/products/index.ts
export { ProductsPage } from "./ui/ProductsPage";
```

---

## Заключение

Feature-Sliced Design для React помогает структурировать проект по бизнес-смыслам, а не по типам файлов. Вы разделяете код на слои (app, processes, pages, widgets, features, entities, shared) и организуете его в модули с четкими публичными API. Это делает код более предсказуемым, снижает связность между частями приложения и упрощает масштабирование.

Ключевые практики, которые стоит вынести:

- группируйте файлы вокруг бизнес-функций и сущностей;
- используйте index-файлы как публичный API модулей;
- следите за направлением зависимостей между слоями;
- используйте alias-пути для читаемых импортов;
- внедряйте FSD постепенно, начиная с новых фич или страниц.

Инструменты и шаблоны из экосистемы «react-fsd» помогают ускорить внедрение: дают готовую структуру, правила линтинга и генераторы модулей. Но главный результат достигается не за счет библиотеки, а за счет того, что вы начинаете мыслить архитектурой на уровне бизнес-возможностей, а не на уровне отдельных компонентов.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как организовать тесты в проекте с FSD

Тесты лучше хранить рядом с кодом, который они проверяют. Например:

- entities/product/ui/ProductCard.test.tsx;
- features/auth-by-username/model/slice.test.ts.

Важно, чтобы импорт в тестах также шел через публичный API модуля (index.ts), а не напрямую во внутренние файлы, если вы не тестируете внутреннюю функцию специально. Для unit-тестов приватной логики допустимо импортировать файл напрямую, но старайтесь не использовать такие импорты вне тестов.

### Как правильно хранить типы если они используются в нескольких слоях

Если тип действительно общий для нескольких слоев и не относится явно к конкретной сущности, вынесите его в shared/types или shared/lib. Но если тип описывает конкретную сущность (Product, User), то храните его в entities/имя-сущности/model/types.ts и экспортируйте через index.ts. Тогда другие слои будут зависеть от сущности, а не от абстрактного набора типов.

### Как поступать с очень маленькими фичами создавать ли для каждой отдельную директорию

Да, для единообразия лучше создать директорию даже для небольшой фичи. Внутри можно ограничиться только ui и index.ts, без model и lib, если они не нужны. Например:

features/copy-link  
- ui  
  - CopyLinkButton.tsx  
- index.ts  

Позже, если логика усложнится, вы легко добавите model и lib, не меняя структуру импортов.

### Как работать с глобальным состоянием в FSD-проекте

Глобальное состояние (Redux, Zustand, MobX) обычно инициализируется в слое app. Сами слайсы состояния можно располагать:

- в entities — если это состояние сущности;
- в features — если это состояние конкретной фичи.

Не складывайте все редьюсеры и стор в один общий «store» модуль. Лучше разнести по модулям и подключать через корневой конфиг в app/providers/store.

### Как разделить ответственность между widget и page когда логика кажется похожей

Хорошее правило: page отвечает за маршрут и общую компоновку, а widget — за локальный блок с конкретной задачей. Если компонент нужен только на одной странице и использует несколько фич и сущностей, то это почти всегда кандидат на widget. Если же компонент — просто контейнер для конкретного маршрута, он остается на уровне page и использует готовые widgets и features.