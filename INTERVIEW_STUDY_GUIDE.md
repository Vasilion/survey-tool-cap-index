# Survey Tool - Interview Study Guide

## Quick Reference for Technical Discussions

---

## 🎯 Tech Stack Overview

### Backend Stack

#### .NET 8.0

**What**: Latest LTS version of Microsoft's framework
**Why**:

- Modern Minimal APIs reduce boilerplate
- Performance improvements over .NET 6/7
- Active support and ecosystem
- Type-safe, compiled language

#### Entity Framework Core 9.0

**What**: Object-Relational Mapping (ORM) framework
**Why**:

- Code-first approach (define entities, EF creates schema)
- LINQ queries (type-safe database queries)
- Change tracking (automatically detects changes)
- Easy to switch database providers (In-Memory → SQL Server/PostgreSQL)

#### In-Memory Database

**What**: EF Core In-Memory provider (no real database)
**Why**:

- No setup required for demo/evaluation
- Fast development iteration
- Easy for evaluators to run
  **Trade-off**: Data lost on restart, not production-ready

#### FluentValidation

**What**: Declarative validation library
**Why**:

- Readable validation rules (e.g., `RuleFor(x => x.Title).NotEmpty()`)
- Testable validators (can unit test validation logic)
- Type-safe (compile-time checking)
- Better than Data Annotations (more flexible, easier to test)

#### Minimal APIs

**What**: Modern .NET approach to define endpoints without controllers
**Why**:

- Less boilerplate (fewer files, more concise)
- Modern .NET 6+ pattern
- Perfect for simple API surface
  **Example**: `app.MapGet("/api/surveys", async (ISurveyService service) => ...)`

#### Clean Architecture (4 Layers)

**What**: Separation into Domain, Application, Infrastructure, API layers
**Why**:

- **Testability**: Business logic testable without database/HTTP
- **Maintainability**: Infrastructure changes don't affect business logic
- **Flexibility**: Easy to swap data storage implementations
- **SOLID Principles**: Each layer has single responsibility

### Frontend Stack

#### React 18

**What**: UI library for building user interfaces
**Why**:

- Concurrent rendering (improved performance)
- Hooks API (modern state management)

  **Commonly Used React Hooks:**

  - `useState`  
    _Manages local component state._  
    Example:

    ```javascript
    const [count, setCount] = useState(0);
    ```

  - `useEffect`  
    _Runs side effects after render (e.g., data fetching, subscriptions)._  
    Example:

    ```javascript
    useEffect(() => {
      fetchData();
    }, []);
    ```

  - `useContext`  
    _Accesses React Context values (for global/shared state)._  
    Example:

    ```javascript
    const user = useContext(UserContext);
    ```

  - `useMemo`  
    _Memoizes expensive calculations, recalculating only when dependencies change._  
    Example:

    ```javascript
    const filtered = useMemo(() => items.filter(...), [items]);
    ```

  - `useCallback`  
    _Returns a memoized callback function that only changes if dependencies do._  
    Example:

    ```javascript
    const handleClick = useCallback(() => { ... }, []);
    ```

  - `useRef`  
    _Stores a mutable value that persists across renders (commonly for DOM access)._  
    Example:

    ```javascript
    const inputRef = useRef();
    ```

  - `useReducer`  
    _Alternative to `useState` for complex or multi-field state logic, similar to Redux reducer pattern._  
    Example:

    ```javascript
    const [state, dispatch] = useReducer(reducer, initialState);
    ```

  - `useLayoutEffect`  
    _Like `useEffect`, but fires synchronously after all DOM mutations (for layout measurements or DOM updates)._

  - `useImperativeHandle`  
    _Customizes the instance value that is exposed when using `ref` with React's `forwardRef`._

- Component composition (reusable, modular code)
- Large ecosystem and community

#### TypeScript

**What**: Typed superset of JavaScript
**Why**:

- Catch errors at compile time (before runtime)
- Better IDE support (IntelliSense, autocomplete)
- Serves as documentation (types show what data structures look like)
- Safer refactoring (compiler catches breaking changes)

#### React Query (TanStack Query)

**What**: Server state management library
**Why**:

- **Automatic caching** (no manual cache management)
- **Background updates** (keeps data fresh automatically)
- **Request deduplication** (prevents duplicate API calls)
- **Built-in loading/error states** (less boilerplate)
- **Optimistic updates** (better UX)

