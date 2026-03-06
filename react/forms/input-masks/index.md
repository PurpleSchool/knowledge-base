---
metaTitle: Маски ввода в React - форматирование телефонов, дат, карт
metaDescription: Руководство по реализации масок ввода в React. Библиотеки react-input-mask, imask, react-imask, кастомные маски для телефонов, дат, банковских карт и ИНН
author: Олег Марков
title: Маски ввода
preview: Узнайте, как реализовать маски ввода в React-формах — с помощью популярных библиотек и вручную. Форматирование телефонных номеров, дат, банковских карт и произвольных паттернов
---

# Маски ввода в React

## Введение

Маски ввода — это механизм, который помогает пользователю вводить данные в определённом формате: телефонный номер `+7 (999) 123-45-67`, дата `31.12.2024`, номер карты `1234 5678 9012 3456`. Маска автоматически добавляет разделители, ограничивает ввод нужными символами и визуально показывает ожидаемый формат.

В React существует несколько подходов к реализации масок: использование готовых библиотек (react-input-mask, imask/react-imask) или написание кастомной логики. В этой статье мы рассмотрим оба варианта.

## Библиотека react-input-mask

`react-input-mask` — одна из самых популярных библиотек для масок в React. Простой API, лёгкая интеграция.

### Установка

```bash
npm install react-input-mask
```

### Базовое использование

```jsx
import InputMask from 'react-input-mask';

function PhoneInput() {
  const [phone, setPhone] = useState('');

  return (
    <InputMask
      mask="+7 (999) 999-99-99"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
    >
      {(inputProps) => <input {...inputProps} type="tel" placeholder="Телефон" />}
    </InputMask>
  );
}
```

### Синтаксис маски

В `react-input-mask` используются специальные символы:
- `9` — любая цифра (0-9)
- `a` — любая буква (A-Z, a-z)
- `*` — любой символ (буква или цифра)

```jsx
// Телефон
<InputMask mask="+7 (999) 999-99-99" />

// Дата
<InputMask mask="99.99.9999" />

// Время
<InputMask mask="99:99" />

// ИНН (12 цифр для физлица)
<InputMask mask="999999999999" />

// Серия и номер паспорта
<InputMask mask="99 99 999999" />

// Произвольный формат
<InputMask mask="aa-999" />
```

### Настройка символа заполнителя

```jsx
<InputMask
  mask="+7 (999) 999-99-99"
  maskChar="_"  // Символ для незаполненных позиций (по умолчанию '_')
  placeholder="+7 (___) ___-__-__"
/>
```

### Экранирование символов маски

Если нужно использовать символы маски как обычные символы:

```jsx
// Экранирование через backslash
<InputMask mask="+\7 (999) 999-99-99" />
// Или через фигурные скобки
<InputMask mask="+{7} (999) 999-99-99" />
```

### Интеграция с контролируемыми компонентами

```jsx
function ProfileForm() {
  const [values, setValues] = useState({
    phone: '',
    birthDate: '',
    inn: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form>
      <div>
        <label>Телефон</label>
        <InputMask
          mask="+7 (999) 999-99-99"
          name="phone"
          value={values.phone}
          onChange={handleChange}
        >
          {(inputProps) => <input {...inputProps} type="tel" />}
        </InputMask>
      </div>

      <div>
        <label>Дата рождения</label>
        <InputMask
          mask="99.99.9999"
          name="birthDate"
          value={values.birthDate}
          onChange={handleChange}
        >
          {(inputProps) => <input {...inputProps} type="text" />}
        </InputMask>
      </div>

      <div>
        <label>ИНН</label>
        <InputMask
          mask="999999999999"
          name="inn"
          value={values.inn}
          onChange={handleChange}
        >
          {(inputProps) => <input {...inputProps} type="text" />}
        </InputMask>
      </div>
    </form>
  );
}
```

## Библиотека IMask (react-imask)

`imask` — более мощная и гибкая библиотека с поддержкой динамических масок, паттернов и форматирования чисел.

### Установка

```bash
npm install imask react-imask
```

### Базовое использование

