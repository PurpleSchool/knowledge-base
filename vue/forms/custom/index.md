---
metaTitle: Кастомные компоненты формы в веб приложениях
metaDescription: Разбираем как создавать и использовать кастомные компоненты формы в современных веб приложениях - архитектура управление состоянием валидация интеграция с UI библиотеками
author: Олег Марков
title: Кастомные компоненты формы - подходы и лучшие практики
preview: Практическое руководство по созданию и использованию кастомных компонентов формы - от проектирования API до валидации и повторного использования в реальных проектах
---

## Введение

Кастомные компоненты формы помогают вынести часто повторяющиеся элементы интерфейса (поле ввода, селект, дата-пикер, переключатель) в отдельные блоки с единым поведением и единым визуальным стилем. Это особенно полезно, когда у вас много форм, сложные правила валидации и требования к единообразию UI.

Смотрите, я покажу вам, как на практике организовать такую архитектуру: вы создаете один раз компонент `TextField`, `SelectField`, `CheckboxField`, а потом просто используете их в разных формах, не дублируя логику ошибок, форматирования и обработки событий.

В статье мы будем говорить в основном о веб‑разработке на JavaScript и TypeScript, опираясь на подход с компонентами (React‑стиль). Но большинство идей легко переносится и в другие фреймворки.

---

## Что такое кастомный компонент формы

### Базовая идея

Кастомный компонент формы — это не просто “обёртка над input”. Это компонент с чётким контрактом:

- он умеет:
  - отображать текущее значение;
  - сообщать об изменениях наверх;
  - показывать состояние ошибки, фокуса, disabled;
- он не:
  - хранит финальное состояние всей формы;
  - не принимает решения о том, валидно ли поле по сложным правилам (это обычно ответственность уровня формы или валидатора).

Проще всего представить такой интерфейс:

- `value` — текущее значение поля;
- `onChange(newValue)` — колбэк, который вызывается при изменении;
- `error` — текст ошибки или индикатор наличия ошибки;
- `label` — подпись поля;
- опционально: `onBlur`, `onFocus`, `disabled`, `required`, `placeholder`.

Теперь давайте разберем, как этот контракт реализуется в коде.

### Пример базового текстового поля

Сначала посмотрим простой вариант на React без привязки к конкретной форме:

```tsx
import React from "react";

type TextFieldProps = {
  label?: string;              // Подпись над полем
  value: string;               // Текущее значение поля
  onChange: (value: string) => void; // Колбэк при изменении значения
  error?: string;              // Текст ошибки, если есть
  placeholder?: string;        // Текст подсказки
  disabled?: boolean;          // Флаг отключения поля
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled,
}) => {
  // Обработчик события изменения "сырых" DOM-событий
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Здесь мы вызываем onChange с "чистым" значением
    onChange(event.target.value);
  };

  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}

      <input
        className={`field__input ${error ? "field__input--error" : ""}`}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />

      {error && <div className="field__error">{error}</div>}
    </div>
  );
};
```

Обратите внимание, как этот фрагмент кода решает задачу разделения ответственности:

- компонент не знает, откуда пришло `value` и кто обрабатывает `onChange`;
- он просто превращает DOM‑событие `onChange` в более удобный для формы формат: `onChange(newValue: string)`.

---

## Основные принципы проектирования API кастомного компонента

### Однонаправленный поток данных

Компонент формы должен получать значение через пропсы и отправлять изменения наверх. То есть:

- `value` приходит сверху;
- `onChange` уходит наверх.

Вам не нужно хранить “главное” значение поля внутри компонента. Внутреннее состояние может использоваться для:

- временных эффектов (например, состояние фокуса для особого стиля);
- локального UI (раскрыт ли список подсказок).

Но ключевое значение поля пусть живёт вне компонента, в состоянии формы.

### Контролируемый vs неконтролируемый компонент

Есть два подхода:

- контролируемый — поле полностью управляется через `value` и `onChange`;
- неконтролируемый — используется `defaultValue`, а текущее значение находится в DOM (через реф).

Для формы с валидацией, отправкой на сервер и дебагом обычно выгоднее контролируемый подход. Давайте посмотрим, как реализуется контролируемый компонент селекта.

```tsx
type SelectOption = {
  label: string; // Текст варианта
  value: string; // Значение, которое уходит наверх
};

type SelectFieldProps = {
  label?: string;
  value: string | null;               // Выбранное значение или null
  onChange: (value: string | null) => void; // Колбэк при выборе
  options: SelectOption[];            // Набор опций
  error?: string;
};

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value || null; 
    // Здесь мы приводим пустое значение к null
    onChange(newValue);
  };

  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}

      <select
        className={`field__select ${error ? "field__select--error" : ""}`}
        value={value ?? ""} // Здесь мы превращаем null в пустую строку
        onChange={handleChange}
      >
        <option value="">Не выбрано</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <div className="field__error">{error}</div>}
    </div>
  );
};
```

