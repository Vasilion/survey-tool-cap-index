using FluentValidation;
using SurveyTool.Application.Contracts.Responses;
using SurveyTool.Application.Contracts.Surveys;
using SurveyTool.Domain.Enums;

namespace SurveyTool.Application.Validation
{
    public class CreateSurveyRequestValidator : AbstractValidator<CreateSurveyRequest>
    {
        public CreateSurveyRequestValidator()
        {
            RuleFor(x => x.Title).NotEmpty();
            RuleForEach(x => x.Questions).SetValidator(new QuestionUpsertDtoValidator());
        }
    }

    public class UpdateSurveyRequestValidator : AbstractValidator<UpdateSurveyRequest>
    {
        public UpdateSurveyRequestValidator()
        {
            RuleFor(x => x.Title).NotEmpty();
            RuleForEach(x => x.Questions).SetValidator(new QuestionUpsertDtoValidator());
        }
    }

    public class QuestionUpsertDtoValidator : AbstractValidator<QuestionUpsertDto>
    {
        public QuestionUpsertDtoValidator()
        {
            RuleFor(x => x.Text).NotEmpty();
            RuleFor(x => x.Type).Must(type => Enum.IsDefined(typeof(QuestionType), type))
                .WithMessage("Question type must be a valid enum value (0=SingleChoice, 1=MultipleChoice, 2=FreeText)");
            When(x => x.Type != (int)QuestionType.FreeText, () =>
            {
                RuleFor(x => x.Options).NotEmpty().WithMessage("Choice questions must have at least one option");
            });
        }
    }

    public class SubmitResponseRequestValidator : AbstractValidator<SubmitResponseRequest>
    {
        public SubmitResponseRequestValidator()
        {
            RuleFor(x => x.Answers).NotEmpty();
        }
    }
}


