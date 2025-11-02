# 📊 Survey Tool

A full-stack survey application built with .NET 8 and React 18, featuring conditional questions, weighted scoring, and a modern responsive UI.

## 🏗️ Architecture

This project follows Clean Architecture principles with clear separation of concerns:

- **Backend**: .NET 8 Web API with Entity Framework Core (In-Memory)
- **Frontend**: React 18 with TypeScript, Material-UI, and React Query
- **Database**: In-Memory database with seed data
- **Testing**: xUnit unit tests

## 📋 Notes For Cap Index Team

- **React 18**: I used react 18 specifically because after talking to Laura, she said thats what the team was currently using. If I was to use my choice, I would have chosen Next js or React 19. I also really love Angular as I have over a decade of experience with it. That said, I think my implementation of React 18 here was well done.
- **ENV File**: I am aware that typically you would not commit an env file to a repo, however for simplicity sake for the team to run the project locally, I have included it.
- **Front End Extra**: I know the assignment only asked for a way to take the survey, but i figured it would be better if you could utillize the entire API so i have included a Manage Surveys Page.

## 🚀 Quick Start

### Prerequisites

- **.NET 8 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd Backend
   ```

2. **Restore dependencies:**

   ```bash
   dotnet restore
   ```

3. **Build the solution:**

   ```bash
   dotnet build
   ```

4. **Run the API:**

   ```bash
   dotnet run --project .\src\SurveyTool.Api\SurveyTool.Api.csproj
   ```

   The API will be available at: `https://localhost:7000` or `http://localhost:5148`

5. **View API Documentation:**
   - Swagger UI: `https://localhost:7000/swagger` (HTTPS) or `http://localhost:5148/swagger` (HTTP)

### Frontend Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:5173`

   **Note:** Make sure the backend is running on port 5148 for the frontend to connect properly.

   This uses React Query for API calls and Material UI for components.

## 🗄️ Database Schema (ERD)

The Entity Relationship Diagram (ERD) is located at:
**`Backend/ERD.md`**

### How to View the ERD:

1. **Option 1 - Direct File Viewing:**

   - Open `Backend/ERD.md` in any Markdown viewer
   - The file contains a Mermaid diagram that will render in GitHub, VS Code, or other Markdown viewers

