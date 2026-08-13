---
metaTitle: "Polars Python: работа с большими данными"
metaDescription: "Полное руководство по библиотеке Polars в Python: DataFrames, ленивые вычисления, фильтрация и агрегация больших данных быстрее pandas."
author: "Антон Ларичев"
title: "Polars — работа с большими данными в Python"
preview: "Учимся работать с библиотекой Polars — быстрой альтернативой pandas для обработки больших объёмов данных в Python."
---

Polars — это библиотека для обработки данных на Python, написанная на Rust. Она значительно быстрее pandas при работе с большими датасетами и поддерживает параллельные вычисления из коробки. В этой статье разберём основные концепции Polars и научимся эффективно применять их на практике.

## Почему Polars быстрее pandas

Pandas хранит данные в формате NumPy-массивов и выполняет операции последовательно в один поток. Polars использует:

- **Apache Arrow** — колоночный формат хранения данных в памяти
- **Многопоточность** — операции выполняются параллельно на всех ядрах процессора
- **Ленивые вычисления (Lazy API)** — план запроса оптимизируется перед выполнением
- **Потоковая обработка** — данные, не помещающиеся в RAM, обрабатываются по частям

На датасетах от 1 млн строк Polars обгоняет pandas в 5–20 раз в зависимости от типа операции.

## Установка

```bash
pip install polars
```

Для работы с файлами CSV, Parquet, Excel дополнительных зависимостей не нужно — они включены в базовый пакет.

## Создание DataFrame

Основная структура данных в Polars — `DataFrame`. Создать его можно из словаря, списка или внешнего файла.

```python
import polars as pl

# Из словаря
df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "Diana"],
    "age": [25, 30, 35, 28],
    "salary": [80000, 95000, 110000, 72000],
    "department": ["Engineering", "Marketing", "Engineering", "HR"],
})

print(df)
```

```
shape: (4, 4)
┌─────────┬─────┬────────┬─────────────┐
│ name    ┆ age ┆ salary ┆ department  │
│ ---     ┆ --- ┆ ---    ┆ ---         │
│ str     ┆ i64 ┆ i64    ┆ str         │
╞═════════╪═════╪════════╪═════════════╡
│ Alice   ┆ 25  ┆ 80000  ┆ Engineering │
│ Bob     ┆ 30  ┆ 95000  ┆ Marketing   │
│ Charlie ┆ 35  ┆ 110000 ┆ Engineering │
│ Diana   ┆ 28  ┆ 72000  ┆ HR          │
└─────────┴─────┴────────┴─────────────┘
```

Polars автоматически определяет типы данных. В отличие от pandas, здесь нет типа `object` — строки всегда имеют тип `str`, а целые числа — `i32`, `i64` и т.д.

## Чтение данных из файлов

```python
# CSV
df = pl.read_csv("data.csv")

# Parquet — рекомендуемый формат для больших данных
df = pl.read_parquet("data.parquet")

# JSON
df = pl.read_json("data.json")

# Excel
df = pl.read_excel("data.xlsx")
```

Parquet — предпочтительный формат при работе с большими объёмами данных: он сжимает данные и хранит их колоночно, что ускоряет чтение конкретных колонок.

## Выражения (Expressions)

Главная концепция Polars — **выражения** (`pl.Expr`). Выражение описывает операцию над колонкой, но не выполняет её немедленно. Это позволяет Polars оптимизировать вычисления.

```python
# Выражение — это описание, а не результат
expr = pl.col("salary") * 1.1

# Выражение применяется внутри методов DataFrame
df.with_columns([
    (pl.col("salary") * 1.1).alias("salary_with_raise"),
    (pl.col("age") - 18).alias("years_of_adulthood"),
])
```

`pl.col("name")` — обращение к колонке по имени. `alias()` задаёт имя результирующей колонки.

## Фильтрация данных

```python
# Простой фильтр
senior = df.filter(pl.col("age") > 28)

# Несколько условий
engineers = df.filter(
    (pl.col("department") == "Engineering") & (pl.col("salary") > 85000)
)

# Фильтр по списку значений
selected_depts = df.filter(pl.col("department").is_in(["Engineering", "HR"]))

# Исключение null-значений
df_clean = df.filter(pl.col("salary").is_not_null())
```

Операторы в Polars: `&` (и), `|` (или), `~` (не). Использование `and`/`or` на уровне выражений не поддерживается — только побитовые операторы.

## Выбор и преобразование колонок

```python
# Выбор конкретных колонок
df.select(["name", "salary"])

# Выбор через выражения с преобразованием
df.select([
    pl.col("name").str.to_uppercase(),
    pl.col("salary") / 12,
    pl.col("age").cast(pl.Float64),
])

# Добавление новых колонок
df.with_columns([
    (pl.col("salary") / 12).round(2).alias("monthly_salary"),
    pl.lit("Russia").alias("country"),  # Константа
])
```

