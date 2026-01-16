---
metaTitle: Слой entities в архитектуре фронтенда entities-layer
metaDescription: Разбор того как устроен слой entities-layer в современных архитектурах фронтенда - принципы выделения сущностей структура и практические примеры
author: Олег Марков
title: Слой entities - entities-layer
preview: Пошаговое объяснение того как проектировать и использовать слой entities-layer - с примерами кода и практическими рекомендациями по организации сущностей
---

## Введение

Слой entities (entities-layer) — это уровень архитектуры, где вы описываете основные бизнес-сущности приложения: пользователя, товар, заказ, проект, задачу и так далее. На этом уровне обычно нет деталей конкретного UI или конкретного API-запроса. Здесь вы работаете с «чистыми» моделями данных и их базовым поведением.

Смотрите, идея в том, чтобы отделить:

- то, *что* ваше приложение обрабатывает (сущности),
- от того, *как* это отображается (виджеты, страницы) и *откуда* данные приходят (API, базы).

В современных фронтенд-подходах (Feature-Sliced Design, модульные архитектуры, слои domain/entity/ui и подобные) слой entities помогает:

- уменьшить связность между модулями,
- избежать дублирования структур данных,
- облегчить рефакторинг и расширение функциональности.

В статье мы разберем, как организовать entities-layer, какие модули там обычно живут, как связать этот слой с другими и покажу вам примеры структуры проекта и кода.

---

## Что такое слой entities и зачем он нужен

### Основная идея слоя entities

Слой entities — это слой, посвященный моделям предметной области. Проще говоря, здесь описываются:

- **типы данных** (интерфейсы, типы, классы, схемы валидации),
- **базовая логика** вокруг этих типов (простые преобразования, мапперы, форматтеры),
- **хранилища/стейт для конкретной сущности** (например, store пользователя),
- **общие операции** для этой сущности (получение, обновление, нормализация коллекций).

При этом в entities-слое **нет**:

- конкретных UI-элементов (кнопок, таблиц, модалок),
- привязки к страницам (routes, layout-ы страниц),
- сложной бизнес-логики, завязанной на несколько разных сущностей одновременно (это обычно роль слоя features или domain).

Получается, что entities — это «кирпичики» вашего приложения. Features и pages собирают из них нужную функциональность, но сами кирпичики достаточно независимы.

### Связь слоя entities с другими слоями

Если смотреть на типичную фронтенд-архитектуру, слой entities обычно:

- **используется** в:
  - features (фичи оперируют сущностями),
  - widgets (виджеты показывают сущности),
  - pages (страницы комбинируют разные сущности),
- **использует**:
  - shared (общие утилиты, типы, http-клиенты),
  - иногда слой app (например, глобальный стор, если это предусмотрено архитектурой).

Здесь удобно представить правило направленности зависимостей:

- shared → entities → features → widgets → pages → app

Слой entities должен быть как можно более стабильным и независимым, потому что изменения здесь затрагивают весь проект.

---

## Типичная структура слоя entities

### Базовая структура каталога entities

Давайте посмотрим на пример структуры проекта с использованием entities-layer:

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
    user/
      model/
        types.ts
        selectors.ts
        slice.ts
        api.ts
      lib/
        formatUserName.ts
        mapUserDtoToUser.ts
      ui/
        UserAvatar.tsx
        UserName.tsx
      index.ts
    product/
      model/
        types.ts
        selectors.ts
        slice.ts
        api.ts
      lib/
        calcProductPrice.ts
        isProductAvailable.ts
      ui/
        ProductCard.tsx
        ProductPrice.tsx
      index.ts
  shared/
```

Обратите внимание на несколько моментов:

- каждую сущность выносите в **собственную папку**: `user`, `product`, `order` и т.д.;
- внутри сущности почти всегда выделяются подпапки:
  - `model` — все про данные,
  - `lib` — вспомогательные функции для работы с этой сущностью,
  - `ui` — UI-компоненты, которые специализированы на этой сущности (в некоторых подходах их выносят в features или widgets, но в FSD-подходе часто оставляют в entities как «узкоспециализированные»);
- `index.ts` — точка входа, которая управляет экспортами и инкапсулирует внутреннюю структуру.

### Что обычно лежит в model

Подпапка `model` — ключевая часть сущности. Здесь вы обычно храните:

- типы и интерфейсы сущности;
- схемы валидации (если вы используете zod/yup или похожее);
- стейт-менеджмент (redux-slice, zustand-store, effector store и т.п.);
- селекторы к данным;
- API-клиенты, завязанные на эту сущность.

Например, для сущности user:

```ts
// entities/user/model/types.ts

