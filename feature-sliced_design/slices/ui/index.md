---
metaTitle: Слайс UI ui-slice в современных интерфейсах
metaDescription: Подробное руководство по использованию Слайс UI ui-slice - архитектура состояния паттерны и практические примеры организации сложных интерфейсов
author: Олег Марков
title: Слайс UI ui-slice - архитектура состояния интерфейса
preview: Разберитесь как устроен Слайс UI ui-slice - от базовой структуры слайса и хранения состояния до организации модульного UI и интеграции с сервером
---

## Введение

Слайс UI (или `ui-slice`) — это подход к организации пользовательского интерфейса, в котором вы разбиваете весь UI на независимые фрагменты (слайсы), каждый со своим локальным состоянием, логикой и набором действий. Такой подход обычно опирается на идею "срезов" состояния (slice of state), и выстраивает вокруг них архитектуру интерфейса.

Смотрите, я покажу вам, как мыслить UI в терминах слайсов:

- есть общее состояние приложения;
- это состояние делится на отдельные логические участки — слайсы;
- каждый слайс отвечает за конкретную часть интерфейса и умеет сам себя:
  - отрисовывать;
  - обновлять по действиям пользователя;
  - синхронизировать с сервером.

В итоге вы получаете модульную, предсказуемую архитектуру, где каждый кусок UI можно развивать и тестировать отдельно.

В этой статье мы разберем:

- базовые принципы `ui-slice`;
- структуру типичного слайса;
- работу со стейтом, экшенами, эффектами;
- композицию слайсов и построение сложных экранов;
- интеграцию с сервером и обработку ошибок;
- практические примеры и типичные паттерны.

Я буду опираться на общий, фреймворк-независимый подход. Примеры кода будут написаны на TypeScript-подобном синтаксисе, но вы легко сможете адаптировать их под свою среду (React, Vue, Svelte, собственный UI-фреймворк).

---

## Что такое ui-slice и когда он нужен

### Основная идея ui-slice

Давайте начнем с определения. Под `ui-slice` будем понимать модуль, который объединяет:

- локальное состояние для части интерфейса;
- набор действий (events / actions), меняющих это состояние;
- эффекты (side effects) — запросы к серверу, взаимодействие с другими слайсами;
- представление (view) или, по крайней мере, привязку к компонентам интерфейса.

Типичный слайс отвечает за одну предметную область UI. Например:

- список задач;
- карточка профиля пользователя;
- корзина и мини-корзина в шапке;
- форма фильтров для каталога.

Слайс помогает провести четкую границу: что именно “владеет” частью состояния и кто имеет право его изменять.

### Проблемы, которые решает ui-slice

Если вы работали с крупными интерфейсами, вы наверняка сталкивались с такими проблемами:

- глобальный стейт разрастается и становится трудно поддерживаемым;
- изменения в одном месте ломают другое;
- логику сложно переиспользовать между похожими экранами;
- сложно тестировать: нужно поднимать весь UI, чтобы проверить один сценарий.

Слайс UI решает это за счет:

1. **Локализации логики**  
   Каждый слайс сам отвечает за свои данные и действия. В корневом модуле вы только “сшиваете” слайсы.

2. **Явной структуры**  
   Слайс — это стандартная форма: state + actions + effects (+ view). Не нужно каждый раз придумывать заново.

3. **Упрощенного тестирования**  
   Логику можно тестировать изолированно, мокая внешние зависимости.

4. **Повторного использования**  
   Один и тот же слайс можно встроить в разные экраны, передавая ему разные зависимости (например, разные API-клиенты или конфигурацию).

---

## Структура ui-slice

### Базовый каркас слайса

Давайте разберемся, из каких частей обычно состоит слайс UI. Я покажу вам минимальный, но довольно универсальный каркас:

```ts
// Тип состояния слайса
interface TodoSliceState {
  // Текущий список задач
  items: { id: string; title: string; completed: boolean }[]
  // Флаг загрузки данных с сервера
  isLoading: boolean
  // Текст ошибки при неудачном запросе
  error: string | null
}

// Доступные действия для работы с задачами
interface TodoSliceActions {
  // Инициализация слайса (например, загрузка данных)
  init: () => Promise<void>
  // Локальное добавление задачи
  addLocal: (title: string) => void
  // Переключение статуса выполненности
  toggleCompleted: (id: string) => void
  // Сохранение задачи на сервере
  saveItem: (id: string) => Promise<void>
}

// Описание всего слайса
interface TodoSlice {
  // Текущее состояние
  state: TodoSliceState
  // Набор действий
  actions: TodoSliceActions
  // Подписка на изменения (для UI)
  subscribe: (listener: (state: TodoSliceState) => void) => () => void
}
```

Здесь я описал общий контракт. Конкретная реализация может отличаться (например, `state` может жить в React `useState`, Vue `reactive` или в Redux). Важно, что у вас есть:

- типизированное состояние;
- формализованные действия;
- механизм подписки.

Теперь давайте посмотрим пример реализации такого слайса.

### Простая реализация слайса без фреймворков

Покажу вам, как можно реализовать этот слайс на чистом TypeScript с минимальным собственным стором:

```ts
// Создаем фабрику слайса задач
function createTodoSlice(api: { fetchTodos: () => Promise<any[]> }) {
  // Локальное состояние слайса
  let state: TodoSliceState = {
    items: [],
    isLoading: false,
    error: null,
  }

  // Список подписчиков на изменения состояния
  const listeners = new Set<(state: TodoSliceState) => void>()

  // Вспомогательная функция обновления состояния
  function setState(partial: Partial<TodoSliceState>) {
    // Объединяем старое состояние с новыми полями
    state = { ...state, ...partial }
    // Уведомляем всех подписчиков об изменении
    listeners.forEach((listener) => listener(state))
  }

  // Реализуем действия
  const actions: TodoSliceActions = {
    async init() {
      // Устанавливаем флаг загрузки и сбрасываем ошибку
      setState({ isLoading: true, error: null })
      try {
        // Запрашиваем данные с сервера
        const todos = await api.fetchTodos()
        // Обновляем список задач в состоянии
        setState({ items: todos, isLoading: false })
      } catch (e: any) {
        // В случае ошибки сохраняем сообщение
        setState({ error: e.message ?? 'Failed to load todos', isLoading: false })
      }
    },
    addLocal(title: string) {
      // Добавляем новую задачу только локально
      const newItem = {
        id: Math.random().toString(36).slice(2),
        title,
        completed: false,
      }
      // Обновляем массив задач
      setState({ items: [...state.items, newItem] })
    },
    toggleCompleted(id: string) {
      // Переключаем флаг completed у задачи с нужным id
      setState({
        items: state.items.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      })
    },
    async saveItem(id: string) {
      // Здесь могла бы быть логика сохранения на сервер
      // Для примера просто логируем действие
      console.log('Saving item to server', id)
      // В реальном коде вы бы сделали api.saveTodo(...)
    },
  }

  // Функция подписки на изменения состояния
  function subscribe(listener: (state: TodoSliceState) => void) {
    // Добавляем подписчика
    listeners.add(listener)
    // Сразу вызываем его с текущим состоянием
    listener(state)
    // Возвращаем функцию отписки
    return () => {
      listeners.delete(listener)
    }
  }

  // Возвращаем весь слайс
  const slice: TodoSlice = {
    get state() {
      // Делаем состояние доступным только для чтения
      return state
    },
    actions,
    subscribe,
  }

  return slice
}
```

Как видите, этот код реализует полноценный `ui-slice` без привязки к конкретному UI-фреймворку. Вы легко можете:

- подписаться на `subscribe` из React-компонента;
- использовать этот же слайс в Node.js для тестов;
- подменять зависимость `api` при необходимости.

---

## Создание и инициализация ui-slice

### Фабрика слайсов и зависимости

