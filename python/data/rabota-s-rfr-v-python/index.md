---
metaTitle: Работа с RFR в Python
metaDescription: Узнайте, как работать с Random Forest Regressor (RFR) в Python — настройка модели, обучение, предсказание и оценка качества с использованием scikit-learn и практическими примерами.
author: Олег Марков
title: Работа с RFR в Python
preview: Разберем работу с Random Forest Regressor в Python — настройка, обучение модели, предсказания и оценка качества с помощью scikit-learn.
---

## Введение

Random Forest Regressor (RFR) — один из популярных алгоритмов машинного обучения для регрессии, основанный на ансамбле деревьев решений. Он применяется для предсказания числовых значений, устойчив к переобучению и хорошо справляется с разнообразными наборами данных.

В этой статье мы разберемся, как настроить RFR, обучить модель на данных, выполнять предсказания и оценивать её качество в Python с использованием библиотеки scikit-learn.

Если вы хотите детальнее погрузиться в машинное обучение и работу с моделями регрессии — приходите на наш курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota_s_RFR_v_Python). На курсе 209 уроков и 34 упражнения, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами. Вы освоите работу с RFR и другими алгоритмами машинного обучения.

## Установка и подключение библиотек

Для работы с RFR используется библиотека scikit-learn. Установите её, если ещё не сделали:

```bash
pip install scikit-learn
```

Импортируем необходимые модули:

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pandas as pd
```

## Подготовка данных

Предположим, у нас есть набор данных о домах с признаками `size`, `rooms` и целевой переменной `price`:

```python
data = pd.DataFrame({
    "size": [50, 60, 70, 80, 90],
    "rooms": [1, 2, 2, 3, 3],
    "price": [150, 200, 250, 300, 350]
})

X = data[["size", "rooms"]]
y = data["price"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

## Обучение модели RFR

Создаём объект модели и обучаем:

```python
rfr = RandomForestRegressor(n_estimators=100, random_state=42)
rfr.fit(X_train, y_train)
```

* `n_estimators` — количество деревьев в лесу.
* `random_state` — фиксирует случайность для воспроизводимости результатов.

## Предсказание и оценка качества

```python
y_pred = rfr.predict(X_test)

# Оценка качества
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("MSE:", mse)
print("R2 score:", r2)
```

## Настройка гиперпараметров

Основные параметры, которые можно настраивать:

* `max_depth` — максимальная глубина дерева.
* `min_samples_split` — минимальное количество выборок для разбиения узла.
* `min_samples_leaf` — минимальное количество выборок в листе.

Пример:

```python
rfr = RandomForestRegressor(
    n_estimators=200,
    max_depth=5,
    min_samples_split=4,
    random_state=42
)
rfr.fit(X_train, y_train)
```

## Важность признаков

Random Forest позволяет оценить, какие признаки наиболее влияют на предсказания:

```python
import matplotlib.pyplot as plt

importances = rfr.feature_importances_
features = X.columns

plt.bar(features, importances)
plt.title("Feature Importances")
plt.show()
```

## Частые ошибки

* Передача категориальных признаков без кодирования → `ValueError`.
* Неправильное разбиение на train/test → смещенные результаты.
* Использование слишком малого числа деревьев → нестабильные предсказания.
* Игнорирование масштабирования для других моделей в пайплайне (не критично для RFR, но важно для смешанных моделей).

## Часто задаваемые вопросы

1. **Можно ли использовать RFR для классификации?**
   Нет, для классификации существует `RandomForestClassifier`.

2. **Как выбрать количество деревьев?**
   Чаще всего используют 100–500 деревьев. Большее количество повышает точность, но увеличивает время обучения.

3. **Нужно ли масштабировать данные для RFR?**
   Нет, алгоритм не чувствителен к масштабам признаков.

4. **Как избежать переобучения?**
   Используйте ограничение глубины дерева (`max_depth`), минимальное количество выборок на разбиение (`min_samples_split`) и кросс-валидацию.

## Заключение

Random Forest Regressor — мощный инструмент для предсказания числовых значений и работы с разнообразными признаками. В Python его легко использовать через scikit-learn, обучать на данных, делать предсказания и оценивать качество модели. Настройка гиперпараметров и анализ важности признаков позволяет создавать точные и устойчивые модели.

Для системного изучения машинного обучения, работы с RFR и другими алгоритмами Python рекомендую пройти курс [Основы Python](https://purpleschool.ru/course/python-basics?utm_source=knowledgebase&utm_medium=article&utm_campaign=Rabota_s_RFR_v_Python). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Python прямо сегодня.
