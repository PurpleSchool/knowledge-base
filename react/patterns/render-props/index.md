# Render Props в React

**Render Props** — паттерн в React, при котором компонент получает функцию как проп и вызывает её для определения того, что рендерить. Это позволяет переиспользовать логику между компонентами, предоставляя гибкость в управлении рендерингом.

```jsx
// Общая идея
<ComponentWithLogic render={(data) => <UI data={data} />} />
```

## Базовый синтаксис

```jsx
// Компонент с render prop
function DataProvider({ render }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  // Вызываем функцию-проп для рендеринга
  return render(data);
}

// Использование
function App() {
  return (
    <DataProvider
      render={(data) => (
        data ? <DataDisplay data={data} /> : <Loading />
      )}
    />
  );
}
```

## Варианты реализации

### 1. Проп с именем `render`

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {render(position)}
    </div>
  );
}

// Использование
<MouseTracker
  render={({ x, y }) => (
    <div>
      <h1>Позиция мыши: ({x}, {y})</h1>
      <Cursor x={x} y={y} />
    </div>
  )}
/>
```

### 2. Children как функция (Function as Children)

Наиболее популярный вариант — передача функции через `children`:

```jsx
function Toggle({ children }) {
  const [isOn, setIsOn] = useState(false);

  const toggle = () => setIsOn(prev => !prev);

  // children — это функция
  return children({ isOn, toggle });
}

// Использование — более "чистый" JSX
<Toggle>
  {({ isOn, toggle }) => (
    <div>
      <button onClick={toggle}>
        {isOn ? 'Выключить' : 'Включить'}
      </button>
      {isOn && <Panel />}
    </div>
  )}
</Toggle>
```

### 3. Несколько render props

```jsx
function DataGrid({ data, renderRow, renderEmpty, renderLoading }) {
  const { items, loading } = data;

  if (loading) return renderLoading();
  if (!items.length) return renderEmpty();

  return (
    <table>
      <tbody>
        {items.map((item, index) => renderRow(item, index))}
      </tbody>
    </table>
  );
}

// Использование
<DataGrid
  data={usersData}
  renderRow={(user, i) => <UserRow key={user.id} user={user} index={i} />}
  renderEmpty={() => <EmptyState message="Пользователи не найдены" />}
  renderLoading={() => <TableSkeleton rows={5} />}
/>
```

## Практические примеры

### Отслеживание мыши

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

// С render props
function MousePosition({ children }) {
  const position = useMousePosition();
  return children(position);
}

// Использование
<MousePosition>
  {({ x, y }) => (
    <div>
      <img
        src="/cursor-effect.png"
        style={{ transform: `translate(${x}px, ${y}px)` }}
      />
    </div>
  )}
</MousePosition>
```

### Асинхронная загрузка данных

```jsx
function Async({ promise, children }) {
  const [state, setState] = useState({
    status: 'pending',
    data: null,
    error: null,
  });

  useEffect(() => {
    setState({ status: 'pending', data: null, error: null });

    promise
      .then(data => setState({ status: 'resolved', data, error: null }))
      .catch(error => setState({ status: 'rejected', data: null, error }));
  }, [promise]);

  return children(state);
}

// Использование
const userPromise = useMemo(() => api.getUser(userId), [userId]);

<Async promise={userPromise}>
  {({ status, data: user, error }) => {
    if (status === 'pending') return <Spinner />;
    if (status === 'rejected') return <Error message={error.message} />;
    return <UserProfile user={user} />;
  }}
</Async>
```

### Форма с валидацией

```jsx
function Form({ initialValues, validate, onSubmit, children }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const validationErrors = validate(values);
    setErrors(validationErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(values);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(values);
    } else {
      setErrors(validationErrors);
      // Помечаем все поля как touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }), {}
      );
      setTouched(allTouched);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {children({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isValid: Object.keys(validate(values)).length === 0,
      })}
    </form>
  );
}

// Использование
<Form
  initialValues={{ email: '', password: '' }}
  validate={(values) => {
    const errors = {};
    if (!values.email) errors.email = 'Email обязателен';
    if (!values.email.includes('@')) errors.email = 'Неверный формат email';
    if (values.password.length < 8) errors.password = 'Минимум 8 символов';
    return errors;
  }}
  onSubmit={(values) => login(values)}
>
  {({ values, errors, touched, handleChange, handleBlur, isValid }) => (
    <>
      <input
        type="email"
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
      />
      {touched.email && errors.email && <span>{errors.email}</span>}

      <input
        type="password"
        value={values.password}
        onChange={(e) => handleChange('password', e.target.value)}
        onBlur={() => handleBlur('password')}
      />
      {touched.password && errors.password && <span>{errors.password}</span>}

      <button type="submit" disabled={!isValid}>
        Войти
      </button>
    </>
  )}
</Form>
```

### Контекстные провайдеры с Render Props

```jsx
function ThemeConsumer({ children }) {
  const theme = useContext(ThemeContext);
  return children(theme);
}

// Использование
<ThemeConsumer>
  {(theme) => (
    <div style={{ background: theme.background, color: theme.text }}>
      Стилизованный контент
    </div>
  )}
</ThemeConsumer>
```

