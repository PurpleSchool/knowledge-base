---
metaTitle: "Framer Motion layout-анимации в React — полное руководство"
metaDescription: "Как использовать layout-анимации Framer Motion в React: layout prop, layoutId, AnimatePresence, LayoutGroup с практическими примерами."
author: "Антон Ларичев"
title: "Layout-анимации в React с Framer Motion"
preview: "Разбираем layout-анимации Framer Motion: плавные переходы при изменении размера, позиции и структуры DOM без ручного расчёта координат."
---

## Что такое layout-анимации

Когда элемент меняет размер или позицию — например, карточка раскрывается, список перестраивается или вкладка переключается — браузер мгновенно перерисовывает DOM. Пользователь видит резкий скачок вместо плавного перехода.

Framer Motion решает эту проблему через layout-анимации: библиотека автоматически вычисляет разницу между начальным и конечным состоянием элемента, а затем плавно интерполирует изменения через CSS transform. Это работает без ручного указания начальных/конечных координат.

## Установка и базовая настройка

```bash
npm install framer-motion
```

Framer Motion экспортирует компонент `motion` — обёртку над обычными HTML-тегами. Именно через него подключаются все анимационные возможности.

```typescript
import { motion } from 'framer-motion';

export function Box() {
  return <motion.div>Содержимое</motion.div>;
}
```

## Проп layout

Проп `layout` — ключевой инструмент для layout-анимаций. Добавьте его к `motion`-элементу, и Framer Motion начнёт автоматически анимировать изменения позиции и размера.

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';

export function ExpandableCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      style={{
        background: '#6c5ce7',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        width: expanded ? 400 : 200,
      }}
    >
      <motion.h2 layout="position">Заголовок карточки</motion.h2>
      {expanded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Дополнительное описание, которое появляется при раскрытии карточки.
        </motion.p>
      )}
    </motion.div>
  );
}
```

Значения пропа `layout`:

- `layout={true}` — анимирует и позицию, и размер;
- `layout="position"` — только позицию (полезно для текста, чтобы избежать искажения масштаба);
- `layout="size"` — только размер;
- `layout="preserve-aspect"` — сохраняет соотношение сторон при масштабировании.

### Почему текст нужно выносить с layout="position"

Когда вы масштабируете родительский блок через transform (что делает Framer Motion под капотом), текст внутри визуально сжимается или растягивается. Проп `layout="position"` на дочерних текстовых элементах компенсирует это искажение.

```typescript
<motion.div layout style={{ width: isWide ? 600 : 300 }}>
  {/* Без layout="position" текст будет визуально сжиматься/растягиваться */}
  <motion.h3 layout="position">Заголовок</motion.h3>
  <motion.p layout="position">Описание</motion.p>
</motion.div>
```

## AnimatePresence и выходные анимации

Когда элемент удаляется из DOM, React делает это мгновенно. `AnimatePresence` позволяет элементам проигрывать exit-анимацию перед удалением.

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: number;
  text: string;
}

export function RemovableList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: 'Элемент один' },
    { id: 2, text: 'Элемент два' },
    { id: 3, text: 'Элемент три' },
  ]);

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              background: '#dfe6e9',
              marginBottom: 8,
              padding: '12px 16px',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{item.text}</span>
            <button onClick={() => removeItem(item.id)}>Удалить</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

Комбинация `layout` + `AnimatePresence` даёт эффект, когда оставшиеся элементы плавно перемещаются на место удалённых — без единой строки расчёта координат.

### Режим AnimatePresence

Проп `mode` управляет порядком enter/exit анимаций:

- `mode="sync"` (по умолчанию) — enter и exit идут одновременно;
- `mode="wait"` — сначала завершается exit, потом начинается enter;
- `mode="popLayout"` — исходящий элемент временно выводится из потока, входящий анимируется на его место.

```typescript
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Содержимое
    </motion.div>
  )}
