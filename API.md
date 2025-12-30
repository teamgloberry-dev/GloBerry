# CAFÉ International API Documentation

## Overview
REST API for the CAFÉ International Development Experience Platform.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

### Projects

#### GET /projects
Get all projects.

**Response:**
```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "status": "active|completed|on-hold",
    "created_by": 1,
    "creator_name": "string",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /projects
Create a new project. **Requires authentication.**

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "active|completed|on-hold" // optional, defaults to "active"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "status": "active",
  "created_by": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /projects/:id
Update a project. **Requires authentication and ownership.**

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "active|completed|on-hold"
}
```

#### GET /projects/search
Search projects with query parameters.

**Query Parameters:**
- `q` (string): Search term for title, description, or creator name
- `status` (string): Filter by project status

**Response:** Same as GET /projects

#### GET /projects/:id/stats
Get project statistics.

**Response:**
```json
{
  "total_experiences": "10",
  "avg_rating": "4.2",
  "contributors": "5",
  "recent_activity": "3"
}
```

### Experiences

#### GET /projects/:id/experiences
Get all experiences for a specific project.

**Response:**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "user_id": 1,
    "title": "string",
    "content": "string",
    "tags": ["tag1", "tag2"],
    "rating": 5,
    "author_name": "string",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /experiences
Create a new experience. **Requires authentication.**

**Request Body:**
```json
{
  "project_id": 1,
  "title": "string",
  "content": "string",
  "tags": ["tag1", "tag2"], // optional
  "rating": 5 // 1-5, optional
}
```

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "user_id": 1,
  "title": "string",
  "content": "string",
  "tags": ["tag1", "tag2"],
  "rating": 5,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Error message describing what went wrong"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

## Rate Limiting
API requests are limited to 100 requests per 15-minute window per IP address.

## Health Check
GET /health - Returns server health status and version information.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```