# Database Schema

This document outlines the database schema for the Elo Insight application.

## Entity Relationship Diagram

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│     Users     │       │  PlatformLinks │       │   UserStats   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ username      │       │ user_id       │───┐   │ user_id       │───┐
│ email         │       │ platform_type │   │   │ game          │   │
│ password_hash │       │ platform_id   │   │   │ platform      │   │
│ created_at    │◄──────│ auth_token    │   │   │ created_at    │   │
│ updated_at    │       │ created_at    │   │   │ updated_at    │   │
└───────────────┘       │ updated_at    │   │   └───────────────┘   │
        ▲               └───────────────┘   │                       │
        │                                   │                       │
        └───────────────────────────────────┴───────────────────────┘
```

## Tables

### Users

Stores user account information.

| Column        | Type         | Constraints       | Description                    |
|---------------|--------------|-------------------|--------------------------------|
| id            | SERIAL       | PRIMARY KEY       | Unique identifier              |
| username      | VARCHAR(50)  | NOT NULL, UNIQUE  | User's display name            |
| email         | VARCHAR(100) | NOT NULL, UNIQUE  | User's email address           |
| password_hash | VARCHAR(255) | NOT NULL          | Bcrypt hashed password         |
| created_at    | TIMESTAMP    | NOT NULL          | Account creation timestamp     |
| updated_at    | TIMESTAMP    | NOT NULL          | Account last updated timestamp |

### PlatformLinks

Stores connections to external gaming platforms.

| Column        | Type         | Constraints                      | Description                     |
|---------------|--------------|----------------------------------|---------------------------------|
| id            | SERIAL       | PRIMARY KEY                      | Unique identifier               |
| user_id       | INTEGER      | NOT NULL, FOREIGN KEY (Users.id) | Reference to user               |
| platform_type | VARCHAR(20)  | NOT NULL                         | Platform type (steam, riot)     |
| platform_id   | VARCHAR(100) | NOT NULL                         | External platform identifier    |
| auth_token    | VARCHAR(255) |                                  | OAuth token (if applicable)     |
| created_at    | TIMESTAMP    | NOT NULL                         | Link creation timestamp         |
| updated_at    | TIMESTAMP    | NOT NULL                         | Link last updated timestamp     |

### UserStats

Stores user's game statistics preferences.

| Column     | Type         | Constraints                      | Description                     |
|------------|--------------|----------------------------------|---------------------------------|
| id         | SERIAL       | PRIMARY KEY                      | Unique identifier               |
| user_id    | INTEGER      | NOT NULL, FOREIGN KEY (Users.id) | Reference to user               |
| game       | VARCHAR(50)  | NOT NULL                         | Game identifier (cs2, lol)      |
| platform   | VARCHAR(20)  | NOT NULL                         | Platform type (steam, riot)     |
| created_at | TIMESTAMP    | NOT NULL                         | Preference creation timestamp   |
| updated_at | TIMESTAMP    | NOT NULL                         | Preference last updated timestamp |

## Indexes

- `users_email_idx`: Index on `Users.email` for faster login lookups
- `platform_links_user_id_idx`: Index on `PlatformLinks.user_id` for faster user-platform lookups
- `platform_links_platform_id_idx`: Index on `PlatformLinks.platform_id` for faster external ID lookups
- `user_stats_user_id_idx`: Index on `UserStats.user_id` for faster user-stat lookups

## Constraints

- `users_email_unique`: Unique constraint on `Users.email`
- `users_username_unique`: Unique constraint on `Users.username`
- `platform_links_user_platform_unique`: Unique constraint on `PlatformLinks.user_id` and `PlatformLinks.platform_type` to prevent duplicate platform connections

## Migrations

Database migrations will be managed using a migration tool (e.g., golang-migrate) to ensure consistent schema changes across environments.
