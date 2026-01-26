---
metaTitle: Функция append в Go Golang
metaDescription: Узнайте как функция append в Go Golang помогает эффективно работать с срезами изучите синтаксис и особенности расширения функций
author: Олег Марков
title: Функция append в Go Golang
preview: Исследуйте функцию append в Go - как она работает зачем нужна и как позволяет расширять срезы Примеры и пояснения помогут вам быстро освоить её
---

## Введение

Тестирование компонентов — это подход, при котором вы проверяете отдельные, относительно небольшие части системы в изоляции от остального приложения. Эти части могут быть UI-компонентами (React, Vue, Angular), серверными модулями, классами или функциями, которые несут законченную часть поведения.

Смотрите, логика здесь простая: чем раньше вы находите ошибку и чем ближе вы находитесь к месту, где она возникла, тем дешевле и проще её исправить. Компонентное тестирование как раз и нацелено на то, чтобы локализовать проверки и держать их максимально близко к коду.

В этой статье мы пройдём путь от базовой теории до вполне практичных примеров. Я буду больше опираться на примеры на JavaScript/TypeScript и React, потому что там термин «компонент» используется чаще всего, но принципы, о которых мы поговорим, хорошо переносятся и на бэкенд, и на другие технологии.

## Что такое тестирование компонентов и чем оно отличается от других видов тестов

### Компонент как единица тестирования

С точки зрения тестирования, компонент — это модуль, который:

- Имеет чётко определённый интерфейс (пропсы, параметры, публичные методы).
- Содержит внутреннюю реализацию (состояние, побочные эффекты, внутренние функции).
- Может быть запущен в изоляции.

Для UI это, например, кнопка, форма, виджет фильтрации. Для серверного кода — сервис авторизации, класс для расчёта скидки, адаптер к внешнему API.

Тестируя компонент, вы проверяете, что:

- На одни и те же входные данные он даёт одни и те же выходы.
- Корректно вызывает зависимости (если они есть).
- Ведёт себя одинаково предсказуемо вне зависимости от окружения.

### Сравнение с unit, integration и e2e

Чтобы не путаться в терминах, давайте коротко разведём виды тестов:

- Модульные (unit) — проверяют отдельную функцию/метод, обычно вообще без реальных зависимостей, всё замокано.
- Компонентные — проверяют часть системы чуть крупнее: UI-компонент, класс, сервис. Часто допускают использование реальных зависимостей, если они локальные и недорогие.
- Интеграционные — проверяют взаимодействие нескольких модулей (например, сервис + БД, компонент + API).
- End-to-end (e2e) — проверяют систему целиком «как пользователь», через интерфейс или публичные endpoints.

Компонентные тесты чаще всего стоят между unit и интеграционными: вы не доходите до всей системы, но и не сводите всё к чистым функциям.

## Зачем вам тестирование компонентов

### Основные цели

Тестирование компонентов помогает:

- Уверенно рефакторить код, не боясь сломать поведение.
- Поймать регрессии (когда что-то старое ломается из‑за новых изменений).
- Документировать поведение компонента через примеры.
- Уменьшить количество ошибок, которые доходят до интеграционных и e2e тестов.

Особенно полезно это для UI, где много состояний, условий отображения и возможных сценариев.

### Что именно имеет смысл тестировать в компоненте

Обычно полезно проверять:

- Рендеринг — что именно отображается при разных входных данных.
- Состояние — как меняется state/данные при действиях пользователя или приходе новых пропсов.
- Взаимодействия — клики, ввод текста, отправка формы.
- Взаимодействие с зависимостями — правильно ли вызываются коллбеки, API, хранилище.

То, что обычно не стоит тестировать напрямую:

- Внутренние детали реализации, которые легко поменять (имена приватных функций, структура DOM-глубины, если она не является частью контракта).
- Конкретные реализации стилей, если они не влияют на поведение (цвета, отступы).

## Инструменты для тестирования компонентов на примере React

Чтобы не говорить абстрактно, давайте возьмём связку Jest + React Testing Library (RTL). Подходы, про которые я рассказываю, можно перенести и на другие фреймворки.

### Базовая настройка окружения

Предположим, у вас есть React-приложение. Для тестирования компонентов нам обычно нужны:

