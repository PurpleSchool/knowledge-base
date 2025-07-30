---
metaTitle: Гайд на checkbox компонент во Vue
metaDescription: Все про чекбокс компонент во Vue - от простых случаев до кастомных реализаций с примерами кода и управления состоянием
author: Алексей Ларионов
title: Гайд на checkbox компонент во Vue
preview: Глубокий разбор создания и использования checkbox компонентов во Vue с примерами синтаксиса, кастомизации и управлением состоянием
---

## Введение

Checkbox — один из самых распространённых UI-компонентов, который встречается практически в каждом веб-приложении. Его используют для выбора одного или нескольких элементов из списка, для включения или выключения опций и для многих других задач. Если вы работаете с Vue, очень важно знать, как использовать стандартный чекбокс, создавать свои компоненты на его основе, контролировать его состояние, стилизовать и интегрировать со сложными структурами данных.

В этой статье вы узнаете, как с нуля использовать чекбоксы во Vue, какие нюансы стоят за двусторонней привязкой, как реализовывать кастомные чекбоксы, решать типовые задачи работы с коллекциями и валидировать вводимые значения. Примеры и пояснения позволят вам почувствовать себя увереннее при работе с этим элементом управления в проектах любого масштаба.

## Основы чекбокс-компонента во Vue

### Базовый синтаксис

Чекбокс во Vue реализуется очень просто с помощью стандартного input с атрибутом `type="checkbox"`, а для связи состояния чекбокса с данными компонента используется директива `v-model`.

Пример базового чекбокса:

```js
<template>
  <input type="checkbox" v-model="checked" />
  <span>Чекбокс отмечен: {{ checked }}</span>
</template>

<script>
export default {
  data() {
    return {
      checked: false // Изначально не отмечен
    }
  }
}
</script>
```

Здесь мы связываем переменную checked с состоянием чекбокса.
Когда пользователь ставит или снимает галочку, значение checked меняется.

С помощью `v-model` вы легко добиваетесь двусторонней привязки состояния. Значение переменной автоматически обновляется, когда пользователь взаимодействует с чекбоксом.

Изучение checkbox компонента - важная часть разработки интерфейсов на Vue.js. Для разработки сложных приложений, необходимо освоить управление состоянием, маршрутизацию и другие продвинутые техники. Если вы хотите получить комплексные знания и навыки в разработке Vue-приложений, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=gajd-na-checkbox-komponent-vo-vue). На курсе 173 уроков и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Управление значением чекбокса

По умолчанию v-model связывает чекбокс с булевым значением. Но если стоит задача выбирать из списка сущностей или работать с массивами, это поведение можно конфигурировать.

#### Использование чекбокса для выбора из множества

Рассмотрим ситуацию, когда пользователь может выбрать несколько опций из списка:

```js
<template>
  <div>
    <label v-for="item in items" :key="item">
      <input type="checkbox" :value="item" v-model="selectedItems" />
      {{ item }}
    </label>
    <div>Вы выбрали: {{ selectedItems }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: ['Vue', 'React', 'Angular'], // Список технологий
      selectedItems: [] // Список выбранных значений
    }
  }
}
</script>
```

Здесь v-model связан с массивом selectedItems. При выборе чекбокса значение value (item) добавляется или удаляется из массива.

Такой подход часто используется при генерации чекбоксов по данным, например, для фильтров или мультиселекта.

#### Управление значениями через true-value и false-value

Vue позволяет указать пользователю какие значения будут записываться при установке или снятии галочки:

```js
<template>
  <input
    type="checkbox"
    v-model="status"
    true-value="yes"
    false-value="no"
  />
  <span>Статус: {{ status }}</span>
</template>

<script>
export default {
  data() {
    return {
      status: 'no' // Начальное значение
    }
  }
}
</script>
```

В данном случае, если чекбокс отмечен, в переменную status запишется "yes", если снят — "no".

### Однонаправленная и двусторонняя привязка

`v-model` по сути комбинирует передачу значения через `:checked` и обработчик событий `@change`. Вы можете реализовать такую связку и вручную, если это необходимо для особых кейсов.

```js
// Однонаправленная привязка через :checked
<template>
  <input
    type="checkbox"
    :checked="isChecked"
    @change="onChange"
  />
</template>

<script>
export default {
  props: ['isChecked'],
  methods: {
    onChange(e) {
      // Здесь вы, например, можете вызвать props или emit
      this.$emit('update:isChecked', e.target.checked)
    }
  }
}
</script>
```

Такой подход востребован при построении контролируемых компонентов.

### Validating чекбоксы во Vue

Если вам нужно, чтобы пользователь обязательно поставил галочку (например, при согласии с условиями), нужна простая валидация.

