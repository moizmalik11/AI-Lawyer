/**
 * Chat Routes
 * Defines API endpoints for chat functionality
 */

import express from 'express';
import {
    askQuestion,
    healthCheck,
    getDocuments,
    createChat,
    getUserChats,
    getChat,
    deleteChat,
    submitFeedback
} from '../controllers/chatController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/chat/ask
 * Ask a legal question and get AI-generated response
 * Optional: Provide chatId to save history (requires auth)
 */
// Note: We allow unauthenticated access for quick questions, but authenticated users can save history
router.post('/ask', (req, res, next) => {
    // Optional auth check: if token is present, verify it, otherwise proceed as guest
    const token = req.header('Authorization');
    if (token) {
        authMiddleware(req, res, next);
    } else {
        next();
    }
}, askQuestion);

// Chat Management Routes (Protected)
router.post('/new', authMiddleware, createChat);
router.get('/history', authMiddleware, getUserChats);
router.get('/:id', authMiddleware, getChat);
router.delete('/:id', authMiddleware, deleteChat);
router.put('/:chatId/feedback', authMiddleware, submitFeedback);

/**
 * GET /api/chat/health
 * Check health status of chat service
 */
router.get('/health', healthCheck);

/**
 * GET /api/chat/documents
 * Get list of all unique documents in the database
 */
router.get('/documents', getDocuments);

export default router;
