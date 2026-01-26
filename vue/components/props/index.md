---
metaTitle: Props компонента в React как правильно использовать props для передачи данных
metaDescription: Разбор props в React - зачем они нужны как работают и как правильно использовать их для передачи данных между компонентами
author: Олег Марков
title: Props компонента в React - полный разбор с примерами
preview: Пошагово разбираем props в React - от базовых примеров до продвинутых техник типизации оптимизации и организации структуры компонентов
---

## Введение

В экосистеме React именно props делают компоненты по‑настоящему переиспользуемыми и управляемыми. Через props вы передаёте в компонент всё, что отличает один его экземпляр от другого: данные, обработчики событий, настройки отображения.

Смотрите, я покажу вам, как это выглядит на самом базовом уровне:

```jsx
// Родительский компонент
function App() {
  return (
    <UserCard
      name="Алексей"          // передаём строку как prop
      age={30}                // передаём число как prop
      isOnline={true}         // передаём булево значение
    />
  );
}

// Дочерний компонент
function UserCard(props) {
  // выводим значения, полученные через props
  return (
    <div>
      <h2>{props.name}</h2>   {/* имя пользователя */}
      <p>Возраст: {props.age}</p>
      <p>Онлайн: {props.isOnline ? "да" : "нет"}</p>
    </div>
  );
}
```

В этой статье вы увидите, как работать с props шаг за шагом: от основ до продвинутых приёмов — деструктуризация, типизация, передача компонентов через props, обработка значений по умолчанию и оптимизация производительности.

---

## Что такое props и зачем они нужны

### Определение props

Props (сокращение от *properties*) — это объект, который React автоматически передаёт в компонент при его вызове. В этом объекте содержатся все "параметры" компонента — те же самые, которые вы указываете как атрибуты JSX.

Можно провести аналогию с аргументами функции:

```jsx
// Обычная JS-функция
function sum(a, b) {
  return a + b;
}

// Компонент как функция
function Greeting(props) {
  return <h1>Привет, {props.name}</h1>;
}
```

Так же как `a` и `b` задают поведение `sum`, props задают поведение компонента `Greeting`.

### Однонаправленный поток данных

Ключевая идея React — однонаправленный поток данных:

- данные идут **сверху вниз**: от родителя к ребёнку;
- ребёнок **не изменяет** полученные props, он только использует их для отображения и внутренних вычислений;
- если родитель передаёт новые props, React повторно рендерит дочерний компонент с новыми значениями.

Давайте разберёмся на примере:

```jsx
function Parent() {
  const [count, setCount] = useState(0); // состояние родителя

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Увеличить
      </button>

      {/* передаём текущее значение счётчика в дочерний компонент */}
      <ChildCounter value={count} />
    </div>
  );
}

function ChildCounter(props) {
  // компонент только читает props.value и показывает его
  return <p>Текущее значение: {props.value}</p>;
}
```

Как видите, состояние (`count`) живёт в родителе, а ребёнок просто получает его значение через props.

---

## Синтаксис и базовое использование props

### Передача props в JSX

Передача props по сути — это передача атрибутов в JSX:

```jsx
<UserCard
  name="Ирина"
  age={25}
  isAdmin={false}
/>
```

Важные моменты:

- строковые значения можно писать в кавычках;
- любые нестроковые значения (числа, булевы, объекты, функции) — в фигурных скобках;
- имена props чувствительны к регистру (`userName` и `username` — разные props).

Давайте посмотрим, как эти props попадают в компонент:

```jsx
function UserCard(props) {
  // props — обычный объект JavaScript
  console.log(props);
  // Пример вывода:
  // {
  //   name: "Ирина",
  //   age: 25,
  //   isAdmin: false
  // }

  return (
    <div>
      <h2>{props.name}</h2>
      <p>Возраст: {props.age}</p>
      {props.isAdmin && <span>Администратор</span>}
    </div>
  );
}
```

### Деструктуризация props

Чтобы каждый раз не писать `props.name`, `props.age`, удобно использовать деструктуризацию аргумента функции:

```jsx
function UserCard({ name, age, isAdmin }) {
  // Теперь можно сразу использовать name, age, isAdmin
  return (
    <div>
      <h2>{name}</h2>
      <p>Возраст: {age}</p>
      {isAdmin && <span>Администратор</span>}
    </div>
  );
}
```

Смотрите, я покажу вам ещё один вариант — деструктуризация прямо в теле:

```jsx
function UserCard(props) {
  const { name, age, isAdmin } = props; // деструктуризация внутри

  return (
    <div>
      <h2>{name}</h2>
      <p>Возраст: {age}</p>
      {isAdmin && <span>Администратор</span>}
    </div>
  );
}
```

Работают оба подхода, разница — только в стиле.

---

## Типы значений в props

### Примитивные типы

Вы можете передавать строки, числа, булевы значения:

```jsx
<ProductCard
  title="Ноутбук"
  price={79999}     // число
  inStock={true}    // булево
/>
```

Внутри компонента вы читаете их как обычные значения:

```jsx
function ProductCard({ title, price, inStock }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>Цена: {price} ₽</p>
      <p>{inStock ? "В наличии" : "Нет в наличии"}</p>
    </div>
  );
}
```

### Объекты и массивы

Очень часто через props передают объекты и массивы:

```jsx
function App() {
  const user = { name: "Ольга", age: 28 };

  const tags = ["frontend", "react", "js"];

  return (
    <UserProfile user={user} tags={tags} />
  );
}

function UserProfile({ user, tags }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Возраст: {user.age}</p>

      <ul>
        {tags.map((tag) => (
          <li key={tag}>{tag}</li> // выводим список тегов
        ))}
      </ul>
    </div>
  );
}
```

Важно понимать, что если вы передаёте новые объекты/массивы при каждом рендере, это влияет на сравнение props и может приводить к лишним перерисовкам. К этому мы ещё вернёмся в части про оптимизацию.

### Передача функций через props

Передача функций — один из ключевых приёмов для связи компонентов "снизу вверх". То есть ребёнок не меняет данные напрямую, а вызывает проп‑функцию, которая живёт в родителе.

```jsx
function App() {
  const [value, setValue] = useState("");

  // обработчик, который будет передан в дочерний компонент
  const handleChange = (newValue) => {
    setValue(newValue); // обновляем состояние родителя
  };

  return (
    <div>
      <Input value={value} onChangeValue={handleChange} />
      <p>Вы ввели: {value}</p>
    </div>
  );
}

function Input({ value, onChangeValue }) {
  const handleInputChange = (event) => {
    // вызываем функцию, переданную через props
    onChangeValue(event.target.value);
  };

  return (
    <input
      value={value}               // контролируемое значение
      onChange={handleInputChange} // обработка ввода
    />
  );
}
```

Здесь я размещаю пример, чтобы вам было проще понять: ребёнок (`Input`) ничего не знает о состоянии родителя, он просто вызывает `onChangeValue` с новым значением.

---

## Props и неизменяемость

### Почему нельзя изменять props

React исходит из предположения, что props **неизменяемы**. Компонент не должен менять объект props и его поля. Это важно для предсказуемости и оптимизации.

Плохой пример:

```jsx
function BadCounter({ count }) {
  // ПЛОХО - изменяем prop напрямую
  const increment = () => {
    // это не изменит состояние родителя и нарушает концепцию
    count = count + 1;
  };

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

Обратите внимание: изменение `count` внутри компонента никак не повлияет на родителя, который этот `count` передал. В лучшем случае ничего не произойдёт, в худшем — вы получите запутанные баги.

Правильный подход — запросить у родителя функцию, которая изменит значение в состоянии родителя:

```jsx
function GoodCounter({ count, onIncrement }) {
  // здесь мы просто вызываем onIncrement
  return (
    <div>
      <p>{count}</p>
      <button onClick={onIncrement}>+</button>
    </div>
  );
}

