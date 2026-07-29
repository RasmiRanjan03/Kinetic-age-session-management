import express from 'express';
import {
  logSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all session routes

router.route('/')
  .post(logSession)
  .get(getSessions);

router.route('/:id')
  .get(getSessionById)
  .put(adminOnly, updateSession)
  .delete(deleteSession);

export default router;
