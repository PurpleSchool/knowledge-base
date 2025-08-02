---
metaTitle: Управление состоянием с Redux на React Native
metaDescription: Узнайте как использовать Redux для эффективного управления состоянием в React Native приложениях - пример настройки, важнейшие функции и современные best practices
author: Олег Марков
title: Управление состоянием с Redux на React Native
preview: Пошаговая инструкция по внедрению Redux в React Native - подключение, написание редьюсеров, организация стейта и советы по масштабированию приложения
---

## Введение

Управление состоянием — одна из самых важных задач при разработке мобильных приложений на React Native. По мере роста вашего проекта вам может понадобиться решение, которое поможет передавать данные между компонентами, управлять сложными потоками данных, поддерживать синхронизацию между экранами и облегчить отладку. Redux является одним из самых популярных инструментов для этого. Он предлагает предсказуемое централизованное хранилище состояния, где все глобальные данные приложения управляются единообразно и прозрачно.

В этой статье я подробно расскажу, как интегрировать Redux в проект на React Native, объясню, как управлять глобальным состоянием, передавать данные между компонентами, обновлять состояние и работать с middleware для обработки асинхронных операций. Всё будет сопровождаться поясняющими примерами — после прочтения вы сможете с уверенностью строить архитектуру приложения с применением Redux.

## Почему глобальное состояние важно для React Native

Когда приложение небольшое, общий state можно передавать через свойства (props) между несколькими компонентами. Однако это решение быстро становится неудобным и негибким: изменение одного поля в форме может затрагивать несколько частей дерева компонентов, и вам потребуется пробрасывать данные "вниз" на 3-4 уровня. Такие проблемы особенно актуальны для приложений, где есть авторизация, корзина, чаты, уведомления и другие быстро меняющиеся данные.

Redux централизует всё состояние в одном месте — store. Все изменения происходят по строгим правилам, что делает приложение удобным для масштабирования и тестирования.

Redux — мощный инструмент для управления состоянием в React Native приложениях, особенно когда речь идет о сложных проектах с большим количеством компонентов и асинхронными операциями. Однако, неправильное использование Redux может привести к излишней сложности и ухудшению производительности. Важно понимать основные принципы Redux, уметь правильно структурировать хранилище и использовать middleware для обработки побочных эффектов. Если вы хотите детальнее погрузиться в управление состоянием и другие аспекты React Native разработки, — приходите на наш большой курс [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Upravlenie-sostoyaniem-s-pomoschyu-Redux-na-React-Native). На курсе 184 уроков и 11 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Основные концепции Redux

Redux строится вокруг трех основных принципов:

1. **Единое хранилище (Single source of truth)**  
   Всё глобальное состояние хранится в одном объекте store. Доступ к нему есть у любого компонента.
   
2. **Состояние только для чтения (State is read-only)**  
   Изменить состояние можно только через отправку (dispatch) action — специальных событий, которые описывают, что произошло.

3. **Чистые функции-редьюсеры**  
   Action обрабатываются редьюсерами — чистыми функциями, которые принимают текущее состояние и action, возвращая новое состояние.

---

## Как установить и настроить Redux в React Native

Давайте проведем быструю установку и настроим ваш первый store.

### Установка пакетов

Для начала потребуется установить несколько библиотек:

- `redux` — основная библиотека
- `react-redux` — для интеграции с React (и React Native)
- `@reduxjs/toolkit` — набор утилит, упрощающих настройку redux (рекомендуется)

Выполните в терминале:

```sh
npm install @reduxjs/toolkit react-redux
```

Здесь нет необходимости устанавливать сам пакет `redux` — он идет внутри Redux Toolkit.

### Создание первого среза (slice)

Redux Toolkit предлагает концепцию "среза" (slice) — отдельного редьюсера с actions. Смотрите, я покажу вам, как это работает.

Создайте файл `features/counter/counterSlice.js`:

```js
import { createSlice } from '@reduxjs/toolkit'

// Определяем начальное состояние
const initialState = {
  value: 0,
}

// Создаем slice для счетчика
const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // Увеличение
    increment: (state) => {
      state.value += 1
    },
    // Уменьшение
    decrement: (state) => {
      state.value -= 1
    },
    // Установка значения
    setValue: (state, action) => {
      state.value = action.payload
    },
  },
})

// Экспортируем actions и reducer
export const { increment, decrement, setValue } = counterSlice.actions
export default counterSlice.reducer
```

