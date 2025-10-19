# GenBot - AI Chat Assistant

A modern, full-stack chat application with React frontend and Spring Boot backend, featuring AI-powered conversations using Groq API.

![Chat Interface](https://img.shields.io/badge/React-18.x-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue)

## ✨ Features

- 🎨 **Modern UI Design** - Beautiful dark blue gradient theme with glass morphism effects
- 💬 **Real-time Chat** - Instant messaging with typing animations
- 🧠 **AI-Powered** - Groq API integration for intelligent responses
- 👤 **User Management** - Login/signup with avatar selection
- 📱 **Responsive Design** - Mobile-first approach with perfect mobile optimization
- 🔍 **Message Search** - Search across all conversations and sessions
- 📝 **Code Highlighting** - Syntax highlighting for code blocks
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 💾 **Session Management** - Organize conversations in sessions
- 🔄 **Message Threading** - Reply to specific messages
- ✏️ **Quick Actions** - Edit messages and regenerate AI responses
- 📊 **Response Control** - Adjustable AI response length

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Java 17 or higher** - [Download from Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- **Node.js 16 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **PostgreSQL 12 or higher** - [Download from postgresql.org](https://www.postgresql.org/download/)
- **Maven 3.6 or higher** - [Download from maven.apache.org](https://maven.apache.org/download.cgi)

### Verify Installation
```bash
# Check Java version
java -version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Maven version
mvn --version

# Check PostgreSQL version
psql --version
```

## 🔑 Getting Groq API Key

1. **Visit Groq Console**
   - Go to [console.groq.com](https://console.groq.com)
   - Sign up for a free account using Google/GitHub

2. **Create API Key**
   - Navigate to "API Keys" section
   - Click "Create API Key"
   - Give it a name (e.g., "ChatBot App")
   - Copy the generated API key
   - **Important**: Save this key securely - you won't see it again!

3. **Free Tier Limits**
   - 14,400 requests per day
   - Rate limit: 30 requests per minute
   - No credit card required

## 🗄️ Database Setup

### 1. Install PostgreSQL
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
- Remember the password you set for the `postgres` user

### 2. Create Database
```sql
-- Connect to PostgreSQL (use pgAdmin or command line)
psql -U postgres

-- Create the database
CREATE DATABASE chatbot;

-- Create a user (optional)
CREATE USER chatbot_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chatbot TO chatbot_user;

-- Exit
\q
```

### 3. Verify Database Connection
```bash
# Test connection
psql -U postgres -d chatbot -c "SELECT version();"
```

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-chat-assistant.git
cd ai-chat-assistant
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Configure Environment Variables
Copy the example environment file and configure your settings:
```bash
# Copy example file
cp .env.example .env

# Edit .env file with your actual values
# DATABASE_URL=jdbc:postgresql://localhost:5432/chatbot
# DATABASE_USERNAME=postgres
# DATABASE_PASSWORD=your_actual_password
# GROQ_API_KEY=your_actual_groq_api_key
```

**Important**: Never commit the `.env` file to version control!

#### Install Dependencies & Run
```bash
# Clean and install dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

**Backend will start on:** http://localhost:8080

#### Verify Backend
```bash
# Test API endpoint
curl http://localhost:8080/api/users
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Dependencies
```bash
# Install all npm packages
npm install
```

#### Configure Frontend Environment
Copy the example environment file:
```bash
# In frontend directory
cp .env.example .env

# Edit .env file if needed
# REACT_APP_API_URL=http://localhost:8080
```

#### Start Development Server
```bash
# Start React development server
npm start
```

**Frontend will start on:** http://localhost:3000

#### Build for Production
```bash
# Create production build
npm run build
```

## 🔧 Configuration Options

### Environment Variables

#### Backend (.env or application.properties)
```properties
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/chatbot
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# Groq API
GROQ_API_KEY=your_groq_api_key_here

# Server
SERVER_PORT=8080
```

#### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8080

# Optional: Custom port
PORT=3000
```

### Database Configuration Options
```properties
# Development (auto-create tables)
spring.jpa.hibernate.ddl-auto=update

# Production (validate existing tables)
spring.jpa.hibernate.ddl-auto=validate

# Show SQL queries (development only)
spring.jpa.show-sql=true
```

## 📡 API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/{id}` - Get user by ID

### Sessions
- `GET /api/users/{userId}/sessions` - Get user's chat sessions
- `POST /api/users/{userId}/sessions` - Create new session
- `PUT /api/sessions/{sessionId}` - Update session
- `DELETE /api/sessions/{sessionId}` - Delete session

### Messages
- `GET /api/sessions/{sessionId}/messages` - Get session messages
- `POST /api/sessions/{sessionId}/messages` - Send message
- `GET /api/users/{userId}/search?q={query}` - Search messages

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F

# Or use different port
server.port=8081
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL is running
pg_ctl status

# Start PostgreSQL service
net start postgresql-x64-14
```

#### 3. Groq API Key Issues
- Verify key is correct (starts with `gsk_`)
- Check rate limits (30 requests/minute)
- Ensure no extra spaces in configuration

#### 4. Maven Build Fails
```bash
# Clear Maven cache
mvn clean

# Skip tests if needed
mvn clean install -DskipTests
```

#### 5. npm Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

#### Hot Reload
- Backend: Use Spring Boot DevTools (included)
- Frontend: React hot reload (automatic)

#### Database Reset
```sql
-- Drop and recreate database
DROP DATABASE chatbot;
CREATE DATABASE chatbot;
```

#### View Logs
```bash
# Backend logs
tail -f logs/spring.log

# Frontend logs
# Check browser console (F12)
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Backend (Railway/Render)
1. Push to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for the AI API
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for frontend framework
- [Spring Boot](https://spring.io/projects/spring-boot) for backend framework

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Include error logs and system information