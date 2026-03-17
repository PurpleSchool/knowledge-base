---
metaTitle: Комментирование кода в React — когда и как писать комментарии
metaDescription: Руководство по комментированию React-кода: когда комментарии нужны, когда они вредят, JSDoc для компонентов и хуков, встроенные комментарии в JSX
author: Олег Марков
title: Комментирование кода в React — когда и как писать комментарии
preview: Хорошие комментарии объясняют «почему», а не «что». Разберитесь, как комментировать React-компоненты, хуки и JSX так, чтобы ваш код понимала вся команда — и вы сами через полгода
---

## Введение

Комментирование кода — тема, которая делит разработчиков на два лагеря: «код должен говорить сам за себя» и «комментарии необходимы». Истина, как всегда, посередине. В React-разработке есть ситуации, когда комментарий критически важен, и ситуации, когда он только засоряет код.

В этой статье вы узнаете, как принимать решение о том, нужен ли комментарий, как правильно писать JSDoc для компонентов и хуков, и как добавлять пояснения в JSX без нарушения синтаксиса.

## Главное правило: «почему», а не «что»

Хороший комментарий объясняет **намерение** (почему код написан именно так), а не **механику** (что код делает — это должно быть понятно из самого кода).

```tsx
// ❌ Плохой комментарий — объясняет «что», видно из кода
// Увеличиваем счётчик на 1
setCount(count + 1);

// Устанавливаем isOpen в true
setIsOpen(true);

// ✅ Хороший комментарий — объясняет «почему»
// Используем функциональное обновление, чтобы избежать замыкания на устаревшее значение
setCount(prev => prev + 1);

// Откладываем закрытие на один тик, чтобы клик на trigger не открыл модал заново
setTimeout(() => setIsOpen(false), 0);
```

## Когда комментарии необходимы

### 1. Нестандартные решения и обходные пути (workarounds)

Если вы вынуждены написать нелогичный на первый взгляд код из-за ограничений библиотеки, браузера или бизнес-требований — объясните это:

```tsx
function InfiniteScrollList({ items }: { items: Item[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    // Используем useLayoutEffect вместо useEffect, так как нам нужно
    // синхронно сбросить скролл ДО того, как браузер нарисует обновление.
    // useEffect вызвал бы видимый «прыжок» списка.
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [items.length]);

  return <ul ref={listRef}>{items.map(renderItem)}</ul>;
}
```

### 2. Неочевидные алгоритмы и математика

```tsx
function calculateReadingTime(text: string): number {
  // Средняя скорость чтения: 200-250 слов в минуту.
  // Используем 200 для большинства нетехнических текстов,
  // что даёт небольшой запас — лучше чуть переоценить время.
  const WORDS_PER_MINUTE = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}
```

### 3. Бизнес-правила и требования

```tsx
function applyDiscount(price: number, userTier: UserTier): number {
  // Бизнес-правило: скидки применяются только к базовой цене,
  // без учёта НДС. Это соответствует договорённости с бухгалтерией
  // (задача TASK-1234). Изменение требует согласования с командой.
  const discountPercent = DISCOUNT_MAP[userTier] ?? 0;
  return price * (1 - discountPercent / 100);
}
```

### 4. Известные ограничения и технический долг

```tsx
function UserList() {
  // TODO: Заменить на пагинацию или виртуализацию (react-window).
  // Сейчас загружаем все записи, так как на этапе MVP объём < 100 пользователей.
  // При росте > 500 записей появятся проблемы с производительностью.
  const { data: users } = useQuery(['users'], fetchAllUsers);

  return (
    <ul>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
    </ul>
  );
}
```

### 5. Объяснение зависимостей хуков

```tsx
function SearchComponent({ onResultsChange }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const results = performSearch(query);
    onResultsChange(results);
    // Намеренно не включаем onResultsChange в зависимости:
    // колбэк передаётся каждый рендер и вызвал бы бесконечный цикл.
    // Вызывающий код должен обернуть onResultsChange в useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
}
```

## Когда комментарии вредят

### 1. Когда код говорит сам за себя

