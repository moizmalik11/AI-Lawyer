# Preprocessing Pipeline

This folder contains the full data ingestion, cleaning, chunking, embedding, and metadata preparation pipeline for the AI-Lawyer project. It transforms diverse raw legal sources (laws, codes, judgments) into structured, cleaned, chunked, embedded, and query-ready artifacts stored in Qdrant for Retrieval-Augmented Generation (RAG).

> Focus: Reliability, reproducibility, and modularity. Each stage is isolated so you can rerun only the part that needs updating.

---
## 1. High-Level Flow

Raw Source (web / files) → Text Extraction → Cleaning & Normalization → Metadata Enrichment → Chunking → Embedding Generation → Vector DB Upload (Qdrant) → RAG Queries.

You can run stages independently; intermediate outputs are persisted under the top-level `data/` directory in the repository (outside this `preprocessing` folder).

---
## 2. Directory Overview

```
preprocessing/
	.env                     # Environment variables (both Node + Python parts)
	package.json             # Node.js dependencies (scrapers, utilities)
	requirements.txt         # Python dependencies (text processing, embeddings, Qdrant client)
	src/
		data_collection/       # JavaScript scrapers for different legal sources
		text_extraction/       # Python extraction utilities from raw formats
		text_cleaning/         # Python cleaners per corpus
		metadata_extraction/   # (Placeholder for enrichment logic)
		chunking/              # Utilities to create and manage document chunks
		embeddings_upload/     # Python scripts to compute and push embeddings to Qdrant
		ocr/                   # (Placeholder for OCR pipelines if PDFs/images appear)
		utils/                 # Shared helpers (e.g., metadata management)
```

### 2.1. `data_collection/`
JavaScript scrapers (each tailored to a jurisdiction or source):
- `balochistan_code_scraper.js`
- `kp_code_scraper.js`
- `pakistan_code_scraper.js`
- `punjab_code_scraper.js`
- `shrc_scraper.js`
- `supremecourt_scraper.js`

Outputs typically land in `data/raw/<source>/` (outside this folder). Each scraper should:
- Fetch HTML or PDF links
- Normalize title → filename
- Avoid duplicates via in-memory and disk checks

`remove_duplicates.py` (Python) can be run afterward to purge redundant JSON/text entries.

### 2.2. `text_extraction/`
- `extract_text.py`: Converts raw HTML/PDF or structured source into plain text JSON/lines under `data/text/<source>/`.

### 2.3. `text_cleaning/`
Corpus-specific cleaning scripts:
- `clean_balochistan_code.py`, `clean_kp_code.py`, `clean_pakistan_code.py`, `clean_punjab_code.py`, `clean_shrc_sindh.py`, `clean_supremecourt_judgments.py`

Typical operations (based on naming conventions):
- Remove boilerplate (headers/footers)
- Normalize whitespace
- Strip artifacts (page numbers, navigation text)
- Harmonize punctuation & Unicode

Outputs stored under `data/cleaned/<source>/`.

### 2.4. `metadata_extraction/`
Reserved for deriving structured metadata (e.g., jurisdiction, enactment date, section numbers). Currently a placeholder directory; enrichment may leverage regex patterns and external registries.

### 2.5. `chunking/`
**Purpose**: Splits cleaned legal documents into semantically meaningful chunks optimized for embedding models.

**Scripts**:

#### `create_empty_jsons.py`
- **Function**: Scans `data/cleaned/` directory tree and creates corresponding empty JSON files in `data/chunks/`.
- **Process**:
  1. Walks through all subdirectories in `data/cleaned/`.
  2. Mirrors directory structure in `data/chunks/`.
  3. For each cleaned file, creates `{filename}.json` placeholder.
  4. Skips files that already have chunk JSONs (idempotent).
- **Usage**: Run once before chunking to initialize tracking structure.
- **Output**: Empty JSON files ready for population with chunk data.

#### `update_chunk_status.py`
- **Function**: Updates processing status flags within chunk JSON files.
- **Status Values**: `pending`, `ready`, `embedded`, `failed`.
- **Use Cases**:
  - Mark chunks as `ready` after manual review.
  - Flag `failed` chunks for debugging.
  - Track `embedded` status after Qdrant upload.