В реальном приложении слайсы редко создаются "в лоб". Чаще вы делаете фабрику, которая:

- принимает внешние зависимости (API, конфигурацию, авторизацию);
- создает слайс с учетом этих зависимостей.

Давайте разберемся на примере.

```ts
// Описание зависимостей, которые нужны слайсу задач
interface TodoSliceDeps {
  // Клиент для запросов к API
  api: {
    fetchTodos: () => Promise<any[]>
    createTodo: (title: string) => Promise<any>
  }
  // Например, логгер для ошибок
  logger: {
    error: (msg: string, extra?: any) => void
  }
}

// Фабрика создания слайса задач
function createTodoSliceWithDeps(deps: TodoSliceDeps): TodoSlice {
  // Достаем зависимости для удобства
  const { api, logger } = deps

  let state: TodoSliceState = {
    items: [],
    isLoading: false,
    error: null,
  }

  const listeners = new Set<(state: TodoSliceState) => void>()

  function setState(partial: Partial<TodoSliceState>) {
    state = { ...state, ...partial }
    listeners.forEach((fn) => fn(state))
  }

  const actions: TodoSliceActions = {
    async init() {
      setState({ isLoading: true, error: null })
      try {
        const todos = await api.fetchTodos()
        setState({ items: todos, isLoading: false })
      } catch (e: any) {
        logger.error('Failed to load todos', e)
        setState({ error: 'Не удалось загрузить список задач', isLoading: false })
      }
    },
    addLocal(title: string) {
      const newItem = {
        id: Math.random().toString(36).slice(2),
        title,
        completed: false,
      }
      setState({ items: [...state.items, newItem] })
    },
    toggleCompleted(id: string) {
      setState({
        items: state.items.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      })
    },
    async saveItem(id: string) {
      const item = state.items.find((i) => i.id === id)
      if (!item) return
      try {
        // Вызываем API для создания или обновления задачи
        await api.createTodo(item.title)
      } catch (e: any) {
        logger.error('Failed to save todo', { id, error: e })
        setState({ error: 'Ошибка при сохранении задачи' })
      }
    },
  }

  function subscribe(listener: (state: TodoSliceState) => void) {
    listeners.add(listener)
    listener(state)
    return () => listeners.delete(listener)
  }

  return {
    get state() {
      return state
    },
    actions,
    subscribe,
  }
}
```

Здесь ключевая идея — вы передаете зависимости в слайс извне, а не импортируете их напрямую. Это облегчает тестирование и повторное использование.

### Инициализация в "корне" приложения

Теперь давайте посмотрим, как этот слайс может подключаться в основном модуле приложения:

```ts
// Функция инициализации всего UI
function initUI() {
  // Создаем глобальные зависимости
  const apiClient = {
    // Запрос списка задач
    fetchTodos: () => fetch('/api/todos').then((r) => r.json()),
    // Создание новой задачи
    createTodo: (title: string) =>
      fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
        headers: { 'Content-Type': 'application/json' },
      }).then((r) => r.json()),
  }

  const logger = {
    // Простая обертка над console.error
    error(msg: string, extra?: any) {
      console.error(msg, extra)
    },
  }

  // Создаем слайс задач
  const todoSlice = createTodoSliceWithDeps({ api: apiClient, logger })

  // Инициализируем его (например, при старте приложения)
  todoSlice.actions.init()

  // Дальше вы можете передать todoSlice в UI-фреймворк
  return { todoSlice }
}
```

Такой подход позволяет вам централизованно управлять созданием слайсов, а также при необходимости заменять зависимости (например, на моки в тестах или на другой API в сборке для админки).

---

## ui-slice и представление (View)

### Подписка на состояние в React

Давайте посмотрим, как подключить ui-slice к React. Здесь я размещаю пример, чтобы вам было проще понять:

