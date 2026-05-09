-- =====================================================
-- ИСПРАВЛЕНИЕ: Проблема с автоматическим одобрением
-- =====================================================
-- Проблема: В Database_postgresql.sql есть строка которая 
-- автоматически одобряет всех pending пользователей

-- ШАГ 1: Проверяем текущее состояние
SELECT 
    id,
    email,
    fullname,
    islegalentity,
    registrationstatus,
    isactive,
    createdat,
    moderatedat
FROM users
ORDER BY createdat DESC;

-- ШАГ 2: Сбрасываем статусы для тестирования
-- ВНИМАНИЕ: Это переведет ВСЕХ пользователей (кроме админов) в pending
-- Раскомментируй если нужно сбросить:

/*
UPDATE users 
SET 
    registrationstatus = 'pending',
    isactive = false,
    rejectionreason = NULL,
    moderatedat = NULL,
    moderatedby = NULL
WHERE role != 'Admin';
*/

-- ШАГ 3: Или исправляем только конкретного пользователя
-- Замени email на нужный:

UPDATE users 
SET 
    registrationstatus = 'pending',
    isactive = false,
    rejectionreason = NULL,
    moderatedat = NULL,
    moderatedby = NULL
WHERE email = 'dzemidovichandrew@gmail.com';

-- ШАГ 4: Проверяем результат
SELECT 
    id,
    email,
    fullname,
    registrationstatus,
    isactive
FROM users
WHERE email = 'dzemidovichandrew@gmail.com';

-- ШАГ 5: Проверяем что pending пользователи есть
SELECT 
    COUNT(*) as pending_count
FROM users
WHERE registrationstatus = 'pending';

-- =====================================================
-- ВАЖНО ДЛЯ PRODUCTION:
-- =====================================================
-- В файле Database_postgresql.sql нужно УДАЛИТЬ или ЗАКОММЕНТИРОВАТЬ эту строку:
-- 
-- UPDATE users 
-- SET registrationstatus = 'approved', 
--     moderatedat = createdat 
-- WHERE registrationstatus IS NULL OR registrationstatus = 'pending';
--
-- Эта строка автоматически одобряет всех пользователей!
-- =====================================================
