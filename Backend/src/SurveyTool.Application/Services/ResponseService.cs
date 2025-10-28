using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SurveyTool.Application.Abstractions;
using SurveyTool.Application.Common.Exceptions;
using SurveyTool.Application.Contracts.Responses;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Enums;
using SurveyTool.Domain.Repositories;

namespace SurveyTool.Application.Services
{
    public class ResponseService : IResponseService
    {
        private readonly ISurveyRepository _surveys;
        private readonly ISurveyResponseRepository _responses;

        public ResponseService(ISurveyRepository surveys, ISurveyResponseRepository responses)
        {
            _surveys = surveys;
            _responses = responses;
        }

        public async Task<SubmitResponseResult> SubmitAsync(Guid surveyId, SubmitResponseRequest request)
        {
            Survey? survey = await _surveys.GetByIdAsync(surveyId);
            if (survey == null) throw new NotFoundException("Survey not found");

            Dictionary<Guid, Question> questionById = survey.Questions.ToDictionary(q => q.Id);
            Dictionary<Guid, SubmitAnswerItem> answersByQuestionId = request.Answers.ToDictionary(a => a.QuestionId, a => a);

            foreach (SubmitAnswerItem ans in request.Answers)
            {
                if (!questionById.ContainsKey(ans.QuestionId))
                    throw new ValidationException("Answer references unknown question");
            }

            HashSet<Guid> visibleQuestionIds = ComputeVisibleQuestionIds(survey, answersByQuestionId);

            foreach (SubmitAnswerItem ans in request.Answers)
            {
                if (!visibleQuestionIds.Contains(ans.QuestionId))
                    throw new ValidationException("Answer provided for hidden question");

                Question q = questionById[ans.QuestionId];
                ValidateAnswerForType(q, ans);
            }

            SurveyResponse response = new SurveyResponse
            {
                Id = Guid.NewGuid(),
                SurveyId = surveyId,
                SubmittedAt = DateTime.UtcNow
            };

            int total = 0;
            foreach (Question q in survey.Questions.OrderBy(x => x.Order))
            {
                if (!visibleQuestionIds.Contains(q.Id)) continue;
                if (!answersByQuestionId.TryGetValue(q.Id, out SubmitAnswerItem? ans)) continue;

                int itemScore = 0;
                if (q.Type == QuestionType.FreeText)
                {
                    itemScore = 0;
                }
                else if (q.Type == QuestionType.SingleChoice)
                {
                    Guid optId = ans.SelectedOptionIds!.Single();
                    AnswerOption opt = q.Options.First(x => x.Id == optId);
                    itemScore = opt.Weight;
                }
                else if (q.Type == QuestionType.MultipleChoice)
                {
                    foreach (Guid id in ans.SelectedOptionIds!)
                    {
                        AnswerOption opt = q.Options.First(x => x.Id == id);
                        itemScore += opt.Weight;
                    }
                }

                total += itemScore;
                response.Answers.Add(new ResponseItem
                {
                    Id = Guid.NewGuid(),
                    SurveyResponseId = response.Id,
                    QuestionId = q.Id,
                    SelectedOptionIds = ans.SelectedOptionIds ?? new List<Guid>(),
                    FreeText = ans.FreeText,
                    ItemScore = itemScore
                });
            }

            response.TotalScore = total;
            await _responses.AddAsync(response);

            return new SubmitResponseResult { ResponseId = response.Id, TotalScore = total };
        }

        private static HashSet<Guid> ComputeVisibleQuestionIds(Survey survey, Dictionary<Guid, SubmitAnswerItem> answers)
        {
            HashSet<Guid> visible = new HashSet<Guid>();
            foreach (Question q in survey.Questions.OrderBy(x => x.Order))
            {
                if (q.ParentQuestionId == null)
                {
                    visible.Add(q.Id);
                    continue;
                }

                if (q.VisibilityRule == null)
                {
                    continue;
                }

                if (!answers.TryGetValue(q.VisibilityRule.ParentQuestionId, out SubmitAnswerItem? parentAnswer))
                {
                    continue;
                }

                List<Guid> selected = parentAnswer.SelectedOptionIds ?? new List<Guid>();
                if (selected.Intersect(q.VisibilityRule.VisibleWhenSelectedOptionIds).Any())
                {
                    visible.Add(q.Id);
                }
            }
            return visible;
        }

        private static void ValidateAnswerForType(Question q, SubmitAnswerItem ans)
        {
            if (q.Type == QuestionType.FreeText)
            {
                if (ans.SelectedOptionIds != null && ans.SelectedOptionIds.Count > 0)
                    throw new ValidationException("FreeText question cannot contain selected options");
                return;
            }

            if (ans.SelectedOptionIds == null || ans.SelectedOptionIds.Count == 0)
                throw new ValidationException("Choice question requires selected options");

            HashSet<Guid> optionIdSet = new HashSet<Guid>(q.Options.Select(o => o.Id));
            foreach (Guid id in ans.SelectedOptionIds)
            {
                if (!optionIdSet.Contains(id)) throw new ValidationException("Answer references unknown option");
            }

            if (q.Type == QuestionType.SingleChoice && ans.SelectedOptionIds.Count != 1)
                throw new ValidationException("SingleChoice requires exactly one selected option");
        }
    }
}