```tsx
// Хук для подписки на состояние слайса в React
function useSliceState<S>(slice: { subscribe: (l: (s: S) => void) => () => void }) {
  // Локальный стейт React-компонента
  const [state, setState] = React.useState<S>(() => {
    // В реальном коде здесь можно считать начальное состояние,
    // но для простоты мы просто инициализируем пустым объектом и
    // сразу же обновим его в subscribe
    return {} as S
  })

  React.useEffect(() => {
    // Подписываемся на изменения состояния слайса
    const unsubscribe = slice.subscribe((nextState: S) => {
      // Обновляем локальный стейт React
      setState(nextState)
    })
    // Возвращаем функцию отписки при размонтировании
    return unsubscribe
  }, [slice])

  return state
}

// Компонент списка задач
function TodoListView({ slice }: { slice: TodoSlice }) {
  // Получаем состояние слайса через хук
  const state = useSliceState<TodoSliceState>(slice)
  const { items, isLoading, error } = state

  // Достаем действия для удобства
  const { addLocal, toggleCompleted } = slice.actions

  if (isLoading) {
    // Отображаем индикатор загрузки
    return <div>Загрузка...</div>
  }

  if (error) {
    // Показываем текст ошибки
    return <div>Ошибка - {error}</div>
  }

  return (
    <div>
      <button
        onClick={() => {
          // Добавляем пример задачи по клику
          addLocal('Новая задача')
        }}
      >
        Добавить задачу
      </button>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => {
                  // Переключаем выполненность задачи
                  toggleCompleted(item.id)
                }}
              />
              {item.title}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Как видите, этот код выполняет простую задачу: он подписывает React-компонент на изменения состояния слайса и использует действия слайса напрямую.

### Представление слайса без фреймворка

Если вы пишете UI без React/Vue, вы все равно можете использовать ui-slice. Например, с ванильным DOM:

```ts
// Рендер списка задач в контейнер DOM
function renderTodoList(container: HTMLElement, slice: TodoSlice) {
  // Функция перерисовки на основе состояния
  function render(state: TodoSliceState) {
    // Очищаем контейнер перед перерисовкой
    container.innerHTML = ''

    // Если идет загрузка - показываем текст
    if (state.isLoading) {
      container.textContent = 'Загрузка...'
      return
    }

    // Если есть ошибка - показываем ее
    if (state.error) {
      container.textContent = 'Ошибка - ' + state.error
      return
    }

    // Создаем кнопку добавления задачи
    const button = document.createElement('button')
    button.textContent = 'Добавить задачу'
    button.onclick = () => slice.actions.addLocal('Новая задача')
    container.appendChild(button)

    // Создаем список задач
    const ul = document.createElement('ul')
    state.items.forEach((item) => {
      const li = document.createElement('li')

      const label = document.createElement('label')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = item.completed
      checkbox.onchange = () => slice.actions.toggleCompleted(item.id)

      label.appendChild(checkbox)
      label.append(item.title)
      li.appendChild(label)
      ul.appendChild(li)
    })
    container.appendChild(ul)
  }

  // Подписываемся на состояние слайса и сразу рендерим
  const unsubscribe = slice.subscribe(render)

  // Возвращаем функцию для отписки и очистки
  return () => {
    unsubscribe()
    container.innerHTML = ''
  }
}
```

Этот пример показывает: `ui-slice` — это просто независимый модуль состояния. Вы можете подвязать его к любому способу отрисовки.

---

## Композиция ui-slice: сложные экраны из простых модулей

### Зачем нужна композиция

Один слайс хорош, но реальное приложение — это обычно десятки или сотни слайсов. Вам нужно:

- собирать сложные экраны из нескольких слайсов;
- делиться состоянием между слайсами;
- при этом не терять модульность.

Давайте посмотрим, как можно организовать композицию.

### Корневой слайс (root slice)

Часто создают корневой "слайс-приложение", который объединяет несколько под-слайсов:

```ts
// Описание корневого состояния
interface AppState {
  // Слайс задач
  todos: TodoSlice
  // Слайс профиля пользователя
  profile: ProfileSlice
}

