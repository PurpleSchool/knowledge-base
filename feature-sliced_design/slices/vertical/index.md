---
metaTitle: Вертикальные слайсы vertical slices в прикладной архитектуре
metaDescription: Подробное объяснение подхода вертикальные слайсы vertical slices - чем он отличается от слоев традиционной архитектуры и как упрощает разработку и поддержку приложений
author: Олег Марков
title: Вертикальные слайсы vertical slices - практическое руководство
preview: Разберитесь в подходе вертикальные слайсы vertical slices - как организовать код вокруг фич а не слоев и сократить связность между модулями
---

## Введение

Подход вертикальные слайсы (vertical slices) — это способ организовать код не вокруг технических слоев (контроллеры, сервисы, репозитории), а вокруг конкретных функций системы: заказ, оплата, регистрация пользователя, поиск и так далее.

Вместо того чтобы раскладывать код по слоям вроде `Controllers`, `Services`, `Repositories`, вы собираете все, что относится к одной бизнес‑функции, в один модуль или пакет. Как результат — каждая фича становится самостоятельным кусочком системы, который проще понимать, изменять и тестировать.

В этой статье я покажу вам:

- в чем суть вертикальных слайсов;
- чем они отличаются от слоеной архитектуры;
- как организовать структуру проекта;
- как выглядит типичный слайс с примерами кода;
- как сочетать vertical slices с CQRS, DDD и модульными монолитами;
- какие плюсы и минусы у такого подхода.

Примеры я буду показывать в стиле, близком к C# или TypeScript, но идеи легко перенести на любой язык: Go, Java, Kotlin, PHP, Python, Rust.

---

## Что такое вертикальные слайсы

### Основная идея

Вертикальный слайс — это законченный кусок функциональности приложения, который включает в себя:

- API‑слой (endpoint, handler, контроллер);
- обработчик команды или запроса;
- доменную логику, валидацию, маппинг, правила;
- доступ к данным, интеграции с внешними сервисами.

Смотрите, идея простая: вместо

- `Controllers/OrderController.cs`
- `Services/OrderService.cs`
- `Repositories/OrderRepository.cs`
- `Dtos/OrderDto.cs`
- `Validators/OrderValidator.cs`

вы делаете один модуль фичи, например `Features/Orders/CreateOrder`, и уже внутри него храните:

- `CreateOrderEndpoint`
- `CreateOrderCommand`
- `CreateOrderHandler`
- `CreateOrderValidator`
- `CreateOrderResponse`

В результате у вас появляется один «вертикальный» срез через всю систему, который обслуживает один конкретный use‑case.

### Отличие от слоеной архитектуры

Давайте сравним.

**Слоеная архитектура (layered):**

- слой представления (controllers);
- слой бизнес‑логики (services);
- слой данных (repositories);
- общие DTO, общие мапперы, общие утилиты.

Проблема: каждая новая фича разрезается на части и размазывается по слоям. Чтобы понять, как создается заказ, вам надо:

- открыть контроллеры и найти нужный метод;
- открыть сервисы и найти соответствующую функцию;
- открыть репозитории и посмотреть SQL или ORM код;
- залезть в общие DTO и понять, какие структуры данных используются.

**Вертикальные слайсы:**

- каждый сценарий (use‑case) — это отдельный слайс;
- в слайсе лежит все, что нужно только этому сценарию;
- минимум общих слоев и общих «супер‑сервисов».

Как результат, вы можете сказать: «меня интересует создание заказа» — и сразу пойти в один модуль `Orders/CreateOrder`, где увидите всю цепочку от входящего HTTP‑запроса до записи в базу.

---

## Типичная структура проекта с вертикальными слайсами

### Базовая структура

Представим веб‑приложение. Простейшая структура с vertical slices может выглядеть так:

- `Features`
  - `Orders`
    - `CreateOrder`
      - `CreateOrderEndpoint.cs`
      - `CreateOrderCommand.cs`
      - `CreateOrderHandler.cs`
      - `CreateOrderValidator.cs`
      - `CreateOrderResponse.cs`
    - `GetOrderDetails`
      - `GetOrderDetailsEndpoint.cs`
      - `GetOrderDetailsQuery.cs`
      - `GetOrderDetailsHandler.cs`
      - `GetOrderDetailsResponse.cs`
  - `Payments`
    - `PayInvoice`
    - `RefundPayment`
