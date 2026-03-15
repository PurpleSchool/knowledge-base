---
metaTitle: React Toastify - уведомления в React приложениях
metaDescription: Полное руководство по react-toastify: установка, типы уведомлений, настройка позиции и анимации, кастомизация, promise toast, очереди и продвинутые примеры
author: Олег Марков
title: React Toastify - уведомления в React
preview: Научитесь добавлять красивые уведомления в React-приложения с помощью react-toastify. Типы toast, настройка внешнего вида, promise-уведомления, очереди и кастомизация — всё в одной статье
---

## Введение

Каждое современное веб-приложение нуждается в системе уведомлений. Когда пользователь отправляет форму, удаляет запись или сталкивается с ошибкой — он должен получить мгновенную обратную связь. Классические `alert()` и кастомные модальные окна давно устарели. Современный стандарт — это **toast-уведомления**: небольшие информационные сообщения, которые появляются в углу экрана и автоматически исчезают.

**react-toastify** — самая популярная библиотека toast-уведомлений для React. Она предоставляет готовые компоненты с настраиваемым поведением, анимацией и внешним видом. По данным npm, библиотека скачивается миллионы раз в неделю и является стандартом де-факто в мире React.

В этой статье вы узнаете, как установить и настроить react-toastify, научитесь использовать все типы уведомлений, настраивать их внешний вид и поведение, работать с promise-уведомлениями и очередями, а также освоите продвинутые техники кастомизации.

## Что такое React Toastify

**react-toastify** — это npm-пакет, который позволяет добавлять toast-уведомления в React-приложения с минимальной конфигурацией. Библиотека построена поверх React-портала, что позволяет рендерить уведомления поверх любого содержимого страницы без изменения DOM-иерархии.

### Ключевые преимущества

- **Простая интеграция** — добавление занимает буквально 2-3 строки кода
- **Полная кастомизация** — внешний вид, анимация, позиция, время показа
- **Встроенные типы** — success, error, warning, info и default
- **Promise-поддержка** — автоматическое управление состоянием загрузки
- **RTL-поддержка** — работает с языками с письмом справа налево
- **Доступность** — совместимость с screen readers (ARIA)
- **TypeScript** — полная типизация из коробки
- **Без зависимостей** — минимальный размер бандла

## Установка и базовая настройка

### Установка пакета

```bash
# npm
npm install react-toastify

# yarn
yarn add react-toastify

# pnpm
pnpm add react-toastify
```

### Базовая настройка

Чтобы начать использовать react-toastify, вам нужно сделать две вещи:

1. Добавить компонент `<ToastContainer />` один раз в корень приложения
2. Импортировать CSS-стили

```tsx
// App.tsx (или layout.tsx в Next.js)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div>
      {/* Ваш контент */}
      <ToastContainer />
    </div>
  );
}

export default App;
```

После этого вы можете вызывать уведомления из любого компонента приложения:

```tsx
import { toast } from 'react-toastify';

function MyComponent() {
  const handleClick = () => {
    toast('Привет! Это уведомление!');
  };

  return <button onClick={handleClick}>Показать уведомление</button>;
}
```

Всё — уведомление будет отображаться в правом нижнем углу экрана.

### Настройка в Next.js

В Next.js App Router добавьте `ToastContainer` в корневой layout:

```tsx
// app/layout.tsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
```

Поскольку `ToastContainer` использует состояние и эффекты, при необходимости обверните его в клиентский компонент:

```tsx
// components/ToastProvider.tsx
'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ToastProvider() {
  return <ToastContainer />;
}
```

## Основные типы уведомлений

React Toastify предоставляет пять типов уведомлений, каждый с уникальным цветом и иконкой.

### Default (по умолчанию)

```tsx
import { toast } from 'react-toastify';

// Простое уведомление без типа
toast('Это обычное уведомление');
```

### Success (успех)

Зелёное уведомление с галочкой — для успешных операций:

```tsx
// Краткий синтаксис
toast.success('Данные успешно сохранены!');

// С опциями
toast.success('Профиль обновлён', {
  position: 'top-right',
  autoClose: 3000,
});
```

### Error (ошибка)

Красное уведомление — для ошибок и сбоев:

```tsx
toast.error('Произошла ошибка. Попробуйте снова.');

// При перехвате исключения
try {
  await saveData();
} catch (error) {
  toast.error(`Ошибка: ${error.message}`);
}
```

### Warning (предупреждение)

Жёлтое уведомление — для предупреждений:

```tsx
toast.warning('Осталось мало места на диске');

// Альтернативный синтаксис
toast.warn('Срок действия сессии истекает');
```

### Info (информация)

Синее уведомление — для информационных сообщений:

```tsx
toast.info('Доступна новая версия приложения');
```

### Выбор типа через опцию type

Вы также можете указать тип через опцию `type`:

```tsx
import { toast, ToastOptions } from 'react-toastify';

const options: ToastOptions = {
  type: 'success', // 'success' | 'error' | 'warning' | 'info' | 'default'
};

toast('Операция выполнена', options);
```

## Настройка позиции

По умолчанию уведомления появляются в правом нижнем углу. Это можно изменить глобально или для каждого уведомления отдельно.

### Позиции ToastContainer

```tsx
import { ToastContainer } from 'react-toastify';

// Глобальная настройка позиции
<ToastContainer position="top-right" />
```

Доступные позиции:

```tsx
import { toast } from 'react-toastify';

// Все доступные позиции
toast('Верхний левый', { position: 'top-left' });
toast('Верхний центр', { position: 'top-center' });
toast('Верхний правый', { position: 'top-right' }); // По умолчанию
toast('Нижний левый', { position: 'bottom-left' });
toast('Нижний центр', { position: 'bottom-center' });
toast('Нижний правый', { position: 'bottom-right' });
```

### Несколько контейнеров с разными позициями

Вы можете разместить несколько `ToastContainer` в разных позициях и направлять уведомления в нужный контейнер через `containerId`:

```tsx
// App.tsx
<>
  <ToastContainer containerId="top" position="top-right" />
  <ToastContainer containerId="bottom" position="bottom-center" />
</>

// Использование
toast.success('Сохранено!', { containerId: 'top' });
toast.error('Ошибка!', { containerId: 'bottom' });
```

## Настройка времени показа

По умолчанию уведомление исчезает через 5 секунд.

### autoClose

```tsx
// Закрыть через 3 секунды
toast('Закроется через 3 секунды', { autoClose: 3000 });

// Не закрывать автоматически (пользователь должен закрыть вручную)
toast('Это уведомление останется навсегда', { autoClose: false });

// Глобальная настройка
<ToastContainer autoClose={4000} />
```

### Пауза при наведении

По умолчанию таймер останавливается при наведении мыши:

```tsx
// Отключить паузу при наведении
toast('Не паузируется', { pauseOnHover: false });

// Глобальная настройка
<ToastContainer pauseOnHover={false} />
```

### Пауза при потере фокуса

```tsx
// Остановить таймер когда вкладка неактивна
toast('Умное уведомление', { pauseOnFocusLoss: true });
```

### Прогресс-бар

Прогресс-бар показывает, сколько времени осталось до закрытия:

```tsx
// Скрыть прогресс-бар
toast('Без прогресс-бара', { hideProgressBar: true });

// Глобально
<ToastContainer hideProgressBar={false} />
```

## Настройка анимации

### Встроенные анимации

React Toastify поставляется с несколькими встроенными анимациями:

```tsx
import { toast, Bounce, Slide, Flip, Zoom } from 'react-toastify';

// Bounce — анимация отскока (по умолчанию)
toast('Bounce!', { transition: Bounce });

// Slide — скольжение
toast('Slide!', { transition: Slide });

// Flip — переворот
toast('Flip!', { transition: Flip });

// Zoom — масштабирование
toast('Zoom!', { transition: Zoom });

// Без анимации
toast('Без анимации', { transition: false });

// Глобальная настройка
<ToastContainer transition={Slide} />
```