`pl.lit()` создаёт выражение из литерального значения — константы, которая будет одинакова для всех строк.

## Агрегация и группировка

```python
# Группировка с агрегацией
stats = df.group_by("department").agg([
    pl.col("salary").mean().alias("avg_salary"),
    pl.col("salary").max().alias("max_salary"),
    pl.col("salary").min().alias("min_salary"),
    pl.len().alias("count"),
])

print(stats)
```

```
shape: (3, 5)
┌─────────────┬────────────┬────────────┬────────────┬───────┐
│ department  ┆ avg_salary ┆ max_salary ┆ min_salary ┆ count │
│ ---         ┆ ---        ┆ ---        ┆ ---        ┆ ---   │
│ str         ┆ f64        ┆ i64        ┆ i64        ┆ u32   │
╞═════════════╪════════════╪════════════╪════════════╪═══════╡
│ Engineering ┆ 95000.0    ┆ 110000     ┆ 80000      ┆ 2     │
│ Marketing   ┆ 95000.0    ┆ 95000      ┆ 95000      ┆ 1     │
│ HR          ┆ 72000.0    ┆ 72000      ┆ 72000      ┆ 1     │
└─────────────┴────────────┴────────────┴────────────┴───────┘
```

```python
# Группировка по нескольким колонкам
df.group_by(["department", "age"]).agg(
    pl.col("salary").sum().alias("total_salary")
)
```

## Lazy API — ленивые вычисления

Lazy API — ключевая функция Polars для работы с большими данными. Вместо немедленного выполнения каждой операции Polars строит план запроса и оптимизирует его перед выполнением.

```python
# Переключение в ленивый режим
lazy_df = df.lazy()

# Построение плана запроса — вычислений пока нет
result = (
    lazy_df
    .filter(pl.col("age") > 25)
    .with_columns(
        (pl.col("salary") * 1.2).alias("bonus_salary")
    )
    .group_by("department")
    .agg(pl.col("bonus_salary").mean())
    .sort("bonus_salary", descending=True)
)

# Просмотр плана выполнения
result.explain()

# Выполнение запроса
final_df = result.collect()
```

Polars при вызове `collect()` оптимизирует план: убирает лишние колонки, переставляет фильтры вверх (predicate pushdown), объединяет операции.

### Потоковая обработка для датасетов больше RAM

```python
# Обработка файла по частям без загрузки всего в память
result = (
    pl.scan_csv("huge_file.csv")  # scan вместо read
    .filter(pl.col("value") > 1000)
    .group_by("category")
    .agg(pl.col("value").sum())
    .collect(streaming=True)  # потоковый режим
)
```

`pl.scan_csv()` / `pl.scan_parquet()` — ленивые аналоги `read_*`. Они не читают файл сразу, а планируют чтение. В сочетании с `streaming=True` это позволяет обрабатывать файлы размером в сотни гигабайт.

## Работа со строками

```python
df = pl.DataFrame({
    "email": ["alice@example.com", "BOB@GMAIL.COM", "charlie@work.org"],
    "full_name": ["Alice Smith", "Bob Jones", "Charlie Brown"],
})

result = df.with_columns([
    pl.col("email").str.to_lowercase().alias("email_lower"),
    pl.col("email").str.split("@").list.get(1).alias("domain"),
    pl.col("full_name").str.split(" ").list.get(0).alias("first_name"),
    pl.col("email").str.contains("gmail").alias("is_gmail"),
    pl.col("full_name").str.len_chars().alias("name_length"),
])
```

Строковые методы доступны через namespace `.str.`. Polars поддерживает регулярные выражения через `.str.extract()`, `.str.replace()`, `.str.contains()`.

## Работа с датами и временем

```python
df = pl.DataFrame({
    "date": ["2024-01-15", "2024-03-22", "2024-07-08"],
    "revenue": [15000, 23000, 31000],
})

result = df.with_columns([
    pl.col("date").str.to_date().alias("parsed_date"),
]).with_columns([
    pl.col("parsed_date").dt.year().alias("year"),
    pl.col("parsed_date").dt.month().alias("month"),
    pl.col("parsed_date").dt.day_of_week().alias("weekday"),
])

# Фильтрация по диапазону дат
from datetime import date

filtered = result.filter(
    pl.col("parsed_date").is_between(date(2024, 1, 1), date(2024, 6, 30))
)
```

Методы работы с датами доступны через namespace `.dt.`.

## Объединение DataFrame (Join)

