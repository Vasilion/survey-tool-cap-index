# Survey Tool - Technical Documentation

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Backend Architecture & Implementation](#backend-architecture--implementation)
3. [Frontend Architecture & Implementation](#frontend-architecture--implementation)
4. [Technical Stack & Dependencies](#technical-stack--dependencies)
5. [Design Decisions & Rationale](#design-decisions--rationale)
6. [Component Deep Dive](#component-deep-dive)
7. [Data Flow & API Design](#data-flow--api-design)

---

## High-Level Overview

### Project Purpose

This is a full-stack survey application built for CAP Index that allows users to create, manage, and take surveys with advanced features including:

- **Conditional Question Logic**: Questions can be shown/hidden based on answers to parent questions
- **Weighted Scoring System**: Each answer option has a weight that contributes to a total score
- **Multiple Question Types**: Single choice, multiple choice, and free text questions
- **Survey Management**: Full CRUD operations for surveys

### Technology Stack Overview

- **Backend**: .NET 8 Web API with Clean Architecture
- **Frontend**: React 18 with TypeScript, Material-UI, and React Query
- **Database**: Entity Framework Core with In-Memory provider
- **Validation**: FluentValidation for backend, custom validation for frontend
- **Testing**: xUnit for backend, Vitest for frontend

### Key Features

1. **Survey CRUD Operations**: Create, read, update, and delete surveys
2. **Conditional Questions**: Questions appear based on parent question answers
3. **Weighted Scoring**: Automatic score calculation based on selected options
4. **Real-time UI Updates**: Questions show/hide dynamically as users answer
5. **Response Validation**: Server-side validation ensures data integrity
6. **Responsive Design**: Mobile-first approach with Material-UI

---

## Backend Architecture & Implementation

### Clean Architecture Layers

The backend follows Clean Architecture principles with four distinct layers:

#### 1. Domain Layer (`SurveyTool.Domain`)

**Purpose**: Contains core business entities, value objects, enums, and repository interfaces. This layer has **zero dependencies** on external frameworks.

**Key Components**:

- **Entities**:

  - `Survey`: Root aggregate containing survey metadata and questions
  - `Question`: Represents a survey question with type, order, and conditional logic
  - `AnswerOption`: Represents a choice option with text and weight
  - `SurveyResponse`: Represents a completed survey submission
  - `ResponseItem`: Represents an individual answer within a response

- **Value Objects**:

  - `VisibilityRule`: Encapsulates conditional question logic
    ```csharp
    public class VisibilityRule
    {
        public Guid ParentQuestionId { get; set; }
        public List<Guid> VisibleWhenSelectedOptionIds { get; set; }
    }
    ```

- **Enums**:

  - `QuestionType`: SingleChoice (0), MultipleChoice (1), FreeText (2)

- **Repository Interfaces**:
  - `ISurveyRepository`: Abstracts survey data access
  - `ISurveyResponseRepository`: Abstracts response data access

**Why This Design**: The Domain layer is the heart of the application. By keeping it framework-agnostic, we ensure business logic remains testable and can survive changes to infrastructure (e.g., switching from EF Core to Dapper, or from SQL Server to PostgreSQL).

#### 2. Application Layer (`SurveyTool.Application`)

**Purpose**: Contains business logic, services, DTOs, and validation. Depends only on the Domain layer.

**Key Components**:

**Services**:

- `SurveyService`: Handles survey CRUD operations

  - **CreateAsync**: Creates surveys with questions and options, handling conditional logic
  - **UpdateAsync**: Complex update logic that preserves ID mappings when questions are reordered
  - **GetAsync**: Retrieves surveys with full question hierarchy
  - **ListAsync**: Returns survey summaries
  - **DeleteAsync**: Removes surveys

- `ResponseService`: Handles survey response submission
  - **SubmitAsync**: Main entry point that:
    1. Validates survey exists
    2. Computes visible questions based on answers
    3. Validates answers match question types
    4. Calculates scores for each answer
    5. Stores response with total score

**DTOs (Data Transfer Objects)**:

- `SurveyDto`: Survey with full question hierarchy
- `QuestionDto`: Question with options and visibility rules
- `CreateSurveyRequest`: Request for creating surveys
- `UpdateSurveyRequest`: Request for updating surveys
- `SubmitResponseRequest`: Request for submitting responses
- `SubmitResponseResult`: Response containing ID and total score

**Validation**:

- `CreateSurveyRequestValidator`: Validates survey creation requests
- `UpdateSurveyRequestValidator`: Validates survey update requests
- `QuestionUpsertDtoValidator`: Validates question structure
- `SubmitResponseRequestValidator`: Validates response submission

**Key Algorithms**:

**Visibility Computation** (`ResponseService.ComputeVisibleQuestionIds`):

```csharp
private static HashSet<Guid> ComputeVisibleQuestionIds(
    Survey survey,
    Dictionary<Guid, SubmitAnswerItem> answers)
{
    HashSet<Guid> visible = new HashSet<Guid>();
    foreach (Question q in survey.Questions.OrderBy(x => x.Order))
    {
        if (q.ParentQuestionId == null)
        {
            visible.Add(q.Id); // Root questions are always visible
            continue;
        }

        if (q.VisibilityRule == null) continue;

        // Check if parent question has been answered
        if (!answers.TryGetValue(q.VisibilityRule.ParentQuestionId,
            out SubmitAnswerItem? parentAnswer))
        {
            continue; // Parent not answered, question hidden
        }

        // Check if any selected parent option matches visibility rule
        List<Guid> selected = parentAnswer.SelectedOptionIds ?? new List<Guid>();
        if (selected.Intersect(q.VisibilityRule.VisibleWhenSelectedOptionIds).Any())
        {
            visible.Add(q.Id); // Match found, question visible
        }
    }
    return visible;
}
```

**Scoring Algorithm** (`ResponseService.SubmitAsync`):

```csharp
int itemScore = 0;
if (q.Type == QuestionType.FreeText)
{
    itemScore = 0; // Free text always scores 0
}
else if (q.Type == QuestionType.SingleChoice)
{
    Guid optId = ans.SelectedOptionIds!.Single();
    AnswerOption opt = q.Options.First(x => x.Id == optId);
    itemScore = opt.Weight; // Single choice uses option weight
}
else if (q.Type == QuestionType.MultipleChoice)
{
    foreach (Guid id in ans.SelectedOptionIds!)
    {
        AnswerOption opt = q.Options.First(x => x.Id == id);
        itemScore += opt.Weight; // Multiple choice sums weights
    }
}
total += itemScore;
```

#### 3. Infrastructure Layer (`SurveyTool.Infrastructure`)

**Purpose**: Implements data access, EF Core configuration, and database initialization. Depends on Domain and Application layers.

**Key Components**:

**DbContext** (`SurveyDbContext`):

- Configures entity relationships with cascade deletes
- Sets up JSON serialization for complex types using `ValueConverter`
- Configures indexes for performance (e.g., `(SurveyId, Order)` on Questions)

**Value Converters**:

```csharp
// Converts VisibilityRule to/from JSON string
ValueConverter<VisibilityRule?, string?> visibilityConverter =
    new ValueConverter<VisibilityRule?, string?>(
        v => v == null ? null : JsonSerializer.Serialize(v, null),
        v => v == null ? null : JsonSerializer.Deserialize<VisibilityRule>(v, null)
    );

// Converts List<Guid> to/from JSON string
ValueConverter<List<Guid>, string> guidListConverter =
    new ValueConverter<List<Guid>, string>(
        v => JsonSerializer.Serialize(v, null),
        v => JsonSerializer.Deserialize<List<Guid>>(v, null) ?? new List<Guid>()
    );
```

**Repositories**:

- `SurveyRepository`: Implements `ISurveyRepository` using EF Core

  - Uses `Include()` for eager loading of questions and options
  - Handles cascade deletes manually for In-Memory provider
  - Uses `AsNoTracking()` for read-only list operations

- `SurveyResponseRepository`: Implements `ISurveyResponseRepository`
  - Stores responses with computed scores
  - Includes related response items

**Database Initialization**:

- `DatabaseInitializer`: Seeds the database with a CAP Index survey
- Ensures idempotent seeding (checks if surveys exist first)
- Creates a complete survey with conditional questions demonstrating the feature

#### 4. API Layer (`SurveyTool.Api`)

**Purpose**: Minimal API endpoints, dependency injection, and request/response handling. Depends on all other layers.

**Key Components**:

**Program.cs**:

- Configures dependency injection (Scoped lifetime for all services)
- Sets up EF Core with In-Memory provider
- Configures Swagger/OpenAPI documentation
- Configures CORS for frontend communication
- Sets up global exception handling middleware
- Defines minimal API endpoints

**Dependency Injection**:

```csharp
// Repositories (Scoped - one per HTTP request)
builder.Services.AddScoped<ISurveyRepository, SurveyRepository>();
builder.Services.AddScoped<ISurveyResponseRepository, SurveyResponseRepository>();

// Services (Scoped - one per HTTP request)
builder.Services.AddScoped<ISurveyService, SurveyService>();
builder.Services.AddScoped<IResponseService, ResponseService>();

// FluentValidation (Scoped validators)
builder.Services.AddValidatorsFromAssemblyContaining<CreateSurveyRequestValidator>();
```

**Exception Handling Middleware**:

```csharp
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
            ValidationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.ContentType = "application/json";
        object response = new { message = ex.Message };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
});
```

**API Endpoints**:

**Survey Endpoints**:

- `GET /api/surveys` - List all surveys (returns summaries)
- `GET /api/surveys/{id}` - Get survey by ID (returns full survey with questions)
- `POST /api/surveys` - Create new survey (validates request, returns created ID)
- `PUT /api/surveys/{id}` - Update survey (handles ID remapping for conditional logic)
- `DELETE /api/surveys/{id}` - Delete survey (cascade deletes related entities)

**Response Endpoints**:

- `POST /api/surveys/{surveyId}/responses` - Submit survey response
  - Validates survey exists
  - Computes visible questions
  - Validates answers
  - Calculates scores
  - Returns response ID and total score

### .NET 8 Specific Features Used

1. **Minimal APIs**: Modern .NET approach for defining endpoints without controllers
2. **Top-level Statements**: Simplifies Program.cs structure
3. **Implicit Usings**: Reduces boilerplate with `global using` directives
4. **Nullable Reference Types**: Enabled for better null safety
5. **Record Types**: Could be used for DTOs (currently using classes)
6. **EF Core 9.0**: Latest version with improved performance and features

---

## Frontend Architecture & Implementation

### React 18 Architecture

The frontend is built with React 18, leveraging modern hooks and patterns:

#### Key React 18 Features Used

1. **Concurrent Features**:

   - Automatic batching of state updates
   - Improved rendering performance with concurrent rendering

2. **Hooks**:

   React 18 makes extensive use of [Hooks](https://react.dev/reference/react) to manage state, side effects, memoization, and references within function components. The following core hooks are utilized for their unique benefits:

   - `useState`: Manages _local component state_. Each piece of dynamic data (such as form input values, loading flags, or UI toggles) uses `useState` to trigger updates and re-render the component reactively.
     - **Why**: Simple API, isolates state to component scope, supports functional updates.
   - `useEffect`: Handles _side effects_ and _lifecycle events_, such as fetching data on mount, reacting to state changes, or setting up subscriptions and timers. Cleanup logic can be returned for resource management.
     - **Why**: Ensures synchronization of component with external systems (DOM, timers, API calls), and replaces class lifecycle methods (`componentDidMount`, etc.).
   - `useMemo`: Optimizes performance by _memoizing computed values_. Expensive computations (like filtering, mapping, or sorting lists) only re-run when their dependencies change, preventing unnecessary recalculation on every render.
     - **Why**: Essential for preventing performance bottlenecks in forms or list rendering, especially with dynamic survey logic.
   - `useCallback`: Returns a _memoized callback function_. Useful when passing event handlers (such as `onChange` functions) to deeply nested or memoized components, minimizing unnecessary renders due to unstable function identities.
     - **Why**: Maintains referential equality between renders, which boosts performance with memoized children (e.g., `React.memo`).
   - `useRef`: Provides a mutable _persistent reference_ that survives re-renders. Used for storing DOM elements (focus management, scrolling), tracking previous values, or holding intervals/timeouts without causing extra renders.
     - **Why**: Enables imperative actions or storage of values across renders without triggering rerenders—crucial for managing previous visibility states or interacting with the underlying DOM.

3. **Component Memoization**:
   - `React.memo()`: Prevents unnecessary re-renders
   - Used in `Question` component for performance

#### Project Structure

```
src/
├── api/              # API client and React Query hooks
│   ├── client.ts     # Axios instance configuration
│   └── surveys.ts    # Survey-related API hooks
├── components/       # Reusable UI components
│   ├── Question.tsx  # Question renderer (supports all types)
│   ├── SurveyBuilderDialog.tsx  # Survey creation/editing
│   ├── SurveyViewDialog.tsx     # Survey preview
│   └── survey-form/  # Form-specific components
├── pages/            # Page-level components
│   ├── SurveyPage.tsx          # Take survey page
│   └── SurveyManagementPage.tsx # Manage surveys page
├── hooks/            # Custom React hooks
│   └── useSurveyForm.ts  # Survey form state management
├── utils/            # Utility functions
│   └── visibility.ts # Visibility computation (mirrors backend)
├── types.ts          # TypeScript type definitions
├── constants/        # Application constants
└── styles/           # Global styles and theme
```

### State Management Strategy

#### Server State: React Query (TanStack Query v5)

**Why React Query**:

- Automatic caching and synchronization
- Background refetching
- Optimistic updates
- Request deduplication
- Built-in loading/error states

**Implementation** (`src/api/surveys.ts`):

```typescript
// Query hooks for fetching data
export function useSurveyList() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async (): Promise<SurveySummaryDto[]> => {
      const { data } = await api.get("/api/surveys");
      return data;
    },
  });
}

export function useSurvey(id?: string) {
  return useQuery({
    queryKey: ["survey", id],
    enabled: !!id, // Only fetch when ID is provided
    staleTime: 60_000, // Cache for 60 seconds
    queryFn: async (): Promise<SurveyDto> => {
      const { data } = await api.get(`/api/surveys/${id}`);
      return data;
    },
  });
}

// Mutation hooks for modifying data
export function useCreateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSurveyRequest) => {
      const { data } = await api.post("/api/surveys", payload);
      return data;
    },
    onSuccess: async ({ id }) => {
      // Invalidate and prefetch for immediate UI update
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (id) {
        await queryClient.prefetchQuery({
          queryKey: ["survey", id],
          queryFn: async (): Promise<SurveyDto> => {
            const { data } = await api.get(`/api/surveys/${id}`);
            return data;
          },
        });
      }
    },
  });
}
```

#### Local State: React Hooks

- Form state: `useState` in `useSurveyForm` hook
- UI state: `useState` for dialogs, selected items, etc.
- Computed state: `useMemo` for derived values

**Example** (`SurveyPage.tsx`):

```typescript
const [answers, setAnswers] = useState<Record<string, SubmitAnswerItem>>({});
const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");

// Memoized computed values
const visibleIds: Set<string> = useMemo(() => {
  if (!survey) return new Set<string>();
  return computeVisibleQuestionIds(survey.questions, answers);
}, [survey, answers]);

const visibleQuestions = useMemo((): QuestionDto[] => {
  if (!survey) return [];
  const sorted = [...survey.questions].sort((a, b) => a.order - b.order);
  return sorted.filter((q) => visibleIds.has(q.id));
}, [survey, visibleIds]);

const progress = useMemo(() => {
  const totalVisible = visibleQuestions.length;
  return totalVisible > 0 ? (answeredVisibleCount / totalVisible) * 100 : 0;
}, [visibleQuestions, answeredVisibleCount]);
```

### Component Architecture

#### 1. Page Components

**SurveyPage** (`src/pages/SurveyPage.tsx`):

- Main survey-taking interface
- Manages answer state
- Computes visible questions in real-time
- Handles form submission
- Shows progress indicator

**Key Features**:

- Dynamic question visibility based on answers
- Automatic cleanup of answers for hidden questions
- Progress tracking
- Form validation

**SurveyManagementPage** (`src/pages/SurveyManagementPage.tsx`):

- Survey CRUD interface
- Grid layout of survey cards
- Actions: Create, Edit, View, Delete
- Empty state handling

#### 2. Reusable Components

**Question Component** (`src/components/Question.tsx`):

- Renders different question types:
  - **Single Choice**: Radio buttons
  - **Multiple Choice**: Checkboxes
  - **Free Text**: Textarea
- Shows option weights
- Memoized for performance
- Handles all input types with callbacks

**SurveyBuilderDialog** (`src/components/SurveyBuilderDialog.tsx`):

- Complex form for creating/editing surveys
- Supports conditional question setup
- Question reordering
- Option management
- Validation with error display

#### 3. Custom Hooks

**useSurveyForm** (`src/hooks/useSurveyForm.ts`):

- Manages survey form state
- Handles initialization from existing survey
- Maps frontend question indices to backend IDs
- Handles conditional logic setup
- Validates form data
- Manages save operations (create/update)

**Complex Logic Explained**:

- **ID Mapping**: When editing, frontend uses indices (`parent-0`, `option-1`) but backend needs GUIDs
- **Two-Step Save**: For new surveys with conditional logic, first create without conditionals, then update with proper IDs
- **ID Remapping**: Backend handles ID remapping during updates, preserving relationships

### Utility Functions

#### Visibility Computation (`src/utils/visibility.ts`)

**Purpose**: Mirrors backend logic for real-time UI updates

```typescript
export function computeVisibleQuestionIds(
  questions: QuestionDto[],
  answers: Record<string, SubmitAnswerItem>
): Set<string> {
  const visible = new Set<string>();
  const ordered = [...questions].sort((a, b) => a.order - b.order);

  for (const q of ordered) {
    if (!q.parentQuestionId) {
      visible.add(q.id); // Root questions always visible
      continue;
    }

    if (
      !q.visibleWhenSelectedOptionIds ||
      q.visibleWhenSelectedOptionIds.length === 0
    ) {
      continue; // No visibility rule, question hidden
    }

    const parentAns = answers[q.parentQuestionId];
    if (!parentAns || !parentAns.selectedOptionIds) {
      continue; // Parent not answered, question hidden
    }

    // Check if any selected option matches visibility rule
    const set = new Set(parentAns.selectedOptionIds);
    const matches = q.visibleWhenSelectedOptionIds.some((id) => set.has(id));

    if (matches) {
      visible.add(q.id); // Match found, question visible
    }
  }

  return visible;
}
```

**Why Duplicate Logic**:

- Frontend needs immediate feedback for UX
- Backend validates for security
- Trade-off: Logic duplication requires maintenance in two places
- Future improvement: Extract to shared library or API endpoint

### Material-UI Integration

**Theme Configuration** (`src/styles/theme.ts`):

- Custom color palette
- Typography settings
- Component overrides
- Responsive breakpoints

**Component Usage**:

- `Card`, `CardContent`: Survey and question containers
- `TextField`: Form inputs
- `Select`, `MenuItem`: Dropdowns
- `RadioGroup`, `Checkbox`: Question options
- `Dialog`: Modals for editing/viewing
- `LinearProgress`: Progress indicator
- `Chip`: Labels and tags
- `Button`: Actions

**Responsive Design**:

- Mobile-first approach
- Breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Grid system for layouts
- Conditional rendering based on screen size

### Type Safety

**TypeScript Types** (`src/types.ts`):

- Mirrors backend DTOs exactly
- Ensures compile-time safety
- Prevents type mismatches between frontend and backend

**Example**:

```typescript
export type SurveyDto = {
  id: string;
  title: string;
  description?: string | null;
  questions: QuestionDto[];
};

export type QuestionDto = {
  id: string;
  text: string;
  type: number; // Maps to QuestionType enum
  order: number;
  parentQuestionId?: string | null;
  visibleWhenSelectedOptionIds?: string[] | null;
  options: AnswerOptionDto[];
};
```

---

## Technical Stack & Dependencies

### Backend Dependencies

#### Core Framework

- **.NET 8.0 SDK**: Target framework
  - Latest LTS version
  - Performance improvements
  - Minimal APIs
  - Native AOT support (not used here)

#### API Layer (`SurveyTool.Api`)

- **Microsoft.AspNetCore.OpenApi** (v8.0.21): OpenAPI support
- **Swashbuckle.AspNetCore** (v9.0.6): Swagger UI generation
- **FluentValidation.AspNetCore** (v11.3.1): Request validation integration

#### Application Layer (`SurveyTool.Application`)

- **FluentValidation** (v12.0.0): Validation library
  - Declarative validation rules
  - Type-safe validators
  - Custom error messages

#### Infrastructure Layer (`SurveyTool.Infrastructure`)

- **Microsoft.EntityFrameworkCore** (v9.0.10): ORM framework

  - Code-first approach
  - LINQ queries
  - Change tracking
  - Migrations support (not used with In-Memory)

- **Microsoft.EntityFrameworkCore.InMemory** (v9.0.10): In-Memory database provider
  - No external database required
  - Fast for development/testing
  - Data lost on restart
  - Not suitable for production

### Frontend Dependencies

#### Core Framework

- **React** (v18.3.1): UI library

  - Concurrent rendering
  - Hooks API
  - Component composition

- **React DOM** (v18.3.1): DOM rendering

#### TypeScript

- **TypeScript** (v5.6.3): Type safety
  - Strict mode enabled
  - Path aliases configured
  - Modern ES features

#### UI Framework

- **@mui/material** (v6.1.7): Component library

  - Material Design components
  - Theming system
  - Responsive utilities

- **@mui/icons-material** (v6.1.7): Icon library

- **@emotion/react** (v11.11.4): CSS-in-JS (required by MUI)
- **@emotion/styled** (v11.11.5): Styled components (required by MUI)

#### Data Fetching

- **@tanstack/react-query** (v5.59.13): Server state management

  - Caching
  - Background updates
  - Request deduplication
  - Optimistic updates

- **axios** (v1.7.7): HTTP client
  - Promise-based
  - Interceptors
  - Request/response transformation

#### Build Tools

- **Vite** (v5.4.10): Build tool and dev server

  - Fast HMR (Hot Module Replacement)
  - ES modules
  - Optimized production builds

- **@vitejs/plugin-react** (v4.3.1): React plugin for Vite

#### Testing

- **vitest** (v1.6.0): Test framework

  - Vite-native
  - Jest-compatible API
  - Fast execution

- **@testing-library/react** (v16.0.0): React testing utilities
- **@testing-library/jest-dom** (v6.4.2): DOM matchers
- **@testing-library/user-event** (v14.5.2): User interaction simulation
- **jsdom** (v24.1.0): DOM implementation for Node.js

### Development Tools

- **ESLint**: Code linting (if configured)
- **Prettier**: Code formatting (if configured)
- **Git**: Version control

---

## Design Decisions & Rationale

### Backend Design Decisions

#### 1. Clean Architecture

**Decision**: Separate application into four layers (Domain, Application, Infrastructure, API)

**Rationale**:

- **Testability**: Business logic can be tested without database/HTTP concerns
- **Maintainability**: Changes to infrastructure don't affect business logic
- **Flexibility**: Easy to swap data storage (In-Memory → SQL Server → PostgreSQL)
- **SOLID Principles**: Each layer has a single responsibility

**Trade-offs**:

- More files and complexity
- Slight over-engineering for simple apps
- Worth it for maintainability and testability

#### 2. Repository Pattern

**Decision**: Abstract data access behind interfaces

**Rationale**:

- **Testability**: Can mock repositories in unit tests
- **Flexibility**: Can change data access implementation
- **Separation of Concerns**: Business logic doesn't know about EF Core

**Implementation**:

- Interfaces in Domain layer (no dependencies)
- Implementations in Infrastructure layer (EF Core)
- Services depend on interfaces, not concrete classes

#### 3. Value Objects for Complex Types

**Decision**: Use `VisibilityRule` as a value object stored as JSON

**Rationale**:

- **Type Safety**: Strong typing in domain model
- **Persistence Flexibility**: JSON storage works with any database
- **Domain Expressiveness**: `VisibilityRule` is a domain concept, not just data

**Alternative Considered**: Separate table for visibility rules

- Rejected: Adds complexity, visibility is tightly coupled to questions

#### 4. JSON Serialization for Complex Types

**Decision**: Store `VisibilityRule` and `List<Guid>` as JSON strings

**Rationale**:

- **Simplicity**: Single column instead of related tables
- **Performance**: Single query to load question with visibility rule
- **Flexibility**: Easy to change structure without migrations (In-Memory)

**Trade-offs**:

- Can't query JSON fields easily (In-Memory limitation)
- For production, consider PostgreSQL JSONB or SQL Server JSON columns

#### 5. In-Memory Database

**Decision**: Use EF Core In-Memory provider

**Rationale**:

- **Simplicity**: No database setup required
- **Fast Development**: Quick iteration
- **Demo-Friendly**: Easy for evaluators to run

**Trade-offs**:

- **Data Loss**: Data lost on restart
- **Not Production-Ready**: Limited features, no transactions
- **Migration Path**: Easy to switch to SQL Server/PostgreSQL

#### 6. Minimal APIs vs Controllers

**Decision**: Use Minimal APIs instead of traditional controllers

**Rationale**:

- **Less Boilerplate**: Fewer files, more concise
- **Modern .NET**: Aligns with .NET 6+ patterns
- **Sufficient**: Simple API surface doesn't need controller structure

**Trade-offs**:

- **Less Structure**: Harder to organize for large APIs
- **No Filters**: Can't use action filters easily
- **Acceptable**: For this project size, Minimal APIs are perfect

#### 7. FluentValidation

**Decision**: Use FluentValidation for request validation

**Rationale**:

- **Declarative**: Rules are easy to read and maintain
- **Testable**: Validators can be unit tested
- **Type-Safe**: Compile-time checking
- **Flexible**: Complex validation rules supported

**Alternative**: Data Annotations

- Rejected: Less flexible, harder to test, less readable

#### 8. Exception-Based Error Handling

**Decision**: Use custom exceptions (`NotFoundException`, `ValidationException`)

**Rationale**:

- **Type Safety**: Can catch specific exceptions
- **Clear Intent**: Exception name describes the error
- **Centralized Handling**: Middleware converts to HTTP responses

**Implementation**:

```csharp
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
```

#### 9. Scoped Service Lifetime

**Decision**: All repositories and services are Scoped (one per HTTP request)

**Rationale**:

- **DbContext Lifetime**: EF Core DbContext should be Scoped
- **Request Isolation**: Each request gets its own service instances
- **Memory Efficient**: Services disposed after request completes

**Alternative**: Singleton

- Rejected: DbContext can't be Singleton, would cause concurrency issues

#### 10. Update Strategy: Delete and Recreate

**Decision**: For updates, delete existing survey and create new one with same ID

**Rationale**:

- **Simplicity**: Avoids complex merge logic
- **Data Integrity**: Ensures clean state
- **ID Mapping**: Handles conditional question ID remapping

**Trade-offs**:

- **Not Atomic**: Could lose data if error occurs (mitigated by In-Memory simplicity)
- **Loses History**: Related responses might be orphaned (not an issue for this app)

**Implementation**:

1. Fetch existing survey
2. Delete existing survey (cascade deletes questions/options)
3. Create new survey with same ID
4. Map old question IDs to new IDs for conditional logic
5. Set up parent-child relationships with new IDs

### Frontend Design Decisions

#### 1. React Query for Server State

**Decision**: Use React Query instead of Redux or Context API

**Rationale**:

- **Automatic Caching**: No manual cache management
- **Background Updates**: Keeps data fresh automatically
- **Request Deduplication**: Prevents duplicate API calls
- **Built-in Loading/Error States**: Less boilerplate
- **Optimistic Updates**: Better UX

**Alternative**: Redux

- Rejected: Overkill for this project, more boilerplate
- React Query handles server state better than Redux

#### 2. Local State for Form State

**Decision**: Use `useState` and `useMemo` for form state instead of form libraries

**Rationale**:

- **Simplicity**: No additional dependencies
- **Flexibility**: Full control over form behavior
- **Performance**: Only re-renders what's necessary

**Alternative**: Formik or React Hook Form

- Considered but rejected for simplicity
- Custom hook (`useSurveyForm`) provides similar functionality

#### 3. Duplicate Visibility Logic

**Decision**: Implement visibility computation in both frontend and backend

**Rationale**:

- **UX**: Frontend needs immediate feedback
- **Security**: Backend validates to prevent manipulation
- **Performance**: No API call needed for every answer change

**Trade-offs**:

- **Logic Duplication**: Must maintain in two places
- **Future Improvement**: Extract to shared library or API endpoint

#### 4. Index-Based ID Mapping (Frontend)

**Decision**: Use indices (`parent-0`, `option-1`) in frontend, map to GUIDs for backend

**Rationale**:

- **User Experience**: Users work with question order, not GUIDs
- **Flexibility**: Questions can be reordered without breaking references
- **Simplicity**: Frontend form uses natural indices

**Implementation**:

- Frontend: `parent-0` means "parent is question at index 0"
- Backend: Maps to actual question GUID during save
- Two-step save for new surveys with conditionals:
  1. Create survey without conditionals (get real IDs)
  2. Update survey with conditionals using real IDs

#### 5. Component Memoization

**Decision**: Use `React.memo()` for `Question` component

**Rationale**:

- **Performance**: Prevents unnecessary re-renders
- **Stable References**: `useCallback` ensures stable function references
- **Optimization**: Only re-renders when props change

**Implementation**:

```typescript
const Question = memo(({ question, value, onChange }: Props) => {
  // Component implementation
});
```

#### 6. Material-UI for Components

**Decision**: Use Material-UI instead of custom components or other libraries

**Rationale**:

- **Rapid Development**: Pre-built, tested components
- **Consistent Design**: Material Design system
- **Accessibility**: Built-in ARIA support
- **Theming**: Easy customization
- **Responsive**: Mobile-first design

**Alternative**: Custom components or Tailwind CSS

- Rejected: More development time, less consistency

#### 7. TypeScript for Type Safety

**Decision**: Use TypeScript instead of JavaScript

**Rationale**:

- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better IDE support
- **Refactoring**: Safer code changes
- **Documentation**: Types serve as documentation

**Configuration**:

- Strict mode enabled
- Path aliases for cleaner imports
- ES2020 target
- React JSX transform

#### 8. Vite for Build Tool

**Decision**: Use Vite instead of Create React App or Webpack

**Rationale**:

- **Fast Development**: Instant HMR
- **Modern**: ES modules, native ESM
- **Simple**: Less configuration
- **Fast Builds**: Optimized production builds

**Alternative**: Create React App

- Rejected: Slower, more configuration, legacy tooling

#### 9. Axios for HTTP Client

**Decision**: Use Axios instead of Fetch API

**Rationale**:

- **Interceptors**: Request/response transformation
- **Better Error Handling**: Automatic error parsing
- **Request Cancellation**: Can cancel requests
- **Wider Browser Support**: Better polyfills

**Alternative**: Fetch API

- Rejected: More boilerplate, less features

#### 10. Responsive Design Strategy

**Decision**: Mobile-first approach with Material-UI breakpoints

**Rationale**:

- **User Experience**: Works on all devices
- **Progressive Enhancement**: Start with mobile, enhance for desktop
- **Material-UI**: Built-in responsive utilities

**Implementation**:

- Breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Conditional rendering: `sx={{ display: { xs: 'none', sm: 'block' } }}`
- Grid system: Responsive columns
- Dialog: Full screen on mobile, centered on desktop

---

## Component Deep Dive

### Backend Components

#### SurveyService

**Purpose**: Manages survey CRUD operations

**Key Methods**:

1. **CreateAsync**:

   - Creates survey with questions and options
   - Handles conditional logic setup
   - Generates new GUIDs for all entities
   - Orders questions by `Order` property

2. **UpdateAsync** (Complex):

   - Deletes existing survey
   - Creates new survey with same ID
   - Maps old question IDs to new IDs
   - Maps old option IDs to new IDs
   - Preserves conditional logic relationships
   - Uses index-based mapping for stability

3. **GetAsync**:

   - Retrieves survey with full hierarchy
   - Maps domain entities to DTOs
   - Orders questions by `Order`
   - Includes visibility rules

4. **ListAsync**:

   - Returns survey summaries (ID and title only)
   - Uses `AsNoTracking()` for performance
   - No eager loading needed

5. **DeleteAsync**:
   - Cascades to questions and options
   - Handles manual cascade delete for In-Memory provider

#### ResponseService

**Purpose**: Handles survey response submission

**Key Methods**:

1. **SubmitAsync** (Main Flow):

   ```
   1. Validate survey exists
   2. Create dictionaries for fast lookup
   3. Validate all answers reference valid questions
   4. Compute visible questions based on answers
   5. Validate answers are only for visible questions
   6. Validate answer types match question types
   7. Create SurveyResponse entity
   8. Calculate scores for each answer
   9. Store response with total score
   10. Return result with ID and score
   ```

2. **ComputeVisibleQuestionIds**:

   - Iterates questions in order
   - Root questions (no parent) are always visible
   - Child questions check parent answer
   - Uses set intersection for efficient matching

3. **ValidateAnswerForType**:
   - FreeText: Must have no selected options
   - SingleChoice: Must have exactly one selected option
   - MultipleChoice: Must have at least one selected option
   - All options must be valid for the question

#### SurveyRepository

**Purpose**: Data access for surveys

**Key Methods**:

1. **GetByIdAsync**:

   - Uses `Include()` for eager loading
   - Loads questions and options in single query
   - Returns null if not found

2. **ListAsync**:

   - Uses `AsNoTracking()` for read-only
   - Returns list of surveys (no eager loading)

3. **AddAsync**:

   - Adds survey to context
   - Saves changes
   - EF Core handles cascade inserts

4. **UpdateAsync**:

   - Updates survey in context
   - Saves changes
   - Note: Not used, UpdateAsync in service deletes and recreates

5. **DeleteAsync**:
   - Manually deletes related entities (In-Memory limitation)
   - Removes options, then questions, then survey
   - Saves changes

#### SurveyDbContext

**Purpose**: EF Core database context

**Key Configurations**:

1. **Entity Relationships**:

   - Survey → Questions: One-to-many, cascade delete
   - Question → Options: One-to-many, cascade delete
   - Survey → Responses: One-to-many, cascade delete
   - Response → Items: One-to-many, cascade delete

2. **Value Converters**:

   - `VisibilityRule` ↔ JSON string
   - `List<Guid>` ↔ JSON string

3. **Indexes**:

   - Composite index on `(SurveyId, Order)` for questions
   - Improves query performance for ordered questions

4. **Required Fields**:
   - Survey.Title: Required
   - Question.Text: Required
   - Cascade deletes configured

### Frontend Components

#### SurveyPage

**Purpose**: Main survey-taking interface

**State Management**:

- `selectedSurveyId`: Currently selected survey
- `answers`: Record of question ID → answer
- `prevVisibleIdsRef`: Ref to track visibility changes
- `prevSurveyIdRef`: Ref to track survey changes

**Computed Values** (useMemo):

- `visibleIds`: Set of visible question IDs
- `visibleIdsString`: Serialized for comparison
- `visibleQuestions`: Filtered and sorted questions
- `answeredVisibleCount`: Count of answered visible questions
- `progress`: Percentage completion

**Key Effects**:

- Cleanup answers for hidden questions when visibility changes
- Reset answers when survey changes

**Event Handlers**:

- `handleChange`: Updates answer for a question
- `handleSubmit`: Submits survey response
- `handleSurveyChange`: Changes selected survey
- `handleReset`: Resets form after submission

#### Question Component

**Purpose**: Renders individual questions

**Props**:

- `question`: QuestionDto to render
- `value`: Current answer (optional)
- `onChange`: Callback when answer changes

**Rendering Logic**:

- **SingleChoice**: RadioGroup with Radio buttons
- **MultipleChoice**: Checkboxes with FormControlLabel
- **FreeText**: TextField (multiline)

**Features**:

- Shows question type chip
- Shows option weights
- Memoized to prevent unnecessary re-renders
- Handles all input types with type-safe callbacks

#### useSurveyForm Hook

**Purpose**: Manages survey form state and operations

**State**:

- `title`, `description`: Survey metadata
- `questions`: Array of question DTOs
- `questionIdMap`: Map of index → GUID for editing
- `errors`: Validation errors
- `apiError`: API error message

**Initialization**:

- Loads existing survey if `surveyId` provided
- Maps backend GUIDs to frontend indices
- Converts visibility rules to frontend format

**Operations**:

- `addQuestion`: Adds new question
- `updateQuestion`: Updates question at index
- `deleteQuestion`: Removes question
- `addOption`: Adds option to question
- `updateOption`: Updates option
- `deleteOption`: Removes option

**Validation**:

- Title required
- Question text required
- Options required for choice questions
- Option text required

**Save Logic**:

- **Update**: Maps frontend indices to backend GUIDs
- **Create without conditionals**: Creates survey, gets IDs
- **Create with conditionals**: Two-step process (create, then update)

#### SurveyBuilderDialog

**Purpose**: Survey creation/editing interface

**Features**:

- Form for survey metadata (title, description)
- Dynamic question list
- Question type selection
- Option management
- Conditional logic setup
- Validation with error display
- Save/Cancel actions

**Sub-components**:

- `QuestionFormField`: Individual question editor
- `OptionsField`: Option list editor
- `ConditionalLogicField`: Conditional logic setup

---

## Data Flow & API Design

### Request/Response Flow

#### Survey Creation Flow

```
Frontend (SurveyBuilderDialog)
  ↓
useSurveyForm.handleSave()
  ↓
useCreateSurvey mutation
  ↓
API: POST /api/surveys
  ↓
Program.cs: MapPost endpoint
  ↓
FluentValidation: Validate request
  ↓
SurveyService.CreateAsync()
  ↓
SurveyRepository.AddAsync()
  ↓
EF Core: Save to In-Memory DB
  ↓
Return: { id: Guid }
  ↓
React Query: onSuccess callback
  ↓
Invalidate queries, prefetch new survey
  ↓
UI updates automatically
```

#### Survey Response Submission Flow

```
Frontend (SurveyPage)
  ↓
User answers questions
  ↓
computeVisibleQuestionIds() (frontend)
  ↓
Questions show/hide in real-time
  ↓
User clicks "Submit Survey"
  ↓
useSubmitResponse mutation
  ↓
API: POST /api/surveys/{surveyId}/responses
  ↓
FluentValidation: Validate request
  ↓
ResponseService.SubmitAsync()
  ↓
1. Validate survey exists
  ↓
2. ComputeVisibleQuestionIds() (backend)
  ↓
3. Validate answers match visible questions
  ↓
4. Validate answer types
  ↓
5. Calculate scores
  ↓
6. Create SurveyResponse entity
  ↓
7. Save to database
  ↓
Return: { responseId, totalScore }
  ↓
UI shows success message with score
```

### API Contract Design

#### Survey DTOs

**SurveyDto** (Response):

```json
{
  "id": "guid",
  "title": "string",
  "description": "string | null",
  "questions": [
    {
      "id": "guid",
      "text": "string",
      "type": 0,  // 0=SingleChoice, 1=MultipleChoice, 2=FreeText
      "order": 0,
      "parentQuestionId": "guid | null",
      "visibleWhenSelectedOptionIds": ["guid"] | null,
      "options": [
        {
          "id": "guid",
          "text": "string",
          "weight": 0
        }
      ]
    }
  ]
}
```

**CreateSurveyRequest** (Request):

```json
{
  "title": "string",
  "description": "string | null",
  "questions": [
    {
      "text": "string",
      "type": 0,
      "order": 0,
      "parentQuestionId": "guid | null",
      "visibleWhenSelectedOptionIds": ["guid"] | null,
      "options": [
        {
          "text": "string",
          "weight": 0
        }
      ]
    }
  ]
}
```

**Note**: Create request doesn't include IDs (generated by backend)

#### Response DTOs

**SubmitResponseRequest** (Request):

```json
{
  "answers": [
    {
      "questionId": "guid",
      "selectedOptionIds": ["guid"] | null,  // For choice questions
      "freeText": "string" | null  // For free text questions
    }
  ]
}
```

**SubmitResponseResult** (Response):

```json
{
  "responseId": "guid",
  "totalScore": 0
}
```

### Error Handling

#### Backend Error Responses

**404 Not Found**:

```json
{
  "message": "Survey not found"
}
```

**400 Bad Request** (Validation):

```json
[
  {
    "propertyName": "Title",
    "errorMessage": "Survey title is required",
    "attemptedValue": null
  }
]
```

**400 Bad Request** (Business Logic):

```json
{
  "message": "Answer provided for hidden question"
}
```

#### Frontend Error Handling

- React Query: Automatic error state management
- `isError`: Boolean flag
- `error`: Error object
- Display: Alert component with error message

### CORS Configuration

**Backend** (`Program.cs`):

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

**Rationale**:

- Development: Allows frontend on different port
- Production: Should restrict to specific origins

---

## Summary

This survey application demonstrates:

1. **Clean Architecture**: Proper separation of concerns with testable business logic
2. **Modern .NET**: .NET 8 Minimal APIs with EF Core
3. **React 18**: Modern React patterns with hooks and React Query
4. **Type Safety**: Full TypeScript coverage on frontend
5. **Validation**: Both client-side (UX) and server-side (security)
6. **Conditional Logic**: Complex business rules with parent-child relationships
7. **Scoring System**: Weighted scoring with automatic calculation
8. **Responsive Design**: Mobile-first approach with Material-UI
9. **Error Handling**: Comprehensive error handling at all layers
10. **Testing**: Unit tests for backend services

The application is production-ready in terms of architecture and code quality, with the exception of the In-Memory database (which should be replaced with a real database for production use).

---

## Interview Talking Points

### Architecture Decisions

- **Clean Architecture**: Explain the four layers and why they're separated
- **Repository Pattern**: Why abstract data access?
- **Value Objects**: Why use VisibilityRule as a value object?
- **Minimal APIs**: Why choose Minimal APIs over Controllers?

### Technical Implementation

- **Conditional Logic**: How does the visibility computation work?
- **Scoring Algorithm**: How are scores calculated?
- **ID Mapping**: How does the update process handle ID remapping?
- **JSON Storage**: Why store complex types as JSON?

### Frontend Decisions

- **React Query**: Why use React Query instead of Redux?
- **State Management**: How is state organized?
- **Component Architecture**: How are components structured?
- **Type Safety**: How does TypeScript help?

### Performance

- **Memoization**: Where and why is memoization used?
- **Eager Loading**: How does EF Core loading work?
- **Caching**: How does React Query cache data?

### Testing

- **Unit Tests**: What is tested and how?
- **Test Doubles**: How are repositories mocked?
- **Test Coverage**: What areas need more testing?

### Future Improvements

- **Database**: Replace In-Memory with SQL Server/PostgreSQL
- **Shared Logic**: Extract visibility computation to shared library
- **Authentication**: Add user authentication
- **Analytics**: Add response analytics and reporting
- **Pagination**: Add pagination for large surveys
- **Export**: Export responses to CSV/Excel
- **Real-time**: WebSocket for real-time collaboration

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Project**: Survey Tool for CAP Index
