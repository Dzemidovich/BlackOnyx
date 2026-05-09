# Sidebar Resize and Image Display Bugfix Design

## Overview

Этот документ описывает исправление 5 дефектов сайдбара в B2B платформе для продажи инструментов. Проблемы включают: белый фон изображений, слишком большой размер сайдбара, выдуманные описания товаров, несоответствие стилистике приложения и неправильный выбор товаров. Подход к исправлению основан на методологии bug condition: определяем условия проявления багов, ожидаемое поведение и требования к сохранению существующей функциональности.

## Glossary

- **Bug_Condition (C)**: Условие, при котором проявляется баг - когда сайдбар отображается на десктопной версии с неправильными стилями, размерами и данными
- **Property (P)**: Желаемое поведение - сайдбар должен отображаться с прозрачным фоном изображений, уменьшенными размерами (в 2 раза по высоте), реальными данными из БД и стилями, соответствующими дизайну приложения
- **Preservation**: Существующая функциональность навигации, раскрытия сайдбара при наведении и клика по баннеру должна остаться неизменной
- **`.sidebar-banner`**: Блок в нижней части сайдбара, отображающий рекламный баннер товара
- **`.sidebar-banner-image`**: Контейнер для изображения товара в баннере (текущая высота: 80px)
- **`.sidebar-banner-content`**: Контейнер для текстового содержимого баннера (название, описание)
- **`app.products`**: Массив товаров, загруженных из API в глобальном объекте приложения

## Bug Details

### Bug Condition

Баг проявляется когда сайдбар рендерится на десктопной версии (ширина экрана >= 768px). Блок `.sidebar-banner` отображается с несколькими дефектами одновременно: изображения имеют белый фон, размеры слишком большие, описание выдуманное, стили не соответствуют дизайну, и выбираются неподходящие товары.

**Formal Specification:**
```
FUNCTION isBugCondition(context)
  INPUT: context of type RenderContext { viewport, sidebarElement, productData }
  OUTPUT: boolean
  
  RETURN context.viewport.width >= 768
         AND context.sidebarElement.querySelector('.sidebar-banner') EXISTS
         AND (
           hasWhiteBackground(context.sidebarElement.querySelector('.sidebar-banner-image'))
           OR isOversized(context.sidebarElement.querySelector('.sidebar-banner'))
           OR hasFakeDescription(context.sidebarElement.querySelector('.sidebar-banner-content'))
           OR hasInconsistentStyles(context.sidebarElement.querySelector('.sidebar-banner'))
           OR isWrongProductSelected(context.productData)
         )
END FUNCTION
```

### Examples

- **Пример 1 (Белый фон)**: Когда изображение дрели Bosch отображается в `.sidebar-banner-image`, оно имеет белый квадратный фон вместо прозрачного, что выглядит неэстетично на цветном градиентном фоне баннера
- **Пример 2 (Большой размер)**: Блок `.sidebar-banner` имеет высоту изображения 80px, что слишком велико для компактного сайдбара. Ожидается высота ~40px (уменьшение в 2 раза)
- **Пример 3 (Выдуманное описание)**: В `.sidebar-banner-subtitle` отображается текст "Профессиональный инструмент для мастеров" вместо реального названия товара из поля `Products.name` в БД
- **Пример 4 (Несоответствие стилей)**: Цвета, отступы и шрифты баннера не соответствуют CSS переменным приложения (например, используется жестко заданный цвет вместо `var(--primary)`)
- **Пример 5 (Неправильный товар)**: В баннере отображается мелкий товар (например, отвертка) вместо крупного инструмента (дрель, компрессор) из категорий "Электроинструмент" или "Компрессоры"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Наведение курсора на сайдбар должно продолжать расширять его и показывать текст навигационных элементов
- Клик на элемент навигации должен продолжать переходить на соответствующую страницу
- Отображение пунктов меню для разных ролей (Admin, Manager, Customer) должно оставаться неизменным
- Клик на баннер товара должен продолжать открывать детальную страницу товара
- На мобильных устройствах (ширина < 768px) десктопный сайдбар должен продолжать скрываться
- Логотип и навигационные элементы должны работать корректно без изменений

**Scope:**
Все взаимодействия с сайдбаром, не связанные с блоком `.sidebar-banner`, должны быть полностью не затронуты этим исправлением. Это включает:
- Навигацию по пунктам меню
- Раскрытие/сворачивание сайдбара
- Отображение бейджей уведомлений
- Кнопку выхода из системы

