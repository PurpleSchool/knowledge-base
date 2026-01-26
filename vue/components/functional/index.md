---
metaTitle: Функциональные компоненты в React - полный разбор для практикующих разработчиков
metaDescription: Подробное руководство по функциональным компонентам в React - синтаксис хуки управление состоянием жизненный цикл и оптимизация
author: Олег Марков
title: Функциональные компоненты в React - функциональный подход к построению интерфейсов
preview: Разберитесь как работают функциональные компоненты в React - чем они отличаются от классовых компонентов как использовать хуки и как писать простой и поддерживаемый код
---

## Введение

Функциональные компоненты сегодня — основной способ написания пользовательских интерфейсов в React. Если раньше классовые компоненты считались «старшим» инструментом, то с появлением хуков функциональный подход стал не только удобным, но и более мощным.

В этой статье мы разберем, что такое функциональные компоненты, почему вокруг них выстроена современная экосистема React, как с их помощью управлять состоянием, жизненным циклом и производительностью. Смотрите, я покажу вам, как это работает на практике, с примерами и комментариями в коде.

Мы будем говорить на примере React, но многие идеи (чистые функции, композиция, пропсы) полезны и в других библиотеках, использующих подход functional-components.

---

## Что такое функциональные компоненты

### Определение и ключевая идея

Функциональный компонент — это обычная JavaScript-функция, которая:

- принимает один аргумент — объект пропсов
- возвращает JSX-дерево (описание интерфейса)
- не имеет собственного `this` (в отличие от классовых компонентов)
- ведет себя как чистая функция по отношению к пропсам (желательно без побочных эффектов в теле самой функции)

Простейший пример:

```jsx
// Функциональный компонент приветствия
function Greeting(props) {
  // Используем значение пропса name для отображения текста
  return <h1>Привет, {props.name}</h1>;
}

// Использование компонента
// <Greeting name="Анна" />
```

Здесь важно понимать: компонент не «рисует» интерфейс сам по себе. Он просто возвращает структуру данных (JSX), которую React дальше использует, чтобы обновить DOM.

### Отличия от классовых компонентов

Давайте коротко сравним:

| Критерий              | Функциональный компонент                           | Классовый компонент                         |
|-----------------------|----------------------------------------------------|---------------------------------------------|
| Синтаксис             | Функция                                           | Класс, наследующий `React.Component`        |
| Состояние             | Через хуки (`useState`, `useReducer`)             | Через `this.state` и `this.setState`       |
| Жизненный цикл        | Через хуки (`useEffect`, `useLayoutEffect`)       | Методы (`componentDidMount`, `componentDidUpdate` и др.) |
| Контекст              | `useContext`                                      | `contextType` или `<Context.Consumer>`     |
| `this`                | Нет                                               | Есть, нужен `this` для доступа к свойствам |
| Производительность    | Легче оптимизировать, меньше «служебного» кода    | Больше обвязки, сложнее трекать логику     |
| Рекомендуемое решение | Да (современный стандарт)                         | Поддерживаются, но не развиваются           |

С практической точки зрения, сегодня имеет смысл начинать и продолжать именно с функциональных компонентов.

---

## Синтаксис функциональных компонентов

### Базовый шаблон

Давайте разберем базовый шаблон функционального компонента:

```jsx
// Компонент объявляем как функцию
function Button(props) {
  // Деструктуризация пропсов для удобства
  const { label, onClick } = props;

  // Возвращаем JSX-дерево
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
}

// Использование компонента
// <Button label="Сохранить" onClick={handleSave} />
```

Комментарии:

- Компонент — обычная функция, имя которой начинается с заглавной буквы
- Пропсы приходят первым аргументом
- JSX возвращается напрямую из функции

### Стрелочные функции

Тот же компонент можно записать как стрелочную функцию:

```jsx
// Стрелочная форма компонента
const Button = ({ label, onClick }) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
};
```

Если JSX короткий, можно опустить `return`:

```jsx
// Короткая форма — сразу возвращаем JSX
const Button = ({ label, onClick }) => (
  <button onClick={onClick}>
    {label}
  </button>
);
```

Выбор между обычной и стрелочной функцией — вопрос стиля, а не функциональности. React в обоих случаях работает одинаково.

### Пропсы и значения по умолчанию

Часто нужно задать значения по умолчанию. Смотрите, я покажу вам, как это сделать прямо в сигнатуре:

