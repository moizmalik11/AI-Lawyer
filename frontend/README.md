# AI Lawyer - Frontend

A modern React-based frontend for the AI Lawyer legal assistant application, built with Vite and React 19.

---

## 📋 Table of Contents

- [For Frontend Developers](#-for-frontend-developers)
  - [Cloning the Repository](#cloning-the-repository)
  - [Git Workflow & Restrictions](#git-workflow--restrictions)
- [Project Setup](#-project-setup)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Environment Variables](#environment-variables)
- [Backend API Reference](#-backend-api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Chat Routes](#chat-routes)
  - [Judgments Routes](#judgments-routes)
  - [Contracts Routes](#contracts-routes)
  - [Search Routes](#search-routes)
- [Modifying the Interface](#-modifying-the-interface)
  - [Project Structure](#project-structure)
  - [Adding New Pages](#adding-new-pages)
  - [Adding New Components](#adding-new-components)
  - [Styling Guidelines](#styling-guidelines)
  - [API Integration](#api-integration)

---

## 👨‍💻 For Frontend Developers

### Cloning the Repository

As a frontend developer, you'll need to clone the entire repository but will only work within the `frontend/` folder.

```bash
# Clone the repository
git clone https://github.com/your-org/AI-Lawyer.git

# Navigate to the project
cd AI-Lawyer

# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install
```

### Git Workflow & Restrictions

> ⚠️ **IMPORTANT:** Frontend developers are **ONLY** allowed to push changes made to the `frontend/` folder.

#### Commit Guidelines

1. **Never** commit changes to files outside the `frontend/` directory
2. Always check your staged files before committing:
   ```bash
   git status
   ```
3. Only stage frontend files:
   ```bash
   git add frontend/
   ```
4. Use descriptive commit messages:
   ```bash
   git commit -m "feat(frontend): add new chat interface component"
   ```

#### Branch Naming Convention

```
frontend/feature/<feature-name>
frontend/fix/<bug-description>
frontend/refactor/<refactor-description>
```

Example:
```bash
git checkout -b frontend/feature/chat-history-ui
```

---

## 🚀 Project Setup

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** (for backend)
- **Qdrant** vector database (for backend RAG functionality)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend development server will start at `http://localhost:5173`

#### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (outputs to `../backend/public`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

The backend server will start at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-lawyer

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=legal_documents

# LLM Configuration (if using external API)
LLM_API_KEY=your-api-key
LLM_MODEL=your-model-name
```

### Running Both Servers

For development, run both servers simultaneously:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The Vite dev server automatically proxies `/api` requests to the backend at `http://localhost:3000`.

---

## 📡 Backend API Reference

Base URL: `http://localhost:3000`

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check if server is running |

**Response:**
```json
{
  "success": true,
  "message": "AI Lawyer Backend is running",
  "timestamp": "2026-01-18T12:00:00.000Z"
}
```

---

### Authentication Routes

Base path: `/api/auth`

#### Register User

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Chat Routes

Base path: `/api/chat`

#### Ask a Legal Question

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/chat/ask` | Public (Auth optional) |

**Request Body:**
```json
{
  "question": "What are the legal requirements for starting a business in Pakistan?",
  "chatId": "optional_chat_id_for_history"
}
```

**Headers (Optional):**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "answer": "According to Pakistani law...",
  "sources": [
    {
      "document": "Pakistan Companies Act 2017",
      "relevance": 0.95
    }
  ]
}
```

#### Create New Chat

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/chat/new` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "title": "New Chat",
    "createdAt": "2026-01-18T12:00:00.000Z"
  }
}
```

#### Get User's Chat History

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/chat/history` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_id",
      "title": "Business Law Query",
      "lastMessage": "What are the legal requirements...",
      "createdAt": "2026-01-18T12:00:00.000Z"
    }
  ]
}
```

#### Get Specific Chat

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/chat/:id` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "title": "Business Law Query",
    "messages": [
      {
        "role": "user",
        "content": "What are the legal requirements..."
      },
      {
        "role": "assistant",
        "content": "According to Pakistani law..."
      }
    ]
  }
}
```

#### Delete Chat

| Method | Endpoint | Access |
|--------|----------|--------|
| DELETE | `/api/chat/:id` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### Chat Service Health Check

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/chat/health` | Public |

#### Get Available Documents

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/chat/documents` | Public |

**Response:**
```json
{
  "success": true,
  "documents": [
    "Pakistan Constitution 1973",
    "Companies Act 2017",
    "Contract Act 1872"
  ]
}
```

---

### Judgments Routes

Base path: `/api/judgments`

#### List All Judgments

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/judgments` | Public |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "judgments": [
    {
      "id": "judgment_id",
      "title": "PLD 2024 SC 123",
      "court": "Supreme Court",
      "date": "2024-05-15"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 10,
    "total": 100
  }
}
```

#### Get Judgment Summary

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/judgments/:title/summary` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "summary": "This judgment deals with...",
  "keyPoints": [
    "Point 1",
    "Point 2"
  ]
}
```

---

### Contracts Routes

Base path: `/api/contracts`

#### Analyze Contract

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/contracts/analyze` | Protected 🔒 |

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
- `contract` - File upload (PDF or TXT, max 10MB)

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": "This contract is a...",
    "keyTerms": ["Term 1", "Term 2"],
    "potentialIssues": [
      {
        "clause": "Section 5.2",
        "issue": "Ambiguous termination clause",
        "recommendation": "Consider specifying..."
      }
    ],
    "riskLevel": "medium"
  }
}
```

---

### Search Routes

Base path: `/api/search`

#### Global Search

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/search` | Public |

**Query Parameters:**
- `q` - Search query (required)
- `type` - Document type filter (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Example:**
```
GET /api/search?q=property%20rights&type=judgment&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "doc_id",
      "title": "Property Rights Act",
      "type": "legislation",
      "excerpt": "...relevant text...",
      "relevance": 0.92
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 47
  }
}
```

#### Get Document Types

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/search/types` | Public |

**Response:**
```json
{
  "success": true,
  "types": [
    "legislation",
    "judgment",
    "regulation",
    "circular"
  ]
}
```

---

## 🎨 Modifying the Interface

### Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable UI components
│   │   └── Navbar.jsx
│   ├── context/        # React context providers
│   │   └── AuthContext.jsx
│   ├── pages/          # Page components (routes)
│   │   ├── Auth.jsx
│   │   ├── Chatbot.jsx
│   │   ├── Contracts.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Judgments.jsx
│   │   └── Search.jsx
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component with routing
│   ├── App.css         # Global app styles
│   ├── main.jsx        # React entry point
│   └── index.css       # Global CSS reset/variables
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── eslint.config.js    # ESLint configuration
```

### Adding New Pages

1. **Create the page component** in `src/pages/`:

```jsx
// src/pages/NewPage.jsx
import { useState, useEffect } from 'react';

function NewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from API
  }, []);

  return (
    <div className="new-page">
      <h1>New Page</h1>
      {/* Your content */}
    </div>
  );
}

export default NewPage;
```

2. **Add the route** in `src/App.jsx`:

```jsx
import NewPage from './pages/NewPage';

// In your Routes:
<Route path="/new-page" element={<NewPage />} />
```

3. **Add navigation link** in `src/components/Navbar.jsx`

### Adding New Components

1. **Create component** in `src/components/`:

```jsx
// src/components/LegalCard.jsx
function LegalCard({ title, content, onClick }) {
  return (
    <div className="legal-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}

export default LegalCard;
```

2. **Import and use** in your pages:

```jsx
import LegalCard from '../components/LegalCard';
```

### Styling Guidelines

- Use **CSS Modules** or component-scoped CSS
- Global styles go in `src/index.css`
- Component styles should be co-located with components
- Use CSS custom properties (variables) for theming:

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --background: #f8fafc;
  --text-color: #1e293b;
}
```

### API Integration

Use the built-in fetch API or create utility functions in `src/utils/`:

```jsx
// src/utils/api.js
const API_BASE = '/api';

export async function askQuestion(question, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/chat/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question }),
  });

  return response.json();
}

export async function getJudgments(page = 1, limit = 10) {
  const response = await fetch(
    `${API_BASE}/judgments?page=${page}&limit=${limit}`
  );
  return response.json();
}
```

### Using Authentication Context

The app uses React Context for authentication state:

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isAuthenticated } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={() => handleLogin('email', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM 7** - Client-side routing
- **Vite 7** - Build tool and dev server
- **Lucide React** - Icon library
- **Marked** - Markdown parsing

### Backend
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database
- **Qdrant** - Vector database for RAG
- **JWT** - Authentication
- **Multer** - File uploads

---

## 📝 Contributing

1. Create a feature branch: `git checkout -b frontend/feature/your-feature`
2. Make your changes in the `frontend/` directory only
3. Run linting: `npm run lint`
4. Test your changes thoroughly
5. Commit: `git commit -m "feat(frontend): description"`
6. Push: `git push origin frontend/feature/your-feature`
7. Create a Pull Request

---

## 📄 License

This project is licensed under the terms specified in the root LICENSE file.
