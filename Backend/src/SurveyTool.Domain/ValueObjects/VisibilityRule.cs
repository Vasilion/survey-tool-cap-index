using System;
using System.Collections.Generic;

namespace SurveyTool.Domain.ValueObjects
{
    public class VisibilityRule
    {
        public Guid ParentQuestionId { get; set; }
        public List<Guid> VisibleWhenSelectedOptionIds { get; set; } = new List<Guid>();
    }
}


