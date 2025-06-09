---
metaTitle: Работа со скроллингом и прокруткой в Vue приложениях
metaDescription: Практическое руководство по управлению скроллингом и прокруткой в Vue - техники работы с событиями scroll, программная прокрутка, отслеживание положения и плавный переход
author: Олег Марков
title: Работа со скроллингом и прокруткой в Vue приложениях
preview: Освойте управление прокруткой в Vue - ловите события scroll, реализуйте плавную прокрутку, следите за позицией, делайте динамические эффекты и улучшайте UX. Примеры и готовые решения для вашего проекта.
---

## Введение

Прокрутка — важный аспект интерфейсов одностраничных приложений, и во Vue работа со скроллингом часто нужна для реализации множества сценариев: ленивой загрузки данных, анимаций при появлении блоков, управления панелями и разделами, "кнопки наверх" и многого другого. В этой статье я покажу ключевые способы работы со скроллингом во Vue, расскажу о стандартных событиях, нюансах программной прокрутки, определении положения прокрутки, плавном скролле и работе с виртуальными списками. Вы узнаете, как сделать интерфейс вашего Vue-приложения отзывчивым, быстрым и приятным для пользователя.

---

## Управление скроллингом через события scroll

### Как отследить скроллинг страницы или элемента

В браузере событие [scroll](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event) возникает при прокрутке содержимого элемента или вьюпорта. В Vue вы можете легко добавить обработку этого события через стандартные методы жизненного цикла.

Давайте посмотрим, как отследить позицию прокрутки всей страницы:

```js
// Пример отслеживания scroll для window
export default {
  data() {
    return {
      scrollY: 0 // Храним текущую позицию скролла
    }
  },
  methods: {
    handleScroll() {
      this.scrollY = window.scrollY // Обновляем при каждом scroll
    }
  },
  mounted() {
    // Добавляем обработчик при монтировании компонента
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy() {
    // По возможности чистим за собой — удаляем обработчик
    window.removeEventListener('scroll', this.handleScroll)
  }
}
```

Если же вы хотите реагировать на скроллинг конкретного контейнера (`div`, `ul` и т.п.), просто используйте ref и навесьте обработчик события scroll на этот DOM-элемент.

```html
<template>
  <div ref="scrollContainer" class="scroll-area">
    <!-- Много контента внутри -->
  </div>
</template>

<script>
export default {
  mounted() {
    this.$refs.scrollContainer.addEventListener('scroll', this.handleScrollElement)
  },
  beforeDestroy() {
    this.$refs.scrollContainer.removeEventListener('scroll', this.handleScrollElement)
  },
  methods: {
    handleScrollElement(e) {
      // Сохраняем позицию прокрутки внутри контейнера
      const top = e.target.scrollTop
      console.log('Scroll position:', top)
    }
  }
}
</script>
```

> Совет: если вам нужна максимальная производительность или у вас вложенные контейнеры, старайтесь сводить работу с событиями scroll к минимуму — это событие срабатывает часто.

---

## Программная прокрутка элементов и страницы

Навигация по якорям, плавная анимация при переходе, возврат пользователя наверх — все эти задачи решаются с помощью методов управления позицией скролла в JS.

### Как прокрутить страницу в заданное место

Самый простой способ:

```js
// Прокрутка окна браузера к 300px от верха
window.scrollTo({
  top: 300,
  left: 0,
  behavior: 'smooth' // Добавляем плавную анимацию скролла
})

// Или мгновенная прокрутка
window.scrollTo(0, 300)
```

### Прокрутка вложенного блока

```js
// Прокрутка к определенному положению внутри блока
this.$refs.abc.scrollTop = 500 // Прокручиваем к позиции 500px по вертикали
```

Плавная прокрутка к элементу с помощью scrollIntoView:

```js
this.$refs.targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
// Прокручивает ближайший ancestor такого, чтобы элемент оказался виден в верху контейнера
```

Давайте разберемся на примере — кнопка "наверх" для длинной страницы:

```html
<template>
  <button v-if="show" @click="scrollToTop" class="to-top">
    Наверх
  </button>
</template>

<script>
export default {
  data() {
    return { show: false }
  },
  mounted() {
    window.addEventListener('scroll', this.toggleBtn)
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.toggleBtn)
  },
  methods: {
    toggleBtn() {
      this.show = window.scrollY > 500
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
```

Как видите, всё просто. Мы проверяем положение прокрутки и показываем кнопку, если пользователь опустился ниже 500px, а по клику возвращаем его наверх с плавной анимацией.

---

## Прокрутка в рамках маршрутизации Vue Router

В одностраничных приложениях часто хочется, чтобы при переходе по роутам:

- Страница прокручивалась в начало, если грузится новая секция,
- Или сохранялась позиция при возврате "назад".

