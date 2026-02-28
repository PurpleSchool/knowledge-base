---
metaTitle: "useDeferredValue в React — отложенное обновление состояния"
metaDescription: "Разбираемся с хуком useDeferredValue в React: как откладывать обновление тяжёлых вычислений, улучшать отзывчивость интерфейса и сочетать с Suspense. Практические примеры на TypeScript."
author: Олег Марков
title: useDeferredValue — отложенное обновление состояния
preview: Хук useDeferredValue позволяет откладывать обновление «тяжёлых» частей интерфейса, сохраняя быстрый отклик на ввод пользователя. В этой статье разберём синтаксис, реальные сценарии и отличия от useTransition.
---

## Введение

Современные React-приложения нередко сталкиваются с проблемой: пользователь вводит текст в поле поиска, а интерфейс «подвисает», потому что каждое нажатие клавиши запускает тяжёлые вычисления или рендер большого списка. Результат — задержка и ощущение «медленного» приложения.

React 18 предложил элегантное решение — хук `useDeferredValue`. Он позволяет сказать React: «Обнови эту часть интерфейса, но не торопись — сначала обработай более важные обновления».

Вы можете узнать о React хуках подробнее в [нашем курсе по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useDeferredValue).

## Что такое useDeferredValue и зачем он нужен

`useDeferredValue` — это хук React, который принимает значение и возвращает его «отложенную» копию. Пока происходят более приоритетные обновления (например, ввод пользователя), React может временно оставить «старое» значение в отложенной копии и обновить её позже, когда браузер освободится.

### Проблема без useDeferredValue

Представьте типичный сценарий: поле поиска, которое фильтрует список из тысяч элементов.

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');

  // При каждом изменении query перерендеривается огромный список
  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <HeavyList filter={query} /> {/* Тяжёлый компонент */}
    </>
  );
}
```

Проблема здесь: каждое нажатие клавиши заставляет React синхронно рендерить `HeavyList`. Если рендер занимает 100–200 мс, ввод становится «липким» и неотзывчивым.

### Решение с useDeferredValue

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query); // Откладываем обновление

  return (
    <>
      <input
        value={query} // Поле обновляется мгновенно
        onChange={e => setQuery(e.target.value)}
      />
      <HeavyList filter={deferredQuery} /> {/* Список обновляется отложенно */}
    </>
  );
}
```

Теперь поле ввода реагирует мгновенно, а `HeavyList` обновляется в фоне, когда браузер не занят обработкой ввода.

## Синтаксис useDeferredValue

```tsx
const deferredValue = useDeferredValue(value, initialValue?)
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `value` | `any` | Значение, которое нужно отложить (примитив или объект) |
| `initialValue` | `any` (необязательно) | Начальное значение при первом рендере (React 19+) |

**Возвращает:** отложенную версию переданного значения.

### Важные особенности

- `useDeferredValue` принимает только одно значение
- Отложенное значение всегда равно `value`, но может обновляться позже
- Хук использует механизм конкурентного рендеринга React 18+
- Если нет более приоритетных задач, обновление происходит немедленно

## Базовый пример использования

Рассмотрим полный пример с поиском по списку:

```tsx
import { useState, useDeferredValue, memo } from 'react';

// Список товаров (имитация большого набора данных)
const products = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Товар ${i + 1}`,
  category: i % 5 === 0 ? 'Электроника' : i % 3 === 0 ? 'Одежда' : 'Прочее',
}));

// memo важен: без него отложенное значение не даст пользы
const ProductList = memo(function ProductList({ filter }: { filter: string }) {
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <ul>
      {filtered.map(p => (
        <li key={p.id}>{p.name} — {p.category}</li>
      ))}
    </ul>
  );
});

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // Показываем индикатор "устаревших" данных
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        type="text"
        placeholder="Поиск товаров..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {/* Визуально показываем, что данные обновляются */}
      <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <ProductList filter={deferredQuery} />
      </div>
    </div>
  );
}
```

Обратите внимание: `memo` здесь обязателен. Без него React всё равно будет перерендеривать `ProductList` при каждом изменении родителя.

## Как работает useDeferredValue под капотом

Понимание внутренней механики поможет правильно применять хук.

### Конкурентный рендеринг

`useDeferredValue` опирается на механизм конкурентного рендеринга (Concurrent Mode) React 18. Вот что происходит:

1. Пользователь вводит символ — `query` обновляется немедленно
2. React запускает рендер с новым `query`, но старым `deferredQuery`
3. Поле ввода обновляется мгновенно (высокий приоритет)
4. React планирует фоновый рендер для обновления `deferredQuery`
5. Если пользователь вводит ещё символ — фоновый рендер прерывается
6. После паузы в вводе — фоновый рендер завершается, `deferredQuery` обновляется

```
Пользователь: [р] → [ре] → [реа] → [реак]
query:         р     ре     реа     реак   ← обновляется сразу
deferredQuery: ''    ''     ''      реак   ← обновился только когда ввод остановился
```

### Сравнение через Object.is

React определяет, изменилось ли значение, через `Object.is`. Для объектов это означает сравнение по ссылке:

```tsx
// ❌ Создаём новый объект при каждом рендере — useDeferredValue не поможет
const deferredOptions = useDeferredValue({ filter: query, page: 1 });

// ✅ Передаём примитивное значение
const deferredQuery = useDeferredValue(query);

// ✅ Или мемоизируем объект
const options = useMemo(() => ({ filter: query, page: 1 }), [query]);
const deferredOptions = useDeferredValue(options);
```

## Отображение индикатора загрузки

Важный UX-паттерн — показывать пользователю, что интерфейс обновляется:

```tsx
import { useState, useDeferredValue } from 'react';

function SearchWithIndicator() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // true, когда дефферред-значение ещё не догнало актуальное
  const isUpdating = query !== deferredQuery;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Введите запрос..."
        />
        {isUpdating && (
          <span style={{ color: '#888', fontSize: 14 }}>
            Обновляем...
          </span>
        )}
      </div>

      <div style={{
        opacity: isUpdating ? 0.6 : 1,
        transition: 'opacity 0.15s'
      }}>
        <Results query={deferredQuery} />
      </div>
    </div>
  );
}
```

## Использование с Suspense

`useDeferredValue` отлично сочетается с `Suspense` для асинхронных данных:

```tsx
import { useState, useDeferredValue, Suspense } from 'react';

// Компонент с асинхронной загрузкой данных
function SearchResults({ query }: { query: string }) {
  // Предположим, что этот хук использует use() или suspend
  const results = useSearchResults(query);

  return (
    <ul>
      {results.map(r => <li key={r.id}>{r.title}</li>)}
    </ul>
  );
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {/* Suspense показывает fallback при первой загрузке */}
      {/* useDeferredValue предотвращает лишние fallback при повторных запросах */}
      <Suspense fallback={<div>Загружаем...</div>}>
        <div style={{ opacity: isStale ? 0.7 : 1 }}>
          <SearchResults query={deferredQuery} />
        </div>
      </Suspense>
    </div>
  );
}
```

Здесь `useDeferredValue` делает важное: при изменении `query` React не убирает старые результаты и не показывает `fallback` — он продолжает показывать предыдущие результаты с пониженной прозрачностью, пока не загрузятся новые.

## Типизация с TypeScript

`useDeferredValue` хорошо работает с TypeScript — тип возвращаемого значения выводится автоматически:

```tsx
import { useDeferredValue } from 'react';

// Примитивные типы
const query = 'react hooks';
const deferredQuery: string = useDeferredValue(query);

// Числа
const count: number = 42;
const deferredCount: number = useDeferredValue(count);

// Объекты (с мемоизацией)
interface FilterOptions {
  query: string;
  category: string;
  minPrice: number;
}

const options: FilterOptions = useMemo(() => ({
  query,
  category: selectedCategory,
  minPrice,
}), [query, selectedCategory, minPrice]);

const deferredOptions: FilterOptions = useDeferredValue(options);

// С начальным значением (React 19+)
const deferredQuery19 = useDeferredValue(query, '');
```

## Продвинутые паттерны

### Паттерн 1: Дебаунс через useDeferredValue

`useDeferredValue` не является полноценной заменой дебаунса, но может работать похожим образом:

