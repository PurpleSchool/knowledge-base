---
metaTitle: Создание и управление формами в Vue
metaDescription: Познакомьтесь с возможностями создания и управления формами в Vue - от простой привязки до сложной валидации с примерами и объяснениями
author: Олег Марков
title: Создание и управление формами в Vue
preview: Научитесь создавать и управлять формами в Vue - от базовой привязки данных до динамического управления и продвинутой валидации с подробными примерами
---

## Введение

Создание и управление формами — одна из ключевых задач во фронтенд-разработке. Во Vue работа с формами строится на мощных механизмах привязки данных, реактивности и удобных директивах. Даже если у вас нет опыта с Vue, вы быстро поймете, как связать ваши поля ввода с переменными приложения, обрабатывать события ввода, валидировать данные и реагировать на пользовательские действия.

Здесь вы узнаете, как создавать простые и сложные формы, реализовывать двухстороннюю привязку (`v-model`), управлять состояниями полей, обрабатывать отправку формы и строить свою валидацию или использовать готовые решения.

---

## Базовые принципы работы с формами в Vue

### Двусторонняя привязка с помощью v-model

Одной из особенностей Vue является директива `v-model`, которая обеспечивает двухстороннюю синхронизацию данных между представлением и состоянием приложения.

Давайте разберем на простом примере:

```vue
<template>
  <div>
    <input v-model="userName" placeholder="Введите ваше имя" />
    <p>Ваше имя: {{ userName }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userName: ''
    }
  }
}
</script>
```

// Здесь изменяя содержимое поля input, вы сразу же увидите изменения в переменной userName и наоборот.

Vue поддерживает `v-model` для большинства стандартных элементов формы:

- `<input>` (type="text", "password", "email" и т.д.)
- `<textarea>`
- `<select>`

### Привязка к различным типам input

#### Текстовые поля

```vue
<input v-model="textValue" type="text" />
```

#### Чекбоксы

```vue
<input type="checkbox" v-model="checked" />

// Если вам нужно массив значений:

<input type="checkbox" v-model="checkedItems" value="option1">
<input type="checkbox" v-model="checkedItems" value="option2">
```

#### Радиокнопки

```vue
<input type="radio" v-model="picked" value="A" />
<input type="radio" v-model="picked" value="B" />
```

#### Селекты

```vue
<select v-model="selected">
  <option disabled value="">Пожалуйста, выберите</option>
  <option value="one">Один</option>
  <option value="two">Два</option>
</select>
```

#### Множественный выбор

