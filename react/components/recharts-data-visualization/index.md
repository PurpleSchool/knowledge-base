---
metaTitle: "Recharts в React: графики и диаграммы для разработчика"
metaDescription: "Практическое руководство по Recharts: LineChart, BarChart, PieChart, кастомные тултипы и адаптивные графики в React-приложениях."
author: "Антон Ларичев"
title: "Визуализация данных в React с Recharts"
preview: "Как подключить Recharts и построить LineChart, BarChart и PieChart с тултипами, легендой и адаптивностью в React-приложении."
---

## Что такое Recharts и зачем его использовать

Recharts — это библиотека для визуализации данных, построенная поверх D3.js и React. В отличие от прямого использования D3, Recharts предоставляет декларативный API: каждый элемент графика — это React-компонент. Это означает, что вы работаете с привычной JSX-моделью и не погружаетесь в императивные манипуляции с SVG.

Основные преимущества Recharts:

- **Composable API** — граф собирается из независимых компонентов (`XAxis`, `YAxis`, `Tooltip`, `Line` и т.д.), которые можно добавлять и убирать без переписывания всей конфигурации.
- **Адаптивность из коробки** — компонент `ResponsiveContainer` берёт на себя подписку на размер родительского элемента.
- **Поддержка TypeScript** — типы поставляются вместе с пакетом.
- **Небольшой бандл** — при tree-shaking подтягиваются только использованные типы графиков.

## Установка

```bash
npm install recharts
```

Recharts требует React 16.8+ и ReactDOM. Если вы работаете в проекте с TypeScript, никаких дополнительных `@types` устанавливать не нужно — типы идут в комплекте.

## Структура графика в Recharts

Любой график в Recharts состоит из трёх уровней:

1. **Контейнер** — `ResponsiveContainer` или фиксированный контейнер с явными `width` и `height`.
2. **Тип графика** — `LineChart`, `BarChart`, `AreaChart`, `PieChart` и другие. Компонент принимает данные и общие настройки.
3. **Элементы** — `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, а также непосредственно серии данных: `Line`, `Bar`, `Area`.

```tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
```

## LineChart — линейный график

Линейный график подходит для отображения изменения величины во времени. Покажем динамику продаж двух продуктов за шесть месяцев.

```tsx
const salesData = [
  { month: 'Янв', productA: 4200, productB: 2800 },
  { month: 'Фев', productA: 3800, productB: 3200 },
  { month: 'Мар', productA: 5100, productB: 3900 },
  { month: 'Апр', productA: 4700, productB: 4100 },
  { month: 'Май', productA: 6300, productB: 4600 },
  { month: 'Июн', productA: 5900, productB: 5200 },
];

export function SalesLineChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={salesData}
        margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: '#fcfcfb',
            border: '1px solid #e5e5e3',
            borderRadius: 6,
          }}
          formatter={(value: number) => [
            value.toLocaleString('ru-RU'),
            '',
          ]}
        />
        <Legend
          iconType="plainline"
          wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="productA"
          name="Продукт A"
          stroke="#2a78d6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="productB"
          name="Продукт B"
          stroke="#eb6834"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

Несколько важных деталей в этом примере:

- `vertical={false}` у `CartesianGrid` убирает вертикальные линии сетки — они почти никогда не помогают читать значения и только создают визуальный шум.
- `axisLine={false}` и `tickLine={false}` делают оси более лаконичными.
- `dot={false}` скрывает точки на линии в спокойном состоянии; `activeDot` показывает акцент только при наведении.
- Для двух серий обязательно присутствует `Legend` — идентичность не должна передаваться только цветом.

## BarChart — столбчатая диаграмма

Столбчатый график эффективен для сравнения величин по категориям. Добавим сгруппированные столбцы для сравнения нескольких регионов.

```tsx
const regionData = [
  { region: 'Север', q1: 3400, q2: 4100 },
  { region: 'Юг',   q1: 2900, q2: 3700 },
  { region: 'Запад', q1: 4800, q2: 5200 },
  { region: 'Восток', q1: 3100, q2: 3500 },
];

export function RegionBarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={regionData}
        margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e3" vertical={false} />
        <XAxis
          dataKey="region"
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f0f0ef' }}
          contentStyle={{
            background: '#fcfcfb',
            border: '1px solid #e5e5e3',
            borderRadius: 6,
          }}
        />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 13 }} />
        <Bar
          dataKey="q1"
          name="Q1"
          fill="#2a78d6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="q2"
          name="Q2"
          fill="#eb6834"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

`radius={[4, 4, 0, 0]}` скругляет только верхние углы столбца — нижняя граница «заземлена» на ось и скругление там выглядело бы неестественно.

`cursor={{ fill: '#f0f0ef' }}` задаёт фон подсветки при наведении на группу столбцов. Значение берётся чуть темнее фона графика, чтобы зона была читаема, но не отвлекала от данных.

## PieChart — круговая диаграмма

Круговую диаграмму используйте только тогда, когда нужно показать состав целого, и категорий не более пяти. Recharts предлагает также вариант `donut` — кольцевую диаграмму, которую можно задать через `innerRadius` у компонента `Pie`.

```tsx
const marketShare = [
  { name: 'Категория A', value: 38 },
  { name: 'Категория B', value: 27 },
  { name: 'Категория C', value: 20 },
  { name: 'Категория D', value: 15 },
];