- **Implementation**: Reads JSON, updates `status` field, writes back atomically.

**Chunking Strategy**:
- **Rule-Based**: Detect section headers (regex: `^(Section|Article|Chapter)\s+\d+`) and split at boundaries.
- **Size Constraints**: If section > `CHUNK_SIZE`, recursively split by paragraphs or sentences.
- **Sliding Window**: For documents without clear structure, use overlapping windows (`CHUNK_SIZE` with `CHUNK_OVERLAP`).
- **Metadata Preservation**: Each chunk retains `doc_id`, `chunk_index`, `section`, `title`, `source`.

### 2.6. `embeddings_upload/`
**Purpose**: Generate vector embeddings and upload them to Qdrant (vectors) and MongoDB (metadata).

**Scripts**:

#### `upload_embeddings.py` - Main Upload Pipeline
- **Function**: Batch processes `data/embeddings/embeddings.jsonl` and uploads to Qdrant + MongoDB.
- **Process**:
  1. Reads embeddings from JSONL file (one JSON object per line).
  2. Extracts vector (768-dim) and metadata (title, year, court, document_type).
  3. Uploads vectors to Qdrant collection with payload: `{id, chunk, vector, title, year, court, document_type, download_date}`.
  4. Uploads full metadata (excluding embeddings) to MongoDB `Embeddings` collection.
  5. Creates MongoDB indexes on `id`, `court`, `year`, `document_type` for fast queries.
- **Configuration**: Uses `.env` for `QDRANT_URL`, `QDRANT_COLLECTION`, `MONGO_URI`, `MONGO_DB`.
- **Batch Size**: Processes 100 vectors at a time to avoid memory issues.
- **Error Handling**: Logs failed uploads; continues with remaining chunks.

#### `add_embeddings.py` - Incremental Updates
- **Function**: Adds new/updated documents without full reindex.
- **Use Cases**:
  - New legal documents scraped.
  - Corrections to existing chunks.
  - Re-chunking with different parameters.
- **Process**: Same as `upload_embeddings.py` but targets specific files/IDs.

#### `test_qdrant_query.py` - Single Query Test
- **Function**: Performs a single vector similarity search to validate Qdrant setup.
- **Usage**: `python test_qdrant_query.py --query "What is theft?" --collection Embeddings`
- **Output**: Prints top-5 similar chunks with scores and metadata.

#### `test_qdrant_queries_batch.py` - Batch Query Test
- **Function**: Runs multiple test queries from a file to benchmark retrieval quality.
- **Input**: Text file with one query per line.
- **Output**: CSV with query, top results, scores, and relevance metrics.
- **Metrics**: Average score, score distribution, retrieval latency.

**Expected Workflow**:
1. Generate embeddings using `sentence-transformers` (separate script or integrated).
2. Run `upload_embeddings.py` to populate Qdrant + MongoDB.
3. Validate with `test_qdrant_query.py`.
4. For new docs: use `add_embeddings.py`.

### 2.7. `ocr/`
Placeholder for adding OCR when raw inputs are scanned PDFs/images. Would typically integrate Tesseract or similar.

### 2.8. `utils/`
- `metadata_manager.js`: Node-based helper for reading/writing metadata JSON, merging or updating fields.

---
## 3. Tools & Libraries (Actual)

Below is the concrete set of tools declared in `package.json` and `requirements.txt`, grouped by pipeline stage. Update this list whenever dependencies change.