function Parent() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => setCount(count + 1);

  return (
    <GoodCounter count={count} onIncrement={handleIncrement} />
  );
}
```

Здесь вы видите, что все изменения состояния происходят в родителе, а дочерний компонент остаётся "чистым" и предсказуемым.

---

## Значения по умолчанию и обработка отсутствующих props

### Значения по умолчанию через деструктуризацию

Часто бывает, что prop может быть не передан. Тогда удобно задать значение по умолчанию прямо при деструктуризации:

```jsx
function Button({ label = "Кнопка", color = "blue" }) {
  // если родитель не передал label или color,
  // будут использованы значения по умолчанию
  const style = {
    backgroundColor: color,  // цвет фона берём из props
    color: "white",
  };

  return <button style={style}>{label}</button>;
}
```

Теперь давайте посмотрим, как этот компонент можно использовать:

```jsx
function App() {
  return (
    <div>
      <Button />                          {/* label и color по умолчанию */}
      <Button label="Сохранить" />        {/* color по умолчанию */}
      <Button color="green" />            {/* label по умолчанию */}
      <Button label="Удалить" color="red" />
    </div>
  );
}
```

### Проверка на наличие props

Иногда нужно поведение "если проп не передали — ничего не рендерить":

```jsx
function OptionalTitle({ title }) {
  // если title не задан, возвращаем null
  if (!title) {
    return null; // компонент ничего не отрисует
  }

  return <h2>{title}</h2>;
}
```

Такой приём помогает делать компоненты более гибкими и адаптивными.

---

## Дети как props – `props.children`

### Что такое `props.children`

Любой JSX, который вы помещаете **между** открывающим и закрывающим тегом компонента, попадает в специальный prop `children`.

Давайте разберёмся на примере:

```jsx
function App() {
  return (
    <Layout>
      {/* Всё внутри Layout будет в props.children */}
      <h1>Главная страница</h1>
      <p>Добро пожаловать в приложение</p>
    </Layout>
  );
}