- Jest — тестовый раннер.
- React Testing Library — для рендера и взаимодействий.
- Jest DOM matcher'ы — для удобных проверок.

Пример установки:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Далее вы настраиваете Jest-конфигурацию (в простых случаях она уже есть в create-react-app или Vite шаблонах).

Подключение jest-dom, чтобы иметь дополнительные матчеры:

```js
// setupTests.js
import '@testing-library/jest-dom'
```

// В этом файле вы расширяете Jest дополнительными возможностями
// Теперь можно использовать expect(element).toBeInTheDocument() и другие удобные проверки

Теперь Jest нужно сказать, что этот файл setupTests.js должен выполняться перед тестами (в конфигурации jest, например, через setupFilesAfterEnv).

### Первый компонент: кнопка с коллбеком

Давайте разберём простой компонент, чтобы показать базовые приёмы.

```tsx
// Button.tsx
import React from 'react'

type ButtonProps = {
  label: string
  disabled?: boolean
  onClick?: () => void
}

export const Button = ({ label, disabled = false, onClick }: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
```

// Здесь мы описываем простой компонент кнопки
// - label - текст на кнопке
// - disabled - флаг, блокирующий кнопку
// - onClick - обработчик клика

Теперь давайте напишем к нему компонентный тест.

```tsx
// Button.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('рендерит текст переданный в label', () => {
  // Рендерим компонент с конкретным текстом
  render(<Button label="Сохранить" />)

  // Ищем элемент по тексту
  const button = screen.getByRole('button', { name: 'Сохранить' })

  // Проверяем, что он действительно есть в документе
  expect(button).toBeInTheDocument()
})

test('вызывает onClick при клике если не disabled', async () => {
  const user = userEvent.setup()
  const handleClick = jest.fn()

  render(<Button label="Удалить" onClick={handleClick} />)

  const button = screen.getByRole('button', { name: 'Удалить' })

  // Выполняем клик по кнопке
  await user.click(button)

  // Проверяем, что обработчик был вызван один раз
  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('не вызывает onClick если disabled', async () => {
  const user = userEvent.setup()
  const handleClick = jest.fn()

  render(<Button label="Удалить" onClick={handleClick} disabled />)

  const button = screen.getByRole('button', { name: 'Удалить' })

  // Пробуем кликнуть по заблокированной кнопке
  await user.click(button)

  // Убеждаемся, что обработчик не вызвался
  expect(handleClick).not.toHaveBeenCalled()
})
```

Обратите внимание, что мы ведём себя так же, как пользователь: ищем кнопку по роли и тексту, кликаем по ней, а затем проверяем эффект.

## Принципы хороших компонентных тестов

### Тестируйте поведение, а не реализацию

Очень распространённая ошибка — привязываться к внутренней структуре компонента. Например, проверять конкретные имена CSS-классов, количество вложенных div, вызовы внутренних функций.

Гораздо надёжнее проверять поведение:

- Что видит пользователь.
- Какие внешние эффекты происходят (вызов пропса, отправка запроса).

Пример плохого теста:

```tsx
// Плохой пример - тест жёстко привязан к структуре DOM
const element = container.querySelector('div > span > button')
expect(element?.className).toBe('btn btn-primary')
```

// Такой тест легко сломается при безобидном рефакторинге верстки

Лучше искать элементы так, как их нашёл бы пользователь:

- По тексту.
- По ролям.
- По aria-атрибутам.
- По placeholder/value (для полей ввода).

```tsx
// Хороший пример - ищем элемент по роли и имени
const button = screen.getByRole('button', { name: /сохранить/i })
expect(button).toBeEnabled()
```

### Один тест — один сценарий поведения

Полезно придерживаться структуры:

- Given (условия).
- When (действие).
- Then (ожидания).

Смотрите, как это выглядит на практике:

```tsx
test('отправляет форму при валидных данных', async () => {
  const user = userEvent.setup()
  const handleSubmit = jest.fn()

  // Given - рендерим форму с обработчиком отправки
  render(<LoginForm onSubmit={handleSubmit} />)

  // When - заполняем поля и нажимаем кнопку
  await user.type(screen.getByLabelText(/email/i), 'user@example.com')
  await user.type(screen.getByLabelText(/password/i), 'secret')
  await user.click(screen.getByRole('button', { name: /войти/i }))

  // Then - проверяем, что данные ушли в обработчик
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'secret',
  })
})
```

