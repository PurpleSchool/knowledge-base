---
metaTitle: Создание и использование UI Kit для Vue приложений
metaDescription: Руководство по созданию и использованию UI Kit для Vue - структурирование компонентов, стандартизация интерфейса, внедрение и настройка, примеры и лучшие практики
author: Олег Марков
title: Создание и использование UI Kit для Vue приложений
preview: Узнайте, как создавать и внедрять UI Kit для Vue - как проектировать и стандартизировать компоненты, подключать их повторно и ускорять разработку интерфейса
---

## Введение

UI Kit — это набор переиспользуемых компонентов пользовательского интерфейса, который помогает быстро и последовательно создавать интерфейсы приложений. Такой подход особенно популярен в разработке крупных Vue приложений, где важна стандартизация внешнего вида и логики элементов интерфейса. Хорошо спроектированный UI Kit облегчает понимание кода, позволяет команде работать быстрее и уменьшает вероятность появления ошибок, связанных с несовпадением интерфейсов.

Вы узнаете, как спроектировать, реализовать и интегрировать UI Kit в свой Vue проект, чтобы облегчить себе жизнь при построении однородных и красивых интерфейсов.

## Что такое UI Kit и зачем он нужен

На базовом уровне UI Kit для Vue — это коллекция Vue компонентов вроде кнопок, форм, модальных окон, карточек и прочих элементов, которые визуализируют ваши идеи во всех частях приложения. Их можно собирать либо с нуля, либо использовать сторонние библиотеки и подгонять под собственный стиль.

Вот ключевые преимущества использования собственного UI Kit:
- **Консистентность визуального стиля** приложения.
- **Быстрота разработки** — перестают создаваться одинаковые компоненты повторно.
- **Легкость сопровождения и масштабирования**.
- **Возможность кастомизации** под задачи вашего бизнеса.
- **Упрощение тестирования** за счёт изоляции компонентов.

UI Kit особенно полезен, если вы работаете в команде: этим вы буквально «договоритесь на берегу», как должны выглядеть и работать кнопки, поля ввода или, например, алерты на всех экранах.

Создание собственного UI Kit позволяет унифицировать стиль и структуру компонентов, значительно ускоряя разработку и упрощая поддержку Vue приложений.  Однако, чтобы UI Kit действительно приносил пользу, необходимо тщательно продумать его архитектуру, стандартизировать компоненты и внедрить лучшие практики. Если вы хотите детально изучить все этапы создания и использования UI Kit для Vue, включая структурирование компонентов, стандартизацию интерфейса и внедрение лучших практик — приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-i-ispolzovanie-ui-kit-dlya-vue-prilozheniy). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Как структурировать UI Kit

### Организация файлов и папок

Обычно UI Kit располагается в отдельной директории src/components/ui или src/ui-kit, чтобы вы могли легко импортировать компоненты в любом месте проекта.

```
src/
  components/
    ui/
      Button.vue
      Input.vue
      Modal.vue
      Card.vue
      ...
  App.vue
  main.js
```

Можно сделать отдельный модуль внутри монорепозитория, или даже вынести UI Kit в npm-пакет, если нужно использовать один и тот же набор компонентов в нескольких проектах.

### Виды компонентов

Разделите компоненты на простые (атомы: Button, Input) и сложные (молекулы: Form, Modal с вложенными кнопками и инпутами, и т.д). Такой подход называется Atomic Design.

#### Пример структуры Atomic Design:

```
src/
  ui/
    atoms/
      Button.vue
      Input.vue
    molecules/
      FormGroup.vue
      Modal.vue
    organisms/
      AppHeader.vue
      AppFooter.vue
```

## Базовые компоненты UI Kit для Vue

### Пример кнопки — Button.vue

Смотрите, я покажу вам, как может выглядеть базовая кнопка. Код станет унифицированной точкой входа для всех кнопок в вашем проекте.

```js
<template>
  <button
    :class="['ui-btn', variantClass, { 'ui-btn--disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'UiButton',
  props: {
    variant: {
      type: String,
      default: 'primary', // primary, secondary, danger...
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    variantClass() {
      // Сгенерим CSS класс для разных видов кнопок
      return `ui-btn--${this.variant}`;
    },
  },
  methods: {
    handleClick(event) {
      // Дополнительная обработка, если кнопка не отключена
      if (!this.disabled) this.$emit('click', event);
    },
  },
};
</script>

<style scoped>
.ui-btn { /* Базовый стиль */ }
.ui-btn--primary { background: #1976d2; color: white; }
.ui-btn--secondary { background: #eee; color: #1976d2; }
.ui-btn--danger { background: #c00; color: white; }
.ui-btn--disabled { opacity: 0.5; cursor: not-allowed; }
</style>
```

