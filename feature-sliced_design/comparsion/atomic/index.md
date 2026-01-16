---
metaTitle: Сравнение подхода vs-atomic и Atomic Design
metaDescription: Подробное сравнение подхода vs-atomic и классического Atomic Design - разбор слоев структуры компонентов во Vue и стратегии масштабирования дизайн системы
author: Олег Марков
title: Сравнение vs-atomic и Atomic Design во Vue проектах
preview: Рассмотрите как подход vs-atomic соотносится с Atomic Design - чем он отличается в организации компонентов во Vue и как выбирать структуру проекта под свою команду
---

## Введение

Тема Atomic Design уже много лет используется для проектирования дизайн‑систем и интерфейсов. Но когда вы переходите от абстрактной теории к реальному фронтенд‑проекту на Vue, часто оказывается, что классический Atomic Design не полностью отвечает практическим потребностям. Здесь и появляются прикладные вариации, одна из них — файловая структура `vs-atomic` (часто встречается в экосистеме Vue и в некоторых шаблонах, включая Vuesax и схожие подходы).

В этой статье я покажу вам, как именно `vs-atomic` соотносится с Atomic Design, чем отличается по структуре, какие проблемы он решает, а какие — нет. Мы посмотрим на примеры структуры проекта, разберем типичные сценарии и обсудим, в каких случаях имеет смысл придерживаться строгого Atomic Design, а когда практичнее выбрать `vs-atomic`.

## Что такое Atomic Design в двух словах

### Основные уровни Atomic Design

Atomic Design — это методология организации UI из пяти уровней:

1. **Atoms (атомы)**  
   Базовые, неделимые элементы интерфейса:
   - кнопка
   - инпут
   - заголовок
   - иконка

2. **Molecules (молекулы)**  
   Небольшие композиции атомов:
   - поле ввода с подписью и подсказкой
   - группа радио‑кнопок
   - карточка с аватаром и именем

3. **Organisms (организмы)**  
   Более крупные, самостоятельные блоки:
   - шапка сайта с логотипом, меню и кнопками
   - карточка товара с ценой, кнопкой купить, изображением
   - форма регистрации целиком

4. **Templates (шаблоны)**  
   Каркас страниц с размещением организмов:
   - макет страницы блога
   - макет дашборда
   - макет карточки товара

5. **Pages (страницы)**  
   Конкретные страницы с реальными данными:
   - /products/123
   - /dashboard
   - /profile

Смотрите, идея в том, чтобы обеспечить повторное использование и постепенную сборку: от маленьких кирпичиков до целых страниц.

### Проблемы при прямом применении Atomic Design в коде

Когда вы пытаетесь перенести эту схему напрямую в файловую структуру проекта на Vue или другой фреймворк, обычно возникают такие сложности:

- Не всегда очевидно, компонент — это molecule или organism  
  Например, модальное окно с формой и кнопками — куда его отнести?
- Структура `atoms/molecules/organisms/...` быстро начинает смешиваться с доменной структурой  
  Появляются папки `ProductCard` в organisms и похожие по смыслу компоненты в molecules.
- Для разработчиков важнее не только уровень абстракции компонента, но и его **роль в проекте**:
  - это переиспользуемый UI‑элемент
  - это компонент конкретной страницы
  - это инфраструктурный компонент для layout

На практике это ведет к тому, что команды модифицируют Atomic Design под свои нужды — `vs-atomic` как раз один из таких адаптированных подходов.

## Что такое vs-atomic

### Суть подхода vs-atomic

`vs-atomic` — это практический способ организовать компоненты во Vue‑проектах, вдохновленный Atomic Design, но чуть более приземленный к задачам разработки. Чаще всего он реализован как структура папок наподобие:

- `atoms`
- `molecules`
- `organisms`
- `templates`
- `pages` (или `views`)

Но, в отличие от «чистого» Atomic Design, упор делается не на строгое следование теории, а на:

- читаемость и предсказуемость структуры проекта
- упрощение импорта и навигации
- ясное разделение уровня переиспользуемости компонентов

То есть вы продолжаете оперировать привычными терминами Atomic Design, но используете их как **структурные уровни проекта**, а не строго теоретические сущности.