Как видите, этот код выполняет понятную задачу: он берёт модель вида `string | null` и адаптирует её к требованиям DOM‑элемента `<select>`.

---

## Связка кастомных компонентов с формой

Теперь давайте посмотрим, как кастомные компоненты встроить в реальную форму. Я покажу вам пример на “ручном” стейте без сторонних библиотек, затем с популярной библиотекой.

### Пример простой формы без библиотеки

Допустим, у нас есть форма регистрации с полями:

- имя;
- email;
- согласие с политикой.

Создадим страницу формы:

```tsx
import React, { useState } from "react";
import { TextField } from "./TextField";
import { CheckboxField } from "./CheckboxField";

// Компонент флажка (чекбокса)
type CheckboxFieldProps = {
  label: string;                     // Подпись рядом с флажком
  checked: boolean;                  // Текущее состояние
  onChange: (value: boolean) => void; // Колбэк при изменении
  error?: string;                    // Текст ошибки
};

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  checked,
  onChange,
  error,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Здесь мы забираем актуальное значение флажка
    onChange(event.target.checked);
  };

  return (
    <div className="field field--checkbox">
      <label className="field__label">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
        />
        {label}
      </label>

      {error && <div className="field__error">{error}</div>}
    </div>
  );
};

export const RegisterForm: React.FC = () => {
  // Здесь мы храним данные формы
  const [values, setValues] = useState({
    name: "",
    email: "",
    agree: false,
  });

  // Здесь мы храним ошибки по полям
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    agree?: string;
  }>({});

  // Простая валидация
  const validate = () => {
    const newErrors: typeof errors = {};

    if (!values.name.trim()) {
      newErrors.name = "Имя обязательно";
    }

    if (!values.email.includes("@")) {
      newErrors.email = "Укажите корректный email";
    }

    if (!values.agree) {
      newErrors.agree = "Нужно согласиться с условиями";
    }

    setErrors(newErrors);

    // Здесь мы возвращаем флаг успешности валидации
    return Object.keys(newErrors).length === 0;
  };

  // Обновление одного поля
  const updateField = <K extends keyof typeof values>(
    field: K,
    value: (typeof values)[K]
  ) => {
    // Здесь мы обновляем только одно поле формы
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Здесь запускаем валидацию перед отправкой
    if (!validate()) return;

    // Здесь работаем с валидными данными (например, отправляем на сервер)
    console.log("Submit", values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Имя"
        value={values.name}
        onChange={(value) => updateField("name", value)}
        error={errors.name}
        placeholder="Введите ваше имя"
      />

      <TextField
        label="Email"
        value={values.email}
        onChange={(value) => updateField("email", value)}
        error={errors.email}
        placeholder="example@mail.com"
      />

      <CheckboxField
        label="Я согласен с условиями"
        checked={values.agree}
        onChange={(value) => updateField("agree", value)}
        error={errors.agree}
      />

      <button type="submit">Зарегистрироваться</button>
    </form>
  );
};
```

Давайте посмотрим, что происходит в этом примере:

- кастомные компоненты (`TextField`, `CheckboxField`) ничего не знают о валидации и отправке;
- форма отвечает за:
  - состояние значений;
  - состояние ошибок;
  - логику валидации и сабмита;
- общение идёт через универсальный контракт: `value` + `onChange`.

---

## Интеграция кастомных компонентов с библиотеками форм

Во многих проектах вы будете использовать библиотеки вроде React Hook Form, Formik или Final Form. Давайте посмотрим, как ваш кастомный компонент “подружить” с такими библиотеками.

### Пример с React Hook Form

React Hook Form работает с полями через функцию `register` или контроллер `Controller`. Сложные кастомные компоненты удобнее подключать через `Controller`.

Смотрите, здесь я размещаю пример использования `TextField` с React Hook Form:

```tsx
import { useForm, Controller } from "react-hook-form";
import { TextField } from "./TextField";

type FormValues = {
  name: string;
  email: string;
};

export const ProfileForm: React.FC = () => {
  // Здесь инициализируем форму
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Здесь мы получаем уже валидные данные
    console.log("Form data", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"        // Имя поля в модели формы
        control={control}  // Контроллер формы
        rules={{ required: "Имя обязательно" }} // Правила валидации
        render={({ field }) => (
          <TextField
            label="Имя"
            value={field.value}                  // Текущее значение из формы
            onChange={field.onChange}           // Обработчик изменения
            error={errors.name?.message}        // Текст ошибки из формы
            placeholder="Введите имя"
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        rules={{
          required: "Email обязателен",
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Некорректный email",
          },
        }}
        render={({ field }) => (
          <TextField
            label="Email"
            value={field.value}
            onChange={field.onChange}
            error={errors.email?.message}
            placeholder="example@mail.com"
          />
        )}
      />

      <button type="submit">Сохранить</button>
    </form>
  );
};
```

Здесь вы видите, что наш компонент `TextField` никак не меняется. Мы просто адаптируем то, что даёт `Controller` (`field.value`, `field.onChange`) к ожидаемым пропсам компонента.

---

## Валидация и отображение ошибок в кастомных компонентах

### Где должна жить логика валидации

Частый вопрос — нужно ли “зашивать” валидацию внутрь компонента поля. Обычно ответ — нет:

- валидация зависит от контекста формы (одно и то же поле может валидироваться по‑разному);
- логику проще тестировать отдельно.

Кастомный компонент должен только:

- иметь возможность отобразить ошибку (`error` пропс);
- при необходимости показывать разные стили в зависимости от присутствия ошибки.

Если вам всё же нужно встроить простую валидацию (например, маску или проверку формата), вы можете сделать:

- “сырой” компонент `TextFieldBase` — без валидации;
- “расширенный” компонент `EmailField`, который поверх него накладывает правила.

### Пример поля с примитивной валидацией внутри

Здесь я покажу вам пример с локальной валидацией email. Такой подход стоит использовать аккуратно, но он бывает полезен:

```tsx
type EmailFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void; // Колбэк изменения валидности
};

export const EmailField: React.FC<EmailFieldProps> = ({
  label,
  value,
  onChange,
  onValidChange,
}) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (newValue: string) => {
    // Здесь мы пробрасываем новое значение наверх
    onChange(newValue);

    // Здесь мы выполняем локальную валидацию
    if (!newValue) {
      setError("Email обязателен");
      onValidChange?.(false);
    } else if (!/\S+@\S+\.\S+/.test(newValue)) {
      setError("Некорректный email");
      onValidChange?.(false);
    } else {
      setError(null);
      onValidChange?.(true);
    }
  };

  return (
    <TextField
      label={label ?? "Email"}
      value={value}
      onChange={handleChange}
      error={error ?? undefined}
      placeholder="example@mail.com"
    />
  );
};
```

Как видите, этот код выполняет две задачи:

- следит за локальной ошибкой поля;
- при изменении валидности сообщает об этом наверх через `onValidChange`.

---

## Повторное использование и унификация стилей

### Единый набор пропсов для всех полей

Чтобы кастомные компоненты формы было проще использовать и поддерживать, имеет смысл выработать общий интерфейс:

- `label`;
- `value`;
- `onChange`;
- `error`;
- `disabled`;
- `required`.

Затем все ваши компоненты (`TextField`, `SelectField`, `CheckboxField`, `DateField`) будут следовать этому контракту. Тогда:

- любая форма может легко переключить тип поля, не меняя код вокруг;
- вы можете писать обёртки и вспомогательные утилиты, которые работают с любыми полями.

Вот пример базового интерфейса:

```ts
// Общий интерфейс для "простого" поля
export type BaseFieldProps<Value> = {
  label?: string;                 // Подпись над полем
  value: Value;                   // Текущее значение
  onChange: (value: Value) => void; // Обработчик изменения
  error?: string;                 // Текст ошибки
  disabled?: boolean;             // Состояние disabled
  required?: boolean;             // Обязательное поле
};
```

А затем вы просто используете этот интерфейс:

```tsx
type TextFieldProps = BaseFieldProps<string> & {
  placeholder?: string;           // Дополнительный пропс
};
```

### Управление темами и визуальными вариантами

Часто требуется иметь несколько визуальных вариантов одного поля: например, “обычный” и “компактный”. Вместо того чтобы плодить разные компоненты, вы можете добавить проп `variant`:

```ts
type Variant = "default" | "compact" | "outlined";

type StyledFieldProps = {
  variant?: Variant; // Вариант отображения
};
```

И использовать его в нескольких компонентах. Важно, чтобы дизайн‑система и кастомные компоненты формы работали согласованно:

- одно и то же поле везде выглядит одинаково;
- изменение дизайна делается в одном месте.

---

