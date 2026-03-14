---
metaTitle: Gatsby — генератор статических сайтов на React с GraphQL data layer
metaDescription: Полное руководство по Gatsby: что это такое, как работает GraphQL data layer, система плагинов, когда использовать Gatsby вместо Next.js, примеры создания сайта
author: Олег Марков
title: Gatsby - генератор статических сайтов
preview: Разбираемся с Gatsby: архитектура SSG-фреймворка на React, GraphQL слой данных, плагины для источников и трансформеров, сравнение с Next.js и практические примеры
---

## Введение

Если вы разрабатываете маркетинговый сайт, блог, документацию или портфолио и вам важны молниеносная скорость загрузки, хорошее SEO и простота деплоя — Gatsby является одним из первых инструментов, о которых стоит подумать.

Gatsby — это статический генератор сайтов (Static Site Generator, SSG) на базе React. В отличие от традиционных CMS или серверных фреймворков, Gatsby генерирует весь HTML **во время сборки** (build time), а не при каждом запросе пользователя. В результате получается набор статических файлов, которые можно разместить на любом CDN.

В этой статье вы узнаете:
- Что такое Gatsby и в чём его архитектурные преимущества
- Как работает GraphQL data layer и зачем он нужен
- Как устроена система плагинов (source plugins, transformer plugins)
- Когда выбирать Gatsby, а когда — Next.js
- Как создать свой первый сайт на Gatsby

## Что такое Gatsby

Gatsby — это опенсорсный фреймворк для генерации статических сайтов, основанный на React. Проект был создан Кайлом Мэтьюсом в 2015 году, активно развивался с 2017 года, а в 2021 году компания Gatsby Inc. была приобретена Netlify.

### Архитектура Gatsby: Build Time vs Runtime

Ключевая идея Gatsby — **перенести максимум работы со времени запроса (runtime) на время сборки (build time)**:

```
Традиционный подход (SSR):
Запрос пользователя → сервер запрашивает БД → генерирует HTML → отправляет пользователю

Подход Gatsby (SSG):
Сборка: Gatsby запрашивает все данные → генерирует HTML для каждой страницы
Запрос пользователя → CDN отдаёт готовый HTML (мгновенно)
```

Когда пользователь открывает страницу на сайте, сделанном на Gatsby:
1. Браузер получает готовый HTML с сервера (CDN)
2. React «гидрирует» страницу — навешивает обработчики событий
3. Дальнейшая навигация происходит как в SPA (без перезагрузки страницы)

Этот подход называется **JAMstack** (JavaScript, APIs, Markup).

### Ключевые возможности Gatsby

- **React-компоненты** — весь UI пишется на React
- **GraphQL data layer** — единый слой для получения данных из любых источников
- **Богатая экосистема плагинов** — более 3000 плагинов для интеграций
- **Автоматическая оптимизация изображений** — gatsby-plugin-image
- **Предзагрузка ссылок** — страницы предзагружаются при наведении курсора
- **Поддержка TypeScript** из коробки
- **Встроенные инструменты** — babel, webpack, postcss

## GraphQL Data Layer

Одна из самых уникальных и мощных особенностей Gatsby — это встроенный GraphQL слой данных. Понимание того, как он работает, критически важно для эффективного использования Gatsby.

### Зачем нужен GraphQL в Gatsby

В типичном проекте данные приходят из разных мест: файлы Markdown, CMS (WordPress, Contentful), базы данных, REST API. Gatsby решает проблему разнородных источников данных, создавая **единый унифицированный граф данных** на GraphQL.

Во время сборки Gatsby:
1. Запускает все source plugins, которые загружают данные в граф
2. Transformer plugins преобразуют эти данные (например, Markdown → HTML)
3. Вы делаете GraphQL-запросы прямо в компонентах для получения нужных данных

### GraphQL Playground

Во время разработки Gatsby автоматически запускает GraphQL Playground по адресу `http://localhost:8000/___graphql`. Здесь вы можете исследовать все доступные данные и тестировать запросы в реальном времени.