Обратите внимание — весь кастомный код и оформление завязаны на пропсы. Такой подход позволяет интегрировать кнопку в любое окружение: вы управляете типом кнопки через параметр variant и её состоянием через disabled.

### Пример поля ввода — Input.vue

Теперь давайте посмотрим, как вынести обычное поле ввода в отдельный компонент, пригодный для любого места в вашем проекте.

```js
<template>
  <div class="ui-input-group">
    <input
      :type="type"
      :value="value"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="$emit('input', $event.target.value)"
      class="ui-input"
    />
    <span v-if="error" class="ui-input-error">{{ error }}</span>
  </div>
</template>

<script>
export default {
  name: 'UiInput',
  props: {
    value: String,
    type: {
      type: String,
      default: 'text',
    },
    placeholder: String,
    disabled: Boolean,
    error: String,
  },
};
</script>

<style scoped>
.ui-input-group { margin-bottom: 16px; }
.ui-input { border: 1px solid #ccc; padding: 8px; border-radius: 4px; }
.ui-input-error { color: #c00; font-size: 12px; }
</style>
```

Здесь добавлен обработчик событий `@input`, чтобы родитель мог слушать изменения значения поля. Пропсы error, disabled и placeholder позволяют контролировать внешний вид компонента.

### Модальные окна — Modal.vue

Часто вам понадобится всплывающий слой для подтверждений или редактирования данных. Давайте разберём пример простого модального окна:

```js
<template>
  <div class="ui-modal" v-if="visible">
    <div class="ui-modal__backdrop" @click="close" />
    <div class="ui-modal__content">
      <button class="ui-modal__close" @click="close">×</button>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'UiModal',
  props: {
    visible: Boolean, // Управлять модальным окном должен родитель
  },
  methods: {
    close() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.ui-modal { position: fixed; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center;}
.ui-modal__backdrop { position:absolute; z-index:0; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.3);}
.ui-modal__content { position:relative; z-index:1; background:#fff; padding:24px; border-radius:8px; min-width:320px;}
.ui-modal__close { position:absolute; top:8px; right:8px; background:none; border:none; font-size:24px; cursor:pointer;}
</style>
```

Модалка принимает пропс `visible`, на саму модалку можно повесить v-if или v-show на уровне родителя. Событие `close` поможет вам управлять её видимостью.

## Организация темы и стилей в UI Kit

### Базовые переменные и тема

Сделайте единый файл с переменными для цветов, отступов, размеров шрифтов — так проще поддерживать тему. Обычно заведите отдельный файл, например, `src/styles/_variables.scss` (или просто css variables):

```scss
// _variables.scss
$primary-color: #1976d2;
$danger-color: #e53935;
$success-color: #43a047;
$font-base: "Roboto", Arial, sans-serif;

// Можно добавить миксины для отступов, радиусов и т.п.
```

В CSS появилось много поддержки нативных переменных, так что вы можете делать так:

```css
:root {
  --color-primary: #1976d2;
  --color-danger: #e53935;
  --border-radius: 4px;
}
```

### Интеграция стилей в компоненты

Импортируйте общий файл со стилями в main.js или в основной SCSS через @import. Тогда UI компоненты будут «знать» о глобальной теме.

```javascript
// main.js
import './styles/main.scss';
```

## Расширяемость и кастомизация UI Kit

### Использование слотов для расширения

Почти в каждом компоненте предусмотрите `<slot>`, чтобы пользователь мог вставлять свой контент.

#### Пример расширенного использования слотов:

```js
<UiButton>
  <span>
    <IconCheck /> Сохранить
  </span>
</UiButton>
```

### Передача дополнительных атрибутов и событий

Добавьте поддержку v-bind="$attrs" и inheritAttrs: false, чтобы родительские элементы могли пробрасывать произвольные props.

```js
<template>
  <button
    :class="['ui-btn']"
    v-bind="$attrs" // пробрасываем все неизвестные атрибуты
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script>
export default {
  inheritAttrs: false,
  methods: {
    onClick(event) {
      this.$emit('click', event);
    },
  },
};
</script>
```

### Автоматическая регистрация компонентов UI Kit

Чтобы не импортировать каждый компонент по отдельности, делается плагин:

```javascript
// src/ui-kit/index.js
import UiButton from './Button.vue';
import UiInput from './Input.vue';
// ...другие импорты

const components = { UiButton, UiInput /* ... */ };

export default {
  install(Vue) {
    for (const name in components) {
      Vue.component(name, components[name]);
    }
  },
};
```

