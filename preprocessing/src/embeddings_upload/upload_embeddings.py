"""
upload_embeddings_to_qdrant.py
Uploads embeddings from data/embeddings/embeddings.jsonl
to Qdrant (vector DB) and MongoDB (metadata store).

Configured to:
 - Send only {id, chunk, vector, title, year, court, document_type, download_date} to Qdrant.
 - Send full metadata (except embeddings) to MongoDB.
 - Automatically create useful indexes in MongoDB.
"""

import os
import json
import ssl
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from pymongo import MongoClient, ASCENDING, UpdateOne

# ==========================
# CONFIGURATION
# ==========================
load_dotenv()

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parents[2]
DATA_DIR = BASE_DIR / "data"
EMBEDDINGS_FILE = DATA_DIR / "embeddings" / "embeddings.jsonl"

# Environment variables (.env)
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "Embeddings")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "smartlawyer")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "Embeddings")

VECTOR_SIZE = 768  # For sentence-transformers MiniLM/MPNet
BATCH_SIZE = 500   # Optimized batch size for database uploads

# ==========================
# INIT CLIENTS
# ==========================
print("🔗 Connecting to Qdrant and MongoDB...")

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Configure MongoDB with SSL certificate verification disabled for Windows
mongo = MongoClient(
    MONGO_URI,
    tls=True,
    tlsAllowInvalidCertificates=True
)
mdb = mongo[MONGO_DB]
metadata_col = mdb[MONGO_COLLECTION]

# ==========================
# ENSURE QDRANT COLLECTION
# ==========================
try:
    qdrant.get_collection(QDRANT_COLLECTION)
    print(f"✅ Qdrant collection '{QDRANT_COLLECTION}' already exists.")
except Exception:
    print(f"⚙️ Creating new Qdrant collection: {QDRANT_COLLECTION}")
    qdrant.recreate_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=qmodels.VectorParams(size=VECTOR_SIZE, distance=qmodels.Distance.COSINE),
    )

# ==========================
# HELPER FUNCTIONS
# ==========================
def _process_batch(qdrant_points, mongo_operations, batch_records, fout):
    """Uploads a single batch to both DBs and writes to the updated JSONL."""
    if not qdrant_points:
        return

    # ---- 1️⃣ Upload to Qdrant ----
    try:
        qdrant.upsert(
            collection_name=QDRANT_COLLECTION,
            points=qdrant_points
        )
    except Exception as e:
        print(f"❌ Qdrant batch upload failed: {e}")

    # ---- 2️⃣ Upload to MongoDB ----
    try:
        if mongo_operations:
            metadata_col.bulk_write(mongo_operations, ordered=False)
    except Exception as e:
        print(f"⚠️ MongoDB batch upload failed: {e}")

    # ---- 3️⃣ Write updated records to temp file ----
    for rec in batch_records:
        rec["upload"] = True
        fout.write(json.dumps(rec, ensure_ascii=False) + "\n")


# ==========================
# MAIN UPLOAD FUNCTION
# ==========================
def upload_embeddings():
    print("📦 Starting optimized batch embedding upload process...")
    temp_file = EMBEDDINGS_FILE.with_suffix('.jsonl.tmp')
    
    total_processed = 0
    total_uploaded = 0
    
    qdrant_points = []
    mongo_operations = []
    batch_records = []

    try:
        # Stream read and write to avoid keeping 2GB+ in memory
        with open(EMBEDDINGS_FILE, "r", encoding="utf-8") as fin, \
             open(temp_file, "w", encoding="utf-8") as fout:
            
            for line in fin:
                total_processed += 1
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    fout.write(line)
                    continue

                if rec.get("upload", False):
                    # Already uploaded, just copy over
                    fout.write(line)
                    continue

                vec = rec.get("embedding")
                meta = rec.get("metadata", {})
                chunk = rec.get("chunk", "")

                if not vec or not meta:
                    # Missing essential data, copy over
                    fout.write(line)
                    continue

                # Add to Qdrant batch
                payload = {
                    "id": meta.get("id"),
                    "chunk": chunk,
                    "title": meta.get("title"),
                    "year": meta.get("year"),
                    "court": meta.get("court"),
                    "document_type": meta.get("document_type"),
                    "download_date": meta.get("download_date"),
                }
                
                qdrant_points.append(
                    qmodels.PointStruct(
                        id=meta.get("id"),
                        vector=vec,
                        payload=payload,
                    )
                )

                # Add to MongoDB batch
                clean_meta = {k: v for k, v in meta.items() if k != "embedding"}
                mongo_operations.append(
                    UpdateOne({"id": meta.get("id")}, {"$set": clean_meta}, upsert=True)
                )

                # Keep record ref for writing later
                batch_records.append(rec)

                # Process batch when threshold is reached
                if len(qdrant_points) >= BATCH_SIZE:
                    _process_batch(qdrant_points, mongo_operations, batch_records, fout)
                    total_uploaded += len(batch_records)
                    
                    if total_uploaded % 5000 == 0:
                        print(f"🧩 Processed {total_processed} items. Total uploaded so far: {total_uploaded}...")

                    # Clear batch
                    qdrant_points = []
                    mongo_operations = []
                    batch_records = []

            # Flush any remaining items in the buffer
            if qdrant_points:
                _process_batch(qdrant_points, mongo_operations, batch_records, fout)
                total_uploaded += len(batch_records)

        # Atomic replace of the original file with the new one
        if temp_file.exists():
            temp_file.replace(EMBEDDINGS_FILE)
            print(f"\n🎯 Upload completed! Total newly uploaded: {total_uploaded}")
            print(f"📁 Updated local file: {EMBEDDINGS_FILE}")

    except FileNotFoundError:
        print(f"❌ Embeddings file not found: {EMBEDDINGS_FILE}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        if temp_file.exists():
            print("⚠️ Cleaning up partial temporary file...")
            temp_file.unlink()

# ==========================
# CREATE INDEXES IN MONGODB
# ==========================
def ensure_indexes():
    print("⚙️ Ensuring MongoDB indexes...")
    try:
        metadata_col.create_index([("court", ASCENDING)])
        metadata_col.create_index([("year", ASCENDING)])
        metadata_col.create_index([("document_type", ASCENDING)])
        metadata_col.create_index([("title", ASCENDING)])
        print("✅ MongoDB indexes created or verified.")
    except Exception as e:
        print(f"⚠️ Index creation failed: {e}")

# ==========================
# ENTRY POINT
# ==========================
if __name__ == "__main__":
    ensure_indexes()
    upload_embeddings()
