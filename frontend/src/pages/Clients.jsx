import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../services/clientService';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // React Router Search Params
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status'); // 'active' or 'inactive'
  const filterParam = searchParams.get('filter'); // 'new'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Field touched states for instant inline error borders
  const [touched, setTouched] = useState({
    fullName: false,
    age: false,
    email: false,
    phone: false,
    address: false,
  });

  // DOM Refs to focus the first invalid field
  const fullNameRef = useRef(null);
  const ageRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);

  // Fetch clients from MongoDB
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients();
      if (response.success && response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      triggerToast('⚠️ Failed to load clients from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Toast trigger utility
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3550);
  };

  // Helper validation checkers
  const validateFullName = (val) => {
    if (!val.trim()) return 'Full name is required';
    if (val.trim().length < 3 || val.trim().length > 60) return 'Full name must be between 3 and 60 characters';
    if (!/^[A-Za-z\s]+$/.test(val)) return 'Full name can only contain alphabets and spaces';
    return '';
  };

  const validateAge = (val) => {
    if (val === '') return 'Age is required';
    const ageNum = Number(val);
    if (!Number.isInteger(ageNum)) return 'Age must be a whole number (integer)';
    if (ageNum < 55 || ageNum > 120) return 'Age must be between 55 and 120';
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required';
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (val) => {
    if (!val.trim()) return 'Phone number is required';
    if (!/^\d+$/.test(val)) return 'Phone number must contain numbers only';
    if (val.length !== 10) return 'Phone number must contain exactly 10 digits';
    return '';
  };

  const validateAddress = (val) => {
    if (!val.trim()) return 'Address is required';
    if (val.trim().length < 10 || val.trim().length > 200) return 'Address must be between 10 and 200 characters';
    return '';
  };

  // Compile inline field errors
  const fieldErrors = {
    fullName: validateFullName(fullName),
    age: validateAge(age),
    email: validateEmail(email),
    phone: validatePhone(phone),
    address: validateAddress(address),
  };

  // Enforce button disable lock if any fields are invalid
  const isFormValid = 
    !fieldErrors.fullName && 
    !fieldErrors.age && 
    !fieldErrors.email && 
    !fieldErrors.phone && 
    !fieldErrors.address;

  // Trigger field touch on blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Open modal for adding client
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFullName('');
    setAge('');
    setGender('Male');
    setEmail('');
    setPhone('');
    setAddress('');
    setStatus('Active');
    setFormError('');
    setTouched({
      fullName: false,
      age: false,
      email: false,
      phone: false,
      address: false,
    });
    setShowModal(true);
  };

  // Open modal for editing client
  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFullName(client.fullName);
    setAge(client.age.toString());
    setGender(client.gender);
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address || '');
    setStatus(client.status);
    setFormError('');
    setTouched({
      fullName: false,
      age: false,
      email: false,
      phone: false,
      address: false,
    });
    setShowModal(true);
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Set all fields to touched to display validation indicators
    setTouched({
      fullName: true,
      age: true,
      email: true,
      phone: true,
      address: true,
    });

    // Focus the first invalid input element
    if (fieldErrors.fullName) {
      fullNameRef.current?.focus();
      return;
    }
    if (fieldErrors.age) {
      ageRef.current?.focus();
      return;
    }
    if (fieldErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (fieldErrors.phone) {
      phoneRef.current?.focus();
      return;
    }
    if (fieldErrors.address) {
      addressRef.current?.focus();
      return;
    }

    setFormLoading(true);
    const clientData = {
      fullName: fullName.trim(),
      age: parseInt(age),
      gender,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status,
    };

    try {
      if (editingClient) {
        // Update operation
        const response = await updateClient(editingClient._id, clientData);
        if (response.success) {
          triggerToast('Client updated successfully');
          setShowModal(false);
          fetchClients();
        }
      } else {
        // Create operation
        const response = await createClient(clientData);
        if (response.success) {
          triggerToast('Client added successfully');
          setShowModal(false);
          fetchClients();
        }
      }
    } catch (error) {
      console.error('CRUD error:', error);
      setFormError(error.response?.data?.message || 'An error occurred. Check input values.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDelete = async () => {
    if (!deleteConfirmClient) return;
    
    try {
      const response = await deleteClient(deleteConfirmClient._id);
      if (response.success) {
        triggerToast('Client removed successfully');
        setDeleteConfirmClient(null);
        fetchClients();
      }
    } catch (error) {
      console.error('Delete error:', error.message);
      triggerToast('⚠️ Error removing client record');
    }
  };

  // Check if a client record was registered in the current month
  const isCreatedThisMonth = (createdAtString) => {
    if (!createdAtString) return false;
    const date = new Date(createdAtString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Determine Title and Page Subtitle dynamically based on query parameters
  let pageTitle = 'Client Directory';
  let pageSubtitle = 'Manage wellness participants and clinical details';

  if (statusParam === 'active') {
    pageTitle = 'Active Clients';
    pageSubtitle = 'View active senior wellness participants';
  } else if (statusParam === 'inactive') {
    pageTitle = 'Inactive Clients';
    pageSubtitle = 'View suspended or inactive profiles';
  } else if (filterParam === 'new') {
    pageTitle = 'New Clients This Month';
    pageSubtitle = 'Participants registered during the current calendar month';
  }

  // 1. First, apply query parameters filtering
  const queryFilteredClients = clients.filter((client) => {
    if (statusParam === 'active') {
      return client.status === 'Active';
    }
    if (statusParam === 'inactive') {
      return client.status === 'Inactive';
    }
    if (filterParam === 'new') {
      return isCreatedThisMonth(client.createdAt);
    }
    return true;
  });

  // 2. Next, apply search filters on top of the query parameter filters
  const finalFilteredClients = queryFilteredClients.filter((client) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      client.fullName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  // Determine empty state message dynamically
  let emptyStateTitle = 'No clients found';
  let emptyStateDesc = 'Get started by clicking Add Client to register a new senior wellness participant.';

  if (searchQuery) {
    emptyStateTitle = 'No matching clients found';
    emptyStateDesc = 'Adjust your search query keywords and try again.';
  } else if (statusParam === 'active') {
    emptyStateTitle = 'No Active Clients Found';
    emptyStateDesc = 'There are currently no active clients in the database.';
  } else if (statusParam === 'inactive') {
    emptyStateTitle = 'No Inactive Clients Found';
    emptyStateDesc = 'All registered clients are currently active.';
  } else if (filterParam === 'new') {
    emptyStateTitle = 'No New Clients Registered This Month';
    emptyStateDesc = 'There are no new registrations logged this month.';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>MERN DB Integrations</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>Clients</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">{pageTitle}</h1>
          <p className="text-sm text-theme-secondary">{pageSubtitle}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 flex items-center gap-2 group"
        >
          <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Add Client
        </button>
      </div>

      {/* Control bar: Search and Filters */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center transition-theme">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone number..."
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
        <div className="text-xs text-theme-muted font-medium">
          Showing {finalFilteredClients.length} of {queryFilteredClients.length} records
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden shadow-theme-card transition-theme">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8 mx-auto"></div>
            <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Loading Directory...</p>
          </div>
        ) : finalFilteredClients.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="text-4xl">👥</span>
            <h3 className="font-bold text-theme-primary text-lg">{emptyStateTitle}</h3>
            <p className="text-xs text-theme-muted max-w-xs mx-auto">
              {emptyStateDesc}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-secondary">
              <thead>
                <tr className="border-b border-theme text-xs font-semibold uppercase text-theme-muted bg-theme-table-header">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Age / Gender</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Sub Status</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredClients.map((client) => (
                  <tr key={client._id} className="border-b border-theme hover:bg-theme-primary transition-theme">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-theme-primary">{client.fullName}</div>
                      <div className="text-[10px] text-theme-muted truncate max-w-[150px]">{client.address || 'No address logged'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-theme-primary font-medium">{client.age} yrs</div>
                      <div className="text-[10px] text-theme-muted">{client.gender}</div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="text-xs text-theme-primary">{client.email}</div>
                      <div className="text-[10px] text-theme-muted font-mono">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        client.subscriptionStatus === 'Active' 
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20' 
                          : client.subscriptionStatus === 'Expired'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-550/20'
                          : 'bg-theme-primary text-theme-muted border border-theme'
                      }`}>
                        {client.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                        client.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-theme-primary text-theme-muted border border-theme'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-brand-600 dark:hover:text-brand-400 rounded-lg border border-theme transition-theme"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmClient(client)}
                          className="p-1.5 bg-theme-primary hover:bg-theme-card text-theme-secondary hover:text-rose-600 dark:hover:text-rose-400 rounded-lg border border-theme transition-theme"
                          title="Remove Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full overflow-hidden shadow-theme-card animate-modal-box my-8 transition-theme">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="font-bold text-lg text-theme-primary">
                {editingClient ? 'Edit Client Profile' : 'Register New Client'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-theme-muted hover:text-theme-primary transition-theme text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Full Name *</label>
                <input
                  ref={fullNameRef}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Margaret Albright"
                  required
                  className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                    touched.fullName && fieldErrors.fullName 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-theme-input'
                  }`}
                />
                {touched.fullName && fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-650 font-semibold">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Age (55-120) *</label>
                  <input
                    ref={ageRef}
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onBlur={() => handleBlur('age')}
                    placeholder="78"
                    required
                    min="55"
                    max="120"
                    className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                      touched.age && fieldErrors.age 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-theme-input'
                    }`}
                  />
                  {touched.age && fieldErrors.age && (
                    <p className="text-[11px] text-rose-650 font-semibold leading-normal">{fieldErrors.age}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-secondary">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Email Address *</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="margaret.a@example.com"
                  required
                  className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                    touched.email && fieldErrors.email 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-theme-input'
                  }`}
                />
                {touched.email && fieldErrors.email && (
                  <p className="text-[11px] text-rose-655 font-semibold">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Phone Number (10 Digits) *</label>
                <input
                  ref={phoneRef}
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="9876543210"
                  required
                  className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                    touched.phone && fieldErrors.phone 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-theme-input'
                  }`}
                />
                {touched.phone && fieldErrors.phone && (
                  <p className="text-[11px] text-rose-655 font-semibold">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-secondary">Address (10-200 Characters) *</label>
                <input
                  ref={addressRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => handleBlur('address')}
                  placeholder="e.g. 42 Main St, Apartment 4B"
                  required
                  className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                    touched.address && fieldErrors.address 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-theme-input'
                  }`}
                />
                {touched.address && fieldErrors.address && (
                  <p className="text-[11px] text-rose-655 font-semibold">{fieldErrors.address}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">Directory Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2.5 text-sm text-theme-secondary focus:border-brand-500 focus:outline-none transition-theme"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-theme flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !isFormValid}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg transition-theme"
                >
                  {formLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-modal-overlay">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-theme-card animate-modal-box transition-theme">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-theme-primary">Remove Client Record?</h3>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Are you sure you want to permanently delete the profile of <strong className="text-theme-primary">{deleteConfirmClient.fullName}</strong>? This database action is irreversible.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmClient(null)}
                className="flex-1 bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-sm py-2 rounded-xl border border-theme transition-theme"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm py-2 rounded-xl transition-theme shadow-lg shadow-rose-600/15"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-theme-card border border-emerald-500/50 text-theme-primary px-5 py-3.5 rounded-2xl shadow-theme-card flex items-center gap-3 animate-in slide-in-from-bottom-6 duration-300 transition-theme">
          <div className="w-5 h-5 bg-emerald-500/15 text-emerald-650 dark:text-emerald-450 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Clients;
