 <div align="center">

# AI MCQ Generator

### AI-Powered Multiple Choice Question Generator

Generate interactive multiple-choice quizzes from PDF documents using Google Gemini AI.

<p>
  <img src="https://img.shields.io/badge/Python-Backend-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Framework-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Google-Gemini-4285F4?logo=google" alt="Google Gemini">
  <img src="https://img.shields.io/badge/LangChain-AI%20Integration-green" alt="LangChain">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-orange" alt="Frontend">
</p>

<p>
  <a href="https://github.com/ItsMukundKumar/AI-MCQ-Generator">Repository</a>
  &nbsp; | &nbsp;
  <a href="https://github.com/ItsMukundKumar">GitHub Profile</a>
</p>

</div>

---

## Overview

**AI MCQ Generator** is an AI-powered web application that automatically generates multiple-choice questions from uploaded PDF documents.

The application uses Google's Gemini AI through LangChain to understand document content and generate relevant questions.

Users can upload study materials, configure quiz settings, attempt generated questions, submit their answers, and evaluate their performance.

The goal of this project is to make learning and self-assessment easier by transforming study documents into interactive quizzes.

## Features

<table>
  <tr>
    <td width="50%">
      <h3>PDF Upload</h3>
      Upload PDF documents to generate questions from learning materials.
    </td>
    <td width="50%">
      <h3>AI-Powered Generation</h3>
      Generate context-based multiple-choice questions using Google Gemini.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Quiz Configuration</h3>
      Select the number of questions and difficulty level.
    </td>
    <td>
      <h3>Interactive Quiz Interface</h3>
      Attempt questions with navigation, answer selection, and progress tracking.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Answer Evaluation</h3>
      Submit answers and automatically calculate quiz performance.
    </td>
    <td>
      <h3>Results and Explanations</h3>
      Review results, correct answers, and explanations.
    </td>
  </tr>
</table>

## Technology Stack

| Category | Technology |
|---|---|
| Programming Language | Python |
| Backend Framework | FastAPI |
| AI Model | Google Gemini |
| AI Framework | LangChain |
| Data Validation | Pydantic |
| PDF Validation | PyPDF |
| Frontend | HTML5, CSS3, JavaScript |
| API Communication | REST API, Fetch API |
| Server | Uvicorn |
| Deployment | Render |
| Version Control | Git and GitHub |

## Application Workflow

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>01</strong><br>Upload PDF</td>
      <td align="center">→</td>
      <td align="center"><strong>02</strong><br>Configure Quiz</td>
      <td align="center">→</td>
      <td align="center"><strong>03</strong><br>Generate Questions</td>
    </tr>
    <tr>
      <td align="center"><strong>04</strong><br>Attempt Quiz</td>
      <td align="center">→</td>
      <td align="center"><strong>05</strong><br>Submit Answers</td>
      <td align="center">→</td>
      <td align="center"><strong>06</strong><br>View Results</td>
    </tr>
  </table>
</div>

## Project Structure

```text
AI-MCQ-Generator/
│
├── app/
│   ├── routes/
│   │   ├── evaluation.py
│   │   ├── generate.py
│   │   ├── results.py
│   │   ├── session.py
│   │   └── upload.py
│   │
│   ├── schemas/
│   │   ├── evaluation.py
│   │   ├── generation.py
│   │   ├── mcq.py
│   │   └── session.py
│   │
│   ├── services/
│   │   ├── evaluator.py
│   │   ├── llm_service.py
│   │   └── mcq_generator.py
│   │
│   ├── utils/
│   │   ├── file_validation.py
│   │   └── session_manager.py
│   │
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── quiz.js
│   │   ├── results.js
│   │   ├── theme-init.js
│   │   └── ui.js
│   │
│   └── index.html
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Getting Started

Follow these steps to run the application locally.

### Prerequisites

Make sure you have installed:

- Python 3.10 or later
- Git
- A Google Gemini API key
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/ItsMukundKumar/AI-MCQ-Generator.git
```

Navigate to the project directory:

```bash
cd AI-MCQ-Generator
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate the virtual environment.

**Windows:**

```bash
.venv\Scripts\activate
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root project directory.

Use `.env.example` as a reference for the required environment variables.

Add your Google Gemini API key and other required application settings using the exact variable names defined in `app/config.py`.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The variable name above is illustrative. Use the actual name expected by your application configuration.

**Security:** Never upload your `.env` file or API credentials to GitHub.

### 5. Run the Backend

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

### 6. Access API Documentation

FastAPI automatically provides interactive API documentation.

| Documentation | URL |
|---|---|
| Swagger UI | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |
| Health Check | http://127.0.0.1:8000/health |

### 7. Run the Frontend

Open the `frontend` directory using a local development server, such as the VS Code Live Server extension.

Ensure that the frontend API configuration in `frontend/js/api.js` points to your backend:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

Use the actual API configuration structure already present in your project.

## API Endpoints

The backend provides REST API endpoints for uploading documents, managing sessions, generating questions, evaluating answers, and retrieving results.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Check API health |
| POST | `/upload/` | Upload and validate PDF |
| GET | `/sessions/{session_id}` | Retrieve session details |
| POST | `/sessions/{session_id}/configure` | Configure quiz settings |
| POST | `/generate/{session_id}` | Generate MCQs |
| POST | `/evaluation/{session_id}` | Submit and evaluate answers |

The results functionality is implemented separately in `app/routes/results.py`. Refer to Swagger documentation for its exact route and response format.

## Security

The application follows several security practices:

- API keys are stored in environment variables.
- Environment files are excluded from Git version control.
- Uploaded PDF documents undergo file validation.
- Correct answers and explanations are kept separate from public quiz questions until evaluation.
- CORS middleware enables communication between the frontend and backend.

## Deployment

The application is intended to be deployed using [Render](https://render.com/).

The planned deployment architecture consists of:

| Component | Deployment |
|---|---|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| AI Integration | Google Gemini API |

Production environment variables and frontend-backend API URLs must be configured through the Render dashboard.

## Future Enhancements

Potential improvements for future versions:

- Database integration for persistent quiz sessions.
- User authentication and account management.
- Quiz history and performance analytics.
- Support for additional document formats.
- More advanced question customization.
- Improved AI-generated question validation.

## Contributing

Contributions and suggestions are welcome.

1. Fork this repository.
2. Create a new branch.
3. Make your changes.
4. Commit your changes.
5. Push your branch.
6. Submit a Pull Request.

## Author

<div align="center">

### Mukund Kumar

GitHub: [@ItsMukundKumar](https://github.com/ItsMukundKumar)

Project: [AI MCQ Generator](https://github.com/ItsMukundKumar/AI-MCQ-Generator)

</div>

---

<div align="center">

**AI MCQ Generator**

*Transform study materials into interactive learning experiences.*

</div>