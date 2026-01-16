---
metaTitle: Слайс модели model-slice в Go
metaDescription: Подробное руководство по работе со слайсами модели model-slice в Go - управление динамическими коллекциями данных методы фильтрации пагинации и оптимизации
author: Олег Марков
title: Слайс модели model-slice в Go - концепции и практические примеры
preview: Разбор подхода model-slice в Go - как проектировать и использовать слайсы моделей для CRUD операций фильтрации постраничной выборки и валидации данных
---

## Введение

Слайс моделей, или подход model-slice, — это практический паттерн, когда вы работаете не с одной сущностью, а с коллекцией однотипных моделей, представленных срезом. Например, `[]User`, `[]Order`, `[]Product`. В Go срезы уже являются базовым инструментом, но как только речь заходит о прикладных задачах — выборка из базы, фильтрация, пагинация, валидация — возникает вопрос: как структурировать работу с коллекциями моделей так, чтобы код был понятным, расширяемым и не расползался по проекту.

Здесь я покажу вам, как можно строить архитектуру вокруг model-slice, какие типы и методы удобно выделять, как писать вспомогательные функции и избегать типичных ошибок с памятью и производительностью.

Мы будем опираться на стандартные возможности Go (срезы, методы, структуры, дженерики) и рассматривать model-slice скорее как архитектурный прием, чем как конкретную библиотеку.

## Что такое model-slice и зачем он нужен

### Базовая идея

Подход model-slice можно описать так:

- у вас есть модель, например `User`;
- основная единица работы при чтении и обработке — не один `User`, а множество пользователей;
- вы явно выделяете тип и слой логики для `[]User`, чтобы:
  - централизовать операции над коллекцией;
  - скрыть технические детали (фильтрация, сортировка, пагинация);
  - не дублировать код в разных местах.

Давайте разберемся на простом примере модели пользователя.

```go
// User - базовая модель
type User struct {
    ID    int64
    Name  string
    Email string
    Age   int
}

// Users - слайс моделей User
type Users []User
```

Здесь `Users` — это тип-обертка над `[]User`. Казалось бы, это просто псевдоним, но он позволяет:

- определять методы для коллекции;
- явно разделять ответственность: `User` отвечает за одну запись, `Users` — за операции с набором записей.

Теперь вы увидите, как это выглядит в коде, когда мы начнем добавлять метody.

### Где используется model-slice

Слайс модели особенно полезен в следующих местах:

- слой доступа к данным (репозитории);
- бизнес-логика, где обрабатывается набор сущностей (например, списки заказов);
- API-слой, где нужно отдавать списки в JSON, с пагинацией и фильтрами.

Например, вы можете описать интерфейс репозитория так:

```go
// UserRepository - интерфейс работы с пользователями
type UserRepository interface {
    GetByID(ctx context.Context, id int64) (*User, error)
    List(ctx context.Context, filter UserFilter) (Users, error)
    Save(ctx context.Context, u *User) error
}
```

Метод `List` сразу возвращает `Users`, а не `[]User`. Это даёт вам возможность навесить дополнительные методы на коллекцию, например: `FilterAdults`, `SortByName`, `Paginate` и т.д.

## Дизайн типов для model-slice

### Тип-обертка или чистый []T

Есть два подхода:

1. Всегда использовать голый `[]User`.
2. Вводить тип `Users []User` и работать с ним.

Смотрите, я покажу вам, в чем разница на практике.

#### Подход с голым []User

```go
func FilterAdults(users []User) []User {
    var res []User
    for _, u := range users {
        if u.Age >= 18 {
            res = append(res, u)
        }
    }
    return res
}
```

Плюсы:

- не нужно дополнительного типа;
- привычно для тех, кто только начал изучать Go.

Минусы:

- функции не сгруппированы вокруг одного типа;
- легко потерять структуру: в проекте много функций, работающих с `[]User`, разбросанных по пакетам.

#### Подход с типом Users

```go
type Users []User

// FilterAdults - возвращает только взрослых пользователей
func (us Users) FilterAdults() Users {
    var res Users
    for _, u := range us {
        if u.Age >= 18 {
            res = append(res, u)
        }
    }
    return res
}
```

Плюсы:

- методы группируются вокруг `Users`;
- код становится более читаемым и самодокументируемым;
- IDE и автодополнение подсказывают, какие операции доступны для коллекции.

