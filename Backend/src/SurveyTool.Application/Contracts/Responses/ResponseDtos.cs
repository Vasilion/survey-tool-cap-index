using System;
using System.Collections.Generic;

namespace SurveyTool.Application.Contracts.Responses
{
    public class SubmitResponseRequest
    {
        public List<SubmitAnswerItem> Answers { get; set; } = new List<SubmitAnswerItem>();
    }

    public class SubmitAnswerItem
    {
        public Guid QuestionId { get; set; }
        public List<Guid>? SelectedOptionIds { get; set; }
        public string? FreeText { get; set; }
    }

    public class SubmitResponseResult
    {
        public Guid ResponseId { get; set; }
        public int TotalScore { get; set; }
    }
}


