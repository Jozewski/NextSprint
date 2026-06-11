import { describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('api', () => {
  it('sends JSON requests to the backend with the stored bearer token', async () => {
    localStorage.setItem('token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ project: { id: 1, title: 'Capstone' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api('/api/projects', {
        method: 'POST',
        body: { title: 'Capstone', description: 'Final project' },
      })
    ).resolves.toEqual({ project: { id: 1, title: 'Capstone' } });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({ title: 'Capstone', description: 'Final project' }),
    });
  });

  it('throws backend error messages for failed responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid email or password' }),
      })
    );

    await expect(api('/api/auth/login', { method: 'POST' })).rejects.toThrow(
      'Invalid email or password'
    );
  });
});
