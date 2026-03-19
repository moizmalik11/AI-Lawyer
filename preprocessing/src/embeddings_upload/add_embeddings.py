import os
import json
from pathlib import Path
from datetime import datetime
from sentence_transformers import SentenceTransformer
import numpy as np

# ==========================
# CONFIG PATHS (robust to CWD)
# ==========================
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parents[2]  # points to project root (AI-Lawyer)
DATA_DIR = BASE_DIR / "data"
CHUNKS_DIR = DATA_DIR / "chunks"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
METADATA_FILE = DATA_DIR / "metadata" / "documents_metadata.json"
EMBEDDINGS_FILE = EMBEDDINGS_DIR / "embeddings.jsonl"

# Batch size for SentenceTransformer encoding — tune based on your RAM/VRAM
ENCODE_BATCH_SIZE = 64
# Save metadata every N documents instead of every single one
METADATA_SAVE_INTERVAL = 10

# ==========================
# HELPER FUNCTIONS
# ==========================
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_last_id(path):
    """Read last ID from jsonl efficiently by seeking from the end."""
    if not path.exists() or path.stat().st_size == 0:
        return 0
    try:
        with open(path, "rb") as f:
            # Seek backwards to find the last complete line
            f.seek(0, 2)  # end of file
            pos = f.tell()
            if pos == 0:
                return 0
            # Skip trailing newline(s)
            pos -= 1
            f.seek(pos)
            while pos > 0 and f.read(1) in (b"\n", b"\r"):
                pos -= 1
                f.seek(pos)
            # Find start of last line
            while pos > 0:
                f.seek(pos)
                if f.read(1) == b"\n":
                    break
                pos -= 1
            last_line = f.readline().decode("utf-8").strip()
            if not last_line:
                return 0
            last_record = json.loads(last_line)
            return last_record["metadata"]["id"]
    except Exception:
        return 0

def load_embedded_titles(embeddings_file):
    """Pre-load ALL embedded document titles into a set (one-time scan)."""
    titles = set()
    if not embeddings_file.exists():
        return titles
    with open(embeddings_file, "r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                title = rec["metadata"].get("title")
                if title:
                    titles.add(title)
            except Exception:
                continue
    return titles

# ==========================
# MAIN LOGIC
# ==========================
def main():
    print("🔍 Loading metadata...")
    metadata = load_json(METADATA_FILE)
    model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    id_counter = get_last_id(EMBEDDINGS_FILE) + 1
    total_added = 0

    # --- FIX 1: Pre-load all embedded titles ONCE instead of scanning per document ---
    print("📂 Loading existing embedding titles...")
    embedded_titles = load_embedded_titles(EMBEDDINGS_FILE)
    print(f"   Found {len(embedded_titles)} already-embedded titles.")

    docs_since_last_save = 0

    for doc in metadata["documents"]:
        proc_status = doc.get("processing_status", {})
        already_embedded = proc_status.get("embedded", False)
        has_embeddings = doc.get("title") in embedded_titles

        # Skip logic: only skip if already embedded AND embeddings actually exist
        if not proc_status.get("chunked") or (already_embedded and has_embeddings):
            continue

        # Resolve chunk path
        chunked_path_str = str(doc["chunked_path"])
        while chunked_path_str.startswith("../") or chunked_path_str.startswith("./"):
            chunked_path_str = chunked_path_str.partition("/")[2]
        chunk_path = (BASE_DIR / chunked_path_str).resolve()
        if not chunk_path.exists():
            print(f"⚠️ Skipping missing chunk file: {chunk_path}")
            continue

        try:
            chunk_data = load_json(chunk_path)
        except Exception as e:
            print(f"❌ Error reading {chunk_path}: {e}")
            continue

        document_type = chunk_data.get("document_type", "unknown")
        chunks = chunk_data.get("chunks", [])
        if not chunks:
            continue

        print(f"🧠 Creating embeddings for: {chunk_path.name} ({len(chunks)} chunks)")

        # --- FIX 2: Pre-compute metadata that is constant per document ---
        title = doc.get("title", "")
        year = str(doc.get("year", "")) if doc.get("year") else ""
        doc_type = doc.get("document_type", document_type)

        # --- FIX 3: Prepare ALL embedding texts in bulk, then batch-encode ---
        embedding_texts = []
        for chunk in chunks:
            chunk_title = chunk.get("chunk_title", "")
            chunk_type = chunk.get("chunk_type", "")
            parts = [
                doc_type if doc_type else "",
                title if title else "",
                chunk_type if chunk_type else "",
                chunk_title if chunk_title else "",
                f"Year {year}" if year else "",
                chunk["text"],
            ]
            embedding_texts.append(" | ".join(filter(None, parts)))

        # Batch encode — uses GPU parallelism or multi-threaded CPU
        embeddings = model.encode(
            embedding_texts,
            batch_size=ENCODE_BATCH_SIZE,
            convert_to_numpy=True,
            show_progress_bar=len(chunks) > 100,
        )

        # --- FIX 4: Buffer all records, write to disk ONCE per document ---
        lines_buffer = []
        for chunk, embedding in zip(chunks, embeddings):
            record = {
                "chunk": chunk["text"],
                "embedding": embedding.tolist(),
                "upload": False,
                "metadata": {
                    "id": id_counter,
                    "title": title,
                    "source_page": doc.get("source_page"),
                    "source_url": doc.get("source_url"),
                    "source_website": doc.get("source_website"),
                    "cleaned_path": doc.get("cleaned_path"),
                    "download_date": doc.get("download_date"),
                    "document_type": doc_type,
                    "year": doc.get("year"),
                    "court": doc.get("court"),
                    "chunk_index": chunk.get("chunk_index"),
                    "chunk_type": chunk.get("chunk_type", ""),
                    "chunk_title": chunk.get("chunk_title", ""),
                },
            }
            lines_buffer.append(json.dumps(record, ensure_ascii=False))
            id_counter += 1
            total_added += 1

        # Single file open + write for the whole document
        with open(EMBEDDINGS_FILE, "a", encoding="utf-8") as f:
            f.write("\n".join(lines_buffer) + "\n")

        # ✅ Mark as embedded
        doc["processing_status"]["embedded"] = True
        doc["status"] = "embedded"
        embedded_titles.add(title)  # update in-memory set
        docs_since_last_save += 1

        # --- FIX 5: Save metadata periodically, not every single document ---
        if docs_since_last_save >= METADATA_SAVE_INTERVAL:
            save_json(METADATA_FILE, metadata)
            print(f"💾 Metadata saved (batch of {docs_since_last_save} docs)")
            docs_since_last_save = 0

        print(f"✅ Done: {chunk_path.name}")

    # Final metadata save to catch any remaining unsaved documents
    if docs_since_last_save > 0:
        save_json(METADATA_FILE, metadata)

    print(f"\n🎯 All done! Added {total_added} embeddings.")
    print(f"📁 Saved to: {EMBEDDINGS_FILE}")

# ==========================
# ENTRY POINT
# ==========================
if __name__ == "__main__":
    main()

