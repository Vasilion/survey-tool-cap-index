# 📊 Survey Tool

A full-stack survey application built with .NET 8 and React 18, featuring conditional questions, weighted scoring, and a modern responsive UI.

## 🏗️ Architecture

This project follows Clean Architecture principles with clear separation of concerns:

- **Backend**: .NET 8 Web API with Entity Framework Core (In-Memory)
- **Frontend**: React 18 with TypeScript, Material-UI, and React Query
- **Database**: In-Memory database with seed data
- **Testing**: xUnit unit tests

## 📋 Notes For Cap Index Team

- **React 18**: I used react 18 specifically because after talking to Laura, she said thats what the team was currently using.
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