// Базовое описание пользователя
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string // аватар может быть не задан
  role: 'admin' | 'manager' | 'user'
}
```

```ts
// entities/user/model/slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { User } from './types'

// Состояние, связанное с текущим пользователем
interface UserState {
  authUser: User | null // авторизованный пользователь
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  authUser: null,
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<User | null>) {
      // Сохраняем текущего пользователя
      state.authUser = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      // Управляем флагом загрузки
      state.isLoading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      // Сохраняем текст ошибки
      state.error = action.payload
    },
  },
})

export const userReducer = userSlice.reducer
export const userActions = userSlice.actions
```

```ts
// entities/user/model/selectors.ts

import type { RootState } from 'app/store'

// Получаем текущего пользователя из глобального состояния
export const selectAuthUser = (state: RootState) => state.user.authUser

// Проверяем авторизован ли пользователь
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.user.authUser)

// Получаем роль пользователя
export const selectUserRole = (state: RootState) =>
  state.user.authUser?.role ?? 'user'
```

```ts
// entities/user/model/api.ts

import { httpClient } from 'shared/api/httpClient'
import type { User } from './types'

// Загружаем данные текущего пользователя с сервера
export async function fetchCurrentUser(): Promise<User> {
  // Здесь httpClient — это общая обертка над fetch/axios
  const response = await httpClient.get('/me')
  // Предполагаем, что сервер возвращает данные, совместимые с типом User
  return response.data as User
}
```

Здесь вы видите, как в `model` собирается вся логика, относящаяся к данным пользователя.

---

## Entities и UI: когда сущности содержат компоненты

### Зачем в entities иметь UI-компоненты

Часто возникает вопрос: почему UI-компоненты вообще оказываются в слое entities, а не в widgets или features.

Идея в том, что есть **очень простые и переиспользуемые компоненты**, которые привязаны к конкретной сущности, но при этом не содержат сложной логики и не зависят от контекста страницы.

Например:

- `UserAvatar` — просто отображает аватар пользователя;
- `UserName` — показывает имя/фамилию с форматированием;
- `ProductPrice` — выводит цену товара в нужном формате.

Такие компоненты удобно расположить прямо рядом с моделью сущности, чтобы:

- не дублировать их реализацию в разных widgets/features;
- иметь единое место, где меняется способ отображения базовой информации по сущности.

Давайте посмотрим пример.

```tsx
// entities/user/ui/UserName.tsx

import type { User } from '../model/types'

interface UserNameProps {
  user: User // сюда мы передаем сущность пользователя
  showRole?: boolean // опционально отображаем роль
}

// Компонент для отображения имени пользователя
export function UserName(props: UserNameProps) {
  const { user, showRole } = props

  // Собираем полное имя из имени и фамилии
  const fullName = `${user.firstName} ${user.lastName}`

  // Если нужно, добавляем роль
  const roleLabel = showRole ? ` (${user.role})` : ''

  return <span>{fullName + roleLabel}</span>
}
```

```tsx
// entities/user/ui/UserAvatar.tsx

import type { User } from '../model/types'

interface UserAvatarProps {
  user: User
  size?: number // размер аватара по умолчанию
}

// Компонент для отображения аватара пользователя
export function UserAvatar(props: UserAvatarProps) {
  const { user, size = 32 } = props

  // Если аватар не задан, показываем заглушку
  if (!user.avatarUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
        }}
      >
        {/* Показываем первую букву имени как заглушку */}
        {user.firstName[0]}
      </div>
    )
  }

  return (
    <img
      src={user.avatarUrl}
      alt={`${user.firstName} ${user.lastName}`}
      width={size}
      height={size}
      style={{ borderRadius: '50%' }}
    />
  )
}
```

Здесь компоненты простые, не знают ни о роутинге, ни о конкретных страницах — это хороший кандидат для хранения в `entities/user/ui`.

---

## Вспомогательные функции в lib

### Что такое lib внутри сущности

Папка `lib` внутри сущности хранит **чистые функции**, которые работают только с данными этой сущности:

- мапперы (DTO → сущность),
- вычислительные функции (цены, статусы, флаги),
- форматтеры (формат имени, формат статуса).

Давайте разберемся на примере сущности продукт.

```ts
// entities/product/model/types.ts

