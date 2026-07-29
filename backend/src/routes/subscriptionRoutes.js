import express from 'express';
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  renewSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all subscription routes

router.route('/')
  .post(adminOnly, createSubscription)
  .get(getSubscriptions);

router.route('/:id')
  .get(getSubscriptionById)
  .put(adminOnly, updateSubscription)
  .delete(adminOnly, deleteSubscription);

router.post('/:id/renew', adminOnly, renewSubscription);
router.post('/:id/cancel', adminOnly, cancelSubscription);

export default router;
