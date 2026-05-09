using System;
using System.ComponentModel.DataAnnotations;

namespace Diplom.Models;

public class ImportJob
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } // pending, processing, completed, failed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public int TotalRows { get; set; }

    public int ProcessedRows { get; set; }

    public int ErrorsCount { get; set; }

    [MaxLength(50)]
    public string ImportVersion { get; set; }

    [MaxLength(50)]
    public string ImportMode { get; set; } // upsert, update_only, create_only

    public bool IsDryRun { get; set; } = false;

    // Navigation
    public User User { get; set; }
    public ICollection<ImportRow> ImportRows { get; set; }
    public ICollection<ImportLog> ImportLogs { get; set; }
}