```vue
<select v-model="selectedOptions" multiple>
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

// Обратите внимание, что при multiple получаете массив в selectedOptions.

### Синтаксис v-model: сокращения и modifiers

У `v-model` есть модификаторы, которые помогают управлять обработкой ввода:

- `.lazy` — обновляет значение не сразу при вводе, а когда событие change.
- `.number` — автоматически преобразует введенное значение в число.
- `.trim` — убирает пробелы по краям строки.

Пример:

```vue
<input v-model.lazy="age" type="number" />
<input v-model.number="age" type="number" />
<input v-model.trim="name" />
```

// Используйте эти модификаторы, когда важно контролировать тип данных и момент их обновления.

---

## Управление состоянием и структурами данных формы

### Управление несколькими полями

Если у вас сложная форма, удобно описывать ее как объект:

```vue
data() {
  return {
    form: {
      name: '',
      email: '',
      agreeRules: false
    }
  }
}
```

И тогда, например, поля формы можно связать так:

```vue
<input v-model="form.name" placeholder="Имя" />
<input v-model="form.email" placeholder="Email" />
<input type="checkbox" v-model="form.agreeRules" /> Я принимаю правила
```

### Динамические формы

Иногда количество полей заранее неизвестно. Например, список контактов, который пользователь может дополнять.

```vue
<template>
  <div>
    <div v-for="(contact, index) in contacts" :key="index">
      <input v-model="contact.value" placeholder="Контакт" />
      <button @click="removeContact(index)">Удалить</button>
    </div>
    <button @click="addContact">Добавить контакт</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      contacts: [ { value: '' } ]
    }
  },
  methods: {
    addContact() {
      this.contacts.push({ value: '' })
    },
    removeContact(index) {
      this.contacts.splice(index, 1)
    }
  }
}
</script>
```

// Здесь вы можете динамически добавлять и удалять поля формы.

---

## Обработка событий формы

### Получение данных при отправке формы

Используйте событие submit на форме, чтобы обрабатывать отправку:

```vue
<template>
  <form @submit.prevent="submitForm">
    <input v-model="formData.name" required />
    <input v-model="formData.email" required />
    <button type="submit">Отправить</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        email: ''
      }
    }
  },
  methods: {
    submitForm() {
      // Здесь вы получаете доступ к formData с введенными значениями
      console.log('Форма отправлена', this.formData)
      // Можно отправить данные на сервер или сделать другую обработку
    }
  }
}
</script>
```

// .prevent предотвращает стандартное поведение браузера (перезагрузку страницы).

### Валидация обязательных полей

Чтобы проверить корректность данных ввода, можно добавить простую проверку прямо в метод отправки:

```vue
methods: {
  submitForm() {
    if (!this.formData.name || !this.formData.email) {
      alert('Заполните все поля!');
      return;
    }
    // Дальнейшая обработка
  }
}
```

// Этот подход подойдет для простейшей валидации.

---

## Валидация данных: подходы и инструменты

### Ручная валидация

Для простых проверок пишите проверки внутри методов, используемых для обработки формы.

```vue
methods: {
  submitForm() {
    if (!this.formData.email.includes('@')) {
      this.errors.email = 'Некорректный email';
      return;
    }
  }
}
```

### Динамическое отображение ошибок

Добавьте переменную `errors` в состояние формы, чтобы показывать пользователю сообщения об ошибках:

```vue
data() {
  return {
    formData: { name: '', email: '' },
    errors: {}
  }
},
methods: {
  submitForm() {
    this.errors = {};
    if (!this.formData.name) this.errors.name = "Имя обязательно";
    if (!this.formData.email) this.errors.email = "Email обязателен";
    else if (!this.formData.email.includes('@')) this.errors.email = "Email некорректен";
    if (Object.keys(this.errors).length > 0) return;
    // Отправить форму
  }
}
```

А для вывода в шаблоне:

```vue
<input v-model="formData.name" />
<span v-if="errors.name">{{ errors.name }}</span>
```

### Использование готовых решений (vee-validate, vuelidate и др.)

Для более сложной логики и минимизации "ручной работы" рекомендуют использовать сторонние библиотеки валидации.

#### vee-validate

Vee-validate — самая популярная библиотека валидации для Vue. Она отлично интегрируется с `v-model` и поддерживает шаблонную и программную работу с ошибками.

Установка (npm):

```
npm install vee-validate yup
```

Пример использования (Vue 3):

```vue
<script setup>
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

const { handleSubmit, errors } = useForm({
  validationSchema: yup.object({
    email: yup.string().email().required(),
    password: yup.string().min(6).required()
  })
})

const { value: email } = useField('email')
const { value: password } = useField('password')

const onSubmit = handleSubmit(values => {
  // Значения, прошедшие валидацию, доступны в values
  console.log(values)
})
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" placeholder="Email" />
    <span>{{ errors.email }}</span>
    <input v-model="password" type="password" placeholder="Пароль" />
    <span>{{ errors.password }}</span>
    <button type="submit">Войти</button>
  </form>
</template>
```

#### vuelidate

Vuelidate — гибкая альтернатива для декларативного описания правил:

```
npm install @vuelidate/core @vuelidate/validators
```

В примерах документации показано, как легко создавать сложную логику без шаблонных проверок.

---

## Продвинутые возможности форм в Vue

### Кастомные компоненты формы с поддержкой v-model

Вы можете реализовать свои компоненты полей, которые будут так же удобно интегрироваться с v-model.

```vue
// CustomInput.vue
<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script>
export default {
  props: ['modelValue']
}
</script>
```

// Теперь этим компонентом можно пользоваться с v-model:

```vue
<custom-input v-model="formData.name" />
```

### Управление фокусом и доступностью

Vue легко комбинируется с нативными возможностями DOM. Например, можно программно фокусировать элемент:

```vue
<template>
  <input ref="emailInput" v-model="email" />
  <button @click="focusEmail">Фокус на email</button>
