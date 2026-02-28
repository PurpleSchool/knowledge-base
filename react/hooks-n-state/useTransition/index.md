---
metaTitle: "useTransition в React - плавные переходы между состояниями"
metaDescription: "Полное руководство по хуку useTransition в React 18+. Разбираем, как откладывать неприоритетные обновления состояния для повышения отзывчивости интерфейса."
author: Олег Марков
title: useTransition - плавные переходы между состояниями
preview: Разбираемся с хуком useTransition, который позволяет разделить обновления состояния на срочные и несрочные. Вы научитесь плавно переключаться между состояниями без блокировки интерфейса и улучшать UX даже при тяжёлых вычислениях.
---

## Введение

Если вы работаете с React, то наверняка сталкивались с ситуацией, когда интерфейс «подвисает» при обработке ввода пользователя или переключении вкладок. Пользователь нажимает кнопку — и видит, как UI замирает на несколько секунд, пока перерисовывается тяжёлый список или таблица. Именно для решения таких проблем в React 18 появился хук `useTransition`.

`useTransition` позволяет пометить часть обновлений состояния как *несрочные* — React выполнит их с меньшим приоритетом, уступая дорогу срочным обновлениям (например, отклику на нажатие клавиши). Благодаря этому интерфейс остаётся отзывчивым, пока «тяжёлые» обновления выполняются в фоне.

Если вы хотите более глубоко изучить React и его возможности, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useTransition).

## Что такое useTransition и зачем он нужен

До React 18 все обновления состояния обрабатывались с одинаковым приоритетом: React перерисовывал компоненты как можно скорее. Это создавало проблему при одновременном обновлении «лёгкого» UI (поле ввода) и «тяжёлого» рендера (огромный список с тысячами элементов).

**Проблема без useTransition:**

```tsx
import React, { useState } from 'react';

const HeavyList = ({ query }: { query: string }) => {
  // Имитируем тяжёлую фильтрацию — 10 000 элементов
  const items = Array.from({ length: 10000 }, (_, i) => `Элемент ${i}`).filter(
    (item) => item.includes(query)
  );

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

function SearchApp() {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Каждое нажатие вызывает тяжёлую перерисовку — UI «лагает»
    setQuery(e.target.value);
  };

  return (
    <>
      <input value={query} onChange={handleChange} placeholder="Поиск..." />
      <HeavyList query={query} />
    </>
  );
}
```

Каждый ввод символа блокирует UI до завершения перерисовки тяжёлого списка.

**Решение с useTransition:**

```tsx
import React, { useState, useTransition } from 'react';

function SearchApp() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Срочное обновление — поле ввода реагирует мгновенно
    setQuery(e.target.value);

    // Несрочное обновление — список перерисовывается в фоне
    startTransition(() => {
      setDeferredQuery(e.target.value);
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} placeholder="Поиск..." />
      {isPending && <span>Загрузка...</span>}
      <HeavyList query={deferredQuery} />
    </>
  );
}
```

Теперь ввод в поле происходит мгновенно, а тяжёлый список обновляется, когда браузер освободится.

## Синтаксис useTransition

```tsx
const [isPending, startTransition] = useTransition();
```

Хук не принимает параметров и возвращает кортеж из двух элементов:

| Значение | Тип | Описание |
|---|---|---|
| `isPending` | `boolean` | `true`, пока несрочное обновление ещё не завершено |
| `startTransition` | `(callback: () => void) => void` | Функция для оборачивания несрочных обновлений состояния |

### Параметры startTransition

| Параметр | Тип | Описание |
|---|---|---|
| `callback` | `() => void` | Функция, содержащая вызовы `setState` (или несколько таких вызовов), которые следует пометить как несрочные |

> **Важно:** `startTransition` работает только с синхронными вызовами `setState`. Асинхронный код (например, `await` внутри callback) не будет помечен как transition.

## Базовый пример использования

