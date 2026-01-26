---
metaTitle: Динамические компоненты в современных фронтенд фреймворках
metaDescription: Разбор подхода dynamic-components - как создавать подключать и управлять динамическими компонентами во фронтенд приложениях на практике
author: Олег Марков
title: Динамические компоненты - dynamic-components
preview: Пошаговое руководство по dynamic-components - от базовых концепций до продвинутых паттернов и оптимизации работы с динамическими компонентами
---

## Введение

Динамические компоненты (dynamic-components) — это подход, при котором вы выбираете и подключаете компонент не заранее, а во время выполнения приложения. Проще говоря, нужный компонент определяется «на лету» — в ответ на действия пользователя, данные с сервера, настройки интерфейса или состояние приложения.

Зачем это нужно:

- уменьшить размер первоначального бандла за счет динамической подгрузки;
- строить интерфейс по конфигурации (schema-driven UI);
- переиспользовать общую «обвязку», а внутрь подставлять разные компоненты;
- создавать модульную архитектуру, к которой можно подключать новые компоненты без изменения основной логики.

Давайте разберем, как это работает на практике, на примерах популярных фронтенд‑фреймворков: Vue, React и Angular. Я покажу вам как базовые приемы, так и более продвинутые сценарии: асинхронная загрузка, динамические формы, плагины и др.

---

## Что такое динамический компонент и когда он нужен

### Статический vs динамический компонент

Статический компонент — это когда вы заранее «зашили» конкретный компонент в разметку:

```html
<!-- Статический компонент — всегда отрисуется MyButton -->
<MyButton />
```

Динамический компонент — когда конкретный компонент выбирается во время выполнения:

```html
<!-- Условный пример - отображаем один из компонентов по имени -->
<DynamicComponent :is="currentComponent" />
```

Где `currentComponent` может быть, например, `MyButton`, `MyInput` или `MyCard`.

Смотрите, идея проста: вместо того чтобы «жестко» указывать компонент, вы передаете его как значение (переменную, ссылку, фабрику) и рендерите в общем контейнере.

### Типовые сценарии применения dynamic-components

Перечислю основные кейсы, где динамические компоненты особенно полезны:

1. Переключатель вкладок (tabs)  
   У вас есть несколько экранов (Profile, Settings, Billing), но общая рамка одна. Вы меняете только компонент содержимого.

2. Динамические формы по схеме  
   Сервер присылает структуру формы (типы полей, обязательность, подсказки), а вы по этой схеме выбираете соответствующие компоненты для рендера.

3. Асинхронная подгрузка тяжелых частей интерфейса  
   Например, графики или сложные виджеты грузятся только тогда, когда реально понадобились.

4. Плагины и расширения  
   Вы можете зарегистрировать набор компонентов, а затем конфигурацией (или даже из внешних пакетов) решать, какие из них использовать.

5. Модальные окна и уведомления  
   Одна инфраструктура модального окна, внутри которой рендерятся разные «тела» модалок — формы, подтверждения, превью и т.д.

Теперь давайте подробно посмотрим, как реализуются динамические компоненты в разных фреймворках и какие при этом есть нюансы.

---

## Динамические компоненты во Vue

В Vue (2 и 3 версии) поддержка динамических компонентов встроена из коробки через специальный компонент `<component>`.

### Базовый пример с `<component :is>`

Давайте начнем с простого примера вкладок:

```vue
<template>
  <div>
    <!-- Панель переключения вкладок -->
    <button @click="current = 'UserProfile'">Профиль</button>
    <button @click="current = 'UserSettings'">Настройки</button>

    <!-- Здесь размещается динамический компонент -->
    <component :is="current" />
  </div>
</template>

<script>
import UserProfile from './UserProfile.vue'
import UserSettings from './UserSettings.vue'

export default {
  components: {
    UserProfile,
    UserSettings,
  },
  data() {
    return {
      // Здесь храним имя компонента, который нужно отрисовать
      current: 'UserProfile',
    }
  },
}
</script>
```

Комментарии к примеру:

- `current` — строка с именем зарегистрированного локально компонента;
- `<component :is="current" />` — специальный тег, который Vue заменит на нужный компонент;
- как только вы меняете `current`, Vue «переключает» компонент.

Вы также можете передавать не строку, а сам объект компонента:

```vue
<template>
  <!-- Отрисуем компонент, ссылка на который лежит в currentComponent -->
  <component :is="currentComponent" />
</template>

<script>
import MyButton from './MyButton.vue'
import MyInput from './MyInput.vue'

export default {
  data() {
    return {
      // Здесь напрямую лежит объект компонента, а не строка
      currentComponent: MyButton,
    }
  },
  methods: {
    showInput() {
      // Переключаемся на другой компонент
      this.currentComponent = MyInput
    },
  },
}
</script>
```

### Передача пропсов и событий в динамический компонент

Динамический компонент ведет себя как обычный, поэтому вы можете передавать пропсы и слушать события:

```vue
<template>
  <component
    :is="current"
    :value="value"
    :readonly="readonly"
    @change="onChange"
  />
</template>

<script>
export default {
  props: {
    value: String,
    readonly: Boolean,
  },
  data() {
    return {
      current: 'TextInput', // или 'TextareaInput'
    }
  },
  methods: {
    onChange(newValue) {
      // Обрабатываем событие change от любого динамического компонента
      this.$emit('input', newValue)
    },
  },
}
</script>
```

Vue сам пробросит пропсы и события в фактический компонент, который отрисует `<component :is>`.

### Кэширование с keep-alive

Если вы часто переключаете динамические компоненты (как во вкладках), их полное размонтирование и повторная инициализация может быть накладной по производительности и UX (пропадут введенные данные).

Vue позволяет кэшировать динамические компоненты с помощью `<keep-alive>`:

```vue
<template>
  <keep-alive>
    <!-- Компонент будет сохранять свое состояние при переключении -->
    <component :is="current" />
  </keep-alive>
</template>
```

Как это работает:

- при первом рендере Vue монтирует компонент;
- при переключении он не уничтожается, а «замораживается» и сохраняется в памяти;
- при возвращении на него состояние восстанавливается.

Можно также тонко управлять тем, какие компоненты кэшировать:

```vue
<keep-alive include="UserProfile,UserSettings">
  <component :is="current" />
</keep-alive>
```

### Асинхронные динамические компоненты

Теперь давайте посмотрим на более интересный сценарий — динамическая подгрузка компонентов только по требованию. Это помогает уменьшить размер главного бандла.

Пример на Vue 3 с использованием `defineAsyncComponent`:

```js
// asyncComponents.js
import { defineAsyncComponent } from 'vue'

// Здесь мы описываем асинхронный компонент
export const AsyncChart = defineAsyncComponent(() =>
  // Импортируем компонент только при первом использовании
  import('./ChartComponent.vue')
)
```

Теперь подключаем его как обычный компонент, но тоже можем использовать динамически:

```vue
<template>
  <!-- Выведем компонент только когда он реально нужен -->
  <component :is="currentComponent" />
</template>

<script>
import { AsyncChart } from './asyncComponents'
import SimpleList from './SimpleList.vue'

export default {
  data() {
    return {
      // По умолчанию показываем простой список
      currentComponent: SimpleList,
    }
  },
  methods: {
    showChart() {
      // Когда вызываем этот метод, подгрузится AsyncChart
      this.currentComponent = AsyncChart
    },
  },
}
</script>
```

Чтобы улучшить UX при асинхронной загрузке, можно настроить лоадер и обработку ошибок:

```js
import { defineAsyncComponent } from 'vue'
import LoadingIndicator from './LoadingIndicator.vue'
import ErrorView from './ErrorView.vue'

export const AsyncChart = defineAsyncComponent({
  // Основной компонент грузим лениво
  loader: () => import('./ChartComponent.vue'),

  // Пока грузится - показываем индикатор
  loadingComponent: LoadingIndicator,

  // Если произошла ошибка - покажем ErrorView
  errorComponent: ErrorView,

  // Задержка перед показом лоадера (мс)
  delay: 200,

  // Максимальное время ожидания загрузки (мс)
  timeout: 10000,
})
```