- `Infrastructure`
  - `Database`
  - `Messaging`
- `Shared`
  - `Abstractions`
  - `CommonTypes`

Главный принцип: каждый use‑case — это отдельная папка/пространство имен/пакет. Внутри — все, что нужно для этого кейса.

### Пример структуры для REST API

Покажу упрощенный пример структуры в псевдо‑C#:

```csharp
// Папка Features/Orders/CreateOrder

// Точка входа - HTTP endpoint
public class CreateOrderEndpoint
{
    private readonly IMediator _mediator; // Посредник для отправки команды

    public CreateOrderEndpoint(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Метод обработки POST /orders
    public async Task<IResult> HandleAsync(CreateOrderRequest request)
    {
        // Здесь мы создаем команду из входящего запроса
        var command = new CreateOrderCommand(
            customerId: request.CustomerId,
            items: request.Items);

        // Отправляем команду обработчику
        var result = await _mediator.Send(command);

        // Возвращаем HTTP‑ответ
        return Results.Created($"/orders/{result.OrderId}", result);
    }
}

// DTO входящего HTTP‑запроса
public record CreateOrderRequest(
    Guid CustomerId,
    List<CreateOrderItemDto> Items);

// DTO позиции заказа
public record CreateOrderItemDto(
    Guid ProductId,
    int Quantity);
```

Обратите внимание: все типы `CreateOrder*` лежат рядом, в одном модуле. Это упрощает понимание и навигацию по коду.

---

## Вертикальный слайс шаг за шагом

Теперь давайте разберем типичный слайс по слоям ответственности.

### Команда или запрос

Чаще всего vertical slices хорошо сочетаются с CQRS. Для каждого действия вы заводите команду (command) или запрос (query).

```csharp
// Папка Features/Orders/CreateOrder

// Команда на создание заказа
public record CreateOrderCommand(
    Guid CustomerId,
    List<CreateOrderItem> Items)
    : IRequest<CreateOrderResponse>;

// Элемент команды
public record CreateOrderItem(
    Guid ProductId,
    int Quantity);
```

Комментарии:

- `CreateOrderCommand` описывает, что именно мы хотим сделать;
- `IRequest<CreateOrderResponse>` означает, что обработчик вернет `CreateOrderResponse`;
- структура данных команды хранится внутри фичи и не «утекает» как общий DTO.

### Обработчик команды

Теперь покажу вам, как выглядит обработчик вертикального слайса:

```csharp
// Папка Features/Orders/CreateOrder

public class CreateOrderHandler
    : IRequestHandler<CreateOrderCommand, CreateOrderResponse>
{
    private readonly IOrderRepository _orders;    // Интерфейс репозитория
    private readonly ICustomerService _customers; // Доменные проверки

    public CreateOrderHandler(
        IOrderRepository orders,
        ICustomerService customers)
    {
        _orders = orders;
        _customers = customers;
    }

    public async Task<CreateOrderResponse> Handle(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        // Проверяем, что клиент существует и активен
        var customer = await _customers.GetByIdAsync(command.CustomerId);
        if (customer is null || !customer.IsActive)
        {
            // Здесь можно кинуть исключение или вернуть ошибку домена
            throw new InvalidOperationException("Customer is not active");
        }

        // Создаем доменную сущность заказа
        var order = Order.Create(
            customerId: command.CustomerId,
            items: command.Items.Select(i =>
                new OrderItem(i.ProductId, i.Quantity)).ToList());

        // Сохраняем заказ
        await _orders.AddAsync(order, cancellationToken);

        // Возвращаем DTO результата
        return new CreateOrderResponse(
            OrderId: order.Id,
            TotalAmount: order.TotalAmount,
            CreatedAt: order.CreatedAt);
    }
}
```

Ключевая особенность вертикального слайса:

- обработчик «видит» сразу и данные, и домен, и репозиторий;
- логика сосредоточена в одном месте, а не разбросана по нескольким сервисам.

### Валидатор

Валидация часто находится рядом с командой и обработчиком.

