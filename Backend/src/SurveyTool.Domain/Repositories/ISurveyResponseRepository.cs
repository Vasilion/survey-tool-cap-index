using System;
using System.Threading.Tasks;
using SurveyTool.Domain.Entities;

namespace SurveyTool.Domain.Repositories
{
    public interface ISurveyResponseRepository
    {
        Task AddAsync(SurveyResponse response);
        Task<SurveyResponse?> GetAsync(Guid responseId);
    }
}


