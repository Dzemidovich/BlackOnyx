using System;
using System.Collections.Concurrent;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Diplom.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Diplom.Services;

public class ImportBackgroundService : BackgroundService
{
    private readonly ILogger<ImportBackgroundService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly ConcurrentQueue<int> _importQueue = new();

    public ImportBackgroundService(
        ILogger<ImportBackgroundService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public void EnqueueImport(int importJobId)
    {
        _importQueue.Enqueue(importJobId);
        _logger.LogInformation($"Import job {importJobId} added to queue. Queue size: {_importQueue.Count}");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Import Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_importQueue.TryDequeue(out var importJobId))
            {
                _logger.LogInformation($"Processing import job {importJobId}");
                
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<ToolShopDbContext>();
                    
                    var importJob = await context.ImportJobs
                        .Include(j => j.ImportRows)
                        .FirstOrDefaultAsync(j => j.Id == importJobId, stoppingToken);

                    if (importJob == null)
                    {
                        _logger.LogWarning($"Import job {importJobId} not found");
                        continue;
                    }

                    if (importJob.Status != "pending")
                    {
                        _logger.LogWarning($"Import job {importJobId} is not in pending status: {importJob.Status}");
                        continue;
                    }

                    importJob.Status = "processing";
                    await context.SaveChangesAsync(stoppingToken);

                    await ProcessImportJobAsync(importJob, context, stoppingToken);

                    importJob.Status = "completed";
                    importJob.CompletedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation($"Import job {importJobId} completed. Processed: {importJob.ProcessedRows}, Errors: {importJob.ErrorsCount}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing import job {importJobId}");
                    
                    try
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<ToolShopDbContext>();
                        var importJob = await context.ImportJobs.FindAsync(importJobId);
                        if (importJob != null)
                        {
                            importJob.Status = "failed";
                            context.ImportLogs.Add(new ImportLog
                            {
                                ImportJobId = importJobId,
                                RowNumber = 0,
                                MessageType = "error",
                                Message = $"Import failed: {ex.Message}",
                                ImportVersion = importJob.ImportVersion
                            });
                            await context.SaveChangesAsync(stoppingToken);
                        }
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogError(innerEx, $"Error updating failed status for import job {importJobId}");
                    }
                }
            }
            else
            {
                // Ждем 1 секунду перед следующей проверкой очереди
                await Task.Delay(1000, stoppingToken);
            }
        }

        _logger.LogInformation("Import Background Service stopped");
    }

    private async Task ProcessImportJobAsync(ImportJob importJob, ToolShopDbContext context, CancellationToken cancellationToken)
    {
        var headerMapping = new Dictionary<string, string>
        {
            // Russian headers
            { "Артикул", "Article" },
            { "Название", "Name" },
            { "Описание", "Description" },
            { "Цена", "Price" },
            { "Количество", "Stock" },
            { "Категория", "CategoryName" },
            { "Изображение", "ImageUrl" },
            // English headers
            { "vendor_code", "Article" },
            { "name", "Name" },
            { "description", "Description" },
            { "price_prepaid", "Price" },
            { "warehouse_main", "Stock" },
            { "media_img", "ImageUrl" }
        };

        var importRows = await context.ImportRows
            .Where(r => r.ImportJobId == importJob.Id)
            .ToListAsync(cancellationToken);

        const int batchSize = 100;
        int processedInBatch = 0;
        int totalProcessed = 0;

        foreach (var importRow in importRows)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                var data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(importRow.RawData);

                // Map headers
                var mappedData = new Dictionary<string, object>();
                foreach (var kvp in data)
                {
                    var englishKey = headerMapping.ContainsKey(kvp.Key) ? headerMapping[kvp.Key] : kvp.Key;
                    mappedData[englishKey] = kvp.Value;
                }

                // Validate
                var validationResult = ValidateImportRow(mappedData, importJob.ImportMode, context);

                if (!validationResult.IsValid)
                {
                    importRow.Status = "error";
                    importRow.ErrorMessage = validationResult.ErrorMessage;
                    context.ImportLogs.Add(new ImportLog
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
                    var productId = await ProcessProductDataAsync(mappedData, importJob.Id, importRow.RowNumber, importJob.ImportVersion, context, cancellationToken);
                    importRow.ProductId = productId;
                }

                importRow.Status = "processed";
                importJob.ProcessedRows++;
                processedInBatch++;
                totalProcessed++;

                // Сохраняем пакетами
                if (processedInBatch >= batchSize)
                {
                    await context.SaveChangesAsync(cancellationToken);
                    processedInBatch = 0;
                    _logger.LogInformation($"Import job {importJob.Id}: Processed {totalProcessed}/{importRows.Count} rows");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing row {importRow.RowNumber} in import job {importJob.Id}");
                importRow.Status = "error";
                importRow.ErrorMessage = ex.Message;
                importJob.ErrorsCount++;
                processedInBatch++;
            }
        }

        // Сохраняем оставшиеся
        if (processedInBatch > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private (bool IsValid, string ErrorMessage) ValidateImportRow(Dictionary<string, object> data, string mode, ToolShopDbContext context)
    {
        if (!data.ContainsKey("Article") || string.IsNullOrEmpty(data["Article"]?.ToString()))
            return (false, "Article is required");

        var article = data["Article"].ToString();

        if (mode == "update_only")
        {
            var exists = context.Products.Any(p => p.Article == article);
            if (!exists)
                return (false, $"Product with Article '{article}' does not exist");
        }

        if (mode == "create_only")
        {
            var exists = context.Products.Any(p => p.Article == article);
            if (exists)
                return (false, $"Product with Article '{article}' already exists");
        }

        if (data.ContainsKey("Price"))
        {
            var priceStr = data["Price"]?.ToString()?.Replace(",", ".");
            if (!decimal.TryParse(priceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out _))
                return (false, "Price must be a valid decimal number");
        }

        return (true, null);
    }

    private async Task<int> ProcessProductDataAsync(Dictionary<string, object> data, int importJobId, int rowNumber, string importVersion, ToolShopDbContext context, CancellationToken cancellationToken)
    {
        var article = data["Article"].ToString();
        var product = await context.Products.FirstOrDefaultAsync(p => p.Article == article, cancellationToken);

        var priceStr = data.ContainsKey("Price") ? data["Price"]?.ToString()?.Replace(",", ".") : "0";
        var stockStr = data.ContainsKey("Stock") ? data["Stock"]?.ToString() : "0";
        var stockValue = ExtractNumericValue(stockStr);

        if (product == null)
        {
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

            if (data.ContainsKey("CategoryName"))
            {
                var categoryName = data["CategoryName"]?.ToString();
                var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName, cancellationToken);
                if (category == null && !string.IsNullOrEmpty(categoryName))
                {
                    category = new Category { Name = categoryName };
                    context.Categories.Add(category);
                    await context.SaveChangesAsync(cancellationToken);
                }
                product.CategoryId = category?.Id;
            }

            context.Products.Add(product);
            await context.SaveChangesAsync(cancellationToken);

            context.ImportLogs.Add(new ImportLog
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
            var oldPrice = product.Price;
            var oldStock = product.Stock;

            if (data.ContainsKey("Name")) product.Name = data["Name"]?.ToString();
            if (data.ContainsKey("Price"))
            {
                if (decimal.TryParse(priceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var updatePrice))
                    product.Price = updatePrice;
            }
            if (data.ContainsKey("Stock"))
            {
                product.Stock = stockValue;
            }
            if (data.ContainsKey("Description")) product.Description = data["Description"]?.ToString();
            if (data.ContainsKey("ImageUrl")) product.ImageUrl = data["ImageUrl"]?.ToString();

            if (data.ContainsKey("CategoryName"))
            {
                var categoryName = data["CategoryName"]?.ToString();
                var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName, cancellationToken);
                if (category == null && !string.IsNullOrEmpty(categoryName))
                {
                    category = new Category { Name = categoryName };
                    context.Categories.Add(category);
                    await context.SaveChangesAsync(cancellationToken);
                }
                product.CategoryId = category?.Id;
            }

            await context.SaveChangesAsync(cancellationToken);

            context.ImportLogs.Add(new ImportLog
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

        await ProcessAttributesAsync(data, product.Id, importJobId, rowNumber, importVersion, context, cancellationToken);

        return product.Id;
    }

    private async Task ProcessAttributesAsync(Dictionary<string, object> data, int productId, int importJobId, int rowNumber, string importVersion, ToolShopDbContext context, CancellationToken cancellationToken)
    {
        var attributeKeys = data.Keys.Where(k => k.StartsWith("Attr_")).ToList();

        foreach (var key in attributeKeys)
        {
            var attrName = key.Substring(5);
            var attrValue = data[key]?.ToString();

            if (string.IsNullOrEmpty(attrValue))
                continue;

            var existingAttr = await context.ProductAttributes
                .FirstOrDefaultAsync(a => a.ProductId == productId && a.AttrName == attrName, cancellationToken);

            if (existingAttr == null)
            {
                context.ProductAttributes.Add(new ProductAttribute
                {
                    ProductId = productId,
                    AttrName = attrName,
                    AttrValue = attrValue
                });

                context.ImportLogs.Add(new ImportLog
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

                context.ImportLogs.Add(new ImportLog
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

        await context.SaveChangesAsync(cancellationToken);
    }

    private int ExtractNumericValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0;

        if (int.TryParse(value.Trim(), out var directResult))
            return directResult;

        var match = System.Text.RegularExpressions.Regex.Match(value, @"\d+");
        if (match.Success && int.TryParse(match.Value, out var extractedResult))
            return extractedResult;

        return 0;
    }
}
