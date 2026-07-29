import Client from '../models/Client.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import Session from '../models/Session.js';

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Private (auth protected)
 */
export const createClient = async (req, res, next) => {
  try {
    const { fullName, age, gender, email, phone, address, status, subscriptionStatus } = req.body;

    // Simple validation check
    if (!fullName || !age || !gender || !email || !phone) {
      res.status(400);
      throw new Error('Please fill in all required fields (fullName, age, gender, email, phone)');
    }

    // Check if email already exists
    const emailExists = await Client.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      res.status(400);
      throw new Error('A client with this email address already exists');
    }

    const client = await Client.create({
      fullName,
      age,
      gender,
      email: email.toLowerCase(),
      phone,
      address: address || '',
      status: status || 'Active',
      subscriptionStatus: subscriptionStatus || 'None',
    });

    res.status(201).json({
      success: true,
      message: 'Client added successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private (auth protected)
 */
export const getClients = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { _id: req.user.clientId };
    }
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client by ID
 * @route   GET /api/clients/:id
 * @access  Private (auth protected)
 */
export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    if (req.user.role !== 'admin' && client.email !== req.user.email) {
      res.status(403);
      throw new Error('Forbidden: You do not have permission to view other client profiles');
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client details
 * @route   PUT /api/clients/:id
 * @access  Private (auth protected)
 */
export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    if (req.user.role !== 'admin' && client.email !== req.user.email) {
      res.status(403);
      throw new Error('Forbidden: You can only edit your own profile');
    }

    const isStaff = req.user.role === 'admin';
    const { fullName, age, gender, email, phone, address, status, subscriptionStatus, emergencyContact } = req.body;

    if (!isStaff) {
      if (email && email.toLowerCase() !== client.email) {
        res.status(400);
        throw new Error('You cannot change your registered email address');
      }
    } else {
      if (email && email.toLowerCase() !== client.email) {
        const emailExists = await Client.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          res.status(400);
          throw new Error('A client with this email address already exists');
        }
        client.email = email.toLowerCase();
      }
    }

    client.fullName = fullName || client.fullName;
    client.age = age !== undefined ? age : client.age;
    client.gender = gender || client.gender;
    client.phone = phone || client.phone;
    client.address = address !== undefined ? address : client.address;
    client.emergencyContact = emergencyContact !== undefined ? emergencyContact : client.emergencyContact;

    if (isStaff) {
      client.status = status || client.status;
      client.subscriptionStatus = subscriptionStatus || client.subscriptionStatus;
    }

    const updatedClient = await client.save();

    // Sync to User model if user profile exists
    if (fullName) {
      const user = await User.findOne({ email: client.email });
      if (user) {
        user.name = fullName;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a client record
 * @route   DELETE /api/clients/:id
 * @access  Private (auth protected)
 */
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    await Client.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics for clients
 * @route   GET /api/clients/stats
 * @access  Private (auth protected)
 */
export const getClientStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      const clientId = req.user.clientId;
      if (!clientId) {
        return res.status(200).json({
          success: true,
          data: {
            totalSubscriptions: 0,
            activePlans: 0,
            expiredPlans: 0,
            expiringSoon: 0,
            totalRevenue: 0,
            totalSessions: 0,
            completedSessions: 0,
            remainingSessions: 0,
          }
        });
      }

      const clientSubs = await Subscription.find({ clientId });
      const clientPayments = await Payment.find({ clientId });

      const totalSubscriptions = clientSubs.length;
      const activePlans = clientSubs.filter(s => ['Active', 'Expiring Soon'].includes(s.status)).length;
      const expiredPlans = clientSubs.filter(s => s.status === 'Expired').length;
      const expiringSoon = clientSubs.filter(s => s.status === 'Expiring Soon').length;
      const totalRevenue = clientPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      const totalSessions = clientSubs.reduce((sum, s) => sum + (s.totalSessions || 0), 0);
      const completedSessions = clientSubs.reduce((sum, s) => sum + (s.completedSessions || 0), 0);
      const remainingSessions = clientSubs.reduce((sum, s) => sum + (s.remainingSessions || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          totalSubscriptions,
          activePlans,
          expiredPlans,
          expiringSoon,
          totalRevenue,
          totalSessions,
          completedSessions,
          remainingSessions,
        }
      });
    }

    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'Active' });
    const inactiveClients = await Client.countDocuments({ status: 'Inactive' });

    // Calculate start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newClientsThisMonth = await Client.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Subscriptions statistics
    const totalSubscriptions = await Subscription.countDocuments();
    const activePlans = await Subscription.countDocuments({ status: { $in: ['Active', 'Expiring Soon'] } });
    const expiredPlans = await Subscription.countDocuments({ status: 'Expired' });
    const expiringSoon = await Subscription.countDocuments({ status: 'Expiring Soon' });

    // Payment statistics
    const allPayments = await Payment.find();
    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsThisMonth = allPayments
      .filter(p => new Date(p.paymentDate) >= startOfCurrentMonth)
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const activeSubscriptionsList = await Subscription.find({ status: { $in: ['Active', 'Expiring Soon'] } });
    const pendingPayments = activeSubscriptionsList.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);

    const fullyPaidClients = await Subscription.countDocuments({ remainingBalance: 0 });
    const partiallyPaidClients = await Subscription.countDocuments({ remainingBalance: { $gt: 0 }, amountPaid: { $gt: 0 } });
    const overduePayments = await Subscription.countDocuments({ 
      status: { $in: ['Expired', 'Cancelled'] }, 
      remainingBalance: { $gt: 0 } 
    });

    // Sessions statistics calculations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalSessions = await Session.countDocuments();
    const sessionsCompletedToday = await Session.countDocuments({ 
      status: 'Completed', 
      sessionDate: { $gte: startOfToday, $lte: endOfToday } 
    });
    const upcomingSessions = await Session.countDocuments({ 
      status: 'Scheduled', 
      sessionDate: { $gte: startOfToday } 
    });
    const missedSessions = await Session.countDocuments({ status: 'Missed' });

    // Today's sessions attendance rate
    const todaySessions = await Session.find({
      sessionDate: { $gte: startOfToday, $lte: endOfToday }
    });
    const todaySessionsCount = todaySessions.length;
    const todayAttended = todaySessions.filter(s => s.attendance === 'Present' || s.attendance === 'Late').length;
    const todayAttendanceRate = todaySessionsCount > 0 ? Math.round((todayAttended / todaySessionsCount) * 100) : 100;

    // Average session completion rate: completed / (completed + missed)
    const completedCount = await Session.countDocuments({ status: 'Completed' });
    const missedCount = await Session.countDocuments({ status: 'Missed' });
    const totalConcluded = completedCount + missedCount;
    const avgCompletionRate = totalConcluded > 0 ? Math.round((completedCount / totalConcluded) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        activeClients,
        inactiveClients,
        newClientsThisMonth,
        totalSubscriptions,
        activePlans,
        expiredPlans,
        expiringSoon,
        totalRevenue,
        paymentsThisMonth,
        pendingPayments,
        fullyPaidClients,
        partiallyPaidClients,
        overduePayments,
        totalSessions,
        sessionsCompletedToday,
        upcomingSessions,
        missedSessions,
        todayAttendanceRate,
        avgCompletionRate,
        todaySessionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