```csharp
// Папка Features/Orders/CreateOrder

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        // Проверяем идентификатор клиента
        RuleFor(c => c.CustomerId)
            .NotEmpty()
            .WithMessage("CustomerId is required");

        // Проверяем, что список позиций не пуст
        RuleFor(c => c.Items)
            .NotEmpty()
            .WithMessage("Order must contain at least one item");

        // Правила для каждой позиции
        RuleForEach(c => c.Items)
            .ChildRules(item =>
            {
                // Проверяем идентификатор товара
                item.RuleFor(i => i.ProductId)
                    .NotEmpty();

                // Проверяем количество
                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0);
            });
    }
}
```

Такой валидатор относится только к одному use‑case, поэтому не засоряет глобальные «общие валидаторы».

### DTO ответа

Ответ слайса тоже лежит рядом:

```csharp
// Папка Features/Orders/CreateOrder

public record CreateOrderResponse(
    Guid OrderId,
    decimal TotalAmount,
    DateTime CreatedAt);
```

Благодаря этому, читая код, вы видите всю цепочку данных от входа до выхода.

---

## Организация фич вместо слоев

### Папки и неймспейсы

Чтобы подход vertical slices был удобен, полезно согласовать структуру:

- верхний уровень — `Features` или `Application`;
- дальше — бизнес‑область (`Orders`, `Payments`, `Users`);
- внутри области — конкретные сценарии (`CreateOrder`, `GetOrders`, `CancelOrder`).

Пример неймспейса:

```csharp
namespace MyApp.Features.Orders.CreateOrder
{
    // Здесь лежит все, что связано с созданием заказа
}
```

То же самое можно сделать в Go (пакеты), Java/Kotlin (packages), PHP (namespaces), Python (модули).

Главная мысль: заходите в папку фичи и сразу видите целостный контекст.

### Когда объединять несколько действий в один слайс

Иногда логично держать несколько близких операций в одном модуле. Например, `Orders/Management` может включать:

- `ListOrders`
- `GetOrderDetails`
- `CancelOrder`

Вы можете:

- либо сделать отдельные подпапки (`List`, `Details`, `Cancel`);
- либо хранить несколько файлов в одной папке, если код небольшой.

Главное — сохранять читаемость и изоляцию: не превращать одну фичу в «мусорную корзину» для всего, что связано с заказами.

---

## Интеграция с CQRS и Mediator

### Почему vertical slices часто используют с CQRS

Подход vertical slices и CQRS хорошо сочетаются, потому что оба концентрируются на отдельных сценариях использования:

- каждая команда или запрос — это отдельный слайс;
- каждый слайс имеет свой обработчик;
- модель чтения может отличаться от модели записи.

В результате:

- логика чтения не перемешивается с логикой записи;
- каждый endpoint становится тонкой оберткой над командой/запросом.

### Пример полного потока с Mediator

Давайте посмотрим на процесс «получить детали заказа»:

```csharp
// Папка Features/Orders/GetOrderDetails

// HTTP endpoint
public class GetOrderDetailsEndpoint
{
    private readonly IMediator _mediator;

    public GetOrderDetailsEndpoint(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Обработка GET /orders/{id}
    public async Task<IResult> HandleAsync(Guid id)
    {
        // Создаем запрос
        var query = new GetOrderDetailsQuery(id);

        // Отправляем запрос обработчику
        var result = await _mediator.Send(query);

        if (result is null)
            return Results.NotFound();

        return Results.Ok(result);
    }
}

// Запрос
public record GetOrderDetailsQuery(Guid OrderId)
    : IRequest<GetOrderDetailsResponse?>;

// Обработчик запроса
public class GetOrderDetailsHandler
    : IRequestHandler<GetOrderDetailsQuery, GetOrderDetailsResponse?>
{
    private readonly IOrderReadModel _orders;

    public GetOrderDetailsHandler(IOrderReadModel orders)
    {
        _orders = orders;
    }

    public async Task<GetOrderDetailsResponse?> Handle(
        GetOrderDetailsQuery query,
        CancellationToken cancellationToken)
    {
        // Здесь мы обращаемся к модели чтения
        var dto = await _orders.GetOrderDetailsAsync(query.OrderId);
        return dto;
    }
}

// Ответ
public record GetOrderDetailsResponse(
    Guid OrderId,
    string Status,
    decimal TotalAmount,
    List<OrderItemDto> Items);

public record OrderItemDto(
    Guid ProductId,
    string Name,
    int Quantity,
    decimal Price);
```

