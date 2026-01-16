---
metaTitle: Архитектура Feature-Sliced Design для Svelte - практическое руководство по svelte-fsd
metaDescription: Разбор подхода Feature-Sliced Design для Svelte - как организовать код проекта с помощью svelte-fsd чтобы масштабировать и сопровождать приложение без хаоса в структурах
author: Олег Марков
title: Архитектура Feature-Sliced Design в Svelte с помощью svelte-fsd
preview: Пошаговое объяснение как применить Feature-Sliced Design в Svelte-проектах с помощью svelte-fsd - структура слоев примеры кода и практические советы по организации фронтенд архитектуры
---

## Введение

Feature-Sliced Design (FSD) за последние годы стал одним из самых обсуждаемых подходов к архитектуре фронтенда. Он помогает держать проект управляемым по мере роста, уменьшает связанность модулей и упрощает внедрение новых фич.  

Но если вы работаете со Svelte или SvelteKit, то быстро замечаете, что большинство материалов по FSD ориентированы на React. Отсюда типичная ситуация: есть желание применить понятный архитектурный подход, но нет ясности, как именно «переложить» его на мир Svelte.

Здесь на сцену выходит svelte-fsd — набор принципов и соглашений, адаптирующий Feature-Sliced Design под Svelte и SvelteKit. В этой статье вы увидите, как шаг за шагом:

- организовать структуру проекта в духе FSD;
- применить слои и срезы в Svelte;
- правильно разнести сторы, компоненты и бизнес-логику;
- подключить svelte-fsd к существующему приложению;
- выстроить удобные импорты и архитектурные границы.

Смотрите, я покажу вам, как это работает на практических примерах, чтобы вы могли сразу попробовать подход в своем проекте.

---

## Что такое Feature-Sliced Design в контексте Svelte

### Основные принципы FSD

Сначала давайте коротко напомним, что такое Feature-Sliced Design, но через призму того, как вы будете применять его в Svelte.

Идея подхода:

1. Делить код не по типам файлов (components, store, utils), а по доменным смыслам — фичам и бизнес-областям.
2. Выстраивать уровни (слои) приложения:
   - entities — базовые сущности предметной области;
   - features — функциональные «фишки» для пользователя;
   - widgets — составные блоки интерфейса;
   - pages — страницы приложения;
   - processes — сквозные сценарии (опционально);
   - app — корневая инициализация и инфраструктура;
   - shared — общие модули, которыми можно делиться с любым слоем.
3. Ограничивать зависимости между слоями — «верхние» слои могут использовать нижние, но не наоборот.

В React-мире обычно всё завязано на компонентный подход и хуки. В Svelte у нас есть:

- компоненты .svelte;
- сценарии (script) с логикой;
- сторы;
- контексты;
- модульные скрипты (в SvelteKit);
- файлы маршрутов.

Наша задача — разложить всё это по слоям так, чтобы структура проекта была предсказуемой, а изменения в одном месте не ломали весь проект.

### Что именно добавляет svelte-fsd

svelte-fsd — это не обязательно библиотека в npm (часто это «шаблон + соглашения»), а скорее способ структурировать Svelte-проект по FSD:

- рекомендуемая структура папок;
- соглашения по именованию;
- адаптация под SvelteKit routing;
- подходы к стором и контекстам в пределах слоёв;
- понятные точки входа (public API) для фич, сущностей и т.д.

Ценность здесь не в каком-то конкретном пакете, а в наборе правил, которые вы можете реализовать руками или взять из готового шаблона.

---

## Базовая структура проекта Svelte с Feature-Sliced Design

Давайте разберёмся, как выглядит типичный SvelteKit-проект, организованный по FSD.  

Представим структуру директории src:

- app
- processes
- pages
- widgets
- features
- entities
- shared

Это те же слои, которые используются в классическом FSD, адаптированные под Svelte.

### Пример структуры SvelteKit-проекта

Здесь я размещаю пример, чтобы вам было проще понять общую картину:

```text
src/
  app/
    index.ts            // Инициализация приложения, провайдеры, глобальные сторы
    providers/
      theme/
        ThemeProvider.svelte
      api/
        ApiProvider.svelte
    layout/
      AppLayout.svelte  // Базовый layout приложения

  processes/
    checkout/
      model/
        store.ts        // Сторы и логика процесса оформления заказа
      ui/
        CheckoutFlow.svelte

  pages/
    home/
      ui/
        HomePage.svelte
    profile/
      ui/
        ProfilePage.svelte
      model/
        loader.ts       // Загрузка данных страницы

  widgets/
    header/
      ui/
        Header.svelte
      model/
        userMenu.ts
    sidebar/
      ui/
        Sidebar.svelte

  features/
    auth/
      login/
        ui/
          LoginForm.svelte
        model/
          loginStore.ts
          login.api.ts
    cart/
      add-to-cart/
        ui/
          AddToCartButton.svelte
        model/
          addToCart.ts

  entities/
    user/
      model/
        userStore.ts
        user.types.ts
      ui/
        UserAvatar.svelte
        UserName.svelte

    product/
      model/
        product.types.ts
      ui/
        ProductCard.svelte

  shared/
    ui/
      Button.svelte
      Input.svelte
      Modal.svelte
    api/
      httpClient.ts
    config/
      env.ts
    lib/
      formatPrice.ts
      createFormStore.ts
    styles/
      global.css
      variables.css
```

Эта структура — пример того, как svelte-fsd предлагает разложить код по слоям. Вы можете адаптировать её под свои нужды, но главное — сохранить принцип: доменные сущности и фичи в центре, технические детали — в shared/app.

---

## Слои FSD в Svelte-проектах

Теперь давайте пройдёмся по каждому слою и разберём, что в нём обычно живёт в Svelte-проекте.

### Слой app

Слой app отвечает за «оболочку» всего приложения: инициализацию, глобальные провайдеры, общие layout’ы.

В SvelteKit часть этих задач берут на себя:

- src/routes/+layout.svelte;
- src/routes/+layout.ts / +layout.server.ts;
- src/hooks.server.ts.

В подходе svelte-fsd удобно выносить всё это в слой app как отдельные модули, а в роутинге только их подключать.

#### Пример провайдера темы

Покажу вам, как это реализовано на практике.

Файл src/app/providers/theme/ThemeProvider.svelte:

```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';

  // Тип возможных тем
  type Theme = 'light' | 'dark';

  // Создаем стор для текущей темы
  const themeStore: Writable<Theme> = writable('light');

  // Устанавливаем контекст, чтобы дочерние компоненты могли получить доступ
  setContext('theme', themeStore);
</script>

<!-- Оборачиваем слот, чтобы контекст был доступен во всем приложении -->
<slot />
```

Файл src/app/layout/AppLayout.svelte:

```svelte
<script lang="ts">
  import ThemeProvider from '../providers/theme/ThemeProvider.svelte';
</script>

<!-- Здесь мы оборачиваем приложение в ThemeProvider -->
<ThemeProvider>
  <slot />
</ThemeProvider>
```

Дальше в SvelteKit layout можно использовать AppLayout как основу.

### Слой shared

Слой shared хранит то, что может использоваться в любом другом слое:

- базовые UI-компоненты (Button, Input, Modal);
- общие утилиты;
- общие типы;
- http-клиент;
- конфигурации.

Главное правило: shared ничего не знает о доменной логике. Никаких зависимостей от features, entities и т.п.

#### Пример базового компонента Button

Теперь вы увидите, как это выглядит в коде.

Файл src/shared/ui/Button.svelte:

```svelte
<script lang="ts">
  // Пропсы кнопки
  export let variant: 'primary' | 'secondary' = 'primary';
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' = 'button';

  // Остальные атрибуты прокидываем через ...$$restProps
  export let ariaLabel: string | undefined;
</script>

<button
  class={`btn btn-${variant}`}
  {type}
  {disabled}
  aria-label={ariaLabel}
>
  <!-- Слот для содержимого кнопки -->
  <slot />
</button>

<style>
  /* Здесь мы задаем базовые стили, не завязанные на доменную логику */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
  }

  .btn-primary {
    background: #2d6cdf;
    color: white;
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }
</style>
```

Этот компонент можно безопасно использовать в любом слое — от entities до pages.

---

## Entities — сущности в Svelte-проектах

Слой entities — это модель предметной области. Здесь вы описываете пользователей, товары, заказы и т.д.

