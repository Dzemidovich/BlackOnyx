-- ==============================================================================
-- СКРИПТ ДЛЯ АВТОМАТИЧЕСКОГО РАСПРЕДЕЛЕНИЯ ТОВАРОВ ПО КАТЕГОРИЯМ
-- Для магазина инструментов (BOSCH, FISKARS, STARTUL и др.)
-- ==============================================================================

-- 1. ОЧИСТКА СТАРЫХ КАТЕГОРИЙ
-- ==============================================================================
TRUNCATE "Categories" RESTART IDENTITY CASCADE;

-- 2. СОЗДАНИЕ ИЕРАРХИИ КАТЕГОРИЙ
-- ==============================================================================
-- Основные категории
INSERT INTO "Categories" ("Name", "ParentId") VALUES
('Расходные материалы', NULL),
('Садовая техника', NULL),
('Строительный инструмент', NULL),
('Ручной инструмент', NULL),
('Защитная одежда', NULL),
('Электроинструменты', NULL);

-- Подкатегории для Расходные материалы (id = 1)
INSERT INTO "Categories" ("Name", "ParentId") VALUES
('Пилки для лобзика', 1),
('Свёрла', 1),
('Биты и держатели', 1),
('Диски и щётки', 1),
('Шлифовальные материалы', 1);

-- Подкатегории для Садовая техника (id = 2)
INSERT INTO "Categories" ("Name", "ParentId") VALUES
('Лопаты и грабли', 2),
('Топоры', 2),
('Секаторы и ножницы', 2),
('Корнеудалители', 2);

-- Подкатегории для Строительный инструмент (id = 3)
INSERT INTO "Categories" ("Name", "ParentId") VALUES
('Шпатели', 3),
('Кельмы и гладилки', 3),
('Тёрки и фуговки', 3),
('Ванночки малярные', 3);

-- 3. АВТОМАТИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ ТОВАРОВ
-- ==============================================================================

-- Пилки для лобзика
UPDATE "Products" SET "CategoryId" = 7 
WHERE LOWER("Name") LIKE '%пилк%' AND LOWER("Name") LIKE '%лобзик%';

-- Свёрла
UPDATE "Products" SET "CategoryId" = 8 
WHERE LOWER("Name") LIKE '%сверл%';

-- Биты и держатели для бит
UPDATE "Products" SET "CategoryId" = 9 
WHERE LOWER("Name") LIKE '%бит%' OR LOWER("Name") LIKE '%держатель%';

-- Диски и щётки (для УШМ)
UPDATE "Products" SET "CategoryId" = 10 
WHERE LOWER("Name") LIKE '%диск%' OR LOWER("Name") LIKE '%щётк%' OR LOWER("Name") LIKE '%щетк%';

-- Шлифовальные материалы
UPDATE "Products" SET "CategoryId" = 11 
WHERE LOWER("Name") LIKE '%шлифов%' OR LOWER("Name") LIKE '%наждач%';

-- Лопаты
UPDATE "Products" SET "CategoryId" = 13 
WHERE LOWER("Name") LIKE '%лопат%';

-- Грабли
UPDATE "Products" SET "CategoryId" = 13 
WHERE LOWER("Name") LIKE '%грабл%';

-- Топоры
UPDATE "Products" SET "CategoryId" = 14 
WHERE LOWER("Name") LIKE '%топор%';

-- Секаторы и ножницы садовые
UPDATE "Products" SET "CategoryId" = 15 
WHERE LOWER("Name") LIKE '%секатор%' OR LOWER("Name") LIKE '%ножниц%садов%';

-- Корнеудалители
UPDATE "Products" SET "CategoryId" = 16 
WHERE LOWER("Name") LIKE '%корнеудалитель%';

-- Шпатели
UPDATE "Products" SET "CategoryId" = 18 
WHERE LOWER("Name") LIKE '%шпател%';

-- Кельмы
UPDATE "Products" SET "CategoryId" = 19 
WHERE LOWER("Name") LIKE '%кельм%';

-- Гладилки
UPDATE "Products" SET "CategoryId" = 19 
WHERE LOWER("Name") LIKE '%гладилк%';

-- Тёрки и фуговки
UPDATE "Products" SET "CategoryId" = 20 
WHERE LOWER("Name") LIKE '%тёрка%' OR LOWER("Name") LIKE '%фуговк%';

-- Ванночки малярные
UPDATE "Products" SET "CategoryId" = 21 
WHERE LOWER("Name") LIKE '%ванночк%';

