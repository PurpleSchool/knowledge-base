---
metaTitle: Как тестировать React приложения
metaDescription: Изучите эффективные подходы к тестированию React приложений - примеры, инструменты, практические советы и рекомендации для начинающих и продвинутых разработчиков
author: Олег Марков
title: Как тестировать React приложения
preview: Пошаговое руководство по тестированию React приложений – разъяснения, примеры, лучшие практики и ответы на частые вопросы для надежной фронтенд разработки
---

## Введение

Тестирование — критически важная часть разработки любого современного веб-приложения. Если вы пишете код на React, отладка компонентов, логики и интеграций помогает гарантировать стабильную и предсказуемую работу приложения при обновлениях и добавлении новых фич. Давайте рассмотрим, как организовать тестирование React-приложения, с какими инструментами стоит начать и какие подходы дать наилучшие результаты.

В этом материале вы найдете практические примеры, узнаете о видах тестов и получите инструкции о том, как писать, запускать и поддерживать тесты в проектах на React.

## Виды тестирования в React

### Unit-тесты (модульные тесты)

Unit-тест проверяет отдельно взятый модуль — например, функцию или компонент. Такой тип теста не затрагивает зависимости, сторонние сервисы или DOM, если это не необходимо. Обычно для написания unit-тестов в React применяют Jest и React Testing Library.

Вот схема, как unit-тест подтверждает работу компонента Counter:

```jsx
// Компонент Counter.jsx
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span data-testid="value">{count}</span>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

```jsx
// Counter.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from './Counter';

test('Counter увеличивает значение при клике', () => {
  render(<Counter />);
  // Проверяем стартовое значение
  expect(screen.getByTestId('value').textContent).toBe('0');
  // Симулируем клик
  fireEvent.click(screen.getByText('Increment'));
  // Проверяем, что счетчик увеличился
  expect(screen.getByTestId('value').textContent).toBe('1');
});
```

### Интеграционные тесты

Интеграционные тесты провериют, как несколько частей приложения работают вместе. Например, два компонента, которые взаимодействуют, или компонент и его провайдер контекста.

```jsx
// Пример интеграционного теста
// ThemeContext.js
import { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// ThemeButton.jsx
import { useTheme } from './ThemeContext';

export function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Theme is {theme}
    </button>
  );
}

// ThemeButton.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";

function ThemeProviderMock({ children }) {
  const value = {
    theme: "light",
    toggleTheme: jest.fn()
  };
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

test("ThemeButton отображает и использует контекст", () => {
  render(
    <ThemeProviderMock>
      <ThemeButton />
    </ThemeProviderMock>
  );
  expect(screen.getByText(/Theme is light/)).toBeInTheDocument();
});
```

### End-to-End тесты (E2E)

End-to-End тесты симулируют реальные сценарии использования приложения: открытие страницы, ввод данных, навигация и т.д. Обычно их пишут с помощью Cypress или Playwright. 

```js
// Пример E2E теста с Cypress
// counter.cy.js
describe('Counter', () => {
  it('инкрементирует значение', () => {
    cy.visit('http://localhost:3000');
    cy.get('[data-testid=value]').should('have.text', '0');
    cy.contains('Increment').click();
    cy.get('[data-testid=value]').should('have.text', '1');
  });
});
```

## Инструменты для тестирования React-приложений

### Jest

Jest — популярный тестовый раннер с поддержкой снапшотов, моков и отчётов о покрытии кода. Из коробки интегрируется с Create React App.

- Выполнение unit и интеграционных тестов;
- Моки функций и модулей;
- Проверка покрытия кода (coverage);
- Отлично сочетается с React Testing Library.

Установка:

```bash
npm install --save-dev jest
```

### React Testing Library

React Testing Library (RTL) используется для тестирования компонентов. Она фокусируется на пользовательском поведении, а не на внутренней реализации компонентов. С ней тест создаёт DOM-дерево и проверяет поведение так, как это сделал бы конечный пользователь.

Установка:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

Пример использования я приводил выше. Давайте дополним его пояснением:

- `render` монтирует компонент в изолированный тестовый DOM.
- `screen` — объект для поиска элементов в этом DOM.
- Методы, например, `getByTestId` или `getByText`, позволяют находить элементы по тексту, дата-атрибуту и другим признакам.

Совет: используйте доступные селекторы, похожие на те, что использует обычный пользователь (например, текст кнопки), чтобы тесты были ближе к реальному сценарию использования.

### Cypress

Cypress — инструмент для написания, запуска и отладки E2E тестов. Он запускает браузер, "ходит" по страницам, могут эмулировать нажатия, вводы и даже делать скриншоты.

Установка:

```bash
npm install --save-dev cypress
```

Запуск:

```bash
npx cypress open
```

Cypress хорошо подходит для проверки взаимодействий между разными страницами, интеграции с сервером, проверки появления модалок и прочих визуальных взаимодействий.

### MSW (Mock Service Worker)

MSW позволяет подменять сетевые запросы на моки. Это удобно, если вы хотите протестировать работу компонента, который делает fetch или axios-запрос.

Установка:

```bash
npm install --save-dev msw
```

Пример мока:

```js
// handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/user', (req, res, ctx) => {
    // Возвращаем фейковые данные пользователя
    return res(
      ctx.status(200),
      ctx.json({ name: 'Иван', id: 42 })
    );
  }),
];
```

```js
// setupTests.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Теперь ваш компонент, делающий запрос к `/api/user`, получит тестовые данные, а не реальный ответ сервера.

