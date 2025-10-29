using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SurveyTool.Application.Abstractions;
using SurveyTool.Application.Common.Exceptions;
using SurveyTool.Application.Contracts.Surveys;
using SurveyTool.Domain.Entities;
using SurveyTool.Domain.Enums;
using SurveyTool.Domain.Repositories;
using SurveyTool.Domain.ValueObjects;

namespace SurveyTool.Application.Services
{
    public class SurveyService : ISurveyService
    {
        private readonly ISurveyRepository _repo;
        public SurveyService(ISurveyRepository repo)
        {
            _repo = repo;
        }

        public async Task<Guid> CreateAsync(CreateSurveyRequest request)
        {
            Survey survey = new Survey
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description
            };

            List<Question> questions = new List<Question>();
            foreach (QuestionUpsertDto q in request.Questions.OrderBy(x => x.Order))
            {
                Question question = new Question
                {
                    Id = Guid.NewGuid(),
                    SurveyId = survey.Id,
                    Text = q.Text,
                    Type = (QuestionType)q.Type,
                    Order = q.Order,
                    ParentQuestionId = q.ParentQuestionId,
                    VisibilityRule = q.ParentQuestionId.HasValue && q.VisibleWhenSelectedOptionIds != null
                        ? new VisibilityRule
                        {
                            ParentQuestionId = q.ParentQuestionId.Value,
                            VisibleWhenSelectedOptionIds = q.VisibleWhenSelectedOptionIds.ToList()
                        }
                        : null
                };
                foreach (AnswerOptionUpsertDto opt in q.Options)
                {
                    question.Options.Add(new AnswerOption
                    {
                        Id = Guid.NewGuid(),
                        QuestionId = question.Id,
                        Text = opt.Text,
                        Weight = opt.Weight
                    });
                }
                questions.Add(question);
            }
            survey.Questions = questions;
            await _repo.AddAsync(survey);
            return survey.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _repo.DeleteAsync(id);
        }

        public async Task<SurveyDto?> GetAsync(Guid id)
        {
            Survey? s = await _repo.GetByIdAsync(id);
            if (s == null) return null;
            return MapSurvey(s);
        }

        public async Task<IReadOnlyList<SurveySummaryDto>> ListAsync()
        {
            IReadOnlyList<Survey> list = await _repo.ListAsync();
            return list.Select(x => new SurveySummaryDto { Id = x.Id, Title = x.Title }).ToList();
        }

