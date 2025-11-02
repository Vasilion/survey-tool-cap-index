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
            Guid surveyId = Guid.NewGuid();
            Guid q1Id = Guid.NewGuid();
            Guid q1A = Guid.NewGuid();
            Guid q1B = Guid.NewGuid();
            Guid q2Id = Guid.NewGuid();
            Guid q2_1 = Guid.NewGuid();
            Guid q2_2 = Guid.NewGuid();
            Guid q3Id = Guid.NewGuid();

            Survey survey = new Survey { Id = surveyId, Title = "Test" };

            Question q1 = new Question { Id = q1Id, SurveyId = surveyId, Text = "Q1", Type = QuestionType.SingleChoice, Order = 1 };
            q1.Options.Add(new AnswerOption { Id = q1A, QuestionId = q1Id, Text = "A", Weight = 3 });
            q1.Options.Add(new AnswerOption { Id = q1B, QuestionId = q1Id, Text = "B", Weight = 1 });

            Question q2 = new Question { Id = q2Id, SurveyId = surveyId, Text = "Q2", Type = QuestionType.MultipleChoice, Order = 2, ParentQuestionId = q1Id, VisibilityRule = new Domain.ValueObjects.VisibilityRule { ParentQuestionId = q1Id, VisibleWhenSelectedOptionIds = { q1A } } };
            q2.Options.Add(new AnswerOption { Id = q2_1, QuestionId = q2Id, Text = "X", Weight = 2 });
            q2.Options.Add(new AnswerOption { Id = q2_2, QuestionId = q2Id, Text = "Y", Weight = 4 });

            Question q3 = new Question { Id = q3Id, SurveyId = surveyId, Text = "Q3", Type = QuestionType.FreeText, Order = 3, ParentQuestionId = q1Id, VisibilityRule = new Domain.ValueObjects.VisibilityRule { ParentQuestionId = q1Id, VisibleWhenSelectedOptionIds = { q1B } } };

            survey.Questions.AddRange(new[] { q1, q2, q3 });

            FakeSurveyRepository repo = new FakeSurveyRepository();
            repo.Seed(survey);
            FakeSurveyResponseRepository respRepo = new FakeSurveyResponseRepository();
            return (repo, respRepo, surveyId, q1Id, q1A, q1B, q2Id, q2_1, q2_2, q3Id);
        }

        [Fact]
        public async Task VisibilityRuleMakesQ2VisibleWhenQ1ASelected()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid _, Guid q2Id, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } }
                }
            };

            SubmitResponseResult result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task SubmitRejectsAnswerForHiddenQuestion()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid _, Guid q1B, Guid q2Id, Guid q2_1, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
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
        public async Task MultipleChoiceScoringSumsSelectedWeights()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid _, Guid q2Id, Guid q2_1, Guid q2_2, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } },
                    new SubmitAnswerItem{ QuestionId = q2Id, SelectedOptionIds = new List<Guid>{ q2_1, q2_2 } }
                }
            };

            SubmitResponseResult result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().Be(3 + 2 + 4);
        }

        [Fact]
        public async Task SingleChoiceRequiresExactlyOneOption()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid q1B, Guid _, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A, q1B } }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }

        [Fact]
        public async Task FreeTextQuestionsScoreZero()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid _, Guid q1B, Guid _, Guid _, Guid _, Guid q3Id) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1B } },
                    new SubmitAnswerItem{ QuestionId = q3Id, FreeText = "Some text answer", SelectedOptionIds = new List<Guid>() }
                }
            };

            SubmitResponseResult result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().Be(1);
        }

        [Fact]
        public async Task SingleChoiceWithNoOptionThrowsValidationException()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid _, Guid _, Guid _, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>() }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }

        [Fact]
        public async Task MultipleChoiceWithNoOptionsThrowsValidationException()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid _, Guid q2Id, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } },
                    new SubmitAnswerItem{ QuestionId = q2Id, SelectedOptionIds = new List<Guid>() }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }

        [Fact]
        public async Task InvalidQuestionIdThrowsValidationException()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid q1Id, Guid q1A, Guid _, Guid _, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>
                {
                    new SubmitAnswerItem{ QuestionId = q1Id, SelectedOptionIds = new List<Guid>{ q1A } },
                    new SubmitAnswerItem{ QuestionId = Guid.NewGuid(), SelectedOptionIds = new List<Guid>{ q1A } }
                }
            };

            Func<Task> act = () => svc.SubmitAsync(surveyId, req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.ValidationException>();
        }

        [Fact]
        public async Task EmptyAnswersArrayReturnsZeroScore()
        {
            (FakeSurveyRepository repo, FakeSurveyResponseRepository respRepo, Guid surveyId, Guid _, Guid _, Guid _, Guid _, Guid _, Guid _, Guid _) = BuildSurvey();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>()
            };

            SubmitResponseResult result = await svc.SubmitAsync(surveyId, req);
            result.TotalScore.Should().Be(0);
        }

        [Fact]
        public async Task NonExistentSurveyThrowsNotFoundException()
        {
            FakeSurveyRepository repo = new FakeSurveyRepository();
            FakeSurveyResponseRepository respRepo = new FakeSurveyResponseRepository();
            ResponseService svc = new ResponseService(repo, respRepo);

            SubmitResponseRequest req = new SubmitResponseRequest
            {
                Answers = new List<SubmitAnswerItem>()
            };

            Func<Task> act = () => svc.SubmitAsync(Guid.NewGuid(), req);
            await act.Should().ThrowAsync<SurveyTool.Application.Common.Exceptions.NotFoundException>();
        }
    }
}


