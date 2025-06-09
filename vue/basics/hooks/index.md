---
metaTitle: Использование хуков жизненного цикла в Vue
metaDescription: Изучите использование хуков жизненного цикла в Vue - детальный обзор всех стадий жизненного цикла, применение на практике, лучшие методы и частые вопросы
author: Олег Марков
title: Использование хуков жизненного цикла в Vue
preview: Разберитесь, как работают хуки жизненного цикла во Vue - пошаговые примеры, объяснения и советы помогут вам грамотно работать с компонентами на любых этапах их жизни
---

## Введение

В работе с Vue одним из ключевых аспектов считается управление жизненным циклом компонентов. Каждый компонент в Vue проходит ряд этапов от создания до удаления из DOM, и на каждом из них разработчику предоставляется особая возможность вмешаться — через так называемые "хуки жизненного цикла". Использование этих хуков позволяет выполнять дополнительную логику на определённых стадиях: инициализировать данные, слушать события, загружать ресурсы, чистить ресурсы и многое другое.

В этой статье я расскажу вам подробно о том, что такое хуки жизненного цикла, зачем они нужны, какие этапы жизненного цикла существуют во Vue и как использовать каждый хук на практике. Будут приведены примеры с кодом и пояснениями для лучшего понимания процесса. Особое внимание уделю специфике hooks в Vue 2 и Vue 3, их отличиям и рекомендациям по использованию.

---

## Этапы жизненного цикла компонента во Vue

Vue-компонент проходит последовательность стадий, начиная с создания, затем монтирования в DOM, обновления и, наконец, размонтирования. На каждом из этапов срабатывают соответствующие хуки жизненного цикла.

### Основные этапы жизненного цикла

1. **Инициализация**  
   На этом этапе происходит подготовка компонента: инициализируются реактивные данные, события, вычисляемые свойства.

2. **Монтирование (`mounting`)**  
   Компонент впервые добавляется в DOM, шаблон преобразуется в реальную разметку.

3. **Обновление (`updating`)**  
   При изменении пропсов или данных компонент повторно рендерится.

4. **Размонтирование (`unmounting`)**  
   Компонент удаляется из DOM, происходит "уборка" ресурсов.

### Список хуков жизненного цикла

В Vue 2 и Vue 3 названия и этапы хуков идентичны, но в Vue 3 появились дополнительные возможности при использовании Composition API.

- beforeCreate
- created
- beforeMount
- mounted
- beforeUpdate
- updated
- beforeUnmount (Vue 3) / beforeDestroy (Vue 2)
- unmounted (Vue 3) / destroyed (Vue 2)
- errorCaptured (Vue 2 и 3)
- renderTracked и renderTriggered (Vue 3)

---

## Подробное рассмотрение каждого хука

Давайте разберёмся, чем занимается каждый хук, на что он способен и где лучше его применять. Я буду приводить примеры для Vue 2 (Options API) и Vue 3 (Composition API).

### Хуки инициализации

#### beforeCreate

Этот хук срабатывает сразу после создания экземпляра компонента, до инициализации данных и методов.

```js
export default {
  beforeCreate() {
    // Здесь this.data, this.props и методы ещё не доступны
    console.log('beforeCreate хук вызван');
  }
}
```

Вариант для Composition API во Vue 3 не предусмотрен, но основная интервенция здесь не требуется — данные еще не созданы.

#### created

Хук вызывается после инициализации реактивных данных, методов, событий. Здесь уже доступны все свойства экземпляра.

```js
export default {
  created() {
    // Уже доступны this.data, this.methods
    console.log('created хук вызван');
    this.fetchData();
  },
  methods: {
    fetchData() {
      // Имитация загрузки данных
      console.log('Загрузка данных...');
    }
  }
}
```

В Composition API обычно аналогичный код располагается прямо в теле функции setup, но есть и способ явно использовать onBeforeMount:

```js
import { onBeforeMount } from 'vue';

export default {
  setup() {
    onBeforeMount(() => {
      // Всё инициализировано, можно обращаться к реактивным данным
      console.log('created аналог выполнен');
    });
  }
}
```

---

### Хуки монтирования

#### beforeMount

Этот хук вызывается после компиляции шаблона, но до добавления разметки в DOM. В этот момент еще нельзя обращаться к DOM-нодам компонента.

```js
export default {
  beforeMount() {
    console.log('beforeMount вызывается — компонент почти готов к монтированию');
  }
}
```

