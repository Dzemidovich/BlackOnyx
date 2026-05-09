using System;
using System.Collections.Generic;

namespace Diplom.Models;

public partial class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? ParentId { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
