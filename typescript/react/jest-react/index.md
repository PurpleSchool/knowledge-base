---
metaTitle: Jest для React с TypeScript — тестирование компонентов и хуков
metaDescription: Полное руководство по тестированию React-приложений с Jest и TypeScript. Юнит-тесты компонентов, хуков, RTL, моки и лучшие практики TDD
author: Олег Марков
title: Jest для React с TypeScript
preview: Научитесь тестировать React-компоненты и хуки с Jest и Testing Library, используя TypeScript для полной типобезопасности тестов
---

## Введение

Тестирование — ключевая часть качественной разработки. Jest в сочетании с React Testing Library (RTL) и TypeScript даёт мощную платформу для надёжного тестирования React-приложений. В этой статье мы разберём настройку, написание тестов с полной типизацией и лучшие практики.

## Настройка проекта

### Установка зависимостей

```bash
npm install --save-dev jest @types/jest
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest-environment-jsdom
npm install --save-dev ts-jest
# или используйте babel-jest с @babel/preset-typescript
```

### Конфигурация Jest

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  // Среда выполнения — jsdom имитирует браузер
  testEnvironment: 'jsdom',
  
  // Настройка TypeScript через ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  
  // Файлы с дополнительными матчерами (jest-dom)
  setupFilesAfterFramework: ['<rootDir>/src/setupTests.ts'],
  
  // Паттерны для файлов тестов
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
  
  // Алиасы путей (должны совпадать с tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Покрытие кода
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/main.tsx',
  ],
  
  coverageThresholds: {
    global: {
      lines: 80,
      branches: 80,
    },
  },
};

export default config;
```

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';

// Расширяем типы Jest с матчерами jest-dom
// (если не подтягивается автоматически)
import type { } from '@testing-library/jest-dom';

// Глобальные моки (если нужны)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Тестирование компонентов

### Базовые тесты рендеринга

```tsx
// src/components/Button/Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      data-testid="button"
    >
      {label}
    </button>
  );
}