### Page Queries (запросы на уровне страниц)

Page Query — это GraphQL-запрос, который можно определить только в компоненте страницы (не в обычных компонентах). Результат запроса передаётся в компонент через пропс `data`:

```javascript
// src/pages/blog.js
import React from "react"
import { graphql } from "gatsby"
import { Link } from "gatsby"

const BlogPage = ({ data }) => {
  return (
    <div>
      <h1>Блог</h1>
      <ul>
        {data.allMarkdownRemark.nodes.map(post => (
          <li key={post.id}>
            <Link to={post.fields.slug}>
              <h2>{post.frontmatter.title}</h2>
              <p>{post.frontmatter.date}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const query = graphql`
  query BlogPageQuery {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "DD MMMM YYYY", locale: "ru")
          description
        }
        fields {
          slug
        }
      }
    }
  }
`

export default BlogPage
```

### Static Queries (статические запросы)

Static Query — это запрос, который можно использовать в **любом компоненте**, включая обычные (не страницы). Для этого используется хук `useStaticQuery`:

```javascript
// src/components/header.js
import React from "react"
import { useStaticQuery, graphql } from "gatsby"

const Header = () => {
  const data = useStaticQuery(graphql`
    query SiteMetadataQuery {
      site {
        siteMetadata {
          title
          description
          author
        }
      }
    }
  `)

  return (
    <header>
      <h1>{data.site.siteMetadata.title}</h1>
      <p>{data.site.siteMetadata.description}</p>
    </header>
  )
}

export default Header
```

Главное отличие Static Query от Page Query:
- Static Query **не может** принимать переменные
- Static Query можно использовать в любом компоненте
- Page Query выполняется быстрее (один раз на страницу), Static Query может быть у нескольких компонентов

### Programmatic Page Creation (программное создание страниц)

Gatsby позволяет программно создавать страницы на основе данных в файле `gatsby-node.js`:

```javascript
// gatsby-node.js
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  // Получаем все посты блога
  const result = await graphql(`
    query {
      allMarkdownRemark {
        nodes {
          id
          fields {
            slug
          }
        }
      }
    }
  `)

  // Создаём отдельную страницу для каждого поста
  result.data.allMarkdownRemark.nodes.forEach(node => {
    createPage({
      path: node.fields.slug,
      component: require.resolve("./src/templates/blog-post.js"),
      context: {
        id: node.id,
      },
    })
  })
}
```

## Система плагинов

Мощь Gatsby во многом определяется его богатой экосистемой плагинов. Все плагины делятся на три категории.

### Source Plugins (источники данных)

Source plugins загружают данные в граф данных Gatsby из внешних источников:

| Плагин | Источник данных |
|--------|----------------|
| `gatsby-source-filesystem` | Файловая система (изображения, Markdown, JSON) |
| `gatsby-source-contentful` | Contentful CMS |
| `gatsby-source-wordpress` | WordPress REST API |
| `gatsby-source-strapi` | Strapi CMS |
| `gatsby-source-shopify` | Shopify |
| `gatsby-source-github` | GitHub API |
| `gatsby-source-mongodb` | MongoDB |

Пример использования `gatsby-source-filesystem`:

```javascript
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
  ],
}
```

После настройки этого плагина файлы из указанных директорий станут доступны в GraphQL как `allFile` и `file`.

### Transformer Plugins (трансформеры)

Transformer plugins преобразуют данные из одного формата в другой:

| Плагин | Трансформация |
|--------|--------------|
| `gatsby-transformer-remark` | Markdown → HTML + frontmatter |
| `gatsby-transformer-sharp` | Изображения → оптимизированные форматы |
| `gatsby-transformer-json` | JSON файлы → GraphQL nodes |
| `gatsby-transformer-yaml` | YAML файлы → GraphQL nodes |
| `gatsby-transformer-csv` | CSV файлы → GraphQL nodes |
| `gatsby-plugin-mdx` | MDX (Markdown + JSX) → компоненты |

