using System;
using System.ComponentModel.DataAnnotations;

namespace Diplom.Models;

public class ImportRow
{
    public int Id { get; set; }

    [Required]
    public int ImportJobId { get; set; }

    public int RowNumber { get; set; }

    [Required]
    public string RawData { get; set; } // JSON of parsed CSV row

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } // pending, processed, error

    [MaxLength(500)]
    public string ErrorMessage { get; set; }

    public int? ProductId { get; set; } // After processing

    // Navigation
    public ImportJob ImportJob { get; set; }
}
