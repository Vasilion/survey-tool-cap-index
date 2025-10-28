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
            var survey = new Survey
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description
            };

            var questions = new List<Question>();
            foreach (var q in request.Questions.OrderBy(x => x.Order))
            {
                var question = new Question
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
                foreach (var opt in q.Options)
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
            var s = await _repo.GetByIdAsync(id);
            if (s == null) return null;
            return MapSurvey(s);
        }

        public async Task<IReadOnlyList<SurveySummaryDto>> ListAsync()
        {
            var list = await _repo.ListAsync();
            return list.Select(x => new SurveySummaryDto { Id = x.Id, Title = x.Title }).ToList();
        }

        public async Task UpdateAsync(Guid id, UpdateSurveyRequest request)
        {
            Console.WriteLine($"Attempting to update survey with ID: {id}");
            Console.WriteLine($"Request contains {request.Questions.Count} questions");
            
            // Delete the existing survey
            await _repo.DeleteAsync(id);
            Console.WriteLine("Deleted existing survey and all related data");
            
            // Create a new survey with the same ID
            var survey = new Survey
            {
                Id = id, // Use the same ID
                Title = request.Title,
                Description = request.Description
            };

            var questions = new List<Question>();
            foreach (var q in request.Questions.OrderBy(x => x.Order))
            {
                var question = new Question
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
                foreach (var opt in q.Options)
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
            
            Console.WriteLine($"Creating new survey with {questions.Count} questions");
            await _repo.AddAsync(survey);
            Console.WriteLine("Survey updated successfully");
            
            // Verify what was actually saved
            var savedSurvey = await _repo.GetByIdAsync(id);
            Console.WriteLine($"Verification: Saved survey has {savedSurvey?.Questions.Count ?? 0} questions");
        }

        private static SurveyDto MapSurvey(Survey s)
        {
            var dto = new SurveyDto
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