Минусы:

- немного больше "шума" в объявлениях типов;
- нужно явно конвертировать `[]User` → `Users` в некоторых местах, хотя обычно это делается автоматически при присваивании и возвращении из функций.

Для больших проектов подход с `Users` почти всегда оказывается удобнее. В этой статье дальше я буду использовать именно его.

### Именование и пакетная структура

Частый практический вопрос — куда класть тип слайса моделей.

Один из простых вариантов:

- пакет `model` или `domain` содержит:
  - `user.go` — модель `User` и тип `Users`;
  - `order.go` — модель `Order` и тип `Orders` и т.д.

Пример:

```go
// файл model/user.go
package model

type User struct {
    ID    int64
    Name  string
    Email string
    Age   int
}

type Users []User
```

Так вы всегда знаете, где искать и одиночную модель, и её слайс.

## Базовые операции над слайсом моделей

Теперь давайте посмотрим, как организовать типичные операции над слайсом модели: добавление, поиск, удаление, фильтрация, преобразование.

### Добавление и удаление элементов

```go
// Add - добавляет нового пользователя в коллекцию
func (us *Users) Add(u User) {
    // Используем указатель на Users, чтобы изменять исходный слайс
    *us = append(*us, u)
}

// DeleteByID - удаляет пользователя по ID
func (us *Users) DeleteByID(id int64) bool {
    // Ищем индекс пользователя с нужным ID
    idx := -1
    for i, u := range *us {
        if u.ID == id {
            idx = i
            break
        }
    }
    if idx == -1 {
        // Пользователь не найден
        return false
    }

    // Удаляем элемент из слайса без сохранения порядка
    // Это более эффективно, чем сдвиг всего хвоста
    lastIdx := len(*us) - 1
    (*us)[idx] = (*us)[lastIdx] // Переносим последний элемент на место удаленного
    *us = (*us)[:lastIdx]       // Укорачиваем слайс
    return true
}
```

Обратите внимание, почему здесь используется указатель `*Users`:

- при добавлении или удалении длина слайса меняется, слайс может перераспределить память;
- чтобы вызвать `Add` и `DeleteByID` и получить изменение в исходной коллекции, мы работаем с указателем на срез.

### Поиск элементов

Теперь давайте добавим методы поиска.

```go
// FindByID - возвращает указатель на пользователя с нужным ID
func (us Users) FindByID(id int64) *User {
    for i := range us {
        if us[i].ID == id {
            return &us[i] // Возвращаем указатель на найденный элемент
        }
    }
    return nil
}

// ExistsByEmail - проверяет, есть ли пользователь с таким email
func (us Users) ExistsByEmail(email string) bool {
    for _, u := range us {
        if u.Email == email {
            return true
        }
    }
    return false
}
```

Здесь я размещаю пример, чтобы вам было проще понять, как отличать методы, которые:

- читают коллекцию (получают `Users` по значению — без `*`);
- изменяют коллекцию (получают `*Users`).

### Фильтрация и маппинг

В реальном коде вам часто нужно отфильтровать коллекцию по критериям или преобразовать её в другой тип (например, DTO для API).

```go
// Filter - универсальный метод фильтрации с функцией-предикатом
func (us Users) Filter(pred func(User) bool) Users {
    var res Users
    for _, u := range us {
        if pred(u) {
            res = append(res, u)
        }
    }
    return res
}

// MapToIDs - возвращает слайс ID всех пользователей
func (us Users) MapToIDs() []int64 {
    ids := make([]int64, 0, len(us))
    for _, u := range us {
        ids = append(ids, u.ID)
    }
    return ids
}
```

Теперь давайте перейдем к примеру использования этих методов:

```go
// Пример использования
func Example() {
    us := Users{
        {ID: 1, Name: "Alice", Age: 17},
        {ID: 2, Name: "Bob", Age: 25},
        {ID: 3, Name: "Charlie", Age: 30},
    }

    adults := us.Filter(func(u User) bool {
        // Фильтруем только взрослых
        return u.Age >= 18
    })

    ids := adults.MapToIDs()
    fmt.Println(ids) // [2 3]
}
```

Как видите, такой набор методов позволяет писать код, который довольно близок к "языку домена": `users.Filter(...).MapToIDs()`.

