# Скрипт для разбивки большого CSV файла на части
param(
    [string]$InputFile = "export_universal_2026-02-13_1770944070_193769110.csv",
    [int]$ChunkSize = 1000  # Количество товаров в каждом файле
)

Write-Host "Чтение файла $InputFile..."

# Читаем файл с правильной кодировкой
$content = Get-Content $InputFile -Encoding UTF8 -Raw

# Разбиваем на строки
$lines = $content -split "`r?`n"
$header = $lines[0]

Write-Host "Всего строк: $($lines.Count)"
Write-Host "Заголовок: $header"

# Счетчик для отслеживания товаров (не строк!)
$productCount = 0
$chunkNumber = 1
$currentChunk = @($header)
$inQuotes = $false
$currentRecord = ""

for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Пропускаем пустые строки в конце
    if ([string]::IsNullOrWhiteSpace($line) -and $i -eq ($lines.Count - 1)) {
        continue
    }
    
    # Добавляем строку к текущей записи
    if ($currentRecord -ne "") {
        $currentRecord += "`n" + $line
    } else {
        $currentRecord = $line
    }
    
    # Подсчитываем кавычки для определения конца записи
    $quoteCount = ($currentRecord.ToCharArray() | Where-Object { $_ -eq '"' }).Count
    
    # Если количество кавычек четное, запись завершена
    if ($quoteCount % 2 -eq 0) {
        $currentChunk += $currentRecord
        $currentRecord = ""
        $productCount++
        
        # Если достигли размера чанка, сохраняем файл
        if ($productCount -ge $ChunkSize) {
            $outputFile = "export_chunk_$chunkNumber.csv"
            $currentChunk -join "`n" | Out-File -FilePath $outputFile -Encoding UTF8
            Write-Host "Создан файл $outputFile с $productCount товарами"
            
            # Сбрасываем для следующего чанка
            $chunkNumber++
            $productCount = 0
            $currentChunk = @($header)
        }
    }
}

# Сохраняем последний чанк, если есть данные
if ($currentChunk.Count -gt 1) {
    $outputFile = "export_chunk_$chunkNumber.csv"
    $currentChunk -join "`n" | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "Создан файл $outputFile с $productCount товарами"
}

Write-Host "`nГотово! Создано $chunkNumber файлов."
Write-Host "Теперь можно импортировать каждый файл отдельно через веб-интерфейс."