### Пример базовой структуры vs-atomic во Vue

Давайте разберемся на примере. Предположим, у вас есть Vue 3 проект:

```bash
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
  pages/
```

Теперь давайте посмотрим, как могут выглядеть реальные файлы.

```bash
src/
  components/
    atoms/
      AppButton.vue
      AppInput.vue
      AppIcon.vue
      AppCheckbox.vue
    molecules/
      FormField.vue          # label + input + ошибка
      SearchBar.vue          # input + кнопка поиска
      UserMeta.vue           # аватар + имя + роль
    organisms/
      HeaderBar.vue          # логотип + меню + поиск + профиль
      SideMenu.vue           # навигация по разделам
      ProductList.vue        # список карточек товаров
    templates/
      DashboardLayout.vue    # каркас дашборда
      AuthLayout.vue         # общий каркас для страниц входа и регистрации
  pages/
    DashboardPage.vue
    LoginPage.vue
    ProductDetailsPage.vue
```

Здесь я размещаю пример, чтобы вам было проще увидеть визуальное различие:

- `atoms` — максимально мелкие, стилизованные компоненты без бизнес‑логики
- `molecules` — небольшие, переиспользуемые комбинации атомов
- `organisms` — крупные блоки, которые можно повторно использовать в разных страницах
- `templates` — каркасы страниц без конкретных данных
- `pages` — конечные экраны, привязанные к маршрутам

### Отличие vs-atomic от «чистого» Atomic Design

Сравните:

| Аспект                    | Atomic Design (теория)                                | vs-atomic (практика в Vue)                          |
|---------------------------|--------------------------------------------------------|-----------------------------------------------------|
| Основная цель             | Дизайн‑система и язык интерфейса                      | Структура кода и организация компонентов            |
| Уровни                    | Atoms, Molecules, Organisms, Templates, Pages         | Те же уровни, но привязаны к директориям проекта   |
| Жесткость границ          | Концептуально строгая                                 | Более гибкая и прагматичная                        |
| Фокус                     | Визуальные паттерны и консистентность дизайна         | Повторное использование и навигация по коду        |
| Привязка к фреймворку     | Нейтральный                                           | Чаще всего заточен под Vue экосистему              |

По сути, `vs-atomic` — это «Atomic Design как структура src/components», а не как чисто дизайнерская методология.

## Как правильно классифицировать компоненты в vs-atomic

### Atoms в vs-atomic

В `vs-atomic` под **atoms** обычно попадает все, что:

- не зависит от бизнес‑логики
- можно переиспользовать в максимально разных контекстах
- отвечает за визуальное представление и базовое поведение

Например:

```vue
<!-- src/components/atoms/AppButton.vue -->
<template>
  <button
    :class="['app-button', `app-button--${variant}`]"
    :type="type"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
// Здесь мы описываем минимальный набор пропсов для базовой кнопки
const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, secondary, danger...
  },
  type: {
    type: String,
    default: 'button',
  },
})
</script>

<style scoped>
/* Стили базовой кнопки, без логики продукта */
</style>
```

Обратите внимание:

- компонент не знает ни о каких доменных сущностях
- он просто рендерит кнопку и отдает событие `click`

### Molecules в vs-atomic

Molecules — это уже более конкретные элементы, которые:

- состоят из атомов
- решают локальную задачу
- могут переиспользоваться в разных местах, но уже как «готовый паттерн»

Например, компонент поля формы:

```vue
<!-- src/components/molecules/FormField.vue -->
<template>
  <label class="form-field">
    <span class="form-field__label">{{ label }}</span>

    <!-- Используем атом AppInput -->
    <AppInput
      v-bind="$attrs"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <span v-if="error" class="form-field__error">
      {{ error }}
    </span>
  </label>
</template>

<script setup>
// Здесь мы комбинируем несколько атомов и немного логики отображения
import AppInput from '@/components/atoms/AppInput.vue'

const props = defineProps({
  label: String,
  modelValue: [String, Number],
  error: String,
})

defineEmits(['update:modelValue'])
</script>
```

