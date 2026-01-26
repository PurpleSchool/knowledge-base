---
metaTitle: Тестирование с Vitest в современных фронтенд проектах
metaDescription: Подробное руководство по тестированию с Vitest - установка настройка примеры юнит и компонентных тестов быстрые перезапуски и интеграция с Vite
author: Олег Марков
title: Тестирование с Vitest - практическое руководство для разработчиков
preview: Узнайте как настроить и эффективно использовать Vitest - от базового синтаксиса и моков до тестирования компонентов и интеграции с CI
---

## Введение

Vitest — это современный тестовый фреймворк для JavaScript и TypeScript, который изначально проектировался как «тестовый раннер для Vite». На практике он давно вышел за эти рамки и стал удобной заменой Jest в большинстве фронтенд‑проектов.

Смотрите, здесь важно понять две ключевые идеи:

1. Vitest максимально совместим с экосистемой Jest — вы будете использовать знакомые функции expect, describe, it, mock.
2. Vitest использует тот же механизм сборки, что и Vite, — благодаря этому тесты запускаются и пересобираются очень быстро, а TypeScript и современные фичи JS поддерживаются «из коробки».

В статье вы увидите, как:

- Установить и настроить Vitest в проекте.
- Писать юнит‑тесты и структурировать их.
- Работать с моками и шпионами.
- Тестировать асинхронный код.
- Тестировать React/Vue компоненты (на примере React, но подход похож и для других фреймворков).
- Настроить отчеты покрытия кода.
- Интегрировать Vitest в CI.

По ходу текста я буду добавлять много небольших примеров, чтобы вы сразу могли перенести идеи в свой проект.

---

## Установка и базовая настройка Vitest

### Установка Vitest в проект с Vite

Если у вас уже есть проект на Vite (React, Vue, Svelte, vanilla), Vitest подключается очень просто.

Пример установки:

```bash
# Устанавливаем Vitest и типы
npm install -D vitest @vitest/ui @vitest/coverage-v8
# При необходимости установка jsdom для DOM‑окружения
npm install -D jsdom
```

Теперь давайте подключим Vitest в конфигурации Vite.

Файл vite.config.ts (или vite.config.js):

```ts
// Импортируем defineConfig из Vite и плагин тестирования из Vitest
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // здесь может быть любой другой плагин
import { configDefaults, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(), // Подключаем плагин React, если вы используете React
  ],
  test: {
    // Здесь мы задаем базовую конфигурацию Vitest
    environment: 'jsdom', // Для тестов, которым нужен DOM
    globals: true,        // Включаем глобальные функции expect, describe и тд
    setupFiles: './src/test/setupTests.ts', // Файл с общими настройками тестов
    exclude: [
      ...configDefaults.exclude, // Берем дефолтный список исключений
      'e2e/**',                  // Исключаем end-to-end тесты, если есть
    ],
    coverage: {
      reporter: ['text', 'html'],          // Формат отчетов покрытия
      exclude: [
        ...coverageConfigDefaults.exclude, // Стандартные исключения
        'src/test/**',                     // Не считаем тесты в покрытие
      ],
    },
  },
})
```

Обратите внимание на ключ test — это и есть конфигурация Vitest, встроенная в Vite.

### Vitest в обычном проекте без Vite

Если у вас нет Vite, Vitest все равно можно использовать. В этом случае нужен отдельный vitest.config.ts.

```bash
npm install -D vitest @vitest/coverage-v8
```

Файл vitest.config.ts:

```ts
// Импортируем defineConfig и конфиги по умолчанию
import { defineConfig, configDefaults, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node', // Здесь используем node, если DOM не нужен
    globals: true,       // Глобальные функции тестирования
    exclude: [
      ...configDefaults.exclude, // Стандартные исключения
    ],
    coverage: {
      reporter: ['text', 'html'],         // Текстовый и HTML отчет
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tests/helpers/**',              // Например, исключаем вспомогательные утилиты
      ],
    },
  },
})
```

Запуск тестов:

```bash
npx vitest          # Запуск в watch режиме
npx vitest run      # Одноразовый прогон всех тестов
npx vitest --ui     # Интерфейс в браузере
```

---

## Структура тестов и базовый синтаксис Vitest

### Организация файлов тестов

Чаще всего используют один из вариантов:

- Файлы рядом с кодом: myModule.ts и myModule.test.ts
- Отдельная папка: src/ и tests/ с зеркальной структурой.

Vitest по умолчанию ищет файлы:

- *.test.ts
- *.spec.ts
- И их JS‑аналоги.

Вы можете переопределить это через test.include.

```ts
// Пример настройки пользовательских путей к тестам
test: {
  include: ['src/**/*.test.ts'], // Ищем тесты только в src
}
```

### Базовые функции describe, it и expect

Теперь давайте разберемся на простом примере.

Файл src/math/add.ts:

```ts
// Здесь мы определяем простую функцию сложения
export function add(a: number, b: number): number {
  return a + b
}
```

Файл src/math/add.test.ts:

```ts
// Импортируем функцию, которую будем тестировать
import { add } from './add'

describe('add', () => {
  // Здесь мы описываем группу тестов для функции add

  it('складывает два положительных числа', () => {
    // Ожидаем, что add(2, 3) вернет 5
    expect(add(2, 3)).toBe(5)
  })

  it('корректно работает с отрицательными числами', () => {
    // Проверяем работу с отрицательными значениями
    expect(add(-2, -3)).toBe(-5)
  })
})
```

Ключевые моменты:

- describe — группирует тесты логически.
- it (или test) — отдельный кейс.
- expect — точка входа для ассершенов (проверок).

### Более богатые матчер‑функции expect

Vitest использует знакомый синтаксис expect из Jest. Давайте посмотрим на распространенные матчера.

```ts
// Проверка равенства значений
expect(2 + 2).toBe(4)

// Глубокое сравнение объектов
expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 })

// Проверка наличия подстроки
expect('hello vitest').toContain('vitest')

// Проверка выбрасывания ошибки
function willThrow() {
  // Здесь мы явно выбрасываем ошибку
  throw new Error('boom')
}

expect(willThrow).toThrowError('boom')

// Проверка булевых значений
expect(true).toBeTruthy()
expect(false).toBeFalsy()

// Проверка чисел с плавающей точкой
expect(0.1 + 0.2).toBeCloseTo(0.3, 5) // Последний аргумент — точность
```

Здесь важно понимать: toBe делает сравнение по ===, а toEqual — глубокое сравнение структур (объектов, массивов).

---

## Хуки жизненного цикла тестов: beforeEach, afterEach и другие

Vitest поддерживает хуки, которые помогают подготовить и очистить состояние перед/после тестов.

Давайте посмотрим, как это выглядит.

```ts
// Здесь мы объявляем переменную, которую будем инициализировать перед каждым тестом
let data: number[] = []

beforeAll(() => {
  // Этот хук выполнится один раз перед всеми тестами в файле
  // Например, можно открыть соединение с БД или подготовить глобальные данные
})

afterAll(() => {
  // Этот хук выполнится один раз после всех тестов
  // Здесь часто делают очистку ресурсов
})

beforeEach(() => {
  // Перед каждым тестом создаем новый массив
  data = [1, 2, 3]
})

afterEach(() => {
  // После каждого теста очищаем массив
  data = []
})

it('добавляет элемент в массив', () => {
  // В начале теста массив имеет вид [1, 2, 3]
  data.push(4)
  expect(data).toEqual([1, 2, 3, 4])
})

it('удаляет последний элемент массива', () => {
  // Массив снова [1, 2, 3], потому что beforeEach сработал заново
  data.pop()
  expect(data).toEqual([1, 2])
})
```

Смотрите, здесь ключевая идея — каждый тест получает «свежее» состояние, чтобы тесты не влияли друг на друга.

---

## Тестирование асинхронного кода

В современном JavaScript асинхронность есть почти везде: HTTP‑запросы, таймеры, работа с файлами. Vitest поддерживает несколько способов тестировать такой код.

### Тесты с async/await

Самый удобный и читаемый вариант — просто объявить тест как async и использовать await.

```ts
// Функция, которая имитирует запрос к серверу
async function fetchUser(id: number) {
  // Здесь мы возвращаем ответ через промис
  return new Promise<{ id: number; name: string }>((resolve) => {
    setTimeout(() => {
      resolve({ id, name: 'Alice' })
    }, 50)
  })
}

it('возвращает данные пользователя', async () => {
  // Ждем результат выполнения async функции
  const user = await fetchUser(1)

  // Проверяем, что структура объекта правильная
  expect(user).toEqual({
    id: 1,
    name: 'Alice',
  })
})
```

Vitest понимает async‑функции и дождется их завершения.

### Обработка ошибок в async‑функциях

Давайте посмотрим, как проверить, что асинхронная функция выбрасывает ошибку.

