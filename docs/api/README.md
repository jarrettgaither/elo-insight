# API Documentation

This document outlines all the API endpoints available in the Elo Insight application.

## Base URL

All API endpoints are relative to the base URL:

- Development: `http://localhost:8080`
- Production: `https://api.elo-insight.com` (example)

## Authentication

Most endpoints require authentication using a JWT token. The token should be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "id": "number",
    "username": "string",
    "email": "string"
  }
  ```
- **Error Response**: `400 Bad Request`, `409 Conflict`

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "token": "string",
    "user": {
      "id": "number",
      "username": "string",
      "email": "string"
    }
  }
  ```
- **Error Response**: `401 Unauthorized`

#### Logout

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### User Profile

#### Get User Profile

- **URL**: `/user/profile`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "id": "number",
    "username": "string",
    "email": "string",
    "steamConnected": "boolean",
    "riotConnected": "boolean"
  }
  ```
- **Error Response**: `401 Unauthorized`

### External Platform Authentication

#### Steam Login

- **URL**: `/steam/login`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: Redirects to Steam authentication page

#### Steam Callback

- **URL**: `/auth/steam/callback`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**: `openid.claimed_id`, `openid.identity`, etc.
- **Success Response**: Redirects to frontend with success message

#### Riot Login

- **URL**: `/riot/login`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: Redirects to Riot authentication page

#### Riot Callback

- **URL**: `/auth/riot/callback`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**: `code`, `state`
- **Success Response**: Redirects to frontend with success message

### Game Statistics

#### Get CS2 Stats

- **URL**: `/api/stats/cs2`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**: `steam_id`
- **Success Response**: `200 OK`
  ```json
  {
    "total_kills": "number",
    "total_deaths": "number",
    "total_time_played": "number",
    "total_wins": "number",
    "total_damage_done": "number",
    "total_money_earned": "number",
    "total_mvps": "number",
    "total_rounds_played": "number",
    "last_match_kills": "number",
    "last_match_deaths": "number",
    "last_match_damage": "number"
  }
  ```
- **Error Response**: `400 Bad Request`, `404 Not Found`

#### Save User Stat Selection

- **URL**: `/user/stats/save`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "game": "string",
    "platform": "string"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Stat saved successfully"
  }
  ```
- **Error Response**: `400 Bad Request`, `401 Unauthorized`

#### Get User Stats

- **URL**: `/user/stats`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "number",
      "game": "string",
      "platform": "string"
    }
  ]
  ```
- **Error Response**: `401 Unauthorized`

## Status Codes

- `200 OK`: The request was successful
- `201 Created`: A new resource was created
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: The user does not have permission
- `404 Not Found`: The resource was not found
- `409 Conflict`: The request conflicts with the current state
- `500 Internal Server Error`: An error occurred on the server

## Rate Limiting

API requests are limited to 100 requests per minute per IP address.
