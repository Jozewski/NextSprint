// ===== Developer 3: Kanban board with drag-and-drop =====
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'complete', label: 'Complete' },
];

// Category colors are the differentiator vs a generic Trello clone
const CATEGORY_STYLES = {
  coursework: 'bg-sky-100 text-sky-700',
  career: 'bg-amber-100 text-amber-700',
  mentorship: 'bg-violet-100 text-violet-700',
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState(null); // null = closed, {} = new, {id} = edit
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState('');
  const projectFilter = searchParams.get('projectId') || '';

  async function load() {
    try {
      const [tasksData, projectsData] = await Promise.all([
        api('/api/tasks'),
        api('/api/projects'),
      ]);
      setTasks(tasksData.tasks);
      setProjects(projectsData.projects);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!projectFilter || String(t.projectId) === projectFilter) &&
          (!categoryFilter || t.category === categoryFilter)
      ),
    [tasks, projectFilter, categoryFilter]
  );

  async function handleDragEnd(result) {
    const { destination, draggableId } = result;
    if (!destination) return;

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update — snap the card into place immediately
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await api(`/api/tasks/${taskId}`, { method: 'PUT', body: { status: newStatus } });
    } catch (err) {
      setTasks(previous); // roll back on failure
      setError(err.message);
    }
  }

  async function handleSave(form) {
    try {
      if (modalTask?.id) {
        await api(`/api/tasks/${modalTask.id}`, { method: 'PUT', body: form });
      } else {
        await api('/api/tasks', { method: 'POST', body: form });
      }
      setModalTask(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
    setModalTask(null);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Board</h1>
          <p className="mt-1 text-sm text-slate-500">Drag tasks between columns</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) =>
              setSearchParams(e.target.value ? { projectId: e.target.value } : {})
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            <option value="coursework">Coursework</option>
            <option value="career">Career</option>
            <option value="mentorship">Mentorship</option>
          </select>
          <button
            onClick={() => setModalTask({})}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            New task
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="mt-6 grid min-w-[900px] grid-cols-5 gap-4">
          {COLUMNS.map((column) => {
            const columnTasks = visibleTasks.filter((t) => t.status === column.id);
            return (
              <div key={column.id} className="rounded-xl bg-slate-100 p-3">
                <h2 className="flex items-center justify-between px-1 text-sm font-semibold text-slate-700">
                  {column.label}
                  <span className="text-xs font-normal text-slate-400">{columnTasks.length}</span>
                </h2>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`mt-2 min-h-[120px] space-y-2 rounded-lg p-1 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setModalTask(task)}
                              className={`cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-400' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-slate-800">{task.title}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_STYLES[task.category]}`}>
                                  {task.category}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[task.priority]}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.dueDate && (
                                <p className="mt-2 text-[11px] text-slate-400">Due {task.dueDate}</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {modalTask !== null && (
        <TaskModal
          task={modalTask.id ? modalTask : null}
          projects={projects}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalTask(null)}
        />
      )}
    </div>
  );
}
