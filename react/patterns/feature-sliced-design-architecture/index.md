---
metaTitle: "Feature-Sliced Design в React: архитектура больших приложений"
metaDescription: "Разбираем Feature-Sliced Design — методологию архитектуры React приложений. Слои, слайсы, сегменты с практическими примерами."
author: "Антон Ларичев"
title: "Архитектура больших React приложений: Feature-Sliced Design"
preview: "Feature-Sliced Design — методология организации кода, которая решает проблему хаоса в больших React приложениях через строгие слои и правила зависимостей."
---

## Что такое Feature-Sliced Design

Feature-Sliced Design (FSD) — это архитектурная методология для фронтенд-приложений. Она решает главную проблему роста кодовой базы: когда приложение перестаёт помещаться в голове одного разработчика и изменения в одном месте ломают несвязанные части.

FSD строит приложение из трёх понятий: **слои** (layers), **слайсы** (slices) и **сегменты** (segments). Каждый слой имеет строго определённую ответственность, а зависимости между ними идут только сверху вниз.

## Структура слоёв

Все слои располагаются в корне `src/` и образуют иерархию от общего к конкретному:

```
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Правило одно: слой может импортировать только из слоёв, которые находятся ниже него. `features` может использовать `entities` и `shared`, но никак не `pages` или `widgets`.

### shared

Самый нижний слой — переиспользуемые элементы без привязки к бизнес-логике. Здесь живут UI-компоненты, утилиты, конфигурация API, типы.

```
shared/
  ui/
    Button/
    Input/
    Modal/
  api/
    instance.ts
  lib/
    formatDate.ts
    formatPrice.ts
  config/
    routes.ts
  types/
    pagination.ts
```

Компоненты в `shared/ui` не знают о бизнес-сущностях. `Button` — это просто кнопка, без знания о том, что она будет добавлять товар в корзину.

```typescript
// shared/ui/Button/Button.tsx
import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### entities

Слой бизнес-сущностей — объекты предметной области: `User`, `Product`, `Order`, `Cart`. Каждая сущность — отдельный слайс со своими компонентами, хуками и моделью данных.

```
entities/
  product/
    ui/
      ProductCard/
      ProductRating/
    model/
      types.ts
      store.ts
    api/
      productApi.ts
    index.ts
  user/
    ...
  cart/
    ...
```

Пример сущности `product`:

```typescript
// entities/product/model/types.ts
export interface Product {
  id: string;
  title: string;
  price: number;
  rating: number;
  imageUrl: string;
  category: string;
}

// entities/product/ui/ProductCard/ProductCard.tsx
import { FC } from 'react';
import { Product } from '../../model/types';

interface ProductCardProps {
  product: Product;
  actions?: React.ReactNode;
}

export const ProductCard: FC<ProductCardProps> = ({ product, actions }) => {
  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.title} />
      <h3>{product.title}</h3>
      <span>{product.price} ₽</span>
      {actions && <div className="product-card__actions">{actions}</div>}
    </div>
  );
};
```

Обратите внимание на `actions` — слот для дополнительных действий. Это позволяет вышестоящим слоям добавлять кнопки (например, «Добавить в корзину») без того, чтобы `ProductCard` знала о фиче добавления.

### features

Пользовательские сценарии и действия: `AddToCart`, `AuthByEmail`, `FilterProducts`, `WriteReview`. Фичи используют сущности и описывают, что пользователь может делать с ними.

```
features/
  add-to-cart/
    ui/
      AddToCartButton/
    model/
      addToCart.ts
    index.ts
  auth-by-email/
    ui/
      LoginForm/
    model/
      authModel.ts
    api/
      authApi.ts
    index.ts
```

```typescript
// features/add-to-cart/ui/AddToCartButton/AddToCartButton.tsx
import { FC } from 'react';
import { Button } from '@/shared/ui/Button';
import { useCart } from '@/entities/cart';
import { Product } from '@/entities/product';

interface AddToCartButtonProps {
  product: Product;
}

export const AddToCartButton: FC<AddToCartButtonProps> = ({ product }) => {
  const { addItem, isInCart } = useCart();

  if (isInCart(product.id)) {
    return <Button variant="secondary">В корзине</Button>;
  }

  return (
    <Button onClick={() => addItem(product)}>
      Добавить в корзину
    </Button>
  );
};
```

### widgets

Композиционный слой — крупные самодостаточные блоки интерфейса, которые объединяют несколько фич и сущностей: `Header`, `ProductCatalog`, `CartSidebar`, `UserProfile`.

```
widgets/
  header/
    ui/
      Header/
    index.ts
  product-catalog/
    ui/
      ProductCatalog/
      ProductGrid/
    index.ts
  cart-sidebar/
    ...
```

```typescript
// widgets/product-catalog/ui/ProductCatalog/ProductCatalog.tsx
import { FC } from 'react';
import { ProductCard } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { FilterProducts } from '@/features/filter-products';
import { useProducts } from '../../model/useProducts';

export const ProductCatalog: FC = () => {
  const { products, filters, setFilters } = useProducts();

  return (
    <section>
      <FilterProducts value={filters} onChange={setFilters} />
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            actions={<AddToCartButton product={product} />}
          />
        ))}
      </div>
    </section>
  );
};
```

