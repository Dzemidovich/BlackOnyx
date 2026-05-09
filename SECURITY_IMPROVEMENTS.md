# Улучшения безопасности

## ✅ Что было сделано:

### 1. Rate Limiting (защита от брутфорса)
- **Глобальный лимит**: 100 запросов в минуту с одного IP
- **Вход**: 5 попыток за 15 минут
- **Регистрация**: 3 попытки в час

### 2. Валидация входных данных
- Проверка формата email
- Минимальная длина пароля: 8 символов
- Пароль должен содержать буквы и цифры

### 3. JWT токены
- Срок жизни сокращён с 24 часов до 2 часов
- Добавлен уникальный ID токена (JTI)
- Поддержка переменных окружения для секретного ключа

### 4. CORS (защита от CSRF)
- В разработке: только localhost
- В production: только указанные домены из переменных окружения
- Строгая политика методов и заголовков

### 5. Security Headers
- `X-Content-Type-Options: nosniff` - защита от MIME sniffing
- `X-Frame-Options: DENY` - защита от clickjacking
- `X-XSS-Protection: 1; mode=block` - защита от XSS
- `Content-Security-Policy` - контроль загрузки ресурсов
- `Referrer-Policy` - контроль передачи referrer

### 6. Password Hashing
- Используется BCrypt (уже было)
- Автоматическая соль для каждого пароля

---

## 🔧 Что нужно настроить:

### 1. Сгенерируйте JWT Secret Key

**Windows PowerShell:**
```powershell
# Создайте файл generate_jwt_key.ps1
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
Write-Host "JWT_SECRET_KEY=$key"
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

### 2. Создайте .env файл

```bash
cp .env.example .env
```

Заполните:
```env
JWT_SECRET_KEY=ваш_сгенерированный_ключ_из_шага_1
ALLOWED_ORIGINS=https://yourdomain.com
ConnectionStrings__DefaultConnection=Host=...;Database=...
```

### 3. Настройте HTTPS

**Для разработки (самоподписанный сертификат):**
```bash
dotnet dev-certs https --trust
```

**Для production:**
- Используйте Let's Encrypt (бесплатно)
- Или сертификат от хостинга
- Или настройте reverse proxy (nginx/apache) с SSL

---

## ⚠️ ВАЖНО для Production:

### Обязательно:
1. ✅ Сгенерируйте новый JWT_SECRET_KEY (минимум 32 символа)
2. ✅ Укажите реальные домены в ALLOWED_ORIGINS
3. ✅ Включите HTTPS
4. ✅ Используйте сильный пароль для БД
5. ✅ НЕ коммитьте .env файл в git

### Рекомендуется:
6. Настройте логирование (Serilog/NLog)
7. Добавьте мониторинг (Application Insights/Prometheus)
8. Настройте автоматические бэкапы БД
9. Добавьте email подтверждение при регистрации
10. Добавьте 2FA для администраторов

---

## 🧪 Тестирование:

### 1. Проверьте Rate Limiting

```bash
# Попробуйте войти 6 раз подряд с неверным паролем
# 6-я попытка должна вернуть 429 Too Many Requests
```

### 2. Проверьте валидацию

```bash
# Попробуйте зарегистрироваться с паролем "123"
# Должна быть ошибка "Пароль должен содержать минимум 8 символов"
```

### 3. Проверьте CORS

```bash
# Попробуйте сделать запрос с другого домена
# Должна быть ошибка CORS
```

### 4. Проверьте Security Headers

```bash
curl -I http://localhost:8888
# Должны быть заголовки X-Content-Type-Options, X-Frame-Options и т.д.
```

---

## 📝 Что ещё можно улучшить:

### Средний приоритет:
- [ ] Refresh tokens (для продления сессии без повторного входа)
- [ ] Email подтверждение при регистрации
- [ ] Восстановление пароля через email
- [ ] Логирование всех попыток входа
- [ ] Audit log (кто что когда делал)

### Низкий приоритет:
- [ ] 2FA (двухфакторная аутентификация)
- [ ] Captcha на формах входа/регистрации
- [ ] Session management (отзыв токенов)
- [ ] IP whitelist для админов
- [ ] Автоматическая блокировка подозрительных IP

---

## 🚀 Запуск после изменений:

```bash
# 1. Пересоберите проект
dotnet build

# 2. Запустите
dotnet run

# 3. Проверьте что всё работает
# - Регистрация
# - Вход
# - Доступ к защищённым эндпоинтам
```

---

## 🆘 Если что-то сломалось:

### Ошибка: "Rate limiter not found"
```bash
# Убедитесь что установлен пакет
dotnet add package Microsoft.AspNetCore.RateLimiting
```

### Ошибка: "ALLOWED_ORIGINS must be configured"
```bash
# В production обязательно укажите ALLOWED_ORIGINS
# Или временно закомментируйте проверку в Program.cs
```

### Ошибка: "Invalid JWT token"
```bash
# Убедитесь что JWT_SECRET_KEY одинаковый при генерации и проверке
# Проверьте переменные окружения
```

---

## 📚 Дополнительные ресурсы:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ASP.NET Core Security](https://docs.microsoft.com/en-us/aspnet/core/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
