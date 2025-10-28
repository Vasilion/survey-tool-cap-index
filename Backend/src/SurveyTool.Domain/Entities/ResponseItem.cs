using System;
using System.Collections.Generic;

namespace SurveyTool.Domain.Entities
{
    public class ResponseItem
    {
        public Guid Id { get; set; }
        public Guid SurveyResponseId { get; set; }
        public Guid QuestionId { get; set; }
        public List<Guid> SelectedOptionIds { get; set; } = new List<Guid>();
        public string? FreeText { get; set; }
        public int ItemScore { get; set; }
    }
}


