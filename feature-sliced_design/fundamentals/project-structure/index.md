---
metaTitle: Структура проекта в Go Golang
metaDescription: Узнайте как организовать структуру Go проекта - разберем папки файлы и подходы к архитектуре чтобы код был поддерживаемым и масштабируемым
author: Олег Марков
title: Структура проекта в Go Golang
preview: Научитесь выстраивать понятную структуру Go проекта - разберем типовые шаблоны расположения кода best practices и практические примеры организации пакетов
---

## Введение

Структура проекта в Go — это не просто удобное расположение файлов. От того, как вы организуете каталоги, пакеты и модули, зависит:

- насколько легко будет добавлять новые фичи;
- как быстро новый разработчик разберется в коде;
- насколько просто вы сможете выделять общие части в отдельные библиотеки;
- как удобно будет тестировать и деплоить приложение.

В Go есть несколько негласных соглашений: рекомендуемые напрвления, لكنها не жёсткие правила. Смотрите, я покажу вам, какие структуры проекта чаще всего используют, как выбирать подход под вашу задачу и какие типичные ошибки лучше не допускать.

Давайте разбираться по шагам — от базовой структуры «один main и пара пакетов» до более сложного варианта с разделением на внутренние и публичные пакеты, конфигурацию, миграции и т.д.

---

## Базовые принципы структуры проекта в Go

### Минимальный проект и модуль Go

Прежде чем обсуждать папки, важно понять, как Go видит проект.

Go использует модули. Корень модуля — это директория, где лежит файл go.mod. От этого файла Go начинает «думать» о пространстве имен пакетов.

Пример минимального проекта:

- go.mod
- main.go

Файл go.mod:

```go
module github.com/username/todo-app

go 1.22
```

main.go:

```go
package main

import "fmt"

func main() {
    // Точка входа в приложение
    fmt.Println("Hello, project structure")
}
```

Здесь важно:

// Корень модуля — это директория с go.mod  
// Импорт внутри этого модуля будет начинаться с `github.com/username/todo-app/...`

Как только вы добавляете подпапки и выносите код в отдельные пакеты, структура начинает играть большую роль.

### Общие принципы хорошей структуры

Когда вы проектируете структуру, удобно держать в голове несколько ориентиров:

1. **Логическое разделение по зонам ответственности**  
   Код, который отвечает за разные задачи (HTTP API, база данных, бизнес-логика), лучше держать в разных пакетах.

2. **Минимальные зависимости между пакетами**  
   Чем меньше циклических зависимостей и «цепочек» импортов, тем проще развивать проект.

3. **Стабильные внешние контракты**  
   Публичные пакеты (которые вы импортируете из других проектов) должны меняться реже, чем внутренние.

4. **Код ближе к месту использования**  
   Не нужно создавать абстрактные папки «service», «manager» только ради красивых слов. Лучше, чтобы структура отражала домен и назначение кода.

---

## Базовая структура Go-проекта

Начнем с относительно простой, но уже практичной структуры, которая подходит для небольших сервисов и pet-проектов.

### Пример дерева каталогов

Давайте посмотрим на пример:

```text
todo-app/
  go.mod
  go.sum

  cmd/
    todo-api/
      main.go

  internal/
    http/
      handler.go
      router.go
    todo/
      service.go
      repository.go
      models.go

  pkg/
    logger/
      logger.go

  configs/
    config.yaml

  migrations/
    001_init.sql

  Makefile
  README.md
```

Сейчас я пройдусь по этим директориям и объясню, что за что отвечает и как с этим работать на практике.

### Директория cmd — точки входа в приложение

Папка cmd — негласный стандарт для хранения исполнимых приложений (entrypoints).

Структура:

- cmd/todo-api/main.go — код, который собирается в бинарник todo-api;
- если бы у вас был отдельный воркер, можно было бы сделать cmd/todo-worker/main.go.

Пример main.go:

```go
package main

import (
    "log"
    "net/http"

    "github.com/username/todo-app/internal/http"
    "github.com/username/todo-app/pkg/logger"
)

func main() {
    // Инициализируем логгер
    logg := logger.New() // наш пакет логгера из pkg/logger

    // Создаем HTTP роутер
    router := http.NewRouter(logg)

    // Запускаем HTTP-сервер
    // В реальном проекте лучше выносить порт и другие настройки в конфиг
    log.Println("starting server on :8080")
    if err := http.ListenAndServe(":8080", router); err != nil {
        log.Fatal(err)
    }
}
```

Комментарии, на которые стоит обратить внимание:

// В main.go мы только «склеиваем» зависимости  
// Здесь не должно быть бизнес-логики  
// main.go должен оставаться тонким — он инициализирует и запускает приложение

Такой подход делает точку входа понятной: любой разработчик быстро видит, как поднимается сервис.

### Папка internal — внутренняя логика приложения

internal — специальное имя в Go. Пакеты внутри этой директории нельзя импортировать за пределами модуля.

Это очень полезный механизм инкапсуляции: вы явно говорите «этот код только для этого проекта».

Папка internal/http:

- handler.go — HTTP-обработчики (контроллеры);
- router.go — настройка маршрутов.

Папка internal/todo:

- service.go — бизнес-логика работы со списком задач;
- repository.go — работа с хранилищем (БД, файл, память);
- models.go — описание структур (Task, UserTask и т.п.).

Пример простого сервиса:

```go
package todo

import "context"

// Task — доменная модель задачи
type Task struct {
    ID      int64
    Title   string
    Done    bool
}

// Repository — интерфейс для работы с хранилищем задач
type Repository interface {
    Create(ctx context.Context, t Task) (int64, error)
    List(ctx context.Context) ([]Task, error)
}

// Service — бизнес-логика задач
type Service struct {
    repo Repository
}

// NewService — конструктор сервиса
func NewService(repo Repository) *Service {
    return &Service{repo: repo}
}

// CreateTask — бизнес-метод создания задачи
func (s *Service) CreateTask(ctx context.Context, title string) (Task, error) {
    // Здесь мы можем добавить валидацию, логику и т.д.
    t := Task{
        Title: title,
        Done:  false,
    }

    id, err := s.repo.Create(ctx, t)
    if err != nil {
        return Task{}, err
    }

    t.ID = id
    return t, nil
}
```

Комментарии внутри:

// Service опирается на интерфейс Repository  
// Это позволяет менять хранилище (Postgres, SQLite, in-memory) без изменения бизнес-логики  
// Такой подход помогает тестировать Service с помощью мок-репозиториев

### Папка pkg — переиспользуемые пакеты

Неформальное соглашение: в pkg можно складывать код, который потенциально можно переиспользовать в других проектах.

Например, простой логгер:

```go
package logger

import (
    "log"
    "os"
)

type Logger struct {
    l *log.Logger
}

// New — конструктор логгера
func New() *Logger {
    return &Logger{
        l: log.New(os.Stdout, "[todo-app] ", log.LstdFlags|log.Lshortfile),
    }
}

// Info — логируем информационное сообщение
func (lg *Logger) Info(msg string) {
    lg.l.Println("INFO", msg)
}

// Error — логируем ошибку
func (lg *Logger) Error(msg string, err error) {
    lg.l.Println("ERROR", msg, "err=", err)
}
```

Преимущества подхода:

// pkg/logger не знает ничего о домене todo  
// Его можно вынести в отдельный модуль и переиспользовать  
// Пакеты из pkg можно импортировать и из других модулей, если вы их откроете

### Папка configs — конфигурации приложения

Обычно сюда кладут:

- YAML/JSON файлы конфигурации (config.yaml);
- примеры конфигов (config.example.yaml).

Пример config.yaml:

```yaml
server:
  port: 8080

db:
  dsn: "postgres://user:pass@localhost:5432/todo?sslmode=disable"
```

Дальше вы можете написать пакет для загрузки конфигурации, например internal/config.

### Папка migrations — миграции базы данных

Здесь удобно держать SQL-файлы для создания и изменения схемы БД:

- 001_init.sql
- 002_add_index_on_tasks.sql

Это не обязательный элемент структуры, но на практике он почти всегда нужен в сервисах, работающих с БД.

---

## Варианты структур для разных типов проектов

Теперь давайте посмотрим на несколько распространенных шаблонов организации структуры: от простых до более модульных.

### 1. Feature-based (по фичам или доменам)

Суть: вы группируете код по функциональным областям (features), а не по «техническим слоям» (handlers, services, repositories в отдельных папках).

Дерево:

```text
internal/
  todo/
    transport/
      http/
        handler.go
    service/
      service.go
    storage/
      postgres/
        repository.go

  user/
    transport/
      http/
        handler.go
    service/
      service.go
    storage/
      postgres/
        repository.go
```

Как это работает:

// Внутри todo сосредоточены все файлы, относящиеся к домену задач  
// Внутри user — все, что относится к пользователям  
// Такой подход помогает легче ориентироваться при росте числа фич

Плюсы:

- Легче находить все, что относится к конкретной фиче;
- Проще выделять фичу в отдельный сервис.

Минусы:

- Нужно чуть больше дисциплины, чтобы не дублировать код;
- Общие компоненты могут начинать размазываться.

### 2. Layer-based (по слоям приложения)

В этом подходе вы разделяете код по техническим слоям:

```text
internal/
  transport/
    http/
      todo_handler.go
      user_handler.go

  service/
    todo_service.go
    user_service.go

  repository/
    todo_repository.go
    user_repository.go
```

Плюсы:

- Хорошо видно, какой слой за что отвечает;
- Подходит, если слоев немного и домен не сильно раздут.

Минусы:

- При большом количестве фич файлы в каждом слое могут расти и смешиваться;
- Чтобы посмотреть, как работает одна фича целиком, приходится бегать по нескольким директориям.

На практике разработчики часто комбинируют оба подхода: на верхнем уровне — по доменам, внутри домена — по слоям.

### 3. Модульный подход (microservices / libraries)

Если вы планируете разбивать систему на отдельные сервисы или библиотеки, структура может быть ближе к такому виду:

```text
todo-app/
  go.work           # рабочее пространство Go (если несколько модулей)

  todo-api/         # модуль HTTP API
    go.mod
    cmd/
      todo-api/
        main.go
    internal/
      ...

  todo-worker/      # модуль для фоновых задач
    go.mod
    cmd/
      todo-worker/
        main.go
    internal/
      ...

  libs/             # общие библиотеки
    logger/
      go.mod
      logger.go
    config/
      go.mod
      loader.go
```

Такая структура сложнее, но позволяет независимо версионировать части системы, запускать разные сервисы и переиспользовать общие библиотеки.

---

## Рабочие практики и детали структуры

Теперь покажу несколько важных деталей, которые напрямую завязаны на структуру проекта.

### Разделение на internal и pkg — когда и зачем

Подход:

- internal — для кода, который не должен использоваться снаружи;
- pkg — для кода, который вы готовы (или потенциально готовы) отдавать другим модулям;
- остальные директории (configs, migrations и т.п.) — организационные, но не пакеты Go.

Рекомендация:

- если вы сомневаетесь, public это код или нет, кладите его в internal;
- pkg имеет смысл, только если вы осознанно проектируете библиотеку.

Пример:

```text
internal/
  todo/
    service.go    // бизнес-логика — точно внутренняя
pkg/
  logger/
    logger.go     // утилита логирования — можно переиспользовать
```

### Где хранить интерфейсы — в сервисе или в репозитории

Это частый вопрос, сильно завязанный на структуру.

Смотрите, я покажу вам две распространенные схемы.

Интерфейс в доменном пакете (service):

```go
// internal/todo/service.go
package todo

type Repository interface {
    CreateTask(ctx context.Context, t Task) (int64, error)
}

type Service struct {
    repo Repository
}
```

Интерфейс в инфраструктурном пакете (repository):

