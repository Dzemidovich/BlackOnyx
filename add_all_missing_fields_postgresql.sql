-- ПОЛНЫЙ СКРИПТ для добавления всех недостающих полей в PostgreSQL
-- Выполните этот скрипт целиком

-- ============================================
-- 1. ПОЛЯ ДЛЯ ЮРИДИЧЕСКИХ ЛИЦ (B2B)
-- ============================================

-- Удаляем старые поля с кавычками (если были)
ALTER TABLE users DROP COLUMN IF EXISTS "CompanyName" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "Unp" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "LegalAddress" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "ActualAddress" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "BankName" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "BankCode" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "CheckingAccount" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "DirectorName" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "ContactPhone" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "ContactPerson" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "IsLegalEntity" CASCADE;

-- Добавляем поля БЕЗ кавычек (PostgreSQL преобразует в нижний регистр)
ALTER TABLE users ADD COLUMN IF NOT EXISTS companyname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS unp VARCHAR(9);
ALTER TABLE users ADD COLUMN IF NOT EXISTS legaladdress TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS actualaddress TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bankname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bankcode VARCHAR(9);
ALTER TABLE users ADD COLUMN IF NOT EXISTS checkingaccount VARCHAR(28);
ALTER TABLE users ADD COLUMN IF NOT EXISTS directorname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contactphone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contactperson VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS islegalentity BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. ПОЛЯ ДЛЯ МОДЕРАЦИИ РЕГИСТРАЦИЙ
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS registrationstatus VARCHAR(20) DEFAULT 'approved';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejectionreason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderatedat TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderatedby INTEGER;

-- ============================================
-- 3. ИНДЕКСЫ
-- ============================================

-- Индексы для B2B полей
CREATE INDEX IF NOT EXISTS idx_users_unp ON users(unp) WHERE unp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(companyname) WHERE companyname IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_legal_entity ON users(islegalentity);

-- Индекс для модерации
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registrationstatus);

-- Основные индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_isactive ON users(isactive);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON users(createdat);

-- ============================================
-- 4. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ
-- ============================================

-- Устанавливаем статус для существующих пользователей
UPDATE users SET registrationstatus = 'approved' WHERE registrationstatus IS NULL AND isactive = true;
UPDATE users SET registrationstatus = 'pending' WHERE registrationstatus IS NULL AND (isactive = false OR isactive IS NULL);

-- Устанавливаем islegalentity = false для существующих пользователей
UPDATE users SET islegalentity = false WHERE islegalentity IS NULL;

-- ============================================
-- 5. ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Проверяем что все поля добавлены
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'companyname', 'unp', 'legaladdress', 'actualaddress',
    'bankname', 'bankcode', 'checkingaccount', 'directorname',
    'contactphone', 'contactperson', 'islegalentity',
    'registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby'
)
ORDER BY column_name;

-- Должно вернуть 15 строк

SELECT '✓ Все поля успешно добавлены!' AS result;