#### mounted

Один из самых популярных хуков. Срабатывает, когда компонент и его дочерние компоненты уже добавлены в DOM. Здесь удобно работать с DOM напрямую (например, получать размеры элементов).

```js
export default {
  mounted() {
    // Можно обращаться к this.$el
    console.log('mounted: DOM готов');
    // Пример: фокус на input после его появления
    this.$refs.myInput.focus();
  }
}
```

Пример для Composition API:

```js
import { onMounted, ref } from 'vue';

export default {
  setup() {
    const myInput = ref(null);

    onMounted(() => {
      // После финиша рендера доступен ref
      myInput.value.focus();
    });

    return { myInput };
  },
  template: `<input ref="myInput" />`
}
```

---

### Хуки обновления

#### beforeUpdate

Выполняется сразу перед повторным рендерингом компонента.

```js
export default {
  beforeUpdate() {
    console.log('beforeUpdate: что-то изменилось, скоро перерисуемся');
  }
}
```

#### updated

Этот хук вызывается после того, как изменения отобразились в DOM. Здесь можно запускать дополнительную обработку, связанную с обновленным DOM.

```js
export default {
  updated() {
    // Здесь DOM уже обновлен
    console.log('updated: компонент обновился');
  }
}
```

В Composition API:

```js
import { onUpdated } from 'vue';

export default {
  setup() {
    onUpdated(() => {
      // Аналог хуку updated
      console.log('Компонент обновился (Composition API)');
    });
  }
}
```

---

### Хуки размонтирования

#### beforeUnmount / beforeDestroy

Этот хук нужен для "уборки" перед удалением компонента (отписки от событий, таймеров и т.д.).

```js
export default {
  beforeDestroy() { // Vue 2
    // Здесь можно освободить ресурсы
    clearInterval(this.intervalId);
    console.log('beforeDestroy: компонент скоро удалится');
  },
  beforeUnmount() { // Vue 3
    // То же самое во Vue 3
    clearInterval(this.intervalId);
  }
}
```

В Composition API:

```js
import { onBeforeUnmount } from 'vue';

export default {
  setup() {
    let interval = setInterval(() => {
      console.log('working...');
    }, 1000);

    onBeforeUnmount(() => {
      clearInterval(interval); // Очищаем ресурсы
      console.log('Компонент размонтируется, чистим ресурсы');
    });
  }
}
```

#### destroyed / unmounted

Сигнализируют, что компонент полностью удалён из DOM.

```js
export default {
  destroyed() { // Vue 2
    console.log('destroyed: компонент удалён');
  },
  unmounted() { // Vue 3
    console.log('unmounted: компонент удалён');
  }
}
```

Для Composition API:

```js
import { onUnmounted } from 'vue';

export default {
  setup() {
    onUnmounted(() => {
      console.log('Компонент полностью удалён из DOM');
    });
  }
}
```

---

### Специальные хуки

#### errorCaptured

Обработка ошибок в дочерних компонентах. Позволяет сделать более устойчивое приложение.

```js
export default {
  errorCaptured(err, vm, info) {
    // err — ошибка, vm — компонент, info — информация о контексте
    console.error('Ошибка в дочернем компоненте:', err);
    return false; // Если вернуть false, ошибка не всплывает выше
  }
}
```

В Composition API:

```js
import { onErrorCaptured } from 'vue';

export default {
  setup() {
    onErrorCaptured((err, instance, info) => {
      console.error('Поймана ошибка:', err, info);
      return false; // Остановить распространение
    });
  }
}
```

#### renderTracked и renderTriggered (Vue 3)

Используются для отладки, отслеживают зависимость реактивности компонента на рендере.

```js
import { onRenderTracked, onRenderTriggered } from 'vue';

export default {
  setup() {
    onRenderTracked((e) => {
      console.log('Отслеживается:', e);
    });

    onRenderTriggered((e) => {
      console.log('Рендер сработал из-за:', e);
    });
  }
}
```

---

## Практические примеры использования хуков

Посмотрим на реальные ситуации, где хуки жизненного цикла делают процесс разработки комфортнее и надёжнее.

### Загрузка данных при монтировании

Самый типичный случай:

```js
export default {
  data() {
    return {
      posts: []
    };
  },
  async mounted() {
    // Данные грузим при появлении компонента
    this.posts = await fetch('/api/posts').then(res => res.json());
  }
}
```

В Composition API:

```js
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const posts = ref([]);

    onMounted(async () => {
      posts.value = await fetch('/api/posts').then(res => res.json());
    });

    return { posts };
  }
}
```

### Очистка ресурсов

Когда компоненты используют таймеры или подписываются на события, обязательно нужно от них отписываться при удалении компонента. Пренебрежение этим приводит к утечке памяти.

```js
export default {
  mounted() {
    this.intervalId = setInterval(() => {
      console.log('working...');
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  }
}
```

---

### Сравнение хуков в Options API и Composition API

| Этап               | Options API (Vue 2/3)           | Composition API (Vue 3)     |
|--------------------|----------------------------------|-----------------------------|
| beforeCreate       | beforeCreate()                   | —                           |
| created            | created()                        | — (setup())                 |
| beforeMount        | beforeMount()                    | onBeforeMount()             |
| mounted            | mounted()                        | onMounted()                 |
| beforeUpdate       | beforeUpdate()                   | onBeforeUpdate()            |
| updated            | updated()                        | onUpdated()                 |
| beforeDestroy      | beforeDestroy() (Vue 2)          | —                           |
| destroyed          | destroyed() (Vue 2)              | —                           |
| beforeUnmount      | beforeUnmount() (Vue 3)          | onBeforeUnmount()           |
| unmounted          | unmounted() (Vue 3)              | onUnmounted()               |
| errorCaptured      | errorCaptured()                  | onErrorCaptured()           |

---

## Особенности и рекомендации по работе с хуками

### Когда использовать какой хук

- Для инициализации данных, которые не требуют доступа к DOM — используйте `created` или в setup-функции (Composition API).
- Для работы с DOM и сторонними библиотеками — используйте `mounted`/`onMounted`.
- Для отписки и очистки ресурсов — `beforeUnmount`/`onBeforeUnmount`.
- Для реагирования на обновления — `updated`/`onUpdated`.
- Для ловли ошибок во вложенных компонентах — `errorCaptured`/`onErrorCaptured`.

### Хуки и асинхронный код

Если вы используете асинхронные операции в хуках, учитывайте, что выполнение основного кода хуков не дожидается окончания асинхронных операций. Например, если в хуке mounted вы делаете async-запрос, компонент монтируется независимо от окончания запроса.

### Хуки в родителях и детях

Vue сначала вызывает beforeCreate/created у родителя, затем у детей. Но при монтировании и размонтировании — наоборот: сначала у детей, затем у родителя. Это важно при планировании работы с глобальными ресурсами и подписками.

---

## Итоги

Хуки жизненного цикла — это обязательный инструмент управления поведением и состоянием компонентов в Vue. Каждый хук предназначен для вмешательства на определённой стадии жизненного пути компонента. Понимание, когда и как их применять, позволяет создавать надёжные и производительные приложения, грамотно организовывать загрузку данных, подписку и очистку ресурсов, а также отслеживать и внутренние ошибки.

---

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как правильно работать с event listeners во Vue и удалять их при размонтировании компонента?

Добавляйте обработчики событий (например, window или document) в хуке mounted или onMounted, а удаляйте их в beforeUnmount/onBeforeUnmount. Пример:

```js
mounted() {
  window.addEventListener('resize', this.handleResize);
},
beforeUnmount() {
  window.removeEventListener('resize', this.handleResize);
}
```

### Почему хуки жизненного цикла не работают во вложенных функциях внутри setup?

Хуки должны вызываться непосредственно во время выполнения setup, а не внутри вложенных колбеков, условий или после асинхронного кода. Иначе Vue не сможет корректно отследить их.

### Можно ли вызывать один и тот же хук несколько раз в одном компоненте (например, несколько onMounted внутри setup)?

Да, во Vue 3 (Composition API) можно использовать onMounted и другие хуки несколько раз — все колбеки будут вызваны в порядке регистрации.

### Как получить доступ к this внутри хуков Composition API?

Внутри функций вроде onMounted и onUpdated в Composition API ключевое слово this не определено, потому что setup не использует контекст экземпляра. Вместо этого используйте ref и reactive для хранения и доступа к данным.

### Как обрабатывать ошибки, если errorCaptured не срабатывает?

errorCaptured ловит только ошибки рендера и хуков дочерних компонентов. Если у вас асинхронный код (fetch и т.п.), используйте try-catch прямо в асинхронной функции, либо globалрые обработчики через Vue.config.errorHandler в корне приложения.