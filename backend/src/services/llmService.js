/**
 * LLM Service
 * Handles interactions with Gemini API with fallback to OpenRouter
 * Priority: Gemini (all API keys) → OpenRouter (all API keys)
 * Automatically discovers all API keys matching patterns:
 *   - GEMINI_API_KEY, GEMINI_API_KEY_0, GEMINI_API_KEY_1, ...
 *   - OPENROUTER_API_KEY, OPENROUTER_API_KEY_0, OPENROUTER_API_KEY_1, ...
 * LLM_SERVICE=gemini → Try Gemini first, then fallback to OpenRouter
 * LLM_SERVICE=<anything else or missing> → Use OpenRouter directly (default)
 */

import dotenv from 'dotenv';

dotenv.config();

// LLM Service Toggle - 'gemini' uses Gemini API with fallback, anything else defaults to OpenRouter only
const LLM_SERVICE = process.env.LLM_SERVICE?.toLowerCase()?.trim() || 'openrouter';
const USE_GEMINI = LLM_SERVICE === 'gemini';

/**
 * Auto-discover all API keys matching a prefix pattern
 * Looks for: PREFIX, PREFIX_0, PREFIX_1, PREFIX_2, ... up to PREFIX_99
 * @param {string} prefix - The prefix to search for (e.g., 'GEMINI_API_KEY')
 * @returns {Array<string>} - Array of found API keys
 */
function discoverApiKeys(prefix) {
  const keys = [];

  // Check for base key without number (e.g., GEMINI_API_KEY)
  if (process.env[prefix] && process.env[prefix].trim() !== '') {
    keys.push(process.env[prefix]);
  }

  // Check for numbered keys (e.g., GEMINI_API_KEY_0, GEMINI_API_KEY_1, ...)
  for (let i = 0; i < 100; i++) {
    const key = process.env[`${prefix}_${i}`];
    if (key && key.trim() !== '') {
      keys.push(key);
    }
  }

  return keys;
}

// Gemini API Configuration - Multiple models and keys for fallback
const GEMINI_API_KEYS = discoverApiKeys('GEMINI_API_KEY');
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = [
  'gemini-2.5-flash',   // Primary: Gemini 2.5 Flash
  'gemini-3-flash',   // Fallback 1: Gemini 3 Flash
];

// Collect all OpenRouter API keys from environment variables
const OPENROUTER_API_KEYS = discoverApiKeys('OPENROUTER_API_KEY');

console.log(`🤖 LLM Service initialized with: ${USE_GEMINI ? 'GEMINI (with OpenRouter fallback)' : 'OPENROUTER'}`);
console.log(`   📊 Gemini API Keys: ${GEMINI_API_KEYS.length} found`);
console.log(`   📊 OpenRouter API Keys: ${OPENROUTER_API_KEYS.length} found`);

let currentOpenRouterKeyIndex = 0; // Track which OpenRouter key we're using

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Try different free models if one is rate-limited
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "arcee-ai/trinity-large-preview:free",
  "arcee-ai/trinity-mini:free",
  "tngtech/deepseek-r1t2-chimera:free",
  "tngtech/deepseek-r1t-chimera:free",
  "stepfun/step-3.5-flash:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-4-maverick:free",
];

// For backward compatibility
const MODELS = OPENROUTER_MODELS;

class LLMService {
  constructor() {
    this.useGemini = USE_GEMINI;
  }

  /**
   * Get the next available OpenRouter API key (with rotation)
   */
  getNextOpenRouterApiKey() {
    if (OPENROUTER_API_KEYS.length === 0) {
      throw new Error('No OpenRouter API keys configured in environment variables');
    }

    const key = OPENROUTER_API_KEYS[currentOpenRouterKeyIndex];
    currentOpenRouterKeyIndex = (currentOpenRouterKeyIndex + 1) % OPENROUTER_API_KEYS.length;
    return key;
  }

  // Alias for backward compatibility
  getNextApiKey() {
    return this.getNextOpenRouterApiKey();
  }