**Alternative Considered**: Redux

- Rejected: Overkill for this project, React Query handles server state better

#### Material-UI (MUI)

**What**: React component library implementing Material Design
**Why**:

- Pre-built, tested components (rapid development)
- Consistent design system
- Built-in accessibility (ARIA support)
- Easy theming and customization
- Responsive utilities out of the box

#### Axios

**What**: HTTP client library
**Why**:

- Interceptors (transform requests/responses)
- Better error handling (automatic error parsing)
- Request cancellation support
- Wider browser support than Fetch API

#### Vite

**What**: Build tool and dev server
**Why**:

- **Fast HMR** (Hot Module Replacement - instant updates)
- **Modern**: ES modules, native ESM
- **Simple**: Less configuration than Webpack
- **Fast builds**: Optimized production builds

---

## 🏗️ Architecture Overview

### Backend Architecture (Clean Architecture)

```
┌─────────────────────────────────────┐
│         API Layer                   │ ← HTTP endpoints, dependency injection
│   (SurveyTool.Api)                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │ ← Business logic, services, DTOs
│   (SurveyTool.Application)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Domain Layer                 │ ← Entities, value objects, interfaces
│   (SurveyTool.Domain)               │   (NO dependencies on frameworks)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Infrastructure Layer             │ ← EF Core, repositories, database
│   (SurveyTool.Infrastructure)       │
└─────────────────────────────────────┘
```

**Why This Structure**:

- Domain layer has zero dependencies (testable, portable)
- Application layer contains business logic (independent of infrastructure)
- Infrastructure implements data access (can be swapped)
- API layer is thin (just endpoints and DI)

### Frontend Architecture

```
┌─────────────────────────────────────┐
│         Pages                       │ ← Route-level components
│   (SurveyPage, SurveyManagementPage)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Components                     │ ← Reusable UI components
│   (Question, SurveyBuilderDialog)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Hooks                       │ ← Custom business logic hooks
│   (useSurveyForm, useSurvey)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    React Query                      │ ← Server state (caching, fetching)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         API Client                  │ ← Axios instance, API calls
│   (client.ts, surveys.ts)           │
└─────────────────────────────────────┘
```

**State Management Strategy**:

- **Server State**: React Query (surveys, responses)
- **Local State**: React hooks (form state, UI state)
- **Computed State**: `useMemo` (visible questions, progress)

---

## 🔌 API Design

### Endpoints

#### Survey Management

- `GET /api/surveys` → List all surveys (summaries)
- `GET /api/surveys/{id}` → Get full survey with questions
- `POST /api/surveys` → Create new survey
- `PUT /api/surveys/{id}` → Update survey
- `DELETE /api/surveys/{id}` → Delete survey

#### Response Submission

- `POST /api/surveys/{surveyId}/responses` → Submit survey response

### API Design Decisions

#### Why Minimal APIs?

- Less boilerplate than controllers
- Modern .NET pattern
- Sufficient for simple API surface
- More concise code

#### Why RESTful Design?

- Standard HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs (`/api/surveys/{id}`)
- Clear, predictable API structure
- Easy to understand and use

#### Error Handling

- **404**: NotFoundException → "Survey not found"
- **400**: ValidationException → Validation errors with details
- **500**: Generic exception → Internal server error

**How**: Global exception middleware converts exceptions to HTTP responses

#### Request Validation

- **FluentValidation**: Validates all requests before reaching services
- **Type-safe**: Compile-time checking
- **Testable**: Validators can be unit tested
- **Declarative**: Easy to read and maintain

**Example**:

```csharp
RuleFor(x => x.Title).NotEmpty();
RuleForEach(x => x.Questions).SetValidator(new QuestionValidator());
```

---

## 🧩 Key Components & Logic

### Backend Components

#### 1. SurveyService

**Purpose**: Manages survey CRUD operations

**Key Logic**:

- **CreateAsync**: Creates survey, generates GUIDs, orders questions
- **UpdateAsync**: Complex - deletes and recreates (handles ID remapping for conditional logic)
- **GetAsync**: Loads survey with full hierarchy, maps to DTOs
- **ListAsync**: Returns summaries (performance optimization)

**Why Delete-and-Recreate for Updates?**

