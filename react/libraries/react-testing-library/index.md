---
metaTitle: React Testing Library - тестирование React компонентов
metaDescription: Полное руководство по React Testing Library: установка, основные методы, запросы, примеры тестирования компонентов
author: Олег Марков
title: React Testing Library
preview: Узнайте как использовать React Testing Library для тестирования React компонентов. Основные методы, запросы и примеры
---

## Введение

React Testing Library (RTL) — это лёгкая библиотека для тестирования React-компонентов, которая поощряет написание тестов, близких к тому, как пользователи на самом деле взаимодействуют с вашим приложением. В отличие от подходов, ориентированных на детали реализации (например, проверку внутреннего состояния компонента), RTL фокусируется на поведении интерфейса: что видит пользователь и как он с этим взаимодействует.

Библиотека является частью экосистемы Testing Library и построена поверх DOM Testing Library. Она намеренно не предоставляет способов тестировать детали реализации — такие как состояние компонентов или их методы жизненного цикла. Это подталкивает разработчиков писать более надёжные и устойчивые к рефакторингу тесты.

В этой статье вы узнаете, как установить и настроить React Testing Library, какие методы и запросы она предоставляет, как писать тесты для различных типов компонентов, и какие практики помогут сделать ваши тесты качественными.

## Что такое React Testing Library и зачем она нужна

### Философия тестирования

Главный принцип RTL сформулирован так: тесты должны напоминать то, как пользователи работают с вашим приложением. Если пользователь видит кнопку с текстом «Отправить» и нажимает на неё — тест должен делать именно это, а не искать компонент по его внутреннему имени или напрямую вызывать обработчик события.

Это важно по нескольким причинам:

- **Устойчивость к рефакторингу.** Если вы измените внутреннее устройство компонента, но его поведение останется прежним — тесты не сломаются.
- **Документирование поведения.** Тесты описывают, что делает компонент с точки зрения пользователя, а не как он это делает внутри.
- **Доверие к тестам.** Тест, имитирующий реальное использование, даёт больше уверенности в том, что приложение работает корректно.

### Сравнение с Enzyme

До появления RTL популярной альтернативой был Enzyme. Основные различия:

| Критерий | React Testing Library | Enzyme |
|---|---|---|
| Фокус тестирования | Поведение (что видит пользователь) | Реализация (внутренняя структура) |
| Доступ к состоянию | Не поощряется | Прямой доступ |
| Поиск элементов | По тексту, роли, label | По компонентам, CSS, props |
| Поддержка React 18+ | Полная | Ограниченная |
| Официальная рекомендация | Да (React, Create React App) | Нет |

RTL стала стандартом де-факто для тестирования React-компонентов и рекомендована официальной документацией React.

## Установка и настройка

### Базовая установка

Если вы используете Create React App или Vite с шаблоном React, React Testing Library уже может быть включена. Для ручной установки выполните:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

Если вы планируете тестировать пользовательские взаимодействия (что рекомендуется), добавьте также:

```bash
npm install --save-dev @testing-library/user-event
```

### Настройка Jest

React Testing Library работает совместно с Jest. Убедитесь, что в вашем `package.json` или файле конфигурации Jest указана правильная среда:

```json
// package.json
{
  "jest": {
    "testEnvironment": "jsdom"
  }
}
```

Или в `jest.config.js`:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/src/setupTests.js'],
};
```

### Настройка setupTests

Создайте файл `src/setupTests.js` (или `setupTests.ts` для TypeScript) для подключения расширений Jest DOM:

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
```

Это подключит дополнительные матчеры Jest, специфичные для DOM-элементов: `toBeInTheDocument`, `toHaveTextContent`, `toBeVisible` и другие.

### Настройка с Vite

Если вы используете Vite, вам понадобится Vitest вместо Jest:

```bash
npm install --save-dev vitest @vitest/ui jsdom
```

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

### Настройка TypeScript

Для TypeScript-проектов установите типы:

```bash
npm install --save-dev @types/jest
```

И настройте `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

## Основные методы

### render

Метод `render` монтирует React-компонент в виртуальный DOM и возвращает набор утилит для работы с ним.

```jsx
import { render } from '@testing-library/react';
import MyComponent from './MyComponent';

