---
metaTitle: Работа с PostgreSQL в Golang
metaDescription: Разбираемся c PostgreSQL в Golang
author: Александр Гольцман
title: Работа с PostgreSQL в Go
preview: В этой статье я покажу, как интегрировать PostgreSQL в Go-проект, в каких случаях стоит использовать ORM, а когда лучше обходиться чистым SQL
---

PostgreSQL — мощная реляционная база данных, широко используемая в веб-разработке, аналитике и корпоративных системах. В языке Go (или Golang) для работы с PostgreSQL можно использовать как низкоуровневые драйверы, так и ORM.

В этой статье я покажу, как интегрировать PostgreSQL в Go-проект, разберем особенности работы с соединениями, индексы и транзакции, а также рассмотрим, в каких случаях стоит использовать ORM, а когда лучше обходиться чистым SQL.

Работа с PostgreSQL в Go требует понимания основных концепций SQL, умения подключаться к базе данных, выполнять запросы и обрабатывать результаты. Знание базовых структур языка, интерфейсов и обработки ошибок необходимо для эффективной работы с PostgreSQL. Если вы хотите детальнее погрузиться в основы языка Go и заложить прочный фундамент для работы с базами данных и PostgreSQL — приходите на наш большой курс [Основы Golang](https://purpleschool.ru/course/go-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=rabota-s-postgresql-v-go). На курсе 193 уроков и 16 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## **Драйверы PostgreSQL для Go**

В экосистеме Go есть несколько способов взаимодействия с PostgreSQL:

- **`database/sql` + `lib/pq`** — стандартный вариант с низкоуровневым доступом.
- **`pgx`** — высокопроизводительный драйвер с расширенными возможностями.
- **ORM (например, `gorm`)** — удобный способ работы с базой через структуры Go.

Я рекомендую `pgx`, если нужна высокая производительность, так как он быстрее `lib/pq` и поддерживает расширенные возможности PostgreSQL, такие как копирование данных (`COPY`), прослушивание (`LISTEN/NOTIFY`) и подготовленные запросы (`Prepared Statements`).

Устанавливаем `pgx`:

```
go get github.com/jackc/pgx/v5
```

## **Работа с соединениями**

PostgreSQL поддерживает пул соединений, что важно для высоконагруженных приложений. В `pgx` можно использовать `pgxpool` для управления соединениями:

```go
import (
    "context"
    "log"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    dsn := "postgres://user:password@localhost:5432/mydb"
    pool, err := pgxpool.New(context.Background(), dsn)
    if err != nil {
        log.Fatal("Ошибка подключения:", err)
    }
    defer pool.Close()
}
```

### **Почему это важно?**

- Использование пула соединений снижает нагрузку на базу.
- Открытие и закрытие соединений — дорогостоящая операция.
- PostgreSQL имеет ограничение на количество активных соединений, поэтому управление ими критично.

## **Оптимизация запросов**

### **Индексы в PostgreSQL**

PostgreSQL поддерживает несколько видов индексов, которые ускоряют доступ к данным.

- **B-Tree** — стандартный индекс для равенства и сравнений (`=`, `<`, `>`).
- **GIN** — ускоряет поиск по JSONB и `tsvector`.
- **BRIN** — полезен для больших таблиц с упорядоченными данными.

Пример создания индекса:

```sql
CREATE INDEX idx_users_email ON users(email);
```

В Go можно явно указывать использование индексов в запросах, анализируя их с помощью `EXPLAIN ANALYZE`.

```go
row := pool.QueryRow(context.Background(), "EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1", "user@example.com")
var analysis string
row.Scan(&analysis)
log.Println(analysis)
```

## **Работа с JSONB**

Одно из преимуществ PostgreSQL — поддержка JSONB, что позволяет хранить и запрашивать данные в JSON-формате.

Пример хранения JSONB в Go:

```go
type Product struct {
    ID     int            `json:"id"`
    Name   string         `json:"name"`
    Params map[string]any `json:"params"`
}

query := `INSERT INTO products (name, params) VALUES ($1, $2) RETURNING id`
jsonData := map[string]any{"color": "red", "size": "M"}
id := 0
err := pool.QueryRow(context.Background(), query, "Shirt", jsonData).Scan(&id)
```

Запрос данных по ключу JSONB:

```sql
SELECT * FROM products WHERE params->>'color' = 'red';
```

## **Работа с транзакциями**

В `pgx` транзакции обрабатываются через `Begin()`. Пример корректного использования:

```go
tx, err := pool.Begin(context.Background())
if err != nil {
    log.Fatal("Ошибка при создании транзакции:", err)
}
defer tx.Rollback(context.Background())

_, err = tx.Exec(context.Background(), "UPDATE accounts SET balance = balance - 100 WHERE id = $1", 1)
if err != nil {
    log.Fatal(err)
}

_, err = tx.Exec(context.Background(), "UPDATE accounts SET balance = balance + 100 WHERE id = $1", 2)
if err != nil {
    log.Fatal(err)
}

if err := tx.Commit(context.Background()); err != nil {
    log.Fatal(err)
}
```

Транзакции позволяют гарантировать целостность данных, например, при переводах между счетами.

## **Использование Listen/Notify**

PostgreSQL поддерживает механизм `LISTEN/NOTIFY`, позволяющий подписываться на события в базе данных. Это полезно для реактивных систем.

Пример подписки:

```go
conn, err := pool.Acquire(context.Background())
if err != nil {
    log.Fatal(err)
}
defer conn.Release()

_, err = conn.Exec(context.Background(), "LISTEN new_event")
if err != nil {
    log.Fatal(err)
}

for {
    notification, err := conn.Conn().WaitForNotification(context.Background())
    if err != nil {
        log.Fatal(err)
    }
    log.Println("Получено уведомление:", notification.Payload)
}
```

Отправка уведомления из базы:

```sql
NOTIFY new_event, 'data_updated';
```

## **Выбор между `pgx` и ORM**

Когда использовать `pgx`:

- Высоконагруженные системы.
- Сложные запросы и работа с `COPY`.
- Полный контроль над соединением и транзакциями.

Когда использовать ORM (`gorm`):

- Простые CRUD-операции.
- Быстрая разработка MVP.
- Удобная миграция схем.

## **Заключение**

PostgreSQL предоставляет мощные инструменты для работы с данными, а Go предлагает несколько способов взаимодействия с базой.

Смотрите, что важно учитывать:

- **Драйвер `pgx`** — оптимальный выбор для работы с PostgreSQL благодаря высокой производительности.
- **Индексы** помогают ускорить запросы, но их нужно применять осознанно.
- **JSONB** удобен для хранения полуструктурированных данных.
- **Listen/Notify** позволяет строить реактивные системы.

Если ваша задача — высокая производительность и полный контроль, используйте `pgx`. Если важнее скорость разработки, ORM вроде `gorm` может значительно упростить работу с базой.

Теперь, когда у вас есть представление о работе с PostgreSQL в Go, стоит задуматься о том, как правильно структурировать свой код, как использовать транзакции и как обрабатывать ошибки при работе с базами данных. Чтобы систематизировать свои знания Go и научиться писать чистый и поддерживаемый код для работы с базами данных, обратите внимание на курс [Основы Golang](https://purpleschool.ru/course/go-basics?utm_source=knowledgebase&utm_medium=text&utm_campaign=rabota-s-postgresql-v-go). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Go прямо сегодня и станьте уверенным разработчиком.