- Simpler than complex merge logic
- Ensures clean state
- Handles conditional question ID remapping correctly

#### 2. ResponseService

**Purpose**: Handles survey response submission

**Key Logic Flow**:

```
1. Validate survey exists
2. Create lookup dictionaries (fast access)
3. Validate all answers reference valid questions
4. Compute visible questions based on answers
5. Validate answers are only for visible questions
6. Validate answer types match question types
7. Calculate scores for each answer
8. Store response with total score
9. Return result
```

**Visibility Computation Algorithm**:

```csharp
// Root questions (no parent) → Always visible
// Child questions → Check if parent answer matches visibility rule
// Use set intersection for efficient matching
```

**Scoring Algorithm**:

- **FreeText**: Always scores 0
- **SingleChoice**: Uses selected option's weight
- **MultipleChoice**: Sums all selected option weights
- **Total**: Sum of all item scores

#### 3. Repository Pattern

**What**: Abstract data access behind interfaces

**Why**:

- Testability (can mock repositories)
- Flexibility (can change data access implementation)
- Separation of concerns (business logic doesn't know about EF Core)

**Implementation**:

- Interfaces in Domain layer (no dependencies)
- Implementations in Infrastructure layer (EF Core)
- Services depend on interfaces, not concrete classes

### Frontend Components

#### 1. SurveyPage

**Purpose**: Main survey-taking interface

**Key Logic**:

- **State**: `answers` (Record<string, SubmitAnswerItem>)
- **Computed Values** (useMemo):
  - `visibleIds`: Set of visible question IDs
  - `visibleQuestions`: Filtered and sorted questions
  - `progress`: Percentage completion

**How It Works**:

1. User selects survey → React Query fetches
2. User answers questions → Updates `answers` state
3. `computeVisibleQuestionIds()` runs → Updates visible questions
4. Questions show/hide dynamically
5. User submits → POST to API with all answers

**Why useMemo?**

- Prevents recalculating on every render
- Only recalculates when dependencies change
- Performance optimization

#### 2. Question Component

**Purpose**: Renders individual questions

**Key Logic**:

- **SingleChoice**: RadioGroup (one selection)
- **MultipleChoice**: Checkboxes (multiple selections)
- **FreeText**: Textarea (text input)

**Why React.memo?**

- Prevents unnecessary re-renders
- Only re-renders when props change
- Performance optimization for lists

#### 3. useSurveyForm Hook

**Purpose**: Manages survey form state

**Key Logic**:

- **Initialization**: Maps backend GUIDs to frontend indices
- **ID Mapping**: Frontend uses indices (`parent-0`), backend uses GUIDs
- **Two-Step Save**: For new surveys with conditionals:
  1. Create survey without conditionals (get real IDs)
  2. Update survey with conditionals using real IDs

**Why Two-Step Save?**

- Frontend works with question indices (user-friendly)
- Backend needs GUIDs for relationships
- First create gets real IDs, then update uses those IDs

#### 4. Visibility Computation (Frontend)

**Purpose**: Real-time UI updates

**Algorithm** (same as backend):

```
1. Root questions (no parent) → Always visible
2. Child questions → Check parent answer
3. If parent answer matches visibility rule → Show question
4. Otherwise → Hide question
```

**Why Duplicate Backend Logic?**

- **UX**: Immediate feedback (no API call needed)
- **Security**: Backend validates anyway
- **Performance**: No network delay

**Trade-off**: Logic duplication (must maintain in two places)

---

## 🎯 Key Algorithms Explained

### 1. Conditional Question Visibility

**Problem**: Questions should only show when parent question has specific answers

**Solution**:

```typescript
// Frontend & Backend (same logic)
for each question:
  if no parent → always visible
  else:
    get parent answer
    if parent answer has any option in visibility rule → visible
    else → hidden
```

**Why This Approach?**

- Simple intersection check
- Efficient (Set operations)
- Supports multiple parent options (OR logic)

### 2. Scoring System

**Problem**: Calculate score based on selected answer options

**Solution**:

```
FreeText: 0 points
SingleChoice: selected option's weight
MultipleChoice: sum of all selected option weights
Total: sum of all question scores
```

**Why This Design?**

- Flexible (each option has independent weight)
- Supports multiple choice (sum weights)
- Clear business rule (free text = 0)

### 3. ID Remapping (Update)

**Problem**: When updating survey, questions get new IDs, but conditional logic references old IDs

**Solution**:

1. Delete existing survey
2. Create new survey with same ID
3. Map old question IDs to new IDs (by order index)
4. Map old option IDs to new IDs (by order index)
5. Update conditional logic with new IDs

**Why This Approach?**

- Simpler than complex merge logic
- Ensures clean state
- Order-based mapping is stable

---

## 🔑 React Hooks Explained

### useState

**What**: Manages component state
**Why**: React's built-in state management
**Example**: `const [answers, setAnswers] = useState({})`

### useEffect

**What**: Handles side effects (API calls, subscriptions, cleanup)
**Why**: React's lifecycle hook
**Example**: Cleanup answers when visibility changes

### useMemo

**What**: Memoizes computed values
**Why**: Prevents expensive recalculations on every render
**Example**: `const visibleIds = useMemo(() => computeVisible(...), [deps])`

### useCallback

**What**: Memoizes callback functions
**Why**: Prevents creating new functions on every render (important for React.memo)
**Example**: `const handleChange = useCallback((value) => {...}, [deps])`

### useRef

**What**: Persistent reference that doesn't trigger re-renders
**Why**: Store previous values, DOM references, timers
**Example**: `const prevVisibleIdsRef = useRef('')` (track previous state)

### Custom Hooks (useSurveyForm)

**What**: Extract reusable logic into functions
**Why**:

- Reusability (use in multiple components)
- Separation of concerns (logic separate from UI)
- Testability (can test hooks independently)

---

## 💡 Design Patterns Used

### 1. Repository Pattern

**What**: Abstract data access
**Why**: Testability, flexibility

### 2. Service Layer Pattern

**What**: Encapsulate business logic
**Why**: Separation of concerns, testability

### 3. DTO Pattern

**What**: Separate API contracts from domain entities
**Why**: API stability, versioning, security

### 4. Dependency Injection

**What**: Inject dependencies rather than creating them
**Why**: Loose coupling, testability, flexibility

### 5. Value Object Pattern

**What**: Model domain concepts as immutable objects
**Why**: Type safety, domain expressiveness (e.g., `VisibilityRule`)

---

## 🚀 Interview Talking Points

### Architecture

- **Clean Architecture**: Explain the 4 layers and why separation matters
- **Repository Pattern**: Why abstract data access?
- **Dependency Injection**: How it enables testability

### Technical Decisions

- **React Query vs Redux**: Why React Query for server state?
- **TypeScript**: How it improves code quality
- **Minimal APIs**: Why choose over controllers?

### Algorithms

- **Visibility Computation**: How conditional questions work
- **Scoring**: How scores are calculated
- **ID Remapping**: How updates handle conditional logic

### Performance

- **useMemo/useCallback**: Why memoization matters
- **React.memo**: When and why to use it
- **Eager Loading**: How EF Core loading works

### Testing

- **Unit Tests**: What's tested (services, not repositories)
- **Test Doubles**: How repositories are mocked
- **Test Coverage**: What areas need more testing

### Future Improvements

- **Database**: Replace In-Memory with SQL Server/PostgreSQL
- **Shared Logic**: Extract visibility computation to shared library
- **Authentication**: Add user authentication
- **Analytics**: Response analytics and reporting
- **Real-time**: WebSocket for collaboration

---

## 📝 Quick Reference: Key Concepts

### Backend

- **Clean Architecture**: 4 layers (Domain, Application, Infrastructure, API)
- **Repository Pattern**: Abstract data access
- **FluentValidation**: Declarative validation
- **Minimal APIs**: Modern endpoint definition
- **EF Core**: ORM with code-first approach
- **Scoped Services**: One instance per HTTP request

### Frontend

- **React Query**: Server state management
- **useMemo**: Memoized computed values
- **useCallback**: Memoized callbacks
- **React.memo**: Component memoization
- **TypeScript**: Type safety
- **Material-UI**: Component library

### Key Algorithms

- **Visibility**: Check parent answer against visibility rule
- **Scoring**: Sum weights based on question type
- **ID Remapping**: Map old IDs to new IDs by order

---

**Remember**: Focus on the "why" behind each decision, not just the "what". Be ready to explain trade-offs and alternatives considered.