Пример: после установки `gatsby-transformer-remark` файлы Markdown становятся доступны как `allMarkdownRemark` в GraphQL с полным HTML-содержимым и frontmatter данными.

### Функциональные плагины

Третий тип — плагины, добавляющие функциональность в сборку или рантайм:

```javascript
// gatsby-config.js
module.exports = {
  siteMetadata: {
    title: `Мой сайт на Gatsby`,
    description: `Описание сайта`,
    siteUrl: `https://example.com`,
  },
  plugins: [
    // SEO мета-теги
    `gatsby-plugin-react-helmet`,

    // Оптимизация изображений
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,

    // TypeScript поддержка
    `gatsby-plugin-typescript`,

    // CSS Modules
    `gatsby-plugin-postcss`,

    // Генерация sitemap.xml
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        output: `/sitemap`,
      },
    },

    // Генерация robots.txt
    {
      resolve: `gatsby-plugin-robots-txt`,
      options: {
        host: `https://example.com`,
        sitemap: `https://example.com/sitemap/sitemap-index.xml`,
        policy: [{ userAgent: `*`, allow: `/` }],
      },
    },

    // Google Analytics
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: [`G-XXXXXXXXXX`],
      },
    },

    // Оффлайн поддержка (PWA)
    `gatsby-plugin-offline`,
  ],
}
```

### gatsby-config.js

Центральный конфигурационный файл Gatsby — `gatsby-config.js` (или `gatsby-config.ts`). Здесь указываются метаданные сайта и все плагины:

```javascript
// gatsby-config.js
module.exports = {
  siteMetadata: {
    title: `Мой блог`,
    description: `Блог о веб-разработке`,
    author: `@username`,
    siteUrl: `https://myblog.com`,
  },
  plugins: [
    // ... список плагинов
  ],
}
```

Данные из `siteMetadata` доступны через GraphQL:

```graphql
query {
  site {
    siteMetadata {
      title
      description
      author
    }
  }
}
```

## Оптимизация изображений

Gatsby имеет первоклассную поддержку оптимизации изображений через `gatsby-plugin-image`.

### GatsbyImage (для динамических изображений)

```javascript
import React from "react"
import { graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"

const BlogPost = ({ data }) => {
  const image = getImage(data.markdownRemark.frontmatter.featuredImage)

  return (
    <article>
      <h1>{data.markdownRemark.frontmatter.title}</h1>
      <GatsbyImage
        image={image}
        alt={data.markdownRemark.frontmatter.imageAlt}
      />
      <div
        dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }}
      />
    </article>
  )
}

export const query = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      frontmatter {
        title
        imageAlt
        featuredImage {
          childImageSharp {
            gatsbyImageData(
              width: 800
              placeholder: BLURRED
              formats: [AUTO, WEBP, AVIF]
            )
          }
        }
      }
      html
    }
  }
`

export default BlogPost
```

### StaticImage (для статических изображений)

Для изображений, которые не меняются в зависимости от данных:

```javascript
import React from "react"
import { StaticImage } from "gatsby-plugin-image"

const Logo = () => (
  <StaticImage
    src="../images/logo.png"
    alt="Логотип компании"
    width={200}
    height={60}
    placeholder="blurred"
    formats={["auto", "webp", "avif"]}
  />
)

export default Logo
```

`gatsby-plugin-image` автоматически:
- Создаёт несколько размеров изображения (responsive)
- Конвертирует в современные форматы (WebP, AVIF)
- Добавляет lazy loading
- Показывает placeholder во время загрузки

## Gatsby vs Next.js: сравнение

Gatsby и Next.js — это два наиболее популярных React-фреймворка, и вопрос выбора между ними часто ставит разработчиков в тупик. Давайте разберёмся.

### Сравнительная таблица

