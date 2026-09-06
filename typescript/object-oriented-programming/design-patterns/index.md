---
metaTitle: "Паттерны проектирования в TypeScript — примеры и реализация"
metaDescription: "Реализация ключевых паттернов проектирования на TypeScript: Singleton, Factory, Observer, Strategy, Decorator с практическими примерами."
author: "Антон Ларичев"
title: "Паттерны проектирования в TypeScript"
preview: "Разбираем классические паттерны проектирования GoF на TypeScript с типизацией, дженериками и реальными примерами применения."
---

## Введение

Паттерны проектирования — это проверенные решения типичных задач, возникающих при разработке программного обеспечения. TypeScript с его статической типизацией, интерфейсами и дженериками позволяет реализовывать паттерны выразительно и безопасно: компилятор сразу укажет на несоответствие контракту.

В этой статье разберём наиболее востребованные паттерны из трёх групп классификации GoF: порождающие, структурные и поведенческие.

---

## Порождающие паттерны

Порождающие паттерны управляют созданием объектов, скрывая детали инстанцирования за удобным интерфейсом.

### Singleton (Одиночка)

Обеспечивает существование единственного экземпляра класса и предоставляет глобальную точку доступа к нему.

```typescript
class Database {
  private static instance: Database | null = null;
  private connectionString: string;

  private constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  static getInstance(connectionString: string): Database {
    if (!Database.instance) {
      Database.instance = new Database(connectionString);
    }
    return Database.instance;
  }

  query(sql: string): string {
    return `[${this.connectionString}] Executing: ${sql}`;
  }
}

const db1 = Database.getInstance('postgresql://localhost/app');
const db2 = Database.getInstance('postgresql://localhost/app');

console.log(db1 === db2); // true — один и тот же объект
console.log(db1.query('SELECT * FROM users'));
```

Private-конструктор не позволяет создать экземпляр через `new Database()`, а TypeScript проверит это на этапе компиляции.

### Factory Method (Фабричный метод)

Определяет интерфейс создания объекта, но делегирует выбор конкретного класса подклассам.

```typescript
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[INFO] ${message}`);
  }
  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

class FileLogger implements Logger {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  log(message: string): void {
    // запись в файл
    console.log(`Writing to ${this.filename}: [INFO] ${message}`);
  }
  error(message: string): void {
    console.log(`Writing to ${this.filename}: [ERROR] ${message}`);
  }
}

type LoggerType = 'console' | 'file';

function createLogger(type: LoggerType, filename?: string): Logger {
  switch (type) {
    case 'console':
      return new ConsoleLogger();
    case 'file':
      if (!filename) throw new Error('filename required for FileLogger');
      return new FileLogger(filename);
  }
}

const logger = createLogger('file', 'app.log');
logger.log('Application started');
logger.error('Something went wrong');
```

Тип `LoggerType` ограничивает допустимые значения, и TypeScript выдаст ошибку при передаче неизвестного типа.

### Abstract Factory (Абстрактная фабрика)

Создаёт семейства связанных объектов, не привязываясь к конкретным классам.

```typescript
interface Button {
  render(): string;
  onClick(): void;
}

interface Checkbox {
  render(): string;
  toggle(): void;
}

interface UIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

class WindowsButton implements Button {
  render(): string { return '<WindowsButton />'; }
  onClick(): void { console.log('Windows button clicked'); }
}

class WindowsCheckbox implements Checkbox {
  render(): string { return '<WindowsCheckbox />'; }
  toggle(): void { console.log('Windows checkbox toggled'); }
}

class MacButton implements Button {
  render(): string { return '<MacButton />'; }
  onClick(): void { console.log('Mac button clicked'); }
}

class MacCheckbox implements Checkbox {
  render(): string { return '<MacCheckbox />'; }
  toggle(): void { console.log('Mac checkbox toggled'); }
}

class WindowsFactory implements UIFactory {
  createButton(): Button { return new WindowsButton(); }
  createCheckbox(): Checkbox { return new WindowsCheckbox(); }
}

class MacFactory implements UIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}

function renderUI(factory: UIFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();
  console.log(button.render());
  console.log(checkbox.render());
}

renderUI(new WindowsFactory());
renderUI(new MacFactory());
```

---

## Структурные паттерны

Структурные паттерны описывают способы компоновки объектов и классов в более крупные структуры.

### Decorator (Декоратор)

Динамически добавляет объекту новые обязанности, оборачивая его в объект-обёртку с расширенным поведением.

```typescript
interface TextProcessor {
  process(text: string): string;
}

class PlainTextProcessor implements TextProcessor {
  process(text: string): string {
    return text;
  }
}

