// ===== Developer 2: Projects =====
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = edit
  const [form, setForm] = useState({ title: '', description: '' });

  async function load() {
    try {
      const data = await api('/api/projects');
      setProjects(data.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openModal(project = null) {
    setForm(project ? { title: project.title, description: project.description } : { title: '', description: '' });
    setEditing(project || {});
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    try {
      if (editing.id) {
        await api(`/api/projects/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await api('/api/projects', { method: 'POST', body: form });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}" and all its tasks?`)) return;
    await api(`/api/projects/${project.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Capstone, portfolio, group work</p>
        </div>
        <button
          onClick={() => openModal()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New project
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-slate-400">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-500">No projects yet. Create your first one to start organizing tasks.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">{project.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {project.description || 'No description'}
              </p>
              <p className="mt-3 text-xs font-medium text-indigo-600">
                {project.taskCount} task{project.taskCount === 1 ? '' : 's'}
              </p>
              <div className="mt-4 flex gap-3 text-xs font-medium">
                <Link to={`/board?projectId=${project.id}`} className="text-indigo-600 hover:underline">
                  View board
                </Link>
                <button onClick={() => openModal(project)} className="text-slate-500 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(project)} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing.id ? 'Edit project' : 'New project'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Capstone Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows="3"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="What is this project about?"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {editing.id ? 'Save changes' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
