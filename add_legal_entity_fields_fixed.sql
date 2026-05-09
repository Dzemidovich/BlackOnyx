-- Миграция: Добавление полей для юридических лиц (B2B) - ИСПРАВЛЕННАЯ ВЕРСИЯ
-- Дата: 2026-05-01
-- Описание: Добавляет поля для регистрации компаний в Беларуси
-- ВАЖНО: Поля создаются БЕЗ кавычек для совместимости с Entity Framework

-- Сначала удаляем старые поля с кавычками (если они были созданы)
ALTER TABLE Users DROP COLUMN IF EXISTS "CompanyName" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "Unp" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "LegalAddress" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "ActualAddress" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "BankName" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "BankCode" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "CheckingAccount" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "DirectorName" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "ContactPhone" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "ContactPerson" CASCADE;
ALTER TABLE Users DROP COLUMN IF EXISTS "IsLegalEntity" CASCADE;

-- Добавление новых полей БЕЗ кавычек (PostgreSQL преобразует в нижний регистр)
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS companyname VARCHAR(255),
ADD COLUMN IF NOT EXISTS unp VARCHAR(9),
ADD COLUMN IF NOT EXISTS legaladdress TEXT,
ADD COLUMN IF NOT EXISTS actualaddress TEXT,
ADD COLUMN IF NOT EXISTS bankname VARCHAR(255),
ADD COLUMN IF NOT EXISTS bankcode VARCHAR(9),
ADD COLUMN IF NOT EXISTS checkingaccount VARCHAR(28),
ADD COLUMN IF NOT EXISTS directorname VARCHAR(255),
ADD COLUMN IF NOT EXISTS contactphone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contactperson VARCHAR(255),
ADD COLUMN IF NOT EXISTS islegalentity BOOLEAN DEFAULT FALSE;

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_unp ON Users(unp) WHERE unp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_name ON Users(companyname) WHERE companyname IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_legal_entity ON Users(islegalentity);

-- Индексы для основных полей (если еще не созданы)
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
CREATE INDEX IF NOT EXISTS idx_users_isactive ON Users(isactive);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON Users(createdat);

-- Комментарии к полям
COMMENT ON COLUMN Users.companyname IS 'Название организации';
COMMENT ON COLUMN Users.unp IS 'УНП (Учетный номер плательщика) - 9 цифр';
COMMENT ON COLUMN Users.legaladdress IS 'Юридический адрес';
COMMENT ON COLUMN Users.actualaddress IS 'Фактический адрес доставки';
COMMENT ON COLUMN Users.bankname IS 'Название банка';
COMMENT ON COLUMN Users.bankcode IS 'БИК банка';
COMMENT ON COLUMN Users.checkingaccount IS 'Расчетный счет (IBAN)';
COMMENT ON COLUMN Users.directorname IS 'ФИО директора';
COMMENT ON COLUMN Users.contactphone IS 'Контактный телефон';
COMMENT ON COLUMN Users.contactperson IS 'Контактное лицо для связи';
COMMENT ON COLUMN Users.islegalentity IS 'Тип клиента: true - юридическое лицо, false - физическое лицо';

-- Проверка: УНП должен быть 9 цифр
ALTER TABLE Users DROP CONSTRAINT IF EXISTS chk_unp_format;
ALTER TABLE Users 
ADD CONSTRAINT chk_unp_format 
CHECK (unp IS NULL OR unp ~ '^[0-9]{9}$');

-- Проверка: БИК должен быть 9 символов (только если заполнен и не пустая строка)
ALTER TABLE Users DROP CONSTRAINT IF EXISTS chk_bank_code_format;
ALTER TABLE Users 
ADD CONSTRAINT chk_bank_code_format 
CHECK (bankcode IS NULL OR bankcode = '' OR LENGTH(bankcode) = 9);

-- Проверка: Расчетный счет должен быть 28 символов (только если заполнен и не пустая строка)
ALTER TABLE Users DROP CONSTRAINT IF EXISTS chk_checking_account_format;
ALTER TABLE Users 
ADD CONSTRAINT chk_checking_account_format 
CHECK (checkingaccount IS NULL OR checkingaccount = '' OR LENGTH(checkingaccount) = 28);

-- Индексы для других таблиц (оптимизация производительности)
CREATE INDEX IF NOT EXISTS idx_products_categoryid ON Products(categoryid);
CREATE INDEX IF NOT EXISTS idx_products_isactive ON Products(isactive);
CREATE INDEX IF NOT EXISTS idx_products_price ON Products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON Products(stock);

CREATE INDEX IF NOT EXISTS idx_orders_userid ON Orders(userid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON Orders(createdat);

CREATE INDEX IF NOT EXISTS idx_orderitems_orderid ON OrderItems(orderid);
CREATE INDEX IF NOT EXISTS idx_orderitems_productid ON OrderItems(productid);

CREATE INDEX IF NOT EXISTS idx_carts_userid ON Carts(userid);
CREATE INDEX IF NOT EXISTS idx_cartitems_cartid ON CartItems(cartid);
CREATE INDEX IF NOT EXISTS idx_cartitems_productid ON CartItems(productid);

CREATE INDEX IF NOT EXISTS idx_notifications_userid ON Notifications(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_isread ON Notifications(isread);

CREATE INDEX IF NOT EXISTS idx_productattributes_productid ON ProductAttributes(productid);
CREATE INDEX IF NOT EXISTS idx_productattributes_attrname ON ProductAttributes(attrname);

-- Вывод результата
SELECT 'Миграция успешно выполнена! Добавлены поля для юридических лиц и индексы.' AS result;