// Фабрика корневого слайса
function createAppSlice(deps: AppDeps): AppState {
  // Создаем слайс задач
  const todoSlice = createTodoSliceWithDeps({
    api: deps.todoApi,
    logger: deps.logger,
  })

  // Создаем слайс профиля
  const profileSlice = createProfileSlice({
    api: deps.profileApi,
    logger: deps.logger,
  })

  // Возвращаем объект с вложенными слайсами
  return {
    todos: todoSlice,
    profile: profileSlice,
  }
}
```

В этом примере `AppState` не является стором сам по себе. Это просто объект, который содержит несколько слайсов. Каждый слайс по-прежнему:

- изолирован по состоянию;
- получает только свои зависимости;
- управляет своими действиями.

### Взаимодействие слайсов между собой

Иногда один слайс должен реагировать на изменения другого. Например, слайс профиля может влиять на фильтрацию задач (показывать только задачи конкретного пользователя).

Здесь у вас есть два варианта:

1. Связи "сверху" — когда корневой уровень управляет тем, какие данные передаются в слайсы.
2. Прямая подписка одного слайса на другой (аккуратнее с этим).

Давайте посмотрим пример более безопасного варианта — когда корневой модуль связывает их:

```ts
// Депсы для слайса фильтра задач
interface TodoFilterDeps {
  // Источник профиля пользователя
  profileSlice: ProfileSlice
}

// Слайс фильтра списка задач
function createTodoFilterSlice(deps: TodoFilterDeps) {
  const { profileSlice } = deps

  // Локальное состояние фильтра
  let state = {
    // Идентификатор пользователя для фильтрации
    userId: null as string | null,
  }

  const listeners = new Set<(s: typeof state) => void>()

  function setState(partial: Partial<typeof state>) {
    state = { ...state, ...partial }
    listeners.forEach((fn) => fn(state))
  }

  // Подписываемся на изменения профиля
  profileSlice.subscribe((profileState) => {
    // Если пользователь изменился, обновляем фильтр
    if (profileState.currentUserId !== state.userId) {
      setState({ userId: profileState.currentUserId })
    }
  })

  return {
    get state() {
      return state
    },
    subscribe(listener: (s: typeof state) => void) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
  }
}
```

Здесь вы видите, как один слайс (`TodoFilterSlice`) “слушает” другой (`ProfileSlice`), но делает это через явно переданную зависимость. Это важный момент: вы не скрываете связи через глобальные импорты, а работаете с ними как с зависимостями.

---

## Работа с асинхронностью и эффектами

### Эффекты внутри слайса

Асинхронные действия (запросы к API, таймеры, веб-сокеты) в контексте ui-slice обычно называют эффектами. Как правило:

- вы не смешиваете эффекты и чистую логику;
- эффекты реализуются в действиях (actions), которые обновляют состояние.

Давайте посмотрим пример более сложного эффекта с повторной загрузкой:

```ts
interface TodoSliceActionsWithReload extends TodoSliceActions {
  // Повторная попытка загрузки
  reload: () => Promise<void>
}

function extendTodoSliceWithReload(todoSlice: TodoSlice): TodoSlice & {
  actions: TodoSliceActionsWithReload
} {
  // Берем ссылку на старые действия
  const baseActions = todoSlice.actions

  const actions: TodoSliceActionsWithReload = {
    ...baseActions,
    async reload() {
      // Просто вызываем init повторно
      await baseActions.init()
    },
  }

  // Возвращаем новый слайс с расширенным набором действий
  return {
    ...todoSlice,
    actions,
  }
}
```

Здесь я показываю еще одну идею: слайсы можно расширять. Вы берете базовый слайс и добавляете новые действия поверх. Это удобно, если вы хотите переиспользовать одну и ту же логику в разных контекстах, слегка ее модифицируя.

### Управление конкурентными запросами

Еще одна частая задача — ограничить параллельные запросы и избежать гонок состояний. Например, если пользователь быстро переключает фильтры, вы не хотите, чтобы более поздний ответ перезаписал более ранний.

Давайте посмотрим, как это можно реализовать в слайсе:

```ts
interface SearchSliceState {
  // Текущая строка поиска
  query: string
  // Результаты поиска
  results: any[]
  // Флаг загрузки
  isLoading: boolean
  // Идентификатор последнего запроса
  requestId: number
}

