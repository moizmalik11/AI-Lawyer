import express from 'express';
import searchController from '../controllers/searchController.js';

const router = express.Router();

// Public search route
router.get('/', searchController.globalSearch);
router.get('/types', searchController.getDocumentTypes);

export default router;
