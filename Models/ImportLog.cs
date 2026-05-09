using System;
using System.ComponentModel.DataAnnotations;

namespace Diplom.Models;

public class ImportLog
{
    public int Id { get; set; }

    [Required]
    public int ImportJobId { get; set; }

    public int RowNumber { get; set; }

    [Required]
    [MaxLength(50)]
    public string MessageType { get; set; } // info, warning, error

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; }

    [MaxLength(500)]
    public string OldValue { get; set; }

    [MaxLength(500)]
    public string NewValue { get; set; }

    [MaxLength(50)]
    public string ImportVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ImportJob ImportJob { get; set; }
}
