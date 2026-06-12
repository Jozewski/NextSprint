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

    return handler.reply({ path, method, options });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const currentUser = {
  id: 3,
  name: 'Jacqueline Delgado',
  email: 'jacqueline@nextsprint.dev',
  currentModule: 4,
  github: '',
  portfolio: '',
  resumeStatus: 'in-progress',
};

const messages = [
  {
    id: 1,
    body: 'Repo is up - branch from main, PRs only',
    author: { id: 1, name: 'Joanne Liszewski', initials: 'JL' },
    mentions: [],
    createdAt: '2026-06-11T15:41:00.000Z',
  },
  {
    id: 2,
    body: 'Auth routes green, JWT middleware exported',
    author: { id: 2, name: 'Phil Adams', initials: 'PA' },
    mentions: [],
    createdAt: '2026-06-11T15:44:00.000Z',
  },
];

function mockShellData(extraHandlers = []) {
  return mockFetch([
    {
      method: 'GET',
      path: '/api/users/me',
      reply: ({ options }) => {
        expect(options.headers.Authorization).toBe('Bearer existing-token');
        return jsonResponse({ user: currentUser });
      },
    },
    {
      method: 'GET',
      path: '/api/stats',
      reply: () =>
        jsonResponse({
          tasksCompleted: 0,
          tasksRemaining: 0,
          tasksDueToday: 0,
          projectsActive: 0,
          weeklyCompleted: 0,
          currentModule: currentUser.currentModule,
        }),
    },
    {
      method: 'GET',
      path: '/api/tasks',
      reply: () => jsonResponse({ tasks: [] }),
    },
    ...extraHandlers,
  ]);
}

describe('Chat sidebar integration', () => {
  it('does not expose team chat before a user is logged in', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/login');

    expect(screen.queryByRole('heading', { name: /team chat/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/message the team/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads shared teammate messages in the sidebar for a logged-in user over REST', async () => {
    localStorage.setItem('token', 'existing-token');
    const WebSocketMock = vi.fn();
    vi.stubGlobal('WebSocket', WebSocketMock);
    const calls = [];

    mockShellData([
      {
        method: 'GET',
        path: '/api/chat/messages',
        reply: ({ options }) => {
          calls.push({
            path: '/api/chat/messages',
            authorization: options.headers.Authorization,
          });
          return jsonResponse({ onlineCount: 4, messages });
        },
      },
    ]);

    renderApp('/');

    const chat = await screen.findByRole('region', { name: /team chat/i });
    expect(within(chat).getByRole('heading', { name: /team chat/i })).toBeInTheDocument();
    expect(within(chat).getByText('4 online')).toBeInTheDocument();
    expect(within(chat).getByText('Joanne Liszewski')).toBeInTheDocument();
    expect(within(chat).getByText('Phil Adams')).toBeInTheDocument();
    expect(within(chat).getByText(/Repo is up/)).toBeInTheDocument();
    expect(within(chat).getByText(/Auth routes green/)).toBeInTheDocument();
    expect(calls).toEqual([
      { path: '/api/chat/messages', authorization: 'Bearer existing-token' },
    ]);
    expect(WebSocketMock).not.toHaveBeenCalled();
  });

  it('renders API newest-first messages in classic chat order', async () => {
    localStorage.setItem('token', 'existing-token');
    const newestFirstMessages = [...messages].reverse();

    mockShellData([
      {
        method: 'GET',
        path: '/api/chat/messages',
        reply: () => jsonResponse({ onlineCount: 4, messages: newestFirstMessages }),
      },
    ]);

    renderApp('/');

    const chat = await screen.findByRole('region', { name: /team chat/i });
    const renderedMessages = within(chat).getAllByRole('article');

    expect(renderedMessages[0]).toHaveTextContent('Repo is up - branch from main, PRs only');
    expect(renderedMessages[1]).toHaveTextContent('Auth routes green, JWT middleware exported');
  });

  it('posts a chat message with parsed @mentions and renders the sent message', async () => {
    localStorage.setItem('token', 'existing-token');
    const postedBodies = [];
    const nextMessage = {
      id: 3,
      body: '@Phil I can review the task API next',
      author: { id: currentUser.id, name: currentUser.name, initials: 'JD' },
      mentions: [{ id: 2, name: 'Phil Adams', username: 'Phil' }],
      createdAt: '2026-06-11T15:45:00.000Z',
    };

    mockShellData([
      {
        method: 'GET',
        path: '/api/chat/messages',
        reply: () => jsonResponse({ onlineCount: 4, messages }),
      },
      {
        method: 'POST',
        path: '/api/chat/messages',
        reply: ({ options }) => {
          postedBodies.push(JSON.parse(options.body));
          expect(options.headers.Authorization).toBe('Bearer existing-token');
          return jsonResponse({ message: nextMessage }, true, 201);
        },
      },
    ]);

    renderApp('/');

    const chat = await screen.findByRole('region', { name: /team chat/i });
    await userEvent.type(
      within(chat).getByPlaceholderText(/message the team/i),
      '@Phil I can review the task API next'
    );
    await userEvent.click(within(chat).getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(within(chat).getByText('@Phil I can review the task API next')).toBeInTheDocument();
    });
    expect(postedBodies).toEqual([
      {
        body: '@Phil I can review the task API next',
        mentions: ['Phil'],
      },
    ]);
  });
});
