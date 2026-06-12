import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

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

describe('Register page - OTP Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and email input field', () => {
    render(<Register />, { wrapper: MemoryRouter });

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('At least 6 characters')).not.toBeInTheDocument();
  });

  it('handles signup OTP requests and routes to verification step', async () => {
    mockSendOTP.mockResolvedValue(undefined);
    render(<Register />, { wrapper: MemoryRouter });

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'newuser@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(mockSendOTP).toHaveBeenCalledWith('newuser@test.com');
    });

    expect(screen.getByPlaceholderText('123-456')).toBeInTheDocument();
  });
});