| Stage / Purpose            | Library / Tool                | Role / Notes |
|----------------------------|-------------------------------|--------------|
| HTTP Scraping (static)     | `axios`                       | Fetch HTML, JSON, PDFs over HTTP(S). |
| HTML Parsing               | `cheerio`                     | DOM traversal & selectors for server-side parsing. |
| Dynamic Content Scraping   | `puppeteer`                   | Headless Chromium for pages requiring JS execution. |
| PDF Parsing (primary)      | `PyMuPDF`                     | Fast extraction of text, metadata, page segmentation. |
| PDF Parsing (fallback)     | `pdfminer.six`                | Alternate extraction when layout/encoding issues arise. |
| OCR (scanned docs)         | `pytesseract` + `Pillow`      | Image preprocessing & text extraction for raster PDFs. |
| Text Representation        | `sentence-transformers`       | Embedding generation (Sentence-BERT family). |
| Deep Learning Backend      | `torch`                       | Provides tensor ops; required by transformers. |
| Numerical Utilities        | `numpy`                       | Array manipulations, similarity computations. |
| Vector Database            | `qdrant-client`               | CRUD ops, similarity search, collection management. |
| Document Storage / Metadata| `pymongo` (if used)           | Optional persistence of raw docs / metadata in MongoDB. |
| Environment Variables      | `python-dotenv` / Node `dotenv`| Load `.env` configuration. |
| Utility / Internal         | Custom Python & JS scripts    | Cleaning, chunking, deduplication, status tracking. |

Optional / Future (not yet listed but potential): `loguru` (Python logging), `winston` (Node logging), `pydantic` (schema validation).

> Reproducibility: Pin versions (already done) and record model names (see `.env: EMBEDDING_MODEL`). If upgrading `torch` or `sentence-transformers`, validate embedding drift.

---
## 3.1. Tool Selection Rationale
| Need | Choice | Reason |
|------|--------|--------|
| Fast PDF extraction | `PyMuPDF` | Speed + layout fidelity. |
| Complex PDFs fallback | `pdfminer.six` | Handles edge cases with encoded characters. |
| OCR for scans | `pytesseract` | Widely available + multilingual potential. |
| Embeddings | `sentence-transformers` | High quality semantic vectors, local inference. |
| Headless scraping | `puppeteer` | Handles dynamic / JS-rendered pages (e.g., legal portals). |

---
## 4. Methodologies (Detailed)

This section formalizes the approaches used at each pipeline stage to ensure consistency, scalability, and clear reasoning behind design choices.

### 4.1. Scraping Methodology
- Preference order: Static fetch (`axios`) → DOM parse (`cheerio`) → dynamic render (`puppeteer`) only if required.
- Normalize URLs and remove tracking/query params to avoid duplicate fetches.
- Implement retry with exponential backoff (suggested) for transient network errors.
- Use user-agent rotation or randomized delays if target sites enforce rate limits.
- Filenames derived from cleaned titles (slugify: lowercase, replace spaces with underscores, strip punctuation).
- Deduplication pre-save: maintain an in-memory hash (e.g., SHA256 of raw HTML/text) and cross-check existing file names.

### 4.2. Deduplication Strategy
- Post-collection script `remove_duplicates.py` scans target directory.
- Hash content lines or structured JSON `text` field; duplicates flagged for deletion or archiving.
- Optionally maintain a `duplicates_report.json` for audit trail.

### 4.3. Text Extraction Strategy
- Primary PDF pipeline: `PyMuPDF` page iteration → extract text → join preserving page boundaries using delimiters (`\n---PAGE {n}---\n`).
- Fallback pipeline: `pdfminer.six` when PyMuPDF yields empty/garbled output.
- OCR branch: detect images-only pages (heuristic: text length < threshold) → rasterize → preprocess (grayscale, threshold) → `pytesseract`.
- Output normalization: convert Windows CRLF → LF, ensure UTF-8.

### 4.4. Cleaning & Normalization
- Remove page markers, repeated headers/footers via regex patterns.
- Collapse multiple spaces, normalize Unicode (NFKC), and standardize quotes.
- Section detection (regex): patterns like `^(Section|Sec\.|Article)\s+\d+[A-Za-z0-9\-]*` used to segment later if semantic chunking not available.
- Preserve structural markers (e.g., section titles) to aid retrieval context.

### 4.5. Metadata Enrichment (Planned)
- Extract jurisdiction from source directory name.
- Infer document type (`statute`, `judgment`, `regulation`).
- Add `enactment_year` via regex over preambles or titles.
- Future: Cross-reference external registries for validation (e.g., official gazette indexes).