```jsx
import { IMaskInput } from 'react-imask';

function PhoneInput() {
  const [value, setValue] = useState('');

  return (
    <IMaskInput
      mask="+{7} (000) 000-00-00"
      value={value}
      onAccept={(value) => setValue(value)}
      placeholder="+7 (999) 999-99-99"
    />
  );
}
```

В IMask:
- `0` — любая цифра
- `a` — любая буква
- `*` — любой символ
- `{}` — обязательный литерал
- `[]` — необязательный литерал

### Маска для номера карты

```jsx
import { IMaskInput } from 'react-imask';

function CardInput() {
  const [card, setCard] = useState('');

  return (
    <IMaskInput
      mask="0000 0000 0000 0000"
      value={card}
      onAccept={(value) => setCard(value)}
      placeholder="1234 5678 9012 3456"
      inputMode="numeric"
    />
  );
}
```

### Числовые маски с форматированием

IMask отлично справляется с форматированием чисел:

```jsx
import { IMaskInput } from 'react-imask';

function PriceInput() {
  const [price, setPrice] = useState('');

  return (
    <IMaskInput
      mask={Number}              // Числовой режим
      scale={2}                  // Количество знаков после запятой
      thousandsSeparator=" "     // Разделитель тысяч
      radix=","                  // Десятичный разделитель
      normalizeZeros={true}      // Нормализовать нули
      padFractionalZeros={true}  // Дополнять дробную часть нулями
      value={price}
      onAccept={(value) => setPrice(value)}
      placeholder="0,00"
    />
  );
}
```

### Динамические маски

IMask поддерживает массив масок — система автоматически выбирает подходящую:

```jsx
import { IMaskInput } from 'react-imask';

// Маска для телефона: поддержка мобильных (+7 9XX) и городских (+7 XXX) номеров
function FlexiblePhoneInput() {
  const [value, setValue] = useState('');

  const masks = [
    { mask: '+{7} (000) 000-00-00', startsWith: '7' },
    { mask: '+000000000000000' }, // Международный формат
  ];

  return (
    <IMaskInput
      mask={masks}
      dispatch={(appended, dynamicMasked) => {
        const value = dynamicMasked.value;
        return dynamicMasked.compiledMasks.find(
          (m) => m.mask.startsWith(value)
        ) || dynamicMasked.compiledMasks[0];
      }}
      value={value}
      onAccept={(v) => setValue(v)}
    />
  );
}
```

### Получение неформатированного значения

```jsx
import { IMaskInput } from 'react-imask';

function PhoneInput() {
  const [maskedValue, setMaskedValue] = useState('');
  const [unmaskedValue, setUnmaskedValue] = useState('');

  return (
    <div>
      <IMaskInput
        mask="+{7} (000) 000-00-00"
        value={maskedValue}
        onAccept={(value, mask) => {
          setMaskedValue(value);          // '+7 (999) 999-99-99'
          setUnmaskedValue(mask.unmaskedValue); // '79999999999'
        }}
      />
      <p>Для отправки: {unmaskedValue}</p>
    </div>
  );
}
```

## Кастомная маска без библиотек

Иногда проще написать собственную маску для специфического случая:

### Маска телефона вручную

