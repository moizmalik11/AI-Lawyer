"""
Script Name: chunk_files.py
Purpose: Scan all JSON files in data/chunks/. If a JSON file is empty (i.e., {}),
         read the corresponding cleaned text file from data/cleaned/ and generate
         overlapping text chunks, then write them back to the JSON file.
Author: AI-Based Smart Lawyer (Data Preparation - Chunking Phase)
"""

import os
import json
import math
from pathlib import Path


# === CONFIG ===
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # AI-Lawyer root
CHUNKS_DIR = BASE_DIR / "data" / "chunks"
CLEANED_DIR = BASE_DIR / "data" / "cleaned"

# Threshold (in characters) to decide if a file is "big"
BIG_FILE_THRESHOLD = 15000  # ~15KB of text
# Chunk sizes (in approximate character count, not tokens)
SMALL_FILE_CHUNK_SIZE = 500
BIG_FILE_CHUNK_SIZE = 1000
# Overlap percentage
OVERLAP_PERCENT = 0.20  # 20% overlap

SUPREMECOURT_FOLDER = "supremecourt-judgments"


# === HELPER FUNCTIONS ===

def is_empty_json(filepath):
    """Check if a JSON file is empty (contains {} or is very small)."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Empty if it's an empty dict or has no 'chunks' key with content
            if isinstance(data, dict):
                if not data:  # {} case
                    return True
                if "chunks" in data and len(data["chunks"]) > 0:
                    return False  # Already has chunks
            return True
    except (json.JSONDecodeError, Exception):
        return True


def find_cleaned_file(json_filepath):
    """
    Given a JSON file path in data/chunks/<subfolder>/filename.json,
    find the corresponding .txt file in data/cleaned/<subfolder>/filename.txt.
    """
    rel_path = json_filepath.relative_to(CHUNKS_DIR)
    # Change extension from .json to .txt
    txt_rel_path = rel_path.with_suffix(".txt")
    cleaned_path = CLEANED_DIR / txt_rel_path

    if cleaned_path.exists():
        return cleaned_path

    # If direct match fails, try to find by stem name in the same subfolder
    subfolder = rel_path.parent
    stem = rel_path.stem
    cleaned_subfolder = CLEANED_DIR / subfolder

    if cleaned_subfolder.exists():
        for f in cleaned_subfolder.iterdir():
            if f.is_file() and f.stem == stem:
                return f

    return None


def get_document_type(json_filepath):
    """Determine document type based on folder structure."""
    rel_path = json_filepath.relative_to(CHUNKS_DIR)
    parts = rel_path.parts

    if len(parts) >= 1 and parts[0] == SUPREMECOURT_FOLDER:
        return "judgement"
    return "act"


def create_chunks(text, chunk_size, overlap_percent):
    """
    Split text into overlapping chunks.
    
    Args:
        text: The full text to chunk
        chunk_size: Target size of each chunk in characters
        overlap_percent: Fraction of overlap between chunks (0.15 to 0.20)
    
    Returns:
        List of text chunks
    """
    if not text or not text.strip():
        return []

    text = text.strip()
    text_length = len(text)

    # If text is smaller than chunk_size, return as single chunk
    if text_length <= chunk_size:
        return [text]

    stride = int(chunk_size * (1 - overlap_percent))
    if stride <= 0:
        stride = 1

    chunks = []
    start = 0

    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk_text = text[start:end]

        # Try to break at a natural boundary (newline, period, or space)
        # Only if we're not at the end of the text
        if end < text_length:
            # Look backwards from end for a good break point
            # Try newline first (best for legal text with sections)
            last_newline = chunk_text.rfind("\n", int(len(chunk_text) * 0.7))
            if last_newline != -1:
                chunk_text = chunk_text[:last_newline + 1]
                end = start + last_newline + 1
            else:
                # Try period followed by space
                last_period = chunk_text.rfind(". ", int(len(chunk_text) * 0.7))
                if last_period != -1:
                    chunk_text = chunk_text[:last_period + 2]
                    end = start + last_period + 2
                else:
                    # Try space
                    last_space = chunk_text.rfind(" ", int(len(chunk_text) * 0.8))
                    if last_space != -1:
                        chunk_text = chunk_text[:last_space + 1]
                        end = start + last_space + 1

        chunk_text = chunk_text.strip()
        if chunk_text:
            chunks.append(chunk_text)

        # Move start forward by stride
        next_start = start + stride
        # But also ensure we move at least past the overlap
        if next_start <= start:
            next_start = start + 1
        start = next_start

        # If the remaining text is very small, absorb it into the last chunk
        if text_length - start < chunk_size * 0.3 and start < text_length:
            remaining = text[start:].strip()
            if remaining and chunks:
                # Append remaining to last chunk or add as final chunk
                chunks.append(remaining)
            elif remaining:
                chunks.append(remaining)
            break

    return chunks


def get_chunk_type(index, is_judgement):
    """Get the chunk_type string based on position and document type."""
    if index == 0:
        return "preamble and introduction"
    if is_judgement:
        return "part"
    return "section"


def get_chunk_title(index, is_judgement):
    """Get the chunk_title string based on position and document type."""
    if index == 0:
        return "preamble and introduction"
    if is_judgement:
        return f"part {index}"
    return f"section {index}"


def process_file(json_filepath):
    """Process a single JSON file: read cleaned text, chunk it, write back."""
    # Find corresponding cleaned text file
    cleaned_path = find_cleaned_file(json_filepath)
    if cleaned_path is None:
        print(f"  ⚠️  No cleaned file found for: {json_filepath.name}")
        return False

    # Read the cleaned text
    try:
        with open(cleaned_path, "r", encoding="utf-8") as f:
            text = f.read()
    except Exception as e:
        print(f"  ❌ Error reading {cleaned_path}: {e}")
        return False

    if not text.strip():
        print(f"  ⚠️  Cleaned file is empty: {cleaned_path.name}")
        return False

    # Determine document type
    doc_type = get_document_type(json_filepath)
    is_judgement = doc_type == "judgement"

    # Determine chunk size based on file size
    text_length = len(text)
    if text_length > BIG_FILE_THRESHOLD:
        chunk_size = BIG_FILE_CHUNK_SIZE
    else:
        chunk_size = SMALL_FILE_CHUNK_SIZE

    # Create chunks with overlap
    text_chunks = create_chunks(text, chunk_size, OVERLAP_PERCENT)

    if not text_chunks:
        print(f"  ⚠️  No chunks generated for: {json_filepath.name}")
        return False

    # Build the relative paths for the JSON output
    cleaned_rel_path = str(cleaned_path.relative_to(BASE_DIR)).replace("/", "\\")
    chunked_rel_path = str(json_filepath.relative_to(BASE_DIR)).replace("/", "\\")

    # Build chunks array
    chunks_data = []
    for i, chunk_text in enumerate(text_chunks):
        chunk_obj = {
            "chunk_index": i + 1,
            "text": chunk_text,
            "chunk_type": get_chunk_type(i, is_judgement),
            "chunk_title": get_chunk_title(i, is_judgement),
            "tokens": chunk_size
        }
        chunks_data.append(chunk_obj)

    # Build the final JSON structure
    output = {
        "cleaned_path": cleaned_rel_path,
        "chunked_path": chunked_rel_path,
        "document_type": doc_type,
        "chunks": chunks_data
    }

    # Write to JSON file
    try:
        with open(json_filepath, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"  ✅ Chunked: {json_filepath.name} → {len(text_chunks)} chunks (size={chunk_size}, type={doc_type})")
        return True
    except Exception as e:
        print(f"  ❌ Error writing {json_filepath}: {e}")
        return False


# === MAIN ===

def main():
    print("=" * 70)
    print("📦 AI-Lawyer Chunking Script")
    print(f"   Chunks Dir: {CHUNKS_DIR}")
    print(f"   Cleaned Dir: {CLEANED_DIR}")
    print(f"   Big File Threshold: {BIG_FILE_THRESHOLD} chars")
    print(f"   Small Chunk Size: {SMALL_FILE_CHUNK_SIZE} | Big Chunk Size: {BIG_FILE_CHUNK_SIZE}")
    print(f"   Overlap: {OVERLAP_PERCENT * 100:.0f}%")
    print("=" * 70)

    total_files = 0
    processed = 0
    skipped_already_chunked = 0
    skipped_no_cleaned = 0
    errors = 0

    # Walk through all JSON files in chunks directory
    for root, dirs, files in os.walk(CHUNKS_DIR):
        root_path = Path(root)
        subfolder = root_path.relative_to(CHUNKS_DIR)

        json_files = [f for f in files if f.endswith(".json")]
        if not json_files:
            continue

        print(f"\n📂 Processing folder: {subfolder}")

        for filename in sorted(json_files):
            total_files += 1
            json_filepath = root_path / filename

            # Check if JSON is empty
            if not is_empty_json(json_filepath):
                skipped_already_chunked += 1
                print(f"  ⏭️  Already chunked: {filename}")
                continue

            # Process the file
            success = process_file(json_filepath)
            if success:
                processed += 1
            else:
                errors += 1

    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print(f"   Total JSON files scanned: {total_files}")
    print(f"   Successfully chunked: {processed}")
    print(f"   Already had chunks (skipped): {skipped_already_chunked}")
    print(f"   Errors/Warnings: {errors}")
    print("=" * 70)


if __name__ == "__main__":
    main()
