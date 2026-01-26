---
metaTitle: Provide и Inject в современных фреймворках
metaDescription: Подробное объяснение механизма Provide Inject - как он помогает управлять зависимостями между компонентами и упрощает архитектуру приложений
author: Олег Марков
title: Механизм Provide Inject - как он работает и когда применять
preview: Разбираем Provide Inject - зачем он нужен как устроен и как использовать его на практике для упрощения структуры приложений
---

## Введение

Механизм Provide/Inject (часто пишут provide/inject или provide-inject) встречается в разных фреймворках и языках программирования, но его суть почти всегда одна и та же. У вас есть некий "поставщик" значения (provide), который делает данные или объекты доступными "глубоко" в иерархии, и есть "потребители" (inject), которые эти данные получают, минуя длинные цепочки параметров и пропсов.

Чаще всего вы сталкиваетесь с Provide/Inject в следующих ситуациях:

- во фронтенде  
  - Vue 3 (композиционное API и опции компонентов)  
  - Nuxt  
  - иногда в обвязках вокруг React или других библиотек  
- в backend и DI-контейнерах  
  - Angular (NgModule providers)  
  - NestJS  
  - разные IoC/DI контейнеры в Go, Java, C#

В этой статье я буду объяснять концепцию на примерах Vue 3, потому что там Provide/Inject особенно нагляден и прост. Но вам будет полезно и в других стекх: идея и типичные ошибки везде одинаковые.

Давайте разберем, как Provide/Inject работает, когда он нужен, какие у него ограничения и как не попасть в типичные ловушки.

## Базовая идея Provide/Inject

### Зачем вообще нужен Provide/Inject

Представьте дерево компонентов:

- Корневой компонент App
  - Компонент Layout
    - Компонент Sidebar
      - Компонент Menu
        - Компонент MenuItem

Если вам нужно передать одно и то же значение (например, текущего пользователя, настройки темы или инстанс какого-то сервиса) от App до MenuItem, у вас есть несколько вариантов:

1. Прокидывать пропсы через каждый уровень  
   - App -> Layout -> Sidebar -> Menu -> MenuItem  
   - каждый промежуточный компонент обязан знать о значении и передавать его дальше  

2. Использовать глобальное хранилище  
   - Vuex, Pinia, Redux и т.д.  
   - по сути, "глобальная" точка доступа  

3. Использовать Provide/Inject  
   - App делает provide значения  
   - MenuItem делает inject и сразу получает нужные данные  
   - промежуточные компоненты ничего о значении не знают

Provide/Inject хорошо подходит, когда:

- значение логически "принадлежит" какому-то родительскому компоненту
- это значение нужно только части поддерева
- вы не хотите "засорять" пропсами все промежуточные уровни
- вы хотите сохранить компонент переиспользуемым (чтобы он не имел кучи "лишних" пропсов только ради проброса)

### Как устроена пара Provide / Inject в общем виде

На концептуальном уровне:

- `provide(key, value)` — регистрирует значение в текущем "контейнере" (компоненте, модуле, контексте)
- `inject(key)` — ищет значение с этим ключом в ближайшем родителе, затем выше по дереву, пока не найдет

То есть это поиск "вверх" по иерархии, а не "вниз". Компонент, который делает inject, не знает и не должен знать, кто именно сделал provide этого значения. Его волнует только ключ и контракт (тип/структура значения).

Иногда механизм поддерживает:

- дефолтное значение, если ничего не найдено
- ленивую инициализацию (дефолт как функция)
- реактивность (если используется в реактивных фреймворках)
- строгую типизацию при использовании TypeScript

Давайте теперь посмотрим на конкретную реализацию на примере Vue 3.

## Provide/Inject в Vue 3 – базовый пример

### Простейший пример с Options API

Сначала посмотрим на классический синтаксис Vue с опцией provide/inject. Здесь я показываю максимально простой пример, чтобы вы увидели общую идею.

#### Родительский компонент

```js
// App.vue
export default {
  name: 'App',

  // provide как объект или функция
  provide() {
    return {
      // Ключ 'theme' и значение 'dark'
      // Это значение смогут получить дочерние компоненты с помощью inject
      theme: 'dark'
    }
  }
}
```

#### Дочерний компонент

```js
// Child.vue
export default {
  name: 'Child',

  // inject - перечисляем ключи, которые хотим получить
  inject: ['theme'],

  mounted() {
    // Здесь this.theme содержит значение, предоставленное родителем
    console.log('Текущая тема:', this.theme) // Текущая тема: dark
  }
}
```

