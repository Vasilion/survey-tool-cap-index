using System;
using System.Collections.Generic;

namespace SurveyTool.Domain.Entities
{
    public class SurveyResponse
    {
        public Guid Id { get; set; }
        public Guid SurveyId { get; set; }
        public DateTime SubmittedAt { get; set; }
        public int TotalScore { get; set; }
        public List<ResponseItem> Answers { get; set; } = new List<ResponseItem>();
    }
}


