import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get('token');
    const urlError = queryParams.get('error');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.location.href = '/dashboard';
    } else if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [navigate]);
  
  // Touched states for immediate inline validation borders
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Inputs DOM refs to focus the first invalid field
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Helper validation checkers
  const validateName = (val) => {
    if (!val.trim()) return 'Name is required';
    if (val.trim().length < 3 || val.trim().length > 60) return 'Name must be between 3 and 60 characters';
    if (!/^[A-Za-z\s]+$/.test(val)) return 'Name can only contain alphabets and spaces';
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required';
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required';
    if (val.length < 8 || val.length > 20) return 'Password must be between 8 and 20 characters';
    if (!/(?=.*[a-z])/.test(val)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(val)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(val)) return 'Password must contain at least one number';
    if (!/(?=.*[@$!%*?&])/.test(val)) return 'Password must contain at least one special character (@$!%*?&)';
    return '';
  };

  const validateConfirmPassword = (val) => {
    if (!val) return 'Confirm password is required';
    if (val !== password) return 'Passwords do not match';
    return '';
  };

  // Compile errors
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(confirmPassword),
  };

  // Enforce button disable lock if any fields are invalid (trimmed spaces accounted)
  const isFormValid = !errors.name && !errors.email && !errors.password && !errors.confirmPassword;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Trigger touched state globally on submit
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Automatically focus the first invalid field
    if (errors.name) {
      nameRef.current?.focus();
      return;
    }
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
      const result = await register({ 
        name: name.trim(), 
        email: email.trim(), 
        password 
      });
      
      if (result.success) {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-theme-primary flex flex-col justify-center items-center p-4 transition-theme">
      <div className="bg-theme-card border border-theme rounded-3xl p-8 max-w-md w-full shadow-theme-card space-y-6 transition-theme">
        <div className="text-center space-y-2">
          <span className="bg-brand-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
            KineticAge
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary mt-2">Create Account</h2>
          <p className="text-xs text-theme-secondary">Register to manage subscriptions and daily sessions</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Full Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Margaret Albright"
              required
              className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                touched.name && errors.name 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-theme-input'
              }`}
            />
            {touched.name && errors.name && (
              <p className="text-[11px] text-rose-600 dark:text-rose-450 font-semibold">{errors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Email Address</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="margaret.a@company.co.in"
              required
              className={`w-full bg-theme-primary border rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
                touched.email && errors.email 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-theme-input'
              }`}
            />
            {touched.email && errors.email && (
              <p className="text-[11px] text-rose-600 dark:text-rose-450 font-semibold">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Password</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                required
                className={`w-full bg-theme-primary border rounded-xl pl-4 pr-10 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
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
              <p className="text-[11px] text-rose-600 dark:text-rose-450 font-semibold leading-normal">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-theme-secondary">Confirm Password</label>
            <div className="relative">
              <input
                ref={confirmPasswordRef}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                required
                className={`w-full bg-theme-primary border rounded-xl pl-4 pr-10 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-brand-500 transition-theme ${
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
              <p className="text-[11px] text-rose-600 dark:text-rose-450 font-semibold">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-theme shadow-lg shadow-brand-600/15 text-sm"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-theme"></div>
          <span className="flex-shrink mx-4 text-xs text-theme-secondary font-medium">or</span>
          <div className="flex-grow border-t border-theme"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-theme-primary hover:bg-theme-card text-theme-primary font-semibold py-3 rounded-xl border border-theme transition-theme flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center text-xs text-theme-secondary pt-2 border-t border-theme">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