  /**
   * Call a specific Gemini model with a specific API key
   * @param {string} model - The Gemini model name
   * @param {string} apiKey - The Gemini API key to use
   * @param {Array} filteredContents - Formatted contents for Gemini API
   * @param {number} temperature - Temperature for generation
   * @param {number} maxTokens - Maximum tokens to generate
   * @returns {Promise<string>} - Generated text
   */
  async callSingleGeminiModel(model, apiKey, filteredContents, temperature, maxTokens) {
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: filteredContents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini ${model} error: ${JSON.stringify(data)}`);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  }

  /**
   * Call Gemini API with model and API key fallback chain
   * Priority: For each model, try all API keys before moving to next model
   * Model 1 + Key 1 → Model 1 + Key 2 → ... → Model 2 + Key 1 → Model 2 + Key 2 → ...
   * @param {Array} messages - Array of message objects with role and content
   * @param {number} temperature - Temperature for generation
   * @param {number} maxTokens - Maximum tokens to generate
   * @returns {Promise<string>} - Generated text
   */
  async callGeminiAPI(messages, temperature = 0.7, maxTokens = 2048) {
    if (GEMINI_API_KEYS.length === 0) {
      throw new Error('No Gemini API keys configured in environment variables');
    }

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Handle system message by prepending it to the first user message
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      const firstUserIdx = contents.findIndex(c => c.role === 'user');
      if (firstUserIdx !== -1) {
        contents[firstUserIdx].parts[0].text = `${systemMessage.content}\n\n${contents[firstUserIdx].parts[0].text}`;
      }
    }

    // Filter out system messages and ensure alternating user/model roles
    const filteredContents = contents.filter(c => {
      const originalMsg = messages.find(m => m.content === c.parts[0].text || c.parts[0].text.includes(m.content));
      return originalMsg?.role !== 'system';
    });

    // Try each Gemini model with all API keys before moving to next model
    const errors = [];
    for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
      const model = GEMINI_MODELS[modelIndex];
      console.log(`🔮 Trying Gemini model ${modelIndex + 1}/${GEMINI_MODELS.length}: ${model}`);

      for (let keyIndex = 0; keyIndex < GEMINI_API_KEYS.length; keyIndex++) {
        const apiKey = GEMINI_API_KEYS[keyIndex];

        try {
          console.log(`   🔑 Using Gemini API Key ${keyIndex + 1}/${GEMINI_API_KEYS.length}...`);
          const result = await this.callSingleGeminiModel(model, apiKey, filteredContents, temperature, maxTokens);
          console.log(`✅ Successfully generated response with ${model} (Key ${keyIndex + 1})`);
          return result;
        } catch (error) {
          const errorMsg = error.message;
          console.log(`   ⚠️ Key ${keyIndex + 1} failed: ${errorMsg.substring(0, 100)}...`);
          errors.push({ model, keyIndex: keyIndex + 1, error: errorMsg });

          // Check if it's a rate limit error - try next key
          if (errorMsg.includes('quota') || errorMsg.includes('rate') || errorMsg.includes('429')) {
            if (keyIndex < GEMINI_API_KEYS.length - 1) {
              console.log(`   🔄 Rate limited, trying next Gemini API key...`);
              continue;
            }
          }

          // For model not found errors, skip to next model immediately
          if (errorMsg.includes('not found') || errorMsg.includes('not supported')) {
            console.log(`   ⚠️ Model ${model} not available, skipping to next model...`);
            break;
          }

          // For other errors, try next key
          if (keyIndex < GEMINI_API_KEYS.length - 1) {
            console.log(`   🔄 Trying next Gemini API key...`);
          }
        }
      }

      if (modelIndex < GEMINI_MODELS.length - 1) {
        console.log(`🔄 All keys exhausted for ${model}, trying next model...`);
      }
    }

    // All Gemini models and keys failed - throw error to trigger OpenRouter fallback
    throw new Error(`All Gemini models and API keys failed. Tried ${GEMINI_MODELS.length} models × ${GEMINI_API_KEYS.length} keys`);
  }

  /**
   * Call OpenRouter API with model fallback and key rotation
   * @param {Array} messages - Array of message objects with role and content  
   * @param {number} temperature - Temperature for generation (unused, for compatibility)
   * @param {number} maxTokens - Maximum tokens to generate (unused, for compatibility)
   * @returns {Promise<string>} - Generated text
   */
  async callOpenRouterAPI(messages, temperature = 0.7, maxTokens = 2048) {
    if (OPENROUTER_API_KEYS.length === 0) {
      throw new Error('No OpenRouter API keys configured in environment variables');
    }

    // Try each model with all API keys before moving to next model
    for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
      const model = MODELS[modelIndex];
      console.log(`🔄 Trying OpenRouter Model ${modelIndex + 1}/${MODELS.length}: ${model}`);

      for (let keyIndex = 0; keyIndex < OPENROUTER_API_KEYS.length; keyIndex++) {
        const apiKey = OPENROUTER_API_KEYS[keyIndex];

        try {
          console.log(`🔑 Using API Key ${keyIndex + 1}/${OPENROUTER_API_KEYS.length}`);

          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (data.error?.code === 429) {
              if (keyIndex < OPENROUTER_API_KEYS.length - 1) {
                console.log(`⚠️ API key ${keyIndex + 1} rate-limited, trying next key...`);
                continue;
              } else if (modelIndex < MODELS.length - 1) {
                console.log(`⚠️ All keys rate-limited for ${model}, trying next model...`);
                break;
              }
            }

            if (keyIndex < OPENROUTER_API_KEYS.length - 1) continue;
            if (modelIndex < MODELS.length - 1) break;
            throw new Error(data.error?.message || 'OpenRouter API failed');
          }

          const generatedText = data.choices[0]?.message?.content || 'No response generated';
          console.log(`✅ Successfully generated response with OpenRouter (${model})`);
          return generatedText;
        } catch (error) {
          if (modelIndex === MODELS.length - 1 && keyIndex === OPENROUTER_API_KEYS.length - 1) {
            throw error;
          }
        }
      }
    }

    throw new Error('All OpenRouter models and API keys exhausted');
  }

  /**
   * Translate Urdu query to English for vector search
   * Fallback chain: Gemini 2.5 Flash → Gemini 3 Flash → OpenRouter
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

      const translationPrompt = `Translate this ${hasUrduScript ? 'Urdu' : 'Roman Urdu'} legal query to English. Preserve legal terminology. Return ONLY the English translation, no extra text.

Query: ${query}

English:`;

      const messages = [{ role: 'user', content: translationPrompt }];

      // Try Gemini first if toggle is set
      if (this.useGemini) {
        try {
          console.log('🔮 Trying Gemini for translation...');
          const translatedQuery = await this.callGeminiAPI(messages, 0.3, 200);

          console.log('✅ Translation complete (using Gemini):');
          console.log(`   Original: ${query}`);
          console.log(`   Translated: ${translatedQuery.trim()}`);

          return {
            translatedQuery: translatedQuery.trim(),
            isUrdu: true,
            originalQuery: query,
          };
        } catch (geminiError) {
          console.log(`⚠️ All Gemini models failed for translation: ${geminiError.message}`);
          console.log('🔄 Falling back to OpenRouter for translation...');
        }
      }

      // Fallback to OpenRouter (or use directly if toggle not set)
      try {
        const translatedQuery = await this.callOpenRouterAPI(messages, 0.3, 200);

        console.log('✅ Translation complete (using OpenRouter):');
        console.log(`   Original: ${query}`);
        console.log(`   Translated: ${translatedQuery.trim()}`);

        return {
          translatedQuery: translatedQuery.trim(),
          isUrdu: true,
          originalQuery: query,
        };
      } catch (openRouterError) {
        console.error('❌ OpenRouter translation also failed:', openRouterError.message);
        console.log('⚠️ Using original query as fallback');
        return {
          translatedQuery: query,
          isUrdu: true,
          originalQuery: query,
        };
      }
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
   * Generate a response using Gemini with fallback to OpenRouter
   * Fallback chain: Gemini 2.5 Flash → Gemini 3 Flash → OpenRouter
   * @param {string} userQuery - The user's question
   * @param {Array<Object>} context - Retrieved context chunks from vector DB
   * @returns {Promise<Object>} - The generated response and used source indices
   */
  async generateResponse(userQuery, context) {
    // Build context string from retrieved chunks
    const contextString = this.buildContextString(context);

    // Create the prompt with context and query
    const prompt = this.createPrompt(userQuery, contextString);

    const systemMessage = `You are an expert legal assistant specializing EXCLUSIVELY in Pakistani civil law. You provide accurate, helpful answers based ONLY on the legal documents and sources provided to you.

CRITICAL RULES:
1. SCOPE RESTRICTION: You MUST ONLY respond to queries related to Pakistani civil law. If the user asks about anything unrelated (e.g., cooking, programming, entertainment, foreign law, science, general knowledge, etc.), you MUST politely decline and redirect them to ask a question about Pakistani civil law.
2. SOURCE-ONLY ANSWERS: You MUST ONLY answer using information present in the provided legal sources/context. If the sources do not contain relevant information to answer the query, you MUST explicitly say so and recommend consulting a qualified lawyer. NEVER generate answers from your own general knowledge or training data.
3. CITATION MANDATORY: You MUST cite your sources using the format [Source 1], [Source 2], etc. whenever you reference information from the provided context.
4. COMPLETE RESPONSES: Always complete your response fully - never leave sentences or sections unfinished.
5. NO HALLUCINATION: Never invent section numbers, case names, dates, or legal provisions that are not in the provided sources.`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ];

    // Try Gemini first if toggle is set
    if (this.useGemini) {
      try {
        console.log('🔮 Trying Gemini for response generation...');
        let generatedText = await this.callGeminiAPI(messages, 0.7, 8192);

        // Check for truncated response and add graceful ending if needed
        // generatedText = this.handleTruncatedResponse(generatedText);

        console.log('✅ Successfully generated response with Gemini');

        // Extract which sources were actually used in the response
        const usedSources = this.extractUsedSources(generatedText, context.length);

        return {
          answer: generatedText,
          usedSources: usedSources
        };
      } catch (geminiError) {
        console.log(`⚠️ All Gemini models failed: ${geminiError.message}`);
        console.log('🔄 Falling back to OpenRouter for response generation...');
      }
    }

    // Fallback to OpenRouter (or use directly if toggle not set)
    try {
      let generatedText = await this.callOpenRouterAPI(messages, 0.7, 8192);

      // Check for truncated response and add graceful ending if needed
      generatedText = this.handleTruncatedResponse(generatedText);

      console.log('✅ Successfully generated response with OpenRouter');

      // Extract which sources were actually used in the response
      const usedSources = this.extractUsedSources(generatedText, context.length);

      return {
        answer: generatedText,
        usedSources: usedSources
      };
    } catch (openRouterError) {
      console.error('❌ OpenRouter also failed:', openRouterError.message);
      throw new Error(`All LLM providers failed. Gemini and OpenRouter both exhausted: ${openRouterError.message}`);
    }
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

    // If no sources were found (e.g., LLM declined an out-of-scope query or sources were insufficient),
    // return an empty array — don't send irrelevant sources to the frontend
    if (usedSources.size === 0) {
      console.log('ℹ️ No source citations found in LLM response. Returning no sources (LLM may have declined the query or sources were insufficient).');
      return [];
    }

    console.log(`✅ Found ${usedSources.size} cited sources: [${Array.from(usedSources).join(', ')}]`);

    // Convert Set to sorted array
    return Array.from(usedSources).sort((a, b) => a - b);
  }

  /**
   * Detect and handle truncated LLM responses
   * Adds a graceful ending if the response appears to be cut off
   * @param {string} response - The LLM's generated response
   * @returns {string} - The response with graceful ending if needed
   */
  handleTruncatedResponse(response) {
    if (!response) return response;

    const trimmed = response.trim();

    // Check for signs of truncation
    const truncationIndicators = [
      // Ends mid-sentence (no proper punctuation)
      /[a-zA-Z,]\s*$/,
      // Ends with opening bracket/asterisk/etc
      /[\[\(\*]\s*$/,
      // Ends with "Important" or similar incomplete sections
      /\*\*\s*(Important|Note|Warning|Disclaimer)\s*$/i,
      // Ends with colon (about to list something)
      /:\s*$/,
      // Ends with bullet point marker
      /^[\-\*•]\s*$/m,
    ];

    const isTruncated = truncationIndicators.some(pattern => pattern.test(trimmed));

    if (isTruncated) {
      console.log('⚠️ Detected potentially truncated response, adding graceful ending');
      return trimmed + '\n\n---\n\n*⚠️ Note: This response may have been truncated due to length limits. For a complete answer, please try asking a more specific question or break down your query into smaller parts.*';
    }

    return response;
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
    return `You are Civil Lawyer AI, an expert AI Legal Advisor with specialized expertise EXCLUSIVELY in Pakistani civil law. You serve as a trusted legal guide for citizens, students, professionals, and businesses seeking to understand Pakistani civil law.

═══════════════════════════════════════════════════════════════
� SCOPE RESTRICTION (HIGHEST PRIORITY — EVALUATE FIRST)
═══════════════════════════════════════════════════════════════
Before doing ANYTHING else, determine if the user's question is related to Pakistani civil law.

✅ IN-SCOPE (Answer these):
  • Any question about Pakistani federal or provincial legislation
  • Questions about Pakistani case law, court judgments, legal precedents
  • Questions about Pakistani legal domains: Contract Law, Property Law,
    Family Law, Labor Law, Civil Procedure, Corporate Law, Tax Law,
    Constitutional Law, or any other area of Pakistani civil law
  • Questions about legal rights, duties, procedures, or remedies under Pakistani law

❌ OUT-OF-SCOPE (REFUSE these — do NOT answer):
  • Questions unrelated to law (e.g., cooking, programming, science, math, entertainment, sports, health, general knowledge)
  • Questions about the laws of other countries (e.g., Indian law, US law, UK law) unless comparing with Pakistani law
  • Personal opinions, creative writing, jokes, casual conversation
  • Any topic that is not Pakistani civil law

If the query is OUT-OF-SCOPE, respond ONLY with:
"I am Civil Lawyer AI, specialized exclusively in Pakistani civil law. Your question does not fall within my area of expertise. Please ask me a question related to Pakistani civil law, and I will be happy to assist you."
(Translate this message to match the user's query language if needed — Roman Urdu or Urdu script.)
Do NOT provide any other information for out-of-scope queries. Do NOT attempt to answer them partially.

═══════════════════════════════════════════════════════════════
�🔐 YOUR EXPERTISE & KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════
• Federal Legislation: Constitution of Pakistan, Acts of Parliament, Ordinances
• Provincial Laws: Punjab, Sindh, Balochistan, KPK, Gilgit-Baltistan, AJK
• Case Law: Supreme Court, Federal Shariat Court, High Courts (LHC, SHC, PHC, BHC)
• Legal Domains: Contract Law, Property Law, Family Law, Labor Law, Civil Procedure, Corporate Law, Tax Law, Constitutional Law

═══════════════════════════════════════════════════════════════
📚 RETRIEVED LEGAL DOCUMENTS (Your ONLY Knowledge Source)
═══════════════════════════════════════════════════════════════
${contextString}

═══════════════════════════════════════════════════════════════
❓ USER'S LEGAL QUESTION
═══════════════════════════════════════════════════════════════
${userQuery}

═══════════════════════════════════════════════════════════════
🔒 SOURCE-ONLY ANSWERING RULE (CRITICAL — MUST FOLLOW)
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│ You are STRICTLY LIMITED to the retrieved legal documents   │
│ provided above. Follow these rules WITHOUT exception:      │
├─────────────────────────────────────────────────────────────┤
│ • ONLY use information found in the RETRIEVED LEGAL        │
│   DOCUMENTS above to form your answer.                     │
│ • Do NOT use your own training data or general knowledge   │
│   to answer legal questions.                               │
│ • Do NOT guess, assume, or fabricate any legal provisions, │
│   section numbers, case names, dates, or legal principles. │
│ • If the retrieved documents do NOT contain enough         │
│   information to answer the question → you MUST say:       │
│                                                            │
│   "The provided legal documents do not contain sufficient  │
│    information to answer your question about [topic].      │
│    I can only provide answers based on verified legal      │
│    sources. Please consult a qualified lawyer or advocate   │
│    for guidance on this matter."                           │
│                                                            │
│ • Do NOT partially answer from sources and then fill in    │
│   gaps with your own knowledge. If sources only cover part │
│   of the question, answer ONLY the part covered by sources │
│   and explicitly state that the remaining part is not      │
│   covered by the available documents.                      │
│ • EVERY factual statement MUST be backed with [Source X].  │
│   No citation = statement is NOT allowed.                  │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
🧠 REASONING PROCESS (Follow This Mental Framework)
═══════════════════════════════════════════════════════════════
Before responding, internally process:
1. SCOPE CHECK: Is this question about Pakistani civil law? If NO → decline.
2. IDENTIFY: What specific legal issue(s) is the user asking about?
3. LOCATE: Which sources from the context directly address this issue?
4. SUFFICIENCY CHECK: Do the sources contain enough information to answer? If NO → say so.
5. EXTRACT: What are the exact legal provisions, sections, or precedents?
6. ANALYZE: How do these laws apply to the user's specific situation?
7. SYNTHESIZE: What is the clear, actionable answer based ONLY on sources?

═══════════════════════════════════════════════════════════════
📋 RESPONSE GUIDELINES (STRICTLY FOLLOW)
═══════════════════════════════════════════════════════════════

🌐 **1. LANGUAGE DETECTION & MATCHING (MANDATORY)**
┌─────────────────────────────────────────────────────────────┐
│ DETECT the query language FIRST, then respond ONLY in that │
│ same language throughout your ENTIRE response.             │
├─────────────────────────────────────────────────────────────┤
│ • ENGLISH query → Respond fully in English                 │
│ • ROMAN URDU query → Respond fully in Roman Urdu           │
│   (e.g., "kya", "hai", "aap", "mujhe", "bataye", "haq")    │
│ • URDU SCRIPT query (اردو) → Respond fully in Urdu script  │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ NEVER mix languages. Stay consistent throughout.        │
└─────────────────────────────────────────────────────────────┘

📝 **2. RESPONSE STRUCTURE (Use This Format — ONLY if sources support it)**

**📌 Quick Answer**
→ Provide a direct 1-3 sentence answer to the core question upfront.
→ Include the most critical legal provision with citation.

**⚖️ Legal Analysis**
→ Break down the relevant law(s) systematically.
→ Quote exact legal text from sources when available.
→ Explain legal terminology in simple terms.

**📋 Key Provisions**
→ List specific sections, articles, or clauses that apply.
→ Use bullet points for clarity.
→ Always cite: [Source X]

**🔍 Application to Your Situation**
→ Explain how the law specifically applies to the user's case.
→ Cover any conditions, exceptions, or prerequisites.

**⚠️ Important Considerations** (if applicable)
→ Time limitations, deadlines, or statutes of limitation.
→ Procedural requirements or formalities.
→ Potential penalties or consequences.

**💡 Practical Next Steps** (if applicable)
→ What the user should do next.
→ Which authority, court, or office to approach.
→ Documents or evidence typically needed.



🔗 **3. CITATION RULES (STRICTLY ENFORCED)**
┌─────────────────────────────────────────────────────────────┐
│ • EVERY legal claim MUST have a citation: [Source X]       │
│ • Place citation IMMEDIATELY after the relevant statement  │
│ • Multiple sources for one claim: [Source 1] [Source 2]    │
│ • Include Act name + Section when quoting: "Under Section  │
│   10 of the Contract Act, 1872 [Source 2]..."              │
│ • NO citation = Statement NOT allowed (anti-hallucination) │
└─────────────────────────────────────────────────────────────┘

✅ GOOD: "The limitation period for filing a civil suit is 3 years [Source 4]."
✅ GOOD: "According to Section 9 of the CPC [Source 1], civil courts have jurisdiction..."
❌ BAD: "Generally, contracts require consideration." (No source cited)

🚫 **4. ANTI-HALLUCINATION SAFEGUARDS (CRITICAL)**
┌─────────────────────────────────────────────────────────────┐
│ • ONLY use information present in the provided sources     │
│ • If sources don't cover the topic → Say so explicitly     │
│   and DO NOT answer from your own knowledge                │
│ • NEVER invent section numbers, case names, or dates       │
│ • NEVER assume laws from other countries apply             │
│ • If unsure → Recommend consulting a lawyer                │
│ • NEVER fill knowledge gaps with your training data        │
│ • If you cannot find relevant info in sources, your answer │
│   is: "The sources do not cover this topic."               │
└─────────────────────────────────────────────────────────────┘

When context is insufficient, say:
"The provided legal documents do not contain specific information about [topic]. I can only provide answers based on the verified legal sources available to me. I recommend consulting a qualified lawyer or referring to [relevant authority] for accurate guidance on this matter."

📖 **5. LEGAL COMMUNICATION STYLE**
• Be authoritative yet accessible
• Avoid unnecessary legal jargon; explain terms when used
• Be empathetic - users often face stressful legal situations
• Be thorough but concise - respect the user's time
• Use examples to illustrate complex concepts
• Maintain professional tone throughout

🎨 **6. FORMATTING FOR READABILITY**
• Use **bold** for key legal terms and important points
• Use bullet points for lists of requirements or conditions
• Use section headers with emojis for visual organization
• Keep paragraphs short (3-4 sentences max)
• Use tables for comparing options when relevant
• Include horizontal dividers between major sections

⚠️ **7. MANDATORY DISCLAIMER**
End every response with a brief disclaimer in the same language as your response:

[English]: "⚠️ *This information is for educational purposes only and does not constitute legal advice. For matters requiring legal action, please consult a qualified lawyer or advocate.*"

[Roman Urdu]: "⚠️ *Yeh information sirf ilmi maqsad ke liye hai aur legal advice nahi hai. Qanooni karwai ke liye kisi lawyer se mushwara karein.*"

[Urdu Script]: "⚠️ *یہ معلومات صرف تعلیمی مقصد کے لیے ہیں اور قانونی مشورہ نہیں ہیں۔ قانونی کارروائی کے لیے کسی وکیل سے مشورہ کریں۔*"

═══════════════════════════════════════════════════════════════
✨ BEGIN YOUR EXPERT LEGAL RESPONSE
═══════════════════════════════════════════════════════════════`;
  }



  // =================================================================

  //     createPrompt(userQuery, contextString) {
  //     return `You are an expert (responding to end-user) AI Legal Advisor specializing in Pakistani law, with deep knowledge across multiple jurisdictions including Federal, Punjab, Sindh, Balochistan, and KPK legislation, as well as Supreme Court judgments and case law.

  // ═══════════════════════════════════════════════════════════════
  // LEGAL DATABASE CONTEXT:
  // ═══════════════════════════════════════════════════════════════
  // ${contextString}

  // ═══════════════════════════════════════════════════════════════
  // CLIENT'S LEGAL QUERY:
  // ═══════════════════════════════════════════════════════════════
  // ${userQuery}

  // ═══════════════════════════════════════════════════════════════
  // YOUR EXPERT ANALYSIS FRAMEWORK:
  // ═══════════════════════════════════════════════════════════════

  // 🎯 RESPONSE GUIDELINES:

  // 1. **LANGUAGE MATCHING - CRITICAL**
  //    - DETECT the language of the user's query first
  //    - If query is in ENGLISH → Respond ONLY in English
  //    - If query is in ROMAN URDU (Urdu written in English script like "kya", "hai", "aap", "mujhe", "chahiye") → Respond ONLY in Roman Urdu
  //    - If query is in URDU SCRIPT (اردو) → Respond ONLY in Urdu script
  //    - NEVER mix languages in your response - maintain consistency throughout
  //    - Examples of Roman Urdu: "qanoon kya kehta hai?", "mujhe employee rights ke baare mein bataye", "yeh act kis saal mein bana tha?"

  // 2. **COMPREHENSIVE ANALYSIS**
  //    - Start with a actual concise answer to the core question
  //    - Provide detailed legal reasoning with step-by-step explanation
  //    - Reference specific sections, articles, or clauses from the provided sources
  //    - Explain the practical implications and real-world applications

  // 3. **STRUCTURED PRESENTATION**
  //    - Use clear headings and bullet points for readability
  //    - Break down complex legal concepts into digestible parts
  //    - Present information in logical flow: Issue → Rule → Application → Conclusion

  // 4. **AUTHORITATIVE CITATIONS - MANDATORY**
  //    - **CRITICAL**: You MUST cite sources using the exact format [Source 1], [Source 2], etc.
  //    - When referencing information from the context, always include the source number
  //    - Example: "According to the law [Source 1], employees are entitled to..."
  //    - Example: "The maximum working hours are specified [Source 3] as 48 hours per week."
  //    - You can provide additional details like Act name and section, but MUST include [Source X]
  //    - Quote exact legal text when it strengthens your answer
  //    - If you reference multiple sources in one statement, cite all: [Source 1] [Source 2]

  // 5. **PRACTICAL GUIDANCE**
  //    - Explain how the law applies to the specific situation
  //    - Mention any exceptions, limitations, or special circumstances
  //    - Provide actionable insights where appropriate
  //    - Highlight important legal procedures or requirements

  // 6. **TRANSPARENCY & LIMITATIONS**
  //    - If the provided context is insufficient, clearly state what additional information would be needed
  //    - Acknowledge any ambiguities in the law or interpretation
  //    - Recommend consulting a qualified lawyer for complex cases or final legal decisions
  //    - Never fabricate information not present in the context

  // 7. **ENHANCED READABILITY**
  //    - Use emojis sparingly for section markers (⚖️ 📋 ⚠️ 💡) to improve visual organization
  //    - Employ bold and formatting for key terms and important points
  //    - Keep paragraphs concise and focused

  // ═══════════════════════════════════════════════════════════════
  // YOUR EXPERT LEGAL RESPONSE:
  // ═══════════════════════════════════════════════════════════════`;
  //   }

  // =================================================================

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
   * Fallback chain: Gemini 2.5 Flash → Gemini 3 Flash → OpenRouter
   * @param {string} text - The text to summarize
   * @param {string} type - 'judgment' or 'contract'
   * @returns {Promise<string>} - The generated summary
   */
  async generateSummary(text, type = 'judgment') {
    let prompt;
    if (type === 'judgment') {
      prompt = `Please provide a complete, detailed, and self-explanatory summary of the following legal judgment. 
      IMPORTANT RULES:
      - Output ONLY the summary. Do NOT include phrases like "Here is the summary" or "Here is a complete summary".
      - Use STRICT Markdown formatting.
      - Use '## ' (Header 2) for each section title.
      - Put a seperator like horizontal rule '---' between each section.
      - Make key items bold (using '**').
      - Use proper line breaks and spacing to make it highly readable.
      - You MUST complete the entire summary. Do NOT stop mid-section. Cover ALL sections fully.

      Structure the summary with the exact following sections:
      ## 1. Case Title & Citation (if available)
      ---
      ## 2. Facts of the Case
      ---
      ## 3. Issues Raised
      ---
      ## 4. Arguments by Petitioner
      ---
      ## 5. Arguments by Respondent
      ---
      ## 6. Court's Reasoning
      ---
      ## 7. Final Decision/Order
      ---
      ## 8. Key Legal Principles Established

      Judgment Text:
      ${text.substring(0, 50000)}`;
    } else {
      prompt = `Please provide a complete, detailed, and self-explanatory summary of the following legal contract.
      IMPORTANT RULES:
      - Output ONLY the summary. Do NOT include conversational opening or closing statements.
      - Use STRICT Markdown formatting.
      - Use '## ' (Header 2) for each section title.
      - Put a seperator like horizontal rule '---' between each section.
      - Make key items bold (using '**').
      - Use proper line breaks and spacing.
      - Provide useful insights including potential loopholes and risks.
      - You MUST complete the entire summary. Do NOT stop mid-section. Cover ALL sections fully.

      Structure the summary with the exact following sections:
      ## 1. Contract Overview (Parties, Purpose)
      ---
      ## 2. Key Terms & Conditions
      ---
      ## 3. Obligations of Each Party
      ---
      ## 4. Payment/Consideration Details
      ---
      ## 5. Termination Clauses
      ---
      ## 6. Dispute Resolution Mechanism
      ---
      ## 7. ⚠️ Potential Loopholes & Risks (Critical Analysis)
      ---
      ## 8. Recommendations

      Contract Text:
      ${text.substring(0, 50000)}`;
    }

    const systemMessage = 'You are an expert legal assistant specializing in summarizing complex legal documents.';

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ];

    // Try Gemini first if toggle is set
    if (this.useGemini) {
      try {
        console.log('🔮 Trying Gemini for summary generation...');
        const summary = await this.callGeminiAPI(messages, 0.7, 8192);

        console.log('✅ Successfully generated summary with Gemini');
        return summary;
      } catch (geminiError) {
        console.log(`⚠️ All Gemini models failed for summarization: ${geminiError.message}`);
        console.log('🔄 Falling back to OpenRouter for summary generation...');
      }
    }

    // Fallback to OpenRouter (or use directly if toggle not set)
    try {
      const summary = await this.callOpenRouterAPI(messages, 0.7, 8192);

      console.log('✅ Successfully generated summary with OpenRouter');
      return summary;
    } catch (openRouterError) {
      console.error('❌ OpenRouter summarization also failed:', openRouterError.message);
      throw new Error(`All LLM providers failed for summarization: ${openRouterError.message}`);
    }
  }
}

export default new LLMService();
