# Быстрый старт: Безопасность

## ✅ Что уже сделано автоматически:

1. ✅ Rate Limiting (защита от брутфорса)
2. ✅ Валидация паролей (минимум 8 символов, буквы + цифры)
3. ✅ JWT токены с коротким сроком жизни (2 часа)
4. ✅ Строгий CORS
5. ✅ Security Headers (XSS, Clickjacking защита)
6. ✅ XSS защита в JavaScript (функция escapeHtml)

## 🔧 Что нужно сделать СЕЙЧАС:

### 1. Сгенерируйте JWT Secret Key

```powershell
.\generate_jwt_key.ps1
```

Скопируйте сгенерированный ключ.

### 2. Создайте .env файл (для локальной разработки)

```bash
# Скопируйте пример
cp .env.example .env
```

Откройте `.env` и вставьте ключ:
```env
JWT_SECRET_KEY=ваш_сгенерированный_ключ
```

### 3. Пересоберите и запустите

```bash
dotnet build
dotnet run
```

### 4. Проверьте что всё работает

- Попробуйте зарегистрироваться
- Попробуйте войти
- Проверьте что токен работает

---

## 🚀 Для Production (перед деплоем):

### 1. Настройте переменные окружения на сервере:

```env
JWT_SECRET_KEY=новый_случайный_ключ_для_продакшена
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ConnectionStrings__DefaultConnection=Host=...;Database=...;Password=...
ASPNETCORE_ENVIRONMENT=Production
```

### 2. Включите HTTPS

- Получите SSL сертификат (Let's Encrypt бесплатно)
- Или настройте reverse proxy (nginx) с SSL

### 3. Проверьте безопасность

```bash
# Проверьте заголовки безопасности
curl -I https://yourdomain.com

# Должны быть:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

## ⚠️ КРИТИЧНО:

- ❌ НЕ используйте дефолтный JWT ключ из appsettings.json
- ❌ НЕ коммитьте .env файл в git
- ❌ НЕ используйте HTTP в production (только HTTPS)
- ❌ НЕ разрешайте AllowAnyOrigin в CORS

---

## 🆘 Если что-то не работает:

### Ошибка при сборке:
```bash
# Установите пакет Rate Limiting
dotnet add package Microsoft.AspNetCore.RateLimiting
```

### Приложение не запускается:
```bash
# Проверьте что JWT_SECRET_KEY установлен
echo $env:JWT_SECRET_KEY  # Windows
echo $JWT_SECRET_KEY      # Linux/Mac
```

### CORS блокирует запросы:
- В разработке: используйте http://localhost:8888
- В production: добавьте домен в ALLOWED_ORIGINS

---

## 📝 Дополнительно (необязательно):

- Настройте логирование (Serilog)
- Добавьте мониторинг (Application Insights)
- Настройте автоматические бэкапы БД
- Добавьте email подтверждение
- Добавьте 2FA для админов

Подробнее см. `SECURITY_IMPROVEMENTS.md`