### pages

Страницы приложения. Они только компонуют виджеты и передают им параметры маршрута. Никакой бизнес-логики здесь нет — только сборка.

```
pages/
  home/
    ui/
      HomePage/
    index.ts
  product/
    ui/
      ProductPage/
    index.ts
  cart/
    ...
```

```typescript
// pages/home/ui/HomePage/HomePage.tsx
import { FC } from 'react';
import { ProductCatalog } from '@/widgets/product-catalog';
import { Banner } from '@/widgets/banner';

export const HomePage: FC = () => {
  return (
    <main>
      <Banner />
      <ProductCatalog />
    </main>
  );
};
```

### app

Верхний слой инициализации: провайдеры, глобальные стили, конфигурация роутера, инициализация сторов.

```
app/
  providers/
    RouterProvider/
    ThemeProvider/
    StoreProvider/
  styles/
    global.css
    reset.css
  App.tsx
  index.ts
```

```typescript
// app/App.tsx
import { RouterProvider } from './providers/RouterProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { StoreProvider } from './providers/StoreProvider';
import './styles/global.css';

export const App = () => {
  return (
    <StoreProvider>
      <ThemeProvider>
        <RouterProvider />
      </ThemeProvider>
    </StoreProvider>
  );
};
```

## Публичный API слайсов

Каждый слайс экспортирует только то, что должно быть видно снаружи — через файл `index.ts`. Это одно из ключевых правил FSD.

```typescript
// entities/product/index.ts
export { ProductCard } from './ui/ProductCard';
export { ProductRating } from './ui/ProductRating';
export type { Product } from './model/types';
export { useProduct } from './model/useProduct';
// внутренние детали реализации НЕ экспортируются
```

Потребитель никогда не импортирует напрямую из внутренней структуры:

```typescript
// ПРАВИЛЬНО
import { ProductCard, Product } from '@/entities/product';

// НЕПРАВИЛЬНО — нарушает изоляцию слайса
import { ProductCard } from '@/entities/product/ui/ProductCard/ProductCard';
```

## Правило изоляции слайсов

Слайсы одного слоя не могут импортировать друг друга. `features/add-to-cart` не может импортировать из `features/filter-products`. Это защищает от циклических зависимостей и неявных связей между фичами.

Если нужна общая логика между двумя слайсами — она переносится на слой ниже: в `entities` или `shared`.

```typescript
// НЕПРАВИЛЬНО — features импортирует из features
import { useFilters } from '@/features/filter-products';

// ПРАВИЛЬНО — общая логика вынесена в entities
import { useProductFilters } from '@/entities/product';
```

## Настройка алиасов

Для удобства работы с абсолютными путями настройте алиасы в `tsconfig.json` и сборщике:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Типичные ошибки при внедрении

**Слишком ранняя разбивка на слайсы.** Не нужно создавать слайс для каждой мелочи. Если фича из трёх строк — держите её в странице до тех пор, пока не появится реальная причина выносить.

**Бизнес-логика в `shared`.** Shared — только для универсальных вещей. `useUserPermissions` — это не `shared`, это `entities/user`.

**Прямые импорты из внутренних путей.** Всегда через `index.ts`. Иначе теряется смысл публичного API.

**Виджеты внутри фич.** Фича не должна знать о виджетах — она ниже по иерархии. Если видите такой импорт, это сигнал пересмотреть структуру.

## Инструменты для проверки архитектуры

Есть линтер специально для FSD — `@feature-sliced/eslint-config`. Он проверяет направление зависимостей на уровне ESLint:

```bash
npm install --save-dev @feature-sliced/eslint-config
```

```json
// .eslintrc.json
{
  "extends": ["@feature-sliced"]
}
```

Линтер автоматически запретит импорт `pages` из `features` и подобные нарушения иерархии.

## Когда FSD оправдан

FSD добавляет структурный оверхед. Для небольших приложений (до 10 страниц, 1–2 разработчика) он может быть излишним. Методология раскрывается там, где:

- Над проектом работает команда от трёх человек
- Приложение активно растёт и сложность модулей увеличивается
- Есть чёткое разделение на бизнес-домены
- Важна независимость отдельных частей для тестирования и замены

Для небольших проектов часто достаточно трёх слоёв: `pages`, `features`, `shared` — и добавлять остальные по мере роста.

## Итог

Feature-Sliced Design даёт ответ на вопрос «куда положить этот код», который работает при любом масштабе команды. Шесть слоёв с однонаправленными зависимостями, изолированные слайсы и явный публичный API через `index.ts` — этих трёх правил достаточно, чтобы большое приложение оставалось управляемым.

Чтобы научиться строить масштабируемые React приложения с нуля и освоить современные паттерны разработки, записывайтесь на курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=feature-sliced-design-architecture