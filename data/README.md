# Data Directory

This directory serves as the central storage layer for the AI-Lawyer project, containing all legal data artifacts generated throughout the preprocessing pipeline. It is organized to support the transformation of raw legal documents into queryable vector embeddings.

## 📂 Directory Structure

The data flows sequentially through these subdirectories:

```
data/
├── raw/                  # Immutable source files (HTML, PDF)
├── text/                 # Extracted plain text
├── cleaned/              # Normalized text (no boilerplate)
├── chunks/               # Semantically segmented JSONs
├── embeddings/           # Vector representations (backups)
└── metadata/             # Global document registry
```

---

## 🔄 Data Lifecycle & Flow

1.  **Ingestion (`raw/`)**: Scrapers download original documents from legal portals.
2.  **Extraction (`text/`)**: Parsers convert PDFs/HTMLs into raw plain text.
3.  **Cleaning (`cleaned/`)**: Scripts remove headers, footers, and artifacts.
4.  **Chunking (`chunks/`)**: Cleaned text is split into overlapping, semantic units.
5.  **Embedding (`embeddings/`)**: Chunks are converted to vectors and stored here before upload to Qdrant.

---

## 📁 Subfolder Details

### 1. `raw/`
*   **Purpose**: Stores the original, unmodified source files.
*   **Structure**: Organized by source/jurisdiction (e.g., `raw/balochistan-code/`).
*   **Formats**: `.html`, `.pdf`, `.json`.
*   **Note**: This is the "ground truth". If downstream processing fails, we restart from here.

### 2. `text/`
*   **Purpose**: Holds the raw text extracted from source files.
*   **Structure**: Mirrors `raw/` folder structure.
*   **Formats**: `.txt` or `.json` (containing a `text` field).
*   **Content**: Text may still contain page numbers, line breaks, or encoding artifacts.

### 3. `cleaned/`
*   **Purpose**: Contains high-quality text ready for NLP tasks.
*   **Structure**: Mirrors `raw/` folder structure.
*   **Operations Applied**:
    *   Whitespace normalization.
    *   Removal of page headers/footers.
    *   Unicode normalization (NFKC).
    *   Boilerplate stripping.

### 4. `chunks/`
*   **Purpose**: Stores document segments optimized for the embedding model's context window (typically 512-1024 tokens).
*   **Organization**: Mirrors `cleaned/` directory structure (e.g., `chunks/balochistan-code/`, `chunks/supremecourt-judgments/`).
*   **Format**: JSON files (one per source document).
*   **Schema Example**:
    ```json
    {
      "id": "bal_act_2011_chunk_0",
      "doc_id": "bal_act_2011",
      "chunk_index": 0,
      "text": "Short title and commencement.—(1) This Act may be called the Balochistan Employees' Efficiency and Discipline Act, 2011...",
      "metadata": {
        "source": "balochistan-code",
        "section": "Section 1",
        "title": "Bal_Employees'_Efficiency_and_Discipline_Act_2011",
        "jurisdiction": "Balochistan",
        "document_type": "statute",
        "status": "ready"
      }
    }
    ```
*   **Key Fields**:
    - `id`: Unique identifier (format: `{doc_id}_chunk_{index}`).
    - `doc_id`: Parent document identifier.
    - `chunk_index`: Sequential position within document (0-indexed).
    - `text`: The actual chunk content (cleaned, normalized).
    - `metadata.status`: Processing state (`pending`, `ready`, `embedded`, `failed`).
    - `metadata.section`: Legal section/article reference (if detected).
*   **Size Guidelines**: Chunks typically 400-800 characters with 100-character overlap to preserve context across boundaries.
*   **Usage**: Read by embedding scripts; uploaded to Qdrant as payload.

### 5. `embeddings/`
*   **Purpose**: Local cache/backup of generated vector embeddings.
*   **Format**: `.jsonl` (JSON Lines) or `.pt`/`.npy` files.
*   **Usage**: Used to bulk-upload to Qdrant without re-running the expensive inference step.

### 6. `metadata/`
*   **Purpose**: Maintains the global state and attributes of the corpus.
*   **Key File**: `documents_metadata.json`
*   **Content**: Maps filenames to titles, URLs, enactment dates, and processing status (e.g., `{"status": "embedded"}`).

---

## ⚠️ Important Notes

*   **Git Ignore**: Most folders here (`raw`, `embeddings`, `chunks`) are likely large and should be excluded from version control via `.gitignore`.
*   **Backups**: The `raw/` directory is critical. Back it up regularly. All other directories can be deterministically regenerated using the `preprocessing/` pipeline.
*   **Manual Edits**: Avoid manually editing files in `cleaned/` or `chunks/`. Instead, improve the cleaning scripts in `preprocessing/src/text_cleaning/` and re-run the pipeline.