## Hypothesized Root Cause

На основе анализа кода, наиболее вероятные причины:

1. **Белый фон изображений**: CSS свойство `background: white` в `.sidebar-banner-image` создает белый фон. Решение: использовать `background: transparent` или удалить свойство background полностью

2. **Слишком большой размер**: Жестко заданная высота `height: 80px` в `.sidebar-banner-image` делает баннер слишком большим. Решение: уменьшить до `height: 40px` (в 2 раза)

3. **Выдуманное описание**: JavaScript код, генерирующий HTML баннера, использует статический текст вместо данных из `product.name`. Решение: использовать реальные данные из объекта товара

4. **Несоответствие стилей**: Жестко заданные цвета и отступы вместо CSS переменных. Решение: заменить на `var(--primary)`, `var(--text-secondary)`, `var(--radius-md)` и т.д.

5. **Неправильный выбор товаров**: Логика выбора случайного товара не фильтрует по категориям. Решение: добавить фильтрацию `products.filter(p => p.categoryName === 'Электроинструмент' || p.categoryName === 'Компрессоры')`

## Correctness Properties

Property 1: Bug Condition - Sidebar Banner Display Correctness

_For any_ render context where the sidebar banner is displayed on desktop (viewport width >= 768px), the fixed rendering function SHALL display images with transparent background, reduced size (40px height), real product name from database, styles matching application design system, and products from "Электроинструмент" or "Компрессоры" categories.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Sidebar Navigation and Interaction

_For any_ user interaction with sidebar elements outside the `.sidebar-banner` block (navigation items, logo, logout button, hover expansion), the fixed code SHALL produce exactly the same behavior as the original code, preserving all navigation functionality, role-based menu display, and responsive behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `wwwroot/css/layout.css`

**Section**: `.sidebar-banner` styles (lines ~321-401)

**Specific Changes**:
1. **Remove White Background**: Изменить `.sidebar-banner-image` background
   - Было: `background: white !important;`
   - Стало: `background: transparent !important;` или удалить свойство

2. **Reduce Size**: Уменьшить высоту изображения в 2 раза
   - Было: `height: 80px !important;`
   - Стало: `height: 40px !important;`

3. **Adjust Padding**: Уменьшить padding для компактности
   - Было: `padding: 12px 8px;`
   - Стало: `padding: 6px 4px;`

4. **Use CSS Variables**: Заменить жестко заданные цвета на переменные
   - Заменить все цвета на `var(--primary)`, `var(--text-secondary)`, `var(--border)` и т.д.

**File**: JavaScript файл, генерирующий HTML баннера (предположительно `wwwroot/js/app.js` или модуль)

**Function**: Функция рендеринга sidebar banner (нужно найти)

**Specific Changes**:
1. **Use Real Product Data**: Заменить статический текст на данные из БД
   - Было: `<div class="sidebar-banner-subtitle">Профессиональный инструмент для мастеров</div>`
   - Стало: `<div class="sidebar-banner-subtitle">${product.name}</div>`

2. **Filter Products by Category**: Добавить фильтрацию товаров
   - Добавить: `const eligibleProducts = app.products.filter(p => p.categoryName === 'Электроинструмент' || p.categoryName === 'Компрессоры');`
   - Выбирать случайный товар из `eligibleProducts` вместо всех `app.products`

3. **Add Fallback**: Добавить проверку на пустой массив
   - Если `eligibleProducts.length === 0`, использовать любой товар или скрыть баннер

## Testing Strategy

### Validation Approach

Стратегия тестирования следует двухфазному подходу: сначала демонстрируем баги на неисправленном коде, затем проверяем, что исправление работает корректно и сохраняет существующее поведение.

### Exploratory Bug Condition Checking

**Goal**: Продемонстрировать баги ДО внесения исправлений. Подтвердить или опровергнуть анализ первопричин. Если опровергнем, потребуется пересмотр гипотез.

**Test Plan**: Написать тесты, которые проверяют отображение сайдбара на десктопной версии и фиксируют текущие дефекты. Запустить эти тесты на НЕИСПРАВЛЕННОМ коде для наблюдения ошибок и понимания первопричин.