### Кастомная анимация с CSS

Вы можете создать собственную анимацию, передав имя CSS-класса:

```css
/* custom-toast.css */
@keyframes slideInFromTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutToTop {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

.custom-enter {
  animation: slideInFromTop 0.4s ease-out;
}

.custom-exit {
  animation: slideOutToTop 0.3s ease-in;
}
```

```tsx
toast('Кастомная анимация', {
  transition: {
    enter: 'custom-enter',
    exit: 'custom-exit',
    appendPosition: false,
    collapse: true,
    collapseDuration: 300,
  },
});
```

## Кастомизация внешнего вида

### CSS-переменные (версия 9+)

Начиная с версии 9, react-toastify использует CSS-переменные для стилизации:

```css
/* Глобальная кастомизация через CSS-переменные */
:root {
  --toastify-color-light: #fff;
  --toastify-color-dark: #121212;
  --toastify-color-info: #3498db;
  --toastify-color-success: #07bc0c;
  --toastify-color-warning: #f1c40f;
  --toastify-color-error: #e74c3c;
  --toastify-color-transparent: rgba(255, 255, 255, 0.7);
  --toastify-font-family: 'Inter', sans-serif;
  --toastify-toast-width: 320px;
  --toastify-toast-min-height: 64px;
  --toastify-toast-max-height: 800px;
  --toastify-toast-bd-radius: 8px;
  --toastify-z-index: 9999;
}
```

### Кастомные классы

```tsx
// Кастомные CSS-классы для разных частей toast
toast('Стилизованное уведомление', {
  className: 'custom-toast',          // Контейнер уведомления
  bodyClassName: 'custom-toast-body', // Тело уведомления
  progressClassName: 'custom-progress', // Прогресс-бар
});
```

```css
.custom-toast {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.custom-toast-body {
  font-size: 14px;
  font-weight: 500;
}

.custom-progress {
  background: rgba(255, 255, 255, 0.4);
}
```

### Кастомный контент (React-компонент)

Самый мощный способ кастомизации — передать React-компонент вместо строки:

```tsx
import { toast } from 'react-toastify';

// Простой кастомный контент
const CustomToast = ({ name, message }: { name: string; message: string }) => (
  <div className="flex items-start gap-3">
    <img
      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
      alt="Avatar"
      className="w-10 h-10 rounded-full"
    />
    <div>
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Использование
toast(<CustomToast name="Алексей" message="Оставил комментарий к вашей задаче" />, {
  className: 'notification-toast',
  autoClose: 5000,
});
```

### Тёмная тема

```tsx
// Для отдельного уведомления
toast.success('Тёмное уведомление', { theme: 'dark' });

// Цветная тема (использует цвет типа в качестве фона)
toast.error('Цветное уведомление', { theme: 'colored' });

// Светлая тема (по умолчанию)
toast.info('Светлое уведомление', { theme: 'light' });

// Глобальная настройка
<ToastContainer theme="dark" />
```

### Кастомные иконки

```tsx
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

// Кастомная иконка
toast.success('Файл загружен', {
  icon: <FiCheckCircle className="text-green-500" size={20} />,
});

toast.error('Ошибка подключения', {
  icon: <FiXCircle className="text-red-500" size={20} />,
});

// Без иконки
toast('Без иконки', { icon: false });

// Эмодзи как иконка
toast('Отличная работа!', { icon: '🎉' });
```

## Promise Toast

Одна из самых полезных функций react-toastify — автоматическое управление toast-уведомлениями для промисов. Пока промис выполняется — показывается спиннер. После завершения автоматически меняется на успех или ошибку.

### Базовое использование

