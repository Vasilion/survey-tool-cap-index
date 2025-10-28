using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SurveyTool.Domain.Entities;

namespace SurveyTool.Domain.Repositories
{
    public interface ISurveyRepository
    {
        Task<Survey?> GetByIdAsync(Guid id);
        Task<IReadOnlyList<Survey>> ListAsync();
        Task AddAsync(Survey survey);
        Task UpdateAsync(Survey survey);
        Task DeleteAsync(Guid id);
    }
}


