---
metaTitle: Типизация событий в React с TypeScript — MouseEvent, ChangeEvent, FormEvent
metaDescription: Полное руководство по типизации обработчиков событий в React с TypeScript. MouseEvent, ChangeEvent, FormEvent, KeyboardEvent, DragEvent и кастомные события
author: Олег Марков
title: Типизация событий в React с TypeScript
preview: Разберите все типы событий React с TypeScript — от простых обработчиков клика до сложных форм и drag-and-drop. Практические примеры и лучшие практики
---

## Введение

Обработка событий — неотъемлемая часть любого React-приложения. TypeScript обеспечивает полную типобезопасность при работе с событиями: вы получаете автодополнение для свойств event-объекта и ошибки компиляции при неправильном использовании. В этой статье мы разберём все типы событий React и как их правильно типизировать.

## Как React типизирует события

React использует синтетические события (SyntheticEvent), которые оборачивают нативные браузерные события. В TypeScript они представлены параметризованными типами:

```tsx
// Общая форма: React.EventType<HTMLElementType>
// Например:
React.MouseEvent<HTMLButtonElement>
React.ChangeEvent<HTMLInputElement>
React.FormEvent<HTMLFormElement>
```

Все типы событий можно импортировать напрямую из React:

```tsx
import {
  MouseEvent,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  FocusEvent,
  DragEvent,
  TouchEvent,
  WheelEvent,
  ClipboardEvent,
  AnimationEvent,
  TransitionEvent,
  PointerEvent,
  SyntheticEvent,
} from 'react';
```

## MouseEvent — события мыши

`MouseEvent` используется для обработки кликов, наведений и других действий мышью:

```tsx
function InteractiveCard() {
  // Клик по кнопке
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log('Координаты клика:', e.clientX, e.clientY);
    console.log('Была нажата Ctrl:', e.ctrlKey);
    console.log('Кнопка мыши:', e.button); // 0=левая, 1=средняя, 2=правая
    e.stopPropagation(); // Остановить всплытие события
  };
  
  // Клик по div
  const handleDivClick = (e: MouseEvent<HTMLDivElement>) => {
    // e.currentTarget — элемент с обработчиком
    // e.target — элемент, на котором произошло событие
    const target = e.target as HTMLElement;
    console.log('Клик по:', target.tagName);
  };
  
  // Наведение
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#f0f0f0';
  };
  
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '';
  };
  
  // Контекстное меню
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Отключаем стандартное контекстное меню
    console.log('Правый клик в позиции:', e.clientX, e.clientY);
  };
  
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onClick={handleDivClick}
    >
      <button onClick={handleClick}>Нажмите меня</button>
    </div>
  );
}
```

### Делегирование событий с MouseEvent

