// ===== Developer 1: Login (OTP passwordless auth) =====
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Fixed page-line widths so render stays stable
const PAGE_LINES = [88, 72, 94, 62, 80, 68, 85];

function AnimatedBook({ open }) {
  return (
    <>
      <style>{`
        .book-scene {
          perspective: 900px;
          width: 140px;
          height: 170px;
        }
        /* Gentle float while waiting for login */
        @keyframes book-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        .book-float {
          animation: book-float 3s ease-in-out infinite;
        }
        .book-open .book-float {
          animation: none;
        }

        /* ── Book body ── */
        .book-body {
          position: relative;
          width: 140px;
          height: 170px;
          transform-style: preserve-3d;
        }

        /* Pages revealed once cover flips */
        .book-pages {
          position: absolute;
          left: 14px;
          top: 0;
          width: 122px;
          height: 170px;
          background: linear-gradient(to right, #f5ede0, #fffdf8);
          border-radius: 0 6px 6px 0;
          border: 1px solid #e0d4bf;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
        }
        .page-line {
          height: 3px;
          background: #c9bfa6;
          border-radius: 2px;
          opacity: 0;
          transform: scaleX(0.4);
          transition: opacity 0.25s ease, transform 0.3s ease;
        }
        .book-open .page-line {
          opacity: 1;
          transform: scaleX(1);
        }

        /* Spine */
        .book-spine {
          position: absolute;
          left: 0;
          top: 0;
          width: 14px;
          height: 170px;
          background: linear-gradient(to right, #312e81, #3730a3);
          border-radius: 3px 0 0 3px;
          z-index: 2;
          box-shadow: inset -2px 0 4px rgba(0,0,0,0.25);
        }

        /* Front cover — rotates around spine on open */
        .book-cover {
          position: absolute;
          left: 0;
          top: 0;
          width: 140px;
          height: 170px;
          background: linear-gradient(145deg, #4f46e5, #6366f1, #818cf8);
          border-radius: 3px 6px 6px 3px;
          transform-origin: left center;
          transform: rotateY(0deg);
          transition: transform 0.85s cubic-bezier(0.645, 0.045, 0.355, 1);
          transform-style: preserve-3d;
          z-index: 3;
          box-shadow: 5px 5px 18px rgba(0,0,0,0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .book-open .book-cover {
          transform: rotateY(-172deg);
        }

        /* Cover front face content */
        .cover-front {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          backface-visibility: hidden;
        }
        .cover-emblem {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(251,191,36,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .cover-title {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-align: center;
          line-height: 1.4;
          text-transform: uppercase;
        }
        .cover-rule {
          width: 50px;
          height: 1px;
          background: rgba(251,191,36,0.5);
        }

        /* Inside back cover (shows when flipped) */
        .cover-back {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #3730a3, #4338ca);
          border-radius: 3px 6px 6px 3px;
          backface-visibility: hidden;
          transform: rotateY(180deg);
        }
      `}</style>

      <div className={`book-scene ${open ? 'book-open' : ''}`}>
        <div className={`book-float`}>
          <div className="book-body">
            {/* Pages behind the cover */}
            <div className="book-pages">
              {PAGE_LINES.map((w, i) => (
                <div
                  key={i}
                  className="page-line"
                  style={{ width: `${w}%`, transitionDelay: `${0.52 + i * 0.05}s` }}
                />
              ))}
            </div>

            {/* Spine */}
            <div className="book-spine" />

            {/* Front cover */}
            <div className="book-cover">
              <div className="cover-front">
                <div className="cover-emblem">📚</div>
                <div className="cover-rule" />
                <div className="cover-title">Next{'\n'}Sprint</div>
              </div>
              <div className="cover-back" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Login() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

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
      setBookOpen(true);                        // trigger book-open animation
      setTimeout(() => navigate('/'), 950);     // navigate after animation
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function handleCodeChange(val) {
    // Strip everything except digits and hyphen
    const clean = val.replace(/[^\d-]/g, '');
    let formatted = clean;
    
    // Auto insert hyphen if user typed raw digits
    if (clean.length > 3 && !clean.includes('-')) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    
    // Limit to 7 characters (e.g. 123-456)
    const finalVal = formatted.slice(0, 7);
    setCode(finalVal);

    // Auto verify if code is complete
    if (finalVal.length === 7) {
      handleVerifyCode(finalVal);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">

        {/* Animated book sits above the form */}
        <div className="flex justify-center mb-6">
          <AnimatedBook open={bookOpen} />
        </div>

        <h1 className="text-center text-2xl font-bold text-slate-900">
          Next<span className="text-orange-500">Sprint</span>
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {step === 'email' ? 'Log in or sign up to your dashboard' : 'Verify your login code'}
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="you@example.com"
                disabled={busy}
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={busy}
              className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {busy ? 'Sending code…' : 'Send Verification Code'}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              New here?{' '}
              <Link to="/register" className="font-medium text-orange-500 hover:underline">
                Create an account
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
                className="mt-1 w-full text-center tracking-widest rounded-md border border-slate-300 px-3 py-2 text-lg font-bold focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="123-456"
                disabled={busy}
              />
            </div>
            <button
              onClick={() => handleVerifyCode()}
              disabled={busy}
              className="w-full rounded-md bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
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
                className="hover:underline text-orange-500"
                disabled={busy}
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="hover:underline text-orange-500"
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