// Здесь мы чётко видим условия, действие и ожидаемый результат
// Такой тест легко читать и поддерживать

### Держите тесты независимыми

Каждый тест компонентного поведения должен:

- Самостоятельно подготавливать необходимые данные/рендер.
- Не зависеть от выполнения других тестов.
- Самостоятельно очищать за собой (обычно библиотеки делают это автоматически).

Не стоит полагаться на то, что предыдущий тест уже отрендерил компонент в нужном состоянии.

## Тестирование состояния и логики внутри компонента

### Компонент со внутренним состоянием

Теперь давайте возьмём компонент посложнее — счётчик с локальным состоянием.

```tsx
// Counter.tsx
import React, { useState } from 'react'

type CounterProps = {
  initial?: number
  step?: number
}

export const Counter = ({ initial = 0, step = 1 }: CounterProps) => {
  const [value, setValue] = useState(initial)

  const handleIncrement = () => {
    // Здесь мы обновляем состояние, добавляя шаг
    setValue((prev) => prev + step)
  }

  const handleReset = () => {
    // Здесь мы сбрасываем состояние к начальному значению
    setValue(initial)
  }

  return (
    <div>
      <span data-testid="counter-value">{value}</span>
      <button onClick={handleIncrement}>Плюс</button>
      <button onClick={handleReset}>Сброс</button>
    </div>
  )
}
```

Теперь вы увидите, как это выглядит в коде теста:

```tsx
// Counter.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

test('показывает начальное значение', () => {
  render(<Counter initial={5} />)

  // Ищем элемент по data-testid
  const value = screen.getByTestId('counter-value')

  // Проверяем текстовое содержимое
  expect(value).toHaveTextContent('5')
})

test('увеличивает значение на шаг при клике', async () => {
  const user = userEvent.setup()
  render(<Counter initial={0} step={2} />)

  const value = screen.getByTestId('counter-value')
  const incButton = screen.getByRole('button', { name: 'Плюс' })

  await user.click(incButton)
  expect(value).toHaveTextContent('2')

  await user.click(incButton)
  expect(value).toHaveTextContent('4')
})

test('сбрасывает значение к начальному', async () => {
  const user = userEvent.setup()
  render(<Counter initial={10} />)

  const value = screen.getByTestId('counter-value')
  const incButton = screen.getByRole('button', { name: 'Плюс' })
  const resetButton = screen.getByRole('button', { name: 'Сброс' })

  // Увеличиваем значение
  await user.click(incButton)
  await user.click(incButton)
  expect(value).toHaveTextContent('12')

  // Сбрасываем
  await user.click(resetButton)
  expect(value).toHaveTextContent('10')
})
```

Обратите внимание, что тесты не залезают внутрь useState и не проверяют, как именно он устроен. Мы проверяем только видимое поведение.

### Когда тестировать «чистую» логику отдельно

Если логика компонента становится сложной (много условий, вычислений), есть смысл вынести её в отдельные чистые функции или кастомные хуки.

Например:

```ts
// discount.ts
// Эта функция считает скидку, не зная ничего о компоненте
export const calculateDiscount = (price: number, percent: number): number => {
  if (percent < 0 || percent > 100) {
    throw new Error('invalid percent')
  }

  return price - (price * percent) / 100
}
```

Такую функцию удобно тестировать юнит-тестами отдельно от компонента, а в компоненте уже проверить только то, что результат правильно отображается.

```ts
// discount.test.ts
import { calculateDiscount } from './discount'

test('корректно считает скидку', () => {
  expect(calculateDiscount(100, 10)).toBe(90)
  expect(calculateDiscount(200, 50)).toBe(100)
})

test('выбрасывает ошибку при некорректном проценте', () => {
  expect(() => calculateDiscount(100, -5)).toThrow('invalid percent')
  expect(() => calculateDiscount(100, 150)).toThrow('invalid percent')
})
```

// Здесь мы тестируем только математику и правила
// Компоненты, которые используют эту функцию, не обязаны знать её внутренние детали

## Работа с зависимостями компонентов

Компоненты редко живут в вакууме. Чаще всего они:

- Получают данные из API.
- Общаются с глобальными сторами (Redux, Zustand, Vuex).
- Используют контексты.

