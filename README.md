# InsurEase: Insurance Policy Management and Query System

## Project Overview

InsurEase is a comprehensive insurance policy management and query system. It consists of a FastAPI backend and a React frontend, providing user management, authentication, policy management, insurance management, and an AI-powered chatbot for handling insurance-related queries.

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [Project Structure](#project-structure)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Installation and Setup](#installation-and-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Task Runner Commands](#task-runner-commands)

## Technologies Used

- Backend: Python, FastAPI, MongoDB, PyJWT, bcrypt, LlamaIndex, PyPDF2, Poetry
- Frontend: React, TypeScript, Tailwind CSS
- Task Runner: Task (Go Task)

## Project Structure

The project is divided into two main directories: `backend` and `frontend`, with a `Taskfile.yml` in the root directory for task management.

### Backend Structure

        backend/
        ├── app/
        │ ├── main.py
        │ ├── core/
        │ ├── models/
        │ ├── services/
        │ ├── api/
        │ ├── db/
        │ └── tests/
        └── pyproject.toml


### Frontend Structure

        frontend/
        ├── src/
        │ ├── components/
        │ ├── hooks/
        │ ├── interfaces/
        │ ├── utils/
        │ ├── tests/
        │ ├── App.tsx
        │ └── main.tsx
        ├── package.json
        └── tailwind.config.js


## Backend

### Backend Key Components

1. `main.py`: The main FastAPI application file.
2. `core/`: Contains core functionality like configuration, dependencies, and security.
3. `models/`: Defines data models for users, insurance, and chatbot queries.
4. `services/`: Business logic for user, policy, insurance, and chatbot operations.
5. `api/`: API route definitions and endpoint implementations.
6. `db/`: Database configuration and connection management.

### API Endpoints

- `/api/v1/auth`: Authentication endpoints
- `/api/v1/users`: User management endpoints
- `/api/v1/policies`: Policy management endpoints
- `/api/v1/insurance`: Insurance-related endpoints
- `/api/v1/chatbot`: Chatbot query endpoints

## Frontend

### Frontend Key Components

1. `App.tsx`: The root component, handling routing and overall layout.
2. `useAuth.tsx`: Custom hook for authentication state management.
3. `Login.tsx` and `Register.tsx`: Components for user authentication.
4. `UpdateUser.tsx`: Component for updating user profiles.
5. `Nav.tsx`: Navigation component.
6. `Gpt.tsx`: chatbot interface.
7. `AdminPolicies.tsx` and `AdminUsers.tsx`: Admin components for managing policies and users.

## Installation and Setup

1. Clone the repository
2. Open in devcontainer
3. Run the installation task:
    `task install`
This will install both backend and frontend dependencies.

## Running the Application

To start both the backend and frontend servers:
`task start`

This command will start both the backend and frontend servers concurrently.

To stop the servers:
`task stop`

## Testing

To run all tests (backend unit, backend integration, and frontend):
task test

For specific test suites:

- Backend unit tests: `task test:backend:unit`
- Backend integration tests: `task test:backend:integration`
- Frontend tests: `task test:frontend`

## Task Runner Commands

The project uses Task for managing various commands. Here's a summary of available tasks:

- `task install`: Install all dependencies for both backend and frontend
- `task install backend`: Install backend dependencies
- `task install frontend`: Install frontend dependencies
- `task start`: Start both backend and frontend servers
- `task stop`: Stop both backend and frontend servers
- `task frontend`: Start only the frontend server
- `task backend`: Start only the backend server
- `task test`: Run all tests
- `task test:backend:unit`: Run backend unit tests
- `task test:backend:integration`: Run backend integration tests
- `task test:frontend`: Run frontend tests
