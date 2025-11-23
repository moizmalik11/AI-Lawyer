# AI Lawyer Backend

The backend service for the AI Lawyer application, providing a robust API for legal document retrieval and question answering using Retrieval-Augmented Generation (RAG).

## 🚀 Overview

This Node.js/Express application serves as the core intelligence engine. It orchestrates the interaction between:
1.  **Users**: Via REST API endpoints.
2.  **Vector Database (Qdrant)**: For retrieving semantically relevant legal text chunks.
3.  **LLM Service**: For generating natural language answers based on retrieved context.
4.  **Embedding Service**: For converting text queries into vector representations.

## 📂 Directory Structure & File-Level Details

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection logic; exports connectDB()
│   ├── controllers/
│   │   └── chatController.js     # HTTP request handlers for /api/chat/* endpoints
│   ├── middleware/               # (Placeholder for rate limiting, auth, etc.)
│   ├── models/
│   │   ├── Embeddings.js         # Mongoose schema for chunk metadata
│   │   └── index.js              # Exports all models
│   ├── routes/
│   │   └── chatRoutes.js         # Defines routes: POST /ask, GET /health, GET /documents
│   ├── services/
│   │   ├── ragService.js         # Orchestrates RAG pipeline (main business logic)
│   │   ├── embeddingService.js   # Generates query embeddings via Xenova transformers
│   │   ├── qdrantService.js      # Qdrant client; vector search operations
│   │   └── llmService.js         # LLM API calls (OpenRouter); prompt engineering
│   ├── utils/                    # (Reserved for helpers like logging, validation)
│   ├── app.js                    # Express app configuration; middleware, routes, error handling
│   └── server.js                 # Entry point; starts HTTP server, connects DB
├── public/
│   ├── index.html                # Landing page (optional)
│   └── chatbot.html              # Testing UI for chat API
├── .env                          # Environment variables (not committed)
├── package.json                  # NPM dependencies and scripts
└── README.md                     # This file
```

### Key File Purposes

| File | Responsibility |
|------|----------------|
| `app.js` | Express app setup; middleware (CORS, JSON parsing, static files); route mounting; error handlers. |
| `server.js` | Starts server on PORT; calls `connectDB()`; graceful shutdown logic. |
| `chatController.js` | Validates incoming requests; calls `ragService.processQuery()`; formats JSON responses. |
| `ragService.js` | Coordinates: translation → embedding → Qdrant search → LLM generation → response assembly. |
| `embeddingService.js` | Loads `Xenova/all-mpnet-base-v2` model; converts text to 768-dim vectors. |
| `qdrantService.js` | Searches Qdrant; merges results with MongoDB metadata; health checks. |
| `llmService.js` | Calls OpenRouter API; manages API key rotation; handles retries and fallback models. |
| `Embeddings.js` | Mongoose model: `{id, title, chunk, section, source, year, court, document_type}`. |
| `database.js` | Connects to MongoDB using `MONGODB_URI`; logs connection status. |

## 🛠️ Tech Stack & Tools

### Core Dependencies

| Library / Tool                  | Version   | Purpose / Role |
|--------------------------------|-----------|----------------|
| **Express.js**                 | ^4.18.2   | Web framework for building RESTful API endpoints. |
| **@qdrant/js-client-rest**     | ^1.8.0    | Official Qdrant client for vector similarity search operations. |
| **@xenova/transformers**       | ^2.17.0   | ONNX-based ML library for running transformer models in Node.js (embeddings, language detection). |
| **mongoose**                   | ^8.0.0    | MongoDB ODM for storing and retrieving document metadata. |
| **dotenv**                     | ^16.3.1   | Environment variable management. |
| **cors**                       | ^2.8.5    | Cross-Origin Resource Sharing middleware. |
| **nodemon** (dev)              | ^3.1.10   | Auto-reload server during development. |

### External Services

| Service               | Purpose |
|-----------------------|---------|
| **Qdrant Cloud/Local** | Vector database hosting embeddings for semantic search. |
| **OpenRouter API**     | LLM gateway providing access to models (Llama 3.3, Qwen 2.5, Mistral). |
| **MongoDB**            | Document metadata storage (titles, sections, sources). |

### Model Specifications

| Component         | Model / Approach | Details |
|-------------------|------------------|---------|
| **Query Embedding** | `Xenova/all-mpnet-base-v2` | 768-dimensional embeddings; runs locally via ONNX. |
| **LLM (Answer Generation)** | `meta-llama/llama-3.3-70b-instruct:free` (primary), fallback to Qwen, Mistral | Free-tier models via OpenRouter with automatic rotation. |
| **Translation** | Gemini 2.0 Flash (via OpenRouter) | Detects Urdu queries and translates to English for embedding. |

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v18+ recommended)
*   Qdrant instance (running locally or cloud)
*   MongoDB instance (optional)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` root directory:

```env
PORT=3000
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key  # If applicable
MONGODB_URI=mongodb://localhost:27017/ai-lawyer
OPENAI_API_KEY=sk-...           # If using OpenAI for LLM
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### 4. Run the Server
*   **Development Mode** (with hot-reload):
    ```bash
    npm run dev
    ```
*   **Production Mode**:
    ```bash
    npm start
    ```

## 🔌 API Endpoints

### Chat & RAG

#### `POST /api/chat/ask`
Ask a legal question. The system retrieves relevant documents and generates an answer.

**Request Body:**
```json
{
  "query": "What is the punishment for theft?",
  "topK": 5  // Optional; controls max chunks retrieved (default: 10)
}
```

**Request Validation**:
- `query` or `question` field required (accepts both).
- Query must be non-empty and ≤ 500 characters.
- Automatically trims whitespace.

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "answer": "According to Section 379 of the Pakistan Penal Code, theft is defined as...",
  "sources": [
    {
      "id": "pak_ppc_chunk_45",
      "title": "Pakistan Penal Code",
      "section": "Section 378",
      "text": "Theft.—Whoever, intending to take dishonestly any movable property...",
      "score": 0.87,
      "source": "pakistan-code"
    }
  ],
  "query": "What is the punishment for theft?",
  "metadata": {
    "chunksRetrieved": 5,
    "processingTime": "4.2s",
    "translationUsed": false,
    "model": "meta-llama/llama-3.3-70b-instruct:free"
  }
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Query is required in request body"
}
```

**Response (Error - 500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to process query: [detailed error message]"
}
```

**Implementation Details**:
1. Controller (`chatController.js`) validates input.
2. Calls `ragService.processQuery(query, topK)`.
3. RAG service executes full pipeline (see Methodologies section).
4. Returns formatted response with sources and metadata.

---

#### `GET /api/chat/health`
Check if the service and its dependencies (Qdrant, MongoDB) are healthy.

**Response (Healthy - 200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "qdrant": "connected",
    "mongodb": "connected",
    "embedding_model": "loaded"
  },
  "timestamp": "2025-11-23T10:30:45.123Z"
}
```

**Response (Unhealthy - 503 Service Unavailable):**
```json
{
  "success": false,
  "status": "unhealthy",
  "services": {
    "qdrant": "disconnected",
    "mongodb": "connected",
    "embedding_model": "loaded"
  },
  "error": "Qdrant connection failed"
}
```

---

