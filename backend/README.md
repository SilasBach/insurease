# InsurEase Backend

## Project Overview

InsurEase is an insurance policy management and query system. This backend application provides user management, authentication, policy management, insurance management, and a chatbot interface for querying insurance policies.

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [Project Structure](#project-structure)
3. [Key Components](#key-components)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [Database](#database)
7. [Chatbot Integration](#chatbot-integration)
8. [Error Handling](#error-handling)
9. [Package Management](#package-management)

## Technologies Used

- Python 3.x
- FastAPI
- MongoDB (with Motor for async operations)
- PyJWT for JSON Web Tokens
- bcrypt for password hashing
- LlamaIndex for chatbot functionality
- PyPDF2 for PDF processing
- Poetry for package management

## Project Structure

        app/
        ├── main.py
        |
        ├── core/
        │   ├── init.py
        │   ├── config.py
        │   ├── deps.py
        │   └── security.py
        |
        ├── models/
        │   ├── init.py
        │   ├── user.py
        │   ├── insurance.py
        │   └── chatbot.py
        |
        ├── services/
        │       ├── init.py
        │       ├── user_service.py
        │       ├── policy_service.py
        │       ├── insurance_service.py
        │       └── chatbot_service.py
        |
        ├── api/
        │   ├── init.py
        │   ├── deps.py
        │   │── api.py
        │   ├── v1/
        │        ├── init.py
        │        ├── endpoints/
        │        │ ├── init.py
        │        │ ├── user.py
        │        │ ├── auth.py
        │        │ ├── policy.py
        │        │ ├── insurance.py
        │        │ └── chatbot.py
        │
        |
        ├── db/
        │ ├── init.py
        │ └── mongodb.py
        |
        └── tests/
        ├──────init.py
        ├──────integration/
        │         └── test_integration_db.py
        ├──────unit/
        │         ├── test_chatbot_service.py
        │         ├── test_insurance_service.py
        │         ├── test_policy_service.py
        │         ├── test_user_service.py
        │         ├── test_deps.py
        │         └── test_security.py
        └────────reports/
                ├── Integration/
                │   └── report.html
                └── unit/
                    └── report.html

## Key Components

1. `main.py`: The main FastAPI application file.
2. `core/`: Contains core functionality like configuration, dependencies, and security.
3. `models/`: Defines data models used in the application, including user, insurance, and chatbot models.
4. `services/`: Business logic for user, policy, insurance, and chatbot operations.
5. `api/`: API route definitions and endpoint implementations.
6. `db/`: Database configuration and connection management.
7. `tests/`: Unit and integration tests for the application.

## API Endpoints

- `/api/v1/auth`: Authentication endpoints (login, logout, token refresh)
- `/api/v1/users`: User management endpoints
- `/api/v1/policies`: Policy management endpoints
- `/api/v1/insurance`: Insurance-related endpoints
- `/api/v1/chatbot`: Chatbot query endpoints

## Authentication

The application uses JWT for authentication. Tokens are set as HTTP-only cookies for enhanced security.

## Database

MongoDB is used as the database. User data is stored in the `users` collection of the `InsurEaseDB` database.

## Chatbot Integration

The chatbot functionality is implemented in two main components:

1. `information_query.py`: Handles general queries about insurance policies. It uses OpenAI's GPT model to process and answer questions based on the content of multiple insurance policy documents.

2. `compare_query.py`: Provides functionality to compare two specific insurance policies. It extracts relevant information from the policies and uses OpenAI's GPT model to generate a comparison based on a user's query.

## Error Handling

The application includes comprehensive error handling for various scenarios, including authentication errors, database errors, and chatbot processing errors.

## Package Management

This project uses Poetry for dependency management. The `pyproject.toml` file contains all the project dependencies and their versions. To add a new dependency, use:
poetry add <package-name>