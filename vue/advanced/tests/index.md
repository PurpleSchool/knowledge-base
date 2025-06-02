---
metaTitle: Тестирование компонентов и приложений на Vue
metaDescription: Подробная статья о том- как тестировать компоненты и приложения на Vue- включая инструменты- подходы и примеры с кодом
author: Олег Марков
title: Тестирование компонентов и приложений на Vue
preview: Научитесь тестировать Vue компоненты и приложения- разберитесь с видами тестов- настройте среду и овладейте лучшими практиками на реальных примерах
---

## Введение

Тестирование — неотъемлемая часть современного JavaScript-разработки, и для проектов на Vue.js оно особенно важно. Вам нужно убедиться, что компоненты работают корректно, приложение надежно, а баги обнаруживаются вовремя. Сегодня мы разберёмся, как тестировать UI-компоненты и бизнес-логику во Vue-проектах. Я расскажу вам, какие существуют типы тестов, какие инструменты стоит выбрать, как писать простые и сложные тесты с примерами и пояснениями.

Из этой статьи вы узнаете:

- Какие виды тестирования применяются к Vue-компонентам;
- Как настроить среду для тестирования;
- Какие инструменты и библиотеки используются;
- Как писать юнит-тесты, интеграционные и end-to-end тесты для Vue-приложений;
- Лучшие практики и полезные советы.

---

## Классификация тестирования во Vue

Перед тем как писать тесты, давайте разберёмся, какие основные виды тестирования вы встретите.

### Юнит-тесты

Здесь мы проверяем отдельные компоненты или функции. Такой тест охватывает один компонент — без взаимодействий с внешними зависимостями.

- Например, вы хотите протестировать работу метода в компоненте или реакцию на изменение props.

### Интеграционные тесты

Эти тесты проверяют взаимодействие нескольких компонентов или модулей. Например:

- Отображение родительского компонента вместе с дочерними;
- Проверка правильной передачи данных между компонентами.

### E2E (End-to-End) тесты

На этом уровне вы эмулируете поведение реального пользователя: клики, ввод текста, переходы по страницам. Обычно запускаются в браузере или эмуляторе.

- Например, вы хотите убедиться, что пользователь успешно проходит сценарий регистрации.

---

## Настройка среды тестирования Vue

Давайте настроим всё необходимое, чтобы ваши тесты работали гладко.

### Установка необходимых библиотек

#### Vue Test Utils

Это официальная библиотека для тестирования компонентов Vue на уровне юнитов и интеграции. Она позволяет монтировать компонент, симулировать ввод, инициировать события.

```bash
npm install --save-dev @vue/test-utils
```

#### Jest

Самый популярный тестовый раннер и фреймворк для Vue, поддерживает быстрый запуск тестов, снапшот-тестирование, мокинг. Устанавливается так:

```bash
npm install --save-dev jest vue-jest babel-jest
```

#### Дополнительно: тестирование UI

