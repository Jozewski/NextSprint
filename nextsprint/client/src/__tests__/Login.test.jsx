import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mocks
const mockSendOTP = vi.fn();
const mockVerifyOTP = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    sendOTP: mockSendOTP,
    verifyOTP: mockVerifyOTP,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login page - OTP Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and send code button in the first step', () => {
    render(<Login />, { wrapper: MemoryRouter });

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('••••••')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });

  it('calls sendOTP and transitions to verification step upon submission', async () => {
    mockSendOTP.mockResolvedValue(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(mockSendOTP).toHaveBeenCalledWith('user@test.com');
    });

    // Check that we transitioned to the code entry step
    expect(screen.getByPlaceholderText('123-456')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify code/i })).toBeInTheDocument();
  });

  it('calls verifyOTP when entering a valid 6-digit code', async () => {
    mockSendOTP.mockResolvedValue(undefined);
    mockVerifyOTP.mockResolvedValue(undefined);
    render(<Login />, { wrapper: MemoryRouter });

    // Move to step 2
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send verification code/i }));
    await waitFor(() => screen.getByPlaceholderText('123-456'));

    // Enter code (auto-submits)
    await userEvent.type(screen.getByPlaceholderText('123-456'), '147-546');

    await waitFor(() => {
      expect(mockVerifyOTP).toHaveBeenCalledWith('user@test.com', '147-546');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays the error message on failed OTP request or verification', async () => {
    mockSendOTP.mockRejectedValue(new Error('Please enter a valid email address'));
    render(<Login />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });
});