```tsx
function useOptimisticInput(externalValue: string) {
  const [localValue, setLocalValue] = useState(externalValue);
  const deferredValue = useDeferredValue(localValue);

  // localValue обновляется сразу для UI
  // deferredValue обновляется после паузы для тяжёлых операций

  return { localValue, setLocalValue, deferredValue };
}

function SearchBox() {
  const { localValue, setLocalValue, deferredValue } = useOptimisticInput('');

  return (
    <>
      <input
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
      />
      <ExpensiveComponent value={deferredValue} />
    </>
  );
}
```

### Паттерн 2: Постепенная отрисовка больших списков

```tsx
import { useState, useDeferredValue, memo } from 'react';

interface Item {
  id: number;
  text: string;
  tags: string[];
}

const BigList = memo(function BigList({
  items,
  highlight
}: {
  items: Item[];
  highlight: string;
}) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{
          backgroundColor: item.text.includes(highlight) ? '#fff3cd' : 'transparent'
        }}>
          <strong>{item.text}</strong>
          <span>{item.tags.join(', ')}</span>
        </div>
      ))}
    </div>
  );
});

function Dashboard({ items }: { items: Item[] }) {
  const [highlight, setHighlight] = useState('');
  const deferredHighlight = useDeferredValue(highlight);

  return (
    <>
      <input
        value={highlight}
        onChange={e => setHighlight(e.target.value)}
        placeholder="Выделить текст..."
      />
      {/* Подсветка обновляется отложенно */}
      <BigList items={items} highlight={deferredHighlight} />
    </>
  );
}
```

### Паттерн 3: Комбинирование с виртуализацией

```tsx
import { useDeferredValue, memo } from 'react';
import { FixedSizeList } from 'react-window';

const VirtualRow = memo(({ index, style, data }) => (
  <div style={style}>{data[index].name}</div>
));

function VirtualSearchList({ items, query }) {
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => items.filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    ),
    [items, deferredQuery]
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={filtered.length}
      itemSize={50}
      itemData={filtered}
    >
      {VirtualRow}
    </FixedSizeList>
  );
}
```

## useDeferredValue vs useTransition: ключевые отличия

Оба хука решают похожие задачи, но подходят для разных ситуаций:

| Критерий | `useDeferredValue` | `useTransition` |
|----------|-------------------|-----------------|
| **Что откладывается** | Значение (результат) | Обновление состояния |
| **Контроль над кодом** | Не нужен доступ к сеттеру | Нужен доступ к сеттеру |
| **Сторонние библиотеки** | Работает с любыми пропами | Только с собственным состоянием |
| **isPending** | Нет (нужно сравнивать вручную) | Есть встроенный флаг |
| **Когда использовать** | Когда получаешь значение извне | Когда сам вызываешь setState |

### Когда использовать useDeferredValue

```tsx
// ✅ useDeferredValue — когда значение приходит извне (пропы, контекст)
function ChildComponent({ searchQuery }: { searchQuery: string }) {
  const deferredQuery = useDeferredValue(searchQuery);
  return <ExpensiveList filter={deferredQuery} />;
}

// ✅ useDeferredValue — когда нет доступа к setState
function ThirdPartyInput({ value }: { value: string }) {
  const deferred = useDeferredValue(value);
  return <HeavyRenderer value={deferred} />;
}
```

### Когда использовать useTransition

```tsx
// ✅ useTransition — когда сам управляешь состоянием
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Ввод обновляется немедленно
    // Но тяжёлый рендер можно было бы обернуть в startTransition
    startTransition(() => {
      setQuery(e.target.value);
    });
  }

  return (
    <>
      {isPending && <Spinner />} {/* Встроенный индикатор */}
      <input onChange={handleChange} />
      <ResultsList query={query} />
    </>
  );
}
```

## Ограничения и когда не стоит использовать

### useDeferredValue не подходит для сетевых запросов напрямую

```tsx
// ❌ Так не работает — useDeferredValue не задерживает сам запрос
function BadExample({ query }) {
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    // Этот запрос всё равно отправится при каждом изменении deferredQuery
    fetchData(deferredQuery).then(setResults);
  }, [deferredQuery]);
}

// ✅ Для сетевых запросов лучше использовать дебаунс
function GoodExample({ query }) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchData(debouncedQuery).then(setResults);
  }, [debouncedQuery]);
}
```

### Работает только в React 18+

```tsx
// ❌ В React 17 и ниже — useDeferredValue просто возвращает значение без оптимизаций
// Код не сломается, но не даст никакой пользы
```

### Не заменяет оптимизацию рендера