Что обычно живёт в entities:

- типы и интерфейсы;
- сторы сущностей;
- базовые UI-компоненты, отображающие сущность (аватар, карточка товара);
- иногда — простые функции работы с сущностями.

### Пример: сущность User

Давайте разберёмся на примере сущности пользователя.

Файл src/entities/user/model/user.types.ts:

```ts
// Здесь мы задаем тип пользователя, который будем использовать во всем проекте
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  email: string;
}
```

Файл src/entities/user/model/userStore.ts:

```ts
import { writable, type Writable } from 'svelte/store';
import type { User } from './user.types';

// Стор для текущего авторизованного пользователя
const currentUser: Writable<User | null> = writable(null);

// Экспортируем стор и вспомогательные функции
export const userModel = {
  currentUser,

  // Устанавливаем текущего пользователя
  setUser(user: User | null) {
    currentUser.set(user);
  },

  // Очищаем данные пользователя при логауте
  logout() {
    currentUser.set(null);
  }
};
```

Файл src/entities/user/ui/UserAvatar.svelte:

```svelte
<script lang="ts">
  import type { User } from '../model/user.types';

  // Пользователь, для которого рисуем аватар
  export let user: User;
  export let size: number = 32;
</script>

<!-- Если есть ссылка на аватар - показываем ее, иначе - первую букву имени -->
<div
  class="avatar"
  style={`width: ${size}px; height: ${size}px;`}
>
  {#if user.avatarUrl}
    <img src={user.avatarUrl} alt={user.name} />
  {:else}
    <span>{user.name.charAt(0).toUpperCase()}</span>
  {/if}
</div>

<style>
  .avatar {
    border-radius: 50%;
    overflow: hidden;
    background: #ccc;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
```

Здесь сущность user самодостаточна: у неё есть модель и базовые компоненты. Любая feature или widget, которым нужен пользователь, берут всё отсюда, а не из “глобальной папки components”.

---

## Features — фичи как единицы функциональности

Слой features — один из ключевых в FSD. Фича — это не просто компонент, а законченный пользовательский сценарий или его часть.  

Примеры фич:

- логин;
- добавление товара в корзину;
- фильтрация списка;
- выбор языка.

Каждая фича может иметь свой UI и модель.

### Пример фичи LoginForm

Давайте посмотрим, что происходит в следующем примере — фича авторизации.

Структура:

```text
features/
  auth/
    login/
      ui/
        LoginForm.svelte
      model/
        loginStore.ts
        login.api.ts
```

Файл src/features/auth/login/model/login.api.ts:

```ts
// Здесь мы эмулируем API-запрос на сервер для логина
export async function loginRequest(email: string, password: string) {
  // В реальном приложении вы сделаете HTTP-запрос
  // Здесь обратите внимание - мы используем await для асинхронной операции
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (email === 'test@example.com' && password === '123456') {
    return {
      id: '1',
      name: 'Test User',
      email
    };
  }

  throw new Error('Неверный email или пароль');
}
```

Файл src/features/auth/login/model/loginStore.ts:

```ts
import { writable } from 'svelte/store';
import { loginRequest } from './login.api';
import { userModel } from '$entities/user/model/userStore';

// Тип стейта фичи логина
interface LoginState {
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: LoginState = {
  loading: false,
  error: null
};

// Создаем стор состояния логина
const state = writable<LoginState>(initialState);

// Экспортируем модель фичи
export const loginModel = {
  state,

  async login(email: string, password: string) {
    // Ставим флаг загрузки и очищаем ошибку
    state.set({ loading: true, error: null });

    try {
      const user = await loginRequest(email, password);

      // Если логин успешен - сохраняем пользователя в модели сущности
      userModel.setUser(user);

      // Сбрасываем состояние логина
      state.set({ loading: false, error: null });
    } catch (e) {
      // При ошибке - показываем сообщение
      state.set({
        loading: false,
        error: e instanceof Error ? e.message : 'Ошибка входа'
      });
    }
  }
};
```

Здесь обратите внимание, как слой feature зависит от слоя entities:

- loginModel вызывает userModel.setUser;
- но сущность user ничего не знает о фиче логина.

