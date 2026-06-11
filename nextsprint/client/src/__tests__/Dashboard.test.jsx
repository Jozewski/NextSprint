import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// ─── Mock the api module ──────────────────────────────────────────────────

vi.mock('../api', () => ({ api: vi.fn() }));

import { api } from '../api';

const TODAY = new Date().toISOString().slice(0, 10);

const STATS = {
  tasksCompleted: 5,
  tasksRemaining: 3,
  tasksDueToday: 2,
  projectsActive: 4,
  weeklyCompleted: 2,
  currentModule: 5,
};

const TASKS = {
  tasks: [
    { id: 1, title: 'Task due today', dueDate: TODAY, status: 'todo' },
    { id: 2, title: 'Already done', dueDate: TODAY, status: 'complete' },
    { id: 3, title: 'Future task', dueDate: '2099-01-01', status: 'todo' },
  ],
};

// ─── RED: define what Dashboard must render ───────────────────────────────

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.mockImplementation((path) => {
      if (path === '/api/stats') return Promise.resolve(STATS);
      if (path === '/api/tasks') return Promise.resolve(TASKS);
      return Promise.reject(new Error(`Unexpected call to ${path}`));
    });
  });

  it('shows a loading state before data arrives', () => {
    api.mockImplementation(() => new Promise(() => {}));
    render(<Dashboard />, { wrapper: MemoryRouter });

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('renders all four stat cards with correct values', async () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // "Due today" appears in both the stat card and the section heading
    expect(screen.getAllByText('Due today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tasks remaining')).toBeInTheDocument();
    expect(screen.getByText('Active projects')).toBeInTheDocument();
    expect(screen.getByText('Current module')).toBeInTheDocument();

    // Stat values rendered in the cards
    expect(screen.getByText('2')).toBeInTheDocument(); // tasksDueToday
    expect(screen.getByText('3')).toBeInTheDocument(); // tasksRemaining
    expect(screen.getByText('4')).toBeInTheDocument(); // projectsActive
  });

  it('shows only non-complete tasks due today in the due-today list', async () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => screen.getByText('Task due today'));

    expect(screen.getByText('Task due today')).toBeInTheDocument();
    expect(screen.queryByText('Already done')).not.toBeInTheDocument();
    expect(screen.queryByText('Future task')).not.toBeInTheDocument();
  });

  it('shows "Nothing due today" when the list is empty', async () => {
    api.mockImplementation((path) => {
      if (path === '/api/stats') return Promise.resolve(STATS);
      if (path === '/api/tasks') return Promise.resolve({ tasks: [] });
    });
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/nothing due today/i)).toBeInTheDocument();
    });
  });

  it('calls PUT /api/tasks/:id with status complete when "Mark complete" is clicked', async () => {
    api.mockImplementation((path) => {
      if (path === '/api/stats') return Promise.resolve(STATS);
      if (path === '/api/tasks') return Promise.resolve(TASKS);
      return Promise.resolve({});
    });
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => screen.getByText('Task due today'));

    const markBtn = screen.getByRole('button', { name: /mark complete/i });
    await userEvent.click(markBtn);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'PUT',
        body: { status: 'complete' },
      });
    });
  });

  it('renders weekly progress percentage', async () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => screen.getByText('Progress'));

    // 5 complete / (5+3) total = Math.round(62.5) = 63%
    expect(screen.getByText('63%')).toBeInTheDocument();
  });

  it('shows an error message when the API call fails', async () => {
    api.mockRejectedValue(new Error('Network error'));
    render(<Dashboard />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