function Layout({ children }) {
  // children может быть одним элементом, массивом или даже строкой
  return (
    <div className="layout">
      <header>Заголовок сайта</header>
      <main>{children}</main>     {/* сюда вставляется содержимое */}
      <footer>Подвал сайта</footer>
    </div>
  );
}
```

Как видите, этот подход позволяет создавать "обёртки" и "шаблоны" без жёсткого привязывания к конкретному содержимому.

### Типы значений в `children`

`children` может быть:

- единичным React-элементом;
- массивом элементов;
- текстом (строкой или числом);
- `null` или `undefined`.

Поэтому при сложной логике с `children` иногда полезно использовать утилиту `React.Children`, но в большинстве случаев можно работать с `children` как есть.

---

## Передача компонентов и JSX через props

### Render props – функция как проп

Иногда вы хотите дать родителю возможность управлять тем, *как* компонент что‑то отрисует. Один из подходов — передать функцию, которая возвращает JSX. Такой приём часто называют *render props*.

```jsx
function List({ items, renderItem }) {
  return (
    <ul>
      {items.map((item) => (
        // вызываем функцию-рендер для каждого элемента
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

function App() {
  const users = [
    { id: 1, name: "Иван" },
    { id: 2, name: "Мария" },
  ];

  return (
    <List
      items={users}
      renderItem={(user) => (
        // здесь мы сами определяем, как отрисовывать пользователя
        <span>{user.name}</span>
      )}
    />
  );
}
```

Покажу вам, как это реализовано на практике: компонент `List` ничего не знает о структуре элемента, он только организует список. Всё, что связано с отображением элемента, приходит через `renderItem`.

### Передача компонентов напрямую

Другой вариант — передавать сам компонент как prop:

```jsx
function Card({ title, ContentComponent }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {/* отрисовываем переданный компонент */}
      <ContentComponent />
    </div>
  );
}

function Info() {
  return <p>Это информационный блок</p>;
}

function App() {
  return (
    <Card title="Карточка" ContentComponent={Info} />
  );
}
```

Можно также передавать компонент и его props вместе:

```jsx
function Card({ title, Content, contentProps }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {/* передаём в Content дополнительные props */}
      <Content {...contentProps} />
    </div>
  );
}

function Info({ text }) {
  return <p>{text}</p>;
}

function App() {
  return (
    <Card
      title="Карточка"
      Content={Info}
      contentProps={{ text: "Текст внутри карточки" }}
    />
  );
}
```

---

## Распаковка props оператором spread (`...props`)

### Передача всех props дальше

Иногда вам нужно просто "пробросить" все пришедшие props в другой компонент или HTML‑элемент. Для этого удобно использовать оператор spread `...`.

Давайте посмотрим, что происходит в этом примере:

```jsx
function CustomInput(props) {
  // забираем только label, а остальные props пробрасываем в input
  const { label, ...inputProps } = props;

  return (
    <label>
      {label}
      <input {...inputProps} /> 
      {/* сюда попадут все остальные props, например type, value, onChange */}
    </label>
  );
}

function App() {
  return (
    <CustomInput
      label="Имя"
      type="text"                 // уйдёт в inputProps
      placeholder="Введите имя"  // уйдёт в inputProps
      onChange={() => {}}        // уйдёт в inputProps
    />
  );
}
```

Обратите внимание, как этот фрагмент кода решает задачу: компонент `CustomInput` добавляет свою оболочку (`label`), но не ограничивает набор атрибутов, которые можно передать в `input`.

### Осторожность с `...props`

Используя `...props`, важно:

- следить, чтобы вы случайно не передали лишние props в DOM‑элемент (React выдаст предупреждения, если атрибут неизвестен для HTML);
- помнить, что порядок важен — атрибуты, указанные *после* `...props`, переопределят значения из `props`.

Пример с переопределением:

```jsx
function PrimaryButton(props) {
  return (
    <button
      {...props}            // сначала все props от родителя
      className="primary"   // потом фиксированный класс
    />
  );
}
```

Если родитель передаст `className`, он будет проигнорирован, потому что последний `className="primary"` перезапишет значение. Если нужно наоборот — пишите `className` до `...props`.

---

## Проверка и типизация props

### `PropTypes` в JavaScript

Если вы пишете на "чистом" JavaScript, React предлагает механизм `PropTypes` для проверки типов в рантайме (во время выполнения). Это не замена TypeScript, но помогает ловить ошибки.

```jsx
import PropTypes from "prop-types";

function UserCard({ name, age, isAdmin }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Возраст: {age}</p>
      {isAdmin && <span>Администратор</span>}
    </div>
  );
}

// Описание ожидаемых типов props
UserCard.propTypes = {
  name: PropTypes.string.isRequired, // обязательно, строка
  age: PropTypes.number,             // необязательно, число
  isAdmin: PropTypes.bool,           // необязательно, булево
};
```

Если вы передадите, например, число в `name`, в консоли разработки появится предупреждение.

Можно описывать сложные структуры:

```jsx
UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,    // обязательное поле
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }).isRequired,                        // сам user обязателен
};
```

### Значения по умолчанию через `defaultProps` (классический подход)

Для классовых компонентов и некоторых старых примеров вы можете встретить `defaultProps`:

```jsx
function Button({ label, color }) {
  const style = { backgroundColor: color, color: "white" };
  return <button style={style}>{label}</button>;
}

Button.defaultProps = {
  label: "Кнопка по умолчанию",
  color: "gray",
};
```

Сейчас чаще используют значения по умолчанию через деструктуризацию, но `defaultProps` всё ещё можно встретить в существующем коде.

### Типизация props в TypeScript

Если вы используете TypeScript, типизация props становится гораздо удобнее и точнее.

Давайте посмотрим, как это выглядит:

```tsx
type UserCardProps = {
  name: string;       // обязательная строка
  age?: number;       // необязательное число
  isAdmin?: boolean;  // необязательное булево
};

