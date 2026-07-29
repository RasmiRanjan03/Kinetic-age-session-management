import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  CreditCard, 
  CheckSquare, 
  DollarSign, 
  FileText, 
  Calendar, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Download, 
  ChevronRight 
} from 'lucide-react';
import { getBusinessReport } from '../services/reportService';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // 'today' | '7days' | '30days' | 'month' | 'year'

  // Fetch report data on mount or filter change
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await getBusinessReport(filter);
      if (response.success && response.data) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filter]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    const summary = reportData.summary;
    const monthly = reportData.monthlyOverview;
    const client = reportData.clientStatus;
    const payment = reportData.payment;
    const session = reportData.session;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "KINETICAGE BUSINESS REPORT SUMMARY\n";
    csvContent += `Filter Range,${filter.toUpperCase()}\n`;
    csvContent += `Generated At,${new Date().toISOString()}\n\n`;

    csvContent += "METRIC,COUNT\n";
    csvContent += `Total Clients,${summary.totalClients}\n`;
    csvContent += `Active Clients,${summary.activeClients}\n`;
    csvContent += `Inactive Clients,${summary.inactiveClients}\n`;
    csvContent += `Total Subscriptions,${summary.totalSubscriptions}\n`;
    csvContent += `Active Subscriptions,${summary.activeSubscriptions}\n`;
    csvContent += `Sessions Completed,${summary.sessionsCompleted}\n`;
    csvContent += `Sessions Remaining,${summary.sessionsRemaining}\n`;
    csvContent += `Total Revenue Collected,${summary.totalRevenueCollected}\n`;
    csvContent += `Pending Payments,${summary.pendingPayments}\n\n`;

    csvContent += "MONTHLY OVERVIEW,VALUE\n";
    csvContent += `New Clients This Month,${monthly.newClientsThisMonth}\n`;
    csvContent += `Renewed Subscriptions,${monthly.renewedSubscriptions}\n`;
    csvContent += `Expired Subscriptions,${monthly.expiredSubscriptions}\n`;
    csvContent += `Sessions Conducted,${monthly.sessionsConducted}\n`;
    csvContent += `Revenue This Month,${monthly.revenueThisMonth}\n\n`;

    csvContent += "CLIENT STATUS COHORT,COUNT\n";
    csvContent += `Active,${client.activeClients}\n`;
    csvContent += `Inactive,${client.inactiveClients}\n`;
    csvContent += `Recently Joined,${client.recentlyJoined}\n`;
    csvContent += `Expired Plans,${client.expiredPlans}\n\n`;

    csvContent += "PAYMENT LEDGER,VALUE\n";
    csvContent += `Total Revenue Collected,${payment.totalRevenue}\n`;
    csvContent += `Total Pending Balance,${payment.totalPendingAmount}\n`;
    csvContent += `Paid Subscriptions,${payment.paidSubscriptions}\n`;
    csvContent += `Unpaid Subscriptions,${payment.unpaidSubscriptions}\n\n`;

    csvContent += "SESSION SUMMARY,COUNT\n";
    csvContent += `Total Sessions,${session.totalSessions}\n`;
    csvContent += `Completed Sessions,${session.completedSessions}\n`;
    csvContent += `Upcoming Sessions,${session.upcomingSessions}\n`;
    csvContent += `Missed Sessions,${session.missedSessions}\n\n`;

    csvContent += "RECENT ACTIVITY TIMELINE\n";
    csvContent += "Type,Description,Timestamp\n";
    reportData.recentActivities.forEach((act) => {
      csvContent += `"${act.type}","${act.desc}","${new Date(act.date).toLocaleString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kineticage_business_report_${filter}_${new Date().setDate(new Date().getDate())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export PDF (Trigger browser print window with clean styled styles)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>KineticAge</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>Reports</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">
            Performance Analytics
          </h1>
          <p className="text-sm text-theme-secondary">Summarize wellness directory statistics and enrollment billing ledgers</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-theme-card border border-theme rounded-xl p-1 flex items-center shadow-theme-card">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-theme ${
                  filter === opt.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-primary/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={loading || !reportData}
            className="bg-theme-card hover:bg-theme-primary border border-theme text-theme-secondary hover:text-theme-primary font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-theme shadow-theme-card flex items-center gap-1.5"
            title="Download CSV report summary"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-theme shadow-lg shadow-brand-600/10 flex items-center gap-1.5"
            title="Print PDF document layout"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="py-32 text-center space-y-3">
          <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8 mx-auto"></div>
          <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Compiling Analytics Data...</p>
        </div>
      ) : !reportData ? (
        <div className="bg-theme-card border border-theme rounded-2xl py-16 text-center space-y-3 shadow-theme-card">
          <span className="text-4xl">📭</span>
          <h3 className="font-bold text-theme-primary text-lg">No Reports Available</h3>
          <p className="text-xs text-theme-muted max-w-xs mx-auto">Please check connection bounds to MongoDB and verify that collection entries exist.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-4">
            {/* Total Clients */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                  <Users className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.totalClients}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Total Clients</h4>
              <p className="text-[10px] text-theme-muted">All registered profiles</p>
            </div>

            {/* Active Clients */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <UserCheck className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.activeClients}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Active Clients</h4>
              <p className="text-[10px] text-theme-muted">Wellness training participants</p>
            </div>

            {/* Inactive Clients */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-lg">
                  <UserX className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.inactiveClients}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Inactive Clients</h4>
              <p className="text-[10px] text-theme-muted">Suspended profiles</p>
            </div>

            {/* Total Subscriptions */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-amber-500/10 text-amber-550 dark:text-amber-400 rounded-lg">
                  <CreditCard className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.totalSubscriptions}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Total Subscriptions</h4>
              <p className="text-[10px] text-theme-muted">Historical memberships</p>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-lg">
                  <CheckSquare className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.activeSubscriptions}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Active Subscriptions</h4>
              <p className="text-[10px] text-theme-muted">Currently active billing tiers</p>
            </div>

            {/* Sessions Completed */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-violet-500/10 text-violet-650 dark:text-violet-400 rounded-lg">
                  <Activity className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.sessionsCompleted}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Sessions Completed</h4>
              <p className="text-[10px] text-theme-muted">Conducted training classes</p>
            </div>

            {/* Sessions Remaining */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
                  <Clock className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">{reportData.summary.sessionsRemaining}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Sessions Remaining</h4>
              <p className="text-[10px] text-theme-muted">Scheduled and missed plans</p>
            </div>

            {/* Total Revenue Collected */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 rounded-lg">
                  <DollarSign className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">${reportData.summary.totalRevenueCollected}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Total Revenue</h4>
              <p className="text-[10px] text-theme-muted">Collected fees ledger sum</p>
            </div>

            {/* Pending Payments */}
            <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between shadow-theme-card transition-theme lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="p-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 rounded-lg">
                  <TrendingUp className="w-4.5 h-4.5" />
                </span>
                <span className="text-xl font-black text-theme-primary">${reportData.summary.pendingPayments}</span>
              </div>
              <h4 className="font-bold text-xs text-theme-primary mt-3">Pending Amount</h4>
              <p className="text-[10px] text-theme-muted">Outstanding subscription balances</p>
            </div>
          </div>

          {/* Monthly Overview Section */}
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-card transition-theme">
            <h2 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Monthly Progress Status (Current Month Summary)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'New Clients', value: reportData.monthlyOverview.newClientsThisMonth, desc: 'Registered this month', icon: Users, color: 'text-brand-500' },
                { label: 'Renewed Subscriptions', value: reportData.monthlyOverview.renewedSubscriptions, desc: 'Renewed memberships', icon: CreditCard, color: 'text-emerald-500' },
                { label: 'Expired Subscriptions', value: reportData.monthlyOverview.expiredSubscriptions, desc: 'Terminated plans', icon: UserX, color: 'text-rose-500' },
                { label: 'Sessions Conducted', value: reportData.monthlyOverview.sessionsConducted, desc: 'Logs completed', icon: Activity, color: 'text-violet-500' },
                { label: 'Revenue This Month', value: `$${reportData.monthlyOverview.revenueThisMonth}`, desc: 'Payments logged', icon: DollarSign, color: 'text-emerald-600' },
              ].map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div key={index} className="bg-theme-primary p-4 border border-theme rounded-xl transition-theme">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-theme-muted">{item.label}</span>
                      <ItemIcon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="text-lg font-black text-theme-primary">{item.value}</div>
                    <div className="text-[9px] text-theme-muted mt-1">{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Breakdown Tables Group */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statuses Breakdown */}
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-card transition-theme">
              <h3 className="font-bold text-sm text-theme-primary mb-4">Client Demographics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Active Clients', val: reportData.clientStatus.activeClients, percent: reportData.summary.totalClients ? Math.round((reportData.clientStatus.activeClients / reportData.summary.totalClients) * 100) : 0, color: 'bg-emerald-500' },
                  { label: 'Inactive Clients', val: reportData.clientStatus.inactiveClients, percent: reportData.summary.totalClients ? Math.round((reportData.clientStatus.inactiveClients / reportData.summary.totalClients) * 100) : 0, color: 'bg-rose-500' },
                  { label: 'Recently Registered', val: reportData.clientStatus.recentlyJoined, percent: null, color: 'bg-brand-500' },
                  { label: 'Expired Plan Memberships', val: reportData.clientStatus.expiredPlans, percent: null, color: 'bg-yellow-500' },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-theme-secondary">
                      <span>{row.label}</span>
                      <span className="text-theme-primary">{row.val} {row.percent !== null && `(${row.percent}%)`}</span>
                    </div>
                    {row.percent !== null && (
                      <div className="w-full bg-theme-primary h-1.5 rounded-full overflow-hidden border border-theme">
                        <div className={`h-full ${row.color}`} style={{ width: `${row.percent}%` }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Ledger breakdown */}
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-card transition-theme">
              <h3 className="font-bold text-sm text-theme-primary mb-4">Payment Statistics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Revenue Collected', val: `$${reportData.payment.totalRevenue}`, type: 'Collected' },
                  { label: 'Total Pending Amount', val: `$${reportData.payment.totalPendingAmount}`, type: 'Outstanding' },
                  { label: 'Paid Subscriptions', val: reportData.payment.paidSubscriptions, type: 'Count' },
                  { label: 'Unpaid Subscriptions', val: reportData.payment.unpaidSubscriptions, type: 'Count' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-theme last:border-0">
                    <div>
                      <h5 className="font-semibold text-xs text-theme-primary">{row.label}</h5>
                      <span className="text-[9px] text-theme-muted uppercase tracking-wider">{row.type}</span>
                    </div>
                    <span className="font-bold text-sm text-theme-primary">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions reports */}
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-card transition-theme">
              <h3 className="font-bold text-sm text-theme-primary mb-4">Sessions Attendance Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Completed Sessions', val: reportData.session.completedSessions, percent: reportData.session.totalSessions ? Math.round((reportData.session.completedSessions / reportData.session.totalSessions) * 100) : 0, color: 'bg-emerald-500' },
                  { label: 'Upcoming Sessions', val: reportData.session.upcomingSessions, percent: reportData.session.totalSessions ? Math.round((reportData.session.upcomingSessions / reportData.session.totalSessions) * 100) : 0, color: 'bg-brand-500' },
                  { label: 'Missed Sessions', val: reportData.session.missedSessions, percent: reportData.session.totalSessions ? Math.round((reportData.session.missedSessions / reportData.session.totalSessions) * 100) : 0, color: 'bg-rose-500' },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-theme-secondary">
                      <span>{row.label}</span>
                      <span className="text-theme-primary">{row.val} ({row.percent}%)</span>
                    </div>
                    <div className="w-full bg-theme-primary h-1.5 rounded-full overflow-hidden border border-theme">
                      <div className={`h-full ${row.color}`} style={{ width: `${row.percent}%` }}></div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-theme flex justify-between items-center text-xs">
                  <span className="font-semibold text-theme-muted">Total Scheduled Sessions:</span>
                  <span className="font-bold text-theme-primary text-sm">{reportData.session.totalSessions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline Panel (Latest 10 activities) */}
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-card transition-theme">
            <h2 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              Latest Clinic Activities (Last 10 Actions)
            </h2>
            <div className="divide-y divide-theme">
              {reportData.recentActivities.map((act, index) => (
                <div key={index} className="py-3.5 flex justify-between items-center text-sm hover:bg-theme-primary/10 transition-colors rounded-lg px-2">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-theme-primary rounded-xl border border-theme text-sm">{act.icon}</span>
                    <div>
                      <h4 className="font-semibold text-theme-primary text-xs">{act.type}</h4>
                      <p className="text-theme-secondary text-[11px] mt-0.5">{act.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-theme-muted font-medium shrink-0">
                    {new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