Как видите, вертикальный слайс описывает полный путь: от HTTP‑запроса до чтения из базы и формирования DTO.

---

## Вертикальные слайсы и доменная модель

### Где живет домен

Частый вопрос: «если все разложено по фичам, что делать с доменными сущностями и aggregate‑root‑ами?»

Варианты:

1. Вы храните доменную модель в отдельном пространстве (`Domain`), а вертикальные слайсы просто используют ее.
2. Для очень простых систем часть логики можно держать прямо в слайсах, но это подходит только для действительно небольших проектов.

В большинстве случаев домен — это отдельный слой, но он не нарушает идею vertical slices, потому что:

- доменные сущности переиспользуются разными фичами;
- слайсы остаются вертикальными от API до домена и данных;
- технические слои типа `Services` не становятся «божественными объектами».

### Пример связи с доменом

```csharp
// Папка Domain/Orders

public class Order
{
    private readonly List<OrderItem> _items = new();

    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    // Фабричный метод для создания заказа
    public static Order Create(Guid customerId, List<OrderItem> items)
    {
        if (items == null || items.Count == 0)
            throw new ArgumentException("Order must contain at least one item");

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var item in items)
        {
            order.AddItem(item.ProductId, item.Quantity, item.Price);
        }

        return order;
    }

    // Логика добавления позиции в заказ
    public void AddItem(Guid productId, int quantity, decimal price)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive");

        var item = new OrderItem(productId, quantity, price);
        _items.Add(item);
        RecalculateTotal();
    }

    private void RecalculateTotal()
    {
        TotalAmount = _items.Sum(i => i.Price * i.Quantity);
    }
}

// Позиция заказа
public class OrderItem
{
    public Guid ProductId { get; }
    public int Quantity { get; }
    public decimal Price { get; }

    public OrderItem(Guid productId, int quantity, decimal price)
    {
        ProductId = productId;
        Quantity = quantity;
        Price = price;
    }
}
```

Вертикальный слайс `CreateOrder` использует доменную модель `Order`, но не превращает слой `Application` в огромный сервис.

---

## Слой данных внутри вертикальных слайсов

### Разделение интерфейсов и реализаций

Частая практика:

- интерфейсы репозиториев или сервисов определяются в слое приложения (`Application` или `Features`);
- реализации живут в `Infrastructure`.

Это хорошо сочетается с vertical slices:

- интерфейс `IOrderRepository` можно вынести в `Shared/Abstractions/Orders`;
- конкретная реализация `EfCoreOrderRepository` или `MongoOrderRepository` лежит в `Infrastructure/Database`.

```csharp
// Папка Shared/Abstractions/Orders

public interface IOrderRepository
{
    Task AddAsync(Order order, CancellationToken cancellationToken = default);
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
```

Слайсы используют абстракции, не зная деталей реализации.

### Слайс и разные типы хранилищ

Иногда разные слайсы используют разные хранилища. Например:

- команды записи ходят в реляционную базу;
- запросы чтения — в специализированный read‑store (кеш, поисковый индекс, материализованное представление).

С vertical slices это делается естественно:

- `CreateOrder` использует `IOrderRepository` (write‑model);
- `GetOrderDetails` использует `IOrderReadModel` (read‑model).

Каждый слайс работает с тем хранилищем, которое ему нужно, и не тянет зависимости, которые он не использует.

---

## Тестирование вертикальных слайсов

### Юнит‑тесты обработчиков

Преимущество vertical slices — обработчики легко тестировать изолированно.

```csharp
// Пример юнит‑теста обработчика CreateOrderHandler

[Fact]
public async Task Handle_Should_Create_Order_For_Active_Customer()
{
    // Здесь мы создаем фейковые зависимости
    var orderRepo = new InMemoryOrderRepository();
    var customerService = new FakeCustomerService(isActive: true);

    var handler = new CreateOrderHandler(orderRepo, customerService);

    var command = new CreateOrderCommand(
        CustomerId: Guid.NewGuid(),
        Items: new List<CreateOrderItem>
        {
            new CreateOrderItem(Guid.NewGuid(), 2),
            new CreateOrderItem(Guid.NewGuid(), 1)
        });

    // Вызываем обработчик
    var result = await handler.Handle(command, CancellationToken.None);

    // Проверяем, что заказ создался
    Assert.NotEqual(Guid.Empty, result.OrderId);
    Assert.True(result.TotalAmount > 0);
    Assert.Single(orderRepo.Orders); // В репозитории должен быть один заказ
}
```

