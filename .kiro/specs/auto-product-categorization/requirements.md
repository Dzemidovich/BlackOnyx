# Requirements Document

## Introduction

Система автоматической категоризации и фильтрации товаров для интернет-магазина инструментов ToolShop. Система автоматически извлекает бренды и характеристики товаров из их названий и описаний, а также распределяет товары по категориям на основе настраиваемых правил. Это позволяет автоматизировать процесс организации каталога и создания фильтров для удобного поиска товаров покупателями.

## Glossary

- **System**: Система автоматической категоризации товаров
- **Product**: Товар в базе данных (таблица Products)
- **Category**: Категория товара (таблица Categories)
- **Attribute**: Характеристика товара (таблица ProductAttributes), например "Бренд", "Мощность", "Объем"
- **Brand**: Бренд товара, извлекаемый из первого слова названия
- **Rule**: Правило категоризации, связывающее ключевое слово с категорией (таблица AutoCategoryRules)
- **Keyword**: Ключевое слово для поиска в названии или описании товара
- **Trigger**: Триггер базы данных, автоматически выполняющийся при изменении данных
- **Administrator**: Пользователь с правами администратора системы

## Requirements

### Requirement 1: Автоматическое извлечение брендов

**User Story:** Как администратор, я хочу чтобы система автоматически извлекала бренды из названий товаров, чтобы покупатели могли фильтровать товары по брендам без ручного ввода данных.

#### Acceptance Criteria

1. WHEN a Product is inserted or updated, THE System SHALL extract the first word from the Product name as the Brand
2. THE System SHALL create or update an Attribute with AttrName "Бренд" for the Product
3. THE System SHALL capitalize the first letter of the Brand value
4. IF the Product name contains known brand keywords (BOSCH, FISKARS, STARTUL, MAKITA, DEWALT, METABO), THEN THE System SHALL use the standardized brand name
5. THE System SHALL preserve existing Brand Attributes if they were manually set by an Administrator

### Requirement 2: Автоматическое извлечение характеристик мощности

**User Story:** Как покупатель, я хочу фильтровать электроинструменты по мощности, чтобы выбрать подходящий инструмент для моих задач.

#### Acceptance Criteria

1. WHEN a Product description contains power specifications in kW or W format, THE System SHALL extract the power value
2. THE System SHALL recognize patterns "X кВт", "X.X кВт", "X Вт", "X.X Вт" where X is a number
3. THE System SHALL create an Attribute with AttrName "Мощность" and AttrValue containing the extracted value with units
4. THE System SHALL convert values to a consistent format (prefer kW for values >= 1000W)
5. IF multiple power values are found, THEN THE System SHALL use the first occurrence

### Requirement 3: Автоматическое извлечение характеристик объема

**User Story:** Как покупатель, я хочу фильтровать компрессоры по объему ресивера, чтобы выбрать компрессор нужной производительности.

#### Acceptance Criteria

1. WHEN a Product description contains volume specifications in liters format, THE System SHALL extract the volume value
2. THE System SHALL recognize patterns "X л", "X.X л", "Объем: X л", "Ресивер: X л" where X is a number
3. THE System SHALL create an Attribute with AttrName "Объем" and AttrValue containing the extracted value with units
4. THE System SHALL handle both integer and decimal volume values
5. IF multiple volume values are found, THEN THE System SHALL use the largest value

### Requirement 4: Хранение правил категоризации

**User Story:** Как администратор, я хочу настраивать правила автоматической категоризации, чтобы система правильно распределяла новые товары по категориям.

#### Acceptance Criteria

1. THE System SHALL provide a table AutoCategoryRules for storing categorization rules
2. THE AutoCategoryRules table SHALL contain columns: Id, CategoryId, Keyword, Priority, IsActive, CreatedAt
3. WHEN an Administrator creates a Rule, THE System SHALL validate that the CategoryId references an existing Category
4. THE System SHALL allow multiple Keywords to map to the same Category
5. THE System SHALL support Priority values from 1 to 10 where higher values indicate more important rules
6. THE System SHALL only use Rules where IsActive is true

### Requirement 5: Автоматическая категоризация по правилам

**User Story:** Как администратор, я хочу чтобы товары автоматически распределялись по категориям при добавлении, чтобы не тратить время на ручную категоризацию.

#### Acceptance Criteria

1. WHEN a Product is inserted or updated, THE System SHALL search for matching Keywords in the Product name and description
2. THE System SHALL match Keywords case-insensitively using LOWER() function
3. THE System SHALL calculate a match score by summing Priority values of all matching Rules
4. THE System SHALL assign the Product to the Category with the highest match score
5. IF no Rules match, THEN THE System SHALL leave the Product CategoryId as NULL
6. THE System SHALL only update CategoryId if the new match score is higher than the current category match score