### Ввод через пропсы vs глобальные зависимости

С точки зрения тестирования, ввод через пропсы гораздо удобнее, чем жёсткие глобальные зависимости. Посмотрите на два подхода.

Неудобный вариант:

```tsx
// Плохой подход - внутри компонента мы напрямую обращаемся к глобальному объекту
import { api } from '../api'

export const Profile = () => {
  // Здесь компонент сам решает, какие данные получать
  // Для теста это усложняет подмену поведения
}
```

Гораздо проще тестировать, когда зависимости приходят снаружи:

```tsx
// Хороший подход - зависимости приходят как пропсы
type ProfileProps = {
  loadUser: () => Promise<User>
}

export const Profile = ({ loadUser }: ProfileProps) => {
  // Теперь loadUser можно легко подменить в тестах
}
```

В тесте вы можете передать фейковую функцию:

```tsx
const fakeUser = { id: 1, name: 'Alice' }

const loadUser = jest.fn().mockResolvedValue(fakeUser)

render(<Profile loadUser={loadUser} />)
```

// В таком варианте вы полностью контролируете поведение зависимостей
// Без сложного мокинга модулей и глобальных объектов

### Тестирование взаимодействия с API через моки

Если у вас всё-таки есть модуль api, который вызывается внутри компонента, можно замокать его с помощью Jest.

```tsx
// api.ts
export const api = {
  async loadUser() {
    // Здесь реальный запрос
  },
}
```

Мок в тесте:

```tsx
// Profile.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { Profile } from './Profile'

// Импортируем модуль, который будем мокать
import { api } from '../api'

// Говорим Jest, что хотим мокать этот модуль
jest.mock('../api', () => ({
  api: {
    loadUser: jest.fn(),
  },
}))

test('показывает имя пользователя после загрузки', async () => {
  // Настраиваем поведение замоканной функции
  ;(api.loadUser as jest.Mock).mockResolvedValue({
    id: 1,
    name: 'Alice',
  })

  render(<Profile />)

  // Здесь мы ждём появления имени на экране
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
```

// Мы подменили реальный вызов API фейковой функцией
// Теперь компонент тестируется быстро и без реальных сетевых запросов

### Тестирование компонентов, зависящих от контекста

Когда компонент использует React Context, в тестах нужно «обернуть» его в соответствующий провайдер.

Пример:

```tsx
// AuthContext.tsx
import React, { createContext, useContext } from 'react'

type AuthContextValue = {
  user: { name: string } | null
}

const AuthContext = createContext<AuthContextValue>({ user: null })

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({
  value,
  children,
}: {
  value: AuthContextValue
  children: React.ReactNode
}) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

Компонент:

```tsx
// Greeting.tsx
import React from 'react'
import { useAuth } from './AuthContext'

export const Greeting = () => {
  const { user } = useAuth()

  if (!user) {
    return <span>Гость</span>
  }

  return <span>Привет, {user.name}</span>
}
```

Тест:

```tsx
// Greeting.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Greeting } from './Greeting'
import { AuthProvider } from './AuthContext'

const renderWithAuth = (ui: React.ReactElement, { user = null } = {}) => {
  // Оборачиваем компонент в провайдер контекста
  return render(
    <AuthProvider value={{ user }}>
      {ui}
    </AuthProvider>
  )
}

test('показывает "Гость" если пользователь не авторизован', () => {
  renderWithAuth(<Greeting />)

  expect(screen.getByText('Гость')).toBeInTheDocument()
})

test('показывает имя пользователя если он авторизован', () => {
  renderWithAuth(<Greeting />, { user: { name: 'Alice' } })

  expect(screen.getByText('Привет, Alice')).toBeInTheDocument()
})
```

// Мы создали вспомогательную функцию renderWithAuth
// Она упрощает рендер компонентов с нужным контекстом в разных тестах

## Тестирование сложных взаимодействий и асинхронности

### Поле ввода с валидацией

Давайте посмотрим на компонент формы с простой валидацией.

```tsx
// EmailInput.tsx
import React, { useState } from 'react'

type EmailInputProps = {
  onValidEmail: (email: string) => void
}

const isEmailValid = (value: string) => {
  // Упрощенная проверка email для примера
  return value.includes('@')
}