```tsx
import { toast } from 'react-toastify';

async function saveUserData(data: UserData) {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Ошибка сервера');
  return response.json();
}

// Автоматическое управление состоянием
toast.promise(saveUserData(formData), {
  pending: 'Сохраняем данные...',
  success: 'Данные успешно сохранены!',
  error: 'Не удалось сохранить данные',
});
```

### Динамические сообщения

Вы можете использовать функции для динамических сообщений — они получают результат промиса или ошибку:

```tsx
toast.promise(
  fetchUserById(userId),
  {
    pending: 'Загрузка пользователя...',
    success: {
      // Функция получает результат промиса
      render({ data }) {
        return `Пользователь ${data.name} загружен!`;
      },
    },
    error: {
      // Функция получает объект ошибки
      render({ data }) {
        return `Ошибка: ${(data as Error).message}`;
      },
    },
  },
  {
    // Общие опции для всех состояний
    position: 'top-center',
  }
);
```

### Кастомный рендер для каждого состояния

```tsx
const MyLoadingComponent = () => (
  <div className="flex items-center gap-2">
    <div className="spinner" />
    <span>Отправляем сообщение...</span>
  </div>
);

const MySuccessComponent = ({ data }: { data: { id: string } }) => (
  <div>
    <p className="font-bold">Сообщение отправлено!</p>
    <p className="text-sm">ID: {data.id}</p>
  </div>
);

toast.promise(sendMessage(messageData), {
  pending: {
    render: () => <MyLoadingComponent />,
  },
  success: {
    render({ data }) {
      return <MySuccessComponent data={data} />;
    },
  },
  error: {
    render({ data }) {
      return `Ошибка: ${(data as Error).message}`;
    },
  },
});
```

### Promise с axios

```tsx
import axios from 'axios';
import { toast } from 'react-toastify';

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadPromise = axios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return toast.promise(uploadPromise, {
    pending: 'Загружаем файл...',
    success: 'Файл успешно загружен!',
    error: {
      render({ data }) {
        if (axios.isAxiosError(data)) {
          return data.response?.data?.message || 'Ошибка загрузки';
        }
        return 'Неизвестная ошибка';
      },
    },
  });
}
```

## Управление уведомлениями

### Обновление существующего уведомления

```tsx
import { toast } from 'react-toastify';

// Показываем начальное уведомление и сохраняем ID
const toastId = toast.loading('Загружаем данные...');

// После выполнения операции — обновляем
try {
  const data = await fetchData();
  toast.update(toastId, {
    render: 'Данные загружены успешно!',
    type: 'success',
    isLoading: false,
    autoClose: 3000,
    closeButton: true,
  });
} catch (error) {
  toast.update(toastId, {
    render: `Ошибка: ${error.message}`,
    type: 'error',
    isLoading: false,
    autoClose: 5000,
    closeButton: true,
  });
}
```

### Программное закрытие

```tsx
import { toast } from 'react-toastify';

// Закрыть конкретное уведомление
const id = toast.success('Скоро закроется...');
setTimeout(() => toast.dismiss(id), 2000);

// Закрыть все уведомления
toast.dismiss();

// Удалить все уведомления без анимации
toast.clearWaitingQueue();
```

### Предотвращение дублирования

```tsx
import { toast, Id } from 'react-toastify';

let toastId: Id | null = null;

function showUniqueToast(message: string) {
  // Проверяем, активно ли уже уведомление с этим ID
  if (toastId === null || !toast.isActive(toastId)) {
    toastId = toast.info(message);
  }
}

// Или используйте toastId как ключ
toast.success('Только одно!', { toastId: 'unique-success' });
toast.success('Это дублирование — не покажется', { toastId: 'unique-success' });
```

## Работа с очередями

По умолчанию react-toastify показывает все уведомления одновременно. Для ограничения количества отображаемых уведомлений используйте опцию `limit`:

### Ограничение количества уведомлений

```tsx
// Показывать не более 3 уведомлений одновременно
<ToastContainer limit={3} />
```

