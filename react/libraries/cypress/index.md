---
metaTitle: E2E тестирование React с Cypress - полное руководство
metaDescription: Как настроить и использовать Cypress для E2E тестирования React приложений. Команды, мокирование API, CI/CD интеграция
author: Олег Марков
title: E2E тестирование с Cypress
preview: Полное руководство по E2E тестированию React приложений с Cypress. Установка, основные команды, мокирование и запуск в CI/CD
---

## Введение

E2E (end-to-end) тестирование — один из ключевых уровней тестирования современных веб-приложений. Оно позволяет проверить, как приложение работает целиком: от пользовательского интерфейса до API и базы данных. Cypress — один из наиболее популярных инструментов для E2E тестирования, который завоевал признание в React-сообществе благодаря удобному API, встроенному отладчику и быстрой настройке.

В этой статье вы узнаете, что такое E2E тестирование и зачем нужен Cypress, как установить и настроить его в React-проекте, освоите основные команды, научитесь тестировать формы, навигацию и API-вызовы, а также настроите запуск тестов в CI/CD.

## Что такое E2E тестирование и зачем нужен Cypress

### Уровни тестирования

В разработке принято выделять три уровня тестирования:

- **Unit-тесты** — проверяют отдельные функции и компоненты в изоляции.
- **Интеграционные тесты** — проверяют взаимодействие нескольких модулей.
- **E2E-тесты** — проверяют приложение целиком, имитируя реальные действия пользователя в браузере.

E2E-тесты наиболее близки к реальному сценарию использования: они открывают браузер, переходят по страницам, заполняют формы, нажимают кнопки и проверяют результаты. Именно поэтому они дают наибольшую уверенность в том, что приложение работает корректно для конечного пользователя.

### Почему Cypress

Cypress — это инструмент E2E тестирования, разработанный специально для современных веб-приложений. Его отличают:

- **Работа внутри браузера.** В отличие от Selenium, Cypress выполняется непосредственно в контексте браузера, что даёт доступ ко всем DOM-событиям и сетевым запросам без сторонних драйверов.
- **Автоматическое ожидание.** Cypress автоматически ждёт появления элементов, завершения запросов и анимаций — без явных `sleep()` или `waitFor()`.
- **Встроенный отладчик.** Интерактивный режим Cypress Test Runner позволяет просматривать каждый шаг теста в реальном времени с историей снимков DOM.
- **Мокирование сети.** Встроенная команда `cy.intercept()` позволяет перехватывать и подменять HTTP-запросы прямо в тестах.
- **Компонентное тестирование.** Помимо E2E, Cypress поддерживает изолированное тестирование React-компонентов.

## Установка и настройка Cypress в React проекте

### Установка

Для установки Cypress выполните следующую команду в корне вашего React-проекта:

```bash
npm install --save-dev cypress
```

или с использованием yarn:

```bash
yarn add --dev cypress
```

### Первый запуск

После установки запустите Cypress через npx:

```bash
npx cypress open
```

При первом запуске Cypress предложит выбрать тип тестирования: **E2E Testing** или **Component Testing**. Выберите нужный вариант, и Cypress автоматически создаст конфигурационный файл `cypress.config.ts` (или `cypress.config.js`) и базовую структуру директорий.

### Структура проекта

После инициализации в корне проекта появится папка `cypress`:

```
cypress/
├── e2e/           # E2E тесты
├── fixtures/      # Фиктивные данные (JSON-файлы)
├── support/
│   ├── commands.ts  # Кастомные команды
│   └── e2e.ts       # Конфигурация поддержки
cypress.config.ts    # Основной конфиг Cypress
```

### Конфигурационный файл

Пример базовой конфигурации `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // базовый URL вашего приложения
    setupNodeEvents(on, config) {
      // плагины и обработчики событий
    },
  },
});
```

Параметр `baseUrl` позволяет использовать относительные пути в командах `cy.visit()`, например `cy.visit('/login')` вместо полного URL.

### Добавление скриптов в package.json