test('компонент рендерится', () => {
  // render возвращает объект с утилитами
  const { getByText, getByRole, container } = render(<MyComponent />);

  // container — это DOM-узел, в который отрендерился компонент
  expect(container).toBeInTheDocument();
});
```

`render` принимает опциональный второй аргумент с настройками:

```jsx
render(<MyComponent />, {
  // wrapper — обёртка для компонента (например, провайдеры)
  wrapper: ({ children }) => (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  ),
  // container — DOM-элемент для монтирования (по умолчанию создаётся div)
  container: document.getElementById('root'),
});
```

### screen

Объект `screen` — это рекомендуемый способ получать элементы из DOM после рендера. Он содержит все те же запросы, что и возвращаемые `render`, но позволяет избежать деструктуризации:

```jsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('кнопка отображает правильный текст', () => {
  render(<Button>Нажми меня</Button>);

  // Используем screen для поиска элементов
  const button = screen.getByRole('button', { name: /нажми меня/i });
  expect(button).toBeInTheDocument();
});
```

Использование `screen` предпочтительнее деструктуризации из `render`, потому что:
- Не нужно помнить, что деструктурировать
- Легче читать — явно видно, что идёт поиск по DOM
- При рефакторинге не нужно менять деструктуризацию

### fireEvent

`fireEvent` позволяет имитировать события DOM: клики, ввод текста, отправку форм и т.д.

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('счётчик увеличивается при клике', () => {
  render(<Counter />);

  const button = screen.getByRole('button', { name: /увеличить/i });
  const count = screen.getByTestId('count');

  expect(count).toHaveTextContent('0');

  fireEvent.click(button);

  expect(count).toHaveTextContent('1');
});
```

`fireEvent` поддерживает все стандартные события DOM:

```jsx
// Клик
fireEvent.click(element);

// Изменение значения input
fireEvent.change(input, { target: { value: 'новый текст' } });

// Нажатие клавиши
fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' });

// Отправка формы
fireEvent.submit(form);

// Фокус и потеря фокуса
fireEvent.focus(element);
fireEvent.blur(element);
```

### userEvent

`@testing-library/user-event` — это более реалистичная альтернатива `fireEvent`. Она имитирует полный цикл взаимодействия пользователя с элементами, включая все промежуточные события.

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form from './Form';

test('пользователь вводит текст в поле', async () => {
  // Создаём экземпляр userEvent (рекомендуемый способ для v14+)
  const user = userEvent.setup();

  render(<Form />);

  const input = screen.getByRole('textbox', { name: /имя/i });

  // type имитирует реальный ввод: focus, keydown, keypress, input, keyup
  await user.type(input, 'Иван Иванов');

  expect(input).toHaveValue('Иван Иванов');
});
```

Основные методы `userEvent`:

```jsx
const user = userEvent.setup();

// Ввод текста (полная имитация клавиатуры)
await user.type(input, 'текст');

// Очистка поля и ввод нового текста
await user.clear(input);
await user.type(input, 'новый текст');

// Клик
await user.click(button);

// Двойной клик
await user.dblClick(element);

// Нажатие специальных клавиш
await user.keyboard('{Enter}');
await user.keyboard('{Tab}');

// Выбор в select
await user.selectOptions(select, ['option1', 'option2']);

// Загрузка файла
await user.upload(fileInput, file);

// Навигация Tab
await user.tab();
```

**Когда использовать `userEvent` вместо `fireEvent`:**

- `userEvent` — предпочтительный вариант для имитации реального поведения пользователя
- `fireEvent` — полезен для простых случаев или когда нужно отправить конкретное событие с кастомными данными
- `userEvent` является асинхронным (нужно `await`)

## Запросы

Запросы — это методы для поиска элементов в DOM. RTL предоставляет три семейства запросов, каждое из которых подходит для разных ситуаций.

### getBy — синхронный поиск (элемент должен существовать)

`getBy*` запросы возвращают элемент синхронно. Если элемент не найден или найдено несколько — выбрасывают ошибку.

```jsx
// getByRole — поиск по ARIA-роли (наиболее рекомендуемый)
const button = screen.getByRole('button', { name: /отправить/i });
const input = screen.getByRole('textbox', { name: /email/i });
const heading = screen.getByRole('heading', { level: 1 });

// getByText — поиск по тексту
const element = screen.getByText('Привет, мир!');
const element2 = screen.getByText(/привет/i); // регулярное выражение

// getByLabelText — поиск поля ввода по тексту label
const input = screen.getByLabelText('Email адрес');

// getByPlaceholderText — поиск по placeholder
const input = screen.getByPlaceholderText('Введите email...');

// getByAltText — поиск изображений по alt-тексту
const image = screen.getByAltText('Логотип компании');

