---
metaTitle: Программная навигация в веб и мобильных приложениях
metaDescription: Разбираем программную навигацию в приложениях - как управлять переходами между экранами и страницами из кода какие есть подходы и подводные камни
author: Олег Марков
title: Программная навигация - что это такое и как с ней работать в современных приложениях
preview: Исследуем программную навигацию в веб и мобильной разработке - принципы реализации паттерны и практические примеры для React SPA и мобильных стеков
---

## Введение

Программная навигация (programmatic navigation) — это переходы между экранами или страницами, которые инициируются не пользователем напрямую (клик по ссылке, нажатие кнопки "Назад" в браузере), а кодом приложения. 

Вы вызываете функцию навигации, и приложение само меняет текущий экран, маршрут, URL, состояние истории. Такой подход используется повсюду:

- редирект на страницу логина, если пользователь не авторизован
- переход на "спасибо за заказ" после успешной оплаты
- перенаправление в "личный кабинет" после регистрации
- пошаговые мастера (wizard), где следующий шаг зависит от данных

Смотрите, я покажу вам, как на практике устроена программная навигация, какие бывают варианты в вебе (SPA, React Router, Next.js) и в мобильных приложениях (React Native как представитель). По пути разберем типичные проблемы: потеря истории, бесконечные редиректы, работа с query-параметрами, защита маршрутов.

Давайте начнем с общей модели, а затем перейдем к конкретным примерам.

---

## Базовые принципы программной навигации

### Что такое навигация с точки зрения архитектуры

Навигация — это переход между состояниями интерфейса. Если формально, то это:

- текущее состояние маршрута (URL, экран, параметры)
- история состояний (куда пользователь уже ходил)
- действия навигации (go, push, replace, back и т.п.)

Программная навигация — это вызов функций, которые изменяют это состояние. Обычно это:

- push — добавить новый маршрут в историю и перейти к нему
- replace — заменить текущий маршрут на новый
- back / goBack — вернуться назад
- go(n) — перейти на n шагов в истории
- navigate(name, params) — в мобильных стеках

Важно понимать, что навигация — это не только "смена картинки". Меняется:

- URL и/или стек экранов
- состояние истории (можно вернуться назад или нет)
- иногда — глобальное состояние приложения (например, активный раздел)

### Когда нужна именно программная навигация

Давайте перечислим типичные ситуации, когда без программной навигации не обойтись:

- Условные переходы  
  Переход зависит от результата запроса или проверки прав доступа.

- Навигация по завершении действия  
  После успешного сохранения формы вы перенаправляете на другой экран.

- Редиректы при инициализации  
  При входе на страницу вы сразу проверяете токен и перенаправляете.

- Навигация из эффектов или сервисов  
  Например, глобальный обработчик 401 (Unauthorized) отправляет на логин.

- Глубокие ссылки (deep-links)  
  Когда надо не просто перейти по URL, а, например, развернуть нужный таб и открыть модалку.

Теперь давайте посмотрим, как это выглядит в коде на конкретных технологиях.

---

## Программная навигация в браузере: History API

Прежде чем переходить к фреймворкам, полезно понимать, как это устроено на базовом уровне в браузере.

### Основные методы History API

Здесь я размещаю пример, чтобы вы увидели базовые операции:

```js
// Переход на новую "страницу" без перезагрузки
history.pushState(
  { from: 'home' },   // объект состояния - можно хранить любые данные
  '',                 // заголовок (браузеры почти не используют)
  '/profile'          // новый URL
)

// Замена текущей записи в истории
history.replaceState(
  { from: 'login' },  // новое состояние
  '',                 // заголовок
  '/dashboard'        // новый URL
)

// Переход назад
history.back()

// Переход вперед
history.forward()

// Переход на n шагов (отрицательное значение - назад)
history.go(-2)
```

Комментарии в коде подсказывают вам, что происходит в каждом вызове.

Важно: History API не рендерит интерфейс. Вы сами должны:

- слушать событие `popstate` (нажатие "Назад" / "Вперед")
- читать `location.pathname`
- обновлять интерфейс в зависимости от маршрута

Фреймворки просто оборачивают эти вызовы в более удобные API. Давайте теперь перейдем к React Router как к одному из самых распространенных примеров.

---

## Программная навигация в React Router

React Router (v6 и выше) предоставляет удобное API для программной навигации в SPA.

### Хук useNavigate

Основной способ навигации в функциональных компонентах — хук `useNavigate`.

Давайте разберемся на простом примере:

```jsx
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate() // получаем функцию навигации

  async function handleLogin() {
    // Здесь вы выполняете запрос на авторизацию
    const success = true // для примера считаем, что логин успешен

    if (success) {
      // Переход в личный кабинет
      navigate('/dashboard') // добавит новый маршрут в историю
    }
  }

  return (
    <button onClick={handleLogin}>
      Войти
    </button>
  )
}

export default LoginPage
```

Комментарии:

- `useNavigate` возвращает функцию `navigate`
- вызов `navigate('/dashboard')` аналогичен `history.pushState` на уровне браузера
- пользователь сможет нажать "Назад" и вернуться к логину

### push и replace в React Router

По умолчанию `navigate(path)` делает push. Если вам нужно заменить текущий маршрут (без возможности вернуться назад), используйте опцию `replace`.

Смотрите пример:

```jsx
function LoginPage() {
  const navigate = useNavigate()

  async function handleLogin() {
    const success = true

    if (success) {
      // Здесь мы заменяем текущий маршрут, чтобы пользователь
      // не вернулся на /login кнопкой "Назад"
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <button onClick={handleLogin}>
      Войти
    </button>
  )
}
```

Это типичный сценарий для страниц логина, регистрации, страницы "спасибо".

### Относительная навигация и шаги истории

React Router позволяет навигировать не только по строковым путям, но и по "шагам" истории.

Пример:

```jsx
function WizardNavigation() {
  const navigate = useNavigate()

  function handlePrevious() {
    // Возвращаемся на один шаг назад в истории
    navigate(-1) // аналог history.back()
  }

  function handleNext() {
    // Идем вперед на один шаг, если история позволяет
    navigate(1) // аналог history.forward()
  }

  return (
    <>
      <button onClick={handlePrevious}>Назад</button>
      <button onClick={handleNext}>Вперед</button>
    </>
  )
}
```

Обратите внимание, как этот фрагмент кода решает задачу управления историей, не привязываясь к конкретным URL.

### Навигация с параметрами и query-строкой

Частая задача — передать какие-то данные в URL:

- параметры маршрута (например, `/users/:id`)
- query-параметры (`?page=2&sort=asc`)

Смотрите, я покажу вам, как это сделать.

#### Переход на маршрут с параметром

```jsx
function UsersList() {
  const navigate = useNavigate()

  function openUser(id) {
    // Формируем путь с параметром id
    navigate(`/users/${id}`)
  }

  return (
    <ul>
      <li onClick={() => openUser(10)}>Пользователь 10</li>
      <li onClick={() => openUser(11)}>Пользователь 11</li>
    </ul>
  )
}
```

#### Переход с query-параметрами

Самый понятный способ — использовать URLSearchParams:

```jsx
function ProductsFilter({ page, sort }) {
  const navigate = useNavigate()

  function applyFilter(newPage, newSort) {
    // Собираем query-строку вручную
    const params = new URLSearchParams()
    params.set('page', String(newPage))
    params.set('sort', newSort)

    // Переходим на нужный маршрут с query-строкой
    navigate(`/products?${params.toString()}`)
  }

  return (
    <button onClick={() => applyFilter(2, 'price_asc')}>
      Показать вторую страницу, сортировать по цене
    </button>
  )
}
```

Комментарии:

- вы явно формируете строку параметров
- в таком виде URL можно копировать, шарить и сохранять

### Навигация вне компонентов: синглтон history

Иногда нужно вызывать навигацию из места, где React-хуки недоступны:

- сервисы API
- Redux middleware
- обработчики ошибок

В React Router v6 удобнее всего создать обертку вокруг `navigate` и прокинуть ее в контекст, но есть и подход с "кастомной" history.

Покажу вам один из рабочих вариантов (для v6 с unstable_HistoryRouter):

```jsx
// history.js
import { createBrowserHistory } from 'history'

// Создаем общий объект истории
export const appHistory = createBrowserHistory()
```

```jsx
// App.jsx
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import { appHistory } from './history'

function App() {
  return (
    // Подключаем кастомную историю к React Router
    <HistoryRouter history={appHistory}>
      {/* Здесь ваши роуты */}
    </HistoryRouter>
  )
}

export default App
```

```js
// apiClient.js
import { appHistory } from './history'

// Пример глобальной обработки 401 Unauthorized
async function apiRequest(url, options) {
  const response = await fetch(url, options)

  if (response.status === 401) {
    // Выполняем программную навигацию из "нестандартного" места
    appHistory.replace('/login') // заменяем маршрут и отправляем на логин
  }

  return response
}
```

Комментарии:

- вы создаете единый объект `appHistory`
- подключаете его к `HistoryRouter`
- далее можете вызывать `appHistory.push` или `appHistory.replace` в любом модуле

---

