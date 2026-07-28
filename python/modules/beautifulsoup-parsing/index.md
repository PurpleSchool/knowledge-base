---
metaTitle: "Парсинг сайтов с BeautifulSoup в Python"
metaDescription: "Как парсить сайты с помощью BeautifulSoup в Python: установка, поиск элементов, извлечение данных, навигация по дереву и практические примеры."
author: "Антон Ларичев"
title: "Парсинг сайтов с BeautifulSoup в Python"
preview: "Разбираем парсинг HTML-страниц с нуля: от установки BeautifulSoup до извлечения нужных данных с реальных сайтов."
---

## Что такое BeautifulSoup

BeautifulSoup — библиотека Python для разбора HTML и XML документов. Она строит дерево объектов из исходного кода страницы и предоставляет удобный API для поиска и извлечения данных. Библиотека не скачивает страницы сама — для этого используют `requests` или `httpx`. BeautifulSoup занимается только разбором уже полученного HTML.

Парсинг сайтов применяется для сбора данных о ценах, мониторинга изменений на страницах, агрегации новостей, автоматизации работы с веб-контентом.

## Установка

Для работы нужны две библиотеки: `requests` для скачивания страниц и `beautifulsoup4` для их разбора.

```bash
pip install requests beautifulsoup4
```

BeautifulSoup использует внешние парсеры. Самый быстрый и популярный — `lxml`:

```bash
pip install lxml
```

Если `lxml` недоступен, можно использовать встроенный `html.parser` — он медленнее, но не требует дополнительной установки.

## Первый парсер

Разберём базовый пример: скачиваем страницу и создаём объект BeautifulSoup.

```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com"
response = requests.get(url)

soup = BeautifulSoup(response.text, "lxml")
print(soup.title.text)
```

Второй аргумент `BeautifulSoup()` — парсер. Всегда указывайте его явно, иначе библиотека выберет сама и поведение может отличаться на разных машинах.

Если парсите локальный HTML без запросов к сети:

```python
html = """
<html>
  <body>
    <h1>Заголовок</h1>
    <p class="intro">Первый абзац</p>
    <p class="content">Второй абзац</p>
  </body>
</html>
"""

soup = BeautifulSoup(html, "lxml")
```

## Поиск элементов

### find и find_all

`find()` возвращает первый найденный элемент, `find_all()` — список всех совпадений.

```python
html = """
<ul>
  <li class="item">Первый</li>
  <li class="item">Второй</li>
  <li class="item active">Третий</li>
</ul>
"""

soup = BeautifulSoup(html, "lxml")

first_item = soup.find("li")
print(first_item.text)  # Первый

all_items = soup.find_all("li")
for item in all_items:
    print(item.text)
```

Поиск по атрибуту `class`:

```python
active = soup.find("li", class_="active")
print(active.text)  # Третий
```

Обратите внимание: используется `class_` с подчёркиванием, потому что `class` — зарезервированное слово Python.

Поиск по нескольким атрибутам сразу:

```python
result = soup.find("li", {"class": "item active"})
```

### Поиск по CSS-селекторам

Метод `select()` принимает CSS-селекторы и возвращает список элементов. `select_one()` возвращает первый.

```python
html = """
<div id="catalog">
  <div class="product">
    <h2 class="product-title">Товар 1</h2>
    <span class="price">1500 руб.</span>
  </div>
  <div class="product">
    <h2 class="product-title">Товар 2</h2>
    <span class="price">2300 руб.</span>
  </div>
</div>
"""

soup = BeautifulSoup(html, "lxml")

titles = soup.select(".product-title")
for title in titles:
    print(title.text)

first_price = soup.select_one("#catalog .price")
print(first_price.text)  # 1500 руб.
```

CSS-селекторы часто удобнее для сложных запросов, особенно если вы привыкли к JavaScript или jQuery.

## Извлечение данных

### Текст элемента

```python
html = "<p>Обычный <b>жирный</b> текст</p>"
soup = BeautifulSoup(html, "lxml")

p = soup.find("p")
print(p.text)          # Обычный жирный текст
print(p.get_text())    # то же самое
print(p.string)        # None — есть дочерние теги
print(p.b.string)      # жирный
```