// getByTitle — поиск по атрибуту title
const element = screen.getByTitle('Закрыть');

// getByTestId — поиск по data-testid (последний резерв)
const element = screen.getByTestId('submit-button');
```

### queryBy — синхронный поиск (элемент может отсутствовать)

`queryBy*` аналогичны `getBy*`, но возвращают `null` вместо ошибки, если элемент не найден. Используйте их, когда хотите проверить отсутствие элемента:

```jsx
test('сообщение об ошибке не показывается по умолчанию', () => {
  render(<LoginForm />);

  // queryBy не выбросит ошибку, если элемент отсутствует
  const errorMessage = screen.queryByText(/неверный пароль/i);

  // Проверяем, что элемент отсутствует
  expect(errorMessage).not.toBeInTheDocument();
  // или
  expect(errorMessage).toBeNull();
});
```

```jsx
test('кнопка удаления скрыта для обычных пользователей', () => {
  render(<UserPanel role="viewer" />);

  // Если элемент не найден — вернётся null, а не ошибка
  expect(screen.queryByRole('button', { name: /удалить/i })).not.toBeInTheDocument();
});
```

### findBy — асинхронный поиск (элемент появится позже)

`findBy*` возвращают Promise и ждут появления элемента в DOM. Используйте для асинхронных операций:

```jsx
test('данные пользователя загружаются асинхронно', async () => {
  render(<UserProfile userId="123" />);

  // findBy ждёт, пока элемент не появится в DOM (по умолчанию до 1000мс)
  const userName = await screen.findByText('Иван Иванов');

  expect(userName).toBeInTheDocument();
});
```

```jsx
test('список товаров загружается после запроса к API', async () => {
  // Мокируем API запрос
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve([
      { id: 1, name: 'Товар 1' },
      { id: 2, name: 'Товар 2' },
    ]),
  });

  render(<ProductList />);

  // Ждём появления элементов
  const product1 = await screen.findByText('Товар 1');
  expect(product1).toBeInTheDocument();
});
```

### Приоритет запросов

RTL рекомендует следующий порядок использования запросов (от наиболее предпочтительного):

1. **`getByRole`** — отражает семантику HTML и доступность (accessibility)
2. **`getByLabelText`** — для полей формы, связанных с label
3. **`getByPlaceholderText`** — для полей без label
4. **`getByText`** — для неинтерактивных элементов с текстом
5. **`getByAltText`** — для изображений
6. **`getByTitle`** — для элементов с title
7. **`getByTestId`** — последний вариант, когда другие способы не подходят

```jsx
// Хорошо — семантический запрос
screen.getByRole('button', { name: /сохранить/i });

// Приемлемо
screen.getByLabelText('Имя пользователя');

// Избегайте без крайней необходимости
screen.getByTestId('save-button');
```

### Запросы для нескольких элементов

Все семейства запросов имеют варианты `All`, возвращающие массивы:

```jsx
// Получить все кнопки на странице
const buttons = screen.getAllByRole('button');
expect(buttons).toHaveLength(3);

// Найти все элементы с определённым текстом
const items = screen.getAllByText(/товар/i);

// Найти все input с placeholder
const inputs = screen.queryAllByPlaceholderText(/введите/i);

// Асинхронно получить все элементы
const links = await screen.findAllByRole('link');
```

## Примеры тестирования компонентов

### Тестирование простого компонента

```jsx
// components/Greeting.jsx
function Greeting({ name }) {
  return <h1>Привет, {name}!</h1>;
}

// components/Greeting.test.jsx
import { render, screen } from '@testing-library/react';
import Greeting from './Greeting';

test('отображает имя пользователя', () => {
  render(<Greeting name="Мария" />);

  expect(screen.getByRole('heading', { level: 1 }))
    .toHaveTextContent('Привет, Мария!');
});

test('отображает правильный текст приветствия', () => {
  render(<Greeting name="Иван" />);

  expect(screen.getByText('Привет, Иван!')).toBeInTheDocument();
});
```

### Тестирование компонента с состоянием

```jsx
// components/Counter.jsx
import { useState } from 'react';

function Counter({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue);

  return (
    <div>
      <p>Значение: <span data-testid="count">{count}</span></p>
      <button onClick={() => setCount(c => c - 1)}>Уменьшить</button>
      <button onClick={() => setCount(c => c + 1)}>Увеличить</button>
      <button onClick={() => setCount(initialValue)}>Сбросить</button>
    </div>
  );
}