```jsx
function PhoneMaskInput() {
  const [value, setValue] = useState('');

  const formatPhone = (input) => {
    // Удаляем всё кроме цифр
    const digits = input.replace(/\D/g, '');

    // Ограничиваем 11 цифрами (для российских номеров)
    const limited = digits.slice(0, 11);

    // Форматируем
    if (limited.length <= 1) return limited;
    if (limited.length <= 4) return `+7 (${limited.slice(1)}`;
    if (limited.length <= 7) return `+7 (${limited.slice(1, 4)}) ${limited.slice(4)}`;
    if (limited.length <= 9) return `+7 (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
    return `+7 (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7, 9)}-${limited.slice(9, 11)}`;
  };

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setValue(formatted);
  };

  // Убираем форматирование для отправки
  const getRawValue = () => value.replace(/\D/g, '');

  return (
    <div>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="+7 (___) ___-__-__"
        maxLength={18}
      />
      <p>Для отправки: {getRawValue()}</p>
    </div>
  );
}
```

### Маска даты вручную

```jsx
function DateMaskInput() {
  const [value, setValue] = useState('');

  const formatDate = (input) => {
    const digits = input.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  };

  const handleChange = (e) => {
    setValue(formatDate(e.target.value));
  };

  const validateDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.').map(Number);
    if (!day || !month || !year) return false;

    const date = new Date(year, month - 1, day);
    return date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year;
  };

  const isValid = value.length === 10 && validateDate(value);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="ДД.ММ.ГГГГ"
        maxLength={10}
        style={{ borderColor: value.length === 10 && !isValid ? 'red' : '' }}
      />
      {value.length === 10 && !isValid && (
        <span style={{ color: 'red' }}>Некорректная дата</span>
      )}
    </div>
  );
}
```

### Маска кредитной карты вручную

```jsx
function CardMaskInput() {
  const [value, setValue] = useState('');

  const formatCard = (input) => {
    const digits = input.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleChange = (e) => {
    setValue(formatCard(e.target.value));
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="0000 0000 0000 0000"
      maxLength={19}
      inputMode="numeric"
    />
  );
}
```

## Хук useInputMask

Вынесем логику маски в переиспользуемый хук:

```jsx
function useInputMask(formatFn, maxLength) {
  const [value, setValue] = useState('');

  const handleChange = useCallback((e) => {
    const formatted = formatFn(e.target.value);
    setValue(formatted);
  }, [formatFn]);

  const rawValue = value.replace(/\D/g, '');

  return { value, rawValue, handleChange };
}

// Форматеры
const formatPhone = (input) => {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 1) return digits;
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
};

const formatDate = (input) => {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

// Использование
function OrderForm() {
  const phone = useInputMask(formatPhone);
  const date = useInputMask(formatDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      phone: phone.rawValue,   // '79999999999'
      date: date.value,        // '31.12.2024'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        value={phone.value}
        onChange={phone.handleChange}
        placeholder="+7 (___) ___-__-__"
      />
      <input
        type="text"
        value={date.value}
        onChange={date.handleChange}
        placeholder="ДД.ММ.ГГГГ"
      />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

## Интеграция с React Hook Form

```jsx
import { useForm, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';

function CheckoutForm() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="phone"
        control={control}
        rules={{ required: 'Телефон обязателен' }}
        render={({ field, fieldState }) => (
          <div>
            <IMaskInput
              mask="+{7} (000) 000-00-00"
              value={field.value}
              onAccept={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              placeholder="+7 (999) 999-99-99"
            />
            {fieldState.error && <span>{fieldState.error.message}</span>}
          </div>
        )}
      />

      <Controller
        name="card"
        control={control}
        render={({ field }) => (
          <IMaskInput
            mask="0000 0000 0000 0000"
            value={field.value}
            onAccept={(value) => field.onChange(value)}
            placeholder="Номер карты"
          />
        )}
      />

      <button type="submit">Оформить заказ</button>
    </form>
  );
}
```

## Доступность (Accessibility)

При использовании масок важно обеспечить доступность:

```jsx
function AccessiblePhoneInput() {
  const [value, setValue] = useState('');

  return (
    <div>
      <label htmlFor="phone">
        Номер телефона
        <span aria-hidden="true"> (формат: +7 (999) 999-99-99)</span>
      </label>
      <IMaskInput
        id="phone"
        mask="+{7} (000) 000-00-00"
        value={value}
        onAccept={(v) => setValue(v)}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        aria-label="Номер телефона в формате +7 (999) 999-99-99"
        aria-describedby="phone-hint"
      />
      <span id="phone-hint" className="hint">
        Введите 10 цифр номера после +7
      </span>
    </div>
  );
}
```

## Заключение

Маски ввода — важный элемент UX, особенно для форм с структурированными данными. Основные варианты:

- **react-input-mask** — простая библиотека с понятным API, хороша для базовых случаев (телефон, дата, паспорт)
- **react-imask** — мощная библиотека с числовым форматированием, динамическими масками и доступом к неформатированному значению
- **Кастомная реализация** — максимальный контроль, подходит для нестандартных требований

Для большинства проектов рекомендую `react-imask` — он покрывает практически любые случаи и хорошо интегрируется с React Hook Form и Formik. Кастомные маски пишите только когда нужно специфическое поведение, которое библиотеки не поддерживают.