Здесь:

- App делает provide ключа `theme`
- Child делает inject того же ключа `theme`
- промежуточные компоненты не обязаны ничего знать о теме

Важно: связь осуществляется только по имени ключа. Если вы опечатаетесь в ключе, Vue просто не найдет значение.

### Provide/Inject с Composition API

На практике сегодня чаще используют Composition API: функции setup, provide и inject из пакета vue.

Давайте разберем тот же пример, но уже с Composition API.

#### Родительский компонент с provide

```js
// App.vue
import { defineComponent, provide } from 'vue'

export default defineComponent({
  name: 'App',

  setup() {
    // Здесь мы "предоставляем" значение под ключом 'theme'
    provide('theme', 'dark')

    // Можно предоставлять и сложные объекты, а не только строки
    const user = {
      id: 1,
      name: 'Alex'
    }

    // Здесь мы предоставляем объект user под ключом 'currentUser'
    provide('currentUser', user)

    // Компонент по-прежнему может что-то возвращать в шаблон
    return {}
  }
})
```

#### Дочерний компонент с inject

```js
// Child.vue
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'Child',

  setup() {
    // Получаем значение по ключу 'theme'
    const theme = inject('theme')

    // Получаем объект пользователя по ключу 'currentUser'
    const currentUser = inject('currentUser')

    // В шаблон можно вернуть что-то производное или сами значения
    return {
      theme,
      currentUser
    }
  }
})
```

Смотрите, я не завязываю Child на App напрямую. Мне важно только, чтобы в каком-то родителе по дереву был вызван provide с тем же ключом.

## Ключи provide/inject – строки, символы и константы

### Почему лучше не использовать "магические строки"

Если вы пишете:

```js
provide('theme', 'dark')
const theme = inject('theme')
```

то между этими строками нет явной связи на уровне типов и автодополнения. Опечатка в одной из строк не будет найдена до рантайма.

Поэтому хороший подход — выносить ключи в константы или использовать Symbol.

#### Вариант 1 – константа-строка

```js
// keys.js
export const THEME_KEY = 'theme'
```

```js
// App.vue
import { defineComponent, provide } from 'vue'
import { THEME_KEY } from './keys'

export default defineComponent({
  setup() {
    provide(THEME_KEY, 'dark')
  }
})
```

```js
// Child.vue
import { defineComponent, inject } from 'vue'
import { THEME_KEY } from './keys'

export default defineComponent({
  setup() {
    const theme = inject(THEME_KEY) // меньше шансов ошибиться в названии
    return { theme }
  }
})
```

#### Вариант 2 – Symbol как ключ

Symbol часто используют, чтобы гарантировать уникальность ключа и избежать конфликтов имен.

```js
// keys.js
export const ThemeKey = Symbol('theme')
```

```js
// App.vue
import { defineComponent, provide } from 'vue'
import { ThemeKey } from './keys'

export default defineComponent({
  setup() {
    // Здесь ключом служит Symbol, а не строка
    provide(ThemeKey, 'dark')
  }
})
```

```js
// Child.vue
import { defineComponent, inject } from 'vue'
import { ThemeKey } from './keys'

export default defineComponent({
  setup() {
    // Ключ ThemeKey тот же самый Symbol, поэтому inject найдет значение
    const theme = inject(ThemeKey)
    return { theme }
  }
})
```

В TypeScript это особенно удобно, потому что можно привязать типы к этому символу.

## Реактивность при использовании Provide/Inject

### Важный момент – provide не делает значение реактивным сам по себе

Если вы просто передадите примитив:

```js
provide('theme', 'dark')
```

и потом попытаетесь поменять его значение где-то в родителе, это не обновит значение в дочерних компонентах. Почему так происходит:

- Vue не "оборачивает" значение в реактивный контейнер автоматически
- вы передали обычную строку, а не реактивную ссылку или объект

Чтобы сделать значение реактивным, нужно передавать ref или reactive.

### Пример с ref

```js
// App.vue
import { defineComponent, provide, ref } from 'vue'

export default defineComponent({
  name: 'App',

  setup() {
    // Создаем реактивную ссылку на тему
    const theme = ref('dark')

    // Предоставляем именно ref, а не голое значение
    provide('theme', theme)

    // Где-то в родителе мы можем менять theme.value
    // и дочерние компоненты увидят изменения
    function toggleTheme() {
      // Здесь мы переключаем тему
      theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    return {
      theme,
      toggleTheme
    }
  }
})
```

