-- ФИНАЛЬНЫЙ СКРИПТ исправления для PostgreSQL
-- Этот скрипт работает независимо от регистра имени таблицы

-- ============================================
-- ШАГ 1: Определяем правильное имя таблицы
-- ============================================

DO $$
DECLARE
    table_exists_lower boolean;
    table_exists_upper boolean;
    target_table text;
BEGIN
    -- Проверяем существование таблицы users (lowercase)
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists_lower;
    
    -- Проверяем существование таблицы Users (PascalCase)
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
    ) INTO table_exists_upper;
    
    -- Определяем какую таблицу использовать
    IF table_exists_lower THEN
        target_table := 'users';
        RAISE NOTICE 'Используем таблицу: users (lowercase)';
    ELSIF table_exists_upper THEN
        target_table := 'Users';
        RAISE NOTICE 'Используем таблицу: Users (PascalCase)';
    ELSE
        RAISE EXCEPTION 'Таблица users не найдена!';
    END IF;
    
    -- Сохраняем имя таблицы во временную переменную
    EXECUTE format('CREATE TEMP TABLE IF NOT EXISTS temp_table_name (name text)');
    EXECUTE format('DELETE FROM temp_table_name');
    EXECUTE format('INSERT INTO temp_table_name VALUES (%L)', target_table);
END $$;

-- ============================================
-- ШАГ 2: Добавляем поля (используя правильное имя таблицы)
-- ============================================

-- Для таблицы users (lowercase)
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS companyname VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS unp VARCHAR(9);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS legaladdress TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS actualaddress TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS bankname VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS bankcode VARCHAR(9);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS checkingaccount VARCHAR(28);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS directorname VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS contactphone VARCHAR(20);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS contactperson VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS islegalentity BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS registrationstatus VARCHAR(20) DEFAULT 'approved';
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS rejectionreason TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS moderatedat TIMESTAMP;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS moderatedby INTEGER;

-- Для таблицы Users (PascalCase) - на случай если она так называется
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS companyname VARCHAR(255);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS unp VARCHAR(9);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS legaladdress TEXT;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS actualaddress TEXT;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS bankname VARCHAR(255);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS bankcode VARCHAR(9);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS checkingaccount VARCHAR(28);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS directorname VARCHAR(255);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS contactphone VARCHAR(20);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS contactperson VARCHAR(255);
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS islegalentity BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS registrationstatus VARCHAR(20) DEFAULT 'approved';
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS rejectionreason TEXT;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS moderatedat TIMESTAMP;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS moderatedby INTEGER;

-- ============================================
-- ШАГ 3: Создаём индексы
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_unp ON users(unp);
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registrationstatus);
CREATE INDEX IF NOT EXISTS idx_users_islegalentity ON users(islegalentity);

-- Для таблицы с большой буквы
CREATE INDEX IF NOT EXISTS idx_Users_unp ON "Users"(unp);
CREATE INDEX IF NOT EXISTS idx_Users_registration_status ON "Users"(registrationstatus);
CREATE INDEX IF NOT EXISTS idx_Users_islegalentity ON "Users"(islegalentity);

-- ============================================
-- ШАГ 4: Обновляем существующие данные
-- ============================================

UPDATE users SET islegalentity = false WHERE islegalentity IS NULL;
UPDATE users SET registrationstatus = 'approved' WHERE registrationstatus IS NULL AND isactive = true;
UPDATE users SET registrationstatus = 'pending' WHERE registrationstatus IS NULL AND (isactive = false OR isactive IS NULL);

UPDATE "Users" SET islegalentity = false WHERE islegalentity IS NULL;
UPDATE "Users" SET registrationstatus = 'approved' WHERE registrationstatus IS NULL AND isactive = true;
UPDATE "Users" SET registrationstatus = 'pending' WHERE registrationstatus IS NULL AND (isactive = false OR isactive IS NULL);

-- ============================================
-- ШАГ 5: ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Показываем какая таблица используется
SELECT 
    table_name,
    'Таблица найдена' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'users' OR table_name = 'Users');

-- Показываем все добавленные поля
SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (table_name = 'users' OR table_name = 'Users')
AND column_name IN (
    'companyname', 'unp', 'legaladdress', 'actualaddress',
    'bankname', 'bankcode', 'checkingaccount', 'directorname',
    'contactphone', 'contactperson', 'islegalentity',
    'registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby'
)
ORDER BY table_name, column_name;

-- Показываем количество добавленных полей
SELECT 
    COUNT(*) as added_columns_count,
    'Должно быть 15 полей' as expected
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (table_name = 'users' OR table_name = 'Users')
AND column_name IN (
    'companyname', 'unp', 'legaladdress', 'actualaddress',
    'bankname', 'bankcode', 'checkingaccount', 'directorname',
    'contactphone', 'contactperson', 'islegalentity',
    'registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby'
);

SELECT '✓ Скрипт выполнен! Проверьте результаты выше.' AS result;
