using System;
using System.Collections.Generic;
using SurveyTool.Domain.Enums;
using SurveyTool.Domain.ValueObjects;

namespace SurveyTool.Domain.Entities
{
    public class Question
    {
        public Guid Id { get; set; }
        public Guid SurveyId { get; set; }
        public string Text { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public int Order { get; set; }
        public Guid? ParentQuestionId { get; set; }
        public VisibilityRule? VisibilityRule { get; set; }
        public List<AnswerOption> Options { get; set; } = new List<AnswerOption>();
    }
}