abstract class TextProcessorDecorator implements TextProcessor {
  constructor(protected wrapped: TextProcessor) {}

  process(text: string): string {
    return this.wrapped.process(text);
  }
}

class TrimDecorator extends TextProcessorDecorator {
  process(text: string): string {
    return super.process(text).trim();
  }
}

class UpperCaseDecorator extends TextProcessorDecorator {
  process(text: string): string {
    return super.process(text).toUpperCase();
  }
}

class CensorDecorator extends TextProcessorDecorator {
  private banned: string[];

  constructor(wrapped: TextProcessor, banned: string[]) {
    super(wrapped);
    this.banned = banned;
  }

  process(text: string): string {
    let result = super.process(text);
    this.banned.forEach(word => {
      result = result.replace(new RegExp(word, 'gi'), '***');
    });
    return result;
  }
}

const processor = new CensorDecorator(
  new UpperCaseDecorator(
    new TrimDecorator(
      new PlainTextProcessor()
    )
  ),
  ['spam', 'hack']
);

console.log(processor.process('  Hello spam world  '));
// HELLO *** WORLD
```

Декораторы стекуются и применяются последовательно снизу вверх. TypeScript гарантирует, что каждая обёртка соответствует интерфейсу `TextProcessor`.

### Adapter (Адаптер)

Преобразует интерфейс одного класса в интерфейс, ожидаемый клиентом.

```typescript
interface PaymentGateway {
  pay(amount: number, currency: string): Promise<boolean>;
}

// Сторонняя библиотека с несовместимым API
class StripeSDK {
  async charge(params: {
    amount_cents: number;
    currency_code: string;
    source: string;
  }): Promise<{ success: boolean; charge_id: string }> {
    console.log(`Stripe charge: ${params.amount_cents} ${params.currency_code}`);
    return { success: true, charge_id: 'ch_123' };
  }
}

class StripeAdapter implements PaymentGateway {
  constructor(private stripe: StripeSDK, private source: string) {}

  async pay(amount: number, currency: string): Promise<boolean> {
    const result = await this.stripe.charge({
      amount_cents: Math.round(amount * 100),
      currency_code: currency.toUpperCase(),
      source: this.source,
    });
    return result.success;
  }
}

async function processOrder(gateway: PaymentGateway, total: number): Promise<void> {
  const success = await gateway.pay(total, 'usd');
  console.log(success ? 'Payment accepted' : 'Payment failed');
}

const stripe = new StripeSDK();
const adapter = new StripeAdapter(stripe, 'card_token_xyz');
processOrder(adapter, 49.99);
```

---

## Поведенческие паттерны

Поведенческие паттерны определяют алгоритмы и способы взаимодействия объектов между собой.

### Observer (Наблюдатель)

Определяет зависимость «один ко многим» между объектами: при изменении состояния одного объекта все зависимые автоматически уведомляются.

```typescript
type EventMap = Record<string, unknown>;

class EventEmitter<T extends EventMap> {
  private listeners: {
    [K in keyof T]?: Array<(data: T[K]) => void>;
  } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const list = this.listeners[event];
    if (list) {
      this.listeners[event] = list.filter(l => l !== listener) as typeof list;
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners[event]?.forEach(listener => listener(data));
  }
}

type StoreEvents = {
  'product:added': { id: string; name: string; price: number };
  'order:placed': { orderId: string; total: number };
  'stock:low': { productId: string; remaining: number };
};

const store = new EventEmitter<StoreEvents>();

store.on('product:added', ({ name, price }) => {
  console.log(`New product: ${name} — $${price}`);
});

store.on('order:placed', ({ orderId, total }) => {
  console.log(`Order ${orderId} placed, total: $${total}`);
});

store.on('stock:low', ({ productId, remaining }) => {
  console.warn(`Low stock alert: ${productId}, only ${remaining} left`);
});

store.emit('product:added', { id: 'p1', name: 'TypeScript Handbook', price: 29.99 });
store.emit('order:placed', { orderId: 'ord_001', total: 59.98 });
store.emit('stock:low', { productId: 'p1', remaining: 3 });
```

Дженерик `EventMap` обеспечивает типобезопасность: при вызове `emit` TypeScript проверяет, что данные события соответствуют объявленному типу.

### Strategy (Стратегия)

Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми.

```typescript
interface SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[];
}

class BubbleSort<T> implements SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    const arr = [...data];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (compareFn(arr[j], arr[j + 1]) > 0) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
    return arr;
  }
}

