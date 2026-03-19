/**
 * Chat Controller
 * Handles HTTP requests for chat endpoints
 */

import ragService from '../services/ragService.js';
import Embeddings from '../models/Embeddings.js';
import Chat from '../models/Chat.js';

/**
 * Handle POST /api/chat/ask
 * Process user query and return AI-generated response
 */
export const askQuestion = async (req, res) => {
  try {
    const { query, question, topK, chatId } = req.body;
    const userId = req.user ? req.user.userId : null; // From authMiddleware

    // Accept both 'query' and 'question' parameters
    const userQuery = query || question;

    // Validate request body
    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query or question is required in request body',
      });
    }

    // Validate query
    const validation = ragService.validateQuery(userQuery);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Process query using RAG pipeline
    const result = await ragService.processQuery(
      validation.query,
      // topK || 10 // Use topK from request, default to 10 (minimum chunks)
      10
    );

    // Save to chat history if chatId is provided
    if (chatId && userId) {
      const chat = await Chat.findOne({ _id: chatId, user: userId });
      if (chat) {
        // Add user message
        chat.messages.push({
          role: 'user',
          content: userQuery,
          timestamp: new Date()
        });

        // Add assistant message
        chat.messages.push({
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          timestamp: new Date()
        });

        await chat.save();
      }
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      query: validation.query,
      metadata: result.metadata,
      data: result,
    });
  } catch (error) {
    console.error('Error in askQuestion controller:', error);

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your question',
      message: error.message,
    });
  }
};

/**
 * Create a new chat
 * POST /api/chat/new
 */
export const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.userId;

    const newChat = new Chat({
      user: userId,
      title: title || 'New Chat',
      messages: []
    });

    await newChat.save();

    res.status(201).json({ success: true, chat: newChat });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
};

/**
 * Get all chats for a user
 * GET /api/chat/history
 */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chats = await Chat.find({ user: userId }).sort({ updated_at: -1 }).select('-messages');
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
};

/**
 * Get a specific chat with messages
 * GET /api/chat/:id
 */
export const getChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chat = await Chat.findOne({ _id: req.params.id, user: userId });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat' });
  }
};

/**
 * Delete a chat
 * DELETE /api/chat/:id
 */
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
};

/**
 * Handle GET /api/chat/health
 * Check health status of the chat service
 */
export const healthCheck = async (req, res) => {
  try {
    // You can add more health checks here (e.g., Qdrant connection)
    return res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        embedding: 'ready',
        vectorDB: 'ready',
        llm: 'ready',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
};

/**
 * Handle GET /api/chat/documents
 * Get list of all unique documents from database
 */
export const getDocuments = async (req, res) => {
  try {
    // Aggregate unique documents with title, year, source_page, and document_type
    const documents = await Embeddings.aggregate([
      {
        $group: {
          _id: {
            title: '$title',
            year: '$year',
            source_page: '$source_page',
          },
          document_type: { $first: '$document_type' },
          source_website: { $first: '$source_website' },
          court: { $first: '$court' },
          createdAt: { $first: '$createdAt' }, // Get the first createdAt for sorting
        }
      },
      {
        $project: {
          _id: 0,
          title: '$_id.title',
          year: '$_id.year',
          source_page: '$_id.source_page',
          document_type: 1,
          source_website: 1,
          court: 1,
          createdAt: 1,
        }
      },
      {
        $sort: { createdAt: -1 } // Sort by upload date in descending order (newest first)
      }
    ]);

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents: documents,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error.message,
    });
  }
};

/**
 * Submit feedback rating for a specific message
 * PUT /api/chat/:chatId/feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    const { messageId, rating } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    // Find the chat belonging to this user
    const chat = await Chat.findOne({ _id: chatId, user: userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Find the specific message
    const message = chat.messages.id(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Only allow rating assistant messages
    if (message.role !== 'assistant') {
      return res.status(400).json({
        success: false,
        error: 'Only assistant responses can be rated'
      });
    }

    // Update the rating
    message.rating = rating;
    await chat.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      rating: rating
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
};