Как видите, этот код выполняет задачу «обернуть input с подписью и ошибкой». Это уже больше, чем просто атом, но еще недостаточно крупный блок, чтобы быть organism.

### Organisms в vs-atomic

Organisms — это компоненты, которые:

- могут содержать бизнес‑логику
- агрегируют несколько molecules и atoms
- имеют явную, самостоятельную роль в интерфейсе

Давайте посмотрим, что происходит в следующем примере:

```vue
<!-- src/components/organisms/LoginForm.vue -->
<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <FormField
      label="Email"
      v-model="email"
      :error="errors.email"
      type="email"
      autocomplete="email"
    />

    <FormField
      label="Пароль"
      v-model="password"
      :error="errors.password"
      type="password"
      autocomplete="current-password"
    />

    <AppButton :disabled="loading" type="submit">
      {{ loading ? 'Входим...' : 'Войти' }}
    </AppButton>
  </form>
</template>

<script setup>
// Здесь уже есть бизнес-логика отправки формы
import { ref } from 'vue'
import FormField from '@/components/molecules/FormField.vue'
import AppButton from '@/components/atoms/AppButton.vue'

const emit = defineEmits(['submit'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref({ email: '', password: '' })

async function handleSubmit() {
  loading.value = true
  errors.value = { email: '', password: '' }

  try {
    // Здесь могла бы быть валидация и запрос к API
    emit('submit', { email: email.value, password: password.value })
  } catch (e) {
    // Здесь обрабатываем ошибку и обновляем ошибки формы
  } finally {
    loading.value = false
  }
}
</script>
```

Здесь вы уже видите:

- состояние (`email`, `password`, `loading`, `errors`)
- бизнес‑событие `submit`
- использование molecules и atoms

То есть по vs-atomic — это классический organism.

### Templates и pages

**Templates** в vs-atomic — компоненты, которые определяют:

- layout страницы
- места, где будут появляться organisms
- общие блоки типа шапки и подвала

Например:

```vue
<!-- src/components/templates/AuthLayout.vue -->
<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <AppLogo />
    </header>

    <main class="auth-layout__content">
      <!-- Здесь будут organisms типа LoginForm -->
      <slot />
    </main>

    <footer class="auth-layout__footer">
      <small>© 2026 Company</small>
    </footer>
  </div>
</template>

<script setup>
// Здесь мы создаем общий каркас, без конкретной страницы
import AppLogo from '@/components/atoms/AppLogo.vue'
</script>
```

**Pages** (или `views` в терминах Vue Router) — это:

- конечные маршруты
- место, где подключается store, роутер, загрузка данных

```vue
<!-- src/pages/LoginPage.vue -->
<template>
  <AuthLayout>
    <LoginForm @submit="handleLogin" />
  </AuthLayout>
</template>

<script setup>
// Здесь мы соединяем layout, organisms и бизнес-логику приложения
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/templates/AuthLayout.vue'
import LoginForm from '@/components/organisms/LoginForm.vue'

const router = useRouter()

async function handleLogin(credentials) {
  // Здесь авторизация пользователя через API или store
  // Если успех — редирект на дашборд
  await fakeLogin(credentials)
  router.push({ name: 'dashboard' })
}

// Пример фейковой функции логина
async function fakeLogin({ email, password }) {
  // Здесь могла бы быть реальная авторизация
  return new Promise((resolve) => setTimeout(resolve, 500))
}
</script>
```

Так вы разделяете:

- **шаблон** страницы (AuthLayout)
- **организмы** (LoginForm)
- **навигацию и интеграцию** с приложением (LoginPage)

## Ключевые отличия Atomic Design и vs-atomic на практике

### 1. Уровень строгости и гибкость

В теории Atomic Design предполагает, что вы очень аккуратно определяете, где заканчивается molecule и начинается organism. В реальных проектах это часто становится поводом для споров.

В vs-atomic подход проще:

- не нужно идеального соответствия теории
- главное — стабильная, понятная для команды структура
- допускается, что «пограничные» компоненты можно отнести туда, где проще их найти

Практический критерий, которым вы можете пользоваться:

