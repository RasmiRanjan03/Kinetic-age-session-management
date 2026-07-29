import express from 'express';
import { recordPayment, getPayments, getPaymentById, updatePayment, deletePayment } from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // protect all payment routes

router.route('/')
  .post(adminOnly, recordPayment)
  .get(getPayments);

router.route('/:id')
  .get(getPaymentById)
  .put(adminOnly, updatePayment)
  .delete(adminOnly, deletePayment);

export default router;
