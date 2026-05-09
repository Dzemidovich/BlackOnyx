-- Добавление полей модерации в PascalCase (как остальные поля в БД)

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "RegistrationStatus" VARCHAR(20) DEFAULT 'approved';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "RejectionReason" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "ModeratedAt" TIMESTAMP;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "ModeratedBy" INTEGER;

-- Создаём индекс
CREATE INDEX IF NOT EXISTS "idx_Users_RegistrationStatus" ON "Users"("RegistrationStatus");

-- Обновляем существующих пользователей
UPDATE "Users" SET "RegistrationStatus" = 'approved' WHERE "RegistrationStatus" IS NULL AND "IsActive" = true;
UPDATE "Users" SET "RegistrationStatus" = 'pending' WHERE "RegistrationStatus" IS NULL AND ("IsActive" = false OR "IsActive" IS NULL);

-- Проверка
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND column_name IN ('RegistrationStatus', 'RejectionReason', 'ModeratedAt', 'ModeratedBy')
ORDER BY column_name;

SELECT '✓ Поля модерации добавлены!' AS result;