- отвечает за визуальный паттерн и не знает о бизнесе — **atom**
- объединяет несколько атомов и решает локальную задачу — **molecule**
- содержит состояние или бизнес‑логику и заметно крупнее — **organism**
- определяет layout и композицию страниц — **template**
- связан с маршрутом и загрузкой данных — **page**

### 2. Связь с доменной областью

Atomic Design сам по себе не говорит, как учитывать доменную область (продукты, заказы, пользователи). vs-atomic на практике часто комбинируют с **feature‑подходом** или доменным делением.

Например:

```bash
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
  features/
    cart/
      components/
      store/
      services/
    products/
      components/
      store/
  pages/
```

Здесь vs-atomic используется именно для **UI‑слоя**, а бизнес‑функциональность уходит в `features`. Это улучшает масштабируемость, по сравнению с попыткой описать все только через Atomic Design.

### 3. Связь с инфраструктурой Vue

Atomic Design как методология не знает ничего про:

- маршрутизацию
- состояние (Vuex, Pinia)
- асинхронные запросы

В vs-atomic обычно выстраивают простой принцип:

- atoms, molecules, organisms — максимально независимы от store и router
- templates могут знать о layout, но не должны напрямую работать с API
- pages — место интеграции с router, store, API

Такой подход часто выглядит примерно так:

```vue
<!-- src/pages/ProductDetailsPage.vue -->
<template>
  <MainLayout>
    <ProductDetails
      v-if="product"
      :product="product"
      @add-to-cart="addToCart"
    />
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/templates/MainLayout.vue'
import ProductDetails from '@/components/organisms/ProductDetails.vue'
import { useCartStore } from '@/stores/cart'
import { fetchProduct } from '@/api/products'

const route = useRoute()
const cartStore = useCartStore()

const product = ref(null)

onMounted(async () => {
  // Здесь мы загружаем данные для страницы
  product.value = await fetchProduct(route.params.id)
})

function addToCart(productId) {
  // Здесь мы вызываем доменное действие
  cartStore.add(productId)
}
</script>
```

Компонент `ProductDetails` при этом останется достаточно независимым и переиспользуемым.

## Пошаговый переход к vs-atomic из «плоской» структуры

### Шаг 1. Выделите atoms

Если у вас сейчас все компоненты лежат в одной папке `components`, начните с самого простого:

1. Создайте `components/atoms`
2. Перенесите туда:
   - базовые кнопки
   - инпуты
   - чекбоксы
   - иконки
   - типовые текстовые блоки (например, `AppTitle`, `AppText`)

Структура может выглядеть так:

```bash
src/
  components/
    atoms/
      AppButton.vue
      AppInput.vue
      AppCheckbox.vue
      AppIcon.vue
      AppCard.vue
    OldBigComponent.vue
    AnotherComponent.vue
```

### Шаг 2. Выделите molecules

Теперь посмотрите на компоненты, которые:

- используют несколько atoms
- повторяются в разных местах

Например, у вас в трех формах есть похожая связка label + input + ошибка. Логично создать molecule:

```bash
src/
  components/
    atoms/
    molecules/
      FormField.vue
      SearchBar.vue
      UserBadge.vue
    organisms/
```

Шаблон для molecule вы видели выше, но давайте еще один короткий пример:

```vue
<!-- src/components/molecules/SearchBar.vue -->
<template>
  <div class="search-bar">
    <AppInput
      v-model="search"
      :placeholder="placeholder"
      @keyup.enter="$emit('search', search)"
    />
    <AppButton @click="$emit('search', search)">
      Найти
    </AppButton>
  </div>
</template>

<script setup>
// Здесь мы объединяем атомы в типовой поисковой паттерн
import { ref, watch } from 'vue'
import AppInput from '@/components/atoms/AppInput.vue'
import AppButton from '@/components/atoms/AppButton.vue'

const props = defineProps({
  modelValue: String,
  placeholder: String,
})

const emit = defineEmits(['update:modelValue', 'search'])

const search = ref(props.modelValue ?? '')

watch(
  () => props.modelValue,
  (val) => {
    if (val !== search.value) search.value = val ?? ''
  }
)

watch(search, (val) => emit('update:modelValue', val))
</script>
```

### Шаг 3. Выделите organisms и templates

