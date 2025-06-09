---
metaTitle: Использование Shadcn UI компонентов с Vue для продвинутых интерфейсов
metaDescription: Подробное руководство по интеграции Shadcn UI с Vue - создание современных интерфейсов, настройка, кастомизация, советы по внедрению и советы по оптимизации
author: Олег Марков
title: Использование Shadcn UI компонентов с Vue для продвинутых интерфейсов
preview: Научитесь использовать Shadcn UI вместе с Vue для построения продвинутых и масштабируемых пользовательских интерфейсов - структура проектов, примеры и инструкции по кастомизации компонентов
---

## Введение

Shadcn UI — современная библиотека компонентов пользовательского интерфейса, изначально созданная для React, которая предлагает модульные, легко настраиваемые и эстетичные элементы для быстрого прототипирования и промышленной разработки интерфейсов. Всё больше команд ищут пути применения Shadcn UI в связке с Vue, поскольку этот стек позволяет проектировать продвинутые, отзывчивые и индивидуальные интерфейсы с акцентом на переиспользуемость и качество кода.

В этой статье я расскажу, как можно встроить Shadcn UI в приложения на Vue и использовать потенциал этих компонентов для создания современных интерфейсов. Мы рассмотрим вопросы интеграции, настройку, покажу примеры и расскажу о типовых сложностях и путях их решения.

## Обзор Shadcn UI: концепция и архитектура

### Что такое Shadcn UI

Shadcn UI — это система компонентов, разработанных поверх библиотек стилей Tailwind CSS и Radix UI. Основные принципы: настраиваемость, явная структура, контроль над стилями. Разработчик может выбирать только нужные ему компоненты и гибко их модифицировать.

Для React доступны автоматические генераторы и тесная интеграция через CLI, однако для Vue официальной поддержки пока нет. Несмотря на это, подход Shadcn UI можно адаптировать под Vue с помощью ручной интеграции или сторонних портов.

### Преимущества использования Shadcn UI с Vue

- Единая визуальная система и UX-стандарты для всех компонентов
- Быстрый старт благодаря готовым шаблонам компонентов
- Простота кастомизации под задачи, используя Tailwind
- Компоненты проектируются таким образом, чтобы их можно было индивидуально встраивать в свою архитектуру
- Хорошо подходит для крупных приложений с требованием к унификации интерфейса

### Какие задачи можно решать

Использование Shadcn UI с Vue удобно в следующих случаях:
- Разработка внутренних панелей и админок
- Построение продуктовых дашбордов и CRM-систем
- Создание одноместных и многомодульных витрин
- Любой проект, где важна скорость запуска и последующая гибкая доработка интерфейса

## Интеграция компонентов Shadcn UI с Vue

### Подходы к интеграции

Есть несколько стратегий использования Shadcn UI с Vue:

1. **Ручная миграция компонентов.** Вы берёте исходники компонентов из репозитория Shadcn UI или их документации и переписываете под синтаксис Vue (JSX или SFC/Composition API).
2. **Использование community-портов.** Уже есть экспериментальные реализации Shadcn UI для Vue — например, репозиторий [shadcn-vue](https://github.com/radix-vue/shadcn-vue).
3. **Перевод дизайн-системы и импорт шаблонов.** Можно брать шаблоны, паттерны и логику компонентов (структуру слоёв, анимации и т.д.) и реализовывать их при помощи Vue и Radix Vue ([radix-vue](https://radix-vue.com/)) — библиотеки портированных Radix-компонентов.

### Установка зависимостей

Покажу, как подготовить Vue-проект для работы со стильным UI в духе Shadcn:

#### 1. Инициализируем новый проект

```bash
npm create vite@latest my-shadcn-vue-app -- --template vue
cd my-shadcn-vue-app
npm install
```

#### 2. Установка Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
В файле `tailwind.config.js` укажите ваши пути к компонентам. Например:

```js
// tailwind.config.js

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Включите Tailwind в ваш главный CSS-файл:

```css
/* src/assets/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Импортируйте этот файл в `main.js`:

```js
import './assets/tailwind.css'
```

#### 3. Использование Shadcn-портированных компонентов

Рассмотрим установку community порта ([shadcn-vue](https://github.com/radix-vue/shadcn-vue)):

```bash
npm install @shadcn-vue/ui @radix-vue/react-icons
```

> _@radix-vue/react-icons_ даст доступ к иконкам, а _@shadcn-vue/ui_ — к основным компонентам UI.

#### 4. Базовая настройка

Добавьте компоненты в ваш проект как обычные Vue-компоненты. Например:

```vue
<script setup>
// Импортируем кнопку из shadcn-vue
import { Button } from '@shadcn-vue/ui'
</script>

<template>
  <Button variant="outline">Нажмите меня</Button>
</template>
```
Для каждого компонента есть свои свойства, которые подробно описаны в документации.

## Примеры использования Shadcn UI компонентов в Vue

### Работа с кнопками

Кнопки — базовый компонент, который часто кастомизируют. Вот как вы их можете подключать и разнообразить:

```vue
<script setup>
import { Button } from '@shadcn-vue/ui'
</script>

<template>
  <div class="space-x-4">
    <Button>Стандартная кнопка</Button>
    <Button variant="outline">Outline-стиль</Button>
    <Button variant="ghost">Ghost</Button>
    <Button disabled>Disabled</Button>
  </div>
</template>
```

#### Объяснение:

- `variant` отвечает за внешний вид (цвет, стиль)
- `disabled` — стандартное свойство для отключения кнопки
- Компоненты поддерживают Tailwind классы, что позволяет их быстро стилизовать.

### Модальные окна

Одно из сильных мест Shadcn UI — диалоги и модальные окна, реализованные на базе Radix Dialog. В Vue с использованием [radix-vue](https://radix-vue.com/docs/components/dialog) это выглядит так:

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@radix-vue/dialog'
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <Button>Показать модальное окно</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>Модальное окно</DialogTitle>
      <p>Здесь находится содержимое модального окна.</p>
      <Button @click="closeDialog">Закрыть</Button>
    </DialogContent>
  </Dialog>
</template>
```
> Здесь вы видите, как комбинируются компоненты для создания сложных интерфейсных паттернов.

### Меню, dropdown и popover

Выпадающие и контекстные меню необходимы практически в любом сложном интерфейсе. В портированных компонентах они строятся вот так:

```vue
<script setup>
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-vue/dropdown-menu'
import { Button } from '@shadcn-vue/ui'
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button>Меню</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Пункт 1</DropdownMenuItem>
      <DropdownMenuItem>Пункт 2</DropdownMenuItem>
      <DropdownMenuItem disabled>Пункт неактивен</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

#### Комментарий:
- Можно добавлять не только текст, но и иконки, кастомные слоты, стилизовать каждый пункт отдельно с помощью Tailwind.

### Таблицы и список элементов

Сейчас в Shadcn UI нет больших сложных таблиц "из коробки", однако паттерны можно брать оттуда же и реализовывать через `<table>` с Tailwind-классами.

```vue
<template>
  <table class="min-w-full border border-gray-200">
    <thead>
      <tr class="bg-gray-50">
        <th class="px-4 py-2">Имя</th>
        <th class="px-4 py-2">Email</th>
        <th class="px-4 py-2">Статус</th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover:bg-gray-100">
        <td class="px-4 py-2">Иван</td>
        <td class="px-4 py-2">ivan@example.com</td>
        <td class="px-4 py-2"><span class="bg-green-100 text-green-800 px-2 py-1 rounded">Активен</span></td>
      </tr>
      <!-- Добавьте больше строк -->
    </tbody>
  </table>
</template>
```

Можно обернуть эту разметку в свой Vue-компонент и переиспользовать его в проекте.

### Формы, инпуты, валидация

Shadcn UI поддерживает стилизацию и паттерны для полей, чекбоксов, переключателей и др.:

```vue
<script setup>
import { Input, Label, Checkbox, Switch } from '@shadcn-vue/ui'
</script>

<template>
  <form class="space-y-4">
    <div>
      <Label for="email">Email</Label>
      <Input id="email" type="email" placeholder="Введите ваш email" />
    </div>
    <div class="flex items-center space-x-2">
      <Checkbox id="agree" />
      <Label for="agree">Согласен с условиями</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Label for="notify">Получать уведомления</Label>
      <Switch id="notify" />
    </div>
    <Button type="submit">Отправить</Button>
  </form>
</template>
```

- Здесь вы можете легко управлять состоянием с помощью Vue reactive ref() или v-model.

### Комбинация компонентов для построения сложных интерфейсов

Сила Shadcn UI — в комбинации виджетов. Давайте соберём пример окна настроек с вкладками и формами:

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-vue/tabs'
import { Input, Button } from '@shadcn-vue/ui'
import { ref } from 'vue'

const email = ref('')
const password = ref('')
</script>

<template>
  <Tabs default-value="profile" class="max-w-md mx-auto">
    <TabsList>
      <TabsTrigger value="profile">Профиль</TabsTrigger>
      <TabsTrigger value="security">Безопасность</TabsTrigger>
    </TabsList>
    <TabsContent value="profile">
      <form class="space-y-2">
        <Input v-model="email" type="email" placeholder="Ваш email" />
        <Button>Сохранить</Button>
      </form>
    </TabsContent>
    <TabsContent value="security">
      <form class="space-y-2">
        <Input v-model="password" type="password" placeholder="Новый пароль" />
        <Button>Сменить пароль</Button>
      </form>
    </TabsContent>
  </Tabs>
</template>
```

- Вы видите, как сочетание простых компонентов помогает строить сложные, многоуровневые формы без лишней логики.

## Кастомизация и расширяемость Shadcn UI компонентов в Vue

### Кастомные стили 

Shadcn UI изначально строится на Tailwind CSS, что позволяет вам:
- Переопределять любые цвета и стили прямо в классе компонента
- Использовать токены Tailwind и переменные CSS
- Создавать свои utility-классы

**Пример изменения стиля кнопки:**

```vue
<Button class="bg-purple-600 text-white hover:bg-purple-700 rounded-full">Фиолетовая кнопка</Button>
```

### Изменение логики компонента

Если функциональность базового компонента не подходит, вы можете склонировать его, адаптировать под свои задачи и внедрить собственную бизнес-логику.

```vue
<!-- CustomButton.vue -->
<script setup>
defineProps(['label', 'onClick'])
</script>

<template>
  <button
    class="text-lg px-6 py-2 border-l-4 border-blue-400 hover:bg-blue-50 transition"
    @click="onClick"
  >{{ label }}</button>
</template>
```

- Такой подход позволяет сделать сложные compound-компоненты с сохранением единого стиля.

### Темизация и поддержка dark-mode

Tailwind уже поддерживает dark/light режимы на уровне классов. Вам только нужно добавить соотв. класс (`dark`) к корневому элементу и прописывать стили:

```vue
<Button class="bg-white text-black dark:bg-gray-800 dark:text-white">Тема адаптируется!</Button>
```

Все компоненты Shadcn UI легко поддерживают такие переключения.

## Внедрение Shadcn UI в реальное приложение

### Архитектура и best practices

1. **Создавайте слои UI-компонентов.** Компоненты shadcn-vue хранят в отдельной папке (например, `ui` или `shared`).
2. **Переиспользуйте базовые элементы.** Не оборачивайте каждый элемент сразу бизнес-логикой — только там, где это действительно необходимо.
3. **Инкапсулируйте кастомизацию.** Если компонент часто дорабатывается, вынесите его в отдельный файл.
4. **Держите стили модульными.** Благодаря Tailwind у каждого компонента есть свойнабор utility-классов, избегайте глобальных переопределений.
5. **Пишите документацию к своим обёрткам.** Это значительно упростит жизнь вашим коллегам при масштабировании проекта.

### Управление состоянием и интеграция с Vue-композицией

- Используйте ref/computed/props для управляемых полей
- v-model поддерживается для большинства портированных компонентов
- Сложные состояния (например, фильтры таблиц) лучше выносить в store (Pinia, Vuex)

### Пример полноценной формы с кастомизацией

```vue
<script setup>
import { ref } from 'vue'
import { Input, Button, Label } from '@shadcn-vue/ui'

const email = ref('')
const password = ref('')
const error = ref('')
const onSubmit = () => {
  if (!email.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }
  // Выполните действие отправки формы
}
</script>

<template>
  <form class="p-8 bg-white rounded-lg shadow-md space-y-4 max-w-xl mx-auto" @submit.prevent="onSubmit">
    <div>
      <Label for="email">Email</Label>
      <Input v-model="email" type="email" id="email" placeholder="example@mail.com" />
    </div>
    <div>
      <Label for="password">Пароль</Label>
      <Input v-model="password" type="password" id="password" placeholder="******" />
    </div>
    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    <Button type="submit" class="w-full">Войти</Button>
  </form>
</template>
```

## Заключение

Shadcn UI — это современный набор компонентов, с помощью которого можно быстро и надёжно строить сложные интерфейсы. Если вы работаете с Vue, то адаптировать Shadcn UI вполне реально: сохранять структуру и паттерны компонентов, использовать Tailwind для стилизации, а портированные компоненты (например, через `shadcn-vue` и `radix-vue`) дают гибкость не хуже оригинала на React.

Наибольшим плюсом становится контроль над каждым компонентом: вы сами определяете стили, структуру и логику. Такой подход отлично подходит для корпоративных панелей и кастомных приложений. Для полноценной работы иногда потребуется чуть больше ручной настройки, но результат стоит того: у вас появляется единая дизайн-система, устойчивый пользовательский опыт и удобство масштабирования интерфейса.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**1. Как импортировать только нужные компоненты Shadcn UI, чтобы не увеличивать размер бандла?**

Портированные компоненты для Vue обычно поставляются отдельными модулями. Импортируйте только те, которые реально используете:

```js
import { Button } from '@shadcn-vue/ui'
// Не импортируйте весь пакет сразу
```

**2. Как подключить иконки к компонентам Shadcn UI в Vue?**

Установите пакет иконок, например `@radix-vue/react-icons`, и импортируйте иконку в нужном компоненте:

```js
import { PlusIcon } from '@radix-vue/react-icons'
```
Затем используйте как обычный компонент внутри шаблона:

```vue
<Button><PlusIcon class="w-4 h-4 mr-2" />Добавить</Button>
```

**3. Можно ли интегрировать Shadcn UI с Vuetify, Element Plus или другими UI-фреймворками?**

Технически да, но рекомендуется избегать смешивания разных дизайн-систем в одном проекте. Если необходимо, определяйте отдельные слои для компонентов каждой системы и избегайте дублирования стилей.

**4. Как реализовать динамические темы (например, темная/светлая) с помощью Shadcn UI и Tailwind в Vue?**

Добавьте поддержку dark mode в конфиге Tailwind (`darkMode: 'class'`) и используйте классы `dark`:

```html
<body class="dark"> <!-- вручную или программно -->
```
В компонентах прописывайте темные стили через класс `dark:bg-gray-800` и аналогично.

**5. Где найти актуальную документацию по Shadcn UI для Vue?**

Проверьте GitHub-репозиторий [shadcn-vue](https://github.com/radix-vue/shadcn-vue) и официальный сайт [radix-vue.com](https://radix-vue.com/) — там размещаются свежие примеры, документация, новости и обновления. Если чего-то не хватает, рассмотрите портирование компонентов самостоятельно, используя исходники Shadcn UI и Radix React.