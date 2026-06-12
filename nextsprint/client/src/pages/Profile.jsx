// ===== Developer 1: Student profile =====
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    currentModule: user?.currentModule || 1,
    github: user?.github || '',
    portfolio: user?.portfolio || '',
    resumeStatus: user?.resumeStatus || 'not-started',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/users/me', { method: 'PUT', body: form });
      setUser(data.user);
      setMessage('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Original: border-slate-300, focus:border-indigo-500, focus:ring-indigo-500
  const inputClass =
    'mt-1 w-full rounded-md border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white';

  // Original return: <div className="max-w-xl"> with no background, indigo button
  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-teal-600 via-cyan-500 to-teal-400 p-8">
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-teal-100">Your progress and career links in one place</p>

        {message && <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>}
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 space-y-4 rounded-xl bg-white/90 backdrop-blur-sm p-6 shadow-lg border border-teal-100">
          <div>
            <label className="block text-sm font-medium text-teal-800">Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-teal-800">Current module</label>
            <input
              type="number"
              min="1"
              value={form.currentModule}
              onChange={(e) => update('currentModule', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-teal-800">GitHub link</label>
            <input value={form.github} onChange={(e) => update('github', e.target.value)} className={inputClass} placeholder="https://github.com/username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-teal-800">Portfolio link</label>
            <input value={form.portfolio} onChange={(e) => update('portfolio', e.target.value)} className={inputClass} placeholder="https://yoursite.dev" />
          </div>
          <div>
            <label className="block text-sm font-medium text-teal-800">Resume status</label>
            <select
              value={form.resumeStatus}
              onChange={(e) => update('resumeStatus', e.target.value)}
              className={inputClass}
            >
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          {/* Original: bg-indigo-600 hover:bg-indigo-700 */}
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
