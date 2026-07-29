import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  X, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ChevronRight,
  TrendingDown,
  Clock,
  UserCheck,
  Building
} from 'lucide-react';
import { 
  getPayments, 
  recordPayment, 
  updatePayment, 
  deletePayment,
  getPaymentById
} from '../services/paymentService';
import { getClients } from '../services/clientService';
import { getSubscriptions } from '../services/subscriptionService';
import useAuth from '../hooks/useAuth';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSubscriptions, setClientSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [rangeFilter, setRangeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest Payment');

  // Stats Card state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    receivedThisMonth: 0,
    pendingPayments: 0,
    fullyPaidClients: 0,
    partiallyPaidClients: 0,
    overduePayments: 0,
  });

  // Modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Form States (Record Payment)
  const [formClientId, setFormClientId] = useState('');
  const [formSubscriptionId, setFormSubscriptionId] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState('0');
  const [formAmountPaying, setFormAmountPaying] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTransactionRef, setFormTransactionRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCollectedBy, setFormCollectedBy] = useState('Admin');

  // Edit form states
  const [editStatus, setEditStatus] = useState('Paid');

  // Form errors
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Net Banking'];

  const fetchPaymentsAndClients = async () => {
    setLoading(true);
    try {
      // 1. Fetch Payments
      const paymentsResponse = await getPayments({
        status: statusFilter,
        method: methodFilter,
        range: rangeFilter,
        search: searchQuery,
        sortBy
      });
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data);
        calculateStats(paymentsResponse.data);
      }

      // 2. Fetch Clients (Active clients only)
      const clientsResponse = await getClients();
      if (clientsResponse.success && clientsResponse.data) {
        setClients(clientsResponse.data.filter(c => c.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to fetch payments logs:', error.message);
      triggerToast('⚠️ Error loading payments ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndClients();
  }, [statusFilter, methodFilter, rangeFilter, searchQuery, sortBy]);

  const calculateStats = (paymentList) => {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let totalRevenue = 0;
    let receivedThisMonth = 0;

    paymentList.forEach((p) => {
      if (p.paymentStatus !== 'Refunded') {
        totalRevenue += (p.amountPaid || 0);
        if (new Date(p.paymentDate) >= startOfCurrentMonth) {
          receivedThisMonth += (p.amountPaid || 0);
        }
      }
    });

    // We can fetch subscription-based metrics directly or compute them based on subscriptions.
    // To make it fully accurate and synced, we fetch the stats endpoint which we updated earlier.
    // If not loaded, we set fallback values based on the payments array.
    // Let's query them in the background.
    getSubscriptions().then(res => {
      if (res.success && res.data) {
        const subs = res.data;
        let pending = 0;
        let fullyPaid = 0;
        let partiallyPaid = 0;
        let overdue = 0;

        subs.forEach(s => {
          pending += (s.remainingBalance || 0);
          if (s.remainingBalance === 0) fullyPaid++;
          if (s.remainingBalance > 0 && s.amountPaid > 0) partiallyPaid++;
          if (s.status === 'Expired' && s.remainingBalance > 0) overdue++;
        });

        setStats(prev => ({
          ...prev,
          totalRevenue,
          receivedThisMonth,
          pendingPayments: pending,
          fullyPaidClients: fullyPaid,
          partiallyPaidClients: partiallyPaid,
          overduePayments: overdue
        }));
      }
    }).catch(err => {
      console.error(err);
      setStats(prev => ({ ...prev, totalRevenue, receivedThisMonth }));
    });
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Client Selection Change
  const handleClientChange = async (clientId) => {
    setFormClientId(clientId);
    setFormSubscriptionId('');
    setFormTotalAmount('0');
    setFormAmountPaying('');
    setClientSubscriptions([]);

    if (!clientId) return;

    try {
      const response = await getSubscriptions();
      if (response.success && response.data) {
        // Filter subscriptions for this client with remaining balance to pay
        const clientSubs = response.data.filter(
          s => s.clientId?._id === clientId && s.remainingBalance > 0
        );
        setClientSubscriptions(clientSubs);
      }
    } catch (error) {
      console.error('Failed to load subscriptions for client:', error.message);
    }
  };

  // Subscription Selection Change
  const handleSubscriptionChange = (subId) => {
    setFormSubscriptionId(subId);
    if (!subId) {
      setFormTotalAmount('0');
      setFormAmountPaying('');
      return;
    }

    const selectedSub = clientSubscriptions.find(s => s._id === subId);
    if (selectedSub) {
      setFormTotalAmount(selectedSub.price.toString());
      setFormAmountPaying(selectedSub.remainingBalance.toString());
    }
  };

  // Form validations
  const validatePaymentForm = () => {
    if (!formClientId) return 'Please select a Client';
    if (!formSubscriptionId) return 'Please select a Subscription Plan';
    
    const amountNum = Number(formAmountPaying);
    if (isNaN(amountNum) || amountNum <= 0) return 'Amount paying must be a positive number';

    const selectedSub = clientSubscriptions.find(s => s._id === formSubscriptionId);
    if (selectedSub && amountNum > selectedSub.remainingBalance + 0.01) {
      return `Amount paying cannot exceed subscription remaining balance ($${selectedSub.remainingBalance})`;
    }

    if (!formPaymentDate) return 'Payment date is required';
    if (new Date(formPaymentDate) > new Date()) return 'Payment date cannot be in the future';

    if (!formPaymentMethod) return 'Payment method is required';

    return '';
  };

  // Record Payment Submit
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const err = validatePaymentForm();
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    try {
      const data = {
        clientId: formClientId,
        subscriptionId: formSubscriptionId,
        amountPaid: parseFloat(formAmountPaying),
        paymentMethod: formPaymentMethod,
        paymentDate: formPaymentDate,
        transactionReference: formTransactionRef.trim(),
        collectedBy: formCollectedBy.trim() || 'Admin',
        notes: formNotes.trim(),
      };

      const response = await recordPayment(data);
      if (response.success) {
        triggerToast('Payment logged successfully');
        setShowRecordModal(false);
        fetchPaymentsAndClients();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to log payment transaction');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Payment Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const data = {
        paymentStatus: editStatus,
        notes: formNotes.trim(),
      };

      const response = await updatePayment(selectedPayment._id, data);
      if (response.success) {
        triggerToast('Payment status updated');
        setShowEditModal(false);
        fetchPaymentsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to update payment status');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async () => {
    if (!deleteConfirmPayment) return;
    try {
      const response = await deletePayment(deleteConfirmPayment._id);
      if (response.success) {
        triggerToast('Payment record removed successfully');
        setDeleteConfirmPayment(null);
        fetchPaymentsAndClients();
      }
    } catch (error) {
      console.error(error);
      triggerToast('⚠️ Failed to delete payment transaction');
    }
  };

  // Print Invoice Receipt
  const handlePrintReceipt = (payment) => {
    setSelectedPayment(payment);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>KineticAge</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>Payments</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">Payments Ledger</h1>
          <p className="text-sm text-theme-secondary">Log and verify subscriptions invoice balances for center clients</p>
        </div>
        {user && user.role === 'admin' && (
          <button
            onClick={() => {
              setFormClientId('');
              setFormSubscriptionId('');
              setFormTotalAmount('0');
              setFormAmountPaying('');
              setFormTransactionRef('');
              setFormNotes('');
              setClientSubscriptions([]);
              setFormError('');
              setShowRecordModal(true);
            }}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:hidden">
        {[
          { label: 'Total Revenue', val: `$${stats.totalRevenue}`, desc: 'Aggregated payments', icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Received This Month', val: `$${stats.receivedThisMonth}`, desc: 'Processed this month', icon: Calendar, color: 'text-brand-500 bg-brand-500/10' },
          { label: 'Pending Payments', val: `$${stats.pendingPayments}`, desc: 'Outstanding active plans', icon: Clock, color: 'text-yellow-600 bg-yellow-500/10' },
          { label: 'Fully Paid Clients', val: stats.fullyPaidClients, desc: 'Zero balance members', icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Partially Paid', val: stats.partiallyPaidClients, desc: 'Installment active plans', icon: Users, color: 'text-violet-500 bg-violet-500/10' },
          { label: 'Overdue Payments', val: stats.overduePayments, desc: 'Expired unpaid balances', icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' },
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
            placeholder="Search by client, invoice, plan, method..."
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
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Payment Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Methods</option>
            {paymentMethods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Calendar Range Filter */}
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="All">All Time</option>
            <option value="Current Month">This Month</option>
            <option value="Current Year">This Year</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-theme-primary border border-theme-input text-theme-secondary text-xs font-semibold px-3 py-2.5 rounded-xl focus:border-brand-500 focus:outline-none transition-theme"
          >
            <option value="Latest Payment">Latest Payments</option>
            <option value="Oldest Payment">Oldest Payments</option>
            <option value="Highest Amount">Highest Amount</option>
            <option value="Lowest Amount">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Payments Table */}
      <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden shadow-theme-card transition-theme">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8 mx-auto"></div>
            <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Loading Payments Ledger...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="text-4xl">💰</span>
            <h3 className="font-bold text-theme-primary text-lg">No Payment Records Available</h3>
            <p className="text-xs text-theme-muted max-w-xs mx-auto">No transaction entries logged in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-secondary">
              <thead>
                <tr className="border-b border-theme text-xs font-semibold uppercase text-theme-muted bg-theme-table-header">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Plan Description</th>
                  <th className="px-6 py-4">Pricing Breakdown</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Remaining Balance</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-theme hover:bg-theme-primary transition-theme">
                    <td className="px-6 py-4 font-mono font-semibold text-theme-primary">
                      {p.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-theme-primary">{p.clientId?.fullName || 'Removed Client'}</div>
                      <div className="text-[10px] text-theme-muted">{p.clientId?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-theme-primary">
                      {p.subscriptionId?.planName || 'Wellness Plan'}
                    </td>
                    <td className="px-6 py-4 text-xs text-theme-primary font-mono">
                      ${p.totalAmount}
                    </td>
                    <td className="px-6 py-4 font-semibold text-theme-primary font-mono">
                      ${p.amountPaid}
                    </td>
                    <td className="px-6 py-4 text-theme-muted font-mono">
                      ${p.remainingBalance}
                    </td>
                    <td className="px-6 py-4 text-xs text-theme-primary">
                      {p.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        p.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : p.paymentStatus === 'Partially Paid'
                          ? 'bg-yellow-500/10 text-yellow-650 dark:text-yellow-450 border border-yellow-550/20'
                          : p.paymentStatus === 'Pending'
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                          : p.paymentStatus === 'Refunded'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-theme'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-550/20'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-theme-primary">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedPayment(p); setShowViewModal(true); }}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-600 dark:hover:text-brand-400 rounded-lg border border-theme transition-theme"
                          title="View Invoice Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {user && user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => { setSelectedPayment(p); setEditStatus(p.paymentStatus); setFormNotes(p.notes); setShowEditModal(true); }}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-650 rounded-lg border border-theme transition-theme"
                              title="Edit Payment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmPayment(p)}
                              className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-455 rounded-lg border border-theme transition-theme"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-theme-primary rounded-lg border border-theme transition-theme"
                          title="Print Receipt"
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

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">Record Subscription Payment</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
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
                  value={formClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none transition-theme"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.fullName} (Age {c.age})</option>
                  ))}
                </select>
              </div>

              {/* Select Subscription */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Select Unpaid Subscription Plan *</label>
                <select
                  value={formSubscriptionId}
                  onChange={(e) => handleSubscriptionChange(e.target.value)}
                  required
                  disabled={!formClientId || clientSubscriptions.length === 0}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:border-brand-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-theme"
                >
                  <option value="">
                    {!formClientId 
                      ? '-- Select client first --' 
                      : clientSubscriptions.length === 0 
                      ? '-- No outstanding subscriptions found --' 
                      : '-- Choose membership plan --'}
                  </option>
                  {clientSubscriptions.map(s => (
                    <option key={s._id} value={s._id}>{s.planName} (Balance: ${s.remainingBalance} / Price: ${s.price})</option>
                  ))}
                </select>
              </div>

              {/* Total & paying Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Total Package Price ($)</label>
                  <input
                    type="text"
                    value={formTotalAmount}
                    disabled
                    className="w-full bg-theme-primary/50 border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-muted cursor-not-allowed focus:outline-none transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Amount Paying ($) *</label>
                  <input
                    type="number"
                    value={formAmountPaying}
                    onChange={(e) => setFormAmountPaying(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 40"
                    disabled={!formSubscriptionId}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
              </div>

              {/* Date & method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Payment Date *</label>
                  <input
                    type="date"
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Payment Method *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                  >
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={formTransactionRef}
                  onChange={(e) => setFormTransactionRef(e.target.value)}
                  placeholder="e.g. TXN-9482038"
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Billing Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="First installment payment logged..."
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                />
              </div>

              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-theme-card animate-modal-box transition-theme">
            <h3 className="font-bold text-lg text-theme-primary">Modify Payment Log</h3>
            <p className="text-xs text-theme-secondary">
              Update billing details for invoice <strong className="text-theme-primary">{selectedPayment?.invoiceNumber}</strong>.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Payment Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-secondary focus:outline-none transition-theme"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Billing Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none transition-theme"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-xs py-2 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Details Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme print:border-0 print:shadow-none print:bg-white print:text-black">
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center print:hidden">
              <h3 className="font-bold text-lg text-theme-primary">Billing Invoice Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-theme-muted hover:text-theme-primary font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Receipt Header */}
              <div className="text-center space-y-2 border-b border-theme pb-4">
                <div className="w-12 h-12 bg-brand-500/10 text-brand-600 rounded-full flex items-center justify-center mx-auto text-xl print:hidden">
                  <Building className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black tracking-tight text-theme-primary">KINETICAGE WELLNESS CENTER</h2>
                <p className="text-[10px] text-theme-muted uppercase tracking-wider font-mono">Invoice Number: {selectedPayment.invoiceNumber}</p>
              </div>

              {/* Client and plan details */}
              <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                <div>
                  <span className="text-theme-muted block">Client Profile:</span>
                  <strong className="text-theme-primary">{selectedPayment.clientId?.fullName}</strong>
                  <span className="text-theme-muted block text-[10px] font-mono">{selectedPayment.clientId?.phone}</span>
                </div>
                <div>
                  <span className="text-theme-muted block">Plan Membership:</span>
                  <strong className="text-theme-primary">{selectedPayment.subscriptionId?.planName || 'Wellness Plan'}</strong>
                  <span className="text-theme-muted block text-[10px]">Duration: {selectedPayment.subscriptionId?.durationMonths || '1'} Months</span>
                </div>
              </div>

              {/* Transaction breakdown details */}
              <div className="pt-4 border-t border-theme space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Total Package Price:</span>
                  <span className="text-theme-primary font-mono">${selectedPayment.totalAmount}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-theme-muted">Amount Paid:</span>
                  <span className="text-theme-primary font-mono">${selectedPayment.amountPaid}</span>
                </div>
                <div className="flex justify-between border-t border-theme pt-2">
                  <span className="text-theme-muted">Outstanding Balance:</span>
                  <span className="text-theme-primary font-black font-mono">${selectedPayment.remainingBalance}</span>
                </div>
              </div>

              {/* Payments method details */}
              <div className="pt-4 border-t border-theme grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
                <div>
                  <span className="text-theme-muted block">Payment Method:</span>
                  <span className="text-theme-primary font-medium">{selectedPayment.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-theme-muted block">Processed Date:</span>
                  <span className="text-theme-primary font-medium">{new Date(selectedPayment.paymentDate).toLocaleDateString()}</span>
                </div>
                {selectedPayment.transactionReference && (
                  <div>
                    <span className="text-theme-muted block">Transaction Ref:</span>
                    <span className="text-theme-primary font-mono">{selectedPayment.transactionReference}</span>
                  </div>
                )}
                <div>
                  <span className="text-theme-muted block">Processed By:</span>
                  <span className="text-theme-primary font-medium">{selectedPayment.collectedBy}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="pt-4 border-t border-theme">
                  <span className="text-theme-muted block text-[10px] uppercase font-semibold">Invoicing Notes:</span>
                  <p className="text-theme-primary text-xs mt-1 italic">
                    "{selectedPayment.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-theme-primary border-t border-theme flex justify-end gap-3 print:hidden">
              <button
                onClick={() => handlePrintReceipt(selectedPayment)}
                className="bg-theme-card hover:bg-theme-primary border border-theme text-theme-secondary hover:text-theme-primary font-semibold text-xs px-3.5 py-2 rounded-xl transition-theme flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-theme"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Remove Transaction Log?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Delete payment transaction <strong className="text-theme-primary">{deleteConfirmPayment.invoiceNumber}</strong>? This action will adjust the related subscription amount paid and remaining balance.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmPayment(null)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Go Back
              </button>
              <button
                onClick={handleDeletePayment}
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
          <div className="w-5 h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-455 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Payments;
