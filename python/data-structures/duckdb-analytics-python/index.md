---
metaTitle: "DuckDB аналитика с Python — быстрые запросы к данным"
metaDescription: "Как использовать DuckDB с Python для аналитики: SQL-запросы, интеграция с pandas и Parquet, агрегации и работа с большими данными."
author: "Антон Ларичев"
title: "DuckDB аналитика с Python"
preview: "Разбираем DuckDB — встраиваемую аналитическую базу данных для Python: установка, SQL-запросы, интеграция с pandas и Parquet-файлами."
---

## Что такое DuckDB

DuckDB — это встраиваемая аналитическая СУБД, которая работает прямо внутри вашего процесса Python, без отдельного сервера. По духу она похожа на SQLite, но заточена не под транзакционные операции (OLTP), а под аналитику (OLAP): агрегации по миллионам строк, оконные функции, чтение Parquet и CSV-файлов.

Главные особенности:

- Выполняет SQL прямо в памяти процесса — никакого сетевого оверхеда
- Колонночное хранилище данных, векторизованная обработка
- Нативная интеграция с pandas, Polars, Arrow
- Читает Parquet, CSV, JSON без предварительной загрузки в базу
- Многопоточность из коробки

Для задач типа «загрузил файл — посчитал статистику — выгрузил результат» DuckDB часто в разы быстрее pandas и значительно проще в настройке, чем PostgreSQL или ClickHouse.

## Установка

DuckDB распространяется как обычный Python-пакет без внешних зависимостей:

```bash
pip install duckdb
```

Для работы с pandas и Parquet понадобятся дополнительные пакеты:

```bash
pip install duckdb pandas pyarrow
```

## Первые шаги: подключение и запросы

### In-memory база

Самый простой вариант — создать базу целиком в памяти. Данные живут только пока существует соединение:

```python
import duckdb

con = duckdb.connect()  # in-memory

con.execute("""
    CREATE TABLE orders (
        id INTEGER,
        product VARCHAR,
        amount DOUBLE,
        created_at DATE
    )
""")

con.execute("""
    INSERT INTO orders VALUES
        (1, 'Laptop',  75000.0, '2024-01-15'),
        (2, 'Mouse',   2500.0,  '2024-01-16'),
        (3, 'Laptop',  75000.0, '2024-01-17'),
        (4, 'Monitor', 35000.0, '2024-01-17'),
        (5, 'Mouse',   2500.0,  '2024-01-18')
""")

result = con.execute("SELECT product, SUM(amount) AS total FROM orders GROUP BY product").fetchdf()
print(result)
```

Вывод:
```
   product    total
0   Laptop  150000.0
1    Mouse    5000.0
2  Monitor   35000.0
```

Метод `fetchdf()` возвращает результат как `pandas.DataFrame`. Есть и другие варианты:

- `fetchall()` — список кортежей
- `fetchone()` — первая строка
- `fetchnumpy()` — словарь numpy-массивов
- `arrow()` — Apache Arrow Table

### Файловая база

Чтобы данные сохранялись между запусками, передайте путь к файлу:

```python
con = duckdb.connect('analytics.duckdb')
```

Файл создастся при первом подключении. Все последующие подключения к тому же пути откроют существующую базу.

## Интеграция с pandas

DuckDB умеет напрямую обращаться к pandas DataFrame по имени переменной — без явной загрузки данных:

```python
import duckdb
import pandas as pd

df = pd.DataFrame({
    'user_id': [1, 1, 2, 2, 3],
    'event':   ['view', 'buy', 'view', 'view', 'buy'],
    'revenue': [0, 5000, 0, 0, 3000]
})

# df доступен по имени переменной прямо в SQL
result = duckdb.sql("""
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE event = 'view') AS views,
        COUNT(*) FILTER (WHERE event = 'buy')  AS purchases,
        SUM(revenue) AS total_revenue
    FROM df
    GROUP BY user_id
    ORDER BY user_id
""").df()

print(result)
```

Вывод:
```
   user_id  views  purchases  total_revenue
0        1      1          1           5000
1        2      2          0              0
2        3      0          1           3000
```

Обратите внимание: `duckdb.sql()` использует глобальное соединение и сканирует DataFrame напрямую из памяти Python без копирования данных. Метод `.df()` — синоним `fetchdf()`.

### Запись результата обратно в DataFrame

```python
df_clean = duckdb.sql("""
    SELECT *
    FROM df
    WHERE revenue > 0
    ORDER BY revenue DESC
""").df()
```

## Работа с CSV и Parquet

Одна из сильных сторон DuckDB — возможность читать файлы напрямую в SQL-запросе, без предварительной загрузки.

### Чтение CSV

