import os
import json
import numpy as np
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from pathlib import Path

# ==========================
# CONFIGURATION
# ==========================
# Load environment variables (expecting QDRANT_URL and QDRANT_API_KEY in .env)
# The .env file should be located in the preprocessing directory.
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "smartlawyer_embeddings")
MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
TOP_K = 5

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parents[2]  # Points to project root (AI-Lawyer)
TEST_DATA_PATH = BASE_DIR / "data" / "test" / "test_queries.json"

# ==========================
# INITIALIZE CLIENTS
# ==========================
print("🔗 Initializing models and connecting to Qdrant...")
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
model = SentenceTransformer(MODEL_NAME)

def evaluate_retrieval():
    if not TEST_DATA_PATH.exists():
        print(f"❌ Test queries file not found at: {TEST_DATA_PATH}")
        return

    with open(TEST_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    queries = data.get("test_queries", [])
    total_queries = len(queries)
    
    if total_queries == 0:
        print("❌ No test queries found in the file.")
        return

    print(f"🚀 Running evaluation on {total_queries} queries (Top-K = {TOP_K})...")
    print("ℹ️ Note: A chunk is considered 'relevant' if its source document title matches the query's expected document title.\n")

    recall_at_k_sum = 0
    precision_at_k_sum = 0
    mrr_sum = 0

    for i, q in enumerate(queries, 1):
        query_text = q.get("query", "")
        target_title = q.get("document_title", "")
        
        # Embed the query
        query_vec = model.encode(query_text, convert_to_numpy=True).tolist()
        
        # Search Qdrant
        try:
            results = qdrant.search(
                collection_name=QDRANT_COLLECTION,
                query_vector=query_vec,
                limit=TOP_K
            )
        except Exception as e:
            print(f"❌ Error querying Qdrant: {e}")
            return
            
        relevant_hits = 0
        first_relevant_rank = None
        
        # Evaluate retrieved chunks
        for rank, res in enumerate(results, 1):
            payload = res.payload or {}
            res_title = payload.get("title", "")
            
            # Check if this chunk belongs to the target document
            if res_title == target_title:
                relevant_hits += 1
                if first_relevant_rank is None:
                    first_relevant_rank = rank
                    
        # Calculate metrics for this specific query
        # 1. Recall@K: Did we find the target document at least once in the top K?
        doc_found = 1.0 if relevant_hits > 0 else 0.0
        recall_at_k_sum += doc_found
        
        # 2. Precision@K: What fraction of the retrieved chunks were from the target document?
        precision_at_k_sum += (relevant_hits / TOP_K)
        
        # 3. MRR: 1 / rank of the highest-ranked relevant chunk
        if first_relevant_rank is not None:
            mrr_sum += (1.0 / first_relevant_rank)

        # Print progress every 10 queries
        if i % 5 == 0 or i == total_queries:
            print(f"Processed {i}/{total_queries} queries...")

    # ==========================
    # AGGREGATE MATRICS
    # ==========================
    avg_recall = recall_at_k_sum / total_queries
    avg_precision = precision_at_k_sum / total_queries
    avg_mrr = mrr_sum / total_queries

    print("\n" + "="*80)
    print("📊 RETRIEVAL METRICS (VECTOR DATABASE PERFORMANCE)")
    print("="*80)
    print("These metrics tell you if your Qdrant search is fetching the right chunks of the law.")
    print(f"Evaluation based on {total_queries} queries, fetching Top {TOP_K} results each.\n")
    
    print(f"✅ Recall@{TOP_K}       : {avg_recall:.2%}")
    print("   -> What it means: Out of all your test questions, how often did the vector database")
    print(f"      manage to pull the correct legal chunk into its top {TOP_K} results?")
    print("   -> Why it matters: If the law is missing from the chunks sent to the LLM, the AI cannot")
    print("      answer correctly. A high Recall means finding the needle in the haystack.\n")
    
    print(f"🎯 Precision@{TOP_K}    : {avg_precision:.2%}")
    print(f"   -> What it means: When the database grabs {TOP_K} chunks to answer a query, how many of")
    print("      those chunks are actually relevant (belong to the correct legal document)?")
    print("   -> Why it matters: High precision means you are feeding the LLM a clean, highly")
    print("      focused context without 'noise', saving tokens and reducing hallucinations.\n")
    
    print(f"🏆 Mean Reciprocal Rank (MRR): {avg_mrr:.4f}")
    print("   -> What it means: How high up in the search results did the *best* chunk appear?")
    print("      Found at #1 gives score 1.0, found at #2 gives 0.5, etc.")
    print("   -> Why it matters: Evaluates ordering quality. You want the correct law not only")
    print("      to be found, but to be placed at the absolute top of the results.")
    print("="*80)

if __name__ == "__main__":
    evaluate_retrieval()
