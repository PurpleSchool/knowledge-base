---
metaTitle: Подключение Bootstrap к React-приложению
metaDescription: Полное руководство по подключению Bootstrap к React-приложению - пошаговая интеграция, примеры кода, работа с компонентами и настройкой темизации
author: Олег Марков
title: Подключение Bootstrap к React-приложению
preview: Узнайте все способы интеграции Bootstrap в React-приложение на практике - через CDN, npm, React-Bootstrap и кастомизацию стилей
---

## Введение

Интерфейсы современных веб-приложений требуют не только функциональности, но и эстетики — продуманного дизайна, удобной адаптивности на разных устройствах, единообразия стиля. Вы наверняка сталкивались с задачей быстро оформить прототип или рабочую версию сайта с минимальными трудозатратами. Библиотека Bootstrap уже много лет остается одним из лидеров среди CSS-фреймворков для таких задач.

Однако когда вы работаете с React, встают дополнительные вопросы: как правильно интегрировать Bootstrap в проект на React, какие есть варианты, и что выбрать под ваш стек и задачи? Статья поможет вам разобраться — вы узнаете о разных способах подключения Bootstrap к React, получите пошаговые инструкции и примеры кода, поймете, как на практике использовать готовые компоненты и темы.

## Разные способы подключения Bootstrap к React-приложению

Существует несколько подходов интеграции Bootstrap в React-проекты. Каждый из них подходит под различные требования — от простоты внедрения до максимальной гибкости и совместимости c React-подходом. Давайте рассмотрим каждый вариант на практике.

### Использование CDN (быстрый старт)

Если ваша цель — протестировать интерфейс или обновить внешний вид маленького приложения без глубокого внедрения в сборку фронтенда, самый быстрый путь — подключить Bootstrap через CDN.

#### Как это делается

Добавьте Bootstrap CDN ссылку в файл public/index.html вашего React-приложения в раздел `<head>`:

```html
<!-- Bootstrap CSS CDN -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
```

Если нужны JS-компоненты Bootstrap (например, модальные окна или выпадающие списки), подключите еще и bundle с Popper:

```html
<!-- Bootstrap JS Bundle CDN -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
```

Теперь весь стандартный CSS Bootstrap доступен во всех ваших React-компонентах. Классы из Bootstrap можно сразу использовать, например:

```jsx
// Пример кнопки с Bootstrap классом
<button className="btn btn-primary">Кнопка Bootstrap</button>
```

Bootstrap — это популярный CSS-фреймворк, который предоставляет готовые стили и компоненты для быстрого создания пользовательского интерфейса. Интеграция Bootstrap с React позволяет использовать его преимущества в React-приложениях. Если вы хотите узнать, как подключить Bootstrap к React-приложению и использовать его для стилизации компонентов — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=podklyuchenie-bootstrap-k-react-prilozheniyu). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

#### Особенности этого способа

- Быстро, просто, не требует настроек npm или webpack.
- Нет возможности изменять стандартные стили под ваши нужды.
- JS-компоненты Bootstrap работают вне концепции “React-way”, манипулируют DOM напрямую, что может приводить к конфликтам с виртуальным DOM React.

### Установка через npm (рекомендованный для production)

Для современных React-проектов (особенно если вы хотите контролировать сборку, размер пакета, процедуру обновлений и простую интеграцию со сборщиками) правильнее устанавливать Bootstrap через npm.

#### Установка Bootstrap

Перейдите в корень вашего проекта и выполните команду:

```bash
npm install bootstrap
```

#### Подключение стилей в React

Один из самых простых и удобных способов подключения — прямо в файл src/index.js или src/index.tsx:

```js
// index.js
import 'bootstrap/dist/css/bootstrap.min.css';
// Дальше стандартный React стартовый код
import App from './App';

```

Теперь вы можете использовать любые Bootstrap-классы в своих компонентах — это никак не ломает изоляцию React-компонентов, потому что стили применяются глобально через CSS.

```jsx
<div className="container mt-4">
  <h1 className="display-4 text-center">Мой сайт на React и Bootstrap</h1>
  <button className="btn btn-success">Сделай что-нибудь!</button>
</div>
```

#### Добавление JS компонентов Bootstrap — нюансы

В Bootstrap 5 js-компоненты, например модальные окна, зависят от Popper.js. Но в React-проекте обычно JS-функционал Bootstrap не требуется, потому что библиотеки UI-компонентов для React решают эти задачи декларативно (React-bootstrap, Reactstrap и др). 

Если по каким-то причинам вы все же хотите использовать Bootstrap JS, импортируйте его аналогично:

```js
import 'bootstrap/dist/js/bootstrap.bundle.min';
```

Однако имейте в виду, что такие компоненты не будут «реакт-образными» и лучше использовать специальные библиотеки, об этом далее.

