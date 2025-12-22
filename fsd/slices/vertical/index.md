---
metaTitle: Вертикальные слайсы vertical-slices в архитектуре приложений
metaDescription: Подробное объяснение подхода вертикальные слайсы vertical-slices в архитектуре приложений - принципы организации кода примеры и рекомендации по внедрению
author: Олег Марков
title: Вертикальные слайсы vertical-slices - практическое руководство для разработчиков
preview: Разберитесь что такое вертикальные слайсы vertical-slices - зачем они нужны и как с их помощью упростить архитектуру и ускорить разработку крупных приложений
---

## Введение

Вертикальные слайсы (vertical-slices) — это подход к организации кода, при котором вы группируете файлы и модули по функциональным возможностям, а не по техническим слоям. То есть вы собираете в одном месте все, что относится к одной конкретной фиче, вместо того чтобы раскладывать код по папкам контроллеров, сервисов, репозиториев и т. п.

Смотрите, как это обычно бывает в классическом слоёном подходе:

- папка controllers
- папка services
- папка repositories
- папка models
- папка dto

Каждый новый разработчик, чтобы внести изменение в одну простую бизнес-функцию, вынужден «прыгать» по разным слоям и файлам, искать связи, помнить соглашения. Со временем это замедляет работу и усложняет сопровождение.

Подход с вертикальными слайсами предлагает другой путь. Вы организуете код вокруг сценариев использования и функциональных возможностей:

- слайс Users
- слайс Orders
- слайс Billing
- слайс Auth

Внутри каждого слайса — всё, что нужно, чтобы эта функциональность работала: контроллеры, хендлеры, модели, команды, запросы, валидация и т. д.

В этой статье вы увидите, как это устроено в теории и на практике, с примерами кода и советами по миграции с классической слоёной архитектуры.

---

## Что такое вертикальный слайс

### Основная идея

Вертикальный слайс — это автономный модуль, реализующий законченную бизнес-возможность. Внутри него находится:

- входная точка (HTTP-хендлер, контроллер, обработчик события, CLI-команда)
- бизнес-логика, специфичная для сценария
- инфраструктурные детали, необходимые только для этого сценария
- контракты (DTO, команды/запросы), понятные только этому слайсу

Давайте сформулируем более строго:

**Вертикальный слайс** — это кусок системы, который:

1. Решает одну понятную задачу в терминах домена.
2. Минимизирует внешние зависимости.
3. Содержит полный путь данных от входа (endpoint) до выхода (ответ или событие).

Как следствие:

- меньше связей между частями системы
- проще удалять или переписывать отдельные фичи
- легче удерживать в голове контекст изменения

### Сравнение со слоёной архитектурой

