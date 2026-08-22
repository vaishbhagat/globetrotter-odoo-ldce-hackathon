import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Globe, ArrowRight, Loader2, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

type Tab = 'login' | 'signup' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=80',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1400&q=80',
];

function InputField({
  icon: Icon,
  error,
  label,
  id,
  type = 'text',
  placeholder,
  rightElement,
  ...rest
}: {
  icon: React.ElementType;
  error?: string;
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  rightElement?: React.ReactNode;
  [k: string]: any;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-500" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={cn(
            'input pl-10',
            error && 'border-dusty-400 focus:border-dusty-400 focus:ring-dusty-100',
            rightElement && 'pr-10'
          )}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-dusty-500 font-medium">{error}</p>}
    </div>
  );
}

export function AuthPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imgIndex] = useState(() => Math.floor(Math.random() * HERO_IMAGES.length));

  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex bg-linen-100">
      {/* Left: Editorial Hero */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${HERO_IMAGES[imgIndex]})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Globe size={18} className="text-white" />
            </div>
            <span className="font-serif text-xl font-semibold text-white">GlobeTrotter</span>
          </div>
          <div className="space-y-4">
            <p className="section-label text-white/50">Your intelligent travel companion</p>
            <h1 className="font-serif text-5xl font-bold text-white leading-[1.1]">
              Plan journeys<br />
              worth<br />
              <span className="text-terracotta-300">remembering.</span>
            </h1>
            <p className="text-white/60 text-base max-w-sm leading-relaxed">
              Build multi-city itineraries, track budgets, collaborate with travellers,
              and discover the world—all in one beautifully crafted platform.
            </p>
            <div className="flex items-center gap-6 pt-4">
              {['12,000+ Destinations', 'Smart Budgeting', 'Easy Sharing'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-terracotta-300" />
                  <span className="text-white/70 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-terracotta-gradient flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span className="font-serif text-xl font-semibold text-ink-200">GlobeTrotter</span>
        </div>

        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex bg-sand-200 rounded-xl p-1 mb-8">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                id={`auth-tab-${t}`}
                onClick={() => { setTab(t); setAuthError(''); setSuccessMsg(''); }}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                  tab === t
                    ? 'bg-white text-ink-200 shadow-warm-sm'
                    : 'text-sand-500 hover:text-ink-50'
                )}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {tab === 'forgot' && (
            <button
              onClick={() => { setTab('login'); setAuthError(''); setSuccessMsg(''); }}
              className="flex items-center gap-1.5 text-sm text-sand-500 hover:text-terracotta-500 mb-6 transition-colors"
            >
              ← Back to Sign In
            </button>
          )}

          {tab === 'login' && <LoginForm onForgot={() => { setTab('forgot'); setAuthError(''); }} />}
          {tab === 'signup' && <SignupForm />}
          {tab === 'forgot' && <ForgotForm />}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (err) setError(err.message);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-slide-up space-y-5">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-bold text-ink-200">Welcome back</h2>
        <p className="text-sm text-sand-500 mt-1">Sign in to continue your journey</p>
      </div>

      {error && (
        <div className="p-3.5 bg-dusty-50 border border-dusty-100 rounded-lg text-dusty-600 text-sm font-medium">
          {error}
        </div>
      )}

      <InputField
        id="login-email"
        label="Email address"
        icon={Mail}
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <InputField
        id="login-password"
        label="Password"
        icon={Lock}
        type={showPass ? 'text' : 'password'}
        placeholder="••••••••"
        error={errors.password?.message}
        rightElement={
          <button type="button" onClick={() => setShowPass(!showPass)} className="text-sand-400 hover:text-ink-50 transition-colors">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        {...register('password')}
      />

      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-xs text-terracotta-500 hover:text-terracotta-600 font-medium transition-colors">
          Forgot password?
        </button>
      </div>

      <button type="submit" id="login-submit-btn" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

function SignupForm() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName, avatar_url: null } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Account created! Check your email to confirm your account.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-slide-up space-y-4">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-bold text-ink-200">Start your journey</h2>
        <p className="text-sm text-sand-500 mt-1">Create a free GlobeTrotter account</p>
      </div>

      {error && (
        <div className="p-3.5 bg-dusty-50 border border-dusty-100 rounded-lg text-dusty-600 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-sage-50 border border-sage-100 rounded-lg text-sage-700 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <InputField id="signup-name" label="Full name" icon={User} placeholder="Jane Doe" error={errors.fullName?.message} {...register('fullName')} />
      <InputField id="signup-email" label="Email address" icon={Mail} type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <InputField
        id="signup-password" label="Password" icon={Lock}
        type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
        error={errors.password?.message}
        rightElement={
          <button type="button" onClick={() => setShowPass(!showPass)} className="text-sand-400 hover:text-ink-50 transition-colors">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        {...register('password')}
      />
      <InputField
        id="signup-confirm-password" label="Confirm password" icon={Lock}
        type={showConfirmPass ? 'text' : 'password'} placeholder="Repeat password"
        error={errors.confirmPassword?.message}
        rightElement={
          <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-sand-400 hover:text-ink-50 transition-colors">
            {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        {...register('confirmPassword')}
      />

      <button type="submit" id="signup-submit-btn" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-xs text-sand-400 leading-relaxed">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}

function ForgotForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess('Password reset link sent! Check your email.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-slide-up space-y-5">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-bold text-ink-200">Reset password</h2>
        <p className="text-sm text-sand-500 mt-1">We'll send a reset link to your inbox</p>
      </div>
      {error && <div className="p-3.5 bg-dusty-50 border border-dusty-100 rounded-lg text-dusty-600 text-sm">{error}</div>}
      {success && (
        <div className="p-3.5 bg-sage-50 border border-sage-100 rounded-lg text-sage-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      <InputField id="forgot-email" label="Email address" icon={Mail} type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <button type="submit" id="forgot-submit-btn" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
