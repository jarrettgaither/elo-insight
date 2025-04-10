# Development Setup Guide

This guide provides instructions for setting up the Elo Insight development environment.

## Prerequisites

- **Go** (v1.16+)
- **Node.js** (v14+) and npm
- **Docker** and Docker Compose
- **PostgreSQL** (if running locally without Docker)
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd elo-insight
```

### 2. Environment Setup

#### Backend Environment

Create a `.env` file in the `backend` directory:

```
# Server settings
PORT=8080
GIN_MODE=debug

# Database settings
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=elo_insight

# JWT settings
JWT_SECRET=your_jwt_secret_key

# External API keys
STEAM_API_KEY=your_steam_api_key
RIOT_API_KEY=your_riot_api_key
```

#### Frontend Environment

Create a `.env` file in the `frontend` directory:

```
REACT_APP_API_URL=http://localhost:8080
```

### 3. Docker Setup (Recommended)

The easiest way to run the application is using Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:8080
- PostgreSQL database

### 4. Manual Setup (Alternative)

#### Backend Setup

```bash
cd backend
go mod download
go run main.go
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

#### Database Setup

If running PostgreSQL locally, create a database named `elo_insight` and update the `.env` file with your local connection details.

## API Keys

To use the external gaming APIs, you'll need to obtain API keys:

- **Steam API Key**: Register at https://steamcommunity.com/dev/apikey
- **Riot API Key**: Register at https://developer.riotgames.com/

## Development Workflow

1. Create a new branch for each feature or bugfix
2. Make changes and test locally
3. Submit a pull request for review
4. After approval, merge into the main branch

## Testing

### Backend Tests

```bash
cd backend
go test ./...
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Code Style

- **Backend**: Follow Go standard formatting (use `gofmt`)
- **Frontend**: Use ESLint and Prettier with the provided configuration

## Documentation

When adding new features, please update the relevant documentation in the `docs` directory.