| Характеристика | Gatsby | Next.js |
|---------------|--------|---------|
| **Основной подход** | SSG (Static Site Generation) | Гибридный (SSG + SSR + ISR) |
| **Data fetching** | GraphQL во время сборки | `getStaticProps`, `getServerSideProps`, React Server Components |
| **Серверный рендеринг** | Ограниченный (SSR Functions) | Полноценный SSR |
| **Dynamic routes** | Через `gatsby-node.js` | Файловые маршруты `[slug].js` |
| **API Routes** | Gatsby Functions (ограниченно) | Полноценные API Routes |
| **Скорость сборки** | Медленнее на больших сайтах | Быстрее на больших сайтах |
| **Экосистема плагинов** | Богатая (3000+) | Меньше, но растёт |
| **Кривая обучения** | Steep (GraphQL) | Умеренная |
| **Инкрементальная сборка** | Поддерживается (Gatsby Cloud) | ISR из коробки |
| **Hosting** | Любой статический хостинг | Лучше всего на Vercel |
| **Размытие контента** | ❌ Не поддерживается | ✅ Edge Runtime |
| **React Server Components** | ❌ Не поддерживаются | ✅ Полная поддержка |

### Когда выбрать Gatsby

Gatsby — отличный выбор, когда:

1. **Контент редко меняется** — блоги, документация, маркетинговые сайты, портфолио
2. **SEO критично** — статический HTML обеспечивает лучшую индексацию
3. **Данные приходят из CMS** — богатая экосистема source plugins для Contentful, WordPress, Strapi
4. **Нужна максимальная скорость** — статические файлы на CDN = минимальный TTFB
5. **Команда знает GraphQL** — или готова его изучить
6. **Нет сложной серверной логики** — сайт преимущественно для чтения

**Примеры подходящих проектов:**
- Корпоративный сайт с контентом из CMS
- Технический блог с постами в Markdown
- Документация продукта
- Лендинг страница
- Сайт-портфолио

### Когда выбрать Next.js

Next.js лучше подходит, когда:

1. **Контент меняется часто** — новостные сайты, магазины с обновляющимися ценами
2. **Нужен SSR** — персонализированный контент, авторизация на уровне страниц
3. **Требуются API Routes** — полноценный backend на том же проекте
4. **Большой сайт** — тысячи страниц, где медленная сборка Gatsby будет проблемой
5. **Нужен ISR** — страницы обновляются на фоне без полной пересборки
6. **React Server Components** — для максимальной производительности

**Примеры подходящих проектов:**
- Интернет-магазин
- Новостной портал
- Социальная сеть
- Dashboard с реальными данными
- SaaS приложение

## Начало работы с Gatsby

### Установка и создание проекта

```bash
# Установка Gatsby CLI
npm install -g gatsby-cli

# Создание нового проекта из стартера
gatsby new my-gatsby-site https://github.com/gatsbyjs/gatsby-starter-blog

# Или с использованием npm init
npm init gatsby my-gatsby-site

# Запуск в режиме разработки
cd my-gatsby-site
gatsby develop
# Сайт доступен на http://localhost:8000
# GraphQL Playground на http://localhost:8000/___graphql
```

### Минимальная структура проекта

```
my-gatsby-site/
├── gatsby-config.js        # Конфигурация и плагины
├── gatsby-node.js          # Программное создание страниц
├── gatsby-browser.js       # Browser-specific код
├── gatsby-ssr.js           # SSR-specific код
├── src/
│   ├── pages/              # Страницы (автоматические маршруты)
│   │   ├── index.js        # Главная страница /
│   │   ├── about.js        # Страница /about/
│   │   └── 404.js          # Страница ошибки 404
│   ├── templates/          # Шаблоны для программных страниц
│   │   └── blog-post.js    # Шаблон поста блога
│   ├── components/         # Переиспользуемые компоненты
│   │   ├── layout.js
│   │   └── header.js
│   └── images/             # Статические изображения
├── content/                # Контент (Markdown, MDX)
│   └── blog/
│       ├── first-post/
│       │   └── index.md
│       └── second-post/
│           └── index.md
└── static/                 # Файлы, копируемые как есть в public/
    └── favicon.ico
```