        public async Task UpdateAsync(Guid id, UpdateSurveyRequest request)
        {
            // Fetch the existing survey so we can map old IDs to new IDs
            Survey? existing = await _repo.GetByIdAsync(id);

            // Delete the existing survey
            await _repo.DeleteAsync(id);

            // Create a new survey with the same ID
            Survey survey = new Survey
            {
                Id = id, // Use the same ID
                Title = request.Title,
                Description = request.Description
            };

            // Prepare ordered collections for stable index-based mapping
            List<QuestionUpsertDto> orderedRequestQuestions = request.Questions
                .OrderBy(x => x.Order)
                .ToList();
            List<SurveyTool.Domain.Entities.Question> orderedExistingQuestions = existing?.Questions
                .OrderBy(x => x.Order)
                .ToList() ?? new List<SurveyTool.Domain.Entities.Question>();

            // Maps from old IDs to new IDs
            Dictionary<Guid, Guid> oldQuestionIdToNewQuestionId = new Dictionary<Guid, Guid>();
            Dictionary<Guid, Guid> oldOptionIdToNewOptionId = new Dictionary<Guid, Guid>();

            // First pass: create questions and options, building ID maps by matching order
            List<Question> newQuestions = new List<Question>();
            for (int i = 0; i < orderedRequestQuestions.Count; i++)
            {
                QuestionUpsertDto rq = orderedRequestQuestions[i];

                Question newQuestion = new Question
                {
                    Id = Guid.NewGuid(),
                    SurveyId = survey.Id,
                    Text = rq.Text,
                    Type = (QuestionType)rq.Type,
                    Order = rq.Order,
                };

                // If there is an existing question at the same order index, record mapping from old -> new IDs
                if (i < orderedExistingQuestions.Count)
                {
                    SurveyTool.Domain.Entities.Question oldQuestion = orderedExistingQuestions[i];
                    oldQuestionIdToNewQuestionId[oldQuestion.Id] = newQuestion.Id;

                    // Map options by index (order preserved by the request/options list)
                    int optionCount = Math.Min(oldQuestion.Options.Count, rq.Options.Count);
                    for (int oi = 0; oi < rq.Options.Count; oi++)
                    {
                        AnswerOptionUpsertDto ro = rq.Options[oi];
                        AnswerOption newOption = new AnswerOption
                        {
                            Id = Guid.NewGuid(),
                            QuestionId = newQuestion.Id,
                            Text = ro.Text,
                            Weight = ro.Weight
                        };
                        newQuestion.Options.Add(newOption);

                        if (oi < oldQuestion.Options.Count)
                        {
                            oldOptionIdToNewOptionId[oldQuestion.Options[oi].Id] = newOption.Id;
                        }
                    }
                }
                else
                {
                    // No existing question at this index; just create new options
                    foreach (AnswerOptionUpsertDto ro in rq.Options)
                    {
                        newQuestion.Options.Add(new AnswerOption
                        {
                            Id = Guid.NewGuid(),
                            QuestionId = newQuestion.Id,
                            Text = ro.Text,
                            Weight = ro.Weight
                        });
                    }
                }

                newQuestions.Add(newQuestion);
            }

            // Second pass: set parent question IDs and visibility rules using the maps
            for (int i = 0; i < orderedRequestQuestions.Count; i++)
            {
                QuestionUpsertDto rq = orderedRequestQuestions[i];
                Question target = newQuestions[i];

                if (rq.ParentQuestionId.HasValue)
                {
                    Guid oldParentId = rq.ParentQuestionId.Value;
                    if (oldQuestionIdToNewQuestionId.TryGetValue(oldParentId, out Guid newParentId))
                    {
                        target.ParentQuestionId = newParentId;

                        if (rq.VisibleWhenSelectedOptionIds != null)
                        {
                            List<Guid> mappedOptionIds = new List<Guid>();
                            foreach (Guid oldOptId in rq.VisibleWhenSelectedOptionIds)
                            {
                                if (oldOptionIdToNewOptionId.TryGetValue(oldOptId, out Guid newOptId))
                                {
                                    mappedOptionIds.Add(newOptId);
                                }
                            }

                            if (mappedOptionIds.Count > 0)
                            {
                                target.VisibilityRule = new VisibilityRule
                                {
                                    ParentQuestionId = newParentId,
                                    VisibleWhenSelectedOptionIds = mappedOptionIds
                                };
                            }
                        }
                    }
                }
            }

            survey.Questions = newQuestions;

            await _repo.AddAsync(survey);
        }

        private static SurveyDto MapSurvey(Survey s)
        {
            SurveyDto dto = new SurveyDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                Questions = s.Questions
                    .OrderBy(q => q.Order)
                    .Select(q => new Contracts.Surveys.QuestionDto
                    {
                        Id = q.Id,
                        Text = q.Text,
                        Type = (int)q.Type,
                        Order = q.Order,
                        ParentQuestionId = q.ParentQuestionId,
                        VisibleWhenSelectedOptionIds = q.VisibilityRule?.VisibleWhenSelectedOptionIds,
                        Options = q.Options.Select(o => new Contracts.Surveys.AnswerOptionDto
                        {
                            Id = o.Id,
                            Text = o.Text,
                            Weight = o.Weight
                        }).ToList()
                    }).ToList()
            };
            return dto;
        }
    }
}


