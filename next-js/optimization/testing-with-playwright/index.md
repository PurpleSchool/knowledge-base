---
metaTitle: "Тестирование Next.js с Playwright — E2E тесты"
metaDescription: "Полное руководство по написанию E2E тестов для Next.js с Playwright: установка, настройка, Page Object Model, CI/CD интеграция."
author: "Антон Ларичев"
title: "Тестирование Next.js с Playwright"
preview: "Как настроить Playwright в Next.js-проекте, писать E2E тесты для App Router, форм и API, применять Page Object Model и запускать тесты в CI."
---

## Что такое Playwright и зачем его использовать с Next.js

Playwright — это современный фреймворк для сквозного (end-to-end, E2E) тестирования веб-приложений от Microsoft. Он позволяет писать тесты, которые запускают настоящий браузер и имитируют действия реального пользователя: клики, заполнение форм, навигацию по страницам.

Next.js — фреймворк с особой архитектурой: серверные компоненты, App Router, серверные экшены, API-роуты. Юнит-тесты и тесты компонентов не дают полной уверенности в том, что всё работает корректно в связке. Playwright тестирует приложение именно так, как его видит конечный пользователь — через реальный браузер.

Playwright поддерживает три браузерных движка — Chromium, Firefox, WebKit — и запускает тесты параллельно, что критично для больших проектов.

## Установка и настройка

Добавьте Playwright в существующий проект Next.js:

```bash
npm init playwright@latest
```

Мастер установки задаст несколько вопросов. Выберите TypeScript, укажите директорию `e2e` для тестов, разрешите скачать браузеры.

После установки в проекте появятся:

```
playwright.config.ts
e2e/
  example.spec.ts
```

Откройте `playwright.config.ts` и настройте его под Next.js:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Параметр `webServer` — ключевой. Playwright автоматически запустит Next.js перед тестами и остановит его по завершении. В CI каждый раз запускается собранное приложение (`npm run start`), локально — режим разработки с переиспользованием уже запущенного сервера.

## Первый тест: проверка главной страницы

Создайте файл `e2e/home.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('главная страница загружается корректно', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/PurpleSchool/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('навигация работает корректно', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Курсы' }).click();
  await expect(page).toHaveURL('/courses');
  await expect(page.getByRole('heading', { name: 'Курсы' })).toBeVisible();
});
```

Запустите тесты:

```bash
npx playwright test
```

Для запуска с графическим интерфейсом:

```bash
npx playwright test --ui
```

Режим `--ui` открывает браузерный интерфейс с пошаговым выполнением, временной шкалой действий и скриншотами — незаменим при отладке.

## Тестирование App Router и серверных компонентов

Next.js App Router строит маршруты на основе файловой системы. Серверные компоненты рендерятся на сервере и отдаются клиенту в виде HTML — Playwright тестирует итоговый результат в браузере, не зная, где именно произошёл рендеринг.

Создайте `e2e/courses.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Страница курсов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses');
  });

  test('отображает список курсов', async ({ page }) => {
    const courseCards = page.getByTestId('course-card');
    await expect(courseCards).not.toHaveCount(0);
  });

  test('фильтрация по категории работает', async ({ page }) => {
    await page.getByRole('button', { name: 'TypeScript' }).click();

    const courseCards = page.getByTestId('course-card');
    for (const card of await courseCards.all()) {
      await expect(card.getByText('TypeScript')).toBeVisible();
    }
  });

  test('переход на страницу курса работает', async ({ page }) => {
    await page.getByTestId('course-card').first().click();

    await expect(page).toHaveURL(/\/courses\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

Атрибут `data-testid` — надёжный способ выбора элементов. Добавьте его в компонент:

```tsx
// components/CourseCard.tsx
export function CourseCard({ course }: { course: Course }) {
  return (
    <div data-testid="course-card" className="...">
      <h2>{course.title}</h2>
      <span>{course.category}</span>
    </div>
  );
}
```

## Тестирование форм и Server Actions

Формы — одно из самых важных мест для E2E-тестирования. Playwright позволяет заполнять поля, отправлять формы и проверять результат.

Создайте `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Авторизация', () => {
  test('успешный вход в систему', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Пароль').fill('password123');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Добро пожаловать')).toBeVisible();
  });

  test('показывает ошибку при неверных данных', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Пароль').fill('wrongpassword');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByRole('alert')).toContainText('Неверный email или пароль');
    await expect(page).toHaveURL('/login');
  });

  test('валидация формы работает', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByText('Email обязателен')).toBeVisible();
    await expect(page.getByText('Пароль обязателен')).toBeVisible();
  });
});
```

Server Actions тестируются так же, как обычные формы — Playwright не различает, куда именно уходит запрос:

```typescript
test('отправка формы через Server Action', async ({ page }) => {
  await page.goto('/contact');

  await page.getByLabel('Имя').fill('Иван Петров');
  await page.getByLabel('Сообщение').fill('Хочу узнать о курсах');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Сообщение отправлено')).toBeVisible();
});
```

## Мокирование API и перехват запросов

Playwright позволяет перехватывать сетевые запросы и подменять ответы через `page.route()`. Это полезно при тестировании без реального бэкенда или для проверки поведения при ошибках.

```typescript
import { test, expect } from '@playwright/test';