```ts
// Асинхронная функция, которая бросает ошибку
async function fetchWithError() {
  // Здесь мы имитируем ошибку запроса
  throw new Error('Network error')
}

it('бросает ошибку при проблеме с сетью', async () => {
  // Оборачиваем вызов в expect().rejects
  await expect(fetchWithError()).rejects.toThrowError('Network error')
})
```

Обратите внимание: в этом случае вызываем функцию сразу и передаем промис в expect.

---

## Моки и шпионы в Vitest

В реальном проекте вам нужно изолировать тестируемый код от внешних зависимостей: HTTP‑клиентов, модулей логирования, времени, случайных значений. Для этого используются моки и шпионы.

Vitest предоставляет для этого объект vi.

### Шпионы vi.fn и vi.spyOn

Начнем с vi.fn — это «функция‑заглушка», которую вы можете использовать как замену реальной функции.

```ts
// Функция, которая отправляет событие в аналитику
function trackEvent(send: (event: string) => void, eventName: string) {
  // Здесь мы просто вызываем переданную функцию
  send(eventName)
}

it('вызывает функцию отправки с нужным событием', () => {
  // Создаем шпион-функцию
  const sendMock = vi.fn()

  // Вызываем функцию с шпионом
  trackEvent(sendMock, 'user_login')

  // Проверяем, что шпион был вызван один раз
  expect(sendMock).toHaveBeenCalledTimes(1)

  // Проверяем, что шпион был вызван с нужным аргументом
  expect(sendMock).toHaveBeenCalledWith('user_login')
})
```

Теперь посмотрим на vi.spyOn — этот метод позволяет «подсмотреть» за уже существующей функцией модуля.

```ts
// Модуль logger.ts
export const logger = {
  info(message: string) {
    // Здесь условно выводим сообщение в консоль
    console.log('INFO', message)
  },
}

// Модуль service.ts
import { logger } from './logger'

export function doWork() {
  // Логируем начало работы
  logger.info('Start')
  // Здесь могла быть полезная бизнес-логика
}
```

Тест:

```ts
// Импортируем функцию и объект логгера
import { doWork } from './service'
import { logger } from './logger'

it('логирует начало работы', () => {
  // Создаем шпион на методе info
  const spy = vi.spyOn(logger, 'info')

  // Вызываем функцию, которая должна логировать
  doWork()

  // Проверяем, что метод info был вызван с нужным сообщением
  expect(spy).toHaveBeenCalledWith('Start')

  // Восстанавливаем оригинальную реализацию
  spy.mockRestore()
})
```

vi.spyOn удобен тем, что вам не нужно менять код импортов — вы перехватываете вызов уже существующего метода.

### Мокирование модулей с vi.mock

Теперь давайте посмотрим, как подменить целый модуль. Это полезно, когда вы не хотите реально выполнять HTTP‑запросы или читать файлы.

Предположим, у нас есть модуль api.ts:

```ts
// Модуль, который делает запрос к серверу
export async function getUser(id: number) {
  // В реальном коде здесь был бы fetch или axios
  return { id, name: 'Real user' }
}
```

И модуль userService.ts:

```ts
// Импортируем функцию, которая делает запрос
import { getUser } from './api'

export async function getUserNameUpper(id: number) {
  // Получаем пользователя через API
  const user = await getUser(id)

  // Возвращаем имя в верхнем регистре
  return user.name.toUpperCase()
}
```

Тест с мокированием модуля:

```ts
// Важно - сначала объявляем мок модуля
vi.mock('./api', () => {
  // Здесь возвращаем объект с мок-функциями
  return {
    getUser: vi.fn().mockResolvedValue({ id: 1, name: 'Mock user' }),
  }
})

// Теперь импортируем все, что нужно для теста
import { getUserNameUpper } from './userService'
import { getUser } from './api'

it('использует мокированное API', async () => {
  // Вызываем функцию, которая под капотом использует getUser
  const name = await getUserNameUpper(1)

  // Проверяем, что результат основан на мок-данных
  expect(name).toBe('MOCK USER')

  // Дополнительно проверяем, что getUser был вызван
  expect(getUser).toHaveBeenCalledWith(1)
})
```

Здесь важно: vi.mock нужно вызывать до импорта тестируемого модуля, иначе оригинальная реализация уже будет загружена.

---

## Таймеры и управление временем в тестах

Часто приходится тестировать функции, которые используют setTimeout, setInterval или Date.now. Vitest позволяет «управлять временем» с помощью фейковых таймеров.

