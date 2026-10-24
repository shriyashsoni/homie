import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wordmark, LogoImage, IconShield, IconCheck, IconArrowRight, IconStar, IconSpark,
} from '../../components/icons';
import GoogleButton from '../../components/ui/GoogleButton';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/* ─── Mini match preview for the brand panel ─── */
function MiniMatch() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.14em]">Your top match</span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-brand-300">
          <IconShield size={11} /> Verified
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-extrabold text-sm">AN</div>
        <div className="flex-1">
          <p className="text-white font-display font-extrabold text-sm leading-tight">Ananya N.</p>
          <p className="text-white/40 text-xs">Product Designer · Koramangala</p>
        </div>
        <div className="text-right">
          <p className="font-display font-extrabold text-brand-300 text-lg leading-none">94%</p>
          <p className="text-white/30 text-[10px]">match</p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd]       = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values.email, values.password);
      if (user.isAdmin) navigate('/admin');
      else if (!user.profile) navigate('/onboarding/intent');
      else navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Incorrect email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">

      {/* ═══ Brand panel ═══ */}
      <div className="hidden lg:flex w-[46%] panel-dark grain relative overflow-hidden flex-col justify-between p-12">
        <div className="relative">
          <Link to="/" className="flex items-center">
            <span className="font-display font-bold text-2xl text-white lowercase tracking-[-0.02em]">homie</span>
          </Link>
        </div>

        <div className="relative max-w-sm">
          <h2 className="font-display font-extrabold text-white text-4xl leading-[1.08] mb-4" style={{ textWrap: 'balance' }}>
            Your person is<br />already here.
          </h2>
          <p className="text-white/50 text-base leading-relaxed mb-8">
            Sign back in to see new matches, messages and viewing requests waiting for you.
          </p>
          <MiniMatch />
          <p className="text-white/30 text-[11px] mt-3">An example of how a match appears once you're signed in.</p>

          {/* Why it works — no fabricated claims */}
          <ul className="mt-9 space-y-3">
            {[
              'Matched on lifestyle, not just budget and location',
              'Your private answers stay private until you share them',
              'FMH never collects rent, deposit or brokerage',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-white/70 text-sm">
                <IconCheck size={16} className="text-olive flex-shrink-0 mt-0.5" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-5 text-white/30 text-xs">
          <span className="flex items-center gap-1.5"><IconShield size={13} className="text-olive" /> Compatibility is guidance, not a guarantee</span>
        </div>
      </div>

      {/* ═══ Form panel ═══ */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center mb-10">
            <Wordmark className="text-xl" />
          </Link>

          <h1 className="font-display font-extrabold text-3xl text-charcoal mb-2">Welcome back</h1>
          <p className="text-clay text-sm mb-6">Sign in to your homie account to continue.</p>

          <GoogleButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full rule-t" /></div>
            <div className="relative flex justify-center"><span className="bg-cream px-3 text-xs text-clay">or with email</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {serverError && (
              <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl px-4 py-3 text-sm">
                <IconShield size={16} className="flex-shrink-0 mt-0.5" />
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-charcoal mb-2">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full h-12 px-4 rounded-xl border bg-white text-sm text-charcoal placeholder-clay/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${errors.email ? 'border-brand-400' : 'border-black/10 hover:border-black/20'}`}
                {...register('email')}
              />
              {errors.email && <p className="mt-1.5 text-xs text-brand-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-charcoal">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-brand-500 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  className={`w-full h-12 px-4 pr-11 rounded-xl border bg-white text-sm text-charcoal placeholder-clay/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${errors.password ? 'border-brand-400' : 'border-black/10 hover:border-black/20'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay hover:text-charcoal transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-brand-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-charcoal text-white text-sm font-bold rounded-xl hover:bg-ink transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <IconArrowRight size={15} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center"><div className="w-full rule-t" /></div>
            <div className="relative flex justify-center"><span className="bg-cream px-3 text-xs text-clay">New to homie?</span></div>
          </div>

          <Link
            to="/register"
            className="w-full h-12 flex items-center justify-center gap-2 border border-black/10 bg-white text-charcoal text-sm font-bold rounded-xl hover:border-brand-400 hover:text-brand-500 transition-all"
          >
            <IconSpark size={15} /> Create a free account
          </Link>

          <p className="text-center text-xs text-clay mt-8 leading-relaxed">
            By signing in you agree to our{' '}
            <a href="#" className="font-semibold text-charcoal/70 hover:text-charcoal">Terms</a> and{' '}
            <a href="#" className="font-semibold text-charcoal/70 hover:text-charcoal">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