## Организация и структура тестов

### Где хранить тесты?

В React принято хранить файлы с тестами рядом с тестируемыми файлами (`Component.jsx` и `Component.test.jsx`) или в отдельной папке (например, `__tests__`). Первый вариант предпочитают в большинстве современных проектов, так как он облегчает навигацию и поддержку.

### Названия файлов тестов

Используйте расширения `.test.js` или `.spec.js`. Jest и другие тестовые раннеры сами найдут такие файлы.

### Как запускать тесты

- `npm test` или `yarn test` — команда запускает все тесты.
- Для одного теста: `npm test -- Component` (запускает только тесты с Component в названии).

### Структура типичного теста

Давайте структурируем типичный unit-тест компонента:

```jsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('MyComponent отображает заголовок', () => {
  render(<MyComponent />);
  // Проверяем, что заголовок отображается
  expect(screen.getByText('Заголовок')).toBeInTheDocument();
});
```

В крупных командах часто применяют подход Arrange-Act-Assert:

- **Arrange** — подготовка входных данных и окружения;
- **Act** — выполнение действия (например, клик, ввод);
- **Assert** — проверка результата.

## Практика тестирования React: лайфхаки и основные подходы

### Тестирование пропсов

Очень важно проверить, как компонент реагирует на разные пропсы. Смотрите, я покажу, как это делается:

```jsx
// Greeting.jsx
export function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Greeting.test.jsx
import { render, screen } from '@testing-library/react';
import { Greeting } from './Greeting';

test('Greeting отображает имя', () => {
  render(<Greeting name="Alex" />);
  expect(screen.getByText('Hello, Alex!')).toBeInTheDocument();
});
```

### Тестирование обработчиков событий

Давайте разберём на примере кнопку с обработчиком onClick:

```jsx
// Button.jsx
export function Button({ onClick }) {
  return <button onClick={onClick}>OK</button>;
}

// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('Button вызывает onClick', () => {
  const handleClick = jest.fn(); // Мокаем функцию
  render(<Button onClick={handleClick} />);
  fireEvent.click(screen.getByText('OK'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Что тестировать, а что нет

- Тестируйте пользовательские сценарии: то, что пользователь реально видит и делает.
- Не тестируйте внутренние детали реализации, особенно приватные методы.
- Старайтесь писать тесты, которые легко поддерживать при изменении кода — тестируйте поведение, а не конкретную разметку.

### Снимки (снэпшоты) компонентов

С помощью Jest можно делать снимки (snapshots) — "фотографии" результата рендера компонента:

```jsx
// WithSnapshot.test.jsx
import { render } from '@testing-library/react';
import { Greeting } from './Greeting';

