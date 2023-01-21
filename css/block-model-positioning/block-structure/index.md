---
metaTitle: Блочная Модель CSS - понимание и использование.
metaDescription: Узнайте, что такое блочная модель CSS, как она работает и как использовать для создания визуально привлекательного дизайна веб-сайтов. | База знаний PurpleSchool
author: Алексей Овсянников
title: Структура блочной модели. Свойства Padding и Margin.
preview: Блочная модель CSS одна из фундаментальных концепций веб-дизайна. Понимание того, как она работает, необходимо для создания любых веб-сайтов.
---

Блочная модель CSS одна из фундаментальных концепций веб-дизайна. Понимание того, как она работает, необходимо для создания любых веб-сайтов.

## **Структура блочной модели**

Блочная модель состоит из четырех частей: 

- Содержимое ( **content** ) — область, в которой отображается фактическое содержимое элемента (например, текст, изображения).

- Внутренний отступ ( **padding** ) — пространство между содержимым и границей.

- Рамка( **border** ) —  линия, которая окружает содержимое и отступы.

- Внешний отступ ( **margin** ) —  пространство между границей и соседними элементами.


![[box-model.jpg]]

По умолчанию для блочной модели свойство **box-sizing** установлено в значение **«content-box»**, что означает, что размер элемента определяется размером его содержимого. Изменив значение на **«border-box»**, мы изменяем алгоритм расчета таким образом, чтобы он включал отступы и границы в общий размер блочного элемента.

## **Cвойство Padding**

Свойство padding в CSS отвечает за установку пространства между содержимым элемента и его границей. 

### **Синтаксис**

Свойство padding можно применить как сразу ко всем  четырем направлением (сверху, справа, снизу, слева), так задать свое значения для каждого направления по отдельности. 

- Если существует только одно значение, оно применяется ко всем сторонам. Например, такая запись создаст отступ в 10px внутри блока по всем сторонам. 

```css
.element {
	padding: 10px;
}
```

- Если два указать два значения, 

```css
.element {
	padding: 10px 8px;
}
``` 

то отступ в 10px будет создан для сверху и снизу, а отступ в 8px применяться для правой и левой границы.

- Если имеется три значения, 

```css
.element {
	padding: 10px 8px 12px;
}
``` 

, то 10px применяться к верхней границе, 8px - к левой и правой границе, а 12px к нижней границе.

- Если есть четыре значения

```css
.element {
	padding: 10px 8px 12px 6px;
}
```

, то значения будут применены в порядке: верх, справа, снизу, слева.

- Так же можно установить значение каждого направления отдельно:

```css
.element {
	padding-top: 10px;
	padding-right: 8px;
	padding-bottom: 12px;
	padding-left: 6px;
}
```


## **Cвойство Margin**

Свойство margin в CSS отвечает за установку пространства между элементом и соседними элементами. 

### **Синтаксис**

Подобно свойству padding внешний отступ можно установить как для всех направлений сразу указав только одно значения: 

```css
.element {
	margin: 10px;
}
```

- через указывание двух, трех или четырех значений можно определить разные значения для каждой из сторон элемента. 

```css

.element-1 {
	margin: 10px 8px;
} /* верхний и нижний внешние отступы будут равны 10px, а правый и левый — 8px */


.element-2 {
	margin: 10px 8px 12px;
} /* верхний внешний отступ будет равен 10px, левый и правый — 8px, а нижний — 12px */


.element-3 {
	margin: 10px 8px 12px 6px;
} /* значения применять в порядке - сверху, справа, снизу, слева */


.element-4 {
	margin-top: 10px;
	margin-right: 8px;
	margin-bottom: 12px;
	margin-left: 6px;
} /* отдельная запись для каждого направления*/

``` 


## **Схлопывания полей (Margin Collapsing)**


Смежные элементы с вертикальными отступами объединяют расстояния своих полей в большее из двух значений. Рассмотрим это на следующим примере:

```html
<div class="elem elem-1">
    Element 1
</div>
<div class="elem elem-2">
    Element 2
</div>
```
```css
.elem {
	height: 50px;
	width: 50px;
}

.elem-1 {
	margin-bottom: 45px;
}

.elem-2 {
	margin-top: 55px;
}
```

Без схлопывания полей расстояние между двумя элементами div было бы 100px. Однако из-за схлопывания полей расстояние между двумя элементами будет равно **55px**. 

- Упомянем так же случаи когда схлопывания полей не происходит:
	- когда один из элементов имеет абсолютно позиционированных;
	- когда для одного из элементов явно установлено свойство float;
	- когда один из элементов имеет margin;
	- когда для одного из элементов свойство **display** имеет значение  **inline-block**;


Стоит отметить, что, хотя схлопывание полей является поведением по умолчанию, его можно избежать. Например, изменив свойства **display** в значение **inline-block**.