interface SearchSliceActions {
  // Установка строки поиска
  setQuery: (q: string) => void
  // Выполнение поиска
  search: (q: string) => Promise<void>
}

function createSearchSlice(api: { search: (q: string) => Promise<any[]> }) {
  let state: SearchSliceState = {
    query: '',
    results: [],
    isLoading: false,
    requestId: 0,
  }

  const listeners = new Set<(s: SearchSliceState) => void>()

  function setState(partial: Partial<SearchSliceState>) {
    state = { ...state, ...partial }
    listeners.forEach((fn) => fn(state))
  }

  const actions: SearchSliceActions = {
    setQuery(q: string) {
      setState({ query: q })
    },
    async search(q: string) {
      // Увеличиваем id запроса
      const currentRequestId = state.requestId + 1
      setState({ requestId: currentRequestId, isLoading: true })

      try {
        // Делаем запрос к API
        const results = await api.search(q)
        // Проверяем, что это все еще актуальный запрос
        if (state.requestId !== currentRequestId) {
          // Если нет - игнорируем результат
          return
        }
        // Обновляем состояние только если запрос актуальный
        setState({ results, isLoading: false })
      } catch (e) {
        // При ошибке также проверяем актуальность
        if (state.requestId !== currentRequestId) return
        setState({ isLoading: false })
      }
    },
  }

  return {
    get state() {
      return state
    },
    actions,
    subscribe(listener: (s: SearchSliceState) => void) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
  }
}
```

Обратите внимание, как этот фрагмент кода решает задачу гонок:

- каждый новый запрос получает свой `requestId`;
- обновление состояния происходит только если `requestId` совпадает;
- устаревшие ответы никак не влияют на UI.

---

## Паттерны проектирования ui-slice

### Паттерн "умный слайс — глупый компонент"

Смысл этого паттерна в том, что:

- логика (какие данные грузить, как обрабатывать клик, когда показывать ошибку) живет в слайсе;
- UI-компонент только отображает состояние и вызывает действия.

Покажу вам, как это выглядит на практике:

```tsx
// Умный слайс управляет логикой
const todoSlice = createTodoSliceWithDeps({ api, logger })

// Глупый компонент только рендерит данные
function TodoListView({ slice }: { slice: TodoSlice }) {
  const state = useSliceState<TodoSliceState>(slice)
  const { items, isLoading, error } = state
  const { addLocal, toggleCompleted } = slice.actions

  // Вся логика была заранее принята внутри слайса
  // Здесь остается только отображение.
  ...
}
```

Этот подход облегчает сопровождение: когда вы меняете бизнес-логику, вы почти не трогаете UI-компоненты.

### Паттерн "функциональные слайсы" (slice as function)

Иногда удобно описывать слайс как "чистую функцию редьюсера" + тонкий слой эффектов. В этом плане `ui-slice` близок к Redux-подходу, но не обязательно завязан на него.

Структура может быть такой:

- `reducer(state, event) => newState` — чистая функция;
- `effects(event, state) => void` — побочные эффекты.

Вот упрощенный пример:

```ts
type TodoEvent =
  | { type: 'add'; title: string }
  | { type: 'toggle'; id: string }
  | { type: 'loaded'; items: any[] }

