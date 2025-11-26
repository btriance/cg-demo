# Task Manager - Code Genius Demo

A simple task management application designed to demonstrate Code Genius threat modeling capabilities.

## About This Demo

This repository showcases how Code Genius can automatically generate and update threat model diagrams from code. The main branch contains a basic task API, and each feature branch adds a new integration or data flow that will be visualized in the threat model.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open the app:**
   Navigate to `http://localhost:3000` in your browser

## Architecture

**Main Branch (Current):**
- Simple REST API built with Express.js
- SQLite database for task storage
- Static HTML/CSS/JS frontend
- Data flow: Browser → API → SQLite Database

## Feature Branches

Each feature branch adds a new integration that creates additional data flows visible in threat model diagrams:

### 🔐 `feature/user-authentication`
Adds JWT-based authentication with login endpoints and protected routes.

**New data flow:** Login → JWT generation → Token validation → Protected resources

### 🌤️ `feature/weather-integration`
Integrates with OpenWeatherMap API to fetch weather for task locations.

**New data flow:** Task request → External Weather API → Response

### 📎 `feature/file-attachments`
Enables file uploads and attachments for tasks.

**New data flow:** File upload → Local filesystem → Database reference

### ✉️ `feature/email-reminders`
Sends task reminder emails via SMTP/SendGrid.

**New data flow:** Task reminder → Email service (SMTP/SendGrid)

### ⚡ `feature/cache-layer`
Adds Redis caching layer for improved performance.

**New data flow:** Request → Redis cache → Database (on miss) → Cache update

## Demo Workflow

1. **Initial state:** Main branch contains basic task API
2. **Create PR:** Choose a feature branch and create a pull request
3. **Code Genius runs:** Automatically scans the code and generates/updates the threat model diagram
4. **Review changes:** See the new data flows and security considerations in the diagram
5. **Merge:** Complete the merge and repeat with another feature branch

## API Endpoints

### Main Branch
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /health` - Health check

Additional endpoints are added in feature branches.

## Project Structure

```
cg-demo/
├── server.js           # Express server and API routes
├── database.js         # SQLite database operations
├── package.json        # Dependencies
├── .env.example        # Environment variable template
├── public/
│   └── index.html      # Frontend UI
└── README.md
```

## Technology Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Additional (in feature branches):** JWT, Redis, Nodemailer, Multer, External APIs

## Security Considerations

This demo is designed to highlight security concerns that appear in threat models:

- **Authentication:** Credential handling, token storage, session management
- **External APIs:** API key management, request validation, rate limiting
- **File uploads:** Input validation, file type checking, storage security
- **Email services:** SMTP credentials, template injection risks
- **Caching:** Data exposure, cache poisoning, TTL management

## License

MIT - This is a demonstration project for Code Genius threat modeling.

