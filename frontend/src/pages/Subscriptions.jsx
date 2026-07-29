import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  DollarSign, 
  Search, 
  Calendar, 
  Plus, 
  UserPlus, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Edit3, 
  Printer, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  getSubscriptions, 
  createSubscription, 
  renewSubscription, 
  cancelSubscription, 
  deleteSubscription 
} from '../services/subscriptionService';
import { getClients } from '../services/clientService';
import useAuth from '../hooks/useAuth';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');

  // Stats Card data
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
    renewedThisMonth: 0,
    revenue: 0,
  });

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState(null);
  const [cancelConfirmSub, setCancelConfirmSub] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Form States (Assign & Renew)
  const [assignClientId, setAssignClientId] = useState('');
  const [assignPlanName, setAssignPlanName] = useState('1 Month Wellness');
  const [assignDescription, setAssignDescription] = useState('Ideal for assessment and short-term assessment');
  const [assignPrice, setAssignPrice] = useState('80');
  const [assignDuration, setAssignDuration] = useState('1');
  const [assignSessions, setAssignSessions] = useState('8');
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignPaymentMethod, setAssignPaymentMethod] = useState('Cash');
  const [assignAmountPaid, setAssignAmountPaid] = useState('80');

  // Form States (Renew)
  const [renewPrice, setRenewPrice] = useState('');
  const [renewDuration, setRenewDuration] = useState('1');
  const [renewSessions, setRenewSessions] = useState('8');
  const [renewAmountPaid, setRenewAmountPaid] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Cash');

  // Form error
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form validation field touched states
  const [touched, setTouched] = useState({});

  // Preset wellness plans
  const presetPlans = [
    { name: '1 Month Wellness', price: '80', duration: '1', sessions: '8', desc: 'Ideal for short-term assessment and rehab.', benefits: 'Fitness assessment, 8 sessions, basic support' },
    { name: '3 Month Wellness', price: '220', duration: '3', sessions: '24', desc: 'Standard option for mobility improvement.', benefits: 'Knee/hip assess, 24 sessions, progress tracker' },
    { name: '6 Month Wellness', price: '400', duration: '6', sessions: '48', desc: 'Long term senior strength maintenance.', benefits: 'Senior strength check, 48 sessions, coaching' },
    { name: '12 Month Wellness', price: '750', duration: '12', sessions: '96', desc: 'Annual plan for total health optimization.', benefits: 'Annual checkups, 96 sessions, coaching access' },
  ];

  const fetchSubscriptionsAndClients = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscriptions
      const subResponse = await getSubscriptions({ 
        status: statusFilter, 
        search: searchQuery, 
        sortBy 
      });
      if (subResponse.success && subResponse.data) {
        setSubscriptions(subResponse.data);
        calculateStats(subResponse.data);
      }

      // 2. Fetch Clients (for dropdown assignment list)
      const clientResponse = await getClients();
      if (clientResponse.success && clientResponse.data) {
        // Filter out inactive clients from assigning memberships
        setClients(clientResponse.data.filter(c => c.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to load subscriptions data:', error.message);
      triggerToast('⚠️ Error loading subscription memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsAndClients();
  }, [statusFilter, searchQuery, sortBy]);

  // Utility to count stats from loaded database records
  const calculateStats = (subList) => {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const total = subList.length;
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    let renewedThisMonth = 0;
    let revenue = 0;

    subList.forEach((sub) => {
      if (sub.status === 'Active' || sub.status === 'Expiring Soon') active++;
      if (sub.status === 'Expired') expired++;
      if (sub.status === 'Expiring Soon') expiringSoon++;
      
      // Count renewals in the current month
      const hasRenewedThisMonth = sub.renewalHistory.some(r => new Date(r.renewalDate) >= startOfCurrentMonth);
      if (hasRenewedThisMonth) renewedThisMonth++;

      // Revenue aggregate
      revenue += (sub.amountPaid || 0);
      sub.renewalHistory.forEach(r => {
        revenue += (r.amountPaid || 0);
      });
    });

    setStats({ total, active, expired, expiringSoon, renewedThisMonth, revenue });
  };

  // Toast notifier
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validate form elements
  const validateAssignForm = () => {
    if (!assignClientId) return 'Please select a Client';
    if (!assignPlanName.trim()) return 'Plan name is required';
    
    const priceNum = Number(assignPrice);
    if (isNaN(priceNum) || priceNum < 0) return 'Price must be a positive number';

    const durNum = Number(assignDuration);
    if (!Number.isInteger(durNum) || durNum <= 0) return 'Duration must be a positive integer';

    if (!assignStartDate) return 'Start date is required';
    
    const paidNum = Number(assignAmountPaid);
    if (isNaN(paidNum) || paidNum < 0) return 'Amount paid cannot be negative';
    if (paidNum > priceNum) return 'Amount paid cannot exceed the subscription price';

    return '';
  };

  const validateRenewForm = () => {
    const priceNum = Number(renewPrice);
    if (isNaN(priceNum) || priceNum < 0) return 'Price must be a positive number';

    const durNum = Number(renewDuration);
    if (!Number.isInteger(durNum) || durNum <= 0) return 'Duration must be a positive integer';

    const paidNum = Number(renewAmountPaid);
    if (isNaN(paidNum) || paidNum < 0) return 'Amount paid cannot be negative';
    if (paidNum > priceNum) return 'Amount paid cannot exceed price';

    return '';
  };

  // Preset plan selector change
  const handleSelectPresetPlan = (plan) => {
    setAssignPlanName(plan.name);
    setAssignDescription(plan.desc);
    setAssignPrice(plan.price);
    setAssignDuration(plan.duration);
    setAssignSessions(plan.sessions);
    setAssignAmountPaid(plan.price);
  };

  // Open assigns modal
  const handleOpenAssignModal = () => {
    setAssignClientId('');
    setAssignPlanName('1 Month Wellness');
    setAssignDescription('Ideal for assessment and short-term assessment');
    setAssignPrice('80');
    setAssignDuration('1');
    setAssignSessions('8');
    setAssignStartDate(new Date().toISOString().split('T')[0]);
    setAssignPaymentMethod('Cash');
    setAssignAmountPaid('80');
    setFormError('');
    setTouched({});
    setShowAssignModal(true);
  };

  // Open renews modal
  const handleOpenRenewModal = (sub) => {
    setSelectedSub(sub);
    setRenewPrice(sub.price.toString());
    setRenewDuration(sub.durationMonths.toString());
    setRenewSessions(sub.totalSessions.toString());
    setRenewAmountPaid(sub.price.toString());
    setRenewPaymentMethod('Cash');
    setFormError('');
    setTouched({});
    setShowRenewModal(true);
  };

  // Create Subscription Form Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const err = validateAssignForm();
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        clientId: assignClientId,
        planName: assignPlanName.trim(),
        planDescription: assignDescription.trim(),
        price: parseFloat(assignPrice),
        durationMonths: parseInt(assignDuration),
        totalSessions: parseInt(assignSessions || 0),
        startDate: assignStartDate,
        paymentMethod: assignPaymentMethod,
        amountPaid: parseFloat(assignAmountPaid || 0),
      };

      const response = await createSubscription(data);
      if (response.success) {
        triggerToast('Membership assigned successfully');
        setShowAssignModal(false);
        fetchSubscriptionsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  // Renew Subscription Form Submit
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const err = validateRenewForm();
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        price: parseFloat(renewPrice),
        durationMonths: parseInt(renewDuration),
        totalSessions: parseInt(renewSessions || 0),
        amountPaid: parseFloat(renewAmountPaid || 0),
        paymentMethod: renewPaymentMethod,
      };

      const response = await renewSubscription(selectedSub._id, data);
      if (response.success) {
        triggerToast('Membership renewed successfully');
        setShowRenewModal(false);
        fetchSubscriptionsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to renew subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  // Cancel Subscription
  const handleCancelSub = async () => {
    if (!cancelConfirmSub) return;
    try {
      const response = await cancelSubscription(cancelConfirmSub._id);
      if (response.success) {
        triggerToast('Membership cancelled successfully');
        setCancelConfirmSub(null);
        fetchSubscriptionsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to cancel subscription');
    }
  };

  // Delete Subscription
  const handleDeleteSub = async () => {
    if (!deleteConfirmSub) return;
    try {
      const response = await deleteSubscription(deleteConfirmSub._id);
      if (response.success) {
        triggerToast('Subscription record removed successfully');
        setDeleteConfirmSub(null);
        fetchSubscriptionsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to delete subscription record');
    }
  };

  // Print view utility
  const handlePrintView = (sub) => {
    setSelectedSub(sub);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Calculate Days Remaining between today and endDate
  const calculateDaysRemaining = (endDateString) => {
    const end = new Date(endDateString);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>KineticAge</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">Membership Management</h1>
          <p className="text-sm text-theme-secondary">Configure tiers and assign plan memberships to active clients</p>
        </div>
        {user && user.role === 'admin' && (
          <button
            onClick={handleOpenAssignModal}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Membership
          </button>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:hidden">
        {[
          { label: 'Total Subscriptions', val: stats.total, desc: 'All historical plans', icon: CreditCard, color: 'text-brand-500 bg-brand-500/10' },
          { label: 'Active Plans', val: stats.active, desc: 'Active & expiring soon', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Expired Plans', val: stats.expired, desc: 'Terminated memberships', icon: XCircle, color: 'text-rose-500 bg-rose-500/10' },
          { label: 'Expiring Soon', val: stats.expiringSoon, desc: 'Expires within 7 days', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-500/10' },
          { label: 'Renewed This Month', val: stats.renewedThisMonth, desc: 'Re-contracted plans', icon: RefreshCw, color: 'text-violet-500 bg-violet-500/10' },
          { label: 'Total Revenue', val: `$${stats.revenue}`, desc: 'Billing ledger aggregate', icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
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
      <div className="bg-theme-card border border-theme rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center transition-theme print:hidden">
        <div className="relative w-full lg:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, email, phone, plan..."
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

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Status filter selection */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
            <option value="Renewed This Month">Renewed This Month</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="Latest">Latest Added</option>
            <option value="Oldest">Oldest Added</option>
            <option value="EndDate">End Date</option>
            <option value="StartDate">Start Date</option>
            <option value="Price">Price</option>
          </select>
        </div>
      </div>

      {/* Main Subscriptions Table */}
      <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden shadow-theme-card transition-theme">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8 mx-auto"></div>
            <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Loading Memberships...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="text-4xl">💳</span>
            <h3 className="font-bold text-theme-primary text-lg">No Subscriptions Available</h3>
            <p className="text-xs text-theme-muted max-w-xs mx-auto">No membership plan records match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-secondary">
              <thead>
                <tr className="border-b border-theme text-xs font-semibold uppercase text-theme-muted bg-theme-table-header">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Pricing</th>
                  <th className="px-6 py-4">Duration Range</th>
                  <th className="px-6 py-4">Days Left</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-theme hover:bg-theme-primary transition-theme">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-theme-primary">{sub.clientId?.fullName || 'Removed Client'}</div>
                      <div className="text-[10px] text-theme-muted font-mono">{sub.clientId?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-theme-primary">{sub.planName}</div>
                      <div className="text-[10px] text-theme-muted">{sub.totalSessions} sessions included</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-theme-primary">${sub.price}</div>
                      <div className="text-[10px] text-theme-muted">Paid: ${sub.amountPaid}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-theme-primary">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-theme-muted">
                        to {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-theme-primary">
                      {calculateDaysRemaining(sub.endDate)} days
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        sub.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : sub.paymentStatus === 'Partially Paid'
                          ? 'bg-yellow-500/10 text-yellow-650 dark:text-yellow-450 border border-yellow-550/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-550/20'
                      }`}>
                        {sub.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                        sub.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : sub.status === 'Expired'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                          : sub.status === 'Expiring Soon'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 animate-pulse'
                          : sub.status === 'Cancelled'
                          ? 'bg-theme-primary text-theme-muted border border-theme'
                          : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedSub(sub); setShowViewModal(true); }}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-600 dark:hover:text-brand-400 rounded-lg border border-theme transition-theme"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {user && user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleOpenRenewModal(sub)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-violet-600 dark:hover:text-violet-400 rounded-lg border border-theme transition-theme"
                              title="Renew Membership"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCancelConfirmSub(sub)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-400 rounded-lg border border-theme transition-theme"
                              title="Cancel Membership"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmSub(sub)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-455 rounded-lg border border-theme transition-theme"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handlePrintView(sub)}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-theme-primary rounded-lg border border-theme transition-theme"
                          title="Print Summary"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Plans Catalog section */}
      <div className="space-y-4 print:hidden">
        <h2 className="text-lg font-bold text-theme-primary">Preset Wellness Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presetPlans.map((plan) => (
            <div key={plan.name} className="bg-theme-card border border-theme rounded-2xl p-6 space-y-4 shadow-theme-card hover:border-brand-500/30 transition-theme flex flex-col justify-between">
              <div>
                <span className="text-xl p-2 bg-theme-primary rounded-xl inline-block">⚡</span>
                <h3 className="font-bold text-base text-theme-primary mt-2">{plan.name}</h3>
                <p className="text-theme-secondary text-xs mt-1.5 leading-relaxed">{plan.desc}</p>
                <div className="mt-3 text-[10px] text-theme-muted leading-relaxed font-semibold">
                  Benefits: {plan.benefits}
                </div>
              </div>
              <div className="pt-4 border-t border-theme">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-2xl font-black text-theme-primary">${plan.price}</span>
                  <span className="text-theme-muted text-xs font-medium">{plan.duration} Month ({plan.sessions} sessions)</span>
                </div>
                <button
                  onClick={() => {
                    handleOpenAssignModal();
                    // Set fields with preset values
                    setAssignPlanName(plan.name);
                    setAssignDescription(plan.desc);
                    setAssignPrice(plan.price);
                    setAssignDuration(plan.duration);
                    setAssignSessions(plan.sessions);
                    setAssignAmountPaid(plan.price);
                  }}
                  className="w-full bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-theme-primary text-xs font-semibold py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Choose Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Membership Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Assign Client Membership</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Select Client */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Select Client *</label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none transition-theme"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.fullName} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Plan Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Plan Name *</label>
                <input
                  type="text"
                  value={assignPlanName}
                  onChange={(e) => setAssignPlanName(e.target.value)}
                  placeholder="e.g. 1 Month Wellness"
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Description</label>
                <input
                  type="text"
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Pricing, Duration, Sessions */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Price ($) *</label>
                  <input
                    type="number"
                    value={assignPrice}
                    onChange={(e) => setAssignPrice(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Duration (M) *</label>
                  <input
                    type="number"
                    value={assignDuration}
                    onChange={(e) => setAssignDuration(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Sessions *</label>
                  <input
                    type="number"
                    value={assignSessions}
                    onChange={(e) => setAssignSessions(e.target.value)}
                    min="0"
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Start Date *</label>
                <input
                  type="date"
                  value={assignStartDate}
                  onChange={(e) => setAssignStartDate(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Payment details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Amount Paid ($) *</label>
                  <input
                    type="number"
                    value={assignAmountPaid}
                    onChange={(e) => setAssignAmountPaid(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Payment Method</label>
                  <select
                    value={assignPaymentMethod}
                    onChange={(e) => setAssignPaymentMethod(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Saving...' : 'Assign Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Renew Membership</h3>
              <button onClick={() => setShowRenewModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
              <p className="text-xs text-theme-secondary leading-relaxed">
                Extending membership plan for <strong className="text-theme-primary">{selectedSub?.clientId?.fullName}</strong>.
              </p>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Price ($) *</label>
                <input
                  type="number"
                  value={renewPrice}
                  onChange={(e) => setRenewPrice(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none transition-theme"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Duration (Months) *</label>
                  <input
                    type="number"
                    value={renewDuration}
                    onChange={(e) => setRenewDuration(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Total Sessions *</label>
                  <input
                    type="number"
                    value={renewSessions}
                    onChange={(e) => setRenewSessions(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Amount Paid ($) *</label>
                  <input
                    type="number"
                    value={renewAmountPaid}
                    onChange={(e) => setRenewAmountPaid(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Payment Method</label>
                  <select
                    value={renewPaymentMethod}
                    onChange={(e) => setRenewPaymentMethod(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:outline-none transition-theme"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Renewing...' : 'Extend Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-lg w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme print:border-0 print:shadow-none">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center print:hidden">
              <h3 className="font-bold text-lg text-theme-primary">Membership Contract Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Client Profile Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-brand-500 uppercase tracking-wider">Client Profile</h4>
                <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-theme-muted block">Full Name:</span>
                    <strong className="text-theme-primary">{selectedSub.clientId?.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Age / Gender:</span>
                    <strong className="text-theme-primary">{selectedSub.clientId?.age} yrs, {selectedSub.clientId?.gender}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Email:</span>
                    <span className="text-theme-primary font-mono">{selectedSub.clientId?.email}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Phone:</span>
                    <span className="text-theme-primary font-mono">{selectedSub.clientId?.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-theme-muted block">Address:</span>
                    <span className="text-theme-primary">{selectedSub.clientId?.address}</span>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="space-y-3 pt-4 border-t border-theme">
                <h4 className="font-bold text-xs text-brand-500 uppercase tracking-wider">Plan Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-theme-muted block">Package Name:</span>
                    <strong className="text-theme-primary">{selectedSub.planName}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Duration (Months):</span>
                    <span className="text-theme-primary">{selectedSub.durationMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Start Date:</span>
                    <span className="text-theme-primary">{new Date(selectedSub.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">End Date:</span>
                    <span className="text-theme-primary font-semibold">{new Date(selectedSub.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Session Progress bar */}
              <div className="space-y-3 pt-4 border-t border-theme">
                <h4 className="font-bold text-xs text-brand-500 uppercase tracking-wider flex justify-between">
                  <span>Training Session Logs</span>
                  <span className="text-theme-primary font-mono normal-case">{selectedSub.completedSessions} / {selectedSub.totalSessions}</span>
                </h4>
                <div className="w-full bg-theme-primary h-2 rounded-full overflow-hidden border border-theme">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-500" 
                    style={{ width: `${selectedSub.totalSessions ? (selectedSub.completedSessions / selectedSub.totalSessions) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-theme-muted">
                  <span>Completed: {selectedSub.completedSessions}</span>
                  <span>Remaining: {selectedSub.remainingSessions}</span>
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-3 pt-4 border-t border-theme">
                <h4 className="font-bold text-xs text-brand-500 uppercase tracking-wider">Billing Ledger</h4>
                <div className="grid grid-cols-3 gap-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-theme-muted block">Total Price:</span>
                    <strong className="text-theme-primary">${selectedSub.price}</strong>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Amount Paid:</span>
                    <span className="text-theme-primary font-semibold">${selectedSub.amountPaid}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Remaining Balance:</span>
                    <span className="text-theme-primary font-bold">${selectedSub.remainingBalance}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Payment Method:</span>
                    <span className="text-theme-primary">{selectedSub.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Payment Status:</span>
                    <span className="text-theme-primary">{selectedSub.paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Renewal History timeline */}
              {selectedSub.renewalHistory && selectedSub.renewalHistory.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-theme">
                  <h4 className="font-bold text-xs text-brand-500 uppercase tracking-wider">Renewal History</h4>
                  <div className="max-h-24 overflow-y-auto text-[11px] divide-y divide-theme border border-theme rounded-xl px-2">
                    {selectedSub.renewalHistory.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between text-theme-secondary">
                        <span>Renewed on {new Date(item.renewalDate).toLocaleDateString()}</span>
                        <span>Price: ${item.price} (Paid: ${item.amountPaid})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-theme-primary border-t border-theme flex justify-end print:hidden">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-theme"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Cancel Membership Plan?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Are you sure you want to cancel the subscription of <strong className="text-theme-primary">{cancelConfirmSub.clientId?.fullName}</strong>? Status will be updated to "Cancelled".
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCancelConfirmSub(null)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSub}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2 rounded-xl transition-theme shadow-lg"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Remove Subscription?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Delete membership logs for <strong className="text-theme-primary">{deleteConfirmSub.clientId?.fullName}</strong>? This action will permanently remove payment and sessions records.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmSub(null)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Go Back
              </button>
              <button
                onClick={handleDeleteSub}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2 rounded-xl transition-theme shadow-lg"
              >
                Delete Record
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

export default Subscriptions;