// src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Нажми меня" onClick={() => {}} />);
    
    expect(screen.getByText('Нажми меня')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button label="Нажмите" onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button label="Отключено" onClick={handleClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('applies correct CSS class for variant', () => {
    const { rerender } = render(<Button label="Кнопка" onClick={() => {}} variant="primary" />);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
    
    rerender(<Button label="Кнопка" onClick={() => {}} variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

### Тестирование форм

```tsx
// src/components/LoginForm/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  it('renders email and password fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });
  
  it('shows validation errors for empty submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    await user.click(screen.getByRole('button', { name: /войти/i }));
    
    expect(await screen.findByText(/введите email/i)).toBeInTheDocument();
    expect(await screen.findByText(/введите пароль/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
  
  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    
    // Задержка ответа
    mockOnSubmit.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));
    
    expect(screen.getByRole('button', { name: /вход\.\.\./i })).toBeDisabled();
  });
});
```

## Тестирование хуков

Для тестирования хуков используйте `renderHook` из RTL:

```tsx
// src/hooks/useCounter/useCounter.ts
interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
}

function useCounter({
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
}: UseCounterOptions = {}): UseCounterReturn {
  const [count, setCountState] = React.useState(initialValue);
  
  const increment = React.useCallback(() => {
    setCountState(prev => Math.min(prev + step, max));
  }, [step, max]);
  
  const decrement = React.useCallback(() => {
    setCountState(prev => Math.max(prev - step, min));
  }, [step, min]);
  
  const reset = React.useCallback(() => {
    setCountState(initialValue);
  }, [initialValue]);
  
  const setCount = React.useCallback((value: number) => {
    setCountState(Math.max(min, Math.min(max, value)));
  }, [min, max]);
  
  return { count, increment, decrement, reset, setCount };
}

// src/hooks/useCounter/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
    expect(result.current.count).toBe(10);
  });
  
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
    
    act(() => result.current.increment());
    expect(result.current.count).toBe(2);
  });
  
  it('decrements count', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => result.current.decrement());
    expect(result.current.count).toBe(4);
  });
  
  it('respects max limit', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 9, max: 10 }));
    
    act(() => result.current.increment());
    expect(result.current.count).toBe(10);
    
    act(() => result.current.increment());
    expect(result.current.count).toBe(10); // Не превышает max
  });
  
  it('respects min limit', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 1, min: 0 }));
    
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0);
    
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0); // Не падает ниже min
  });
  
  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.count).toBe(7);
    
    act(() => result.current.reset());
    expect(result.current.count).toBe(5);
  });
  
  it('uses custom step', () => {
    const { result } = renderHook(() => useCounter({ step: 5 }));
    
    act(() => result.current.increment());
    expect(result.current.count).toBe(5);
  });
});
```

## Мокирование с TypeScript

### Мокирование функций

```tsx
// Типизированный мок через jest.fn()
const mockFetch = jest.fn<Promise<Response>, [RequestInfo, RequestInit?]>();

// Мок с конкретным возвращаемым значением
const mockGetUser = jest.fn<Promise<User>, [string]>()
  .mockResolvedValue({
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    role: 'admin',
  });

// Использование jest.spyOn
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// После теста восстанавливаем
afterEach(() => consoleSpy.mockRestore());
```

### Мокирование модулей

```tsx
// src/api/users.ts
export async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

// src/components/UserList/UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserList } from './UserList';
import * as usersApi from '../../api/users';

// Мокируем весь модуль
jest.mock('../../api/users');

// Получаем типизированный мок
const mockedFetchUsers = jest.mocked(usersApi.fetchUsers);

describe('UserList', () => {
  beforeEach(() => {
    mockedFetchUsers.mockClear();
  });
  
  it('displays users after loading', async () => {
    const mockUsers: User[] = [
      { id: '1', name: 'Анна Иванова', email: 'anna@example.com', role: 'user' },
      { id: '2', name: 'Пётр Сидоров', email: 'petr@example.com', role: 'editor' },
    ];
    
    mockedFetchUsers.mockResolvedValue(mockUsers);
    
    render(<UserList />);
    
    // Проверяем загрузку
    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
    
    // Ждём появления данных
    await waitFor(() => {
      expect(screen.getByText('Анна Иванова')).toBeInTheDocument();
      expect(screen.getByText('Пётр Сидоров')).toBeInTheDocument();
    });
  });
  
  it('displays error on fetch failure', async () => {
    mockedFetchUsers.mockRejectedValue(new Error('Network error'));
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/произошла ошибка/i)).toBeInTheDocument();
    });
  });
});
```

### Тестирование с провайдерами контекста

```tsx
// src/test-utils/render.tsx — кастомный render с провайдерами
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

interface WrapperProps {
  children: ReactNode;
}

// Обёртка со всеми глобальными провайдерами
function AllProviders({ children }: WrapperProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Экспортируем всё из testing-library + наш кастомный render
export * from '@testing-library/react';
export { customRender as render };

// Использование в тестах
import { render, screen } from '../test-utils/render';

describe('UserProfile', () => {
  it('renders user info', () => {
    render(<UserProfile userId="1" />);
    // Компонент теперь имеет доступ к контексту через провайдеры
  });
});
```

## Тестирование асинхронных операций

```tsx
// src/components/DataLoader/DataLoader.test.tsx
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';

describe('DataLoader', () => {
  it('loads and displays data', async () => {
    render(<DataLoader resourceId="123" />);
    
    // Вариант 1: waitFor — ждём пока элемент появится
    const heading = await waitFor(() =>
      screen.getByRole('heading', { name: 'Данные загружены' })
    );
    expect(heading).toBeInTheDocument();
    
    // Вариант 2: findBy* методы — автоматически ждут (используйте их чаще)
    const content = await screen.findByText('Содержимое данных');
    expect(content).toBeInTheDocument();
  });
  
  it('removes loading spinner after data loads', async () => {
    render(<DataLoader resourceId="123" />);
    
    // Ждём пока спиннер исчезнет
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
    
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
```

## Снэпшот-тестирование

```tsx
import { render } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <Badge variant="success" count={5}>
        Уведомления
      </Badge>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Лучшие практики

**1. Тестируйте поведение, а не реализацию:**

```tsx
// Плохо — тестирует внутреннее состояние
expect(component.state.isOpen).toBe(true);

// Хорошо — тестирует то, что видит пользователь
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

**2. Используйте семантические запросы:**

```tsx
// В порядке предпочтения:
screen.getByRole('button', { name: /отправить/i }) // Лучший вариант
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/введите email/i)
screen.getByText(/загрузка/i)
screen.getByTestId('submit-button') // Только если другие не подходят
```

**3. Пишите тесты, которые не ломаются при рефакторинге:**

Тесты должны проверять, что компонент делает, а не как он это делает внутри.

**4. Используйте `userEvent` вместо `fireEvent`:**

```tsx
// userEvent имитирует реальное поведение пользователя (включая focus/blur)
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.type(input, 'текст');
await user.click(button);
```

## Заключение

Тестирование React-приложений с Jest и TypeScript:

- Используйте `ts-jest` или `babel-jest` с TypeScript для запуска тестов
- RTL (`@testing-library/react`) — стандарт для тестирования компонентов
- `renderHook` + `act` для тестирования кастомных хуков
- `jest.mocked()` для типизированного мокирования
- Создайте кастомный `render` с провайдерами для удобного тестирования
- Предпочитайте `findBy*` методы для асинхронных тестов
- Тестируйте поведение, видимое пользователю, а не детали реализации
