import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wordmark, IconRoom, IconHandshake, IconKey, IconShield, IconCheck,
  IconArrowRight, IconStar,
} from '../../components/icons';
import { heroRoom, PEOPLE } from '../../assets/photos';
import GoogleButton from '../../components/ui/GoogleButton';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Enter a valid email'),
  phone:     z.string().optional(),
  password:  z.string().min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Needs an uppercase, lowercase & number'),
});

const INTENTS = [
  { value: 'FIND_ROOM',   Icon: IconRoom,      label: 'I need a room',      sub: 'Browse & connect' },
  { value: 'FIND_PEOPLE', Icon: IconHandshake, label: 'I need roommates',   sub: 'People first' },
  { value: 'FILL_ROOM',   Icon: IconKey,       label: 'I have a room',      sub: 'List & fill it' },
];

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-charcoal mb-2">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-brand-600">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full h-12 px-4 rounded-xl border bg-card text-sm text-charcoal placeholder-clay/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 ${err ? 'border-brand-400' : 'border-charcoal/12 hover:border-charcoal/25'}`;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPwd, setShowPwd]   = useState(false);
  const [serverError, setError] = useState('');
  const [intent, setIntent]     = useState(params.get('intent') || 'FIND_ROOM');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      await registerUser({ ...values, intent });
      navigate('/onboarding/intent');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">

      {/* ═══ Brand panel ═══ */}
      <div className="hidden lg:flex w-[44%] panel-dark relative overflow-hidden flex-col justify-between p-12">
        <Link to="/"><Wordmark className="text-2xl !text-white" /></Link>

        <div className="max-w-sm">
          <h2 className="font-display font-extrabold text-white text-4xl leading-[1.08] mb-4" style={{ textWrap: 'balance' }}>
            Join 2,400+ people finding their homie.
          </h2>
          <p className="text-white/50 text-base leading-relaxed mb-8">
            Create your free profile, take the lifestyle quiz, and start matching with compatible rooms and roommates across Bengaluru.
          </p>

          {/* Real-photo preview */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-elevated mb-6">
            <img src={heroRoom(700, 420)} alt="A bright room in Bengaluru" className="w-full h-40 object-cover" />
          </div>

          <figure>
            <div className="flex gap-0.5 mb-3 text-honey">
              {Array(5).fill(0).map((_, i) => <IconStar key={i} size={14} />)}
            </div>
            <blockquote className="text-white/80 text-sm leading-relaxed mb-3">
              "The quiz matched me with someone on a 91% lifestyle fit. Best flatmate decision I've made."
            </blockquote>
            <figcaption className="flex items-center gap-2.5">
              <img src={PEOPLE.rahul.img} alt={PEOPLE.rahul.name} className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="text-white text-xs font-bold">{PEOPLE.rahul.name}</p>
                <p className="text-white/40 text-[11px]">{PEOPLE.rahul.role} · {PEOPLE.rahul.area}</p>
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="flex items-center gap-5 text-white/30 text-xs">
          <span className="flex items-center gap-1.5"><IconCheck size={13} className="text-olive" /> Free forever</span>
          <span className="flex items-center gap-1.5"><IconCheck size={13} className="text-olive" /> Private by default</span>
        </div>
      </div>

      {/* ═══ Form panel ═══ */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="lg:hidden block mb-8"><Wordmark className="text-xl" /></Link>

          <h1 className="font-display font-bold text-3xl text-charcoal mb-2">Create your account</h1>
          <p className="text-clay text-sm mb-6">Free to join. Takes under a minute.</p>

          <GoogleButton label="Sign up with Google" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full rule-t" /></div>
            <div className="relative flex justify-center"><span className="bg-cream px-3 text-xs text-clay">or with email</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl px-4 py-3 text-sm">
                <IconShield size={16} className="flex-shrink-0 mt-0.5" /> {serverError}
              </div>
            )}

            {/* Intent */}
            <div>
              <label className="block text-sm font-bold text-charcoal mb-2">What brings you here?</label>
              <div className="grid grid-cols-3 gap-2">
                {INTENTS.map(({ value, Icon, label, sub }) => {
                  const active = intent === value;
                  return (
                    <button key={value} type="button" onClick={() => setIntent(value)}
                      className={`p-3 rounded-2xl border text-center transition-all duration-150 ${active ? 'border-brand-500 bg-brand-50' : 'border-charcoal/12 hover:border-charcoal/25 bg-card'}`}>
                      <div className={`w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center ${active ? 'bg-brand-500 text-white' : 'bg-sand text-clay'}`}>
                        <Icon size={16} stroke={1.8} />
                      </div>
                      <p className={`text-xs font-bold leading-tight ${active ? 'text-brand-700' : 'text-charcoal'}`}>{label}</p>
                      <p className="text-2xs text-clay mt-0.5">{sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.firstName?.message}>
                <input placeholder="Priya" className={inputCls(errors.firstName)} {...register('firstName')} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input placeholder="Sharma" className={inputCls(errors.lastName)} {...register('lastName')} />
              </Field>
            </div>

            <Field label="Email address" error={errors.email?.message}>
              <input type="email" placeholder="you@example.com" className={inputCls(errors.email)} {...register('email')} />
            </Field>

            <Field label="Phone number (optional)" error={errors.phone?.message}>
              <input type="tel" placeholder="+91 98765 43210" className={inputCls(errors.phone)} {...register('phone')} />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 chars, 1 uppercase & number"
                  className={`${inputCls(errors.password)} pr-11`} {...register('password')} />
                <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay hover:text-charcoal transition-colors">
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-charcoal text-white text-sm font-bold rounded-full hover:bg-ink transition-all active:scale-[0.98] disabled:opacity-60">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Create account <IconArrowRight size={15} /></>}
            </button>

            <p className="text-2xs text-clay leading-relaxed text-center">
              By signing up you agree to our <a href="#" className="font-semibold text-charcoal/70">Terms</a> and{' '}
              <a href="#" className="font-semibold text-charcoal/70">Privacy Policy</a>. Private by default.
            </p>
          </form>

          <p className="text-center text-sm text-clay mt-6 pt-6 rule-t">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
