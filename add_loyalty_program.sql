-- ============================================
-- Миграция: Программа лояльности клиентов
-- Дата: 2026-05-08
-- Описание: Добавление полей для накопительной системы скидок
-- ============================================

-- 1. Расширение таблицы Users
ALTER TABLE "Users" 
ADD COLUMN "TotalOrdersAmount" DECIMAL(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN "CurrentDiscount" DECIMAL(5,2) DEFAULT 0 NOT NULL;

-- Добавление constraints для валидации
ALTER TABLE "Users"
ADD CONSTRAINT chk_total_orders_amount CHECK ("TotalOrdersAmount" >= 0),
ADD CONSTRAINT chk_current_discount CHECK ("CurrentDiscount" >= 0 AND "CurrentDiscount" <= 100);

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_users_total_orders_amount ON "Users"("TotalOrdersAmount");
CREATE INDEX idx_users_current_discount ON "Users"("CurrentDiscount");

-- 2. Расширение таблицы Orders
ALTER TABLE "Orders"
ADD COLUMN "AppliedDiscount" DECIMAL(5,2),
ADD COLUMN "DiscountAmount" DECIMAL(10,2);

-- Добавление constraints
ALTER TABLE "Orders"
ADD CONSTRAINT chk_applied_discount CHECK ("AppliedDiscount" IS NULL OR ("AppliedDiscount" >= 0 AND "AppliedDiscount" <= 100)),
ADD CONSTRAINT chk_discount_amount CHECK ("DiscountAmount" IS NULL OR "DiscountAmount" >= 0);

-- 3. Создание таблицы DiscountHistory
CREATE TABLE "DiscountHistory" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL,
    "OldDiscount" DECIMAL(5,2) NOT NULL,
    "NewDiscount" DECIMAL(5,2) NOT NULL,
    "ChangedBy" INT NOT NULL,
    "ChangedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "Reason" TEXT,
    
    CONSTRAINT fk_discount_history_user FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT fk_discount_history_changed_by FOREIGN KEY ("ChangedBy") REFERENCES "Users"("Id") ON DELETE RESTRICT,
    CONSTRAINT chk_old_discount CHECK ("OldDiscount" >= 0 AND "OldDiscount" <= 100),
    CONSTRAINT chk_new_discount CHECK ("NewDiscount" >= 0 AND "NewDiscount" <= 100)
);

-- Создание индексов для DiscountHistory
CREATE INDEX idx_discount_history_user_id ON "DiscountHistory"("UserId");
CREATE INDEX idx_discount_history_changed_at ON "DiscountHistory"("ChangedAt" DESC);

-- Комментарии к таблицам и полям
COMMENT ON COLUMN "Users"."TotalOrdersAmount" IS 'Общая сумма всех завершенных заказов клиента';
COMMENT ON COLUMN "Users"."CurrentDiscount" IS 'Текущий процент скидки клиента (0-100)';
COMMENT ON COLUMN "Orders"."AppliedDiscount" IS 'Процент скидки, примененный к заказу';
COMMENT ON COLUMN "Orders"."DiscountAmount" IS 'Сумма скидки в BYN';
COMMENT ON TABLE "DiscountHistory" IS 'История изменений скидок пользователей для аудита';

-- Вывод информации о выполнении
SELECT 'Миграция программы лояльности выполнена успешно!' AS status;
SELECT 'Добавлены поля: Users.TotalOrdersAmount, Users.CurrentDiscount' AS info;
SELECT 'Добавлены поля: Orders.AppliedDiscount, Orders.DiscountAmount' AS info;
SELECT 'Создана таблица: DiscountHistory' AS info;
