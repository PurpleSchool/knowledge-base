---
metaTitle: "Безопасность в React — защита от XSS, CSRF и утечек данных"
metaDescription: "Практическое руководство по безопасности React-приложений: защита от XSS-атак, безопасная работа с данными, аутентификация, CSRF и лучшие практики."
author: Олег Марков
title: "Безопасность в React: защита от XSS, CSRF и утечек данных"
preview: "Изучаем основные уязвимости React-приложений и способы защиты: XSS через dangerouslySetInnerHTML, утечки данных через переменные окружения, безопасное хранение токенов и другие практики."
---

# Безопасность в React

React имеет встроенные механизмы защиты от многих распространённых уязвимостей, но они не решают все проблемы. Разработчик должен знать, где именно React защищает автоматически, а где нужна дополнительная осторожность. В этой статье разберём основные угрозы и способы защиты.

## Встроенная защита React от XSS

React автоматически экранирует все значения, которые вставляются в JSX. Это защищает от большинства XSS-атак:

```tsx
// ✅ React экранирует это автоматически
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>;
// Рендерится как текст, не как HTML
// Результат: <div>&lt;script&gt;alert("xss")&lt;/script&gt;</div>
```

Это работает для строк, чисел и других примитивов. React не выполнит скрипт, вставленный через JSX-выражение.

## Опасный dangerouslySetInnerHTML

Пропс `dangerouslySetInnerHTML` отключает встроенную защиту React. Используйте его только когда это действительно необходимо.

```tsx
// ❌ Опасно — уязвимость XSS
function BlogPost({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// Если content пришёл от пользователя, это XSS-уязвимость
<BlogPost content="<img src=x onerror='alert(document.cookie)'>" />
```

Если нужно отображать HTML (например, из CMS или редактора), обязательно санируйте его:

```bash
npm install dompurify
npm install @types/dompurify  # для TypeScript
```

```tsx
import DOMPurify from 'dompurify';

// ✅ Санируем HTML перед вставкой
function BlogPost({ content }: { content: string }) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3'],
    ALLOWED_ATTR: [],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

Настраивайте `ALLOWED_TAGS` минимально — разрешайте только те теги, которые действительно нужны.

## Безопасные ссылки и URL

Никогда не подставляйте URL из ненадёжных источников в `href` без проверки:

```tsx
// ❌ Опасно — javascript: URL выполнит код
function UserLink({ user }: { user: User }) {
  return <a href={user.profileUrl}>{user.name}</a>;
}
// Если user.profileUrl = "javascript:alert(document.cookie)" — выполнится XSS

// ✅ Проверяем протокол URL
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Разрешаем только http и https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}

function UserLink({ user }: { user: User }) {
  return <a href={sanitizeUrl(user.profileUrl)}>{user.name}</a>;
}
```

## Переменные окружения: не выставляйте секреты

В Next.js и Create React App все переменные с префиксом `NEXT_PUBLIC_` или `REACT_APP_` попадают в клиентский bundle и видны всем пользователям.

```tsx
// ❌ НИКОГДА не делайте так — секрет будет виден в браузере
const apiKey = process.env.NEXT_PUBLIC_SECRET_API_KEY;
const dbPassword = process.env.NEXT_PUBLIC_DB_PASSWORD;

// ✅ Переменные без NEXT_PUBLIC_ доступны только на сервере
// Используйте Server Actions или API routes
async function fetchProtectedData() {
  const apiKey = process.env.SECRET_API_KEY; // только серверный код
  const response = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return response.json();
}
```

Проверяйте, что попадает в bundle через анализатор:
```bash
npm run build && npx @next/bundle-analyzer
```

## Безопасное хранение токенов аутентификации

Выбор места хранения JWT-токена — важное решение безопасности:

| Место хранения | XSS | CSRF | Рекомендация |
|----------------|-----|------|--------------|
| localStorage | Уязвим | Безопасен | Не рекомендуется |
| sessionStorage | Уязвим | Безопасен | Не рекомендуется |
| Cookie (httpOnly) | Безопасен | Уязвим (нужен CSRF-токен) | Рекомендуется |

```tsx
// ✅ Рекомендуемый подход — httpOnly cookie устанавливается на сервере
// На клиенте нет прямого доступа к токену

