import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

// ─── RED: define the fetch wrapper contract ───────────────────────────────

describe('api()', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a GET request and returns parsed JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, db: 'sqlite' }),
    });

    const data = await api('/api/health');
    expect(data.ok).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('does NOT attach Authorization header when localStorage has no token', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await api('/api/health');

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('attaches Bearer token from localStorage', async () => {
    localStorage.setItem('token', 'my-test-token');
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await api('/api/projects');

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('sends body as JSON for POST', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'x', user: {} }) });

    await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'pass' },
    });

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ email: 'a@b.com', password: 'pass' }));
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('throws with the server error message on non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'No token provided' }),
    });

    await expect(api('/api/projects')).rejects.toThrow('No token provided');
  });

  it('throws a fallback message when server returns no error field', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(api('/api/projects')).rejects.toThrow('Request failed (500)');
  });
});
