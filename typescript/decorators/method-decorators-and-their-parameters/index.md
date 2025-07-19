---
metaTitle: Декораторы методов и их параметров в TypeScript
metaDescription: Разбираемся как использовать декораторы методов и их параметров в TypeScript
author: Дмитрий Нечаев
title: Декораторы методов и их параметров в TypeScript
preview: Учимся пользоваться декораторами методов и их параметров в TypeScript. Разбираем примеры использования
---

Декораторы в TypeScript позволяют модифицировать классы и их члены (методы, свойства, параметры) без изменения их исходного кода. В этой статье мы подробно рассмотрим декораторы методов и их параметров, а также разберем, как их использовать на практике.

### Декоратор метода

Декораторы методов позволяют добавлять или изменять поведение метода. Они применяются к методу класса и могут изменять его реализацию, параметры или результаты. Декоратор метода — это функция, которая принимает три аргумента:

1. **target**: Прототип класса, к которому принадлежит метод (если метод статический, то сам конструктор класса).
2. **propertyKey**: Имя метода.
3. **descriptor**: Дескриптор свойства, содержащий информацию о методе.

### Пример декоратора метода

Рассмотрим декоратор `log`, который будет логировать вызовы метода:

```tsx
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with arguments: ${JSON.stringify(args)}`);
    const result = originalMethod.apply(this, args);
    console.log(`Result: ${result}`);
    return result;
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calculator = new Calculator();
calculator.add(2, 3); // Логирует вызов и результат

```

В этом примере декоратор `log` оборачивает метод `add`, добавляя логирование до и после его выполнения.

Чтобы уверенно использовать декораторы методов и их параметры и создавать надежный код, необходимо глубокое понимание TypeScript. Приходите на наш большой [курс TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=dekoratory-metodov-i-ih-parametrov-v-typescript). На курсе 192 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Параметры декоратора метода

Декоратор метода может принимать дополнительные параметры для настройки его поведения. Это достигается созданием фабрики декораторов — функции, которая возвращает сам декоратор.

### Пример декоратора метода с параметрами

Создадим декоратор `logWithMessage`, который будет логировать вызовы метода с пользовательским сообщением:

```tsx
function logWithMessage(message: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`${message}: Calling ${propertyKey} with arguments: ${JSON.stringify(args)}`);
      const result = originalMethod.apply(this, args);
      console.log(`${message}: Result: ${result}`);
      return result;
    };
  };
}

class Calculator {
  @logWithMessage('Custom Log')
  multiply(a: number, b: number): number {
    return a * b;
  }
}

const calculator = new Calculator();
calculator.multiply(2, 3); // Логирует вызов с пользовательским сообщением

```

В этом примере декоратор `logWithMessage` принимает сообщение, которое будет выводиться вместе с логами.

### Декораторы параметров методов

Декораторы параметров методов позволяют добавлять метаданные к параметрам метода. Они применяются к параметрам методов и принимают три аргумента:

1. **target**: Прототип класса, к которому принадлежит метод (если метод статический, то сам конструктор класса).
2. **propertyKey**: Имя метода.
3. **parameterIndex**: Индекс параметра в списке параметров метода.

### Пример декоратора параметра метода

Создадим декоратор `logParameter`, который будет логировать значение параметра метода:

```tsx
function logParameter(target: any, propertyKey: string, parameterIndex: number) {
  const existingLoggedParameters = Reflect.getOwnMetadata('logParameters', target, propertyKey) || [];
  existingLoggedParameters.push(parameterIndex);
  Reflect.defineMetadata('logParameters', existingLoggedParameters, target, propertyKey);
}

function logMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const loggedParameters: number[] = Reflect.getOwnMetadata('logParameters', target, propertyKey);

    if (loggedParameters) {
      loggedParameters.forEach(index => {
        const parameterValue = args[index];
        console.log(`Parameter value at index ${index}: ${parameterValue}`);
      });
    }

    return originalMethod.apply(this, args);
  };
}

class Printer {
  @logMethod
  print(@logParameter message: string, @logParameter times: number) {
    for (let i = 0; i < times; i++) {
      console.log(message);
    }
  }
}

const printer = new Printer();
printer.print('Hello, TypeScript!', 3); // Логирует значения параметров

```

В этом примере декоратор `logParameter` добавляет метаданные о параметрах, которые должны быть залогированы, а декоратор `logMethod` использует эти метаданные для логирования значений параметров при вызове метода.

### Заключение

Декораторы методов и их параметров в TypeScript предоставляют мощные возможности для добавления и изменения поведения методов и их параметров. С помощью декораторов можно легко добавлять логирование, валидацию, кэширование и другие аспекты, не изменяя основной код классов. Это делает код более модульным, читаемым и легко расширяемым.

Правильное использование декораторов методов может значительно упростить разработку и поддержку сложных приложений. На нашем [курсе TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=dekoratory-metodov-i-ih-parametrov-v-typescript) вы получите все необходимые знания и навыки для работы с декораторами в TypeScript. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в TypeScript прямо сегодня.
