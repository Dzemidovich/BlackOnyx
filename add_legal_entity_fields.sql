-- Миграция: Добавление полей для юридических лиц (B2B)
-- Дата: 2026-05-01
-- Описание: Добавляет поля для регистрации компаний в Беларуси

-- Добавление новых полей в таблицу Users
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "CompanyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "Unp" VARCHAR(9),
ADD COLUMN IF NOT EXISTS "LegalAddress" TEXT,
ADD COLUMN IF NOT EXISTS "ActualAddress" TEXT,
ADD COLUMN IF NOT EXISTS "BankName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "BankCode" VARCHAR(9),
ADD COLUMN IF NOT EXISTS "CheckingAccount" VARCHAR(28),
ADD COLUMN IF NOT EXISTS "DirectorName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ContactPhone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "ContactPerson" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "IsLegalEntity" BOOLEAN DEFAULT FALSE;

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_unp ON "Users"("Unp") WHERE "Unp" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_name ON "Users"("CompanyName") WHERE "CompanyName" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_legal_entity ON "Users"("IsLegalEntity");

-- Комментарии к полям
COMMENT ON COLUMN "Users"."CompanyName" IS 'Название организации';
COMMENT ON COLUMN "Users"."Unp" IS 'УНП (Учетный номер плательщика) - 9 цифр';
COMMENT ON COLUMN "Users"."LegalAddress" IS 'Юридический адрес';
COMMENT ON COLUMN "Users"."ActualAddress" IS 'Фактический адрес доставки';
COMMENT ON COLUMN "Users"."BankName" IS 'Название банка';
COMMENT ON COLUMN "Users"."BankCode" IS 'БИК банка';
COMMENT ON COLUMN "Users"."CheckingAccount" IS 'Расчетный счет (IBAN)';
COMMENT ON COLUMN "Users"."DirectorName" IS 'ФИО директора';
COMMENT ON COLUMN "Users"."ContactPhone" IS 'Контактный телефон';
COMMENT ON COLUMN "Users"."ContactPerson" IS 'Контактное лицо для связи';
COMMENT ON COLUMN "Users"."IsLegalEntity" IS 'Тип клиента: true - юридическое лицо, false - физическое лицо';

-- Проверка: УНП должен быть 9 цифр
ALTER TABLE "Users" 
ADD CONSTRAINT chk_unp_format 
CHECK ("Unp" IS NULL OR "Unp" ~ '^[0-9]{9}$');

-- Проверка: БИК должен быть 9 символов
ALTER TABLE "Users" 
ADD CONSTRAINT chk_bank_code_format 
CHECK ("BankCode" IS NULL OR LENGTH("BankCode") = 9);

-- Проверка: Расчетный счет должен быть 28 символов (IBAN BY)
ALTER TABLE "Users" 
ADD CONSTRAINT chk_checking_account_format 
CHECK ("CheckingAccount" IS NULL OR LENGTH("CheckingAccount") = 28);

-- Проверка: Если юридическое лицо, то обязательны CompanyName и UNP
-- (эта проверка будет на уровне приложения для гибкости)

COMMENT ON TABLE "Users" IS 'Пользователи системы (физические и юридические лица)';

-- Вывод результата
SELECT 'Миграция успешно выполнена! Добавлены поля для юридических лиц.' AS result;