```python
employees = pl.DataFrame({
    "emp_id": [1, 2, 3, 4],
    "name": ["Alice", "Bob", "Charlie", "Diana"],
    "dept_id": [10, 20, 10, 30],
})

departments = pl.DataFrame({
    "dept_id": [10, 20, 30],
    "dept_name": ["Engineering", "Marketing", "HR"],
    "budget": [500000, 200000, 150000],
})

# Inner join
inner = employees.join(departments, on="dept_id", how="inner")

# Left join
left = employees.join(departments, on="dept_id", how="left")

# Join по разным именам колонок
result = employees.join(
    departments,
    left_on="dept_id",
    right_on="dept_id",
    how="inner"
)
```

Polars поддерживает все стандартные типы join: `inner`, `left`, `right`, `full`, `cross`, `semi`, `anti`.

## Оконные функции

Оконные функции применяют агрегацию в контексте группы, не схлопывая строки.

```python
df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    "department": ["Eng", "Eng", "Marketing", "Marketing", "Eng"],
    "salary": [80000, 95000, 72000, 68000, 110000],
})

result = df.with_columns([
    pl.col("salary").mean().over("department").alias("dept_avg_salary"),
    pl.col("salary").rank(descending=True).over("department").alias("salary_rank"),
    (pl.col("salary") / pl.col("salary").sum().over("department")).alias("salary_share"),
])
```

`over()` — аналог `PARTITION BY` в SQL. Вычисляет агрегат внутри каждой группы и добавляет его как отдельную колонку.

## Производительность: практические советы

### Используйте Parquet вместо CSV

```python
# Запись в Parquet
df.write_parquet("data.parquet", compression="zstd")

# Чтение только нужных колонок
df = pl.read_parquet("data.parquet", columns=["name", "salary"])
```

Parquet сжимает данные колоночно — чтение 2 колонок из 100-колоночного файла читает только 2% данных с диска.

### Правильно выбирайте типы данных

```python
# Явное указание типов при чтении CSV
df = pl.read_csv("data.csv", schema={
    "id": pl.UInt32,
    "price": pl.Float32,
    "category": pl.Categorical,  # Строки с малым числом уникальных значений
})
```

`pl.Categorical` для строковых колонок с повторяющимися значениями (статусы, категории) — экономит память и ускоряет group_by.

### Предпочитайте Lazy API для цепочек операций

```python
# Неэффективно — каждая операция создаёт промежуточный DataFrame
result = df.filter(pl.col("age") > 20)
result = result.with_columns(pl.col("salary") * 1.1)
result = result.group_by("department").agg(pl.col("salary").mean())

# Эффективно — одна оптимизированная операция
result = (
    df.lazy()
    .filter(pl.col("age") > 20)
    .with_columns(pl.col("salary") * 1.1)
    .group_by("department")
    .agg(pl.col("salary").mean())
    .collect()
)
```

## Сравнение с pandas

| Задача | pandas | Polars |
|---|---|---|  
| Синтаксис фильтра | `df[df['age'] > 25]` | `df.filter(pl.col('age') > 25)` |
| Новая колонка | `df['new'] = df['a'] + 1` | `df.with_columns((pl.col('a') + 1).alias('new'))` |
| Группировка | `df.groupby('dept').agg({'salary': 'mean'})` | `df.group_by('dept').agg(pl.col('salary').mean())` |
| Чтение CSV | `pd.read_csv('f.csv')` | `pl.read_csv('f.csv')` |
| Ленивый режим | нет | `df.lazy()` / `pl.scan_csv()` |

Главное отличие — в Polars нет изменения DataFrame на месте. Все операции возвращают новый объект. Это предотвращает ошибки с непредвиденными изменениями данных.

## Экспорт данных

```python
# В pandas DataFrame (для совместимости)
pandas_df = df.to_pandas()

# В словарь
data_dict = df.to_dict(as_series=False)

# Запись в файлы
df.write_csv("output.csv")
df.write_parquet("output.parquet")
df.write_json("output.json")
df.write_excel("output.xlsx")
```

Polars хорошо интегрируется с экосистемой Python: можно конвертировать в pandas для использования с matplotlib, scikit-learn и другими библиотеками.

## Итог

Polars — мощный инструмент для обработки данных в Python, который существенно превосходит pandas по скорости на больших датасетах. Ключевые преимущества:

- **Lazy API** оптимизирует план выполнения и позволяет работать с данными, не помещающимися в RAM
- **Многопоточность** задействует все ядра процессора автоматически
- **Выражения** — единый декларативный способ описания любых трансформаций
- **Строгая типизация** предотвращает ошибки и ускоряет вычисления

Для новых проектов с объёмами данных от нескольких миллионов строк Polars — выбор по умолчанию. Для небольших датасетов (до 100k строк) разница незначительна и выбор между pandas и Polars — вопрос привычки.

Чтобы глубже освоить Python и научиться работать с данными профессионально, пройдите курс на PurpleSchool: https://purpleschool.ru/course/python?utm_source=knowledgebase&utm_medium=text&utm_campaign=polars-big-data