---
metaTitle: "Next.js и shadcn/ui: настройка компонентов"
metaDescription: "Как подключить shadcn/ui к проекту Next.js, настроить темизацию, использовать компоненты и создавать формы с валидацией."
author: "Антон Ларичев"
title: "Next.js с shadcn/ui: настройка и использование компонентов"
preview: "Полное руководство по интеграции shadcn/ui в Next.js: установка, настройка, компоненты, темы и формы с react-hook-form."
---

## Что такое shadcn/ui и зачем его использовать

shadcn/ui — это не библиотека компонентов в традиционном смысле. Вы не устанавливаете её как зависимость и не импортируете из пакета. Вместо этого каждый компонент копируется прямо в исходный код вашего проекта через CLI. Это означает, что вы получаете полный контроль над кодом: можно изменять, расширять и адаптировать компоненты под любые нужды без ограничений публичного API.

Компоненты построены поверх Radix UI — набора доступных примитивов без стилей — и оформлены с помощью Tailwind CSS. Такой подход даёт:

- Полную доступность (a11y) из коробки через Radix UI
- Гибкую темизацию через CSS-переменные
- Поддержку тёмного режима без дополнительных настроек
- Возможность изменять любую часть компонента без форков

## Создание проекта и установка shadcn/ui

Начнём с создания нового проекта Next.js с App Router:

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app
cd my-app
```

При создании проекта выберите следующие параметры:
- TypeScript: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Import alias (`@/*`): Yes

Теперь инициализируем shadcn/ui:

```bash
npx shadcn@latest init
```

CLI задаст несколько вопросов:

```bash
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Do you want to use CSS variables for colors? › yes
```

После инициализации в проекте появятся:
- `components/ui/` — директория для компонентов
- `lib/utils.ts` — утилита `cn()` для объединения классов
- Обновлённые `tailwind.config.ts` и `globals.css` с CSS-переменными

### Структура CSS-переменных

Файл `app/globals.css` теперь содержит систему переменных для светлой и тёмной темы:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
  }
}
```

Значения записаны в формате HSL без скобок `hsl()`, что позволяет Tailwind формировать классы вида `bg-primary/50` с поддержкой прозрачности.

## Добавление и использование компонентов

Компоненты добавляются по одному через CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add label
```

Каждая команда создаёт файл в `components/ui/`. Посмотрим на сгенерированный `button.tsx`:

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Обратите внимание на `asChild` — это паттерн Radix UI, который позволяет передать поведение кнопки дочернему элементу. Например, чтобы Link выглядел как кнопка:

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function NavButton() {
  return (
    <Button asChild variant="outline">
      <Link href="/dashboard">Перейти в панель</Link>
    </Button>
  )
}
```

## Компонент Card для отображения контента

Card — один из наиболее часто используемых компонентов. Добавим его и создадим простую карточку пользователя:

```bash
npx shadcn@latest add card avatar badge
```

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface UserCardProps {
  name: string
  email: string
  role: string
  avatarUrl?: string
}

export function UserCard({ name, email, role, avatarUrl }: UserCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="w-[350px]">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{role}</Badge>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm">Сообщение</Button>
        <Button size="sm">Профиль</Button>
      </CardFooter>
    </Card>
  )
}
```

## Формы с react-hook-form и Zod

shadcn/ui предоставляет компонент Form, который интегрируется с react-hook-form и Zod для типобезопасной валидации.

```bash
npx shadcn@latest add form input select textarea
npm install react-hook-form @hookform/resolvers zod
```

Создадим форму регистрации с валидацией:

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Имя должно содержать минимум 2 символа" })
    .max(50, { message: "Имя не должно превышать 50 символов" }),
  email: z
    .string()
    .email({ message: "Введите корректный email адрес" }),
  role: z.enum(["developer", "designer", "manager"], {
    required_error: "Выберите роль",
  }),
  bio: z
    .string()
    .max(500, { message: "Биография не должна превышать 500 символов" })
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

export function RegistrationForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  })

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      form.setError("root", { message: "Ошибка при сохранении" })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя пользователя</FormLabel>
              <FormControl>
                <Input placeholder="ivan.petrov" {...field} />
              </FormControl>
              <FormDescription>
                Латинские буквы и цифры, от 2 до 50 символов
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ivan@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Роль</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите вашу роль" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="developer">Разработчик</SelectItem>
                  <SelectItem value="designer">Дизайнер</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>О себе</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Расскажите о себе"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Сохранение..." : "Зарегистрироваться"}
        </Button>
      </form>
    </Form>
  )
}
```

Ключ успешной интеграции — паттерн `render={({ field }) => ...}`. Функция `field` передаёт в контрол значение, обработчики `onChange`/`onBlur` и `ref`, что обеспечивает корректную работу react-hook-form.

## Тёмный режим в Next.js

Для поддержки тёмного режима установим `next-themes`:

```bash
npm install next-themes
```

Оберните приложение в провайдер в `app/layout.tsx`:

```typescript
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Создайте `components/theme-provider.tsx`:

```typescript
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

Кнопка переключения темы:

```typescript
"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "Светлая" : "Тёмная"}
    </Button>
  )
}
```

## Кастомизация компонентов

Поскольку код компонентов находится в вашем проекте, их легко расширять. Например, добавим новый вариант к кнопке:

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center ...",
  {
    variants: {
      variant: {
        // Существующие варианты
        default: "bg-primary text-primary-foreground ...",
        // Новый вариант
        success: "bg-green-600 text-white shadow hover:bg-green-700",
        warning: "bg-yellow-500 text-white shadow hover:bg-yellow-600",
      },
    },
  }
)
```

Изменение глобального радиуса скруглений — через CSS-переменную в `globals.css`:

```css
:root {
  --radius: 0.75rem; /* было 0.5rem */
}
```

Это изменение автоматически распространится на все компоненты, которые используют переменную `radius`.

## Практический пример: страница входа

Соберём полноценную страницу входа в `app/login/page.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Введите данные для доступа к аккаунту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
```

```typescript
"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const loginSchema = z.object({
  email: z.string().email({ message: "Некорректный email" }),
  password: z.string().min(8, { message: "Минимум 8 символов" }),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (res.ok) {
      router.push("/dashboard")
    } else {
      form.setError("root", {
        message: "Неверный email или пароль",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="вы@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Вход..." : "Войти"}
        </Button>
      </form>
    </Form>
  )
}
```

## Итог

shadcn/ui меняет подход к использованию UI-библиотек: вместо зависимости от внешнего пакета вы владеете кодом компонентов и можете адаптировать их без ограничений. Интеграция с Next.js App Router, react-hook-form, Zod и next-themes делает эту связку удобным выбором для построения современных веб-приложений.

Основные команды, которые стоит запомнить:

```bash
npx shadcn@latest init          # Инициализация в проекте
npx shadcn@latest add button    # Добавление компонента
npx shadcn@latest diff          # Проверка обновлений компонентов
```

Чтобы глубоко изучить Next.js и научиться строить полноценные приложения с современным стеком, пройдите курс на PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-shadcn-ui)