### Использование фейковых таймеров

Давайте посмотрим пример.

```ts
// Функция, которая вызывает callback через некоторое время
export function delayAndRun(callback: () => void, ms: number) {
  // Здесь мы откладываем вызов колбэка
  setTimeout(callback, ms)
}
```

Тест:

```ts
import { delayAndRun } from './delay'

// Подготавливаем фейковые таймеры
beforeEach(() => {
  // Переводим Vitest в режим использования фейковых таймеров
  vi.useFakeTimers()
})

afterEach(() => {
  // Возвращаем реальные таймеры после каждого теста
  vi.useRealTimers()
})

it('вызывает колбэк после задержки', () => {
  // Создаем шпион-функцию для проверки вызова
  const callback = vi.fn()

  // Вызываем функцию, которая использует setTimeout
  delayAndRun(callback, 1000)

  // Перематываем время вперед на 1000 миллисекунд
  vi.advanceTimersByTime(1000)

  // Проверяем, что колбэк был вызван
  expect(callback).toHaveBeenCalledTimes(1)
})
```

Так вы получаете полный контроль над временем, и тесты становятся быстрыми и предсказуемыми.

---

## Тестирование React компонентов с Vitest и Testing Library

Vitest сам по себе не рендерит компоненты, но отлично работает в связке с @testing-library/react и jsdom.

### Установка необходимых пакетов

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

Теперь подключим расширенные матчеры jest-dom в setup файле.

Файл src/test/setupTests.ts:

```ts
// Импортируем расширенные матчера для DOM
import '@testing-library/jest-dom'

// По необходимости здесь можно настроить глобальные моки
// Например - мок window.matchMedia или локального хранилища
```

### Простой пример теста компонента

Компонент Button.tsx:

```tsx
// Импортируем React
import React from 'react'

type ButtonProps = {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  // Возвращаем кнопку с текстом и обработчиком клика
  return (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  )
}
```

Тест Button.test.tsx:

```tsx
// Импортируем функции из Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
// Импортируем компонент
import { Button } from './Button'

describe('Button', () => {
  it('отображает текст и реагирует на клик', () => {
    // Создаем шпион для обработчика клика
    const handleClick = vi.fn()

    // Рендерим компонент в виртуальном DOM
    render(<Button label="Нажми меня" onClick={handleClick} />)

    // Ищем кнопку по тексту
    const button = screen.getByText('Нажми меня')

    // Проверяем - что кнопка есть в документе
    expect(button).toBeInTheDocument()

    // Симулируем клик по кнопке
    fireEvent.click(button)

    // Проверяем - что обработчик клика был вызван
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

Здесь вы видите типичный паттерн:

1. render — рендер компонента в jsdom.
2. screen — удобные функции поиска элементов (getByText, getByRole и т.д.).
3. fireEvent или userEvent — имитация действий пользователя.
4. Матчеры jest-dom — toBeInTheDocument, toHaveTextContent и другие.

### Тестирование компонента с асинхронным поведением

Давайте посмотрим компонент, который загружает данные.

Компонент UserName.tsx:

```tsx
// Импортируем React и useEffect
import React, { useEffect, useState } from 'react'

type User = {
  id: number
  name: string
}

type Props = {
  loadUser: () => Promise<User>
}