```python
import duckdb

# Сгенерируем тестовый CSV
import pandas as pd
pd.DataFrame({
    'date':    ['2024-01', '2024-01', '2024-02', '2024-02'],
    'region':  ['North', 'South', 'North', 'South'],
    'sales':   [120000, 85000, 135000, 92000]
}).to_csv('sales.csv', index=False)

# Читаем и агрегируем без загрузки в таблицу
result = duckdb.sql("""
    SELECT
        date,
        SUM(sales)  AS total_sales,
        AVG(sales)  AS avg_sales
    FROM read_csv_auto('sales.csv')
    GROUP BY date
    ORDER BY date
""").df()

print(result)
```

Функция `read_csv_auto` автоматически определяет разделитель, типы столбцов и наличие заголовка. Для ручного управления есть `read_csv` с явными параметрами:

```python
duckdb.sql("""
    SELECT * FROM read_csv(
        'data.csv',
        delim = ';',
        header = true,
        columns = {'id': 'INTEGER', 'name': 'VARCHAR', 'value': 'DOUBLE'}
    )
""").df()
```

### Чтение Parquet

Parquet — колонночный формат, идеально подходящий для аналитики. DuckDB читает его особенно эффективно, используя predicate pushdown: если в запросе есть WHERE, файл не читается целиком.

```python
import duckdb
import pandas as pd

# Создадим тестовый Parquet-файл
df = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=1000, freq='h'),
    'sensor_id': [f'S{i % 10:02d}' for i in range(1000)],
    'value':     [float(i % 100) for i in range(1000)]
})
df.to_parquet('sensors.parquet', index=False)

# Запрос с фильтрацией — DuckDB прочитает только нужные данные
result = duckdb.sql("""
    SELECT
        sensor_id,
        COUNT(*)       AS readings,
        AVG(value)     AS avg_value,
        MAX(value)     AS max_value
    FROM read_parquet('sensors.parquet')
    WHERE timestamp >= '2024-01-10'
    GROUP BY sensor_id
    ORDER BY sensor_id
""").df()

print(result)
```

### Glob-паттерны для множества файлов

DuckDB читает сразу несколько файлов через glob:

```python
# Все CSV в директории
duckdb.sql("SELECT COUNT(*) FROM read_csv_auto('data/*.csv')").fetchone()

# Все Parquet-партиции
duckdb.sql("SELECT * FROM read_parquet('warehouse/year=2024/month=*/*.parquet')").df()
```

## Аналитические функции

DuckDB поддерживает полный набор оконных (window) функций стандарта SQL:

```python
import duckdb
import pandas as pd

df = pd.DataFrame({
    'month':    ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'],
    'revenue':  [100000, 120000, 95000, 140000, 130000]
})

result = duckdb.sql("""
    SELECT
        month,
        revenue,
        SUM(revenue) OVER (
            ORDER BY month
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_revenue,
        AVG(revenue) OVER (
            ORDER BY month
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) AS moving_avg_3m,
        revenue - LAG(revenue) OVER (ORDER BY month) AS mom_delta
    FROM df
    ORDER BY month
""").df()

print(result)
```

Вывод:
```
     month  revenue  cumulative_revenue  moving_avg_3m  mom_delta
0  2024-01   100000              100000      100000.0        NaN
1  2024-02   120000              220000      110000.0    20000.0
2  2024-03    95000              315000      105000.0   -25000.0
3  2024-04   140000              455000      118333.3    45000.0
4  2024-05   130000              585000      121666.7   -10000.0
```

## Параметризованные запросы

Чтобы защититься от SQL-инъекций и переиспользовать запросы, используйте параметры:

```python
import duckdb

con = duckdb.connect()
con.execute("""
    CREATE TABLE events AS
    SELECT * FROM (VALUES
        ('click', 'page_a', 10),
        ('view',  'page_b', 25),
        ('click', 'page_b', 7)
    ) t(event_type, page, count)
""")

# Параметры через ?
event_type = 'click'
result = con.execute(
    "SELECT page, count FROM events WHERE event_type = ?",
    [event_type]
).fetchdf()

print(result)
```

## Экспорт данных

DuckDB умеет писать результаты напрямую в файлы:

```python
import duckdb
import pandas as pd

df = pd.DataFrame({'x': range(1000), 'y': [i ** 2 for i in range(1000)]})

con = duckdb.connect()

# Экспорт в CSV
con.execute("""
    COPY (
        SELECT x, y, y - LAG(y) OVER (ORDER BY x) AS delta
        FROM df
    ) TO 'output.csv' (HEADER, DELIMITER ',')
""")

# Экспорт в Parquet
con.execute("""
    COPY (
        SELECT * FROM df WHERE x > 500
    ) TO 'output.parquet' (FORMAT PARQUET)
""")
```