Для удобства добавьте скрипты в `package.json`:

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run"
  }
}
```

## Основные команды Cypress

### cy.visit()

Команда `cy.visit()` открывает страницу по указанному URL:

```typescript
cy.visit('/');           // корневой маршрут (относительно baseUrl)
cy.visit('/about');      // страница "О нас"
cy.visit('https://example.com'); // абсолютный URL
```

### cy.get()

`cy.get()` — основной способ поиска элементов в DOM. Принимает CSS-селектор:

```typescript
cy.get('button');                   // все кнопки
cy.get('.submit-button');           // элемент по классу
cy.get('#username');                // элемент по ID
cy.get('[data-cy="login-btn"]');    // элемент по data-атрибуту
cy.get('form input[type="email"]'); // вложенный селектор
```

Рекомендуется использовать специальный атрибут `data-cy` (или `data-testid`) для тестирования — это делает тесты независимыми от изменений CSS-классов и структуры DOM.

### cy.contains()

Команда `cy.contains()` ищет элемент по текстовому содержимому:

```typescript
cy.contains('Войти');              // найти элемент с текстом "Войти"
cy.contains('button', 'Войти');   // кнопка с текстом "Войти"
cy.contains(/^Добро пожаловать/); // регулярное выражение
```

### cy.click()

Команда `cy.click()` имитирует клик по элементу:

```typescript
cy.get('[data-cy="submit-btn"]').click();
cy.contains('Войти').click();
cy.get('.menu-item').first().click();
```

### cy.type()

`cy.type()` вводит текст в поле ввода:

```typescript
cy.get('#email').type('user@example.com');
cy.get('#password').type('secret123');