export const EmailInput = ({ onValidEmail }: EmailInputProps) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (!isEmailValid(newValue)) {
      // Если email некорректный, показываем ошибку
      setError('Некорректный email')
    } else {
      // Если корректный, скрываем ошибку и уведомляем родителя
      setError(null)
      onValidEmail(newValue)
    }
  }

  return (
    <div>
      <label>
        Email
        <input
          type="email"
          value={value}
          onChange={handleChange}
          aria-invalid={!!error}
        />
      </label>
      {error && <span role="alert">{error}</span>}
    </div>
  )
}
```

Тестируем два сценария: неправильный ввод и корректный.

```tsx
// EmailInput.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailInput } from './EmailInput'

test('показывает ошибку при некорректном email', async () => {
  const user = userEvent.setup()
  const handleValidEmail = jest.fn()

  render(<EmailInput onValidEmail={handleValidEmail} />)

  const input = screen.getByLabelText(/email/i)

  // Вводим заведомо некорректный email
  await user.type(input, 'invalid-email')

  // Ожидаем увидеть сообщение об ошибке
  expect(screen.getByRole('alert')).toHaveTextContent('Некорректный email')

  // И проверяем, что валидный обработчик не вызывался
  expect(handleValidEmail).not.toHaveBeenCalled()
})

test('вызывает onValidEmail при корректном email и скрывает ошибку', async () => {
  const user = userEvent.setup()
  const handleValidEmail = jest.fn()

  render(<EmailInput onValidEmail={handleValidEmail} />)

  const input = screen.getByLabelText(/email/i)

  // Вводим последовательно некорректный, а затем корректный email
  await user.type(input, 'invalid-email')
  await user.clear(input)
  await user.type(input, 'user@example.com')

  // Ошибка должна исчезнуть
  expect(screen.queryByRole('alert')).toBeNull()

  // И обработчик должен быть вызван с корректным значением
  expect(handleValidEmail).toHaveBeenCalledWith('user@example.com')
})
```

### Асинхронные операции в компонентах

Когда компонент делает асинхронный запрос (например, в useEffect), тесты должны уметь дождаться завершения операции.

Пример компонента:

```tsx
// UserInfo.tsx
import React, { useEffect, useState } from 'react'
import { api } from '../api'

type User = {
  id: number
  name: string
}