## Пагинация и сортировка с model-slice

Работа с коллекциями моделей почти всегда связана с пагинацией и сортировкой. Покажу вам, как это реализовано на практике.

### Простая пагинация в памяти

Пагинация на уровне слайса — это операция выборки подмножества элементов по смещению и лимиту.

```go
// Paginate - возвращает слайс для заданной страницы
func (us Users) Paginate(offset, limit int) Users {
    if offset < 0 {
        offset = 0
    }
    if limit <= 0 {
        // Если лимит некорректен, возвращаем пустой результат
        return Users{}
    }

    if offset >= len(us) {
        // Если смещение за пределами - возвращаем пустой слайс
        return Users{}
    }

    end := offset + limit
    if end > len(us) {
        end = len(us)
    }

    // Важно - мы возвращаем слайс, который ссылается на те же данные
    // Если нужно "отвязать" его от исходного, можно скопировать
    return us[offset:end]
}
```

Если вам нужен независимый слайс с копией элементов, можно добавить метод:

```go
// Clone - создает полную копию коллекции
func (us Users) Clone() Users {
    res := make(Users, len(us))
    copy(res, us) // Копируем элементы в новый слайс
    return res
}
```

Тогда пагинацию можно реализовать с копированием:

```go
func (us Users) PaginateCopy(offset, limit int) Users {
    page := us.Paginate(offset, limit)
    return page.Clone()
}
```

### Сортировка коллекции моделей

Для сортировки мы можем использовать пакет `sort` и интерфейс `sort.Interface`.

```go
// ByAge - тип, реализующий sort.Interface для сортировки по возрасту
type ByAge Users

func (a ByAge) Len() int           { return len(a) }
func (a ByAge) Less(i, j int) bool { return a[i].Age < a[j].Age }
func (a ByAge) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

// SortByAge - сортирует коллекцию по возрасту (по возрастанию)
func (us Users) SortByAge() {
    // Здесь мы приводим Users к типу ByAge, чтобы использовать sort.Sort
    sort.Sort(ByAge(us))
}
```

Теперь давайте посмотрим, что происходит в примере использования:

```go
func ExampleSort() {
    us := Users{
        {ID: 1, Name: "Alice", Age: 30},
        {ID: 2, Name: "Bob", Age: 20},
        {ID: 3, Name: "Charlie", Age: 25},
    }

    us.SortByAge()
    // Теперь порядок будет Bob (20), Charlie (25), Alice (30)
}
```

Если вы используете Go версии 1.21+, можно воспользоваться `slices.SortFunc`, но общий подход остается тем же: выделяете метод сортировки прямо на типе `Users`.

## Использование model-slice в слое доступа к данным

Теперь давайте перейдем к следующему шагу и посмотрим, как слайс модели живет в слое репозиториев. Я покажу пример с условной работой через драйвер базы данных.

### Репозиторий, возвращающий слайс моделей

```go
type UserFilter struct {
    MinAge int
    MaxAge int
    Limit  int
    Offset int
}

type UserRepository interface {
    List(ctx context.Context, f UserFilter) (Users, error)
}

type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}
```

Теперь реализация метода `List`, которая формирует `Users`:

```go
func (r *userRepository) List(ctx context.Context, f UserFilter) (Users, error) {
    // Здесь мы пропускаем построение SQL, чтобы сосредоточиться на model-slice
    rows, err := r.db.QueryContext(ctx, `
        SELECT id, name, email, age
        FROM users
        WHERE age >= ? AND age <= ?
        LIMIT ? OFFSET ?
    `, f.MinAge, f.MaxAge, f.Limit, f.Offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users Users
    for rows.Next() {
        var u User
        // Сканируем строку в модель
        if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Age); err != nil {
            return nil, err
        }
        // Добавляем модель в слайс
        users = append(users, u)
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }

    return users, nil
}
```

Теперь вы увидите, как легко интегрировать `Users` в бизнес-логику.

### Обработка результата репозитория

