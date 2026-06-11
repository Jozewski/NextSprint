import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from './test/renderApp';

function jsonResponse(body, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetch(handlers) {
  const fetchMock = vi.fn((url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method || 'GET';
    const handler = handlers.find((candidate) => {
      const pathMatches =
        typeof candidate.path === 'string'
          ? candidate.path === path
          : candidate.path.test(path);
      return candidate.method === method && pathMatches;
    });

    if (!handler) {
      return jsonResponse({ error: `No mock for ${method} ${path}` }, false, 500);
    }

    return handler.reply({ url, path, method, options });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const user = {
  id: 1,
  name: 'Test Student',
  email: 'student@nextsprint.dev',
  currentModule: 2,
  github: '',
  portfolio: '',
  resumeStatus: 'not-started',
};

describe('App frontend/backend integration', () => {
  it('registers through the auth API, stores the token, and loads dashboard data', async () => {
    const calls = [];
    mockFetch([
      {
        method: 'POST',
        path: '/api/auth/register',
        reply: ({ options }) => {
          calls.push({ path: '/api/auth/register', body: JSON.parse(options.body) });
          return jsonResponse({ token: 'new-token', user }, true, 201);
        },
      },
      {
        method: 'GET',
        path: '/api/stats',
        reply: ({ options }) => {
          calls.push({
            path: '/api/stats',
            authorization: options.headers.Authorization,
          });
          return jsonResponse({
            tasksCompleted: 1,
            tasksRemaining: 2,
            tasksDueToday: 0,
            projectsActive: 1,
            weeklyCompleted: 1,
            currentModule: 2,
          });
        },
      },
      {
        method: 'GET',
        path: '/api/tasks',
        reply: ({ options }) => {
          calls.push({
            path: '/api/tasks',
            authorization: options.headers.Authorization,
          });
          return jsonResponse({ tasks: [] });
        },
      },
    ]);

    renderApp('/register');

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Test Student');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'student@nextsprint.dev');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(calls).toEqual([
      {
        path: '/api/auth/register',
        body: {
          name: 'Test Student',
          email: 'student@nextsprint.dev',
          password: 'password123',
        },
      },
      { path: '/api/stats', authorization: 'Bearer new-token' },
      { path: '/api/tasks', authorization: 'Bearer new-token' },
    ]);
  });

  it('loads projects from the API and posts new projects in backend contract shape', async () => {
    localStorage.setItem('token', 'existing-token');
    let projects = [];
    const postedBodies = [];

    mockFetch([
      {
        method: 'GET',
        path: '/api/users/me',
        reply: ({ options }) => {
          expect(options.headers.Authorization).toBe('Bearer existing-token');
          return jsonResponse({ user });
        },
      },
      {
        method: 'GET',
        path: '/api/projects',
        reply: () => jsonResponse({ projects }),
      },
      {
        method: 'POST',
        path: '/api/projects',
        reply: ({ options }) => {
          postedBodies.push(JSON.parse(options.body));
          projects = [
            {
              id: 1,
              title: 'Capstone',
              description: 'Final bootcamp project',
              taskCount: 0,
              createdAt: '2026-06-11 12:00:00',
            },
          ];
          return jsonResponse({ project: projects[0] }, true, 201);
        },
      },
    ]);

    renderApp('/projects');

    expect(await screen.findByText(/No projects yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    await userEvent.type(screen.getByPlaceholderText('Capstone Project'), 'Capstone');
    await userEvent.type(
      screen.getByPlaceholderText('What is this project about?'),
      'Final bootcamp project'
    );
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    expect(await screen.findByRole('heading', { name: 'Capstone' })).toBeInTheDocument();
    expect(screen.getByText('0 tasks')).toBeInTheDocument();
    expect(postedBodies).toEqual([
      { title: 'Capstone', description: 'Final bootcamp project' },
    ]);
  });

  it('loads board data and posts new tasks with camelCase fields expected by the API', async () => {
    localStorage.setItem('token', 'existing-token');
    const project = {
      id: 7,
      title: 'Capstone',
      description: '',
      taskCount: 0,
      createdAt: '2026-06-11 12:00:00',
    };
    let tasks = [];
    const postedBodies = [];

    mockFetch([
      {
        method: 'GET',
        path: '/api/users/me',
        reply: () => jsonResponse({ user }),
      },
      {
        method: 'GET',
        path: '/api/tasks',
        reply: () => jsonResponse({ tasks }),
      },
      {
        method: 'GET',
        path: '/api/projects',
        reply: () => jsonResponse({ projects: [project] }),
      },
      {
        method: 'POST',
        path: '/api/tasks',
        reply: ({ options }) => {
          const body = JSON.parse(options.body);
          postedBodies.push(body);
          tasks = [
            {
              id: 10,
              title: body.title,
              description: body.description,
              status: body.status,
              priority: body.priority,
              category: body.category,
              dueDate: body.dueDate,
              projectId: body.projectId,
              completedAt: null,
              createdAt: '2026-06-11 12:00:00',
            },
          ];
          return jsonResponse({ task: tasks[0] }, true, 201);
        },
      },
    ]);

    renderApp('/board');

    expect(await screen.findByRole('heading', { name: 'Board' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));

    const dialog = screen.getByRole('heading', { name: 'New task' }).closest('div');
    await userEvent.type(screen.getByPlaceholderText('Finish React assignment'), 'Write integration tests');
    const selects = within(dialog).getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], 'career');
    await userEvent.selectOptions(selects[1], 'high');
    await userEvent.selectOptions(selects[2], 'review');
    await userEvent.selectOptions(selects[3], String(project.id));
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText('Write integration tests')).toBeInTheDocument();
    });
    expect(postedBodies).toEqual([
      {
        title: 'Write integration tests',
        description: '',
        status: 'review',
        priority: 'high',
        category: 'career',
        dueDate: null,
        projectId: project.id,
      },
    ]);
  });
});
