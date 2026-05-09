-- ============================================
-- ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ БАЗЫ ДАННЫХ
-- ============================================

-- 1. СОСТАВНЫЕ ИНДЕКСЫ ДЛЯ ЧАСТЫХ ЗАПРОСОВ
-- ============================================

-- Индекс для фильтрации активных товаров по категории
CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON "Products"("IsActive", "CategoryId") 
WHERE "IsActive" = true;

-- Индекс для фильтрации по цене
CREATE INDEX IF NOT EXISTS idx_products_active_price 
ON "Products"("IsActive", "Price") 
WHERE "IsActive" = true;

-- Индекс для фильтрации по наличию
CREATE INDEX IF NOT EXISTS idx_products_active_stock 
ON "Products"("IsActive", "Stock") 
WHERE "IsActive" = true;

-- Индекс для полнотекстового поиска (GIN)
CREATE INDEX IF NOT EXISTS idx_products_search_gin 
ON "Products" USING gin(
    to_tsvector('russian', "Name" || ' ' || COALESCE("Description", ''))
);

-- 2. ИНДЕКСЫ ДЛЯ АТРИБУТОВ
-- ============================================

-- Составной индекс для атрибутов с покрытием
CREATE INDEX IF NOT EXISTS idx_attributes_name_value_product 
ON "ProductAttributes"("AttrName", "AttrValue", "ProductId");

-- Частичный индекс для популярных брендов
CREATE INDEX IF NOT EXISTS idx_attributes_brand 
ON "ProductAttributes"("AttrValue", "ProductId") 
WHERE "AttrName" = 'Бренд';

-- Индекс для быстрого подсчета уникальных товаров по атрибуту
CREATE INDEX IF NOT EXISTS idx_attributes_product_active
ON "ProductAttributes"("ProductId", "AttrName", "AttrValue");

-- 3. МАТЕРИАЛИЗОВАННОЕ ПРЕДСТАВЛЕНИЕ ДЛЯ ФИЛЬТРОВ
-- ============================================

-- Удаляем старое представление если существует
DROP MATERIALIZED VIEW IF EXISTS mv_filter_counts CASCADE;

-- Создаем материализованное представление
CREATE MATERIALIZED VIEW mv_filter_counts AS
SELECT 
    pa."AttrName" as attr_name,
    pa."AttrValue" as attr_value,
    COUNT(DISTINCT pa."ProductId") as product_count
FROM "ProductAttributes" pa
INNER JOIN "Products" p ON pa."ProductId" = p."Id"
WHERE p."IsActive" = true
GROUP BY pa."AttrName", pa."AttrValue";

-- Индекс для быстрого доступа к материализованному представлению
CREATE UNIQUE INDEX idx_mv_filter_counts 
ON mv_filter_counts(attr_name, attr_value);

-- 4. ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ МАТЕРИАЛИЗОВАННОГО ПРЕДСТАВЛЕНИЯ
-- ============================================

CREATE OR REPLACE FUNCTION refresh_filter_counts()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_filter_counts;
    RAISE NOTICE 'Filter counts refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- 5. ТРИГГЕР ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ (ОПЦИОНАЛЬНО)
-- ============================================
-- Этот триггер будет обновлять представление при изменении товаров
-- ВНИМАНИЕ: Может замедлить операции INSERT/UPDATE, использовать осторожно!

-- Функция для отложенного обновления
CREATE OR REPLACE FUNCTION schedule_filter_refresh()
RETURNS TRIGGER AS $$
BEGIN
    -- Помечаем, что нужно обновить (можно использовать флаг в отдельной таблице)
    -- Реальное обновление делать по расписанию или вручную
    RAISE NOTICE 'Filter counts need refresh';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на изменение товаров (закомментирован, включать по необходимости)
-- DROP TRIGGER IF EXISTS trg_products_filter_refresh ON "Products";
-- CREATE TRIGGER trg_products_filter_refresh
-- AFTER INSERT OR UPDATE OR DELETE ON "Products"
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION schedule_filter_refresh();

-- 6. ИНДЕКСЫ ДЛЯ КАТЕГОРИЙ
-- ============================================

-- Индекс для иерархии категорий
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON "Categories"("ParentId") 
WHERE "ParentId" IS NOT NULL;

-- 7. ИНДЕКСЫ ДЛЯ ЗАКАЗОВ (для аналитики популярности)
-- ============================================

-- Индекс для анализа популярных товаров
CREATE INDEX IF NOT EXISTS idx_order_items_product_created 
ON "OrderItems"("ProductId", "Quantity");

CREATE INDEX IF NOT EXISTS idx_orders_created 
ON "Orders"("CreatedAt") 
WHERE "Status" != 'Cancelled';

-- 8. СТАТИСТИКА И АНАЛИЗ
-- ============================================

-- Обновляем статистику для оптимизатора запросов
ANALYZE "Products";
ANALYZE "ProductAttributes";
ANALYZE "Categories";
ANALYZE "Orders";
ANALYZE "OrderItems";

-- 9. ПРОВЕРКА СОЗДАННЫХ ИНДЕКСОВ
-- ============================================

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(indexname))::regclass) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('Products', 'ProductAttributes', 'Categories')
ORDER BY tablename, indexname;

-- 10. ПЕРВОНАЧАЛЬНОЕ ОБНОВЛЕНИЕ МАТЕРИАЛИЗОВАННОГО ПРЕДСТАВЛЕНИЯ
-- ============================================

SELECT refresh_filter_counts();

-- Проверяем результат
SELECT 
    attr_name,
    COUNT(*) as value_count,
    SUM(product_count) as total_products
FROM mv_filter_counts
GROUP BY attr_name
ORDER BY attr_name;

-- ============================================
-- ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ
-- ============================================

/*
1. Применить этот скрипт к базе данных:
   psql -U postgres -d ToolShopDB -f add_performance_indexes.sql

2. Обновлять материализованное представление:
   - Вручную: SELECT refresh_filter_counts();
   - После импорта товаров
   - По расписанию (например, каждые 5 минут)

3. Мониторинг производительности:
   - Смотреть размеры индексов
   - Анализировать планы запросов: EXPLAIN ANALYZE SELECT ...
   - Проверять использование индексов

4. Если база большая (>100k товаров):
   - Рассмотреть партиционирование таблиц
   - Настроить параметры PostgreSQL (shared_buffers, work_mem)
   - Использовать connection pooling (PgBouncer)
*/
