import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Client from '../models/Client.js';
import Subscription from '../models/Subscription.js';

// Helper to mark past Scheduled sessions as Missed
const checkAndExpireSessions = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await Session.updateMany(
    { 
      sessionDate: { $lt: today }, 
      status: 'Scheduled' 
    },
    { $set: { status: 'Missed' } }
  );
};

// Helper to adjust client subscription sessions when a session is completed or reverted
const adjustSubscriptionSessions = async (clientId, sessionStatusDiff) => {
  // sessionStatusDiff: +1 means session completed, -1 means completed session reverted/deleted
  const activeSub = await Subscription.findOne({ 
    clientId, 
    status: { $in: ['Active', 'Expiring Soon'] } 
  });
  
  if (activeSub) {
    activeSub.completedSessions = Math.max(0, activeSub.completedSessions + sessionStatusDiff);
    activeSub.remainingSessions = Math.max(0, activeSub.totalSessions - activeSub.completedSessions);
    await activeSub.save();
  }
};

/**
 * @desc    Get all scheduled sessions with search, filters, and sorting
 * @route   GET /api/sessions
 * @access  Private (auth protected)
 */
export const getSessions = async (req, res, next) => {
  try {
    await checkAndExpireSessions();

    const { status, attendance, programType, search, sortBy } = req.query;
    const query = {};

    // 1. Status Filter
    if (status && status !== 'All') {
      if (status === "Today's Sessions") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        query.sessionDate = { $gte: startOfToday, $lte: endOfToday };
      } else {
        query.status = status;
      }
    }

    // 2. Attendance Filter
    if (attendance && attendance !== 'All') {
      query.attendance = attendance;
    }

    // 3. Program Type Filter
    if (programType && programType !== 'All') {
      query.programType = programType;
    }

    // 4. Search Filter (therapistName, programType, client fullName or session ID)
    if (search) {
      const matchingClients = await Client.find({
        fullName: { $regex: search, $options: 'i' },
      });
      const clientIds = matchingClients.map(c => c._id);

      const orConditions = [
        { therapistName: { $regex: search, $options: 'i' } },
        { programType: { $regex: search, $options: 'i' } },
        { clientId: { $in: clientIds } },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }

      query.$or = orConditions;
    }

    // 5. Sorting
    let sort = { sessionDate: -1, startTime: -1 }; // Default: Newest
    if (sortBy === 'Oldest') {
      sort = { sessionDate: 1, startTime: 1 };
    } else if (sortBy === 'Date') {
      sort = { sessionDate: -1 };
    } else if (sortBy === 'Time') {
      sort = { startTime: 1 };
    } else if (sortBy === 'Status') {
      sort = { status: 1 };
    } else if (sortBy === 'ClientName') {
      // Sorting by ClientName in DB is complex due to populate.
      // We sort by sessionDate descending and let client handle sorting as needed.
      sort = { sessionDate: -1 };
    }

    if (req.user.role !== 'admin') {
      query.clientId = req.user.clientId;
    }

    const sessions = await Session.find(query)
      .populate('clientId')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Schedule/log a new session
 * @route   POST /api/sessions
 * @access  Private (auth protected)
 */
export const logSession = async (req, res, next) => {
  try {
    const { 
      clientId, 
      therapistName, 
      programType, 
      sessionDate, 
      startTime, 
      endTime, 
      duration, 
      notes, 
      attendance, 
      status 
    } = req.body;

    let targetClientId = clientId;
    let targetTherapistName = therapistName;
    let targetDuration = duration;
    let targetEndTime = endTime;
    let targetStatus = status || 'Scheduled';
    let targetAttendance = attendance || 'Absent';

    if (req.user.role !== 'admin') {
      targetClientId = req.user.clientId;
      targetTherapistName = therapistName || 'TBD';
      targetDuration = duration || 60;
      targetStatus = 'Pending Approval';
      targetAttendance = 'Absent';

      if (startTime && !targetEndTime) {
        const [h, m] = startTime.split(':').map(Number);
        const endH = String((h + 1) % 24).padStart(2, '0');
        targetEndTime = `${endH}:${String(m).padStart(2, '0')}`;
      }
    }

    if (!targetClientId || !targetTherapistName || !programType || !sessionDate || !startTime || !targetEndTime || !targetDuration) {
      res.status(400);
      throw new Error('Please fill in all required fields (clientId, therapistName, programType, sessionDate, startTime, endTime, duration)');
    }

    // 1. Validate date not in the past for newly Scheduled sessions
    const dateLimit = new Date();
    dateLimit.setHours(0, 0, 0, 0);
    const selectedDate = new Date(sessionDate);
    if (targetStatus === 'Scheduled' && selectedDate < dateLimit) {
      res.status(400);
      throw new Error('Cannot schedule sessions in the past');
    }

    // 2. Validate End Time is after Start Time
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = targetEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (endMin <= startMin) {
      res.status(400);
      throw new Error('End time must be later than start time');
    }

    // 3. Validate notes length
    if (notes && notes.length > 500) {
      res.status(400);
      throw new Error('Notes cannot exceed 500 characters');
    }

    // 4. Create Session
    const session = await Session.create({
      clientId: targetClientId,
      therapistName: targetTherapistName,
      programType,
      sessionDate: selectedDate,
      startTime,
      endTime: targetEndTime,
      duration: parseFloat(targetDuration),
      attendance: targetAttendance,
      status: targetStatus,
      notes: notes || '',
    });

    // 5. Update completed sessions count on client's active subscription if marked Completed
    if (session.status === 'Completed') {
      await adjustSubscriptionSessions(targetClientId, 1);
    }

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get session details by ID
 * @route   GET /api/sessions/:id
 * @access  Private (auth protected)
 */
export const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate('clientId');

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (req.user.role !== 'admin' && session.clientId?.email !== req.user.email) {
      res.status(403);
      throw new Error('Forbidden: You do not have permission to view other client sessions');
    }

    // Fetch previous sessions for the same client
    const previousSessions = await Session.find({
      clientId: session.clientId?._id,
      _id: { $ne: session._id }
    }).sort({ sessionDate: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        session,
        previousSessions
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update session details (Reschedule, mark completed, write notes, change status)
 * @route   PUT /api/sessions/:id
 * @access  Private (auth protected)
 */
export const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    const { 
      therapistName, 
      programType, 
      sessionDate, 
      startTime, 
      endTime, 
      duration, 
      notes, 
      attendance, 
      status 
    } = req.body;

    const previousStatus = session.status;

    // Time comparisons validations
    const nextStart = startTime || session.startTime;
    const nextEnd = endTime || session.endTime;
    const [startH, startM] = nextStart.split(':').map(Number);
    const [endH, endM] = nextEnd.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (endMin <= startMin) {
      res.status(400);
      throw new Error('End time must be later than start time');
    }

    if (notes && notes.length > 500) {
      res.status(400);
      throw new Error('Notes cannot exceed 500 characters');
    }

    // Apply updates
    session.therapistName = therapistName || session.therapistName;
    session.programType = programType || session.programType;
    session.sessionDate = sessionDate ? new Date(sessionDate) : session.sessionDate;
    session.startTime = nextStart;
    session.endTime = nextEnd;
    session.duration = duration !== undefined ? parseFloat(duration) : session.duration;
    session.notes = notes !== undefined ? notes : session.notes;
    session.attendance = attendance || session.attendance;
    session.status = status || session.status;

    const updated = await session.save();

    // Adjust subscription balance counts based on completed status transitions
    if (previousStatus !== 'Completed' && updated.status === 'Completed') {
      // Transitioned to Completed: increment count
      await adjustSubscriptionSessions(updated.clientId, 1);
    } else if (previousStatus === 'Completed' && updated.status !== 'Completed') {
      // Reverted from Completed: decrement count
      await adjustSubscriptionSessions(updated.clientId, -1);
    }

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a session record
 * @route   DELETE /api/sessions/:id
 * @access  Private (auth protected)
 */
export const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (req.user.role !== 'admin') {
      if (String(session.clientId) !== String(req.user.clientId)) {
        res.status(403);
        throw new Error('Forbidden: You can only delete your own sessions');
      }
    }

    // If it was completed, decrement completed count from active subscription
    if (session.status === 'Completed') {
      await adjustSubscriptionSessions(session.clientId, -1);
    }

    await Session.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