```go
func HandleListUsers(ctx context.Context, repo UserRepository) error {
    filter := UserFilter{
        MinAge: 18,
        MaxAge: 65,
        Limit:  50,
        Offset: 0,
    }

    users, err := repo.List(ctx, filter)
    if err != nil {
        return err
    }

    // Фильтруем по бизнес-условиям
    activeAdults := users.Filter(func(u User) bool {
        // Здесь можно добавить любые условия
        return u.Age >= 21
    })

    // Сортируем по возрасту
    activeAdults.SortByAge()

    // Преобразуем в слайс ID для дальнейших операций
    ids := activeAdults.MapToIDs()
    fmt.Println("User IDs", ids)

    return nil
}
```

Обратите внимание, как этот фрагмент кода решает задачу: вся логика обработки находится рядом с коллекцией, а не размазана по проекту.

## Валидация и бизнес-правила на уровне model-slice

Слайс моделей удобен и для валидации множества сущностей.

### Валидация каждого элемента

```go
// Validate - метод валидации одной модели
func (u User) Validate() error {
    if u.Name == "" {
        return fmt.Errorf("name is required")
    }
    if u.Email == "" {
        return fmt.Errorf("email is required")
    }
    if u.Age < 0 {
        return fmt.Errorf("age cannot be negative")
    }
    return nil
}

// ValidateAll - возвращает первую ошибку валидации или nil
func (us Users) ValidateAll() error {
    for i, u := range us {
        if err := u.Validate(); err != nil {
            // Добавим контекст - индекс элемента в коллекции
            return fmt.Errorf("user at index %d is invalid: %w", i, err)
        }
    }
    return nil
}
```

Теперь давайте разберемся на примере, как это использовать:

```go
func SaveUsers(ctx context.Context, repo UserRepository, users Users) error {
    if err := users.ValidateAll(); err != nil {
        // Не сохраняем, если коллекция невалидна
        return err
    }

    // Здесь может быть логика пакетного сохранения
    // ...
    return nil
}
```

### Проверка уникальности внутри среза

Еще один частый сценарий — убедиться, что в коллекции нет дубликатов по какому-то полю.

```go
// EnsureUniqueEmails - проверяет, что в коллекции нет двух пользователей с одинаковым email
func (us Users) EnsureUniqueEmails() error {
    seen := make(map[string]int) // email -> index
    for i, u := range us {
        if j, ok := seen[u.Email]; ok {
            // Нашли дубликат email
            return fmt.Errorf("duplicate email %q at indexes %d and %d", u.Email, j, i)
        }
        seen[u.Email] = i
    }
    return nil
}
```

Такую проверку удобно вызывать прямо после формирования коллекции, до сохранения в базу данных.

## Дженерики и обобщенный подход к model-slice

В Go с появлением дженериков модель работы со срезами можно обобщить, чтобы не повторять однотипный код для каждой модели.

### Обобщенный слайс моделей

Давайте посмотрим, как можно описать обобщенные операции.

```go
// Slice - обобщенный тип для слайса любых элементов
type Slice[T any] []T

// Filter - обобщенный метод фильтрации
func (s Slice[T]) Filter(pred func(T) bool) Slice[T] {
    var res Slice[T]
    for _, v := range s {
        if pred(v) {
            res = append(res, v)
        }
    }
    return res
}

// Map - обобщенное преобразование элементов
func Map[T any, R any](s []T, fn func(T) R) []R {
    res := make([]R, 0, len(s))
    for _, v := range s {
        res = append(res, fn(v))
    }
    return res
}
```

Теперь давайте посмотрим, что происходит при использовании с нашей моделью:

```go
type UserSlice = Slice[User]

func ExampleGeneric() {
    us := UserSlice{
        {ID: 1, Name: "Alice", Age: 30},
        {ID: 2, Name: "Bob", Age: 17},
    }

    adults := us.Filter(func(u User) bool {
        return u.Age >= 18
    })

    names := Map(adults, func(u User) string {
        return u.Name
    })

    fmt.Println(names) // [Alice]
}
```

Дженерики позволяют вынести типовые операции (`Filter`, `Map`) в один пакет, а уже доменные вещи (например, `ValidateAll`, `EnsureUniqueEmails`) оставлять в типах уровня модели.

### Сочетание дженериков и доменных типов

Вы можете комбинировать:

- обобщенный пакет `slicesx` (условно) с функциями высокого уровня;
- доменный тип `Users`, который использует эти функции.

```go
// Пакет slicesx
package slicesx

func Filter[T any](s []T, pred func(T) bool) []T {
    var res []T
    for _, v := range s {
        if pred(v) {
            res = append(res, v)
        }
    }
    return res
}
```