Комментарии:

- мы тестируем конкретный слайс;
- остальная система нас не интересует;
- зависимости подменяются фейками или моками.

### Интеграционные тесты с фокусом на фичу

Можно пойти дальше и сделать интеграционный тест для всего слайса:

- поднять in‑memory базу;
- стартовать приложение;
- отправить HTTP‑запрос на `/orders`;
- проверить состояние базы и ответ.

С vertical slices это особенно удобно: каждый тестовый кейс привязан к конкретной фиче и легко находит свой код.

---

## Плюсы и минусы подхода vertical slices

### Плюсы

1. **Фокус на бизнес‑функции.**  
   Вы смотрите на систему через призму «что она делает», а не «какие там слои».

2. **Локализация изменений.**  
   Изменения почти всегда ограничиваются одной папкой фичи.

3. **Улучшенная навигация по коду.**  
   Нужно понять, как работает «оплата счета» — идете в `Payments/PayInvoice`.

4. **Упрощенное тестирование.**  
   Каждый слайс — самостоятельная единица, которую легко покрыть тестами.

5. **Подготовка к модульному монолиту и микросервисам.**  
   Четко выделенные фичи проще потом вынести в отдельный сервис, если нужно.

6. **Меньше общих «божественных» сервисов.**  
   Сервисы не разрастаются до сотен методов на все случаи жизни.

### Минусы и ограничения

1. **Непривычная структура для команды.**  
   Если все привыкли к слоям `Controllers/Services/Repositories`, может потребоваться время на адаптацию.

2. **Риск дублирования.**  
   Когда каждая фича самодостаточна, часть кода может дублироваться. Это нормально до определенной степени, но важно не упустить моменты, когда дублирование становится избыточным.

3. **Нужно продумать границы фич.**  
   Если фичи определены слишком крупно, слайсы превращаются в монолиты внутри монолита. Если слишком мелко — появляется лишняя детализация.

4. **Совместимость с существующим монолитом.**  
   Перевод старого большого проекта на vertical slices требует аккуратной миграции: нельзя просто переименовать папки — меняется способ думать о коде.

---

## Как постепенно перейти к вертикальным слайсам

### Стратегия «новое по‑новому»

Самый простой путь:

- не трогать старые части системы;
- все новые фичи реализовывать как vertical slices;
- постепенно, при изменении старых участков, переносить их в новый формат.

Шаги:

1. Вводите папку `Features` или аналог.
2. Создаете первый слайс для новой фичи.
3. На ревью постепенно показываете команде, как с этим работать.
4. Постепенно выносите старые `Service`‑классы в фичи, если до них доходит очередь изменений.

### Стратегия «горизонтальный срез + декомпозиция»

Иногда имеет смысл выделить один крупный бизнес‑домен (например, `Orders`) и начать вертикальную декомпозицию только его:

- заводите `Features/Orders`;
- переносите туда все новые операции с заказами;
- старые слои оставляете как есть, пока они используются.

Так вы минимизируете риски и одновременно получаете реальный опыт работы с vertical slices на живом домене.

---

## Практические советы по внедрению vertical slices

### 1. Думайте в терминах use‑case

Прежде чем создавать папку/модуль, сформулируйте:

- что именно делает пользователь;
- как это действие будет называться (CreateOrder, PayInvoice, RegisterUser).

Название фичи должно быть понятным с точки зрения бизнеса, а не технологии.

### 2. Не бойтесь небольшого дублирования

Вертикальные слайсы допускают небольшое дублирование:

- похожие мапперы;
- повторяющиеся маленькие DTO;
- локальные проверки.

Это лучше, чем одна большая «общая» утилита, которая знает о половине системы. Позже, если дублирование станет заметным, вы сможете аккуратно выделить общий код.

### 3. Отделяйте инфраструктуру

Даже при vertical slices инфраструктуру лучше держать отдельно:

- реализации репозиториев;
- интеграции с внешними сервисами;
- настройки базы и очередей.

Фичи зависят от абстракций, а не от конкретной инфраструктуры. Это сохраняет тестируемость и гибкость.

