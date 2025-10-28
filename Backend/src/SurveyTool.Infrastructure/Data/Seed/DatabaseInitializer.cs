using System;
using System.Linq;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Enums;
using SurveyTool.Domain.ValueObjects;

namespace SurveyTool.Infrastructure.Data.Seed
{
    public static class DatabaseInitializer
    {
        public static void EnsureSeeded(SurveyDbContext db)
        {
            if (db.Surveys.Any()) return;

            Guid surveyId = Guid.NewGuid();
            Guid q1Id = Guid.NewGuid();
            Guid q1OptA = Guid.NewGuid();
            Guid q1OptB = Guid.NewGuid();

            Guid q2Id = Guid.NewGuid();
            Guid q2Opt1 = Guid.NewGuid();
            Guid q2Opt2 = Guid.NewGuid();
            Guid q2Opt3 = Guid.NewGuid();

            Guid q3Id = Guid.NewGuid();

            Survey survey = new Survey
            {
                Id = surveyId,
                Title = "Customer Satisfaction",
                Description = "Demo survey with conditional questions and weights"
            };

            Question q1 = new Question
            {
                Id = q1Id,
                SurveyId = surveyId,
                Text = "How did you hear about us?",
                Type = QuestionType.SingleChoice,
                Order = 1
            };

            AnswerOption q1a = new AnswerOption { Id = q1OptA, QuestionId = q1Id, Text = "Online Ad", Weight = 3 };
            AnswerOption q1b = new AnswerOption { Id = q1OptB, QuestionId = q1Id, Text = "Friend", Weight = 1 };
            q1.Options.AddRange(new[] { q1a, q1b });

            Question q2 = new Question
            {
                Id = q2Id,
                SurveyId = surveyId,
                Text = "Which features interest you? (Select all)",
                Type = QuestionType.MultipleChoice,
                Order = 2,
                ParentQuestionId = q1Id,
                VisibilityRule = new VisibilityRule
                {
                    ParentQuestionId = q1Id,
                    VisibleWhenSelectedOptionIds = { q1OptA }
                }
            };
            q2.Options.AddRange(new[]
            {
                new AnswerOption{ Id = q2Opt1, QuestionId = q2Id, Text = "Analytics", Weight = 2 },
                new AnswerOption{ Id = q2Opt2, QuestionId = q2Id, Text = "Integrations", Weight = 4 },
                new AnswerOption{ Id = q2Opt3, QuestionId = q2Id, Text = "Support", Weight = 1 }
            });

            Question q3 = new Question
            {
                Id = q3Id,
                SurveyId = surveyId,
                Text = "Tell us more about your referral",
                Type = QuestionType.FreeText,
                Order = 3,
                ParentQuestionId = q1Id,
                VisibilityRule = new VisibilityRule
                {
                    ParentQuestionId = q1Id,
                    VisibleWhenSelectedOptionIds = { q1OptB }
                }
            };

            survey.Questions.Add(q1);
            survey.Questions.Add(q2);
            survey.Questions.Add(q3);

            db.Surveys.Add(survey);
            db.SaveChanges();
        }
    }
}


