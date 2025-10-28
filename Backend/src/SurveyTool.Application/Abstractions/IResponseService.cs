using System;
using System.Threading.Tasks;
using SurveyTool.Application.Contracts.Responses;

namespace SurveyTool.Application.Abstractions
{
    public interface IResponseService
    {
        Task<SubmitResponseResult> SubmitAsync(Guid surveyId, SubmitResponseRequest request);
    }
}


