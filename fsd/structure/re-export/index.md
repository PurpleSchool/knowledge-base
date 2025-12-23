---
metaTitle: Реэкспорт в index.ts в TypeScript и JavaScript
metaDescription: Подробное руководство по реэкспорту в index.ts в TypeScript и JavaScript - разбор синтаксиса паттернов barrel file организации модулей и типичных ошибок
author: Олег Марков
title: Реэкспорт в index.ts - как упростить структуру модулей в TypeScript и JavaScript
preview: Разберитесь с реэкспортом в index.ts - узнайте как создавать barrel файлы упрощать импорты структурировать проект и избегать распространенных ошибок
---

## Введение

Реэкспорт в index.ts (или index.js) часто называют паттерном barrel file. Суть простая: вы собираете экспорты из разных модулей в одну точку входа и уже из нее импортируете все необходимое в коде. 

Вместо того чтобы тянуть пути наподобие:

import { Button } from "../../components/ui/button/Button"

вы работаете с более короткими и понятными:

import { Button } from "../../components"

Смотрите, я покажу вам, как это работает, какие есть варианты синтаксиса, чем barrel-файлы полезны и где с ними можно попасть в неприятности (циклические зависимости, неправильные типы и так далее).  

Давайте начнем с базовой идеи, а затем перейдем к разным вариантам реэкспорта и практическим примерам.

## Что такое реэкспорт и barrel file

### Экспорт против реэкспорта

Сначала важно разделить два понятия:

- Экспорт – когда модуль напрямую объявляет сущности и делает их доступными наружу.

Пример прямого экспорта:

// button.ts
export const Button = () => {
  // Здесь мы объявляем компонент и экспортируем его напрямую
}

- Реэкспорт – когда модуль не объявляет сущности сам, а только передает наружу то, что он импортировал из других модулей.

Пример реэкспорта:

// index.ts
export { Button } from "./button" // Здесь мы просто «прокидываем» Button дальше

Barrel file – это модуль, который в основном (или только) занимается реэкспортом. Обычно его называют index.ts, index.tsx, index.js или index.mjs.  

Такой файл становится единой точкой входа к группе связанных модулей (компоненты, utils, сервисы и так далее).

### Зачем нужен реэкспорт в index.ts

Давайте разберем практические выгоды.

#### 1. Сокращение и унификация импортов

Вместо множества путей:

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/form/input"
import { Checkbox } from "../../components/ui/form/checkbox"

Вы делаете один index.ts в директории components и пишете:

// components/index.ts
export { Button } from "./ui/button"
export { Input } from "./ui/form/input"
export { Checkbox } from "./ui/form/checkbox"

Теперь использование выглядит так:

import { Button, Input, Checkbox } from "../../components"

Код становится компактнее, а пути – стабильнее. Если структура папок поменяется, вы трогаете только index.ts.

#### 2. Стабильный публичный API модуля

Barrel-файл позволяет явно определить, что считается «публичным» API папки.  

Например, внутри components/ui может быть много технических файлов, но наружу вы экспортируете только нужные компоненты:

// components/ui/index.ts
export { Button } from "./button/Button"
export { Input } from "./input/Input"
// Другие внутренние файлы не экспортируем, они считаются приватными

С точки зрения потребителя достаточно знать, что есть "components/ui", а не как устроена папка внутри.

#### 3. Уменьшение связности структуры проекта

Если вы импортируете только из index.ts, то внутренняя структура папок становится деталью реализации, а не контрактом. Это снижает хрупкость проекта: рефакторинг структуры почти не цепляет остальные файлы.

#### 4. Удобная группировка по доменам

Реэкспорт позволяет вам строить доменные модули:

- auth
- user
- orders
- ui

Например, в папке auth могут лежать файлы loginService.ts, signupService.ts, authGuard.ts, но наружу вы дадите только удобный API через index.ts.

## Основной синтаксис реэкспорта

Теперь давайте посмотрим подробные варианты синтаксиса, которые предоставляет JavaScript/TypeScript.

### Реэкспорт именованных сущностей

Самый распространенный вариант.

#### Базовый пример

