/**
 * Dashboard Routes
 * Provides endpoints for the dashboard page metrics and experience data.
 */

import express from 'express';
import { getStats, getExperience, getSystemStatus } from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.get('/stats', authMiddleware, getStats);
router.get('/experience', authMiddleware, getExperience);
router.get('/system-status', authMiddleware, getSystemStatus);

export default router;