test('отображает данные из API', async ({ page }) => {
  await page.route('/api/courses', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, title: 'TypeScript с нуля', category: 'TypeScript' },
        { id: 2, title: 'React Advanced', category: 'React' },
      ]),
    });
  });

  await page.goto('/courses');

  await expect(page.getByText('TypeScript с нуля')).toBeVisible();
  await expect(page.getByText('React Advanced')).toBeVisible();
});

test('обрабатывает ошибку API корректно', async ({ page }) => {
  await page.route('/api/courses', async (route) => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/courses');

  await expect(page.getByText('Не удалось загрузить курсы')).toBeVisible();
});
```

## Page Object Model

При росте числа тестов повторяющийся код становится проблемой. Page Object Model (POM) — паттерн, который инкапсулирует логику взаимодействия со страницей в отдельный класс.

Создайте `e2e/pages/LoginPage.ts`:

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Пароль');
    this.submitButton = page.getByRole('button', { name: 'Войти' });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }
}
```

Используйте POM в тестах:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Авторизация', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('успешный вход', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('ошибка при неверных данных', async () => {
    await loginPage.login('wrong@example.com', 'wrong');
    await loginPage.expectError('Неверный email или пароль');
  });
});
```

POM делает тесты читаемыми и значительно упрощает поддержку: при изменении вёрстки достаточно обновить один класс, а не каждый тест.

## Сохранение состояния авторизации

Повторный вход в систему в каждом тесте замедляет выполнение. Playwright поддерживает сохранение состояния браузера (cookies, localStorage) и переиспользование его между тестами.

Создайте `e2e/auth.setup.ts`:

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('авторизация', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL('/dashboard');

  await page.context().storageState({ path: authFile });
});
```

Обновите `playwright.config.ts`:

```typescript
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
],
```

Теперь `setup`-проект выполняется один раз, сохраняет сессию, и все последующие тесты в `chromium`-проекте стартуют уже авторизованными.

## Запуск тестов в CI/CD

Настройте GitHub Actions для автоматического запуска тестов при каждом push:

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Установка зависимостей
        run: npm ci

      - name: Установка браузеров Playwright
        run: npx playwright install --with-deps

      - name: Сборка приложения
        run: npm run build

      - name: Запуск тестов
        run: npx playwright test
        env:
          CI: true

      - name: Загрузка HTML-отчёта
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

В CI используется собранное приложение (`npm run build` + `npm run start`), а не режим разработки — это точнее воспроизводит production-среду и исключает ложноположительные результаты.

## Полезные команды

Playwright поставляется с инструментами, которые ускоряют написание тестов:

```bash
# Пошаговая отладка теста
npx playwright test --debug

# Codegen: запись действий и автогенерация кода теста
npx playwright codegen http://localhost:3000

# Просмотр последнего HTML-отчёта
npx playwright show-report

# Запуск конкретного файла
npx playwright test e2e/auth.spec.ts

# Запуск тестов по имени
npx playwright test -g "успешный вход"

# Запуск только в одном браузере
npx playwright test --project=chromium
```

`codegen` особенно полезен на старте: он открывает браузер, записывает все ваши действия и генерирует готовый код теста. Отличная отправная точка, которую потом можно доработать вручную.

## Структура проекта

Рекомендуемая организация файлов для E2E-тестов в Next.js-проекте:

```
e2e/
  auth.setup.ts        # Глобальная настройка авторизации
  home.spec.ts         # Тесты главной страницы
  courses.spec.ts      # Тесты страницы курсов
  auth.spec.ts         # Тесты авторизации
  pages/               # Page Object Model
    LoginPage.ts
    CoursesPage.ts
playwright/
  .auth/               # Сохранённые состояния авторизации (в .gitignore)
    user.json
playwright.config.ts
```

Добавьте директорию с сохранёнными сессиями в `.gitignore`:

```
playwright/.auth
```

## Что тестировать в первую очередь

E2E-тесты дорогостоящие по времени выполнения, поэтому важно расставить приоритеты:

- Критические пользовательские сценарии: регистрация, вход, оформление заказа
- Основные страницы и навигация
- Формы с валидацией и отправкой данных
- Защищённые маршруты — доступны ли только авторизованным пользователям
- Интеграция с API — корректная обработка успехов и ошибок

Юнит-тесты и тесты компонентов закрывают бизнес-логику и изолированное поведение, E2E-тесты — связку всех частей приложения в реальном браузере.

Полное погружение в разработку production-готовых приложений на Next.js, включая архитектуру, тестирование и деплой, доступно в курсе на PurpleSchool.

[Курс по Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-playwright-testing)