Теперь всего один импорт в main.js:

```javascript
import Vue from 'vue';
import UiKit from './ui-kit';

Vue.use(UiKit);
```

## Интеграция UI Kit в проект

### Импорт и регистрация компонентов

Используйте UI Kit в любом месте приложения:

```js
<template>
  <UiButton
    variant="danger"
    @click="handleDelete"
  >
    Удалить
  </UiButton>
</template>
```

### Настройка темизации или сброса тем

Для поддержки разных тем предусмотрите динамические переменные. Например, через provide/inject или через библиотеку Vuex/Pinia можно хранить текущую тему, а затем менять CSS переменные на лету.

```javascript
// Пример: смена темы через JS
document.documentElement.style.setProperty('--color-primary', '#8e24aa');
```

### Организация документации UI Kit

Обязательно составьте или сгенерируйте живую документацию для компонентов UI Kit, используя Storybook, Styleguidist или MDX-файлы. Это покажет ваш набор компонентов в изоляции и позволит другим разработчикам учиться на примерах.

## Покрытие тестами

UI Kit рекомендуется покрывать юнит-тестами (например, с помощью Jest + Vue Test Utils). Это позволяет уверенно вносить изменения, не опасаясь поломки визуальной части.

```javascript
import { mount } from '@vue/test-utils';
import UiButton from '@/components/ui/Button.vue';

test('Рендер кнопки и обработка клика', async () => {
  const wrapper = mount(UiButton, {
    slots: { default: 'Текст' },
  });

  // Проверим содержимое
  expect(wrapper.text()).toBe('Текст');

  // Проверим emit события
  await wrapper.trigger('click');
  expect(wrapper.emitted().click).toHaveLength(1);
});
```

## Работа с внешними UI Kit

Иногда нет времени делать свой набор с нуля, используйте готовые UI Kit: Vuetify, Element UI, Quasar, Ant Design Vue и другие. Но будьте готовы к кастомизации их переменных, чтобы адаптировать под свою айдентику.

## Вывод

UI Kit делает ваш проект структурированным, ускоряет и стандартизирует разработку, облегчает внедрение новых фич. Подход с отделением компонентов в UI Kit применим практически в любом профессиональном Vue проекте. Старайтесь не дублировать код, придумывайте стандарт для своих компонентов и не забывайте про тесты и документацию.

UI Kit - это только один из аспектов разработки качественных Vue приложений. Не менее важно уметь эффективно управлять состоянием, настраивать маршрутизацию и использовать другие возможности фреймворка.  Углубите свои знания о Vue и создавайте сложные веб-приложения на курсе [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=sozdanie-i-ispolzovanie-ui-kit-dlya-vue-prilozheniy). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue прямо сейчас.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**Вопрос 1: Как реализовать автотесты для UI компонентов, использующих slot?**

Чтобы тестировать компоненты с slot, монтируйте их в тесте с нужным контентом:
```javascript
const wrapper = mount(UiButton, { slots: { default: '<span>ОК</span>' } });
expect(wrapper.text()).toBe('ОК');
```
Так вы проверите и рендер содержимого внутри слота.

**Вопрос 2: Как сделать так, чтобы компоненты UI Kit были доступны во всех дочерних компонентах без лишнего импорта?**

Используйте глобальную регистрацию через плагин (см. пример выше с install). Это избавит от ручного импорта каждого компонента в каждом месте проекта.

**Вопрос 3: Как добавить поддержку i18n (локализации) в компоненты UI Kit?**

Импортируйте экземпляр вашего i18n и используйте его внутри компонентов:
```javascript
// В компоненте
{{ $t('ui.button.ok') }}
```
Передавайте текстовые ключи через prop или slot и обрабатывайте их через $t для поддержки всех языков.

**Вопрос 4: Как сделать, чтобы UI Kit работал и с TypeScript?**

Все компоненты пишите с использованием defineComponent, используйте типизацию props и events через types из vue и дополняйте d.ts-файлы для экспорта интерфейсов.

**Вопрос 5: Как настроить tree-shaking для большого UI Kit, чтобы подключать только нужные компоненты?**

Экспортируйте каждый компонент как отдельный модуль, позволяя импортировать их поштучно:
```javascript
import UiButton from 'my-ui-kit/Button.vue'
```
Также используйте ES-модули для сборки пакета, чтобы ваши бандлеры могли удалять неиспользуемые части и экономить размер фронта.