Для E2E-тестов чаще всего используют [Cypress](https://www.cypress.io/) или [Playwright](https://playwright.dev/). Установка Cypress:

```bash
npm install --save-dev cypress
```

### Базовая конфигурация Jest для Vue

После установки создайте файл `jest.config.js`:

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': 'vue-jest',   // Преобразует .vue файлы для Jest
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'], // Путь к тестам
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

---

## Юнит-тесты компонентов Vue

Давайте разберёмся, как тестировать отдельные компоненты на практике.

### Структура юнит-теста

1. Подготовка: импортируйте компонент и утилиты тестирования;
2. Монтирование компонента;
3. Имитация пользовательских действий (клик, ввод);
4. Проверка изменений (в DOM, состоянии, событиях).

### Пример юнит-теста кнопки

Давайте тестировать простой компонент кнопки:

```vue
<!-- ButtonCounter.vue -->
<template>
  <button @click="increment">{{ count }}</button>
</template>

<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>
```

А теперь сам тест:

```js
// ButtonCounter.spec.js
import { mount } from '@vue/test-utils'
import ButtonCounter from '@/components/ButtonCounter.vue'

test('увеличивает счетчик при клике', async () => {
  const wrapper = mount(ButtonCounter)
  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toBe('1')
})
```

- `mount()` монтирует компонент изолированно для тестирования.
- `trigger('click')` симулирует клик.
- `expect(wrapper.text()).toBe('1')` — проверяет, что после клика счетчик обновился.

### Пример теста с props и событиями

Предположим у нас есть компонент:

```vue
<!-- HelloUser.vue -->
<template>
  <div>
    <span>Привет, {{ name }}!</span>
    <button @click="$emit('logout')">Выйти</button>
  </div>
</template>

<script>
export default {
  props: ['name']
}
</script>
```

Тестируем:

```js
// HelloUser.spec.js
import { mount } from '@vue/test-utils'
import HelloUser from '@/components/HelloUser.vue'

test('отображает имя и триггерит событие выхода', async () => {
  const wrapper = mount(HelloUser, {
    props: { name: 'Анна' }
  })

  expect(wrapper.text()).toContain('Анна')
  await wrapper.find('button').trigger('click')
  expect(wrapper.emitted().logout).toBeTruthy() // Событие "logout" было вызвано
})
```

---

## Интеграционные тесты Vue-компонентов

Здесь мы покрываем связки из нескольких компонентов или работу с хранилищем.

### Пример тестирования родителя и детей

Допустим, есть такой родительский компонент:

```vue
<!-- TodoList.vue -->
<template>
  <ul>
    <TodoItem v-for="item in items" :key="item.id" :text="item.text" @remove="removeItem(item.id)" />
  </ul>
</template>

<script>
import TodoItem from './TodoItem.vue'

export default {
  components: { TodoItem },
  props: ['items'],
  methods: {
    removeItem(id) {
      this.$emit('item-removed', id)
    }
  }
}
</script>
```

И дочерний компонент:

```vue
<!-- TodoItem.vue -->
<template>
  <li>
    {{ text }}
    <button @click="$emit('remove')">Удалить</button>
  </li>
</template>

<script>
export default {
  props: ['text']
}
</script>
```

Тестируем, что удаление задача работает от события дочернего:

```js
// TodoList.spec.js
import { mount } from '@vue/test-utils'
import TodoList from '@/components/TodoList.vue'

test('удаляет элемент списка при клике на дочерней кнопке', async () => {
  const items = [
    { id: 1, text: 'Посуду помыть' },
    { id: 2, text: 'Выбросить мусор' }
  ]
  const wrapper = mount(TodoList, { props: { items } })
  // Находим вторую кнопку "Удалить" и кликаем
  await wrapper.findAll('button')[1].trigger('click')
  // Проверяем, что emit был вызван с id=2
  expect(wrapper.emitted('item-removed')[0]).toEqual([2])
})
```

---

## Тестирование работы со Vuex

Если в проекте используется глобальное хранилище, тестировать компоненты стоит не напрямую через стор, а с помощью моков.

Смотрите, как это реализовано:

```js
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import MyComponent from '@/components/MyComponent.vue'

const store = createStore({
  state() {
    return { count: 100 }
  },
  getters: {
    getCount: (state) => state.count
  }
})

test('отображает значение из Vuex', () => {
  const wrapper = shallowMount(MyComponent, {
    global: {
      plugins: [store] // Передаем store в компонент
    }
  })
  // Проверяем, что компонент вывел нужное значение
  expect(wrapper.text()).toContain('100')
})
```

---

## Тестирование асинхронных данных

Часто компоненты работают с асинхронными запросами (fetch, axios). Используйте мок для HTTP-запросов.

#### Пример: мок axios и проверка загрузки данных

```js
import { mount } from '@vue/test-utils'
import axios from 'axios'
import UsersList from '@/components/UsersList.vue'

jest.mock('axios') // Мокаем весь модуль axios

test('выводит список пользователей после подгрузки', async () => {
  // Мокаем ответ сервера
  axios.get.mockResolvedValue({
    data: [{ id: 1, name: 'Олег' }, { id: 2, name: 'Аня' }]
  })

  const wrapper = mount(UsersList)
  // Ждем окончания всех промисов
  await wrapper.vm.$nextTick()

  // Проверяем рендер результата
  expect(wrapper.text()).toContain('Олег')
  expect(wrapper.text()).toContain('Аня')
})
```

---

## Работа с снапшот-тестами Vue

Jest позволяет делать снапшоты — "замороженные" снимки вывода компонента.

```js
import { mount } from '@vue/test-utils'
import ButtonCounter from '@/components/ButtonCounter.vue'

test('вывод соответствует ожиданиям (snapshot)', () => {
  const wrapper = mount(ButtonCounter)
  expect(wrapper.html()).toMatchSnapshot()
})
```

Если через время ваш верстка изменится, тест упадет, подсказывая, что вывод компонента изменился — это помогает предотвращать неожиданные визуальные баги.

---

## E2E-тесты для Vue — практический пример

Такие тесты запускаются в настоящем браузере и проходят полный сценарий пользователя.

### Как устроены E2E-тесты с Cypress

1. Запуск dev-сервера (npm run serve)
2. Описываем сценарий пользователя:

```js
// cypress/integration/login.spec.js
describe('Страница входа', () => {
  it('логинится с валидными данными', () => {
    cy.visit('/login') // Переходим по адресу
    cy.get('input[name=email]').type('user@mail.com') // Вводим данные
    cy.get('input[name=password]').type('123456')
    cy.get('button[type=submit]').click() // Кликаем "Войти"
    cy.url().should('include', '/dashboard') // Проверяем редирект
  })
})
```

Вместе с Cypress идут инструменты для мокинга API, проверки cookie, работы с localStorage и многое другое.

---

## Лучшие практики для тестирования Vue

Собрал для вас ряд советов, которые облегчат тестирование ваших приложений:

- Пишите короткие и атомарные тесты — они проще читаются и поддерживаются;
- Используйте фабрики и хелперы, если тесты начинают дублироваться;
- Мокаем внешние зависимости/данные;
- Стремитесь к тому, чтобы тесты были "белыми ящиками" — тестируйте не то, как реализовано, а какое поведение ожидается на выходе;
- Для E2E тестов старайтесь использовать "чистую" среду: отдельную базу, заполнение тестовыми данными;
- Следите за покрытием кода тестами. Инструменты типа [coverage] в Jest покажут процент тестируемого кода;
- Старайтесь не тестировать то, что уже протестировали браузеры или фреймворки (например, работу встроенных событий click).

---

## Заключение

Тестирование компонентов и приложений на Vue не только предотвращает баги, но и делает ваше приложение надёжнее и проще в поддержке. С помощью Vue Test Utils и Jest вы можете легко покрыть юнит и интеграционные сценарии. Инструменты типа Cypress отлично справляются с имитацией пользовательских сценариев и помогают быть уверенным в качестве продукта. Не забывайте, что регулярное обновление тестов и стремление к "живому" покрытию — залог устойчивого развития вашего проекта.

---

## Часто задаваемые технические вопросы

### Как протестировать роутинг во Vue-компонентах?

Чтобы тестировать компоненты, использующие Vue Router, подключайте его в глобальные плагины:

```js
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({ history: createWebHistory(), routes: [] })

mount(MyComponent, {
  global: { plugins: [router] }
})
```
Теперь вы можете вызывать методы роутера (`router.push('/about')`) прямо в тестах.

### Как мокать provide/inject во Vue 3?

В `mount` передавайте опцию `global.provide`:

```js
mount(MyComponent, {
  global: { provide: { myKey: 'mockValue' } }
})
```
Компонент получит значение вместо настоящего провайдера.

### Как тестировать слоты компонентов?

Передайте слот как строку или через функцию:

```js
mount(MyComponent, {
  slots: { default: '<span>Текст в слоте</span>' }
})
```
Проверьте, что слот корректно отрисован.

### Почему mount vs shallowMount?

`mount` делает полный рендер дочерних компонентов, `shallowMount` заменяет детей заглушками. Используйте `shallowMount` для изоляции и ускорения тестов, если детям доверяете.

### Как добавить code coverage отчёт для Jest?

Запускайте тесты с флагом:

```bash
npx jest --coverage
```

В результате вы увидите отчёт о покрытии и сможете выявить незатестированные места.