it('Greeting соответствует снимку', () => {
  const { asFragment } = render(<Greeting name="Ivan" />);
  expect(asFragment()).toMatchSnapshot();
});
```

После первого запуска будет создан файл снимка. Если структура компонента поменяется — тест упадёт. Это удобно для UI компонентов с часто меняющейся разметкой, но не злоупотребляйте этой техникой — при частых изменениях снимки быстро устаревают.

### Проверка асинхронного кода

Если ваш компонент делает API-запросы, чаще всего нужно протестировать переходы между состояниями (загрузка, успех, ошибка). Вот пример:

```jsx
// UserProfile.jsx
import { useState, useEffect } from 'react';

export function UserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);
  if (!user) return <span>Loading…</span>;
  return <div>User: {user.name}</div>;
}

// UserProfile.test.jsx
import { render, screen } from '@testing-library/react';
// Мокаем fetch через jest
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ name: 'Ivan' }),
  })
);

test('UserProfile показывает загрузку и выводит имя', async () => {
  render(<UserProfile />);
  expect(screen.getByText(/Loading/)).toBeInTheDocument();
  // Ждем появления имени после асинхронного fetch
  expect(await screen.findByText('User: Ivan')).toBeInTheDocument();
});
```

Обратите внимание: используем `findByText`, который ждёт появления элемента в DOM после завершения асинхронной операции.

### Покрытие кода тестами

Хотите узнать, какая часть кода покрыта тестами? Добавьте флаг:

```bash
npm test -- --coverage
```

Jest покажет подробный отчёт по всем файлам: количество строк, функцций и ветвлений, которые были выполнены во время тестов.

### Best practices и советы

- Давайте названия тестам так, чтобы они отражали, что именно тестируется.
- Не дублируйте логику компонента внутри теста.
- Пишите короткие, атомарные тесты. Один тест — одно поведение.
- Используйте `@testing-library/jest-dom` для удобных матчеров вроде `toBeInTheDocument`.

## Интеграция тестов в CI/CD

CI/CD — это автоматизация прогонов тестов каждый раз при изменении кода. Например, вы используете GitHub Actions или GitLab CI. После каждого коммита или pull request все тесты прогоняются автоматически. Это позволяет выявить баги до публикации.

Файл для GitHub Actions может выглядеть так:

```yaml
name: Run Tests

on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install
    - run: npm test -- --coverage
```

Такой подход помогает поддерживать стабильное качество продукта.

## Заключение

Тестирование React-приложений — это неотъемлемая часть процесса создания современных интерфейсов. Для этого существует широкий арсенал инструментов: Jest, React Testing Library и Cypress — те, которые должен знать каждый фронтенд-разработчик. Выбирайте подходящий вам уровень тестирования: unit, интеграционный или E2E, и комбинируйте их для достижения максимального охвата.

Наличие тестов облегчает рефакторинг, помогает предотвратить баги и улучшает взаимодействие внутри команды. С современными инструментами тестирование становится простым и быстрым — вы тратите меньше времени на ручную проверку интерфейса и больше времени на творческую работу.

## Частозадаваемые технические вопросы

**1. Как тестировать пользовательские хуки в React?**

Для этого есть специальный метод `renderHook` из библиотеки @testing-library/react-hooks.

```js
import { renderHook } from '@testing-library/react-hooks';
import { useMyHook } from './useMyHook';

test('возвращает нужное значение', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current).toBe(42);
});
```

**2. Как мокировать модуль (например, axios) в тестовом окружении?**

Используйте jest.mock:

```js
jest.mock('axios');
import axios from 'axios';
axios.get.mockResolvedValue({ data: { id: 1 } });
```

**3. Как тестировать компоненты, обёрнутые в React Router?**

Оборачивайте компонент в MemoryRouter при рендере:

```js
import { MemoryRouter } from 'react-router-dom';
render(
  <MemoryRouter>
    <MyComponent />
  </MemoryRouter>
);
```

**4. Как тестировать компоненты с контекстами (Context API)?**

Создайте свой mock-провайдер для контекста и используйте его во время тестирования.

**5. Как проверить, что обработчик события был вызван с определёнными аргументами?**

Используйте toHaveBeenCalledWith:

```js
const handleClick = jest.fn();
fireEvent.click(button, { clientX: 20 });
expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
```