`text` и `get_text()` возвращают весь текст включая дочерние элементы. `string` работает только если у элемента ровно один дочерний текстовый узел.

Для очистки лишних пробелов используйте параметр `strip`:

```python
print(p.get_text(strip=True))
```

### Атрибуты

Доступ к атрибутам как к словарю:

```python
html = '<a href="/page" class="link" data-id="42">Ссылка</a>'
soup = BeautifulSoup(html, "lxml")

a = soup.find("a")
print(a["href"])              # /page
print(a.get("data-id"))      # 42
print(a.get("missing", ""))  # — безопасно, без KeyError
print(a.attrs)               # {'href': '/page', 'class': ['link'], 'data-id': '42'}
```

Атрибут `class` всегда возвращается как список, даже если класс один.

## Навигация по дереву

BeautifulSoup строит дерево тегов. Можно перемещаться по нему вверх, вниз и в стороны.

```python
html = """
<div class="card">
  <h2>Заголовок</h2>
  <p>Первый абзац</p>
  <p>Второй абзац</p>
  <footer>Подвал</footer>
</div>
"""

soup = BeautifulSoup(html, "lxml")
card = soup.find("div", class_="card")

# Дочерние элементы
print(card.h2.text)               # Заголовок
print(list(card.children))       # все дочерние узлы включая пробелы

# Только теги, без текстовых узлов
for child in card.children:
    if child.name:
        print(child.name, child.text)

# Родитель
p = soup.find("p")
print(p.parent["class"])  # ['card']

# Следующий сосед
first_p = soup.find("p")
next_p = first_p.find_next_sibling("p")
print(next_p.text)  # Второй абзац

# Предыдущий сосед
print(next_p.find_previous_sibling("p").text)  # Первый абзац
```

## Практический пример: сбор новостей

Соберём заголовки и ссылки с гипотетической новостной страницы.

```python
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import List

@dataclass
class Article:
    title: str
    url: str
    summary: str


def parse_articles(html: str, base_url: str) -> List[Article]:
    soup = BeautifulSoup(html, "lxml")
    articles = []

    for card in soup.select(".news-card"):
        title_tag = card.select_one(".news-title a")
        summary_tag = card.select_one(".news-summary")

        if not title_tag:
            continue

        href = title_tag.get("href", "")
        url = href if href.startswith("http") else base_url + href

        articles.append(Article(
            title=title_tag.get_text(strip=True),
            url=url,
            summary=summary_tag.get_text(strip=True) if summary_tag else "",
        ))

    return articles


def fetch_articles(url: str) -> List[Article]:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return parse_articles(response.text, url)
```

Обратите внимание на несколько деталей:
- Заголовок `User-Agent` помогает избежать блокировки, когда сервер фильтрует запросы без него
- `timeout` защищает от зависания при недоступном сервере
- `raise_for_status()` бросает исключение при HTTP-ошибках (4xx, 5xx)
- Проверяем абсолютность ссылки перед добавлением базового URL

## Практический пример: парсинг таблицы

Таблицы встречаются на сайтах с финансовыми данными, расписаниями, каталогами.

```python
from bs4 import BeautifulSoup

html = """
<table class="prices">
  <thead>
    <tr>
      <th>Товар</th>
      <th>Цена</th>
      <th>Наличие</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ноутбук</td>
      <td>89000</td>
      <td>Да</td>
    </tr>
    <tr>
      <td>Монитор</td>
      <td>32000</td>
      <td>Нет</td>
    </tr>
  </tbody>
</table>
"""

soup = BeautifulSoup(html, "lxml")
table = soup.find("table", class_="prices")

# Читаем заголовки
headers = [th.get_text(strip=True) for th in table.select("thead th")]
print(headers)  # ['Товар', 'Цена', 'Наличие']

# Читаем строки
rows = []
for tr in table.select("tbody tr"):
    cells = [td.get_text(strip=True) for td in tr.find_all("td")]
    rows.append(dict(zip(headers, cells)))

for row in rows:
    print(row)
# {'Товар': 'Ноутбук', 'Цена': '89000', 'Наличие': 'Да'}
# {'Товар': 'Монитор', 'Цена': '32000', 'Наличие': 'Нет'}
```

