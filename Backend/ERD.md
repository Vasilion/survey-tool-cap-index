```mermaid
erDiagram
    Survey ||--o{ Question : contains
    Question ||--o{ AnswerOption : has
    Survey ||--o{ SurveyResponse : has
    SurveyResponse ||--o{ ResponseItem : has
    Question ||--o{ ResponseItem : answered_by
    Question ||--o| Question : parent

    Survey {
      guid Id PK
      string Title
      string Description nullable
    }
    Question {
      guid Id PK
      guid SurveyId FK
      string Text
      int QuestionType
      int Order
      guid ParentQuestionId nullable
      string VisibilityRuleJson nullable
    }
    AnswerOption {
      guid Id PK
      guid QuestionId FK
      string Text
      int Weight
    }
    SurveyResponse {
      guid Id PK
      guid SurveyId FK
      datetime SubmittedAt
      int TotalScore
    }
    ResponseItem {
      guid Id PK
      guid SurveyResponseId FK
      guid QuestionId FK
      string SelectedOptionIdsJson nullable
      string FreeText nullable
      int ItemScore
    }
    VisibilityRule {
      guid ParentQuestionId
      string VisibleWhenSelectedOptionIdsJson
    }
```

## Data Model Details

### JSON Fields

**VisibilityRuleJson (Question table)**

- Stores a JSON serialized `VisibilityRule` object
- Contains `ParentQuestionId` and `VisibleWhenSelectedOptionIds` array
- Used for conditional question display logic

**SelectedOptionIdsJson (ResponseItem table)**

- Stores a JSON serialized array of `Guid` values
- Represents the selected answer option IDs for choice questions
- Empty array for free text questions

### Relationships

- **Survey → Questions**: One-to-many with cascade delete
- **Question → AnswerOptions**: One-to-many with cascade delete
- **Survey → SurveyResponses**: One-to-many with cascade delete
- **SurveyResponse → ResponseItems**: One-to-many with cascade delete
- **Question → ResponseItems**: One-to-many (answers reference questions)
- **Question → Question**: Self-referencing for conditional logic (ParentQuestionId)

### Indexes

- Composite index on `(SurveyId, Order)` for efficient question ordering
- Primary keys on all entities for fast lookups
