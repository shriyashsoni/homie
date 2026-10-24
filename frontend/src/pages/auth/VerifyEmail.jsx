import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '../../api/auth.api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-3xl font-black text-brand-500 tracking-tight mb-8">homie</div>
        <div className="card p-8">
          {status === 'loading' && (
            <div className="py-8">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-clay">Verifying your email…</p>
            </div>
          )}
          {status === 'success' && (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-charcoal mb-2">Email verified!</h3>
              <p className="text-sm text-clay mb-5">Your account is now fully verified.</p>
              <Link to="/dashboard" className="btn-primary inline-block">Go to dashboard</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-600" />
              </div>
              <h3 className="font-bold text-charcoal mb-2">Link invalid or expired</h3>
              <p className="text-sm text-clay mb-5">This verification link is no longer valid. Sign in and request a new one.</p>
              <Link to="/login" className="btn-primary inline-block">Sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