```tsx
// ❌ Без memo useDeferredValue не помогает
function NoMemoExample({ filter }) {
  const deferredFilter = useDeferredValue(filter);

  // Этот компонент рендерится при каждом изменении родителя
  // useDeferredValue не предотвратит лишние рендеры!
  return <ExpensiveList filter={deferredFilter} />;
}

// ✅ С memo — правильное использование
const ExpensiveListMemo = memo(ExpensiveList);

function WithMemoExample({ filter }) {
  const deferredFilter = useDeferredValue(filter);
  return <ExpensiveListMemo filter={deferredFilter} />;
}
```

## Практический пример: система фильтрации

Вот комплексный пример с несколькими фильтрами:

```tsx
import { useState, useDeferredValue, useMemo, memo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  rating: number;
}

interface Filters {
  query: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

// Тяжёлый компонент с memo
const FilteredProducts = memo(function FilteredProducts({
  products,
  filters,
}: {
  products: Product[];
  filters: Filters;
}) {
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(filters.query.toLowerCase());
      const matchesCategory = !filters.category || p.category === filters.category;
      const matchesPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      const matchesRating = p.rating >= filters.minRating;
      return matchesQuery && matchesCategory && matchesPrice && matchesRating;
    });
  }, [products, filters]);

  return (
    <div>
      <p>Найдено: {filtered.length} товаров</p>
      <div>
        {filtered.map(p => (
          <div key={p.id}>
            <h3>{p.name}</h3>
            <span>{p.price} ₽</span>
            <span>★ {p.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export function ProductCatalog({ products }: { products: Product[] }) {
  const [filters, setFilters] = useState<Filters>({
    query: '',
    category: '',
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
  });

  // Откладываем обновление фильтров для тяжёлого списка
  const deferredFilters = useDeferredValue(filters);
  const isFiltering = filters !== deferredFilters;

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category))],
    [products]
  );

  return (
    <div className="catalog">
      {/* Панель фильтров — обновляется мгновенно */}
      <aside>
        <input
          placeholder="Поиск..."
          value={filters.query}
          onChange={e => updateFilter('query', e.target.value)}
        />

        <select
          value={filters.category}
          onChange={e => updateFilter('category', e.target.value)}
        >
          <option value="">Все категории</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label>
          Минимальная цена: {filters.minPrice} ₽
          <input
            type="range"
            min={0} max={100000}
            value={filters.minPrice}
            onChange={e => updateFilter('minPrice', Number(e.target.value))}
          />
        </label>

        <label>
          Рейтинг от: {filters.minRating}
          <input
            type="range"
            min={0} max={5} step={0.5}
            value={filters.minRating}
            onChange={e => updateFilter('minRating', Number(e.target.value))}
          />
        </label>
      </aside>

      {/* Список товаров — обновляется отложенно */}
      <main style={{
        opacity: isFiltering ? 0.6 : 1,
        transition: 'opacity 0.2s',
        position: 'relative',
      }}>
        {isFiltering && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, color: '#666' }}>
            Обновляем...
          </div>
        )}
        <FilteredProducts products={products} filters={deferredFilters} />
      </main>
    </div>
  );
}
```

## Итоги

`useDeferredValue` — мощный инструмент для улучшения отзывчивости React-приложений. Вот ключевые моменты:

- **Отложенное обновление**: хук принимает значение и возвращает его «медленную» копию, которая обновляется в фоне
- **Приоритет UI**: ввод пользователя и высокоприоритетные обновления выполняются сразу, тяжёлый рендер — позже
- **Требует memo**: `useDeferredValue` полезен только в связке с `memo` на тяжёлых компонентах
- **Индикатор состояния**: сравниваем `value !== deferredValue` чтобы показать пользователю, что данные обновляются
- **Работает с Suspense**: предотвращает показ `fallback` при обновлении данных
- **Отличие от useTransition**: подходит когда нет доступа к `setState`, например при работе с пропами или сторонними библиотеками

Используйте `useDeferredValue` когда:
- Компонент получает значение через пропы или контекст
- Нужно улучшить отзывчивость без изменения логики обновления состояния
- Работаете со сторонними компонентами, у которых нет доступа к `setState`

Вы можете освоить продвинутые паттерны оптимизации React в [нашем курсе по React](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useDeferredValue).
