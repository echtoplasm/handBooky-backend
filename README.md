# Blazer AI Backend API

A Node.js/Express API server that powers the Blazer AI student handbook application. Features AI-powered chatbot capabilities with vector similarity search and PostgreSQL database integration.

## Features

- **AI Chat API**: Integration with Heroku Managed Inference (Claude 3.5 Haiku)
- **Vector Similarity Search**: Semantic search using embeddings and PostgreSQL vectors
- **Course Code Detection**: Intelligent routing between vector and non-vector queries
- **PostgreSQL Integration**: Vector database with embedding storage
- **CORS Support**: Configured for frontend communication
- **Basic Authentication**: Dev environment protection

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL with pgvector** - Vector database for embeddings
- **Axios** - HTTP client for AI API calls
- **Heroku Managed Inference** - AI model hosting (Claude 3.5 Haiku)
- **Heroku Embedding Model API** - Text embedding generation
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
AI chatbot endpoint for student handbook assistance with intelligent query routing
```json
// Request
{
  "message": "What are the library hours?",
  "model": "claude-3-5-haiku"  // optional, defaults to claude-3-5-haiku
}

// Response
{
  "success": true,
  "message": "The library is open Monday-Friday 8am-10pm...",
  "model": "claude-3-5-haiku",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Query Processing Logic

The API intelligently routes queries based on content:

**Course Code Queries** (e.g., "Tell me about CSC-151")
- Detects course codes using regex pattern `/\b([A-Z]{2,4}-\d{2,4})\b/g`
- Uses non-vector SQL query for exact course matches
- Returns course information with prerequisites and corequisites

**General Queries** (e.g., "What are the graduation requirements?")
- Generates embeddings using Heroku Embedding Model API
- Performs vector similarity search using PostgreSQL pgvector
- Returns contextually relevant information based on semantic similarity

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/blazer_ai

# Authentication
DEV_USER=dev
DEV_PASSWORD=your_secure_password

# Heroku AI Services
INFERENCE_URL=https://your-inference-url
INFERENCE_KEY=your_inference_key

# Server
PORT=5000
NODE_ENV=production
```

## Database Schema

The application uses PostgreSQL with pgvector extension for vector similarity search:

### Main Table Structure
- **Vector embeddings** stored using pgvector extension
- **Course information** with prerequisites and corequisites
- **Source metadata** including source type and section information
- **Similarity scoring** for semantic search results

### Key Fields
- `text` - Content for search and context
- `content_embedding` - Vector embeddings for similarity search
- `course_code` - Course identifiers for direct lookup
- `source_type` - Type of content (handbook, website, etc.)
- `source_info` - Additional source metadata
- `section_type` - Section categorization
- `class_prerequisites` - Course prerequisites
- `class_corequisites` - Course corequisites

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher) with pgvector extension
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

3. Set up PostgreSQL database with pgvector
```bash
createdb blazer_ai
# Install pgvector extension
# Run your schema migrations here
```

4. Configure environment variables (see above)

5. Provision Heroku AI services
```bash
heroku ai:models:create -a your-app-name claude-3-5-haiku
```

### Development

Start the development server:
```bash
npm start
```

The server will be available at `http://localhost:5000`

## Frontend Integration

### CORS Configuration
The server accepts requests from:
- `http://localhost:3000` (local development)
- `https://handbooky-frontend-dev.herokuapp.com` (staging)
- `https://handbooky-frontend-575fce723934.herokuapp.com` (production)
- `https://blazer-ai-abt.com` (production domain)

### Chat Integration
1. Frontend sends user messages to `/api/chat`
2. Backend analyzes query type (course code vs. general)
3. Routes to appropriate search method (vector vs. non-vector)
4. Processes through Claude 3.5 Haiku with contextual information
5. Returns structured response with source citations

### Authentication
- Chat endpoint (`/api/chat`) is public for easy access
- All other endpoints require Basic Authentication
- Health check (`/health`) bypasses authentication

## AI Assistant Configuration

The chatbot uses a sophisticated system prompt that:

### Scope Limitations
- **School policies and procedures**
- **Academic information** (courses, programs, requirements)
- **Campus resources and services**
- **Student life and activities**
- **Admissions and registration**
- **Financial aid and tuition**

### Response Guidelines
- Redirects off-topic questions to handbook content
- Cites sources with specific page numbers or sections
- Includes prerequisites and corequisites for course information
- Maintains helpful, supportive tone for students
- Suggests contacting appropriate offices when information unavailable

### Context Enhancement
- Provides rich context from vector search results
- Includes source metadata for transparency
- Handles both exact course matches and semantic queries

## Deployment

### Heroku Deployment

1. Create Heroku app
```bash
heroku create blazer-ai-backend
```

2. Add PostgreSQL addon with pgvector
```bash
heroku addons:create heroku-postgresql:mini -a blazer-ai-backend
```

3. Provision AI services
```bash
heroku ai:models:create -a blazer-ai-backend claude-3-5-haiku
```

4. Set environment variables
```bash
heroku config:set DEV_USER=dev DEV_PASSWORD=your_password NODE_ENV=production
```

5. Deploy
```bash
git push heroku main
```

## Security Features

- **HTTPS Redirect**: Automatic redirection from HTTP to HTTPS
- **Basic Authentication** for protected endpoints  
- **CORS** restrictions to allowed origins
- **Input validation** for required fields
- **Error handling** without exposing sensitive information
- **Environment variable** protection for API keys

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "AI-generated response with context",
  "model": "claude-3-5-haiku", 
  "timestamp": "2025-09-27T14:30:00.000Z"
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

## Logging and Monitoring

The server includes comprehensive logging:
- **Request tracking**: Method and path for all requests
- **Query type detection**: Vector vs. non-vector routing decisions
- **Search results**: Number of results and similarity scores
- **Authentication**: Bypass notifications for public endpoints
- **AI API interactions**: Full error context for debugging

## Performance Optimizations

- **Intelligent query routing** reduces unnecessary embedding generation
- **Vector similarity search** for semantic understanding
- **Contextual information** limits for optimal AI responses
- **Efficient database queries** with proper indexing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