### Динамические формы по схеме (schema-driven UI) во Vue

Давайте разберем пример, когда сервер присылает схему полей, а вы по этой схеме динамически рендерите разные компоненты.

Предположим, у нас есть такая схема:

```js
// Пример схемы формы
const formSchema = [
  { type: 'text', name: 'firstName', label: 'Имя' },
  { type: 'text', name: 'lastName', label: 'Фамилия' },
  { type: 'select', name: 'country', label: 'Страна', options: ['RU', 'US'] },
]
```

Создадим карту соответствия типа поля и компонента:

```js
// maps/fieldMap.js
import TextField from '../fields/TextField.vue'
import SelectField from '../fields/SelectField.vue'

// Здесь мы храним маппинг "тип поля -> компонент"
export const fieldComponentMap = {
  text: TextField,
  select: SelectField,
}
```

Теперь динамически собираем форму:

```vue
<template>
  <form @submit.prevent="onSubmit">
    <div
      v-for="field in schema"
      :key="field.name"
    >
      <!-- Выбираем компонент по типу -->
      <component
        :is="getFieldComponent(field.type)"
        v-model="model[field.name]"
        v-bind="field"
      />
    </div>

    <button type="submit">Отправить</button>
  </form>
</template>

<script>
import { fieldComponentMap } from './maps/fieldMap'

export default {
  props: {
    schema: {
      type: Array,
      required: true,
    },
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      model: {
        // Копируем входные данные, чтобы изменять локально
        ...this.value,
      },
    }
  },
  methods: {
    getFieldComponent(type) {
      // Возвращаем компонент по типу, либо дефолтный
      return fieldComponentMap[type] || fieldComponentMap.text
    },
    onSubmit() {
      // Отдаем наружу модель формы
      this.$emit('submit', this.model)
    },
  },
}
</script>
```

Здесь вы видите典:

- как легко расширять список поддерживаемых полей (добавляем новый компонент и маппинг);
- как динамические компоненты позволяют строить целый UI из конфигурации.

---

## Динамические компоненты в React

В React немного другая модель, но идея та же: компонент является обычной функцией или классом, и вы можете передавать его как значение.

### Передача компонента как пропа

Начнем с самого базового подхода — передать компонент в качестве пропса и отрисовать его:

```jsx
// ContentWrapper.jsx
// Компонент-обертка, который принимает внутрь любой компонент
export function ContentWrapper({ component: Component, title }) {
  return (
    <div className="wrapper">
      <h2>{title}</h2>
      {/* Здесь мы динамически рендерим переданный компонент */}
      <Component />
    </div>
  )
}
```

Использование:

```jsx
// App.jsx
import { ContentWrapper } from './ContentWrapper'
import Profile from './Profile'
import Settings from './Settings'

export function App() {
  const [tab, setTab] = useState('profile')

  // Здесь мы выбираем нужный компонент в зависимости от состояния
  const CurrentComponent = tab === 'profile' ? Profile : Settings

  return (
    <>
      <button onClick={() => setTab('profile')}>Профиль</button>
      <button onClick={() => setTab('settings')}>Настройки</button>

      <ContentWrapper
        title="Панель пользователя"
        component={CurrentComponent}
      />
    </>
  )
}
```

Обратите внимание:

- `component: Component` — мы принимаем компонент и даем ему локальное имя `Component`;
- `<Component />` — обычный JSX, но имя определено из пропса;
- выбор компонента (`CurrentComponent`) происходит в коде, а не в разметке.

### Динамические компоненты через мапу

Очень часто удобнее использовать объект‑мапу для выбора компонента по ключу:

```jsx
// componentsMap.js
import Profile from './Profile'
import Settings from './Settings'
import Billing from './Billing'

// Карта "ключ -> компонент"
export const componentsMap = {
  profile: Profile,
  settings: Settings,
  billing: Billing,
}
```

Используем:

```jsx
// App.jsx
import { componentsMap } from './componentsMap'

export function App() {
  const [page, setPage] = useState('profile')

  // Извлекаем компонент по ключу
  const PageComponent = componentsMap[page] ?? componentsMap.profile

  return (
    <div>
      {/* Переключатели страницы */}
      <nav>
        <button onClick={() => setPage('profile')}>Профиль</button>
        <button onClick={() => setPage('settings')}>Настройки</button>
        <button onClick={() => setPage('billing')}>Оплата</button>
      </nav>

      {/* Динамический компонент */}
      <PageComponent />
    </div>
  )
}
```

Такой подход очень похож на пример с картой типов полей во Vue.

### React.lazy и dynamic-components

Теперь давайте посмотрим, как в React организовать асинхронную подгрузку динамических компонентов. Здесь вам пригодятся `React.lazy` и `Suspense`.

Пример:

```jsx
// pages.js
import React from 'react'

// Здесь мы объявляем ленивые компоненты
export const ProfilePage = React.lazy(() => import('./ProfilePage'))
export const SettingsPage = React.lazy(() => import('./SettingsPage'))
export const BillingPage = React.lazy(() => import('./BillingPage'))
```

Используем их динамически:

```jsx
// App.jsx
import React, { Suspense, useState } from 'react'
import {
  ProfilePage,
  SettingsPage,
  BillingPage,
} from './pages'

// Мапа "страница -> ленивый компонент"
const pagesMap = {
  profile: ProfilePage,
  settings: SettingsPage,
  billing: BillingPage,
}

export function App() {
  const [page, setPage] = useState('profile')

  const CurrentPage = pagesMap[page] ?? pagesMap.profile

  return (
    <div>
      <nav>
        <button onClick={() => setPage('profile')}>Профиль</button>
        <button onClick={() => setPage('settings')}>Настройки</button>
        <button onClick={() => setPage('billing')}>Оплата</button>
      </nav>

      {/* Suspense покажет fallback пока компонент грузится */}
      <Suspense fallback={<div>Загрузка...</div>}>
        {/* Динамический ленивый компонент */}
        <CurrentPage />
      </Suspense>
    </div>
  )
}
```

Что здесь важно:

- `React.lazy` позволяет отложенно загрузить модуль с компонентом;
- в момент первого рендера такого компонента React загрузит соответствующий чанк;
- `Suspense` управляет UI во время загрузки.

### Паттерн «Render prop» для динамических компонентов

Иногда удобнее не передавать компонент напрямую, а передавать функцию, которая его рендерит. Это дает больше гибкости.

Пример:

```jsx
// DynamicRenderer.jsx
export function DynamicRenderer({ render, data }) {
  // Здесь мы вызываем переданную функцию render
  // и передаем ей контекстные данные
  return (
    <div className="dynamic-renderer">
      {render(data)}
    </div>
  )
}
```

Использование:

```jsx
// App.jsx
import { DynamicRenderer } from './DynamicRenderer'
import UserCard from './UserCard'
import UserTable from './UserTable'

export function App() {
  const [view, setView] = useState('card')
  const users = [/* массив пользователей */]

  return (
    <>
      <button onClick={() => setView('card')}>Карточки</button>
      <button onClick={() => setView('table')}>Таблица</button>

      <DynamicRenderer
        data={users}
        render={(data) => {
          // В зависимости от состояния возвращаем нужный компонент
          if (view === 'card') {
            return <UserCard users={data} />
          }

          return <UserTable users={data} />
        }}
      />
    </>
  )
}
```

Здесь вы не храните компонент как значение, но динамически решаете, что отрисовать внутри `render`.

### Динамические формы по схеме в React

Схема формы почти такая же, как в Vue-примере:

```js
// formSchema.js
export const formSchema = [
  { type: 'text', name: 'firstName', label: 'Имя' },
  { type: 'text', name: 'lastName', label: 'Фамилия' },
  { type: 'select', name: 'country', label: 'Страна', options: ['RU', 'US'] },
]
```

Мапа компонентов:

```jsx
// fields/index.js
import { TextField } from './TextField'
import { SelectField } from './SelectField'

export const fieldMap = {
  text: TextField,
  select: SelectField,
}
```

Сам компонент формы:

```jsx
// DynamicForm.jsx
import { fieldMap } from './fields'

export function DynamicForm({ schema, value, onSubmit }) {
  // Инициализируем состояние формы начальными значениями
  const [model, setModel] = useState(value ?? {})

  const handleChange = (name, newValue) => {
    // Обновляем только одно поле формы
    setModel((prev) => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = (event) => {
    // Отменяем стандартное поведение формы
    event.preventDefault()
    // Отдаем наружу текущую модель
    onSubmit?.(model)
  }

  return (
    <form onSubmit={handleSubmit}>
      {schema.map((field) => {
        const FieldComponent = fieldMap[field.type] ?? fieldMap.text

        return (
          <div key={field.name}>
            {/* Динамический компонент поля */}
            <FieldComponent
              {...field}
              value={model[field.name] ?? ''}
              onChange={(val) => handleChange(field.name, val)}
            />
          </div>
        )
      })}

      <button type="submit">Отправить</button>
    </form>
  )
}
```

Так вы можете строить сложные интерфейсы из конфигураций, не прописывая каждый компонент вручную.

---

## Динамические компоненты в Angular

В Angular подход немного отличается, но динамический рендер компонентов тоже возможен и активно используется.

### Старый подход: ComponentFactoryResolver (Angular < 13)

Сначала посмотрим на традиционный подход, который часто встречается в существующих проектах.

Шаг 1. Создаем контейнер:

```ts
// dynamic-host.directive.ts
import {
  Directive,
  ViewContainerRef,
} from '@angular/core'

// Директива, помечающая место, куда будем вставлять динамический компонент
@Directive({
  selector: '[dynamicHost]',
})
export class DynamicHostDirective {
  constructor(
    // ViewContainerRef дает доступ к контейнеру представлений
    public viewContainerRef: ViewContainerRef
  ) {}
}
```

Шаг 2. Используем этот контейнер в родительском компоненте:

```html
<!-- app.component.html -->
<!-- Здесь будет размещен динамический компонент -->
<ng-template dynamicHost></ng-template>
```

Шаг 3. В коде компонента вставляем нужный компонент:

```ts
// app.component.ts
import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ViewChild,
} from '@angular/core'
import { DynamicHostDirective } from './dynamic-host.directive'
import { ProfileComponent } from './profile.component'
import { SettingsComponent } from './settings.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  @ViewChild(DynamicHostDirective, { static: true })
  dynamicHost!: DynamicHostDirective

  constructor(
    // ComponentFactoryResolver создает фабрики компонентов
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngAfterViewInit() {
    // Здесь можно выбрать, какой компонент отрисовать
    this.loadComponent(ProfileComponent)
  }

  loadComponent(component: any) {
    // Создаем фабрику компонента
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(component)

    // Получаем контейнер для представлений
    const viewContainerRef = this.dynamicHost.viewContainerRef
    // Очищаем контейнер перед вставкой нового компонента
    viewContainerRef.clear()

    // Создаем и вставляем компонент в контейнер
    viewContainerRef.createComponent(componentFactory)
  }

  showSettings() {
    // При вызове этого метода подгрузим другой компонент
    this.loadComponent(SettingsComponent)
  }
}
```

Такой подход достаточно низкоуровневый, но хорошо демонстрирует механику: вы явно управляете контейнером и создаете экземпляры компонентов.

### Новый подход: ViewContainerRef.createComponent (Angular 13+)

Современный Angular упростил API:

```ts
// dynamic.service.ts
import {
  Injectable,
  ViewContainerRef,
  Type,
} from '@angular/core'

@Injectable({ providedIn: 'root' })
export class DynamicService {
  // Здесь храним ссылку на контейнер
  private hostViewContainer?: ViewContainerRef

  setHost(viewContainerRef: ViewContainerRef) {
    this.hostViewContainer = viewContainerRef
  }

  loadComponent<T>(component: Type<T>) {
    if (!this.hostViewContainer) {
      // Если контейнер не установлен - выходим
      return
    }

    // Очищаем контейнер
    this.hostViewContainer.clear()

    // Создаем компонент без фабрики - Angular все сделает сам
    return this.hostViewContainer.createComponent(component)
  }
}
```

Использование в компоненте:

```ts
// app.component.ts
import {
  Component,
  AfterViewInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core'
import { DynamicService } from './dynamic.service'
import { ProfileComponent } from './profile.component'
import { SettingsComponent } from './settings.component'

@Component({
  selector: 'app-root',
  template: `
    <!-- Контейнер для динамических компонентов -->
    <ng-template #host></ng-template>

    <button (click)="showProfile()">Профиль</button>
    <button (click)="showSettings()">Настройки</button>
  `,
})
export class AppComponent implements AfterViewInit {
  // Получаем ссылку на ViewContainerRef через шаблонную переменную
  @ViewChild('host', { read: ViewContainerRef, static: true })
  host!: ViewContainerRef

  constructor(private dynamicService: DynamicService) {}

  ngAfterViewInit() {
    // Устанавливаем контейнер в сервис
    this.dynamicService.setHost(this.host)
    // По умолчанию показываем профиль
    this.dynamicService.loadComponent(ProfileComponent)
  }

  showProfile() {
    // Переключаем динамический компонент на профиль
    this.dynamicService.loadComponent(ProfileComponent)
  }

  showSettings() {
    // Переключаем на настройки
    this.dynamicService.loadComponent(SettingsComponent)
  }
}
```

Здесь вы видите, что теперь не нужно явно работать с фабриками.

### Передача входных параметров и событий

После создания компонента вы можете настраивать его экземпляр:

```ts
// dynamic.service.ts (фрагмент)
loadComponent<T>(
  component: Type<T>,
  inputs?: Partial<T>
) {
  if (!this.hostViewContainer) return

  this.hostViewContainer.clear()

  const componentRef = this.hostViewContainer.createComponent(component)

  // Записываем входные параметры, если они переданы
  if (inputs) {
    Object.assign(componentRef.instance, inputs)
  }

  return componentRef
}
```

Использование:

```ts
// app.component.ts (фрагмент)
showProfile() {
  // Передаем входные данные компоненту ProfileComponent
  this.dynamicService.loadComponent(ProfileComponent, {
    userId: 123,
  })
}
```

Если компонент эмитит события через `@Output`, вы можете подписаться на них на `componentRef.instance`.

---

## Общие паттерны работы с dynamic-components

Независимо от фреймворка, при работе с динамическими компонентами проявляются одни и те же паттерны и проблемы. Давайте их систематизируем.

### Карта тип -> компонент

Самый удобный и масштабируемый способ — использовать карту (объект / словарь) с ключами и компонентами:

- ключ — строка, тип, идентификатор из конфигурации;
- значение — ссылка на компонент или ленивый импорт.

Преимущества:

- легко добавлять новые типы (добавили новый ключ и компонент);
- удобно валидировать (можно проверить, есть ли компонент по ключу);
- хорошо ложится на конфигурационный подход (schema-driven UI).

### Фабрика компонентов

Еще один полезный паттерн — «фабрика» компонентов, когда вы заворачиваете выбор компонента в функцию:

```ts
// псевдокод на TypeScript-подобном синтаксисе
function resolveComponent(type: string) {
  switch (type) {
    case 'text':
      return TextField
    case 'select':
      return SelectField
    default:
      return DefaultField
  }
}
```

Смотрите, это дает вам:

- централизованную точку, где собрана логика выбора;
- возможность добавлять сложные правила (не только по типу, но и по другим условиям);
- контроль над fallback (что делать, если тип неизвестен).

### Управление жизненным циклом и состоянием

Ключевой вопрос: нужно ли вам сохранять состояние динамических компонентов при переключении?

- если да — используйте кэширование (`<keep-alive>` во Vue, не размонтируйте компонент в React, не очищайте контейнер в Angular);
- если нет — обнуляйте состояние при каждом создании (очищайте контейнер, сбрасывайте ключи).

Пример в React: вы можете «подсказать» React, что компонент должен пересоздаться, изменив его ключ:

```jsx
<PageComponent key={page} />
```

React увидит другой `key` и не станет переиспользовать старый экземпляр.

---

## Типичные ошибки и анти‑паттерны

### Ошибка: динамический импорт без ограничения точек входа