После этого у вас останутся крупные компоненты, которые:

- содержат несколько блоков
- управляют состоянием
- отвечают за большие части страницы

Их можно перенести в `organisms`, а layout — в `templates`. Например:

```bash
src/
  components/
    atoms/
    molecules/
    organisms/
      HeaderBar.vue
      SidebarMenu.vue
      ProductGrid.vue
      ProductDetails.vue
    templates/
      MainLayout.vue
      AuthLayout.vue
  pages/
```

### Шаг 4. Выделите pages (если их еще нет)

Если вы до этого складывали все компоненты в `components`, а маршруты подключали прямо к компонентам из `components`, стоит:

- создать `pages`
- перенести туда все, что связано с маршрутами

Например:

```bash
src/
  pages/
    HomePage.vue
    LoginPage.vue
    ProductsPage.vue
    ProductDetailsPage.vue
```

И в `router/index.ts` использовать именно `pages`:

```ts
// Здесь мы подключаем маршруты к страницам
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
]
```

Так vs-atomic становится основой навигации по коду для всей команды.

## Когда vs-atomic удобнее классического Atomic Design

### Типичные кейсы применения

vs-atomic выигрывает, когда:

- у вас **команда разработчиков**, а не только дизайнеров
- есть **несколько крупных страниц** и компоненты начинают путаться
- важна **навигация по коду**, быстрый поиск нужного элемента
- вы планируете **масштабировать приложение**

Примеры:

- админка с десятком модулей (пользователи, заказы, отчеты)
- SaaS‑сервис с многими экранами
- интернет‑магазин с каталогом, корзиной, личным кабинетом

В таких случаях:

- atoms и molecules формируют **UI‑кит**
- organisms — **строительные блоки** для страниц
- templates — **layout‑каркасы**
- pages — конечные маршруты

Atomic Design как теория может остаться у дизайнеров, а vs-atomic станет реальным отражением в коде.

### Когда строгий Atomic Design может быть излишним

Если у вас:

- маленькое приложение
- всего несколько страниц
- мало переиспользуемых компонентов

то глубоко продуманный Atomic Design может быть слишком тяжелым. В таких случаях vs-atomic можно применять упрощенно:

- atoms
- organisms
- pages

То есть вы пропускаете molecules и templates, но сохраняете базовую идею уровней.

## Типичные ошибки при использовании vs-atomic

### Слишком детальное деление

Иногда возникает соблазн разносить каждый чуть‑чуть крупный компонент по новому уровню. В итоге:

- слишком много маленьких файлов
- тяжело отслеживать связность
- спорные решения по классификации

Рекомендация:

- делите только там, где **есть повторное использование**
- не стесняйтесь переносить компонент из одного уровня в другой по мере развития проекта

### Смешение бизнес‑логики и UI на нижних уровнях

Частая проблема — когда atoms или molecules начинают:

- ходить в API
- знать о конкретных сущностях (Order, Product, User)
- подключать store напрямую

Это приводит к сильной связности и ухудшает переиспользуемость.

Рекомендация:

- atoms и molecules должны быть **максимально абстрактны**
- organisms и pages — главный уровень для бизнес‑логики

### Жесткая привязка к терминам Atomic Design

Иногда команды воспринимают Atomic Design как закон, а не ориентир. В результате:

- идет борьба за «правильность» вместо удобства
- структура усложняется ради теории

vs-atomic как раз по смыслу — более прагматичный путь. Вы можете:

- не бояться называть компонент organism, если он так воспринимается командой
- не стремиться к «идеальной чистоте» терминов
- использовать уровни как средство навигации, а не самоцель

## Практические советы по внедрению vs-atomic в команде

### Определите общие правила классификации

Например, вы можете договориться в документации:

- atoms — UI‑элементы без бизнес‑контекста, всегда начинаются с `App*`  
  Примеры: `AppButton`, `AppInput`, `AppCard`
- molecules — небольшие композиции атомов, могут быть связаны с типовым паттерном  
  Примеры: `SearchBar`, `FormField`, `UserBadge`
- organisms — крупные блоки, использующие molecules и atoms, могут содержать состояние  
  Примеры: `LoginForm`, `ProductGrid`, `HeaderBar`