## Обработка ошибок

При реальном парсинге структура страницы непредсказуема. Всегда проверяйте, что элемент найден.

```python
from bs4 import BeautifulSoup

def safe_parse(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")

    title_tag = soup.find("h1", class_="product-title")
    price_tag = soup.find("span", class_="price")
    img_tag = soup.find("img", class_="product-image")

    return {
        "title": title_tag.get_text(strip=True) if title_tag else None,
        "price": price_tag.get_text(strip=True) if price_tag else None,
        "image": img_tag.get("src") if img_tag else None,
    }
```

Используйте паттерн `tag.get_text() if tag else None` вместо `tag.get_text()` — это защищает от `AttributeError` когда элемент отсутствует на странице.

## Регулярные выражения в поиске

BeautifulSoup принимает скомпилированные регулярные выражения в аргументах поиска.

```python
import re
from bs4 import BeautifulSoup

html = """
<div class="price-usd">100$</div>
<div class="price-rub">9000 руб.</div>
<div class="description">Описание</div>
"""

soup = BeautifulSoup(html, "lxml")

# Найти все div, у которых class начинается с "price"
prices = soup.find_all("div", class_=re.compile(r"^price"))
for p in prices:
    print(p.text)

# Найти теги, в тексте которых есть число
tags_with_numbers = soup.find_all(string=re.compile(r"\d+"))
print(tags_with_numbers)  # ['100$', '9000 руб.']
```

## Ограничение глубины поиска

Параметр `recursive=False` ищет только среди прямых дочерних элементов, не уходя вглубь дерева.

```python
html = """
<div class="outer">
  <div class="inner">
    <p>Вложенный</p>
  </div>
  <p>Прямой потомок</p>
</div>
"""

soup = BeautifulSoup(html, "lxml")
outer = soup.find("div", class_="outer")

# Найдёт оба абзаца
all_p = outer.find_all("p")
print(len(all_p))  # 2

# Найдёт только прямого потомка
direct_p = outer.find_all("p", recursive=False)
print(len(direct_p))  # 1
print(direct_p[0].text)  # Прямой потомок
```

## Типичные проблемы и их решения

**Сайт не отдаёт данные при запросе через requests.** Многие сайты проверяют заголовки запроса. Добавьте реалистичный `User-Agent` и при необходимости `Accept`, `Accept-Language`.

**Данные загружаются через JavaScript.** BeautifulSoup разбирает только статический HTML. Если нужные данные подгружаются через JS, изучите сетевые запросы во вкладке Network в браузере — часто есть JSON API, который проще запросить напрямую. Для полноценного рендеринга JS используют Playwright или Selenium.

**Кодировка ломается.** Укажите кодировку явно:

```python
response = requests.get(url)
response.encoding = "utf-8"
soup = BeautifulSoup(response.text, "lxml")
```

**Парсинг работает медленно на большом количестве страниц.** Используйте `lxml` вместо `html.parser`, делайте конкурентные запросы через `asyncio` + `httpx`, добавляйте паузы между запросами чтобы не перегружать сервер.

## Этика и легальность парсинга

Перед парсингом изучите файл `robots.txt` сайта — он описывает, какие разделы нельзя сканировать. Не отправляйте запросы слишком часто: добавляйте паузы в 1–2 секунды между запросами. Уточните условия использования сайта — некоторые прямо запрещают автоматический сбор данных.

Для учебных задач и работы с открытыми данными BeautifulSoup — отличный инструмент. Для промышленного сбора данных рассмотрите специализированные фреймворки вроде Scrapy.

---

Чтобы освоить Python с нуля и научиться работать с внешними библиотеками, парсингом и автоматизацией — записывайтесь на курс: [Python-разработчик на PurpleSchool](https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=beautifulsoup-parsing)