```tsx
// ❌ Избыточный комментарий
// Функция компонента UserAvatar
function UserAvatar({ src, alt, size = 'medium' }: AvatarProps) {
  // Возвращаем изображение аватара
  return (
    // img элемент с классом avatar
    <img
      className={`avatar avatar--${size}`} // добавляем класс с размером
      src={src}
      alt={alt}
    />
  );
}

// ✅ Без комментариев — код понятен
function UserAvatar({ src, alt, size = 'medium' }: AvatarProps) {
  return <img className={`avatar avatar--${size}`} src={src} alt={alt} />;
}
```

### 2. Комментарии, которые устаревают и вводят в заблуждение

```tsx
// ❌ Устаревший комментарий — опаснее его отсутствия
// Загружаем пользователей из localStorage
function useUsers() {
  // Код изменили — теперь используется API, но комментарий не обновили
  return useQuery(['users'], () => api.get('/users'));
}

// ✅ Актуальный комментарий — или его отсутствие
function useUsers() {
  return useQuery(['users'], () => api.get('/users'));
}
```

### 3. Закомментированный код

Никогда не оставляйте закомментированный код в коммитах — используйте Git для хранения истории:

```tsx
// ❌ Закомментированный код засоряет файл
function ProductCard({ product }: ProductCardProps) {
  // const oldPrice = product.price * 1.2;
  // const discountBadge = <Badge>-20%</Badge>;

  return (
    <div className="product-card">
      {/* <img src={product.oldImageUrl} /> */}
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      {/* TODO: вернуть скидки позже */}
      {/* <span className="old-price">{oldPrice}</span> */}
      <span className="price">{product.price}</span>
    </div>
  );
}
```

## Комментарии в JSX

Синтаксис комментариев в JSX отличается от обычного JavaScript:

```tsx
function Component() {
  return (
    <div>
      {/* Это правильный комментарий в JSX */}
      <Header />

      {/*
        Многострочный комментарий в JSX.
        Объясняем сложную секцию разметки.
      */}
      <main>
        <Section />
      </main>

      {/* Условный рендер: показываем только для авторизованных */}
      {isAuthenticated && <UserMenu />}
    </div>
  );
}
```

### Что НЕ работает в JSX

```tsx
function Component() {
  return (
    <div>
      // Это НЕ комментарий — это текстовый узел, который появится на странице

      <!-- Это тоже НЕ комментарий — это синтаксическая ошибка -->

      {/* ✅ А вот это работает */}
      <p>Контент</p>
    </div>
  );
}
```

### Комментарии для условного рендера

```tsx
function Dashboard() {
  return (
    <div className="dashboard">
      <Header />

      {/* Основной контент — показываем сразу */}
      <main>
        <Statistics />

        {/* Список задач загружается асинхронно — оборачиваем в Suspense */}
        <Suspense fallback={<TaskListSkeleton />}>
          <TaskList />
        </Suspense>

        {/* Виджет новостей скрыт до окончания бета-тестирования (PROJ-789) */}
        {featureFlags.newsWidget && <NewsWidget />}
      </main>
    </div>
  );
}
```

## JSDoc для компонентов

JSDoc позволяет добавлять типизированную документацию, которую подхватывают IDE (VSCode, WebStorm), генераторы документации и Storybook.

### Базовый JSDoc для компонента

```tsx
/**
 * Карточка пользователя с аватаром, именем и статусом онлайн.
 *
 * @example
 * <UserCard
 *   user={currentUser}
 *   showStatus
 *   onFollow={() => followUser(currentUser.id)}
 * />
 */
function UserCard({ user, showStatus = false, onFollow }: UserCardProps) {
  return (
    <div className="user-card">
      <Avatar src={user.avatarUrl} alt={user.name} />
      <span className="user-card__name">{user.name}</span>
      {showStatus && <StatusIndicator isOnline={user.isOnline} />}
      <button onClick={onFollow}>Подписаться</button>
    </div>
  );
}
```

### JSDoc для пропсов через TypeScript-интерфейс