Если уведомлений больше, чем `limit`, они становятся в очередь и показываются по мере того, как предыдущие закрываются.

### Порядок отображения

```tsx
// Новые уведомления появляются сверху (по умолчанию снизу)
<ToastContainer newestOnTop={true} />
```

### FIFO vs LIFO очередь

```tsx
import { toast } from 'react-toastify';

// Уведомления показываются в порядке добавления (FIFO)
<ToastContainer limit={2} />

toast.info('Первое');  // Покажется первым
toast.info('Второе'); // Покажется вторым
toast.info('Третье'); // Встанет в очередь
```

### Пример системы уведомлений с очередью

```tsx
import { toast } from 'react-toastify';

// Утилита для управления уведомлениями
class NotificationService {
  private static queue: Array<() => void> = [];
  private static isProcessing = false;

  static async show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        const id = toast[type](message, {
          onClose: resolve,
        });
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private static processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const next = this.queue.shift();
    if (next) next();
  }
}

// Использование
await NotificationService.show('Шаг 1 выполнен', 'success');
await NotificationService.show('Шаг 2 выполнен', 'success');
await NotificationService.show('Все шаги завершены!', 'info');
```

## Полный пример: форма с уведомлениями

Вот комплексный пример, демонстрирующий различные сценарии использования react-toastify в реальном приложении:

```tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface ApiResponse {
  id: string;
  status: string;
}

async function submitContactForm(data: FormData): Promise<ApiResponse> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ошибка отправки формы');
  }

  return response.json();
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.warning('Введите ваше имя');
      return false;
    }

    if (!formData.email.includes('@')) {
      toast.warning('Введите корректный email');
      return false;
    }

    if (formData.message.length < 10) {
      toast.warning('Сообщение должно содержать минимум 10 символов');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await toast.promise(
        submitContactForm(formData),
        {
          pending: 'Отправляем сообщение...',
          success: {
            render({ data }) {
              return `Сообщение отправлено! ID: ${data.id}`;
            },
          },
          error: {
            render({ data }) {
              return `Ошибка: ${(data as Error).message}`;
            },
          },
        }
      );

      // Сбрасываем форму после успеха
      setFormData({ name: '', email: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Обратная связь</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Имя</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="Ваше имя"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          placeholder="your@email.com"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Сообщение</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full border rounded px-3 py-2 resize-none"
          placeholder="Ваше сообщение..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
}
```

## Хук useToast для переиспользования

Вынесите логику уведомлений в хук для удобного переиспользования:

```tsx
// hooks/useToast.ts
import { toast, ToastOptions } from 'react-toastify';
import { useCallback } from 'react';

interface UseToastReturn {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
  showPromise: <T>(
    promise: Promise<T>,
    messages: { pending: string; success: string; error: string }
  ) => Promise<T>;
}

export function useToast(): UseToastReturn {
  const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    pauseOnHover: true,
  };

  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.success(message, { ...defaultOptions, ...options });
    },
    []
  );

  const showError = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.error(message, { ...defaultOptions, autoClose: 6000, ...options });
    },
    []
  );

  const showWarning = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.warning(message, { ...defaultOptions, ...options });
    },
    []
  );

  const showInfo = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.info(message, { ...defaultOptions, ...options });
    },
    []
  );

  const showPromise = useCallback(
    <T>(
      promise: Promise<T>,
      messages: { pending: string; success: string; error: string }
    ) => {
      return toast.promise(promise, messages, defaultOptions);
    },
    []
  );

  return { showSuccess, showError, showWarning, showInfo, showPromise };
}

// Использование в компоненте
function MyComponent() {
  const { showSuccess, showError, showPromise } = useToast();

  const handleSave = async () => {
    try {
      await showPromise(saveData(), {
        pending: 'Сохраняем...',
        success: 'Сохранено!',
        error: 'Ошибка сохранения',
      });
    } catch {
      // Ошибка уже обработана promise toast
    }
  };

  return (
    <div>
      <button onClick={() => showSuccess('Успех!')}>Успех</button>
      <button onClick={() => showError('Ошибка!')}>Ошибка</button>
      <button onClick={handleSave}>Сохранить</button>
    </div>
  );
}
```