## Программная навигация в Next.js (App Router)

Next.js (с новым App Router на основе `/app`) тоже предоставляет удобные средства программной навигации.

### useRouter и router.push/replace

В клиентских компонентов Next.js используется `useRouter` из `next/navigation`.

Давайте посмотрим пример:

```tsx
// app/login/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter() // получаем объект роутера

  async function handleLogin() {
    const success = true

    if (success) {
      // Переход в личный кабинет - добавляем новый URL в историю
      router.push('/dashboard')
    }
  }

  return (
    <button onClick={handleLogin}>
      Войти
    </button>
  )
}
```

Если нужно заменить текущий URL (без возврата назад), используйте `router.replace`:

```tsx
router.replace('/dashboard')
```

### Переход с query-параметрами

Здесь вы, как и раньше, можете формировать URL вручную:

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))

    // Здесь мы формируем новый URL и навигируем
    router.push(`/products?${params.toString()}`)
  }

  return (
    <button onClick={() => setPage(2)}>
      Перейти на вторую страницу
    </button>
  )
}
```

Комментарии:

- `useSearchParams` дает вам текущие query-параметры
- вы копируете их, меняете нужные и делаете `router.push` с новым URL

### Серверные редиректы в Next.js: redirect

Особенность Next.js — возможность делать программную навигацию на сервере, до рендера страницы.

Смотрите пример защиты маршрута:

```tsx
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '../lib/session'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    // Серверный редирект - пользователь даже не увидит /dashboard
    redirect('/login')
  }

  return <div>Личный кабинет</div>
}
```

Комментарии:

- `redirect` останавливает выполнение и отправляет редирект
- пользователь сразу оказывается на `/login`, не видя промежуточного состояния

---

## Программная навигация в мобильных приложениях (React Native Navigation)

Чтобы не распыляться по всем существующим стекам, возьмем React Navigation как типичный пример мобильной навигации.

### Базовый стек и функции навигации

React Navigation предоставляет объект `navigation` с методами:

- navigate(screenName, params)
- push(screenName, params)
- replace(screenName, params)
- goBack()
- reset(state)

Давайте посмотрим, как это выглядит:

```tsx
// Пример экрана авторизации в React Native
function LoginScreen({ navigation }) {
  async function handleLogin() {
    const success = true

    if (success) {
      // Здесь мы переходим на экран Home
      navigation.replace('Home') 
      // Используем replace чтобы нельзя было вернуться на Login
    }
  }

  return (
    <Button title="Войти" onPress={handleLogin} />
  )
}
```

Комментарии:

- `navigation.replace` заменяет текущий экран в стеке
- `navigation.navigate` добавил бы новый, и "Назад" вернул бы на логин

### Навигация с параметрами

В мобильных приложениях параметры чаще передаются не через URL, а через объект params.

Смотрите, как это реализовано на практике:

```tsx
// Экран списка пользователей
function UsersScreen({ navigation }) {
  function openUser(id: number) {
    // Передаем id в параметры маршрута
    navigation.navigate('UserDetails', { userId: id })
  }

  return (
    <>
      <Button title="Пользователь 1" onPress={() => openUser(1)} />
      <Button title="Пользователь 2" onPress={() => openUser(2)} />
    </>
  )
}
```

```tsx
// Экран деталей пользователя
function UserDetailsScreen({ route }) {
  // Достаем параметр userId из route.params
  const { userId } = route.params

  return (
    <Text>Пользователь с ID {userId}</Text>
  )
}
```

Комментарии:

- параметры не сериализуются в строку URL, а передаются как объект
- так можно передавать сложные структуры, но их нельзя "поделиться" как URL

---

## Типовые сценарии программной навигации

Теперь давайте соберем частые практические кейсы, с которыми вы будете сталкиваться.

### Редирект после логина/логаута

Один из самых частых сценариев — отправить пользователя:

- обратно туда, откуда он пришел
- или в "домашнюю" страницу

Сначала пример для React Router с запоминанием "откуда пришли":

```jsx
import { useLocation, useNavigate } from 'react-router-dom'

function RequireAuth({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuth = false // для примера считаем что не авторизован

  if (!isAuth) {
    // Здесь мы программно перенаправляем на /login
    // и передаем "откуда" в state
    navigate('/login', {
      state: { from: location.pathname },
      replace: true, // заменяем маршрут чтобы не вернуться к защищенному
    })
    return null
  }

  return children
}
```

А теперь показано, как на стороне логина использовать этот state:

```jsx
import { useLocation, useNavigate } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Достаем маршрут куда стоит вернуться после логина
  const from = location.state?.from || '/'

  async function handleLogin() {
    const success = true

    if (success) {
      // Возвращаем туда откуда пришли или на главную
      navigate(from, { replace: true })
    }
  }

  return (
    <button onClick={handleLogin}>
      Войти
    </button>
  )
}
```

Обратите внимание, как этот пример связывает два экрана через состояние навигации, не используя глобальное хранилище.

### Пошаговый мастер (wizard) с условными шагами

Вы можете управлять шагами мастера с помощью навигации и маршрутов.

Пример на React Router:

```jsx
import { useNavigate } from 'react-router-dom'