#### `GET /api/chat/documents`
Retrieve a list of all unique legal documents currently indexed in the vector database.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 247,
  "documents": [
    {
      "title": "Pakistan Penal Code",
      "source": "pakistan-code",
      "chunks": 156,
      "jurisdiction": "Federal"
    },
    {
      "title": "Bal_Employees'_Efficiency_and_Discipline_Act_2011",
      "source": "balochistan-code",
      "chunks": 23,
      "jurisdiction": "Balochistan"
    }
  ]
}
```

**Use Cases**:
- Frontend document browser.
- Analytics on corpus coverage.
- Debugging missing documents.

## 🧠 Core Services (`src/services/`)

### `ragService.js` - RAG Orchestration
**Purpose**: Coordinates the entire Retrieval-Augmented Generation pipeline.

**Workflow**:
1.  **Language Detection & Translation**: Detects Urdu queries using regex (`/[\u0600-\u06FF]/`); translates to English via LLM.
2.  **Query Embedding**: Converts English query to 768-dim vector using `embeddingService`.
3.  **Vector Search**: Queries Qdrant for top-50 similar chunks; filters by dynamic score threshold.
4.  **Context Assembly**: Aggregates relevant chunks, deduplicates by document, and constructs a detailed prompt.
5.  **Answer Generation**: Sends prompt + context to LLM; returns structured answer with sources.

**Key Methods**:
*   `processQuery(query, topK)`: Main entry point.
*   `filterChunksByScore(chunks, topK)`: Applies adaptive scoring to retain only high-quality results.
*   `constructPrompt(query, chunks)`: Builds few-shot prompt with legal context.

---

### `embeddingService.js` - Text Vectorization
**Purpose**: Generates semantic embeddings for queries and documents.

**Implementation**:
*   **Model**: `Xenova/all-mpnet-base-v2` (ONNX runtime).
*   **Pipeline**: Uses `@xenova/transformers` feature-extraction pipeline.
*   **Initialization**: Lazy-loads model on first request; prevents multiple concurrent loads.
*   **Output**: 768-dimensional float array.

**Key Methods**:
*   `initialize()`: Downloads and loads the ONNX model.
*   `generateEmbedding(text)`: Returns normalized embedding vector.

**Performance**: Local inference (~100-200ms per query on CPU).

---

### `qdrantService.js` - Vector Database Interface
**Purpose**: Manages all interactions with the Qdrant vector store.

**Operations**:
*   **Search**: Performs cosine similarity search; returns top-K chunks with scores.
*   **Metadata Enrichment**: Fetches additional metadata from MongoDB (titles, sections, sources).
*   **Filtering**: Supports future enhancements (e.g., jurisdiction filters, date ranges).

**Key Methods**:
*   `searchSimilar(queryVector, limit)`: Main search function; merges Qdrant results with MongoDB metadata.
*   `checkHealth()`: Verifies Qdrant connectivity.

**Data Flow**:
1.  Query Qdrant with embedding vector.
2.  Retrieve chunk IDs and scores.
3.  Join with MongoDB `Embeddings` collection for full payload.

---

### `llmService.js` - Language Model Interface
**Purpose**: Handles all LLM API calls (OpenRouter gateway).

**Capabilities**:
*   **Answer Generation**: Uses Llama 3.3 70B (or fallback models) to generate legal answers.
*   **Translation**: Translates Urdu → English for embedding; English → Urdu for user-facing responses.
*   **Prompt Engineering**: Injects system instructions, few-shot examples, and retrieved context.

**Key Methods**:
*   `translateQueryToEnglish(query)`: Detects language; translates if Urdu.
*   `generateAnswer(query, context)`: Constructs prompt and calls LLM.
*   `getNextApiKey()`: Rotates through multiple OpenRouter API keys to avoid rate limits.

**Model Selection**:
*   Primary: `meta-llama/llama-3.3-70b-instruct:free`
*   Fallbacks: Qwen 2.5, Mistral variants (auto-selected on rate limits).

**Error Handling**:
*   Retries with next model on 429/500 errors.
*   Logs detailed error context for debugging.

---

## 📊 Methodologies

### RAG Pipeline Architecture
```
User Query (Urdu/English)
    ↓
[Language Detection & Translation] → English Query
    ↓
[Embedding Generation] → 768-dim Vector
    ↓
[Qdrant Search] → Top-50 Chunks
    ↓
[Score Filtering] → Top-K Relevant Chunks (adaptive threshold)
    ↓
[Context Assembly] → Deduplicated, Ranked Chunks
    ↓
[Prompt Construction] → System + Context + Query
    ↓
[LLM Generation] → Legal Answer
    ↓
