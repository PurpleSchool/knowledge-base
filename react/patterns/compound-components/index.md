# Compound Components (Составные компоненты) в React

**Compound Components** — паттерн проектирования в React, при котором несколько компонентов работают вместе как единое целое, разделяя общее состояние и логику. Эти компоненты бессмысленны по отдельности, но в совокупности образуют мощный и гибкий API.

Классический пример из нативного HTML — элементы `<select>` и `<option>`:

```html
<select>
  <option value="apple">Яблоко</option>
  <option value="banana">Банан</option>
  <option value="cherry">Вишня</option>
</select>
```

`<select>` управляет состоянием выбора, а `<option>` — это отдельные варианты. Они неразрывно связаны, но при этом пользователь сам определяет их содержимое и порядок. Именно этот принцип лежит в основе паттерна Compound Components.

## Проблема, которую решает паттерн

### Без Compound Components: монолитный компонент

Рассмотрим реализацию компонента `Tabs` без этого паттерна:

```tsx
// ❌ Монолитный подход — негибкий и сложный в расширении
interface Tab {
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveTab?: number;
  onTabChange?: (index: number) => void;
  tabPosition?: 'top' | 'bottom' | 'left' | 'right';
  tabStyle?: 'default' | 'card' | 'pills';
  showIcons?: boolean;
  renderTabLabel?: (tab: Tab) => React.ReactNode;
}

function Tabs({
  tabs,
  defaultActiveTab = 0,
  onTabChange,
  tabPosition = 'top',
  tabStyle = 'default',
  showIcons = false,
  renderTabLabel,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const handleTabClick = (index: number) => {
    if (!tabs[index].disabled) {
      setActiveTab(index);
      onTabChange?.(index);
    }
  };

  return (
    <div className={`tabs tabs--${tabPosition}`}>
      <div className={`tabs__list tabs__list--${tabStyle}`}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'tab--active' : ''} ${tab.disabled ? 'tab--disabled' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {showIcons && tab.icon && <span className="tab__icon">{tab.icon}</span>}
            {renderTabLabel ? renderTabLabel(tab) : tab.label}
          </button>
        ))}
      </div>
      <div className="tabs__content">
        {tabs[activeTab].content}
      </div>
    </div>
  );
}

// Использование — громоздко и негибко
<Tabs
  tabs={[
    { label: 'Профиль', content: <Profile />, icon: <UserIcon /> },
    { label: 'Настройки', content: <Settings />, icon: <SettingsIcon /> },
    { label: 'Оплата', content: <Billing />, icon: <CreditCardIcon />, disabled: true },
  ]}
  tabStyle="pills"
  showIcons={true}
  tabPosition="left"
/>
```

Проблемы этого подхода:
- **Prop explosion** — с каждым новым требованием добавляются новые пропсы
- **Жёсткая структура** — нельзя изменить порядок или добавить дополнительные элементы между вкладками
- **Слабая расширяемость** — для кастомизации нужно модифицировать компонент изнутри
- **Нарушение принципа единственной ответственности** — компонент знает слишком много

### С Compound Components: гибкий и декларативный API

```tsx
// ✅ Compound Components — гибко, декларативно, расширяемо
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">
      <UserIcon />
      Профиль
    </Tabs.Trigger>
    <Tabs.Trigger value="settings">
      <SettingsIcon />
      Настройки
    </Tabs.Trigger>
    <Tabs.Trigger value="billing" disabled>
      <CreditCardIcon />
      Оплата
    </Tabs.Trigger>
    <div className="tabs__spacer" /> {/* Можно вставить любые элементы */}
    <Tabs.Trigger value="help">Помощь</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="profile">
    <Profile />
  </Tabs.Content>
  <Tabs.Content value="settings">
    <Settings />
  </Tabs.Content>
  <Tabs.Content value="billing">
    <Billing />
  </Tabs.Content>
  <Tabs.Content value="help">
    <Help />
  </Tabs.Content>
</Tabs>
```

Преимущества:
- **Декларативный API** — структура компонента видна в JSX
- **Гибкость** — пользователь сам определяет порядок и содержимое
- **Расширяемость** — можно добавлять произвольные элементы
- **Разделение ответственности** — каждый подкомпонент отвечает за свою часть

## Реализация через React.Children и cloneElement (классический подход)

Исторически первым способом реализации Compound Components был клонирование дочерних элементов с добавлением дополнительных пропсов через `React.cloneElement`.