// button.ts
export const Button = () => {
  // Здесь мы объявляем сам компонент
}

// index.ts
export { Button } from "./button" // Здесь мы просто говорим - реэкспортируй Button

Теперь другой модуль может написать:

// app.ts
import { Button } from "./index" // Здесь мы импортируем Button уже из index.ts

Важный момент: в index.ts мы не создаем новую сущность, а только прокидываем оригинальный экспорт.

#### Переименование при реэкспорте

Иногда удобно задать другое имя:

// math.ts
export const add = (a: number, b: number) => a + b

// index.ts
export { add as sum } from "./math" 
// Здесь мы говорим - экспортируй функцию add под именем sum

// app.ts
import { sum } from "./index"
// Теперь мы работаем с именем sum, хотя исходная функция называется add

Это удобно, если вы выравниваете именование в разных модулях.

### Реэкспорт всего содержимого модуля

Смотрите, это более «грубый» способ: вы просто передаете наружу все именованные экспорты модуля.

#### Простой вариант

// utils.ts
export const formatDate = () => { /* ... */ }
export const formatPrice = () => { /* ... */ }

// index.ts
export * from "./utils" 
// Здесь мы не перечисляем конкретные сущности - все именованные экспорты улетают наружу

Теперь любой импорт из index.ts видит formatDate и formatPrice.

Но у этого синтаксиса есть нюансы и подводные камни (разберем чуть дальше).

#### Объединение нескольких модулей

Barrel-файл часто используют, чтобы объединить несколько модулей:

// index.ts
export * from "./math"
export * from "./string"
export * from "./date"
// Здесь мы собираем все утилиты из разных файлов в одном месте

Теперь можно:

import { add, capitalize, formatDate } from "./utils" 
// Здесь add мог прийти из math, capitalize - из string, formatDate - из date

### Комбинирование явного и «звездочного» реэкспорта

Иногда вы хотите:

- импортировать все, но
- кое-что переименовать или скрыть.

Смотрите, как это можно сделать:

// math.ts
export const add = (a: number, b: number) => a + b
export const subtract = (a: number, b: number) => a - b

// index.ts
export * from "./math"              // Здесь мы экспортируем все как есть
export { subtract as minus } from "./math" 
// А здесь добавляем алиас minus на тот же экспорт

Теперь потребитель увидит:

import { add, subtract, minus } from "./index"
// subtract и minus указывают на одну и ту же функцию

Если имена совпадут, явный реэкспорт перекроет результат export * from … (в TypeScript это имеет значение для типов).

### Реэкспорт по умолчанию (default export)

Default-экспорт – отдельная история. Его нельзя реэкспортировать через export *; нужно явно указать default.

#### Базовый пример

// Button.tsx
const Button = () => {
  // Здесь мы объявляем компонент
}
export default Button  // Это экспорт по умолчанию

// index.ts
export { default as Button } from "./Button" 
// Здесь мы реэкспортируем default под именем Button

Теперь потребитель пишет:

import { Button } from "./index" 
// В итоге он получает тот самый default-экспорт из Button.tsx

Это распространенный паттерн для React-компонентов и не только.

#### Реэкспорт default без имени (редкий вариант)

Технически возможно:

// Button.tsx
export default Button

// index.ts
export { default } from "./Button" 
// Здесь мы просто прокидываем default дальше как default

Тогда потребителю придется импортировать тоже default:

import Button from "./index"
// Здесь мы импортируем default уже из index.ts

Такой стиль возможен, но для barrel-файлов обычно предпочитают именованные экспорты, чтобы проще объединять несколько сущностей.

### Реэкспорт типов в TypeScript

TypeScript добавляет полезный синтаксис для типов: можно явно разделять типовые и значимые экспорты.

#### Реэкспорт только типов

// types.ts
export interface User {
  id: string
  name: string
}

// index.ts
export type { User } from "./types" 
// Здесь мы говорим - реэкспортируй только тип User, не тянув за собой runtime-код

Это важно для tree-shaking и для того, чтобы не добавлять лишний JavaScript-код в сборку.

#### Комбинирование типов и значений

// user.ts
export interface User {
  id: string
  name: string
}