// Базовая модель продукта
export interface Product {
  id: string
  title: string
  price: number // цена в основной валюте
  currency: 'USD' | 'EUR' | 'RUB'
  isAvailable: boolean
}

// DTO с бэкенда (например, поля названы иначе)
export interface ProductDto {
  id: string
  name: string
  price_cents: number
  currency_code: 'USD' | 'EUR' | 'RUB'
  available: boolean
}
```

```ts
// entities/product/lib/mapProductDtoToProduct.ts

import type { Product, ProductDto } from '../model/types'

// Маппер из DTO в доменную модель Product
export function mapProductDtoToProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    title: dto.name, // переименовываем поле
    price: dto.price_cents / 100, // конвертируем цену из центов
    currency: dto.currency_code,
    isAvailable: dto.available,
  }
}
```

```ts
// entities/product/lib/calcProductPrice.ts

import type { Product } from '../model/types'

// Функция для расчета цены с учетом скидки
export function calcDiscountedPrice(product: Product, discountPercent: number) {
  // Проверяем разумность процента скидки
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid discount percent')
  }

  // Вычисляем итоговую цену
  const price = product.price * (1 - discountPercent / 100)

  // Округляем до двух знаков после запятой
  return Math.round(price * 100) / 100
}
```

```ts
// entities/product/lib/isProductAvailable.ts

import type { Product } from '../model/types'

// Проверяем доступность товара
export function isProductAvailable(product: Product): boolean {
  // Сейчас просто читаем поле, но в будущем логика может усложниться
  return product.isAvailable
}
```

Такие функции удобно держать в `lib`, чтобы:

- не смешивать их с типами и стором в `model`,
- не размазывать по features и pages, где эта логика может начать дублироваться.

---

## Точки входа и публичный контракт сущности

### Зачем нужен index.ts в каждой сущности

Вы уже видели в структуре выше файл `entities/user/index.ts`. Это так называемая точка входа сущности. Через нее вы определяете, **что именно можно использовать снаружи**.

Принцип простой: внутри сущности может быть много файлов и внутренних деталей, но наружу вы отдаете только то, что действительно нужно другим слоям.

Посмотрите на пример.

```ts
// entities/user/index.ts

// Экспортируем только типы и публичные функции
export type { User } from './model/types'

// Экспортируем только нужные части стора
export {
  userReducer,
  userActions,
} from './model/slice'

// Экспортируем селекторы, которые реально нужны
export {
  selectAuthUser,
  selectIsAuthenticated,
  selectUserRole,
} from './model/selectors'

// Экспортируем UI-компоненты, которые могут использоваться в других слоях
export { UserName } from './ui/UserName'
export { UserAvatar } from './ui/UserAvatar'
```

Теперь в других частях приложения вы импортируете именно из `entities/user`, а не напрямую из внутренних файлов:

```ts
// features/someFeature/ui/SomeComponent.tsx

import { UserAvatar, selectAuthUser } from 'entities/user'
import { useAppSelector } from 'shared/lib/hooks/useAppSelector'

// Пример использования сущности user в фиче
export function SomeComponent() {
  const user = useAppSelector(selectAuthUser)

  // Если пользователь не авторизован, ничего не показываем
  if (!user) return null

  return (
    <div>
      {/* Здесь мы используем UI-компонент из слоя entities */}
      <UserAvatar user={user} size={40} />
    </div>
  )
}
```

Как видите, такой подход:

- защищает вас от «утечки» внутренних деталей сущности;
- упрощает рефакторинг (вы можете менять структуру внутри `entities/user`, не затрагивая весь проект);
- делает зависимости явными и контролируемыми.

---

## Связь entities с API и стейт-менеджментом

### Где размещать запросы к API

Выше мы уже затронули этот вопрос, но давайте чуть более четко сформулируем:

- **Запросы, которые работают с конкретной сущностью**, разумно хранить в ее `model/api.ts`.
- **Запросы, которые агрегируют несколько сущностей**, чаще всего относятся к features (например, фича «создание заказа» может работать и с сущностью user, и с product, и с order).

Смотрите пример для продукта:

```ts
// entities/product/model/api.ts

