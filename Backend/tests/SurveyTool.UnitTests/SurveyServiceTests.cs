using System;
using System.Collections.Generic;
using System.Linq;
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

        [Fact]
        public async Task CreateSurveyWithQuestionsWorks()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "Test Survey",
                Description = "Test Description",
                Questions = new List<QuestionUpsertDto>
                {
                    new QuestionUpsertDto
                    {
                        Text = "Question 1",
                        Type = 0,
                        Order = 0,
                        Options = new List<AnswerOptionUpsertDto>
                        {
                            new AnswerOptionUpsertDto { Text = "Option 1", Weight = 1 },
                            new AnswerOptionUpsertDto { Text = "Option 2", Weight = 2 }
                        }
                    }
                }
            });

            SurveyDto? survey = await svc.GetAsync(id);
            survey.Should().NotBeNull();
            survey!.Questions.Should().HaveCount(1);
            survey.Questions[0].Text.Should().Be("Question 1");
            survey.Questions[0].Options.Should().HaveCount(2);
        }

        [Fact]
        public async Task ListAsyncReturnsAllSurveys()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id1 = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "Survey 1",
                Questions = new List<QuestionUpsertDto>()
            });

            Guid id2 = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "Survey 2",
                Questions = new List<QuestionUpsertDto>()
            });

            IReadOnlyList<SurveySummaryDto> list = await svc.ListAsync();
            list.Should().HaveCount(2);
            list.Select(s => s.Id).Should().Contain(new[] { id1, id2 });
            list.Select(s => s.Title).Should().Contain(new[] { "Survey 1", "Survey 2" });
        }

        [Fact]
        public async Task GetAsyncReturnsNullForNonExistentSurvey()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            SurveyDto? survey = await svc.GetAsync(Guid.NewGuid());
            survey.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsyncRemovesSurvey()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "To Delete",
                Questions = new List<QuestionUpsertDto>()
            });

            await svc.DeleteAsync(id);

            SurveyDto? survey = await svc.GetAsync(id);
            survey.Should().BeNull();
        }

        [Fact]
        public async Task UpdateAsyncUpdatesSurveyTitleAndDescription()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "Original",
                Description = "Original Description",
                Questions = new List<QuestionUpsertDto>()
            });

            await svc.UpdateAsync(id, new UpdateSurveyRequest
            {
                Title = "Updated",
                Description = "Updated Description",
                Questions = new List<QuestionUpsertDto>()
            });

            SurveyDto? survey = await svc.GetAsync(id);
            survey.Should().NotBeNull();
            survey!.Title.Should().Be("Updated");
            survey.Description.Should().Be("Updated Description");
        }

        [Fact]
        public async Task UpdateAsyncUpdatesQuestions()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            SurveyService svc = new SurveyService(repo);

            Guid id = await svc.CreateAsync(new CreateSurveyRequest
            {
                Title = "Test",
                Questions = new List<QuestionUpsertDto>
                {
                    new QuestionUpsertDto
                    {
                        Text = "Original Question",
                        Type = 0,
                        Order = 0,
                        Options = new List<AnswerOptionUpsertDto>
                        {
                            new AnswerOptionUpsertDto { Text = "Option 1", Weight = 1 }
                        }
                    }
                }
            });

            await svc.UpdateAsync(id, new UpdateSurveyRequest
            {
                Title = "Test",
                Questions = new List<QuestionUpsertDto>
                {
                    new QuestionUpsertDto
                    {
                        Text = "Updated Question",
                        Type = 0,
                        Order = 0,
                        Options = new List<AnswerOptionUpsertDto>
                        {
                            new AnswerOptionUpsertDto { Text = "Updated Option", Weight = 5 }
                        }
                    }
                }
            });

            SurveyDto? survey = await svc.GetAsync(id);
            survey.Should().NotBeNull();
            survey!.Questions.Should().HaveCount(1);
            survey.Questions[0].Text.Should().Be("Updated Question");
            survey.Questions[0].Options[0].Text.Should().Be("Updated Option");
            survey.Questions[0].Options[0].Weight.Should().Be(5);
        }
    }
}


