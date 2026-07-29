import express from 'express';
import { generateMonthlyReport, getBusinessReport } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all report routes

router.get('/monthly', adminOnly, generateMonthlyReport);
router.get('/business', adminOnly, getBusinessReport);

export default router;