```go
// internal/repository/todo_repository.go
package repository

type TodoRepository interface {
    CreateTask(ctx context.Context, t todo.Task) (int64, error)
}
```

На практике чаще используют первый вариант:

// интерфейс объявляется ближе к месту потребления (в сервисе);  
// реализация лежит в пакете репозитория и удовлетворяет интерфейсу;  
// структура проекта при этом подталкивает к слабой связности между слоями.

Структура каталогов при таком подходе обычно feature-based.

### Структура для тестов

Тесты также опираются на структуру пакетов.

Базовые рекомендации:

- файлы тестов кладутся рядом с кодом: service_test.go рядом с service.go;
- если вы используете black-box тестирование, можно в тестах использовать внешний пакет (package todo_test), а не внутренний.

Пример:

```text
internal/
  todo/
    service.go
    service_test.go
```

service_test.go:

```go
package todo

import (
    "context"
    "testing"
)

// fakeRepository — фейковая реализация интерфейса Repository
type fakeRepository struct{}

func (f *fakeRepository) Create(ctx context.Context, t Task) (int64, error) {
    // Здесь мы просто возвращаем фиктивный ID
    return 1, nil
}

func TestService_CreateTask(t *testing.T) {
    ctx := context.Background()

    // Создаем сервис с фейковым репозиторием
    s := NewService(&fakeRepository{})

    // Вызываем бизнес-метод
    task, err := s.CreateTask(ctx, "test task")
    if err != nil {
        t.Fatalf("unexpected error - %v", err)
    }

    if task.ID == 0 {
        t.Fatalf("expected non-zero ID")
    }
}
```

Комментарии:

// Тесты живут рядом с кодом и повторяют структуру пакетов  
// Это упрощает навигацию и поиск тестов в большом проекте

---

## Пример: строим структуру API-сервиса шаг за шагом

Давайте разберемся на практическом примере. Соберем структуру простого HTTP API-сервиса для задач.

### Шаг 1: каркас проекта

Дерево:

```text
todo-app/
  go.mod

  cmd/
    todo-api/
      main.go

  internal/
    http/
    todo/

  pkg/
    logger/
```

go.mod:

```go
module github.com/username/todo-app

go 1.22
```

### Шаг 2: добавляем пакет logger в pkg

Мы уже писали пример логгера выше. Положите logger.go в pkg/logger.

Теперь вы увидите, как это выглядит в импортах:

```go
import "github.com/username/todo-app/pkg/logger"
```

Структура модуля при этом не ломается: pkg — обычная папка с пакетами.

### Шаг 3: HTTP-слой в internal/http

Создадим router.go и handler.go.

router.go:

```go
package http

import (
    stdhttp "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/username/todo-app/internal/todo"
    "github.com/username/todo-app/pkg/logger"
)

// NewRouter — инициализирует HTTP-роутер
func NewRouter(logg *logger.Logger, todoSvc *todo.Service) stdhttp.Handler {
    r := chi.NewRouter()

    // Регистрируем обработчики
    h := NewTodoHandler(logg, todoSvc)

    r.Post("/tasks", h.CreateTask)
    r.Get("/tasks", h.ListTasks)

    return r
}
```

handler.go:

```go
package http

import (
    "encoding/json"
    "net/http"

    "github.com/username/todo-app/internal/todo"
    "github.com/username/todo-app/pkg/logger"
)

// TodoHandler — HTTP-обработчики для задач
type TodoHandler struct {
    logg *logger.Logger
    svc  *todo.Service
}

// NewTodoHandler — конструктор обработчика
func NewTodoHandler(logg *logger.Logger, svc *todo.Service) *TodoHandler {
    return &TodoHandler{
        logg: logg,
        svc:  svc,
    }
}

// requestCreateTask — структура тела запроса
type requestCreateTask struct {
    Title string `json:"title"`
}

// responseTask — структура ответа
type responseTask struct {
    ID    int64  `json:"id"`
    Title string `json:"title"`
    Done  bool   `json:"done"`
}

// CreateTask — HTTP handler для создания задачи
func (h *TodoHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
    var req requestCreateTask
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        // В случае неверного запроса возвращаем 400
        http.Error(w, "invalid request", http.StatusBadRequest)
        return
    }

    // Вызываем бизнес-логику
    task, err := h.svc.CreateTask(r.Context(), req.Title)
    if err != nil {
        // Логируем ошибку и возвращаем 500
        h.logg.Error("failed to create task", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }

    // Формируем ответ
    resp := responseTask{
        ID:    task.ID,
        Title: task.Title,
        Done:  task.Done,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        // Ошибка при формировании ответа
        h.logg.Error("failed to write response", err)
    }
}
```

