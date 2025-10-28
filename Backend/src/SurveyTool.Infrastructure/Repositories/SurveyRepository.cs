using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Repositories;
using SurveyTool.Infrastructure.Data;

namespace SurveyTool.Infrastructure.Repositories
{
    public class SurveyRepository : ISurveyRepository
    {
        private readonly SurveyDbContext _db;
        public SurveyRepository(SurveyDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(Survey survey)
        {
            _db.Surveys.Add(survey);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _db.Surveys
                .Include(s => s.Questions)
                .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (entity != null)
            {
                // Remove all related entities first
                foreach (var question in entity.Questions.ToList())
                {
                    foreach (var option in question.Options.ToList())
                    {
                        _db.AnswerOptions.Remove(option);
                    }
                    _db.Questions.Remove(question);
                }
                _db.Surveys.Remove(entity);
                await _db.SaveChangesAsync();
            }
        }

        public async Task<Survey?> GetByIdAsync(Guid id)
        {
            return await _db.Surveys
                .Include(s => s.Questions)
                .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<IReadOnlyList<Survey>> ListAsync()
        {
            return await _db.Surveys.AsNoTracking().ToListAsync();
        }

        public async Task UpdateAsync(Survey survey)
        {
            _db.Surveys.Update(survey);
            await _db.SaveChangesAsync();
        }
    }
}


