# Композиция компонентов в React

**Композиция компонентов (Component Composition)** — ключевой паттерн в React, при котором сложные UI-элементы строятся из небольших, переиспользуемых компонентов. Вместо наследования React использует **composition over inheritance**: компоненты передают другие компоненты через пропсы, включая специальный проп `children`.

```jsx
// Простейшая демонстрация: Card содержит Header и Body
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <Header title="Заголовок" />
  <Body text="Содержимое" />
</Card>
```

## Базовые концепции

### Проп `children`

Самый распространённый способ композиции — передача JSX-содержимого через `children`:

```jsx
function Panel({ children }) {
  return (
    <div className="panel">
      {children}
    </div>
  );
}

function App() {
  return (
    <Panel>
      <h2>Мой заголовок</h2>
      <p>Мой текст</p>
    </Panel>
  );
}
```

### Слоты через именованные пропсы

Когда нужно несколько "мест" для вставки — используют именованные пропсы вместо `children`:

```jsx
function Dialog({ title, content, footer }) {
  return (
    <div className="dialog">
      <div className="dialog-header">{title}</div>
      <div className="dialog-content">{content}</div>
      <div className="dialog-footer">{footer}</div>
    </div>
  );
}

// Использование
<Dialog
  title={<h2>Подтверждение</h2>}
  content={<p>Вы уверены, что хотите удалить?</p>}
  footer={
    <div>
      <button onClick={onCancel}>Отмена</button>
      <button onClick={onConfirm}>Удалить</button>
    </div>
  }
/>
```

## Паттерны композиции

### 1. Containment (Контейнер-компонент)

Компонент-контейнер не знает о своём содержимом заранее. Он задаёт структуру и стили, а содержимое полностью определяет потребитель:

```jsx
function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

function CardBody({ children }) {
  return <div className="card-body">{children}</div>;
}

function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
}

// Использование
function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
      </CardHeader>
      <CardBody>
        <p>{user.bio}</p>
      </CardBody>
      <CardFooter>
        <button>Подписаться</button>
      </CardFooter>
    </Card>
  );
}
```

### 2. Specialization (Специализация)

Компонент «специализирует» более общий компонент, фиксируя часть его пропсов:

```jsx
// Общий компонент
function Button({ variant, size, children, ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Специализированные версии
function PrimaryButton(props) {
  return <Button variant="primary" size="md" {...props} />;
}

function DangerButton(props) {
  return <Button variant="danger" size="md" {...props} />;
}

function SmallPrimaryButton(props) {
  return <Button variant="primary" size="sm" {...props} />;
}

// Использование
<PrimaryButton onClick={handleSave}>Сохранить</PrimaryButton>
<DangerButton onClick={handleDelete}>Удалить</DangerButton>
```

### 3. Composition через пропсы-компоненты

Принимать компоненты (не только JSX) как пропсы для максимальной гибкости:

```jsx
function List({ items, renderItem, EmptyState = DefaultEmpty }) {
  if (!items.length) return <EmptyState />;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.id ?? index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

function DefaultEmpty() {
  return <p>Список пуст</p>;
}

// Использование
function UserList({ users }) {
  return (
    <List
      items={users}
      renderItem={(user) => <span>{user.name} — {user.email}</span>}
      EmptyState={() => <p>Пользователей нет. <a href="/invite">Пригласить?</a></p>}
    />
  );
}
```

### 4. Compound Components (Составные компоненты)

Группа компонентов, работающих вместе через общий контекст. Пользователь явно описывает структуру:

```jsx
import { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

function Tabs({ defaultTab, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list" role="tablist">{children}</div>;
}

function Tab({ id, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      role="tab"
      className={activeTab === id ? 'tab active' : 'tab'}
      onClick={() => setActiveTab(id)}
      aria-selected={activeTab === id}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
}

// Присоединяем вложенные компоненты к родителю
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Использование — полный контроль над структурой
function ProfilePage() {
  return (
    <Tabs defaultTab="info">
      <Tabs.List>
        <Tabs.Tab id="info">Информация</Tabs.Tab>
        <Tabs.Tab id="posts">Записи</Tabs.Tab>
        <Tabs.Tab id="settings">Настройки</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel id="info"><UserInfo /></Tabs.Panel>
      <Tabs.Panel id="posts"><UserPosts /></Tabs.Panel>
      <Tabs.Panel id="settings"><UserSettings /></Tabs.Panel>
    </Tabs>
  );
}
```

## Практические примеры

### Layout-компоненты

```jsx
function AppLayout({ sidebar, header, children }) {
  return (
    <div className="app-layout">
      <header className="app-header">{header}</header>
      <div className="app-body">
        <aside className="app-sidebar">{sidebar}</aside>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

// Использование
<AppLayout
  header={<TopNav user={currentUser} />}
  sidebar={<NavigationMenu links={navLinks} />}
>
  <DashboardPage />
</AppLayout>
```