-- Защитная одежда
UPDATE "Products" SET "CategoryId" = 5 
WHERE LOWER("Name") LIKE '%халат%' OR LOWER("Name") LIKE '%щиток%' OR LOWER("Name") LIKE '%защитн%';

-- 4. ДОБАВЛЕНИЕ БРЕНДОВ
-- ==============================================================================
INSERT INTO "ProductAttributes" ("ProductId", "AttrName", "AttrValue")
SELECT "Id", 'Бренд', 
    CASE 
        WHEN LOWER("Name") LIKE '%bosch%' THEN 'Bosch'
        WHEN LOWER("Name") LIKE '%fiskars%' THEN 'Fiskars'
        WHEN LOWER("Name") LIKE '%startul%' THEN 'Startul'
        WHEN LOWER("Name") LIKE '%makita%' THEN 'Makita'
        WHEN LOWER("Name") LIKE '%dewalt%' THEN 'DeWalt'
        WHEN LOWER("Name") LIKE '%metabo%' THEN 'Metabo'
        ELSE 'Другой'
    END
FROM "Products"
WHERE NOT EXISTS (
    SELECT 1 FROM "ProductAttributes" pa 
    WHERE pa."ProductId" = "Products"."Id" AND pa."AttrName" = 'Бренд'
);

-- 5. ДОБАВЛЕНИЕ ТИПА ТОВАРА
-- ==============================================================================
INSERT INTO "ProductAttributes" ("ProductId", "AttrName", "AttrValue")
SELECT "Id", 'Тип товара',
    CASE 
        WHEN LOWER("Name") LIKE '%пилк%лобзик%' THEN 'Пилка для лобзика'
        WHEN LOWER("Name") LIKE '%сверл%' THEN 'Сверло'
        WHEN LOWER("Name") LIKE '%бит%' THEN 'Бита'
        WHEN LOWER("Name") LIKE '%держатель%' THEN 'Держатель'
        WHEN LOWER("Name") LIKE '%диск%' THEN 'Диск'
        WHEN LOWER("Name") LIKE '%щётк%' OR LOWER("Name") LIKE '%щетк%' THEN 'Щётка'
        WHEN LOWER("Name") LIKE '%лопат%' THEN 'Лопата'
        WHEN LOWER("Name") LIKE '%грабл%' THEN 'Грабли'
        WHEN LOWER("Name") LIKE '%топор%' THEN 'Топор'
        WHEN LOWER("Name") LIKE '%шпател%' THEN 'Шпатель'
        WHEN LOWER("Name") LIKE '%кельм%' THEN 'Кельма'
        WHEN LOWER("Name") LIKE '%гладилк%' THEN 'Гладилка'
        WHEN LOWER("Name") LIKE '%тёрка%' THEN 'Тёрка'
        WHEN LOWER("Name") LIKE '%фуговк%' THEN 'Фуговка'
        WHEN LOWER("Name") LIKE '%ванночк%' THEN 'Ванночка'
        WHEN LOWER("Name") LIKE '%халат%' THEN 'Халат рабочий'
        WHEN LOWER("Name") LIKE '%щиток%' THEN 'Щиток защитный'
        WHEN LOWER("Name") LIKE '%корнеудалитель%' THEN 'Корнеудалитель'
        WHEN LOWER("Name") LIKE '%секатор%' THEN 'Секатор'
        ELSE 'Прочее'
    END
FROM "Products"
WHERE NOT EXISTS (
    SELECT 1 FROM "ProductAttributes" pa 
    WHERE pa."ProductId" = "Products"."Id" AND pa."AttrName" = 'Тип товара'
);

-- 6. ИНДЕКСЫ
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_name ON "Products"("CategoryId", "Name");
CREATE INDEX IF NOT EXISTS idx_products_price_category ON "Products"("CategoryId", "Price");
CREATE INDEX IF NOT EXISTS idx_productattributes_filter ON "ProductAttributes"("ProductId", "AttrName", "AttrValue");

-- 7. СТАТИСТИКА
-- ==============================================================================
SELECT c."Name" as "Категория", COUNT(p."Id") as "Кол-во товаров"
FROM "Categories" c
LEFT JOIN "Products" p ON p."CategoryId" = c."Id"
GROUP BY c."Id", c."Name"
ORDER BY COUNT(p."Id") DESC;

SELECT pa."AttrName" as "Атрибут", COUNT(DISTINCT pa."AttrValue") as "Уникальных", COUNT(pa."Id") as "Всего"
FROM "ProductAttributes" pa
GROUP BY pa."AttrName"
ORDER BY COUNT(pa."Id") DESC;

SELECT 'Категоризация завершена!' as result;