```jsx
// Значение по умолчанию для пропса color — "blue"
function Badge({ text, color = "blue" }) {
  return (
    <span style={{ backgroundColor: color }}>
      {text}
    </span>
  );
}

// <Badge text="Новый" /> // цвет будет "blue"
// <Badge text="Ошибка" color="red" /> // цвет будет "red"
```

Такой подход проще, чем использование `defaultProps` для функциональных компонентов.

### Дети компонента (props.children)

Функциональный компонент может принимать вложенное содержимое через `props.children`.

```jsx
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {/* Здесь мы отображаем дочерние элементы */}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Использование
/*
<Card title="Профиль">
  <p>Имя Анна</p>
  <p>Возраст 25</p>
</Card>
*/
```

Здесь вы видите, что компонент может быть «контейнером», а вложенный JSX передается ему автоматически как `children`.

---

## Состояние во функциональных компонентах: useState

### Зачем нужно состояние

Состояние (state) — это данные, которые меняются со временем и влияют на внешний вид компонента. Например:

- значение инпута
- состояние «открыт/закрыт» для модального окна
- текущий номер страницы

В функциональных компонентах состояние управляется хуком `useState`.

### Базовое использование useState

Давайте разберемся на простом счётчике:

```jsx
import { useState } from "react";

function Counter() {
  // Объявляем состояние count со значением по умолчанию 0
  // setCount — функция, которая обновляет состояние
  const [count, setCount] = useState(0);

  // Обработчик клика для увеличения счётчика
  const handleIncrement = () => {
    // Обновляем состояние на единицу
    setCount(count + 1);
  };

  return (
    <div>
      <p>Текущее значение {count}</p>
      <button onClick={handleIncrement}>Увеличить</button>
    </div>
  );
}
```

Ключевой момент: изменение состояния через `setCount` вызывает повторный рендер компонента с новым значением `count`.

### Функциональное обновление состояния

Если новое значение зависит от старого, лучше использовать функциональную форму:

```jsx
const handleIncrement = () => {
  // prevCount — предыдущее значение состояния
  setCount((prevCount) => prevCount + 1);
};
```

Это особенно важно, если внутри одного события вы можете вызвать несколько обновлений или если React объединяет обновления.

### Несколько состояний в одном компоненте

Вы можете вызывать `useState` столько раз, сколько нужно:

```jsx
function Form() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Здесь можно отправить данные на сервер
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)} // Обновляем name
        placeholder="Имя"
      />
      <input
        value={age}
        onChange={(e) => setAge(e.target.value)} // Обновляем age
        placeholder="Возраст"
      />
      <button type="submit" disabled={isSubmitting}>
        Отправить
      </button>
    </form>
  );
}
```

Такое разбиение состояния по отдельным `useState` делает логику проще и читаемее.

---

## Эффекты и жизненный цикл: useEffect

### Что такое эффект

Эффект — это побочное действие, которое:

- взаимодействует с внешним миром (запрос к API, подписка на события, работа с DOM напрямую)
- не может быть выполнено только через чистое «рендерим JSX»

В классовых компонентах вы бы писали это в `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`. В функциональных — используете `useEffect`.

### Базовый пример useEffect

Давайте сделаем простой запрос к API при монтировании компонента:

```jsx
import { useState, useEffect } from "react";

function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Здесь мы выполняем запрос после первого рендера
    fetch("/api/users")
      .then((response) => response.json())
      .then((data) => {
        // Обновляем состояние с результатом запроса
        setUsers(data);
      });
    // Пустой массив зависимостей означает
    // что эффект выполнится только один раз при монтировании
  }, []);

  return (
    <ul>
      {users.map((user) => (
        // Важно указывать уникальный key
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

Эффект запускается после рендера. Обновление состояния `setUsers` вызывает новый рендер, и React снова отрисовывает список.

### Зависимости эффекта

Второй аргумент `useEffect` — массив зависимостей. Он определяет, когда эффект должен выполняться.

- Без второго аргумента — эффект выполняется после каждого рендера
- Пустой массив `[]` — эффект выполняется один раз, при монтировании
- Массив с переменными — эффект выполняется при изменении этих переменных

Пример с зависимостями:

```jsx
function Search({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Эффект зависит от query
    // Он будет выполняться при каждом изменении query
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, [query]);

  // ...
}
```

Здесь я размещаю пример, чтобы вам было проще понять: как только `query` меняется, эффект запускается снова, выполняется новый запрос.

### Очистка эффекта (cleanup)

Если ваш эффект создает подписку или ресурс, его нужно очищать. Для этого из эффекта возвращают функцию очистки.

```jsx
function WindowSizeWatcher() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Обработчик изменения размера окна
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Подписываемся на событие resize
    window.addEventListener("resize", handleResize);

    // Возвращаем функцию очистки
    return () => {
      // Снимаем подписку при размонтировании компонента
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Подписка создается один раз

  return <p>Ширина окна {width}</p>;
}
```

Как видите, этот код выполняет тот же паттерн, что и `componentDidMount` + `componentWillUnmount`, но в одной точке.

---

## Входные данные и вывод: пропсы, события и подъем состояния

### Передача данных через пропсы

Функциональный компонент не должен менять свои пропсы. Он их только читает. Изменяемые данные живут в состоянии «выше» по дереву.

```jsx
function TodoItem({ text, completed }) {
  return (
    <li>
      <span>
        {completed ? "✔" : "○"} {text}
      </span>
    </li>
  );
}

