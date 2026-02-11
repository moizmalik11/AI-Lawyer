/**
 * RAG Service
 * Orchestrates the RAG (Retrieval-Augmented Generation) pipeline
 * Combines embedding generation, vector search, and LLM generation
 * 
 * Enhanced with:
 * - Query Expansion: Generates alternative phrasings for better recall
 * - Multi-Query Retrieval: Searches with multiple query variants
 * - Reciprocal Rank Fusion (RRF): Combines results from multiple queries
 */

import embeddingService from './embeddingService.js';
import qdrantService from './qdrantService.js';
import llmService from './llmService.js';

// Configuration for enhanced retrieval
const ENABLE_MULTI_QUERY = true; // Toggle for multi-query retrieval
const NUM_QUERY_VARIANTS = 3; // Number of alternative queries to generate
const RRF_K = 60; // RRF constant (higher = more weight to lower-ranked results)
const CHUNKS_PER_QUERY = 30; // Chunks to retrieve per query variant

class RAGService {
  /**
   * Expand a query into multiple alternative phrasings using LLM
   * @param {string} query - The original query
   * @returns {Promise<string[]>} - Array of query variants (including original)
   */
  async expandQuery(query) {
    try {
      console.log('🔄 Expanding query into multiple variants...');

      // Simple, direct prompt that encourages SHORT responses
      const expansionPrompt = `Rewrite this query ${NUM_QUERY_VARIANTS} different ways using legal synonyms. Keep each under 15 words.

"${query}"

JSON array only: ["rewrite1", "rewrite2", "rewrite3"]`;

      const messages = [{ role: 'user', content: expansionPrompt }];

      const response = await llmService.callGeminiAPI(messages, 0.3, 800);

      // Parse the JSON response with multiple fallback strategies
      let variants = [];
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanResponse = response.trim();

        // Remove markdown code blocks
        cleanResponse = cleanResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        // Try to find and extract the JSON array
        const arrayMatch = cleanResponse.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          cleanResponse = arrayMatch[0];
        }

        // Fix incomplete JSON - if it doesn't end with ], try to close it
        if (!cleanResponse.endsWith(']')) {
          // Find the last complete string and close the array
          const lastQuoteIndex = cleanResponse.lastIndexOf('"');
          if (lastQuoteIndex > 0) {
            cleanResponse = cleanResponse.substring(0, lastQuoteIndex + 1) + ']';
          }
        }

        variants = JSON.parse(cleanResponse);

        if (!Array.isArray(variants)) {
          throw new Error('Response is not an array');
        }

        // Filter out any non-string or empty entries
        variants = variants.filter(v => typeof v === 'string' && v.trim().length > 0);

      } catch (parseError) {
        // Fallback: Try to extract any quoted strings from the response
        console.log('⚠️ JSON parse failed, trying regex extraction...');
        const quotedStrings = response.match(/"([^"]+)"/g);
        if (quotedStrings && quotedStrings.length > 0) {
          variants = quotedStrings
            .map(s => s.replace(/"/g, '').trim())
            .filter(s => s.length > 5 && s.length < 200); // Filter reasonable lengths
          console.log(`   Extracted ${variants.length} variants via regex`);
        } else {
          console.log('⚠️ Failed to parse query expansion response, using original query only');
          console.log('   Raw response:', response.substring(0, 200));
          return [query];
        }
      }

      // Always include the original query first
      const allQueries = [query, ...variants.slice(0, NUM_QUERY_VARIANTS)];

      console.log(`✅ Generated ${allQueries.length} query variants:`);
      allQueries.forEach((q, i) => console.log(`   ${i + 1}. ${q.substring(0, 80)}${q.length > 80 ? '...' : ''}`));

      return allQueries;

    } catch (error) {
      console.log('⚠️ Query expansion failed, using original query:', error.message);
      return [query];
    }
  }

  /**
   * Perform multi-query retrieval with Reciprocal Rank Fusion
   * @param {string[]} queries - Array of query variants
   * @returns {Promise<Array>} - Combined and ranked chunks
   */
  async multiQueryRetrieval(queries) {
    console.log(`🔎 Performing multi-query retrieval with ${queries.length} variants...`);

    // Generate embeddings for all queries in parallel
    console.log('📊 Generating embeddings for all query variants...');
    const embeddings = await Promise.all(
      queries.map(q => embeddingService.generateEmbedding(q))
    );

    // Search with each embedding in parallel
    console.log('🔍 Searching with each query variant...');
    const allResults = await Promise.all(
      embeddings.map(emb => qdrantService.searchSimilar(emb, CHUNKS_PER_QUERY))
    );

    // Apply Reciprocal Rank Fusion (RRF) to combine results
    console.log('🔀 Applying Reciprocal Rank Fusion...');
    const rrfScores = new Map(); // id -> RRF score
    const chunkData = new Map(); // id -> chunk data

    allResults.forEach((results, queryIndex) => {
      results.forEach((result, rank) => {
        const id = result.id;

        // RRF formula: 1 / (k + rank)
        const rrfScore = 1 / (RRF_K + rank + 1);

        // Accumulate RRF scores across all query variants
        const currentScore = rrfScores.get(id) || 0;
        rrfScores.set(id, currentScore + rrfScore);

        // Store chunk data (keep the one with highest original score)
        if (!chunkData.has(id) || chunkData.get(id).score < result.score) {
          chunkData.set(id, result);
        }
      });
    });

    // Convert to array, sort by RRF score, and attach the score
    const combinedResults = Array.from(rrfScores.entries())
      .map(([id, rrfScore]) => {
        const chunk = chunkData.get(id);
        return {
          ...chunk,
          rrf_score: rrfScore,
          // Normalize RRF score to 0-1 range for display (max possible = queries.length / (k+1))
          score: chunk.score, // Keep original vector similarity score
          combined_score: rrfScore / (queries.length / (RRF_K + 1)) // Normalized RRF
        };
      })
      .sort((a, b) => b.rrf_score - a.rrf_score);

    console.log(`✅ Combined ${combinedResults.length} unique chunks from ${queries.length} queries`);

    // Log top 5 RRF scores
    console.log('📊 Top 5 RRF scores:');
    combinedResults.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. RRF: ${c.rrf_score.toFixed(4)}, Vector: ${c.score.toFixed(4)} - ${(c.title || 'Unknown').substring(0, 50)}`);
    });

    return combinedResults;
  }

  /**
   * Process a user query using enhanced RAG pipeline
   * @param {string} query - The user's question
   * @param {number} topK - Number of relevant chunks to retrieve (default: 5)
   * @returns {Promise<Object>} - Response with answer and sources
   */
  async processQuery(query, topK = 5) {
    try {
      console.log('🔍 Processing query:', query);

      // Step 1: Translate query to English if it's in Urdu (for embedding and search)
      console.log('🌐 Translating query if needed...');
      const translationResult = await llmService.translateQueryToEnglish(query);
      const queryForEmbedding = translationResult.translatedQuery;
      const originalQuery = translationResult.originalQuery;

      if (translationResult.isUrdu) {
        console.log('📝 Detected Urdu query, using translated version for search');
      }

      let initialChunks;
      let retrievalMetadata = {};

      // Step 2: Enhanced retrieval with query expansion and multi-query
      if (ENABLE_MULTI_QUERY) {
        // Step 2a: Expand query into multiple variants
        const queryVariants = await this.expandQuery(queryForEmbedding);

        // Step 2b: Perform multi-query retrieval with RRF
        initialChunks = await this.multiQueryRetrieval(queryVariants);

        retrievalMetadata = {
          multi_query_enabled: true,
          query_variants: queryVariants.length,
          queries_used: queryVariants
        };
      } else {
        // Fallback to single query retrieval
        console.log('📊 Generating query embedding...');
        const queryEmbedding = await embeddingService.generateEmbedding(queryForEmbedding);

        console.log('🔎 Searching for relevant legal documents...');
        initialChunks = await qdrantService.searchSimilar(queryEmbedding, 50);

        retrievalMetadata = {
          multi_query_enabled: false
        };
      }

      // Step 3: Apply dynamic filtering based on score threshold
      let relevantChunks = this.filterChunksByScore(initialChunks, topK);

      if (relevantChunks.length === 0) {
        return {
          answer: 'I apologize, but I could not find relevant legal documents to answer your question. Please try rephrasing your query or ask about a different legal topic.',
          sources: [],
          query: originalQuery,
        };
      }

      console.log(`✅ Found ${relevantChunks.length} relevant chunks`);

      // Log max and min relevance scores of chunks being sent to LLM
      const maxScore = relevantChunks[0].score; // First chunk has highest score
      const minScore = relevantChunks[relevantChunks.length - 1].score; // Last chunk has lowest score
      console.log(`📊 Relevance Score Range → Max: ${maxScore.toFixed(4)}, Min: ${minScore.toFixed(4)}`);

      // Step 4: Generate response using LLM with context - USE ORIGINAL QUERY
      console.log('🤖 Generating response with LLM using original query...');
      const llmResult = await llmService.generateResponse(originalQuery, relevantChunks);
      const answer = llmResult.answer;
      const usedSourceIndices = llmResult.usedSources;

      console.log(`📚 LLM used ${usedSourceIndices.length} out of ${relevantChunks.length} sources`);
      console.log(`🔍 Used Source Indices: ${JSON.stringify(usedSourceIndices)}`);

      // Step 4a: Re-map source citations in the answer to match the filtered list
      // The LLM cites sources using original indices (e.g., [Source 15]), but we only return
      // the used sources to the frontend, which will display them as [1], [2], etc.
      // We need to update the text to match these new indices.

      let finalAnswer = answer;
      const indexMap = new Map();

      // Create mapping from Original Index -> New Index (1-based)
      usedSourceIndices.forEach((originalIndex, i) => {
        const newIndex = i + 1;
        indexMap.set(originalIndex, newIndex);
      });

      console.log('🗺️ Index Map:', Object.fromEntries(indexMap));

      // Replace citations in the text using a single-pass regex
      // This handles all occurrences and avoids double-replacement issues
      finalAnswer = finalAnswer.replace(/\[Source\s*(\d+)\]/g, (match, capturedNum) => {
        const originalIndex = parseInt(capturedNum, 10);
        if (indexMap.has(originalIndex)) {
          return `[Source ${indexMap.get(originalIndex)}]`;
        }
        // If the source index is not in our used list (e.g. out of bounds or hallucinated),
        // we leave it as is.
        return match;
      });

      // Step 5: Prepare sources for citation - only include sources that were actually used
      const sources = relevantChunks
        .map((chunk, index) => ({ chunk, originalIndex: index + 1 }))
        .filter(({ originalIndex }) => usedSourceIndices.includes(originalIndex))
        .map(({ chunk, originalIndex }) => {
          const source = {
            // Reference Information - keep the original index so it matches citations in the answer
            index: originalIndex,
            relevance_score: parseFloat(chunk.score.toFixed(4)),
            rrf_score: chunk.rrf_score ? parseFloat(chunk.rrf_score.toFixed(4)) : undefined,

            // Document Details
            title: chunk.chunk_title || chunk.title || 'Unknown Source', // Top level title for frontend
            section: chunk.chunk_type, // Use chunk_type as section/type

            document: {
              title: chunk.title,
              type: chunk.document_type,
              year: chunk.year,
            },

            // chunk Information
            chunk: {
              title: chunk.chunk_title || 'N/A',
              type: chunk.chunk_type || 'N/A',
              text: chunk.chunk, // Full chunk text for modal
            },

            // Source Links
            links: {},
          };

          // Add optional fields only if they exist
          if (chunk.court) {
            source.document.court = chunk.court;
          }

          if (chunk.source_url) {
            source.links.document_url = chunk.source_url;
          }

          if (chunk.source_page) {
            source.links.source_page = chunk.source_page;
          }

          return source;
        });

      console.log('✅ Response generated successfully');

      return {
        answer: finalAnswer,
        sources,
        query: originalQuery,
        metadata: {
          chunks_retrieved: relevantChunks.length,
          chunks_used: usedSourceIndices.length,
          model: 'google/gemini-2.0-flash-exp:free',
          embedding_model: 'sentence-transformers/all-mpnet-base-v2',
          query_translated: translationResult.isUrdu,
          query_for_search: translationResult.isUrdu ? queryForEmbedding : undefined,
          ...retrievalMetadata
        },
      };
    } catch (error) {
      console.error('❌ Error in RAG pipeline:', error);
      throw new Error(`RAG processing failed: ${error.message}`);
    }
  }

  /**
   * Validate query before processing
   * @param {string} query - The user's question
   * @returns {Object} - Validation result
   */
  validateQuery(query) {
    if (!query || typeof query !== 'string') {
      return {
        valid: false,
        error: 'Query must be a non-empty string',
      };
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      return {
        valid: false,
        error: 'Query cannot be empty',
      };
    }

    if (trimmedQuery.length < 3) {
      return {
        valid: false,
        error: 'Query is too short (minimum 3 characters)',
      };
    }

    if (trimmedQuery.length > 1000) {
      return {
        valid: false,
        error: 'Query is too long (maximum 1000 characters)',
      };
    }

    return {
      valid: true,
      query: trimmedQuery,
    };
  }

  /**
   * Filter chunks by multiple criteria (ANY match includes the chunk)
   * A chunk is included if it meets ANY of these criteria:
   * 1. Is in the top 10 chunks (minimum guarantee)
   * 2. Score > (highest_score - 0.1)
   * 3. Score > average score of all retrieved chunks
   * 4. Score > 0.5 (absolute threshold)
   * @param {Array} chunks - Array of chunks with scores
   * @param {number} minChunks - Minimum number of chunks to return (default: 10)
   * @returns {Array} - Filtered chunks
   */
  filterChunksByScore(chunks, minChunks = 10) {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    // If we have fewer than minChunks, return all
    if (chunks.length <= minChunks) {
      console.log(`📊 Retrieved ${chunks.length} chunks (less than minimum ${minChunks})`);
      return chunks;
    }

    // Calculate thresholds
    const highestScore = chunks[0].score;
    const relativeThreshold = highestScore - 0.1;

    // Calculate average score
    const averageScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;

    const absoluteThreshold = 0.5;

    console.log(`📊 Score Analysis:`);
    console.log(`   • Highest: ${highestScore.toFixed(4)}`);
    console.log(`   • Average: ${averageScore.toFixed(4)}`);
    console.log(`   • Relative Threshold (highest - 0.1): ${relativeThreshold.toFixed(4)}`);
    console.log(`   • Absolute Threshold: ${absoluteThreshold.toFixed(4)}`);

    // Filter chunks based on multiple criteria (OR logic)
    const filteredChunks = chunks.filter((chunk, index) => {
      const isTopN = index < minChunks; // Criterion 1: Top N
      const meetsRelativeThreshold = chunk.score > relativeThreshold; // Criterion 2
      const meetsAverageThreshold = chunk.score > averageScore; // Criterion 3
      const meetsAbsoluteThreshold = chunk.score > absoluteThreshold; // Criterion 4

      return isTopN || meetsRelativeThreshold || meetsAverageThreshold || meetsAbsoluteThreshold;
    });

    // Count how many chunks met each criterion
    const criteriaStats = {
      topN: chunks.slice(0, minChunks).length,
      relativeThreshold: chunks.filter(c => c.score > relativeThreshold).length,
      averageThreshold: chunks.filter(c => c.score > averageScore).length,
      absoluteThreshold: chunks.filter(c => c.score > absoluteThreshold).length,
    };

    console.log(`📊 Chunks meeting each criterion:`);
    console.log(`   • Top ${minChunks}: ${criteriaStats.topN}`);
    console.log(`   • Score > ${relativeThreshold.toFixed(4)}: ${criteriaStats.relativeThreshold}`);
    console.log(`   • Score > ${averageScore.toFixed(4)} (avg): ${criteriaStats.averageThreshold}`);
    console.log(`   • Score > ${absoluteThreshold}: ${criteriaStats.absoluteThreshold}`);
    console.log(`📊 Final result: ${chunks.length} chunks → ${filteredChunks.length} chunks selected`);

    return filteredChunks;
  }
}

export default new RAGService();
