---
metaTitle: Архитектура Feature Sliced Design в Angular
metaDescription: Подробное руководство по применению Feature Sliced Design в Angular проектах - структура слоев примеры кода и советы по миграции к modular архитектуре
author: Олег Марков
title: Feature Sliced Design для Angular - как организовать масштабируемую архитектуру
preview: Разбор подхода Feature Sliced Design для Angular - слои слайсы и практическая структура проекта на angular-fsd с пояснениями и примерами
---

## Введение

Feature-Sliced Design (FSD) за последние годы стал одним из самых популярных подходов к архитектуре фронтенда. Чаще всего вы могли встречать его в связке с React, но сами идеи FSD отлично ложатся и на Angular. Вам не нужно отказываться от Angular модулей, сервисов и dependency injection – вы просто по-новому организуете их в слоях и слайсах.

Задача FSD в Angular проста: сделать так, чтобы приложение можно было:

- проще масштабировать;
- безопаснее рефакторить;
- легче разделять между командами;
- переиспользовать функциональность без "протаскивания" лишних зависимостей.

Здесь я покажу вам, как идеи Feature-Sliced Design адаптируются под Angular (иногда это называют angular-fsd), какую структуру проекта удобно использовать, какие правила зависимостей ввести и как постепенно мигрировать существующее приложение.

---

## Основные принципы Feature-Sliced Design в Angular

### Что такое слои и слайсы применительно к Angular

В FSD есть две ключевые оси организации кода:

- по вертикали — слои (layers);
- по горизонтали — слайсы (slices).

В Angular эти оси можно совместить с привычными артефактами:

- слой — это "уровень абстракции" приложения;
- слайс — это "модуль предметной области" внутри слоя.

Чаще всего слои берутся такие:

- app (composition root);
- pages;
- widgets;
- features;
- entities;
- shared.

Слайс — это конкретная сущность или область: user, auth, product, cart, profile и т.д.

На практике структура может выглядеть так:

- src/app/app.layer
- src/app/pages
- src/app/widgets
- src/app/features
- src/app/entities
- src/app/shared

Внутри каждого слоя — слайсы:

- src/app/entities/user
- src/app/entities/product
- src/app/features/auth
- src/app/widgets/user-card
- src/app/pages/profile-page

### Базовый набор слоев для Angular

Разберем каждый слой, чтобы вы понимали роль и ответственность.

#### Слой shared

Слой shared содержит то, что не знает о предметной области:

- общие интерфейсы и типы;
- утилиты;
- инфраструктуру (http клиенты-обертки, interceptors, guards);
- UI-компоненты "без знания домена" (кнопки, инпуты, модальные окна).

Смотрите, я покажу вам пример типичного слайса в shared:

```ts
// src/app/shared/ui/button/ui/button.component.ts

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-button',
  template: `
    <button
      type="button"
      [ngClass]="['ui-button', variant]"
    >
      <!-- Здесь мы выводим содержимое кнопки -->
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  // Здесь мы задаем внешний вид кнопки - primary, secondary и т.д.
  @Input() variant: 'primary' | 'secondary' = 'primary';
}
```

Важно: этот компонент ничего не знает о пользователях, заказах или авторизации. Только UI.

#### Слой entities

Entities описывает базовые сущности домена:

- модели данных;
- сервисы работы с конкретной сущностью;
- простые компоненты отображения одной сущности;
- базовые store-слои для сущности (Signal Store, NgRx feature, NGXS state и т.д.).

Давайте разберемся на примере сущности User:

```ts
// src/app/entities/user/model/user.model.ts

// Здесь мы описываем тип пользователя домена
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
}
```

```ts
// src/app/entities/user/api/user.api.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../model/user.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly baseUrl = '/api/users';

  constructor(private readonly http: HttpClient) {}

  // Здесь мы загружаем текущего пользователя
  getCurrent(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }
}
```

```ts
// src/app/entities/user/ui/user-avatar/user-avatar.component.ts

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { User } from '../../model/user.model';