## Форматирование и маски ввода

Многие кастомные компоненты формы должны:

- форматировать отображаемое значение (например, цена, дата, телефон);
- хранить “сырое” значение в модельном формате.

### Пример: поле для суммы

Давайте разберемся на примере поля суммы с форматированием через пробелы:

- в состоянии формы вы хотите число `number`;
- на экране — строку вроде `10 000`.

Покажу вам, как это реализовано на практике:

```tsx
type PriceFieldProps = {
  label?: string;
  value: number | null;             // Числовое значение
  onChange: (value: number | null) => void; // Колбэк при изменении
  error?: string;
};

// Утилита для форматирования числа
const formatPrice = (value: number | null): string => {
  // Здесь мы обрабатываем случай пустого значения
  if (value == null) return "";
  return value.toLocaleString("ru-RU"); // Например, "10 000"
};

// Утилита для парсинга строки в число
const parsePrice = (text: string): number | null => {
  // Здесь мы удаляем пробелы
  const normalized = text.replace(/\s/g, "");
  if (!normalized) return null;
  const num = Number(normalized);
  // Здесь фильтруем NaN
  return Number.isNaN(num) ? null : num;
};

export const PriceField: React.FC<PriceFieldProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  // Здесь мы храним "отображаемую" строку
  const [display, setDisplay] = React.useState<string>(formatPrice(value));

  React.useEffect(() => {
    // Здесь мы синхронизируем локальное отображение,
    // если внешнее значение поменялось
    setDisplay(formatPrice(value));
  }, [value]);

  const handleChange = (text: string) => {
    // Здесь обновляем локальную строку
    setDisplay(text);

    // Здесь парсим строку в число и пробрасываем наверх
    const numericValue = parsePrice(text);
    onChange(numericValue);
  };

  return (
    <TextField
      label={label ?? "Сумма"}
      value={display}
      onChange={handleChange}
      error={error}
      placeholder="Например 10 000"
    />
  );
};
```

В этом примере:

- компонент управляет и строкой отображения, и числом в модели;
- форма работает только с числом `number | null` — для неё всё прозрачно.

---

## Доступность (Accessibility) и кастомные компоненты

Когда вы делаете свои компоненты формы, важно не потерять нативную доступность, которую дают стандартные поля. Постарайтесь:

- связывать `label` и поле через `id` и `htmlFor`;
- указывать `aria-invalid`, `aria-describedby` для ошибок;
- не ломать поведение клавиатуры.

### Минимальный пример с поддержкой aria

Здесь я покажу вам, как немного улучшить `TextField` для screen reader:

```tsx
type AccessibleTextFieldProps = TextFieldProps & {
  id?: string; // Явный id поля
};

export const AccessibleTextField: React.FC<AccessibleTextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled,
  id,
}) => {
  const inputId = id ?? React.useId();           // Здесь генерируем id
  const errorId = `${inputId}-error`;           // Id для блока ошибки

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`field__input ${error ? "field__input--error" : ""}`}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}          // Флаг ошибки для скринридера
        aria-describedby={error ? errorId : undefined} // Связь с текстом ошибки
      />

      {error && (
        <div id={errorId} className="field__error">
          {error}
        </div>
      )}
    </div>
  );
};
```

Теперь пользователь вспомогательных технологий получит корректную информацию о том, что поле невалидно и почему.

---

## Сложные компоненты формы

Иногда кастомный компонент представляет собой целую мини‑форму: например, выбор временного интервала, фильтры, адрес с несколькими полями.

Здесь важно решить:

- кто хранит состояние внутренних полей — сам компонент или родитель;
- как представить результат в модельной форме — объект, массив, строку.

### Пример: компонент выбора интервала дат

Давайте разберемся на примере поля “диапазон дат”. Оно может выглядеть так:

- внутри два поля `startDate` и `endDate`;
- наружу выходит один объект с обоими значениями.

```tsx
type DateRange = {
  start: string | null;  // Дата начала в формате YYYY-MM-DD
  end: string | null;    // Дата конца в том же формате
};

type DateRangeFieldProps = {
  label?: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  error?: string;
};

// Упрощённый пример без календаря
export const DateRangeField: React.FC<DateRangeFieldProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  const handleStartChange = (start: string) => {
    // Здесь мы обновляем только дату начала
    onChange({ ...value, start: start || null });
  };

  const handleEndChange = (end: string) => {
    // Здесь мы обновляем только дату конца
    onChange({ ...value, end: end || null });
  };

  return (
    <div className="field field--daterange">
      {label && <div className="field__label">{label}</div>}

      <div className="field__row">
        <input
          type="date"
          value={value.start ?? ""}
          onChange={(e) => handleStartChange(e.target.value)}
        />
        <span className="field__separator">—</span>
        <input
          type="date"
          value={value.end ?? ""}
          onChange={(e) => handleEndChange(e.target.value)}
        />
      </div>

      {error && <div className="field__error">{error}</div>}
    </div>
  );
};
```

