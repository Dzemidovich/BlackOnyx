using System;
using System.Collections.Generic;

namespace Diplom.Models;

public partial class ProductAttribute
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string? AttrName { get; set; }

    public string? AttrValue { get; set; }

    public virtual Product Product { get; set; } = null!;
}
