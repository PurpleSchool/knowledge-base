# Render Props — паттерн

## Введение

**Render Props** — это паттерн в React, при котором компонент принимает функцию в качестве пропса (или через `children`), и вызывает эту функцию для рендеринга контента. Этот подход позволяет компонентам делиться логикой и состоянием с другими компонентами.

Термин «render prop» относится к пропсу, значением которого является функция, возвращающая React-элемент.

```jsx
<DataProvider render={(data) => <h1>Привет, {data.name}</h1>} />
```

## Проблема, которую решает паттерн

Представьте, что у вас есть несколько компонентов, которым нужна одинаковая логика — например, отслеживание позиции мыши. Без паттернов переиспользования вам пришлось бы дублировать логику в каждом компоненте.

```jsx
// ❌ Дублирование логики
function ComponentA() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return <div>Позиция мыши: {position.x}, {position.y}</div>;
}

function ComponentB() {
  // Та же логика дублируется...
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ...
}
```

Render Props решает эту проблему, инкапсулируя логику в один компонент и предоставляя данные через функцию.

## Базовый синтаксис

### Вариант с пропсом `render`

```jsx
// Компонент с render prop
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (event) => {
    setPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };
  
  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {render(position)}
    </div>
  );
}

// Использование
function App() {
  return (
    <MouseTracker
      render={(position) => (
        <p>
          Мышь находится на позиции: {position.x}, {position.y}
        </p>
      )}
    />
  );
}
```

### Вариант через `children` как функцию

Чаще всего render props реализуются через `children` в виде функции (Function as Children / Children as a Function):

```jsx
// Компонент с children как функцией
function MouseTracker({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (event) => {
    setPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };
  
  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {children(position)}
    </div>
  );
}

// Использование — более читаемый синтаксис
function App() {
  return (
    <MouseTracker>
      {(position) => (
        <p>
          Мышь находится на позиции: {position.x}, {position.y}
        </p>
      )}
    </MouseTracker>
  );
}
```

## Практические примеры

### Пример 1: Провайдер данных с загрузкой

```jsx
function DataFetcher({ url, render }) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  
  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка загрузки');
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }));
  }, [url]);
  
  return render(state);
}

// Использование
function UserProfile({ userId }) {
  return (
    <DataFetcher
      url={`/api/users/${userId}`}
      render={({ data, loading, error }) => {
        if (loading) return <Spinner />;
        if (error) return <ErrorMessage message={error.message} />;
        return <UserCard user={data} />;
      }}
    />
  );
}

function PostList({ userId }) {
  return (
    <DataFetcher
      url={`/api/users/${userId}/posts`}
      render={({ data, loading, error }) => {
        if (loading) return <Skeleton count={3} />;
        if (error) return <p>Не удалось загрузить посты</p>;
        return data.map((post) => <PostCard key={post.id} post={post} />);
      }}
    />
  );
}
```

### Пример 2: Управление формой

```jsx
function FormController({ initialValues, onSubmit, children }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку при изменении поля
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {children({ values, errors, isSubmitting, handleChange })}
    </form>
  );
}

// Использование
function LoginForm() {
  return (
    <FormController
      initialValues={{ email: '', password: '' }}
      onSubmit={(values) => loginUser(values)}
    >
      {({ values, errors, isSubmitting, handleChange }) => (
        <>
          <div>
            <input
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          
          <div>
            <input
              type="password"
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Пароль"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </>
      )}
    </FormController>
  );
}
```

### Пример 3: Toggler — управление булевым состоянием

```jsx
function Toggle({ initialOn = false, children }) {
  const [on, setOn] = useState(initialOn);
  
  const toggle = () => setOn((prev) => !prev);
  const setToggle = (value) => setOn(value);
  
  return children({ on, toggle, setToggle });
}

// Использование
function App() {
  return (
    <Toggle initialOn={false}>
      {({ on, toggle }) => (
        <div>
          <button onClick={toggle}>
            {on ? 'Скрыть' : 'Показать'} детали
          </button>
          {on && (
            <div className="details">
              <p>Дополнительная информация...</p>
            </div>
          )}
        </div>
      )}
    </Toggle>
  );
}

// Тот же Toggle для модального окна
function ModalExample() {
  return (
    <Toggle>
      {({ on, toggle }) => (
        <>
          <button onClick={toggle}>Открыть модальное окно</button>
          {on && (
            <Modal onClose={toggle}>
              <p>Содержимое модального окна</p>
            </Modal>
          )}
        </>
      )}
    </Toggle>
  );
}
```

### Пример 4: Intersection Observer (ленивая загрузка)

