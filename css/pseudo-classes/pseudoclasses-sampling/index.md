---
metaTitle: Псевдокласс :root
metaDescription: Псевдокласс :root используется для выбора корневого элемента, которым обычно является элемент html | База знаний PurpleSchool
author: Алексей Овсянников
title: Псевдокласс :root
preview: Псевдокласс :root используется для выбора корневого элемента, которым обычно является элемент html

---

## **Псевдлакласс :root**

Псевдокласс :root используется для выбора корневого элемента, которым обычно является элемент `<html>`. Root полезен для задания глобальных стилей, которые применяются ко всем элементам документа.

```css
:root {
	--primary-color: #007bff;
}

button {
	background-color: var(--primary-color);
	color: white;
}
```

В примере :root используется для хранения переменной **--primary-color**. Используя переменную для стилизации сайта в нескольких местах, мы в дальнешим экономим время на управления стилями: изменив цвет в одном месте, мы поменяем все элементы где использовалась переменная.

## **Псевдлаклассы :first-child и :last-child**

Используются для применения стилей к первому и последнему дочернему элементу родительского элемента.

В примере ниже **:first-child** стилизует жирность текста первого элемента списка, а **:last-child** выделяет последний элемент списка светло зеленым цветом.

```css
ul li:first-child {
	font-weight: bold;
}

ul li:last-child {
	color: forestgreen;
}
```

Понимание псевдокласса `:root` предполагает знание структуры HTML-документа и его корневого элемента. Эффективное использование `:root` часто связано с применением CSS-переменных, что позволяет создавать гибкие и масштабируемые стили. Если вы хотите детальнее изучить HTML и CSS, в том числе работу с CSS-переменными, приходите на наш большой курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass--root). На курсе 212 уроков и 19 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## **Псевдлаклассы :only-child и :only-of-type**

Используются для выборы любого дочернего элемента, который является **единственным дочерним** элементом в родительском элементе. Главное слово тут - _едиственным_.

Допустим у нас есть несколько секций, вложенные друг в дружку:

```html
<section>
	<p>Я едиственный параграф в секции, значит - стану красным</p>

	<section>
		<span></span>

		<p>Я едиственный параграф в секции, значит - стану красным</p>

		<section>
			<p>Красный - не наш цвет</p>
			<p>Красный - не наш цвет</p>
		</section>
	</section>
</section>
```

Применим к секциям следющий стиль.

```css
section > p:only-of-type {
	background-color: red;
}
```

Стиль перекрасит все параграфы, которые являются единственным параграфом этой секции.

## **Псевдлаклассы :nth-child и nth-of-type**

Используются для выборки дочерних элементов, которые соответствуют формуле, основаной на их положении в родительском элементе,. Число n в круглых скобках - это формула, используемая для определения того, какие дочерние элементы будут выбраны.

В качестве примера рассмотрим верстку календаря:
<img src="https://cdn-bucket.hb.bizmrg.com/purple-images/knowladge-base/calendar.png" />

Структуру календаря представим в виде 35 дивов, которые будут находиться внутри grid контейнера. Верстку и стили можете найти ниже.

```html
<div class="calendar">
	<span class="day-name">Пн</span>
	<span class="day-name">Вт</span>
	<span class="day-name">Ср</span>
	<span class="day-name">Чт</span>
	<span class="day-name">Пт</span>
	<span class="day-name">Сб</span>
	<span class="day-name">Вс</span>
	<div class="day disabled">26</div>
	<div class="day disabled">27</div>
	<div class="day disabled">28</div>
	<div class="day">1</div>

	<!-- добавляем ячейки с 2 по 29  -->

	<div class="day">31</div>
	<div class="day disabled">1</div>
</div>
```

```css
.calendar {
	display: grid;
	width: 100%;
	grid-template-columns: repeat(7, minmax(100px, 1fr));
	grid-template-rows: 50px;
	grid-auto-rows: 120px;
	overflow: auto;
}

.day-name {
	font-size: 12px;
	color: #99a1a7;
	text-align: center;
	border-bottom: 1px solid rgba(166, 168, 179, 0.12);
	line-height: 50px;
	font-weight: 500;
}

.day {
	border-bottom: 1px solid rgba(166, 168, 179, 0.12);
	border-right: 1px solid rgba(166, 168, 179, 0.12);
	text-align: right;
	padding: 14px 20px;
	letter-spacing: 1px;
	font-size: 12px;
	color: #98a0a6;
}

.disabled {
	color: rgba(152, 160, 166, 0.6);
	background-color: #fff;
	background-image: url('data:image/svg+xml,....');
}
```

Пока что наши ячейки календаря не знают в какую ряд и в какую колонку им нужно встать, что образовался календарь.

Расставить ячейки по местам нам помогут псевдоклассы :nth-of-type и :nth-child.

```css
.day:nth-of-type(n + 1):nth-of-type(-n + 7) {
	grid-row: 2;
}
.day:nth-of-type(n + 8):nth-of-type(-n + 14) {
	grid-row: 3;
}
.day:nth-of-type(n + 15):nth-of-type(-n + 21) {
	grid-row: 4;
}
.day:nth-of-type(n + 22):nth-of-type(-n + 28) {
	grid-row: 5;
}
.day:nth-of-type(n + 29):nth-of-type(-n + 35) {
	grid-row: 6;
}

.day:nth-child(7n + 1) {
	grid-column: 1 / 1;
}
.day:nth-child(7n + 2) {
	grid-column: 2 / 2;
}
.day:nth-child(7n + 3) {
	grid-column: 3 / 3;
}
.day:nth-child(7n + 4) {
	grid-column: 4 / 4;
}
.day:nth-child(7n + 5) {
	grid-column: 5 / 5;
}
.day:nth-child(7n + 6) {
	grid-column: 6 / 6;
}
.day:nth-child(7n + 7) {
	grid-column: 7 / 7;
}
```

Тут есть две смысловых группы селекторов.

1. Первая группа: с .day:nth-of-type(n + 1):nth-of-type(-n + 7) по .day:nth-of-type(n + 29):nth-of-type(-n + 35) — создает ряды сетки со 2 по 6.

2. Вторая группа: с .day:nth-child(7n + 1) по .day:nth-child(7n + 7) —располагает ячейки по колонкам.

## **Псевдлакласс :empty**

Используется для выборки элементов, у которых нет дочерних элементов. Это может быть полезно для применения стиля к пустым элементам.

Допустим у нас есть div, который должен показывать индикатор загрузки до тех пор, пока содержимое не будет загружено динамически.

```css
div:empty {
	background-image: url(loading.gif);
	background-repeat: no-repeat;
	background-position: center center;
}
```

В примере :empty выбирает div, в котором нет содержимого, и применяет к нему фонового изображение. Данный пример основывается на условие, что у нас на странице только один div, в котором нет других элементов.

Использование псевдокласса `:root` является важным шагом к созданию гибких и поддерживаемых CSS-стилей. Чтобы овладеть этим и другими приемами современной веб-разработки, рекомендуем наш курс [HTML и CSS](https://purpleschool.ru/course/html-css?utm_source=knowledgebase&utm_medium=text&utm_campaign=Psevdoklass--root). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир HTML и CSS прямо сегодня.