export const createUser = (name: string): User => ({
  id: "1",
  name,
})

// index.ts
export type { User } from "./user" 
// Здесь реэкспортируем только тип

export { createUser } from "./user" 
// А здесь реэкспортируем функцию, которая реально будет в runtime

Теперь:

// app.ts
import { createUser } from "./index" 
// Здесь мы импортируем функцию

import type { User } from "./index" 
// А здесь мы импортируем только тип User - это не попадет в собранный JS

## Как организовать index.ts в проекте

Теперь давайте перейдем к практической части: как и где создавать barrel-файлы.

### Структура директив с index.ts

Представьте такую структуру:

src/
  components/
    Button/
      Button.tsx
      styles.css
      index.ts
    Input/
      Input.tsx
      index.ts
    index.ts
  pages/
    Home/
      HomePage.tsx
      index.ts
    index.ts

#### Локальные index.ts рядом с сущностями

Например, для компонента Button:

// components/Button/index.ts
export { default as Button } from "./Button" 
// Здесь мы делаем единый экспорт для компонента Button

Теперь вы можете импортировать так:

import { Button } from "@/components/Button"
// Внутри components/Button может поменяться структура, импорт останется прежним

#### Глобальный index.ts для группы

На уровень выше:

// components/index.ts
export * from "./Button"
export * from "./Input"
// Здесь мы объединяем все публичные компоненты в одном месте

Теперь можно писать:

import { Button, Input } from "@/components"

Такой прием легко масштабируется и на страницы:

// pages/index.ts
export * from "./Home"
export * from "./Profile"
export * from "./Settings"

### Явные или импорт через звездочку – что выбрать

Давайте посмотрим, когда какой вариант лучше.

#### Когда использовать явный список

// index.ts
export { Button } from "./Button"
export { Input } from "./Input"

Плюсы:

- Явный контроль публичного API
- Легче следить, что именно доступно наружу
- Меньше шансов «случайно» вывести наружу внутренний модуль
- Проще анализировать зависимости

Такой стиль особенно хорош для библиотек, SDK или публичных модулей.

#### Когда использовать export * from

// index.ts
export * from "./Button"
export * from "./Input"

Плюсы:

- Быстро и удобно, меньше кода
- Подходит для проектов, где структура понятна, и нет жестких требований к публичному API

Минусы:

- Меньше контроля (легко вывести наружу лишнее)
- С ростом проекта сложнее отслеживать конфликты имен
- Тяжелее использовать auto-complete, если модулей очень много

Частый компромисс: на ближайшем уровне (рядом с сущностями) использовать export * from, а на верхнем уровне проекта – явный список экспортов.

### Реэкспорт и alias путей

В TypeScript обычно настраивают path aliases, чтобы не писать длинные относительные пути.  

Например, в tsconfig.json:

{
  // Здесь мы настраиваем алиасы путей
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"]
    }
  }
}

Теперь с barrel-файлами вы можете писать:

// src/components/index.ts
export * from "./Button"
export * from "./Input"

// src/app.ts
import { Button } from "@components" 
// Здесь мы используем алиас - он указывает на src/components/index.ts

А внутри `@components/Button` может быть свой локальный index.ts, который тоже делает реэкспорт.

## Частые проблемы и подводные камни реэкспорта

Теперь посмотрим, где чаще всего возникают сложности.

### Циклические зависимости

Самая неприятная проблема с barrel-файлами – циклические зависимости.  

Ситуация выглядит примерно так:

// A.ts
export { B } from "./index" 
// Здесь A реэкспортирует B из index.ts

// B.ts
export { A } from "./index" 
// Здесь B реэкспортирует A из index.ts

// index.ts
export * from "./A"
export * from "./B"
// Здесь мы объединяем A и B

В итоге:

- A зависит от index.ts
- index.ts зависит от B
- B зависит от index.ts
- index.ts зависит от A

Получается замкнутый круг. В runtime это может привести к undefined вместо ожидаемых значений.

#### Как избегать циклов

Вот несколько практичных советов:

1. Не импортируйте из barrel-файла внутри модулей, которые этот barrel формируют.  
   То есть A.ts и B.ts не должны импортировать что-то из index.ts, в котором они же реэкспортируются.

2. Если модулю A нужен модуль B, импортируйте B напрямую:

// A.ts
import { B } from "./B"  // Здесь мы импортируем B напрямую, а не через index.ts

3. В TypeScript можно включить флаг:

"importsNotUsedAsValues": "error"

и следить за циклическими зависимостями через линтеры (например, eslint-plugin-import с правилом import/no-cycle).

4. Для доменных модулей оправдано вообще отказаться от export * и прописывать зависимости явно.

### Смешивание типов и значений

Если реэкспортировать типы и значения одним export * в TypeScript, можно получить лишний код в сборке или странные ошибки.

Лучше разделять:

// user.ts
export interface User {
  id: string
}
export const createUser = () => { /* ... */ }

// index.ts
export type { User } from "./user"  // Здесь реэкспортируем только тип
export { createUser } from "./user" // А здесь реэкспортируем функцию

Так вы явно контролируете, что попадает в runtime.

### Конфликты имен при export *

Когда вы пишете:

export * from "./math"
export * from "./string"

и оба модуля экспортируют, например, функцию parse, то:

- в ES-модулях такой реэкспорт приведет к ошибке на этапе сборки (дублирующееся имя);
- вам придется переименовать экспорт хотя бы в одном модуле или использовать явный реэкспорт с alias.

Пример решения:

// math.ts
export const parse = (value: string) => Number(value)

// string.ts
export const parse = (value: unknown) => String(value)

// index.ts
export { parse as parseNumber } from "./math"
export { parse as parseString } from "./string"
// Здесь мы даем им разные имена при реэкспорте

### Баррель-файлы и tree-shaking

Barrel-файлы иногда мешают инструментам сборки (Webpack, Rollup, esbuild, Vite) эффективно выкидывать неиспользуемый код, особенно если использовать export *.

Смотрите, в чем проблема:

- Если вы явно экспортируете сущности и импортируете только часть из них, современные сборщики чаще всего справляются и отбрасывают лишнее.
- Но если в index.ts написано много export * from и есть сложные связи, сборщик иногда перестраховывается и тащит лишние модули в bundle.

Что помогает:

1. Отдавать предпочтение явному экспорту, особенно в библиотеках.
2. Отдельно реэкспортировать типы (export type).
3. Проверять бандл анализаторами (Webpack Bundle Analyzer, source-map-explorer и т.п.), если размер начинает расти.

### Смешивание default и именованных экспортов

Реэкспорт default и именованных сущностей в одном barrel-файле возможен, но требует аккуратности:

// Button.tsx
export const Button = () => { /* ... */ }
export default Button  // Здесь default и именованный указывают на один компонент

// index.ts
export { default as Button } from "./Button"
export { Button as NamedButton } from "./Button"

Теперь:

import { Button, NamedButton } from "./index"

Это работает, но легко запутаться, что откуда приходит. Лучше придерживаться одного стиля по проекту:

- или только default для компонентов;
- или только именованные экспорты;
- или строгая договоренность: default + имя совпадает.

## Практические примеры структуры с реэкспортом

Теперь давайте посмотрим более полные примеры, как можно организовать код.

### Пример 1 – UI-библиотека

Представим простую структуру:

src/
  ui/
    Button/
      Button.tsx
      index.ts
    Input/
      Input.tsx
      index.ts
    Modal/
      Modal.tsx
      index.ts
    index.ts

Локальные index.ts для каждого компонента:

// ui/Button/index.ts
export { default as Button } from "./Button" 
// Здесь мы экспортируем default-экспорт под именем Button

// ui/Input/index.ts
export { default as Input } from "./Input"

// ui/Modal/index.ts
export { default as Modal } from "./Modal"

Общий index.ts:

// ui/index.ts
export * from "./Button"
export * from "./Input"
export * from "./Modal"
// Здесь мы собираем все компоненты в один модуль

Теперь в приложении:

// app.tsx
import { Button, Input, Modal } from "@/ui"
// Здесь нам достаточно знать только про "@/ui"

