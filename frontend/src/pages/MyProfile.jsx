import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Award, ChevronRight, Calendar, Shield, Edit3, Save, X, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { updateClient } from '../services/clientService';

const MyProfile = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Other');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Sync state when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAge(user.age || '');
      setGender(user.gender || 'Other');
      setEmergencyContact(user.emergencyContact || '');
    }
  }, [user, isEditing]);

  const handleEditToggle = () => {
    setFormError('');
    setIsEditing(!isEditing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    // Val checks
    if (!name.trim()) return setFormError('Name is required');
    if (name.trim().length < 3) return setFormError('Full name must be at least 3 characters long');
    if (!/^[A-Za-z\s]+$/.test(name.trim())) return setFormError('Full name can only contain alphabets and spaces');
    
    const ageNum = Number(age);
    if (!age || !Number.isInteger(ageNum) || ageNum < 55 || ageNum > 120) {
      return setFormError('Age must be an integer between 55 and 120');
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return setFormError('Phone number must contain exactly 10 digits');
    }

    if (!address || address.trim().length < 10) {
      return setFormError('Address must be at least 10 characters long');
    }

    setFormLoading(true);
    try {
      if (!user.clientId) {
        throw new Error('No associated client record ID found to update profile details.');
      }

      const response = await updateClient(user.clientId, {
        fullName: name.trim(),
        age: ageNum,
        gender,
        phone,
        address: address.trim(),
        emergencyContact: emergencyContact.trim() || 'N/A',
      });

      if (response.success) {
        setIsEditing(false);
        // Refresh AuthContext user state to sync layout name/avatar
        if (refreshUser) {
          await refreshUser();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || error.message || 'Failed to update profile details');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
            <span>KineticAge Portal</span>
            <ChevronRight className="w-3 h-3 text-theme-muted" />
            <span>My Profile</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">My Account Profile</h1>
          <p className="text-sm text-theme-secondary">Manage your wellness portal settings and demographic credentials</p>
        </div>

        {user && (
          <button
            onClick={handleEditToggle}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-theme shadow-md flex items-center gap-1.5"
          >
            {isEditing ? (
              <>
                <X className="w-3.5 h-3.5" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </>
            )}
          </button>
        )}
      </div>

      {!user ? (
        <div className="bg-theme-card border border-theme rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
          <span className="text-5xl">👤</span>
          <h3 className="font-bold text-lg text-theme-primary">No Session Found</h3>
          <p className="text-xs text-theme-secondary max-w-sm mx-auto">
            Please log in first to view personal account profiles.
          </p>
        </div>
      ) : (
        <div className="bg-theme-card border border-theme rounded-3xl p-8 max-w-2xl mx-auto shadow-theme-card transition-theme relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full pointer-events-none"></div>

          {/* Form Error Banner */}
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-6 animate-pulse">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-theme">
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.name} 
                className="w-20 h-20 rounded-full object-cover shadow-sm border border-brand-500/15 shrink-0" 
              />
            ) : (
              <div className="w-20 h-20 bg-brand-600/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-sm shrink-0 border border-brand-500/15">
                {name ? name.charAt(0) : 'U'}
              </div>
            )}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-bold text-theme-primary">{name || user.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider w-fit mx-auto sm:mx-0 bg-brand-600/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-theme-secondary">
                Registered Email Identity Portal
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-theme-muted" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1">{user.name}</p>
                )}
              </div>

              {/* Email (Always read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-theme-muted" />
                  Email Address
                </label>
                <p className="text-sm font-semibold text-theme-primary pl-1 opacity-75">{user.email}</p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-theme-muted" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1">{user.phone || 'N/A'}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-theme-muted" />
                  Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min={55}
                    max={120}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1">{user.age || 'N/A'}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-theme-muted" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1 capitalize">{user.gender || 'N/A'}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-theme-muted" />
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1">{user.emergencyContact || 'N/A'}</p>
                )}
              </div>

              {/* Member Since (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-theme-muted" />
                  Member Since
                </label>
                <p className="text-sm font-semibold text-theme-primary pl-1">
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                    : 'N/A'}
                </p>
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-theme-muted" />
                  Account Role
                </label>
                <p className="text-sm font-semibold text-theme-primary pl-1 capitalize">{user.role}</p>
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-theme-muted" />
                  Registered Address
                </label>
                {isEditing ? (
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={2}
                    className="w-full bg-theme-primary border border-theme-input rounded-xl px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-brand-500 transition-theme"
                  />
                ) : (
                  <p className="text-sm font-semibold text-theme-primary pl-1 leading-relaxed">{user.address || 'N/A'}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="pt-4 border-t border-theme flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="bg-theme-primary hover:bg-theme-card text-theme-secondary font-semibold text-xs px-5 py-2.5 rounded-xl border border-theme transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-theme flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {formLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
