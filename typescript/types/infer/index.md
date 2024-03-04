---
metaTitle: Оператор infer в Typescript?
metaDescription: Изучите основы и продвинутые концепции типизации функций в TypeScript с помощью оператора infer, чтобы повысить надежность и поддерживаемость вашего кода. Узнайте, как использовать infer для вывода типов данных из других типов
author: Максим Акимов
title: Оператор infer в Typescript?
preview: Эта статья представляет собой обзор оператора infer в TypeScript, предназначенного для вывода типов данных из других типов. В ней рассматриваются основы и продвинутые концепции типизации функций, а также приводятся примеры применения оператора infer для повышения надежности и поддерживаемости кода.
---

# Что такое ваш infer?

Оператор ***infer*** используется в контексте типовых параметров для "вывода" типа данных из другого типа. Это позволяет явно указывать тип данных, когда TypeScript не может самостоятельно его определить.
Чтобы понять как работает ***infer*** давайте взглянем на простой пример:

```typescript
const getGreeting = (name: string) => {
    return `Hello ${name}`
}

type MyParameters<T extends (...args: any[]) => unknown> = T extends (...args: infer Args) => unknown ? Args : never;
type A = MyParameters<typeof getGreeting> // type A = [name: string]
```
Здесь мы написали тип `MyParameters` подобный утилитарному типу Parameters. Данный тип в generic параметр принимает функцию и возвращает типы агрументов функции. Посмотрим как это работает. 

Проверка `T extends (...args: infer Args) => unknown ? Args : never` работает таким образом, что на уровне проверки запись `infer Args` будет преобразована в any, и если тип функции сможет соответствовать этому extends мы получим тип `Args`.

Однако, откуда берется `Args`? Ключевое слово infer говорит, что после проверки на any – язык сам подхватит нужный нам тип, подобно generic.

```typescript
type A = MyParameters<(link: string, options: Record<string, string>) => void> // type A = [link: string, options: Record<string, string>]
type B = MyParameters<() => void> // type B = []
type C = MyParameters<string> // Type 'string' does not satisfy the constraint '(...args: any[]) => unknown'.
```

## Ограничения (infer extends)
Посмотрим на следующий пример:

```typescript
type GetFirstLetter<T extends string> = T extends `${infer First}${infer _}` ? First : never;
type A = GetFirstLetter<'abc'> // type A
```
Тип `GetFirstLetter` получает и возвращает первый символ из переданной строки. Наша задача задать определенные символы которые мы можем получить, здесь нам поможет конструкция ***infer extends***. На самом деле мы можем ограничить `infer First` также как мы делаем это с generic, и в случае несоответсвия мы попадем в `never`.

```typescript
const allowedLetters = ['j', 's', 't', 'o', 'p'] as const
type GetFirstLetter<T extends string, L extends readonly string[]> = T extends `${infer First extends L[number]}${infer _}` ? First : never;
type A = GetFirstLetter<'abc', typeof allowedLetters> // type A = never
type B = GetFirstLetter<'js', typeof allowedLetters> // type B = 'j'
type C = GetFirstLetter<1, typeof allowedLetters> // Type 'number' does not satisfy the constraint 'string'.
```
Тип `GetFirstLetter` мы можем представить в таком виде, обе записи будут идентичны:

```typescript
type GetFirstLetter<T extends string, L extends readonly string[]> = T extends `${infer First}${infer _}` 
	? First extends L[number]
		? First
		: never
	: never;
```

# Заключение

В этой статье мы изучили оператор infer в TypeScript и его применение для вывода типов данных из других типов. Мы рассмотрели основы и продвинутые концепции типизации функций, а также ограничения и возможности, которые предоставляет infer.

Понимание и эффективное использование оператора infer позволит вам создавать более надежный и поддерживаемый код в ваших проектах на TypeScript. Обладая этим инструментом, разработчики могут более гибко и точно определять типы данных, что способствует улучшению качества программного обеспечения и упрощает его дальнейшую поддержку и развитие.
