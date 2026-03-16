---
metaTitle: "Комментирование кода в React — когда и как писать комментарии"
metaDescription: "Руководство по комментированию React-кода: виды комментариев, когда комментировать, а когда нет, JSDoc для компонентов и хуков, типичные антипаттерны."
author: Олег Марков
title: "Комментирование кода в React: когда и как писать комментарии"
preview: "Разбираем принципы эффективного комментирования в React-проектах. Узнайте, когда комментарии помогают, а когда мешают, и как документировать компоненты через JSDoc."
---

# Комментирование кода в React

Комментарии — двоякий инструмент. Хорошо написанный комментарий объясняет неочевидное решение и экономит часы расследования. Плохой комментарий устаревает, вводит в заблуждение и захламляет код. В этой статье разберём, как найти правильный баланс в React-проектах.

## Основной принцип: код должен говорить сам за себя

Прежде чем писать комментарий, задайте себе вопрос: *можно ли переписать код так, чтобы он стал понятным без комментария?*

```tsx
// ❌ Комментарий объясняет очевидное
// Увеличиваем счётчик на 1
setCount(count + 1);

// ❌ Комментарий маскирует плохое именование
// Получаем пользователя
const x = fetchData(id);

// ✅ Читаемый код без комментария
const user = fetchUser(userId);
setCount(count + 1);
```

Хороший комментарий объясняет **почему**, а не **что**. Что делает код — видно из самого кода. Почему именно так — часто не очевидно.

## Когда комментарии нужны

### 1. Нетривиальная бизнес-логика

Когда логика отражает требование бизнеса, которое не выводится из кода:

```tsx
function calculateDiscount(user: User, cart: Cart): number {
  // Корпоративные клиенты получают дополнительную скидку 5%
  // только если сумма заказа превышает 10000 и они зарегистрированы
  // более 6 месяцев назад (договор с отделом продаж от 2023-01-15)
  if (user.type === 'corporate' && cart.total > 10000 && user.ageInMonths > 6) {
    return BASE_DISCOUNT + CORPORATE_EXTRA_DISCOUNT;
  }
  return BASE_DISCOUNT;
}
```

### 2. Обходные решения и известные ограничения

Когда приходится делать что-то нестандартное из-за бага в библиотеке или технического ограничения:

```tsx
function DatePicker({ value, onChange }: DatePickerProps) {
  // WORKAROUND: react-datepicker@4.x не поддерживает controlled mode
  // с форматом ISO 8601. Конвертируем вручную до выхода версии 5.x.
  // Трекер: https://github.com/Hacker0x01/react-datepicker/issues/1234
  const dateValue = value ? new Date(value) : null;
  const handleChange = (date: Date | null) => {
    onChange(date ? date.toISOString() : null);
  };

  return <ReactDatePicker selected={dateValue} onChange={handleChange} />;
}
```

### 3. Неочевидные оптимизации производительности

```tsx
const MemoizedList = React.memo(function ItemList({ items, onSelect }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
// Мемоизируем, т.к. список рендерится внутри виртуализированного контейнера
// и пересоздаётся при каждом скролле — без memo видимый лаг на 500+ элементах
});
```

### 4. Регуляторные и юридические требования

```tsx
function collectAnalytics(event: AnalyticsEvent) {
  // GDPR: отправляем данные только при наличии явного согласия пользователя.
  // Согласие хранится в localStorage под ключом 'analytics_consent'.
  // Не изменять без согласования с юридическим отделом.
  if (!hasUserConsent()) {
    return;
  }
  sendToAnalytics(event);
}
```

### 5. TODO и FIXME

Временные пометки о незавершённой работе или известных проблемах. Всегда добавляйте имя или тикет:

```tsx
// TODO(username): заменить на серверный поиск при переходе на React Server Components
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(query.toLowerCase())
);

// FIXME: компонент падает при пустом массиве items — см. задачу PROJ-456
function ItemGrid({ items }: { items: Item[] }) {
  return <div>{items[0].name}</div>;
}
```

## Когда комментарии не нужны

### Очевидный код

```tsx
// ❌ Объясняет то, что и так понятно
// Если пользователь не авторизован — возвращаем null
if (!user) return null;

// ❌ Пересказывает код
// Устанавливаем isLoading в true
setIsLoading(true);

// ❌ Заголовки разделов без смысла
// ===== Render =====
return <div>...</div>;
```

### Закомментированный код

Не оставляйте закомментированный код в репозитории. Используйте систему контроля версий — если код когда-нибудь понадобится, его можно найти в истории git:

```tsx
// ❌ Мусор в репозитории
function UserCard({ user }: UserCardProps) {
  // const [expanded, setExpanded] = useState(false);
  // const handleExpand = () => setExpanded(!expanded);

  return (
    <div>
      {/* <button onClick={handleExpand}>Развернуть</button> */}
      <span>{user.name}</span>
    </div>
  );
}
```

## JSDoc для компонентов и хуков

JSDoc-комментарии особенно полезны для переиспользуемых компонентов и хуков — они отображаются в подсказках IDE.

### Документирование компонента

```tsx
/**
 * Карточка пользователя с аватаром и основной информацией.
 *
 * @example
 * ```tsx
 * <UserCard
 *   user={currentUser}
 *   onEdit={(id) => router.push(`/users/${id}/edit`)}
 * />
 * ```
 */
interface UserCardProps {
  /** Объект пользователя из API */
  user: User;
  /** Вызывается при клике на кнопку редактирования */
  onEdit?: (userId: string) => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={cn('user-card', className)}>
      <Avatar src={user.avatar} alt={user.name} />
      <span>{user.name}</span>
      {onEdit && (
        <button onClick={() => onEdit(user.id)}>Редактировать</button>
      )}
    </div>
  );
}
```

### Документирование хука

```tsx
/**
 * Хук для управления пагинацией.
 *
 * @param totalItems - Общее количество элементов
 * @param itemsPerPage - Количество элементов на странице (по умолчанию 10)
 * @returns Текущая страница, общее количество страниц и функции навигации
 *
 * @example
 * ```tsx
 * const { page, totalPages, nextPage, prevPage } = usePagination(100, 20);
 * ```
 */
function usePagination(totalItems: number, itemsPerPage = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const nextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setPage(p => Math.max(p - 1, 1));

  return { page, totalPages, nextPage, prevPage, setPage };
}
```

## Комментарии в JSX

В JSX используется синтаксис `{/* */}`:

```tsx
function ProductPage({ product }: ProductPageProps) {
  return (
    <div className="product-page">
      {/* Секция с изображениями — отдельный компонент из-за сложной логики слайдера */}
      <ProductGallery images={product.images} />

      <div className="product-info">
        <h1>{product.name}</h1>

        {/* Показываем скидку только если она больше 5% — меньше не имеет смысла */}
        {product.discount > 5 && (
          <DiscountBadge value={product.discount} />
        )}

        <AddToCartButton productId={product.id} />
      </div>
    </div>
  );
}
```

## Комментарии для секций в больших компонентах

Если компонент всё ещё большой (хотя стоит его разбить), можно использовать секционные комментарии:

```tsx
function CheckoutPage() {
  // --- Состояние ---
  const [step, setStep] = useState<'cart' | 'address' | 'payment'>('cart');
  const [order, setOrder] = useState<Order | null>(null);

  // --- Обработчики ---
  const handleNextStep = () => { ... };
  const handleSubmit = async () => { ... };

  // --- Рендер ---
  return (
    <div>...</div>
  );
}
```

Но лучший вариант — разбить компонент на меньшие части.

## Антипаттерны комментирования

### Дублирование документации типов

```tsx
// ❌ TypeScript уже говорит это
// user: объект типа User
// onSubmit: функция, принимающая User и возвращающая void
interface FormProps {
  user: User;
  onSubmit: (user: User) => void;
}

// ✅ Комментарий добавляет информацию, которой нет в типах
interface FormProps {
  user: User;
  /** Вызывается после успешной валидации и до отправки на сервер */
  onSubmit: (user: User) => void;
}
```

### Комментарии с неверной информацией

Устаревший комментарий хуже его отсутствия:

```tsx
// ❌ Комментарий противоречит коду
// Возвращает список активных пользователей
function getUsers() {
  // Код на самом деле возвращает ВСЕХ пользователей
  return prisma.user.findMany();
}
```

Если меняете логику — обновляйте комментарии.

## Итоги

Комментируйте **почему**, а не **что**:
- Бизнес-требования, не очевидные из кода
- Обходные решения с ссылкой на проблему
- Оптимизации с объяснением, что они оптимизируют
- Юридические или регуляторные ограничения

Не комментируйте:
- Очевидный код
- Закомментированный код (удаляйте его)
- То, что выражено типами TypeScript

Используйте JSDoc для переиспользуемых компонентов и хуков — это улучшит опыт работы с ними в IDE.