```jsx
function IntersectionObserver({ threshold = 0.1, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return (
    <div ref={ref}>
      {children({ isVisible, ref })}
    </div>
  );
}

// Использование
function LazyImage({ src, alt }) {
  return (
    <IntersectionObserver threshold={0.1}>
      {({ isVisible }) => (
        <div className="image-container">
          {isVisible ? (
            <img src={src} alt={alt} />
          ) : (
            <div className="image-placeholder" />
          )}
        </div>
      )}
    </IntersectionObserver>
  );
}
```

## Render Props с TypeScript

TypeScript требует явного указания типов для функций-рендерера:

```tsx
// Определяем типы данных
interface MousePosition {
  x: number;
  y: number;
}

// Вариант 1: через пропс render
interface MouseTrackerProps {
  render: (position: MousePosition) => React.ReactNode;
}

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setPosition({ x: event.clientX, y: event.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {render(position)}
    </div>
  );
}

// Вариант 2: через children как функцию
interface MouseTrackerChildrenProps {
  children: (position: MousePosition) => React.ReactNode;
}

function MouseTrackerWithChildren({ children }: MouseTrackerChildrenProps) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setPosition({ x: event.clientX, y: event.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {children(position)}
    </div>
  );
}

// Универсальный компонент с generic для DataFetcher
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface DataFetcherProps<T> {
  url: string;
  children: (state: FetchState<T>) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  
  useEffect(() => {
    fetch(url)
      .then((res) => res.json() as Promise<T>)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }));
  }, [url]);
  
  return <>{children(state)}</>;
}

// Использование с типами
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  return (
    <DataFetcher<User> url={`/api/users/${userId}`}>
      {({ data, loading, error }) => {
        if (loading) return <div>Загрузка...</div>;
        if (error) return <div>Ошибка: {error.message}</div>;
        if (!data) return null;
        return <div>{data.name} — {data.email}</div>;
      }}
    </DataFetcher>
  );
}
```

## Сравнение с хуками

С появлением React Hooks многие сценарии использования Render Props можно заменить кастомными хуками. Рассмотрим одну и ту же логику в двух вариантах:

### Логика отслеживания мыши

**Render Props подход:**
```jsx
function MouseTracker({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  
  return children(position);
}

// Использование
function App() {
  return (
    <MouseTracker>
      {({ x, y }) => <div>Мышь: {x}, {y}</div>}
    </MouseTracker>
  );
}
```

**Хук подход:**
```jsx
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  
  return position;
}

// Использование — проще и читабельнее
function App() {
  const { x, y } = useMousePosition();
  return <div>Мышь: {x}, {y}</div>;
}
```

### Когда что использовать

| Критерий | Render Props | Custom Hook |
|----------|-------------|-------------|
| Логика + JSX структура | ✅ Удобно | ❌ Требует обёртки |
| Только логика (без JSX) | ⚠️ Избыточно | ✅ Идеально |
| Вложенность компонентов | ❌ Глубокая вложенность | ✅ Нет вложенности |
| Читаемость | ⚠️ Средняя | ✅ Высокая |
| Тестируемость | ✅ Хорошая | ✅ Отличная |
| Совместимость | ✅ Все версии React | ✅ React 16.8+ |

## Когда использовать Render Props

Render Props остаётся полезным паттерном в следующих случаях:

### 1. Когда нужно контролировать структуру JSX

```jsx
// Компонент управляет тем, что рендерится, но предоставляет данные
function VirtualList({ items, itemHeight, children }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 400;
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) =>
          children({
            item,
            index: startIndex + index,
            style: {
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
            },
          })
        )}
      </div>
    </div>
  );
}
```

### 2. Паттерн "инверсия управления"

```jsx
// Родитель полностью контролирует рендеринг
function Autocomplete({ suggestions, children }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );
  
  return children({
    query,
    setQuery,
    isOpen,
    setIsOpen,
    suggestions: filtered,
  });
}

// Полный контроль над UI
function SearchBox() {
  return (
    <Autocomplete suggestions={['React', 'Vue', 'Angular', 'Svelte']}>
      {({ query, setQuery, isOpen, setIsOpen, suggestions }) => (
        <div className="autocomplete">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          {isOpen && suggestions.length > 0 && (
            <ul className="dropdown">
              {suggestions.map((s) => (
                <li key={s} onClick={() => { setQuery(s); setIsOpen(false); }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Autocomplete>
  );
}
```

### 3. Библиотеки и переиспользуемые компоненты

Render Props отлично подходит для создания библиотечных компонентов, где нельзя предполагать структуру UI пользователя:

```jsx
// В библиотеке
export function DraggableItem({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handlers = {
    onDragStart: () => setIsDragging(true),
    onDragEnd: (e) => {
      setIsDragging(false);
      setPosition({ x: e.clientX, y: e.clientY });
    },
  };
  
  return children({ isDragging, position, handlers });
}

// Пользователь библиотеки сам решает, как выглядит UI
function MyDraggableCard() {
  return (
    <DraggableItem>
      {({ isDragging, handlers }) => (
        <div
          className={`card ${isDragging ? 'dragging' : ''}`}
          draggable
          {...handlers}
        >
          Перетащи меня
        </div>
      )}
    </DraggableItem>
  );
}
```

