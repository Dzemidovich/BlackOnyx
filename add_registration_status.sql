-- Добавление статуса регистрации для модерации
-- Дата: 2026-05-01

-- Добавляем поле статуса регистрации
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS registrationstatus VARCHAR(20) DEFAULT 'pending';

-- Возможные статусы: 'pending' (ожидает), 'approved' (одобрено), 'rejected' (отклонено)

-- Добавляем поле с причиной отклонения
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rejectionreason TEXT;

-- Добавляем поле с датой модерации
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS moderatedat TIMESTAMP;

-- Добавляем поле с ID модератора
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS moderatedby INT;

-- Создаём индекс для быстрого поиска заявок на модерацию
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registrationstatus);

-- Обновляем существующих пользователей (они уже одобрены)
UPDATE users 
SET registrationstatus = 'approved', 
    moderatedat = createdat 
WHERE registrationstatus IS NULL OR registrationstatus = 'pending';

-- Комментарии
COMMENT ON COLUMN users.registrationstatus IS 'Статус регистрации: pending, approved, rejected';
COMMENT ON COLUMN users.rejectionreason IS 'Причина отклонения заявки';
COMMENT ON COLUMN users.moderatedat IS 'Дата модерации заявки';
COMMENT ON COLUMN users.moderatedby IS 'ID администратора, который модерировал заявку';

SELECT 'Поля для модерации регистраций добавлены успешно!' AS result;
