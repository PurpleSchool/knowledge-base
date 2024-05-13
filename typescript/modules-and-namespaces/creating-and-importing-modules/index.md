---
metaTitle: Создание и подключение модулей в TypeScript
metaDescription: Разбираемся как cоздавать и подключать модули в TypeScript
author: Дмитрий Нечаев
title: Создание и подключение модулей в TypeScript
preview: Учимся создавать и подключать модули в TypeScript. Разбираем примеры использования
---

TypeScript поддерживает работу с модулями, что позволяет организовать код в отдельных файлах и импортировать их в другие части приложения. Модули в TypeScript основаны на концепции модулей из стандарта ES2015 (ES6). Они помогают сделать код более структурированным, понятным и многократно используемым.

### Что такое модули?

Модули позволяют группировать классы, интерфейсы, функции и переменные в отдельные файлы и управлять их видимостью с помощью ключевых слов `export` и `import`. Модули загружаются в строгом режиме (`strict mode`), что помогает избежать некоторых ошибок и делает код более безопасным.

### Определение модуля

Чтобы определить модуль, необходимо создать файл и экспортировать из него нужные сущности с помощью ключевого слова `export`.

### Пример создания модуля

Создадим файл `mathUtils.ts`, который будет содержать несколько математических функций:

```tsx
// mathUtils.ts
export function add(a: number, b: number): number {
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}

```

В этом примере мы экспортируем две функции: `add` и `subtract`. Теперь эти функции можно импортировать и использовать в других файлах.

### Импорт модуля

Для использования экспортированных сущностей из модуля, необходимо импортировать их с помощью ключевого слова `import`.

### Пример импорта модуля

Создадим файл `app.ts`, который будет использовать функции из модуля `mathUtils.ts`:

```tsx
// app.ts
import { add, subtract } from './mathUtils';

let sum = add(5, 3);
let difference = subtract(5, 3);

console.log(`Sum: ${sum}`); // "Sum: 8"
console.log(`Difference: ${difference}`); // "Difference: 2"

```

В этом примере мы импортируем функции `add` и `subtract` из файла `mathUtils.ts` и используем их в коде.

### Экспорт по умолчанию

TypeScript также поддерживает экспорт по умолчанию (`default export`), который позволяет экспортировать одну сущность из модуля, как основной экспорт.

### Пример экспорта по умолчанию

Создадим файл `greeter.ts`, который будет содержать класс для приветствия:

```tsx
// greeter.ts
export default class Greeter {
    constructor(private greeting: string) {}

    greet() {
        console.log(this.greeting);
    }
}

```

### Пример импорта экспорта по умолчанию

Создадим файл `main.ts`, который будет использовать класс `Greeter`:

```tsx
// main.ts
import Greeter from './greeter';

let greeter = new Greeter("Hello, TypeScript!");
greeter.greet(); // "Hello, TypeScript!"

```

В этом примере мы импортируем класс `Greeter` без фигурных скобок, так как он экспортируется по умолчанию.

### Переименование при импорте

При импорте можно переименовать сущности, чтобы избежать конфликтов имен.

### Пример переименования при импорте

```tsx
// anotherMathUtils.ts
export function multiply(a: number, b: number): number {
    return a * b;
}

export function divide(a: number, b: number): number {
    return a / b;
}

```

```tsx
// app.ts
import { add, subtract } from './mathUtils';
import { multiply as mul, divide as div } from './anotherMathUtils';

console.log(`Multiplication: ${mul(5, 3)}`); // "Multiplication: 15"
console.log(`Division: ${div(6, 3)}`); // "Division: 2"

```

В этом примере функции `multiply` и `divide` импортируются с новыми именами `mul` и `div` соответственно.

### Импорт всего модуля

Можно импортировать все экспортируемые сущности модуля под одним именем, используя `* as`.

### Пример импорта всего модуля

```tsx
// app.ts
import * as MathUtils from './mathUtils';

console.log(`Sum: ${MathUtils.add(5, 3)}`); // "Sum: 8"
console.log(`Difference: ${MathUtils.subtract(5, 3)}`); // "Difference: 2"

```

В этом примере все экспортируемые функции из модуля `mathUtils` импортируются под именем `MathUtils`.

### Организация больших проектов

В больших проектах часто используется комбинация пространств имен и модулей для создания четкой структуры кода. Пространства имен помогают организовать логически связанные элементы внутри одного файла, а модули позволяют разделять код на несколько файлов.

### Пример большой структуры проекта

```
src/
├── models/
│   ├── user.ts
│   └── order.ts
├── services/
│   ├── userService.ts
│   └── orderService.ts
└── app.ts

```

```tsx
// models/user.ts
export interface User {
    id: number;
    name: string;
}

// models/order.ts
export interface Order {
    id: number;
    product: string;
    quantity: number;
}

// services/userService.ts
import { User } from '../models/user';

export class UserService {
    getUser(id: number): User {
        return { id, name: "John Doe" };
    }
}

// services/orderService.ts
import { Order } from '../models/order';

export class OrderService {
    getOrder(id: number): Order {
        return { id, product: "Laptop", quantity: 1 };
    }
}

// app.ts
import { UserService } from './services/userService';
import { OrderService } from './services/orderService';

const userService = new UserService();
const orderService = new OrderService();

const user = userService.getUser(1);
const order = orderService.getOrder(1);

console.log(user); // { id: 1, name: "John Doe" }
console.log(order); // { id: 1, product: "Laptop", quantity: 1 }

```

В этом примере мы создаем четко структурированный проект с использованием модулей. Модули `models` содержат интерфейсы `User` и `Order`, модули `services` содержат классы `UserService` и `OrderService`, а файл `app.ts` объединяет их для использования в приложении.

### Заключение

Модули в TypeScript предоставляют мощный инструмент для организации и управления кодом. Они помогают структурировать код, улучшать его читаемость и поддержку, а также избегать конфликтов имен. Использование модулей включает экспорт и импорт сущностей, переименование при импорте, использование экспорта по умолчанию и импорт всего модуля. В крупных проектах модули играют ключевую роль в поддержании четкой структуры и удобства работы с кодом.