### 4.6. Chunking Strategy
- Rule-Based: Split by detected section headers; if section exceeds `CHUNK_SIZE` characters/tokens, recursively split by paragraphs.
- Length-Based Sliding Window: When no clear sections, use window of `CHUNK_SIZE` with `CHUNK_OVERLAP` to preserve context continuity.
- Deterministic IDs: `chunk_id = f"{doc_id}_{chunk_index}"` ensures idempotent reprocessing.
- Placeholder JSONs allow tracking progress before embeddings generation (`create_empty_jsons.py`).
- Status management (`update_chunk_status.py`) marks lifecycle states: `pending`, `ready`, `embedded`.

### 4.7. Embedding Generation
- Model from `.env: EMBEDDING_MODEL` (e.g., `sentence-transformers/all-MiniLM-L6-v2`).
- Batch inference to reduce latency (e.g., batch size 16–64 depending on GPU/CPU).
- Normalize vectors (L2) if required by similarity metric (Qdrant supports cosine by default; normalization optional but consistent).
- Record `embedding_model_version` in payload for future re-embedding comparisons.

### 4.8. Vector Upload (Qdrant)
- Upsert pattern: check if `id` exists → replace or skip (idempotency).
- Payload includes: `doc_id`, `chunk_index`, `source`, `jurisdiction`, `text`, `section`, `embedding_model_version`, optional timestamps.
- Index configuration: HNSW + cosine distance (default) initially; later enable quantization for memory/performance tradeoffs once stable.
- Batch size tuned to balance network overhead vs memory (e.g., 256–512 vectors per request).

### 4.9. Retrieval & Evaluation
- Sanity tests: `test_qdrant_query.py` (single) & `test_qdrant_queries_batch.py` (batch).
- Qualitative evaluation: manual inspection of top-k results for representative queries (statutory interpretation, procedural rules, definitions).
- Future quantitative metrics: Build a labeled question → relevant chunk dataset; compute recall@k, MRR.
- Drift monitoring: Compare embedding distributions (mean cosine similarity against previous run) after model upgrades.

### 4.10. Error Handling & Logging (Recommended Enhancements)
- Wrap network calls with try/except, log status codes.
- PDF extraction: catch exceptions per page to avoid aborting entire document.
- Embedding stage: isolate faulty chunks, log to `failed_chunks.json` for reprocessing.
- Introduce structured logging (JSON) for pipeline observability.

### 4.11. Reproducibility & Determinism
- Fix random seeds (`torch.manual_seed(...)`) when models introduce randomness.
- Version pinning in `requirements.txt` ensures stable vector outputs.
- Maintain a `processing_manifest.json` per run capturing timestamps, source counts, model hash.

### 4.12. Performance Considerations
- Parallel scraping using Promise.all / controlled concurrency (limit to avoid DoS concerns).
- Enable GPU for `sentence-transformers` if available (`torch.cuda.is_available()`).
- Pre-tokenize chunks once to avoid repeated cost during embedding.

### 4.13. Security & Compliance
- Respect robots.txt (implement check before scraping).
- Sanitize outputs to avoid storing any PII inadvertently contained in judgments.
- Keep API keys (Qdrant, OpenAI) in `.env` only; never log them.

### 4.14. Future Methodologies
- Semantic Chunking: Use change-point detection (cosine similarity dips) to refine boundaries.
- Hybrid Retrieval: Combine keyword (BM25) + dense vectors for improved precision.
- Active Learning Loop: Collect user feedback on answer relevance and retrain filtering heuristics.

---
## 4.15. Methodology Quick Reference
| Stage | Method | Key Parameter(s) |
|-------|--------|------------------|
| Scraping | Static → Dynamic fallback | Retry count, timeout |
| Extraction | PyMuPDF primary | Page delimiter token |
| Cleaning | Regex + Unicode normalization | Header/footer patterns |
| Chunking | Section-based + sliding window | `CHUNK_SIZE`, `CHUNK_OVERLAP` |
| Embeddings | Sentence Transformers | Batch size, model version |
| Upload | Batched upsert | Batch size, collection name |
| Retrieval | Cosine similarity (k-nearest) | `top_k` |
| Evaluation | Manual + planned metrics | recall@k, MRR |

---

---
## 4. Environment Setup (Windows PowerShell Examples)

