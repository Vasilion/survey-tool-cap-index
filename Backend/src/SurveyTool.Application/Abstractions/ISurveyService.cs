using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SurveyTool.Application.Contracts.Surveys;

namespace SurveyTool.Application.Abstractions
{
    public interface ISurveyService
    {
        Task<IReadOnlyList<SurveySummaryDto>> ListAsync();
        Task<SurveyDto?> GetAsync(Guid id);
        Task<Guid> CreateAsync(CreateSurveyRequest request);
        Task UpdateAsync(Guid id, UpdateSurveyRequest request);
        Task DeleteAsync(Guid id);
    }
}


