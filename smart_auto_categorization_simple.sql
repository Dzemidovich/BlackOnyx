-- =============================================
-- УПРОЩЕННАЯ ВЕРСИЯ (без STRING_AGG)
-- =============================================

USE ToolShopDB;
GO

-- =============================================
-- АНАЛИЗ И СОЗДАНИЕ КАТЕГОРИЙ
-- =============================================

IF OBJECT_ID('sp_QuickAutoCategories', 'P') IS NOT NULL DROP PROCEDURE sp_QuickAutoCategories;
GO

CREATE PROCEDURE sp_QuickAutoCategories
    @MinOccurrences INT = 50,
    @DryRun BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица
    CREATE TABLE #NewCategories (
        Keyword NVARCHAR(100),
        Occurrences INT,
        CategoryName NVARCHAR(100),
        AlreadyExists BIT
    );
    
    -- Стоп-слова
    DECLARE @StopWords TABLE (Word NVARCHAR(50));
    INSERT INTO @StopWords VALUES 
    ('для'), ('с'), ('и'), ('в'), ('на'), ('по'), ('из'), ('мм'), ('см'), ('шт'),
    ('набор'), ('комплект'), ('professional'), ('pro'), ('new'), ('original');
    
    -- Анализ первого слова
    INSERT INTO #NewCategories (Keyword, Occurrences, CategoryName, AlreadyExists)
    SELECT 
        FirstWord,
        COUNT(*) as Occurrences,
        UPPER(LEFT(FirstWord, 1)) + LOWER(SUBSTRING(FirstWord, 2, LEN(FirstWord))) as CategoryName,
        CASE 
            WHEN EXISTS (SELECT 1 FROM Categories WHERE LOWER(Name) LIKE '%' + FirstWord + '%') 
            THEN 1 
            ELSE 0 
        END as AlreadyExists
    FROM (
        SELECT 
            LOWER(LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(' ', Name) > 0 
                    THEN SUBSTRING(Name, 1, CHARINDEX(' ', Name) - 1)
                    ELSE Name
                END
            ))) as FirstWord
        FROM Products
        WHERE IsActive = 1 AND CategoryId IS NULL
    ) as Words
    WHERE LEN(FirstWord) > 3
        AND FirstWord NOT IN (SELECT Word FROM @StopWords)
    GROUP BY FirstWord
    HAVING COUNT(*) >= @MinOccurrences;
    
    -- Показать результаты
    SELECT 
        CategoryName as [Категория],
        Occurrences as [Товаров],
        CASE WHEN AlreadyExists = 1 THEN 'Существует' ELSE 'Новая' END as [Статус]
    FROM #NewCategories
    ORDER BY Occurrences DESC;
    
    PRINT '';
    PRINT 'Будет создано категорий: ' + CAST((SELECT COUNT(*) FROM #NewCategories WHERE AlreadyExists = 0) AS NVARCHAR(10));
    PRINT 'Будет распределено товаров: ' + CAST((SELECT SUM(Occurrences) FROM #NewCategories WHERE AlreadyExists = 0) AS NVARCHAR(10));
    
    -- Создать категории
    IF @DryRun = 0
    BEGIN
        DECLARE @Keyword NVARCHAR(100);
        DECLARE @CategoryName NVARCHAR(100);
        DECLARE @NewCategoryId INT;
        DECLARE @TotalUpdated INT = 0;
        
        DECLARE cat_cursor CURSOR FOR
        SELECT Keyword, CategoryName
        FROM #NewCategories
        WHERE AlreadyExists = 0;
        
        OPEN cat_cursor;
        FETCH NEXT FROM cat_cursor INTO @Keyword, @CategoryName;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Создать категорию
            INSERT INTO Categories (Name, ParentId)
            VALUES (@CategoryName, NULL);
            
            SET @NewCategoryId = SCOPE_IDENTITY();
            
            -- Назначить товары
            UPDATE Products
            SET CategoryId = @NewCategoryId
            WHERE IsActive = 1
                AND CategoryId IS NULL
                AND LOWER(Name) LIKE LOWER(@Keyword) + '%';
            
            SET @TotalUpdated = @TotalUpdated + @@ROWCOUNT;
            
            PRINT 'Создана: ' + @CategoryName + ' (' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' товаров)';
            
            FETCH NEXT FROM cat_cursor INTO @Keyword, @CategoryName;
        END;
        
        CLOSE cat_cursor;
        DEALLOCATE cat_cursor;
        
        PRINT '';
        PRINT '✅ Готово! Распределено товаров: ' + CAST(@TotalUpdated AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT '';
        PRINT 'DryRun режим. Для применения: EXEC sp_QuickAutoCategories @MinOccurrences = ' + CAST(@MinOccurrences AS NVARCHAR(10)) + ', @DryRun = 0';
    END;
    
    DROP TABLE #NewCategories;
END;
GO

-- =============================================
-- ОПТИМИЗАЦИЯ ИНДЕКСОВ
-- =============================================

PRINT 'Создание индексов...';

-- Products
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CategoryId_IsActive')
    CREATE INDEX IX_Products_CategoryId_IsActive ON Products(CategoryId, IsActive) INCLUDE (Id, Name, Price, Stock, ImageUrl);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_Name')
    CREATE INDEX IX_Products_Name ON Products(Name) INCLUDE (Id, CategoryId, IsActive);

-- ProductAttributes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductAttributes_ProductId')
    CREATE INDEX IX_ProductAttributes_ProductId ON ProductAttributes(ProductId) INCLUDE (AttrName, AttrValue);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductAttributes_AttrName')
    CREATE INDEX IX_ProductAttributes_AttrName ON ProductAttributes(AttrName, AttrValue) INCLUDE (ProductId);

-- Categories
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Categories_ParentId')
    CREATE INDEX IX_Categories_ParentId ON Categories(ParentId) INCLUDE (Name);

-- CartItems
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CartItems_CartId')
    CREATE INDEX IX_CartItems_CartId ON CartItems(CartId) INCLUDE (ProductId, Quantity, Price);

-- Orders
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_UserId')
    CREATE INDEX IX_Orders_UserId ON Orders(UserId, CreatedAt DESC) INCLUDE (TotalAmount, Status);

PRINT '✅ Индексы созданы!';
PRINT '';
PRINT '==============================================';
PRINT 'ИСПОЛЬЗОВАНИЕ:';
PRINT '==============================================';
PRINT '1. Тест: EXEC sp_QuickAutoCategories @MinOccurrences = 50, @DryRun = 1;';
PRINT '2. Применить: EXEC sp_QuickAutoCategories @MinOccurrences = 50, @DryRun = 0;';
PRINT '==============================================';

GO
