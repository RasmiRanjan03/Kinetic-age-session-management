import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Client from '../models/Client.js';

// Helper to sync payment totals to the related subscription
const syncSubscriptionBilling = async (subscriptionId) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) return;

  // Find all payments logged for this subscription
  const payments = await Payment.find({ subscriptionId, paymentStatus: { $ne: 'Refunded' } });
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  subscription.amountPaid = totalPaid;
  subscription.remainingBalance = Math.max(0, subscription.price - totalPaid);

  if (subscription.remainingBalance === 0) {
    subscription.paymentStatus = 'Paid';
  } else if (totalPaid > 0) {
    subscription.paymentStatus = 'Partially Paid';
  } else {
    subscription.paymentStatus = 'Unpaid';
  }

  await subscription.save();
};

/**
 * @desc    Get all payment records with filters, search, and sorting
 * @route   GET /api/payments
 * @access  Private (auth protected)
 */
export const getPayments = async (req, res, next) => {
  try {
    const { status, method, range, search, sortBy } = req.query;
    const query = {};

    // 1. Payment Status Filter
    if (status && status !== 'All') {
      query.paymentStatus = status;
    }

    // 2. Payment Method Filter
    if (method && method !== 'All') {
      query.paymentMethod = method;
    }

    // 3. Calendar Range Filter
    const now = new Date();
    if (range === 'Current Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.paymentDate = { $gte: startOfMonth };
    } else if (range === 'Current Year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      query.paymentDate = { $gte: startOfYear };
    }

    // 4. Search Filter (client name, invoice number, payment method)
    if (search) {
      const matchingClients = await Client.find({
        fullName: { $regex: search, $options: 'i' },
      });
      const clientIds = matchingClients.map(c => c._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } },
        { clientId: { $in: clientIds } },
      ];
    }

    // 5. Sorting
    let sort = { paymentDate: -1 }; // Default: Latest Payment
    if (sortBy === 'Oldest Payment') {
      sort = { paymentDate: 1 };
    } else if (sortBy === 'Highest Amount') {
      sort = { amountPaid: -1 };
    } else if (sortBy === 'Lowest Amount') {
      sort = { amountPaid: 1 };
    } else if (sortBy === 'Payment Date') {
      sort = { paymentDate: -1 };
    }

    if (req.user.role !== 'admin') {
      query.clientId = req.user.clientId;
    }

    const payments = await Payment.find(query)
      .populate('clientId')
      .populate('subscriptionId')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a new payment transaction
 * @route   POST /api/payments
 * @access  Private (auth protected)
 */
export const recordPayment = async (req, res, next) => {
  try {
    const { 
      clientId, 
      subscriptionId, 
      amountPaid, 
      paymentMethod, 
      paymentDate, 
      transactionReference, 
      notes, 
      collectedBy 
    } = req.body;

    if (!clientId || !subscriptionId || amountPaid === undefined || !paymentMethod || !paymentDate) {
      res.status(400);
      throw new Error('Please fill in all required fields (clientId, subscriptionId, amountPaid, paymentMethod, paymentDate)');
    }

    // 1. Retrieve subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      res.status(404);
      throw new Error('Subscription membership plan not found');
    }

    // 2. Validate amount not exceeding remaining balance
    const numericPaid = parseFloat(amountPaid);
    if (isNaN(numericPaid) || numericPaid <= 0) {
      res.status(400);
      throw new Error('Amount paid must be a positive number');
    }

    const maxAllowed = subscription.remainingBalance;
    if (numericPaid > maxAllowed + 0.01) { // floating point tolerance
      res.status(400);
      throw new Error(`Payment amount ($${numericPaid}) cannot exceed subscription remaining balance ($${maxAllowed})`);
    }

    // 3. Generate sequential invoice number (INV-YYYY-XXXX)
    const count = await Payment.countDocuments();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${sequence}`;

    // 4. Calculate new balances and payment states
    const remainingBalance = Math.max(0, maxAllowed - numericPaid);
    let paymentStatus = 'Unpaid';
    if (remainingBalance === 0) {
      paymentStatus = 'Paid';
    } else if (numericPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    const payment = await Payment.create({
      clientId,
      subscriptionId,
      invoiceNumber,
      totalAmount: subscription.price,
      amountPaid: numericPaid,
      remainingBalance,
      paymentMethod,
      paymentStatus,
      paymentDate: new Date(paymentDate),
      transactionReference: transactionReference || '',
      collectedBy: collectedBy || 'Admin',
      notes: notes || '',
    });

    // 5. Sync subscription balance parameters
    await syncSubscriptionBilling(subscriptionId);

    res.status(201).json({
      success: true,
      message: 'Payment logged successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Private (auth protected)
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('clientId')
      .populate('subscriptionId');

    if (!payment) {
      res.status(404);
      throw new Error('Payment transaction log not found');
    }

    if (req.user.role !== 'admin' && payment.clientId?.email !== req.user.email) {
      res.status(403);
      throw new Error('Forbidden: You do not have permission to view other client payments');
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update payment details
 * @route   PUT /api/payments/:id
 * @access  Private (auth protected)
 */
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error('Payment transaction log not found');
    }

    const { amountPaid, paymentMethod, paymentDate, transactionReference, notes, paymentStatus } = req.body;

    if (amountPaid !== undefined) {
      payment.amountPaid = parseFloat(amountPaid);
    }
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.paymentDate = paymentDate ? new Date(paymentDate) : payment.paymentDate;
    payment.transactionReference = transactionReference !== undefined ? transactionReference : payment.transactionReference;
    payment.notes = notes !== undefined ? notes : payment.notes;
    payment.paymentStatus = paymentStatus || payment.paymentStatus;

    const updated = await payment.save();

    // Re-sync subscription parameters
    await syncSubscriptionBilling(payment.subscriptionId);

    res.status(200).json({
      success: true,
      message: 'Payment transaction updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a payment record (adjusts subscription balances)
 * @route   DELETE /api/payments/:id
 * @access  Private (auth protected)
 */
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error('Payment transaction log not found');
    }

    const subscriptionId = payment.subscriptionId;

    await Payment.findByIdAndDelete(req.params.id);

    // Sync subscription
    await syncSubscriptionBilling(subscriptionId);

    res.status(200).json({
      success: true,
      message: 'Payment transaction record removed',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
