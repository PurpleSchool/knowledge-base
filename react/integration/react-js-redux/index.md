---
metaTitle: Работа с Redux в React-приложении
metaDescription: Получите полное руководство по работе с Redux в React-приложении – узнайте, как настраивать хранилище, использовать actions, reducer и middleware, интегрировать с react-redux
author: Олег Марков
title: Работа с Redux в React-приложении
preview: Подробное руководство по использованию Redux в React – настройка хранилища, reducers, actions, интеграция с React-компонентами и FAQ для уверенного старта
---

## Введение

Вам может показаться, что управление состоянием в React-приложении — задача несложная. И это действительно так, когда объем данных невелик, а компоненты не слишком связаны между собой. Однако по мере роста проекта становится всё сложнее передавать данные между компонентами, избегать дублирования и держать контроль над изменениями состояния. Вот тут на помощь и приходит Redux — универсальная и мощная библиотека для управления состоянием приложения. Давайте разберёмся, для чего нужен Redux, какие задачи он решает, а также как интегрировать его в ваше React-приложение шаг за шагом.

---

## Почему Redux нужен для React-приложений

Redux помогает “централизовать” состояние приложения — то есть сделать так, чтобы все важные данные хранились в одном месте (state store), а изменения этого состояния были прозрачными и контролируемыми. Вам не нужно разбрасывать состояния по десяткам компонентов и бороться с “протеканием пропсов”.

Redux строится на трёх простых принципах:
1. **Единый источник правды** — всё состояние приложения находится в одном объекте дерева.
2. **Состояние только для чтения** — вы не можете изменить state напрямую. Вы описываете, какие действия произошли (action), а обновляет состояние (state) только reducer.
3. **Изменения происходят с помощью чистых функций** — редьюсеры (reducer) принимают текущее состояние и action, возвращают новое состояние, не мутируя предыдущее.

---

## Установка и настройка Redux

### Шаг 1 — Установка необходимых пакетов

Чтобы начать использовать Redux с React, вам понадобится сам Redux и библиотека для связки с React — чаще всего это `react-redux`. Обычно используют и тулкит “Redux Toolkit”, который облегчает работу с Redux и снижает писанину.

```bash
npm install redux react-redux @reduxjs/toolkit
```

### Шаг 2 — Структура проекта

Рекомендуется выделять логику redux в отдельные директории. Обычно это выглядит так:

```
src/
  app/
    store.js
  features/
    counter/
      counterSlice.js
  App.js
  index.js
```

- В `app/store.js` чаще всего хранят настройку store.
- В каждой feature (например, счётчик) — создают свой Slice.

---

## Основные понятия Redux и их реализация

### Store — где живет состояние

Store (хранилище) — это центральное место, где живёт всё состояние вашего приложения. В Redux Toolkit store настраивается суперпросто.

```js
// src/app/store.js
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer, // здесь можно подключить несколько reducer-ов
  },
})
```

### Slice — компактное описание состояния и логики

Slice — это кусок хранилища, который отвечает за одну “фичу” приложения. С помощью Redux Toolkit мы можем сразу описывать и state, и функции для его обновления.

```js
// src/features/counter/counterSlice.js
import { createSlice } from '@reduxjs/toolkit'

export const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0, // стартовое значение счетчика
  },
  reducers: {
    increment: (state) => { state.value += 1 }, // увеличение на 1
    decrement: (state) => { state.value -= 1 }, // уменьшение на 1
    incrementByAmount: (state, action) => { state.value += action.payload } // на произвольное значение
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions
export default counterSlice.reducer
```

Здесь три действия (“actions”): увеличить, уменьшить, увеличить на произвольное значение. Мы экспортируем экшны и редьюсер.

### Actions — описываем, что случилось

Actions — простые объекты, которые содержат описание “что произошло” (тип — тип события и опционально — данные).
В Redux Toolkit, как я показал выше, actions создаются автоматически.

Если вы вдруг захотите создать action сами, это выглядит так:

```js
const action = { type: 'counter/incrementByAmount', payload: 10 }
```

### Reducer — описывает, как обновлять состояние

Reducer — это функция, принимающая текущее состояние и экшн, и возвращающая новое состояние. Вы уже видели пример в `createSlice`, но вот “ручная” версия:

```js
function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { value: state.value + 1 }
    case 'DECREMENT':
      return { value: state.value - 1 }
    default:
      return state
  }
}
```

Но на практике с Redux Toolkit вы редко пишете ручные reducer-ы — этого обычно больше не требуется.

---

## Интеграция Redux с React

### Передаём store всему приложению

Redux store должен быть доступен всем компонентам. Для этого используем компонент-провайдер из `react-redux`.

```js
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```
Теперь любой компонент в дереве получит доступ к Redux.

### Получаем данные из store — useSelector

Если вы хотите “прочитать” значение state, используйте хук `useSelector`:

```js
// src/features/counter/CounterView.js
import React from 'react'
import { useSelector } from 'react-redux'

function CounterView() {
  // Обратите внимание: извлекаем состояние счетчика
  const count = useSelector(state => state.counter.value)
  return <div>Текущее значение: {count}</div>
}
```

Реакт будет повторно рендерить компонент только если эта часть state изменится.