Файл src/features/auth/login/ui/LoginForm.svelte:

```svelte
<script lang="ts">
  import { get } from 'svelte/store';
  import { loginModel } from '../model/loginStore';
  import Button from '$shared/ui/Button.svelte';

  let email = '';
  let password = '';

  // Подписываемся на стор состояния логина
  let state = get(loginModel.state);

  // Обновляем локальную переменную при изменении стора
  const unsubscribe = loginModel.state.subscribe((value) => {
    state = value;
  });

  // Обрабатываем отправку формы
  async function handleSubmit() {
    // Вызываем метод модели фичи
    await loginModel.login(email, password);
  }

  // Очищаем подписку при уничтожении компонента
  // В Svelte можно вернуть функцию из onDestroy,
  // но здесь для простоты мы опускаем этот момент
</script>

<form on:submit|preventDefault={handleSubmit}>
  <label>
    Email
    <input
      type="email"
      bind:value={email}
      required
    />
  </label>

  <label>
    Пароль
    <input
      type="password"
      bind:value={password}
      required
    />
  </label>

  {#if state.error}
    <p class="error">{state.error}</p>
  {/if}

  <Button type="submit" disabled={state.loading}>
    {#if state.loading}
      Входим...
    {:else}
      Войти
    {/if}
  </Button>
</form>

<style>
  .error {
    color: red;
  }
</style>
```

Фича получилась изолированной: она сама знает, как отправить запрос, как обновить сущность пользователя и как отобразить результаты.

---

## Widgets — составные интерфейсные блоки

Слой widgets — это «секции» интерфейса, которые соединяют несколько фич и сущностей в законченную визуальную часть.

Примеры:

- шапка сайта (header);
- боковая панель (sidebar);
- блок рекомендаций;
- форма поиска с фильтрами.

### Пример виджета Header

Давайте разберёмся на примере header’а, который показывает логотип, имя пользователя и кнопку логина или логаута.

Структура:

```text
widgets/
  header/
    ui/
      Header.svelte
    model/
      userMenu.ts
```

Файл src/widgets/header/ui/Header.svelte:

```svelte
<script lang="ts">
  import { userModel } from '$entities/user/model/userStore';
  import UserAvatar from '$entities/user/ui/UserAvatar.svelte';
  import Button from '$shared/ui/Button.svelte';
  import LoginForm from '$features/auth/login/ui/LoginForm.svelte';
  import { derived } from 'svelte/store';

  // Создаем производный стор для текущего пользователя
  const currentUser$ = derived(userModel.currentUser, ($user) => $user);
  let currentUser = null;

  // Подписываемся на стор пользователя
  const unsubscribe = currentUser$.subscribe((value) => {
    currentUser = value;
  });

  let showLogin = false;

  // Обрабатываем клик по кнопке выхода
  function handleLogout() {
    userModel.logout();
  }

  // Переключаем показ формы логина
  function toggleLogin() {
    showLogin = !showLogin;
  }
</script>

<header class="header">
  <div class="logo">My Svelte App</div>

  <div class="right">
    {#if currentUser}
      <!-- Показываем аватар и имя, если пользователь залогинен -->
      <UserAvatar {user}={currentUser} size={32} />
      <span>{currentUser.name}</span>
      <Button variant="secondary" on:click={handleLogout}>
        Выйти
      </Button>
    {:else}
      <!-- Иначе показываем кнопку логина -->
      <Button on:click={toggleLogin}>
        Войти
      </Button>
    {/if}
  </div>
</header>

{#if showLogin && !currentUser}
  <!-- Если пользователь не залогинен и нажал "Войти" - показываем форму -->
  <LoginForm />
{/if}

<style>
  .header {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f8f8f8;
  }

  .right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
</style>
```

Обратите внимание, как этот фрагмент кода решает задачу:

- виджет ничего не знает о том, как работает логин внутри — он просто использует LoginForm;
- он использует сущность User (через UserAvatar и userModel);
- он комбинирует фичу и сущность в законченную часть интерфейса.

---

## Pages — страницы в SvelteKit и FSD

Слой pages — уровень, который знает о маршрутах и собирает из widgets и features конкретные страницы.

В SvelteKit маршруты привязаны к структуре src/routes. Это значит, что нам нужно аккуратно совместить svelte-fsd со стандартным роутингом.