## Производительность: сравнение с pandas

Показательный пример: агрегация по 10 миллионам строк.

```python
import duckdb
import pandas as pd
import numpy as np
import time

# Генерируем тестовые данные
N = 10_000_000
df = pd.DataFrame({
    'category': np.random.choice(['A', 'B', 'C', 'D'], N),
    'value':    np.random.randn(N)
})

# Замер pandas
t0 = time.perf_counter()
result_pd = df.groupby('category')['value'].agg(['mean', 'std', 'count'])
t1 = time.perf_counter()
print(f'pandas: {t1 - t0:.3f}s')

# Замер DuckDB
t0 = time.perf_counter()
result_ddb = duckdb.sql("""
    SELECT
        category,
        AVG(value)    AS mean,
        STDDEV(value) AS std,
        COUNT(*)      AS count
    FROM df
    GROUP BY category
""").df()
t1 = time.perf_counter()
print(f'DuckDB: {t1 - t0:.3f}s')
```

Типичные результаты на современном железе (8 ядер):

```
pandas: 1.240s
DuckDB: 0.180s
```

DuckDB автоматически распараллеливает запрос по всем доступным ядрам. Управлять числом потоков можно через настройку:

```python
con = duckdb.connect()
con.execute("SET threads TO 4")
```

## Работа с JSON

DuckDB читает JSON-файлы и умеет извлекать вложенные поля:

```python
import duckdb
import json

# Создадим тестовый JSON
events = [
    {"user": "alice", "meta": {"page": "/home",   "duration": 30}},
    {"user": "bob",   "meta": {"page": "/product", "duration": 120}},
    {"user": "alice", "meta": {"page": "/cart",    "duration": 60}}
]
with open('events.json', 'w') as f:
    json.dump(events, f)

result = duckdb.sql("""
    SELECT
        user,
        meta->>'page'                  AS page,
        CAST(meta->>'duration' AS INT) AS duration_sec
    FROM read_json_auto('events.json')
""").df()

print(result)
```

## Практический кейс: ETL-пайплайн

Реалистичный пример: читаем несколько CSV-файлов, чистим данные и пишем агрегат в Parquet:

```python
import duckdb
import pandas as pd

# Имитируем входные файлы
for month in ['2024-01', '2024-02', '2024-03']:
    pd.DataFrame({
        'date':     [month] * 100,
        'product':  [f'P{i % 5}' for i in range(100)],
        'qty':      [abs(i % 20) for i in range(100)],
        'price':    [float((i % 10 + 1) * 100) for i in range(100)]
    }).to_csv(f'sales_{month}.csv', index=False)

con = duckdb.connect()

# ETL одним SQL-запросом
con.execute("""
    COPY (
        WITH raw AS (
            SELECT *
            FROM read_csv_auto('sales_*.csv')
            WHERE qty > 0 AND price > 0          -- фильтрация мусора
        ),
        enriched AS (
            SELECT
                date,
                product,
                qty,
                price,
                qty * price AS revenue
            FROM raw
        )
        SELECT
            date,
            product,
            SUM(qty)     AS total_qty,
            SUM(revenue) AS total_revenue,
            AVG(price)   AS avg_price
        FROM enriched
        GROUP BY date, product
        ORDER BY date, product
    ) TO 'monthly_summary.parquet' (FORMAT PARQUET, COMPRESSION ZSTD)
""")

print('Готово. Результат:')
print(duckdb.sql("SELECT * FROM 'monthly_summary.parquet' LIMIT 5").df())
```

## Когда выбирать DuckDB

DuckDB хорошо подходит когда:

- Нужно быстро обработать файлы (CSV, Parquet, JSON) без поднятия сервера
- Аналитика на ноутбуке или в CI/CD-пайплайне без инфраструктуры
- Требуются сложные SQL-запросы: оконные функции, CTE, FILTER-агрегации
- Данные умещаются в оперативной памяти или немного превышают её (DuckDB умеет spillover на диск)

DuckDB менее подходит когда:

- Данные хранятся в реляционной БД с нормализацией (OLTP)
- Нужны конкурентные записи от множества клиентов одновременно
- Объём данных исчисляется терабайтами — здесь нужен кластерный движок (Spark, Trino)

## Итог

DuckDB занимает нишу между pandas и облачными хранилищами данных: он даёт скорость колонночного движка и мощь SQL прямо в Python-процессе, без настройки серверов и сетевых подключений. Для большинства аналитических задач на данных до нескольких гигабайт это оптимальный инструмент.

Для углублённого изучения Python и работы с данными — курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=duckdb-analytics-python