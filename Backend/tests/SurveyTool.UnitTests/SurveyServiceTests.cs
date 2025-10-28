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
        public async Task Create_And_Get_Survey_Works()
        {
            var repo = new FakeSurveyRepository();
            var svc = new SurveyService(repo);

            var id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "New",
                Questions = new List<QuestionUpsertDto>()
            });

            id.Should().NotBe(Guid.Empty);
            var survey = await svc.GetAsync(id);
            survey.Should().NotBeNull();
            survey!.Title.Should().Be("New");
        }
    }
}


