# GenBot Setup Instructions

## 🔧 Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/genbot-ai-chat.git
cd genbot-ai-chat
```

### 2. Backend Setup

#### Create Environment File
```bash
cd backend
cp ../.env.example .env
```

#### Configure Your Environment Variables
Edit the `.env` file with your actual values:
```env
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/chatbot
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_actual_password

# Groq API Configuration
GROQ_API_KEY=your_actual_groq_api_key

# Optional: Hugging Face API
HUGGINGFACE_API_KEY=your_huggingface_key
```

#### Install Dependencies & Run
```bash
mvn clean install
mvn spring-boot:run
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Create Frontend Environment (Optional)
```bash
cp .env.example .env
```

#### Start Development Server
```bash
npm start
```

## 🔑 Getting API Keys

### Groq API Key (Required)
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Navigate to "API Keys" section
4. Create new API key
5. Copy and paste into your `.env` file

### Database Setup
1. Install PostgreSQL
2. Create database named `chatbot`
3. Update connection details in `.env`

## 🚀 Running the Application

1. **Backend**: `mvn spring-boot:run` (Port 8080)
2. **Frontend**: `npm start` (Port 3000)
3. **Access**: http://localhost:3000

## 📝 Important Notes

- Never commit `.env` files to version control
- Keep your API keys secure
- Use environment variables for all sensitive data
- The application will create database tables automatically