- templates — layout’ы страниц  
  Примеры: `MainLayout`, `AuthLayout`
- pages — конечные маршруты, всегда заканчиваются на `Page`  
  Примеры: `LoginPage`, `DashboardPage`

### Добавьте короткий README в папку components

Смотрите, я покажу вам пример простого `README.md` внутри `src/components`:

```md
## Структура компонентов

- atoms - базовые переиспользуемые UI-элементы без бизнес-логики
- molecules - маленькие комбинации atoms для повторяющихся паттернов
- organisms - крупные блоки с локальной логикой и состоянием
- templates - каркасы страниц и layout
- pages - конечные страницы и маршруты (в каталоге src/pages)
```

Так новым разработчикам будет проще понять структуру.

### Регулярно пересматривайте уровни при росте проекта

Хорошая практика:

- раз в несколько спринтов просматривать:
  - какие компоненты стали переиспользуемыми
  - что можно вынести в molecules или organisms
- не бояться рефакторинга структуры, если это улучшает читаемость

## Заключение

Atomic Design — это мощная концепция для построения дизайн‑систем, но ее напрямую не всегда удобно переносить в структуру кода. Подход `vs-atomic` использует те же уровни, но делает акцент на практической организации Vue‑проекта:

- atoms, molecules, organisms, templates и pages становятся не только теоретическими терминами, но и **директориями** и **категориями компонентов**
- основная цель — **ясная и предсказуемая структура**, а не абсолютное соответствие теории
- atoms и molecules фокусируются на переиспользуемом UI, organisms и templates — на сборке интерфейса, pages — на интеграции с маршрутизацией и бизнес‑логикой

Применяя vs-atomic, вы получаете:

- удобную навигацию по проекту
- лучшее разделение ответственности между компонентами
- возможность постепенно наращивать сложность, не теряя контроль над структурой

Главное — относиться к методологии гибко. Используйте Atomic Design как источник идей и языка обсуждения, а vs-atomic — как практический инструмент для организации кода под реальные задачи вашей команды.

## Частозадаваемые технические вопросы по теме и ответы

### Как поступать с компонентами, которые используются только в одном месте и не переиспользуются

Если компонент явно относится к конкретной странице и больше нигде не нужен, разумно оставить его рядом с этой страницей. Например, создать структуру `pages/DashboardPage/components/DashboardStats.vue`. Такой компонент не обязательно поднимать в `organisms`. Делайте это только тогда, когда компонент начинает реально использоваться в нескольких местах.

### Куда класть модальные окна — в molecules или organisms

Модальное окно чаще всего содержит достаточно много логики и элементов. Если это простое диалоговое окно подтверждения, которое можно использовать в разных местах, его можно оформить как molecule `ConfirmDialog`. Если это сложное окно с формой и асинхронными операциями, безопаснее относить его к organisms, например `UserEditModal`.

### Как быть с компонентами высшего порядка вроде ErrorBoundary или SuspenseWrapper

Такие компоненты технически не являются ни atoms, ни organisms в терминах UI. Часто их выносят в отдельный каталог `components/system` или `components/shared` и не пытаются вписать в уровни vs-atomic. Главное — четко отделить их роль как инфраструктурных компонентов и зафиксировать это в документации по структуре.

### Можно ли смешивать vs-atomic и feature-based структуру в одном проекте

Да, это распространенный подход. Вы можете:
- использовать vs-atomic для глобального UI‑кита (`src/components`)
- держать специфические для фич компоненты в `src/features/<feature>/components`
При этом внутри feature можно тоже использовать упрощенную vs-atomic схему (например, `atoms` и `organisms`), если фича достаточно крупная.

### Как организовать тесты для компонентов при использовании vs-atomic

Один из вариантов — зеркалировать структуру `components` в каталоге `tests`. Например:
- `tests/components/atoms/AppButton.spec.ts`
- `tests/components/molecules/FormField.spec.ts`
- `tests/components/organisms/LoginForm.spec.ts`  
Это помогает быстро находить тесты, соответствующие уровням компонентов, и поддерживать понятную структуру даже при росте числа тестов.