// API route (Next.js) — устанавливает httpOnly cookie
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const token = await authenticateUser(email, password);

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth-token', token, {
    httpOnly: true,      // недоступен для JavaScript
    secure: true,        // только HTTPS
    sameSite: 'strict',  // защита от CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });

  return response;
}
```

```tsx
// ❌ Плохой вариант — токен доступен любому JS-коду
localStorage.setItem('token', jwtToken);

// ❌ Тоже плохо
const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1');
```

## Защита от CSRF

Если вы используете cookie для хранения токенов, нужна защита от CSRF:

```tsx
// Генерируем CSRF-токен при загрузке страницы
function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Получаем CSRF-токен с сервера
    fetch('/api/csrf-token')
      .then(r => r.json())
      .then(({ token }) => setCsrfToken(token));
  }, []);

  return csrfToken;
}

// Включаем токен в каждый мутирующий запрос
function useApiMutation() {
  const csrfToken = useCsrfToken();

  const mutate = async (url: string, data: unknown) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(data),
    });
  };

  return { mutate };
}
```

## Валидация данных на клиенте

Клиентская валидация улучшает UX, но **никогда** не является заменой серверной валидации:

```tsx
import { z } from 'zod';

// Схема валидации
const registrationSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .regex(/[0-9]/, 'Нужна хотя бы одна цифра'),
  name: z.string().min(2).max(100),
});

type RegistrationData = z.infer<typeof registrationSchema>;

function RegistrationForm() {
  const handleSubmit = async (data: RegistrationData) => {
    // Валидация на клиенте (UX)
    const result = registrationSchema.safeParse(data);
    if (!result.success) {
      // Показываем ошибки
      return;
    }

    // Серверная валидация тоже обязательна!
    await registerUser(result.data);
  };
}
```

## Защита от утечек чувствительных данных в UI

```tsx
// ❌ Никогда не логируйте чувствительные данные
function LoginForm() {
  const handleSubmit = (data: LoginData) => {
    console.log('Submitting:', data); // Пароль виден в консоли!
    submitLogin(data);
  };
}

// ❌ Не отображайте полные данные карт
function PaymentInfo({ card }: { card: PaymentCard }) {
  return <span>{card.number}</span>; // Полный номер карты на экране!
}

// ✅ Маскируйте чувствительные данные
function PaymentInfo({ card }: { card: PaymentCard }) {
  const maskedNumber = `**** **** **** ${card.lastFour}`;
  return <span>{maskedNumber}</span>;
}
```

## Content Security Policy

CSP — важный заголовок, ограничивающий источники ресурсов. В Next.js настраивается в `next.config.js`:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // убрать unsafe-inline если возможно
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.yourservice.com",
              "frame-src 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

## Зависимости: регулярный аудит

```bash
# Проверка известных уязвимостей в зависимостях
npm audit

# Автоматическое исправление некритичных уязвимостей
npm audit fix

# Проверка устаревших пакетов
npm outdated
```

Настройте автоматический аудит в CI/CD:

```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm audit --audit-level=high
```

## Итоги

Ключевые правила безопасности React-приложений:

1. **Избегайте `dangerouslySetInnerHTML`** — если нужно, используйте DOMPurify
2. **Проверяйте URL** перед вставкой в `href` или `src`
3. **Не выставляйте секреты** через `NEXT_PUBLIC_` переменные
4. **Храните токены в httpOnly cookie**, а не в localStorage
5. **Валидируйте на сервере** — клиентская валидация только для UX
6. **Маскируйте чувствительные данные** в UI
7. **Настраивайте CSP** для ограничения источников ресурсов
8. **Регулярно проводите** `npm audit`

React защищает от XSS в JSX автоматически — но это только первый рубеж защиты.