Этот файл описывает часть состояния и логику его обновления.

### Настройка store

Теперь создадим хранилище состояния приложения. Сделайте файл `app/store.js`:

```js
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'

// Создаём store, в который подключаем срезы
const store = configureStore({
  reducer: {
    counter: counterReducer,
    // тут можно добавить и другие срезы
  },
})

export default store
```

### Подключение store к приложению

Чтобы все компоненты могли обращаться к глобальному состоянию, оберните ваше корневое приложение в `<Provider>` из `react-redux`. Как это выглядит:

В файле `App.js`:

```js
import React from 'react'
import { Provider } from 'react-redux'
import store from './app/store'
import MainScreen from './screens/MainScreen'

export default function App() {
  return (
    <Provider store={store}>
      <MainScreen />
    </Provider>
  )
}
```

## Как компоненты используют состояние Redux

Теперь вы подключили Redux к приложению, и можно использовать данные и actions.

### Получение состояния

Используйте хук `useSelector` для получения данных из store:

```js
import React from 'react'
import { View, Text } from 'react-native'
import { useSelector } from 'react-redux'

const CounterDisplay = () => {
  const count = useSelector((state) => state.counter.value) // Получаем значение из store

  return (
    <View>
      <Text>Текущее значение: {count}</Text>
    </View>
  )
}

export default CounterDisplay
```

### Отправка действий

Чтобы изменить state, используйте `useDispatch`:

```js
import React from 'react'
import { Button, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { increment, decrement } from '../features/counter/counterSlice'

const CounterButtons = () => {
  const dispatch = useDispatch()

  return (
    <View>
      <Button title="Увеличить" onPress={() => dispatch(increment())} />
      <Button title="Уменьшить" onPress={() => dispatch(decrement())} />
    </View>
  )
}

export default CounterButtons
```

## Асинхронные действия с Thunks

Часто требуется подгружать данные с сервера или работать с асинхронными API. В Redux Toolkit для этого есть `createAsyncThunk`.

### Пример загрузки данных

Давайте разберем, как получить данные с сервера и положить их в store.

В `features/users/usersSlice.js`:

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Асинхронный thunk для загрузки пользователей
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users')
  return response.json()
})

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle',  // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export default usersSlice.reducer
```

А теперь подсоедините этот reducer к store, как показано выше, и используйте actions в нужных компонентах.

## Архитектура проекта с Redux

Redux идеален для масштабных приложений. Вам не обязательно хранить абсолютно все в store — локальные состояния, такие как "открыт ли popover", удобно хранить внутри компонента. Глобальный store — для данных, которые важны для разных экранов или должны быть "долговечными" в рамках сессии пользователя (например, токен, тема, данные профиля, корзина).

Обычно проект разбивают на "срезы" (slices) по бизнес-сущностям:

- features/user/userSlice.js
- features/cart/cartSlice.js
- features/chat/chatSlice.js

Store комбинирует их все вместе.

## Использование middleware

Middleware в Redux — это функция, которая "перехватывает" actions до того, как они попадут в редьюсер. Например, с их помощью вы можете логировать действия, делать асинхронные вызовы, обрабатывать ошибки или писать кастомный логгер.

Redux Toolkit уже включает redux-thunk для асинхронных экшенов. Для кастомных middleware можно написать свой:

```js
const loggerMiddleware = storeAPI => next => action => {
  console.log('Dispatch:', action)
  const result = next(action)
  console.log('Next state:', storeAPI.getState())
  return result
}
```

Добавьте в store:

```js
const store = configureStore({
  reducer: {...},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
})
```

## Советы по производительности и организации кода

- Используйте `useSelector` только для того куска состояния, который реально нужен компоненту.
- Разделяйте логику по feature-модулям, не создавайте "монолитный" store.
- Пишите чистые редьюсеры — никаких побочных эффектов!
- Не храните в Redux тяжелые объекты (например, изображения) — используйте локальное состояние или файловое хранилище.
- Если приложение большое, попробуйте использовать библиотеку reselect для мемоизации селекторов — это уменьшит лишние перерисовки.
- Добавьте инструмент redux-devtools для отладки. Для React Native можно использовать такую библиотеку, как [react-native-debugger](https://github.com/jhen0409/react-native-debugger).

## Как организовать масштабируемое приложение на Redux

Вот пример организации структуры большого проекта:

```
/app
  /store.js