Как видите, этот код:

// опирается на todo.Service из internal/todo  
// использует логгер из pkg/logger  
// никак не зависит от реализации репозитория

Структура пакетов помогает держать зависимости под контролем.

### Шаг 4: связываем всё в cmd/todo-api/main.go

Теперь main.go может выглядеть так:

```go
package main

import (
    "log"
    "net/http"

    "github.com/username/todo-app/internal/http"
    "github.com/username/todo-app/internal/todo"
    "github.com/username/todo-app/pkg/logger"
)

func main() {
    // Инициализируем логгер
    logg := logger.New()

    // Инициализируем репозиторий.
    // Для примера сделаем простую in-memory реализацию.
    repo := todo.NewInMemoryRepository()

    // Инициализируем сервис
    svc := todo.NewService(repo)

    // Создаем HTTP-роутер
    router := http.NewRouter(logg, svc)

    // Запускаем сервер
    addr := ":8080"
    log.Printf("starting server on %s", addr)
    if err := http.ListenAndServe(addr, router); err != nil {
        log.Fatal(err)
    }
}
```

Здесь я размещаю пример, чтобы вам было проще понять архитектуру:

// main.go собирает зависимости: logger, repository, service, http router  
// В main.go нет бизнес-логики — только wiring  
// internal/http и internal/todo организованы по зонам ответственности

---

## Типичные ошибки в структуре проекта

Важно не только построить структуру, но и не скатиться в хаос через полгода. Давайте посмотрим, какие ошибки встречаются чаще всего.

### 1. Пакет utils, который растет бесконтрольно

Многие начинают с папки internal/utils, куда складывают «всё общее».

Проблема:

- utils часто превращается в свалку из функций вообще про все;
- зависимости от utils появляются даже там, где это не нужно;
- при росте проекта разобраться, что внутри, становится сложно.

Как лучше:

- давать пакетам конкретные имена — stringsx, timeutil, slice, httpx;
- группировать код по задаче, а не по признаку «утилитный».

Пример неудачно:

```text
internal/utils/
  db.go      # функции для БД
  http.go    # HTTP хелперы
  string.go  # строчные хелперы
```

Лучше:

```text
internal/dbutil/
  transaction.go
internal/httpx/
  response_writer.go
internal/stringsx/
  normalize.go
```

### 2. Смешивание доменной логики и инфраструктуры

Когда в одном пакете лежат и бизнес-правила, и SQL-запросы, и HTTP-обработчики, проект быстро становится трудно поддерживать.

Пример плохой структуры:

```text
internal/app/
  todo.go   # тут и HTTP, и SQL, и бизнес
```

Лучше разделить:

```text
internal/
  todo/
    service.go
    models.go
  http/
    todo_handler.go
  repository/
    todo_postgres.go
```

Структура при этом явно подсказывает, где искать:

// бизнес-логику — в internal/todo  
// HTTP — в internal/http  
// работу с БД — в internal/repository

### 3. Слишком глубокая вложенность каталогов

Иногда разработчики увлекаются иерархией:

```text
internal/
  application/
    server/
      http/
        v1/
          handlers/
            todo/
              create/
                handler.go
```

У такой структуры есть минусы:

- длинные пути импортов;
- сложно быстро пройтись глазами по ключевым элементам архитектуры;
- часто это не приносит реальной пользы.

Обратите внимание: лучше начинать с более плоской структуры и усложнять только при реальной необходимости.

