-- ПРОСТОЙ СКРИПТ для добавления полей модерации
-- Если поле уже существует, будет ошибка - это нормально, продолжайте выполнение

-- 1. Добавляем поле статуса регистрации
ALTER TABLE users ADD COLUMN registrationstatus VARCHAR(20) DEFAULT 'approved';

-- 2. Добавляем поле причины отклонения
ALTER TABLE users ADD COLUMN rejectionreason TEXT NULL;

-- 3. Добавляем поле даты модерации
ALTER TABLE users ADD COLUMN moderatedat DATETIME NULL;

-- 4. Добавляем поле ID модератора
ALTER TABLE users ADD COLUMN moderatedby INT NULL;

-- 5. Создаём индекс
CREATE INDEX idx_users_registration_status ON users(registrationstatus);

-- 6. Обновляем существующих пользователей
UPDATE users SET registrationstatus = 'approved' WHERE isactive = 1;
UPDATE users SET registrationstatus = 'pending' WHERE isactive = 0 OR isactive IS NULL;

-- 7. ПРОВЕРКА - выполните этот запрос и пришлите результат
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby');