class QuickSort<T> implements SortStrategy<T> {
  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    if (data.length <= 1) return data;
    const pivot = data[Math.floor(data.length / 2)];
    const left = data.filter(x => compareFn(x, pivot) < 0);
    const middle = data.filter(x => compareFn(x, pivot) === 0);
    const right = data.filter(x => compareFn(x, pivot) > 0);
    return [
      ...this.sort(left, compareFn),
      ...middle,
      ...this.sort(right, compareFn),
    ];
  }
}

class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}

  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }

  sort(data: T[], compareFn: (a: T, b: T) => number): T[] {
    return this.strategy.sort(data, compareFn);
  }
}

const numbers = [5, 2, 8, 1, 9, 3];
const numCompare = (a: number, b: number) => a - b;

const sorter = new Sorter<number>(new BubbleSort());
console.log(sorter.sort(numbers, numCompare)); // [1, 2, 3, 5, 8, 9]

sorter.setStrategy(new QuickSort());
console.log(sorter.sort(numbers, numCompare)); // [1, 2, 3, 5, 8, 9]
```

### Command (Команда)

Инкапсулирует запрос как объект, что позволяет параметризовать клиентов с различными запросами, ставить их в очередь и поддерживать отмену операций.

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private content = '';

  insert(text: string, position: number): void {
    this.content =
      this.content.slice(0, position) + text + this.content.slice(position);
  }

  delete(position: number, length: number): void {
    this.content =
      this.content.slice(0, position) + this.content.slice(position + length);
  }

  getContent(): string {
    return this.content;
  }
}

class InsertCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string,
    private position: number
  ) {}

  execute(): void {
    this.editor.insert(this.text, this.position);
  }

  undo(): void {
    this.editor.delete(this.position, this.text.length);
  }
}

class CommandHistory {
  private history: Command[] = [];

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
  }

  undo(): void {
    const command = this.history.pop();
    command?.undo();
  }
}

const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertCommand(editor, 'Hello', 0));
history.execute(new InsertCommand(editor, ', World', 5));
console.log(editor.getContent()); // Hello, World

history.undo();
console.log(editor.getContent()); // Hello

history.undo();
console.log(editor.getContent()); // (пусто)
```

---

## Применение дженериков в паттернах

TypeScript позволяет делать паттерны универсальными через дженерики. Пример обобщённого репозитория, реализующего паттерн Repository:

```typescript
interface Entity {
  id: string;
}

interface Repository<T extends Entity> {
  findById(id: string): T | undefined;
  findAll(): T[];
  save(entity: T): void;
  delete(id: string): void;
}

class InMemoryRepository<T extends Entity> implements Repository<T> {
  private storage = new Map<string, T>();

  findById(id: string): T | undefined {
    return this.storage.get(id);
  }

  findAll(): T[] {
    return Array.from(this.storage.values());
  }

  save(entity: T): void {
    this.storage.set(entity.id, entity);
  }

  delete(id: string): void {
    this.storage.delete(id);
  }
}

interface User extends Entity {
  id: string;
  name: string;
  email: string;
}

interface Product extends Entity {
  id: string;
  title: string;
  price: number;
}

const userRepo = new InMemoryRepository<User>();
userRepo.save({ id: 'u1', name: 'Alice', email: 'alice@example.com' });
userRepo.save({ id: 'u2', name: 'Bob', email: 'bob@example.com' });

console.log(userRepo.findAll());
// [{ id: 'u1', name: 'Alice', ... }, { id: 'u2', name: 'Bob', ... }]

const productRepo = new InMemoryRepository<Product>();
productRepo.save({ id: 'p1', title: 'TypeScript Guide', price: 29.99 });
console.log(productRepo.findById('p1'));
```

Одна реализация `InMemoryRepository` работает с любым типом, удовлетворяющим интерфейсу `Entity`.

---

## Выбор паттерна: ориентиры

| Задача | Подходящий паттерн |
|---|---|
| Единственный экземпляр | Singleton |
| Создание объектов без привязки к конкретному классу | Factory Method, Abstract Factory |
| Динамическое добавление поведения | Decorator |
| Интеграция несовместимых интерфейсов | Adapter |
| Реакция на события | Observer |
| Взаимозаменяемые алгоритмы | Strategy |
| Отмена операций, история действий | Command |

Паттерны не применяют «на всякий случай» — каждый решает конкретную проблему. Если проблемы нет, паттерн добавляет только сложность.

---

## Итог

TypeScript делает паттерны проектирования надёжнее: интерфейсы фиксируют контракты, дженерики убирают дублирование, а компилятор проверяет корректность на этапе сборки. Начинайте с простых решений и вводите паттерн только тогда, когда код без него становится сложным для изменения или тестирования.

Если хотите глубоко разобраться в TypeScript и научиться применять его возможности в реальных проектах, пройдите курс на PurpleSchool: [TypeScript с нуля до профи](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-design-patterns).
