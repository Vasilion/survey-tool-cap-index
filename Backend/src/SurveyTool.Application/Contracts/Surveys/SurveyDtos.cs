using System;
using System.Collections.Generic;

namespace SurveyTool.Application.Contracts.Surveys
{
    public class SurveyDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<QuestionDto> Questions { get; set; } = new List<QuestionDto>();
    }

    public class QuestionDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Type { get; set; }
        public int Order { get; set; }
        public Guid? ParentQuestionId { get; set; }
        public List<Guid>? VisibleWhenSelectedOptionIds { get; set; }
        public List<AnswerOptionDto> Options { get; set; } = new List<AnswerOptionDto>();
    }

    public class AnswerOptionDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Weight { get; set; }
    }
}


