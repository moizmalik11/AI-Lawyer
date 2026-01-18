/**
 * LLM Service
 * Handles interactions with OpenRouter API using Gemini 2.0 Flash
 */

import dotenv from 'dotenv';

dotenv.config();

// Collect all OpenRouter API keys from environment variables
const OPENROUTER_API_KEYS = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
].filter(key => key && key.trim() !== ''); // Remove undefined/empty keys

let currentKeyIndex = 0; // Track which key we're using

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Try different free models if one is rate-limited
const MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-4-maverick:free",
  // "google/gemini-2.0-flash-exp:free",
  // "meta-llama/llama-3.1-8b-instruct:free",
  // "deepseek/deepseek-chat-v3.1:free",
  // "google/gemini-flash-1.5:free"
];
const MODEL = process.env.OPENROUTER_MODEL || MODELS[0];

class LLMService {
  /**
   * Get the next available API key (with rotation)
   */
  getNextApiKey() {
    if (OPENROUTER_API_KEYS.length === 0) {
      throw new Error('No OpenRouter API keys configured in environment variables');
    }

    const key = OPENROUTER_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % OPENROUTER_API_KEYS.length;
    return key;
  }

  /**
   * Translate Urdu query to English for vector search
   * @param {string} query - The user's question (possibly in Urdu)
   * @returns {Promise<Object>} - Object containing {translatedQuery, isUrdu, originalQuery}
   */
  async translateQueryToEnglish(query) {
    try {
      console.log('🌐 Checking if query needs translation...');

      // Quick language detection
      const hasUrduScript = /[\u0600-\u06FF]/.test(query);
      const romanUrduIndicators = [
        'kya', 'hai', 'hain', 'ke', 'ki', 'ko', 'se', 'mein', 'par',
        'aur', 'ya', 'lekin', 'agar', 'to', 'ka', 'ye', 'wo',
        'mulazim', 'qanoon', 'haq', 'hakooq', 'tankhwa', 'chutti',
        'kaam', 'rozana', 'haftawar', 'mahana', 'saal', 'mazoor',
        'bataye', 'batao', 'kaise', 'kab', 'kahan', 'kyun', 'zyada',
        'auqaat', 'baligh', 'liye'
      ];

      const lowerQuery = query.toLowerCase();
      const hasRomanUrdu = romanUrduIndicators.some(word =>
        lowerQuery.split(/\s+/).includes(word)
      );

      const isUrdu = hasUrduScript || hasRomanUrdu;

      if (!isUrdu) {
        console.log('✅ Query appears to be in English, no translation needed');
        return {
          translatedQuery: query,
          isUrdu: false,
          originalQuery: query,
        };
      }

      console.log(`🔄 Query detected as ${hasUrduScript ? 'Urdu Script' : 'Roman Urdu'}, translating...`);

      // Try translation with API key rotation
      for (let attempt = 0; attempt < OPENROUTER_API_KEYS.length; attempt++) {
        const apiKey = this.getNextApiKey();

        try {
          const translationPrompt = `Translate this ${hasUrduScript ? 'Urdu' : 'Roman Urdu'} legal query to English. Preserve legal terminology. Return ONLY the English translation, no extra text.

Query: ${query}

English:`;

          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: MODELS[0],
              messages: [{ role: 'user', content: translationPrompt }],
              temperature: 0.3,
              max_tokens: 200,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            // If rate limited and we have more keys, try next key
            if (data.error?.code === 429 && attempt < OPENROUTER_API_KEYS.length - 1) {
              console.log(`⚠️ API key ${attempt + 1} rate-limited for translation, trying next key...`);
              continue;
            }
            throw new Error(data.error?.message || 'Translation API failed');
          }

          const translatedQuery = data.choices[0]?.message?.content?.trim() || query;

          console.log(`✅ Translation complete (using key ${attempt + 1}):`);
          console.log(`   Original: ${query}`);
          console.log(`   Translated: ${translatedQuery}`);

          return {
            translatedQuery,
            isUrdu: true,
            originalQuery: query,
          };
        } catch (error) {
          if (attempt === OPENROUTER_API_KEYS.length - 1) {
            throw error;
          }
          console.log(`⚠️ Translation attempt ${attempt + 1} failed, trying next key...`);
        }
      }

      // Fallback if all attempts failed
      console.log('⚠️ All translation attempts failed, using original query');
      return {
        translatedQuery: query,
        isUrdu: true,
        originalQuery: query,
      };
    } catch (error) {
      console.error('⚠️ Translation error:', error.message);
      return {
        translatedQuery: query,
        isUrdu: false,
        originalQuery: query,
      };
    }
  }

  /**
   * Generate a response using OpenRouter with fallback models and API key rotation
   * @param {string} userQuery - The user's question
   * @param {Array<Object>} context - Retrieved context chunks from vector DB
   * @returns {Promise<Object>} - The generated response and used source indices
   */
  async generateResponse(userQuery, context) {
    if (OPENROUTER_API_KEYS.length === 0) {
      throw new Error('No OpenRouter API keys configured in environment variables');
    }

    // Build context string from retrieved chunks
    const contextString = this.buildContextString(context);

    // Create the prompt with context and query
    const prompt = this.createPrompt(userQuery, contextString);

    // Try each model with all API keys before moving to next model
    for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
      const model = MODELS[modelIndex];
      console.log(`🔄 Trying Model ${modelIndex + 1}/${MODELS.length}: ${model}`);

      // For each model, try all available API keys
      for (let keyIndex = 0; keyIndex < OPENROUTER_API_KEYS.length; keyIndex++) {
        const apiKey = OPENROUTER_API_KEYS[keyIndex];

        try {
          console.log(`🔑 Using API Key ${keyIndex + 1}/${OPENROUTER_API_KEYS.length} with ${model}`);

          // Call OpenRouter API
          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert legal assistant specializing in Pakistani law. You provide accurate, helpful answers based on legal documents and precedents. CRITICAL: You MUST cite your sources using the format [Source 1], [Source 2], etc. whenever you reference information from the provided context. Always include source citations in your response.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            // If rate limited, try next API key for this model
            if (data.error?.code === 429) {
              if (keyIndex < OPENROUTER_API_KEYS.length - 1) {
                console.log(`⚠️ API key ${keyIndex + 1} rate-limited for ${model}, trying next key...`);
                continue;
              } else if (modelIndex < MODELS.length - 1) {
                console.log(`⚠️ All API keys rate-limited for ${model}, moving to next model...`);
                break; // Break out of key loop to try next model
              } else {
                throw new Error(`All models and API keys exhausted due to rate limits`);
              }
            }

            // For other errors
            if (keyIndex < OPENROUTER_API_KEYS.length - 1) {
              console.log(`⚠️ Error with ${model} (key ${keyIndex + 1}): ${data.error?.message || 'Unknown error'}, trying next key...`);
              continue;
            } else if (modelIndex < MODELS.length - 1) {
              console.log(`⚠️ All keys failed for ${model}, moving to next model...`);
              break;
            } else {
              throw new Error(`OpenRouter API error: ${data.error?.message || JSON.stringify(data)}`);
            }
          }

          // Extract the generated text
          const generatedText = data.choices[0]?.message?.content || 'No response generated';
          console.log(`✅ Successfully generated response with ${model} (API Key ${keyIndex + 1})`);

          // Extract which sources were actually used in the response
          const usedSources = this.extractUsedSources(generatedText, context.length);

          return {
            answer: generatedText,
            usedSources: usedSources
          };
        } catch (error) {
          // If this is the last key for the last model, throw the error
          if (modelIndex === MODELS.length - 1 && keyIndex === OPENROUTER_API_KEYS.length - 1) {
            console.error('❌ Error generating LLM response:', error);
            throw new Error(`LLM generation failed: ${error.message}`);
          }

          // Otherwise, try next key or model
          if (keyIndex < OPENROUTER_API_KEYS.length - 1) {
            console.log(`⚠️ Error with ${model} (key ${keyIndex + 1}): ${error.message}, trying next key...`);
          } else {
            console.log(`⚠️ All keys failed for ${model}, moving to next model...`);
            break;
          }
        }
      }
    }

    // If we get here, all models and keys failed
    throw new Error('All models and API keys exhausted without successful response');
  }

  /**
   * Extract which sources were actually cited in the LLM response
   * @param {string} response - The LLM's generated response
   * @param {number} totalSources - Total number of sources provided
   * @returns {Array<number>} - Array of source indices that were used (1-based)
   */
  extractUsedSources(response, totalSources) {
    const usedSources = new Set();

    // Look for patterns like [Source 1], [Source 2], etc.
    // This regex looks for [Source followed by optional whitespace and a number]
    const sourcePattern = /\[Source\s*(\d+)\]/gi;
    let match;

    while ((match = sourcePattern.exec(response)) !== null) {
      const sourceNum = parseInt(match[1]);
      if (sourceNum >= 1 && sourceNum <= totalSources) {
        usedSources.add(sourceNum);
      }
    }

    // If no sources were found, log a warning and return all sources as fallback
    if (usedSources.size === 0) {
      console.log('⚠️ No source citations found in LLM response. Returning all sources as fallback.');
      // Return all source indices as fallback
      return Array.from({ length: totalSources }, (_, i) => i + 1);
    }

    console.log(`✅ Found ${usedSources.size} cited sources: [${Array.from(usedSources).join(', ')}]`);

    // Convert Set to sorted array
    return Array.from(usedSources).sort((a, b) => a - b);
  }

  /**
   * Build context string from retrieved chunks
   * @param {Array<Object>} context - Retrieved context chunks
   * @returns {string} - Formatted context string
   */
  buildContextString(context) {
    if (!context || context.length === 0) {
      return 'No relevant context found.';
    }

    return context
      .map((item, index) => {
        return `
[Source ${index + 1}]
Title: ${item.title || 'Unknown'}
Year: ${item.year || 'N/A'}
Court: ${item.court || 'N/A'}
Document Type: ${item.document_type || 'N/A'}
Content: ${item.chunk}
---`;
      })
      .join('\n');
  }

  /**
   * Create a prompt combining context and user query
   * @param {string} userQuery - The user's question
   * @param {string} contextString - Formatted context
   * @returns {string} - Complete prompt
   */
  createPrompt(userQuery, contextString) {
    return `You are an expert (responding to end-user) AI Legal Advisor specializing in Pakistani law, with deep knowledge across multiple jurisdictions including Federal, Punjab, Sindh, Balochistan, and KPK legislation, as well as Supreme Court judgments and case law.

═══════════════════════════════════════════════════════════════
LEGAL DATABASE CONTEXT:
═══════════════════════════════════════════════════════════════
${contextString}

═══════════════════════════════════════════════════════════════
CLIENT'S LEGAL QUERY:
═══════════════════════════════════════════════════════════════
${userQuery}

═══════════════════════════════════════════════════════════════
YOUR EXPERT ANALYSIS FRAMEWORK:
═══════════════════════════════════════════════════════════════

🎯 RESPONSE GUIDELINES:

1. **LANGUAGE MATCHING - CRITICAL**
   - DETECT the language of the user's query first
   - If query is in ENGLISH → Respond ONLY in English
   - If query is in ROMAN URDU (Urdu written in English script like "kya", "hai", "aap", "mujhe", "chahiye") → Respond ONLY in Roman Urdu
   - If query is in URDU SCRIPT (اردو) → Respond ONLY in Urdu script
   - NEVER mix languages in your response - maintain consistency throughout
   - Examples of Roman Urdu: "qanoon kya kehta hai?", "mujhe employee rights ke baare mein bataye", "yeh act kis saal mein bana tha?"

2. **COMPREHENSIVE ANALYSIS**
   - Start with a actual concise answer to the core question
   - Provide detailed legal reasoning with step-by-step explanation
   - Reference specific sections, articles, or clauses from the provided sources
   - Explain the practical implications and real-world applications

3. **STRUCTURED PRESENTATION**
   - Use clear headings and bullet points for readability
   - Break down complex legal concepts into digestible parts
   - Present information in logical flow: Issue → Rule → Application → Conclusion

4. **AUTHORITATIVE CITATIONS - MANDATORY**
   - **CRITICAL**: You MUST cite sources using the exact format [Source 1], [Source 2], etc.
   - When referencing information from the context, always include the source number
   - Example: "According to the law [Source 1], employees are entitled to..."
   - Example: "The maximum working hours are specified [Source 3] as 48 hours per week."
   - You can provide additional details like Act name and section, but MUST include [Source X]
   - Quote exact legal text when it strengthens your answer
   - If you reference multiple sources in one statement, cite all: [Source 1] [Source 2]

5. **PRACTICAL GUIDANCE**
   - Explain how the law applies to the specific situation
   - Mention any exceptions, limitations, or special circumstances
   - Provide actionable insights where appropriate
   - Highlight important legal procedures or requirements

6. **TRANSPARENCY & LIMITATIONS**
   - If the provided context is insufficient, clearly state what additional information would be needed
   - Acknowledge any ambiguities in the law or interpretation
   - Recommend consulting a qualified lawyer for complex cases or final legal decisions
   - Never fabricate information not present in the context

7. **ENHANCED READABILITY**
   - Use emojis sparingly for section markers (⚖️ 📋 ⚠️ 💡) to improve visual organization
   - Employ bold and formatting for key terms and important points
   - Keep paragraphs concise and focused

═══════════════════════════════════════════════════════════════
YOUR EXPERT LEGAL RESPONSE:
═══════════════════════════════════════════════════════════════`;
  }

  //   createPrompt(userQuery, contextString) {
  //     return `You are a bilingual (English and Urdu) AI legal assistant. Based on the following legal documents and context, please answer the user's question accurately and professionally.

  // CONTEXT FROM LEGAL DOCUMENTS:
  // ${contextString}

  // USER QUESTION:
  // ${userQuery}

  // INSTRUCTIONS:
  // - Provide a clear, accurate answer based on the context provided
  // - Cite specific sources when making legal references
  // - If the context doesn't contain enough information, acknowledge this
  // - Use professional legal language but keep it understandable
  // - If applicable, mention relevant sections, acts, or case names

  // ANSWER:`;
  //   }
  /**
   * Generate a summary for a given text (judgment or contract)
   * @param {string} text - The text to summarize
   * @param {string} type - 'judgment' or 'contract'
   * @returns {Promise<string>} - The generated summary
   */
  async generateSummary(text, type = 'judgment') {
    if (OPENROUTER_API_KEYS.length === 0) {
      throw new Error('No OpenRouter API keys configured in environment variables');
    }

    let prompt;
    if (type === 'judgment') {
      prompt = `Please provide a complete, detailed, and self-explanatory summary of the following legal judgment. 
      Structure the summary with the following sections:
      1. Case Title & Citation (if available)
      2. Facts of the Case
      3. Issues Raised
      4. Arguments by Petitioner
      5. Arguments by Respondent
      6. Court's Reasoning
      7. Final Decision/Order
      8. Key Legal Principles Established

      Judgment Text:
      ${text.substring(0, 15000)}... (truncated if too long)`;
    } else {
      prompt = `Please provide a complete, detailed, and self-explanatory summary of the following legal contract.
      Also provide useful insights including potential loopholes and risks.
      Structure the summary with the following sections:
      1. Contract Overview (Parties, Purpose)
      2. Key Terms & Conditions
      3. Obligations of Each Party
      4. Payment/Consideration Details
      5. Termination Clauses
      6. Dispute Resolution Mechanism
      7. ⚠️ Potential Loopholes & Risks (Critical Analysis)
      8. Recommendations

      Contract Text:
      ${text.substring(0, 15000)}... (truncated if too long)`;
    }

    // Try each model with all API keys
    for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
      const model = MODELS[modelIndex];

      for (let keyIndex = 0; keyIndex < OPENROUTER_API_KEYS.length; keyIndex++) {
        const apiKey = OPENROUTER_API_KEYS[keyIndex];

        try {
          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert legal assistant specializing in summarizing complex legal documents.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (data.error?.code === 429 && keyIndex < OPENROUTER_API_KEYS.length - 1) continue;
            if (keyIndex < OPENROUTER_API_KEYS.length - 1) continue;
            if (modelIndex < MODELS.length - 1) break;
            throw new Error(data.error?.message || 'Summarization failed');
          }

          return data.choices[0]?.message?.content || 'No summary generated';
        } catch (error) {
          if (modelIndex === MODELS.length - 1 && keyIndex === OPENROUTER_API_KEYS.length - 1) {
            throw error;
          }
        }
      }
    }
    throw new Error('Failed to generate summary');
  }
}

export default new LLMService();
