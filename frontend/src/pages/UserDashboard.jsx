import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  DollarSign, 
  Activity, 
  Calendar, 
  Clock, 
  User 
} from 'lucide-react';
import { getClientStats } from '../services/clientService';
import { getSessions } from '../services/sessionService';
import useAuth from '../hooks/useAuth';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getClientStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching user dashboard statistics:', error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSessions = async () => {
      try {
        const response = await getSessions({ limit: 5 });
        if (response.success && response.data) {
          setSessions(response.data);
        }
      } catch (error) {
        console.error('Error fetching user dashboard sessions:', error.message);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchStats();
    fetchSessions();
  }, []);

  const cards = [
    { 
      name: 'Remaining Sessions', 
      count: stats ? stats.remainingSessions : 0, 
      desc: stats ? `Out of ${stats.totalSessions} total package sessions` : 'No package sessions', 
      icon: Activity, 
      color: 'text-brand-600 dark:text-brand-400 bg-brand-500/5 border-brand-500/10' 
    },
    { 
      name: 'Sessions Completed', 
      count: stats ? stats.completedSessions : 0, 
      desc: 'Therapy sessions attended', 
      icon: CheckCircle, 
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10' 
    },
    { 
      name: 'Active Memberships', 
      count: stats ? stats.activePlans : 0, 
      desc: 'Active wellness plans', 
      icon: CreditCard, 
      color: 'text-brand-600 dark:text-brand-400 bg-brand-500/5 border-brand-500/10' 
    },
    { 
      name: 'Total Contributions', 
      count: stats ? `$${stats.totalRevenue}` : '$0', 
      desc: 'Fully paid balances', 
      icon: DollarSign, 
      color: 'text-violet-650 dark:text-violet-455 bg-violet-500/5 border-violet-500/10' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
          <span>KineticAge Client Portal</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">
          Hello, {user ? user.name : 'Client'}
        </h1>
        <p className="text-sm text-theme-secondary">View your wellness programs, schedules, and payment ledger history.</p>
      </div>

      {/* Stats Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-theme-card border border-theme rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="w-8 h-8 bg-theme-primary rounded-lg"></div>
                <div className="w-12 h-4 bg-theme-primary rounded"></div>
              </div>
              <div className="h-6 bg-theme-primary rounded w-1/2"></div>
              <div className="h-3 bg-theme-primary rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const IconComp = card.icon;
            return (
              <div 
                key={card.name} 
                className={`bg-theme-card border rounded-2xl p-6 flex flex-col justify-between hover:shadow-theme-card transition-theme ${card.color}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="p-2 bg-theme-primary rounded-xl">
                      <IconComp className="w-5.5 h-5.5" />
                    </span>
                    <span className="text-2xl font-black tracking-tight text-theme-primary">
                      {card.count}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-theme-primary mt-4">{card.name}</h3>
                  <p className="text-theme-secondary text-xs mt-1.5 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Progress Overview Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Summary Table */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6 lg:col-span-2 shadow-theme-card transition-theme">
          <h2 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            My Upcoming Therapy Sessions
          </h2>
          <div className="overflow-x-auto">
            {sessionsLoading ? (
              <div className="py-12 text-center space-y-2">
                <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-6 h-6 mx-auto"></div>
                <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Loading Schedules...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-theme-muted">
                No sessions scheduled yet. Contact center admin.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-theme-secondary">
                <thead>
                  <tr className="border-b border-theme text-xs font-semibold uppercase text-theme-muted bg-theme-table-header">
                    <th className="py-3 px-4">Program Type</th>
                    <th className="py-3 px-4">Therapist</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 5).map((s) => (
                    <tr key={s._id} className="border-b border-theme hover:bg-theme-primary transition-theme">
                      <td className="py-3 px-4 font-semibold text-theme-primary">{s.programType}</td>
                      <td className="py-3 px-4 text-theme-muted">{s.therapistName}</td>
                      <td className="py-3 px-4 text-theme-muted">
                        {new Date(s.sessionDate).toLocaleDateString()} {s.startTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          s.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                            : s.status === 'Scheduled'
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-550/20'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6 flex flex-col justify-between shadow-theme-card transition-theme">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              Client Guidelines
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-theme-secondary">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>Please arrive at the center at least 10 minutes prior to scheduled therapy sessions.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Notify your attending therapist 24 hours in advance to reschedule any session.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span>Keep your medical profiles up-to-date with current health warnings or prescription edits.</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-theme text-[10px] text-theme-muted font-mono">
            Portal Connection: Secure MERN client session
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