import { httpClient } from 'shared/api/httpClient'
import type { Product, ProductDto } from './types'
import { mapProductDtoToProduct } from '../lib/mapProductDtoToProduct'

// Загружаем список продуктов
export async function fetchProducts(): Promise<Product[]> {
  const response = await httpClient.get<ProductDto[]>('/products')

  // Маппим каждый DTO в доменную модель
  return response.data.map(mapProductDtoToProduct)
}

// Загружаем один продукт
export async function fetchProductById(id: string): Promise<Product> {
  const response = await httpClient.get<ProductDto>(`/products/${id}`)

  // Преобразуем DTO в сущность
  return mapProductDtoToProduct(response.data)
}
```

Такой подход концентрирует всю работу с API для конкретной сущности в одном месте.

### Где хранить стор сущности

Подход зависит от используемой библиотеки, но общее правило:

- если стор описывает **состояние конкретной сущности** (например, список продуктов, текущий пользователь), он может жить в `entities/.../model`;
- если стор описывает **состояние фичи** (например, состояние формы оформления заказа, пошаговый wizard и т.п.), его логичнее разместить в features.

Пример стора для списка продуктов:

```ts
// entities/product/model/slice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Product } from './types'
import { fetchProducts } from './api'

// Асинхронный экшен для загрузки продуктов
export const loadProducts = createAsyncThunk(
  'product/loadProducts',
  async () => {
    // Загружаем продукты с сервера
    const products = await fetchProducts()
    return products
  },
)

// Состояние для списка продуктов
interface ProductState {
  list: Product[]
  isLoading: boolean
  error: string | null
}

const initialState: ProductState = {
  list: [],
  isLoading: false,
  error: null,
}

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Можно добавить дополнительные синхронные редьюсеры
    clearProducts(state) {
      // Очищаем список продуктов
      state.list = []
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadProducts.pending, (state) => {
        // Показываем состояние загрузки
        state.isLoading = true
        state.error = null
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        // Сохраняем загруженные данные
        state.list = action.payload
        state.isLoading = false
      })
      .addCase(loadProducts.rejected, (state, action) => {
        // Сохраняем ошибку, если она есть
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load products'
      })
  },
})

export const productReducer = productSlice.reducer
export const productActions = productSlice.actions
```

Затем в `entities/product/index.ts` вы экспортируете `productReducer` и при необходимости подключаете его к общему стору приложения.

---

## Практический пример использования entities-layer от страницы до сущности

### Структура примера

Давайте соберем простую страницу, которая:

- показывает список продуктов;
- использует слой entities для загрузки и отображения данных.

Структура будет такой:

```text
entities/
  product/
    model/
      types.ts
      slice.ts
      selectors.ts
      api.ts
    ui/
      ProductCard.tsx
    lib/
      mapProductDtoToProduct.ts
      calcProductPrice.ts
    index.ts

features/
  productList/
    ui/
      ProductList.tsx
    index.ts

pages/
  ProductsPage/
    ui/
      ProductsPage.tsx
    index.ts
```

### Реализация сущности product

Часть кода мы уже видели, добавим недостающие детали.

```ts
// entities/product/model/selectors.ts

import type { RootState } from 'app/store'

// Выбираем список продуктов из состояния
export const selectProductList = (state: RootState) => state.product.list

// Выбираем флаг загрузки
export const selectProductIsLoading = (state: RootState) =>
  state.product.isLoading

// Выбираем текст ошибки
export const selectProductError = (state: RootState) => state.product.error
```

```tsx
// entities/product/ui/ProductCard.tsx

import type { Product } from '../model/types'
import { calcDiscountedPrice } from '../lib/calcProductPrice'

interface ProductCardProps {
  product: Product
  discountPercent?: number // опциональная скидка
}