### Форма через композицию

```jsx
function Form({ onSubmit, children }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(new FormData(e.target));
  };
  return <form onSubmit={handleSubmit}>{children}</form>;
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function SubmitButton({ children = 'Отправить' }) {
  return <button type="submit">{children}</button>;
}

// Использование — структура определяется потребителем
function LoginForm({ onLogin }) {
  return (
    <Form onSubmit={(data) => onLogin(Object.fromEntries(data))}>
      <Field label="Email">
        <input type="email" name="email" required />
      </Field>
      <Field label="Пароль">
        <input type="password" name="password" required />
      </Field>
      <SubmitButton>Войти</SubmitButton>
    </Form>
  );
}
```

### Провайдеры и составные контексты

```jsx
// Несколько провайдеров — через композицию
function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Использование
function App() {
  return (
    <AppProviders>
      <Router>
        <Routes />
      </Router>
    </AppProviders>
  );
}
```

## TypeScript и типизация

```typescript
import { ReactNode } from 'react';

// Типизация children
interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>;
}

// Типизация слотов
interface DialogProps {
  title: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

function Dialog({ title, content, footer, onClose }: DialogProps) {
  return (
    <div className="dialog" role="dialog">
      <div className="dialog-header">
        {title}
        <button onClick={onClose} aria-label="Закрыть">×</button>
      </div>
      <div className="dialog-content">{content}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </div>
  );
}

// Типизация renderItem
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  EmptyState?: React.ComponentType;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  EmptyState,
}: ListProps<T>) {
  if (!items.length) {
    return EmptyState ? <EmptyState /> : null;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Compound Components с типами
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within Tabs');
  return ctx;
}
```

## Антипаттерны

### Глубокое пробрасывание пропсов (Prop Drilling)

```jsx
// ❌ Плохо — Avatar не нужен пропс user, он его только передаёт дальше
function Page({ user }) {
  return <Header user={user} />;
}
function Header({ user }) {
  return <Avatar user={user} />;
}
function Avatar({ user }) {
  return <img src={user.avatarUrl} alt={user.name} />;
}

// ✅ Хорошо — передаём готовый элемент, минуя промежуточные компоненты
function Page({ user }) {
  return <Header avatar={<img src={user.avatarUrl} alt={user.name} />} />;
}
function Header({ avatar }) {
  return <div className="header">{avatar}</div>;
}
```

### Монолитные компоненты

```jsx
// ❌ Плохо — один компонент отвечает за всё
function UserDashboard({ user }) {
  return (
    <div>
      {/* 200 строк JSX для разных частей дашборда */}
    </div>
  );
}

// ✅ Хорошо — декомпозиция на независимые части
function UserDashboard({ user }) {
  return (
    <DashboardLayout>
      <UserProfile user={user} />
      <UserStats userId={user.id} />
      <UserActivity userId={user.id} />
    </DashboardLayout>
  );
}
```

## Композиция vs Наследование

React явно рекомендует предпочитать **композицию наследованию**. В отличие от классического ООП-наследования, React-компоненты:

| Аспект | Наследование | Композиция |
|--------|-------------|------------|
| Расширение | `extends BaseComponent` | пропсы, `children`, контекст |
| Связанность | Высокая (tight coupling) | Низкая (loose coupling) |
| Переиспользование | Ограниченное иерархией | Свободное, гибкое |
| Тестирование | Сложнее (нужен базовый класс) | Легче (изолированные части) |
| Читаемость | Неявная логика в родителе | Явная структура в JSX |

```jsx
// ❌ Антипаттерн: наследование в React
class SpecialButton extends Button {
  render() {
    return super.render(); // Хрупко, не рекомендуется
  }
}

// ✅ Правильно: композиция
function SpecialButton(props) {
  return <Button {...props} className={`special ${props.className}`} />;
}
```

## Резюме

| Паттерн | Когда применять |
|---------|----------------|
| `children` | Произвольное содержимое, контейнеры, layout |
| Именованные слоты | Фиксированные секции (header/body/footer) |
| Пропсы-компоненты | Кастомный рендеринг элементов списков, пустых состояний |
| Compound Components | Связанные компоненты с общим состоянием (Tabs, Accordion, Select) |
| Specialization | Предустановленные варианты общего компонента |

Композиция компонентов — основа масштабируемой React-архитектуры. Она позволяет строить сложные интерфейсы из простых блоков, сохраняя ясность кода и упрощая тестирование.

## Дополнительные ресурсы

- [Composition vs Inheritance — React Docs](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