function UserCard({ name, age, isAdmin = false }: UserCardProps) {
  // isAdmin по умолчанию false
  return (
    <div>
      <h2>{name}</h2>
      {age !== undefined && <p>Возраст: {age}</p>}
      {isAdmin && <span>Администратор</span>}
    </div>
  );
}
```

Преимущество TypeScript в том, что IDE сразу подсветит вам:

- отсутствие обязательных props;
- передачу лишних или неверно типизированных props;
- неправильную работу с потенциально `undefined` значениями.

---

## Презентационные и контейнерные компоненты и роль props

### Презентационные компоненты

Презентационный компонент отвечает только за отображение данных, а сами данные и логика приходят через props:

```jsx
function UserView({ name, email, onDelete }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
      <button onClick={onDelete}>Удалить</button>
    </div>
  );
}
```

Такой компонент легко переиспользовать, тестировать и менять, не трогая бизнес‑логику.

### Контейнерные компоненты

Контейнерный компонент управляет данными (запросы, состояние, обработчики) и передаёт их в презентационный через props:

```jsx
function UserContainer({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Здесь мы делаем запрос за данными
    // (пример условный, без реального запроса)
    setUser({ id: userId, name: "Антон", email: "test@example.com" });
  }, [userId]);

  const handleDelete = () => {
    // логика удаления пользователя
    console.log("Удаляем пользователя", userId);
  };

  if (!user) return <p>Загрузка...</p>;

  return (
    <UserView
      name={user.name}        // передаём данные
      email={user.email}
      onDelete={handleDelete} // передаём обработчик
    />
  );
}
```

Здесь ясно видно, как props становятся "мостом" между слоями: контейнер решает, что и как передать, а презентационный компонент только отображает.

---

## Оптимизация: как props влияют на перерисовку компонентов

### Когда компонент перерисовывается

Функциональный компонент в React с `React.memo` или без него будет перерисован, когда:

- изменилось его состояние (`useState`, `useReducer`);
- изменились его props (по ссылке или значению);
- перерисовался родитель (и компонент не обёрнут в `React.memo`).

При этом сравнение props по умолчанию — поверхностное (shallow). Для примитивов сравнивается значение, для объектов/массивов — ссылка.

### `React.memo` и props

`React.memo` помогает избежать лишних перерисовок, если props не изменились:

```jsx
const UserCard = React.memo(function UserCard({ name, age }) {
  console.log("Рендер UserCard");
  return (
    <div>
      <h2>{name}</h2>
      <p>{age}</p>
    </div>
  );
});
```

Теперь давайте разберёмся, что будет в следующей ситуации:

```jsx
function App() {
  const [count, setCount] = useState(0);

  // name и age не меняются при клике
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Нажато: {count}
      </button>
      <UserCard name="Иван" age={30} />
    </div>
  );
}
```

Благодаря `React.memo` `UserCard` не будет перерисовываться при каждом изменении `count`, так как его props остаются теми же.

### Внимание к объектам и функциям в props

Если вы передаёте каждый раз **новый объект** или **новую функцию**, даже с теми же значениями, компонент с `React.memo` всё равно перерисуется, потому что ссылка на объект изменилась.

Плохой пример:

```jsx
const List = React.memo(function List({ items, renderItem }) {
  // ...
});

function App() {
  const items = [1, 2, 3];

  return (
    <List
      items={items}
      renderItem={(item) => <span>{item}</span>} // новая функция на каждый рендер
    />
  );
}
```

С точки зрения React `renderItem` каждое обновление — новая функция (новая ссылка), поэтому `List` будет перерисован.

Решение — мемоизировать функции и объекты с помощью `useCallback` и `useMemo`:

```jsx
function App() {
  const items = [1, 2, 3];

  const renderItem = useCallback(
    (item) => <span>{item}</span>, // функция создаётся один раз
    []                             // не зависит от внешних значений
  );

  return <List items={items} renderItem={renderItem} />;
}
```

---

## Типичные ошибки при работе с props

### Опечатки в именах props

Одна из самых частых ошибок — передали `userName`, а в дочернем читаем `username`:

```jsx
// Родитель
<UserCard userName="Иван" />