// Карточка продукта
export function ProductCard(props: ProductCardProps) {
  const { product, discountPercent } = props

  // Вычисляем цену со скидкой, если она указана
  const finalPrice =
    discountPercent != null
      ? calcDiscountedPrice(product, discountPercent)
      : product.price

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: 12,
        borderRadius: 4,
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{product.title}</div>
      <div>
        {/* Показываем цену с указанием валюты */}
        Цена: {finalPrice} {product.currency}
      </div>
      {!product.isAvailable && (
        <div style={{ color: 'red' }}>
          {/* Сообщаем что товара нет в наличии */}
          Нет в наличии
        </div>
      )}
    </div>
  )
}
```

```ts
// entities/product/index.ts

export type { Product } from './model/types'

export {
  productReducer,
  productActions,
} from './model/slice'

export {
  selectProductList,
  selectProductIsLoading,
  selectProductError,
} from './model/selectors'

export { loadProducts } from './model/slice'

export { ProductCard } from './ui/ProductCard'
```

### Фича productList

Теперь создадим фичу, которая умеет:

- запрашивать список продуктов,
- отображать его с помощью `ProductCard`.

```tsx
// features/productList/ui/ProductList.tsx

import { useEffect } from 'react'
import { useAppDispatch } from 'shared/lib/hooks/useAppDispatch'
import { useAppSelector } from 'shared/lib/hooks/useAppSelector'
import {
  loadProducts,
  selectProductList,
  selectProductIsLoading,
  selectProductError,
  ProductCard,
} from 'entities/product'

// Список продуктов как фича
export function ProductList() {
  const dispatch = useAppDispatch()

  const products = useAppSelector(selectProductList)
  const isLoading = useAppSelector(selectProductIsLoading)
  const error = useAppSelector(selectProductError)

  // При первом рендере отправляем запрос за продуктами
  useEffect(() => {
    dispatch(loadProducts())
  }, [dispatch])

  // Показываем индикатор загрузки
  if (isLoading) {
    return <div>Загрузка продуктов...</div>
  }

  // Показываем ошибку если она есть
  if (error) {
    return <div>Ошибка загрузки продуктов: {error}</div>
  }

  // Если список пуст, сообщаем об этом
  if (products.length === 0) {
    return <div>Продукты не найдены</div>
  }

  return (
    <div>
      {/* Отображаем каждый продукт через компонент из entities */}
      {products.map((product) => (
        <ProductCard key={product.id} product={product} discountPercent={10} />
      ))}
    </div>
  )
}
```

```ts
// features/productList/index.ts

export { ProductList } from './ui/ProductList'
```

### Страница ProductsPage

Теперь вы увидите, как страница использует фичу, а фича — сущности.

```tsx
// pages/ProductsPage/ui/ProductsPage.tsx

import { ProductList } from 'features/productList'

// Страница со списком продуктов
export function ProductsPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Каталог продуктов</h1>
      {/* Здесь мы вставляем фичу, которая использует entities */}
      <ProductList />
    </main>
  )
}
```

```ts
// pages/ProductsPage/index.ts

