$csvFile = "export_universal_2026.csv"

# Read first 500 chars
$content = Get-Content $csvFile -Raw -Encoding UTF8
Write-Host "File length: $($content.Length)"
Write-Host "First 500 chars:"
Write-Host $content.Substring(0, 500)

# Test regex
$pattern = '"([^"]+)";([^";]+)";([^";]+)";([^";]+)";([^"]+)";(https://[^"]+)'
Write-Host "`nTesting regex..."
$allMatches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::MultiLine)
Write-Host "Matches found: $($allMatches.Count)"
