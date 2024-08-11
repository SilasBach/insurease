# Dockerfile
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libssl-dev \
    libffi-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python 3.11
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev

# Set the working directory
WORKDIR /stchatbot

# Copy backend files
COPY ./backend /backend

# Install poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Add poetry to PATH
ENV PATH="/root/.local/bin:$PATH"

# Configure Poetry to create the virtual environment in the project directory
RUN poetry config virtualenvs.in-project true

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install @go-task/cli globally
RUN npm install -g @go-task/cli

# Copy frontend files
COPY ./frontend /frontend

# Expose port 3000 and 8000
EXPOSE 3000
EXPOSE 8000