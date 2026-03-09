---
metaTitle: Snapshot тестирование React компонентов с Jest
metaDescription: Полное руководство по snapshot тестированию в React: создание снэпшотов, обновление, inline snapshots и best practices
author: Олег Марков
title: Snapshots тестирование
preview: Узнайте как использовать snapshot тесты для проверки UI компонентов React. Создание, обновление снэпшотов и когда их применять
---

## Введение

Snapshot тестирование — это техника, при которой Jest фиксирует «снимок» вывода компонента в определённый момент времени, а при последующих запусках сравнивает текущий вывод с сохранённым. Если вывод изменился — тест падает, сигнализируя о намеренном или случайном изменении в рендеринге.

В этой статье вы узнаете, что такое snapshot тесты, как их создавать и обновлять с помощью Jest, как использовать inline snapshots, как интегрировать snapshot тестирование с React Testing Library, а также когда snapshot тесты полезны, а когда от них лучше отказаться.

## Что такое snapshot тесты и когда их использовать

### Принцип работы

Когда вы вызываете `expect(component).toMatchSnapshot()` в первый раз, Jest:

1. Рендерит компонент
2. Сериализует результат в строку
3. Сохраняет эту строку в файл с расширением `.snap` в папке `__snapshots__`
4. Тест проходит успешно — снэпшот создан

При каждом последующем запуске Jest:
1. Рендерит компонент заново
2. Сравнивает результат с сохранённым снэпшотом
3. Если они совпадают — тест проходит
4. Если они отличаются — тест падает с показом разницы

Это позволяет отследить любые, даже незначительные изменения в структуре компонента.

### Когда snapshot тесты полезны

Snapshot тесты хорошо подходят для следующих сценариев:

- **Стабильные UI-компоненты.** Когда у вас есть компонент, который редко меняется — например, кнопка, бейдж, иконка или компонент карточки — snapshot тест быстро зафиксирует его текущий вид.

- **Регрессионное тестирование.** Если вы рефакторите код, но хотите убедиться, что визуальный вывод не изменился, snapshot тест даст быструю обратную связь.

- **Документирование вывода.** Файлы снэпшотов служат своеобразной документацией — по ним можно посмотреть, что именно рендерит компонент.

- **Быстрая проверка при небольших изменениях.** Snapshot тест занимает буквально одну строчку кода и покрывает всю структуру компонента целиком.

## toMatchSnapshot() в Jest

### Базовая настройка

Для snapshot тестирования React-компонентов вам понадобится `@testing-library/react` или `react-test-renderer`. Установим необходимые зависимости:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom react-test-renderer
```

### Создание первого snapshot теста

Рассмотрим простой компонент:

```tsx
// Button.tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ label, variant = 'primary', disabled = false, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

Напишем snapshot тест с использованием `react-test-renderer`:

```tsx
// Button.test.tsx
import renderer from 'react-test-renderer';
import { Button } from './Button';

test('renders Button correctly', () => {
  const tree = renderer.create(<Button label="Нажми меня" />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

После первого запуска Jest создаст файл `__snapshots__/Button.test.tsx.snap`:

```
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`renders Button correctly 1`] = `
<button
  className="btn btn-primary"
  disabled={false}
  onClick={undefined}
>
  Нажми меня
</button>
`;
```

### Несколько снэпшотов в одном тесте

Вы можете создавать несколько снэпшотов для разных состояний компонента:

```tsx
test('renders Button in different states', () => {
  const primaryTree = renderer.create(<Button label="Primary" variant="primary" />).toJSON();
  expect(primaryTree).toMatchSnapshot();

  const secondaryTree = renderer.create(<Button label="Secondary" variant="secondary" />).toJSON();
  expect(secondaryTree).toMatchSnapshot();

  const disabledTree = renderer.create(<Button label="Disabled" disabled />).toJSON();
  expect(disabledTree).toMatchSnapshot();
});
```

Каждый вызов `toMatchSnapshot()` создаёт отдельную запись в файле снэпшота с уникальным именем.

### Именованные снэпшоты

Чтобы файл снэпшотов был читаемым, группируйте тесты с помощью `describe` и давайте им понятные имена:

```tsx
describe('Button component', () => {
  test('renders primary button', () => {
    const tree = renderer.create(<Button label="Primary" variant="primary" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders secondary button', () => {
    const tree = renderer.create(<Button label="Secondary" variant="secondary" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders disabled button', () => {
    const tree = renderer.create(<Button label="Disabled" disabled />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

## Создание и обновление снэпшотов (--updateSnapshot)

### Когда снэпшот устаревает

Предположим, вы изменили компонент `Button` — добавили атрибут `aria-label` для доступности:

```tsx
export function Button({ label, variant = 'primary', disabled = false, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}  // новый атрибут
    >
      {label}
    </button>
  );
}
```

При запуске тестов Jest выдаст ошибку:

```
● renders Button correctly

  expect(received).toMatchSnapshot()

  Snapshot name: `renders Button correctly 1`

  - Snapshot  - 1
  + Received  + 1

    <button
  +   aria-label="Нажми меня"
      className="btn btn-primary"
      disabled={false}
      onClick={undefined}
    >
      Нажми меня
    </button>
```

Это означает, что структура компонента изменилась. Если изменение намеренное — нужно обновить снэпшот.

### Обновление снэпшотов

Для обновления всех устаревших снэпшотов используйте флаг `--updateSnapshot` (или `-u`):

```bash
npx jest --updateSnapshot
# или сокращённо
npx jest -u
```

Чтобы обновить снэпшоты только для конкретного файла:

```bash
npx jest Button.test.tsx --updateSnapshot
```

Чтобы обновить снэпшоты только для конкретного теста:

```bash
npx jest -t "renders Button correctly" --updateSnapshot
```

### Интерактивный режим

В интерактивном режиме (`npx jest --watch`) Jest предложит нажать `u` для обновления снэпшотов прямо в терминале — это особенно удобно при активной разработке.

### Важное правило обновления

Всегда внимательно просматривайте diff перед обновлением снэпшота. Обновление `--updateSnapshot` безвозвратно перезаписывает эталонные данные — если изменение было случайным (баг), вы зафиксируете баг как «правильное» поведение.

```bash
# Просмотрите изменения перед обновлением
npx jest --verbose

# Только потом обновляйте
npx jest -u
```

## Inline snapshots с toMatchInlineSnapshot()

### Что такое inline snapshots

`toMatchInlineSnapshot()` работает аналогично `toMatchSnapshot()`, но сохраняет снэпшот прямо в файле теста — вместо отдельного `.snap` файла. Это делает тест самодостаточным и упрощает чтение кода.

### Создание inline snapshot

При первом запуске теста Jest автоматически вставит снэпшот прямо в код:

```tsx
// До запуска теста
test('renders Button inline', () => {
  const tree = renderer.create(<Button label="Inline" />).toJSON();
  expect(tree).toMatchInlineSnapshot();
});
```

После запуска файл теста автоматически обновится:

```tsx
// После первого запуска — Jest вставил снэпшот
test('renders Button inline', () => {
  const tree = renderer.create(<Button label="Inline" />).toJSON();
  expect(tree).toMatchInlineSnapshot(`
    <button
      className="btn btn-primary"
      disabled={false}
      onClick={undefined}
    >
      Inline
    </button>
  `);
});
```

### Когда использовать inline snapshots

Inline snapshots удобны когда:

- **Компонент небольшой.** Если снэпшот умещается в 10–20 строк, держать его рядом с тестом наглядно.

- **Важен контекст.** Читатель сразу видит, что именно проверяется, без необходимости открывать отдельный `.snap` файл.

- **Снэпшот редко меняется.** Для стабильных компонентов inline снэпшот — отличный выбор.

Для крупных компонентов с большим деревом разметки лучше использовать обычные файлы снэпшотов — иначе файл теста становится труднечитаемым.

## Snapshot тесты с React Testing Library

### Использование render из RTL

React Testing Library предоставляет `render`, который рендерит компонент в реальный DOM. Для snapshot тестирования можно использовать метод `asFragment()`:

```tsx
import { render } from '@testing-library/react';
import { Button } from './Button';

test('Button matches snapshot', () => {
  const { asFragment } = render(<Button label="RTL Snapshot" />);
  expect(asFragment()).toMatchSnapshot();
});
```

`asFragment()` возвращает `DocumentFragment` — всё, что было отрендерено компонентом. Это более близко к реальному DOM, чем `react-test-renderer`.

### Snapshot с контейнером

Если вы хотите захватить только определённую часть разметки, используйте `container`:

```tsx
test('Button container matches snapshot', () => {
  const { container } = render(<Button label="Container" />);
  expect(container.firstChild).toMatchSnapshot();
});
```

### Snapshot с пропсами и событиями

Пример тестирования более сложного компонента:

```tsx
// UserCard.tsx
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export function UserCard({ name, email, avatar, role }: UserCardProps) {
  return (
    <div className="user-card">
      {avatar && <img src={avatar} alt={`Аватар ${name}`} />}
      <div className="user-info">
        <h2>{name}</h2>
        <p>{email}</p>
        <span className={`badge badge-${role}`}>{role}</span>
      </div>
    </div>
  );
}
```

```tsx
// UserCard.test.tsx
import { render } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  test('renders admin user with avatar', () => {
    const { asFragment } = render(
      <UserCard
        name="Иван Петров"
        email="ivan@example.com"
        avatar="https://example.com/avatar.jpg"
        role="admin"
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  test('renders regular user without avatar', () => {
    const { asFragment } = render(
      <UserCard
        name="Мария Сидорова"
        email="maria@example.com"
        role="user"
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
```

### Snapshot с моками динамических данных

Динамические данные — даты, случайные ID, временные метки — сделают ваш снэпшот нестабильным. Замокируйте их:

```tsx
// ArticleCard.tsx
interface ArticleCardProps {
  title: string;
  createdAt: Date;
}

export function ArticleCard({ title, createdAt }: ArticleCardProps) {
  return (
    <article>
      <h3>{title}</h3>
      <time>{createdAt.toLocaleDateString('ru-RU')}</time>
    </article>
  );
}
```

```tsx
// ArticleCard.test.tsx
import { render } from '@testing-library/react';
import { ArticleCard } from './ArticleCard';

test('ArticleCard matches snapshot', () => {
  // Фиксируем дату для стабильного снэпшота
  const fixedDate = new Date('2024-01-15');

  const { asFragment } = render(
    <ArticleCard title="Тестовая статья" createdAt={fixedDate} />
  );
  expect(asFragment()).toMatchSnapshot();
});
```

### Snapshot с провайдерами

Если компонент зависит от контекста или провайдеров, оберните его:

```tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';
import { ThemedButton } from './ThemedButton';

test('ThemedButton matches snapshot', () => {
  const { asFragment } = render(
    <ThemeProvider theme="dark">
      <ThemedButton label="Dark Button" />
    </ThemeProvider>
  );
  expect(asFragment()).toMatchSnapshot();
});
```

Либо используйте `wrapper` опцию:

```tsx
import { render } from '@testing-library/react';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme="dark">{children}</ThemeProvider>
);

test('ThemedButton with wrapper matches snapshot', () => {
  const { asFragment } = render(<ThemedButton label="Dark Button" />, {
    wrapper: Wrapper,
  });
  expect(asFragment()).toMatchSnapshot();
});
```

## Плюсы и минусы snapshot тестирования

### Преимущества

**Скорость написания.** Snapshot тест создаётся буквально в одну строку — `expect(tree).toMatchSnapshot()`. Не нужно вручную описывать, какие атрибуты и тексты должны присутствовать.

**Полное покрытие структуры.** Снэпшот фиксирует всю разметку компонента, включая атрибуты, классы, вложенность — вы не пропустите случайное изменение нигде в дереве.

**Регрессионная защита.** При любом изменении вывода тест упадёт. Даже если вы не планировали менять компонент, snapshot тест немедленно сообщит об этом.

**Документирование.** Файлы `.snap` наглядно показывают, что рендерит компонент. Полезно при онбординге новых разработчиков или при ревью.

**Интеграция с CI/CD.** Snapshot тесты легко встраиваются в пайплайн: если кто-то случайно сломал вёрстку — CI упадёт.

### Недостатки

**Лёгкость случайного обновления.** Разработчик может обновить снэпшоты флагом `-u`, не изучив, что именно изменилось. Так в базу кода попадают зафиксированные баги.

**Нечитаемые снэпшоты.** Для сложных компонентов снэпшот может занимать сотни строк — его сложно ревьюить в пул-реквесте.

**Отсутствие семантики.** Снэпшот проверяет структуру, но не то, правильно ли работает компонент с точки зрения пользователя. Кнопка может иметь правильную разметку, но сломанный обработчик клика.

**Нестабильность.** Любое мелкое изменение — добавление пробела, переименование CSS-класса, обновление зависимости — ломает снэпшот. Со временем команда привыкает обновлять тесты «не глядя».

**Ложная уверенность.** Высокое покрытие snapshot тестами не означает, что приложение работает корректно. Снэпшоты не тестируют логику, доступность, взаимодействие.

## Когда НЕ стоит использовать snapshots

### Компоненты с часто меняющимся UI

Если компонент активно развивается и его вёрстка меняется каждый спринт — snapshot тест станет источником постоянного шума. Разработчики будут тратить время на обновление снэпшотов вместо написания полезных тестов.

### Тестирование логики и поведения

Snapshot тест не проверяет, что кнопка реально отправляет форму, что счётчик увеличивается при клике, что данные правильно фильтруются. Для таких сценариев используйте обычные поведенческие тесты:

```tsx
// Плохо: snapshot не тестирует логику
test('counter snapshot', () => {
  const { asFragment } = render(<Counter />);
  expect(asFragment()).toMatchSnapshot(); // не проверяет, работает ли счётчик
});

// Хорошо: тестируем реальное поведение
test('counter increments on click', async () => {
  const { getByRole } = render(<Counter />);
  const button = getByRole('button', { name: /увеличить/i });

  await userEvent.click(button);

  expect(getByRole('status')).toHaveTextContent('1');
});
```

### Компоненты с динамическими данными без мокинга

Если компонент рендерит текущую дату, случайные ID или данные из внешнего API без мокирования — снэпшот будет каждый раз разным:

```tsx
// Плохо: снэпшот сломается каждый день
test('DateDisplay snapshot', () => {
  const { asFragment } = render(<DateDisplay />); // рендерит new Date()
  expect(asFragment()).toMatchSnapshot();
});
```

### Сложные компоненты с большим деревом

Для страниц или крупных составных компонентов снэпшот занимает сотни строк. Любое изменение в дочернем компоненте ломает снэпшот родителя. Вместо этого тестируйте компоненты изолированно:

```tsx
// Плохо: гигантский снэпшот всей страницы
test('Dashboard page snapshot', () => {
  const { asFragment } = render(<DashboardPage />);
  expect(asFragment()).toMatchSnapshot(); // 500+ строк
});

// Хорошо: снэпшоты отдельных маленьких компонентов
test('StatsCard snapshot', () => {
  const { asFragment } = render(<StatsCard title="Пользователи" value={42} />);
  expect(asFragment()).toMatchSnapshot(); // ~10 строк
});
```

### Тестирование доступности

Snapshot тест не проверяет доступность (a11y). Для этого используйте специальные инструменты:

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button is accessible', async () => {
  const { container } = render(<Button label="Доступная кнопка" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Управление файлами снэпшотов

### Организация файлов

Jest автоматически создаёт папку `__snapshots__` рядом с файлом тестов:

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── __snapshots__/
│   │       └── Button.test.tsx.snap
```

### Удаление устаревших снэпшотов

Когда тест удаляется, связанный снэпшот остаётся в файле. Для очистки устаревших снэпшотов используйте:

```bash
npx jest --ci  # Не обновляет снэпшоты, только проверяет
npx jest --updateSnapshot  # Удаляет устаревшие снэпшоты и обновляет изменённые
```

Либо вручную откройте `.snap` файл и удалите ненужные записи.

### Коммит файлов снэпшотов

Файлы `.snap` должны быть закоммичены в репозиторий — они являются частью тестов и отражают ожидаемое поведение. Добавьте их в git:

```bash
git add src/components/**/__snapshots__/*.snap
```

Не добавляйте `.snap` файлы в `.gitignore`.

## Лучшие практики

**Проверяйте снэпшоты при ревью.** В пул-реквесте обязательно просматривайте изменения в `.snap` файлах — они должны соответствовать реальным изменениям в компонентах.

**Используйте для стабильных компонентов.** Атомарные UI-компоненты (кнопки, теги, бейджи, иконки) — хорошие кандидаты для snapshot тестирования.

**Комбинируйте с поведенческими тестами.** Snapshot тест + тест взаимодействия = надёжное покрытие.

**Не злоупотребляйте.** Не нужно snapshot тестировать каждый компонент. Выбирайте те, где структура важна и стабильна.

**Давайте понятные имена тестам.** Это делает файл снэпшотов читаемым и помогает разобраться, что именно хранится в каждом снэпшоте.

**Мокируйте нестабильные данные.** Даты, случайные ID, таймстэмпы всегда мокируйте для стабильности снэпшотов.

## Заключение

Snapshot тестирование — мощный инструмент в арсенале React-разработчика, но как и любой инструмент, он требует разумного применения. Используйте `toMatchSnapshot()` для фиксации стабильного UI атомарных компонентов, `toMatchInlineSnapshot()` для небольших компонентов, где важен контекст, а React Testing Library с `asFragment()` — для более близкого к реальному DOM тестирования.

Помните: snapshot тесты защищают от случайных регрессий в вёрстке, но не заменяют поведенческие тесты. Лучшие тест-сьюты используют оба подхода: snapshot тесты для проверки структуры и поведенческие тесты для проверки логики.
