---
metaTitle: "React act() — тестирование асинхронных обновлений"
metaDescription: "Полное руководство по act() в React-тестах: синхронные и асинхронные обновления состояния, userEvent, waitFor и устранение предупреждений."
author: "Антон Ларичев"
title: "React act() — тестирование асинхронных обновлений состояния"
preview: "Разбираем функцию act() из React Testing Library: зачем она нужна, как работает с асинхронным кодом и почему без неё тесты дают ложные результаты."
---

## Что такое act() и зачем он нужен

Когда React обновляет состояние компонента, он не делает это мгновенно. Обновления батчингуются, компоненты перерендериваются асинхронно, эффекты запускаются после отрисовки. В тестовой среде это создаёт проблему: assertions могут выполниться раньше, чем React завершит все обновления.

Функция `act()` решает эту проблему. Она оборачивает код, который вызывает обновления состояния, и гарантирует, что перед переходом к следующей строке теста React:

- применил все обновления состояния
- выполнил все эффекты (`useEffect`, `useLayoutEffect`)
- обновил DOM

```javascript
import { act } from 'react';
// или
import { act } from '@testing-library/react';
```

Без `act()` вы будете видеть предупреждение в консоли:

```
Warning: An update to MyComponent inside a test was not wrapped in act(...).
```

Это не просто предупреждение — оно сигнализирует, что ваш тест проверяет компонент в промежуточном, нестабильном состоянии.

## Синхронный act()

Для синхронных обновлений `act()` принимает обычную функцию:

```javascript
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import Counter from './Counter';

test('инкремент счётчика', () => {
  render(<Counter />);

  act(() => {
    screen.getByRole('button', { name: 'Увеличить' }).click();
  });

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

Однако на практике вы редко пишете `act()` вручную при использовании React Testing Library (RTL). Все утилиты RTL — `fireEvent`, `userEvent`, `render` — уже обёрнуты в `act()` внутри библиотеки.

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('инкремент счётчика', () => {
  render(<Counter />);

  // fireEvent.click уже обёрнут в act() внутри RTL
  fireEvent.click(screen.getByRole('button', { name: 'Увеличить' }));

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

## Асинхронный act()

Асинхронный `act()` появляется, когда обновления состояния происходят в результате:

- fetch-запросов
- setTimeout / setInterval
- Promise
- асинхронных обработчиков событий

Для таких случаев `act()` принимает асинхронную функцию и возвращает Promise:

```javascript
import { act } from 'react';

test('загрузка данных пользователя', async () => {
  render(<UserProfile userId={1} />);

  await act(async () => {
    // ждём, пока fetch завершится и состояние обновится
  });

  expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
});
```

Рассмотрим полный пример с компонентом, который загружает данные:

```javascript
// UserProfile.jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Загрузка...</p>;
  return <h1>{user.name}</h1>;
}
```

```javascript
// UserProfile.test.jsx
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import UserProfile from './UserProfile';

// Мокируем fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ name: 'Иван Иванов' }),
  })
);

test('отображает имя пользователя после загрузки', async () => {
  await act(async () => {
    render(<UserProfile userId={1} />);
  });

  expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
});
```

## waitFor и findBy — act() под капотом

React Testing Library предоставляет более удобные инструменты для асинхронных тестов, которые используют `act()` внутри:

### waitFor

`waitFor` повторяет callback до тех пор, пока он не перестанет выбрасывать ошибку или не истечёт таймаут:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

test('отображает имя пользователя', async () => {
  render(<UserProfile userId={1} />);

  // Ждём появления элемента
  await waitFor(() => {
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
  });
});
```

### findBy-запросы

`findBy*` — это комбинация `getBy*` + `waitFor`. Они возвращают Promise и ждут появления элемента:

```javascript
test('отображает имя пользователя', async () => {
  render(<UserProfile userId={1} />);

  // findByText ждёт, пока элемент не появится в DOM
  const heading = await screen.findByText('Иван Иванов');
  expect(heading).toBeInTheDocument();
});
```

`findBy` предпочтительнее `waitFor` + `getBy` для простых случаев ожидания элемента — код чище и намерение яснее.

## userEvent и асинхронные обновления

Библиотека `@testing-library/user-event` симулирует реальное поведение пользователя (наведение, клик, ввод текста). Начиная с версии 14, `userEvent` стал полностью асинхронным:

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchForm from './SearchForm';

test('поиск возвращает результаты', async () => {
  const user = userEvent.setup();
  render(<SearchForm />);

  // userEvent методы — асинхронные, await обязателен
  await user.type(screen.getByRole('textbox'), 'React');
  await user.click(screen.getByRole('button', { name: 'Найти' }));

  // Ждём появления результатов
  const results = await screen.findByRole('list');
  expect(results).toBeInTheDocument();
});
```

Подход `userEvent.setup()` создаёт изолированный экземпляр с собственным состоянием — это предпочтительный способ работы с `userEvent` v14+.

## Типичные ошибки и их устранение

### Ошибка 1: предупреждение «not wrapped in act»

```
Warning: An update to MyComponent inside a test was not wrapped in act(...)
```

Причина: состояние обновляется после завершения теста (например, таймер или незавершённый Promise).

```javascript
// Плохо — состояние обновится после завершения теста
test('компонент с таймером', () => {
  render(<TimerComponent />);
  // тест завершился, но setTimeout внутри компонента ещё не сработал
  expect(screen.getByText('0')).toBeInTheDocument();
});