```tsx
interface MenuItem {
  id: string;
  label: string;
  action: () => void;
}

function Menu({ items }: { items: MenuItem[] }) {
  // Делегирование — один обработчик для всего меню
  const handleMenuClick = (e: MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    const listItem = target.closest('[data-item-id]') as HTMLElement | null;
    
    if (listItem) {
      const itemId = listItem.dataset.itemId;
      const item = items.find(i => i.id === itemId);
      item?.action();
    }
  };
  
  return (
    <ul onClick={handleMenuClick}>
      {items.map(item => (
        <li key={item.id} data-item-id={item.id}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## ChangeEvent — события изменения

`ChangeEvent` используется для полей форм. Тип параметра меняется в зависимости от элемента:

```tsx
function RegistrationForm() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'admin' | 'user' | 'editor'>('user');
  const [bio, setBio] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  
  // HTMLInputElement
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // e.target.value — строка
    // e.target.checked — boolean (для checkbox)
    // e.target.files — FileList (для file input)
  };
  
  // HTMLSelectElement
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as 'admin' | 'user' | 'editor');
    // e.target.selectedIndex — индекс выбранного элемента
    // e.target.options — HTMLOptionsCollection
  };
  
  // HTMLTextAreaElement
  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  };
  
  // Checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAgreeToTerms(e.target.checked); // Используем checked, а не value
  };
  
  return (
    <form>
      <input value={name} onChange={handleNameChange} placeholder="Имя" />
      <select value={role} onChange={handleRoleChange}>
        <option value="user">Пользователь</option>
        <option value="editor">Редактор</option>
        <option value="admin">Администратор</option>
      </select>
      <textarea value={bio} onChange={handleBioChange} placeholder="О себе" />
      <label>
        <input type="checkbox" checked={agreeToTerms} onChange={handleCheckboxChange} />
        Согласен с условиями
      </label>
    </form>
  );
}
```

### Загрузка файлов

```tsx
function FileUploader() {
  const [files, setFiles] = React.useState<File[]>([]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      // FileList не является массивом, преобразуем
      setFiles(Array.from(fileList));
    }
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Выберите изображение');
        return;
      }
      
      // Читаем файл
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        console.log('Data URL:', result.substring(0, 50));
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <ul>
        {files.map((file, i) => (
          <li key={i}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
        ))}
      </ul>
    </div>
  );
}
```

## FormEvent — события форм

`FormEvent` используется для обработки отправки и сброса форм:

```tsx
interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginForm({ onLogin }: { onLogin: (data: LoginData) => Promise<void> }) {
  const [formData, setFormData] = React.useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<LoginData>>({});
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LoginData, string>> = {};
    
    if (!formData.email.includes('@')) {
      newErrors.email = 'Введите корректный email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    }
    
    setErrors(newErrors as Partial<LoginData>);
    return Object.keys(newErrors).length === 0;
  };
  
  // FormEvent<HTMLFormElement> — событие формы
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Предотвращаем стандартную отправку формы
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onLogin(formData);
    } catch (error) {
      console.error('Ошибка входа:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = (e: FormEvent<HTMLFormElement>) => {
    // e.currentTarget — элемент формы
    setFormData({ email: '', password: '', rememberMe: false });
    setErrors({});
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} onReset={handleReset}>
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span>{String(errors.email)}</span>}
      
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Пароль"
      />
      {errors.password && <span>{String(errors.password)}</span>}
      
      <label>
        <input
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange}
        />
        Запомнить меня
      </label>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
      <button type="reset">Очистить</button>
    </form>
  );
}
```

## KeyboardEvent — события клавиатуры

```tsx
function SearchBox() {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // e.key — строка с названием клавиши
    // e.code — физический код клавиши (не зависит от раскладки)
    // e.ctrlKey, e.altKey, e.shiftKey, e.metaKey — модификаторы
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
        
      case 'Enter':
        if (selectedIndex >= 0) {
          setQuery(suggestions[selectedIndex]);
          setSuggestions([]);
          setSelectedIndex(-1);
        }
        break;
        
      case 'Escape':
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
    
    // Горячие клавиши
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      // Открываем поиск
    }
  };
  
  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск... (Ctrl+K)"
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, i) => (
            <li
              key={suggestion}
              className={i === selectedIndex ? 'selected' : ''}
              onClick={() => setQuery(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## FocusEvent — события фокуса

```tsx
function SmartInput() {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // e.relatedTarget — элемент, который потерял фокус
    console.log('Фокус пришёл от:', e.relatedTarget);
  };
  
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasInteracted(true);
    // e.relatedTarget — элемент, который получит фокус
    console.log('Фокус уйдёт к:', e.relatedTarget);
  };
  
  return (
    <div className={`input-group ${isFocused ? 'input-group--focused' : ''}`}>
      <input
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Кликните для фокуса"
      />
      {hasInteracted && !isFocused && <span className="hint">Поле заполнено</span>}
    </div>
  );
}
```

## DragEvent — drag-and-drop

```tsx
function DragDropZone() {
  const [isDragging, setIsDragging] = React.useState(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[]>([]);
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Проверяем, что курсор вышел из зоны, а не перешёл на дочерний элемент
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setDroppedFiles(prev => [...prev, ...files]);
  };
  
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`drop-zone ${isDragging ? 'drop-zone--active' : ''}`}
    >
      <p>Перетащите файлы сюда</p>
      {droppedFiles.map((file, i) => (
        <div key={i}>{file.name}</div>
      ))}
    </div>
  );
}
```

## Типизация кастомных обработчиков событий

```tsx
// Тип для обработчика события — принимает параметры и ничего не возвращает
type EventHandler<T = void> = T extends void
  ? () => void
  : (value: T) => void;

// Паттерн onChange для кастомных компонентов
interface CustomSelectProps<T> {
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  onClear?: () => void;
}

function CustomSelect<T extends string | number>({
  value,
  options,
  onChange,
  onClear,
}: CustomSelectProps<T>) {
  return (
    <div className="custom-select">
      {options.map(option => (
        <button
          key={String(option.value)}
          className={option.value === value ? 'selected' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
      {value !== null && onClear && (
        <button onClick={onClear}>Очистить</button>
      )}
    </div>
  );
}
```

## Inline обработчики событий

```tsx
function ProductCard({ product }: { product: { id: number; name: string } }) {
  // Тип события выводится автоматически в inline-обработчиках
  return (
    <div>
      {/* TypeScript знает тип e автоматически */}
      <button onClick={(e) => {
        e.stopPropagation();
        console.log('Клик:', product.id);
      }}>
        {product.name}
      </button>
      
      {/* Для сложной логики — выносим в отдельную функцию */}
      <input onChange={(e) => {
        // e: ChangeEvent<HTMLInputElement> выводится автоматически
        console.log(e.target.value);
      }} />
    </div>
  );
}
```

## Лучшие практики

**1. Используйте конкретные типы элементов:**

```tsx
// Плохо — слишком общий тип
const handleClick = (e: MouseEvent<HTMLElement>) => { ... };

// Хорошо — точный тип
const handleClick = (e: MouseEvent<HTMLButtonElement>) => { ... };
```

**2. Разделяйте обработчики для разных элементов:**

```tsx
// Разные типы для input и select
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value);
const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => setSelectValue(e.target.value);
```

**3. Пишите вспомогательные хелперы для распространённых паттернов:**

```tsx
// Хелпер для создания onChange для конкретного поля
const createChangeHandler = (field: keyof FormData) =>
  (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
```

**4. Для событий без конкретного типа используйте SyntheticEvent:**

```tsx
const handleEvent = (e: SyntheticEvent) => {
  e.preventDefault();
};
```

## Заключение

Типизация событий в React с TypeScript даёт полную безопасность при работе с пользовательским вводом. Ключевые моменты:

- Импортируйте типы событий из `react` (`MouseEvent`, `ChangeEvent` и др.)
- Параметр типа указывает на тип DOM-элемента (`HTMLInputElement`, `HTMLButtonElement`)
- `e.target` — элемент, вызвавший событие; `e.currentTarget` — элемент с обработчиком
- Для checkbox используйте `e.target.checked`, для file input — `e.target.files`
- Всегда вызывайте `e.preventDefault()` там, где это необходимо
