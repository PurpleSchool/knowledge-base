---
metaTitle: "react-window — виртуализация списков в React"
metaDescription: "Полное руководство по react-window: FixedSizeList, VariableSizeList, FixedSizeGrid, бесконечная прокрутка, интеграция с react-virtualized-auto-sizer. Оптимизация длинных списков."
---

# react-window — виртуализация списков

**react-window** — библиотека для **виртуализации** больших списков и таблиц. Вместо рендера всех элементов одновременно, она рендерит только видимые элементы в области прокрутки, что кардинально улучшает производительность при работе с тысячами строк.

```bash
npm install react-window
```

## Проблема: рендер тысяч элементов

```tsx
// ❌ Плохо — рендерим 10 000 элементов в DOM
function SlowList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li> // 10 000 DOM-узлов!
      ))}
    </ul>
  );
}

// ✅ Хорошо — react-window рендерит только ~20 видимых элементов
```

Виртуализация рендерит только элементы, попадающие в видимую область экрана. При прокрутке элементы переиспользуются с обновлёнными данными.

## FixedSizeList — список с одинаковой высотой строк

Используйте когда все строки имеют одинаковую высоту:

```tsx
import { FixedSizeList as List } from 'react-window';

interface Item {
  id: number;
  name: string;
  email: string;
}

// Компонент строки — должен быть чистым и принимать style из данных
interface RowProps {
  index: number;
  style: React.CSSProperties; // Обязательно передавать в корневой элемент!
  data: Item[];
}

function Row({ index, style, data }: RowProps) {
  const item = data[index];
  return (
    <div style={style} className="list-row"> {/* style ОБЯЗАТЕЛЕН */}
      <span>{item.name}</span>
      <span>{item.email}</span>
    </div>
  );
}

function UserList({ users }: { users: Item[] }) {
  return (
    <List
      height={600}           // Высота контейнера списка
      itemCount={users.length} // Общее количество элементов
      itemSize={50}          // Высота каждой строки в пикселях
      width="100%"           // Ширина контейнера
      itemData={users}       // Данные, доступные в компоненте строки
    >
      {Row}
    </List>
  );
}
```

## VariableSizeList — список с разной высотой строк

Когда строки имеют разную высоту, используйте `VariableSizeList`:

```tsx
import { VariableSizeList as List } from 'react-window';

const ITEM_SIZES = [50, 80, 35, 120, 60]; // Разная высота для каждой строки

function getItemSize(index: number): number {
  // Логика определения высоты по индексу
  return ITEM_SIZES[index % ITEM_SIZES.length];
}

interface VariableRowProps {
  index: number;
  style: React.CSSProperties;
  data: Post[];
}

function PostRow({ index, style, data }: VariableRowProps) {
  const post = data[index];
  return (
    <div style={style} className="post-row">
      <h3>{post.title}</h3>
      {post.hasImage && <img src={post.thumbnail} alt="" />}
      <p>{post.excerpt}</p>
    </div>
  );
}

function PostList({ posts }: { posts: Post[] }) {
  return (
    <List
      height={600}
      itemCount={posts.length}
      itemSize={getItemSize}  // Функция вместо числа
      width="100%"
      itemData={posts}
    >
      {PostRow}
    </List>
  );
}
```

## FixedSizeGrid — двумерная таблица

Для таблиц с фиксированными размерами ячеек:

```tsx
import { FixedSizeGrid as Grid } from 'react-window';

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: string[][];
}

function Cell({ columnIndex, rowIndex, style, data }: CellProps) {
  return (
    <div style={style} className="grid-cell">
      {data[rowIndex][columnIndex]}
    </div>
  );
}

function DataGrid({ matrix }: { matrix: string[][] }) {
  return (
    <Grid
      columnCount={matrix[0].length}  // Количество столбцов
      columnWidth={150}               // Ширина столбца
      height={500}                    // Высота контейнера
      rowCount={matrix.length}        // Количество строк
      rowHeight={35}                  // Высота строки
      width={900}                     // Ширина контейнера
      itemData={matrix}
    >
      {Cell}
    </Grid>
  );
}
```

## Автоматический размер с react-virtualized-auto-sizer

Для адаптации к размеру контейнера используйте `AutoSizer`:

```bash
npm install react-virtualized-auto-sizer
```

```tsx
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function ResponsiveList({ items }: { items: Item[] }) {
  return (
    // AutoSizer занимает 100% родительского контейнера
    <div style={{ height: '100vh' }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}  // Динамическая высота
            width={width}    // Динамическая ширина
            itemCount={items.length}
            itemSize={50}
            itemData={items}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
```

## Бесконечная прокрутка

Загрузка данных по мере прокрутки:

```tsx
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface InfiniteListProps {
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  items: Item[];
  loadNextPage: () => Promise<void>;
}

function InfiniteList({
  hasNextPage,
  isNextPageLoading,
  items,
  loadNextPage,
}: InfiniteListProps) {
  // Добавляем заглушку для загружаемого элемента
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Проверяем загружен ли элемент
  const isItemLoaded = (index: number) => !hasNextPage || index < items.length;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={isNextPageLoading ? () => {} : loadNextPage}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          height={600}
          itemCount={itemCount}
          itemSize={50}
          width="100%"
          onItemsRendered={onItemsRendered}
          ref={ref}
        >
          {({ index, style }) => {
            if (!isItemLoaded(index)) {
              return <div style={style}>Загрузка...</div>;
            }
            return (
              <div style={style}>
                {items[index].name}
              </div>
            );
          }}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
}
```

## Кастомный скроллбар и sticky header

```tsx
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { forwardRef } from 'react';

// Кастомный внутренний контейнер для sticky заголовка
const innerElementType = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ style, ...rest }, ref) => (
    <div ref={ref} style={style} {...rest}>
      {/* Sticky заголовок */}
      <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
        <div style={{ display: 'flex', padding: '0 16px', height: 40 }}>
          <span style={{ flex: 1 }}>Имя</span>
          <span style={{ flex: 1 }}>Email</span>
          <span style={{ flex: 1 }}>Статус</span>
        </div>
      </div>
    </div>
  )
);

function TableWithHeader({ users }: { users: User[] }) {
  return (
    <FixedSizeList
      height={500}
      itemCount={users.length}
      itemSize={50}
      width="100%"
      innerElementType={innerElementType}
    >
      {({ index, style }: ListChildComponentProps) => (
        <div style={{ ...style, top: Number(style.top) + 40 }}>
          {/* Сдвигаем на высоту заголовка */}
          <span>{users[index].name}</span>
          <span>{users[index].email}</span>
          <span>{users[index].status}</span>
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Мемоизация компонента строки

Для максимальной производительности мемоизируйте компонент строки:

```tsx
import { memo } from 'react';
import { areEqual, ListChildComponentProps } from 'react-window';

interface ItemData {
  items: Item[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}

// areEqual — функция сравнения пропсов из react-window
const MemoizedRow = memo(function Row({
  index,
  style,
  data,
}: ListChildComponentProps<ItemData>) {
  const { items, selectedIds, onToggle } = data;
  const item = items[index];
  const isSelected = selectedIds.has(item.id);

  return (
    <div
      style={style}
      className={`row ${isSelected ? 'row--selected' : ''}`}
      onClick={() => onToggle(item.id)}
    >
      <input type="checkbox" checked={isSelected} readOnly />
      <span>{item.name}</span>
    </div>
  );
}, areEqual);

function SelectableList({ items }: { items: Item[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // useCallback чтобы функция не создавалась заново
  const handleToggle = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // useMemo чтобы itemData не создавался заново при изменении selectedIds
  const itemData = useMemo(
    () => ({ items, selectedIds, onToggle: handleToggle }),
    [items, selectedIds, handleToggle]
  );

  return (
    <FixedSizeList
      height={500}
      itemCount={items.length}
      itemSize={50}
      width="100%"
      itemData={itemData}
    >
      {MemoizedRow}
    </FixedSizeList>
  );
}
```

## Когда использовать react-window

| Ситуация | react-window нужен? |
|----------|---------------------|
| < 100 элементов | ❌ Не нужен, overhead > выгоды |
| 100 - 500 элементов | 🟡 Зависит от сложности элементов |
| > 500 элементов | ✅ Рекомендуется |
| Элементы с изображениями | ✅ При любом количестве |
| Бесконечная прокрутка | ✅ Обязательно |
| Таблицы с тысячами строк | ✅ Обязательно |

## Краткое резюме

| Компонент | Когда использовать |
|-----------|-------------------|
| `FixedSizeList` | Все строки одинаковой высоты |
| `VariableSizeList` | Строки разной высоты |
| `FixedSizeGrid` | Двумерные данные (таблицы) |
| `AutoSizer` | Адаптивный размер контейнера |
| `InfiniteLoader` | Подгрузка данных при прокрутке |

## Дополнительные материалы

- [react-window на GitHub](https://github.com/bvaughn/react-window)
- [react-window документация](https://react-window.vercel.app/)
- [react-virtualized-auto-sizer](https://github.com/bvaughn/react-virtualized-auto-sizer)
- [react-window-infinite-loader](https://github.com/bvaughn/react-window-infinite-loader)
- [Virtualize large lists with react-window (web.dev)](https://web.dev/articles/virtualize-long-lists-react-window)