</AnimatePresence>
```

## layoutId — анимации между компонентами

`layoutId` — один из самых эффектных инструментов Framer Motion. Если два разных элемента в дереве получают одинаковый `layoutId`, при смене активного элемент «перелетает» с одного места на другое. Это идеальный инструмент для индикатора активной вкладки, раскрывающихся карточек и модальных окон.

### Индикатор активной вкладки

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';

const tabs = ['Обзор', 'Характеристики', 'Отзывы'];

export function TabBar() {
  const [activeTab, setActiveTab] = useState('Обзор');

  return (
    <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            position: 'relative',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === tab ? 700 : 400,
          }}
        >
          {tab}
          {activeTab === tab && (
            <motion.div
              layoutId="tab-indicator"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: '#6c5ce7',
                borderRadius: 2,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

Framer Motion отслеживает, где находился элемент с `layoutId="tab-indicator"` в предыдущем рендере, и плавно перемещает его на новую позицию.

### Раскрывающаяся карточка с модальным окном

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  color: string;
}

const products: Product[] = [
  { id: 1, name: 'Продукт Alpha', color: '#6c5ce7' },
  { id: 2, name: 'Продукт Beta', color: '#00b894' },
  { id: 3, name: 'Продукт Gamma', color: '#e17055' },
];

export function ProductGrid() {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <>
      <div style={{ display: 'flex', gap: 16 }}>
        {products.map((product) => (
          <motion.div
            key={product.id}
            layoutId={`card-${product.id}`}
            onClick={() => setSelected(product)}
            style={{
              background: product.color,
              borderRadius: 16,
              width: 120,
              height: 120,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {product.name}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 10,
              }}
            />
            <motion.div
              layoutId={`card-${selected.id}`}
              style={{
                position: 'fixed',
                top: '20%',
                left: '50%',
                translateX: '-50%',
                background: selected.color,
                borderRadius: 24,
                width: 320,
                height: 400,
                zIndex: 20,
                padding: 32,
                color: '#fff',
                cursor: 'pointer',
              }}
              onClick={() => setSelected(null)}
            >
              <h2>{selected.name}</h2>
              <p>Подробное описание продукта появляется при раскрытии карточки.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

Карточка «улетает» с сетки в центр экрана и обратно — и всё это за счёт одного `layoutId`.

## LayoutGroup — синхронизация между деревьями

По умолчанию layout-анимации работают независимо в каждом поддереве. `LayoutGroup` объединяет несколько компонентов в одну анимационную группу — все изменения внутри группы будут синхронизированы.

```typescript
import { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';

function AccordionItem({ title, isOpen, onToggle }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div layout style={{ background: '#f8f9fa', borderRadius: 8, marginBottom: 8 }}>
      <motion.button
        layout
        onClick={onToggle}
        style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
      >
        {title}
      </motion.button>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ padding: '0 16px 16px' }}
        >
          Содержимое раздела аккордеона.
        </motion.div>
      )}
    </motion.div>
  );
}

