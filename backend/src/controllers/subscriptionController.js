import Subscription from '../models/Subscription.js';
import Client from '../models/Client.js';

// Helper to calculate auto-expirations and expiring soon flags in the database
const checkAndExpireSubscriptions = async () => {
  const now = new Date();
  
  // 1. Mark past endDates as Expired
  await Subscription.updateMany(
    { 
      endDate: { $lt: now }, 
      status: { $nin: ['Expired', 'Cancelled', 'Completed'] } 
    },
    { $set: { status: 'Expired' } }
  );

  // 2. Mark active endDates expiring within 7 days as Expiring Soon
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await Subscription.updateMany(
    { 
      endDate: { $gte: now, $lte: sevenDaysFromNow }, 
      status: 'Active' 
    },
    { $set: { status: 'Expiring Soon' } }
  );
};

// Helper to update the parent Client's subscriptionStatus field accordingly
const syncClientSubscriptionStatus = async (clientId) => {
  const activeSub = await Subscription.findOne({ 
    clientId, 
    status: { $in: ['Active', 'Expiring Soon'] } 
  }).sort({ endDate: -1 });

  let clientStatus = 'None';
  if (activeSub) {
    clientStatus = 'Active';
  } else {
    const expiredSub = await Subscription.findOne({ 
      clientId, 
      status: 'Expired' 
    });
    if (expiredSub) {
      clientStatus = 'Expired';
    }
  }

  await Client.findByIdAndUpdate(clientId, { subscriptionStatus: clientStatus });
};

/**
 * @desc    Get all subscriptions with search, filter, and sorting
 * @route   GET /api/subscriptions
 * @access  Private (auth protected)
 */
export const getSubscriptions = async (req, res, next) => {
  try {
    // 1. Run dynamic auto-expirations check
    await checkAndExpireSubscriptions();

    const { status, search, sortBy } = req.query;
    const query = {};

    // 2. Filter logic
    if (status && status !== 'All') {
      if (status === 'Renewed This Month') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        query.$or = [
          { 'renewalHistory.renewalDate': { $gte: startOfMonth } },
          { createdAt: { $gte: startOfMonth }, renewalHistory: { $exists: true, $not: { $size: 0 } } }
        ];
      } else {
        query.status = status;
      }
    }

    // 3. Search logic (planName or Client fields)
    if (search) {
      const matchingClients = await Client.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      });
      const clientIds = matchingClients.map(c => c._id);

      query.$or = [
        { planName: { $regex: search, $options: 'i' } },
        { clientId: { $in: clientIds } },
      ];
    }

    // 4. Sorting logic
    let sort = { createdAt: -1 }; // Default: Latest
    if (sortBy === 'Oldest') {
      sort = { createdAt: 1 };
    } else if (sortBy === 'EndDate') {
      sort = { endDate: 1 };
    } else if (sortBy === 'StartDate') {
      sort = { startDate: 1 };
    } else if (sortBy === 'Price') {
      sort = { price: -1 };
    }

    if (req.user.role !== 'admin') {
      query.clientId = req.user.clientId;
    }

    const subscriptions = await Subscription.find(query)
      .populate('clientId')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new subscription membership
 * @route   POST /api/subscriptions
 * @access  Private (auth protected)
 */
