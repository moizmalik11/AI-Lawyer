import os
import json
import pymongo
from dotenv import load_dotenv
from datetime import datetime
import sys

# Set up paths
# Script location: d:\HSB\IBA\FYP\AI-Lawyer\preprocessing\src\text_cleaning
# Project root: d:\HSB\IBA\FYP\AI-Lawyer
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..', '..', '..'))
PREPROCESSING_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..'))
METADATA_PATH = os.path.join(PROJECT_ROOT, 'AI-Lawyer', 'data', 'metadata', 'documents_metadata.json')
ENV_PATH = os.path.join(PREPROCESSING_DIR, '.env')

# Load environment variables
print(f"Loading environment variables from {ENV_PATH}")
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGO_URI')
if not MONGODB_URI:
    print("Error: MONGO_URI not found in .env file")
    sys.exit(1)

DB_NAME = 'AILawyerDB'
COLLECTION_NAME = 'judgments'

def connect_to_db():
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print(f"Connected to MongoDB: {DB_NAME}.{COLLECTION_NAME}")
        return collection
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

def load_metadata():
    if not os.path.exists(METADATA_PATH):
        print(f"Error: Metadata file not found at {METADATA_PATH}")
        sys.exit(1)
    
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('documents', [])
    except Exception as e:
        print(f"Error reading metadata: {e}")
        sys.exit(1)

def get_full_text(cleaned_path_rel):
    # cleaned_path in metadata is relative to project root, e.g., "data\cleaned\..."
    # We need to construct the absolute path
    # Note: The metadata might use backslashes or forward slashes
    
    # Normalize path separators
    normalized_path = cleaned_path_rel.replace('\\', os.sep).replace('/', os.sep)
    
    # Construct absolute path
    # PROJECT_ROOT is d:\HSB\IBA\FYP
    # But the metadata path starts with "data", so we join with AI-Lawyer folder
    full_path = os.path.join(PROJECT_ROOT, 'AI-Lawyer', normalized_path)
    
    if not os.path.exists(full_path):
        # Try alternative path construction if the first one fails
        # Maybe PROJECT_ROOT already includes AI-Lawyer?
        # Let's check the PROJECT_ROOT definition again.
        # If script is in ...\AI-Lawyer\preprocessing\src\text_cleaning
        # Then ...\..\..\.. is ...\AI-Lawyer
        # So PROJECT_ROOT is d:\HSB\IBA\FYP\AI-Lawyer
        
        # Let's try joining directly
        full_path = os.path.join(PROJECT_ROOT, normalized_path)
        
        if not os.path.exists(full_path):
            print(f"Warning: File not found at {full_path}")
            return None

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {full_path}: {e}")
        return None

def process_and_upload():
    collection = connect_to_db()
    documents = load_metadata()
    
    print(f"Found {len(documents)} total documents in metadata")
    
    # Filter for judgments
    # We assume documents from 'supremecourt' are judgments
    # We can also check for 'judgment' in content_type if available
    judgment_docs = [
        doc for doc in documents 
        if doc.get('source_website') == 'supremecourt' or 
           'judgment' in str(doc.get('content_type', '')).lower() or
           'judgment' in str(doc.get('title', '')).lower()
    ]
    
    print(f"Filtered {len(judgment_docs)} judgment documents")
    
    count = 0
    updated = 0
    skipped = 0
    
    for doc in judgment_docs:
        cleaned_path = doc.get('cleaned_path')
        if not cleaned_path:
            print(f"Skipping {doc.get('id')}: No cleaned_path")
            continue
            
        full_text = get_full_text(cleaned_path)
        
        if full_text:
            # Prepare document for MongoDB
            mongo_doc = doc.copy()
            mongo_doc['full_text'] = full_text
            mongo_doc['uploaded_at'] = datetime.utcnow()
            
            # Upsert based on ID
            result = collection.update_one(
                {'id': doc['id']},
                {'$set': mongo_doc},
                upsert=True
            )
            
            if result.upserted_id:
                count += 1
                print(f"Inserted: {doc.get('title')}")
            elif result.modified_count > 0:
                updated += 1
                print(f"Updated: {doc.get('title')}")
            else:
                skipped += 1
                # print(f"Skipped (No changes): {doc.get('title')}")
        else:
            print(f"Skipping {doc.get('id')}: Could not read text file")

    print(f"\nUpload Complete.")
    print(f"Inserted: {count}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")

if __name__ == "__main__":
    process_and_upload()
