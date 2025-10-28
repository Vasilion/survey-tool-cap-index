using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using SurveyTool.Application.Contracts.Responses;
using SurveyTool.Application.Services;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Enums;
using SurveyTool.UnitTests.TestDoubles;
using Xunit;

namespace SurveyTool.UnitTests
{
    public class ResponseServiceTests
    {
        private (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid q1B, Guid q2Id, Guid q2_1, Guid q2_2, Guid q3Id) BuildSurvey()
        {
            var surveyId = Guid.NewGuid();
            var q1Id = Guid.NewGuid();
            var q1A = Guid.NewGuid();
            var q1B = Guid.NewGuid();
            var q2Id = Guid.NewGuid();
            var q2_1 = Guid.NewGuid();
            var q2_2 = Guid.NewGuid();
            var q3Id = Guid.NewGuid();

            var survey = new Survey { Id = surveyId, Title = "Test" };

            var q1 = new Question { Id = q1Id, SurveyId = surveyId, Text = "Q1", Type = QuestionType.SingleChoice, Order = 1 };
            q1.Options.Add(new AnswerOption { Id = q1A, QuestionId = q1Id, Text = "A", Weight = 3 });
            q1.Options.Add(new AnswerOption { Id = q1B, QuestionId = q1Id, Text = "B", Weight = 1 });

            var q2 = new Question { Id = q2Id, SurveyId = surveyId, Text = "Q2", Type = QuestionType.MultipleChoice, Order = 2, ParentQuestionId = q1Id, VisibilityRule = new Domain.ValueObjects.VisibilityRule { ParentQuestionId = q1Id, VisibleWhenSelectedOptionIds = { q1A } } };
            q2.Options.Add(new AnswerOption { Id = q2_1, QuestionId = q2Id, Text = "X", Weight = 2 });
            q2.Options.Add(new AnswerOption { Id = q2_2, QuestionId = q2Id, Text = "Y", Weight = 4 });

            var q3 = new Question { Id = q3Id, SurveyId = surveyId, Text = "Q3", Type = QuestionType.FreeText, Order = 3, ParentQuestionId = q1Id, VisibilityRule = new Domain.ValueObjects.VisibilityRule { ParentQuestionId = q1Id, VisibleWhenSelectedOptionIds = { q1B } } };

            survey.Questions.AddRange(new[] { q1, q2, q3 });

            var repo = new FakeSurveyRepository();
            repo.Seed(survey);
            var respRepo = new FakeSurveyResponseRepository();
            return (repo, respRepo, surveyId, q1Id, q1A, q1B, q2Id, q2_1, q2_2, q3Id);
        }

        [Fact]
        public async Task VisibilityRule_Makes_Q2_Visible_When_Q1A_Selected()
        {
            var (repo, respRepo, surveyId, q1Id, q1A, _, q2Id, _, _, _) = BuildSurvey();
            var svc = new ResponseService(repo, respRepo);

            var req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } }
                }
            };

            var result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task Submit_Rejects_Answer_For_Hidden_Question()
        {
            var (repo, respRepo, surveyId, q1Id, _, q1B, q2Id, q2_1, _, _) = BuildSurvey();
            var svc = new ResponseService(repo, respRepo);

            var req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1B } },
                    new SubmitAnswerItem{ QuestionId = q2Id, SelectedOptionIds = new List<Guid>{ q2_1 } }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }

        [Fact]
        public async Task MultipleChoice_Scoring_Sums_Selected_Weights()
        {
            var (repo, respRepo, surveyId, q1Id, q1A, _, q2Id, q2_1, q2_2, _) = BuildSurvey();
            var svc = new ResponseService(repo, respRepo);

            var req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } },
                    new SubmitAnswerItem{ QuestionId = q2Id, SelectedOptionIds = new List<Guid>{ q2_1, q2_2 } }
                }
            };

            var result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().Be(3 + 2 + 4);
        }

        [Fact]
        public async Task SingleChoice_Requires_Exactly_One_Option()
        {
            var (repo, respRepo, surveyId, q1Id, q1A, q1B, _, _, _, _) = BuildSurvey();
            var svc = new ResponseService(repo, respRepo);

            var req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A, q1B } }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }
    }
}


