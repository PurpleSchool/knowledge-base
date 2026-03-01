# Частичное применение компонентов в React

**Частичное применение компонентов (Partial Application of Components)** — паттерн проектирования в React, при котором создаётся новый компонент с заранее заполненными (зафиксированными) пропсами родительского компонента. Это позволяет получать специализированные версии общих компонентов без дублирования кода.

Паттерн основан на концепции **частичного применения функций** из функционального программирования: когда функция с несколькими аргументами вызывается с частью аргументов и возвращает новую функцию, ожидающую оставшиеся.

```tsx
// Базовая идея: Button с зафиксированным вариантом
function Button({ variant, size, children, onClick }) {
  return (
    <button className={`btn btn--${variant} btn--${size}`} onClick={onClick}>
      {children}
    </button>
  );
}

// Частичное применение: фиксируем variant и size
const PrimaryButton = (props) => <Button variant="primary" size="md" {...props} />;
const DangerButton = (props) => <Button variant="danger" size="md" {...props} />;

// Использование
<PrimaryButton onClick={handleSave}>Сохранить</PrimaryButton>
<DangerButton onClick={handleDelete}>Удалить</DangerButton>
```

## Проблема, которую решает паттерн

### Без частичного применения: дублирование пропсов

При разработке UI часто встречается ситуация, когда один и тот же компонент используется во многих местах с одинаковым набором пропсов:

```tsx
// ❌ Повторяем одни и те же пропсы везде — это неудобно и ненадёжно
function OrdersPage() {
  return (
    <Table
      striped
      hoverable
      dense
      bordered={false}
      stickyHeader
      data={orders}
      columns={orderColumns}
    />
  );
}

function ProductsPage() {
  return (
    <Table
      striped
      hoverable
      dense
      bordered={false}
      stickyHeader
      data={products}
      columns={productColumns}
    />
  );
}

function UsersPage() {
  return (
    <Table
      striped
      hoverable
      dense
      bordered={false}
      stickyHeader
      data={users}
      columns={userColumns}
    />
  );
}
```

