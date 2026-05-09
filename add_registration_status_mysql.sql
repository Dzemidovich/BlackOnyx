-- Добавление полей модерации для MySQL/MariaDB
-- Выполните этот скрипт в вашей базе данных

-- Проверяем существующие столбцы
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby');

-- Добавляем поле статуса регистрации (если не существует)
SET @query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'registrationstatus') = 0,
    'ALTER TABLE users ADD COLUMN registrationstatus VARCHAR(20) DEFAULT ''approved'' AFTER isactive',
    'SELECT ''Column registrationstatus already exists'' AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем поле причины отклонения (если не существует)
SET @query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rejectionreason') = 0,
    'ALTER TABLE users ADD COLUMN rejectionreason TEXT NULL AFTER registrationstatus',
    'SELECT ''Column rejectionreason already exists'' AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем поле даты модерации (если не существует)
SET @query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'moderatedat') = 0,
    'ALTER TABLE users ADD COLUMN moderatedat DATETIME NULL AFTER rejectionreason',
    'SELECT ''Column moderatedat already exists'' AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем поле ID модератора (если не существует)
SET @query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'moderatedby') = 0,
    'ALTER TABLE users ADD COLUMN moderatedby INT NULL AFTER moderatedat',
    'SELECT ''Column moderatedby already exists'' AS message'
);
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Обновляем существующих пользователей (устанавливаем approved для активных)
UPDATE users 
SET registrationstatus = 'approved'
WHERE registrationstatus IS NULL AND isactive = 1;

-- Устанавливаем pending для неактивных
UPDATE users 
SET registrationstatus = 'pending'
WHERE registrationstatus IS NULL AND (isactive = 0 OR isactive IS NULL);

-- Создаём индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registrationstatus);

-- Проверяем результат
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('registrationstatus', 'rejectionreason', 'moderatedat', 'moderatedby')
ORDER BY ORDINAL_POSITION;

SELECT '✓ Поля модерации добавлены успешно!' AS result;