Рассмотрим пример переключения вкладок с «тяжёлым» контентом:

```tsx
import React, { useState, useTransition } from 'react';

// Имитируем «медленный» компонент
const SlowTab = ({ label }: { label: string }) => {
  // Синхронная задержка для демонстрации
  const startTime = performance.now();
  while (performance.now() - startTime < 100) {
    // Блокируем поток на 100 мс
  }

  return <div>Содержимое вкладки: {label}</div>;
};

type Tab = 'home' | 'posts' | 'contact';

function TabContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (tab: Tab) => {
    // Переключение вкладки — несрочное обновление
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <nav>
        {(['home', 'posts', 'contact'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            // Подсвечиваем активную вкладку, даже пока она «грузится»
            style={{
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Контент не мигает — старая вкладка остаётся видимой до завершения */}
      <div style={{ opacity: isPending ? 0.8 : 1 }}>
        <SlowTab label={activeTab} />
      </div>
    </div>
  );
}
```

Обратите внимание: пока новая вкладка загружается (`isPending === true`), React сохраняет старый контент на экране и лишь затем заменяет его. Это принципиально отличает `useTransition` от обычного `setState`.

## Как работает useTransition под капотом

`useTransition` задействует механизм **конкурентного режима (Concurrent Mode)** React 18. Когда вы вызываете `startTransition`, React помечает обновление как *transition* и присваивает ему низкий приоритет.

Если в процессе выполнения transition появятся новые срочные обновления (например, ещё один ввод пользователя), React *прервёт* текущий render transition и сначала обработает срочное обновление. После этого transition будет запущен заново с актуальными данными.

```
Пользователь печатает: "hello"
├─ Срочное: query = "h"  ✅ сразу
├─ Transition: список для "h"  (начинает рендер)
│
Пользователь печатает: "he" (быстро)
├─ Срочное: query = "he" ✅ сразу
├─ Transition для "h" прерывается ❌
└─ Transition: список для "he" (начинает заново)
```

Это гарантирует, что пользователь всегда видит актуальные данные без лишних промежуточных состояний.

## Отображение индикатора загрузки

Флаг `isPending` — ваш инструмент для UX-обратной связи. Используйте его, чтобы показать пользователю, что что-то происходит:

```tsx
import React, { useState, useTransition } from 'react';

function FilteredList() {
  const [filter, setFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilter = (value: string) => {
    setFilter(value); // Срочное — поле обновляется мгновенно

    startTransition(() => {
      setActiveFilter(value); // Несрочное — список обновится позже
    });
  };

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => handleFilter(e.target.value)}
        placeholder="Фильтр..."
      />

      {/* Спиннер появляется только пока transition в процессе */}
      {isPending ? (
        <div className="spinner">⏳ Обновляю список...</div>
      ) : null}

      {/* Список становится полупрозрачным во время обновления */}
      <ul style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {getFilteredItems(activeFilter).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function getFilteredItems(filter: string): string[] {
  return Array.from({ length: 5000 }, (_, i) => `Товар ${i}`)
    .filter((item) => item.toLowerCase().includes(filter.toLowerCase()));
}
```

## Использование с Suspense

`useTransition` особенно мощен в связке с `Suspense`. Когда transition приводит к «подвешиванию» компонента (через `Suspense`), React не показывает fallback — вместо этого он удерживает текущий контент до завершения загрузки:

```tsx
import React, { useState, useTransition, Suspense } from 'react';

// Компонент, загружающий данные с задержкой (использует resource-паттерн)
const UserProfile = ({ userId }: { userId: number }) => {
  // Предполагаем, что fetchUser использует паттерн Suspense
  const user = fetchUser(userId); // Бросает Promise при загрузке

  return <div>Профиль: {user.name}</div>;
};

function App() {
  const [userId, setUserId] = useState(1);
  const [isPending, startTransition] = useTransition();

  const handleNextUser = () => {
    startTransition(() => {
      setUserId((id) => id + 1); // Переходим к следующему пользователю
    });
  };

  return (
    <div>
      <button onClick={handleNextUser} disabled={isPending}>
        {isPending ? 'Загрузка...' : 'Следующий пользователь'}
      </button>

      {/* Без useTransition: Suspense показал бы fallback при каждом переходе */}
      {/* С useTransition: старый профиль остаётся, пока новый не загрузится */}
      <Suspense fallback={<div>Загрузка профиля...</div>}>
        <UserProfile userId={userId} />
      </Suspense>
    </div>
  );
}
```

