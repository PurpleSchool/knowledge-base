---
metaTitle: "TypeScript в NestJS: декораторы, типы и DI"
metaDescription: "Как TypeScript используется в NestJS: декораторы, DTO, дженерики, dependency injection и правильная конфигурация tsconfig."
author: "Антон Ларичев"
title: "TypeScript в NestJS"
preview: "Разбираем, как NestJS использует TypeScript: декораторы, строгая типизация DTO, дженерики и type-safe dependency injection."
---

NestJS — один из немногих фреймворков, который с самого начала строился вокруг TypeScript, а не был адаптирован под него позже. Декораторы, метаданные и строгая система типов — не дополнение к NestJS, а его архитектурная основа. В этой статье разберём, как TypeScript работает в NestJS на практике.

## Почему NestJS требует TypeScript

NestJS использует механизм `reflect-metadata` для реализации dependency injection. Во время компиляции TypeScript сохраняет типы аргументов конструктора в метаданных класса. NestJS читает эти метаданные в runtime и автоматически разрешает зависимости.

Без TypeScript этот механизм не работает — именно поэтому NestJS требует TypeScript, а не просто рекомендует его.

Для включения записи метаданных в `tsconfig.json` должны быть активированы два флага:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2021",
    "module": "commonjs",
    "strict": true,
    "strictNullChecks": true
  }
}
```

`emitDecoratorMetadata` — ключевой флаг: без него NestJS не сможет определить типы зависимостей и контейнер IoC перестанет работать.

## Декораторы как основа NestJS

Все ключевые абстракции NestJS выражены через декораторы. Рассмотрим их по слоям.

### Декоратор @Module

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

`@Module` принимает объект типа `ModuleMetadata`. Это обычный TypeScript-интерфейс, и IDE подсветит ошибку, если передать неверное поле.

### Декоратор @Injectable

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}
```

`@Injectable()` помечает класс как провайдер, которым может управлять контейнер NestJS. Декоратор также является триггером для `emitDecoratorMetadata` — TypeScript записывает типы параметров конструктора в метаданные именно в момент применения декоратора к классу.

### Декораторы контроллера

```typescript
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): User[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): User | undefined {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.create(createUserDto);
  }
}
```

`ParseIntPipe` здесь — это пример использования встроенных пайпов NestJS, которые преобразуют строковый параметр из URL в число. Тип параметра `id: number` корректно отражает, что после пайпа значение гарантированно является числом.

## DTO: классы вместо интерфейсов

DTO (Data Transfer Object) — объекты для описания входящих данных. NestJS рекомендует использовать **классы**, а не интерфейсы — и это принципиальный момент.

Интерфейсы TypeScript исчезают после компиляции. Классы остаются в JavaScript и доступны в runtime. Это позволяет библиотеке `class-validator` проверять данные на основе декораторов, а `class-transformer` — преобразовывать plain-объекты в экземпляры класса.

```typescript
import { IsString, IsEmail, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
```

Чтобы NestJS автоматически валидировал все входящие DTO, нужно подключить `ValidationPipe` глобально:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

Опция `transform: true` активирует автоматическое преобразование типов: строки из запроса будут конвертироваться в числа, булевы значения и т.д. — в соответствии с типами, указанными в DTO.

### PartialType и другие mapped types

NestJS предоставляет утилиты для создания производных DTO:

```typescript
import { PartialType, PickType, OmitType, IntersectionType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Все поля становятся необязательными
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// Только указанные поля
export class LoginDto extends PickType(CreateUserDto, ['email'] as const) {}

// Все поля кроме указанных
export class PublicUserDto extends OmitType(CreateUserDto, ['age'] as const) {}
```

`PartialType` не просто делает поля опциональными на уровне TypeScript — он копирует все декораторы валидации из исходного класса и оборачивает их в `@IsOptional()`. Это поведение недостижимо с обычными TypeScript utility types (`Partial<T>`), потому что те работают только с типами, но не с runtime-декораторами.

## Дженерики в NestJS

Дженерики позволяют создавать переиспользуемые паттерны с сохранением типизации.

### Стандартный ответ API

```typescript
export class ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;

  constructor(data: T, message = 'Success', statusCode = 200) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }
}
```

Применение в контроллере:

```typescript
@Get()
findAll(): ApiResponse<User[]> {
  const users = this.usersService.findAll();
  return new ApiResponse(users);
}
```

### Дженерики в репозиториях

При работе с TypeORM или Prisma дженерики помогают строить базовые репозитории:

```typescript
import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';

export abstract class BaseRepository<T extends { id: number }> {
  constructor(protected readonly repository: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  findOne(id: number): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }
}
```

## Type-safe Dependency Injection

### Внедрение через конструктор

Основной и рекомендуемый способ:

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
  ) {}
}
```

TypeScript гарантирует, что передаваемые зависимости соответствуют ожидаемым типам. Если сервис удалён или переименован, компилятор немедленно сообщит об ошибке.

### Кастомные провайдеры с токенами

Когда нужно внедрить значение не-класс (строку, объект конфигурации), используются токены:

```typescript
export const CONFIG_TOKEN = 'APP_CONFIG';

export interface AppConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
}

// В модуле
@Module({
  providers: [
    {
      provide: CONFIG_TOKEN,
      useValue: {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
        maxRetries: 3,
      } satisfies AppConfig,
    },
  ],
})
export class AppModule {}

// В сервисе
@Injectable()
export class ApiService {
  constructor(
    @Inject(CONFIG_TOKEN) private readonly config: AppConfig,
  ) {}

  getUrl(): string {
    return this.config.apiUrl;
  }
}
```

Ключевое слово `satisfies` (TypeScript 4.9+) проверяет соответствие объекта типу `AppConfig` без потери литерального типа значений.

### Интерфейсы как контракты для провайдеров

```typescript
export interface NotificationService {
  send(to: string, message: string): Promise<void>;
}

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

@Injectable()
export class EmailNotificationService implements NotificationService {
  async send(to: string, message: string): Promise<void> {
    // отправка email
  }
}

@Injectable()
export class SmsNotificationService implements NotificationService {
  async send(to: string, message: string): Promise<void> {
    // отправка SMS
  }
}

// В модуле можно переключать реализацию без изменения потребителя
@Module({
  providers: [
    {
      provide: NOTIFICATION_SERVICE,
      useClass: EmailNotificationService,
    },
  ],
})
export class NotificationsModule {}
```

## Типизация исключений и фильтров

NestJS предоставляет иерархию исключений, которую удобно расширять:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Пользователь с id ${id} не найден`, HttpStatus.NOT_FOUND);
  }
}

// Использование в сервисе
findOne(id: number): User {
  const user = this.users.find(u => u.id === id);
  if (!user) {
    throw new UserNotFoundException(id);
  }
  return user;
}
```

Filter для обработки кастомных исключений:

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

Здесь `host.switchToHttp()` возвращает специфичный для HTTP контекст. Дженерик `ctx.getResponse<Response>()` сообщает TypeScript, что речь идёт о типе из `express`, и включает автодополнение.

## Типизация конфигурации с ConfigService

Модуль `@nestjs/config` поддерживает дженерик для строгой типизации:

```typescript
import { ConfigService } from '@nestjs/config';

interface EnvironmentVariables {
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
}

@Injectable()
export class DatabaseService {
  constructor(
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  getConnectionString(): string {
    // TypeScript знает, что DATABASE_URL — строка
    return this.configService.get('DATABASE_URL', { infer: true });
  }
}
```

С опцией `{ infer: true }` TypeScript выводит тип возвращаемого значения из интерфейса `EnvironmentVariables`, исключая необходимость явных приведений типов.

## Пайпы с дженериками

Пайпы трансформируют или валидируют входные данные. Интерфейс `PipeTransform` параметризован:

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      throw new BadRequestException(
        `${metadata.data} должен быть положительным целым числом`,
      );
    }
    return val;
  }
}
```

`PipeTransform<string, number>` явно указывает: на вход приходит строка, на выходе — число. TypeScript проследит за корректностью реализации метода `transform`.

## Итог

TypeScript в NestJS — это не просто синтаксический сахар. Вот что TypeScript даёт фреймворку на практике:

- **Декораторы и метаданные** — основа механизма dependency injection
- **Классы вместо интерфейсов для DTO** — позволяет библиотекам валидации работать в runtime
- **Дженерики** — переиспользуемые паттерны без потери типобезопасности
- **Строгая типизация провайдеров** — ошибки разрешения зависимостей обнаруживаются на этапе компиляции
- **Mapped types** — производные DTO с копированием декораторов валидации

Чем строже настроен `tsconfig.json` (особенно `strict: true`), тем больше ошибок TypeScript находит до запуска кода. В контексте NestJS это особенно ценно, поскольку многие проблемы DI проявляются только в runtime.

Для глубокого погружения в разработку серверных приложений на NestJS с TypeScript — [курс по Node.js на PurpleSchool](https://purpleschool.ru/course/nodejs?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-in-nestjs).