Один из удобных подходов:

- оставить src/routes для файлов маршрутов;
- внутри использовать компоненты и модели из слоя pages.

### Организация страниц с svelte-fsd

Структура:

```text
src/
  routes/
    +layout.svelte
    +page.svelte              // Главная страница
    profile/
      +page.svelte
  pages/
    home/
      ui/
        HomePage.svelte
    profile/
      ui/
        ProfilePage.svelte
      model/
        loader.ts
```

Файл src/pages/home/ui/HomePage.svelte:

```svelte
<script lang="ts">
  import Header from '$widgets/header/ui/Header.svelte';
  import ProductCard from '$entities/product/ui/ProductCard.svelte';

  // Здесь можно подключить фичи, например, "добавить в корзину"
  import AddToCartButton from '$features/cart/add-to-cart/ui/AddToCartButton.svelte';

  // Массив товаров для примера
  const products = [
    { id: '1', name: 'Товар 1', price: 1000 },
    { id: '2', name: 'Товар 2', price: 2000 }
  ];
</script>

<Header />

<main>
  <h1>Главная</h1>

  <div class="products">
    {#each products as product}
      <div class="product">
        <ProductCard {product} />
        <AddToCartButton {product} />
      </div>
    {/each}
  </div>
</main>

<style>
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .product {
    border: 1px solid #ddd;
    padding: 0.75rem;
  }
</style>
```

Файл src/routes/+page.svelte:

```svelte
<script lang="ts">
  import HomePage from '$pages/home/ui/HomePage.svelte';
</script>

<!-- Здесь мы просто рендерим страницу из слоя pages -->
<HomePage />
```

Таким образом, слой pages становится мостом между роутингом и архитектурой FSD.

---

## Processes — сквозные процессы

Слой processes используется не во всех проектах. Он нужен, когда у вас есть длинные сквозные сценарии, которые затрагивают несколько страниц и фич.

Например:

- процесс оформления заказа;
- онбординг пользователя;
- мастера (wizard’ы).

Svelte здесь ничем особо не отличается от других фреймворков — в processes вы заворачиваете координацию нескольких фич.

Короткий пример: процесс checkout.

```text
processes/
  checkout/
    model/
      store.ts
    ui/
      CheckoutFlow.svelte
```

Файл src/processes/checkout/model/store.ts:

```ts
import { writable } from 'svelte/store';

// Состояние процесса оформления заказа
interface CheckoutState {
  step: 1 | 2 | 3;
  completed: boolean;
}

const initialState: CheckoutState = {
  step: 1,
  completed: false
};

const state = writable<CheckoutState>(initialState);

export const checkoutProcess = {
  state,

  // Переходим к следующему шагу
  next() {
    state.update((s) => {
      if (s.step < 3) {
        return { ...s, step: (s.step + 1) as CheckoutState['step'] };
      }
      return { ...s, completed: true };
    });
  },

  // Сбрасываем процесс
  reset() {
    state.set(initialState);
  }
};
```

Файл src/processes/checkout/ui/CheckoutFlow.svelte:

```svelte
<script lang="ts">
  import { get } from 'svelte/store';
  import { checkoutProcess } from '../model/store';
  import CartWidget from '$widgets/cart/ui/CartWidget.svelte';
  import DeliveryForm from '$features/checkout/delivery/ui/DeliveryForm.svelte';
  import PaymentForm from '$features/checkout/payment/ui/PaymentForm.svelte';

  let state = get(checkoutProcess.state);

  // Подписываемся на стор процесса
  const unsubscribe = checkoutProcess.state.subscribe((value) => {
    state = value;
  });

  // Переход к следующему шагу
  function handleNext() {
    checkoutProcess.next();
  }
</script>

{#if state.completed}
  <p>Заказ оформлен</p>
{:else}
  {#if state.step === 1}
    <CartWidget />
  {:else if state.step === 2}
    <DeliveryForm />
  {:else if state.step === 3}
    <PaymentForm />
  {/if}

  <button on:click={handleNext}>
    Далее
  </button>
{/if}
```

Такой процесс можно использовать на странице оформления заказа и не смешивать логику процесса с конкретными фичами.

---