> Ключевое отличие: без `useTransition` при переходе между пользователями экран будет мигать через fallback `Suspense`. С `useTransition` старый контент остаётся видимым, и переход происходит плавно.

## Типизация с TypeScript

`useTransition` не требует дополнительных generic-параметров — его типы полностью выводятся из `@types/react`:

```tsx
import { useTransition } from 'react';

// Типы выводятся автоматически:
// isPending: boolean
// startTransition: TransitionStartFunction
const [isPending, startTransition] = useTransition();

// TransitionStartFunction принимает callback без возвращаемого значения
startTransition(() => {
  setSomeState(newValue);
});

// Можно явно типизировать callback через тип TransitionFunction
import type { TransitionStartFunction } from 'react';

function scheduleUpdate(startTransition: TransitionStartFunction, value: string) {
  startTransition(() => {
    setState(value);
  });
}
```

Если вы передаёте `startTransition` как prop в дочерние компоненты:

```tsx
import { useTransition } from 'react';

interface Props {
  onNavigate: (page: string) => void;
}

function NavButton({ onNavigate }: Props) {
  return <button onClick={() => onNavigate('about')}>О нас</button>;
}

function App() {
  const [page, setPage] = useState('home');
  const [isPending, startTransition] = useTransition();

  const handleNavigate = (newPage: string) => {
    startTransition(() => {
      setPage(newPage);
    });
  };

  return <NavButton onNavigate={handleNavigate} />;
}
```

## Продвинутые паттерны

### Паттерн 1: Оптимистичное обновление с transition

Сочетайте немедленное обновление UI (оптимистичное) с несрочным обновлением «тяжёлой» части:

```tsx
import React, { useState, useTransition } from 'react';

interface Message {
  id: number;
  text: string;
  sending?: boolean;
}

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    const newMessage: Message = { id: Date.now(), text: input, sending: true };

    // Срочно: добавляем сообщение с флагом "отправляется"
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // Несрочно: обновляем тяжёлый список всех сообщений после отправки
    startTransition(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, sending: false } : msg
        )
      );
    });
  };

  return (
    <div>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} style={{ opacity: msg.sending ? 0.6 : 1 }}>
            {msg.text} {msg.sending ? '(отправляется...)' : ''}
          </li>
        ))}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Отправить</button>
    </div>
  );
}
```

### Паттерн 2: Множественные transitions в одном обработчике

В одном обработчике можно запустить несколько `startTransition`, но лучше объединять их в один вызов:

```tsx
import React, { useState, useTransition } from 'react';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState<number[]>([]);
  const [tableData, setTableData] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    // Объединяем все несрочные обновления в один startTransition
    startTransition(() => {
      setActiveTab(tab);
      setChartData(generateChartData(tab));  // «Тяжёлые» данные
      setTableData(generateTableData(tab));  // Ещё «тяжёлые» данные
    });
  };

  return (
    <div>
      <button onClick={() => handleTabChange('overview')}>Обзор</button>
      <button onClick={() => handleTabChange('analytics')}>Аналитика</button>
      {isPending && <div>Обновляю дашборд...</div>}
      {/* Контент обновляется атомарно — все три стейта меняются вместе */}
    </div>
  );
}

function generateChartData(tab: string): number[] {
  return Array.from({ length: 1000 }, () => Math.random());
}

function generateTableData(tab: string): string[] {
  return Array.from({ length: 1000 }, (_, i) => `${tab}-row-${i}`);
}
```