```js
<template>
  <form @submit.prevent="submit">
    <label>
      <input type="checkbox" v-model="agreed" />
      Я согласен с условиями
    </label>
    <div v-if="error" style="color: red">{{ error }}</div>
    <button type="submit">Отправить</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      agreed: false,
      error: null
    }
  },
  methods: {
    submit() {
      if (!this.agreed) {
        this.error = 'Вы должны согласиться с условиями'
      } else {
        this.error = null
        // Продолжить логику отправки
      }
    }
  }
}
</script>
```

Здесь при попытке отправить форму проверяем значение agreed. Если чекбокс не отмечен, показываем ошибку.

## Создание кастомного чекбокс компонента

Иногда стандартное оформление чекбокса вас не устраивает — например, нужно добавить иконку, стилизовать галочку или анимировать изменение состояния.

### Кастомизация с помощью scoped slots

Вот пример простого кастомного чекбокс-компонента:

```js
<template>
  <label class="custom-checkbox">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      style="display: none;"
    />
    <span class="checkbox-box" :class="{ checked: modelValue }"></span>
    <slot></slot>
  </label>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style>
.custom-checkbox {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid #007bff;
  border-radius: 4px;
  margin-right: 8px;
  transition: background 0.2s;
  background: #fff;
}
.checkbox-box.checked {
  background: #007bff;
  position: relative;
}
.checkbox-box.checked::after {
  content: '';
  display: block;
  width: 12px;
  height: 6px;
  border-left: 3px solid #fff;
  border-bottom: 3px solid #fff;
  position: absolute;
  left: 2px;
  top: 5px;
  transform: rotate(-45deg);
}
</style>
```

Вы скрываете стандартный input, а состояние чекбокса синхронизируется через проп modelValue и событие update:modelValue.
Подключать такой компонент можно с помощью v-model:

```js
<template>
  <CustomCheckbox v-model="checked">Я согласен с правилами</CustomCheckbox>
</template>
```

### Управление группой чекбоксов через компонент

Если нужно сделать компонент, который управляет группой чекбоксов, реализуется примерно следующее:

```js
<template>
  <div>
    <CustomCheckbox
      v-for="option in options"
      :key="option.value"
      :modelValue="selected.includes(option.value)"
      @update:modelValue="toggle(option.value, $event)"
    >
      {{ option.label }}
    </CustomCheckbox>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selected: [],
      options: [
        { value: 'apple', label: 'Яблоко' },
        { value: 'banana', label: 'Банан' },
        { value: 'pear', label: 'Груша' }
      ]
    }
  },
  methods: {
    toggle(value, checked) {
      if (checked && !this.selected.includes(value)) {
        this.selected.push(value)
      } else if (!checked && this.selected.includes(value)) {
        this.selected = this.selected.filter(v => v !== value)
      }
    }
  }
}
</script>
```

Обратите внимание, что массив выбранных значений обновляется методом toggle.

## Чекбоксы с формами и сложными структурами

Checkbox часто используется вместе с более сложными формами, где данные представлены объектами, массивами или даже вложенными структурами.

### Пример: чекбоксы и объекты

Бывает важно понимать, как чекбоксы работают с объектами вместо простых строковых/булевых значений.

```js
<template>
  <div>
    <label v-for="user in users" :key="user.id">
      <input
        type="checkbox"
        :value="user"
        v-model="selectedUsers"
      />
      {{ user.name }}
    </label>
    <div>
      Выбранные: {{ selectedNames }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: 'Иван' },
        { id: 2, name: 'Мария' }
      ],
      selectedUsers: []
    }
  },
  computed: {
    selectedNames() {
      return this.selectedUsers.map(u => u.name).join(', ')
    }
  }
}
</script>
```

В этом случае в массив selectedUsers будут добавляться ссылки на объекты пользователя, а не только их id или имена.

### Слежение за чекбоксами во вложенных структурах

Если возвращаются сложные формы, где каждая группа чекбоксов представлена вложенным объектом, рекомендуется управлять состоянием через иерархию ключей в стейте.

```js
<template>
  <div v-for="(group, groupName) in settings" :key="groupName">
    <h4>{{ groupName }}</h4>
    <label v-for="(checked, setting) in group" :key="setting">
      <input
        type="checkbox"
        :checked="checked"
        @change="toggleSetting(groupName, setting)"
      />
      {{ setting }}
    </label>
  </div>
</template>

<script>
export default {
  data() {
    return {
      settings: {
        Общие: { уведомления: true, подписка: false },
        Безопасность: { двухфакторная: false }
      }
    }
  },
  methods: {
    toggleSetting(group, setting) {
      this.settings[group][setting] = !this.settings[group][setting]
    }
  }
}
</script>
```

Здесь структура данных повторяет структуру чекбоксов, что делает синхронизацию очевидной и простой.

## Динамическая генерация чекбоксов и данные из API

