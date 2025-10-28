using System;
using System.Collections.Generic;

namespace SurveyTool.Domain.Entities
{
    public class Survey
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<Question> Questions { get; set; } = new List<Question>();
    }
}


