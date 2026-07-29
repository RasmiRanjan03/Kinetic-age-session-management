import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { forgotPasswordUser } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const navigate = useNavigate();

  // Validations
  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required';
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'New password is required';
    if (val.length < 8) return 'Password must be at least 8 characters long';
    // Validate complexity to pass backend Mongoose rules
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(val)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }
    return '';
  };

  const validateConfirmPassword = (val) => {
    if (!val) return 'Please confirm your new password';
    if (val !== password) return 'Passwords do not match';
    return '';
  };

  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(confirmPassword),
  };

  const isFormValid = !errors.email && !errors.password && !errors.confirmPassword;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }
    if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordUser(email.trim(), password);
      if (response.success) {
        setSuccess('Password updated successfully.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary flex flex-col justify-center items-center p-4 transition-theme">
      <div className="bg-theme-card border border-theme rounded-3xl p-8 max-w-md w-full shadow-theme-card space-y-6 transition-theme">
        <div className="text-center space-y-2">
          <span className="bg-brand-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
            KineticAge
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary mt-2">Reset Password</h2>
          <p className="text-xs text-theme-secondary">Enter your email and define your new credential</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>{success} Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Email Address</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="admin@kineticage.com"
              required
              disabled={loading || !!success}
              className={`w-full bg-theme-primary border rounded-xl px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                touched.email && errors.email 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-theme-input'
              }`}
            />
            {touched.email && errors.email && (
              <p className="text-[11px] text-rose-600 dark:text-rose-455 font-semibold">{errors.email}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">New Password</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                required
                disabled={loading || !!success}
                className={`w-full bg-theme-primary border rounded-xl pl-4 pr-10 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                  touched.password && errors.password 
                    ? 'border-rose-500 focus:border-rose-500' 
                    : 'border-theme-input'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme-primary transition-theme"
              >
                {showPassword ? (
                  <EyeOff className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-[11px] text-rose-600 dark:text-rose-455 font-semibold leading-relaxed">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Confirm New Password</label>
            <div className="relative">
              <input
                ref={confirmPasswordRef}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                required
                disabled={loading || !!success}
                className={`w-full bg-theme-primary border rounded-xl pl-4 pr-10 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                  touched.confirmPassword && errors.confirmPassword 
                    ? 'border-rose-500 focus:border-rose-500' 
                    : 'border-theme-input'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme-primary transition-theme"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-[11px] text-rose-600 dark:text-rose-455 font-semibold">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isFormValid || !!success}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/15 text-sm"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className="text-center text-xs text-theme-secondary pt-2 border-t border-theme">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
