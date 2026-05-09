-- ============================================
-- ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ (УПРОЩЕННАЯ ВЕРСИЯ)
-- ============================================

-- 1. СОСТАВНЫЕ ИНДЕКСЫ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON "Products"("IsActive", "CategoryId") 
WHERE "IsActive" = true;

CREATE INDEX IF NOT EXISTS idx_products_active_price 
ON "Products"("IsActive", "Price") 
WHERE "IsActive" = true;

CREATE INDEX IF NOT EXISTS idx_products_active_stock 
ON "Products"("IsActive", "Stock") 
WHERE "IsActive" = true;

CREATE INDEX IF NOT EXISTS idx_products_search_gin 
ON "Products" USING gin(
    to_tsvector('russian', "Name" || ' ' || COALESCE("Description", ''))
);

-- 2. ИНДЕКСЫ ДЛЯ АТРИБУТОВ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attributes_name_value_product 
ON "ProductAttributes"("AttrName", "AttrValue", "ProductId");

CREATE INDEX IF NOT EXISTS idx_attributes_brand 
ON "ProductAttributes"("AttrValue", "ProductId") 
WHERE "AttrName" = 'Бренд';

CREATE INDEX IF NOT EXISTS idx_attributes_product_active
ON "ProductAttributes"("ProductId", "AttrName", "AttrValue");

-- 3. ИНДЕКСЫ ДЛЯ КАТЕГОРИЙ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON "Categories"("ParentId") 
WHERE "ParentId" IS NOT NULL;

-- 4. МАТЕРИАЛИЗОВАННОЕ ПРЕДСТАВЛЕНИЕ
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_filter_counts CASCADE;

CREATE MATERIALIZED VIEW mv_filter_counts AS
SELECT 
    pa."AttrName" as attr_name,
    pa."AttrValue" as attr_value,
    COUNT(DISTINCT pa."ProductId") as product_count
FROM "ProductAttributes" pa
INNER JOIN "Products" p ON pa."ProductId" = p."Id"
WHERE p."IsActive" = true
GROUP BY pa."AttrName", pa."AttrValue";

CREATE UNIQUE INDEX idx_mv_filter_counts 
ON mv_filter_counts(attr_name, attr_value);

-- 5. ФУНКЦИЯ ОБНОВЛЕНИЯ
-- ============================================

CREATE OR REPLACE FUNCTION refresh_filter_counts()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_filter_counts;
END;
$$ LANGUAGE plpgsql;

-- 6. ОБНОВИТЬ СТАТИСТИКУ
-- ============================================

ANALYZE "Products";
ANALYZE "ProductAttributes";
ANALYZE "Categories";

-- 7. ПЕРВОЕ ОБНОВЛЕНИЕ
-- ============================================

SELECT refresh_filter_counts();

-- 8. ПРОВЕРКА
-- ============================================

SELECT 
    attr_name,
    COUNT(*) as value_count,
    SUM(product_count) as total_products
FROM mv_filter_counts
GROUP BY attr_name
ORDER BY attr_name;

-- ГОТОВО!
SELECT 'Оптимизация применена успешно!' as status;