function TodoList() {
  const [items] = useState([
    { id: 1, text: "Купить молоко", completed: false },
    { id: 2, text: "Написать статью", completed: true },
  ]);

  return (
    <ul>
      {items.map((item) => (
        <TodoItem
          key={item.id}
          text={item.text}           // Передаем текст
          completed={item.completed} // Передаем статус
        />
      ))}
    </ul>
  );
}
```

Здесь компонент `TodoItem` чистый: он полностью определяется пропсами.

### Обработка событий и подъем состояния

Чтобы дочерний компонент мог «сообщить» наверх о действии, вы передаете ему колбэк.

```jsx
function TodoItem({ id, text, completed, onToggle }) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(id)} // Вызываем колбэк при изменении
        />
        {text}
      </label>
    </li>
  );
}

function TodoList() {
  const [items, setItems] = useState([
    { id: 1, text: "Купить молоко", completed: false },
    { id: 2, text: "Написать статью", completed: true },
  ]);

  const handleToggle = (id) => {
    // Обновляем список задач по id
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed } // Меняем completed
          : item
      )
    );
  };

  return (
    <ul>
      {items.map((item) => (
        <TodoItem
          key={item.id}
          id={item.id}
          text={item.text}
          completed={item.completed}
          onToggle={handleToggle} // Передаем колбэк
        />
      ))}
    </ul>
  );
}
```

Теперь давайте перейдем к более сложным возможностям функциональных компонентов: контекст и мемоизация.

---

## Контекст и глобальные данные: useContext

### Задача, которую решает контекст

Иногда данные нужны многим компонентам: тема оформления, текущий пользователь, язык интерфейса. Пробрасывать их через все уровни иерархии пропсами неудобно.

Здесь помогает контекст.

```jsx
import { createContext, useContext } from "react";

// Создаем контекст для темы
const ThemeContext = createContext("light");

function ThemedButton() {
  // Получаем текущую тему через useContext
  const theme = useContext(ThemeContext);

  return (
    <button className={`btn-${theme}`}>
      Кнопка в теме {theme}
    </button>
  );
}

function App() {
  return (
    // Оборачиваем в провайдер и задаем значение контекста
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}
```

Теперь вы увидите, как это выглядит в коде: `ThemedButton` не получает пропсы `theme`, но знает про текущую тему через контекст.

---

## Производительность и оптимизация функциональных компонентов

Функциональные компоненты пересоздаются и выполняются при каждом рендере. Обычно этого достаточно и производительность хорошая. Но есть ситуации, когда стоит оптимизировать.

### Мемоизация компонента: React.memo

Если компонент:

- рендерит тяжелую разметку
- получает те же пропсы снова и снова

можно завернуть его в `React.memo`, чтобы избежать лишних рендеров.

```jsx
import React from "react";

// Тяжелый компонент списка
const HeavyList = React.memo(function HeavyList({ items }) {
  console.log("Рендер HeavyList");

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
});

function Parent() {
  const [count, setCount] = useState(0);
  const items = [
    { id: 1, text: "Элемент 1" },
    { id: 2, text: "Элемент 2" },
  ];

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Нажато {count}
      </button>
      {/* HeavyList не будет перерендериваться пока items не изменятся */}
      <HeavyList items={items} />
    </div>
  );
}
```

`React.memo` сравнивает предыдущие и новые пропсы по поверхностному равенству. Если они одинаковы, компонент не рендерится.

### Мемоизация значений: useMemo

Если внутри компонента есть дорогие вычисления, можно кэшировать их результат:

```jsx
import { useMemo } from "react";