/features
  /auth
    /authSlice.js
  /profile
    /profileSlice.js
  /cart
    /cartSlice.js
/components
  /common
  /profile
/screens
  /MainScreen.js
  /ProfileScreen.js
```

Каждая бизнес-сущность — свой slice и папка с UI компонентами. Такой подход облегчает сопровождение кода и работу в команде.

## Интеграция с React Navigation

Если вы используете React Navigation, Redux отлично сочетается с ним. Например, статус авторизации, который определяет, какие экраны должен видеть пользователь, удобно хранить в store. Комплексная логика выхода или смены пользователя может опираться на данные Redux.

В компонентах можно использовать состояние store, чтобы контролировать навигацию, например:

```js
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

// Внутри компонента:
const isLoggedIn = useSelector(state => state.auth.isLoggedIn)
const navigation = useNavigation()

if (!isLoggedIn) {
  navigation.navigate('Login')
}
```

## Заключение

Redux — мощнейший инструмент управления состоянием в React Native, который отлично раскрывает себя на крупных и средних проектах. С помощью Redux вы получаете централизованное предсказуемое хранилище и удобные средства для работы с асинхронщиной. В современном стеке рекомендуется использовать Redux Toolkit — он избавляет от рутины и снижает риск ошибок при написании экшенов и редьюсеров.

Опираясь на приведенные примеры, вы сможете быстро интегрировать Redux в своё приложение, правильно организовать рост кода и сделать поддержку и развитие приложения проще и прозрачнее. Redux отлично документаирован, вокруг него — огромное сообщество и множество примеров.

Управление состоянием с помощью Redux — лишь одна из многих задач, с которыми сталкивается React Native разработчик. Чтобы создавать качественные приложения, важно понимать, как правильно настраивать окружение, создавать переиспользуемые компоненты, использовать навигацию и работать с нативными модулями. На нашем курсе [React Native и Expo Router](https://purpleschool.ru/course/react-native?utm_source=knowledgebase&utm_medium=article&utm_campaign=Upravlenie-sostoyaniem-s-pomoschyu-Redux-na-React-Native) вы найдете все необходимые знания и навыки. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир React Native прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы

### Как подключить redux-persist для сохранения состояния между запуском приложения?

Для этого установите пакет `redux-persist` (`npm install redux-persist`). Далее оберните ваш основной редьюсер в persistReducer и инициализируйте persistStore. Проверьте документацию [здесь](https://github.com/rt2zz/redux-persist).

```js
import { persistStore, persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { configureStore } from '@reduxjs/toolkit'

const persistConfig = {
  key: 'root',
  storage: AsyncStorage, // для React Native
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
})

const persistor = persistStore(store)
```

### Как сделать глобальный сброс всего состояния Redux?

Создайте отдельный action, например, `reset`, и в корневом редьюсере реагируйте на этот action, возвращая начальное состояние.

```js
const rootReducer = (state, action) => {
  if (action.type === 'app/reset') {
    return appInitialState // задайте начальное состояние вручную
  }
  return combinedReducer(state, action)
}
```

### Как протестировать редьюсеры и thunks?

Для unit-тестирования редьюсеров используйте jest и функции вроде `expect(reducer(prevState, action)).toEqual(newState)`. Для thunks — мокайте вызовы API c помощью jest.mock и проверяйте диспатчи (`dispatch`).

### Почему компонент не ререндерится после изменения state в Redux?

Проверьте, корректно ли обновляется объект состояния (важна иммутабельность!). При использовании Redux Toolkit мутировать state допустимо, но если пишете редьюсер руками, всегда возвращайте новый объект. Также удостоверьтесь, что селектор в useSelector действительно зависит от изменяемого значения.

### Как разделить большие редьюсеры на модули?

Организуйте разные редьюсеры в отдельные срезы с помощью `combineReducers` или через объект `reducer` в configureStore как отдельные поля. Например:

```js
const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    cart: cartReducer,
  },
})
```

Это делает код масштабируемым и легким для поддержки.
