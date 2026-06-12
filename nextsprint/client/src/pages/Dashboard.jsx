// ===== Developer 4: Dashboard =====
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function StatCard({ label, value, accent = 'text-slate-900', border = 'border-slate-200' }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-md border-2 ${border}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dueToday, setDueToday] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [statsData, tasksData] = await Promise.all([
        api('/api/stats'),
        api('/api/tasks'),
      ]);
      setStats(statsData);
      const today = new Date().toISOString().slice(0, 10);
      setDueToday(
        tasksData.tasks.filter((t) => t.dueDate === today && t.status !== 'complete')
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markComplete(task) {
    await api(`/api/tasks/${task.id}`, { method: 'PUT', body: { status: 'complete' } });
    load();
  }

  if (error) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (!stats) {
    return <p className="text-slate-400">Loading dashboard…</p>;
  }

  const total = stats.tasksCompleted + stats.tasksRemaining;
  const pct = total ? Math.round((stats.tasksCompleted / total) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Everything in one place</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Due today" value={stats.tasksDueToday} accent="text-red-600" border="border-teal-400" />
        <StatCard label="Tasks remaining" value={stats.tasksRemaining} border="border-blue-300" />
        <StatCard label="Active projects" value={stats.projectsActive} border="border-green-400" />
        <StatCard label="Current module" value={stats.currentModule} accent="text-indigo-600" border="border-yellow-400" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly progress */}
        <div className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-300">
          <h2 className="font-semibold text-slate-900">Progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            {stats.tasksCompleted} of {total} tasks complete · {stats.weeklyCompleted} finished this week
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-medium text-indigo-600">{pct}%</p>
        </div>

        {/* Due today */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Due today</h2>
          {dueToday.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Nothing due today. <Link to="/board" className="text-indigo-600 hover:underline">Open the board</Link> to plan ahead.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {dueToday.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{task.title}</span>
                  <button
                    onClick={() => markComplete(task)}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Mark complete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
