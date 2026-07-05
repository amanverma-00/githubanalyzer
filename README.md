# GitHub Profile Analyzer API

A Node.js + Express.js + MySQL backend service that fetches GitHub user profiles via the GitHub Public API, computes meaningful insights, and stores them in a relational MySQL database.

---

## Features

- 🔍 **Analyze any GitHub user** — fetches profile + all public repos in one request
- 📊 **Rich insights stored**: followers, repos, total stars/forks, top programming languages, most-starred repo, account age, hireable status, and more
- 🗃️ **MySQL persistence** — auto-creates the table on server start (no manual migration needed)
- ♻️ **Refresh endpoint** — re-fetch and update a profile without re-entering it
- 📄 **Paginated listing** with optional search by username/name
- 🔑 **Optional GitHub token** — raises API rate limit from 60 → 5000 req/hr
- ✅ **Input validation** — GitHub username format enforced on all endpoints

---

## Tech Stack

| Layer       | Technology          |
|-------------|---------------------|
| Runtime     | Node.js (ESM)       |
| Framework   | Express.js v5       |
| Database    | MySQL 8+ via mysql2 |
| HTTP Client | Axios               |
| Config      | dotenv              |

---

## Prerequisites

- **Node.js** v18 or later
- **MySQL** 8.0+ running locally (or a remote MySQL server)
- A database named `github_analyzer` must exist before starting the server

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd assignment/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the MySQL database

Log into your MySQL server and run:

```sql
CREATE DATABASE IF NOT EXISTS github_analyzer;
```

### 4. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional — increases GitHub API rate limit from 60 to 5000 req/hr
# Create at: https://github.com/settings/tokens (no scopes needed)
GITHUB_TOKEN=your_github_token_here
```

### 5. Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server will:
1. Connect to MySQL
2. Auto-create the `github_profiles` table if it doesn't exist
3. Start listening on `http://localhost:3000`

---

## API Reference

Base URL: `http://localhost:3000`

### Health Check

```
GET /health
```

**Response:**
```json
{ "status": "ok", "uptime": 42.5, "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

### Analyze a GitHub Profile

```
POST /api/github/analyze/:username
```

Fetches the user's GitHub profile + all public repos, computes insights, and stores/updates the result in MySQL.

**Example:**
```bash
curl -X POST http://localhost:3000/api/github/analyze/torvalds
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile for \"torvalds\" analyzed and stored successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "bio": "Just a simple coder :)",
    "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
    "profile_url": "https://github.com/torvalds",
    "company": "Linux Foundation",
    "location": "Portland, OR",
    "blog": "",
    "email": null,
    "twitter_username": null,
    "public_repos": 8,
    "public_gists": 0,
    "followers": 240000,
    "following": 0,
    "top_languages": ["C", "Perl", "Shell"],
    "most_starred_repo": "torvalds/linux",
    "total_stars": 195000,
    "total_forks": 58000,
    "account_age_days": 5200,
    "is_hireable": null,
    "analyzed_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### List All Analyzed Profiles

```
GET /api/github/profiles
```

**Query Parameters:**

| Parameter | Type   | Default | Description                          |
|-----------|--------|---------|--------------------------------------|
| `page`    | number | 1       | Page number                          |
| `limit`   | number | 10      | Items per page (max 100)             |
| `search`  | string | ""      | Filter by username or display name   |

**Example:**
```bash
curl "http://localhost:3000/api/github/profiles?page=1&limit=5&search=linus"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Get a Single Profile

```
GET /api/github/profiles/:username
```

Returns a previously analyzed profile from the database.

**Example:**
```bash
curl http://localhost:3000/api/github/profiles/torvalds
```

---

### Refresh a Profile

```
GET /api/github/profiles/:username/refresh
```

Re-fetches the latest data from GitHub and updates the stored record.

**Example:**
```bash
curl http://localhost:3000/api/github/profiles/torvalds/refresh
```

---

### Delete a Profile

```
DELETE /api/github/profiles/:username
```

Removes a profile from the database.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/github/profiles/torvalds
```

---

## Database Schema

The table is auto-created on server startup. You can also run [`src/config/schema.sql`](./src/config/schema.sql) manually.

| Column             | Type         | Description                                    |
|--------------------|--------------|------------------------------------------------|
| `id`               | INT (PK)     | Auto-increment primary key                     |
| `username`         | VARCHAR(100) | GitHub login (unique)                          |
| `name`             | VARCHAR(255) | Display name                                   |
| `bio`              | TEXT         | Profile bio                                    |
| `avatar_url`       | VARCHAR(512) | Profile picture URL                            |
| `profile_url`      | VARCHAR(512) | GitHub profile page URL                        |
| `company`          | VARCHAR(255) | Company                                        |
| `location`         | VARCHAR(255) | Location                                       |
| `blog`             | VARCHAR(512) | Website / blog URL                             |
| `email`            | VARCHAR(255) | Public email                                   |
| `twitter_username` | VARCHAR(100) | Twitter handle                                 |
| `public_repos`     | INT          | Number of public repositories                  |
| `public_gists`     | INT          | Number of public gists                         |
| `followers`        | INT          | Follower count                                 |
| `following`        | INT          | Following count                                |
| `top_languages`    | JSON         | Top 3 programming languages (array)            |
| `most_starred_repo`| VARCHAR(255) | Full name of most-starred repository           |
| `total_stars`      | INT          | Sum of stars across all original public repos  |
| `total_forks`      | INT          | Sum of forks across all original public repos  |
| `account_age_days` | INT          | Days since GitHub account was created          |
| `is_hireable`      | BOOLEAN      | Hireable flag from GitHub profile              |
| `analyzed_at`      | DATETIME     | When the profile was first analyzed            |
| `updated_at`       | DATETIME     | When the profile was last updated              |

---

## GitHub API Rate Limits

| Type              | Limit       |
|-------------------|-------------|
| Unauthenticated   | 60 req/hr   |
| Authenticated     | 5000 req/hr |

To use authenticated requests, set `GITHUB_TOKEN` in your `.env`. Create a token at https://github.com/settings/tokens (no scopes required for public data).

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                        # Express app entry point
│   ├── config/
│   │   ├── db.js                     # MySQL pool + schema auto-init
│   │   └── schema.sql                # Raw SQL schema for reference
│   ├── services/
│   │   └── github.service.js         # GitHub API calls + insight computation
│   ├── models/
│   │   └── profile.model.js          # DB queries (findAll, findByUsername, upsert, delete)
│   ├── controllers/
│   │   └── github.controller.js      # Request handlers for all 5 endpoints
│   ├── routes/
│   │   └── github.routes.js          # Express router
│   ├── middleware/
│   │   └── validateUsername.js       # GitHub username format validation
│   └── utils/
│       ├── asyncHandler.js           # Async error forwarding wrapper
│       └── response.js               # Standardized API response helpers
├── .env                              # Environment variables (not committed)
├── .env.example                      # Template for .env
├── package.json
└── README.md
```
