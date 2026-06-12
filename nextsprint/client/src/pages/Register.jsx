// ===== Developer 1: Register (OTP passwordless auth) =====
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendEmail() {
    setError('');
    if (!email || !email.trim()) {
      setError('Email is required');
      return;
    }
    setBusy(true);
    try {
      await sendOTP(email.trim());
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(codeVal = code) {
    setError('');
    if (!codeVal || !codeVal.trim()) {
      setError('Verification code is required');
      return;
    }
    setBusy(true);
    try {
      await verifyOTP(email.trim(), codeVal.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCodeChange(val) {
    const clean = val.replace(/[^\d-]/g, '');
    let formatted = clean;
    
    if (clean.length > 3 && !clean.includes('-')) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    
    const finalVal = formatted.slice(0, 7);
    setCode(finalVal);

    if (finalVal.length === 7) {
      handleVerifyCode(finalVal);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 'email' ? 'One dashboard for everything' : 'Verify your signup code'}
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {step === 'email' ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
                disabled={busy}
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={busy}
              className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? 'Sending code…' : 'Send Verification Code'}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Verification Code (sent to <span className="font-semibold">{email}</span>)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                className="mt-1 w-full text-center tracking-widest rounded-md border border-slate-300 px-3 py-2 text-lg font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="123-456"
                disabled={busy}
              />
            </div>
            <button
              onClick={() => handleVerifyCode()}
              disabled={busy}
              className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify Code'}
            </button>

            <div className="flex justify-between items-center mt-6 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="hover:underline text-indigo-600"
                disabled={busy}
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="hover:underline text-indigo-600"
                disabled={busy}
              >
                Resend Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
