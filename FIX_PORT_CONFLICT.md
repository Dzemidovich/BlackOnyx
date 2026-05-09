# Исправление конфликта портов

## Проблема
```
Failed to bind to address http://[::]:8888: address already in use
```

Порт 8888 уже занят другим процессом.

## Решение 1: Остановить старый процесс (РЕКОМЕНДУЕТСЯ)

### Windows PowerShell:
```powershell
# Найти процесс на порту 8888
netstat -ano | findstr :8888

# Остановить процесс (замените PID на номер из предыдущей команды)
taskkill /PID <номер_процесса> /F

# Пример:
# taskkill /PID 12345 /F
```

### Или через один шаг:
```powershell
# Автоматически найти и убить процесс на порту 8888
$port = 8888
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Процесс $process на порту $port остановлен"
} else {
    Write-Host "Процесс на порту $port не найден"
}
```

## Решение 2: Изменить порт в настройках

Если не хотите останавливать старый процесс, измените порт в `Properties/launchSettings.json`:

```json
{
  "profiles": {
    "Diplom": {
      "applicationUrl": "http://localhost:8889",  // ← изменить с 8888 на 8889
      ...
    }
  }
}
```

## После исправления

Запустите сервер заново:
```bash
dotnet run
```

## Проверка
Откройте браузер:
- Если использовали решение 1: `http://localhost:8888`
- Если использовали решение 2: `http://localhost:8889`