export function Accordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = ['Раздел первый', 'Раздел второй', 'Раздел третий'];

  return (
    <LayoutGroup>
      {items.map((item, index) => (
        <AccordionItem
          key={item}
          title={item}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </LayoutGroup>
  );
}
```

`LayoutGroup` обеспечивает координацию: когда один элемент аккордеона раскрывается, все остальные плавно смещаются вниз.

### Уникальные id для LayoutGroup

Если на странице несколько независимых групп с `layoutId`, добавьте каждой `LayoutGroup` проп `id`, чтобы изолировать их пространства имён:

```typescript
<LayoutGroup id="navigation">
  {/* Элементы навигации */}
</LayoutGroup>

<LayoutGroup id="sidebar">
  {/* Элементы боковой панели */}
</LayoutGroup>
```

## Настройка переходов

Поведение layout-анимации настраивается через проп `transition` с вложенным объектом `layout`:

```typescript
<motion.div
  layout
  transition={{
    layout: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }}
>
  Содержимое
</motion.div>
```

Доступные типы переходов:

```typescript
// Пружинная анимация (по умолчанию для layout)
transition={{ layout: { type: 'spring', bounce: 0.3 } }}

// Анимация с easing
transition={{ layout: { type: 'tween', duration: 0.3, ease: 'easeOut' } }}

// Инерционная
transition={{ layout: { type: 'inertia', velocity: 50 } }}
```

## Производительность и ограничения

### Как Framer Motion работает под капотом

Framer Motion использует технику FLIP (First, Last, Invert, Play):

1. Запоминает начальное положение элемента (First);
2. Позволяет браузеру перерисовать DOM в новом состоянии (Last);
3. Применяет обратный transform, чтобы визуально вернуть элемент в начальное положение (Invert);
4. Анимирует transform к нулю (Play).

Поскольку анимируется только `transform`, браузер не делает повторный layout — это GPU-операция.

### Когда layout-анимации могут тормозить

- Слишком много одновременно анимирующихся элементов (более 50-100 в DOM);
- Вложенные `layout` элементы с разными переходами;
- Частые перестройки крупных списков без виртуализации.

### Оптимизация через `layoutScroll`

Если layout-элемент находится внутри скроллируемого контейнера, добавьте `layoutScroll` на контейнер, чтобы Framer Motion учитывал смещение прокрутки:

```typescript
<motion.div layoutScroll style={{ overflow: 'auto', height: 400 }}>
  {items.map((item) => (
    <motion.div key={item.id} layout>
      {item.text}
    </motion.div>
  ))}
</motion.div>
```

### Проблема с border-radius

При масштабировании через transform `border-radius` визуально искажается. Framer Motion исправляет это автоматически для значений в пикселях. Для значений в процентах или `em` добавьте `style={{ borderRadius: 'var(--radius)' }}` и определите CSS-переменную.

## Практический пример: перетаскиваемый список с переупорядочиванием

```typescript
import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface Task {
  id: string;
  title: string;
}

export function DraggableTaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'a', title: 'Написать тесты' },
    { id: 'b', title: 'Провести код-ревью' },
    { id: 'c', title: 'Обновить документацию' },
    { id: 'd', title: 'Задеплоить на стейджинг' },
  ]);

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <Reorder.Group
      axis="y"
      values={tasks}
      onReorder={setTasks}
      style={{ listStyle: 'none', padding: 0 }}
    >
      <AnimatePresence>
        {tasks.map((task) => (
          <Reorder.Item
            key={task.id}
            value={task}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              background: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <span>{task.title}</span>
            <button
              onClick={() => removeTask(task.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e17055' }}
            >
              Удалить
            </button>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}
```

`Reorder.Group` и `Reorder.Item` — встроенные компоненты Framer Motion для drag-and-drop переупорядочивания. Они автоматически применяют layout-анимации при перестройке списка.

## Типичные ошибки

**Забытый key у элементов списка.** Без уникального `key` React не может отслеживать идентичность элементов, и анимации будут неправильными или отсутствовать.

**Неправильное использование layoutId в условных блоках.** Если элемент с `layoutId` рендерится в двух местах одновременно (не взаимоисключающих условиях), анимация сломается. Убедитесь, что только один элемент с данным `layoutId` присутствует в DOM в каждый момент.

**AnimatePresence без key.** `AnimatePresence` отслеживает вход и выход по `key`. Без него дочерние exit-анимации не будут проигрываться.

**layout без AnimatePresence для условных элементов.** Если элемент появляется и исчезает через условный рендеринг, оберните его в `AnimatePresence` — иначе exit-анимация не сработает.

## Итог

Framer Motion layout-анимации покрывают большинство распространённых сценариев анимации в React-приложениях:

- `layout` — автоматическая анимация позиции и размера;
- `AnimatePresence` — анимации появления и исчезновения;
- `layoutId` — переходы одного элемента между разными позициями в DOM;
- `LayoutGroup` — синхронизация анимаций между независимыми поддеревьями;
- `Reorder` — drag-and-drop с layout-анимациями из коробки.

Комбинируя эти инструменты, можно создавать анимированные интерфейсы, не управляя координатами вручную.

---

Хотите освоить React с нуля до профессионального уровня? Записывайтесь на курс по React на PurpleSchool: [Курс по React](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=framer-motion-layout-animations)