2. **Option 2 - Online Mermaid Viewer:**

   - Copy the Mermaid code from `Backend/ERD.md`
   - Paste it into [Mermaid Live Editor](https://mermaid.live/)
   - View the interactive diagram

### ERD Overview:

The database schema includes:

- **Surveys**: Main survey entities with title and description
- **Questions**: Survey questions with types and conditional logic
- **AnswerOptions**: Multiple choice options with weights
- **SurveyResponses**: User responses to surveys
- **ResponseItems**: Individual answers within responses
- **VisibilityRules**: Conditional question display logic

## 🧪 Testing

### Backend Tests

Run the unit tests from the Backend directory:

```bash
cd Backend
dotnet test
```

### Frontend Tests

Run the frontend tests from the frontend directory:

```bash
cd frontend
npm test
```

Additional test commands:

- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

## 📁 Project Structure

```
survey-tool-cap-index/
├── Backend/                          # .NET 8 Backend
│   ├── src/
│   │   ├── SurveyTool.Api/          # Web API layer
│   │   ├── SurveyTool.Application/  # Application layer (services, DTOs)
│   │   ├── SurveyTool.Domain/       # Domain layer (entities, interfaces)
│   │   └── SurveyTool.Infrastructure/ # Infrastructure layer (EF Core, repos)
│   ├── tests/
│   │   └── SurveyTool.UnitTests/    # Unit tests
│   └── ERD.md                       # Database schema diagram
├── frontend/                         # React 18 Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── api/                     # API client and hooks
│   │   ├── types/                   # TypeScript type definitions
│   │   └── utils/                   # Utility functions
│   ├── package.json
│   └── vite.config.ts
└── README.md                        # This file
```

## 🎯 Architectural Decisions

This section documents key architectural decisions and their rationale:

### Backend Architecture

#### Clean Architecture Layers

The backend is organized into four distinct layers following Clean Architecture principles:

- **Domain Layer** (`SurveyTool.Domain`): Contains entities, value objects, enums, and repository interfaces. This layer has no dependencies on external frameworks.
- **Application Layer** (`SurveyTool.Application`): Contains business logic, services, DTOs, and validation. Depends only on the Domain layer.
- **Infrastructure Layer** (`SurveyTool.Infrastructure`): Implements repository interfaces, EF Core configurations, and database context. Depends on both Domain and Application layers.
- **API Layer** (`SurveyTool.Api`): Minimal API endpoints, dependency injection configuration, and request/response handling. Depends on all other layers.

**Rationale**: This separation ensures business logic is independent of infrastructure concerns, making the codebase testable, maintainable, and allowing for easy swapping of data storage implementations.

#### Repository Pattern

Data access is abstracted through repository interfaces defined in the Domain layer and implemented in the Infrastructure layer.

- **Interfaces**: `ISurveyRepository`, `ISurveyResponseRepository` in Domain layer
- **Implementations**: Concrete repositories in Infrastructure layer using EF Core
- **Benefits**: Decouples business logic from data access, enables easy testing with mock repositories

#### Value Objects

Complex domain concepts are modeled as value objects:

- **`VisibilityRule`**: Encapsulates conditional question visibility logic (ParentQuestionId + VisibleWhenSelectedOptionIds)
- Stored as JSON in the database using EF Core value converters
- Provides type safety and domain expressiveness while maintaining persistence flexibility

#### JSON Serialization Strategy

Complex types are stored as JSON strings in the database:

- **`VisibilityRule`** → JSON string in `Question.VisibilityRuleJson`
- **`List<Guid>`** (SelectedOptionIds) → JSON string in `ResponseItem.SelectedOptionIdsJson`
- **Implementation**: EF Core `ValueConverter<T, string>` for transparent serialization/deserialization
- **Rationale**: Simplifies schema while maintaining strong typing in the domain model. For production, consider dedicated JSON column types if supported by the database provider.

#### Dependency Injection

- Service lifetimes: All repositories and services are registered as `Scoped` (one instance per HTTP request)
- Interface-based design: Services depend on interfaces (`ISurveyService`, `IResponseService`) rather than concrete implementations
- Configuration centralized in `Program.cs`

#### Minimal APIs vs Controllers

The API uses .NET Minimal APIs instead of traditional controllers.

- **Rationale**: Reduced boilerplate, more concise code, and aligns with modern .NET patterns
- **Trade-off**: Less structure than controllers but sufficient for this application's API surface

#### Request Validation

- **FluentValidation**: Used for all request validation (e.g., `CreateSurveyRequestValidator`)
- **Validation Layer**: Separate validation classes in `SurveyTool.Application/Validation`
- **Error Handling**: Custom `ValidationException` returned with appropriate HTTP status codes

#### Exception Handling Strategy

Custom exception types for domain-specific errors:

- **`NotFoundException`**: For missing resources (404)
- **`ValidationException`**: For invalid requests (400)
- **Middleware**: Exception handling middleware in `Program.cs` converts exceptions to HTTP responses

#### In-Memory Database

EF Core In-Memory provider is used for data persistence.

- **Rationale**: Simplifies setup for demo/evaluation purposes, no database server required
- **Limitations**: Data is lost on application restart; not suitable for production
- **Migration Path**: Can be swapped for SQL Server, PostgreSQL, etc. by changing the EF provider configuration

### Frontend Architecture

#### State Management

- **React Query**: Used for server state management (caching, synchronization, background updates)
- **Local State**: React hooks (`useState`, `useReducer`) for component-level UI state
- **Rationale**: React Query handles API state automatically, reducing boilerplate and providing excellent developer experience

#### Type Safety

- **TypeScript**: Full type coverage across the application
- **Shared Types**: Frontend types mirror backend DTOs for compile-time safety
- **API Client**: Typed API client using Axios with TypeScript interfaces

#### Business Logic Replication

The visibility computation logic (`computeVisibleQuestionIds`) is implemented in both frontend and backend:

- **Frontend**: Used for real-time UI updates as users answer questions
- **Backend**: Used for validation when submitting responses
- **Rationale**: Provides immediate feedback in the UI while ensuring server-side validation
- **Trade-off**: Logic duplication requires maintenance in two places; consider extracting to a shared library or API endpoint for production

#### Component Architecture

- **Page Components**: Route-level components in `pages/` directory
- **Reusable Components**: Shared UI components in `components/` directory
- **Custom Hooks**: Business logic extracted to hooks (e.g., `useSurveyForm`) for reusability
- **Utility Functions**: Pure functions in `utils/` (e.g., visibility computation)

#### API Client Design

- **Centralized Configuration**: Single Axios instance with base URL configuration
- **API Modules**: Separate modules for different resources (`surveys.ts`, `responses.ts`)
- **Environment Variables**: API base URL configurable via `VITE_API_BASE_URL`

### Testing Strategy

#### Backend Testing

- **xUnit**: Testing framework
- **Test Doubles**: Fake implementations of repositories (`FakeSurveyRepository`, `FakeSurveyResponseRepository`) for isolated unit tests
- **Service Testing**: Services tested in isolation without EF Core dependencies

#### Frontend Testing

- **Vitest**: Modern testing framework with Vite integration
- **React Testing Library**: For component testing
- **Unit Tests**: Utility functions and business logic tested independently

### Data Model Decisions

#### Question Types as Enum

Question types (`SingleChoice`, `MultipleChoice`, `FreeText`) are modeled as an enum stored as an integer in the database.

- **Rationale**: Simple, performant, and easy to extend
- **Storage**: Efficient integer storage vs. string-based types

#### Scoring System

- **Weighted Options**: Each answer option has a `Weight` property
- **Aggregation**: Multiple choice questions sum selected option weights
- **Free Text**: Always scores zero (business rule)
- **Total Score**: Calculated and stored on `SurveyResponse` for reporting

#### Conditional Logic

- **Parent-Child Relationships**: Questions can have `ParentQuestionId` for hierarchical structure
- **Visibility Rules**: Questions shown conditionally based on parent question selections
- **Validation**: Backend enforces that hidden questions cannot be answered

### Design Patterns Used

1. **Repository Pattern**: Abstracts data access
2. **Service Layer Pattern**: Encapsulates business logic
3. **DTO Pattern**: Separates API contracts from domain entities
4. **Dependency Injection**: Enables loose coupling and testability
5. **Value Object Pattern**: Models domain concepts like `VisibilityRule`
6. **Exception Handling Pattern**: Domain-specific exceptions with centralized handling

## 🔧 Development

### Backend Development

The backend uses:

- **Minimal APIs** for endpoint definitions
- **Entity Framework Core** with In-Memory provider
- **FluentValidation** for request validation
- **Swagger/OpenAPI** for API documentation
- **Clean Architecture** with dependency injection

### Frontend Development

The frontend uses:

- **React 18** with TypeScript
- **Material-UI** for components and theming
- **React Query** for server state management
- **Vite** for fast development and building
- **Responsive design** with mobile-first approach

## 🌐 API Endpoints

### Surveys

- `GET /api/surveys` - List all surveys
- `GET /api/surveys/{id}` - Get survey by ID
- `POST /api/surveys` - Create new survey
- `PUT /api/surveys/{id}` - Update survey
- `DELETE /api/surveys/{id}` - Delete survey

### Responses

- `POST /api/surveys/{surveyId}/responses` - Submit survey response

## 🆘 Troubleshooting

### Common Issues

1. **Backend won't start:**

   - Ensure .NET 8 SDK is installed
   - Check if port 5000/7000 is available
   - Run `dotnet restore` to restore packages

2. **Frontend won't start:**

   - Ensure Node.js 18+ is installed
   - Run `npm install` to install dependencies
   - Check if port 5173 is available

3. **API calls failing:**

   - Ensure backend is running on the correct port
   - Check CORS configuration
   - Verify API endpoints in Swagger UI

4. **Build errors:**
   - Clean and rebuild: `dotnet clean && dotnet build`
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall

---

**Happy Surveying! 📊✨**
