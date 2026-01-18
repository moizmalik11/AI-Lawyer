import express from 'express';
import judgmentController from '../controllers/judgmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (or protected if preferred)
router.get('/', judgmentController.listJudgments);
router.get('/:title/summary', authMiddleware, judgmentController.summarizeJudgment);

export default router;