function Step1() {
  const navigate = useNavigate()

  function handleNext(hasExtraStep) {
    // Здесь мы решаем какой шаг будет следующим
    if (hasExtraStep) {
      navigate('/wizard/extra-step')
    } else {
      navigate('/wizard/step-2')
    }
  }

  return (
    <button onClick={() => handleNext(true)}>
      Далее
    </button>
  )
}
```

Комментарий: логика шага определяет, куда дальше вести пользователя. Это как раз программная навигация в чистом виде.

### Глобальная обработка ошибок и редирект

Частая практика — обрабатывать ошибки API в одном месте и делать навигацию оттуда.

Покажу вам, как это может быть реализовано на уровне axios-интерцептора:

```js
// httpClient.js
import axios from 'axios'
import { appHistory } from './history'

const http = axios.create({
  baseURL: '/api',
})

// Здесь мы добавляем перехватчик ответов
http.interceptors.response.use(
  response => response,
  error => {
    // Если сервер вернул 401 Unauthorized
    if (error.response?.status === 401) {
      // Выполняем программную навигацию на страницу логина
      appHistory.replace('/login')
    }

    // Пробрасываем ошибку дальше
    return Promise.reject(error)
  }
)

export default http
```

Комментарии:

- код авторизации сосредоточен в одном месте
- UI-компоненты не знают о деталях обработки 401
- навигация вызывается из "инфраструктурного" кода

---

## Типичные ошибки и подводные камни программной навигации

### Бесконечные циклы редиректов

Распространенная проблема: компонент при рендере делает навигацию, навигация приводит к повторному рендеру, снова срабатывает условие — и так бесконечно.

Например:

```jsx
function ProtectedPage() {
  const navigate = useNavigate()
  const isAuth = false

  if (!isAuth) {
    // Плохой подход - навигация в теле рендера
    navigate('/login')
  }

  return <div>Секретная страница</div>
}
```

Этот код может вызвать множество лишних рендеров. Правильнее выносить навигацию в эффект:

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProtectedPage() {
  const navigate = useNavigate()
  const isAuth = false

  useEffect(() => {
    if (!isAuth) {
      // Здесь мы вызываем навигацию один раз после монтирования
      navigate('/login', { replace: true })
    }
  }, [isAuth, navigate])

  if (!isAuth) {
    // Пока редирект не произошел можно отрендерить null или лоадер
    return null
  }

  return <div>Секретная страница</div>
}
```

### Потеря истории и невозможность вернуться назад

Еще одна проблема — неконтролируемое использование `replace`:

- если вы везде ставите `replace: true`, пользователь не сможет вернуться назад
- если вы всегда используете `push`, история раздувается, переходы "Назад" становятся странными

Общий практический совет:

- `push` — для обычных переходов по приложению
- `replace` — для:
  - логина/логаута
  - автоматических редиректов (например, если страница устарела)
  - технических маршрутов, на которые не нужно возвращаться

### Разные источники правды о текущем маршруте

Иногда разработчики одновременно:

- хранят текущую страницу в глобальном состоянии (Redux, Zustand)
- и используют роутер

Это создает две "истины" о маршруте, которые могут разойтись. Лучший подход:

- использовать роутер как единственный источник правды о текущем маршруте
- производные данные (например, активный пункт меню) считать на основе `location.pathname` или аналогичного API

---

## Практические рекомендации по проектированию навигации

### Разделяйте "куда перейти" и "почему перейти"

Хороший паттерн:

- UI и бизнес-логика решают, "почему" нужно перейти
- конкретный маршрут и способ навигации инкапсулируются в отдельном "навигационном" слое

Например, вместо:

```js
// В бизнес-логике
navigate('/login')

// Еще где-то
navigate('/login?reason=expired')
```

Лучше сделать "сервис навигации":

```js
// navigationService.js
export function goToLogin(navigate, options = {}) {
  const params = new URLSearchParams()
  if (options.reason) {
    params.set('reason', options.reason)
  }

  // Здесь мы единообразно формируем URL
  const url = params.toString()
    ? `/login?${params.toString()}`
    : '/login'

  navigate(url, { replace: options.replace })
}
```

