using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System;
using System.Collections.Generic;
using System.Text.Json;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.ValueObjects;

namespace SurveyTool.Infrastructure.Data
{
    public class SurveyDbContext : DbContext
    {
        public SurveyDbContext(DbContextOptions<SurveyDbContext> options) : base(options) { }

        public DbSet<Survey> Surveys => Set<Survey>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();
        public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
        public DbSet<ResponseItem> ResponseItems => Set<ResponseItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            ValueConverter<VisibilityRule?, string?> visibilityConverter = new ValueConverter<VisibilityRule?, string?>(
                v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => v == null ? null : JsonSerializer.Deserialize<VisibilityRule>(v, (JsonSerializerOptions?)null)
            );

            ValueConverter<List<Guid>, string> guidListConverter = new ValueConverter<List<Guid>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new List<Guid>()
            );

            modelBuilder.Entity<Survey>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Title).IsRequired();
                b.HasMany(x => x.Questions).WithOne().HasForeignKey(x => x.SurveyId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Question>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Text).IsRequired();
                b.Property(x => x.VisibilityRule).HasConversion(visibilityConverter);
                b.HasMany(x => x.Options).WithOne().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.SurveyId, x.Order });
            });

            modelBuilder.Entity<AnswerOption>(b =>
            {
                b.HasKey(x => x.Id);
            });

            modelBuilder.Entity<SurveyResponse>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasMany(x => x.Answers).WithOne().HasForeignKey(x => x.SurveyResponseId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ResponseItem>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.SelectedOptionIds).HasConversion(guidListConverter);
            });
        }
    }
}