Это реализовано в Vue Router через функцию [scrollBehavior](https://router.vuejs.org/guide/advanced/scroll-behavior.html):

```js
// router/index.js
const router = new VueRouter({
  routes: [ /* ... */ ],
  scrollBehavior(to, from, savedPosition) {
    // Если позиция сохранилась (например кнопка "назад"), восстанавливаем
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      // Если есть якорь, скроллим к нему
      return {
        selector: to.hash,
        behavior: 'smooth' // поддерживается начиная с Vue Router 3.5+
      }
    } else {
      // Прокрутка наверх по умолчанию
      return { x: 0, y: 0 }
    }
  }
})
```

> Важный момент: плавная прокрутка по якорям с behavior: 'smooth' работает при поддержке браузером данного стандарта.

---

## Управление виртуальными списками и бесконечный скроллинг

В длинных лентах и списках часто встречается "бесконечная прокрутка" (infinite scroll) — когда по мере приближения к низу подгружаются новые данные.

### Простейшая реализация бесконечного скролла

```html
<template>
  <div ref="scrollArea" class="scrollable-list" @scroll="handleScroll">
    <div v-for="item in items" :key="item.id">{{ item.text }}</div>
    <div v-if="loading">Загрузка...</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [], // Данные списка
      loading: false,
      page: 1
    }
  },
  mounted() {
    this.fetchItems()
  },
  methods: {
    handleScroll(e) {
      const el = e.target
      // Если приблизились к низу на 100px — грузим еще порцию данных
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100 && !this.loading) {
        this.page++
        this.fetchItems()
      }
    },
    fetchItems() {
      this.loading = true
      // Мимикрия загрузки данных — представьте вместо setTimeout у вас axios
      setTimeout(() => {
        // Добавляем новые элементы к списку
        this.items.push(...Array.from({ length: 20 }, (_, i) => ({
          id: this.items.length + i,
          text: `Item ${this.items.length + i + 1}`
        })))
        this.loading = false
      }, 800)
    }
  }
}
</script>
```

Здесь мы на каждом событии scroll проверяем, насколько близко низ контейнера к текущему скроллу и при необходимости запрашиваем следующую порцию данных.

### Современные решения: виртуализация больших списков

Если в вашем приложении действительно большие списки (сотни и тысячи элементов), лучше использовать готовые виртуализированные компоненты, например [vue-virtual-scroll-list](https://github.com/tangbc/vue-virtual-scroll-list) или [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller), которые отрисовывают только видимые элементы.

Подключение и базовое использование vue-virtual-scroller:

```html
<template>
  <virtual-scroller :items="longList" :item-height="56">
    <template #default="{ item }">
      <div class="list-item">{{ item.title }}</div>
    </template>
  </virtual-scroller>
</template>

<script>
import { VirtualScroller } from 'vue-virtual-scroller'
export default {
  components: { VirtualScroller },
  data() {
    return {
      longList: Array.from({ length: 10000 }, (_, i) => ({ id: i, title: `Запись ${i}` }))
    }
  }
}
</script>
```
> Никаких сложных манипуляций с подписками scroll — компонент сам регулирует DOM и скроллинг, что очень экономит ресурсы.

---

## Реализация плавной анимации появления элементов при прокрутке

Сегодня анимации при появлении блоков на экране (например, fade-in, slide-up) — стандарт для современных сайтов. Давайте научимся реализовывать их собственноручно при помощи Intersection Observer.

### Использование Intersection Observer с Vue

Intersection Observer позволяет отслеживать появление элемента в viewport и запускать анимацию при необходимости.

Я покажу вам, как добавить fade-in анимацию, когда блок впервые появляется на экране:

```html
<template>
  <div
    v-for="(item, i) in list"
    :key="i"
    ref="animElems"
    :class="{ visible: visibleItems[i] }"
    class="fade-block"
  >
    {{ item }}
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: Array.from({length: 10}, (_, i) => `Элемент ${i + 1}`),
      visibleItems: []
    }
  },
  mounted() {
    this.visibleItems = Array(this.list.length).fill(false)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Найдём индекс нашего элемента
          const idx = Array.from(this.$refs.animElems).indexOf(entry.target)
          if (idx !== -1) this.$set(this.visibleItems, idx, true)
        }
      })
    }, { threshold: 0.3 })
    this.$refs.animElems.forEach(el => observer.observe(el))
  }
}
</script>

<style scoped>
.fade-block {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.7s cubic-bezier(.3,.9,.5,1)
}
.fade-block.visible {
  opacity: 1;
  transform: none;
}
</style>
```

В этом примере у каждого блока свой статус видимости, и когда Intersection Observer "видит", что элемент появился в области видимости браузера, добавляется класс для плавного появления с помощью CSS.

---

## Проверка позиции скролла: определяем, докручен ли пользователь до низа страницы/блока

Наверное, часто приходится понимать, насколько далеко пользователь прокрутил страницу или блок. Вот как определить, когда пользователь долистал до самого низа обычного контейнера:

```js
handleScroll(event) {
  const el = event.target
  // el.scrollTop — сколько пикселей прокручено сверху
  // el.clientHeight — видимая высота блока
  // el.scrollHeight — полная высота содержимого
  const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight
  if (isBottom) {
    // Пользователь дошел до конца
    console.log('Достигнут низ!')
  }
}
```

Для окна (window) используйте:

```js
mounted() {
  window.addEventListener('scroll', this.checkBottom)
},

methods: {
  checkBottom() {
    // window.pageYOffset — текущий скролл по вертикали
    // window.innerHeight — высота окна просмотра
    // document.documentElement.scrollHeight — полная высота страницы
    const scrollPos = window.pageYOffset + window.innerHeight
    const isPageBottom = scrollPos >= document.documentElement.scrollHeight
    if (isPageBottom) {
      console.log('Пользователь на самом низу страницы!')
    }
  }
}
```

---

## Тонкости оптимизации: throttle и debounce на scroll-события

Важно понимать, что событие scroll отрабатывает очень часто, вызывая обработчик десятки раз в секунду. Во избежание лагов рекомендуется ограничивать частоту выполнения тяжелых вычислений с помощью "throttle" или "debounce".

### Throttle для scroll (пример с lodash):

```js
import throttle from 'lodash/throttle'

export default {
  methods: {
    handleScroll: throttle(function() {
      // Этот код будет вызван не чаще 1 раза в 100ms
      console.log(window.scrollY)
    }, 100)
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
  }
}
```

Вы легко можете подключить throttle из lodash или реализовать свой, если не хотите добавлять зависимости.

---

## Сохранение и восстановление позиции прокрутки

Это важно, если пользователь возвращается на предыдущую страницу или вы реализуете какую-либо кастомную логику восстановления интерфейса. Делается все очень просто:

```js
data() {
  return { scrollPos: 0 }
},
methods: {
  saveScroll() {
    this.scrollPos = window.scrollY
  },
  restoreScroll() {
    window.scrollTo(0, this.scrollPos)
  }
},
mounted() {
  window.addEventListener('scroll', this.saveScroll)
  // Когда захотите восстановить — вызовите this.restoreScroll()
},
beforeDestroy() {
  window.removeEventListener('scroll', this.saveScroll)
}
```

---

## Работа со скроллингом в Nuxt и SSR

Если вы разрабатываете на Nuxt (или с SSR в принципе), помните, что к `window`, `document` и в целом к DOM нельзя обращаться до того, как компонент будет смонтирован на клиенте. Всю работу с подписками на scroll и управлением прокруткой нужно делать внутри mounted.

```js
mounted() {
  if (process.client) {
    window.addEventListener('scroll', this.handleScroll)
  }
}
```

---

## Заключение

Работа со скроллингом во Vue охватывает множество сценариев: от простого отслеживания положения пользователя до сложных анимаций и реализации суперлегких списков. Вы изучили базовые техники и инструменты для отслеживания прокрутки, реакции на события scroll, программной прокрутки как страницы, так и отдельных блоков, а также плавной анимации при появлении элементов. Вы теперь умеете реализовывать популярные UX-паттерны типа "кнопка наверх", infinite scroll, восстановление позиции скролла и многое другое. Главное — использовать throttle/debounce для производительности и учитывать момент с SSR в Nuxt-приложениях.

---

## Частозадаваемые технические вопросы

### Как реактивно отслеживать scrollTop определенного элемента внутри Vue?

Используйте ref и событие scroll:

```html
<div ref="scroller" @scroll="trackScroll"></div>
```
```js
methods: {
  trackScroll() {
    this.currentScrollY = this.$refs.scroller.scrollTop
  }
}
```

### Как программно прокрутить контейнер до конца?

```js
const el = this.$refs.container
el.scrollTop = el.scrollHeight // Прокручиваем к низу
```

### Как отключить прокрутку body (например, при открытии модального окна) во Vue?

```js
mounted() {
  document.body.style.overflow = 'hidden' // Отключаем скролл
},
beforeDestroy() {
  document.body.style.overflow = '' // Восстанавливаем скролл обратно
}
```

### Почему scrollIntoView иногда не работает как ожидается?

Проверьте, что элемент существует в DOM (например, после v-if/v-for), корректно вызывайте scrollIntoView внутри nextTick:

```js
this.$nextTick(() => {
  this.$refs.target?.scrollIntoView({ behavior: 'smooth' })
})
```

### Как сделать плавную прокрутку в Safari?

Safari поддерживает scroll-behavior: smooth только в последних версиях. Для кроссбраузерного плавного скролла используйте polyfill, например, [smoothscroll-polyfill](https://github.com/iamdustan/smoothscroll).

```js
import smoothscroll from 'smoothscroll-polyfill'
smoothscroll.polyfill()
```
Теперь scrollTo/scrollIntoView с behavior: 'smooth' будут работать одинаково везде.