### Паттерн 3: useTransition в кастомном хуке

Инкапсулируйте логику переходов в переиспользуемом хуке:

```tsx
import { useState, useTransition } from 'react';

// Универсальный хук для навигации с transition
function useTabNavigation<T extends string>(initialTab: T) {
  const [activeTab, setActiveTab] = useState<T>(initialTab);
  const [isPending, startTransition] = useTransition();

  const navigate = (tab: T) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return { activeTab, isPending, navigate };
}

// Использование
function MyTabs() {
  const { activeTab, isPending, navigate } = useTabNavigation<'home' | 'settings'>('home');

  return (
    <div>
      <button onClick={() => navigate('home')} aria-busy={isPending}>
        Главная
      </button>
      <button onClick={() => navigate('settings')} aria-busy={isPending}>
        Настройки
      </button>
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        {activeTab === 'home' ? <HomePage /> : <SettingsPage />}
      </div>
    </div>
  );
}
```

## useTransition vs useDeferredValue: ключевые отличия

Оба инструмента решают схожую задачу — откладывают «тяжёлые» обновления — но работают по-разному:

| Критерий | `useTransition` | `useDeferredValue` |
|---|---|---|
| **Что откладывает** | Вызов `setState` | Использование значения |
| **Кто управляет** | Вы (оборачиваете `setState`) | React (сам откладывает значение) |
| **Доступ к isPending** | ✅ Да | ❌ Нет |
| **Применение** | Вы контролируете источник данных | Данные приходят извне (props) |
| **Гибкость** | Высокая — можно откладывать несколько обновлений | Низкая — только одно значение |
| **Когда использовать** | Ваш код вызывает setState | Получаете данные из props/внешнего источника |

**Пример выбора:**

```tsx
// Используем useTransition — у нас есть контроль над setState
function SearchWithTransition() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      setResults(computeResults(value)); // ✅ Контролируем setState
    });
  };

  return <input value={query} onChange={(e) => handleSearch(e.target.value)} />;
}

// Используем useDeferredValue — данные приходят как prop
function ResultsList({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query); // ✅ Не контролируем источник
  const results = computeResults(deferredQuery);

  return <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>;
}
```

## Ограничения и когда не стоит использовать

```tsx
// ❌ Нельзя: async-код внутри startTransition не является transition
startTransition(async () => {
  await fetchData(); // Эта часть НЕ будет transition
  setState(data);    // И это тоже
});

// ✅ Правильно: только синхронный setState внутри startTransition
const data = await fetchData(); // Ждём данные снаружи
startTransition(() => {
  setState(data); // Только setState внутри
});

// ❌ Нельзя: нельзя обернуть управление внешними библиотеками
startTransition(() => {
  externalStore.set('key', value); // Не работает — это не setState React
});

// ❌ Избыточно: простые обновления не нуждаются в transition
startTransition(() => {
  setIsOpen(true); // Это быстрое обновление — transition не нужен
});

// ❌ Нельзя: нельзя использовать в обработчике ввода без дополнительного setState
const handleChange = (e) => {
  // Поле ввода ВСЕГДА должно обновляться срочно
  startTransition(() => {
    setQuery(e.target.value); // ❌ Поле будет «тормозить»!
  });
};

// ✅ Правильно: разделяем срочное и несрочное
const handleChange = (e) => {
  setQuery(e.target.value);       // ✅ Срочное — поле мгновенно
  startTransition(() => {
    setFilteredList(compute(e.target.value)); // ✅ Несрочное — список потом
  });
};
```

**Требования к версии:** `useTransition` доступен начиная с **React 18**. В предыдущих версиях используйте дебаунсинг или `setTimeout` как альтернативу.

**Когда не нужен useTransition:**
- Обновления уже достаточно быстрые (< 16 мс)
- Данные приходят из props — используйте `useDeferredValue`
- Вам нужно задержать сетевой запрос — используйте дебаунс

