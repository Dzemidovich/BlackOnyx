-- Проверка проблемы с автоматическим отклонением регистраций

-- 1. Посмотреть последние регистрации
SELECT 
    id,
    email,
    fullname,
    islegalentity,
    registrationstatus,
    rejectionreason,
    isactive,
    createdat,
    moderatedat,
    moderatedby
FROM users
ORDER BY createdat DESC
LIMIT 10;

-- 2. Найти пользователя Сидоренко Валерия
SELECT 
    id,
    email,
    fullname,
    islegalentity,
    registrationstatus,
    rejectionreason,
    isactive,
    createdat,
    moderatedat,
    moderatedby
FROM users
WHERE email = 'dzemidovichandrew@gmail.com';

-- 3. Проверить есть ли триггеры на таблице users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 4. Проверить constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users';

-- 5. Если нужно исправить статус для конкретного пользователя
-- UPDATE users 
-- SET registrationstatus = 'pending',
--     rejectionreason = NULL,
--     moderatedat = NULL,
--     moderatedby = NULL
-- WHERE email = 'dzemidovichandrew@gmail.com';
