using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Repositories;

namespace SurveyTool.UnitTests.TestDoubles
{
    public class FakeSurveyRepository : ISurveyRepository
    {
        private readonly Dictionary<Guid, Survey> _store = new Dictionary<Guid, Survey>();

        public Task AddAsync(Survey survey)
        {
            _store[survey.Id] = survey;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id)
        {
            _store.Remove(id);
            return Task.CompletedTask;
        }

        public Task<Survey?> GetByIdAsync(Guid id)
        {
            _store.TryGetValue(id, out var s);
            return Task.FromResult(s);
        }

        public Task<IReadOnlyList<Survey>> ListAsync()
        {
            return Task.FromResult((IReadOnlyList<Survey>)_store.Values.ToList());
        }

        public Task UpdateAsync(Survey survey)
        {
            _store[survey.Id] = survey;
            return Task.CompletedTask;
        }

        public void Seed(Survey survey)
        {
            _store[survey.Id] = survey;
        }
    }

    public class FakeSurveyResponseRepository : ISurveyResponseRepository
    {
        private readonly Dictionary<Guid, SurveyResponse> _store = new Dictionary<Guid, SurveyResponse>();

        public Task AddAsync(SurveyResponse response)
        {
            _store[response.Id] = response;
            return Task.CompletedTask;
        }

        public Task<SurveyResponse?> GetAsync(Guid responseId)
        {
            _store.TryGetValue(responseId, out var r);
            return Task.FromResult(r);
        }
    }
}