@Component({
  selector: 'user-avatar',
  template: `
    <div class="user-avatar">
      <!-- Здесь мы выводим первые буквы имени пользователя -->
      <span>{{ user?.fullName | slice: 0:1 }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  // Компонент отображает только данные пользователя, но ничего не знает об auth
  @Input({ required: true }) user!: User;
}
```

Слой entities знаком со слоем shared, но не знает о features, widgets или pages.

#### Слой features

Features — это законченные пользовательские сценарии:

- логин;
- смена пароля;
- добавление товара в корзину;
- фильтры каталога.

Feature может использовать несколько entities, shared и при необходимости локальное состояние.

Теперь вы увидите, как это выглядит в коде:

```ts
// src/app/features/auth-login/ui/auth-login-form/auth-login-form.component.ts

import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'feature-auth-login-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Здесь мы используем примитивные UI из shared -->
      <ui-input formControlName="email" label="Email"></ui-input>
      <ui-input
        formControlName="password"
        type="password"
        label="Пароль"
      ></ui-input>

      <ui-button variant="primary">
        Войти
      </ui-button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginFormComponent {
  // Здесь мы описываем форму авторизации
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // Внешний мир получает только событие - данные формы
  @Output() login = new EventEmitter<{ email: string; password: string }>();

  constructor(private readonly fb: FormBuilder) {}

  // Когда форма отправляется, мы эмитим событие наверх
  onSubmit(): void {
    if (this.form.valid) {
      this.login.emit(this.form.value as { email: string; password: string });
    }
  }
}
```

Feature не должен напрямую знать, как именно хранятся данные пользователя в глобальном стейте страницы. Он просто реализует сценарий "ввести логин и пароль и отдать наверх".

#### Слой widgets

Widgets — это готовые фрагменты интерфейса, которые:

- состоят из нескольких features и entities;
- имеют свою компоновку и UI;
- но все еще не являются целой страницей.

Пример: виджет "панель пользователя" в шапке.

```ts
// src/app/widgets/user-panel/ui/user-panel/user-panel.component.ts

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { User } from 'src/app/entities/user/model/user.model';

@Component({
  selector: 'widget-user-panel',
  template: `
    <div class="user-panel" *ngIf="user; else loginBlock">
      <!-- Здесь мы показываем аватар и меню профиля -->
      <user-avatar [user]="user"></user-avatar>
      <span class="user-name">{{ user.fullName }}</span>

      <button (click)="onLogoutClick()">
        Выйти
      </button>
    </div>

    <ng-template #loginBlock>
      <!-- Здесь мы показываем кнопку входа, если user нет -->
      <a routerLink="/auth/login">Войти</a>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPanelComponent {
  // Компонент зависит от сущности User
  @Input() user: User | null = null;

  // Реальный logout будет проброшен через Output или сервис
  onLogoutClick(): void {
    // Здесь может быть вызов сервиса или эмит события
    // Например - this.logout.emit()
  }
}
```

#### Слой pages

Pages — это полноценные страницы приложения:

- связаны с маршрутизацией;
- собирают widgets и features;
- управляют page-стейтом (запросы, загрузка initial data и т.д.).

Давайте посмотрим, что происходит в следующем примере:

```ts
// src/app/pages/profile-page/ui/profile-page/profile-page.component.ts

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from 'src/app/entities/user/model/user.model';
import { UserApi } from 'src/app/entities/user/api/user.api';

@Component({
  selector: 'page-profile',
  template: `
    <ng-container *ngIf="user; else loading">
      <!-- Здесь мы собираем виджеты для страницы профиля -->
      <widget-user-panel [user]="user"></widget-user-panel>

      <!-- Здесь могут быть дополнительные блоки -->
      <section>
        <h2>Настройки профиля</h2>
        <!-- Вызываем feature для смены пароля и т.п. -->
      </section>
    </ng-container>

    <ng-template #loading>
      Загрузка...
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  user: User | null = null;

  constructor(private readonly userApi: UserApi) {}

  // Здесь мы загружаем данные пользователя при инициализации страницы
  ngOnInit(): void {
    this.userApi.getCurrent().subscribe(user => {
      this.user = user;
    });
  }
}
```

#### Слой app

Слой app — это точка сборки:

- корневой модуль/компонент;
- глобальные провайдеры;
- конфигурация роутинга;
- инициализация глобального стейта.

Слой app может знать обо всех слоях, но не должен содержать бизнес-логику.

---

## Структура проекта angular-fsd

### Пример структуры директорий

Теперь давайте перейдем к более конкретной структуре. Здесь я размещаю пример, чтобы вам было проще понять:

```text
src/
  app/
    app.layer/
      app.component.ts
      app.routes.ts
      app.config.ts
    pages/
      profile-page/
        ui/
          profile-page.component.ts
        model/
          profile-page.store.ts
        index.ts
      auth-page/
        ui/
          auth-page.component.ts
        index.ts
    widgets/
      user-panel/
        ui/
          user-panel.component.ts
        index.ts
    features/
      auth-login/
        ui/
          auth-login-form.component.ts
        model/
          auth-login.service.ts
        index.ts
    entities/
      user/
        model/
          user.model.ts
        api/
          user.api.ts
        ui/
          user-avatar/
            user-avatar.component.ts
        index.ts
    shared/
      ui/
        button/
          ui/
            button.component.ts
          index.ts
        input/
          ui/
            input.component.ts
          index.ts
      lib/
        validators/
        date/
      api/
        http/
      index.ts
```

Обратите внимание, как этот фрагмент структуры решает задачу:

- каждый слой — отдельная папка верхнего уровня;
- внутри слоя — слайсы (profile-page, user-panel, user);
- внутри слайса — подкаталоги ui, model, api и т.д.;
- у каждого слайса есть index.ts для удобного экспорта.

### index.ts как точка входа слайса

Чтобы не импортировать из "глубоких" путей, удобно использовать index.ts. Покажу вам, как это реализовано на практике.

Например, для сущности User:

```ts
// src/app/entities/user/index.ts

// Здесь мы экспортируем публичный API сущности User
export * from './model/user.model';
export * from './api/user.api';
export * from './ui/user-avatar/user-avatar.component';
```

И тогда в других местах вы пишете:

```ts
// Здесь мы импортируем все из единой точки входа сущности User
import { User, UserApi, UserAvatarComponent } from 'src/app/entities/user';
```

Это помогает скрыть внутреннюю структуру слайса и облегчает рефакторинг.

---

## Правила зависимостей между слоями

Feature-Sliced Design вводит важное правило: каждый слой может зависеть только от "нижележащих" слоев.

Для Angular удобно использовать такой порядок (снизу вверх):

- shared
- entities
- features
- widgets
- pages
- app

Зависимости разрешены:

- shared → ничего (только внутренняя инфраструктура);
- entities → shared;
- features → entities, shared;
- widgets → features, entities, shared;
- pages → widgets, features, entities, shared;
- app → все слои.

Например, feature не должен импортировать ничего из pages или app. Такое правило помогает избежать циклических зависимостей и "утечки" высокоуровневой логики в низкоуровневые слои.

Чтобы это правило работало стабильно, вы можете:

- договориться внутри команды и делать code review с учетом слоев;
- использовать ESLint с правилом по alias (например, запрещать import из путей, относящихся к "верхним" слоям).

---

## Применение FSD с Angular модулями и Standalone компонентами

### Вариант 1 – Angular модули

Если вы используете классические NgModule, их удобно привязывать к слайсам. Давайте посмотрим, как это устроено:

```ts
// src/app/features/auth-login/auth-login.module.ts

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedUiInputModule } from 'src/app/shared/ui/input';
import { SharedUiButtonModule } from 'src/app/shared/ui/button';
import { AuthLoginFormComponent } from './ui/auth-login-form/auth-login-form.component';

@NgModule({
  declarations: [AuthLoginFormComponent],
  imports: [
    ReactiveFormsModule,
    // Здесь мы подключаем общие UI модули
    SharedUiInputModule,
    SharedUiButtonModule,
  ],
  exports: [AuthLoginFormComponent],
})
export class AuthLoginModule {}
```

Схожим образом можно делать модули для pages, widgets, entities.

### Вариант 2 – Standalone компоненты

С Angular Standalone (15+) архитектура FSD обычно получается еще чище. Каждый компонент в слайсе становится standalone, а зависимости подключаются через массив imports.

Пример standalone feature-компонента:

```ts
// src/app/features/auth-login/ui/auth-login-form/auth-login-form.component.ts

import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonComponent } from 'src/app/shared/ui/button';
import { InputComponent } from 'src/app/shared/ui/input';

@Component({
  selector: 'feature-auth-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    // Здесь мы подключаем standalone UI компоненты из shared
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <ui-input formControlName="email" label="Email"></ui-input>
      <ui-input
        formControlName="password"
        type="password"
        label="Пароль"
      ></ui-input>

      <ui-button variant="primary">
        Войти
      </ui-button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginFormComponent {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  @Output() login = new EventEmitter<{ email: string; password: string }>();

  constructor(private readonly fb: FormBuilder) {}

  onSubmit(): void {
    if (this.form.valid) {
      this.login.emit(this.form.value as { email: string; password: string });
    }
  }
}
```

Standalone-компоненты в FSD удобно комбинировать: каждый слайс может предоставлять набор standalone-компонентов как публичный API.

---

## Организация состояния (NgRx, SignalStore, сервисы)

### Где хранить состояние по FSD

В Angular есть много вариантов стейт-менеджмента: сервисы с BehaviorSubject, NgRx, NGXS, Akita, Signals и т.д. В контексте FSD важнее не конкретный инструмент, а то, где именно он расположен:

- состояние, привязанное к одной сущности — в entities;
- состояние, описывающее сценарий (например, процесс логина) — в features;
- состояние страницы (фильтры, пагинация, локальная логика загрузки) — в pages;
- глобальное состояние, влияющее на все приложение (theme, layout, config) — в app или shared.

### Пример: состояние сущности User на Rx-сервисах

Покажу вам простой пример на базе BehaviorSubject:

```ts
// src/app/entities/user/model/user.store.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from './user.model';
import { UserApi } from '../api/user.api';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Здесь мы храним текущего пользователя
  private readonly user$ = new BehaviorSubject<User | null>(null);

  constructor(private readonly userApi: UserApi) {}

  // Публичный observable для подписки
  getCurrentUser$(): Observable<User | null> {
    return this.user$.asObservable();
  }

  // Загрузка текущего пользователя с сервера
  loadCurrentUser(): Observable<User> {
    return this.userApi.getCurrent().pipe(
      tap(user => this.user$.next(user)),
    );
  }

  // Сброс пользователя (например при logout)
  reset(): void {
    this.user$.next(null);
  }
}
```

Страница или виджет может вызывать методы этого стора, не зная деталей реализации.

---

## Пример сборки страницы по FSD

Давайте разберемся на примере простой страницы профиля, используя standalone-компоненты и FSD-структуру.

### Конфигурация роутинга на уровне app.layer

```ts
// src/app/app.layer/app.routes.ts

import { Routes } from '@angular/router';
import { ProfilePageComponent } from '../pages/profile-page';
import { AuthPageComponent } from '../pages/auth-page';

export const appRoutes: Routes = [
  {
    path: 'profile',
    // Здесь мы подключаем standalone компонент страницы профиля
    component: ProfilePageComponent,
  },
  {
    path: 'auth/login',
    component: AuthPageComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile',
  },
];
```

### Страница авторизации как composition из feature

```ts
// src/app/pages/auth-page/ui/auth-page/auth-page.component.ts

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLoginFormComponent } from 'src/app/features/auth-login';
import { UserStore } from 'src/app/entities/user/model/user.store';

@Component({
  selector: 'page-auth',
  standalone: true,
  imports: [AuthLoginFormComponent],
  template: `
    <h1>Авторизация</h1>

    <!-- Здесь мы используем feature как часть страницы -->
    <feature-auth-login-form
      (login)="onLogin($event)"
    ></feature-auth-login-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  constructor(
    private readonly userStore: UserStore,
    private readonly router: Router,
  ) {}

  // Здесь мы реализуем сценарий успешного логина на уровне страницы
  onLogin(credentials: { email: string; password: string }): void {
    // В реальном проекте здесь будет вызов AuthService
    // и последующая загрузка пользователя.
    // Для простоты покажу схематично.

    // Допустим, после логина мы загружаем пользователя.
    this.userStore.loadCurrentUser().subscribe(() => {
      this.router.navigate(['/profile']);
    });
  }
}
```

Как видите, здесь страница:

- использует feature (AuthLoginFormComponent);
- дергает entities-store (UserStore);
- управляет навигацией.

Feature остается переиспользуемым — его можно применить в модалке, отдельном виджете и т.д.

---

## Миграция существующего Angular проекта к FSD

### Пошаговый подход

Если у вас уже есть крупный Angular проект, переход к angular-fsd можно делать постепенно.

1. Ввести слои как директории:
   - создать папки shared, entities, features, widgets, pages;
   - перенести новые модули/компоненты сразу в нужный слой.
2. Начать с shared:
   - выделить общие UI-компоненты и утилиты;
   - вынести их из "feature-специфичных" модулей.
3. Выделить entities:
   - для каждой ключевой сущности (user, order, product) создать слайс в entities;
   - перенести модели, api-сервисы и простые UI-компоненты.
4. Переформировать features:
   - выделить сценарии (login, registration, add-to-cart) и группировать все компоненты/сервисы вокруг них;
   - следить, чтобы feature знал только о entities и shared.
5. Создать widgets и pages:
   - собрать существующие композиции UI в widgets;
   - оставить в pages минимум логики, только сборку и page-стейт.
6. Добавить index.ts для публичных API:
   - скрыть внутреннюю структуру слайсов;
   - упорядочить импорты.

### Простые правила, которые облегчат миграцию

- Не пытайтесь "идеализировать" структуру сразу, лучше двигаться итеративно.
- В каждом merge request можно просто:
  - при добавлении новой функциональности — положить ее сразу в нужный слой/слайс;
  - при правке старого кода — по возможности чуть-чуть "доделать" структуру вокруг.
- Отвечать на вопрос "где лежит код" по смыслу:
  - если это UI без домена — shared/ui;
  - если это бизнес-сущность — entities;
  - если это сценарий пользователя — features;
  - если это компоновка нескольких блоков — widgets;
  - если это маршрут и страница — pages.

---

## Типичные ошибки при использовании angular-fsd

### 1. Слой shared превращается в "свалку"

Очень часто разработчики начинают складывать "все непонятное" в shared. В итоге shared начинает знать про домен, и архитектура размывается.

Как избежать:

- в shared допустимы только вещи, которые реально не завязаны на предметную область;
- если вы видите в shared название user, order, product — скорее всего, это нужно перенести в entities.

### 2. Features начинают знать о pages

Иногда в features закладывают зависимость от конкретных страниц (например, через Router.navigate(['/profile']) внутри feature-компонента). Это ломает направленность зависимостей.

Как исправить:

- навигацию и "большие" побочные эффекты выносите в pages или в app слой;
- feature должен отдавать события (Output, observable), а страница уже решает, как на них реагировать.

### 3. Переусложнение слайсов

Иногда пытаются создать слишком много уровней папок внутри одного слайса, в итоге разработчикам тяжело ориентироваться.

Рекомендация:

- внутри слайса держите небольшой и понятный набор подпапок: ui, model, api, lib;
- если файлов становится слишком много — возможно, это признак того, что слайс нужно разбить на несколько слайсов.

### 4. Нарушение правил импортов

Если не контролировать импорты, со временем слои начинают зависеть друг от друга хаотично.

Решение:

- использовать alias пути по слоям (например, @shared, @entities, @features и т.д.);
- добавить линтер-правила, которые запрещают импорт "наверх" по иерархии.

---

## Заключение

Feature-Sliced Design хорошо сочетается с Angular, даже несмотря на то, что изначально подход чаще применяли в React-проектах. Основная ценность здесь не в конкретных инструментах (NgRx, standalone, модули), а в четком разделении ответственности по слоям и слайсам.

Если организовать приложение как набор слоев (shared, entities, features, widgets, pages, app) и соблюдать правила зависимостей, вы получите:

- более понятную структуру проекта;
- меньше "магических" связей между модулями;
- удобное переиспользование features и entities;
- безопасный и предсказуемый рефакторинг.

Вы можете внедрять angular-fsd постепенно: сначала на новые фичи, затем постепенно переносить старый код. Главное — держать в фокусе смысл каждого слоя и не смешивать доменную и инфраструктурную логику.

---

## Частозадаваемые технические вопросы

### Как настроить alias для слоев в Angular

1. В tsconfig.base.json добавьте paths:
   - "paths": {
     "@shared/*": ["src/app/shared/*"],
     "@entities/*": ["src/app/entities/*"],
     "@features/*": ["src/app/features/*"],
     "@widgets/*": ["src/app/widgets/*"],
     "@pages/*": ["src/app/pages/*"]
   }
2. В коде импортируйте по alias:
   - import { User } from '@entities/user';
   - import { ButtonComponent } from '@shared/ui/button';
3. Убедитесь, что IDE пересобрала конфигурацию TypeScript.

### Как запретить импорт "вверх" по слоям через ESLint

1. Установите eslint-plugin-boundaries или eslint-plugin-import.
2. В .eslintrc задайте зоны по alias:
   - слой shared не может импортировать entities/features/widgets/pages;
   - слой entities может импортировать только shared и entities.
3. Опишите правила в секции settings и rules плагина:
   - например, import/no-restricted-paths с указанием запрещенных базовых путей.

### Как подключать NgRx в структуре FSD

1. Для сущностей:
   - создайте store в entities/user/store;
   - экспортируйте reducers и selectors через entities/user/index.ts.
2. Для feature-логики:
   - разместите effects, формирующие сценарий (например LoginEffect), в features/auth-login/model.
3. В app.layer подключите NgRx StoreModule и EffectsModule и зарегистрируйте reducers и effects из entities и features.

### Как разделить shared/ui и design system компонентов

1. Внутри shared/ui создайте подуровни:
   - shared/ui/kit (базовые кнопки, инпуты с минимальным набором стилей);
   - shared/ui/design (конкретная дизайн-система проекта).
2. kit можно переиспользовать в других проектах, design завязан на бренд и цвета конкретного продукта.

### Как организовать тесты в angular-fsd

1. Располагайте тесты рядом с файлами:
   - user-avatar.component.spec.ts рядом с user-avatar.component.ts;
   - user.store.spec.ts рядом с user.store.ts.
2. Сохраняйте структуру слоев:
   - тесты entities лежат в entities, features — в features и т.д.
3. Для e2e тестов группируйте сценарии по pages:
   - каждый маршрут страницы получает свой набор e2e тестов, отражая поведение через UI.