### Использование библиотеки React-Bootstrap

Bootstrap был изначально рассчитан на работу с html-контейнерами и jQuery, что не полностью совместимо с подходом React. Для более тесной интеграции был создан React-Bootstrap — набор полностью переписанных под принцип React компонентов (без jQuery и без манипуляции DOM вручную).

#### Установка React-Bootstrap

Выполните команду:

```bash
npm install react-bootstrap bootstrap
```

> Обратите внимание: пакет react-bootstrap не содержит сам Bootstrap, потому отдельный bootstrap нужен как зависимость для стилей.

#### Использование компонентов

Теперь вы можете импортировать компоненты прямо из библиотеки и использовать их как обычные React-компоненты.

Пример с кнопкой:

```jsx
import Button from 'react-bootstrap/Button';

function MyButton() {
  return (
    <Button variant="primary">Кнопка React-Bootstrap</Button>
  );
}
```

Контейнер и сетка в стиле Bootstrap:

```jsx
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function MyGrid() {
  return (
    <Container>
      <Row>
        <Col md={8}>Левая колонка</Col>
        <Col md={4}>Правая колонка</Col>
      </Row>
    </Container>
  );
}
```

#### Преимущества React-Bootstrap

- Все компоненты сами управляют своим состоянием по “реакт-образному”, никаких сторонних JS-манипуляций.
- Легко добавлять обработчики событий, управлять состоянием, делать композицию компонентов.
- Полная интеграция с вашей логикой React (useState, useEffect), набор свойств компонентов (prop-types).

#### Импорт компонентов точечно

Рекомендуется импортировать не весь пакет целиком, а только нужные компоненты, чтобы оптимизировать размер бандла:

```js
import { Button, Modal } from 'react-bootstrap';
```

Или так:

```js
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
```

### Использование библиотеки Reactstrap

Reactstrap — еще одна популярная библиотека, реализующая компоненты Bootstrap для React. Она ближе к Bootstrap по структуре пропсов, что иногда бывает удобно для “быстрого старта”.

#### Установка Reactstrap

```bash
npm install reactstrap bootstrap
```

#### Применение компонентов

```jsx
import { Button, Alert } from 'reactstrap';

function Example() {
  return (
    <div>
      <Button color="danger">Опасная кнопка</Button>
      <Alert color="info">Инфо-сообщение</Alert>
    </div>
  );
}
```

Философия работы похожа на React-Bootstrap, различия больше внешние. О выборе между этими решениями мы поговорим далее.

### Кастомизация Bootstrap: расширение и изменение темы

Очень часто стандартного набора цветов и размеров Bootstrap недостаточно, и требуется адаптация под фирменный стиль вашего продукта.

#### 1. Переопределение переменных Bootstrap через SASS

Bootstrap изначально написан на SASS, все переменные оформления легко изменить. Для этого потребуется настроить сборку sass-файлов в вашем React-приложении (например, если проект создавался через Create React App, sass поддержка есть из коробки).

##### Шаги:

1. Установите `sass`:

```bash
npm install sass
```

2. В каталоге `src` создайте файл, например, `custom.scss`:

```scss
// Переопределяем переменные до импорта Bootstrap
$primary: #ff6600;
$border-radius: 1rem;

// Импортируем Bootstrap SASS
@import "~bootstrap/scss/bootstrap";
```

> `~` означает импорт из node_modules

3. Импортируйте кастомный scss-файл в index.js:

```js
import "./custom.scss";
```

Теперь все компоненты в вашем приложении будут иметь индивидуальный стиль.

#### 2. Локальное переопределение классов

Если требуется изменить только отдельные элементы, добавьте “свои классы” сверху Bootstrap-классов, например:

```css
/* styles.css */
.btn-primary.custom-btn {
  background: #551a8b;
  border-color: #551a8b;
  font-weight: bold;
}
```

```jsx
<button className="btn btn-primary custom-btn">Авторская кнопка</button>
```

### Стилизация через styled-components и CSS-модули

Если вы используете CSS-модули или styled-components (очень распространено в сложных React проектах), вы можете свободно использовать классы Bootstrap вместе со своими:

```jsx
import styles from './App.module.css';

function App() {
  return (
    <button className={`btn btn-primary ${styles.specialBtn}`}>Кнопка</button>
  )
}
```

Или с styled-components (пример):

```jsx
import styled from 'styled-components';

const CustomButton = styled.button`
  &&& {
    background: #333 !important;
    color: white;
  }
`;

function App() {
  return (
    <CustomButton className="btn btn-primary">Styled+Bootstrap</CustomButton>
  );
}
```

## Какой вариант выбрать — рекомендации