Каждый раз при необходимости изменить внешний вид таблицы (например, убрать `dense`) придётся вносить правки в каждом месте использования. Это нарушает принцип DRY (Don't Repeat Yourself) и увеличивает риск ошибок.

### С частичным применением: единая точка настройки

```tsx
// ✅ Создаём специализированный компонент один раз
const DataTable = (props) => (
  <Table
    striped
    hoverable
    dense
    bordered={false}
    stickyHeader
    {...props}
  />
);

// Теперь используем DataTable везде — легко и без дублирования
function OrdersPage() {
  return <DataTable data={orders} columns={orderColumns} />;
}

function ProductsPage() {
  return <DataTable data={products} columns={productColumns} />;
}

function UsersPage() {
  return <DataTable data={users} columns={userColumns} />;
}
```

## Реализация через функцию-фабрику

Для более системного подхода можно создать утилиту `withProps`, которая автоматизирует частичное применение:

```tsx
// Утилита для частичного применения пропсов
function withProps<P extends object>(
  Component: React.ComponentType<P>,
  presetProps: Partial<P>
) {
  const DisplayName = Component.displayName || Component.name || 'Component';

  const ComponentWithPresetProps = (props: P) => (
    <Component {...presetProps} {...props} />
  );

  ComponentWithPresetProps.displayName = `withProps(${DisplayName})`;
  return ComponentWithPresetProps;
}

// Применение
const PrimaryButton = withProps(Button, { variant: 'primary', size: 'md' });
const SmallIconButton = withProps(Button, { size: 'sm', iconOnly: true });
const LoadingSpinner = withProps(Spinner, { size: 24, color: 'brand' });
```

### Пример: система оповещений

```tsx
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  icon?: React.ReactNode;
}

function Alert({ type, title, message, dismissible = false, icon }: AlertProps) {
  const icons = {
    info: <InfoIcon />,
    success: <CheckIcon />,
    warning: <WarningIcon />,
    error: <ErrorIcon />,
  };

  return (
    <div className={`alert alert--${type}`}>
      <span className="alert__icon">{icon ?? icons[type]}</span>
      <div className="alert__content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {dismissible && <button className="alert__close">×</button>}
    </div>
  );
}

// Создаём специализированные компоненты через частичное применение
const InfoAlert = withProps(Alert, { type: 'info', dismissible: true });
const SuccessAlert = withProps(Alert, { type: 'success', dismissible: true });
const WarningAlert = withProps(Alert, { type: 'warning', dismissible: true });
const ErrorAlert = withProps(Alert, { type: 'error', dismissible: true });

// Использование — читаемо и выразительно
<SuccessAlert title="Сохранено" message="Данные успешно обновлены" />
<ErrorAlert title="Ошибка" message="Не удалось подключиться к серверу" />
```

## Переопределение зафиксированных пропсов

Важная особенность паттерна — возможность переопределить заранее заданные пропсы при необходимости. Порядок spread-операторов определяет приоритет:

```tsx
// Порядок важен: последний {...props} позволяет переопределить preset
const DefaultModal = (props) => (
  <Modal size="md" closable centered {...props} />
);

// Использование с переопределением
<DefaultModal size="lg" title="Большое окно">  // size="lg" перезапишет "md"
  Контент модального окна
</DefaultModal>
```

Если нужно запретить переопределение определённых пропсов, поместите их после spread:

```tsx
// Фиксируем variant жёстко — переопределить нельзя
const BrandButton = (props) => (
  <Button {...props} variant="brand" />
);

// Даже если передать variant="danger", будет использоваться "brand"
<BrandButton variant="danger">Кнопка всегда будет brand-цвета</BrandButton>
```

## Частичное применение с контекстом темы

Паттерн хорошо сочетается с системой тем и дизайн-системами:

```tsx
// Базовый типографический компонент
interface TextProps {
  as?: keyof JSX.IntrinsicElements;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'danger' | 'success';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

function Text({ as: Tag = 'p', size = 'md', weight = 'regular', color = 'primary', align = 'left', children }: TextProps) {
  return (
    <Tag className={`text text--${size} text--${weight} text--${color} text--${align}`}>
      {children}
    </Tag>
  );
}

// Создаём полный набор типографических компонентов
const Heading1 = withProps(Text, { as: 'h1', size: '2xl', weight: 'bold' });
const Heading2 = withProps(Text, { as: 'h2', size: 'xl', weight: 'semibold' });
const Heading3 = withProps(Text, { as: 'h3', size: 'lg', weight: 'semibold' });
const Caption = withProps(Text, { size: 'xs', color: 'muted' });
const ErrorText = withProps(Text, { size: 'sm', color: 'danger' });
const Label = withProps(Text, { as: 'label', size: 'sm', weight: 'medium' });

// Готовая типографическая система!
function ProfileCard({ user }) {
  return (
    <div>
      <Heading2>{user.name}</Heading2>
      <Caption>{user.joinDate}</Caption>
      <ErrorText>{user.errorMessage}</ErrorText>
    </div>
  );
}
```

## Частичное применение vs Higher-Order Components

Частичное применение компонентов — это упрощённая форма HOC (Higher-Order Components). Важно понимать различия:

```tsx
// HOC — оборачивает компонент, может добавлять новую логику
function withAuth<P>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Redirect to="/login" />;
    return <Component {...props} />;
  };
}

// Частичное применение — только фиксирует пропсы, не добавляет логику
const AdminButton = withProps(Button, { variant: 'admin', requiresConfirm: true });
```

| Характеристика | Частичное применение | HOC |
|----------------|---------------------|-----|
| Добавление логики | ❌ | ✅ |
| Добавление состояния | ❌ | ✅ |
| Использование хуков | ❌ | ✅ |
| Простота | ✅ Очень простой | ⚠️ Сложнее |
| Предназначение | Фиксация пропсов | Расширение поведения |

## Практический пример: библиотека форм

Рассмотрим, как частичное применение помогает создать удобную систему форм:

```tsx
// Базовый компонент поля ввода
interface InputProps {
  type?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

function Input({ type = 'text', size = 'md', variant = 'default', ...props }: InputProps) {
  return (
    <div className={`input-wrapper input-wrapper--${size} input-wrapper--${variant}`}>
      {props.label && (
        <label className="input__label">
          {props.label}
          {props.required && <span className="input__required">*</span>}
        </label>
      )}
      <input
        type={type}
        className="input__field"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
        disabled={props.disabled}
      />
      {props.error && <span className="input__error">{props.error}</span>}
    </div>
  );
}

// Создаём специализированные поля через частичное применение
const EmailInput = withProps(Input, { type: 'email', placeholder: 'example@mail.ru' });
const PasswordInput = withProps(Input, { type: 'password', placeholder: '••••••••' });
const SearchInput = withProps(Input, { type: 'search', size: 'sm', placeholder: 'Поиск...' });
const FilledInput = withProps(Input, { variant: 'filled' });
const OutlinedInput = withProps(Input, { variant: 'outlined' });

// Использование в форме регистрации
function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form>
      <EmailInput
        label="Email"
        required
        value={email}
        onChange={setEmail}
      />
      <PasswordInput
        label="Пароль"
        required
        value={password}
        onChange={setPassword}
      />
    </form>
  );
}
```

## Частичное применение с React.cloneElement

Альтернативный подход — использование `React.cloneElement` для создания специализированных компонентов:

```tsx
// Создание специализированной версии через cloneElement
function createSpecialized(element: React.ReactElement, presetProps: object) {
  return (props: object) => React.cloneElement(element, { ...presetProps, ...props });
}

const baseButton = <Button variant="primary" size="md" />;
const SaveButton = createSpecialized(baseButton, { type: 'submit', icon: <SaveIcon /> });

// Однако этот подход менее предпочтителен — withProps чище и понятнее
```

## Когда использовать паттерн

**Используйте частичное применение, когда:**

- Один и тот же компонент многократно используется с одинаковым набором пропсов
- Нужно создать семейство похожих компонентов (кнопки, алерты, типографика)
- Хотите инкапсулировать конфигурацию компонента в отдельную сущность
- Реализуете дизайн-систему или UI-библиотеку
- Нужно адаптировать сторонний компонент под стандарты проекта

**Не используйте, когда:**

- Нужно добавить логику, состояние или работу с хуками — используйте HOC
- Компонент используется в одном месте — нет смысла в абстракции
- Нужна сложная трансформация пропсов — рассмотрите HOC или render props

## Типизация в TypeScript

При использовании TypeScript важно правильно типизировать `withProps`, чтобы IDE корректно показывала доступные пропсы:

```tsx
function withProps<P extends object, K extends keyof P>(
  Component: React.ComponentType<P>,
  presetProps: Pick<P, K>
): React.ComponentType<Omit<P, K> & Partial<Pick<P, K>>> {
  const WithPresetProps = (props: Omit<P, K> & Partial<Pick<P, K>>) => (
    <Component {...presetProps} {...(props as P)} />
  );

  WithPresetProps.displayName = `withProps(${Component.displayName ?? Component.name})`;
  return WithPresetProps;
}

// TypeScript знает, что PrimaryButton не требует variant и size,
// но они могут быть переданы для переопределения
const PrimaryButton = withProps(Button, { variant: 'primary' as const, size: 'md' as const });

// ✅ Работает
<PrimaryButton onClick={handleClick}>Сохранить</PrimaryButton>

// ✅ Переопределение тоже работает
<PrimaryButton variant="secondary" onClick={handleClick}>Отмена</PrimaryButton>
```

## Итог

Частичное применение компонентов — это простой, но мощный паттерн для создания специализированных компонентов на основе общих. Он помогает:

- **Избежать дублирования** одинаковых наборов пропсов
- **Создать единую точку изменений** для семейства похожих компонентов
- **Улучшить читаемость** кода: `<SuccessAlert />` понятнее, чем `<Alert type="success" dismissible />`
- **Строить дизайн-системы** с чёткой иерархией компонентов

Паттерн особенно ценен при работе с UI-библиотеками, где один базовый компонент (Button, Input, Typography) порождает десятки специализированных версий.
