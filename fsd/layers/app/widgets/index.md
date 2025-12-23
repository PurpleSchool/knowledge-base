---
metaTitle: Слой widgets в архитектуре приложений widgets-layer
metaDescription: Разбор архитектурного слоя widgets-layer - как организовать виджеты в сложном приложении и связать их с состоянием и данными
author: Олег Марков
title: Слой widgets - как спроектировать widgets-layer в приложении
preview: Подробное руководство по слою widgets widgets-layer - структура ответственности и примеры реализации компонентного слоя интерфейса
---

## Введение

Слой widgets (widgets-layer) — это архитектурный слой, в котором живут ваши UI-компоненты: кнопки, карточки, списки, виджеты авторизации, формы и т.д. Обычно он располагается поверх базового слоя компонентов (atoms / basic UI / shared-ui) и под более крупным слоем экранов или страниц.

Если говорить проще, слой widgets — это место, где вы собираете из элементарных визуальных блоков более сложные, но ещё переиспользуемые элементы интерфейса. Они уже знают что-то о домене (например, что такое заказ, пользователь, продукт), но ещё не привязаны к конкретному экрану или сценарию.

В этой статье мы разберем, зачем нужен слой widgets, как его организовать в структуре проекта, какие у него обязанности и ограничения, а также посмотрим на типичные примеры реализации. Я покажу вам базовые подходы, а на примерах станет понятнее, как это применять в своих проектах.

---

## Что такое слой widgets (widgets-layer)

### Место widgets-layer в архитектуре

Часто архитектуру приложения можно упростить до нескольких визуальных слоёв:

- base / shared / ui-kit — самые примитивные визуальные компоненты (кнопки, инпуты, типографика);
- widgets — составные виджеты, которые объединяют несколько базовых компонентов и немного бизнес-смысла;
- screens / pages / features — целые экраны или крупные сценарии (например, экран оформления заказа).

Слой widgets находится примерно посередине:

- ниже него — низкоуровневый UI-слой, который ничего не знает о бизнес-логике;
- выше него — слой экранов, роутинга, orchestration-логики.

Такой подход помогает разделить ответственность:

- базовые компоненты отвечают только за внешний вид и минимальное поведение;
- виджеты собирают эти компоненты в логичные фрагменты интерфейса;
- экраны собирают виджеты в законченную пользовательскую историю.

### Основные задачи widgets-layer

Давайте перечислим, что обычно делает слой widgets:

- Инкапсулирует куски интерфейса, которые встречаются в разных местах приложения.
- Объединяет несколько базовых компонентов в один законченный виджет (например, карточку товара с ценой, картинкой и кнопкой).
- Может знать о доменной модели (Order, Product, User), но обычно не содержит сложной бизнес-логики.
- Часто взаимодействует с внешними источниками данных через пропсы, hooks или callbacks, но избегает прямой работы с инфраструктурой (например, запросов в API внутри виджета, если это не оговорено отдельно).

При этом widgets-layer не должен превращаться в "мини-экран" — он не отвечает за маршрутизацию, глобальную навигацию и сложный поток действий пользователя.

### Признаки хорошего виджета

Хороший виджет обычно:

- имеет чётко очерченную задачу (например, "UserProfileCard");
- может быть использован на разных экранах без копирования логики;
- принимает на вход данные и callbacks, вместо того чтобы сам управлять всем сценарием;
- скрывает внутреннюю верстку, состояние UI и небольшие детали поведения.

---

## Структура проекта со слоем widgets

### Базовая файловая структура

Смотрите, как может выглядеть упрощенная структура фронтенд-проекта с выделенным widgets-layer на примере React + TypeScript:

```ts
// src/
// ├─ app/
// │   └─ index.tsx               // Точка входа приложения
// ├─ shared/
// │   ├─ ui/                     // Базовые UI-компоненты
// │   │   ├─ Button/
// │   │   ├─ Input/
// │   │   └─ Typography/
// │   └─ lib/                    // Утилиты, хелперы
// ├─ entities/
// │   ├─ user/
// │   │   ├─ model/              // Модели и типы пользователя
// │   │   └─ api/                // Запросы, связанные с пользователем
// │   └─ product/
// ├─ widgets/
// │   ├─ user-profile-card/
// │   │   ├─ ui/
// │   │   │   └─ UserProfileCard.tsx
// │   │   └─ index.ts
// │   ├─ product-list/
// │   │   ├─ ui/
// │   │   │   └─ ProductList.tsx
// │   │   └─ index.ts
// │   └─ auth-form/
// └─ pages/
//     ├─ home/
//     ├─ profile/
//     └─ product-details/
```

Комментарии к структуре:

- папка widgets содержит независимые виджеты уровня домена;
- каждый виджет изолирован в своей папке;
- внутри виджета папка ui хранит визуальную реализацию;
- входная точка виджета (index.ts) реэкспортирует публичные компоненты.

### Разделение ответственности между слоями

Чтобы было проще, давайте зафиксируем возможные правила:

- shared/ui — знает только о визуальных примитивах (кнопка, поле ввода);
- entities — знает о домене (User, Product), но не о конкретных экранах;
- widgets — объединяет доменные данные и UI-примитивы в законченные блоки интерфейса;
- pages — описывает конкретную пользовательскую задачу, собирая виджеты и управляя навигацией.

Такое разделение помогает вам избежать ситуаций, когда один и тот же кусок интерфейса реализован в трех местах с небольшими отличиями.

---

## Типы виджетов в widgets-layer

### Презентационные и контейнерные виджеты

Внутри widgets-layer удобно разделять виджеты по степени "умности":

1. Презентационные виджеты (dumb widgets)

   - принимают готовые данные;
   - не делают запросы;
   - максимум — управляют локальным UI состоянием (открыт/закрыт, активная вкладка и т.п.).

2. Контейнерные виджеты (smart widgets)

   - могут загружать данные (через hooks, эффекты);
   - могут объединять несколько сущностей (user + permissions + settings);
   - подготавливают данные и передают их в презентационные виджеты.

Давайте разберемся на примере.

---

## Пример: виджет карточки профиля пользователя

### Презентационный виджет UserProfileCard

Сначала создадим простой презентационный виджет. Теперь вы увидите, как это выглядит в коде:

```tsx
// widgets/user-profile-card/ui/UserProfileCard.tsx

import React from 'react'
import { Avatar } from '@/shared/ui/Avatar'   // Базовый UI-компонент
import { Button } from '@/shared/ui/Button'
import { Typography } from '@/shared/ui/Typography'

// Определяем тип входных данных для виджета
export interface UserProfileCardProps {
  name: string
  email: string
  avatarUrl?: string
  onEdit?: () => void      // Коллбэк на редактирование профиля
  isLoading?: boolean      // Флаг состояния загрузки
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  email,
  avatarUrl,
  onEdit,
  isLoading,
}) => {
  // Если идет загрузка, показываем skeleton
  if (isLoading) {
    return (
      <div className="user-profile-card user-profile-card--loading">
        {/* Здесь можно отрисовать скелетон вместо реальных данных */}
        <div className="user-profile-card__avatar-skeleton" />
        <div className="user-profile-card__text-skeleton" />
      </div>
    )
  }

  return (
    <div className="user-profile-card">
      {/* Отображаем аватар пользователя */}
      <Avatar src={avatarUrl} alt={name} size="large" />

      <div className="user-profile-card__info">
        {/* Имя пользователя */}
        <Typography variant="h3">{name}</Typography>

        {/* Email пользователя */}
        <Typography variant="body2" color="muted">
          {email}
        </Typography>
      </div>

      {/* Кнопка редактирования, если коллбэк передан */}
      {onEdit && (
        <Button variant="secondary" size="small" onClick={onEdit}>
          Редактировать
        </Button>
      )}
    </div>
  )
}
```

Обратите внимание:

- виджет ничего не знает о том, откуда взялись name и email;
- он не делает запросов, не использует глобальное состояние;
- он универсален и может использоваться на разных страницах.

