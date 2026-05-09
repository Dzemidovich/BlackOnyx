using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Diplom.Models;

public partial class ToolShopDbContext : DbContext
{
    public ToolShopDbContext()
    {
    }

    public ToolShopDbContext(DbContextOptions<ToolShopDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductAttribute> ProductAttributes { get; set; }

    public virtual DbSet<User> Users { get; set; }

    // Import System
    public virtual DbSet<ImportJob> ImportJobs { get; set; }
    public virtual DbSet<ImportRow> ImportRows { get; set; }
    public virtual DbSet<ImportLog> ImportLogs { get; set; }

    // Loyalty Program
    public virtual DbSet<DiscountHistory> DiscountHistories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.HasOne(d => d.User).WithMany(p => p.Carts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Comment).HasColumnName("Comment");
            
            // Loyalty Program fields
            entity.Property(e => e.AppliedDiscount).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.Article, "IX_Products_Article");
            entity.HasIndex(e => e.Name, "IX_Products_Name");
            entity.HasIndex(e => e.Article).IsUnique();

            entity.Property(e => e.Article).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.ImageUrl).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.CostPrice).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId);
        });

        modelBuilder.Entity<ProductAttribute>(entity =>
        {
            entity.HasIndex(e => e.AttrName, "IX_Attributes_Name");

            entity.Property(e => e.AttrName).HasMaxLength(100);
            entity.Property(e => e.AttrValue).HasMaxLength(100);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductAttributes)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Role).HasMaxLength(20);
            
            // Поля для юридических лиц (B2B) - используем PascalCase как в БД
            entity.Property(e => e.CompanyName).HasColumnName("CompanyName").HasMaxLength(255);
            entity.Property(e => e.Unp).HasColumnName("Unp").HasMaxLength(9);
            entity.Property(e => e.LegalAddress).HasColumnName("LegalAddress");
            entity.Property(e => e.ActualAddress).HasColumnName("ActualAddress");
            entity.Property(e => e.BankName).HasColumnName("BankName").HasMaxLength(255);
            entity.Property(e => e.BankCode).HasColumnName("BankCode").HasMaxLength(9);
            entity.Property(e => e.CheckingAccount).HasColumnName("CheckingAccount").HasMaxLength(28);
            entity.Property(e => e.DirectorName).HasColumnName("DirectorName").HasMaxLength(255);
            entity.Property(e => e.ContactPhone).HasColumnName("ContactPhone").HasMaxLength(20);
            entity.Property(e => e.ContactPerson).HasColumnName("ContactPerson").HasMaxLength(255);
            entity.Property(e => e.IsLegalEntity).HasColumnName("IsLegalEntity").HasDefaultValue(false);
            
            // Модерация регистраций - добавляем эти поля в БД
            entity.Property(e => e.RegistrationStatus).HasColumnName("RegistrationStatus").HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.RejectionReason).HasColumnName("RejectionReason");
            entity.Property(e => e.ModeratedAt).HasColumnName("ModeratedAt");
            entity.Property(e => e.ModeratedBy).HasColumnName("ModeratedBy");
            
            // Loyalty Program fields
            entity.Property(e => e.TotalOrdersAmount).HasColumnType("decimal(10, 2)").HasDefaultValue(0);
            entity.Property(e => e.CurrentDiscount).HasColumnType("decimal(5, 2)").HasDefaultValue(0);
        });

        // Import System configurations
        modelBuilder.Entity<ImportJob>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.ImportVersion).HasMaxLength(50);
            entity.Property(e => e.ImportMode).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<ImportRow>(entity =>
        {
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.ErrorMessage).HasMaxLength(500);

            entity.HasOne(d => d.ImportJob).WithMany(p => p.ImportRows)
                .HasForeignKey(d => d.ImportJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImportLog>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.MessageType).HasMaxLength(50);
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.OldValue).HasMaxLength(500);
            entity.Property(e => e.NewValue).HasMaxLength(500);
            entity.Property(e => e.ImportVersion).HasMaxLength(50);

            entity.HasOne(d => d.ImportJob).WithMany(p => p.ImportLogs)
                .HasForeignKey(d => d.ImportJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Loyalty Program - DiscountHistory configuration
        modelBuilder.Entity<DiscountHistory>(entity =>
        {
            entity.Property(e => e.OldDiscount).HasColumnType("decimal(5, 2)").IsRequired();
            entity.Property(e => e.NewDiscount).HasColumnType("decimal(5, 2)").IsRequired();
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.Reason).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.DiscountHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.ChangedByUser).WithMany()
                .HasForeignKey(d => d.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ChangedAt);
        });
    }
}
