import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

// ─── Mocks ────────────────────────────────────────────────────────────────

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── RED: define what Register must do ────────────────────────────────────

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, email, password fields and submit button', () => {
    render(<Register />, { wrapper: MemoryRouter });

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('has a link to the login page', () => {
    render(<Register />, { wrapper: MemoryRouter });

    const link = screen.getByRole('link', { name: /log in/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('shows a client-side error when password is under 6 chars (no API call)', async () => {
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), '123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register() with name, email, password on valid submit', async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Alice', 'alice@test.com', 'password123');
    });
  });

  it('navigates to / after successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bob@test.com');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows "Creating account…" and disables button while in flight', async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bob@test.com');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Creating account…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays a server error message on failed registration', async () => {
    mockRegister.mockRejectedValue(new Error('An account with that email already exists'));
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Charlie');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'dup@test.com');
    await userEvent.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('An account with that email already exists')).toBeInTheDocument();
    });
  });
});