export const createSubscription = async (req, res, next) => {
  try {
    const { 
      clientId, 
      planName, 
      planDescription, 
      price, 
      durationMonths, 
      totalSessions, 
      startDate, 
      paymentMethod, 
      amountPaid 
    } = req.body;

    if (!clientId || !planName || price === undefined || !durationMonths || !startDate) {
      res.status(400);
      throw new Error('Please fill in all required fields (clientId, planName, price, durationMonths, startDate)');
    }

    // Calculate dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + parseInt(durationMonths));

    // Calculate balances and payment states
    const numericPrice = parseFloat(price);
    const numericPaid = parseFloat(amountPaid || 0);
    const remainingBalance = Math.max(0, numericPrice - numericPaid);

    let paymentStatus = 'Unpaid';
    if (numericPaid >= numericPrice) {
      paymentStatus = 'Paid';
    } else if (numericPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    // Calculate initial status based on dates
    const now = new Date();
    let status = 'Active';
    if (end < now) {
      status = 'Expired';
    } else {
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (end <= sevenDaysFromNow) {
        status = 'Expiring Soon';
      }
    }

    const subscription = await Subscription.create({
      clientId,
      planName,
      planDescription: planDescription || '',
      price: numericPrice,
      durationMonths: parseInt(durationMonths),
      totalSessions: parseInt(totalSessions || 0),
      completedSessions: 0,
      remainingSessions: parseInt(totalSessions || 0),
      startDate: start,
      endDate: end,
      status,
      paymentStatus,
      paymentMethod: paymentMethod || 'Cash',
      amountPaid: numericPaid,
      remainingBalance,
      renewalHistory: [],
    });

    // Sync client status
    await syncClientSubscriptionStatus(clientId);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subscription by ID
 * @route   GET /api/subscriptions/:id
 * @access  Private (auth protected)
 */
export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('clientId');

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    if (req.user.role !== 'admin' && subscription.clientId?.email !== req.user.email) {
      res.status(403);
      throw new Error('Forbidden: You do not have permission to view other subscription profiles');
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subscription membership parameters
 * @route   PUT /api/subscriptions/:id
 * @access  Private (auth protected)
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    const { 
      planName, 
      planDescription, 
      price, 
      durationMonths, 
      totalSessions, 
      completedSessions, 
      startDate, 
      endDate, 
      status, 
      paymentMethod, 
      amountPaid 
    } = req.body;

    // Apply updates
    subscription.planName = planName || subscription.planName;
    subscription.planDescription = planDescription !== undefined ? planDescription : subscription.planDescription;
    subscription.paymentMethod = paymentMethod || subscription.paymentMethod;
    subscription.status = status || subscription.status;

    if (startDate) {
      subscription.startDate = new Date(startDate);
    }

    if (durationMonths !== undefined) {
      subscription.durationMonths = parseInt(durationMonths);
      if (startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + parseInt(durationMonths));
        subscription.endDate = end;
      }
    }

    if (endDate) {
      subscription.endDate = new Date(endDate);
    }

    if (price !== undefined) {
      subscription.price = parseFloat(price);
    }

    if (amountPaid !== undefined) {
      subscription.amountPaid = parseFloat(amountPaid);
    }

    // Recalculate balances
    subscription.remainingBalance = Math.max(0, subscription.price - subscription.amountPaid);
    if (subscription.amountPaid >= subscription.price) {
      subscription.paymentStatus = 'Paid';
    } else if (subscription.amountPaid > 0) {
      subscription.paymentStatus = 'Partially Paid';
    } else {
      subscription.paymentStatus = 'Unpaid';
    }

    if (totalSessions !== undefined) {
      subscription.totalSessions = parseInt(totalSessions);
    }
    if (completedSessions !== undefined) {
      subscription.completedSessions = parseInt(completedSessions);
    }
    subscription.remainingSessions = Math.max(0, subscription.totalSessions - subscription.completedSessions);

    const updated = await subscription.save();
    
    // Sync client status
    await syncClientSubscriptionStatus(subscription.clientId);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renew subscription plan (Extend dates & log history)
 * @route   POST /api/subscriptions/:id/renew
 * @access  Private (auth protected)
 */
export const renewSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    const { price, durationMonths, totalSessions, amountPaid, paymentMethod } = req.body;

    if (!price || !durationMonths) {
      res.status(400);
      throw new Error('Please specify price and durationMonths for renewal');
    }

    const today = new Date();
    
    // Save current parameters to renewalHistory before extending
    subscription.renewalHistory.push({
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      price: subscription.price,
      amountPaid: subscription.amountPaid,
      renewalDate: today,
    });

    // Start date for renewed plan: previous endDate if active, else today
    let newStart = new Date(subscription.endDate);
    if (newStart < today) {
      newStart = today;
    }

    const newEnd = new Date(newStart);
    newEnd.setMonth(newStart.getMonth() + parseInt(durationMonths));

    subscription.startDate = newStart;
    subscription.endDate = newEnd;
    subscription.price = parseFloat(price);
    subscription.durationMonths = parseInt(durationMonths);
    subscription.totalSessions = parseInt(totalSessions || subscription.totalSessions);
    subscription.completedSessions = 0;
    subscription.remainingSessions = subscription.totalSessions;
    subscription.amountPaid = parseFloat(amountPaid || 0);
    subscription.paymentMethod = paymentMethod || subscription.paymentMethod;
    
    subscription.remainingBalance = Math.max(0, subscription.price - subscription.amountPaid);
    if (subscription.amountPaid >= subscription.price) {
      subscription.paymentStatus = 'Paid';
    } else if (subscription.amountPaid > 0) {
      subscription.paymentStatus = 'Partially Paid';
    } else {
      subscription.paymentStatus = 'Unpaid';
    }

    // Recalculate status
    let status = 'Active';
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (newEnd <= sevenDaysFromNow) {
      status = 'Expiring Soon';
    }
    subscription.status = status;

    const renewed = await subscription.save();

    // Sync client status
    await syncClientSubscriptionStatus(subscription.clientId);

    res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully',
      data: renewed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel subscription plan
 * @route   POST /api/subscriptions/:id/cancel
 * @access  Private (auth protected)
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    subscription.status = 'Cancelled';
    const updated = await subscription.save();

    // Sync client status
    await syncClientSubscriptionStatus(subscription.clientId);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a subscription record
 * @route   DELETE /api/subscriptions/:id
 * @access  Private (auth protected)
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    const clientId = subscription.clientId;
    await Subscription.findByIdAndDelete(req.params.id);

    // Sync client status
    await syncClientSubscriptionStatus(clientId);

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