**Test Cases**:
1. **White Background Test**: Проверить computed style `.sidebar-banner-image` - ожидается `background-color: rgb(255, 255, 255)` (провалится на неисправленном коде)
2. **Oversized Banner Test**: Проверить высоту `.sidebar-banner-image` - ожидается `80px` вместо `40px` (провалится на неисправленном коде)
3. **Fake Description Test**: Проверить текст `.sidebar-banner-subtitle` - ожидается статический текст вместо реального названия товара (провалится на неисправленном коде)
4. **Style Inconsistency Test**: Проверить использование CSS переменных - ожидаются жестко заданные цвета (провалится на неисправленном коде)
5. **Wrong Product Test**: Проверить категорию отображаемого товара - может быть товар не из "Электроинструмент" или "Компрессоры" (может провалиться на неисправленном коде)

**Expected Counterexamples**:
- Изображения отображаются с белым фоном вместо прозрачного
- Высота баннера 80px вместо 40px
- Описание не соответствует реальному названию товара из БД
- Используются жестко заданные цвета вместо CSS переменных
- Отображаются товары из неподходящих категорий

### Fix Checking

**Goal**: Проверить, что для всех входных данных, где выполняется условие бага, исправленная функция производит ожидаемое поведение.

**Pseudocode:**
```
FOR ALL renderContext WHERE isBugCondition(renderContext) DO
  result := renderSidebarBanner_fixed(renderContext)
  ASSERT hasTransparentBackground(result.imageElement)
  ASSERT result.imageElement.height === 40
  ASSERT result.descriptionText === renderContext.product.name
  ASSERT usesCSS Variables(result.styles)
  ASSERT result.product.categoryName IN ['Электроинструмент', 'Компрессоры']
END FOR
```

### Preservation Checking

**Goal**: Проверить, что для всех взаимодействий, где условие бага НЕ выполняется, исправленная функция производит тот же результат, что и оригинальная.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT affectsSidebarBanner(interaction) DO
  ASSERT sidebarBehavior_original(interaction) = sidebarBehavior_fixed(interaction)
END FOR
```

**Testing Approach**: Property-based testing рекомендуется для preservation checking, потому что:
- Автоматически генерирует множество тестовых случаев по всему домену входных данных
- Ловит граничные случаи, которые могут пропустить ручные unit-тесты
- Предоставляет сильные гарантии, что поведение не изменилось для всех не-багованных входных данных

**Test Plan**: Наблюдать поведение на НЕИСПРАВЛЕННОМ коде для навигации и взаимодействий с сайдбаром, затем написать property-based тесты, фиксирующие это поведение.

**Test Cases**:
1. **Navigation Preservation**: Наблюдать, что клики по пунктам меню работают корректно на неисправленном коде, затем написать тест для проверки после исправления
2. **Hover Expansion Preservation**: Наблюдать, что наведение курсора расширяет сайдбар на неисправленном коде, затем написать тест для проверки после исправления
3. **Role-Based Menu Preservation**: Наблюдать, что меню отображается правильно для разных ролей на неисправленном коде, затем написать тест для проверки после исправления
4. **Mobile Behavior Preservation**: Наблюдать, что на мобильных устройствах сайдбар скрывается на неисправленном коде, затем написать тест для проверки после исправления

### Unit Tests

- Тест проверки прозрачного фона изображения в `.sidebar-banner-image`
- Тест проверки высоты 40px для `.sidebar-banner-image`
- Тест проверки использования реального названия товара из `product.name`
- Тест проверки использования CSS переменных вместо жестко заданных цветов
- Тест проверки фильтрации товаров по категориям "Электроинструмент" и "Компрессоры"
- Тест проверки, что навигация продолжает работать после исправлений
- Тест проверки, что hover-эффект расширения сайдбара продолжает работать

### Property-Based Tests

- Генерировать случайные viewport размеры и проверять, что баннер отображается корректно только на desktop (>= 768px)
- Генерировать случайные наборы товаров и проверять, что выбираются только товары из правильных категорий
- Генерировать случайные взаимодействия с навигацией и проверять, что поведение сохраняется после исправлений
- Тестировать, что все не-баннерные элементы сайдбара продолжают работать одинаково до и после исправлений

### Integration Tests

- Полный тест отображения сайдбара на desktop с проверкой всех 5 исправлений одновременно
- Тест переключения между desktop и mobile режимами с проверкой корректного отображения
- Тест клика по баннеру товара с проверкой открытия детальной страницы
- Тест навигации по всем пунктам меню с проверкой сохранения функциональности
