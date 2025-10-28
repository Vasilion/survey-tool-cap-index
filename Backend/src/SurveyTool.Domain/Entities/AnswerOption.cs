using System;

namespace SurveyTool.Domain.Entities
{
    public class AnswerOption
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Weight { get; set; }
    }
}