### 4.1. Clone & Navigate
```powershell
git clone <repo-url>
cd AI-Lawyer\preprocessing
```

### 4.2. Python Virtual Environment
```powershell
python -m venv .venv
./.venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

### 4.3. Node.js Dependencies (for scrapers)
```powershell
npm install
```

### 4.4. `.env` Configuration
Create a `.env` file (already present, ensure values populated). Example keys (adjust to actual usage):
```
QDRANT_URL=https://your-qdrant-instance
QDRANT_API_KEY=your_qdrant_key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
OPENAI_API_KEY=sk-...            # If using OpenAI
CHUNK_SIZE=800                   # Tokens or characters, per convention
CHUNK_OVERLAP=100                # Overlap size for sliding windows
COLLECTION_NAME=legal_documents
```

Do not commit secrets. Add `.env` to top-level `.gitignore` if not already.

---
## 5. Running the Pipeline Step-by-Step

You can execute each stage independently; below is an example sequential run.

### 5.1. Scrape Raw Data (Node)
```powershell
node src/data_collection/balochistan_code_scraper.js
node src/data_collection/punjab_code_scraper.js
# ... repeat for other sources
```

### 5.2. Remove Duplicates (Optional)
```powershell
python src/data_collection/remove_duplicates.py --input ..\..\data\raw\balochistan-code
```

### 5.3. Extract Text
```powershell
python src/text_extraction/extract_text.py --source balochistan-code --raw_dir ..\..\data\raw --out_dir ..\..\data\text
```

### 5.4. Clean Text
```powershell
python src/text_cleaning/clean_balochistan_code.py --in ..\..\data\text\balochistan-code --out ..\..\data\cleaned\balochistan-code
```

### 5.5. Prepare Chunks
```powershell
python src/chunking/create_empty_jsons.py --clean_dir ..\..\data\cleaned\balochistan-code --chunks_dir ..\..\data\chunks\balochistan-code
python src/chunking/update_chunk_status.py --chunks_dir ..\..\data\chunks\balochistan-code --status ready
```

### 5.6. Generate & Upload Embeddings
```powershell
python src/embeddings_upload/upload_embeddings.py --chunks_dir ..\..\data\chunks\balochistan-code --collection $Env:COLLECTION_NAME
```

### 5.7. Test Queries Against Qdrant
```powershell
python src/embeddings_upload/test_qdrant_query.py --collection $Env:COLLECTION_NAME --query "What is the appeals process?"
python src/embeddings_upload/test_qdrant_queries_batch.py --collection $Env:COLLECTION_NAME --queries_file queries.txt
```

> Flags above are illustrative; add or adjust based on actual script argument parsing. If scripts do not yet support CLI args, extend them using `argparse` (Python) or a Node CLI helper.

---
## 6. Data Conventions

| Stage        | Format Example                                      | Location (relative to repo root)                |
|--------------|------------------------------------------------------|-------------------------------------------------|
| Raw          | Original HTML / PDF / JSON                           | `data/raw/<source>/`                            |
| Text         | Plain `.txt` or JSON lines                           | `data/text/<source>/`                           |
| Cleaned      | Normalized text files                                | `data/cleaned/<source>/`                        |
| Chunks       | JSON: `{ id, doc_id, chunk_index, text, metadata }`  | `data/chunks/<source>/`                         |
| Embeddings   | JSONL / direct upload (may also cache locally)       | `data/embeddings/`                              |
| Metadata     | Consolidated info per document                       | `data/metadata/documents_metadata.json`         |

Maintain stable keys: `doc_id`, `source`, `jurisdiction`, `section`, `title`, `created_at`, `updated_at` as needed.

---
## 7. Qdrant Integration (Conceptual)

Each chunk becomes a vector + payload:
```
{
	"id": "<uuid>",
	"vector": [0.01, -0.23, ...],
	"payload": {
		"doc_id": "BC_2011_12",
		"source": "balochistan-code",
		"section": "Section 12",
		"text": "The Government may...",
		"jurisdiction": "Balochistan",
		"type": "statute"
	}
}
```

Recommended Qdrant schema considerations:
- Use a consistent `collection_name`.
- Choose `HNSW` or `Scalar Quantization` optimizations only after baseline validation.
- Add full-text indexes (if using Qdrant payload indexing) for `text`, `section`.

---
## 8. Extending the Pipeline

| Goal                    | Action                                                             |
|-------------------------|--------------------------------------------------------------------|
| Add new jurisdiction    | Create new scraper + cleaner + update chunking + run embeddings    |
| Add OCR support         | Implement processing in `ocr/` and route outputs into `text/`      |
| Change embedding model  | Update `.env` + modify embedding script to load new model          |
| Add metadata enrichment | Populate `metadata_extraction/` with enrichment script             |
| Re-embed changed docs   | Run `add_embeddings.py` on targeted chunk subset                   |

---
## 9. Troubleshooting

| Issue                                | Possible Cause / Fix                                           |
|--------------------------------------|----------------------------------------------------------------|
| Empty embeddings collection          | Check `.env` keys; verify Qdrant connectivity                  |
| Duplicates in chunks                 | Chunk creation ran twice; add idempotency check                |
| Script cannot find paths             | Use absolute or correct relative paths (Windows escaping)      |
| Encoding errors (Unicode)            | Enforce UTF-8 opens; normalize using `unicodedata`             |
| Slow embedding generation            | Batch vectors; adjust model; ensure GPU (if applicable)        |
| Irrelevant retrieval results         | Tune chunk size; reduce overlap; verify cleaning quality       |

---
## 10. Recommended Improvements (Future)
- Centralized logging across Python & Node (e.g., `loguru` / `winston`).
- Add schema validation for intermediate JSON via `pydantic`.
- Parallel scraping & embedding with job queue (e.g., Celery or lightweight task runner).
- Add evaluation harness (precision@k for sample questions).
- Introduce automated drift detection (re-scrape schedule + hashing).

---
## 11. Minimal Make-Like Shortcut (Optional)
Create a PowerShell script (e.g., `run_full_pipeline.ps1`) to chain steps:
```powershell
./.venv/Scripts/Activate.ps1
node src/data_collection/balochistan_code_scraper.js
python src/text_extraction/extract_text.py --source balochistan-code
python src/text_cleaning/clean_balochistan_code.py
python src/chunking/create_empty_jsons.py
python src/embeddings_upload/upload_embeddings.py
```

---
## 12. FAQ
**Q: Can I rerun cleaning without re-scraping?** Yes, operate directly on `data/text/`.
**Q: How do I add a new embedding dimension?** Change model; Qdrant collection may need recreation.
**Q: Where do I store evaluation questions?** Create `data/eval/` and version them.
**Q: Is incremental update supported?** Use `add_embeddings.py` for new or modified documents.

---
## 13. Disclaimer
Some specifics (exact args, environment variables, library names) are inferred from file names and common patterns. Adjust to match actual implementation details. Always inspect each script before production usage.

---
## 14. Quick Reference Command Set
```powershell
# Activate env
./.venv/Scripts/Activate.ps1

# Scrape
node src/data_collection/pakistan_code_scraper.js

# Extract
python src/text_extraction/extract_text.py --source pakistan-code

# Clean
python src/text_cleaning/clean_pakistan_code.py

# Chunk
python src/chunking/create_empty_jsons.py
python src/chunking/update_chunk_status.py --status ready

# Embed & Upload
python src/embeddings_upload/upload_embeddings.py --collection $Env:COLLECTION_NAME

# Test Retrieval
python src/embeddings_upload/test_qdrant_query.py --query "Define disciplinary action"
```

---
## 15. Contribution Guidelines
1. Keep scripts atomic (one clear responsibility).
2. Add docstrings when extending logic.
3. Update this README for any structural changes.
4. Prefer deterministic outputs; log random seeds if used.
5. Run tests / sanity queries after embedding changes.

---
## 16. License
See project root `LICENSE` for overall terms. This preprocessing code is part of the same license.

---
## 17. Contact / Maintainers
Add maintainer names/emails here (e.g., project lead, data engineer).

---
Happy preprocessing! Optimize early for clarity—future scaling depends on clean data foundations.