### Простой пример: блог на Markdown

**1. Установите необходимые плагины:**

```bash
npm install gatsby-source-filesystem gatsby-transformer-remark gatsby-plugin-sharp gatsby-plugin-image gatsby-transformer-sharp
```

**2. Настройте gatsby-config.js:**

```javascript
// gatsby-config.js
module.exports = {
  siteMetadata: {
    title: `Мой блог`,
    siteUrl: `https://example.com`,
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`,
      },
    },
    `gatsby-transformer-remark`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
  ],
}
```

**3. Создайте Markdown-пост:**

```markdown
---
title: "Мой первый пост"
date: "2024-01-15"
description: "Это мой первый пост на Gatsby"
---

## Привет, мир!

Это мой первый пост на Gatsby. Здесь я буду рассказывать о веб-разработке.
```

**4. Добавьте создание страниц в gatsby-node.js:**

```javascript
// gatsby-node.js
const path = require("path")
const { createFilePath } = require("gatsby-source-filesystem")

// Создаём поле slug для каждого поста
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === "MarkdownRemark") {
    const slug = createFilePath({ node, getNode })
    createNodeField({
      node,
      name: "slug",
      value: slug,
    })
  }
}

// Создаём страницы для каждого поста
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const blogPost = path.resolve("./src/templates/blog-post.js")

  const result = await graphql(`
    query {
      allMarkdownRemark {
        nodes {
          id
          fields {
            slug
          }
        }
      }
    }
  `)

  result.data.allMarkdownRemark.nodes.forEach(node => {
    createPage({
      path: node.fields.slug,
      component: blogPost,
      context: { id: node.id },
    })
  })
}
```

**5. Создайте шаблон поста:**

```javascript
// src/templates/blog-post.js
import React from "react"
import { graphql } from "gatsby"

const BlogPost = ({ data }) => {
  const post = data.markdownRemark

  return (
    <article>
      <h1>{post.frontmatter.title}</h1>
      <time>{post.frontmatter.date}</time>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  )
}

export const query = graphql`
  query BlogPost($id: String!) {
    markdownRemark(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "DD MMMM YYYY", locale: "ru")
        description
      }
      html
    }
  }
`

export default BlogPost
```

### Сборка и деплой

```bash
# Собрать сайт
gatsby build

# Посмотреть результат локально
gatsby serve
# Сайт доступен на http://localhost:9000

# Папка public/ содержит готовый статический сайт
# Можно деплоить на любой статический хостинг:
# - Netlify, Vercel, GitHub Pages, Cloudflare Pages, AWS S3
```

## Gatsby v5: актуальные возможности

Gatsby версии 5 (выпущена в 2022 году) принесла несколько важных обновлений:

- **Partial Hydration** — с использованием React Server Components можно отмечать компоненты директивой `.client.js`, чтобы избежать лишней гидрации
- **Slice API** — кэшируемые фрагменты страниц для ускорения сборки (например, хедер и футер собираются один раз)
- **Head API** — управление тегами `<head>` без дополнительных плагинов:

```javascript
// src/pages/index.js
export const Head = () => (
  <>
    <title>Главная страница</title>
    <meta name="description" content="Описание сайта" />
  </>
)
```

## Ресурсы и ссылки

- **Официальная документация:** https://www.gatsbyjs.com/docs/
- **Стартеры Gatsby:** https://www.gatsbyjs.com/starters/
- **Плагины Gatsby:** https://www.gatsbyjs.com/plugins/
- **GraphQL Playground** — доступен на `localhost:8000/___graphql` во время разработки
- **Gatsby Cloud** — официальный хостинг с инкрементальными сборками
- **GitHub репозиторий:** https://github.com/gatsbyjs/gatsby