```go
// Пакет model
package model

import "myapp/slicesx"

type Users []User

// Adults - обертка вокруг обобщенной функции Filter
func (us Users) Adults() Users {
    res := slicesx.Filter(us, func(u User) bool {
        return u.Age >= 18
    })
    // Неявное преобразование []User -> Users при присваивании
    return Users(res)
}
```

Так вы сохраняете читаемость и доменную семантику, опираясь на общую библиотеку для слайсов.

## Работа с памятью и производительностью слайса моделей

Слайс моделей — это не просто "список объектов". В Go срезы устроены так, что важно понимать несколько моментов, чтобы не создавать лишнюю нагрузку на память.

### Внутреннее устройство среза

Срез в Go состоит из:

- указателя на массив элементов;
- длины (len);
- емкости (cap).

Когда вы возвращаете `Users` из функции, копируется только "заголовок" среза, а не все элементы. Это недорого, но может иметь последствия, если вы создаете подмассивы.

### Подводные камни при срезах-подмассах

Если вы делаете:

```go
page := users.Paginate(0, 10)
```

То `page` будет ссылаться на тот же массив, что и `users`. Если исходный `users` большой, а вы держите `page` долго, то сборщик мусора не сможет освободить память под весь исходный массив.

Если нужно избежать такой "утечки через ссылку", клонируйте подмассив:

```go
func (us Users) PaginateDetached(offset, limit int) Users {
    page := us.Paginate(offset, limit)
    res := make(Users, len(page))
    copy(res, page) // Копируем элементы
    return res
}
```

Здесь цена — дополнительное копирование, но вы получаете независимый слайс, который не держит в памяти весь оригинальный массив.

### Предварительное выделение памяти

Когда вы строите коллекцию из неизвестного количества элементов (например, результат SQL-запроса), вы часто делаете просто `append` по мере чтения. Но если вы заранее знаете (или можете оценить) количество строк, имеет смысл выделить буфер сразу.

```go
// Пример с capacity
users := make(Users, 0, 1000) // Ожидаем примерно 1000 элементов
for rows.Next() {
    var u User
    // ...
    users = append(users, u)
}
```

Так вы избегаете нескольких перераспределений памяти и копирований старых данных.

## Интеграция model-slice с JSON и API

Часто слайс модели — это то, что вы отдаете наружу из HTTP API. Давайте посмотрим, как это типично выглядит.

### Структуры ответа с model-slice

```go
type UsersResponse struct {
    Items      Users `json:"items"`
    TotalCount int   `json:"total_count"`
    Offset     int   `json:"offset"`
    Limit      int   `json:"limit"`
}
```

Контроллер может выглядеть так:

```go
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Здесь вы читаете limit и offset из запроса (опускаем детали)
    filter := UserFilter{
        MinAge: 0,
        MaxAge: 200,
        Limit:  50,
        Offset: 0,
    }

    users, err := h.userRepo.List(ctx, filter)
    if err != nil {
        http.Error(w, "failed to list users", http.StatusInternalServerError)
        return
    }

    resp := UsersResponse{
        Items:      users,
        TotalCount: len(users), // В реальности чаще возвращают реальное количество в БД
        Offset:     filter.Offset,
        Limit:      filter.Limit,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        http.Error(w, "failed to encode response", http.StatusInternalServerError)
        return
    }
}
```

Давайте посмотрим, что происходит в этом фрагменте:

- `Items` типа `Users` напрямую сериализуется как массив объектов JSON;
- вы сохраняете полную информацию о пагинации;
- сами модели `User` могут иметь теги `json`, которые управляют тем, как поля попадают в ответ.

### DTO и преобразование между слоями

Иногда вы не хотите отдавать наружу "сырую" модель, например, по соображениям безопасности или для отделения домена от API.

Тогда удобно добавить методы преобразования:

```go
// UserDTO - структура для ответа API
type UserDTO struct {
    ID   int64  `json:"id"`
    Name string `json:"name"`
    Age  int    `json:"age"`
}

// ToDTO - преобразует модель в DTO
func (u User) ToDTO() UserDTO {
    return UserDTO{
        ID:   u.ID,
        Name: u.Name,
        Age:  u.Age,
    }
}

// ToDTOs - преобразует Users в слайс DTO
func (us Users) ToDTOs() []UserDTO {
    res := make([]UserDTO, 0, len(us))
    for _, u := range us {
        res = append(res, u.ToDTO())
    }
    return res
}
```