const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

export function MarketSharePieChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={marketShare}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={120}
          paddingAngle={2}
        >
          {marketShare.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
              stroke="#fcfcfb"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#fcfcfb',
            border: '1px solid #e5e5e3',
            borderRadius: 6,
          }}
          formatter={(value: number) => [`${value}%`, '']}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

`paddingAngle={2}` добавляет зазор в 2px между сегментами — это аналог зазора между столбцами в BarChart, который помогает воспринимать каждый сегмент как отдельную сущность. `strokeWidth={2}` с цветом поверхности (`#fcfcfb`) создаёт тот же эффект со стороны SVG.

## Кастомный Tooltip

Встроенный тултип удобен для прототипов, но в продакшне часто нужен кастомный — с форматированием, единицами измерения или дополнительным контекстом.

```tsx
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function SalesTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: '#fcfcfb',
        border: '1px solid #e5e5e3',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, color: '#0b0b0b' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ margin: 0, color: '#52514e' }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: entry.color,
              marginRight: 6,
            }}
          />
          {entry.name}: {entry.value.toLocaleString('ru-RU')} ₽
        </p>
      ))}
    </div>
  );
}

// Использование:
<Tooltip content={<SalesTooltip />} />
```

Кастомный тултип получает через пропсы `active` (виден ли тултип сейчас), `payload` (массив значений всех серий в данной точке) и `label` (значение оси X). Когда `active` равен `false` или `payload` пуст, компонент возвращает `null` — это стандартная идиома Recharts.

## AreaChart — область под линией

`AreaChart` строится аналогично `LineChart`, но добавляет заливку под линией. Это особенно полезно для единственной серии, когда нужно акцентировать объём, а не только тренд.

```tsx
import { AreaChart, Area } from 'recharts';

export function RevenueAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={salesData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2a78d6" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#2a78d6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#52514e', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#fcfcfb',
            border: '1px solid #e5e5e3',
            borderRadius: 6,
          }}
        />
        <Area
          type="monotone"
          dataKey="productA"
          stroke="#2a78d6"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

Градиент задаётся через SVG `<linearGradient>` внутри `<defs>`. `stopOpacity` от 0.18 вверху до 0 у основания создаёт плавное угасание — заливка поддерживает линию, не доминируя над ней. При одной серии `Legend` не нужен: заголовок графика называет её.

## Адаптивность и ResponsiveContainer

`ResponsiveContainer` — обёртка, которая следит за шириной и высотой родительского DOM-элемента через `ResizeObserver` и передаёт актуальные размеры вложенному графику. Используйте её вместо фиксированных `width` и `height` на самом графике.

```tsx
// Правильно — график растягивается под контейнер
<div style={{ width: '100%' }}>
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</div>

// Допустимо — фиксированная высота при относительной ширине
<ResponsiveContainer width="100%" aspect={16 / 9}>
  <BarChart data={data}>...</BarChart>
</ResponsiveContainer>
```

Проп `aspect` задаёт соотношение сторон вместо фиксированной высоты — удобно, когда нужно сохранить пропорции при разных ширинах экрана.

## Производительность: работа с большими наборами данных

При отображении тысяч точек Recharts начинает тормозить, так как перерисовывает весь SVG при каждом ре-рендере. Несколько приёмов помогают это контролировать.

**Мемоизируйте данные и конфигурацию:**

```tsx
function ChartWrapper({ rawData }: { rawData: RawPoint[] }) {
  const chartData = useMemo(
    () => rawData.map((p) => ({ date: formatDate(p.ts), value: p.v })),
    [rawData]
  );

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>...</LineChart>
    </ResponsiveContainer>
  );
}
```

**Отключите анимацию при частых обновлениях:**

```tsx
<Line
  type="monotone"
  dataKey="value"
  stroke="#2a78d6"
  strokeWidth={2}
  isAnimationActive={false}
/>
```

Анимация при каждом обновлении реального времени создаёт визуальную нестабильность и нагружает GPU. Для live-дашбордов `isAnimationActive={false}` — правильный выбор.

## Итог

Recharts — зрелая библиотека с предсказуемым API: вы работаете с компонентами, а не с императивными командами. Ключевые принципы при построении графиков:

- Всегда оборачивайте в `ResponsiveContainer` для адаптивности.
- Для двух и более серий используйте `Legend` — цвет не должен быть единственным кодом идентичности.
- Всегда присутствует `Tooltip` — это базовый слой взаимодействия, без него пользователь не может получить точные значения.
- Убирайте визуальный шум: `axisLine={false}`, `tickLine={false}`, горизонтальная сетка вместо полной.
- Мемоизируйте данные через `useMemo` при сложных трансформациях.

Чтобы глубже разобраться в построении интерфейсов на React и работе с компонентами — от хуков до сложных паттернов — записывайтесь на курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-recharts