## Доступность (Accessibility)

React Toastify имеет встроенную поддержку доступности:

```tsx
// role и aria-label настраиваются автоматически
// но вы можете переопределить их
toast('Важное сообщение', {
  role: 'alert',        // 'alert' | 'status' — по умолчанию 'alert'
  ariaLabel: 'Уведомление об успешной операции',
});

// Для информационных сообщений используйте role="status"
toast.info('Данные обновлены', {
  role: 'status',
});
```

## Полная конфигурация ToastContainer

Вот все доступные опции `ToastContainer`:

```tsx
import { ToastContainer, Bounce } from 'react-toastify';

<ToastContainer
  // Позиция уведомлений
  position="top-right"

  // Время автозакрытия в мс (false — не закрывать)
  autoClose={5000}

  // Скрыть прогресс-бар
  hideProgressBar={false}

  // Последнее уведомление сверху
  newestOnTop={false}

  // Закрывать по клику
  closeOnClick={true}

  // Остановить таймер при потере фокуса
  pauseOnFocusLoss={true}

  // Можно перетаскивать
  draggable={true}

  // Расстояние свайпа для закрытия (в px)
  draggablePercent={20}

  // Остановить таймер при наведении
  pauseOnHover={true}

  // Анимация
  transition={Bounce}

  // Максимальное количество уведомлений
  limit={5}

  // Тема: 'light' | 'dark' | 'colored'
  theme="light"

  // Иконка закрытия (false — скрыть)
  closeButton={true}

  // Поддержка RTL
  rtl={false}
/>
```

## Распространённые проблемы и решения

### Уведомления не показываются

Убедитесь, что `ToastContainer` добавлен в приложение и CSS-стили импортированы:

```tsx
// Обязательно импортировать CSS
import 'react-toastify/dist/ReactToastify.css';

// Добавить ToastContainer
<ToastContainer />
```

### Стили не применяются

Если стили сбрасываются CSS-фреймворком (например, Tailwind), добавьте CSS в конце списка импортов:

```tsx
// Tailwind сначала
import './globals.css';
// Toastify после — чтобы не перезаписывался
import 'react-toastify/dist/ReactToastify.css';
```

### Проблемы с SSR (Next.js)

Если возникают ошибки гидрации, используйте динамический импорт или оберните в `Suspense`:

```tsx
// Динамический импорт для отключения SSR
import dynamic from 'next/dynamic';

const ToastContainer = dynamic(
  () => import('react-toastify').then((mod) => mod.ToastContainer),
  { ssr: false }
);
```

### Уведомление показывается несколько раз

Используйте уникальный `toastId`:

```tsx
toast.success('Одно уведомление', {
  toastId: 'my-unique-id',
});
```

## Заключение

React Toastify — это мощная и гибкая библиотека для создания уведомлений в React-приложениях. Она охватывает все распространённые сценарии: от простых информационных сообщений до сложных уведомлений с отслеживанием состояния промисов.

Основные возможности, которые вы теперь знаете:

- **5 типов уведомлений** — success, error, warning, info, default
- **Гибкая позиционирование** — 6 позиций на экране или несколько контейнеров
- **Promise Toast** — автоматическое управление состоянием асинхронных операций
- **Кастомизация** — от CSS-переменных до полностью кастомных React-компонентов
- **Управление очередью** — ограничение количества одновременных уведомлений
- **Обновление уведомлений** — изменение содержимого и типа после показа
- **Доступность** — встроенная поддержка ARIA

Начните с базовой установки и `toast.promise()` для асинхронных операций — это покроет 80% потребностей большинства приложений. Постепенно добавляйте кастомизацию по мере необходимости.