Теперь вы можете строить ответ так:

```go
type UsersDTOResponse struct {
    Items      []UserDTO `json:"items"`
    TotalCount int       `json:"total_count"`
    Offset     int       `json:"offset"`
    Limit      int       `json:"limit"`
}
```

И в хендлере:

```go
resp := UsersDTOResponse{
    Items:      users.ToDTOs(),
    TotalCount: total,
    Offset:     filter.Offset,
    Limit:      filter.Limit,
}
```

Здесь модель `Users` выступает как источник правдивых доменных данных, а DTO — как "контракт" с внешним миром.

## Заключение

Подход model-slice в Go — это удобный способ структурировать работу с коллекциями моделей. Вместо того чтобы применять к каждому `[]User` разрозненные функции, вы выносите все операции в тип `Users` и вокруг него.

Основные идеи, которые важно запомнить:

- выделяйте отдельный тип для слайса модели (`type Users []User`), если коллекция играет значимую роль в логике;
- разделяйте методы чтения (`Users`) и модификации (`*Users`);
- реализуйте типичные операции прямо на model-slice: фильтрацию, сортировку, пагинацию, валидацию;
- учитывайте особенности памяти срезов — при необходимости делайте копии подмассивов;
- используйте дженерики для обобщенных операций, а доменные вещи оставляйте в конкретных типах слайсов;
- интегрируйте model-slice в репозитории и API, чтобы сделать код последовательным и читаемым.

Систематический подход к слайсам моделей уменьшает дублирование, делает код ближе к предметной области и облегчает развитие проекта.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Нужно ли всегда объявлять отдельный тип для слайса модели

Не обязательно. Если вы используете коллекцию модели всего в одном месте и у нее нет специфичной логики, обычный `[]User` подойдет. Отдельный тип `Users` имеет смысл вводить, когда:

- есть несколько операций над коллекцией;
- коллекция фигурирует в интерфейсах и API;
- вы хотите сгруппировать методы вокруг доменного понятия.

### Как избежать копирования больших слайсов при передаче в функции

Срез в Go уже передается по значению "заголовка", а не всех элементов. Вам не нужно отдельно оптимизировать это. Копируются только три машинных слова. Опасаться стоит не копирования при передаче, а создания лишних подмассивов, которые удерживают большой базовый массив. В таких местах при необходимости создавайте копию с помощью `make` и `copy`.

### Как безопасно изменять элементы в слайсе моделей из разных горутин

Сам по себе `Users` не потокобезопасен. Если нужно изменять коллекцию из нескольких горутин, используйте:

- мьютекс (`sync.Mutex`) вокруг операций записи и чтения;
- или канал для последовательной обработки изменений;
- или делайте копию `Users` для каждой горутины, если нужна изоляция, а не общая мутабельная коллекция.

### Как реализовать "ленивую" пагинацию с model-slice чтобы не грузить всю таблицу

Ленивая пагинация обычно реализуется на уровне БД и репозитория. Вместо того чтобы загружать всех пользователей и потом делить их на страницы,:

- принимайте в репозитории фильтр с `Limit` и `Offset` или `Cursor`;
- возвращайте только нужную страницу в виде `Users`;
- total-count можно считать отдельным запросом. Model-slice здесь — просто тип для результата, "ленивость" обеспечивает SQL.

### Как лучше обрабатывать ошибки валидации коллекции если нужно вернуть все ошибки а не только первую

Вместо `error` используйте собственный тип, который содержит слайс ошибок. Например:

```go
type ValidationErrors []error

func (e ValidationErrors) Error() string {
    // Соберите сообщения в одну строку
    // ...
    return "validation errors"
}

func (us Users) ValidateAllCollect() error {
    var errs ValidationErrors
    for i, u := range us {
        if err := u.Validate(); err != nil {
            errs = append(errs, fmt.Errorf("user %d: %w", i, err))
        }
    }
    if len(errs) == 0 {
        return nil
    }
    return errs
}
```

Так вы сможете возвращать все ошибки сразу и обрабатывать их по месту вызова.