### 4. Логика в обработчике, а не в контроллере

Контроллер или endpoint должен быть максимально тонким:

- распарсить вход;
- вызвать обработчик;
- упаковать результат в HTTP‑ответ.

Основная логика — в обработчике или домене. Тогда vertical slice действительно описывает сценарий, а не HTTP‑детали.

### 5. Старайтесь избегать кросс‑фичевых сервисов

Если вам хочется создать «CustomerService», который используется во всех фичах, остановитесь и задайте вопрос: действительно ли это общий сервис, или это признаки того, что фичи плохо отделены друг от друга?

Лучше:

- вынести только общую доменную логику в домен;
- оставить orchestration (сценарий шага за шагом) в каждом слайсе.

---

## Заключение

Подход вертикальные слайсы меняет точку зрения на архитектуру: вместо технических слоев вы ориентируетесь на бизнес‑сценарии. Каждый slice — это законченная функциональность: от входного запроса до записи в базу и формирования ответа.

Такой способ организации кода:

- упрощает навигацию и понимание системы;
- делает изменения более локальными;
- повышает тестируемость;
- помогает строить модульный монолит и готовиться к возможному выделению микросервисов.

При этом vertical slices не отменяют доменную модель, CQRS или инфраструктурный слой. Скорее, это способ собрать все эти части вокруг конкретного действия пользователя, а не вокруг слоев приложения.

Если вы начнете добавлять новые фичи в виде вертикальных слайсов, довольно быстро заметите, что поддержка таких участков кода становится проще по сравнению с традиционной слоеной архитектурой.

---

## Частозадаваемые технические вопросы и ответы

### Как организовать маршруты для vertical slices без огромного контроллера

Используйте регистрацию endpoint‑ов по фичам. Например, в .NET Minimal APIs:

```csharp
// Для каждой фичи создайте метод расширения
public static class OrdersEndpoints
{
    public static IEndpointRouteBuilder MapOrders(this IEndpointRouteBuilder app)
    {
        // Здесь вы регистрируете маршруты для заказов
        app.MapPost("/orders", (CreateOrderEndpoint e, CreateOrderRequest r) => e.HandleAsync(r));
        app.MapGet("/orders/{id}", (GetOrderDetailsEndpoint e, Guid id) => e.HandleAsync(id));
        return app;
    }
}
```

В `Program.cs` достаточно вызвать один метод `app.MapOrders()`.

### Как шарить транзакцию между несколькими слайсами в одном запросе

Лучше не вызывать несколько слайсов внутри одного HTTP‑запроса. Вместо этого:

1. Создайте отдельный слайс, который описывает целый сценарий.
2. Внутри него используйте доменные и инфраструктурные сервисы.
3. Транзакцию открывайте на уровне инфраструктуры (например, Unit of Work), привязанной к обработчику команды.

Тогда один слайс — одна транзакция, что проще отлаживать и тестировать.

### Как обрабатывать кросс‑срезовые доменные события

1. Определите доменное событие в слое домена (например, `OrderPaid`).
2. В инфраструктуре реализуйте публикацию этих событий (через шину событий или локальный диспетчер).
3. Обработчики событий можно оформить как отдельные слайсы или обработчики в соответствующих фичах (например, `Notifications/SendOrderPaidEmail`).

Так вы сохраняете вертикальность, но позволяете разным фичам реагировать на общие доменные события.

### Как бороться с дублированием DTO между разными фичами

Если дублирование действительно значимо:

1. Вынесите общий DTO в `Shared` или `Contracts` (например, контракты между сервисами).
2. Внутри слайса используйте маппинг из доменных моделей в эти общие DTO.
3. Старайтесь не превращать `Shared` в свалку — добавляйте туда только действительно стабильные и общие типы.

### Как применить vertical slices в Go с учетом пакетов

В Go удобно использовать пакеты для фич. Например:

- `internal/orders/create`
- `internal/orders/details`

В пакете `create` держите:

- тип команды;
- хендлер HTTP;
- логику работы через интерфейсы репозиториев;
- локальные DTO.

В пакете `details` — свои структуры. Общие интерфейсы (например, `OrderRepository`) вынесите в `internal/orders` или `internal/domain/orders`. В `main.go` вы регистрируете роуты, вызывая функции из пакетов фич, например `create.RegisterRoutes(router)`.