</template>

<script>
export default {
  data() { return { email: '' }},
  methods: {
    focusEmail() {
      this.$refs.emailInput.focus()
    }
  }
}
</script>
```

// Вы можете улучшать доступность формы: использовать вопросы, aria-метки, роли.

### Моментальная и отложенная валидация

Часто важно показывать ошибки либо сразу при вводе, либо только по попытке отправки.

Это можно гибко настраивать:

```vue
// Внести флаг, был ли уже клик "submit"
data() {
  return {
    triedSubmit: false,
    formData: { ... },
    errors: {}
  }
}
...
methods: {
  onInput() {
    if (this.triedSubmit) this.validateFields();
  },
  submitForm() {
    this.triedSubmit = true;
    this.validateFields();
    if (Object.keys(this.errors).length > 0) return; // Не отправлять если есть ошибки
    // отправить
  },
  validateFields() {
    // валидация как раньше
  }
}
```

// Это позволит управлять моментом показа ошибок.

### Асинхронная валидация

Если нужно валидировать поле по данным с сервера (например, имя пользователя уже занято):

```vue
methods: {
  async validateUsername() {
    let response = await fetch(`/api/check-username?name=${this.formData.username}`);
    let data = await response.json();
    this.errors.username = data.exists ? "Имя занято" : "";
  }
}
```

// Обычно асинхронные проверки делают при блюре поля (аналог change/input).

---

## Работа с формами во Vue 3 Composition API

Vue 3 предлагает новый синтаксис работы с состоянием — Composition API. Управление формой реализуется во многом схоже, но с использованием `ref` и `reactive`:

```vue
<script setup>
import { ref, reactive } from 'vue';

const name = ref('')
const form = reactive({
  email: '',
  agree: false
})

function submit() {
  // Используйте form.email, name.value и др.
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="name" />
    <input v-model="form.email" />
    <input type="checkbox" v-model="form.agree" />
    <button type="submit">OK</button>
  </form>
</template>
```

// Работа с формами в Composition API может быть гибкой и лаконичной.

---

## Заключение

Во Vue формы реализуются просто и гибко за счет реактивности, двухсторонней привязки и мощных инструментов управления данными. Даже базовые возможности позволяют создавать современные формы с валидацией, обработкой событий и кастомными полями. Для сложных задач вы можете использовать сторонние библиотеки, интегрировать асинхронные проверки и динамически менять структуру формы. Vue одинаково хорошо поддерживает как декларативную, так и программную работу с формами, что делает фреймворк удобным для построения интерфейсов любой сложности.

---

## Частозадаваемые технические вопросы

### Как сбросить поля формы в начальное состояние?

Добавьте кнопку, вызывающую метод, который присваивает исходные значения объекту данных, связанному с формой:

```js
resetForm() {
  this.form = { name: '', email: '', agreeRules: false }
}
```

### Как валидировать числовые поля или даты?

Используйте модификатор `.number` на v-model для чисел и отдельные библиотеки (например, date-fns, dayjs) либо встроенные проверки для даты:

```vue
<input v-model.number="form.age" type="number" />
// Проверяйте: Number.isFinite(form.age)
```

### Как получить доступ к значениям формы через ref?

В Vue 3 используйте ref к форме:

```vue
<template>
  <form ref="myFormRef" ...>
</template>
<script setup>
import { ref } from 'vue';
const myFormRef = ref(null)
// myFormRef.value.elements обращение к элементам формы
</script>
```

### Как валидировать каждое изменение (реализация onBlur/onInput)?

Используйте события input или blur для вызова метода проверки:

```vue
<input v-model="field" @blur="validateOnBlur" @input="validateOnInput" />
```

### Как сделать автосохранение значений формы?

Следите за объектом формы с помощью watch, и при каждом изменении отправляйте значения:

```js
watch: {
  form: {
    handler(newVal) {
      // отправить newVal на сервер или в localStorage
    },
    deep: true
  }
}
```
