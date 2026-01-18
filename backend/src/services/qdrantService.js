/**
 * Qdrant Service
 * Handles vector search operations with Qdrant database
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import { Embeddings } from '../models/index.js';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'Embeddings';

class QdrantService {
  constructor() {
    // Initialize Qdrant client
    this.client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
    this.collectionName = QDRANT_COLLECTION;
  }

  /**
   * Search for similar vectors in Qdrant with optional filters
   * @param {Array<number>} queryVector - The embedding vector of the user query
   * @param {number} limit - Number of results to return
   * @param {Object} filters - Optional filters (e.g., { document_type: 'act', year: 2023 })
   * @returns {Promise<Array>} - Array of search results with payload and MongoDB metadata
   */
  async searchSimilar(queryVector, limit = 5, filters = {}) {
    try {
      // Construct Qdrant filter
      let qdrantFilter = null;

      if (Object.keys(filters).length > 0) {
        const mustConditions = [];

        if (filters.document_type) {
          mustConditions.push({
            key: 'document_type',
            match: { value: filters.document_type }
          });
        }

        if (filters.year) {
          mustConditions.push({
            key: 'year',
            match: { value: parseInt(filters.year) }
          });
        }

        if (filters.court) {
          mustConditions.push({
            key: 'court',
            match: { value: filters.court }
          });
        }

        if (filters.source_website) {
          mustConditions.push({
            key: 'source_website',
            match: { value: filters.source_website }
          });
        }

        if (mustConditions.length > 0) {
          qdrantFilter = {
            must: mustConditions
          };
        }
      }

      const searchParams = {
        vector: queryVector,
        limit: limit,
        with_payload: true,
      };

      if (qdrantFilter) {
        searchParams.filter = qdrantFilter;
      }

      const searchResult = await this.client.search(this.collectionName, searchParams);

      // Extract IDs from Qdrant results
      const resultIds = searchResult.map(result => result.id);

      // Fetch full metadata from MongoDB
      const mongoMetadata = await Embeddings.find({
        id: { $in: resultIds }
      }).lean();

      // Create a map for quick lookup
      const metadataMap = new Map(
        mongoMetadata.map(doc => [doc.id, doc])
      );

      // Merge Qdrant results with MongoDB metadata
      const results = searchResult.map(result => {
        const mongoDoc = metadataMap.get(result.id);

        return {
          // Qdrant data
          id: result.id,
          score: result.score,
          chunk: result.payload.chunk,

          // MongoDB metadata (full details)
          title: mongoDoc?.title || result.payload.title,
          year: mongoDoc?.year || result.payload.year,
          court: mongoDoc?.court || result.payload.court,
          document_type: mongoDoc?.document_type || result.payload.document_type,
          download_date: mongoDoc?.download_date || result.payload.download_date,

          // Additional metadata from MongoDB
          chunk_index: mongoDoc?.chunk_index,
          chunk_title: mongoDoc?.chunk_title,
          chunk_type: mongoDoc?.chunk_type,
          cleaned_path: mongoDoc?.cleaned_path,
          source_page: mongoDoc?.source_page,
          source_url: mongoDoc?.source_url,
          source_website: mongoDoc?.source_website,
        };
      });

      return results;
    } catch (error) {
      console.error('Error searching Qdrant:', error);
      throw new Error(`Qdrant search failed: ${error.message}`);
    }
  }

  /**
   * Test connection to Qdrant
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      await this.client.getCollections();
      console.log('✅ Successfully connected to Qdrant');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Qdrant:', error);
      return false;
    }
  }
}

export default new QdrantService();