export const UserInfo = ({ userId }: { userId: number }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .loadUser(userId)
      .then((data) => {
        if (!cancelled) {
          setUser(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Ошибка загрузки')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      // Флаг на случай, если компонент размонтируется до завершения запроса
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return <span>Загрузка...</span>
  }

  if (error) {
    return <span role="alert">{error}</span>
  }

  if (!user) {
    return null
  }

  return <div>Пользователь {user.name}</div>
}
```

Теперь давайте посмотрим, что происходит в тесте:

```tsx
// UserInfo.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { UserInfo } from './UserInfo'
import { api } from '../api'

jest.mock('../api', () => ({
  api: {
    loadUser: jest.fn(),
  },
}))

test('показывает индикатор загрузки пока данные не получены', async () => {
  // Создаем промис, который сможем контролировать вручную
  let resolvePromise: (value: any) => void

  const loadUserPromise = new Promise((resolve) => {
    resolvePromise = resolve
  })

  ;(api.loadUser as jest.Mock).mockReturnValue(loadUserPromise)

  render(<UserInfo userId={1} />)

  // Сразу после рендера должен отображаться текст "Загрузка..."
  expect(screen.getByText('Загрузка...')).toBeInTheDocument()

  // Завершаем промис имитацией успешного ответа
  resolvePromise!({ id: 1, name: 'Alice' })

  // Ждем пока пользователь отобразится
  await waitFor(() => {
    expect(screen.getByText('Пользователь Alice')).toBeInTheDocument()
  })
})

test('показывает сообщение об ошибке при неуспешной загрузке', async () => {
  ;(api.loadUser as jest.Mock).mockRejectedValue(new Error('Network error'))

  render(<UserInfo userId={1} />)

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Ошибка загрузки')
  })
})
```

// Здесь мы контролируем асинхронный процесс из теста
// Сначала проверяем состояние загрузки, затем успешный результат и обработку ошибок

## Стратегия покрытия и организация тестов

### Что обязательно стоит покрывать

Для компонентного уровня стоит ориентироваться на такие вещи:

- Важные ветки условной логики (if/else, разные режимы работы).
- Основные пользовательские сценарии (успешные и неуспешные).
- Краевые случаи (пустые списки, нулевые значения, отсутствующие данные).

Например, если есть компонент списка:

- Список с несколькими элементами.
- Пустой список (нет элементов).
- Ошибка при загрузке.

### Как организовать файлы и имена тестов

Небольшая рекомендация по структуре:

- Хранить тест рядом с компонентом: Button.tsx и Button.test.tsx.
- Использовать понятные describe блоки для группировки сценариев (при необходимости).

Пример:

```tsx
// LoginForm.test.tsx
describe('LoginForm', () => {
  test('отправляет форму с валидными данными', () => {
    // ...
  })

  test('показывает ошибку при пустом пароле', () => {
    // ...
  })

  test('блокирует кнопку во время отправки', () => {
    // ...
  })
})
```

// Такой формат облегчает ориентацию в тестах
// И помогает быстрее понять, какие сценарии уже покрыты

### Критерии качества компонентных тестов

Хороший компонентный тест:

- Понятен с первого прочтения.
- Отражает реальный сценарий использования.
- Падает только тогда, когда реально поменялось поведение, а не внутренние детали.
- Быстро выполняется и не требует реальных внешних ресурсов (сетевых запросов, БД).

Если вы замечаете, что мелкие изменения в верстке ломают десятки тестов, это сигнал, что тесты слишком завязаны на реализацию.

## Заключение

Тестирование компонентов помогает удерживать поведение системы под контролем на уровне отдельных, осмысленных частей. Вы проверяете не всю систему целиком, а куски, с которыми постоянно работаете: кнопки, формы, виджеты, сервисы.

Важные идеи, которые стоит вынести:

- Тестируйте компоненты через их публичный интерфейс: что они получают и что отдают наружу.
- Сосредотачивайтесь на пользовательском поведении и бизнес-логике, а не на внутренних деталях DOM и реализации.
- Используйте пропсы и контексты для внедрения зависимостей, чтобы их было легко подменять в тестах.
- Асинхронные сценарии и сложные взаимодействия нужно тестировать так, чтобы тесты были независимыми от реальной сети или БД.

Компонентные тесты хорошо дополняют модульные и интеграционные тесты: они помогают поймать многие ошибки ещё до того, как вы начнёте гонять end-to-end сценарии. При этом вы остаётесь ближе всего к коду и можете быстро менять реализацию, опираясь на тесты как на «страховочную сетку».

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как понять что логика должна быть протестирована как компонент а что как чистая функция

Если часть логики не зависит от UI и побочных эффектов (например, чистые расчёты, преобразования данных), её проще вынести в отдельную функцию/модуль и покрыть модульными тестами. Логику, которая зависит от состояния компонента, взаимодействий пользователя и рендера, удобнее проверять компонентными тестами.

### Как тестировать компоненты которые используют локальное хранилище или cookies

Лучше инкапсулировать работу с localStorage/cookies в отдельный модуль (storageService) и замокать его в тестах. В тесте вы подменяете методы get/set нужным поведением через jest.mock и проверяете, что компонент корректно их вызывает и реагирует на возвращаемые значения.

### Что делать если компонент использует таймеры setTimeout или setInterval

В Jest можно включить фейковые таймеры через jest.useFakeTimers. В тесте вы рендерите компонент, запускаете действие, затем перематываете время с помощью jest.advanceTimersByTime или jest.runAllTimers, после чего проверяете ожидаемое состояние или вывод.

### Как тестировать компоненты которые сильно зависят от window или document

Если зависимость от глобальных объектов сильная, вынесите такие обращения в отдельные функции (например, getViewportWidth), а в тестах замокайте этот модуль. Если нужно переопределить конкретные свойства window, используйте Object.defineProperty или jest.spyOn для подмены методов, а после теста обязательно восстанавливайте исходное поведение.

### Как поступать с компонентами у которых много визуальных состояний и сложная верстка

Вместо того чтобы проверять каждый внутренний div, сосредоточьтесь на сценариях: разные типы данных, пустой/заполненный список, состояния загрузки и ошибки. Для сложной верстки полезно структурировать UI на более мелкие компоненты и тестировать их отдельно, снижая количество сценариев для одного большого компонента.