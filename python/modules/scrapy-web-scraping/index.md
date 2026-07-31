---
metaTitle: "Scrapy в Python: веб-скрапинг для разработчиков"
metaDescription: "Полное руководство по Scrapy в Python: установка, создание пауков, селекторы CSS и XPath, пайплайны, запуск и экспорт данных."
author: "Антон Ларичев"
title: "Веб-скрапинг с Scrapy в Python"
preview: "Изучите Scrapy — мощный фреймворк для веб-скрапинга в Python. Создавайте пауков, парсите HTML с CSS и XPath, обрабатывайте данные через пайплайны."
---

## Что такое Scrapy

Scrapy — это асинхронный фреймворк для веб-скрапинга и краулинга сайтов на Python. В отличие от библиотек requests + BeautifulSoup, Scrapy предоставляет полноценную архитектуру: встроенное управление очередями запросов, обработку ошибок, дросселирование и экспорт данных в различные форматы.

Fреймворк строится на Twisted — асинхронном сетевом движке, что позволяет обрабатывать сотни запросов параллельно без явного использования asyncio.

## Установка и создание проекта

Установите Scrapy через pip:

```bash
pip install scrapy
```

Создайте новый проект командой:

```bash
scrapy startproject bookstore
cd bookstore
```

Фреймворк генерирует следующую структуру:

```
bookstore/
    scrapy.cfg              # конфиг деплоя
    bookstore/
        __init__.py
        items.py            # модели данных
        middlewares.py      # промежуточные обработчики
        pipelines.py        # пайплайны обработки
        settings.py         # настройки проекта
        spiders/            # директория для пауков
            __init__.py
```

## Первый паук

Паук (Spider) — класс, описывающий, как обходить сайт и извлекать данные. Создайте файл `bookstore/spiders/books_spider.py`:

```python
import scrapy


class BooksSpider(scrapy.Spider):
    name = "books"  # уникальное имя паука
    start_urls = ["https://books.toscrape.com/"]

    def parse(self, response):
        for book in response.css("article.product_pod"):
            yield {
                "title": book.css("h3 a::attr(title)").get(),
                "price": book.css("p.price_color::text").get(),
                "rating": book.css("p.star-rating::attr(class)").get(),
                "availability": book.css("p.availability::text").getall(),
            }

        next_page = response.css("li.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)
```

Ключевые атрибуты класса:

- `name` — идентификатор паука, используется при запуске
- `start_urls` — список начальных URL, с которых стартует обход
- `parse` — метод по умолчанию для обработки ответов

Метод `parse` принимает объект `Response` и должен возвращать либо словари/Item-объекты с данными, либо объекты `Request` для перехода на следующие страницы.

## Селекторы CSS и XPath

Scrapy предоставляет два способа выборки элементов из HTML.

### CSS-селекторы

```python
def parse(self, response):
    # Получить текст элемента
    title = response.css("h1.product_title::text").get()

    # Получить значение атрибута
    image_url = response.css("div.item img::attr(src)").get()

    # Получить список всех совпадений
    tags = response.css("ul.breadcrumb li a::text").getall()

    # Работа с вложенными выборками
    for row in response.css("table.table tr"):
        label = row.css("th::text").get()
        value = row.css("td::text").get()
        yield {"label": label, "value": value}
```

Особенности синтаксиса Scrapy CSS:

- `::text` — псевдоэлемент для извлечения текстового содержимого
- `::attr(name)` — псевдоэлемент для извлечения атрибута
- `.get()` — возвращает первое совпадение или `None`
- `.getall()` — возвращает список всех совпадений

### XPath-селекторы

XPath удобен для более сложных выборок с условиями:

```python
def parse(self, response):
    # Текст заголовка
    title = response.xpath("//h1[@class='product_title']/text()").get()

    # Атрибут src у картинки внутри div
    image_url = response.xpath("//div[@class='item']//img/@src").get()

    # Элементы с условием по тексту
    in_stock = response.xpath(
        "//p[@class='availability'][contains(text(), 'In stock')]"
    ).get()

    # Переход к соседнему элементу
    price = response.xpath(
        "//th[text()='Price (excl. tax)']/following-sibling::td/text()"
    ).get()
```

### Комбинирование подходов

```python
def parse(self, response):
    for book in response.css("article.product_pod"):
        # CSS для простых выборок
        title = book.css("h3 a::attr(title)").get()
        # XPath для условных
        rating_class = book.xpath(".//p[contains(@class,'star-rating')]/@class").get()
        yield {"title": title, "rating_class": rating_class}
```

## Модели данных — Items

Для структурированного хранения данных Scrapy использует Item — словарь с объявленными полями. Откройте `bookstore/items.py`:

```python
import scrapy


class BookItem(scrapy.Item):
    title = scrapy.Field()
    price = scrapy.Field()
    rating = scrapy.Field()
    upc = scrapy.Field()
    availability = scrapy.Field()
    description = scrapy.Field()
    image_url = scrapy.Field()
```

Использование в пауке:

```python
from bookstore.items import BookItem


class BooksSpider(scrapy.Spider):
    name = "books"
    start_urls = ["https://books.toscrape.com/"]

    def parse(self, response):
        for book in response.css("article.product_pod"):
            item = BookItem()
            item["title"] = book.css("h3 a::attr(title)").get()
            item["price"] = book.css("p.price_color::text").get()
            item["rating"] = book.css("p.star-rating::attr(class)").get()
            detail_url = book.css("h3 a::attr(href)").get()
            yield response.follow(detail_url, self.parse_detail, cb_kwargs={"item": item})

        next_page = response.css("li.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_detail(self, response, item):
        item["upc"] = response.xpath(
            "//th[text()='UPC']/following-sibling::td/text()"
        ).get()
        item["description"] = response.css("#product_description ~ p::text").get()
        item["image_url"] = response.css("div.item img::attr(src)").get()
        yield item
```