### Меняем состояние — useDispatch

Чтобы изменить состояние (например, увеличить счетчик), нужен хук useDispatch и вызов соответствующего экшна.

```js
// src/features/counter/CounterView.js
import { useDispatch } from 'react-redux'
import { increment, decrement } from './counterSlice'

function CounterView() {
  const dispatch = useDispatch()

  return (
    <div>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  )
}
```
Такая архитектура позволяет легко контролировать изменения и масштабировать приложения.

---

## Асинхронные действия (thunks)

Большинство реальных приложений работает с сервером: отправляет запросы, получает данные. Redux напрямую не поддерживает асинхронные действия, для этого используют middleware — чаще всего в инструментах Redux Toolkit это `createAsyncThunk`.

Пример загрузки данных с помощью thunk:

```js
// src/features/users/usersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Асинхронное действие для загрузки пользователей
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    const response = await fetch('/api/users')
    return await response.json() // возвращаем список пользователей
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export default usersSlice.reducer
```

В этом коде мы импортируем `createAsyncThunk` и описываем асинхронную функцию fetchUsers. Slice автоматически реагирует на последовательность событий pending/fulfilled/rejected — удобно и прозрачно.

---

## Мидлвары (middleware) и расширения

Redux поддерживает механизм middleware — функций-посредников, которые “наблюдают” за отправкой actions, анализируют их или даже “перехватывают” для выполнения дополнительных задач (например, логгирование, обработка thunk и так далее).

С Redux Toolkit логгирование по умолчанию уже включено в режиме разработки. Добавить свой middleware можно так:

```js
// simpleLogger.js
const simpleLogger = storeAPI => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', storeAPI.getState())
  return result
}

// store.js
import { configureStore } from '@reduxjs/toolkit'
import simpleLogger from './simpleLogger'

export const store = configureStore({
  reducer: { ... },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(simpleLogger)
})
```

---

## Селекторы — удобное извлечение данных

Селекторы помогают организовать доступ к нужной части state. Это простые функции, но в больших приложениях лучше использовать библиотеку “reselect” для мемоизации.

Пример простого селектора:

```js
// src/features/users/usersSlice.js
export const selectAllUsers = (state) => state.users.users

// Используем селектор в компоненте
import { useSelector } from 'react-redux'
import { selectAllUsers } from './usersSlice'

function UsersList() {
  const users = useSelector(selectAllUsers)
  // Теперь имеем массив пользователей
  return ...
}
```

Селекторы делают код более читаемым и позволяют переиспользовать логику выборки.

---

## Инструменты разработки и DevTools

Redux DevTools — обязательный инструмент для отладки Redux. Он позволяет просматривать экшны, видеть историю изменений state и откатывать состояние приложения.

Redux Toolkit автоматически включает поддержку DevTools, если вы используете `configureStore`. Вам не нужно ничего настраивать дополнительно.

---

## Лучшие практики и частые ошибки

- Никогда не мутируйте state вне reducer’ов.
- Избегайте хранения не-serializable данных (Date, Map, Promise, функции и т.п.) в state.
- Декомпозируйте store на slices по принципу “одна сущность — один slice”.
- Храните в Redux только общие для всего приложения данные (например, пользователь, корзина, настройки и т.д.).
- Используйте Redux Toolkit — он сильно сокращает объём кода и защищает от ошибок.

---

## Заключение

Redux — мощный и гибкий инструмент для управления состоянием в React-приложениях. С помощью Redux Toolkit, react-redux и современных подходов работа с глобальным состоянием становится простой и масштабируемой. Вы научились подключать Redux, создавать reducers, actions и slices, работать с асинхронными запросами и интегрировать всё это с React. Теперь вы можете применять полученные знания для создания более стабильных и предсказуемых интерфейсов.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### 1. Как обновить несколько свойств состояния в одном action?

Вы можете обновлять сразу несколько свойств state внутри одного редьюсера. Например:

```js
reducers: {
  updateProfile: (state, action) => {
    state.name = action.payload.name
    state.age = action.payload.age
  }
}
```
В экшн передайте сразу нужные значения: `{ name: "Egor", age: 28 }`

### 2. Как очистить все состояние Redux (reset state)?

Для полной очистки состояния используйте редьюсер, который сбрасывает state к исходному значению:

```js
reducers: {
  reset: () => initialState
}
```
Вызовите dispatch(reset())

### 3. Как работать с redux-persist для сохранения состояния в localStorage?

Установите redux-persist. Оберните rootReducer в persistReducer, настройте persistor и прокиньте PersistGate из `redux-persist/integration/react` в корневой компонент.

### 4. Как протестировать Redux reducer?

Импортируйте редьюсер и вызывайте его вручную с разными state и actions. Пример:
```js
expect(counterReducer({ value: 0 }, increment())).toEqual({ value: 1 })
```

### 5. Почему возникает ошибка "Actions must be plain objects"?

Эта ошибка появляется, если вы отправляете функцию вместо объекта. Убедитесь, что используете middleware redux-thunk для асинхронных операций и обернули store соответствующим образом (`middleware: getDefaultMiddleware=>getDefaultMiddleware().concat(...)`).

---