Часто чекбокс группы генерируются на основании данных, получаемых из API. В этом случае все работает аналогично, просто данные приходят асинхронно.

```js
<template>
  <div>
    <label v-for="tag in tags" :key="tag.id">
      <input type="checkbox" :value="tag.id" v-model="selectedTags">
      {{ tag.name }}
    </label>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tags: [],
      selectedTags: []
    }
  },
  mounted() {
    // Например, симуляция загрузки данных с сервера
    setTimeout(() => {
      this.tags = [
        { id: 1, name: 'Javascript' },
        { id: 2, name: 'Vue.js' }
      ]
    }, 1000)
  }
}
</script>
```

Как видите, работа с асинхронными данными не отличается от статических случаев.

## Особенности стилизации и accessibility

### Стилизация

Системные чекбоксы часто выглядят по-разному в разных ОС и браузерах. Для унификации используют кастомные чекбоксы с элементом-обёрткой (span, div) и скрытым input.

```css
input[type="checkbox"] {
  display: none; /* Скрываем стандартный чекбокс */
}
.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid #000;
  display: inline-block;
  background: #fff;
  vertical-align: middle;
}
.custom-checkbox.checked {
  background: #2196F3;
}
```

Важно всегда следить за доступностью! Добавляйте лэйблы и используйте атрибуты aria-checked и tabindex для кастомных чекбоксов.

### Accessibility

Чтобы чекбоксы были доступны для экранных чтецов и клавиатуры, не забывайте:

- использовать `<label>` для связывания подписи и input;
- не скрывать полностью input (используйте `opacity: 0`, а не `display: none`);
- добавлять атрибут `aria-checked` и обрабатывать `keydown` для поддержки навигации с клавиатуры в кастомных компонентах.

## Интеграция с Vue Form Libraries

Если используется форма с библиотеками типа VeeValidate, vuelidate или FormKit, то чекбоксы подчиняются общим принципам работы с v-model, но следите за типом данных! Библиотека может ожидать булево значение или массив — смотрите документацию по API.

Пример использования VeeValidate:

```js
<template>
  <Form @submit="onSubmit">
    <Field
      type="checkbox"
      name="agree"
      :value="true"
      as="input"
      v-slot="{ field }"
    >
      <input v-bind="field" />
      Я принимаю условия
    </Field>
    <ErrorMessage name="agree" />
    <button type="submit">Отправить</button>
  </Form>
</template>
```

В этом примере Field управляет состоянием чекбокса и валидирует его.

## Заключение

Вы познакомились с чекбоксами во Vue с разных сторон: от базового синтаксиса и работы с простыми значениями до управления массивами и объектами, создания кастомных компонентов и интеграции с формочными библиотеками. Вы знаете, как реализовать как булевые чекбоксы, так и чекбоксы для коллекций, а также стилизовать их без ущерба для доступности.

Работа с checkbox компонентом - это только часть разработки сложных веб-приложений. Чтобы создавать полноценные приложения, необходимо понимать, как устроена маршрутизация, как управлять состоянием приложения и как взаимодействовать с сервером. Все эти аспекты подробно рассматриваются на нашем курсе [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=gajd-na-checkbox-komponent-vo-vue). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue прямо сегодня.

## Частозадаваемые технические вопросы по теме и ответы

### Как сбросить все чекбоксы сразу?

Для сброса всех чекбоксов просто очистите массив или установите булевы значения снова в false. Например:
```js
this.selectedItems = []
// или для булевых:
// this.checked = false
```

### Как сделать чекбокс только для чтения (read-only)?

Стандартный чекбокс не поддерживает атрибут readonly, используйте `disabled`:
```js
<input type="checkbox" v-model="value" disabled>
```
Если нужен read-only без стилистического эффекта disabled, добавьте кастомную обработку клика:
```js
<input type="checkbox" :checked="value" @change.prevent>
```

### Как синхронизировать несколько чекбоксов на разных компонентах?

Используйте переменную состояния в родительском компоненте и передавайте в дочерние через props/v-model, либо работайте через Vuex/pinia для глобального состояния.

### Как правильно работать с чекбоксом внутри v-for с объектами?

Лучше явно указывать ключи и связывать value с уникальным идентификатором:
```js
<input type="checkbox" :value="item.id" v-model="selectedIds" />
```
Так вы избежите багов при работе с объектами (сравнения по ссылке).

### Как сделать индикатор промежуточного состояния (indeterminate)?

У input[type="checkbox"] есть свойство indeterminate:
```js
<input
  type="checkbox"
  ref="myCheckbox"
  v-model="checked"
/>
```
В mounted/updated:
```js
this.$refs.myCheckbox.indeterminate = true
```
Indeterminate состояние нельзя поставить через v-model, его надо задавать вручную через реф.