---

## Как выбирать структуру под ваш проект

Выбор структуры зависит от масштаба и целей проекта. Давайте подведем несколько практических рекомендаций.

### Для небольших сервисов и pet-проектов

Можно использовать упрощенную структуру:

```text
cmd/
  app/
    main.go
internal/
  todo/
    service.go
    models.go
  http/
    handler.go
pkg/
  logger/
```

Особенности:

// не нужно множества подпакетов  
// достаточно разделить домен и инфраструктуру  
// тесты живут рядом с кодом

### Для средних и крупных сервисов

Лучше делать feature-based структуру:

```text
internal/
  todo/
    transport/
      http/
        handler.go
    service/
      service.go
    storage/
      postgres/
        repository.go
  user/
    transport/
      http/
        handler.go
    service/
      service.go
    storage/
      postgres/
        repository.go
pkg/
  logger/
  config/
```

Плюсы:

- легче масштабировать — каждый домен развивается в своём «кармане»;
- можно выделять домены в отдельные сервисы.

### Для экосистемы из нескольких сервисов

Имеет смысл разделять на модули и использовать go workspaces:

```text
go.work

todo-api/
  go.mod
  cmd/
  internal/

todo-worker/
  go.mod
  cmd/
  internal/

libs/
  logger/
    go.mod
  config/
    go.mod
```

Основной принцип:

// структура должна помогать вам модульно развивать систему  
// зависимости между модулями и пакетами должны быть осмысленными и направленными в одну сторону (от верхнего уровня к нижнему)

---

В результате хорошо продуманная структура проекта делает развитие кода предсказуемым: вы точно знаете, куда положить новую фичу, где искать бизнес-логику, а где — настройки и инфраструктуру. Это снижает порог входа и уменьшает количество «архитектурного долга» в будущем.

---

## Частозадаваемые технические вопросы по теме и ответы

### Вопрос 1. Как правильно организовать структуру, если у меня монолит, но я хочу в будущем перейти к микросервисам?

Сначала организуйте код по доменам (feature-based) внутри одного модуля:

- internal/todo
- internal/user
- internal/billing

Следите, чтобы зависимости шли от верхнего уровня к нижнему: HTTP → сервисы → репозитории → внешние клиенты. Позже каждый домен можно вынести в отдельный сервис, почти не меняя структуры кода. Важно избегать общих «god-пакетов» с глобальными зависимостями.

### Вопрос 2. Куда класть общий код DTO и контрактов между сервисами?

Если это контракты между несколькими сервисами (например, gRPC-прото или HTTP DTO), выделите для них отдельный модуль или директорию:

- api/proto/...
- api/http/...

Затем импортируйте этот модуль в сервисах. Не кладите DTO одного сервиса в internal другого — это нарушает границы.

### Вопрос 3. Как хранить конфигурацию для разных окружений (dev, stage, prod)?

Создайте одну структуру конфига в Go и несколько файлов конфигураций:

- configs/config.dev.yaml
- configs/config.stage.yaml
- configs/config.prod.yaml

В main читайте путь к конфигу из флага командной строки или переменной окружения. Пакет internal/config может содержать Loader, который по пути файла загружает структуру.

### Вопрос 4. Где хранить миграции, если у меня несколько баз данных?

Сделайте подпапки в migrations по компонентам:

- migrations/todo/...
- migrations/user/...

Либо по базам:

- migrations/postgres/...
- migrations/mysql/...

Инструмент миграций (golang-migrate и др.) обычно позволяет указывать путь к миграциям, так что можете запускать их по отдельности для разных БД.

### Вопрос 5. Как структурировать код, если у меня кроме HTTP есть gRPC и CLI?

Создайте отдельные подпакеты транспорта:

- internal/todo/transport/http
- internal/todo/transport/grpc
- internal/todo/transport/cli

Бизнес-логика и модели остаются в internal/todo/service и internal/todo/models. Таким образом, вы добавляете новые способы доступа (транспорты), не меняя доменный слой.