# Дизайн: Полная адаптация приложения под мобильные устройства

## Обзор

Приложение BLACK ONYX уже имеет частичную мобильную адаптацию (bottom-nav, базовые медиа-запросы). Задача — устранить оставшиеся проблемы и довести адаптацию до полного соответствия требованиям.

## Текущее состояние

Уже реализовано:
- `bottom-nav` в `layout.css` и `index.html`
- Базовые медиа-запросы в `layout.css` (max-width: 767px)
- Адаптивная сетка товаров в `cards.css`
- Мобильные фильтры (drawer) в `catalog.css`
- Адаптация `login.html`
- Адаптация таблиц заказов в `orders.css`

Требует доработки:
- Профиль (`.profile-modern`) — нет мобильной адаптации боковой панели
- Таблицы в админке — нет карточного вида на мобильных
- Модальные окна — не оптимизированы для мобильных
- Страница товара — нет фиксированной кнопки "В корзину"
- Корзина — итоговая сумма не фиксирована на мобильных
- Формы — поля ввода меньше 44px
- Кнопки — некоторые меньше 44px

## Брейкпоинты

```
xs: max-width: 479px   — маленькие телефоны
sm: max-width: 767px   — телефоны
md: max-width: 1023px  — планшеты
lg: min-width: 1024px  — десктоп
```

## Архитектура изменений

### 1. Новый файл: `wwwroot/css/mobile.css`

Централизованный файл для всех мобильных исправлений. Подключается последним в `index.html`.

Содержит:
- Исправления профиля
- Исправления модальных окон
- Исправления форм
- Исправления кнопок
- Исправления страницы товара
- Исправления корзины
- Исправления таблиц в админке

### 2. Изменения в `wwwroot/css/layout.css`

Дополнительные медиа-запросы для header на xs-экранах.

### 3. Изменения в `wwwroot/css/components/modals.css`

Адаптация модальных окон для мобильных (bottom sheet стиль).

### 4. Изменения в `wwwroot/css/components/forms.css`

Минимальная высота полей ввода 48px на мобильных.

### 5. Изменения в `wwwroot/css/components/buttons.css`

Минимальный размер кнопок 44px на мобильных.

## Детальный дизайн

### Профиль (`.profile-modern`)

На мобильных (max-width: 767px):
```css
.profile-modern {
    grid-template-columns: 1fr; /* одна колонка */
}

.profile-sidebar {
    position: static;
    /* горизонтальная навигация вместо вертикальной */
}

.profile-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
}

.profile-nav-item {
    white-space: nowrap;
    flex-shrink: 0;
}
```

### Модальные окна

На мобильных (max-width: 767px):
```css
.modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 20px 20px 0 0;
    max-height: 90vh;
    overflow-y: auto;
    margin: 0;
    width: 100%;
}

.modal-overlay {
    align-items: flex-end;
}
```

### Страница товара

Фиксированная кнопка "В корзину" на мобильных:
```css
@media (max-width: 767px) {
    .product-detail-actions {
        position: fixed;
        bottom: 64px; /* над bottom-nav */
        left: 0;
        right: 0;
        padding: 12px 16px;
        background: white;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
        z-index: 100;
    }
}
```

### Таблицы в админке

Карточный вид на мобильных через CSS + JS:
```css
@media (max-width: 767px) {
    .admin-table-container .data-table {
        display: none;
    }
    
    .admin-cards-mobile {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
}
```

### Формы

```css
@media (max-width: 767px) {
    .form-input,
    .form-select,
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="number"],
    select,
    textarea {
        min-height: 48px;
        font-size: 16px; /* предотвращает zoom на iOS */
    }
}
```

### Кнопки

```css
@media (max-width: 767px) {
    .btn {
        min-height: 44px;
        padding: 10px 16px;
    }
    
    .btn-sm {
        min-height: 36px;
    }
}
```

### Корзина

Фиксированный итог на мобильных:
```css
@media (max-width: 767px) {
    .cart-summary-sidebar {
        position: fixed;
        bottom: 64px;
        left: 0;
        right: 0;
        z-index: 100;
        padding: 0;
    }
    
    .cart-items-section {
        padding-bottom: 200px;
    }
}
```

## Файлы для изменения

| Файл | Тип изменения |
|------|---------------|
| `wwwroot/css/mobile.css` | Создать новый |
| `wwwroot/index.html` | Добавить `<link>` для mobile.css |
| `wwwroot/css/components/modals.css` | Добавить мобильные стили |
| `wwwroot/css/components/forms.css` | Добавить min-height для полей |
| `wwwroot/css/components/buttons.css` | Добавить min-height для кнопок |
| `wwwroot/css/layout.css` | Дополнить медиа-запросы |

## Корректность

### Свойства корректности

1. На экране 375px все элементы должны помещаться без горизонтального скролла
2. Все интерактивные элементы должны иметь размер не менее 44px
3. Поля ввода не должны вызывать zoom на iOS (font-size >= 16px)
4. Bottom-nav должен быть виден на всех мобильных страницах
5. Модальные окна не должны выходить за пределы экрана