## TypeScript с Render Props

```typescript
// Типизация render props
interface RenderProps<T> {
  children: (data: T) => React.ReactNode;
}

interface MousePosition {
  x: number;
  y: number;
}

function MouseTracker({ children }: RenderProps<MousePosition>) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) =>
      setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return <>{children(position)}</>;
}

// Типизация компонента с несколькими render props
interface DataListProps<T> {
  items: T[];
  loading: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

function DataList<T extends { id: string | number }>({
  items,
  loading,
  renderItem,
  renderEmpty = () => <p>Нет данных</p>,
  renderLoading = () => <p>Загрузка...</p>,
}: DataListProps<T>) {
  if (loading) return <>{renderLoading()}</>;
  if (!items.length) return <>{renderEmpty()}</>;
  return <ul>{items.map((item, i) => renderItem(item, i))}</ul>;
}

// Использование
<DataList
  items={users}
  loading={isLoading}
  renderItem={(user) => (
    <li key={user.id}>{user.name}</li>
  )}
/>
```

## Render Props vs Custom Hooks

Современный React предпочитает **кастомные хуки** там, где раньше использовались render props:

```jsx
// Render Props — старый подход
function MousePosition({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => { /* ... */ }, []);
  return children(pos);
}

// Использование
<MousePosition>
  {(pos) => <Cursor {...pos} />}
</MousePosition>

// Custom Hook — современный подход
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => { /* ... */ }, []);
  return pos;
}

// Использование
function Component() {
  const pos = useMousePosition();
  return <Cursor {...pos} />;
}
```

### Когда Render Props всё ещё уместны

```jsx
// 1. Нужен контроль над рендерингом снаружи
<Virtualized
  items={largeList}
  renderItem={(item) => <CustomRow item={item} />}  // ← Рендер определяет потребитель
/>

// 2. Паттерны "Slot" / "Compound Components"
<Modal>
  <Modal.Header>{() => <CustomHeader />}</Modal.Header>
  <Modal.Body>{() => <ModalContent />}</Modal.Body>
</Modal>

// 3. Рендеринг в разных местах DOM
<DataContainer>
  {(data) => (
    <>
      <Sidebar data={data} />    {/* В сайдбаре */}
      <MainContent data={data} /> {/* В основном контенте */}
    </>
  )}
</DataContainer>

// 4. Библиотеки (downshift, react-table, формики)
<Downshift>
  {({ getInputProps, getMenuProps, getItemProps, isOpen, inputValue }) => (
    <div>
      <input {...getInputProps()} />
      {isOpen && (
        <ul {...getMenuProps()}>
          {items.map((item, i) => (
            <li {...getItemProps({ key: item.id, index: i, item })}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</Downshift>
```

## Потенциальные проблемы

### 1. Callback hell при вложенности

```jsx
// ❌ "Пирамида судьбы" с render props
<Mouse>
  {mouse => (
    <Window>
      {window => (
        <Auth>
          {user => (
            <Data userId={user.id}>
              {data => (
                <Component mouse={mouse} window={window} user={user} data={data} />
              )}
            </Data>
          )}
        </Auth>
      )}
    </Window>
  )}
</Mouse>

// ✅ Решение — кастомные хуки
function Component() {
  const mouse = useMouse();
  const window = useWindow();
  const user = useAuth();
  const data = useData(user.id);
  return <UI mouse={mouse} window={window} user={user} data={data} />;
}
```

### 2. Создание новой функции при каждом рендере

```jsx
// ❌ Новая функция при каждом рендере
<Toggle>
  {({ isOn, toggle }) => <Button onClick={toggle}>{isOn ? 'On' : 'Off'}</Button>}
</Toggle>

// ✅ Использование useCallback если проблема производительности
const renderToggle = useCallback(
  ({ isOn, toggle }) => <Button onClick={toggle}>{isOn ? 'On' : 'Off'}</Button>,
  []
);

<Toggle>{renderToggle}</Toggle>
```

## Резюме

| Аспект | Описание |
|--------|----------|
| Суть | Функция как проп определяет, что рендерить |
| Варианты | `render` prop, `children` как функция |
| Преимущество | Гибкость, переиспользование логики, разделение ответственности |
| Недостаток | Вложенность, новые функции при рендере |
| Современная альтернатива | Кастомные хуки для логики |
| Актуальность | Для slot/compound паттернов, библиотек, контроля рендера |

Render Props — мощный паттерн, который был революционным до появления хуков. Сегодня для переиспользования логики предпочтительнее **кастомные хуки**, но render props остаются актуальными для компонентов с гибким управлением рендерингом.

## Дополнительные ресурсы

- [Render Props — React Docs](https://react.dev/reference/react/cloneElement#passing-data-with-a-render-prop)
- [Downshift — пример render props библиотеки](https://github.com/downshift-js/downshift)
- [Recompose — утилиты для render props](https://github.com/acdlite/recompose)