```js
// Child.vue
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'Child',

  setup() {
    // Получаем ref
    const theme = inject('theme')

    // Обратите внимание - для работы с ref в шаблоне
    // Vue автоматически разыменует .value
    return {
      theme
    }
  }
})
```

В этом примере:

- родитель хранит состояние темы как ref
- provide делится этим ref с потомками
- потомки реагируют на изменения, потому что работают с тем же ref

### Пример с reactive объектом

Если вы предоставите целый объект состояния, его тоже лучше сделать реактивным.

```js
// App.vue
import { defineComponent, provide, reactive } from 'vue'

export default defineComponent({
  name: 'App',

  setup() {
    // Создаем реактивный объект настроек
    const settings = reactive({
      theme: 'dark',
      language: 'en'
    })

    // Предоставляем объект
    provide('settings', settings)

    // Любые изменения settings.theme или settings.language
    // будут автоматически видны в потомках
    return {
      settings
    }
  }
})
```

```js
// Child.vue
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'Child',

  setup() {
    // Получаем тот же самый reactive объект
    const settings = inject('settings')

    // Теперь вы можете читать и изменять settings.theme, settings.language
    // и эти изменения будут реактивными
    return {
      settings
    }
  }
})
```

Выбирайте ref или reactive в зависимости от структуры данных:

- ref — если это одно значение
- reactive — если это объект или сложная структура

## Provide/Inject и TypeScript

### Типизация inject

По умолчанию функция inject в Vue 3 имеет тип:

- возвращает значение типа `unknown`

То есть без подсказки типов вы получаете значение, которым неудобно пользоваться в TypeScript.

Чтобы задать тип, есть два подхода.

#### Подход 1 – дженерик у inject

```ts
import { defineComponent, provide, inject, ref, Ref } from 'vue'

const ThemeKey = Symbol('theme')

export default defineComponent({
  setup() {
    const theme = ref<'dark' | 'light'>('dark')
    provide(ThemeKey, theme)

    return {}
  }
})

// В другом файле
export const Child = defineComponent({
  setup() {
    // Указываем тип явно
    const theme = inject<Ref<'dark' | 'light'>>(ThemeKey)

    if (!theme) {
      // Здесь можно обработать ситуацию, если значение не найдено
      throw new Error('Theme is not provided')
    }

    // Теперь theme имеет тип Ref<'dark' | 'light'>
    return { theme }
  }
})
```

Комментарии к этому коду:

- дженерик `<Ref<'dark' | 'light'>>` говорит TypeScript, чего мы ожидаем
- inject может вернуть `undefined`, поэтому нужно учитывать этот случай
- часто в таких местах вы либо кидаете ошибку, либо задаете дефолт

#### Подход 2 – дефолтное значение и тип по нему

```ts
import { defineComponent, inject, ref, Ref } from 'vue'

const ThemeKey = Symbol('theme')

export const Child = defineComponent({
  setup() {
    // Передаем дефолт, чтобы inject всегда возвращал значение
    const defaultTheme = ref<'dark' | 'light'>('light')

    const theme = inject<Ref<'dark' | 'light'>>(ThemeKey, defaultTheme)

    // Здесь theme гарантированно не undefined
    return { theme }
  }
})
```

Дефолтное значение:

- используется, если никакой provide по этому ключу не найден
- позволяет не писать дополнительные проверки на undefined

### Типизация ключей

Если вы используете Symbol как ключ, вы можете описать key более строго:

```ts
import type { InjectionKey, Ref } from 'vue'

// Описываем ключ с указанием типа значения, которое будет предоставлено
export const ThemeKey: InjectionKey<Ref<'dark' | 'light'>> = Symbol('theme')
```

Теперь:

- при provide(ThemeKey, value) TypeScript проверит, что value соответствует типу `Ref<'dark' | 'light'>`
- при inject(ThemeKey) TypeScript поймет, что вы получаете `Ref<'dark' | 'light'> | undefined`

Это очень удобно для больших проектов.

## Наследование и переопределение provide

### Как работает поиск значения при inject

Когда компонент вызывает inject:

1. Vue смотрит на ближайшего родителя
2. если у родителя есть provide с нужным ключом — берет его
3. если нет — поднимается выше и повторяет поиск
4. если никто не предоставил — возвращает undefined или дефолт, если он задан

