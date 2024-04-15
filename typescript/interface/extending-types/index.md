---
metaTitle: Расширение типов в TypeScript
metaDescription: Разбираемся как использовать расширение типов в TypeScript
author: Дмитрий Нечаев
title: Расширение типов в TypeScript
preview: Учимся пользоваться расширение типов в TypeScript. Разбираем примеры использования
---

В TypeScript часто возникает необходимость создавать типы, которые являются более специфичными версиями других типов. Это может быть особенно полезно, когда мы хотим избежать повторения кода и упростить поддержку и расширение программных интерфейсов.

### Базовый пример

Рассмотрим простой пример с адресами. Мы начнем с базового типа `BasicAddress`, который описывает необходимые поля для отправки писем и посылок в США:

```tsx
interface BasicAddress {
  name?: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

```

Этот тип описывает базовую структуру адреса, но в реальной жизни адреса часто содержат дополнительные детали. Например, если здание имеет несколько подразделений, может потребоваться указать номер квартиры или офиса.

### Расширение типов

Для описания адреса с единицей измерения (например, номером квартиры) мы можем расширить `BasicAddress`, создав новый тип `AddressWithUnit`:

```tsx
interface AddressWithUnit extends BasicAddress {
  unit: string;
}

```

Здесь ключевое слово `extends` позволяет нам включить все свойства `BasicAddress` в новый тип `AddressWithUnit`, добавляя только уникальные поля. Это избавляет нас от необходимости повторять все поля базового типа.

### Преимущества подхода

Использование расширения типов снижает объем кода и повышает его читаемость. Кроме того, это упрощает поддержку кода, поскольку любые изменения в базовом типе автоматически отражаются во всех расширенных типах. Это делает код более модульным и легким для масштабирования.

### Расширение нескольких типов

TypeScript также позволяет интерфейсу расширять несколько типов одновременно, что дает возможность комбинировать различные наборы свойств в новые типы. Например, создадим тип, который описывает круглые объекты с цветом:

```tsx
interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

interface ColorfulCircle extends Colorful, Circle {}

```

Здесь `ColorfulCircle` сочетает свойства `Colorful` и `Circle`, позволяя создавать объекты, которые имеют как цвет, так и радиус:

```tsx
const cc: ColorfulCircle = {
  color: "red",
  radius: 42,
};

```

### Заключение

Расширение типов в TypeScript — это мощный инструмент для создания чистого и удобно масштабируемого кода. Оно позволяет легко добавлять новые функции, при этом сохраняя связь с базовыми абстракциями, что делает код более устойчивым к изменениям и ошибкам.