## Потенциальные проблемы

### Проблема производительности: новая функция при каждом рендере

```jsx
// ❌ Проблема: при каждом рендере App создаётся новая функция
function App() {
  return (
    <MouseTracker
      render={(position) => <Cat position={position} />}
    />
  );
}

// ✅ Решение 1: вынести функцию за пределы компонента (если не нужен замыкание)
const renderCat = (position) => <Cat position={position} />;

function App() {
  return <MouseTracker render={renderCat} />;
}

// ✅ Решение 2: использовать useCallback
function App() {
  const renderCat = useCallback(
    (position) => <Cat position={position} />,
    []
  );
  
  return <MouseTracker render={renderCat} />;
}

// ✅ Решение 3: если используете PureComponent — оборачивайте в компонент
class MouseTracker extends React.PureComponent {
  // PureComponent не поможет, если render prop — новая функция каждый раз!
}
```

### «Ад вложенности» (Render Props Hell)

```jsx
// ❌ Плохо: глубокая вложенность нечитаема
function App() {
  return (
    <MouseTracker>
      {(mouse) => (
        <DataFetcher url="/api/data">
          {({ data, loading }) => (
            <Toggle>
              {({ on, toggle }) => (
                <FormController initialValues={{}}>
                  {({ values, handleChange }) => (
                    <div>
                      {/* Реальный UI глубоко внутри */}
                    </div>
                  )}
                </FormController>
              )}
            </Toggle>
          )}
        </DataFetcher>
      )}
    </MouseTracker>
  );
}

// ✅ Лучше: разбить на компоненты или использовать хуки
function AppContent({ mouse, data, loading }) {
  const { on, toggle } = useToggle();
  const { values, handleChange } = useForm({});
  
  return <div>{/* UI */}</div>;
}

function App() {
  return (
    <MouseTracker>
      {(mouse) => (
        <DataFetcher url="/api/data">
          {(fetchState) => (
            <AppContent mouse={mouse} {...fetchState} />
          )}
        </DataFetcher>
      )}
    </MouseTracker>
  );
}
```

## Комбинирование с другими паттернами

### Render Props + HOC

```jsx
// Можно создать HOC на основе render prop компонента
function withMouse(Component) {
  return function WithMouseComponent(props) {
    return (
      <MouseTracker>
        {(position) => <Component {...props} mouse={position} />}
      </MouseTracker>
    );
  };
}

// Использование
const CatWithMouse = withMouse(Cat);
```

### Render Props + Context

```jsx
const ThemeContext = React.createContext('light');

function ThemeConsumer({ children }) {
  return (
    <ThemeContext.Consumer>
      {(theme) => children({ theme, isDark: theme === 'dark' })}
    </ThemeContext.Consumer>
  );
}

// Context.Consumer — это render prop «из коробки»!
function ThemedButton() {
  return (
    <ThemeConsumer>
      {({ theme, isDark }) => (
        <button className={isDark ? 'btn-dark' : 'btn-light'}>
          Текущая тема: {theme}
        </button>
      )}
    </ThemeConsumer>
  );
}
```

## Итоги

**Render Props** — мощный паттерн для переиспользования логики в React. Он предоставляет максимальную гибкость, позволяя потребителю полностью контролировать рендеринг.

### Ключевые преимущества:
- ✅ Полный контроль над рендерингом у потребителя
- ✅ Явная передача данных через параметры функции
- ✅ Хорошая типизация в TypeScript
- ✅ Работает во всех версиях React

### Основные недостатки:
- ❌ Может приводить к «аду вложенности»
- ❌ Проблемы с производительностью при создании новых функций
- ❌ Менее читабелен по сравнению с хуками

### Когда использовать сегодня:
1. Когда компонент должен управлять структурой рендеринга
2. Для библиотечных компонентов с инверсией управления
3. Когда нужно шарить не только логику, но и JSX-обёртку
4. В legacy-коде, где хуки ещё не используются

В большинстве случаев для переиспользования **только логики** (без JSX) предпочтительнее использовать **кастомные хуки**. Render Props и хуки не конкурируют — они дополняют друг друга.

## Ссылки

- [React документация: Render Props](https://legacy.reactjs.org/docs/render-props.html)
- [Kent C. Dodds: Use a Render Prop!](https://kentcdodds.com/blog/use-a-render-prop)
- [Michael Jackson: Never Write Another HoC](https://www.youtube.com/watch?v=BcVAq3YFiuc)
