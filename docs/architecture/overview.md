# Elo Insight Architecture Overview

This document provides a high-level overview of the Elo Insight application architecture.

## System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│   Go Backend    │◄────►│   PostgreSQL    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 ▲
                                 │
                                 ▼
                         ┌─────────────────┐
                         │  External APIs  │
                         │                 │
                         │  - Steam API    │
                         │  - Riot API     │
                         └─────────────────┘
```

## Component Overview

### Frontend (React/TypeScript)
- **User Interface**: React components for user interaction
- **State Management**: React hooks for local state management
- **API Integration**: Axios for API requests to the backend
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS for responsive design

### Backend (Go/Gin)
- **API Server**: Gin web framework for RESTful API endpoints
- **Authentication**: JWT-based authentication system
- **External API Integration**: Connectors for Steam and Riot APIs
- **Data Processing**: Business logic for processing game statistics
- **Database Access**: GORM for database operations

### Database (PostgreSQL)
- **User Data**: User accounts and profiles
- **Game Statistics**: User game statistics preferences
- **Authentication**: Session management and tokens

### External Services
- **Steam API**: For Counter-Strike 2 statistics
- **Riot API**: For League of Legends statistics

## Data Flow

1. User authenticates via the frontend
2. Frontend requests game statistics from the backend
3. Backend validates the request and user authentication
4. Backend retrieves data from external gaming APIs
5. Backend processes and formats the data
6. Backend returns formatted data to the frontend
7. Frontend displays the data to the user

## Security Considerations

- JWT authentication for secure API access
- HTTPS for all communications
- Secure storage of API keys and credentials
- Input validation on all endpoints
- CORS configuration to prevent unauthorized access

## Deployment Architecture

The application is containerized using Docker, with separate containers for:
- Frontend
- Backend
- Database

Docker Compose is used for local development, while production deployment can be configured for cloud platforms.