Например, в React или Vue:

```js
// Плохой пример
const componentName = getNameFromUserInput()
const DynamicComponent = React.lazy(() =>
  import(`./components/${componentName}`)
)
```

Проблема:

- этот код потенциально открывает путь к загрузке любого файла из папки;
- сложно гарантировать, что сборщик правильно разбил бандлы;
- без белого списка можно получить проблемы с безопасностью.

Лучше использовать явную карту:

```js
const componentsMap = {
  profile: React.lazy(() => import('./components/Profile')),
  settings: React.lazy(() => import('./components/Settings')),
}
```

### Ошибка: слишком мелкая динамика

Иногда разработчики начинают делать динамическими даже очень простые компоненты (иконки, небольшие блоки, которые и так легкие). Это добавляет сложности и снижает читаемость кода, но почти не выигрывает в производительности.

Здоровый ориентир: динамическими обычно делают:

- крупные страницы;
- тяжелые виджеты;
- редко используемые модули.

### Ошибка: забытое состояние при переключении

Когда вы переключаете динамические компоненты, важно помнить о состоянии. Например, вы можете случайно обнулить форму пользователя при переходе между вкладками. В Vue это решается `keep-alive`, в React — более осторожным обращением с `key`, в Angular — решением не очищать контейнер без необходимости.

---

## Заключение

Динамические компоненты (dynamic-components) — это не магия, а просто системный способ:

- выбирать компонент во время выполнения;
- подгружать его по требованию;
- строить интерфейс по конфигурациям и схемам.

Во Vue это чаще всего `<component :is>` плюс `keep-alive` и `defineAsyncComponent`. В React — передача компонента как пропа, мапы компонентов, `React.lazy` и `Suspense`. В Angular — работа с `ViewContainerRef.createComponent` и динамическое создание экземпляров.

Используя подход dynamic-components, вы получаете:

- более гибкую архитектуру интерфейса;
- возможность внедрять плагины и расширения;
- управляемый размер бандла за счет ленивой загрузки;
- удобную реализацию schema-driven UI.

Главное — не перегибать: делайте динамическими те части, которые действительно должны меняться по конфигурации или подгружаться асинхронно, и придерживайтесь понятных паттернов вроде карт и фабрик компонентов.

---

## Частозадаваемые технические вопросы по dynamic-components

### Как типизировать динамические компоненты в TypeScript в React или Vue

Хороший подход — использовать обобщения (generics) и описывать пропсы компонента через `ComponentType` (React) или `DefineComponent` (Vue). В React, например:

```ts
import { ComponentType } from 'react'

type DynamicProps<P> = {
  component: ComponentType<P>
} & P
```

Так вы сможете передавать строго типизированные пропсы и получать подсказки в редакторе.

### Как протестировать динамические компоненты

Тестируйте два слоя отдельно:

1. Сами компоненты — как обычные юнит‑тесты.
2. Механизм выбора — через снапшот‑тесты и моковые компоненты. Подменяйте реальные компоненты простыми заглушками и проверяйте, что при заданном состоянии / конфигурации рендерится нужный тип.

### Как логировать и отлаживать выбор динамического компонента

Добавьте небольшой логгер вокруг фабрики или карты компонентов. Перед тем как вернуть компонент, выводите в консоль тип, конфигурацию и результат выбора. В продакшене можно включать логирование только по флагу (например, через переменную окружения или фиче‑флаг).

### Как избежать «лесенки» из условий при выборе компонента

Если у вас много `if/else` или `switch`, перенесите логику в:

- объект‑мапу;
- или в отдельную функцию‑фабрику, где правила выбора можно выражать таблицей или набором предикатов. Это упростит расширение и тестирование.

### Как динамически подключать компоненты из внешних модулей или плагинов

Используйте реестр (registry):

1. создайте объект, где ключ — идентификатор плагина, значение — компонент;
2. предоставьте API `registerComponent(id, component)`;
3. плагины при инициализации вызывают этот метод;
4. при рендере достаете компонент из реестра по `id`.  

Такой подход позволяет изолировать плагины и не править основной код приложения при добавлении новых dynamic-components.