## Импорт и публичные API слоёв

Чтобы архитектура не превратилась в хаос, svelte-fsd рекомендует определять «точки входа» (public API) для каждого среза (slice).  

Например:

- для сущности user — index.ts в src/entities/user;
- для фичи auth/login — index.ts в src/features/auth/login;
- для виджета header — index.ts в src/widgets/header.

### Пример публичного API сущности user

Давайте посмотрим пример.

Структура:

```text
entities/
  user/
    index.ts
    model/
      userStore.ts
      user.types.ts
    ui/
      UserAvatar.svelte
      UserName.svelte
```

Файл src/entities/user/index.ts:

```ts
// Реэкспортируем всё, что хотим сделать публичным
export * as userModel from './model/userStore';
export * from './model/user.types';
export { default as UserAvatar } from './ui/UserAvatar.svelte';
export { default as UserName } from './ui/UserName.svelte';
```

Теперь в любом месте проекта вы можете писать:

```ts
// Импортируем сущность через ее public API
import { userModel, UserAvatar } from '$entities/user';
```

Это даёт вам два преимущества:

1. Внешний код не лезет внутрь структуры сущности (в model/ui-папки).
2. Вы можете менять внутреннюю структуру user, не затрагивая всех потребителей.

### Aliases для слоёв

Чтобы такие импорты выглядели аккуратно, в SvelteKit удобно настроить alias’ы.  

В файле svelte.config.js (или vite.config.js, в зависимости от версии):

```js
// Здесь мы настраиваем алиасы для слоёв FSD
import path from 'path';
import { sveltekit } from '@sveltejs/kit/vite';

const config = {
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $app: path.resolve('src/app'),
      $processes: path.resolve('src/processes'),
      $pages: path.resolve('src/pages'),
      $widgets: path.resolve('src/widgets'),
      $features: path.resolve('src/features'),
      $entities: path.resolve('src/entities'),
      $shared: path.resolve('src/shared')
    }
  }
};

export default config;
```

Теперь вы можете писать:

```ts
import Header from '$widgets/header';
import { loginModel } from '$features/auth/login';
import { userModel } from '$entities/user';
import Button from '$shared/ui/Button.svelte';
```

и явно видеть, к какому слою относится импортируемый модуль.

---

## Организация store’ов и бизнес-логики в Svelte при FSD

Svelte даёт довольно простой механизм сто́ров, но именно из-за этой простоты часто возникает соблазн создать «один главный store» и раздавать его по всему приложению. В svelte-fsd и в Feature-Sliced подходе в целом это считается антипаттерном.

### Как разносить сторы по слоям

Общий принцип:

- сторы, описывающие сущность, живут в entities;
- сторы, описывающие состояние фичи, живут в features;
- сторы, описывающие сквозной процесс, — в processes;
- глобальные технические сторы (например, тема, локаль) — в app или shared (в зависимости от задачи).

Давайте посмотрим на пример общей фабрики сто́ров в shared, чтобы не дублировать код.

Файл src/shared/lib/createFormStore.ts:

```ts
import { writable } from 'svelte/store';

// Универсальная фабрика стора формы
export function createFormStore<T extends object>(initialValues: T) {
  const values = writable<T>(initialValues);
  const errors = writable<Record<keyof T, string | null>>({} as any);
  const touched = writable<Record<keyof T, boolean>>({} as any);

  return {
    values,
    errors,
    touched,

    // Устанавливаем значение поля
    setField<K extends keyof T>(field: K, value: T[K]) {
      values.update((v) => ({ ...v, [field]: value }));
    },

    // Устанавливаем ошибку поля
    setError<K extends keyof T>(field: K, message: string | null) {
      errors.update((e) => ({ ...e, [field]: message }));
    },

    // Отмечаем поле как посещенное
    setTouched<K extends keyof T>(field: K, isTouched: boolean) {
      touched.update((t) => ({ ...t, [field]: isTouched }));
    }
  };
}
```

Теперь любая фича с формой (логин, доставка, фильтры) может использовать эту фабрику, оставаясь в рамках своего слоя.

---

## Интеграция svelte-fsd в существующий проект

Если у вас уже есть Svelte- или SvelteKit-проект и вы хотите постепенно перейти к Feature-Sliced Design, удобно двигаться по шагам.

