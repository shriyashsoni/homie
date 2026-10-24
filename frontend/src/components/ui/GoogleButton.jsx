import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-17Z" />
      <path fill="#FBBC05" d="M10.4 28.3a14.5 14.5 0 0 1 0-8.6l-7.9-6.1a24 24 0 0 0 0 20.8l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.4-4.6 2.2-7.9 2.2-6.3 0-11.7-3.7-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export default function GoogleButton({ label = 'Continue with Google' }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onClick = async () => {
    setErr('');
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      if (u.isAdmin) navigate('/admin');
      else if (!u.profile) navigate('/onboarding/intent');
      else navigate('/dashboard');
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user dismissed the popup — not an error
      } else {
        setErr(e?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full h-12 flex items-center justify-center gap-2.5 border border-charcoal/12 bg-white rounded-xl text-sm font-bold text-charcoal hover:border-charcoal/25 hover:bg-sand/40 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <GoogleG />}
        {label}
      </button>
      {err && <p className="mt-2 text-xs text-brand-600 text-center">{err}</p>}
    </div>
  );
}