Здесь вы видите типичный паттерн:

- сложный компонент использует несколько “голых” полей внутри;
- наружу отдаётся одно структурированное значение (`DateRange`);
- контракт по‑прежнему тот же: `value` + `onChange` + `error`.

---

## Тестирование кастомных компонентов формы

Чтобы быть уверенным, что ваши компоненты работают стабильно, полезно писать тесты:

- юнит‑тесты для форматирования и парсинга;
- компонентные тесты (например, с React Testing Library) для проверки поведения.

### Что имеет смысл проверить

- значение отображается корректно при разных входных данных;
- при изменении в DOM вызывается `onChange` с нужным значением;
- ошибка отображается при переданном `error`;
- disabled блокирует ввод и нажатия.

Пример простого теста на React Testing Library (псевдокодовый, без конкретного раннера):

```tsx
// Здесь мы проверяем, что TextField вызывает onChange с правильным значением

test("TextField calls onChange with typed value", () => {
  const handleChange = jest.fn(); // Мокаем обработчик

  render(
    <TextField
      label="Имя"
      value=""
      onChange={handleChange}
    />
  );

  const input = screen.getByLabelText("Имя"); // Находим поле по подписи

  fireEvent.change(input, { target: { value: "Иван" } }); // Вводим значение

  expect(handleChange).toHaveBeenCalledWith("Иван"); // Проверяем аргумент
});
```

Такие тесты помогают не “сломать” контракт компонента при будущих изменениях.

---

## Заключение

Кастомные компоненты формы — это способ вынести повторяющиеся элементы и поведение формы в переиспользуемые блоки с единым API. Если обобщить основные моменты:

- определите понятный контракт значения: `value`, `onChange`, `error`, `disabled`, `label`;
- держите основное состояние формы и валидацию на уровне формы или библиотеки форм;
- используйте контролируемые компоненты для предсказуемости и удобства валидации;
- не забывайте про форматирование и маски, но отделяйте отображаемое значение от модельного;
- учитывайте доступность: `label`, `aria-*`, связь с текстом ошибок;
- тестируйте компоненты, чтобы сохранить их поведение при развитии проекта.

Если вы будете придерживаться этих принципов, ваши custom-form-components станут основой стабильной, предсказуемой и легко поддерживаемой формы в приложении.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как передать в кастомный компонент форму сразу все методы валидации и сабмита

Обычно лучше не передавать “всю форму” в поле. Вместо этого вы можете передать только нужные части. Например, в React Hook Form использовать `useFormContext` внутри компонента. Тогда компонент сам возьмёт `register`, `formState` и другие методы, не усложняя пропсы родителя.

### Как сделать кастомный компонент совместимым и с “ручной” формой и с библиотекой

Проектируйте компонент так, чтобы он не зависел от конкретной библиотеки. Вместо того чтобы принимать `field` из Formik или RHF, принимайте только `value`, `onChange` и `error`. А в месте использования пишите адаптер: для “ручной” формы — свой, для библиотеки — обёртку через `Controller` или `Field`.

### Как прокинуть событие blur или focus из кастомного компонента в форму

Добавьте в контракт компонента пропсы `onBlur?: () => void` и `onFocus?: () => void`. Внутри DOM‑элемента (`input`, `select`) вызовите их в соответствующих обработчиках: `onBlur={e => { field.onBlur(e); props.onBlur?.(); }}`. Так форма получит свои события, а родитель сможет добавить дополнительные реакции.

### Как организовать типизацию кастомных компонентов с разными типами значений

Используйте дженерики. Например, `BaseFieldProps<Value>` с `value: Value` и `onChange: (value: Value) => void`. Для строки укажите `BaseFieldProps<string>`, для числа — `BaseFieldProps<number | null>`. Это позволит TypeScript корректно проверять совместимость полей и формы.

### Как оптимизировать перерисовки при большом количестве кастомных полей

Следите за тем, чтобы пропсы не создавали новых объектов при каждом рендере. Выносите обработчики `onChange` в `useCallback`, храните состояние формы в одной структуре и обновляйте только изменённое поле. Для кастомных компонентов полезно использовать `React.memo`, если пропсы не меняются по ссылке без необходимости.