export { ProductsPage } from './ui/ProductsPage'
```

Так у вас получается понятная цепочка:

- слой `entities` описывает сущность `product` и умеет работать с ее данными;
- слой `features` собирает логику отображения списка продуктов;
- слой `pages` использует фичу и создает полноценную страницу.

---

## Рекомендации по проектированию entities-layer

### Как выделять сущности

Есть несколько практичных вопросов, которые стоит себе задать:

1. **Является ли это объектом предметной области?**  
   Если да — это хороший кандидат на сущность: `User`, `Product`, `Order`, `Task`, `Project`.

2. **Используется ли это в нескольких местах приложения?**  
   Если да, лучше вынести в сущность, чтобы централизовать управление.

3. **Есть ли у объекта собственные атрибуты и поведение?**  
   Если объект просто часть другой сущности и не живет отдельно, возможно, это не отдельная сущность, а вложенный тип.

Например:

- `Address` может быть отдельной сущностью, если вы показываете его в разных местах, редактируете, храните независимо;
- или он может быть частью `User`, если нигде отдельно не фигурирует.

### Где проводить границу между entities и features

Можно придерживаться следующего правила:

- **entities** — «что это такое» и «как это выглядит в самом базовом виде»;
- **features** — «что можно с этим сделать» в конкретном бизнес-контексте.

Пример:

- `User` (entities):
  - тип `User`;
  - `UserAvatar`, `UserName`;
  - стор текущего пользователя.
- `Auth` (features):
  - формы логина/регистрации;
  - логика авторизации и выхода;
  - редиректы после логина.

Если вы чувствуете, что в коде начинаются проверки «если пользователь админ, то перекинуть на страницу X», это уже скорее фича, а не базовая сущность.

### Антипаттерны в entities-layer

На что стоит обратить внимание:

1. **Простыня зависимостей**  
   Если `entities/user` начинает импортировать `features`, `widgets` или `pages` — вы ломаете слои и получаете циклические зависимости.

2. **Слишком «толстые» сущности**  
   Если в одной сущности собрано абсолютно все — от низкоуровневых утилит до сложных многостраничных форм — скорее всего, ее нужно разбить или вынести часть логики в features.

3. **Дублирование типов и логики**  
   Если вы видите похожие интерфейсы и функции в разных частях приложения, возможно, им место в слое entities.

4. **Утечка деталей реализации**  
   Если другие слои импортируют файлы из глубины сущности (например, `entities/user/model/slice` напрямую), вы теряете контроль над публичным контрактом. Лучше строго использовать `entities/user`.

---

## Заключение

Слой entities (entities-layer) — это фундамент уровневой архитектуры фронтенда. Здесь вы описываете основные сущности предметной области, их структуры данных, простую логику и, при необходимости, базовые UI-компоненты.

Если вы четко разделяете:

- сущности (entities),
- функциональность вокруг них (features),
- композицию и отображение (widgets, pages),

то:

- проект становится проще в поддержке;
- легче добавлять новые фичи;
- проще рефакторить слой данных и API.

Смотрите на entities-layer как на «словарь» вашего приложения. Чем он понятнее, чище и стабильнее, тем легче работать со всей системой в целом.

---

## Частозадаваемые технические вопросы

### Как организовать переиспользуемые типы между разными сущностями

Если тип не относится только к одной сущности (например, общий тип `Pagination`, `DateRange`, `Money`), имеет смысл вынести его в слой shared, например `shared/types`.  

Мини-инструкция:

1. Создайте файл `src/shared/types/pagination.ts` с общим типом.
2. Используйте этот тип в `entities/*/model/types.ts`, импортируя только из shared.
3. Не импортируйте типы из одной сущности в другую напрямую, если это общий абстрактный тип.

---

### Что делать, если сущность зависит от другой сущности

Важно избегать циклических зависимостей `entities/A` ↔ `entities/B`.  

Как поступить:

1. Если зависимость логически односторонняя (например, `Order` содержит `User`), используйте только типы другой сущности, не подтягивая ее модель и стор.
2. Если зависимости постоянно пересекаются, возможно, вы описали не те границы и стоит ввести третью сущность или вынести часть логики в features.

---

### Можно ли использовать hooks внутри entities-layer

Можно, но аккуратно.  

Рекомендации:

1. Hooks, которые завязаны на UI и жизненный цикл компонента (`useEffect`, `useState`), лучше оставлять в features/widgets/pages.
2. В entities используйте hooks для работы со стором (например, `useUser`), если вы осознанно делаете «умные» сущности. Но контролируйте, чтобы они не начинали знать о маршрутах, авторизации и другой высокой логике.

---

### Как тестировать код из entities-layer

Entities удобно тестировать изолированно.  

Шаги:

1. Для `lib` пишите unit-тесты чистых функций (мапперы, форматтеры).
2. Для `model` тестируйте редьюсеры и async-thunks без привязки к UI.
3. Для UI-компонентов в entities (таких как `UserAvatar`) используйте snapshot-тесты или тесты на отображение пропсов.

---

### Как со временем реорганизовать entities без поломки импортов

Чтобы упростить рефакторинг:

1. Соблюдайте правило: внешние импорты только через `entities/SomeEntity/index.ts`.
2. При переезде файлов меняйте только внутренние пути внутри папки сущности.
3. Если меняется публичный контракт (экспорт из `index.ts`), делайте это осознанно и поэтапно, сначала добавляя новые экспорты, затем деприкейтив старые.