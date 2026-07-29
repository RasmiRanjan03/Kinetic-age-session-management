import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle, 
  FileText,
  HeartPulse,
  Info,
  Menu,
  X
} from 'lucide-react';

const Landing = () => {
  const currentYear = new Date().getFullYear();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Offset for sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Scroll listener to highlight active section in Navbar
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'advantages', 'about'];
      const scrollPosition = window.scrollY + 120; // 120px offset for active triggering

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'Client Management',
      desc: 'Centralize and update senior wellness participant records, contact info, and medical alerts.',
      icon: Users,
      color: 'text-brand-600 bg-brand-50'
    },
    {
      title: 'Subscription Management',
      desc: 'Establish and monitor client memberships: 1-month, 3-month, 6-month, or custom plans.',
      icon: CreditCard,
      color: 'text-teal-600 bg-teal-50'
    },
    {
      title: 'Daily Session Tracking',
      desc: 'Record workout milestones, exercise sets/reps, rehabilitation progress, and trainer notes.',
      icon: Activity,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'Payment Management',
      desc: 'Track upfront membership dues and schedule split installment ledgers cleanly.',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Progress Reports',
      desc: 'Synthesize session logs and clinical progress metrics into monthly client performance sheets.',
      icon: TrendingUp,
      color: 'text-sky-600 bg-sky-50'
    }
  ];

  const advantages = [
    {
      title: 'Secure Client Records',
      desc: 'Protected client health history logs and credentials using industry security guidelines.',
      icon: ShieldCheck
    },
    {
      title: 'Easy Session Tracking',
      desc: 'Intuitive forms to monitor rehabilitation progress metrics and health parameters.',
      icon: CheckCircle
    },
    {
      title: 'Organized Payments',
      desc: 'Never miss an installment. Clear ledger overview of client subscription schedules.',
      icon: DollarSign
    },
    {
      title: 'Real-Time Reports',
      desc: 'Assemble session summaries and generate monthly reports directly in just one click.',
      icon: FileText
    }
  ];

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Features', id: 'features' },
    { name: 'Advantages', id: 'advantages' },
    { name: 'About Platform', id: 'about' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Sticky Header Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-150 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-700 to-teal-600 bg-clip-text text-transparent">
              KineticAge
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-semibold transition-colors duration-200 py-2 border-b-2 hover:text-brand-600 ${
                  activeSection === item.id 
                    ? 'text-brand-600 border-brand-600 font-bold' 
                    : 'text-slate-500 border-transparent'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Desktop Sign In Button */}
          <div className="hidden md:block">
            <Link
              to="/login"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/10 hover:shadow-brand-600/20"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-brand-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-4 shadow-xl">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-brand-50 text-brand-600 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="block text-center bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 rounded-xl transition-all"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-white py-16 md:py-24 border-b border-slate-100 overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-6">
            <span className="bg-brand-50 text-brand-700 font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Care & Session Management
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Empowering Better Care Through{' '}
              <span className="text-brand-600 bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
                Smart Session Management
              </span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-xl">
              A centralized platform that helps wellness centers manage clients, subscriptions, therapy sessions, payments, and progress reports efficiently.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-center px-8 py-3.5 rounded-xl shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 transition-all text-sm"
              >
                Get Started
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-center px-8 py-3.5 rounded-xl transition-all text-sm"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Right */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-100/40 to-teal-100/40 rounded-full blur-3xl -z-10 scale-95"></div>
            {/* Styled Illustration mockup panel */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">SESSION GRAPH</span>
                <span className="w-2.5 h-2.5 bg-teal-500 rounded-full"></span>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded-lg w-3/4"></div>
                <div className="h-8 bg-brand-50 border-l-4 border-brand-600 rounded-r-lg flex items-center px-3 justify-between">
                  <div className="h-2 bg-brand-600 rounded-lg w-1/2"></div>
                  <span className="text-[10px] font-bold text-brand-600">80% MOBILITY</span>
                </div>
                <div className="h-8 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg flex items-center px-3 justify-between">
                  <div className="h-2 bg-teal-500 rounded-lg w-2/3"></div>
                  <span className="text-[10px] font-bold text-teal-600">COMPLETED</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-lg w-5/6"></div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <div className="flex-1 text-center">
                  <span className="block text-xl font-bold text-brand-600">48</span>
                  <span className="text-[10px] text-slate-450 uppercase">Clients</span>
                </div>
                <div className="w-px bg-slate-100"></div>
                <div className="flex-1 text-center">
                  <span className="block text-xl font-bold text-teal-650">96%</span>
                  <span className="text-[10px] text-slate-450 uppercase">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Overview Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-brand-600 font-bold text-xs uppercase tracking-wider">Features Overview</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Management Made Simple
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Explore the robust feature modules tailored specifically for KineticAge wellness, senior recovery, and mobility centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div key={feat.title} className="bg-white border border-slate-100 hover:border-brand-500/20 hover:shadow-xl rounded-2xl p-6 space-y-4 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${feat.color}`}>
                    <IconComp className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{feat.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Advantages Section */}
      <section id="advantages" className="bg-white py-16 md:py-24 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Core Advantages</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Choose Our Management System?
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Designed from the ground up to support senior care providers, delivering efficiency and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((adv) => {
              const IconComp = adv.icon;
              return (
                <div key={adv.title} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-center space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{adv.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{adv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About the Platform Section */}
      <section id="about" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-indigo-600 font-bold text-xs uppercase tracking-wider">About the Platform</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Centralized Senior Wellness Infrastructure
            </h2>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
                This platform is built for wellness and mobility centers that serve senior citizens. It helps staff manage clients, subscriptions, daily therapy sessions, payment records, and monthly progress reports from one centralized dashboard.
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                By organizing daily workflow components, clinics can focus more on patient interaction, physical therapy diagnostics, and program customization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-400 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Streamline Your Mobility Clinics?
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed max-w-lg mx-auto">
            Join KineticAge today and see how digital session logging, payment splitting, and automated summaries can elevate your patient experience.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="bg-white hover:bg-slate-100 text-brand-700 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl text-sm"
            >
              Access Platform Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-extrabold text-white text-lg tracking-tight">
              KineticAge – Session & Subscription Management System
            </span>
            <p className="text-xs text-slate-500">Built for the Software Engineer Internship Assignment</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-650">&copy; {currentYear} KineticAge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