## Практический пример: поиск по каталогу товаров

Реальный сценарий — поиск по большому каталогу с фильтрами и сортировкой:

```tsx
import React, { useState, useTransition, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

// Генерируем большой каталог
const PRODUCTS: Product[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Товар ${i} ${['Ноутбук', 'Телефон', 'Планшет', 'Часы'][i % 4]}`,
  category: ['Электроника', 'Одежда', 'Книги'][i % 3],
  price: Math.round(Math.random() * 100000),
}));

type SortField = 'name' | 'price';

function ProductCatalog() {
  // Срочные состояния — обновляются мгновенно
  const [searchInput, setSearchInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('all');

  // Несрочные состояния — обновляются через transition
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('name');

  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setSearchInput(value); // Срочно: поле реагирует мгновенно
    startTransition(() => {
      setSearch(value); // Несрочно: фильтрация в фоне
    });
  };

  const handleCategory = (value: string) => {
    setCategoryInput(value); // Срочно: выбор мгновенно
    startTransition(() => {
      setCategory(value); // Несрочно: фильтрация в фоне
    });
  };

  const handleSort = (field: SortField) => {
    startTransition(() => {
      setSortBy(field); // Несрочно: сортировка может подождать
    });
  };

  // Тяжёлые вычисления — запускаются только при изменении несрочных стейтов
  const filteredProducts = useMemo(() => {
    return PRODUCTS
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        return a.name.localeCompare(b.name);
      });
  }, [search, category, sortBy]);

  return (
    <div>
      <div className="controls">
        {/* Срочные контролы — отвечают мгновенно */}
        <input
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Поиск товаров..."
        />

        <select
          value={categoryInput}
          onChange={(e) => handleCategory(e.target.value)}
        >
          <option value="all">Все категории</option>
          <option value="Электроника">Электроника</option>
          <option value="Одежда">Одежда</option>
          <option value="Книги">Книги</option>
        </select>

        <button onClick={() => handleSort('name')}>Сортировать по имени</button>
        <button onClick={() => handleSort('price')}>Сортировать по цене</button>
      </div>

      {/* Индикатор загрузки */}
      <div className="status">
        {isPending ? (
          <span>⏳ Обновляю каталог...</span>
        ) : (
          <span>Найдено: {filteredProducts.length} товаров</span>
        )}
      </div>

      {/* Список становится полупрозрачным во время перерисовки */}
      <ul
        style={{
          opacity: isPending ? 0.6 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {filteredProducts.slice(0, 50).map((product) => (
          <li key={product.id}>
            <strong>{product.name}</strong> — {product.category} —{' '}
            {product.price.toLocaleString('ru-RU')} ₽
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductCatalog;
```

В этом примере поле поиска и выпадающий список реагируют мгновенно, а тяжёлая фильтрация и сортировка 10 000 товаров происходят в фоне — без блокировки UI.

## Итоги

- **`useTransition`** позволяет пометить обновления состояния как *несрочные*, что делает интерфейс отзывчивым при тяжёлых перерисовках
- Хук возвращает `[isPending, startTransition]`: флаг ожидания и функцию для оборачивания несрочных обновлений
- В отличие от `useDeferredValue`, `useTransition` используется, когда у вас есть контроль над вызовом `setState`
- React может *прервать* transition при появлении новых срочных обновлений и запустить его заново
- `isPending` удобен для отображения индикаторов загрузки и плавных переходов через `opacity`
- Внутри `startTransition` должны быть только синхронные вызовы `setState` — async-код не работает как transition
- Особенно эффективен в связке с `Suspense` — позволяет избежать мигающих fallback при навигации

Если вы хотите освоить конкурентный режим React, `useTransition` и другие современные хуки на практике, рекомендую [курс по React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledge&utm_medium=article&utm_campaign=useTransition).