```tsx
interface ButtonProps {
  /** Текст кнопки */
  label: string;

  /**
   * Визуальный стиль кнопки.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  /**
   * Размер кнопки.
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /** Блокирует взаимодействие с кнопкой */
  isDisabled?: boolean;

  /**
   * Показывает индикатор загрузки и блокирует кнопку.
   * Используйте при асинхронных операциях.
   */
  isLoading?: boolean;

  /** Иконка, отображаемая слева от текста */
  icon?: React.ReactNode;

  /** Вызывается при клике на кнопку */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Основная кнопка интерфейса. Поддерживает 4 варианта стиля,
 * 3 размера и состояния загрузки/блокировки.
 */
function Button({
  label,
  variant = 'primary',
  size = 'medium',
  isDisabled = false,
  isLoading = false,
  icon,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={isDisabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? <Spinner /> : icon}
      {label}
    </button>
  );
}
```

### JSDoc для кастомных хуков

```tsx
/**
 * Хук для работы с localStorage с поддержкой сериализации JSON и типизации.
 *
 * @template T - Тип хранимого значения
 * @param key - Ключ в localStorage
 * @param initialValue - Значение по умолчанию, если ключ не найден
 * @returns Кортеж [значение, функция установки]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  return [storedValue, setValue];
}
```

## Специальные теги комментариев

### TODO, FIXME, HACK, NOTE

Используйте стандартизированные теги для маркировки требующих внимания мест:

```tsx
// TODO: Добавить пагинацию после реализации серверной части (TASK-456)
// FIXME: Утечка памяти — не отписываемся от WebSocket при размонтировании
// HACK: Временное решение для баги Safari с position:sticky (iOS 15)
// NOTE: Этот компонент не поддерживает SSR из-за использования window.matchMedia

function PriceDisplay({ price, currency }: PriceProps) {
  // FIXME: Не интернационализировано — использовать Intl.NumberFormat
  return <span>{currency}{price}</span>;
}
```

### @ts-ignore и @ts-expect-error с объяснением

Никогда не используйте `@ts-ignore` без объяснения:

```tsx
// ❌ Без объяснения — никто не знает, почему это здесь
// @ts-ignore
const result = legacyModule.process(data);

// ✅ С объяснением — понятно, когда можно убрать
// @ts-ignore — legacyModule не имеет TypeScript-типов.
// Можно убрать после PR #234 (добавление @types/legacy-module).
const result = legacyModule.process(data);

// ✅ @ts-expect-error — более строгий вариант: падает, если ошибки нет
// @ts-expect-error — тест преднамеренно передаёт невалидный тип
expect(() => validateAge('не число')).toThrow();
```

## Автоматические инструменты для комментирования

### ESLint-правила для комментариев

```json
// .eslintrc.json
{
  "rules": {
    // Требовать описание при отключении ESLint-правила
    "eslint-comments/require-description": "error",

    // Запретить отключение всех правил без указания конкретного
    "eslint-comments/no-unlimited-disable": "error",

    // Предупреждать о TODO-комментариях
    "no-warning-comments": ["warn", {
      "terms": ["TODO", "FIXME", "HACK"],
      "location": "start"
    }]
  }
}
```

### Prettier не трогает JSDoc

Prettier форматирует код, но оставляет содержимое JSDoc-комментариев нетронутым. Это важно: ваши примеры в `@example` должны быть корректным кодом, потому что некоторые тулзы их парсят.

## Итоговые принципы

1. **Объясняй «почему», не «что»** — механика должна быть видна из кода
2. **Комментируй нестандартные решения** — workarounds, ограничения, бизнес-правила
3. **Обновляй комментарии вместе с кодом** — устаревший комментарий хуже его отсутствия
4. **Удаляй закомментированный код** — для истории есть Git
5. **Используй JSDoc для публичного API** — компоненты, хуки, утилиты
6. **Стандартизируй TODO/FIXME** — с номером задачи и именем разработчика
7. **Помни синтаксис JSX** — только `{/* комментарий */}` внутри разметки

## Связанные темы

- [Документирование компонентов](../component-documentation/index.md) — Storybook и автодокументация
- [Именование компонентов](../naming-conventions/index.md) — самодокументирующиеся имена
- [Рефакторинг React-кода](../refactoring/index.md) — улучшение читаемости кода
