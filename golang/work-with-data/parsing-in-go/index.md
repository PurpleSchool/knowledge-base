---
metaTitle: Parsing в Golang
metaDescription: Разбираемся c парсингом в Go
author: Александр Гольцман
title: Парсинг в Go
preview: В этой статье я расскажу, какие методы парсинга есть в Go, а также покажу, как использовать регулярные выражения для извлечения информации из текстов
---

Парсинг — это процесс извлечения данных из текстовых файлов, веб-страниц, API или других источников, структурирование информации и её обработка. В Go есть встроенные инструменты для работы с JSON и XML, а для более сложных задач, таких как парсинг HTML или извлечение данных с веб-сайтов, можно использовать сторонние библиотеки.

В этой статье я расскажу, какие методы парсинга есть в Go, а также покажу, как использовать регулярные выражения для извлечения информации из текстов.

## **Что такое парсинг и зачем он нужен?**

Парсинг (разбор) данных позволяет преобразовывать неструктурированные данные в удобный для работы формат. Это может быть:

- Извлечение нужных полей из JSON или XML.
- Анализ HTML-страниц для получения информации о товарах, статьях или ценах.
- Поиск данных в текстах с помощью регулярных выражений.
- Обработка API-ответов в формате JSON.

В Go парсинг часто используется в веб-разработке, автоматизации обработки данных, тестировании и интеграции с внешними сервисами.

Теперь давайте разберемся, как работать с разными форматами данных.

## **Работа с JSON в Go**

JSON (JavaScript Object Notation) — это популярный текстовый формат передачи данных. Он используется в REST API, веб-приложениях и хранении конфигураций. В Go обработка JSON выполняется с помощью стандартного пакета `encoding/json`.

Более подробно работу с JSON мы осветили в этой статье — [Обработка JSON в GO](https://purpleschool.ru/knowledge-base/article/encoding-json).

### **Как устроен JSON**

JSON представляет собой структуру ключ-значение и поддерживает массивы:

```json
{
  "name": "Анна",
  "age": 28,
  "email": "anna@example.com",
  "hobbies": ["чтение", "путешествия"]
}
```

### **Чтение JSON в Go**

В Go JSON можно преобразовать в структуру:

```go
package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	Name    string   `json:"name"`
	Age     int      `json:"age"`
	Email   string   `json:"email"`
	Hobbies []string `json:"hobbies"`
}

func main() {
	data := `{"name": "Анна", "age": 28, "email": "anna@example.com", "hobbies": ["чтение", "путешествия"]}`
	var user User

	err := json.Unmarshal([]byte(data), &user)
	if err != nil {
		fmt.Println("Ошибка парсинга:", err)
		return
	}

	fmt.Println("Имя:", user.Name)
	fmt.Println("Возраст:", user.Age)
	fmt.Println("Email:", user.Email)
	fmt.Println("Хобби:", user.Hobbies)
}
```

### **Запись JSON**

Обратное преобразование структуры в JSON выполняется через `json.Marshal`:

```go
user := User{Name: "Иван", Age: 25, Email: "ivan@example.com", Hobbies: []string{"спорт", "музыка"}}
jsonData, _ := json.Marshal(user)
fmt.Println(string(jsonData))
```

Теперь разберемся, как обрабатывать XML.

## **Парсинг XML**

XML (Extensible Markup Language) используется в веб-службах, RSS-лентах и конфигурационных файлах. Go предоставляет удобные инструменты для его обработки через пакет `encoding/xml`.

### **Как устроен XML**

XML — это древовидная структура данных, похожая на HTML:

```xml
<user>
    <name>Анна</name>
    <age>28</age>
    <email>anna@example.com</email>
</user>
```

XML можно преобразовать в структуру:

```go
package main

import (
	"encoding/xml"
	"fmt"
)

type User struct {
	Name  string `xml:"name"`
	Age   int    `xml:"age"`
	Email string `xml:"email"`
}

func main() {
	data := `<user><name>Анна</name><age>28</age><email>anna@example.com</email></user>`
	var user User

	err := xml.Unmarshal([]byte(data), &user)
	if err != nil {
		fmt.Println("Ошибка парсинга:", err)
		return
	}

	fmt.Println("Имя:", user.Name)
	fmt.Println("Возраст:", user.Age)
	fmt.Println("Email:", user.Email)
}
```

XML поддерживает атрибуты, вложенные структуры и сложные схемы данных. Теперь рассмотрим парсинг HTML.

## **Парсинг HTML с помощью goquery**

HTML — это основа веб-страниц. Чтобы извлекать из него информацию, в Go удобно использовать библиотеку `goquery`, которая дает возможность работать с DOM, как в jQuery.

### **Установка goquery**

```
go get github.com/PuerkitoBio/goquery
```

### **Извлечение заголовков с веб-страницы**

Допустим, нам нужно получить все заголовки `<h2>` со страницы:

```go
package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/PuerkitoBio/goquery"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Fatal(err)
	}

	doc.Find("h2").Each(func(i int, s *goquery.Selection) {
		fmt.Println("Заголовок:", s.Text())
	})
}
```

Этот код загружает HTML-страницу и извлекает текст заголовков.

## **Регулярные выражения в Go**

Иногда для парсинга текстовых данных удобнее использовать регулярные выражения. В Go для этого есть пакет `regexp`.

### **Пример поиска email-адресов в тексте**

```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	text := "Контакты: alex@example.com, support@company.org"
	re := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)

	emails := re.FindAllString(text, -1)
	fmt.Println("Найденные email:", emails)
}
```

Регулярные выражения удобны, когда формат данных неизвестен заранее.

## **Выбор метода парсинга**

Какой способ парсинга выбрать, зависит от формата данных:

- **JSON** — если данные приходят от API или хранятся в файлах.
- **XML** — если данные структурированы и содержат теги.
- **HTML** — если нужно извлекать информацию с веб-страниц.
- **Регулярные выражения** — если нужно находить паттерны в текстах.

## **Заключение**

Парсинг данных в Go реализуется через встроенные пакеты `encoding/json`, `encoding/xml` и `regexp`, а для сложных задач можно использовать `goquery` для работы с HTML.

Давайте подведем итоги:

- **JSON** — удобен для передачи данных между сервисами.
- **XML** — применяется в веб-службах и документах.
- **HTML** — можно разбирать с помощью `goquery`.
- **Регулярные выражения** — позволяют искать текстовые паттерны.

В зависимости от задачи выбирайте подходящий инструмент для работы с данными.