// Дочерний
function UserCard({ username }) {
  return <h2>{username}</h2>; // undefined
}
```

Такие вещи хорошо ловят TypeScript и `PropTypes`. Без них стоит быть особенно внимательным.

### Путаница между props и state

Иногда разработчики пытаются копировать props в state без необходимости:

```jsx
function BadUserCard({ name }) {
  const [userName, setUserName] = useState(name); // дублирование

  // теперь при изменении name у родителя userName здесь не обновится
  return <h2>{userName}</h2>;
}
```

Если вам не нужно *отдельно* редактировать значение внутри компонента, лучше напрямую использовать props:

```jsx
function GoodUserCard({ name }) {
  return <h2>{name}</h2>;
}
```

Копировать props в state стоит только тогда, когда вы действительно хотите "отвязать" внутреннее значение от внешнего и управлять им автономно.

### Забытый `key` при рендеринге списков

При передаче массивов данных через props и их отображении важно указывать `key`:

```jsx
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        // key нужен для корректного обновления списка
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

`key` — не совсем prop компонента, но это важный атрибут для корректной работы React с коллекциями.

---

## Заключение

Props — это механизм, который связывает компоненты между собой и делает их гибкими. Через props вы:

- передаёте данные и настройки отображения;
- пробрасываете обработчики событий и функции;
- управляете структурой интерфейса (через `children`, render props, передачу компонентов);
- отделяете логику (контейнеры) от представления (презентационные компоненты);
- оптимизируете перерисовки, опираясь на неизменяемость и поверхностное сравнение props.

Если вы понимаете, как устроены props, вам будет проще проектировать архитектуру React‑приложения: где хранить состояние, какие данные передавать вниз по дереву, как строить переиспользуемые компоненты и как избегать избыточной связанности.

---

## Частозадаваемые технические вопросы по теме props

### Как передать несколько параметров в обработчик события через props

Можно обернуть вызов обработчика в анонимную функцию:

```jsx
function Parent() {
  const handleClick = (id, value) => {
    // здесь логика обработки клика
  };

  return (
    <Child
      onItemClick={(id) => handleClick(id, "extra")} // передаём доп. аргумент
    />
  );
}

function Child({ onItemClick }) {
  const handleItemClick = (id) => {
    onItemClick(id); // вызываем функцию из props
  };

  // далее при клике по элементу вы вызываете handleItemClick с нужным id
}
```

Важно не вызывать обработчик напрямую в JSX (`onClick={handleClick(id)}`), а всегда передавать функцию.

### Как передать проп во вложенный компонент, не прокидывая его через все уровни

Это типичная проблема "prop drilling". Базовый способ решения — контекст (`React.createContext` и `useContext`). Вы создаёте контекст, помещаете значение в `Provider` выше по дереву и используете его в любом дочернем компоненте, минуя промежуточные уровни.

### Как задать обязательные и необязательные props в TypeScript

Вы описываете объект типа, помечая необязательные поля знаком `?`:

```ts
type ButtonProps = {
  label: string;     // обязательный
  disabled?: boolean; // необязательный
};
```

В компоненте используете этот тип, а при использовании компонента TypeScript подскажет, какие props нужно передать обязательно.

### Как объединить несколько наборов props в один

Можно использовать оператор spread для объединения объектов:

```jsx
const baseProps = { disabled: false, type: "button" };
const extraProps = { type: "submit" };

const props = { ...baseProps, ...extraProps }; // type будет "submit"
```

При передаче в компонент или DOM‑элемент используйте `...props`. Помните, что порядок важен — последние значения переопределяют предыдущие.

### Как пробросить все props в дочерний компонент и при этом добавить свои

Используйте комбинацию деструктуризации и `...rest`:

```jsx
function Wrapper({ className, ...restProps }) {
  return (
    <Child
      {...restProps}             // все остальные props пробрасываем
      className={`wrapper ${className || ""}`} // добавляем свой класс
    />
  );
}
```

Так вы контролируете, какие props обогащаете или изменяете, а какие просто передаёте дальше.