```tsx
import React, { useState } from 'react';

// Типы
interface AccordionProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
}

interface AccordionItemProps {
  children: React.ReactNode;
  title: string;
  // Эти пропсы будут переданы через cloneElement
  isOpen?: boolean;
  onToggle?: () => void;
}

interface AccordionPanelProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

// Подкомпоненты
function AccordionItem({ title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="accordion-item">
      <button
        className={`accordion-item__header ${isOpen ? 'accordion-item__header--open' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {title}
        <span className="accordion-item__icon">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="accordion-item__body" role="region">
          {children}
        </div>
      )}
    </div>
  );
}

// Родительский компонент управляет состоянием
function Accordion({ children, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultiple) next.clear();
        next.add(index);
      }
      return next;
    });
  };

  // Клонируем дочерние элементы, передавая им состояние
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    // Передаём пропсы только нужному типу компонента
    if (child.type === AccordionItem) {
      return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
        isOpen: openItems.has(index),
        onToggle: () => handleToggle(index),
      });
    }

    return child;
  });

  return <div className="accordion">{childrenWithProps}</div>;
}

// Прикрепляем подкомпонент как статическое свойство
Accordion.Item = AccordionItem;

// Использование
function App() {
  return (
    <Accordion allowMultiple>
      <Accordion.Item title="Что такое React?">
        <p>React — это библиотека для создания пользовательских интерфейсов.</p>
      </Accordion.Item>
      <Accordion.Item title="Что такое Compound Components?">
        <p>Это паттерн, при котором компоненты работают вместе, разделяя состояние.</p>
      </Accordion.Item>
      <Accordion.Item title="Когда использовать этот паттерн?">
        <p>Когда нужен гибкий API для сложных UI-компонентов.</p>
      </Accordion.Item>
    </Accordion>
  );
}
```

### Ограничения классического подхода

```tsx
// ❌ Проблема: cloneElement не работает с вложенными компонентами
<Accordion>
  <div className="wrapper"> {/* Обёртка ломает передачу пропсов */}
    <Accordion.Item title="Элемент 1">
      Содержимое 1
    </Accordion.Item>
  </div>
</Accordion>

// ❌ Проблема: не работает с условным рендерингом через массивы
<Accordion>
  {items.map((item) => (
    <Accordion.Item key={item.id} title={item.title}>
      {item.content}
    </Accordion.Item>
  ))}
</Accordion>
// Индексы будут некорректными при использовании React.Children.map
```

Именно эти ограничения привели к появлению современного подхода через Context API.

## Реализация через Context API (современный подход)

Context API решает главные проблемы классического подхода: состояние теперь передаётся через контекст, а не через клонирование элементов.

### Базовый пример: Select компонент

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

// 1. Определяем тип контекста
interface SelectContextValue {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// 2. Создаём контекст
const SelectContext = createContext<SelectContextValue | null>(null);

// 3. Хук для безопасного доступа к контексту
function useSelectContext(): SelectContextValue {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error(
      'Компоненты Select должны использоваться внутри <Select>. ' +
      'Убедитесь, что компонент является дочерним элементом <Select>.'
    );
  }
  return context;
}

// 4. Подкомпоненты
interface SelectTriggerProps {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

function SelectTrigger({ children, placeholder = 'Выберите...', className }: SelectTriggerProps) {
  const { value, isOpen, setIsOpen } = useSelectContext();

  return (
    <button
      type="button"
      className={`select-trigger ${isOpen ? 'select-trigger--open' : ''} ${className ?? ''}`}
      onClick={() => setIsOpen(!isOpen)}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      {children || value || placeholder}
      <span className="select-trigger__icon" aria-hidden="true">
        {isOpen ? '▲' : '▼'}
      </span>
    </button>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <ul
      role="listbox"
      className={`select-content ${className ?? ''}`}
    >
      {children}
    </ul>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function SelectItem({ value, children, disabled = false, className }: SelectItemProps) {
  const { value: selectedValue, onChange, setIsOpen } = useSelectContext();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      onChange(value);
      setIsOpen(false);
    }
  };

  return (
    <li
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      className={`select-item ${isSelected ? 'select-item--selected' : ''} ${disabled ? 'select-item--disabled' : ''} ${className ?? ''}`}
      onClick={handleClick}
    >
      {children}
      {isSelected && <span className="select-item__check" aria-hidden="true">✓</span>}
    </li>
  );
}

// 5. Корневой компонент предоставляет контекст
interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value: controlledValue, defaultValue = '', onChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }, [isControlled, onChange]);

  return (
    <SelectContext.Provider value={{ value, onChange: handleChange, isOpen, setIsOpen }}>
      <div className="select">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// 6. Прикрепляем подкомпоненты как статические свойства
Select.Trigger = SelectTrigger;
Select.Content = SelectContent;
Select.Item = SelectItem;

// 7. Использование
function App() {
  const [country, setCountry] = useState('');

  return (
    <Select value={country} onChange={setCountry}>
      <Select.Trigger placeholder="Выберите страну" />
      <Select.Content>
        <Select.Item value="ru">Россия</Select.Item>
        <Select.Item value="us">США</Select.Item>
        <Select.Item value="de">Германия</Select.Item>
        <Select.Item value="cn" disabled>Китай (недоступно)</Select.Item>
      </Select.Content>
    </Select>
  );
}
```

