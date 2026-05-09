-- ============================================
-- ИСПРАВЛЕНИЕ: Создание таблицы DiscountHistories
-- Проблема: Таблица была создана как "DiscountHistory", но EF ищет "DiscountHistories"
-- Решение: Удалить старую таблицу и создать с правильным именем
-- ============================================

-- 1. Удалить старую таблицу (если существует)
DROP TABLE IF EXISTS "DiscountHistory" CASCADE;

-- 2. Создать таблицу с правильным именем "DiscountHistories"
CREATE TABLE "DiscountHistories" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL,
    "OldDiscount" DECIMAL(5,2) NOT NULL,
    "NewDiscount" DECIMAL(5,2) NOT NULL,
    "ChangedBy" INT NOT NULL,
    "ChangedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "Reason" TEXT,
    
    CONSTRAINT fk_discount_histories_user FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT fk_discount_histories_changed_by FOREIGN KEY ("ChangedBy") REFERENCES "Users"("Id") ON DELETE RESTRICT,
    CONSTRAINT chk_old_discount CHECK ("OldDiscount" >= 0 AND "OldDiscount" <= 100),
    CONSTRAINT chk_new_discount CHECK ("NewDiscount" >= 0 AND "NewDiscount" <= 100)
);

-- 3. Создать индексы
CREATE INDEX idx_discount_histories_user_id ON "DiscountHistories"("UserId");
CREATE INDEX idx_discount_histories_changed_at ON "DiscountHistories"("ChangedAt" DESC);

-- 4. Добавить комментарий
COMMENT ON TABLE "DiscountHistories" IS 'История изменений скидок пользователей для аудита';

-- 5. Проверка создания таблицы
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'DiscountHistories') as column_count
FROM information_schema.tables
WHERE table_name = 'DiscountHistories';

-- Вывод результата
SELECT 'Таблица DiscountHistories успешно создана!' AS status;
SELECT 'Теперь можно использовать функции программы лояльности' AS info;
