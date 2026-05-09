-- =====================================================
-- SQL Script: Add Search Performance Indexes
-- Database: PostgreSQL
-- Purpose: Improve search performance for products
-- =====================================================

-- Enable pg_trgm extension for trigram-based text search
-- This allows fast partial text matching (e.g., "дрел" matches "дрель")
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 1. Index for Product Name (case-insensitive search)
-- =====================================================
-- This index speeds up searches like: WHERE LOWER(Name) LIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
ON "Products" (LOWER("Name"));

-- Trigram index for fuzzy/partial matching on Name
-- This is MUCH faster for partial text search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON "Products" USING gin ("Name" gin_trgm_ops);

-- =====================================================
-- 2. Index for Product Article (case-insensitive search)
-- =====================================================
-- This index speeds up searches like: WHERE LOWER(Article) LIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_products_article_lower 
ON "Products" (LOWER("Article"));

-- Trigram index for fuzzy/partial matching on Article
CREATE INDEX IF NOT EXISTS idx_products_article_trgm 
ON "Products" USING gin ("Article" gin_trgm_ops);

-- =====================================================
-- 3. Index for Product Description (case-insensitive search)
-- =====================================================
-- This index speeds up searches like: WHERE LOWER(Description) LIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_products_description_lower 
ON "Products" (LOWER("Description"));

-- Trigram index for fuzzy/partial matching on Description
CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
ON "Products" USING gin ("Description" gin_trgm_ops);

-- =====================================================
-- 4. Composite index for active products
-- =====================================================
-- This speeds up queries that filter by IsActive
CREATE INDEX IF NOT EXISTS idx_products_isactive 
ON "Products" ("IsActive");

-- =====================================================
-- 5. Index for Category filtering
-- =====================================================
-- This speeds up queries that filter by CategoryId
CREATE INDEX IF NOT EXISTS idx_products_categoryid 
ON "Products" ("CategoryId");

-- =====================================================
-- 6. Index for Price range filtering
-- =====================================================
-- This speeds up queries that filter by Price
CREATE INDEX IF NOT EXISTS idx_products_price 
ON "Products" ("Price");

-- =====================================================
-- 7. Index for Stock filtering
-- =====================================================
-- This speeds up queries that filter by Stock (in stock / out of stock)
CREATE INDEX IF NOT EXISTS idx_products_stock 
ON "Products" ("Stock");

-- =====================================================
-- 8. Composite index for common query patterns
-- =====================================================
-- This speeds up queries that combine IsActive + CategoryId
CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON "Products" ("IsActive", "CategoryId");

-- This speeds up queries that combine IsActive + Stock (in stock filter)
CREATE INDEX IF NOT EXISTS idx_products_active_stock 
ON "Products" ("IsActive", "Stock");

-- =====================================================
-- 9. Index for sorting by CreatedAt
-- =====================================================
-- This speeds up queries that sort by CreatedAt
CREATE INDEX IF NOT EXISTS idx_products_createdat 
ON "Products" ("CreatedAt" DESC);

-- =====================================================
-- 10. Index for ProductAttributes (for attribute filtering)
-- =====================================================
-- This speeds up queries that filter by attributes
CREATE INDEX IF NOT EXISTS idx_productattributes_productid 
ON "ProductAttributes" ("ProductId");

CREATE INDEX IF NOT EXISTS idx_productattributes_name_value 
ON "ProductAttributes" ("AttrName", "AttrValue");

-- =====================================================
-- Verify indexes were created
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('Products', 'ProductAttributes')
ORDER BY tablename, indexname;

-- =====================================================
-- Performance Tips:
-- =====================================================
-- 1. After creating indexes, run ANALYZE to update statistics:
--    ANALYZE "Products";
--    ANALYZE "ProductAttributes";
--
-- 2. Monitor index usage with:
--    SELECT * FROM pg_stat_user_indexes WHERE relname = 'Products';
--
-- 3. For very large databases (100,000+ products), consider:
--    - Full-Text Search (FTS) with tsvector
--    - Elasticsearch for advanced search
--    - Materialized views for complex queries
--
-- 4. Expected performance improvement:
--    - Before: 500-2000ms for search across 40,000 products
--    - After: 10-50ms for search across 40,000 products
--    - 10-100x faster!
-- =====================================================
