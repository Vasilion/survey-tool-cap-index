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

            Guid q4Id = Guid.NewGuid();
            Guid q4Opt1 = Guid.NewGuid();
            Guid q4Opt2 = Guid.NewGuid();
            Guid q4Opt3 = Guid.NewGuid();

            Guid q5Id = Guid.NewGuid();
            Guid q5Opt1 = Guid.NewGuid();
            Guid q5Opt2 = Guid.NewGuid();
            Guid q5Opt3 = Guid.NewGuid();
            Guid q5Opt4 = Guid.NewGuid();

            Guid q6Id = Guid.NewGuid();
            Guid q6Coffee = Guid.NewGuid();
            Guid q6Tea = Guid.NewGuid();
            Guid q6Water = Guid.NewGuid();

            Guid q7Id = Guid.NewGuid();

            Guid q8Id = Guid.NewGuid();
            Guid q8Opt1 = Guid.NewGuid();
            Guid q8Opt2 = Guid.NewGuid();
            Guid q8Opt3 = Guid.NewGuid();

            Survey survey = new Survey
            {
                Id = surveyId,
                Title = "CAP Index Interest & Use Survey",
                Description = "Help us understand how you might use CAP Index crime risk intelligence across your organization."
            };

            Question q1 = new Question
            {
                Id = q1Id,
                SurveyId = surveyId,
                Text = "How familiar are you with CAP Index and CRIMECAST reports?",
                Type = QuestionType.SingleChoice,
                Order = 1
            };

            AnswerOption q1a = new AnswerOption { Id = q1OptA, QuestionId = q1Id, Text = "Very familiar – active user", Weight = 4 };
            AnswerOption q1b = new AnswerOption { Id = q1OptB, QuestionId = q1Id, Text = "Heard of it – exploring", Weight = 2 };
            q1.Options.AddRange(new[] { q1a, q1b });

            Question q2 = new Question
            {
                Id = q2Id,
                SurveyId = surveyId,
                Text = "Which CAP Index solutions interest you? (Select all)",
                Type = QuestionType.MultipleChoice,
                Order = 2,
                ParentQuestionId = q1Id,
                VisibilityRule = new VisibilityRule
                {
                    ParentQuestionId = q1Id,
                    VisibleWhenSelectedOptionIds = { q1OptA, q1OptB }
                }
            };
            q2.Options.AddRange(new[]
            {
                new AnswerOption{ Id = q2Opt1, QuestionId = q2Id, Text = "CRIMECAST® site‑specific risk reports", Weight = 4 },
                new AnswerOption{ Id = q2Opt2, QuestionId = q2Id, Text = "Risk data integrations for GIS/BI systems", Weight = 3 },
                new AnswerOption{ Id = q2Opt3, QuestionId = q2Id, Text = "Custom analytics & benchmarking", Weight = 5 }
            });

            Question q3 = new Question
            {
                Id = q3Id,
                SurveyId = surveyId,
                Text = "If you’re evaluating CAP Index based on a peer recommendation, what stood out?",
                Type = QuestionType.FreeText,
                Order = 3,
                ParentQuestionId = q1Id,
                VisibilityRule = new VisibilityRule
                {
                    ParentQuestionId = q1Id,
                    VisibleWhenSelectedOptionIds = { q1OptB }
                }
            };

            Question q4 = new Question
            {
                Id = q4Id,
                SurveyId = surveyId,
                Text = "Where would you apply CAP Index risk intelligence first?",
                Type = QuestionType.SingleChoice,
                Order = 4
            };
            AnswerOption q4a = new AnswerOption { Id = q4Opt1, QuestionId = q4Id, Text = "Physical security planning", Weight = 5 };
            AnswerOption q4b = new AnswerOption { Id = q4Opt2, QuestionId = q4Id, Text = "Real estate & site selection", Weight = 4 };
            AnswerOption q4c = new AnswerOption { Id = q4Opt3, QuestionId = q4Id, Text = "Loss prevention & operations", Weight = 3 };
            q4.Options.AddRange(new[] { q4a, q4b, q4c });

            Question q5 = new Question
            {
                Id = q5Id,
                SurveyId = surveyId,
                Text = "Which industries best describe your footprint? (Select all)",
                Type = QuestionType.MultipleChoice,
                Order = 5
            };
            q5.Options.AddRange(new[]
            {
                new AnswerOption{ Id = q5Opt1, QuestionId = q5Id, Text = "Retail / Restaurants", Weight = 4 },
                new AnswerOption{ Id = q5Opt2, QuestionId = q5Id, Text = "Financial Services / Insurance", Weight = 4 },
                new AnswerOption{ Id = q5Opt3, QuestionId = q5Id, Text = "Hospitals & Healthcare", Weight = 3 },
                new AnswerOption{ Id = q5Opt4, QuestionId = q5Id, Text = "Logistics / Delivery & Utilities", Weight = 3 }
            });

            Question q6 = new Question
            {
                Id = q6Id,
                SurveyId = surveyId,
                Text = "How would you prefer to access CAP Index data?",
                Type = QuestionType.SingleChoice,
                Order = 6
            };
            AnswerOption q6a = new AnswerOption { Id = q6Coffee, QuestionId = q6Id, Text = "CRIMECAST web platform", Weight = 4 };
            AnswerOption q6b = new AnswerOption { Id = q6Tea, QuestionId = q6Id, Text = "Data feed / API into GIS or BI", Weight = 5 };
            AnswerOption q6c = new AnswerOption { Id = q6Water, QuestionId = q6Id, Text = "Consulting engagement", Weight = 3 };
            q6.Options.AddRange(new[] { q6a, q6b, q6c });

            Question q7 = new Question
            {
                Id = q7Id,
                SurveyId = surveyId,
                Text = "Describe one decision you’d like to make with objective, site‑specific crime risk data",
                Type = QuestionType.FreeText,
                Order = 7
            };

            Question q8 = new Question
            {
                Id = q8Id,
                SurveyId = surveyId,
                Text = "Which CRIMECAST report would you try first?",
                Type = QuestionType.SingleChoice,
                Order = 8,
                ParentQuestionId = q6Id,
                VisibilityRule = new VisibilityRule
                {
                    ParentQuestionId = q6Id,
                    VisibleWhenSelectedOptionIds = { q6Coffee }
                }
            };
            q8.Options.AddRange(new[]
            {
                new AnswerOption{ Id = q8Opt1, QuestionId = q8Id, Text = "Single‑site risk score report", Weight = 3 },
                new AnswerOption{ Id = q8Opt2, QuestionId = q8Id, Text = "Portfolio benchmarking dashboard", Weight = 4 },
                new AnswerOption{ Id = q8Opt3, QuestionId = q8Id, Text = "Executive summary for stakeholders", Weight = 2 }
            });

            survey.Questions.Add(q1);
            survey.Questions.Add(q2);
            survey.Questions.Add(q3);
            survey.Questions.Add(q4);
            survey.Questions.Add(q5);
            survey.Questions.Add(q6);
            survey.Questions.Add(q7);
            survey.Questions.Add(q8);

            db.Surveys.Add(survey);
            db.SaveChanges();
        }
    }
}