```jsx
// В компоненте
import { goToLogin } from './navigationService'

function SessionExpired({ navigate }) {
  function handleReLogin() {
    // Вызываем сервис навигации вместо ручного построения URL
    goToLogin(navigate, { reason: 'expired', replace: true })
  }

  // ...
}
```

Так вы избегаете дублирования и расхождений в URL.

### Инкапсулируйте навигацию в кастомные хуки

В React/Next удобно делать специальные хуки, которые прячут детали навигации.

Например:

```tsx
// useAuthNavigation.ts
import { useNavigate } from 'react-router-dom'

export function useAuthNavigation() {
  const navigate = useNavigate()

  function goToLogin(from?: string) {
    navigate('/login', {
      state: from ? { from } : undefined,
      replace: true,
    })
  }

  function goToDashboard() {
    navigate('/dashboard')
  }

  // Возвращаем набор "семантических" функций а не navigate напрямую
  return { goToLogin, goToDashboard }
}
```

```tsx
// LoginPage.tsx
import { useAuthNavigation } from './useAuthNavigation'

function LoginPage() {
  const { goToDashboard } = useAuthNavigation()

  async function handleLogin() {
    const success = true

    if (success) {
      // Мы вызываем "говорящую" функцию
      goToDashboard()
    }
  }

  // ...
}
```

---

## Заключение

Программная навигация — это управляемые из кода переходы между маршрутами и экранами. Она строится на одних и тех же принципах в разных стеках:

- текущий маршрут и история — модель навигации
- push/replace/back/navigate — базовые действия
- параметры и query-строки — способ передать состояние через URL или объект

Вы видели, как эти идеи проявляются:

- в чистом History API браузера
- в React Router (useNavigate, кастомная history)
- в Next.js (useRouter, redirect)
- в React Navigation для мобильных приложений

Ключевые практические моменты:

- выносите навигацию из тела рендера в эффекты и обработчики событий
- аккуратно используйте replace и push, понимая влияние на историю
- избегайте дублирования логики формирования маршрутов
- используйте "семантические" функции навигации вместо "сырых" вызовов navigate во всех местах

Если относиться к навигации как к отдельному слою архитектуры, а не как к случайным вызовам, приложение становится предсказуемее, а переходы — управляемыми и прозрачными.

---

## Частозадаваемые технические вопросы и ответы

### 1. Как сделать программную навигацию до инициализации React (например, в index.html или самом раннем коде)?

Используйте нативный `window.location` или History API. Например, если нужно сразу редиректить на другой путь:

```js
// Ранний редирект до старта приложения
if (window.location.pathname === '/old') {
  window.location.replace('/new') // заменяет текущий URL и не оставляет "след" в истории
}
```

Такой подход выполняется до монтирования фреймворка и гарантирует мгновенный переход.

### 2. Как правильно комбинировать серверные и клиентские редиректы в Next.js?

Общий подход:

- если редирект возможен на этапе загрузки страницы (например, проверка сессии на сервере) — используйте `redirect` в серверном компоненте или `next.config` для rewrite/redirect
- если решение о редиректе зависит от клиентского состояния (локальный storage, результат действий пользователя) — используйте `router.push` или `router.replace` в клиентском компоненте

Разносите логику так, чтобы максимально ранние и универсальные проверки были на сервере.

### 3. Как безопасно вызывать навигацию из асинхронного эффекта в React чтобы избежать утечек?

Паттерн:

```jsx
useEffect(() => {
  let isActive = true

  async function load() {
    const data = await fetchData()

    if (!isActive) return

    if (data.needRedirect) {
      navigate('/other') // вызываем навигацию только если компонент еще "жив"
    }
  }

  load()

  return () => {
    isActive = false // помечаем эффект как "отмененный"
  }
}, [navigate])
```

Так вы не вызовете `navigate` для размонтированного компонента.

### 4. Как программно прокрутить к якорю после навигации в SPA?

Сначала навигируете, затем в эффекте проверяете hash и скроллите:

```jsx
import { useLocation } from 'react-router-dom'

function ScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash])

  return null
}
```

Подключите этот компонент один раз в корне приложения.

### 5. Как сделать "мягкий" редирект в React Router без полного перерендеринга страницы?

Сам `navigate` уже не перезагружает страницу. Если вы хотите не сбрасывать часть UI (например, лейаут), используйте вложенные роуты:

- общий layout-компонент на верхнем уровне
- внутри него дочерние маршруты
- программная навигация меняет только внутренний маршрут

Таким образом перерисуется только содержимое Outlet, остальная часть интерфейса останется нетронутой.