Посмотрите на типичный слоёный подход в условном веб-приложении (на примере C# / ASP.NET Core, но идея универсальна):

```csharp
// Controllers/UsersController.cs
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(CreateUserDto dto)
    {
        // Здесь контроллер только делегирует в сервис
        var userId = await _service.CreateUserAsync(dto);
        return Ok(new { id = userId });
    }
}
```

```csharp
// Services/UserService.cs
public class UserService : IUserService
{
    private readonly IUserRepository _repository;

    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }

    public Task<Guid> CreateUserAsync(CreateUserDto dto)
    {
        // Здесь сервис делегирует в репозиторий
        var user = new User(dto.Email, dto.Name);
        return _repository.AddAsync(user);
    }
}
```

```csharp
// Repositories/UserRepository.cs
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public Task<Guid> AddAsync(User user)
    {
        // Работа с базой данных
        _db.Users.Add(user);
        return _db.SaveChangesAsync().ContinueWith(_ => user.Id);
    }
}
```

Создание одного пользователя разбросано по разным слоям. Если вы хотите изменить сценарий — вам приходится открывать несколько файлов и держать в голове, как связаны интерфейсы и классы.

Теперь давайте посмотрим на то же самое через вертикальный слайс.

---

## Структура проекта с вертикальными слайсами

### Пример структуры папок

Для наглядности возьмём веб-приложение. Структура при vertical-slices может выглядеть так:

- Api
  - Users
    - Create
      - CreateUserEndpoint.cs
      - CreateUserCommand.cs
      - CreateUserHandler.cs
      - CreateUserValidator.cs
    - Get
      - GetUserEndpoint.cs
      - GetUserQuery.cs
      - GetUserHandler.cs
  - Orders
    - Create
    - Get
- Domain
  - Users
    - User.cs
  - Orders
    - Order.cs
- Infrastructure
  - Persistence
  - ExternalServices

Здесь логика создания пользователя вынесена в отдельный мини-модуль `Users/Create`. Вся связанная с этим кодовая база располагается вместе.

### Ключевые принципы структуры

1. **Группировка по фичам, а не по слоям**  
   Важным становится вопрос «что умеет система», а не «как она это делает технически».

2. **Минимальная «утечка» деталей наружу**  
   DTO, команды, валидаторы, специфичные для конкретного сценария, не используются в других слайсах.

3. **Явные зависимости**  
   Если один слайс всё же зависит от другого, это видно по структуре импортов и по архитектурным правилам.

---

## Пример vertical-slice на практике

Давайте разберём законченный пример для сценария «Создать пользователя» в стиле vertical-slices.

### Описание задачи

Нам нужно:

- endpoint POST `/api/users`
- принять данные: Email, Name, Password
- провалидировать
- создать пользователя в базе
- вернуть идентификатор

### DTO и команда

Теперь вы увидите, как это выглядит в коде. Начнём с команды.

```csharp
// Api/Users/Create/CreateUserCommand.cs

// Эта запись описывает входные данные для сценария "Создать пользователя"
public record CreateUserCommand(
    string Email,
    string Name,
    string Password);
```

Важно отметить: эта команда живёт только внутри слайса `Users/Create`. Она не обязательно должна быть доступна другим частям системы.

### Валидатор

Давайте добавим валидацию. Здесь я размещаю пример с использованием FluentValidation, но можно использовать любую библиотеку.

```csharp
// Api/Users/Create/CreateUserValidator.cs

using FluentValidation;

// Валидатор командного объекта CreateUserCommand
public class CreateUserValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidator()
    {
        // Проверяем email на пустоту и корректный формат
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        // Проверяем имя на минимальную длину
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(2);

        // Проверяем пароль на минимальную длину
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6);
    }
}
```

Как видите, валидатор расположен рядом с командой, а не в общей папке `Validators`.

### Handler (обработчик команды)

Теперь реализация бизнес-логики.

```csharp
// Api/Users/Create/CreateUserHandler.cs

using Domain.Users;
using Infrastructure.Persistence;

// Обработчик команды CreateUserCommand
public class CreateUserHandler
{
    private readonly AppDbContext _db;

    public CreateUserHandler(AppDbContext db)
    {
        _db = db;
    }

    // Метод, который выполняет сценарий создания пользователя
    public async Task<Guid> Handle(CreateUserCommand command, CancellationToken ct = default)
    {
        // Создаем доменную модель пользователя
        var user = new User(
            email: command.Email,
            name: command.Name,
            passwordHash: HashPassword(command.Password));

        // Добавляем пользователя в контекст базы данных
        _db.Users.Add(user);

        // Сохраняем изменения в базе
        await _db.SaveChangesAsync(ct);

        // Возвращаем идентификатор созданного пользователя
        return user.Id;
    }

    private string HashPassword(string password)
    {
        // Здесь размещаем примитивный пример хеширования
        // В реальном приложении вместо этого используйте безопасную библиотеку
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password));
    }
}
```

Обратите внимание:

- handler знает только то, что нужно для сценария создания пользователя;
- никакого лишнего интерфейсного слоя, если он не нужен;
- работа с доменной моделью `User` остаётся централизованной в `Domain.Users`.

### Endpoint (точка входа HTTP)

Теперь давайте перейдём к endpoint, который принимает HTTP-запрос и превращает его в команду.

```csharp
// Api/Users/Create/CreateUserEndpoint.cs

using Microsoft.AspNetCore.Mvc;
using FluentValidation;

// Контроллер, реализующий endpoint для создания пользователя
[ApiController]
[Route("api/users")]
public class CreateUserEndpoint : ControllerBase
{
    private readonly CreateUserHandler _handler;
    private readonly IValidator<CreateUserCommand> _validator;

    public CreateUserEndpoint(
        CreateUserHandler handler,
        IValidator<CreateUserCommand> validator)
    {
        _handler = handler;
        _validator = validator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command, CancellationToken ct)
    {
        // Сначала валидируем входные данные
        var validationResult = await _validator.ValidateAsync(command, ct);

        if (!validationResult.IsValid)
        {
            // Если валидация не прошла - возвращаем 400 с описанием ошибок
            return BadRequest(validationResult.Errors);
        }

        // Если все хорошо - вызываем обработчик сценария
        var userId = await _handler.Handle(command, ct);

        // Возвращаем 201 с Location на новый ресурс
        return CreatedAtRoute(
            routeName: "GetUserById",
            routeValues: new { id = userId },
            value: new { id = userId });
    }
}
```

В этом примере:

- endpoint не содержит бизнес-логики;
- он только:
  - принимает HTTP-запрос,
  - мапит его на команду,
  - вызывает валидатор,
  - передаёт команду в handler,
  - формирует HTTP-ответ.

Сценарий создания пользователя полностью замкнут в директории `Users/Create`.

---

## Преимущества вертикальных слайсов

### Локализация изменений

Когда вы добавляете или изменяете фичу, вам в основном нужно работать с одним слайсом. Это значительно снижает когнитивную нагрузку.

Например, чтобы изменить бизнес-правило создания пользователя, вы:

- открываете `CreateUserHandler.cs`
- при необходимости — `CreateUserValidator.cs`
- иногда — `User.cs` в домене

Вам не нужно:

- пробегать по общей папке сервисов, чтобы понять, кто ещё использует этот метод;
- опасаться, что изменения затронут другие сценарии.

### Упрощённое тестирование

Смотрите, как проще тестировать vertical-slice. У вас есть:

- handler, который:
  - принимает команду
  - возвращает результат
- отдельный валидатор
- endpoint, который можно тестировать отдельно на уровне HTTP

Вместо крупных интеграционных тестов всего сервиса вы можете:

- писать unit-тесты для handler'ов;
- отдельно проверять валидацию;
- точечно тестировать HTTP-слой.

### Понятное масштабирование команды

Когда вы распределяете задачи между разработчиками, вы можете выдавать им слайсы:

- разработчик А отвечает за Users
- разработчик B — за Orders
- разработчик C — за Billing

Каждый больше времени проводит в «своей» части кода и реже залезает в чужие области.

---

## Связь vertical-slices с другими архитектурными подходами

### Vertical-slices и CQRS

Часто vertical-slices сочетают с идеей CQRS (Command Query Responsibility Segregation), разделяя:

- команды (изменение состояния)
- запросы (чтение состояния)

Пример структуры:

- Users
  - Commands
    - Create
    - Update
    - Delete
  - Queries
    - GetById
    - GetList

Внутри каждого подмодуля — своя команда/запрос, свой handler, свои DTO. Давайте посмотрим на простой пример запроса.

```csharp
// Api/Users/Get/GetUserQuery.cs

// Объект запроса на получение пользователя по Id
public record GetUserQuery(Guid Id);
```

```csharp
// Api/Users/Get/GetUserHandler.cs

using Infrastructure.Persistence;

public class GetUserHandler
{
    private readonly AppDbContext _db;

    public GetUserHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserDto?> Handle(GetUserQuery query, CancellationToken ct = default)
    {
        // Здесь мы выбираем пользователя по Id и мапим его в DTO
        var user = await _db.Users
            .Where(u => u.Id == query.Id)
            .Select(u => new UserDto(
                u.Id,
                u.Email,
                u.Name))
            .FirstOrDefaultAsync(ct);

        // Если пользователь не найден - возвращаем null
        return user;
    }
}

// DTO для отдачи данных наружу
public record UserDto(Guid Id, string Email, string Name);
```

```csharp
// Api/Users/Get/GetUserEndpoint.cs

[ApiController]
[Route("api/users")]
public class GetUserEndpoint : ControllerBase
{
    private readonly GetUserHandler _handler;

    public GetUserEndpoint(GetUserHandler handler)
    {
        _handler = handler;
    }

    [HttpGet("{id:guid}", Name = "GetUserById")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        // Формируем запрос для handler'а
        var query = new GetUserQuery(id);

        // Выполняем запрос
        var result = await _handler.Handle(query, ct);

        if (result is null)
        {
            // Если пользователя нет - возвращаем 404
            return NotFound();
        }

        // Если пользователь есть - возвращаем 200 с данными
        return Ok(result);
    }
}
```

Так вы чётко разделяете сценарии чтения и записи, но при этом каждый сценарий остаётся вертикальным слайсом.

### Vertical-slices и Clean Architecture / Hexagonal

Vertical-slices легко комбинируются с Clean Architecture и гексагональной архитектурой:

- доменные модели и общие абстракции живут в слое Domain
- инфраструктура (БД, внешние сервисы) — в Infrastructure
- каждый вертикальный слайс использует домен и инфраструктурные порты, не нарушая общие границы

При этом вы по-прежнему группируете код приложений по фичам, а не по слоям.

---

## Переход от слоёной архитектуры к vertical-slices

### Подход «сначала новые фичи»

Самый безопасный способ — не переписывать всё сразу, а:

1. Оставить существующую слоёную структуру нетронутой.
2. Для новых фич создавать вертикальные слайсы.
3. Постепенно выносить существующие сценарии в новые слайсы при доработках.

Например:

- старые контроллеры продолжают жить в `Controllers/`
- новые endpoint'ы вы делаете в `Features/Users/Create`, `Features/Orders/Create` и т. д.
- по мере рефакторинга переносите логику в handler'ы внутри слайсов

### План действий по шагам

Давайте разберёмся на шаги:

1. Выделите первую фичу, которую удобно отрезать вертикальным слайсом.
2. Создайте папку `Features/<Context>/<UseCase>` (или `Api/<Context>/<UseCase>`).
3. Перенесите:
   - DTO, которые используются только здесь;
   - сервисные методы, специфичные для этого сценария;
   - валидацию.
4. Оставшиеся общие сервисы постепенно разбивайте на более мелкие.
5. Добавьте правила архитектуры (например, с помощью специальных анализаторов), чтобы:
   - слайсы не зависели друг от друга напрямую
   - UI (контроллеры) зависели только от handler'ов и домена

---

## Организация зависимостей между слайсами

### Когда слайсы не должны знать друг о друге

Хорошее правило: по возможности вертикальные слайсы не должны напрямую обращаться друг к другу. Если нужно повторно использовать логику — вынесите её:

- в доменный слой (если это чистая бизнес-логика)
- в общий сервисный слой, но с явно ограниченным API

Например, если и `Orders`, и `Billing` должны проверять наличие пользователя — вынесите проверку в доменную модель или доменный сервис.

### Когда связь всё-таки нужна

Бывают случаи, когда один сценарий должен вызвать другой. Здесь есть варианты:

1. Использовать доменные события или события интеграции  
   Пример: при создании заказа публикуется событие `OrderCreated`, а слайс Billing подписывается на него.

2. Использовать application-service, который «склеивает» несколько слайсов  
   Такой сервис живёт выше, чем отдельные слайсы, и координирует сложный сценарий.

Старайтесь избегать ситуации, когда один handler создаёт команды для другого handler'а напрямую. Это увеличивает связанность и усложняет понимание.

---

## Практические рекомендации по именованию и структуре

### Именование директорий

Чаще всего используется такой паттерн:

- Features (или Api)
  - Users
    - Create
    - Get
    - Update
    - Delete
  - Orders
    - Create
    - Get
    - Cancel

Внутри `Create` можно держать:

- CreateUserCommand
- CreateUserHandler
- CreateUserValidator
- CreateUserEndpoint
- CreateUserMapping (если нужна отдельная маппинг-логика)

### Именование классов

Чтобы не запутаться, придерживайтесь однообразных суффиксов:

- `*Command` для команд
- `*Query` для запросов
- `*Handler` для обработчиков
- `*Validator` для валидаторов
- `*Endpoint` или `*Controller` для HTTP-слоя

Так, открыв папку `Users/Create`, вы сразу видите все части слайса:

- `CreateUserCommand.cs`
- `CreateUserHandler.cs`
- `CreateUserValidator.cs`
- `CreateUserEndpoint.cs`

---

## Расширенный пример: вертикальный слайс в более сложном сценарии

Теперь давайте посмотрим, что происходит, если сценарий чуть сложнее. Допустим, при создании заказа нужно:

- проверить, что пользователь существует
- проверить, что товары доступны
- посчитать итоговую сумму
- сохранить заказ в базе
- отправить событие в очередь (например, для биллинга)

### Команда

```csharp
// Api/Orders/Create/CreateOrderCommand.cs

// Команда на создание заказа
public record CreateOrderCommand(
    Guid UserId,
    IReadOnlyList<OrderItemDto> Items);

// DTO для одного элемента заказа
public record OrderItemDto(Guid ProductId, int Quantity);
```

### Handler с несколькими зависимостями

```csharp
// Api/Orders/Create/CreateOrderHandler.cs

using Domain.Orders;
using Domain.Users;
using Infrastructure.Persistence;
using Infrastructure.Messaging;

// Обработчик сценария "Создать заказ"
public class CreateOrderHandler
{
    private readonly AppDbContext _db;
    private readonly IMessageBus _bus;

    public CreateOrderHandler(AppDbContext db, IMessageBus bus)
    {
        _db = db;
        _bus = bus;
    }

    public async Task<Guid> Handle(CreateOrderCommand command, CancellationToken ct = default)
    {
        // 1. Проверяем наличие пользователя в системе
        var userExists = await _db.Users
            .AnyAsync(u => u.Id == command.UserId, ct);

        if (!userExists)
        {
            // Если пользователь не найден - выбрасываем доменное исключение
            throw new UserNotFoundException(command.UserId);
        }

        // 2. Загружаем товары и проверяем их доступность
        var productIds = command.Items.Select(i => i.ProductId).ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(ct);

        if (products.Count != productIds.Count)
        {
            // Если какие-то товары не найдены - выбрасываем исключение
            throw new ProductNotAvailableException();
        }

        // 3. Создаём доменную модель заказа
        var order = Order.Create(
            userId: command.UserId,
            items: command.Items.Select(i =>
            {
                var product = products.First(p => p.Id == i.ProductId);

                // Здесь мы создаем позицию заказа, используя цену продукта
                return new OrderItem(
                    productId: product.Id,
                    quantity: i.Quantity,
                    unitPrice: product.Price);
            }).ToList());

        // 4. Сохраняем заказ в базе
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        // 5. Публикуем событие для других сервисов
        var @event = new OrderCreatedEvent(order.Id, order.UserId, order.TotalAmount);
        await _bus.PublishAsync(@event, ct);

        // 6. Возвращаем идентификатор заказа
        return order.Id;
    }
}
```

В этом обработчике вы видите:

- логику проверки входных данных (существует ли пользователь, есть ли товары)
- использование доменных моделей `Order` и `OrderItem`
- интеграцию с инфраструктурой (база данных и шина сообщений)

Всё это — часть одного вертикального слайса `Orders/Create`.

---

## Как тестировать vertical-slices

### Тесты для handler'ов

Тестировать handler'ы удобно, потому что они:

- принимают конкретную команду
- возвращают понятный результат

Вы можете подменять зависимости (БД, шину сообщений) тестовыми реализациями.

Пример простого теста для `CreateUserHandler` на C# (xUnit):

```csharp
// Тест проверяет, что при корректных данных пользователь создается

[Fact]
public async Task Handle_ShouldCreateUser_WhenDataIsValid()
{
    // Здесь мы создаем in-memory контекст базы данных
    var db = TestDbContextFactory.CreateInMemory();

    // Создаем экземпляр обработчика с тестовым контекстом
    var handler = new CreateUserHandler(db);

    // Формируем команду с корректными данными
    var command = new CreateUserCommand(
        Email: "test@example.com",
        Name: "Test User",
        Password: "123456");

    // Вызываем метод Handle
    var userId = await handler.Handle(command);

    // Проверяем, что пользователь действительно появился в базе
    var user = await db.Users.FindAsync(userId);

    Assert.NotNull(user);
    Assert.Equal("test@example.com", user!.Email);
}
```

### Тесты для валидаторов

Валидацию имеет смысл тестировать отдельно, чтобы не смешивать её с бизнес-логикой.

```csharp
// Тест проверяет, что пустой email не проходит валидацию

[Fact]
public async Task Validator_ShouldFail_WhenEmailIsEmpty()
{
    // Создаем экземпляр валидатора
    var validator = new CreateUserValidator();

    // Формируем команду с пустым email
    var command = new CreateUserCommand(
        Email: "",
        Name: "Test",
        Password: "123456");

    // Запускаем валидацию
    var result = await validator.ValidateAsync(command);

    // Проверяем, что валидация не прошла
    Assert.False(result.IsValid);
}
```

Тесты становятся компактными и сфокусированными.

---

## Когда vertical-slices дают наибольшую пользу

Vertical-slices особенно хорошо работают, когда:

- у вас растущий монолит с большим количеством эндпоинтов;
- команда увеличивается, и стало сложно координировать изменения в общих сервисах;
- в проекте много бизнес-сценариев, но они относительно слабо связаны между собой;
- вы хотите постепенно двигаться в сторону модульного монолита или микросервисов.

Если архитектура изначально построена строго слоёно, и в каждом слое тысячи файлов, переход потребует планомерной работы, но результатом будет более понятная структура, ориентированная на потребности бизнеса.

---

## Заключение

Подход с вертикальными слайсами помогает по-новому посмотреть на архитектуру приложения. Вместо того чтобы группировать код по техническим слоям, вы группируете его по бизнес-функциям. Это делает:

- структуру проекта ближе к языку домена;
- изменения более локализованными;
- тестирование более простым и изолированным;
- масштабирование команды более предсказуемым.

Вертикальные слайсы хорошо сочетаются с CQRS, Clean Architecture и доменно-ориентированным подходом. Вы можете внедрять их постепенно: сначала для новых фич, затем — для рефакторинга существующих сценариев.

Главная мысль, которую стоит унести — каждая фича может быть самостоятельным мини-модулем, где рядом находятся endpoint, команда/запрос, handler, валидация и специфичные для этой фичи модели. Такой способ организации кода помогает держать весь сценарий «в голове» и уменьшает количество скрытых связей в системе.

---

## Частозадаваемые технические вопросы

### Как настроить DI-контейнер при использовании vertical-slices

Обычно вы регистрируете handler'ы и валидаторы автоматически по сборкам.  
Мини-инструкция:

1. В корневом проекте добавьте сканирование сборки с фичами.
2. Используйте метод, который ищет все классы с суффиксом `Handler` и регистрирует их как `Transient` или `Scoped`.
3. Для валидаторов зарегистрируйте все реализации `IValidator<T>` через аналогичное сканирование.

### Как ограничить зависимости между слайсами на уровне компиляции

Часто используют архитектурные тесты или анализаторы.  
Схема действий:

1. Подключите библиотеку для архитектурных тестов (например, NetArchTest в .NET).
2. Напишите правило: классы из `Features.*` не могут зависеть от других `Features.*`.
3. Запускайте эти тесты в CI, чтобы новые зависимости не просочились в код.

### Как поступить с общими DTO, которые нужны в нескольких слайсах

Если DTO действительно общий и отражает доменную сущность:

1. Вынесите его в общий проект `Contracts` или `Shared`.
2. Явно укажите, что это публичный контракт.
3. Внутри слайсов используйте маппинг между внутренними моделями и этим DTO, чтобы не тянуть в слайс лишние поля.

### Как разделять ответственность между доменной моделью и handler'ом слайса

Ориентируйтесь на правило:

- доменная модель отвечает за инварианты и бизнес-правила;
- handler отвечает за оркестровку — загрузку данных, вызовы домена, сохранение, публикацию событий.

Если в handler'е начинает появляться логика, похожая на бизнес-правила (например сложные проверки состояний) — перенесите её в домен.

### Как внедрить vertical-slices в существующий микросервис

Действуйте по шагам:

1. Не меняйте границы микросервиса — меняйте только внутреннюю структуру.
2. Для новых endpoint'ов создавайте папки `Features/<Context>/<UseCase>`.
3. Для старых контроллеров постепенно выносите методы в handler'ы и складывайте их в соответствующие слайсы.
4. Когда для одного контроллера будет вынесено всё — перенесите файл в папку фичи или замените его на более компактный endpoint.