### Полная реализация компонента Tabs

```tsx
import React, { createContext, useContext, useState, useId } from 'react';

// Типы
type TabsOrientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  orientation: TabsOrientation;
  baseId: string;
}

// Контекст
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext должен использоваться внутри компонента Tabs');
  }
  return context;
}

// Tabs — корневой компонент
interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  className?: string;
}

function Tabs({
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const setActiveValue = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue, orientation, baseId }}>
      <div
        className={`tabs tabs--${orientation} ${className ?? ''}`}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tabs.List — контейнер для вкладок
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

function TabsList({ children, className, 'aria-label': ariaLabel }: TabsListProps) {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      className={`tabs__list ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

// Tabs.Trigger — кнопка вкладки
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function TabsTrigger({ value, children, disabled = false, className }: TabsTriggerProps) {
  const { activeValue, setActiveValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      className={`tabs__trigger ${isActive ? 'tabs__trigger--active' : ''} ${disabled ? 'tabs__trigger--disabled' : ''} ${className ?? ''}`}
      onClick={() => !disabled && setActiveValue(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) setActiveValue(value);
        }
      }}
    >
      {children}
    </button>
  );
}

// Tabs.Content — панель содержимого
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean; // Рендерить даже если неактивна
}

function TabsContent({ value, children, className, forceMount = false }: TabsContentProps) {
  const { activeValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  if (!isActive && !forceMount) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!isActive}
      className={`tabs__content ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

// Прикрепляем подкомпоненты
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Использование с полной гибкостью
function UserSettings() {
  return (
    <Tabs defaultValue="profile" orientation="vertical">
      <Tabs.List aria-label="Настройки пользователя">
        <Tabs.Trigger value="profile">Профиль</Tabs.Trigger>
        <Tabs.Trigger value="security">Безопасность</Tabs.Trigger>
        <Tabs.Trigger value="notifications">Уведомления</Tabs.Trigger>
        <Tabs.Trigger value="billing" disabled>
          Оплата (скоро)
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="profile">
        <h2>Профиль пользователя</h2>
        <ProfileForm />
      </Tabs.Content>
      <Tabs.Content value="security">
        <h2>Безопасность</h2>
        <SecuritySettings />
      </Tabs.Content>
      <Tabs.Content value="notifications">
        <h2>Уведомления</h2>
        <NotificationSettings />
      </Tabs.Content>
      <Tabs.Content value="billing" forceMount>
        <h2>Оплата</h2>
        <BillingPage /> {/* Рендерится, но скрыт через hidden */}
      </Tabs.Content>
    </Tabs>
  );
}
```

## Явные и неявные Compound Components

### Явные (Explicit) Compound Components

Подкомпоненты прикреплены как статические свойства родителя. Это наиболее распространённый и рекомендуемый подход.

```tsx
// Явные — подкомпоненты доступны через пространство имён родителя
<Card>
  <Card.Header>Заголовок</Card.Header>
  <Card.Body>Содержимое</Card.Body>
  <Card.Footer>
    <Card.Actions>
      <button>Отмена</button>
      <button>Подтвердить</button>
    </Card.Actions>
  </Card.Footer>
</Card>
```

Реализация:

```tsx
const CardContext = createContext<{ variant: string } | null>(null);

function Card({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={`card card--${variant}`}>{children}</div>
    </CardContext.Provider>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  const { variant } = useContext(CardContext)!;
  return <div className={`card__header card__header--${variant}`}>{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card__body">{children}</div>;
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="card__footer">{children}</div>;
}

function CardActions({ children }: { children: React.ReactNode }) {
  return <div className="card__actions">{children}</div>;
}

// Прикрепляем подкомпоненты
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Actions = CardActions;
```

### Неявные (Implicit) Compound Components

Подкомпоненты импортируются и используются независимо, но всё равно работают через общий контекст.

```tsx
// Неявные — компоненты импортируются отдельно
import { Form, FormField, FormLabel, FormInput, FormError } from './form';

<Form onSubmit={handleSubmit}>
  <FormField name="email">
    <FormLabel>Email</FormLabel>
    <FormInput type="email" />
    <FormError />
  </FormField>
  <FormField name="password">
    <FormLabel>Пароль</FormLabel>
    <FormInput type="password" />
    <FormError />
  </FormField>
</Form>
```

Реализация:

```tsx
// form-context.ts
interface FormContextValue {
  errors: Record<string, string>;
  values: Record<string, string>;
  setFieldValue: (name: string, value: string) => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

// form-field-context.ts
interface FormFieldContextValue {
  name: string;
  id: string;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);

// form.tsx
export function Form({ children, onSubmit }: FormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <FormContext.Provider value={{ errors, values, setFieldValue }}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormContext.Provider>
  );
}

// form-field.tsx
export function FormField({ name, children }: { name: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <FormFieldContext.Provider value={{ name, id }}>
      <div className="form-field">{children}</div>
    </FormFieldContext.Provider>
  );
}

// form-input.tsx
export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const formContext = useContext(FormContext)!;
  const fieldContext = useContext(FormFieldContext)!;

  return (
    <input
      id={fieldContext.id}
      name={fieldContext.name}
      value={formContext.values[fieldContext.name] ?? ''}
      onChange={(e) => formContext.setFieldValue(fieldContext.name, e.target.value)}
      {...props}
    />
  );
}

// form-error.tsx
export function FormError() {
  const formContext = useContext(FormContext)!;
  const fieldContext = useContext(FormFieldContext)!;
  const error = formContext.errors[fieldContext.name];

  if (!error) return null;

  return (
    <span role="alert" className="form-error">
      {error}
    </span>
  );
}
```

## Compound Components с TypeScript

TypeScript добавляет типобезопасность и улучшает автодополнение в IDE.

### Типизация статических свойств компонентов

```tsx
// Подход 1: Пространство имён (namespace)
namespace Accordion {
  export interface Props {
    children: React.ReactNode;
    allowMultiple?: boolean;
  }

  export interface ItemProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }
}

// Подход 2: Объединение типов компонента со статическими свойствами
interface TabsComponent extends React.FC<TabsProps> {
  List: React.FC<TabsListProps>;
  Trigger: React.FC<TabsTriggerProps>;
  Content: React.FC<TabsContentProps>;
}

const Tabs = (({ children, defaultValue, ...rest }: TabsProps) => {
  // ... реализация
}) as TabsComponent;

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
```

### Строгая типизация значений через дженерики

```tsx
// Типобезопасный Select с дженериком для значения
interface SelectContextValue<T> {
  value: T | null;
  onChange: (value: T) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function createSelectContext<T>() {
  const Context = createContext<SelectContextValue<T> | null>(null);

  function useSelectContext() {
    const ctx = useContext(Context);
    if (!ctx) throw new Error('useSelectContext: компонент вне Select');
    return ctx;
  }

  return [Context, useSelectContext] as const;
}

// Использование с конкретным типом
interface Country {
  code: string;
  name: string;
}

const [CountrySelectContext, useCountrySelectContext] = createSelectContext<Country>();

function CountrySelect({ children, onChange }: { children: React.ReactNode; onChange: (country: Country) => void }) {
  const [value, setValue] = useState<Country | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (country: Country) => {
    setValue(country);
    onChange(country);
  };

  return (
    <CountrySelectContext.Provider value={{ value, onChange: handleChange, isOpen, setIsOpen }}>
      <div className="select">{children}</div>
    </CountrySelectContext.Provider>
  );
}
```

### Паттерн Builder для улучшения DX

```tsx
// Фабрика для создания Compound Components с полной типизацией
function createCompoundComponent<
  RootProps,
  SubComponents extends Record<string, React.ComponentType<any>>
>(
  RootComponent: React.FC<RootProps>,
  subComponents: SubComponents
): React.FC<RootProps> & SubComponents {
  const Compound = RootComponent as React.FC<RootProps> & SubComponents;

  for (const [key, Component] of Object.entries(subComponents)) {
    (Compound as any)[key] = Component;
  }

  return Compound;
}

// Использование фабрики
const Tabs = createCompoundComponent(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

// TypeScript автоматически выводит тип: typeof TabsRoot & { List: ..., Trigger: ..., Content: ... }
```

## Сравнение подходов: Children API vs Context API

| Критерий | React.Children + cloneElement | Context API |
|----------|-------------------------------|-------------|
| Поддержка вложенности | Только прямые дочерние элементы | Произвольная глубина |
| Производительность | Клонирование при каждом рендере | Подписка на контекст |
| Отладка | Сложнее (магические пропсы) | Проще (явный контекст) |
| TypeScript | Сложная типизация | Удобная типизация |
| Совместимость | Все версии React | React 16.3+ |
| Гибкость API | Ограниченная | Высокая |

### Когда использовать Children API

```tsx
// Children API подходит для простых случаев без глубокой вложенности
function RadioGroup({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <div role="radiogroup">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<{ name: string }>, { name });
      })}
    </div>
  );
}

// Только прямые дочерние Radio получат проп name
<RadioGroup name="color">
  <Radio value="red">Красный</Radio>
  <Radio value="blue">Синий</Radio>
  <Radio value="green">Зелёный</Radio>
</RadioGroup>
```

## Антипаттерны и когда НЕ использовать

### 1. Избыточная сложность для простых компонентов

```tsx
// ❌ Compound Components — избыточно для простой кнопки
<Button>
  <Button.Icon>
    <SaveIcon />
  </Button.Icon>
  <Button.Label>Сохранить</Button.Label>
</Button>

// ✅ Достаточно пропсов
<Button icon={<SaveIcon />} label="Сохранить" />
// или просто
<Button leftIcon={<SaveIcon />}>Сохранить</Button>
```

### 2. Утечка деталей реализации

```tsx
// ❌ Раскрываем внутренние детали через контекст
const TabsContext = createContext({
  activeIndex: 0,          // Внутренняя деталь
  setActiveIndex: () => {},  // Внутренняя деталь
  tabRefs: [],              // Внутренняя деталь
});

// ✅ Контекст содержит только публичный API
const TabsContext = createContext({
  activeValue: '',
  setActiveValue: () => {},
});
```

### 3. Создание compound components без реальной связи

```tsx
// ❌ Компоненты не разделяют состояние — это не Compound Components
const Layout = {
  Header: ({ children }) => <header>{children}</header>,
  Main: ({ children }) => <main>{children}</main>,
  Footer: ({ children }) => <footer>{children}</footer>,
};

// Это просто пространство имён, а не паттерн Compound Components
```

### 4. Слишком строгая проверка типов дочерних элементов

```tsx
// ❌ Хрупкая проверка типа компонента
function Tabs({ children }) {
  React.Children.forEach(children, (child) => {
    if (child.type !== Tab) {
      throw new Error('Tabs принимает только компоненты Tab');
    }
  });
}

// Ломается при использовании HOC, forwardRef, мемоизации:
<Tabs>
  <MemoizedTab value="1">Вкладка 1</MemoizedTab> {/* ❌ Ошибка! */}
</Tabs>

// ✅ Доверяйте пользователям или используйте displayName
```

### 5. Глубокое дерево контекстов без необходимости

```tsx
// ❌ Слишком много вложенных провайдеров для одного компонента
function Form({ children }) {
  return (
    <FormContext.Provider value={formState}>
      <FormValidationContext.Provider value={validation}>
        <FormFieldsContext.Provider value={fields}>
          <FormSubmitContext.Provider value={submit}>
            <FormErrorContext.Provider value={errors}>
              {children}
            </FormErrorContext.Provider>
          </FormSubmitContext.Provider>
        </FormFieldsContext.Provider>
      </FormValidationContext.Provider>
    </FormContext.Provider>
  );
}

// ✅ Объединяйте связанное состояние в один контекст
function Form({ children }) {
  return (
    <FormContext.Provider value={{ fields, validation, submit, errors }}>
      {children}
    </FormContext.Provider>
  );
}
```

## Best Practices

### 1. Всегда проверяйте наличие контекста

```tsx
// ✅ Информативное сообщение об ошибке при использовании вне родителя
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(
      'Компоненты Tabs.Trigger и Tabs.Content должны быть вложены в <Tabs>.\n' +
      'Проверьте структуру вашего JSX.'
    );
  }
  return context;
}
```

### 2. Поддерживайте как контролируемый, так и неконтролируемый режим

```tsx
function Tabs({
  // Неконтролируемый режим: компонент сам управляет состоянием
  defaultValue,
  // Контролируемый режим: состояние управляется снаружи
  value,
  onValueChange,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setActiveValue = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  // ...
}
```

### 3. Добавляйте displayName для отладки

```tsx
TabsList.displayName = 'Tabs.List';
TabsTrigger.displayName = 'Tabs.Trigger';
TabsContent.displayName = 'Tabs.Content';

// Теперь в React DevTools компоненты отображаются как:
// <Tabs.List>, <Tabs.Trigger>, <Tabs.Content>
// вместо просто <TabsList>, <TabsTrigger>, <TabsContent>
```

### 4. Экспортируйте типы подкомпонентов

```tsx
// Экспортируем типы для возможности расширения пользователями
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };

// Пользователи могут типизировать свои обёртки
import type { TabsTriggerProps } from './tabs';

function CustomTabsTrigger({ icon, ...props }: TabsTriggerProps & { icon: React.ReactNode }) {
  return (
    <Tabs.Trigger {...props}>
      <span className="icon">{icon}</span>
      {props.children}
    </Tabs.Trigger>
  );
}
```

### 5. Используйте React.memo для оптимизации

```tsx
// Мемоизация подкомпонентов предотвращает лишние перерендеры
const TabsTrigger = React.memo(function TabsTrigger({ value, children, disabled }: TabsTriggerProps) {
  const { activeValue, setActiveValue } = useTabsContext();
  const isActive = activeValue === value;

  // Компонент перерендерится только при изменении isActive или других пропсов
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveValue(value)}
    >
      {children}
    </button>
  );
});
```

### 6. Разделяйте контексты для чтения и записи

```tsx
// Разделение контекста на чтение и запись предотвращает лишние перерендеры
const TabsStateContext = createContext<{ activeValue: string } | null>(null);
const TabsDispatchContext = createContext<{ setActiveValue: (v: string) => void } | null>(null);

function Tabs({ children, defaultValue }: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <TabsStateContext.Provider value={{ activeValue }}>
      <TabsDispatchContext.Provider value={{ setActiveValue }}>
        <div className="tabs">{children}</div>
      </TabsDispatchContext.Provider>
    </TabsStateContext.Provider>
  );
}

// Компоненты, которые только читают, не перерендерятся при изменении dispatch
function TabsContent({ value, children }: TabsContentProps) {
  const { activeValue } = useContext(TabsStateContext)!; // Только чтение
  if (activeValue !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

// Кнопки используют dispatch, но не зависят от activeValue напрямую
// (они получают isActive через собственное вычисление)
function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { activeValue } = useContext(TabsStateContext)!;
  const { setActiveValue } = useContext(TabsDispatchContext)!;
  const isActive = activeValue === value;

  return (
    <button role="tab" aria-selected={isActive} onClick={() => setActiveValue(value)}>
      {children}
    </button>
  );
}
```

### 7. Документируйте ожидаемую структуру

```tsx
/**
 * Компонент Accordion — раскрывающиеся секции с поддержкой множественного раскрытия.
 *
 * @example
 * ```tsx
 * <Accordion type="single" defaultValue="item-1">
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>Заголовок секции</Accordion.Trigger>
 *     <Accordion.Content>Содержимое секции</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 * ```
 *
 * @param type - "single" (одна секция) или "multiple" (несколько секций)
 * @param defaultValue - значение по умолчанию открытой секции
 * @param collapsible - можно ли закрыть все секции (только для type="single")
 */
function Accordion({ type = 'single', defaultValue, collapsible = false, children }: AccordionProps) {
  // ...
}
```

## Реальный пример: полноценный Accordion

```tsx
import React, { createContext, useContext, useState, useId } from 'react';

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  type: AccordionType;
  openValues: Set<string>;
  toggleValue: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Компоненты Accordion должны использоваться внутри <Accordion>');
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('Компонент должен использоваться внутри <Accordion.Item>');
  return ctx;
}

// Корневой компонент
interface AccordionProps {
  type?: AccordionType;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Accordion({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  collapsible = false,
  children,
  className,
}: AccordionProps) {
  const getInitialSet = (val?: string | string[]): Set<string> => {
    if (!val) return new Set();
    return new Set(Array.isArray(val) ? val : [val]);
  };

  const [internalOpenValues, setInternalOpenValues] = useState<Set<string>>(
    () => getInitialSet(defaultValue)
  );

  const isControlled = controlledValue !== undefined;
  const openValues = isControlled ? getInitialSet(controlledValue) : internalOpenValues;

  const toggleValue = (value: string) => {
    let newValues: Set<string>;

    if (openValues.has(value)) {
      // Закрытие
      if (type === 'single' && !collapsible) return; // Нельзя закрыть единственную открытую
      newValues = new Set(openValues);
      newValues.delete(value);
    } else {
      // Открытие
      newValues = type === 'multiple' ? new Set(openValues) : new Set();
      newValues.add(value);
    }

    if (!isControlled) setInternalOpenValues(newValues);

    const newValueArray = Array.from(newValues);
    onValueChange?.(type === 'single' ? (newValueArray[0] ?? '') : newValueArray);
  };

  return (
    <AccordionContext.Provider value={{ type, openValues, toggleValue, collapsible }}>
      <div className={`accordion ${className ?? ''}`} data-type={type}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// Accordion.Item
interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function AccordionItem({ value, children, disabled = false, className }: AccordionItemProps) {
  const { openValues } = useAccordionContext();
  const baseId = useId();
  const isOpen = openValues.has(value);

  return (
    <AccordionItemContext.Provider value={{
      value,
      isOpen,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
    }}>
      <div
        className={`accordion__item ${isOpen ? 'accordion__item--open' : ''} ${disabled ? 'accordion__item--disabled' : ''} ${className ?? ''}`}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion.Trigger
interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { toggleValue } = useAccordionContext();
  const { value, isOpen, triggerId, contentId } = useAccordionItemContext();

  return (
    <h3 className="accordion__heading">
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`accordion__trigger ${className ?? ''}`}
        onClick={() => toggleValue(value)}
      >
        <span>{children}</span>
        <svg
          className={`accordion__icon ${isOpen ? 'accordion__icon--rotated' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </h3>
  );
}

// Accordion.Content
interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const { isOpen, triggerId, contentId } = useAccordionItemContext();

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen}
      className={`accordion__content ${isOpen ? 'accordion__content--open' : ''} ${className ?? ''}`}
    >
      <div className="accordion__content-inner">{children}</div>
    </div>
  );
}

