import Client from '../models/Client.js';
import Subscription from '../models/Subscription.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';

export const generateMonthlyReport = async (req, res, next) => {
  try {
    const { clientId, year, month } = req.query;
    res.status(200).json({
      success: true,
      message: `Generate monthly report placeholder for client ${clientId || 'all'}, period: ${year || 'current'}-${month || 'current'}`,
      data: {
        totalSessions: 0,
        completedSessions: 0,
        averageDuration: 0,
        exercisesSummary: [],
        attendanceRate: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get center-wide business performance reports
 * @route   GET /api/reports/business
 * @access  Private (auth protected)
 */
export const getBusinessReport = async (req, res, next) => {
  try {
    const filter = req.query.filter || 'month';
    const now = new Date();
    let startDateThreshold = new Date(0); // Default to all time

    if (filter === 'today') {
      startDateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === '7days') {
      startDateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter === '30days') {
      startDateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter === 'month') {
      startDateThreshold = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'year') {
      startDateThreshold = new Date(now.getFullYear(), 0, 1);
    }

    // Clients stats
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'Active' });
    const inactiveClients = await Client.countDocuments({ status: 'Inactive' });
    const recentlyJoinedClientsCount = await Client.countDocuments({ createdAt: { $gte: startDateThreshold } });

    // Subscriptions stats
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'Active' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'Expired' });
    const paidSubsCount = await Subscription.countDocuments({ remainingBalance: 0 });
    const unpaidSubsCount = await Subscription.countDocuments({ remainingBalance: { $gt: 0 } });

    // Payments revenue calculations
    const allPayments = await Payment.find();
    const totalRevenueCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const activeSubscriptionsList = await Subscription.find({ status: 'Active' });
    const pendingPayments = activeSubscriptionsList.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);

    // Sessions stats
    const sessions = await Session.find();
    const completedSessions = sessions.filter(s => s.status === 'Completed').length;
    const upcomingSessions = sessions.filter(s => s.status === 'Scheduled').length;
    const missedSessions = sessions.filter(s => s.status === 'Missed').length;

    // Monthly Overview stats (current calendar month limits)
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newClientsThisMonth = await Client.countDocuments({ createdAt: { $gte: startOfCurrentMonth } });
    const renewedSubsThisMonth = await Subscription.countDocuments({ startDate: { $gte: startOfCurrentMonth } });
    const expiredSubsThisMonth = await Subscription.countDocuments({ status: 'Expired', endDate: { $gte: startOfCurrentMonth } });
    const sessionsConductedThisMonth = await Session.countDocuments({ status: 'Completed', sessionDate: { $gte: startOfCurrentMonth } });
    
    const monthlyPayments = await Payment.find({ paymentDate: { $gte: startOfCurrentMonth } });
    const revenueThisMonth = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recent Activity Feed compilation (latest 10 activities)
    const recentClients = await Client.find().sort({ createdAt: -1 }).limit(10);
    const recentSubscriptions = await Subscription.find().populate('clientId').sort({ createdAt: -1 }).limit(10);
    const recentPayments = await Payment.find().populate('clientId').sort({ createdAt: -1 }).limit(10);
    const recentSessions = await Session.find().populate('clientId').sort({ createdAt: -1 }).limit(10);

    const activities = [];

    recentClients.forEach(c => {
      activities.push({
        type: 'New Client Registered',
        desc: `Client "${c.fullName}" was registered in the database.`,
        date: c.createdAt,
        icon: '👤',
      });
    });

    recentSubscriptions.forEach(s => {
      activities.push({
        type: 'Subscription Purchased',
        desc: `Plan "${s.planType}" assigned to ${s.clientId?.fullName || 'Client'}.`,
        date: s.createdAt,
        icon: '💳',
      });
    });

    recentPayments.forEach(p => {
      activities.push({
        type: 'Payment Received',
        desc: `Transaction of $${p.amount} received from ${p.clientId?.fullName || 'Client'}.`,
        date: p.paymentDate,
        icon: '💰',
      });
    });

    recentSessions.forEach(se => {
      if (se.status === 'Completed') {
        activities.push({
          type: 'Session Completed',
          desc: `Session progress notes generated for ${se.clientId?.fullName || 'Client'}.`,
          date: se.sessionDate,
          icon: '🏃‍♂️',
        });
      }
    });

    // Sort by chronological descending order and slice the top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalClients,
          activeClients,
          inactiveClients,
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          sessionsCompleted: completedSessions,
          sessionsRemaining: upcomingSessions + missedSessions,
          totalRevenueCollected,
          pendingPayments,
        },
        monthlyOverview: {
          newClientsThisMonth,
          renewedSubscriptions: renewedSubsThisMonth,
          expiredSubscriptions: expiredSubsThisMonth,
          sessionsConducted: sessionsConductedThisMonth,
          revenueThisMonth,
        },
        clientStatus: {
          activeClients,
          inactiveClients,
          recentlyJoined: recentlyJoinedClientsCount,
          expiredPlans: expiredSubscriptions,
        },
        payment: {
          totalRevenue: totalRevenueCollected,
          totalPendingAmount: pendingPayments,
          paidSubscriptions: paidSubsCount,
          unpaidSubscriptions: unpaidSubsCount,
        },
        session: {
          totalSessions: completedSessions + upcomingSessions + missedSessions,
          completedSessions,
          upcomingSessions,
          missedSessions,
        },
        recentActivities: sortedActivities.length > 0 ? sortedActivities : [
          {
            type: 'System Init',
            desc: 'Database logs initialized.',
            date: now,
            icon: '⚙️',
          }
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
