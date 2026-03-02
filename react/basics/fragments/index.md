---
metaTitle: "Fragment в React — группировка элементов без лишних узлов DOM"
metaDescription: "Полное руководство по React Fragment: синтаксис, краткая запись, использование с key, отличие от div-обёрток и практические примеры применения."
---

# Fragment — группировка элементов без лишнего DOM

**Fragment** позволяет группировать несколько дочерних элементов **без добавления лишних узлов в DOM**. Это решает проблему обязательного единственного корневого элемента при возврате нескольких элементов из компонента.

```tsx
import { Fragment } from 'react';

function Component() {
  return (
    <Fragment>
      <h1>Заголовок</h1>
      <p>Параграф</p>
    </Fragment>
  );
}
```

## Проблема: лишняя обёртка

Без Fragment приходится оборачивать несколько элементов в `<div>`, что засоряет DOM ненужными узлами:

```tsx
// ❌ Плохо — лишний div в DOM
function TableRow() {
  return (
    <div>          {/* Лишний div нарушает семантику таблицы! */}
      <td>Ячейка 1</td>
      <td>Ячейка 2</td>
      <td>Ячейка 3</td>
    </div>
  );
}

// ✅ Хорошо — Fragment не создаёт DOM-узел
function TableRow() {
  return (
    <Fragment>
      <td>Ячейка 1</td>
      <td>Ячейка 2</td>
      <td>Ячейка 3</td>
    </Fragment>
  );
}
```

## Краткий синтаксис `<></>`

React поддерживает сокращённую запись Fragment с помощью пустых тегов `<>` и `</>`:

```tsx
function Component() {
  return (
    <>
      <h1>Заголовок</h1>
      <p>Параграф первый</p>
      <p>Параграф второй</p>
    </>
  );
}
```

Краткая запись `<></>` — это синтаксический сахар для `<Fragment></Fragment>`. Оба варианта создают одинаковый результат.

## Когда нужен `Fragment`, а не `<></>`

Краткий синтаксис `<></>` **не поддерживает атрибуты**. Если нужно передать `key` (например, при рендере списков), используйте полную запись `<Fragment key={...}>`:

```tsx
// ❌ Не работает — краткий синтаксис не поддерживает атрибуты
function List({ items }) {
  return items.map(item => (
    <key={item.id}>  {/* Синтаксическая ошибка! */}
      <dt>{item.term}</dt>
      <dd>{item.description}</dd>
    </>
  ));
}

// ✅ Правильно — используем Fragment с key
import { Fragment } from 'react';

function List({ items }: { items: Array<{ id: number; term: string; description: string }> }) {
  return items.map(item => (
    <Fragment key={item.id}>
      <dt>{item.term}</dt>
      <dd>{item.description}</dd>
    </Fragment>
  ));
}
```

## Практические примеры

### Таблицы и списки определений

Fragment особенно полезен там, где структура DOM строго регламентирована:

```tsx
// Таблица — строки должны содержать только <td>/<th> без лишних обёрток
function UserTable({ users }: { users: User[] }) {
  return (
    <table>
      <tbody>
        {users.map(user => (
          <Fragment key={user.id}>
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
            {user.isAdmin && (
              <tr className="admin-row">
                <td colSpan={2}>Администратор</td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
```

```tsx
// Список определений
function Glossary({ terms }: { terms: Array<{ word: string; definition: string }> }) {
  return (
    <dl>
      {terms.map(term => (
        <Fragment key={term.word}>
          <dt>{term.word}</dt>
          <dd>{term.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

### Возврат нескольких элементов из компонента

```tsx
// Компонент возвращает несколько элементов без обёртки
function UserInfo({ user }: { user: User }) {
  return (
    <>
      <Avatar src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
      <ContactLinks links={user.contacts} />
    </>
  );
}
```

### Условный рендер нескольких элементов

```tsx
function Notification({ type, message, details }: NotificationProps) {
  return (
    <>
      <p className={`notification notification--${type}`}>{message}</p>
      {details && (
        <>
          <hr />
          <p className="notification__details">{details}</p>
        </>
      )}
    </>
  );
}
```

### Компонент-обёртка без DOM-узлов

```tsx
// Провайдер без лишнего узла в DOM
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Использование в корне приложения
root.render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

## Fragment vs div: когда что использовать

| Ситуация | Fragment `<>` | `<div>` |
|----------|--------------|---------|
| Нет CSS-стилей или обработчиков | ✅ Предпочтительно | ❌ Лишний DOM-узел |
| Нужна семантика таблицы/списка | ✅ Обязательно | ❌ Нарушает структуру |
| Нужен CSS класс / id | ❌ Не поддерживает | ✅ |
| Нужен обработчик событий | ❌ Не поддерживает | ✅ |
| Нужен `key` в списке | ✅ `<Fragment key>` | ✅ `<div key>` |
| Flex / Grid контейнер | ❌ | ✅ |

## Проверка в DevTools

В React DevTools Fragment отображается как специальный узел, не создающий DOM-элемент:

```
App
  └─ Fragment          ← Виден в DevTools, но не в DOM
       ├─ <h1>
       ├─ <p>
       └─ <p>
```

В реальном DOM будет:
```html
<h1>...</h1>
<p>...</p>
<p>...</p>
```

## Краткое резюме

| Синтаксис | Пример | Когда использовать |
|-----------|--------|-------------------|
| `<Fragment>` | `<Fragment>...</Fragment>` | Нужен атрибут `key` |
| `<>` | `<>...</>` | Большинство случаев |

## Дополнительные материалы

- [React Docs — Fragment](https://react.dev/reference/react/Fragment)
- [React Docs — Rendering Lists](https://react.dev/learn/rendering-lists)
