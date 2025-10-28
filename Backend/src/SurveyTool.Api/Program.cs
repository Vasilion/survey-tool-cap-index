using Microsoft.EntityFrameworkCore;
using FluentValidation;
using SurveyTool.Infrastructure.Data;
using SurveyTool.Infrastructure.Data.Seed;
using SurveyTool.Infrastructure.Repositories;
using SurveyTool.Application.Abstractions;
using SurveyTool.Application.Services;
using SurveyTool.Application.Validation;
using SurveyTool.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;
using SurveyTool.Domain.Repositories;
using SurveyTool.Application.Contracts.Surveys;
using SurveyTool.Application.Contracts.Responses;
using AppValidationException = SurveyTool.Application.Common.Exceptions.ValidationException;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Survey Tool API", Version = "v1" });
});

// EF Core InMemory
builder.Services.AddDbContext<SurveyDbContext>(options =>
    options.UseInMemoryDatabase("SurveyToolDb"));

// Repositories
builder.Services.AddScoped<ISurveyRepository, SurveyRepository>();
builder.Services.AddScoped<ISurveyResponseRepository, SurveyResponseRepository>();

// Services
builder.Services.AddScoped<ISurveyService, SurveyService>();
builder.Services.AddScoped<IResponseService, ResponseService>();

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateSurveyRequestValidator>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Initialize database with seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SurveyDbContext>();
    DatabaseInitializer.EnsureSeeded(context);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Global exception handling
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = ex switch
        {
            NotFoundException => (int)HttpStatusCode.NotFound,
            AppValidationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };
        
        context.Response.ContentType = "application/json";
        var response = new { message = ex.Message };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
});

// Survey endpoints
app.MapGet("/api/surveys", async (ISurveyService surveyService) =>
{
    var surveys = await surveyService.ListAsync();
    return Results.Ok(surveys);
})
.WithName("GetSurveys")
.WithOpenApi();

app.MapGet("/api/surveys/{id:guid}", async (Guid id, ISurveyService surveyService) =>
{
    var survey = await surveyService.GetAsync(id);
    return survey == null ? Results.NotFound() : Results.Ok(survey);
})
.WithName("GetSurvey")
.WithOpenApi();

app.MapPost("/api/surveys", async (CreateSurveyRequest request, ISurveyService surveyService, IValidator<CreateSurveyRequest> validator) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        Console.WriteLine($"Validation failed: {string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage))}");
        return Results.BadRequest(validationResult.Errors.Select(e => new { 
            PropertyName = e.PropertyName, 
            ErrorMessage = e.ErrorMessage,
            AttemptedValue = e.AttemptedValue 
        }));
    }
    
    var id = await surveyService.CreateAsync(request);
    return Results.Created($"/api/surveys/{id}", new { id });
})
.WithName("CreateSurvey")
.WithOpenApi();

app.MapPut("/api/surveys/{id:guid}", async (Guid id, UpdateSurveyRequest request, ISurveyService surveyService, IValidator<UpdateSurveyRequest> validator) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors);
    }
    
    try
    {
        await surveyService.UpdateAsync(id, request);
        return Results.NoContent();
    }
    catch (NotFoundException)
    {
        return Results.NotFound();
    }
})
.WithName("UpdateSurvey")
.WithOpenApi();

app.MapDelete("/api/surveys/{id:guid}", async (Guid id, ISurveyService surveyService) =>
{
    try
    {
        await surveyService.DeleteAsync(id);
        return Results.NoContent();
    }
    catch (NotFoundException)
    {
        return Results.NotFound();
    }
})
.WithName("DeleteSurvey")
.WithOpenApi();

// Response endpoints
app.MapPost("/api/surveys/{surveyId:guid}/responses", async (Guid surveyId, SubmitResponseRequest request, IResponseService responseService, IValidator<SubmitResponseRequest> validator) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors);
    }
    
    try
    {
        var result = await responseService.SubmitAsync(surveyId, request);
        return Results.Created($"/api/surveys/{surveyId}/responses/{result.ResponseId}", result);
    }
    catch (NotFoundException)
    {
        return Results.NotFound();
    }
    catch (AppValidationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
})
.WithName("SubmitResponse")
.WithOpenApi();

app.Run();