export function UserName({ loadUser }: Props) {
  // Локальное состояние для имени и статуса загрузки
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // При монтировании компонента запускаем загрузку пользователя
    loadUser()
      .then((user) => {
        setName(user.name)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [loadUser])

  if (loading) {
    // Пока идет загрузка - отображаем индикатор
    return <span>Loading...</span>
  }

  // После загрузки показываем имя пользователя
  return <span>{name}</span>
}
```

Тест:

```tsx
// Импортируем функции для рендера и поиска элементов
import { render, screen } from '@testing-library/react'
// Импортируем функцию waitFor для ожидания изменений
import { waitFor } from '@testing-library/react'
// Импортируем тестируемый компонент
import { UserName } from './UserName'

it('отображает имя пользователя после загрузки', async () => {
  // Создаем мок-функцию загрузки пользователя
  const loadUser = vi.fn().mockResolvedValue({ id: 1, name: 'Alice' })

  // Рендерим компонент с мок-функцией
  render(<UserName loadUser={loadUser} />)

  // Сначала отображается индикатор загрузки
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Ждем - пока в DOM появится текст с именем пользователя
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  // Дополнительно проверяем - что загрузка вызывалась один раз
  expect(loadUser).toHaveBeenCalledTimes(1)
})
```

waitFor выполняет переданную функцию несколько раз, пока ассершен не пройдет или не истечет таймаут. Это позволяет дождаться асинхронных обновлений компонента.

---

## Конфигурация Vitest: разбор ключевых опций

Теперь давайте системно посмотрим на основные настройки, с которыми вы будете сталкиваться.

### Опция environment

Определяет, в каком окружении будут выполняться тесты:

- node — обычное Node.js‑окружение.
- jsdom — эмуляция браузера (window, document, DOM API).

Примеры:

```ts
test: {
  environment: 'node',  // Подходит для тестирования бэкенд логики и утилит
}
```

```ts
test: {
  environment: 'jsdom', // Нужен для тестирования React, Vue и DOM-кода
}
```

Если в одном проекте нужны разные окружения, можно переопределить environment в самом тесте:

```ts
import { describe, it, expect } from 'vitest'

// Для этой группы тестов используем jsdom
describe('DOM tests', { environment: 'jsdom' }, () => {
  it('доступен document', () => {
    // Проверяем - что объект document существует
    expect(document).toBeDefined()
  })
})
```

### Опция globals

Когда globals: true, функции expect, describe, it, vi и другие доступны без импорта. Это удобно, но кто‑то предпочитает явный импорт.

Пример с globals: true:

```ts
// Мы можем использовать expect сразу
it('работает без импорта', () => {
  expect(1 + 1).toBe(2)
})
```

Пример без globals:

```ts
// Тогда нужна строка импорта
import { describe, it, expect, vi } from 'vitest'

it('работает с импортом', () => {
  expect(1 + 1).toBe(2)
})
```

### include и exclude

Эти опции управляют тем, какие файлы считаются тестами.

```ts
test: {
  include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  exclude: ['node_modules', 'dist', 'e2e'],
}
```

Это полезно, когда у вас есть, например, e2e‑тесты на Playwright, которые запускаются отдельно и не должны подхватываться Vitest.

---

## Покрытие кода (coverage) в Vitest

Vitest использует V8 coverage (через @vitest/coverage-v8). Это быстрый и точный способ узнать, насколько хорошо ваш код покрыт тестами.

### Настройка покрытия

Добавим секцию coverage в test‑конфигурацию.

```ts
// Фрагмент конфигурации Vitest
test: {
  coverage: {
    reporter: ['text', 'html', 'json'], // Выбираем форматы отчетов
    reportsDirectory: './coverage',     // Папка для отчетов
    lines: 80,                          // Минимальный процент покрытия строк
    functions: 80,                      // Минимальный процент покрытия функций
    branches: 70,                       // Минимальный процент покрытия ветвлений
    statements: 80,                     // Минимальный процент покрытия операторов
  },
}
```

Запуск с генерацией покрытия:

```bash
npx vitest run --coverage
```

После выполнения вы увидите:

- Текстовый отчет в консоли.
- HTML‑отчет в папке coverage (обычно файл coverage/index.html).

Вы можете открыть HTML‑страницу в браузере и детально посмотреть, какие строки не покрыты тестами.

### Исключение файлов из покрытия

Иногда есть файлы, которые не нужно учитывать (например, конфиги, тестовые утилиты). Для этого есть опция coverage.exclude.

```ts
import { coverageConfigDefaults } from 'vitest/config'

test: {
  coverage: {
    exclude: [
      ...coverageConfigDefaults.exclude, // Стандартные исключения Vitest
      'src/test/**',                    // Папка с тестовыми утилитами
      'src/main.tsx',                   // Точка входа приложения
    ],
  },
}
```

---

## Параллельный запуск тестов и изоляция

Vitest поддерживает параллельное выполнение тестов, что ускоряет прогон большого набора кейсов. При этом важно правильно настраивать изоляцию, чтобы тесты не мешали друг другу.

### Параллельные тесты

Vitest по умолчанию использует worker‑процессы. Вы можете контролировать их количество:

```bash
npx vitest run --maxWorkers=4
```

Или в конфиге:

```ts
test: {
  maxWorkers: 4, // Ограничиваем количество параллельных воркеров
}
```

### Изоляция окружения (isolation)

isolate: true делает так, что каждый тестовый файл получает отдельный модульный контекст. Это важно при использовании vi.mock.

```ts
test: {
  isolate: true, // Каждый файл тестов имеет свою копию модулей
}
```

Если вам по какой‑то причине нужно отключить изоляцию (обычно это нежелательно), можно установить false, но в большинстве случаев лучше оставлять true.

---

## Интеграция Vitest с CI

Чтобы запустить Vitest в CI (GitHub Actions, GitLab CI, Jenkins и т.д.), вам нужно:

1. Установить зависимости.
2. Собрать проект (если требуется).
3. Запустить vitest run с нужными флагами.

Пример workflow для GitHub Actions (фрагмент файла .github/workflows/ci.yml, пояснения в комментариях):

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      # Клонируем репозиторий
      - uses: actions/checkout@v4

      # Устанавливаем Node.js нужной версии
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Устанавливаем зависимости
      - run: npm ci

      # Запускаем юнит-тесты с покрытием
      - run: npx vitest run --coverage
```

Если вы используете pnpm или yarn, команда установки просто меняется на pnpm install или yarn install.

---

## Полезные практики при работе с Vitest

### Избегайте тестов, завязанных на внешнюю среду

Старайтесь:

- Не делать реальные HTTP‑запросы.
- Не записывать файлы на диск без необходимости.
- Не зависеть от реального времени или случайных чисел.

Используйте:

- vi.mock для модулей.
- vi.useFakeTimers для времени.
- Моки для случайных значений.

### Делайте тесты независимыми

Каждый тест должен проходить или падать независимо от других. Для этого:

- Используйте beforeEach для подготовки состояния.
- Используйте afterEach для очистки.
- Не меняйте глобальные объекты без последующего восстановления.

### Пишите тесты, которые читаются как документация

Если тест через месяц будет понятен вам же, это хороший тест. Для этого:

- Давайте осмысленные имена тестам (описывайте поведение).
- Разделяйте тесты по describe‑блокам.
- Не перегружайте один тест десятками проверок без необходимости.

---

Vitest дает знакомый синтаксис (как у Jest), быструю скорость (как у Vite) и гибкую конфигурацию. Если вы уже умеете писать тесты с Jest, переход на Vitest будет очень мягким. Если вы только начинаете, Vitest даст современный и удобный старт.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать, чтобы Vitest корректно понимал алиасы путей из tsconfig (например @/components)?

1. В tsconfig.json убедитесь, что настроены paths.  
2. Установите пакет vite-tsconfig-paths или аналог.  
3. В vite.config.ts подключите плагин:

```ts
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
})
```

4. Для проекта без Vite укажите resolve.alias в vitest.config.ts, вручную сопоставив алиасы с путями.

---

### Почему мок модуля через vi.mock не срабатывает и используется реальная реализация?

Чаще всего проблема в порядке импортов:

1. Вызывайте vi.mock('module') в самом верху файла теста — до любых импортов тестируемых модулей.  
2. Убедитесь, что путь в vi.mock совпадает с путем импортирования (относительный vs абсолютный).  
3. Если используется alias, проверьте конфиг Vite/Vitest — resolve.alias должен быть одинаковым и для кода, и для тестов.  

---

### Как запустить только один файл или один тест с Vitest?

1. Один файл: npx vitest path/to/file.test.ts.  
2. С использованием паттерна: npx vitest "src/**/user*.test.ts".  
3. Один тест или группу: используйте .only:

```ts
it.only('конкретный тест', () => { /* ... */ })
describe.only('группа', () => { /* ... */ })
```

Не забудьте убрать .only перед коммитом.

---

### Как тестировать код, который использует import.meta.env в Vite приложении?

1. В конфиге Vitest задайте test.environment: 'jsdom' или 'node' (в зависимости от кода).  
2. В setupTests.ts или в самом тесте замокайте import.meta.env:

```ts
// @ts-expect-error - расширяем import.meta
import.meta.env = {
  ...import.meta.env,
  VITE_API_URL: 'https://test-api.local',
}
```

3. Альтернатива — использовать плагины Vite/Vitest, которые подставляют env‑переменные из .env.test.

---

### Почему после включения jsdom некоторые тесты на Node начинают падать?

jsdom меняет глобальное окружение (window, document, иногда поведение таймеров). Если часть тестов зависит от чистого Node:

1. В общем конфиге оставьте environment: 'node'.  
2. Для тестов, где нужен DOM, задайте окружение на уровне describe:

```ts
describe('UI', { environment: 'jsdom' }, () => {
  // тесты, которым нужен DOM
})
```

Так вы избежите конфликтов между jsdom и Node‑специфичным кодом.