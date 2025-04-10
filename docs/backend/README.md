# Backend Architecture

This document outlines the architecture and design of the Elo Insight backend.

## Directory Structure

```
backend/
├── cmd/                # Application entry points
│   └── api/            # API server
│       └── main.go     # Main application entry point
├── config/             # Configuration management
│   └── config.go       # Configuration loading and validation
├── internal/           # Private application code
│   ├── auth/           # Authentication logic
│   ├── database/       # Database connection and migrations
│   ├── handlers/       # HTTP request handlers
│   ├── middleware/     # HTTP middleware
│   ├── models/         # Database models
│   ├── platform/       # External platform integrations
│   │   ├── steam/      # Steam API integration
│   │   └── riot/       # Riot API integration
│   ├── repository/     # Data access layer
│   ├── routes/         # API route definitions
│   └── services/       # Business logic
└── pkg/                # Public libraries that can be used by other applications
    ├── apierror/       # API error handling
    ├── logger/         # Logging utilities
    └── validator/      # Input validation
```

## Component Design

### Configuration Management

- Environment-based configuration using `.env` files
- Validation of required configuration values
- Centralized access to configuration values

### Database Layer

- Connection management with PostgreSQL
- Database migrations for schema versioning
- Transaction support

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- OAuth integration for Steam and Riot

### Request Handling

- RESTful API endpoints
- Input validation
- Error handling and standardized responses

### External API Integration

- Steam API client for CS2 statistics
- Riot API client for League of Legends statistics
- Rate limiting and caching

## Design Patterns

### Repository Pattern

The repository pattern is used to abstract data access logic:

```go
// UserRepository defines methods for accessing user data
type UserRepository interface {
    GetByID(id uint) (*models.User, error)
    GetByEmail(email string) (*models.User, error)
    Create(user *models.User) error
    Update(user *models.User) error
    Delete(id uint) error
}

// Implementation
type userRepository struct {
    db *gorm.DB
}
```

### Service Pattern

The service pattern encapsulates business logic:

```go
// AuthService defines authentication methods
type AuthService interface {
    Register(username, email, password string) (*models.User, error)
    Login(email, password string) (string, *models.User, error)
    ValidateToken(token string) (*models.User, error)
}

// Implementation
type authService struct {
    userRepo repository.UserRepository
    config   *config.Config
}
```

### Middleware Pattern

Middleware functions for request processing:

```go
// RequireAuth middleware validates JWT tokens
func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Token validation logic
        // ...
        c.Next()
    }
}
```

## Error Handling

Standardized error responses:

```go
// APIError represents a standardized API error
type APIError struct {
    Status  int    `json:"-"`
    Code    string `json:"code"`
    Message string `json:"message"`
}

// Example usage
if err != nil {
    c.JSON(http.StatusBadRequest, apierror.New(apierror.InvalidInput, "Invalid email format"))
    return
}
```

## Logging

Structured logging with log levels:

```go
logger.Info("User registered", logger.Fields{
    "user_id": user.ID,
    "email":   user.Email,
})

logger.Error("Failed to connect to database", logger.Fields{
    "error": err.Error(),
})
```

## Testing Strategy

- Unit tests for individual components
- Integration tests for API endpoints
- Mock external dependencies for testing
- Test coverage reporting

## Performance Considerations

- Connection pooling for database access
- Caching of frequently accessed data
- Rate limiting for external API calls
- Pagination for large result sets
