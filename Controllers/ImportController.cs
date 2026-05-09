using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

namespace Diplom.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly ToolShopDbContext _context;
    private readonly Services.ImportBackgroundService _importService;

    // Mapping for CSV headers to internal keys
    private readonly Dictionary<string, string> _headerMapping = new()
    {
        // Russian headers
        { "Артикул", "Article" },
        { "Название", "Name" },
        { "Описание", "Description" },
        { "Цена", "Price" },
        { "Количество", "Stock" },
        { "Категория", "CategoryName" },
        { "Изображение", "ImageUrl" },
        // English headers from export_universal_2026.csv
        { "vendor_code", "Article" },
        { "name", "Name" },
        { "description", "Description" },
        { "price_prepaid", "Price" },
        { "warehouse_main", "Stock" },
        { "media_img", "ImageUrl" }
    };

    public ImportController(ToolShopDbContext context, Services.ImportBackgroundService importService)
    {
        _context = context;
        _importService = importService;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Manager")]
    [RequestSizeLimit(104857600)] // 100 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string mode = "upsert", [FromQuery] bool isDryRun = false)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required");

        if (!file.FileName.EndsWith(".csv"))
            return BadRequest("Only CSV files are allowed");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        var userId = int.Parse(userIdClaim.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return Unauthorized("Пользователь не найден");

        if (user.Role == "Manager" && mode != "upsert")
            return BadRequest("Managers can only use upsert mode");

        var importJob = new ImportJob
        {
            UserId = userId,
            FileName = file.FileName,
            Status = "pending",
            ImportMode = mode,
            IsDryRun = isDryRun,
            TotalRows = 0,
            ProcessedRows = 0,
            ErrorsCount = 0,
            ImportVersion = Guid.NewGuid().ToString()
        };

        _context.ImportJobs.Add(importJob);
        await _context.SaveChangesAsync();

        using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
        using (var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            MissingFieldFound = null,
            BadDataFound = null,
            Delimiter = ";",
            Mode = CsvMode.RFC4180 // Properly handle quoted fields with newlines
        }))
        {
            try
            {
                var records = csv.GetRecords<dynamic>();
                
                var importRows = new List<ImportRow>();
                int rowNumber = 1;
                int batchSize = 1000; // Сохраняем каждые 1000 строк

                foreach (var record in records)
                {
                    var rawData = System.Text.Json.JsonSerializer.Serialize(record);
                    var importRow = new ImportRow
                    {
                        ImportJobId = importJob.Id,
                        RowNumber = rowNumber++,
                        RawData = rawData,
                        Status = "pending"
                    };
                    importRows.Add(importRow);

                    // Сохраняем пакетами для экономии памяти
                    if (importRows.Count >= batchSize)
                    {
                        _context.ImportRows.AddRange(importRows);
                        await _context.SaveChangesAsync();
                        importRows.Clear();
                    }
                }

                // Сохраняем оставшиеся строки
                if (importRows.Count > 0)
                {
                    _context.ImportRows.AddRange(importRows);
                    await _context.SaveChangesAsync();
                }

                importJob.TotalRows = rowNumber - 1;
                
                if (importJob.TotalRows == 0)
                    return BadRequest("CSV file is empty or has no valid data");

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest($"Error reading CSV file: {ex.Message}");
            }
        }

        return Ok(new { importJobId = importJob.Id });
    }

    [HttpGet("jobs")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetImportJobs()
    {
        var jobs = await _context.ImportJobs
            .Include(j => j.User)
            .OrderByDescending(j => j.CreatedAt)
            .Take(50)
            .Select(j => new
            {
                j.Id,
                j.FileName,
                UserName = j.User != null ? j.User.FullName : "Unknown",
                j.ImportMode,
                j.Status,
                j.TotalRows,
                SuccessCount = j.ProcessedRows - j.ErrorsCount,
                ErrorCount = j.ErrorsCount,
                j.CreatedAt,
                j.CompletedAt
            })
            .ToListAsync();

        return Ok(jobs);
    }

    [HttpGet("status/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetStatus(int id)
    {
        var importJob = await _context.ImportJobs
            .Include(j => j.User)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (importJob == null)
            return NotFound();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        var userId = int.Parse(userIdClaim.Value);
        if (importJob.UserId != userId && User.FindFirst(ClaimTypes.Role)?.Value != "Admin")
            return Forbid();

        var progress = importJob.TotalRows > 0 
            ? (double)importJob.ProcessedRows / importJob.TotalRows * 100 
            : 0;

        return Ok(new
        {
            importJob.Id,
            importJob.FileName,
            UserName = importJob.User?.FullName ?? "Unknown",
            importJob.Status,
            importJob.TotalRows,
            importJob.ProcessedRows,
            importJob.ErrorsCount,
            SuccessCount = importJob.ProcessedRows - importJob.ErrorsCount,
            Progress = Math.Round(progress, 2),
            importJob.CreatedAt,
            importJob.CompletedAt,
            EstimatedTimeRemaining = EstimateTimeRemaining(importJob)
        });
    }

    private string EstimateTimeRemaining(ImportJob importJob)
    {
        if (importJob.Status != "processing" || importJob.ProcessedRows == 0)
            return "N/A";

        var elapsed = DateTime.UtcNow - importJob.CreatedAt;
        var rowsPerSecond = importJob.ProcessedRows / elapsed.TotalSeconds;
        var remainingRows = importJob.TotalRows - importJob.ProcessedRows;
        var estimatedSeconds = remainingRows / rowsPerSecond;

        if (estimatedSeconds < 60)
            return $"{Math.Round(estimatedSeconds)} сек";
        else if (estimatedSeconds < 3600)
            return $"{Math.Round(estimatedSeconds / 60)} мин";
        else
            return $"{Math.Round(estimatedSeconds / 3600, 1)} ч";
    }

    [HttpGet("preview/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Preview(int id)
    {
        var importJob = await _context.ImportJobs
            .Include(j => j.ImportRows)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (importJob == null)
            return NotFound();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        var userId = int.Parse(userIdClaim.Value);
        if (importJob.UserId != userId && User.FindFirst(ClaimTypes.Role)?.Value != "Admin")
            return Forbid();

        var previewRows = importJob.ImportRows
            .Take(10) // First 10 rows for preview
            .Select(r => new
            {
                r.RowNumber,
                Data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(r.RawData),
                r.Status,
                r.ErrorMessage
            });

        return Ok(new
        {
            importJob.Id,
            importJob.FileName,
            importJob.ImportMode,
            importJob.IsDryRun,
            importJob.TotalRows,
            PreviewRows = previewRows
        });
    }

    [HttpPost("execute/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Execute(int id, [FromQuery] bool background = true)
    {
        var importJob = await _context.ImportJobs
            .Include(j => j.ImportRows)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (importJob == null)
            return NotFound();

        if (importJob.Status != "pending")
            return BadRequest("Import job is not in pending status");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        var userId = int.Parse(userIdClaim.Value);
        if (importJob.UserId != userId && User.FindFirst(ClaimTypes.Role)?.Value != "Admin")
            return Forbid();

        if (background)
        {
            // Фоновая обработка (рекомендуется для больших файлов)
            _importService.EnqueueImport(importJob.Id);
            return Ok(new 
            { 
                importJob.Id, 
                Status = "queued", 
                Message = "Import job has been queued for background processing. Check status later.",
                importJob.TotalRows 
            });
        }
        else
        {
            // Синхронная обработка (для небольших файлов)
            importJob.Status = "processing";
            await _context.SaveChangesAsync();

            try
            {
                await ProcessImportJob(importJob);
                importJob.Status = "completed";
                importJob.CompletedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                importJob.Status = "failed";
                _context.ImportLogs.Add(new ImportLog
                {
                    ImportJobId = importJob.Id,
                    RowNumber = 0,
                    MessageType = "error",
                    Message = $"Import failed: {ex.Message}",
                    ImportVersion = importJob.ImportVersion
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { importJob.Id, importJob.Status, importJob.ProcessedRows, importJob.ErrorsCount });
        }
    }

    [HttpPost("rollback/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Rollback(int id)
    {
        var importJob = await _context.ImportJobs
            .Include(j => j.ImportLogs)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (importJob == null || importJob.Status != "completed")
            return BadRequest("Import job must be completed to rollback");

        // Rollback logic would reverse the changes based on ImportLogs
        // This is a simplified version

        importJob.Status = "rolled_back";
        await _context.SaveChangesAsync();

        return Ok(new { importJob.Id, importJob.Status });
    }

    private async Task ProcessImportJob(ImportJob importJob)
    {
        var importRows = await _context.ImportRows
            .Where(r => r.ImportJobId == importJob.Id)
            .ToListAsync();

        const int batchSize = 100; // Сохраняем каждые 100 записей
        int processedInBatch = 0;

        foreach (var importRow in importRows)
        {
            try
            {
                var data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(importRow.RawData);

                // Map Russian headers to English keys
                var mappedData = new Dictionary<string, object>();
                foreach (var kvp in data)
                {
                    var englishKey = _headerMapping.ContainsKey(kvp.Key) ? _headerMapping[kvp.Key] : kvp.Key;
                    mappedData[englishKey] = kvp.Value;
                }

                // Validate and process the row
                var validationResult = ValidateImportRow(mappedData, importJob.ImportMode);

                if (!validationResult.IsValid)
                {
                    importRow.Status = "error";
                    importRow.ErrorMessage = validationResult.ErrorMessage;
                    _context.ImportLogs.Add(new ImportLog
                    {
                        ImportJobId = importJob.Id,
                        RowNumber = importRow.RowNumber,
                        MessageType = "error",
                        Message = validationResult.ErrorMessage,
                        ImportVersion = importJob.ImportVersion
                    });
                    importJob.ErrorsCount++;
                    processedInBatch++;
                    continue;
                }

                if (!importJob.IsDryRun)
                {
                    var productId = await ProcessProductData(mappedData, importJob.Id, importRow.RowNumber, importJob.ImportVersion);
                    importRow.ProductId = productId;
                }

                importRow.Status = "processed";
                importJob.ProcessedRows++;
                processedInBatch++;

                // Сохраняем пакетами для оптимизации
                if (processedInBatch >= batchSize)
                {
                    await _context.SaveChangesAsync();
                    processedInBatch = 0;
                }
            }
            catch (Exception ex)
            {
                importRow.Status = "error";
                importRow.ErrorMessage = ex.Message;
                importJob.ErrorsCount++;
                processedInBatch++;
            }
        }

        // Сохраняем оставшиеся записи
        if (processedInBatch > 0)
        {
            await _context.SaveChangesAsync();
        }
    }

    private (bool IsValid, string ErrorMessage) ValidateImportRow(Dictionary<string, object> data, string mode)
    {
        if (!data.ContainsKey("Article") || string.IsNullOrEmpty(data["Article"]?.ToString()))
            return (false, "Article is required");

        var article = data["Article"].ToString();

        // Check if product exists for update_only mode
        if (mode == "update_only")
        {
            var exists = _context.Products.Any(p => p.Article == article);
            if (!exists)
                return (false, $"Product with Article '{article}' does not exist");
        }

        // Check if product doesn't exist for create_only mode
        if (mode == "create_only")
        {
            var exists = _context.Products.Any(p => p.Article == article);
            if (exists)
                return (false, $"Product with Article '{article}' already exists");
        }

        // Validate price if provided
        if (data.ContainsKey("Price"))
        {
            var priceStr = data["Price"]?.ToString()?.Replace(",", ".");
            if (!decimal.TryParse(priceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out _))
                return (false, "Price must be a valid decimal number");
        }

        // Validate stock if provided - skip validation for non-numeric values
        // (will be handled in ProcessProductData)

        return (true, null);
    }

    private async Task<int> ProcessProductData(Dictionary<string, object> data, int importJobId, int rowNumber, string importVersion)
    {
        var article = data["Article"].ToString();
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Article == article);

        if (product == null)
        {
            var priceStr = data.ContainsKey("Price") ? data["Price"]?.ToString()?.Replace(",", ".") : "0";
            var stockStr = data.ContainsKey("Stock") ? data["Stock"]?.ToString() : "0";
            
            // Extract numeric value from stock string (e.g., "10 дней" -> 10, "0" -> 0)
            var stockValue = ExtractNumericValue(stockStr);
            
            product = new Product
            {
                Article = article,
                Name = data.ContainsKey("Name") ? data["Name"]?.ToString() : "",
                Price = decimal.TryParse(priceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var price) ? price : 0,
                Stock = stockValue,
                Description = data.ContainsKey("Description") ? data["Description"]?.ToString() : null,
                ImageUrl = data.ContainsKey("ImageUrl") ? data["ImageUrl"]?.ToString() : null,
                IsActive = true
            };

            // Handle CategoryName
            if (data.ContainsKey("CategoryName"))
            {
                var categoryName = data["CategoryName"]?.ToString();
                var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
                if (category == null && !string.IsNullOrEmpty(categoryName))
                {
                    category = new Category { Name = categoryName };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
                product.CategoryId = category?.Id;
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            _context.ImportLogs.Add(new ImportLog
            {
                ImportJobId = importJobId,
                RowNumber = rowNumber,
                MessageType = "info",
                Message = $"Created new product: {article}",
                ImportVersion = importVersion
            });
        }
        else
        {
            // Update existing product
            var oldPrice = product.Price;
            var oldStock = product.Stock;

            if (data.ContainsKey("Name")) product.Name = data["Name"]?.ToString();
            if (data.ContainsKey("Price"))
            {
                var updatePriceStr = data["Price"]?.ToString()?.Replace(",", ".");
                if (decimal.TryParse(updatePriceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var updatePrice))
                    product.Price = updatePrice;
            }
            if (data.ContainsKey("Stock"))
            {
                var updateStockStr = data["Stock"]?.ToString();
                product.Stock = ExtractNumericValue(updateStockStr);
            }
            if (data.ContainsKey("Description")) product.Description = data["Description"]?.ToString();
            if (data.ContainsKey("ImageUrl")) product.ImageUrl = data["ImageUrl"]?.ToString();

            // Handle CategoryName
            if (data.ContainsKey("CategoryName"))
            {
                var categoryName = data["CategoryName"]?.ToString();
                var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
                if (category == null && !string.IsNullOrEmpty(categoryName))
                {
                    category = new Category { Name = categoryName };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
                product.CategoryId = category?.Id;
            }

            await _context.SaveChangesAsync();

            _context.ImportLogs.Add(new ImportLog
            {
                ImportJobId = importJobId,
                RowNumber = rowNumber,
                MessageType = "info",
                Message = $"Updated product: {article}",
                OldValue = $"Price: {oldPrice}, Stock: {oldStock}",
                NewValue = $"Price: {product.Price}, Stock: {product.Stock}",
                ImportVersion = importVersion
            });
        }

        // Process attributes
        await ProcessAttributes(data, product.Id, importJobId, rowNumber, importVersion);

        return product.Id;
    }

    private async Task ProcessAttributes(Dictionary<string, object> data, int productId, int importJobId, int rowNumber, string importVersion)
    {
        var attributeKeys = data.Keys.Where(k => k.StartsWith("Attr_")).ToList();

        foreach (var key in attributeKeys)
        {
            var attrName = key.Substring(5); // Remove "Attr_" prefix
            var attrValue = data[key]?.ToString();

            if (string.IsNullOrEmpty(attrValue))
                continue;

            var existingAttr = await _context.ProductAttributes
                .FirstOrDefaultAsync(a => a.ProductId == productId && a.AttrName == attrName);

            if (existingAttr == null)
            {
                _context.ProductAttributes.Add(new ProductAttribute
                {
                    ProductId = productId,
                    AttrName = attrName,
                    AttrValue = attrValue
                });

                _context.ImportLogs.Add(new ImportLog
                {
                    ImportJobId = importJobId,
                    RowNumber = rowNumber,
                    MessageType = "info",
                    Message = $"Added attribute {attrName}={attrValue} to product {productId}",
                    ImportVersion = importVersion
                });
            }
            else
            {
                var oldValue = existingAttr.AttrValue;
                existingAttr.AttrValue = attrValue;

                _context.ImportLogs.Add(new ImportLog
                {
                    ImportJobId = importJobId,
                    RowNumber = rowNumber,
                    MessageType = "info",
                    Message = $"Updated attribute {attrName} for product {productId}",
                    OldValue = oldValue,
                    NewValue = attrValue,
                    ImportVersion = importVersion
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    // Helper method to extract numeric value from string (e.g., "10 дней" -> 10, "0" -> 0)
    private int ExtractNumericValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0;

        // Try direct parse first
        if (int.TryParse(value.Trim(), out var directResult))
            return directResult;

        // Extract first number from string
        var match = System.Text.RegularExpressions.Regex.Match(value, @"\d+");
        if (match.Success && int.TryParse(match.Value, out var extractedResult))
            return extractedResult;

        return 0;
    }
}