Иногда достаточно таких "глупых" виджетов.

### Контейнерный виджет UserProfileCardContainer

Теперь давайте создадим контейнерный виджет, который будет сам получать данные пользователя, а затем использовать презентационный компонент.

```tsx
// widgets/user-profile-card/ui/UserProfileCardContainer.tsx

import React from 'react'
import { useCurrentUser } from '@/entities/user/model/useCurrentUser' 
// Здесь мы берем хук из слоя entities
import { UserProfileCard } from './UserProfileCard'

interface UserProfileCardContainerProps {
  onEdit?: () => void
}

export const UserProfileCardContainer: React.FC<UserProfileCardContainerProps> = ({
  onEdit,
}) => {
  // Получаем текущего пользователя через хук
  const { user, isLoading } = useCurrentUser()

  // Если данных нет и идет загрузка, просто показываем виджет в состоянии загрузки
  if (!user && isLoading) {
    return <UserProfileCard name="" email="" isLoading onEdit={onEdit} />
  }

  // Если данных нет и загрузки нет, можно ничего не отображать
  if (!user) {
    return null
  }

  // Передаем реальные данные пользователя в презентационный компонент
  return (
    <UserProfileCard
      name={user.name}
      email={user.email}
      avatarUrl={user.avatarUrl}
      onEdit={onEdit}
      isLoading={isLoading}
    />
  )
}
```

Так мы разделили ответственность:

- контейнер отвечает за получение данных;
- презентационный виджет отвечает за отображение.

На уровне widgets-layer это обычный и удобный прием.

---

## Как widgets-layer взаимодействует с другими слоями

### Взаимодействие с entities

Виджеты довольно часто работают с доменными сущностями. Например:

- виджет списка товаров (ProductListWidget) использует сущность Product из entities/product;
- виджет блока пользователя (UserSummaryWidget) использует сущность User из entities/user.

При этом полезно соблюдать правило:

- сложные преобразования данных и бизнес-правила — на стороне entities;
- форматирование для UI и выбор способа отображения — на стороне widgets.

Например, лучше так:

```ts
// entities/product/model/selectors.ts

// Селектор, который готовит человекочитаемое название товара
export const selectProductDisplayName = (product: Product): string => {
  // Здесь можно использовать бизнес-логику именования
  // Например, добавить бренд к названию
  return `${product.brand} ${product.name}`
}
```

И затем использовать это в виджете:

```tsx
// widgets/product-card/ui/ProductCard.tsx

import { selectProductDisplayName } from '@/entities/product/model/selectors'

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const displayName = selectProductDisplayName(product)

  return (
    <div className="product-card">
      {/* Отображаем подготовленное имя товара */}
      <h3>{displayName}</h3>
      {/* Остальной UI */}
    </div>
  )
}
```

Так логику проще тестировать и переиспользовать.

### Взаимодействие с shared/ui

В widgets-layer активно используются:

- кнопки;
- инпуты;
- модальные окна;
- типографика;
- спиннеры и skeleton-компоненты.

Смотрите, я покажу вам, как это работает на примере простого виджета поиска:

```tsx
// widgets/search-bar/ui/SearchBar.tsx

import React, { useState } from 'react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'

interface SearchBarProps {
  initialQuery?: string
  onSearch: (query: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
}) => {
  // Локальное состояние строки поиска
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (event: React.FormEvent) => {
    // Отменяем стандартное поведение формы
    event.preventDefault()
    // Передаем значение во внешний обработчик
    onSearch(query.trim())
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      {/* Поле ввода запроса */}
      <Input
        value={query}
        placeholder="Введите запрос"
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Кнопка отправки формы */}
      <Button type="submit">Найти</Button>
    </form>
  )
}
```

Здесь виджет не знает, что произойдет после поиска — он просто сообщает о событии наружу.

### Взаимодействие с pages / screens

На уровне страниц вы комбинируете несколько виджетов. Давайте посмотрим, что происходит в следующем примере:

```tsx
// pages/profile/ui/ProfilePage.tsx

import React from 'react'
import { UserProfileCardContainer } from '@/widgets/user-profile-card'
import { RecentOrdersWidget } from '@/widgets/recent-orders'
import { PageLayout } from '@/shared/ui/PageLayout'

export const ProfilePage: React.FC = () => {
  // Обработчик редактирования профиля
  const handleEditProfile = () => {
    // Здесь можно открыть модальное окно, перейти на другую страницу и т.п.
  }

  return (
    <PageLayout title="Профиль">
      {/* Виджет профиля пользователя */}
      <UserProfileCardContainer onEdit={handleEditProfile} />

      {/* Виджет последних заказов */}
      <RecentOrdersWidget />
    </PageLayout>
  )
}
```

Экран собирает общую композицию, но детали отображения инкапсулированы в виджетах.

---

## Правила и ограничения для widgets-layer

### Что виджетам можно

В большинстве архитектурных договоренностей виджетам разрешено:

- использовать shared/ui-компоненты;
- использовать сущности и их model/api-слой (в разумных пределах);
- использовать общие утилиты (форматирование дат, чисел и т.п.);
- иметь локальное состояние и небольшую UI-логику;
- объединять несколько сущностей в один визуальный блок.

### Чего виджетам лучше избегать

Чтобы слой widgets не "разросся" и не превратился во второй слой экранов, полезно следить за следующими моментами:

- Не управлять роутером напрямую (navigate, redirect) без необходимости — лучше прокидывать callbacks из страниц.
- Не реализовывать в виджетах сложные бизнес-процессы (например, весь процесс оформления заказа) — это ответственность более высокого слоя.
- Не завязываться напрямую на инфраструктуру (например, без необходимости использовать конкретную реализацию HTTP-клиента).
- Не тянуть в виджет все подряд зависимости — чем меньше связей, тем легче переиспользовать компонент.

Хорошая эвристика: виджет — это визуальный блок с легкой логикой, а не мини-фреймворк внутри приложения.

---

## Паттерны и лучшие практики для widgets-layer

### Четкое выделение публичного API виджета

Часто удобно ограничить, что вы экспортируете наружу. Давайте посмотрим на пример index-файла виджета:

```ts
// widgets/user-profile-card/index.ts

// Экспортируем только то, что хотим сделать публичным
export { UserProfileCard } from './ui/UserProfileCard'
export { UserProfileCardContainer } from './ui/UserProfileCardContainer'

// Остальные файлы (вспомогательные компоненты, стили) остаются внутренними
```

Так вы снижаете связанность и можете безопасно рефакторить внутренности.

### Конфигурация через пропсы, а не через глобальные синглтоны

Виджеты должно быть легко тестировать и переиспользовать. Поэтому лучше передавать всё, что можно, через пропсы:

- callbacks;
- флаги отображения;
- данные для предзаполнения форм.

Например, для виджета формы авторизации:

```tsx
// widgets/auth-form/ui/AuthForm.tsx

interface AuthFormProps {
  onSubmit: (data: { email: string; password: string }) => void
  isLoading?: boolean
  errorMessage?: string
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
}) => {
  // Здесь можно реализовать локальное состояние формы
  // и вызывать onSubmit при успешной валидации
}
```

Такой виджет легко использовать и с REST, и с GraphQL, и с любым другим способом авторизации.

### Изоляция сложного состояния

Если в виджете появляется заметно сложное состояние (несколько полей, различные ветки логики, таймеры), стоит вынести эту логику:

- в отдельный hook;
- или в отдельный модельный слой для конкретного виджета.

Покажу вам, как это реализовано на практике:

```ts
// widgets/filters-panel/model/useFilters.ts

import { useState } from 'react'

// Хук для управления состоянием панели фильтров
export const useFilters = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [inStockOnly, setInStockOnly] = useState(false)

  // Функция сброса всех фильтров
  const resetFilters = () => {
    setSelectedCategory(null)
    setPriceRange(null)
    setInStockOnly(false)
  }

  return {
    selectedCategory,
    priceRange,
    inStockOnly,
    setSelectedCategory,
    setPriceRange,
    setInStockOnly,
    resetFilters,
  }
}
```