// Хорошо — используем fake timers
test('компонент с таймером', () => {
  jest.useFakeTimers();
  render(<TimerComponent />);

  act(() => {
    jest.runAllTimers();
  });

  expect(screen.getByText('1')).toBeInTheDocument();
  jest.useRealTimers();
});
```

### Ошибка 2: забытый await перед act()

```javascript
// Плохо — act() вернул Promise, но мы его не ждём
test('загрузка данных', () => {
  act(async () => {  // Promise игнорируется!
    render(<AsyncComponent />);
  });

  expect(screen.getByText('данные')).toBeInTheDocument(); // упадёт
});

// Хорошо
test('загрузка данных', async () => {
  await act(async () => {
    render(<AsyncComponent />);
  });

  expect(screen.getByText('данные')).toBeInTheDocument();
});
```

### Ошибка 3: несколько обновлений состояния

Когда несколько обновлений состояния происходят последовательно, `act()` обрабатывает их все вместе:

```javascript
// Компонент с несколькими обновлениями
function MultiUpdate() {
  const [step, setStep] = useState(0);

  const handleClick = async () => {
    setStep(1);                    // первое обновление
    await fetchData();             // асинхронная операция
    setStep(2);                    // второе обновление
  };

  return (
    <div>
      <button onClick={handleClick}>Запустить</button>
      <p>Шаг: {step}</p>
    </div>
  );
}

// Тест
test('проходит все шаги', async () => {
  const user = userEvent.setup();
  render(<MultiUpdate />);

  await user.click(screen.getByRole('button'));

  // waitFor ждёт финального состояния
  await waitFor(() => {
    expect(screen.getByText('Шаг: 2')).toBeInTheDocument();
  });
});
```

## act() с кастомными хуками

Для тестирования кастомных хуков используйте `renderHook` из RTL, который уже обёрнут в `act()`:

```javascript
import { renderHook, act } from '@testing-library/react';
import useCounter from './useCounter';

test('инкремент счётчика', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

Для асинхронных хуков:

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import useFetchUser from './useFetchUser';

test('загружает данные пользователя', async () => {
  const { result } = renderHook(() => useFetchUser(1));

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.user.name).toBe('Иван Иванов');
});
```

## Практический пример: форма с валидацией и API

Рассмотрим полный сценарий — форму регистрации с асинхронной валидацией:

```javascript
// RegistrationForm.jsx
import { useState } from 'react';

function RegistrationForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      await onSubmit({ email });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
      {status === 'success' && <p>Регистрация прошла успешно!</p>}
      {status === 'error' && <p role="alert">{error}</p>}
    </form>
  );
}
```

```javascript
// RegistrationForm.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from './RegistrationForm';

describe('RegistrationForm', () => {
  test('успешная регистрация', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    // Проверяем промежуточное состояние загрузки
    expect(screen.getByRole('button')).toBeDisabled();

    // Ждём завершения
    await waitFor(() => {
      expect(screen.getByText('Регистрация прошла успешно!')).toBeInTheDocument();
    });

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  test('отображает ошибку при неудаче', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('Email уже занят'));

    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Email'), 'taken@example.com');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Email уже занят');
  });
});
```

## Когда использовать что

| Сценарий | Инструмент |
|---|---|
| Синхронное обновление состояния | `fireEvent` или `userEvent` (act внутри) |
| Ожидание элемента в DOM | `findBy*` |
| Ожидание условия | `waitFor` |
| Прямые вызовы setState | `act()` явно |
| Fake timers | `act(() => jest.runAllTimers())` |
| Тестирование хуков | `renderHook` + `act()` при необходимости |

## Итог

`act()` — это механизм синхронизации между обновлениями React и вашими assertions. Ключевые принципы:

- Используйте `async/await act()` для асинхронных обновлений состояния
- Предпочитайте `findBy*` и `waitFor` из RTL вместо ручного `act()` — они делают код чище
- `userEvent` v14+ асинхронен — всегда добавляйте `await`
- Предупреждение «not wrapped in act» означает утечку асинхронных обновлений за пределы теста
- При работе с таймерами используйте `jest.useFakeTimers()` вместе с `act()`

Правильное использование `act()` делает тесты детерминированными: они всегда проверяют стабильное, финальное состояние компонента, а не промежуточный снимок.

Чтобы углубиться в тестирование React-приложений и освоить все паттерны на практике, посмотрите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-testing