function todoReducer(state: TodoSliceState, event: TodoEvent): TodoSliceState {
  // Это чистая функция преобразования состояния
  switch (event.type) {
    case 'add':
      return {
        ...state,
        items: [
          ...state.items,
          {
            id: Math.random().toString(36).slice(2),
            title: event.title,
            completed: false,
          },
        ],
      }
    case 'toggle':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === event.id ? { ...i, completed: !i.completed } : i
        ),
      }
    case 'loaded':
      return {
        ...state,
        items: event.items,
      }
    default:
      return state
  }
}
```

Дальше вы можете обернуть этот редьюсер в слайс, который добавляет эффекты:

```ts
function createTodoSliceFunctional(api: { fetchTodos: () => Promise<any[]> }): TodoSlice {
  let state: TodoSliceState = {
    items: [],
    isLoading: false,
    error: null,
  }

  const listeners = new Set<(s: TodoSliceState) => void>()

  function apply(event: TodoEvent) {
    // Применяем редьюсер для получения нового состояния
    state = todoReducer(state, event)
    // Уведомляем подписчиков
    listeners.forEach((fn) => fn(state))
  }

  const actions: TodoSliceActions = {
    async init() {
      // Ставим флаг загрузки без редьюсера для краткости
      state = { ...state, isLoading: true }
      listeners.forEach((fn) => fn(state))

      try {
        const items = await api.fetchTodos()
        // Применяем событие 'loaded' для обновления стейта
        apply({ type: 'loaded', items })
        state = { ...state, isLoading: false }
        listeners.forEach((fn) => fn(state))
      } catch {
        state = { ...state, isLoading: false, error: 'Ошибка загрузки' }
        listeners.forEach((fn) => fn(state))
      }
    },
    addLocal(title: string) {
      apply({ type: 'add', title })
    },
    toggleCompleted(id: string) {
      apply({ type: 'toggle', id })
    },
    async saveItem(id: string) {
      // Здесь могла быть логика сохранения
      console.log('Save item', id)
    },
  }

  return {
    get state() {
      return state
    },
    actions,
    subscribe(listener: (s: TodoSliceState) => void) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
  }
}
```

Такой паттерн хорошо помогает отделить чистую бизнес-логику от инфраструктуры и эффектов.

---

## Типичные ошибки при работе с ui-slice и как их избежать

### Ошибка 1. Слишком "толстые" слайсы

Когда вы начинаете использовать `ui-slice`, очень легко сделать один гигантский слайс "на весь экран". В нем будет:

- много стейта;
- много действий;
- запутанные зависимости.

Как это выглядит в коде:

```ts
// Плохой пример - один слайс управляет всем экраном
interface HugeDashboardSliceState {
  // Десятки полей состояния для разных виджетов
  ...
}
```

Что лучше сделать:

- разделить на мелкие, осмысленные слайсы (по доменам);
- собрать их в один экран через композицию (root slice или контейнерный модуль).

### Ошибка 2. Глобальные одиночки

Вторая типичная ошибка — создавать слайсы как глобальные синглтоны и импортировать их откуда угодно. Это ухудшает тестируемость и усложняет понимание зависимостей.

Проблемный пример:

```ts
// Плохой пример - глобальный слайс
export const todoSlice = createTodoSliceWithDeps(realDeps)