// Специальные символы
cy.get('#search').type('React{enter}'); // нажать Enter
cy.get('#field').type('{selectall}{backspace}'); // выделить всё и удалить
```

Cypress поддерживает специальные клавиши в фигурных скобках: `{enter}`, `{tab}`, `{backspace}`, `{esc}`, `{selectall}` и другие.

### cy.clear()

Очищает содержимое поля ввода:

```typescript
cy.get('#search').clear();
cy.get('#search').clear().type('новый текст');
```

### cy.should()

Команда `cy.should()` используется для утверждений (assertions). Cypress использует синтаксис Chai:

```typescript
cy.get('[data-cy="title"]').should('be.visible');
cy.get('[data-cy="error"]').should('contain', 'Неверный пароль');
cy.get('button').should('be.disabled');
cy.get('[data-cy="count"]').should('have.text', '5');
cy.url().should('include', '/dashboard');
```

### cy.wait()

Хотя Cypress автоматически ждёт большинства событий, иногда нужно явно дождаться запроса или заданного времени:

```typescript
cy.wait('@apiRequest'); // ждать перехваченный запрос (см. cy.intercept)
cy.wait(1000);          // ждать 1 секунду (использовать с осторожностью)
```

## Cypress Component Testing vs E2E Testing

Cypress поддерживает два режима тестирования, которые решают разные задачи.

### E2E Testing

E2E тестирование запускает реальный браузер и тестирует приложение в целом — с реальным сервером, роутингом и API. Тест открывает страницу и взаимодействует с ней так, как это делал бы пользователь:

```typescript
// cypress/e2e/login.cy.ts
describe('Страница входа', () => {
  it('должна позволять авторизоваться', () => {
    cy.visit('/login');
    cy.get('#email').type('admin@example.com');
    cy.get('#password').type('password');
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

**Когда использовать:** для критических пользовательских сценариев (авторизация, оформление заказа, навигация по приложению).

### Component Testing

Component Testing позволяет монтировать React-компоненты в изоляции, без запуска всего приложения. Это быстрее и удобнее для тестирования отдельных компонентов:

```typescript
// cypress/component/Button.cy.tsx
import Button from './Button';

describe('Компонент Button', () => {
  it('вызывает onClick при клике', () => {
    const onClick = cy.stub().as('clickHandler');
    cy.mount(<Button onClick={onClick}>Нажми меня</Button>);
    cy.get('button').click();
    cy.get('@clickHandler').should('have.been.calledOnce');
  });
});
```

**Когда использовать:** для тестирования логики и состояний отдельных компонентов, особенно с разными наборами пропсов.

### Сравнение

| Характеристика | E2E Testing | Component Testing |
|---|---|---|
| Скорость | Медленнее | Быстрее |
| Изоляция | Нет (реальное приложение) | Да |
| Сложность настройки | Требует запущенного сервера | Нет |
| Охват | Весь пользовательский путь | Отдельный компонент |

## Тестирование форм

Формы — один из наиболее распространённых объектов E2E тестирования. Рассмотрим пример тестирования формы регистрации:

```typescript
// cypress/e2e/registration.cy.ts
describe('Форма регистрации', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('должна отображать ошибки при отправке пустой формы', () => {
    cy.get('[data-cy="register-form"]').submit();
    cy.get('[data-cy="email-error"]').should('contain', 'Введите email');
    cy.get('[data-cy="password-error"]').should('contain', 'Введите пароль');
  });

  it('должна успешно зарегистрировать пользователя', () => {
    cy.get('#name').type('Иван Петров');
    cy.get('#email').type('ivan@example.com');
    cy.get('#password').type('SecurePass123');
    cy.get('#confirm-password').type('SecurePass123');
    cy.get('[data-cy="submit-btn"]').click();

    // Проверяем редирект после успешной регистрации
    cy.url().should('include', '/welcome');
    cy.contains('Добро пожаловать, Иван!').should('be.visible');
  });

  it('должна блокировать кнопку отправки при несовпадении паролей', () => {
    cy.get('#password').type('password1');
    cy.get('#confirm-password').type('password2');
    cy.get('[data-cy="submit-btn"]').should('be.disabled');
  });
});
```

### Работа с выпадающими списками и чекбоксами

```typescript
// Выбор из <select>
cy.get('select[name="country"]').select('Russia');

// Чекбокс
cy.get('[data-cy="agree-checkbox"]').check();
cy.get('[data-cy="agree-checkbox"]').should('be.checked');

// Radio button
cy.get('[data-cy="role-admin"]').check();
```

## Тестирование навигации

Cypress позволяет проверять маршрутизацию React Router или других роутеров:

```typescript
// cypress/e2e/navigation.cy.ts
describe('Навигация приложения', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('должна переходить на страницу "О нас" по клику на ссылку', () => {
    cy.get('[data-cy="nav-about"]').click();
    cy.url().should('include', '/about');
    cy.get('h1').should('contain', 'О нас');
  });

  it('должна перенаправлять неавторизованного пользователя на страницу входа', () => {
    cy.visit('/profile');
    cy.url().should('include', '/login');
  });

  it('должна сохранять историю браузера', () => {
    cy.visit('/about');
    cy.visit('/contact');
    cy.go('back');
    cy.url().should('include', '/about');
  });
});
```

## Тестирование API вызовов с cy.intercept()

Команда `cy.intercept()` позволяет перехватывать HTTP-запросы, что необходимо для:

- мокирования ответов API (без реального бекенда);
- проверки отправляемых данных;
- тестирования состояний загрузки и ошибок.

### Базовое мокирование

```typescript
describe('Список пользователей', () => {
  it('должен отобразить список пользователей из API', () => {
    // Перехватываем GET запрос и возвращаем фиктивные данные
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Анна Смирнова', email: 'anna@example.com' },
        { id: 2, name: 'Борис Иванов', email: 'boris@example.com' },
      ],
    }).as('getUsers'); // псевдоним для ожидания

    cy.visit('/users');
    cy.wait('@getUsers'); // ждём завершения запроса

    cy.get('[data-cy="user-item"]').should('have.length', 2);
    cy.contains('Анна Смирнова').should('be.visible');
  });
});
```

### Использование фикстур

Фикстуры — это JSON-файлы с тестовыми данными, которые хранятся в `cypress/fixtures/`:

```json
// cypress/fixtures/users.json
[
  { "id": 1, "name": "Анна Смирнова", "email": "anna@example.com" },
  { "id": 2, "name": "Борис Иванов", "email": "boris@example.com" }
]
```

```typescript
cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
```

### Тестирование состояния ошибки

```typescript
it('должен отображать сообщение об ошибке при сбое API', () => {
  cy.intercept('GET', '/api/users', {
    statusCode: 500,
    body: { message: 'Внутренняя ошибка сервера' },
  }).as('getUsersError');

  cy.visit('/users');
  cy.wait('@getUsersError');

  cy.get('[data-cy="error-message"]').should('be.visible');
  cy.contains('Не удалось загрузить пользователей').should('be.visible');
});
```

### Проверка тела запроса

```typescript
it('должен отправить корректные данные при создании пользователя', () => {
  cy.intercept('POST', '/api/users', (req) => {
    // Проверяем тело запроса
    expect(req.body).to.have.property('name', 'Новый Пользователь');
    expect(req.body).to.have.property('email', 'new@example.com');
    req.reply({ statusCode: 201, body: { id: 3, ...req.body } });
  }).as('createUser');

  cy.visit('/users/new');
  cy.get('#name').type('Новый Пользователь');
  cy.get('#email').type('new@example.com');
  cy.get('[data-cy="submit-btn"]').click();
  cy.wait('@createUser');
});
```

### Тестирование состояния загрузки

```typescript
it('должен отображать спиннер во время загрузки', () => {
  cy.intercept('GET', '/api/data', (req) => {
    // Задержка ответа для проверки состояния загрузки
    req.reply((res) => {
      res.delay = 1000;
      res.body = { items: [] };
    });
  }).as('slowRequest');

  cy.visit('/dashboard');
  cy.get('[data-cy="loading-spinner"]').should('be.visible');
  cy.wait('@slowRequest');
  cy.get('[data-cy="loading-spinner"]').should('not.exist');
});
```

## Кастомные команды

Cypress позволяет создавать собственные команды для переиспользования часто повторяющейся логики. Команды определяются в `cypress/support/commands.ts`:

```typescript
// cypress/support/commands.ts

// Команда для авторизации
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('[data-cy="login-btn"]').click();
  cy.url().should('include', '/dashboard');
});

// Команда для авторизации через API (быстрее, чем через UI)
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  cy.request('POST', '/api/auth/login', { email, password }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
  });
});
```

Использование кастомных команд в тестах:

```typescript
describe('Личный кабинет', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
  });

  it('должен отображать данные профиля', () => {
    cy.visit('/profile');
    cy.get('[data-cy="user-name"]').should('be.visible');
  });
});
```

## Запуск тестов в headless режиме и CI/CD

### Headless режим

Для запуска тестов без открытия браузера (например, в CI) используйте команду:

```bash
npx cypress run
```

По умолчанию Cypress запускает тесты в браузере Electron. Для указания конкретного браузера:

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
```

Запуск отдельного файла или группы тестов:

```bash
npx cypress run --spec "cypress/e2e/login.cy.ts"
npx cypress run --spec "cypress/e2e/**/*.cy.ts"
```

### Интеграция с GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          browser: chrome
          headed: false
```

### Официальный GitHub Action от Cypress

Cypress предоставляет официальный GitHub Action, который упрощает интеграцию:

```yaml
- name: Cypress run
  uses: cypress-io/github-action@v6
  with:
    start: npm start          # команда запуска сервера
    wait-on: 'http://localhost:3000' # ждать запуска сервера
    browser: chrome
```

Action автоматически устанавливает зависимости, кеширует бинарники Cypress и запускает тесты.

### Сохранение артефактов

При падении тестов Cypress автоматически сохраняет скриншоты и видео. В CI их можно сохранить как артефакты:

```yaml
- name: Upload screenshots
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: cypress-screenshots
    path: cypress/screenshots

- name: Upload videos
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: cypress-videos
    path: cypress/videos
```

### Параллельный запуск

Для ускорения можно запускать тесты параллельно через Cypress Cloud (ранее Cypress Dashboard):

```yaml
- name: Cypress run parallel
  uses: cypress-io/github-action@v6
  with:
    record: true
    parallel: true
    group: 'E2E Tests'
  env:
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## Лучшие практики

### Используйте data-атрибуты для селекторов

Вместо CSS-классов или ID рекомендуется использовать специальные `data-cy` атрибуты:

```jsx
// ✅ Правильно
<button data-cy="submit-btn">Отправить</button>

// ❌ Избегайте
<button className="btn-primary">Отправить</button>
```

Это делает тесты независимыми от изменений стилей.

### Избегайте явных задержек

```typescript
// ❌ Плохо
cy.wait(2000);

// ✅ Хорошо — ждать конкретного события
cy.wait('@apiRequest');
cy.get('[data-cy="result"]').should('be.visible');
```

### Изолируйте тесты

Каждый тест должен быть независимым. Используйте `beforeEach` для сброса состояния:

```typescript
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit('/');
});
```

### Переиспользуйте логику через кастомные команды

Выносите повторяющуюся логику (авторизация, заполнение форм) в кастомные команды Cypress.

## Заключение

Cypress — это мощный и удобный инструмент для E2E тестирования React-приложений. Его основные преимущества — автоматическое ожидание, встроенный отладчик, простое мокирование API через `cy.intercept()` и поддержка компонентного тестирования.

Начните с написания тестов для критических пользовательских сценариев: авторизации, оформления заказа, основной навигации. Используйте `data-cy` атрибуты для стабильных селекторов, кастомные команды для переиспользования логики, и CI/CD интеграцию для автоматического запуска тестов при каждом изменении кода.

Cypress значительно снижает риск регрессий и повышает уверенность команды в работоспособности приложения на каждом этапе разработки.