И затем использовать в UI-части:

```tsx
// widgets/filters-panel/ui/FiltersPanel.tsx

import React from 'react'
import { useFilters } from '../model/useFilters'
import { Checkbox } from '@/shared/ui/Checkbox'
import { RangeSlider } from '@/shared/ui/RangeSlider'
import { Button } from '@/shared/ui/Button'

interface FiltersPanelProps {
  onChange: (filters: {
    category: string | null
    priceRange: [number, number] | null
    inStockOnly: boolean
  }) => void
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ onChange }) => {
  const {
    selectedCategory,
    priceRange,
    inStockOnly,
    setSelectedCategory,
    setPriceRange,
    setInStockOnly,
    resetFilters,
  } = useFilters()

  // При каждом изменении локального состояния уведомляем внешний мир
  React.useEffect(() => {
    onChange({
      category: selectedCategory,
      priceRange,
      inStockOnly,
    })
  }, [selectedCategory, priceRange, inStockOnly, onChange])

  return (
    <div className="filters-panel">
      {/* Здесь можно разместить селектор категорий, слайдер цены и чекбокс наличия */}
      <RangeSlider value={priceRange} onChange={setPriceRange} />

      <Checkbox
        checked={inStockOnly}
        onChange={(e) => setInStockOnly(e.target.checked)}
      >
        Только в наличии
      </Checkbox>

      <Button variant="ghost" onClick={resetFilters}>
        Сбросить
      </Button>
    </div>
  )
}
```

Так логику легко тестировать отдельно, а виджет остается аккуратным.

---

## Тестирование widgets-layer

### Что стоит тестировать в виджетах

Виджеты — важный слой, поэтому их полезно покрывать тестами:

- проверять корректную отрисовку в разных состояниях (загрузка, ошибка, пустые данные);
- проверять правильную передачу событий (например, вызывается ли onSubmit при клике);
- проверять, что виджет правильно реагирует на пропсы.

Например, с помощью React Testing Library:

```tsx
// widgets/auth-form/ui/AuthForm.test.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import { AuthForm } from './AuthForm'

test('вызывает onSubmit с корректными данными', () => {
  const handleSubmit = jest.fn()

  // Рендерим виджет с тестовым обработчиком
  render(<AuthForm onSubmit={handleSubmit} />)

  // Находим поля ввода по плейсхолдерам
  fireEvent.change(screen.getByPlaceholderText('Email'), {
    target: { value: 'test@example.com' },
  })
  fireEvent.change(screen.getByPlaceholderText('Пароль'), {
    target: { value: 'password123' },
  })

  // Эмулируем отправку формы
  fireEvent.click(screen.getByText('Войти'))

  // Проверяем, что обработчик вызвался с ожидаемыми данными
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  })
})
```

Комментарии здесь помогают понять, какую именно часть поведения мы проверяем.

### Стабилизация интерфейса

Поскольку виджеты часто переиспользуются, важно:

- избегать частых изменений их публичного API;
- документировать входные пропсы;
- добавлять дефолтные значения для необязательных пропсов.

Это снижает риск того, что изменение одного виджета "сломает" сразу несколько экранов.

---

## Пример сборки нескольких виджетов в один сценарий

Давайте разберем упрощённый сценарий "Список товаров с фильтрами" и посмотрим, как widgets-layer помогает структурировать код.

Идея:

- есть виджет FiltersPanel (фильтры);
- есть виджет ProductListWidget (список товаров);
- страница ProductsPage собирает все вместе.

Фрагмент ProductListWidget:

```tsx
// widgets/product-list/ui/ProductListWidget.tsx

import React from 'react'
import { useProducts } from '@/entities/product/model/useProducts'
import { ProductCard } from '@/widgets/product-card'
import { Spinner } from '@/shared/ui/Spinner'

interface ProductListWidgetProps {
  filters: {
    category: string | null
    priceRange: [number, number] | null
    inStockOnly: boolean
  }
}

export const ProductListWidget: React.FC<ProductListWidgetProps> = ({
  filters,
}) => {
  // Хук получения списка товаров с учетом фильтров
  const { products, isLoading } = useProducts(filters)

  if (isLoading) {
    return <Spinner />
  }

  if (!products.length) {
    return <div>Товары не найдены</div>
  }

  return (
    <div className="product-list">
      {/* Отрисовываем карточки товаров через другой виджет */}
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

Теперь страница, которая собирает все вместе:

```tsx
// pages/products/ui/ProductsPage.tsx

import React from 'react'
import { FiltersPanel } from '@/widgets/filters-panel'
import { ProductListWidget } from '@/widgets/product-list'
import { PageLayout } from '@/shared/ui/PageLayout'

export const ProductsPage: React.FC = () => {
  const [filters, setFilters] = React.useState({
    category: null as string | null,
    priceRange: null as [number, number] | null,
    inStockOnly: false,
  })

  return (
    <PageLayout title="Каталог">
      {/* Панель фильтров изменяет локальное состояние filters */}
      <FiltersPanel onChange={setFilters} />

      {/* Виджет списка товаров получает текущее состояние фильтров */}
      <ProductListWidget filters={filters} />
    </PageLayout>
  )
}
```

Как видите, благодаря widgets-layer логика разбивается на логичные блоки:

- сами фильтры;
- отображение списка;
- страница, которая связывает эти виджеты.

---

## Итоги

Слой widgets (widgets-layer) — это уровень приложения, в котором вы собираете переиспользуемые, доменно-осмысленные фрагменты интерфейса:

- он опирается на базовые UI-компоненты и доменные сущности;
- инкапсулирует верстку и легкую UI-логику;
- упрощает повторное использование одного и того же интерфейсного блока на разных страницах;
- помогает разгрузить слой страниц и сделать код понятнее.

Хорошо организованный widgets-layer:

- имеет четкую файловую структуру;
- разделяет презентационные и контейнерные компоненты;
- использует пропсы и callbacks для связи с внешним миром;
- минимизирует зависимость от инфраструктуры и навигации;
- облегчает тестирование и развитие проекта.

Если при добавлении нового функционала вы ловите себя на мысли "я уже где-то писал такую карточку / форму / блок", — скорее всего, этому месту и нужен отдельный виджет в widgets-layer.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как передавать в виджет разные варианты верстки, не создавая десятки пропсов?

Используйте композицию и рендер-пропы. Например, передавайте во виджет проп renderItem или слот-компоненты. Внутри виджета вызывайте их, передавая нужные данные. Так вы разделяете логику (виджет) и конкретную разметку.

### Можно ли из виджета дергать роутер напрямую (navigate, push, replace)?

Технически можно, но лучше прокидывать callbacks из страницы. Виджет вызывает onSuccess или onClick, а страница уже решает, куда перенаправлять. Это упрощает тестирование и переиспользование виджета в разных сценариях.

### Как лучше организовать стили для виджетов?

Чаще всего — локально, внутри папки виджета. Можно использовать CSS-модули, styled-components или Tailwind-классы. Главное — не смешивать стили разных виджетов в общих файлах и не завязывать разметку страниц на внутренние классы виджета.

### Можно ли вызывать API непосредственно из виджета?

Можно, но стоит придерживаться правила — вся логика работы с API должна находиться в моделях или hooks слоя entities или отдельном model для виджета. В самом UI-файле виджета лишь вызывайте соответствующий hook (например, useUserProfile), чтобы сохранить читаемость и переиспользуемость.

### Как переиспользовать один и тот же виджет в вебе и на мобильных платформах?

Выделяйте максимально "чистый" уровень логики: общие hooks и модели. Затем делайте платформо-специфичные UI-обертки (web / native), которые используют эту общую логику. Структура widgets-layer может повторяться в разных платформах, но бизнес-правила остаются общими.