// В любом модуле просто импортируют todoSlice
```

Лучше:

- создавать слайсы в корневом модуле;
- передавать их вниз через параметры, контексты, DI-контейнер.

### Ошибка 3. Побочные эффекты в UI-компонентах вместо слайса

Часто в компонентах начинают писать:

- запросы к API;
- обработку ошибок;
- сложную бизнес-логику.

В итоге компонент становится трудночитаемым.

Решение: перемещать логику в `ui-slice`, как мы делали выше. Компонент должен только:

- подписываться на состояние;
- вызывать действия.

### Ошибка 4. Смешивание доменной и UI-логики

Иногда в слайс UI начинают складывать доменную логику (например, правила ценообразования, бизнес-процессы), а не только "логика отображения". Это делает модуль UI слишком важным и мешает повторному использованию бизнес-логики в других контекстах.

Практический совет:

- чисто доменные правила лучше вынести в отдельный модуль (domain / core);
- слайс UI должен использовать эти правила, но не содержать их внутри.

---

## Заключение

Слайс UI (`ui-slice`) — это удобный и достаточно универсальный подход к построению сложных интерфейсов:

- вы разбиваете UI на независимые слайсы, каждый со своим состоянием и действиями;
- выстраиваете вокруг слайсов модульную архитектуру, где логика отделена от представления;
- получаете предсказуемое поведение, удобные тесты и возможность повторного использования модулей.

Основные идеи, на которые стоит опираться:

- каждый слайс — это четко определенный контур ответственности;
- зависимости (API, логгеры, другие слайсы) передаются явно;
- асинхронность и эффекты реализуются внутри слайсов, а не в UI;
- сложные экраны собираются через композицию нескольких слайсов.

Если вы будете проектировать интерфейсы в терминах слайсов, разделяя их по предметным областям и аккуратно управляя зависимостями, код станет проще масштабировать и поддерживать.

---

## Частозадаваемые технические вопросы по теме статьи

### Как хранить состояние нескольких экземпляров одного и того же ui-slice (например, несколько виджетов задачи на экране)

Часто нужно отрендерить несколько одинаковых блоков, у каждого из которых свое состояние. Здесь есть два варианта:

1. Создавать отдельный экземпляр слайса на каждый виджет (через фабрику `createTodoSliceWithDeps`). Тогда вы просто храните список слайсов в массиве и передаете их соответствующим компонентам.
2. Хранить состояние в одном слайсе, но структурировать его как словарь по идентификатору виджета:
   - в `state` вместо `items: []` завести `byWidgetId: Record<string, WidgetState>`;
   - действия принимать `widgetId` и менять только нужный сегмент стейта;
   - в UI вызывать `slice.actions.update(widgetId, payload)`.

Первый способ проще по изоляции, второй лучше по производительности на очень большом количестве экземпляров.

### Как правильно типизировать ui-slice при использовании в разных фреймворках

Рекомендуется:

- выделить общий интерфейс слайса (`state`, `actions`, `subscribe`);
- использовать дженерики для состояния и действий:
  - `UISlice<S, A> = { state: S; actions: A; subscribe(...): ... }`;
- поверх этого строить адаптеры: хук для React, композабл для Vue и т. д.

Так вы сможете переиспользовать один и тот же слайс в разных средах, не завязывая типы на конкретный фреймворк.

### Как реализовать "undo" и "redo" для слайса

Самый прямой путь:

1. Внутри слайса хранить историю состояний:
   - `past: S[]`, `present: S`, `future: S[]`;
2. Перед каждым изменением состояния:
   - пушить текущее `present` в `past`;
   - очищать `future`;
3. Для `undo`:
   - брать последнее состояние из `past`;
   - переносить текущее `present` в `future`;
4. Для `redo`:
   - брать состояние из `future`;
   - переносить текущее `present` в `past`.

Важно ограничить длину истории (например, 50 шагов), чтобы не расходовать слишком много памяти.

### Как тестировать ui-slice без поднятия реального UI

Алгоритм такой:

1. В тесте создаете слайс через фабрику, передавая моковые зависимости (fake API, fake logger).
2. Вызываете действия слайса (`actions`), как это делает UI.
3. Читаете `slice.state` или подписываетесь через `subscribe`, чтобы отследить изменения.
4. Проверяете, что состояние и вызовы зависимостей соответствуют ожиданиям.

Важно, что вам не нужно рендерить компоненты — вы тестируете чистую логику слайса.

### Как разделять ui-slice на подмодули в монорепозитории

Практично организовать структуру так:

- `packages/ui-slices` — набор базовых слайсов без привязки к фреймворкам (только логика);
- `packages/ui-react` — адаптеры слайсов под React (хуки, провайдеры);
- `packages/ui-vue` — адаптеры под Vue;
- `apps/web` — конкретное приложение, где вы связываете слайсы, зависимости и роутинг.

Сами слайсы при этом не зависят от конкретного приложения и могут переиспользоваться между несколькими фронтендами.