[Response Formatting] → JSON with Sources
```

### Embedding Strategy
*   **Model Choice**: `all-mpnet-base-v2` selected for legal domain performance (general-purpose but robust).
*   **Local Inference**: ONNX runtime ensures low latency and no external API dependency.
*   **Normalization**: L2 normalization applied to ensure cosine similarity compatibility with Qdrant.

### Retrieval Strategy
*   **Hybrid Approach**: Initially retrieve large candidate set (50 chunks); apply post-filtering.
*   **Adaptive Scoring**: Dynamically adjust threshold based on score distribution (ensures quality over quantity).
*   **Deduplication**: Group chunks by `doc_id` to prevent answer redundancy; retain highest-scoring chunk per document.

### Prompt Engineering
*   **System Prompt**: Defines role as Pakistani legal assistant; emphasizes accuracy and citation.
*   **Few-Shot Examples**: Provides 2-3 examples of ideal query-answer pairs (legal definitions, procedural questions).
*   **Context Injection**: Inserts retrieved chunks with metadata (section, title, source).
*   **Output Constraints**: Instructs LLM to cite sections, avoid speculation, and indicate when uncertain.

### Translation Methodology
*   **Detection**: Uses Unicode range check (`\u0600-\u06FF`) for Urdu script.
*   **Bidirectional**: 
    - Urdu → English for embedding/search.
    - English answer → Urdu if original query was Urdu.
*   **Model**: Gemini 2.0 Flash (low latency, high accuracy for legal terminology).

### Error Handling & Resilience
*   **API Key Rotation**: Cycles through 4+ OpenRouter keys to avoid rate limits.
*   **Model Fallback**: Tries 5+ free-tier models sequentially on failure.
*   **Graceful Degradation**: Returns helpful error messages instead of raw stack traces.
*   **Timeout Management**: Sets 60s timeout for LLM calls; retries once on network errors.

### Performance Optimizations
*   **Lazy Model Loading**: Embedding model loads on first query (not startup).
*   **Batch Metadata Fetching**: Uses MongoDB `$in` queries to fetch all chunk metadata in one operation.
*   **Caching (Future)**: Plan to cache embeddings for frequent queries (Redis/in-memory).

### Security & Compliance
*   **API Key Management**: All secrets in `.env`; never logged or exposed.
*   **CORS Configuration**: Restricted origins in production (currently open for development).
*   **Input Validation**: Sanitizes user queries; enforces length limits.
*   **Rate Limiting (Planned)**: Will add Express middleware to prevent abuse.

### Evaluation & Quality Assurance
*   **Manual Testing**: Legal experts validate answers for accuracy and citation correctness.
*   **Score Thresholds**: Empirically tuned to balance precision/recall (currently ~0.3-0.4 minimum).
*   **Logging**: All queries, retrieved chunks, and LLM responses logged for offline analysis.

---

## 🧪 Testing

### Built-in Test UI
A simple HTML/JavaScript interface is included for manual testing.

**Access**:
```
http://localhost:3000/chatbot.html
```

**Features**:
*   Submit queries in Urdu or English.
*   View generated answers with source citations.
*   Inspect API response JSON (for debugging).

### API Testing (cURL Examples)

**Health Check**:
```bash
curl http://localhost:3000/api/chat/health
```

**Ask Question**:
```bash
curl -X POST http://localhost:3000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the punishment for theft?", "topK": 5}'
```

**List Documents**:
```bash
curl http://localhost:3000/api/chat/documents
```

### Automated Testing (Future)
*   Unit tests for individual services (Jest/Mocha).
*   Integration tests for RAG pipeline end-to-end.
*   Evaluation dataset with ground-truth Q&A pairs.

---

## 🚀 Deployment

### Production Checklist
1.  Set `NODE_ENV=production` in `.env`.
2.  Configure CORS to allow only trusted origins.
3.  Enable rate limiting middleware.
4.  Use PM2 or systemd for process management:
    ```bash
    npm install -g pm2
    pm2 start src/app.js --name ai-lawyer-backend
    ```
5.  Set up reverse proxy (Nginx) with SSL.
6.  Monitor logs and API response times.

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=3000
QDRANT_URL=https://your-qdrant-cloud.io
QDRANT_API_KEY=your_production_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-lawyer
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_KEY_1=sk-or-v1-...  # Additional keys for rotation
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
EMBEDDING_MODEL=Xenova/all-mpnet-base-v2
```

---

## 📈 Performance Benchmarks

| Operation                  | Avg Latency | Notes |
|----------------------------|-------------|-------|
| Embedding Generation       | ~150ms      | CPU-based ONNX inference |
| Qdrant Vector Search       | ~50ms       | Cloud instance (1GB index) |
| MongoDB Metadata Fetch     | ~30ms       | Local deployment |
| LLM Answer Generation      | ~3-8s       | Depends on OpenRouter queue |
| **End-to-End Query**       | **~4-10s**  | Includes translation if Urdu |

*Measured on: Node.js v20, 4-core CPU, 8GB RAM*

---

## 🔧 Troubleshooting

| Issue                                | Cause / Solution |
|--------------------------------------|------------------|
| `ECONNREFUSED` on Qdrant URL         | Verify Qdrant is running; check `QDRANT_URL` in `.env`. |
| Embedding model download hangs       | First run downloads ~400MB; ensure stable internet. |
| OpenRouter 429 errors                | Rate limit hit; add more API keys or reduce request frequency. |
| Empty search results                 | Check if Qdrant collection has data; verify `QDRANT_COLLECTION` name. |
| MongoDB connection timeout           | Ensure MongoDB is running; verify `MONGODB_URI`. |
| Slow response times                  | Enable GPU for embeddings (if available); use Qdrant cloud. |

---

## 🤝 Contribution Guidelines

1.  **Code Structure**: Follow the existing modular pattern (Controllers → Services).
2.  **Environment Variables**: Document all new `.env` keys in this README.
3.  **Error Handling**: Use try-catch blocks; log errors with context.
4.  **Comments**: Add JSDoc comments for new functions.
5.  **Testing**: Write unit tests for new services.
6.  **Commit Messages**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`).

---

## 📚 Additional Resources

*   [Qdrant Documentation](https://qdrant.tech/documentation/)
*   [OpenRouter API Docs](https://openrouter.ai/docs)
*   [Xenova Transformers.js](https://huggingface.co/docs/transformers.js)
*   [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

## 📝 License
See project root `LICENSE` for terms.

---

## 👥 Maintainers
*Add team member names/emails here.*

---

**Built with ❤️ for Pakistani legal professionals and citizens.**
