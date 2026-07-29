import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  MinusCircle
} from 'lucide-react';
import { 
  getSessions, 
  logSession, 
  updateSession, 
  deleteSession,
  getSessionById
} from '../services/sessionService';
import { getClients } from '../services/clientService';
import useAuth from '../hooks/useAuth';

const Sessions = () => {
  const { user, clientId } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Stats Card state
  const [stats, setStats] = useState({
    total: 0,
    completedToday: 0,
    upcoming: 0,
    missed: 0,
    attendanceRate: 100,
    completionRate: 100,
  });

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState(null); // contains { session, previousSessions }
  const [deleteConfirmSession, setDeleteConfirmSession] = useState(null);

  // Quick Action Modal states
  const [showQuickCompleteModal, setShowQuickCompleteModal] = useState(false);
  const [showQuickRescheduleModal, setShowQuickRescheduleModal] = useState(false);
  const [showQuickCancelModal, setShowQuickCancelModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Form States (Schedule New Session)
  const [formClientId, setFormClientId] = useState('');
  const [formTherapist, setFormTherapist] = useState('');
  const [formProgram, setFormProgram] = useState('Physiotherapy');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formDuration, setFormDuration] = useState('60');
  const [formNotes, setFormNotes] = useState('');
  const [formAttendance, setFormAttendance] = useState('Absent');
  const [formStatus, setFormStatus] = useState('Scheduled');

  // Quick action form states
  const [quickNotes, setQuickNotes] = useState('');
  const [quickAttendance, setQuickAttendance] = useState('Present');
  const [quickDate, setQuickDate] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('');
  const [quickEndTime, setQuickEndTime] = useState('');
  const [quickDuration, setQuickDuration] = useState('60');

  // Form error & loading
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const programs = [
    'Physiotherapy', 
    'Yoga', 
    'Mobility Training', 
    'Balance Training', 
    'Stretching', 
    'Strength Training', 
    'Rehabilitation Exercise', 
    'Custom Program'
  ];

  const fetchSessionsAndClients = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sessions
      const sessionsResponse = await getSessions({
        status: statusFilter,
        attendance: attendanceFilter,
        programType: programFilter,
        search: searchQuery,
        sortBy
      });
      if (sessionsResponse.success && sessionsResponse.data) {
        setSessions(sessionsResponse.data);
        calculateStats(sessionsResponse.data);
      }

      // 2. Fetch Clients (Active ones for scheduling)
      const clientsResponse = await getClients();
      if (clientsResponse.success && clientsResponse.data) {
        setClients(clientsResponse.data.filter(c => c.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to fetch sessions metadata:', error.message);
      triggerToast('⚠️ Error loading therapy sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsAndClients();
  }, [statusFilter, attendanceFilter, programFilter, searchQuery, sortBy]);

  const calculateStats = (sessionList) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = sessionList.length;
    let completedToday = 0;
    let upcoming = 0;
    let missed = 0;
    let attended = 0;
    let concluded = 0;
    let completed = 0;

    sessionList.forEach((s) => {
      const sDateStr = new Date(s.sessionDate).toISOString().split('T')[0];
      if (s.status === 'Completed' && sDateStr === todayStr) {
        completedToday++;
      }
      if (s.status === 'Scheduled') {
        upcoming++;
      }
      if (s.status === 'Missed') {
        missed++;
      }
      if (s.status === 'Completed') {
        completed++;
      }

      if (s.status === 'Completed' || s.status === 'Missed') {
        concluded++;
        if (s.attendance === 'Present' || s.attendance === 'Late') {
          attended++;
        }
      }
    });

    const attendanceRate = concluded > 0 ? Math.round((attended / concluded) * 100) : 100;
    const completionRate = concluded > 0 ? Math.round((completed / concluded) * 100) : 100;

    setStats({
      total,
      completedToday,
      upcoming,
      missed,
      attendanceRate,
      completionRate,
    });
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Form Validations
  const validateSessionForm = (date, start, end, dur, notes, status, client, therapist) => {
    const isStaff = user && user.role === 'admin';
    if (isStaff && client !== undefined && !client) return 'Please select a Client';
    if (isStaff && therapist !== undefined && !therapist.trim()) return 'Therapist name is required';
    
    if (!date) return 'Session date is required';
    
    // Date not in past for Scheduled
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (status === 'Scheduled' && new Date(date) < today) {
      return 'Cannot schedule sessions in the past';
    }

    if (isStaff) {
      if (!start || !end) return 'Start and End times are required';
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      if (endMin <= startMin) {
        return 'End time must be later than start time';
      }

      const durationNum = Number(dur);
      if (isNaN(durationNum) || durationNum <= 0) return 'Duration must be a positive number';
    } else {
      if (!start) return 'Preferred Time is required';
    }

    if (notes && notes.length > 500) return 'Notes cannot exceed 500 characters';

    return '';
  };

  // Open Schedule modal
  const handleOpenScheduleModal = () => {
    if (user && user.role !== 'admin') {
      setFormClientId(clientId || user.clientId || '');
    } else {
      setFormClientId('');
    }
    setFormTherapist('');
    setFormProgram('Physiotherapy');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormDuration('60');
    setFormNotes('');
    setFormAttendance('Absent');
    setFormStatus('Scheduled');
    setFormError('');
    setShowScheduleModal(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (session) => {
    setSelectedSessionData({ session });
    setFormTherapist(session.therapistName);
    setFormProgram(session.programType);
    setFormDate(new Date(session.sessionDate).toISOString().split('T')[0]);
    setFormStartTime(session.startTime);
    setFormEndTime(session.endTime);
    setFormDuration(session.duration.toString());
    setFormNotes(session.notes);
    setFormAttendance(session.attendance);
    setFormStatus(session.status);
    setFormError('');
    setShowEditModal(true);
  };

  const handleRejectRequest = async (se) => {
    if (window.confirm(`Are you sure you want to reject the session request for ${se.clientId?.fullName || 'this client'}?`)) {
      try {
        const response = await updateSession(se._id, {
          clientId: se.clientId?._id || se.clientId,
          therapistName: se.therapistName,
          programType: se.programType,
          sessionDate: se.sessionDate,
          startTime: se.startTime,
          endTime: se.endTime,
          duration: se.duration,
          notes: se.notes,
          attendance: se.attendance,
          status: 'Rejected',
        });
        if (response.success) {
          triggerToast('Session request rejected');
          fetchSessionsAndClients();
        }
      } catch (error) {
        console.error(error);
        triggerToast('Failed to reject session request');
      }
    }
  };

  // Open View modal (fetches full logs & previous sessions list)
  const handleOpenViewModal = async (session) => {
    setLoading(true);
    try {
      const response = await getSessionById(session._id);
      if (response.success && response.data) {
        setSelectedSessionData(response.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Error loading session details');
    } finally {
      setLoading(false);
    }
  };

  // Schedule Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const err = validateSessionForm(
      formDate, 
      formStartTime, 
      formEndTime, 
      formDuration, 
      formNotes, 
      formStatus, 
      formClientId, 
      formTherapist
    );
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        clientId: formClientId,
        therapistName: formTherapist.trim(),
        programType: formProgram,
        sessionDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        duration: parseFloat(formDuration),
        notes: formNotes.trim(),
        attendance: formAttendance,
        status: formStatus,
      };

      const response = await logSession(data);
      if (response.success) {
        triggerToast('Session scheduled successfully');
        setShowScheduleModal(false);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to schedule session');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const err = validateSessionForm(
      formDate, 
      formStartTime, 
      formEndTime, 
      formDuration, 
      formNotes, 
      formStatus, 
      undefined, 
      formTherapist
    );
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        therapistName: formTherapist.trim(),
        programType: formProgram,
        sessionDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        duration: parseFloat(formDuration),
        notes: formNotes.trim(),
        attendance: formAttendance,
        status: formStatus,
      };

      const response = await updateSession(selectedSessionData.session._id, data);
      if (response.success) {
        triggerToast('Session parameters updated');
        setShowEditModal(false);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to update session details');
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Action - Mark Completed
  const handleQuickComplete = async (e) => {
    e.preventDefault();
    if (!selectedSessionData?.session) return;
    setFormError('');

    if (quickNotes && quickNotes.length > 500) {
      setFormError('Notes cannot exceed 500 characters');
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        status: 'Completed',
        attendance: quickAttendance,
        notes: quickNotes.trim(),
      };
      const response = await updateSession(selectedSessionData.session._id, data);
      if (response.success) {
        triggerToast('Session completed logged successfully');
        setShowQuickCompleteModal(false);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to complete session');
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Action - Reschedule
  const handleQuickReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSessionData?.session) return;
    setFormError('');

    const err = validateSessionForm(
      quickDate, 
      quickStartTime, 
      quickEndTime, 
      quickDuration, 
      undefined, 
      'Rescheduled', 
      undefined, 
      'None'
    );
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        status: 'Rescheduled',
        sessionDate: quickDate,
        startTime: quickStartTime,
        endTime: quickEndTime,
        duration: parseFloat(quickDuration),
      };
      const response = await updateSession(selectedSessionData.session._id, data);
      if (response.success) {
        triggerToast('Session rescheduled successfully');
        setShowQuickRescheduleModal(false);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to reschedule session');
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Action - Cancel
  const handleQuickCancel = async () => {
    if (!selectedSessionData?.session) return;
    try {
      const data = { status: 'Cancelled', attendance: 'Absent' };
      const response = await updateSession(selectedSessionData.session._id, data);
      if (response.success) {
        triggerToast('Session cancelled successfully');
        setShowQuickCancelModal(false);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to cancel session');
    }
  };

  // Delete Session
  const handleDeleteSession = async () => {
    if (!deleteConfirmSession) return;
    try {
      const response = await deleteSession(deleteConfirmSession._id);
      if (response.success) {
        triggerToast('Session record removed from database');
        setDeleteConfirmSession(null);
        fetchSessionsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to delete session record');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>KineticAge</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>Sessions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">Daily Log Sessions</h1>
          <p className="text-sm text-theme-secondary">Manage scheduling, therapist assignments, and attendance reports</p>
        </div>
        <button
          onClick={handleOpenScheduleModal}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {user && user.role === 'admin' ? 'Schedule Session' : 'Request Session'}
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Sessions', val: stats.total, desc: 'Scheduled logs', icon: Calendar, color: 'text-brand-500 bg-brand-500/10' },
          { label: 'Completed Today', val: stats.completedToday, desc: 'Conducted training', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Upcoming Plans', val: stats.upcoming, desc: 'Scheduled future logs', icon: Clock, color: 'text-sky-500 bg-sky-500/10' },
          { label: 'Missed Sessions', val: stats.missed, desc: 'Unattended sessions', icon: XCircle, color: 'text-rose-500 bg-rose-500/10' },
          { label: 'Attendance Rate', val: `${stats.attendanceRate}%`, desc: 'Concluded logs attendance', icon: TrendingUp, color: 'text-violet-500 bg-violet-500/10' },
          { label: 'Completion Rate', val: `${stats.completionRate}%`, desc: 'Completed vs Missed', icon: Award, color: 'text-emerald-600 bg-emerald-500/10' },
        ].map((c, idx) => {
          const CardIcon = c.icon;
          return (
            <div key={idx} className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme">
              <div className="flex justify-between items-start">
                <span className={`p-1.5 rounded-lg ${c.color}`}>
                  <CardIcon className="w-4 h-4" />
                </span>
                <span className="text-lg font-black text-theme-primary">{c.val}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">{c.label}</h4>
              <p className="text-[10px] text-theme-muted">{c.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Control bar: Search, Filter, Sort */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center transition-theme">
        <div className="relative w-full lg:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, therapist, program type..."
            className="w-full bg-theme-primary border border-theme-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:border-brand-500 focus:outline-none transition-theme"
          />
          <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-theme-muted hover:text-theme-primary absolute right-3 top-3.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Status filter selection */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Statuses</option>
            <option value="Today's Sessions">Today's Sessions</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Missed">Missed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rescheduled">Rescheduled</option>
          </select>

          {/* Attendance filter */}
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Attendances</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
          </select>

          {/* Program filter */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Programs</option>
            {programs.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="Newest">Newest Date</option>
            <option value="Oldest">Oldest Date</option>
            <option value="Time">Start Time</option>
            <option value="Status">Status</option>
          </select>
        </div>
      </div>

      {/* Main Sessions Table */}
      <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden shadow-theme-card transition-theme">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8 mx-auto"></div>
            <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Loading Session Records...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="text-4xl">🏃‍♂️</span>
            <h3 className="font-bold text-theme-primary text-lg">No Sessions Available</h3>
            <p className="text-xs text-theme-muted max-w-xs mx-auto">No training session records match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-secondary">
              <thead>
                <tr className="border-b border-theme text-xs font-semibold uppercase text-theme-muted bg-theme-table-header">
                  <th className="px-6 py-4">Session ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Therapist</th>
                  <th className="px-6 py-4">Program Type</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((se) => (
                  <tr key={se._id} className="border-b border-theme hover:bg-theme-primary transition-theme">
                    <td className="px-6 py-4 font-mono text-[10px] text-theme-muted">
                      #{se._id.substring(se._id.length - 6)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-theme-primary">{se.clientId?.fullName || 'Removed Client'}</div>
                      <div className="text-[10px] text-theme-muted">{se.clientId?.age || ''} yrs, {se.clientId?.gender || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-theme-primary">{se.therapistName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-theme-primary">
                      {se.programType}
                    </td>
                    <td className="px-6 py-4 text-xs text-theme-primary">
                      <div>{new Date(se.sessionDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-theme-muted font-mono">{se.startTime} - {se.endTime}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-theme-primary">
                      {se.duration} min
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        se.attendance === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : se.attendance === 'Late'
                          ? 'bg-yellow-500/10 text-yellow-650 dark:text-yellow-450 border border-yellow-550/20'
                          : se.attendance === 'Excused'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-theme'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-550/20'
                      }`}>
                        {se.attendance}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                        se.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : se.status === 'Scheduled'
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : se.status === 'Missed'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                          : se.status === 'Cancelled'
                          ? 'bg-theme-primary text-theme-muted border border-theme'
                          : se.status === 'Pending Approval'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : se.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-550/20'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-450'
                      }`}>
                        {se.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Always allow viewing details */}
                        <button
                          onClick={() => handleOpenViewModal(se)}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-600 dark:hover:text-brand-400 rounded-lg border border-theme transition-theme"
                          title="View Log Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin Action Buttons */}
                        {user && user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(se)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-650 rounded-lg border border-theme transition-theme"
                              title="Edit Session Params"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            {se.status === 'Scheduled' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedSessionData({ session: se });
                                    setQuickAttendance('Present');
                                    setQuickNotes('');
                                    setFormError('');
                                    setShowQuickCompleteModal(true);
                                  }}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 rounded-lg border border-emerald-500/20 transition-theme"
                                  title="Mark Completed"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSessionData({ session: se });
                                    setQuickDate(new Date(se.sessionDate).toISOString().split('T')[0]);
                                    setQuickStartTime(se.startTime);
                                    setQuickEndTime(se.endTime);
                                    setQuickDuration(se.duration.toString());
                                    setFormError('');
                                    setShowQuickRescheduleModal(true);
                                  }}
                                  className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-650 rounded-lg border border-yellow-500/20 transition-theme"
                                  title="Reschedule Date"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSessionData({ session: se });
                                    setShowQuickCancelModal(true);
                                  }}
                                  className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 rounded-lg border border-theme transition-theme"
                                  title="Cancel Session"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Admin can view/approve pending requests */}
                            {se.status === 'Pending Approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(se)}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 rounded-lg border border-emerald-500/20 transition-theme"
                                  title="Approve Request"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(se)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-650 rounded-lg border border-rose-550/20 transition-theme"
                                  title="Reject Request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setDeleteConfirmSession(se)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-455 rounded-lg border border-theme transition-theme"
                              title="Remove Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* User Action Buttons */}
                        {user && user.role !== 'admin' && (
                          <>
                            {/* User can cancel their own scheduled session */}
                            {se.status === 'Scheduled' && (
                              <button
                                onClick={() => {
                                  setSelectedSessionData({ session: se });
                                  setShowQuickCancelModal(true);
                                }}
                                className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 rounded-lg border border-theme transition-theme"
                                title="Cancel Session"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* User can delete their own pending session request */}
                            {se.status === 'Pending Approval' && (
                              <button
                                onClick={() => setDeleteConfirmSession(se)}
                                className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-455 rounded-lg border border-theme transition-theme"
                                title="Remove Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Schedule Training Session</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Select Client */}
              {user && user.role === 'admin' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Select Client *</label>
                  {clients.length === 0 ? (
                    <p className="text-xs text-rose-600 font-semibold py-1">
                      No clients found. Please create a client first.
                    </p>
                  ) : (
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      required
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none transition-theme"
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.fullName} (Age {c.age})</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              {/* Therapist Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Assigned Therapist Name *</label>
                <input
                  type="text"
                  value={formTherapist}
                  onChange={(e) => setFormTherapist(e.target.value)}
                  placeholder="e.g. Dr. Emily Watson"
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Program Type selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Program Type *</label>
                <select
                  value={formProgram}
                  onChange={(e) => setFormProgram(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none transition-theme"
                >
                  {programs.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Session Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Times range & duration */}
              {user && user.role === 'admin' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary">Start Time *</label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      required
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary">End Time *</label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      required
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary">Duration (Min) *</label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      required
                      min="1"
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Preferred Time *</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
              )}

              {/* Status and attendance */}
              {user && user.role === 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary">Session Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Missed">Missed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-secondary">Attendance Logs</label>
                    <select
                      value={formAttendance}
                      onChange={(e) => setFormAttendance(e.target.value)}
                      className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Therapist notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Therapist Notes (Max 500 chars)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Completed exercises successfully. Reported mild knee discomfort..."
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Submitting...' : (user && user.role === 'admin' ? 'Save Session' : 'Submit Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Edit Training Session</h3>
              <button onClick={() => setShowEditModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Therapist Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Assigned Therapist Name *</label>
                <input
                  type="text"
                  value={formTherapist}
                  onChange={(e) => setFormTherapist(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Program Type selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Program Type *</label>
                <select
                  value={formProgram}
                  onChange={(e) => setFormProgram(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none transition-theme"
                >
                  {programs.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Session Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Times range & duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Start Time *</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">End Time *</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Duration (Min) *</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
              </div>

              {/* Status and attendance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Session Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Missed">Missed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Attendance Logs</label>
                  <select
                    value={formAttendance}
                    onChange={(e) => setFormAttendance(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Therapist Notes (Max 500 chars)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Saving...' : 'Update Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Action: Mark Completed Modal */}
      {showQuickCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-theme-card animate-modal-box transition-theme">
            <h3 className="font-bold text-lg text-theme-primary">Log Session Progress</h3>
            <p className="text-xs text-theme-secondary">
              Configure attendance outcomes and write notes for <strong className="text-theme-primary">{selectedSessionData?.session?.clientId?.fullName}</strong>.
            </p>

            <form onSubmit={handleQuickComplete} className="space-y-4">
              {formError && (
                <div className="text-xs text-rose-500">{formError}</div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Attendance Status</label>
                <select
                  value={quickAttendance}
                  onChange={(e) => setQuickAttendance(e.target.value)}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-secondary focus:outline-none transition-theme"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Therapist Notes (Max 500 characters)</label>
                <textarea
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  placeholder="e.g. Completed all exercises successfully. Reported mild knee discomfort."
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCompleteModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-xs py-2 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Saving...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Action: Reschedule Modal */}
      {showQuickRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-theme-card animate-modal-box transition-theme">
            <h3 className="font-bold text-lg text-theme-primary">Reschedule Session Date</h3>
            <p className="text-xs text-theme-secondary">
              Update timing parameters for <strong className="text-theme-primary">{selectedSessionData?.session?.clientId?.fullName}</strong>.
            </p>

            <form onSubmit={handleQuickReschedule} className="space-y-4">
              {formError && (
                <div className="text-xs text-rose-500">{formError}</div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">New Date *</label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Start Time</label>
                  <input
                    type="time"
                    value={quickStartTime}
                    onChange={(e) => setQuickStartTime(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">End Time</label>
                  <input
                    type="time"
                    value={quickEndTime}
                    onChange={(e) => setQuickEndTime(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Duration (M)</label>
                  <input
                    type="number"
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-2 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickRescheduleModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-xs py-2 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Action: Cancel Modal */}
      {showQuickCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Cancel Session?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Confirm cancellation of session for <strong className="text-theme-primary">{selectedSessionData?.session?.clientId?.fullName}</strong>? Status will be updated to "Cancelled".
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowQuickCancelModal(false)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Go Back
              </button>
              <button
                onClick={handleQuickCancel}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2 rounded-xl transition-theme shadow-lg"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Session Details Modal */}
      {showViewModal && selectedSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Therapy Session Log Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-5 text-xs text-theme-secondary leading-relaxed">
              {/* Client information */}
              <div>
                <h4 className="font-bold text-[10px] text-brand-500 uppercase tracking-wider mb-2">Client Information</h4>
                <div className="grid grid-cols-2 gap-3 bg-theme-primary p-3 border border-theme rounded-xl">
                  <div>
                    <span className="text-theme-muted block">Client Name:</span>
                    <strong className="text-theme-primary">{selectedSessionData.session.clientId?.fullName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Age / Gender:</span>
                    <strong className="text-theme-primary">{selectedSessionData.session.clientId?.age || 'N/A'} yrs, {selectedSessionData.session.clientId?.gender || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Subscription Status:</span>
                    <strong className="text-theme-primary">{selectedSessionData.session.clientId?.subscriptionStatus || 'None'}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Payment Status:</span>
                    <strong className={
                      selectedSessionData.session.clientId?.subscriptionStatus === 'Active'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-rose-600 dark:text-rose-455 font-bold'
                    }>
                      {selectedSessionData.session.clientId?.subscriptionStatus === 'Active'
                        ? 'Paid / Active'
                        : 'Payment Pending'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Therapist & program details */}
              <div>
                <h4 className="font-bold text-[10px] text-brand-500 uppercase tracking-wider mb-2">Program Details</h4>
                <div className="grid grid-cols-2 gap-2 bg-theme-primary p-3 border border-theme rounded-xl">
                  <div>
                    <span className="text-theme-muted block">Therapist:</span>
                    <strong className="text-theme-primary">{selectedSessionData.session.therapistName}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Program:</span>
                    <strong className="text-theme-primary">{selectedSessionData.session.programType}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Schedule Date:</span>
                    <span className="text-theme-primary font-semibold">{new Date(selectedSessionData.session.sessionDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Time slot:</span>
                    <span className="text-theme-primary font-mono">{selectedSessionData.session.startTime} - {selectedSessionData.session.endTime} ({selectedSessionData.session.duration} min)</span>
                  </div>
                </div>
              </div>

              {/* Attendance & Notes */}
              <div>
                <h4 className="font-bold text-[10px] text-brand-500 uppercase tracking-wider mb-2">Therapist Notes</h4>
                <div className="bg-theme-primary p-3 border border-theme rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <span className="text-theme-muted">Attendance:</span>
                    <span className="font-semibold text-theme-primary">{selectedSessionData.session.attendance}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-theme-muted">Status Outcome:</span>
                    <span className="font-semibold text-theme-primary">{selectedSessionData.session.status}</span>
                  </div>
                  <div className="pt-2 border-t border-theme">
                    <span className="text-theme-muted block">Clinical Session Notes:</span>
                    <p className="text-theme-primary mt-1 italic font-medium">
                      "{selectedSessionData.session.notes || 'No progress notes logged.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Previous session history */}
              {selectedSessionData.previousSessions && selectedSessionData.previousSessions.length > 0 && (
                <div>
                  <h4 className="font-bold text-[10px] text-brand-500 uppercase tracking-wider mb-2">Previous Session History</h4>
                  <div className="max-h-24 overflow-y-auto border border-theme rounded-xl divide-y divide-theme px-2 bg-theme-primary">
                    {selectedSessionData.previousSessions.map((prev, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-[10px]">
                        <div>
                          <strong className="text-theme-primary">{prev.programType}</strong>
                          <span className="text-theme-muted block">{new Date(prev.sessionDate).toLocaleDateString()} ({prev.startTime})</span>
                        </div>
                        <span className="font-semibold text-theme-muted uppercase">{prev.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-theme-primary border-t border-theme flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-theme"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Remove Session Log?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Delete training session record for <strong className="text-theme-primary">{deleteConfirmSession.clientId?.fullName}</strong>? This database action is irreversible.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmSession(null)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2 rounded-xl transition-theme shadow-lg"
              >
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-theme-card border border-emerald-500/50 text-theme-primary px-5 py-3.5 rounded-2xl shadow-theme-card flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-300">
          <div className="w-5 h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Sessions;
