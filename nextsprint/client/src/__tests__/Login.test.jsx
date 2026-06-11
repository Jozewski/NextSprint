import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// ─── Mocks ────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── RED: define what the Login page must do ──────────────────────────────

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email, password fields and submit button', () => {
    render(<Login />, { wrapper: MemoryRouter });

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('has a link to the register page', () => {
    render(<Login />, { wrapper: MemoryRouter });

    const link = screen.getByRole('link', { name: /create an account/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('calls login() with the entered credentials on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'mypassword');
    });
  });

  it('navigates to / after successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows "Logging in…" while the request is in flight', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText('Logging in…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays the server error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('clears the error message on a new submission attempt', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));
    mockLogin.mockResolvedValueOnce(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => screen.getByText('Invalid email or password'));

    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });

  it('submits on Enter key in the password field', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass123{Enter}');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass123');
    });
  });
});