### Requirement 6: Массовая категоризация существующих товаров

**User Story:** Как администратор, я хочу применить правила категоризации ко всем существующим товарам, чтобы организовать весь каталог без ручной работы.

#### Acceptance Criteria

1. THE System SHALL provide a stored procedure pr_auto_organize_categories for batch categorization
2. WHEN the procedure is executed, THE System SHALL process all Products in the database
3. THE System SHALL apply categorization rules to each Product based on AutoCategoryRules
4. THE System SHALL update Product CategoryId values where matches are found
5. THE System SHALL log the number of Products updated
6. THE System SHALL complete execution within 60 seconds for databases with up to 10000 Products

### Requirement 7: Триггер автоматической обработки

**User Story:** Как администратор, я хочу чтобы новые товары автоматически обрабатывались при добавлении, чтобы не запускать обработку вручную.

#### Acceptance Criteria

1. THE System SHALL provide a trigger trg_auto_attributes on the Products table
2. WHEN a Product is inserted, THE System SHALL automatically execute the attribute extraction function
3. WHEN a Product name or description is updated, THE System SHALL re-execute the attribute extraction function
4. THE System SHALL execute the trigger AFTER INSERT OR UPDATE operations
5. THE System SHALL handle trigger execution errors without blocking the Product insert/update operation

### Requirement 8: Функция извлечения атрибутов

**User Story:** Как разработчик, я хочу иметь переиспользуемую функцию извлечения атрибутов, чтобы применять её в разных контекстах.

#### Acceptance Criteria

1. THE System SHALL provide a function fn_extract_attributes_v2 that accepts ProductId as parameter
2. THE function SHALL extract Brand, Power, and Volume attributes from the Product
3. THE function SHALL insert or update records in ProductAttributes table
4. THE function SHALL return the number of attributes extracted
5. THE function SHALL use UPSERT logic to avoid duplicate Attribute entries for the same Product and AttrName

### Requirement 9: Примеры правил категоризации

**User Story:** Как администратор, я хочу иметь готовый набор правил для типичных категорий инструментов, чтобы быстро начать использовать систему.

#### Acceptance Criteria

1. THE System SHALL provide initial Rules for common tool categories
2. THE System SHALL include Rules for keywords: "шуруповерт" → "Дрели и шуруповёрты", "болгарка" → "Углошлифовальные машины (УШМ)", "перфоратор" → "Перфораторы", "компрессор" → "Компрессоры поршневые"
3. THE System SHALL include Rules for keywords: "пила", "лобзик", "диск", "сверло", "бита", "топор", "лопата", "шпатель"
4. THE System SHALL assign Priority 10 to exact tool type matches
5. THE System SHALL assign Priority 8-9 to related component matches

### Requirement 10: Индексы для производительности

**User Story:** Как администратор, я хочу чтобы система работала быстро даже с большим каталогом, чтобы пользователи не ждали загрузки страниц.

#### Acceptance Criteria

1. THE System SHALL create an index idx_products_category_name on Products(CategoryId, Name)
2. THE System SHALL create an index idx_products_price_category on Products(CategoryId, Price)
3. THE System SHALL create an index idx_productattributes_filter on ProductAttributes(ProductId, AttrName, AttrValue)
4. THE System SHALL create an index idx_autocategoryrules_keyword on AutoCategoryRules(Keyword) where IsActive = true
5. THE System SHALL execute category filtering queries in under 100ms for catalogs with up to 10000 Products

### Requirement 11: Статистика категоризации

**User Story:** Как администратор, я хочу видеть статистику распределения товаров по категориям, чтобы оценить качество автоматической категоризации.

#### Acceptance Criteria

1. THE System SHALL provide a query to show the count of Products per Category
2. THE System SHALL show the count of unique Attribute values per AttrName
3. THE System SHALL show the total count of Attributes per AttrName
4. THE System SHALL order statistics by count in descending order
5. THE System SHALL include Categories with zero Products in the statistics

### Requirement 12: Обработка специальных символов

**User Story:** Как администратор, я хочу чтобы система корректно обрабатывала товары с нестандартными названиями, чтобы все товары были правильно категоризированы.

#### Acceptance Criteria

1. THE System SHALL handle Product names containing special characters (quotes, dashes, slashes)
2. THE System SHALL handle Product names in mixed case (uppercase, lowercase, mixed)
3. THE System SHALL trim whitespace from extracted Brand values
4. THE System SHALL handle Product descriptions containing NULL values without errors
5. THE System SHALL handle empty Product names by skipping Brand extraction