Таким образом, дерево компонентов работает, как цепочка областей видимости.

### Переопределение значения ниже по дереву

Компонент-потомок может сам сделать provide с тем же ключом, и его дети будут видеть уже новое значение.

Давайте разберем на примере.

```js
// Root.vue
import { defineComponent, provide } from 'vue'

export default defineComponent({
  name: 'Root',
  setup() {
    // Предоставим значение level = 1
    provide('level', 1)
  }
})
```

```js
// ChildA.vue
import { defineComponent, inject, provide } from 'vue'

export default defineComponent({
  name: 'ChildA',
  setup() {
    // Получаем значение от родителя
    const parentLevel = inject('level', 0)

    // Вычисляем новый уровень для себя
    const myLevel = parentLevel + 1

    // Предоставляем свой уровень дальше вниз по дереву
    provide('level', myLevel)

    return {
      myLevel
    }
  }
})
```

```js
// ChildB.vue
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'ChildB',
  setup() {
    // Здесь мы получаем уже переопределенное значение
    const level = inject('level', 0)

    return {
      level
    }
  }
})
```

В этом примере:

- Root предоставляет level = 1
- ChildA повышает уровень до 2 и предоставляет дальше
- ChildB, будучи потомком ChildA, увидит уже level = 2

Такой прием удобно использовать, например, в компонентах, которые строят вложенные списки, деревья или формируют структуру по уровням (заголовки, элементы меню и т.д.).

## Provide/Inject vs Props vs Store – когда что использовать

Очень часто возникает вопрос: когда стоит использовать Provide/Inject, а когда лучше обойтись пропсами или глобальным стором?

Давайте разберем.

### Когда лучше использовать пропсы

Используйте пропсы, когда:

- значение нужно передать только на 1–2 уровня вниз
- связь родитель–ребенок прозрачна и логична
- важно, чтобы интерфейс компонента был явно описан (пропсы как "публичный API")

Пропсы дают:

- хорошую читаемость — открываете компонент, видите, какие у него входные данные
- простую типизацию
- предсказуемое поведение

### Когда уместен Provide/Inject

Используйте Provide/Inject, когда:

- значение нужно передавать на глубину 3+ уровней
- много промежуточных компонентов, которые не используют значение напрямую
- вы не хотите "засорять" пропсами интерфейс компонентов, которые реальное значение не используют
- значение логически относится ко всему поддереву — например:
  - форма и все ее поля
  - таблица и ячейки
  - контекст авторизации для целого раздела

Типичные задачи:

- тема (theme) в рамках модуля
- текущий пользователь или контекст доступа в конкретной части приложения
- конфигурация формы или таблицы
- общий сервис для набора вложенных компонентов

### Когда нужен глобальный store (Vuex/Pinia и аналоги)

Глобальный store предпочтителен, если:

- значение должно быть доступно из разных веток дерева, а не только по одной иерархии
- это "глобальное состояние" всего приложения
- вам нужны инструменты вроде time-travel дебаггера, логирования, сериализации состояния

Простейшее правило:

- локальная задача в одном поддереве — Provide/Inject
- короткая цепочка родитель–ребенок — пропсы/эмиты
- глобальное состояние всего приложения — store

## Примеры реальных сценариев использования Provide/Inject

### Пример 1 – общая конфигурация формы и полей

Давайте разберем довольно типичную задачу: у вас есть компонент Form, в нем несколько InputField и SelectField. Вы хотите:

- задать общую тему и размер полей
- хранить общее состояние в Form
- не передавать кучу пропсов каждому полю

#### Родитель Form

```js
// Form.vue
import { defineComponent, provide, reactive } from 'vue'

const FormContextKey = Symbol('FormContext')

export default defineComponent({
  name: 'Form',

  props: {
    size: {
      type: String,
      default: 'md' // допустим 'sm', 'md', 'lg'
    },
    theme: {
      type: String,
      default: 'light' // light или dark
    }
  },

  setup(props) {
    // Создаем общий контекст формы
    const formContext = reactive({
      size: props.size,
      theme: props.theme,
      // Можно добавить методы для валидации, сабмита и т.д.
      // Для простоты оставим только конфигурацию
    })

    // Предоставляем контекст всем потомкам формы
    provide(FormContextKey, formContext)

    return {
      formContext
    }
  }
})
```