function FilteredList({ items, filter }) {
  // Вычисление отфильтрованного списка
  const filteredItems = useMemo(() => {
    // Здесь может быть дорогая операция фильтрации или сортировки
    return items.filter((item) =>
      item.text.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]); // Пересчет только при изменении items или filter

  return (
    <ul>
      {filteredItems.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
}
```

Обратите внимание, как этот фрагмент кода решает задачу: `useMemo` защищает вас от ненужных повторных вычислений при каждом рендере.

### Мемоизация колбэков: useCallback

Если вы передаете функции как пропсы в дочерние компоненты, и они зависят от состояния, при каждом рендере создаются новые функции. Это может «ломать» оптимизацию `React.memo`.

Решение — `useCallback`.

```jsx
import { useCallback } from "react";

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    // Используем функциональное обновление
    setCount((prev) => prev + 1);
  }, []); // Зависимостей нет, функция стабильна

  return (
    <div>
      <Child onClick={handleClick} />
      <p>Счетчик {count}</p>
    </div>
  );
}

const Child = React.memo(function Child({ onClick }) {
  console.log("Рендер Child");
  return <button onClick={onClick}>Увеличить</button>;
});
```

Теперь `Child` не будет перерендериваться при каждом изменении состояния `Parent`, потому что ссылка на `handleClick` остается прежней.

---

## Паттерны построения функциональных компонентов

### Разделение на «умные» и «глупые» компоненты

Часто удобно разделить компоненты на:

- контейнеры (умные) — работают с данными, API, состоянием
- презентационные (глупые) — отвечают только за отображение

Пример:

```jsx
// Презентационный компонент
function UserView({ user }) {
  if (!user) {
    return <p>Пользователь не найден</p>;
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email {user.email}</p>
    </div>
  );
}

// Контейнерный компонент
function UserContainer({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Загружаем данные пользователя по id
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setUser);
  }, [userId]);

  return <UserView user={user} />;
}
```

Так вы отделяете логику работы с данными от их отображения.

### Контролируемые и неконтролируемые компоненты форм

Функциональные компоненты удобно использовать для контролируемых форм.

```jsx
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    // Передаем значения наверх
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email} // Значение берется из состояния
        onChange={(e) => setEmail(e.target.value)} // Обновляем состояние
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

Такой подход позволяет всегда понимать, какие значения сейчас в инпутах, и легко валидировать данные.

### Составление компонентов как конструктор

Одна из сильных сторон функциональных компонентов — их легко комбинировать. Давайте посмотрим, что происходит в следующем примере.

```jsx
function Layout({ header, sidebar, content, footer }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{content}</main>
      <footer>{footer}</footer>
    </div>
  );
}

function App() {
  return (
    <Layout
      header={<h1>Заголовок</h1>}
      sidebar={<p>Боковое меню</p>}
      content={<p>Основной контент</p>}
      footer={<small>Подвал</small>}
    />
  );
}
```

Здесь вы видите, как компоненты передаются друг другу, образуя более сложные структуры, но каждый из них остается простым и понятным.

---

## Типизация функциональных компонентов (кратко)

### С TypeScript

Функциональные компоненты хорошо сочетаются с TypeScript. Давайте разберемся на примере.

```tsx
// Описываем интерфейс пропсов
interface ButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void; // Функция без аргументов, ничего не возвращает
}

// Функциональный компонент с типизацией пропсов
const Button: React.FC<ButtonProps> = ({ label, disabled, onClick }) => {
  return (
    <button disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
};
```

Комментарии:

- `React.FC` (или `React.FunctionComponent`) помогает типизировать `children`, но сегодня все чаще используют просто типизацию пропсов без `React.FC`
- Важно описывать типы пропсов, особенно для переиспользуемых компонентов

---

## Типичные ошибки при работе с функциональными компонентами

### Вызов хуков в условиях или циклах

Хуки (`useState`, `useEffect` и др.) должны вызываться:

- только на верхнем уровне тела компонента
- в одном и том же порядке при каждом рендере
- не внутри условий, циклов и вложенных функций

Плохой пример:

```jsx
function BadComponent({ enabled }) {
  if (enabled) {
    // Так делать нельзя — хук вызывается условно
    const [value, setValue] = useState(0);
    // ...
  }
  return null;
}
```