// components/Counter.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter', () => {
  test('отображает начальное значение', () => {
    render(<Counter initialValue={5} />);
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });

  test('увеличивает значение при клике', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /увеличить/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  test('уменьшает значение при клике', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={3} />);

    await user.click(screen.getByRole('button', { name: /уменьшить/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  test('сбрасывает значение до начального', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={0} />);

    await user.click(screen.getByRole('button', { name: /увеличить/i }));
    await user.click(screen.getByRole('button', { name: /увеличить/i }));
    await user.click(screen.getByRole('button', { name: /сбросить/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
```

### Тестирование форм

```jsx
// components/LoginForm.jsx
import { useState } from 'react';

function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Войти</button>
    </form>
  );
}

// components/LoginForm.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  test('отображает все поля формы', () => {
    render(<LoginForm onSubmit={() => {}} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  test('показывает ошибку при пустых полях', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} />);

    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Заполните все поля');
  });

  test('вызывает onSubmit с правильными данными', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  test('не вызывает onSubmit при неверных данных', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

### Тестирование асинхронных компонентов

```jsx
// components/UserProfile.jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Не удалось загрузить данные');
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// components/UserProfile.test.jsx
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

// Мокируем fetch
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('показывает индикатор загрузки изначально', () => {
  global.fetch.mockResolvedValue({
    json: () => new Promise(() => {}), // никогда не завершается
  });

  render(<UserProfile userId="1" />);

  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
});

test('отображает данные пользователя после загрузки', async () => {
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({ name: 'Анна Петрова', email: 'anna@example.com' }),
  });

  render(<UserProfile userId="1" />);

  // findBy ждёт появления элемента
  expect(await screen.findByRole('heading', { level: 1 }))
    .toHaveTextContent('Анна Петрова');
  expect(screen.getByText('anna@example.com')).toBeInTheDocument();
});

test('показывает сообщение об ошибке при неудачном запросе', async () => {
  global.fetch.mockRejectedValue(new Error('Network error'));

  render(<UserProfile userId="1" />);

  expect(await screen.findByRole('alert'))
    .toHaveTextContent('Не удалось загрузить данные');
});
```

### Тестирование компонентов с контекстом

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// components/UserMenu.jsx
import { useAuth } from '../context/AuthContext';

function UserMenu() {
  const { user } = useAuth();

  if (!user) return <a href="/login">Войти</a>;
  return <span>Привет, {user.name}!</span>;
}

// components/UserMenu.test.jsx
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import UserMenu from './UserMenu';

// Вспомогательная функция для рендера с контекстом
function renderWithAuth(ui, { user = null } = {}) {
  return render(
    <AuthContext.Provider value={{ user, setUser: jest.fn() }}>
      {ui}
    </AuthContext.Provider>
  );
}

test('показывает ссылку "Войти" для неавторизованного пользователя', () => {
  renderWithAuth(<UserMenu />);
  expect(screen.getByRole('link', { name: /войти/i })).toBeInTheDocument();
});

test('показывает приветствие для авторизованного пользователя', () => {
  renderWithAuth(<UserMenu />, { user: { name: 'Дмитрий' } });
  expect(screen.getByText('Привет, Дмитрий!')).toBeInTheDocument();
});
```

### Тестирование компонентов с React Router

```jsx
// components/NavLink.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from './Navigation';

// Оборачиваем в MemoryRouter для тестирования
function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

test('навигация отображает ссылки', () => {
  renderWithRouter(<Navigation />);

  expect(screen.getByRole('link', { name: /главная/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /о нас/i })).toBeInTheDocument();
});
```

## Матчеры jest-dom

`@testing-library/jest-dom` добавляет удобные матчеры для проверки состояния DOM-элементов:

```jsx
// Проверка наличия в документе
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Проверка видимости
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Проверка текстового содержимого
expect(element).toHaveTextContent('Привет');
expect(element).toHaveTextContent(/привет/i);

// Проверка атрибутов
expect(input).toHaveValue('текст');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();
expect(button).toBeEnabled();

// Проверка классов
expect(element).toHaveClass('active');
expect(element).not.toHaveClass('hidden');

// Проверка стилей
expect(element).toHaveStyle('color: red');
expect(element).toHaveStyle({ color: 'red', fontSize: '16px' });

// Проверка атрибутов HTML
expect(input).toHaveAttribute('type', 'email');
expect(link).toHaveAttribute('href', '/about');

// Проверка фокуса
expect(input).toHaveFocus();

// Проверка формы
expect(form).toHaveFormValues({
  email: 'user@example.com',
  password: 'secret',
});
```

## Лучшие практики

### 1. Используйте семантические запросы

Отдавайте предпочтение запросам по роли и тексту перед `getByTestId`. Это делает тесты ближе к реальному пользовательскому опыту и улучшает доступность приложения.

```jsx
// Хорошо
screen.getByRole('button', { name: /сохранить/i });
screen.getByLabelText(/email/i);
screen.getByText(/добро пожаловать/i);

// Избегайте без необходимости
screen.getByTestId('save-btn');
screen.getByTestId('email-input');
```

### 2. Используйте userEvent вместо fireEvent

`userEvent` лучше имитирует реальное поведение пользователя и проверяет больше аспектов взаимодействия:

```jsx
// Предпочтительно
const user = userEvent.setup();
await user.type(input, 'текст');
await user.click(button);

// Менее реалистично
fireEvent.change(input, { target: { value: 'текст' } });
fireEvent.click(button);
```

### 3. Не тестируйте детали реализации

Тесты не должны зависеть от внутреннего состояния компонента, имён методов или структуры props, которые не видны пользователю:

```jsx
// Плохо — тестирует реализацию
const { result } = renderHook(() => useCounter());
expect(result.current.internalState).toBe(0);

// Хорошо — тестирует поведение
render(<Counter />);
expect(screen.getByText('0')).toBeInTheDocument();
```

### 4. Создавайте вспомогательные функции для общих провайдеров

Если компоненты зависят от контекстов или провайдеров, создайте обёртку один раз:

```jsx
// test-utils.jsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

export function renderWithProviders(ui, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>,
    options
  );
}

// Экспортируем всё из testing library + наши утилиты
export * from '@testing-library/react';
```

Теперь в тестах импортируйте из `test-utils` вместо `@testing-library/react`:

```jsx
import { renderWithProviders, screen } from '../test-utils';
```

### 5. Правильно организуйте тесты с describe

Группируйте связанные тесты с помощью `describe` для лучшей читаемости:

```jsx
describe('LoginForm', () => {
  describe('начальное состояние', () => {
    test('отображает пустые поля ввода', () => {});
    test('кнопка "Войти" доступна', () => {});
  });

  describe('валидация', () => {
    test('показывает ошибку при пустом email', async () => {});
    test('показывает ошибку при коротком пароле', async () => {});
  });

  describe('успешная отправка', () => {
    test('вызывает onSubmit с данными формы', async () => {});
    test('показывает индикатор загрузки', async () => {});
  });
});
```

### 6. Не злоупотребляйте data-testid

`data-testid` — это запасной вариант. Если вам нужно добавить его к каждому элементу — это сигнал, что разметка недостаточно семантична:

```jsx
// Плохо — разметка без семантики
<div data-testid="submit-button" onClick={handleSubmit}>
  Отправить
</div>

// Хорошо — семантическая разметка
<button type="submit">Отправить</button>
// Тест: screen.getByRole('button', { name: /отправить/i })
```

### 7. Используйте waitFor для ожидания состояний

`waitFor` позволяет ждать выполнения асинхронных утверждений:

```jsx
import { render, screen, waitFor } from '@testing-library/react';

test('сообщение об успехе появляется после сохранения', async () => {
  const user = userEvent.setup();
  render(<SaveForm />);

  await user.click(screen.getByRole('button', { name: /сохранить/i }));

  // Ждём, пока условие не выполнится
  await waitFor(() => {
    expect(screen.getByText(/успешно сохранено/i)).toBeInTheDocument();
  });
});
```

### 8. Очищайте моки между тестами

Используйте `beforeEach`/`afterEach` для очистки состояния между тестами:

```jsx
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
  // или jest.clearAllMocks() для сброса вызовов без удаления реализации
});
```

## Заключение

React Testing Library — это мощный инструмент, который помогает писать тесты, отражающие реальное использование ваших компонентов. Основные принципы, которые стоит запомнить:

- Используйте семантические запросы (`getByRole`, `getByLabelText`) вместо `getByTestId`
- Предпочитайте `userEvent` для имитации пользовательских взаимодействий
- Используйте `findBy` для асинхронных операций и `queryBy` для проверки отсутствия элементов
- Не тестируйте детали реализации — тестируйте поведение
- Создавайте вспомогательные функции для общих провайдеров

Следуя этим принципам, вы будете писать тесты, которым можно доверять: они ломаются только тогда, когда реальное поведение приложения изменяется, а не при рефакторинге кода.
