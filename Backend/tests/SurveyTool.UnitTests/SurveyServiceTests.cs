using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using SurveyTool.Application.Contracts.Surveys;
using SurveyTool.Application.Services;
using SurveyTool.UnitTests.TestDoubles;
using Xunit;

namespace SurveyTool.UnitTests
{
    public class SurveyServiceTests
    {
        [Fact]
        public async Task CreateAndGetSurveyWorks()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "New",
                Questions = new List<QuestionUpsertDto>()
            });

            id.Should().NotBe(Guid.Empty);
            SurveyDto? survey = await svc.GetAsync(id);
            survey.Should().NotBeNull();
            survey!.Title.Should().Be("New");
        }
    }
}


