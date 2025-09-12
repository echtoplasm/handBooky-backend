# Handbooky Backend API
{README made with AI feel free to reach out if you have any questions}

A Node.js/Express API server that powers the Handbooky student handbook application. Features AI-powered chatbot capabilities, handbook management, and PostgreSQL database integration.

## Features

- **AI Chat API**: Integration with Heroku Managed Inference (Claude 3.5 Haiku)
- **Handbook Management**: CRUD operations for student handbooks
- **AI Resources**: Storage and management of AI-generated content
- **PostgreSQL Integration**: Full database schema for handbook data
- **CORS Support**: Configured for frontend communication
- **Basic Authentication**: Dev environment protection
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Primary database
- **Axios** - HTTP client for AI API calls
- **Heroku Managed Inference** - AI model hosting (Claude 3.5 Haiku)
- **CORS** - Cross-origin resource sharing

## API Endpoints

### Public Endpoints

#### GET `/`
Health check endpoint
```json
{
  "message": "Server is running!"
}
```

#### POST `/api/chat`
AI chatbot endpoint for student handbook assistance
```json
// Request
{
  "message": "What are the library hours?"
}

// Response
{
  "success": true,
  "message": "The library is open Monday-Friday 8am-10pm...",
  "model": "claude-3-5-haiku",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Protected Endpoints (Basic Auth Required)

#### POST `/handbooks`
Create new handbook entry
```json
{
  "handbook_id": "uuid",
  "title": "Student Handbook 2025",
  "description": "Official student handbook",
  "file_path": "/uploads/handbook.pdf",
  "file_size": 1024000,
  "upload_user_id": "user-uuid",
  "school_id": "school-uuid",
  "grade_level": "undergraduate",
  "subject": "general",
  "academic_year": "2025",
  "is_public": true
}
```

#### POST `/air` (AI Resources)
Store AI-generated content
```json
{
  "resource_id": "uuid",
  "section_id": "section-uuid",
  "handbook_id": "handbook-uuid",
  "resource_type": "summary",
  "title": "Library Policies Summary",
  "content": "Generated content...",
  "content_embedding": [0.1, 0.2, ...],
  "difficulty_level": "beginner",
  "estimated_time_minutes": 15,
  "generated_by_model": "claude-3-5-haiku"
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/handbooky

# Authentication
DEV_USER=dev
DEV_PASSWORD=your_secure_password

# Heroku AI Inference (set automatically when provisioned)
INFERENCE_URL=https://your-inference-url
INFERENCE_KEY=your_inference_key
INFERENCE_MODEL_ID=claude-3-5-haiku

# Server
PORT=5000
NODE_ENV=development
```

## Database Schema

The application uses PostgreSQL with the following main tables:

### `handbooks`
- `handbook_id` (UUID, Primary Key)
- `title` (VARCHAR)
- `description` (TEXT)
- `file_path` (VARCHAR)
- `file_size` (INTEGER)
- `upload_user_id` (UUID)
- `school_id` (UUID)
- `grade_level` (VARCHAR)
- `subject` (VARCHAR)
- `academic_year` (VARCHAR)
- `is_public` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `ai_resources`
- `resource_id` (UUID, Primary Key)
- `section_id` (UUID)
- `handbook_id` (UUID, Foreign Key)
- `resource_type` (VARCHAR)
- `title` (VARCHAR)
- `content` (TEXT)
- `content_embedding` (VECTOR)
- `difficulty_level` (VARCHAR)
- `estimated_time_minutes` (INTEGER)
- `generated_by_model` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Heroku CLI (for AI model provisioning)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Set up PostgreSQL database
```bash
createdb handbooky
# Run your schema migrations here
```

4. Configure environment variables (see above)

5. Provision Heroku AI model (for production)
```bash
heroku ai:models:create -a your-app-name claude-3-5-haiku
```

### Development

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:5000`

## Frontend Integration

This backend is designed to work with the React frontend. The communication flow:

### CORS Configuration
The server accepts requests from:
- `http://localhost:3000` (local development)
- `https://handbooky-frontend-dev.herokuapp.com` (staging)
- `https://handbooky-frontend-575fce723934.herokuapp.com` (production)

### Chat Integration
1. Frontend sends user messages to `/api/chat`
2. Backend processes through Claude 3.5 Haiku with system prompt
3. AI responses are filtered to handbook-related topics only
4. Responses returned in structured JSON format

### Authentication
- Chat endpoint (`/api/chat`) is public for easy frontend access
- Other endpoints require Basic Authentication
- Credentials: `dev:${DEV_PASSWORD}`

## AI Assistant Configuration

The chatbot is configured with a system prompt to:
- Focus on school policies and procedures
- Provide academic information
- Share campus resources information
- Discuss student life topics
- Redirect off-topic questions back to handbook content
- Keep responses concise and student-friendly

## Deployment

### Heroku Deployment

1. Create Heroku app
```bash
heroku create your-backend-app
```

2. Add PostgreSQL addon
```bash
heroku addons:create heroku-postgresql:mini -a your-backend-app
```

3. Provision AI model
```bash
heroku ai:models:create -a your-backend-app claude-3-5-haiku
```

4. Set environment variables
```bash
heroku config:set DEV_USER=dev DEV_PASSWORD=your_password
```

5. Deploy
```bash
git push heroku main
```

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Response content",
  "model": "claude-3-5-haiku",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to get AI response",
  "details": "Specific error message"
}
```

## Logging

The server includes comprehensive logging:
- Request method and path logging
- Authentication bypass notifications
- AI API errors with full context
- Database operation errors

## Security Features

- **Basic Authentication** for protected endpoints
- **CORS** restrictions to allowed origins
- **Input validation** for required fields
- **Error handling** without exposing sensitive data
- **Environment variable** protection for API keys

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
