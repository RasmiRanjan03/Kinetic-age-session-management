import express from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
} from '../controllers/clientController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all client routes

// Static routes go before parameter routes
router.get('/stats', getClientStats);

router.route('/')
  .post(adminOnly, createClient)
  .get(getClients);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(adminOnly, deleteClient);

export default router;