### Шаг 1. Ввод слоёв без жёсткой реструктуризации

- Добавьте в src директории entities, features, widgets, shared, pages, app.
- Настройте alias’ы для этих слоёв.
- Новые модули создавайте уже в новой структуре.

Старый код можно пока оставить как есть (например, в папке components) и постепенно переносить.

### Шаг 2. Выделите сущности

- Сгруппируйте типы и логические сущности: User, Product, Order.
- Вынесите их модели и UI-компоненты в src/entities.
- Настройте публичные API (index.ts) для первых сущностей.

Здесь полезно начинать именно с entities — они составляют «язык» вашего приложения.

### Шаг 3. Перенесите крупные фичи

- Найдите фрагменты логики, которые повторяются или логически цельны: логин, регистрация, поиск, корзина.
- Вынесите их в features, создавая отдельные папки.
- Оставьте старые вызовы, но меняйте импорты на новые пути.

### Шаг 4. Постепенно собирайте widgets и pages

- Формально выделяйте виджеты (header, footer, sidebar).
- Создавайте слой pages и переносите в него логику страниц.
- В роутинге SvelteKit начинайте рендерить страницы из слоя pages, как в показанном выше примере.

Так вы сможете плавно перейти на svelte-fsd без «большого переписывания».

---

## Заключение

Подход Feature-Sliced Design в связке с Svelte и SvelteKit помогает выстроить архитектуру проекта вокруг доменной логики, а не вокруг технических деталей.  

svelte-fsd в этом контексте — это адаптация FSD под особенности Svelte:

- работа со слоями и срезами (entities, features, widgets, pages, processes, app, shared);
- ясные архитектурные границы между слоями;
- понятные публичные API для сущностей и фич;
- использование Svelte-специфики (stores, context, routing) без нарушения принципов FSD.

Главная идея — каждая часть приложения отвечает за свою область:

- сущности описывают предметный мир;
- фичи реализуют конкретные пользовательские сценарии;
- виджеты собирают фичи и сущности в интерфейсные блоки;
- страницы и процессы координируют работу нескольких частей, но не тянут в себя лишнюю логику.

Двигаясь по этому пути шаг за шагом, вы снижаете связанность кода, упрощаете поддержку и облегчаете добавление новых возможностей в Svelte-приложение.

---

## Частозадаваемые технические вопросы по svelte-fsd

### Как сочетать svelte-fsd и file-based routing SvelteKit чтобы не дублировать структуру

Обычно src/routes остаётся только точкой входа. Внутри +page.svelte вы просто импортируете компонент из слоя pages. Структуру роутов повторять в pages не обязательно, но удобно: pages/home, pages/profile и т.п. Маршруты не «знают» о слоях ниже pages, взаимодействие идёт только через компоненты страниц.

### Как хранить типы которые относятся сразу к нескольким сущностям

Если тип относится к конкретной сущности — он в entities/<entity>/model. Если тип «сквозной» и используется во многих местах (например, ApiError или PaginatedResponse), его можно вынести в shared/lib или shared/api. Главное — не складывать доменные типы «в кучу» в shared, а держать их ближе к сущностям.

### Как правильно использовать контексты Svelte в рамках FSD

Контекст — технический механизм. Его инициаторы обычно живут в app (глобальные провайдеры) или в widgets (локальные провайдеры для части интерфейса). Внутри features и entities лучше не создавать новые контексты, а только потреблять уже заданные, чтобы не размывать ответственность слоёв.

### Как поступать с глобальными сторми авторизации или темы приложения

Если стор описывает техническое глобальное состояние (тема, локаль) — он уместен в app или shared. Если это доменное состояние (текущий пользователь) — лучше разместить его в entities/user. При этом слой app может использовать этот стор (например, чтобы регулировать доступ к страницам), но не владеть им.

### Что делать с очень мелкими фичами вроде простого toggle или show/hide

Если поведение действительно примитивное и не несёт бизнес-смысла, его можно реализовать как локальное состояние компонента или как общую утилиту/хук в shared/lib. Выносить в полноценную feature есть смысл только тогда, когда сценарий отражает заметный пользовательский функционал или переиспользуется в нескольких местах.