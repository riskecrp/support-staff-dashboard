# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not implement authentication. In production, add JWT or session-based authentication.

---

## Staff Management

### GET /api/staff
Get list of staff members with optional filters.

**Query Parameters:**
- `is_active` (boolean, optional) - Filter by active status
- `is_support` (boolean, optional) - Filter by support status
- `is_senior_support` (boolean, optional) - Filter by senior support status

**Example Request:**
```bash
GET /api/staff?is_active=true
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "is_support": true,
      "is_senior_support": true,
      "strikes": 0,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z",
      "is_active": true
    }
  ]
}
```

### GET /api/staff/:id
Get details of a specific staff member.

**Example Request:**
```bash
GET /api/staff/1
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "is_support": true,
    "is_senior_support": true,
    "strikes": 0,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z",
    "is_active": true
  }
}
```

### POST /api/staff
Add a new staff member.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "is_senior_support": false
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "is_support": true,
    "is_senior_support": false,
    "strikes": 0,
    "created_at": "2025-01-20T14:30:00Z",
    "updated_at": "2025-01-20T14:30:00Z",
    "is_active": true
  }
}
```

### PUT /api/staff/:id
Update a staff member (promote, demote, rename).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "is_senior_support": true,
  "performed_by": "ADMIN"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "is_support": true,
    "is_senior_support": true,
    "strikes": 0,
    "updated_at": "2025-01-25T16:00:00Z"
  }
}
```

### DELETE /api/staff/:id
Remove a staff member (soft delete).

**Request Body:**
```json
{
  "performed_by": "ADMIN"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "is_active": false,
    "is_support": false
  }
}
```

---

## Strikes Management

### GET /api/staff/:id/strikes
Get all strikes for a staff member.

**Example Request:**
```bash
GET /api/staff/1/strikes
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "staff_id": 1,
      "issued_date": "2025-01-10T09:00:00Z",
      "reason": "Missed quota two months in a row",
      "issued_by": "ADMIN",
      "is_removed": false,
      "removed_date": null,
      "removed_by": null
    }
  ]
}
```

### POST /api/staff/:id/strikes
Add a strike to a staff member.

**Request Body:**
```json
{
  "reason": "Inappropriate behavior in Discord",
  "issued_by": "ADMIN"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "strikeId": 2,
    "autoAction": "DEMOTED"
  }
}
```

**Note:** When a staff member reaches 3 strikes:
- Senior Support → Demoted to regular Support
- Regular Support → Removed from staff (deactivated)

### DELETE /api/strikes/:id
Remove a strike.

**Request Body:**
```json
{
  "removed_by": "ADMIN"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Strike removed successfully"
}
```

---

## Monthly Stats

### GET /api/stats
Get monthly statistics with optional filters.

**Query Parameters:**
- `month` (date, optional) - Filter by month in YYYY-MM-DD format
- `staff_id` (integer, optional) - Filter by staff member

**Example Request:**
```bash
GET /api/stats?month=2025-02-01
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "staff_id": 1,
      "name": "John Smith",
      "is_senior_support": true,
      "month_date": "2025-02-01",
      "in_game_reports": 28,
      "forum_reports": 6,
      "discord_activity": 15,
      "quizzes_accepted": 42,
      "quizzes_rejected": 3,
      "other_activities": 8,
      "loa_days": 2
    }
  ]
}
```

### POST /api/stats
Create or update monthly statistics for a staff member.

**Request Body:**
```json
{
  "staff_id": 1,
  "month_date": "2025-02-01",
  "in_game_reports": 28,
  "forum_reports": 6,
  "discord_activity": 15,
  "quizzes_accepted": 42,
  "quizzes_rejected": 3,
  "other_activities": 8,
  "loa_days": 2
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "staff_id": 1,
    "month_date": "2025-02-01",
    "in_game_reports": 28,
    "forum_reports": 6,
    "discord_activity": 15,
    "loa_days": 2,
    "created_at": "2025-02-01T08:00:00Z",
    "updated_at": "2025-02-01T08:00:00Z"
  }
}
```

### GET /api/stats/current
Get current month statistics with quota calculations for all active staff.

**Example Request:**
```bash
GET /api/stats/current
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "month": "2025-02-01",
    "staff": [
      {
        "id": 1,
        "name": "John Smith",
        "is_senior_support": true,
        "strikes": 0,
        "stats": {
          "in_game_reports": 28,
          "forum_reports": 6,
          "discord_activity": 15,
          "loa_days": 2
        },
        "quota": {
          "inGameReports": {
            "required": 28,
            "actual": 28,
            "percentage": 100
          },
          "forumReports": {
            "required": 5,
            "actual": 6,
            "percentage": 120
          },
          "inGameStatus": "success",
          "forumStatus": "success"
        }
      }
    ]
  }
}
```

---

## Quota Calculation

**Base Quotas:**
- Support Staff: 30 in-game reports/month
- Senior Support: 30 in-game reports + 5 forum reports/month

**LOA Adjustments:**
- Each LOA day reduces in-game quota by 1
- Formula: `adjusted_quota = max(0, 30 - loa_days)`
- Forum quota is NOT affected by LOA

**Status Levels:**
- `success` (green): ≥ 100% of quota
- `warning` (yellow): 75-99% of quota
- `danger` (red): < 75% of quota

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production using packages like `express-rate-limit`.

## CORS

Currently not configured. For production deployment with separate frontend, configure CORS appropriately.