// Прикрепляем подкомпоненты
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// Полное использование
function FAQSection() {
  return (
    <Accordion type="single" collapsible defaultValue="q1">
      <Accordion.Item value="q1">
        <Accordion.Trigger>Что такое React?</Accordion.Trigger>
        <Accordion.Content>
          React — это библиотека JavaScript для создания пользовательских интерфейсов,
          разработанная и поддерживаемая Meta.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="q2">
        <Accordion.Trigger>Что такое Compound Components?</Accordion.Trigger>
        <Accordion.Content>
          Compound Components — это паттерн проектирования, при котором несколько
          компонентов работают вместе через разделяемый контекст.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="q3">
        <Accordion.Trigger>Когда использовать этот паттерн?</Accordion.Trigger>
        <Accordion.Content>
          Используйте Compound Components для сложных UI-компонентов, которым нужен
          гибкий и декларативный API: вкладки, аккордеоны, выпадающие меню, диалоги.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

export { Accordion };
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
```

## Заключение

Паттерн Compound Components — мощный инструмент для создания гибких и расширяемых UI-компонентов в React. Он позволяет:

- **Разделять ответственность** между подкомпонентами
- **Создавать декларативный API**, который легко читать и использовать
- **Давать пользователям гибкость** в управлении структурой и содержимым
- **Скрывать сложность** управления состоянием внутри родительского компонента

Используйте Context API вместо `React.Children.cloneElement` для современных проектов — это даёт больше гибкости и лучшую поддержку TypeScript.

Паттерн идеально подходит для компонентов вроде `Tabs`, `Accordion`, `Select`, `Menu`, `Dialog` и других сложных UI-элементов, где нужна максимальная гибкость при сохранении инкапсуляции логики.
