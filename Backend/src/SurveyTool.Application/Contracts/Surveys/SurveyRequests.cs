using System;
using System.Collections.Generic;

namespace SurveyTool.Application.Contracts.Surveys
{
    public class CreateSurveyRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<QuestionUpsertDto> Questions { get; set; } = new List<QuestionUpsertDto>();
    }

    public class UpdateSurveyRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<QuestionUpsertDto> Questions { get; set; } = new List<QuestionUpsertDto>();
    }

    public class QuestionUpsertDto
    {
        public string Text { get; set; } = string.Empty;
        public int Type { get; set; }
        public int Order { get; set; }
        public Guid? ParentQuestionId { get; set; }
        public List<Guid>? VisibleWhenSelectedOptionIds { get; set; }
        public List<AnswerOptionUpsertDto> Options { get; set; } = new List<AnswerOptionUpsertDto>();
    }

    public class AnswerOptionUpsertDto
    {
        public string Text { get; set; } = string.Empty;
        public int Weight { get; set; }
    }

    public class SurveySummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
    }
}