Если компоненты разрастутся, их структура изменится, публичный API через "@/ui" останется тем же.

### Пример 2 – доменные модули

Возьмем доменную область user:

src/
  modules/
    user/
      api/
        getUser.ts
        updateUser.ts
        index.ts
      model/
        types.ts
        store.ts
        index.ts
      ui/
        UserCard.tsx
        index.ts
      index.ts

Теперь давайте наполним index.ts на разных уровнях.

#### index.ts для api

// modules/user/api/getUser.ts
export const getUser = async (id: string) => {
  // Здесь мы делаем запрос на сервер за данными пользователя
}

// modules/user/api/updateUser.ts
export const updateUser = async (id: string, payload: unknown) => {
  // Здесь мы отправляем изменения пользователя на сервер
}

// modules/user/api/index.ts
export { getUser } from "./getUser"
export { updateUser } from "./updateUser"
// Здесь мы явным списком формируем публичный API слоя api

#### index.ts для model

// modules/user/model/types.ts
export interface User {
  id: string
  name: string
}

// modules/user/model/store.ts
export const userStore = {
  // Здесь мы храним и обновляем состояние пользователя
}

// modules/user/model/index.ts
export type { User } from "./types"
export { userStore } from "./store"
// Здесь мы реэкспортируем тип и стор, разделяя типы и значения

#### index.ts для ui

// modules/user/ui/UserCard.tsx
import type { User } from "../model"

export const UserCard = ({ user }: { user: User }) => {
  // Здесь мы отображаем карточку пользователя
  return null
}

// modules/user/ui/index.ts
export { UserCard } from "./UserCard"
// Здесь мы создаем удобную точку входа для UI части

#### Глобальный index.ts домена user

// modules/user/index.ts
export * as userApi from "./api"
export * as userModel from "./model"
export * as userUi from "./ui"
// Здесь мы собираем три слоя и даем им имена пространств

Теперь вы можете использовать модуль так:

// app.ts
import { userApi, userModel, userUi } from "@/modules/user"

userApi.getUser("1")   // Здесь обращаемся к api-слою
userModel.userStore    // Здесь используем модель
userUi.UserCard        // Здесь рендерим UI-компонент

Обратите внимание, как index.ts на разных уровнях создают последовательную структуру API модуля.

### Пример 3 – библиотека утилит

Предположим, у вас есть несколько групп утилит:

src/
  utils/
    math/
      add.ts
      subtract.ts
      index.ts
    string/
      capitalize.ts
      trim.ts
      index.ts
    date/
      formatDate.ts
      index.ts
    index.ts

Наполним их.

#### Локальные barrel-файлы

// utils/math/add.ts
export const add = (a: number, b: number) => a + b

// utils/math/subtract.ts
export const subtract = (a: number, b: number) => a - b

// utils/math/index.ts
export { add } from "./add"
export { subtract } from "./subtract"
// Здесь мы явно описываем публичные функции math

// utils/string/capitalize.ts
export const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

// utils/string/trim.ts
export const trim = (value: string) => value.trim()

// utils/string/index.ts
export { capitalize } from "./capitalize"
export { trim } from "./trim"

// utils/date/formatDate.ts
export const formatDate = (date: Date) =>
  date.toISOString().split("T")[0] // Здесь мы возвращаем строку YYYY-MM-DD

// utils/date/index.ts
export { formatDate } from "./formatDate"

#### Главный index.ts для utils

// utils/index.ts
export * as mathUtils from "./math"
export * as stringUtils from "./string"
export * as dateUtils from "./date"
// Здесь мы структурируем доступ к утилитам по пространствам имен

Теперь в коде:

// app.ts
import { mathUtils, stringUtils, dateUtils } from "@/utils"

const sum = mathUtils.add(1, 2)
const title = stringUtils.capitalize("hello")
const today = dateUtils.formatDate(new Date())

Такой стиль особенно хорошо читается, когда у вас есть несколько логических групп функций.

## Лучшие практики при использовании реэкспорта в index.ts

Подведем рекомендации, которые помогут вам использовать barrel-файлы без лишних проблем.