## Пайплайны обработки данных

Item Pipeline — цепочка обработчиков, через которую проходит каждый собранный Item. Откройте `bookstore/pipelines.py`:

```python
import re


class PricePipeline:
    """Очищает цену от символа валюты и приводит к float."""

    def process_item(self, item, spider):
        price = item.get("price", "")
        cleaned = re.sub(r"[^\d.]", "", price)
        item["price"] = float(cleaned) if cleaned else None
        return item


class RatingPipeline:
    """Преобразует CSS-класс рейтинга в числовое значение."""

    RATING_MAP = {
        "One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5
    }

    def process_item(self, item, spider):
        rating_class = item.get("rating", "")
        for word, value in self.RATING_MAP.items():
            if word in rating_class:
                item["rating"] = value
                return item
        item["rating"] = None
        return item


class DuplicateFilterPipeline:
    """Фильтрует дубликаты по UPC."""

    def open_spider(self, spider):
        self.seen_upcs = set()

    def process_item(self, item, spider):
        upc = item.get("upc")
        if upc in self.seen_upcs:
            from scrapy.exceptions import DropItem
            raise DropItem(f"Duplicate UPC: {upc}")
        self.seen_upcs.add(upc)
        return item
```

Подключите пайплайны в `settings.py`:

```python
ITEM_PIPELINES = {
    "bookstore.pipelines.PricePipeline": 100,
    "bookstore.pipelines.RatingPipeline": 200,
    "bookstore.pipelines.DuplicateFilterPipeline": 300,
}
```

Число задаёт порядок выполнения — меньшее значение означает более раннее выполнение (диапазон 0–1000).

## Настройки проекта

Основные параметры в `settings.py`:

```python
# Задержка между запросами (в секундах)
DOWNLOAD_DELAY = 1

# Количество параллельных запросов
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 4

# Авторепрезентация бота
USER_AGENT = "Mozilla/5.0 (compatible; MyBot/1.0)"

# Соблюдение robots.txt
ROBOTSTXT_OBEY = True

# Автоматическое дросселирование (адаптация скорости под нагрузку сервера)
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10

# Кэш HTTP-ответов
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600
HTTPCACHE_DIR = ".scrapy/httpcache"
```

## Запуск паука и экспорт данных

Запустить паука и сохранить результат:

```bash
# Вывод в JSON
scrapy crawl books -o books.json

# Вывод в JSONL (строка — один объект, удобно для больших данных)
scrapy crawl books -o books.jsonl

# Вывод в CSV
scrapy crawl books -o books.csv

# Запуск с передачей аргументов
scrapy crawl books -a category=mystery -o mystery_books.json
```

Передача аргументов в паук через `__init__`:

```python
class BooksSpider(scrapy.Spider):
    name = "books"

    def __init__(self, category=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.category = category
        base_url = "https://books.toscrape.com"
        if category:
            self.start_urls = [f"{base_url}/catalogue/category/books/{category}/index.html"]
        else:
            self.start_urls = [f"{base_url}/"]
```

## Отладка в интерактивной оболочке

Scrapy Shell позволяет тестировать селекторы без запуска полного краулера:

```bash
scrapy shell "https://books.toscrape.com/"
```

Внутри оболочки доступны переменные `response`, `request`, а также функции `fetch()` и `view()`:

```python
# Проверить CSS-селектор
response.css("article.product_pod h3 a::attr(title)").getall()

# Открыть страницу в браузере для визуальной проверки
view(response)

# Перейти на другой URL
fetch("https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html")

# Проверить XPath
response.xpath("//th[text()='UPC']/following-sibling::td/text()").get()
```

## Пайплайн записи в базу данных

Пример пайплайна для сохранения данных в SQLite через sqlite3:

```python
import sqlite3


class SQLitePipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect("books.db")
        self.cursor = self.conn.cursor()
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                upc TEXT PRIMARY KEY,
                title TEXT,
                price REAL,
                rating INTEGER,
                description TEXT
            )
        """)
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.close()

    def process_item(self, item, spider):
        self.cursor.execute("""
            INSERT OR REPLACE INTO books (upc, title, price, rating, description)
            VALUES (?, ?, ?, ?, ?)
        """, (
            item.get("upc"),
            item.get("title"),
            item.get("price"),
            item.get("rating"),
            item.get("description"),
        ))
        self.conn.commit()
        return item
```

## Итоги

Scrapy предоставляет полноценную экосистему для промышленного веб-скрапинга:

- Асинхронные запросы через Twisted без ручного управления потоками
- CSS и XPath селекторы для гибкого извлечения данных
- Item и Item Pipeline для валидации, трансформации и сохранения
- Встроенное дросселирование, кэширование и соблюдение robots.txt
- Удобная Shell для интерактивной отладки селекторов

Для простых одностраничных задач достаточно requests + BeautifulSoup. Scrapy оправдывает себя при обходе многостраничных сайтов, необходимости параллельных запросов и построении пайплайнов обработки.

Чтобы глубже освоить Python и научиться создавать реальные проекты от простых скриптов до полноценных приложений, приходите на курс [Python на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=scrapy-web-scraping).