Правильный подход — вызывать хук всегда, а логику внутри строить по условию.

```jsx
function GoodComponent({ enabled }) {
  const [value, setValue] = useState(0);

  if (!enabled) {
    return null;
  }

  return <p>Значение {value}</p>;
}
```

### Мутация состояния напрямую

Нельзя изменять состояние напрямую, нужно создавать новые объекты или массивы.

Плохо:

```jsx
// Плохо — мы мутируем массив напрямую
const handleAdd = () => {
  items.push(newItem);
  setItems(items); // React может не заметить изменения
};
```

Хорошо:

```jsx
// Хорошо — создаем новый массив
const handleAdd = () => {
  setItems((prevItems) => [...prevItems, newItem]);
};
```

### Забытый массив зависимостей в useEffect

Если вы не укажете зависимости, эффект будет выполняться после каждого рендера, что может привести к бесконечным циклам или лишним запросам.

Плохо:

```jsx
useEffect(() => {
  fetchData(); // Вызывается после каждого рендера
});           // Нет массива зависимостей
```

Лучше явно указывать зависимости:

```jsx
useEffect(() => {
  fetchData();
}, []); // Вызов только при монтировании
```

---

Функциональные компоненты — это современный, гибкий и выразительный способ построения интерфейсов в React. Они:

- упрощают код за счет отсутствия `this` и громоздких классовых конструкций
- позволяют использовать хуки для состояния, эффектов, контекста и оптимизации
- отлично сочетаются с композициями и паттернами разделения ответственности

Если вы строите новые интерфейсы на React, логично опираться именно на функциональные компоненты и хуки, а к классовым обращаться только там, где это требуется старым кодом.

---

## Частозадаваемые технические вопросы

### 1. Как передать ref во функциональный компонент

Стандартно функциональный компонент не принимает `ref` как проп. Нужно использовать `forwardRef`.

```jsx
import { forwardRef, useRef, useImperativeHandle } from "react";

const Input = forwardRef((props, ref) => {
  const innerRef = useRef(null);

  // Пробрасываем наружу только нужные методы
  useImperativeHandle(ref, () => ({
    focus() {
      innerRef.current?.focus();
    },
  }));

  return <input ref={innerRef} {...props} />;
});

function Form() {
  const inputRef = useRef(null);

  const handleClick = () => {
    // Вызываем метод focus компонента Input
    inputRef.current?.focus();
  };

  return (
    <>
      <Input ref={inputRef} />
      <button onClick={handleClick}>Фокус</button>
    </>
  );
}
```

### 2. Как мемоизировать список с обработчиками, чтобы не было лишних рендеров

Комбинируйте `React.memo`, `useMemo` и `useCallback`.

```jsx
const Item = React.memo(function Item({ item, onClick }) {
  // ...
});

function List({ items }) {
  const handleClick = useCallback((id) => {
    // обработка клика
  }, []);

  const preparedItems = useMemo(
    () =>
      items.map((item) => (
        <Item
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      )),
    [items, handleClick]
  );

  return <ul>{preparedItems}</ul>;
}
```

### 3. Как вызывать асинхронную функцию внутри useEffect корректно

Нельзя делать `useEffect(async () => { ... })`. Вместо этого создайте функцию внутри эффекта и вызовите ее.

```jsx
useEffect(() => {
  let cancelled = false;

  async function loadData() {
    const res = await fetch("/api/data");
    const data = await res.json();
    if (!cancelled) {
      setData(data);
    }
  }

  loadData();

  return () => {
    cancelled = true;
  };
}, []);
```

### 4. Как реализовать shouldComponentUpdate во функциональном компоненте

Аналог — `React.memo` с кастомной функцией сравнения пропсов.

```jsx
const MyComponent = React.memo(
  function MyComponent(props) {
    // ...
  },
  (prevProps, nextProps) => {
    // Возвращаем true, если рендер НЕ нужен
    return prevProps.value === nextProps.value;
  }
);
```

### 5. Как ограничить число рендеров при частом обновлении состояния

Используйте:

- функциональные обновления (`setState(prev => ...)`)
- объединение нескольких значений в один `useReducer`
- дебаунс/троттлинг для событий

```jsx
// Пример с useReducer
function reducer(state, action) {
  switch (action.type) {
    case "changeName":
      return { ...state, name: action.payload };
    case "changeAge":
      return { ...state, age: action.payload };
    default:
      return state;
  }
}
```