### 1. Не импортировать из index.ts внутри «его» же модулей

Если модуль участвует в формировании index.ts, он не должен импортировать из этого index.ts.  

Используйте прямые пути:

// Плохо - может создать цикл
// A.ts
import { B } from "./index"

// Хорошо - прямой импорт
// A.ts
import { B } from "./B"

Так вы снижаете риск циклических зависимостей.

### 2. Явно контролируйте публичный API

Особенно в библиотеках:

- для публичного API – явные экспорты;
- для внутренних связей – прямые импорты между файлами;
- export * from использовать дозированно, понимая, что вы отдаете наружу.

### 3. Отдельно реэкспортируйте типы

В TypeScript:

- используйте export type { ... } для типов;
- используйте import type для импортов типов;

Это уменьшает размер бандла и делает код яснее.

### 4. Соблюдайте единый стиль по проекту

Договоритесь в команде:

- используете ли вы default-экспорты;
- как называете index-файлы (index.ts / index.tsx / main.ts);
- где создаете barrel-файлы (на каждом уровне папок или только на ключевых).

Стабильный стиль уменьшает количество «сюрпризов» при чтении чужого кода.

### 5. Не делайте слишком «толстые» barrel-файлы

Если index.ts импортирует и реэкспортирует десятки или сотни модулей, это:

- усложняет анализ зависимостей;
- может ухудшать tree-shaking;
- делает отладку сложнее.

Иногда разумнее разбить barrel-файлы по поддоментам, а уже их собрать на самом верхнем уровне.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как реэкспортировать все, кроме одной сущности

Напрямую исключить один экспорт из export * нельзя. Обходной путь – явно перечислить, что вы хотите оставить:

// original.ts
export const a = 1
export const b = 2
export const c = 3

// index.ts - хотим все кроме b
export { a, c } from "./original"
// Здесь мы явно указываем только нужные сущности

Автоматически «все кроме b» синтаксис не поддерживает.

### Как правильно реэкспортировать namespace (пространство имен) в TypeScript

Если у вас устаревший namespace:

// legacy.ts
export namespace Legacy {
  export const value = 1
}

Лучше не создавать новый namespace, а просто прокинуть модуль целиком:

// index.ts
export * as Legacy from "./legacy"
// Здесь мы создаем пространство имен на уровне модулей ES

Использовать namespace-синтаксис в новом коде не рекомендуется, предпочтителен модульный подход.

### Как реэкспортировать тип и значение с одним именем из разных файлов

Сделайте раздельные файлы и раздельный реэкспорт:

// userType.ts
export interface User {
  id: string
}

// userValue.ts
export const User = {
  // Здесь объект с настройками пользователя
}

// index.ts
export type { User } from "./userType"
export { User as UserConfig } from "./userValue"
// Здесь мы тип оставили под именем User, а значение переименовали

Так вы избежите конфликта и путаницы.

### Как реэкспортировать тип из JavaScript-файла в TypeScript-проекте

Если исходный файл на JS:

// user.js
export const createUser = (name) => ({ id: "1", name })

В TypeScript вы не сможете экспортировать тип напрямую, но можно описать тип поверх:

// user.d.ts - файл деклараций
export interface User {
  id: string
  name: string
}

// index.ts
export { createUser } from "./user"
export type { User } from "./user"
// Здесь TypeScript подтянет тип из декларации user.d.ts

Важно иметь декларационные файлы или d.ts-типизацию для JS-модулей.

### Как настроить barrel-файлы при использовании смешанных модулей CJS и ESM

Если часть кода на CommonJS, часть на ES-модулях, лучше:

1. На уровне TypeScript/ESM использовать только ESM-синтаксис (import/export).
2. Для CJS-модулей писать адаптеры:

// cjsModule.cjs
module.exports = { foo: () => {} }

// cjsAdapter.ts
import cjs = require("./cjsModule.cjs")
export const foo = cjs.foo
// Здесь мы создаем адаптер под ESM

// index.ts
export { foo } from "./cjsAdapter"
// Здесь мы реэкспортируем уже ESM-совместимую сущность

Так вы избежите проблем с различиями между require и import.