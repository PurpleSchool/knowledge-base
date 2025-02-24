---
metaTitle: Работа с созданием REST API в Go
metaDescription: Разбираемся c созданием REST API в Go
author: Александр Гольцман
title: Создание REST API в Go
preview: В этой статье я покажу, как создать REST API на Go - разберём маршрутизацию, обработку запросов, работу с JSON и организацию кода.
---

REST API — это один из самых популярных способов взаимодействия между клиентом и сервером в веб-приложениях. Он основан на архитектурных принципах REST и использует HTTP-протокол для передачи данных. В этой статье я покажу, как создать REST API на Go: разберём маршрутизацию, обработку запросов, работу с JSON и организацию кода. Кроме того, я объясню основные принципы REST и их применение в Go.

## **Что такое REST API и зачем он нужен?**

REST (Representational State Transfer) — это архитектурный стиль для распределённых систем, который использует стандарты HTTP для обмена данными. Основные принципы REST:

- **Клиент-сервер** — сервер и клиент отделены друг от друга и взаимодействуют через HTTP.
- **Отсутствие состояния (stateless)** — сервер не хранит состояние клиента между запросами.
- **Кэшируемость** — ответы сервера могут кэшироваться для оптимизации производительности.
- **Единообразие интерфейса** — использование стандартных HTTP-методов (`GET`, `POST`, `PUT`, `DELETE`). Подробнее об этом мы говорили в этой статье — [HTTP-запросы в Golang](https://purpleschool.ru/knowledge-base/article/http-requests).

REST API часто используется для создания веб-сервисов, мобильных приложений и микросервисных архитектур. В Go можно быстро создать REST API благодаря встроенной поддержке HTTP и сторонним библиотекам.

## **Настройка окружения и зависимостей**

Для создания REST API в Go используется стандартный пакет `net/http`, а также сторонние библиотеки, такие как `gorilla/mux` или `chi` для удобной маршрутизации. Давайте установим необходимую библиотеку:

```
go get github.com/gorilla/mux
```

Теперь можно приступить к написанию API.

## **Создание простого REST API**

Смотрите, как можно организовать простой сервер с маршрутизацией:

```go
package main

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type Response struct {
	Message string `json:"message"`
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{Message: "Добро пожаловать в API"})
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler).Methods("GET")

	http.ListenAndServe(":8080", r)
}
```

Здесь я создал простейший сервер, который обрабатывает GET-запрос на `/` и возвращает JSON-ответ.

## **Добавление CRUD-операций**

Чаще всего REST API включает операции CRUD (Create, Read, Update, Delete). Давайте реализуем их на примере работы с сущностью `User`.

### **Структура данных**

```go
type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var users = []User{}
```

### **Создание пользователя (POST)**

```go
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)
	user.ID = fmt.Sprintf("%d", len(users)+1)
	users = append(users, user)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}
```

### **Получение списка пользователей (GET)**

```go
func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
```

### **Обновление пользователя (PUT)**

```go
func updateUserHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	for i, user := range users {
		if user.ID == id {
			json.NewDecoder(r.Body).Decode(&users[i])
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(users[i])
			return
		}
	}

	http.Error(w, "Пользователь не найден", http.StatusNotFound)
}
```

### **Удаление пользователя (DELETE)**

```go
func deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	for i, user := range users {
		if user.ID == id {
			users = append(users[:i], users[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "Пользователь не найден", http.StatusNotFound)
}
```

### **Регистрация маршрутов**

Теперь добавим маршруты в `main`:

```go
func main() {
	r := mux.NewRouter()

	r.HandleFunc("/", homeHandler).Methods("GET")
	r.HandleFunc("/users", createUserHandler).Methods("POST")
	r.HandleFunc("/users", getUsersHandler).Methods("GET")
	r.HandleFunc("/users/{id}", updateUserHandler).Methods("PUT")
	r.HandleFunc("/users/{id}", deleteUserHandler).Methods("DELETE")

	http.ListenAndServe(":8080", r)
}
```

Теперь у нас есть полноценное REST API для работы с пользователями.

## **Добавление middleware**

Middleware помогает обрабатывать запросы до того, как они попадут в основной обработчик. Например, можно добавить логирование:

```go
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Запрос:", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
```

Затем подключите middleware в `main`:

```go
r.Use(loggingMiddleware)
```

## **Работа с базой данных**

В реальном проекте данные хранятся не в памяти, а в базе данных. Для работы с PostgreSQL можно использовать `gorm` (подробнее об этом мы говорили в статье по [PostgreSQL](https://purpleschool.ru/knowledge-base/article/postgresql)):

```
go get gorm.io/gorm
go get gorm.io/driver/postgres
```

Пример подключения:

```go
db, err := gorm.Open(postgres.Open("host=localhost user=postgres dbname=mydb sslmode=disable"), &gorm.Config{})
if err != nil {
	log.Fatal("Ошибка подключения к базе данных")
}
```

Дальше можно использовать `db.Create(&user)`, `db.Find(&users)` и другие методы для работы с данными.

## **Заключение**

Создание REST API в Go — это относительно простой процесс благодаря стандартной библиотеке `net/http` и сторонним маршрутизаторам, таким как `gorilla/mux`. Давайте подведём итоги:

- **REST API строится на принципах REST** и использует HTTP-протокол.
- **Маршрутизация в Go может быть реализована через стандартный `net/http` или `gorilla/mux`**.
- **Для работы с JSON используются встроенные методы `encoding/json`**.
- **CRUD-операции — основа любого API**. Мы реализовали их для пользователей.
- **Middleware позволяют добавлять к API новые возможности**, такие как логирование или аутентификация.
- **Для хранения данных вместо массива в памяти лучше использовать базу данных**, например PostgreSQL с `gorm`.

Смотрите, где REST API может быть полезен в вашем проекте, и используйте его для создания надёжных и масштабируемых веб-приложений.