- **CDN** — для прототипов или демо, когда не важна кастомизация и управление размерами пакетов.
- **npm-пакет Bootstrap** — когда нужны только стили, а “реакт-образное” поведение не критично (например, если вы делаете много ручного контроля над логикой компонентов).
- **React-Bootstrap или Reactstrap** — оптимально в большинстве prod-проектов, где важна изоляция логики, простота управления состояниями, гибкость и модульность. Обычно рекомендуют React-Bootstrap как более активно поддерживаемое решение.

## Организация структуры проекта

В больших проектах рекомендуют:

- Подключать стили или ThemeProvider в самом верху дерева, чтобы стили были глобально доступны.
- Компоненты Bootstrap размещать вместе с вашими кастомными в структуре src/components.
- Все SASS/SCSS-файлы держать в отдельной директории, а их импорты прописывать централизованно.
- Использовать точечные импорты для компонентов из библиотек, чтобы не раздувать размер бандла.

## Примеры внедрения Bootstrap-компонентов в React

### Пример. Модальное окно через React-Bootstrap

```jsx
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

function ExampleModal() {
  // Храним состояние открытия окна
  const [show, setShow] = useState(false);

  // Открыть модалку
  const handleShow = () => setShow(true);
  // Закрыть модалку
  const handleClose = () => setShow(false);

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        Открыть модалку
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Заголовок</Modal.Title>
        </Modal.Header>
        <Modal.Body>Содержимое вашего модального окна</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Закрыть
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

Такой способ гарантирует полную интеграцию с виртуальным DOM, не вызывает конфликтов, легко интегрируется с остальной логикой на React.

### Пример. Пользовательская форма с Bootstrap стилями

```jsx
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

function CustomForm() {
  return (
    <Form>
      <Form.Group className="mb-3" controlId="emailField">
        <Form.Label>Электронная почта</Form.Label>
        <Form.Control type="email" placeholder="Введите email" />
      </Form.Group>
      <Form.Group className="mb-3" controlId="passwordField">
        <Form.Label>Пароль</Form.Label>
        <Form.Control type="password" placeholder="Введите пароль" />
      </Form.Group>
      <Button variant="primary" type="submit">
        Войти
      </Button>
    </Form>
  )
}
```

Каждый компонент имеет строгую типизацию свойств, легко подключается к useState для контроля полей.

## Где искать и как работать с официальной документацией

- [Документация Bootstrap](https://getbootstrap.com/)
- [React-Bootstrap](https://react-bootstrap.github.io/)
- [Reactstrap](https://reactstrap.github.io/)

В документациях постоянно появляются новые примеры, варианты темизации, FAQ.

## Заключение

Интеграция Bootstrap с React открывает широкий простор для быстрой и качественной вёрстки без больших затрат ресурсов на разработку пользовательского интерфейса. В зависимости от формата вашего проекта и требований к гибкости выбирайте наиболее подходящий способ подключения — от банального CDN, npm-пакета, до специализированных React-библиотек. Совмещайте преимущества готовых компонентов c возможностью кастомизации, и вы получите современный, адаптивный и красивый UI.

Bootstrap упрощает стилизацию, но для разработки сложных приложений требуется умение управлять состоянием и роутингом. На курсе [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=podklyuchenie-bootstrap-k-react-prilozheniyu) вы получите все необходимые знания для этого. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в основы React уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как использовать Bootstrap-иконки в React-проекте?

Установите пакет bootstrap-icons:

```bash
npm install bootstrap-icons
```

Импортируйте нужную иконку в компонент:

```js
import 'bootstrap-icons/font/bootstrap-icons.css';
```

Далее используйте иконки через класс:

```jsx
<i className="bi bi-alarm"></i>
```

### Как избежать конфликтов классов Bootstrap и собственных стилей?

Лучше всего использовать CSS-модули или styled-components для своих стилей либо назначать уникальные классы вашим элементам, а затем прописывать стили с приоритетом (например, через `!important` либо более специфичные селекторы).

### Как подключить Bootstrap только для части приложения, а не глобально?

Bootstrap — глобальная библиотека, но если вы хотите изолировать стили, используйте React-Bootstrap с минимальным подключением только своих компонентов, или оформите собственный отдельный bundle Bootstrap SCSS и импортируйте только в нужных местах.

### Почему JS комопненты Bootstrap не работают в React? Например, Collapse не анимируется.

JS-компоненты Bootstrap управляют DOM напрямую, что не сочетается с виртуальным DOM React. Используйте вместо них аналоги из React-Bootstrap или Reactstrap, которые реализуют нужное поведение на “реакт-образном” уровне.

### Как уменьшить размер итогового bundle, если я использую Bootstrap?

Импортируйте только используемые компоненты библиотеки и работайте с кастомной сборкой CSS через SASS: включайте только нужные модули (buttons, alerts и т.д.), настроив свой SCSS. Это позволит не тянуть весь Bootstrap в проект.
