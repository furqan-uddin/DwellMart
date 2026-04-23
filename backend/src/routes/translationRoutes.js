import express from 'express';
import { translateText, translateBatch, translateObject } from '../controllers/translationController.js';

const router = express.Router();

// Translation endpoints are completely public
router.post('/', translateText);
router.post('/batch', translateBatch);
router.post('/object', translateObject);

export default router;