#### Поле ввода InputField

```js
// InputField.vue
import { defineComponent, inject } from 'vue'
import { FormContextKey } from './keys'

export default defineComponent({
  name: 'InputField',

  props: {
    modelValue: String,
    label: String
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    // Получаем контекст формы
    const formContext = inject(FormContextKey)

    // Здесь formContext может быть undefined,
    // если InputField используют вне Form
    // поэтому имеет смысл задать дефолты
    const size = formContext?.size || 'md'
    const theme = formContext?.theme || 'light'

    function onInput(event) {
      // Пробрасываем новое значение наверх через v-model
      emit('update:modelValue', event.target.value)
    }

    return {
      size,
      theme,
      onInput
    }
  }
})
```

Теперь вы можете использовать такую связку в шаблоне:

```html
<Form size="lg" theme="dark">
  <InputField v-model="user.name" label="Имя" />
  <InputField v-model="user.email" label="Email" />
</Form>
```

Как видите, каждый InputField автоматически подхватывает размер и тему от Form, при этом сам компонент InputField остается довольно чистым — он не принимает отдельные пропсы `size` и `theme` в явном виде (или принимает, но имеет дефолты из контекста).

### Пример 2 – дерево меню с уровнями вложенности

Сейчас покажу вам пример, в котором используется идея "уровней" из более раннего раздела.

#### Компонент Menu

```js
// Menu.vue
import { defineComponent, provide } from 'vue'

const LevelKey = Symbol('Level')

export default defineComponent({
  name: 'Menu',

  setup() {
    // Корневой уровень меню = 1
    provide(LevelKey, 1)

    return {}
  }
})
```

#### Компонент MenuGroup (вложенная группа)

```js
// MenuGroup.vue
import { defineComponent, inject, provide } from 'vue'
import { LevelKey } from './keys'

export default defineComponent({
  name: 'MenuGroup',

  setup() {
    // Получаем уровень от родителя
    const parentLevel = inject(LevelKey, 0)
    const myLevel = parentLevel + 1

    // Предоставляем новый уровень дальше
    provide(LevelKey, myLevel)

    return {
      myLevel
    }
  }
})
```

#### Компонент MenuItem

```js
// MenuItem.vue
import { defineComponent, inject } from 'vue'
import { LevelKey } from './keys'

export default defineComponent({
  name: 'MenuItem',

  props: {
    label: String
  },

  setup() {
    // Получаем текущий уровень элемента
    const level = inject(LevelKey, 1)

    return {
      level
    }
  }
})
```

Шаблон может выглядеть так:

```html
<Menu>
  <MenuItem label="Главная" />
  <MenuGroup>
    <MenuItem label="Раздел 1" />
    <MenuItem label="Раздел 2" />
    <MenuGroup>
      <MenuItem label="Подраздел 2.1" />
    </MenuGroup>
  </MenuGroup>
</Menu>
```

Дальше вы можете использовать `level` внутри MenuItem, чтобы настроить:

- отступы
- размер шрифта
- иконки для разных уровней

При этом вам не нужно явно передавать уровень в каждый компонент.

## Частые ошибки и подводные камни Provide/Inject

### Ошибка 1 – несоответствие ключей

Самая банальная, но очень частая ситуация — вы написали:

```js
provide('theme', 'dark')
const theme = inject('them') // опечатка в ключе
```

Результат:

- inject возвращает undefined
- вы не сразу понимаете, почему значение "пропало"

Как избежать:

- выносите ключи в константы или Symbol
- используйте тип `InjectionKey` в TypeScript

### Ошибка 2 – ожидание реактивности без ref/reactive

Вы делаете:

```js
provide('count', 0)
```

и где-то в коде родителя:

```js
// Изменяем локальную переменную count,
// но потомки не увидят изменений
count = 1
```

Причина: вы не передали ref или reactive, вы передали только первоначальное значение.

Как надо:

```js
const count = ref(0)
provide('count', count)

// Теперь, изменяя count.value, вы обновляете значение и в потомках
count.value = 1
```

### Ошибка 3 – использовать Provide/Inject вместо явных пропсов там, где это не нужно

Иногда разработчики начинают использовать Provide/Inject "везде", чтобы "не писать пропсы". В итоге:

- становится сложно понять, откуда берется то или иное значение
- компонент внешне выглядит "чистым", но на деле зависит от невидимых связей

Лучше придерживаться простого принципа:

- если значение относится к самому компоненту и его API — используйте пропсы
- если значение — общий контекст для поддерева — тогда Provide/Inject

### Ошибка 4 – inject в компоненте, который может использоваться и вне контекста

Например, InputField из примера с формой можно использовать отдельно, без Form. Если вы жестко рассчитываете на контекст, компонент может упасть.

Как смягчить:

- использовать inject с дефолтом
- проверять наличие контекста и задавать разумные значения по умолчанию

```js
const formContext = inject(FormContextKey, {
  size: 'md',
  theme: 'light'
})
```

Или:

```js
const formContext = inject(FormContextKey, null)

const size = formContext?.size ?? 'md'
const theme = formContext?.theme ?? 'light'
```

### Ошибка 5 – слишком "глобальный" контекст

Иногда через Provide/Inject пытаются "протянуть" практически все состояние приложения от корня. По сути это превращается в самодельный глобальный store, но:

- без инструментов дебаггинга
- без четкой структуры
- с разрозненными ключами и контекстами

В таких случаях лучше рассмотреть:

- Pinia / Vuex
- или модульный store, а Provide/Inject использовать только для "локальных" контекстов

## Краткое резюме

Механизм Provide/Inject позволяет:

- передавать данные от родителя к потомкам на произвольную глубину
- не прокидывать лишние пропсы через каждый уровень дерева
- создавать локальные контексты для поддеревьев (формы, меню, таблицы и т.д.)
- делиться реактивными значениями (ref/reactive) между компонентами

Ключевые моменты, которые важно запомнить:

- всегда синхронизируйте ключи provide и inject, лучше через константы или Symbol
- для реактивности передавайте ref или reactive
- не подменяйте Provide/Inject там, где проще использовать обычные пропсы или глобальный store
- переопределение provide ниже по дереву позволяет строить иерархические контексты (например, уровни вложенности)

Если вы будете следовать этим правилам, Provide/Inject станет удобным и предсказуемым инструментом, а не источником трудноуловимых багов.

## Частозадаваемые технические вопросы по теме Provide/Inject

### 1. Как протестировать компоненты, которые используют inject, в unit-тестах?

В тестах вам нужно "подложить" значения, которые обычно приходят через provide. В Vue Test Utils можно использовать опцию global.provide.

Пример:

```js
// Здесь мы монтируем компонент и подсовываем ему контекст через provide
const wrapper = mount(ChildComponent, {
  global: {
    provide: {
      theme: 'dark',
      currentUser: { id: 1, name: 'Test' }
    }
  }
})
```

Так вы контролируете значения, которые компонент получит через inject, и можете явно проверять поведение.

### 2. Можно ли вызывать provide динамически, уже после монтирования компонента?

Значения, которые вы передали в provide, могут меняться (если это ref или reactive), но сам вызов provide должен происходить внутри setup или в момент инициализации компонента. Добавлять новые ключи "задним числом" технически возможно, но это усложняет логику и может быть неочевидно. Обычно лучше заранее определить все ключи и передавать реактивные контейнеры, а не пытаться вызывать provide позже.

### 3. Как удалить или "отключить" значение, которое было предоставлено через provide?

Специального метода "unprovide" нет. Стандартный способ "отключить" значение — либо:

- передать через provide значение null или другое "пустое" значение
- ограничить время жизни компонента-поставщика (при его размонтировании контекст пропадет)

Если нужно условно предоставлять значение, вы можете управлять рендерингом компонента, который делает provide, через v-if.

### 4. Можно ли использовать provide/inject в логике вне компонентов, например, в отдельных модулях?

Нет, механизм привязан к контексту компонента и к его дереву. Вне компонента у Vue нет информации о текущем "иерархическом" контексте. Для логики вне компонентов (сервисы, утилиты) обычно используют:

- импорт модулей напрямую
- DI-контейнеры другого уровня
- глобальные store или фабрики

### 5. Как быть, если один и тот же компонент нужно использовать с разными контекстами?

Вам нужно, чтобы компонент умел:

- сначала смотреть в local provide/inject
- затем, если контекста нет, использовать пропсы или локальные дефолты

Практически это выглядит так:

```js
const context = inject(ContextKey, null)
// Если контекст есть — берем значения оттуда,
// иначе используем пропсы/дефолты
const size = context?.size ?? props.size ?? 'md'
```

Так компонент становится "гибридным" и может работать и внутри Provide/Inject-контекста, и отдельно.