using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Repositories;
using SurveyTool.Infrastructure.Data;

namespace SurveyTool.Infrastructure.Repositories
{
    public class SurveyResponseRepository : ISurveyResponseRepository
    {
        private readonly SurveyDbContext _db;
        public SurveyResponseRepository(SurveyDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(SurveyResponse response)
        {
            _db.SurveyResponses.Add(response);
            await _db.SaveChangesAsync();
        }

        public async Task<SurveyResponse?> GetAsync(Guid responseId)
        {
            return await _db.SurveyResponses
                .Include(r => r.Answers)
                .FirstOrDefaultAsync(r => r.Id == responseId);
        }
    }
}


